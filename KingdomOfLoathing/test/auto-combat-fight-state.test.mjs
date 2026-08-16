// Ad-hoc test for KingdomOfLoathing/auto-combat.js's fight-state reading, its
// combat-macro lookup, and the remembered-choice rule.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the DOM-free internals by replacing the single `bootButton();`
// line with a `return { ... }` -- the same re-expose trick as the quest-helper
// tests.
//
// What's pinned here, and why:
//   - The trap this script would otherwise walk straight into: a FINISHED KoL
//     fight still carries the whole block of combat forms. Reading "there's an
//     attack form, so we're mid-fight" would make the engine post an attack
//     into a fight that's already over, every single turn. The discriminator is
//     KoL's own `window.fightover = true` (plus the "Adventure Again" anchor),
//     which is what KoLmafia keys on too. All the markup below is copied
//     verbatim from KoLmafia's fight fixtures.
//   - That there is NO `whichround` input on a modern fight page. An older
//     relay script would send one; KoL tracks the round itself now.
//   - The macro lookup, including the name normalisation -- "Auto-Attack until
//     finished" has to match however the player capitalised and hyphenated it,
//     without matching some other macro of theirs.
//   - That a remembered choice whose option isn't on offer this time falls back
//     to asking. Several Haunted Bedroom options are conditional (the mahogany
//     nightstand's "look under" needs the spectacles equipped), so this is the
//     normal case, not an edge case.
//   - The Haunted Bedroom's option numbering, where "Ignore it" is 6 on four of
//     the five nightstands and 4 on the fifth. Counting buttons down the page
//     instead of reading the option value would answer the wrong thing.
//
//   node KingdomOfLoathing/test/auto-combat-fight-state.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'auto-combat.js'), 'utf8');

// '/topmenu.php' is a pathname the script accepts; the stub DOM makes addButton
// a no-op, and we never reach it anyway because the boot line is replaced.
const fakeDoc = {
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({ style: {}, appendChild() {}, addEventListener() {} }),
  addEventListener() {},
  body: null,
};
const fakeLocation = { pathname: '/topmenu.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ac = (function () {')
  .replace('  bootButton();',
    '  return { fightOverIn, hasFightForms, fightOver, inFight, pageKind, ' +
    'normalizeName, findMacroId, fightFields, describeAction, blockerIn, ' +
    'usableRemembered, ZONES, MACRO_NAMES };');

if (!wrapped.includes('globalThis.__ac') || wrapped.includes('\n  bootButton();')) {
  console.log('FAIL | could not re-expose the internals; the anchors in ' +
              'auto-combat.js moved. Fix this test to match.');
  process.exit(1);
}

const fn = new Function('document', 'location', 'window', 'localStorage',
  wrapped + '\nreturn globalThis.__ac;');
const api = fn(fakeDoc, fakeLocation, {}, {
  getItem: () => null, setItem() {}, removeItem() {},
});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// ---------------------------------------------------------------------------
// Real markup, copied from KoLmafia's fight fixtures.
// ---------------------------------------------------------------------------

// The block of combat forms. Identical on an open fight and on a closed one --
// that is the entire point of this test. From test_fight_gremlin_good.html.
const COMBAT_FORMS =
  '<form name=attack action=fight.php method=post>' +
  '<input type=hidden name=action value="attack">' +
  '<tr><td align=center><input id=\'tack\' picurl=piratecutlass ' +
  'onclick="return killforms(this)" class=button type=submit ' +
  'value="Attack with your cursed pirate cutlass"></td></tr></form>' +
  '<form name=useitem action=fight.php method=post>' +
  '<input type=hidden name=action value="useitem">' +
  '<select name=whichitem><option picurl=tinsnips value=6774>tin snips (1)</option>' +
  '</select></form>' +
  '<form name=skill action=fight.php method=post>' +
  '<input type=hidden name=action value="skill">' +
  '<select name=whichskill><option value=\'none\'>(select a skill)</option>' +
  '<option value="15" picurl="commacha" >CLEESH (10 Mojo Points)</option>' +
  '</select></form>' +
  '<form name=runaway action=fight.php method=post>' +
  '<input type=hidden name=action value="runaway"></form>';

// An open fight: the forms, a monster, and no fightover flag.
const OPEN_FIGHT =
  '<html><body><!-- MONSTERID: 551 -->' +
  '<span id=\'monname\'>batwinged gremlin</span>' +
  COMBAT_FORMS +
  '</body></html>';

// A finished fight, from test_fight_battle_end_both_combat_bars_runaway_macro.html:
// note it still carries every combat form, AND the flag, AND the again link.
const FINISHED_FIGHT =
  '<html><body>' + COMBAT_FORMS +
  '<script>window.fightover = true;</script>' +
  '<p><a name="end"></a><p><a href="adventure.php?snarfblat=387" ' +
  'id=\'againlink\'>Adventure Again (The Thinknerd Warehouse)</a>' +
  '</body></html>';

// An ordinary result page: no fight anywhere.
const PLAIN_PAGE =
  '<html><body><center><b>You acquire an item: <b>old coin purse</b></b>' +
  '</center></body></html>';

// A standard choice page, from test_choice_boxing_daycare.html.
const CHOICE_PAGE =
  '<html><body>' +
  '<form style=\'margin: 0px 0px 0px 0px;\' name=choiceform1 action=choice.php ' +
  'method=post><input type=hidden name=pwd value=\'5babd068\'>' +
  '<input type=hidden name=whichchoice value=1336>' +
  '<input type=hidden name=option value=1>' +
  '<input class=button type=submit value="Recruit toddlers "></form>' +
  '</body></html>';

const page = (html) => ({ html, url: 'https://www.kingdomofloathing.com/fight.php' });

// ---------------------------------------------------------------------------
// Fight state
// ---------------------------------------------------------------------------

check('an open fight and a finished one both carry the combat forms', [
  api.hasFightForms(OPEN_FIGHT), api.hasFightForms(FINISHED_FIGHT),
], [true, true]);

check('...so the forms alone must never mean "still fighting"', [
  api.inFight(page(OPEN_FIGHT)), api.inFight(page(FINISHED_FIGHT)),
], [true, false]);

check('fightover is read from KoL\'s own flag', [
  api.fightOverIn(OPEN_FIGHT), api.fightOverIn(FINISHED_FIGHT),
], [false, true]);

// The "Adventure Again" anchor is the second opinion, for a page that somehow
// carries one without the other.
check('the Adventure Again anchor alone also closes the fight',
  api.fightOverIn('<a href="adventure.php?snarfblat=387" id=\'againlink\'>Again</a>'),
  true);

check('a plain page is neither in a fight nor over one', [
  api.hasFightForms(PLAIN_PAGE), api.fightOverIn(PLAIN_PAGE),
  api.inFight(page(PLAIN_PAGE)),
], [false, false, false]);

// The engine dispatches on this. A finished fight must read as 'plain' so the
// turn can be measured and the post-combat choice probed for.
check('pageKind sorts the three pages', [
  api.pageKind({ html: OPEN_FIGHT, doc: fakeDoc }),
  api.pageKind({ html: FINISHED_FIGHT, doc: fakeDoc }),
  api.pageKind({ html: PLAIN_PAGE, doc: fakeDoc }),
], ['fight', 'plain', 'plain']);

// A choice page has no combat forms, so it falls through to the whichchoice
// probe. (whichChoice() needs a real DOM, so this only pins the half we can
// reach here: a choice page must not look like a fight.)
check('a choice page does not look like a fight', [
  api.hasFightForms(CHOICE_PAGE), api.fightOverIn(CHOICE_PAGE),
], [false, false]);

// Modern KoL tracks the round server-side. Sending a stale round number is what
// an older relay script would do; there is nothing on the page to send.
check('no fixture carries a whichround input to send', [
  /whichround/i.test(OPEN_FIGHT), /whichround/i.test(FINISHED_FIGHT),
], [false, false]);

check('and the actions we post carry no round either', [
  api.fightFields({ kind: 'attack' }),
  api.fightFields({ kind: 'skill', id: 7025 }),
  api.fightFields({ kind: 'item', id: 2497 }),
  api.fightFields({ kind: 'macro', id: '198965' }),
  api.fightFields({ kind: 'runaway' }),
  api.fightFields({ kind: 'nonsense' }),
], [
  { action: 'attack' },
  { action: 'skill', whichskill: 7025 },
  { action: 'useitem', whichitem: 2497 },
  { action: 'macro', whichmacro: '198965' },
  { action: 'runaway' },
  null,
]);

// ---------------------------------------------------------------------------
// The combat macro lookup
// ---------------------------------------------------------------------------

// The fight page's own macro dropdown, from the runaway_macro fixture:
//   <select name=whichmacro>
//     <option value='0'>(select a macro)</option>
//     <option value="198965" picurl="" >cadenzattack</option>
// findMacroId walks it, so the id always comes off the page.
function macroDoc(names) {
  const options = [{ value: '0', textContent: '(select a macro)' }].concat(
    names.map((n, i) => ({ value: String(190000 + i), textContent: n })));
  return {
    querySelector: (sel) => sel.includes('whichmacro')
      ? { querySelectorAll: () => options }
      : null,
  };
}

check('the macro name matches however it was capitalised or hyphenated', [
  api.findMacroId(macroDoc(['Auto-Attack until finished'])),
  api.findMacroId(macroDoc(['auto attack until finished'])),
  api.findMacroId(macroDoc(['AutoAttackUntilFinished'])),
  api.findMacroId(macroDoc(['  Auto-Attack Until Finished  '])),
], ['190000', '190000', '190000', '190000']);

check('...and picks it out from among the player\'s other macros',
  api.findMacroId(macroDoc(['cadenzattack', 'crimbo23',
                            'Auto-Attack until finished', 'runawaay'])),
  '190002');

check('a near-miss name is not taken for it', [
  api.findMacroId(macroDoc(['auto-attack'])),
  api.findMacroId(macroDoc(['attack until finished'])),
  api.findMacroId(macroDoc(['auto-attack until finished but slower'])),
], [null, null, null]);

check('no macros saved, or no dropdown at all, means no macro', [
  api.findMacroId(macroDoc([])),
  api.findMacroId({ querySelector: () => null }),
], [null, null]);

check('the placeholder option is never chosen',
  api.findMacroId(macroDoc(['(select a macro)'])), null);

check('normalizeName collapses everything but letters and digits', [
  api.normalizeName('Auto-Attack until finished'),
  api.normalizeName('AUTO ATTACK, UNTIL FINISHED!'),
  api.normalizeName(null),
], ['autoattackuntilfinished', 'autoattackuntilfinished', '']);

// ---------------------------------------------------------------------------
// Remembered choices
// ---------------------------------------------------------------------------

// The mahogany nightstand, with and without Lord Spookyraven's spectacles: the
// "look under" option (3) simply isn't rendered when you're not wearing them.
const WITH_SPECS = [
  { value: '1', text: 'Check the top drawer' },
  { value: '2', text: 'Check the bottom drawer' },
  { value: '3', text: 'Look under the nightstand' },
  { value: '4', text: 'Use a ghost key' },
  { value: '6', text: 'Ignore it' },
];
const WITHOUT_SPECS = WITH_SPECS.filter(o => o.value !== '3');

check('a remembered option that is on offer is used',
  api.usableRemembered({ option: '3' }, WITH_SPECS), '3');

check('a remembered option the page is not offering falls back to asking',
  api.usableRemembered({ option: '3' }, WITHOUT_SPECS), null);

check('nothing remembered means ask', [
  api.usableRemembered(null, WITH_SPECS),
  api.usableRemembered({}, WITH_SPECS),
], [null, null]);

// Option values are strings on the page and may have been stored as numbers by
// an older version of the script; both must resolve.
check('a numeric stored option still matches the page\'s string value',
  api.usableRemembered({ option: 6 }, WITH_SPECS), '6');

// ---------------------------------------------------------------------------
// The Haunted Bedroom
// ---------------------------------------------------------------------------

const bedroom = api.ZONES.find(z => z.key === 'haunted-bedroom');

// 393, not 108: 108 is the pre-2014 Bedroom, a different zone that a stale
// walkthrough will happily hand you. From KoLmafia's adventures.txt.
check('the zone is the current Haunted Bedroom', [
  !!bedroom, bedroom && bedroom.url,
], [true, 'adventure.php?snarfblat=393']);

check('all five nightstand choices are annotated', [
  Object.keys(bedroom.hints).sort(),
], [['876', '877', '878', '879', '880']]);

// The reason the engine reads the option value off the hidden input instead of
// counting buttons: "Ignore it" is the 4th button on the simple nightstand and
// the 5th or 6th elsewhere, but its VALUE is 4 there and 6 on the others.
check('"Ignore it" is option 6 on four nightstands and 4 on the simple one', [
  bedroom.hints['876']['4'],
  bedroom.hints['877']['6'],
  bedroom.hints['878']['6'],
  bedroom.hints['879']['6'],
  bedroom.hints['880']['6'],
  bedroom.hints['876']['6'],
], ['ignore it', 'ignore it', 'ignore it', 'ignore it', 'ignore it', undefined]);

// The flat-200 ghost key option sits at a different number on every one of
// them, which is exactly why these are annotations rather than a rule.
check('the ghost key option number differs per nightstand', [
  Object.keys(bedroom.hints['876']).find(k => /ghost key/.test(bedroom.hints['876'][k])),
  Object.keys(bedroom.hints['877']).find(k => /ghost key/.test(bedroom.hints['877'][k])),
  Object.keys(bedroom.hints['878']).find(k => /ghost key/.test(bedroom.hints['878'][k])),
  Object.keys(bedroom.hints['879']).find(k => /ghost key/.test(bedroom.hints['879'][k])),
  Object.keys(bedroom.hints['880']).find(k => /ghost key/.test(bedroom.hints['880'][k])),
], ['3', '4', '5', '4', '3']);

// The one option in the zone that spends a turn. The hint has to say so, or the
// run's turn count will look wrong to whoever picked it.
check('the jilted mistress option is flagged as costing a turn',
  /COSTS A TURN/.test(bedroom.hints['879']['3']), true);

// ---------------------------------------------------------------------------
// Blockers
// ---------------------------------------------------------------------------

check('the run-ending messages are recognised', [
  api.blockerIn('<b>You don\'t have enough Adventures left to do that.</b>'),
  api.blockerIn('You\'re too beaten up to go on an adventure.'),
  api.blockerIn('<p>You acquire an item: <b>old coin purse</b>'),
], ['out of adventures', 'beaten up', null]);

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
