// Ad-hoc test for FallenLondon/choice-helper.js's The Chessboard badges
// ('chessboard').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the score on every badge is what the guide's
// own score table says, recomputed from the two columns rather than stored; that
// a move touching Strategic Weaknesses says so, since two endings are gated on
// Weaknesses and not on score; that the three moves costing an action but no
// move are marked; and that the colours carry the opening each of them buys.
//
// Numbers come from The Chessboard (Guide) and the Chessboard's storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-chessboard.test.mjs

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
let heads = [];
let branches = [];
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return heads.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
    return [];
  },
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS',
  'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS',
  'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS',
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS',
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS',
  'PW_OPTIONS', 'CE_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CB_OPTIONS, CB_STORYLETS, CB_INDEX, CB_NEW, CB_MIDDLE, CB_END, CB_WINDOWS, CB_CLASS, CB_BRANCH_CLASS, cbScore, cbBadgeText, cbSpec, cbStoryletSpec, cbRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, '
    + TABLES.join(', ') + ' }; })();');
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
const rows = api.CB_OPTIONS;
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
  ].map(key).filter(Boolean);
}

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k) || !key(n)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

// The score is the whole game, and it is DERIVED: Advantages minus Weaknesses,
// never stored. The guide's "Can I Still Win?" table is written in score, so
// these six rows are the cross-check between the two halves of the guide -- if
// a move's columns are ever transcribed wrong, this is where it shows.
check('the guide’s score table, recomputed from the two columns',
  ['Take advantage of your Intelligence', 'Play a move you learned from the Boatman', 'Play aggressively',
    'Turn one of their spies', 'Kill another of your kind, in passing', 'Make a move you know will work',
    'Play defensively', 'Use your people however proves necessary', 'Sabotage your side (Black)',
    'Sabotage your side (White)'].map((n) => api.cbScore(row(n))),
  [7, 5, 3, 3, 3, 1, 1, -1, -3, -3]);

check('every row is a label or carries both columns',
  rows.filter((e) => !e.label && e.adv == null && e.weak == null).map((e) => e.name), []);

check('badges for each shape of row',
  ['Play aggressively', 'Play defensively', 'Sabotage your side (White)', 'Take advantage of your Intelligence',
    'Recognise an opening', 'Choose a queen mate', 'Play as white'].map((n) => api.cbBadgeText(row(n))),
  ['Score +3?', 'Score +1? · Weak −1', 'Score −3 · Weak +3', 'Score +7 ▼',
    'Score 0 · no move ▼', 'Queen Mate + Pawns', 'colour · opens +3']);

// Weaknesses are not decoration: two endings are gated on them rather than on
// score, so a move that adds them has to say so even when the score already does.
check('a move that moves Weaknesses says so on the badge',
  rows.filter((e) => e.weak).map((e) => [e.name, /Weak [+−]/.test(api.cbBadgeText(e))]),
  [['Follow the movements of the pieces', true], ['Play defensively', true],
    ['Use your people however proves necessary', true], ['Sabotage your side (Black)', true],
    ['Sabotage your side (White)', true]]);

// Three moves cost an action and no move at all; mixing them up with the rest
// is how a player runs out of middle game with a plan half-finished.
check('the moves that do not advance the board are marked "no move"',
  rows.filter((e) => /no move/.test(api.cbBadgeText(e))).map((e) => e.name),
  ['Recognise an opening', 'Recognise an opening because of your professional affiliations',
    'Search for a sign of your enemy', 'Contemplate a losing position', 'Contemplate a perfectly equal position',
    'Contemplate a winning position']);

check('the three colours carry the opening each of them buys',
  ['Play as red', 'Play as white', 'Play as black'].map((n) => api.cbBadgeText(row(n))),
  ['colour · opens +1', 'colour · opens +3', 'colour · opens +0']);

// The two Studies endings are why a deliberate loss is worth playing, and each
// is gated on a number the badge must not soften.
check('the two A Player’s Studies endings keep their thresholds',
  ['Recognise new possibilities in the depth of your loss', 'Recognise new possibilities in the height of your win']
    .map((n) => row(n).needs),
  ['Strategic Weaknesses 7, and no A Player’s Studies',
    'Positional Advantages 23, Weaknesses under 7, and A Player’s Studies 1']);

check('every faction result is on the badge, after it',
  rows.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name, api.cbBadgeText(e).endsWith(' · ' + api.factionText(e.factions))]),
  [['Betray! Destroy! Take white down from the inside!', true],
    ['Betray! Destroy! Take black down from the inside!', true]]);

check('a heading says which part of the match it is',
  [api.CB_NEW, api.CB_MIDDLE, api.CB_END].map((s) => api.cbStoryletSpec(key(s)).text),
  ['Progress 1–2 · two moves', 'Progress 3–7 · five moves', 'Progress 8 · the result']);

check('the registered pass: a heading and a move under its open storylet',
  (() => {
    const list = makeHeading(api.CB_END, 'storylet__heading');
    const open = makeHeading(api.CB_MIDDLE, 'storylet-root__heading');
    const branch = makeHeading('Play defensively');
    const elsewhere = makeHeading('Choose a queen mate');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.cbRatings();
    const out = [text(list, api.CB_CLASS), text(open, api.CB_CLASS), text(branch, api.CB_BRANCH_CLASS),
      text(elsewhere, api.CB_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['Progress 8 · the result', 'Progress 3–7 · five moves', 'Score +1? · Weak −1', null]);

check('no The Chessboard name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CB_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'chessboard'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
