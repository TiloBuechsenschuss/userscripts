// Ad-hoc test for FallenLondon/choice-helper.js's Working toward a Foreign
// Posting badges ('foreign-posting').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's 14 actions to level 7, its two
// difficulties by tier (122 below 5, 125 at 5–6, 127 to conclude), The lobby
// as the one step whose failure makes no progress, the conclusions' Echo
// values, and that a badge is only drawn inside its own storylet.
//
// Numbers come from Working toward a Foreign Posting (Guide) and the storylet
// and option pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-foreign-posting.test.mjs

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { FP_STORYLETS, FP_CLASS, FP_BRANCH_CLASS, fpSpec, fpStoryletSpec, fpRatings, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.FP_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
const tier = (label) => rows.filter((e) => api.fpStoryletSpec(key(e.storylet)).text === label);

check('14 actions to level 7 at full success, as the guide says',
  28 / Math.max(...rows.filter((e) => e.win).map((e) => e.win[0][1])), 14);

check('the difficulty by tier: 122, 125 and 127',
  ['Posting 0–4', 'Posting 5–6', 'Posting 7 · cash in'].map((t) => [...new Set(tier(t).filter((e) => e.ch)
    .map((e) => e.ch.stat + ' ' + e.ch.diff))]),
  [['Persuasive 122'], ['Persuasive 125'], ['Persuasive 127']]);

check('The lobby is the one step whose failure makes no progress',
  rows.filter((e) => e.win && !e.lose).map((e) => e.storylet), ['The lobby']);

check('the conclusions\' Echo values are the guide\'s',
  rows.filter((e) => e.pays && e.pays.worth != null).map((e) => [e.name, e.pays.worth, e.pays.failWorth]),
  [['Charm your way into the committee room', 17.5, undefined], ['Another way', 18, 7.5], ['Escort duty', 18, 7.5],
    ['Off to see a gentleman of the press', 17.5, 8.5], ['An exchange of favours', 7.5, undefined],
    ['The Face of London', 17.5, undefined], ['Spies and diplomats and secrets', 12.5, undefined]]);

check('badges', ['A particularly foreign office', 'Can you make a good impression?', 'Another way',
  'Charm your way into the committee room', 'Decide not to take up your post'].map((n) => api.fpSpec(row(n)).text),
['Posting +2 CP?', 'Posting +2 CP? / +1', 'Documents ×36 · 18? / 7.5', 'Implications ×7 · 17.5? / menaces −1',
  'Legitimacy 100 + Maps']);

check('the Fate-locked steps say so',
  rows.filter((e) => /Fate-locked/.test(e.needs || '')).map((e) => e.name),
  ['An elegant distraction', 'Taking a look', 'Making use of an Agent', 'The man in the fez']);

check('the registered pass, with the wiki\'s disambiguated title',
  (() => {
    const option = makeHeading('Introduce yourself');
    branches = [option];
    roots = [makeHeading('The Agents of the Teeth')];
    api.fpRatings();
    const out = [text(roots[0], api.FP_CLASS), text(option, api.FP_BRANCH_CLASS)];
    roots = [makeHeading('The lobby')];
    api.fpRatings();
    out.push(text(option, api.FP_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Posting 0–4', 'Posting +2 CP? / +1', null]);

check('no Foreign Posting option name is in another feature\'s table',
  (() => { const others = otherNames('FP_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Foreign Posting storylet is another feature\'s',
  (() => { const others = otherStorylets('FP_OPTIONS');
    return api.FP_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'foreign-posting'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
