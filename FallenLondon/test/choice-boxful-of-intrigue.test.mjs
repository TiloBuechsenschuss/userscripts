// Ad-hoc test for FallenLondon/choice-helper.js's A Boxful of Intrigue badges
// ('boxful-of-intrigue').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the shape of the carousel -- four bands, two
// storylets each, two options each, one per side -- because that symmetry is
// what makes the side the badge's one claim; the guide's 217 for a certain
// broad Shadowy 130; that the side is readable with the colour stripped off,
// which is the point of printing it in words; and that the six Correspondence
// Plaques in the guide's Echo figures are on Intercept the messages and not on
// any payout, since the guide's rewards table prints them against all six
// payouts and the payout pages give none.
//
// Numbers come from A Boxful of Intrigue (Guide) and the storylet and option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node FallenLondon/test/choice-boxful-of-intrigue.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { BOX_ROUNDS, BOX_REWARDS, BOX_SIDES, BOX_STORYLETS, BOX_INDEX, BOX_CHALLENGE, BOX_TARGET,'
    + ' BOX_ACTIONS, BOX_COLOR_CONSCIENCE, BOX_COLOR_GUARDIAN, BOX_CLASS, BOX_BRANCH_CLASS,'
    + ' boxBadgeText, boxSpec, boxStoryletSpec, boxRatings, broadCertainAt, carouselLookup, '
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
const rows = api.BOX_OPTIONS;
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
  ].map(key).filter(Boolean);
}

check('four bands, two storylets each, two options each',
  [...new Set(api.BOX_ROUNDS.map((e) => e.band.join('-')))].map((b) => {
    const own = api.BOX_ROUNDS.filter((e) => e.band.join('-') === b);
    return [b, new Set(own.map((e) => e.storylet)).size, own.length];
  }),
  [['0-3', 2, 4], ['4-6', 2, 4], ['7-9', 2, 4], ['10-12', 2, 4]]);

check('the bands run up to the ' + api.BOX_TARGET + ' that opens the payout, in ' + api.BOX_ACTIONS
  + ' actions',
  [Math.max(...api.BOX_ROUNDS.map((e) => e.band[1])) + 1, api.BOX_TARGET + 1], [13, 14]);

// Every storylet but the Salon offers one option per side, which is what makes
// "which side" the only thing a badge needs to say.
check('every storylet but the Salon has one option on each side',
  [...new Set(api.BOX_ROUNDS.map((e) => e.storylet))].map((s) =>
    [s, api.BOX_ROUNDS.filter((e) => e.storylet === s).map((e) => e.side).sort().join('/')]),
  [['An Agent of the Masters', 'Conscience/Guardian'], ['The Unionist', 'Conscience/Guardian'],
    ['Doing the Rounds', 'Conscience/Guardian'], ['The Course of Love', 'Conscience/Guardian'],
    ['A Night of Desperate Ambushes', 'Conscience/Guardian'], ['Encryption of a Sort', 'Conscience/Guardian'],
    ['A Salon of a Sort', 'Both/Both'], ['A Strong Box', 'Conscience/Guardian']]);

check('the guide\'s 217 for a certain broad Shadowy ' + api.BOX_CHALLENGE.diff,
  api.broadCertainAt(api.BOX_CHALLENGE.diff), 217);

// The badge has to be readable with the colour taken away, so the side is in
// the text of every round badge and the two colours differ as well.
check('every round badge names its side in words',
  api.BOX_ROUNDS.filter((e) => !/^(Conscience|Guardian|either side) /.test(api.boxBadgeText(e))).map((e) => e.name),
  []);

check('the two sides also take different colours',
  api.BOX_COLOR_CONSCIENCE !== api.BOX_COLOR_GUARDIAN
  && api.boxSpec !== undefined
  && [api.boxSpec(row('Expose him to the newspapers')).color,
    api.boxSpec(row('Help cover up the sordid business')).color],
  [api.BOX_COLOR_CONSCIENCE, api.BOX_COLOR_GUARDIAN]);

// Intercept the messages is the only round that pays goods, and it pays them
// whether you pass or fail -- three plays of it are where the guide's six
// Correspondence Plaques come from.
check('only Intercept the messages pays plaques, and its failure still pays them',
  [api.BOX_ROUNDS.filter((e) => e.plaques).map((e) => [e.name, e.plaques]),
    api.boxSpec(row('Intercept the messages')).title.includes('are paid anyway')],
  [[['Intercept the messages', 2]], true]);

check('no payout claims the six plaques, and each says where they really come from',
  [api.BOX_REWARDS.filter((e) => e.pays.some((p) => /Correspondence Plaque/.test(p[0]))).map((e) => e.name),
    api.BOX_REWARDS.every((e) => api.boxSpec(e).title.includes('Intercept the messages'))],
  [[], true]);

check('the bandaged gentlemen pay the most, and cost a Kingmaker',
  (() => {
    const best = api.BOX_REWARDS.reduce((a, b) => (b.echoes > a.echoes ? b : a));
    return [best.name, best.echoes, best.needs];
  })(),
  ['Send your report to certain bandaged gentlemen', 23, 'Empire’s Kingmaker 40']);

check('badges', [['Expose him to the newspapers'], ['Intercept the messages'],
  ['Steer the conversation to Mr Stones'], ['Share what you’ve learned with a Second-Storey Man'],
  ['Those who govern'], ['Memory is a strange old thing (10 FATE)']]
  .map(([n]) => api.boxBadgeText(row(n))),
  ['Conscience · Box +1?', 'Conscience · Box +1? · Plaques ×2', 'either side · Box +1?',
    'Stolen Correspondence ×300 + Criminals favour · 22 E', 'side: Conscience', 'Fate · play it again']);

// The Airs of London retitle one payout, so both titles have to find it.
check('the urchin payout is found under either of its two titles',
  ['Share what you’ve learned with a Cross', 'Share what you’ve learned with a Nought',
    'Share what you’ve learned with (an Urchin)']
    .map((t) => { const e = api.carouselLookup(api.BOX_INDEX, t, key('The Rewards of Intrigue')); return !!e; }),
  [true, true, true]);

check('storylet headings carry the band',
  ['An Agent of the Masters', 'A Strong Box', 'The Rewards of Intrigue', 'The Troubles So Far']
    .map((s) => api.boxStoryletSpec(key(s)).text),
  ['Box 0–3 · pick a side', 'Box 10–12 · pick a side', 'cash out', 'pick a side']);

check('the registered pass',
  (() => {
    const expose = makeHeading('Expose him to the newspapers');
    const gift = makeHeading('Accept a gift for your efforts');
    branches = [expose, gift];
    roots = [makeHeading('An Agent of the Masters')];
    api.boxRatings();
    const out = [text(roots[0], api.BOX_CLASS), text(expose, api.BOX_BRANCH_CLASS),
      text(gift, api.BOX_BRANCH_CLASS)];
    roots = [makeHeading('The Rewards of Intrigue')];
    api.boxRatings();
    out.push(text(roots[0], api.BOX_CLASS), text(expose, api.BOX_BRANCH_CLASS),
      text(gift, api.BOX_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Box 0–3 · pick a side', 'Conscience · Box +1?', null, 'cash out', null,
    'Bottle of Strangling Willow Absinthe ×35 · 20.5 E']);

check('no Boxful of Intrigue name is in another feature\'s table',
  (() => { const others = otherNames('BOX_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'boxful-of-intrigue'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
