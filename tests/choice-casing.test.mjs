// Ad-hoc test for FallenLondon/choice-helper.js's Casing feature ('casing') on the shared
// progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The vocabulary for the two kinds of spend: a robbery takes all the Casing ("Casing 5 v -> ...")
//    and a fixed-price spend takes a set number of CP ("Casing -6 v -> ...", "fail -51").
//  - The Big Score prelude's actions: the gains cost 3 actions (5 for the three that pay 16-18), so the
//    badge says so and the tooltip gives the CP per action the guide lists (3, 3.2, 3.6).
//  - The larcenies: the same option title ("Join a scouting party") on four cards, told apart by the
//    open card; the fixed prices are the Clay Highwayman feature's ladder (21, 36, 55 for level 6, 8, 10).
//  - Every guide-versus-page disagreement, by name (the guide is marked as needing work).
//  - That the card headings stay the Clay Highwayman feature's and the options inside are this one's.
//
// Numbers come from the option and storylet pages on fallenlondon.wiki, fetched through the API
// on 2026-09-24, with Casing (Guide) as the cross-check.
//
//   node tests/choice-casing.test.mjs

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
    + ' CASING_CFG, CASING_OPTIONS, CASING_INDEX, CASING_DEF, CASING_LARCENIES, casingRatings,'
    + ' THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS, CHW_CLASS, chwRatings, chwStoryletSpec,'
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
const cas = (storylet, name) => api.CASING_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const ct = (storylet, name) => api.pqBadgeText(cas(storylet, name), api.CASING_CFG);
const PREP = 'Preparing for a Big Score';
const [EAL, JER, MAG, BAL, BUR] = api.CASING_LARCENIES;

// === the vocabulary, by hand ==============================================

check('a gain that costs three actions says so: Look for the targets, Eavesdrop (one action, nothing said)',
  [ct(PREP, 'Look for the targets'), ct(PREP, 'Eavesdrop on those in the know')],
  ['Casing +9? · 3 actions', 'Casing +2?']);

check('the five-action gains, and a failure that still raises Casing is "fail +3", not a second gain',
  [ct(PREP, 'Well-planned villainy'), ct(PREP, 'Set your gang of hoodlums to business'),
    ct(PREP, 'Promenade around in full view')],
  ['Casing +16 · 5 actions', 'Casing +18? · fail +3 · 5 actions', 'Casing +18? · fail +3 · 5 actions']);

check('a gain that loses Casing on failure: Criminal assistance, The decoy (a bundle is not priced)',
  [ct(PREP, 'Criminal assistance'), ct(PREP, 'The decoy')],
  ['Casing +9? −2 · 3 actions', 'Casing +9? −3 · 3 actions']);

check('a robbery takes the level it needs and all of it: the strong-box, the Brass Embassy',
  [ct('Steal the Carnival Strong Box', 'Rob the strong-box halfway through the evening'),
    ct('Rob the Brass Embassy', 'Nobody would steal from it but you')],
  ['Casing 5 ▼ → Glim, Jade, Pearls, Rostygold ×100? −5 · MT +2', 'Casing 11 ▼ → Brass ×600 · Soul ×350? −10 · MT +7']);

check('a fixed-price spend says how much it takes, and a failure that costs more says so: information, thefts, the wall',
  [ct('Sell information', 'Pass information to the Constables'),
    ct('Thefts of Particular Character', 'Steal Tales of Terror from a noted author'),
    ct('Steal Paintings for the Topsy King', 'Offer to make a wall of stolen paintings')],
  ['Casing −6 ▼ → Pearls ×260', 'Casing −32 ▼ → Tale of Terror ×25? · fail −51', 'Casing −55 ▼ → Sulky Bat ×8? · fail −10']);

check('a larceny takes 21, 36 or 55 CP and raises the Marauder, with no challenge and so no question mark',
  [ct(EAL, 'Ambush an Inattentive Scholar'), ct(JER, 'Seize a jewel smuggler\'s boat'), ct(BAL, 'Con a Palaeontological Yank')],
  ['Casing −21 ▼ → Research ×3 · Humerus ×2 · Marauder +1', 'Casing −36 ▼ → Magnificent Diamond ×2 · Marauder +2',
    'Casing −55 ▼ → Prismatic Frame · Marauder +3']);

check('an option that changes nothing on the quality is a label: the three area-diving disposals, an opener',
  [ct('Area-diving: What to Do?', 'Into the river with it'), ct('Area-diving: What to Do?', 'A spot of blackmail'),
    ct('The Big Score: Choose a Target', 'Rob the glim shipment')],
  ['Austere +5 · Scandal −5', 'Casing 1 → blackmail', 'Casing 8 ▼ · MT ≤4']);

check('an amount on a gain that spends items is in the tooltip: Gather intelligence spends 50 Whispered Hints',
  [ct('Area-diving: Casing the Target', 'Gather intelligence on your target'),
    /Spends: Whispered Hint ×50\./.test(api.pqSpec(cas('Area-diving: Casing the Target', 'Gather intelligence on your target'),
      api.CASING_CFG).title)], ['Casing +3', true]);

check('a scouting party is a challenge that eases with the area\'s Darkness, said in the tooltip',
  /Challenge: Shadowy 300 with Balmoral: Darkness at 0, easier as that rises\./.test(
    api.pqSpec(cas(BAL, 'Join a scouting party'), api.CASING_CFG).title), true);

// === the prelude's actions ================================================

check('the three-action gains are 3 CP per action, the five-action ones 3.2 and 3.6, as the guide has them',
  api.CASING_OPTIONS.filter((e) => e.storylet === PREP && e.actions > 1)
    .map((e) => Math.round(e.win / e.actions * 100) / 100 + ''),
  ['3', '3', '3', '3', '3', '3', '3.2', '3.6', '3.6']);

check('the tooltip says so: 3 CP per action',
  /Costs 3 actions, so 3 CP per action\./.test(api.pqSpec(cas(PREP, 'Examine the target'), api.CASING_CFG).title), true);

// === the fixed prices are the Clay Highwayman feature's ladder ======================

check('every larceny takes 21 CP at level 6, 36 at level 8 and 55 at level 10',
  api.CASING_OPTIONS.filter((e) => api.CASING_LARCENIES.includes(e.storylet) && e.cost !== undefined)
    .map((e) => [e.need, e.cost].join(':')).filter((v, i, all) => all.indexOf(v) === i).sort(),
  ['10:55', '6:21', '8:36']);

check('the six thefts of particular character each take 32 CP, 51 if they fail, at Casing 10, on Shadowy 120',
  api.CASING_OPTIONS.filter((e) => e.storylet === 'Thefts of Particular Character')
    .map((e) => [e.need, e.cost, e.lose, e.ch.diff].join(':')), Array(6).fill('10:32:-51:120'));

check('selling information: 4 and 10 for the Criminals, 3 and 6 for the Constables and the Brass Embassy',
  api.CASING_OPTIONS.filter((e) => e.storylet === 'Sell information').map((e) => [e.need, e.cost].join(':')),
  ['4:10', '3:6', '3:6']);

// === the guide and the pages disagree ============================================

check('the guide is marked as needing work, so every disagreement is carried and the page followed',
  [[PREP, 'Look for the targets', /Suspicion \+3/], [PREP, 'Scapegoats and alibis', /Suspicion \+3/],
    [PREP, 'The decoy', /Suspicion \+1/],
    ['Bringing Revolution!', 'Bomb a meeting of financiers', /Master Thief \+5\?/],
    ['Rob the Glim Shipment', 'Wait until it docks and rob the warehouse', /Master Thief \+5\?/],
    ['Bringing Revolution!', 'Destroy a statue', /Master Thief 1/]]
    .map(([s, n, re]) => re.test(cas(s, n).guide)),
  [true, true, true, true, true, true]);

check('and the page figures are on the badge: Scapegoats fails at Suspicion 1, the bomb builds Master Thief 4',
  [cas(PREP, 'Scapegoats and alibis').xf, ct('Bringing Revolution!', 'Bomb a meeting of financiers')],
  [[['Suspicion', 1]], 'Casing 8 ▼ → Proscribed ×218 · Clues ×200? −5 · MT +4 · Making Waves +10']);

check('Burrow-Infra-Mump\'s scouting party costs Suspicion 4 on a failure, the other four 2',
  api.CASING_OPTIONS.filter((e) => e.name.startsWith('Join a scouting party') || e.name.startsWith('Scout for targets'))
    .map((e) => [e.storylet, e.xf[0][1]].join(':')),
  [`${EAL}:2`, `${JER}:2`, `${MAG}:2`, `${BAL}:2`, `${BUR}:4`]);

check('the guide\'s haul and expected actions are in the tooltip of a robbery and never on a badge',
  [/values the haul at 4\.32 Echoes and expects 7\.3 actions per theft/.test(
    api.pqSpec(cas('Steal the Carnival Strong Box', 'Rob the strong-box halfway through the evening'), api.CASING_CFG).title),
    api.CASING_OPTIONS.some((e) => /Echoes|EPA/.test(api.pqBadgeText(e, api.CASING_CFG)))], [true, false]);

// === the title traps ============================================================

check('"Join a scouting party" is one title on four cards, told apart by the open card; Magistracy has its own title',
  (() => {
    const l = (name, open) => api.carouselLookup(api.CASING_INDEX, name, key(open));
    return [l('Join a scouting party', EAL).xf[0][1], l('Join a scouting party', BUR).xf[0][1],
      l('Join a scouting party', MAG), l('Scout for targets', MAG).win,
      l('Scout for targets (Magistracy of the Evenlode)', MAG).win];
  })(), [2, 4, null, 4, 4]);

check('"Sell information" is an option of two storylets and a storylet of its own, kept apart',
  (() => {
    const l = (open) => api.carouselLookup(api.CASING_INDEX, 'Sell information', key(open));
    return [l(PREP).label, l('The Big Score: Choose a Target').label, l('Sell information')];
  })(), ['Casing 3 → sell', 'Casing 3 · fixed price', null]);

check('the storylet called Making Your Name: What to Do with the Box? is Area-diving: What to Do?',
  (() => {
    const keep = makeHeading('Keep it');
    branches = [keep];
    const t = () => { const b = badgeOf(keep, api.CASING_DEF.branchCls); return b && b.textContent; };
    const out = [];
    roots = [makeHeading('Making Your Name: What to Do with the Box?')];
    api.casingRatings();
    out.push(t());
    roots = [makeHeading('Area-diving: What to Do?')];
    api.casingRatings();
    out.push(t());
    roots = [];
    branches = [];
    return out;
  })(), ['Hedonist +3 · Proscribed ×50', 'Hedonist +3 · Proscribed ×50']);

check('the storylet\'s option "Thefts of a particular character" and its storylet Thefts of Particular Character agree',
  (() => {
    const steal = makeHeading('Steal an Antique Mystery from Feducci');
    branches = [steal];
    roots = [makeHeading('Thefts of a particular character')];
    api.casingRatings();
    const b = badgeOf(steal, api.CASING_DEF.branchCls);
    const out = b && b.textContent;
    roots = [];
    branches = [];
    return out;
  })(), 'Casing −32 ▼ → Antique Mystery? · fail −51');

// === the cards: the heading stays the Clay Highwayman feature's ==========================

check('a larceny card\'s heading has no badge from this feature, its options have one each, the Clay Highwayman one stays',
  (() => {
    const scout = makeHeading('Join a scouting party');
    const con = makeHeading('Con an Eccentric Philosopher');
    branches = [scout, con];
    roots = [makeHeading(EAL)];
    api.casingRatings();
    api.chwRatings();
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [t(roots[0], api.CASING_DEF.cls), t(roots[0], api.CHW_CLASS) && 'chw',
      t(scout, api.CASING_DEF.branchCls), t(con, api.CASING_DEF.branchCls)];
    roots = [];
    branches = [];
    return out;
  })(), [null, 'chw', 'Casing +4?', 'Casing −55 ▼ → Fecund Amber · Marauder +3']);

check('the Clay Highwayman card tooltip no longer says nothing inside is badged',
  !/nothing inside the card is badged/.test(api.chwStoryletSpec(key(EAL)).title), true);

// === storylet headings ============================================================

check('a storylet in the list carries its word',
  [['Area-diving: Casing the Target', 'Casing +1–3'], ['Sell information', 'Casing 3 ▼'], ['Steal the Carnival Strong Box', 'Casing 5 ▼'],
    [PREP, 'Casing +2–18']]
    .map(([s, want]) => [api.pqStoryletSpec(key(s), api.CASING_DEF).text, want]),
  [['Casing +1–3', 'Casing +1–3'], ['Casing 3 ▼', 'Casing 3 ▼'], ['Casing 5 ▼', 'Casing 5 ▼'], ['Casing +2–18', 'Casing +2–18']]);

check('a larceny card gets no storylet badge from this feature, whatever the key',
  api.CASING_LARCENIES.map((c) => api.CASING_DEF.cardKeys.includes(key(c))), [true, true, true, true, true]);

// === the tables ===============================================================

check('every entry is filed under a storylet, named, and has a non-empty badge',
  api.CASING_OPTIONS.filter((e) => !e.storylet || !e.name || !api.pqBadgeText(e, api.CASING_CFG)).map((e) => e.name), []);

check('no storylet holds a title twice',
  api.CASING_OPTIONS.filter((e, i, all) =>
    all.findIndex((o) => key(o.storylet) === key(e.storylet) && key(o.name) === key(e.name)) !== i).map((e) => e.name), []);

check('every fixed-price spend has a level and a cost, every robbery a narrow challenge on Casing',
  [api.CASING_OPTIONS.filter((e) => e.cost !== undefined && (e.need === undefined)).map((e) => e.name),
    api.CASING_OPTIONS.filter((e) => e.spend !== undefined && !(e.ch && e.ch.narrow)).map((e) => e.name)], [[], []]);

check('no option title is also a title in another feature\'s table',
  (() => {
    const mine = api.CASING_OPTIONS.filter((e) => !['Sell information', 'Join a scouting party'].includes(e.name)).map((e) => key(e.name));
    const others = [
      ...api.ZEE_CARDS.map((c) => key(c.name)), ...api.SPITE_CARDS.map((c) => key(c.name)),
      ...api.FOTZ_CARDS.map((c) => key(c.name)), ...api.LAB_CARDS.map((c) => key(c.name)),
      ...api.ARBOR_OPTIONS.map((e) => key(e.name)),
      ...api.PC_OPTIONS.flatMap((p) => [key(p.name), p.branch ? key(p.branch) : '']),
      ...api.VSD_OPTIONS.flatMap((v) => [key(v.storylet), key(v.branch)]),
      ...api.LBI_OPTIONS.map((e) => key(e.name)), ...api.VH_OPTIONS.map((e) => key(e.name)),
      ...api.DME_OPTIONS.map((e) => key(e.name)), ...api.AOL_OPTIONS.map((e) => key(e.name)),
      ...api.THIO_OPTIONS.map((e) => key(e.name)), ...api.RUNB_OPTIONS.map((e) => key(e.name)),
      ...api.CHW_OPTIONS.map((e) => key(e.name)),
    ];
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered',
  api.FEATURES.some((f) => f.name === 'casing'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
