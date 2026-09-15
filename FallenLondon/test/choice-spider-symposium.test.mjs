// Ad-hoc test for FallenLondon/choice-helper.js's Spider Symposium badges
// ('spider-symposium').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's Min for 100% and Average Gain, both
// derived from the table, the Academic Mood windows, and the badges.
//
// Numbers come from The Spider Symposium (Guide) and its option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-spider-symposium.test.mjs

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
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { SPIDER_STORYLET, SPIDER_CLASS, SPIDER_BRANCH_CLASS, spiderAverage, spiderBadgeText, spiderSpec, spiderRatings,'
    + ' broadCertainAt, ' + TABLES.join(', ')
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
const rows = api.SPIDER_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
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
const debate = rows.filter((e) => e.ch);

check('the guide\'s Min for 100%', debate.map((e) => api.broadCertainAt(e.ch.diff)), [84, 297, 384, 209, 209, 209]);

check('the guide\'s Average Gain is the success and a 25% rare success', debate.map((e) => api.spiderAverage(e) === e.guideAvg),
  Array(6).fill(true));

check('the two Mood-dealt options that share a difficulty cover the Mood between them',
  [row('Probe them on the nature of truth').mood, row('Suggest that language shapes thought').mood], ['0–49', '50–100']);

check('rewards cost more each step', rows.filter((e) => e.cost != null).map((e) => e.cost), [10, 60, 110, 235, 610]);

check('badges', ['Suggest that thought shapes language', 'Posit that language makes reality', 'Accept the contents of a large cocoon']
  .map((n) => api.spiderBadgeText(row(n))), ['Applause +5?', 'Applause +32/−19?', '235 → Emetic + Assistant']);

check('a tooltip carries the rare success and the average',
  api.spiderSpec(row('Probe them on the nature of truth')).title.includes('or +34 on a rare success'), true);

check('the registered pass',
  (() => {
    roots = [makeHeading('Propose a Pertinent Point')];
    const posit = makeHeading('Posit that language makes reality');
    branches = [posit];
    api.spiderRatings();
    const out = [text(roots[0], api.SPIDER_CLASS), text(posit, api.SPIDER_BRANCH_CLASS)];
    roots = [];
    api.spiderRatings();
    out.push(text(posit, api.SPIDER_BRANCH_CLASS));
    branches = [];
    return out;
  })(),
  ['Applause', 'Applause +32/−19?', null]);

check('no Spider Symposium name is in another feature\'s table',
  (() => { const others = otherNames('SPIDER_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'spider-symposium'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
