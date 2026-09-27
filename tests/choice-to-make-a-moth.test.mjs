// Ad-hoc test for FallenLondon/choice-helper.js's To Make a Moth badges
// ('to-make-a-moth').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here, above everything else: `risen-burgundy`
// (RBG_OPTIONS) ALREADY badges nine storylets' branches as this same guide's
// menace-farming prerequisite ("A Gloomy Summer", "A Duchess' Disapproval",
// "A Disturbance at the Market", "A Night in Ghent", "A Stranger Out of
// Time", "Echoes of Storms Past", "The Honours of the Court", "Glories and
// Half-Lives", "Heralds from Elsewhere"). This feature must contain NONE of
// those names or their branch text -- a name in two tables is exactly the
// bug the skill's own collision rule exists to catch, and here it would also
// silently double-badge nine storylets that already work correctly. Also
// pinned: tier 14 and tier 20's tooltips spell out that their two options
// spend NON-comparable currencies (never reduced to one number), and gating
// is to the "To Make a Moth" storylet heading only.
//
// Numbers come from To Make a Moth (Guide) and the storylet's own wiki page,
// fetched through the API on 2026-09-27 (see
// docs/superpowers/research/2026-09-27-late-firmament.md section 2).
//
//   node tests/choice-to-make-a-moth.test.mjs

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
    'return { MOTH_STEPS, mothSpec, toMakeAMothRatings, MOTH_CLASS, MOTH_BRANCH_CLASS,'
    + ' RBG_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const row = (name) => api.MOTH_STEPS.find((e) => e.name === name);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };

const EXCLUDED_STORYLETS = ['A Gloomy Summer', 'A Duchess’ Disapproval', 'A Disturbance at the Market',
  'A Night in Ghent', 'A Stranger Out of Time', 'Echoes of Storms Past', 'The Honours of the Court',
  'Glories and Half-Lives', 'Heralds from Elsewhere'];

check('the 9 excluded storylets are actually in risen-burgundy\'s own table (sanity on the exclusion list)',
  EXCLUDED_STORYLETS.every((s) => api.RBG_OPTIONS.some((e) => e.storylet === s)), true);

check('14 steps, all filed under "To Make a Moth" alone',
  [api.MOTH_STEPS.length, api.MOTH_STEPS.every((e) => e.storylet === 'To Make a Moth')], [14, true]);

check('NONE of the 9 risen-burgundy storylets or their option text appear in MOTH_STEPS',
  (() => {
    const rbgNames = api.RBG_OPTIONS.filter((e) => EXCLUDED_STORYLETS.includes(e.storylet)).map((e) => e.name).map(key);
    return api.MOTH_STEPS.map((e) => e.name).filter((n) => rbgNames.includes(key(n)));
  })(), []);

check('tier 14\'s two options each spell out that they are NOT comparable by value',
  ['Create a ducal dye', 'Extract a rebellious dye'].every((n) => api.mothSpec(row(n)).title.includes('NOT comparable')), true);

check('tier 20\'s two options each spell out the non-comparable currencies',
  ['Offer a body that is you and is not', 'Offer a substitute body, and the promise of your transformation']
    .every((n) => api.mothSpec(row(n)).title.includes('NON-comparable currencies')), true);

check('every step names its Stuiver cost and what it gives',
  row('Make dye from your aches and pains').stuiver === 1250 && row('Make dye from your aches and pains').gives === 'Silk Scrap x3000',
  true);

check('wiring: badges only appear while "To Make a Moth" is the open storylet',
  (() => {
    const dye = makeHeading('Make dye from your aches and pains');
    const gloomy = makeHeading('Convince her of the harmlessness of the cause'); // an EXCLUDED (risen-burgundy) branch text
    branches = [dye, gloomy];
    const out = [];
    roots = [makeHeading('To Make a Moth')];
    api.toMakeAMothRatings();
    out.push([text(dye, api.MOTH_BRANCH_CLASS), text(gloomy, api.MOTH_BRANCH_CLASS)]);
    roots = [makeHeading('A Gloomy Summer')];
    api.toMakeAMothRatings();
    out.push([text(dye, api.MOTH_BRANCH_CLASS), text(gloomy, api.MOTH_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [[dyeBadgeText(), null], [null, null]]);

function dyeBadgeText() {
  return api.mothSpec(row('Make dye from your aches and pains')).text;
}

check('the feature is registered', api.FEATURES.some((f) => f.name === 'to-make-a-moth'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
