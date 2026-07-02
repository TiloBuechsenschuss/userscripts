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
  return {
    options: options.slice(),
    value: selectedValue,
    _order: options.slice(),
    appendChild(node) {
      const i = this._order.indexOf(node);
      if (i >= 0) this._order.splice(i, 1);
      this._order.push(node);
    }
  };
}
const order = (sel) => sel._order.map((o) => o.value);

// --- parseCupOption ------------------------------------------------------
check('parse plain',
  api.parseCupOption(opt('x', '1-ball (3) - 1 Adv.', 1)),
  { name: '1-ball', qty: 3, advs: 1, effect: '' });
check('parse stat effect',
  api.parseCupOption(opt('x', 'alarm accordion (1) - 1 Adv., 100 Mys', 1)),
  { name: 'alarm accordion', qty: 1, advs: 1, effect: '100 Mys' });
check('parse buff effect',
  api.parseCupOption(
    opt('x', 'bum cheek (1) - 2 Adv., 20 turns of Runneth a Fever', 2)),
  { name: 'bum cheek', qty: 1, advs: 2,
    effect: '20 turns of Runneth a Fever' });
check('parse trademark + high advs',
  api.parseCupOption(opt('x', 'Newbiesport™ tent (1) - 1 Adv.', 1)),
  { name: 'Newbiesport™ tent', qty: 1, advs: 1, effect: '' });
check('parse ampersand name',
  api.parseCupOption(opt('x', 'Drac & Tan (1) - 2 Adv.', 2)),
  { name: 'Drac & Tan', qty: 1, advs: 2, effect: '' });

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

// effect: options with an effect first (by effect text), then rest by name.
// "100 Mys" < "20 turns..." by localeCompare, so dram precedes beer.
s = select(sample(), 'apple');
api.sortCup13([s], api.CUP13_SORTS.effect);
check('sort effect', order(s), ['dram', 'beer', 'apple', 'cider']);

// name asc (the game default)
s = select(sample(), 'apple');
api.sortCup13([s], api.CUP13_SORTS.name);
check('sort name', order(s), ['apple', 'beer', 'cider', 'dram']);

// selection is preserved across a sort
s = select(sample(), 'cider');
api.sortCup13([s], api.CUP13_SORTS.advs);
check('selection preserved', s.value, 'cider');

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
