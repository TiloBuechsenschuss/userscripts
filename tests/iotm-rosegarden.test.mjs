// Ad-hoc test for KingdomOfLoathing/iotm.js Black Rose Garden map helpers.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so the dispatch injects nothing), and pulls out the
// pure helpers behind the garden map.
//
// What's pinned here:
//
//   - The game's inline `var RG = {...};` is parsed out of page HTML.
//   - A stored map is merged with each page load: open cells win over hedge, so
//     a grid the server only partly reveals accumulates over visits; points of
//     interest are replaced by id, plaques are a union, position follows the page.
//   - The renderer's position save (choice.php option=4, rgx/rgy/rgf) is parsed.
//   - The drawn area is cropped to the maze plus a one-cell margin.
//   - A map from an earlier KoL day is stale.
//
//   node tests/iotm-rosegarden.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'iotm.js'), 'utf8');

const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
const fakeLocation = { pathname: '/nowhere.php' };

const wrapped = src
  .replace('(function () {', 'globalThis.__iotm = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseRoseGarden, freshMap, mergeMap, isStale, parsePosBody, mapBounds, plaqueLetter, kolDayStamp }; })();');
const fn = new Function('document', 'location', 'localStorage',
  wrapped + '\nreturn globalThis.__iotm;');
const api = fn(fakeDoc, fakeLocation, { getItem: () => null, setItem: () => {}, removeItem: () => {} });

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// A finished garden, trimmed from a real capture (art URLs dropped).
const RG = {"w":31,"grid":"1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111115555555111111111111111111111111500030511111111111111111111111150000351111111111111111111111115410145111111111111111111111111500100511111111111111111111111150000051111111111111111111111115550555111111111111111111111111177077111111111111111111111111117000711111111111111111111111111008001111111111111111111111111170007111111111111111111111111117707711111111111111111111111111110111111111111111111111111111130000140000111111111111111111110111010111011111111111111111111011100011131111111111111111111131110101110111111111111111111114000410000011111111111111111111111111110111111111111111111111111111155055111111111111111111111111115000511111111111111111111111111555051111111111111111111111111154005111111111111111111111111115555511111111111111111111111111111111111111","pos":{"x":15,"y":15,"f":0},"pois":[{"i":0,"x":13,"y":23,"k":"monster","d":1,"label":"Fight giant flamingo statue"},{"i":1,"x":13,"y":9,"k":"monster","d":1,"label":"Fight rose garden gnome"},{"i":2,"x":17,"y":9,"k":"fountain","d":1,"label":"Drink from the blood fountain"},{"i":3,"x":17,"y":23,"k":"food","d":1,"label":"Take the bowl"},{"i":4,"x":19,"y":19,"k":"monster","d":1,"label":"Fight giant flamingo statue"},{"i":5,"x":20,"y":28,"k":"booze","d":1,"label":"Take the bottle of wine"}],"plaques":[{"x":18,"y":7,"f":1,"icon":"icon_u.png"},{"x":14,"y":12,"f":2,"icon":"icon_y.png"},{"x":17,"y":14,"f":0,"icon":"icon_u.png"},{"x":16,"y":18,"f":0,"icon":"icon_c.png"},{"x":16,"y":21,"f":3,"icon":"icon_i.png"},{"x":18,"y":23,"f":1,"icon":"icon_z.png"},{"x":22,"y":22,"f":0,"icon":"icon_f.png"},{"x":24,"y":22,"f":1,"icon":"icon_c.png"}],"mobile":false};
const W = RG.w;
const html = '<script>var x=1;</script><script type="text/javascript">var RG = ' +
  JSON.stringify(RG) + ';</script><script src="three.js"></script>';

// --- parseRoseGarden -----------------------------------------------------
const parsed = api.parseRoseGarden(html);
check('parse: grid length', parsed && parsed.grid.length, 961);
check('parse: pos', parsed && parsed.pos, { x: 15, y: 15, f: 0 });
check('parse: no RG gives null', api.parseRoseGarden('<html>nothing</html>'), null);
check('parse: broken JSON gives null',
  api.parseRoseGarden('<script>var RG = {oops};</script>'), null);

// --- freshMap ------------------------------------------------------------
const fresh = api.freshMap(RG, 1000);
check('fresh: startedAt', fresh.startedAt, 1000);
check('fresh: day is today', fresh.day, api.kolDayStamp());
check('fresh: grid copied', fresh.grid, RG.grid);
check('fresh: pois keyed by id', Object.keys(fresh.pois), ['0', '1', '2', '3', '4', '5']);
check('fresh: poi shape', fresh.pois[2],
  { x: 17, y: 9, k: 'fountain', label: 'Drink from the blood fountain', d: 1 });
check('fresh: plaques copied', fresh.plaques.length, 8);
check('fresh: pos copied', fresh.pos, RG.pos);

// --- isStale -------------------------------------------------------------
check('stale: today is not stale', api.isStale(fresh), false);
check('stale: earlier day is stale', api.isStale({ ...fresh, day: '2000-1-1' }), true);

// --- mergeMap ------------------------------------------------------------
// A first visit that only revealed the start cell and its neighbours.
const cells = RG.grid.split('');
const partialCells = cells.map((c, i) => {
  const x = i % W, y = Math.floor(i / W);
  return Math.abs(x - 15) <= 1 && Math.abs(y - 15) <= 1 ? c : '1';
});
const partial = { ...RG, grid: partialCells.join(''), pois: [], plaques: [], pos: { x: 15, y: 15, f: 0 } };
const m1 = api.freshMap(partial, 1000);
check('merge: partial has fewer open cells',
  m1.grid.split('').filter((c) => c !== '1').length <
  RG.grid.split('').filter((c) => c !== '1').length, true);

// A later visit reveals the rest: open cells accumulate.
const m2 = api.mergeMap(m1, RG);
check('merge: accumulates to the full grid', m2.grid, RG.grid);
check('merge: keeps startedAt', m2.startedAt, 1000);
check('merge: pois taken from the page', Object.keys(m2.pois).length, 6);

// A later visit that reveals less must not erase what is known.
const m3 = api.mergeMap(m2, partial);
check('merge: hedge never overwrites an open cell', m3.grid, RG.grid);
check('merge: pos follows the page', m3.pos, { x: 15, y: 15, f: 0 });

// Plaques are a union by x,y,f; a poi changing to done is picked up.
const withNew = {
  ...RG,
  plaques: RG.plaques.concat([{ x: 1, y: 1, f: 2, icon: 'icon_q.png' }, RG.plaques[0]]),
  pois: RG.pois.map((p) => (p.i === 5 ? { ...p, d: 0 } : p))
};
const m4 = api.mergeMap(m2, withNew);
check('merge: plaque union, no duplicates', m4.plaques.length, 9);
check('merge: poi done flag updated', m4.pois[5].d, 0);

// --- parsePosBody --------------------------------------------------------
check('pos body: match',
  api.parsePosBody('whichchoice=1637&pwd=abc&option=4&rgx=12&rgy=7&rgf=3'),
  { x: 12, y: 7, f: 3 });
check('pos body: other request', api.parsePosBody('whichchoice=1637&pwd=abc&option=2'), null);
check('pos body: not a string', api.parsePosBody(null), null);
check('pos body: out-of-range facing', api.parsePosBody('option=4&rgx=1&rgy=1&rgf=9'), null);

// --- mapBounds -----------------------------------------------------------
check('bounds: maze plus one-cell margin', api.mapBounds(RG.grid, W),
  { x0: 11, x1: 24, y0: 5, y1: 30 });
check('bounds: all hedge falls back to the whole grid',
  api.mapBounds('1'.repeat(961), W), { x0: 0, x1: 30, y0: 0, y1: 30 });
check('bounds: margin clamps at the edge',
  api.mapBounds('0' + '1'.repeat(960), W), { x0: 0, x1: 1, y0: 0, y1: 1 });

// --- plaqueLetter --------------------------------------------------------
check('letter: icon', api.plaqueLetter('icon_u.png'), 'U');
check('letter: blank plaque', api.plaqueLetter(''), '·');
check('letter: unknown name', api.plaqueLetter('mystery.png'), '?');

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
