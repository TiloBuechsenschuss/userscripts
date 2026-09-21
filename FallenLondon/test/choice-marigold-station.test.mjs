// Ad-hoc test for FallenLondon/choice-helper.js's Marigold Station badges
// ('marigold-station').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every recovery names the Fate it belongs to,
// since the Fate is invisible on the option itself and decides which pair of
// lines you are shown; that the item half and the check half of each pair stay
// two rows rather than one, because spending a Glass Gazette and risking a
// Persuasive 200 are not the same offer; that the Stationmaster and the Cerise
// Condottiere run the same loop and both are in the table; and that the one
// name this feature shares with another is shared on purpose.
//
// Numbers come from Marigold Station (Guide) and every storylet and option
// page on fallenlondon.wiki, fetched through the API on 2026-09-21.
//
//   node FallenLondon/test/choice-marigold-station.test.mjs

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
    'return { MR_OPTIONS, MR_INDEX, MR_FATES, MR_MASTER, MR_CONDOTTIERE, MR_DESTINY, MR_PAYMENT, MR_CHANDLER, MR_STORYLETS, MR_LOOP_ACTIONS, MR_EPA, MR_DIFF, MR_FLOWER_AT, MR_CLASS, MR_BRANCH_CLASS, mrBadgeText, mrSpec, mrStoryletSpec, mrRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.MR_OPTIONS;
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

// One name IS shared, on purpose: Helicon House's Prussian Salon has an
// option called "Accept a commission" too. Both features scope their lookups
// to their own open storylet, so neither can answer for the other's, and the
// game really does use the title twice.
check('the only name shared with another feature is the one the game repeats',
  (() => {
    const others = otherNames('MR_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), ['Accept a commission']);

check('and the two rows sit under different storylets',
  [row('Accept a commission').storylet,
    api.HH_OPTIONS.find((e) => e.name === 'Accept a commission').storylet].map((s) => key(s) === key(api.MR_MASTER)),
  [true, false]);

check('three Fates, each with its item, its check and its reward',
  api.MR_FATES.map((f) => [f.fate, f.item, f.stat, f.pays]),
  [[1, 'an Unprovenanced Artefact', 'Dangerous', 'a Verse of Counter-Creed'],
    [2, 'a Memory of a Much Lesser Self', 'Watchful', 'a Cave-Aged Code of Honour'],
    [3, 'a Glass Gazette', 'Persuasive', 'a Brass Ring']]);

// Two lines per Fate, and they are different KINDS of offer.
check('each Fate has exactly one item line and one check line',
  api.MR_FATES.map((f) => {
    const pair = rows.filter((e) => e.fate === f.fate);
    return [pair.length, pair.filter((e) => e.uses).length, pair.filter((e) => e.ch).length];
  }), [[2, 1, 1], [2, 1, 1], [2, 1, 1]]);

check('no recovery row claims both the item and the check',
  rows.filter((e) => e.fate && e.uses && e.ch).map((e) => e.name), []);

// The Fate leads the badge because nothing on the option says which one you
// drew.
check('a recovery badges its Fate first',
  ['Melt the candle', 'Coax out the Knight'].map((n) => api.mrBadgeText(row(n))),
  ['Fate 1 \u00b7 an Unprovenanced Artefact \u25bc \u2192 a Verse of Counter-Creed',
    'Fate 3 \u00b7 Persuasive 200 ? \u2192 a Brass Ring']);

check('every recovery check is broad at 200',
  [api.MR_DIFF, rows.filter((e) => e.ch && e.fate).map((e) => e.ch.diff)], [200, [200, 200, 200]]);

check('every check line states what a failure costs',
  rows.filter((e) => e.ch && e.fate && !e.fail).map((e) => e.name), []);

// Three options wear one title on each surrender storylet, so one row carries
// all three payouts.
check('the surrender is one row per storylet and names all three payouts',
  (() => {
    const both = rows.filter((e) => e.surrender);
    return [both.map((e) => e.storylet), api.mrBadgeText(both[0])];
  })(), [[api.MR_PAYMENT, api.MR_CHANDLER],
    '1: a Verse of Counter-Creed \u00b7 2: a Cave-Aged Code of Honour \u00b7 3: a Brass Ring']);

// The Condottiere replaces the Stationmaster and runs the same loop, so the
// badges have to survive the swap.
check('both masters run the loop',
  [api.MR_STORYLETS.includes(api.MR_MASTER), api.MR_STORYLETS.includes(api.MR_CONDOTTIERE),
    rows.filter((e) => e.name === 'Accept another commission').map((e) => e.storylet)],
  [true, true, [api.MR_MASTER, api.MR_CONDOTTIERE]]);

check('the loop is three actions at the guide\u2019s rate',
  [api.MR_LOOP_ACTIONS, api.MR_EPA], [3, 4.166]);

// Failing the climb into Hell pays fifty points of the quality it checks, so
// "failure" costs only the action and the badge must not read as a gamble.
check('the climb into Hell says a failure still pays',
  [api.mrBadgeText(row('Approach Hell\u2019s Walls')),
    row('Approach Hell\u2019s Walls').fail],
  ['climb it \u00b7 a failure pays +50 of the same quality',
    'Approaching Hell +50 \u2014 and nothing else']);

check('the fifth visit is the one that pays the Flower',
  [api.MR_FLOWER_AT, /5th pays The Flower from Hell/.test(api.mrSpec(row('Enter Hell')).title)], [5, true]);

check('the heading', api.mrStoryletSpec(key(api.MR_DESTINY)).text,
  'Marigolds \u00b7 3 actions, 4.166 Echoes an action');

check('the registered pass: the recovery heading and both halves of a Fate 2 pair',
  (() => {
    const open = makeHeading(api.MR_DESTINY, 'storylet-root__heading');
    const item = makeHeading('Put yourself in your quarry\u2019s shoes');
    const risk = makeHeading('Scour the earth');
    roots = [open];
    branches = [item, risk];
    api.mrRatings();
    const out = [text(open, api.MR_CLASS), text(item, api.MR_BRANCH_CLASS), text(risk, api.MR_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Marigolds \u00b7 3 actions, 4.166 Echoes an action',
    'Fate 2 \u00b7 a Memory of a Much Lesser Self \u25bc \u2192 a Cave-Aged Code of Honour',
    'Fate 2 \u00b7 Watchful 200 ? \u2192 a Cave-Aged Code of Honour']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'marigold-station'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
