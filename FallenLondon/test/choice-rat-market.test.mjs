// Ad-hoc test for FallenLondon/choice-helper.js's Rat Market badges
// ('rat-market').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here is the derivation, because the table stores ONE
// number per sale -- the item's Nominal Sale Value -- and the badge's prices
// are worked out from it. So this suite reproduces every Rat-Shilling figure
// the guide prints, at all three saturation bands, from that one number: a
// slip in the multipliers or in the pennies-per-shilling would move every
// badge at once and nothing else would catch it. Then: the range the badge
// shows because saturation cannot be read, and the two stalls whose stock this
// feature deliberately does not price.
//
// Numbers come from The Rat Market (Guide), its Selling table, and all 37
// stall option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-16.
//
//   node FallenLondon/test/choice-rat-market.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

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
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { RM_SELLS, RM_WAYS, RM_STALLS, RM_STORYLETS, RM_BANDS, RM_INDEX, RM_PENCE_PER_SHILLING,'
    + ' RM_CLASS, RM_BRANCH_CLASS, rmShillings, rmEchoes, rmRange, rmBadgeText, rmSpec, rmStoryletSpec,'
    + ' rmRatings, carouselLookup, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
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
const key = api.normalizeName;
const rows = api.RM_OPTIONS;
const row = (name, storylet) => rows.find((e) => e.name === name && (!storylet || e.storylet === storylet));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function otherNames(own) {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key).filter(Boolean);
}

check('41 sale options across the eight demand stalls and the Eclipse',
  [api.RM_SELLS.length, new Set(api.RM_SELLS.map((e) => e.storylet)).size, api.RM_STALLS.length],
  [41, 9, 9]);

// The whole price model, checked against every shilling figure the guide
// prints. The table stores only the nominal value; if the multipliers or the
// ten pence a shilling is worth were ever wrong, every badge would be wrong
// together and nothing else in the file would notice.
check('the three bands reproduce the guide\'s Rat-Shilling prices',
  [1250, 5000, 6250, 25000, 31250].map((n) => [0, 1, 2].map((b) => api.rmShillings(n, b))),
  [[165, 140, 125], [660, 560, 500], [825, 700, 625], [3300, 2800, 2500], [4125, 3500, 3125]]);

check('the guide\'s markups are 32%, 12% and none',
  api.RM_BANDS.map((b) => b[1]), [1.32, 1.12, 1]);

check('a shilling is ten pence, so the Echoes follow the shillings',
  [api.RM_PENCE_PER_SHILLING, api.rmEchoes(1250, 0), api.rmEchoes(31250, 2)], [10, 16.5, 312.5]);

check('every nominal sale value is one the guide\'s table records',
  [...new Set(api.RM_SELLS.map((e) => e.nominal))].sort((a, b) => a - b),
  [1250, 5000, 6250, 25000, 31250]);

// The badge shows a range rather than a figure because Rat Market Saturation
// is not stated anywhere this script can read.
check('a sale badge is the range from a fresh market to a saturated one',
  ['Sell an Uncanny Incunabulum', 'Sell a collection of incunabula', 'Sell a Queen Mate and an Epaulette Mate']
    .map((n) => api.rmBadgeText(row(n))),
  ['→ 16.5–12.5 ▼', '→ 82.5–62.5 ▼', '→ 66–50 ▼']);

check('a sale\'s tooltip spells all three bands out in shillings and Echoes',
  ['165 Rat-Shillings (16.5 Echoes)', '140 Rat-Shillings (14 Echoes)', '125 Rat-Shillings (12.5 Echoes)']
    .map((line) => api.rmSpec(row('Sell an Uncanny Incunabulum')).title.includes(line)),
  [true, true, true]);

check('getting in costs three actions once a weekend and nothing after',
  api.RM_WAYS.map((e) => [e.name, e.actions, api.rmBadgeText(e)]),
  [['Enter the Rat Market', 3, '3 actions, once a weekend'],
    ['Enter the Rat Market again', 0, 'free, once you are a rat'],
    ['Take a walk around the market’s perimeter', 0, 'free · look before entering'],
    ['Back to the Flit', 0, 'free'],
    ['Beg for the Broken Triplet’s wisdom', 0, 'free · Tempestuous Tale ×1']]);

check('a stall\'s heading names the Demand that brought it',
  ['The Whiskery Bibliophile', 'The Grey Tipster', 'The Rat Market, Eclipsed', 'The Rat Market']
    .map((s) => api.rmStoryletSpec(key(s)).text),
  ['buys · Inscrutable Demand', 'buys · Calculating Demand', 'buys · The Rat Market, in Eclipse',
    '3 actions in, then free']);

// The two stalls this feature refuses to price: their stock turns with world
// qualities nobody has read, so they are labelled instead of scored.
check('the two selling stalls say they rotate rather than quote a price',
  ['The Maundering Rat’s Stall', 'The Tatterdemalion Tent'].map((s) => {
    const spec = api.rmStoryletSpec(key(s));
    return [spec.text, spec.title.includes('does not price it')];
  }),
  [['sells · rotates weekly', true], ['sells · rotates weekly', true]]);

check('the registered pass',
  (() => {
    const sale = makeHeading('Sell a Crackling Device');
    const enter = makeHeading('Enter the Rat Market');
    branches = [sale, enter];
    roots = [makeHeading('The Belligerent Bombardier')];
    api.rmRatings();
    const out = [text(roots[0], api.RM_CLASS), text(sale, api.RM_BRANCH_CLASS),
      text(enter, api.RM_BRANCH_CLASS)];
    roots = [makeHeading('The Rat Market')];
    api.rmRatings();
    out.push(text(roots[0], api.RM_CLASS), text(sale, api.RM_BRANCH_CLASS),
      text(enter, api.RM_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['buys · Intricate Demand', '→ 82.5–62.5 ▼', null, '3 actions in, then free', null,
    '3 actions, once a weekend']);

check('no Rat Market name is in another feature\'s table',
  (() => { const others = otherNames('RM_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'rat-market'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
