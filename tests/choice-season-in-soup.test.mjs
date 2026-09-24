// Ad-hoc test for FallenLondon/choice-helper.js's Season in Soup badges
// ('season-in-soup').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The S-curve against the guide's one stated figure: 240 Whispered Hints an
//    action at maximum Persuasive. It is what catches a wrong height, offset
//    or rounding.
//  - The week table against the guide's Table of Events.
//  - Promenade: one title in four weeks, told apart by `soupWeek`, and redrawn
//    when the week stops being readable on the same heading node.
//
// Numbers come from The Season in Soup (Guide), its option pages and
// Module:SCurve on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-season-in-soup.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

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

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

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
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { SOUP_OPTIONS, SOUP_ITEMS, SOUP_CURVES, SOUP_INDEX, SOUP_STORYLETS, SOUP_HOUSE, SOUP_SOUPS, SOUP_PARLOUR,'
    + ' SOUP_WEEKS, SOUP_CLASS, SOUP_BRANCH_CLASS, soupRound, soupAmount, soupRange, soupWeek, soupRowsFor,'
    + ' soupBadgeText, soupSpec, soupStoryletSpec, soupRatings, CM_OPTIONS, FQ_OPTIONS, LBI_OPTIONS, DME_OPTIONS,'
    + ' VH_OPTIONS, ARBOR_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const key = api.normalizeName;
const row = (name, week) => api.SOUP_OPTIONS.find((e) => e.name === name && (week == null || e.week === week));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};

// --- the curve -------------------------------------------------------------

check('the guide\'s 240 Whispered Hints an action at maximum Persuasive', api.soupAmount('hundredth', 230), 240);

check('each curve from Persuasive 0 to the cap',
  ['half', 'tenth', 'hundredth'].map((c) => api.soupRange(c)), [[1, 5], [5, 24], [51, 240]]);

check('Persuasive above the cap pays the cap',
  ['half', 'tenth', 'hundredth'].map((c) => api.soupAmount(c, 330) === api.soupAmount(c, 230)), [true, true, true]);

check('the curve\'s midpoint, where every item is worth half its maximum and a bit',
  ['half', 'tenth', 'hundredth'].map((c) => api.soupAmount(c, 150)), [3, 15, 150]);

check('rounding is half to even, as the game\'s is',
  [0.5, 1.5, 2.5, 2.4, 2.6].map(api.soupRound), [0, 2, 2, 2, 3]);

check('every curve is worth about the same at the cap: 2.4–2.5 Echoes',
  ['half', 'tenth', 'hundredth'].map((c) => Math.round(api.soupAmount(c, 230) * api.SOUP_CURVES[c].worth * 10) / 10),
  [2.5, 2.4, 2.4]);

// --- the week table --------------------------------------------------------

check('the guide\'s Table of Events: two soups and two parlour options a week',
  api.SOUP_WEEKS.map((w) => [api.SOUP_SOUPS, api.SOUP_PARLOUR].map((s) =>
    api.SOUP_OPTIONS.filter((e) => e.week === w && e.storylet === s).map((e) => e.item))),
  [[['Zee-Ztory', 'Romantic Notion'], ['Tale of Terror!!', 'Memory of Distant Shores']],
   [['Memory of Distant Shores', 'Vision of the Surface'], ['Romantic Notion', 'Memory of Light']],
   [['Tale of Terror!!', 'Memory of Light'], ['Inkling of Identity', 'Scrap of Incendiary Gossip']],
   [['Scrap of Incendiary Gossip', 'Whispered Hint'], ['Journal of Infamy', 'Vision of the Surface']]]);

check('every item paid is priced',
  api.SOUP_OPTIONS.filter((e) => e.item && !api.SOUP_ITEMS[e.item]).map((e) => e.name), []);

check('the three noises in the walls, one each',
  api.SOUP_OPTIONS.filter((e) => e.noise).map((e) => [e.name, e.week, e.noise]),
  [['A flavour of Dahut', 3, 'A Susurrus in the Soup Kitchen'], ['Promenade', 2, 'A Knock Behind the Wainscotting'],
   ['Take absinthe in the parlour', 4, 'An Unearthly Whisper from Below']]);

check('and every Promenade pays on the 0.5-Echo curve, which is what the generic row claims',
  api.SOUP_OPTIONS.filter((e) => e.name === 'Promenade' && e.week).map((e) => api.SOUP_ITEMS[e.item].curve),
  Array(4).fill('half'));

// --- badges ----------------------------------------------------------------

check('badges: the item and its range, ★ for a noise',
  [row('A taste of Mutton Island'), row('An infernal broth'), row('Take biscuits in the parlour'), row('Promenade', 2),
   row('Promenade', 4), api.SOUP_OPTIONS.find((e) => e.anyWeek), row('Explore the house')].map(api.soupBadgeText),
  ['Zee-Ztory ×1–5', 'Hints ×51–240', 'Notion ×5–24', 'Light ×1–5 ★', 'Vision ×1–5', 'item ×1–5', '3 noises']);

check('a tooltip carries the figure at the cap',
  api.soupSpec(row('An infernal broth')).title.includes('Persuasive 230+: 240 -- 2.4 Echoes'), true);

// --- the week --------------------------------------------------------------

check('the week is read off a week-only option, and not off Promenade',
  [['Take brandy in the parlour', 'Promenade'], ['Promenade', 'Return to the main hostelry'],
   ['A taste of Mutton Island', 'An infernal broth'], ["A recipe of Mrs Chapman's own"]].map(api.soupWeek),
  [3, null, null, 1]);

check('no week\'s index has one title twice',
  [0, 1, 2, 3, 4].map((w) => {
    const seen = new Set();
    let dupes = 0;
    for (const e of api.soupRowsFor(w)) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  }), [0, 0, 0, 0, 0]);

check('the storylet summaries',
  api.SOUP_STORYLETS.map((s) => api.soupStoryletSpec(key(s)).text), ['soup & parlour', 'soups', 'parlour']);

// --- the registered pass ---------------------------------------------------

check('Promenade takes its week from the option beside it, and redraws when that goes',
  (() => {
    const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
    const absinthe = makeHeading('Take absinthe in the parlour');
    const promenade = makeHeading('Promenade');
    const out = [];
    roots = [makeHeading("Horatia's Parlour")];
    branches = [absinthe, promenade];
    api.soupRatings();
    out.push([text(roots[0], api.SOUP_CLASS), text(absinthe, api.SOUP_BRANCH_CLASS), text(promenade, api.SOUP_BRANCH_CLASS)]);
    branches = [promenade];
    api.soupRatings();
    out.push([text(promenade, api.SOUP_BRANCH_CLASS)]);
    roots = [makeHeading("Mrs Chapman's Boarding House for Those Who Temporarily Have Nowhere Else To Go")];
    api.soupRatings();
    out.push([text(roots[0], api.SOUP_CLASS), text(promenade, api.SOUP_BRANCH_CLASS)]);
    roots = [];
    branches = [];
    return out;
  })(),
  [['parlour', 'Journal ×1–5 ★', 'Vision ×1–5'], ['item ×1–5'], ['soup & parlour', null]]);

// --- no name in another table ----------------------------------------------

check('no Season in Soup name is in another feature\'s table',
  (() => {
    const others = [
      ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
      ...api.LAB_CARDS.map((c) => c.name), ...api.ARBOR_OPTIONS.map((e) => e.name),
      ...api.LBI_OPTIONS.map((e) => e.name), ...api.DME_OPTIONS.map((e) => e.name), ...api.VH_OPTIONS.map((e) => e.name),
      ...api.FQ_OPTIONS.map((e) => e.name), ...api.CM_OPTIONS.map((e) => e.name),
      ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']),
      ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
    ].map(key);
    return api.SOUP_OPTIONS.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'season-in-soup'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
