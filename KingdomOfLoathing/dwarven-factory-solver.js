// ==UserScript==
// @name         KoL Dwarven Factory Solver
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/dwarven-factory-solver.js
// @version      1.1
// @description  Adds a panel to the Dwarven Machine Room (dwarfcontraption.php) that solves the Dwarven Factory Complex puzzle. A browser port of That FN Ninja's KoLmafia "DwaFa" (dwafa.ash). One-click Solve sets the gauges, fills the hoppers and pushes the red button using what you've already gathered; a confirm-gated Full auto-pilot additionally solves the digit code (Dwarvish Dice), adventures the Mine Foremens' Office / Warehouse and pauses for you to supply ore.
// @match        https://www.kingdomofloathing.com/dwarfcontraption.php*
// @match        https://kingdomofloathing.com/dwarfcontraption.php*
// @grant        none

// ==/UserScript==

// ----------------------------------------------------------------------------
// PORTING NOTES (read me)
//
// This is a browser-userscript port of dwafa.ash (KoLmafia). KoLmafia drives the
// game server-side and keeps decoded puzzle state in *preferences*
// (lastDwarfDigitRunes, lastDwarfOfficeItem<id>, lastDwarfHopper1..4,
// lastDwarfFactoryItem<id>). A userscript has none of that, so this script
// re-implements KoLmafia's own page parsing (taken from KoLmafia's
// DwarfFactoryRequest / DwarfContraptionRequest source) and persists the decoded
// state itself in localStorage, keyed per character+ascension.
//
// What is faithfully reproduced (high confidence — it's deterministic and the
// parsing matches mafia + the original .ash):
//   * Reading hopper contents + hopper (ore) runes          dwarfcontraption.php?action=hopperN
//   * Base-7 rune -> number conversion (DwarfNumberTranslator)
//   * Solving the digit code by rolling Dwarvish Dice        dwarffactory.php?action=dodice
//     (5040-permutation elimination, exactly as mafia does)
//   * Decoding laminated cards / dwarvish documents          inv_use.php (RUNE_PATTERN)
//   * Computing per-hopper gauge values and target ore counts
//   * Setting gauges, filling hoppers, the coal/diamond chamber, the red button
//
// What is intentionally NOT done automatically (by design / safety):
//   * Mining for ore. dwafa.ash calls mine(), which is the *separate* miner.ash
//     grid solver that was not provided. Auto-pilot therefore PAUSES and asks you
//     to supply the ore (target amounts are shown), instead of mining or buying.
//   * Silent mall purchases of ore (risky meat spend) — same pause.
//   * Combat / generic choice adventures. If an adventure lands in combat or an
//     unexpected page, auto-pilot stops and tells you, rather than mis-clicking.
//
// Least-verified part: deriving the chosen equipment piece's WORD rune (oi_rune)
// from the Warehouse. There is a manual override (type the rune, or pick the
// document) for when the automatic derivation can't resolve it.
//
// UNTESTED IN-GAME: this was written from the .ash + mafia source + the wiki, not
// validated against a live factory (the puzzle is ascension-gated). Treat the
// first run as a careful, supervised one. Open the browser console for a log.
// ----------------------------------------------------------------------------

(function () {
  'use strict';

  // all-in-one.js @requires every KoL script onto the union of matched pages;
  // scope ourselves explicitly so we never touch a sibling frame/page.
  if (!/\/dwarfcontraption\.php/i.test(location.pathname)) return;
  if (document.getElementById('tm-dwafa-panel')) return; // idempotency guard

  // === Constants ===========================================================

  // Real KoL item ids used by the puzzle (from dwafa.ash).
  const ID = {
    DIAMOND: 3200, // lump of diamond -> coal via the vacuum chamber
    CARDS: [3208, 3209, 3210, 3211], // little / small / notbig / unlarge laminated card
    DOCS: [3212, 3213, 3214], // dwarvish paper / document / parchment
    PARCHMENT: 3214, // special-cased in the original (trailing entry, no comma)
  };

  // The three forgeable Dwarvish War Uniform pieces and the left-panel control
  // that selects each (from dwafa.ash). The factory makes the piece you select
  // here; its word rune (oi_rune) is then what the cards/document are keyed on.
  const PIECES = {
    helmet: { label: 'Dwarvish War Helmet', activate: 'activatewhich3' },
    mattock: { label: 'Dwarvish War Mattock', activate: 'activatewhich2' },
    kilt: { label: 'Dwarvish War Kilt', activate: 'activatewhich1' },
  };

  // Ore "whichore" values for hopper fills, matched to the rune/name in the
  // hopper text. Order matters only for display.
  const ORES = ['chrome', 'asbestos', 'linoleum', 'coal'];

  const OFFICE_SNARFBLAT = 176; // The Mine Foremens' Office (the only adv.php area)

  // KoLmafia's parsing regexes (verbatim).
  const RUNE_PATTERN = /title="Dwarf (Digit|Word) Rune (.)"/g; // [1]=Digit|Word [2]=rune
  const HOPPER_PATTERN = /It currently contains (\d+) ([^.]*)\./; // [1]=count [2]=ore text
  const MEAT_PATTERN = /You (gain|lose) (\d+) Meat/; // dice result

  const LS_KEY = 'tm-dwafa-state';

  // === pwd hash (same probing strategy as codpiece.js) =====================

  function getPwd() {
    const inp = document.querySelector('input[name="pwd"]');
    if (inp && inp.value) return inp.value;
    if (typeof window.pwdhash === 'string' && window.pwdhash) return window.pwdhash;
    if (typeof window.pwd === 'string' && window.pwd) return window.pwd;
    const link = document.querySelector('a[href*="pwd="]');
    if (link) {
      const m = link.getAttribute('href').match(/[?&]pwd=([0-9a-fA-F]+)/);
      if (m) return m[1];
    }
    try {
      const cp = top.frames['charpane'];
      if (cp && typeof cp.pwdhash === 'string' && cp.pwdhash) return cp.pwdhash;
    } catch (e) { /* cross-frame */ }
    const m2 = document.documentElement.innerHTML.match(
      /pwd(?:hash)?\s*=\s*["']([0-9a-fA-F]+)["']/);
    return m2 ? m2[1] : null;
  }

  const PWD = getPwd();

  // === Low-level request helpers ===========================================

  // GET a KoL url (path+query, no leading host), pwd appended, return body text.
  async function get(url) {
    const full = url + (url.indexOf('?') === -1 ? '?' : '&') + 'pwd=' + PWD;
    const res = await fetch('/' + full.replace(/^\//, ''), { credentials: 'same-origin' });
    return res.text();
  }

  // === Persistent decoded state ============================================
  // Mirrors the mafia preferences this puzzle relies on. Keyed by ascension so a
  // new run starts clean. We can't read my_ascensions() here, so we derive a key
  // from the charpane player id + a stored ascension marker the user can reset.

  function loadState() {
    try {
      const o = JSON.parse(localStorage.getItem(LS_KEY));
      if (o && typeof o === 'object') return o;
    } catch (e) { /* fall through */ }
    return {};
  }
  function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }

  // STATE shape:
  //   digitRunes : 7-char string, index = digit value 0..6, char = rune
  //   diceRolls  : array of "AB-CD=xx" roll strings (so a refresh keeps progress)
  //   hoppers    : { "1": {rune, count, ore}, ... }  (1..4)
  //   office     : { "<itemId>": "B,HGIG,MGDE,PJD" }  (decoded cards/documents)
  //   oiRune     : the chosen equipment piece's word rune (single char)
  //   piece      : "helmet" | "mattock" | "kilt"
  const STATE = loadState();
  STATE.office = STATE.office || {};
  STATE.hoppers = STATE.hoppers || {};
  STATE.diceRolls = STATE.diceRolls || [];

  // === Rune parsing (mafia DwarfFactoryRequest) ============================

  // All runes on a page, in document order: [{type:'Digit'|'Word', rune}].
  function parseRunes(html) {
    const out = [];
    RUNE_PATTERN.lastIndex = 0;
    let m;
    while ((m = RUNE_PATTERN.exec(html)) !== null) out.push({ type: m[1], rune: m[2] });
    return out;
  }

  // First rune on a page (mafia getRune).
  function firstRune(html) {
    const r = parseRunes(html);
    return r.length ? r[0].rune : '';
  }

  // === Base-7 number translation (mafia DwarfNumberTranslator) =============
  // number = sum over rune chars of (digit of rune) accumulated base-7.

  function digitOf(rune) {
    if (!STATE.digitRunes) return -1;
    return STATE.digitRunes.indexOf(rune);
  }
  function parseNumber(runes) {
    let n = 0;
    for (let i = 0; i < runes.length; i++) {
      const d = digitOf(runes[i]);
      if (d < 0) return NaN; // unknown digit rune
      n = n * 7 + d;
    }
    return n;
  }

  // === Digit-code solver (Dwarvish Dice) ===================================
  // Port of mafia's permutation elimination. We keep all 7! orderings of the 7
  // distinct digit runes and drop any inconsistent with an observed roll.
  // A roll "AB-CD=xx": value(AB) - value(CD) == xx (base-7), with the mafia
  // quirk that "the same rune twice in the high number, at digit 0" means 49.

  function allDigitRunes() {
    // The 7 distinct digit runes are exactly the runes seen in dice rolls.
    const set = new Set();
    STATE.diceRolls.forEach((r) => {
      [r[0], r[1], r[3], r[4]].forEach((c) => set.add(c));
    });
    return Array.from(set);
  }

  function permute(arr) {
    if (arr.length <= 1) return [arr];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      permute(rest).forEach((p) => out.push([arr[i]].concat(p)));
    }
    return out;
  }

  // mafia validPermutation: perm is the digit ordering (index=value).
  function validPermutation(perm, d1, d2, d3, d4, val) {
    const idx = (c) => perm.indexOf(c);
    let total;
    const i1 = idx(d1);
    if (d1 === d2 && i1 === 0) {
      total = 49;
    } else {
      total = i1 * 7 + idx(d2);
    }
    total -= idx(d3) * 7 + idx(d4);
    return total === val;
  }

  // Returns the 7-char digit-rune string if uniquely solved, else null.
  function solveDigitsFromRolls() {
    const runes = allDigitRunes();
    if (runes.length !== 7) return null; // need all seven runes observed
    let perms = permute(runes).map((p) => p.join(''));
    STATE.diceRolls.forEach((roll) => {
      const d1 = roll[0], d2 = roll[1], d3 = roll[3], d4 = roll[4];
      const high = roll.charCodeAt(6) - 48, low = roll.charCodeAt(7) - 48;
      const val = high * 7 + low;
      perms = perms.filter((p) => validPermutation(p, d1, d2, d3, d4, val));
    });
    return perms.length === 1 ? perms[0] : null;
  }

  // Roll the dice once; append the parsed roll string. Returns {meat, roll}.
  async function rollDiceOnce() {
    const html = await get('dwarffactory.php?action=dodice');
    const meatM = MEAT_PATTERN.exec(html);
    const runes = parseRunes(html);
    if (!meatM || runes.length < 4) return null;
    const won = meatM[1] === 'gain';
    const meat = Math.floor(parseInt(meatM[2], 10) / 7);
    const meat7 = String(Math.floor(meat / 7)) + (meat % 7);
    const first = runes[0].rune + runes[1].rune;
    const second = runes[2].rune + runes[3].rune;
    const roll = (won ? second + '-' + first : first + '-' + second) + '=' + meat7;
    if (roll.length === 8 && STATE.diceRolls.indexOf(roll) === -1) {
      STATE.diceRolls.push(roll);
      saveState();
    }
    return { roll };
  }

  // === Hopper reading (mafia DwarfContraptionRequest) ======================

  async function readHopper(n /* 0..3 */) {
    const html = await get('dwarfcontraption.php?action=hopper' + n);
    const rune = firstRune(html);
    const out = { rune, count: 0, ore: null, empty: !/contains/i.test(html) };
    const m = HOPPER_PATTERN.exec(html);
    if (m) {
      out.count = parseInt(m[1], 10);
      let text = m[2];
      // Normalise "chunks of linoleum" / "lumps of coal" -> ore keyword.
      const lc = text.toLowerCase();
      out.ore = ORES.find((o) => lc.indexOf(o) !== -1) || null;
    }
    STATE.hoppers[String(n + 1)] = out; // 1-indexed like mafia lastDwarfHopperN
    return out;
  }

  // Put one unit of `ore` into hopper n (used to probe an empty hopper's rune).
  async function seedHopper(n, ore) {
    await get('dwarfcontraption.php?action=hopper' + n + '&action=dohopper' + n +
      '&howmany=1&whichore=' + ore);
  }

  // === Decoding office items (cards + documents) ===========================
  // Uses the item, then assembles the comma string exactly like mafia's
  // useLaminatedItem (cards) / useUnlaminatedItem (documents).

  async function useAndDecode(itemId, laminated) {
    const html = await get('inv_use.php?which=3&whichitem=' + itemId);
    const runes = parseRunes(html);
    if (!runes.length) return null;
    let s = '';
    let count = 0;
    for (let i = 0; i < runes.length; i++) {
      const { type, rune } = runes[i];
      if (count++ === 0) { s += rune; continue; } // first rune stands alone
      if (laminated && count === 2) continue;      // cards skip the 2nd rune
      if (type === 'Word') s += ',';
      s += rune;
    }
    STATE.office[String(itemId)] = s;
    saveState();
    return s;
  }

  // === Warehouse word-rune derivation ======================================
  // The chosen piece's word rune (oi_rune). We adventure the Warehouse with only
  // the chosen piece selected on the left panel; the equipment rune it reveals
  // that also keys an entry in our decoded cards is oi_rune. Manual override
  // exists for when this can't resolve.

  function equipmentRuneKeysFromCards() {
    // In a laminated card "B,HGIG,MGDE,PJD" the entries after the first comma are
    // keyed by equipment word runes (their first char). Collect that set.
    const keys = new Set();
    ID.CARDS.forEach((id) => {
      const s = STATE.office[String(id)];
      if (!s) return;
      const parts = s.split(',');
      for (let i = 1; i < parts.length; i++) if (parts[i]) keys.add(parts[i][0]);
    });
    return keys;
  }

  async function deriveOiRuneFromWarehouse(log) {
    const eqKeys = equipmentRuneKeysFromCards();
    for (let tries = 0; tries < 12; tries++) {
      const html = await get('dwarffactory.php?action=ware');
      const runes = parseRunes(html).filter((r) => r.type === 'Word').map((r) => r.rune);
      const hit = runes.filter((r) => eqKeys.has(r));
      if (hit.length === 1) { return hit[0]; }
      log('Warehouse visit ' + (tries + 1) + ': runes ' + runes.join('') +
        (hit.length ? ' (ambiguous: ' + hit.join('') + ')' : ' (no equipment rune yet)'));
    }
    return null;
  }

  // === Puzzle math =========================================================
  // Returns { gauges:[g0..g3], targets:{hopperNum: oreCount}, coalHopper } or
  // throws an Error describing the missing piece of data.

  function pickDocument() {
    // The document whose first char == oiRune (mafia doc_check).
    for (const id of ID.DOCS) {
      const s = STATE.office[String(id)];
      if (s && s[0] === STATE.oiRune) return { id, s };
    }
    return null;
  }

  function cardForHopperRune(rune) {
    for (const id of ID.CARDS) {
      const s = STATE.office[String(id)];
      if (s && s[0] === rune) return s;
    }
    return null;
  }

  function computeSolution() {
    if (!STATE.digitRunes) throw new Error('Digit code not solved yet (roll the Dwarvish Dice).');
    if (!STATE.oiRune) throw new Error('Outfit word rune (oi_rune) unknown — set it or run the Warehouse step.');
    const doc = pickDocument();
    if (!doc) throw new Error('No decoded document matches oi_rune "' + STATE.oiRune + '" — use the matching dwarvish paper/document/parchment.');

    const gauges = [0, 0, 0, 0];
    const targets = {};
    let coalHopper = 0;

    for (let n = 1; n <= 4; n++) {
      const h = STATE.hoppers[String(n)];
      if (!h || !h.rune) throw new Error('Hopper ' + n + ' not read yet.');
      if (h.ore === 'coal') coalHopper = n;

      // Gauge: card keyed by this hopper's rune, entry keyed by oi_rune.
      const card = cardForHopperRune(h.rune);
      if (!card) throw new Error('No laminated card for hopper rune "' + h.rune + '".');
      const entry = card.split(',').slice(1).find((e) => e && e[0] === STATE.oiRune);
      if (!entry) throw new Error('Card for hopper ' + n + ' has no entry for oi_rune "' + STATE.oiRune + '".');
      gauges[n - 1] = parseNumber(entry.slice(1));

      // Target ore: document entry keyed by hopper rune, next 2 base-7 runes
      // (mafia/.ash read exactly 2 digits here).
      const needle = ',' + h.rune;
      const at = doc.s.indexOf(needle);
      if (at === -1) throw new Error('Document has no entry for hopper rune "' + h.rune + '".');
      const digits = doc.s.substr(at + 2, 2);
      targets[n] = parseNumber(digits);

      if (!Number.isFinite(gauges[n - 1]) || !Number.isFinite(targets[n])) {
        throw new Error('Hit an undecoded digit rune — the digit code may be wrong.');
      }
    }
    return { gauges, targets, coalHopper };
  }

  // === Applying the solution (gauges, hoppers, button) =====================

  async function applySolution(sol, log) {
    // 1) Gauges. temp{n-1} = gauge for hopper n.
    log('Setting gauges to ' + sol.gauges.join(', ') + '…');
    await get('dwarfcontraption.php?action=gauges&temp0=' + sol.gauges[0] +
      '&temp1=' + sol.gauges[1] + '&temp2=' + sol.gauges[2] +
      '&temp3=' + sol.gauges[3] + '&action=dogauges');

    // 2) Coal via the chamber: convert (target - current) lumps of diamond.
    if (sol.coalHopper) {
      const cur = STATE.hoppers[String(sol.coalHopper)].count || 0;
      const need = Math.max(0, sol.targets[sol.coalHopper] - cur);
      if (need > 0) {
        log('Converting ' + need + ' lump(s) of diamond to coal in the chamber…');
        await get('dwarfcontraption.php?action=chamber&action=dochamber&howmany=' +
          need + '&whichitem=' + ID.DIAMOND);
      }
    }

    // 3) Fill each hopper up to its target, then RE-READ to confirm it worked.
    //    A fill silently does nothing if you don't actually own the ore, so we
    //    verify counts rather than trusting the request.
    const shortfalls = [];
    for (let n = 0; n < 4; n++) {
      let h = await readHopper(n); // fresh read; updates STATE.hoppers
      const hopperNum = n + 1;
      const ore = h.ore;
      const target = sol.targets[hopperNum];
      const add = Math.max(0, target - (h.count || 0));
      if (ore && add > 0) {
        // Coal was just produced from diamonds in step 2; it fills like any ore.
        log('Hopper ' + hopperNum + ' (' + ore + '): adding ' + add + ' to reach ' + target + '…');
        await get('dwarfcontraption.php?action=hopper' + n + '&action=dohopper' + n +
          '&howmany=' + add + '&whichore=' + ore);
        h = await readHopper(n); // confirm
      }
      const got = h.count || 0;
      if (got !== target) {
        const why = ore
          ? (ore === 'coal'
            ? ' — not enough coal (have lumps of diamond ready for the chamber)'
            : ' — you appear to be short ' + (target - got) + ' ' + ore + ' ore')
          : '';
        log('Hopper ' + hopperNum + ': ' + got + '/' + target + why + '.');
        shortfalls.push(hopperNum);
      } else {
        log('Hopper ' + hopperNum + ': ' + got + '/' + target + ' ✔');
      }
    }

    if (shortfalls.length) {
      log('NOT pushing the button — hopper(s) ' + shortfalls.join(', ') +
        ' are not at their target (almost always missing ore). Acquire the ore ' +
        'listed above and click Solve again; gauges are already set, so it will ' +
        'just top up the hoppers and push.');
      return false;
    }

    // 4) All hoppers correct — push the red button (costs an adventure).
    log('All hoppers at target. Pushing the red button…');
    await get('dwarfcontraption.php?action=panelright&action=dorightpanel&action=doredbutton');

    // 5) Check the bin.
    const bin = await get('dwarfcontraption.php?action=bin');
    if (/acquire an item/i.test(bin)) {
      log('PUZZLE SOLVED — item delivered to the bin! ✔');
      return true;
    }
    log('Pushed, but the bin shows no item. Double-check the gauges read correctly ' +
      'on the page; if they look wrong, the digit code may be off.');
    return false;
  }

  // === Higher-level flows ==================================================

  // Read all four hoppers; if any is empty, probe it with one of each ore type
  // you might own so its rune/ore can be identified (mirrors .ash hopper_check).
  async function refreshHoppers(log) {
    for (let n = 0; n < 4; n++) {
      let h = await readHopper(n);
      if (h.empty) {
        log('Hopper ' + (n + 1) + ' empty — probing with 1 of each ore you hold…');
        for (const ore of ORES) {
          await seedHopper(n, ore);
          h = await readHopper(n);
          if (!h.empty) break;
        }
      }
      if (!h.empty) log('Hopper ' + (n + 1) + ': rune "' + h.rune + '", ' + h.count +
        ' ' + (h.ore || '?') + '.');
      else log('Hopper ' + (n + 1) + ': could not identify (no ore to probe with).');
    }
    saveState();
  }

  async function decodeOwnedOfficeItems(log) {
    for (const id of ID.CARDS) {
      const s = await useAndDecode(id, true);
      if (s) log('Card ' + id + ' -> ' + s);
    }
    for (const id of ID.DOCS) {
      const s = await useAndDecode(id, false);
      if (s) log('Document ' + id + ' -> ' + s);
    }
  }

  // ONE-CLICK SOLVE: assumes you already gathered everything (cards, the matching
  // document, the punchcard fed in, the digit code solved, ore on hand). Reads
  // hoppers + decodes any office items in inventory, derives oi_rune if possible,
  // then applies the solution.
  async function runSolve(log) {
    if (!PWD) { log('ERROR: could not find your pwd hash.'); return; }
    log('--- One-click Solve ---');

    // Make sure the digit code is solved from any stored rolls.
    if (!STATE.digitRunes) {
      const d = solveDigitsFromRolls();
      if (d) { STATE.digitRunes = d; saveState(); log('Digit code: ' + d); }
    }
    await refreshHoppers(log);
    await decodeOwnedOfficeItems(log);

    if (!STATE.oiRune) {
      // Try to derive from the warehouse without spending many turns; if the
      // user already set it via the override field this is skipped.
      log('oi_rune unknown — attempting Warehouse derivation (may use turns)…');
      const r = await deriveOiRuneFromWarehouse(log);
      if (r) { STATE.oiRune = r; saveState(); log('Derived oi_rune = "' + r + '".'); }
      else { log('Could not derive oi_rune. Set it manually in the panel, then Solve again.'); return; }
    }

    let sol;
    try { sol = computeSolution(); }
    catch (e) { log('Cannot solve yet: ' + e.message); return; }

    log('Gauges ' + sol.gauges.join(',') + ' | targets ' +
      JSON.stringify(sol.targets) + (sol.coalHopper ? ' | coal hopper ' + sol.coalHopper : ''));
    await applySolution(sol, log);
  }

  // FULL AUTO-PILOT (confirm-gated): solve digit code by rolling dice; ensure the
  // punchcard is fed; adventure the office until cards/document are in hand;
  // derive oi_rune from the warehouse; PAUSE for ore; then solve.
  async function runAutopilot(log) {
    if (!PWD) { log('ERROR: could not find your pwd hash.'); return; }
    log('--- Full auto-pilot ---');

    // 1) Digit code via Dwarvish Dice.
    if (!STATE.digitRunes) {
      log('Solving the digit code by rolling Dwarvish Dice…');
      for (let i = 0; i < 60 && !STATE.digitRunes; i++) {
        await rollDiceOnce();
        const d = solveDigitsFromRolls();
        if (d) { STATE.digitRunes = d; saveState(); log('Digit code solved: ' + d); break; }
      }
      if (!STATE.digitRunes) { log('Could not solve digit code in 60 rolls — stopping.'); return; }
    }

    // 2) Punchcard into the right panel (idempotent: server ignores if absent).
    const right = await get('dwarfcontraption.php?action=panelright');
    if (!/punchcard sticking slightly out/i.test(right)) {
      log('Feeding the punchcard into the right panel…');
      await get('dwarfcontraption.php?action=panelright&action=dorightpanel');
    }

    // 3) Select the chosen piece on the left panel so the warehouse reveals it.
    const piece = PIECES[STATE.piece || 'helmet'];
    log('Selecting ' + piece.label + ' on the left panel…');
    await get('dwarfcontraption.php?action=panelleft&action=doleftpanel&' +
      piece.activate + '=%C2%A0%C2%A0%C2%A0%C2%A0');

    // 4) Adventure the office for cards + the matching document, decoding as we go.
    //    We stop early if an adventure result looks like combat / an unexpected page.
    log('Adventuring the Mine Foremens\' Office for cards & document…');
    for (let i = 0; i < 25; i++) {
      await decodeOwnedOfficeItems(log);
      // oi_rune lets us know which document we still need; if we can already
      // compute a solution, we have enough office items.
      if (!STATE.oiRune) {
        const r = await deriveOiRuneFromWarehouse(log);
        if (r) { STATE.oiRune = r; saveState(); log('oi_rune = "' + r + '".'); }
      }
      if (STATE.oiRune && pickDocument() &&
        ID.CARDS.every((id) => STATE.office[String(id)])) break;
      const adv = await get('adventure.php?snarfblat=' + OFFICE_SNARFBLAT);
      if (/fight\.php|Combat|monstername/i.test(adv) && !/results/i.test(adv)) {
        log('An office adventure landed in combat / an unexpected page. Resolve it ' +
          'manually, then run auto-pilot again.');
        return;
      }
      if (/not enough|no more adventures|ran out of/i.test(adv)) {
        log('Out of adventures. Restore turns and run auto-pilot again.'); return;
      }
    }

    await refreshHoppers(log);

    // 5) Compute and PAUSE for ore.
    let sol;
    try { sol = computeSolution(); }
    catch (e) { log('Cannot compute solution: ' + e.message); return; }
    const needList = [];
    for (let n = 1; n <= 4; n++) {
      const h = STATE.hoppers[String(n)];
      const add = Math.max(0, sol.targets[n] - (h.count || 0));
      if (add > 0) needList.push(add + ' ' + (h.ore || ('hopper ' + n)));
    }
    log('Gauges ' + sol.gauges.join(',') + ' | targets ' + JSON.stringify(sol.targets));
    if (needList.length) {
      const ok = confirm('Auto-pilot needs you to supply ore before filling the hoppers ' +
        '(mining/buying is not automated):\n\n  ' + needList.join('\n  ') +
        '\n\n(For coal, have that many lumps of diamond — they are converted in the chamber.)' +
        '\n\nClick OK once the ore/diamonds are in your inventory to set gauges, fill ' +
        'hoppers and push the button. Cancel to stop here.');
      if (!ok) { log('Paused before filling. Re-run auto-pilot when ready.'); return; }
    }
    await applySolution(sol, log);
  }

  // === UI ==================================================================

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'tm-dwafa-panel';
    panel.style.cssText = [
      'max-width:560px', 'margin:8px auto', 'padding:8px',
      'border:2px solid #663300', 'background:#fff8ef',
      'font-family:arial', 'font-size:11px', 'text-align:left',
    ].join(';');

    const title = document.createElement('div');
    title.innerHTML = '<b>Dwarven Factory Solver</b> ' +
      '<span style="color:#888">(port of dwafa.ash — untested in-game)</span>';
    panel.appendChild(title);

    // Piece chooser.
    const pieceRow = document.createElement('div');
    pieceRow.style.cssText = 'margin-top:6px';
    pieceRow.appendChild(document.createTextNode('Forge: '));
    const pieceSel = document.createElement('select');
    Object.keys(PIECES).forEach((k) => {
      const o = document.createElement('option');
      o.value = k; o.textContent = PIECES[k].label;
      pieceSel.appendChild(o);
    });
    pieceSel.value = STATE.piece || 'helmet';
    pieceSel.addEventListener('change', () => { STATE.piece = pieceSel.value; saveState(); });
    if (!STATE.piece) { STATE.piece = pieceSel.value; saveState(); }
    pieceRow.appendChild(pieceSel);

    // oi_rune manual override.
    pieceRow.appendChild(document.createTextNode('   oi_rune: '));
    const oiInput = document.createElement('input');
    oiInput.type = 'text'; oiInput.maxLength = 1; oiInput.size = 2;
    oiInput.value = STATE.oiRune || '';
    oiInput.title = 'The chosen piece\'s word rune. Leave blank to auto-derive from the Warehouse.';
    oiInput.addEventListener('change', () => {
      STATE.oiRune = oiInput.value.trim() || null; saveState();
    });
    pieceRow.appendChild(oiInput);
    panel.appendChild(pieceRow);

    // Buttons.
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'margin-top:8px;display:flex;gap:6px;flex-wrap:wrap';

    const log = makeLogger(panel);

    function busy(fn) {
      return async function () {
        Array.from(btnRow.querySelectorAll('button')).forEach((b) => (b.disabled = true));
        try { await fn(log); }
        catch (e) { log('Unexpected error: ' + (e && e.message ? e.message : e)); console.error(e); }
        Array.from(btnRow.querySelectorAll('button')).forEach((b) => (b.disabled = false));
      };
    }

    btnRow.appendChild(mkBtn('Read state', busy(async (l) => {
      l('--- Reading state ---');
      if (!STATE.digitRunes) {
        const d = solveDigitsFromRolls();
        if (d) { STATE.digitRunes = d; saveState(); }
      }
      l('Digit code: ' + (STATE.digitRunes || '(unsolved)'));
      await refreshHoppers(l);
      await decodeOwnedOfficeItems(l);
      l('Done. oi_rune = ' + (STATE.oiRune || '(unknown)'));
    })));

    btnRow.appendChild(mkBtn('Solve (one-click)', busy(runSolve)));

    const auto = mkBtn('Full auto-pilot', busy(async (l) => {
      if (!confirm(
        'Full auto-pilot will, for the ' + PIECES[STATE.piece || 'helmet'].label + ':\n' +
        ' • roll the Dwarvish Dice repeatedly to crack the digit code,\n' +
        ' • feed the punchcard and adventure the Mine Foremens\' Office (uses turns),\n' +
        ' • visit the Warehouse to learn the word rune (uses turns),\n' +
        ' • then PAUSE so you can supply the required ore (it will NOT mine or buy),\n' +
        ' • and finally set the gauges, fill the hoppers and push the red button.\n\n' +
        'It stops if an adventure hits combat or an unexpected page. Proceed?')) {
        l('Auto-pilot cancelled.'); return;
      }
      await runAutopilot(l);
    }));
    auto.style.background = '#ffe0e0';
    btnRow.appendChild(auto);

    btnRow.appendChild(mkBtn('Reset state', busy(async (l) => {
      if (!confirm('Clear all decoded factory state (digit code, hoppers, cards, oi_rune)?')) return;
      localStorage.removeItem(LS_KEY);
      Object.keys(STATE).forEach((k) => delete STATE[k]);
      STATE.office = {}; STATE.hoppers = {}; STATE.diceRolls = [];
      oiInput.value = '';
      l('State cleared.');
    })));

    panel.appendChild(btnRow);
    return panel;
  }

  function mkBtn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function makeLogger(panel) {
    const box = document.createElement('div');
    box.style.cssText = [
      'margin-top:8px', 'padding:6px', 'max-height:220px', 'overflow:auto',
      'background:#111', 'color:#9f9', 'font:11px/1.4 monospace',
      'white-space:pre-wrap', 'border:1px solid #663300',
    ].join(';');
    box.textContent = 'Ready. "Read state" is safe (no turns). "Full auto-pilot" spends turns.';
    panel.appendChild(box);
    return function (msg) {
      box.textContent += '\n' + msg;
      box.scrollTop = box.scrollHeight;
      console.log('[DwaFa] ' + msg);
    };
  }

  // Insert the panel at the top of the machine-room page.
  const panel = buildPanel();
  if (document.body) document.body.insertBefore(panel, document.body.firstChild);
  else window.addEventListener('load', () =>
    document.body.insertBefore(panel, document.body.firstChild));
})();
