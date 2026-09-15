// Ad-hoc test for FallenLondon/choice-helper.js's Sunken Embassy badges
// ('sunken-embassy').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's "Min for 100%" against every broad
// difficulty, the one narrow disagreement, both halves of a spelunking badge,
// and the rewards' costs and the guide's Echoes per Fragment.
//
// Numbers come from The Sunken Embassy (Guide) and its option and storylet
// pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-sunken-embassy.test.mjs

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
    'return { EMB_OPTIONS, EMB_STORYLETS, EMB_SPELUNK, EMB_SPOILS, EMB_CLASS, EMB_BRANCH_CLASS, embBadgeText, embSpec,'
    + ' embStoryletSpec, embCertainAt, embRatings, ' + TABLES.join(', ')
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
const row = (name) => api.EMB_OPTIONS.find((e) => e.name === name);
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

check('every option is filed under one of the two storylets',
  api.EMB_OPTIONS.filter((e) => !api.EMB_STORYLETS.includes(e.storylet)).map((e) => e.name), []);

check('the guide\'s Min for 100%, from every challenge',
  api.EMB_OPTIONS.filter((e) => e.ch).map((e) => [e.name, api.embCertainAt(e.ch)]),
  [['Follow a trail of coded language', 84], ['Break open sealed chambers', 209], ['Seek out spy-holes', 297],
   ['Consult scholarly tomes', 150], ['Peel fact from falsehood', 9]]);

check('and the one row where the guide says otherwise', api.EMB_OPTIONS.filter((e) => e.guide).map((e) => [e.name, e.guide]),
  [['Peel fact from falsehood', 'certain at Mithridacy 10']]);

check('badges: both halves of a gamble, the use of a Scrap, and each reward\'s cost',
  ['Follow a trail of coded language', 'Break open sealed chambers', 'Seek out spy-holes', 'Consult scholarly tomes',
   'Locate an inner sanctum', 'Abandon the pages', 'Give an unreasonably sized sack of documents to the Brass Embassy',
   'Return to the surface'].map((n) => api.embBadgeText(row(n))),
  ['Frag +5?', 'Frag +25/−15?', 'Frag +38/−2?', 'Frag +37? ▼', 'Frag +32', 'Brass ×10 each', '100 → Verse', '→ spoils']);

check('the rewards\' costs and the guide\'s Echoes per Fragment',
  api.EMB_OPTIONS.filter((e) => e.cost != null).map((e) => [e.cost, e.rate]),
  [[0, 0.1], [50, 0.15], [100, null], [600, 0.104], [50, null], [100, 0.125], [600, 0.104]]);

check('a failure that costs Fragments says so in the tooltip',
  api.embSpec(row('Break open sealed chambers')).title.includes('Failure: Fragments −15.'), true);

check('the registered pass: spelunking, then the spoils',
  (() => {
    const chambers = makeHeading('Break open sealed chambers');
    const binder = makeHeading('Send a binder of documents to Mount Palmerston');
    branches = [chambers, binder];
    const out = [];
    roots = [makeHeading('Spelunking in the Sunken Embassy')];
    api.embRatings();
    out.push([text(roots[0], api.EMB_CLASS), text(chambers, api.EMB_BRANCH_CLASS), text(binder, api.EMB_BRANCH_CLASS)]);
    roots = [makeHeading('The Sunken Spoils')];
    api.embRatings();
    out.push([text(roots[0], api.EMB_CLASS), text(chambers, api.EMB_BRANCH_CLASS), text(binder, api.EMB_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [['Fragments', 'Frag +25/−15?', null], ['spoils', null, '50 → Memory ×3']]);

check('no Sunken Embassy name is in another feature\'s table',
  (() => { const others = otherNames('EMB_OPTIONS');
    return api.EMB_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'sunken-embassy'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
