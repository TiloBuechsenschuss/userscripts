// Ad-hoc test for FallenLondon/choice-helper.js's The Sous Catacombs bone
// donation badges ('sous-catacombs').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here: the guide's own "Total Value" figures (Stuiver
// converted to Echoes) for all ~34 bones across five categories, that
// Panoptical Skull and Ivory Femur are flagged as paying LESS than their raw
// skeleton value despite a large face number (the misleading-raw-total trap),
// that Forgo always reads as the worst option, that A Labyrinth of Roof and
// Bone is never badged (cosmetic, no reward difference), and -- since the
// real in-game donation-card heading is unknown, only a wiki disambiguator --
// that badging is by OPTION NAME MATCH ANYWHERE on the page, not gated to a
// guessed heading, so an unrelated page degrades to no badge rather than a
// wrongly-placed one or a crash.
//
// Numbers come from The Sous Catacombs (Guide) on fallenlondon.wiki, fetched
// through the API on 2026-09-27 (see
// docs/superpowers/research/2026-09-27-mid-firmament.md section 3).
//
//   node tests/choice-sous-catacombs.test.mjs

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

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'AOL_OPTIONS', 'ECDYSIS_OPTIONS',
  'MIDNIGHT_TRADE_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { SOUS_BONES, SOUS_FORGO, sousBoneSpec, sousCatacombsRatings, SOUS_CLASS, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, HIGH_SANCTA_CARDS, MOON_MISER_RISKY, MOON_MISER_GOLD,'
    + ' PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const row = (name) => api.SOUS_BONES.find((e) => e.name === name);
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
    ...TABLES.flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('40 bones across five categories (9+5+11+5+10, per the guide\'s own per-category tables), '
    + 'plus the always-available Human Ribcage flag',
  [api.SOUS_BONES.length, row('Human Ribcage').alwaysAvailable], [40, true]);

check('the guide\'s exact Total Value for one bone per category',
  ['Rubbery Skull', 'Human Arm', 'Prismatic Frame', 'Femur of a Surface Deer', 'Bat Wing'].map((n) => row(n).echo),
  [6, 7.20, 325, 5.1, 5.01]);

check('Panoptical Skull and Ivory Femur are flagged as paying LESS than skeleton value, IN WORDS ON '
    + 'THE BADGE FACE ITSELF (a "▼skel" mark) -- not colour alone, which a red-green-weak reader '
    + 'cannot use to tell them from any other bone',
  ['Panoptical Skull', 'Ivory Femur'].map((n) => {
    const r = row(n);
    return [r.warn, api.sousBoneSpec(r).title.includes('WARNING'), api.sousBoneSpec(r).text.includes('▼skel')];
  }),
  [[true, true, true], [true, true, true]]);

check('a normal bone\'s badge text carries no warning mark',
  api.sousBoneSpec(row('Rubbery Skull')).text.includes('▼'), false);

check('a normal bone is NOT flagged',
  row('Rubbery Skull').warn, undefined);

check('Forgo the donation always reads as worst: 0 value, a real cost, never ranked positively',
  (() => { const s = api.sousBoneSpec(api.SOUS_FORGO); return [s.text.startsWith('0'), s.title.toLowerCase().includes('worst')]; })(),
  [true, true]);

check('wiring: an option name that matches a bone badges anywhere on the page, no heading required',
  (() => {
    const rubbery = makeHeading('Rubbery Skull');
    const unrelated = makeHeading('Some Unrelated Option');
    branches = [rubbery, unrelated];
    api.sousCatacombsRatings();
    const out = [text(rubbery, api.SOUS_CLASS), text(unrelated, api.SOUS_CLASS)];
    branches = [];
    return out;
  })(),
  ['6 E', null]);

check('A Labyrinth of Roof and Bone is never badged (cosmetic, no reward difference)',
  (() => {
    const labyrinth = makeHeading('A Labyrinth of Roof and Bone');
    branches = [labyrinth];
    api.sousCatacombsRatings();
    const out = text(labyrinth, api.SOUS_CLASS);
    branches = [];
    return out;
  })(),
  null);

check('against a page with no matching name at all, nothing is attached and nothing throws',
  (() => {
    branches = [makeHeading('Completely Unrelated Storylet Option')];
    let threw = false;
    try { api.sousCatacombsRatings(); } catch (e) { threw = true; }
    const out = threw;
    branches = [];
    return out;
  })(), false);

check('no Sous Catacombs bone name is in another feature\'s table',
  (() => { const others = allNames();
    return api.SOUS_BONES.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'sous-catacombs'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
