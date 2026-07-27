// ==UserScript==
// @name         KoL Quest Helper
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/quest-helper.js
// @version      1.2
// @description  Helper for puzzle-y quest choice adventures. It never submits or clicks anything on its own -- it fills in or highlights the known-correct answer and leaves the actual move to you. Currently: Drawn Onward (choice 872), the photo frames in Dr. Awkward's office, sets the four photo dropdowns to the correct order; Beginning at the Beginning of Beginning (the Hidden Temple tile floor, tiles.php) glows the tile to step on in each row, spelling B-A-N-A-N-A-S from the bottom up, numbered in step order.
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @match        https://www.kingdomofloathing.com/tiles.php*
// @match        https://kingdomofloathing.com/tiles.php*
// @match        https://www.kingdomofloathing.com/adventure.php*
// @match        https://kingdomofloathing.com/adventure.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // The all-in-one loader @requires every KoL script onto the union of all matched
  // pages, so scope ourselves explicitly rather than trusting @match. adventure.php
  // is in here because the tile puzzle's FIRST screen is rendered as a normal
  // adventure result (the wiki notes it uniquely shows two titled blue boxes: the
  // results box and the puzzle box); every later step posts to tiles.php.
  if (!/\/(choice|tiles|adventure)\.php/i.test(location.pathname)) return;
  if (document.getElementById('tm-questhelper-bar')) return; // idempotency guard

  // NOTE on styling: KoL's Content-Security-Policy allows inline style ATTRIBUTES
  // (the game uses them everywhere) but blocks script-injected stylesheets, so CSS
  // classes and @keyframes silently do nothing. Everything here is inline styles,
  // and the tile glow is pulsed by a JS timer -- same approach and same reason as
  // mine-sparkle-highlight.js.

  // === Puzzle database =====================================================
  // `page`   - pathname regex; the puzzle is only considered on those pages.
  // `choice` - the hidden `whichchoice` value, for puzzles that live on the shared
  //            choice.php. Puzzles on their own endpoint use `detect` instead.
  // `type`   - picks the handler:
  //              'selects' -- the answer is "put these values in these dropdowns".
  //              'tiles'   -- the answer is "step on these, in this order"; we
  //                           only highlight them.
  //
  // NOTHING here submits or clicks. Each handler fills a form in or marks tiles;
  // the player makes the actual move. That keeps a wrong database entry from
  // burning a turn or, for the tile floor, from getting them squished.
  const PUZZLES = [
    {
      name: 'Drawn Onward',
      page: /\/choice\.php/i,
      choice: '872',
      // The antechamber behind Dr. Awkward's office door: a column of four empty
      // photo frames, filled from four dropdowns (top -> bottom). Solution order
      // per the KoL wiki: God, red nugget, dog, ostrich egg.
      type: 'selects',
      button: 'Set correct photo order',
      hint: 'Fills the four frames top→bottom with God / red nugget / dog / ostrich egg, ' +
        'then you press "Arrange the photos" yourself.',
      // Each field names the <select> and the option to pick, given BOTH as the
      // item id (the option's value -- stable, the primary key) and as the option
      // label (a fallback, in case a select ever renders different values).
      fields: [
        { name: 'photo1', value: '2259', text: 'photograph of God' },
        { name: 'photo2', value: '7264', text: 'photograph of a red nugget' },
        { name: 'photo3', value: '7263', text: 'photograph of a dog' },
        { name: 'photo4', value: '7265', text: 'photograph of an ostrich egg' },
      ],
    },

    {
      name: 'Beginning at the Beginning of Beginning',
      // The Hidden Temple tile floor (Quest for the Holy MacGuffin; formerly
      // "Dvorak's Revenge"). Custom endpoint tiles.php, first screen on
      // adventure.php. Stepping on a wrong tile costs a few thousand HP and
      // restarts the puzzle, so this only ever highlights.
      page: /\/(tiles|adventure|choice)\.php/i,
      choice: null,
      // No whichchoice to gate on, so gate on the artwork: a wall of lettered
      // tile images is unmistakable, and requiring several of them keeps this
      // from firing on an ordinary adventure.php result page.
      detect: () => countLetterTiles() >= 4,
      type: 'tiles',
      button: 'Re-highlight',
      hint: 'Glows the tile to step on in each row, numbered in step order.',
      answer: 'BANANAS',
    },
  ];

  // === Page matching =======================================================

  // Which puzzle (if any) is on screen. Prefer the hidden whichchoice input --
  // choice.php carries no other reliable id -- and fall back to `detect` for
  // puzzles that live on their own endpoint.
  function currentPuzzle() {
    return PUZZLES.find((p) => {
      if (p.page && !p.page.test(location.pathname)) return false;
      if (p.choice) {
        return !!document.querySelector('input[name="whichchoice"][value="' + p.choice + '"]');
      }
      return typeof p.detect === 'function' && p.detect();
    }) || null;
  }

  // === 'selects' handler ===================================================

  // The form that actually holds the puzzle's controls. A choice page has several
  // forms carrying the same whichchoice (for Drawn Onward: "Arrange the photos"
  // and "Leave"), so match on the fields too rather than taking the first hit.
  function findSelectsForm(puzzle) {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.find((f) =>
      f.querySelector('input[name="whichchoice"][value="' + puzzle.choice + '"]') &&
      puzzle.fields.every((fl) => f.querySelector('select[name="' + fl.name + '"]'))) || null;
  }

  // Pick `field`'s option in `sel`: by option value first (item id), falling back
  // to a case-insensitive label match. Returns true if the value was set (or was
  // already correct), false if no such option exists.
  function selectOption(sel, field) {
    const opts = Array.from(sel.options);
    const want = opts.find((o) => o.value === field.value) ||
      opts.find((o) => o.textContent.trim().toLowerCase() === field.text.toLowerCase());
    if (!want) return false;
    if (sel.value !== want.value) {
      sel.value = want.value;
      // KoL's own page doesn't listen for this, but fire it anyway so anything
      // else hooked onto the select (another script) sees the change.
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  const selectsHandler = {
    locate(puzzle) {
      const form = findSelectsForm(puzzle);
      return form ? { form, mount: form } : null;
    },
    apply(puzzle, ctx, say) {
      const missing = [];
      puzzle.fields.forEach((field) => {
        const sel = ctx.form.querySelector('select[name="' + field.name + '"]');
        if (!sel || !selectOption(sel, field)) missing.push(field.text);
      });
      if (missing.length) {
        say('Could not set: ' + missing.join(', ') +
          ' — you may not be holding every photograph yet. Check the dropdowns before submitting.', true);
        return;
      }
      say('Photos set to the correct order. Now press "Arrange the photos" yourself.');
    },
  };

  // === 'tiles' handler =====================================================
  //
  // The puzzle (from the wiki): a grid of stone tiles, each engraved with one
  // letter -- 9 wide by 7 tall in the wiki's example. You stand *below* the
  // bottom row, on the row the arrow images point at, and each move jumps to any
  // tile in the row directly above you. The correct path spells B-A-N-A-N-A-S
  // bottom-to-top: one tile per row, seven rows, seven letters.
  //
  // So the plan is positional, not a free letter hunt: count the rows still
  // AHEAD of the arrows and take that many letters off the END of BANANAS. That
  // holds however the page re-renders between steps. Fresh grid: 7 rows ahead ->
  // all of "BANANAS", nearest row wants B. After stepping onto the B, 6 rows
  // remain -> "ANANAS", nearest row wants A. And after a fatal misstep the
  // puzzle restarts, which is just "7 rows ahead" again -- no state to keep.
  //
  // UNVERIFIED: the tile artwork here is read off the wiki's copies of KoL's
  // images (Tileg.gif, Tilea.gif, ... and Rightarrow.gif / Leftarrow.gif), so
  // letterOfTile/isArrow try a few src shapes plus alt/title rather than assuming
  // one path. If the live tiles.php names them differently, those two functions
  // are the only things that need touching.

  const LETTER_SRC_PATTERNS = [
    /tile([a-z])\.gif/i,        // wiki's copies: .../Tileg.gif
    /tiles?\/([a-z])\.gif/i,    // plausible live layout: .../otherimages/tiles/g.gif
  ];
  const ARROW_SRC = /(left|right)arrow\.gif/i;

  // The letter engraved on a tile image, or null if this isn't a lettered tile.
  function letterOfTile(img) {
    const src = img.getAttribute('src') || '';
    for (const re of LETTER_SRC_PATTERNS) {
      const m = src.match(re);
      if (m) return m[1].toUpperCase();
    }
    // Fallback: a tile whose letter is only in its alt/title text.
    const label = ((img.getAttribute('alt') || '') + (img.getAttribute('title') || '')).trim();
    return /^[A-Za-z]$/.test(label) ? label.toUpperCase() : null;
  }

  function isArrow(img) {
    return ARROW_SRC.test(img.getAttribute('src') || '');
  }

  // Used by `detect` before any of the grid work, so keep it cheap.
  function countLetterTiles() {
    let n = 0;
    for (const img of document.images) if (letterOfTile(img)) n++;
    return n;
  }

  // Read the floor off the page.
  // Returns { rows, arrowRow } where `rows` is top-to-bottom, each
  // { tr, tiles: [{ el, letter }] }, or null if there's no grid.
  function readGrid() {
    const byRow = new Map(); // <tr> -> tiles, in document order
    let arrowRow = null;
    for (const img of document.images) {
      const tr = img.closest ? img.closest('tr') : null;
      if (!tr) continue;
      if (isArrow(img)) { if (!arrowRow) arrowRow = tr; continue; }
      const letter = letterOfTile(img);
      if (!letter) continue;
      if (!byRow.has(tr)) byRow.set(tr, []);
      byRow.get(tr).push({ el: img, letter });
    }
    if (!byRow.size) return null;
    const rows = Array.from(byRow, ([tr, tiles]) => ({ tr, tiles }));
    return { rows, arrowRow };
  }

  // The rows still to be crossed, nearest-first (bottom-to-top). You stand on the
  // arrow row and move upward, so that's every tile row ABOVE the arrows. With no
  // arrows on the page, assume the whole grid is ahead.
  function rowsAhead(grid) {
    let ahead = grid.rows;
    if (grid.arrowRow) {
      ahead = grid.rows.filter((r) =>
        grid.arrowRow.compareDocumentPosition(r.tr) & Node.DOCUMENT_POSITION_PRECEDING);
    }
    return ahead.slice().reverse(); // document order is top-down; we want nearest first
  }

  // THE RULE, kept DOM-free so it can be reasoned about and unit-tested:
  // `rows` is nearest-first, each an array of that row's letters. Returns
  // { letters, picks } where picks[i] holds the indices in rows[i] to step on, or
  // { error } explaining why the path can't be laid out.
  function planTiles(rows, answer) {
    const word = String(answer).toUpperCase();
    if (!rows.length) return { error: 'no rows ahead of you — the floor looks already crossed' };
    if (rows.length > word.length) {
      return { error: rows.length + ' rows ahead, but "' + word + '" is only ' +
        word.length + ' letters — the grid is not the one this answer is for' };
    }
    // n rows left => the LAST n letters of the word are what's left to spell.
    const letters = word.slice(word.length - rows.length).split('');
    const picks = [];
    for (let i = 0; i < rows.length; i++) {
      const want = letters[i];
      const idx = [];
      rows[i].forEach((l, j) => { if (l === want) idx.push(j); });
      if (!idx.length) {
        return { error: 'no "' + want + '" tile ' + (i + 1) + ' row(s) ahead — the letter ' +
          'reader is probably wrong' };
      }
      picks.push(idx);
    }
    return { letters, picks };
  }

  const pulsing = []; // tiles currently glowing; driven by one shared timer

  // Gold pulsing glow, matching mine-sparkle-highlight.js so the two feel the
  // same. Inline styles + JS timer because of the CSP note at the top.
  function glow(el, step, letter, ambiguous) {
    if (el.dataset.tmQhHighlighted) return;
    el.style.outline = ambiguous ? '3px dashed orange' : '3px solid gold';
    el.style.outlineOffset = '-3px';
    el.style.borderRadius = '3px';
    el.style.position = 'relative';
    el.style.zIndex = '2';
    el.style.transition = 'box-shadow 0.45s ease-in-out';
    // Step order matters more than anything else here, so put it where it can be
    // read: the tile's own tooltip. (A positioned text badge would need a wrapper
    // element inside KoL's table cells; the tooltip works on the <img> as-is.)
    const was = el.getAttribute('title') || '';
    el.setAttribute('title', 'Step ' + step + ': ' + letter +
      (ambiguous ? ' (one of several ' + letter + ' tiles in this row)' : '') +
      (was ? ' — ' + was : ''));
    el.dataset.tmQhHighlighted = '1';
    pulsing.push(el);
  }

  function startPulse() {
    if (window.__tmQuestHelperPulse) return; // one timer only
    let bright = false;
    window.__tmQuestHelperPulse = setInterval(() => {
      if (!pulsing.length) return;
      bright = !bright;
      const shadow = bright
        ? '0 0 16px 7px rgba(255,215,0,1)'
        : '0 0 4px 2px rgba(255,215,0,0.55)';
      pulsing.forEach((el) => { el.style.boxShadow = shadow; });
    }, 550);
  }

  const tilesHandler = {
    // The bar goes under the grid's table when we can find it.
    locate() {
      const grid = readGrid();
      const first = grid && grid.rows[0].tr;
      return { mount: (first && first.closest && first.closest('table')) || null };
    },
    apply(puzzle, ctx, say) {
      const grid = readGrid();
      if (!grid) { say('No lettered tiles found on this page.', true); return; }

      const ahead = rowsAhead(grid);
      const plan = planTiles(ahead.map((r) => r.tiles.map((t) => t.letter)), puzzle.answer);
      if (plan.error) {
        say('Can\'t work out the path: ' + plan.error + '.', true);
        return;
      }

      let ambiguous = 0;
      plan.picks.forEach((idx, i) => {
        if (idx.length > 1) ambiguous++;
        idx.forEach((j) => glow(ahead[i].tiles[j].el, i + 1, plan.letters[i], idx.length > 1));
      });
      startPulse();

      const path = plan.letters.join('-');
      say('Step on ' + path + ', bottom row first — highlighted, hover a tile for its step ' +
        'number. ' + (ambiguous
          ? ambiguous + ' row(s) have more than one candidate tile (dashed orange); ' +
            'those are guesses.'
          : 'Each row has exactly one match.') +
        ' Nothing is clicked for you — a wrong tile costs thousands of HP.');
    },
  };

  const HANDLERS = { selects: selectsHandler, tiles: tilesHandler };

  // === UI ==================================================================

  function buildBar(puzzle, ctx, handler) {
    const bar = document.createElement('div');
    bar.id = 'tm-questhelper-bar';
    bar.style.cssText = [
      'max-width:420px', 'margin:8px auto', 'padding:6px 8px',
      'border:1px solid #336', 'background:#eef', 'border-radius:3px',
      'font-family:arial', 'font-size:11px', 'text-align:center',
    ].join(';');

    const head = document.createElement('div');
    head.innerHTML = '<b>Quest Helper</b> — ' + puzzle.name;
    bar.appendChild(head);

    const status = document.createElement('div');
    status.style.cssText = 'margin-top:4px;color:#444';
    status.textContent = puzzle.hint;
    bar.appendChild(status);

    const say = (msg, warn) => {
      status.textContent = msg;
      status.style.color = warn ? '#a00' : '#060';
    };

    const btn = document.createElement('button');
    btn.type = 'button'; // never submit the form we live next to
    btn.className = 'button';
    btn.textContent = puzzle.button;
    btn.style.cssText = 'margin-top:5px';
    btn.addEventListener('click', () => handler.apply(puzzle, ctx, say));

    bar.appendChild(btn);
    return { bar, say };
  }

  const puzzle = currentPuzzle();
  if (!puzzle) return;
  const handler = HANDLERS[puzzle.type];
  if (!handler) return;

  const ctx = handler.locate(puzzle);
  if (!ctx) return; // page structure changed, or the choice is already resolved

  const { bar, say } = buildBar(puzzle, ctx, handler);
  // Sit right below the puzzle's own form/table when we found one; otherwise at
  // the top of the page.
  if (ctx.mount && ctx.mount.parentNode) {
    ctx.mount.parentNode.insertBefore(bar, ctx.mount.nextSibling);
  } else if (document.body) {
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // Highlighting commits nothing, so 'tiles' runs on sight (like
  // mine-sparkle-highlight.js) and the button just re-runs it. 'selects' WRITES
  // into the form, so it stays strictly opt-in behind its button.
  if (puzzle.type === 'tiles') handler.apply(puzzle, ctx, say);
})();
