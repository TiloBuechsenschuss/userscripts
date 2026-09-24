// Ad-hoc test for FallenLondon/choice-helper.js's shared progress-quality layer (pq*) and the two
// features built on it: The Hunt is On! ('the-hunt-is-on') and Running Battle ('running-battle').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The vocabulary: a gain reads "THiO +3? -1", a spend "THiO 5 v -> Jade 938? -5", by hand for
//    a dozen options, and the marks mean what they say (? a stat challenge, v a spend).
//  - The Airs windows of the two storylets these features finished: every Airs from 0 to 100 is
//    offered something in Hunting Dangerous Prey; Duelling the Black Ribbon offers nothing at
//    Airs 0 (windows start at 1) apart from the Whispering Duellist, which is the pages' own gap.
//  - The trap: Duelling the Black Ribbon is called Making your Name: Duelling the Black Ribbon
//    until A Name Scrawled in Blood 5, and both headings are one storylet.
//  - Every guide-versus-page disagreement, by name (Running Battle is marked Outdated, so the
//    pages win), so a tidy-up that takes the guide's figure fails here.
//  - The cards: the hand badge and the opened card's heading carry the card's own badge, and the
//    opened card's options are badged like a storylet's, with no second badge on the heading.
//  - That no option title is in another feature's table.
//
// Numbers come from the option and storylet pages on fallenlondon.wiki, fetched through the API
// on 2026-09-24, with The Hunt is On! (Guide) and Running Battle (Guide) as the cross-check.
//
//   node tests/choice-progress-qualities.test.mjs

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
    + ' THIO_CFG, THIO_OPTIONS, THIO_INDEX, THIO_CARDS, THIO_DEF, thioRatings,'
    + ' RUNB_CFG, RUNB_OPTIONS, RUNB_INDEX, RUNB_DEF, runbRatings, AOL_OPTIONS, aolWindows,'
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
const thio = (storylet, name) => api.THIO_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const runb = (storylet, name) => api.RUNB_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const tt = (storylet, name) => api.pqBadgeText(thio(storylet, name), api.THIO_CFG);
const rt = (storylet, name) => api.pqBadgeText(runb(storylet, name), api.RUNB_CFG);
const covered = (win) => Array.from({ length: 101 }, (_, i) => i)
  .filter((n) => win.some((w) => n >= w[0] && n <= w[1]));

// === the vocabulary, by hand ==============================================

check('a gain reads the quality a success makes, then what else it moves: Stalk your prey subtly',
  tt('Hunting Dangerous Prey', 'Stalk your prey subtly'), 'THiO +3? · Subtle +1 · Forceful −1');

check('a failure that takes the quality back follows the gain: Prepare your equipment, Go for the throat!',
  [tt('Hunting Dangerous Prey', 'Prepare your equipment'), tt('Hunting Dangerous Prey', 'Go for the throat!')],
  ['THiO +2? −1', 'THiO +3? −1 · Forceful +1 · Subtle −1']);

check('a spend reads its level, ▼ for "uses it up", what it pays and what a failure takes back',
  [tt('Offer to Lead a Safari through the Marshes', 'Lead them through the marshes'),
    tt('Hunt the Goat-Demon', 'Kill the goat-demon')],
  ['THiO 5 ▼ → Jade 938? −5 · APoSB +3', 'THiO 9 ▼ → Shriek 852? −5 · APoSB +5']);

check('an amount the page only marks with a question mark stays one: Collar the junior keeper, Go and find him',
  [tt('Meeting a junior keeper', 'Collar the junior keeper'), tt('The Tiger Keeper', 'Go and find him')],
  ['THiO 7 ▼ → Labyrinth +1? −4 · Dangerous +?', 'THiO 7 ▼ → Labyrinth +1 · Dangerous +5?']);

check('an option with nothing on the quality shows what it gives: Could you look after them for a day?',
  tt('The tomb-colonist’s dogs', 'Could you look after them for a day?'), 'Foxfire Candle Stub ×61?');

check('a card option that moves the quality: Hunting to hounds; a payout that keeps most of it: Heed the call',
  [tt('The tomb-colonist’s dogs', 'Hunting to hounds'), tt('Cutthroats and Canalmen', 'Heed the call of the hunting-bell')],
  ['THiO +5? −5', 'THiO 15 ▼ → Starved Expression 16 −5']);

check('Running Battle reads the same: Sparring, Arrange a duel, a friendly duel',
  [rt('Duelling the Black Ribbon', 'Sparring with ring fighters'), rt('Duelling the Black Ribbon', 'Arrange a duel outside the Black Ribbon'),
    rt('Duel Colonel Pommery, the Fierce Artillerist', 'A friendly duel with Colonel Pommery')],
  ['RB +3?', 'RB +3? −1', 'RB 5 ▼ → Rostygold 432? −5 · FD +2']);

check('an option with no challenge has no ?: buying assistance for the Big Rat, a Fate option is a label',
  [rt('Alliance with the Big Rat', 'Purchase some Running Battle assistance…'),
    rt('Jack-of-Smiles has expanded his interests', 'A sure thing')],
  ['RB +6', '3 Fate → Diamonds, no RB']);

check('an opener into a storylet carries its label and the Fearsome Duellist it can reach',
  [rt('Challenge a Black Ribbon Duellist', 'Duel Mr Inch and his Menagerie'),
    rt('Challenge a Black Ribbon Duellist', 'Get into other fights')],
  ['RB 8 · FD ≤4', 'RB 8 · no FD']);

check('every spend is a narrow challenge on the quality itself, except the four that are not',
  [...api.THIO_OPTIONS, ...api.RUNB_OPTIONS].filter((e) => e.spend !== undefined)
    .filter((e) => !(e.ch && e.ch.narrow)).map((e) => e.name).sort(),
  ['An eloquent gaze', 'Duel with Chi Lan, and cheat', 'Go and find him', 'Heed the call of the hunting-bell']);

check('a narrow spend is certain four levels above its difficulty, a broad one at difficulty × 5/3',
  (() => {
    const a = api.pqSpec(thio('Hunt the Fungus-column', 'Kill the Fungus-column'), api.THIO_CFG).title;
    const b = api.pqSpec(thio('Hunting Dangerous Prey', 'Stalk your prey subtly'), api.THIO_CFG).title;
    return [/The Hunt Is On! 3 \(narrow\), certain at The Hunt Is On! 7/.test(a), /Dangerous 94, certain at Dangerous 157/.test(b)];
  })(), [true, true]);

check('a rare success stays out of the badge and says so in the tooltip',
  (() => {
    const s = api.pqSpec(thio('Hunting Dangerous Prey', 'Speak with other hunters'), api.THIO_CFG);
    return [s.text, /Rare success: The Hunt Is On! \+3 CP\. No page states its odds\./.test(s.title)];
  })(), ['THiO +2?', true]);

check('the one rare chance a page states is quoted: 15% on Track them to their nests',
  /Rare success: Running Battle\.\.\. \+5 CP; Relic of the Fourth City ×1 \(15%, by the page\)\./.test(
    api.pqSpec(runb('Destroy an Infestation of Sorrow-Spiders', 'This might be faster... Track them to their nests'),
      api.RUNB_CFG).title), true);

check('a gain, a spend and a label are three different colours, and the spend is amber',
  [api.pqSpec(thio('Hunting Dangerous Prey', 'Observe your prey'), api.THIO_CFG).color,
    api.pqSpec(thio('Hunt the Fungus-column', 'Kill the Fungus-column'), api.THIO_CFG).color,
    api.pqSpec(runb('Duelling the Black Ribbon', 'Issue a challenge to a duel'), api.RUNB_CFG).color],
  [api.CAROUSEL_COLOR_PROGRESS, api.CAROUSEL_COLOR_PAYOUT, api.CAROUSEL_COLOR_NEUTRAL]);

// === the Airs windows ====================================================

const airsOf = (table, storylet) => table.filter((e) => e.storylet === storylet && e.airs).flatMap((e) => e.airs);

check('Hunting Dangerous Prey offers something at every Airs from 0 to 100, and its pages follow the option pages',
  [covered(airsOf(api.THIO_OPTIONS, 'Hunting Dangerous Prey')).length,
    api.THIO_OPTIONS.filter((e) => e.storylet === 'Hunting Dangerous Prey').map((e) => api.aolWindows(e.airs))],
  [101, ['0–33', '0–50', '67–100', '34–66', '51–100', '26–75']]);

check('the guide gives 1–33 and 1–50 for two of them and the pages are followed, said in the tooltip',
  ['Stalk your prey subtly', 'Speak with other hunters'].map((n) => thio('Hunting Dangerous Prey', n).guide),
  ['The guide gives Airs 1–33.', 'The guide gives Airs 1–50.']);

check('none of them lists re-rolling Airs, and the tooltip says so',
  api.THIO_OPTIONS.filter((e) => e.airs).every((e) => e.re === 'none'
    && /does not list this option re-rolling Airs/.test(api.pqSpec(e, api.THIO_CFG).title)), true);

check('Duelling the Black Ribbon: six windows that start at 1, so Airs 0 offers only the Whispering Duellist',
  [covered(airsOf(api.RUNB_OPTIONS, 'Duelling the Black Ribbon')).length,
    covered(airsOf(api.RUNB_OPTIONS, 'Duelling the Black Ribbon'))[0],
    api.RUNB_OPTIONS.filter((e) => e.storylet === 'Duelling the Black Ribbon' && e.name.startsWith('Practise')).length],
  [100, 1, 1]);

check('and its options re-roll Airs on both outcomes',
  api.RUNB_OPTIONS.filter((e) => e.airs).every((e) => e.re === 'both'), true);

// === the guide and the pages disagree =====================================

check('Running Battle is Outdated, so every disagreement with the guide is carried and the page followed',
  [['Duel Feducci', 'A duel to the death with Feducci'], ['Duel Captain Vendrick, the Drunken Zailor', 'A duel to the death with Captain Vendrick'],
    ['Spring the Ambush on the Big Rat', 'Fire as soon as he reaches the chalked X']]
    .map(([s, n]) => runb(s, n).guide),
  ['The guide gives level 15, difficulty 15 and Rostygold 4000.', 'The guide gives a failure of 10.', 'The guide gives difficulty 9.']);

check('and the page figures are the ones on the badge: Feducci 3217 at level 13, Vendrick failure 9',
  [rt('Duel Feducci', 'A duel to the death with Feducci'),
    rt('Duel Captain Vendrick, the Drunken Zailor', 'A duel to the death with Captain Vendrick')],
  ['RB 13 ▼ → Rostygold 3217? −10 · FD +7', 'RB 9 ▼ → Rostygold 1872? −9 · FD +5']);

check('The Hunt is On! carries its four disagreements, and the page figures are on the badge',
  [['Offer to Lead a Safari through the Marshes', 'Lead them through the marshes', /Jade 1000/],
    ['Hunt the Rattus Faber Brigands', 'Kill the rat brigands', /Shriek 810 and level 9/],
    ['Capturing a magician', 'Kidnap', /Shriek 1638/],
    ['Hunt the Goat-Demon', 'Take the goat-demon alive', /Procurer of Savage Beasts \+5/]]
    .map(([s, n, re]) => re.test(thio(s, n).guide)),
  [true, true, true, true]);

check('the guide\'s Echoes per action are in the tooltip and never on a badge',
  [/The guide: 0\.35 Echoes per action, worked out from its own figures\./.test(
    api.pqSpec(thio('Offer to Lead a Safari through the Marshes', 'Lead them through the marshes'), api.THIO_CFG).title),
    [...api.THIO_OPTIONS, ...api.RUNB_OPTIONS].some((e) => /Echoes|EPA/.test(api.pqBadgeText(e, api.THIO_CFG)))],
  [true, false]);

// === the title traps =====================================================

check('Duelling the Black Ribbon and Making your Name: Duelling the Black Ribbon are one storylet',
  (() => {
    const sparring = makeHeading('Sparring with ring fighters');
    branches = [sparring];
    const t = () => { const b = badgeOf(sparring, api.RUNB_DEF.branchCls); return b && b.textContent; };
    const out = [];
    roots = [makeHeading('Making your Name: Duelling the Black Ribbon')];
    api.runbRatings();
    out.push(t());
    roots = [makeHeading('Duelling the Black Ribbon')];
    api.runbRatings();
    out.push(t());
    roots = [];
    api.runbRatings();
    out.push(t());
    branches = [];
    return out;
  })(), ['RB +3?', 'RB +3?', null]);

check('the same option title in two storylets is told apart by the open one: Kill the ... under each hunt',
  (() => {
    const l = (name, open) => api.carouselLookup(api.THIO_INDEX, name, key(open));
    return [l('Kill the Fungus-column', 'Hunt the Fungus-column').spend, l('Kill the Fungus-column', 'Hunt the Goat-Demon'),
      l('Kill the goat-demon', 'Hunt the Goat-Demon').spend];
  })(), [5, null, 9]);

check('a heading that spells a hunt with a hyphen or a capital is the same storylet',
  ['Offer to lead a safari through the marshes', 'Hunt the Goat Demon', 'Hunt a Spider-council']
    .map((s) => api.THIO_DEF.storylets.map(key).includes(key(s))), [true, true, true]);

// === storylet headings ====================================================

check('a storylet in the list carries its word: what it raises, or what it spends',
  [api.pqStoryletSpec(key('Hunting Dangerous Prey'), api.THIO_DEF).text,
    api.pqStoryletSpec(key('Hunt the Fungus-column'), api.THIO_DEF).text,
    api.pqStoryletSpec(key('Odd jobs in the Labyrinth'), api.THIO_DEF).text,
    api.pqStoryletSpec(key('Duelling the Black Ribbon'), api.RUNB_DEF).text,
    api.pqStoryletSpec(key('Something else entirely'), api.RUNB_DEF)],
  ['THiO +2–3', 'THiO 5 ▼', 'THiO +2–3', 'RB +2–3', null]);

// === the cards ===========================================================

check('a card in the hand carries its lead option; the opened card has ONE badge on its heading and options of its own',
  (() => {
    const card = makeHeading('The tomb-colonist’s dogs');
    const opt = makeHeading('Hunting to hounds');
    hand = [card];
    branches = [opt];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    api.thioRatings();
    out.push(t(card, api.THIO_DEF.cardCls));
    hand = [];
    roots = [makeHeading('The tomb-colonist’s dogs')];
    api.thioRatings();
    out.push([t(roots[0], api.THIO_DEF.cardCls), t(roots[0], api.THIO_DEF.cls), t(opt, api.THIO_DEF.branchCls)]);
    roots = [];
    branches = [];
    return out;
  })(), ['THiO +5? −5', ['THiO +5? −5', null, 'THiO +5? −5']]);

check('a card of another feature or an unknown card is left alone',
  (() => {
    const card = makeHeading('A drunk');
    hand = [card];
    api.thioRatings();
    api.runbRatings();
    const out = [badgeOf(card, api.THIO_DEF.cardCls), badgeOf(card, api.RUNB_DEF.cardCls)];
    hand = [];
    return out;
  })(), [null, null]);

check('the card tooltip names its requirement and lists every option that moves the quality',
  (() => {
    const t = api.pqCardSpec(api.THIO_CARDS[0], api.THIO_DEF).title;
    return [/Needs: Dangerous 81–118/.test(t), /Hunting to hounds — THiO \+5\? −5/.test(t),
      /Could you look after them for a day\? — Foxfire Candle Stub ×61\?/.test(t)];
  })(), [true, true, true]);

// === the tables ==========================================================

check('every entry is filed under a storylet and named, and no storylet holds a title twice',
  [...api.THIO_OPTIONS, ...api.RUNB_OPTIONS].filter((e) => !e.storylet || !e.name)
    .concat([...api.THIO_OPTIONS, ...api.RUNB_OPTIONS].filter((e, i, all) =>
      all.findIndex((o) => key(o.storylet) === key(e.storylet) && key(o.name) === key(e.name)) !== i)).map((e) => e.name), []);

check('every badge is non-empty',
  [...api.THIO_OPTIONS.map((e) => api.pqBadgeText(e, api.THIO_CFG)),
    ...api.RUNB_OPTIONS.map((e) => api.pqBadgeText(e, api.RUNB_CFG))].filter((t) => !t), []);

check('every spend takes the quality back to 0 except the one that takes 15',
  [...api.THIO_OPTIONS, ...api.RUNB_OPTIONS].filter((e) => e.spend !== undefined && e.reset === false).map((e) => e.name),
  ['Heed the call of the hunting-bell']);

check('no option title is also a title in another feature\'s table',
  (() => {
    const mine = [...api.THIO_OPTIONS, ...api.RUNB_OPTIONS].map((e) => key(e.name));
    const others = [
      ...api.ZEE_CARDS.map((c) => key(c.name)), ...api.SPITE_CARDS.map((c) => key(c.name)),
      ...api.FOTZ_CARDS.map((c) => key(c.name)), ...api.LAB_CARDS.map((c) => key(c.name)),
      ...api.ARBOR_OPTIONS.map((e) => key(e.name)),
      ...api.PC_OPTIONS.flatMap((p) => [key(p.name), p.branch ? key(p.branch) : '']),
      ...api.VSD_OPTIONS.flatMap((v) => [key(v.storylet), key(v.branch)]),
      ...api.LBI_OPTIONS.map((e) => key(e.name)), ...api.VH_OPTIONS.map((e) => key(e.name)),
      ...api.DME_OPTIONS.map((e) => key(e.name)), ...api.AOL_OPTIONS.map((e) => key(e.name)),
    ];
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the two features share no storylet and no title with each other',
  (() => {
    const t = api.THIO_OPTIONS.map((e) => key(e.storylet));
    const r = api.RUNB_OPTIONS.map((e) => key(e.storylet));
    const tn = api.THIO_OPTIONS.map((e) => key(e.name));
    return [t.filter((s) => r.includes(s)),
      api.RUNB_OPTIONS.map((e) => key(e.name)).filter((n) => tn.includes(n))];
  })(), [[], []]);

check('the two features are registered',
  ['the-hunt-is-on', 'running-battle'].map((n) => api.FEATURES.some((f) => f.name === n)), [true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
