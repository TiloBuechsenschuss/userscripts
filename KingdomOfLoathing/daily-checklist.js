// ==UserScript==
// @name         KoL Daily Checklist
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/daily-checklist.js
// @version      1.8
// @description  Adds a Checklist button next to the codpiece button that opens a daily to-do list popup. Items can carry a KoL action link (pwd filled live) and be greyed out when not relevant to the current run. A persistent ronin / post-ronin toggle auto-disables the tasks that only apply to one phase. Checked items reset each day (or manually).
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // --- Configuration ---------------------------------------------------
  const BUTTON_LABEL = 'Checklist';
  const STORE_KEY = 'tm-kol-daily-checklist';
  // Token in a stored item.url that is swapped for the live pwd hash at click
  // time (pwd can change between sessions, so we never bake it into storage).
  const PWD_TOKEN = 'PWDHASH';
  // Default items injected once (see SEED_VERSION). Items may carry a url that
  // opens in the mainpane when clicked, and a `disabled` phase ('ronin' or
  // 'post-ronin') that greys them out while the run state toggle matches it.
  // Bump SEED_VERSION to push new defaults to people who already have a saved list.
  const SEED_VERSION = 1;
  const SEED_ITEMS = [
    {
      text: 'Dig with spade',
      url: '/inv_use.php?pwd=' + PWD_TOKEN + '&which=f-1&whichitem=12184'
    },
    {
      text: 'Play baseball',
      url: '/inventory.php?pwd=' + PWD_TOKEN + '&action=pball'
    },
    {
      text: 'Summon pasta',
      url: 'skillz.php'
    },
    {
      text: 'Read manual',
      off: true
    },
    {
      text: 'get friar blessings',
      url: '/friars.php',
      off: true
    },
    {
      text: 'Summon demon',
      url: 'place.php?whichplace=manor1',
      off: true
    },
    {
      text: 'Collect hippy money',
      url: '/shop.php?whichshop=hippy',
      off: true
    },
    {
      text: 'Do bounties',
      url: '/bhh.php',
      disabled: 'ronin'
    },
    {
      text: 'Daily dungeon',
      url: '/da.php',
      disabled: 'ronin'
    },
    {
      text: 'Rumpus room',
      url: '/clan_rumpus.php',
      disabled: 'ronin'
    },
    {
      text: 'Get hermit clovers',
      url: '/hermit.php'
    },
    {
      text: 'Fight tentacle',
      url: 'place.php?whichplace=forestvillage&action=fv_scientist'
    },
    {
      text: 'Eat essential tofu',
    },
    {
      text: 'Use etched hourglass'
    },
    {
      text: 'Use eternal car battery'
    },
    {
      text: 'Pull from Hagnk\'s',
      off: false,
      disabled: 'post-ronin'
    },
    {
      text: 'Put on rollover gear and familiar'
    }
  ];
  // ----------------------------------------------------------------------

  // localStorage is per-origin, so the same list is shared across all KoL
  // frames (awesomemenu/topmenu/charpane/mainpane) and survives reloads.

  function todayStr() {
    const d = new Date();
    return (
      d.getFullYear() +
      '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0')
    );
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY));
    } catch (e) {
      return null;
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Daily checklist: could not save.', e);
    }
  }

  // Read the player's pwd hash from the current (menu) frame, mirroring the
  // codpiece script. Used to fill PWD_TOKEN in item URLs at click time.
  function getPwd() {
    const inp = document.querySelector('input[name="pwd"]');
    if (inp && inp.value) return inp.value;

    if (typeof window.pwdhash === 'string' && window.pwdhash.length > 0) {
      return window.pwdhash;
    }
    if (typeof window.pwd === 'string' && window.pwd.length > 0) {
      return window.pwd;
    }

    const link = document.querySelector('a[href*="pwd="]');
    if (link) {
      const m = link.getAttribute('href').match(/[?&]pwd=([0-9a-fA-F]+)/);
      if (m) return m[1];
    }

    try {
      const cp = top.frames['charpane'];
      if (cp && typeof cp.pwdhash === 'string' && cp.pwdhash.length > 0) {
        return cp.pwdhash;
      }
    } catch (e) { /* ignore */ }

    const m2 = document.documentElement.innerHTML.match(
      /pwd(?:hash)?\s*=\s*["']([0-9a-fA-F]+)["']/
    );
    return m2 ? m2[1] : null;
  }

  // Swap PWD_TOKEN in a stored url for the live pwd hash.
  function resolveUrl(url) {
    if (url.indexOf(PWD_TOKEN) === -1) return url;
    const pwd = getPwd();
    if (!pwd) return null;
    return url.split(PWD_TOKEN).join(pwd);
  }

  // Run an item's url in the mainpane (so results are visible), like codpiece.
  function go(url) {
    const full = resolveUrl(url);
    if (!full) {
      alert('Daily checklist: could not determine pwd hash for this link.');
      return;
    }
    const abs = full.charAt(0) === '/' ? full : '/' + full;
    try {
      top.frames['mainpane'].location.href = abs;
    } catch (e) {
      window.open(abs, '_blank');
    }
  }

  // Inject SEED_ITEMS once per SEED_VERSION. Skips items already present (by
  // url or text) and never re-adds after the marker advances, so deleting a
  // default keeps it gone. Returns true if state changed.
  function applySeeds(s) {
    if ((s.seed || 0) >= SEED_VERSION) return false;
    SEED_ITEMS.forEach(function (seed) {
      const match = s.items.find(function (it) {
        return (seed.url && it.url === seed.url) || it.text === seed.text;
      });
      if (match) {
        // Backfill the run-state restriction onto an item that was seeded
        // before this field existed, without clobbering a user's own choice.
        if (seed.disabled && !match.disabled) match.disabled = seed.disabled;
        // Flag pre-existing seeds so they pick up the no-delete rule too.
        match.seeded = true;
      } else {
        s.items.push({
          text: seed.text, done: false, off: !!seed.off,
          url: seed.url, disabled: seed.disabled, seeded: true
        });
      }
    });
    s.seed = SEED_VERSION;
    return true;
  }

  // Returns the current state, applying default seeds and performing the
  // once-per-day reset (unchecking every item) if the stored date isn't today.
  function getState() {
    let s = load();
    if (!s || !Array.isArray(s.items)) {
      s = { date: todayStr(), items: [], seed: 0 };
    }
    let dirty = false;
    // Persistent run-state flag; the daily reset below only touches `done`, so
    // this is never cleared at rollover. Default new lists to ronin.
    if (typeof s.ronin !== 'boolean') { s.ronin = true; dirty = true; }
    if (applySeeds(s)) dirty = true;
    if (s.date !== todayStr()) {
      s.items.forEach(function (it) { it.done = false; });
      s.date = todayStr();
      dirty = true;
    }
    if (dirty) save(s);
    return s;
  }

  // Render the popup into the mainpane frame's document. KoL's top page is a
  // frameset (top.document has no <body>), and this menu frame is only a thin
  // bar, so we target mainpane -- a normal document that fills most of the
  // window -- and overlay it with position:fixed.
  function popupDoc() {
    try {
      const mp = top.frames['mainpane'];
      if (mp && mp.document && mp.document.body) return mp.document;
    } catch (e) { /* cross-frame access failed; fall back */ }
    if (document.body) return document;
    return null;
  }

  function closePopup() {
    const d = popupDoc();
    if (!d) return;
    const ov = d.getElementById('tm-checklist-overlay');
    if (ov) ov.remove();
  }

  function styleBtn(btn, bg) {
    btn.type = 'button';
    btn.style.cssText = [
      'padding:3px 10px',
      'font-size:12px',
      'font-family:arial,helvetica,sans-serif',
      'cursor:pointer',
      'border:1px solid #888',
      'border-radius:3px',
      'background:' + (bg || '#eee'),
      'white-space:nowrap'
    ].join(';');
    return btn;
  }

  function openPopup() {
    const d = popupDoc();
    if (!d) {
      alert('Daily checklist: could not find a frame to render the popup.');
      return;
    }
    closePopup();

    const state = getState();

    // True when an item's `disabled` phase matches the current run state. This
    // is a hard disable: the whole row (done, skip, delete, link, text) goes
    // inert, since the task simply doesn't apply this run.
    function runDisabled(item) {
      return item.disabled === (state.ronin ? 'ronin' : 'post-ronin');
    }
    // An item is greyed either because it's run-disabled or because the user
    // manually skipped it (off) -- the latter stays reversible.
    function greyedNow(item) {
      return !!item.off || runDisabled(item);
    }

    const overlay = d.createElement('div');
    overlay.id = 'tm-checklist-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.45)',
      'z-index:99999',
      'display:flex',
      'align-items:flex-start',
      'justify-content:center'
    ].join(';');
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePopup();
    });

    const panel = d.createElement('div');
    panel.style.cssText = [
      'margin-top:80px',
      'width:340px',
      'max-height:75vh',
      'overflow:auto',
      'background:#fff',
      'border:2px solid #604a7b',
      'border-radius:6px',
      'box-shadow:0 4px 18px rgba(0,0,0,0.4)',
      'padding:14px',
      'font-family:arial,helvetica,sans-serif',
      'font-size:13px',
      'color:#222'
    ].join(';');

    // --- Header --------------------------------------------------------
    const header = d.createElement('div');
    header.style.cssText = 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:2px';
    const title = d.createElement('div');
    title.textContent = 'Daily Checklist';
    title.style.cssText = 'font-size:15px;font-weight:bold;color:#604a7b';
    const closeX = d.createElement('span');
    closeX.textContent = '×';
    closeX.title = 'Close';
    closeX.style.cssText = 'cursor:pointer;font-size:18px;line-height:1;color:#888;padding:0 2px';
    closeX.addEventListener('click', closePopup);
    header.appendChild(title);
    header.appendChild(closeX);
    panel.appendChild(header);

    const sub = d.createElement('div');
    sub.textContent = 'Auto-resets daily • ' + state.date;
    sub.style.cssText = 'font-size:10px;color:#999;margin-bottom:10px';
    panel.appendChild(sub);

    // --- Run-state toggle ----------------------------------------------
    // Ronin vs post-ronin. Tasks that only apply to one phase opt out via
    // their `disabled` field and grey out here. The flag is persisted and
    // never cleared by the daily reset (see getState).
    const modeRow = d.createElement('div');
    modeRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px';
    const modeLabel = d.createElement('span');
    modeLabel.textContent = 'Run state:';
    modeLabel.style.cssText = 'font-size:11px;color:#666';
    const modeBtn = styleBtn(d.createElement('button'));
    modeBtn.title = "Toggle ronin / post-ronin (greys out the tasks that don't apply)";
    function paintMode() {
      modeBtn.textContent = state.ronin ? 'Ronin' : 'Post-ronin';
      modeBtn.style.background = state.ronin ? '#e8d9b0' : '#cfe0cf';
    }
    modeBtn.addEventListener('click', function () {
      state.ronin = !state.ronin;
      save(state);
      paintMode();
      rebuildList();
    });
    paintMode();
    modeRow.appendChild(modeLabel);
    modeRow.appendChild(modeBtn);
    panel.appendChild(modeRow);

    // --- Item list -----------------------------------------------------
    // Fixed column widths so the header labels line up with the controls.
    // The "Task" column flexes; "Done", "Skip" and the delete column are
    // pinned to the right at fixed widths regardless of the optional link.
    const COL = { done: 40, skip: 36, del: 20 };

    const colHead = d.createElement('div');
    colHead.style.cssText =
      'display:flex;align-items:center;gap:6px;padding:0 0 4px;' +
      'border-bottom:2px solid #604a7b;font-size:9px;font-weight:bold;' +
      'text-transform:uppercase;letter-spacing:.5px;color:#604a7b';
    function headCell(label, width, title) {
      const c = d.createElement('span');
      c.textContent = label;
      if (title) c.title = title;
      c.style.cssText = width
        ? 'flex:0 0 auto;width:' + width + 'px;text-align:center'
        : 'flex:1 1 auto';
      return c;
    }
    colHead.appendChild(headCell('Done', COL.done, 'Completed today'));
    colHead.appendChild(headCell('Task', 0));
    colHead.appendChild(headCell('Skip', COL.skip, 'Not relevant this run (greys it out)'));
    colHead.appendChild(headCell('', COL.del));
    panel.appendChild(colHead);

    const list = d.createElement('div');
    panel.appendChild(list);

    // Wrap a control in a fixed-width, centered column cell.
    function cell(child, width) {
      const c = d.createElement('div');
      c.style.cssText = 'flex:0 0 auto;width:' + width + 'px;display:flex;justify-content:center';
      c.appendChild(child);
      return c;
    }

    function rebuildList() {
      list.innerHTML = '';
      if (state.items.length === 0) {
        const empty = d.createElement('div');
        empty.textContent = 'No items yet — add one below.';
        empty.style.cssText = 'color:#999;font-style:italic;padding:6px 0';
        list.appendChild(empty);
      }
      state.items.forEach(function (item, idx) {
        const row = d.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f0f0f0';

        const cb = d.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!item.done;
        cb.title = 'Done today';
        cb.style.cssText = 'flex:0 0 auto;cursor:pointer;width:16px;height:16px';
        cb.addEventListener('change', function () {
          item.done = cb.checked;
          save(state);
          paint();
        });

        const txt = d.createElement('input');
        txt.type = 'text';
        txt.value = item.text;
        txt.style.cssText = [
          'flex:1 1 auto',
          'border:1px solid transparent',
          'background:transparent',
          'font-size:13px',
          'font-family:inherit',
          'padding:2px 3px',
          'min-width:0'
        ].join(';');
        txt.addEventListener('focus', function () {
          txt.style.border = '1px solid #bbb';
          txt.style.background = '#fff';
        });
        txt.addEventListener('blur', function () {
          txt.style.border = '1px solid transparent';
          txt.style.background = 'transparent';
        });
        txt.addEventListener('input', function () {
          item.text = txt.value;
          save(state);
        });

        let link = null;
        if (item.url) {
          link = d.createElement('a');
          link.textContent = '▶';
          link.href = '#';
          link.title = 'Run in mainpane: ' + item.url;
          link.style.cssText = 'flex:0 0 auto;cursor:pointer;color:#604a7b;text-decoration:none;font-size:13px;padding:0 2px';
          link.addEventListener('click', function (e) {
            e.preventDefault();
            if (greyedNow(item)) return;
            go(item.url);
            closePopup();
          });
        }

        // "Off" toggle: greys out an entry that isn't relevant for this run.
        // Persists across the daily reset (it's not a per-day completion).
        const off = d.createElement('input');
        off.type = 'checkbox';
        off.checked = !!item.off;
        off.title = 'Not relevant this run (grey out)';
        off.style.cssText = 'flex:0 0 auto;cursor:pointer;width:13px;height:13px;opacity:0.7';
        off.addEventListener('change', function () {
          item.off = off.checked;
          save(state);
          paint();
        });

        // Built-in (seeded) items can't be deleted -- only skipped -- so the
        // default list can't be whittled away by accident. User-added items
        // keep a delete control.
        let del = null;
        if (!item.seeded) {
          del = d.createElement('span');
          del.textContent = '×';
          del.title = 'Remove item';
          del.style.cssText = 'flex:0 0 auto;cursor:pointer;color:#c44;font-size:16px;line-height:1;padding:0 4px';
          del.addEventListener('click', function () {
            if (runDisabled(item)) return;
            state.items.splice(idx, 1);
            save(state);
            rebuildList();
          });
        }

        // When a row is hard-disabled by the current run state, give it a
        // distinct look from a manual skip: a lock badge naming the phase the
        // task *does* apply to, plus a colored left accent. The colors mirror
        // the Run-state toggle (tan = ronin, green = post-ronin) so it's clear
        // which way to flip the toggle to re-enable it.
        let badge = null;
        let accent = null;
        if (runDisabled(item)) {
          // `disabled` names the phase this task is blocked in, which is the
          // phase currently active. Colors mirror the Run-state toggle.
          const blockedIn = item.disabled;
          const skin = blockedIn === 'ronin'
            ? { bg: '#f2e9cf', border: '#d9c48f', fg: '#7a5d1f', bar: '#c9a94e' }
            : { bg: '#dceadc', border: '#9fc19f', fg: '#3a5a3a', bar: '#79a979' };
          accent = skin.bar;
          badge = d.createElement('span');
          badge.textContent = '🔒 disabled in ' + blockedIn;
          badge.title = 'Auto-disabled by run state — not relevant in ' + blockedIn +
            '. Flip the Run state toggle to enable it.';
          badge.style.cssText = [
            'flex:0 0 auto',
            'font-size:9px',
            'font-weight:bold',
            'text-transform:uppercase',
            'letter-spacing:.3px',
            'color:' + skin.fg,
            'background:' + skin.bg,
            'border:1px solid ' + skin.border,
            'border-radius:8px',
            'padding:1px 6px',
            'white-space:nowrap'
          ].join(';');
          // Inset bar (vs. border-left) so it doesn't shift the row's layout.
          row.style.boxShadow = 'inset 3px 0 0 ' + accent;
          row.style.background = '#fbfaf6';
        }

        // Apply the visual state (greyed when off or disabled by run state;
        // struck through when done). A run-disabled row is inert end to end:
        // its done, skip, delete, link and text edit are all turned off, and
        // its text goes italic to read as "automatic" rather than a user skip.
        function paint() {
          const hardOff = runDisabled(item);
          const greyed = hardOff || !!item.off;
          cb.disabled = greyed;
          off.disabled = hardOff;
          txt.readOnly = hardOff;
          txt.style.fontStyle = hardOff ? 'italic' : 'normal';
          if (del) {
            del.style.opacity = hardOff ? '0.3' : '1';
            del.style.cursor = hardOff ? 'default' : 'pointer';
            del.style.pointerEvents = hardOff ? 'none' : 'auto';
          }
          if (greyed) {
            txt.style.color = '#bbb';
            txt.style.textDecoration = 'none';
            if (link) {
              link.style.color = '#ccc';
              link.style.cursor = 'default';
            }
          } else {
            txt.style.color = item.done ? '#aaa' : '#222';
            txt.style.textDecoration = item.done ? 'line-through' : 'none';
            if (link) {
              link.style.color = '#604a7b';
              link.style.cursor = 'pointer';
            }
          }
        }
        paint();

        row.appendChild(cell(cb, COL.done));
        row.appendChild(txt);
        if (link) row.appendChild(link);
        if (badge) row.appendChild(badge);
        row.appendChild(cell(off, COL.skip));
        // Seed items have no delete control; keep the column width so rows
        // stay aligned with the header.
        if (del) {
          row.appendChild(cell(del, COL.del));
        } else {
          const spacer = d.createElement('div');
          spacer.style.cssText = 'flex:0 0 auto;width:' + COL.del + 'px';
          row.appendChild(spacer);
        }
        list.appendChild(row);
      });
    }
    rebuildList();

    // --- Add item ------------------------------------------------------
    const addRow = d.createElement('div');
    addRow.style.cssText = 'display:flex;gap:6px;margin-top:10px';
    const addInput = d.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = 'Add an item…';
    addInput.style.cssText = 'flex:1 1 auto;padding:4px 6px;border:1px solid #bbb;border-radius:3px;font-size:13px;font-family:inherit;min-width:0';
    const addBtn = styleBtn(d.createElement('button'), '#604a7b');
    addBtn.style.color = '#fff';
    addBtn.textContent = 'Add';
    function addItem() {
      const v = addInput.value.trim();
      if (!v) return;
      state.items.push({ text: v, done: false });
      save(state);
      addInput.value = '';
      rebuildList();
      addInput.focus();
    }
    addBtn.addEventListener('click', addItem);
    addInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    });
    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);
    panel.appendChild(addRow);

    // --- Footer --------------------------------------------------------
    const footer = d.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:14px';

    // Wipes the stored list entirely and rebuilds from SEED_ITEMS. Destructive
    // (drops items you added/edited), so confirm first. Sits on the far left.
    const seedBtn = styleBtn(d.createElement('button'));
    seedBtn.textContent = 'Reload from seed';
    seedBtn.title = 'Discard all items and restore the built-in defaults';
    seedBtn.style.marginRight = 'auto';
    seedBtn.addEventListener('click', function () {
      if (!d.defaultView.confirm(
        'Discard the current checklist and reload the built-in defaults?\n' +
        'This removes any items you added or edited.'
      )) return;
      try {
        localStorage.removeItem(STORE_KEY);
      } catch (e) {
        console.error('Daily checklist: could not clear storage.', e);
      }
      closePopup();
      openPopup();
    });

    const resetBtn = styleBtn(d.createElement('button'));
    resetBtn.textContent = 'Uncheck all';
    resetBtn.title = 'Reset the checklist now (unchecks every item)';
    resetBtn.addEventListener('click', function () {
      state.items.forEach(function (it) { it.done = false; });
      state.date = todayStr();
      save(state);
      rebuildList();
    });

    const doneBtn = styleBtn(d.createElement('button'), '#604a7b');
    doneBtn.style.color = '#fff';
    doneBtn.textContent = 'Close';
    doneBtn.addEventListener('click', closePopup);

    footer.appendChild(seedBtn);
    footer.appendChild(resetBtn);
    footer.appendChild(doneBtn);
    panel.appendChild(footer);

    overlay.appendChild(panel);
    d.body.appendChild(overlay);
    addInput.focus();
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = 'tm-checklist-btn';
    btn.type = 'button';
    btn.textContent = BUTTON_LABEL;
    btn.title = 'Open the daily checklist';
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:9px',
      'font-family:arial',
      'height:14px',
      'line-height:12px',
      'cursor:pointer',
      'white-space:nowrap'
    ].join(';');
    btn.addEventListener('click', openPopup);
    return btn;
  }

  function addButton() {
    if (document.getElementById('tm-checklist-btn')) return;

    const btn = makeButton();
    const fixed = document.getElementById('fixedawesome');
    const editLink = document.querySelector('#fixedawesome a.config');

    if (fixed && editLink) {
      // #fixedawesome is position:absolute, so an absolutely positioned child
      // is placed relative to it. The codpiece button (if present) sits at
      // top:31px; stack this one just below it at top:46px, same left edge.
      btn.style.position = 'absolute';
      btn.style.top = '46px';
      btn.style.left = Math.max(0, editLink.offsetLeft) + 'px';
      btn.style.zIndex = '3';
      btn.style.backgroundColor = 'white';
      fixed.appendChild(btn);
      return;
    }

    // Text-mode topmenu fallback: place near the codpiece button or "edit".
    const cod = document.getElementById('tm-codpiece-btn');
    if (cod) {
      cod.insertAdjacentElement('afterend', btn);
      return;
    }
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const t = a.textContent.trim().toLowerCase().replace(/^\[|\]$/g, '');
      if (t === 'edit') {
        const wrap = document.createElement('div');
        wrap.appendChild(btn);
        a.insertAdjacentElement('afterend', wrap);
        return;
      }
    }

    console.warn('Daily checklist: no anchor point found, ' +
                 'placing button at top of frame.');
    document.body.insertBefore(btn, document.body.firstChild);
  }

  addButton();
})();
