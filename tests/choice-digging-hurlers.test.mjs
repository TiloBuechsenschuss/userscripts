// Ad-hoc test for FallenLondon/choice-helper.js's Digging in the Hurlers
// badges ('digging-hurlers').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that a dig badges the FAILURE yield, because the
// curios are the failure reward and the guide's advice is to fail on purpose;
// that the rate is curios per point of Frigid Intuition, which is what makes
// the four Watchful sites comparable and the Hot Spring not; that the dig
// difficulty is carried as the formula 50 x Darkness rather than as the 150
// the option pages happen to show; and that the Salt Steppes line, which costs
// no Intuition at all, is not given a rate.
//
// Numbers come from Digging in the Hurlers (Guide), its /Tables subpage and
// every option page on fallenlondon.wiki, fetched through the API on
// 2026-09-21.
//
//   node tests/choice-digging-hurlers.test.mjs

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
    'return { DH_OPTIONS, DH_INDEX, DH_PREP, DH_STONES, DH_STORYLETS, DH_DARKNESS_FACTOR, DH_PAGE_DIFF, DH_PAGE_DARKNESS, DH_INTUITION_CAP, DH_DEVILESS, DH_CLASS, DH_BRANCH_CLASS, dhBadgeText, dhSpec, dhStoryletSpec, dhRate, dhRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.DH_OPTIONS;
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

check('no Digging name is in another feature\u2019s table',
  (() => {
    const others = otherNames('DH_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);

// Buying Intuition is one action whatever it buys, so the dearer lines are the
// cheaper ones. Both halves of that are on the badge.
check('the four preparations, and what they buy for what',
  rows.filter((e) => e.intuition != null).map((e) => [e.intuition, e.echoes]),
  [[2, 2.5], [3, 5], [4, 7], [6, 12.5]]);

check('a preparation badges the Intuition and the Echoes',
  api.dhBadgeText(row('Remember where to dig')), 'Intuition +6 \u00b7 12.50 Echoes \u25bc');

check('Intuition caps at 15 and the tooltip says so',
  [api.DH_INTUITION_CAP, /caps at 15/.test(api.dhSpec(row('Remember where to dig')).title)], [15, true]);

// The strange heart of the activity: the curios are the FAILURE reward.
check('every Watchful dig pays the same rate, and the badge leads with the failure',
  rows.filter((e) => e.cost && !e.luck && !e.certain).map((e) => [e.cost, e.curio, api.dhRate(e)]),
  [[1, 3, '3.0'], [2, 6, '3.0'], [2, 6, '3.0'], [3, 9, '3.0']]);

check('a dig says the curios come from failing',
  api.dhBadgeText(row('Locate a spot to dig in the ruins')),
  'Curio \u00d79 on a FAIL \u00b7 3.0 per Intuition ?');

check('the rules say to fail on purpose', /fail on purpose/.test(api.dhSpec(row('Locate a spot to dig in the wastes')).title),
  true);

// A formula and a snapshot of it are different claims.
check('the difficulty is the formula, with the page\u2019s 150 explained',
  [api.DH_DARKNESS_FACTOR, api.DH_PAGE_DIFF, api.DH_PAGE_DARKNESS,
    /50 \u00d7 Hurlers: Darkness/.test(api.dhSpec(row('Locate a spot to drill into the ice')).title),
    /shows 150, which is that formula at Darkness 3/
      .test(api.dhSpec(row('Locate a spot to drill into the ice')).title)],
  [50, 150, 3, true, true]);

// A Luck dig cannot be steered towards failing, so its better rate is not a
// better plan and the badge must not read as though it were.
check('the Hot Spring says its rate cannot be steered',
  api.dhBadgeText(row('Break a goat-demon free')),
  'Curio \u00d74-5 on a FAIL \u00b7 4.0-5.0 per Intuition \u00b7 50% Luck, cannot be steered');

// Dividing two curios by no Intuition is not "infinite", it is a different
// kind of line, and the badge says so in words.
check('the Salt Steppes line is not given a rate',
  (() => {
    const e = row('Offer to help a Sharp Hunter');
    return [e.cost, api.dhRate(e), api.dhBadgeText(e)];
  })(), [0, null, 'Curio \u00d72 \u00b7 no Intuition, no check']);

check('every exchange states what a curio is worth, and in which currency',
  rows.filter((e) => e.spend != null).map((e) => [e.spend, e.per, !!e.perScrip]),
  [[5, 2.25, false], [5, 5, true], [1, 6, false], [1, 2.5, false], [1, 5.7, false]]);

check('the Deviless ladder is a story, not a trade',
  api.DH_DEVILESS.map((d) => [d.at, d.curios]), [[2, 11], [3, 22], [4, 33], [5, null]]);

check('the registered pass: the preparation heading and two of its lines',
  (() => {
    const open = makeHeading(api.DH_PREP, 'storylet-root__heading');
    const cheap = makeHeading('Acquaint yourself with new vocabulary');
    const dear = makeHeading('Remember where to dig');
    roots = [open];
    branches = [cheap, dear];
    api.dhRatings();
    const out = [text(open, api.DH_CLASS), text(cheap, api.DH_BRANCH_CLASS), text(dear, api.DH_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Curios come from FAILING \u00b7 best rate 4.0-5.0 a point', 'Intuition +2 \u00b7 2.50 Echoes \u25bc',
    'Intuition +6 \u00b7 12.50 Echoes \u25bc']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'digging-hurlers'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
