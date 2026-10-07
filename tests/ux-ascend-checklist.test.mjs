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
  .replace(/\}\)\(\);\s*$/, 'return { ascendCoinLine, ascendTickLine, ascendTickKey, ascendOpenSummary }; })();');
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

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
