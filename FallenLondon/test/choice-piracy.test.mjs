// Ad-hoc test for FallenLondon/choice-helper.js's Piracy badges
// ('piracy').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the five exchanges carry both their price and
// the Respected by the Corsairs they pay, and that the two agree -- 1,250
// treasure is exactly one change point in every row; that the six regions are
// all there with their plunder, chasing and bounty figures; that the eight
// treasure ports are the QUALITY page's and not the guide's; and that this
// feature owns neither of the two piracy CARDS, which are `zee-card-ratings`'s.
//
// Numbers come from Piracy (Guide), Matters Piratical, The Citadel within the Citadel and the option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-piracy.test.mjs

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
    'return { PIR_OPTIONS, PIR_INDEX, PIR_MATTERS, PIR_CITADEL, PIR_REGIONS, PIR_STASH_PORTS, PIR_CLASS, PIR_BRANCH_CLASS, pirBadgeText, pirSpec, pirStoryletSpec, pirRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.PIR_OPTIONS;
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


// Every exchange has to carry its price and what that price buys, and the two
// have to agree with the guide's own rule -- 1,250 Stashed Treasure is one
// change point of Respected by the Corsairs. A row that broke that would be a
// transcription slip no badge could show.
check('the five exchanges, their prices and their Respected',
  rows.filter((e) => e.cost != null).map((e) => [e.tag, e.cost, e.respected]),
  [['Candles \u00d75', 1250, 1], ['a Code of Honour', 1250, 1], ['a Safe Zee Lane', 6250, 5],
    ['a Salt Steppe Atlas', 6250, 5], ['a Fabulous Diamond', 31250, 25]]);

check('every price is 1,250 treasure to the change point of Respected',
  rows.filter((e) => e.cost != null).filter((e) => e.cost !== e.respected * 1250).map((e) => e.name), []);

check('badges for each shape of row',
  ['Exchange some plunder for five Mourning Candles', 'Exchange a hoard of plunder for a Fabulous Diamond',
    'Lower the Corsair\u2019s colours', 'Abandon your hunt for the (Bounty)'].map((n) => api.pirBadgeText(row(n))),
  ['Candles \u00d75 \u00b7 \u22121,250 \u00b7 Respected +1',
    'a Fabulous Diamond \u00b7 \u221231,250 \u00b7 Respected +25', 'flag down', 'drop the bounty']);

// The quarry's name stands where "(Bounty)" does, so the option has to match on
// the rest of the title or it goes unbadged for everybody.
check('the bounty option is matched whatever the quarry is called',
  ['Abandon your hunt for the Fearsome', 'Abandon your hunt for the war trimaran Undefeated Steppe',
    'Abandon your hunt for the (Bounty)'].map((n) => {
    const e = api.carouselLookup(api.PIR_INDEX, n, key(api.PIR_MATTERS));
    return e && e.label;
  }), ['drop the bounty', 'drop the bounty', 'drop the bounty']);

// Lowering the flag is three actions against the one it took to raise it, and
// that is the only number on this storylet a player can be surprised by.
check('lowering the colours costs three actions, and the tooltip says so',
  [row('Lower the Corsair\u2019s colours').actions,
    /Costs 3 actions\./.test(api.pirSpec(row('Lower the Corsair\u2019s colours')).title),
    row('Consult with your Blue Prophet').actions],
  [3, true, 0]);

check('the six zee regions, with plunder, chasing and a bounty each',
  [api.PIR_REGIONS.length,
    api.PIR_REGIONS.filter((r) => !r.plunder || !r.chase || !r.bounty).map((r) => r.region),
    api.PIR_REGIONS[0].region, api.PIR_REGIONS[5].region, api.PIR_REGIONS[5].bounty],
  [6, [], 'Home Waters', 'The Snares', 5659]);

// The guide's treasure-port table and the Directions to a Hidden Stash quality
// page disagree; the page wins, and these are its eight levels in order.
check('the eight treasure ports are the quality page\u2019s',
  api.PIR_STASH_PORTS,
  ['Hunter\u2019s Keep', 'Mutton Island', 'Port Carnelian', 'Polythreme', 'the Khanate', 'Port Cecil', 'Godfall',
    'the Iron Republic']);

check('the regional tables are on the Matters Piratical heading, not on a badge',
  (() => {
    const t = api.pirStoryletSpec(key(api.PIR_MATTERS)).title;
    return [/The Snares/.test(t), /5,659/.test(t), /Port Cecil/.test(t), /5,190/.test(t)];
  })(), [true, true, true, true]);

// The two piracy CARDS belong to zee-card-ratings. Three features can badge one
// card corner, so this one deliberately owns no card name at all.
check('neither piracy card is in this table',
  rows.map((e) => e.name).filter((n) => api.ZEE_CARDS.some((c) => key(c.name) === key(n))), []);

check('the registered pass: both headings, an exchange and a switch',
  (() => {
    const open = makeHeading(api.PIR_CITADEL, 'storylet-root__heading');
    const other = makeHeading(api.PIR_MATTERS, 'storylet__heading');
    const buy = makeHeading('Exchange some plunder for a Salt Steppe Atlas');
    const flag = makeHeading('Raise the Corsair\u2019s flag');
    roots = [open];
    heads = [other];
    branches = [buy, flag];
    api.pirRatings();
    const out = [text(open, api.PIR_CLASS), text(other, api.PIR_CLASS), text(buy, api.PIR_BRANCH_CLASS),
      text(flag, api.PIR_BRANCH_CLASS)];
    roots = []; heads = []; branches = [];
    return out;
  })(),
  ['five exchanges \u00b7 from 1,250', 'the flag, the bounty, the map',
    'a Salt Steppe Atlas \u00b7 \u22126,250 \u00b7 Respected +5', null]);

check('no Piracy name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PIR_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'piracy'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
