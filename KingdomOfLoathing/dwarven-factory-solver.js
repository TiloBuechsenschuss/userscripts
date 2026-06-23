// ==UserScript==
// @name         KoL Dwarven Factory Solver
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/dwarven-factory-solver.js
// @version      1.7
// @description  Adds a panel to the Dwarven Machine Room (dwarfcontraption.php) that solves the Dwarven Factory Complex puzzle. A browser port of That FN Ninja's KoLmafia "DwaFa" (dwafa.ash). Solve spends no adventures on its own: it cracks the digit code by rolling the Dwarvish Dice (gambling, which does NOT cost turns), reads the hoppers, decodes the cards/documents, sets the gauges, runs the diamond→coal chamber and fills the hoppers — then tells YOU to press the red button to forge. The outfit word rune (oi_rune) lives only in the Warehouse: a separate opt-in "Determine oi_rune (Warehouse)" button adventures there to find it and caches it per piece (so it costs adventures only once, and may infer another piece by elimination); you can also type it in by hand. The panel includes a "What to do if Solve can't finish" guide.
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
//   * Setting gauges, the coal/diamond chamber, filling hoppers (all turn-free)
//
// TURN POLICY: Solve issues no adventure-costing request. Rolling the Dwarvish
// Dice is gambling, NOT an adventure, so Solve does it automatically to crack the
// digit code. Two things cost adventures, and Solve never does them itself:
//   * Learning the piece's word rune (oi_rune). Only the Warehouse maps a rune to
//     "helmet" vs "mattock" vs "kilt". The opt-in "Determine oi_rune (Warehouse)"
//     button adventures there on demand and caches the result per piece (like the
//     digit code), inferring a second piece by elimination when it can — so it
//     spends adventures only once. Solve itself just reports it's missing and
//     lists the candidate runes for hand entry. (Warehouse read = UNVERIFIED.)
//   * Pressing the red button to forge. Solve sets gauges + hoppers, then stops
//     and tells you to push it (the one adventure of the whole solve).
//
// What is intentionally NOT done automatically (by design / safety):
//   * Mining for ore. dwafa.ash calls mine(), which is the *separate* miner.ash
//     grid solver that was not provided. Solve therefore reports the ore it still
//     needs (target amounts are shown) instead of mining or buying.
//   * Silent mall purchases of ore (risky meat spend) — same report.
//   * Adventuring the Mine Foremens' Office for the cards/document. That can land
//     in combat or an unexpected page, so Solve leaves it to you and just tells
//     you what it still needs in hand.
//
// UNTESTED IN-GAME: this was written from the .ash + mafia source + the wiki, not
// validated against a live factory (the puzzle is ascension-gated). Treat the
// first run as a careful, supervised one. Open the browser console for a log.
// ----------------------------------------------------------------------------

(function () {
  'use strict';

  // The all-in-one loader @requires every KoL script onto the union of matched pages;
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

  // Human label per document item id, for telling the user which one to read.
  const DOC_LABEL = { 3212: 'paper', 3213: 'document', 3214: 'parchment' };

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
  //   oiByPiece  : { helmet|mattock|kilt : wordRune } learned per piece. The word
  //                rune MUST match the piece selected on the left panel, so it is
  //                tracked per piece rather than as one global value.
  //   oiRune     : the resolved word rune for the *currently selected* piece
  //                (set from oiByPiece by resolveOiRune; consumed by the math)
  //   piece      : "helmet" | "mattock" | "kilt"
  const STATE = loadState();
  STATE.office = STATE.office || {};
  STATE.hoppers = STATE.hoppers || {};
  STATE.diceRolls = STATE.diceRolls || [];
  STATE.oiByPiece = STATE.oiByPiece || {};
  // Migrate an older flat oiRune onto the selected piece so it isn't lost.
  if (STATE.oiRune && STATE.piece && !STATE.oiByPiece[STATE.piece]) {
    STATE.oiByPiece[STATE.piece] = STATE.oiRune;
  }

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
  // Port of mafia's permutation elimination. Rolling the Dwarvish Dice is gambling
  // (it does NOT cost an adventure), so the solver rolls automatically. We keep all
  // 7! orderings of the 7 distinct digit runes and drop any inconsistent with an
  // observed roll. A roll "AB-CD=xx": value(AB) - value(CD) == xx (base-7), with the
  // mafia quirk that "the same rune twice in the high number, at digit 0" means 49.

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

  // Roll the dice once; append the parsed roll string. Returns {roll}. Gambling,
  // so this does not cost an adventure.
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

  // === Word rune (oi_rune) =================================================
  // The chosen piece's word rune. Everything else in this puzzle is machine-
  // readable, but WHICH secret rune maps to "helmet" vs "mattock" vs "kilt"
  // lives only in the Warehouse, and visiting the Warehouse costs adventures. So
  // Solve never does it; the result is found once by the opt-in "Determine
  // oi_rune (Warehouse)" button (deriveOiRuneFromWarehouse) and cached per piece
  // in STATE.oiByPiece, exactly like the digit code. Failing that, the user reads
  // the rune themselves; listOiCandidates() narrows it to the (usually three)
  // first-runes of the documents they already hold.

  // The first word rune of each decoded document the player owns, with a label.
  // These are the three candidate oi_runes; the Warehouse says which is helmet.
  function oiCandidates() {
    const out = [];
    ID.DOCS.forEach((id) => {
      const s = STATE.office[String(id)];
      if (s && s[0]) out.push({ id, label: DOC_LABEL[id], rune: s[0] });
    });
    return out;
  }

  // Tell the user the candidate runes (no turns), or what to fetch if none.
  function listOiCandidates(log, key) {
    const cands = oiCandidates();
    if (cands.length) {
      log('Candidate word runes — the first rune of each dwarvish document you own:');
      cands.forEach((c) => log('    ' + c.rune + '   (from the dwarvish ' + c.label + ')'));
      log('One of these is the ' + PIECES[key].label + '\'s. The Warehouse shows ' +
        'which: type that rune into the oi_rune box and Solve again.');
    } else {
      log('No dwarvish documents decoded yet. Adventure the Mine Foremens\' Office ' +
        'until you hold the dwarvish paper/document/parchment, then click Read state.');
    }
  }

  // The set of equipment word runes used as keys in the decoded laminated cards.
  // In a card "B,HGIG,MGDE,PJD" the entries after the first comma are keyed by the
  // three piece runes (their first char). That set is the candidate oi_runes.
  function equipmentRuneKeysFromCards() {
    const keys = new Set();
    ID.CARDS.forEach((id) => {
      const s = STATE.office[String(id)];
      if (!s) return;
      const parts = s.split(',');
      for (let i = 1; i < parts.length; i++) if (parts[i]) keys.add(parts[i][0]);
    });
    return keys;
  }

  // Determine the SELECTED piece's word rune by adventuring the Warehouse (costs a
  // turn per visit). The piece must already be selected on the left panel; the
  // Warehouse then shows a word rune that also keys an entry in our cards — that's
  // oi_rune. Returns the rune, or null (with a logged reason). UNVERIFIED in-game.
  async function deriveOiRuneFromWarehouse(log) {
    const eqKeys = equipmentRuneKeysFromCards();
    if (!eqKeys.size) {
      log('No decoded laminated cards yet, so there is nothing to match the ' +
        'Warehouse runes against. Get the four cards and Read state first.');
      return null;
    }
    for (let tries = 0; tries < 12; tries++) {
      const html = await get('dwarffactory.php?action=ware');
      const all = parseRunes(html);
      // If the page gives no runes at all, this reader doesn't work on this game.
      // Bail immediately rather than spending 12 turns to learn the same thing.
      if (!all.length) {
        log('Warehouse visit ' + (tries + 1) + ' returned no runes — the automatic ' +
          'reader does not work on your game (this is the untested part of the port). ' +
          'Stopping so it does not waste more turns; enter oi_rune by hand instead.');
        return null;
      }
      const runes = all.filter((r) => r.type === 'Word').map((r) => r.rune);
      const hit = runes.filter((r) => eqKeys.has(r));
      if (hit.length === 1) { return hit[0]; }
      log('Warehouse visit ' + (tries + 1) + ': word runes ' + runes.join('') +
        (hit.length ? ' (ambiguous: ' + hit.join('') + ')' : ' (no equipment rune yet)'));
    }
    return null;
  }

  // If two of the three pieces' runes are known and the cards give exactly three
  // candidate runes, the third piece must own the remaining candidate. Filling it
  // in means the Warehouse is needed at most twice per ascension. Returns the
  // inferred {piece, rune}, or null if it can't be determined safely.
  function inferRemainingOiRune() {
    const cands = Array.from(equipmentRuneKeysFromCards());
    if (cands.length !== 3) return null;
    const pieces = Object.keys(PIECES); // helmet, mattock, kilt
    const known = pieces.filter((p) => STATE.oiByPiece[p]);
    if (known.length !== 2) return null;
    const usedRunes = known.map((p) => STATE.oiByPiece[p]);
    if (!usedRunes.every((r) => cands.includes(r))) return null; // mapping must fit
    const piece = pieces.find((p) => !STATE.oiByPiece[p]);
    const rune = cands.find((r) => !usedRunes.includes(r));
    if (!piece || !rune) return null;
    STATE.oiByPiece[piece] = rune;
    saveState();
    return { piece, rune };
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
    if (!STATE.digitRunes) throw new Error('Digit code not solved yet — Solve rolls the Dwarvish Dice to crack it (free); run Solve again, or type a known code into the Digit code box.');
    if (!STATE.oiRune) throw new Error('Outfit word rune (oi_rune) not set — visit the Warehouse, read the rune by the piece, and type it into the oi_rune box.');
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

  // === Applying the solution (gauges, hoppers; you press the button) =======
  // All of this is turn-free: setting gauges, running the diamond->coal chamber
  // and filling hoppers don't cost adventures. Only the red button does, so this
  // stops once the hoppers are correct and tells you to press it yourself.

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
      log('Hopper(s) ' + shortfalls.join(', ') + ' are not at their target (almost ' +
        'always missing ore). Acquire the ore listed above and click Solve again; ' +
        'gauges are already set, so it will just top up the hoppers.');
      return false;
    }

    // 4) All hoppers correct. The red button is the only turn-costing step, so the
    //    solver stops here and hands it to you.
    const label = PIECES[STATE.piece || 'helmet'].label;
    log('✔ Everything is set: gauges ' + sol.gauges.join(',') + ' and every hopper at ' +
      'its target. NOW PRESS THE RED BUTTON yourself to forge the ' + label + '. That ' +
      'is the only step that costs an adventure, so the solver leaves it to you. ' +
      '(After it forges, your item is in the bin.)');
    return true;
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

  // Select the chosen piece on the left panel. This is what tells the machine
  // WHICH item to forge; without it the gauges/ore are correct but nothing drops
  // into the bin. (Mirrors dwafa.ash's panelleft step.)
  async function selectPiece(log) {
    const piece = PIECES[STATE.piece || 'helmet'];
    log('Selecting ' + piece.label + ' on the left panel…');
    await get('dwarfcontraption.php?action=panelleft&action=doleftpanel&' +
      piece.activate + '=%C2%A0%C2%A0%C2%A0%C2%A0');
  }

  // Feed the punchcard into the right panel if it isn't already in. The red
  // button only works once the punchcard is seated.
  async function ensurePunchcard(log) {
    const right = await get('dwarfcontraption.php?action=panelright');
    if (!/punchcard sticking slightly out/i.test(right)) {
      log('Feeding the punchcard into the right panel…');
      await get('dwarfcontraption.php?action=panelright&action=dorightpanel');
    }
  }

  // Resolve oi_rune for the CURRENTLY SELECTED piece, WITHOUT spending turns.
  // Uses the cached/typed value if present. Otherwise it can't be deduced (the
  // piece->rune mapping lives in the Warehouse), so we decode the documents to
  // surface the candidate runes and tell the user to type the right one. The
  // turn-spending Warehouse auto-read is a separate, opt-in button.
  async function resolveOiRune(log) {
    const key = STATE.piece || 'helmet';
    const cached = STATE.oiByPiece[key];
    if (cached) {
      STATE.oiRune = cached; saveState();
      log('Word rune for ' + PIECES[key].label + ' = "' + cached + '" (cached).');
      return true;
    }
    // Make sure the documents are decoded so we can show the candidate runes.
    for (const id of ID.DOCS) {
      if (!STATE.office[String(id)]) await useAndDecode(id, false);
    }
    log('The word rune (oi_rune) for ' + PIECES[key].label + ' is not set yet, and ' +
      'it can\'t be deduced from your inventory alone — only the Warehouse knows ' +
      'which rune is this piece. Either click "Determine oi_rune (Warehouse)" to ' +
      'find it automatically (spends adventures once, then cached), or set it by hand:');
    listOiCandidates(log, key);
    return false;
  }

  // Crack the digit code. Uses a cached/typed code if present; otherwise rolls the
  // Dwarvish Dice until the elimination converges. Rolling is gambling, not an
  // adventure, so this is done automatically (no confirm). Returns true on success.
  async function solveDigitCode(log) {
    if (STATE.digitRunes) return true;
    let d = solveDigitsFromRolls();
    if (d) { STATE.digitRunes = d; saveState(); log('Digit code: ' + d); return true; }

    log('Rolling the Dwarvish Dice to crack the digit code (gambling — costs meat ' +
      'but no turns)…');
    for (let i = 0; i < 60 && !STATE.digitRunes; i++) {
      await rollDiceOnce();
      d = solveDigitsFromRolls();
      if (d) { STATE.digitRunes = d; saveState(); log('Digit code solved: ' + d); return true; }
    }
    log('Could not solve the digit code in 60 rolls. Run Solve again to roll more, ' +
      'or type a known code into the Digit code box.');
    return false;
  }

  // ONE-CLICK SOLVE: crack the digit code (rolling dice — free), select the piece,
  // feed the punchcard, resolve its word rune, read hoppers + decode any office
  // items in inventory, compute, set gauges/hoppers, then tell you to visit the
  // Warehouse (if oi_rune is unknown) and to press the red button. The only
  // adventure-costing steps — Warehouse and red button — are left to you.
  async function runSolve(log) {
    if (!PWD) { log('ERROR: could not find your pwd hash.'); return; }
    log('--- One-click Solve ---');

    if (!(await solveDigitCode(log))) return;

    // Tell the machine what to build, seat the punchcard, and pin oi_rune to that
    // same piece. Doing this before the math keeps the solution self-consistent.
    await selectPiece(log);
    await ensurePunchcard(log);
    if (!(await resolveOiRune(log))) return;

    await refreshHoppers(log);
    await decodeOwnedOfficeItems(log);

    let sol;
    try { sol = computeSolution(); }
    catch (e) { log('Cannot solve yet: ' + e.message); return; }

    log('Gauges ' + sol.gauges.join(',') + ' | targets ' +
      JSON.stringify(sol.targets) + (sol.coalHopper ? ' | coal hopper ' + sol.coalHopper : ''));
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
    if (!STATE.piece) { STATE.piece = pieceSel.value; saveState(); }
    pieceRow.appendChild(pieceSel);

    // oi_rune manual entry (per piece). You read this rune at the Warehouse.
    pieceRow.appendChild(document.createTextNode('   oi_rune: '));
    const oiInput = document.createElement('input');
    oiInput.type = 'text'; oiInput.maxLength = 1; oiInput.size = 2;
    oiInput.title = 'This piece\'s word rune. Visit the Warehouse, read the rune ' +
      'shown next to the piece, and type it here (it\'s the first rune of that ' +
      'piece\'s dwarvish document). Remembered per piece.';
    const syncOi = () => { oiInput.value = STATE.oiByPiece[pieceSel.value] || ''; };
    syncOi();
    // Changing the piece swaps the cached rune shown; the panel/document must
    // match whichever piece is selected.
    pieceSel.addEventListener('change', () => {
      STATE.piece = pieceSel.value;
      STATE.oiRune = STATE.oiByPiece[pieceSel.value] || null;
      saveState(); syncOi();
    });
    oiInput.addEventListener('change', () => {
      const v = oiInput.value.trim();
      if (v) STATE.oiByPiece[pieceSel.value] = v;
      else delete STATE.oiByPiece[pieceSel.value];
      STATE.oiRune = v || null;
      saveState();
    });
    pieceRow.appendChild(oiInput);
    panel.appendChild(pieceRow);

    // Digit-code box (optional). Solve cracks this for free by rolling the Dwarvish
    // Dice, so you normally leave it blank; it's here to display the solved code and
    // to let you paste a known one (e.g. KoLmafia's lastDwarfDigitRunes) to skip the
    // rolling. Refreshed from STATE after Solve/Read state by refreshInputs().
    const digitRow = document.createElement('div');
    digitRow.style.cssText = 'margin-top:6px';
    digitRow.appendChild(document.createTextNode('Digit code (7 runes): '));
    const digitInput = document.createElement('input');
    digitInput.type = 'text'; digitInput.maxLength = 7; digitInput.size = 10;
    digitInput.title = 'The seven digit runes in value order 0..6. Leave blank and ' +
      'Solve will roll the Dwarvish Dice to find them (free — gambling, not turns). ' +
      'Or paste KoLmafia\'s lastDwarfDigitRunes to skip rolling. Remembered until Reset.';
    digitInput.value = STATE.digitRunes || '';
    digitInput.addEventListener('change', () => {
      const v = digitInput.value.trim();
      STATE.digitRunes = v || null;
      saveState();
    });
    digitRow.appendChild(digitInput);
    panel.appendChild(digitRow);

    // Buttons.
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'margin-top:8px;display:flex;gap:6px;flex-wrap:wrap';

    const log = makeLogger(panel);

    // Re-sync the input boxes from STATE (e.g. after Solve auto-rolls the dice).
    const syncDigit = () => { digitInput.value = STATE.digitRunes || ''; };

    function busy(fn) {
      return async function () {
        Array.from(btnRow.querySelectorAll('button')).forEach((b) => (b.disabled = true));
        try { await fn(log); }
        catch (e) { log('Unexpected error: ' + (e && e.message ? e.message : e)); console.error(e); }
        syncOi(); syncDigit();
        Array.from(btnRow.querySelectorAll('button')).forEach((b) => (b.disabled = false));
      };
    }

    btnRow.appendChild(mkBtn('Read state', busy(async (l) => {
      l('--- Reading state ---');
      // Try to finish the digit code from any rolls already gathered (no new rolls).
      if (!STATE.digitRunes) {
        const d = solveDigitsFromRolls();
        if (d) { STATE.digitRunes = d; saveState(); }
      }
      l('Digit code: ' + (STATE.digitRunes ||
        '(unsolved — Solve will roll the Dwarvish Dice to crack it, free)'));
      await refreshHoppers(l);
      await decodeOwnedOfficeItems(l);
      const key = STATE.piece || 'helmet';
      if (STATE.oiByPiece[key]) {
        l('Done. oi_rune for ' + PIECES[key].label + ' = "' + STATE.oiByPiece[key] + '".');
      } else {
        l('Done. oi_rune for ' + PIECES[key].label + ' is not set yet.');
        listOiCandidates(l, key);
      }
    })));

    btnRow.appendChild(mkBtn('Solve (one-click)', busy(runSolve)));

    // Standalone, opt-in Warehouse determination of the SELECTED piece's word rune.
    // Spends adventures, but the result is cached per piece (like the digit code),
    // so it only needs to run once per piece — and may infer a second by elimination.
    btnRow.appendChild(mkBtn('Determine oi_rune (Warehouse)', busy(async (l) => {
      if (!PWD) { l('ERROR: could not find your pwd hash.'); return; }
      const key = STATE.piece || 'helmet';
      if (STATE.oiByPiece[key]) {
        l('oi_rune for ' + PIECES[key].label + ' is already known: "' +
          STATE.oiByPiece[key] + '". (Use Reset to redo it.)');
        return;
      }
      if (!confirm('Determine the ' + PIECES[key].label + '\'s word rune by ' +
        'adventuring the Warehouse?\n\nThis SPENDS ADVENTURES (one per visit, up to ' +
        '~12). The result is saved, so you only do it once per piece. It is the ' +
        'untested part of this port and may fail — it stops after one turn if the ' +
        'Warehouse returns nothing.')) {
        l('Warehouse determination cancelled.'); return;
      }
      l('--- Determine oi_rune (Warehouse) ---');
      await decodeOwnedOfficeItems(l);     // cards must be decoded to recognise the rune
      await selectPiece(l);                // Warehouse reveals the selected piece's rune
      const r = await deriveOiRuneFromWarehouse(l);
      if (r) {
        STATE.oiByPiece[key] = r; STATE.oiRune = r; saveState();
        l('✔ ' + PIECES[key].label + '\'s word rune = "' + r + '" (saved).');
        const inf = inferRemainingOiRune();
        if (inf) {
          l('✔ Inferred ' + PIECES[inf.piece].label + '\'s word rune = "' + inf.rune +
            '" by elimination (saved) — no more Warehouse trips needed.');
        }
        l('Now click Solve.');
      } else {
        l('Could not determine it automatically. Read the rune at the Warehouse ' +
          'yourself and type it into the oi_rune box:');
        listOiCandidates(l, key);
      }
    })));

    btnRow.appendChild(mkBtn('Reset state', busy(async (l) => {
      if (!confirm('Clear all decoded factory state (digit code, hoppers, cards, oi_rune)?')) return;
      localStorage.removeItem(LS_KEY);
      Object.keys(STATE).forEach((k) => delete STATE[k]);
      STATE.office = {}; STATE.hoppers = {}; STATE.diceRolls = []; STATE.oiByPiece = {};
      oiInput.value = '';
      digitInput.value = '';
      l('State cleared.');
    })));

    panel.appendChild(btnRow);
    panel.appendChild(buildHelp());
    return panel;
  }

  // Collapsible guide for when Solve stops short. Solve always logs the exact
  // missing piece; this maps each message to the manual fix.
  function buildHelp() {
    const det = document.createElement('details');
    det.style.cssText = 'margin-top:8px;color:#444';
    const sum = document.createElement('summary');
    sum.style.cssText = 'cursor:pointer;font-weight:bold';
    sum.textContent = 'What to do if Solve can\'t finish';
    det.appendChild(sum);
    const body = document.createElement('div');
    body.style.cssText = 'margin-top:4px;line-height:1.5';
    body.innerHTML =
      'The solver never spends an adventure — it cracks the digit code by rolling the ' +
      'Dwarvish Dice (gambling, not turns), does all the other setup, then asks you to ' +
      'do the two steps that <i>do</i> cost an adventure. Solve reads the log line it ' +
      'stops on; do that step and click <b>Solve</b> again (gauges and progress are ' +
      'kept, so it just resumes):' +
      '<ul style="margin:4px 0 0 16px;padding:0">' +
      '<li><b>Digit code unsolved</b> — normally you do nothing: Solve rolls the ' +
      '<b>Dwarvish Dice</b> until it cracks the code (free — gambling spends meat, not ' +
      'turns). If it can\'t converge, click <b>Solve</b> again to roll more, or paste a ' +
      'known code (e.g. KoLmafia\'s <i>lastDwarfDigitRunes</i>) into the <b>Digit code</b> ' +
      'box. It\'s remembered until you Reset.</li>' +
      '<li><b>oi_rune (word rune) not set</b> — only the <b>Warehouse</b> knows which ' +
      'rune is the piece you\'re forging. Easiest: click <b>Determine oi_rune ' +
      '(Warehouse)</b> — it adventures the Warehouse to find it, caches it per piece ' +
      '(so it only spends adventures once), and may infer a second piece by ' +
      'elimination. If that fails (it\'s the untested part of the port), do it by ' +
      'hand: click <b>Read state</b> for the candidate runes (the first rune of each ' +
      'dwarvish document you own — usually three), visit the Warehouse, see which rune ' +
      'sits next to the piece, and type that single letter into the <b>oi_rune</b> ' +
      'box. To read a rune\'s letter, hover the rune image — its tooltip says ' +
      '<i>"Dwarf Word Rune X"</i>; the <i>X</i> is what you type. Remembered per ' +
      'piece.</li>' +
      '<li><b>"No laminated card" / "No decoded document"</b> — adventure the Mine ' +
      'Foremens\' Office in-game until you hold all four laminated cards and the ' +
      'matching document, then click <b>Read state</b> to decode them and Solve.</li>' +
      '<li><b>"Hopper N: x/target … short"</b> — acquire the listed ore (for coal, ' +
      'carry that many lumps of diamond — they are converted in the chamber), then ' +
      'Solve again to top up.</li>' +
      '<li><b>"NOW PRESS THE RED BUTTON"</b> — the setup is done; press the red ' +
      'button yourself to forge (the only adventure of the solve). The item lands in ' +
      'the bin.</li>' +
      '<li><b>"could not find your pwd hash"</b> — reload the Machine Room page so ' +
      'the charpane is present, then try again.</li>' +
      '</ul>';
    det.appendChild(body);
    return det;
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
    box.textContent = 'Ready. Solve does all the free work (rolling the Dwarvish ' +
      'Dice for the digit code is gambling, not turns), then tells you the only two ' +
      'adventure-costing steps: visit the Warehouse for oi_rune, and press the red ' +
      'button. Enter oi_rune when asked, then click Solve.';
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
