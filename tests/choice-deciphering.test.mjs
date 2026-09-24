// Ad-hoc test for FallenLondon/choice-helper.js's Deciphering badges
// ('deciphering').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every document states the Deciphering it
// wants and what it pays, and that the only two targets are 5 and 15; that
// the two options a Midnighter improves are ONE row each with a range, since
// the game shows one title; and that the cash-in says the surplus is thrown
// away, which is the mistake this activity invites.
//
// Numbers come from Deciphering (Guide), Work in your Cabinet Noir and its option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-deciphering.test.mjs

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
    'return { DC_OPTIONS, DC_INDEX, DC_DOCUMENTS, DC_CABINET, DC_CLASS, DC_BRANCH_CLASS, dcBadgeText, dcSpec, dcStoryletSpec, dcRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.DC_OPTIONS;
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

check('no Deciphering name is in another feature\u2019s table',
  (() => {
    const others = otherNames('DC_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the eight documents, what they want and what they pay',
  [api.DC_DOCUMENTS.length,
    api.DC_DOCUMENTS.filter((d) => !d.pays || !d.from).map((d) => d.doc),
    [...new Set(api.DC_DOCUMENTS.map((d) => d.need))].sort((a, b) => a - b)],
  [8, [], [5, 15]]);

// The Midnighter version of each is the same title in game, so two rows would
// cancel each other out; one row with a range says both.
check('the Midnighter options are one row each, with a range',
  ['Crack a code', 'Make a leap of code-breaking insight'].map((n) =>
    [rows.filter((e) => e.name === n).length, JSON.stringify(row(n).cp)]),
  [[1, '[5,6]'], [1, '[7,9]']]);

check('the leap is the only one whose failure takes progress back',
  rows.filter((e) => e.fail && /Deciphering\.\.\. −3 CP/.test(e.fail)).map((e) => e.name),
  ['Make a leap of code-breaking insight']);

// Cashing in zeroes the quality whatever it stands at, and a rare leap pays
// fifteen against a target of five -- so this warning has to be on the badge.
check('the cash-in warns that the surplus is lost, on the badge and in the tooltip',
  [api.dcBadgeText(row('Interpret your Intercepted Document')),
    /goes to zero whatever it stands at/.test(api.dcSpec(row('Interpret your Intercepted Document')).title)],
  ['cash in · 5 or 15 · surplus lost', true]);

check('badges for each shape of row',
  ['Crack a code', 'Make a leap of code-breaking insight', 'Work with the Codebreaking Courier',
    'Step through the hidden door'].map((n) => api.dcBadgeText(row(n))),
  ['Deciphering +5–6?', 'Deciphering +7–9? · rare +10–15', 'Deciphering +4? ▾', 'out of the Cabinet']);

// *Cover your tracks* and *Eliminate a good deal of suspicion* are on this
// storylet too and belong to `disappearing`, whose guide has their figures.
// Two features share this heading and neither answers for the other's options.
check('the two Disappearing options are not this feature’s',
  rows.map((e) => e.name).filter((n) => /Cover your tracks|Eliminate a good deal/.test(n)), []);

check('the tooltip carries both halves of the double check',
  /Challenge: Watchful 175, certain at Watchful 292\. And A Player of Chess 5, certain at 10\./
    .test(api.dcSpec(row('Make a leap of code-breaking insight')).title), true);

check('the heading',
  api.dcStoryletSpec(key(api.DC_CABINET)).text, 'Deciphering to 5 or 15 · up to +9 an action');

check('the registered pass: the Cabinet heading and two of its options',
  (() => {
    const open = makeHeading(api.DC_CABINET, 'storylet-root__heading');
    const leap = makeHeading('Make a leap of code-breaking insight');
    const cash = makeHeading('Interpret your Intercepted Document');
    roots = [open];
    branches = [leap, cash];
    api.dcRatings();
    const out = [text(open, api.DC_CLASS), text(leap, api.DC_BRANCH_CLASS), text(cash, api.DC_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Deciphering to 5 or 15 · up to +9 an action', 'Deciphering +7–9? · rare +10–15',
    'cash in · 5 or 15 · surplus lost']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'deciphering'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
