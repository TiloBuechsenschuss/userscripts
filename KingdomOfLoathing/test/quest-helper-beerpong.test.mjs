// Ad-hoc test for KingdomOfLoathing/quest-helper.js's Insult Beer Pong helper
// (beerpong.php, the Rickets match in Barrrney's Barrr).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the DOM-free helpers. Same re-expose trick as the rotation,
// 8-bit, combat and sven tests -- the script bails before the end of its IIFE,
// so the internals are handed back by replacing the dispatch line.
//
// What's pinned here, and why:
//   - the eight insult/retort pairs, in order. The option value posted as
//     `response` IS the pair's 1-based index, so an entry inserted or reordered
//     silently starts answering with the wrong retort. Checked against the
//     wiki's table, which is also KoLmafia's BeerPongRequest.PIRATE_INSULTS.
//   - that the five Monkey Island retorts (9-13) are kept, and kept separate.
//     They're always wrong, and the only reason to know them is to never pick
//     one.
//   - the three round patterns Rickets' insult arrives in, since round 2 and 3
//     read nothing like round 1.
//   - preposition tolerance. The Sword of Procedural Prepositions rewrites the
//     prepositions in every line on the page, so an exact string compare misses
//     exactly when you're wielding the quest's own reward weapon.
//   - the odds, against the wiki's own published table.
//   - that an unread insult, or an unreadable dropdown, says so instead of
//     naming a retort.
//
//   node KingdomOfLoathing/test/quest-helper-beerpong.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'quest-helper.js'), 'utf8');

// '/choice.php' is a pathname the script accepts, and it keeps both the
// charpane branch and every handler from running -- nothing is injected and we
// drive the helpers by hand instead.
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
    'return { PUZZLES, BEERPONG_INSULTS, BEERPONG_JOKES, ricketsInsult, ' +
    'matchInsult, beerpongKnown, beerpongOdds, beerpongPlan, beerpongAdvice };');
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

// --- registration ---------------------------------------------------------

const BP = api.PUZZLES.find((p) => p.name === 'Insult Beer Pong');

check('the puzzle is registered, typed, and scoped to beerpong.php', [
  !!BP, BP.type, BP.auto,
  BP.page.test('/beerpong.php'), BP.page.test('/choice.php'), BP.page.test('/fight.php'),
], [true, 'beerpong', true, true, false, false]);

// --- the answer table -----------------------------------------------------

// The wiki's table, which is byte-for-byte KoLmafia's PIRATE_INSULTS. The ORDER
// is load-bearing: the option value posted as `response` is the 1-based index
// into this list, so this pins position as well as content.
const WIKI = [
  ['Arrr, the power of me serve\'ll flay the skin from yer bones!',
    'Obviously neither your tongue nor your wit is sharp enough for the job.'],
  ['Do ye hear that, ye craven blackguard? It be the sound of yer doom!',
    'It can\'t be any worse than the smell of your breath!'],
  ['Suck on this, ye miserable, pestilent wretch!',
    'That reminds me, tell your wife and sister I had a lovely time last night.'],
  ['The streets will run red with yer blood when I\'m through with ye!',
    'I\'d\'ve thought yellow would be more your color.'],
  ['Yer face is as foul as that of a drowned goat!',
    'I\'m not really comfortable being compared to your girlfriend that way.'],
  ['When I\'m through with ye, ye\'ll be crying like a little girl!',
    'It\'s an honor to learn from such an expert in the field.'],
  ['In all my years I\'ve not seen a more loathsome worm than yerself!',
    'Amazing! How do you manage to shave without using a mirror?'],
  ['Not a single man has faced me and lived to tell the tale!',
    'It only seems that way because you haven\'t learned to count to one.'],
];

check('there are exactly eight winning pairs', api.BEERPONG_INSULTS.length, 8);

check('every pair matches the wiki, in the wiki\'s order',
  api.BEERPONG_INSULTS.map((p) => [p.rickets, p.retort]), WIKI);

// The five Monkey Island retorts. They are options 9-13 and they always lose;
// they're listed only so the helper can recognise and refuse them.
check('the five failing retorts are kept, and kept out of the answer table', [
  api.BEERPONG_JOKES,
  api.BEERPONG_JOKES.some((j) => api.BEERPONG_INSULTS.some((p) => p.retort === j)),
], [[
  'How appropriate, you fight like a cow.',
  'Look, a three-headed monkey!',
  'I\'m rubber and you\'re glue.',
  'I know you are, but what am I?',
  'First you\'d better stop waving it around like a feather-duster.',
], false]);

// --- reading Rickets' insult off the page ---------------------------------

// The three rounds phrase it completely differently; these are KoLmafia's own
// patterns, run against page text rather than raw HTML.
const ROUND1 = 'The pirate lobs his ball at your cups. "Yer face is as foul as ' +
  'that of a drowned goat!" he taunts, with a sneer.';
const ROUND2 = 'He scowls at you. "However -- Not a single man has faced me and ' +
  'lived to tell the tale!" he says.';
const ROUND3 = 'Rickets narrows his eyes and growls "Suck on this, ye miserable, ' +
  'pestilent wretch!" at you.';

check('each round\'s insult is read out of its own phrasing', [
  api.ricketsInsult(ROUND1),
  api.ricketsInsult(ROUND2),
  api.ricketsInsult(ROUND3),
], [
  'Yer face is as foul as that of a drowned goat!',
  'Not a single man has faced me and lived to tell the tale!',
  'Suck on this, ye miserable, pestilent wretch!',
]);

check('a page with no insult on it reads as nothing, not as insult #1',
  api.ricketsInsult('You push through the crowd and look Rickets in the eyes.'), null);

// --- matching it to the table ---------------------------------------------

check('each of the eight insults matches its own index',
  api.BEERPONG_INSULTS.map((p) => api.matchInsult(p.rickets)),
  [1, 2, 3, 4, 5, 6, 7, 8]);

check('an insult nobody said matches nothing', api.matchInsult('Arrr.'), 0);

// Insult 3 is the one KoL italicises ("Suck on <i>this</i>"). We read
// textContent, so the tags are already gone -- but the entity-decoded and
// curly-quoted shapes have to land on 3 as well.
check('the italicised insult still matches once the tags are gone', [
  api.matchInsult('Suck on this, ye miserable, pestilent wretch!'),
  api.matchInsult('Suck on <i>this</i>, ye miserable, pestilent wretch!'),
], [3, 3]);

// The Sword of Procedural Prepositions -- the reward for this very quest chain
// -- swaps every preposition on the page for a different one. KoLmafia masks
// prepositions to compare; so do we, which makes the swap invisible.
check('a preposition-swapped insult still matches (Sword of Procedural Prepositions)', [
  api.matchInsult('Arrr, the power of me serve\'ll flay the skin ' +
    'beneath yer bones!'),
  api.matchInsult('Yer face is as foul as that among a drowned goat!'),
], [1, 5]);

check('...and swapping a real word, not a preposition, does not match',
  api.matchInsult('Yer face is as foul as that of a drowned parrot!'), 0);

// The round-1 sentence has a preposition of its own ("lobs his ball AT your
// cups"), so the sentence pattern has to survive the sword too.
check('the round-1 pattern survives the sword as well',
  api.ricketsInsult('The pirate lobs his ball beneath your cups. "Not a single ' +
    'man has faced me and lived to tell the tale!" he taunts, with a sneer.'),
  'Not a single man has faced me and lived to tell the tale!');

// --- which retorts you have -----------------------------------------------

// KoL renders only the retorts you've collected, so the dropdown IS the
// inventory. Options above 8 are the failing five and say nothing about what
// you know -- same rule KoLmafia parses the form by.
check('the dropdown is read as the list of retorts you own',
  api.beerpongKnown(['2', '5', '6', '9', '10', '11', '12', '13']), [2, 5, 6]);

check('junk and duplicate option values are dropped',
  api.beerpongKnown(['', 'x', '3', '3', '0', '-1', '99']), [3]);

// --- the odds -------------------------------------------------------------

// The wiki's table, first column (one game): three rounds, drawn without
// replacement from the eight insults.
const pct = (n) => Math.round(api.beerpongOdds(n) * 1000) / 10;
check('the win chance matches the wiki\'s published table',
  [2, 3, 4, 5, 6, 7, 8].map(pct), [0, 1.8, 7.1, 17.9, 35.7, 62.5, 100]);

check('fewer than three retorts is impossible, not merely unlikely',
  [api.beerpongOdds(0), api.beerpongOdds(1), api.beerpongOdds(2)], [0, 0, 0]);

// --- the plan -------------------------------------------------------------

const plan = (index, known, readable = true) =>
  api.beerpongPlan({ index, known, readable });

const HAVE = plan(4, [1, 2, 4, 5, 6]);
check('a retort you own is named, with the option value to post', [
  HAVE.know, HAVE.value, HAVE.retort, HAVE.count, HAVE.missing,
], [true, '4', 'I\'d\'ve thought yellow would be more your color.', 5, [3, 7, 8]]);

const LACK = plan(7, [1, 2, 4, 5, 6]);
check('a retort you don\'t own is refused, not guessed at', [
  LACK.know, LACK.value, LACK.retort,
], [false, null, 'Amazing! How do you manage to shave without using a mirror?']);

const BLIND = plan(0, [1, 2, 4, 5, 6]);
check('an unmatched insult still counts what you own', [
  BLIND.index, BLIND.know, BLIND.retort, BLIND.count,
], [0, false, null, 5]);

const UNREAD = plan(4, [], false);
check('an unreadable dropdown claims nothing about what you own', [
  UNREAD.readable, UNREAD.know, UNREAD.count, UNREAD.missing,
], [false, false, null, null]);

// --- the advice -----------------------------------------------------------

const advice = (...args) => api.beerpongAdvice(plan(...args));

const GO = advice(4, [1, 2, 3, 4, 5, 6, 7, 8]);
check('a known retort reads as go, and names the retort', [
  GO.tone,
  /insult #4/i.test(GO.headline),
  GO.headline.includes('I\'d\'ve thought yellow would be more your color.'),
], ['go', true, true]);

const STOP = advice(7, [1, 2, 4, 5, 6]);
check('a missing retort reads as stop and says the game is lost', [
  STOP.tone,
  /haven't learned/i.test(STOP.headline),
  STOP.lines.some((l) => /Big Book of Pirate Insults/.test(l)),
], ['stop', true, true]);

const QUIET = advice(0, [1, 2, 4, 5, 6]);
check('an unread insult admits it rather than naming a retort', [
  QUIET.tone,
  /couldn't read/i.test(QUIET.headline),
  api.BEERPONG_INSULTS.some((p) => QUIET.headline.includes(p.retort)),
], ['turn', true, false]);

const DARK = advice(4, [], false);
check('an unreadable dropdown admits it instead of claiming an empty list', [
  DARK.tone,
  /couldn't read the retort dropdown/i.test(DARK.headline),
  DARK.lines.some((l) => /you know 0/i.test(l)),
], ['turn', true, false]);

check('every state reports what you own and what it\'s worth',
  [GO, STOP, QUIET].every((a) =>
    a.lines.some((l) => /you know \d of the 8/i.test(l)) &&
    a.lines.some((l) => /win/i.test(l))), true);

const DOOMED = advice(4, [4, 5]);
check('two retorts is called out as unwinnable, whatever this round says',
  DOOMED.lines.some((l) => /cannot win/i.test(l)), true);

check('the failing five are never offered as an answer',
  api.BEERPONG_JOKES.every((j) =>
    ![GO, STOP, QUIET, DARK, DOOMED].some((a) =>
      a.headline.includes(j) || a.lines.some((l) => l.includes(j)))), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
