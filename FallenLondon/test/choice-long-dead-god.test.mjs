// Ad-hoc test for FallenLondon/choice-helper.js's Mind of a Long-Dead God
// badges ('long-dead-god').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The guide's "38 actions to escape from Stormy-Eyed 19, 380 CP or 38
//    Screams", against the table's Stormy-Eyed losses.
//  - The ✗ mark: a challenge here pays on a FAILURE, and the failure odds.
//  - The pages that state odds rather than a difficulty, read as one above the
//    50% level.
//  - The Rain/Geology gate in all three greeting states, and the hand badge.
//
// Numbers come from The Mind of a Long-Dead God (Guide) and its card, storylet
// and option pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-long-dead-god.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

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
let list = [];
let branches = [];
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
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
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MIND_OPTIONS, MIND_STORYLETS, MIND_INDEX, MIND_CLASS, MIND_BRANCH_CLASS, MIND_CARD_CLASS, mindBadgeText,'
    + ' mindSpec, mindStoryletSpec, mindCardSpec, mindFailChance, mindRatings, carouselLookup, ' + TABLES.join(', ')
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
const row = (name) => api.MIND_OPTIONS.find((e) => e.name === name);
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
  ].map(key);
}

// --- the table is well formed ----------------------------------------------

check('every option is filed under a known card or storylet',
  api.MIND_OPTIONS.filter((e) => !api.MIND_STORYLETS.includes(e.storylet)).map((e) => e.name), []);

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of api.MIND_OPTIONS) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('every row either pays a reward or carries a label',
  api.MIND_OPTIONS.filter((e) => !e.label && !['Dangerous', 'Shadowy', 'Scream'].includes(e.pay)).map((e) => e.name), []);

check('a challenge row says what its success does instead',
  api.MIND_OPTIONS.filter((e) => (e.diff != null || e.luck != null) && !e.success).map((e) => e.name), []);

// --- the guide's escape ----------------------------------------------------

check('Stormy-Eyed 19 is 190 CP, which is the guide\'s 38 payouts, 380 CP or 38 Screams',
  (() => { const cp = 19 * 20 / 2; return [cp, cp / 5, cp / 5 * 10]; })(), [190, 38, 380]);

check('and every payout but one costs Stormy-Eyed 5 CP',
  api.MIND_OPTIONS.filter((e) => e.pay && (e.stormy || -5) !== -5).map((e) => e.name), ['Refuse the gift']);

// --- badges ----------------------------------------------------------------

check('badges: the reward, ✗ when a failure pays it, ≈ for the Luck option',
  ['I will climb to the very top', 'I will smash them! All of them!', 'Give me my sacrifice!', 'Who can argue with me?',
   'I will explain', 'I will pay whatever I am asked', 'But I am one of them'].map((n) => api.mindBadgeText(row(n))),
  ['Dangerous +10 ✗', 'Scream ×1 ✗', 'Dangerous +10', 'Scream ×1', '≈Dangerous +5', 'Fate 5 · out', 'avoid']);

check('the failure odds: 90% five below, 50% one below, 40% at, none four above',
  [16, 20, 21, 25].map((l) => api.mindFailChance(21, l)), [90, 50, 40, 0]);

check('pages stating odds instead of a difficulty are read one above their 50% level',
  ['I can reach it. I can!', 'I will stand in the sun!', 'I will call for the rain!', 'I will issue commands',
   'I will ask the mirror', 'Let me find sustenance'].map((n) => row(n).diff),
  [15, 15, 10, 15, 15, 10]);

check('a ✗ tooltip says the failure pays and what the success does',
  (() => { const t = api.mindSpec(row('I will climb to the very top')).title;
    return [t.includes('A FAILURE pays: Dangerous +10 CP, Stormy-Eyed -5 CP.'), t.includes('Success: Stormy-Eyed +1 CP')]; })(),
  [true, true]);

check('the guide disagrees with a page in exactly one row',
  api.MIND_OPTIONS.filter((e) => e.guide).map((e) => e.name), ['I can reach it. I can!']);

// --- the gate --------------------------------------------------------------

const GREETING_MIND = "It's Tester! Welcome to The Mind of a Long-Dead God, delicious friend!";
const GREETING_SPITE = "It's Tester! Welcome to Spite, delicious friend!";

check('Geology and Rain are summarised only on a greeting that says the Mind, in all three states',
  [GREETING_MIND, GREETING_SPITE, null].map((g) => {
    greeting = g;
    return [!!api.mindStoryletSpec(key('Geology')), !!api.mindCardSpec('Rain'), !!api.mindCardSpec('Frostbitten')];
  }),
  [[true, true, true], [false, false, true], [false, false, true]]);
greeting = null;

check('a card in the hand shows its options\' rewards side by side',
  api.mindCardSpec('Have I Been Possessed?').text, 'Scream ×1 | Shadowy +10');

// --- the registered pass ---------------------------------------------------

check('hand, opened storylet and option, and the gate lifting on the same hand',
  (() => {
    const possessed = makeHeading('Have I Been Possessed?');
    const rain = makeHeading('Rain');
    hand = [possessed, rain];
    roots = [makeHeading('The Oak Tree', 'storylet-root__heading')];
    const climb = makeHeading('I will climb to the very top');
    branches = [climb];
    const out = [];
    api.mindRatings();
    out.push([text(possessed, api.MIND_CARD_CLASS), text(rain, api.MIND_CARD_CLASS), text(roots[0], api.MIND_CLASS),
      text(roots[0], api.MIND_CARD_CLASS), text(climb, api.MIND_BRANCH_CLASS)]);
    greeting = GREETING_MIND;
    api.mindRatings();
    out.push([text(rain, api.MIND_CARD_CLASS)]);
    greeting = GREETING_SPITE;
    api.mindRatings();
    out.push([text(rain, api.MIND_CARD_CLASS), text(possessed, api.MIND_CARD_CLASS)]);
    greeting = null;
    hand = []; roots = []; branches = [];
    return out;
  })(),
  [['Scream ×1 | Shadowy +10', null, 'long-dead god', null, 'Dangerous +10 ✗'], ['Shadowy +10 ✗'],
   [null, 'Scream ×1 | Shadowy +10']]);

// --- no name in another table ----------------------------------------------

check('no Long-Dead God name is in another feature\'s table',
  (() => { const others = otherNames('MIND_OPTIONS');
    return api.MIND_OPTIONS.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'long-dead-god'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
