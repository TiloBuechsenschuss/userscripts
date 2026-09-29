// Ad-hoc test for FallenLondon/choice-helper.js's A Bad Case of Rattus Faber badges
// ('rattus-faber').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: all 20 main-table rows plus both redirect sub-storylets' 6 rows (26
// total), the two Luck challenges (70%/50%) show an expected-value badge marked with the
// approximation mark rather than the raw success figure, the formula row ("A lull in
// hostilities...") carries the literal formula string rather than a baked-in worked example, every
// row only resolves through carouselLookup while ITS OWN storylet is open, and no name collides
// with another feature's table.
//
// Numbers come from A Bad Case of Rattus Faber on fallenlondon.wiki, fetched through the API on
// 2026-09-27 -- see docs/superpowers/research/2026-09-27-airs-of-london-group-a.md section 1.
//
//   node tests/choice-rattus-faber.test.mjs

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
    'return { RATTUS_FABER_OPTIONS, rattusFaberSpec, rattusFaberRatings, RATTUS_FABER_CLASS,'
    + ' RATTUS_FABER_BRANCH_CLASS, AOL_OPTIONS, ECDYSIS_OPTIONS, MIDNIGHT_TRADE_OPTIONS,'
    + ' ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, HIGH_SANCTA_CARDS, MOON_MISER_RISKY,'
    + ' MOON_MISER_GOLD, SOUS_BONES, RED_STAGE_MAIN, RED_STAGE_FINALE, RED_STAGE_HAZARD,'
    + ' MOTH_STEPS, QUARTZ_ACTIONS, PC_OPTIONS, VSD_OPTIONS,'
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
const row = (name) => api.RATTUS_FABER_OPTIONS.find((e) => e.name === name);
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
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('26 rows total: 20 main table + 3 Dottore Rappacini + 3 Rattus Faber Chief',
  [api.RATTUS_FABER_OPTIONS.length,
    api.RATTUS_FABER_OPTIONS.filter((e) => e.storylet === 'A Bad Case of Rattus Faber').length,
    api.RATTUS_FABER_OPTIONS.filter((e) => e.storylet === 'Employ the poisons of Dottore Rappacini').length,
    api.RATTUS_FABER_OPTIONS.filter((e) => e.storylet === 'A showdown with the Rattus Faber Chief').length],
  [26, 20, 3, 3]);

check('the two Luck challenges (rat-catcher 70%, Thing from the Wardrobe 50%) show an '
    + 'expected-value badge marked with the approximation mark, not the raw success figure',
  ['A tactical opportunity: employ a rat-catcher', 'A tactical opportunity: unleash the Thing from the Wardrobe']
    .map((n) => api.rattusFaberSpec(row(n)).text.includes('≈')),
  [true, true]);

check('the formula row carries the literal formula, not a baked-in worked example',
  row('A lull in hostilities: try to negotiate with the rats.').formula, '44 - Troubled by Vermin/2');

check('every failure costs at least Vermin -1 -- no zero-risk option exists here, stated on the storylet heading',
  (() => {
    const nonRedirect = api.RATTUS_FABER_OPTIONS.filter((e) => e.storylet === 'A Bad Case of Rattus Faber' && e.failVermin != null);
    return nonRedirect.every((e) => e.failVermin <= -1);
  })(), true);

check('wiring: a main-table option only badges while "A Bad Case of Rattus Faber" is open, '
    + 'not while a redirect sub-storylet is open',
  (() => {
    const opening = makeHeading('Opening salvoes: launch an early offensive');
    branches = [opening];
    const out = [];
    roots = [makeHeading('A Bad Case of Rattus Faber')];
    api.rattusFaberRatings();
    out.push(text(opening, api.RATTUS_FABER_BRANCH_CLASS) !== null);
    roots = [makeHeading('Employ the poisons of Dottore Rappacini')];
    api.rattusFaberRatings();
    out.push(text(opening, api.RATTUS_FABER_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('wiring: a redirect sub-storylet option only badges while ITS OWN storylet is open',
  (() => {
    const kill = makeHeading('Go for the kill');
    branches = [kill];
    roots = [makeHeading('A showdown with the Rattus Faber Chief')];
    api.rattusFaberRatings();
    const out = text(kill, api.RATTUS_FABER_BRANCH_CLASS) !== null;
    roots = []; branches = [];
    return out;
  })(), true);

check('the two redirect rows in the main table (hire a specialist, the final battle) carry an '
    + 'open target and no Vermin delta of their own',
  ['A tactical opportunity: hire a specialist', 'The final battle: face the Rattus Faber Chief'].map((n) => {
    const e = row(n);
    return [e.open, e.succVermin == null];
  }),
  [['Employ the poisons of Dottore Rappacini', true], ['A showdown with the Rattus Faber Chief', true]]);

check('no Rattus Faber name is in another feature\'s table',
  (() => { const others = allNames();
    return api.RATTUS_FABER_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the Thing from the Wardrobe halves your CURRENT Vermin: no number on the badge, the dependency in words',
  (() => { const s = api.rattusFaberSpec(row('A tactical opportunity: unleash the Thing from the Wardrobe'));
    return [/^Vermin ÷2/.test(s.text), /[0-9]/.test(s.text.replace('÷2', '')), s.title.includes('CURRENT')]; })(),
  [true, false, true]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'rattus-faber'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
