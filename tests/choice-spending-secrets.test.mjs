// Ad-hoc test for FallenLondon/choice-helper.js's Spending Secrets badges and panel ('spending-secrets').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: the table's shape (37 earning options, 9 rewards, none listed twice);
// that every earning option sits inside the guide's four bands and pays 5 CtD except the one that
// pays none; the expected PLC of the two Luck options; the star rule per band and that it is a
// claim about PLC among options that also pay CtD; the "actions to go" range for a CtD level; the
// affordability of a reward in all three states (yes, no, unread); that a reward's badge ends with
// its Favours; that colour is never the only carrier; the state reader (a reading, a stale one, a
// hand-set figure, nothing); the wiring, keyed by the OPEN card; that the panel builds, filters
// and registers; and that none of our option names is quoted in another feature's table.
//
// Numbers come from ~35 option and card pages on fallenlondon.wiki, with Spending Secrets and
// Counting the Days (Guide) as the cross-check, fetched through the API on 2026-10-03.
//
//   node tests/choice-spending-secrets.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null,
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
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      node.parentNode = p;
      p.children.splice(p.children.indexOf(this) + 1, 0, node);
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
    },
    addEventListener(ev, fn) { (this.__on = this.__on || {})[ev] = fn; },
    querySelector(sel) {
      const m = /^([a-z]+)?(?:\.([\w-]+))?$/.exec(sel);
      return this.children.find((c) => (!m[1] || c.tagName === m[1].toUpperCase())
        && (!m[2] || String(c.className).split(/\s+/).includes(m[2]))) || null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CTD_OPTIONS, CTD_STORYLETS, CTD_BANDS, CTD_EVER_BEST, CTD_CLASS, CTD_BRANCH_CLASS, ctdSpec, ctdEarnText,'
    + ' ctdExpectedPlc, ctdBestAt, ctdActionsToGo, ctdActionsText, ctdAffordable, ctdStateFrom, ctdCardSpec, ctdRatings,'
    + ' renderCtdPanel, PANELS, FEATURES, factionText, normalizeName, BADGE_CLASS }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;')(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const rows = api.CTD_OPTIONS;
const earns = rows.filter((e) => e.kind === 'earn');
const rewards = rows.filter((e) => e.kind === 'reward');
const find = (name) => rows.find((e) => e.name === name);
const names = (list) => list.map((e) => e.name);
// A state with the CtD and PLC read live, so no star is stale.
const live = (ctd, plc, marks) => api.ctdStateFrom({ live: true, at: 1000, values: { 'Counting the Days': ctd, 'A Pocketful of Loose Change': plc } }, null, marks, 1000);
const text = (name, st) => api.ctdSpec(find(name), st).text;

// --- shape ------------------------------------------------------------------------------------------------------

check('46 rows: 37 earning options and 9 rewards', [rows.length, earns.length, rewards.length], [46, 37, 9]);
check('no (place, option) pair is listed twice',
  rows.map((e) => api.normalizeName(e.place) + '|' + api.normalizeName(e.name)).filter((k, i, a) => a.indexOf(k) !== i), []);
check('every row carries its place as the storylet the carousel index reads',
  rows.filter((e) => e.storylet !== e.place).map((e) => e.name), []);
check('every earning option sits inside 0 to 13',
  earns.filter((e) => e.band[0] < 0 || e.band[1] > 13 || e.band[0] > e.band[1]).map((e) => e.name), []);
check('every earning option pays 5 CtD, except the one that pays none',
  names(earns.filter((e) => e.ctd !== 5)), ['A smaller bazaar']);
check('the eleven faction cards each pay 5 CtD and 2 PLC at any level and name one faction',
  earns.filter((e) => e.plc === 2 && e.band[0] === 0 && e.band[1] === 13 && e.closest && e.closest.length === 1).length, 11);
check('every reward but the gamble and the Numismatrix states what it buys',
  names(rewards.filter((e) => !e.gives)), []);
check('every Favours a reward pays is in its factions field, signed, and none is in a plain string',
  rewards.filter((e) => e.factions && e.factions.some((f) => !/^Favours: /.test(f[0]) || typeof f[1] !== 'number')).map((e) => e.name), []);

// --- what the pages say that the guide does not ------------------------------------------------------------------

check('Look at those coins is a Luck 50: +4 PLC on a win, nothing on a loss, so 2 expected',
  [find('Look at those coins').plc, api.ctdExpectedPlc(find('Look at those coins'))], [{ win: 4, lose: 0, odds: 50 }, 2]);
check('Ask someone else what they saw is a Luck 50: +2 or +1, so 1.5 expected',
  api.ctdExpectedPlc(find('Ask someone else what they saw')), 1.5);
check('Look at those coins is offered in two of the guide\'s bands, because the page locks it at CtD 10',
  find('Look at those coins').band, [0, 9]);
check('the six options the page locks at CtD 6 are offered under 6 only',
  ['Dicing for secrets and coins', 'Listen to them', 'Take him to the theatre', 'Read a calming book',
    'Take some honey with a friend', 'Unleash Baseborn & Fowlingpiece'].map((n) => find(n).band), Array(6).fill([0, 5]));
check('Quite a moral afternoon asks Subtle 4 as well as Scandal 2, which the guide leaves out',
  /Subtle 4/.test(find('Quite a moral afternoon. Let’s make sure it’s appreciated').needs), true);
check('Chancing a Mark: a Luck 70 that needs PLC 4, resets PLC to 0 on a win and takes 10 on a loss',
  [find('Chancing a Mark').odds, find('Chancing a Mark').plcNeed, find('Chancing a Mark').win, find('Chancing a Mark').fail],
  [70, 4, 'PLC resets to 0', 'PLC −10 CP and Proscribed Material ×40']);
check('A smaller bazaar pays PLC and no CtD; Watch from a distance pays CtD and no PLC',
  [[find('A smaller bazaar').ctd, find('A smaller bazaar').plc], [find('Watch from a distance').ctd, find('Watch from a distance').plc]],
  [[0, 2], [5, 0]]);

// --- the star ----------------------------------------------------------------------------------------------------

const starred = (level) => names(api.ctdBestAt(level));
check('under 6 the star goes to the eleven faction cards, Listen to them and Look at those coins (2 PLC each)',
  [starred(0).length, starred(0).includes('Listen to them'), starred(0).includes('Look at those coins'), starred(0).includes('Dicing for secrets and coins')],
  [13, true, true, false]);
check('at 6 to 9 it is the eleven cards and Look at those coins; Listen to them is locked',
  [starred(7).length, starred(7).includes('Look at those coins'), starred(7).includes('Listen to them')], [12, true, false]);
check('at 10 and above it is the eleven faction cards alone (Ask someone else is 1.5)',
  [starred(10).length, starred(13).length, starred(10).includes('Ask someone else what they saw')], [11, 11, false]);
check('at 14 and with no level there is no star', [starred(14), starred(null)], [[], []]);
check('the star is among options that pay CtD: A smaller bazaar (2 PLC, no CtD) never has one',
  [0, 5, 9, 13].some((l) => starred(l).includes('A smaller bazaar')), false);
check('only the options that are ever starred carry a ? when CtD is unread',
  [text('In passing', null), text('Read a calming book', null), text('Look at those coins', null)],
  ['+5 CtD · +2 PLC ?', '+5 CtD', '+5 CtD · ≈+2 PLC ?']);
check('with CtD read the star replaces the ?, and an option not starred at that level says nothing',
  [text('In passing', live(3, 0, 0)), text('Dicing for secrets and coins', live(3, 0, 0)), text('Listen to them', live(7, 0, 0))],
  ['+5 CtD · +2 PLC ★', '+5 CtD · +1 PLC', '+5 CtD · +2 PLC']);
check('a reading over a minute old marks the star with a ~',
  text('In passing', api.ctdStateFrom({ live: false, at: 0, values: { 'Counting the Days': 3 } }, null, null, 5 * 60 * 1000)),
  '+5 CtD · +2 PLC ★~');
check('an option that uses something up carries the ▼ whether or not anything is read',
  [text('Take some honey with a friend', null), text('The Itinerant Physician', null), text('Unleash Baseborn & Fowlingpiece', null)],
  ['+5 CtD ▼', '+5 CtD ▼', '+5 CtD ▼']);
check('A smaller bazaar says in words that it pays no CtD', text('A smaller bazaar', null), '+2 PLC · no CtD');

// --- how far to 14 -------------------------------------------------------------------------------------------------

check('CtD 0 is 21 actions away, exactly',
  api.ctdActionsToGo(0), { lo: 21, hi: 21 });
check('a level is a range of change points, so level 6 is 16 to 17 actions away',
  api.ctdActionsToGo(6), { lo: 16, hi: 17 });
check('level 13 is 1 to 3 actions away', api.ctdActionsToGo(13), { lo: 1, hi: 3 });
check('level 14 and above is done, and an unread level is unknown',
  [api.ctdActionsToGo(14), api.ctdActionsToGo(20), api.ctdActionsToGo(null)], [{ lo: 0, hi: 0 }, { lo: 0, hi: 0 }, null]);
check('the sentence for a range, for one figure, and for done',
  [api.ctdActionsText(6), api.ctdActionsText(0), api.ctdActionsText(14)],
  ['About 16–17 more actions to reach CtD 14.', 'About 21 more actions to reach CtD 14.', 'CtD is 14: the Secrets and Spending card is open.']);

// --- affordability --------------------------------------------------------------------------------------------------

const buy = find('Buy a Mark of Credit Page from the Numismatrix');
const chance = find('Chancing a Mark');
const home = find('Find a decent home for your Mark of Credit Page');
const violin = find('Spend a Mark of Credit on something for yourself');
check('Buy a Mark needs PLC 7: yes at 7, no at 6, unread with nothing read',
  [api.ctdAffordable(buy, live(14, 7, 0)), api.ctdAffordable(buy, live(14, 6, 0)), api.ctdAffordable(buy, null)], [true, false, null]);
check('Chancing a Mark needs PLC 4', [api.ctdAffordable(chance, live(14, 4, 0)), api.ctdAffordable(chance, live(14, 3, 0))], [true, false]);
check('a Mark home needs one Mark and the violin five; a count that was never read is unread, not zero',
  [api.ctdAffordable(home, live(14, 0, 1)), api.ctdAffordable(home, live(14, 0, 0)), api.ctdAffordable(violin, live(14, 0, 4)),
    api.ctdAffordable(violin, live(14, 0, 5)), api.ctdAffordable(home, live(14, 0, null))], [true, false, false, true, null]);
check('a reward that costs neither PLC nor Marks has no affordability to give',
  api.ctdAffordable(find('A sack of coins'), live(14, 0, 0)), null);
check('the badge says it in marks: ✓ ✗ ? as well as in colour',
  [text('Buy a Mark of Credit Page from the Numismatrix', live(14, 7, 0)), text('Buy a Mark of Credit Page from the Numismatrix', live(14, 6, 0)),
    text('Buy a Mark of Credit Page from the Numismatrix', null)],
  ['PLC 7 → Mark of Credit Page ✓', 'PLC 7 → Mark of Credit Page ✗', 'PLC 7 → Mark of Credit Page ?']);
check('a gamble shows its odds and a Mark home shows its Favours after the affordability mark',
  [text('Chancing a Mark', live(14, 5, 0)), text('Find a decent home for your Mark of Credit Page', live(14, 0, 2))],
  ['PLC 4+ → 70% Mark of Credit Page ✓',
    '1 Mark → Bottle of Morelways 1872 ×120 ✓ · Favours: Constables +1 · Favours: The Church +1 · Favours: Society +1']);
check('every reward with Favours ends its badge with them, signed',
  rewards.filter((e) => e.factions).filter((e) => !text(e.name, live(14, 7, 5)).endsWith(api.factionText(e.factions))).map((e) => e.name), []);
check('Fencing certain coins spends Favours, and says so with a minus', text('Fencing certain coins', null),
  '→ First City Coin ×20 · Favours: Criminals −3');
check('a reward you cannot afford is grey; one you can, or cannot judge, is not',
  [api.ctdSpec(buy, live(14, 6, 0)).color === api.ctdSpec(buy, live(14, 7, 0)).color,
    api.ctdSpec(buy, null).color === api.ctdSpec(buy, live(14, 7, 0)).color], [false, true]);
check('an earning option takes a different colour from a reward',
  api.ctdSpec(find('In passing'), null).color !== api.ctdSpec(buy, null).color, true);

// --- the tooltip is the whole argument --------------------------------------------------------------------------------

const tip = (name, st) => api.ctdSpec(find(name), st).title;
check('a Luck option\'s tooltip gives both outcomes, the odds and the expected figure',
  ['50% chance of +4', 'otherwise none', 'expected 2'].map((t) => tip('Look at those coins', null).includes(t)), [true, true, true]);
check('a failure that costs something says what',
  tip('Look at those coins', null).includes('Wounds +1 CP and no PLC'), true);
check('the requirement, the cost and the side effects are all in the tooltip',
  ['Needs: Nightmares 3', 'Uses up: Drop of Prisoner’s Honey ×50', 'Also: Nightmares −3 CP'].map((t) => tip('Take some honey with a friend', null).includes(t)), [true, true, true]);
check('the faction cards say which faction you must be Closest To',
  tip('In passing', null).includes('Closest To: Bohemians'), true);
check('an unread CtD is said in the tooltip, and the reading\'s age when it is old',
  [tip('In passing', null).includes('not been read'),
    tip('In passing', api.ctdStateFrom({ live: false, at: 0, values: { 'Counting the Days': 3 } }, null, null, 5 * 60 * 1000)).includes('read ')],
  [true, true]);
check('the tooltip counts the actions still to go when CtD is known',
  tip('In passing', live(6, 0, 0)).includes('About 16–17 more actions'), true);
check('every tooltip names the option and its card, and carries the legend',
  rows.filter((e) => { const t = api.ctdSpec(e, null).title; return !t.startsWith(e.name + '\n' + e.place); }).map((e) => e.name), []);
check('the Safe-Conduct is the one reward that does not say it resets CtD',
  rewards.filter((e) => !api.ctdSpec(e, null).title.includes('Resets Counting the Days to 0')).map((e) => e.name), ['Obtain an Iron Republic Safe-Conduct']);

// --- reading your numbers -------------------------------------------------------------------------------------------

const rec = (ctd, plc, liveNow, at) => ({ live: liveNow, at, values: { 'Counting the Days': ctd, 'A Pocketful of Loose Change': plc } });
check('nothing read and nothing set is no state at all', api.ctdStateFrom(null, null, null, 1000), null);
check('a live reading is a state, its sources "read"',
  (({ ctd, plc, ctdSource, plcSource, ctdStale }) => [ctd, plc, ctdSource, plcSource, ctdStale])(api.ctdStateFrom(rec(7, 3, true, 1000), null, 2, 1000)),
  [7, 3, 'read', 'read', false]);
check('a banked reading under a minute old is not stale; over a minute is',
  [api.ctdStateFrom(rec(7, 3, false, 1000), null, null, 30000).ctdStale, api.ctdStateFrom(rec(7, 3, false, 1000), null, null, 100000).ctdStale],
  [false, true]);
check('a hand-set figure is used where nothing is read, and loses to a reading',
  [api.ctdStateFrom(null, { ctd: 9, plc: 2 }, null, 1000).ctdSource, api.ctdStateFrom(rec(7, 3, true, 1000), { ctd: 9, plc: 2 }, null, 1000).ctd],
  ['manual', 7]);
check('a hand-set figure is never stale',
  api.ctdStateFrom(null, { ctd: 9, plc: 2 }, null, 1e9).ctdStale, false);
check('the signature changes with every input a badge depends on',
  new Set([api.ctdStateFrom(rec(7, 3, true, 1000), null, 2, 1000).sig, api.ctdStateFrom(rec(8, 3, true, 1000), null, 2, 1000).sig,
    api.ctdStateFrom(rec(7, 4, true, 1000), null, 2, 1000).sig, api.ctdStateFrom(rec(7, 3, true, 1000), null, 3, 1000).sig,
    api.ctdStateFrom(rec(7, 3, false, 1000), null, 2, 1000).sig, api.ctdStateFrom(null, { ctd: 7, plc: 3 }, 2, 1000).sig]).size, 6);
check('the signature does not carry the time, or every scan would redraw every badge',
  api.ctdStateFrom(rec(7, 3, true, 1000), null, 2, 1000).sig === api.ctdStateFrom(rec(7, 3, true, 5000), null, 2, 5000).sig, true);

// --- the wiring, keyed by the OPEN card ---------------------------------------------------------------------------------

const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const textOf = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function badgeText(card, option) {
  const head = makeHeading(option);
  branches = [head];
  roots = [makeHeading(card)];
  api.ctdRatings();
  const out = textOf(head, api.CTD_BRANCH_CLASS);
  roots = []; branches = [];
  return out;
}
check('an option is badged inside its own card', badgeText('The Demi-Monde: Bohemians', 'In passing'), '+5 CtD · +2 PLC ?');
check('...but not inside another card, because "In passing" is an ordinary phrase',
  [badgeText('A Visit', 'In passing'), badgeText('Poise', 'In passing'), badgeText(null, 'In passing')], [null, null, null]);
check('the rewards are badged inside Secrets and Spending only',
  [badgeText('Secrets and Spending', 'A sack of coins'), badgeText('A Visit', 'A sack of coins')], ['→ Fistful of Surface Currency ×333', null]);
check('the in-game title ends in a full stop and an apostrophe of either kind: still the same option',
  [badgeText('An Afternoon of Good Deeds?', 'Quite a moral afternoon. Let\'s make sure it\'s appreciated.'),
    badgeText('An Afternoon of Good Deeds?', 'Quite a moral afternoon. Let’s make sure it’s appreciated')],
  ['+5 CtD', '+5 CtD']);
check('the same option title on two cards is two options: Obtain a Safe-Conduct is the reward card\'s alone',
  [badgeText('Secrets and Spending', 'Obtain an Iron Republic Safe-Conduct').startsWith('3 Marks →'),
    badgeText('Chat with the Local Gossip', 'Obtain an Iron Republic Safe-Conduct')], [true, null]);
check('a storylet heading is labelled only for the reward card',
  [api.ctdCardSpec('secrets and spending').text, api.ctdCardSpec('a visit'), api.ctdCardSpec('')], ['resets CtD', null, null]);
check('the badge is redrawn when a reading arrives: the flag stores the state with the name',
  (() => {
    const head = makeHeading('In passing');
    branches = [head];
    roots = [makeHeading('The Demi-Monde: Bohemians')];
    api.ctdRatings();
    const first = head.dataset.flUxCtdBranch;
    roots = []; branches = [];
    return first;
  })(), '+In passing@the demi monde bohemians#unread');

// --- the panel ----------------------------------------------------------------------------------------------------------

const panel = api.renderCtdPanel(null);
function walk(node, out) {
  out.push(node);
  for (const child of node.children || []) walk(child, out);
  return out;
}
const nodes = walk(panel, []);
const dataRows = nodes.filter((n) => n.dataset && n.dataset.ctdSearch);
check('the panel builds: a few hundred hand-built nodes', !!panel && nodes.length > 200, true);
check('one searchable row per option, with some listed in two bands, and a heading per group',
  [dataRows.length, nodes.filter((n) => n.dataset && n.dataset.ctdGroup).length], [49, 6]);
check('the panel is registered for the launcher, once, with its icon and label',
  api.PANELS.filter((p) => p.id === 'spending-secrets').map((p) => [p.icon, p.label, typeof p.render]), [['🪙', 'Spending Secrets', 'function']]);
check('the search index reaches text the collapsed row does not show (a requirement, a side effect, a faction)',
  ['touched by fingerwork', 'proscribed material', 'the duchess'].map((t) => dataRows.some((r) => r.dataset.ctdSearch.includes(t))),
  [true, true, true]);
{
  const input = nodes.find((n) => n.tagName === 'INPUT' && n.placeholder && n.placeholder.startsWith('filter'));
  input.__on.input({ currentTarget: { value: 'mysticism' } });
  const shown = dataRows.filter((r) => !r.hidden);
  const groups = nodes.filter((n) => n.dataset && n.dataset.ctdGroup);
  check('the filter hides the rows that do not match, and a group heading whose rows have all gone',
    [shown.length, groups.filter((g) => !g.hidden).length], [1, 1]);
  input.__on.input({ currentTarget: { value: '' } });
  check('clearing the filter brings everything back', dataRows.filter((r) => r.hidden).length, 0);
}

// --- no name of ours is in another feature's table -----------------------------------------------------------------------

const START = '// === feature: Spending Secrets and Counting the Days';
const END = '// === feature registry';
const a = src.indexOf(START);
const b = src.indexOf(END);
const outside = src.slice(0, a) + src.slice(b);
const quoted = (name) => [name, name.replace(/’/g, '\'')].some((n) => outside.includes('\'' + n.replace(/'/g, '\\\'') + '\'')
  || outside.includes('"' + n + '"'));
check('none of our option names is quoted in another feature\'s table', rows.map((e) => e.name).filter(quoted), []);
// The faction cards and City Vices are other features' cards too; sharing a CARD is the point, and each
// feature badges only the options it owns.
check('the places other tables also name are the eleven faction cards and City Vices',
  api.CTD_STORYLETS.filter(quoted).length, 12);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'spending-secrets'), true);
check('the feature has its own badge class and dataset flag, unique in the file',
  [api.CTD_CLASS, api.CTD_BRANCH_CLASS].map((c) => src.split('\'' + c + '\'').length - 1), [1, 1]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
