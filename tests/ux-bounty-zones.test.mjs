// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js's Bounty Hunter Hunter
// zone links.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a pathname matching no feature, so run() is a no-op) and pulls out the
// matcher. The DOM splicing itself needs a real page; this pins which words
// become the link and where it points.
//
// The quest texts are copied from the live quest log (2026-10-19) and from
// the wiki's list of bounties.
//
//   node tests/ux-bounty-zones.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  images: [],
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
    'return { bountyZonePattern, bountyZoneLookup }; })();');
const fn = new Function('document', 'location', 'window',
  wrapped + '\nreturn globalThis.__ux;');
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

// [linked text, map url] for one quest line, or null.
function link(text) {
  const m = api.bountyZonePattern().exec(text);
  if (!m) return null;
  return [m[2] + m[3], api.bountyZoneLookup(m[2])];
}

const head = 'The Bounty Hunter Hunter wants you to collect ';

check('the Treasury goes to Cobb\'s Knob',
  link(head + '11 bundles of receipts from Knob Goblin Bean Counters in the ' +
    'Cobb\'s Knob Treasury (0 of 11 collected so far)'),
  ['Cobb\'s Knob Treasury', 'cobbsknob.php']);

check('the "of Spookyraven Manor" tail stays in the link',
  link(head + '11 non-Euclidean hooves from cubist bulls in the Haunted Gallery ' +
    'of Spookyraven Manor (0 of 11 collected so far)'),
  ['Haunted Gallery of Spookyraven Manor', 'place.php?whichplace=manor2']);

check('Chinatown goes to the Suspicious-Looking Guy\'s jar',
  link(head + '13 unlucky claws from lucky cat statues in the Chinatown Shops ' +
    '(0 of 13 collected so far)'),
  ['Chinatown Shops', 'place.php?whichplace=junggate_1']);

check('an "in" inside the monster name is skipped',
  link(head + '10 piles of wig powder from wasps in wigs in the Red Queen\'s ' +
    'Garden (0 of 10 collected so far)'),
  ['Red Queen\'s Garden', 'place.php?whichplace=rabbithole']);

check('the Haunted Laboratory is not cut short to a shorter name',
  link(head + '13 rubber ribs from model skeletons in the Haunted Laboratory ' +
    '(0 of 13 collected so far)'),
  ['Haunted Laboratory', 'place.php?whichplace=manor3']);

check('"on the ... ride" drops the word ride',
  link(head + '10 empty rum bottles from filthy pirates on the Pirates of the ' +
    'Garbage Barges ride (0 of 10 collected so far)'),
  ['Pirates of the Garbage Barges', 'place.php?whichplace=airport_stench']);

check('curly quotes still match the "Fun" House',
  link(head + '7 empty greasepaint tubes from creepy clowns in the “Fun” ' +
    'House (0 of 7 collected so far)'),
  ['“Fun” House', 'place.php?whichplace=plains']);

check('a zone with no map is left alone',
  link(head + '8 piles of country guano from Swarms of Country Bats in An ' +
    'Incredibly Strange Place (Bad Trip) (0 of 8 collected so far)'),
  null);

if (failures) {
  console.log('\n' + failures + ' failure(s)');
  process.exit(1);
}
console.log('\nall passed');
