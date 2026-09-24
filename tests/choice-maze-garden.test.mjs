// Ad-hoc test for FallenLondon/choice-helper.js's The Maze-Garden badges
// ('maze-garden').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every trade's Echoes-per-change-point is
// what its own parts come to, that Select a head from the pile outranks every
// other +7 because of the clock, that Perambulating shows only when it is not
// the usual +4, the (garment) placeholder, and the one title that covers two
// different options being a label rather than a number.
//
// Numbers come from The Maze-Garden (Guide) and the labyrinth's card and storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node tests/choice-maze-garden.test.mjs

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
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MZ_OPTIONS, MZ_STORYLETS, MZ_CARDS, MZ_INDEX, MZ_HAND, MZ_GATEWAY, MZ_OFFERING, MZ_PER_DEFAULT, MZ_CLASS, MZ_BRANCH_CLASS, MZ_CARD_CLASS, mzBadgeText, mzSpec, mzStoryletSpec, mzRank, mzRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.MZ_OPTIONS;
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

// The reward column is recomputed from the parts rather than trusted: count ×
// the item's own Echo price ÷ the Awakening it costs IS the rate, and a
// transcription slip in any of the three shows up here rather than in a badge
// that quietly prices a trade wrong.
check('every trade’s rate is what its parts come to',
  rows.filter((e) => e.cost != null)
    .map((e) => [e.name, Math.round((e.count * e.unit / e.cost) * 100) / 100 === e.rate]),
  [['Take some silk scraps', true], ['Take some surface-silk', true], ['Take some whisper-satin', true],
    ['Take some Correspondence plaques', true], ['Take some Thirsty Bombazine', true],
    ['Take some Glass Gazettes', true]]);

check('the three trades the guide says to avoid are the three worst rates',
  rows.filter((e) => e.cost != null && e.rate < 1).map((e) => e.name),
  ['Take some silk scraps', 'Take some Thirsty Bombazine', 'Take some Glass Gazettes']);

check('every row is a label, a trade or an Awakening line',
  rows.filter((e) => !e.label && e.cost == null && e.awak == null).map((e) => e.name), []);

// The guide's central claim, and the reason Perambulating is on the badge at
// all: Select a head pays the full +7 for half the clock, so it must outrank
// every other +7 in a hand.
check('Select a head from the pile outranks the other +7s',
  (() => {
    const head = api.mzRank(row('Select a head from the pile'));
    return rows.filter((e) => api.mzRank(e) && e !== row('Select a head from the pile'))
      .every((e) => api.mzRank(e)[0] < head[0] || (api.mzRank(e)[0] === head[0] && api.mzRank(e)[1] < head[1]));
  })(), true);

check('badges for each shape of row',
  ['Select a head from the pile', 'Leave the pile of heads to its own devices', 'Walk softly',
    'Take some Correspondence plaques', 'A Prisoner’s Mask', 'Place it on the nearly nude Clay Man',
    'Allow your (garment) to join in']
    .map((n) => api.mzBadgeText(row(n))),
  ['Awak +7 · Per +2', 'Awak +1 · COMMUNION +4? fail Awak +6 · IPSEITY +2',
    'Awak +7? fail Awak +0 · Per +2', 'Awak 28 CP → Correspondence Plaque ×56 · 1.00 per CP',
    'Disposition 120 ▼', 'Awak +7 · IPSEITY +4',
    'Awak +7 · COMMUNION +4–5, or Awak +3 · COMMUNION +7']);

// +4 is what a card costs unless it says otherwise, so printing it on every
// badge would drown the two that differ.
check('Perambulating is on the badge only when it is not the usual +4',
  rows.filter((e) => e.awak != null).map((e) => [e.name, /Per \+/.test(api.mzBadgeText(e))])
    .filter((r) => r[1]).map((r) => r[0]),
  ['Select a head from the pile', 'Fight on behalf of your (garment)', 'Walk softly', 'Carry your (garment) across',
    'Wade through the rushing water']);

check('the one title that covers two options is a label naming both, not a number',
  [row('Allow your (garment) to join in').awak, /Only one of the two is ever offered\./.test(
    api.mzSpec(row('Allow your (garment) to join in')).title)], [undefined, true]);

check('the garment placeholder matches whatever the game calls it',
  ['Fight on behalf of your Prisoner’s Mask', 'Allow your Horrendous Cravat to participate']
    .map((n) => {
      const e = api.carouselLookup(api.MZ_INDEX, n, key('DUEL'));
      return e && e.name;
    }), ['Fight on behalf of your (garment)', 'Allow your (garment) to participate']);

check('a challenge at your Disposition says so rather than naming a difficulty',
  /Polythremean Disposition -- the garment you brought sets it\./.test(api.mzSpec(row('Walk softly')).title), true);

check('the gateway, the gates and the offering are not dealt as cards',
  [api.MZ_CARDS.includes(api.MZ_GATEWAY), api.MZ_CARDS.includes(api.MZ_OFFERING),
    api.MZ_CARDS.includes('The Watchful Gate'), api.MZ_CARDS.includes('DISCERN')],
  [false, false, false, true]);

check('the registered pass: a card in the hand, an opened card and its option',
  (() => {
    const inHand = makeHeading('DISCERN');
    const traverse = makeHeading('TRAVERSE');
    hand = [inHand, traverse];
    const open = makeHeading('SCAVENGE', 'storylet-root__heading');
    roots = [open];
    const branch = makeHeading('Walk softly');
    branches = [branch];
    api.mzRatings();
    const out = [text(inHand, api.MZ_CARD_CLASS), text(traverse, api.MZ_CARD_CLASS), text(open, api.MZ_CLASS),
      text(branch, api.MZ_BRANCH_CLASS)];
    hand = []; roots = []; branches = [];
    return out;
  })(),
  ['Awak +7 · Per +2', 'Awak +4? fail Awak +0 · Per +6', 'maze card', 'Awak +7? fail Awak +0 · Per +2']);

check('no The Maze-Garden name is in another feature\u2019s table',
  (() => {
    const others = otherNames('MZ_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'maze-garden'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
