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
//   - The bedroom's pre-picked plan, above all its two failure directions: a
//     plan step is only taken when the option number AND the label agree, so a
//     stale wiki number falls through to asking instead of pressing the wrong
//     button -- and on the rustic nightstand the wrong button is the jilted
//     mistress, the one option in the zone that spends a turn. The ghost-key
//     steps are ordered first precisely because those options vanish from the
//     page when you aren't carrying a key, which is what makes "the key if
//     possible, otherwise the drawer" fall out of ordering alone.
//   - The last-zone entry's url reading: only 'adventure.php?snarfblat=N' is a
//     zone we may re-request in a loop, and a place.php action url is not.
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
    'usableRemembered, planSteps, planPick, snarfblatOf, readLastAdventure, ' +
    'ZONES, MACRO_NAMES };');

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
// The bedroom's pre-picked plan
//
// The option lists below are what the page offers, in the shape
// readChoiceOptions hands back. Labels are the page's own button text; the
// ghost-key options are present only in the "carrying a key" variants, because
// that is exactly how KoL renders them.
// ---------------------------------------------------------------------------

const pick = (which, options) => {
  const got = api.planPick(bedroom, which, options);
  return got && got.option;
};

const SIMPLE = [
  { value: '1', text: 'Open the top drawer' },
  { value: '2', text: 'Open the bottom drawer' },
  { value: '4', text: 'Ignore it' },
];
const SIMPLE_KEYED = SIMPLE.concat(
  [{ value: '3', text: 'Unlock the nightstand with your ghost key' }]);

const MAHOGANY = [
  { value: '1', text: 'Open the top drawer' },
  { value: '2', text: 'Open the bottom drawer' },
  { value: '6', text: 'Ignore it' },
];
const MAHOGANY_KEYED = MAHOGANY.concat(
  [{ value: '4', text: 'Unlock the nightstand with your ghost key' }]);

const ORNATE = [
  { value: '1', text: 'Open the top drawer' },
  { value: '2', text: 'Open the bottom drawer' },
  { value: '4', text: 'Take the camera' },
  { value: '6', text: 'Ignore it' },
];

const RUSTIC = [
  { value: '1', text: 'Open the top drawer' },
  { value: '2', text: 'Open the bottom drawer' },
  { value: '3', text: 'Look behind the nightstand' },
  { value: '6', text: 'Ignore it' },
];

const ELEGANT = [
  { value: '1', text: 'Open the top drawer' },
  { value: '2', text: 'Open the bottom drawer' },
  { value: '6', text: 'Ignore it' },
];
const ELEGANT_KEYED = ELEGANT.concat(
  [{ value: '3', text: 'Unlock the nightstand with your ghost key' }]);

check('the substat drawers are taken without asking', [
  pick('876', SIMPLE),        // bottom: Muscle
  pick('878', ORNATE),        // bottom: Mysticality
  pick('879', RUSTIC),        // top: Moxie
], ['2', '2', '1']);

// The whole reason the ghost-key step is listed FIRST rather than guarded by
// some inventory check: without a key the option isn't on the page, so the
// next step in the list is what happens.
check('the ghost key is taken when it is on offer, and skipped when it is not', [
  pick('877', MAHOGANY_KEYED), pick('877', MAHOGANY),
  pick('880', ELEGANT_KEYED),  pick('880', ELEGANT),
], ['4', '1', '3', '6']);

// The mahogany's bottom drawer is a mouth full of teeth and the rustic's
// "look behind" is the jilted mistress -- the one option in the zone that
// costs a turn. Neither may ever be the answer.
check('the two options that cost you something are never picked', [
  pick('877', MAHOGANY) === '2',
  pick('879', RUSTIC) === '3',
], [false, false]);

// The simple nightstand's key option is worth less than nothing to a stat run
// (a flat 200 Muscle vs. substats), so it is deliberately NOT in the plan --
// having a key must not change what happens here.
check('a key in inventory does not change the simple nightstand', [
  pick('876', SIMPLE), pick('876', SIMPLE_KEYED),
], ['2', '2']);

// Lights Out has no documented option numbers, so its step matches on the
// label alone -- and takes whatever number that label happens to carry.
check('Lights Out is left on the label alone, whatever its number', [
  pick('897', [{ value: '1', text: 'Investigate the noise' },
               { value: '2', text: 'Flee' }]),
  pick('897', [{ value: '3', text: 'Leave the room' },
               { value: '5', text: 'Open the wardrobe' }]),
], ['2', '3']);

// ...but the word alone is not the instruction. "Leave no drawer unopened"
// opens every drawer; it starts with the same word as the way out and means
// the opposite, so the step has to read further than the first word.
check('a label that only starts with "leave" is not a way out',
  pick('897', [{ value: '1', text: 'Leave no drawer unopened' }]), null);

check('...while the ordinary ways of saying it all read as one', [
  pick('897', [{ value: '1', text: 'Leave' }]),
  pick('897', [{ value: '1', text: 'Leave the room' }]),
  pick('897', [{ value: '1', text: 'Get out of there' }]),
  pick('897', [{ value: '1', text: 'Run away!' }]),
], ['1', '1', '1', '1']);

// The failure direction this design exists for. If the wiki number has drifted
// away from the page's label, no step matches and the run asks instead of
// pressing whatever is sitting at that number now.
check('a number that no longer matches its label falls through to asking', [
  pick('879', [{ value: '1', text: 'Look behind the nightstand' },
               { value: '2', text: 'Open the top drawer' }]),
  pick('877', [{ value: '4', text: 'Punch the nightstand' }]),
], [null, null]);

check('an option with no readable label is never taken',
  pick('878', [{ value: '2', text: '' }]), null);

// planSteps is what separates "this zone has nothing to say about that choice"
// from "it does, and none of it applied" -- the second one warns in the log.
check('planSteps tells a missing plan from a plan that did not match', [
  !!api.planSteps(bedroom, '879'),
  !!api.planSteps(bedroom, '1336'),
  !!api.planSteps({ name: 'somewhere else' }, '879'),
], [true, false, false]);

check('every nightstand and Lights Out are planned for',
  Object.keys(bedroom.plan).sort(),
  ['876', '877', '878', '879', '880', '897']);

// ---------------------------------------------------------------------------
// Wherever I adventured last
// ---------------------------------------------------------------------------

const lastZone = api.ZONES.find(z => z.key === 'last-zone');

check('the dynamic entry carries no url to adventure at', [
  !!lastZone, lastZone && !!lastZone.dynamic, lastZone && lastZone.url,
], [true, true, undefined]);

// api.php's lastadv block, in the shape KoLmafia's ApiRequest reads it.
check('the last adventure is read out of api.php\'s lastadv block',
  api.readLastAdventure({ raw: { lastadv: {
    id: '393', name: 'The Haunted Bedroom',
    link: 'adventure.php?snarfblat=393',
    container: 'place.php?whichplace=manor2',
  } } }),
  { url: 'adventure.php?snarfblat=393', name: 'The Haunted Bedroom' });

check('a status with no lastadv, or a junk one, reads as "I don\'t know"', [
  api.readLastAdventure({ raw: {} }),
  api.readLastAdventure({ raw: { lastadv: {} } }),
  api.readLastAdventure({}),
  api.readLastAdventure(null),
], [null, null, null, null]);

// Only a snarfblat zone may be re-requested in a loop. A place.php action url
// is a door you open once, not a zone you grind, so it reads as null and the
// run stops with a reason instead of hammering it.
check('only adventure.php?snarfblat urls count as a grindable zone', [
  api.snarfblatOf('adventure.php?snarfblat=393'),
  api.snarfblatOf('/adventure.php?snarfblat=393&pwd=abc'),
  api.snarfblatOf('adventure.php?pwd=abc&snarfblat=27'),
  api.snarfblatOf('place.php?whichplace=manor2&action=manor2_ladys'),
  api.snarfblatOf('adventure.php?snarfblat='),
  api.snarfblatOf(null),
], ['393', '393', '27', null, null, null]);

// This is how a resolved last zone finds its way back to a registered entry
// (and so to its plan and hints): by snarfblat, not by name.
check('a resolved snarfblat matches the registered bedroom entry',
  api.snarfblatOf(bedroom.url), '393');

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
