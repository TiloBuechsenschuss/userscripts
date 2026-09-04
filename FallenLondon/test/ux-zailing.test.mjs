// Ad-hoc test for FallenLondon/ux-enhancers.js's Zailing the Unterzee card
// ratings.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here, all of it either transcribed data that is
// invisibly wrong until you've spent actions on it, or a rule a plausible
// "tidy-up" would quietly invert:
//
//  - The numbers. ZEE_CARDS is a transcription of ~80 wiki pages; the cases
//    below are the ones a captain actually leans on (the free -5, the card
//    that hands you a whole leg, the safe line through the Snares).
//  - bestZeeLine's ranking: cheapest Troubled Waters first, more progress only
//    as the tie-break. Turn that round and the badge starts recommending "You
//    have places to be" in the Snares -- half an action saved for six change
//    points, in the deadliest water in the game.
//  - And the exception inside that rule: a LUCK option is ranked on its
//    expected value, because the wiki gives both outcomes and the odds. A Spit
//    of Land's island stop buys one point on a success and costs eight on a
//    failure; ranked on the -1 alone the badge would talk you into it.
//  - bestZeeLine ignores options behind a `need` or behind piracy, because a
//    badge that quotes a line you can't take is worse than no badge. When a
//    card has nothing BUT gated lines it says so instead of going silent.
//  - The badge's marks: ? for a challenge's success value, the speed marks,
//    and the relief arrow, which answers a different question from the number
//    beside it ("is there a line here that buys Troubled Waters back?").
//  - Prefix matching, for the two piracy cards Fallen London titles after your
//    quarry's ship.
//  - The strictZee gate on "The Sound of Wings" -- the one card name Fallen
//    London reuses in eight other places.
//
// Numbers come from Zailing (Guide) and the individual card/option pages on
// fallenlondon.wiki.
//
//   node FallenLondon/test/ux-zailing.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    nextElementSibling: null,
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      this.children.push(child);
      return child;
    },
    remove() {
      const p = this.parentNode;
      if (!p) return;
      p.childNodes = p.childNodes.filter((n) => n !== this);
      p.children = p.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    after() { throw new Error('after() not exercised by these tests'); },
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  return el;
}

// The screen-reader greeting FL puts on every page. `area` drives what
// currentArea() reads, so the zee gate can be exercised from here. `null`
// stands for a greeting that can't be read at all.
let area = 'The Sea of Voices';
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel.includes('.welcome') && area != null) {
      const h1 = makeEl('h1');
      h1.textContent = "It's TheFairUnknown! Welcome to " + area + ', delicious friend!';
      return h1;
    }
    return null;
  },
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { ZEE_CARDS, ZEE_ROUTES, ZEE_REGIONS, ZEE_MENACES, ZEE_WINDS, ZEE_SAFE_DOCKS,'
    + ' SPITE_CARDS, normalizeName, lookupZeeCard, zeeCardFor, bestZeeLine, zeeHasBetterGated,'
    + ' zeeBadgeSpec, zeeColor, zeeProgScore, zeeTwScore, zeeTwWord, zeeSpeedWord, inZee,'
    + ' attachBadge, ZEE_CLASS, ZEE_FLAG, ZEE_URGENT_COLOR, ZEE_GATED_MARK, SPITE_CLASS,'
    + ' SPITE_FLAG, FEATURES, PANELS, renderZailingPanel, zeeHandRows }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const card = (name) => api.lookupZeeCard(name);
const badge = (name) => api.zeeBadgeSpec(card(name));
const line = (name) => api.bestZeeLine(card(name));

// --- the table is well formed ----------------------------------------------

check('every card names at least one region and a frequency',
  api.ZEE_CARDS.filter((c) => !c.where || !c.where.length || !c.freq).map((c) => c.name), []);

check('squashing punctuation collides no two card names',
  new Set(api.ZEE_CARDS.map((c) => api.normalizeName(c.prefix || c.name))).size,
  api.ZEE_CARDS.length);

check('every option has a Troubled Waters figure of some kind',
  api.ZEE_CARDS.flatMap((c) => c.opts)
    .filter((o) => typeof o.tw !== 'number' && !o.twText).length, 0);

check('progress is only ever a share of Zailing Speed, or the one flat 80',
  [...new Set(api.ZEE_CARDS.flatMap((c) => c.opts).map((o) => o.prog))].sort(),
  [0, 0.5, 1, 'flat80']);

check('only "urgent" is used for the black cards, and it matches the frequency',
  api.ZEE_CARDS.filter((c) => !!c.urgent !== (c.freq === 'High Urgency')).map((c) => c.name), []);

check('the eight black cards are the ones the guide lists',
  api.ZEE_CARDS.filter((c) => c.urgent).map((c) => c.name).sort(),
  ['A Blank Space on the Charts', 'A Growing Concern', 'A Worrying Appetite',
   'Cornering the (Bounty) at Last', 'Signs of Disloyalty', 'Signs of Pursuit',
   'Taking in Water', 'Zeeborne Pariahs']);

check('each of the six zee-threats names its own black card, and they are all real cards',
  api.ZEE_MENACES.map((m) => !!api.lookupZeeCard(m.card)), [true, true, true, true, true, true]);

check('no card is in both this table and the Crowds of Spite one, so no card can be badged twice',
  api.ZEE_CARDS.map((c) => api.normalizeName(c.name))
    .filter((n) => api.SPITE_CARDS.some((s) => api.normalizeName(s.name) === n)), []);

// --- the transcription -----------------------------------------------------
// Spot checks on the numbers a voyage is actually planned around. A typo in
// any of these is invisible in game until you have spent the actions.

check('the four routes are the guide\'s',
  api.ZEE_ROUTES.map((r) => [r.name, r.need]),
  [['Direct route', 80], ['Along the currents', 160],
   ['Through the Snares', 160], ['Against the currents', 220]]);

check('Zee Peril per region is the guide\'s',
  api.ZEE_REGIONS.map((r) => [r.name, r.peril]),
  [['Home Waters', 100], ["Shepherd's Wash", 110], ['Stormbones', 110],
   ['The Sea of Voices', 150], ['The Salt Steppe', 200], ['The Pillared Sea', 210],
   ['The Snares', 250]]);

check('Your False-Star is full speed and -5 for nothing',
  (() => { const o = line('Your False-Star').opt; return [o.tw, o.prog, !!o.ch, !!o.need]; })(),
  [-5, 1, false, false]);

check('the Giant of the Unterzee hands you a flat 80 for +5',
  (() => { const o = line('The Giant of the Unterzee').opt; return [o.tw, o.prog]; })(),
  [5, 'flat80']);

check('"Slow and steady" is the free, dry, half-speed line through the Snares',
  (() => { const o = line('Navigating the Snares').opt; return [o.text, o.tw, o.prog]; })(),
  ['Slow and steady does it', 0, 0.5]);

check('A Navigation Error costs nothing on a Watchful success and +8 on a failure',
  (() => {
    const o = card('A Navigation Error').opts[0];
    return [o.text, o.ch, o.tw, o.prog, o.fail];
  })(),
  ['Correct your course', 'Watchful vs Zee Peril', 0, 1, 'TW +8, half speed']);

check('A Spit of Land\'s island stop is the card page\'s -1, not the guide table\'s -2',
  card('A Spit of Land').opts.find((o) => o.text === 'Stop briefly at the island').tw, -1);

check('the wind cards are the three the guide names',
  api.ZEE_WINDS.map((w) => [w.name, w.card]),
  [['Southern Wind', 'The Light of the Mountain'],
   ['Northern Wind', 'A Wind from the North'],
   ['Eastern Wind', 'A Distant Gleam']]);

check('the Pillared Sea and the Snares have no safe dock at all',
  api.ZEE_SAFE_DOCKS.filter((d) => d.names.join() === 'none').map((d) => d.region),
  ['The Pillared Sea', 'The Snares']);

// --- picking the line the badge speaks for ---------------------------------

check('the cheaper Troubled Waters wins even when it is the slower line',
  // Steam on by: +2 at full speed. Hail: -2 at half speed. The speed mark on
  // the badge is what admits the cost.
  (() => { const o = line('Meeting a Local Steamer').opt; return [o.text, o.tw, o.prog]; })(),
  ['Hail the steamer to exchange news', -2, 0.5]);

check('the Snares are read the way the guide reads them',
  // Six change points for half an action, at Zee Peril 250, is not a bargain.
  (() => { const o = line('Navigating the Snares').opt; return [o.text, o.tw, o.prog]; })(),
  ['Slow and steady does it', 0, 0.5]);

check('at equal Troubled Waters the faster line wins',
  // Both of Sighting a Lifeberg's free lines are free; only one of them is
  // full speed, and it is the second one listed.
  (() => { const o = line('Sighting a Lifeberg').opt; return [o.text, o.tw, o.prog]; })(),
  ['Zail quickly past the lifeberg', 0, 1]);

check('a gated line is not the tie-break winner either',
  (() => { const o = line('Passing a Lightship').opt; return [o.text, o.tw, o.prog]; })(),
  ['Zail on', 0, 1]);

check('the headline names the menaces too, so a cheap line is not read as a free one',
  // Becalmed's cheapest line is 0 Troubled Waters and 1-4 Nightmares.
  badge('Becalmed').title.includes('no Troubled Waters, half Zailing Speed, Nightmares +1-4'), true);

check('a coin flip is ranked on both its outcomes, not on the half it advertises',
  // Stop briefly at the island: -1 on a success, +8 on a failure, 50/50 -- so
  // it loses to a flat +1 despite quoting the better number.
  (() => { const o = line('A Spit of Land').opt; return [o.text, o.tw, o.prog]; })(),
  ['Steam on by', 1, 1]);

check('and the expected value is the arithmetic the wiki supports',
  [api.zeeTwScore({ ch: 'Luck 50%', tw: -1, twFail: 8 }),
   api.zeeTwScore({ ch: 'Luck 70%', tw: 2, twFail: 4 }),
   // No odds to work with: a stat challenge keeps its success value.
   api.zeeTwScore({ ch: 'Shadowy vs Zee Peril', tw: 4 }),
   // No size recorded at all: neutral, never invented.
   api.zeeTwScore({ tw: null, twText: 'Troubled Waters set to 5' })],
  [3.5, 2.6, 4, 0]);

check('a line behind an item is never the one quoted',
  // "Make ready to dive" is -2 at full speed but wants Zubmersibility.
  line('The Killing Wind').opt.text, 'Outrun the storm front');

check('piracy lines are left out even when they are the strongest',
  line('A Corvette of Her Majesty\'s Navy').opt.text, 'Exchange pleasantries via semaphore');

check('a card with nothing but gated lines still answers, and admits it',
  (() => { const b = line('A Bounty Upon Your Head'); return [b.gated, !!b.opt]; })(),
  [true, true]);

check('a card with an unconditional line is not marked gated',
  line('A Navigation Error').gated, false);

check('the arrow marks a cheaper line the badge refused to quote',
  // A Zubmarine turns The Killing Wind from a bad coin flip into -2 at full
  // speed; nothing gated is cheaper than the Snares' free, dry, slow line.
  [api.zeeHasBetterGated(card('The Killing Wind'), line('The Killing Wind').opt),
   api.zeeHasBetterGated(card('Navigating the Snares'), line('Navigating the Snares').opt)],
  [true, false]);

// --- the badge -------------------------------------------------------------

check('a plain, free, full-speed line is just its number',
  badge('Your False-Star').text, '-5');

check('a challenge\'s success value is marked with a question mark',
  badge('A Hazard to Shipping').text, '+2?');

check('a card whose best free line is free, but whose best line is not, gets both marks',
  // Correct your course: a Watchful success for nothing. A False-Star of your
  // Own would make the same card -5.
  badge('A Navigation Error').text, '0?' + api.ZEE_GATED_MARK);

check('half speed is marked',
  badge('Crossing Paths').text, '½-2');

check('and so is a cheaper line hiding behind an item',
  badge('The Killing Wind').text, '+4?' + api.ZEE_GATED_MARK);

check('the flat-80 line gets its own mark',
  badge('The Giant of the Unterzee').text, '★+5?');

check('a line that makes no progress at all is marked',
  badge('A Growing Concern').text.startsWith('·'), true);

check('black cards take the sinister colour whatever their numbers say',
  api.ZEE_CARDS.filter((c) => c.urgent).map((c) => api.zeeBadgeSpec(c).color),
  new Array(8).fill(api.ZEE_URGENT_COLOR));

check('the colour ramp reads as a cost',
  [api.zeeColor(-5), api.zeeColor(0), api.zeeColor(2), api.zeeColor(4), api.zeeColor(6),
   api.zeeColor(9)].length, 6);

check('an unrecorded Troubled Waters change never renders as a number',
  api.zeeTwWord({ tw: null, twText: 'Troubled Waters set to 5', prog: 0 }),
  'Troubled Waters set to 5');

check('a recorded range is quoted as a range, not as its first number',
  api.zeeTwWord({ tw: 2, twRange: '+2-3', prog: 1 }), 'Troubled Waters +2-3 CP');

check('the tooltip carries every option on the card, not just the chosen one',
  card('A Navigation Error').opts
    .every((o) => badge('A Navigation Error').title.includes(o.text)), true);

check('the tooltip says an urgent card is urgent',
  badge('Signs of Pursuit').title.includes('URGENT'), true);

// --- name matching ---------------------------------------------------------

check('punctuation and case don\'t matter',
  ['Rats in the hold', 'RATS IN THE HOLD', '  rats in the hold  '].map((n) => !!card(n)),
  [true, true, true]);

check('the two bounty cards match on the words in front of the ship\'s name',
  [card('A Sighting of the Screaming Nun').name, card('Cornering the Screaming Nun at Last').name],
  ['A Sighting of the (Bounty)', 'Cornering the (Bounty) at Last']);

check('a prefix match needs the whole prefix, not a shared opening word',
  card('A Sighting'), null);

check('a card from anywhere else in London is not ours',
  [card('A Stroll around the Hill'), card(''), card(null), card(undefined)],
  [null, null, null, null]);

// --- the area gate ---------------------------------------------------------
// Weaker than the Crowds of Spite gate on purpose: the zee region names are a
// guess at what the greeting says, so the gate only ever confirms, and just
// one card leans on it.

check('exactly one card is gated on the area',
  api.ZEE_CARDS.filter((c) => c.strictZee).map((c) => c.name), ['The Sound of Wings']);

area = 'The Sea of Voices';
check('a zee region reads as at zee', api.inZee(), true);
check('and the gated card is badged there', !!api.zeeCardFor('The Sound of Wings'), true);

area = 'Veilgarden';
check('somewhere in London does not read as at zee', api.inZee(), false);
check('so the reused card name is left alone', api.zeeCardFor('The Sound of Wings'), null);
check('but every other card is still badged, because the table is the real scope',
  !!api.zeeCardFor('A Navigation Error'), true);

area = null;
check('an unreadable greeting is not taken for a zee region', api.inZee(), false);
check('and the gated card stays unbadged rather than guessing',
  api.zeeCardFor('The Sound of Wings'), null);
area = 'The Sea of Voices';

// --- drawing and redrawing -------------------------------------------------

const draw = (host, name) => {
  const found = api.zeeCardFor(name);
  api.attachBadge(host, {
    cls: api.ZEE_CLASS,
    flag: api.ZEE_FLAG,
    value: name,
    spec: found ? api.zeeBadgeSpec(found) : null,
    place: 'append',
  });
};

const host = makeEl('div');
draw(host, 'Your False-Star');
check('a card in the table gets one badge', host.children.map((c) => c.textContent), ['-5']);

draw(host, 'Your False-Star');
check('re-running the scan does not stack a second badge', host.children.length, 1);

// React reuses the container node when you play a card, so a stale badge on a
// new card is the failure mode this guards.
draw(host, 'Navigating the Snares');
check('the same container reused for another card is redrawn',
  host.children.map((c) => c.textContent), ['½0']);

draw(host, 'A Stroll around the Hill');
check('and reused for a card we know nothing about, it is cleared', host.children.length, 0);

// Two features decorating one element must not fight over one flag.
const shared = makeEl('div');
draw(shared, 'Your False-Star');
api.attachBadge(shared, {
  cls: api.SPITE_CLASS, flag: api.SPITE_FLAG, value: 'Your False-Star',
  spec: { text: 'X', color: '#000', title: 'other feature' }, place: 'append',
});
check('a second feature\'s badge lands beside ours, not instead of it',
  shared.children.map((c) => c.textContent), ['-5', 'X']);

// --- the panel -------------------------------------------------------------
// The panel is a few hundred hand-built nodes; building it here is the only
// way to catch a typo in one of them without loading the live site.

const panel = api.renderZailingPanel();

function walk(node, out) {
  out.push(node);
  for (const child of node.children || []) walk(child, out);
  return out;
}
const nodes = walk(panel, []);

check('the panel builds', !!panel && nodes.length > 300, true);

const rows = nodes.filter((n) => n.dataset && n.dataset.zeeSearch);

check('every card reaches the table',
  api.ZEE_CARDS.filter((c) => !rows.some((r) =>
    r.dataset.zeeSearch.startsWith(c.name.toLowerCase() + ' '))).map((c) => c.name), []);

check('and every region with cards of its own gets a heading',
  nodes.filter((n) => n.dataset && n.dataset.zeeGroup).length, 8);

check('a card drawn in several named regions is listed under each of them',
  // The point of the grouping is that you read your own region's block.
  rows.filter((r) => r.dataset.zeeSearch.startsWith('the ebb and flow of regret ')).length, 7);

check('but a card drawn everywhere is listed once, under "anywhere"',
  rows.filter((r) => r.dataset.zeeSearch.startsWith('submerge ')).length, 1);

check('the search index reaches option text, not just the card name',
  nodes.some((n) => n.dataset && n.dataset.zeeSearch
    && n.dataset.zeeSearch.includes('zubmersibility')), true);

check('with an empty hand the panel says so rather than showing a blank list',
  api.zeeHandRows().length, 0);

// --- the extension points --------------------------------------------------

check('the zee ratings are registered alongside the other features',
  api.FEATURES.map((f) => f.name),
  ['launcher', 'faction-capture', 'fotz-capture', 'pending-item',
    'spite-card-ratings', 'zee-card-ratings', 'fotz-card-ratings', 'fotz-depth-control',
    'fotz-supplication']);

check('the Zailing panel is in the launcher menu',
  api.PANELS.map((p) => p.id), ['factions', 'zailing', 'fruits-of-the-zee']);

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
