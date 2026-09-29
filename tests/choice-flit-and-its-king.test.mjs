// Ad-hoc test for FallenLondon/choice-helper.js's The Flit and its King badges
// ('flit-and-its-king').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 8 rows across the two layers (3 Airs-window redirects in "The Flit
// and its King", 5 Shadowy leaf actions in the storylets they open); "Hell for leather" states its
// move to Watchmaker's Hill and "Go for a run!" its move to Spite as real side effects; the
// redirect "Race across the Flit" and the storylet "Race Across the Flit" are the same
// normalised name, and the badges resolve in either capitalisation without clashing; the rare
// success on "Taking messages" is stated; no collision.
//
// Numbers come from The Flit and its King, its three sub-storylets and their option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-28 -- see
// docs/superpowers/research/2026-09-27-airs-of-london-group-d.md section H1 and this plan's own
// Task 22 (the Race Across the Flit rows).
//
//   node tests/choice-flit-and-its-king.test.mjs

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
    'return { FLIT_AND_ITS_KING_OPTIONS, flitAndItsKingSpec, flitAndItsKingRatings, FLIT_AND_ITS_KING_CLASS, FLIT_AND_ITS_KING_BRANCH_CLASS,'
    + ' SHIFTING_STREETS_OPTIONS, CLATHERMONT_OPTIONS, DIVORCE_OPTIONS, HALLOWMAS_OPTIONS, CANDLEFINDER_CLAY_MEN_OPTIONS, CHW_OPTIONS, ON_THE_TRAIL_OPTIONS, WATCHMAKERS_HILL_AIRS_OPTIONS, OPPORTUNITY_FOR_PROFIT_OPTIONS, ALLEYS_OF_SPITE_OPTIONS, CLAY_QUARTERS_OPTIONS, UNIVERSITY_CREATURE_OPTIONS,'
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
const row = (name) => api.FLIT_AND_ITS_KING_OPTIONS.find((e) => e.name === name);
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
    ...api.DIVORCE_OPTIONS.map((e) => e.name), ...api.HALLOWMAS_OPTIONS.map((e) => e.name), ...api.CLATHERMONT_OPTIONS.map((e) => e.name), ...api.SHIFTING_STREETS_OPTIONS.map((e) => e.name), ...api.CANDLEFINDER_CLAY_MEN_OPTIONS.map((e) => e.name), ...api.CHW_OPTIONS.map((e) => e.name), ...api.ON_THE_TRAIL_OPTIONS.map((e) => e.name), ...api.WATCHMAKERS_HILL_AIRS_OPTIONS.map((e) => e.name), ...api.OPPORTUNITY_FOR_PROFIT_OPTIONS.map((e) => e.name), ...api.ALLEYS_OF_SPITE_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

const OPTS = api.FLIT_AND_ITS_KING_OPTIONS;
const leaf = OPTS.filter((e) => e.ch);
const redirects = OPTS.filter((e) => !e.ch);

check('8 rows: 3 redirects and 5 leaf actions', [redirects.length, leaf.length], [3, 5]);

check('the redirects carry their Airs windows',
  redirects.map((e) => [e.name, e.airs]),
  [['Getting to know the Flit', [0, 33]], ['Courier for Revolutionaries', [34, 66]], ['Race across the Flit', [67, 100]]]);

check('the five leaf actions: Shadowy difficulty and reward',
  leaf.map((e) => [e.name, e.ch.diff, e.reward]),
  [['Go for a wander', 61, 'Whispered Hint ×61'], ['Go for a run!', 64, 'Whispered Hint ×64'],
    ['Taking messages', 66, 'Proscribed Material ×17'], ['Spire runners – to the guttering!', 69, 'Moon-Pearl ×69'],
    ['Hell for leather', 72, 'Drop of Prisoner\'s Honey ×36']]);

check('"Hell for leather" states the move to Watchmaker\'s Hill and "Go for a run!" the move to Spite',
  [api.flitAndItsKingSpec(leaf[4]).title.includes('Watchmaker\'s Hill'), api.flitAndItsKingSpec(leaf[1]).title.includes('Spite')],
  [true, true]);

check('the rare successes are stated: Hell for leather\'s Absinthe and Taking messages\' Fistful',
  [api.flitAndItsKingSpec(leaf[4]).title.includes('Strangling Willow Absinthe'), api.flitAndItsKingSpec(leaf[2]).title.includes('Fistful of Surface Currency')],
  [true, true]);

check('the leaf badges show the reward with a challenge mark; the redirects state their window in words',
  [api.flitAndItsKingSpec(leaf[0]).text, api.flitAndItsKingSpec(redirects[2]).text],
  ['Hint ×61?', 'Airs 67-100']);

check('"Race across the Flit" and "Race Across the Flit" are one normalised name; both gate the leaf rows',
  (() => {
    const out = [];
    ['Race across the Flit', 'Race Across the Flit'].forEach((title) => {
      const head = makeHeading('Hell for leather');
      branches = [head];
      roots = [makeHeading(title)];
      api.flitAndItsKingRatings();
      out.push(text(head, api.FLIT_AND_ITS_KING_BRANCH_CLASS) !== null);
    });
    roots = []; branches = [];
    return out;
  })(),
  [true, true]);

check('wiring: the redirect row badges inside "The Flit and its King", the leaf rows only inside their own storylet',
  (() => {
    const red = makeHeading('Getting to know the Flit');
    const wander = makeHeading('Go for a wander');
    branches = [red, wander];
    const out = [];
    roots = [makeHeading('The Flit and its King')];
    api.flitAndItsKingRatings();
    out.push([text(red, api.FLIT_AND_ITS_KING_BRANCH_CLASS) !== null, text(wander, api.FLIT_AND_ITS_KING_BRANCH_CLASS) !== null]);
    roots = [makeHeading('Some Other Storylet')];
    api.flitAndItsKingRatings();
    out.push([text(red, api.FLIT_AND_ITS_KING_BRANCH_CLASS) !== null, text(wander, api.FLIT_AND_ITS_KING_BRANCH_CLASS) !== null]);
    roots = []; branches = [];
    return out;
  })(),
  [[true, false], [false, false]]);

check('no name here is in another feature\'s table',
  (() => { const others = allNames();
    return OPTS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'flit-and-its-king'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
