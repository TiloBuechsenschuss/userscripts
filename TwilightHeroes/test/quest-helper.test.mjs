// Ad-hoc test for TwilightHeroes/quest-helper.js stage matching.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (no headings, so nothing is injected), and pulls out `hintFor` to assert that
// a given quest + journal entry text resolves to the expected next-step hint.
// It focuses on the tricky cases: prefix-extending stages (where a later stage's
// entry contains an earlier stage's text) and the wiki-walkthrough fallback.
//
//   node TwilightHeroes/test/quest-helper.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, '..', 'quest-helper.js');
const src = readFileSync(scriptPath, 'utf8');

// Stub DOM: querySelectorAll returns nothing, so the script's injection pass is
// a no-op. We only want the internal helpers.
const fakeDoc = { querySelectorAll: () => [] };
const fakeLocation = { pathname: '/journal.php' };

// Re-expose the IIFE's internals: name the IIFE and have it return the helpers.
const wrapped = src
  .replace('(function () {', 'globalThis.__qh = (function () {')
  .replace(/\}\)\(\);\s*$/, 'return { QUESTS, hintFor, key, normForMatch, headingName }; })();');
const fn = new Function('document', 'location', wrapped + '\nreturn globalThis.__qh;');
const api = fn(fakeDoc, fakeLocation);

const FALLBACK = 'walkthrough for this quest';

let failures = 0;
function check(quest, entry, expectSubstr) {
  const h = api.hintFor(quest, entry);
  const ok = h && h.includes(expectSubstr);
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', quest, '=>', (h || '').slice(0, 70));
  if (!ok) console.log('   expected to contain:', expectSubstr, '\n   got:', h);
}

// Assert a curated stage matched (i.e. NOT the wiki fallback), without pinning
// the exact hint wording -- hints get reworded freely, the match must still resolve.
function checkMatched(quest, entry) {
  const h = api.hintFor(quest, entry);
  const ok = h && !h.includes(FALLBACK);
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', quest, '=>', (h || '').slice(0, 70));
  if (!ok) console.log('   expected a curated hint, got fallback/empty:', h);
}

// --- Sample page entries ---
check('Age of Destruction, in a World of Corruption',
  "You've defeated the Mick, but at the cost of having a chunk of the city destroyed, and nearly getting killed yourself. Susan has created a R.E.T.C.O.N. device",
  'R.E.T.C.O.N.');
check('Asylumbreak! Battle of Shiloh',
  "You've found a secret facility under Shiloh Sanatarium. It's still being excavated.",
  'Goldbergium Door');
checkMatched('Cleaning Up',
  "There are a lot of streets in Twilight and they could all use cleaning");

// --- Prefix-overlap: a later stage extends an earlier stage's text ---
check('C.H.I.P.S. (Casino Heroes Investigate Purported Scandal)',
  "Rand has asked you to check out the seedy casinos.",
  'encrypted swipe card');
check('C.H.I.P.S. (Casino Heroes Investigate Purported Scandal)',
  "Rand has asked you to check out the seedy casinos. He thinks the mafia may be using the back of the house to launder money.",
  'electronic computer');

check('Rejected Rogue Ranch Rascals Require Retribution',
  "Your retired hero friend from Somerset has asked you to take out the boss of the baddies at the Rejected rogue ranch.",
  'Travel to');
check('Rejected Rogue Ranch Rascals Require Retribution',
  "Your retired hero friend from Somerset has asked you to take out the boss of the baddies at the Rejected Rogue Ranch. You've found the Ranch.",
  'find the leader');

check('A Mysterious Ruin',
  "You've found something strange out in the desert.",
  'Tell');
check('A Mysterious Ruin',
  "You've found something strange out in the desert and you've told Susan about it.",
  'Wait for');

check("All the World's a Quest, and All the Men and Women Merely Heroes",
  "Maybe the pieces of The Bard's script can be used against him?",
  'six');
check("All the World's a Quest, and All the Men and Women Merely Heroes",
  "Maybe the pieces of The Bard's script can be used against him? Try putting the whole manuscript together and see what you can do with it.",
  'script page 1');

// --- Go Fish, Again: three stages share the same opening ---
check('Go Fish, Again',
  "The eco-terrorists on the oil platform have led you to their underwater base.",
  'locked-door');
check('Go Fish, Again',
  "The eco-terrorists on the oil platform have led you to their underwater base. You should investigate more about what they are up to.",
  'Lightning Rod Jones');
check('Go Fish, Again',
  "The eco-terrorists on the oil platform have led you to their underwater base, where you've discovered that they have dealings with the nefarious Mick.",
  'key card');

// --- headingName: must drop the wiki-links badge (<a class="th-wiki-link">W</a>)
// the sibling script injects into the same heading, else the name picks up "W". ---
function checkHeadingName(childNodes, expect) {
  const heading = { childNodes };
  const got = api.headingName(heading);
  const ok = got === expect;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '| headingName =>', JSON.stringify(got));
  if (!ok) console.log('   expected:', JSON.stringify(expect));
}
const textNode = (t) => ({ nodeType: 3, textContent: t });
const badge = { nodeType: 1, textContent: 'W',
  classList: { contains: (c) => c === 'th-wiki-link' } };
checkHeadingName([textNode('Cleaning Up'), badge], 'Cleaning Up');
checkHeadingName(
  [textNode('Age of Destruction, in a World of Corruption'), badge],
  'Age of Destruction, in a World of Corruption');

// --- Fallbacks ---
check('Some Brand New Quest', 'blah blah', 'walkthrough for this quest');
check('Go Fish', 'Some totally different unmapped text', 'walkthrough for this quest');

console.log(failures ? `\n${failures} FAILED` : '\nAll passed');
process.exit(failures ? 1 : 0);
