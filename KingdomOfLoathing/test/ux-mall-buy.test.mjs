// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js mall bulk buying.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so no feature runs), and pulls out the purchase
// planner and its parsing helpers.
//
// This is the one feature here that spends Meat irreversibly, so the
// arithmetic is worth pinning down: a store's usable amount is its stock capped
// by its daily limit, allocation goes cheapest-first, and the average is over
// what would actually be bought rather than over what was asked for. The
// offers below are the real numbers from a "perfect negroni" search.
//
//   node KingdomOfLoathing/test/ux-mall-buy.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  images: [],
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseCount, parseLimit, priceFromUrl, availableFrom, buyUrlFor, ' +
    'acquiredCount, planPurchase, describePlan, purchaseSummary }; })();');
const fn = new Function('document', 'location', 'window',
  wrapped + '\nreturn globalThis.__ux;');
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

// --- reading the numbers off a row ----------------------------------------

check('stock counts lose their commas', [
  api.parseCount('555,831'), api.parseCount('19'), api.parseCount('2,920'),
], [555831, 19, 2920]);
check('an empty cell is not a count', [
  api.parseCount(' '), api.parseCount(''), api.parseCount(null),
], [null, null, null]);

check('daily limits are read', [
  api.parseLimit('1 / day   '),
  api.parseLimit('37 / day'),
  api.parseLimit(' '),
], [1, 37, null]);

// The price rides in the purchase URL as whichitem=<item>.<price>.
check('the price comes from the purchase URL', [
  api.priceFromUrl('mallstore.php?buying=1&whichitem=8738.120&ajax=1&whichstore=545961'),
  api.priceFromUrl('mallstore.php?buying=1&whichitem=8738.999999999&ajax=1'),
  api.priceFromUrl('mallstore.php?whichstore=545961'),
], [120, 999999999, null]);

// The trap: 555,831 in stock but 1/day means you can buy exactly one.
check('a daily limit caps the stock, not the other way round', [
  api.availableFrom(555831, 1), api.availableFrom(4457, null),
  api.availableFrom(64, 37), api.availableFrom(19, 37),
], [1, 4457, 37, 19]);

check('a purchase URL takes the quantity on the end', api.buyUrlFor(
  { someUrl: 'mallstore.php?buying=1&whichitem=8738.120&whichstore=545961&quantity=' }, 12),
'mallstore.php?buying=1&whichitem=8738.120&whichstore=545961&quantity=12');
check('...or replaces it, for a store with only a single-buy link', api.buyUrlFor(
  { oneUrl: 'mallstore.php?buying=1&quantity=1&whichitem=8738.120&whichstore=545961' }, 7),
'mallstore.php?buying=1&quantity=7&whichitem=8738.120&whichstore=545961');
check('no link means no purchase', api.buyUrlFor({}, 5), null);

check('acquisitions are counted from the response', [
  api.acquiredCount('You acquire <b>21</b> items: <b>perfect negroni</b>'),
  api.acquiredCount('You acquire 1,200 items'),
  api.acquiredCount('You acquire an item: <b>perfect negroni</b>'),
], [21, 1200, 1]);
// Anything unreadable must count as zero -- the callers stop on that, and
// assuming success would keep spending.
check('an unreadable response counts as nothing bought', [
  api.acquiredCount('You don\'t have enough Meat.'),
  api.acquiredCount(''), api.acquiredCount(null),
], [0, 0, 0]);

// --- planning -------------------------------------------------------------
// The real store list, cheapest first, with each one's usable amount.
const offers = [
  { storeName: 'Down Town', price: 120, available: 1, limit: 1, stock: 555831 },
  { storeName: 'Head on the Door', price: 3476, available: 4457, limit: null, stock: 4457 },
  { storeName: 'Cent Piece Commissary', price: 3476, available: 19, limit: null, stock: 19 },
  { storeName: 'The Dungeon of Dangerous Discounts', price: 3479, available: 68, limit: null, stock: 68 },
  { storeName: 'Lliks Gindaer', price: 3480, available: 226, limit: null, stock: 226 },
];

const p10 = api.planPurchase(offers, 10);
check('the cheapest store is used up first', p10.steps.map((s) => [s.offer.storeName, s.qty]),
  [['Down Town', 1], ['Head on the Door', 9]]);
check('...and the totals follow', [p10.qty, p10.cost], [10, 120 + 9 * 3476]);
check('the average is over what is actually bought',
  Math.round(p10.avg), Math.round((120 + 9 * 3476) / 10));
check('a covered plan is not short', [p10.short, p10.limited], [0, true]);

// Ties keep the page's own order: Head on the Door before Cent Piece.
const p4500 = api.planPurchase(offers, 4500);
check('price ties keep the page order',
  p4500.steps.map((s) => s.offer.storeName),
  ['Down Town', 'Head on the Door', 'Cent Piece Commissary', 'The Dungeon of Dangerous Discounts']);
check('...and stop as soon as the target is met', p4500.qty, 4500);

// More than the mall has.
const huge = api.planPurchase(offers, 10000);
check('an uncoverable order reports how far short it falls', [huge.qty, huge.short],
  [1 + 4457 + 19 + 68 + 226, 10000 - (1 + 4457 + 19 + 68 + 226)]);

check('asking for nothing buys nothing', [
  api.planPurchase(offers, 0).qty, api.planPurchase(offers, -5).qty,
  api.planPurchase([], 10).qty,
], [0, 0, 0]);

// Stores that can't sell (limit used up -> no buy links -> available 0) are
// skipped rather than planned against.
check('a store with nothing available is skipped',
  api.planPurchase([{ storeName: 'MargarettingTye', price: 5000, available: 0, limit: 6 }], 5).qty, 0);

// A store with no daily limit must not be flagged as limited.
check('an unlimited-only plan says so',
  api.planPurchase([offers[1]], 5).limited, false);

// --- what the player is shown ---------------------------------------------

const text = api.describePlan(p10, 'perfect negroni', 1000000);
check('the plan spells out the spend', [
  /Buy 10 × perfect negroni\?/.test(text),
  /Total:\s+31,404 Meat for 10 items from 2 stores/.test(text),
  /Average: 3,140 Meat each/.test(text),
  /You have 1,000,000 Meat\./.test(text),
  /cannot be refunded/.test(text),
], [true, true, true, true, true]);

const broke = api.describePlan(p10, 'perfect negroni', 1000);
check('not enough Meat is called out', /WARNING: that is 30,404 Meat more than you have/.test(broke), true);

const shortText = api.describePlan(huge, 'perfect negroni', 99999999);
check('a short plan says how short', /NOTE: 5,229 short of what you asked for/.test(shortText), true);
check('daily limits are disclaimed', /daily limits/.test(shortText), true);

check('an impossible plan says so plainly',
  /^Nothing to buy/.test(api.describePlan(api.planPurchase([], 5), 'perfect negroni', 10)), true);

// The summary the player gets after the run, from what actually happened.
check('the summary reports the real average',
  api.purchaseSummary(10, 31404, 10),
  'Bought 10 for 31,404 Meat — 3,140 Meat each on average.');
check('...and flags a run that came up short',
  /5 short of the 15 asked for/.test(api.purchaseSummary(10, 31404, 15)), true);
check('...and reassures when nothing happened',
  /Your Meat is untouched/.test(api.purchaseSummary(0, 0, 10)), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
