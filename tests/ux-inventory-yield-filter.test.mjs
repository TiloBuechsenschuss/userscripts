// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js's "pays out" inventory
// filter.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a pathname matching no feature, so run() is a no-op) and pulls out the
// helpers -- the same re-expose trick as the other ux tests.
//
// What's pinned here, and why:
//   - Matching is by ITEM ID out of the item table's own `rel`, never by name.
//     The wiki writes "jaba&ntilde;ero-flavored chewing gum" where the page
//     renders the ñ, item names carry ™ and quotes, and several differ from
//     their article title outright. Ids don't drift.
//   - A self-transforming item is NOT a match. The whole point of the filter is
//     "what can I open for stuff", and a book that turns into "<book> (used)"
//     answers that with nothing. These are the data file's self_transform=all
//     rows, excluded when the id list is generated.
//   - A Meat payout counts. An old leather wallet yields no items at all, only
//     400-600 Meat, and it is exactly as much a container as a foodbucket is.
//   - An item whose `rel` can't be read is SHOWN. Hiding is a claim that an item
//     pays nothing, and an unreadable id supports no claim -- KoL splices its own
//     markup in when you use something, and markup we can't parse must never
//     cost the player sight of their inventory.
//   - **The filter never moves, adds or removes a node.** This is the big one.
//     The first implementation packed the grid by moving cells between rows, and
//     every bug this feature had came from that: the moves woke the observer,
//     which repacked, which woke it again (the grid twitching under the mouse);
//     a row KoL had rebuilt in the meantime was no longer in the page, so the
//     survivors were moved into it and the category vanished; and the moves left
//     the DOM ordered payers-first, so KoL's re-render after a use replayed that
//     order and the inventory stopped being alphabetical. Packing is now done
//     with display alone. Hence the move counter below: it must stay at zero
//     through every operation in this file.
//
// The ids and markup come from the real pages: 3676 is the Mer-kin foodbucket,
// 553 the 31337 scroll, 1917 the old leather wallet, 7262 "I Love Me, Vol. I" (a
// book that only turns into its own used copy), and the `rel` is a real
// inventory.php one.
//
//   node tests/ux-inventory-yield-filter.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  images: [],
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  // Real stub nodes, so the group headings the code builds can be asserted on.
  // They are flagged as ours, which is how the move counter tells a heading we
  // added apart from one of KoL's cells being shifted.
  createElement: (tag) => {
    const node = makeNode(tag);
    node.ours = true;
    return node;
  },
  createTextNode: (t) => ({ text: t }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { isYieldItem, showsWhenFiltered, groupOfItem, placementNode, filterCategory, ' +
    'touchesAnItem, YIELD_GROUPS, YIELD_CLASSES, YIELD_GROUP_OF }; })();');

// `CSS` is passed in so the display:contents probe can be answered both ways.
function loadUx(css) {
  const fn = new Function('document', 'location', 'window', 'CSS',
    wrapped + '\nreturn globalThis.__ux;');
  return fn(fakeDoc, fakeLocation, {}, css);
}

const api = loadUx({ supports: () => true });
const noContents = loadUx({ supports: () => false });

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- the id list -----------------------------------------------------------

check('the generated id list is present and plausible',
  api.YIELD_GROUP_OF.size > 400 && api.YIELD_GROUP_OF.size < 2000, true);

check('every group in the list is one the code knows how to show',
  Object.keys(api.YIELD_CLASSES).sort(),
  api.YIELD_GROUPS.map((g) => g.key).sort());

check('no item is filed under two groups',
  [].concat(...Object.values(api.YIELD_CLASSES)).length, api.YIELD_GROUP_OF.size);

// One from each group, by id: smoked potsherd (five recipes, by count), old
// leather wallet (Meat only), Mer-kin foodbucket (0-3 of four sea vegetables),
// A-Boo glue (one fixed item, no Meat, no range).
check('a multi-use item is grouped first', api.groupOfItem('id=4680&t=1'), 0);
check('a Meat payout is grouped second', api.groupOfItem('id=1917&t=1'), 1);
check('a random yield is grouped third', api.groupOfItem('id=3676&t=1'), 2);
check('a fixed set of items is grouped last', api.groupOfItem('id=9912&t=1'), 3);
check('an item that pays nothing has no group', api.groupOfItem('id=1&t=1'), -1);
check('an unreadable rel has no group', api.groupOfItem('nonsense'), -1);

// --- matching --------------------------------------------------------------

check('a container matches on its id (Mer-kin foodbucket)',
  api.isYieldItem('id=3676&s=0&q=0&d=1&g=0&t=1&n=2&m=0&p=0&u=.'), true);

check('a plain item does not match',
  api.isYieldItem('id=1&s=0&q=0&d=1&g=0&t=1&n=17&m=0&p=0&u=.'), false);

// 7262 is "I Love Me, Vol. I", whose only yield is "I Love Me, Vol. I (used)".
check('a self-transforming book is not a match', api.isYieldItem('id=7262&t=1'), false);

// 1917 is the old leather wallet: no item yields at all, 400-600 Meat.
check('a Meat-only payout matches (old leather wallet)',
  api.isYieldItem('id=1917&s=0&q=0&d=1&g=0&t=1&n=1&m=0&p=0&u=.'), true);

// 546 is the Meat vortex, whose payout the wiki records only as "some".
check('a Meat payout with no stated amount still matches',
  api.isYieldItem('id=546&t=1'), true);

check('an unreadable rel is not a match', api.isYieldItem('nonsense'), false);
check('a missing rel is not a match', api.isYieldItem(null), false);
check('an id that is not a number is not a match', api.isYieldItem('id=abc'), false);

// --- what the filter actually hides ----------------------------------------

check('a payer is shown', api.showsWhenFiltered('id=3676&t=1'), true);
check('a non-payer is hidden', api.showsWhenFiltered('id=1&t=1'), false);
check('an item with no readable id is SHOWN, not hidden',
  api.showsWhenFiltered('nonsense'), true);
check('a missing rel is shown', api.showsWhenFiltered(null), true);
check('a non-numeric id is shown', api.showsWhenFiltered('id=abc'), true);

// --- a category, end to end ------------------------------------------------
//
// A stand-in for the grid layout, nested the way KoL nests it:
//   table.stuffbox > div.collapse > table > tbody > tr > td > table.item
// Enough of the DOM API for the code under test, and small enough to assert on.

// Every node the code under test moves, adds or removes. It must never be
// anything but zero -- see the header.
let moves = 0;

function makeNode(tag, attrs = {}) {
  const node = {
    tagName: tag.toUpperCase(),
    attrs,
    style: {},
    children: [],
    nodeType: 1,
    className: '',
    textContent: '',
    ours: false,
    parentNode: null,
    parentElement: null,
    matches(sel) { return matches(this, sel); },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    removeChild(child) {
      const at = this.children.indexOf(child);
      if (at >= 0) this.children.splice(at, 1);
      child.parentNode = null;
      child.parentElement = null;
      return child;
    },
    get firstChild() { return this.children[0] || null; },
    get nextSibling() {
      const kids = this.parentNode ? this.parentNode.children : [];
      return kids[kids.indexOf(this) + 1] || null;
    },
    getAttribute(name) { return name in this.attrs ? this.attrs[name] : null; },
    appendChild(child) { return this.insertBefore(child, null); },
    insertBefore(child, before) {
      // Only KoL's own nodes count. A heading of ours arriving is not the bug
      // this counter exists for.
      if (building === false && !child.ours) moves++;
      if (child.parentNode) {
        const kids = child.parentNode.children;
        kids.splice(kids.indexOf(child), 1);
      }
      const at = before ? this.children.indexOf(before) : this.children.length;
      this.children.splice(at < 0 ? this.children.length : at, 0, child);
      child.parentNode = this;
      child.parentElement = this;
      return child;
    },
    closest(sel) {
      let n = this;
      while (n) {
        if (matches(n, sel)) return n;
        n = n.parentNode;
      }
      return null;
    },
    querySelectorAll(sel) {
      const out = [];
      (function walk(n) {
        n.children.forEach((c) => { if (matches(c, sel)) out.push(c); walk(c); });
      })(this);
      return out;
    },
  };
  return node;
}

// Building the fixture is not the code under test moving anything.
let building = true;

function matches(node, sel) {
  if (sel === 'td') return node.tagName === 'TD';
  if (sel === 'table.item[id^="ic"]') {
    return node.tagName === 'TABLE' && node.attrs.class === 'item' &&
      String(node.attrs.id || '').startsWith('ic');
  }
  throw new Error('unsupported selector in stub: ' + sel);
}

// ids: 3676, 553 and 1917 pay out; 1 and 7262 do not.
function buildGrid(rows) {
  building = true;
  const box = makeNode('table', { class: 'stuffbox' });
  const collapse = makeNode('div', { class: 'collapse' });
  const table = makeNode('table');
  const tbody = makeNode('tbody');
  box.appendChild(collapse);
  collapse.appendChild(table);
  table.appendChild(tbody);
  rows.forEach((ids) => {
    const tr = makeNode('tr');
    tbody.appendChild(tr);
    ids.forEach((id) => {
      const td = makeNode('td');
      td.appendChild(makeNode('table', { class: 'item', id: 'ic' + id, rel: 'id=' + id + '&t=1' }));
      tr.appendChild(td);
    });
  });
  box.grid = { table, tbody };
  building = false;
  return box;
}

// Every item id in the category, in DOM order, regardless of visibility.
const order = (box) => box.querySelectorAll('table.item[id^="ic"]')
  .map((item) => Number(item.attrs.id.slice(2)));

// Rows of the ids that are actually on screen.
const shape = (box) => box.grid.tbody.children
  .map((tr) => tr.children
    .filter((td) => td.style.display !== 'none')
    .map((td) => Number(td.children[0].attrs.id.slice(2))));

const layout = [[3676, 1, 553], [1, 7262, 3676], [553, 1]];
const flat = [3676, 1, 553, 1, 7262, 3676, 553, 1];

const grid = buildGrid(layout);
check('the untouched grid is what we built', shape(grid), layout);

moves = 0;
const on = api.filterCategory(grid, true);
check('the category reports what it kept', on, { loaded: true, kept: 4 });
check('filtering moves nothing', moves, 0);
check('and leaves KoL\'s order untouched', order(grid), flat);
check('the non-payers are the ones hidden', shape(grid), [[3676, 553], [3676], [553]]);

// The survivors close up because the row hands its cells to a wrapping flex
// line, not because anything was rearranged.
check('each row hands its cells to the flex line',
  grid.grid.tbody.children.map((tr) => tr.style.display), ['contents', 'contents', 'contents']);
check('the grid body becomes the wrapping line, spaced out',
  [grid.grid.tbody.style.display, grid.grid.tbody.style.flexWrap, grid.grid.tbody.style.gap],
  ['flex', 'wrap', '10px 14px']);
check('and its table stops being a table so the flex takes',
  grid.grid.table.style.display, 'block');

moves = 0;
api.filterCategory(grid, true);
check('re-filtering a settled category moves nothing', moves, 0);
check('re-filtering leaves the layout alone', shape(grid), [[3676, 553], [3676], [553]]);

moves = 0;
const off = api.filterCategory(grid, false);
check('unfiltering reports the same count', off, { loaded: true, kept: 4 });
check('unfiltering moves nothing either', moves, 0);
check('every item is visible again, in KoL\'s order', shape(grid), layout);
check('and every style we set is cleared',
  [grid.grid.table.style.display, grid.grid.tbody.style.display,
    grid.grid.tbody.style.flexWrap, grid.grid.tbody.style.gap,
    grid.grid.tbody.children[0].style.display],
  ['', '', '', '', '']);

// A browser without display:contents must not get the packing styles -- half of
// that layout would drop the cells out of the page altogether. Hiding still works.
const plain = buildGrid(layout);
noContents.filterCategory(plain, true);
check('without display:contents support the rows are left alone',
  plain.grid.tbody.children.map((tr) => tr.style.display), ['', '', '']);
check('but the non-payers are still hidden', shape(plain), [[3676, 553], [3676], [553]]);

// KoL parks a description popup in the page while the pointer is over an item.
const hovered = buildGrid(layout);
api.filterCategory(hovered, true);
const popup = makeNode('div', { id: 'hoverpopup' });
const firstRow = hovered.grid.tbody.children[0];
building = true;
firstRow.insertBefore(popup, firstRow.children[1]);
building = false;
moves = 0;
api.filterCategory(hovered, true);
check('a popup between two cells provokes nothing', moves, 0);
check('and is left where the page put it', firstRow.children[1] === popup, true);

// Using an item makes KoL rebuild that category's rows. Nothing here depends on
// the old rows, so the rebuilt category filters like any other.
const rebuilt = buildGrid(layout);
api.filterCategory(rebuilt, true);
building = true;
const freshRow = makeNode('tr');
const oldRow = rebuilt.grid.tbody.children[0];
rebuilt.grid.tbody.insertBefore(freshRow, oldRow);
oldRow.children.slice().forEach((cell) => freshRow.appendChild(cell));
rebuilt.grid.tbody.children.splice(rebuilt.grid.tbody.children.indexOf(oldRow), 1);
oldRow.parentNode = null;
building = false;

moves = 0;
api.filterCategory(rebuilt, true);
check('a category whose rows KoL rebuilt still shows its items',
  shape(rebuilt).some((row) => row.length > 0), true);
check('and rebuilding provoked no moves of ours', moves, 0);

// A collapsed category has no items on the page yet. That must not read as
// "filtered down to nothing", or the header you click to load it gets hidden.
check('a category with nothing loaded is reported as unloaded',
  api.filterCategory(makeNode('table', { class: 'stuffbox' }), true), { loaded: false, kept: 0 });

// --- grouping ---------------------------------------------------------------
//
// Groups are drawn with flex `order`, so KoL's cells stay exactly where they are
// and only the drawing order changes. Each group gets a heading row of our own,
// full width, ordered just above its items.

const headings = (box) => box.grid.tbody.children
  .filter((tr) => tr.className === 'tm-yield-head')
  .map((tr) => tr.children[0].textContent);

const orderOf = (box, id) => box.querySelectorAll('table.item[id^="ic"]')
  .filter((item) => item.attrs.id === 'ic' + id)
  .map((item) => item.parentNode.style.order)[0];

// 4680 multi-use, 1917 Meat, 3676 random, 9912 fixed items, 1 pays nothing.
const mixed = buildGrid([[4680, 1917, 1], [3676, 9912, 4680]]);
moves = 0;
api.filterCategory(mixed, true, true);

check('grouping moves none of KoL\'s nodes', moves, 0);
check('a heading per group that has something in it', headings(mixed),
  ['Multi-use recipes (2)', 'Meat (1)', 'Random yield (1)', 'Items (1)']);
check('items are drawn in their group\'s slot',
  [orderOf(mixed, 4680), orderOf(mixed, 1917), orderOf(mixed, 3676), orderOf(mixed, 9912)],
  ['1', '3', '5', '7']);
check('and each heading sits just above its group',
  mixed.grid.tbody.children
    .filter((tr) => tr.className === 'tm-yield-head')
    .map((tr) => /order:\s*(\d+)/.exec(tr.style.cssText)[1]),
  ['0', '2', '4', '6']);
check('the item that pays nothing gets no order', orderOf(mixed, 1), '');

// A second pass must reuse the headings, not stack up another set of them.
api.filterCategory(mixed, true, true);
check('re-grouping does not duplicate the headings', headings(mixed).length, 4);

api.filterCategory(mixed, true, false);
check('grouping off takes the headings away', headings(mixed), []);
check('and clears the order it set', orderOf(mixed, 4680), '');

// A category with only one group represented gets only that heading.
const oneGroup = buildGrid([[1917, 1]]);
api.filterCategory(oneGroup, true, true);
check('an empty group gets no heading', headings(oneGroup), ['Meat (1)']);

// No flex line, nothing to order things in: grouping is skipped whole rather
// than leaving headings adrift in a table.
const plainGroup = buildGrid([[4680, 1917]]);
noContents.filterCategory(plainGroup, true, true);
check('without display:contents there is no grouping either',
  [headings(plainGroup).length, orderOf(plainGroup, 4680)], [0, '']);

// --- which mutations are worth a pass --------------------------------------

building = true;
const itemCell = makeNode('td');
itemCell.appendChild(makeNode('table', { class: 'item', id: 'ic3676', rel: 'id=3676' }));
const bare = makeNode('div', { id: 'hoverpopup' });
building = false;

check('an item arriving is worth a pass',
  api.touchesAnItem({ addedNodes: [itemCell], removedNodes: [] }), true);
check('an item leaving is worth a pass',
  api.touchesAnItem({ addedNodes: [], removedNodes: [itemCell] }), true);
check('a hover popup coming and going is not',
  api.touchesAnItem({ addedNodes: [bare], removedNodes: [bare] }), false);
check('a mutation with no nodes at all is not',
  api.touchesAnItem({ addedNodes: [], removedNodes: [] }), false);
check('a text node is not', api.touchesAnItem({ addedNodes: [{ nodeType: 3 }], removedNodes: [] }),
  false);

// --- placement -------------------------------------------------------------

building = true;
const floated = makeNode('div');
const floatItem = makeNode('table', { class: 'item', id: 'ic3676', rel: 'id=3676' });
floated.appendChild(floatItem);
const cell = makeNode('td');
const cellItem = makeNode('table', { class: 'item', id: 'ic3676', rel: 'id=3676' });
cell.appendChild(cellItem);
const shared = makeNode('td');
const a = makeNode('table', { class: 'item', id: 'ic1', rel: 'id=1' });
const b = makeNode('table', { class: 'item', id: 'ic2', rel: 'id=2' });
shared.appendChild(a);
shared.appendChild(b);
building = false;

check('a floated item is its own placement node',
  api.placementNode(floatItem) === floatItem, true);
check('an item alone in a cell is placed by the cell',
  api.placementNode(cellItem) === cell, true);
check('a cell holding two items is not the placement node',
  api.placementNode(a) === a, true);

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
