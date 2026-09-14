// Ad-hoc test for FallenLondon/choice-helper.js's three early carousels --
// L. B. Industries ('lb-industries'), the Department of Menace Eradication
// ('menace-eradication') and Vertiginous Horticulture
// ('vertiginous-horticulture') -- and the shared storylet-carousel plumbing
// they stand on. One suite for the three because they share that plumbing and
// the harness; each has its own section.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The placeholder titles. The wiki titles "Water your (growth)"; the game
//    says "Water your mandrakes". Match those as wildcards and nothing else --
//    "(3 FATE)" is part of a real title.
//  - That an option answers only inside its own OPEN storylet: "Make bobbins"
//    and "Treat the soil" could be anywhere in London.
//  - Each feature's stated-versus-derived cross-check: the guide's "Min for
//    100%" (L. B. Industries), the pages' example difficulties at a stated
//    Savagery (Menace Eradication), the guide's Average Gain and its figures
//    at Nurturing 150 (Horticulture).
//  - Every guide-versus-page disagreement, by name, so a tidy-up that takes
//    the guide's figure fails here rather than in the game.
//
// Numbers come from the three guides and their option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-14.
//
//   node FallenLondon/test/choice-myn-carousels.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

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
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
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

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { carouselMatcher, carouselIndex, carouselLookup, carouselRange, carouselSigned, broadCertainAt,'
    + ' CAROUSEL_COLOR_PROGRESS, CAROUSEL_COLOR_SETUP, CAROUSEL_COLOR_PAYOUT, CAROUSEL_COLOR_NEUTRAL,'
    + ' CAROUSEL_COLOR_LABEL,'
    + ' LBI_OPTIONS, LBI_INDEX, LBI_STORYLET, LBI_CLASS, LBI_BRANCH_CLASS, lbiBadgeText, lbiSpec, lbiStoryletSpec, lbiRatings,'
    + ' DME_OPTIONS, DME_INDEX, DME_CONTRACTS, DME_HUNT, DME_MAZE, DME_CLASS, DME_BRANCH_CLASS,'
    + ' dmeBadgeText, dmeSpec, dmeStoryletSpec, dmeChallengeLine, dmeRatings,'
    + ' VH_OPTIONS, VH_GROWS, VH_INDEX, VH_STORYLET, VH_CLASS, VH_BRANCH_CLASS, vhBadgeText, vhSpec,'
    + ' vhStoryletSpec, vhDifficulties, vhAverage, vhSale, vhRatings,'
    + ' ARBOR_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const find = (table, name) => table.find((e) => e.name === name);
const lbi = (name) => find(api.LBI_OPTIONS, name);
const dme = (name) => find(api.DME_OPTIONS, name);
const vh = (name) => find(api.VH_OPTIONS, name);
const key = api.normalizeName;

// === the shared plumbing ===================================================

check('a placeholder title matches the game\'s filled-in title',
  [api.carouselMatcher('Water your (growth)')(key('Water your mandrakes')),
   api.carouselMatcher('Offer your (growth type) to the Wizened Botanist')(key('Offer your fungus to the Wizened Botanist')),
   api.carouselMatcher('Bid farewell to (work leader)')(key('Bid farewell to the Eager Engineer'))],
  [true, true, true]);

check('and needs a word in the placeholder\'s place, and the rest of the title',
  [api.carouselMatcher('Water your (growth)')(key('Water your')),
   api.carouselMatcher('Offer your (growth type) to the Wizened Botanist')(key('Offer your fungus to the Sneering Horticulturalist'))],
  [false, false]);

check('any other bracket is part of the title',
  [api.carouselMatcher('Contract: a Miniature Menace (3 FATE)')(key('Contract: a Miniature Menace (3 FATE)')),
   api.carouselMatcher('Contract: a Miniature Menace (3 FATE)')(key('Contract: a Miniature Menace (4 FATE)'))],
  [true, false]);

check('a range reads smallest magnitude first, signed by its direction',
  [api.carouselRange([10, 12]), api.carouselRange([-5, -2]), api.carouselRange([0, -2]),
   api.carouselRange([-1, 0]), api.carouselRange([4, 4]), api.carouselRange(-19), api.carouselRange(-1.8)],
  ['+10–12', '−2–5', '−0–2', '−0–1', '+4', '−19', '−1.8']);

check('broadCertainAt keeps the floating-point trap shut',
  [50, 75, 88, 125, 178].map(api.broadCertainAt), [84, 125, 147, 209, 297]);

check('the five carousel colours are distinct',
  new Set([api.CAROUSEL_COLOR_PROGRESS, api.CAROUSEL_COLOR_SETUP, api.CAROUSEL_COLOR_PAYOUT,
    api.CAROUSEL_COLOR_NEUTRAL, api.CAROUSEL_COLOR_LABEL]).size, 5);

// Every option is filed under a storylet, and the lookup never crosses one.
check('no option is found without its own storylet open',
  [api.carouselLookup(api.LBI_INDEX, 'Make bobbins', null),
   api.carouselLookup(api.LBI_INDEX, 'Make bobbins', key('Shutting Down for the Day')),
   api.carouselLookup(api.LBI_INDEX, 'Make bobbins', key(api.LBI_STORYLET)).name],
  [null, null, 'Make bobbins']);

check('within each feature, storylet plus title identifies a row',
  [api.LBI_OPTIONS, api.DME_OPTIONS, api.VH_OPTIONS].map((t) =>
    new Set(t.map((e) => key(e.storylet) + '|' + key(e.name))).size === t.length),
  [true, true, true]);

check('and no filled-in title could match two rows of one storylet',
  [api.LBI_INDEX, api.DME_INDEX, api.VH_INDEX].map((index) =>
    index.filter((row) => index.some((other) => other !== row && other.storylet === row.storylet
      && other.matches(key(row.entry.name.replace(/\((?:growth|growth type|work leader)\)/, 'mandrakes')))))
      .map((row) => row.entry.name)),
  [[], [], []]);

// === L. B. Industries ======================================================

const lbiWork = api.LBI_OPTIONS.filter((e) => e.ch);

check('seven work options, as the guide\'s Progress table',
  lbiWork.map((e) => [e.name, e.ch.stat, e.ch.diff, e.win, e.rare, e.lose]),
  [['Work the bellows to produce steam', 'Dangerous', 50, 5, 15, 0],
   ['Make bobbins', 'Persuasive', 50, 5, 15, 0],
   ['Take over from the spinners', 'Watchful', 125, 15, 34, -19],
   ['Assist with assembly', 'Shadowy', 178, 32, 34, -2],
   ['Contribute – and install – a hard tip for the driller', 'Shadowy', 88, 29, 30, 0],
   ['Put out a fire by the smelters', 'Dangerous', 125, 15, 34, -19],
   ['Test the latest batch of weapons', 'Dangerous', 125, 15, 34, -19]]);

check('the guide\'s "Min for 100%" is the difficulty × 5/3 on every row',
  lbiWork.filter((e) => api.broadCertainAt(e.ch.diff) !== e.guideMin).map((e) => e.name), []);

check('only the two pages that state rare odds carry them',
  lbiWork.filter((e) => e.rareOdds != null).map((e) => [e.name, e.rareOdds]),
  [['Take over from the spinners', 0.2], ['Assist with assembly', 0.2]]);

check('and the others say the page gives none, rather than assume',
  lbiWork.filter((e) => e.rareOdds == null && !api.lbiSpec(e).title.includes('The page gives no odds')).length, 0);

check('the two Ratterbox-gated options and their windows',
  lbiWork.filter((e) => e.airs).map((e) => [e.name, e.airs]),
  [['Put out a fire by the smelters', '51–75'], ['Test the latest batch of weapons', '76–100']]);

check('the payout ladder, cheapest first',
  api.LBI_OPTIONS.filter((e) => e.cost != null).map((e) => [e.cost, e.gives]),
  [[10, 'Crate of Incorruptible Biscuits ×1'],
   [60, 'Bessemer Steel Ingot ×8 and Hinterland Scrip ×7'],
   [110, 'Ratty Reliquary ×1'],
   [235, 'Fourth-City Echo ×2'],
   [610, 'Crackling Device ×1']]);

check('work badges: the success, ? for the challenge, a failure that takes Favour back, ▼ for the diamond',
  ['Work the bellows to produce steam', 'Take over from the spinners', 'Assist with assembly',
   'Contribute – and install – a hard tip for the driller'].map((n) => api.lbiBadgeText(lbi(n))),
  ['FF +5?', 'FF +15? −19', 'FF +32? −2', 'FF +29? ▼']);

check('a payout is its cost and what it buys',
  ['Accept a reverent thanks for your labour', 'Ask for a Crackling Device as payment']
    .map((n) => api.lbiBadgeText(lbi(n))),
  ['110 → Reliquary', '610 → Crackling Device']);

check('a payout tooltip carries the surplus rule',
  api.lbiSpec(lbi('Receive your pay in biscuits')).title.includes('pays 10 Bone Fragments'), true);

check('leaving says the Favour goes with it',
  [api.lbiBadgeText(lbi('Bid farewell to (work leader)')),
   api.lbiSpec(lbi('Bid farewell to (work leader)')).title.includes('Foreman’s Favour and your Work Team are both gone')],
  ['leave', true]);

check('the carousel storylet summarises, the way in is labelled, the rest say nothing',
  [api.lbiStoryletSpec(key(api.LBI_STORYLET)).text,
   api.lbiStoryletSpec(key('Head Far Beneath the Blind Helmsman')).text,
   api.lbiStoryletSpec(key('Shutting Down for the Day'))],
  ['FF → pay', 'factory', null]);

// === Department of Menace Eradication ======================================

check('the two contracts set what the guide\'s cheat sheet says',
  api.DME_CONTRACTS.map((c) => [c.name, c.hiding, c.sav, c.war]),
  [['A Worryingly Large Rat', 10, 15, 0], ['A Malicious Ushabti', 30, 30, 4]]);

// The pages give each Savagery-scaled challenge as an example difficulty at a
// stated Savagery; the formula has to reproduce it (the game rounds down).
check('the Savagery formulas reproduce each page\'s own example',
  [['Search for traces', 15], ['Expose yourself as bait', 15], ['Employ the strategies of Mr Inch', 15],
   ['Stalk silently', 15], ['Lay a shining trail', 15], ['Shoot it the moment you see it', 15],
   ['Destroy the d__ned thing!', 30]].map(([n, sav]) => {
    const ch = dme(n).ch;
    return Math.floor(ch.per * sav + (ch.plus || 0));
  }),
  [15, 22, 30, 15, 15, 15, 65]);

check('the two challenges whose scaling no page states say so instead of guessing',
  api.DME_OPTIONS.filter((e) => e.ch && !e.ch.luck && e.ch.diff == null && e.ch.per == null).map((e) => e.name),
  ['Approach it very casually', 'Explore its lair thoroughly before it returns']);

check('a Savagery challenge is worked out at both contracts\' starting Savagery',
  api.dmeChallengeLine(dme('Destroy the d__ned thing!').ch),
  'Challenge: Dangerous against 2 × Quarry’s Savagery + 5 -- at the Rat’s starting Savagery 15, 35, '
  + 'certain at 59; at the Ushabti’s starting Savagery 30, 65, certain at 109.');

check('hunting badges',
  ['Search for traces', 'Expose yourself as bait', 'Employ the strategies of Mr Inch', 'Stalk silently',
   'Lay a shining trail', 'Approach it very casually', 'Lay poisoned bait']
    .map((n) => api.dmeBadgeText(dme(n))),
  ['Hiding −2–5?', 'Hiding −2–10?', 'Hiding −5–7? +1', 'War −1?', 'Hiding −10–16 War −0–1? ▼',
   'Hiding −10 War +1? +1', '≈Sav −1.8 ▼']);

check('a failure that only brings Hiding down less is not shown as lost ground',
  api.dmeBadgeText(dme('Search for traces')).includes('+'), false);

check('contracts, confrontations and bounties',
  ['Contract: a Worryingly Large Rat', 'Contract: A Malicious Ushabti', 'Shoot it the moment you see it',
   'Destroy the d__ned thing!', 'Capture it alive!', 'The bounty for a Malicious Ushabti',
   'Claim bounty for dead rats'].map((n) => api.dmeBadgeText(dme(n))),
  ['Hiding 10 Sav 15', 'Hiding 30 Sav 30 War 4', 'Rostygold 200?', 'Gratitude 800? +4', 'Ushabti? +4',
   'Gratitude 800', '5 actions: Rostygold ▼']);

check('the guide disagrees with the pages in exactly three rows',
  api.DME_OPTIONS.filter((e) => e.guide).map((e) => [e.name, e.guide]),
  [['Stalk silently', { ch: 'Dangerous' }],
   ['Shoot it the moment you see it', { lose: 'Hiding +2' }],
   ['Capture it alive!', { win: 'Dangerous +12 CP as well' }]]);

check('and the tooltip says which it followed',
  api.DME_OPTIONS.filter((e) => e.guide && !/option page (is followed|does not)/.test(api.dmeSpec(e).title))
    .map((e) => e.name), []);

check('the Luck challenge\'s expectation is in the tooltip beside the success',
  api.dmeSpec(dme('Lay poisoned bait')).title.includes('Expected, counting the failure: Quarry’s Savagery −1.8'), true);

check('a confrontation is only found in its own storylet',
  [api.carouselLookup(api.DME_INDEX, 'Shoot it the moment you see it', key(api.DME_HUNT)),
   api.carouselLookup(api.DME_INDEX, 'Shoot it the moment you see it', key(api.DME_MAZE)).name],
  [null, 'Shoot it the moment you see it']);

check('the four storylets that get a summary',
  ['The Department of Menace Eradication', 'Hunting across London', 'A Rat in a Sewery Maze',
   'Confrontation in the Belfry', 'Returning to the Department']
    .map((s) => { const spec = api.dmeStoryletSpec(key(s)); return spec && spec.text; }),
  ['contracts', 'Hiding → 0', 'confront', 'confront', null]);

// === Vertiginous Horticulture ==============================================

check('the eight plants, as the guide\'s table has them',
  api.VH_GROWS.map((g) => [g.difficulty, g.cls, g.light]),
  [[2, 'Plantae', 'Shade'], [1, 'Plantae', 'Sunlight'], [1, 'Fungi', 'Darkness'], [2, 'Plantae', 'Shade'],
   [2, 'Fungi', 'Shade'], [3, 'Plantae', 'Sunlight'], [3, 'Fungi', 'Darkness'], [2, 'Plantae', 'Shade']]);

check('an option meets only the Difficulties of the plants it can be used on',
  [undefined, 'Plantae', 'Fungi', 'Shade', 'Sunlight', 'Darkness']
    .map((only) => api.vhDifficulties({ only })),
  [[1, 2, 3], [1, 2, 3], [1, 2, 3], [2], [1, 3], [1, 3]]);

// The guide's Average Gain column is success, rare success and rare odds
// combined -- and at 30% on the four class options, which is how the pages'
// rare chance is confirmed.
check('the guide\'s Average Gain is the pages\' figures combined, on every nurturing row',
  api.VH_OPTIONS.filter((e) => e.kind === 'nurture').filter((e) => {
    const ds = api.vhDifficulties(e);
    const avg = [api.vhAverage(e, ds[0]), api.vhAverage(e, ds[ds.length - 1])];
    return avg[0] !== e.guideAvg[0] || avg[1] !== e.guideAvg[1];
  }).map((e) => e.name), []);

check('the guide\'s challenge column disagrees with eight pages, by name',
  api.VH_OPTIONS.filter((e) => e.guide && e.guide.ch).map((e) => e.name),
  ['Divine the needs of your (growth)', 'Water your (growth)', 'Treat the soil', 'Prune your (growth)',
   'Eliminate pests', 'Plunge your (growth) into appropriate darkness',
   'Contrive a shaded spot for your (growth)', 'Blast your (growth) with light']);

check('nurturing badges: the range over the Difficulties it meets, and a failure that takes Nurturing back',
  ['Divine the needs of your (growth)', 'Water your (growth)', 'Secure vital nutrition for your precious (growth type)',
   'Prune your (growth)', 'Contrive a shaded spot for your (growth)', 'Blast your (growth) with light']
    .map((n) => api.vhBadgeText(vh(n))),
  ['Grow +10–12?', 'Grow +10–12? −0–2', 'Grow +14–16?', 'Grow +13–15?', 'Grow +16? −1', 'Grow +15–17? −0–2']);

check('a plant is its Difficulty, a buyer what the sale gives',
  [api.vhBadgeText(vh('Grow a bush of Millennium Roses')),
   api.vhBadgeText(vh('Offer your (growth type) to the Dreamy Mycologist'))],
  ['diff 3', '→ SBL ×5']);

check('the scaling reward reproduces the guide\'s figures at 150, and is nothing at 105',
  api.VH_OPTIONS.filter((e) => e.kind === 'sell').map((e) => [api.vhSale(e, 150), e.at150, api.vhSale(e, 105)]),
  [[22, 22, 0], [37, 37, 0], [225, 225, 0]]);

check('every nurturing tooltip carries the failure and the no-menace rule',
  api.VH_OPTIONS.filter((e) => e.kind === 'nurture').filter((e) => {
    const t = api.vhSpec(e).title;
    return !t.includes('Failure: Nurturing') || !t.includes('No failure here raises a menace');
  }).map((e) => e.name), []);

check('the game\'s filled-in titles are found in the open storylet',
  ['Water your Millennium Roses', 'Secure vital nutrition for your precious fungus',
   'Offer your plant to the Sneering Horticulturalist']
    .map((n) => { const e = api.carouselLookup(api.VH_INDEX, n, key(api.VH_STORYLET)); return e && e.name; }),
  ['Water your (growth)', 'Secure vital nutrition for your precious (growth type)',
   'Offer your (growth type) to the Sneering Horticulturalist']);

// === the three together ====================================================

check('no carousel name is in another feature\'s table, or in another carousel\'s',
  (() => {
    const names = (t) => t.map((e) => key(e.name));
    const carousels = [names(api.LBI_OPTIONS), names(api.DME_OPTIONS), names(api.VH_OPTIONS)];
    const others = [
      ...api.ZEE_CARDS.map((c) => key(c.name)), ...api.SPITE_CARDS.map((c) => key(c.name)),
      ...api.FOTZ_CARDS.map((c) => key(c.name)), ...api.LAB_CARDS.map((c) => key(c.name)),
      ...api.ARBOR_OPTIONS.map((e) => key(e.name)),
      ...api.PC_OPTIONS.flatMap((p) => [key(p.name), p.branch ? key(p.branch) : '']),
      ...api.VSD_OPTIONS.flatMap((v) => [key(v.storylet), key(v.branch)]),
    ];
    return carousels.flatMap((own, i) => own.filter((n) => others.includes(n)
      || carousels.some((other, j) => j !== i && other.includes(n))));
  })(), []);

check('the registered passes: each carousel badges its own open storylet\'s options and clears on leaving',
  (() => {
    const run = () => { api.lbiRatings(); api.dmeRatings(); api.vhRatings(); };
    const bobbins = makeHeading('Make bobbins');
    const water = makeHeading('Water your mandrakes');
    branches = [bobbins, water];
    const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
    const out = [];
    roots = [makeHeading('Your Labour, and its Fruits')];
    run();
    out.push([text(roots[0], api.LBI_CLASS), text(bobbins, api.LBI_BRANCH_CLASS), text(water, api.VH_BRANCH_CLASS)]);
    roots = [makeHeading('Vertiginous Horticulture')];
    run();
    out.push([text(roots[0], api.VH_CLASS), text(bobbins, api.LBI_BRANCH_CLASS), text(water, api.VH_BRANCH_CLASS)]);
    roots = [];
    run();
    out.push([text(water, api.VH_BRANCH_CLASS)]);
    branches = [];
    return out;
  })(),
  [['FF → pay', 'FF +5?', null], ['Grow → 105', null, 'Grow +10–12? −0–2'], [null]]);

check('a storylet in the list gets its summary with nothing open',
  (() => {
    list = [makeHeading('Hunting across London')];
    api.dmeRatings();
    const b = badgeOf(list[0], api.DME_CLASS);
    list = [];
    return b && b.textContent;
  })(), 'Hiding → 0');

check('the three features are registered',
  ['lb-industries', 'menace-eradication', 'vertiginous-horticulture']
    .map((n) => api.FEATURES.some((f) => f.name === n)), [true, true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
