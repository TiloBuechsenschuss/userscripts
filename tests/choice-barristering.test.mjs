// Ad-hoc test for FallenLondon/choice-helper.js's Barristering at Evenlode badges
// ('barristering').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the trial headings resolve however the case
// is named, since both trial storylets are titled after the trial and a miss
// blanks every option in a trial; that the Airs retitles of *Choose a case*
// all find their row; that every trial option names the step it belongs to,
// which is what decides whether it is on the screen; and the four options
// that LOWER Prestige, which are there on purpose and must not read as
// mistakes.
//
// Numbers come from Barristering at Evenlode (Guide), Choose a case and both trial storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-barristering.test.mjs

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
    'return { BA_OPTIONS, BA_INDEX, BA_CASES, BA_STORYLETS, BA_STEPS, BA_PRESTIGE_CAP, BA_CHOOSE, BA_PROSECUTION, BA_DEFENCE, BA_CLASS, BA_BRANCH_CLASS, baCanonical, baBadgeText, baSpec, baStoryletSpec, baRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.BA_OPTIONS;
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

check('no Barristering name is in another feature\u2019s table',
  (() => {
    const others = otherNames('BA_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the eight cases, their faction, their Prestige cap and the guide’s EPA',
  api.BA_CASES.map((c) => [c.side, c.faction, c.cap, c.epa]),
  [['prosecution', 'Renown: Constables', 9, 4.828], ['defence', 'Renown: Criminals', 10, 4.828],
    ['Rats', 'Sympathetic about Ratly Concerns', 7, 4.385], ['Urchins', 'Renown: Urchins', 7, 4.792],
    ['Tomb-Colonists', 'Renown: Tomb-Colonies', 9, 4.828], ['Devils', 'Renown: Hell', 8, 4.27],
    ['Gondoliers', 'Renown: The Docks', 9, 8.162], ['Society Matron', 'Renown: Society', 9, 4.125]]);

// Both trial storylets are named after the case being fought, four names on
// each side. Matching the shape is what keeps a fifth case from blanking them.
check('every trial heading resolves, whichever case it names',
  ['Prosecution of Latest Criminal Case', 'Prosecution of Venge-Rat v Straggle-Toothed Urchin',
    'Prosecution of The Ancient and Honourable Guild of Gondoliers v Society Matron',
    'Prosecution of Tomb-Colonies Honey Importation v Hell', 'Defence of Latest Criminal Case',
    'Defence of Venge-Rat v Straggle-Toothed Urchin', 'Defence of a case nobody has written down']
    .map((n) => api.baCanonical(key(n))),
  ['prosecution of a trial', 'prosecution of a trial', 'prosecution of a trial', 'prosecution of a trial',
    'defence of a trial', 'defence of a trial', 'defence of a trial']);

// Second Airs For CourtRoom rewrites all eight case titles; without the
// aliases half of them would go unbadged.
check('the Airs titles of Choose a case all find their row',
  ['Justly prosecute a pickpocket charged with theft', 'Prosecute a pickpocket charged with theft',
    'Justly defend a pickpocket charged with theft', 'Defend a pickpocket charged with theft',
    'Justly argue for the plaintiff in a civil suit of Rats against Urchins',
    'Fight a dishonest case for the plaintiff in a civil suit of Rats against Urchins']
    .map((n) => {
      const e = api.carouselLookup(api.BA_INDEX, n, key(api.BA_CHOOSE));
      return e && e.case.faction;
    }),
  ['Renown: Constables', 'Renown: Constables', 'Renown: Criminals', 'Renown: Criminals',
    'Sympathetic about Ratly Concerns', 'Sympathetic about Ratly Concerns']);

check('every trial option names a step, and every step is a real one',
  rows.filter((e) => e.storylet !== api.BA_CHOOSE && !e.label)
    .filter((e) => e.step == null || !api.BA_STEPS[e.step]).map((e) => e.name), []);

// Prestige cuts both ways, so the options that lower it are deliberate.
check('the four options that lower Prestige',
  rows.filter((e) => e.prestige < 0).map((e) => [e.name, e.prestige]),
  [['Fabricate evidence against the (defendant)', -1], ['Contrive an exchange of judges', -2],
    ['Show the (defendant) in the most sympathetic possible light', -1],
    ['Destroy evidence against the (defendant)', -1]]);

check('the verdicts end the trial, and every one of them says so',
  [rows.filter((e) => e.verdict).length,
    rows.filter((e) => e.verdict).every((e) => /This ENDS the trial/.test(api.baSpec(e).title))],
  [17, true]);

// The Mithridacy checks climb with Prestige, which is the trade the whole
// activity is about, so the tooltip has to say it.
check('a Prestige-scaled check says that it scales',
  [/rises by one per point of Prestige/.test(api.baSpec(row('Close out your argument in a nuanced way')).title),
    /climbs by TEN a point of Prestige/.test(row('Smuggle the (defendant) out').note)],
  [true, true]);

check('badges for each shape of row',
  ['(Prosecute) (a defendant) charged with (crime)', 'Enter the bare minimum', 'Grandstand!',
    'Contrive an exchange of judges', 'Propose adhering to London forms of prosecution']
    .map((n) => api.baBadgeText(row(n))),
  ['Constables · Prestige 9 · 4.828 EPA', 'Prestige +1? · paperwork', 'Making Waves +3 × Prestige? · closing',
    'Prestige −2? · opening ▾', 'no format, no Prestige · opening']);

check('the headings',
  api.BA_STORYLETS.map((s) => api.baStoryletSpec(key(s)).text),
  ['8 cases · best 8.162 EPA', 'prosecuting · Prestige pays to 9', 'defending · Prestige pays to 9']);

// Both sides of the court carry a Grandstand! and a Run out the clock; only
// the open storylet tells them apart.
check('the shared titles resolve by side',
  [api.carouselLookup(api.BA_INDEX, 'Run out the clock', key(api.BA_PROSECUTION)).client,
    api.carouselLookup(api.BA_INDEX, 'Run out the clock', key(api.BA_DEFENCE)).client || 'any'],
  ['under Common Law', 'any']);

check('the registered pass: a trial heading named after its case, and two options',
  (() => {
    const open = makeHeading('Defence of Venge-Rat v Straggle-Toothed Urchin', 'storylet-root__heading');
    const paper = makeHeading('Craft a water-tight case');
    const wrong = makeHeading('Enter the bare minimum');
    roots = [open];
    branches = [paper, wrong];
    api.baRatings();
    const out = [text(open, api.BA_CLASS), text(paper, api.BA_BRANCH_CLASS), text(wrong, api.BA_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['defending · Prestige pays to 9', 'Prestige +1? · paperwork', null]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'barristering'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
