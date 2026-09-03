// Ad-hoc test for FallenLondon/ux-enhancers.js's Fruits of the Zee Festival
// card ratings and collection checklist.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// What's worth pinning here, all of it somewhere a plausible "tidy-up" would
// quietly produce a wrong number on a card:
//
//  - The per-depth Favour table. Every value on a Fruits of the Zee card
//    depends on Full Fathom Five, and the whole point of the badge is to quote
//    the right one. A Cabin-Fragment pays 50 at depth 1 and 400 at depth 5;
//    A Shattered Prow offers the Pocket Watch at 2-4 and the Scrimshander
//    Knife only at 5. At any KNOWN depth a card must offer exactly one claim,
//    which is what lets the badge be a single number.
//  - The depth-unknown badge shows a RANGE and never a single figure it can't
//    justify -- and the range is trimmed by the floor the hand proves, never
//    collapsed to a guess.
//  - The three ownership marks are three distinct states. A card offering
//    something you lack gets a star, one offering only things you hold gets a
//    tick, and one whose ownership can't be established gets a dash. Merging
//    the last two would tell someone who has never opened Possessions that
//    they already own the year's prize.
//  - The Sights at the Festival -> coral variant mapping, which is the single
//    most useful fact the panel carries and is transcribed from five option
//    pages rather than the guide's summary table (they disagree on order).
//  - The collection arithmetic: what counts towards "missing N of M" and what
//    deliberately does not (Fate items, ships, the consolation Amber).
//  - No Fruits of the Zee card name collides with a Crowds of Spite or a
//    Zailing one. All three features take a card's top-left corner, so a
//    collision would be two badges fighting over one spot.
//
// The numbers come from Fruits of the Zee Festival (Guide), its /Item
// Comparison subpage, and the individual card and option pages on
// fallenlondon.wiki.
//
//   node FallenLondon/test/ux-fruits-of-the-zee.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    value: '',
    style: { cssText: '' },
    dataset: {},
    attrs: {},
    childNodes: [],
    children: [],
    parentNode: null,
    nextElementSibling: null,
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
    // Real, not a no-op: `attachBadge`'s heading path hangs the badge on the
    // heading's next sibling, so a stub that swallowed this would let a
    // badge-that-never-lands pass.
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      node.parentNode = p;
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
      p.children.splice(p.children.indexOf(this) + 1, 0, node);
    },
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.children.indexOf(this);
      return i >= 0 ? this.parentNode.children[i + 1] || null : null;
    },
    addEventListener() {},
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    // Understands the three shapes ux-enhancers.js actually asks for:
    // `.a-class`, `[an-attribute]` and `tag[an-attribute]`.
    querySelector(sel) {
      const m = /^([a-z]+)?(?:\.([\w-]+))?(?:\[([^\]=]+)\])?$/.exec(sel);
      if (!m) throw new Error('stub querySelector cannot parse: ' + sel);
      return this.children.find((c) => (
        (!m[1] || c.tagName === m[1].toUpperCase())
        && (!m[2] || String(c.className).split(/\s+/).includes(m[2]))
        && (!m[3] || c.getAttribute(m[3]) != null)
      )) || null;
    },
    querySelectorAll() { return []; },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  return el;
}

// A quality on the Myself tab, in the shape ux-enhancers.js reads: the alt is
// the key and the visible text glues the level onto it.
function qualityLi(name, level, cap) {
  const li = makeEl('li');
  li.className = 'quality-item';
  const img = makeEl('img');
  img.attrs.alt = name;
  li.appendChild(img);
  const span = makeEl('span');
  span.className = 'quality-item__name';
  span.textContent = name + ' ' + level + (cap ? '/' + cap : '');
  li.appendChild(span);
  return li;
}

// An item on Possessions: [data-quality-id] wrapping an aria-label whose first
// semicolon-field is the name, with "× N" only when N > 1.
function ownedEl(name, count) {
  const root = makeEl('div');
  root.attrs['data-quality-id'] = '1';
  const inner = makeEl('div');
  inner.attrs['aria-label'] = name + (count > 1 ? ' × ' + count : '') + '; a description';
  root.appendChild(inner);
  return root;
}

// A storylet branch, in the shape captured from the live game (2026-09-03):
//
//   <div class="media branch media--branch" data-branch-id="259494">
//     <div class="media__body branch__body"><div>
//       <h2 class="media__heading heading heading--3 branch__title">…</h2>
//
// Only the heading and its parent matter here — the badge is hung after the
// heading, so it needs a real parent to land in.
function branchHeading(title) {
  const body = makeEl('div');
  const head = makeEl('h2');
  head.className = 'media__heading heading heading--3 branch__title';
  head.childNodes.push({ nodeType: 3, nodeValue: title });
  body.appendChild(head);
  return head;
}

let qualityLis = [];
let ownedEls = [];
let branchHeadings = [];
let storyletHeadings = [];
// The two places FL states the area, both verbatim from real captures: the
// screen-reader block's one-sentence greeting, and — new, from the wide
// layout's sidebar (2026-09-03) — an element holding the area on its own.
let area = 'Mutton Island';
let visibleArea = null;
const store = new Map();
const session = new Map();

const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll(sel) {
    if (sel === 'li.quality-item') return qualityLis;
    if (sel === '[data-quality-id]') return ownedEls;
    if (sel === '.branch__title') return branchHeadings;
    if (sel === '.storylet-root__heading') return storyletHeadings;
    return [];
  },
  querySelector(sel) {
    if (sel === 'input.input--item-search') return null;
    if (sel.includes('/profile/')) {
      const a = makeEl('a');
      a.attrs.href = '/profile/TheFairUnknown';
      return a;
    }
    if (sel === '.welcome__current-area') {
      if (visibleArea == null) return null;
      const p = makeEl('p');
      p.className = 'heading heading--2 welcome__current-area';
      p.textContent = visibleArea;
      return p;
    }
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
function fakeStore(map) {
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { FOTZ_CARDS, FOTZ_CORALS, FOTZ_BANDS, FOTZ_TREASURES, FOTZ_EQUIPMENT,'
    + ' FOTZ_STALL, FOTZ_SHIPS, FOTZ_FATE_ITEMS, FOTZ_BRIDE_ITEMS, FOTZ_QUALITIES,'
    + ' FOTZ_STATS, FOTZ_SUPPLICATION, fotzDevotionLadder, fotzActionsToDevotion,'
    + ' FOTZ_SUPPLICATION_OTHER, lookupFotzBranch, fotzBranchSpec, fotzSupplicationBranches,'
    + ' fotzDevotionAdvice,'
    + ' FOTZ_MARK_NEED, FOTZ_MARK_DONE, FOTZ_MARK_UNSURE, FOTZ_CLASS,'
    + ' lookupFotzCard, fotzOptionsAt, fotzBadgeSpec, fotzMissingFrom, fotzColor,'
    + ' fotzCollection, fotzLedger, readFotzState, fotzHoldings, captureFotzState,'
    + ' fotzUniquesByDepth, fotzSplitUniques,'
    + ' fotzSetDepth, fotzDepth, fotzDepthFloor, readPossessionCounts, itemCountFromLabel,'
    + ' normalizeName, SPITE_CARDS, ZEE_CARDS, FEATURES, PANELS,'
    + ' inFotzArea, inDiveArea, fotzWhere, forgetStaleDepth, fotzCardRatings,'
    + ' currentArea }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console,
  URLSearchParams, fakeStore(store), fakeStore(session),
  { pathname: '/', assign() {} }, class {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const card = (name) => api.lookupFotzCard(name);

// --- the card table --------------------------------------------------------

check('twelve diving cards plus the storylet at the bottom',
  [api.FOTZ_CARDS.filter((c) => !c.storylet).length,
    api.FOTZ_CARDS.filter((c) => c.storylet).map((c) => c.name)],
  [12, ['Her Fivefold Symmetry']]);

// Six, not five. A Graveyard of Derelict Debris turned up unbadged in a real
// hand (2026-09-03), and the guide had gained it between the transcription and
// then — which is the argument for re-reading the source rather than trusting
// a copy of it, and for counting here rather than spot-checking.
check('the six coral cards are the six corals, one each',
  api.FOTZ_CARDS
    .filter((c) => c.opts.some((o) => o.coral))
    .map((c) => [c.name, c.opts[0].coral]),
  [
    ['A Reef of Wrecks', 'Grasping Coral'],
    ['A Rusting Anchor', 'Gorgonian Reef-Rock'],
    ['Among the Deep-Fish', 'Barnacled Headpiece'],
    ['An Obscured Glitter', 'Spinebound Oddity'],
    ['Old Wounds', 'Pedestrian Polyp'],
    ['A Graveyard of Derelict Debris', 'Rust-Eaten Ration'],
  ]);

check('every coral names a card that is in the card table, and there are six of each',
  [api.FOTZ_CORALS.every((c) => api.FOTZ_CARDS.some((card) => card.name === c.card)),
    api.FOTZ_CORALS.length],
  [true, 6]);

check('every coral card names a coral that exists in FOTZ_CORALS',
  api.FOTZ_CARDS.every((c) => c.opts.every((o) => !o.coral
    || api.FOTZ_CORALS.some((coral) => coral.coral === o.coral))), true);

check('every card option names an equipment item that exists in FOTZ_EQUIPMENT',
  api.FOTZ_CARDS.every((c) => c.opts.every((o) => !o.item
    || api.FOTZ_EQUIPMENT.some((e) => e.name === o.item))), true);

check('FOTZ_EQUIPMENT and the card table agree on which card and which depths',
  api.FOTZ_EQUIPMENT.map((e) => {
    const from = api.FOTZ_CARDS.find((c) => c.opts.some((o) => o.item === e.name));
    const opt = from.opts.find((o) => o.item === e.name);
    return [e.name, from.name === e.card, String(opt.depths) === String(e.depths)];
  }),
  [
    ['A Cured Jillyfleur Cloak', true, true],
    ['Wrecking Boots', true, true],
    ['Nuncian Pocket Watch', true, true],
    ['Semi-Automated Mary Lloyd', true, true],
    ['A Faceted Decanter of Drownie Effluvia', true, true],
    ['Scrimshander Carving Knife', true, true],
  ]);

// --- the per-depth Favour table -------------------------------------------
//
// The heart of it. `fotzOptionsAt` at a known depth must always return exactly
// one claim, otherwise the badge has nothing to be.

const favourAt = (name, depth) => {
  const opts = api.fotzOptionsAt(card(name), depth, null);
  return opts.length === 1 ? opts[0].favour : opts.map((o) => o.favour);
};

check('A Cabin-Fragment pays 50/100/200/300/400 down the trench',
  [1, 2, 3, 4, 5].map((d) => favourAt('A Cabin-Fragment', d)),
  [50, 100, 200, 300, 400]);

check('Easy Pickings pays 100 then 150 then 300',
  [1, 2, 3, 4, 5].map((d) => favourAt('Easy Pickings', d)),
  [100, 150, 150, 300, 300]);

check('Unlucky Prisoner dips at depth 4, where the Shivs become a Skull',
  [1, 2, 3, 4, 5].map((d) => favourAt('Unlucky Prisoner', d)),
  [50, 100, 150, 125, 175]);

check('the Skull only turns up at depths 4 and 5',
  [1, 2, 3, 4, 5].map((d) => /Skull in Coral/
    .test(api.fotzOptionsAt(card('Unlucky Prisoner'), d, null)[0].gain)),
  [false, false, false, true, true]);

check('Tangled in the Rigging is Boots at 2-3 and the Mary Lloyd at 4-5',
  [1, 2, 3, 4, 5].map((d) => {
    const opts = api.fotzOptionsAt(card('Tangled in the Rigging'), d, null);
    return opts.length ? opts[0].item : null;
  }),
  [null, 'Wrecking Boots', 'Wrecking Boots',
    'Semi-Automated Mary Lloyd', 'Semi-Automated Mary Lloyd']);

check('A Shattered Prow gives up the Scrimshander Knife only at the bottom',
  [1, 2, 3, 4, 5].map((d) => {
    const opts = api.fotzOptionsAt(card('A Shattered Prow'), d, null);
    return opts.length ? [opts[0].item, opts[0].favour] : null;
  }),
  [null,
    ['Nuncian Pocket Watch', 150], ['Nuncian Pocket Watch', 150],
    ['Nuncian Pocket Watch', 150], ['Scrimshander Carving Knife', 400]]);

check('Well-Disguised Trinkets is the Cloak at 1-2 and the Decanter at 3-5',
  [1, 2, 3, 4, 5].map((d) => api.fotzOptionsAt(card('Well-Disguised Trinkets'), d, null)[0].item),
  ['A Cured Jillyfleur Cloak', 'A Cured Jillyfleur Cloak',
    'A Faceted Decanter of Drownie Effluvia', 'A Faceted Decanter of Drownie Effluvia',
    'A Faceted Decanter of Drownie Effluvia']);

check('a coral is claimable at every depth, for no Favour at all',
  [1, 2, 3, 4, 5].map((d) => {
    const opts = api.fotzOptionsAt(card('A Reef of Wrecks'), d, null);
    return [opts.length, opts[0].favour];
  }),
  [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0]]);

check('at a known depth every card offers exactly one claim or none at all',
  api.FOTZ_CARDS.every((c) => [1, 2, 3, 4, 5]
    .every((d) => api.fotzOptionsAt(c, d, null).length <= 1)), true);

check('the two depth-2 cards and the bottom storylet are the gated ones',
  api.FOTZ_CARDS.filter((c) => c.min).map((c) => [c.name, c.min]),
  [['Tangled in the Rigging', 2], ['A Shattered Prow', 2], ['Her Fivefold Symmetry', 5]]);

// --- the badge -------------------------------------------------------------

const holdingAll = { has: () => true, bride: true, sig: 'all' };
const holdingNone = { has: () => false, bride: false, sig: 'none' };
const spec = (name, depth, holdings, floor) =>
  api.fotzBadgeSpec(card(name), depth, depth ? 'set' : null, floor || null, holdings);

check('at a known depth the badge is that depth\'s figure, flat',
  [1, 3, 5].map((d) => spec('A Cabin-Fragment', d, holdingNone).text),
  ['50', '200', '400']);

check('with no depth it shows the range and never a single guess',
  spec('A Cabin-Fragment', null, holdingNone).text, '50–400');

check('a floor the hand proves trims the range but does not collapse it',
  [spec('Easy Pickings', null, holdingNone).text,
    spec('Easy Pickings', null, holdingNone, 4).text],
  ['100–300', '300']);

check('the depth-unknown tooltip says so, and says where to set it',
  /Depth unknown[\s\S]*Fruits of the Zee/.test(spec('A Cabin-Fragment', null, holdingNone).title),
  true);

check('a treasure-only card carries no ownership mark at all',
  [spec('A Cabin-Fragment', 3, holdingNone).text,
    spec('A Cabin-Fragment', 3, holdingAll).text,
    spec('A Cabin-Fragment', 3, null).text],
  ['200', '200', '200']);

check('a card offering something you lack is starred',
  spec('A Shattered Prow', 5, holdingNone).text, api.FOTZ_MARK_NEED + '400');

check('the same card is ticked once you have it',
  spec('A Shattered Prow', 5, holdingAll).text, api.FOTZ_MARK_DONE + '400');

check('and it is a dash, not a tick, when Possessions have never been read',
  spec('A Shattered Prow', 5, null).text, api.FOTZ_MARK_UNSURE + '400');

check('the three marks are three different glyphs',
  new Set([api.FOTZ_MARK_NEED, api.FOTZ_MARK_DONE, api.FOTZ_MARK_UNSURE]).size, 3);

check('a coral card is labelled rather than scored — it pays no Favour',
  [spec('A Reef of Wrecks', 2, holdingNone).text,
    spec('A Reef of Wrecks', 2, holdingAll).text],
  [api.FOTZ_MARK_NEED + 'coral', api.FOTZ_MARK_DONE + 'coral']);

// Every coral card otherwise wears an identical `★coral`, which flattens a
// real difference: a coral you have never seen and one you already have two of
// are not the same card to draw. Reported 2026-09-03 — A Graveyard of Derelict
// Debris and A Reef of Wrecks read the same with a Rust-Eaten Ration in hand.
{
  const holdingCorals = {
    has: () => false,
    count: (n) => (n === 'Rust-Eaten Ration' ? 1 : (n === 'Grasping Coral' ? 2 : 0)),
    bride: false,
    sig: 'corals',
  };
  check('the coral you are already holding is counted on the badge',
    [spec('A Graveyard of Derelict Debris', 2, holdingCorals).text,
      spec('A Reef of Wrecks', 2, holdingCorals).text,
      spec('Old Wounds', 2, holdingCorals).text],
    [api.FOTZ_MARK_NEED + 'coral (1)', api.FOTZ_MARK_NEED + 'coral (2)',
      api.FOTZ_MARK_NEED + 'coral']);

  check('...so two coral cards no longer read identically',
    spec('A Graveyard of Derelict Debris', 2, holdingCorals).text
      !== spec('A Reef of Wrecks', 2, holdingCorals).text, true);

  // One coral becomes one item, so the subtraction is the actionable form —
  // and there is room for it in the tooltip where there is none on a badge.
  check('the tooltip turns the count into how many more dives it needs',
    /holding 2 Grasping Corals already — 1 more is needed/
      .test(spec('A Reef of Wrecks', 2, holdingCorals).title), true);

  check('and says so when you already have enough',
    (() => {
      const held = {
        has: (n) => n !== 'Loomweavers',
        count: () => 3,
        bride: false,
        sig: 'plenty',
      };
      return /enough to cover everything still missing/
        .test(spec('A Reef of Wrecks', 2, held).title);
    })(), true);

  // "Enough to cover everything still missing" is nonsense when nothing is
  // missing — a coral held after the set is complete is simply spare.
  check('a coral held with the set already complete is called spare, not "enough"',
    /spare, since you already hold all three/
      .test(spec('A Reef of Wrecks', 2,
        { has: () => true, count: () => 2, bride: true, sig: 'done' }).title),
    true);
}

check('holdings with no count at all still produce a badge, just without the number',
  spec('A Reef of Wrecks', 2, holdingNone).text, api.FOTZ_MARK_NEED + 'coral');

check('a coral you need is gold and one you don\'t recedes',
  spec('A Reef of Wrecks', 2, holdingNone).color
    !== spec('A Reef of Wrecks', 2, holdingAll).color, true);

check('the Bride at the bottom of the trench is her own label',
  [spec('Her Fivefold Symmetry', 5, holdingNone).text,
    spec('Her Fivefold Symmetry', 5, holdingAll).text],
  [api.FOTZ_MARK_NEED + 'Bride', api.FOTZ_MARK_DONE + 'Bride']);

check('a card that offers nothing at this depth gets no badge',
  [spec('A Shattered Prow', 1, holdingNone),
    spec('Tangled in the Rigging', 1, holdingNone)],
  [null, null]);

check('the colour ramp rises with the trade-in value',
  [50, 100, 125, 175, 300, 400].map((v) => api.fotzColor(v))
    .every((c, i, all) => i === 0 || c !== all[i - 1]), true);

check('every card produces a usable badge at some depth',
  api.FOTZ_CARDS.every((c) => [1, 2, 3, 4, 5].some((d) => {
    const s = api.fotzBadgeSpec(c, d, 'set', null, holdingNone);
    return !!(s && s.text && s.color && s.title.includes(c.name));
  })), true);

check('a badge names what you are missing, by name',
  /Still missing: Scrimshander Carving Knife/
    .test(spec('A Shattered Prow', 5, holdingNone).title), true);

check('a coral badge spells out the Sights bands',
  /1–33 Gossamer Palms, 34–66 Mournclimber’s Wraps, 67–100 Loomweavers/
    .test(spec('A Reef of Wrecks', 2, holdingNone).title), true);

// --- what one claim would hand you ----------------------------------------

check('an unread Possessions list yields null, never an empty list',
  api.fotzMissingFrom(card('A Shattered Prow').opts[1], null), null);

const halfHeld = {
  has: (n) => n === 'Gossamer Palms' || n === 'Loomweavers',
  bride: false,
  sig: 'half',
};
check('a coral only reports the variants you actually lack',
  api.fotzMissingFrom(card('A Reef of Wrecks').opts[0], halfHeld),
  ['Mournclimber’s Wraps']);

check('a pure economy claim is never "missing" anything',
  api.fotzMissingFrom(card('A Cabin-Fragment').opts[0], holdingNone), []);

// --- the Sights at the Festival bands -------------------------------------

check('the three bands are 1-33, 34-66, 67-100 and name their traders',
  api.FOTZ_BANDS.map((b) => [b.lo, b.hi, b.trader]),
  [[1, 33, 'the Itinerant Zubmariner'],
    [34, 66, 'the Pirate-Poet'],
    [67, 100, 'the Enigmatic Angler']]);

check('the bands tile 1..100 with no gap and no overlap',
  api.FOTZ_BANDS.every((b, i) => (i === 0 ? b.lo === 1 : b.lo === api.FOTZ_BANDS[i - 1].hi + 1))
    && api.FOTZ_BANDS[api.FOTZ_BANDS.length - 1].hi === 100, true);

check('the coral variants are in Sights order, from the option pages',
  api.FOTZ_CORALS.map((c) => [c.coral, c.slot, c.variants]),
  [
    ['Barnacled Headpiece', 'Hat',
      ['Aria of Tranquillity', 'Crab-Clawed Tricorne', 'Peaceable Cowl']],
    ['Gorgonian Reef-Rock', 'Clothing',
      ['Concealing Skirt', 'Henchman’s Greatcoat', 'Obscurant’s Shawl']],
    ['Grasping Coral', 'Gloves',
      ['Gossamer Palms', 'Mournclimber’s Wraps', 'Loomweavers']],
    ['Pedestrian Polyp', 'Boots',
      ['Scrimshaw Sabatons', 'Bright-Buckled Boots', 'Riddlefisher’s Footsteps']],
    ['Spinebound Oddity', 'Adornment',
      ['‘Rosegate Blend’ Roll-ups', 'Mourning Locket', 'Justificande Cufflinks']],
    // Null, not three guesses: the wiki's own table says "(Coming in week 2)"
    // three times over and the page carries an {{Incomplete}} banner.
    ['Rust-Eaten Ration', 'Luggage', null],
  ]);

check('a coral whose items are not published yet says so instead of guessing',
  api.FOTZ_CORALS.filter((c) => !c.variants).map((c) => [c.coral, !!c.pending, c.pendingLabel]),
  [['Rust-Eaten Ration', true, 'Luggage']]);

check('every published coral offers exactly three variants, and no variant is shared',
  [api.FOTZ_CORALS.filter((c) => c.variants).every((c) => c.variants.length === 3),
    new Set(api.FOTZ_CORALS.filter((c) => c.variants).flatMap((c) => c.variants)).size],
  [true, 15]);

// --- the trade-in values ---------------------------------------------------

check('the Fruit Market\'s treasure prices',
  api.FOTZ_TREASURES.map((t) => [t.name, t.favour]),
  [
    ['Witch-Stone', 10],
    ['Collection of Zee-Glass', 20],
    ['Salt-Smoothed Shiv', 50],
    ['Sodden Mass', 100],
    ['Skull in Coral', 125],
    ['Urchin Spine', 125],
    ['Long-Lost Zee Trunk', 200],
  ]);

check('trading a spare piece of equipment always pays more than buying one costs',
  api.FOTZ_EQUIPMENT.every((e) => e.favour > e.stall), true);

check('the equipment trade-in and stall prices',
  api.FOTZ_EQUIPMENT.map((e) => [e.name, e.favour, e.stall]),
  [
    ['A Cured Jillyfleur Cloak', 100, 50],
    ['Wrecking Boots', 100, 50],
    ['Nuncian Pocket Watch', 150, 75],
    ['Semi-Automated Mary Lloyd', 200, 100],
    ['A Faceted Decanter of Drownie Effluvia', 300, 150],
    ['Scrimshander Carving Knife', 400, 200],
  ]);

// --- reading how many you hold --------------------------------------------

check('"× N" is a count, and a bare name is one of it',
  ['Witch-Stone × 5; a pebble', 'Wrecking Boots; sturdy', 'Sodden Mass x 12; wet']
    .map((l) => api.itemCountFromLabel(l)),
  [5, 1, 12]);

check('an item listed twice counts once, at its highest count — never summed',
  (() => {
    ownedEls = [ownedEl('Wrecking Boots', 1), ownedEl('Wrecking Boots', 2)];
    const held = api.readPossessionCounts();
    ownedEls = [];
    return held.get('wrecking boots').count;
  })(), 2);

check('no Possessions markup at all reads as null, not as "you own nothing"',
  api.readPossessionCounts(), null);

// --- the collection --------------------------------------------------------

// A character mid-festival: some Favour, Sights sitting in the Pirate-Poet's
// band, one Grasping Coral in hand, and a scattering of the collection held.
function setCharacter() {
  qualityLis = [
    qualityLi('Thalassic Favour', 260),
    qualityLi('Fivefold Devotion', 8),
    qualityLi('Sights at the Festival', 40),
    qualityLi('A Fruitless Harvest', 12),
  ];
  ownedEls = [
    ownedEl('Grasping Coral', 1),
    ownedEl('Gossamer Palms', 1),
    ownedEl('Wrecking Boots', 2),
    ownedEl('Witch-Stone', 10),
    ownedEl('Sodden Mass', 2),
    ownedEl('Long-Lost Zee Trunk', 1),
  ];
}
setCharacter();
const state = api.readFotzState();
const collection = api.fotzCollection(state);

check('the collection is the 15 coral items, the 6 dive items, the 6 stall '
  + 'items and the Litter-Cyst',
  collection.total, 28);

// The unpublished Luggage is deliberately NOT in that 28: "missing 3 of 31"
// would be counting items nobody can name, which is the same fabrication as a
// made-up number. It gets one row, unknown rather than missing.
check('the unpublished coral gets one row, counted towards nothing',
  (() => {
    const entry = collection.groups[0].corals.find((c) => c.coral.variants == null);
    return [!!entry.pending, entry.rows.length, entry.rows[0].count, entry.rows[0].held];
  })(),
  [true, 1, false, null]);

// ...but it IS wanted, because you certainly need to dive for the coral, and
// counting how many needs no name at all.
check('and it still counts towards how many corals are worth diving for',
  collection.coralsWanted, 6);

check('the ships and the Fate items are listed but never counted',
  collection.groups.filter((g) => g.key === 'ships' || g.key === 'fate')
    .every((g) => g.rows.every((r) => !r.count)), true);

check('the Amber does not count until the Litter-Cyst it replaces is yours',
  collection.groups.find((g) => g.key === 'bride').rows.map((r) => [r.name, r.count]),
  [['Weeping Litter-Cyst', true], ['Nodule of Fecund Amber', false]]);

check('two held, twenty-six still missing, nothing unknown',
  [collection.missing, collection.unknown], [26, 0]);

check('the two it knows you have are the ones on the Possessions list',
  collection.groups.flatMap((g) => (g.rows || g.corals.flatMap((c) => c.rows)))
    .filter((r) => r.held).map((r) => r.name),
  ['Gossamer Palms', 'Wrecking Boots']);

check('a coral in hand plus Sights in the right band is something to do NOW',
  collection.ready.map((r) => r.name).includes('Mournclimber’s Wraps'), true);

check('...but not the variant whose band your Sights is nowhere near',
  collection.ready.map((r) => r.name).includes('Loomweavers'), false);

check('with 260 Favour the stall items you can afford are ready too',
  collection.ready.filter((r) => r.how.includes('Island Stalls')).map((r) => r.name),
  ['A Cured Jillyfleur Cloak', 'Nuncian Pocket Watch', 'Semi-Automated Mary Lloyd',
    'A Faceted Decanter of Drownie Effluvia', 'Scrimshander Carving Knife',
    'A Submerged Rector', 'Keelgraspers', 'Sun-Seared Silken Gloves', 'Inquisitive Lamp-cat',
    'The Forsaken Crown of a Grand Devil', 'Corpulent Carriage']);

check('...and on 60 Favour only the two 50-Favour items are within reach',
  api.fotzCollection({ values: new Map([['Thalassic Favour', 60]]), held: new Map() })
    .ready.map((r) => r.name),
  ['A Cured Jillyfleur Cloak', 'Wrecking Boots']);

check('the Sights reading picks out the Pirate-Poet\'s band',
  [collection.sights, collection.sightsBand], [40, 1]);

check('a spare Wrecking Boots is counted as a spare, not as a second item',
  collection.groups.find((g) => g.key === 'dive').rows
    .find((r) => r.name === 'Wrecking Boots').spare, 1);

// --- the ledger ------------------------------------------------------------

const ledger = api.fotzLedger(state);

check('treasures are totalled at the Fruit Market\'s prices',
  ledger.rows.map((r) => [r.name, r.count, r.subtotal]),
  [['Witch-Stone', 10, 100], ['Sodden Mass', 2, 200], ['Long-Lost Zee Trunk', 1, 200]]);

check('a spare piece of equipment is worth its trade-in value',
  ledger.spares.map((r) => [r.name, r.count, r.subtotal]),
  [['Wrecking Boots', 1, 100]]);

check('the total is the treasures plus the spares', ledger.total, 600);

check('an unread Possessions list is admitted rather than totalled as zero',
  (() => {
    qualityLis = [];
    ownedEls = [];
    store.clear();
    const empty = api.fotzLedger(api.readFotzState());
    return [empty.known, empty.total];
  })(), [false, 0]);

// --- the collection with nothing read -------------------------------------

check('with no Possessions read, nothing is "missing" and everything is unknown',
  (() => {
    const blank = api.fotzCollection(null);
    return [blank.total, blank.missing, blank.unknown];
  })(), [28, 0, 28]);

// --- three features, one corner -------------------------------------------

check('no card name is in two of the three tables',
  (() => {
    const all = [
      ...api.SPITE_CARDS.map((c) => c.name),
      ...api.ZEE_CARDS.map((c) => c.name),
      ...api.FOTZ_CARDS.map((c) => c.name),
    ].map(api.normalizeName);
    return all.length - new Set(all).size;
  })(), 0);

check('squashing punctuation collides no two festival cards',
  new Set(api.FOTZ_CARDS.map((c) => api.normalizeName(c.name))).size, api.FOTZ_CARDS.length);

check('punctuation and case don\'t matter when matching a card name',
  ['Among the Deep-Fish', 'among the deep fish', 'AMONG THE DEEP-FISH!']
    .map((n) => !!api.lookupFotzCard(n)),
  [true, true, true]);

check('a card from anywhere else in London is not ours',
  api.lookupFotzCard('A Stroll around the Hill'), null);

check('exactly the two generic names are gated on knowing where you are',
  api.FOTZ_CARDS.filter((c) => c.strict).map((c) => c.name),
  ['Old Wounds', 'Easy Pickings']);

// --- the depth setting -----------------------------------------------------

check('the depth defaults to unknown', api.fotzDepth(), { depth: null, source: null });

check('setting it in the panel is remembered, and clearing it goes back to auto',
  (() => {
    api.fotzSetDepth(4);
    const set = api.fotzDepth();
    api.fotzSetDepth(null);
    const cleared = api.fotzDepth();
    return [set, cleared];
  })(),
  [{ depth: 4, source: 'set' }, { depth: null, source: null }]);

check('a live Full Fathom Five beats what you set, because it cannot be stale',
  (() => {
    api.fotzSetDepth(2);
    qualityLis = [qualityLi('Full Fathom Five', 5)];
    const got = api.fotzDepth();
    qualityLis = [];
    api.fotzSetDepth(null);
    return got;
  })(),
  { depth: 5, source: 'quality' });

check('a nonsense depth is refused rather than trusted',
  (() => {
    session.set('fl-ux-fotz-depth', '9');
    const got = api.fotzDepth();
    session.delete('fl-ux-fotz-depth');
    return got;
  })(), { depth: null, source: null });

// --- Supplication on the Shore --------------------------------------------
//
// Week one's other half. All five options pay the same 4 CP, so the table is
// really a lookup from "which stat am I best at" to "which option" — and a
// wrong stat here sends someone down their worst attribute for a dozen
// actions, which is exactly the sort of transcription slip that is invisible
// in a diff.

check('the five supplication options, with their item and their attribute',
  api.FOTZ_SUPPLICATION.map((o) => [o.text, o.gain, o.stat]),
  [
    ['Construct toy boats to scuttle on the reef', 'Zee-Ztory', 'Shadowy'],
    ['Sacrifice landed victuals to the zee', 'Cryptic Clue', 'Watchful'],
    ['Gather flotsam for the King-in-Coral', 'Memory of Distant Shores', 'Watchful'],
    ['Perform in a Mutton Island mystery play', 'Maniac’s Prayer', 'Persuasive'],
    ['Assist in the preparation of a well-rite', 'Tale of Terror!!', 'Dangerous'],
  ]);

check('every attribute named has a glyph and a colour to render with',
  api.FOTZ_SUPPLICATION.every((o) => !!(api.FOTZ_STATS[o.stat]
    && api.FOTZ_STATS[o.stat].icon && api.FOTZ_STATS[o.stat].color)), true);

check('all four attributes are covered, so no stat leaves you without an option',
  Object.keys(api.FOTZ_STATS).filter((s) => !api.FOTZ_SUPPLICATION.some((o) => o.stat === s)),
  []);

// The pyramid. These are the numbers the guide's own optimum table is built
// on — it reads 5 (6 Act), 6 (8), 7 (9), 8 (11), 9 (14), 10 (16), 11 (19) —
// so the ladder is checked against the guide rather than against itself.
check('the Devotion ladder matches the guide, action for action',
  api.fotzDevotionLadder().map((r) => [r.level, r.cp, r.actions, r.dive]),
  [
    [5, 15, 4, 6],
    [6, 21, 6, 8],
    [7, 28, 7, 9],
    [8, 36, 9, 11],
    [9, 45, 12, 14],
    [10, 55, 14, 16],
    [11, 66, 17, 19],
  ]);

check('the minimum to dive at all is 4 actions, and the cap is 17',
  [api.fotzDevotionLadder()[0].actions,
    api.fotzDevotionLadder()[api.fotzDevotionLadder().length - 1].actions],
  [4, 17]);

check('counting up from where you already are costs only the difference',
  [api.fotzActionsToDevotion(0, 5), api.fotzActionsToDevotion(5, 8),
    api.fotzActionsToDevotion(8, 8), api.fotzActionsToDevotion(9, 5)],
  // 15 CP, then 36-15=21 CP, then nothing, and never a negative for going down
  [4, 6, 0, 0]);

check('an unknown Devotion asks for no actions rather than guessing at some',
  api.fotzActionsToDevotion(null, 10), 0);

check('where to stop depends on how many corals you still need',
  [5, 3, 2, 1, 0].map((n) => api.fotzDevotionAdvice(n).level),
  // three or more: dive cheap and often. Then 7, then 8. None: it's a Favour run.
  [5, 5, 7, 8, 10]);

check('every piece of advice explains itself',
  [0, 1, 2, 3].every((n) => !!api.fotzDevotionAdvice(n).why), true);

// --- what is still down there, by depth ------------------------------------
//
// A dive commits you to a depth and pays one reward, so "what am I missing"
// and "how deep should I go" are different questions. The one that costs
// people items is the second: some uniques are only SHALLOW, and diving past
// them throws them away for that dive.

const nothingHeld = { has: () => false, bride: false, sig: 'none' };
const everythingHeld = { has: () => true, bride: true, sig: 'all' };

check('currency-only cards never appear — they are the whole point of the filter',
  api.fotzUniquesByDepth(nothingHeld)
    .flatMap((row) => row.entries.map((e) => e.card))
    .filter((name) => ['A Cabin-Fragment', 'Easy Pickings', 'Unlucky Prisoner'].includes(name)),
  []);

check('the equipment turns up at exactly the depths the card table gives it',
  api.fotzUniquesByDepth(nothingHeld).map((row) => [
    row.depth,
    row.entries.filter((e) => !e.coral && !e.bride).map((e) => e.label),
  ]),
  [
    [1, ['A Cured Jillyfleur Cloak']],
    [2, ['Wrecking Boots', 'A Cured Jillyfleur Cloak', 'Nuncian Pocket Watch']],
    [3, ['Wrecking Boots', 'A Faceted Decanter of Drownie Effluvia', 'Nuncian Pocket Watch']],
    [4, ['Semi-Automated Mary Lloyd', 'A Faceted Decanter of Drownie Effluvia',
      'Nuncian Pocket Watch']],
    [5, ['Semi-Automated Mary Lloyd', 'A Faceted Decanter of Drownie Effluvia',
      'Scrimshander Carving Knife']],
  ]);

check('the Bride is at the bottom and nowhere else',
  api.fotzUniquesByDepth(nothingHeld)
    .filter((row) => row.entries.some((e) => e.bride)).map((row) => row.depth),
  [5]);

// The mark that matters: this is the last depth you can still take it.
check('"last chance" lands on the depth an item drops out after',
  api.fotzUniquesByDepth(nothingHeld).flatMap((row) => row.entries
    .filter((e) => e.last && e.to < 5)
    .map((e) => [row.depth, e.label])),
  [
    [2, 'A Cured Jillyfleur Cloak'],
    [3, 'Wrecking Boots'],
    [4, 'Nuncian Pocket Watch'],
  ]);

check('and nothing is marked "last chance" at the bottom, where nothing is lost',
  api.fotzUniquesByDepth(nothingHeld)[4].entries.filter((e) => e.last && e.to < 5), []);

// ...with one exception, and it is the right one: the coral whose three items
// are not published cannot be "held", because there is no name to hold. It
// stays listed however much you own, which is the useful answer — you do still
// need to dive for it.
check('what you already hold drops out of every depth, bar the unpublished coral',
  api.fotzUniquesByDepth(everythingHeld)
    .map((row) => row.entries.map((e) => e.label)),
  [
    ['Rust-Eaten Ration'], ['Rust-Eaten Ration'], ['Rust-Eaten Ration'],
    ['Rust-Eaten Ration'], ['Rust-Eaten Ration'],
  ]);

check('holding one thing removes only that thing',
  (() => {
    const held = { has: (n) => n === 'Scrimshander Carving Knife', bride: false, sig: 'x' };
    return api.fotzUniquesByDepth(held)[4].entries.map((e) => e.label);
  })(),
  // depth 5, minus the Knife: the six corals, the Mary Lloyd, the Decanter, the Bride
  ['Grasping Coral', 'Gorgonian Reef-Rock', 'Barnacled Headpiece', 'Spinebound Oddity',
    'Pedestrian Polyp', 'Rust-Eaten Ration', 'Semi-Automated Mary Lloyd',
    'A Faceted Decanter of Drownie Effluvia', 'Discovered: the Pentamerous Bride']);

check('an unread Possessions list yields nothing, rather than "you need everything"',
  api.fotzUniquesByDepth(null).flatMap((row) => row.entries), []);

// The corals are at every depth, so listing them five times says nothing.
check('the corals are split off and stated once',
  (() => {
    const split = api.fotzSplitUniques(api.fotzUniquesByDepth(nothingHeld));
    return [
      split.everywhere.map((e) => e.label),
      split.byDepth.map((row) => row.entries.length),
    ];
  })(),
  [
    ['Grasping Coral', 'Gorgonian Reef-Rock', 'Barnacled Headpiece', 'Spinebound Oddity',
      'Pedestrian Polyp', 'Rust-Eaten Ration'],
    // and what is left per depth is the depth-specific stuff only
    [1, 3, 3, 3, 4],
  ]);

check('the unpublished coral is flagged, so nothing prints "×1 of 3 left"',
  api.fotzUniquesByDepth(nothingHeld)[0].entries
    .filter((e) => e.pending).map((e) => [e.label, e.missing]),
  [['Rust-Eaten Ration', ['Luggage']]]);

check('a coral carries which of its variants are still missing',
  (() => {
    const held = { has: (n) => n === 'Loomweavers' || n === 'Gossamer Palms', bride: false, sig: 'x' };
    const split = api.fotzSplitUniques(api.fotzUniquesByDepth(held));
    return split.everywhere.find((e) => e.label === 'Grasping Coral').missing;
  })(),
  ['Mournclimber’s Wraps']);

// --- badging the branches in the game --------------------------------------
//
// The panel table is reference; this is the part you actually read while
// playing, and it is the only feature in the script that decorates a
// storylet's OPTIONS rather than cards. The markup is from a real capture
// (2026-09-03) — `h2.branch__title` inside `div.media.branch.media--branch`.
//
// It matters because you do not get to choose freely: every option is gated on
// a window of Airs of a Barren Zee, taking one re-rolls Airs, and so usually
// only two of the five are in front of you. "Which of these matches my best
// stat" is a question about the screen, not about the table.

check('the Airs window each option is offered in, from the five option pages',
  api.FOTZ_SUPPLICATION.map((o) => [o.stat, o.airs]),
  [
    ['Shadowy', '0–40'],
    ['Watchful', '20–60'],
    ['Watchful', '40–80'],
    ['Persuasive', '60–100'],
    ['Dangerous', '0–20 or 80+'],
  ]);

// The game showed its own requirement icons for two of these, and they agree
// with the wiki exactly — which is what makes the other three trustworthy.
// Verbatim from the capture:
//   "You unlocked this with Airs of a Barren Zee 88 (you needed 60-100)"
//   "You unlocked this with Airs of a Barren Zee 88 (you needed anything
//    outside of 21-79)"
check('the two windows the game stated itself match what was transcribed',
  [api.FOTZ_SUPPLICATION.find((o) => o.text.includes('mystery play')).airs,
    api.FOTZ_SUPPLICATION.find((o) => o.text.includes('well-rite')).airs],
  ['60–100', '0–20 or 80+']);

check('a supplication option is badged with the attribute it scales off',
  ['Construct toy boats to scuttle on the reef', 'Sacrifice landed victuals to the zee',
    'Perform in a Mutton Island mystery play', 'Assist in the preparation of a well-rite']
    .map((n) => api.fotzBranchSpec(api.lookupFotzBranch(n)).text),
  ['🗝 Shadowy', '👁 Watchful', '🎭 Persuasive', '⚔ Dangerous']);

check('and coloured by it, in the darker weight a filled badge needs',
  api.fotzBranchSpec(api.lookupFotzBranch('Sacrifice landed victuals to the zee')).color,
  api.FOTZ_STATS.Watchful.badge);

check('the two badge weights are different, or one of the two is illegible',
  Object.keys(api.FOTZ_STATS).every((s) => api.FOTZ_STATS[s].badge !== api.FOTZ_STATS[s].color),
  true);

check('the tooltip carries the item, the Devotion and the Airs window',
  (() => {
    const t = api.fotzBranchSpec(api.lookupFotzBranch('Gather flotsam for the King-in-Coral')).title;
    return [t.includes('Memory of Distant Shores'), t.includes('+4 CP'), t.includes('40–80')];
  })(), [true, true, true]);

check('the two branches that raise no Devotion are labelled, not scored',
  ['Speak to the Custodial Chef', 'Seek out one of the Fathomking’s servants']
    .map((n) => api.fotzBranchSpec(api.lookupFotzBranch(n)).text),
  ['free', '7 Fate']);

check('the Fate one says what it actually does, since 11 is otherwise 17 actions',
  /Devotion straight to 11/.test(
    api.fotzBranchSpec(api.lookupFotzBranch('Seek out one of the Fathomking’s servants')).title),
  true);

check('branch names match loosely, since the game may punctuate differently',
  [api.lookupFotzBranch('SPEAK TO THE CUSTODIAL CHEF'),
    api.lookupFotzBranch('Seek out one of the Fathomking\'s servants')]
    .map((o) => !!o),
  // note the second uses a straight apostrophe where the table has a curly one
  [true, true]);

check('an option from some other storylet is not ours',
  api.lookupFotzBranch('Go back'), null);

check('exactly the Chef is gated on knowing which storylet this is',
  api.FOTZ_SUPPLICATION.concat(api.FOTZ_SUPPLICATION_OTHER)
    .filter((o) => o.strict).map((o) => o.text),
  ['Speak to the Custodial Chef']);

// The DOM half, against the four branches the capture actually showed and the
// storylet heading above them — which the game prefixes, so it reads "Fruits
// of the Zee: Supplication on the Shore" rather than the wiki's title.
{
  storyletHeadings = [(() => {
    const head = makeEl('h1');
    head.className = 'media__heading heading heading--2 storylet-root__heading';
    head.childNodes.push({ nodeType: 3, nodeValue: 'Fruits of the Zee: Supplication on the Shore' });
    return head;
  })()];
  branchHeadings = [
    'Speak to the Custodial Chef',
    'Perform in a Mutton Island mystery play',
    'Assist in the preparation of a well-rite',
    'Seek out one of the Fathomking\'s servants',
  ].map(branchHeading);

  api.fotzSupplicationBranches();

  check('every branch on the captured storylet gets a badge, hung AFTER the heading',
    branchHeadings.map((head) => {
      const badge = head.nextElementSibling;
      return badge && badge.className.includes(api.FOTZ_CLASS + '-branch') ? badge.textContent : null;
    }),
    ['free', '🎭 Persuasive', '⚔ Dangerous', '7 Fate']);

  check('...and never inside it, so the heading still reads as the plain option name',
    branchHeadings.map((head) => head.children.length), [0, 0, 0, 0]);

  // It runs on every debounced DOM change, so a second pass must not stack up.
  api.fotzSupplicationBranches();
  api.fotzSupplicationBranches();
  check('running it again badges nothing twice',
    branchHeadings.map((head) => head.parentNode.children.length), [2, 2, 2, 2]);

  // Away from the storylet, the Chef's generic name loses its badge while the
  // distinctive ones keep theirs.
  storyletHeadings = [];
  api.fotzSupplicationBranches();
  check('off the storylet, only the generic name goes unbadged',
    branchHeadings.map((head) => {
      const badge = head.nextElementSibling;
      return badge && badge.className.includes(api.FOTZ_CLASS + '-branch') ? badge.textContent : null;
    }),
    [null, '🎭 Persuasive', '⚔ Dangerous', '7 Fate']);

  branchHeadings = [];
}

// --- the panel actually builds --------------------------------------------
//
// Not a rendering test -- there is no layout engine here -- but the panel is a
// few hundred nodes of table built from every one of the readings above, and
// this is what catches a typo in the branch that only runs when a reading is
// missing. Both states are exercised: a character mid-festival, and one whose
// pages have never been read.

// The stub keeps `textContent` as a plain property, so read the tree the way
// it was built: text nodes carry `nodeValue`, and an element whose text was
// assigned rather than appended (which is what `wikiLink` does) carries it on
// `textContent` with no children to walk.
function textOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.nodeValue;
  const kids = (node.childNodes || []).map(textOf).join(' ');
  return kids.trim() ? kids : String(node.textContent || '');
}

let builtPanel = null;
check('the panel builds for a character mid-festival',
  (() => {
    setCharacter();
    builtPanel = api.PANELS.find((p) => p.id === 'fruits-of-the-zee').render(null);
    qualityLis = [];
    ownedEls = [];
    return !!(builtPanel && builtPanel.children.length);
  })(), true);

// A section wired in but handed nothing renders as silence rather than as an
// error, so check the words actually arrived.
check('...and it really carries the supplication options and the advice',
  (() => {
    const text = textOf(builtPanel);
    return [
      api.FOTZ_SUPPLICATION.every((o) => text.includes(o.text) && text.includes(o.gain)),
      // Devotion 8, no corals held at all -> three or more still wanted -> 5
      text.includes('Stop at Fivefold Devotion 5'),
      text.includes('you are at 8'),
    ];
  })(), [true, true, true]);

check('and for one whose Myself and Possessions have never been read',
  (() => {
    store.clear();
    const node = api.PANELS.find((p) => p.id === 'fruits-of-the-zee').render(null);
    return !!(node && node.children.length);
  })(), true);

// --- registries ------------------------------------------------------------

check('the feature list, in order',
  api.FEATURES.map((f) => f.name),
  ['launcher', 'faction-capture', 'fotz-capture', 'pending-item',
    'spite-card-ratings', 'zee-card-ratings', 'fotz-card-ratings', 'fotz-supplication']);

check('the panel list, in order',
  api.PANELS.map((p) => p.id),
  ['factions', 'zailing', 'fruits-of-the-zee']);

check('every panel has an icon, a label and a render function',
  api.PANELS.every((p) => !!p.icon && !!p.label && typeof p.render === 'function'), true);

// --- the area gate ---------------------------------------------------------

check('the greeting confirms the festival where it names one of its areas',
  ['Mutton Island', 'The Royal Approach', 'Spite', 'Veilgarden'].map((a) => {
    area = a;
    return api.inFotzArea();
  }),
  [true, true, false, false]);

// Both greetings are captures now (2026-09-03), which is what lets the gate
// say NO rather than only YES. Note the game writes the dive area with a
// lower-case "the", where the wiki writes "The Royal Approach" — normalising
// is what makes those the same string, and this is the check that says so.
check('the two captured greetings, exactly as the game writes them',
  ['Mutton Island', 'the Royal Approach'].map((a) => {
    area = a;
    return [api.currentArea(), api.fotzWhere()];
  }),
  [['Mutton Island', 'yes'], ['the Royal Approach', 'yes']]);

check('three answers, and "no" is the one the captures bought',
  ['Mutton Island', 'the Royal Approach', 'Veilgarden'].map((a) => {
    area = a;
    return api.fotzWhere();
  }).concat((() => {
    area = null;
    const got = api.fotzWhere();
    area = 'Mutton Island';
    return [got];
  })()),
  ['yes', 'yes', 'no', 'unknown']);

check('only the dive counts as diving — the island does not',
  ['the Royal Approach', 'The Royal Approach', 'Mutton Island', 'Veilgarden'].map((a) => {
    area = a;
    return api.inDiveArea();
  }).concat((() => {
    area = null;
    const got = api.inDiveArea();
    area = 'Mutton Island';
    return [got];
  })()),
  [true, true, false, false, false]);

// A depth set by hand is kept for the whole tab session, so the moment you
// surface it is not stale but WRONG — the next dive starts at 1. Leaving the
// Royal Approach is what throws it away, and until the mid-dive greeting was
// captured there was no way to notice you had left.
check('a hand-set depth survives while you are still down there',
  (() => {
    area = 'the Royal Approach';
    api.fotzSetDepth(4);
    api.fotzCardRatings();
    return api.fotzDepth();
  })(),
  { depth: 4, source: 'set' });

check('...and is thrown away the moment you surface',
  (() => {
    area = 'Mutton Island';
    api.fotzCardRatings();
    return api.fotzDepth();
  })(),
  { depth: null, source: null });

check('an unreadable greeting is not grounds for discarding it',
  (() => {
    area = null;
    api.fotzSetDepth(3);
    api.fotzCardRatings();
    const got = api.fotzDepth();
    api.fotzSetDepth(null);
    area = 'Mutton Island';
    return got;
  })(),
  { depth: 3, source: 'set' });

// The greeting the gate rests on, verbatim from a capture taken at the
// festival (2026-09-03). This is the record of what FL actually emits — keep
// it verbatim, and if the wording ever moves, fix the regex against it.
check('the captured festival greeting reads as Mutton Island',
  (() => {
    area = 'Mutton Island';
    return api.currentArea();
  })(),
  'Mutton Island');

// The wide layout's VISIBLE greeting splits that one sentence across three
// paragraphs, so the regex above cannot match it — but the area has an element
// to itself there. Same capture.
check('and the visible sidebar greeting is read from its own element, comma and all',
  (() => {
    area = null; // no accessible sidebar at all
    visibleArea = 'Mutton Island,';
    const got = api.currentArea();
    visibleArea = null;
    return got;
  })(),
  'Mutton Island');

check('with neither source there is no area, rather than a made-up one',
  (() => {
    area = null;
    visibleArea = null;
    return api.currentArea();
  })(),
  null);

area = 'Mutton Island';

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
