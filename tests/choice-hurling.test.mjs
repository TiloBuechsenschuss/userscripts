// Ad-hoc test for FallenLondon/choice-helper.js's Hurling badges ('hurling').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that an ABSOLUTE Goat vs Goat change and a change
// IN FAVOUR OF YOUR BET are two different fields and read differently on the
// badge, because on one bet they agree and on the other they are opposites;
// that a line that can foul says so in words; that the Heptagoat's unrecorded
// swing stays unrecorded instead of being guessed; and that the four
// ordinary-English card names wait for the castle's greeting before they are
// badged in the hand.
//
// Numbers come from Hurling (Guide), the eleven cards and every option page on
// fallenlondon.wiki, fetched through the API on 2026-09-21.
//
//   node tests/choice-hurling.test.mjs

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
    'return { HR_OPTIONS, HR_CARDS, HR_INDEX, HR_WAGER, HR_END, HR_STORYLETS, HR_STAKE, HR_CLOCK, HR_EVEN, HR_FOULS, HR_LAWS, HR_CLASS, HR_BRANCH_CLASS, HR_HAND_CLASS, hrBadgeText, hrSpec, hrStoryletSpec, hrRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.HR_OPTIONS;
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

check('no Hurling name is in another feature\u2019s table',
  (() => {
    const others = otherNames('HR_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);

check('no Hurling card name is in another feature\u2019s table',
  (() => {
    const others = otherNames('HR_OPTIONS');
    return api.HR_CARDS.map((c) => c.name).filter((n) => others.includes(key(n)));
  })(), []);

// Every card in the hand table has options in the option table and the other
// way round: a card with no options would badge a summary of nothing.
check('the card table and the option table cover the same cards',
  (() => {
    const cards = new Set(api.HR_CARDS.map((c) => key(c.name)));
    const fromOptions = new Set(rows.map((e) => key(e.storylet))
      .filter((s) => s !== key(api.HR_WAGER) && s !== key(api.HR_END) && s !== key('Foul!')));
    return [[...cards].filter((c) => !fromOptions.has(c)), [...fromOptions].filter((s) => !cards.has(s))];
  })(), [[], []]);

// The trap this feature exists to avoid: no row may make both claims at once.
check('no row carries both an absolute swing and a favour swing',
  rows.filter((e) => e.gvg != null && e.favour !== undefined).map((e) => e.name), []);

check('the two claims read differently on the badge',
  ['Neglect to fan any flames', 'Do nothing to interfere'].map((n) => api.hrBadgeText(row(n))),
  ['GvG +6-9 ? \u00b7 fail \u22123 + Foul', 'GvG 7-9 your way ? \u00b7 fail 3-4 against + Foul']);

// A favour figure is unsigned on purpose; a signed one would be an absolute
// claim, and on a Second-Circle bet the wrong one.
check('a favour badge never carries a sign',
  rows.filter((e) => e.favour !== undefined && /GvG [+\u2212]/.test(api.hrBadgeText(e))).map((e) => e.name), []);

check('the tooltip says which circle a + helps',
  /helps the Second Circle WIN/.test(api.hrSpec(row('Neglect to fan any flames')).title), true);

// "Not recorded" is not "nothing".
check('the Heptagoat stays unrecorded',
  (() => {
    const e = row('Unleash your Heptagoat');
    return [e.favour, api.hrBadgeText(e), /not recorded anywhere/.test(api.hrSpec(e).title)];
  })(), [null, 'GvG: not recorded', true]);

// Every failure that adds a Foul! says so on the badge, since five of them
// undo the work.
check('a line that can foul says so in words',
  rows.filter((e) => !!e.foul !== api.hrBadgeText(e).includes('+ Foul')).map((e) => e.name), []);

check('the stake, the clock, the even score and the foul count',
  [api.HR_STAKE, api.HR_CLOCK, api.HR_EVEN, api.HR_FOULS], [15, 9, 100, 5]);

// The three outcomes and the three laws: one of them is the reason to play.
check('the three laws',
  api.HR_LAWS.map((l) => l[2]), ['Someone Following You', 'Frozen Thoughts', 'Another Mouth']);

check('exactly one line sets the score to a tie, and one burns clock alone',
  [rows.filter((e) => e.ties).map((e) => e.name), rows.filter((e) => e.clock).map((e) => e.name)],
  [['Don\u2019t scatter Attar across the field'], ['Allow the clock to run out']]);

// Losing the bet costs nothing but actions, which is why betting for the Law
// you want is a real strategy: the badge has to say so.
check('losing hands the stake back', api.hrBadgeText(row('Decline to accept your loss')),
  'you were wrong \u00b7 Scrip \u00d715 back');

// Four card names are ordinary English, so those four wait for the greeting.
check('the gated card names',
  api.HR_CARDS.filter((c) => c.strict).map((c) => c.name),
  ['Make Way!', 'Uncooperative', 'Frozen']);

check('a gated card is badged in the castle and nowhere else',
  (() => {
    const out = [];
    for (const where of ['Adulterine Castle', 'Ealing Gardens', null]) {
      greeting = where == null ? null : 'Welcome to ' + where + ', delicious friend';
      const card = makeHeading('Frozen', 'media__heading');
      hand = [card];
      api.hrRatings();
      out.push(text(card, api.HR_HAND_CLASS));
      hand = [];
    }
    greeting = null;
    return out;
  })(), ['GvG 6-9 your way \u00b7 80%', null, null]);

check('an unmistakable card name is badged wherever it is drawn',
  (() => {
    greeting = 'Welcome to Ealing Gardens, delicious friend';
    const card = makeHeading('The Goat\u2019s Gambit', 'media__heading');
    hand = [card];
    api.hrRatings();
    const out = text(card, api.HR_HAND_CLASS);
    hand = []; greeting = null;
    return out;
  })(), 'GvG 6-9 your way \u00b7 fail 3-4 against');

check('the registered pass: a card heading and one of its options',
  (() => {
    const open = makeHeading('Clash of the Ash', 'storylet-root__heading');
    const branch = makeHeading('Neglect to fan any flames');
    roots = [open];
    branches = [branch];
    api.hrRatings();
    const out = [text(open, api.HR_CLASS), text(branch, api.HR_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['GvG +6-9 \u00b7 fail \u22123', 'GvG +6-9 ? \u00b7 fail \u22123 + Foul']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'hurling'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
