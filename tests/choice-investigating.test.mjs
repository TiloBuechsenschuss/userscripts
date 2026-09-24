// Ad-hoc test for FallenLondon/choice-helper.js's Investigating... feature ('investigating') on the
// shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The vocabulary: a gain, a gain whose failure ADDS ("fail +1"), a narrow spend that takes all of
//    it and moves other qualities, a range ("Inv +36-46"), and a fixed-price spend ("Inv -15 v -> ...").
//  - The Curate's ladder: six gain storylets that each show only at a band of the quality (below 7,
//    3-8, 7-20, 8-14, 10-20, 14), said in the tooltip, and an ending that is three narrow spends.
//  - The University's "(department)" placeholder, and its six options rising by two in difficulty.
//  - The shared storylets: Madame Shoshana's tent (Fascinating heads it), Read incoming mail
//    (Inspired) and Attend to the Dreamer (Oneiropomp) keep one heading badge, and this feature
//    badges only its own option inside each.
//  - Every guide-versus-page disagreement, by name.
//  - The cards, and that no title is in another feature's table.
//
// Numbers come from the option, card and storylet pages on fallenlondon.wiki, fetched through the API
// on 2026-09-24, with Investigating (Guide) as the cross-check.
//
//   node tests/choice-investigating.test.mjs

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
    + ' INV_CFG, INV_OPTIONS, INV_INDEX, INV_DEF, INV_CARDS, invRatings, FAS_OPTIONS, INSP_OPTIONS, fasRatings, inspRatings, FAS_DEF, INSP_DEF,'
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
const inv = (storylet, name) => api.INV_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const it = (storylet, name) => api.pqBadgeText(inv(storylet, name), api.INV_CFG);
const END = 'Complete your acquaintance with the Melancholy Curate. Or his Enigmatic Sister.';
const UNI = 'Making Your Name: Investigations in the university';
const SHOSHANA = 'Visit Madame Shoshana, the Neath’s Foremost Clairvoyante';

// === the vocabulary, by hand ==============================================

check('a gain, a gain with a failure that takes some back, a gain with a failure that ADDS',
  [it('Gossip with the Melancholy Curate’s servants', 'Charm information out of them'),
    it('Attend a service at the Melancholy Curate’s church', 'Watch and listen'),
    it('Read poetry with the Melancholy Curate and his Sister', 'Propose the reading of something improving')],
  ['Inv +3?', 'Inv +3? −1', 'Inv +2? · fail +1']);

check('a gain and a bigger failure: Up the back stairs, the stimulating reading',
  [it('Delve into the secrets of the Curate and his sister...', 'Up the back stairs...'),
    it('Read poetry with the Melancholy Curate and his Sister', 'Propose the reading of something stimulating')],
  ['Inv +3? −3', 'Inv +3? −2']);

check('the Curate\'s ending is three narrow spends of 18, paying items and Persuasive 200',
  api.INV_OPTIONS.filter((e) => e.storylet === END).map((e) => api.pqBadgeText(e, api.INV_CFG)),
  ['Inv 18 ▼ → Silk ×39 · Appalling Secret ×4? −3 · Persuasive +200 · Hedonist +3',
    'Inv 18 ▼ → Silk ×42 · Brass ×58? −3 · Persuasive +200 · Hedonist +3',
    'Inv 18 ▼ → Silk ×80 · Implication ×3? −20 · Persuasive +200 · Hedonist +5']);

check('a range is a range: Ply them with lager; a card that also raises Seeking says so',
  [it('Canal Workers on the Upper River', 'Ply them with lager and see what they’ll share'),
    it('A new piece in the Game', 'Have her help out with your current job')],
  ['Inv +36–46', 'Inv +4? · Seeking... +4']);

check('the fixed-price spends name their cost: the tour, the Phoenix, the Tracklayers\' crime',
  [it('Tour the Neighbourhood', 'Track rumours you’ve been hearing'),
    it('The Scheme of a Phoenix', 'Find out more about who was writing to Mr Fires via the Balmoral dumbwaiter'),
    it('Officially Non-Criminal', '(Solve Tracklayers’ City crime)')],
  ['Inv −15 ▼ → opens Helicon House', 'Inv −15 ▼ → Phoenix +1', 'Inv −15 ▼ → Prosperity ×(220 + Efficiency)']);

check('the Phoenix option whose cost depends on a Twilit Smuggler says both, and answers to both titles',
  [it('The Scheme of a Phoenix', 'Find out whether Mr Fires has continued his correspondence via the Balmoral dumbwaiter'),
    api.carouselLookup(api.INV_INDEX, 'Find out whether Mr Fires has continued his correspondence via the Balmoral dumbwaiter (no Twilit Smuggler)',
      key('The Scheme of a Phoenix')) !== null],
  ['Inv −15 (−55 without a Smuggler) ▼ → Phoenix +1', true]);

check('the Stones: a gain, a plain spend and a narrow one that takes 10 back',
  [it('Investigating the Stones 2', 'The Correspondence'), it('Investigating the Stones: Conclusion', 'Find out what he knows'),
    it('Investigating the Stones: Conclusion', 'A bold and original plan')],
  ['Inv +2?', 'Inv 5 ▼ → Clue ×50 · Appalling Secret ×2 · Nightmares +1', 'Inv 5 ▼ → Clue ×60 · Appalling Secret ×2? −10']);

check('an option whose amount is a formula is a label: the notes, the Dreamer',
  [it('Read incoming mail', 'Read a bundle of investigation notes'), it('Attend to the Dreamer', 'Learn from the Detective’s investigation')],
  ['Inv +⅕ of base Watchful', 'Inv +20 × Intensity?']);

// === the Curate's ladder ==========================================================

check('the Curate\'s six gain storylets each say the band of Investigating that shows them',
  ['Gossip with the Melancholy Curate’s servants', 'Attend a service at the Melancholy Curate’s church',
    'Does the Melancholy Curate have a connection with St Dunstan’s?', 'Present your compliments to the Curate and his sister...',
    'Delve into the secrets of the Curate and his sister...', 'Read poetry with the Melancholy Curate and his Sister']
    .map((s) => (api.INV_OPTIONS.find((e) => e.storylet === s).note.match(/Investigating\.\.\. (below )?[\d ]+(to \d+)?/) || [null])[0]),
  ['Investigating... below 7', 'Investigating... 3 to 8', 'Investigating... 7 to 20', 'Investigating... 8 to 14',
    'Investigating... 10 to 20', 'Investigating... 14']);

check('the six gain storylets between them hold eight options, and the ending three',
  [api.INV_OPTIONS.filter((e) => e.win !== undefined && /Curate|Delve|Read poetry|Gossip|Attend a service/.test(e.storylet)).length,
    api.INV_OPTIONS.filter((e) => e.storylet === END).length], [8, 3]);

// === the University ================================================================

check('the University\'s six options rise by two in difficulty, from 98 to 108, and gain 3 or 4',
  api.INV_OPTIONS.filter((e) => e.storylet === UNI).map((e) => [e.ch.diff, e.win]),
  [[98, 3], [100, 3], [102, 3], [104, 4], [106, 4], [108, 4]]);

check('"Interview the Department of (department) staff" answers to any department and to none other',
  [api.carouselLookup(api.INV_INDEX, 'Interview the Department of Philosophy staff', key(UNI)) !== null,
    api.carouselLookup(api.INV_INDEX, 'Interview the Department staff', key(UNI))], [true, null]);

check('Talk to the Porters spends 25 Cryptic Clues on a failure as well and pays 108 Whispered Hints',
  [inv(UNI, 'Talk to the Porters').u, inv(UNI, 'Talk to the Porters').g, /spent on a failure as well/.test(inv(UNI, 'Talk to the Porters').note)],
  [[['Cryptic Clue', 25]], [['Whispered Hint', 108]], true]);

// === the guide and the pages disagree =================================================

check('every disagreement is carried and the page figure is the badge\'s',
  [[inv('Delve into the secrets of the Curate and his sister...', 'Up the back stairs...'), /Shadowy 25/, 30],
    [inv(END, 'Knock on the Melancholy Curate’s door'), /difficulty 19/, 18],
    [inv(END, 'Knock on the Enigmatic Sister’s door'), /difficulty 19/, 18],
    [inv(END, 'Do you know...I think both of them are rather charming.'), /difficulty 26/, 25],
    [inv(UNI, 'Conduct forensic analyses'), /failure of 1/, 102],
    [inv('Officially Non-Criminal', '(Solve Tracklayers’ City crime)'), /250/, null],
    [inv(SHOSHANA, 'Ask for advice on your investigations'), /\+1 CP/, 2]]
    .map(([e, re, diff]) => [re.test(e.guide), diff === null ? e.cost : e.ch ? e.ch.diff : null]),
  [[true, 30], [true, 18], [true, 18], [true, 25], [true, 102], [true, 15], [true, 2]]);

check('the forensic failure takes 6 back, not the guide\'s 1',
  it(UNI, 'Conduct forensic analyses'), 'Inv +3? −6');

// === the shared storylets ============================================================================

check('Madame Shoshana\'s tent has one heading badge (Fascinating\'s) and an option from each of three qualities',
  (() => {
    const advice = makeHeading('Ask for advice on your investigations');
    const art = makeHeading('Ask for help with artistic endeavours');
    const romantic = makeHeading('Ask for a romantic prediction');
    branches = [advice, art, romantic];
    roots = [makeHeading(SHOSHANA)];
    api.fasRatings();
    api.inspRatings();
    api.invRatings();
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [t(roots[0], api.INV_DEF.cls), t(advice, api.INV_DEF.branchCls), t(advice, api.FAS_DEF.branchCls),
      t(art, api.INV_DEF.branchCls), t(romantic, api.INV_DEF.branchCls)];
    roots = [];
    branches = [];
    return out;
  })(), [null, 'Inv +2?', null, null, null]);

check('Read incoming mail and Attend to the Dreamer get no heading badge from this feature, and their option is badged',
  ['Read incoming mail', 'Attend to the Dreamer'].map((s) => {
    const opt = makeHeading(s === 'Read incoming mail' ? 'Read a bundle of investigation notes' : 'Learn from the Detective’s investigation');
    branches = [opt];
    roots = [makeHeading(s)];
    api.invRatings();
    const out = [badgeOf(roots[0], api.INV_DEF.cls), (badgeOf(opt, api.INV_DEF.branchCls) || {}).textContent];
    roots = [];
    branches = [];
    return out;
  }), [[null, 'Inv +⅕ of base Watchful'], [null, 'Inv +20 × Intensity?']]);

// === the cards ================================================================================

check('a card in the hand carries its lead option, the opened card one badge on the heading and one on its option',
  (() => {
    const card = makeHeading('Tea with the Inspector');
    const opt = makeHeading('Ask for help with your case');
    hand = [card];
    branches = [opt];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    api.invRatings();
    out.push(t(card, api.INV_DEF.cardCls));
    hand = [];
    roots = [makeHeading('Tea with the Inspector')];
    api.invRatings();
    out.push([t(roots[0], api.INV_DEF.cardCls), t(roots[0], api.INV_DEF.cls), t(opt, api.INV_DEF.branchCls)]);
    roots = [];
    branches = [];
    return out;
  })(), ['Inv +15? −5', ['Inv +15? −5', null, 'Inv +15? −5']]);

check('the ten cards each lead with the option that moves Investigating, and a card that names no option of ours is left alone',
  api.INV_CARDS.map((c) => api.pqCardSpec(c, api.INV_DEF).text),
  ['Inv +15? −5', 'Inv +4? · Seeking... +4', 'Inv +5', 'Inv +36–46', 'Inv +2?', 'Inv +2?', 'Inv +25?', 'Inv +2?',
    'Banditry ↓ · uses Inv', 'Inv −15 ▼ → Prosperity ×(220 + Efficiency)']);

check('a card of another feature is left alone',
  (() => {
    const card = makeHeading('A drunk');
    hand = [card];
    api.invRatings();
    const out = badgeOf(card, api.INV_DEF.cardCls);
    hand = [];
    return out;
  })(), null);

check('the Upper River cards say what they replace or need in the tooltip',
  [/replaced by Which meeting\?/.test(inv('Cells outside the City', 'Ask the locals about the risk of bombs').note),
    /Engage in Some Minor Smuggling/.test(inv('Listen to Rumours of Smuggling', 'Ask the locals over a pint').note),
    /Shadowy 300 with Supporting the Emancipationist Tracklayers at 0/.test(
      api.pqSpec(inv('Cells outside the City', 'Ask the locals about the risk of bombs'), api.INV_CFG).title)],
  [true, true, true]);

// === the tables =====================================================================================

check('every entry is filed under a storylet, named, and has a non-empty badge, and no storylet holds a title twice',
  [api.INV_OPTIONS.filter((e) => !e.storylet || !e.name || !api.pqBadgeText(e, api.INV_CFG)).map((e) => e.name),
    api.INV_OPTIONS.filter((e, i, a) =>
      a.findIndex((o) => key(o.storylet) === key(e.storylet) && key(o.name) === key(e.name)) !== i).map((e) => e.name)], [[], []]);

check('every narrow spend is on the quality itself',
  api.INV_OPTIONS.filter((e) => e.ch && e.ch.narrow && e.ch.stat !== 'Investigating...').map((e) => e.name), []);

check('this feature shares no option title with the Fascinating, Inspired, Casing, Hunt or Running Battle tables',
  (() => {
    const mine = api.INV_OPTIONS.map((e) => key(e.name));
    const others = [...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS, ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS]
      .map((e) => key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('no option title is also a title in another feature\'s table',
  (() => {
    const mine = api.INV_OPTIONS.map((e) => key(e.name));
    const others = [
      ...api.ZEE_CARDS.map((c) => key(c.name)), ...api.SPITE_CARDS.map((c) => key(c.name)),
      ...api.FOTZ_CARDS.map((c) => key(c.name)), ...api.LAB_CARDS.map((c) => key(c.name)),
      ...api.ARBOR_OPTIONS.map((e) => key(e.name)),
      ...api.PC_OPTIONS.flatMap((p) => [key(p.name), p.branch ? key(p.branch) : '']),
      ...api.VSD_OPTIONS.flatMap((v) => [key(v.storylet), key(v.branch)]),
      ...api.LBI_OPTIONS.map((e) => key(e.name)), ...api.VH_OPTIONS.map((e) => key(e.name)),
      ...api.DME_OPTIONS.map((e) => key(e.name)), ...api.AOL_OPTIONS.map((e) => key(e.name)),
      ...api.CHW_OPTIONS.map((e) => key(e.name)),
    ];
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered',
  api.FEATURES.some((f) => f.name === 'investigating'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
