// Ad-hoc test for TwilightHeroes/puzzle-solver.js -- the Goldbergium Door solver.
//
// Same pattern as quest-helper.test.mjs: no test runner in this repo, so this is
// a standalone Node script that evaluates the userscript's IIFE against a stub
// DOM (no puzzle present, so nothing is injected and detect() is a no-op) and
// pulls out the Goldbergium module's internals to validate the chain solver
// against the real component matrix from the wiki.
//
//   node TwilightHeroes/test/puzzle-solver.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, '..', 'puzzle-solver.js');
const src = readFileSync(scriptPath, 'utf8');

// Stub DOM/location: fight.php so the page gate passes; querySelector returns
// nothing so both modules' run() short-circuit in detect()/isEmptyState() and
// touch no further DOM. We only want the internals.
const fakeDoc = {
  querySelectorAll: () => [],
  querySelector: () => null,
  body: { textContent: '' },
};
const fakeLocation = { pathname: '/fight.php' };

// Minimal localStorage mock so the solution persistence helpers are testable.
const lsStore = new Map();
const mockLS = {
  getItem: (k) => (lsStore.has(k) ? lsStore.get(k) : null),
  setItem: (k, v) => { lsStore.set(k, String(v)); },
  removeItem: (k) => { lsStore.delete(k); },
};

const wrapped = src
  .replace('(function () {', 'globalThis.__ps = (function () {')
  .replace(/\}\)\(\);\s*$/, 'return { BitPlayer, Goldbergium }; })();');
const fn = new Function('document', 'location', 'localStorage', wrapped + '\nreturn globalThis.__ps;');
const api = fn(fakeDoc, fakeLocation, mockLS);
const G = api.Goldbergium;

let failures = 0;
function ok(cond, msg) {
  if (!cond) failures++;
  console.log((cond ? 'PASS' : 'FAIL'), '|', msg);
}

// Turn a chain into a readable "a -> b -> ... -> goal" action trail.
function trail(chain) {
  if (!chain || !chain.length) return '(none)';
  return chain[0].input + ' -> ' + chain.map((c) => c.output).join(' -> ');
}

// Validate a returned chain against the rules and the matrix.
function validate(goalAction, chain) {
  if (!Array.isArray(chain) || chain.length < G.MIN_CHAIN) return 'too short / null';
  const seen = new Set();
  for (let i = 0; i < chain.length; i++) {
    const c = chain[i];
    if (G.COMPONENTS[c.input] == null || G.COMPONENTS[c.input][c.output] !== c.name)
      return `component ${c.name} not at [${c.input}][${c.output}] in matrix`;
    if (c.input === c.output) return `diagonal edge at ${c.name}`;
    const edge = c.input + '>' + c.output;
    if (seen.has(edge)) return `reused component/edge ${edge}`;
    seen.add(edge);
    if (i > 0 && chain[i - 1].output !== c.input)
      return `break between ${chain[i - 1].name} and ${c.name}`;
  }
  if (chain[chain.length - 1].output !== goalAction) return 'final output != goal';
  return null;
}

// --- Matrix sanity: 56 components, no diagonal, all names unique ---
const allNames = [];
let diag = 0;
for (const input of G.ACTIONS) {
  for (const output of G.ACTIONS) {
    const n = G.COMPONENTS[input] && G.COMPONENTS[input][output];
    if (n) { allNames.push(n); if (input === output) diag++; }
  }
}
ok(allNames.length === 56, `matrix has 56 components (got ${allNames.length})`);
ok(diag === 0, `matrix has no diagonal (input===output) entries (got ${diag})`);
ok(new Set(allNames).size === allNames.length, 'all component names are unique');

// --- Every goal action is solvable when all components are available ---
for (const goal of G.ACTIONS) {
  const chain = G.solve(goal, null);
  const err = validate(goal, chain);
  ok(err === null, `solve(${goal}) -> valid chain [${chain ? chain.length : 0}]: ${trail(chain)}`
    + (err ? `  ERR: ${err}` : ''));
}

// --- Every input action (matrix row) maps to a Shiloh subzone ---
ok(G.ACTIONS.every((a) => typeof G.ZONES[a] === 'string' && G.ZONES[a].length > 0),
  'every input action maps to a non-empty Shiloh subzone name');

// --- GOAL_TO_ACTION maps only to real actions ---
for (const [phrase, action] of Object.entries(G.GOAL_TO_ACTION)) {
  ok(G.ACTIONS.includes(action), `goal "${phrase}" maps to a real action (${action})`);
}

// --- Constrained inventory: solver must respect availability ---
// With no components owned, there is no chain.
ok(G.solve('cutting', new Set()) === null, 'empty inventory -> no solution');

// A minimal hand-built path of 5 owned components ending in "cutting" must work:
//   heating -> watering -> startling -> shooting -> crushing -> cutting
const owned = new Set([
  G.COMPONENTS.heating.watering,   // heating -> watering
  G.COMPONENTS.watering.startling, // watering -> startling
  G.COMPONENTS.startling.shooting, // startling -> shooting
  G.COMPONENTS.shooting.crushing,  // shooting -> crushing
  G.COMPONENTS.crushing.cutting,   // crushing -> cutting (final = goal)
]);
{
  const chain = G.solve('cutting', owned);
  const err = validate('cutting', chain);
  ok(err === null && chain.every((c) => owned.has(c.name)),
    `constrained solve(cutting) uses only owned parts: ${trail(chain)}`
    + (err ? `  ERR: ${err}` : ''));
}

// --- Goal parsing from live prose (guards the 'oily rope' false match) ---
// The real goldberg.php body has the goal sentence followed by the component
// dropdown, which includes "weight on an oily rope". The goal must read as
// startling (from "sleeping toad"), NOT heating (from 'oily rope').
const liveBody =
  'You check the nearby rocks ... but you notice a sleeping toad with a ' +
  'key-shaped bulge in its stomach hidden down a tiny winding tunnel. ... ' +
  'bottle rocket (1) ... weight on an oily rope (1) ... water saw (4)';
ok(G.goalActionFromText(liveBody) === 'startling',
  `goalActionFromText reads "sleeping toad" as startling (not 'oily rope'): ${G.goalActionFromText(liveBody)}`);
ok(G.goalActionFromText('you notice a tough sack that holds a key hidden down a tiny winding tunnel') === 'cutting',
  'goalActionFromText reads "tough sack" as cutting');
ok(G.goalActionFromText("there's a jar with a key in it down a winding little tunnel") === 'shooting',
  'goalActionFromText handles the contraption-built wording');
ok(G.goalActionFromText('nothing relevant here') === null,
  'goalActionFromText returns null when no goal sentence is present');

// --- Component parsing from dropdown option texts ---
const parsed = G.componentsFromOptionTexts([
  'bottle rocket (1)', 'water saw (4)', '"unpoppable" balloon (1)', '',
]);
ok(parsed.has('bottle rocket') && parsed.has('water saw')
  && parsed.has('"unpoppable" balloon') && !parsed.has(''),
  'componentsFromOptionTexts strips " (count)" and drops blanks');

const counts = G.parseOptionCounts(['bottle rocket (1)', 'water saw (4)', 'gong', '']);
ok(counts.get('bottle rocket') === 1 && counts.get('water saw') === 4
  && counts.get('gong') === 1 && !counts.has(''),
  'parseOptionCounts reads counts (default 1 when no "(N)", drops blanks)');

// --- Placed-parts parsing from the build-state prose ---
ok(JSON.stringify(G.placedFromText("So far you have the bottle rocket. That's a start")) === '["bottle rocket"]',
  'placedFromText reads a single placed part');
ok(JSON.stringify(G.placedFromText(
  'So far you have the bottle rocket connected to the gong connected to the dry cat. That gets'))
  === '["bottle rocket","gong","dry cat"]',
  'placedFromText reads a chain of placed parts in order');
ok(G.placedFromText('nothing relevant here').length === 0,
  'placedFromText returns [] when not building');

// --- Solution persistence round-trip ---
G.saveSolution('startling', [{ name: 'bottle rocket', input: 'heating', output: 'shooting' }]);
const loaded = G.loadSolution();
ok(loaded && loaded.goal === 'startling' && loaded.chain[0].name === 'bottle rocket',
  'saveSolution/loadSolution round-trips the stored plan');
G.clearSolution();
ok(G.loadSolution() === null, 'clearSolution removes the stored plan');

// --- Live scenario: this player's actual 37 components, goal = startling ---
const liveOwned = new Set([
  'bottle rocket', 'boxing glove gun', 'brazier of coals', 'bucket and pulley',
  'chalkboard', 'cork gun', 'corked bellows', 'corked hose', 'dry cat',
  'dunk tank', 'giant mousetrap', 'gigantic bicycle horn', 'gong',
  'hanging anvil', 'hinged mallet', 'inert electric knife', 'inert winch',
  'leaning tower', 'leg on a hinge', 'mousetrap car', 'restrained boulder',
  'restrained slingshot', 'rusty hinge', 'sleeping elephant', 'sleeping fire ant',
  'sleeping gorilla', 'sleeping monkey', 'sleeping rhino', 'sleepy draft horse',
  'sprinkler', 'steam-powered chainsaw', 'tough water balloon', 'water basin',
  'water main', 'water mill', 'water saw', 'weight on an oily rope',
]);
{
  const chain = G.solve('startling', liveOwned);
  const err = validate('startling', chain);
  ok(err === null && chain.every((c) => liveOwned.has(c.name)),
    `live solve(startling) uses only the 37 owned parts: ${trail(chain)}`
    + (err ? `  ERR: ${err}` : ''));
}

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
