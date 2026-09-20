// Ad-hoc test for FallenLondon/choice-helper.js's Diving in the Magistracy badges
// ('magistracy-diving').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the six options which scale with Diving
// Depth carry the WHOLE ladder and not one depth's figure, because nothing on
// the diving screen states your depth; that the storylet resolves however the
// heading is finished, since it is retitled at every floor; and that every
// option which can fail says what the failure costs, the menaces here being
// the reason a dive ends early.
//
// Numbers come from Diving in the Magistracy (Guide), Diving in the Magistracy and The Place of the Judge on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-magistracy-diving.test.mjs

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
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { DV_OPTIONS, DV_INDEX, DV_FLOORS, DV_STORYLETS, DV_DIVE, DV_THRONE, DV_CLASS, DV_BRANCH_CLASS, dvCanonical, dvBadgeText, dvSpec, dvStoryletSpec, dvRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.DV_OPTIONS;
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

check('no diving name is in another feature\u2019s table',
  (() => {
    const others = otherNames('DV_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the six floors, in order',
  api.DV_FLOORS,
  ['Just Below the Surface', 'The Snails', 'Among Boughs', 'Open Space', 'Peligin Water', 'The Bottom?']);

// The storylet's title ends on the floor's name, so it is matched on its
// opening words. A miss here blanks every badge in the water.
check('the diving storylet resolves at every floor',
  api.DV_FLOORS.map((f) => api.dvCanonical(key('Diving in the Magistracy: ' + f)))
    .concat([api.dvCanonical(key('Diving in the Magistracy')), api.dvCanonical(key('The Place of the Judge'))]),
  ['diving in the magistracy', 'diving in the magistracy', 'diving in the magistracy',
    'diving in the magistracy', 'diving in the magistracy', 'diving in the magistracy',
    'diving in the magistracy', 'the place of the judge']);

// Nothing on the diving screen states the depth, so a badge that quoted one
// depth's figure would be wrong at the other five. These carry the ladder.
check('the options that scale with depth, and the range each covers',
  rows.filter((e) => e.byDepth).map((e) => [e.name, e.byDepth[0][0], e.byDepth[e.byDepth.length - 1][0]]),
  [['Search the upper floors', 1, 2], ['Search the lower floors', 3, 4], ['Search the lowest Floors', 5, 6],
    ['Observe a gilled lamp-cat', 1, 6], ['Go spear-fishing', 1, 6],
    ['Send your Abyssal Sawtooth out to hunt', 1, 6]]);

check('a depth ladder covers every depth in its range, with no gap',
  rows.filter((e) => e.byDepth).filter((e) => {
    const depths = e.byDepth.map((p) => p[0]);
    return depths.some((d, i) => i > 0 && d !== depths[i - 1] + 1);
  }).map((e) => e.name), []);

check('every depth-scaled badge is marked as one',
  rows.filter((e) => e.byDepth).every((e) => api.dvBadgeText(e).includes('▲ by depth')), true);

// A menace is what ends a dive early, so an option that can fail has to say
// what the failure costs.
check('every option with a challenge says what a failure does',
  rows.filter((e) => e.ch && !e.fail).map((e) => e.name), []);

check('the four Airs options and their windows',
  rows.filter((e) => e.airs).map((e) => [e.name, e.airs]),
  [['Observe a gilled lamp-cat', '26–50'], ['Go spear-fishing', '51–75'],
    ['Send your Abyssal Sawtooth out to hunt', '51–75'], ['Study drowned architecture', '76–100']]);

// Ascend and ASCEND! differ only by punctuation, which normalizeName throws
// away, so they are one row that says both.
check('Ascend and ASCEND! are one row',
  [rows.filter((e) => /^Ascend/.test(e.name)).length,
    api.carouselLookup(api.DV_INDEX, 'ASCEND!', key(api.DV_DIVE)).label,
    api.carouselLookup(api.DV_INDEX, 'Ascend', key(api.DV_DIVE)).label],
  [1, 'one floor up, or out at Nightmares 7', 'one floor up, or out at Nightmares 7']);

check('badges for each shape of row',
  ['Search the lowest Floors', 'Go spear-fishing', 'Study drowned architecture', 'Look for the Throne Room',
    'Study the evidence'].map((n) => api.dvBadgeText(row(n))),
  ['Jade ×250–300 · Expertise ×5–6? · ▲ by depth', 'Catch ×2–7? · ▲ by depth · Airs 51–75',
    'an Implication? · Airs 76–100', 'ends the dive? ▾', 'a Code of Honour?']);

check('the heading points at itself as the only place the depth is written',
  [api.dvStoryletSpec(key(api.DV_DIVE)).text,
    /Nothing else on the diving screen states it/.test(api.dvStoryletSpec(key(api.DV_DIVE)).title)],
  ['depth 1–6 · read it off the heading', true]);

check('the registered pass: a floor heading and two of its options',
  (() => {
    const open = makeHeading('Diving in the Magistracy: Peligin Water', 'storylet-root__heading');
    const search = makeHeading('Search the lowest Floors');
    const fish = makeHeading('Go spear-fishing');
    roots = [open];
    branches = [search, fish];
    api.dvRatings();
    const out = [text(open, api.DV_CLASS), text(search, api.DV_BRANCH_CLASS), text(fish, api.DV_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['depth 1–6 · read it off the heading', 'Jade ×250–300 · Expertise ×5–6? · ▲ by depth',
    'Catch ×2–7? · ▲ by depth · Airs 51–75']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'magistracy-diving'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
