// Ad-hoc test for KingdomOfLoathing/iotm.js Eternity Codpiece gem categories.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so the dispatch injects nothing), and pulls out the
// gem-bucketing helpers to assert each gem lands in the intended category --
// especially the Mr. Store items, whose enchantments would otherwise fall into
// the generic buckets ("Weapon Damage +10" -> physical offense, etc.).
//
//   node KingdomOfLoathing/test/iotm-codpiece-categories.test.mjs

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
    'return { gemCategory, GEM_CATEGORIES, MR_STORE_GEMS, planMrStore };' +
    ' })();');
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

// --- Mr. Store gems ------------------------------------------------------
// The panel's "Insert all" fills slots 1-4 from this array in order, so the
// array itself must be alphabetically ascending by item name.
check('Mr. Store gems are alphabetically ascending',
  api.MR_STORE_GEMS.map((g) => g.name),
  ['Baseball Diamond', 'blood cubic zirconia', 'Heartstone',
   'Peridot of Peril']);

// Each gem is matched by its item name *and*, independently, by the exact
// enchantment the wiki lists for it -- whichever the <option> label carries.
const MR_STORE_LABELS = [
  ['Baseball Diamond', 'Baseball Diamond', 'Weapon Damage +10'],
  ['blood cubic zirconia', 'blood cubic zirconia',
   'Serious Spooky Resistance (+3), +5 Spooky Damage'],
  ['Heartstone', 'Heartstone', '+5 Familiar Weight'],
  ['Peridot of Peril', 'Peridot of Peril', 'Maximum HP +20, Maximum MP +20']
];
MR_STORE_LABELS.forEach(function (row) {
  const name = row[0];
  const gem = api.MR_STORE_GEMS.find((g) => g.name === name);
  check('matches ' + name + ' by name', gem.test(row[1]), true);
  check('matches ' + name + ' by enchantment', gem.test(row[2]), true);
  check('bucket by name: ' + name, api.gemCategory(row[1]), 'mrstore');
  check('bucket by enchantment: ' + name, api.gemCategory(row[2]), 'mrstore');
});

// No Mr. Store gem may claim another one's label.
api.MR_STORE_GEMS.forEach(function (gem) {
  MR_STORE_LABELS.forEach(function (row) {
    if (row[0] === gem.name) return;
    check(gem.name + ' does not claim "' + row[2] + '"', gem.test(row[2]),
      false);
  });
});

// --- Near misses ---------------------------------------------------------
// Mundane gems whose enchantments sit close to the Mr. Store patterns must
// stay in their own buckets.
check('torquoise (Weapon Damage +10%) is physical offense',
  api.gemCategory('Weapon Damage +10%'), 'physoff');
check('unearthly onyx (So-So Spooky Resistance) is elemental resistance',
  api.gemCategory('So-So Spooky Resistance (+2)'), 'eleres');
check('cubic zirconia (Max MP +10%) is not Mr. Store',
  api.gemCategory('Max MP +10%') !== 'mrstore', true);

// --- The pre-existing buckets still work ---------------------------------
check('drops', api.gemCategory('+20% Booze Drops from Monsters'), 'drops');
check('elemental damage', api.gemCategory('+10 Damage to Stench Spells'),
  'eledmg');
check('stats & initiative', api.gemCategory('+9% Combat Initiative'), 'stats');
check('sustain', api.gemCategory('Regenerate 10-20 HP per adventure'),
  'sustain');
check('other', api.gemCategory('+1 Pool Skill'), 'other');

// Every gem gets exactly one bucket, and it is always a real category key.
const keys = api.GEM_CATEGORIES.map((c) => c.key);
check('category keys', keys,
  ['all', 'mrstore', 'eledmg', 'eleres', 'drops', 'stats', 'sustain',
   'physoff', 'other']);
check('unknown label falls back to a real key',
  keys.includes(api.gemCategory('+3 Whatever, unmatched')), true);

// --- planMrStore ---------------------------------------------------------
// "Insert all" maps MR_STORE_GEMS[i] -> slots[i]. The regression it guards
// against: a gem mounted in the WRONG slot isn't in inventory, so the server
// refuses to mount it again -- only three of the four landed. The plan has to
// pry that gem out first rather than filter it away as "unavailable".
//
// Fake slots: planMrStore only reads `which`, `select.value` (the gem mounted
// there) and `removeForm` (present iff the slot is occupied).
const IID = { baseball: '111', blood: '222', heart: '333', peridot: '444',
              onyx: '999' };
function slot(which, mounted) {
  return {
    which: String(which),
    select: { value: mounted || '' },
    removeForm: mounted ? { form: 'remove-' + which } : null
  };
}
// The union of gems the page offers, keyed by iid -- labelled by item name.
const ALL_GEMS = new Map([
  [IID.baseball, 'Baseball Diamond'],
  [IID.blood, 'blood cubic zirconia'],
  [IID.heart, 'Heartstone'],
  [IID.peridot, 'Peridot of Peril'],
  [IID.onyx, 'unearthly onyx']
]);
const wh = (list) => list.map((x) => x.which);
const pairs = (list) => list.map((x) => x.which + '=' + x.iid);

// Five empty slots: nothing to pry out, all four gems get mounted in order.
let p = api.planMrStore(
  [slot(1), slot(2), slot(3), slot(4), slot(5)], ALL_GEMS);
check('empty codpiece: no removals', wh(p.removals), []);
check('empty codpiece: fills slots 1-4 alphabetically', pairs(p.assignments),
  ['1=' + IID.baseball, '2=' + IID.blood, '3=' + IID.heart,
   '4=' + IID.peridot]);
check('empty codpiece: nothing missing', [p.missing, p.noSlot], [[], []]);

// The reported bug: the Peridot already sits in slot 1, so slot 4 could not
// take it from the stale page. It must be pried out first, then all four go in.
p = api.planMrStore(
  [slot(1, IID.peridot), slot(2), slot(3), slot(4), slot(5)], ALL_GEMS);
check('gem in wrong slot: pried out first', wh(p.removals), ['1']);
check('gem in wrong slot: still assigns all four', pairs(p.assignments),
  ['1=' + IID.baseball, '2=' + IID.blood, '3=' + IID.heart,
   '4=' + IID.peridot]);
check('gem in wrong slot: not reported missing', p.missing, []);

// Same, for a gem parked in the fifth slot -- which no target ever overwrites,
// so without the removal phase it would stay stuck there forever.
p = api.planMrStore(
  [slot(1), slot(2), slot(3), slot(4), slot(5, IID.heart)], ALL_GEMS);
check('gem in slot 5: pried out', wh(p.removals), ['5']);
check('gem in slot 5: assigned to slot 3',
  pairs(p.assignments).includes('3=' + IID.heart), true);

// A gem already in its target slot is left alone -- no pointless POST, and no
// removal either.
p = api.planMrStore(
  [slot(1, IID.baseball), slot(2), slot(3), slot(4)], ALL_GEMS);
check('gem already correct: no removal', wh(p.removals), []);
check('gem already correct: skipped', pairs(p.assignments),
  ['2=' + IID.blood, '3=' + IID.heart, '4=' + IID.peridot]);

// Fully set up already: nothing at all to do.
p = api.planMrStore([slot(1, IID.baseball), slot(2, IID.blood),
  slot(3, IID.heart), slot(4, IID.peridot)], ALL_GEMS);
check('already set up: no steps',
  [wh(p.removals), pairs(p.assignments)], [[], []]);

// An unrelated gem occupying a target slot is NOT pried out -- the Replace
// POST swaps it out on its own.
p = api.planMrStore(
  [slot(1, IID.onyx), slot(2), slot(3), slot(4)], ALL_GEMS);
check('foreign gem in target slot: not pried out', wh(p.removals), []);
check('foreign gem in target slot: replaced', pairs(p.assignments)[0],
  '1=' + IID.baseball);

// A gem the page never offers isn't owned -- reported, not attempted.
const noHeart = new Map(ALL_GEMS);
noHeart.delete(IID.heart);
p = api.planMrStore([slot(1), slot(2), slot(3), slot(4)], noHeart);
check('unowned gem reported', p.missing, ['Heartstone']);
check('unowned gem: the other three still go in, in their own slots',
  pairs(p.assignments),
  ['1=' + IID.baseball, '2=' + IID.blood, '3=' + IID.peridot]);

// Fewer slots than gems: the leftovers are reported rather than dropped.
p = api.planMrStore([slot(1), slot(2), slot(3)], ALL_GEMS);
check('too few slots reported', p.noSlot, ['Peridot of Peril']);
check('too few slots: fills what there is', pairs(p.assignments),
  ['1=' + IID.baseball, '2=' + IID.blood, '3=' + IID.heart]);

// No remove control on the page (slot rendering we don't recognise): we can't
// pry anything out, but the assignment is still attempted -- the server, not
// the stale page, gets to decide.
const stuck = slot(1, IID.peridot);
stuck.removeForm = null;
p = api.planMrStore([stuck, slot(2), slot(3), slot(4)], ALL_GEMS);
check('no remove form: no removals planned', wh(p.removals), []);
check('no remove form: assignment still attempted',
  pairs(p.assignments).includes('4=' + IID.peridot), true);

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
