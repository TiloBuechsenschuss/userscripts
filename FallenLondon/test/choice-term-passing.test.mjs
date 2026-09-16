// Ad-hoc test for FallenLondon/choice-helper.js's Term Passing... badges
// ('term-passing').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// The feature carries ONE of the guide's three carousels, A Respectable
// Academic, by request: the other two lock behind you once the story is done.
// So what is pinned here is the badge's three parts in their order -- the Term
// Passing... CP, the guide's Echoes, and LAST any Connected the option builds
// -- and in particular that the Connected is READ OUT of the payout rather than
// stored beside it, which is what keeps the badge and the tooltip from ever
// disagreeing. Only a gain is shown; a Connected an option spends stays in the
// tooltip, as a cost does everywhere else in this file.
//
// Numbers come from Term Passing... (Guide) -- its third "every option" table
// -- on fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node FallenLondon/test/choice-term-passing.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null,
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
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { TP_ROWS, TP_OPTIONS, TP_CAROUSEL, TP_STORYLETS, TP_INDEX, TP_CLASS,'
    + ' TP_BRANCH_CLASS, tpBadgeText, tpSpec, tpStoryletSpec, tpRatings, tpConnected, tpWorth,'
    + ' carouselLookup, '
    + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;')(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const key = api.normalizeName;
const rows = api.TP_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function otherNames(own) {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key).filter(Boolean);
}

check('one carousel, the last one, and every row belongs to it',
  [api.TP_CAROUSEL.name, api.TP_CAROUSEL.ftu, api.TP_CAROUSEL.cap, api.TP_CAROUSEL.actions,
    rows.length === api.TP_ROWS.length],
  ['A Respectable Academic', '30+', 8, 10, true]);

// Nothing on the screen says which carousel you are in, and with one carried
// there is nothing to say: the badge is one reading, never a pair.
check('no badge quotes two carousels',
  rows.filter((e) => api.tpBadgeText(e).includes('|')).map((e) => e.name), []);

check('every option resolves to exactly one row under its own storylet',
  rows.filter((e) => !api.carouselLookup(api.TP_INDEX, e.name, key(e.storylet)))
    .map((e) => e.storylet + ' | ' + e.name), []);

// --- the badge's three parts, in order -------------------------------------
//
// Term Passing... CP, then the guide's Echoes, then the Connected the option
// BUILDS. The Connected comes last because it is the reason to run the
// carousel, not the reason to pick one option over another.

check('badges',
  ['Learn everything you can', 'Demonstrate your cricketing knowledge', 'Get involved',
    'Perhaps you might read a book today', 'Blackmail', 'Swap research with archaeologists',
    'Make your peace with Dr Orthos']
    .map((n) => api.tpBadgeText(row(n))),
  ['TP +4 · 1.60 E',
    'TP +4? · 1.24 E · Benthic +12',
    'TP +4? · 1.44 E · Benthic +2 Summerset +2',
    'TP +4? · 2.00 E · Benthic +2 Summerset +2',
    'reset · 5.20 E',
    'TP +4? · 14.00 E',
    'reset? · 2.50 E · Benthic +10 Summerset +10']);

// The Connected figures are read out of the payout rather than stored beside
// it, so a mistyped one cannot make the badge and the tooltip disagree.
check('the Connected on a badge is exactly what its payout says',
  rows.filter((e) => api.tpConnected(e.gives)
    .some((c) => !e.gives.includes('+' + c.cp + ' CP'))).map((e) => e.name), []);

check('the parser reads a gain, skips a cost, and never runs two clauses together',
  [api.tpConnected('Connected: Benthic +30 CP and Connected: Summerset +30 CP'),
    api.tpConnected('Cryptic Clue ×62, Connected: Benthic +12 CP'),
    api.tpConnected('Hedonist +3 CP, Connected: Summerset −5 CP'),
    api.tpConnected('Connected: The Masters of the Bazaar +1 CP (to 5), an Extraordinary Implication'),
    api.tpConnected('Whispered Hint ×150, Connected: Summerset −2 CP, Wounds −1 CP')],
  [[{ name: 'Benthic', cp: 30 }, { name: 'Summerset', cp: 30 }],
    [{ name: 'Benthic', cp: 12 }],
    [],
    [{ name: 'Masters of the Bazaar', cp: 1 }],
    []]);

// A Connected an option SPENDS belongs in the tooltip, the way a menace on a
// failure does everywhere else in this file.
check('an option that spends Connected says so in the tooltip and not on the badge',
  [api.tpBadgeText(row('Attend a feast')).includes('Summerset'),
    api.tpSpec(row('Attend a feast')).title.includes('Connected: Summerset −2 CP'),
    api.tpBadgeText(row('Nobble the Benthic team')).includes('Benthic'),
    api.tpSpec(row('Nobble the Benthic team')).title.includes('Connected: Benthic −10 CP')],
  [false, true, false, true]);

check('the eight options that build Connected are the ones the guide credits',
  rows.filter((e) => api.tpConnected(e.gives).length).map((e) => e.name).sort(),
  ['"Our mutual friend would not appreciate the impediment to my work..."',
    'Demonstrate your cricketing knowledge', 'Display admirable sportsmanship', 'Get involved',
    'Make your peace with Dr Orthos', 'Perhaps you might read a book today',
    'Report them to the college authorities', 'The twelfth man'].sort());

// --- what an unpriced row shows instead ------------------------------------
//
// The guide prices all but three rows. Those fall back to the first clause of
// the payout, skipping a Connected clause -- the Connected is already the last
// thing on the badge, and saying it twice reads as two separate payments.

check('the three unpriced rows, and what each shows instead of Echoes',
  rows.filter((e) => e.echoes == null).map((e) => [e.name, api.tpBadgeText(e)]),
  [['Fourteen courses of sheer indulgence', 'TP +4 · Hedonist +3 CP'],
    ['Advise them to stick to their principles', 'reset · research pages ×50'],
    ['Report them to the college authorities', 'reset · Benthic +30 Summerset +30']]);

check('an unpriced row never prints its Connected twice',
  api.tpWorth(row('Report them to the college authorities')), null);

// --- the rest ---------------------------------------------------------------

check('the three research swaps are still the outliers the guide\'s 4.90 line rests on',
  (() => {
    const priced = rows.filter((e) => e.echoes != null).slice().sort((a, b) => b.echoes - a.echoes);
    return [priced.slice(0, 3).map((e) => e.name), priced[0].echoes / priced[3].echoes > 2];
  })(),
  [['Swap research with archaeologists', 'Swap research with zoologists',
    'Swap research with theologians'], true]);

check('every finisher is at Term Passing... ' + api.TP_CAROUSEL.cap + ', and resets',
  [...new Set(rows.filter((e) => e.cp === 'reset').map((e) => e.window))], ['8']);

check('storylet headings carry the window and nothing else',
  ['Off to the Library', 'The Library Roof', 'Interdisciplinary Research', 'Visitors in the Quad']
    .map((s) => api.tpStoryletSpec(key(s)).text),
  ['T0-3', 'T8', 'T0-7', 'T0-7']);

check('the registered pass',
  (() => {
    const cricket = makeHeading('Demonstrate your cricketing knowledge');
    const blackmail = makeHeading('Blackmail');
    branches = [cricket, blackmail];
    roots = [makeHeading('Cricket at Benthic')];
    api.tpRatings();
    const out = [text(roots[0], api.TP_CLASS), text(cricket, api.TP_BRANCH_CLASS),
      text(blackmail, api.TP_BRANCH_CLASS)];
    roots = [makeHeading('The Library Roof')];
    api.tpRatings();
    out.push(text(roots[0], api.TP_CLASS), text(cricket, api.TP_BRANCH_CLASS),
      text(blackmail, api.TP_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['T0-3', 'TP +4? · 1.24 E · Benthic +12', null,
    'T8', null, 'reset · 5.20 E']);

check('no Term Passing name is in another feature\'s table',
  (() => { const others = otherNames('TP_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'term-passing'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
