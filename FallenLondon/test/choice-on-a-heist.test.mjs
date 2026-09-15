// Ad-hoc test for FallenLondon/choice-helper.js's On a Heist badges
// ('on-a-heist').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the expected Progress and Tread of every kind of
// row, the hand's Tread-first ranking and its ▾, the prizes' guide values, the
// guide disagreements, titles shared by two cards resolving by the open one,
// and the hand badge end to end.
//
// Numbers come from On a Heist (Guide), its /Cards subpage and the card and
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-on-a-heist.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

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

function makeHeading(text, className) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.className = className || '';
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let branches = [];
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
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
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { HEIST_STORYLETS, HEIST_CARDS, HEIST_INDEX, HEIST_HAND, HEIST_PRIZE, HEIST_CLASS, HEIST_BRANCH_CLASS,'
    + ' HEIST_CARD_CLASS, heistEv, heistRank, heistBadgeText, heistColor, heistSpec, heistStoryletSpec, heistRatings,'
    + ' carouselHandSpec, carouselLookup, CAROUSEL_COLOR_RISK, CAROUSEL_COLOR_PROGRESS, ' + TABLES.join(', ')
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
const rows = api.HEIST_OPTIONS;
const row = (name, storylet) => rows.find((e) => e.name === name && (!storylet || e.storylet === storylet));
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

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('every row says something on its badge', rows.filter((e) => !api.heistBadgeText(e)).map((e) => e.name), []);

check('every heist card from the guide\'s table is here',
  ['Winding Stairs', 'A Burly Night-Watchman', 'A Promising Door', 'A Clean Well-Lighted Place', 'A Talkative Cat',
   'A Nosy Caretaker', 'A Weeping Maid', 'Look up...', 'A Handy Window!', 'A Sheer Climb', 'Through the Shadows',
   'Through Deeper Shadows', 'An Alarming Bust', 'A Menacing Corridor', 'A Moment of Safety', 'Consider the Lights',
   'Tiny Rivals', 'The Rats in the Walls', 'A clutter of bric-a-brac', 'Mislaid Documents', 'A Troublesome Lock',
   'An Intricate Lock', 'Sleeping Dogs', 'Sleeping... Dogs?'].filter((c) => !api.HEIST_CARDS.includes(c)), []);

// --- expectations and badges -----------------------------------------------

check('badges for each kind of row',
  [['Upstairs. That’s probably right'], ['Chance it'], ['Pass through the study'], ['Dash past', 'Look up...'],
   ['Move slowly past'], ['Get out of my way'], ['Go through'], ['Forward planning'], ['Hide for a little while'],
   ['...Mr Leadbeater’s Fortune'], ['Speak to her']].map(([n, s]) => api.heistBadgeText(row(n, s))),
  ['≈Prog +1.4', '≈Prog +1 Tread −1', '≈Prog +0.8 Tread −0.2', '≈Prog +0.2 Tread −1', '≈Prog −0.7 Tread −0.7',
   'Prog +1? fail Tread −1', 'Prog +1 Tread −1', 'Prog +2 ▼', 'Tread +1', 'Glim ×1650 · 16.5', 'Drownies · risk']);

check('a line that can lose Tread is brick, a safe one teal',
  [api.heistColor(row('Chance it')), api.heistColor(row('Forward planning'))], [api.CAROUSEL_COLOR_RISK, api.CAROUSEL_COLOR_PROGRESS]);

check('and the badge text says which, without the colour',
  [/Tread −/.test(api.heistBadgeText(row('Chance it'))), /Tread −/.test(api.heistBadgeText(row('Forward planning')))], [true, false]);

// --- the hand --------------------------------------------------------------

check('a card in the hand: the best free line, Tread first, and ▾ when a gated one beats it',
  ['A Burly Night-Watchman', 'A Promising Door', 'Tiny Rivals', 'A Troublesome Lock', HEIST_PRIZE_NAME()]
    .map((s) => { const spec = api.carouselHandSpec(api.HEIST_HAND, s); return spec && spec.text; }),
  ['Prog −1 ▾', '≈Prog +1 Tread −1 ▾', 'Prog +1', '≈Prog +0.6 ▾', null]);
function HEIST_PRIZE_NAME() { return api.HEIST_PRIZE; }

check('the hand tooltip names the better line and what it needs',
  api.carouselHandSpec(api.HEIST_HAND, 'A Promising Door').title.includes('Forward planning (Inside Information)'), true);

// --- prizes and disagreements ----------------------------------------------

check('the guide\'s Echo value of every prize',
  rows.filter((e) => e.prize).map((e) => e.prize.worth),
  [16.5, 22.1, 27, 20, 2, 25.55, 0, 33.5, 23, 37.5, 25, 102.5, 102.5, 102.5, 102.5]);

check('the guide disagrees with the pages in the three narrow checks',
  rows.filter((e) => e.guide).map((e) => [e.name, e.ch.diff + 4]),
  [['Get out of my way', 9], ['Pick the lock in Parabola', 11], ['Creep past them', 11]]);

check('a title on two cards resolves by the open one',
  [['Dash past', 'Look up...'], ['Dash past', 'Sleeping Dogs'], ['Escape!', 'A Sheer Climb'], ['Play it safe 2', 'A clutter of bric-a-brac']]
    .map(([n, s]) => { const e = api.carouselLookup(api.HEIST_INDEX, n, key(s)); return e && api.heistBadgeText(e); }),
  ['≈Prog +0.2 Tread −1', '≈Prog +0.4 Tread −1', 'escape', 'Prog +1']);

// --- the registered pass ---------------------------------------------------

check('the hand, the opened card and its option',
  (() => {
    const inHand = makeHeading('A Promising Door');
    hand = [inHand];
    roots = [makeHeading('A Promising Door', 'storylet-root__heading')];
    const chance = makeHeading('Chance it');
    branches = [chance];
    api.heistRatings();
    const out = [text(inHand, api.HEIST_CARD_CLASS), text(roots[0], api.HEIST_CLASS), text(roots[0], api.HEIST_CARD_CLASS),
      text(chance, api.HEIST_BRANCH_CLASS)];
    hand = []; roots = []; branches = [];
    return out;
  })(),
  ['≈Prog +1 Tread −1 ▾', 'heist card', null, '≈Prog +1 Tread −1']);

check('no heist name is in another feature\'s table',
  (() => { const others = otherNames('HEIST_OPTIONS');
    return rows.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'on-a-heist'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
