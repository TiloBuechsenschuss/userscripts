// Test for FallenLondon/choice-helper.js's Hallowmas Masques feature and panel.
//
//   node tests/choice-hallowmas-masques.test.mjs
//
// What is worth pinning:
//
//  - The table's shape: 38 option pages across four Masques, one Leave each, and
//    every row's Menace and mask agreeing with the Masque it sits under.
//  - The badge: Menace CP, a ▼ exactly when an item is spent, the mask as a WORD
//    so the badge reads with the colour stripped.
//  - The cross-checks the table carries on purpose: the Spirit rewards' stated
//    Echoes against their stated Echoes-per-Spirit, and the two upgrade tables
//    the guide prints (the list and the tick-grid) against each other.
//  - That a row is looked up under the OPEN storylet only: the same exchange
//    title exists in two Masques, and Promenade! / Make merry! must not leak.
//  - The seasons: one per year, three Masques each, hmSeason's fallback for a
//    year with no entry, and the panel built for 2025, 2026 and 2027.
//  - What you hold: the Confessions, masks, Masque spends and upgrade needs read
//    off banked Possessions counts, a dash (never a zero) when nothing has been
//    read, each upgrade's done / short / ready, and the auto-refresh on open.
//  - Spirit of Hallowmas, a quality, off the banked Myself reading.
//  - Converting Confessions: only the season's exchanges (per year, since they
//    move between Masques), the fewest
//    exchanges then the fewest moves between Masques, and an upgrade short of a
//    Confession told how to make it from one it can spare.
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
    'return { HM_MASQUES, HM_MASQUE_OPTIONS, HM_SPIRIT_REWARDS, HM_SEASONS, hmSeason, hmMenaceRuns,'
    + ' HM_CONFESSION_COLUMNS, HM_AFFILIATIONS, HM_CONFESSION_REWARDS, HM_MARK_SPENDS,'
    + ' hmHoldings, hmMaskHeldText, HM_GILDED_MASK_ITEMS, itemNameFromLabel, itemKey, hmUpgradeStatus, COUNTS_KEY, AUTO_KEY, hmConfessionRoutes, hmRouteText, HM_CACHE_KEY,'
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

check('38 option pages: 9 + 9 + 11 + 9 (the Pavilion has both of its exchange sets)',
  [opts.length, ...Object.keys(api.HM_MASQUES).map((s) => opts.filter((e) => e.storylet === s).length)],
  [38, 9, 9, 11, 9]);

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

check('an exchange row for every option page: the Pavilion carries both the 2024 set and its own three',
  [WRECK, SACRISTY, ROOF, PAVILION].map((s) => opts.filter((e) => e.storylet === s && e.swap).map((e) => e.swap.join('>'))),
  [['Impropriety>Curiosity', 'Violence>Whimsy', 'Whimsy>Pride'],
   ['Impropriety>Violence', 'Guile>Violence', 'Pride>Impropriety'],
   ['Whimsy>Guile', 'Curiosity>Pride'],
   ['Whimsy>Guile', 'Curiosity>Pride', 'Impropriety>Curiosity', 'Violence>Whimsy', 'Whimsy>Pride']]);

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

// --- the seasons -----------------------------------------------------------------
const seasons = api.HM_SEASONS;
const at = (y) => new Date(y, 9, 20);
check('one season per year, oldest first',
  seasons.filter((s, i) => i && s.year <= seasons[i - 1].year).length, 0);
check('every season runs three distinct known Masques and rests the fourth',
  seasons.filter((s) => s.masques.length !== 3 || new Set(s.masques).size !== 3
    || s.masques.some((n) => !api.HM_MASQUES[n])).map((s) => s.year), []);
check('2025 rested the Sacristy, 2026 rests the Wreck',
  seasons.map((s) => [s.year, Object.keys(api.HM_MASQUES).filter((n) => !s.masques.includes(n))]),
  [[2025, [SACRISTY]], [2026, [WRECK]]]);
check('hmSeason: this year exact, a later year falls back to the newest marked stale, an earlier one to the oldest',
  [2026, 2027, 2024].map((y) => { const s = api.hmSeason(at(y)); return [s.year, s.stale]; }),
  [[2026, false], [2026, true], [2025, true]]);
check('in 2026 Scandal is handed in and Suspicion is not',
  ['Scandal', 'Suspicion'].map((m) => api.hmMenaceRuns(api.hmSeason(at(2026)), m)), [true, false]);
check('every season carries its upgrades, a free companion and a checked date',
  seasons.filter((s) => !s.upgrades.length || !s.newCompanion || !s.checked).map((s) => s.year), []);
check('every season runs eight distinct exchanges, each at one of its running Masques',
  seasons.map((s) => [s.year, s.exchanges.length, new Set(s.exchanges.map((x) => x[1] + '>' + x[2])).size,
    s.exchanges.filter((x) => !s.masques.includes(x[0])
      || !api.HM_CONFESSION_COLUMNS.includes(x[1]) || !api.HM_CONFESSION_COLUMNS.includes(x[2])).length]),
  [[2025, 8, 8, 0], [2026, 8, 8, 0]]);
check('2026, from the guide: the Pavilion runs its own three, not a copy of the Roof Below',
  [ROOF, PAVILION, SACRISTY].map((m) => seasons[1].exchanges.filter((x) => x[0] === m).map((x) => x[1] + '>' + x[2])),
  [['Whimsy>Guile', 'Curiosity>Pride'],
   ['Impropriety>Curiosity', 'Violence>Whimsy', 'Whimsy>Pride'],
   ['Impropriety>Violence', 'Pride>Impropriety', 'Guile>Violence']]);
check('every 2026 exchange has an option row to badge it under its Masque',
  seasons[1].exchanges.filter((x) => !opts.some((e) => e.storylet === x[0] && e.swap
    && e.swap[0] === x[1] && e.swap[1] === x[2])).map((x) => x.join(' ')), []);
check('twelve upgrades a year in 2025 and 2026',
  seasons.map((s) => s.upgrades.length), [12, 12]);
check('where a season prints a tick-grid, every upgrade has a row and none is spare',
  seasons.filter((s) => s.grid).map((s) => [s.year, s.upgrades.filter((u) => !s.grid[u.to]).length,
    Object.keys(s.grid).length === s.upgrades.length]),
  [[2025, 0, true], [2026, 0, true]]);
check('the guide list table and its tick-grid agree on every upgrade',
  seasons.filter((s) => s.grid).flatMap((s) => s.upgrades.filter((u) => {
    const grid = api.HM_CONFESSION_COLUMNS.map((c) => (u.confessions.includes(c) ? 'x' : '.')).join('');
    return grid !== s.grid[u.to];
  }).map((u) => s.year + ' ' + u.to)), []);
check('an upgrade takes two or three distinct Confessions of the six',
  seasons.flatMap((s) => s.upgrades.filter((u) => u.confessions.length < 2 || u.confessions.length > 3
    || new Set(u.confessions).size !== u.confessions.length
    || u.confessions.some((c) => !api.HM_CONFESSION_COLUMNS.includes(c))).map((u) => s.year + ' ' + u.to)), []);
check('2026 transcribed: the Parisian Emigree has two upgrades and the Henchman two',
  ['Parisian Émigrée', 'Devious Henchman'].map((f) => seasons[1].upgrades.filter((u) => u.from === f).map((u) => u.to)),
  [['Parisian Infiltrator', 'Rats in the Walls'], ['Pious Henchman', 'Faustian Henchman']]);
check('2026 re-checked against the option pages: the Goldfish takes Violence, Rats in the Walls also 10 Rattus Faber',
  [seasons[1].upgrades.find((u) => u.to === 'Memorious Goldfish').confessions,
   seasons[1].upgrades.find((u) => u.to === 'Rats in the Walls').holds],
  [['Violence', 'Whimsy'], [['Parisian Émigrée', 1], ['Talkative Rattus Faber', 10]]]);
check('every 2026 upgrade says what it needs from Possessions, as [item, count >= 1] pairs',
  seasons[1].upgrades.filter((u) => !Array.isArray(u.holds)
    || u.holds.some((p) => typeof p[0] !== 'string' || !(p[1] >= 1))).map((u) => u.to), []);
check('2026 also offers the Perforated Diver to anyone who missed it in 2025',
  seasons.map((s) => s.alsoFree ? s.alsoFree[0] : null), [null, 'Perforated Diver']);
check('affiliations are linked by their wiki page titles, with no leading "A"',
  api.HM_AFFILIATIONS.filter((a) => /^A /.test(a.first)).map((a) => a.first), []);
check('the free companion is spelt as the guide and its item page spell it',
  [seasons[1].newCompanion, seasons[1].upgrades.filter((u) => u.from === 'Parisian Émigrée').length], ['Parisian Émigrée', 2]);
check('the leftover-Confession turn-ins cover all six Confessions once',
  api.HM_CONFESSION_REWARDS.map((r) => r[0]).sort(), [...api.HM_CONFESSION_COLUMNS].sort());
check('four affiliations, one per Menace, none carrying a hard-coded year',
  [api.HM_AFFILIATIONS.map((a) => a.menace), api.HM_AFFILIATIONS.filter((a) => a.note).length],
  [['Nightmares', 'Wounds', 'Suspicion', 'Scandal'], 0]);
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
      'Exchange a Confession of Violence for a Confession of Whimsy', 'Leave the Pavilion', 'Something the page does not list'];
    const branches = names.map(branchHeading);
    stage = { storylet: [root], branch: branches };
    run();
    return [badgeTexts([root])[0], badgeTexts(branches)];
  })(),
  ['Hallowmas · Nightmares',
   ['Nightmares +5 CP · Moth', 'Nightmares +1 CP', 'Curiosity → Pride', 'Violence → Whimsy',
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

function panelText(now) {
  const root = api.renderHallowmasPanel(null, now);
  let text = '';
  let rows = 0;
  (function walk(el) {
    if (!el) return;
    if (el.nodeType === 3) { text += el.nodeValue; return; }
    if (el.dataset && el.dataset.hmSearch) rows++;
    for (const child of el.childNodes || []) walk(child);
  })(root);
  return { text, rows };
}
check('the 2026 panel builds: a row per non-Leave option, every section, this year’s upgrades and Masques',
  (() => {
    const { text, rows } = panelText(at(2026));
    return [rows, ['Hallowmas 2026', 'Dates', '2 November', 'Menace to Spirit', 'Suspicion cannot be handed in',
      'What Spirit buys', 'Affiliations', 'Leftover Confessions', 'Companion upgrades — 2026 only', 'Morsel of Mignon',
      'Parisian Émigré', 'The Perforated Diver is also free, if you did not meet it in 2025',
      'not running in 2026', 'not offered in 2026']
      .filter((x) => !text.includes(x)),
      ['Perforated Zubmariner', 'No entry for'].filter((x) => text.includes(x))];
  })(),
  // Every non-Leave option, less the Pavilion's two exchanges that do not run in 2026.
  [opts.filter((e) => !e.leave).length - 2, [], []]);
check('the panel lists the running Masques first and the resting one last',
  (() => {
    const { text } = panelText(at(2026));
    return ['Wounds', 'Nightmares', 'Scandal', 'Suspicion (not running'].map((m) => text.indexOf(' — ' + m)).every((v, i, a) => v >= 0 && (!i || v > a[i - 1]));
  })(), true);
check('a year with no entry shows the newest season and says so',
  (() => {
    const { text } = panelText(at(2027));
    return ['No entry for 2027', 'Companion upgrades — 2026 only', 'check the guide'].filter((x) => !text.includes(x));
  })(), []);
check('the 2025 panel still builds from its own entry',
  (() => {
    const { text } = panelText(at(2025));
    return ['Companion upgrades — 2025 only', 'Perforated Diver', 'not running in 2025'].filter((x) => !text.includes(x));
  })(), []);
check('a Masque the season rests says so in its storylet tooltip; a running one does not',
  [WRECK, SACRISTY].map((n) => api.hmMasqueStoryletSpec(api.normalizeName(n)).title.includes('does not expect')),
  [true, false]);

// --- what you hold -----------------------------------------------------------------

const heldOf = (pairs) => ({ live: false, at: 0, count: (n) => (pairs[n] || 0) });
const up = (to) => seasons[1].upgrades.find((u) => u.to === to);
check('an upgrade is done when you hold what locks it, short when anything is missing, else ready',
  [api.hmUpgradeStatus(up('Memorious Goldfish'), heldOf({ 'Memorious Goldfish': 1 })),
   api.hmUpgradeStatus(up('Memorious Goldfish'), heldOf({ 'Cheerful Goldfish': 1, 'A Confession of Whimsy': 2 })),
   api.hmUpgradeStatus(up('Memorious Goldfish'),
     heldOf({ 'Cheerful Goldfish': 1, 'A Confession of Whimsy': 1, 'A Confession of Violence': 1 }))].map((s) => s.text),
  ['✓ have Memorious Goldfish (locked)', 'needs Confession of Violence', '★ ready']);
check('a count short of what is needed says how far short',
  api.hmUpgradeStatus(up('Rats in the Walls'), heldOf({ 'Parisian Émigrée': 1, 'Talkative Rattus Faber': 4,
    'A Confession of Impropriety': 1, 'A Confession of Violence': 1, 'A Confession of Curiosity': 1 })).text,
  'needs Talkative Rattus Faber 4/10');
check('a quality the row also needs keeps "ready" conditional, and the no-Agents Morsel counts as done',
  [api.hmUpgradeStatus(up('Deposed King Crocodile'), heldOf({ 'A Confession of Violence': 1, 'A Confession of Pride': 1,
    'A Confession of Guile': 1 })).text.startsWith('★ ready if you have A Hunter of Zee-Beasts 10'),
   api.hmUpgradeStatus(up('Parisian Infiltrator'), heldOf({ 'Morsel of Mignon': 1 })).state],
  [true, 'done']);
check('no holdings read, or a season with no `holds`, is no status at all',
  [api.hmUpgradeStatus(up('Memorious Goldfish'), null), api.hmUpgradeStatus(seasons[0].upgrades[0], heldOf({}))],
  [null, null]);

check('nothing ever read: the panel shows dashes and says so, never a zero',
  (() => {
    const { text } = panelText(at(2026));
    return [text.includes('Possessions never read'), text.includes('Spirit never read'), text.includes('(hold –)'),
      text.includes(' in all')];
  })(), [true, true, true, false]);

store.set(api.COUNTS_KEY, JSON.stringify({ v: 2, at: Date.now() - 5 * 60000, character: null, held: [
  ['confession of curiosity', 'A Confession of Curiosity', 3], ['confession of whimsy', 'A Confession of Whimsy', 1],
  ['confession of violence', 'A Confession of Violence', 2], ['moth', 'The Moth', 1], ['ephebe manifold', 'The Ephebe, Manifold', 1],
  ['cheerful goldfish', 'Cheerful Goldfish', 1], ['bottle of strangling willow absinthe', 'Bottle of Strangling Willow Absinthe', 7],
] }));
check('banked counts: the Confession total, a held mask, a gilded one, a Masque spend and an upgrade ready, with the read labelled',
  (() => {
    const { text } = panelText(at(2026));
    return ['Confessions — 6 in all', '✓ held', '✓ gilded', 'Crown (resting)', '5 × Bottle of Strangling Willow Absinthe (hold 7)',
      'Possessions read 5 minutes ago', '★ ready', 'Whimsy (1)', 'keeps the original']
      .filter((x) => !text.includes(x));
  })(), []);
// The gilded (Fate) masks carry the same unlock quality as the plain ones, so
// either one ticks the mask; the gilded one says so.
check('a mask is ticked for its plain or its gilded version, and never read is a dash',
  [api.hmMaskHeldText(heldOf({ 'The Moth': 1 }), 'Moth'), api.hmMaskHeldText(heldOf({ 'The Gant Moth': 1 }), 'Moth'),
   api.hmMaskHeldText(heldOf({ 'The Moth': 1, 'The Gant Moth': 1 }), 'Moth'),
   api.hmMaskHeldText(heldOf({ 'The Ephebe, Manifold': 1 }), 'Infant'),
   api.hmMaskHeldText(heldOf({ 'The Violant Demon': 1 }), 'Moth'), api.hmMaskHeldText(null, 'Moth')],
  ['✓ held', '✓ gilded', '✓ gilded', '✓ gilded', 'none', '–']);
check('every mask has exactly one gilded version, and none shares a name with a plain one',
  [Object.keys(api.HM_GILDED_MASK_ITEMS).sort().join(), Object.keys(api.HM_MASQUES).map((n) => api.HM_MASQUES[n].mask).sort().join(),
   new Set(Object.values(api.HM_GILDED_MASK_ITEMS).concat(['The Infant', 'The Crown', 'The Moth', 'The Demon'])).size],
  ['Crown,Demon,Infant,Moth', 'Crown,Demon,Infant,Moth', 8]);

// Verbatim aria-labels off a real Possessions tab's Hat slot (2026-10-28).
// The Cosmogone Crown was not in it.
check('three gilded masks read off real Possessions labels under the names the table carries',
  ["The Gant Moth; Shadowy +6; Dreaded -2; Bizarre +4; Glasswork +1; Moth-Winged +1; A Hallowmas Mask. A four-winged mask of tattered cloth, bearing four mournful, hungry eyes upon its Gant-tipped wings. Don this mask to see its Opportunity Card during Hallowmas.",
   "The Violant Demon; Dangerous +6; Respectable -2; Dreaded +4; Artisan of the Red Science +1; Demon-Horned +1; A Hallowmas mask. The sinister mien of a Christian demon, illuminated in violant inks. See how similar it is to your own visage. Don this mask to see its Opportunity Card during Hallowmas.",
   "The Ephebe, Manifold; Persuasive +6; Respectable -2; Bizarre +4; Shapeling Arts +1; Captured by Innocence +1; A face, growing. A crown of limbs, contorted. It is in all aspects horrid, and all the more powerful for it. Don this mask to see its Opportunity Card during Hallowmas."]
    .map((l) => api.itemKey(api.itemNameFromLabel(l))),
  ['Moth', 'Demon', 'Infant'].map((m) => api.itemKey(api.HM_GILDED_MASK_ITEMS[m])));

check('hmHoldings reads the banked counts through itemKey, so the article does not matter',
  [api.hmHoldings().count('A Confession of Curiosity'), api.hmHoldings().count('Moth'), api.hmHoldings().count('The Crown')],
  [3, 1, 0]);

// --- converting Confessions ------------------------------------------------------

const routes26 = api.hmConfessionRoutes(api.hmSeason(at(2026)));
const routes25 = api.hmConfessionRoutes(api.hmSeason(at(2025)));
check('2026: the direct exchanges are one step at the Masques that run them',
  ['Whimsy>Guile', 'Curiosity>Pride', 'Impropriety>Curiosity', 'Violence>Whimsy', 'Whimsy>Pride',
   'Guile>Violence', 'Impropriety>Violence', 'Pride>Impropriety']
    .map((k) => api.hmRouteText(routes26[k])),
  ['Whimsy → Guile (the Roof Below)', 'Curiosity → Pride (the Roof Below)',
   'Impropriety → Curiosity (the Pavilion)', 'Violence → Whimsy (the Pavilion)', 'Whimsy → Pride (the Pavilion)',
   'Guile → Violence (the Sacristy)', 'Impropriety → Violence (the Sacristy)', 'Pride → Impropriety (the Sacristy)']);
check('2026: a longer route stays in one Masque where it can and says where it moves',
  [api.hmRouteText(routes26['Pride>Violence']), api.hmRouteText(routes26['Curiosity>Violence']),
   routes26['Curiosity>Violence'].steps, routes26['Curiosity>Violence'].runs.length],
  ['Pride → Impropriety → Violence (the Sacristy)',
   'Curiosity → Pride → Impropriety → Violence (the Roof Below, then the Sacristy)', 3, 2]);
check('2026: all eight exchanges run, so every Confession can become every other',
  Object.keys(routes26).length, 30);
check('2025 used its own exchanges: the Pavilion turns Violence into Whimsy, the Wreck Guile into Violence',
  [api.hmRouteText(routes25['Violence>Whimsy']), api.hmRouteText(routes25['Guile>Violence'])],
  ['Violence → Whimsy (the Pavilion)', 'Guile → Violence (the Wreck)']);
check('every route is the fewest exchanges: no route is longer than a breadth-first count over the same exchanges',
  (() => {
    const bad = [];
    for (const [routes, year] of [[routes26, 2026], [routes25, 2025]]) {
      const season = api.hmSeason(at(year));
      const edges = season.exchanges.map((x) => [x[1], x[2]]);
      for (const from of api.HM_CONFESSION_COLUMNS) {
        const dist = { [from]: 0 };
        const queue = [from];
        while (queue.length) {
          const c = queue.shift();
          for (const [a, b] of edges) if (a === c && dist[b] == null) { dist[b] = dist[c] + 1; queue.push(b); }
        }
        for (const to of api.HM_CONFESSION_COLUMNS) {
          if (to === from) continue;
          const r = routes[from + '>' + to];
          if ((dist[to] == null) !== !r || (r && r.steps !== dist[to])) bad.push(year + ' ' + from + '>' + to);
        }
      }
    }
    return bad;
  })(), []);
check('a missing Confession is made from one the upgrade can spare, never from one it needs',
  [api.hmUpgradeStatus(up('Faustian Henchman'), heldOf({ 'Devious Henchman': 1, 'A Confession of Guile': 1 }), routes26).text,
   api.hmUpgradeStatus(up('Faustian Henchman'), heldOf({ 'Devious Henchman': 1, 'A Confession of Guile': 2 }), routes26).text,
   api.hmUpgradeStatus(up('Memorious Goldfish'), heldOf({ 'Cheerful Goldfish': 1, 'A Confession of Violence': 1,
     'A Confession of Guile': 3 }), routes26).text],
  ['needs Confession of Violence',
   'needs Confession of Violence (make it: Guile → Violence (the Sacristy))',
   'needs Confession of Whimsy (make it: Guile → Violence → Whimsy (the Sacristy, then the Pavilion))']);
check('a season with no exchange into a Confession says no Masque makes it',
  api.hmUpgradeStatus(up('Memorious Goldfish'), heldOf({ 'Cheerful Goldfish': 1, 'A Confession of Violence': 1,
    'A Confession of Guile': 3 }), api.hmConfessionRoutes({ exchanges: [[ROOF, 'Whimsy', 'Guile']] })).text,
  'needs Confession of Whimsy (no Masque makes it this year)');
check('the panel carries the conversion table for this year, with no dead end in 2026',
  (() => {
    const { text } = panelText(at(2026));
    return ['Converting Confessions — 2026', 'Whimsy → Guile → Violence (the Roof Below, then the Sacristy)',
      'Violence → Whimsy (the Pavilion)'].filter((x) => !text.includes(x))
      .concat(['no Masque makes it in 2026', 'nothing in 2026'].filter((x) => text.includes(x)));
  })(), []);

// --- Spirit of Hallowmas -----------------------------------------------------------

store.set(api.HM_CACHE_KEY, JSON.stringify({ v: 1, at: Date.now() - 2 * 60000, character: null, spirit: 120 }));
check('banked Spirit is shown with its age, and the rewards it covers are ticked',
  (() => {
    const { text } = panelText(at(2026));
    return ['Spirit of Hallowmas120', 'Spirit read 2 minutes ago', '100 ✓', '50 ✓'].filter((x) => !text.includes(x))
      .concat(text.includes('250 ✓') ? ['250 ticked'] : []);
  })(), []);

// Last, because the refresh it books never settles under the stubbed timers.
check('opening the panel on stale counts books a background refresh, unless auto is off',
  (() => {
    const ctx = { rerender() {} };
    store.set(api.AUTO_KEY, '0');
    api.renderHallowmasPanel(ctx, at(2026));
    const off = frameCount();
    store.delete(api.AUTO_KEY);
    api.renderHallowmasPanel(ctx, at(2026));
    return [off, frameCount() > off];
  })(), [0, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
