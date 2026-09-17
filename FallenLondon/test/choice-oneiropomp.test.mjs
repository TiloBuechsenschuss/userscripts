// Ad-hoc test for FallenLondon/choice-helper.js's Oneiropomp badges
// ('oneiropomp').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every row moves Intensity or Duration or is
// labelled, that each cash-out lists its three modulo tiers best first, that
// every option says which state of Parabola it belongs to, and that the free
// lines say their check climbs rather than inventing a difficulty.
//
// Numbers come from Oneiropomp (Guide) and the Viric Jungle's two storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-oneiropomp.test.mjs

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
    'return { ON_OPTIONS, ON_STORYLETS, ON_INDEX, ON_CHOICE, ON_ATTEND, ON_INTENSITY_ECHOES, ON_DURATION_SIGHTINGS, ON_CLASS, ON_BRANCH_CLASS, onBadgeText, onSpec, onStoryletSpec, onRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.ON_OPTIONS;
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

// Both qualities are the payout, and the guide prices them: 2 Echoes an
// Intensity, 15 Sightings a Duration. A row that moves neither is a row the
// badge has nothing to say about.
check('every row is a label, a cash-out or a move on the two qualities',
  rows.filter((e) => !e.label && !e.tiers && e.intensity == null).map((e) => e.name), []);

check('the item options buy six Intensity and two Duration; the free ones test for one or two',
  [rows.filter((e) => e.intensity === 6).map((e) => e.duration),
    rows.filter((e) => Array.isArray(e.intensity)).map((e) => e.intensity[1])],
  [[2, 2, 2, 2], [2, 2, 2, 2, 2]]);

check('badges for each shape of row',
  ['Lend power to the dream', 'Draw in another place', 'Observe and learn', 'More! Further!',
    'Inspire her to imagine His Amused Lordship as a historical figure', 'Take your own inspiration from this dream',
    'Fill an empty Mirrorcatch box with Viric'].map((n) => api.onBadgeText(row(n))),
  ['Intensity +1–2?', 'Intensity +6 · Duration +2? ▼', 'Duration +1–2', 'Intensity +1–2?',
    'Comprehensive Bribe 12.5 → Sworn Statement 2.5 → Intriguing Snippet 0.2?',
    'Inspired ×9.5 per Intensity?', 'Viric box · Intensity −1']);

// The modulo rewards pay the top tier as often as your Intensity covers it and
// the remainder downwards, so the ORDER of the three is the whole reading.
check('every cash-out lists its three tiers, best first',
  rows.filter((e) => e.tiers).map((e) => [e.name, e.tiers.map((t) => t[1]),
    e.tiers[0][1] > e.tiers[1][1] && e.tiers[1][1] > e.tiers[2][1]]),
  [['Inspire her to imagine His Amused Lordship as a historical figure', [12.5, 2.5, 0.2], true],
    ['Inspire her to imagine His Amused Lordship as more himself than ever', [12.5, 2.5, 0.1], true],
    ['Inspire her to sculpt a Saint of Axile', [12.5, 2.5, 0.1], true],
    ['Present a vision of (your saint)', [12.5, 2.5, 0.5], true],
    ['Extract clues from his thoughts', [12.5, 2.5, 0.15], true],
    ['Make a thorough examination of the Princess’ orangery', [12, 2.5, 0.2], true]]);

check('the tooltip prices an Intensity and says what the modulo method does',
  [/2 Echoes\)/.test(api.onSpec(row('Draw in another place')).title),
    /the top tier as often as your Intensity covers it/.test(
      api.onSpec(row('Extract clues from his thoughts')).title)],
  [true, true]);

// Which options exist at all depends on whether Parabola is relaxed or
// strained, and the two storylets ARE those two states.
check('every option carries the state of Parabola it is offered in',
  rows.filter((e) => (e.storylet === api.ON_CHOICE || e.storylet === api.ON_ATTEND) && !/dreamer|the rules/.test(e.label || '')
    && !e.state).map((e) => e.name), []);

check('the free Persuasive lines say their check climbs rather than naming a difficulty',
  [/climbs with the Intensity you have already built/.test(api.onSpec(row('Lend power to the dream')).title),
    /climbs with the Intensity you have already built/.test(api.onSpec(row('More! Further!')).title)],
  [true, true]);

check('the rules line carries the guide’s rest-or-push rule',
  /push only above about a 70% success rate/.test(api.onSpec(row('Observe and learn')).title), true);

check('a heading says which state of Parabola it is',
  [api.ON_CHOICE, api.ON_ATTEND].map((s) => api.onStoryletSpec(key(s)).text),
  ['Parabola relaxed · build or cash in', 'Parabola strained · rest or push']);

check('the registered pass: a heading and an option under its open storylet',
  (() => {
    const list = makeHeading(api.ON_ATTEND, 'storylet__heading');
    const open = makeHeading(api.ON_CHOICE, 'storylet-root__heading');
    const branch = makeHeading('Care for the rooted courtiers');
    const elsewhere = makeHeading('More! Further!');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.onRatings();
    const out = [text(list, api.ON_CLASS), text(open, api.ON_CLASS), text(branch, api.ON_BRANCH_CLASS),
      text(elsewhere, api.ON_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['Parabola strained · rest or push', 'Parabola relaxed · build or cash in', 'Intensity +1–2?', null]);

check('no Oneiropomp name is in another feature\u2019s table',
  (() => {
    const others = otherNames('ON_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'oneiropomp'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
