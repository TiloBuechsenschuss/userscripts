// Ad-hoc test for FallenLondon/choice-helper.js's Law-Furnace badges
// ('law-furnace').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's base Actus Reus formula against its
// own example and at its boundaries, the badge for each kind of row, the four
// guide disagreements, and the Persona Non Grata alias.
//
// Numbers come from Law-Furnace (Guide) and its option and storylet pages on
// fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-law-furnace.test.mjs

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
    'return { LAW_OPTIONS, LAW_STORYLETS, LAW_CLASS, LAW_BRANCH_CLASS, lawBase, lawBadgeText, lawSpec, lawStoryletSpec,'
    + ' lawRatings, ' + TABLES.join(', ')
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
const row = (name) => api.LAW_OPTIONS.find((e) => e.name === name);
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

check('every option is filed under one of the four storylets',
  api.LAW_OPTIONS.filter((e) => !api.LAW_STORYLETS.includes(e.storylet)).map((e) => e.name), []);

check('the guide\'s example: 230 in all four stats is 480, and 1480 with a 1000 trade',
  [api.lawBase(230), api.lawBase(230) + row('Fuel the fires with legal errata').bonus], [480, 1480]);

check('the formula meets itself at 100, 150 and 190',
  [[99, 100, 101], [149, 150, 151], [189, 190, 191]].map((xs) => xs.map(api.lawBase)),
  [[99, 100, 102], [198, 200, 202.5], [297.5, 300, 304.5]]);

check('the average is rounded first', [api.lawBase(99.6), api.lawBase(150.4)], [100, 200]);

check('eight checks and six trades, one per Ceteris Paribus half',
  ['0–50', '51–100'].map((c) => [api.LAW_OPTIONS.filter((e) => e.ch && e.ceteris === c).length,
    api.LAW_OPTIONS.filter((e) => e.bonus && e.ceteris === c).length]),
  [[4, 3], [4, 3]]);

check('badges: a check, a trade, a payout, the way in',
  ['Thump it', 'Incinerate a stack of infernal paperwork', 'Take payment in spare parts',
   'Ask for tales on Hell’s false-saints', 'Enter the law-furnace’s chamber'].map((n) => api.lawBadgeText(row(n))),
  ['AR base?', 'AR base+2000 ▼', 'AR → Devices', 'AR → Hagiotoponyms', '→ furnace']);

check('the guide\'s narrow 8 against the pages\' 4, in exactly the advanced-skill checks',
  api.LAW_OPTIONS.filter((e) => e.guide).map((e) => [e.ch.stat, e.ch.diff, e.guide]),
  [['Chthonosophy', 4, 'Chthonosophy 8'], ['Glasswork', 4, 'Glasswork 8'],
   ['Artisan of the Red Science', 4, 'Artisan of the Red Science 8'], ['Mithridacy', 4, 'Mithridacy 8']]);

check('a trade\'s tooltip works its total out at each average',
  api.lawSpec(row('Feed the furnace ancient promises')).title.includes('average 230: 2980 Actus Reus'), true);

check('the registered pass, and Persona Non Grata opening Pro Rata\'s options',
  (() => {
    const thump = makeHeading('Thump it');
    const parts = makeHeading('Take payment in spare parts');
    branches = [thump, parts];
    const out = [];
    roots = [makeHeading('The Machinery of Law')];
    api.lawRatings();
    out.push([text(roots[0], api.LAW_CLASS), text(thump, api.LAW_BRANCH_CLASS), text(parts, api.LAW_BRANCH_CLASS)]);
    roots = [makeHeading('Persona Non Grata')];
    api.lawRatings();
    out.push([text(roots[0], api.LAW_CLASS), text(thump, api.LAW_BRANCH_CLASS), text(parts, api.LAW_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [['checks', 'AR base?', null], ['payout', null, 'AR → Devices']]);

check('no Law-Furnace name is in another feature\'s table',
  (() => { const others = otherNames('LAW_OPTIONS');
    return api.LAW_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'law-furnace'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
