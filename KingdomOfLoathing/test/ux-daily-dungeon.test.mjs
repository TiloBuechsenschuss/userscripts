// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js Daily Dungeon skip marker.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a non-matching location, so no feature runs on load), and pulls out the
// Daily Dungeon helpers.
//
// What matters here is the NEGATIVE half. The point of the feature is that one
// button in a stack of look-alike buttons costs no adventure; if the marker
// ever lands on "Try the doorknob" or "Proceed forward cautiously" it is worse
// than useless, because those are the two options the feature exists to steer
// people away from (a trap, or half your maximum HP). So every dangerous label
// on all four rooms is pinned as unmatched, and each free option is pinned to
// its own room only.
//
// Labels and choice numbers are the wiki's:
//   690 The First Chest Isn't the Deepest. / 691 Second Chest
//   692 I Wanna Be a Door / 693 It's Almost Certainly a Trap
//
//   node KingdomOfLoathing/test/ux-daily-dungeon.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// A stub page the tests can rewrite between cases. The feature reads the
// ambient `document`, so the document object stays the same and only what it
// answers with changes.
let page = { choice: null, buttons: [] };

function makeNode(tag, label) {
  const node = {
    tagName: tag.toUpperCase(),
    value: tag === 'button' ? undefined : label,
    textContent: tag === 'button' ? label : '',
    style: {},
    dataset: {},
  };
  node.parentNode = {
    children: [node],
    insertBefore(newNode, ref) {
      const at = ref ? this.children.indexOf(ref) : this.children.length;
      this.children.splice(at < 0 ? this.children.length : at, 0, newNode);
    },
  };
  return node;
}

const fakeDoc = {
  images: [],
  readyState: 'complete',
  querySelector(sel) {
    if (sel === 'input[name="whichchoice"]') {
      return page.choice === null ? null : { value: String(page.choice) };
    }
    return null;
  },
  querySelectorAll(sel) {
    if (sel === 'input[type="submit"], button') return page.buttons;
    return [];
  },
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ id: '', style: {}, textContent: '' }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { ddLabel, ddSkipFor, currentChoiceNumber, ddButtonLabel, ' +
    'dailyDungeonSkips, DUNGEON_SKIPS }; })();');
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

// --- label flattening -----------------------------------------------------

check('label is lowercased, collapsed and stripped of a trailing stop', [
  api.ddLabel('Use your lockpicks'),
  api.ddLabel('  Use   your\nlockpicks.  '),
  api.ddLabel('Leave the way you came in.'),
  api.ddLabel(null),
  api.ddLabel(undefined),
], [
  'use your lockpicks',
  'use your lockpicks',
  'leave the way you came in',
  '',
  '',
]);

// --- each free option belongs to its own room -----------------------------

const hit = (choice, label) => api.ddSkipFor(choice, label) !== null;

check('the free option of each room is recognised there', [
  hit(692, 'Use your lockpicks'),
  hit(692, 'Use your credit card to open the door'),
  hit(693, 'Use your eleven-foot pole'),
  hit(693, 'Use your candy cane sword'),
  hit(690, 'Go through the boring door'),
  hit(691, 'Go through the boring door'),
], [true, true, true, true, true, true]);

check('a free option is not recognised in another room', [
  hit(693, 'Use your lockpicks'),
  hit(692, 'Use your eleven-foot pole'),
  hit(692, 'Go through the boring door'),
  hit(693, 'Go through the boring door'),
  hit(690, 'Use your lockpicks'),
], [false, false, false, false, false]);

// --- the options that must NEVER be marked --------------------------------
//
// Everything the wiki lists on these four screens that isn't one of the five
// free ones. "Try the doorknob" and "Proceed forward cautiously" are the two
// this feature is warning you off; "Leave the way you came in." and "Proceed
// backwards cautiously" cost no turn either but drop you out of the dungeon,
// so marking them green would be a lie about what they do.

const doorOthers = [
  'Try the doorknob',
  'Use a skeleton key',
  'Bash it down',
  'Magic it open',
  'Sneak past it',
  'Leave the way you came in.',
];
check('nothing else on the door screen is marked',
  doorOthers.map((l) => hit(692, l)),
  doorOthers.map(() => false));

const trapOthers = [
  'Proceed forward cautiously',
  'Proceed backwards cautiously',
];
check('nothing else on the trap screen is marked',
  trapOthers.map((l) => hit(693, l)),
  trapOthers.map(() => false));

const chestOthers = [
  'Open the chest',
  'Ignore the chest',
  'Pry off a loose panel with your candy cane sword',
];
check('nothing else on a chest screen is marked',
  chestOthers.map((l) => hit(690, l)).concat(chestOthers.map((l) => hit(691, l))),
  chestOthers.map(() => false).concat(chestOthers.map(() => false)));

// The skeleton key also passes for no adventure, but it breaks most times, so
// it is deliberately absent from the table rather than merely unmatched here.
check('the skeleton key is not in the table at all',
  JSON.stringify(api.DUNGEON_SKIPS).toLowerCase().includes('skeleton key'),
  false);

// --- gating on whichchoice ------------------------------------------------

check('the choice number is read off the hidden input', (() => {
  page = { choice: 692, buttons: [] };
  const a = api.currentChoiceNumber(fakeDoc);
  page = { choice: null, buttons: [] };
  const b = api.currentChoiceNumber(fakeDoc);
  return [a, b];
})(), [692, null]);

check('a label comes from value on an input and text on a button', [
  api.ddButtonLabel(makeNode('input', 'Use your lockpicks')),
  api.ddButtonLabel(makeNode('button', 'Use your lockpicks')),
], ['Use your lockpicks', 'Use your lockpicks']);

// --- the pass over a real-shaped door screen ------------------------------

function doorScreen() {
  return [
    makeNode('input', 'Try the doorknob'),
    makeNode('input', 'Use a skeleton key'),
    makeNode('input', 'Use your lockpicks'),
    makeNode('input', 'Bash it down'),
    makeNode('input', 'Leave the way you came in.'),
  ];
}

const marked = (buttons) => buttons
  .filter((b) => b.dataset.tmDdSkip)
  .map((b) => b.value);
const noteCount = (buttons) => buttons
  .reduce((n, b) => n + (b.parentNode.children.length - 1), 0);

check('only the lockpicks button is outlined on the door screen', (() => {
  page = { choice: 692, buttons: doorScreen() };
  api.dailyDungeonSkips();
  const picks = page.buttons[2];
  return [marked(page.buttons), picks.style.outline, picks.style.fontWeight, noteCount(page.buttons)];
})(), [['Use your lockpicks'], '3px solid #0a0', 'bold', 1]);

check('a second pass adds no second note', (() => {
  page = { choice: 692, buttons: doorScreen() };
  api.dailyDungeonSkips();
  api.dailyDungeonSkips();
  return noteCount(page.buttons);
})(), 1);

check('a choice that is not a dungeon room is left alone', (() => {
  page = { choice: 1588, buttons: doorScreen() };
  api.dailyDungeonSkips();
  return [marked(page.buttons), noteCount(page.buttons)];
})(), [[], 0]);

check('a choice.php page with no whichchoice is left alone', (() => {
  page = { choice: null, buttons: doorScreen() };
  api.dailyDungeonSkips();
  return [marked(page.buttons), noteCount(page.buttons)];
})(), [[], 0]);

console.log(failures === 0 ? '\nAll checks passed.' : '\n' + failures + ' check(s) failed.');
process.exit(failures === 0 ? 0 : 1);
