// ==UserScript==
// @name         KoL Skills Cast Max
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/skills-cast-max.js
// @version      1.5
// @description  Adds a small "max" button next to every prolongable (up-arrow) buff in the charpane whose skill is actually castable right now. Castability is checked against skillz.php (mirroring the Twilight Heroes script), so buffs from skills you can't currently cast get no button. Clicking "max" casts that buff as many times as your current MP allows, then refreshes the charpane; the per-cast MP cost is measured live (cast once, read the MP delta) so it stays correct under MP-cost reductions from gear/effects. A "refresh skills" button below the buff list re-checks skillz.php so a skill learned/lost mid-session is picked up without a new tab.
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // This script runs INSIDE the charpane frame, so `document` is the sidebar,
  // MP can be read from it directly, and a refresh is just location.reload().
  //
  // Each prolongable buff is an `<a class="upeffect" href="upeffect.php?efid=
  // ...&qty=1&pwd=HASH">` carrying its own pwd hash. We reuse that href rather
  // than rebuilding it, so we never have to hunt for the pwd ourselves. The
  // existing charpane code already multi-casts by swapping `qty=1` -> `qty=N`
  // and appending `&ajax=1`; we do the same.

  // How many single casts the loop fallback will attempt before giving up, in
  // case MP can't be read (so it can't run away firing requests forever).
  const LOOP_CAST_CAP = 60;

  const ORIGIN = location.origin;

  // Pages that may host the skill list, in probe order. KoL renders each usable
  // skill as an icon whose link/onclick references `whichskill=<id>` and carries
  // the skill name in the icon title/alt; an unavailable skill simply isn't
  // listed. (Same source charpane-heal.js scrapes.)
  const SKILL_PAGE_CANDIDATES = ['skillz.php', 'skills.php'];

  // The parsed skillz.php is cached for the session so the frequent charpane
  // reloads (every adventure) don't re-hit the server -- the castable-skill set
  // only changes when you learn/forget a skill, which the refresh button forces.
  const CACHE_KEY = 'tm-skills-cast-max-html';

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

  // ---------------------------------------------------------------------------
  // skillz.php — which skills are castable right now
  // ---------------------------------------------------------------------------

  // Fetch + parse the first candidate page that actually lists skills (contains
  // any `whichskill=<id>` reference). Returns a Document or null. Caches the raw
  // HTML in sessionStorage so repeated charpane reloads don't re-fetch.
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

  // Build a Set of lowercased castable skill names from the skills page. Each
  // usable skill icon links/onclicks to `whichskill=<id>` and carries the name
  // in its img title/alt (or link text); a legacy <select name="whichskill"> is
  // also honoured for resilience across KoL skin changes.
  function buildSkillNameSet(doc) {
    const set = new Set();
    const add = function (name) {
      name = (name || '').trim().toLowerCase();
      if (name) set.add(name);
    };
    for (const el of doc.querySelectorAll('[href*="whichskill="], [onclick*="whichskill="]')) {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      const name = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || el.textContent;
      add(name);
    }
    for (const select of doc.querySelectorAll('select[name="whichskill"]')) {
      for (const opt of select.options) add(opt.textContent);
    }
    return set;
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

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.style.opacity = busy ? '0.5' : '1';
    btn.style.cursor = busy ? 'default' : 'pointer';
    btn.textContent = label;
  }

  function reload() {
    window.location.reload();
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
    const castable = doc ? buildSkillNameSet(doc) : null;

    for (const p of pending) {
      p.link.setAttribute('data-tm-cast-max', '1');
      if (castable && !isCastable(castable, p.skill)) continue;
      const name = p.link.getAttribute('rel') || p.skill || 'this buff';
      p.link.insertAdjacentElement('afterend', makeMaxButton(p.href, name));
    }
    addRefreshButton();
  }

  enhance();
})();
