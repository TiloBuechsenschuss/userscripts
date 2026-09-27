// Ad-hoc test for FallenLondon/choice-helper.js's The Midnight Trade badges
// ('midnight-trade').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here: every option's challenge/failure-menace pair (a
// flat table -- the guide gives one number per row and no per-option payout
// difference), that both checkless companion options are marked "always
// succeeds" and state their companion requirement rather than being silently
// ranked as free wins, that the two very-high broad checks (200) carry a
// tooltip warning, and that no name collides with another feature's table.
//
// Numbers come from The Midnight Trade (Guide) on fallenlondon.wiki, fetched
// through the API on 2026-09-27 (see
// docs/superpowers/research/2026-09-27-early-firmament.md section 2).
//
//   node tests/choice-midnight-trade.test.mjs

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
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'AOL_OPTIONS', 'ECDYSIS_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MIDNIGHT_TRADE_OPTIONS, MIDNIGHT_TRADE_STORYLET, MIDNIGHT_TRADE_CLASS, MIDNIGHT_TRADE_BRANCH_CLASS,'
    + ' midnightTradeBadgeText, midnightTradeSpec, midnightTradeStoryletSpec, midnightTradeRatings, ' + TABLES.join(', ')
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
const row = (name) => api.MIDNIGHT_TRADE_OPTIONS.find((e) => e.name === name);
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

check('all 8 options are filed under The Midnight Trade', [api.MIDNIGHT_TRADE_OPTIONS.length,
  api.MIDNIGHT_TRADE_OPTIONS.filter((e) => e.storylet !== api.MIDNIGHT_TRADE_STORYLET).length], [8, 0]);

check('every challenge/failure-menace pair, exactly as the guide states',
  ['Haul supplies to the Midnight Moon', 'Maintain the candle-guides', 'Shuttle contraband through the stalactite',
    'Load contraband onto departing dirigibles', 'Negotiate with visiting captains', 'Perform maintenance']
    .map((n) => { const e = row(n); return [e.ch.stat, e.ch.diff, e.fail]; }),
  [['Dangerous', 200, 'Wounds'], ['Watchful', 200, 'Nightmares'], ['Zeefaring', 13, 'Nightmares'],
    ['Dangerous', 200, 'Nightmares'], ['Mithridacy', 11, 'Wounds'], ['Watchful', 200, 'Nightmares']]);

check('both checkless companion options are marked and state their requirement',
  ['Offload your duties onto the Once-Dashing Smuggler', "Conduct Old Resurrection's personal work"].map((n) => {
    const e = row(n);
    return [e.checkless, e.needs, api.midnightTradeBadgeText(e)];
  }),
  [[true, 'a Rose companion', 'always succeeds'], [true, 'a Rose companion and Fate', 'always succeeds']]);

check('badge text for a real challenge names the stat, difficulty, challenge mark and menace',
  api.midnightTradeBadgeText(row('Haul supplies to the Midnight Moon')), 'Dangerous 200? ▲Wounds');

check('the two 200-difficulty checks carry a tooltip warning about a very high broad check',
  ['Haul supplies to the Midnight Moon', 'Load contraband onto departing dirigibles', 'Perform maintenance']
    .every((n) => api.midnightTradeSpec(row(n)).title.toLowerCase().includes('very high')),
  true);

check('a low-difficulty check does NOT carry that warning',
  api.midnightTradeSpec(row('Negotiate with visiting captains')).title.toLowerCase().includes('very high'), false);

check('every option gives the same Peligin Work progress, stated in the tooltip',
  api.MIDNIGHT_TRADE_OPTIONS.every((e) => api.midnightTradeSpec(e).title.includes('Peligin Work')), true);

check('the storylet spec answers only for The Midnight Trade',
  [api.midnightTradeStoryletSpec(key('The Midnight Trade')) !== null,
    api.midnightTradeStoryletSpec(key('Some Other Storylet'))],
  [true, null]);

check('wiring: badges only appear while The Midnight Trade is the open storylet',
  (() => {
    const haul = makeHeading('Haul supplies to the Midnight Moon');
    const unrelated = makeHeading('An Unrelated Option');
    branches = [haul, unrelated];
    const out = [];
    roots = [makeHeading('The Midnight Trade')];
    api.midnightTradeRatings();
    out.push([text(roots[0], api.MIDNIGHT_TRADE_CLASS), text(haul, api.MIDNIGHT_TRADE_BRANCH_CLASS), text(unrelated, api.MIDNIGHT_TRADE_BRANCH_CLASS)]);
    roots = [makeHeading('Some Other Storylet')];
    api.midnightTradeRatings();
    out.push([text(roots[0], api.MIDNIGHT_TRADE_CLASS), text(haul, api.MIDNIGHT_TRADE_BRANCH_CLASS), text(unrelated, api.MIDNIGHT_TRADE_BRANCH_CLASS)]);
    roots = []; branches = [];
    return out;
  })(),
  [['Midnight Trade', 'Dangerous 200? ▲Wounds', null], [null, null, null]]);

check('no Midnight Trade name is in another feature\'s table',
  (() => { const others = otherNames('MIDNIGHT_TRADE_OPTIONS');
    return api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'midnight-trade'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
