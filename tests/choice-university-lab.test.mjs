// Ad-hoc test for FallenLondon/choice-helper.js's University Laboratory badges.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// What's worth pinning here:
//
//  - **The badge is a formula, so the arithmetic is the claim.** Rounding
//    (half to even, or up/down where a page says so), the wiki's S-curve, the
//    team formula against the pages' own worked examples, and Circulate a
//    draft of your findings.
//  - **The cross-check.** The guide's Student Table states every student
//    option's research at Equipment 7, and it disagrees with the option pages
//    in a known list of places. The table here follows the pages; the list of
//    disagreements is pinned by name so a transcription typo cannot hide in it.
//  - **The ranking rule.** Best success figure among the options you can take
//    with nothing special in hand; an option behind an item is left out and
//    marked ▾; a Luck option is its expected value; an unread input is a
//    range, never a guess.
//  - **The gate** in all three greeting states, the deck confirming the lab
//    when the greeting cannot, and options badged only inside an opened card.
//  - That no name here is in another feature's table, that FOUR features now
//    share `.branch__title` without clearing each other, and the whole panel.
//
// Numbers come from the individual card and option pages on fallenlondon.wiki
// and from University Laboratory (Guide) and its /Tables and /Calculators pages.
//
//   node tests/choice-university-lab.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

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
      if (child.nodeType === 1) this.children.push(child);
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
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

// A heading the way the game builds one, inside a parent so a badge can go
// after it: the name is a TEXT NODE, because `headingName()` walks childNodes.
function makeHeading(text, cls) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.className = cls || '';
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let area = null;
let lists = {};
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => lists[sel] || [],
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
// Auto-refresh OFF, so nothing here boots a hidden frame and a timer.
const fakeStorage = {
  getItem: (key) => (key === 'fl-ux-auto-refresh' ? '0' : null),
  setItem() {},
};

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { LAB_CARDS, LAB_GROUPS, LAB_Q, LAB_STUDENTS, LAB_STAFF, LAB_SKILLS, LAB_QUALITIES,'
    + ' LAB_TEAM_EXAMPLES, LAB_RAMP, LAB_COLOR_RANGE, LAB_COLOR_PR, LAB_COLOR_LABEL,'
    + ' LAB_CLASS, LAB_FLAG, LAB_BRANCH_CLASS, LAB_BRANCH_FLAG, LAB_PROJECTS, LAB_EQUIPMENT,'
    + ' LAB_EXPERTS, LAB_AREAS, LAB_BRIEF_CURVE, LAB_SKILL_WIN, LAB_SKILL_FAIL,'
    + ' labRound, labCurve, labDraft, labCollated, labCompute, labOutcome, labOptionValue,'
    + ' labStatus, labStateFrom, labHighest, labCardSpec, labOptionSpec, labCardFor,'
    + ' labBranchRows, labDisambiguate, labConfirmed, labFromQualities, labRatings,'
    + ' renderLabPanel, labFormulaText, itemKey,'
    + ' ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, attachBadge,'
    + ' BADGE_CLASS, PC_BRANCH_CLASS, PC_BRANCH_FLAG, FOTZ_BRANCH_CLASS, FOTZ_BRANCH_FLAG,'
    + ' VSD_BRANCH_CLASS, VSD_BRANCH_FLAG, FEATURES, PANELS }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console', 'localStorage',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console, fakeStorage);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const Q = api.LAB_Q;
const S = Object.fromEntries(api.LAB_STUDENTS.map((s) => [s.key, s.quality]));
const card = (name) => api.LAB_CARDS.find((c) => c.name === name);
const opt = (cardName, page) => card(cardName).opts.find((o) => (o.page || o.branch) === page);
const NOW = Date.now();

// A reading of Myself: every lab quality 0 unless given; `undefined` for one
// the scrape did not see (a filtered list).
function reading(values, at) {
  const all = {};
  for (const name of api.LAB_QUALITIES) all[name] = 0;
  Object.assign(all, values);
  for (const k of Object.keys(all)) if (all[k] === undefined) delete all[k];
  return { live: false, at: at == null ? NOW : at, values: all };
}
function holding(counts, at) {
  const held = new Map();
  for (const name of Object.keys(counts)) held.set(api.itemKey(name), { name, count: counts[name] });
  return { live: false, at: at == null ? NOW : at, held };
}
const state = (values, items, at, itemsAt) => api.labStateFrom(
  values === null ? null : reading(values, at), items ? holding(items, itemsAt) : null, NOW);

const UNREAD = state(null, null);
const LAB7 = (extra) => state(Object.assign({ [Q.equipment]: 7, [Q.workers]: 3 }, extra || {}), {});

// --- the table is well formed ----------------------------------------------

const groups = api.LAB_GROUPS.map((g) => g.key);
check('every card has a name, a known group, a frequency, what it needs and options',
  api.LAB_CARDS.filter((c) => !c.name || !groups.includes(c.group) || !c.freq || !c.needs
    || !Array.isArray(c.opts) || !c.opts.length).map((c) => c.name), []);

check('every group has at least one card, so no panel heading stands empty',
  groups.filter((g) => !api.LAB_CARDS.some((c) => c.group === g)), []);

check('card names are unique', new Set(api.LAB_CARDS.map((c) => api.normalizeName(c.name))).size,
  api.LAB_CARDS.length);

check('within a card, the wiki page identifies an option uniquely',
  api.LAB_CARDS.filter((c) => new Set(c.opts.map((o) => o.page || o.branch)).size !== c.opts.length)
    .map((c) => c.name), []);

const formulaKind = (f) => f == null ? 'none'
  : f.range ? 'range' : f.draft ? 'draft' : f.team != null ? 'team' : f.curve ? 'curve'
  : Object.keys(f).every((k) => ['k', 'el', 'glass', 'student', 'workers', 'ideas', 'round'].includes(k)) ? 'linear'
  : 'bad';
check('every formula is one of the five shapes labCompute knows',
  api.LAB_CARDS.flatMap((c) => c.opts.flatMap((o) => ['win', 'rare', 'alt', 'fail']
    .filter((k) => formulaKind(o[k]) === 'bad').map((k) => o.branch + ' ' + k))), []);

check('an option either pays research or has a label saying what it does instead',
  api.LAB_CARDS.flatMap((c) => c.opts.filter((o) => !o.win && !o.label).map((o) => o.branch)), []);

check('a label never sits on an option that has a rankable figure on top of it',
  api.LAB_CARDS.flatMap((c) => c.opts.filter((o) => o.label && o.win && o.win.k >= 0).map((o) => o.branch)), []);

check('every requirement names a quality the scrape reads',
  api.LAB_CARDS.flatMap((c) => c.opts.flatMap((o) => (o.req || [])
    .filter((r) => !api.LAB_QUALITIES.includes(r[0])).map((r) => o.branch + ': ' + r[0]))), []);

check('every S-curve on a skill is on one of the four advanced skills',
  api.LAB_CARDS.flatMap((c) => c.opts.flatMap((o) => ['win', 'fail'].map((k) => o[k])
    .filter((f) => f && f.curve && f.of !== 'el' && !api.LAB_SKILLS.includes(f.of)).map(() => o.branch))), []);

check('every student card names its student, and only student cards do',
  api.LAB_CARDS.filter((c) => (c.group === 'students') !== api.LAB_STUDENTS.some((s) => s.quality === c.student))
    .map((c) => c.name), []);

check('the thirteen ordinary-English card names are the strict ones',
  api.LAB_CARDS.filter((c) => c.strict).map((c) => c.name).sort(),
  ['Blank Walls', 'Directing your Team', 'Eureka!', 'One Day...', 'Running out of Steam', 'See a Doctor',
    'Student Complaints', 'Student Fury', 'Unorthodox Methods', 'Unpacking crates', 'Washing Up',
    'Work with your Equipment', 'Write Up Your Findings']);

check('no laboratory name is in any other feature\'s table, so nothing is badged twice',
  api.LAB_CARDS.flatMap((c) => [c.name].concat(c.opts.map((o) => o.branch))).map(api.normalizeName)
    .filter((n) =>
      api.ZEE_CARDS.some((x) => api.normalizeName(x.name) === n)
      || api.SPITE_CARDS.some((x) => api.normalizeName(x.name) === n)
      || api.FOTZ_CARDS.some((x) => api.normalizeName(x.name) === n)
      || api.PC_OPTIONS.some((p) => api.normalizeName(p.name) === n || (p.branch && api.normalizeName(p.branch) === n))
      || api.VSD_OPTIONS.some((v) => api.normalizeName(v.storylet) === n || api.normalizeName(v.branch) === n)),
  []);

// --- arithmetic ------------------------------------------------------------

check('rounding is half to even unless a page says up or down',
  [api.labRound(2.5), api.labRound(3.5), api.labRound(17.5), api.labRound(9.34), api.labRound(9.34, 'up'),
    api.labRound(18.67, 'down'), api.labRound(12, 'up')],
  [2, 4, 18, 9, 10, 18, 12]);

check('the brief-project S-curve at Equipment 1, 7 and 9',
  [1, 7, 9].map((x) => api.labCurve(api.LAB_BRIEF_CURVE, x)), [2, 20, 28]);

check('the Unorthodox Methods S-curves at their midpoints, and at skill 12',
  [api.labCurve(api.LAB_SKILL_WIN, 6), api.labCurve(api.LAB_SKILL_FAIL, 7), api.labCurve(api.LAB_SKILL_WIN, 12)],
  [18, 10, 30]);

check('the team formula reproduces every worked example on the option pages',
  api.LAB_TEAM_EXAMPLES.map((x) => api.labCompute({ team: x.team, k: 2 }, x) === x.research), [true, true, true, true]);

check('Circulate a draft: a share of 100, plus the Unexpected Results, capped at the whole project',
  [api.labDraft(500, 1000, 0), api.labDraft(900, 1000, 4), api.labDraft(2000, 1000, 0),
    api.labDraft(null, 1000, 3), api.labDraft(500, 0, 3)],
  [50, 125, 100, null, null]);

check('leftovers into Volumes of Collated Research, rounded down',
  api.labCollated({ epiphany: 1, idea: 1, connection: 2, result: 3 }), 2);

check('a missing input is null, never a zero',
  [api.labCompute({ k: 5, glass: 1 }, {}), api.labCompute({ ideas: 20 }, { ideas: null }),
    api.labCompute({ team: 0.2, k: 2 }, { el: 7, workers: 3, high: null })],
  [null, null, null]);

check('formulas read out the way the pages write them',
  [api.labFormulaText({ k: -8, el: 4 }), api.labFormulaText({ student: 2, workers: 2 }),
    api.labFormulaText({ k: 3, el: 5 / 3, round: 'up' }), api.labFormulaText({ k: 5, glass: 1 }),
    api.labFormulaText({ k: 1 })],
  ['4 × Equipment − 8', '2 × student level + 2 × Workers', '3 + 5/3 × Equipment, rounded up',
    '5 + Glass Studies', '1']);

check('highest worker level: 5 with anyone who is not a student, else the best student',
  [api.labHighest(LAB7({ [S.profound]: 5 }).q),
    api.labHighest(state({ [Q.equipment]: 7, [Q.workers]: 1, [S.shifty]: 3 }).q),
    api.labHighest(state({ [Q.equipment]: 7, [Q.workers]: undefined }).q)],
  [5, 3, null]);

// --- the cross-check against the guide -------------------------------------

const at7 = (o, c, key) => api.labCompute(o[key], { el: 7 }) ;
const guideRows = api.LAB_CARDS.flatMap((c) => c.opts.filter((o) => o.guide7).map((o) => ({ c, o })));

check('every student tier option carries the guide\'s Equipment 7 figures',
  api.LAB_CARDS.filter((c) => c.group === 'students').map((c) =>
    c.opts.filter((o) => o.req && o.req[0][0] === c.student && o.req[0][2] != null && !o.gate
      && !/tutor|devices/.test(o.branch)).every((o) => o.guide7)), [true, true, true, true, true]);

check('the page agrees with the guide wherever guideOff does not say otherwise',
  guideRows.flatMap(({ o, c }) => ['win', 'fail']
    .filter((k) => !(o.guideOff || []).includes(k) && at7(o, c, k) !== o.guide7[k])
    .map((k) => o.page + ' ' + k)), []);

check('...and every listed disagreement really is one',
  guideRows.flatMap(({ o, c }) => (o.guideOff || [])
    .filter((k) => at7(o, c, k) === o.guide7[k]).map((k) => o.page + ' ' + k)), []);

check('the disagreements, by name — the guide\'s student table is out of date for these',
  guideRows.flatMap(({ o }) => (o.guideOff || []).map((k) => o.page + ' ' + k)).sort(),
  ['Collaborate with your student (Gifted) fail', 'Collaborate with your student (Gifted) win',
    'Collaborate with your student (Meticulous) fail', 'Collaborate with your student (Profound) fail',
    'Shepherd your student through some research (Gifted) fail',
    'Shepherd your student through some research (Meticulous) fail',
    'Shepherd your student through some research (Profound) fail',
    'Work with your expert student (Meticulous) fail', 'Work with your expert student (Profound) win']);

check('and the tooltip says so, with both figures',
  api.labOptionSpec(opt('Work with your Profound Student', 'Work with your expert student (Profound)'),
    card('Work with your Profound Student'), LAB7({ [S.profound]: 5 })).title
    .includes('says 23 on a success at Equipment 7; the option page works out to 22'), true);

check('the Visionary Student matches the guide outright',
  card('Work with your Visionary Student').opts.filter((o) => o.guide7).map((o) =>
    [at7(o, null, 'win'), at7(o, null, 'fail')]), [[11, 10], [18, 17], [23, 18]]);

// --- what a card's badge says ----------------------------------------------

const cardText = (name, st) => api.labCardSpec(card(name), st).text;

check('a level 5 student: the expert option, marked ▾ for the hunch it cannot rank',
  cardText('Work with your Profound Student', LAB7({ [S.profound]: 5 })), '22?▾');

check('a student whose level is unread: a range over the three tiers',
  cardText('Work with your Profound Student', LAB7({ [S.profound]: undefined })), '11–22?▾');

check('...coloured neutral, because a colour would claim a figure',
  api.labCardSpec(card('Work with your Profound Student'), LAB7({ [S.profound]: undefined })).color,
  api.LAB_COLOR_RANGE);

check('nothing read at all: a range over Equipment 1–9',
  cardText('Form New Hypotheses', UNREAD), '9–17');

check('a Luck option is its expected value, marked ≈ and with no ?',
  cardText('Running out of Steam', LAB7()), '≈29▾');

check('an option giving an Epiphany carries ✦, behind a challenge ?',
  cardText('Rely on the Numismatrix', LAB7({ [Q.eo]: 1400 })), '18✦?▾');

check('an expert\'s card with the project unread says nothing it cannot back',
  cardText('Rely on the Numismatrix', LAB7({ [Q.eo]: undefined })), '▾');

check('an option paying no research is a word, not a score',
  [cardText('See a Doctor', LAB7()), cardText('Student Complaints', LAB7())],
  ['Wounds −2', 'Disgruntled −2']);

check('Parabolan Research says so on the badge, in its own colour',
  (() => {
    const spec = api.labCardSpec(card('The Reflection of Research'),
      LAB7({ [S.visionary]: 5, [Q.glass]: 2 }));
    return [spec.text, spec.color];
  })(), ['PR 7', api.LAB_COLOR_PR]);

check('Unwise Ideas are counted off Possessions, and the cash-in uses them all up',
  cardText('The Intrusion of a Thought', state({ [Q.equipment]: 7 }, { 'Unwise Idea': 3 })), '60▼');

check('...and a stale Possessions reading is marked ~',
  cardText('The Intrusion of a Thought', state({ [Q.equipment]: 7 }, { 'Unwise Idea': 3 }, NOW, NOW - 5 * 60000)),
  '~60▼');

check('Write Up Your Findings works the draft out from your research and results',
  cardText('Write Up Your Findings',
    state({ [Q.equipment]: 7, [Q.research]: 900, [Q.required]: 1000 }, { 'Unexpected Result': 4 })),
  '125▼?');

check('a gold badge carries dark ink',
  (() => {
    const spec = api.labCardSpec(card('The Intrusion of a Thought'), state({ [Q.equipment]: 7 }, { 'Unwise Idea': 3 }));
    return [spec.color, spec.ink];
  })(), ['#e0b53a', '#14181c']);

check('Encourage your student to work with his colleagues scales with both',
  api.labOptionValue(opt('Work with your Shifty Student', 'Encourage your student to work with his colleagues (Shifty)'),
    card('Work with your Shifty Student'), state({ [Q.equipment]: 7, [Q.workers]: 2, [S.shifty]: 3 })),
  { lo: 10, hi: 10 });

check('the card tooltip lists every option on the card',
  api.LAB_CARDS.filter((c) => {
    const title = api.labCardSpec(c, LAB7()).title;
    return !c.opts.every((o) => title.includes(o.branch));
  }).map((c) => c.name), []);

check('every option\'s spec builds in all three states, and names itself',
  ['unread', 'lab7', 'full'].flatMap((which) => {
    const st = which === 'unread' ? UNREAD : which === 'lab7' ? LAB7()
      : state({ [Q.equipment]: 9, [Q.workers]: 4, [Q.eo]: 950, [Q.research]: 400, [Q.required]: 1200,
        [S.profound]: 5, [S.gifted]: 5, [Q.glass]: 2, 'Glasswork': 8 }, { 'Unwise Idea': 2, 'Unexpected Result': 5 });
    return api.LAB_CARDS.flatMap((c) => c.opts.filter((o) => {
      try {
        const spec = api.labOptionSpec(o, c, st);
        return !spec.text || !spec.color || !spec.title.startsWith(o.branch);
      } catch (e) {
        return true;
      }
    }).map((o) => which + ': ' + o.branch));
  }), []);

// --- colour ----------------------------------------------------------------

function luminance(hex) {
  const chan = (i) => {
    const v = parseInt(hex.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(1) + 0.7152 * chan(3) + 0.0722 * chan(5);
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

check('one colour per band of the ramp, and none shared with the range, PR or label colours',
  new Set(api.LAB_RAMP.map((s) => s.color).concat([api.LAB_COLOR_RANGE, api.LAB_COLOR_PR, api.LAB_COLOR_LABEL])).size,
  api.LAB_RAMP.length + 3);

check('every badge colour is readable against the ink it is drawn with',
  api.LAB_RAMP.map((s) => [s.color, s.ink || '#ffffff'])
    .concat([[api.LAB_COLOR_RANGE, '#ffffff'], [api.LAB_COLOR_PR, '#ffffff'], [api.LAB_COLOR_LABEL, '#ffffff']])
    .filter((p) => contrast(p[0], p[1]) < 4.5).map((p) => p[0]), []);

check('and the one light colour really does need its dark ink',
  api.LAB_RAMP.filter((s) => s.ink).map((s) => contrast(s.color, '#ffffff') < 3.5), [true]);

check('the text alone separates a range, a Parabolan figure and a label from a figure',
  [/–/.test(cardText('Work with your Profound Student', LAB7({ [S.profound]: undefined }))),
    /^PR /.test(cardText('The Reflection of Research', LAB7({ [S.visionary]: 5 }))),
    /\D/.test(cardText('See a Doctor', LAB7()))],
  [true, true, true]);

// --- telling same-named options apart --------------------------------------

const team = card('Directing your Team');
check('"Coordinate a plan of research" is told apart by your Disgruntlement',
  [api.labDisambiguate(api.labBranchRows(team, 'Coordinate a plan of research'), team, LAB7()).page,
    api.labDisambiguate(api.labBranchRows(team, 'Coordinate a plan of research'), team,
      LAB7({ [Q.disgruntlement]: 3 })).page],
  ['Coordinate a plan of research (No Disgruntlement)', 'Coordinate a plan of research (Disgruntlement)']);

check('...and with it unread, both say the same on a success, so either answers',
  !!api.labDisambiguate(api.labBranchRows(team, 'Coordinate a plan of research'), team,
    LAB7({ [Q.disgruntlement]: undefined })), true);

const numis = card('Rely on the Numismatrix');
check('the Numismatrix\'s three special expertises by project, and nothing without one',
  [api.labDisambiguate(api.labBranchRows(numis, 'Ask for her special expertise on this project'), numis,
    LAB7({ [Q.eo]: 980 })).page,
    api.labDisambiguate(api.labBranchRows(numis, 'Ask for her special expertise on this project'), numis,
      LAB7({ [Q.eo]: undefined }))],
  ['Ask for her special expertise on this project 980', null]);

check('an option name resolves only within its card',
  [api.labBranchRows(card('See a Doctor'), 'Take a break')[0].label,
    api.labBranchRows(card('Tomb Sciences'), 'Take a break')[0].label],
  ['Wounds −2', 'Scandal −2']);

// --- reading Myself --------------------------------------------------------

check('absent qualities are 0 on an unfiltered list, and unknown on a filtered one',
  (() => {
    const values = new Map([[Q.equipment, { quality: Q.equipment, level: 6 }]]);
    const open = api.labFromQualities({ values, filtered: false });
    const filtered = api.labFromQualities({ values, filtered: true });
    return [open[Q.equipment], open[S.visionary], filtered[Q.equipment], S.visionary in filtered];
  })(), [6, 0, 6, false]);

// --- the gate --------------------------------------------------------------

// Captured in-game on 2026-09-14: "Welcome to The University, delicious friend!"
check('the lab\'s greeting, captured verbatim, is the whole list',
  api.LAB_AREAS, [api.normalizeName('The University')]);

check('the greeting in all three states: the University, somewhere else, unreadable',
  [(area = 'The University', api.labConfirmed([])),
    (area = 'Wolfstack Docks', api.labConfirmed(['Rely on the Numismatrix'])),
    (area = null, api.labConfirmed([]))],
  [true, 'no', false]);

check('with no greeting, a distinctive lab card on screen confirms the lab; a strict one alone does not',
  [api.labConfirmed(['Rely on the Numismatrix']), api.labConfirmed(['Eureka!', 'Washing Up']),
    api.labConfirmed(['Eureka!', 'Form New Hypotheses'])],
  [true, false, true]);

// --- end to end ------------------------------------------------------------

const badgesAfter = (head) => {
  const out = [];
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    out.push(String(n.className).split(' ')[1]);
  }
  return out;
};
const badgeText = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n.textContent;
  }
  return null;
};

check('an opened lab card is badged, and so are its options — but not an option from another card',
  (() => {
    area = null;
    const head = makeHeading('Work with your Visionary Student', 'storylet-root__heading');
    const leave = makeHeading('Leave your student to their own devices', 'branch__title');
    const other = makeHeading('Take a break', 'branch__title');
    lists = { '.storylet-root__heading': [head], '.branch__title': [leave, other] };
    api.labRatings();
    const out = [badgeText(head, api.LAB_CLASS), badgeText(leave, api.LAB_BRANCH_CLASS), badgesAfter(other)];
    lists = {};
    return out;
  })(),
  ['5–27?▾', 'team', []]);

check('a strict card opened with nothing to confirm the lab stays silent, and speaks once confirmed',
  (() => {
    area = null;
    const head = makeHeading('Eureka!', 'storylet-root__heading');
    const branch = makeHeading('Make a profound realisation', 'branch__title');
    lists = { '.storylet-root__heading': [head], '.branch__title': [branch] };
    api.labRatings();
    const before = [badgesAfter(head), badgesAfter(branch)];
    area = 'The University';
    api.labRatings();
    const after = [badgeText(head, api.LAB_CLASS), badgeText(branch, api.LAB_BRANCH_CLASS)];
    area = null;
    lists = {};
    return [before, after];
  })(),
  // 18 + 3 × Equipment, over Equipment 1–9: nothing has been read here.
  [[[], []], ['21–45▼', '21–45▼']]);

check('a greeting naming somewhere else clears even a distinctive lab card and its options',
  (() => {
    area = 'The University';
    const head = makeHeading('Rely on the Numismatrix', 'storylet-root__heading');
    const branch = makeHeading('Ask her to help with unusual research', 'branch__title');
    lists = { '.storylet-root__heading': [head], '.branch__title': [branch] };
    api.labRatings();
    const before = [badgesAfter(head).length, badgesAfter(branch).length];
    area = 'Wolfstack Docks';
    api.labRatings();
    const after = [badgesAfter(head).length, badgesAfter(branch).length];
    area = null;
    lists = {};
    return [before, after];
  })(),
  [[1, 1], [0, 0]]);

check('four features can badge one option heading, and each clears only its own',
  (() => {
    const head = makeHeading('x', 'media__heading branch__title');
    const draw = (cls, flag, value) => api.attachBadge(head, {
      cls, flag, value, spec: { text: 'x', color: '#000', title: 't' }, place: 'after',
    });
    draw(api.FOTZ_BRANCH_CLASS, api.FOTZ_BRANCH_FLAG, 'a');
    draw(api.PC_BRANCH_CLASS, api.PC_BRANCH_FLAG, 'a');
    draw(api.VSD_BRANCH_CLASS, api.VSD_BRANCH_FLAG, 'a');
    draw(api.LAB_BRANCH_CLASS, api.LAB_BRANCH_FLAG, 'a');
    const four = badgesAfter(head).length;
    draw(api.FOTZ_BRANCH_CLASS, api.FOTZ_BRANCH_FLAG, 'b');
    const redrawn = badgesAfter(head).length;
    api.attachBadge(head, { cls: api.LAB_BRANCH_CLASS, flag: api.LAB_BRANCH_FLAG, value: 'a', spec: null, place: 'after' });
    const after = badgesAfter(head);
    return [four, redrawn, after.length, after.includes(api.LAB_BRANCH_CLASS)];
  })(),
  [4, 4, 3, false]);

// --- reference tables ------------------------------------------------------

check('the equipment ladder covers every level to 7, and then 9 for Fate',
  [...new Set(api.LAB_EQUIPMENT.map((e) => e.level))], [1, 2, 3, 4, 5, 6, 7, 9]);

check('every repeatable project has a number, a name, research and a reward',
  api.LAB_PROJECTS.filter((p) => !(p.eo > 0) || !p.name || !(p.research > 0) || !p.gives).map((p) => p.name), []);

check('the guide\'s reward values are its three bands',
  [...new Set(api.LAB_PROJECTS.filter((p) => p.value).map((p) => p.value))].sort((a, b) => a - b),
  [1250, 6250, 31250]);

check('every expert says how they are hired',
  api.LAB_EXPERTS.filter((x) => !x.name || !x.how).map((x) => x.name), []);

// --- the panel -------------------------------------------------------------

check('the panel renders, with a row and a badge for every option in the table',
  (() => {
    const root = api.renderLabPanel();
    let rows = 0, badges = 0;
    (function walk(el) {
      if (!el || !el.children) return;
      if (el.dataset && el.dataset.labSearch) rows++;
      if (String(el.className).split(/\s+/).includes(api.LAB_CLASS)) badges++;
      for (const child of el.children) walk(child);
    })(root);
    const total = api.LAB_CARDS.reduce((n, c) => n + c.opts.length, 0);
    return [rows === total, badges === total];
  })(),
  [true, true]);

check('the feature and the panel are both registered',
  [api.FEATURES.some((f) => f.name === 'university-laboratory' && f.run === api.labRatings),
    api.PANELS.some((p) => p.id === 'university-laboratory' && p.render === api.renderLabPanel)],
  [true, true]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
