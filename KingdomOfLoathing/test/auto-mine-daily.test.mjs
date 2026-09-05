// Ad-hoc test for KingdomOfLoathing/auto-mine.js's daily turn counter and its
// low-HP healing gate.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and a stub localStorage, and pulls out the internals.
//
// What's pinned here:
//
//   - "Today" is KoL's day, not the browser's. api.php's `rollover` (the unix
//     time of the NEXT rollover) is constant across one KoL day and is used as
//     the day key; `daynumber` and then the browser's date are fallbacks.
//     Getting this wrong resets the counter at local midnight, in the middle
//     of a KoL day.
//   - The counter is reset by READING it with a new day key. Nothing has to be
//     running at rollover, and a run that spans one keeps counting into the
//     new day rather than adding yesterday's turns to it.
//   - Turns are the DIFFERENCE in api.php's adventure total, clamped at zero:
//     a free mining action costs no adventure and must not be counted, and
//     eating a lasagna must not credit turns back.
//   - Healing never happens on its own terms: with no charpane heal button, or
//     with a max HP below the floor, it declines and says why instead of
//     polling for something that cannot happen.
//
//   node KingdomOfLoathing/test/auto-mine-daily.test.mjs

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

// A real enough localStorage: the script stores JSON strings and re-reads them.
const store = new Map();
const fakeWindow = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  },
};

const wrapped = src
  .replace('(function () {', 'globalThis.__am = (function () {')
  .replace('  boot();',
    '  return { dayKeyFromStatus, dailyTurns, addDailyTurns, noteTurns, RUN, ' +
    'loadPrefs, charpaneHealButton, healAboveFloor };');
if (wrapped === src) throw new Error('could not rewrite auto-mine.js for testing');

// `top` is an empty object on purpose: reaching for top.frames['charpane']
// throws, which is the same shape of failure as a cross-origin frame and must
// be survived rather than thrown.
const fn = new Function('document', 'location', 'window', 'top', wrapped);
fn(fakeDoc, fakeLocation, fakeWindow, {});
const api = globalThis.__am;

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

// --- the day key ------------------------------------------------------------

check(
  'rollover is the day key',
  api.dayKeyFromStatus({ rollover: 1700000000, daynumber: 5 }),
  'r1700000000'
);
check(
  'daynumber stands in when rollover is gone',
  api.dayKeyFromStatus({ daynumber: 5 }),
  'd5'
);
check(
  'with neither, fall back to the browser date',
  api.dayKeyFromStatus({}).charAt(0),
  'l'
);
check(
  'a comma-formatted rollover is still read',
  api.dayKeyFromStatus({ rollover: '1,700,000,000' }),
  'r1700000000'
);

// --- the daily total --------------------------------------------------------

const DAY_A = 'r1700000000';
const DAY_B = 'r1700086400';

check('an untouched counter is zero', api.dailyTurns(DAY_A), 0);
check('turns accumulate within a day', api.addDailyTurns(DAY_A, 4), 4);
check('...and keep accumulating', api.addDailyTurns(DAY_A, 3), 7);
check('the same day reads the total back', api.dailyTurns(DAY_A), 7);
check('a new day reads as zero', api.dailyTurns(DAY_B), 0);
check('reading a new day does not erase the stored day', api.dailyTurns(DAY_A), 7);
check('spending on the new day starts over', api.addDailyTurns(DAY_B, 2), 2);
check('yesterday is gone once the new day is written', api.dailyTurns(DAY_A), 0);
check('no day key shows what is stored', api.dailyTurns(null), 2);
check('a negative delta cannot subtract', api.addDailyTurns(DAY_B, -5), 2);

// --- measuring turns off api.php --------------------------------------------

function startRun(adventures, dayKey) {
  api.RUN.startAdv = adventures;
  api.RUN.lastAdv = null;
  api.RUN.used = 0;
  api.noteTurns({ adventures: adventures, dayKey: dayKey });
}

const DAY_C = 'r1700172800';
startRun(100, DAY_C);
check('starting a run spends nothing', api.RUN.today, 0);
check('...and has used nothing', api.RUN.used, 0);

api.noteTurns({ adventures: 100, dayKey: DAY_C });
check('a free mining action costs no turn', api.RUN.today, 0);

api.noteTurns({ adventures: 99, dayKey: DAY_C });
check('a dig that cost an adventure counts', api.RUN.today, 1);
check('...and shows in the run total', api.RUN.used, 1);

api.noteTurns({ adventures: 95, dayKey: DAY_C });
check('a jump of four counts four', api.RUN.today, 5);

api.noteTurns({ adventures: 115, dayKey: DAY_C });
check('eating adventures credits no turns', api.RUN.today, 5);
check('...and cannot make the run total negative', api.RUN.used, 0);

api.noteTurns({ adventures: 114, dayKey: DAY_C });
check('spending after eating counts once', api.RUN.today, 6);

// Rollover in the middle of a run starts the DAY over. The run's own figure is
// untouched by the day key -- and, having been measured from the adventure
// total at the start, still reads 0 here because the lasagna above put more
// adventures in the bank than the run has spent. That difference is the point:
// the day's count follows what was actually dug, pass by pass.
api.noteTurns({ adventures: 113, dayKey: 'r1700259200' });
check('rollover mid-run restarts the day', api.RUN.today, 1);
check('...and the run still measures from where it started', api.RUN.used, 0);

// A second run on the same day adds to the day rather than replacing it.
api.RUN.startAdv = 113;
api.RUN.lastAdv = null;
api.RUN.used = 0;
api.noteTurns({ adventures: 113, dayKey: 'r1700259200' });
api.noteTurns({ adventures: 110, dayKey: 'r1700259200' });
check('a second run adds to the same day', api.RUN.today, 4);
check('...while counting its own turns from zero', api.RUN.used, 3);

// A status read with no adventure figure is not a reason to guess.
const before = api.RUN.today;
api.noteTurns({ adventures: null, dayKey: 'r1700259200' });
check('an unreadable adventure count changes nothing', api.RUN.today, before);

// --- preferences ------------------------------------------------------------

check('healing is on by default', api.loadPrefs().healLowHp, true);
store.set('tm-automine-prefs', JSON.stringify({ healLowHp: false }));
check('...and can be switched off', api.loadPrefs().healLowHp, false);
store.set('tm-automine-prefs', JSON.stringify({ healLowHp: 'yes please' }));
check('anything but false is on', api.loadPrefs().healLowHp, true);
store.delete('tm-automine-prefs');

// --- healing ----------------------------------------------------------------

check('no charpane means no heal button', api.charpaneHealButton(), null);

const noRoom = await api.healAboveFloor(60, { hp: 40, maxhp: 55 });
check('a max HP below the floor is refused', noRoom.status, null);
check('...and says why', /maximum HP/.test(noRoom.reason), true);

const noButton = await api.healAboveFloor(60, { hp: 40, maxhp: 200 });
check('a missing heal button is refused', noButton.status, null);
check('...and names the script that provides it', /charpane-heal\.js/.test(noButton.reason), true);

console.log(failures ? '\n' + failures + ' failure(s)' : '\nAll passed');
process.exit(failures ? 1 : 0);
