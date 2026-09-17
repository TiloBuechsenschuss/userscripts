// Ad-hoc test for FallenLondon/choice-helper.js's Parabolan War badges
// ('parabolan-war').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every Ravages option's Echoes-per-Ravage is
// what its own parts come to and lands on one of the guide's two rates, that
// every campaign carries its stages, both endings and its effect on Parabolan
// Dominance, that every piece of the Company leans one way, and that the trail
// itself is NOT badged -- the guide describes it by action type, so the rates
// live in the rules line instead.
//
// Numbers come from Parabolan War (Guide) and the Dolorous Pavilion's storylet pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-parabolan-war.test.mjs

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
    'return { PW_OPTIONS, PW_STORYLETS, PW_INDEX, PW_CAUSE, PW_AFTERMATH, PW_MUNITIONS, PW_LOGISTICS, PW_GENERAL, PW_STRICT, PW_CLASS, PW_BRANCH_CLASS, pwBadgeText, pwSpec, pwStoryletSpec, pwAllowed, pwRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.PW_OPTIONS;
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

// Every Ravages option is a price, and the price is recomputed here from its
// parts: the item's own Echo value times how many of them, over the Ravages it
// clears, IS the rate. The guide's two rates are 1.00 and 1.25, and nothing in
// the table may quietly land between them.
check('every Ravages option’s rate is what its parts come to',
  rows.filter((e) => e.cleared != null)
    .every((e) => Math.round((e.count * e.unit / e.cleared) * 100) / 100 === e.rate), true);

check('the eighteen Ravages options are six scars times three, at the guide’s two rates',
  [rows.filter((e) => e.cleared != null).length,
    [...new Set(rows.filter((e) => e.cleared != null).map((e) => e.rate))].sort(),
    [...new Set(rows.filter((e) => e.cleared != null).map((e) => e.cleared + '/' + e.actions))].sort()],
  [18, [1, 1.25], ['10/5', '2/1']]);

check('every campaign carries its stages, both endings and what it does to Dominance',
  rows.filter((e) => e.storylet === api.PW_CAUSE && !e.label).map((e) => [e.stages, !!e.endings, e.dominance]),
  [[3, true, null], [3, true, null], [5, true, 'Cats'], [5, true, 'Fingerkings'], [3, true, null],
    [5, true, 'the Red-Handed Queen'], [5, true, null]]);

check('badges for each shape of row',
  ['The Cats', 'The Viscountess', 'Words, Broken', 'Bejewel the Dome of Scales', 'Introduce new designs to the Dome',
    'Move out!', 'Form your Grand Parabolan Company'].map((n) => api.pwBadgeText(row(n))),
  ['5 stages · Dominance: Cats', '3 stages · Dominance unchanged', 'Oneironaut +1 ▼',
    'Ravages −2 · 1 action · 1.00 each ▼', 'Ravages −10 · 5 actions · 1.25 each ▼',
    'march · Morale from your leanings', 'form it · an Airag']);

// Every piece of the Company leans one way or the other, and that pair is the
// whole of what those choices do -- so a piece with no lean is a row missing
// its point.
check('every armament and every piece of infrastructure leans one way',
  rows.filter((e) => (e.storylet === api.PW_MUNITIONS || e.storylet === api.PW_LOGISTICS) && !e.label)
    .map((e) => e.lean),
  ['Oneironaut', 'Oneironaut', 'Cultivator', 'Oneironaut', 'Cultivator', 'Cultivator',
    'Oneironaut', 'Cultivator', 'Cultivator', 'Oneironaut', 'Oneironaut', 'Cultivator']);

// The trail itself is described by action TYPE in the guide and never by
// option, so nothing here may badge a stage's options -- the rates live in the
// rules line instead.
check('the trail is not badged, and its rates are in the rules line',
  [rows.some((e) => /Advance!/.test(api.pwBadgeText(e))),
    /1.67/.test(api.pwSpec(row('The Cats')).title) && /Airs option pays 4/.test(api.pwSpec(row('The Cats')).title)],
  [false, true]);

// "A Visitor" is two ordinary words; it is badged only where the greeting says
// the Pavilion, in all three greeting states.
check('the one ordinary heading is gated on the greeting, in all three states',
  ['It’s Tester! Welcome to The Dolorous Pavilion, delicious friend!',
    'It’s Tester! Welcome to Spite, delicious friend!', null].map((g) => {
    greeting = g;
    return [api.pwAllowed('A Visitor'), api.pwAllowed(api.PW_CAUSE), !!api.pwStoryletSpec(key('A Visitor'))];
  }),
  [[true, true, true], [false, true, false], [false, true, false]]);
greeting = null;

check('a heading says which part of the war it is',
  [api.PW_CAUSE, api.PW_AFTERMATH, api.PW_MUNITIONS, api.PW_GENERAL].map((s) => api.pwStoryletSpec(key(s)).text),
  ['pick a cause', 'clear the Ravages', 'Armaments · 3 needed', 'appoint a General']);

check('the registered pass: a heading and an option under its open storylet',
  (() => {
    const list = makeHeading(api.PW_CAUSE, 'storylet__heading');
    const open = makeHeading(api.PW_AFTERMATH, 'storylet-root__heading');
    const branch = makeHeading('Dam the Waswood with truths');
    const elsewhere = makeHeading('The Cats');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.pwRatings();
    const out = [text(list, api.PW_CLASS), text(open, api.PW_CLASS), text(branch, api.PW_BRANCH_CLASS),
      text(elsewhere, api.PW_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['pick a cause', 'clear the Ravages', 'Ravages −2 · 1 action · 1.25 each ▼', null]);

check('no Parabolan War name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PW_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'parabolan-war'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
