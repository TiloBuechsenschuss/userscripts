// Ad-hoc test for FallenLondon/choice-helper.js's Fascinating... ('fascinating') and Inspired...
// ('inspired') features on the shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The vocabulary for a spend that moves a SECOND quality: a court romance step reads
//    "Fasc 6 v -> Wit +2? -6 · Beauty -1", the "Seen with" qualities by their short names, a rival
//    pushed back by name, and an amount the page does not give as an arrow ("Flies ^").
//  - The trap the guide sets: it files the Rising Artist's last two options under the Rising
//    Artist's Model and the reverse; the pages say which quality each loses, and are followed.
//  - Every guide-versus-page disagreement, by name.
//  - The court's three romances are one ladder each: every level 1-5 has a storylet, level 6 an
//    ending, and every step is a narrow challenge on Fascinating 6 unless it is a plain choice.
//  - The cards: the hand badge and the opened heading carry the card's own badge once.
//  - Two storylets that share an option title ("Walk away") are told apart by the open one.
//  - That no title is in another feature's table.
//
// Numbers come from the option and storylet pages on fallenlondon.wiki, fetched through the API
// on 2026-09-24, with Fascinating (Guide) and Inspired (Guide) as the cross-check.
//
//   node tests/choice-fascinating-inspired.test.mjs

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
    + ' FAS_CFG, FAS_OPTIONS, FAS_INDEX, FAS_DEF, FAS_CARDS, fasRatings, INSP_CFG, INSP_OPTIONS, INSP_INDEX, INSP_DEF, inspRatings,'
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
const fas = (storylet, name) => api.FAS_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const ins = (storylet, name) => api.INSP_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const ft = (storylet, name) => api.pqBadgeText(fas(storylet, name), api.FAS_CFG);
const it = (storylet, name) => api.pqBadgeText(ins(storylet, name), api.INSP_CFG);
const ALLURE = 'Attend to Matters of Allure';

// === Fascinating: the vocabulary ==========================================

check('a gain at court: Attend to fashion, Attend a dance (a failure that takes 2 back and adds a Scandal)',
  [ft(ALLURE, 'Attend to fashion'), ft(ALLURE, 'Attend a dance')], ['Fasc +2?', 'Fasc +3? −2']);

check('a spend that raises a second quality names it, and the failure takes 6 back: Impress the wit',
  ft('Attend a ball in aid of a good cause', 'Impress the wit'), 'Fasc 6 ▼ → Wit +2? −6');

check('and one that pushes a rival back names her: Choose Wit over Beauty, Call attention to the Beauty',
  [ft('Attend a ball in aid of a good cause', 'Choose Wit over Beauty'), ft('Sparkling wit', 'Call attention to the Acclaimed Beauty')],
  ['Fasc 6 ▼ → Wit +2? −6 · Beauty −1', 'Fasc 6 ▼ → Wit +3? −6 · Beauty −1']);

check('a Scandal it always raises is on the badge: Bandy words with the Barbed Wit',
  ft('Sparkling wit', 'Bandy words with the Barbed Wit'), 'Fasc 6 ▼ → Wit +3? −6 · Scandal +3');

check('a plain choice has no challenge and no question mark: Return fire; one that costs nothing is a label',
  [ft('An indecorous argument', 'Return fire'), ft('The Wit and the Physician', 'Nod and smile along.'),
    ft('An indecorous argument', 'Walk away')],
  ['Fasc 6 ▼ → Wit +6', 'Wit −3', 'Wit −5 · resets Fasc']);

check('an amount the page does not give is an arrow: Draw the eye, and a rival set to a number in words',
  [ft('Attend a ball in aid of... some cause or another', 'Draw the eye. Every eye...'),
    ft('Outshine your rivals', 'Make a point of getting in the Wit’s way.')],
  ['Fasc 6 ▼ → Flies ↑? −6', 'Fasc 6 ▼ → Beauty ↑? −6 · Wit set 2']);

check('every ending takes all the Fascinating and gives the Memento of Passion; the exotic ones are Hedonist 8',
  api.FAS_OPTIONS.filter((e) => /^Conclude your/.test(e.storylet)).map((e) => [ft(e.storylet, e.name), e.needs || null]),
  [['Fasc 6 ▼ → end the affair · Memento of Passion', null], ['Fasc 6 ▼ → end the affair · Memento of Passion', null],
    ['Fasc 6 ▼ → end the affair · Scandal +10', 'Hedonist 8'],
    ['Fasc 6 ▼ → end the affair · Memento of Passion', null], ['Fasc 6 ▼ → end the affair · Memento of Passion', null],
    ['Fasc 6 ▼ → end the affair · Memento of Passion', 'Hedonist 8'],
    ['Fasc 6 ▼ → end the affair · Memento of Passion', null], ['Fasc 6 ▼ → end the affair · Scandal +10', 'Hedonist 8']]);

check('a seduction\'s resolution names what it pays: a spend with items and a Persuasive gain',
  [ft('Seduce a Struggling Artist’s Model: the resolution!', 'Drop hints and wait to be invited back to her rooms.'),
    ft('Become Better Acquainted with a Charming Young Jewel-Thief: the Resolution!', 'Commence an affair with the jewel-thief')],
  ['Fasc 3 ▼ → Clue ×60? −1 · Persuasive +20', 'Fasc 5 ▼ → Jade ×54? −5 · Persuasive +10']);

check('the servantry costs a set 6, 10 or 15 and needs 3, 4 or 5, on a wide Persuasive challenge',
  api.FAS_OPTIONS.filter((e) => e.storylet === 'Disporting with the servantry').map((e) => [e.need, e.cost, e.ch.diff, ft(e.storylet, e.name)]),
  [[3, 6, 87, 'Fasc −6 ▼ → Confident Smile? · Hedonist +1'], [4, 10, 89, 'Fasc −10 ▼ → Clue ×45? · Hedonist +1 · Scandal −1'],
    [5, 15, 91, 'Fasc −15 ▼ → Wounds −2? · Hedonist +1']]);

check('the Courier\'s secrets: Persuasive 150, no challenge, and what it costs is in the tooltip',
  [ft('The Tattooed Courier’s Secrets', 'Sell her secrets to the highest bidder'),
    /Spends: Moon-Pearl ×500\./.test(api.pqSpec(fas('The Tattooed Courier’s Secrets', 'Sell her secrets to the highest bidder'), api.FAS_CFG).title)],
  ['Fasc 6 ▼ → Persuasive +150 · Passphrase ×2 · Ruthless +3', true]);

// === Fascinating: the court romances are three ladders =============================

const ladder = (levelStorylets) => levelStorylets.map((s) => api.FAS_OPTIONS.filter((e) => e.storylet === s).length);

check('the Barbed Wit: a way in, and a storylet for each of levels 1 to 5 and the ending, each with its options',
  ladder(['A Barbed Wit', 'Attend a ball in aid of a good cause', 'Sparkling wit', 'The Wit and the Physician',
    'Winning over the Barbed Wit’s friends', 'An indecorous argument', 'Conclude your affair with the Barbed Wit']),
  [1, 2, 2, 3, 2, 2, 3]);

check('the Acclaimed Beauty and the Fashion-Flies have the same shape',
  [ladder(['An Acclaimed Beauty', 'Attend a ball in aid of a worthy cause', 'An occult history', 'Outshine your rivals',
    'A stroll with the Acclaimed Beauty', 'Opening the heart', 'Conclude your affair with the Acclaimed Beauty']),
  ladder(['The Unattainable Fashion-Flies', 'Attend a ball in aid of... some cause or another', 'One of the Fashion-Flies’ Secrets',
    'The Dowager and the Fashion-Fly', 'Making Friends with the Unattainable Fashion-Flies', 'The Moment of Triumph',
    'Conclude your Dalliance with the Unattainable Fashion-Flies'])],
  [[1, 2, 1, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2, 2]]);

check('every narrow step of a romance needs Fascinating 6 though Opening the heart\'s challenge is 5',
  api.FAS_OPTIONS.filter((e) => e.spend !== undefined && e.ch && e.ch.narrow
    && /Barbed Wit|Beauty|Fashion-Fl|ball in aid|Sparkling|Outshine|indecorous|occult|Dowager|Wit and the|Opening the heart/.test(e.storylet))
    .filter((e) => e.spend !== 6).map((e) => e.name), []);

check('a rival is pushed back only by the options that name one: Wit and Beauty, at 1 each',
  api.FAS_OPTIONS.filter((e) => (e.x || []).some((p) => /Seen with/.test(p[0]) && p[1] < 0)).map((e) => e.name),
  ['Choose Wit over Beauty', 'Call attention to the Acclaimed Beauty', 'Ask about the affair with the Acclaimed Beauty',
    'Choose Beauty over Wit', 'Speak of the ills done to you by the Barbed Wit', 'Choose fashion over flirtation']);

// === Fascinating: the guide and the pages disagree ============================================

check('the guide\'s Rising Artist and Rising Artist\'s Model spends are the wrong way round, and the pages\' storylets are followed',
  [fas('A gentleman to remember', 'It is time.').guide, fas('A lady to remember', 'The time is right').guide,
    fas('A gentleman to remember', 'Hold back, and let him come to you').guide],
  ['The guide files this under the Rising Artist’s Model.', 'The guide files this under the Rising Artist.',
    'The guide gives difficulty 9 and files it under the Rising Artist’s Model.']);

check('every other disagreement is carried and the page figure is the badge\'s',
  [[fas('Seduce a Struggling Artist’s Model: the resolution!', 'Drop hints and wait to be invited back to her rooms.'), /difficulty 3/, 2],
    [fas('Seduce a Struggling Artist’s Model: the resolution!', 'Turn up shivering and desperate at her rooms one midnight. Bang on her door and beg shelter.'), /difficulty 8/, 7],
    [fas('Become Better Acquainted with a Charming Young Jewel-Thief: the Resolution!', 'Commence an affair with the jewel-thief'), /difficulty 4/, 3],
    [fas('Seek the Acquaintanceship of a Cloistered Diatomist: the Resolution!', 'Lay the foundations of a firm friendship with the Diatomist'), /difficulty 4/, 3],
    [fas('Become Better Acquainted with a Cloistered Diatomist', 'This might be faster... Arrange matters so that you have an invitation to a gathering of \'Admirers of the Invisible World\''), /\+2/, null]]
    .map(([e, re, diff]) => [re.test(e.guide), diff === null ? e.win : e.ch.diff]),
  [[true, 2], [true, 7], [true, 3], [true, 3], [true, 3]]);

check('two options are the guide\'s alone, because their pages are empty, and say so',
  api.FAS_OPTIONS.filter((e) => /empty|guide alone/.test(e.note || '')).map((e) => e.name),
  ['Flattery and careless charm', 'Flattery and careless charm', 'This might be faster... Arrange matters so you meet in a honey-dream.',
    'This might be faster... Arrange matters so you meet in a honey-dream.']);

// === Inspired ========================================================================

check('Inspired reads the same: a gain, a spend, a gain whose failure adds to it',
  [it('Making Your Name: A Commissioned Epic', 'Celebrate Fungus in Verse: Make up the details'),
    it('Making Your Name: A Commissioned Epic', 'Celebrate Fungus in Verse: an honest effort'),
    it('Commission: A Royal Portrait', 'Paint a flattering and subversive portrait')],
  ['Insp +3? · fail +1', 'Insp 4 ▼ → Silk ×27? −1 · Persuasive +10', 'Insp 5 ▼ → Clue ×300 · Amber ×190? −10 · Persuasive +6']);

check('a spend that opens a bundle says so instead of a price: Submit your notes, Be bold!',
  [it('Publish your experiences with prisoner’s honey: the resolution!', 'Submit your notes'),
    it('Publish your experiences with prisoner’s honey: the resolution!', 'Be bold!')],
  ['Insp 4 ▼ → bundle ≤126? −1 · Persuasive +9', 'Insp 6 ▼ → bundle ≤199? −5 · Persuasive +15 · Subtle +1']);

check('the guide\'s Be bold! has the failure the wrong way round and a level the page does not record',
  [/failure as \+5 and the level as 6/.test(ins('Publish your experiences with prisoner’s honey: the resolution!', 'Be bold!').guide),
    ins('Publish your experiences with prisoner’s honey: the resolution!', 'Be bold!').lose],
  [true, -5]);

check('the Fungus field work is a Watchful 11 in the Epic, and the guide\'s second listing under Jack is not carried',
  [ins('Making Your Name: A Commissioned Epic', 'Celebrate Fungus in Verse: Field work!').ch,
    api.INSP_OPTIONS.filter((e) => e.storylet.startsWith('Commission: Immortalise') && /Field work/.test(e.name)).length],
  [{ stat: 'Watchful', diff: 11 }, 0]);

check('a card option is a gain, a poetic missive is a label, and a Carnival option is narrow on the quality itself',
  [it('Caligula’s Coffee House', 'Drink the number four special'), it('Read incoming mail', 'Read a poetic missive'),
    it('Visit Madame Shoshana, the Neath’s Foremost Clairvoyante', 'Ask for help with artistic endeavours'),
    ft('Visit Madame Shoshana, the Neath’s Foremost Clairvoyante', 'Ask for a romantic prediction')],
  ['Insp +25? −10 · Nightmares +1', 'Insp +⅕ of base Persuasive', 'Insp +2?', 'Fasc +2?']);

// === titles and scoping =====================================================================

check('"Walk away" is an option of two court storylets, told apart by the open one',
  (() => {
    const l = (open) => api.carouselLookup(api.FAS_INDEX, 'Walk away', key(open));
    return [l('An indecorous argument').x, l('The Moment of Triumph').label, l('Sparkling wit')];
  })(), [undefined, 'Flies gone · resets Fasc', null]);

check('"Pursue the Barbed Wit" and its two siblings are one action in three storylets and never one badge',
  ['A Barbed Wit', 'An Acclaimed Beauty', 'The Unattainable Fashion-Flies']
    .map((s) => api.pqBadgeText(api.FAS_OPTIONS.find((e) => e.storylet === s), api.FAS_CFG)),
  ['Fasc 6 ▼ → Wit +1', 'Fasc 6 ▼ → Beauty +1', 'Fasc 6 ▼ → Flies +1']);

check('an option answers only in its own open storylet: Impress the wit is nothing at the Beauty\'s ball',
  [api.carouselLookup(api.FAS_INDEX, 'Impress the wit', key('Attend a ball in aid of a worthy cause')),
    api.carouselLookup(api.FAS_INDEX, 'Impress the wit', key('Attend a ball in aid of a good cause')) !== null], [null, true]);

check('the Seducing storylets\' shared "Flattery and careless charm" is two options in two storylets',
  api.FAS_OPTIONS.filter((e) => e.name === 'Flattery and careless charm').map((e) => e.storylet),
  ['Seduce a Struggling Artist’s Model: next steps...', 'Seduce a Struggling Artist: next steps...']);

// === the cards =====================================================================================

check('a card in the hand carries its lead option, and the opened card has one badge on the heading and one on its option',
  (() => {
    const card = makeHeading('The Seekers of the Garden');
    const opt = makeHeading('Entertain a curious crowd');
    hand = [card];
    branches = [opt];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    api.fasRatings();
    out.push(t(card, api.FAS_DEF.cardCls));
    hand = [];
    roots = [makeHeading('The Seekers of the Garden')];
    api.fasRatings();
    out.push([t(roots[0], api.FAS_DEF.cardCls), t(roots[0], api.FAS_DEF.cls), t(opt, api.FAS_DEF.branchCls)]);
    roots = [];
    branches = [];
    return out;
  })(), ['Fasc +7 · Making Waves +3', ['Fasc +7 · Making Waves +3', null, 'Fasc +7 · Making Waves +3']]);

check('The Ambassador\'s Ball badges its dance option, quotes the guide, and the other option moves no Fascinating',
  [ft('The Ambassador’s Ball', 'Dance with a certain someone'), ft('The Ambassador’s Ball', 'Making a point of not making a point'),
    /Commission a painting of someone/.test(fas('The Ambassador’s Ball', 'Dance with a certain someone').guide)],
  ['Fasc +3–6? −5', 'Confident Smile ×1? · Making Waves +3', true]);

check('a card of another feature is left alone by both',
  (() => {
    const card = makeHeading('A drunk');
    hand = [card];
    api.fasRatings();
    api.inspRatings();
    const out = [badgeOf(card, api.FAS_DEF.cardCls), badgeOf(card, api.INSP_DEF.cardCls)];
    hand = [];
    return out;
  })(), [null, null]);

check('Inspired\'s two cards badge the hand: the coffee house and the excursion',
  (() => {
    const c1 = makeHeading('Caligula’s Coffee House');
    const c2 = makeHeading('Share in Your Wife’s Passions');
    hand = [c1, c2];
    api.inspRatings();
    const out = [c1, c2].map((h) => { const b = badgeOf(h, api.INSP_DEF.cardCls); return b && b.textContent; });
    hand = [];
    return out;
  })(), ['Insp +25? −10 · Nightmares +1', 'Insp +20']);

// === the tables ==========================================================================================

const all = [[api.FAS_OPTIONS, api.FAS_CFG], [api.INSP_OPTIONS, api.INSP_CFG]];

check('every entry is filed under a storylet, named, and has a non-empty badge',
  all.flatMap(([t, cfg]) => t.filter((e) => !e.storylet || !e.name || !api.pqBadgeText(e, cfg)).map((e) => e.name)), []);

check('no storylet holds a title twice',
  all.flatMap(([t]) => t.filter((e, i, a) =>
    a.findIndex((o) => key(o.storylet) === key(e.storylet) && key(o.name) === key(e.name)) !== i).map((e) => e.name)), []);

check('every narrow spend is on the quality itself and every spend that is not narrow says why',
  [api.FAS_OPTIONS.filter((e) => e.ch && e.ch.narrow && e.ch.stat !== 'Fascinating...').map((e) => e.name),
    api.INSP_OPTIONS.filter((e) => e.ch && e.ch.narrow && e.ch.stat !== 'Inspired...').map((e) => e.name)], [[], []]);

check('the two features share only Madame Shoshana\'s tent, no title with each other, and none with Casing',
  (() => {
    const f = api.FAS_OPTIONS.map((e) => key(e.name));
    const i = api.INSP_OPTIONS.map((e) => key(e.name));
    const c = api.CASING_OPTIONS.map((e) => key(e.name));
    return [i.filter((n) => f.includes(n)), f.filter((n) => c.includes(n)),
      api.INSP_OPTIONS.map((e) => key(e.storylet)).filter((s) => api.FAS_OPTIONS.some((o) => key(o.storylet) === s))];
  })(), [[], [], ['visit madame shoshana the neath s foremost clairvoyante']]);

check('Madame Shoshana\'s heading has one badge, from Fascinating, and Inspired\'s option inside it is badged',
  (() => {
    const romantic = makeHeading('Ask for a romantic prediction');
    const artistic = makeHeading('Ask for help with artistic endeavours');
    branches = [romantic, artistic];
    roots = [makeHeading('Visit Madame Shoshana, the Neath’s Foremost Clairvoyante')];
    api.fasRatings();
    api.inspRatings();
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [t(roots[0], api.FAS_DEF.cls) !== null, t(roots[0], api.INSP_DEF.cls), t(romantic, api.FAS_DEF.branchCls),
      t(artistic, api.INSP_DEF.branchCls), t(artistic, api.FAS_DEF.branchCls)];
    roots = [];
    branches = [];
    return out;
  })(), [true, null, 'Fasc +2?', 'Insp +2?', null]);

check('no option title is also a title in another feature\'s table',
  (() => {
    const mine = [...api.FAS_OPTIONS, ...api.INSP_OPTIONS].filter((e) => e.name !== 'Walk away').map((e) => key(e.name));
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

check('the two features are registered',
  ['fascinating', 'inspired'].map((n) => api.FEATURES.some((f) => f.name === n)), [true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
