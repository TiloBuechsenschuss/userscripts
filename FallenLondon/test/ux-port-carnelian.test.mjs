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
    'return { PC_OPTIONS, PC_TIERS, PC_REWARDS, PC_TERM_ACTIONS, PC_LEGIT_MARK,'
    + ' PC_COLOR_LOSS, PC_COLOR_EVEN, PC_COLOR_END, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS,'
    + ' normalizeName, lookupPcStorylet, lookupPcBranch, pcNet, bestPcOption, pcColor,'
    + ' pcBadgeText, pcStoryletSpec, pcBranchSpec, pcChangeWords, pcWhen, pcRange,'
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
  ['Survey the sapphire mines', 'A dangerous source', 'The fortification of native vitality']
    .map((n) => api.pcBadgeText(row(n))),
  ['+10', '+10', '+12']);

// Half the table is worth +5. Which of those +5s is paid for out of the number
// that ends the term at 0 is the only thing separating them, so the badge marks
// it -- and a row that spends no Legitimacy must NOT carry the mark.
check('a row paid for out of Imperial Legitimacy is marked, and one that is not is not',
  [api.pcBadgeText(row('A tithe. Not a bribe.')),
   api.pcBadgeText(row('The aegis of aesthetics')),
   api.pcBadgeText(row('A shortage of workers'))],
  ['+5' + api.PC_LEGIT_MARK, '+5', '+5' + api.PC_LEGIT_MARK]);

check('the Fate-locked row says so on the badge itself',
  api.pcBadgeText(row('Inconvenienced')), '+15 Fate');

check('an ending is labelled rather than scored',
  api.PC_OPTIONS.filter((e) => e.reset).map((e) => api.pcBadgeText(e)),
  ['cash out', 'cash out', 'cash out', 'cash out']);

check('the losing branch reads as the loss it is, and carries no Legitimacy mark',
  api.pcBadgeText(row('Within their rights', '"Quickly, sir - in, in!"')), '-5');

// The rule the Fruits of the Zee palette had to learn: "adjacent steps differ"
// passes happily while two of the figures actually PAID share a colour. So the
// check is over the nets this table really hands out, not over a made-up ramp.
check('no two nets this table pays share a colour',
  (() => {
    const nets = [...new Set(api.PC_OPTIONS.map(api.pcNet).filter((n) => typeof n === 'number'))]
      .sort((a, b) => a - b);
    const colors = nets.map((n) => api.pcColor(n));
    return [nets.length, new Set(colors).size];
  })(),
  (() => {
    const n = new Set(api.PC_OPTIONS.map(api.pcNet).filter((x) => typeof x === 'number')).size;
    return [n, n];
  })());

check('a loss, a break-even and an ending each get a colour of their own',
  [api.pcColor(-5), api.pcColor(0), api.pcColor(null)],
  [api.PC_COLOR_LOSS, api.PC_COLOR_EVEN, api.PC_COLOR_END]);

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
  ['-5', '+5' + api.PC_LEGIT_MARK]);

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

check('the feature and the panel are both registered',
  [api.FEATURES.some((f) => f.name === 'port-carnelian'),
   api.PANELS.some((p) => p.id === 'port-carnelian' && p.render === api.renderPortCarnelianPanel)],
  [true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
