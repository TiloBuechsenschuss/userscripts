// Ad-hoc test for FallenLondon/choice-helper.js's A Church in the Wild badges
// ('church-in-the-wild').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that EVERY choice states which qualities it
// moves, since a choice that badged nothing would be exactly as opaque as the
// game leaves it; that the only six qualities in the table are the three
// opposed pairs the Bishop's Inspection compares, a seventh meaning a
// transcription slip; and the two mirrored options on The Devil's Due, which
// are the only rows in the feature that move a quality DOWN.
//
// Numbers come from A Church in the Wild (Guide) and its fifteen decision storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-church-in-the-wild.test.mjs

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
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS',
  'PB_OPTIONS', 'CH_OPTIONS', 'LH_OPTIONS', 'MX_OPTIONS', 'MG_OPTIONS', 'KA_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CH_OPTIONS, CH_INDEX, CH_PAIRS, CH_STORYLETS, CH_DEACON, CH_DUE, CH_UNBISHOP, CH_CLASS, CH_BRANCH_CLASS, chBadgeText, chSpec, chStoryletSpec, chRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CH_OPTIONS;
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

check('no Church name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CH_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the three opposed pairs',
  api.CH_PAIRS,
  [['Evangelism', 'Isolationism'], ['Ostentation', 'Humility'], ['Orthodoxy', 'Iconoclasm']]);

// A choice with no qualities on it is as opaque as the game leaves it, which
// is the whole reason this feature exists.
check('every choice that is not a way out states what it moves',
  rows.filter((e) => !e.gains && !e.label).map((e) => e.name), []);

// A seventh quality anywhere would be a transcription slip: the inspection
// only ever compares these six.
check('no choice moves a quality outside the three pairs',
  (() => {
    const known = api.CH_PAIRS.flat();
    return [...new Set(rows.filter((e) => e.gains).flatMap((e) => e.gains.map((g) => g[0]))
      .filter((q) => !known.includes(q)))];
  })(), []);

check('the two mirrored options are the only ones that move a quality down',
  rows.filter((e) => e.gains && e.gains.some((g) => g[1] < 0)).map((e) => e.name),
  ['Play wildly', 'Play softly']);

// They are exact mirrors: every quality one raises, the other lowers.
check('Play wildly and Play softly are exact mirrors, across all six',
  (() => {
    const wild = Object.fromEntries(row('Play wildly').gains);
    const soft = Object.fromEntries(row('Play softly').gains);
    const qualities = api.CH_PAIRS.flat();
    return qualities.filter((q) => wild[q] !== -soft[q]);
  })(), []);

check('badges for each shape of row',
  ['Invite the Clandestine Curate', 'Dedicate the Church to Saint Cecilia', 'Bury the Drummer-in-the-Depths',
    'Request the patronage of the Dean of Xenotheology'].map((n) => api.chBadgeText(row(n))),
  ['Evangelism +3',
    'Evangelism +1 · Humility +1 ▼ · Favours: The Church −3 · Favours: Hell −3',
    'Evangelism +5 · Isolationism +5 ▼',
    'Isolationism +3 · Humility +3 · Iconoclasm +3 ▾']);

// Every faction result is on the badge, never in the tooltip alone.
check('the faction rows carry their factions on the badge',
  rows.filter((e) => e.factions).every((e) => api.chBadgeText(e).endsWith(api.factionText(e.factions))), true);

// The tooltip has to name the pair, because a plus in one quality is a minus
// in the comparison that decides the church.
check('a tooltip names the comparison the choice decides',
  /Which decides: Evangelism against Isolationism/.test(api.chSpec(row('Invite the Clandestine Curate')).title),
  true);

check('the fifteen storylets, and how many choices each carries',
  api.CH_STORYLETS.map((s) => api.chStoryletSpec(key(s)).text.split(' ·')[0]),
  ['3 choices', '3 choices', '3 choices', '3 choices', '3 choices', '4 choices', '3 choices', '3 choices',
    '2 choices', '3 choices', '3 choices', '3 choices', '5 choices', '7 choices', '9 choices']);

check('the registered pass: a decision heading and two of its options',
  (() => {
    const open = makeHeading(api.CH_DEACON, 'storylet-root__heading');
    const curate = makeHeading('Invite the Clandestine Curate');
    const elsewhere = makeHeading('Play wildly');
    roots = [open];
    branches = [curate, elsewhere];
    api.chRatings();
    const out = [text(open, api.CH_CLASS), text(curate, api.CH_BRANCH_CLASS),
      text(elsewhere, api.CH_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['3 choices · all three pairs', 'Evangelism +3', null]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'church-in-the-wild'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
