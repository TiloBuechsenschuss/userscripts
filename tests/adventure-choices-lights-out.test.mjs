// Ad-hoc test for adventure-choices.js's Spookyraven Manor "Lights Out" spoilers (890-903).
//
// Standalone Node script, no runner (see AGENTS.md).
//
// What's pinned here:
//   - Every Lights Out choice is in the button-text table, and every key is lower case
//     (the lookup lower-cases the button label, so a capital in a key never matches).
//   - Every button label the wiki lists for those rooms, in the wiki's own capitalisation,
//     finds a spoiler -- so a room with an unannotated button is caught here.
//   - Both quest chains are labelled 1/7 .. 7/7 in their own rooms, in order.
//   - DisplaySpoilersByButtonText annotates a known label, cuts KoL's " [...]" suffix,
//     and leaves an unknown label alone.
//
//   node tests/adventure-choices-lights-out.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'adventure-choices.js'), 'utf8')
  .replace(/\r\n/g, '\n');

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// The script is not an IIFE, so take the two functions out by their text.
const start = src.indexOf('function CheckButtonText(');
const end = src.indexOf('//all choice.php buttons have an "option=" setting');
check('found CheckButtonText .. DisplaySpoilersByButtonText', start > 0 && end > start, true);
const { CheckButtonText, DisplaySpoilersByButtonText } = new Function('debug',
  src.slice(start, end) + '\nreturn { CheckButtonText, DisplaySpoilersByButtonText };')(false);

// Button labels as the wiki's "Lights Out in the <room>" pages write them (fetched 2026-10-16).
const WIKI = {
  890: ['Feel Your Way to the Door', 'Pull Away a Sheet', 'Look Out the Window', 'Open a Chest'],
  891: ['Feel Your Way to the Door', 'Investigate the Steam Press', 'Check a Pile of Stained Sheets',
        'Snag Some Clothespins'],
  892: ['Fumble Your Way to the Door', 'Flush the Toilet', 'Inspect the Bathtub', 'Check out the Vanity'],
  893: ['Refuse to Take the Heat', 'Light a Candle', 'Open the Icebox', 'Make a Snack'],
  894: ['Get out of the Library', "Go to the Children's Section", 'Grab a Candle',
        'Ponder a Quaint and Curious Volume'],
  895: ['Get out of the Ballroom', 'Dance with Yourself', 'Play the Organ', 'Check out the Punch Bowl'],
  896: ['Quit the Gallery', 'Check out the Paint-Splattered Painting', 'Check out the Cut Paper Collage',
        'Check out the Tormented Damned Souls Painting'],
  897: ['Search for a light', 'Run away', 'Hide under the bed', 'Search a nearby nightstand',
        'Check a nightstand on your left', 'Check a nightstand on your right', 'Flee'],
  898: ['Search for a lamp', 'Search over by the (ugggh) dolls', 'Search over by the (gaaah) stuffed animals',
        "Good Question. Let's go.", 'Examine the Dresser', 'Ha ha, not in a million years',
        'Open the bear and put your hand inside', 'Unlock the box', 'Flee'],
  899: ['Make a Torch', 'Examine the Plants', 'Examine the Graves', 'Examine the grave marked "Sangfroid"',
        'Examine the grave marked "Pibble"', 'Examine the grave marked "Crumbles"', 'Forget this'],
  900: ['Search for a light', "Maybe let's not hang out in here", "What the heck, let's explore a bit",
        'Search the cupboard over there', 'Examine the taxidermy heads', 'Get the heck out of here'],
  901: ['Try to find a light', 'Commence freaking out', 'Keep your cool', "I don't remember either",
        'Investigate the wine racks', 'Examine the Chablis rack', 'Examine the Merlot rack',
        'Examine the Pinot Noir rack', 'Investigate the... other stuff?', 'Get out of here right now go go go'],
  902: ['Look for a light', 'Search the shelves', 'Search the barrel', 'No thank you', 'No, but I will anyway',
        'Blow this poop stand', 'Get the heck out'],
  903: ['Search for a light', 'Check it out', 'Examine the chemistry gear', 'Examine the surgical equipment',
        'Examine the weird machines', 'Enter 23-47-99 and turn on the machine.', 'Oh god',
        'Leave the machine alone.', 'Back away slowly', 'Leave well enough alone'],
};

for (const num of Object.keys(WIKI)) {
  const set = CheckButtonText([], num);
  check(num + ': in the table', !!set, true);
  if (!set) continue;
  const upper = Object.keys(set).filter(k => k !== k.toLowerCase());
  check(num + ': every key is lower case', upper, []);
  const missing = WIKI[num].filter(l => typeof set[l.toLowerCase()] !== 'string' || !set[l.toLowerCase()]);
  check(num + ': every wiki label has a spoiler', missing, []);
}

// Each chain's step n/7 is in the nth room of that chain, and only there.
function stepRooms(who) {
  const out = [];
  for (const num of Object.keys(WIKI)) {
    const set = CheckButtonText([], num);
    for (const v of Object.values(set)) {
      const m = v.match(new RegExp('\\[' + who + ' (\\d)/7\\]'));
      if (m) out.push(num + ':' + m[1]);
    }
  }
  return [...new Set(out)];
}
check('Elizabeth chain runs 890..896 as steps 1..7', stepRooms('Elizabeth'),
  ['890:1', '891:2', '892:3', '893:4', '894:5', '895:6', '896:7']);
check('Stephen chain runs 897..903 as steps 1..7', stepRooms('Stephen'),
  ['897:1', '898:2', '899:3', '900:4', '901:5', '902:6', '903:7']);

// The two fights are the only things that cost an adventure, and both say so.
check('Elizabeth fight says it costs a turn',
  /costs 1 adventure/.test(CheckButtonText([], '896')['check out the tormented damned souls painting']), true);
check('Stephen fight says it costs a turn',
  /costs 1 adventure/.test(CheckButtonText([], '903')['oh god']), true);

// Rendering through the real annotator.
const btn = (value) => ({ type: 'submit', value });
const inputs = [btn('Look Out the Window'), btn('Open a Chest [1 adv]'), btn('Something New'),
                { type: 'hidden', name: 'whichchoice', value: '890' }];
DisplaySpoilersByButtonText(inputs, CheckButtonText(inputs, '890'));
check('known label annotated', inputs[0].value,
  'Look Out the Window -- [Elizabeth 1/7] Old Agnes -- unlocks Check a Pile of Stained Sheets in the Laundry Room');
check('KoL bracket suffix cut before lookup', inputs[1].value, 'Open a Chest [1 adv] -- locked -- nothing');
check('unknown label untouched', inputs[2].value, 'Something New');
check('hidden input untouched', inputs[3].value, '890');

// An unrelated choice still gets nothing from this table.
check('other choices unaffected', CheckButtonText([], '889'), null);

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
