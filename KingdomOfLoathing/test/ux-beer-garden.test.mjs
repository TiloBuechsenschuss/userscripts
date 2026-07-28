// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js beer garden guard.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so no feature runs), and pulls out the beer garden
// helpers to assert the yield table and how the crop is read off the page.
//
// The numbers come from the wiki's A Beer Garden growth table. The one that
// matters is day 1: three barley, three hops, and NO fancy bottle or label --
// that's the harvest this whole feature exists to stop.
//
//   node KingdomOfLoathing/test/ux-beer-garden.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// A stub page with no images and a pathname matching no feature, so run() at
// the bottom of the IIFE is a no-op and we only get the helpers.
const images = [];
const fakeDoc = {
  images,
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
    'return { beerYield, beerYieldText, unripeMessage, findBeerGarden, ' +
    'findHarvestTrigger, BEER_RIPE_DAYS }; })();');
const fn = new Function('document', 'location', 'window',
  wrapped + '\nreturn globalThis.__ux;');
const api = fn(fakeDoc, fakeLocation, { confirm: () => true });

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- the wiki's yield table -----------------------------------------------

const grain = (d) => [api.beerYield(d).barley, api.beerYield(d).hops];
check('barley and hops are 3 per day', [
  grain(0), grain(1), grain(2), grain(3), grain(7),
], [[0, 0], [3, 3], [6, 6], [9, 9], [21, 21]]);

check('growth past day 7 adds nothing', [grain(8), grain(30)], [[21, 21], [21, 21]]);
check('a negative day count can\'t escape the table', grain(-1), [0, 0]);

check('every day has fancy-item text', [0, 1, 2, 3, 4, 5, 6, 7].map(
  (d) => typeof api.beerYield(d).fancy === 'string'),
[true, true, true, true, true, true, true, true]);

// The whole point: day 1 yields no fancy items, day 2 yields the first.
check('day 1 gives no fancy bottle or label',
  /^no fancy/.test(api.beerYield(1).fancy), true);
check('day 2 gives the first one',
  /^1 fancy bottle or label/.test(api.beerYield(2).fancy), true);
check('the ripe threshold is the day the fancy items start',
  api.BEER_RIPE_DAYS, 2);

// --- the confirm() text ---------------------------------------------------

const day1 = api.unripeMessage(1);
check('the warning says what you\'d lose', [
  /only 1 day of growth/.test(day1),
  /3 barley, 3 hops, and no fancy bottle or label/.test(day1),
  /6 barley, 6 hops, and 1 fancy bottle or label/.test(day1),
  /Harvest anyway\?$/.test(day1),
], [true, true, true, true]);

const day0 = api.unripeMessage(0);
check('an empty garden reads sensibly', /Nothing has grown in it yet/.test(day0), true);

// --- reading the crop off the page ----------------------------------------

const img = (src) => ({
  getAttribute: (n) => (n === 'src' ? src : null),
  closest: () => null,
  dataset: {},
  style: {},
});

check('no garden on the page is not an error', api.findBeerGarden(), null);

images.push(img('/images/otherimages/campground/pyramid.gif'));
check('an unrelated campground image is ignored', api.findBeerGarden(), null);

images.push(img('/images/otherimages/beergarden1.gif'));
check('the crop artwork gives the days of growth',
  api.findBeerGarden().days, 1);

images.length = 0;
images.push(img('/images/otherimages/beergarden7.gif'));
check('...at the top of the table too', api.findBeerGarden().days, 7);

images.length = 0;
images.push(img('/images/otherimages/beergarden0.gif'));
check('...and for a freshly planted one', api.findBeerGarden().days, 0);

// Another crop must not be mistaken for a beer garden -- the guard has to stay
// silent rather than block a harvest it knows nothing about.
images.length = 0;
images.push(img('/images/otherimages/winter_garden3.gif'));
images.push(img('/images/otherimages/rockgarden2.gif'));
check('a different crop leaves the guard out of it', api.findBeerGarden(), null);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
