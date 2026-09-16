// Ad-hoc test for FallenLondon/choice-helper.js's Term Passing... badges
// ('term-passing').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// The thing worth pinning hardest is the MERGE. Three carousels share storylet
// and option titles -- the third renames the first's into Title Case, which
// normalising folds away -- and `carouselLookup` answers nothing when two rows
// match, so an unmerged table would leave three dozen options with no badge at
// all and nothing would say so. So: every title resolves to exactly one row,
// merged rows carry one variant per carousel, and the badge quotes both
// readings rather than guessing which carousel is open (nothing on the screen
// says, and Featuring in the Tales of the University lives on the Myself tab).
//
// Then: the first carousel carrying goods where the other two carry the guide's
// Echoes, the three research swaps being the outliers the guide's 4.90 EPA line
// rests on, and the badges.
//
// Numbers come from Term Passing... (Guide) -- its three "every option" tables
// -- on fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node FallenLondon/test/choice-term-passing.test.mjs

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
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
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
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { TP_FIRST, TP_SECOND, TP_THIRD, TP_SHARED, TP_CAROUSELS, TP_STORYLETS, TP_INDEX, TP_CLASS,'
    + ' TP_BRANCH_CLASS, tpBadgeText, tpSpec, tpStoryletSpec, tpRatings, carouselLookup, '
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
const rows = api.TP_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
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

check('three carousels, and the merge loses nothing',
  [api.TP_CAROUSELS.length,
    api.TP_FIRST.length + api.TP_SECOND.length + api.TP_THIRD.length,
    rows.reduce((n, e) => n + e.variants.length, 0)],
  [3, 111 + api.TP_SHARED.length, 111 + api.TP_SHARED.length]);

// The merge is the whole point. Every storylet-and-option pair must resolve to
// exactly ONE row: `carouselLookup` returns null when two match, and the
// symptom is an option with no badge rather than an error.
check('every option resolves to exactly one row under its own storylet',
  (() => {
    const bad = [];
    for (const e of rows) {
      if (!api.carouselLookup(api.TP_INDEX, e.name, key(e.storylet))) bad.push(e.storylet + ' | ' + e.name);
    }
    return bad;
  })(), []);

check('a merged row carries one variant per carousel, never two of the same',
  api.TP_SHARED.filter((e) => {
    const ids = e.variants.map((v) => v.carousel);
    return ids.length !== new Set(ids).size;
  }).map((e) => e.name), []);

check('the one merged row whose two readings are identical, and which collapses on the badge',
  (() => {
    const same = api.TP_SHARED.filter((e) => {
      const readings = e.variants.map((v) => JSON.stringify([v.cp, v.echoes, v.gives]));
      return readings.length !== new Set(readings).size;
    });
    return [same.map((e) => e.storylet + ' | ' + e.name), same.map((e) => api.tpBadgeText(e))];
  })(),
  [['The library roof | Report them to the college authorities'],
    ['reset · Benthic +30 CP']]);

// The split the feature is built on: the guide prices the second and third
// carousels per option and does not price the first at all, so the first
// carries goods and the others carry Echoes. Inventing figures for the first
// would rank it against the others on a number the guide never made.
check('the first carousel is unpriced and the other two are priced',
  [api.TP_FIRST.every((e) => e.echoes === undefined),
    api.TP_SECOND.filter((e) => e.echoes == null).length,
    api.TP_THIRD.filter((e) => e.echoes == null).map((e) => e.name)],
  [true, 0, ['Fourteen courses of sheer indulgence', 'Advise them to stick to their principles',
    'Report them to the college authorities']]);

// The research swaps are the outliers the guide's 4.90-Echo line is built on:
// ten times anything else in the carousel.
check('the three research swaps are the best-paying rows in the file, by a factor of five',
  (() => {
    const priced = api.TP_THIRD.filter((e) => e.echoes != null).slice().sort((a, b) => b.echoes - a.echoes);
    return [priced.slice(0, 3).map((e) => e.name), priced[0].echoes / priced[3].echoes > 2];
  })(),
  [['Swap research with archaeologists', 'Swap research with zoologists',
    'Swap research with theologians'], true]);

check('each carousel runs to its own cap in its own number of actions',
  api.TP_CAROUSELS.map((c) => [c.id, c.cap, c.actions]), [[1, 12, 32], [2, 7, 14], [3, 8, 10]]);

check('badges', ['Attend a feast', 'Blackmail', 'Talk to the Porters',
  'Swap research with archaeologists', 'Court the Duchess’ patronage']
  .map((n) => api.tpBadgeText(row(n))),
  ['1st TP +2? · Whispered Hint ×90 | 3rd TP +4? · 1.50 E',
    '1st reset · Proscribed Material ×50 | 3rd reset · 5.20 E',
    'no TP? · 0.58 E', 'TP +4? · 14.00 E', 'reset? · 2.25 E']);

check('a merged row\'s tooltip says why both readings are there',
  api.tpSpec(row('Attend a feast')).title.includes('which one is Featuring in the Tales of the '
    + 'University — which is on the Myself tab'), true);

check('storylet headings name the carousels and the windows',
  ['Feasting at Summerset', 'Off to the library', 'Off to the Library', 'The Library Roof',
    'Making Your Name: Investigations in the university', 'Interdisciplinary Research']
    .map((s) => api.tpStoryletSpec(key(s)).text),
  ['1st/3rd · T0-7/0-3', '1st/3rd · T0-7/0-3', '1st/3rd · T0-7/0-3',
    '1st/3rd · T12/8', '2nd · T–', '3rd · T0-7']);

check('the two spellings of one storylet reach the same summary',
  api.tpStoryletSpec(key('Off to the library')).title
    === api.tpStoryletSpec(key('Off to the Library')).title, true);

check('the registered pass',
  (() => {
    const feast = makeHeading('Attend a feast');
    const porters = makeHeading('Talk to the Porters');
    branches = [feast, porters];
    roots = [makeHeading('Feasting at Summerset')];
    api.tpRatings();
    const out = [text(roots[0], api.TP_CLASS), text(feast, api.TP_BRANCH_CLASS),
      text(porters, api.TP_BRANCH_CLASS)];
    roots = [makeHeading('Making Your Name: Investigations in the university')];
    api.tpRatings();
    out.push(text(roots[0], api.TP_CLASS), text(feast, api.TP_BRANCH_CLASS),
      text(porters, api.TP_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['1st/3rd · T0-7/0-3', '1st TP +2? · Whispered Hint ×90 | 3rd TP +4? · 1.50 E', null,
    '2nd · T–', null, 'no TP? · 0.58 E']);

check('no Term Passing name is in another feature\'s table',
  (() => { const others = otherNames('TP_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'term-passing'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
