// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js's familiar equipment
// dropdown on familiar.php: its order and its effect labels.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a pathname matching no feature, so run() is a no-op) and pulls out the
// helpers.
//
// The options below are the "Familiar Equipment" dropdown of a familiar.php
// capture (2026-10-30, Reassembled Blackbird active): value = item id,
// `fams` = the familiar ids the game marks an item as specific to.
//
//   node tests/ux-familiar-equipment.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseFamEquipMods, famEquipEffect, famEquipSortKey, orderFamEquip, ' +
    'FAM_EQUIP_MODS }; })();');
if (wrapped === src) throw new Error('could not rewrite ux-enhancers.js for testing');

const fn = new Function('document', 'location', 'window', wrapped + '\nreturn globalThis.__ux;');
const api = fn(fakeDoc, fakeLocation, {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- data ----------------------------------------------------------------

check('bookkeeping keys were dropped from the modifier table',
  Object.values(api.FAM_EQUIP_MODS).some((s) => /Last Available|Generic|Equips On|Softcore Only/.test(s)),
  false);

// --- parsing and labels ------------------------------------------------------

check('a quoted effect keeps its commas',
  api.parseFamEquipMods('Familiar Effect: "sleaze damage, meat", Meat Bonus: +12.5'),
  [{ key: 'Familiar Effect', num: null, text: 'sleaze damage, meat', expr: false },
    { key: 'Meat Bonus', num: 12.5, text: null, expr: false }]);
check('an expression keeps its commas and is marked',
  api.parseFamEquipMods('Familiar Weight: [max(5,20-floor(pref(_snowSuitCount)/5))]').map((m) => [m.key, m.expr]),
  [['Familiar Weight', true]]);
check('empty is nothing', api.parseFamEquipMods(''), []);

check('weight reads in lbs', api.famEquipEffect(2053), '+5 lbs');
check('percent labels glue to the number', api.famEquipEffect(5110), '+5% meat, +5% item');
check('a penalty keeps its sign, an effect is quoted', api.famEquipEffect(3609),
  '-10 lbs, "adventure underwater"');
check('an unlabelled modifier is spelled out', api.famEquipEffect(2570),
  '"sleaze damage, meat", +12.5 Meat Bonus, +0.4 Sporadic Damage Aura');
check('an expression reads "varies"', api.famEquipEffect(3822),
  '"fishy spells", Sporadic Damage Aura (varies)');
check('an item with nothing listed gets no label', api.famEquipEffect(11393), '');

// --- order ---------------------------------------------------------------------

// [value, fams, text] as the capture's #grower lists them.
const GROWER = [
  ['0', '', '--- select an item ---'], ['1116', '', 'annoying pitchfork'], ['2570', '', 'ant hoe (3)'],
  ['2574', '', 'ant pick (2)'], ['2571', '', 'ant rake (3)'], ['2573', '', 'ant sickle'],
  ['12322', '332', 'can of shield tenderizer'], ['3609', '', 'das boot'], ['11628', '302', 'extra DNA'],
  ['8209', '', 'filthy child leash (5)'], ['3822', '', 'fishy wand'], ['11393', '', 'futuristic collar'],
  ['4444', '', 'guard turtle collar (2)'], ['5110', '', "Li'l Businessman Kit"],
  ['3470', '', 'little bitty bathysphere'], ['849', '2', 'Meat detector'],
  ['858', '12', 'palm-frond toupee (2)'], ['6257', '171', 'pile of dungeon junk'],
  ['6702', '', 'tiny bowler (6)'], ['2053', '59', 'tiny bust of Pallas'],
  ['4566', '', 'tiny fly glasses (9)'], ['12342', '333', 'tiny stone harp'],
  ['7751', '186', 'Xiblaxian holo-bowtie'],
].map(([value, fams, name]) => ({ value, fams: fams ? fams.split(',') : [], name }));

const ordered = api.orderFamEquip(GROWER, 59).map((o) => o.name);
check('placeholder, then the active familiar\'s own item', ordered.slice(0, 2),
  ['--- select an item ---', 'tiny bust of Pallas']);
check('then the other familiars\' items by name', ordered.slice(2, 9), [
  'can of shield tenderizer', 'extra DNA', 'Meat detector', 'palm-frond toupee (2)',
  'pile of dungeon junk', 'tiny stone harp', 'Xiblaxian holo-bowtie',
]);
check('then everything else by enchantment', ordered.slice(9), [
  'filthy child leash (5)',     // +5 lbs
  'tiny fly glasses (9)',       // +1 fam exp
  "Li'l Businessman Kit",       // +5% meat (Meat Drop is its first bonus)
  'annoying pitchfork',         // +5 ML
  'tiny bowler (6)',            // Damage Aura    } other bonuses,
  'guard turtle collar (2)',    // Familiar Damage } A-Z by modifier
  'ant hoe (3)', 'ant pick (2)', 'ant rake (3)', 'ant sickle',   // Meat Bonus
  'das boot', 'fishy wand', 'little bitty bathysphere',          // described effects
  'futuristic collar',          // nothing listed
]);
check('another familiar picked: its item comes first',
  api.orderFamEquip(GROWER, 332).slice(1, 2).map((o) => o.name), ['can of shield tenderizer']);
check('within a group the bigger number wins',
  api.orderFamEquip([
    { value: '10', fams: [], name: 'b' },  // unknown id: no modifiers
    { value: '2053', fams: [], name: 'tiny bust of Pallas' },   // +5 lbs
    { value: '1678', fams: [], name: 'pet rock "Groucho" disguise' },   // +11 lbs
  ], 0).map((o) => o.name),
  ['pet rock "Groucho" disguise', 'tiny bust of Pallas', 'b']);

// --- wiki cross-check -----------------------------------------------------
// FAM_EQUIP_NOTE, hand-written from the wiki's Familiar Equipment page.
check('a wiki note fills in where KoLmafia has no modifier', api.famEquipEffect(857),
  'less sensitive to light');
check('KoLmafia\'s modifiers win over a wiki note', api.famEquipEffect(2053), '+5 lbs');
check('an item with only a wiki note sorts with the described effects',
  api.famEquipSortKey(857).rank, api.famEquipSortKey(3822).rank);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
