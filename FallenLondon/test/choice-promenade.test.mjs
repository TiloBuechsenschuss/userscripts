// Ad-hoc test for FallenLondon/choice-helper.js's Polythremic Promenade badges
// ('promenade').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that each payout's Echoes per action is its value
// over the promenade's twelve actions, that a card which lowers the other
// quality says so, that the hand is ranked on both qualities together, and
// that the two exchanges write both halves of their 22-or-12 out.
//
// Numbers come from Polythremic Promenade (Guide) and the Polythreme Streets' card and storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-promenade.test.mjs

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
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { PP_OPTIONS, PP_STORYLETS, PP_CARDS, PP_INDEX, PP_HAND, PP_SPEND, PP_PAYING, PP_PROFIT, PP_CLASS, PP_BRANCH_CLASS, PP_CARD_CLASS, ppBadgeText, ppSpec, ppStoryletSpec, ppRank, ppRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.PP_OPTIONS;
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

// Every payout is cashed on the last of the promenade's twelve actions, so the
// guide's Echoes per action IS its value divided by twelve. Recomputing it
// catches a value or an EPA transcribed wrong, either of which would rank the
// endings against each other on a number nobody can act on.
check('every payout’s Echoes per action is its value over the promenade’s twelve actions',
  rows.filter((e) => e.value != null).map((e) => [e.name, Math.round((e.value / 12) * 100) / 100 === e.epa]),
  [['A Distressing Lack of Progress', true], ['The Voice in the Fog', true], ['There’s someone in there', true],
    ['What’s going on in the bay?', true], ['Speak to a matched pair', true], ['What’s going on here?', true],
    ['A walk in the villa gardens', true]]);

check('every row is a label, a payout or a change to the two qualities',
  rows.filter((e) => !e.label && e.tag == null && e.allure == null && e.cog == null).map((e) => e.name), []);

// The point of the feature: a card that raises one quality and lowers the
// other has to say both, or +12 reads as twice the progress it is.
check('every card option that lowers a quality says so on its badge',
  rows.filter((e) => api.PP_CARDS.includes(e.storylet) && (e.allure === -5 || e.cog === -5))
    .map((e) => /−5/.test(api.ppBadgeText(e))), [true, true, true, true]);

check('the hand is ranked on both qualities together, not on the bigger half',
  ['Attract attention at the market', 'Bid him a good morning', 'Speak of his spiritual work']
    .map((n) => api.ppRank(row(n))[0]), [7, 12, 15]);

check('badges for each shape of row',
  ['Attract attention at the market', 'Speak to the Clay priest of matters romantic', 'Give surface-silk to Clay Men',
    'There’s someone in there', 'So that’s who he is', 'Crouching in a low stone building',
    'Set forth into the stone-flagged street'].map((n) => api.ppBadgeText(row(n))),
  ['ALLURE +12 · COGNISANCE −5? fail ALLURE +5 · COGNISANCE −5',
    'Notion ×60 · ALLURE reset', 'ALLURE +20? fail ALLURE +10 ▼',
    'Permit ×2 + Snippet ×25 · 30 E', 'COGNISANCE +22 or +12 · ALLURE −10',
    'ALLURE +12? fail COGNISANCE +12', 'start · Exuberance 11']);

check('the one row the guide beats the page on is named, and says the guide is followed',
  rows.filter((e) => e.guide).map((e) => [e.name, /the guide is followed/.test(api.ppSpec(e).title)]),
  [['So that’s who he is', true]]);

// The two exchanges pay 22 or 12 by a check, so neither half is the figure;
// the badge writes the pair out and the tooltip says which is which.
check('the two exchanges write both halves out rather than picking one',
  ['So that’s who he is', 'Pull off a mask'].map((n) => [/ or /.test(api.ppBadgeText(row(n))),
    /on a success, \+12 on a failure/.test(api.ppSpec(row(n)).title)]), [[true, true], [true, true]]);

check('the Sartorial Cooperation checks say the odds climb with every failed promenade',
  /climbs 10% for every promenade you fail/.test(api.ppSpec(row('Speak of his spiritual work')).title), true);

check('the storylet outside the promenade says it costs no Exuberance',
  [api.ppStoryletSpec(key(api.PP_PROFIT)).text,
    /Costs no Unnatural Exuberance/.test(api.ppSpec(row('Lurk in the eaves')).title)],
  ['no Exuberance spent', true]);

check('the rules line carries the change points behind the thresholds',
  /36 change points for a level 8, 78 for 12 and 91 for 13/.test(api.ppSpec(row('The Voice in the Fog')).title), true);

check('the registered pass: a card in the hand, an opened card, its option and a payout',
  (() => {
    const inHand = makeHeading('The Masked Man');
    hand = [inHand];
    const open = makeHeading('At the Market', 'storylet-root__heading');
    const list = makeHeading(api.PP_SPEND, 'storylet__heading');
    heads = [list];
    roots = [open];
    const branch = makeHeading('Wander around the market');
    branches = [branch];
    api.ppRatings();
    const out = [text(inHand, api.PP_CARD_CLASS), text(open, api.PP_CLASS), text(list, api.PP_CLASS),
      text(branch, api.PP_BRANCH_CLASS)];
    hand = []; heads = []; roots = []; branches = [];
    return out;
  })(),
  ['ALLURE +6 · COGNISANCE +6?', 'promenade card', 'cash in ALLURE and COGNISANCE',
    'Silk ×25 · ALLURE −10']);

check('no Polythremic Promenade name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PP_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'promenade'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
