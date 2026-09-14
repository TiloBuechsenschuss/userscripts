// Ad-hoc test for FallenLondon/choice-helper.js's Arbor badges.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The transcription, row by row, and the four places the guide's Table of
//    Choices disagrees with the option pages -- by name, so a "fix" that
//    quietly takes the guide's figure fails.
//  - The one stated-versus-derived cross-check the guide supports: it states
//    the stat at which Spy on London's Embassy and Walk the walls are certain
//    (Watchful 125, Watchful 167), and those follow from the difficulty.
//  - That a row scaling with Permission to Linger or Attar says so in words and
//    never becomes a number, and that "not recorded" (null) and "costs none"
//    (0) read differently.
//  - That the sign on the badge carries the Attar direction by itself -- the
//    colour only repeats it, for a red-green weak reader.
//  - "Light your candles" is in both cities and does different things, so it
//    answers only when the open storylet says which city.
//  - Options are badged only on an Arbor screen: "Walk North" and "Witness a
//    trial" could be anywhere in London.
//
// Numbers come from Arbor (Guide) and the individual option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-14.
//
//   node FallenLondon/test/choice-arbor.test.mjs

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

// A heading the way the game builds one: the name is a TEXT NODE inside it,
// because `headingName()` walks `childNodes`. Parented, so `after()` works.
function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

// `area` drives currentArea(); `roots` the opened storylet headings, `list`
// the storylet list, `branches` the options. `null` for the area stands for a
// greeting that can't be read.
let area = null;
let roots = [];
let list = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
    if (sel === '.branch__title') return branches;
    return [];
  },
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
    'return { ARBOR_OPTIONS, ARBOR_ITEMS, ARBOR_GRINDS, ARBOR_DISTRICTS, ARBOR_LINGER,'
    + ' ARBOR_TRIP_ACTIONS, ARBOR_FAR_AT, ARBOR_WASH_BELOW, ARBOR_RETURN_FAR_AT, ARBOR_CARD,'
    + ' ARBOR_COLOR_GAIN, ARBOR_COLOR_SPEND, ARBOR_COLOR_ITEMS, ARBOR_COLOR_MOVE, ARBOR_COLOR_LABEL,'
    + ' ARBOR_CLASS, ARBOR_FLAG, ARBOR_CARD_CLASS, ARBOR_BRANCH_CLASS, ARBOR_BRANCH_FLAG, ARBOR_AREAS,'
    + ' arborBadgeText, arborColor, arborSpec, arborStoryletSpec, arborCardSpec, arborCertainAt,'
    + ' arborLuckValue, lookupArborOption, arborSideHere, inArbor, arborRatings,'
    + ' ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, PC_OPTIONS, VSD_OPTIONS, LAB_CARDS, normalizeName,'
    + ' attachBadge, BADGE_CLASS, PC_BRANCH_CLASS, PC_BRANCH_FLAG, VSD_BRANCH_CLASS, VSD_BRANCH_FLAG,'
    + ' FEATURES }; })();');
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
const row = (name, side) => api.ARBOR_OPTIONS.find(
  (e) => e.name === name && (side === undefined || e.side === side));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};

// --- the table is well formed ----------------------------------------------

check('every row has a name and a side the lookup knows',
  api.ARBOR_OPTIONS.filter((e) => !e.name || !['near', 'far', 'both', 'dream'].includes(e.side))
    .map((e) => e.name), []);

check('districts are 1–5 in a city and absent on the card and on both-city rows',
  api.ARBOR_OPTIONS.filter((e) => (['near', 'far'].includes(e.side)
    ? !(e.district == null || (Number.isInteger(e.district) && e.district >= 1 && e.district <= 5))
    : e.district != null)).map((e) => e.name), []);

check('every item a row changes is one ARBOR_ITEMS names',
  api.ARBOR_OPTIONS.flatMap((e) => [e.win, e.lose, e.luck && e.luck.win, e.luck && e.luck.lose,
    e.scale && { [e.scale.key]: 1 }])
    .filter(Boolean).flatMap((m) => Object.keys(m)).filter((k) => !api.ARBOR_ITEMS[k]), []);

check('every challenge names a stat and a difficulty',
  api.ARBOR_OPTIONS.filter((e) => e.ch && !(typeof e.ch.stat === 'string' && e.ch.diff > 0))
    .map((e) => e.name), []);

check('a scaling row scales by Permission to Linger, half of it, or Attar',
  api.ARBOR_OPTIONS.filter((e) => e.scale && !['linger', 'linger/2', 'attar'].includes(e.scale.by))
    .map((e) => e.name), []);

check('side plus name identifies a row uniquely',
  new Set(api.ARBOR_OPTIONS.map((e) => e.side + '|' + api.normalizeName(e.name))).size,
  api.ARBOR_OPTIONS.length);

check('and the only name on two rows is Light your candles, one per city',
  api.ARBOR_OPTIONS.filter((e, i, all) =>
    all.findIndex((o) => api.normalizeName(o.name) === api.normalizeName(e.name)) !== i)
    .map((e) => [e.name, e.side]),
  [['Light your candles', 'far']]);

// --- the transcription -----------------------------------------------------

// The guide's Table of Choices has two rows per district in Near Arbor and in
// Far Arbor, except Far Arbor's centre, which has the squirrel as a third.
check('each district holds the guide\'s options',
  ['near', 'far'].map((side) => [1, 2, 3, 4, 5].map((d) =>
    api.ARBOR_OPTIONS.filter((e) => e.side === side && e.district === d).length)),
  [[2, 2, 2, 2, 2], [2, 2, 3, 2, 2]]);

check('the challenges, as the option pages state them',
  api.ARBOR_OPTIONS.filter((e) => e.ch).map((e) => [e.name, e.ch.stat, e.ch.diff]),
  [['Labour in the temple', 'Dangerous', 75],
   ["Spy on London's Embassy", 'Watchful', 75],
   ['Explore the Gatehouse Market', 'Watchful', 75],
   ['Take a short-cut north', 'Watchful', 79],
   ['Browse the Edifice of the Unveiled Lie', 'Watchful', 100],
   ['Walk the walls', 'Watchful', 100],
   ['Attend a reception at the Copper Fortress', 'Persuasive', 100],
   ['Surrender some of your Attar', 'Persuasive', 100],
   ['Witness a trial', 'Watchful', 115]]);

check('the flat outcomes, success then failure',
  api.ARBOR_OPTIONS.filter((e) => e.win && Object.keys(e.win).length && e.side !== 'dream')
    .map((e) => [e.name, e.win, e.lose || null]),
  [["Visit London's Embassy", { attar: 2, ss: -2 }, null],
   ["Spy on London's Embassy", { ei: 2 }, null],
   ['Explore the Gatehouse Market', { attar: 2 }, { attar: -1 }],
   ['Investigate the Near-Arbori', { attar: 3, ei: -3 }, null],
   ['Browse the Edifice of the Unveiled Lie', { ei: 3, ss: -3 }, { ei: 1, ss: -1 }],
   ['Enter the Forbidden Embassy', { attar: -7, dr: 1 }, null],
   ['Walk the walls', { attar: 2 }, { attar: -2 }],
   ['Attend a reception at the Copper Fortress', { attar: 2, pp: -3 }, { attar: -1, pp: -1 }],
   ['Feed some of your Attar to your squirrel', { attar: -4, er: 1 }, null],
   ['Surrender some of your Attar', { attar: -3, ei: 3 }, { attar: 1, ei: 1 }],
   ['Share secrets with the Arbori', { ei: -3, pp: 3 }, null],
   ['Gift your Attar in tribute to the Roseate Queen', { attar: -3, fihp: 1 }, null],
   ['Witness a trial', { attar: -3, ss: 3 }, { attar: 2, ss: -1 }],
   ['Light your candles', { vial: 1, foxfire: -77 }, null]]);

check('the six rows that scale, and with what',
  api.ARBOR_OPTIONS.filter((e) => e.scale)
    .map((e) => [e.name, e.scale.key, e.scale.by, !!e.ends, e.empties || null]),
  [['Labour in the temple', 'attar', 'linger', true, null],
   ['Offer your Attar to the Temple', 'pp', 'attar', false, 'attar'],
   ['Leave Arbor early', 'attar', 'linger/2', true, null],
   ['Barter your Attar', 'ss', 'attar', false, 'attar'],
   ['Become a serpent-tender in exchange for Attar', 'attar', 'linger', true, null],
   ['Serve as a Serpent-Shepherd', 'pp', 'linger', true, null]]);

check('the options that cost no Permission to Linger',
  api.ARBOR_OPTIONS.filter((e) => e.linger === 0).map((e) => e.name),
  ['Offer your Attar to the Temple', 'Investigate the Near-Arbori', 'Enter Far Arbor',
   'Light your candles', 'Leave Arbor']);

// Pinned by name: a tidy-up that "corrects" one of these to the guide's figure
// fails here rather than in the game.
check('the guide disagrees with the option pages in exactly four rows',
  api.ARBOR_OPTIONS.filter((e) => e.guide).map((e) => [e.name, e.guide]),
  [['Leave Arbor early', { win: 'Attar +2' }],
   ['Surrender some of your Attar', { ch: 'Persuasive 79' }],
   ['Witness a trial', { ch: 'Watchful 100' }],
   ['Light your candles', { win: 'Attar −7 as well, and all your Permission to Linger' }]]);

check('and the tooltip quotes the guide beside the page',
  api.ARBOR_OPTIONS.filter((e) => e.guide && !api.arborSpec(e).title.includes('the option page is followed'))
    .map((e) => e.name), []);

// --- the cross-checks ------------------------------------------------------

check('a trip is the card, the stay and Leave Arbor',
  1 + api.ARBOR_LINGER + 1, api.ARBOR_TRIP_ACTIONS);

// The guide states these two outright ("Watchful 125 needed to 100% the check",
// "Watchful 167"); they follow from the difficulty.
check('the stat that makes a challenge certain matches the guide\'s own figures',
  [api.arborCertainAt(row("Spy on London's Embassy").ch), api.arborCertainAt(row('Walk the walls').ch)],
  [125, 167]);

check('and the floating-point trap in it stays shut',
  [75, 79, 100, 115].map((diff) => api.arborCertainAt({ diff })), [125, 132, 167, 192]);

check('the Near to Far threshold sits below the card\'s return threshold, as the guide says',
  [api.ARBOR_WASH_BELOW, api.ARBOR_FAR_AT, api.ARBOR_RETURN_FAR_AT], [3, 5, 6]);

check('four grinds, each with its needs and figures',
  api.ARBOR_GRINDS.filter((g) => !g.needs || !(g.epa > 0) || !(g.trip > 0) || !g.how).length, 0);

// --- what the badge says ---------------------------------------------------

check('a flat row is what it changes, Attar first, sign carrying the direction',
  [api.arborBadgeText(row("Visit London's Embassy")),
   api.arborBadgeText(row('Share secrets with the Arbori')),
   api.arborBadgeText(row('Enter the Forbidden Embassy'))],
  ['Attar +2 SS −2', 'EI −3 PP +3', 'Attar −7 DR +1']);

check('a challenge is its success outcome, marked ?',
  [api.arborBadgeText(row("Spy on London's Embassy")),
   api.arborBadgeText(row('Walk the walls')),
   api.arborBadgeText(row('Take a short-cut north'))],
  ['EI +2?', 'Attar +2?', '↑↑ North?']);

check('a scaling row says what it scales with, and ⏏ when the stay ends',
  [api.arborBadgeText(row('Become a serpent-tender in exchange for Attar')),
   api.arborBadgeText(row('Leave Arbor early')),
   api.arborBadgeText(row('Barter your Attar')),
   api.arborBadgeText(row('Labour in the temple'))],
  ['Attar +Linger ⏏', 'Attar +Linger/2 ⏏', 'SS = Attar', 'Attar +Linger? ⏏']);

// "Linger/2" is the name of the scale, not a figure, so it is taken out first.
check('no scaling row carries a figure, since the figure is not on the page',
  api.ARBOR_OPTIONS.filter((e) => e.scale
    && /\d/.test(api.arborBadgeText(e).replace('Linger/2', 'Linger'))).map((e) => e.name), []);

check('the tribute\'s rare success is starred',
  api.arborBadgeText(row('Gift your Attar in tribute to the Roseate Queen')), 'Attar −3 FiHP +1 ★');

check('the even-odds row is its expected value',
  [api.arborLuckValue(row('While away your time').luck, 'attar'),
   api.arborBadgeText(row('While away your time'))],
  [0, '≈Attar 0']);

check('moving about is a word',
  [api.arborBadgeText(row('Walk North')), api.arborBadgeText(row('Enter Far Arbor')),
   api.arborBadgeText(row('The city washes away')), api.arborBadgeText(row('Leave Arbor'))],
  ['↑ north', '→ Far', '→ Near', 'home']);

check('no row falls through to the "no change" fallback',
  api.ARBOR_OPTIONS.filter((e) => api.arborBadgeText(e).startsWith('no change')).map((e) => e.name), []);

// --- colour ----------------------------------------------------------------

check('the five colours are distinct',
  new Set([api.ARBOR_COLOR_GAIN, api.ARBOR_COLOR_SPEND, api.ARBOR_COLOR_ITEMS,
    api.ARBOR_COLOR_MOVE, api.ARBOR_COLOR_LABEL]).size, 5);

check('colour follows the Attar direction',
  [api.arborColor(row('Walk the walls')), api.arborColor(row('Witness a trial')),
   api.arborColor(row('Share secrets with the Arbori')), api.arborColor(row('Walk South')),
   api.arborColor(row('Barter your Attar')), api.arborColor(row('Serve as a Serpent-Shepherd')),
   api.arborColor(row('While away your time'))],
  [api.ARBOR_COLOR_GAIN, api.ARBOR_COLOR_SPEND, api.ARBOR_COLOR_ITEMS, api.ARBOR_COLOR_MOVE,
   api.ARBOR_COLOR_SPEND, api.ARBOR_COLOR_ITEMS, api.ARBOR_COLOR_MOVE]);

// The reader is red-green weak: the colour may not be the only thing saying
// "gains Attar" versus "spends Attar". Every flat row painted gain or spend
// must say the same thing in its own text.
check('the text alone tells a gain from a spend',
  api.ARBOR_OPTIONS.filter((e) => !e.scale && !e.luck && e.win && e.win.attar)
    .filter((e) => {
      const text = api.arborBadgeText(e);
      const shown = e.win.attar > 0 ? 'Attar +' : 'Attar −';
      const colour = e.win.attar > 0 ? api.ARBOR_COLOR_GAIN : api.ARBOR_COLOR_SPEND;
      return !text.includes(shown) || api.arborColor(e) !== colour;
    }).map((e) => e.name), []);

// --- the tooltip -----------------------------------------------------------

check('"not recorded" and "costs none" read differently',
  [api.arborSpec(row('Light your candles', 'far')).title.includes('does not say'),
   api.arborSpec(row('Light your candles', 'near')).title.includes('Costs no Permission to Linger'),
   api.arborSpec(row('Walk the walls')).title.includes('Costs 1 Permission to Linger')],
  [true, true, true]);

check('a challenge tooltip carries the failure and the certain-at stat',
  (() => {
    const t = api.arborSpec(row('Surrender some of your Attar')).title;
    return [t.includes('Failure: Attar +1'), t.includes('certain at Persuasive 167')];
  })(), [true, true]);

check('a row that empties your Attar says so in words',
  api.arborSpec(row('Barter your Attar')).title.includes('all your Attar goes'), true);

check('every city tooltip carries the rules of a stay',
  api.ARBOR_OPTIONS.filter((e) => !api.arborSpec(e).title.includes('A stay is 7 Permission to Linger'))
    .map((e) => e.name), []);

check('the map badges name their city, and each map lists all of that city\'s options',
  ['near', 'far'].map((side) => {
    const spec = api.arborStoryletSpec(side);
    const missing = api.ARBOR_OPTIONS.filter((e) => (e.side === side || e.side === 'both')
      && !spec.title.includes(e.name)).map((e) => e.name);
    return [spec.text, missing];
  }),
  [['Near map', []], ['Far map', []]]);

// Only the district list: the guide's grinds, which both maps carry, name
// options in both cities.
const mapDistricts = (side) => api.arborStoryletSpec(side).title.split('The guide’s grinds')[0];
check('and neither map\'s district list holds the other city\'s options',
  [mapDistricts('near').includes('Walk the walls'),
   mapDistricts('far').includes('Explore the Gatehouse Market')],
  [false, false]);

check('the card says which city the dream opens on, from the reading',
  [api.arborCardSpec(null).title.includes('has not been read'),
   api.arborCardSpec({ count: 5, at: Date.now() }).title.includes('opens on Near Arbor'),
   api.arborCardSpec({ count: 6, at: Date.now() }).title.includes('opens on Far Arbor'),
   api.arborCardSpec(null).text],
  [true, true, true, '9 actions']);

// --- looking one up --------------------------------------------------------

check('nothing is looked up off an Arbor screen',
  [api.lookupArborOption('Walk North', null), api.lookupArborOption('Witness a trial', null)],
  [null, null]);

check('Light your candles answers only when the city is known',
  [api.lookupArborOption('Light your candles', 'arbor'),
   api.lookupArborOption('Light your candles', 'near').side,
   api.lookupArborOption('Light your candles', 'far').side],
  [null, 'near', 'far']);

check('a both-city row answers in either city, and a city\'s own row only in it',
  [api.lookupArborOption('Walk North', 'near').side, api.lookupArborOption('Walk North', 'far').side,
   api.lookupArborOption('Walk the walls', 'near'), api.lookupArborOption('Walk the walls', 'far').name],
  ['both', 'both', null, 'Walk the walls']);

check('the card\'s own options answer only on the card',
  [api.lookupArborOption('Return to the City of Roses', 'dream').side,
   api.lookupArborOption('Return to the City of Roses', 'near'),
   api.lookupArborOption('Walk North', 'dream')],
  ['dream', null, null]);

check('names match through punctuation',
  api.lookupArborOption('Spy on London’s Embassy', 'near').name, "Spy on London's Embassy");

// --- where we are ----------------------------------------------------------

check('the greeting confirms Arbor, under any of its names',
  ['Arbor, of the Roses', 'Near Arbor', 'Far Arbor'].map((a) => (area = a, api.inArbor())),
  [true, true, true]);

check('somewhere else, or an unreadable greeting, is not a confirmation',
  [(area = 'Veilgarden', api.inArbor()), (area = null, api.inArbor())], [false, false]);

check('the open storylet says which screen this is, and beats the greeting',
  (() => {
    area = 'Arbor, of the Roses';
    const out = [];
    roots = [makeHeading('Far Arbor')]; out.push(api.arborSideHere());
    roots = [makeHeading('Near Arbor')]; out.push(api.arborSideHere());
    roots = [makeHeading('A Dream of Roses')]; out.push(api.arborSideHere());
    roots = []; out.push(api.arborSideHere());
    area = null; out.push(api.arborSideHere());
    return out;
  })(), ['far', 'near', 'dream', 'arbor', null]);

// --- the registered pass, end to end ---------------------------------------

check('an opened Near Arbor is badged: the map, and its options, not Far Arbor\'s',
  (() => {
    area = null;
    roots = [makeHeading('Near Arbor')];
    list = [];
    const spy = makeHeading('Spy on London’s Embassy');
    const walls = makeHeading('Walk the walls');
    const candles = makeHeading('Light your candles');
    branches = [spy, walls, candles];
    api.arborRatings();
    const out = [
      badgeOf(roots[0], api.ARBOR_CLASS) && badgeOf(roots[0], api.ARBOR_CLASS).textContent,
      badgeOf(spy, api.ARBOR_BRANCH_CLASS) && badgeOf(spy, api.ARBOR_BRANCH_CLASS).textContent,
      badgeOf(walls, api.ARBOR_BRANCH_CLASS),
      badgeOf(candles, api.ARBOR_BRANCH_CLASS) && badgeOf(candles, api.ARBOR_BRANCH_CLASS).textContent,
    ];
    // The storylet closes and nothing says Arbor any more: the options that
    // React leaves in place lose their badges.
    roots = [];
    api.arborRatings();
    out.push(badgeOf(spy, api.ARBOR_BRANCH_CLASS));
    branches = [];
    return out;
  })(),
  ['Near map', 'EI +2?', null, 'no effect', null]);

check('the same option heading redraws when the city changes under it',
  (() => {
    const candles = makeHeading('Light your candles');
    branches = [candles];
    roots = [makeHeading('Near Arbor')];
    api.arborRatings();
    const near = badgeOf(candles, api.ARBOR_BRANCH_CLASS).textContent;
    roots = [makeHeading('Far Arbor')];
    api.arborRatings();
    const far = badgeOf(candles, api.ARBOR_BRANCH_CLASS).textContent;
    const count = candles.parentNode.children.filter((n) => n.classList.contains(api.ARBOR_BRANCH_CLASS)).length;
    roots = []; branches = [];
    return [near, far, count];
  })(),
  ['no effect', 'Vial +1 Foxfire −77', 1]);

check('a storylet in the list is badged too, and nothing else in it is',
  (() => {
    list = [makeHeading('Far Arbor'), makeHeading('Arbor')];
    api.arborRatings();
    const out = list.map((h) => { const b = badgeOf(h, api.ARBOR_CLASS); return b && b.textContent; });
    list = [];
    return out;
  })(), ['Far map', null]);

// --- no name in another table, and sharing a selector ----------------------

check('no Arbor name is in any other feature\'s table',
  [api.ARBOR_CARD, 'Near Arbor', 'Far Arbor'].concat(api.ARBOR_OPTIONS.map((e) => e.name))
    .map(api.normalizeName)
    .filter((n) =>
      api.ZEE_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.SPITE_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.FOTZ_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.LAB_CARDS.some((c) => api.normalizeName(c.name) === n)
      || api.PC_OPTIONS.some((p) => api.normalizeName(p.name) === n
        || (p.branch && api.normalizeName(p.branch) === n))
      || api.VSD_OPTIONS.some((v) => api.normalizeName(v.storylet) === n
        || api.normalizeName(v.branch) === n)),
  []);

check('and that check is not vacuous: every card table has names to compare',
  [api.LAB_CARDS, api.ZEE_CARDS, api.FOTZ_CARDS].map((t) => t.length > 0 && t.every((c) => typeof c.name === 'string')),
  [true, true, true]);

check('three features on one .branch__title each clear only their own badge',
  (() => {
    const head = makeHeading('x');
    const draw = (cls, flag, value, spec) => api.attachBadge(head, {
      cls, flag, value, spec: spec === undefined ? { text: 'x', color: '#000', title: 't' } : spec, place: 'after',
    });
    draw(api.PC_BRANCH_CLASS, api.PC_BRANCH_FLAG, 'a');
    draw(api.VSD_BRANCH_CLASS, api.VSD_BRANCH_FLAG, 'a');
    draw(api.ARBOR_BRANCH_CLASS, api.ARBOR_BRANCH_FLAG, 'a');
    draw(api.PC_BRANCH_CLASS, api.PC_BRANCH_FLAG, 'b');
    const three = head.parentNode.children.length - 1;
    draw(api.ARBOR_BRANCH_CLASS, api.ARBOR_BRANCH_FLAG, 'a', null);
    return [three, head.parentNode.children.length - 1, !!badgeOf(head, api.ARBOR_BRANCH_CLASS)];
  })(), [3, 2, false]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'arbor' && f.run === api.arborRatings), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
