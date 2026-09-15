// Ad-hoc test for FallenLondon/choice-helper.js's Flash Lays badges
// ('flash-lays').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the Auditor's difficulty is 2.5 times the
// Spirifer's on every row but one; Bide your time matches its page's formula;
// every obstacle has two free lines and two paid ones; the badges; and the
// hand badge with its ▾.
//
// Numbers come from Flash Lays (Guide)/Cards and the case and Make your Move
// pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-flash-lays.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { FLASH_STORYLETS, FLASH_CARDS, FLASH_HAND, FLASH_CLASS, FLASH_BRANCH_CLASS, FLASH_CARD_CLASS, flashBadgeText,'
    + ' flashSpec, flashRatings, carouselHandSpec, ' + TABLES.join(', ')
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
const rows = api.FLASH_OPTIONS;
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
  ].map(key);
}

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('the Auditor\'s difficulty is 2.5 times the Spirifer\'s on every row but one',
  rows.filter((e) => e.ch && Math.round(e.ch.lo * 2.5) !== e.ch.hi).map((e) => e.name),
  ['If you can’t trade on your reputation...']);

check('Bide your time matches its page: 25 × Venture Challenge Level 2 and 5',
  [row('Bide your time').ch.lo, row('Bide your time').ch.hi], [50, 125]);

check('every obstacle: two free lines for a Sleeve, and two that spend 5 or 8 for 25 Progress',
  rows.filter((e) => /^Obstacle:/.test(e.storylet)).reduce((acc, e) => {
    acc[e.storylet] = (acc[e.storylet] || []).concat(e.uses ? e.uses.replace(/\D/g, '') : 'free');
    return acc;
  }, {}),
  { 'Obstacle: an Awkward Friend': ['free', 'free', '5', '8'], 'Obstacle: an Importunate Constable': ['free', 'free', '5', '8'],
    'Obstacle: Legal Complications': ['free', 'free', '5', '8'], 'Obstacle: an Inconvenient Door': ['free', 'free', '5', '8'] });

check('badges for each kind of row',
  [['The Big Top'], ['Earn the favour of the Efficient Chef'], ['Frame your Awkward Friend'], ['Take the basement passage'],
   ['A strenuous masquerade'], ['Treat the staff as equals'], ['Bring your Friend to a meeting'], ['Follow them']]
    .map(([n]) => api.flashBadgeText(row(n))),
  ['Prog +7?', 'Sleeve +2?', 'Prog +25? ▼', 'Prog +5 +obstacle', 'Prog +7 · 3 actions', 'Sleeve +3? +Suspicion',
   'Sleeve +1 +Scandal', 'Informant 50%']);

check('the tooltip gives both marks\' difficulty',
  api.flashSpec(row('The Big Top')).title.includes('Watchful 83 for the Spirifer (certain at 139), 208 for the Auditor (certain at 347)'),
  true);

check('a card in the hand: its best free line, ▾ when a gated one makes more',
  ['A Competitor in Perfidy', 'An Embarrassing Encounter', 'Obstacle: an Awkward Friend']
    .map((s) => api.carouselHandSpec(api.FLASH_HAND, s).text),
  ['Prog +7?', 'Prog +3? ▾', 'Sleeve +1 +Scandal ▾']);

check('the registered pass: the hand, the opened card and its option',
  (() => {
    const inHand = makeHeading('An Embarrassing Encounter');
    hand = [inHand];
    roots = [makeHeading('An Embarrassing Encounter', 'storylet-root__heading')];
    const sorry = makeHeading('“So sorry – distant relation, honey-addled...”');
    branches = [sorry];
    api.flashRatings();
    const out = [text(inHand, api.FLASH_CARD_CLASS), text(roots[0], api.FLASH_CLASS), text(roots[0], api.FLASH_CARD_CLASS),
      text(sorry, api.FLASH_BRANCH_CLASS)];
    hand = []; roots = []; branches = [];
    return out;
  })(),
  ['Prog +3? ▾', 'flash card', null, 'Prog +5 +obstacle']);

check('no Flash Lays name is in another feature\'s table',
  (() => { const others = otherNames('FLASH_OPTIONS');
    return rows.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'flash-lays'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
