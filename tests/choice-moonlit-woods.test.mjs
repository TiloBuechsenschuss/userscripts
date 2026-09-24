// Ad-hoc test for FallenLondon/choice-helper.js's Moonlit Woods badges
// ('moonlit-woods').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that all three spotting options say they END the
// walk, since spotting throws away whatever On the Scent and Time Remaining
// are left and that is the mistake the woods invite; that each quarry's
// requirement and payout are carried together, because the requirement is what
// decides which clearing to walk; and that a wander states what a failure
// still pays, both of them paying something.
//
// Numbers come from Moonlit Woods (Guide) and its six storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-moonlit-woods.test.mjs

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
    'return { MW_OPTIONS, MW_INDEX, MW_QUARRY, MW_STORYLETS, MW_GATE, MW_FRINGE, MW_GLADES, MW_BEFORE, MW_KEEPER, MW_CLASS, MW_BRANCH_CLASS, mwBadgeText, mwSpec, mwStoryletSpec, mwRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.MW_OPTIONS;
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

check('no Moonlit Woods name is in another feature\u2019s table',
  (() => {
    const others = otherNames('MW_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the three quarries, what they need and where',
  api.MW_QUARRY.map((q) => [q.quarry, q.scent, q.moonlit || null, q.where]),
  [['a Fox', 12, 5, 'Balmoral As Before'], ['Grouse', 12, null, 'The Wispish Fringe'],
    ['Red Deer', 20, null, 'Silvered Glades']]);

check('and what each is worth, in bones and with the Prosperity',
  api.MW_QUARRY.map((q) => [q.echoes, q.withProsperity, q.prosperity]),
  [[81, 93, 1200], [72, 82.8, 1080], [85, 97.6, 1260]]);

// Spotting throws away the rest of your On the Scent and Time Remaining, so
// every one of the three has to say so on the badge and in the tooltip.
check('every spotting option says it ends the walk',
  rows.filter((e) => e.quarry).map((e) => [e.name, api.mwBadgeText(e).endsWith('· ends the walk'),
    /ENDS the walk: whatever On the Scent and Time Remaining/.test(api.mwSpec(e).title)]),
  [['Track down the Capercaillie', true, true], ['Locate the source of the roaring', true, true],
    ['Track your quarry', true, true]]);

check('every quarry is spotted in exactly one clearing, and reported at the Keeper',
  [api.MW_QUARRY.map((q) => rows.filter((e) => e.quarry === q.quarry).length),
    api.MW_QUARRY.map((q) => !!row(q.report, api.MW_KEEPER))],
  [[1, 1, 1], [true, true, true]]);

// Both wanders pay on a failure, and the glades' one pays a Moonlit where the
// fringe's does not.
check('the two wanders and what a failure still pays',
  ['Wander the woods', 'Wander the glades'].map((n) =>
    [row(n).scent, row(n).moonlit || null, row(n).failScent, row(n).failMoonlit]),
  [[2, null, 1, 1], [2, 1, 1, 1]]);

check('the two bought trails, what they give and what they cost',
  rows.filter((e) => e.uses && e.scent != null).map((e) => [e.name, e.scent, e.moonlit, e.cost]),
  [['Lay a trail', 8, 1, 10], ['Darken the wood', 6, 1, 7.5]]);

check('badges for each shape of row',
  ['Compel the Ghillie to extend your visit', 'Keep to the fringes', 'Wander the glades', 'Lay a trail',
    'Track your quarry', 'Report a sighting of Red Deer'].map((n) => api.mwBadgeText(row(n))),
  ['Time +7 ▼', 'Time −1 · to the Wispish Fringe', 'Scent +2? · Moonlit +1', 'Scent +8 · Moonlit +1 ▼',
    'spot a Fox · needs Scent 12, Moonlit 5 · ends the walk', 'Red Deer · 85 Echoes, 97.6 with Prosperity']);

check('the headings name the quarry each clearing holds',
  api.MW_STORYLETS.map((s) => api.mwStoryletSpec(key(s)).text),
  ['buy Time Remaining · 8 is the minimum', 'three ways on, one of them free',
    'Grouse here · needs Scent 12', 'Red Deer here · needs Scent 20', 'a Fox here · needs Scent 12',
    'three sightings · to 85 Echoes']);

// Moonlit is the one thing kept between visits, and every use of it is
// outside the woods -- so the rules line has to list them.
check('the other uses of Moonlit are in the rules line',
  (() => {
    const t = api.mwSpec(row('Wander the glades')).title;
    return [/carries between visits/.test(t), /Risen Burgundy/.test(t), /Marigold Station/.test(t)];
  })(), [true, true, true]);

check('the registered pass: a clearing heading, a wander and its spotting option',
  (() => {
    const open = makeHeading(api.MW_GLADES, 'storylet-root__heading');
    const wander = makeHeading('Wander the glades');
    const spot = makeHeading('Locate the source of the roaring');
    roots = [open];
    branches = [wander, spot];
    api.mwRatings();
    const out = [text(open, api.MW_CLASS), text(wander, api.MW_BRANCH_CLASS), text(spot, api.MW_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Red Deer here · needs Scent 20', 'Scent +2? · Moonlit +1',
    'spot Red Deer · needs Scent 20 · ends the walk']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'moonlit-woods'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
