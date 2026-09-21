// Ad-hoc test for FallenLondon/choice-helper.js's Alchemy at Station VIII
// badges ('alchemy-station-viii').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every pickup names the reagent it ends at
// AND the size of Pinnock's bill, since the bill is the only thing that varies
// across the six; that the bill is counted in stacks of goods and never in
// Echoes, because the guide prices exactly one of the six lines; that a free
// pickup says the word "free" rather than relying on a colour; and that
// "nothing one-time uses it" and "no one-time use recorded" stay different
// claims.
//
// Numbers come from Alchemy at Station VIII (Guide), Station VIII: A Courier's
// Meeting, Special Extracts and their option pages on fallenlondon.wiki,
// fetched through the API on 2026-09-21.
//
//   node FallenLondon/test/choice-alchemy-station-viii.test.mjs

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
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null
    ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS', 'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS', 'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS', 'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS', 'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS', 'PB_OPTIONS', 'CH_OPTIONS', 'LH_OPTIONS', 'MX_OPTIONS', 'MG_OPTIONS', 'KA_OPTIONS', 'AS_OPTIONS', 'CN_OPTIONS', 'CHW_OPTIONS', 'HR_OPTIONS', 'CCM_OPTIONS', 'DH_OPTIONS', 'MR_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { AS_OPTIONS, AS_INDEX, AS_LAB, AS_MEET, AS_STORYLETS, AS_LOOP_ACTIONS, AS_CLASS, AS_BRANCH_CLASS, asBadgeText, asSpec, asStoryletSpec, asRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.AS_OPTIONS;
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

check('no Alchemy name is in another feature\u2019s table',
  (() => {
    const others = otherNames('AS_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);

// Six sentiments, six reagents, and no reagent made twice: a repeat would mean
// two pickups had been filed against one extraction.
check('six pickups and six extractions, one reagent each',
  (() => {
    const picks = rows.filter((e) => e.pick && e.storylet === api.AS_MEET).map((e) => e.makes);
    const made = rows.filter((e) => e.extract).map((e) => e.makes);
    return [picks.length, made.length, new Set(made).size, made.every((m) => picks.includes(m))];
  })(), [6, 6, 6, true]);

// The whole point of the badge: a pickup carries the reagent and the bill.
check('a pickup badges the reagent and the bill, and only one of them is free',
  ['Acquire an \u2018Obliviscere Mori\u2019', 'Acquire some \u2018Horrifying Confirmation that you were Right All Along\u2019',
    'Bribe another courier'].map((n) => api.asBadgeText(row(n))),
  ['\u2192 Crystallised Euphoria \u00b7 free', '\u2192 Concentrate of Self \u00b7 4 stacks of goods \u25bc',
    '\u2192 Crystallised Euphoria \u00b7 1 stack of goods \u25bc']);

check('an extraction badges the reagent alone',
  api.asBadgeText(row('Extract concentrated sentiment from the Unthinkable Hope')),
  'Powder of Renewal \u25bc');

// A stack count is a fact off the option page. An Echo price would not be: the
// guide gives one for the free line and for nothing else.
check('every costed pickup states its items, and no row claims an Echo price',
  rows.filter((e) => e.pick && (e.bill ? !e.uses : !!e.uses)).map((e) => e.name), []);

check('the bills, cheapest first', rows.filter((e) => e.pick).map((e) => e.bill).sort((a, b) => a - b),
  [0, 1, 2, 2, 4, 5, 5]);

// "None" and "not recorded" are different claims and the table keeps them apart.
check('the one reagent nothing one-time uses says so with a null',
  (() => {
    const e = row('Extract concentrated sentiment from the Horrifying Confirmation that you were Right All Along');
    return [e.once, /records "None"/.test(api.asSpec(e).title)];
  })(), [null, true]);

// The sentiment is not the reagent, and one thing in the guide wants the
// sentiment itself.
check('the daughter-church wants the sentiment, and the tooltip says not to extract first',
  /do \u2014? ?not extract it first|do not\s*\n?\s*extract it first/
    .test(api.asSpec(row('Extract concentrated sentiment from the Unthinkable Hope')).title.replace(/\s+/g, ' ')),
  true);

check('the loop is five actions and the rules say so',
  [api.AS_LOOP_ACTIONS, api.asSpec(row('Acquire an \u2018Obliviscere Mori\u2019')).title.includes('5 actions')],
  [5, true]);

check('the heading', api.asStoryletSpec(key(api.AS_LAB)).text, '8 lines here \u00b7 6 reagents, 1 of them free');

check('the registered pass: the laboratory heading, a pickup and an extraction',
  (() => {
    const open = makeHeading(api.AS_MEET, 'storylet-root__heading');
    const pick = makeHeading('Acquire some \u2018Vindication of Faith\u2019');
    roots = [open];
    branches = [pick];
    api.asRatings();
    const out = [text(open, api.AS_CLASS), text(pick, api.AS_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['7 lines here \u00b7 6 reagents, 1 of them free', '\u2192 Salve of Righteousness \u00b7 2 stacks of goods \u25bc']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'alchemy-station-viii'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
