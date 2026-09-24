// Ad-hoc test for FallenLondon/choice-helper.js's Pilgrimages in Godfall badges
// ('godfall').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the three Echo figures behind the ending
// agree with one another, that every Oblation is a pair of one paid option and
// one free one, the Airs window on every Path option, and the two marks --
// ▼ for what is spent, ▾ for what is only required.
//
// Numbers come from Pilgrimages in Godfall (Guide), the Shattered Citadel's storylet pages and the two ending option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node tests/choice-godfall.test.mjs

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
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { GF_OPTIONS, GF_STORYLETS, GF_INDEX, GF_PATH, GF_PROGRESS, GF_CLASS, GF_BRANCH_CLASS, GF_FAVOUR_ECHOES, GF_OBLATION_ECHOES, GF_ABSINTHE_ECHOES, GF_TITHE_BOTTLES, gfBadgeText, gfSpec, gfStoryletSpec, gfRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.GF_OPTIONS;
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

// The whole ending rests on three figures, and they only agree with each other
// at one price for a bottle: 7 bottles a Favour at 0.5 Echoes is the guide's
// 3.5, 4 bottles an Oblation is its 2.0, and the 28 bottles held back are the
// "tithe of 14 Echoes" the guide names. If one of them is ever corrected, this
// is where the other two have to follow.
check('the ending arithmetic agrees with itself',
  [7 * api.GF_ABSINTHE_ECHOES, 4 * api.GF_ABSINTHE_ECHOES, api.GF_TITHE_BOTTLES * api.GF_ABSINTHE_ECHOES],
  [api.GF_FAVOUR_ECHOES, api.GF_OBLATION_ECHOES, 14]);

check('every row is a label, a Favour gain or an Oblation trade',
  rows.filter((e) => !e.label && e.favour == null && e.spend == null && !e.tag).map((e) => e.name), []);

// Each Oblation is a pair: one option buys the goods with Favour, one takes
// the smaller goods for nothing. Badging only the bought half would hide the
// choice the storylet is.
check('each Oblation has one paid option and one free one, at its own Progress',
  Object.keys(api.GF_PROGRESS).map((s) => {
    const own = rows.filter((e) => e.storylet === s);
    return [own.filter((e) => e.spend != null).length, own.filter((e) => e.spend == null).length];
  }), [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]);

check('every Path option carries the Airs window it is offered in',
  rows.filter((e) => e.storylet === api.GF_PATH && !e.airs).map((e) => e.name), []);

check('badges for each shape of row',
  ['Weather the swarm', 'Loose your Sulky Bat', 'Finish an aborted batch', 'Perform the oblation of salt',
    'Scour the leavings of the zee', 'Return to Aeschaven', 'Hold on to your self']
    .map((n) => api.gfBadgeText(row(n))),
  ['Favour +2?', 'Favour +1 ▾', 'Favour +3 ▼', 'Diamond ×10 + Salts ×55 · Favour −3',
    'Deep-zee Catch ×4 · free', 'end · cash out', 'Favour +4?']);

// "free" and "Favour −0" would read alike and mean different things; the free
// half of a pair pays nothing AND earns no Oblation, which the tooltip says.
check('the free half of a pair says so, on the badge and in the tooltip',
  [/· free$/.test(api.gfBadgeText(row('Wait for the monks'))),
    /Costs no Favour, and no Oblation\./.test(api.gfSpec(row('Wait for the monks')).title),
    /Spends St Stalactite’s Favour ×1/.test(api.gfSpec(row('Perform the oblation of water')).title)],
  [true, true, true]);

check('▼ is what is spent and ▾ what is only required',
  [api.gfBadgeText(row('Finish an aborted batch')).endsWith('▼'),
    api.gfBadgeText(row('Serenade the Saint')).endsWith('▾')], [true, true]);

check('a heading says which half of the pilgrimage it is',
  [api.gfStoryletSpec(key(api.GF_PATH)).text, api.gfStoryletSpec(key('St Stalactite of the Halocline')).text,
    api.gfStoryletSpec(key('Nowhere in Godfall'))],
  ['an Airs of Godfall window', 'Oblation · Progress 9', null]);

check('the Favour a Path option pays is priced in the tooltip',
  /St Stalactite’s Favour \+4 \(14 Echoes\)/.test(api.gfSpec(row('Hold on to your self')).title), true);

check('the registered pass: a heading and an option under its open storylet',
  (() => {
    const list = makeHeading('St Stalactite of the Riven Way', 'storylet__heading');
    const open = makeHeading(api.GF_PATH, 'storylet-root__heading');
    const branch = makeHeading('Cross the room');
    const elsewhere = makeHeading('Perform the oblation of wine');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.gfRatings();
    const out = [text(list, api.GF_CLASS), text(open, api.GF_CLASS), text(branch, api.GF_BRANCH_CLASS),
      text(elsewhere, api.GF_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['Oblation · Progress 5', 'an Airs of Godfall window', 'Favour +3?', null]);

check('no row claims a faction result', rows.filter((e) => e.factions).map((e) => e.name), []);

check('no Pilgrimages in Godfall name is in another feature\u2019s table',
  (() => {
    const others = otherNames('GF_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'godfall'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
