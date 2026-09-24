// Ad-hoc test for FallenLondon/choice-helper.js's The Sacroboscan Calendar badges
// ('sacroboscan').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the two cycles fill 1 to 6 exactly once each,
// that the seven events with a second title for a return visit carry it as an
// alias, that the one source disagreement is recorded on its row rather than
// quietly resolved, and that an event nobody has written up says so instead of
// counting zero uniques.
//
// Numbers come from The Sacroboscan Calendar (Guide), the Whim and Fancy world-quality pages and the events' own option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node tests/choice-sacroboscan.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { SC_OPTIONS, SC_STORYLETS, SC_INDEX, SC_CALENDAR, SC_WASWOOD, SC_CLASS, SC_BRANCH_CLASS, scBadgeText, scSpec, scStoryletSpec, scRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.SC_OPTIONS;
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

// Twelve events, six to a cycle, and each slot filled exactly once: a gap or a
// double here is a week where the badge would name the wrong festival.
check('the two cycles are 1 to 6, each slot filled once',
  ['Whim', 'Fancy'].map((cycle) => rows.filter((e) => e.cycle === cycle).map((e) => e.slot).sort((a, b) => a - b)),
  [[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]]);

check('every event carries a list of uniques, even when that list is empty',
  rows.filter((e) => e.cycle && !Array.isArray(e.uniques)).map((e) => e.name), []);

check('badges for each shape of row',
  ['Relive the Great Sink of 1899', 'Remember the Opening of Arbor', 'Live a dream of a missing Hell',
    'Remember the Mayorality of the Viscountess', 'Search out the lost histories of London']
    .map((n) => api.scBadgeText(row(n))),
  ['Whim 2 · 10 uniques', 'Fancy 5 · 5 uniques', 'Whim 6 · nothing recorded yet',
    'Fancy 6 · 2 uniques', 'to the Calendar']);

// Seven events are offered under one title the first time and another on a
// return visit. A missing alias is an event that goes unbadged for everyone who
// has already been.
check('the seven return titles are carried as aliases',
  rows.filter((e) => e.aliases && e.cycle).map((e) => [e.name, e.aliases.length]),
  [['Relive the Great Sink of 1899', 1], ['Live a Dream of the Starved War', 1],
    ['Remember the Mayorality of Virginia', 1], ['Live a dream of a missing Hell', 1],
    ['Relive the construction of the Museum of Prelapsarian History', 1],
    ['Remember the Mayorality of Sinning Jenny', 1], ['Remember the Mayorality of the Viscountess', 1]]);

check('both titles of an event resolve to the same row',
  ['Live a Dream of the Starved War', 'Relive the Starved War'].map((n) => {
    const e = api.carouselLookup(api.SC_INDEX, n, key(api.SC_CALENDAR));
    return e && e.slot;
  }), [4, 4]);

// The wiki's page for the museum's return option says Whim 3, while the guide
// and the Fancy quality page both say Fancy 3. The two agreeing sources win,
// and the row says so rather than quietly picking one.
check('the one disagreement is recorded on its row, and says which sources were followed',
  rows.filter((e) => e.guide).map((e) => [e.name, e.cycle, e.slot,
    /the two agreeing sources are followed/.test(api.scSpec(e).title)]),
  [['Relive the construction of the Museum of Prelapsarian History', 'Fancy', 3, true]]);

check('an event with nothing recorded says so rather than counting zero uniques',
  [api.scBadgeText(row('Live a dream of a missing Hell')),
    /No guide here records what this one pays\./.test(api.scSpec(row('Live a dream of a missing Hell')).title)],
  ['Whim 6 · nothing recorded yet', true]);

check('the rules line says only one event a week can be taken',
  /You may live through ONE of them/.test(api.scSpec(row('Remember the Election of 1896')).title), true);

check('the tooltip lists the uniques and what each one costs',
  /Honorary Membership in the London Horticultural Society \(costs Parabolan Orange-apple ×3\)/.test(
    api.scSpec(row('Live a Dream of the Starved War')).title), true);

check('the registered pass: the Calendar heading and an event under it',
  (() => {
    const open = makeHeading(api.SC_CALENDAR, 'storylet-root__heading');
    const branch = makeHeading('Remember the Opening of Arbor');
    const returning = makeHeading('Return to the Mayorality of Virginia');
    roots = [open];
    branches = [branch, returning];
    api.scRatings();
    const out = [text(open, api.SC_CLASS), text(branch, api.SC_BRANCH_CLASS), text(returning, api.SC_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['this week’s two events', 'Fancy 5 · 5 uniques', 'Whim 5 · 1 unique']);

check('no The Sacroboscan Calendar name is in another feature\u2019s table',
  (() => {
    const others = otherNames('SC_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'sacroboscan'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
