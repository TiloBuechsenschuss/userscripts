// ==UserScript==
// @name         KoL Charpane Buttons
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/charpane-heal.js
// @version      1.3
// @description  Adds a small "heal" button next to the HP line in the charpane. Clicking it repeatedly casts your heal skills (configured below by priority) until HP is full or no skill can raise it any further. Heal skills are matched by name against the skills page (no hardcoded skill ids) and cast via runskillz.php; the per-cast result is judged purely by whether HP actually went up, so it copes with out-of-MP, cooldowns and varying heal amounts. Also adds a small "max" button next to every prolongable (up-arrow) buff whose skill is actually castable right now, which casts that buff as many times as your current MP allows (the per-cast MP cost is measured live, by casting once and reading the MP delta, so it stays correct under cost reductions from gear/effects), plus a "refresh skills" button below the buff list that re-checks the skills page so a skill learned or lost mid-session is picked up without a new tab. Both features read the same skills page, once, from one cache.
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every KoL script and runs
  // them on the union of all matched pages. Guard charpane.php explicitly, or
  // addButton()'s body-top fallback would drop a stray "heal" button onto pages
  // with no HP line (main, mining, ...). A no-op for the standalone install,
  // whose @match already scopes it to charpane.php.
  if (!/\/charpane\.php/i.test(location.pathname)) return;

  // This script runs INSIDE the charpane frame, so `document` is the sidebar
  // and same-origin fetches to api.php / the skills form work directly.
  //
  // Design mirrors TwilightHeroes/header-heal.js: a configurable, priority-
  // ordered list of heal skills matched against the skills page *by name*, so
  // there are no hardcoded skill ids -- each id is scraped from the page's
  // `whichskill=<id>` icon links, and the pwd hash comes from api.php. Casts go
  // to runskillz.php (ajax=1). Unlike the TH version we don't track MP
  // cost at all -- after each cast we re-read HP and judge the cast purely by
  // whether HP went up. That naturally handles heal-to-full skills, per-cast
  // heals, out-of-MP, and once-per-day cooldowns without special cases.
  //
  // This file holds TWO charpane features, because they read the same page:
  //
  //   1. the "heal" button by the HP line (below), and
  //   2. the "max" button next to each prolongable buff (further down).
  //
  // Both need to know what the skills page lists, so there is exactly one
  // fetchSkillsDoc() and one sessionStorage cache of it, and one scrape of it
  // (buildSkillMap) that the heal half reads ids out of and the max half reads
  // names out of. These were two scripts and had drifted into two copies of
  // that; keep it one. Each half owns its own idempotency guard, so one being
  // absent from a given charpane (no HP icon, no prolongable buffs) never
  // suppresses the other. Note the KoL counterpart to
  // TwilightHeroes/skills-cast-max.js lives here now, not under that name.

  // ---------------------------------------------------------------------------
  // Configuration: the heal skills to consider, highest priority first.
  //
  //   name     - matched against the START of a skill's <option> text in the
  //              skills form (case-insensitive), e.g. "Cannelloni Cocoon".
  //   priority - lower numbers are tried first. Each pass, skills are tried in
  //              priority order until one actually raises HP; then we start over
  //              from the top. When no skill raises HP, we stop.
  //
  // Listing a skill you don't own is harmless -- it just won't be found in the
  // form. Adjust this list to whatever heals your class/path actually has.
  // ---------------------------------------------------------------------------
  const HEAL_SKILLS = [
    { name: 'Cannelloni Cocoon', priority: 1 }, // Sauceror: heals to full
    { name: 'Lasagna Bandages', priority: 2 },
    { name: 'Tongue of the Walrus', priority: 3 }, // Seal Clubber: large heal
    { name: 'Disco Power Nap', priority: 4 },
    { name: 'Disco Nap', priority: 5 },
    { name: 'Saucy Salve', priority: 6 }, // cheap top-up
  ];

  // Hard cap on total heal casts so a misread (HP that never reaches max) can't
  // loop forever firing requests.
  const MAX_CASTS = 60;

  // How many single casts the "max" loop fallback will attempt before giving
  // up, in case MP can't be read (so it can't run away firing requests forever).
  const LOOP_CAST_CAP = 60;

  // Pages that may host the skill list. KoL renders each usable skill as an
  // icon whose link/onclick references the skill id via `whichskill=<id>`
  // (e.g. desc_skill.php?whichskill=3012). The skill name comes from the icon's
  // title/alt. We probe these pages in order and use the first that contains
  // such references -- so the ids come straight from the page, never hardcoded.
  const SKILL_PAGE_CANDIDATES = ['skillz.php', 'skills.php'];

  // The fetched skills page is cached for the session so the frequent charpane
  // reloads (every adventure) don't re-hit the server -- what it lists only
  // changes when you learn/forget a skill, which the refresh button forces.
  const CACHE_KEY = 'tm-skills-cast-max-html';

  const ORIGIN = location.origin;

  // --- stat reading -----------------------------------------------------------

  // api.php is KoL's canonical status endpoint and returns JSON with hp/maxhp/
  // mp/maxmp (and pwd). We use it instead of scraping the charpane DOM because
  // the live DOM is stale right after a background cast, and the JSON is exact.
  async function getStatus() {
    const res = await fetch(ORIGIN + '/api.php?what=status&for=charpane-heal', {
      credentials: 'same-origin', cache: 'no-store',
    });
    if (!res.ok) throw new Error('api.php returned HTTP ' + res.status);
    const j = await res.json();
    const num = v => parseInt(String(v).replace(/,/g, ''), 10);
    return {
      hp: { cur: num(j.hp), max: num(j.maxhp) },
      mp: { cur: num(j.mp), max: num(j.maxmp) },
      pwd: j.pwd, // password hash, needed to POST/GET the skill cast
    };
  }

  // --- skills page scraping & casting ----------------------------------------

  // Fetch + parse the first candidate page that actually lists skills (contains
  // any `whichskill=<id>` reference). Returns a Document or null. Caches the raw
  // HTML in sessionStorage so repeated charpane reloads don't re-fetch, and so
  // the heal half and the max half share one round trip.
  async function fetchSkillsDoc() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return new DOMParser().parseFromString(cached, 'text/html');
    } catch (e) { /* sessionStorage may be unavailable; fetch fresh */ }
    for (const path of SKILL_PAGE_CANDIDATES) {
      try {
        const res = await fetch(ORIGIN + '/' + path, { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) continue;
        const html = await res.text();
        if (!/whichskill=\d+/.test(html)) continue;
        try { sessionStorage.setItem(CACHE_KEY, html); } catch (e) { /* ignore */ }
        return new DOMParser().parseFromString(html, 'text/html');
      } catch (e) { /* try the next candidate */ }
    }
    return null;
  }

  // Build a list of { name (lowercased), id } from the skills page. Each usable
  // skill icon links/onclicks to `...whichskill=<id>...` and carries the skill
  // name in the icon's title/alt (or link text). The id is read from the page,
  // so we never hardcode skill ids. A legacy <select name="whichskill"> is also
  // honoured if present, for resilience across KoL skin changes.
  function buildSkillMap(doc) {
    const map = [];
    const seen = new Set();
    const add = (name, id) => {
      name = (name || '').trim().toLowerCase();
      if (!name) return;
      const key = name + '|' + id;
      if (seen.has(key)) return;
      seen.add(key);
      map.push({ name, id: String(id) });
    };

    for (const el of doc.querySelectorAll('[href*="whichskill="], [onclick*="whichskill="]')) {
      const ref = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('onclick') || '');
      const m = ref.match(/whichskill=(\d+)/);
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      const name = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || el.textContent;
      add(name, m ? m[1] : null);
    }

    for (const select of doc.querySelectorAll('select[name="whichskill"]')) {
      for (const opt of select.options) add(opt.textContent, opt.value);
    }

    return map;
  }

  // Resolve a configured skill name to its id by prefix-matching the page's
  // skill names (case-insensitive), mirroring the original by-name behaviour.
  // An entry with no readable id can't be cast by id, so it's skipped here --
  // it still counts as castable for the max buttons, which cast by href.
  function findSkillId(skillMap, name) {
    const target = name.trim().toLowerCase();
    const hit = skillMap.find(s => s.id && s.name.startsWith(target));
    return hit ? hit.id : null;
  }

  // The max half's view of the same scrape: just the castable names.
  function skillNameSet(skillMap) {
    return new Set(skillMap.map(s => s.name));
  }

  // Cast a skill once via runskillz.php with ajax=1 so it fires without
  // rendering a full page. The pwd hash comes from api.php (see getStatus).
  async function castOnce(id, pwd) {
    const params = new URLSearchParams({
      action: 'Skillz', whichskill: id, quantity: '1', ajax: '1',
    });
    if (pwd) params.set('pwd', pwd);
    await fetch(ORIGIN + '/runskillz.php?' + params.toString(), {
      credentials: 'same-origin', cache: 'no-store',
    });
  }

  // --- main loop --------------------------------------------------------------

  let running = false;

  async function runHeal(btn) {
    if (running) return;
    running = true;
    setBusy(btn, true, '…');

    try {
      let status = await getStatus();
      if (!status.hp.max) { alert('Heal: could not read your HP.'); return; }
      if (status.hp.cur >= status.hp.max) { return; } // already full

      // Discover each configured skill's id once; ids don't change between casts.
      const doc = await fetchSkillsDoc();
      if (!doc) { alert('Heal: could not find the skills page.'); return; }
      const skillMap = buildSkillMap(doc);
      const skills = HEAL_SKILLS
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map(s => {
          const id = findSkillId(skillMap, s.name);
          return id ? Object.assign({}, s, { id }) : null;
        })
        .filter(Boolean);

      if (!skills.length) {
        alert('Heal: none of the configured heal skills were found.');
        return;
      }

      let casts = 0;
      // Each outer pass: try skills in priority order until one raises HP, then
      // restart from the top. Stop when HP is full, nothing helped, or we hit
      // the cast cap.
      while (status.hp.cur < status.hp.max && casts < MAX_CASTS) {
        let progressed = false;
        for (const skill of skills) {
          if (status.hp.cur >= status.hp.max || casts >= MAX_CASTS) break;
          casts++;
          setBusy(btn, true, 'heal ' + casts);
          await castOnce(skill.id, status.pwd);
          const after = await getStatus();
          if (after.hp.cur > status.hp.cur) {
            status = after;
            progressed = true;
            break; // restart from highest priority
          }
          status = after; // cast didn't help; try the next, cheaper skill
        }
        if (!progressed) break; // no skill could raise HP -> done
      }
    } catch (e) {
      alert('Heal failed: ' + (e && e.message ? e.message : e));
    } finally {
      running = false;
      // Refresh the visible charpane so HP/MP reflect what we cast.
      reload();
    }
  }

  // --- button -----------------------------------------------------------------

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.style.opacity = busy ? '0.5' : '1';
    btn.style.cursor = busy ? 'default' : 'pointer';
    btn.textContent = label;
  }

  // Shared by both halves: after casting anything, the visible charpane is
  // stale, so refresh it.
  function reload() {
    window.location.reload();
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = 'tm-charpane-heal';
    btn.type = 'button';
    btn.textContent = 'heal';
    btn.title = 'Cast heal skills until HP is full or none can raise it';
    btn.style.cssText = [
      'margin-left:3px',
      'padding:0 3px',
      'font-size:8px',
      'font-family:arial,helvetica,sans-serif',
      'line-height:11px',
      'height:13px',
      'vertical-align:middle',
      'cursor:pointer',
      'border:1px solid #888',
      'border-radius:2px',
      'background:#eee',
      'white-space:nowrap',
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      runHeal(btn);
    });
    return btn;
  }

  // Place the button in the HP cell -- the <td> holding the hp.gif icon, whose
  // text reads "<cur> / <max>". Fall back to the body top if not found.
  function addButton() {
    // Idempotency: a previous run may already have inserted the button.
    if (document.getElementById('tm-charpane-heal')) return;

    const btn = makeButton();
    const imgs = document.getElementsByTagName('img');
    for (let i = 0; i < imgs.length; i++) {
      if (!/hp\.gif/i.test(imgs[i].getAttribute('src') || '')) continue;
      const td = imgs[i].closest ? imgs[i].closest('td') : imgs[i].parentNode;
      if (td) { td.appendChild(btn); return; }
    }
    document.body.insertBefore(btn, document.body.firstChild);
  }

  // ===========================================================================
  // The "max" button on each prolongable buff
  // ===========================================================================
  //
  // Each prolongable buff is an `<a class="upeffect" href="upeffect.php?efid=
  // ...&qty=1&pwd=HASH">` carrying its own pwd hash. We reuse that href rather
  // than rebuilding it, so we never have to hunt for the pwd ourselves. The
  // existing charpane code already multi-casts by swapping `qty=1` -> `qty=N`
  // and appending `&ajax=1`; we do the same.

  // ---------------------------------------------------------------------------
  // MP reading
  // ---------------------------------------------------------------------------

  // Read current MP as a number (or null) by finding the cell with the mp.gif
  // icon, whose text reads "<cur> / <max>". `root` is any document/element to
  // scan: the live charpane, or a parsed re-fetch of it.
  function readMpFrom(root) {
    const imgs = root.getElementsByTagName('img');
    for (let i = 0; i < imgs.length; i++) {
      const src = imgs[i].getAttribute('src') || '';
      if (!/mp\.gif/i.test(src)) continue;
      const td = imgs[i].closest ? imgs[i].closest('td') : imgs[i].parentNode;
      const host = td || imgs[i].parentNode;
      if (!host) continue;
      // \s matches the &nbsp; KoL puts around the "/"; textContent (live DOM or
      // a parsed document) exposes it as a real char, so this parses cleanly.
      const m = (host.textContent || '').match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (m) return parseInt(m[1].replace(/,/g, ''), 10);
    }
    return null;
  }

  // Fresh MP read by re-fetching the charpane and parsing it with the same
  // logic that works on the live DOM. We use this (not api.php) because the
  // live DOM is stale right after a background ajax cast, and charpane.php is
  // the canonical source we already know how to read. Returns a number/null.
  function readMpFresh() {
    return fetch('charpane.php', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        if (!html) return null;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return readMpFrom(doc);
      })
      .catch(function () { return null; });
  }

  // Is `skill` (the name read off the charpane up-arrow) castable per the set
  // scraped from skillz.php? Exact match first, then a tolerant prefix match in
  // either direction, since a skill's name and its effect-arrow label can differ
  // slightly in punctuation/length.
  function isCastable(set, skill) {
    const s = (skill || '').trim().toLowerCase();
    if (!s) return false;
    if (set.has(s)) return true;
    for (const n of set) {
      if (n.startsWith(s) || s.startsWith(n)) return true;
    }
    return false;
  }
  // ---------------------------------------------------------------------------
  // casting
  // ---------------------------------------------------------------------------

  // Cast a buff `n` times via its up-arrow href. Resolves with the response
  // text so the caller can detect KoL's "no|<reason>" failure format.
  function cast(href, n) {
    const url = href.replace('qty=1', 'qty=' + n) +
      (href.indexOf('ajax=') === -1 ? '&ajax=1' : '');
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.text(); });
  }

  // KoL signals a failed cast with a response beginning "no|<reason>".
  function failureReason(text) {
    const m = (text || '').match(/^\s*no\|([^|]*)/i);
    return m ? m[1].trim() : null;
  }
  // Fallback used when the MP delta can't be measured: just keep casting once
  // at a time until KoL refuses (out of MP / at the cap), then refresh. Capped
  // so a parsing problem can't fire requests endlessly.
  function loopCast(href, name, left) {
    if (left <= 0) { reload(); return; }
    cast(href, 1).then(function (out) {
      if (failureReason(out)) { reload(); return; }
      loopCast(href, name, left - 1);
    }).catch(function () { reload(); });
  }

  // Cast `name` (via `href`) as many times as current MP allows. We don't know
  // the player's *effective* per-cast cost up front (gear/effects discount it),
  // so we cast once, measure the MP drop, then cast floor(remaining / cost)
  // more in a single request. Total casts == floor(startMp / cost) = the max
  // affordable. Refreshes the charpane when done.
  function castMax(btn, href, name) {
    const original = btn.textContent;
    setBusy(btn, true, '…');

    const startMp = readMpFrom(document);

    // Probe cast: one cast tells us the real per-cast MP cost.
    cast(href, 1).then(function (out) {
      const reason = failureReason(out);
      if (reason) {
        // Already maxed, out of MP for even one, etc. Reflect new state.
        alert('Cast max (' + name + '): ' + reason + '.');
        reload();
        return;
      }

      readMpFresh().then(function (mpAfter) {
        // If we couldn't read MP before and/or after, we can't compute the
        // cost -- fall back to casting one at a time until KoL refuses.
        if (startMp == null || mpAfter == null) {
          loopCast(href, name, LOOP_CAST_CAP);
          return;
        }
        const cost = startMp - mpAfter;
        if (cost <= 0) {
          // Free cast, or MP moved unexpectedly; cast-till-refused instead.
          loopCast(href, name, LOOP_CAST_CAP);
          return;
        }
        const more = Math.floor(mpAfter / cost);
        if (more <= 0) { reload(); return; }
        cast(href, more).then(reload).catch(reload);
      });
    }).catch(function (err) {
      console.error('Cast max: cast failed.', err);
      alert('Cast max: the cast request failed (see console).');
      setBusy(btn, false, original);
    });
  }
  // ---------------------------------------------------------------------------
  // buttons
  // ---------------------------------------------------------------------------

  function makeMaxButton(href, name) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tm-cast-max';
    btn.textContent = 'max';
    btn.title = 'Cast ' + name + ' as many times as your MP allows';
    btn.style.cssText = [
      'margin-left:2px',
      'padding:0 3px',
      'font-size:8px',
      'font-family:arial,helvetica,sans-serif',
      'line-height:11px',
      'height:13px',
      'vertical-align:middle',
      'cursor:pointer',
      'border:1px solid #888',
      'border-radius:2px',
      'background:#eee',
      'white-space:nowrap'
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      castMax(btn, href, name);
    });
    return btn;
  }

  // A "refresh skills" button placed below the buff list. Clears the cached
  // skillz.php, drops every max button, and re-enhances -- so a skill learned or
  // lost mid-session is reflected without opening a new tab. Anchored to the
  // table holding the buffs; no-op if there are no prolongable buffs to anchor.
  function addRefreshButton() {
    if (document.getElementById('tm-cast-max-refresh')) return;
    const anchor = document.querySelector('a.upeffect');
    const table = anchor && anchor.closest('table');
    if (!table || !table.parentNode) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'tm-cast-max-refresh';
    btn.textContent = '↻ refresh skills';
    btn.title = 'Re-check skillz.php for castable skills and rebuild the max buttons';
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:8px',
      'font-family:arial,helvetica,sans-serif',
      'line-height:13px',
      'height:15px',
      'cursor:pointer',
      'border:1px solid #888',
      'border-radius:2px',
      'background:#eee',
      'white-space:nowrap'
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      const original = btn.textContent;
      setBusy(btn, true, '…');
      try { sessionStorage.removeItem(CACHE_KEY); } catch (err) { /* ignore */ }
      for (const b of document.querySelectorAll('.tm-cast-max')) b.remove();
      for (const l of document.querySelectorAll('a.upeffect[data-tm-cast-max]')) {
        l.removeAttribute('data-tm-cast-max');
      }
      enhance().then(function () { setBusy(btn, false, original); });
    });

    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;margin:3px 0;';
    wrap.appendChild(btn);
    table.insertAdjacentElement('afterend', wrap);
  }
  // ---------------------------------------------------------------------------
  // enhance
  // ---------------------------------------------------------------------------

  // Item-granted buffs share the .upeffect / upeffect.php link with cast skills,
  // but their up-arrow tooltip reads "Click to use ..." instead of "Click to
  // cast ...". "Cast as many as MP allows" is meaningless for an item, so only
  // act on arrows whose tooltip says cast -- and the skill name itself is the
  // text after "cast", which we match against skillz.php. Returns the skill name
  // or null (item-use buff / no tooltip).
  function castSkillName(link) {
    const img = link.querySelector('img');
    const tip = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || '';
    const m = tip.match(/click to cast\s+(.+)/i);
    return m ? m[1].trim() : null;
  }

  async function enhance() {
    const links = document.querySelectorAll('a.upeffect');
    const pending = [];
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      // Idempotency: skip a link we've already processed this page load.
      if (link.getAttribute('data-tm-cast-max')) continue;
      const href = link.getAttribute('href');
      if (!href || href.indexOf('upeffect.php') === -1) continue;
      const skill = castSkillName(link);
      if (!skill) continue; // item-use buff, not a cast skill
      pending.push({ link: link, href: href, skill: skill });
    }
    if (!pending.length) { addRefreshButton(); return; }

    // Resolve castability against skillz.php. If it can't be fetched we don't
    // know what's castable, so fall back to the old behaviour (button on every
    // cast arrow) rather than silently dropping the feature on a transient error.
    const doc = await fetchSkillsDoc();
    const castable = doc ? skillNameSet(buildSkillMap(doc)) : null;

    for (const p of pending) {
      p.link.setAttribute('data-tm-cast-max', '1');
      if (castable && !isCastable(castable, p.skill)) continue;
      const name = p.link.getAttribute('rel') || p.skill || 'this buff';
      p.link.insertAdjacentElement('afterend', makeMaxButton(p.href, name));
    }
    addRefreshButton();
  }

  // TEST-SEAM
  addButton();
  enhance();
})();
