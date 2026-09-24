// Ad-hoc test for FallenLondon/choice-helper.js's Venderbight badges
// ('venderbight').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The two options that pay one of two things at the game's choice, with no
//    odds anywhere. Reading either of them as the better half would make it the
//    best card in the hand; both are ranked at what they GUARANTEE and written
//    out as the choice they are.
//  - The hand's ranking: Nemesis first, then the stat change points, which is
//    the whole difference between Not quite silence's two options -- and the ▾
//    on the cards whose every line is bought with items, which is most of them.
//  - The one Luck option's expected value, and that it is marked ≈.
//  - The strict gate on "A Game of Chess" in all three greeting states: the
//    wiki disambiguates that title, and the greeting in the tomb-colony has
//    never been captured, so the gate may only ever confirm.
//  - That A woman of sinister repute, a storylet rather than a card, stays out
//    of the hand while still being badged where it stands.
//
// Numbers come from Venderbight (Guide) and the tomb-colony's card pages on
// fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node tests/choice-venderbight.test.mjs

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
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { VB_OPTIONS, VB_STORYLETS, VB_CARDS, VB_INDEX, VB_STRICT, VB_WINDOWS, VB_HAND, VB_REPUTE, VB_CLASS,'
    + ' VB_BRANCH_CLASS, VB_CARD_CLASS, vbAllowed, vbInColony, vbBadgeText, vbSpec, vbStoryletSpec, vbRatings, vbRank,'
    + ' vbEv, carouselHandSpec, carouselLookup, factionText, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS,'
    + ' VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, ' + TABLES.join(', ') + ' }; })();');
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
const rows = api.VB_OPTIONS;
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
const IN_COLONY = "It's Tester! Welcome to The tomb-colony of Venderbight, delicious friend!";
const IN_LONDON = "It's Tester! Welcome to Spite, delicious friend!";

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

check('every card has a Nemesis window, and the storylet says it is always there',
  [api.VB_STORYLETS.filter((s) => !api.VB_WINDOWS[s]), api.VB_WINDOWS[api.VB_REPUTE]],
  [[], 'Nemesis 11–14 · always there']);

check('every strict name is a card here', api.VB_STRICT.filter((s) => !api.VB_CARDS.includes(s)), []);

check('A woman of sinister repute is a storylet, not a card',
  [api.VB_CARDS.includes(api.VB_REPUTE), api.VB_STORYLETS.includes(api.VB_REPUTE)], [false, true]);

check('badges for each shape of row',
  ['Listen carefully', 'Fight for secrets', 'Join them', 'Bring him an Exceptional Hat',
    'Assist them – in exchange for information', 'Pass on', 'Listen and wait']
    .map((n) => api.vbBadgeText(row(n))),
  ['Nemesis +2? fail Suspicion +1', 'Nemesis +3? · Wounds +1 fail Suspicion +2 · Wounds +2', '≈Nemesis +1.2 ▼',
    'Nemesis +25 ▼', 'Nemesis +3 ▼ · Favours: Society −1', 'Dangerous +2', 'Nemesis +1? fail Nightmares +1']);

// Both pages give the game a free choice between two outcomes and no odds at
// all. Ranking either at its better half would put it top of the hand.
check('the two either-or options are written out and ranked at what they guarantee',
  ['Carouse with the dead', 'Snatch a bat out of the air!'].map((n) => {
    const e = row(n);
    return [api.vbBadgeText(e).includes(' or '), api.vbRank(e)[0], /the game’s choice/.test(api.vbSpec(e).title)];
  }),
  [[true, 2, true], [true, 0, true]]);

check('the one Luck option is an expected value, to one decimal',
  [api.vbEv(row('Join them')), api.vbBadgeText(row('Join them')).startsWith('≈')], [1.2, true]);

greeting = IN_COLONY;
check('a card in the hand: its best free option, the stat tie-break, and ▾ when items would do better',
  ['Not quite silence', 'An improbable fashion', 'A glass of oblivion', '‘Permanent Surgeon?’', 'Honey for the dead']
    .map((s) => api.carouselHandSpec(api.VB_HAND, s).text),
  ['Dangerous +2', 'needs something ▾', 'Nemesis +2 or +5? fail Suspicion +1 · Wounds +1',
    'Nemesis +2? fail Suspicion +1', 'needs something ▾']);
greeting = null;

check('the hand ranks A woman of sinister repute nowhere: it is not dealt',
  api.VB_HAND.storylets.includes(api.VB_REPUTE), false);

check('"Listen" resolves under each of its two cards',
  ['Not quite silence', 'Honey Tales', 'Marble?'].map((s) => {
    const e = api.carouselLookup(api.VB_INDEX, 'Listen', key(s));
    return e && e.storylet;
  }), ['Not quite silence', 'Honey Tales', null]);

check('the disambiguated wiki titles are carried as aliases',
  ['Listen 1', 'Listen 2', 'Join them (Nemesis)'].map((n) => rows.some((e) => (e.aliases || []).includes(n))),
  [true, true, true]);

check('the chess card is badged only on a greeting that says the tomb-colony, in all three states',
  [IN_COLONY, IN_LONDON, null].map((g) => {
    greeting = g;
    return [api.vbAllowed('A Game of Chess'), api.vbAllowed('Honey Tales'),
      !!api.vbStoryletSpec(key('A Game of Chess')), !!api.vbSpec(row('Go over when he beckons?'))];
  }),
  [[true, true, true, true], [false, true, false, false], [false, true, false, false]]);
greeting = null;

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 6).
check('every faction result is on the badge, after it',
  rows.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name, api.vbBadgeText(e).endsWith(' · ' + api.factionText(e.factions))]),
  [['Assist them – in exchange for information', true]]);

check('the rules line names the floor every card is worth playing against',
  /A woman of sinister repute pays 1 CP/.test(api.vbSpec(row('Listen carefully')).title), true);

check('the registered pass: a card in the hand, an opened card, its option, and the gate lifting',
  (() => {
    const inHand = makeHeading('Honey Tales');
    const chess = makeHeading('A Game of Chess');
    hand = [inHand, chess];
    const open = makeHeading('Honey Tales', 'storylet-root__heading');
    roots = [open];
    const branch = makeHeading('Listen');
    branches = [branch];
    api.vbRatings();
    const out = [text(inHand, api.VB_CARD_CLASS), text(chess, api.VB_CARD_CLASS), text(branch, api.VB_BRANCH_CLASS)];
    greeting = IN_COLONY;
    api.vbRatings();
    out.push(text(chess, api.VB_CARD_CLASS));
    greeting = null;
    hand = []; roots = []; branches = [];
    return out;
  })(),
  ['Nemesis +3? fail Suspicion +1', null, 'Nemesis +3? fail Suspicion +1', 'Nemesis +4? fail Nightmares +1']);

check('no Venderbight name is in another feature’s table',
  (() => {
    const others = otherNames('VB_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'venderbight'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
