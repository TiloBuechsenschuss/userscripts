// Ad-hoc test for FallenLondon/choice-helper.js's Prelapsarian Museum badges
// ('prelapsarian-museum').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's certain-at stats, the two expected
// menaces worked out from the pages' odds, the Assert titles matching through
// the "(first option)" placeholder, the cash-in ladder, and the one guide
// disagreement.
//
// Numbers come from The Prelapsarian Museum (Guide) and its option and
// storylet pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-prelapsarian-museum.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MUS_OPTIONS, MUS_STORYLETS, MUS_INDEX, MUS_LAB, MUS_CLASS, MUS_BRANCH_CLASS, musBadgeText, musSpec,'
    + ' musStoryletSpec, musCertainAt, musRatings, carouselLookup, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const row = (name) => api.MUS_OPTIONS.find((e) => e.name === name);
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
  ].map(key);
}

check('every option is filed under one of the five storylets',
  api.MUS_OPTIONS.filter((e) => !api.MUS_STORYLETS.includes(e.storylet)).map((e) => e.name), []);

check('the guide\'s certain-at: Watchful 200 to catalogue, Persuasive 300 to request help',
  [api.musCertainAt(row('Catalogue its morphology').ch), api.musCertainAt(row('Request help from a University colleague').ch)],
  [200, 300]);

check('the Toxicology Exhibit\'s 2.4 CP of Wounds is the page\'s odds worked out',
  (() => { const e = row('Have a taste of the Toxicology Exhibit');
    const x = e.expected;
    return [Math.round((e.luck * x.win + (1 - e.luck) * (x.lose[0] + x.lose[1]) / 2) * 10) / 10, x.value]; })(),
  [2.4, 2.4]);

check('the Neathoscope\'s guide figure of 1.57 CP of Nightmares',
  Math.round(row('Gaze into the Neathoscope').expected.value * 100) / 100, 1.57);

check('badges for each kind of row',
  ['Catalogue its morphology', 'Request help from a University colleague', 'Assert that the specimen is (first option)',
   'Identify the femur of a Jurassic beast', 'Complete a monograph on the subject', 'Provenance an artefact',
   'Donate a Third City Exhibit', 'Sell the Museum some of your surplus sphinxstone',
   'Enter an agreement for the production of steel', 'Have a taste of the Toxicology Exhibit', 'Gaze into the Neathoscope',
   'Enter the back rooms'].map((n) => api.musBadgeText(row(n))),
  ['Ident +4/+1?', 'Ident +6/+0?', '10% a level?', '→ 6500 ▼', 'Gratitude 6500/8750', 'random item? ▼',
   'Gratitude 300+Persuasive ▼', 'Gratitude +1250 ▼', '1000 → Steel ×20', '≈Wounds +2.4', '≈Nightmares +1.6',
   '→ Osteology Lab']);

check('the Assert titles name a taxon in the game, and match either way',
  ['Assert that the specimen is Saurischian', 'Assert that the creature is a Theropod',
   'Assert that the specimen is (first option)'].map((n) => {
    const e = api.carouselLookup(api.MUS_INDEX, n, key(api.MUS_LAB));
    return e && e.name;
  }),
  ['Assert that the specimen is (first option)', 'Assert that the creature is (second option)',
   'Assert that the specimen is (first option)']);

check('the cash-in ladder', api.MUS_OPTIONS.filter((e) => e.cost != null).map((e) => e.cost),
  [1000, 1000, 1250, 1450, 5200, 7600, 50000, 10000]);

check('the guide disagrees with the pages in one row', api.MUS_OPTIONS.filter((e) => e.guide).map((e) => e.name),
  ['Request help from a University colleague']);

check('a cash-in\'s tooltip prices the Gratitude',
  api.musSpec(row('Converse on the Correspondence')).title.includes('Costs 7600 Gratitude (about 76 Echoes)'), true);

check('the registered pass: the lab, then Gebrandt',
  (() => {
    const assert = makeHeading('Assert that the specimen is Theropod');
    const steel = makeHeading('Enter an agreement for the production of steel');
    branches = [assert, steel];
    const out = [];
    roots = [makeHeading('The Osteology Lab')];
    api.musRatings();
    out.push([text(roots[0], api.MUS_CLASS), text(assert, api.MUS_BRANCH_CLASS), text(steel, api.MUS_BRANCH_CLASS)]);
    roots = [makeHeading('Speak with Gebrandt, the Museum Curator')];
    api.musRatings();
    out.push([text(roots[0], api.MUS_CLASS), text(assert, api.MUS_BRANCH_CLASS), text(steel, api.MUS_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [['identify bones', '10% a level?', null], ['cash in Gratitude', null, '1000 → Steel ×20']]);

check('no Prelapsarian Museum name is in another feature\'s table',
  (() => { const others = otherNames('MUS_OPTIONS');
    return api.MUS_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'prelapsarian-museum'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
