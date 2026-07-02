// Ad-hoc test for KingdomOfLoathing/iotm.js Cup of 13s ingredient sorting.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so the dispatch injects nothing), and pulls out the
// Cup-of-13s helpers to assert the option parser and each sort order behave.
//
//   node KingdomOfLoathing/test/iotm-cup13-sort.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, '..', 'iotm.js');
const src = readFileSync(scriptPath, 'utf8');

// Stub globals. pathname matches neither the menu nor choice branch, so the
// dispatch at the bottom of the IIFE is a no-op -- we only want the helpers.
const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};
const fakeLocation = { pathname: '/nowhere.php' };

// Re-expose the IIFE's internals: name the IIFE and have it return the helpers.
const wrapped = src
  .replace('(function () {', 'globalThis.__iotm = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseCupOption, CUP13_SORTS, sortCup13 }; })();');
const fn = new Function('document', 'location',
  wrapped + '\nreturn globalThis.__iotm;');
const api = fn(fakeDoc, fakeLocation);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- Fake <option> / <select> --------------------------------------------
// Minimal stand-ins: parseCupOption reads textContent + getAttribute; sortCup13
// reads sel.options and moves nodes with appendChild (DOM appendChild moves an
// existing child to the end -- reproduced here via _order).
function opt(value, text, advs) {
  return {
    value: value,
    textContent: text,
    getAttribute: (n) => (n === 'data-advs' ? String(advs) : null)
  };
}
function select(options, selectedValue) {
  const sel = {
    options: options.slice(),
    value: selectedValue,
    _order: options.slice(),
    appendChild(node) {
      const i = this._order.indexOf(node);
      if (i >= 0) this._order.splice(i, 1);
      this._order.push(node);
    }
  };
  // Mirror DOM: setting selectedIndex updates value to that option's value.
  Object.defineProperty(sel, 'selectedIndex', {
    set(i) { this.value = this._order[i] ? this._order[i].value : ''; },
    get() { return this._order.findIndex((o) => o.value === this.value); }
  });
  return sel;
}
const order = (sel) => sel._order.map((o) => o.value);

// --- parseCupOption ------------------------------------------------------
check('parse plain',
  api.parseCupOption(opt('x', '1-ball (3) - 1 Adv.', 1)),
  { name: '1-ball', qty: 3, advs: 1, effect: '', effName: '', effMag: 0 });
check('parse stat effect',
  api.parseCupOption(opt('x', 'alarm accordion (1) - 1 Adv., 100 Mys', 1)),
  { name: 'alarm accordion', qty: 1, advs: 1, effect: '100 Mys',
    effName: 'Mys', effMag: 100 });
check('parse buff effect',
  api.parseCupOption(
    opt('x', 'bum cheek (1) - 2 Adv., 20 turns of Runneth a Fever', 2)),
  { name: 'bum cheek', qty: 1, advs: 2,
    effect: '20 turns of Runneth a Fever',
    effName: 'Runneth a Fever', effMag: 20 });
check('parse trademark + high advs',
  api.parseCupOption(opt('x', 'Newbiesport™ tent (1) - 1 Adv.', 1)),
  { name: 'Newbiesport™ tent', qty: 1, advs: 1, effect: '',
    effName: '', effMag: 0 });
check('parse ampersand name',
  api.parseCupOption(opt('x', 'Drac & Tan (1) - 2 Adv.', 2)),
  { name: 'Drac & Tan', qty: 1, advs: 2, effect: '',
    effName: '', effMag: 0 });

// --- Sort orders ---------------------------------------------------------
// A representative four-item set (value == name for readable assertions):
//   apple  qty 5  advs 1  (no effect)
//   beer   qty 2  advs 4  effect "20 turns of Runneth For Thy Life"
//   cider  qty 10 advs 1  (no effect)
//   dram   qty 1  advs 2  effect "100 Mys"
function sample() {
  return [
    opt('apple', 'apple (5) - 1 Adv.', 1),
    opt('beer', 'beer (2) - 4 Adv., 20 turns of Runneth For Thy Life', 4),
    opt('cider', 'cider (10) - 1 Adv.', 1),
    opt('dram', 'dram (1) - 2 Adv., 100 Mys', 2)
  ];
}

// advs desc, name tiebreak
let s = select(sample(), 'apple');
api.sortCup13([s], api.CUP13_SORTS.advs);
check('sort advs', order(s), ['beer', 'dram', 'apple', 'cider']);

// inventory (qty) desc, name tiebreak
s = select(sample(), 'apple');
api.sortCup13([s], api.CUP13_SORTS.inventory);
check('sort inventory', order(s), ['cider', 'apple', 'beer', 'dram']);

// effect: options with an effect first (grouped by effect name), then rest by
// name. Effect names: dram -> "Mys", beer -> "Runneth For Thy Life"; "Mys" <
// "Runneth..." so dram precedes beer, then the effectless apple, cider.
s = select(sample(), 'apple');
api.sortCup13([s], api.CUP13_SORTS.effect);
check('sort effect', order(s), ['dram', 'beer', 'apple', 'cider']);

// effect grouping: same effect name stays together regardless of turn count,
// higher turn length first -- and a stat effect ("Mys") groups separately.
// Order: Mys group, then "Runneth On Empty", then "Runneth Over" (40 before 20),
// then the effectless item last.
s = select([
  opt('over20', 'aaa (1) - 1 Adv., 20 turns of Runneth Over', 1),
  opt('over40', 'zzz (1) - 1 Adv., 40 turns of Runneth Over', 1),
  opt('empty', 'mmm (1) - 1 Adv., 20 turns of Runneth On Empty', 1),
  opt('mys', 'bbb (1) - 2 Adv., 50 Mys', 2),
  opt('plain', 'ccc (5) - 1 Adv.', 1)
], 'plain');
api.sortCup13([s], api.CUP13_SORTS.effect);
check('sort effect groups by name, turns desc', order(s),
  ['mys', 'empty', 'over40', 'over20', 'plain']);

// within one effect name + equal turn length: higher adventures first, then
// item name. All three are "Runneth Over" at 20 turns.
s = select([
  opt('a3', 'apple (1) - 3 Adv., 20 turns of Runneth Over', 3),
  opt('a1', 'apple-b (1) - 1 Adv., 20 turns of Runneth Over', 1),
  opt('z3', 'zebra (1) - 3 Adv., 20 turns of Runneth Over', 3)
], 'a3');
api.sortCup13([s], api.CUP13_SORTS.effect);
check('sort effect ties: advs then name', order(s), ['a3', 'z3', 'a1']);

// name asc (the game default)
s = select(sample(), 'apple');
api.sortCup13([s], api.CUP13_SORTS.name);
check('sort name', order(s), ['apple', 'beer', 'cider', 'dram']);

// after a sort, the topmost option is selected (regardless of prior pick), so
// the sort visibly "takes" and the best pick sits at the top
s = select(sample(), 'cider');
api.sortCup13([s], api.CUP13_SORTS.advs);
check('selects topmost after sort', s.value, order(s)[0]);

// all three dropdowns get sorted in one call
const a = select(sample(), 'apple');
const b = select(sample(), 'apple');
const c = select(sample(), 'apple');
api.sortCup13([a, b, c], api.CUP13_SORTS.name);
check('sorts all selects', [order(a), order(b), order(c)], [
  ['apple', 'beer', 'cider', 'dram'],
  ['apple', 'beer', 'cider', 'dram'],
  ['apple', 'beer', 'cider', 'dram']
]);

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
