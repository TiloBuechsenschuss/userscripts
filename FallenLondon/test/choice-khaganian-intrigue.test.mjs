// Ad-hoc test for FallenLondon/choice-helper.js's Khaganian Intrigue badges
// ('khaganian-intrigue').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the Airs retitles, because an option whose other
// ten names are missing goes unbadged on nine days out of ten; that the hours
// are on every badge that has a window, since Current Time in the Khanate is
// the thing a player loses track of; the options that pay more than the usual
// ten and the one that pays less; and that the intrigue starts carry the
// Infiltrating the scheme will want.
//
// Numbers come from Khaganian Intrigue (Guide), Khan's Heart, its nine storylets and the option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-khaganian-intrigue.test.mjs

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
    'return { KH_OPTIONS, KH_INDEX, KH_STORYLETS, KH_AGENTS, KH_OPPORTUNITIES, KH_BEGIN, KH_NEPHRITE, KH_DAWN, KH_CLASS, KH_BRANCH_CLASS, khBadgeText, khSpec, khStoryletSpec, khRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.KH_OPTIONS;
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


// Airs of the Khanate rewrites this title, so without the ten aliases the
// option is badged on none of the days it is actually offered.
check('the ten Airs bands, their agents and their rewards',
  [api.KH_AGENTS.length, api.KH_AGENTS[0].airs, api.KH_AGENTS[9].airs,
    api.KH_AGENTS.filter((a) => !a.who || !a.pays).map((a) => a.title)],
  [10, '0\u20139', '90\u2013100', []]);

check('Expand your network answers to every one of its ten titles',
  api.KH_AGENTS.map((a) => {
    const e = api.carouselLookup(api.KH_INDEX, 'Expand your network: Recruit ' + a.title, key(api.KH_BEGIN));
    return e && e.scheme;
  }), [130, 130, 130, 130, 130, 130, 130, 130, 130, 130]);

// Eleven opportunity titles, and five OTHER options on the same storylet begin
// "An opportunity:" -- which is why these are aliases and not a wildcard.
check('the eleven opportunity titles each find one row, and not a neighbour',
  api.KH_OPPORTUNITIES.map((o) => {
    const e = api.carouselLookup(api.KH_INDEX, 'An opportunity: ' + o, key(api.KH_BEGIN));
    return e && e.scheme;
  }), [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);

check('the five other "An opportunity:" options still answer for themselves',
  ['An opportunity: place one of your agents in London',
    'An opportunity: place an informant in the Wolf Khan\u2019s court',
    'An opportunity: another meeting with the Prodigal Wolf',
    'An opportunity: develop an asset in the Eagle Khan\u2019s court',
    'An opportunity: infiltrate the Khagan\u2019s court'].map((n) => {
    const e = api.carouselLookup(api.KH_INDEX, n, key(api.KH_BEGIN));
    return e && e.scheme;
  }), [750, 130, 130, 130, 130]);

// Ten a turn is the rule; these are every departure from it.
check('every option that does not pay the usual ten',
  rows.filter((e) => e.infiltrating != null && JSON.stringify(e.infiltrating) !== '10')
    .map((e) => [e.name, e.infiltrating]),
  [['Intimidate a Bureaucrat', [13, 14]], ['Arrange a realistic forgery', 16],
    ['Remove academic impediments to your scheme', 38], ['Direct your network', 5],
    ['Create a pause in events', 150], ['Exploit a gap', 150], ['Distribute bribes', 150],
    ['Implant misleading fantasies in the dreams of Taimen agents', 150],
    ['Position your pawns in all the right places', 150]]);

check('badges for each shape of row',
  ['Surveil the factories', 'Remove academic impediments to your scheme', 'Purchase a box of lightbulbs',
    'Confess your sins', 'Obtain a Corresponding Sounder', 'Plant a mirror']
    .map((n) => api.khBadgeText(row(n))),
  ['Infiltrating +10? \u00b7 Time 1\u20134', 'Infiltrating +38? \u00b7 Time 4\u20139 \u25bc',
    'Lightbulb \u00d7250 \u00b7 \u2212coins \u00d745 \u00b7 Time 1\u20134',
    'Infiltrating +10 \u00b7 Time 12', 'needs 750 \u00b7 a Corresponding Sounder',
    'needs 130 \u00b7 an Oneiromantic Revelation \u00b7 Favours: Fingerkings +1']);

// A faction result is never the tooltip's alone.
check('the one faction result is on the end of its badge',
  [api.khBadgeText(row('Plant a mirror')).endsWith(api.factionText(row('Plant a mirror').factions)),
    rows.filter((e) => e.factions).length],
  [true, 1]);

// Confess your sins and the five False-Dawn options have no challenge at all,
// so their badges must not carry the "?" that means one.
check('the guaranteed options carry no challenge mark',
  rows.filter((e) => e.sure).map((e) => api.khBadgeText(e).includes('?')),
  [false, false, false, false, false, false]);

check('every storylet with a clock window says so on its heading',
  api.KH_STORYLETS.map((s) => api.khStoryletSpec(key(s)).text),
  ['14 schemes \u00b7 from 20 Infiltrating', 'Time 1\u20134 \u00b7 up to Infiltrating +10',
    'Time 4\u20139 \u00b7 up to Infiltrating +10', 'Time 4\u20139 \u00b7 up to Infiltrating +14',
    'Time 4\u20139 \u00b7 up to Infiltrating +38', 'any hour \u00b7 up to Infiltrating +10',
    'Time 9\u201312 \u00b7 up to Infiltrating +10', 'any hour \u00b7 up to Infiltrating +10',
    'Time 1 \u00b7 up to Infiltrating +150']);

// Where the guide and the option page disagreed, the page won -- and the
// tooltip says both, because a player reading the guide will wonder.
check('the disagreements with the guide are in the tooltips',
  [/the page\u2019s narrow 8 makes 12 certain/.test(api.khSpec(row('Direct your network')).title),
    /the page\u2019s narrow 7 makes 11 certain/.test(api.khSpec(row('Play a game of shatar')).title),
    /the option page\u2019s figures/.test(api.khSpec(row('Commission the manufacture of a Crackling Device')).title)],
  [true, true, true]);

check('the registered pass: a quarter heading and two of its options',
  (() => {
    const open = makeHeading(api.KH_NEPHRITE, 'storylet-root__heading');
    const weapon = makeHeading('Start a market panic');
    const method = makeHeading('Surveil a merchant');
    roots = [open];
    branches = [weapon, method];
    api.khRatings();
    const out = [text(open, api.KH_CLASS), text(weapon, api.KH_BRANCH_CLASS), text(method, api.KH_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['any hour \u00b7 up to Infiltrating +10', 'Infiltrating +10? \u00b7 Time 1\u20134',
    'Infiltrating +10? \u00b7 Time 9\u201312']);

check('no Khaganian name is in another feature\u2019s table',
  (() => {
    const others = otherNames('KH_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'khaganian-intrigue'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
