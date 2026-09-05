// Ad-hoc test for KingdomOfLoathing/auto-mine.js's reading of mining.php.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a mining.php pathname, so the page guard lets the declarations run, but no
// grid, so nothing is injected), and pulls out the page readers.
//
// What's pinned here is the contract with KoL's own markup, which is the half
// of this script that can silently rot:
//
//   - alt='<Name> (col,row)' with col/row 1..6 is the whole state read, and
//     the 36-character string is ordered (row-1)*6+(col-1). Both come from
//     KoLmafia's MineDecorator.java, whose MineDecoratorTest asserts the four
//     expected strings reproduced below against KoL's real responses
//     (test/root/request/test_mining_volcano_*.html).
//   - `which` is col + 8*row -- the 8-wide grid including the unbreakable
//     border, not the 6-wide interior. Getting this wrong digs the wrong hole.
//   - A dig's result is read from the item art in the Results block, and must
//     NOT be read from the grid below it: the mine redraws squares you already
//     opened, so an unscoped search would see a gold nugget on every page from
//     then on.
//
//   node KingdomOfLoathing/test/auto-mine-parse.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'auto-mine.js'), 'utf8');

// Stub globals. The pathname has to be one the script accepts, or it bails on
// its very first lines before declaring anything; nothing on the stub page is
// a mine grid, so the advisor would find nothing even if it ran.
const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  readyState: 'complete',
  addEventListener: () => {},
};
const fakeLocation = {
  pathname: '/mining.php',
  search: '?mine=6',
  origin: 'https://www.kingdomofloathing.com',
};

const wrapped = src
  .replace('(function () {', 'globalThis.__am = (function () {')
  .replace('  boot();',
    '  return { readTilesFromHtml, readTilesFromDoc, stateFromTiles, pwdFromHtml, ' +
    'parseMineResult, whichFor, coordinateToIndex, indexToCoordinate, codeForName, ' +
    'linkedWhichFromHtml };');
if (wrapped === src) throw new Error('could not rewrite auto-mine.js for testing');

const fn = new Function('document', 'location', 'window', 'top', wrapped);
fn(fakeDoc, fakeLocation, { localStorage: null }, {});
const api = globalThis.__am;

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    console.log('ok   ' + label);
  } else {
    failures++;
    console.log('FAIL ' + label + '\n  expected ' + b + '\n  actual   ' + a);
  }
}

// --- building a mine page -------------------------------------------------
//
// KoL's grid is 8x8: the interior 6x6 is the mine and the ring around it is
// unbreakable scenery that still carries alt text, with coordinates 0 and 7.
// The ring is in here on purpose -- dropping it is exactly the bug the 1..6
// filter exists to prevent.

const HOST = 'https://d2uyhvukfffg5a.cloudfront.net';
const PWD = '4a0ea4004d1ccb74ba8db1f1130316a1';
const NAMES = { o: 'Open Cavern', '*': 'Promising Chunk of Wall', X: 'Rocky Wall' };

function tileImg(name, col, row, art) {
  return "<img src='" + HOST + '/otherimages/mine/' + art + ".gif' alt='" + name +
    ' (' + col + ',' + row + ")' title='" + name + ' (' + col + ',' + row +
    ")' border=0 height=50 width=50>";
}

// A square is linked when it is still wall and either sits in the bottom row
// (row 6, the one you stand in) or touches an open square. That is KoL's own
// rule, and building the fixture from it is what lets the `linked` assertions
// below mean something.
function isDiggable(state, col, row) {
  if (state[(row - 1) * 6 + (col - 1)] === 'o') return false;
  if (row === 6) return true;
  const around = [[col, row - 1], [col, row + 1], [col - 1, row], [col + 1, row]];
  return around.some(([c, r]) =>
    c >= 1 && c <= 6 && r >= 1 && r <= 6 && state[(r - 1) * 6 + (c - 1)] === 'o');
}

function buildMinePage(state) {
  let html = "<div id='postload'><table>";
  for (let row = 0; row <= 7; row++) {
    html += '<tr>';
    for (let col = 0; col <= 7; col++) {
      if (col === 0 || col === 7 || row === 0 || row === 7) {
        html += '<td onclick="no();">' + tileImg('Rocky Wall', col, row, 'wall1111') + '</td>';
        continue;
      }
      const code = state[(row - 1) * 6 + (col - 1)];
      const art = code === '*' ? 'wallsparkle5' : code === 'o' ? 'wall1110' : 'wall1111';
      const img = tileImg(NAMES[code], col, row, art);
      html += isDiggable(state, col, row)
        ? "<td><a href='mining.php?mine=6&which=" + (col + 8 * row) + '&pwd=' + PWD + "'>" +
          img + '</a></td>'
        : '<td>' + img + '</td>';
    }
    html += '</tr>';
  }
  html += '</table></div>' +
    '<form action=mining.php method=post><input type=hidden name=mine value=6>' +
    '<input type=hidden name=reset value=1>' +
    "<input type=hidden name=pwd value='" + PWD + "'></form>";
  return html;
}

// --- the four states KoLmafia asserts -------------------------------------
//
// Verbatim from MineDecoratorTest.canParseMineState. Round-tripping them
// through our own page builder proves the ordering and the 1..6 filter; the
// literal excerpt further down proves the markup itself.

const MAFIA_STATES = {
  mixed_results: 'XXXXXXXXXXXXXXXXXXXX**XXXXoo*XXXXoXX',
  deeply_explored: 'ooo*XX*oo**X*oo*o*oooooXooooooXooooX',
  object_detection: '**XX*XX*XX*X*****XXXoXXXXXo*XXX*o*XX',
  reset: '*XX****XXX**XX*XX*X*X*X*XXX***XXXXXX',
};

for (const name of Object.keys(MAFIA_STATES)) {
  const state = MAFIA_STATES[name];
  check(name + ' is 36 characters', state.length, 36);
  const tiles = api.readTilesFromHtml(buildMinePage(state));
  check(name + ' reads back 36 squares', tiles.length, 36);
  check(name + ' round-trips through the page', api.stateFromTiles(tiles), state);
}

// --- the real markup ------------------------------------------------------
//
// Rows 5 and 6 of KoLmafia's test_mining_volcano_mixed_results.html, verbatim.
// This is the only thing in the file that pins KoL's actual attribute order
// and quoting; the builder above copies it, so if KoL changes, fix this first
// and the builder second.

const LITERAL_ROWS =
  "<tr><td onclick=\"no();\"><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (0,5)' title='Rocky Wall (0,5)' border=0 height=50 width=50></td><td onclick=\"no2();\"><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (1,5)' title='Rocky Wall (1,5)' border=0 height=50 width=50></td><td><a href='mining.php?mine=6&which=42&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (2,5)' title='Rocky Wall (2,5)' border=0 height=50 width=50></a></td><td><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1110.gif' alt='Open Cavern (3,5)' title='Open Cavern (3,5)' border=0 height=50 width=50></td><td><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1001.gif' alt='Open Cavern (4,5)' title='Open Cavern (4,5)' border=0 height=50 width=50></td><td><a href='mining.php?mine=6&which=45&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wallsparkle2.gif' alt='Promising Chunk of Wall (5,5)' title='Promising Chunk of Wall (5,5)' border=0 height=50 width=50></a></td><td onclick=\"no2();\"><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (6,5)' title='Rocky Wall (6,5)' border=0 height=50 width=50></td><td onclick=\"no();\"><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (7,5)' title='Rocky Wall (7,5)' border=0 height=50 width=50></td></tr>" +
  "<tr><td onclick=\"no();\"><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (0,6)' title='Rocky Wall (0,6)' border=0 height=50 width=50></td><td><a href='mining.php?mine=6&which=49&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (1,6)' title='Rocky Wall (1,6)' border=0 height=50 width=50></a></td><td><a href='mining.php?mine=6&which=50&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (2,6)' title='Rocky Wall (2,6)' border=0 height=50 width=50></a></td><td><a href='mining.php?mine=6&which=51&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (3,6)' title='Rocky Wall (3,6)' border=0 height=50 width=50></a></td><td><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall0011.gif' alt='Open Cavern (4,6)' title='Open Cavern (4,6)' border=0 height=50 width=50></td><td><a href='mining.php?mine=6&which=53&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (5,6)' title='Rocky Wall (5,6)' border=0 height=50 width=50></a></td><td><a href='mining.php?mine=6&which=54&pwd=4a0ea4004d1ccb74ba8db1f1130316a1'><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (6,6)' title='Rocky Wall (6,6)' border=0 height=50 width=50></a></td><td onclick=\"no();\"><img src='https://d2uyhvukfffg5a.cloudfront.net/otherimages/mine/wall1111.gif' alt='Rocky Wall (7,6)' title='Rocky Wall (7,6)' border=0 height=50 width=50></td></tr>";

const literal = api.readTilesFromHtml(LITERAL_ROWS);
check('the border ring is dropped', literal.length, 12);
check('real markup reads codes', literal.map((t) => t.code).join(''), 'XXoo*XXXXoXX');
check('real markup derives which', literal.map((t) => t.which),
  [41, 42, 43, 44, 45, 46, 49, 50, 51, 52, 53, 54]);
check('the page\'s own links are recognised', literal.filter((t) => t.linked).map((t) => t.which),
  [42, 45, 49, 50, 51, 53, 54]);
check('an unlinked wall is not claimed diggable',
  literal.filter((t) => t.which === 41)[0].linked, false);
check('pwd off a tile link', api.pwdFromHtml(LITERAL_ROWS), PWD);
check('pwd off the reset form', api.pwdFromHtml(buildMinePage(MAFIA_STATES.reset)), PWD);
check('no pwd is null, not a guess', api.pwdFromHtml('<p>nothing here</p>'), null);

// --- which, and the two coordinate systems --------------------------------

check('which is col + 8*row, not col + 6*row', api.whichFor(4, 6), 52);
check('bottom-left square', api.whichFor(1, 6), 49);
check('top-right square', api.whichFor(6, 1), 14);
// KoL row 6 is the front row you stand in, which is oreo's internal row 0.
check('the front row is oreo index 0..5', api.coordinateToIndex([1, 6]), 0);
check('the back row is oreo index 30..35', api.coordinateToIndex([1, 1]), 30);
check('coordinates round-trip', [[1, 6], [6, 1], [4, 3]].map(
  (c) => api.indexToCoordinate(api.coordinateToIndex(c))), [[1, 6], [6, 1], [4, 3]]);

// --- an incomplete grid is not a grid -------------------------------------

check('a partial grid reads as no state',
  api.stateFromTiles(api.readTilesFromHtml(LITERAL_ROWS)), null);
check('a page with no grid reads as no state',
  api.stateFromTiles(api.readTilesFromHtml('<p>You are not in a mine.</p>')), null);
check('an unknown square name is flagged, not guessed', api.codeForName('Shimmering Portal'), '?');
check('names are matched case-insensitively', api.codeForName('open cavern'), 'o');

// --- what a dig turned up -------------------------------------------------

const RESULTS = '<b style="color: white">Results:</b><table><tr>' +
  '<td><img src="https://d2uyhvukfffg5a.cloudfront.net/itemimages/ART" ' +
  'height=30 width=30></td><td valign=center class=effect>WHAT</td></tr></table>';
const resultPage = (art, what) => RESULTS.replace('ART', art).replace('WHAT', what);

check('gold', api.parseMineResult(resultPage('goldnugget.gif', 'You acquire an item:')), 'gold');
check('velvet', api.parseMineResult(resultPage('rawvelvet.gif', 'You acquire an item:')), 'ore');
check('crystal', api.parseMineResult(resultPage('nacrystal1.gif', 'You acquire an item:')),
  'crystal');
check('cave-in', api.parseMineResult(resultPage('hp.gif', 'You lose 39 hit points.')), 'cave');
check('stats only is nothing, not a guess',
  api.parseMineResult('<b style="color: white">Results:</b><table><tr><td>You start digging.' +
    '</td></tr></table>'), null);

// The expensive false positive this scoping exists to prevent: KoLmafia
// redraws squares you have already opened with the item you found there, so
// once you have struck gold, every later page carries a goldnugget.gif below
// the Results block.
check('art below the Results block is ignored',
  api.parseMineResult('<b style="color: white">Results:</b><table><tr><td>You start digging.' +
    '</td></tr></table>' + '<div id=postload><img src="/itemimages/goldnugget.gif"></div>'),
  null);
check('a page with no Results block at all is still read',
  api.parseMineResult('<img src="https://x/itemimages/rawvelvet.gif">'), 'ore');

// --- the DOM reader agrees with the HTML reader ---------------------------
//
// Two readers exist because the engine has response text and the advisor has
// elements. They must not drift, so the DOM reader is run over a fake document
// built from the same page and asked for the same answer.

function fakeDocumentFor(html) {
  const imgs = [];
  const re = /(<a [^>]*>)?<img[^>]*alt='([^']*)'[^>]*>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const anchored = !!match[1];
    const alt = match[2];
    const cell = { style: {} };
    imgs.push({
      getAttribute: (name) => (name === 'alt' ? alt : null),
      closest: (sel) => (sel === 'td' ? cell : anchored ? { href: '#' } : null),
    });
  }
  return {
    documentElement: { innerHTML: html },
    querySelectorAll: (sel) => (sel === 'img[alt]' ? imgs : []),
  };
}

for (const name of Object.keys(MAFIA_STATES)) {
  const html = buildMinePage(MAFIA_STATES[name]);
  check('DOM reader agrees on ' + name,
    api.stateFromTiles(api.readTilesFromDoc(fakeDocumentFor(html))), MAFIA_STATES[name]);
}

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
