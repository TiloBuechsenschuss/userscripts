// Ad-hoc test for FallenLondon/choice-helper.js's Clay Highwayman badges
// ('clay-highwayman').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every line says WHICH of the five qualities
// it moves, since a bare "+1" means something different on nearly every card;
// that a change point, a level and a quality being SET stay three different
// claims rather than collapsing into one signed number; that the card's two
// other titles are aliases, because On the Trail renames it twice; and that
// this feature and `disappearing` divide the camp without sharing a storylet.
//
// Numbers come from The Tale of the Clay Highwayman (Guide) and every card,
// storylet and option page on fallenlondon.wiki, fetched through the API on
// 2026-09-21.
//
//   node FallenLondon/test/choice-clay-highwayman.test.mjs

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
    'return { CHW_OPTIONS, CHW_INDEX, CHW_TRAIL, CHW_CAMP, CHW_ALONE, CHW_STORYLETS, CHW_ALIASES, CHW_LARCENIES, CHW_LARCENY_LADDER, CHW_RANSOM, CHW_TALE_TARGET, CHW_TALE_DENOUEMENT, CHW_CLASS, CHW_BRANCH_CLASS, chwBadgeText, chwSpec, chwStoryletSpec, chwRatings, DI_OPTIONS, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CHW_OPTIONS;
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

check('no Clay Highwayman name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CHW_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);

// The camp holds two features. `disappearing` owns the way out; this one owns
// the story. Sharing a storylet would make each answer for the other's options.
check('the camp is divided with disappearing, storylet by storylet',
  (() => {
    const mine = new Set(api.CHW_STORYLETS.map(key));
    return api.DI_OPTIONS.map((e) => e.storylet).filter((s) => mine.has(key(s)));
  })(), []);

// On the Trail rewrites the card's own name, and a name the table does not
// carry goes unbadged.
check('the card is recognised under all three of its names',
  ['Who is the Clay Highwayman?', 'Investigating the Clay Highwayman', 'The Clay Highwayman\u2019s Fate']
    .map((n) => api.carouselCanonical(key(n), api.CHW_ALIASES) === key(api.CHW_TRAIL)), [true, true, true]);

// Three units, three readings. A level, a change point and a quality being set
// to a number are not the same claim.
check('the three units read differently',
  ['Investigate the Clay Highwayman: Ask criminal contacts', 'Take tea with the Burly Lieutenant',
    'Allow yourself to be captured', 'The Clay Highwayman, in his own words']
    .map((n) => api.chwBadgeText(row(n))),
  ['On the Trail +1 CP', 'The Tale +1 \u00b7 A Marauder of the Clay Highwayman \u22122',
    'Waiting on a Ransom \u2192 8', 'The Tale \u2192 6']);

check('every unit in the table is one of the four the reader knows',
  (() => {
    const units = new Set();
    for (const e of rows) {
      if (e.moves) units.add(e.moves[2]);
      if (e.costs) units.add(e.costs[2]);
    }
    return [...units].sort();
  })(), ['CP', 'level', 'reset', 'set']);

// Every row has to say something: a row with neither a move nor a label would
// badge an empty string.
check('every row badges something', rows.filter((e) => !api.chwBadgeText(e).trim()).map((e) => e.name), []);

// The three numbers the guide shouts about.
check('the ransom, the target and the denouement',
  [api.CHW_RANSOM, api.CHW_TALE_TARGET, api.CHW_TALE_DENOUEMENT], [8, 3, 6]);

check('the Investigating road stops itself at 3, and the rules say why',
  [/Tale below 3/.test(row('Learn what you can about him').needs),
    /locks a part of the story out for good/.test(api.chwSpec(row('Learn what you can about him')).title)],
  [true, true]);

check('the rules warn about raising Banditry too early',
  /knocks Banditry back to 3/.test(api.chwSpec(row('Ambush one of his Raids')).title), true);

// Only one line on the Highwayman's card pays Fascinating...; the other four
// spend it, and a reader who took the wrong one would be stuck.
check('exactly one line on The Clay Highwayman, alone pays Fascinating',
  rows.filter((e) => e.storylet === api.CHW_ALONE && e.moves && e.moves[0] === 'Fascinating...')
    .map((e) => e.name), ['Take tea with the Clay Highwayman']);

// The larcenies have no option titles in the guide, so the whole ladder is on
// the card's own heading instead.
check('the five larcenies badge the ladder on the heading',
  (() => {
    const spec = api.chwStoryletSpec(key(api.CHW_LARCENIES[0]));
    return [api.CHW_LARCENIES.length, spec.text, /Casing\.\.\. \u221255 CP for 312\.50 Echoes/.test(spec.title)];
  })(), [5, 'Casing \u2192 up to 312.50 Echoes \u00b7 A Marauder +3 CP', true]);

check('the registered pass: the camp heading and two of its options',
  (() => {
    const open = makeHeading(api.CHW_CAMP, 'storylet-root__heading');
    const back = makeHeading('Allow yourself to be captured');
    const join = makeHeading('Join the Clay Highwayman\u2019s gang, with an assumed identity');
    roots = [open];
    branches = [back, join];
    api.chwRatings();
    const out = [text(open, api.CHW_CLASS), text(back, api.CHW_BRANCH_CLASS), text(join, api.CHW_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['the Tale \u00b7 3 before the ransom runs out, 6 to finish', 'Waiting on a Ransom \u2192 8',
    'become a Marauder \u00b7 in and out for one action \u25bc']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'clay-highwayman'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
