// ==UserScript==
// @name         KoL Quest Helper
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/quest-helper.js
// @version      1.3
// @description  Helper for puzzle-y quest choice adventures. It never submits or clicks anything on its own -- it fills in, highlights or explains the known-correct answer and leaves the actual move to you. Currently: Drawn Onward (choice 872), the photo frames in Dr. Awkward's office, sets the four photo dropdowns to the correct order; Beginning at the Beginning of Beginning (the Hidden Temple tile floor, tiles.php) glows the tile to step on in each row, spelling B-A-N-A-N-A-S from the bottom up, numbered in step order; Control Freak (choice 929), the pyramid control room, tracks the Lower Chambers rotation and tells you how many more times to turn the wheel, when to go down instead, and when to stop turning.
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
  //              'rotation'-- the answer is "turn this N more times, then go
  //                           down"; we only advise, and track where you are.
  // `auto`   - run the handler on sight instead of waiting for the button. Only
  //            for handlers that don't write into a form (see the note below).
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
      auto: true,
      button: 'Re-highlight',
      hint: 'Glows the tile to step on in each row, numbered in step order.',
      answer: 'BANANAS',
    },

    {
      name: 'Control Freak',
      page: /\/choice\.php/i,
      choice: '929',
      // The pyramid control room. Turning the peg rotates the Lower Chambers
      // one position; the route through the quest is a rotation puzzle, not a
      // riddle, so this handler only ever *advises* -- see the block comment
      // above the rotation handler for the actual mechanics.
      type: 'rotation',
      auto: true,
      button: '',
      hint: 'Works out how many more times to turn the wheel, and when to stop.',
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

  // === 'rotation' handler ==================================================
  //
  // Control Freak (choice 929), the Ancient Buried Pyramid's control room. The
  // Lower Chambers sit on a turntable with five positions; each use of a
  // crumbling wooden wheel or tomb ratchet on the peg consumes the item and
  // advances the position by exactly one, wrapping 5 -> 1. (The flavour text
  // says "anti-clockwise", but the wiki's own walkthrough -- 3 turns from the
  // fresh position 1 reaches 4, then 4 more reach 3, then 3 more reach 1 --
  // only works out as N -> N+1 mod 5.)
  //
  // What each position offers depends on what you're carrying, which is what
  // makes this worth scripting: only three of the five stops ever do anything,
  // and each of those only once, in a fixed order.
  //
  //   4  basket of tokens          -> ancient bronze token (if empty-handed)
  //   3  bomb vending machine      -> ancient bomb (feeds on the token)
  //   1  rubble-covered stairway   -> the bomb blows it open; Ed's chamber
  //   2  coin basket WITH rats     -> never anything (-30-35 HP empty-handed)
  //   5  bomb machine WITH rats    -> never anything
  //
  // So the whole quest is 3 turns, go down, 4 turns, go down, 3 turns, go down
  // = 10 turns and 10 wheels/ratchets from a fresh pyramid. And there is a real
  // trap at the end: turning the wheel again after the rubble is blown puts the
  // rubble back and costs you a fresh token AND a fresh bomb. Hence "when to
  // stop rotating".
  //
  // TRACKING. choice.php can't see your inventory, so the state is inferred and
  // persisted instead:
  //   - rotations are detected by the position changing between page loads --
  //     no click hook needed, and it survives turning the wheel with the script
  //     disabled (the delta is still right, mod 5);
  //   - descents are detected by hooking the "Head down to the Lower Chambers"
  //     option, because clicking it navigates away from choice.php and we'd
  //     never see the outcome. The visit is logged with a signature of what you
  //     were carrying at the time, so a second trip to the same position with
  //     the same setup can be flagged as the wasted turn it is.
  // Everything inferred can be corrected by hand in the bar; see the manual row.

  const ROT_KEY = 'tm-pyramid-rotation';
  const ROT_POSITIONS = 5;
  const ROT_STALE_MS = 30 * 24 * 60 * 60 * 1000; // a quest is one ascension

  // --- pure logic (DOM-free, unit-tested) ----------------------------------

  // Turns of the peg to get from position `from` to position `to`.
  function turnsTo(from, to) {
    return ((to - from) % ROT_POSITIONS + ROT_POSITIONS) % ROT_POSITIONS;
  }

  // Where `turns` turns of the peg from `pos` lands you.
  function advance(pos, turns) {
    return ((pos - 1 + turns) % ROT_POSITIONS + ROT_POSITIONS) % ROT_POSITIONS + 1;
  }

  // The position you actually want to be standing on, given what you carry.
  // null means "you're done -- stop turning".
  function rotationTarget(state) {
    if (state.open) return null;
    if (state.bomb) return 1; // blow the rubble
    if (state.token) return 3; // buy the bomb
    return 4; // grab a token
  }

  // What descending at `pos` does to you. The only three transitions that
  // exist; everything else (wrong position, wrong inventory) is a wasted turn.
  function applyVisit(state, pos) {
    const s = { token: !!state.token, bomb: !!state.bomb, open: !!state.open };
    if (pos === 4 && !s.token && !s.bomb) s.token = true;
    else if (pos === 3 && s.token && !s.bomb) { s.token = false; s.bomb = true; }
    else if (pos === 1 && s.bomb) { s.bomb = false; s.open = true; }
    return s;
  }

  // Rewind a logged descent -- the exact inverse of the three transitions
  // above, so "undo" doesn't have to replay the whole log (which couldn't
  // reproduce turns or hand corrections anyway).
  function unapplyVisit(state, pos) {
    const s = { token: !!state.token, bomb: !!state.bomb, open: !!state.open };
    if (pos === 4 && s.token) s.token = false;
    else if (pos === 3 && s.bomb) { s.bomb = false; s.token = true; }
    else if (pos === 1 && s.open) { s.open = false; s.bomb = true; }
    return s;
  }

  // Turning the wheel at all re-buries the stairway. Your token/bomb are safe.
  function applyTurn(state, turns) {
    const s = { token: !!state.token, bomb: !!state.bomb, open: !!state.open };
    if (turns > 0) s.open = false;
    return s;
  }

  // Wheels/ratchets still needed to finish the quest from here, walking the
  // remaining targets. Bounded: there are only ever three left.
  function turnsRemaining(pos, state) {
    let total = 0;
    let at = pos;
    let s = state;
    for (let guard = 0; guard < 4; guard++) {
      const target = rotationTarget(s);
      if (target === null) break;
      total += turnsTo(at, target);
      at = target;
      s = applyVisit(s, target);
    }
    return total;
  }

  // What you'd get by going down *right now*, in words.
  function positionOutcome(pos, state) {
    if (pos === 1) {
      return state.bomb
        ? 'you light the ancient bomb and the rubble goes away — the burial chamber opens'
        : 'a stairway buried under rubble you can\'t shift without the ancient bomb';
    }
    if (pos === 2) {
      return (state.token || state.bomb)
        ? 'rats — you refuse to go in while carrying quest loot, so nothing happens'
        : 'rats: one knocks you out and steals the coin. 30-35 HP for nothing';
    }
    if (pos === 3) {
      return state.token
        ? 'the bomb vending machine — your bronze token buys the ancient bomb'
        : 'the bomb vending machine, and you have no token to feed it';
    }
    if (pos === 4) {
      return (state.token || state.bomb)
        ? 'the basket of tokens — you already have what a token is for'
        : 'the basket of tokens — a free ancient bronze token';
    }
    return 'the bomb machine with rats prowling behind it — never gives anything';
  }

  const ROT_NAMES = {
    1: 'rubble-covered stairway',
    2: 'coin basket, rats',
    3: 'bomb vending machine',
    4: 'basket of tokens',
    5: 'bomb machine, rats',
  };

  // What you're carrying, as a short signature -- the "particular setup" a
  // logged visit is keyed on.
  function stateSig(state) {
    return (state.token ? 'T' : '-') + (state.bomb ? 'B' : '-') + (state.open ? 'O' : '-');
  }

  function alreadyVisited(log, pos, state) {
    const sig = stateSig(state);
    return (log || []).some((v) => v.pos === pos && v.sig === sig);
  }

  // THE ADVICE, kept DOM-free so it can be reasoned about and unit-tested.
  // Returns { tone, headline, lines } where tone is 'go' | 'turn' | 'stop'.
  function rotationAdvice(pos, state, log, canTurn) {
    const lines = [];
    const target = rotationTarget(state);
    const carrying = state.open ? 'the burial chamber is open'
      : state.bomb ? 'the ancient bomb'
        : state.token ? 'the ancient bronze token'
          : 'nothing yet';
    lines.push('Position ' + pos + '/5 — ' + ROT_NAMES[pos] + '. Carrying: ' + carrying + '.');

    if (target === null) {
      lines.push('Head down to the Lower Chambers and fight Ed the Undying — seven ' +
        'turns of combat, and getting beaten up or running away restarts him from ' +
        'full.');
      lines.push('Do NOT turn the peg again: that re-buries the stairway, and you would ' +
        'need a fresh token and a fresh bomb to dig it back out.');
      lines.push('Once Ed is dead, press Reset so this stops nagging you.');
      return { tone: 'stop', headline: 'STOP TURNING — the burial chamber is open.', lines };
    }

    const turns = turnsTo(pos, target);
    const total = turnsRemaining(pos, state);
    const prize = target === 4 ? 'the ancient bronze token'
      : target === 3 ? 'the ancient bomb'
        : 'the way into the burial chamber';

    let tone;
    let headline;
    if (turns === 0) {
      tone = 'go';
      headline = 'Go down NOW — this position gives you ' + prize + '.';
      lines.push('Head down to the Lower Chambers from here. Don\'t turn the peg first.');
      if (alreadyVisited(log, pos, state)) {
        lines.push('Note: a trip to position ' + pos + ' with this exact setup is already ' +
          'logged, so either it didn\'t take or the tracking is off. Fix it in the row below.');
      }
    } else {
      tone = 'turn';
      headline = 'Turn the peg ' + turns + ' more time' + (turns === 1 ? '' : 's') +
        ' — to position ' + target + ', for ' + prize + '.';
      lines.push('Don\'t go down here: ' + positionOutcome(pos, state) + '.');
      if (alreadyVisited(log, pos, state)) {
        lines.push('You already went down at position ' + pos + ' carrying the same thing — ' +
          'it gave you nothing then either.');
      }
    }

    lines.push('Wheels/ratchets to finish the whole quest from here: ' + total + '.');
    if (!canTurn) {
      lines.push('No peg option on this page, so you\'re out of both — restock with ' +
        'crumbling wooden wheels (Upper Chamber noncombat) or tomb ratchets (tomb rats ' +
        'in the Middle Chamber; a tangle of rat tails makes a tomb rat king that drops several).');
    }
    return { tone: tone, headline: headline, lines: lines };
  }

  // --- persistence ---------------------------------------------------------

  // localStorage is per-origin, so a multi would otherwise share one pyramid.
  // Best-effort: the charpane's charsheet link is the player name. Falls back
  // to a shared record rather than failing.
  function rotCharKey() {
    try {
      const cp = top.frames['charpane'];
      const a = cp && cp.document && cp.document.querySelector('a[href*="charsheet.php"]');
      const name = a && (a.textContent || '').trim();
      if (name) return ROT_KEY + ':' + name;
    } catch (e) { /* cross-frame access failed; fall back */ }
    return ROT_KEY;
  }

  // `pos` is the position we believe you're on and is what the advice uses;
  // `seen` is the raw number last scraped off the page. They're separate so
  // that a hand correction sticks: if the artwork is named differently live
  // than on the wiki we'd still read a *consistent* number, so the delta
  // between two page loads stays a correct turn count even when the absolute
  // value is wrong, and correcting `pos` once fixes the advice for good.
  function freshRot() {
    return {
      v: 1, pos: null, seen: null,
      token: false, bomb: false, open: false,
      log: [], t: Date.now(),
    };
  }

  function loadRot() {
    try {
      const rec = JSON.parse(localStorage.getItem(rotCharKey()));
      if (!rec || rec.v !== 1) return freshRot();
      // The quest is per-ascension, so a months-old record is almost certainly
      // from a previous run and would give confidently wrong advice.
      if (!rec.t || Date.now() - rec.t > ROT_STALE_MS) return freshRot();
      if (!Array.isArray(rec.log)) rec.log = [];
      return rec;
    } catch (e) {
      return freshRot();
    }
  }

  function saveRot(rec) {
    rec.t = Date.now();
    try {
      localStorage.setItem(rotCharKey(), JSON.stringify(rec));
    } catch (e) {
      console.error('Quest helper: could not save pyramid rotation state.', e);
    }
  }

  // --- reading the page ----------------------------------------------------

  // A choice.php option is usually a submit button whose label lives in @value,
  // but be liberal: it may render as a <button> or a plain link.
  function findOption(re) {
    const els = document.querySelectorAll('input[type="submit"], button, a');
    for (const el of els) {
      const label = (el.tagName === 'INPUT' ? el.value : el.textContent) || '';
      if (!re.test(label.trim())) continue;
      // Anchors: only the ones that actually go somewhere in-game, so we don't
      // pick up a menu item that happens to read the same.
      if (el.tagName === 'A' && !/(choice|adventure)\.php/i.test(el.getAttribute('href') || '')) {
        continue;
      }
      return el;
    }
    return null;
  }

  // The readout carved into the rings is the position indicator. The `a`/`b`
  // variants are the mid-rotation animation frames -- they mean "between two
  // positions", so they're no answer and we fall through to the label.
  const ROT_READOUT_SRC = /pyramid_readout(\d)([ab])?\.gif/i;

  function readReadoutPosition() {
    for (const img of document.images) {
      const m = (img.getAttribute('src') || '').match(ROT_READOUT_SRC);
      if (m && !m[2]) {
        const n = Number(m[1]);
        if (n >= 1 && n <= ROT_POSITIONS) return n;
      }
    }
    return null;
  }

  // The descend option is labelled "Head down to the Lower Chambers (N)", where
  // N is the position. Second opinion in case the artwork is named differently
  // live than on the wiki.
  function readLabelPosition(el) {
    if (!el) return null;
    const label = (el.tagName === 'INPUT' ? el.value : el.textContent) || '';
    const m = label.match(/\((\d)\)/);
    if (!m) return null;
    const n = Number(m[1]);
    return (n >= 1 && n <= ROT_POSITIONS) ? n : null;
  }

  // --- the handler ---------------------------------------------------------

  const rotationHandler = {
    locate() {
      const descend = findOption(/lower chamber/i);
      const wheel = findOption(/wheel on the peg/i);
      const ratchet = findOption(/ratchet on the peg/i);
      const readout = Array.from(document.images)
        .find((i) => ROT_READOUT_SRC.test(i.getAttribute('src') || '')) || null;
      const mount = (readout && readout.closest && readout.closest('table')) ||
        (descend && descend.closest && descend.closest('form')) || null;
      return { descend: descend, wheel: wheel, ratchet: ratchet, mount: mount, body: null };
    },

    // The bar's own button is no use here (nothing to trigger), so this handler
    // brings its own body: the advice, plus the manual-correction row.
    extras(puzzle, ctx, say) {
      const body = document.createElement('div');
      body.style.cssText = 'margin-top:5px';
      ctx.body = body;
      ctx.say = say;
      return body;
    },

    apply(puzzle, ctx, say) {
      const rec = loadRot();

      // Reconcile with the page before advising. A changed readout means the
      // peg was turned that many times since we last looked -- which is also
      // true if it was turned with the script disabled, since the delta is
      // still right mod 5. Advance the believed position by the same delta
      // rather than snapping it to the page, so a hand correction survives.
      const seen = readReadoutPosition() || readLabelPosition(ctx.descend);
      if (seen != null) {
        if (rec.seen == null) {
          rec.seen = seen;
          if (rec.pos == null) rec.pos = seen;
        } else if (seen !== rec.seen) {
          const turned = turnsTo(rec.seen, seen);
          Object.assign(rec, applyTurn(rec, turned));
          rec.pos = rec.pos == null ? seen : advance(rec.pos, turned);
          rec.seen = seen;
        }
        saveRot(rec);
      }

      if (rec.pos == null) {
        say('Can\'t tell which position the Lower Chambers are in — set it by hand below.', true);
        renderRotBody(puzzle, ctx, rec, null);
        return;
      }

      // Log the descent from the click, since it navigates away and we'd never
      // see how it went otherwise.
      if (ctx.descend) trackDescend(ctx.descend, rec);

      const canTurn = !!(ctx.wheel || ctx.ratchet);
      const advice = rotationAdvice(rec.pos, rec, rec.log, canTurn);
      say(advice.headline, ROT_TONE[advice.tone]);
      renderRotBody(puzzle, ctx, rec, advice);
    },
  };

  // Hook the "Head down to the Lower Chambers" option so the trip is recorded
  // with the setup you took into it. Nothing is clicked for you -- this only
  // watches. Capture phase plus the form's submit covers keyboard submission;
  // `done` keeps the pair from double-logging one trip.
  function trackDescend(el, rec) {
    if (el.dataset && el.dataset.tmQhRotTracked) return;
    let done = false;
    const record = () => {
      if (done) return;
      done = true;
      const fresh = loadRot();
      if (fresh.pos == null) fresh.pos = rec.pos;
      fresh.log.push({ pos: fresh.pos, sig: stateSig(fresh), t: Date.now() });
      if (fresh.log.length > 40) fresh.log = fresh.log.slice(-40);
      Object.assign(fresh, applyVisit(fresh, fresh.pos));
      saveRot(fresh);
    };
    el.addEventListener('click', record, true);
    const form = el.form || (el.closest && el.closest('form'));
    if (form) form.addEventListener('submit', record, true);
    if (el.dataset) el.dataset.tmQhRotTracked = '1';
  }

  // --- the bar's rotation body ---------------------------------------------

  // go = do it now, turn = keep cranking, stop = the trap at the end.
  const ROT_TONE = { go: '#060', turn: '#333', stop: '#a00' };

  function rotButton(label, on, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; // never submit the form we live next to
    b.className = 'button';
    b.textContent = label;
    b.style.cssText = 'margin:2px 2px 0 0;padding:1px 5px;font-size:10px' +
      (on ? ';font-weight:bold;outline:2px solid #336' : '');
    b.addEventListener('click', onClick);
    return b;
  }

  function renderRotBody(puzzle, ctx, rec, advice) {
    const body = ctx.body;
    if (!body) return;
    body.textContent = '';

    if (advice) {
      advice.lines.forEach((text) => {
        const p = document.createElement('div');
        p.style.cssText = 'margin-top:3px;color:' + (ROT_TONE[advice.tone] || '#333');
        p.textContent = text;
        body.appendChild(p);
      });
    }

    const rerender = () => {
      saveRot(rec);
      rotationHandler.apply(puzzle, ctx, ctx.say);
    };

    // Manual correction. Everything above is inferred from the artwork and from
    // your own clicks, so all of it has to be overridable -- if the tracking
    // drifts (script installed mid-quest, a trip that didn't happen, an
    // ascension) these buttons are the fix.
    const manual = document.createElement('div');
    manual.style.cssText = 'margin-top:6px;padding-top:5px;border-top:1px dotted #99a;color:#444';

    const note = document.createElement('div');
    note.style.cssText = 'font-style:italic;color:#666';
    note.textContent = 'Tracked from the readout and from your own trips down — ' +
      'correct it here if it drifted.';
    manual.appendChild(note);

    const posRow = document.createElement('div');
    posRow.style.cssText = 'margin-top:3px';
    posRow.appendChild(document.createTextNode('Position: '));
    for (let n = 1; n <= ROT_POSITIONS; n++) {
      posRow.appendChild(rotButton(String(n), rec.pos === n, ((v) => () => {
        rec.pos = v;
        rerender();
      })(n)));
    }
    manual.appendChild(posRow);

    const carryRow = document.createElement('div');
    carryRow.style.cssText = 'margin-top:3px';
    carryRow.appendChild(document.createTextNode('I have: '));
    [
      ['bronze token', 'token'],
      ['ancient bomb', 'bomb'],
      ['chamber open', 'open'],
    ].forEach(([label, key]) => {
      carryRow.appendChild(rotButton(label, !!rec[key], () => {
        rec[key] = !rec[key];
        rerender();
      }));
    });
    manual.appendChild(carryRow);

    const fixRow = document.createElement('div');
    fixRow.style.cssText = 'margin-top:3px';
    fixRow.appendChild(rotButton('Undo last trip (' + rec.log.length + ' logged)', false, () => {
      // For the trip that got recorded but didn't happen -- you were too drunk
      // to go in, or you hit back. Drop the log entry and reverse its effect.
      const last = rec.log.pop();
      if (last) Object.assign(rec, unapplyVisit(rec, last.pos));
      rerender();
    }));
    fixRow.appendChild(rotButton('Reset', false, () => {
      const fresh = freshRot();
      fresh.pos = rec.pos;
      Object.assign(rec, fresh);
      rerender();
    }));
    manual.appendChild(fixRow);

    body.appendChild(manual);
  }

  const HANDLERS = { selects: selectsHandler, tiles: tilesHandler, rotation: rotationHandler };

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

    // `warn` is a boolean for the two-state handlers; 'rotation' has three
    // outcomes (go / turn / stop) so it passes a colour instead.
    const say = (msg, warn) => {
      status.textContent = msg;
      status.style.color = typeof warn === 'string' ? warn : (warn ? '#a00' : '#060');
    };

    // A handler may bring its own body -- 'rotation' does, because it has state
    // to show and to let you correct, which one status line can't carry.
    if (typeof handler.extras === 'function') {
      const extra = handler.extras(puzzle, ctx, say);
      if (extra) bar.appendChild(extra);
    }

    // The button is what keeps a form-writing handler opt-in. A handler with
    // nothing to trigger (again, 'rotation') leaves `button` empty.
    if (puzzle.button) {
      const btn = document.createElement('button');
      btn.type = 'button'; // never submit the form we live next to
      btn.className = 'button';
      btn.textContent = puzzle.button;
      btn.style.cssText = 'margin-top:5px';
      btn.addEventListener('click', () => handler.apply(puzzle, ctx, say));
      bar.appendChild(btn);
    }

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

  // Highlighting and advising commit nothing, so 'tiles' and 'rotation' run on
  // sight (like mine-sparkle-highlight.js). 'selects' WRITES into the form, so
  // it stays strictly opt-in behind its button.
  if (puzzle.auto) handler.apply(puzzle, ctx, say);
})();
