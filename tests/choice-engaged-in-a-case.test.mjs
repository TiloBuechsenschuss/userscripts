// Ad-hoc test for FallenLondon/choice-helper.js's Engaged in a Case badges
// ('engaged-in-a-case').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The pages state every Pursue challenge at Case Difficulty 10; the guide's
//    formulas reproduce them on every row but Seek truth in gossip.
//  - The Luck options' expected Progress, and the badge for each kind of row.
//  - The guide disagreements, by name, and the costs worked out at 5 and 8.
//
// Numbers come from Engaged in a Case (Guide) and its option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-engaged-in-a-case.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

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
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    return [];
  },
  querySelector: () => null,
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
    'return { CASE_OPTIONS, CASE_STORYLETS, CASE_PURSUE, CASE_INDEX, CASE_CLASS, CASE_BRANCH_CLASS, caseBadgeText, caseSpec,'
    + ' caseStoryletSpec, caseDifficulty, caseExpected, caseRatings, ' + TABLES.join(', ')
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
const row = (name) => api.CASE_OPTIONS.find((e) => e.name === name);
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

check('twelve storylets: Pursue Your Current Case and eleven faction cards', api.CASE_STORYLETS.length, 12);

check('one title a storylet', api.CASE_STORYLETS.map((s) => api.CASE_OPTIONS.filter((e) => e.storylet === s).length)
  .filter((n, i) => i > 0 && n !== 1).length, 0);

check('every row makes Progress', api.CASE_OPTIONS.filter((e) => !(e.win > 0)).map((e) => e.name), []);

// --- the pages' Case Difficulty 10 -----------------------------------------

const PAGE_AT_10 = {
  'Ask anyone with an interest': 50, 'Frequent key locations': 50, 'Follow persons of interest': 60, 'Reason it out': 70,
  'Put together scraps of information': 45, 'Loosen tongues': 60, 'A view from above': 45, 'Enquire with devils': 45,
  'Seek truth in gossip': 35, 'Look to love': 45, 'Follow a lead': 45,
};

check('every Pursue challenge has a page figure', api.CASE_OPTIONS.filter((e) => e.ch).map((e) => e.name in PAGE_AT_10),
  Array(11).fill(true));

check('the guide\'s formulas reproduce the pages at Case Difficulty 10 on all but one',
  api.CASE_OPTIONS.filter((e) => e.ch && api.caseDifficulty(e.ch, 10) !== PAGE_AT_10[e.name]).map((e) => e.name),
  ['Seek truth in gossip']);

check('and that one says so', api.caseSpec(row('Seek truth in gossip')).title.includes('Watchful 35 at Case Difficulty 10'), true);

// --- Progress --------------------------------------------------------------

check('the Luck options\' expected Progress',
  api.CASE_OPTIONS.filter((e) => e.luck != null && e.lose !== e.win).map((e) => [e.name.replace(/^Solving a [Cc]ase: /, ''),
    api.caseExpected(e)]),
  [['Seek wisdom in the flights of bats', 2.4], ['A friendly face', 2.4], ['ask down by the river', 4.2],
   ['make enquiries in the demi-monde.', 4.2], ['ask among Revolutionaries', 3.8],
   ['seek knowledge from your infernal contacts', 5], ['ask your more refined contacts', 2.9],
   ['ask your clerical contacts', 3.5], ['ask Tomb-Colonists', 2.6]]);

check('badges for each kind of row',
  ['Ask anyone with an interest', 'Put together scraps of information', 'Seek wisdom in the flights of bats',
   'Solving a case: ask the spies of London', 'Solving a case: Reach out to the Constables',
   'Solving a case: ask your criminal contacts', 'Solving a case: ask down by the river'].map((n) => api.caseBadgeText(row(n))),
  ['Prog +6/+3? · 3 actions', 'Prog +6/+3? · 2 actions ▼', '≈Prog +2.4', 'Prog +10 ▼ · Favours: The Great Game −1', 'Prog +6',
   'Prog +7 ▼ · Favours: Criminals −1', '≈Prog +4.2 ▼ · Favours: The Docks −1']);

check('a scaling challenge and cost, worked out at the Poet\'s 5 and the Heiress\'s 8',
  (() => { const t = api.caseSpec(row('Put together scraps of information')).title;
    return [t.includes('20 at 5 (the Starving Poet), certain at 34; 35 at 8 (the Disappearing Heiress), certain at 59'),
      t.includes('Whispered Hint ×50 at 5, Whispered Hint ×80 at 8')]; })(),
  [true, true]);

check('the guide disagrees with the pages in four rows',
  api.CASE_OPTIONS.filter((e) => e.guide).map((e) => e.name),
  ['Follow a lead', 'Solving a case: ask down by the river', 'Solving a case: ask your criminal contacts',
   'Solving a case: make enquiries in the demi-monde.']);

// --- the registered pass ---------------------------------------------------

check('Pursue is summarised and badged; a faction card only badges its case option',
  (() => {
    const reason = makeHeading('Reason it out');
    const constables = makeHeading('Solving a case: Reach out to the Constables');
    branches = [reason, constables];
    const out = [];
    roots = [makeHeading('Pursue Your Current Case')];
    api.caseRatings();
    out.push([text(roots[0], api.CASE_CLASS), text(reason, api.CASE_BRANCH_CLASS), text(constables, api.CASE_BRANCH_CLASS)]);
    roots = [makeHeading('Court and Cell: the Constables')];
    api.caseRatings();
    out.push([text(roots[0], api.CASE_CLASS), text(reason, api.CASE_BRANCH_CLASS), text(constables, api.CASE_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [['Detective’s Progress', 'Prog +3/+1?', null], [null, null, 'Prog +6']]);

// --- no name in another table ----------------------------------------------

check('no Engaged in a Case name is in another feature\'s table',
  (() => { const others = otherNames('CASE_OPTIONS');
    return api.CASE_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'engaged-in-a-case'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
