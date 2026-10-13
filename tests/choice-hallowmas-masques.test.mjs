// Test for FallenLondon/choice-helper.js's Hallowmas Masques feature and panel.
//
//   node tests/choice-hallowmas-masques.test.mjs
//
// What is worth pinning:
//
//  - The table's shape: 35 option pages across four Masques, one Leave each, and
//    every row's Menace and mask agreeing with the Masque it sits under.
//  - The badge: Menace CP, a ▼ exactly when an item is spent, the mask as a WORD
//    so the badge reads with the colour stripped.
//  - The cross-checks the table carries on purpose: the Spirit rewards' stated
//    Echoes against their stated Echoes-per-Spirit, and the two upgrade tables
//    the guide prints (the list and the tick-grid) against each other.
//  - That a row is looked up under the OPEN storylet only: the same exchange
//    title exists in two Masques, and Promenade! / Make merry! must not leak.
//  - That no Masque name is in another Choice Helper table, and the whole panel
//    builds.

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
    // Unlike the other suites, this one DOES exercise `after()`: Port Carnelian
    // is the first feature to share a selector with another (`.branch__title`,
    // with the Fruits of the Zee supplication badges), so where a badge lands
    // in the run of siblings after a heading is now load-bearing.
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      const at = p.children.indexOf(this) + 1;
      node.parentNode = p;
      p.children.splice(at, 0, node);
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
    },
    addEventListener() {},
    // `characterName()` and the background-refresh frame both go through
    // getAttribute, and a stub without it throws out of the banking path.
    attributes: {},
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name] : null;
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  // Derived rather than stored, so `after()` above cannot leave it stale.
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

// The screen-reader greeting FL puts on every page. `area` drives what
// currentArea() reads, so the strict gate can be exercised from here. `null`
// stands for a greeting that can't be read at all.
let area = 'Port Carnelian';
// The headings a scan finds, keyed by the selector that asks for them, so the
// whole `port-carnelian` pass can be run over the markup Fallen London really
// renders rather than only its pure parts.
let stage = { storylet: [], branch: [] };
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => (sel.includes('storylet-root__heading') ? stage.storylet
    : sel.includes('branch__title') ? stage.branch : []),
  querySelector: (sel) => {
    if (sel.includes('.welcome') && area != null) {
      const h1 = makeEl('h1');
      h1.textContent = "It's TheFairUnknown! Welcome to " + area + ', delicious friend!';
      return h1;
    }
    return null;
  },
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

// The cash-out calculator reads your purse off the Myself tab and banks it, so
// this suite needs somewhere to bank it to. A plain Map is enough.
const store = new Map();
const fakeStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

// Timers are stubbed to no-ops so the background refresh can be exercised
// without a hidden frame's 20-second poll keeping the process alive. The
// refresh promise then simply never settles, which is exactly what a test that
// only counts whether the frame was BOOKED wants.
const noTimer = () => 0;
const frameCount = () => fakeDoc.body.children.filter((el) => el.tagName === 'IFRAME').length;

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { HM_MASQUES, HM_MASQUE_OPTIONS, HM_SPIRIT_REWARDS, HM_UPGRADES_2025, HM_UPGRADE_GRID,'
    + ' HM_CONFESSION_COLUMNS, HM_AFFILIATIONS, HM_CONFESSION_REWARDS, HM_MARK_SPENDS,'
    + ' hmMasqueSpec, hmMasqueStoryletSpec, renderHallowmasPanel, hallowmasMasquesRatings,'
    + ' ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, PC_OPTIONS, HALLOWMAS_OPTIONS, normalizeName,'
    + ' PANELS, FEATURES, BADGE_CLASS, CAROUSEL_COLOR_PROGRESS, CAROUSEL_COLOR_NEUTRAL }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'localStorage', 'setInterval', 'setTimeout', 'clearInterval', 'clearTimeout',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console,
  fakeStorage, noTimer, noTimer, () => {}, () => {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const ROOF = 'The Roof Below';
const WRECK = 'The Wreck of the St Elmo';
const PAVILION = 'The Pavilion of Butterflies';
const SACRISTY = 'Saint Dunstan’s Sacristy';
const opts = api.HM_MASQUE_OPTIONS;
const spec = (storylet, name) => api.hmMasqueSpec(opts.find((e) => e.storylet === storylet && e.name === name));

// --- the table is well formed ----------------------------------------------

check('four Masques, in the guide order of mention',
  Object.keys(api.HM_MASQUES), [ROOF, WRECK, PAVILION, SACRISTY]);

check('35 option pages: 9 + 9 + 8 + 9',
  [opts.length, ...Object.keys(api.HM_MASQUES).map((s) => opts.filter((e) => e.storylet === s).length)],
  [35, 9, 9, 8, 9]);

check('every row belongs to a known Masque, and each Masque has exactly one Leave',
  [opts.filter((e) => !api.HM_MASQUES[e.storylet]).length,
   Object.keys(api.HM_MASQUES).map((s) => opts.filter((e) => e.storylet === s && e.leave).length)],
  [0, [1, 1, 1, 1]]);

check('every mask on a row is its own Masque mask',
  opts.filter((e) => e.mask && e.mask !== api.HM_MASQUES[e.storylet].mask).map((e) => e.name), []);

check('squashing punctuation collides no two rows in one Masque',
  new Set(opts.map((e) => api.normalizeName(e.storylet + ' ' + e.name))).size, opts.length);

check('every Airs window is a real 1-100 band, or absent',
  opts.filter((e) => e.airs && !(e.airs[0] >= 1 && e.airs[1] <= 100 && e.airs[0] <= e.airs[1])).map((e) => e.name), []);

check('a Confession exchange is always the middle Airs band and carries no CP',
  opts.filter((e) => e.swap).filter((e) => e.airs.join('-') !== '34-66' || e.cp !== 0).map((e) => e.name), []);

check('CP is one of the four values the pages pay',
  [...new Set(opts.filter((e) => !e.swap && !e.leave).map((e) => e.cp))].sort((a, b) => a - b), [1, 3, 5, 7]);

check('the exchanges the guide files under the wrong Masque are where the option pages put them',
  [WRECK, SACRISTY, ROOF, PAVILION].map((s) => opts.filter((e) => e.storylet === s && e.swap).map((e) => e.swap.join('>'))),
  [['Impropriety>Curiosity', 'Violence>Whimsy', 'Whimsy>Pride'],
   ['Impropriety>Violence', 'Guile>Violence', 'Pride>Impropriety'],
   ['Whimsy>Guile', 'Curiosity>Pride'],
   ['Whimsy>Guile', 'Curiosity>Pride']]);

check('the +7 lines per Masque',
  [ROOF, WRECK, PAVILION, SACRISTY].map((s) => opts.filter((e) => e.storylet === s && e.cp === 7).map((e) => e.name)),
  [['Bathe in the amber vats', 'Immerse yourself in the amber springs'],
   ['Descend to the hold', 'Dine with the Merry Captain'],
   ['Toast the Queen of Air and Darkness'],
   ['Partake in a Confession']]);

// --- the badge ---------------------------------------------------------------

check('a free mask line is Menace and CP and a mask word, no spends mark',
  spec(PAVILION, 'Hunt for butterflies').text, 'Nightmares +5 CP · Moth');

check('an item-spending line carries the spends mark, and a mask line that spends one carries both',
  [spec(ROOF, 'Enter a secret conclave').text, spec(PAVILION, 'Toast the Queen of Air and Darkness').text],
  ['Wounds +3 CP ▼', 'Nightmares +7 CP ▼ · Moth']);

check('the spends mark appears exactly when an item is spent, over every Menace row',
  opts.filter((e) => e.cp && (api.hmMasqueSpec(e).text.includes(api.HM_MARK_SPENDS) !== !!e.spends)).map((e) => e.name), []);

check('a mask word ends the text exactly when the row has a mask',
  opts.filter((e) => e.cp && !!e.mask !== api.hmMasqueSpec(e).text.endsWith('· ' + (e.mask || '?'))).map((e) => e.name), []);

check('the text alone separates the maskless +1 from the Moth line, with no colour',
  [spec(PAVILION, 'Promenade!').text, spec(PAVILION, 'Hunt for butterflies').text],
  ['Nightmares +1 CP', 'Nightmares +5 CP · Moth']);

check('an exchange reads as the trade, in the neutral colour',
  [spec(WRECK, 'Exchange a Confession of Violence for a Confession of Whimsy').text,
   spec(WRECK, 'Exchange a Confession of Violence for a Confession of Whimsy').color],
  ['Violence → Whimsy', api.CAROUSEL_COLOR_NEUTRAL]);

check('a Leave says what re-entry costs and which mask waives it',
  spec(SACRISTY, 'Leave the Sacristy').text, 'leave · Favour to re-enter unless Demon');

check('every Menace line is the progress colour',
  opts.filter((e) => e.cp && api.hmMasqueSpec(e).color !== api.CAROUSEL_COLOR_PROGRESS).map((e) => e.name), []);

check('every tooltip names its option and Masque; Menace tooltips state the lock and the 28',
  opts.filter((e) => {
    const t = api.hmMasqueSpec(e).title;
    return !t.startsWith(e.name + '\n' + e.storylet) || (e.cp && !(t.includes('Locked once') && t.includes('28 CP')));
  }).map((e) => e.name), []);

check('the item chain is spelled out: Promenade! feeds the Toast, Walk the chambers feeds the vats',
  [spec(PAVILION, 'Promenade!').title.includes('feeds Toast the Queen'),
   spec(ROOF, 'Walk the chambers').title.includes('feeds Bathe in the amber vats')],
  [true, true]);

check('the storylet badge names the Menace, the mask card and the Favours',
  (() => {
    const s = api.hmMasqueStoryletSpec(api.normalizeName(PAVILION));
    return [s.text, s.title.includes('The Flight of Moths'), s.title.includes('Revolutionaries')];
  })(),
  ['Hallowmas · Nightmares', true, true]);

check('an unrelated storylet gets no storylet badge',
  api.hmMasqueStoryletSpec(api.normalizeName('The Streets of London')), null);

// --- no name is in another table ---------------------------------------------

check('no Masque option name is in any other Choice Helper table, so nothing is badged twice',
  (() => {
    const mine = opts.map((e) => api.normalizeName(e.name));
    const others = [].concat(api.ZEE_CARDS, api.SPITE_CARDS, api.FOTZ_CARDS, api.PC_OPTIONS, api.HALLOWMAS_OPTIONS)
      .map((c) => api.normalizeName(c.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

// --- the Spirit rewards, cross-checked ---------------------------------------

check('nine rewards, cost rising strictly',
  [api.HM_SPIRIT_REWARDS.length,
   api.HM_SPIRIT_REWARDS.filter((r, i) => i && r.cost <= api.HM_SPIRIT_REWARDS[i - 1].cost).length],
  [9, 0]);

check('each stated Echoes figure agrees with its stated Echoes per Spirit, to the guide rounding',
  api.HM_SPIRIT_REWARDS.filter((r) => Math.abs(r.echo / r.cost - r.per) > 0.001).map((r) => [r.cost, r.echo, r.per]), []);

check('only the 250 and 1000 rewards give a Ratket figure, and it is the better one',
  api.HM_SPIRIT_REWARDS.filter((r) => r.ratket).map((r) => [r.cost, r.ratket > r.echo]),
  [[250, true], [1000, true]]);

// --- the 2025 upgrades, cross-checked ----------------------------------------

check('twelve upgrades, each with a row in the tick-grid, none without',
  [api.HM_UPGRADES_2025.length, api.HM_UPGRADES_2025.filter((u) => !api.HM_UPGRADE_GRID[u.to]).length,
   Object.keys(api.HM_UPGRADE_GRID).length],
  [12, 0, 12]);

check('the guide list table and its tick-grid agree on every upgrade',
  api.HM_UPGRADES_2025.filter((u) => {
    const grid = api.HM_CONFESSION_COLUMNS.map((c) => (u.confessions.includes(c) ? 'x' : '.')).join('');
    return grid !== api.HM_UPGRADE_GRID[u.to];
  }).map((u) => u.to), []);

check('an upgrade takes two or three distinct Confessions of the six',
  api.HM_UPGRADES_2025.filter((u) => u.confessions.length < 2 || u.confessions.length > 3
    || new Set(u.confessions).size !== u.confessions.length
    || u.confessions.some((c) => !api.HM_CONFESSION_COLUMNS.includes(c))).map((u) => u.to), []);

check('the leftover-Confession turn-ins cover all six Confessions once',
  api.HM_CONFESSION_REWARDS.map((r) => r[0]).sort(), [...api.HM_CONFESSION_COLUMNS].sort());

check('four affiliations, one per Menace, Scandal marked as not offered in 2025',
  [api.HM_AFFILIATIONS.map((a) => a.menace), api.HM_AFFILIATIONS.find((a) => a.menace === 'Scandal').note],
  [['Nightmares', 'Wounds', 'Suspicion', 'Scandal'], 'not offered in 2025']);

// --- registration ---------------------------------------------------------------

check('the feature is registered once, and filed under Seasonal',
  api.FEATURES.filter((f) => f.name === 'hallowmas-masques').map((f) => [f.group, f.label]),
  [['Seasonal', 'Hallowmas Masques']]);

check('the panel is registered, follows the feature, and renders with renderHallowmasPanel',
  api.PANELS.filter((p) => p.id === 'hallowmas')
    .map((p) => [p.render === api.renderHallowmasPanel, p.follows && p.follows.id]),
  [[true, 'hallowmas-masques']]);

// --- the whole pass over real-shaped markup ------------------------------------

const run = api.FEATURES.find((f) => f.name === 'hallowmas-masques').run;

function branchHeading(name) {
  const parent = makeEl('div');
  const head = makeEl('h2');
  head.className = 'media__heading branch__title';
  head.textContent = name;
  // headingName() reads the child TEXT NODES, not textContent, to leave out the wiki-links "W".
  head.appendChild(fakeDoc.createTextNode(name));
  parent.appendChild(head);
  return head;
}
function rootHeading(name) {
  const head = makeEl('h1');
  head.className = 'media__heading storylet-root__heading';
  head.textContent = name;
  head.appendChild(fakeDoc.createTextNode(name));
  makeEl('div').appendChild(head);
  return head;
}
const badgeTexts = (heads) => heads.map((h) => {
  const badge = h.nextElementSibling;
  return badge && badge.classList.contains(api.BADGE_CLASS) ? badge.textContent : null;
});

check('open the Pavilion: the storylet and each option are badged, Favour-only options too',
  (() => {
    const root = rootHeading(PAVILION);
    const names = ['Hunt for butterflies', 'Promenade!', 'Exchange a Confession of Curiosity for a Confession of Pride',
      'Leave the Pavilion', 'Something the page does not list'];
    const branches = names.map(branchHeading);
    stage = { storylet: [root], branch: branches };
    run();
    return [badgeTexts([root])[0], badgeTexts(branches)];
  })(),
  ['Hallowmas · Nightmares',
   ['Nightmares +5 CP · Moth', 'Nightmares +1 CP', 'Curiosity → Pride',
    'leave · Favour to re-enter unless Moth', null]]);

check('the same exchange title under the Roof Below is its own row, not the Pavilion one',
  (() => {
    const root = rootHeading(ROOF);
    const head = branchHeading('Exchange a Confession of Whimsy for a Confession of Guile');
    stage = { storylet: [root], branch: [head] };
    run();
    return [badgeTexts([root])[0], badgeTexts([head])[0]];
  })(),
  ['Hallowmas · Wounds', 'Whimsy → Guile']);

check('Promenade! under a storylet that is not a Masque draws nothing',
  (() => {
    const root = rootHeading('The Streets of London');
    const head = branchHeading('Promenade!');
    stage = { storylet: [root], branch: [head] };
    run();
    return badgeTexts([head])[0];
  })(), null);

check('Make merry! is the Wreck, +1 Suspicion, and only the Wreck',
  (() => {
    const a = branchHeading('Make merry!');
    stage = { storylet: [rootHeading(WRECK)], branch: [a] };
    run();
    const got = badgeTexts([a])[0];
    const b = branchHeading('Make merry!');
    stage = { storylet: [rootHeading(PAVILION)], branch: [b] };
    run();
    return [got, badgeTexts([b])[0]];
  })(),
  ['Suspicion +1 CP', null]);

// --- the panel -----------------------------------------------------------------

check('the panel builds: a row per non-Leave option, every section, and the 2025 caveat',
  (() => {
    const root = api.renderHallowmasPanel();
    let text = '';
    let rows = 0;
    (function walk(el) {
      if (!el) return;
      if (el.nodeType === 3) { text += el.nodeValue; return; }
      if (el.dataset && el.dataset.hmSearch) rows++;
      for (const child of el.childNodes || []) walk(child);
    })(root);
    return [rows, ['Menace to Spirit', 'What Spirit buys', 'Affiliations', 'Leftover Confessions',
      'Companion upgrades — 2025 only', 'Different companions are upgradeable each year']
      .filter((s) => !text.includes(s))];
  })(),
  [opts.filter((e) => !e.leave).length, []]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
