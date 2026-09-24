// Ad-hoc test for FallenLondon/choice-helper.js's Hearts' Game badges
// ('hearts-game').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's class rules as a shape the actions
// must fall into -- every card has one basic action with no Prep need and at
// least one advanced one, a basic action that makes Progress always adds
// Counterplay -- that a formula never outranks a figure in the hand, the guide's
// reward table, and the one row filed under its wiki title because Hunting Bees
// owns the plain one.
//
// Numbers come from Hearts' Game (Guide) and the card, option and Rewards from
// the Page pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node tests/choice-hearts-game.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS', 'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS',
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS', 'BRAWL_OPTIONS', 'SKEL_OPTIONS',
  'PROF_OPTIONS', 'HG_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { HG_ACTIONS, HG_REWARDS, HG_CARDS, HG_STORYLETS, HG_HAND, HG_CLASS, HG_BRANCH_CLASS, hgRank, hgSpec, hgRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
    + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
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
  ].map(key).filter(Boolean);
}
function otherStorylets(own) {
  return TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.storylet)).map(key).filter(Boolean);
}
const acts = api.HG_ACTIONS;
const row = (name) => api.HG_OPTIONS.find((e) => e.name === name);

check('50 cards, each with a basic action needing no Prep',
  [api.HG_CARDS.length, api.HG_CARDS.filter((c) => !acts.some((e) => e.storylet === c && !e.prep)).length], [50, 0]);

check('every card with a challenge-free Progress line marks it Counterplay',
  acts.filter((e) => !e.prep && !e.ch && e.progress && /^[\d–]+(, or|$)/.test(e.progress) && !e.counterplay
    && e.tolerance !== 'none').map((e) => e.name), []);

check('a formula ranks as nothing in the hand',
  ['Scatter tiny caltrops', 'Make words your weapon', 'Gather an audience for the King', 'Bribe some servants']
    .map((n) => api.hgRank(row(n))[0]), [0, 0, 0, 10]);

check('the guide\'s Exploit costs',
  api.HG_REWARDS.map((e) => e.cost), [5, 11, 14, 18, '25–32', 65, 65, 65, 65, 80]);

check('badges', ['Poison the target’s hat', 'Run your target down in the street – carefully', 'Harangue your target throughout London',
  'Scatter tiny caltrops', 'A consignment of steel'].map((n) => api.hgSpec(row(n)).text),
['Prog +3, or 7 with Prep · Counterplay', 'Prog +7? · needs Prep 4', 'Prep +1', 'Prog +2 × Elusiveness? · needs Prep 5',
  '14 Exploits → Bessemer Steel Ingot ×100']);

check('a card in the hand, ▾ for the advanced line',
  [api.carouselHandSpec(api.HG_HAND, 'Two of Ribs: Pursuit').text, api.carouselHandSpec(api.HG_HAND, 'Seven of Knuckles: Details').text],
  ['Prep +1 ▾', 'Prog +4 · Counterplay']);

check('"Set an ambush" is answered inside its own card',
  (() => {
    const ambush = makeHeading('Set an ambush');
    branches = [ambush];
    roots = [makeHeading('Four of Inversions: Exposure')];
    api.hgRatings();
    const out = [text(roots[0], api.HG_CLASS), text(ambush, api.HG_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['accomplice card', 'Prog +5? · needs Prep 2']);

check('no Hearts\' Game option name is in another feature\'s table',
  (() => { const others = otherNames('HG_OPTIONS');
    return [...new Set(api.HG_OPTIONS.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Hearts\' Game card or storylet is another feature\'s',
  (() => { const others = otherStorylets('HG_OPTIONS');
    return api.HG_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'hearts-game'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
