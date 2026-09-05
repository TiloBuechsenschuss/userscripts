// Ad-hoc test for KingdomOfLoathing/auto-mine.js's ported oreo strategy core.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a mining.php pathname, so the page guard lets the declarations run, but no
// grid, so nothing is injected), and pulls out the DOM-free strategy classes.
//
// The cases are ported from loathers/oreo's own test/strategy.test.ts, kept in
// its order, minus everything that needs KoLmafia (mall pricing, the session
// accounting, the bang-potion identification) and minus the lambda calibration
// harness, which this port deliberately does not carry. THAT IS THE POINT OF
// THIS FILE: the strategy is a translation of someone else's calibrated model,
// so the thing worth testing is that it still answers the way theirs does.
// When oreo changes, re-port from their file rather than adjusting numbers
// here until it goes green.
//
//   node KingdomOfLoathing/test/auto-mine-strategy.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'auto-mine.js'), 'utf8');

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
    '  return { StrategyController, minimumCostPaths, coordinateToIndex, ' +
    'indexToCoordinate, isLegal, oreClusters };');
if (wrapped === src) throw new Error('could not rewrite auto-mine.js for testing');

const fn = new Function('document', 'location', 'window', 'top', wrapped);
fn(fakeDoc, fakeLocation, { localStorage: null }, {});
const { StrategyController, minimumCostPaths, coordinateToIndex, indexToCoordinate, isLegal,
  oreClusters } = globalThis.__am;

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
function throws(label, fn, pattern) {
  try {
    fn();
  } catch (e) {
    if (!pattern || pattern.test(String(e && e.message))) {
      console.log('ok   ' + label);
      return;
    }
    failures++;
    console.log('FAIL ' + label + '\n  wrong message: ' + e.message);
    return;
  }
  failures++;
  console.log('FAIL ' + label + '\n  did not throw');
}

// oreo's own helpers, verbatim in behaviour. A state position is KoL's reading
// order (row 1 at the top); '.' is any dull square.
function mineState(entries) {
  const state = Array(36).fill('.');
  for (const [position, value] of entries) state[position] = value;
  return state.join('');
}

function visibleState(board, opened) {
  const state = Array(36).fill('X');
  for (let index = 0; index < board.length; index++) {
    const row = Math.floor(index / 6);
    const position = (5 - row) * 6 + (index % 6);
    state[position] = opened.has(index) ? 'o' : board[index] === 'e' ? 'X' : '*';
  }
  return state.join('');
}

const make = (strategy, visibility, lambda, values, secondGold, onWarning) =>
  new StrategyController(strategy, visibility, lambda, values, secondGold, onWarning);

// --- geometry -------------------------------------------------------------

check('coordinates round-trip (front row)', indexToCoordinate(coordinateToIndex([1, 6])), [1, 6]);
check('coordinates round-trip (back row)', indexToCoordinate(coordinateToIndex([6, 1])), [6, 1]);
check('the front row is always reachable', isLegal(0, new Set()), true);
check('the back row is not, on its own', isLegal(35, new Set()), false);
check('...but is once a neighbour is open', isLegal(35, new Set([29])), true);
check('an open square is not a target', isLegal(0, new Set([0])), false);
// The vein shapes are enumerated once and are the whole basis of ev-cluster.
check('there are 1226 six-square veins in the back four rows', oreClusters().length, 1226);

// Dijkstra, including the cheapest-route-not-shortest-route case.
check('the cheapest route is taken, not the shortest',
  minimumCostPaths(new Set(), [0], (index) =>
    [0, 6, 7, 8].includes(index) ? 1 : [1, 2].includes(index) ? 10 : 100).get(2),
  { cost: 14, path: [0, 6, 7, 8, 2] });

// --- resetting once the cavern has nothing left ---------------------------

const resumed = make('ev', 'high', 1, { ore: 0, gold: 10000, crystal: 0, cave: 0 });
resumed.update(mineState([[30, 'o'], [31, 'o'], [24, '*']]), true,
  [[[1, 6], 'gold'], [[2, 6], 'gold']]);
check('both golds found means leave', resumed.decide().action, 'reset');

const oneGoldState = mineState([[30, 'o'], [24, '*']]);
const exhaustedGold = make('ev', 'high', 1, { ore: 0, gold: 10000, crystal: 0, cave: 0 }, 0);
exhaustedGold.update(oneGoldState, true, [[[1, 6], 'gold']]);
check('with no second gold assumed, one gold is the lot', exhaustedGold.decide().action, 'reset');

const remainingGold = make('ev', 'high', 1, { ore: 0, gold: 10000, crystal: 0, cave: 0 }, 1);
remainingGold.update(oneGoldState, true, [[[1, 6], 'gold']]);
check('with a second gold certain, keep digging', remainingGold.decide().action, 'mine');

throws('a nonsense second-gold chance is refused',
  () => make('ev', 'low', 0, undefined, 1.01), /between zero and one/);

for (const [resource, count] of [['ore', 6], ['crystal', 3]]) {
  const controller = make('ev', 'high', 1, {
    ore: resource === 'ore' ? 10000 : 0,
    gold: 0,
    crystal: resource === 'crystal' ? 10000 : 0,
    cave: 0,
  });
  const observations = Array.from({ length: count },
    (_, index) => [indexToCoordinate(index), resource]);
  controller.update(
    mineState([...Array.from({ length: count }, (_, index) => [30 + index, 'o']), [24, '*']]),
    true, observations);
  check('all ' + count + ' ' + resource + ' found means leave', controller.decide().action,
    'reset');
}

// --- what the layout is for -----------------------------------------------
//
// A cave-in is evidence: it proves that square was not ore, which raises what
// the rest of the cavern is worth. Without the remembered layout the same
// board is not worth another turn.

const resumedCaveState = mineState([[30, 'o'], [31, '*']]);
const withoutCave = make('ev', 'low', 1750, { ore: 0, gold: 10000, crystal: 0, cave: 0 });
withoutCave.update(resumedCaveState, false);
check('without the layout, the cavern is not worth a turn', withoutCave.decide().action, 'reset');
const withCave = make('ev', 'low', 1750, { ore: 0, gold: 10000, crystal: 0, cave: 0 });
withCave.update(resumedCaveState, false, [[[1, 6], 'cave']]);
check('a remembered cave-in makes it worth one', withCave.decide().action, 'mine');

// --- ore evidence steers the route ----------------------------------------

const oreEvidence = make('ev', 'low', 1, { ore: 10000, gold: 0, crystal: 0, cave: 0 }, 0);
oreEvidence.update(mineState([[24, 'o'], [28, 'o'], [18, '*'], [22, '*']]), false,
  [[indexToCoordinate(6), 'cave'], [indexToCoordinate(10), 'ore']]);
check('digs beside the ore it already found', oreEvidence.decide().coordinate, [5, 4]);

// --- the community strategies ---------------------------------------------

const pjb = make('pjb', 'low');
pjb.update(mineState([[30, '*']]), false);
const pjbDecision = pjb.decide();
check('pjb takes the first accessible front-two-row sparkle',
  [pjbDecision.action, pjbDecision.coordinate, pjbDecision.reason],
  ['mine', [1, 6], 'mining the first accessible front-two-row sparkle']);

const legalPjb = make('pjb', 'high');
legalPjb.update(mineState([[24, '*']]), true);
check('pjb will not chase an unreachable sparkle',
  [legalPjb.decide().action, legalPjb.decide().coordinate], ['mine', [4, 6]]);

const oreo = make('oreo', 'high');
oreo.update(mineState([[25, '*'], [26, '*'], [28, '*']]), true);
check('oreo opens above the longest second-row vein', oreo.decide().coordinate, [2, 6]);

// --- lambda, and what it buys ---------------------------------------------

const lowEv = make('ev-cluster', 'low');
lowEv.update(mineState([[0, '*']]), false);
check('with nothing visible, ev-cluster probes the centre', lowEv.decide().coordinate, [4, 6]);
lowEv.setDynamitePrice(5500);
check('dynamite dearer than a turn is not worth it', lowEv.shouldUseDynamite(), false);
lowEv.setDynamitePrice(3500);
check('dynamite cheaper than a turn is', lowEv.shouldUseDynamite(), true);

const overriddenEv = make('ev', 'low', 6000);
overriddenEv.setDynamitePrice(5500);
check('a lambda override moves that line too', overriddenEv.shouldUseDynamite(), true);

// The calibrated defaults, which is the whole of what this port keeps from
// oreo's calibration harness. If these drift, the port is no longer oreo.
const lambdas = {};
for (const strategy of ['ev', 'ev-cluster']) {
  const seen = make(strategy, 'high');
  seen.update(mineState([[0, '*']]), true);
  const unseen = make(strategy, 'low');
  unseen.update(mineState([[0, '*']]), false);
  lambdas[strategy] = [unseen.turnValue(), seen.turnValue()];
}
check('calibrated lambdas, [low visibility, high visibility]', lambdas,
  { ev: [3571, 3571], 'ev-cluster': [3714, 3500] });

// --- dynamite has to be held, not merely affordable -----------------------

const pricedRoute = mineState([[24, '*'], [33, 'o']]);
const noDynamite = make('ev', 'high');
noDynamite.update(pricedRoute, true);
check('a route of paid turns is not worth it', noDynamite.decide().action, 'reset');
const freeDynamite = make('ev', 'high');
freeDynamite.setDynamitePrice(0);
freeDynamite.setDynamiteAvailable(1);
freeDynamite.update(pricedRoute, true);
check('free dynamite in hand makes it worth it', freeDynamite.decide().action, 'mine');
const unavailableDynamite = make('ev', 'high');
unavailableDynamite.setDynamitePrice(0);
unavailableDynamite.update(pricedRoute, true);
check('a price with no stick in hand buys nothing', unavailableDynamite.decide().action, 'reset');
throws('a negative stick count is refused',
  () => unavailableDynamite.setDynamiteAvailable(-1), /non-negative integer/);
throws('a negative price is refused',
  () => unavailableDynamite.setDynamitePrice(-1), /non-negative/);

// --- what Object Detection is remembered for ------------------------------

const remembered = make('ev-cluster', 'auto');
remembered.update(mineState([[0, '*']]), true);
check('auto visibility never asks for a potion', remembered.needsObjectDetection(), false);
const first = remembered.decide();
check('a revealed deep sparkle is routed to', [first.action, first.coordinate], ['mine', [1, 6]]);
remembered.recordMine(first.coordinate, null);
remembered.update(mineState([[30, 'o']]), false);
const second = remembered.decide();
check('the reveal is remembered after the effect lapses',
  [second.action, second.coordinate], ['mine', [1, 5]]);
remembered.reset();
check('a new cavern forgets it', remembered.needsObjectDetection(), false);

const highMemory = make('ev-cluster', 'high');
check('high visibility wants a potion first', highMemory.needsObjectDetection(), true);
highMemory.update(mineState([[0, '*']]), true);
check('...and not once it has seen the cavern', highMemory.needsObjectDetection(), false);
highMemory.update(mineState([[30, 'o']]), false);
check('...even after the effect lapses', highMemory.needsObjectDetection(), false);
highMemory.reset();
check('...until the next cavern', highMemory.needsObjectDetection(), true);

// --- visibility changes which square is best ------------------------------

const deepSparkle = mineState([[0, '*']]);
const lowVisibility = make('ev', 'low');
lowVisibility.update(deepSparkle, true);
check('low visibility ignores what it was shown', lowVisibility.decide().coordinate, [4, 6]);
const highVisibility = make('ev', 'high');
highVisibility.update(deepSparkle, true);
check('high visibility routes to the back row', highVisibility.decide().coordinate, [1, 6]);
const automaticVisibility = make('ev', 'auto');
automaticVisibility.update(deepSparkle, false);
check('auto without the effect behaves as low', automaticVisibility.decide().coordinate, [4, 6]);
automaticVisibility.update(deepSparkle, true);
check('auto with the effect behaves as high', automaticVisibility.decide().coordinate, [1, 6]);

// --- a state we cannot read is not a state --------------------------------

const unavailableState = make('ev', 'low');
unavailableState.update('short', false);
check('a truncated state is admitted, not guessed at', unavailableState.decide(),
  { action: 'reset', reason: 'mine state is unavailable' });

// --- the impossible-cluster fallback --------------------------------------
//
// Warned once per cavern, not once per decision: a board that contradicts
// every vein shape will contradict it again on the next turn, and a log line
// per turn would bury everything else.

const lostLayoutWarnings = [];
const lostLayout = make('ev-cluster', 'high', 1, { ore: 10000, gold: 0, crystal: 0, cave: 0 },
  0.496, (warning) => lostLayoutWarnings.push(warning));
lostLayout.update(visibleState('eceeereeeeeeregereceeeeegceeecoooooo', new Set([31])), true);
lostLayout.decide();
check('a consistent board warns about nothing', lostLayoutWarnings, []);

const impossibleWarnings = [];
const impossibleCluster = make('ev-cluster', 'high', 1,
  { ore: 10000, gold: 0, crystal: 0, cave: 0 }, 0.496,
  (warning) => impossibleWarnings.push(warning));
const contradictoryState = visibleState('oooooooooooooooooooooooooooooooooooo',
  new Set([12, 35]));
const contradictoryLayout = [[indexToCoordinate(12), 'ore'], [indexToCoordinate(35), 'ore']];
impossibleCluster.update(contradictoryState, true, contradictoryLayout);
impossibleCluster.decide();
impossibleCluster.decide();
check('an impossible board warns once', impossibleWarnings.length, 1);
impossibleCluster.reset();
impossibleCluster.update(contradictoryState, true, contradictoryLayout);
impossibleCluster.decide();
check('...and once again in the next cavern', impossibleWarnings.length, 2);

// --- a sparkle that gave nothing was a cave-in ----------------------------
//
// Ours, not oreo's: KoLmafia reads this off an inventory delta and we read it
// off the response page, so the inference is worth pinning on our side.

const inferred = make('ev', 'low');
inferred.update(mineState([[30, '*']]), false);
inferred.recordMine([1, 6], null);
check('a sparkle with no item is recorded as a cave-in',
  inferred.observed.get(coordinateToIndex([1, 6])), 'cave');
const dullDig = make('ev', 'low');
dullDig.update(mineState([[30, '.']]), false);
dullDig.recordMine([1, 6], null);
check('a dull square with no item is recorded as nothing',
  dullDig.observed.has(coordinateToIndex([1, 6])), false);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
