// Ad-hoc test for FallenLondon/choice-helper.js's Cave of the Nadir badges
// ('cave-of-the-nadir').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's leaving-penalty table, the hand's
// ranking and ▾, the strict gate in all three greeting states, badges, the
// disagreements, and a title shared by three cards resolving by the open one.
//
// Numbers come from Cave of the Nadir (Guide), its /Cards subpage and the
// Enter the Cave of the Nadir pages on fallenlondon.wiki, fetched through the
// API on 2026-09-15.
//
//   node tests/choice-cave-of-the-nadir.test.mjs

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
let branches = [];
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
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
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { factionText, NADIR_STORYLETS, NADIR_CARDS, NADIR_INDEX, NADIR_HAND, NADIR_STRICT, NADIR_CLASS, NADIR_BRANCH_CLASS, NADIR_CARD_CLASS,'
    + ' nadirLeaveLoss, nadirAllowed, zeeCardFor, nadirBadgeText, nadirSpec, nadirStoryletSpec, nadirRatings, carouselHandSpec, carouselLookup, '
    + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const rows = api.NADIR_OPTIONS;
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
const IN_CAVE = "It's Tester! Welcome to Cave of the Nadir, delicious friend!";
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

check('every strict name is a card here', api.NADIR_STRICT.filter((s) => !api.NADIR_CARDS.includes(s)), []);

check('the guide\'s leaving penalty, Irrigo 1 to 12',
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(api.nadirLeaveLoss), [1, 2, 3, 4, 5, 30, 35, 40, 45, 100, 105, 110]);

check('badges for each kind of row',
  [['Truth'], ['Where did the Rosers go?'], ['Bread'], ['Examine the site'], ['A special delivery?']]
    .map(([n]) => api.nadirBadgeText(row(n))),
  ['Enigma · 62.5 · Irrigo +2 ▼', 'Enigma? · 62.5 · Irrigo +2', 'Clue ×50 · Irrigo +1', 'Terror, or 12.5 with a Daughter',
   'Cinder + Robe · Fate 50']);

greeting = IN_CAVE;
check('a card in the hand: its best free option by value then Irrigo, ▾ when a gated one beats it',
  ['An Altarful of Strangers', 'A Waking Dream of Water', 'The End of Battles', 'Losing']
    .map((s) => api.carouselHandSpec(api.NADIR_HAND, s).text),
  ['Implication? · 2.5 · Irrigo +1', 'Secret · Irrigo +2 ▾', 'needs something ▾', 'needs something ▾']);

check('an ordinary card name is badged only on a greeting that says the Cave, in all three states',
  [IN_CAVE, IN_LONDON, null].map((g) => { greeting = g; return [api.nadirAllowed('Losing'), api.nadirAllowed('The End of Battles'),
    !!api.nadirStoryletSpec(key('The Web'))]; }),
  [[true, true, true], [false, true, false], [false, true, false]]);
greeting = null;

check('"The Sound of Wings", also a zee card, is never claimed by both: each gate needs its own greeting',
  [IN_CAVE, "It's Tester! Welcome to The Sea of Voices, delicious friend!", null].map((g) => {
    greeting = g;
    return [api.nadirAllowed('The Sound of Wings'), !!api.zeeCardFor('The Sound of Wings')];
  }),
  [[true, false], [false, true], [false, false]]);
greeting = null;

check('the card table disagrees with the guide in three rows, and says the table is followed',
  rows.filter((e) => e.guide).map((e) => [e.name, /table is followed/.test(api.nadirSpec(e).title)]),
  [['Speak with the Radical Factotum', true], ['Speak to the Rubbery Man', true], ['A casket marked with a black ribbon', true]]);

check('Run resolves under each of the three Waking Dreams',
  ['A Waking Dream of Motion', 'A Waking Dream of Reflections', 'A Waking Dream of Water']
    .map((s) => { const e = api.carouselLookup(api.NADIR_INDEX, 'Run', key(s)); return e && e.storylet; }),
  ['A Waking Dream of Motion', 'A Waking Dream of Reflections', 'A Waking Dream of Water']);

check('the registered pass: a gated hand card lifting with the greeting, and an opened card',
  (() => {
    const losing = makeHeading('Losing');
    const battles = makeHeading('The End of Battles');
    hand = [losing, battles];
    roots = [makeHeading('The End of Battles', 'storylet-root__heading')];
    const truth = makeHeading('Truth');
    branches = [truth];
    api.nadirRatings();
    const out = [text(losing, api.NADIR_CARD_CLASS), text(battles, api.NADIR_CARD_CLASS), text(roots[0], api.NADIR_CLASS),
      text(truth, api.NADIR_BRANCH_CLASS)];
    greeting = IN_CAVE;
    api.nadirRatings();
    out.push(text(losing, api.NADIR_CARD_CLASS));
    greeting = null;
    hand = []; roots = []; branches = [];
    return out;
  })(),
  [null, 'needs something ▾', 'Nadir card', 'Enigma · 62.5 · Irrigo +2 ▼', 'needs something ▾']);

check('no Cave of the Nadir name is in another feature\'s table',
  (() => { const others = otherNames('NADIR_OPTIONS');
    return rows.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'cave-of-the-nadir'), true);

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 5).
check('every faction result is on the badge, after it',
  api.NADIR_OPTIONS.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name || e.branch, (api.nadirBadgeText(e)).endsWith(' · ' + api.factionText(e.factions))]),
  [["A favour from the Factotum",true],["The dance goes on",true]]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
