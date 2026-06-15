// ==UserScript==
// @name         KoL Charpane Heal Button
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/charpane-heal.js
// @version      1.1
// @description  Adds a small "heal" button next to the HP line in the charpane. Clicking it repeatedly casts your heal skills (configured below by priority) until HP is full or no skill can raise it any further. Heal skills are matched against the skills form by name (no hardcoded skill ids); the per-cast result is judged purely by whether HP actually went up, so it copes with out-of-MP, cooldowns and varying heal amounts.
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
  // ordered list of heal skills matched against the skills form *by name*, so
  // there are no hardcoded skill ids and the real submit URL + pwd hash come
  // straight from the scraped <form>. Unlike the TH version we don't track MP
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

  // Pages that may host the skill-casting <form> (a <select name="whichskill">).
  // KoL's exact skills URL has varied over time, so we probe in order and use
  // the first page that actually contains the select -- defensive scraping in
  // the spirit of the other scripts here. The form's own action/method/pwd are
  // then reused verbatim, so we never hardcode the cast endpoint.
  const SKILL_FORM_CANDIDATES = ['skillz.php', 'skills.php', 'runskillz.php'];

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
    };
  }

  // --- skills form scraping & casting ----------------------------------------

  // Fetch the first candidate page that contains a skill-casting select, and
  // return its parsed document.
  async function fetchSkillsDoc() {
    for (const path of SKILL_FORM_CANDIDATES) {
      try {
        const res = await fetch(ORIGIN + '/' + path, { credentials: 'same-origin' });
        if (!res.ok) continue;
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        if (doc.querySelector('select[name="whichskill"]')) {
          return { doc, path };
        }
      } catch (e) { /* try the next candidate */ }
    }
    return null;
  }

  // Find a skill's casting <form> + option value by name. The <option> value is
  // the skill id; we read it from the form rather than hardcoding it.
  function findSkillOption(doc, name) {
    const target = name.trim().toLowerCase();
    for (const select of doc.querySelectorAll('select[name="whichskill"]')) {
      for (const opt of select.options) {
        if (opt.textContent.trim().toLowerCase().startsWith(target)) {
          return { value: opt.value, form: select.form };
        }
      }
    }
    return null;
  }

  // Serialise a form the way a native submit would, applying overrides. Skips
  // buttons so we mirror a plain form.submit().
  function serializeForm(form, overrides) {
    const params = new URLSearchParams();
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      const type = (el.type || '').toLowerCase();
      if (['submit', 'button', 'reset', 'file', 'image'].includes(type)) continue;
      if ((type === 'checkbox' || type === 'radio') && !el.checked) continue;
      params.append(el.name, el.value);
    }
    for (const k in overrides) params.set(k, overrides[k]);
    return params;
  }

  // Cast a skill once. Uses the scraped form's own action/method (+ hidden pwd),
  // overriding the skill id, quantity=1 and ajax=1 so it fires without rendering
  // a full page.
  async function castOnce(basePath, form, value) {
    const params = serializeForm(form, { whichskill: value, quantity: '1', ajax: '1' });
    const method = (form.method || 'get').toLowerCase();
    const action = new URL(form.getAttribute('action') || basePath, ORIGIN + '/' + basePath).href;
    if (method === 'post') {
      await fetch(action, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } else {
      const url = action + (action.includes('?') ? '&' : '?') + params.toString();
      await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    }
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

      // Discover each configured skill's option value once; ids don't change
      // between casts.
      const found = await fetchSkillsDoc();
      if (!found) { alert('Heal: could not find the skills form.'); return; }
      const skills = HEAL_SKILLS
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map(s => {
          const opt = findSkillOption(found.doc, s.name);
          return opt ? Object.assign({}, s, opt) : null;
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
          await castOnce(found.path, skill.form, skill.value);
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
