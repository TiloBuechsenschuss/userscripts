// Ad-hoc test for FallenLondon/choice-helper.js's Hunting Bees in Old Newgate
// badges ('hunting-bees').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the badge names the ATTRIBUTE, because which
// one a line is checked on is set by Dagger or Flint and drifts under you, so
// an option is not the same option two actions later; the guide's "Min for
// 100%" against the difficulty × 5 ÷ 3; the three Airs windows where the guide
// and the option pages disagree by a point, with the pages followed; and the
// badges.
//
// Numbers come from Hunting Bees in Old Newgate (Guide) and the storylet and
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node tests/choice-hunting-bees.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { HB_OPTIONS_RAW, HB_REWARDS, HB_WAYS, HB_STORYLETS, HB_INDEX, HB_FLINT_MAX, HB_SURPLUS,'
    + ' HB_CLASS, HB_BRANCH_CLASS, hbBadgeText, hbSpec, hbStoryletSpec, hbRatings, broadCertainAt,'
    + ' carouselLookup, ' + TABLES.join(', ')
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
const rows = api.HB_ALL;
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
  ].map(key).filter(Boolean);
}

check('three storylets: the way in, the grind and the payout',
  api.HB_STORYLETS, ['Flint or Dagger', 'The Caging of Bees', 'Hunt Bees in Old Newgate']);

// The side is which ATTRIBUTE the line is checked on, and the two sides mirror
// each other option for option.
check('Flint\'s three options are Watchful where Dagger\'s are Dangerous, defections aside',
  ['Flint', 'Dagger'].map((side) =>
    api.HB_OPTIONS_RAW.filter((e) => e.side === side).map((e) => e.ch.stat + ' ' + e.ch.diff)),
  [['Watchful 88', 'Watchful 230', 'Dangerous 125'],
    ['Dangerous 88', 'Dangerous 230', 'Watchful 125']]);

check('a defection is checked on the side you are going TO',
  ['Defect to the Dagger', 'Defect to the Flint'].map((n) => [row(n).side, row(n).ch.stat]),
  [['Flint', 'Dangerous'], ['Dagger', 'Watchful']]);

check('every broad challenge\'s "Min for 100%" is the difficulty × 5 ÷ 3',
  api.HB_OPTIONS_RAW.filter((e) => !e.ch.narrow && api.broadCertainAt(e.ch.diff) !== e.sure)
    .map((e) => [e.name, api.broadCertainAt(e.ch.diff), e.sure]), []);

check('the two narrow challenges are the guide\'s difficulty plus five',
  api.HB_OPTIONS_RAW.filter((e) => e.ch.narrow).map((e) => [e.ch.stat, e.ch.diff, e.sure]),
  [['Monstrous Anatomy', 2, 7], ['Mithridacy', 5, 10]]);

// Three Airs windows disagree between the guide and the option pages by a
// point. The pages are followed, and each of those rows says so.
check('the three disputed Airs windows follow the option pages, and say so',
  api.HB_OPTIONS_RAW.filter((e) => e.airs && /option page says/.test(e.note || ''))
    .map((e) => [e.name, e.airs]),
  [['Hunt a swarm of drones', '26–75'], ['Keep to the shadows', '51–100'],
    ['Commune with the bees', '76–100']]);

check('the two leader options are the biggest non-Airs payouts',
  api.HB_OPTIONS_RAW.filter((e) => e.side !== 'Airs')
    .reduce((best, e) => (e.bees > best.bees ? e : best)).bees, 38);

check('every reward but the early one pays out at 50, 100 or 600 Bees',
  api.HB_REWARDS.map((e) => e.bees), [null, 50, 100, 600, 50, 100, 600]);

check('the two halves of the payout pay their surplus in different goods',
  [...new Set(api.HB_REWARDS.map((e) => e.surplus))], ['Whispered Hint', 'Foxfire Candle Stub']);

check('badges', ['Set an ambush', 'Become leader of the Dagger', 'Betray both sides',
  'Hunt a swarm of drones', 'Let the bees free', 'Taste honey from an inordinate amount of bees',
  'Choose DAGGER'].map((n) => api.hbBadgeText(row(n))),
  ['Bees +25? −6 · Watchful 88', 'Bees +38? · Dangerous 230',
    'Bees +31? · Dangerous 125', 'Bees +25? −6 · Monstrous Anatomy 2',
    'under 50 Bees · Hints only', 'Bees 600 → Revelation ×1',
    'side: Dagger · Dangerous']);

check('an Airs option\'s tooltip names its window, and a side option its side',
  [api.hbSpec(row('Commune with the bees')).title.includes('offered at 76–100'),
    api.hbSpec(row('Set an ambush')).title.includes('while you are Flint (Dagger or Flint 0–50)')],
  [true, true]);

check('storylet headings',
  ['Flint or Dagger', 'The Caging of Bees', 'Hunt Bees in Old Newgate']
    .map((s) => api.hbStoryletSpec(key(s)).text),
  ['grind Bees Caught', 'cash out', 'the way in · pick a side']);

// The game titles the way out plainly "Escape", which On a Heist already owns a
// row for, so the row is filed under the wiki's disambiguated title and matched
// through an alias.
check('the plain "Escape" still finds the disambiguated row',
  (() => { const e = api.carouselLookup(api.HB_INDEX, 'Escape', key('Flint or Dagger'));
    return e && [e.name, api.hbBadgeText(e)]; })(),
  ['Escape (Flint or Dagger)', 'free · cash out']);

check('the registered pass',
  (() => {
    const ambush = makeHeading('Set an ambush');
    const honey = makeHeading('Taste a small amount of honey');
    branches = [ambush, honey];
    roots = [makeHeading('Flint or Dagger')];
    api.hbRatings();
    const out = [text(roots[0], api.HB_CLASS), text(ambush, api.HB_BRANCH_CLASS),
      text(honey, api.HB_BRANCH_CLASS)];
    roots = [makeHeading('The Caging of Bees')];
    api.hbRatings();
    out.push(text(roots[0], api.HB_CLASS), text(ambush, api.HB_BRANCH_CLASS),
      text(honey, api.HB_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['grind Bees Caught', 'Bees +25? −6 · Watchful 88', null,
    'cash out', null, 'Bees 50 → Lesser Selves ×3']);

check('no Hunting Bees name is in another feature\'s table',
  (() => { const others = otherNames('HB_ALL');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'hunting-bees'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
