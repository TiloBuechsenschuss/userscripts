// Ad-hoc test for FallenLondon/choice-helper.js's Canal Cruising badges
// ('canal-cruising').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every way of buying Esteem says what it
// costs, since an Esteem source with no price would badge as free; that the
// fares are the option pages' 5 and 10, and 3 and 6 for a Doctore, which is
// the 40% discount the guide is built around; that the five places carry both
// their reward and its value; and that *Leave the barge* is ONE row, because
// the game shows one of its six titles and six rows under one storylet would
// cancel each other out.
//
// Numbers come from Canal Cruising in Jericho Locks (Guide), its storylets and the barge and report option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-canal-cruising.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS',
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CC_OPTIONS, CC_INDEX, CC_PLACES, CC_STORYLETS, CC_ESTEEM_ECHOES, CC_CANALS, CC_TRIBUTARIES, CC_POLEMAN, CC_HANDS, CC_CLASS, CC_BRANCH_CLASS, ccBadgeText, ccSpec, ccStoryletSpec, ccRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CC_OPTIONS;
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

// Every table in the file is keyed on storylet PLUS title, and `carouselLookup`
// refuses to answer when two rows of one storylet match -- so a repeated key
// here is an option that would go unbadged.
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

check('no Canal Cruising name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CC_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the five places, their river and what they are worth',
  api.CC_PLACES.map((p) => [p.place, p.river, p.echoes]),
  [['The Fiddler’s Scarlet', 'lower', 48.26], ['The Persephone', 'lower', 50],
    ['The Cedar-Woods', 'upper', 107.5], ['The Eversmoulder', 'upper', 102.89],
    ['The Octagonal Tomb', 'upper', 95.25]]);

check('every place says what it pays',
  api.CC_PLACES.filter((p) => !p.pays).map((p) => p.place), []);

// An Esteem source with no price on it would read as free, which none of them
// is: each costs items, or five Docks Favours.
check('every way of buying Esteem states its price',
  rows.filter((e) => e.esteem != null).map((e) => [e.name, !!(e.uses || e.factions)]),
  [['Debate with the Nostalgic Landlady', true], ['Engage in a public debate', true],
    ['Swap tales with the locals', true], ['Furnish the Saturnine Gondolier with intelligence', true],
    ['Provide news from London', true], ['Watch a parade', true]]);

// The faction result is on the badge, never in the tooltip alone.
check('the Docks Favours are on the end of their badge',
  api.ccBadgeText(row('Watch a parade')), 'Esteem +2 · Favours: The Docks −5');

check('the fares, and the Doctore’s discount',
  rows.filter((e) => e.fare != null).map((e) => [e.name, e.fare, e.doctore || null, e.river]),
  [['Take a barge to the lower rivers', 5, 3, 'lower'], ['Take a barge to the upper rivers', 10, 6, 'upper'],
    ['Charter a barge to the Fiddler’s Scarlet', 3, null, 'lower'],
    ['Charter a barge to the Persephone', 3, null, 'lower'],
    ['Charter a barge to the Eversmoulder', 6, null, 'upper'],
    ['Charter a barge to the Octagonal Tomb', 6, null, 'upper'],
    ['Charter a barge to the Cedarwood', 6, null, 'upper']]);

// Six wiki pages, one title in game: only the destination the barge took you
// to is on the screen.
check('Leave the barge is one row, and its tooltip names all five places',
  (() => {
    const payout = rows.filter((e) => e.payout);
    const title = api.ccSpec(payout[0]).title;
    return [payout.length, api.CC_PLACES.every((p) => title.includes(p.place))];
  })(), [1, true]);

check('the six reports are what make a Doctore',
  [rows.filter((e) => e.member != null).length,
    rows.filter((e) => e.member != null).every((e) => e.storylet === api.CC_POLEMAN)],
  [6, true]);

check('badges for each shape of row',
  ['Engage in a public debate', 'Take a barge to the upper rivers', 'Charter a barge to the Persephone',
    'Leave the barge', 'Give him a report on the Persephone'].map((n) => api.ccBadgeText(row(n))),
  ['Esteem +2 ▼', '−10/6 Esteem · upper river', '−3 Esteem · lower river ▾',
    'the payout · 48.26–107.5 Echoes', 'Gondoliers +1']);

check('the headings',
  api.CC_STORYLETS.map((s) => api.ccStoryletSpec(key(s)).text),
  ['2 ways to buy Esteem', '3 ways to buy Esteem', '1 way to buy Esteem', 'fares from 3 to 10 Esteem',
    'where the barge stopped', '6 reports make a Doctore']);

check('the registered pass: the canals heading, a fare and an Esteem source',
  (() => {
    const open = makeHeading(api.CC_CANALS, 'storylet-root__heading');
    const fare = makeHeading('Take a barge to the lower rivers');
    const elsewhere = makeHeading('Engage in a public debate');
    roots = [open];
    branches = [fare, elsewhere];
    api.ccRatings();
    const out = [text(open, api.CC_CLASS), text(fare, api.CC_BRANCH_CLASS),
      text(elsewhere, api.CC_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['fares from 3 to 10 Esteem', '−5/3 Esteem · lower river', null]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'canal-cruising'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
