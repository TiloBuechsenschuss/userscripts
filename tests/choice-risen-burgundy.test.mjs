// Ad-hoc test for FallenLondon/choice-helper.js's Risen Burgundy feature ('risen-burgundy') on the
// shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The cross-check the guide allows: the Weaver's four deliveries times their payouts give the
//    guide's four totals exactly (5 x 4 = 20, 1 x 3 = 3, 2 x 4 = 8, 27 x 2 = 54).
//  - The traps: four Weaver cards share ONE option title; "Conclude your business" and "Make a run for
//    it" are options of two cards each; the hunting card is named after its quarry ("(Roof Prey)").
//  - The vocabulary for a game that moves several qualities: each option names its own, and a payout
//    takes 10 of a counter ("BB -10 v -> ...").
//  - The Saint's Day ladder: four progress cards of two options each, all +1, two conflict cards, two payouts.
//  - Heralds from Elsewhere: six steps, one after another, the last with two variants.
//  - That no title is in another feature's table.
//
// Numbers come from the card and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-25, with Risen Burgundy (Guide) as the cross-check.
//
//   node tests/choice-risen-burgundy.test.mjs

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
    + ' RBG_CFG, RBG_OPTIONS, RBG_INDEX, RBG_DEF, RBG_CARDS, RBG_WEAVER_VISIONS, rbgRatings, HW_OPTIONS, SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS,'
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
const rbg = (storylet, name) => api.RBG_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const rt = (storylet, name) => api.pqBadgeText(rbg(storylet, name), api.RBG_CFG);
const HUNT = 'Hunting the (Roof Prey)';
const WEAVER = 'A Delivery from the Gall-Eyed Weaver';

// === the payouts ==================================================================

check('a payout takes 10 of its counter and names what it gives: the ballad, the coffin, the mint',
  [rt('Gifts of Burgundy', 'A chivalric romance'), rt('The Spoils of Rebellion', 'The coffin'), rt('Gifts of Burgundy', 'Access to the mint')],
  ['BB −10 ▼ → Captivating Ballad', 'ATK −10 ▼ → Soothe & Cooper Long-Box', 'BB −10 ▼ → opens the Ducal Mint']);

check('five gifts at Beneficence 10 and four spoils at Against Time and Kings 10, each a fixed 10',
  [api.RBG_OPTIONS.filter((e) => e.storylet === 'Gifts of Burgundy').map((e) => [e.q[1], e.need, e.cost]),
    api.RBG_OPTIONS.filter((e) => e.storylet === 'The Spoils of Rebellion').map((e) => [e.q[1], e.need, e.cost])],
  [Array(5).fill(['BB', 10, 10]), Array(4).fill(['ATK', 10, 10])]);

// === the hunt ======================================================================

check('a hunt takes a Season off whatever happens, on a wide challenge the guide gives in full',
  [rt(HUNT, 'Go for glory'), rt(HUNT, 'Stay with the pack'),
    /Dangerous \+ 15 × Neathproofed 230, certain at Dangerous \+ 15 × Neathproofed 384/.test(api.pqSpec(rbg(HUNT, 'Go for glory'), api.RBG_CFG).title),
    /Dangerous \+ 15 × Insubstantial 210, certain at Dangerous \+ 15 × Insubstantial 350/.test(api.pqSpec(rbg(HUNT, 'Stay with the pack'), api.RBG_CFG).title)],
  ['Season −1? · Making Waves +5', 'Season −1?', true, true]);

check('Stay with the pack has an empty page, so the guide\'s figures are said to be the guide\'s',
  /The option page is empty/.test(rbg(HUNT, 'Stay with the pack').guide), true);

check('the hunting card is named after its quarry: any "Hunting the ..." heading badges the options, in the hand and opened',
  (() => {
    const card = makeHeading('Hunting the Wild Boar');
    const opt = makeHeading('Go for glory');
    hand = [card];
    branches = [opt];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    api.rbgRatings();
    out.push(t(card, api.RBG_DEF.cardCls));
    hand = [];
    roots = [makeHeading('Hunting the Stag of Ten Tines')];
    api.rbgRatings();
    out.push([t(roots[0], api.RBG_DEF.cardCls), t(roots[0], api.RBG_DEF.cls), t(opt, api.RBG_DEF.branchCls)]);
    roots = [];
    branches = [];
    return out;
  })(), ['Season −1', ['Season −1', null, 'Season −1? · Making Waves +5']]);

check('the revels end the hunt and give two Memories and two Codes',
  [rt('An Invitation from the Swashbuckling Chevalier', 'Attend the revels'),
    rbg('An Invitation from the Swashbuckling Chevalier', 'Attend the revels').g],
  ['ends the hunt → 2 Memories · 2 Codes', [['Memory of a Much Stranger Self', 2], ['Cave-Aged Code of Honour', 2]]]);

// === a Saint's Day ===================================================================

const PROGRESS = ['Aiding a Feast: Church and State', 'Aiding a Feast: Hearts and Stomachs', 'Spreading Sedition: A Twisted Pilgrimage',
  'Spreading Sedition: Hearts and Minds'];

check('four progress cards of two options each, every one +1 to the Saint\'s Day',
  PROGRESS.map((s) => api.RBG_OPTIONS.filter((e) => e.storylet === s).map((e) => e.win)), Array(4).fill([1, 1]));

check('a progress option is +1 on a skill of 10 (and +1 on a failure too), or a set price',
  [rt('Aiding a Feast: Church and State', 'Expose a partisan priest'), rt('Aiding a Feast: Church and State', 'Highlight a few appropriate verses'),
    rt('Spreading Sedition: Hearts and Minds', 'Bend the ears of Guildspeople')],
  ['Saint +1? · fail +1', 'Saint +1', 'Saint +1? · fail +1']);

check('the four skills are a Player of Chess, Kataleptic Toxicology, Zeefaring and Mithridacy, narrow at 10',
  api.RBG_OPTIONS.filter((e) => PROGRESS.includes(e.storylet) && e.ch).map((e) => [e.ch.stat, e.ch.diff, e.ch.narrow]),
  [['A Player of Chess', 10, true], ['Kataleptic Toxicology', 10, true], ['Zeefaring', 10, true], ['Mithridacy', 10, true]]);

check('the two payouts need 15 and 25, and the two starts say which they lead to',
  [rt('In Aid of a Feast', 'Attend the feast'), rt('A March for the People', 'Attend the pilgrimage'),
    rt('Preparations for a Saint’s Day', 'Pledge yourself to aiding a glorious feast'),
    rt('Preparations for a Saint’s Day', 'Foment unrest within a procession')],
  ['Saint 15 ▼ → Wine ×4', 'Saint 25 ▼ → Apocryphon ×4', 'Saint → feast (15) · 5 actions', 'Saint → dissent (25) · 5 actions']);

check('the conflict cards raise a menace or resolve with an item: Fund her own activities, Enlighten the Duchess',
  [rt('A Gloomy Summer', 'Fund her own activities'), rt('A Duchess’ Disapproval', 'Enlighten the Duchess as to revolutionary codes'),
    rt('A Gloomy Summer', 'Go about your work in secret')],
  ['ATK +1 · Gossip ×7 · ends the conflict', 'BB +1 · Palimpsest ×7 · ends the conflict', 'Suspicion +1 · Journal ×6']);

// === the Weaver ========================================================================

check('the four deliveries multiplied by their payouts give the guide\'s totals: 8, 3, 20 and 54',
  api.RBG_WEAVER_VISIONS.map((v) => [v.item, v.each * v.payouts, v.total]),
  [['Puzzle-Damask Scrap', 8, 8], ['Parabola-Linen Scrap', 3, 3], ['Thirsty Bombazine Scrap', 20, 20], ['Whisper-Satin Scrap', 54, 54]]);

check('the four cards share one option title: one badge, the tooltip lists all four Visions with the guide\'s Echoes',
  (() => {
    const e = rbg(WEAVER, 'Unroll your textiles');
    const s = api.pqSpec(e, api.RBG_CFG);
    return [s.text, (s.title.match(/Vision \d:/g) || []).length, /7\.5 Echoes per action/.test(s.title), /4\.83 Echoes per action/.test(s.title),
      ['Puzzle-Damask', 'Parabola-Linen', 'Bombazine', 'Whisper-Satin'].every((n) => e.aliases.some((a) => a.includes(n)))];
  })(), ['Loom −1 · textile by your Vision', 4, true, true, true]);

check('every one of the four wiki titles finds that option',
  ['Unroll your textiles', 'Unroll your textiles (Puzzle-Damask)', 'Unroll your textiles (Bombazine)']
    .map((n) => api.carouselLookup(api.RBG_INDEX, n, key(WEAVER)) !== null), [true, true, true]);

// === the Poet-Thief =====================================================================

check('"Conclude your business" and "Make a run for it" are options of two cards each, told apart by the card',
  (() => {
    const l = (n, open) => api.carouselLookup(api.RBG_INDEX, n, key(open));
    return [l('Conclude your business', 'An Encounter with the Poet-Thief').label, l('Conclude your business', 'The Poet-Thief’s Vestments').label,
      l('Make a run for it', 'Stopped by the Guards').label, l('Make a run for it', 'Recognised in the Street').label,
      l('Conclude your business', 'Stopped by the Guards')];
  })(), ['return the sack → Diamonds · Gossip ×8', 'return the hat → Damask · Satin · Gossip ×8', 'Suspicion +2 · Peppercaps ×2',
    'Scandal +2 · Palimpsest ×2', null]);

check('the two autoplay cards give three options each, every one a menace +2',
  [['Stopped by the Guards', 'Suspicion +2'], ['Recognised in the Street', 'Scandal +2']]
    .map(([s, m]) => api.RBG_OPTIONS.filter((e) => e.storylet === s).map((e) => api.pqBadgeText(e, api.RBG_CFG).startsWith(m))),
  [[true, true, true], [true, true, true]]);

check('the Casing and Fascinating spends and the Casing gain are here, in their own words',
  [rt('The Tolling of the Thief-Bells', 'Steal from the Gravensteen itself'), rt('All Around the Count’s Rock', 'Case a lesser keep'),
    rt('All Around the Count’s Rock', 'Seduce an Alluring Masquer')],
  ['Casing −36 ▼ → Venom-Ruby ×10 · Moonlight · Damask · Diamond', 'Casing +6 · Clue ×50', 'Fasc −36 ▼ → Wine · Favour ×2 · Notion ×10']);

check('both accept options answer to their card, and the hat option to its long title too',
  [api.carouselLookup(api.RBG_INDEX, 'Accept a lucrative opportunity', key('The Tolling of the Thief-Bells')).label,
    api.carouselLookup(api.RBG_INDEX, 'Accept a lucrative opportunity (All Around the Count’s Rock)', key('All Around the Count’s Rock')).label],
  ['takes a sack · Suspicion −3 a return', 'takes the hat · Scandal −3 a return']);

// === Heralds from Elsewhere ============================================================

check('Heralds is six steps in order, every one raising the Visitor by 1, the last with two variants',
  api.RBG_OPTIONS.filter((e) => e.storylet === 'Heralds from Elsewhere').map((e) => [e.q[1], e.win, (e.needs || '').replace('A Visitor to Burgundy ', '')]),
  [['Visitor', 1, '0–1'], ['Visitor', 1, 'exactly 2'], ['Visitor', 1, 'exactly 3'], ['Visitor', 1, 'exactly 4'], ['Visitor', 1, 'exactly 5'],
    ['Visitor', 1, 'exactly 6 and Salt-Veined'], ['Visitor', 1, 'exactly 6, without Salt-Veined']]);

check('a step reads the visitor, the profit and what it moves: Sight a Circumspect Smuggler, Rest with a Weary Miser-Herd',
  [rt('Heralds from Elsewhere', 'Sight a Circumspect Smuggler'), rt('Heralds from Elsewhere', 'Rest with a Weary Miser-Herd')],
  ['Visitor +1 · Fuel for Glory’s Fire +1 · Bone ×450', 'Visitor +1 · Nightmares −4 · Glim ×200']);

// === the weekly cards =================================================================

check('the market costs 250 Stuiver a purchase and the deluge is free; either locks the card for its period',
  [api.RBG_OPTIONS.filter((e) => e.storylet === 'Colour and Sound: Market Day').every((e) => e.u[0][1] === 250 && /Once a week/.test(e.note)),
    api.RBG_OPTIONS.filter((e) => e.storylet === 'A Deluge of Charity').every((e) => /for a month/.test(e.note))], [true, true]);

// === the cards =======================================================================================

check('the cards in the hand carry their word: the payouts, the ladder, the autoplay pair',
  ['Gifts of Burgundy', 'Preparations for a Saint’s Day', 'Stopped by the Guards', 'Heralds from Elsewhere', 'A Deluge of Charity'].map((n) => {
    const card = makeHeading(n);
    hand = [card];
    api.rbgRatings();
    const out = (badgeOf(card, api.RBG_DEF.cardCls) || {}).textContent;
    hand = [];
    return out;
  }), ['BB −10 ▼ → 5 gifts', 'Saint → 15 or 25', 'autoplay · Suspicion +2', 'Visitor +1 · six steps', 'free · monthly']);

check('every card of ours has options in the table, and every storylet in the table is one of our cards (but the two whose badges belong to Fascinating and The Hunt Is On!)',
  [api.RBG_CARDS.filter((c) => !c.canon).filter((c) => !api.RBG_OPTIONS.some((e) => key(e.storylet) === key(c.name))).map((c) => c.name),
    api.RBG_OPTIONS.map((e) => e.storylet).filter((s, i, a) => a.indexOf(s) === i)
      .filter((s) => !api.RBG_CARDS.some((c) => key(c.name) === key(s))).length],
  [['Whoso List to Hunt'], 2]);

check('the card set is the first twenty-five, thirty-six more and the one alias, Whoso List to Hunt with a word and no options',
  [api.RBG_CARDS.length, api.RBG_CARDS.filter((c) => c.canon).length, api.RBG_OPTIONS.filter((e) => e.storylet === 'Whoso List to Hunt').length], [62, 1, 0]);

check('a card of another feature is left alone',
  (() => {
    const card = makeHeading('A drunk');
    hand = [card];
    api.rbgRatings();
    const out = badgeOf(card, api.RBG_DEF.cardCls);
    hand = [];
    return out;
  })(), null);

// === the tables ===========================================================================================

check('every entry is filed under a storylet, named, and has a non-empty badge, and no card holds a title twice',
  [api.RBG_OPTIONS.filter((e) => !e.storylet || !e.name || !api.pqBadgeText(e, api.RBG_CFG)).map((e) => e.name),
    api.RBG_OPTIONS.filter((e, i, a) =>
      a.findIndex((o) => key(o.storylet) === key(e.storylet) && key(o.name) === key(e.name)) !== i).map((e) => e.name)], [[], []]);

check('the two features that also touch Burgundy keep their own options: none of ours is in THIO, Casing or Fascinating',
  (() => {
    const mine = api.RBG_OPTIONS.map((e) => key(e.name));
    const others = [...api.THIO_OPTIONS, ...api.CASING_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS].map((e) => key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('no option title is also a title in another feature\'s table (apart from the twins of our own)',
  (() => {
    const own = api.RBG_OPTIONS.map((e) => key(e.name));
    const twins = own.filter((n, i) => own.indexOf(n) !== i);
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.HW_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS,
      ...api.DME_OPTIONS, ...api.LBI_OPTIONS, ...api.VH_OPTIONS, ...api.ARBOR_OPTIONS].map((e) => key(e.name));
    return own.filter((n) => others.includes(n) && !twins.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'risen-burgundy'), true);

// --- the rest of the deck ---------------------------------------------------------------------------------
const rbgOpt = (card, name) => api.RBG_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));

check('the counter trades: one counter raised for two of the other, the way the guide says',
  [rbgOpt('A Disturbance at the Market', 'Give the Propagandist a chance to escape').label,
    rbgOpt('A Disturbance at the Market', 'Help apprehend the criminal').label,
    rbgOpt('A Stranger Out of Time', 'Recontextualise your behaviour').label],
  ['Suspicion +3 · ATK +1 · −BB ×2', 'Scandal +3 · BB +1 · −ATK ×2', 'Scandal −5 · Scrap of Incendiary Gossip ×1 · −Volume of Collated Research ×1']);

check('a challenge is marked and a failure named; a Luck option is marked',
  [rbgOpt('Elusive Industries', 'Nose around').label, rbgOpt('Sought by Pike and Guardsman', 'Act natural').label,
    rbgOpt('The Honours of the Court', 'Rescue an Unwary Reichsgraf').label],
  ['Extraordinary Implication ×1 +2 more? · fail Wounds +2', 'Suspicion −2≈ · fail Suspicion +1, Wounds +1', 'BB +1? · fail Wounds +4, Live Specimen ×1']);

check('the seven dreams are autoplay cards with one effect each, and a card in the hand says which counters it can raise',
  (() => {
    const t = (h) => { const b = badgeOf(h, api.RBG_DEF.cardCls); return b && b.textContent; };
    const dream = makeHeading('A Dream of Oceans');
    const trade = makeHeading('A Disturbance at the Market');
    const plain = makeHeading('The Banners of the Guilds');
    const feast = makeHeading('To be Feasted');
    hand = [dream, trade, plain, feast];
    api.rbgRatings();
    const out = [t(dream), t(trade), t(plain), t(feast)];
    hand = [];
    return out;
  })(), ['Nightmares +3 · Having Recurring Dreams: Pale for Weariness (set)', 'BB/ATK +1', '4 options', '3 options']);

check('cards another feature owns keep its badge: The Honours of the Court is Fascinating’s, Cutthroats and Canalmen The Hunt Is On!’s',
  [api.RBG_CARDS.some((c) => key(c.name) === key('The Honours of the Court')), api.RBG_CARDS.some((c) => key(c.name) === key('Cutthroats and Canalmen')),
    api.RBG_DEF.noHeading.join('|'), api.RBG_OPTIONS.some((e) => key(e.name) === key('Bring an acquaintance along'))],
  [false, false, 'cutthroats and canalmen|the honours of the court', false]);

check('the Firmament card is found under its game title, and its variants are one option with the states named',
  [api.RBG_DEF.aliases('to be feasted'), /pages under this title/.test(rbgOpt('Firmament: To be Feasted', 'Attend the Gravensteen gracefully').title)],
  ['firmament to be feasted', true]);


console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
