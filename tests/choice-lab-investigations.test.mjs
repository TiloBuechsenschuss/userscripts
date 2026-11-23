// Ad-hoc test for FallenLondon/choice-helper.js's Begin a Scientific
// Investigation badges (feature `lab-investigations`).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// What's worth pinning here:
//
//  - **The table's shape.** Every option has a section, research or an
//    explicit null, a focus list, what it needs and at least one conclusion,
//    and every conclusion says what it pays: an Echo figure, a product word,
//    or both. Every item named anywhere has an entry in LAB_INV_PRICES, so an
//    unpriced item is a claim somebody looked up, never a gap.
//  - **The cross-check.** The guide's Repeatable Research table (LAB_PROJECTS,
//    in the lab panel) states research, Parabolan research, Value and a focus
//    for 27 of these projects. They must agree with the option pages.
//  - **The arithmetic** on worked examples: a bone figure marked ☠, a chance
//    shown as a range with ?, an extension marked », costs marked ▼, the
//    Expected Lab Reward Value kept off the badge.
//  - **Same-titled options** (two eggs, two locomotives, two monstrosity
//    studies) say what is true of both rather than pick one.
//  - **The gate**: only inside the opened storylet, cleared by a greeting
//    naming somewhere else, and no other feature badges these options.
//
// Numbers come from the option, conclusion and item pages on fallenlondon.wiki
// (fetched 2026-11-23).
//
//   node tests/choice-lab-investigations.test.mjs

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
    'return { LAB_INV, LAB_INV_PRICES, LAB_INV_FOCUS, LAB_INV_STORYLET, LAB_INV_CLASS, LAB_INV_FLAG,'
    + ' LAB_INV_RAMP, LAB_INV_COLOR_NONE, LAB_INV_LEGEND,'
    + ' labInvWorth, labInvEndWorth, labInvEchoes, labInvSpec, labInvSpecFor, labInvRows, labInvRatings,'
    + ' LAB_PROJECTS, LAB_CLASS, LAB_BRANCH_CLASS, BADGE_CLASS, normalizeName, FEATURES }; })();');
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

const T = api.LAB_INV;
const byPage = (page) => T.find((e) => (e.page || e.branch) === page);
const text = (page) => api.labInvSpec(byPage(page)).text;

if (process.argv.includes('--dump')) {
  for (const e of T) console.log((e.page || e.branch).padEnd(60), '|', api.labInvSpec(e).text);
}

// --- the table is well formed ----------------------------------------------

check('every option has a section, research (or an explicit null), a focus list, needs and a conclusion',
  T.filter((e) => !e.branch || !e.section || !(e.research === null || e.research > 0)
    || !Array.isArray(e.focus) || !e.needs || !Array.isArray(e.ends) || !e.ends.length)
    .map((e) => e.page || e.branch), []);

check('the wiki page identifies an option uniquely',
  new Set(T.map((e) => e.page || e.branch)).size, T.length);

check('every focus is a known focus, listed once',
  T.filter((e) => e.focus.some((k) => !api.LAB_INV_FOCUS[k]) || new Set(e.focus).size !== e.focus.length)
    .map((e) => e.branch), []);

check('every conclusion says what it pays: an Echo figure, a product word, or both',
  T.flatMap((e) => e.ends.filter((end) => !api.labInvEndWorth(end).priced && !end.product)
    .map((end) => (e.page || e.branch) + ' / ' + end.via)), []);

check('a conclusion has either items or outcomes, never both',
  T.flatMap((e) => e.ends.filter((end) => end.gives && end.outcomes).map((end) => end.via)), []);

const itemsNamed = new Set();
for (const e of T) {
  for (const c of e.costs || []) itemsNamed.add(c[0]);
  for (const end of e.ends) {
    for (const g of end.gives || []) itemsNamed.add(g[0]);
    for (const c of end.costs || []) itemsNamed.add(c[0]);
    for (const o of end.outcomes || []) for (const g of o.gives) itemsNamed.add(g[0]);
  }
}
check('every item a project names has an entry in LAB_INV_PRICES',
  [...itemsNamed].filter((n) => !Object.prototype.hasOwnProperty.call(api.LAB_INV_PRICES, n)), []);

check('every price is exactly one of an Echo price, a Bone Value or a stated reason for none',
  Object.entries(api.LAB_INV_PRICES).filter(([, p]) => {
    const kinds = ['e', 'bone', 'none'].filter((k) => p[k] != null);
    if (kinds.length !== 1) return true;
    if (p.none != null) return typeof p.none !== 'string' || !p.none;
    const v = p.e != null ? p.e : p.bone;
    return Array.isArray(v) ? !(v.length === 2 && v[0] > 0 && v[1] > v[0]) : !(v > 0);
  }).map(([n]) => n), []);

check('no price is left over that no project names',
  Object.keys(api.LAB_INV_PRICES).filter((n) => !itemsNamed.has(n)), []);

check('counts are positive whole numbers',
  T.flatMap((e) => [...(e.costs || []), ...e.ends.flatMap((end) => [...(end.gives || []), ...(end.costs || []),
    ...(end.outcomes || []).flatMap((o) => o.gives)])])
    .filter((p) => !(Number.isInteger(p[1]) && p[1] > 0)).map((p) => p[0]), []);

check('70 options, filed under the thirteen subpages of the storylet',
  [T.length, [...new Set(T.map((e) => e.section))].length], [70, 13]);

// --- the cross-check against the guide's Repeatable Research table ----------

const guide = new Map(api.LAB_PROJECTS.map((p) => [api.normalizeName(p.name), p]));
const shared = T.filter((e) => guide.has(api.normalizeName(e.branch)));
check('27 of these projects are also in the guide\'s table', shared.length, 27);

check('the guide and the option pages agree on research and Parabolan research',
  shared.filter((e) => {
    const g = guide.get(api.normalizeName(e.branch));
    return g.research !== e.research || (g.pr || 0) !== (e.pr || 0);
  }).map((e) => e.branch), []);

check('the guide\'s Value column is the Expected Lab Reward Value the option page sets',
  shared.filter((e) => {
    const g = guide.get(api.normalizeName(e.branch));
    return (g.value == null ? null : g.value) !== (e.elrv == null ? null : e.elrv);
  }).map((e) => e.branch),
  // Where the guide leaves Value blank (the Thigh Bone, the Machine, the
  // Distributor, the Theorem, the Betrayer projects, the Prelapsarian history)
  // the option page sets none either.
  []);

const FOCUS_WORD = { monstrous: 'Monstrous', toxic: 'Toxicological', shapeling: 'Shapeling', red: 'Red Science',
  nautical: 'Nautical', corr: 'Correspondence' };
check('where the guide\'s Type column names a focus, the option page sets that focus and no other',
  shared.filter((e) => {
    const type = guide.get(api.normalizeName(e.branch)).type;
    const named = Object.keys(FOCUS_WORD).filter((k) => type.includes(FOCUS_WORD[k]));
    return JSON.stringify(named.sort()) !== JSON.stringify([...e.focus].sort());
  }).map((e) => e.branch), []);

// --- the arithmetic --------------------------------------------------------

check('Echo figures print whole Echoes bare and anything else to the penny',
  [0.1, 12.5, 26, 62.5, 312.5, 1562.6, 3].map(api.labInvEchoes),
  ['0.10', '12.50', '26', '62.50', '312.50', '1,562.60', '3']);

check('a plain Echo payout: Night-Whisper at 62.50, Toxicological, with Parabolan research',
  text('Study the properties of Attar'), '450 LR +15 PR · 62.50 E · Toxicological');

check('the Albatross: two Wings and two Observations are 26 E, not the 12.50 the hidden valuation says; » for the extension; ▼ for the bird',
  text('Study the Focused Albatross'), '▼ 100 LR · 26 E » · Monstrous');

check('the hidden valuation is in the tooltip, never on the badge',
  [api.labInvSpec(byPage('Study the Focused Albatross')).title.includes('Expected Lab Reward Value): 12.50 E'),
    text('Study the Focused Albatross').includes('12.50')],
  [true, false]);

check('bones are their Bone Value, marked ☠: the Pinewood Shark\'s 38 Fin Bones (19) + 2 Observations (1) + 500 Fragments (5)',
  text('Dissect the Pinewood Shark'), '▼ 100 LR · 25 E ☠ » · Monstrous');

check('a bone the page says can be used two ways is a range: the elastic limits pay 60.10 to 67',
  [api.labInvEndWorth(byPage('Test the elastic limits of flesh and bone').ends[0]).lo,
    api.labInvEndWorth(byPage('Test the elastic limits of flesh and bone').ends[0]).hi,
    text('Test the elastic limits of flesh and bone')],
  [60.1, 67, '▼ 550 LR · 60.10–67 E ☠ · Shapeling']);

check('a challenge is the range across its outcomes with ?, never the advertised half',
  [text('Accept a Palaeontological Task from the Dean'), text('Disambiguate an Eolith')],
  ['50 LR · 0.10–3 E ☠? · no focus', '▼ 10 LR · 0–12.50 E? · no focus']);

check('a product with no Echo price says what it is',
  [text('Investigate the tears you recovered from Mr Spices'), text('Research the Formula for Railway Steel'),
    text('Make a deeper study of toxins')],
  ['▼ 500 LR +50 PR · Watchful Gains 21 · Toxicological', '500 LR +25 PR · Formula for Railway Steel · no focus',
    '▼ 300 LR +50 PR · Kataleptic Toxicology cap 6 · Toxicological']);

check('Echoes and a product together',
  text('Chemically analyse Mr Spices\' new drug'), '550 LR · 62.50 E + Watchful Gains 6 · Toxicological');

check('a compulsory second stage is added to the research: the Route to Parabola is 50 then 75',
  text('Find a Route to Parabola'), '▼ 50+75 LR · Parabolan Base-Camp · no focus');

check('a faction result follows the focus: the Distributor spends Favours: Hell 3',
  text('Research a Devilish Probability Distributor'), '▼ 450 LR · 62.50 E · no focus · Favours: Hell −3');

check('Emetic Revelations are 625 Cryptic Clues at 0.02 each, so the Starved study pays 2 × 12.50 + 15 × 2.50',
  text('Make a study of a few samples from a Starved citadel'),
  '▼ 550 LR · 62.50 E + 5 Tempestuous Tales · Toxicological');

check('the big ones: an Impossible Theorem, and the Cartographer\'s Hoard',
  [text('Research an Impossible Theorem'), text('Create a Cartographer\'s Hoard')],
  ['13,000 LR +300 PR · 1,562.60 E · no focus', '2,700 LR · 312.50 E · Nautical']);

check('several foci are listed in full',
  text('Study the Mountain-Sherd you have on hand'),
  '250 LR · diamond-heart story · Toxicological + Red Science + Correspondence');

// --- colour ----------------------------------------------------------------

const color = (page) => api.labInvSpec(byPage(page)).color;
check('one colour per payout band, and plum for no Echo figure',
  [color('Research an Impossible Theorem'), color('Study the properties of Attar'),
    color('Study the Focused Albatross'), color('Analyse your False-Snake'),
    color('Disambiguate an Eolith'), color('Research the Formula for Railway Steel')],
  ['#e0b53a', '#9a5b12', '#1f7a73', '#1f7a73', '#1f7a73', api.LAB_INV_COLOR_NONE]);

check('the light gold band carries dark ink',
  [api.labInvSpec(byPage('Research an Impossible Theorem')).ink, api.labInvSpec(byPage('Study the properties of Attar')).ink],
  ['#14181c', undefined]);

check('the text alone tells a Bone Value from an Echo price, without the colour',
  [text('Try the Betrayer of Measures on a human ribcage').includes('☠'),
    text('Study the Augmentation Device').includes('☠')],
  [true, false]);

// --- same-titled options ------------------------------------------------------

check('three titles are two options each, and only those',
  [...new Set(T.map((e) => api.normalizeName(e.branch)))]
    .filter((k) => api.labInvRows(k).length > 1).length, 3);

check('the two eggs: one badge saying what is true of both',
  api.labInvSpecFor(api.labInvRows('Attempt to create the ideal hatching conditions for your egg')).text,
  '2,700 LR · Prophetic Raven Advisor / Machiavellian Raven Advisor · Monstrous');

check('the two locomotives differ only in their focus',
  api.labInvSpecFor(api.labInvRows('Build a Locomotive for Mr Spices')).text,
  '▼ 550 LR · Watchful Gains 24 · no focus / Red Science');

check('the two monstrosity studies differ in their research',
  api.labInvSpecFor(api.labInvRows('Work toward a fuller understanding of monstrosities')).text,
  '▼ 300 LR +50 PR / ▼ 500 LR +50 PR · Monstrous Anatomy cap 6 / Monstrous Anatomy cap 7 · Monstrous');

check('a merged tooltip carries both options in full, and the legend once',
  (() => {
    const t = api.labInvSpecFor(api.labInvRows('Attempt to create the ideal hatching conditions for your egg')).title;
    return [t.includes('Egg as Black as Coal'), t.includes('Egg as White as Fear'),
      t.split(api.LAB_INV_LEGEND).length - 1];
  })(),
  [true, true, 1]);

check('the wiki\'s "(again)" label for the Eolith is matched too',
  api.labInvRows('Disambiguate an Eolith (again)').length, 1);

// --- end to end ------------------------------------------------------------

const badgesAfter = (head) => {
  const out = [];
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    out.push(n);
  }
  return out;
};
const ours = (head) => badgesAfter(head).filter((n) => n.classList.contains(api.LAB_INV_CLASS))
  .map((n) => n.textContent);

function openStorylet(name, titles) {
  const head = makeHeading(name, 'storylet-root__heading');
  const branches = titles.map((t) => makeHeading(t, 'branch__title'));
  lists = { '.storylet-root__heading': [head], '.branch__title': branches };
  return branches;
}

check('inside Begin a Scientific Investigation, its options are badged; a title it does not list is not',
  (() => {
    area = null;
    const [a, b] = openStorylet(api.LAB_INV_STORYLET, ['Study the properties of Attar', 'Petition the Dean for experimental materials']);
    api.labInvRatings();
    const out = [ours(a), ours(b)];
    lists = {};
    return out;
  })(),
  [['450 LR +15 PR · 62.50 E · Toxicological'], []]);

check('the same title under another storylet is left alone',
  (() => {
    area = 'The University';
    const [a] = openStorylet('Some other storylet', ['Create an Infernal Machine']);
    api.labInvRatings();
    const out = ours(a);
    area = null;
    lists = {};
    return out;
  })(),
  []);

check('a greeting naming somewhere else clears the badges; the University and no greeting keep them',
  (() => {
    const [a] = openStorylet(api.LAB_INV_STORYLET, ['Create an Infernal Machine']);
    area = null;
    api.labInvRatings();
    const unknown = ours(a).length;
    area = 'The University';
    api.labInvRatings();
    const yes = ours(a).length;
    area = 'Wolfstack Docks';
    api.labInvRatings();
    const no = ours(a).length;
    area = null;
    lists = {};
    return [unknown, yes, no];
  })(),
  [1, 1, 0]);

check('re-running is idempotent, and a recycled heading gets the new option\'s badge',
  (() => {
    area = null;
    const [a] = openStorylet(api.LAB_INV_STORYLET, ['Study the properties of Attar']);
    api.labInvRatings();
    api.labInvRatings();
    const once = ours(a);
    a.childNodes = [{ nodeType: 3, nodeValue: 'Create a Cartographer\'s Hoard' }];
    api.labInvRatings();
    const after = ours(a);
    lists = {};
    return [once, after];
  })(),
  [['450 LR +15 PR · 62.50 E · Toxicological'], ['2,700 LR · 312.50 E · Nautical']]);

check('with every option open at once, no other feature badges any of them',
  (() => {
    area = 'The University';
    const branches = openStorylet(api.LAB_INV_STORYLET, [...new Set(T.map((e) => e.branch))]);
    for (const f of api.FEATURES) {
      try { f.run(); } catch (e) { /* a feature whose markup this stub lacks */ }
    }
    const strays = branches.flatMap((b) => badgesAfter(b)
      .filter((n) => !n.classList.contains(api.LAB_INV_CLASS))
      .map((n) => b.childNodes[0].nodeValue + ' ← ' + String(n.className)));
    const unbadged = branches.filter((b) => ours(b).length !== 1).map((b) => b.childNodes[0].nodeValue);
    area = null;
    lists = {};
    return [strays, unbadged];
  })(),
  [[], []]);

check('the feature is registered, right after the lab\'s own',
  (() => {
    const i = api.FEATURES.findIndex((f) => f.name === 'lab-investigations');
    return [i > 0 && api.FEATURES[i - 1].name === 'university-laboratory',
      api.FEATURES[i].run === api.labInvRatings, api.FEATURES[i].group];
  })(),
  [true, true, 'London']);

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
