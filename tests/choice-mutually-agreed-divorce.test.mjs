// Ad-hoc test for FallenLondon/choice-helper.js's Pursuing a Mutually-Agreed Divorce badges
// ('mutually-agreed-divorce').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: all 12 rows, both CONTEST rows (opposed challenges against the
// player's own spouse) show a Winner/Loser split rather than a normal success/failure pair, both
// Social-Action-Auto rows are informational only (no direct reward stated on their own page), the
// inverted lock on "Is all this really necessary?" is stated in words, "Provide a notice from
// higher authorities" (the standout at +16-25) is not buried in a uniform list, and no name
// collides with another feature's table.
//
// Numbers come from Pursuing a Mutually-Agreed Divorce on fallenlondon.wiki, fetched through the
// API on 2026-09-28 (storylet page plus all 12 option pages, not truncated) -- see this plan's
// own Task 10 for the full transcribed table (the research doc's summary claimed this storylet
// was complete but never wrote its section; fetched directly during planning instead).
//
//   node tests/choice-mutually-agreed-divorce.test.mjs

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
    'return { DIVORCE_OPTIONS, mutuallyAgreedDivorceSpec, mutuallyAgreedDivorceRatings,'
    + ' DIVORCE_CLASS, DIVORCE_BRANCH_CLASS, CLAY_QUARTERS_OPTIONS, UNIVERSITY_CREATURE_OPTIONS,'
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
const row = (name) => api.DIVORCE_OPTIONS.find((e) => e.name === name);
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
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('12 rows', api.DIVORCE_OPTIONS.length, 12);

check('both CONTEST rows show a Winner/Loser split with the stat named, not a normal pair',
  ['Share Tales of Terror about your spouse with the Court', 'Present your spouse\'s inadequacies to the court']
    .map((n) => { const e = row(n); return [e.contest, e.winGives, e.loseGives]; }),
  [['Persuasive', 'Pursuing a divorce +7', 'Pursuing a divorce +2-3'],
    ['Watchful', 'Pursuing a divorce +7', 'Pursuing a divorce +2-3']]);

check('both Social-Action-Auto rows are informational only (no direct itemised reward)',
  ['Appear before the court with your spouse', 'Request that a friend assassinate your spouse before the Court']
    .every((n) => row(n).social === true),
  true);

check('the inverted lock on "Is all this really necessary?" is stated in words',
  api.mutuallyAgreedDivorceSpec(row('Is all this really necessary?')).title.toLowerCase().includes('below'), true);

check('"Provide a notice from higher authorities" is the standout, marked as such',
  api.mutuallyAgreedDivorceSpec(row('Provide a notice from higher authorities')).title.toLowerCase().includes('standout'), true);

check('wiring: badges only appear while the Divorce storylet is open',
  (() => {
    const pity = makeHeading("Seek the Court's pity");
    branches = [pity];
    const out = [];
    roots = [makeHeading('Pursuing a Mutually-Agreed Divorce')];
    api.mutuallyAgreedDivorceRatings();
    out.push(text(pity, api.DIVORCE_BRANCH_CLASS) !== null);
    roots = [makeHeading('Some Other Storylet')];
    api.mutuallyAgreedDivorceRatings();
    out.push(text(pity, api.DIVORCE_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no Divorce name is in another feature\'s table',
  (() => { const others = allNames();
    return api.DIVORCE_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'mutually-agreed-divorce'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
