// Ad-hoc test for FallenLondon/choice-helper.js's Whisker-Ways badges.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// What's worth pinning here:
//
//  - The table against the guide: 14 Generate and 9 Refine rows, keys unique,
//    the Refine nets the plan derived (docs/whisker-ways/plan.md) against the
//    item values carried, the Echo value of every Generate row.
//  - The twelve titles read off the game (2026-11-14) and that a titled row is
//    matched by its title alone.
//  - The gate: the greeting OR the Generate storylet's heading, AND at least
//    two options on screen from these tables; an unlisted option does not veto;
//    the Wisp-Ways (Philosofruits) never fires this, though `crowd2` is in both.
//
//   node tests/choice-whisker-ways.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM (copied from choice-philosofruits.test.mjs) -----------------
//
// It needs `closest()`, descendant `querySelector` and `after()`, since a
// picture is found by walking from a heading up to its branch and back down.

function matchesSimple(el, simple) {
  if (!el || el.nodeType !== 1) return false;
  const m = /^([a-z0-9]*)((?:[.#][\w-]+)*)$/i.exec(simple);
  if (!m) throw new Error('stub cannot parse selector: ' + simple);
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  const parts = m[2].match(/[.#][\w-]+/g) || [];
  return parts.every((p) => (p[0] === '#' ? el.id === p.slice(1)
    : String(el.className).split(/\s+/).includes(p.slice(1))));
}

function matches(el, sel) {
  return sel.split(',').some((one) => {
    const chain = one.trim().split(/\s+/);
    if (!matchesSimple(el, chain[chain.length - 1])) return false;
    let i = chain.length - 2;
    for (let a = el.parentNode; a && i >= 0; a = a.parentNode) {
      if (matchesSimple(a, chain[i])) i--;
    }
    return i < 0;
  });
}

function descendants(root) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) { out.push(c); walk(c); }
  })(root);
  return out;
}

function makeEl(tag, cls, attrs, kids) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    id: '',
    className: cls || '',
    title: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    attributes: Object.assign({}, attrs || {}),
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      if (child.nodeType === 1) this.children.push(child);
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
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    querySelectorAll(sel) { return descendants(this).filter((d) => matches(d, sel)); },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    closest(sel) {
      for (let a = this; a && a.nodeType === 1; a = a.parentNode) if (matches(a, sel)) return a;
      return null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  Object.defineProperty(el, 'textContent', {
    get() { return el.childNodes.map((n) => (n.nodeType === 3 ? n.nodeValue : n.textContent)).join(''); },
    set(v) { el.childNodes = [{ nodeType: 3, nodeValue: String(v) }]; el.children = []; },
  });
  (kids || []).forEach((k) => el.appendChild(typeof k === 'string' ? { nodeType: 3, nodeValue: k } : k));
  return el;
}

const body = makeEl('body');
const fakeDoc = {
  body,
  querySelectorAll: (sel) => body.querySelectorAll(sel),
  querySelector: (sel) => body.querySelector(sel),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }
const store = new Map();
const fakeStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
const noTimer = () => 0;

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { WW_GENERATE, WW_REFINE, WW_AREAS, WW_STORYLETS, WW_COLOR, WW_CLASS, WW_FLAG, WW_SKILLS,'
    + ' wwOptionText, wwOptionSpec, wwFindRow, wwRefineNet, wwHere, wwRatings, phfImageKey, phfRatings,'
    + ' PHF_CLASS, PHF_BRANCH_CLASS, PHF_CARDS, FEATURES, FEATURE_GROUPS, PANELS,'
    + ' wwVirtuePayout, wwBalancePayout, wwPayoutLines, wwFromQualities, renderWwPanel, WW_QUALITIES }; })();');
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

const rows = api.WW_GENERATE.concat(api.WW_REFINE);
const row = (key) => rows.find((r) => r.key === key);

// --- the table -----------------------------------------------------------------

check('14 Generate rows, 9 Refine rows', [api.WW_GENERATE.length, api.WW_REFINE.length], [14, 9]);
check('no two rows share a picture', new Set(rows.map((r) => r.key)).size, 23);
check('every key is already a picture key', rows.filter((r) => api.phfImageKey(r.key) !== r.key).map((r) => r.key), []);
{
  const plan = readFileSync(join(here, '..', 'docs', 'whisker-ways', 'plan.md'), 'utf8');
  check('every row\'s picture is the one the plan shows',
    rows.filter((r) => !plan.includes('img/' + r.key + 'small.png')).map((r) => r.key), []);
}
check('Generate: General 2, then 4 per Virtue',
  ['General', 'Cunning', 'Invention', 'Community'].map((g) => api.WW_GENERATE.filter((r) => r.group === g).length),
  [2, 4, 4, 4]);
check('every challenge names a known stat and a number',
  rows.flatMap((r) => (r.cost === undefined ? r.ch : [r.ch]))
    .filter((c) => !(['Dangerous', 'Shadowy', 'Watchful', 'Persuasive'].concat(api.WW_SKILLS).includes(c[0])
      && typeof c[1] === 'number')), []);
check('the +25 rows are two challenges with no Airs range (confirmed in game for crowd2)',
  api.WW_GENERATE.filter((r) => r.win === 25).map((r) => [r.key, r.ch.length, r.airs, r.rare]),
  [['foliageorange', 2, null, null], ['dawnmachine', 2, null, null], ['crowd2', 2, null, null]]);
check('Generate Echoes at 0.2 a point, as the plan\'s column',
  api.WW_GENERATE.map((r) => Math.round(r.win * 0.2 * 10) / 10),
  [2.6, 2.6, 3.4, 3.4, 4.4, 5, 3.4, 3.4, 4.4, 5, 3.4, 3.4, 4.4, 5]);
check('Refine nets, as the plan derived them (Memory has no sale value)',
  api.WW_REFINE.map(api.wwRefineNet), [5, 5, 4.5, 5, null, 4.5, 5, 5, 4.5]);
check('a null failure is "nothing recorded", never 0',
  rows.filter((r) => r.fail === 0).length, 0);

// --- titles ----------------------------------------------------------------------

check('the titles read off the game, on the rows whose pictures showed them',
  rows.filter((r) => r.title).map((r) => r.key + ': ' + r.title),
  ['bazaardoor_teeth: Gnaw towards secluded dreamings', 'chesspiece_apocyan: Sift dreams of lost mail',
    'crowd2: Navigate the needy islands of the zee',
    'hoofprint: Impress a moral upon the tale', 'snakehead2: Implant unsettling implications',
    'beeface: Elucidate unpleasant consequences', 'fist2: Invigorate the story with heroic values',
    'delirium: Make room for impressive developments', 'currency1_gold: Socket promises of riches and treasure',
    'clouds: Obscure the facts of the narrative', 'cross: Eliminate a dogmatic reading',
    'map: Muddle familiar routes and events']);
check('every Refine row is titled', api.WW_REFINE.filter((r) => !r.title).length, 0);
check('a titled row is found by its title whatever the picture',
  api.wwFindRow('Sift dreams of lost mail', 'zzz').key, 'chesspiece_apocyan');
check('a titled row is no longer found by its picture alone',
  api.wwFindRow('Something else', 'crowd2'), null);
check('an untitled row is found by its picture', api.wwFindRow('Anything', 'mirrormonster').key, 'mirrormonster');
check('no name of ours is a Philosofruits title',
  rows.filter((r) => r.title && api.PHF_CARDS.some((c) => c.title === r.title
    || c.options.some((o) => o.title === r.title))).length, 0);

// --- the badge -------------------------------------------------------------------

check('badge text',
  ['bazaardoor_teeth', 'mirrormonster', 'crowd2', 'hoofprint', 'snakehead2', 'currency1_gold', 'map']
    .map((k) => api.wwOptionText(row(k))),
  ['+13–18 MP?', '+17–21 MP?', '+25 MP?', '−10 MP · +3–4 Dev?', '−Implication ×2 · +4–6 Dev?',
    '−Diamond ×1 · +8–9 Rally?', '−Map ×1 · +8–9 Twist?']);
check('every badge names its quality in words -- the text alone carries the claim',
  rows.filter((r) => !/ (MP|Dev|Rally|Twist)\?$/.test(api.wwOptionText(r))).map((r) => r.key), []);

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const palette = Object.values(api.WW_COLOR);
check('four distinct colours', new Set(palette).size, 4);
check('white text reads on every one (contrast 4.5+)', palette.filter((c) => 1.05 / (lum(c) + 0.05) < 4.5), []);

const tip = (k, seen) => api.wwOptionSpec(row(k), seen || '').title;
check('tooltip: a narrow skill is certain at difficulty + 5',
  tip('hoofprint').includes('Narrow Mithridacy 9, certain at 14'), true);
check('tooltip: a broad stat at broadCertainAt', tip('snakehead2').includes('Broad Dangerous 130, certain at 217'), true);
check('tooltip: both challenges of a two-check row',
  tip('crowd2').includes('Challenges: Narrow A Player of Chess 8, certain at 13; Broad Persuasive 150, certain at 250.'),
  true);
check('tooltip: the Airs ranges', tip('nightmares_red').includes('Offered at Ratty Airs 0–12 and 89–100.'), true);
check('tooltip: General rare odds 10%, Virtue rows 50%',
  [tip('bazaardoor_teeth').includes('about 10%'), tip('mirrormonster').includes('about 50%')], [true, true]);
check('tooltip: a "-" failure is not claimed to be nothing',
  tip('mirrormonster').includes('Failure: nothing the guide records.'), true);
check('tooltip: the Generate caps',
  tip('evade2').includes('disappear at 100+ Mythic Potential, leaving only Refine; the story needs 50 to end'), true);
check('tooltip: the Refine caps', tip('clouds').includes('disappear at 20+ Balance'), true);
check('tooltip: the Refine net', tip('beeface').includes('Net about +4.5 Echoes'), true);
check('tooltip: no net without a sale value', tip('delirium').includes('Net: none'), true);
check('tooltip: an untitled row quotes what the game shows, to copy in',
  tip('mirrormonster', 'Peer into a mirror')
    .includes('The game shows “Peer into a mirror”: that is the title to copy into WW_GENERATE.'), true);
check('tooltip: a titled row has no such line',
  tip('crowd2', 'Navigate the needy islands of the zee').includes('not recorded'), false);

// --- the gate --------------------------------------------------------------------

function greet(area) {
  body.children.filter((c) => c.id === 'accessible-sidebar').forEach((c) => c.remove());
  if (area == null) return;
  const side = makeEl('div', 'accessible-sidebar u-visually-hidden', {}, [
    makeEl('h1', 'welcome', {}, ["It's TheFairUnknown! Welcome to " + area + ', delicious friend!']),
  ]);
  side.id = 'accessible-sidebar';
  body.appendChild(side);
}
greet('The Whisker-Ways');
check('greeting: the Whisker-Ways', api.wwHere(), true);
// Verbatim from the game, 2026-11-14: the sentence split over three lines.
body.children.filter((c) => c.id === 'accessible-sidebar').forEach((c) => c.remove());
{
  const side = makeEl('div', 'accessible-sidebar u-visually-hidden', {}, [
    makeEl('h1', 'welcome', {}, ["It's TheFairUnknown!\nWelcome to\n\nThe Whisker-Ways,\n\ndelicious friend!"]),
  ]);
  side.id = 'accessible-sidebar';
  body.appendChild(side);
}
check('greeting: the captured text, split over lines', api.wwHere(), true);
greet('Whisker-Ways');
check('greeting: without the article', api.wwHere(), true);
greet('The Wisp-Ways');
check('greeting: the Wisp-Ways is not it', api.wwHere(), false);
greet(null);
check('greeting: none read is not it', api.wwHere(), false);

// The capture of 2026-11-14: the root card, then its branches as siblings.
function storylet(name, image, options) {
  return makeEl('div', 'tab-content__bordered-container', {}, [
    makeEl('div', 'media media--root', {}, [
      makeEl('div', 'media__left', {}, [makeEl('img', '', { src: '//images.fallenlondon.com/icons/' + image + '.png' })]),
      makeEl('div', 'media__body', {}, [makeEl('h1', 'media__heading storylet-root__heading', {}, [name])]),
    ]),
  ].concat(options.map((o) => makeEl('div', 'media branch media--branch', {}, [
    makeEl('div', 'media__left branch__left', {}, [makeEl('div', 'small-card storylet__card', {}, [
      makeEl('img', 'media__object small-card__image',
        { alt: o[0], src: '//images.fallenlondon.com/icons/' + o[1] + '.png' })])]),
    makeEl('div', 'media__body branch__body', {}, [makeEl('div', '', {}, [
      makeEl('h2', 'media__heading heading heading--3 branch__title', {}, [o[0]]),
    ])]),
  ]))));
}
function stage(...nodes) {
  body.children.filter((c) => c.id !== 'accessible-sidebar').forEach((c) => c.remove());
  nodes.forEach((n) => body.appendChild(n));
}
const badges = (cls) => body.querySelectorAll('.' + cls).map((b) => b.textContent);

const captured = [
  ['Gnaw towards secluded dreamings', 'bazaardoor_teeth'],
  ['Sift dreams of lost mail', 'chesspiece_apocyan'],
  ['Navigate the needy islands of the zee', 'crowd2'],
  ['Abandon the whole endeavour', 'handstop'],
  ['Refine your nascent myth', 'stationVIII'],
];

greet(null);
stage(storylet('Dreams and Recollections', 'ratofglory', captured));
api.wwRatings();
check('the captured Generate step, no greeting read: badged by the storylet heading',
  badges(api.WW_CLASS), ['+13–18 MP?', '+17–21 MP?', '+25 MP?']);
api.wwRatings();
check('a second pass draws nothing twice', badges(api.WW_CLASS).length, 3);

// The Refine step as captured 2026-11-14, at 100 MP, no greeting read.
const refineCaptured = [
  ['Consider your options', 'crypticsecret'],
  ['Impress a moral upon the tale', 'hoofprint'], ['Implant unsettling implications', 'snakehead2'],
  ['Elucidate unpleasant consequences', 'beeface'], ['Invigorate the story with heroic values', 'fist2'],
  ['Make room for impressive developments', 'delirium'], ['Socket promises of riches and treasure', 'currency1_gold'],
  ['Obscure the facts of the narrative', 'clouds'], ['Eliminate a dogmatic reading', 'cross'],
  ['Muddle familiar routes and events', 'map'], ['Gather more mythic potential', 'diamondpurple'],
  ['Abandon the whole endeavour', 'handstop'],
  ['Declare the Unrefined Myth of The First Postal Rat of Nuncio complete', 'firequill'],
];
stage(storylet('Refining your Unrefined Myth', 'enginegreen', refineCaptured));
api.wwRatings();
check('the captured Refine step, no greeting read: all nine by title, nothing else',
  badges(api.WW_CLASS), ['−10 MP · +3–4 Dev?', '−Implication ×2 · +4–6 Dev?', '−Revelation ×1 · +8–9 Dev?',
    '−10 MP · +3–4 Rally?', '−Memory ×2 · +4–6 Rally?', '−Diamond ×1 · +8–9 Rally?',
    '−10 MP · +3–4 Twist?', '−Candle ×2 · +4–6 Twist?', '−Map ×1 · +8–9 Twist?']);
check('the captured Refine step: no "not recorded" line left',
  body.querySelectorAll('.' + api.WW_CLASS).filter((b) => b.title.includes('not recorded')).length, 0);

greet('The Whisker-Ways');
stage(storylet('Some Unknown Storylet', 'stationVIII', [
  ['Peer into a mirror', 'mirrormonster'], ['Slip away', 'evade2'], ['Go back', 'somethingunknown'],
]));
api.wwRatings();
check('an unknown storylet under the greeting: untitled rows by picture; an unlisted option does not veto',
  badges(api.WW_CLASS), ['+17–21 MP?', '+17–21 MP?']);

stage(storylet('Some Other Storylet', 'clouds', [['Peer into a mirror', 'mirrormonster'], ['Leave', 'handstop']]));
api.wwRatings();
check('one match alone does not clear the gate, even under the greeting', badges(api.WW_CLASS), []);

greet('Mangrove College');
stage(storylet('A Mirror Room', 'map', [['Peer into a mirror', 'mirrormonster'], ['Slip away', 'evade2']]));
api.wwRatings();
check('two pictures elsewhere: nothing', badges(api.WW_CLASS), []);

greet('The Whisker-Ways');
stage(storylet('Some Unknown Storylet', 'stationVIII', [['Peer into a mirror', 'mirrormonster'], ['Slip away', 'evade2']]));
api.wwRatings();
check('two pictures under the greeting: badged', badges(api.WW_CLASS).length, 2);
greet('Mangrove College');
api.wwRatings();
check('leaving clears the badges', badges(api.WW_CLASS), []);

// The Wisp-Ways: Philosofruits' crowd2 card open, with its own options.
greet('The Wisp-Ways');
stage(storylet('Philosophers without Portfolio', 'crowd2', [
  ['A', 'uttershroom_portsmall'], ['B', 'spidertreesmall'], ['C', 'servantsmall'], ['D', 'salon3small'],
]));
api.wwRatings();
api.phfRatings();
check('the Wisp-Ways: Philosofruits badges its options, the Whisker-Ways nothing',
  [badges(api.WW_CLASS).length, badges(api.PHF_BRANCH_CLASS).length], [0, 4]);
greet('The Whisker-Ways');
stage(storylet('Dreams and Recollections', 'ratofglory', captured));
api.wwRatings();
api.phfRatings();
check('the Whisker-Ways: Philosofruits draws nothing on the shared crowd2',
  [badges(api.WW_CLASS).length, badges(api.PHF_CLASS).length, badges(api.PHF_BRANCH_CLASS).length], [3, 0, 0]);

// --- registration ------------------------------------------------------------------

check('registered once, filed under Parabola, its panel right after Philosofruits behind the feature switch',
  [api.FEATURES.filter((f) => f.name === 'whisker-ways').length, api.FEATURE_GROUPS.Parabola.includes('whisker-ways'),
    api.PANELS.findIndex((p) => p.id === 'whisker-ways') - api.PANELS.findIndex((p) => p.id === 'philosofruits'),
    api.PANELS.filter((p) => p.id === 'whisker-ways').map((p) => [p.label, p.group, typeof p.render, p.follows.id])],
  [1, true, 1, [['The Whisker-Ways', 'Activities', 'function', 'whisker-ways']]]);

// --- the panel -----------------------------------------------------------------

// Printed rows of the guide's Payout tables (fetched 2026-11-14), Myth of Community and Moralising Developments.
check('Virtue payout against the guide’s printed rows: MP 50, 62, 63, 85, 126',
  [50, 62, 63, 85, 126].map((mp) => { const v = api.wwVirtuePayout(mp); return [v.top, v.mid, v.clues]; }),
  [[0, 4, 300], [0, 4, 420], [1, 0, 305], [1, 1, 400], [2, 0, 310]]);
check('Balance payout against the guide’s printed rows: 1, 6, 7, 13, 19, 25, 28',
  [1, 6, 7, 13, 19, 25, 28].map((n) => { const b = api.wwBalancePayout(n); return [b.top, b.low]; }),
  [[0, 4], [0, 24], [1, 3], [2, 2], [3, 1], [4, 0], [4, 12]]);
check('payout lines: nothing to say without Mythic Potential', api.wwPayoutLines({ Dev: 3 }), null);
check('payout lines: the captured state (100 MP, no Balance, Hole 20) cannot finish yet',
  api.wwPayoutLines({ MP: 100, Dev: 0, Rally: 0, Twist: 0, Hole: 20 }).slice(-1),
  ['Cannot finish yet: needs 11 more Balance, A Hole In Your Story at 9 or less (now 20).']);
check('payout lines: the guide’s Free Moralising Community result (85 MP, 12 Moralising)',
  api.wwPayoutLines({ MP: 85, Dev: 12, Rally: 0, Twist: 0, Hole: 8 }),
  ['Your Virtue: its 12.5 Echo item ×1, its 2.5 Echo item ×1, Cryptic Clue ×400 (the items by Virtue are in the table below).',
    'Moralising Development 12: Blackmail Material ×1, Scrap of Incendiary Gossip ×23.',
    'About 47.0 Echoes at base values.', 'Ready to finish.']);
check('an unread quality is a dash, a quality absent from an unfiltered tab is 0',
  [api.wwFromQualities({ filtered: true, values: new Map([['Mythic Potential', { level: 40 }]]) }),
    api.wwFromQualities({ filtered: false, values: new Map([['Mythic Potential', { level: 40 }]]) })],
  [{ MP: 40 }, { MP: 40, Dev: 0, Rally: 0, Twist: 0, Hole: 0 }]);
check('tooltip: a failed MP Refine still takes its Mythic Potential (seen in game)',
  tip('hoofprint').includes('A failure still takes the 10 Mythic Potential (seen in game).'), true);
check('tooltip: a failed Implication Refine still takes the Implications (seen in game)',
  tip('snakehead2').includes('A failure still takes the Extraordinary Implication ×2 (seen in game).'), true);
check('tooltip: the other item Refines say the same is assumed, not seen',
  tip('cross').includes('A failure still takes the Mourning Candle ×2 (seen with Extraordinary Implications; assumed for this one).'),
  true);
check('tooltip: Balance lowers A Hole In Your Story', tip('map').includes('lowers A Hole In Your Story by one'), true);
{
  const panel = api.renderWwPanel(null);
  const all = [];
  (function walk(n) { all.push(n); (n.children || []).forEach(walk); })(panel);
  check('the panel builds', !!panel && all.length > 150, true);
  const text = panel.textContent;
  check('the panel lists every option title and every payout item',
    rows.filter((r) => r.title && !text.includes(r.title)).map((r) => r.key)
      .concat(['Storm-Threnody', 'Bejewelled Lens', 'Antique Mystery', 'Journal of Infamy', 'Tale of Terror!!']
        .filter((n) => !text.includes(n))), []);
}

console.log(failures ? failures + ' FAILED' : 'All passed');
process.exitCode = failures ? 1 : 0;
