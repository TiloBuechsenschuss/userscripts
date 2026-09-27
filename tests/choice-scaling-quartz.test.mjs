// Ad-hoc test for FallenLondon/choice-helper.js's Scaling the Quartz badges
// ('scaling-quartz').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here: the badge shows the BASE success Fecundity
// marked `?` -- this script does not read the player's live Momentum/
// Flexibility/Static Charge (the only existing quality scrape in this file is
// a Myself-tab snapshot that can be arbitrarily stale, and these three reset
// every climb and change every action, so presenting it as live would be
// actively misleading) -- the tooltip says the real Grip cost and Fecundity
// scale with those qualities instead of inventing a number. "Accelerate" and
// "Stretch yourself beyond your limits" carry a growth mark and a tooltip
// sentence saying their value compounds over the rest of the climb. "An
// opportunity to rest" and "A moment of stillness" have no challenge and
// never receive a challenge mark. Gating tries all three guide-named
// storylet titles and degrades to no badge if none of them is the real one.
//
// Numbers come from Scaling the Quartz (Guide) on fallenlondon.wiki, spot-
// checked against the option page for "Haul yourself over a steep overhang"
// (exact match) -- see
// docs/superpowers/research/2026-09-27-late-firmament.md section 3.
//
//   node tests/choice-scaling-quartz.test.mjs

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
    'return { QUARTZ_ACTIONS, quartzSpec, scalingQuartzRatings, QUARTZ_CLASS, QUARTZ_BRANCH_CLASS,'
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
const row = (name) => api.QUARTZ_ACTIONS.find((e) => e.name === name);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };

check('11 actions total', api.QUARTZ_ACTIONS.length, 11);

check('spot-checked row matches the option page exactly (Dangerous 235 +25xFlexibility, '
    + 'Fecundity 575/400, Wounds +2 on failure only)',
  (() => { const e = row('Haul yourself over a steep overhang');
    return [e.ch.stat, e.ch.diff, e.succFec, e.failFec, e.failWounds, e.succWounds || null]; })(),
  ['Dangerous', 235, 575, 400, 2, null]);

check('the badge shows the BASE success value marked `?`, never a live-quality-dependent number',
  api.quartzSpec(row('Haul yourself over a steep overhang')).text, 'Fecundity x575?');

check('the tooltip says the real cost/gain scales with the player\'s own qualities, not a number this script reads',
  api.quartzSpec(row('Haul yourself over a steep overhang')).title.toLowerCase().includes('this script does not read'),
  true);

check('"Accelerate" and "Stretch yourself beyond your limits" carry a growth mark and the compounding-value note',
  ['Accelerate', 'Stretch yourself beyond your limits'].map((n) => {
    const s = api.quartzSpec(row(n));
    return [s.text.includes('▲'), s.title.toLowerCase().includes('compounds')];
  }),
  [[true, true], [true, true]]);

check('"Follow the mist" gains Static Charge on BOTH outcomes and its Wounds differ 2 vs 3, not the usual 0-vs-2 shape',
  (() => { const e = row('Follow the mist'); return [e.succWounds, e.failWounds, /static charge/i.test(e.growth || '')]; })(),
  [2, 3, true]);

check('"An opportunity to rest" and "A moment of stillness" have no challenge and never get a challenge mark',
  ['An opportunity to rest', 'A moment of stillness'].map((n) => {
    const e = row(n);
    return [e.ch || null, api.quartzSpec(e).text.includes('?')];
  }),
  [[null, false], [null, false]]);

check('modifiers that SUBTRACT are carried with their sign, not assumed additive',
  row('Grab hold of something').ch.mod, '+25xFlexibility-20xMomentum');

check('wiring: badges only appear under one of the three guide-named storylet titles',
  (() => {
    const haul = makeHeading('Haul yourself over a steep overhang');
    branches = [haul];
    const out = [];
    roots = [makeHeading('The Heights of the Gift')];
    api.scalingQuartzRatings();
    out.push(text(haul, api.QUARTZ_BRANCH_CLASS));
    roots = [makeHeading('Some Unrelated Storylet')];
    api.scalingQuartzRatings();
    out.push(text(haul, api.QUARTZ_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Fecundity x575?', null]);

check('against a page with none of the three guessed headings, nothing is attached and nothing throws',
  (() => {
    roots = [makeHeading('Totally Unrelated')];
    branches = [makeHeading('Haul yourself over a steep overhang')];
    let threw = false;
    try { api.scalingQuartzRatings(); } catch (e) { threw = true; }
    roots = []; branches = [];
    return threw;
  })(), false);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'scaling-quartz'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
