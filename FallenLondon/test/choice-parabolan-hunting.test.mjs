// Ad-hoc test for FallenLondon/choice-helper.js's Parabolan Hunting badges
// ('parabolan-hunting').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's Ferocity for every quarry, that no
// badge ever states a difficulty when Parabolan Scouting cannot be read, that
// any "Pursuing the ..." or "Embattled with the ..." heading lands on its
// storylet however the quarry is named, and that the four options no guide
// records are labelled rather than scored.
//
// Numbers come from Parabolan Hunting (Guide) and the hunt's storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-parabolan-hunting.test.mjs

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
    'return { PH_OPTIONS, PH_STORYLETS, PH_INDEX, PH_TRACK, PH_SEARCH, PH_LOST, PH_PURSUING, PH_EMBATTLED, PH_CLASS, PH_BRANCH_CLASS, phBadgeText, phSpec, phStoryletSpec, phCanonical, phRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.PH_OPTIONS;
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

// Ferocity is the difficulty: every check on a hunt is 180 + 20 × (Ferocity −
// Scouting), so a quarry without one is a quarry the badge cannot price.
check('every quarry and destination carries a Ferocity',
  rows.filter((e) => (e.storylet === api.PH_TRACK || e.storylet === api.PH_SEARCH) && !e.label && e.ferocity == null)
    .map((e) => e.name), []);

check('the guide’s Ferocity table, quarry by quarry',
  rows.filter((e) => e.storylet === api.PH_TRACK && e.ferocity != null).map((e) => e.ferocity),
  [6, 8, 14, 20, 18, 16, 18, 15, 8]);

// Your Parabolan Scouting is on no page this script reads, so no row may turn
// the formula into a difficulty.
check('no badge states a difficulty, and every Ferocity row gives the formula',
  [rows.every((e) => !/^1[0-9][0-9]\b/.test(api.phBadgeText(e))),
    rows.filter((e) => e.ferocity != null).every((e) => /180 \+ 20 ×/.test(api.phSpec(e).title))],
  [true, true]);

check('badges for each shape of row',
  ['Pick up the trail of the Storm-bird', 'Make use of a Glass Gazette', 'Apply your own knowledge',
    'Wound the (Parabolan Quarry)', 'Bait the bear with honey', 'Capture the Storm-bird',
    'Find the weakness in an opponent’s defences'].map((n) => api.phBadgeText(row(n))),
  ['Ferocity 14 · a Storm-bird', 'Scouting +8 ▼', 'Scouting +10?',
    'Ferocity −(1 + Monstrous Anatomy)', 'Ferocity −5 ▼', 'a Storm-bird + Trophy?',
    'Ferocity 10 · Casing +28 CP · Gains → 9']);

// Two storylets are named for whatever you are hunting, and the list of
// quarries is open-ended -- the pages carry two the guide has never heard of --
// so the canonicaliser matches their SHAPE. A quarry it misses is a hunt that
// goes unbadged from the moment you find the trail.
check('any "Pursuing the ..." or "Embattled with the ..." heading lands on its storylet',
  ['Pursuing the Storm-bird', 'Pursuing the Aureate Stag', 'Embattled with the Carnivorous Aurochs',
    'Embattled with the beast no guide has heard of', 'Stay a little while']
    .map((n) => api.carouselCanonical(key(n), api.phCanonical)),
  [key(api.PH_PURSUING), key(api.PH_PURSUING), key(api.PH_EMBATTLED), key(api.PH_EMBATTLED),
    key('Stay a little while')]);

check('the quarry placeholders match, including the two in one title',
  ['Wound the Storm-bird', 'Await the Storm-bird at its nest of wire', 'Give up and flee the Honey-Mazed Bear']
    .map((n) => {
      const e = api.carouselLookup(api.PH_INDEX, n, key(api.PH_PURSUING))
        || api.carouselLookup(api.PH_INDEX, n, key(api.PH_EMBATTLED));
      return e && e.name;
    }),
  ['Wound the (Parabolan Quarry)', 'Await the (Parabolan Quarry) at (its lair)',
    'Give up and flee the (Parabolan Quarry)']);

// The four options the pages carry and no guide does are labelled, not scored:
// a Ferocity nobody has written down is not a number to badge.
check('the options no guide records are labelled rather than scored',
  rows.filter((e) => e.label === 'not in the guide').map((e) => e.name),
  ['Pick up the trail of an Aureate Stag', 'Track a Malice-in-Emerald', 'Look for the location of Procession',
    'Demonstrate a sporting commitment to fairness']);

check('every faction result is on the badge, after it',
  rows.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name, api.phBadgeText(e).endsWith(' · ' + api.factionText(e.factions))]),
  [['Pick up the trail of the Pinewood Shark', true], ['Case the townhouse of a Discerning Deviless', true],
    ['Claim the aid of Fingerkings', true], ['Kill the Pinewood Shark', true]]);

check('a heading says which part of a hunt it is',
  [api.PH_TRACK, api.PH_LOST, api.PH_PURSUING, api.PH_EMBATTLED].map((s) => api.phStoryletSpec(key(s)).text),
  ['pick a quarry', 'the tracking check · buy Scouting', 'found it · how to close', 'the confrontation']);

check('the registered pass: a heading named for the quarry, and an option under it',
  (() => {
    const list = makeHeading(api.PH_TRACK, 'storylet__heading');
    const open = makeHeading('Pursuing the Honey-Mazed Bear', 'storylet-root__heading');
    const branch = makeHeading('Bait the bear with honey');
    const elsewhere = makeHeading('Make use of a Glass Gazette');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.phRatings();
    const out = [text(list, api.PH_CLASS), text(open, api.PH_CLASS), text(branch, api.PH_BRANCH_CLASS),
      text(elsewhere, api.PH_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['pick a quarry', 'found it · how to close', 'Ferocity −5 ▼', null]);

check('no Parabolan Hunting name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PH_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'parabolan-hunting'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
