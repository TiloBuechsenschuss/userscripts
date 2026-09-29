// Ad-hoc test for FallenLondon/choice-helper.js's Economy panel ('economy').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: the panel is a few hundred hand-built nodes, and building it is the only
// way to catch a typo in one of them without the live site; the price matrix (16 items x five markets)
// and the three ratios the conversion to Stuivers rests on, each of which the guide prints twice and
// which must agree with itself (1 Echo = 20 s, 1 Tempestuous Tale = 10 s, an item price converted
// through the Echo landing near the plain Stuiver price); that a converted figure says "≈" and keeps its
// source; the guides' own arithmetic (Ecdysis's 5.4 EPA, the Stacks' 116 StPA, the Sous's 41.67) and
// the one place the guide's totals do not add up (the steel floors); that the statue table is derived
// from the Station Statues badges; and the filter.
//
// Numbers come from Roof Economy (Guide), Stuiver Grinding (Guide), Bessemer Steel Ingot (Guide) and
// Hinterland Scrip-Making on fallenlondon.wiki, fetched through the API on 2026-09-30 -- see
// docs/superpowers/research/2026-09-30-economy.md.
//
//   node tests/choice-economy.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null,
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
    addEventListener(ev, fn) { (this.__on = this.__on || {})[ev] = fn; },
    querySelector(sel) {
      const m = /^([a-z]+)?(?:\.([\w-]+))?$/.exec(sel);
      return this.children.find((c) => (!m[1] || c.tagName === m[1].toUpperCase())
        && (!m[2] || String(c.className).split(/\s+/).includes(m[2]))) || null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
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
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
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
    'return { ECON_PRICES, ECON_POSTS, ECON_ITEMS, ECON_GRINDS, ECON_SKELETONS, ECON_STEEL, ECON_STEEL_MAKING, ECON_STEEL_TOTAL, ECON_BSI, ECON_SCRIP,'
    + ' econCell, econPair, econS, econAllIn, econStatues, econApplyFilter, econSteelSum, renderEconomyPanel, PANELS, ST_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;')(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const panel = api.renderEconomyPanel();
function walk(node, out) {
  out.push(node);
  for (const child of node.children || []) walk(child, out);
  return out;
}
const nodes = walk(panel, []);
const rows = nodes.filter((n) => n.dataset && n.dataset.econSearch);
const price = (name) => api.ECON_PRICES.find((p) => p.item === name);
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b));

// --- the panel ---------------------------------------------------------------------------------------------------

check('the panel builds: a few hundred hand-built nodes', !!panel && nodes.length > 300, true);
check('one searchable row per entry: 16 prices, 8 posts... every table reaches the page',
  rows.length, api.ECON_PRICES.length + api.ECON_POSTS.length + api.ECON_ITEMS.length + api.ECON_GRINDS.length + api.ECON_SKELETONS.length
    + api.ECON_STEEL.length + 2 + api.ECON_STEEL_MAKING.length + api.ECON_BSI.length + api.ECON_SCRIP.length + api.econStatues().length);
check('it has ten sections, each with its own heading', nodes.filter((n) => n.tagName === 'TABLE').length, 10);
check('the panel is registered for the launcher, once, with its icon and label',
  api.PANELS.filter((p) => p.id === 'economy').map((p) => [p.icon, p.label, typeof p.render]), [['💰', 'Economy', 'function']]);
check('the search index reaches text the collapsed row does not show (a note, a part, a shop)',
  ['amber-crusted fin', 'hortus conclusus', 'justificande'].map((t) => rows.some((r) => r.dataset.econSearch.includes(t))),
  [true, true, true]);

// --- the price matrix and its ratios ------------------------------------------------------------------------------

check('16 items, each with a [buy, sell] pair in each of the five markets',
  [api.ECON_PRICES.length, api.ECON_PRICES.every((p) => p.cells.length === 5 && p.cells.every((c) => c.length === 2))], [16, true]);
check('a shop never buys an item for less than it sells it for',
  api.ECON_PRICES.flatMap((p) => p.cells.map((c, i) => [p.item, i, c])).filter(([, , c]) => c[0] && c[1] && c[0].s != null && c[1].s != null && c[0].s < c[1].s)
    .map(([item, i]) => item + '@' + i), []);
// The whole conversion rests on three ratios the guide prints twice; each has to agree with itself.
check('1 Echo = 20 Stuivers: the Bazaar\'s Echo price of Tantalising Possibility, Fifth City Relic and Glimpse of Anathema equals the Roof\'s Stuiver price',
  [['Tantalising Possibility', 1], ['Relic of the Fifth City', 2], ['Glimpse of Anathema', 1]].map(([n, m]) => {
    const e = price(n).cells[0][1].e;
    return e * 20 === price(n).cells[m][1].s;
  }), [true, true, true]);
check('1 Tempestuous Tale = 10 Stuivers: the Sous pays a Tale for a Bessemer Steel Ingot, and a Tale sells for s10 in every market that buys it',
  [price('Bessemer Steel Ingot').cells[4][1], price('Tempestuous Tale').cells.map((c) => c[1] && c[1].s).filter((x) => x != null)],
  [{ item: 'Tempestuous Tale', n: 1, s: 10 }, [10, 10, 10, 10]]);
check('an item price converted through the Echo lands near the Roof\'s plain Stuiver price for the same thing',
  [near(api.econCell(price('Roof-Chart').cells[2][1]).text.replace(/[^\d.]/g, '') * 1, 50, 0.02),
    near(api.econCell(price('Ratwork Mechanism').cells[3][1]).text.replace(/[^\d.,]/g, '').replace(',', '') * 1, 250, 0.01),
    near(api.econCell(price('Memory of a Much Stranger Self').cells[4][1]).text.replace(/[^\d.,]/g, '').replace(',', '') * 1, 250, 0.05)],
  [true, true, true]);
check('a cell that is converted says "≈" and keeps its source; a plain Stuiver figure is bare; "-" is not traded, not zero',
  [api.econCell({ s: 100 }), api.econCell({ e: 0.1 }), api.econCell({ item: 'Moon-Pearl', n: 253, e: 2.53 }), api.econCell(null)],
  [{ text: 's100', title: '' }, { text: '≈ s2', title: 'E0.1 at 20 s to the Echo.' },
    { text: '≈ s50.6', title: 'Paid in 253 Moon-Pearl (E2.53 at 20 s to the Echo).' }, { text: '–', title: 'The shop does not trade it.' }]);
check('a buy / sell pair reads both halves',
  [api.econPair(price('Ascended Ambergris').cells[2]).text, api.econPair(price('Nodule of Warm Amber').cells[1]).text],
  ['s100 / s50', '– / s1']);
check('thousands are grouped and a trailing zero is not printed', [api.econS(6250), api.econS(1250), api.econS(41.67), api.econS(50.6), api.econS(10)],
  ['s6,250', 's1,250', 's41.7', 's50.6', 's10']);

// --- what only Stuivers buy ---------------------------------------------------------------------------------------

check('14 items: the eleven Stuiver shop items, the Moth-Self and the two bought with other items',
  [api.ECON_ITEMS.length, api.ECON_ITEMS.filter((e) => e.price.item).length, api.ECON_ITEMS.filter((e) => e.price.s != null).length], [14, 2, 12]);
check('the Burgundian Doublet and Gown are Clothing (the item pages), not the Hats Roof Economy calls them',
  api.ECON_ITEMS.filter((e) => /^Burgundian (Doublet|Gown)$/.test(e.name)).map((e) => [e.slot, e.note.includes('Hat')]), [['Clothing', true], ['Clothing', true]]);
check('the shops\' Stuiver prices are the two guides\' agreed figures',
  Object.fromEntries(api.ECON_ITEMS.filter((e) => e.price.s != null && e.price.s < 74500).map((e) => [e.name, e.price.s])),
  { 'Gentleman’s Self-Similar Carryall': 1500, 'Leviathan-Leather Valise': 1500, 'Celestial Cinnabar Compass': 2000, 'A Conspiracy of Smugglers': 2000,
    'Moth-Eaten Tapestry': 2500, 'Vertebral Bludgeon': 2500, 'Carmine Escoffion': 4000, 'Supracranial Skull': 4200, 'Six-by-Two Carryall': 7500,
    'Burgundian Doublet': 17500, 'Burgundian Gown': 17500 });
check('the price of an item bought with another item is that item, not a guessed Stuiver figure',
  api.ECON_ITEMS.filter((e) => e.price.item).map((e) => [e.name, e.price.item, e.price.n]),
  [['Always-Returning Glim Earring', 'Ascended Ambergris', 20], ['Burgundian Breviary', 'Palimpsest Scrap', 500]]);

// --- the grinds, against the guide's own arithmetic ---------------------------------------------------------------

check('12 grinds', api.ECON_GRINDS.length, 12);
const grind = (m) => api.ECON_GRINDS.find((g) => g.method.startsWith(m));
check('Ecdysis: the guide says 5.4 EPA if the Stuivers are converted, which is 3.8 + 32 ÷ 20',
  [Math.round((3.8 + 32 / 20) * 10) / 10, api.econAllIn(grind('Ecdysis'))], [5.4, 108]);
check('the Stacks: the guide\'s 116 StPA is the Index\'s s2320 over 20 actions; Beneficence 125 is a s1250 carapace over 10',
  [2320 / 20, 1250 / 10, grind('The Stacks: Index').stpa, grind('Burgundian').stpa], [116, 125, 116, 125]);
check('the Sous: a flat s500 over 12 actions is the 41.67 StPA',
  [Math.round((500 / 12) * 100) / 100, grind('The Bones Above the Sous').stpa], [41.67, 41.67]);
check('a grind with no Echoes given is all-in at its Stuivers, and says the guide gave none',
  [api.econAllIn(grind('The High Sancta')), api.econAllIn({ stpa: null, epa: null })], [146, null]);
check('the Lab\'s three experiments carry both figures', ['Lab: a few', 'Lab: a carto', 'Lab: the geo'].map((m) => [grind(m).stpa, grind(m).epa]),
  [[0, 3.6], [27.1, 1.1], [8, 1.7]]);

// --- steel and BSI, carried with the guide's totals as the cross-check ------------------------------------------------

check('nine stations', api.ECON_STEEL.length, 9);
check('the rows sum to the guide\x27s ceilings (110 Steel, 2530 BSI) but not its floors: 96 and 2163 against the printed 94 and 2115',
  [api.econSteelSum(), api.ECON_STEEL_TOTAL], [{ steel: [96, 110], bsi: [2163, 2530] }, { steel: '94–110', bsi: '2115–2530' }]);
check('Make tracks is 22.5 BSI a Steel and Make a lot of tracks 23, the guide\'s 22.5–23',
  api.ECON_STEEL_MAKING.map((m) => m.bsi / m.steel), [22.5, 23]);
check('12 BSI sources; Hearts\' Game leads with 6.67, then the Licentiate skeletons 6.19 and Professional Activities 5.44',
  [api.ECON_BSI.length, api.ECON_BSI.slice(0, 3).map((b) => b.perAction)], [12, [6.67, 6.19, 5.44]]);
check('five Scrip methods, each least not above its most', [api.ECON_SCRIP.length, api.ECON_SCRIP.every((r) => r[1] <= r[2])], [5, true]);

// --- the statues are derived, not transcribed --------------------------------------------------------------------

const statues = api.econStatues();
check('every statue-building option Station Statues rates reaches the table, and only those',
  [statues.length, statues.length === api.ST_OPTIONS.filter((e) => /^rated /.test(e.label) && e.rate != null && e.worth != null).length], [statues.length, true]);
check('a statue at 28.5 Echoes is s570, one at 12.5 to 20 is a range',
  [statues.find((s) => s.worth === 28.5).s, statues.find((s) => s.worth === '12.5 to 20').s], [[570, 570], [250, 400]]);
check('the table has at least fifteen statues', statues.length >= 15, true);

// --- the filter --------------------------------------------------------------------------------------------------

function fakeSections() {
  const mk = (...texts) => ({ node: { hidden: false }, rows: texts.map((t) => ({ hidden: false, dataset: { econSearch: t } })) });
  return [mk('roof-chart bazaar', 'anathema sous'), mk('carryall hat'), mk('anathema again')];
}
const secs = fakeSections();
api.econApplyFilter(secs, 'ANATHEMA');
check('a term hides the rows that do not reach it, in any letter case, and a section whose rows all went',
  [secs.map((s) => s.rows.map((r) => r.hidden)), secs.map((s) => s.node.hidden)], [[[true, false], [true], [false]], [false, true, false]]);
api.econApplyFilter(secs, '');
check('clearing the term shows everything again', [secs.every((s) => !s.node.hidden), secs.every((s) => s.rows.every((r) => !r.hidden))], [true, true]);
const input = nodes.find((n) => n.tagName === 'INPUT');
check('the panel has its filter box, wired to the rows it built',
  (() => {
    input.__on.input({ currentTarget: { value: 'anathema' } });
    const shown = rows.filter((r) => !r.hidden).length;
    input.__on.input({ currentTarget: { value: '' } });
    return [shown > 0 && shown < rows.length, rows.every((r) => !r.hidden)];
  })(), [true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
