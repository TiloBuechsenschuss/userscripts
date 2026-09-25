// Ad-hoc test for FallenLondon/choice-helper.js's Station Developments feature
// ('station-developments') on the shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The badge form: what an option takes and what it gives, `Curio ×5 → Scrip ×25`, and the
//    improvements' `Scrip 50×(n+1) → Library 1`, with the tooltip saying what n is.
//  - The improvement price: ten cost 2,750 in all (50 x 1 to 10), as the guide says.
//  - The eight Offices branches, and the Hurlers' twelve options matching the twelve pages that
//    name that storylet.
//  - The title traps: options that share a title are one entry (the canteen, the Institute, the
//    Lapidary's rumours, the Cabinet Noir), and a curly apostrophe still finds the entry.
//  - The storylet opened: one heading badge counting options, one badge on an option, and none on
//    another storylet's option.
//  - That no title is in another feature's table.
//
// Options come from the option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-25, with Railway Station Developments (Guide) as the cross-check.
//
//   node tests/choice-station-developments.test.mjs

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
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, SD_CFG, SD_OPTIONS, SD_INDEX, SD_DEF, sdRatings,'
    + ' SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, HW_OPTIONS, RBG_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const OFFICES = 'Offices of the Tracklayer’s Union: ';
const sd = (storylet, name) => api.SD_OPTIONS.find((e) => key(e.storylet) === key(storylet) && key(e.name) === key(name));
const label = (storylet, name) => api.pqSpec(sd(storylet, name), api.SD_CFG).text;
const title = (storylet, name) => api.pqSpec(sd(storylet, name), api.SD_CFG).title;

check('every entry names its storylet and option, and none repeats',
  [api.SD_OPTIONS.every((e) => e.storylet && e.name && typeof e.give === 'string' && typeof e.get === 'string'),
    new Set(api.SD_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.SD_OPTIONS.length],
  [true, true]);

check('a conversion reads what it takes and what it gives',
  [label('Licensed by Mr Stones', 'Trade five Crystallised Curios'),
    label('Visit your Library', 'Lend without remorse'),
    label('Entice Purchasers', 'Sell Unearthly Fossils'),
    label('Licensed by Mr Stones', 'Trade one Fabulous Diamond')],
  ['Curio ×5 → Scrip ×25', 'Bazaarine Poetry ×1 → Scrip ×10', 'Fossil ×5 → Scrip ×(27 + Train Baggage Accommodations)',
    'Fabulous ×1 → Scrip ×625 · Kiss ×2']);

check('an improvement reads the Scrip formula and what it builds',
  [label(OFFICES + 'Jericho Branch', 'Build a small library'),
    label(OFFICES + 'Balmoral Branch', 'Construct a Cabinet Noir'),
    label(OFFICES + 'Hurlers Branch', 'Blast open a hot-spring outpost for Virginia’s Spa')],
  ['Scrip 50×(n+1) → Library 1', 'Scrip 50×(n+1) → Cabinet Noir 1', 'Scrip 50×(n+1) + Hillmover ×3 → Hot Spring']);

check('every improvement that costs the formula says what n is, and sits in an Offices branch',
  api.SD_OPTIONS.filter((e) => e.give.indexOf('Scrip 50×(n+1)') === 0)
    .filter((e) => !/n is the station’s developments so far/.test(api.pqSpec(e, api.SD_CFG).title)
      || (e.storylet.indexOf(OFFICES) !== 0)).map((e) => e.name),
  []);

check('ten improvements at 50 times one more each cost 2,750, as the guide says',
  Array.from({ length: 10 }, (_, i) => 50 * (i + 1)).reduce((a, b) => a + b, 0), 2750);

check('each of the eight branches has options, and the Hurlers’ twelve match the twelve pages that name it',
  (() => {
    const names = ['Ealing Gardens', 'Jericho', 'Evenlode', 'Balmoral', 'Station VIII', 'Burrow-Infra-Mump', 'Moulin', 'Hurlers'];
    const counts = names.map((n) => api.SD_OPTIONS.filter((e) => e.storylet === OFFICES + n + ' Branch').length);
    return [counts.every((c) => c > 0), counts[7]];
  })(), [true, 12]);

check('the title traps: options that share a title are one entry, and the tooltip says so',
  [['Improve your canteen', OFFICES + 'Station VIII Branch'], ['Construct an Archaeological Institute', OFFICES + 'Moulin Branch'],
    ['Trade rumours with the Calculating Lapidary', 'Licensed by Mr Stones'],
    ['Further expand your Cabinet Noir', OFFICES + 'Balmoral Branch']]
    .map(([n, s]) => [api.SD_OPTIONS.filter((e) => key(e.name) === key(n)).length, /Two pages carry this title/.test(title(s, n))]),
  [[1, true], [1, true], [1, true], [1, true]]);

check('the game’s curly apostrophe still finds the entry',
  api.SD_INDEX.some((r) => r.matches(key('Build a Watchtower, lit with the reflected light of the Contrarian’s Monochromatic Lantern'))),
  true);

check('the Library heading counts nine options, the way the pages do',
  api.pqStoryletSpec(key('Visit your Library'), api.SD_DEF).text, '9 options');

check('the storylet, opened: the heading and an option each get one badge, another storylet’s option none',
  (() => {
    const head = makeHeading('Visit your Library');
    const opt = makeHeading('Lend proudly');
    const stray = makeHeading('Trade one Knob of Scintillack');
    roots = [head];
    branches = [opt, stray];
    api.sdRatings();
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [t(head, api.SD_DEF.cls), t(opt, api.SD_DEF.branchCls), t(stray, api.SD_DEF.branchCls)];
    roots = [];
    branches = [];
    return out;
  })(), ['9 options', 'Zeefaring Epic ×1 → Making Waves +2–6 · Rostygold ×275', null]);

check('a station’s Offices branch is told from the others by its own heading',
  (() => {
    const head = makeHeading(OFFICES + 'Moulin Branch');
    roots = [head];
    api.sdRatings();
    const out = badgeOf(head, api.SD_DEF.cls);
    roots = [];
    return out && out.textContent;
  })(), '1 option');

check('no option title is also a title in the tables of the other features',
  (() => {
    const mine = api.SD_OPTIONS.map((e) => key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS].map((e) => key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'station-developments'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
