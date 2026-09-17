// Ad-hoc test for FallenLondon/choice-helper.js's A Cub’s Education badges
// ('cubs-education').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: how many cats there are and how many cost no Fate,
// that the four reward bands tile 0 upwards without a gap, that every cat says
// where it comes from, and that the guide's list of felines which do NOT count
// is kept and shown -- "why is my cat not here" being the question this content
// actually raises.
//
// Numbers come from A Cub's Education (Guide) and The Dome of Scales, Becoming on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-cubs-education.test.mjs

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
    'return { CE_OPTIONS, CE_INDEX, CE_DOME, CE_NOT_CATS, CE_CLASS, CE_BRANCH_CLASS, ceBadgeText, ceSpec, ceStoryletSpec, ceRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CE_OPTIONS;
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

// The whole activity is a collection problem, so the two numbers that matter
// are how many cats exist and how many of them cost no Fate -- which is what
// the heading badge says.
check('the cats, and how many of them are free',
  [rows.filter((e) => e.from).length, rows.filter((e) => e.from && !e.fate).length,
    api.ceStoryletSpec(key(api.CE_DOME)).text],
  [22, 10, '22 cats · 10 without Fate']);

check('every row is either a reward band or a cat',
  rows.filter((e) => !e.band && !e.from).map((e) => e.name), []);

// The four rewards are bands, and they have to tile 0 upwards without a gap:
// a hole here is a level where the badge would promise nothing.
check('the four reward bands run 0 to 5, 6 to 14 and 15 up, twice',
  rows.filter((e) => e.band).map((e) => [e.band, e.tag]),
  [['0–5 cats', 'an Extraordinary Implication'], ['6–14 cats', 'a Glass Gazette'],
    ['15+ cats, once', 'a Salve of Righteousness'], ['15+ cats, after', 'a Glass Gazette']]);

check('badges for each shape of row',
  ['Treat with the kitten', 'Commune with the Chorus of Cats', 'Speak to the Union of Lions',
    'Introduce your Grubby Kitten', 'Introduce Horatio, Finest of His Lineage'].map((n) => api.ceBadgeText(row(n))),
  ['0–5 cats · an Extraordinary Implication', '6–14 cats · a Glass Gazette',
    '15+ cats, once · a Salve of Righteousness · Fate', 'a cat · once', 'a cat · Fate · once']);

check('every cat says where it comes from, and a Fate cat says so on the badge',
  [rows.filter((e) => e.from && !e.from.length).map((e) => e.name),
    rows.filter((e) => e.from).every((e) => /Fate/.test(api.ceBadgeText(e)) === !!e.fate)],
  [[], true]);

// "Why is my cat not on this list" is the question this content raises, so the
// guide's list of felines that do not count is kept and shown on the heading.
check('the felines that do not count are carried, and are on the heading’s tooltip',
  [api.CE_NOT_CATS.length, /Parabolan Panther/.test(api.ceStoryletSpec(key(api.CE_DOME)).title),
    /Lyon Pursuivant of Arms Extraordinary/.test(api.ceStoryletSpec(key(api.CE_DOME)).title)],
  [13, true, true]);

check('the rules line says a second copy is worth nothing, and that progress is kept',
  [/a second copy is worth nothing/.test(api.ceSpec(row('Introduce your Grubby Kitten')).title),
    /progress is KEPT while another power is dominant/.test(api.ceSpec(row('Treat with the kitten')).title)],
  [true, true]);

check('the registered pass: the Dome heading, a reward and a cat',
  (() => {
    const open = makeHeading(api.CE_DOME, 'storylet-root__heading');
    const reward = makeHeading('Commune with the Chorus of Cats');
    const cat = makeHeading('Introduce your Wretched Mog');
    roots = [open];
    branches = [reward, cat];
    api.ceRatings();
    const out = [text(open, api.CE_CLASS), text(reward, api.CE_BRANCH_CLASS), text(cat, api.CE_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['22 cats · 10 without Fate', '6–14 cats · a Glass Gazette', 'a cat · once']);

check('no A Cub’s Education name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CE_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'cubs-education'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
