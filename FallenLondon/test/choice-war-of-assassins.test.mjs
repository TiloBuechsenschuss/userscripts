// Ad-hoc test for FallenLondon/choice-helper.js's Fighting a War of Assassins
// badges ('war-of-assassins').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's action count -- 11 actions a round,
// 34 for the prize -- which only comes out of the CP arithmetic if every round
// option makes 1 CP; The Picnic at its expected value; one prize per enemy,
// with the guide's Echoes; and that a badge is only drawn in its own storylet.
//
// Numbers come from Fighting a War of Assassins (Guide) and the storylet and
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-war-of-assassins.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { WOA_STORYLETS, WOA_CLASS, WOA_BRANCH_CLASS, woaSpec, woaStoryletSpec, woaRatings, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.WOA_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);

// Level 4 is 1 + 2 + 3 + 4 = 10 CP at 1 CP an action, plus the Tension option;
// Tension 2 is 3 CP, plus one action for the prize.
check('11 actions a round and 34 for the prize, as the guide says',
  (() => {
    const perAction = Math.max(...rows.filter((e) => e.win && e.ch).map((e) => e.win[0][1]));
    const round = 10 / perAction + 1;
    return [round, round * 3 + 1];
  })(), [11, 34]);

check('every War 4 option trades the War for Tension +1 CP, with a Wounds or Nightmares failure',
  rows.filter((e) => e.label === 'Tension +1 CP?').map((e) => /^(Wounds|Nightmares) \+2 CP/.test(e.failGives)),
  [true, true, true, true, true, true, true]);

check('four enemies, four prizes, and the guide\'s Echoes on each',
  [rows.filter((e) => e.storylet === 'Choose an enemy!').length,
    rows.filter((e) => e.storylet === 'The Treasures of War' && e.pays).map((e) => e.pays.worth)],
  [4, [40, 61, 40, '12/42']]);

check('The Picnic is quoted at its expected value',
  [api.woaSpec(row('Libate your dusty throat')).text,
    api.woaSpec(row('Libate your dusty throat')).title.includes('Expected: Fighting a War of Assassins +0.5 CP.')],
  ['≈War +0.5 CP', true]);

check('badges', ['Who’s there?', 'Negotiate with the urchin gangs', 'Man-traps and spring guns', 'Settling out of court',
  'A Rival of Letters', 'Choose an Opponent'].map((n) => api.woaSpec(row(n)).text),
['War +1 CP?', 'War +1 CP?', 'Tension +1 CP?', 'Research ×16 · 40 ▼', 'free · → Collated Research', 'wastes an action']);

check('storylet headings say the level',
  ['A Noose', 'The Picnic', 'A Long Drop', 'The Treasures of War'].map((s) => api.woaStoryletSpec(key(s)).text),
  ['War 0–2', 'War 3', 'War 4 → Tension', 'Tension 2 · the prize']);

check('the registered pass',
  (() => {
    const option = makeHeading('Who’s there?');
    branches = [option];
    roots = [makeHeading('A Noose')];
    api.woaRatings();
    const out = [text(roots[0], api.WOA_CLASS), text(option, api.WOA_BRANCH_CLASS)];
    roots = [makeHeading('A Moment of Respite')];
    api.woaRatings();
    out.push(text(option, api.WOA_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['War 0–2', 'War +1 CP?', null]);

check('no War of Assassins option name is in another feature\'s table',
  (() => { const others = otherNames('WOA_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no War of Assassins storylet is another feature\'s',
  (() => { const others = otherStorylets('WOA_OPTIONS');
    return api.WOA_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'war-of-assassins'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
