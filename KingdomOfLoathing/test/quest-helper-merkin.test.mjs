// Ad-hoc test for KingdomOfLoathing/quest-helper.js's Mer-kin Deepcity work:
// the Colosseum counters (gladiator path) and the dreadscroll clue tracker
// (scholar path).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the DOM-free helpers. Same re-expose trick as the rotation,
// combat, 8-bit and Sven tests -- the script bails before the end of its IIFE,
// so the internals are handed back by replacing the dispatch line.
//
// What's pinned here, and why:
//
//   - THE COUNTER MAPPING. You counter a gladiator with the NEXT weapon round
//     the cycle, never the one he is carrying: a balldodger with the dragnet, a
//     netdragger with the switchblade, a bladeswitcher with the dodgeball.
//     Inverting that is the single most likely edit-time mistake here, and it
//     would spend a round on a skill that does nothing.
//   - the monster ids (KoLmafia's monsters.txt) and the skill ids
//     (classskills.txt), including that each special's skill belongs to the
//     weapon the role is countered with.
//   - that each telegraph sentence fires its own special and nothing else, and
//     that an ordinary round fires none. A cue that fires every round is worse
//     than no cue.
//   - that the advice refuses to promise a counter you cannot cast: the skills
//     come from the weapon, so "not in the dropdown" has to read as "wrong
//     weapon (or he disarmed you)", never as "cast it anyway".
//
//   - THE DEEP-TAINTED MIND ARITHMETIC. Three turns per wrong word, minus the
//     turn the reading itself burned (or two of them, surfacing without Fishy).
//     Ceiling division is what folds 3x, 3x-1 and 3x-2 back onto x; plain
//     division would score a failure one word too kind and poison the solver.
//   - that a clue is only read from a page that carries the sentence which
//     PRINTS it -- most of all that the dreadscroll's own page, which shows all
//     thirty-two candidate words at once, yields nothing at all.
//   - the solver: that it counts what is actually left, that a failed reading
//     narrows it, and that contradictory input reports zero rather than picking
//     something.
//
//   node KingdomOfLoathing/test/quest-helper-merkin.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'quest-helper.js'), 'utf8');

// '/choice.php' is a pathname the script accepts, and with no document.body the
// clue harvest and every page-reading branch fall straight through -- nothing
// is injected and we drive the helpers by hand instead.
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
    'return { PUZZLES, MERKIN_ROLES, MERKIN_WEAPONS, MERKIN_WEAPON_SKILLS, ' +
    'MERKIN_MONSTERS, merkinGladiatorFrom, merkinRead, merkinRound, merkinAdvice, ' +
    'DREAD_SLOTS, DREAD_TEMPLATE, dreadWrongFromDuration, dreadHarvest, dreadOutcome, ' +
    'dreadSolve, dreadProphecy, dreadMatchOption, dreadClueIndex };');
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

// ==========================================================================
// The gladiator path: the Mer-kin Colosseum
// ==========================================================================

const COLOSSEUM = api.PUZZLES.find((p) => p.name === 'Mer-kin Colosseum');

check('the colosseum entry is registered, typed and scoped to fight.php', [
  !!COLOSSEUM, COLOSSEUM.type, COLOSSEUM.auto,
  COLOSSEUM.page.test('/fight.php'), COLOSSEUM.page.test('/choice.php'),
], [true, 'counter', true, true, false]);

// THE mapping. Each gladiator is beaten with the weapon of the NEXT one in the
// cycle, so no gladiator is ever countered with his own weapon.
check('each role is countered with the next weapon round the cycle', [
  api.MERKIN_ROLES.balldodger.weapon,
  api.MERKIN_ROLES.netdragger.weapon,
  api.MERKIN_ROLES.bladeswitcher.weapon,
], ['dragnet', 'switchblade', 'dodgeball']);

check('...which is never the weapon the gladiator himself is named for',
  ['balldodger', 'netdragger', 'bladeswitcher']
    .filter((r) => api.MERKIN_ROLES[r].weapon.indexOf(r.slice(0, 4)) === 0),
  []);

check('the cycle wraps balldodger -> netdragger -> bladeswitcher -> balldodger', [
  api.MERKIN_ROLES.balldodger.next,
  api.MERKIN_ROLES.netdragger.next,
  api.MERKIN_ROLES.bladeswitcher.next,
], ['netdragger', 'bladeswitcher', 'balldodger']);

// Ids from KoLmafia's monsters.txt: the three ordinary gladiators and, right
// alongside them, the three champions of rounds 13/14/15.
check('the six colosseum monster ids name the right role', [
  api.MERKIN_MONSTERS[842], api.MERKIN_MONSTERS[843], api.MERKIN_MONSTERS[844],
  api.MERKIN_MONSTERS[879], api.MERKIN_MONSTERS[880], api.MERKIN_MONSTERS[881],
], [
  'balldodger', 'netdragger', 'bladeswitcher',
  'balldodger', 'netdragger', 'bladeswitcher',
]);

// Every counter skill has to come from the weapon the role is countered with,
// or the "is it in the dropdown" test would be asking about the wrong item.
check('each special\'s skill belongs to the weapon that counters its role',
  Object.keys(api.MERKIN_ROLES).filter((key) => {
    const role = api.MERKIN_ROLES[key];
    const owned = api.MERKIN_WEAPON_SKILLS[role.weapon];
    return !role.specials.every((s) => owned.indexOf(s.skill) !== -1);
  }),
  []);

check('the nine skill ids are KoLmafia\'s', [
  api.MERKIN_WEAPON_SKILLS.dodgeball,
  api.MERKIN_WEAPON_SKILLS.dragnet,
  api.MERKIN_WEAPON_SKILLS.switchblade,
], [
  ['7085', '7086', '7087'], ['7088', '7089', '7090'], ['7091', '7092', '7093'],
]);

check('the three weapons carry their item ids', [
  api.MERKIN_WEAPONS.dodgeball.id,
  api.MERKIN_WEAPONS.dragnet.id,
  api.MERKIN_WEAPONS.switchblade.id,
], ['4292', '4293', '4294']);

// --- who you're fighting ---------------------------------------------------

check('a monster id names the role, and marks a champion as one', [
  api.merkinGladiatorFrom(844, '').role.key,
  api.merkinGladiatorFrom(844, '').champion,
  api.merkinGladiatorFrom(881, '').role.key,
  api.merkinGladiatorFrom(881, '').champion,
], ['bladeswitcher', false, 'bladeswitcher', true]);

check('the name is the fallback when the id comment is missing', [
  api.merkinGladiatorFrom(null, 'mer-kin netdragger').role.key,
  api.merkinGladiatorFrom(null, 'johnringo, the netdragger').role.key,
  api.merkinGladiatorFrom(null, 'johnringo, the netdragger').champion,
], ['netdragger', 'netdragger', true]);

check('anything else in the sea is not a gladiator', [
  api.merkinGladiatorFrom(1234, 'mer-kin raider'),
  api.merkinGladiatorFrom(null, ''),
], [null, null]);

// --- reading the round -----------------------------------------------------

// The wiki's telegraph sentences, with the bolded word flattened in as the
// page's textContent gives it to us.
const TELEGRAPH = {
  gain: 'He glances at your exposed underbelly and cocks his arm back for a powerful ' +
    'throw. Looks like he\'s trying to gain an advantage over you...',
  loss: 'He gets a crazy look in his eyes -- like he\'s about to experience a serious ' +
    'loss of control...',
  neutrality: 'He closes his eyes and begins to meditate. His facial features take on an ' +
    'ominous neutrality.',
  sling: 'He starts to fold his net up into some sort of a sling.',
  roller: 'He rolls his net up and draws it back like a baseball bat.',
  runner: 'He attaches some sharp metal barbs to his net. If you were a runner, you\'d be ' +
    'tempted to run right now...',
  bust: 'He begins to bust an especially dope move with his switchblade.',
  sweat: 'He pauses to wipe the sweat from his brow.',
  sack: 'He pulls a little bottle of oil out of his sack and applies it to his switchblade.',
};

const ORDINARY_ROUND = 'He beans you in the neck with the ball, causing you to bawl. ' +
  'Ow! You lose 412 hit points.';

check('each balldodger telegraph fires its own special and no other', [
  api.merkinRead(api.MERKIN_ROLES.balldodger, TELEGRAPH.gain).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.balldodger, TELEGRAPH.loss).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.balldodger, TELEGRAPH.neutrality).telegraph.skillName,
], ['Net Gain', 'Net Loss', 'Net Neutrality']);

check('...and the same for the netdragger and the bladeswitcher', [
  api.merkinRead(api.MERKIN_ROLES.netdragger, TELEGRAPH.sling).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.netdragger, TELEGRAPH.roller).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.netdragger, TELEGRAPH.runner).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.bladeswitcher, TELEGRAPH.bust).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.bladeswitcher, TELEGRAPH.sweat).telegraph.skillName,
  api.merkinRead(api.MERKIN_ROLES.bladeswitcher, TELEGRAPH.sack).telegraph.skillName,
], [
  'Blade Sling', 'Blade Roller', 'Blade Runner',
  'Ball Bust', 'Ball Sweat', 'Ball Sack',
]);

check('an ordinary round telegraphs nothing', [
  api.merkinRead(api.MERKIN_ROLES.balldodger, ORDINARY_ROUND).telegraph,
  api.merkinRead(api.MERKIN_ROLES.balldodger, ORDINARY_ROUND).landed,
], [null, null]);

// One gladiator's telegraph must not be read as another's -- a bladeswitcher
// round would otherwise be answered with a dragnet skill.
check('a telegraph is only ever read against its own gladiator', [
  api.merkinRead(api.MERKIN_ROLES.balldodger, TELEGRAPH.sack).telegraph,
  api.merkinRead(api.MERKIN_ROLES.netdragger, TELEGRAPH.gain).telegraph,
], [null, null]);

check('a special that went through uncountered is recognised', [
  api.merkinRead(api.MERKIN_ROLES.bladeswitcher,
    'He finishes up his dance by twirling his blade around himself so fast that you ' +
    'can\'t even see it anymore. It looks really dangerous!').landed.word,
  api.merkinRead(api.MERKIN_ROLES.balldodger,
    'He reopens his eyes, which are now glowing eerily. That can\'t be good.').landed.word,
], ['bust', 'neutrality']);

check('the announcer\'s round number is read, and only a real one', [
  api.merkinRound('"Round 13!" he screams.'),
  api.merkinRound('"Round 1!" he screams.'),
  api.merkinRound('"Round 42!" he screams.'),
  api.merkinRound(ORDINARY_ROUND),
], [13, 1, null, null]);

// --- the advice ------------------------------------------------------------

const bladeswitcher = api.merkinGladiatorFrom(844, '');
const readSack = api.merkinRead(api.MERKIN_ROLES.bladeswitcher, TELEGRAPH.sack);
const readNone = api.merkinRead(api.MERKIN_ROLES.bladeswitcher, ORDINARY_ROUND);

const armedRight = api.merkinAdvice(bladeswitcher, readSack, ['dodgeball'], 7);
check('telegraph + the right weapon is a green light naming the skill', [
  armedRight.tone, armedRight.headline,
], ['go', 'Counter with Ball Sack NOW — otherwise he flicks your weapon out of your hand ' +
  'for the rest of the fight.']);

check('...and says the button only picks the skill',
  armedRight.lines[0].indexOf('you press the skill button yourself') !== -1, true);

const armedWrong = api.merkinAdvice(bladeswitcher, readSack, ['dragnet'], 7);
check('telegraph without the skill refuses to promise a counter', [
  armedWrong.tone,
  armedWrong.headline,
  armedWrong.lines[0].indexOf('Mer-kin dodgeball') !== -1,
], ['stop', 'Ball Sack is what stops this, and you haven\'t got it.', true]);

check('...and names the weapon you appear to be holding instead',
  armedWrong.lines[1],
  'You look to be holding the Mer-kin dragnet, which is the one for a balldodger.');

const disarmed = api.merkinAdvice(bladeswitcher, readSack, [], 7);
check('with no gladiatorial skills at all it still explains why',
  disarmed.lines[0].indexOf('his "sack" special has already taken it') !== -1, true);

const quiet = api.merkinAdvice(bladeswitcher, readNone, ['dodgeball'], 7);
check('a quiet round with the right weapon just says to keep watching', [
  quiet.tone, quiet.headline,
], ['turn', 'No telegraph this round. You are holding the right weapon for a bladeswitcher.']);

const wrongWeapon = api.merkinAdvice(bladeswitcher, readNone, ['dragnet'], 7);
check('a quiet round with the wrong weapon says which one to go and get', [
  wrongWeapon.tone, wrongWeapon.headline,
], ['stop', 'Wrong weapon: a bladeswitcher is countered with the Mer-kin dodgeball.']);

// Fleeing costs a turn and nothing else, and puts you back against the same
// gladiator -- which is the whole reason this is worth saying out loud.
check('...and that fleeing to re-equip is cheap',
  wrongWeapon.lines[0].indexOf('the SAME gladiator') !== -1, true);

check('every reading ends by naming the next round\'s opponent and weapon', [
  armedRight.lines[armedRight.lines.length - 1],
  api.merkinAdvice(api.merkinGladiatorFrom(842, ''), readNone, ['dragnet'], 1)
    .lines.slice(-1)[0],
], [
  'Next round is a balldodger, and that one wants the Mer-kin dragnet.',
  'Next round is a netdragger, and that one wants the Mer-kin switchblade.',
]);

const champion = api.merkinAdvice(api.merkinGladiatorFrom(881, ''), readNone, ['dodgeball'], 15);
check('a champion is flagged as specialling every round, without a set breakdown', [
  champion.lines.some((l) => l.indexOf('every single round') !== -1),
  champion.lines.some((l) => l.indexOf('rounds 1-3 use no') !== -1),
], [true, false]);

check('an ordinary gladiator gets the set breakdown instead',
  quiet.lines.some((l) => l.indexOf('Round 7 of 15') === 0), true);

check('a landed special is reported with what it did to you',
  api.merkinAdvice(bladeswitcher,
    api.merkinRead(api.MERKIN_ROLES.bladeswitcher,
      'twirling his blade around himself so fast that you can\'t even see it anymore'),
    ['dodgeball'], 7)
    .lines.some((l) => l.indexOf('His "bust" special went through') === 0),
  true);

// ==========================================================================
// The scholar path: the Mer-kin dreadscroll
// ==========================================================================

const SCROLL = api.PUZZLES.find((p) => p.name === 'Mer-kin dreadscroll');
const CATALOG = api.PUZZLES.find((p) => p.name === 'Playing the Catalog Card');

check('both scholar-path entries are registered on the right choices', [
  SCROLL.choice, SCROLL.type, CATALOG.choice, CATALOG.type,
], ['703', 'dreadscroll', '704', 'catalog']);

check('the scroll has eight slots of four words', [
  api.DREAD_SLOTS.length,
  api.DREAD_SLOTS.every((s) => s.options.length === 4),
  api.DREAD_SLOTS.map((s) => s.n),
], [8, true, [1, 2, 3, 4, 5, 6, 7, 8]]);

check('three of them come from the library card catalogue',
  api.DREAD_SLOTS.filter((s) => s.library).map((s) => s.n), [1, 6, 8]);

// --- how a failed reading is scored ---------------------------------------

// Three turns per wrong word, less the turn the reading itself burned -- and
// two of them if you were out of the water without Fishy. Ceiling division
// folds all three shapes back onto the same answer; plain division would score
// 8 turns as 2 wrong words instead of 3.
check('a Deep-Tainted Mind is scored the same however the turn was charged', [
  api.dreadWrongFromDuration(9), api.dreadWrongFromDuration(8), api.dreadWrongFromDuration(7),
  api.dreadWrongFromDuration(6), api.dreadWrongFromDuration(5), api.dreadWrongFromDuration(4),
  api.dreadWrongFromDuration(3), api.dreadWrongFromDuration(2), api.dreadWrongFromDuration(1),
  api.dreadWrongFromDuration(24),
], [3, 3, 3, 2, 2, 2, 1, 1, 1, 8]);

check('a duration that could not mean a reading is refused', [
  api.dreadWrongFromDuration(0), api.dreadWrongFromDuration(25), api.dreadWrongFromDuration('x'),
], [null, null, null]);

check('the outcome of a reading is read off the result page', [
  api.dreadOutcome('"Arise, High Priest." I guess you\'re the Mer-kin High Priest now. Cool!'),
  api.dreadOutcome('Something about that... wasn\'t right. You acquire an effect: ' +
    'Deep-Tainted Mind (duration: 12 Adventures)'),
  api.dreadOutcome('You acquire an effect: Deep-Tainted Mind (11 Adventures)'),
  api.dreadOutcome('You hit for 42 damage.'),
  api.dreadOutcome('You acquire an effect: Deep-Tainted Mind'),
], ['won', 4, 4, null, null]);

// --- harvesting the eight clues -------------------------------------------

// Each sentence is the one KoL prints, flattened as textContent gives it to us.
// Slot indices below are zero-based; the value is which of the four words.
const CLUE_PAGES = [
  ['the blood-scrawled book', 0, 3,
    'You can\'t make heads or tails of the contents of the book, but somebody has ' +
    'scrawled "THRICE-CURSED" on the inside of the front cover in what appears to be ' +
    'blood. Spooky.'],
  ['a healscroll in combat', 1, 2,
    'Horrific images begin to dance in your mind -- three-lidded eyes in the darkness, ' +
    'tentacles squirming along the ocean floor, a magnificent moonfish, smiling warmly ' +
    'in the distance, publicity stills from Battlefield Earth...'],
  ['Deep Dark Visions', 2, 4,
    'You close your eyes and let Deep visions wash over you. A terrible maw whispers of ' +
    'a grisly insurrection. The House of Pain'],
  ['a knucklebone', 3, 1,
    'You roll the bone, over and over, and every time it hits the ground, it bounces ' +
    'straight north. You get so weirded out by it that you throw it away.'],
  ['a killscroll in combat', 4, 3,
    'Something about the words on that scroll sticks in your mind. You actually did ' +
    'recognize one of them: "green". Strange.'],
  ['the creatures book', 5, 3,
    'You flip through the book, finding almost nothing of actual interest. You do notice, ' +
    'however, that there seem to be a lot of references to finless creatures. Curious.'],
  ['sushi with worktea', 6, 3,
    'You manage to inadvertently drink a cup of that gross Mer-kin tea while you\'re ' +
    'eating the sushi. And hey, look -- the leaves in the bottom look just like a shark!'],
  ['the repeated-phrase book', 7, 3,
    'You flip through the book, and find very little in the way of useful information. ' +
    'There is one curious chapter, though, which just consists of the phrase conjoined ' +
    'triplets over and over, hundreds of times. Creepy.'],
];

CLUE_PAGES.forEach(([label, slot, want, text]) => {
  const got = api.dreadHarvest(text);
  check('a clue is read from ' + label, got, { [slot]: want });
});

// THE guard. The dreadscroll's own page prints all thirty-two candidate words
// at once; reading a "clue" off it would file eight wrong answers in one go.
const SCROLL_PAGE =
  'When the lonely doubled thrice-cursed fourth starfish moonfish sunfish planetfish is ' +
  'in the House of Cards Blues Pancakes Pain, and the Northern Southern Eastern Western ' +
  'Current runs as red as blood as black as ink as green as bile as yellow as piss, when ' +
  'a blind giant finless two-headed eel turtle shark whale births one thousand squirming ' +
  'young two and twenty stillborn spawn conjoined triplets a brand new dance craze, the ' +
  'Elder shall awaken. Read Aloud';
check('the scroll\'s own page, with every candidate word on it, yields no clues',
  api.dreadHarvest(SCROLL_PAGE), {});

check('an unrelated page yields no clues',
  api.dreadHarvest('You acquire an item: seal tooth. Adventures left: 42.'), {});

check('a clue word that is not one of the four is not filed', [
  api.dreadHarvest('it bounces straight upwards. You get so weirded out'),
  api.dreadClueIndex(api.DREAD_SLOTS[3], 'north'),
  api.dreadClueIndex(api.DREAD_SLOTS[3], 'sideways'),
], [{}, 1, 0]);

// --- the solver ------------------------------------------------------------

const NONE = [0, 0, 0, 0, 0, 0, 0, 0];

const blank = api.dreadSolve(NONE, []);
check('with nothing known, every arrangement is still open', [
  blank.count, blank.alive[0], blank.pinned, blank.solution,
], [65536, [1, 2, 3, 4], NONE, null]);

check('each confirmed clue divides the field by four', [
  api.dreadSolve([2, 0, 0, 0, 0, 0, 0, 0], []).count,
  api.dreadSolve([2, 3, 0, 0, 0, 0, 0, 0], []).count,
], [16384, 4096]);

const solved = api.dreadSolve([1, 2, 3, 4, 1, 2, 3, 4], []);
check('all eight clues leave exactly one reading', [
  solved.count, solved.solution, solved.pinned,
], [1, [1, 2, 3, 4, 1, 2, 3, 4], [1, 2, 3, 4, 1, 2, 3, 4]]);

// A reading that got everything wrong is worth as much as eight clues would be
// worth in reverse: it rules one word out of every slot.
const allWrong = api.dreadSolve(NONE, [{ picks: [1, 1, 1, 1, 1, 1, 1, 1], wrong: 8 }]);
check('a reading with nothing right rules out one word per slot', [
  allWrong.count, allWrong.alive[0], allWrong.used, allWrong.ignored,
], [6561, [2, 3, 4], 1, 0]);

// The point of the whole thing: a failure is not a wasted turn, because the
// count of wrong words closes off part of the field.
const narrowed = api.dreadSolve([1, 1, 1, 1, 1, 1, 1, 0], [
  { picks: [1, 1, 1, 1, 1, 1, 1, 2], wrong: 1 },
  { picks: [1, 1, 1, 1, 1, 1, 1, 3], wrong: 1 },
]);
check('failed readings pin down the slot no clue has reached', [
  narrowed.count, narrowed.alive[7], narrowed.pinned[7],
], [2, [1, 4], 0]);

const pinned = api.dreadSolve([1, 1, 1, 1, 1, 1, 1, 0], [
  { picks: [1, 1, 1, 1, 1, 1, 1, 2], wrong: 1 },
  { picks: [1, 1, 1, 1, 1, 1, 1, 3], wrong: 1 },
  { picks: [1, 1, 1, 1, 1, 1, 1, 4], wrong: 1 },
]);
check('...and one more failure finishes the job', [
  pinned.count, pinned.solution, pinned.pinned[7],
], [1, [1, 1, 1, 1, 1, 1, 1, 1], 1]);

// A contradiction has to be reported as one. Guessing here would hand the
// player eight confident words that cannot all be right.
check('input that cannot all be true reports nothing left, not a guess', [
  api.dreadSolve([1, 0, 0, 0, 0, 0, 0, 0],
    [{ picks: [1, 1, 1, 1, 1, 1, 1, 1], wrong: 8 }]).count,
  api.dreadSolve([1, 0, 0, 0, 0, 0, 0, 0],
    [{ picks: [1, 1, 1, 1, 1, 1, 1, 1], wrong: 8 }]).solution,
], [0, null]);

// A reading we could not score in full is dropped whole rather than applied in
// part -- a half-counted guess would rule out arrangements that are still live.
const partial = api.dreadSolve(NONE, [
  { picks: [1, 1, 1, 1, 1, 1, 1, 0], wrong: 8 },
  { picks: [2, 2, 2, 2, 2, 2, 2, 2], wrong: 8 },
]);
check('an unreadable reading is ignored and counted, not half-applied', [
  partial.used, partial.ignored, partial.alive[0],
], [1, 1, [1, 3, 4]]);

// --- the prophecy readout --------------------------------------------------

check('the prophecy is assembled from the picks, with ??? for the unknown',
  api.dreadProphecy([3, 2, 4, 1, 1, 1, 3, 2]),
  'When the thrice-cursed moonfish is in the House of Pain,\n' +
  'and the Northern Current runs as red as blood,\n' +
  'when a blind shark births two and twenty stillborn spawn,\n' +
  'the Elder shall awaken.');

check('...and an empty tracker reads as eight blanks',
  (api.dreadProphecy(NONE).match(/\?\?\?/g) || []).length, 8);

// The wiki transcribes slot 1's second word as "double" where KoLmafia has
// "doubled"; the matcher has to accept whichever the live dropdown says.
check('a dropdown label is matched loosely enough to cover double/doubled', [
  api.dreadMatchOption('doubled', api.DREAD_SLOTS[0].options[1]),
  api.dreadMatchOption('double', api.DREAD_SLOTS[0].options[1]),
  api.dreadMatchOption('Doubled', api.DREAD_SLOTS[0].options[1]),
  api.dreadMatchOption('lonely', api.DREAD_SLOTS[0].options[1]),
], [true, true, true, false]);

check('...but not so loosely that two words in a slot collide',
  api.DREAD_SLOTS.filter((slot) =>
    slot.options.some((a, i) =>
      slot.options.some((b, j) => i !== j && api.dreadMatchOption(b.word, a)))),
  []);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
