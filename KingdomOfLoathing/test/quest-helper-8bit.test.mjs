// Ad-hoc test for KingdomOfLoathing/quest-helper.js's 8-Bit Realm advice.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the DOM-free 8-Bit helpers plus the charpane scraper.
//
// What's pinned here, and why:
//   - the points formula, which is the whole reason the box says anything
//     useful. It matches the community 8bit-relay override: 50 a fight (100 in
//     the bonus zone), plus 10 per 10 (bonus) or per 20 (not) of the zone's one
//     modifier ABOVE its floor, and nothing at all below that floor. The
//     bonus zone is worth exactly double, and 400 is the ceiling.
//   - the colour -> zone map and the cycle order (black, blue, green, red),
//     since the whole point is telling you where to go.
//   - that an unrecognised colour produces no advice rather than a guess.
//   - that the charpane's own markup parses, from the real sidebar HTML.
//
//   node KingdomOfLoathing/test/quest-helper-8bit.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'quest-helper.js'), 'utf8');

// The stub page. The pathname has to be one the script accepts or it bails on
// its first line; '/choice.php' also keeps the charpane branch from running, so
// nothing is injected and we can drive readEightBitScore by hand instead.
const page = { titled: [], cells: [] };
const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: (sel) => (sel === 'td' ? page.cells : page.titled),
  getElementById: () => null,
  images: [],
};
const fakeLocation = { pathname: '/choice.php' };

// Same re-expose trick as quest-helper-rotation.test.mjs: hand the internals
// back at the dispatch line, since the script bails before the IIFE's end.
const wrapped = src
  .replace('(function () {', 'globalThis.__qh = (function () {')
  .replace('const puzzle = currentPuzzle();',
    'return { EIGHTBIT_ZONES, EIGHTBIT_CHESTS, eightBitPoints, eightBitAmount, ' +
    'eightBitZone, eightBitNextZone, eightBitChest, eightBitAdvice, ' +
    'readEightBitScore };');
const fn = new Function('document', 'location', 'window',
  wrapped + '\nreturn globalThis.__qh;');
const api = fn(fakeDoc, fakeLocation, {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const zone = (colour) => api.eightBitZone(colour);
const VANYA = zone('black');
const MEGALO = zone('blue');
const FIELD = zone('green');
const FUNGUS = zone('red');

// --- the colour -> zone map -----------------------------------------------

check('each colour names its zone', [
  VANYA.name, MEGALO.name, FIELD.name, FUNGUS.name,
], ['Vanya\'s Castle', 'Megalo-City', 'Hero\'s Field', 'The Fungus Plains']);

check('each zone links to its own snarfblat', [
  VANYA.snarfblat, MEGALO.snarfblat, FIELD.snarfblat, FUNGUS.snarfblat,
], [565, 566, 564, 563]);

check('each zone names the one modifier that pays', [
  VANYA.stat, MEGALO.stat, FIELD.stat, FUNGUS.stat,
], ['Combat Initiative', 'Damage Absorption', 'Item Drop', 'Meat Drop']);

check('COLOUR is matched case-insensitively', api.eightBitZone('BLACK'), VANYA);
check('an unknown colour is no zone', [
  api.eightBitZone('purple'), api.eightBitZone(''), api.eightBitZone(null),
], [null, null, null]);

// The cycle is fixed and the same for everyone: black -> blue -> green -> red.
check('the cycle steps black -> blue -> green -> red -> black', [
  api.eightBitNextZone(VANYA).colour, api.eightBitNextZone(MEGALO).colour,
  api.eightBitNextZone(FIELD).colour, api.eightBitNextZone(FUNGUS).colour,
], ['blue', 'green', 'red', 'black']);

// --- the points formula ---------------------------------------------------

check('below the floor the modifier is worth nothing', [
  api.eightBitPoints(VANYA, 0, true), api.eightBitPoints(VANYA, 299, true),
  api.eightBitPoints(VANYA, 300, true),
], [100, 100, 100]);

check('...and the same holds outside the bonus', [
  api.eightBitPoints(VANYA, 0, false), api.eightBitPoints(VANYA, 300, false),
], [50, 50]);

check('in the bonus zone every 10 over the floor is 10 points',
  api.eightBitPoints(VANYA, 400, true), 200);
check('outside it, every 20 over the floor is 10 points',
  api.eightBitPoints(VANYA, 400, false), 100);

check('every zone caps at 400 in the bonus', [
  api.eightBitPoints(VANYA, VANYA.cap, true), api.eightBitPoints(MEGALO, MEGALO.cap, true),
  api.eightBitPoints(FIELD, FIELD.cap, true), api.eightBitPoints(FUNGUS, FUNGUS.cap, true),
], [400, 400, 400, 400]);

check('...and at 200 outside it — the bonus is worth exactly double', [
  api.eightBitPoints(VANYA, VANYA.cap, false), api.eightBitPoints(MEGALO, MEGALO.cap, false),
  api.eightBitPoints(FIELD, FIELD.cap, false), api.eightBitPoints(FUNGUS, FUNGUS.cap, false),
], [200, 200, 200, 200]);

check('one short of the cap is not the cap',
  api.eightBitPoints(VANYA, VANYA.cap - 1, true), 390);
check('past the cap is still the cap', api.eightBitPoints(FIELD, 9999, true), 400);

// --- formatting -----------------------------------------------------------

check('Damage Absorption is flat, the other three are percentages', [
  api.eightBitAmount(MEGALO, 595), api.eightBitAmount(VANYA, 595),
  api.eightBitAmount(FIELD, 395), api.eightBitAmount(FUNGUS, 445),
], ['595', '+595%', '+395%', '+445%']);

// --- the Treasure House chests --------------------------------------------

check('chests unlock at 10k / 20k / 30k and never spend the score', [
  api.eightBitChest(0).at, api.eightBitChest(9999).at,
  api.eightBitChest(10000).at, api.eightBitChest(29999).at,
], [10000, 10000, 20000, 30000]);
check('past 30k there is nothing left to reach', api.eightBitChest(30000), null);
check('an unreadable score has no goal', api.eightBitChest(null), null);

// --- the advice -----------------------------------------------------------

const black = api.eightBitAdvice('black', 0);
check('the advice links to the bonus zone', black.url, 'adventure.php?snarfblat=565');
check('...names what to boost, with both thresholds', black.boost,
  'Boost Combat Initiative — worth nothing below +300%, maxed at +595%.');
check('...says which zone is up next', black.next, 'Then Megalo-City (blue).');
check('...and how far off the next chest is',
  /^10[.,]000 more for the digital key\.$/.test(black.goal), true);

const blue = api.eightBitAdvice('blue', 30000);
check('a flat-modifier zone drops the percent signs', blue.boost,
  'Boost Damage Absorption — worth nothing below 300, maxed at 595.');
check('a finished score says so', blue.goal, 'All three chests are open.');

check('an unreadable score just omits the goal line',
  api.eightBitAdvice('red', null).goal, null);
check('an unrecognised colour says nothing at all', [
  api.eightBitAdvice('purple', 0), api.eightBitAdvice(undefined, 0),
], [null, null]);

check('the tooltip carries the whole cycle and the shift rule', [
  /black = Vanya's Castle/.test(black.tip),
  /red = The Fungus Plains/.test(black.tip),
  /every 5 kills/.test(black.tip),
  /never spent/.test(black.tip),
], [true, true, true, true]);

// --- reading the charpane -------------------------------------------------

// The real sidebar row, from a live charpane:
//   <td align=right><span class="nes">Score:</span></td>
//   <td align=left><font color="black"><span class="nes" alt="black score - 0"
//                                            title="black score - 0">0</span></font></td>
const el = (attrs, text) => ({
  getAttribute: (k) => (k in attrs ? attrs[k] : null),
  textContent: text === undefined ? '' : text,
  closest: () => null,
  querySelector: () => null,
});

page.titled = [
  el({ title: 'Rollover in 3 hours' }, ''),
  el({ alt: 'black score - 0', title: 'black score - 0' }, '0'),
];
page.cells = [];
const read = api.readEightBitScore();
check('the labelled span gives the colour and the score',
  [read.colour, read.score], ['black', 0]);

page.titled = [el({ alt: 'GREEN score - 12,340', title: 'GREEN score - 12,340' }, '12,340')];
const big = api.readEightBitScore();
check('a thousands-separated score is a number, and the colour is lowercased',
  [big.colour, big.score], ['green', 12340]);

// Fallback path: no alt/title, just the label cell and the <font color>.
page.titled = [];
const font = el({ color: 'Red' }, '250');
const scoreRow = { querySelector: () => font };
const labelCell = el({}, 'Score:');
labelCell.closest = () => scoreRow;
page.cells = [el({}, 'Muscle:'), labelCell];
const fallback = api.readEightBitScore();
check('the <font color> is the fallback when nothing is labelled',
  [fallback.colour, fallback.score], ['red', 250]);

page.titled = [];
page.cells = [el({}, 'Muscle:')];
check('no score row at all reads as nothing', api.readEightBitScore(), null);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
