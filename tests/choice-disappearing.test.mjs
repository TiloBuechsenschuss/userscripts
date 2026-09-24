// Ad-hoc test for FallenLondon/choice-helper.js's Disappearing badges
// ('disappearing').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that this feature and `deciphering` share the
// Cabinet Noir storylet and NOT a single option, which is what lets both badge
// it without drawing over each other; that both Cabinet options carry what a
// FAILURE still pays, since both pay something and a badge that omitted it
// would understate them; that every escape action at the camp also takes a
// level off Waiting on a Ransom; and the cash-in's two numbers.
//
// Numbers come from Disappearing (Guide), Work in your Cabinet Noir and the Clay Highwayman camp pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-disappearing.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS',
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { DI_OPTIONS, DI_INDEX, DI_STORYLETS, DI_TARGET, DI_SUSPICION, DI_CABINET, DI_DARKNESS, DI_ESCAPE, DI_CLASS, DI_BRANCH_CLASS, diBadgeText, diSpec, diStoryletSpec, diRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.DI_OPTIONS;
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

check('no Disappearing name is in another feature\u2019s table',
  (() => {
    const others = otherNames('DI_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the cash-in wants 10 and pays 33',
  [api.DI_TARGET, api.DI_SUSPICION, api.diBadgeText(row('Eliminate a good deal of suspicion'))],
  [10, 33, 'Suspicion −33 · needs 10 · surplus lost']);

// Both Cabinet options pay on a failure too -- unusual, and a badge that left
// it out would make Cover your tracks look worse than it is.
check('every option that can fail says what the failure still pays',
  rows.filter((e) => e.cp != null && e.ch).map((e) => [e.name, JSON.stringify(e.failCp) || null]),
  [['Cover your tracks 1', '[1,3]'], ['Look for a path back to the railway', null],
    ['Look for an escape route', null], ['Map out the camp by candlelight', null]]);

check('Cover your tracks is one row, and answers to the plain title',
  [rows.filter((e) => /^Cover your tracks/.test(e.name)).length,
    api.carouselLookup(api.DI_INDEX, 'Cover your tracks', key(api.DI_CABINET)).cp],
  [1, [5, 6]]);

// The two features on this storylet must own disjoint options, or they draw
// over each other.
check('this feature and deciphering share the storylet and no option',
  (() => {
    const mine = rows.filter((e) => e.storylet === api.DI_CABINET).map((e) => key(e.name));
    const theirs = api.DC_OPTIONS.map((e) => key(e.name));
    return [mine.length, api.DC_OPTIONS.every((e) => e.storylet === api.DI_CABINET),
      mine.filter((n) => theirs.includes(n))];
  })(), [2, true, []]);

check('every camp action takes a level off Waiting on a Ransom',
  rows.filter((e) => e.cp != null && e.storylet !== api.DI_CABINET).map((e) => [e.name, !!e.ransom]),
  [['Look for a path back to the railway', true], ['Look for an escape route', true],
    ['Map out the camp by candlelight', true]]);

// Where the guide and the option page disagreed, the page won.
check('the candlelight check is the page’s Shadowy 190, not the guide’s Watchful',
  [row('Map out the camp by candlelight').ch.stat, row('Map out the camp by candlelight').ch.diff,
    /The page wins/.test(row('Map out the camp by candlelight').note)],
  ['Shadowy', 190, true]);

check('badges for each shape of row',
  ['Cover your tracks 1', 'Look for a path back to the railway', 'Slip away unseen']
    .map((n) => api.diBadgeText(row(n))),
  ['Disappearing +5–6? · fail +1–3', 'Disappearing +5? · Ransom −1', 'out of the camp · needs 5']);

check('the headings',
  api.DI_STORYLETS.map((s) => api.diStoryletSpec(key(s)).text),
  ['Disappearing to 10 · Suspicion −33', 'Disappearing +5 here · Ransom −1',
    'Disappearing +5 here · Ransom −1', 'Disappearing +5 here · Ransom −1',
    'out of the camp · needs Disappearing 5']);

check('an arrest wiping the progress is in the rules line',
  /Getting ARRESTED wipes every point of it/.test(api.diSpec(row('Cover your tracks 1')).title), true);

check('the registered pass: the Cabinet heading and its two options',
  (() => {
    const open = makeHeading(api.DI_CABINET, 'storylet-root__heading');
    const track = makeHeading('Cover your tracks');
    const cash = makeHeading('Eliminate a good deal of suspicion');
    const theirs = makeHeading('Crack a code');
    roots = [open];
    branches = [track, cash, theirs];
    api.diRatings();
    const out = [text(open, api.DI_CLASS), text(track, api.DI_BRANCH_CLASS), text(cash, api.DI_BRANCH_CLASS),
      text(theirs, api.DI_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Disappearing to 10 · Suspicion −33', 'Disappearing +5–6? · fail +1–3',
    'Suspicion −33 · needs 10 · surplus lost', null]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'disappearing'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
