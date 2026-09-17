// Ad-hoc test for FallenLondon/choice-helper.js's Doing Business in Wilmot's
// End badges ('wilmots-business').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every Walking the Paths a choice can set leaves
// a storylet open at 2 and at 4; the Great Game Favour on the badge, after it;
// that the payout the game titles "An exchange of favours" is found under that
// plain title inside its own storylet only -- Working toward a Foreign Posting
// owns the plain title as a row name -- and the Luck card in the hand.
//
// Numbers come from Doing Business in Wilmot's End (Guide) and the storylet,
// card and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-wilmots-business.test.mjs

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { DBW, DBW_HAND, DBW_STORYLETS, DBW_CLASS, DBW_BRANCH_CLASS, dbwSpec, dbwRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.DBW_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);

check('every Paths a choice can set leaves a storylet open at Business 2 and at 4',
  [1, 2, 3].map((paths) => ['Business 2', 'Business 4'].map((at) => Object.entries(api.DBW.headings)
    .filter(([s, h]) => h.indexOf(at) === 0 && !/card|choose|cash/.test(h))
    .filter(([s, h]) => { const m = h.match(/Paths (\d)–(\d)/); return !m || (paths >= +m[1] && paths <= +m[2]); })
    .length > 0)), [[true, true], [true, true], [true, true]]);

check('the Great Game Favour is on the badge, after it',
  rows.filter((e) => e.factions).map((e) => [e.name, api.dbwSpec(e).text]),
  [['An exchange of favours 2', 'Stolen Kiss ×8 ▼ · Favours: The Great Game +1']]);

check('badges', ['Money. Power. The Game itself.', 'The long, twisting path', 'The Iron Way', '“Hard lessons”',
  'Make the deal', 'Keeping the Game moving'].map((n) => api.dbwSpec(row(n)).text),
['Business → 2 Paths → 2', 'Business +1 CP?', '≈Business +1.2 CP', 'Business → 4 Paths → 3', 'Legal Document',
  'Tension +1 CP']);

check('the Luck card in the hand, and the other card by its challenge',
  [api.carouselHandSpec(api.DBW_HAND, 'The Sights of Wilmot’s End').text,
    api.carouselHandSpec(api.DBW_HAND, 'A New Move in the Game').text],
  ['≈Business +1.2 CP', 'Business +1 CP?']);

check('"An exchange of favours" is answered here only inside its own storylet',
  (() => {
    const exchange = makeHeading('An exchange of favours');
    branches = [exchange];
    roots = [makeHeading('Another contact in the fog')];
    api.dbwRatings();
    const out = [text(roots[0], api.DBW_CLASS), text(exchange, api.DBW_BRANCH_CLASS)];
    roots = [makeHeading('The Value of Good Names')];
    api.dbwRatings();
    out.push(text(exchange, api.DBW_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Business 5 · cash in', 'Stolen Kiss ×8 ▼ · Favours: The Great Game +1', null]);

check('no Doing Business option name is in another feature\'s table',
  (() => { const others = otherNames('DBW_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Doing Business storylet is another feature\'s',
  (() => { const others = otherStorylets('DBW_OPTIONS');
    return api.DBW_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'wilmots-business'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
