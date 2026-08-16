// Ad-hoc test for KingdomOfLoathing/quest-helper.js's Talk to Sven Golly
// overview (pandamonium.php?action=sven).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the DOM-free helpers. Same re-expose trick as the rotation,
// 8-bit and combat tests -- the script bails before the end of its IIFE, so the
// internals are handed back by replacing the dispatch line.
//
// What's pinned here, and why:
//   - the trait table. It's the whole puzzle, it never reshuffles per ascension,
//     and a wrong entry doesn't just waste a click: the item is eaten whether or
//     not it was right, and its backstage noncombat won't drop a replacement
//     while you're carrying one. So every member/item pair is checked against
//     the wiki's own answer table, in both directions.
//   - that the two SHARED items (gin-soaked blotter paper, sponge cake) are
//     never handed to both of the members who want them off a stock of one, and
//     that an exclusive item is preferred so the shared one stays free. That's
//     the only real decision the planner makes.
//   - that an unreadable dropdown yields "I couldn't tell", never a claim.
//
//   node KingdomOfLoathing/test/quest-helper-sven.test.mjs

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
    'return { PUZZLES, SVEN_ITEMS, SVEN_BAND, svenVerdict, svenTakers, svenItemsFor, ' +
    'svenPlan, svenAdvice, svenRemaining, svenStock, svenItemOfOption, svenLeftovers, ' +
    'svenOptionState };');
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

const item = (name) => api.SVEN_ITEMS.find((i) => i.name === name);
const member = (name) => api.SVEN_BAND.find((m) => m.name === name);
const names = (list) => list.map((x) => x.name);

const BEAR = item('beer-scented teddy bear');
const CHERRY = item('booze-soaked cherry');
const PILLOW = item('comfy pillow');
const MARSH = item('giant marshmallow');
const CAKE = item('sponge cake');
const PAPER = item('gin-soaked blotter paper');

// --- registration ---------------------------------------------------------

const SVEN = api.PUZZLES.find((p) => p.name === 'Talk to Sven Golly');

check('the puzzle is registered, typed, and scoped to pandamonium.php', [
  !!SVEN, SVEN.type, SVEN.auto,
  SVEN.page.test('/pandamonium.php'), SVEN.page.test('/choice.php'),
], [true, 'sven', true, true, false]);

// --- the item ids ---------------------------------------------------------

// KoLmafia's ItemPool constants; these are what the `togive` options carry, and
// they're the primary key for both reading the dropdown and filling it in.
check('every item carries the id KoL puts in the dropdown', [
  BEAR.id, CHERRY.id, PILLOW.id, MARSH.id, CAKE.id, PAPER.id,
], ['4670', '4671', '4672', '4673', '4674', '4675']);

// --- the solved band ------------------------------------------------------

check('the band is solved as the wiki solves it', api.SVEN_BAND.map(
  (m) => [m.name, m.role, m.craves, m.hates].join('/')), [
  'Bognort/guitarist/white/soft',
  'Stinkface/vocalist/boozy/sweet',
  'Flargwurm/bassist/sweet/white',
  'Jim/drummer/soft/boozy',
]);

// Each of the four traits is craved by exactly one member and hated by exactly
// one -- Sven's own clue 1 and 2. A typo that duplicated one would break this.
const count = (key) => api.SVEN_BAND.reduce((acc, m) => {
  acc[m[key]] = (acc[m[key]] || 0) + 1;
  return acc;
}, {});
check('each trait is craved by one member and hated by one', [
  count('craves'), count('hates'),
], [
  { white: 1, boozy: 1, sweet: 1, soft: 1 },
  { soft: 1, sweet: 1, white: 1, boozy: 1 },
]);

check('...and nobody hates what they crave',
  api.SVEN_BAND.filter((m) => m.craves === m.hates).length, 0);

// --- the trait table ------------------------------------------------------

// Six items, each with two of the four traits, no two alike -- the wiki's note.
check('the six items are the six distinct trait pairs',
  api.SVEN_ITEMS.map((i) => i.traits.slice().sort().join('+')).sort(), [
  'boozy+soft', 'boozy+sweet', 'boozy+white',
  'soft+sweet', 'soft+white', 'sweet+white',
]);

// The wiki's answer table, in full. Read it as: this member takes exactly these.
check('Bognort (craves white, hates soft) takes the marshmallow or the paper',
  names(api.svenItemsFor(member('Bognort'))),
  ['giant marshmallow', 'gin-soaked blotter paper']);

check('Stinkface (craves boozy, hates sweet) takes the bear or the paper',
  names(api.svenItemsFor(member('Stinkface'))),
  ['beer-scented teddy bear', 'gin-soaked blotter paper']);

check('Flargwurm (craves sweet, hates white) takes the cherry or the cake',
  names(api.svenItemsFor(member('Flargwurm'))),
  ['booze-soaked cherry', 'sponge cake']);

check('Jim (craves soft, hates boozy) takes the pillow or the cake',
  names(api.svenItemsFor(member('Jim'))),
  ['comfy pillow', 'sponge cake']);

// Same table read the other way, which is what the lookup rows show.
check('and each item names who it is for', api.SVEN_ITEMS.map(
  (i) => i.name + ' -> ' + names(api.svenTakers(i)).join('/')), [
  'beer-scented teddy bear -> Stinkface',
  'booze-soaked cherry -> Flargwurm',
  'comfy pillow -> Jim',
  'giant marshmallow -> Bognort',
  'sponge cake -> Flargwurm/Jim',
  'gin-soaked blotter paper -> Bognort/Stinkface',
]);

// The third outcome. An item carrying neither trait isn't refused for cause --
// it's shrugged at, and eaten anyway. Bognort/cherry is the wiki's example
// ("I don't, like, hate that thing, man").
check('an item with neither trait is a shrug, not a refusal', [
  api.svenVerdict(member('Bognort'), CHERRY),
  api.svenVerdict(member('Bognort'), PILLOW),
  api.svenVerdict(member('Bognort'), MARSH),
  api.svenVerdict(member('Jim'), BEAR),
  api.svenVerdict(member('Stinkface'), CAKE),
], ['shrugs', 'hates', 'takes', 'hates', 'hates']);

// Ordering is load-bearing for the planner below: the item only this member
// wants has to come first.
check('each member is offered their exclusive item before the shared one',
  api.SVEN_BAND.map((m) => api.svenTakers(api.svenItemsFor(m)[0]).length), [1, 1, 1, 1]);

// --- the plan -------------------------------------------------------------

const ALL = api.SVEN_BAND;
const stockOf = (...items) => items.reduce((acc, i) => {
  acc[i.id] = (acc[i.id] || 0) + 1;
  return acc;
}, {});
const gives = (plan) => plan.map((p) => p.member.name + ': ' + (p.give ? p.give.name : '-'));

check('with all four exclusive items, everyone gets theirs',
  gives(api.svenPlan(ALL, stockOf(MARSH, BEAR, CHERRY, PILLOW))), [
  'Bognort: giant marshmallow',
  'Stinkface: beer-scented teddy bear',
  'Flargwurm: booze-soaked cherry',
  'Jim: comfy pillow',
]);

// The trap. One paper satisfies Bognort AND Stinkface, but giving it away
// consumes it -- so it must not be planned twice.
check('one shared item is planned once, not twice',
  gives(api.svenPlan(ALL, stockOf(PAPER, CAKE))), [
  'Bognort: gin-soaked blotter paper',
  'Stinkface: -',
  'Flargwurm: sponge cake',
  'Jim: -',
]);

check('...and two of it feeds both', gives(api.svenPlan(
  [member('Bognort'), member('Stinkface')], { [PAPER.id]: 2 })), [
  'Bognort: gin-soaked blotter paper',
  'Stinkface: gin-soaked blotter paper',
]);

// Preferring the exclusive item is what keeps the shared one free for the
// member who has no other option here.
check('the exclusive item is spent first, so the shared one still reaches the other',
  gives(api.svenPlan(ALL, stockOf(MARSH, PAPER, CHERRY, CAKE))), [
  'Bognort: giant marshmallow',
  'Stinkface: gin-soaked blotter paper',
  'Flargwurm: booze-soaked cherry',
  'Jim: sponge cake',
]);

check('a member already fed is not in the plan at all',
  gives(api.svenPlan([member('Jim')], stockOf(CAKE, MARSH))), ['Jim: sponge cake']);

check('nothing on hand plans nothing', gives(api.svenPlan(ALL, {})), [
  'Bognort: -', 'Stinkface: -', 'Flargwurm: -', 'Jim: -',
]);

// --- how each option is labelled ------------------------------------------

// The lie this exists to prevent: with one blotter paper in the bag, both
// Bognort and Stinkface list it as something they'd take. Marking it available
// on both rows would say you're holding two.
const shared = api.svenPlan(ALL, stockOf(PAPER));
const stateOf = (plan, stock, who, it) => {
  const row = plan.find((p) => p.member.name === who);
  const s = api.svenOptionState(plan, stock, row, it);
  return s.by ? s.state + ':' + s.by : s.state;
};

check('the member the plan feeds gets the button, the other is told why not', [
  stateOf(shared, stockOf(PAPER), 'Bognort', PAPER),
  stateOf(shared, stockOf(PAPER), 'Stinkface', PAPER),
  stateOf(shared, stockOf(PAPER), 'Stinkface', BEAR),
], ['give', 'claimed:Bognort', 'missing']);

// A second copy is a real alternative, not a claimed one.
const spare = api.svenPlan(ALL, { [PAPER.id]: 2 });
check('a second copy shows as a spare on the other row',
  stateOf(spare, { [PAPER.id]: 2 }, 'Stinkface', PAPER), 'give');

// Only Bognort is left, so nobody else can claim the paper he isn't being given.
const solo = api.svenPlan([member('Bognort')], stockOf(MARSH, PAPER));
check('an item you hold that nobody is owed is a spare',
  stateOf(solo, stockOf(MARSH, PAPER), 'Bognort', PAPER), 'spare');

check('with no readable stock, nothing is claimed either way',
  stateOf(api.svenPlan(ALL, {}), null, 'Jim', CAKE), 'unknown');

check('the plan spends the bag exactly once',
  api.svenLeftovers(api.svenPlan(ALL, stockOf(MARSH, PAPER, CAKE)),
    stockOf(MARSH, PAPER, CAKE)),
  { 4673: 0, 4675: 0, 4674: 0 });

// --- reading the dropdowns ------------------------------------------------

const sel = (...opts) => ({ options: opts.map(([value, textContent]) => ({ value, textContent })) });

// KoL writes the member options as bare names -- `<option>Bognort</option>` --
// so in the DOM the value equals the text.
check('the member dropdown says who is left',
  names(api.svenRemaining(sel(['Stinkface', 'Stinkface'], ['Jim', 'Jim'])) || []),
  ['Stinkface', 'Jim']);

check('an unreadable member dropdown is null, not "all four"', [
  api.svenRemaining(null),
  api.svenRemaining(sel(['0', '-- select a bandmember --'])),
], [null, null]);

check('the item dropdown is the stock, and its placeholder is not an item',
  api.svenStock(sel(['0', '-- select an item --'], ['4673', 'giant marshmallow'],
    ['4675', 'gin-soaked blotter paper'])),
  { 4673: 1, 4675: 1 });

check('a quantity in the label is counted', api.svenStock(sel(['4674', 'sponge cake (3)'])),
  { 4674: 3 });

check('an item is matched by id first and by name as a fallback', [
  api.svenItemOfOption({ value: '4671', textContent: 'some renamed thing' }).name,
  api.svenItemOfOption({ value: '', textContent: 'comfy pillow' }).name,
  api.svenItemOfOption({ value: '0', textContent: '-- select an item --' }),
], ['booze-soaked cherry', 'comfy pillow', null]);

check('an unreadable item dropdown is null, not an empty bag', api.svenStock(null), null);

// --- what the bar says ----------------------------------------------------

const advice = (plan, knewRemaining, knewStock) =>
  api.svenAdvice(plan, knewRemaining, knewStock);

const full = advice(api.svenPlan(ALL, stockOf(MARSH, BEAR, CHERRY, PILLOW)), true, true);
check('carrying everything is a green light', [full.tone, full.headline], [
  'go', 'You\'re carrying something for all 4 left. Give it to them one at a time.',
]);

const some = advice(api.svenPlan(ALL, stockOf(PAPER)), true, true);
check('a partial hand says how many can be fed now', [some.tone, some.headline], [
  'go', '1 of the 4 still waiting can be fed right now.',
]);

const none = advice(api.svenPlan(ALL, {}), true, true);
check('an empty hand sends you backstage rather than to the dropdowns',
  [none.tone, none.headline], [
    'turn', '4 are still waiting, and you\'re carrying nothing any of them want.',
  ]);

const last = advice(api.svenPlan([member('Jim')], stockOf(PILLOW)), true, true);
check('the last member reads as singular', [last.tone, last.headline], [
  'go', 'You\'re carrying something for all that\'s left. Give it to them one at a time.',
]);

// The reporting contract: an unreadable dropdown must not turn into "you have
// nothing", which would send you off to spend turns you don't need to spend.
const blind = advice(api.svenPlan(ALL, {}), false, false);
check('an unreadable page admits it instead of claiming an empty bag', [
  blind.tone,
  /couldn't read the item dropdown/i.test(blind.headline),
  /carrying nothing/i.test(blind.headline),
  blind.lines.some((l) => /all four are listed/i.test(l)),
], ['turn', true, false, true]);

check('every state warns that a wrong give destroys the item',
  [full, some, none, last, blind].every(
    (a) => a.lines.some((l) => /eaten and gone/.test(l))), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
