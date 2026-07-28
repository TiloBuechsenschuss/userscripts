// Ad-hoc test for KingdomOfLoathing/quest-helper.js pyramid rotation logic.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so nothing is injected), and pulls out the
// 'rotation' handler's DOM-free helpers to assert the Lower Chambers state
// machine and the advice it produces.
//
// The mechanics under test, from the wiki's Quest for the Holy MacGuffin
// walkthrough: from a fresh pyramid at position 1, 3 turns of the peg reach
// position 4 (token), 4 more reach position 3 (bomb), 3 more reach position 1
// (blow the rubble) -- 10 turns, 2 full cycles, which only works out if a turn
// advances the position by exactly one, wrapping 5 -> 1.
//
//   node KingdomOfLoathing/test/quest-helper-rotation.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'quest-helper.js'), 'utf8');

// Stub globals. The pathname has to be one the script accepts, or it bails on
// its very first line before declaring anything; nothing on the stub page
// matches a puzzle, so no handler runs either way.
const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  images: [],
};
const fakeLocation = { pathname: '/choice.php' };

// Re-expose the IIFE's internals. Unlike the iotm tests we can't append the
// return after the IIFE body -- the script's page dispatch bails early -- so
// hand the helpers back at the dispatch line instead, by which point every
// declaration above it is initialised.
const wrapped = src
  .replace('(function () {', 'globalThis.__qh = (function () {')
  .replace('const puzzle = currentPuzzle();',
    'return { turnsTo, advance, rotationTarget, applyVisit, unapplyVisit, ' +
    'applyTurn, turnsRemaining, stateSig, alreadyVisited, rotationAdvice, ' +
    'positionOutcome };');
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

const EMPTY = { token: false, bomb: false, open: false };
const TOKEN = { token: true, bomb: false, open: false };
const BOMB = { token: false, bomb: true, open: false };
const OPEN = { token: false, bomb: false, open: true };

// --- the turntable --------------------------------------------------------

check('turnsTo wraps forward only', [
  api.turnsTo(1, 4), api.turnsTo(4, 3), api.turnsTo(3, 1), api.turnsTo(2, 2),
], [3, 4, 3, 0]);

check('advance wraps 5 -> 1', [
  api.advance(1, 3), api.advance(4, 4), api.advance(3, 3), api.advance(5, 1),
], [4, 3, 1, 1]);

// The wiki's 10-turn walkthrough, position by position.
check('walkthrough: 3 turns from a fresh pyramid reach the token basket',
  api.advance(1, 3), 4);
check('walkthrough: 4 more reach the bomb machine', api.advance(4, 4), 3);
check('walkthrough: 3 more reach the rubble', api.advance(3, 3), 1);

// --- what each stop does to you -------------------------------------------

check('position 4 empty-handed gives the token', api.applyVisit(EMPTY, 4), TOKEN);
check('position 4 holding the token does nothing', api.applyVisit(TOKEN, 4), TOKEN);
check('position 4 holding the bomb does nothing', api.applyVisit(BOMB, 4), BOMB);
check('position 3 spends the token on the bomb', api.applyVisit(TOKEN, 3), BOMB);
check('position 3 without a token does nothing', api.applyVisit(EMPTY, 3), EMPTY);
check('position 1 with the bomb opens the chamber', api.applyVisit(BOMB, 1), OPEN);
check('position 1 without the bomb does nothing', api.applyVisit(EMPTY, 1), EMPTY);
check('the rat positions never do anything', [
  api.applyVisit(EMPTY, 2), api.applyVisit(TOKEN, 2), api.applyVisit(BOMB, 5),
], [EMPTY, TOKEN, BOMB]);

check('undo reverses each transition exactly', [
  api.unapplyVisit(TOKEN, 4), api.unapplyVisit(BOMB, 3), api.unapplyVisit(OPEN, 1),
], [EMPTY, TOKEN, BOMB]);
check('undo of a no-op trip changes nothing', api.unapplyVisit(EMPTY, 2), EMPTY);

// Turning the peg after the rubble is blown re-buries it; loot is safe.
check('a turn re-buries the opened chamber', api.applyTurn(OPEN, 1), EMPTY);
check('a turn keeps your token', api.applyTurn(TOKEN, 3), TOKEN);
check('zero turns change nothing', api.applyTurn(OPEN, 0), OPEN);

// --- targets and costs ----------------------------------------------------

check('targets follow token -> bomb -> rubble -> stop', [
  api.rotationTarget(EMPTY), api.rotationTarget(TOKEN),
  api.rotationTarget(BOMB), api.rotationTarget(OPEN),
], [4, 3, 1, null]);

check('a fresh pyramid costs the wiki\'s 10 wheels', api.turnsRemaining(1, EMPTY), 10);
check('standing on the token basket still costs 7', api.turnsRemaining(4, EMPTY), 7);
check('holding the token from position 4 costs 7', api.turnsRemaining(4, TOKEN), 7);
check('holding the bomb from position 3 costs 3', api.turnsRemaining(3, BOMB), 3);
check('an opened chamber costs nothing more', api.turnsRemaining(1, OPEN), 0);

// A full simulated run: 10 turns and 3 trips, ending with Ed's chamber open.
let pos = 1;
let state = EMPTY;
let turnsSpent = 0;
for (let trip = 0; trip < 3; trip++) {
  const target = api.rotationTarget(state);
  const n = api.turnsTo(pos, target);
  turnsSpent += n;
  pos = api.advance(pos, n);
  state = api.applyVisit(state, pos);
}
check('simulated run spends 10 turns', turnsSpent, 10);
check('simulated run ends at position 1 with the chamber open', [pos, state], [1, OPEN]);
check('simulated run is over', api.rotationTarget(state), null);

// --- the "already been here with this setup" log --------------------------

check('signatures distinguish setups', [
  api.stateSig(EMPTY), api.stateSig(TOKEN), api.stateSig(BOMB), api.stateSig(OPEN),
], ['---', 'T--', '-B-', '--O']);

const log = [{ pos: 2, sig: '---' }, { pos: 4, sig: '---' }];
check('same position, same setup is a repeat', api.alreadyVisited(log, 2, EMPTY), true);
check('same position, different setup is not', api.alreadyVisited(log, 2, TOKEN), false);
check('unvisited position is not', api.alreadyVisited(log, 5, EMPTY), false);

// --- the advice -----------------------------------------------------------

const atTarget = api.rotationAdvice(4, EMPTY, [], true);
check('standing on the target says go', atTarget.tone, 'go');

const away = api.rotationAdvice(1, EMPTY, [], true);
check('three positions short says turn', away.tone, 'turn');
check('...and names the count', /Turn the peg 3 more times/.test(away.headline), true);

const done = api.rotationAdvice(1, OPEN, [], true);
check('an opened chamber says stop', done.tone, 'stop');
check('...and warns against turning again',
  done.lines.some((l) => /re-buries/.test(l)), true);

const repeat = api.rotationAdvice(2, EMPTY, [{ pos: 2, sig: '---' }], true);
check('a repeat visit is called out',
  repeat.lines.some((l) => /gave you nothing then either/.test(l)), true);

const broke = api.rotationAdvice(1, EMPTY, [], false);
check('no peg option means no wheels left',
  broke.lines.some((l) => /crumbling wooden wheels/.test(l)), true);

check('outcome text depends on what you carry', [
  /free ancient bronze token/.test(api.positionOutcome(4, EMPTY)),
  /already have what a token is for/.test(api.positionOutcome(4, TOKEN)),
  /30-35 HP/.test(api.positionOutcome(2, EMPTY)),
  /rubble goes away/.test(api.positionOutcome(1, BOMB)),
], [true, true, true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
