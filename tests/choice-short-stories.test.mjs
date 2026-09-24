// Ad-hoc test for FallenLondon/choice-helper.js's Short Stories badges
// ('short-stories').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's Echo-difference column, the ladder a
// failed publish falls down, pages an action, the Luck options' expectations,
// rework caps and menaces, the guide disagreements, and the Make Your Name
// alias of the Begin storylet.
//
// Numbers come from Short Stories (Guide), its three table subpages and the
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-short-stories.test.mjs

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
    'return { STORY_STORYLETS, STORY_WRITE, STORY_REWORK, STORY_FINISH, STORY_CLASS, STORY_BRANCH_CLASS, storyBadgeText,'
    + ' storySpec, storyStoryletSpec, storyRatings, ' + TABLES.join(', ')
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
const rows = api.STORY_OPTIONS;
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
const tiers = rows.filter((e) => e.tier);
const LADDER = ['Unloved Short Story', 'Short Story', 'Competent Short Story', 'Compelling Short Story', 'Thrilling Short Story',
  'Exceptional Short Story', 'Extraordinary Short Story', 'Masterful Short Story', 'Celebrated Short Story', 'Classic Short Story'];
const VALUES = [1, 2, 10, 30, 50, 60, 70, 80, 130, 180];

check('the guide\'s Echo difference, success less failure',
  tiers.map((e) => e.tier.win[1] - e.tier.lose[1]), [1, 9, 20, 40, 30, 20, 20, 60, 100]);

check('every story is priced as the guide\'s Uses table has it',
  tiers.flatMap((e) => [e.tier.win, e.tier.lose]).filter((s) => VALUES[LADDER.indexOf(s[0])] !== s[1]).map((s) => s[0]), []);

check('a failure falls two tiers, except at acceptable and compelling',
  tiers.filter((e) => LADDER.indexOf(e.tier.win[0]) - LADDER.indexOf(e.tier.lose[0]) !== 2).map((e) => e.name),
  ['Potentially acceptable', 'Potentially compelling']);

check('pages an action, the whole difference between the writing options',
  ['Write.', 'Write rapidly.', 'Write frantically', 'Write frenziedly', 'Use your Ornate Typewriter']
    .map((n) => row(n).pages / row(n).actions), [1, 1.25, 1.5, 2, 1.25]);

check('badges for each kind of row',
  ['Write frenziedly', 'Laudanum!', 'Honey!', 'Add a dash of heartbreak', 'Weave in esoteric elements', 'Incorporate life-lessons',
   'A rare lesson', 'Potentially classic', 'Rework and Finish!'].map((n) => api.storyBadgeText(row(n))),
  ['Pages +6? · 3 actions', '≈Potential 0 Pages +2 +Wounds ▼', '≈Potential +0.4 Pages +1.6 ▼', 'Potential +5? to 115 ▼',
   'Potential +5? to 105 +Nightmares ▼', 'Potential +3 to 83 ▼', 'Potential +25 ▼', '180/80 Echoes?', '→ rework']);

check('Echoes of item a point of Potential, where the guide prices the item',
  ['Incorporate romance', 'Add a dash of heartbreak', 'Ask your most exalted contacts for inside information']
    .map((n) => api.storySpec(row(n)).title.match(/([0-9.]+) Echoes of item a point/)[1]), ['0.05', '0.5', '1.04']);

check('the guide disagrees with the pages in three rework rows',
  rows.filter((e) => e.guide).map((e) => e.name), ['A Cautious Edit', 'A Daring Edit', 'Add a touch of darkness']);

check('the registered pass, and the Make Your Name title of the Begin storylet',
  (() => {
    const frenzied = makeHeading('Write frenziedly');
    const write = makeHeading('Write a Short Story');
    branches = [frenzied, write];
    roots = [makeHeading('The Writer’s Desk: work on your story!')];
    api.storyRatings();
    const out = [text(roots[0], api.STORY_CLASS), text(frenzied, api.STORY_BRANCH_CLASS), text(write, api.STORY_BRANCH_CLASS)];
    roots = [makeHeading("Make Your Name – The Writer's Desk: Begin a Work")];
    api.storyRatings();
    out.push(text(frenzied, api.STORY_BRANCH_CLASS), text(write, api.STORY_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['pages', 'Pages +6? · 3 actions', null, null, '→ Potential 20']);

check('no Short Stories name is in another feature\'s table',
  (() => { const others = otherNames('STORY_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'short-stories'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
