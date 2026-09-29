// Ad-hoc test for FallenLondon/choice-helper.js's The Alleys of Spite badges ('alleys-of-spite').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 2 rows with their Airs windows (0-50, 51+) and Shadowy difficulties
// (3 and 4); the lock on "A Name Whispered in Darkness" is INVERTED (the wiki says "Locked with":
// the option disappears once you hold that quality) and the tooltip says so in words rather than
// calling it a requirement; the rare success on "Follow an unsuspecting mark" is stated; the
// Airs 51 / Shadowy 2 unlock on the second row is stated; no collision with the Spite features.
//
// Numbers come from The Alleys of Spite and its two option pages on fallenlondon.wiki, fetched
// through the API on 2026-09-28 -- see
// docs/superpowers/research/2026-09-27-airs-of-london-group-d.md section F (whose "requirement"
// wording for the Name Whispered in Darkness lock is corrected here).
//
//   node tests/choice-alleys-of-spite.test.mjs

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
    'return { ALLEYS_OF_SPITE_OPTIONS, alleysOfSpiteSpec, alleysOfSpiteRatings, ALLEYS_OF_SPITE_CLASS, ALLEYS_OF_SPITE_BRANCH_CLASS,'
    + ' SHIFTING_STREETS_OPTIONS, CLATHERMONT_OPTIONS, DIVORCE_OPTIONS, HALLOWMAS_OPTIONS, CANDLEFINDER_CLAY_MEN_OPTIONS, CHW_OPTIONS, ON_THE_TRAIL_OPTIONS, WATCHMAKERS_HILL_AIRS_OPTIONS, OPPORTUNITY_FOR_PROFIT_OPTIONS, CLAY_QUARTERS_OPTIONS, UNIVERSITY_CREATURE_OPTIONS,'
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
const row = (name) => api.ALLEYS_OF_SPITE_OPTIONS.find((e) => e.name === name);
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
    ...api.DIVORCE_OPTIONS.map((e) => e.name), ...api.HALLOWMAS_OPTIONS.map((e) => e.name), ...api.CLATHERMONT_OPTIONS.map((e) => e.name), ...api.SHIFTING_STREETS_OPTIONS.map((e) => e.name), ...api.CANDLEFINDER_CLAY_MEN_OPTIONS.map((e) => e.name), ...api.CHW_OPTIONS.map((e) => e.name), ...api.ON_THE_TRAIL_OPTIONS.map((e) => e.name), ...api.WATCHMAKERS_HILL_AIRS_OPTIONS.map((e) => e.name), ...api.OPPORTUNITY_FOR_PROFIT_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

const OPTS = api.ALLEYS_OF_SPITE_OPTIONS;

check('2 rows with their Airs windows and Shadowy difficulties',
  OPTS.map((e) => [e.name, e.airs, e.ch.diff]),
  [['Follow an unsuspecting mark', [0, 50], 3], ['Eavesdrop on a random target', [51, 100], 4]]);

check('badges show the flat Whispered Hint reward with a challenge mark',
  OPTS.map((e) => api.alleysOfSpiteSpec(e).text), ['Hint ×3?', 'Hint ×10?']);

check('the Name Whispered in Darkness lock is stated as inverted, on both rows',
  OPTS.map((e) => { const t = api.alleysOfSpiteSpec(e).title;
    return t.includes('A Name Whispered in Darkness') && /hidden|not offered|unavailable/i.test(t) && !/^Requires: A Name/m.test(t); }),
  [true, true]);

check('the rare success on the first row is stated (Hint x5 and Rostygold x10)',
  (() => { const t = api.alleysOfSpiteSpec(OPTS[0]).title; return [t.includes('Whispered Hint x5'), t.includes('Rostygold x10')]; })(),
  [true, true]);

check('the second row states its Airs 51 and Shadowy 2 unlock',
  (() => { const t = api.alleysOfSpiteSpec(OPTS[1]).title; return [t.includes('Shadowy 2'), t.includes('51')]; })(), [true, true]);

check('wiring: badges only appear while The Alleys of Spite is the open storylet',
  (() => {
    const head = makeHeading('Follow an unsuspecting mark');
    branches = [head];
    const out = [];
    roots = [makeHeading('The Alleys of Spite')];
    api.alleysOfSpiteRatings();
    out.push(text(head, api.ALLEYS_OF_SPITE_BRANCH_CLASS) !== null);
    roots = [makeHeading('Some Other Storylet')];
    api.alleysOfSpiteRatings();
    out.push(text(head, api.ALLEYS_OF_SPITE_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no name here is in another feature\'s table, the four Spite features included',
  (() => { const others = allNames();
    return OPTS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'alleys-of-spite'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
