// Ad-hoc test for FallenLondon/choice-helper.js's Port Cecil badges
// ('port-cecil').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that High Tide is three options a side at one flat
// +3 CP, so the goods and the guide's three tiers are all that separate them;
// that no Low Tide badge turns "+1 + Preparations" into a number nothing on
// screen reports; and that the four Perigee endings are labelled by the standing
// they need rather than ranked, since they all pay alike.
//
// Numbers come from Port Cecil (Guide) and the town's storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-port-cecil.test.mjs

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
    'return { PC2_OPTIONS, PC2_STORYLETS, PC2_INDEX, PC2_HIGH, PC2_LOW, PC2_PERIGEE, PC2_WINDOWS, PC2_CLASS, PC2_BRANCH_CLASS, pc2BadgeText, pc2Spec, pc2StoryletSpec, pc2Ratings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.PC2_OPTIONS;
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

// High Tide is six actions and three options a side, each worth the same +3 CP
// to its faction whatever happens -- so the only thing that separates them is
// the goods, and the guide's three tiers are what the badge prices.
check('High Tide is three options a side, all +3 CP, priced at the guide’s three tiers',
  (() => {
    const own = rows.filter((e) => e.storylet === api.PC2_HIGH);
    return [own.filter((e) => e.side === 'Cats').length, own.filter((e) => e.side === 'Miners').length,
      own.every((e) => e.prep === 3), own.map((e) => e.worth).sort((a, b) => a - b)];
  })(), [3, 3, true, [2, 2, 3, 3, 3.2, 3.2]]);

check('every Low Tide option says which side it pushes, as a formula rather than a number',
  rows.filter((e) => e.storylet === api.PC2_LOW && !e.label).map((e) => [e.name, !!e.scaled]),
  [['Distract the lamp-cats with local wildlife', true], ['Deploy advanced cat-wrangling tactics', true],
    ['Bring the scintillack miners some ‘refreshments’', true], ['Prey on the miners’ health concerns', true],
    ['Convince the miners and lamp-cats of their commonality', true], ['Liberate some raw scintillack', true]]);

// Nothing on screen reports your Receptivity or Preparations, so the badge must
// not turn "+1 + Preparations" into a number.
check('no Low Tide badge claims a total it cannot know',
  [rows.filter((e) => e.scaled).every((e) => /Prep|Recep|theirs/.test(api.pc2BadgeText(e))),
    /not on any page this script can read/.test(api.pc2Spec(row('Distract the lamp-cats with local wildlife')).title)],
  [true, true]);

// The Perigee pays the same whichever ending you land on, so the four are
// labelled by the standing they need instead of being ranked against each other.
check('the four Perigee endings are labelled by the standing they need, and all pay alike',
  (() => {
    const own = rows.filter((e) => e.storylet === api.PC2_PERIGEE);
    return [own.length, own.every((e) => !!e.label && !!e.needs && e.worth == null),
      own.every((e) => /one item worth 12.50 Echoes and three worth 2.50/.test(api.pc2Spec(e).title))];
  })(), [4, true, true]);

check('badges for each shape of row',
  ['Lead the lamp-cats in a chess lesson', 'Use your knowledge of the Red Science to improve the miners’ pump',
    'Distract the lamp-cats with local wildlife', 'Convince the miners and lamp-cats of their commonality',
    'Travel back to port with the celebrating miners', 'Check the lay of the land']
    .map((n) => api.pc2BadgeText(row(n))),
  ['Cats +3 CP · Secret ×10 + Clue ×25? · 2 E',
    'Miners +3 CP · Map Scrap ×7 + Scintillack? · 3.2 E',
    'Miners +1+Prep · Cats −3 · Tentacle ×4? · 2 E',
    'Cats +Recep · Miners +Prep · Notion ×20? · 3.2 E',
    'Damask + Scintillack ×3', 'free · read the standings']);

check('the free action the guide’s table has not got is named, and says the page is followed',
  rows.filter((e) => e.guide).map((e) => [e.name, e.actions, /the page is followed/.test(api.pc2Spec(e).title)]),
  [['Check the lay of the land', 0, true]]);

check('a heading says which phase of the tide it is',
  [api.PC2_HIGH, api.PC2_LOW, api.PC2_PERIGEE].map((s) => api.pc2StoryletSpec(key(s)).text),
  ['Tides 0–5 · 6 actions', 'Tides 6–12 · 7 actions', 'Tides 13 · pays out']);

check('the rules line says the Perigee pays on which faction leads, not by how much',
  /pays on which of those two is ahead, never by how much/.test(api.pc2Spec(row('Liberate some raw scintillack')).title),
  true);

check('the registered pass: a heading and an option under its open storylet',
  (() => {
    const list = makeHeading(api.PC2_PERIGEE, 'storylet__heading');
    const open = makeHeading(api.PC2_HIGH, 'storylet-root__heading');
    const branch = makeHeading('Provision the miners with ropes and harnesses');
    const elsewhere = makeHeading('Liberate some raw scintillack');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.pc2Ratings();
    const out = [text(list, api.PC2_CLASS), text(open, api.PC2_CLASS), text(branch, api.PC2_BRANCH_CLASS),
      text(elsewhere, api.PC2_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['Tides 13 · pays out', 'Tides 0–5 · 6 actions',
    'Miners +3 CP · Moon-Pearl ×200? · 2 E', null]);

check('no Port Cecil name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PC2_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'port-cecil'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
