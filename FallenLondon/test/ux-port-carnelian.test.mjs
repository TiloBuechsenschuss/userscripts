// Ad-hoc test for FallenLondon/ux-enhancers.js's Port Carnelian badges.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The arithmetic. PC_OPTIONS carries the guide's Net column AND the three
//    currency changes it is made of, so the two can be checked against each
//    other. A transcription typo in either is invisible in game until a whole
//    26-action term has been spent on it.
//  - The two rows that pay "one of the two currencies, the game's choice".
//    Reading those as +10 of EACH would make them the best rows in the table
//    by a distance, which is exactly the wrong thing for a badge to say.
//  - The Imperial Legitimacy mark. Half the table's rows are worth +5 and the
//    thing that separates them is whether the +5 is paid for out of the number
//    that ends the term at 0, so the badge has to say which.
//  - The four Time 12 endings, which gain nothing and spend a currency: they
//    must not be ranked as a net of 0 alongside A summons from the Smouldering
//    Herald, which really is one.
//  - The storylet badge picking the better of two branches, while the tooltip
//    keeps both -- the losing branch is how Legitimacy is bought back.
//  - The strict gate on the two names that are not distinctive enough to badge
//    on the table alone.
//  - And that no Port Carnelian name collides with the three card tables, so
//    nothing can be badged twice.
//
// Numbers come from Port Carnelian (Guide) on fallenlondon.wiki.
//
//   node FallenLondon/test/ux-port-carnelian.test.mjs

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
    // Unlike the other suites, this one DOES exercise `after()`: Port Carnelian
    // is the first feature to share a selector with another (`.branch__title`,
    // with the Fruits of the Zee supplication badges), so where a badge lands
    // in the run of siblings after a heading is now load-bearing.
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      const at = p.children.indexOf(this) + 1;
      node.parentNode = p;
      p.children.splice(at, 0, node);
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
    },
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  // Derived rather than stored, so `after()` above cannot leave it stale.
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

// The screen-reader greeting FL puts on every page. `area` drives what
// currentArea() reads, so the strict gate can be exercised from here. `null`
// stands for a greeting that can't be read at all.
let area = 'Port Carnelian';
// The headings a scan finds, keyed by the selector that asks for them, so the
// whole `port-carnelian` pass can be run over the markup Fallen London really
// renders rather than only its pure parts.
let stage = { storylet: [], branch: [] };
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => (sel.includes('storylet-root__heading') ? stage.storylet
    : sel.includes('branch__title') ? stage.branch : []),
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
    'return { PC_OPTIONS, PC_TIERS, PC_REWARDS, PC_TERM_ACTIONS,'
    + ' PC_LEGIT_GAIN_MARK, PC_LEGIT_SPEND_MARK, PC_COLOR_LEGIT_GAIN, PC_COLOR_LEGIT_SPEND,'
    + ' PC_COLOR_NEUTRAL, PC_INK_NEUTRAL, PC_COLOR_END, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS,'
    + ' normalizeName, lookupPcStorylet, lookupPcBranch, pcNet, bestPcOption, pcPaint, pcLegitMark,'
    + ' pcBadgeText, pcStoryletSpec, pcBranchSpec, pcHeadingSpec, pcChangeWords, pcWhen, pcRange,'
    + ' inPortCarnelian, PANELS, FEATURES, renderPortCarnelianPanel,'
    + ' attachBadge, BADGE_CLASS, PC_CLASS, PC_FLAG, PC_BRANCH_CLASS, PC_BRANCH_FLAG,'
    + ' FOTZ_BRANCH_CLASS, FOTZ_BRANCH_FLAG }; })();');
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
const row = (name, branch) => api.PC_OPTIONS.find(
  (e) => e.name === name && (branch === undefined || e.branch === branch));

// --- the table is well formed ----------------------------------------------

check('every row has a Time Passing window and the three currency figures',
  api.PC_OPTIONS.filter((e) => !e.time || e.time.length !== 2
    || typeof e.sd !== 'number' || typeof e.sh !== 'number' || typeof e.il !== 'number')
    .map((e) => e.name), []);

check('every Airs window is a real 1-100 band, or absent',
  api.PC_OPTIONS.filter((e) => e.airs
    && !(e.airs[0] >= 1 && e.airs[1] <= 100 && e.airs[0] <= e.airs[1])).map((e) => e.name), []);

check('squashing punctuation collides no two rows',
  new Set(api.PC_OPTIONS.map((e) => api.normalizeName(e.name + ' ' + (e.branch || '')))).size,
  api.PC_OPTIONS.length);

// The point of carrying `net` as well as the parts: they have to agree, and a
// typo in either one shows up here rather than 26 actions into a term.
check('the guide\'s Net column is the sum of the currency changes',
  api.PC_OPTIONS.filter((e) => e.net !== api.pcNet(e)).map((e) => [e.name, e.net, api.pcNet(e)]),
  []);

check('only the two "one of the two currencies" rows use `either`',
  api.PC_OPTIONS.filter((e) => e.either).map((e) => [e.name, e.either]),
  [['A stroll through the Blue Bazaar', 10], ['Inconvenienced', 15]]);

check('a row paying one of the two currencies is worth that once, not twice',
  [api.pcNet(row('A stroll through the Blue Bazaar')), api.pcNet(row('Inconvenienced'))],
  [10, 15]);

check('the four Time 12 rows are the endings, and none of them has a net',
  api.PC_OPTIONS.filter((e) => e.time[0] === 12).map((e) => [e.name, e.reset, api.pcNet(e)]),
  [['Honoured with a State Dinner', 'both', null],
   ['An audience with the Banded Prince', 'sd', null],
   ['An equine festival', 'sh', null],
   ['Host a State Dinner', 'both', null]]);

check('no Port Carnelian name is in any of the three card tables, so nothing is badged twice',
  api.PC_OPTIONS.map((e) => api.normalizeName(e.name)).filter((n) =>
    api.ZEE_CARDS.some((c) => api.normalizeName(c.name) === n)
    || api.SPITE_CARDS.some((c) => api.normalizeName(c.name) === n)
    || api.FOTZ_CARDS.some((c) => api.normalizeName(c.name) === n)),
  []);

check('a term is the guide\'s 26 actions', api.PC_TERM_ACTIONS, 26);

// --- the transcription -----------------------------------------------------
// Spot checks on the rows a term is actually played around.

check('the two options Airs never gates are the +4 pair, one per currency',
  api.PC_OPTIONS.filter((e) => e.time.join('-') === '1-11')
    .map((e) => [e.name, e.sd, e.sh, e.net]),
  [['Attend the Daily Assembly of Tigers', 4, 0, 4],
   ['A day in Murgatroyd’s Imperial Tea Shop', 0, 4, 4]]);

check('A tithe. Not a bribe. buys 15 Delights with 10 Legitimacy',
  (() => { const e = row('A tithe. Not a bribe.'); return [e.sd, e.il, e.net, e.airs]; })(),
  [15, -10, 5, [11, 50]]);

check('A summons from the Smouldering Herald really does net nothing',
  (() => { const e = row('A summons from the Smouldering Herald'); return [e.sd, e.il, e.net]; })(),
  [25, -25, 0]);

// Legitimacy is the resource you cannot reliably buy, so which rows hand it
// over for nothing is the table's other headline. There are three.
check('the Legitimacy-gaining options that cost nothing are the guide\'s three',
  api.PC_OPTIONS.filter((e) => e.il > 0 && !e.branch).map((e) => [e.name, e.il]),
  [['Survey the sapphire mines', 10], ['His Amused Lordship', 10],
   ['Orders from on high', 10]]);

check('the Time 11 pair swaps 30 of one currency for 38 of the other',
  api.PC_OPTIONS.filter((e) => e.time[0] === 11 && e.net === 8).map((e) => [e.sd, e.sh]),
  [[38, -30], [-30, 38]]);

check('the reward tiers step where the guide says, 105 and 176 included',
  api.PC_TIERS.map((t) => t.at),
  [1, 35, 105, 136, 165, 176, 196, 225, 245, 256, 285, 316, 345, 376, 385, 405]);

check('the tiers only ever go up',
  api.PC_TIERS.filter((t, i) => i && (t.at <= api.PC_TIERS[i - 1].at
    || t.echo <= api.PC_TIERS[i - 1].echo)).map((t) => t.at), []);

check('105 and 176 are the two the strategy alternates between',
  api.PC_TIERS.filter((t) => t.at === 105 || t.at === 176).map((t) => [t.cheap, t.dear, t.echo]),
  [[6, 2, 40], [8, 3, 57.5]]);

check('each currency cashes in through its own storylet',
  api.PC_REWARDS.map((r) => [r.currency, r.via]),
  [['Silver Horseheads', 'An equine festival'],
   ['Striped Delights', 'An audience with the Banded Prince']]);

// --- what the badge says ---------------------------------------------------

check('the badge is the net, signed',
  ['A dangerous source', 'The fortification of native vitality',
   'Attend the Daily Assembly of Tigers']
    .map((n) => api.pcBadgeText(row(n))),
  ['+10', '+12', '+4']);

// Half the table is worth +5. Which of those +5s is paid for out of the number
// that ends the term at 0 is the only thing separating them, so the badge marks
// it -- and a row that spends no Legitimacy must NOT carry the mark.
check('a row paid for out of Imperial Legitimacy is marked, and one that is not is not',
  [api.pcBadgeText(row('A tithe. Not a bribe.')),
   api.pcBadgeText(row('The aegis of aesthetics')),
   api.pcBadgeText(row('A shortage of workers'))],
  ['+5' + api.PC_LEGIT_SPEND_MARK, '+5', '+5' + api.PC_LEGIT_SPEND_MARK]);

check('and a row that BUYS Legitimacy back carries the other mark, not the same one',
  [api.pcBadgeText(row('Survey the sapphire mines')),
   api.pcBadgeText(row('Orders from on high'))],
  ['+10' + api.PC_LEGIT_GAIN_MARK, '+10' + api.PC_LEGIT_GAIN_MARK]);

check('the Fate-locked row says so on the badge itself',
  api.pcBadgeText(row('Inconvenienced')), '+15 Fate');

check('an ending is labelled rather than scored',
  api.PC_OPTIONS.filter((e) => e.reset).map((e) => api.pcBadgeText(e)),
  ['cash out', 'cash out', 'cash out', 'cash out']);

check('the losing branch reads as the loss it is, and as the Legitimacy it buys',
  api.pcBadgeText(row('Within their rights', '"Quickly, sir - in, in!"')),
  '-5' + api.PC_LEGIT_GAIN_MARK);

// --- the palette -----------------------------------------------------------
//
// Colour here says what the option does to Imperial Legitimacy and nothing
// else -- not the net, which nine rows share. THE READER IS RED-GREEN WEAK, so
// the first and largest test is not about colour at all: it is that stripping
// every colour off leaves each badge still saying which way Legitimacy went.
// Anything added here later has to keep passing that.

check('every Legitimacy row says which way it went in its TEXT, colour ignored',
  api.PC_OPTIONS.filter((e) => {
    const mark = api.pcLegitMark(e);
    const wanted = e.reset || !e.il ? '' : (e.il > 0 ? api.PC_LEGIT_GAIN_MARK : api.PC_LEGIT_SPEND_MARK);
    return mark !== wanted;
  }).map((e) => e.name),
  []);

check('and the two marks are different shapes, not one shape in two colours',
  api.PC_LEGIT_GAIN_MARK === api.PC_LEGIT_SPEND_MARK, false);

check('colour follows Legitimacy: red spends it, green buys it, light blue leaves it',
  [api.pcPaint(row('A tithe. Not a bribe.')).color,
   api.pcPaint(row('Survey the sapphire mines')).color,
   api.pcPaint(row('The aegis of aesthetics')).color,
   api.pcPaint(row('Honoured with a State Dinner')).color],
  [api.PC_COLOR_LEGIT_SPEND, api.PC_COLOR_LEGIT_GAIN, api.PC_COLOR_NEUTRAL, api.PC_COLOR_END]);

check('the net no longer moves the colour, so nine identical +5s cannot look ranked',
  (() => {
    const fives = api.PC_OPTIONS.filter((e) => api.pcNet(e) === 5 && e.il === 0);
    return [fives.length > 1, new Set(fives.map((e) => api.pcPaint(e).color)).size];
  })(),
  [true, 1]);

// The light one is the only one that cannot take makeBadge's default white.
check('only the light blue carries an ink of its own, and the dark three do not',
  api.PC_OPTIONS.map((e) => !!api.pcPaint(e).ink)
    .map((hasInk, i) => hasInk === (api.pcPaint(api.PC_OPTIONS[i]).color === api.PC_COLOR_NEUTRAL))
    .every(Boolean),
  true);

// Contrast in BOTH directions, which is the lesson DEPTH_INK taught: a light
// background with the default white on it is unreadable, and so is a dark one
// given dark ink. 4.5:1 is the WCAG AA figure for ordinary text.
const luminance = (hex) => {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

check('every badge in this table clears 4.5:1 against the ink it is actually given',
  api.PC_OPTIONS.filter((e) => {
    const paint = api.pcPaint(e);
    return contrast(paint.color, paint.ink || '#ffffff') < 4.5;
  }).map((e) => e.name),
  []);

// Not a substitute for the marks -- a hue this reader may not resolve is not
// allowed to be the message -- but the four should still not be one colour.
check('and the four are four colours, none of them repeated',
  new Set([api.PC_COLOR_LEGIT_GAIN, api.PC_COLOR_LEGIT_SPEND,
    api.PC_COLOR_NEUTRAL, api.PC_COLOR_END]).size, 4);

check('the change is spelled out with the currency named, never as a bare number',
  api.pcChangeWords(row('A sickness in the Khaganian Quarters')),
  'Striped Delights -20, Silver Horseheads +25.');

check('"one of the two" is said in words, so it cannot read as one of each',
  api.pcChangeWords(row('A stroll through the Blue Bazaar')),
  'Striped Delights OR Silver Horseheads +10 (the game picks which, not you).');

check('the window is quoted both ways round',
  [api.pcWhen(row('A tithe. Not a bribe.')), api.pcWhen(row('Orders from on high')),
   api.pcWhen(row('Attend the Daily Assembly of Tigers'))],
  ['Time Passing in Office 1–6 · Airs 11–50',
   'Time Passing in Office 11 · Airs 41–50',
   'Time Passing in Office 1–11 · any Airs']);

// --- the two-branch storylets ----------------------------------------------

check('a storylet split in two is looked up as both its rows',
  api.lookupPcStorylet('Within their rights').map((e) => e.branch),
  ['Close your door without a word', '"Quickly, sir - in, in!"']);

check('the storylet badge is the better of the two branches',
  [api.bestPcOption(api.lookupPcStorylet('Within their rights')).net,
   api.bestPcOption(api.lookupPcStorylet('A plea for pardon')).net],
  [5, 5]);

check('but the tooltip keeps both, because the losing one buys Legitimacy back',
  (() => {
    const title = api.pcStoryletSpec(api.lookupPcStorylet('A plea for pardon')).title;
    return [title.includes('"Release him immediately!"'),
      title.includes('Give the executioner the nod'),
      title.includes('Imperial Legitimacy +5')];
  })(), [true, true, true]);

check('a branch is badged in its own right when the storylet is open',
  [api.pcBranchSpec(api.lookupPcBranch('Give the executioner the nod')).text,
   api.pcBranchSpec(api.lookupPcBranch('Close your door without a word')).text],
  ['-5' + api.PC_LEGIT_GAIN_MARK, '+5' + api.PC_LEGIT_SPEND_MARK]);

check('every branch name resolves, and to its own row',
  api.PC_OPTIONS.filter((e) => e.branch)
    .filter((e) => api.lookupPcBranch(e.branch) !== e).map((e) => e.branch), []);

check('every tooltip carries the rule that actually ends a term',
  api.PC_OPTIONS.filter((e) => !(e.branch ? api.pcBranchSpec(e) : api.pcStoryletSpec([e]))
    .title.includes('Imperial Legitimacy reaching 0')).map((e) => e.name), []);

// --- looking a name up -----------------------------------------------------

check('a name Fallen London may have prefixed with the activity still resolves',
  [!!api.lookupPcStorylet('Port Carnelian: Survey the sapphire mines'),
   !!api.lookupPcStorylet('Survey the sapphire mines'),
   api.lookupPcStorylet('Surveying the sapphire mines')],
  [true, true, null]);

check('punctuation is squashed the same way it is everywhere else here',
  !!api.lookupPcStorylet('A tithe   Not a bribe'), true);

// --- the area gate ---------------------------------------------------------

check('the greeting confirms Port Carnelian', (area = 'Port Carnelian', api.inPortCarnelian()), true);

check('and never mistakes anywhere else for it',
  (area = 'Wolfstack Docks', api.inPortCarnelian()), false);

check('an unreadable greeting is not taken for a confirmation',
  (area = null, api.inPortCarnelian()), false);

// The two names that wait for that confirmation. His Amused Lordship is filed
// on the wiki as "His Amused Lordship - 2", which is proof something else owns
// the plain name; Inconvenienced is one ordinary English word.
check('exactly two rows are strict, and they are those two',
  api.PC_OPTIONS.filter((e) => e.strict).map((e) => e.name),
  ['Inconvenienced', 'His Amused Lordship']);

check('the greeting in Port Carnelian names the seat, and that confirms it too',
  (area = 'Heartscross House', api.inPortCarnelian()), true);

// --- what the game actually renders ----------------------------------------
//
// Captured in-game 2026-09-10, and the reason this feature drew nothing at all
// on its first outing: Port Carnelian has ONE storylet, "Matters of State"
// (wiki ID 194331, location Heartscross House), and every row of the guide's
// table is an OPTION inside it. So the names the guide calls storylets arrive
// on `.branch__title`, not on a storylet heading, and the guide's own branch
// names only appear once one of the two split storylets is opened. Looking a
// name up against one selector or the other therefore misses whichever half of
// the table is on screen. `pcHeadingSpec` tries both, on both selectors.

check('a guide storylet arriving as an option of Matters of State is still badged',
  (() => {
    const spec = api.pcHeadingSpec('Attend the Daily Assembly of Tigers', false);
    return spec && spec.text;
  })(),
  '+4');

check('a split storylet opened as a storylet of its own still badges the better net',
  (() => {
    const spec = api.pcHeadingSpec('Within their rights', false);
    return [spec && spec.text, !!spec && spec.title.indexOf('Both branches:') !== -1];
  })(),
  ['+5' + api.PC_LEGIT_SPEND_MARK, true]);

check('and its options, once it is open, still badge one line each',
  (() => {
    const spec = api.pcHeadingSpec('Close your door without a word', false);
    return [spec && spec.text, !!spec && spec.title.indexOf('Both branches:') === -1];
  })(),
  ['+5' + api.PC_LEGIT_SPEND_MARK, true]);

check('the container storylet itself says nothing, having no line of its own',
  api.pcHeadingSpec('Matters of State', true), null);

check('a strict name still waits for the greeting, whichever selector it arrives on',
  [api.pcHeadingSpec('Inconvenienced', false),
   (api.pcHeadingSpec('Inconvenienced', true) || {}).text],
  [null, '+15 Fate']);

check('and an option nobody has priced is left alone rather than guessed at',
  api.pcHeadingSpec('Make for your ship while the citizenry sleeps', true), null);

// --- registration ----------------------------------------------------------

// --- two features on one heading -------------------------------------------
//
// `.branch__title` is now walked by BOTH `fotz-supplication` and
// `port-carnelian`. Each `host.after()` inserts immediately after the host, so
// the badge drawn second sits NEARER the heading than the one drawn first --
// which means a feature clearing its own badge cannot look only at
// `nextElementSibling`. It has to walk the run. This is the test for that: it
// is the failure mode that leaves two badges on a heading React has reused.

function branchHeading(name) {
  const parent = makeEl('div');
  const head = makeEl('h2');
  head.className = 'media__heading branch__title';
  head.textContent = name;
  // headingName() reads the child TEXT NODES rather than textContent, so that
  // the "W" anchor wiki-links.js appends is left out of the name. A stub
  // heading has to carry one or it reads as nameless.
  head.appendChild(fakeDoc.createTextNode(name));
  parent.appendChild(head);
  return head;
}

const badgesAfter = (head) => {
  const out = [];
  for (let n = head.nextElementSibling;
    n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) out.push(n.className);
  return out;
};

check('two features can badge one heading, and the second one sits nearest it',
  (() => {
    const head = branchHeading('Give the executioner the nod');
    api.attachBadge(head, {
      cls: api.FOTZ_BRANCH_CLASS, flag: api.FOTZ_BRANCH_FLAG, value: 'a',
      spec: { text: 'F', color: '#000', title: 'fotz' }, place: 'after',
    });
    api.attachBadge(head, {
      cls: api.PC_BRANCH_CLASS, flag: api.PC_BRANCH_FLAG, value: 'a',
      spec: api.pcBranchSpec(api.lookupPcBranch('Give the executioner the nod')), place: 'after',
    });
    return badgesAfter(head).map((c) => c.split(' ')[1]);
  })(),
  [api.PC_BRANCH_CLASS, api.FOTZ_BRANCH_CLASS]);

check('and the far one still clears its own badge rather than adding a second',
  (() => {
    const head = branchHeading('Give the executioner the nod');
    const fotz = (value) => api.attachBadge(head, {
      cls: api.FOTZ_BRANCH_CLASS, flag: api.FOTZ_BRANCH_FLAG, value: value,
      spec: { text: 'F', color: '#000', title: 'fotz' }, place: 'after',
    });
    fotz('a');
    api.attachBadge(head, {
      cls: api.PC_BRANCH_CLASS, flag: api.PC_BRANCH_FLAG, value: 'a',
      spec: api.pcBranchSpec(api.lookupPcBranch('Give the executioner the nod')), place: 'after',
    });
    // React hands the heading a different branch: the fotz badge redraws, and
    // there must still be exactly one of it.
    fotz('b');
    const classes = badgesAfter(head).map((c) => c.split(' ')[1]);
    return [classes.length, classes.filter((c) => c === api.FOTZ_BRANCH_CLASS).length];
  })(),
  [2, 1]);

check('clearing takes only the feature\'s own badge, and leaves the other alone',
  (() => {
    const head = branchHeading('Give the executioner the nod');
    api.attachBadge(head, {
      cls: api.FOTZ_BRANCH_CLASS, flag: api.FOTZ_BRANCH_FLAG, value: 'a',
      spec: { text: 'F', color: '#000', title: 'fotz' }, place: 'after',
    });
    api.attachBadge(head, {
      cls: api.PC_BRANCH_CLASS, flag: api.PC_BRANCH_FLAG, value: 'a',
      spec: api.pcBranchSpec(api.lookupPcBranch('Give the executioner the nod')), place: 'after',
    });
    // Walking out of Port Carnelian: our badge goes, the other one stays.
    api.attachBadge(head, {
      cls: api.PC_BRANCH_CLASS, flag: api.PC_BRANCH_FLAG, value: 'a',
      spec: null, place: 'after',
    });
    return badgesAfter(head).map((c) => c.split(' ')[1]);
  })(),
  [api.FOTZ_BRANCH_CLASS]);

// A smoke test, but the panel is a few hundred nodes built by hand and this is
// the only thing standing between a typo in it and an exception thrown into
// FL's own render loop.
check('the panel renders, with a row and a badge for every option in the table',
  (() => {
    const root = api.renderPortCarnelianPanel();
    let rows = 0, badges = 0;
    (function walk(el) {
      if (!el || !el.children) return;
      if (el.dataset && el.dataset.pcSearch) rows++;
      if (String(el.className).split(/\s+/).includes('fl-ux-pc')) badges++;
      for (const child of el.children) walk(child);
    })(root);
    return [rows, badges];
  })(),
  [api.PC_OPTIONS.length, api.PC_OPTIONS.length]);

// --- the whole pass, over the markup a real term renders --------------------
//
// Transcribed from a capture of Matters of State taken in-game 2026-09-10: the
// root heading is the storylet, and every option the guide calls a storylet is
// a `.branch__title` beneath it. This is the shape the feature originally drew
// nothing on, so it is worth running the registered pass over rather than only
// the lookup underneath it.

const pcRun = api.FEATURES.find((f) => f.name === 'port-carnelian').run;

const badgeTexts = (heads) => heads.map((h) => {
  const badge = h.nextElementSibling;
  return badge && badge.classList.contains(api.BADGE_CLASS) ? badge.textContent : null;
});

check('a real Matters of State screen comes out badged option by option',
  (() => {
    area = 'Heartscross House';
    const root = makeEl('h1');
    root.className = 'media__heading storylet-root__heading';
    root.textContent = 'Matters of State';
    root.appendChild(fakeDoc.createTextNode('Matters of State'));
    makeEl('div').appendChild(root);
    const branches = ['Attend the Daily Assembly of Tigers',
      'A day in Murgatroyd' + String.fromCharCode(8217) + 's Imperial Tea Shop',
      'A tithe. Not a bribe.',
      'A sickness in the Khaganian Quarters',
      'Make for your ship while the citizenry sleeps',
      'Accept a visitor'].map(branchHeading);
    stage = { storylet: [root], branch: branches };
    pcRun();
    return [badgeTexts([root])[0], badgeTexts(branches)];
  })(),
  [null, ['+4', '+4', '+5' + api.PC_LEGIT_SPEND_MARK, '+5', null, null]]);

check('and walking out of Port Carnelian is not what clears them, the table is',
  (() => {
    const head = branchHeading('Survey the sapphire mines');
    stage = { storylet: [], branch: [head] };
    area = null;
    pcRun();
    return badgeTexts([head])[0];
  })(),
  '+10' + api.PC_LEGIT_GAIN_MARK);

check('a strict row redraws once the greeting arrives, rather than staying dark',
  (() => {
    const head = branchHeading('Inconvenienced');
    stage = { storylet: [], branch: [head] };
    area = 'Wolfstack Docks';
    pcRun();
    const before = badgeTexts([head])[0];
    area = 'Heartscross House';
    pcRun();
    return [before, badgeTexts([head])[0]];
  })(),
  [null, '+15 Fate']);

check('the feature and the panel are both registered',
  [api.FEATURES.some((f) => f.name === 'port-carnelian'),
   api.PANELS.some((p) => p.id === 'port-carnelian' && p.render === api.renderPortCarnelianPanel)],
  [true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
