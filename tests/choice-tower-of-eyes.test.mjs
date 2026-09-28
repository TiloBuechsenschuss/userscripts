// Ad-hoc test for FallenLondon/choice-helper.js's The Tower of Eyes badges ('tower-of-eyes').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: the 5 top-level + 12 Salon + 10 Orphanage = 27 rows (the research
// doc's own summary line undercounted the Salon table at "11 total, 9 Airs-gated, 2 not" --
// its own listed table has 12 rows, 3 non-Airs -- the table is the real data, corrected here),
// that the storylet-level tooltip states the two tracks are MUTUALLY EXCLUSIVE, that ranged
// rewards are carried as ranges not guessed midpoints, that the 4 Social-Action rows (need a
// matching-Profession friend) are marked gated rather than ranked in, that "invite the Duchess"
// is flagged guide-uncertain rather than inventing a number, and that no name collides with
// another feature's table.
//
// Numbers come from The Tower of Eyes: Behind Closed Doors at a Handsome Townhouse on
// fallenlondon.wiki, fetched through the API on 2026-09-27 -- see
// docs/superpowers/research/2026-09-27-airs-of-london-group-a.md section 2.
//
//   node tests/choice-tower-of-eyes.test.mjs

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
    'return { TOWER_OF_EYES_OPTIONS, towerOfEyesSpec, towerOfEyesRatings, TOWER_OF_EYES_CLASS,'
    + ' TOWER_OF_EYES_BRANCH_CLASS, RATTUS_FABER_OPTIONS, AOL_OPTIONS, ECDYSIS_OPTIONS,'
    + ' MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, HIGH_SANCTA_CARDS,'
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
const row = (name) => api.TOWER_OF_EYES_OPTIONS.find((e) => e.name === name);
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
    ...api.RATTUS_FABER_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('27 rows: 5 top-level + 12 Salon + 10 Orphanage', [
  api.TOWER_OF_EYES_OPTIONS.filter((e) => e.track === 'top').length,
  api.TOWER_OF_EYES_OPTIONS.filter((e) => e.track === 'salon').length,
  api.TOWER_OF_EYES_OPTIONS.filter((e) => e.track === 'orphanage').length,
], [5, 12, 10]);

check('the storylet-level tooltip states the two tracks are mutually exclusive',
  api.towerOfEyesRatings && api.towerOfEyesSpec(row('Scheme: Set up a Salon')).title.toLowerCase().includes('locks out'),
  true);

check('a ranged reward is carried as a range, not a guessed midpoint',
  row('Your Salon: invite the Sardonic Music-Hall Singer').makingWaves, [121, 180]);

check('the 4 Social-Action rows (need a matching-Profession friend) are marked gated',
  ['Invite an Author acquaintance', 'Invite a Crooked-Cross to address your Salon',
    'Invite a Conjuror acquaintance to... perform', 'Invite a Correspondent acquaintance to educate the orphans']
    .every((n) => row(n).social === true && api.towerOfEyesSpec(row(n)).title.toLowerCase().includes('profession')),
  true);

check('"Your Salon: invite the Duchess" is flagged guide-uncertain, not given an invented reward',
  api.towerOfEyesSpec(row('Your Salon: invite the Duchess')).title.toLowerCase().includes('guide'), true);

check('wiring: a Salon-track option only badges while The Tower of Eyes is the open storylet',
  (() => {
    const singer = makeHeading('Your Salon: invite the Sardonic Music-Hall Singer');
    branches = [singer];
    const out = [];
    roots = [makeHeading('The Tower of Eyes: Behind Closed Doors at a Handsome Townhouse')];
    api.towerOfEyesRatings();
    out.push(text(singer, api.TOWER_OF_EYES_BRANCH_CLASS) !== null);
    roots = [makeHeading('Some Other Storylet')];
    api.towerOfEyesRatings();
    out.push(text(singer, api.TOWER_OF_EYES_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no Tower of Eyes name is in another feature\'s table',
  (() => { const others = allNames();
    return api.TOWER_OF_EYES_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'tower-of-eyes'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
