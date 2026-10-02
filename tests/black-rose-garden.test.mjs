// Ad-hoc test for KingdomOfLoathing/standalone/black-rose-garden.js map helpers.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so the dispatch injects nothing), and pulls out the
// pure helpers behind the garden map.
//
// What's pinned here:
//
//   - The game's inline `var RG = {...};` is parsed out of page HTML.
//   - A stored map is merged with each page load: the grid is the page's (it is
//     the whole maze from the first visit of a day); points of interest are
//     replaced by id, plaques are a union, position follows the page.
//   - A page whose hedge layout differs from the stored map is a new garden and
//     starts a new map; one that differs only off the hedge is the same garden.
//   - The renderer's position save (choice.php option=4, rgx/rgy/rgf) is parsed.
//   - The drawn area is cropped to the maze plus a one-cell margin.
//
//   node tests/black-rose-garden.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'standalone', 'black-rose-garden.js'), 'utf8');

const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
const fakeLocation = { pathname: '/nowhere.php' };

const wrapped = src
  .replace('(function () {', 'globalThis.__iotm = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseRoseGarden, freshMap, mergeMap, sameGarden, parsePosBody, mapBounds, plaqueLetter }; })();');
const fn = new Function('document', 'location', 'localStorage',
  wrapped + '\nreturn globalThis.__iotm;');
const api = fn(fakeDoc, fakeLocation, { getItem: () => null, setItem: () => {}, removeItem: () => {} });

let failures = 0;

// The map code is carried by iotm.js too, as a copy, so the two must not drift apart.
const lf = (s) => s.replace(/\r\n/g, '\n');
const iotmSrc = lf(readFileSync(join(here, '..', 'KingdomOfLoathing', 'iotm.js'), 'utf8'));
const mapSection = (s, end) => s.slice(s.indexOf('  // === Black Rose Garden map'), s.indexOf(end)).trim();
const iotmMap = mapSection(iotmSrc, '  // --- Dispatch');
const standaloneMap = mapSection(lf(src), '\n  initRoseGarden();\n})();');

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
check('fresh: grid copied', fresh.grid, RG.grid);
check('fresh: pois keyed by id', Object.keys(fresh.pois), ['0', '1', '2', '3', '4', '5']);
check('fresh: poi shape', fresh.pois[2],
  { x: 17, y: 9, k: 'fountain', label: 'Drink from the blood fountain', d: 1 });
check('fresh: plaques copied', fresh.plaques.length, 8);
check('fresh: pos copied', fresh.pos, RG.pos);

// --- sameGarden ----------------------------------------------------------
const cells = RG.grid.split('');
// Off the hedge only: the start cell turned into plain floor.
const offHedge = cells.slice(); offHedge[15 * W + 15] = '0';
// The hedge itself: one floor cell walled up.
const otherMaze = cells.slice(); otherMaze[15 * W + 14] = '1';
check('same garden: identical grid', api.sameGarden(RG.grid, RG.grid), true);
check('same garden: a change off the hedge', api.sameGarden(RG.grid, offHedge.join('')), true);
check('same garden: wall art counts as hedge',
  api.sameGarden(RG.grid, RG.grid.replace(/5/g, '1')), true);
check('new garden: hedge moved', api.sameGarden(RG.grid, otherMaze.join('')), false);
check('new garden: other size', api.sameGarden(RG.grid, RG.grid.slice(1)), false);

// --- mergeMap ------------------------------------------------------------
const m1 = api.freshMap(RG, 1000);
const later = { ...RG, grid: offHedge.join(''), pos: { x: 15, y: 16, f: 2 } };
const m2 = api.mergeMap(m1, later, 5000);
check('merge: same garden keeps startedAt', m2.startedAt, 1000);
check('merge: grid is the page grid', m2.grid, later.grid);
check('merge: pos follows the page', m2.pos, { x: 15, y: 16, f: 2 });
check('merge: pois taken from the page', Object.keys(m2.pois).length, 6);

// A new day's garden replaces the map, without asking for a reset.
const nextDay = { ...RG, grid: otherMaze.join(''), pois: [], plaques: [] };
const m3 = api.mergeMap(m1, nextDay, 9000);
check('merge: new garden starts a new map', m3.startedAt, 9000);
check('merge: new garden drops old plaques', m3.plaques.length, 0);
check('merge: new garden drops old pois', Object.keys(m3.pois).length, 0);

// Plaques are a union by x,y,f; a poi changing to done is picked up.
const withNew = {
  ...RG,
  plaques: RG.plaques.concat([{ x: 1, y: 1, f: 2, icon: 'icon_q.png' }, RG.plaques[0]]),
  pois: RG.pois.map((p) => (p.i === 5 ? { ...p, d: 0 } : p))
};
const m4 = api.mergeMap(m2, withNew, 6000);
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

// --- the copy in iotm.js: the two files must not drift apart ---------
check('map section found in both files', iotmMap.length > 1000 && standaloneMap.length > 1000, true);
check('map section identical in iotm.js and standalone', iotmMap === standaloneMap, true);

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
