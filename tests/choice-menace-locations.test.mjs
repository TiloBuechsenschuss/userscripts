// Ad-hoc test for FallenLondon/choice-helper.js's Menace Locations feature ('menace-locations') on the
// shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The badge form: the menace change first and signed (lower is better), then what else the option
//    moves and what a failure does, with `?` for a challenge and `≈` for a Luck option worked out
//    from its two outcomes -- pinned against the guide's own averages (-4.9, -0.5, -1, -1.5).
//  - The guide's figures place by place: the Wounds red cards at -2 and -1, the letters to an old
//    flame, bribery, the lawyer, the manager, the Mirror-Marches' cards and frames.
//  - Colour follows direction (teal cuts the menace, brick raises it) but the sign carries it too.
//  - The card in the hand is CONFIRM-ONLY: badged only while the greeting names its place. The
//    options inside an open card need no greeting.
//  - Cards the game titles without the wiki's numeral or bracket, and two pages under one title.
//  - That no option is filed under the same storylet in another feature's table.
//
// Options come from the card and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-26, with Menace Locations (Guide) as the cross-check.
//
//   node tests/choice-menace-locations.test.mjs

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

let area = null;
const setArea = (a) => { area = a; };
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
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && area ? { textContent: 'Welcome to ' + area + ', delicious friend!' } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, ML_LOCATIONS, ML_OPTIONS, ML_CARDS, ML_INDEX, ML_DEF, mlRatings,'
    + ' SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, HW_OPTIONS, RBG_OPTIONS, SD_OPTIONS, TLC_OPTIONS, ST_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const opt = (card, name) => api.ML_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const label = (card, name) => opt(card, name).label;
// The menace figure an option leads with, as the badge gives it.
const lead = (card, name) => {
  const l = label(card, name);
  return l.split(' · ')[0];
};

check('every entry names its place, storylet and option, has a badge and a tooltip, and none repeats',
  [api.ML_OPTIONS.every((e) => e.loc && e.storylet && e.name && e.label && e.title && e.color),
    new Set(api.ML_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.ML_OPTIONS.length],
  [true, true]);

check('the five places, and the count of entries and of red cards',
  [Object.keys(api.ML_LOCATIONS).length, api.ML_OPTIONS.length, api.ML_CARDS.filter((c) => c.red).length],
  [5, 242, 49]);

check('every card in the list holds an option or is a red card with its one effect',
  (() => {
    const held = new Set(api.ML_OPTIONS.map((e) => key(e.storylet)));
    return api.ML_CARDS.filter((c) => !held.has(key(c.name))).map((c) => c.name);
  })(), []);

check('Wounds: the guide’s red cards, −2, −1 and the one to avoid',
  [['Recall glad times at the Singing Mandrake', 'Recall scenes from Ladybones Road', 'Recall the noise and life of Spite',
    'Recall the rough camaraderie of Watchmaker\'s Hill', 'Stare at the shore of the living world', 'Trail your fingers in the water']
    .map((n) => lead(n, n)),
    ['Recall the glitter of the Shuttered Palace', 'Remember the Flit', 'Remember the Forgotten Quarter', 'Remember the Regretful Soldier',
      'Remember the Repentant Forger', 'You remember the tomb-colonists, and shudder'].map((n) => lead(n, n)),
    lead('Remember a certain hunger...', 'Remember a certain hunger...')],
  [['Wounds −2', 'Wounds −2', 'Wounds −2', 'Wounds −2', 'Wounds −2', 'Wounds −2'],
    ['Wounds −1', 'Wounds −1', 'Wounds −1', 'Wounds −1', 'Wounds −1', 'Wounds −1'], 'Wounds +3']);

check('Wounds: dice and chess, the Luck option worked out to the guide’s −0.5 and the Boatman’s levels of chess',
  [label('Dice with the Boatman', 'Rattling the dice in your cupped hands...'),
    lead('Play Chess with the Boatman', 'He’s done this before...'), lead('Play Chess with the Boatman', 'A grin of sorts'),
    /Better than dice while your chance of success is above 63%/.test(opt('Play Chess with the Boatman', 'A smile of recognition').title),
    /never menace-negative/.test(opt('Play Chess with the Boatman', 'Your move...').title)],
  ['Wounds ≈−0.5 · Approaching +1', 'Wounds −3?', 'Wounds −2?', true, true]);

check('Scandal: the letters to an old flame and the price of forgiveness, with the guide’s expected −4.9',
  [lead('A letter to an old flame', '...I have written to the Bishop of St Fiacre’s...'),
    lead('A letter to an old flame', '...I have a few friends yet in Society...'),
    lead('The price of forgiveness', 'Send a gift to the Church'),
    lead('Lamentable tastes', 'I persevered for hours. Hours!')],
  ['Scandal −6', 'Scandal ≈−4.9', 'Scandal −3', 'Scandal −6']);

check('Suspicion: bribery at −3, −3 and −7, and the lawyer’s averages of −0.5 and −1',
  [lead('Bribery', 'Arrange for some booze'), lead('Bribery', 'Candles for the gaolers'), lead('Bribery', 'A better breed of shiv'),
    lead('Contact your lawyer', 'Pen a letter'), lead('Contact your lawyer', 'Write instead to the Ambitious Barrister')],
  ['Suspicion −3', 'Suspicion −3', 'Suspicion −7', 'Suspicion ≈−0.5', 'Suspicion ≈−1']);

check('Nightmares: the manager, the guests you want to fail, and the Mirror-Marches’ forest and frames',
  [lead('A word with the manager', 'Complain to the manager'), lead('A word with the manager', 'Ask the manager to make it rain'),
    label('Chat to the guests', 'Reminisce about Fallen London'),
    lead('The seductive forest', 'Follow the sound of water'),
    ['wooden', 'brass', 'silver', 'iron'].map((f) => lead('The mirror-frames', 'Look at the ' + f + ' frame'))],
  ['Nightmares −10', 'Nightmares ≈−7.5', 'Nightmares −1? · Watchful −4 · fail Nightmares −3', 'Nightmares ≈−1.5',
    ['Nightmares −2', 'Nightmares −2', 'Nightmares −2', 'Nightmares −2']]);

check('the Mirror-Marches’ red cards, from −5 for silver to −1 for brass',
  [lead('A glimpse of silver', 'A glimpse of silver'), lead('A glimpse of a tavern', 'A glimpse of a tavern'),
    lead('A black cat', 'A black cat'), lead('A glimpse of brass', 'A glimpse of brass')],
  ['Nightmares −5', 'Nightmares −4', 'Nightmares −3', 'Nightmares −1']);

check('the guide’s notes are in the tooltips',
  [/Fail it on purpose/.test(opt('A lost secret', 'Search for your missing secret').title),
    /Not recommended/.test(opt('...or you could just give up', 'Lie back and close your eyes').title),
    /at least as many Criminals Favours/.test(opt('The talkative gaoler', 'A grass').title)],
  [true, true, true]);

check('an option that cuts the menace is teal, one that raises it is brick, one that does neither is grey',
  [opt('Remember the Flit', 'Remember the Flit').color, opt('Remember a certain hunger...', 'Remember a certain hunger...').color,
    opt('The talkative gaoler', 'A grass').color],
  ['#1b7d67', '#9a4a2f', '#5b5b5b']);

check('two pages under one title are one entry and say so, and a numbered wiki card is found by the game’s title',
  [opt('A white cat!', 'A white cat!').label, /Two pages carry this title/.test(opt('A white cat!', 'A white cat!').title),
    api.ML_DEF.aliases(key('The view from your room')), api.ML_DEF.aliases(key('A repairer of reputations')), api.ML_DEF.aliases(key('Something else'))],
  ['Manager +1 or Nightmares −3', true, 'the view from your room', 'a repairer of reputations hallowmas', null]);

check('a card in the hand is badged only while the greeting names its place',
  (() => {
    const t = (h) => { const b = badgeOf(h, api.ML_DEF.cardCls); return b && b.textContent; };
    const out = [];
    const cases = [null, 'a slow boat passing a dark beach on a silent river', 'Spite', 'Disgraced exile in the Tomb-Colonies'];
    cases.forEach((area) => {
      setArea(area);
      const wounds = makeHeading('You loved someone once');
      const scandal = makeHeading('With friends like these...');
      hand = [wounds, scandal];
      api.mlRatings();
      out.push([t(wounds), t(scandal)]);
      hand = [];
    });
    setArea(null);
    return out;
  })(), [[null, null], ['Wounds −3', null], [null, null], [null, 'Scandal −1 · Persuasive −5']]);

check('a card the game titles without the wiki’s suffix is badged, and a white card says its deepest cut',
  (() => {
    const t = (h) => { const b = badgeOf(h, api.ML_DEF.cardCls); return b && b.textContent; };
    setArea('a slow boat passing a dark beach on a silent river');
    const red = makeHeading('You’ve unfinished business in the world of the living');
    const white = makeHeading('Remember where you fell');
    hand = [red, white];
    api.mlRatings();
    const out = [t(red), t(white)];
    hand = [];
    setArea(null);
    return out;
  })(), ['Wounds −2', 'best Wounds −2']);

check('the options inside an open card are badged without any greeting, and a stray title gets nothing',
  (() => {
    const t = (h) => { const b = badgeOf(h, api.ML_DEF.branchCls); return b && b.textContent; };
    const head = makeHeading('Remnants');
    const good = makeHeading('Ignore it');
    const stray = makeHeading('Something else');
    roots = [head];
    branches = [good, stray];
    api.mlRatings();
    const out = [t(good), t(stray)];
    roots = [];
    branches = [];
    return out;
  })(), ['Scandal −2 · Hedonist +3 · Austere −3', null]);

check('a storylet of a place is headed with its deepest cut',
  (() => {
    const head = makeHeading('Bribery');
    roots = [head];
    api.mlRatings();
    const b = badgeOf(head, api.ML_DEF.cls);
    roots = [];
    return b && b.textContent;
  })(), 'best Suspicion −7');

check('no option is filed under the same storylet in another feature’s table',
  (() => {
    const mine = api.ML_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS, ...api.TLC_OPTIONS, ...api.ST_OPTIONS]
      .map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'menace-locations'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
