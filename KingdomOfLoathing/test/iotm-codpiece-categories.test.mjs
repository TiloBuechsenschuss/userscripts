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
    'return { gemCategory, GEM_CATEGORIES, MR_STORE_GEMS }; })();');
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

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
