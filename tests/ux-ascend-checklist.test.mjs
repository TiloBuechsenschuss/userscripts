// Ad-hoc test for the "Before you jump" checklist in KingdomOfLoathing/ux-enhancers.js.
//
// Standalone Node script, no runner (see AGENTS.md). Pins the pure parts: the status of each
// line (the text must carry the meaning without colour), the per-run tick key, and the confirm
// text shown when Ascend is pressed with a line still open.
//
//   node tests/ux-ascend-checklist.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  images: [], readyState: 'complete', querySelector: () => null, querySelectorAll: () => [],
  getElementById: () => null, addEventListener: () => {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };
const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/, 'return { ascendCoinLine, ascendTickLine, ascendTickKey, ascendOpenSummary, statusNumber, ascendAdventuresLine, ascendRoomLine, ascendDailyLine, localDateStr }; })();');
const api = new Function('document', 'location', 'window', wrapped + '\nreturn globalThis.__ux;')(fakeDoc, fakeLocation, {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const none = api.ascendCoinLine(0), some = api.ascendCoinLine(7), one = api.ascendCoinLine(1), bad = api.ascendCoinLine(null);
check('no coins: done, not open', [none.mark, none.open], ['\u2714', false]);
check('coins left: open, with the count in words', [some.mark, some.open, /7 Interesting Coins will be lost/.test(some.text)],
  ['\u2718', true, true]);
check('one coin is singular', /1 Interesting Coin will/.test(one.text), true);
check('unreadable count is "?" and never claims done', [bad.mark, bad.open], ['?', false]);
check('the three states differ by shape AND by words', new Set([none.mark, some.mark, bad.mark]).size === 3 &&
  new Set([none.text, some.text, bad.text]).size === 3, true);

check('ticked line is done', api.ascendTickLine(true, 'ok', 'todo').open, false);
check('unticked line is open', api.ascendTickLine(false, 'ok', 'todo').text, 'todo');

check('tick key uses name and ascension count', api.ascendTickKey({ name: 'Tilo', ascensions: '12' }, 100), 'Tilo|run12');
check('a new ascension is a new key', api.ascendTickKey({ name: 'Tilo', ascensions: 13 }, 100), 'Tilo|run13');
check('zero ascensions still counts as a run', api.ascendTickKey({ name: 'Tilo', ascensions: 0 }, 100), 'Tilo|run0');
check('no count falls back to the day', api.ascendTickKey({ name: 'Tilo' }, 100), 'Tilo|day100');
check('no status at all still gives a key', api.ascendTickKey(null, 5), 'unknown|day5');

check('nothing open: no confirm text', api.ascendOpenSummary([{ label: 'a', open: false, text: 'x' }]), '');
const sum = api.ascendOpenSummary([{ label: 'Coins', open: true, text: '3 left' }, { label: 'Gems', open: false, text: 'x' }]);
check('confirm lists only open lines', /\u2718 Coins: 3 left/.test(sum) && !/Gems/.test(sum), true);


// --- adventures, stomach, liver --------------------------------------------
const a0 = api.ascendAdventuresLine(0), a5 = api.ascendAdventuresLine(5), a1 = api.ascendAdventuresLine(1), aX = api.ascendAdventuresLine(null);
check('adventures: none left is done', [a0.mark, a0.open], ['✔', false]);
check('adventures: some left is open, in words', [a5.mark, a5.open, /5 adventures left/.test(a5.text)], ['✘', true, true]);
check('adventures: one is singular', /1 adventure left/.test(a1.text), true);
check('adventures: unreadable is "?" and not open', [aX.mark, aX.open], ['?', false]);
check('adventures: three states differ in mark and words',
  new Set([a0.mark, a5.mark, aX.mark]).size === 3 && new Set([a0.text, a5.text, aX.text]).size === 3, true);

const full = api.ascendRoomLine('eat', 15, 15), room = api.ascendRoomLine('drink', 4, 14), noMax = api.ascendRoomLine('eat', 3, null), cant = api.ascendRoomLine('drink', 0, 0);
check('room: full is done', [full.mark, full.open], ['✔', false]);
check('room: space left is open and says how much', [room.open, /10 drunkenness left \(4\/14\)/.test(room.text)], [true, true]);
check('room: unknown maximum uses the usual limit and says so',
  [noMax.open, /12 fullness left \(3\/15\) \(usual limit/.test(noMax.text)], [true, true]);
const overdrunk = api.ascendRoomLine('drink', 19, null), unreadable = api.ascendRoomLine('eat', null, 15);
check('room: 19 drunk (captured status) is past the usual 14 and done', [overdrunk.mark, overdrunk.open], ['✔', false]);
check('room: captured status 15 full is done', api.ascendRoomLine('eat', 15, null).open, false);
check('room: an unreadable amount is "?" and not open', [unreadable.mark, unreadable.open], ['?', false]);
check('room: a character who cannot eat or drink is done', [cant.mark, cant.open], ['✔', false]);

check('status numbers: first usable key, commas stripped',
  [api.statusNumber({ adventures: '1,234' }, ['advs', 'adventures']), api.statusNumber({ a: '' }, ['a']), api.statusNumber(null, ['a'])],
  [1234, null, null]);

// --- the Daily Checklist's saved list --------------------------------------
const day = '2026-10-07';
const items = [{ done: true }, { done: false }, { done: false, off: true }, { done: false, disabled: 'ronin' }, { done: false, disabled: 'post-ronin' }];
const freshList = api.ascendDailyLine({ date: day, ronin: false, items }, day);
check('daily: counts only live, unticked tasks (post-ronin run)', [freshList.open, /2 Daily Checklist tasks not ticked/.test(freshList.text)], [true, true]);
const roninList = api.ascendDailyLine({ date: day, ronin: true, items }, day);
check('daily: the ronin phase blocks a different task', /2 Daily Checklist tasks not ticked/.test(roninList.text), true);
check('daily: a done task blocked by the phase is not counted',
  api.ascendDailyLine({ date: day, ronin: true, items: [{ done: false, disabled: 'ronin' }] }, day).open, false);
const stale = api.ascendDailyLine({ date: '2026-10-06', ronin: false, items }, day);
check('daily: a list from an earlier day counts every live task as open',
  [/3 Daily Checklist tasks not ticked/.test(stale.text), /not been opened today/.test(stale.text)], [true, true]);
check('daily: all ticked is done',
  api.ascendDailyLine({ date: day, items: [{ done: true }, { off: true }] }, day).open, false);
check('daily: missing or junk is "?" and not open',
  [api.ascendDailyLine(null, day).mark, api.ascendDailyLine({ items: 'x' }, day).mark, api.ascendDailyLine(null, day).open], ['?', '?', false]);
check('local date string matches the checklist script format', api.localDateStr(new Date(2026, 9, 7)), '2026-10-07');

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
