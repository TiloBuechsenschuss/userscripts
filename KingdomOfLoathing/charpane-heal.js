// ==UserScript==
// @name         KoL Charpane Heal Button
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/charpane-heal.js
// @version      1.2
// @description  Adds a small "heal" button next to the HP line in the charpane. Clicking it repeatedly casts your heal skills (configured below by priority) until HP is full or no skill can raise it any further. Heal skills are matched by name against the skills page (no hardcoded skill ids) and cast via runskillz.php; the per-cast result is judged purely by whether HP actually went up, so it copes with out-of-MP, cooldowns and varying heal amounts.
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: all-in-one.js @requires every KoL script and runs
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

  // Hard cap on total casts so a misread (HP that never reaches max) can't loop
  // forever firing requests.
  const MAX_CASTS = 60;

  // Pages that may host the skill list. KoL renders each usable skill as an
  // icon whose link/onclick references the skill id via `whichskill=<id>`
  // (e.g. desc_skill.php?whichskill=3012). The skill name comes from the icon's
  // title/alt. We probe these pages in order and use the first that contains
  // such references -- so the ids come straight from the page, never hardcoded.
  const SKILL_PAGE_CANDIDATES = ['skillz.php', 'skills.php'];

  const ORIGIN = location.origin;

  // Idempotency: a previous run may already have inserted the button.
  if (document.getElementById('tm-charpane-heal')) return;

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

  // Fetch the first candidate page that lists skills (i.e. contains any
  // `whichskill=<id>` reference) and return its parsed document.
  async function fetchSkillsDoc() {
    for (const path of SKILL_PAGE_CANDIDATES) {
      try {
        const res = await fetch(ORIGIN + '/' + path, { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) continue;
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        if (/whichskill=\d+/.test(doc.documentElement.innerHTML)) return doc;
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
      if (!name || !id) return;
      const key = name + '|' + id;
      if (seen.has(key)) return;
      seen.add(key);
      map.push({ name, id: String(id) });
    };

    for (const el of doc.querySelectorAll('[href*="whichskill="], [onclick*="whichskill="]')) {
      const ref = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('onclick') || '');
      const m = ref.match(/whichskill=(\d+)/);
      if (!m) continue;
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      const name = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || el.textContent;
      add(name, m[1]);
    }

    for (const select of doc.querySelectorAll('select[name="whichskill"]')) {
      for (const opt of select.options) add(opt.textContent, opt.value);
    }

    return map;
  }

  // Resolve a configured skill name to its id by prefix-matching the page's
  // skill names (case-insensitive), mirroring the original by-name behaviour.
  function findSkillId(skillMap, name) {
    const target = name.trim().toLowerCase();
    const hit = skillMap.find(s => s.name.startsWith(target));
    return hit ? hit.id : null;
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
      window.location.reload();
    }
  }

  // --- button -----------------------------------------------------------------

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.style.opacity = busy ? '0.5' : '1';
    btn.style.cursor = busy ? 'default' : 'pointer';
    btn.textContent = label;
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
    const btn = makeButton();
    const imgs = document.getElementsByTagName('img');
    for (let i = 0; i < imgs.length; i++) {
      if (!/hp\.gif/i.test(imgs[i].getAttribute('src') || '')) continue;
      const td = imgs[i].closest ? imgs[i].closest('td') : imgs[i].parentNode;
      if (td) { td.appendChild(btn); return; }
    }
    document.body.insertBefore(btn, document.body.firstChild);
  }

  addButton();
})();
