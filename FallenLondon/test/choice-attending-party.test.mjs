// Ad-hoc test for FallenLondon/choice-helper.js's Attending a Party badges
// ('attending-party').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's "maximum possible 19 CP" of Talk of the
// Town, which comes out of the rows if you take the best line it names at every
// Time; that each party card's label names exactly the Times its options are at;
// that every Favour the guide's Favours list names is on a badge, after it; the
// page-versus-guide disagreements carried as stated; and that a party card in
// the hand is labelled, never rated by one option.
//
// Numbers come from Attending a Party (Guide) and the card, storylet and
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-attending-party.test.mjs

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

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let branches = [];
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS', 'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS',
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { PARTY_TIMES, PARTY_STORYLETS, PARTY_CLASS, PARTY_BRANCH_CLASS, PARTY_CARD_CLASS, partySpec, partyStoryletSpec, partyRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
    + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
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
function otherStorylets(own) {
  return TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.storylet)).map(key).filter(Boolean);
}
const rows = api.PARTY_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
const tot = (e) => (e.win || []).filter((m) => m[0] === 'ToT').reduce((a, m) => a + m[1], 0);

// Reply and attend +2, spill wine +6 at 5, then +2 at 4, the Turkish Girl's +3
// at 3, +2 at 2 and +2 at 1, arriving punctually +2 at 6: 19.
check('the guide\'s best run adds up to its 19 CP',
  ['Reply and attend', 'Arrive punctually', 'Spill wine on a social rival', 'The delightful young thing',
    '...has taken her shoes off to dance', 'Express an opinion!', 'Mingle Freely'].map((n) => tot(row(n)))
    .reduce((a, b) => a + b, 0), 19);

check('each party card\'s label names the Times its options are at',
  Object.keys(api.PARTY_TIMES).map((card) => {
    const times = [...new Set(rows.filter((e) => e.storylet === card && e.at != null).map((e) => e.at))]
      .sort((a, b) => b - a);
    return [card, times.length ? 'Time ' + (times.length === 1 ? times[0]
      : times.slice(0, -1).join(', ') + ' and ' + times[times.length - 1]) : api.PARTY_TIMES[card]];
  }).filter((p) => p[1] !== api.PARTY_TIMES[p[0]]), []);

// The guide's Favours section: Hell at 6 and 1, Rubbery Men at 5 and 2, The Docks
// on a rare success at 3, Society at 2 (twice), 1 (twice) and 0.
check('every Favour the guide lists is carried, and on the badge after it',
  rows.filter((e) => e.factions).map((e) => [e.name, api.partySpec(e).text.endsWith(' · ' + api.factionText(e.factions))]),
  [['...bumps into you on the street outside', true], ['...is heading hopefully in your direction', true],
    ['Stick to something stately', true], ['...is confused by the cutlery', true],
    ['...is about to give a Whiskered Admiral a fit', true], ['...has turned an alarming shade of purple', true],
    ['...is arguing with the Jovial Contrarian', true], ['...asked you to bring a certain document along', true],
    ['...has a business proposition', true], ['You’ve not gone unnoticed', true]]);

check('the page is followed where the guide disagrees, and the tooltip says so',
  rows.filter((e) => e.guide).map((e) => [e.name, api.partySpec(e).title.includes('The guide says ' + e.guide)]),
  [['Trade airy theorems with the Dean of Epigraphical Mathematics', true], ['Have your Spindlewolf eavesdrop', true],
    ['“Reverend Professor Major Sir Henry Winthrop-Smythe.”', true], ['...has a space on her dance card', true],
    ['Attempt a fiery dance of the Elder Continent', true]]);

check('badges', ['Arrive fashionably late', '...is pretending you don’t exist', 'Gamble with the footmen',
  '...has turned an alarming shade of purple', 'You’ve not gone unnoticed', '“Harry.”'].map((n) => api.partySpec(row(n)).text),
['ToT +4 CP? · Time −2 · fail Time −2 · MW +1 CP', 'ToT +3 CP? / −2', 'Broken Giant ×2 · 50% · fail Time −2 · MW −3 CP',
  'ToT +2 CP? · fail Time −2 · Favours: Society +1', 'MW +20 CP · keeps ToT · Favours: Society +1', 'MW +2 CP?']);

check('a storylet heading says its Time',
  ['Arriving at the Party', 'The Last Dance', 'Taking your Leave', 'The Turkish Girl...']
    .map((s) => api.partyStoryletSpec(key(s)).text),
  ['Time 6', 'Time 3', 'Time 0', 'party card · Time 5, 4 and 3']);

check('a party card in the hand is labelled, and an option only in its own card',
  (() => {
    const card = makeHeading('The Brass Ambassador...');
    hand = [card];
    const option = makeHeading('...asked you to bring a certain document along');
    branches = [option];
    roots = [makeHeading('The Brass Ambassador...')];
    api.partyRatings();
    const out = [text(card, api.PARTY_CARD_CLASS), text(roots[0], api.PARTY_CLASS), text(option, api.PARTY_BRANCH_CLASS)];
    roots = [makeHeading('The Whiskered Admiral...')];
    api.partyRatings();
    out.push(text(option, api.PARTY_BRANCH_CLASS));
    hand = []; roots = []; branches = [];
    return out;
  })(),
  ['party card · Time 6, 5 and 1', 'party card · Time 6, 5 and 1', 'Secrets ×2? ▼ · Favours: Hell +1', null]);

check('no party option name is in another feature\'s table',
  (() => { const others = otherNames('PARTY_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no party storylet is another feature\'s',
  (() => { const others = otherStorylets('PARTY_OPTIONS');
    return api.PARTY_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'attending-party'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
