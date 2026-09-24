// Ad-hoc test for FallenLondon/choice-helper.js's Chthonic Communication
// badges ('chthonic-communication').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every rung badges the narrow quality it
// checks, because that is the only thing that varies across thirty-odd
// identical trades; that each mind's three tiers offer the same set of
// qualities, which is what makes the Steward of the Discordance rung worth
// finding; and that the badge carries the reward as well as the difficulty, so
// it never reads as a cost with nothing bought.
//
// Numbers come from Chthonic Communication (Guide), the three storylets and
// every option page on fallenlondon.wiki, fetched through the API on
// 2026-09-21.
//
//   node tests/choice-chthonic-communication.test.mjs

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
    'return { CCM_OPTIONS, CCM_INDEX, CCM_MINDS, CCM_CITY, CCM_CREDITOR, CCM_LONDON, CCM_STORYLETS, CCM_DIFF, CCM_TOP, CCM_LOCK, CCM_CLASS, CCM_BRANCH_CLASS, ccmBadgeText, ccmSpec, ccmStoryletSpec, ccmRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CCM_OPTIONS;
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

check('no Chthonic name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CCM_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);

check('three minds, and what each of them pays',
  api.CCM_MINDS.map((m) => [m.pays, m.actions, m.epa]),
  [['a Searing Enigma', 10, 4.7], ['a Primaeval Hint', 10, 4.7],
    ['a Stalemate, and Nightmares +5 CP', 13, 4.88]]);

// Two of the three cost items and one does not. A blank cost and a zero cost
// would be the same cell; a null says "nothing at all".
check('London is the free one',
  api.CCM_MINDS.map((m) => m.cost),
  ['Memory of a Much Lesser Self \u00d72', 'Memory of a Much Lesser Self \u00d72', null]);

// The tiers are what the badge exists for: you need one quality out of three
// or four, and the screen does not say which.
check('every mind offers the same qualities at every tier',
  (() => {
    const at = (storylet, tier) => api.CCM_OPTIONS
      .filter((e) => e.storylet === storylet && e.tier === tier && e.ch).map((e) => e.ch).sort();
    return [1, 2, 3].map((tier) => api.CCM_STORYLETS.map((s) => at(s, tier)))
      .map((sets) => sets.every((s) => JSON.stringify(s) === JSON.stringify(sets[0])));
  })(), [true, true, true]);

check('the tiers, in the order the guide gives them',
  [1, 2, 3].map((tier) => api.CCM_OPTIONS
    .filter((e) => e.storylet === api.CCM_CITY && e.tier === tier && e.ch).map((e) => e.ch)),
  [['Monstrous Anatomy', 'Shapeling Arts', 'Kataleptic Toxicology'],
    ['Artisan of the Red Science', 'Zeefaring', 'Steward of the Discordance'],
    ['Mithridacy', 'Glasswork', 'A Player of Chess', 'Chthonosophy']]);

// The one piece of advice the numbers contain: everything is 10 except this.
check('every check is 10 except the Steward rung, which is 4 on all three minds',
  (() => {
    const odd = api.CCM_OPTIONS.filter((e) => e.ch && e.diff);
    const rest = api.CCM_OPTIONS.filter((e) => e.ch && !e.diff);
    return [api.CCM_DIFF, odd.map((e) => [e.ch, e.diff]), rest.length];
  })(), [10, [['Steward of the Discordance', 4], ['Steward of the Discordance', 4],
    ['Steward of the Discordance', 4]], 27]);

// The badge is the quality AND the reward AND the menace: a difficulty alone
// would read as a price with nothing bought.
check('a rung badges the reward, the check and the failure',
  api.ccmBadgeText(row('Ingest the waters of Jericho')),
  'The Mind\u2019s Ascent +1 CP ? \u00b7 Kataleptic Toxicology 10 \u00b7 fail Nightmares +2 CP');

check('the cheap rung looks cheap',
  api.ccmBadgeText(row('Try not to understand', api.CCM_CITY)),
  'The Mind\u2019s Ascent +1 CP ? \u00b7 Steward of the Discordance 4 \u00b7 fail Nightmares +2 CP');

// Nightmares are a gate as well as a cost, which is the reason a failure
// matters more here than one lost action.
check('the rules say the Nightmares lock is 8',
  [api.CCM_LOCK, /LOCKED at Nightmares 8/.test(api.ccmSpec(row('Corral the city')).title)], [8, true]);

check('the fourth tier enters the mind and says the reward comes later',
  [api.CCM_TOP, api.ccmBadgeText(row('Know what you are to it'))],
  [4, 'enter the mind \u00b7 the reward is paid on the way out']);

check('the heading of each mind',
  api.CCM_STORYLETS.map((s) => api.ccmStoryletSpec(key(s)).text),
  ['a Searing Enigma \u00b7 10 actions \u00b7 4.7 Echoes an action',
    'a Primaeval Hint \u00b7 10 actions \u00b7 4.7 Echoes an action',
    'a Stalemate, and Nightmares +5 CP \u00b7 13 actions \u00b7 4.88 Echoes an action']);

// Two storylets carry an option called "Try not to understand"; each answers
// only for its own.
check('one title under two minds is two rows, and each is found under its own',
  ['Try not to understand'].concat([]).map(() => [
    api.carouselLookup(api.CCM_INDEX, 'Try not to understand', key(api.CCM_CITY)).storylet,
    api.carouselLookup(api.CCM_INDEX, 'Try not to understand', key(api.CCM_CREDITOR)).storylet,
    api.carouselLookup(api.CCM_INDEX, 'Try not to understand', key(api.CCM_LONDON)),
  ])[0], [api.CCM_CITY, api.CCM_CREDITOR, null]);

check('the registered pass: the London heading and two of its rungs',
  (() => {
    const open = makeHeading(api.CCM_LONDON, 'storylet-root__heading');
    const first = makeHeading('Reconfigure your own taxonomy');
    const cheap = makeHeading('Appeal to all the Londons that never were');
    roots = [open];
    branches = [first, cheap];
    api.ccmRatings();
    const out = [text(open, api.CCM_CLASS), text(first, api.CCM_BRANCH_CLASS), text(cheap, api.CCM_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['a Stalemate, and Nightmares +5 CP \u00b7 13 actions \u00b7 4.88 Echoes an action',
    'The Mind\u2019s Ascent +1 CP ? \u00b7 Shapeling Arts 10 \u00b7 fail Nightmares +2 CP',
    'The Mind\u2019s Ascent +1 CP ? \u00b7 Steward of the Discordance 4 \u00b7 fail Nightmares +2 CP']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'chthonic-communication'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
