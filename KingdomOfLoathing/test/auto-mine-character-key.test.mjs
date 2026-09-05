// Ad-hoc test for KingdomOfLoathing/auto-mine.js's character name, which is
// what suffixes both of its localStorage keys.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and a stub localStorage, and pulls out the name resolution and the daily
// counter that depends on it.
//
// The bug this pins, reported as "turns today resets after pressing charpane
// heal": charpane-heal.js finishes by reloading the charpane, and during that
// reload the charpane has no charsheet.php link. The old characterName()
// probed the frame and answered 'unknown' when the probe came up empty, so
// every key became `...:unknown` -- an empty bucket. The day's turn count read
// back as 0 until the charpane finished drawing, and anything written in the
// meantime went to the stray bucket instead of the character's.
//
// So: a probe that fails must never overwrite a name we already know, and a
// probe that SUCCEEDS with a different name must still win, or a multi would
// inherit the other character's cavern.
//
//   node KingdomOfLoathing/test/auto-mine-character-key.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'auto-mine.js'), 'utf8');

const wrapped = src
  .replace('(function () {', 'globalThis.__am = (function () {')
  .replace('  boot();',
    '  return { characterName, rememberCharacterName, dailyTurns, addDailyTurns, ' +
    'recordLayout, loadLayout };');
if (wrapped === src) throw new Error('could not rewrite auto-mine.js for testing');

// One localStorage shared by every instance below, so a "reloaded frame" sees
// what the previous one wrote -- which is the whole point of persisting the
// name at all.
const store = new Map();
const fakeWindow = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  },
};
const fakeLocation = {
  pathname: '/mining.php',
  search: '?mine=6',
  origin: 'https://www.kingdomofloathing.com',
};

// The charpane, as a thing that can be drawn, blank, or unreachable. `name`
// null is the reload window: the frame is there, the charsheet link is not.
function charpaneShowing(name) {
  return {
    document: {
      querySelector: (sel) =>
        (name && /charsheet\.php/.test(sel) ? { textContent: ' ' + name + ' ' } : null),
    },
  };
}

// mining.php has no charsheet link of its own, which is why the charpane is
// probed at all.
const mineDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  readyState: 'complete',
  addEventListener: () => {},
};

function load(charpane) {
  const top = { frames: { charpane: charpane } };
  const fn = new Function('document', 'location', 'window', 'top', wrapped);
  fn(mineDoc, fakeLocation, fakeWindow, top);
  return globalThis.__am;
}

let failures = 0;
function check(label, actual, expected) {
  const ok = Object.is(actual, expected);
  if (!ok) failures++;
  console.log(
    (ok ? 'ok   ' : 'FAIL ') + label +
    (ok ? '' : '\n       expected ' + JSON.stringify(expected) +
               '\n       got      ' + JSON.stringify(actual))
  );
}

const DAY = 'r1700000000';

// --- the name comes off the charpane, whitespace and all --------------------

const drawn = charpaneShowing('Tilo');
let api = load(drawn);
check('the name is read from the charpane', api.characterName(), 'Tilo');

check('turns are counted under it', api.addDailyTurns(DAY, 7), 7);
api.recordLayout(28, 'gold');
check('so is the cavern layout', api.loadLayout()['28'], 'gold');

// --- the charpane reload, which is what pressing heal causes ----------------

drawn.document.querySelector = () => null; // charpane-heal.js reloaded it
check('a blank charpane does not change who we are', api.characterName(), 'Tilo');
check('the day total survives the reload', api.dailyTurns(DAY), 7);
check('so does the layout', api.loadLayout()['28'], 'gold');
check('turns spent during the reload still land', api.addDailyTurns(DAY, 1), 8);

// An unreachable charpane -- the cross-frame throw -- must behave the same.
const unreachable = load(null);
check('an unreachable charpane falls back to the stored name',
  unreachable.characterName(), 'Tilo');
check('...and to the stored total', unreachable.dailyTurns(DAY), 8);

// --- a frame that loads before the charpane draws ---------------------------

const early = load(charpaneShowing(null));
check('a frame that starts before the charpane still knows the name',
  early.characterName(), 'Tilo');
check('...and reads the right bucket', early.dailyTurns(DAY), 8);

// --- api.php is the authority ----------------------------------------------
//
// getStatus() feeds json.name in here, which is what makes the keys right even
// when no frame is readable.

const blind = load(null);
blind.rememberCharacterName('Someone Else');
check('api.php can name the character', blind.characterName(), 'Someone Else');
check('a different character has its own count', blind.dailyTurns(DAY), 0);
check('...and its own layout', blind.loadLayout()['28'], undefined);
blind.rememberCharacterName('   '); // a blank name is not an answer
check('a blank name from api.php is ignored', blind.characterName(), 'Someone Else');

// --- a real switch of character still wins ----------------------------------
//
// The cache must not be so sticky that a multi inherits the other character's
// cavern: a charpane that says someone else is evidence, not noise.

const multi = load(charpaneShowing('Tilo'));
check('a drawn charpane overrides the stored name', multi.characterName(), 'Tilo');
check('...and reads that character\'s total', multi.dailyTurns(DAY), 8);

// --- the stray bucket the bug created is cleaned up -------------------------

store.set('tm-automine-daily:unknown', JSON.stringify({ day: DAY, turns: 99 }));
store.set('tm-automine-layout:unknown', JSON.stringify({ 30: 'ore' }));
const cleaner = load(charpaneShowing('Someone Else'));
check('resolving a name drops the stray daily bucket',
  store.has('tm-automine-daily:unknown'), false);
check('...and the stray layout bucket',
  store.has('tm-automine-layout:unknown'), false);
check('the stray turns are not handed to whoever resolved',
  cleaner.dailyTurns(DAY), 0);

console.log(failures ? '\n' + failures + ' failure(s)' : '\nAll passed');
process.exit(failures ? 1 : 0);
