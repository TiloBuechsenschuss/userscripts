// Ad-hoc test for FallenLondon/choice-helper.js's Voyages of Scientific
// Discovery badges.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - **The same branch name is on all three islands.** "Time to go", "Tarry a
//    little" and "Cut it fine" each appear three times and pay a DIFFERENT
//    research page on each; so does the storylet name "Bullbone Island", which
//    is also the area name. A lookup that guessed would quote the wrong
//    currency a third of the time, so it must return null instead.
//  - The Luck arithmetic. "Cut it fine" advertises twice the pages of "Tarry a
//    little" and is worth about a sixth of it once the 70% chance of losing
//    five of every type is priced in. Rank on the advertised half and the badge
//    talks you into the worse action at the one moment the voyage is over.
//  - That an action paying NO pages is labelled rather than scored. Pages and
//    Echoes have no exchange rate here; a `+0` would read as "worthless" for
//    the action that hands you 860 Shards of Glim.
//  - That `orElse` never merges into the page counts — one action, two payouts,
//    the game's choice.
//  - Each island's `pays` against its own per-visit figures, which is the
//    stated-versus-derived cross-check this table can actually make.
//  - The gate in all three greeting states, and that an opened storylet named
//    after an island resolves the island when the greeting cannot.
//  - And that THREE features now share `.branch__title` without clearing each
//    other.
//
// Numbers come from Embarking on a Voyage of Scientific Discovery (Guide) and
// the Expedition Progress table on each island's own page, on fallenlondon.wiki.
//
//   node FallenLondon/test/choice-scientific-voyages.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      this.children.push(child);
      return child;
    },
    remove() {
      const p = this.parentNode;
      if (!p) return;
      p.childNodes = p.childNodes.filter((n) => n !== this);
      p.children = p.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      node.parentNode = p;
      p.children.splice(p.children.indexOf(this) + 1, 0, node);
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
    },
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

// A heading the way the game builds one: the name is a TEXT NODE inside it, not
// a `textContent` property, because `headingName()` walks `childNodes` — it has
// to, so it can skip the "W" anchor `wiki-links.js` appends.
function makeHeading(text) {
  const el = makeEl('h1');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  return el;
}

// `area` drives currentArea(); `roots` drives the `.storylet-root__heading`
// lookup, which is the OTHER way this feature can work out which island it is
// looking at. `null` for the area stands for a greeting that can't be read.
let area = 'Bullbone Island';
let roots = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => (sel === '.storylet-root__heading' ? roots : []),
  querySelector: (sel) => {
    if (sel.includes('.welcome') && area != null) {
      const h1 = makeEl('h1');
      h1.textContent = "It's TheFairUnknown! Welcome to " + area + ', delicious friend!';
      return h1;
    }
    return null;
  },
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { factionText, VSD_OPTIONS, VSD_ISLANDS, VSD_NOTES, VSD_NOTE_KEYS, VSD_ISLAND_ACTIONS,'
    + ' VSD_COLOR_GOODS, VSD_COLOR_LEAVE, VSD_COLOR_SPEND, VSD_COLOR_BEST,'
    + ' VSD_BEST_PER_NOTE, VSD_STRICT_STORYLETS, VSD_CLASS, VSD_BRANCH_CLASS, VSD_BRANCH_FLAG,'
    + ' vsdLuckValue, vsdPages, vsdBadgeText, vsdColor, vsdSpec, vsdStoryletSpec,'
    + ' lookupVsdBranch, lookupVsdStorylet, bestVsdOption, vsdIslandHere, inVsdIsland,'
    + ' ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, PC_OPTIONS, normalizeName, attachBadge,'
    + ' BADGE_CLASS, PC_BRANCH_CLASS, PC_BRANCH_FLAG, FOTZ_BRANCH_CLASS, FOTZ_BRANCH_FLAG,'
    + ' FEATURES, PANELS, renderVsdPanel }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const row = (branch, island) => api.VSD_OPTIONS.find(
  (e) => e.branch === branch && (island === undefined || e.island === island));

// --- the table is well formed ----------------------------------------------

check('every row names a phase, a storylet, a branch and the three page counts',
  api.VSD_OPTIONS.filter((e) =>
    !['prep', 'island', 'organise'].includes(e.phase) || !e.storylet || !e.branch
    || api.VSD_NOTE_KEYS.some((k) => typeof e[k] !== 'number')).map((e) => e.branch), []);

check('every island row carries its island and an Orthos band, and no other row does',
  api.VSD_OPTIONS.filter((e) => (e.phase === 'island') !== !!(e.island && e.orthos))
    .map((e) => e.branch), []);

check('every Orthos band is inside 0–10 and the right way round',
  api.VSD_OPTIONS.filter((e) => e.orthos
    && !(e.orthos[0] >= 0 && e.orthos[1] <= 10 && e.orthos[0] <= e.orthos[1]))
    .map((e) => e.branch), []);

check('every island named on a row is one of the three',
  [...new Set(api.VSD_OPTIONS.filter((e) => e.island).map((e) => e.island))].sort(),
  ['Bullbone Island', 'Corpsecage Island', 'Grunting Fen']);

// A row and a storylet are identified by the PAIR, since three storylets and
// three branches are repeated across the islands on purpose.
check('island plus storylet plus branch identifies a row uniquely',
  new Set(api.VSD_OPTIONS.map((e) =>
    api.normalizeName((e.island || e.phase) + ' ' + e.storylet + ' ' + e.branch))).size,
  api.VSD_OPTIONS.length);

check('the Organise rows spend pages and the others do not',
  api.VSD_OPTIONS.filter((e) =>
    (e.phase === 'organise') !== api.VSD_NOTE_KEYS.some((k) => e[k] < 0))
    .map((e) => e.branch), []);

check('no Voyage name is in any other feature\'s table, so nothing is badged twice',
  api.VSD_OPTIONS.flatMap((e) => [e.storylet, e.branch]).map(api.normalizeName)
    .filter((n) =>
      api.ZEE_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.SPITE_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.FOTZ_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.PC_OPTIONS.some((p) => api.normalizeName(p.name) === n
        || (p.branch && api.normalizeName(p.branch) === n))),
  []);

check('a visit is the guide\'s 21 actions', api.VSD_ISLAND_ACTIONS, 21);

// --- the transcription -----------------------------------------------------

// The cross-check this table can actually make: an island's headline note type
// has to be the one it hands out the most of.
check('each island\'s advertised page type is the one it pays the most of',
  api.VSD_ISLANDS.filter((i) => {
    const top = api.VSD_NOTE_KEYS.reduce((a, b) => (i.best[a] >= i.best[b] ? a : b));
    return top !== i.pays;
  }).map((i) => i.name), []);

check('the three islands, their regions and what they pay',
  api.VSD_ISLANDS.map((i) => [i.name, i.region, i.pays, i.epa]),
  [['Bullbone Island', 'Home Waters', 'cn', 1.88],
   ['Corpsecage Island', 'Stormbones', 'an', 2.00],
   ['Grunting Fen', 'The Sea of Voices', 'tn', 2.21]]);

check('only Grunting Fen needs an item to reach at all',
  api.VSD_ISLANDS.filter((i) => i.needs).map((i) => [i.name, i.needs]),
  [['Grunting Fen', 'Screaming Map']]);

check('each island\'s write-up action pays 150 pages of its own type',
  api.VSD_OPTIONS.filter((e) => e.phase === 'island' && (e.an === 150 || e.cn === 150 || e.tn === 150))
    .map((e) => [e.island, e[api.VSD_ISLANDS.find((i) => i.name === e.island).pays]]),
  [['Bullbone Island', 150], ['Corpsecage Island', 150], ['Grunting Fen', 150]]);

check('the four Preparatory options paying every type at once are the guide\'s four',
  api.VSD_OPTIONS.filter((e) => e.phase === 'prep' && e.an && e.cn && e.tn)
    .map((e) => [e.branch, e.an]),
  [['Pay someone else to research for you', 50], ['Have instruments ground', 50],
   ['Consult your current work', 40], ['Find promising students', 50]]);

check('the three 500-page Organise rows pay the best rate, and the collations the worse',
  api.VSD_OPTIONS.filter((e) => typeof e.perNote === 'number')
    .map((e) => [Math.min(...api.VSD_NOTE_KEYS.map((k) => e[k])), e.perNote]),
  [[-120, 6.25], [-120, 6.25], [-120, 6.25], [-500, 10], [-500, 10], [-500, 10]]);

check('the best rate on the Organise screen is derived, not asserted',
  api.VSD_BEST_PER_NOTE, 10);

check('the Rostygold gamble is the one failure that takes something off you',
  api.VSD_OPTIONS.filter((e) => e.fail && /−100|-100/.test(e.fail)).map((e) => e.branch),
  ['How about we make this more... interesting?']);

// --- the Luck rule ---------------------------------------------------------
//
// The rule this feature exists to get right. Both outcomes and the odds are on
// the wiki, so the badge is ranked on the expected value.

check('the expected value is the arithmetic the wiki supports',
  [api.vsdLuckValue({ odds: 0.7, win: 20, lose: 15 }),
   api.vsdLuckValue({ odds: 0.3, win: 40, lose: 15 })],
  [9.5, 1.5]);

check('so Tarry a little beats Cut it fine, despite advertising half the pages',
  api.bestVsdOption(api.lookupVsdStorylet('Orthos has Found You', 'Bullbone Island')).branch,
  'Tarry a little');

check('and the badge quotes the expectation, marked, not the advertised half',
  [api.vsdBadgeText(row('Tarry a little', 'Bullbone Island')),
   api.vsdBadgeText(row('Cut it fine', 'Bullbone Island'))],
  ['≈CN +9.5?', '≈CN +1.5?']);

check('each island\'s gambles pay that island\'s own page type',
  api.VSD_OPTIONS.filter((e) => e.luck).map((e) => [e.island, e.luck.type]),
  [['Bullbone Island', 'cn'], ['Bullbone Island', 'cn'],
   ['Corpsecage Island', 'an'], ['Corpsecage Island', 'an'],
   ['Grunting Fen', 'tn'], ['Grunting Fen', 'tn']]);

// --- what the badge says ---------------------------------------------------

check('a page-paying action is its type and its amount',
  [api.vsdBadgeText(row('The bones of Bullbone')),
   api.vsdBadgeText(row('Digging up bones and rough justice')),
   api.vsdBadgeText(row('Rich insights'))],
  ['CN +12', 'AN +12', 'TN +150']);

check('an action paying every type at once says so rather than summing them',
  api.vsdBadgeText(row('Pay someone else to research for you')), 'all +50');

// `+0` would read as "worthless" for the action that hands you 860 Shards of
// Glim. It pays no PAGES, which is a different claim.
check('an action paying no pages is labelled with what it does pay, never scored',
  [api.vsdBadgeText(row('Making money')),
   api.vsdBadgeText(row('Acquisition and screaming')),
   api.vsdBadgeText(row('Go searching'))],
  ['Glim ×860', 'Glim ×126', 'Pearls ×200']);

check('and every such row actually carries a headline to show',
  api.VSD_OPTIONS.filter((e) => !e.leave && !e.luck && !api.vsdPages(e) && !e.headline)
    .map((e) => e.branch), []);

check('leaving is its own answer',
  api.VSD_OPTIONS.filter((e) => e.leave).map((e) => api.vsdBadgeText(e)),
  ['leave', 'leave', 'leave']);

check('the three page colours differ, and from all three neutrals',
  new Set(api.VSD_NOTE_KEYS.map((k) => api.VSD_NOTES[k].color)
    .concat([api.VSD_COLOR_GOODS, api.VSD_COLOR_LEAVE, api.VSD_COLOR_SPEND])).size, 6);

check('colour follows the page type, and the goods rows share the neutral',
  [api.vsdColor(row('The bones of Bullbone')),
   api.vsdColor(row('Digging up bones and rough justice')),
   api.vsdColor(row('Listen to the island')),
   api.vsdColor(row('Making money')),
   api.vsdColor(row('Time to go', 'Grunting Fen'))],
  [api.VSD_NOTES.cn.color, api.VSD_NOTES.an.color, api.VSD_NOTES.tn.color,
   api.VSD_COLOR_GOODS, api.VSD_COLOR_LEAVE]);

check('the best Organise rate is picked out and the worse one is not',
  [api.vsdColor(row('Speak to naturalists, hunters and the breeders of monsters')),
   api.vsdColor(row('Collate your cryptopalaeontological work'))],
  [api.VSD_COLOR_BEST, api.VSD_COLOR_SPEND]);

// --- the OR that must not be summed ----------------------------------------

check('an explicit OR is held apart from the page count',
  (() => { const e = row('The bones of Bullbone'); return [e.cn, e.orElse]; })(),
  [12, 'CN 4 x and a Horned Skull instead']);

check('and the tooltip says whose choice it is',
  api.vsdSpec(row('The bones of Bullbone')).title
    .includes('OR, the game’s choice, not yours'), true);

check('the three rows with an OR are the three the wiki marks',
  api.VSD_OPTIONS.filter((e) => e.orElse).map((e) => e.branch),
  ['The bones of Bullbone', 'Examine the ruins for clues', 'What’s written here?']);

// --- the same name on three islands ----------------------------------------

check('a branch name shared by the islands resolves to nothing without one',
  [api.lookupVsdBranch('Tarry a little', null),
   api.lookupVsdBranch('Time to go', null),
   api.lookupVsdBranch('Cut it fine', null)],
  [null, null, null]);

check('and to the right row once the island is known',
  ['Bullbone Island', 'Corpsecage Island', 'Grunting Fen']
    .map((i) => api.lookupVsdBranch('Tarry a little', i).luck.type),
  ['cn', 'an', 'tn']);

check('a branch that is on one island only needs no island at all',
  api.lookupVsdBranch('Wild bees', null).island, 'Bullbone Island');

// A storylet named after its island is NOT ambiguous inside this table — only
// one island has a storylet called "Grunting Fen" — so the lookup answers with
// or without an island. What keeps it from badging a heading somewhere else in
// London is `strict`, not the lookup.
// A storylet named after its island is NOT ambiguous inside this table — only
// one island has a storylet called "Grunting Fen" — so the lookup answers with
// or without an island. What keeps it from badging a heading elsewhere in
// London is VSD_STRICT_STORYLETS, which is a list of its own rather than "any
// branch of mine is strict": deriving it from the branches would gate
// "Sparkling around the Copse" on the one ordinary option inside it.
check('a storylet named after its island is unambiguous in the table',
  [api.lookupVsdStorylet('Grunting Fen', null).length,
   api.lookupVsdStorylet('Grunting Fen', 'Grunting Fen').length],
  [2, 2]);

check('and the storylets that wait for a confirmed island are their own short list',
  api.VSD_STRICT_STORYLETS.map((s) => s).sort(),
  ['Bullbone Island', 'Corpsecage Island', 'Grunting Fen', 'Up the Hill']
    .map(api.normalizeName).sort());

check('every island name is on that list, since the heading and the place read alike',
  api.VSD_ISLANDS.filter((i) =>
    !api.VSD_STRICT_STORYLETS.includes(api.normalizeName(i.name))).map((i) => i.name), []);

// `strict` is for ordinary English phrases and NOTHING else. Spreading it to
// the distinctive names as well ("The bones of Bullbone") would black the
// feature out on the storylet LIST, where nothing is open to resolve the island
// and the greeting is an unverified guess — which is where the badges are most
// use. So the list is pinned by name, not by count.
check('exactly the ordinary-phrase branches are strict',
  [...new Set(api.VSD_OPTIONS.filter((e) => e.strict).map((e) => e.branch))].sort(),
  ['Catch some', 'Cut it fine', 'Do a survey', 'Go searching', 'Looking up',
   'Making money', 'Search the island', 'See what you can dig up', 'Tarry a little',
   'Time to go']);

check('and none of the distinctive island names is strict',
  ['The bones of Bullbone', 'The Corpsecage bat', 'Listen to the island',
   'Wild bees', 'Digging up bones and rough justice']
    .filter((b) => row(b).strict), []);

check('every strict row is on an island — the Lodgings screens need no gate',
  api.VSD_OPTIONS.filter((e) => e.strict && e.phase !== 'island').map((e) => e.branch), []);

check('a Lodgings storylet is never ambiguous, island or no island',
  [api.lookupVsdStorylet('Preparatory Research', null).length,
   api.lookupVsdStorylet('Organise your Research', null).length],
  [10, 10]);

check('an unknown name is null, not an empty list',
  [api.lookupVsdBranch('Zail on', 'Bullbone Island'),
   api.lookupVsdStorylet('Wolfstack Docks', null)],
  [null, null]);

// --- the storylet badge ----------------------------------------------------

check('a storylet badge takes the option paying the island\'s own page type',
  ['Bullbone Island', 'Corpsecage Island', 'Grunting Fen'].map((i) =>
    api.bestVsdOption(api.lookupVsdStorylet(i, i)).branch),
  ['The bones of Bullbone', 'Digging up bones and rough justice', 'Listen to the island']);

check('but the tooltip keeps every option, so the goods one is never hidden',
  (() => {
    const title = api.vsdStoryletSpec(api.lookupVsdStorylet('Bullbone Island', 'Bullbone Island')).title;
    return ['Wild bees', 'A skull of Bullbone, borrowed', 'The bones of Bullbone']
      .map((b) => title.includes(b));
  })(), [true, true, true]);

check('every tooltip carries the rule that actually governs a visit',
  api.VSD_OPTIONS.filter((e) => e.phase === 'island'
    && !api.vsdSpec(e).title.includes('You cannot leave early')).map((e) => e.branch), []);

check('and every Lodgings tooltip carries the one that governs those',
  api.VSD_OPTIONS.filter((e) => e.phase !== 'island'
    && !api.vsdSpec(e).title.includes('locks itself out')).map((e) => e.branch), []);

// --- working out where we are ----------------------------------------------

check('the greeting names the island',
  ['Bullbone Island', 'Corpsecage Island', 'Grunting Fen']
    .map((a) => (area = a, api.vsdIslandHere())),
  ['Bullbone Island', 'Corpsecage Island', 'Grunting Fen']);

check('somewhere else is not one of them',
  (area = 'Wolfstack Docks', [api.vsdIslandHere(), api.inVsdIsland()]), [null, false]);

check('an unreadable greeting is not taken for a confirmation',
  (area = null, [api.vsdIslandHere(), api.inVsdIsland()]), [null, false]);

// The escape hatch: the storylet you have open is on the very screen the
// branches are, and an island storylet names its island.
check('an opened storylet named after an island answers when the greeting cannot',
  (() => {
    area = null;
    roots = [makeHeading('The Little Cave')];
    const answer = api.vsdIslandHere();
    roots = [];
    return answer;
  })(), 'Bullbone Island');

check('and a storylet belonging to no island answers nothing',
  (() => {
    area = null;
    roots = [makeHeading('Preparatory Research')];
    const answer = api.vsdIslandHere();
    roots = [];
    area = 'Bullbone Island';
    return answer;
  })(), null);

// --- three features on one selector ----------------------------------------
//
// `.branch__title` is now walked by fotz-supplication, port-carnelian AND this
// one. Each `host.after()` inserts immediately after the host, so the badge
// drawn last is nearest it; clearing has to walk the run.

const badgesAfter = (head) => {
  const out = [];
  for (let n = head.nextElementSibling;
    n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    out.push(String(n.className).split(' ')[1]);
  }
  return out;
};

check('three features can badge one heading, and each clears only its own',
  (() => {
    const parent = makeEl('div');
    const head = makeEl('h2');
    head.className = 'media__heading branch__title';
    parent.appendChild(head);
    const draw = (cls, flag, value) => api.attachBadge(head, {
      cls: cls, flag: flag, value: value,
      spec: { text: 'x', color: '#000', title: 't' }, place: 'after',
    });
    draw(api.FOTZ_BRANCH_CLASS, api.FOTZ_BRANCH_FLAG, 'a');
    draw(api.PC_BRANCH_CLASS, api.PC_BRANCH_FLAG, 'a');
    draw(api.VSD_BRANCH_CLASS, api.VSD_BRANCH_FLAG, 'a');
    const three = badgesAfter(head).length;
    // React hands the heading a different branch: the FARTHEST badge redraws,
    // and there must still be exactly one of it and three in total.
    draw(api.FOTZ_BRANCH_CLASS, api.FOTZ_BRANCH_FLAG, 'b');
    const after = badgesAfter(head);
    // Then this feature's own badge is cleared, and the other two stay.
    api.attachBadge(head, {
      cls: api.VSD_BRANCH_CLASS, flag: api.VSD_BRANCH_FLAG, value: 'a',
      spec: null, place: 'after',
    });
    return [three, after.length, after.filter((c) => c === api.FOTZ_BRANCH_CLASS).length,
      badgesAfter(head).filter((c) => c === api.VSD_BRANCH_CLASS).length,
      badgesAfter(head).length];
  })(),
  [3, 3, 1, 0, 2]);

// --- the panel -------------------------------------------------------------

check('the panel renders, with a row and a badge for every action in the table',
  (() => {
    const root = api.renderVsdPanel();
    let rows = 0, badges = 0;
    (function walk(el) {
      if (!el || !el.children) return;
      if (el.dataset && el.dataset.vsdSearch) rows++;
      if (String(el.className).split(/\s+/).includes(api.VSD_CLASS)) badges++;
      for (const child of el.children) walk(child);
    })(root);
    return [rows, badges];
  })(),
  [api.VSD_OPTIONS.length, api.VSD_OPTIONS.length]);

check('the feature and the panel are both registered',
  [api.FEATURES.some((f) => f.name === 'scientific-voyages'),
   api.PANELS.some((p) => p.id === 'scientific-voyages' && p.render === api.renderVsdPanel)],
  [true, true]);

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 5).
check('every faction result is on the badge, after it',
  api.VSD_OPTIONS.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name || e.branch, (api.vsdBadgeText(e)).endsWith(' · ' + api.factionText(e.factions))]),
  [["Find promising students",true],["Look at the current trend for Theosophistry",true]]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
