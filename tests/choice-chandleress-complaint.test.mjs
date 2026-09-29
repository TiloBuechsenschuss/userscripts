// Ad-hoc test for FallenLondon/choice-helper.js's The Chandleress' Complaint badges
// ('chandleress-complaint').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 4 rows; the one Airs-gated row's narrow window is EXACT (96-100, not
// rounded); its Favours: The Docks result comes after the badge text (the shared faction-result
// convention); the beeswax row states it scales with Dangerous; the exit row names "The Department
// of Menace Eradication" as where it leads and carries no ranked value; no collision, in
// particular none with the Department's own storylet.
//
// Numbers come from The Chandleress' Complaint and its four option pages on fallenlondon.wiki,
// fetched through the API on 2026-09-28 -- see
// docs/superpowers/research/2026-09-27-airs-of-london-group-d.md section H1.
//
//   node tests/choice-chandleress-complaint.test.mjs

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
      const m = /^([a-z]+)?(?:\.([\w-]+))?$/.exec(sel);
      return this.children.find((c) => (!m[1] || c.tagName === m[1].toUpperCase())
        && (!m[2] || String(c.className).split(/\s+/).includes(m[2]))) || null;
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

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CHANDLERESS_COMPLAINT_OPTIONS, chandleressComplaintSpec, CHANDLERESS_COMPLAINT_INDEX, carouselLookup, chandleressComplaintRatings, CHANDLERESS_COMPLAINT_CLASS, CHANDLERESS_COMPLAINT_BRANCH_CLASS,'
    + ' SHIFTING_STREETS_OPTIONS, CLATHERMONT_OPTIONS, DIVORCE_OPTIONS, HALLOWMAS_OPTIONS, CANDLEFINDER_CLAY_MEN_OPTIONS, CHW_OPTIONS, ON_THE_TRAIL_OPTIONS, WATCHMAKERS_HILL_AIRS_OPTIONS, OPPORTUNITY_FOR_PROFIT_OPTIONS, ALLEYS_OF_SPITE_OPTIONS, FLIT_AND_ITS_KING_OPTIONS, BONES_IN_RIVER_OPTIONS, DME_OPTIONS, CLAY_QUARTERS_OPTIONS, UNIVERSITY_CREATURE_OPTIONS,'
    + ' LAB_CARDS, BURNING_CITY_OPTIONS, TIME_IN_BED_OPTIONS, CHEERY_CONSTABLE_OPTIONS,'
    + ' FFIR_OPTIONS, FEAST_OPTIONS, TOWER_OF_EYES_OPTIONS, RATTUS_FABER_OPTIONS, AOL_OPTIONS,'
    + ' ECDYSIS_OPTIONS, MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS,'
    + ' HIGH_SANCTA_CARDS, MOON_MISER_RISKY, MOON_MISER_GOLD, SOUS_BONES, RED_STAGE_MAIN,'
    + ' RED_STAGE_FINALE, RED_STAGE_HAZARD, MOTH_STEPS, QUARTZ_ACTIONS, PC_OPTIONS, VSD_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const row = (name) => api.CHANDLERESS_COMPLAINT_OPTIONS.find((e) => e.name === name);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function allNames() {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...api.HIGH_SANCTA_CARDS.map((c) => c.name),
    ...api.MOON_MISER_RISKY.flatMap((e) => [e.card, e.option]), ...api.MOON_MISER_GOLD.map((e) => e.name),
    ...api.SOUS_BONES.map((e) => e.name),
    ...api.RED_STAGE_MAIN.map((e) => e.name), ...api.RED_STAGE_FINALE.map((e) => e.name), ...api.RED_STAGE_HAZARD.map((e) => e.name),
    ...api.MOTH_STEPS.map((e) => e.name), ...api.QUARTZ_ACTIONS.map((e) => e.name),
    ...api.RATTUS_FABER_OPTIONS.map((e) => e.name), ...api.TOWER_OF_EYES_OPTIONS.map((e) => e.name),
    ...api.FEAST_OPTIONS.map((e) => e.name), ...api.FFIR_OPTIONS.map((e) => e.name), ...api.CHEERY_CONSTABLE_OPTIONS.map((e) => e.name),
    ...api.TIME_IN_BED_OPTIONS.map((e) => e.name), ...api.BURNING_CITY_OPTIONS.map((e) => e.name),
    ...api.UNIVERSITY_CREATURE_OPTIONS.map((e) => e.name), ...api.CLAY_QUARTERS_OPTIONS.map((e) => e.name),
    ...api.DIVORCE_OPTIONS.map((e) => e.name), ...api.HALLOWMAS_OPTIONS.map((e) => e.name), ...api.CLATHERMONT_OPTIONS.map((e) => e.name), ...api.SHIFTING_STREETS_OPTIONS.map((e) => e.name), ...api.CANDLEFINDER_CLAY_MEN_OPTIONS.map((e) => e.name), ...api.CHW_OPTIONS.map((e) => e.name), ...api.ON_THE_TRAIL_OPTIONS.map((e) => e.name), ...api.WATCHMAKERS_HILL_AIRS_OPTIONS.map((e) => e.name), ...api.OPPORTUNITY_FOR_PROFIT_OPTIONS.map((e) => e.name), ...api.ALLEYS_OF_SPITE_OPTIONS.map((e) => e.name), ...api.FLIT_AND_ITS_KING_OPTIONS.map((e) => e.name), ...api.BONES_IN_RIVER_OPTIONS.map((e) => e.name), ...api.DME_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

const OPTS = api.CHANDLERESS_COMPLAINT_OPTIONS;

check('4 rows', OPTS.map((e) => e.name),
  ['Light a candle, and wait', 'Ask the Chandleress about the rat-catchers\' traditions', 'Confide in the Chandleress',
    'Back to the Department']);

check('the Airs-gated row\'s window is exactly 96-100 and no other row has one',
  OPTS.map((e) => e.airs || null), [null, null, [96, 100], null]);

check('the Airs-gated row shows Favours: The Docks +1 after its badge text and states the Dangerous loss',
  (() => { const s = api.chandleressComplaintSpec(OPTS[2]);
    return [s.text.endsWith('Favours: The Docks +1'), s.title.includes('Dangerous -5 CP'), s.title.includes('96-100')]; })(),
  [true, true, true]);

check('the beeswax row says it scales with Dangerous; the hint row is a flat Whispered Hint x30',
  [api.chandleressComplaintSpec(OPTS[0]).title.includes('Dangerous'), api.chandleressComplaintSpec(OPTS[1]).text],
  [true, 'Hint ×30?']);

check('the exit row names the Department, carries no challenge mark and no ranked reward',
  (() => { const s = api.chandleressComplaintSpec(OPTS[3]);
    return [s.title.includes('The Department of Menace Eradication'), s.text.includes('?')]; })(),
  [true, false]);

check('"Back to the Department" answers to the page\'s "Back to the Department 2"',
  [api.carouselLookup(api.CHANDLERESS_COMPLAINT_INDEX, 'Back to the Department', key('The Chandleress\' Complaint')) !== null,
    api.carouselLookup(api.CHANDLERESS_COMPLAINT_INDEX, 'Back to the Department 2', key('The Chandleress\' Complaint')) !== null],
  [true, true]);

check('wiring: badges only appear while The Chandleress\' Complaint is the open storylet',
  (() => {
    const head = makeHeading('Confide in the Chandleress');
    branches = [head];
    const out = [];
    roots = [makeHeading('The Chandleress\' Complaint')];
    api.chandleressComplaintRatings();
    out.push(text(head, api.CHANDLERESS_COMPLAINT_BRANCH_CLASS) !== null);
    roots = [makeHeading('The Department of Menace Eradication')];
    api.chandleressComplaintRatings();
    out.push(text(head, api.CHANDLERESS_COMPLAINT_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no name here is in another feature\'s table (the Department\'s own storylet included)',
  (() => { const others = allNames();
    return OPTS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'chandleress-complaint'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
