// Ad-hoc test for KingdomOfLoathing/iotm.js Play Ball refusal classification.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so the dispatch injects nothing) plus a stub
// localStorage, and pulls out the baseball "spent for the day" helpers.
//
//   node KingdomOfLoathing/test/iotm-ball-refusal.test.mjs
//
// What matters here: the diamond has no page flag for its daily inning limit,
// so the button's subdued "spent" state rests entirely on sniffing the refusal
// text. Sniffing the wrong refusal greys out a diamond that can still be
// played, which is exactly the bug this pins -- "you need to recruit N more
// foes" is only ever said when innings remain, so it must *clear* the flag.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'iotm.js'), 'utf8');

const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
const fakeLocation = { pathname: '/nowhere.php' };

// Minimal localStorage: the helpers only get/set/remove one key.
const store = new Map();
const fakeStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); }
};

const wrapped = src
  .replace('(function () {', 'globalThis.__iotm = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { applyBallResultText, ballExhaustedToday, ' +
    'markBallExhaustedToday, clearBallExhausted }; })();');
const fn = new Function('document', 'location', 'localStorage',
  wrapped + '\nreturn globalThis.__iotm;');
const api = fn(fakeDoc, fakeLocation, fakeStorage);

let failures = 0;
function check(label, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', expected, '\n   got:     ', got);
}

// Run one response text against a starting flag state; report [conclusive,
// spent-afterwards].
function classify(txt, spentBefore) {
  store.clear();
  if (spentBefore) api.markBallExhaustedToday();
  const conclusive = api.applyBallResultText(txt);
  return [conclusive, api.ballExhaustedToday()];
}

const EXHAUSTED =
  "You've already pitched nine innings today. Any more and you'd blow out " +
  'your shoulder.';
const RECRUIT = 'You need to recruit 3 more foes to play baseball.';
const PLAYED = 'You wind up and deliver a fastball. Strike three!';

// The daily-limit refusal sets the flag and ends the poll.
check('exhausted refusal marks spent', classify(EXHAUSTED, false), [true, true]);

// The short-team refusal is the bug being fixed: the server only says it while
// innings remain, so a stale flag must be cleared, not left greying the button.
check('recruit refusal clears a stale spent flag',
  classify(RECRUIT, true), [true, false]);
check('recruit refusal leaves an unset flag unset',
  classify(RECRUIT, false), [true, false]);
check('recruit wording without a count also clears',
  classify('You need to recruit some foes to play baseball.', true),
  [true, false]);

// A played inning (or any unrelated page the poller happens to read) says
// nothing either way: don't clear a flag set earlier today.
check('a successful pitch is inconclusive', classify(PLAYED, false),
  [false, false]);
check('a successful pitch does not clear an existing flag',
  classify(PLAYED, true), [false, true]);
check('an unrelated page is inconclusive',
  classify('Results: You acquire an item: baseball card', true), [false, true]);

console.log(failures ? `\n${failures} failure(s)` : '\nAll passed');
process.exit(failures ? 1 : 0);
