// Ad-hoc test for FallenLondon/choice-helper.js's The Clay Quarters (Storylet) badges
// ('clay-quarters').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 8 rows, the Jasper-and-Frank redirect is informational only (never
// ranked), the 5-Fate option is excluded from ranking but present with its cost stated, and no
// name collides with another feature's table.
//
// Numbers come from The Clay Quarters (Storylet) on fallenlondon.wiki, fetched through the API
// on 2026-09-27 -- see docs/superpowers/research/2026-09-27-airs-of-london-group-b.md section 6.
//
//   node tests/choice-clay-quarters.test.mjs

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
    'return { CLAY_QUARTERS_OPTIONS, clayQuartersSpec, clayQuartersRatings, CLAY_QUARTERS_CLASS,'
    + ' CLAY_QUARTERS_BRANCH_CLASS, UNIVERSITY_CREATURE_OPTIONS, LAB_CARDS, BURNING_CITY_OPTIONS,'
    + ' TIME_IN_BED_OPTIONS, CHEERY_CONSTABLE_OPTIONS, FFIR_OPTIONS, FEAST_OPTIONS,'
    + ' TOWER_OF_EYES_OPTIONS, RATTUS_FABER_OPTIONS, AOL_OPTIONS, ECDYSIS_OPTIONS,'
    + ' MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, HIGH_SANCTA_CARDS,'
    + ' MOON_MISER_RISKY, MOON_MISER_GOLD, SOUS_BONES, RED_STAGE_MAIN, RED_STAGE_FINALE,'
    + ' RED_STAGE_HAZARD, MOTH_STEPS, QUARTZ_ACTIONS, PC_OPTIONS, VSD_OPTIONS,'
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
const row = (name) => api.CLAY_QUARTERS_OPTIONS.find((e) => e.name === name);
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
    ...api.UNIVERSITY_CREATURE_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('8 rows', api.CLAY_QUARTERS_OPTIONS.length, 8);

check('the Jasper-and-Frank redirect is informational only, never ranked',
  (() => { const e = row('You cross paths with Jasper and Frank'); return [e.open, api.clayQuartersSpec(e).color]; })(),
  ['A Complication: Jasper and Frank', '#3f5f8a']);

check('the 5-Fate option is excluded from ranking but present with its cost stated',
  (() => { const e = row('Even the odds in a clay dispute');
    return [e.fate, api.clayQuartersSpec(e).title.toLowerCase().includes('fate')]; })(),
  [5, true]);

check('wiring: badges only appear while "The Clay Quarters" is the open storylet',
  (() => {
    const mud = makeHeading('Assist at a mud-surgery');
    branches = [mud];
    const out = [];
    roots = [makeHeading('The Clay Quarters')];
    api.clayQuartersRatings();
    out.push(text(mud, api.CLAY_QUARTERS_BRANCH_CLASS) !== null);
    roots = [makeHeading('Some Other Storylet')];
    api.clayQuartersRatings();
    out.push(text(mud, api.CLAY_QUARTERS_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no Clay Quarters name is in another feature\'s table',
  (() => { const others = allNames();
    return api.CLAY_QUARTERS_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the headline is the main reward: Cryptic Clue for the poetry, Moon-Pearl for the Fate option',
  ['Decipher Loamsprach poetry', 'Even the odds in a clay dispute'].map((n) => api.clayQuartersSpec(row(n)).text),
  ['Cryptic Clue 6-15?', 'Fate 5: Moon-Pearl 100']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'clay-quarters'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
