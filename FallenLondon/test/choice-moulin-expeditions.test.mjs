// Ad-hoc test for FallenLondon/choice-helper.js's Moulin Expeditions badges
// ('moulin-expeditions').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that EVERY obstacle option states its Supplies
// cost and that every obstacle has at least one two-Supply answer to unlock,
// the guide's whole strategy resting on never being forced into a three; that
// each assistant answers a different obstacle; and that the seven discardable
// cards carry NO option rows at all, because the guide never names their
// options and a title nobody has written down is not one to invent.
//
// Numbers come from Moulin Expeditions (Guide), its Tables subpage, Dig here! and Out of supplies... on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-moulin-expeditions.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS',
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS',
  'PB_OPTIONS', 'CH_OPTIONS', 'LH_OPTIONS', 'MX_OPTIONS', 'MG_OPTIONS', 'KA_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MX_OPTIONS, MX_INDEX, MX_OBSTACLES, MX_DISCARDS, MX_ASSISTANTS, MX_STORYLETS, MX_CLATTERWAUL, MX_RIVER, MX_LESSER, MX_CLASS, MX_BRANCH_CLASS, mxBadgeText, mxSpec, mxStoryletSpec, mxRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.MX_OPTIONS;
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

check('no Moulin name is in another feature\u2019s table',
  (() => {
    const others = otherNames('MX_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('six obstacles, and every one of their options costs Supplies',
  [api.MX_OBSTACLES.length,
    rows.filter((e) => api.MX_OBSTACLES.includes(e.storylet) && e.supplies == null).map((e) => e.name)],
  [6, []]);

check('every obstacle option costs two Supplies or three, and nothing else',
  [...new Set(rows.filter((e) => e.supplies != null).map((e) => e.supplies))].sort(), [2, 3]);

// The guide's strategy is that every obstacle must have a two-Supply answer.
// Four of the six have one only behind an assistant.
check('every obstacle has at least one two-Supply answer',
  api.MX_OBSTACLES.filter((o) =>
    !rows.some((e) => e.storylet === o && e.supplies === 2)), []);

// The discardables are badged on the heading alone: no option rows exist.
check('no option row belongs to a discardable card',
  rows.filter((e) => api.MX_DISCARDS.some((d) => d.card === e.storylet)).map((e) => e.name), []);

check('the seven discardables, each with a payout and a short tag',
  [api.MX_DISCARDS.length, api.MX_DISCARDS.filter((d) => !d.gives || !d.tag).map((d) => d.card)],
  [7, []]);

check('and their headings say so, with what the card pays',
  [api.mxStoryletSpec(key(api.MX_LESSER)).text,
    /options are not badged/.test(api.mxStoryletSpec(key(api.MX_LESSER)).title)],
  ['discardable · Claws ×50, or a Relic', true]);

check('the six assistants, each answering a different obstacle',
  api.MX_ASSISTANTS.map((a) => [a.who, a.obstacle, a.cut]),
  [['A Miniature Major-General', 'Movement?', 5], ['A Bandaged Navigator', 'A Clatterwaul', 5],
    ['A Rubbery Porter', 'A Snap-Gap', 7], ['A Renegade Claw', 'A Viric River', 8],
    ['Tabitha Murgatroyd', 'A Quandary', 7], ['The Silk-Clad Expert', 'A Viric River', 9]]);

check('badges for each shape of row',
  ['Identify a route through it', 'Ford the River', 'Go around (Clay Soil)', 'Strike the Earth']
    .map((n) => api.mxBadgeText(row(n))),
  ['−2 Supplies? · fail Nightmares +4 CP', '−3 Supplies · Altered +4 CP · Disgruntlement +3 CP',
    '−3 Supplies · no check', 'turn round · Distance × 10 Echoes']);

// Two obstacles have a "Go around" and two have a "Go through"; only the open
// storylet tells them apart.
check('the shared titles resolve by the card they are on',
  ['A Snap-Gap', 'Clay Soil'].map((s) => {
    const e = api.carouselLookup(api.MX_INDEX, 'Go around', key(s));
    return e && e.name;
  }), ['Go around (the Snap-Gap)', 'Go around (Clay Soil)']);

check('a three-Supply answer is called out as one in the tooltip',
  /never to be forced into one/.test(api.mxSpec(row('Ford the River')).title), true);

check('the registered pass: an obstacle heading and two of its options',
  (() => {
    const open = makeHeading(api.MX_CLATTERWAUL, 'storylet-root__heading');
    const plain = makeHeading('Identify a route through it');
    const helped = makeHeading('Rely on your Bandaged Navigator');
    roots = [open];
    branches = [plain, helped];
    api.mxRatings();
    const out = [text(open, api.MX_CLASS), text(plain, api.MX_BRANCH_CLASS), text(helped, api.MX_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['obstacle · 2 two-Supply answers', '−2 Supplies? · fail Nightmares +4 CP', '−2 Supplies · no check ▾']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'moulin-expeditions'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
