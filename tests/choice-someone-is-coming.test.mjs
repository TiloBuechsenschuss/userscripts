// Ad-hoc test for FallenLondon/choice-helper.js's Someone Is Coming feature ('someone-is-coming')
// on the shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The two shapes: a card option raises the counter by exactly 1 and the badge names the PROFIT
//    ("SiC +1? · Brass x180 · ..."), a payout is a fixed 21 CP ("SiC -21 v -> Shriek x275") at level 4.
//  - Every payout takes 21 CP and needs level 4, the drunk rat 6 CP at level 3, and the guide's
//    Echoes per action are tooltip text, never on a badge.
//  - A card in the hand carries "SiC +1", the Relicker's card its own word, and the zee cards keep
//    the Zailing feature's heading badge while their option here is badged.
//  - "Look away" answers to the page's "Look away 2", and Rob a drunk keeps no heading badge.
//  - That no title is in another feature's table.
//
// Numbers come from the option, card and storylet pages on fallenlondon.wiki, fetched through the API
// on 2026-09-24, with Someone Is Coming (Guide) as the cross-check.
//
//   node tests/choice-someone-is-coming.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
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
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
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
let list = [];
let branches = [];
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
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

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { carouselLookup, carouselRange, CAROUSEL_COLOR_NEUTRAL, CAROUSEL_COLOR_LABEL, CAROUSEL_COLOR_PROGRESS,'
    + ' CAROUSEL_COLOR_PAYOUT, PQ_SHORT, pqBadgeText, pqSpec, pqStoryletSpec, pqCardSpec, pqRatings,'
    + ' SIC_CFG, SIC_OPTIONS, SIC_INDEX, SIC_DEF, SIC_CARDS, sicRatings, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS,'
    + ' CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, ARBOR_OPTIONS,'
    + ' PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);






let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const key = api.normalizeName;
const sic = (storylet, name) => api.SIC_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const st = (storylet, name) => api.pqBadgeText(sic(storylet, name), api.SIC_CFG);
const RELICKER = 'A Gift from the Capering Relicker';

// === the vocabulary, by hand ==============================================

check('a payout is a fixed 21 CP: the Shriek, the Bone Fragments',
  [st(RELICKER, 'A Scream for your Mantel'), st(RELICKER, 'Raw material')],
  ['SiC −21 ▼ → Shriek ×275', 'SiC −21 ▼ → Bone Fragments ×2200']);

check('the drunk rat is 6 CP at level 3 on a wide Shadowy challenge, and a failure still costs the 6',
  [st('Rob a drunk', 'A furious and incoherent drunken rat'),
    /Takes 6 CP on every outcome/.test(sic('Rob a drunk', 'A furious and incoherent drunken rat').note),
    /Rare success: Ratwork Watch ×1 \(1%, by the page\)/.test(api.pqSpec(sic('Rob a drunk', 'A furious and incoherent drunken rat'), api.SIC_CFG).title)],
  ['SiC −6 ▼ → Currency ×(Shadowy ÷ 2)?', true, true]);

check('a card option raises the counter by 1 and names the profit: Attend the ceremony, Engineer an invitation',
  [st('A consideration for services rendered', 'Attend the ceremony'),
    st('City Vices: a Rather Decadent Evening', 'Engineer an invitation')],
  ['SiC +1? · Brass ×180 · Secret ×2', 'SiC +1? · Making Waves +(6 + Scandal) · Scandal +2 · Morelways ×20 · Absinthe ×4']);

check('a plain option: quirks first, then the profit; and one that costs nothing to say',
  [st('The Soft-Hearted Widow', 'Look away'), st('The vigilant gentlemen in blue', 'Find a patsy')],
  ['SiC +1 · Heartless +1 · Magnanimous −1 · Austere +1', 'SiC +1 · Heartless +3 · Steadfast −3 · Suspicion −2']);

check('a Luck option is an expected value, and a failure that still raises it says "fail +1"',
  [st('City Vices: a tournament of weasels!', 'Attend with a weasel'),
    st('City Vices: a tournament of weasels!', 'Attend with a weasel of quality')],
  ['SiC +1≈ · fail +1 · Rostygold ×200 · Nightmares −1', 'SiC +1≈ · fail +1 · Rostygold ×200 · Nightmares −1']);

check('the Ermine Assassin\'s option has no challenge and pays Rostygold and Prayers',
  st('City Vices: a tournament of weasels!', 'Attend with your Ermine Assassin'), 'SiC +1 · Rostygold ×200 · Prayer ×15');

// === the payouts ===================================================================

check('there are eight payouts, each needing level 4 and taking 21 CP, not all of it',
  api.SIC_OPTIONS.filter((e) => e.storylet === RELICKER).map((e) => [e.need, e.cost]),
  Array(8).fill([4, 21]));

check('the guide\'s Echoes per action are in the tooltip of a payout and never on a badge',
  [/The guide values this at 5\.5 Echoes, 0\.50 per action\./.test(api.pqSpec(sic(RELICKER, 'A Scream for your Mantel'), api.SIC_CFG).title),
    /Takes 21 CP of it, not all\./.test(api.pqSpec(sic(RELICKER, 'A Scream for your Mantel'), api.SIC_CFG).title),
    api.SIC_OPTIONS.some((e) => /Echoes|EPA/.test(api.pqBadgeText(e, api.SIC_CFG)))],
  [true, true, false]);

check('the guide\'s payout figures rise from 0.50 to 2.00 per action, Bone Fragments best',
  api.SIC_OPTIONS.filter((e) => e.storylet === RELICKER)
    .map((e) => (e.note.match(/(\d\.\d\d) per action/) || [0, '?'])[1]),
  ['0.50', '1.00', '0.91', '1.00', '1.00', '1.09', '2.00', '1.32']);

// === every card option raises it by 1 ==========================================================

check('every card option raises the counter by exactly 1, and only the payouts and the rat spend it',
  [api.SIC_OPTIONS.filter((e) => e.storylet !== RELICKER && e.storylet !== 'Rob a drunk').filter((e) => e.win !== 1).map((e) => e.name),
    api.SIC_OPTIONS.filter((e) => e.cost !== undefined).length], [[], 9]);

check('every card has an option of ours, and every option a card or a storylet we name',
  [api.SIC_CARDS.filter((c) => !api.SIC_OPTIONS.some((e) => key(e.storylet) === key(c.name))).map((c) => c.name),
    api.SIC_OPTIONS.map((e) => e.storylet).filter((s, i, a) => a.indexOf(s) === i)
      .filter((s) => !api.SIC_CARDS.some((c) => key(c.name) === key(s)) && !api.SIC_DEF.noHeading.includes(key(s))).length],
  [[], 0]);

check('the card set is the Relicker, the drunk-free seventeen and no more: eighteen cards',
  api.SIC_CARDS.length, 18);

// === titles and scoping ====================================================================

check('"Look away" answers to the page\'s "Look away 2", and "A direct approach" to its numbered page',
  [api.carouselLookup(api.SIC_INDEX, 'Look away 2', key('The Soft-Hearted Widow')) !== null,
    api.carouselLookup(api.SIC_INDEX, 'Look away', key('The Soft-Hearted Widow')) !== null,
    api.carouselLookup(api.SIC_INDEX, 'A direct approach 4', key('The oracle of the weasel-fights')) !== null], [true, true, true]);

check('an option answers only in its own card: Look away is nothing on the Jack card',
  api.carouselLookup(api.SIC_INDEX, 'Look away', key('Jack strikes again')), null);

// === the cards ================================================================================

check('a card in the hand says "SiC +1", the Relicker\'s its own word, and the opened card has one badge and its options',
  (() => {
    const c1 = makeHeading('The Soft-Hearted Widow');
    const c2 = makeHeading(RELICKER);
    hand = [c1, c2];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    api.sicRatings();
    const out = [t(c1, api.SIC_DEF.cardCls), t(c2, api.SIC_DEF.cardCls)];
    hand = [];
    const opt = makeHeading('Look away');
    branches = [opt];
    roots = [makeHeading('The Soft-Hearted Widow')];
    api.sicRatings();
    out.push([t(roots[0], api.SIC_DEF.cardCls), t(roots[0], api.SIC_DEF.cls), t(opt, api.SIC_DEF.branchCls)]);
    roots = [];
    branches = [];
    return out;
  })(), ['SiC +1', 'SiC −21 ▼ → 8 payouts', ['SiC +1', null, 'SiC +1 · Heartless +1 · Magnanimous −1 · Austere +1']]);

check('the Relicker\'s card lists its eight payouts in the tooltip and says it is dealt at once',
  (() => {
    const t = api.pqCardSpec(api.SIC_CARDS[0], api.SIC_DEF).title;
    return [/Needs: Someone Is Coming 4/.test(t), /Dealt at once at level 4/.test(t), (t.match(/SiC −21 ▼/g) || []).length];
  })(), [true, true, 8]);

check('the zee cards keep the Zailing heading badge: no badge of ours on the heading, one on the option',
  ['A Huge Terrible Beast of the Unterzee!', 'Creaking from Above'].map((c) => {
    const opt = makeHeading(c === 'Creaking from Above' ? 'Glim-fall!' : 'Delicious, delicious lumps');
    branches = [opt];
    roots = [makeHeading(c)];
    api.sicRatings();
    const out = [badgeOf(roots[0], api.SIC_DEF.cls), badgeOf(roots[0], api.SIC_DEF.cardCls),
      (badgeOf(opt, api.SIC_DEF.branchCls) || {}).textContent];
    roots = [];
    branches = [];
    return out;
  }), [[null, null, 'SiC +1? · Tale of Terror ×4'], [null, null, 'SiC +1≈ · Troubled Waters +2 · Glim ×(2 × Peril)']]);

check('Rob a drunk and the oracle get no heading badge, and the rat\'s option is badged',
  (() => {
    const rat = makeHeading('A furious and incoherent drunken rat');
    branches = [rat];
    roots = [makeHeading('Rob a drunk')];
    api.sicRatings();
    const out = [badgeOf(roots[0], api.SIC_DEF.cls), (badgeOf(rat, api.SIC_DEF.branchCls) || {}).textContent];
    roots = [];
    branches = [];
    return out;
  })(), [null, 'SiC −6 ▼ → Currency ×(Shadowy ÷ 2)?']);

check('a card of another feature is left alone',
  (() => {
    const card = makeHeading('A drunk');
    hand = [card];
    api.sicRatings();
    const out = badgeOf(card, api.SIC_DEF.cardCls);
    hand = [];
    return out;
  })(), null);

// === the tables ======================================================================================

check('every entry is filed under a storylet, named, and has a non-empty badge, and no storylet holds a title twice',
  [api.SIC_OPTIONS.filter((e) => !e.storylet || !e.name || !api.pqBadgeText(e, api.SIC_CFG)).map((e) => e.name),
    api.SIC_OPTIONS.filter((e, i, a) =>
      a.findIndex((o) => key(o.storylet) === key(e.storylet) && key(o.name) === key(e.name)) !== i).map((e) => e.name)], [[], []]);

check('no card of ours shares a name with another feature\'s card table',
  (() => {
    const mine = api.SIC_CARDS.map((c) => key(c.name));
    const others = [...api.ZEE_CARDS, ...api.SPITE_CARDS, ...api.FOTZ_CARDS, ...api.LAB_CARDS].map((c) => key(c.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('no option title is also a title in another feature\'s table',
  (() => {
    const mine = api.SIC_OPTIONS.map((e) => key(e.name));
    const others = [
      ...api.ARBOR_OPTIONS.map((e) => key(e.name)),
      ...api.PC_OPTIONS.flatMap((p) => [key(p.name), p.branch ? key(p.branch) : '']),
      ...api.VSD_OPTIONS.flatMap((v) => [key(v.storylet), key(v.branch)]),
      ...api.LBI_OPTIONS.map((e) => key(e.name)), ...api.VH_OPTIONS.map((e) => key(e.name)),
      ...api.DME_OPTIONS.map((e) => key(e.name)), ...api.AOL_OPTIONS.map((e) => key(e.name)),
      ...api.CHW_OPTIONS.map((e) => key(e.name)), ...api.INV_OPTIONS.map((e) => key(e.name)),
      ...api.FAS_OPTIONS.map((e) => key(e.name)), ...api.INSP_OPTIONS.map((e) => key(e.name)),
    ];
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered',
  api.FEATURES.some((f) => f.name === 'someone-is-coming'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
