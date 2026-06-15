// ==UserScript==
// @name         KoL Codpiece Button
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/codpiece.js
// @version      1.9
// @description  Adds a Codpiece button to the KoL icon menu (triggers inventory.php?action=docodpiece) and, on the Eternity Codpiece decoration screen, adds tools to set every gem slot at once and to save/load gem setups.
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // --- Configuration ---------------------------------------------------
  const ACTION_URL = '/inventory.php?action=docodpiece';
  const BUTTON_LABEL = 'Codpiece';
  // Eternity Codpiece item icon, inlined as a data URI so it needs no network
  // fetch (and isn't subject to a page CSP blocking external hosts). The source
  // GIF is kept in the repo at assets/eternitycod.gif for reference; this is its
  // base64. Shown as the button's face; falls back to BUTTON_LABEL text if it
  // somehow can't render.
  const ICON_URL =
    'data:image/gif;base64,R0lGODlhHgAeAIMAAAAAAAgICBQUFCEhITExMU5OTnNzc5ycnL2' +
    '9vc7OztbW1t7e3ufn5+/v7/f39////yH5BAAAAP8ALAAAAAAeAB4AAAT/8MlJq7046827/2Ao' +
    'juRzGInkWAXBaMrxOgIQEINgGIekAACBYtJIHI4DYOGBCB4KwCggOQUYGgdCLRrYMgiAXlPAS' +
    'CAMVEVAeoMCEA/wolZAQAWV1gM6MCAaDw1ACAtJCCdbAAQNBQJwA0tqAgsGAVdrUnAPCQZQBQ' +
    'dABAtWEgZWUAE/UwV1FaYHCjU8bz42TwgJQCkXpgUrElALE1A9DqAAuxYMdC8MAUsTY41AAoA' +
    'YYLZQQw0vuVIA0BgHieBMNQcN2M/oG8ZUPabluQEvIKBwCQMDmmsi9xdJrH1gAE5gDDADRhwY' +
    'cENLFEckFhTApAPBrxIOuF0swbGjx48fAiIAADs=';
  // If true, the result page is shown in the mainpane.
  // If false, the request fires silently in the background.
  const SHOW_RESULT_IN_MAINPANE = true;
  // ----------------------------------------------------------------------

  function getPwd() {
    // 1. awesomemenu has hidden <input name="pwd"> fields in its config forms.
    const inp = document.querySelector('input[name="pwd"]');
    if (inp && inp.value) return inp.value;

    // 2. Page globals (`pwdhash` or `pwd`), if defined globally.
    if (typeof window.pwdhash === 'string' && window.pwdhash.length > 0) {
      return window.pwdhash;
    }
    if (typeof window.pwd === 'string' && window.pwd.length > 0) {
      return window.pwd;
    }

    // 3. Any link in this frame carrying pwd=
    const link = document.querySelector('a[href*="pwd="]');
    if (link) {
      const m = link.getAttribute('href').match(/[?&]pwd=([0-9a-fA-F]+)/);
      if (m) return m[1];
    }

    // 4. The charpane usually defines pwdhash.
    try {
      const cp = top.frames['charpane'];
      if (cp && typeof cp.pwdhash === 'string' && cp.pwdhash.length > 0) {
        return cp.pwdhash;
      }
    } catch (e) { /* ignore */ }

    // 5. Inline script text (matches e.g. `var pwd = "...";`).
    const m2 = document.documentElement.innerHTML.match(
      /pwd(?:hash)?\s*=\s*["']([0-9a-fA-F]+)["']/
    );
    return m2 ? m2[1] : null;
  }

  function fireAction() {
    const pwd = getPwd();
    if (!pwd) {
      alert('Codpiece button: could not determine pwd hash.');
      return;
    }

    const url = ACTION_URL + '&pwd=' + pwd;

    if (SHOW_RESULT_IN_MAINPANE) {
      try {
        top.frames['mainpane'].location.href = url;
        return;
      } catch (e) {
        console.warn('Codpiece button: could not navigate mainpane, ' +
                     'falling back to background request.', e);
      }
    }

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        console.log('Codpiece action sent, HTTP ' + res.status);
      })
      .catch(function (err) {
        console.error('Codpiece action failed:', err);
      });
  }

  // Restore the original text-label look (used as the icon's fallback).
  function styleAsTextButton(btn) {
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:9px',
      'font-family:arial',
      'height:14px',
      'line-height:12px',
      'cursor:pointer',
      'white-space:nowrap'
    ].join(';');
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = 'tm-codpiece-btn';
    btn.type = 'button';
    btn.title = BUTTON_LABEL + ' (inventory.php?action=docodpiece)';
    btn.style.cssText = [
      'padding:1px 2px',
      'height:22px',
      'line-height:0',
      'cursor:pointer',
      'white-space:nowrap',
      'display:inline-flex',
      'align-items:center'
    ].join(';');

    const img = document.createElement('img');
    img.src = ICON_URL;
    img.alt = BUTTON_LABEL;
    img.width = 18;
    img.height = 18;
    img.style.display = 'block';
    // If the icon can't load, drop back to the plain text label so the button
    // is never blank.
    img.addEventListener('error', function () {
      if (img.parentNode === btn) btn.removeChild(img);
      btn.textContent = BUTTON_LABEL;
      styleAsTextButton(btn);
    });
    btn.appendChild(img);

    btn.addEventListener('click', fireAction);
    return btn;
  }

  // Shared button row under the edit icon. The codpiece and daily-checklist
  // scripts each install independently, so they cooperate through a single
  // absolutely-positioned flex container (created by whichever runs first) and
  // claim their slot with CSS `order` -- making the left-to-right arrangement
  // independent of DOM insertion order / which script loads first. Returns the
  // row, or null in text-mode topmenu where #fixedawesome is absent.
  function getButtonRow() {
    let row = document.getElementById('tm-kol-menu-btns');
    if (row) return row;
    const fixed = document.getElementById('fixedawesome');
    const editLink = document.querySelector('#fixedawesome a.config');
    if (!fixed || !editLink) return null;
    // #fixedawesome is position:absolute, so an absolutely positioned child is
    // placed relative to it without disturbing the inline row of icons. The
    // edit icon is 30px tall; hang the row just below it, left-aligned with it.
    row = document.createElement('div');
    row.id = 'tm-kol-menu-btns';
    row.style.cssText = [
      'position:absolute',
      'top:31px',
      'left:' + Math.max(0, editLink.offsetLeft) + 'px',
      'z-index:3',
      'display:flex',
      'gap:3px',
      'align-items:flex-start'
    ].join(';');
    fixed.appendChild(row);
    return row;
  }

  function addButton() {
    if (document.getElementById('tm-codpiece-btn')) return;

    const btn = makeButton();
    const row = getButtonRow();
    if (row) {
      // Sit to the right of the checklist button (order 1) when both load.
      btn.style.order = '2';
      btn.style.backgroundColor = 'white';
      row.appendChild(btn);
      return;
    }

    // Text-mode topmenu fallback: place after the checklist button if it's
    // already there (keeping codpiece to its right), else after a plain "edit"
    // link.
    const cl = document.getElementById('tm-checklist-btn');
    if (cl) {
      cl.insertAdjacentElement('afterend', btn);
      return;
    }
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const t = a.textContent.trim().toLowerCase().replace(/^\[|\]$/g, '');
      if (t === 'edit') {
        a.insertAdjacentElement('afterend', btn);
        return;
      }
    }

    console.warn('Codpiece button: no anchor point found, ' +
                 'placing button at top of frame.');
    document.body.insertBefore(btn, document.body.firstChild);
  }

  // === Decoration screen (choice.php, whichchoice=1588) ================
  // Adds a panel that can set every gem slot to one chosen gem in a single
  // click, and save / load named gem setups in localStorage.

  const WHICHCHOICE = '1588';
  const SETUPS_KEY = 'tm-codpiece-setups';

  function loadSetups() {
    try {
      const o = JSON.parse(localStorage.getItem(SETUPS_KEY));
      return (o && typeof o === 'object') ? o : {};
    } catch (e) {
      return {};
    }
  }

  function storeSetups(o) {
    localStorage.setItem(SETUPS_KEY, JSON.stringify(o));
  }

  // Collect the per-slot "Replace" forms (option=1), keyed by their `which`.
  // Each carries a <select name="iid"> whose currently-selected (disabled)
  // option is the gem mounted in that slot.
  function collectSlots() {
    const slots = [];
    document.querySelectorAll('form[action="choice.php"]').forEach(function (f) {
      const wc = f.querySelector('input[name="whichchoice"]');
      const opt = f.querySelector('input[name="option"]');
      const which = f.querySelector('input[name="which"]');
      const select = f.querySelector('select[name="iid"]');
      if (!wc || wc.value !== WHICHCHOICE) return;
      if (!opt || opt.value !== '1') return;          // Replace forms only
      if (!which || !select) return;
      slots.push({ which: which.value, form: f, select: select });
    });
    slots.sort(function (a, b) { return Number(a.which) - Number(b.which); });
    return slots;
  }

  // Union of all gems offered across the slots: value -> label text.
  function collectGems(slots) {
    const gems = new Map();
    slots.forEach(function (s) {
      Array.from(s.select.options).forEach(function (o) {
        if (!gems.has(o.value)) gems.set(o.value, o.textContent.trim());
      });
    });
    return gems;
  }

  function getPwdFromPage() {
    const inp = document.querySelector('input[name="pwd"]');
    return inp ? inp.value : getPwd();
  }

  // POST a single slot replacement. Resolves when the request settles; the
  // caller reloads once all slots are done so the server stays authoritative
  // about item availability (a gem you own only once can fill one slot).
  function applySlot(which, iid, pwd) {
    const body = new URLSearchParams();
    body.set('whichchoice', WHICHCHOICE);
    body.set('pwd', pwd);
    body.set('option', '1');
    body.set('which', which);
    body.set('iid', iid);
    return fetch('/choice.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
  }

  // assignments: array of { which, iid }. Fires sequentially, then reloads.
  async function applyAssignments(assignments, pwd, status) {
    if (!assignments.length) {
      if (status) status.textContent = 'Nothing to change.';
      return;
    }
    for (let i = 0; i < assignments.length; i++) {
      if (status) {
        status.textContent = 'Applying slot ' + (i + 1) + '/' +
          assignments.length + '…';
      }
      try {
        await applySlot(assignments[i].which, assignments[i].iid, pwd);
      } catch (e) {
        if (status) status.textContent = 'Request failed: ' + e;
        console.error('Codpiece: applySlot failed', e);
        return;
      }
    }
    if (status) status.textContent = 'Done, reloading…';
    location.reload();
  }

  // Is gem `iid` selectable (offered and not the disabled current gem) in this
  // slot's <select>? Skipping the current gem avoids no-op POSTs the server
  // would reject (the matching <option> is rendered disabled).
  function slotCanTake(slot, iid) {
    const opt = slot.select.querySelector('option[value="' + iid + '"]');
    return !!opt && !opt.disabled;
  }

  function buildPanel(slots, gems, pwd) {
    const panel = document.createElement('div');
    panel.id = 'tm-cod-panel';
    panel.style.cssText = [
      'max-width:520px', 'margin:8px auto', 'padding:8px',
      'border:1px solid blue', 'background:#f5f5ff',
      'font-family:arial', 'font-size:11px', 'text-align:left'
    ].join(';');

    const title = document.createElement('b');
    title.textContent = 'Codpiece tools';
    panel.appendChild(title);

    const status = document.createElement('div');
    status.id = 'tm-cod-status';
    status.style.cssText = 'margin-top:6px;min-height:14px;color:#006';

    // --- Row 1: set all slots to one gem ------------------------------
    const row1 = document.createElement('div');
    row1.style.cssText = 'margin-top:6px';
    const gemSel = document.createElement('select');
    gemSel.style.maxWidth = '300px';
    gems.forEach(function (label, value) {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      gemSel.appendChild(o);
    });
    const setAllBtn = document.createElement('button');
    setAllBtn.type = 'button';
    setAllBtn.textContent = 'Set all slots';
    setAllBtn.className = 'button';
    setAllBtn.style.marginLeft = '6px';
    setAllBtn.addEventListener('click', function () {
      const iid = gemSel.value;
      const assignments = slots
        .filter(function (s) { return slotCanTake(s, iid); })
        .map(function (s) { return { which: s.which, iid: iid }; });
      if (!assignments.length) {
        status.textContent = 'That gem is already in every applicable slot ' +
          '(or not available).';
        return;
      }
      setAllBtn.disabled = true;
      applyAssignments(assignments, pwd, status);
    });
    row1.appendChild(document.createTextNode('Set every slot to: '));
    row1.appendChild(gemSel);
    row1.appendChild(setAllBtn);
    panel.appendChild(row1);

    // --- Row 2: save / load named setups ------------------------------
    const row2 = document.createElement('div');
    row2.style.cssText = 'margin-top:6px';
    const setupSel = document.createElement('select');
    setupSel.style.minWidth = '160px';

    function refreshSetupList() {
      const setups = loadSetups();
      setupSel.innerHTML = '';
      const names = Object.keys(setups).sort();
      if (!names.length) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = '(no saved setups)';
        setupSel.appendChild(o);
        setupSel.disabled = true;
      } else {
        setupSel.disabled = false;
        names.forEach(function (n) {
          const o = document.createElement('option');
          o.value = n;
          o.textContent = n;
          setupSel.appendChild(o);
        });
      }
    }
    refreshSetupList();

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.textContent = 'Load';
    loadBtn.className = 'button';
    loadBtn.style.marginLeft = '6px';
    loadBtn.addEventListener('click', function () {
      const name = setupSel.value;
      if (!name) return;
      const setups = loadSetups();
      const saved = setups[name];
      if (!saved) return;
      const assignments = [];
      const skipped = [];
      slots.forEach(function (s) {
        const iid = saved[s.which];
        if (!iid) return;                       // slot not in this setup
        if (!slotCanTake(s, iid)) {             // already set, or unavailable
          const opt = s.select.querySelector('option[value="' + iid + '"]');
          if (!opt) skipped.push(s.which);      // gem not owned -> report
          return;
        }
        assignments.push({ which: s.which, iid: iid });
      });
      if (skipped.length) {
        status.textContent = 'Note: gem unavailable for slot(s) ' +
          skipped.join(', ') + '. ';
      }
      if (!assignments.length) {
        status.textContent += 'Nothing to change.';
        return;
      }
      loadBtn.disabled = true;
      applyAssignments(assignments, pwd, status);
    });

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save current…';
    saveBtn.className = 'button';
    saveBtn.style.marginLeft = '6px';
    saveBtn.addEventListener('click', function () {
      const name = (prompt('Save current gem setup as:') || '').trim();
      if (!name) return;
      const setups = loadSetups();
      const snapshot = {};
      slots.forEach(function (s) { snapshot[s.which] = s.select.value; });
      setups[name] = snapshot;
      storeSetups(setups);
      refreshSetupList();
      setupSel.value = name;
      status.textContent = 'Saved setup "' + name + '".';
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.className = 'button';
    delBtn.style.marginLeft = '6px';
    delBtn.addEventListener('click', function () {
      const name = setupSel.value;
      if (!name) return;
      if (!confirm('Delete saved setup "' + name + '"?')) return;
      const setups = loadSetups();
      delete setups[name];
      storeSetups(setups);
      refreshSetupList();
      status.textContent = 'Deleted setup "' + name + '".';
    });

    row2.appendChild(document.createTextNode('Setups: '));
    row2.appendChild(setupSel);
    row2.appendChild(loadBtn);
    row2.appendChild(saveBtn);
    row2.appendChild(delBtn);
    panel.appendChild(row2);

    panel.appendChild(status);
    return panel;
  }

  function initDecorator() {
    if (document.getElementById('tm-cod-panel')) return;
    // Only the Eternity Codpiece choice carries whichchoice=1588.
    if (!document.querySelector(
        'input[name="whichchoice"][value="' + WHICHCHOICE + '"]')) {
      return;
    }
    const slots = collectSlots();
    if (!slots.length) return;
    const gems = collectGems(slots);
    if (!gems.size) return;
    const pwd = getPwdFromPage();
    if (!pwd) {
      console.warn('Codpiece tools: could not determine pwd hash.');
      return;
    }
    const panel = buildPanel(slots, gems, pwd);
    document.body.insertBefore(panel, document.body.firstChild);
  }

  // --- Dispatch --------------------------------------------------------
  // Run last, so the `const` config above is past its temporal dead zone by the
  // time addButton()/fireAction() read it. all-in-one.js @requires every KoL
  // script and runs them on the union of all matched pages; gating by page here
  // keeps each feature off sibling frames. A no-op gate for the standalone
  // install, whose @match already scopes it.
  const PATH = location.pathname;
  if (/\/(awesomemenu|topmenu)\.php/i.test(PATH)) {
    addButton();
  } else if (/\/choice\.php/i.test(PATH)) {
    initDecorator();
  }
})();