// Ad-hoc test for FallenLondon/choice-helper.js's Cover Identities badges
// ('cover-identities').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that all nine ways of starting an identity fix a
// Ties, since Ties cannot be changed afterwards and decide which sales are
// open; that all four earned qualities carry the Suspicion they cost, which
// the guide's table leaves out and which is the whole link to Disappearing;
// and that the seven Backstory purchases carry points per ACTION, because the
// only two-action one would otherwise look better than it is.
//
// Numbers come from Cover Identities (Guide), Your Cabinet Noir: The Back Room and its eleven build option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-cover-identities.test.mjs

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
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CI_OPTIONS, CI_INDEX, CI_SALES, CI_CAPS, CI_BACKROOM, CI_CLASS, CI_BRANCH_CLASS, ciBadgeText, ciSpec, ciStoryletSpec, ciRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CI_OPTIONS;
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

check('no Cover Identities name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CI_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('nine ways to start, each fixing a Ties',
  rows.filter((e) => e.ties).map((e) => e.ties),
  ['none', 'Surface', 'Surface', 'Surface', 'Surface', 'Bazaar', 'Bazaar', 'Dispossessed', 'Dispossessed']);

check('every start states what it costs, except the free one',
  rows.filter((e) => e.ties).filter((e) => e.ties !== 'none' && !e.uses && !e.needs).map((e) => e.name), []);

// The Suspicion is on every point of the four earned qualities and is not in
// the guide's table at all -- it came off the option pages.
check('the four earned qualities, their caps and their Suspicion',
  rows.filter((e) => e.quality && e.quality !== 'Backstory')
    .map((e) => [e.quality, api.CI_CAPS[e.quality], e.suspicion]),
  [['Elaboration', 10, 3], ['Nuance', 6, 3], ['Witnesses', 6, 3], ['Credentials', 6, 3]]);

// Twelve in two actions is six a turn, which is worse than every other
// purchase but the smallest -- so the badge has to say per action.
check('the seven Backstory purchases, their points and their points per action',
  rows.filter((e) => e.quality === 'Backstory')
    .map((e) => [e.gain, e.perAction != null ? e.perAction : e.gain]),
  [[2, 2], [12, 6], [6, 6], [11, 11], [11, 11], [22, 22], [26, 26]]);

check('every Backstory purchase names what it spends',
  rows.filter((e) => e.quality === 'Backstory' && !e.uses).map((e) => e.name), []);

check('the nine sales, each with what it wants and what it pays',
  [api.CI_SALES.length, api.CI_SALES.filter((s) => !s.wants || !s.pays || !s.where).map((s) => s.to)],
  [9, []]);

check('the sales are on the heading, since none of them happens in this room',
  (() => {
    const t = api.ciStoryletSpec(key(api.CI_BACKROOM)).title;
    return [/a Veteran Revolutionary/.test(t), /Rumourmonger/.test(t), /Edicts of the First City/.test(t)];
  })(), [true, true, true]);

check('badges for each shape of row',
  ['Begin a cover identity with a background on the Surface', 'Begin to construct a cover identity',
    'Develop your cover identity more deeply', 'Make a very large number of Pawns follow your cover identity',
    'Embed your cover identity in the story of a terrible humiliation', 'Fence this identity']
    .map((n) => api.ciBadgeText(row(n))),
  ['Ties: Surface ▼ · Favours: The Great Game −1', 'Ties: none', 'Elaboration +1? · Suspicion +3',
    'Backstory +12 · 6 an action ▼', 'Backstory +26 ▼', 'Diamond ×(Backstory ÷ 5) ▾']);

// The three Favours starts spend a Favour, which is a faction result and so
// belongs on the badge, not in the tooltip alone.
check('the three Favours starts carry their faction on the badge',
  rows.filter((e) => e.factions).map((e) => api.ciBadgeText(e).endsWith(api.factionText(e.factions))),
  [true, true, true]);

check('the heading',
  api.ciStoryletSpec(key(api.CI_BACKROOM)).text, '9 ways to start · Backstory to 26 an action');

check('the Elaboration check says that it climbs as you go',
  /climbs by 10 for every point of Elaboration/.test(row('Develop your cover identity more deeply').note), true);

check('the registered pass: the back room heading, a start and a purchase',
  (() => {
    const open = makeHeading(api.CI_BACKROOM, 'storylet-root__heading');
    const start = makeHeading('Begin a cover identity tied to the less powerful classes');
    const buy = makeHeading('Present your cover identity as a key player in the Game');
    roots = [open];
    branches = [start, buy];
    api.ciRatings();
    const out = [text(open, api.CI_CLASS), text(start, api.CI_BRANCH_CLASS), text(buy, api.CI_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['9 ways to start · Backstory to 26 an action', 'Ties: Dispossessed ▼ · Favours: Urchins −1',
    'Backstory +6 ▼']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'cover-identities'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
