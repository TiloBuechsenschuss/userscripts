// ==UserScript==
// @name         KoL Quest Helper
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/quest-helper.js
// @version      1.9
// @description  Helper for puzzle-y quest choice adventures and combat cues. It never submits or clicks anything on its own -- it fills in, highlights or explains the known-correct answer and leaves the actual move to you. Currently: Drawn Onward (choice 872), the photo frames in Dr. Awkward's office, sets the four photo dropdowns to the correct order; Beginning at the Beginning of Beginning (the Hidden Temple tile floor, tiles.php) glows the tile to step on in each row, spelling B-A-N-A-N-A-S from the bottom up, numbered in step order; Control Freak (choice 929), the pyramid control room, tracks the Lower Chambers rotation and tells you how many more times to turn the wheel, when to go down instead, and when to stop turning. Talk to Sven Golly (pandamonium.php?action=sven) gets an overview of the band -- who craves and hates what, which of the six items each one accepts, which of those you're carrying and where the rest drop -- plus a button per give that fills the dropdowns. On fight.php it watches the combat text for the one round where a move only works right now: a Junkyard gremlin presenting Yossarian's tool (use the molybdenum magnet) and a raver pulling his special dance move (cast Gothy Handwave), highlighting the message and offering to pick the item/skill in the dropdown for you. In the Mer-kin Colosseum it reads the gladiator's telegraph and names the skill that counters it -- Net Gain/Loss/Neutrality, Blade Sling/Roller/Runner or Ball Bust/Sweat/Sack -- says which of the three gladiatorial weapons this opponent needs, and warns when the one you are holding is the wrong one. For the scholar path it tracks the Mer-kin dreadscroll: the eight prophecy words are filed automatically from the pages that print them (the library card catalogue, a healscroll or killscroll in combat, a knucklebone, Deep Dark Visions, sushi with worktea), each failed reading is scored from the length of the Deep-Tainted Mind it cost and fed into a solver, and a "Mer-kin" button in the charpane, under the Current Quest block, opens the tracker anywhere. On the scroll itself it fills in every word it can name and leaves "Read Aloud" to you. Also reads the 8-Bit Realm Score in the charpane and turns its colour into a link to the zone that is currently paying double, with what to boost there.
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @match        https://www.kingdomofloathing.com/fight.php*
// @match        https://kingdomofloathing.com/fight.php*
// @match        https://www.kingdomofloathing.com/tiles.php*
// @match        https://kingdomofloathing.com/tiles.php*
// @match        https://www.kingdomofloathing.com/adventure.php*
// @match        https://kingdomofloathing.com/adventure.php*
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @match        https://www.kingdomofloathing.com/pandamonium.php*
// @match        https://kingdomofloathing.com/pandamonium.php*
// @match        https://www.kingdomofloathing.com/inv_use.php*
// @match        https://kingdomofloathing.com/inv_use.php*
// @match        https://www.kingdomofloathing.com/inventory.php*
// @match        https://kingdomofloathing.com/inventory.php*
// @match        https://www.kingdomofloathing.com/runskillz.php*
// @match        https://kingdomofloathing.com/runskillz.php*
// @match        https://www.kingdomofloathing.com/sushi.php*
// @match        https://kingdomofloathing.com/sushi.php*
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
  // charpane.php is here for the 8-Bit Realm score readout, which isn't a puzzle
  // page at all -- see its own section near the bottom. fight.php is here for the
  // combat cues, which aren't puzzles either but are the same shape: the answer is
  // knowable from the page and the game doesn't say it out loud. pandamonium.php
  // is here for Sven Golly's band, which is a puzzle with its own endpoint --
  // no whichchoice, so it gates on its own form being present. The last four
  // are the Mer-kin dreadscroll's doing: its clue words are printed by an item
  // use (inv_use/inventory), a skill cast (runskillz) and a plate of sushi.
  if (!/\/(choice|tiles|adventure|charpane|fight|pandamonium|inv_use|inventory|runskillz|sushi)\.php/i
    .test(location.pathname)) {
    return;
  }
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
  //              'combat'  -- the answer is "use this, this round"; we highlight
  //                           the message that says so and offer to pick the
  //                           item/skill in the dropdown.
  //              'counter' -- 'combat' with a choice of answers: the monster
  //                           telegraphs one of several specials and each has
  //                           its own counter skill (the Mer-kin Colosseum).
  //              'dreadscroll' -- the answer is eight words rolled per
  //                           ascension and learned a clue at a time; we track
  //                           what is known and offer to fill it in.
  //              'catalog' -- no answer at all, just which of the three library
  //                           clue words are still outstanding.
  // `auto`   - run the handler on sight instead of waiting for the button. Only
  //            for handlers that don't write into a form (see the note below);
  //            'dreadscroll' qualifies because its auto pass only reports, and
  //            the writing sits behind a button of its own.
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

    // --- combat cues (fight.php) -------------------------------------------
    // See the 'combat' handler's block comment for how these are detected. Both
    // entries auto-run (highlighting and advising commit nothing) and bring
    // their own button via `extras`, since it only makes sense on the round the
    // cue actually fires.

    {
      name: 'Yossarian\'s tools',
      page: /\/fight\.php/i,
      choice: null,
      type: 'combat',
      auto: true,
      button: '',
      hint: 'Watches for the round where the molybdenum magnet takes the gremlin\'s tool.',
      detect: (p) => !!combatSubject(p),
      // The tool-carrying variants only. KoL runs a second, tool-less copy of
      // each gremlin in the same zones (548/546/552/550), and only these four
      // ever hand anything over -- so identify by monster id, not by name.
      monsters: {
        549: 'molybdenum hammer',           // batwinged gremlin (tool)
        547: 'molybdenum crescent wrench',  // erudite gremlin (tool)
        553: 'molybdenum pliers',           // spider gremlin (tool)
        551: 'molybdenum screwdriver',      // vegetable gremlin (tool)
      },
      // Fallback when the id comment is missing. The two variants share a name,
      // so a name-only match can't tell them apart -- `ambiguous` is what makes
      // the advice hedge instead of promising a tool.
      names: {
        'batwinged gremlin': 'molybdenum hammer',
        'erudite gremlin': 'molybdenum crescent wrench',
        'spider gremlin': 'molybdenum pliers',
        'vegetable gremlin': 'molybdenum screwdriver',
      },
      ambiguous: true,
      marker: /^\s*moly\d+\s*$/i,
      texts: [
        'It whips out a hammer',
        'He whips out a crescent wrench',
        'It whips out a pair of pliers',
        'It whips out a screwdriver',
      ],
      act: { kind: 'item', value: '2497', name: 'molybdenum magnet', press: 'Use Item' },
      payoff: (prize) => 'it wrenches the ' + prize + ' out of its hand and ends the fight',
      waiting: 'Keep the fight going. The magnet only works on the round the gremlin ' +
        'presents its tool, and this isn\'t it — a use now just says "nothing happens" ' +
        '(which costs you no round, unless you funksling or the Black Cat interferes).',
      missing: 'Yossarian hands it over at the Junkyard when you turn up in Frat Warrior ' +
        'Fatigues, or in War Hippy Fatigues once you\'ve beaten enough frat boys.',
      notes: [
        { re: /nothing happens/i, text: 'That use missed the moment — the magnet did nothing.' },
      ],
    },

    {
      name: 'Raver dance moves',
      page: /\/fight\.php/i,
      choice: null,
      type: 'combat',
      auto: true,
      button: '',
      hint: 'Watches for the raver\'s special move, the one round Gothy Handwave studies.',
      detect: (p) => !!combatSubject(p),
      monsters: {
        855: 'Break It On Down',    // breakdancing raver
        856: 'Pop and Lock It',     // pop-and-lock raver
        857: 'Run Like the Wind',   // running man
      },
      names: {
        'breakdancing raver': 'Break It On Down',
        'pop-and-lock raver': 'Pop and Lock It',
        'running man': 'Run Like the Wind',
      },
      marker: /^\s*gh:\d+\s*$/i,
      // KoLmafia's own strings for the same six messages (each move has a hit
      // and a miss version), copied verbatim from NemesisDecorator.
      texts: [
        'the raver drops to the ground and whirls his legs around like a windmill',
        'The raver drops to the ground and starts spinning his legs wildly',
        'The raver\'s movements suddenly became spastic and jerky',
        'The raver\'s movements suddenly become spastic and jerky',
        'You watch him go, and soon realize he isn\'t actually running anywhere',
        'You start to give chase, but stop short when you realize that he hasn\'t ' +
          'actually gone anywhere at all',
      ],
      act: { kind: 'skill', value: '49', name: 'Gothy Handwave', press: 'the skill button' },
      payoff: (prize) => 'studying this move is how you learn ' + prize,
      waiting: 'Not this round — his special move comes when it comes. Keep the fight ' +
        'alive until it does; a handwave at any other moment is a wasted round.',
      missing: 'It\'s the Disco Bandit skill from A Girl in a Black Dress, and it is the ' +
        'only way to learn the ravers\' moves.',
      notes: [
        { re: /find the right moment/i,
          text: 'That handwave landed on the wrong move — nothing was learned.' },
        { re: /self-respect/i,
          text: 'Already handwaved this fight; it only works once per combat.' },
      ],
    },

    {
      name: 'Talk to Sven Golly',
      page: /\/pandamonium\.php/i,
      choice: null,
      type: 'sven',
      auto: true,
      button: '',
      hint: 'Works out who in the band wants what, and what each item is for.',
      // The form is the gate: Sven only shows it while the band is still hungry,
      // so this stays quiet on the rest of pandamonium.php and after the quest.
      detect: () => !!svenForm(),
    },
    // --- the Mer-kin Deepcity quest (The Sea) -------------------------------
    // The quest forks: you either become the Colosseum's champion (gladiator)
    // or read the dreadscroll aloud correctly (scholar). One entry for the
    // gladiator half and two for the scholar half -- the dreadscroll itself and
    // the library card catalogue that feeds it clues. See each handler's block
    // comment for the mechanics.

    {
      name: 'Mer-kin Colosseum',
      page: /\/fight\.php/i,
      choice: null,
      type: 'counter',
      auto: true,
      button: '',
      hint: 'Reads the gladiator\'s telegraph and names the skill that counters it.',
      detect: () => !!merkinGladiator(),
    },

    {
      name: 'Mer-kin dreadscroll',
      page: /\/choice\.php/i,
      choice: '703',
      type: 'dreadscroll',
      auto: true,
      button: '',
      hint: 'Shows which of the eight prophecy words are pinned down, and offers to fill them in.',
    },

    {
      name: 'Playing the Catalog Card',
      page: /\/choice\.php/i,
      choice: '704',
      type: 'catalog',
      auto: true,
      button: '',
      hint: 'Says which of the library\'s three clue words you still need.',
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
      return typeof p.detect === 'function' && p.detect(p);
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
  function charKey(base) {
    try {
      const cp = top.frames['charpane'];
      const a = cp && cp.document && cp.document.querySelector('a[href*="charsheet.php"]');
      const name = a && (a.textContent || '').trim();
      if (name) return base + ':' + name;
    } catch (e) { /* cross-frame access failed; fall back */ }
    return base;
  }

  function rotCharKey() {
    return charKey(ROT_KEY);
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

  // === 'combat' handler ====================================================
  //
  // Two fights in the game hinge on a move that only works on ONE round, and
  // the game gives you no warning that the round has arrived:
  //
  //   - A Junkyard gremlin carrying one of Yossarian's tools. Hold out the
  //     molybdenum magnet on the round it presents the tool and the tool is
  //     yours and the fight ends; any other round and "nothing happens".
  //   - A raver Outside the Club pulling his special dance move. Gothy Handwave
  //     on that round studies it (three studies teach you his skill, which the
  //     Disco Bandit nemesis quest needs); any other round and you're told you
  //     couldn't find the right moment, and it only works once per fight.
  //
  // DETECTION. Both are found the same way, and not by reading the prose:
  // KoL tags the round itself with an HTML comment of its own, which is exactly
  // what KoLmafia's relay override keys on. `<!--moly4-->` (any digit) marks the
  // gremlin round; `<!-- gh:50 -->` marks the raver's special move. Comments
  // survive into the DOM as comment nodes, so a TreeWalker finds them and their
  // parent element is the message to highlight.
  //
  // That marker is the primary signal because it's the game's own, and it does
  // not depend on flavour text that gets rewritten (the gremlins' messages were
  // rewritten on 27 August 2024, and the wiki's "the message must mention a
  // tool" rule is from before that). The wiki/KoLmafia message strings are kept
  // as a fallback for a page where the comment doesn't survive.
  //
  // WHO YOU'RE FIGHTING comes from `<!-- MONSTERID: 551 -->`, which is on every
  // fight page. That matters for the gremlins specifically: each Junkyard zone
  // runs a tool-carrying gremlin and an identically-named tool-less one, and
  // only the id tells them apart. `<span id='monname'>` is the fallback, and
  // because it can't make that distinction the advice hedges when it's used.
  //
  // Nothing is used or cast for you. The button only picks the item/skill in
  // KoL's own dropdown -- the same thing the 'selects' handler does, for the
  // same reason: a wrong entry here should cost you nothing but a click.
  //
  // UNVERIFIED against a live fight: the markers, the monster ids and the
  // dropdown markup all come from KoLmafia's test fixtures for these exact
  // fights (test/root/request/test_fight_gremlin_good.html and
  // test_raver_special_move_*.html) plus its monsters.txt, which is the closest
  // thing to real HTML available outside the game.

  const MONSTER_ID_COMMENT = /^\s*MONSTERID:\s*(\d+)\s*$/i;

  // Every comment node on the page, with the element it sits in. Cached: the
  // registry's `detect` runs this before anything else does.
  let commentCache = null;
  function pageComments() {
    if (commentCache) return commentCache;
    commentCache = [];
    try {
      const walk = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        commentCache.push({ data: n.data || '', el: n.parentElement || null });
      }
    } catch (e) {
      // No TreeWalker (or no document element) -- then there are no comments to
      // find, and everything below falls through to the text fallbacks.
    }
    return commentCache;
  }

  function readMonsterId() {
    for (const c of pageComments()) {
      const m = c.data.match(MONSTER_ID_COMMENT);
      if (m) return Number(m[1]);
    }
    return null;
  }

  // "You're fighting <span id='monname'>a vegetable gremlin</span>", minus the
  // article. Only a fallback -- see the block comment.
  function readMonsterName() {
    const el = document.querySelector('#monname');
    const raw = (el && el.textContent ? el.textContent : '').trim().toLowerCase();
    return raw.replace(/^(an?|the)\s+/, '');
  }

  // Who this cue is about, if anyone. DOM-free so the id/name precedence can be
  // tested. Returns { prize, certain } -- `certain` is false when only the name
  // matched on a cue whose names are shared with a monster that gives nothing.
  function combatSubjectFrom(puzzle, monsterId, monsterName) {
    if (!puzzle.monsters) return null;
    const byId = puzzle.monsters[monsterId];
    if (byId) return { prize: byId, certain: true };
    const byName = puzzle.names && puzzle.names[monsterName];
    if (byName) return { prize: byName, certain: !puzzle.ambiguous };
    return null;
  }

  function combatSubject(puzzle) {
    return combatSubjectFrom(puzzle, readMonsterId(), readMonsterName());
  }

  // Has the cue fired this round? `comments` is the list of comment strings and
  // `text` the page's visible text; DOM-free for the same reason as above.
  function cueFired(puzzle, comments, text) {
    if (puzzle.marker && (comments || []).some((c) => puzzle.marker.test(c))) return true;
    return (puzzle.texts || []).some((t) => (text || '').indexOf(t) !== -1);
  }

  // Anything the page is already telling you about a use that didn't work. KoL
  // does say these -- they're just easy to scroll past.
  function cueNotes(puzzle, text) {
    return (puzzle.notes || [])
      .filter((n) => n.re.test(text || ''))
      .map((n) => n.text);
  }

  // THE ADVICE, kept DOM-free so it can be reasoned about and unit-tested.
  // Returns { tone, headline, lines }, tone as the rotation handler's
  // 'go' | 'turn' | 'stop'.
  function cueAdvice(puzzle, subject, fired, hasAction, notes) {
    const act = puzzle.act;
    const where = act.kind === 'item' ? 'combat items' : 'skills';
    const lines = [];
    let tone;
    let headline;

    if (!fired) {
      tone = 'turn';
      headline = 'Not this round — hold the ' + act.name + '.';
      lines.push(puzzle.waiting);
    } else if (!hasAction) {
      tone = 'stop';
      headline = 'This is the round for the ' + act.name + ' — and it isn\'t in your ' +
        where + '.';
      lines.push(puzzle.missing);
    } else {
      tone = 'go';
      headline = (act.kind === 'item' ? 'Use the ' : 'Cast ') + act.name +
        ' NOW — ' + puzzle.payoff(subject.prize) + '.';
      lines.push('Nothing is used for you. The button below only picks it in KoL\'s own ' +
        'dropdown; you press ' + act.press + ' yourself.');
    }

    if (!subject.certain) {
      lines.push('Heads up: the page didn\'t give a monster id, and the tool-carrying and ' +
        'tool-less versions of this monster share a name — so this one may have nothing ' +
        'to give.');
    }
    (notes || []).forEach((n) => lines.push(n));
    return { tone: tone, headline: headline, lines: lines };
  }

  // --- reading the page ----------------------------------------------------

  // KoL writes the two dropdowns differently (`<option picurl=magnet2 value=2497>`
  // for items, `<option value="49" picurl="loop">` for skills), so match on the
  // value alone and walk up to whichever <select> holds it. Funkslinging puts a
  // second item dropdown on the page; the first one that offers it is fine.
  function findActionSelect(act) {
    const opts = document.querySelectorAll('option[value="' + act.value + '"]');
    for (const opt of opts) {
      const sel = opt.closest && opt.closest('select');
      if (sel) return { select: sel, option: opt };
    }
    return null;
  }

  // The element holding the round that fired, for the highlight.
  function findCueElement(puzzle) {
    if (puzzle.marker) {
      const hit = pageComments().find((c) => puzzle.marker.test(c.data));
      if (hit && hit.el) return hit.el;
    }
    for (const td of document.querySelectorAll('td')) {
      const text = td.textContent || '';
      if ((puzzle.texts || []).some((t) => text.indexOf(t) !== -1)) return td;
    }
    return null;
  }

  // Same gold pulse as the tile floor (and mine-sparkle-highlight.js), on the
  // shared timer. No step numbers here -- there's only ever one message.
  function markCue(el) {
    if (!el || (el.dataset && el.dataset.tmQhCue)) return;
    el.style.outline = '3px solid gold';
    el.style.outlineOffset = '2px';
    el.style.borderRadius = '3px';
    el.style.transition = 'box-shadow 0.45s ease-in-out';
    if (el.dataset) el.dataset.tmQhCue = '1';
    pulsing.push(el);
    startPulse();
  }

  // --- the handler ---------------------------------------------------------

  const combatHandler = {
    locate(puzzle) {
      const subject = combatSubject(puzzle);
      if (!subject) return null;
      const cueEl = findCueElement(puzzle);
      // Above the combat buttons is where you're already looking, and it's also
      // just under the round's text. Fall back to the highlighted message.
      const form = document.querySelector(
        'form[name=useitem], form[name=skill], form[name=attack]');
      const mount = (form && form.closest && (form.closest('center') || form)) ||
        (cueEl && cueEl.closest && cueEl.closest('table')) || null;
      return { subject: subject, cueEl: cueEl, mount: mount, before: !!form, body: null };
    },

    // Like the rotation handler, this brings its own body: the button only makes
    // sense on the round the cue actually fires, so it can't be the bar's.
    extras(puzzle, ctx, say) {
      const body = document.createElement('div');
      body.style.cssText = 'margin-top:5px';
      ctx.body = body;
      ctx.say = say;
      return body;
    },

    apply(puzzle, ctx, say) {
      const comments = pageComments().map((c) => c.data);
      const text = document.body ? (document.body.textContent || '') : '';
      const fired = cueFired(puzzle, comments, text);
      const found = findActionSelect(puzzle.act);
      const advice = cueAdvice(puzzle, ctx.subject, fired, !!found, cueNotes(puzzle, text));

      if (fired && ctx.cueEl) markCue(ctx.cueEl);
      say(advice.headline, ROT_TONE[advice.tone]);

      const body = ctx.body;
      if (!body) return;
      body.textContent = '';
      advice.lines.forEach((line) => {
        const p = document.createElement('div');
        p.style.cssText = 'margin-top:3px;color:' + (ROT_TONE[advice.tone] || '#333');
        p.textContent = line;
        body.appendChild(p);
      });

      if (!fired || !found) return;
      body.appendChild(rotButton('Select ' + puzzle.act.name, false, () => {
        found.select.value = found.option.value;
        found.select.dispatchEvent(new Event('change', { bubbles: true }));
        ctx.say(puzzle.act.name + ' is selected. Press ' + puzzle.act.press +
          ' yourself — this script never does.', ROT_TONE.go);
      }));
    },
  };

  // === 'sven' handler ======================================================
  //
  // Talk to Sven Golly (pandamonium.php?action=sven), the Hey Deze Arena side
  // quest that pays out Azazel's unicorn. Four demons in a band; each craves one
  // of white / soft / sweet / boozy and hates a different one of the same four,
  // and six items each carry exactly two of those traits. Hand every member
  // something they crave and don't hate and the band goes on.
  //
  // Unlike almost every other puzzle in the game this one does NOT reshuffle per
  // ascension (the wiki is explicit about that), so the whole solution is a
  // constant and solving it isn't the interesting part. The bookkeeping is. Two
  // facts make a wrong give expensive:
  //
  //   - the item is taken off you and thrown away whether or not it was right
  //     (KoLmafia's PandamoniumRequest removes it from inventory on every give,
  //     and the wiki's response texts have Sven eating/binning each refusal), and
  //   - the backstage noncombat that drops an item does not occur while you are
  //     already carrying one, so a replacement costs another trip through
  //     Infernal Rackets Backstage.
  //
  // Hence: show the answer before the dropdowns are touched, and — like every
  // other handler here — never submit. The buttons only pick the two dropdowns.
  //
  // UNVERIFIED against the live page: the form's shape is taken from KoLmafia's
  // PandamoniumRequest, which rewrites this exact form. It expects a
  // `<form name="bandcamp">` posting to pandamonium.php with action=sven and
  // preaction=try, a `bandmember` select whose options are bare names
  // (`<option>Bognort</option>` — no value attribute, so the value IS the name)
  // and a `togive` select of item ids. Members who have already been fed drop
  // out of the member select, which is what tells us who is left. Every read
  // here has a fallback and every one of them degrades to "show the table
  // anyway" rather than to a wrong claim.

  // The six items, with the two traits each carries. Ids are KoLmafia's
  // ItemPool constants (4670-4675) and are what the `togive` options carry.
  const SVEN_ITEMS = [
    { id: '4670', name: 'beer-scented teddy bear', traits: ['soft', 'boozy'],
      from: 'Suckubus? You Hardly Know Us!' },
    { id: '4671', name: 'booze-soaked cherry', traits: ['sweet', 'boozy'],
      from: 'Entour Rage', store: 'Gnomish Micromicrobrewery daily special, 120 Meat' },
    { id: '4672', name: 'comfy pillow', traits: ['soft', 'white'],
      from: 'A Pertinent Imp' },
    { id: '4673', name: 'giant marshmallow', traits: ['sweet', 'white'],
      from: 'Primo Donno', store: 'Chez Snootée daily special, 90 Meat' },
    { id: '4674', name: 'sponge cake', traits: ['sweet', 'soft'],
      from: 'Your Bassist Impulses', store: 'Chez Snootée daily special, 90 Meat' },
    { id: '4675', name: 'gin-soaked blotter paper', traits: ['white', 'boozy'],
      from: 'A Dicey Situation', store: 'Gnomish Micromicrobrewery daily special, 120 Meat' },
  ];

  // The solved band. Sven's own clue list is on the page above this bar; this is
  // what it works out to, per the wiki's walkthrough. Roles are here because the
  // clues (and KoLmafia's BAND_MEMBERS) name people both ways.
  const SVEN_BAND = [
    { name: 'Bognort', role: 'guitarist', craves: 'white', hates: 'soft' },
    { name: 'Stinkface', role: 'vocalist', craves: 'boozy', hates: 'sweet' },
    { name: 'Flargwurm', role: 'bassist', craves: 'sweet', hates: 'white' },
    { name: 'Jim', role: 'drummer', craves: 'soft', hates: 'boozy' },
  ];

  // --- the pure logic (DOM-free, so it can be unit-tested) ------------------

  // What a member does with an item. Three outcomes, not two: an item carrying
  // neither of their traits is merely shrugged at (and still eaten).
  function svenVerdict(member, item) {
    if (item.traits.indexOf(member.hates) !== -1) return 'hates';
    if (item.traits.indexOf(member.craves) !== -1) return 'takes';
    return 'shrugs';
  }

  function svenTakers(item) {
    return SVEN_BAND.filter((m) => svenVerdict(m, item) === 'takes');
  }

  // The items a member accepts, rarest first: an item only this member wants
  // comes before one shared with someone else. That ordering is what makes the
  // greedy allocation below safe — spending an exclusive item can never starve
  // anyone, because nobody else could have used it.
  function svenItemsFor(member) {
    return SVEN_ITEMS
      .filter((i) => svenVerdict(member, i) === 'takes')
      .sort((a, b) => svenTakers(a).length - svenTakers(b).length);
  }

  // Who to give what, given who's left and what's on hand.
  // `stock` is { itemId: count }; the plan spends it as it goes, so the two
  // members who share an item aren't both told to hand over the same one.
  function svenPlan(remaining, stock) {
    const left = Object.assign({}, stock || {});
    return remaining.map((member) => {
      const options = svenItemsFor(member);
      const give = options.find((i) => (left[i.id] || 0) > 0) || null;
      if (give) left[give.id] -= 1;
      return { member: member, options: options, give: give };
    });
  }

  // What's still in the bag once the plan has been carried out.
  function svenLeftovers(plan, stock) {
    const left = Object.assign({}, stock || {});
    plan.forEach((p) => { if (p.give) left[p.give.id] = (left[p.give.id] || 0) - 1; });
    return left;
  }

  // How one of a member's two options stands, given the plan as a whole. The
  // 'claimed' case is the one worth having: with a single blotter paper both
  // Bognort and Stinkface show it as something they'd accept, and marking
  // Stinkface's copy as available would be a straight lie about your inventory.
  function svenOptionState(plan, stock, row, item) {
    if (row.give === item) return { state: 'give' };
    if (!stock) return { state: 'unknown' };
    if ((svenLeftovers(plan, stock)[item.id] || 0) > 0) return { state: 'spare' };
    const claimed = plan.find((p) => p.give === item);
    if (claimed) return { state: 'claimed', by: claimed.member.name };
    return { state: 'missing' };
  }

  // The headline, same { tone, headline, lines } shape as the other handlers.
  function svenAdvice(plan, knewRemaining, knewStock) {
    const left = plan.length;
    const ready = plan.filter((p) => p.give).length;
    const who = left === 1 ? '1 is' : left + ' are';
    const lines = [];
    let tone;
    let headline;

    if (!knewStock) {
      tone = 'turn';
      headline = who + ' still waiting — couldn\'t read the item dropdown, so ' +
        'here\'s the answer table only.';
    } else if (ready === 0) {
      tone = 'turn';
      headline = who + ' still waiting, and you\'re carrying nothing any of them want.';
      lines.push('Everything on the list drops backstage at Infernal Rackets — but only ' +
        'while you aren\'t already carrying that item.');
    } else if (ready === left) {
      tone = 'go';
      headline = 'You\'re carrying something for all ' + (left === 1 ? 'that\'s' : left) +
        ' left. Give it to them one at a time.';
    } else {
      tone = 'go';
      headline = ready + ' of the ' + left + ' still waiting can be fed right now.';
    }

    if (!knewRemaining) {
      lines.push('Couldn\'t read the band-member dropdown, so all four are listed — ' +
        'skip anyone Sven has already stopped asking about.');
    }
    lines.push('A wrong item is eaten and gone either way, and its backstage noncombat ' +
      'won\'t come back while you\'re carrying one — so a slip costs turns, not just Meat.');
    return { tone: tone, headline: headline, lines: lines };
  }

  // --- reading the page ----------------------------------------------------

  function svenMemberNamed(text) {
    const t = (text || '').trim().toLowerCase();
    return SVEN_BAND.find((m) => m.name.toLowerCase() === t) || null;
  }

  function svenMemberSelect(form) {
    if (!form) return null;
    const named = form.querySelector('select[name="bandmember"]');
    if (named) return named;
    // Fallback: identify it by what it offers rather than by its name.
    return Array.from(form.querySelectorAll('select'))
      .find((s) => Array.from(s.options).some((o) => svenMemberNamed(o.textContent))) || null;
  }

  function svenItemSelect(form) {
    if (!form) return null;
    const named = form.querySelector('select[name="togive"]');
    if (named) return named;
    const member = svenMemberSelect(form);
    return Array.from(form.querySelectorAll('select')).find((s) => s !== member) || null;
  }

  // The give form. Sven only draws it while the band is still waiting, so its
  // absence is the quest being over (or not started) and we render nothing.
  function svenForm() {
    if (!/\/pandamonium\.php/i.test(location.pathname)) return null;
    const named = document.querySelector('form[name="bandcamp"]');
    if (named && svenMemberSelect(named)) return named;
    return Array.from(document.querySelectorAll('form'))
      .find((f) => !!svenMemberSelect(f)) || null;
  }

  // Who is still waiting. The member select lists exactly the unfed ones, so
  // that's the reading — null (not "all four") when it can't be read, so the
  // caller can say so instead of implying the quest is untouched.
  function svenRemaining(sel) {
    if (!sel) return null;
    const found = [];
    Array.from(sel.options).forEach((o) => {
      const m = svenMemberNamed(o.textContent);
      if (m && found.indexOf(m) === -1) found.push(m);
    });
    return found.length ? found : null;
  }

  function svenItemOfOption(o) {
    const byId = SVEN_ITEMS.find((i) => i.id === (o.value || '').trim());
    if (byId) return byId;
    const label = (o.textContent || '').trim().toLowerCase();
    return SVEN_ITEMS.find((i) => label.indexOf(i.name) !== -1) || null;
  }

  // What can be handed over right now, read off the item dropdown rather than
  // from api.php: the dropdown IS what the server will accept from you at this
  // moment. A trailing "(2)" is read as a count when KoL writes one.
  function svenStock(sel) {
    if (!sel) return null;
    const stock = {};
    Array.from(sel.options).forEach((o) => {
      const item = svenItemOfOption(o);
      if (!item) return;
      const m = (o.textContent || '').match(/\((\d+)\)\s*$/);
      stock[item.id] = (stock[item.id] || 0) + (m ? Number(m[1]) : 1);
    });
    return stock;
  }

  // --- the bar's body -------------------------------------------------------

  function svenLine(parent, text, css) {
    const el = document.createElement('div');
    el.style.cssText = css || '';
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  // Fills the two dropdowns and stops. Sven's own button stays yours to press.
  function svenFill(ctx, member, item, say) {
    const memberSel = svenMemberSelect(ctx.form);
    const itemSel = svenItemSelect(ctx.form);
    const okMember = !!memberSel &&
      selectOption(memberSel, { value: member.name, text: member.name });
    const okItem = !!itemSel && selectOption(itemSel, { value: item.id, text: item.name });
    if (!okMember || !okItem) {
      say('Couldn\'t set the dropdowns — pick ' + member.name + ' and the ' + item.name +
        ' by hand.', true);
      return;
    }
    say('Set to give ' + member.name + ' the ' + item.name + '. Press Sven\'s own button ' +
      'yourself — this script never submits.', ROT_TONE.go);
  }

  function renderSvenBody(ctx, plan, stock, say) {
    const body = ctx.body;
    if (!body) return;
    body.textContent = '';

    plan.forEach((row) => {
      const block = document.createElement('div');
      block.style.cssText = 'margin-top:6px;text-align:left';

      const head = document.createElement('div');
      const name = document.createElement('b');
      name.textContent = row.member.name;
      head.appendChild(name);
      head.appendChild(document.createTextNode(
        ' · ' + row.member.role + ' · craves ' + row.member.craves +
        ', hates ' + row.member.hates));
      block.appendChild(head);

      row.options.forEach((item) => {
        const how = svenOptionState(plan, stock, row, item);
        const source = item.from + (item.store ? ' (or ' + item.store + ')' : '');
        const line = document.createElement('div');
        line.style.cssText = 'margin-left:8px;color:' +
          (how.state === 'give' || how.state === 'spare' ? '#060' : '#555');

        if (how.state === 'give' || how.state === 'spare') {
          line.appendChild(document.createTextNode('✓ ' + item.name));
        } else if (how.state === 'claimed') {
          line.appendChild(document.createTextNode(
            '· ' + item.name + ' — your only one is going to ' + how.by +
            '; a second comes from ' + source));
        } else if (how.state === 'missing') {
          line.appendChild(document.createTextNode('✗ ' + item.name + ' — ' + source));
        } else {
          line.appendChild(document.createTextNode('• ' + item.name + ' — ' + source));
        }

        // Only the item this plan actually allocated gets a button: the other
        // one is either not on hand, spare, or already spoken for by the member
        // who shares it.
        if (how.state === 'give') {
          line.appendChild(document.createTextNode(' '));
          line.appendChild(rotButton('Fill in', false,
            () => svenFill(ctx, row.member, item, say)));
        }
        block.appendChild(line);
      });

      body.appendChild(block);
    });

    body.appendChild(svenLookupTable(stock));
  }

  // The six-item lookup: what each one is, who it satisfies, where it comes
  // from. Useful in the other direction from the per-member rows above — you're
  // holding a thing and want to know who it's for, or whether to bother.
  function svenLookupTable(stock) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:8px;padding-top:5px;border-top:1px dotted #99a';
    svenLine(wrap, 'All six items', 'text-align:left;font-weight:bold');

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;font-size:10px;text-align:left;border-collapse:collapse';

    const head = table.insertRow();
    ['Item', 'Wanted by', 'Drops from'].forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.cssText = 'text-align:left;color:#666;font-weight:normal;padding:1px 3px';
      head.appendChild(th);
    });

    SVEN_ITEMS.forEach((item) => {
      const have = stock ? (stock[item.id] || 0) > 0 : null;
      const tr = table.insertRow();
      tr.style.cssText = 'vertical-align:top;color:' + (have ? '#060' : '#333');

      const c1 = tr.insertCell();
      c1.style.cssText = 'padding:1px 3px';
      c1.textContent = (have ? '✓ ' : '') + item.name;
      svenLine(c1, item.traits.join(' + '), 'color:#777');

      const c2 = tr.insertCell();
      c2.style.cssText = 'padding:1px 3px';
      c2.textContent = svenTakers(item).map((m) => m.name).join(' or ');

      const c3 = tr.insertCell();
      c3.style.cssText = 'padding:1px 3px';
      c3.textContent = item.from;
      if (item.store) svenLine(c3, item.store, 'color:#777');
    });

    wrap.appendChild(table);
    svenLine(wrap, 'Every one of these drops backstage at Infernal Rackets, and none of ' +
      'them drops while you\'re already carrying it.', 'margin-top:4px;color:#666;text-align:left');
    return wrap;
  }

  // --- the handler ---------------------------------------------------------

  const svenHandler = {
    locate() {
      const form = svenForm();
      if (!form) return null;
      return { form: form, mount: form, body: null };
    },

    // Like the rotation and combat handlers, this brings its own body: there's a
    // table and a button per give, which one status line can't carry.
    extras(puzzle, ctx, say) {
      const body = document.createElement('div');
      body.style.cssText = 'margin-top:5px';
      ctx.body = body;
      ctx.say = say;
      return body;
    },

    apply(puzzle, ctx, say) {
      const remaining = svenRemaining(svenMemberSelect(ctx.form));
      const stock = svenStock(svenItemSelect(ctx.form));
      const plan = svenPlan(remaining || SVEN_BAND, stock || {});
      const advice = svenAdvice(plan, !!remaining, !!stock);

      say(advice.headline, ROT_TONE[advice.tone]);
      renderSvenBody(ctx, plan, stock, say);
      advice.lines.forEach((text) => {
        svenLine(ctx.body, text, 'margin-top:5px;color:#666;text-align:left');
      });
    },
  };

  // === 'counter' handler ===================================================
  //
  // The Mer-kin Colosseum -- the gladiator half of the Mer-kin Deepcity quest,
  // which you get into by wearing the Mer-kin Gladiatorial Gear. Fifteen
  // rounds: twelve ordinary gladiators in four sets of three (balldodger, then
  // netdragger, then bladeswitcher, in that order and repeating), then the
  // three champions in the same order. Set 1 uses no specials, set 2 one, set 3
  // two, set 4 all three; a champion pulls one EVERY round.
  //
  // Each gladiator has three special attacks. Each is countered by one specific
  // skill, and you only have that skill while the right weapon is equipped:
  //
  //   fighting a...   counter with the...   (his own weapon is the...)
  //   balldodger      Mer-kin dragnet       dodgeball
  //   netdragger      Mer-kin switchblade   dragnet
  //   bladeswitcher   Mer-kin dodgeball     switchblade
  //
  // -- always the NEXT weapon round the cycle, never the one he is carrying,
  // which is the thing that is easy to get backwards in the middle of a fight.
  //
  // Like the gremlin and raver cues this is a one-round window: the gladiator
  // telegraphs the special, and the counter has to go in on the round straight
  // after the telegraph. Unlike them, WHICH counter depends on which of the
  // three telegraphs fired, so an entry carries a list of specials rather than
  // one `act` and the handler picks between them.
  //
  // DETECTION is the telegraph sentence, matched against the page's flattened
  // text. KoL bolds the give-away word inside the sentence ("...trying to
  // <b>gain</b> an advantage over you..."), which is how the wiki indexes them,
  // but the markup is deliberately not used: textContent flattens it away, and
  // the sentence is far more distinctive than the word -- "gain", "loss" and
  // "sack" are ordinary English that turns up all over a combat page.
  //
  // Whether you CAN counter is read off KoL's own skill dropdown rather than
  // off your equipment, because that is the only honest test. The skills come
  // from the weapon, and the bladeswitcher's third special takes your weapon
  // away for the rest of the fight -- at which point its skills are gone too,
  // and no amount of reading an equipment page would have said so.
  //
  // UNVERIFIED against a live fight: the telegraph and outcome sentences and
  // the counter mapping are the wiki's (Mer-kin balldodger / netdragger /
  // bladeswitcher, and Mer-kin Colosseum); the monster ids and skill ids are
  // KoLmafia's monsters.txt and classskills.txt. The three champions are
  // assumed to reuse their own gladiator type's telegraphs -- the wiki's boss
  // pages still carry a NeedsSpading tag for exactly those messages -- so a
  // champion round that matches nothing falls back to the reference table
  // rather than guessing at a counter.

  const MERKIN_WEAPONS = {
    dodgeball: { id: '4292', name: 'Mer-kin dodgeball' },
    dragnet: { id: '4293', name: 'Mer-kin dragnet' },
    switchblade: { id: '4294', name: 'Mer-kin switchblade' },
  };

  // Each weapon grants exactly these three skills, so their presence in the
  // dropdown is what "that weapon is in your hand right now" means here.
  const MERKIN_WEAPON_SKILLS = {
    dodgeball: ['7085', '7086', '7087'],
    dragnet: ['7088', '7089', '7090'],
    switchblade: ['7091', '7092', '7093'],
  };

  // Who each weapon is FOR -- the inverse of the table above, used to say "you
  // are holding the wrong one, and here is who it was for".
  const MERKIN_COUNTERS = {
    dragnet: 'balldodger',
    switchblade: 'netdragger',
    dodgeball: 'bladeswitcher',
  };

  // `text` is the distinctive tail of the telegraph sentence -- what we match.
  // `word` is the word KoL bolds inside it, kept because it is how the wiki's
  // table is indexed and so what a player will recognise. `landed` is the
  // sentence printed when the special goes through uncountered; reporting that
  // is worth as much as the warning, since several of them change how the rest
  // of the fight has to be played.
  const MERKIN_ROLES = {
    balldodger: {
      key: 'balldodger',
      name: 'balldodger',
      weapon: 'dragnet',
      next: 'netdragger',
      specials: [
        {
          word: 'gain', skill: '7088', skillName: 'Net Gain',
          text: 'trying to gain an advantage over you',
          threat: 'he hurls the ball into your gut and leaves you Gutballed — -300% Muscle.',
          landed: 'You double over in a combination of several types of pain',
          after: 'Gutballed is -300% Muscle, and it is on you for the rest of this fight.',
        },
        {
          word: 'loss', skill: '7089', skillName: 'Net Loss',
          text: 'about to experience a serious loss of control',
          threat: 'something snaps inside him and he fights with doubled intensity.',
          landed: 'he begins to fight with doubled intensity',
          after: 'He hits harder now. Nothing to be done about it — finish him or run.',
        },
        {
          word: 'neutrality', skill: '7090', skillName: 'Net Neutrality',
          text: 'facial features take on an ominous neutrality',
          threat: 'every hit you land for the rest of the fight is cut to 1 damage.',
          landed: 'which are now glowing eerily',
          after: 'All your damage is 1 for the rest of this fight — weapons, spells, combat ' +
            'items and saucespheres alike. Run away and come back: you face the same ' +
            'gladiator, with the fight started over.',
        },
      ],
    },
    netdragger: {
      key: 'netdragger',
      name: 'netdragger',
      weapon: 'switchblade',
      next: 'bladeswitcher',
      specials: [
        {
          word: 'sling', skill: '7091', skillName: 'Blade Sling',
          text: 'fold his net up into some sort of a sling',
          threat: 'he slings the net and heals himself.',
          landed: 'uses it to quickly heal some of his broken bones',
          after: 'He healed — some of the damage you had already done is undone.',
        },
        {
          word: 'roller', skill: '7092', skillName: 'Blade Roller',
          text: 'rolls his net up and draws it back like a baseball bat',
          threat: 'he swats you with the rolled-up net and leaves you Nettled — -300% Moxie.',
          landed: 'making you significantly less pretty',
          after: 'Nettled is -300% Moxie for the rest of this fight.',
        },
        {
          word: 'runner', skill: '7093', skillName: 'Blade Runner',
          text: 'you\'d be tempted to run right now',
          threat: 'the barbed net takes half your maximum HP, and then he attacks as well.',
          landed: 'slicing you to ribbons with the sharp metal bits',
          after: 'That was half your maximum HP, and his normal attack lands on top of it. ' +
            'Check your health before the next round.',
        },
      ],
    },
    bladeswitcher: {
      key: 'bladeswitcher',
      name: 'bladeswitcher',
      weapon: 'dodgeball',
      next: 'balldodger',
      specials: [
        {
          word: 'bust', skill: '7085', skillName: 'Ball Bust',
          text: 'bust an especially dope move with his switchblade',
          threat: 'he reflects your damage back at you for the next ten rounds.',
          landed: 'so fast that you can\'t even see it anymore',
          after: 'Reflection is live for ten rounds: he takes 1 from everything and YOU take ' +
            'what he should have. Stall with a seal tooth or heal until it passes — and mind ' +
            'retaliation effects like Jalapeno Saucesphere, which come straight back at you.',
        },
        {
          word: 'sweat', skill: '7086', skillName: 'Ball Sweat',
          text: 'pauses to wipe the sweat from his brow',
          threat: 'he comes back at you with renewed vigor.',
          landed: 'comes at you with renewed vigor',
          after: 'He hits harder now.',
        },
        {
          word: 'sack', skill: '7087', skillName: 'Ball Sack',
          text: 'bottle of oil out of his sack',
          threat: 'he flicks your weapon out of your hand for the rest of the fight.',
          landed: 'wrenches your weapon out of your hand',
          after: 'Your weapon is gone for this fight, and with it the skills it granted — so ' +
            'there is nothing left to counter with. Run away; you face the same gladiator ' +
            'again, with your weapon back.',
        },
      ],
    },
  };

  // Ids from KoLmafia's monsters.txt. The three champions sit alongside their
  // own gladiator type. Unlike the Junkyard gremlins there is no same-named
  // decoy in this zone, so a name-only match here is not ambiguous.
  const MERKIN_MONSTERS = {
    842: 'balldodger', 879: 'balldodger',
    843: 'netdragger', 880: 'netdragger',
    844: 'bladeswitcher', 881: 'bladeswitcher',
  };
  const MERKIN_MONSTER_NAMES = {
    'mer-kin balldodger': 'balldodger',
    'mer-kin netdragger': 'netdragger',
    'mer-kin bladeswitcher': 'bladeswitcher',
    'georgepaul, the balldodger': 'balldodger',
    'johnringo, the netdragger': 'netdragger',
    'ringogeorge, the bladeswitcher': 'bladeswitcher',
  };
  const MERKIN_CHAMPIONS = { 879: true, 880: true, 881: true };

  // Who you are up against, if it is one of the six. DOM-free so the id/name
  // precedence can be tested. `champion` only changes the wording (a champion
  // specials every round), never the counter.
  function merkinGladiatorFrom(monsterId, monsterName) {
    const key = MERKIN_MONSTERS[monsterId] || MERKIN_MONSTER_NAMES[monsterName] || null;
    if (!key) return null;
    return {
      role: MERKIN_ROLES[key],
      champion: !!MERKIN_CHAMPIONS[monsterId] ||
        /^(georgepaul|johnringo|ringogeorge)\b/.test(monsterName || ''),
    };
  }

  function merkinGladiator() {
    return merkinGladiatorFrom(readMonsterId(), readMonsterName());
  }

  // Which of the three telegraphs is on the page, and whether one has already
  // landed uncountered. DOM-free; `text` is the page's flattened text.
  function merkinRead(role, text) {
    const t = text || '';
    return {
      telegraph: role.specials.find((s) => t.indexOf(s.text) !== -1) || null,
      landed: role.specials.find((s) => t.indexOf(s.landed) !== -1) || null,
    };
  }

  // The announcer's own line, and the same pattern KoLmafia reads the colosseum
  // round from. Null when the announcer is not on screen.
  const MERKIN_ROUND = /"Round (\d+)!"/;

  function merkinRound(text) {
    const m = (text || '').match(MERKIN_ROUND);
    if (!m) return null;
    const n = Number(m[1]);
    return n >= 1 && n <= 15 ? n : null;
  }

  // THE ADVICE, DOM-free so it can be reasoned about and unit-tested.
  // `armed` is the list of weapon keys whose skills are in KoL's dropdown right
  // now -- normally one, and none once the sack special has disarmed you.
  // Returns { tone, headline, lines }, tone as the rotation handler's
  // 'go' | 'turn' | 'stop'.
  function merkinAdvice(sub, read, armed, round) {
    const role = sub.role;
    const want = MERKIN_WEAPONS[role.weapon];
    const held = armed || [];
    const ready = held.indexOf(role.weapon) !== -1;
    const lines = [];
    let tone;
    let headline;

    if (read.telegraph && ready) {
      tone = 'go';
      headline = 'Counter with ' + read.telegraph.skillName + ' NOW — otherwise ' +
        read.telegraph.threat;
      lines.push('Nothing is cast for you. The button below only picks the skill in KoL\'s ' +
        'own dropdown; you press the skill button yourself.');
    } else if (read.telegraph) {
      tone = 'stop';
      headline = read.telegraph.skillName + ' is what stops this, and you haven\'t got it.';
      lines.push('That skill comes from the ' + want.name + ', and it is not in your skill ' +
        'dropdown — so either it is not equipped, or his "sack" special has already taken it.');
    } else if (ready) {
      tone = 'turn';
      headline = 'No telegraph this round. You are holding the right weapon for a ' +
        role.name + '.';
      lines.push('Keep the fight going and watch for one of the three sentences below. The ' +
        'counter has to go in on the round straight after the telegraph.');
    } else {
      tone = 'stop';
      headline = 'Wrong weapon: a ' + role.name + ' is countered with the ' + want.name + '.';
      lines.push('None of the ' + want.name + '\'s skills are in your dropdown. Run away and ' +
        're-equip — fleeing or losing here puts you back against the SAME gladiator, so it ' +
        'costs a turn and nothing else.');
    }

    if (!ready && held.length) {
      const other = MERKIN_WEAPONS[held[0]];
      const forWhom = MERKIN_COUNTERS[held[0]];
      lines.push('You look to be holding the ' + other.name + ', which is the one for a ' +
        forWhom + '.');
    }

    if (read.landed) {
      lines.push('His "' + read.landed.word + '" special went through: ' + read.landed.after);
    }

    if (sub.champion) {
      lines.push('This is a champion — he pulls one of his three specials every single round, ' +
        'so expect a telegraph on each one.');
    } else if (round != null) {
      lines.push('Round ' + round + ' of 15. The sets of three get harder: rounds 1-3 use no ' +
        'specials, 4-6 one, 7-9 two, 10-12 all three, and 13-15 are the champions.');
    }

    const nextRole = MERKIN_ROLES[role.next];
    lines.push('Next round is a ' + nextRole.name + ', and that one wants the ' +
      MERKIN_WEAPONS[nextRole.weapon].name + '.');

    return { tone: tone, headline: headline, lines: lines };
  }

  // --- reading the page ----------------------------------------------------

  // Which gladiatorial weapons' skills KoL is offering right now.
  function merkinArmed() {
    return Object.keys(MERKIN_WEAPON_SKILLS).filter((key) =>
      MERKIN_WEAPON_SKILLS[key].some((id) => !!findActionSelect({ value: id })));
  }

  // The cell holding the telegraph, for the highlight.
  function merkinCueElement(special) {
    for (const td of document.querySelectorAll('td')) {
      if ((td.textContent || '').indexOf(special.text) !== -1) return td;
    }
    return null;
  }

  // --- the handler ---------------------------------------------------------

  const counterHandler = {
    locate() {
      const sub = merkinGladiator();
      if (!sub) return null;
      // Above the block of combat buttons, same as the 'combat' handler and for
      // the same reason: the advice has to be read before they are pressed.
      const form = document.querySelector(
        'form[name=useitem], form[name=skill], form[name=attack]');
      const mount = (form && form.closest && (form.closest('center') || form)) || null;
      return { sub: sub, mount: mount, before: !!form, body: null };
    },

    // Same reason as the 'combat' handler: the button only exists on the round
    // a telegraph fires, and there is a three-row reference table besides, so
    // this brings its own body rather than using the bar's single button.
    extras(puzzle, ctx, say) {
      const body = document.createElement('div');
      body.style.cssText = 'margin-top:5px';
      ctx.body = body;
      ctx.say = say;
      return body;
    },

    apply(puzzle, ctx, say) {
      const text = document.body ? (document.body.textContent || '') : '';
      const role = ctx.sub.role;
      const read = merkinRead(role, text);
      const advice = merkinAdvice(ctx.sub, read, merkinArmed(), merkinRound(text));

      if (read.telegraph) {
        const cue = merkinCueElement(read.telegraph);
        if (cue) markCue(cue);
      }
      say(advice.headline, ROT_TONE[advice.tone]);

      const body = ctx.body;
      if (!body) return;
      body.textContent = '';
      advice.lines.forEach((line) => {
        const p = document.createElement('div');
        p.style.cssText = 'margin-top:3px;color:' + (ROT_TONE[advice.tone] || '#333');
        p.textContent = line;
        body.appendChild(p);
      });

      // The reference table sits here on every round, not only the one that
      // fires: between rounds the useful question is "which of his three was
      // that, and what am I watching for next".
      body.appendChild(merkinTable(role, read.telegraph));

      const found = read.telegraph && findActionSelect({ value: read.telegraph.skill });
      if (!found) return;
      const skillName = read.telegraph.skillName;
      body.appendChild(rotButton('Select ' + skillName, false, () => {
        found.select.value = found.option.value;
        found.select.dispatchEvent(new Event('change', { bubbles: true }));
        ctx.say(skillName + ' is selected. Press the skill button yourself — this script ' +
          'never does.', ROT_TONE.go);
      }));
    },
  };

  // The three specials of whoever you are fighting, with the one that fired
  // marked. Same shape as the Sven lookup table and there for the same reason.
  function merkinTable(role, firedSpecial) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:8px;padding-top:5px;border-top:1px dotted #99a';

    const head = document.createElement('div');
    head.style.cssText = 'text-align:left;font-weight:bold';
    head.textContent = 'A ' + role.name + '\'s three specials — countered with the ' +
      MERKIN_WEAPONS[role.weapon].name;
    wrap.appendChild(head);

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;font-size:10px;text-align:left;border-collapse:collapse';

    const hr = table.insertRow();
    ['He does this…', 'Counter', 'Or else'].forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.cssText = 'text-align:left;color:#666;font-weight:normal;padding:1px 3px';
      hr.appendChild(th);
    });

    role.specials.forEach((s) => {
      const fired = !!firedSpecial && firedSpecial.word === s.word;
      const tr = table.insertRow();
      tr.style.cssText = 'vertical-align:top;color:' + (fired ? '#060' : '#333') +
        (fired ? ';font-weight:bold' : '');

      const c1 = tr.insertCell();
      c1.style.cssText = 'padding:1px 3px';
      c1.textContent = (fired ? '→ ' : '') + '…' + s.text + '…';

      const c2 = tr.insertCell();
      c2.style.cssText = 'padding:1px 3px;white-space:nowrap';
      c2.textContent = s.skillName;

      const c3 = tr.insertCell();
      c3.style.cssText = 'padding:1px 3px';
      c3.textContent = s.threat;
    });

    wrap.appendChild(table);
    return wrap;
  }


  // === the Mer-kin dreadscroll (the scholar path) ==========================
  //
  // The other half of the Mer-kin Deepcity quest. You get the dreadscroll from
  // the Mer-kin Library and reading it aloud correctly makes you High Priest --
  // but it is a prophecy with EIGHT words that "fade, and flicker, and shift",
  // rendered as eight dropdowns (pro1..pro8) of four options each. Get all
  // eight right and the quest is done; get any wrong and you take Deep-Tainted
  // Mind and have to wait it out. Both outcomes cost an adventure.
  //
  // The eight right words are rolled per ascension, so there is no answer to
  // put in a table here -- what there is instead is bookkeeping, which is
  // exactly the shape of the Sven Golly entry. Each slot has its own source in
  // the world, and a clue only turns up when you happen to do the thing:
  //
  //   1 adjective   Mer-kin Library, the book with a word scrawled in blood
  //   2 ___fish     using a Mer-kin healscroll in combat
  //   3 House of    casting Deep Dark Visions
  //   4 direction   using a Mer-kin knucklebone
  //   5 colour      using a Mer-kin killscroll in combat
  //   6 adjective   Mer-kin Library, the book about <blank> creatures
  //   7 animal      eating sushi while carrying Mer-kin worktea
  //   8 the birth   Mer-kin Library, the book with one phrase over and over
  //
  // (Three of those are the library's card catalogue, which is why the scholar
  // path runs through the library at all. The healscroll and killscroll only
  // give a word once you have studied Mer-kin wordquizzes -- each 10% of
  // vocabulary adds 10% to the chance -- and the wordquizzes also thin the
  // catalogue down until only the three clue books are left.)
  //
  // So this does three things, none of which submits anything:
  //
  //   HARVEST. Every page the script sees is scanned for the eight clue
  //   sentences and the word each one carries is filed against its slot. The
  //   sentences come from KoLmafia's DreadScrollManager, which reads the same
  //   messages; the difference is that we match the CONTEXT and then look for
  //   one of the four known words, instead of pulling whatever sits inside a
  //   <b> tag. That is deliberate -- it does not depend on KoL's markup, and it
  //   cannot mistake a word for a clue when the four options are all on screen
  //   at once, which is exactly what the dreadscroll page looks like.
  //
  //   DEDUCE. A failed reading is not a wasted turn: the length of the
  //   Deep-Tainted Mind you get is three adventures per WRONG word, so every
  //   failure says how many of your eight picks were right. That plus the clues
  //   is a Mastermind position, and `dreadSolve` filters all 4^8 arrangements
  //   against it. Slots the deduction pins down are as good as clued.
  //
  //   REPORT. A bar on the scroll itself, a bar on the card catalogue, and a
  //   panel behind the menu button (the tracker is useful between visits, not
  //   only when the scroll is open).
  //
  // UNVERIFIED against a live page: the dropdown option LABELS. The words below
  // are KoLmafia's -- it decorates this same choice by matching option text --
  // but the wiki transcribes the second option of slot 1 as "double" where
  // KoLmafia has "doubled", and nothing available outside the game settles it.
  // `dreadMatchOption` is therefore deliberately loose (exact, then either
  // string a prefix of the other) and every slot carries the clue wording and
  // the dropdown wording separately, since half of them genuinely differ.

  const DREAD_KEY = 'tm-merkin-dread';
  const DREAD_STALE_MS = 60 * 24 * 60 * 60 * 1000; // rolled per ascension

  // The eight slots, in the order they appear in the prophecy -- which is also
  // the order of KoLmafia's CLUE_DATA, so the two can be compared line by line.
  //   `clue`    what KoL prints in the clue message.
  //   `word`    what the dreadscroll's own dropdown shows.
  //   `alt`     a second spelling to accept in the dropdown; see the note above.
  //   `gate`    a phrase that must be on the page before we read a clue from it.
  //   `harvest` pulls the clue word out, anchored on its own sentence.
  const DREAD_SLOTS = [
    {
      n: 1,
      label: 'the adjective',
      source: 'Mer-kin Library — the book with a word scrawled inside the cover',
      library: true,
      gate: 'somebody has scrawled',
      harvest: /somebody has scrawled\s*["'“”]?\s*([A-Za-z][A-Za-z-]*)/i,
      options: [
        { clue: 'LONELY', word: 'lonely' },
        { clue: 'DOUBLED', word: 'doubled', alt: 'double' },
        { clue: 'THRICE-CURSED', word: 'thrice-cursed' },
        { clue: 'FOURTH', word: 'fourth' },
      ],
    },
    {
      n: 2,
      label: 'the fish',
      source: 'a Mer-kin healscroll used in combat',
      gate: 'a magnificent',
      harvest: /a magnificent\s+([a-z]+fish)\b/i,
      options: [
        { clue: 'starfish', word: 'starfish' },
        { clue: 'moonfish', word: 'moonfish' },
        { clue: 'sunfish', word: 'sunfish' },
        { clue: 'planetfish', word: 'planetfish' },
      ],
    },
    {
      n: 3,
      label: 'the House',
      source: 'casting Deep Dark Visions',
      // Gated hard: all four Houses are printed on the dreadscroll page itself,
      // so without the vision's own sentence this would read a clue off the
      // form we are standing in front of.
      gate: 'visions wash over you',
      harvest: /\bthe House of (Cards|Blues|Pancakes|Pain)\b/i,
      options: [
        { clue: 'Cards', word: 'Cards' },
        { clue: 'Blues', word: 'Blues' },
        { clue: 'Pancakes', word: 'Pancakes' },
        { clue: 'Pain', word: 'Pain' },
      ],
    },
    {
      n: 4,
      label: 'the Current',
      source: 'a Mer-kin knucklebone',
      gate: 'it bounces straight',
      harvest: /it bounces straight\s+([a-z]+)/i,
      options: [
        { clue: 'north', word: 'Northern' },
        { clue: 'south', word: 'Southern' },
        { clue: 'east', word: 'Eastern' },
        { clue: 'west', word: 'Western' },
      ],
    },
    {
      n: 5,
      label: 'the colour',
      source: 'a Mer-kin killscroll used in combat',
      gate: 'recognize one of them',
      harvest: /recognize one of them:\s*["'“”]?\s*([a-z]+)/i,
      options: [
        { clue: 'red', word: 'as red as blood' },
        { clue: 'black', word: 'as black as ink' },
        { clue: 'green', word: 'as green as bile' },
        { clue: 'yellow', word: 'as yellow as piss' },
      ],
    },
    {
      n: 6,
      label: 'the creature\'s adjective',
      source: 'Mer-kin Library — the book about a kind of creature',
      library: true,
      gate: 'a lot of references to',
      harvest: /a lot of references to\s+([a-z-]+)\s+creatures/i,
      options: [
        { clue: 'blind', word: 'blind' },
        { clue: 'giant', word: 'giant' },
        { clue: 'finless', word: 'finless' },
        { clue: 'two-headed', word: 'two-headed' },
      ],
    },
    {
      n: 7,
      label: 'the creature',
      source: 'eating sushi while carrying Mer-kin worktea',
      gate: 'the leaves in the bottom',
      harvest: /the leaves in the bottom look just like\s+(an?\s+[a-z]+)/i,
      options: [
        { clue: 'an eel', word: 'eel' },
        { clue: 'a turtle', word: 'turtle' },
        { clue: 'a shark', word: 'shark' },
        { clue: 'a whale', word: 'whale' },
      ],
    },
    {
      n: 8,
      label: 'the birth',
      source: 'Mer-kin Library — the book with one phrase over and over',
      library: true,
      gate: 'consists of the phrase',
      harvest: /consists of the phrase\s+(.{1,44}?)\s+over and over/i,
      options: [
        { clue: 'one thousand squirming young', word: 'one thousand squirming young' },
        { clue: 'two and twenty stillborn spawn', word: 'two and twenty stillborn spawn' },
        { clue: 'conjoined triplets', word: 'conjoined triplets' },
        { clue: 'a brand new dance craze', word: 'a brand new dance craze' },
      ],
    },
  ];

  // Nine separators around the eight holes; joining them with the picks is the
  // prophecy as KoL prints it (and as KoLmafia's getScrollText assembles it).
  const DREAD_TEMPLATE = [
    'When the ', ' ', ' is in the House of ', ',\nand the ', ' Current runs ',
    ',\nwhen a ', ' ', ' births ', ',\nthe Elder shall awaken.',
  ];

  // How many turns of Deep-Tainted Mind mean how many wrong words. KoL grants
  // three per wrong word, but the reading itself burns the first turn -- and
  // two of them if you surfaced without Fishy -- so the number on screen can be
  // 3x, 3x-1 or 3x-2. Ceiling divides all three back to x, and nothing else
  // does, which is why this is not a plain division.
  function dreadWrongFromDuration(turns) {
    const n = Number(turns);
    if (!isFinite(n) || n < 1) return null;
    const wrong = Math.ceil(n / 3);
    return wrong >= 1 && wrong <= 8 ? wrong : null;
  }

  // --- the solver (DOM-free, unit-tested) ----------------------------------

  // Everything still consistent with what we know: the confirmed clues, and how
  // many words each failed reading got wrong. There are only 4^8 = 65,536
  // arrangements, so this brute-forces rather than deducing -- it runs in a few
  // milliseconds and cannot be subtly wrong the way hand-rolled deduction can.
  //
  // `known` is eight entries, 0 for unknown or 1-4 for a confirmed option.
  // `guesses` is [{ picks: [8 x 1-4], wrong: n }]; a guess with an unreadable
  // pick is ignored rather than half-applied, and counted in `ignored` so the
  // UI can say so instead of quietly dropping it.
  //
  // Returns { count, alive, pinned, solution, used, ignored }:
  //   count     arrangements still possible (0 means the inputs contradict).
  //   alive     per slot, the option numbers that survive somewhere.
  //   pinned    per slot, the option number when only one survives, else 0.
  //   solution  the eight picks when exactly one arrangement is left, else null.
  function dreadSolve(known, guesses) {
    const fixed = [];
    for (let i = 0; i < 8; i++) {
      const k = Number((known || [])[i]) || 0;
      fixed.push(k >= 1 && k <= 4 ? k : 0);
    }

    const all = guesses || [];
    const usable = all.filter((g) => g && Array.isArray(g.picks) && g.picks.length === 8 &&
      g.picks.every((p) => p >= 1 && p <= 4) &&
      Number.isFinite(Number(g.wrong)) && g.wrong >= 0 && g.wrong <= 8);

    const alive = [];
    for (let i = 0; i < 8; i++) alive.push({});
    let count = 0;
    let solution = null;
    const combo = new Array(8);

    (function walk(slot) {
      if (slot === 8) {
        for (const g of usable) {
          let right = 0;
          for (let i = 0; i < 8; i++) if (g.picks[i] === combo[i]) right++;
          if (right !== 8 - g.wrong) return;
        }
        count++;
        if (count === 1) solution = combo.slice();
        for (let i = 0; i < 8; i++) alive[i][combo[i]] = true;
        return;
      }
      if (fixed[slot]) {
        combo[slot] = fixed[slot];
        walk(slot + 1);
        return;
      }
      for (let v = 1; v <= 4; v++) {
        combo[slot] = v;
        walk(slot + 1);
      }
    })(0);

    const aliveLists = alive.map((set) =>
      [1, 2, 3, 4].filter((v) => set[v]));
    return {
      count: count,
      alive: aliveLists,
      pinned: aliveLists.map((l) => (l.length === 1 ? l[0] : 0)),
      solution: count === 1 ? solution : null,
      used: usable.length,
      ignored: all.length - usable.length,
    };
  }

  // The prophecy as it currently reads. `picks` is eight entries, 0 for a word
  // we cannot name yet. DOM-free so the assembly can be tested.
  function dreadProphecy(picks) {
    let out = DREAD_TEMPLATE[0];
    for (let i = 0; i < 8; i++) {
      const v = Number((picks || [])[i]) || 0;
      out += v ? DREAD_SLOTS[i].options[v - 1].word : '???';
      out += DREAD_TEMPLATE[i + 1];
    }
    return out;
  }

  // --- persistence ---------------------------------------------------------

  function freshDread() {
    return {
      v: 1,
      known: [0, 0, 0, 0, 0, 0, 0, 0],
      guesses: [],         // { picks: [8], wrong: n, t }
      catalog: {},         // card-catalogue option -> slot index, or -1 for a dud
      pending: null,       // picks stashed when "Read Aloud" was pressed
      pendingCatalog: null, // { option, t } stashed when a book was pressed
      done: false,
      t: Date.now(),
    };
  }

  function loadDread() {
    try {
      const rec = JSON.parse(localStorage.getItem(charKey(DREAD_KEY)));
      if (!rec || rec.v !== 1) return freshDread();
      // The words are rolled per ascension, so an old record would be
      // confidently wrong. Same reasoning as the pyramid's staleness check.
      if (!rec.t || Date.now() - rec.t > DREAD_STALE_MS) return freshDread();
      if (!Array.isArray(rec.known) || rec.known.length !== 8) rec.known = freshDread().known;
      if (!Array.isArray(rec.guesses)) rec.guesses = [];
      if (!rec.catalog || typeof rec.catalog !== 'object') rec.catalog = {};
      return rec;
    } catch (e) {
      return freshDread();
    }
  }

  function saveDread(rec) {
    rec.t = Date.now();
    try {
      localStorage.setItem(charKey(DREAD_KEY), JSON.stringify(rec));
    } catch (e) {
      console.error('Quest helper: could not save Mer-kin dreadscroll clues.', e);
    }
  }

  // --- harvesting clues off whatever page we are on ------------------------

  // Which option a clue word names, or 0. The clue wording is matched, not the
  // dropdown wording, and loosely: KoL prints the slot-1 words in capitals and
  // the worktea one with its article.
  function dreadClueIndex(slot, found) {
    const want = String(found || '').trim().toLowerCase().replace(/[.,!"'“”]+$/, '');
    if (!want) return 0;
    for (let i = 0; i < slot.options.length; i++) {
      const o = slot.options[i];
      const clue = o.clue.toLowerCase();
      if (clue === want || clue.replace(/^an?\s+/, '') === want.replace(/^an?\s+/, '')) {
        return i + 1;
      }
    }
    return 0;
  }

  // One pass over the page text for all eight clue sentences. DOM-free so it
  // can be run against fixtures. Returns { slotIndex: optionNumber }.
  function dreadHarvest(text) {
    const found = {};
    const t = text || '';
    DREAD_SLOTS.forEach((slot, i) => {
      if (slot.gate && t.indexOf(slot.gate) === -1) return;
      const m = t.match(slot.harvest);
      if (!m) return;
      const n = dreadClueIndex(slot, m[1]);
      if (n) found[i] = n;
    });
    return found;
  }

  // How a reading of the scroll turned out, read off the result page. DOM-free.
  // Returns 'won', a number of wrong words, or null when this page says neither.
  function dreadOutcome(text) {
    const t = text || '';
    if (t.indexOf('you\'re the Mer-kin High Priest now') !== -1) return 'won';
    const i = t.indexOf('Deep-Tainted Mind');
    if (i === -1) return null;
    const m = t.slice(i).match(/\((?:duration:\s*)?(\d+)\s+Adventures?\)/i);
    if (!m) return null;
    return dreadWrongFromDuration(m[1]);
  }

  // A card-catalogue book that turned out to hold no clue. Ten of the thirteen
  // read this way, and knowing which ones is worth as much as knowing which
  // three do -- every press costs an adventure either way.
  const DREAD_CATALOG_DUD = 'you\'re just not sure what';
  const DREAD_PENDING_MS = 10 * 60 * 1000;

  // Run on every page the script sees. Everything here is additive and quiet:
  // it files clues, closes out a reading we stashed, and writes nothing to the
  // page. A clue already recorded is left alone rather than overwritten, so a
  // stale page in a back-button history cannot un-learn something.
  function harvestDreadClues() {
    const text = document.body ? (document.body.textContent || '') : '';
    if (!text) return;

    const clues = dreadHarvest(text);
    const clued = Object.keys(clues);
    const dud = text.indexOf(DREAD_CATALOG_DUD) !== -1;
    const outcome = dreadOutcome(text);
    if (!clued.length && !dud && outcome == null) return;

    const rec = loadDread();
    const pendingBook = rec.pendingCatalog &&
      Date.now() - (rec.pendingCatalog.t || 0) < DREAD_PENDING_MS
      ? rec.pendingCatalog.option : null;

    clued.forEach((k) => {
      const i = Number(k);
      // The catalogue's books are regenerated per ascension, so the only way to
      // learn which button gives which clue is to watch what came back from the
      // one that was pressed. Recorded even when the word itself is old news.
      if (DREAD_SLOTS[i].library && pendingBook != null) rec.catalog[pendingBook] = i;
      if (!rec.known[i]) rec.known[i] = clues[i];
    });
    if (pendingBook != null && dud && !clued.length) rec.catalog[pendingBook] = -1;
    if (pendingBook != null && (clued.length || dud)) rec.pendingCatalog = null;

    if (outcome != null) {
      const picks = rec.pending;
      rec.pending = null;
      if (outcome === 'won') {
        rec.done = true;
        // A correct reading names all eight words outright, which beats every
        // other source -- so it overwrites, where a clue would not.
        if (picks && picks.length === 8 && picks.every((p) => p >= 1 && p <= 4)) {
          rec.known = picks.slice();
        }
      } else if (picks) {
        rec.guesses.push({ picks: picks, wrong: outcome, t: Date.now() });
        if (rec.guesses.length > 40) rec.guesses = rec.guesses.slice(-40);
      }
    }

    saveDread(rec);
  }

  // --- reading and writing the scroll's own form ---------------------------

  // Does this dropdown option name that word? Loose on purpose -- see the
  // UNVERIFIED note above: exact match first, then either string being a prefix
  // of the other, which is what covers "double" against "doubled".
  function dreadMatchOption(optionText, option) {
    const got = String(optionText || '').trim().toLowerCase();
    if (!got) return false;
    const words = [option.word];
    if (option.alt) words.push(option.alt);
    return words.some((w) => {
      const want = w.toLowerCase();
      return got === want || got.indexOf(want) === 0 || want.indexOf(got) === 0;
    });
  }

  // The eight dropdowns, in prophecy order. KoL names them pro1..pro8 (which is
  // how KoLmafia reads a failed reading back out of the submitted URL); the
  // by-content fallback is there because a select is only useful to us if we
  // can tell WHICH slot it is, and its own options say that unambiguously.
  function dreadSelects() {
    const selects = Array.from(document.querySelectorAll('select'));
    return DREAD_SLOTS.map((slot, i) => {
      const named = document.querySelector('select[name="pro' + (i + 1) + '"]');
      if (named) return named;
      return selects.find((sel) => {
        const texts = Array.from(sel.options).map((o) => o.textContent);
        return slot.options.every((o) => texts.some((t) => dreadMatchOption(t, o)));
      }) || null;
    });
  }

  // Which of a slot's four words a dropdown is currently showing, or 0.
  function dreadSelected(sel, slot) {
    if (!sel || sel.selectedIndex < 0) return 0;
    const text = sel.options[sel.selectedIndex].textContent;
    for (let i = 0; i < slot.options.length; i++) {
      if (dreadMatchOption(text, slot.options[i])) return i + 1;
    }
    return 0;
  }

  // Put `picks` into the dropdowns. Zero means "leave that one alone" -- we
  // never guess at a word we cannot name. Returns how many were set, and which
  // slots refused. Nothing is submitted: the player presses Read Aloud.
  function dreadFillForm(picks) {
    const selects = dreadSelects();
    let set = 0;
    const failed = [];
    DREAD_SLOTS.forEach((slot, i) => {
      const want = Number(picks[i]) || 0;
      if (!want) return;
      const sel = selects[i];
      const opt = sel && Array.from(sel.options)
        .find((o) => dreadMatchOption(o.textContent, slot.options[want - 1]));
      if (!opt) { failed.push(slot.n); return; }
      if (sel.value !== opt.value) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      set++;
    });
    return { set: set, failed: failed };
  }

  // Hook "Read Aloud" so the eight picks are stashed before the page goes away.
  // Same shape and the same reason as the pyramid's descend hook: clicking
  // navigates, and the result page no longer carries the form, so the only
  // moment the picks can be read is on the way out. Nothing is clicked for you.
  function trackReadAloud(el) {
    if (el.dataset && el.dataset.tmQhDreadTracked) return;
    let done = false;
    const record = () => {
      if (done) return;
      done = true;
      const selects = dreadSelects();
      const picks = DREAD_SLOTS.map((slot, i) => dreadSelected(selects[i], slot));
      const rec = loadDread();
      // All eight or none: a half-read guess cannot be scored against the
      // number of wrong words, and a wrong score would poison the deduction.
      rec.pending = picks.every((p) => p >= 1 && p <= 4) ? picks : null;
      saveDread(rec);
    };
    el.addEventListener('click', record, true);
    const form = el.form || (el.closest && el.closest('form'));
    if (form) form.addEventListener('submit', record, true);
    if (el.dataset) el.dataset.tmQhDreadTracked = '1';
  }

  // --- the shared tracker body ---------------------------------------------

  // The panel is drawn into the mainpane document when it is opened from the
  // menu frame, so every node here is created from a passed-in document rather
  // than the ambient one.
  function mkEl(d, tag, css, text) {
    const e = d.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  function dreadButton(d, label, state, onClick) {
    const b = mkEl(d, 'button', null, label);
    b.type = 'button'; // never submit the form we live next to
    b.className = 'button';
    let css = 'margin:2px 2px 0 0;padding:1px 5px;font-size:10px;cursor:pointer';
    if (state === 'on') css += ';font-weight:bold;color:#060;outline:2px solid #060';
    else if (state === 'out') css += ';color:#999;text-decoration:line-through';
    b.style.cssText = css;
    b.addEventListener('click', onClick);
    return b;
  }

  // What the tracker currently believes, in one object: the record, the
  // solver's verdict, and the merged picks (a clue, or a slot the failures
  // pinned down on their own -- both are equally certain).
  function dreadView() {
    const rec = loadDread();
    const solve = dreadSolve(rec.known, rec.guesses);
    const picks = rec.known.map((k, i) => k || solve.pinned[i]);
    return {
      rec: rec,
      solve: solve,
      picks: picks,
      pinned: picks.filter((p) => p).length,
    };
  }

  // The status line both the bar and the panel lead with.
  function dreadSummary(view) {
    if (view.rec.done) {
      return { tone: 'go', text: 'Done — you read it correctly and you are the High Priest.' };
    }
    if (view.solve.count === 0) {
      return {
        tone: 'stop',
        text: 'These clues contradict each other — no arrangement fits all of them. One ' +
          'recorded reading or hand-set word must be wrong; clear the readings below.',
      };
    }
    if (view.pinned === 8) {
      return { tone: 'go', text: 'All eight words are pinned down. This reading will work.' };
    }
    return {
      tone: 'turn',
      text: view.pinned + ' of 8 words pinned down — ' + view.solve.count +
        ' arrangement' + (view.solve.count === 1 ? '' : 's') + ' still fit' +
        (view.solve.count === 1 ? 's' : '') + '.',
    };
  }

  // The eight slot rows: what each word is, where the clue comes from, and the
  // four candidates with their state. Clicking a candidate sets it by hand,
  // which is the escape hatch for a clue we failed to read off the page.
  function dreadSlotList(d, view, repaint) {
    const wrap = mkEl(d, 'div', 'text-align:left');

    DREAD_SLOTS.forEach((slot, i) => {
      const block = mkEl(d, 'div', 'margin-top:6px');

      const head = mkEl(d, 'div');
      const b = mkEl(d, 'b', null, slot.n + '. ' + slot.label);
      head.appendChild(b);
      head.appendChild(mkEl(d, 'span', 'color:#666', ' — ' + slot.source));
      block.appendChild(head);

      const row = mkEl(d, 'div');
      slot.options.forEach((opt, j) => {
        const n = j + 1;
        const isKnown = view.picks[i] === n;
        const isOut = !isKnown && view.solve.count > 0 &&
          view.solve.alive[i].indexOf(n) === -1;
        row.appendChild(dreadButton(d, opt.word, isKnown ? 'on' : (isOut ? 'out' : ''), () => {
          const rec = loadDread();
          rec.known[i] = rec.known[i] === n ? 0 : n;
          saveDread(rec);
          repaint();
        }));
      });
      if (view.rec.known[i]) {
        row.appendChild(dreadButton(d, 'clear', '', () => {
          const rec = loadDread();
          rec.known[i] = 0;
          saveDread(rec);
          repaint();
        }));
      }
      block.appendChild(row);
      wrap.appendChild(block);
    });

    return wrap;
  }

  // The failed readings, which are data and not just history: each one says how
  // many of its eight picks were right, and that is what the solver runs on.
  function dreadGuessList(d, view, repaint) {
    const wrap = mkEl(d, 'div', 'margin-top:8px;padding-top:5px;border-top:1px dotted #99a;' +
      'text-align:left');
    wrap.appendChild(mkEl(d, 'div', 'font-weight:bold', 'Failed readings'));

    if (!view.rec.guesses.length) {
      wrap.appendChild(mkEl(d, 'div', 'color:#666',
        'None recorded. Each failure tells you how many words you had right — three turns ' +
        'of Deep-Tainted Mind per wrong word — so a bad reading is not a wasted turn.'));
      return wrap;
    }

    view.rec.guesses.forEach((g, idx) => {
      const line = mkEl(d, 'div', 'margin-top:3px');
      const words = g.picks.map((p, i) => DREAD_SLOTS[i].options[p - 1].word).join(' / ');
      line.appendChild(mkEl(d, 'span', null,
        words + ' — ' + g.wrong + ' wrong (' + (8 - g.wrong) + ' right)'));
      line.appendChild(mkEl(d, 'span', null, ' '));
      line.appendChild(dreadButton(d, 'forget', '', () => {
        const rec = loadDread();
        rec.guesses.splice(idx, 1);
        saveDread(rec);
        repaint();
      }));
      wrap.appendChild(line);
    });

    if (view.solve.ignored) {
      wrap.appendChild(mkEl(d, 'div', 'color:#a00;margin-top:3px',
        view.solve.ignored + ' recorded reading(s) could not be scored and are being ' +
        'ignored.'));
    }
    return wrap;
  }

  // === 'dreadscroll' handler ===============================================

  const dreadscrollHandler = {
    locate() {
      const first = dreadSelects().find((s) => s) || null;
      const form = (first && first.closest && first.closest('form')) || null;
      return { form: form, mount: form, body: null };
    },

    // Its own body, like the rotation and Sven handlers: eight rows of state
    // plus the hand corrections do not fit on one status line.
    extras(puzzle, ctx, say) {
      const body = document.createElement('div');
      body.style.cssText = 'margin-top:5px';
      ctx.body = body;
      ctx.say = say;
      return body;
    },

    apply(puzzle, ctx, say) {
      const readAloud = findOption(/read aloud/i);
      if (readAloud) trackReadAloud(readAloud);

      const paint = () => {
        const view = dreadView();
        const summary = dreadSummary(view);
        say(summary.text, ROT_TONE[summary.tone]);

        const body = ctx.body;
        if (!body) return;
        body.textContent = '';

        const scroll = mkEl(document, 'div',
          'margin-top:4px;padding:4px;background:#fff;border:1px solid #ccd;text-align:left;' +
          'white-space:pre-wrap', dreadProphecy(view.picks));
        body.appendChild(scroll);

        if (view.pinned < 8) {
          const missing = DREAD_SLOTS
            .filter((s, i) => !view.picks[i])
            .map((s) => s.n + ' (' + s.source + ')');
          body.appendChild(mkEl(document, 'div', 'margin-top:4px;color:#a00;text-align:left',
            'Still unknown: ' + missing.join('; ') + '. Reading now costs a turn and three ' +
            'more per wrong word — but it does tell you how many you had right, and that is ' +
            'recorded here automatically.'));
        }

        const fill = rotButton('Fill in the ' + view.pinned + ' known word' +
          (view.pinned === 1 ? '' : 's'), false, () => {
          const res = dreadFillForm(view.picks);
          if (res.failed.length) {
            say('Set ' + res.set + ', but could not find the right option for slot ' +
              res.failed.join(', ') + ' — pick those by hand.', true);
          } else {
            say('Set ' + res.set + ' of 8. Press "Read Aloud" yourself — this script never ' +
              'submits.', ROT_TONE.go);
          }
        });
        if (!view.pinned) fill.disabled = true;
        body.appendChild(fill);

        body.appendChild(dreadSlotList(document, view, paint));
        body.appendChild(dreadGuessList(document, view, paint));
      };

      paint();
    },
  };

  // === 'catalog' handler ===================================================
  //
  // Playing the Catalog Card, the Mer-kin Library noncombat that feeds three of
  // the eight clues. Thirteen books at zero vocabulary, one fewer per 10% of
  // Mer-kin vocabulary learned, until only the three that carry clues are left
  // -- and every press costs an adventure whether or not the book says
  // anything. The titles are generated per ascension, so nothing here can be
  // pre-tabulated; what CAN be learned is which button gave which clue, which
  // is why the option is stashed on the way out and matched up when the result
  // page is harvested.

  function trackCatalog(el, option) {
    if (el.dataset && el.dataset.tmQhCatalogTracked) return;
    let done = false;
    const record = () => {
      if (done) return;
      done = true;
      const rec = loadDread();
      rec.pendingCatalog = { option: option, t: Date.now() };
      saveDread(rec);
    };
    el.addEventListener('click', record, true);
    const form = el.form || (el.closest && el.closest('form'));
    if (form) form.addEventListener('submit', record, true);
    if (el.dataset) el.dataset.tmQhCatalogTracked = '1';
  }

  // The choice's own option buttons, as [{ el, option, label }]. A choice.php
  // option is a submit button inside a form carrying `option=N`.
  function catalogOptions() {
    const out = [];
    Array.from(document.querySelectorAll('form')).forEach((form) => {
      const which = form.querySelector('input[name="whichchoice"][value="704"]');
      const opt = form.querySelector('input[name="option"]');
      const btn = form.querySelector('input[type="submit"], button');
      if (!which || !opt || !btn) return;
      out.push({
        el: btn,
        option: String(opt.value),
        label: ((btn.tagName === 'INPUT' ? btn.value : btn.textContent) || '').trim(),
      });
    });
    return out;
  }

  const catalogHandler = {
    locate() {
      const options = catalogOptions();
      if (!options.length) return null;
      const mount = options[0].el.closest && options[0].el.closest('table');
      return { options: options, mount: mount || null, body: null };
    },

    extras(puzzle, ctx, say) {
      const body = document.createElement('div');
      body.style.cssText = 'margin-top:5px';
      ctx.body = body;
      ctx.say = say;
      return body;
    },

    apply(puzzle, ctx, say) {
      const view = dreadView();
      ctx.options.forEach((o) => trackCatalog(o.el, o.option));

      const library = DREAD_SLOTS
        .map((slot, i) => ({ slot: slot, i: i }))
        .filter((x) => x.slot.library);
      const want = library.filter((x) => !view.picks[x.i]);

      if (!want.length) {
        say('The library has nothing left for you — all three of its words are known. ' +
          'Every book here still costs an adventure.', ROT_TONE.stop);
      } else {
        say('Still needed from this catalogue: ' +
          want.map((x) => x.slot.n + ' (' + x.slot.label + ')').join(', ') + '.',
        ROT_TONE.turn);
      }

      const body = ctx.body;
      if (!body) return;
      body.textContent = '';

      library.forEach((x) => {
        const have = view.picks[x.i];
        const line = mkEl(document, 'div', 'text-align:left;color:' + (have ? '#060' : '#333'));
        line.textContent = (have ? '✓ ' : '• ') + x.slot.n + '. ' + x.slot.label + ' — ' +
          (have ? x.slot.options[have - 1].word : 'not yet found');
        body.appendChild(line);
      });

      // What each button has given before, this ascension. The titles are
      // regenerated per ascension so this is learned, never looked up -- and
      // only the pressed button can be attributed, so it fills in slowly.
      const seen = ctx.options.filter((o) => view.rec.catalog[o.option] !== undefined);
      if (seen.length) {
        const note = mkEl(document, 'div', 'margin-top:5px;text-align:left;color:#666');
        note.appendChild(mkEl(document, 'div', 'font-weight:bold', 'Books you have opened'));
        seen.forEach((o) => {
          const i = view.rec.catalog[o.option];
          const slot = i >= 0 ? DREAD_SLOTS[i] : null;
          note.appendChild(mkEl(document, 'div', null,
            o.label + ' → ' + (slot ? 'word ' + slot.n + ' (' + slot.label + ')'
              : 'no clue, just mysticality')));
        });
        body.appendChild(note);
      }

      body.appendChild(mkEl(document, 'div', 'margin-top:5px;text-align:left;color:#666',
        'Each Mer-kin wordquiz you study removes one of the books with no clue in it, so ' +
        'the three that matter get easier to hit. Every choice here costs an adventure, ' +
        'including the duds.'));
    },
  };

  // === the charpane button and its panel ===================================
  //
  // The clue tracker is wanted BETWEEN visits to the scroll -- while deciding
  // whether another trip to the library is worth an adventure, or whether to
  // burn a killscroll on this Mer-kin -- so it cannot live only on choice 703.
  // It gets a button in the CHARPANE, under the Current Quest block, which is
  // both where you are already looking for quest state and somewhere with room
  // (the menu frame's one strip of space ran out at four buttons).
  //
  // The charpane is torn down and rebuilt on most turns, which costs nothing
  // here: the button owns no state, the tracker lives in localStorage, and this
  // script runs afresh on every charpane load and re-injects it (the id guard
  // makes that a no-op when one is already up).
  //
  // The PANEL is drawn into the MAINPANE document instead -- the sidebar is
  // about 140px wide and would clip it -- which is why every render helper
  // above takes its document as an argument rather than using the ambient one.

  const MERKIN_BUTTON_ID = 'tm-merkin-btn';
  const MERKIN_PANEL_ID = 'tm-merkin-panel';

  function merkinPanelDoc() {
    try {
      const mp = top.frames['mainpane'];
      if (mp && mp.document && mp.document.body) return mp.document;
    } catch (e) { /* cross-frame access failed; fall back */ }
    return document.body ? document : null;
  }

  function closeMerkinPanel() {
    const d = merkinPanelDoc();
    const old = d && d.getElementById(MERKIN_PANEL_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function openMerkinPanel() {
    closeMerkinPanel();
    const d = merkinPanelDoc();
    if (!d) return;

    const pop = mkEl(d, 'div', [
      'position:fixed', 'left:20px', 'top:20px', 'z-index:100000',
      'width:430px', 'max-height:80vh', 'overflow-y:auto', 'padding:8px',
      'background:#f5f5ff', 'border:1px solid blue', 'border-radius:4px',
      'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
      'font-family:arial,sans-serif', 'font-size:11px',
    ].join(';'));
    pop.id = MERKIN_PANEL_ID;

    const head = mkEl(d, 'div', 'display:flex;justify-content:space-between;' +
      'align-items:center;border-bottom:1px solid #ccd');
    head.appendChild(mkEl(d, 'div', 'font-weight:bold', 'Mer-kin dreadscroll'));
    const close = mkEl(d, 'button', 'cursor:pointer;font-size:11px', 'close');
    close.type = 'button';
    close.addEventListener('click', closeMerkinPanel);
    head.appendChild(close);
    pop.appendChild(head);

    const body = mkEl(d, 'div');
    pop.appendChild(body);

    function paint() {
      body.textContent = '';
      const view = dreadView();
      const summary = dreadSummary(view);

      body.appendChild(mkEl(d, 'div',
        'margin-top:4px;padding:4px;background:#fff;border:1px solid #ccd;' +
        'white-space:pre-wrap', dreadProphecy(view.picks)));
      body.appendChild(mkEl(d, 'div',
        'margin-top:4px;font-weight:bold;color:' + ROT_TONE[summary.tone], summary.text));

      body.appendChild(dreadSlotList(d, view, paint));
      body.appendChild(dreadGuessList(d, view, paint));

      const foot = mkEl(d, 'div', 'margin-top:8px;padding-top:5px;' +
        'border-top:1px dotted #99a;text-align:left');
      foot.appendChild(mkEl(d, 'div', 'color:#666',
        'Clues are filed automatically from the pages that print them; the buttons above ' +
        'are for correcting one by hand. Nothing here is ever submitted for you.'));
      if (view.rec.guesses.length) {
        foot.appendChild(dreadButton(d, 'Clear recorded readings', '', () => {
          const rec = loadDread();
          rec.guesses = [];
          saveDread(rec);
          paint();
        }));
      }
      foot.appendChild(dreadButton(d, 'Reset everything', '', () => {
        const w = d.defaultView || window;
        if (!w.confirm('Forget every Mer-kin clue and reading for this character?')) return;
        saveDread(freshDread());
        paint();
        syncMerkinButton();
      }));
      body.appendChild(foot);

      syncMerkinButton();
    }

    paint();
    d.body.appendChild(pop);
  }

  // The button doubles as the readout: how far along the eight words are is the
  // one thing worth knowing without opening anything.
  function syncMerkinButton() {
    const btn = document.getElementById(MERKIN_BUTTON_ID);
    if (!btn) return;
    let view;
    try {
      view = dreadView();
    } catch (e) {
      return;
    }
    const done = view.rec.done;
    btn.textContent = done ? 'Mer-kin ✓' : 'Mer-kin ' + view.pinned + '/8';
    btn.style.backgroundColor = done || view.pinned === 8 ? '#d8f0d8' :
      (view.solve.count === 0 ? '#ffd9a0' : 'white');
    btn.title = done ? 'Mer-kin dreadscroll: read correctly' :
      'Mer-kin dreadscroll: ' + view.pinned + ' of 8 words pinned down';
  }

  function addMerkinButton() {
    if (document.getElementById(MERKIN_BUTTON_ID)) return; // idempotency guard

    const btn = document.createElement('button');
    btn.id = MERKIN_BUTTON_ID;
    btn.type = 'button';
    btn.textContent = 'Mer-kin';
    btn.style.cssText = [
      'padding:0 5px', 'font-size:10px', 'font-family:arial', 'height:18px',
      'cursor:pointer', 'white-space:nowrap', 'background-color:white',
    ].join(';');
    btn.addEventListener('click', () => {
      const d = merkinPanelDoc();
      if (d && d.getElementById(MERKIN_PANEL_ID)) closeMerkinPanel();
      else openMerkinPanel();
    });

    placeMerkinButton(btn);
    syncMerkinButton();
  }

  // Where the button goes, in the charpane's own terms. `#nudgeblock` is the
  // "Current Quest:" block -- the questlog link, then a scrolling list of
  // nudges -- and KoL emits it under that id in BOTH the compact and the
  // expanded pane, so one anchor covers both. (Markup from KoLmafia's charpane
  // fixtures, test_charpane_basic.html / test_charpane_compact.html.)
  // Appending to it puts us below the nudge list, which is what "under the
  // current quest" means on screen.
  //
  // Each step falls through to the next and the last one always works: an
  // unrecognised charpane still gets a usable button rather than none.
  function placeMerkinButton(btn) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;margin:2px 0';
    wrap.appendChild(btn);

    const nudge = document.getElementById('nudgeblock');
    if (nudge) { nudge.appendChild(wrap); return; }

    // No id (an older pane, or one KoL has since changed): find the label.
    const label = Array.from(document.querySelectorAll('a'))
      .find((a) => /current quest/i.test(a.textContent || ''));
    const block = label && label.closest && label.closest('center');
    if (block) { block.appendChild(wrap); return; }

    console.warn('Quest helper: no current-quest block in the charpane, ' +
                 'placing the Mer-kin button at the bottom of the sidebar.');
    if (document.body) document.body.appendChild(wrap);
  }

  const HANDLERS = {
    selects: selectsHandler,
    tiles: tilesHandler,
    rotation: rotationHandler,
    combat: combatHandler,
    sven: svenHandler,
    counter: counterHandler,
    dreadscroll: dreadscrollHandler,
    catalog: catalogHandler,
  };

  // === The 8-Bit Realm score (charpane) ====================================
  //
  // Not a puzzle and not on a puzzle page -- it's a sidebar readout -- but it's
  // the same shape as the rest of this file: the answer is knowable and the
  // game simply doesn't say it out loud.
  //
  // The realm is four zones, and the COLOUR of your Score in the charpane says
  // which one is currently paying double. The colour moves one step every five
  // kills in the realm, along a cycle that is fixed and the same for everyone:
  // black -> blue -> green -> red -> black. EIGHTBIT_ZONES is in that order, so
  // "what's next" is just the next entry.
  //
  //   black  Vanya's Castle      565   Combat Initiative
  //   blue   Megalo-City         566   Damage Absorption
  //   green  Hero's Field        564   Item Drop
  //   red    The Fungus Plains   563   Meat Drop
  //
  // A fight pays 50 points (100 in the bonus zone) plus a slab for that one
  // modifier -- see eightBitPoints, which is the formula the community's
  // 8bit-relay override uses. Two things follow that the game never tells you
  // and that this exists to say: the modifier is worth NOTHING until it clears
  // the zone's floor, and it stops helping at the cap, so 400 a fight is the
  // ceiling and only the zone whose colour is showing can reach it.
  //
  // Score is not a currency -- it only counts up, and nothing spends it. The
  // Treasure House chests just unlock as it passes 10k / 20k / 30k.
  //
  // Everything here is read-only, and every step bails out silently: an
  // unparseable score row or an unrecognised colour means no box at all rather
  // than a confident guess about where to spend turns.

  const EIGHTBIT_ZONES = [
    { colour: 'black', name: 'Vanya\'s Castle', snarfblat: 565,
      stat: 'Combat Initiative', pct: true, floor: 300, cap: 595, ink: '#000' },
    { colour: 'blue', name: 'Megalo-City', snarfblat: 566,
      stat: 'Damage Absorption', pct: false, floor: 300, cap: 595, ink: '#00a' },
    { colour: 'green', name: 'Hero\'s Field', snarfblat: 564,
      stat: 'Item Drop', pct: true, floor: 100, cap: 395, ink: '#070' },
    { colour: 'red', name: 'The Fungus Plains', snarfblat: 563,
      stat: 'Meat Drop', pct: true, floor: 150, cap: 445, ink: '#a00' },
  ];

  const EIGHTBIT_CHESTS = [
    { at: 10000, prize: 'the digital key' },
    { at: 20000, prize: 'a fat loot token' },
    { at: 30000, prize: 'the third chest' },
  ];

  // --- pure logic (DOM-free, unit-tested) ----------------------------------

  // Points from one fight in `zone` while carrying `modifier` of its stat.
  // The bonus doubles the base AND halves the divisor, so the same modifier is
  // worth exactly twice as much in the zone whose colour is up.
  function eightBitPoints(zone, modifier, bonus) {
    const over = Math.max(0, Math.min(300, modifier - zone.floor));
    return (bonus ? 100 : 50) + Math.round(over / (bonus ? 10 : 20)) * 10;
  }

  // Damage Absorption is a flat number; the other three are percentages.
  function eightBitAmount(zone, v) {
    return zone.pct ? '+' + v + '%' : String(v);
  }

  function eightBitZone(colour) {
    const c = String(colour || '').trim().toLowerCase();
    return EIGHTBIT_ZONES.find((z) => z.colour === c) || null;
  }

  function eightBitNextZone(zone) {
    const i = EIGHTBIT_ZONES.indexOf(zone);
    return i < 0 ? null : EIGHTBIT_ZONES[(i + 1) % EIGHTBIT_ZONES.length];
  }

  // The next Treasure House chest, or null once all three are within reach.
  function eightBitChest(score) {
    if (typeof score !== 'number' || !isFinite(score)) return null;
    return EIGHTBIT_CHESTS.find((c) => score < c.at) || null;
  }

  // THE ADVICE, kept DOM-free so it can be reasoned about and unit-tested.
  // Returns { zone, url, boost, next, goal, tip }, or null when the colour
  // isn't one of the four (in which case we say nothing at all).
  function eightBitAdvice(colour, score) {
    const zone = eightBitZone(colour);
    if (!zone) return null;
    const next = eightBitNextZone(zone);

    const floor = eightBitAmount(zone, zone.floor);
    const cap = eightBitAmount(zone, zone.cap);
    const min = eightBitPoints(zone, zone.floor, true);
    const max = eightBitPoints(zone, zone.cap, true);

    const boost = 'Boost ' + zone.stat + ' — worth nothing below ' + floor +
      ', maxed at ' + cap + '.';

    let goal = null;
    if (typeof score === 'number' && isFinite(score)) {
      const chest = eightBitChest(score);
      goal = chest
        ? (chest.at - score).toLocaleString() + ' more for ' + chest.prize + '.'
        : 'All three chests are open.';
    }

    const tip = [
      'The Score\'s colour is the 8-Bit Realm zone paying double right now: ' +
        EIGHTBIT_ZONES.map((z) => z.colour + ' = ' + z.name).join(', ') + '.',
      'It moves one step along that cycle every 5 kills in the realm, so it ' +
        'shifts under you.',
      'In ' + zone.name + ' a fight pays ' + min + ' points, plus 10 for every 10 of ' +
        zone.stat + ' above ' + floor + ', up to ' + max + ' at ' + cap +
        '. In the other three zones it is half that.',
      'Score is never spent — the Treasure House chests open at 10,000 (digital key), ' +
        '20,000 (fat loot token) and 30,000.',
    ].join(' ');

    return {
      zone: zone,
      url: 'adventure.php?snarfblat=' + zone.snarfblat,
      boost: boost,
      next: next ? 'Then ' + next.name + ' (' + next.colour + ').' : null,
      goal: goal,
      tip: tip,
    };
  }

  // --- reading the charpane ------------------------------------------------

  // e.g. "black score - 0"
  const EIGHTBIT_LABEL = /^\s*([a-z]+)\s+score\s*-\s*([\d,]+)\s*$/i;

  // The charpane states the colour three ways at once:
  //   <font color="black"><span class="nes" alt="black score - 0"
  //                             title="black score - 0">0</span></font>
  // so take the labelled span first (it carries the score too) and fall back to
  // the label cell plus the <font color> wrapping the number.
  // Returns { colour, score, el } or null.
  function readEightBitScore() {
    for (const el of document.querySelectorAll('[title], [alt]')) {
      const m = (el.getAttribute('title') || '').match(EIGHTBIT_LABEL) ||
        (el.getAttribute('alt') || '').match(EIGHTBIT_LABEL);
      if (m) {
        return { colour: m[1].toLowerCase(), score: Number(m[2].replace(/,/g, '')), el: el };
      }
    }
    for (const td of document.querySelectorAll('td')) {
      if (!/^\s*score:?\s*$/i.test(td.textContent || '')) continue;
      const row = td.closest && td.closest('tr');
      const font = row && row.querySelector('font[color]');
      if (!font) continue;
      const n = Number((font.textContent || '').replace(/[^\d]/g, ''));
      return {
        colour: (font.getAttribute('color') || '').toLowerCase(),
        score: isFinite(n) && (font.textContent || '').trim() !== '' ? n : null,
        el: font,
      };
    }
    return null;
  }

  function showEightBit() {
    if (document.getElementById('tm-8bit-advice')) return; // idempotency guard
    const found = readEightBitScore();
    if (!found) return;
    const advice = eightBitAdvice(found.colour, found.score);
    if (!advice) return;

    const box = document.createElement('div');
    box.id = 'tm-8bit-advice';
    box.style.cssText = [
      'margin:2px 0 0', 'padding:2px 3px', 'border:1px solid #ccc',
      'background:#f6f6f6', 'font-family:arial', 'font-size:9px',
      'line-height:11px', 'text-align:left',
    ].join(';');
    box.title = advice.tip;

    const head = document.createElement('div');
    head.appendChild(document.createTextNode('2× points: '));
    const link = document.createElement('a');
    link.href = advice.url;
    link.target = 'mainpane'; // we're in the sidebar frame; adventure in the big one
    link.textContent = advice.zone.name;
    link.style.cssText = 'font-weight:bold;color:' + advice.zone.ink;
    head.appendChild(link);
    box.appendChild(head);

    [advice.boost, advice.next, advice.goal].forEach((text) => {
      if (!text) return;
      const line = document.createElement('div');
      line.style.cssText = 'color:#555';
      line.textContent = text;
      box.appendChild(line);
    });

    // The score sits in a two-column table row and the sidebar is narrow, so a
    // full-width row of its own underneath is the only place a sentence fits.
    // If the charpane ever stops being a table, sit beside the number instead.
    const row = found.el.closest && found.el.closest('tr');
    if (row && row.parentNode) {
      const tr = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 2;
      cell.appendChild(box);
      tr.appendChild(cell);
      row.parentNode.insertBefore(tr, row.nextSibling);
    } else if (found.el.parentNode) {
      found.el.parentNode.insertBefore(box, found.el.nextSibling);
    }
  }

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

  // A dreadscroll clue word can turn up on any of half a dozen unrelated pages,
  // so this runs on every one of them and before anything else. It only reads
  // the page and files what it finds; a failure here must not take the puzzle
  // handlers down with it.
  try {
    harvestDreadClues();
  } catch (e) {
    console.error('Quest helper: could not read Mer-kin clues from this page.', e);
  }

  // The charpane is a different page with a different job: no puzzle can be on
  // it, and both of the things it does carry -- the 8-Bit box and the Mer-kin
  // button -- bring their own markup rather than the bar's, so it dispatches
  // here and nothing below applies.
  if (/\/charpane\.php/i.test(location.pathname)) {
    // Two unrelated features sharing one branch, so they get one try/catch
    // each: a charpane KoL has changed under one of them must not cost you the
    // other. Same rule as ux-enhancers.js's FEATURES registry.
    try {
      showEightBit();
    } catch (e) {
      console.error('Quest helper: could not read the 8-Bit Realm score.', e);
    }
    try {
      addMerkinButton();
    } catch (e) {
      console.error('Quest helper: could not add the Mer-kin button.', e);
    }
    return;
  }

  const puzzle = currentPuzzle();
  if (!puzzle) return;
  const handler = HANDLERS[puzzle.type];
  if (!handler) return;

  const ctx = handler.locate(puzzle);
  if (!ctx) return; // page structure changed, or the choice is already resolved

  const { bar, say } = buildBar(puzzle, ctx, handler);
  // Sit right below the puzzle's own form/table when we found one; otherwise at
  // the top of the page. A handler can ask to go ABOVE its mount instead --
  // 'combat' and 'counter' do, because their mount is the block of combat
  // buttons and the advice has to be read before they're pressed.
  if (ctx.mount && ctx.mount.parentNode) {
    ctx.mount.parentNode.insertBefore(bar, ctx.before ? ctx.mount : ctx.mount.nextSibling);
  } else if (document.body) {
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // Highlighting and advising commit nothing, so 'tiles' and 'rotation' run on
  // sight (like mine-sparkle-highlight.js). 'selects' WRITES into the form, so
  // it stays strictly opt-in behind its button.
  if (puzzle.auto) handler.apply(puzzle, ctx, say);
})();
