// Ad-hoc test for FallenLondon/ux-enhancers.js's Factions panel.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// rich enough to actually BUILD the panel, and pulls out the internals.
//
// Three jobs.
//
//  1. Pin the transcribed wiki data -- the Faction Item table and the
//     three-item Renown ladder. A typo there is invisible in-game until you
//     have already spent Favours on the wrong thing.
//  2. Pin the Myself-tab scrape. The `<li class="quality-item">` snippets in
//     QUALITY_HTML below are VERBATIM from a real /myself page (captured in
//     both the wide and the narrow layout, which are byte-identical for
//     qualities). They are the awkward ones on purpose: "Renown: Society
//     34/55 -  Known in the homes..." has a double space after the dash, and
//     "Renown: Rubbery Men 12/55 - !kathakathoti!" has punctuation where a
//     description should be. Both are why the parser strips the img's `alt`
//     off the front rather than trying to find where the name ends.
//  3. Prove an unknown value never renders as a zero. "0 Favours" and "we
//     couldn't tell" look identical on screen otherwise, and Favours really
//     can be 0 -- so the zero has to be earned, and the filtered-list case is
//     exactly where it isn't.
//
// The wiki numbers come from Factions (Guide) on fallenlondon.wiki.
//
//   node FallenLondon/test/ux-factions.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// --- verbatim markup from a real https://www.fallenlondon.com/myself --------

const QUALITY_HTML = [
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="133829"><img alt="Favours: Bohemians" class="media__object" src="//images.fallenlondon.com/icons/bohogirl1small.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Favours: Bohemians 3/7</span></span><p class="quality-item__description">You\'ve done somebody a good turn. Now, they\'re in your debt.</p></div></li>',
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="133834"><img alt="Renown: Society" class="media__object" src="//images.fallenlondon.com/icons/salon2small.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Renown: Society 34/55 -  Known in the homes of London\'s noblest families</span></span><p class="quality-item__description">London\'s elite don\'t see everyone, but they see you.</p></div></li>',
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="126001"><img alt="Renown: Rubbery Men" class="media__object" src="//images.fallenlondon.com/icons/rubberymansmall.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Renown: Rubbery Men 12/55 - !kathakathoti!</span></span><p class="quality-item__description">You have cultivated a familiarity with the Rubbery Men of Fallen London.</p></div></li>',
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="133044"><img alt="Favours: The Great Game" class="media__object" src="//images.fallenlondon.com/icons/pawnsmall.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Favours: The Great Game 5/7</span></span><p class="quality-item__description">You\'ve done somebody a good turn. Now, they\'re in your debt.</p></div></li>',
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="598"><img alt="Connected: Benthic" class="media__object" src="//images.fallenlondon.com/icons/universitysmall.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Connected: Benthic 17 - Associated</span></span><p class="quality-item__description">Colleagues and acquaintances in Fallen London\'s radical, secular seat of higher learning.</p></div></li>',
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="599"><img alt="Connected: Summerset" class="media__object" src="//images.fallenlondon.com/icons/universitysmall.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Connected: Summerset 2 - Acquainted</span></span><p class="quality-item__description">Your standing in Fallen London\'s wealthy, Anglican university college.</p></div></li>',
  '<li class="quality-item"><div class="icon icon--circular quality-item__icon" data-branch-id="284"><img alt="Connected: The Widow" class="media__object" src="//images.fallenlondon.com/icons/widowsmall.png"></div><div class="quality-item__body"><span class="js-item-name item__name quality-item__name"><span>Connected: The Widow 20 - Familiar</span></span><p class="quality-item__description">Half London\'s contraband bears her mark.</p></div></li>',
];

// Verbatim from a real /possessions page. Three shapes, and all three must
// count as owned -- the third especially: miss the equipped slot and anyone
// WEARING their Renown item is told they don't have it.
const OWNED_HTML = [
  // inventory (note the "× 2" quantity that has to come off the name)
  '<div class="icon icon--inventory icon--emphasize icon--usable" data-quality-id="755"><div aria-label="Ornate Typewriter × 2; A Fine, Elegant and Robust Feat of Mechanical Engineering! Use this to increase your Renown: Bohemians quality by spending Favours: Bohemians."></div></div>',
  // available to equip
  '<div class="icon icon--emphasize icon--available-item" data-quality-id="132807"><div aria-label="Bully Belvedere; Dangerous +4; A classic from a vanished Ladybones Road tailor."></div></div>',
  '<div class="icon icon--emphasize icon--available-item" data-quality-id="126352"><div aria-label="Amber Cello; Persuasive +4; Steel ribs and amber fittings give it a deep and echoing resonance."></div></div>',
  // currently equipped
  '<div data-quality-id="340" class="equipped-item"><div aria-label="Patent Scrutinizer Deluxe!; Watchful +7; Dangerous -1; If it exists, it is visible through this."></div></div>',
];

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    nodeType: 1,
    childNodes: [],
    children: [],
    parentNode: null,
    style: { cssText: '' },
    dataset: {},
    className: '',
    attrs: {},
    getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n) ? this.attrs[n] : null; },
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      if (child.nodeType === 1) this.children.push(child);
      return child;
    },
    addEventListener() {},
    dispatchEvent() { return true; },
    querySelector(sel) { return this.all.slice(1).find((e) => matches(e, sel)) || null; },
    get text() {
      return this.childNodes.map((n) => (n.nodeType === 3 ? n.nodeValue : n.text)).join('');
    },
    get all() {
      return this.children.reduce((acc, c) => acc.concat(c.all), [this]);
    },
  };
  let textContent = '';
  Object.defineProperty(el, 'textContent', {
    get() { return textContent || el.text; },
    set(v) {
      textContent = String(v);
      if (v === '') { el.childNodes = []; el.children = []; }
      else el.childNodes = [{ nodeType: 3, nodeValue: String(v), text: String(v) }];
    },
  });
  return el;
}

// Enough of a selector engine for the selectors this script actually uses:
// "tag.class", ".class", "img[alt]", "input.class", "#id .a b[attr^=...]".
function matches(el, sel) {
  return sel.split(',').some((one) => {
    const parts = one.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    const m = last.match(/^([a-z]+)?((?:[.#][\w-]+)*)(?:\[([\w-]+)(?:\^?=["']?([^"'\]]*)["']?)?\])?$/);
    if (!m) return false;
    if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
    for (const tok of (m[2] || '').match(/[.#][\w-]+/g) || []) {
      if (tok[0] === '.' && !String(el.className).split(/\s+/).includes(tok.slice(1))) return false;
      if (tok[0] === '#' && el.id !== tok.slice(1)) return false;
    }
    if (m[3]) {
      const v = el.getAttribute(m[3]);
      if (v == null) return false;
      if (m[4] != null && m[4] !== '' && !v.startsWith(m[4])) return false;
    }
    return true;
  });
}

// A deliberately dumb parser: it understands only the flat <li>/<div>/<span>/
// <img>/<p> shape the captured markup has. Its job is to keep the VERBATIM
// snippets in this file as the record of what FL emits.
function parseLi(html) {
  const root = makeEl('li');
  root.className = 'quality-item';
  const img = makeEl('img');
  const alt = html.match(/<img alt="([^"]*)"/);
  if (alt) img.attrs.alt = alt[1];
  root.appendChild(img);
  const name = makeEl('span');
  name.className = 'js-item-name item__name quality-item__name';
  const inner = html.match(/quality-item__name"><span>([\s\S]*?)<\/span>/);
  name.textContent = inner
    ? inner[1].replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'")
    : '';
  root.appendChild(name);
  return root;
}

// Mirrors the real shape closely enough to exercise the click path: the
// wrapper carries data-quality-id, the labelled child is the [role=button] FL
// binds its handler to, and clicking it is recorded.
const clicks = [];
function parseOwned(html) {
  const root = makeEl('div');
  const id = html.match(/data-quality-id="(\d+)"/);
  if (id) root.attrs['data-quality-id'] = id[1];
  const inner = makeEl('div');
  const label = html.match(/<div aria-label="([^"]*)"/);
  if (label) inner.attrs['aria-label'] = label[1];
  inner.attrs.role = 'button';
  inner.click = () => { clicks.push(itemName(label ? label[1] : '')); };
  inner.scrollIntoView = () => {};
  root.appendChild(inner);
  return root;
}
function itemName(label) {
  return String(label).split(';')[0].replace(/\s*[×x]\s*\d+\s*$/, '').trim();
}

let qualityLis = QUALITY_HTML.map(parseLi);
let ownedEls = OWNED_HTML.map(parseOwned);
let searchValue = '';
let area = 'Spite';
const store = new Map();
const session = new Map();
const navClicks = [];
let navLink = null;

const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll(sel) {
    if (sel === 'li.quality-item') return qualityLis;
    if (sel === '[data-quality-id]') return ownedEls;
    return [];
  },
  querySelector(sel) {
    if (sel === 'input.input--item-search') {
      const i = makeEl('input');
      i.value = searchValue;
      return i;
    }
    if (sel.includes('/profile/')) {
      const a = makeEl('a');
      a.attrs.href = '/profile/TheFairUnknown';
      return a;
    }
    if (sel.includes('/possessions')) return navLink;
    if (sel === '[data-quality-id]') return ownedEls[0] || null;
    if (sel.includes('.welcome')) {
      const h1 = makeEl('h1');
      h1.textContent = "It's TheFairUnknown! Welcome to " + area + ', delicious friend!';
      return h1;
    }
    return null;
  },
  // A real lookup, not a stub returning null: the launcher's whole idempotency
  // rests on this, and a null-returning stub would let a double mount pass.
  getElementById: (id) => fakeDoc.body.all.find((el) => el.id === id) || null,
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
const fakeStorage = fakeStore(store);
const fakeSession = fakeStore(session);

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { FACTIONS, RENOWN_TIERS, PANELS, FEATURES, readFactionState,'
    + ' renderFactionsPanel, factionRow, wikiHref, mountLauncher, LAUNCHER_ID,'
    + ' parseQualityItem, readQualities, factionsFromQualities, captureFactionState,'
    + ' characterName, CACHE_KEY, ITEMS_KEY, ageText, readPossessions, itemNameFromLabel,'
    + ' autoRefreshEnabled, setAutoRefresh, stateIsFresh, currentArea,'
    + ' itemStatus, tierAt, readyItems, fullFavours, findItemNode, clickItem, openItem,'
    + ' runPendingItem, readPending, PENDING_KEY }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console,
  URLSearchParams, fakeStorage, fakeSession,
  { assign: (p) => { navClicks.push('assign:' + p); } },
  class { constructor(t) { this.type = t; } });

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- the transcribed table -------------------------------------------------

check('twelve Renown factions plus the two Connected ones that still have an item',
  [api.FACTIONS.filter((f) => !f.connected).length,
   api.FACTIONS.filter((f) => f.connected).length],
  [12, 2]);

check('each Renown faction has exactly the three-item ladder',
  api.FACTIONS.filter((f) => !f.connected).every((f) => f.items.length === 3), true);

check('the ladder is Renown 10/25/40 for 3/5/7 Favours',
  api.RENOWN_TIERS, [{ at: 10, favours: 3 }, { at: 25, favours: 5 }, { at: 40, favours: 7 }]);

check('the Faction Items match the wiki table',
  api.FACTIONS.map((f) => [f.name, f.item.name, f.item.cost]),
  [
    ['Bohemians', 'Ornate Typewriter', 60],
    ['The Church', 'Tiny Jewelled Reliquary', 40],
    ['Constables', "Antique Constable's Badge", 30],
    ['Criminals', 'Old Bone Skeleton Key', 62.5],
    ['The Docks', 'Engraved Pewter Tankard', 50],
    ['The Great Game', 'Copper Cipher Ring', 40],
    ['Hell', 'Bright Brass Skull', 62.5],
    ['Revolutionaries', 'Red-Feathered Pin', 40],
    ['Rubbery Men', 'Nodule of Pulsating Amber', 100],
    ['Society', "Entry in Slowcake's Exceptionals", 30],
    ['Tomb-Colonies', 'Diary of the Dead', 62.5],
    ['Urchins', 'Rookery Password', 62.5],
    ['University (Benthic & Summerset)', 'Endowment of a University Fellowship', 100],
    ['The Widow', "O'Boyle's Practical Primer in the Various Languages of Nippon, "
      + 'Tartary, Cathay and the Princedoms of the Raj', 30],
  ]);

check('only three shops sell Faction Items',
  [...new Set(api.FACTIONS.map((f) => f.item.shop))].sort(),
  ['Crawcase Cryptics', 'Merrigans Exchange', 'Nikolas Pawnbrokers']);

check('every Renown item names a slot, its stats and where to get it',
  api.FACTIONS.every((f) => f.items.every((i) => i.name && i.slot && i.stats && i.from)), true);

check('each faction\'s Renown 10 item comes off its own London card',
  api.FACTIONS.filter((f) => !f.connected).every((f) => f.items[0].from === 'faction card'), true);

// The guide underlines exactly these three as "will permanently add a card to
// your Upper River deck"; the two `replacesCard` items add one but lock
// another, so they are NOT the same warning and must not be lumped in.
check('exactly the three underlined items carry the Upper River warning',
  api.FACTIONS.flatMap((f) => f.items).filter((i) => i.upperRiver).map((i) => i.name),
  ['The DF', 'Chelatic Mitten', 'Your Very Own Bandages!']);

check('the two deck-neutral items are marked separately, not as a warning',
  api.FACTIONS.flatMap((f) => f.items).filter((i) => i.replacesCard).map((i) => i.name),
  ['Pair of Defenestrating Boots', 'Language of Laces']);

check('faction keys are unique (they key the live-value lookup)',
  new Set(api.FACTIONS.map((f) => f.key)).size, api.FACTIONS.length);

// --- parsing the real Myself markup ----------------------------------------

check('a plain Favours quality gives its level and its cap',
  api.parseQualityItem(qualityLis[0]),
  { quality: 'Favours: Bohemians', level: 3, cap: 7 });

// The trap this parser exists for: the level and a free-text suffix live in
// the SAME string as the name, with no separator you can trust.
check('a Renown quality with a double-spaced descriptive suffix still parses',
  api.parseQualityItem(qualityLis[1]),
  { quality: 'Renown: Society', level: 34, cap: 55 });

check('...and one whose suffix is punctuation ("!kathakathoti!") too',
  api.parseQualityItem(qualityLis[2]),
  { quality: 'Renown: Rubbery Men', level: 12, cap: 55 });

check('a Connected quality has a level but no cap',
  api.parseQualityItem(qualityLis[4]),
  { quality: 'Connected: Benthic', level: 17, cap: null });

// Without the alt there is nothing to strip, so the fallback has to find where
// the name ends on its own -- anchored on the three prefixes so it can't be
// fooled by a quality whose name contains a number.
const noAlt = parseLi(QUALITY_HTML[1].replace(/<img alt="[^"]*"/, '<img'));
check('with no alt attribute the text-only fallback gets the same answer',
  api.parseQualityItem(noAlt), { quality: 'Renown: Society', level: 34, cap: 55 });

check('a quality that is not a faction is not mistaken for one',
  api.parseQualityItem(parseLi(
    '<li class="quality-item"><img><span class="quality-item__name"><span>'
    + 'A Person of Some Importance 3</span></span></li>')),
  null);

check('the whole list reads back, keyed by quality name',
  [...api.readQualities().values.keys()],
  ['Favours: Bohemians', 'Renown: Society', 'Renown: Rubbery Men', 'Favours: The Great Game',
   'Connected: Benthic', 'Connected: Summerset', 'Connected: The Widow']);

// --- parsing the real Possessions markup -----------------------------------

check('a quantity is not part of the item name',
  api.itemNameFromLabel('Ornate Typewriter \u00d7 2; A Fine, Elegant and Robust Feat'),
  'Ornate Typewriter');

check('everything after the first semicolon is description, not name',
  api.itemNameFromLabel('Bully Belvedere; Dangerous +4; A classic from a vanished tailor.'),
  'Bully Belvedere');

check('inventory, the equip drawer AND the worn slot all count as owned',
  [...api.readPossessions()].sort(),
  ['amber cello', 'bully belvedere', 'ornate typewriter', 'patent scrutinizer deluxe']);

check('the player\'s own name comes off the screen-reader greeting',
  api.characterName(), 'TheFairUnknown');

// --- turning qualities into faction rows -----------------------------------

const unfiltered = api.factionsFromQualities(api.readQualities());

check('a faction whose qualities are on screen gets its real numbers',
  [unfiltered.society, unfiltered.bohemians],
  [{ renown: 34, favours: 0, favoursCap: 7 },
   { renown: 0, favours: 3, favoursCap: 7 }]);

// FL simply doesn't render a quality you have none of, so on a complete list
// "absent" really does mean 0 -- this is the one place a zero is earned.
check('with the full list showing, an absent quality is a real 0',
  unfiltered.urchins, { renown: 0, favours: 0, favoursCap: 7 });

check('the University reports both of its Connected levels, in order',
  [unfiltered.university.connected, unfiltered.widow.connected], [[17, 2], [20]]);

check('factionsFromQualities alone never invents claimed items',
  api.FACTIONS.every((f) => !unfiltered[f.key] || unfiltered[f.key].claimed === undefined), true);

// ...and the one place it is NOT earned. With the search box in use the list
// on screen is a subset, so absent means "not shown", not "you have none".
searchValue = 'bohem';
const filtered = api.factionsFromQualities(api.readQualities());
check('while the search box is filtering, absent stays unknown instead of 0',
  [filtered.bohemians, filtered.urchins],
  [{ favours: 3, favoursCap: 7 }, undefined]);
searchValue = '';

// --- the cache -------------------------------------------------------------
//
// Nothing is called here to make this happen: loading the script on a page
// with a quality list runs the capture on its own first scan, which is exactly
// how it behaves in the game. (It will not re-scrape an unchanged list, so
// clearing the cache and calling it again would test nothing.)

check('merely being on the tab banks both halves',
  [store.has(api.CACHE_KEY), store.has(api.ITEMS_KEY)], [true, true]);

const banked = JSON.parse(store.get(api.CACHE_KEY));
check('the record is stamped with the character it belongs to',
  [banked.v, banked.character, banked.partial], [1, 'TheFairUnknown', false]);

check('the items record banks the normalised names it saw',
  JSON.parse(store.get(api.ITEMS_KEY)).owned.sort(),
  ['amber cello', 'bully belvedere', 'ornate typewriter', 'patent scrutinizer deluxe']);

// --- composing qualities with possessions ----------------------------------

const live = api.readFactionState();
check('on the tab the panel reads live, not from the cache',
  [live.live, live.itemsLive, live.values.get('society').renown], [true, true, 34]);

// Held / not held, per tier, in RENOWN_TIERS order.
check('a Renown item you own reads as held and the rest as not',
  [live.values.get('constables').claimed, live.values.get('bohemians').claimed],
  [[true, false, false], [false, false, false]]);

check('owning the Faction Item itself is reported too',
  [live.values.get('bohemians').hasItem, live.values.get('urchins').hasItem], [true, false]);

// Away from these tabs there is no list to read, so the banked answer is
// offered instead -- and flagged as not live, which is what makes the panel
// label it with its age instead of passing it off as current.
const savedLis = qualityLis;
const savedOwned = ownedEls;
qualityLis = [];
ownedEls = [];
const stale = api.readFactionState();
check('elsewhere in London both halves come back banked and marked stale',
  [stale.live, stale.itemsLive, stale.values.get('society').renown,
   stale.values.get('constables').claimed[0], stale.character],
  [false, false, 34, true, 'TheFairUnknown']);

// Someone else's numbers are worse than none.
store.set(api.CACHE_KEY, JSON.stringify({ ...banked, character: 'SomeoneElse' }));
store.set(api.ITEMS_KEY, JSON.stringify({
  ...JSON.parse(store.get(api.ITEMS_KEY)), character: 'SomeoneElse',
}));
check('a cache belonging to another character is ignored', api.readFactionState(), null);

store.clear();
check('with nothing on screen and no cache the panel gets nothing at all',
  api.readFactionState(), null);

check('ages read as English', [api.ageText(Date.now() - 90 * 1000),
  api.ageText(Date.now() - 3 * 3600 * 1000)], ['2 minutes ago', '3 hours ago']);

// --- when a refresh is worth the trouble -----------------------------------

check('live data is fresh, so opening the panel starts no refresh',
  api.stateIsFresh({ live: true, itemsLive: true }), true);
check('a banked answer from an hour ago is not',
  api.stateIsFresh({ at: Date.now() - 3600e3, itemsAt: Date.now() - 3600e3 }), false);
check('half live and half ancient still needs a refresh',
  api.stateIsFresh({ live: true, itemsAt: Date.now() - 3600e3 }), false);
check('nothing at all is not fresh', api.stateIsFresh(null), false);

check('auto-refresh defaults to on and remembers being turned off',
  [api.autoRefreshEnabled(), (api.setAutoRefresh(false), api.autoRefreshEnabled()),
   (api.setAutoRefresh(true), api.autoRefreshEnabled())],
  [true, false, true]);

// --- rendering -------------------------------------------------------------

qualityLis = savedLis;
ownedEls = savedOwned;
const panel = api.renderFactionsPanel();
const text = panel.text;

check('the panel renders without throwing', panel.nodeType, 1);

check('every faction appears in the rendered table',
  api.FACTIONS.every((f) => text.includes(f.name)), true);

check('the Widow\'s unwieldy item is shortened in the cell, not dropped',
  [text.includes("O'Boyle's Practical Primer"), text.includes('Princedoms of the Raj')],
  [true, false]);

check('the live read shows the real values, capped Favours and all',
  [text.includes('34'), text.includes('5/7'), text.includes('17 · 2')],
  [true, true, true]);

// With Possessions read the pips become real: one held, the rest not, and no
// "unknown" dashes left anywhere.
// Held, out of reach, actionable, unknown. The captured character has two
// Renown items and two of Society's tiers unlocked but unaffordable.
check('the pips now say held / not held rather than unknown',
  ['\u25c6', '\u25c7', '!', '\u2013'].map((g) =>
    panel.all.filter((el) => el.tagName === 'A' && el.text === g).length),
  [2, 32, 2, 0]);

check('the Faction Items you own are starred',
  panel.all.filter((el) => el.text === '\u2726').length, 1);

// The whole point, once more, on the rendered output: nothing to read must
// produce no numbers at all.
qualityLis = [];
ownedEls = [];
store.clear();
const empty = api.renderFactionsPanel();
check('with nothing to read the panel says so and offers the Myself tab',
  /Open the/.test(empty.text) && /Myself/.test(empty.text), true);
check('...and not one cell claims a number',
  empty.all.filter((el) => el.tagName === 'TD').some((c) => /\d/.test(c.text)
    && !/\u00a3|\+|Renown \d/.test(c.text)), false);

check('and the items pips go back to unknown, not to "not held"',
  ['\u25c6', '\u25c7', '!', '\u2013'].map((g) =>
    empty.all.filter((el) => el.tagName === 'A' && el.text === g).length),
  [0, 0, 0, 36]);
qualityLis = savedLis;
ownedEls = savedOwned;

// --- is an item within reach? ----------------------------------------------
//
// The four live states, on one tier. This is the arithmetic behind the
// highlight, and getting it wrong would either hide something you could
// collect or send you off for something you can't afford.

const T10 = api.tierAt(0);   // Renown 10, 3 Favours
const T25 = api.tierAt(1);   // Renown 25, 5 Favours

check('the ladder tiers are Renown 10/25/40 for 3/5/7 Favours',
  [0, 1, 2].map((i) => [api.tierAt(i).at, api.tierAt(i).favours]),
  [[10, 3], [25, 5], [40, 7]]);

check('an item you hold is simply claimed',
  api.itemStatus(T10, { claimed: [true], renown: 27, favours: 3 }), 'claimed');

// Bohemians in the fixture: Renown 27, 3 Favours. The 10 is collectable now;
// the 25 is unlocked but two Favours short.
check('Renown reached and the Favours in hand reads as ready',
  api.itemStatus(T10, { claimed: [false], renown: 27, favours: 3 }), 'ready');

check('Renown reached but Favours short is unlocked, not ready',
  api.itemStatus(T25, { claimed: [false, false], renown: 27, favours: 3 }), 'unlocked');

check('exactly enough Favours is enough',
  api.itemStatus(T25, { claimed: [false, false], renown: 27, favours: 5 }), 'ready');

check('Renown one short is still locked',
  api.itemStatus(T25, { claimed: [false, false], renown: 24, favours: 7 }), 'locked');

// The two ways of not knowing, which must never be dressed up as a "no".
check('an unread possession list is unknown, not "not held"',
  api.itemStatus(T10, { renown: 27, favours: 3 }), 'unknown');

check('a known-unheld item with no Renown reading says only that',
  api.itemStatus(T10, { claimed: [false] }), 'unheld');

check('...and with Renown but no Favours reading it is unlocked, never ready',
  api.itemStatus(T10, { claimed: [false], renown: 27 }), 'unlocked');

// The headline list. Built by hand rather than from the capture, because the
// captured character happens to have nothing collectable and the check would
// pass while proving nothing.
const readyNow = api.readyItems({
  values: new Map([
    // Renown past 10 and 25, three Favours: the 10 is collectable, the 25 is
    // two Favours short, the 40 is out of reach.
    ['bohemians', { renown: 27, favours: 3, claimed: [false, false, false] }],
    // Already has the one it could afford.
    ['urchins', { renown: 27, favours: 3, claimed: [true, false, false] }],
    // Renown high enough for all three and the Favours for all three.
    ['hell', { renown: 55, favours: 7, claimed: [false, false, false] }],
    // Nothing read for this one.
    ['society', { renown: 34, favours: 7 }],
  ]),
});
check('the panel can name exactly what is collectable right now',
  readyNow.map((r) => [r.faction.name, r.tier.at]),
  [['Bohemians', 10], ['Hell', 10], ['Hell', 25], ['Hell', 40]]);

check('a faction whose items were never read contributes nothing',
  readyNow.some((r) => r.faction.key === 'society'), false);

check('the real captured character has nothing collectable, and says so',
  api.readyItems(api.readFactionState()), []);

check('nothing to read means nothing claimed to be ready', api.readyItems(null), []);

// The glyph set is deliberately split by whether there is anything to DO. Both
// states whose Renown gate you have passed become exclamation marks; the ones
// you cannot act on stay diamonds and recede.
//
// Bohemians at Renown 27 with 3 Favours is all three at once: the 10 is
// collectable, the 25 is unlocked but two Favours short, the 40 is out of reach.
const readyRow = api.factionRow(api.FACTIONS.find((f) => f.key === 'bohemians'),
  { renown: 27, favours: 3, claimed: [false, false, false] });
const readyPips = readyRow.children[3].children;
check('anything past its Renown gate is an exclamation, not another diamond',
  readyPips.map((el) => el.text), ['!', '!', '\u25c7']);

// Same shape, different weight: fill is what separates "go now" from "nearly".
check('the collectable one is filled dark-on-green',
  [/background:#9ab73c/.test(readyPips[0].style.cssText),
   /color:#17190c/.test(readyPips[0].style.cssText)],
  [true, true]);

check('the Favours-short one is only outlined, in brown',
  [/border:1px solid #8a6d3b/.test(readyPips[1].style.cssText),
   /background:#9ab73c/.test(readyPips[1].style.cssText)],
  [true, false]);

check('and the tooltip says how many Favours are missing',
  /needs 5 Favours, you have 3\./.test(readyPips[1].title), true);

const quietRow = api.factionRow(api.FACTIONS.find((f) => f.key === 'bohemians'),
  { renown: 5, favours: 0, claimed: [false, false, false] });
check('nothing actionable keeps the quiet glyphs',
  quietRow.children[3].children.map((el) => el.text),
  ['\u25c7', '\u25c7', '\u25c7']);

// --- Favours at the cap ----------------------------------------------------
//
// The one thing on the page that is actively costing you something while you
// read it: past 7, every Favour earned is thrown away.

const capped = api.fullFavours({
  values: new Map([
    ['criminals', { favours: 7, favoursCap: 7 }],
    ['docks', { favours: 6, favoursCap: 7 }],
    ['urchins', { favours: 0, favoursCap: 7 }],
    ['hell', { renown: 12 }],                      // Favours not read at all
    ['university', { connected: [17, 2] }],        // no Favours to cap
  ]),
});
check('only a faction actually at the cap is called full',
  capped.map((f) => f.faction.key), ['criminals']);

// Defensive: if FL ever shows a different cap, honour the one it printed
// rather than the hardcoded 7.
check('the cap comes from what was read, not from a constant',
  api.fullFavours({ values: new Map([['urchins', { favours: 5, favoursCap: 5 }]]) })
    .map((f) => [f.favours, f.cap]),
  [[5, 5]]);

check('unread Favours are never reported as full',
  api.fullFavours({ values: new Map([['hell', { renown: 40 }]]) }), []);

check('nothing to read means nothing is full', api.fullFavours(null), []);

// In the row, capped Favours get the same filled treatment as a ready item --
// a plain colour change read as decoration.
const cappedRow = api.factionRow(api.FACTIONS.find((f) => f.key === 'criminals'),
  { renown: 8, favours: 7, favoursCap: 7, claimed: [false, false, false] });
check('a capped Favours cell is a filled badge, not just tinted text',
  [cappedRow.children[2].text,
   /background:#d4761c/.test(cappedRow.children[2].children[0].style.cssText)],
  ['7/7', true]);

const roomRow = api.factionRow(api.FACTIONS.find((f) => f.key === 'criminals'),
  { renown: 8, favours: 6, favoursCap: 7, claimed: [false, false, false] });
check('one short of the cap is plain text',
  [roomRow.children[2].text, roomRow.children[2].children.length], ['6/7', 0]);

// Both edges want the first cell. Ready wins, because when an item is
// collectable AND the Favours are capped they are the same action.
const bothRow = api.factionRow(api.FACTIONS.find((f) => f.key === 'criminals'),
  { renown: 30, favours: 7, favoursCap: 7, claimed: [false, false, false] });
check('a row that is both ready and capped shows the ready edge',
  /#9ab73c/.test(bothRow.children[0].style.cssText), true);
check('a capped row with nothing collectable shows the capped edge',
  /#d4761c/.test(cappedRow.children[0].style.cssText), true);

// --- the use button --------------------------------------------------------

check('an item on the page is found by name, at its clickable element',
  api.findItemNode('Ornate Typewriter').attrs.role, 'button');

check('an item you do not have is not found', api.findItemNode('Rookery Password'), null);

clicks.length = 0;
check('on Possessions, "use" clicks the item straight away',
  [api.openItem('Ornate Typewriter'), clicks], ['clicked', ['Ornate Typewriter']]);
check('and nothing is parked, because nothing had to navigate',
  api.readPending(), null);

// Off the Possessions tab the request is parked and the router link clicked --
// NOT location.assign, which would reload and throw the panel away.
const savedOwned2 = ownedEls;
ownedEls = [];
navLink = makeEl('a');
navLink.click = () => { navClicks.push('link'); };
clicks.length = 0;
navClicks.length = 0;
check('elsewhere it navigates by clicking FL\'s own nav link',
  [api.openItem('Ornate Typewriter'), navClicks], ['navigating', ['link']]);
check('...and parks the request for when the page arrives',
  api.readPending().name, 'Ornate Typewriter');

// Nothing to click yet: the pending runner must not fire on an empty page.
api.runPendingItem();
check('a parked request waits for the page rather than giving up',
  [clicks.length, api.readPending().name], [0, 'Ornate Typewriter']);

// The page arrives.
ownedEls = savedOwned2;
api.runPendingItem();
check('once Possessions renders, the parked click happens exactly once',
  [clicks, api.readPending()], [['Ornate Typewriter'], null]);

api.runPendingItem();
check('and does not fire again on the next scan', clicks.length, 1);

// A request for something you do not own gets abandoned rather than retried
// forever; the search box is filled in so it is obvious what was looked for.
session.set(api.PENDING_KEY, JSON.stringify({ name: 'Rookery Password', at: Date.now() }));
clicks.length = 0;
api.runPendingItem();
check('an item that is not there stops the retry loop',
  [clicks.length, api.readPending()], [0, null]);

// A request left over from another session must not fire much later.
session.set(api.PENDING_KEY, JSON.stringify({ name: 'Ornate Typewriter', at: Date.now() - 60000 }));
check('a stale parked request is dropped, not replayed', api.readPending(), null);

// If there is no nav link at all, fall back to a real navigation.
ownedEls = [];
navLink = null;
navClicks.length = 0;
check('with no router link it falls back to a plain navigation',
  [api.openItem('Ornate Typewriter'), navClicks], ['navigating', ['assign:/possessions']]);
ownedEls = savedOwned2;
session.clear();

// --- the launcher ----------------------------------------------------------

check('the menu offers the Factions and Zailing panels',
  api.PANELS.map((p) => p.id), ['factions', 'zailing']);

check('the registry holds the launcher, both background jobs and the card ratings',
  api.FEATURES.map((f) => f.name),
  ['launcher', 'faction-capture', 'pending-item', 'spite-card-ratings', 'zee-card-ratings']);

check('loading the script mounts one floating root on the body',
  [fakeDoc.body.children.length, fakeDoc.body.children[0].id], [1, api.LAUNCHER_ID]);
api.mountLauncher();
check('the id guard makes every later scan a no-op', fakeDoc.body.children.length, 1);

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
