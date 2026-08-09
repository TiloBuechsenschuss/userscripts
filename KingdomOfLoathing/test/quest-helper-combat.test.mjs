// Ad-hoc test for KingdomOfLoathing/quest-helper.js's fight.php combat cues.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the DOM-free cue helpers. Same re-expose trick as the rotation
// and 8-bit tests -- the script bails before the end of its IIFE, so the
// internals are handed back by replacing the dispatch line.
//
// What's pinned here, and why:
//   - the monster ids. Each Junkyard zone runs a tool-carrying gremlin AND an
//     identically-named tool-less one; getting that backwards would tell you to
//     spend rounds on a monster that has nothing to give. Ids are from
//     KoLmafia's monsters.txt.
//   - that KoL's own round markers (`<!--moly4-->`, `<!-- gh:50 -->`) fire the
//     cue, since they -- not the flavour text -- are the primary signal, and
//     they're the thing most likely to be broken by a careless regex edit. The
//     payloads used here are the literal ones from KoLmafia's fight fixtures.
//   - that the prose fallback still works when no marker is present, and that
//     an ordinary round fires nothing at all. A cue that fires every round is
//     worse than no cue.
//   - that a name-only match hedges. The id comment is what distinguishes the
//     two gremlin variants; without it we must not promise a tool.
//
//   node KingdomOfLoathing/test/quest-helper-combat.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'quest-helper.js'), 'utf8');

// '/choice.php' is a pathname the script accepts, and it keeps both the
// charpane branch and the fight branch from running -- nothing is injected and
// we drive the helpers by hand instead.
const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  images: [],
};
const fakeLocation = { pathname: '/choice.php' };

const wrapped = src
  .replace('(function () {', 'globalThis.__qh = (function () {')
  .replace('const puzzle = currentPuzzle();',
    'return { PUZZLES, MONSTER_ID_COMMENT, combatSubjectFrom, cueFired, cueNotes, ' +
    'cueAdvice };');
const fn = new Function('document', 'location', 'window',
  wrapped + '\nreturn globalThis.__qh;');
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

const cue = (name) => api.PUZZLES.find((p) => p.name === name);
const TOOLS = cue('Yossarian\'s tools');
const RAVERS = cue('Raver dance moves');

check('both combat cues are registered and typed', [
  !!TOOLS, !!RAVERS, TOOLS.type, RAVERS.type,
], [true, true, 'combat', 'combat']);

check('...and both are scoped to fight.php only', [
  TOOLS.page.test('/fight.php'), TOOLS.page.test('/choice.php'),
  RAVERS.page.test('/fight.php'), RAVERS.page.test('/adventure.php'),
], [true, false, true, false]);

// --- who each cue is about ------------------------------------------------

// Ids from KoLmafia's monsters.txt. The (tool) variants are the ODD ones here
// and the plain ones sit right next to them -- 549/548, 547/546, 553/552,
// 551/550 -- which is exactly how easy this is to get wrong.
check('each tool gremlin id names the tool it is holding', [
  TOOLS.monsters[549], TOOLS.monsters[547],
  TOOLS.monsters[553], TOOLS.monsters[551],
], [
  'molybdenum hammer', 'molybdenum crescent wrench',
  'molybdenum pliers', 'molybdenum screwdriver',
]);

check('the tool-LESS gremlins are not in the map at all', [
  TOOLS.monsters[548], TOOLS.monsters[546],
  TOOLS.monsters[552], TOOLS.monsters[550],
], [undefined, undefined, undefined, undefined]);

check('each raver id names the skill his move teaches', [
  RAVERS.monsters[855], RAVERS.monsters[856], RAVERS.monsters[857],
], ['Break It On Down', 'Pop and Lock It', 'Run Like the Wind']);

const subject = (c, id, name) => api.combatSubjectFrom(c, id, name);

check('the monster id identifies the subject outright',
  subject(TOOLS, 551, 'vegetable gremlin'),
  { prize: 'molybdenum screwdriver', certain: true });

check('an unrelated monster is nobody\'s cue', [
  subject(TOOLS, 550, 'vegetable gremlin') === null ? 'no id match' : 'matched',
  subject(TOOLS, 1, 'spooky mummy'),
  subject(RAVERS, 551, 'vegetable gremlin'),
], ['matched', null, null]);

// The id is the only thing that separates 550 from 551, so a name-only match
// must not promise a tool.
check('...but a tool-less gremlin still matches by NAME, and is flagged unsure',
  subject(TOOLS, null, 'vegetable gremlin'),
  { prize: 'molybdenum screwdriver', certain: false });

check('a raver name is unambiguous, so a name-only match is certain',
  subject(RAVERS, null, 'running man'),
  { prize: 'Run Like the Wind', certain: true });

check('the monster id comment parses', [
  ' MONSTERID: 551 '.match(api.MONSTER_ID_COMMENT)[1],
  api.MONSTER_ID_COMMENT.test(' MONSTER: 551 '),
], ['551', false]);

// --- has the cue fired this round? ----------------------------------------

// The literal comment payloads from KoLmafia's fight fixtures
// (test_fight_gremlin_good.html, test_raver_special_move_*.html).
const GREMLIN_ROUND = [' MONSTERID: 551 ', 'moly2'];
const RAVER_ROUND = [' MONSTERID: 855 ', ' gh:50 '];
const QUIET_ROUND = [' MONSTERID: 856 '];

check('KoL\'s own marker fires the cue', [
  api.cueFired(TOOLS, GREMLIN_ROUND, ''),
  api.cueFired(RAVERS, RAVER_ROUND, ''),
], [true, true]);

check('...and any digit works, since the number is not ours to interpret', [
  api.cueFired(TOOLS, ['moly1'], ''), api.cueFired(TOOLS, ['moly4'], ''),
  api.cueFired(RAVERS, [' gh:100 '], ''),
], [true, true, true]);

check('an ordinary round fires nothing', [
  api.cueFired(TOOLS, QUIET_ROUND,
    'It pummels you with a head of cabbage. It doesn\'t hurt.'),
  api.cueFired(RAVERS, QUIET_ROUND,
    'He stops to rifle his pockets, and searches deeper and deeper.'),
], [false, false]);

check('neither cue answers for the other\'s marker', [
  api.cueFired(TOOLS, RAVER_ROUND, ''), api.cueFired(RAVERS, GREMLIN_ROUND, ''),
], [false, false]);

// The fallback for a page where the comment didn't survive. Strings are the
// wiki's (gremlins) and KoLmafia's NemesisDecorator's (ravers).
check('the prose fallback catches the round with no marker', [
  api.cueFired(TOOLS, [],
    'It whips out a screwdriver and stabs you with it. Where did it get the vodka?'),
  api.cueFired(TOOLS, [],
    'He whips out a crescent wrench from somewhere, places it on your finger.'),
  api.cueFired(RAVERS, [],
    'The raver drops to the ground and starts spinning his legs wildly. He\'s much ' +
    'too far away from you to actually hit you.'),
  api.cueFired(RAVERS, [],
    'The raver turns and runs away. You watch him go, and soon realize he isn\'t ' +
    'actually running anywhere.'),
], [true, true, true, true]);

// --- what the bar says ----------------------------------------------------

const veg = { prize: 'molybdenum screwdriver', certain: true };
const bd = { prize: 'Break It On Down', certain: true };

const go = api.cueAdvice(TOOLS, veg, true, true, []);
check('a fired cue with the item in hand says use it now', [go.tone, go.headline], [
  'go',
  'Use the molybdenum magnet NOW — it wrenches the molybdenum screwdriver out of ' +
    'its hand and ends the fight.',
]);
check('...and says who presses the button',
  /never does it for you|only picks it in KoL's own dropdown/.test(go.lines[0]), true);

const cast = api.cueAdvice(RAVERS, bd, true, true, []);
check('a skill cue says cast, not use', [cast.tone, cast.headline], [
  'go',
  'Cast Gothy Handwave NOW — studying this move is how you learn Break It On Down.',
]);

const wait = api.cueAdvice(TOOLS, veg, false, true, []);
check('an ordinary round tells you to hold it', [wait.tone, wait.headline], [
  'turn', 'Not this round — hold the molybdenum magnet.',
]);
check('...and says why waiting is free',
  /nothing happens/.test(wait.lines[0]), true);

const none = api.cueAdvice(RAVERS, bd, true, false, []);
check('the right round without the skill is a warning, not an instruction',
  [none.tone, none.headline], [
    'stop', 'This is the round for the Gothy Handwave — and it isn\'t in your skills.',
  ]);
check('...and says where to get it', /A Girl in a Black Dress/.test(none.lines[0]), true);

// The hedge. This is the whole point of tracking `certain`.
const unsure = api.cueAdvice(TOOLS, { prize: 'molybdenum pliers', certain: false }, true, true, []);
check('an id-less match warns that this monster may have nothing to give',
  unsure.lines.some((l) => /may have nothing to give/.test(l)), true);
check('...and a certain one does not', go.lines.some((l) => /may have nothing/.test(l)), false);

// --- what the page is already telling you ---------------------------------

check('a use that missed the moment is called out', [
  api.cueNotes(TOOLS, 'You hold out the molybdenum magnet, but nothing happens.'),
  api.cueNotes(RAVERS, 'It seems like there\'s something to this guy\'s movements that ' +
    'might be useful to you, if only you could find the right moment to focus on.'),
  api.cueNotes(RAVERS, 'Meh, you can\'t bring yourself to do that goofy move twice in ' +
    'one fight. You have some self-respect, after all.'),
], [
  ['That use missed the moment — the magnet did nothing.'],
  ['That handwave landed on the wrong move — nothing was learned.'],
  ['Already handwaved this fight; it only works once per combat.'],
]);

check('a clean round has nothing to add', [
  api.cueNotes(TOOLS, 'It whips out a screwdriver and stabs you with it.'),
  api.cueNotes(RAVERS, 'He hits you with his teddybear backpack.'),
], [[], []]);

// --- the dropdown values --------------------------------------------------

// Item 2497 and skill 49 are what KoL's own dropdowns carry
// (`<option picurl=magnet2 value=2497>`, `<option value="49" picurl="loop">`).
check('the cues point at the right dropdown entries', [
  TOOLS.act.kind, TOOLS.act.value, RAVERS.act.kind, RAVERS.act.value,
], ['item', '2497', 'skill', '49']);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
