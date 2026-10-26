// Ad-hoc test for KingdomOfLoathing/auto-mine.js's character name, which is
// what suffixes both of its localStorage keys.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and a stub localStorage, and pulls out the name resolution and the daily
// counter that depends on it.
//
// The bug this pins, reported as "turns today resets after pressing charpane
// heal": ux-enhancers.js finishes by reloading the charpane, and during that
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
//   node tests/auto-mine-character-key.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'auto-mine.js'), 'utf8');

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
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] ?? null,
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
check('the name is read from the charpane', api.characterName(), 'tilo');

check('turns are counted under it', api.addDailyTurns(DAY, 7), 7);
api.recordLayout(28, 'gold');
check('so is the cavern layout', api.loadLayout()['28'], 'gold');

// --- the charpane reload, which is what pressing heal causes ----------------

drawn.document.querySelector = () => null; // ux-enhancers.js reloaded it
check('a blank charpane does not change who we are', api.characterName(), 'tilo');
check('the day total survives the reload', api.dailyTurns(DAY), 7);
check('so does the layout', api.loadLayout()['28'], 'gold');
check('turns spent during the reload still land', api.addDailyTurns(DAY, 1), 8);

// An unreachable charpane -- the cross-frame throw -- must behave the same.
const unreachable = load(null);
check('an unreachable charpane falls back to the stored name',
  unreachable.characterName(), 'tilo');
check('...and to the stored total', unreachable.dailyTurns(DAY), 8);

// --- a frame that loads before the charpane draws ---------------------------

const early = load(charpaneShowing(null));
check('a frame that starts before the charpane still knows the name',
  early.characterName(), 'tilo');
check('...and reads the right bucket', early.dailyTurns(DAY), 8);

// --- api.php is the authority ----------------------------------------------
//
// getStatus() feeds json.name in here, which is what makes the keys right even
// when no frame is readable.

const blind = load(null);
blind.rememberCharacterName('Someone Else');
check('api.php can name the character', blind.characterName(), 'someone else');
check('a different character has its own count', blind.dailyTurns(DAY), 0);
check('...and its own layout', blind.loadLayout()['28'], undefined);
blind.rememberCharacterName('   '); // a blank name is not an answer
check('a blank name from api.php is ignored', blind.characterName(), 'someone else');

// --- a real switch of character still wins ----------------------------------
//
// The cache must not be so sticky that a multi inherits the other character's
// cavern: a charpane that says someone else is evidence, not noise.

const multi = load(charpaneShowing('Tilo'));
check('a drawn charpane overrides the stored name', multi.characterName(), 'tilo');
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

// --- api.php and the charpane disagree on capitalisation -------------------
//
// The bug that survived the fix above, still reported as "turns today resets
// after pressing heal". KoL names are case-insensitive and the two sources do
// not always spell one the same way: KoLmafia's captured pages have api.php
// answering "dEvstEr5" for the player whose charpane reads "Devster5". The
// menu frame normally keys by the charpane's spelling, every getStatus() puts
// api.php's back, and while the heal's charpane reload is in flight nothing
// corrects it -- so the count read from a second, empty bucket. Both
// spellings must be the same key.

store.clear();
const mixed = charpaneShowing('Devster5');
const devster = load(mixed);
check('turns land under the charpane spelling', devster.addDailyTurns(DAY, 12), 12);
devster.rememberCharacterName('dEvstEr5'); // getStatus() during the heal poll
check('api.php spelling reads the same total while the charpane is drawn',
  devster.dailyTurns(DAY), 12);
mixed.document.querySelector = () => null; // the heal reloads the charpane
devster.rememberCharacterName('dEvstEr5');
check('...and while the charpane is reloading', devster.dailyTurns(DAY), 12);
check('turns spent then add to the same total', devster.addDailyTurns(DAY, 1), 13);
mixed.document.querySelector = (sel) =>
  (/charsheet\.php/.test(sel) ? { textContent: 'Devster5' } : null);
check('...which the redrawn charpane sees too', devster.dailyTurns(DAY), 13);

// --- buckets split by the old keys are joined back up ------------------------
//
// Installs that already hit the bug hold the day under two spellings, and the
// turns in each are disjoint, so same-day buckets are summed. A bucket from an
// older day is stale and is dropped, as is a cavern layout that cannot be
// told apart from another.

store.clear();
store.set('tm-automine-daily:Devster5', JSON.stringify({ day: DAY, turns: 40 }));
store.set('tm-automine-daily:dEvstEr5', JSON.stringify({ day: DAY, turns: 3 }));
store.set('tm-automine-daily:DEVSTER5', JSON.stringify({ day: 'r1699900000', turns: 99 }));
store.set('tm-automine-layout:Devster5', JSON.stringify({ 28: 'gold' }));
store.set('tm-automine-daily:Someone', JSON.stringify({ day: DAY, turns: 5 }));
const joined = load(charpaneShowing('Devster5'));
check('same-day turns from both spellings are added up', joined.dailyTurns(DAY), 43);
check('the old spellings are removed',
  ['tm-automine-daily:Devster5', 'tm-automine-daily:dEvstEr5', 'tm-automine-daily:DEVSTER5']
    .some((key) => store.has(key)), false);
check('a lone layout bucket is kept', joined.loadLayout()['28'], 'gold');
check('another character is left alone',
  JSON.parse(store.get('tm-automine-daily:Someone')).turns, 5);

console.log(failures ? '\n' + failures + ' failure(s)' : '\nAll passed');
process.exit(failures ? 1 : 0);
