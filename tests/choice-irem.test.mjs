// Ad-hoc test for FallenLondon/choice-helper.js's Irem Loom badges
// ('irem').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every future has exactly three passages and
// that each names where it goes and what it spends; that the graph is
// consistent, so every destination is a future the table also knows; and above
// all the derived claim the badge is really made of -- which passages need a
// warp this future cannot make, and therefore a card carried in. Those are
// cross-checked against the guide's own suggested roads, which say in words
// which cards to keep in hand at each leg.
//
// Numbers come from Irem (Guide), the ten Loom storylets and all thirty passage pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-irem.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

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

function makeHeading(text, className) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.className = className || '';
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let heads = [];
let branches = [];
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return heads.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
    return [];
  },
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS',
  'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS',
  'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS',
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS',
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS',
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { IRM_OPTIONS, IRM_FUTURES, IRM_THREAD, IRM_CLASS, IRM_BRANCH_CLASS, irmLoom, irmSmuggled, irmBadgeText, irmSpec, irmStoryletSpec, irmRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, '
    + TABLES.join(', ') + ' }; })();');
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
const rows = api.IRM_OPTIONS;
const row = (name, storylet) => rows.find((e) => e.name === name && (!storylet || e.storylet === storylet));
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

// Every table in the file is keyed on storylet PLUS title, and `carouselLookup`
// refuses to answer when two rows of one storylet match -- so a repeated key
// here is an option that would go unbadged.
check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k) || !key(n)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);


check('ten futures, each with three passages, and the way out',
  [api.IRM_FUTURES.length,
    api.IRM_FUTURES.filter((f) => rows.filter((e) => e.storylet === api.irmLoom(f.future)).length !== 3)
      .map((f) => f.future),
    rows.filter((e) => e.storylet === api.IRM_THREAD).length],
  [10, [], 1]);

// A passage that points at a future the table does not know would badge a
// destination nobody can look up.
check('every destination is a known future, or No Future',
  (() => {
    const known = api.IRM_FUTURES.map((f) => f.future).concat(['No Future']);
    return rows.filter((e) => e.to && !known.includes(e.to)).map((e) => e.to);
  })(), []);

check('every passage costs exactly one kind of warp, and a positive number of it',
  rows.filter((e) => e.warp).filter((e) => !['Sinewy', 'Silken', 'Bombazine'].includes(e.warp) || !(e.count > 0))
    .map((e) => e.name), []);

// The derived claim. A future's own cards pay only some of the three warps, so
// these are the legs that have to be paid for with a card brought in -- and
// they are exactly the legs the guide's suggested roads say to keep a card for.
check('the passages that need a smuggled warp',
  rows.filter(api.irmSmuggled).map((e) => [e.storylet.replace('The Loom: ', ''), e.name, e.warp]),
  [['A Silvered Future', 'The one that\u2019s broken', 'Bombazine'],
    ['An Abyssal Future', 'The eastern passageway', 'Sinewy'],
    ['A Brilliant Future', 'An excursion to Watchmaker\u2019s Hill', 'Bombazine'],
    ['A Ruinous Future', 'A mousehole, too small to crawl through', 'Sinewy'],
    ['A Ruinous Future', 'A collapsed passageway', 'Silken'],
    ['A Chilly Future', 'A new wind', 'Sinewy'],
    ['An Altered Future', 'Bend into a ruined shape', 'Silken'],
    ['An Altered Future', 'Bend into nothing at all', 'Sinewy'],
    ['A Dark Future', 'No path at all', 'Bombazine']]);

check('the futures that can pay for every exit themselves',
  api.IRM_FUTURES.filter((f) => !rows.some((e) => e.storylet === api.irmLoom(f.future) && api.irmSmuggled(e)))
    .map((f) => f.future),
  ['A Nearby Future', 'A Jewelled Future', 'A Neon Future']);

check('badges for each shape of passage',
  ['The ladder to the attic', 'Bend into a ruined shape', 'A collapsed passageway', 'No path at all', 'Let go']
    .map((n) => api.irmBadgeText(row(n))),
  ['A Jewelled Future \u00b7 Silken \u00d72', 'A Ruinous Future \u00b7 Silken \u00d72 \u25be smuggle',
    'never opens \u00b7 Silken \u00d73', 'No Future \u00b7 Bombazine \u00d73 \u25be smuggle', 'back to Irem']);

// The one passage that opens for nobody. Badging it as a road would spend an
// action and three Silken Warps on nothing.
check('the ruined passage says so, in words, and names no destination',
  [row('A collapsed passageway').to === undefined, row('A collapsed passageway').ruined,
    /never opens, for anybody/.test(api.irmSpec(row('A collapsed passageway')).title)],
  [true, true, true]);

check('a smuggling tooltip names the warps this future CAN pay',
  /No card here pays Sinewy Warp \u2014 this future\u2019s cards pay Bombazine \u2014/
    .test(api.irmSpec(row('Bend into nothing at all')).title), true);

// Where the guide's map and an option page disagreed the page won, once.
check('Walk around the block is the page\u2019s Silken \u00d71, not the guide\u2019s \u00d72',
  [row('Walk around the block').count,
    /the option page says \u00d71, and the page wins/.test(row('Walk around the block').note)],
  [1, true]);

check('the headings say what can be paid for here',
  ['A Nearby Future', 'An Altered Future', 'A Silvered Future']
    .map((f) => api.irmStoryletSpec(key(api.irmLoom(f))).text),
  ['Sinewy/Silken/Bombazine here \u00b7 every exit payable here',
    'Bombazine here \u00b7 2 of 3 exits need a smuggled warp \u25be',
    'Sinewy/Silken here \u00b7 1 of 3 exits needs a smuggled warp \u25be']);

// An Abyssal Future's three cards pay Silken and Bombazine, and its eastern
// passageway wants Sinewy -- so it smuggles too, which the guide's own road to
// An Altered Future confirms by telling you to keep A Royal Absence in hand.
check('An Abyssal Future has a Sinewy exit and no Sinewy card, so it smuggles too',
  api.irmStoryletSpec(key(api.irmLoom('An Abyssal Future'))).text,
  'Silken/Bombazine here \u00b7 1 of 3 exits needs a smuggled warp \u25be');

check('the four boons are on their futures\u2019 headings',
  api.IRM_FUTURES.filter((f) => f.boon).map((f) => f.future),
  ['A Jewelled Future', 'A Silvered Future', 'A Chilly Future', 'A Dark Future']);

check('the registered pass: a Loom heading and two of its passages',
  (() => {
    const open = makeHeading(api.irmLoom('An Altered Future'), 'storylet-root__heading');
    const local = makeHeading('Bend into a shameful shape');
    const carried = makeHeading('Bend into a ruined shape');
    roots = [open];
    branches = [local, carried];
    api.irmRatings();
    const out = [text(open, api.IRM_CLASS), text(local, api.IRM_BRANCH_CLASS), text(carried, api.IRM_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Bombazine here \u00b7 2 of 3 exits need a smuggled warp \u25be',
    'An Abyssal Future \u00b7 Bombazine \u00d71', 'A Ruinous Future \u00b7 Silken \u00d72 \u25be smuggle']);

check('no Irem name is in another feature\u2019s table',
  (() => {
    const others = otherNames('IRM_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'irem'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
