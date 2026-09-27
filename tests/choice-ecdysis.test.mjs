// Ad-hoc test for FallenLondon/choice-helper.js's Ecdysis badges ('ecdysis').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: every tier's success/failure CP and menace, that
// "Root yourself in place" (reused across two tiers under the same name, which
// `carouselLookup` could never tell apart) is merged into one row rather than
// two the lookup would silently drop, that the table does not extend past
// Preparing for Ecdysis tier 4-5 (the source guide stops there), and that no
// name here collides with another feature's table.
//
// Numbers come from Ecdysis (Guide) on fallenlondon.wiki, fetched through the
// API on 2026-09-27 (see docs/superpowers/research/2026-09-27-early-firmament.md
// section 1) -- guide-sourced only, individual option pages not yet
// cross-checked (noted in the table's own header comment in choice-helper.js).
//
//   node tests/choice-ecdysis.test.mjs

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

// Every other feature's own option table, so the collision test below can
// check ECDYSIS_OPTIONS against all of them.
const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'AOL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { ECDYSIS_OPTIONS, ECDYSIS_STORYLET, ECDYSIS_CLASS, ECDYSIS_BRANCH_CLASS,'
    + ' ecdysisBadgeText, ecdysisSpec, ecdysisStoryletSpec, ecdysisRatings, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const row = (name) => api.ECDYSIS_OPTIONS.find((e) => e.name === name);
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

// --- the table ---------------------------------------------------------

check('every option is filed under the one Ecdysis storylet',
  api.ECDYSIS_OPTIONS.filter((e) => e.storylet !== api.ECDYSIS_STORYLET).map((e) => e.name), []);

check('tier 1: three options, no challenge, always +2 CP, tendency randomised',
  ['Will your heart to slow', 'Close your eyes', 'Feel your breathing'].map((n) => {
    const e = row(n);
    return [e.ch || null, e.cp, e.tendency];
  }),
  [[null, 2, 'random'], [null, 2, 'random'], [null, 2, 'random']]);

check('tier 2-3 risk options: +2 CP success, +2 CP and a Nightmare on failure',
  ['Allow your blood to cool', 'Listen to your humours', "Assert the mind's dominance over the body"]
    .map((n) => { const e = row(n); return [e.cp, e.failCp, e.menace]; }),
  [[2, 2, ['Nightmares', 1]], [2, 2, ['Nightmares', 1]], [2, 2, ['Nightmares', 1]]]);

check('tier 4-5 risk options: +3 CP success, +3 CP and a Wound on failure',
  ['Reimagine yourself as something alarming', 'Reimagine yourself as something unpredictable',
    'Reimagine yourself as something malleable'].map((n) => { const e = row(n); return [e.cp, e.failCp, e.menace]; }),
  [[3, 3, ['Wounds', 1]], [3, 3, ['Wounds', 1]], [3, 3, ['Wounds', 1]]]);

check('"Root yourself in place" is ONE row (reused across two tiers under the same name), '
    + 'success is a range, failure is a flat 1, and it is marked safe',
  (() => { const e = row('Root yourself in place'); return [e.cp, e.failCp, e.safe]; })(),
  [[1, 2], 1, true]);

check('the table does not extend past tier 4-5 -- exactly 16 rows, this exact name list '
    + '(a regex on option NAMES could never catch a future tier-6+ row; pin the count and names instead)',
  [api.ECDYSIS_OPTIONS.length, api.ECDYSIS_OPTIONS.map((e) => e.name)],
  [16, ['Will your heart to slow', 'Close your eyes', 'Feel your breathing', 'Allow your blood to cool',
    'Listen to your humours', "Assert the mind's dominance over the body", 'Reimagine yourself as something alarming',
    'Reimagine yourself as something unpredictable', 'Reimagine yourself as something malleable',
    'Root yourself in place', 'Emerge as a freshly-made self', 'Open your eyes', 'Sharpen yourself',
    'Obscure some of your bones', 'Smile', 'Refashion yourself into something more malleable']]);

check('the cash-out value is Stuiver + Echoes, not Echoes for both (320 Stuiver, not 320 Echoes)',
  row('Emerge as a freshly-made self').value, '320 Stuiver + 37.5 E of items (53.5 E total)');

check('badge text: tier 1 (no challenge, no mark), a tier 2-3 risk option (challenge + tendency mark), '
    + 'the safe option (range + safe word, still marked since it also has a challenge)',
  ['Will your heart to slow', 'Allow your blood to cool', 'Root yourself in place'].map((n) => api.ecdysisBadgeText(row(n))),
  ['+2 CP ↻', '+2 CP? ▼', '+1–2 CP (safe)?']);

check('the safe option always has a lower success CP than its tier\'s risk options, at both tiers',
  (() => {
    const safe = row('Root yourself in place');
    const tier23 = row('Allow your blood to cool').cp;
    const tier45 = row('Reimagine yourself as something alarming').cp;
    return [safe.cp[0] < tier23, safe.cp[1] < tier45];
  })(),
  [true, true]);

check('the safe option\'s tooltip says it in words, not just a lower number',
  api.ecdysisSpec(row('Root yourself in place')).title.toLowerCase().includes('no menace risk'), true);

check('a risky row\'s tooltip states the challenge and the failure menace',
  (() => {
    const t = api.ecdysisSpec(row('Allow your blood to cool')).title;
    return [t.includes('Shapeling Arts + Chthonosophy'), t.includes('Nightmares')];
  })(),
  [true, true]);

check('the storylet spec answers only for the Ecdysis storylet, and null for anything else',
  [api.ecdysisStoryletSpec(key('Ecdysis: One More Lesson')) !== null,
    api.ecdysisStoryletSpec(key('Some Other Storylet'))],
  [true, null]);

// --- wiring --------------------------------------------------------------

check('the registered pass: storylet heading and branches only badge under the Ecdysis heading',
  (() => {
    const bloodCool = makeHeading('Allow your blood to cool');
    const unrelated = makeHeading('An Unrelated Option');
    branches = [bloodCool, unrelated];
    const out = [];
    roots = [makeHeading('Ecdysis: One More Lesson')];
    api.ecdysisRatings();
    out.push([text(roots[0], api.ECDYSIS_CLASS), text(bloodCool, api.ECDYSIS_BRANCH_CLASS), text(unrelated, api.ECDYSIS_BRANCH_CLASS)]);
    roots = [makeHeading('Some Other Storylet')];
    api.ecdysisRatings();
    out.push([text(roots[0], api.ECDYSIS_CLASS), text(bloodCool, api.ECDYSIS_BRANCH_CLASS), text(unrelated, api.ECDYSIS_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [['Ecdysis', '+2 CP? ▼', null], [null, null, null]]);

check('no Ecdysis name is in another feature\'s table',
  (() => { const others = otherNames('ECDYSIS_OPTIONS');
    return api.ECDYSIS_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'ecdysis'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
