// Ad-hoc test for FallenLondon/choice-helper.js's A Kitchen for Artists badges
// ('kitchen-artists').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every creation step badges BOTH the value it
// adds and the dish it turns into, since a step worth almost nothing may be
// the only way to reach a buyer who wants that exact dish; that every sale
// states the divisor it applies to Culinary Ingredient Value, which is the
// only way to compare them; and that the two options the game shows under one
// title each are one row with the other as an alias.
//
// Numbers come from A Kitchen for Artists (Guide) and the A Kitchen for Artists storylet on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-kitchen-artists.test.mjs

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
    'return { KA_OPTIONS, KA_INDEX, KA_KITCHEN, KA_BASE_VALUE, KA_CLASS, KA_BRANCH_CLASS, kaBadgeText, kaSpec, kaStoryletSpec, kaRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.KA_OPTIONS;
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

check('no Kitchen name is in another feature\u2019s table',
  (() => {
    const others = otherNames('KA_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('every creation step names the value it adds',
  rows.filter((e) => e.value != null && !(e.value > 0)).map((e) => e.name), []);

// A step that changes nothing about the dish stacks; every other one renames
// it, and the rename is what the specific buyers look at.
check('exactly one creation step leaves the dish as it was',
  rows.filter((e) => e.value != null && !e.becomes).map((e) => e.name),
  ['Enhance your Fish Broth with chunks of Deep-zee Catch']);

check('the richest step by a long way, and the runner-up',
  rows.filter((e) => e.value != null).map((e) => e.value).sort((a, b) => b - a).slice(0, 2),
  [36500, 7750]);

check('every sale states the divisor it applies, or the exact goods it pays',
  rows.filter((e) => (e.divisor || e.tag) && !(e.divisor ? e.pays : e.tag)).map((e) => e.name), []);

check('the four divisors in use',
  [...new Set(rows.filter((e) => e.divisor).map((e) => e.divisor))].sort((a, b) => a - b),
  [50, 100, 125, 250]);

// The game fills the dish in, so these have to be matched on their shape.
check('a dish-name option is matched however the game fills it in',
  ['Serve up the Fungal Pâté', 'Trade your Curatorial Cocktail to the Canny Costermonger'].map((n) => {
    const e = api.carouselLookup(api.KA_INDEX, n, key(api.KA_KITCHEN));
    return e && e.divisor;
  }), [50, 100]);

// Two pairs of options share a title in game; each pair is one row with the
// other spelled out in its note.
check('the two shared titles are one row each, and say so',
  [rows.filter((e) => /^Dose yourself with \(your dish\)/.test(e.name)).length,
    /Two options wear this title/.test(row('Dose yourself with (your dish) 0').note),
    /Two options wear this title/.test(row('Dose yourself with the Curatorial Cocktail (No Robe)').note)],
  [2, true, true]);

check('badges for each shape of row',
  ['Brew a Spicy Fish Broth', 'Prepare a Curatorial Cocktail', 'Serve up the (dish)',
    'Present it with the Curatorial Cocktail',
    'Transform yourself with Orange-Apple Jam spiked with Muscaria Brandy']
    .map((n) => api.kaBadgeText(row(n))),
  ['Value +850? · a Spicy Fish Broth ▼', 'Value +36,500? · a Curatorial Cocktail ▼',
    'Hinterland Scrip · Value ÷ 50', 'Masters +3 CP · an Airag ▾',
    'Daring, Forceful, Ruthless and Heartless ▾']);

check('the 250 every creation step is worth is stated',
  [api.KA_BASE_VALUE, /includes the 250 every creation step is worth/
    .test(api.kaSpec(row('Brew a Spicy Fish Broth')).title)],
  [250, true]);

// Helicon House already owns the Sea of Spines sale, so this feature must not
// claim it -- only the step that makes the dish.
check('the Helicon sale is not claimed, only the dish that feeds it',
  [rows.some((e) => e.name === 'Serve up a Culinary Tribute to the Sea of Spines'),
    !!row('Assemble a Culinary Tribute to the Sea of Spines'),
    api.HH_OPTIONS.some((e) => e.name === 'Serve up a Culinary Tribute to the Sea of Spines')],
  [false, true, true]);

check('the heading', api.kaStoryletSpec(key(api.KA_KITCHEN)).text,
  '20 steps to 36,500 Value · 11 ways to sell');

check('the registered pass: the kitchen heading, a base and a sale',
  (() => {
    const open = makeHeading(api.KA_KITCHEN, 'storylet-root__heading');
    const base = makeHeading('Compose an enticing Fungal Pâté');
    const sale = makeHeading('Serve up the Fungal Pâté');
    roots = [open];
    branches = [base, sale];
    api.kaRatings();
    const out = [text(open, api.KA_CLASS), text(base, api.KA_BRANCH_CLASS), text(sale, api.KA_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['20 steps to 36,500 Value · 11 ways to sell', 'Value +900? · a Fungal Pâté ▼',
    'Hinterland Scrip · Value ÷ 50']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'kitchen-artists'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
