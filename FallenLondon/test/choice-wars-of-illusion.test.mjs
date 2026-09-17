// Ad-hoc test for FallenLondon/choice-helper.js's Embroiled in the Wars of
// Illusion badges ('wars-of-illusion').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide-versus-page disagreements the tooltips
// admit to, each carried as a stated `guide` field so none of them is
// silently smoothed; the two Luck options at their expected value; every
// cash-in needing 5 of what it spends; the "Enough" and "Done for now" titles
// shared by several storylets resolving only inside their own; and the hand
// never picking the option the wiki files as impossible.
//
// Numbers come from Embroiled in the Wars of Illusion (Guide), its
// /Investigating Table and /Seeking Table, and the storylet, card and option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-wars-of-illusion.test.mjs

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
    'return { factionText, WOI_STORYLETS, WOI_HAND, WOI_CLASS, WOI_BRANCH_CLASS, WOI_CARD_CLASS, woiSpec, woiRatings, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.WOI_OPTIONS;
const row = (storylet, name) => rows.find((e) => e.storylet === storylet && e.name === name);

check('the guide\'s disagreements with the pages are all stated',
  rows.filter((e) => e.guide).map((e) => e.name),
  ['Raid a Message-Drop', 'Encounters in the Smoke', 'Intercept a Message', 'Dropping the Eaves',
    'Ask for help with a little sabotage', 'Remain sceptical', 'Attend the salon', 'Draw a satirical cartoon',
    'Write an opinion piece', 'Encourage the fight']);

check('every cash-in needs 5 of what it spends',
  rows.filter((e) => e.pays && e.uses && /reset/.test(e.uses)).filter((e) => !/5/.test(e.needs || '')).map((e) => e.name),
  ['Convoluted like a weasel']);

check('the Iguana and the Elver at their expected value',
  ['Deploy your Suspicious Iguana', 'Deploy your Unerring Elver'].map((n) => api.woiSpec(rows.find((e) => e.name === n)).text),
  ['≈Inv +1.4 CP', '≈Seek +1.4 CP']);

check('badges', [
  ['The Tricks of the Courier’s Trade', 'Spy on those who supply them'],
  ['The Heights of Chicanery', 'Dropping the Eaves'],
  ['Cats...', 'Make contacts among cat kind'],
  ['A Theosophistical Debate', 'Attend the salon'],
  ['A Philosophical Commission', 'Intellectual indignation'],
  ['Bats and Cats', 'Seeking'],
].map((p) => api.woiSpec(row(p[0], p[1])).text),
['Inv +3 CP? / −1', 'Clues ×536? / both −5 CP ▼', 'Cats +2 CP? ▼', 'Seek → 5', 'Seek −1 CP? / −1', 'free · → Seeking']);

check('the hand: Seeking decides, the impossible option is never the pick', [
  api.carouselHandSpec(api.WOI_HAND, 'A Theosophistical Decision').text,
  api.carouselHandSpec(api.WOI_HAND, 'A Theosophistical Debate').text,
  api.carouselHandSpec(api.WOI_HAND, 'A Theosophistical Occasion').text,
  api.carouselHandSpec(api.WOI_HAND, 'A Theosophistical Persuasion').text,
], ['Seek → 10', 'Seek → 5', 'needs something ▾', 'Amber ×112?']);

check('"Enough" is answered only inside the storylet it is open in',
  (() => {
    const enough = makeHeading('Enough');
    const spy = makeHeading('Spy on the couriers');
    branches = [enough, spy];
    roots = [makeHeading('Bats...')];
    api.woiRatings();
    const out = [text(roots[0], api.WOI_CLASS), text(enough, api.WOI_BRANCH_CLASS), text(spy, api.WOI_BRANCH_CLASS)];
    roots = [makeHeading('The Tricks of the Courier’s Trade')];
    api.woiRatings();
    out.push(text(enough, api.WOI_BRANCH_CLASS), text(spy, api.WOI_BRANCH_CLASS));
    roots = [makeHeading('A Tale of Something Else')];
    api.woiRatings();
    out.push(text(enough, api.WOI_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Making Use of Bats', 'free · to cash in', null, 'free · to cash in', 'Inv +2 CP?', null]);

check('a Theosophistical card in the hand',
  (() => {
    const card = makeHeading('A Philosophical Commission');
    hand = [card];
    api.woiRatings();
    const out = text(card, api.WOI_CARD_CLASS);
    hand = [];
    return out;
  })(), 'Seek +3 CP? / −1');

check('no Wars of Illusion option name is in another feature\'s table',
  (() => { const others = otherNames('WOI_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Wars of Illusion storylet is another feature\'s',
  (() => { const others = otherStorylets('WOI_OPTIONS');
    return api.WOI_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'wars-of-illusion'), true);

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 5).
check('every faction result is on the badge, after it',
  api.WOI_OPTIONS.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name || e.branch, (api.woiSpec(e).text).endsWith(' · ' + api.factionText(e.factions))]),
  [["Look for wealthy donors",true]]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
