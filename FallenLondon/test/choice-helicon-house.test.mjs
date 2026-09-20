// Ad-hoc test for FallenLondon/choice-helper.js's Helicon House badges
// ('helicon-house').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the options which END the visit say so FIRST,
// before their payout, because spending one early throws the evening's progress
// away; that the Time Remaining window is on every badge that has one; that the
// three rows the wiki splits with a trailing 2 are one entry each, since the
// game shows one title; and the one title this feature shares with Attending a
// Party, which is a known and safe exception.
//
// Numbers come from Helicon House (Guide), its Tables subpage and the room storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-helicon-house.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { HH_OPTIONS, HH_INDEX, HH_STORYLETS, HH_COMPANIONS, HH_HOUSE, HH_COMPANION, HH_ENTRANCE, HH_PRUSSIAN, HH_CLASS, HH_BRANCH_CLASS, hhBadgeText, hhSpec, hhStoryletSpec, hhRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.HH_OPTIONS;
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


// Eight ways out, and three of them are the whole point of the evening. A badge
// that led with the payout would read as one more reward.
check('every way out leads with "ends the night"',
  rows.filter((e) => e.ends).map((e) => [e.name, api.hhBadgeText(e).startsWith('ends the night \u00b7 ')]),
  [['Nab a supply of Incorruptible Biscuits on your way out', true],
    ['Forget the biscuits, take the Solacefruit', true],
    ['Never mind the Solacefruit, take the mushroom vol-au-vents', true],
    ['Accept a commission', true], ['Attract a companion for the rest of the evening', true],
    ['Agree to do a bit of modelling', true], ['Lay claim to any left-behind items', true],
    ['Lead them like sacrifices to the Priests of the Red Bird', true]]);

check('and every one of them says so in the tooltip too',
  rows.filter((e) => e.ends).every((e) => /This ENDS the visit/.test(api.hhSpec(e).title)), true);

check('badges for each shape of row',
  ['Keep a close eye on everyone present', 'Accept a commission', 'Listen to the compositions',
    'The Blooming Wallflower', 'Just the right person', 'Sell off a few Glass Gazettes']
    .map((n) => api.hhBadgeText(row(n))),
  ['Fitting +1? \u00b7 TR 2+ \u00b7 Casing +1\u20135 \u00b7 Investigating +5',
    'ends the night \u00b7 Scrip \u00d760+ \u00b7 Amber \u00d7312',
    'Fitting +1\u20132? \u00b7 TR 2+', 'Fitting +1',
    'Casing +2 \u00b7 Fascinating +2 \u00b7 Investigating +2',
    'Fitting +1 \u00b7 TR 2+ \u00b7 Scrip \u00d729 \u25bc']);

// The wiki splits three options in two with a trailing "2"; the game shows one
// title, so two rows under one storylet would cancel each other out.
check('the three split rows are one entry each, and the range is carried',
  ['Listen to the compositions', 'Join in with a Rubbery Euphonium', 'Contribute some extra practitioners']
    .map((n) => [rows.filter((e) => e.name === n).length, JSON.stringify(row(n).fitting)]),
  [[1, '[1,2]'], [1, '3'], [1, '3']]);

// The game fills the passenger in, so the title has to be matched on its shape.
check('the Prussian Salon\u2019s passenger option is matched however it is filled in',
  ['Make polite conversation with a railway passenger',
    'Make polite conversation with an anxious duchess'].map((n) => {
    const e = api.carouselLookup(api.HH_INDEX, n, key(api.HH_PRUSSIAN));
    return e && e.fitting;
  }), [1, 1]);

check('the companions, and how many are Fate-locked',
  [api.HH_COMPANIONS.length, api.HH_COMPANIONS.filter((e) => e.fate).length,
    api.HH_COMPANIONS.filter((e) => e.fitting == null && !e.also).map((e) => e.name)],
  [31, 16, []]);

// The four Investigating options are the only thing Investigating is for here,
// and each says which room it opens.
check('the four discoveries and what they need',
  rows.filter((e) => /^opens /.test(e.label || '')).map((e) => [e.label, e.needs]),
  [['opens the Honey Den', 'Fitting In 3 and Investigating... 7'],
    ['opens Below-Stairs', 'Fitting In 3 and Investigating... 10'],
    ['opens the Mirrored Salon', 'Fitting In 3, Investigating... 7 and Favours: Fingerkings \u00d71'],
    ['opens the Sculpture Garden', 'Fitting In 3, Investigating... 7 and A Pendant of Helicon Amber']]);

check('the headings count the ways out of each room',
  api.HH_STORYLETS.map((s) => api.hhStoryletSpec(key(s)).text),
  ['up to Fitting +2', '31 companions \u00b7 up to Fitting +1', 'up to Fitting +2 \u00b7 3 ways out',
    'up to Fitting +3', 'up to Fitting +2', 'up to Fitting +1 \u00b7 3 ways out', 'up to Fitting +3',
    'up to Fitting +2 \u00b7 2 ways out', 'up to Fitting +2', 'up to Fitting +2']);

check('the registered pass: a room heading, a Fitting In option and a way out',
  (() => {
    const open = makeHeading(api.HH_ENTRANCE, 'storylet-root__heading');
    const watch = makeHeading('Keep a close eye on everyone present');
    const out = makeHeading('Nab a supply of Incorruptible Biscuits on your way out');
    roots = [open];
    branches = [watch, out];
    api.hhRatings();
    const got = [text(open, api.HH_CLASS), text(watch, api.HH_BRANCH_CLASS), text(out, api.HH_BRANCH_CLASS)];
    roots = []; branches = [];
    return got;
  })(),
  ['up to Fitting +2 \u00b7 3 ways out',
    'Fitting +1? \u00b7 TR 2+ \u00b7 Casing +1\u20135 \u00b7 Investigating +5',
    'ends the night \u00b7 Biscuits \u00d74 \u00b7 Marrow \u00d72\u20139']);

// One known exception, and only one. Arrive fashionably late is also an option
// of Attending a Party, under a different storylet: `carouselRatings` looks an
// option up only inside the OPEN storylet, so neither feature can answer for
// the other's heading.
check('exactly one Helicon House name is in another feature\u2019s table',
  (() => {
    const others = otherNames('HH_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), ['Arrive fashionably late']);

check('and the shared title belongs to two different storylets',
  [row('Arrive fashionably late').storylet,
    api.PARTY_OPTIONS.find((e) => e.name === 'Arrive fashionably late').storylet],
  ['Helicon House', 'Arriving at the Party']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'helicon-house'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
