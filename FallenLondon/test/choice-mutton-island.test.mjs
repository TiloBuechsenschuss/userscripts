// Ad-hoc test for FallenLondon/choice-helper.js's Mutton Island badges
// ('mutton-island').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - "reset" on exactly the lines that end the cycle. Time Passing is the
//    island's whole clock: a badge that leaves out that an option throws it
//    away is the one mistake that costs a player a run.
//  - The two rows where the option pages disagree with the guide -- the wind's
//    voice, which the guide files as a storylet of its own, and the Fate-gated
//    Venge-Rat, which the guide's table has not got at all -- and that both say
//    the page is followed.
//  - The Favours: The Docks on Rescue the crew, on the badge and after it.
//  - The strict gate in all three greeting states. Unlike Hunter's Keep this
//    greeting IS captured in game, which is what the shared FOTZ_AREAS rests
//    on, and both features have to read the same string.
//  - And that no Mutton Island name is in another feature's table, the Fruits
//    of the Zee festival on the same island included.
//
// Numbers come from Time Passing on Mutton Island (Guide) and the island's
// storylet and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-mutton-island.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

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
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
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

function makeHeading(text, className) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.className = className || '';
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let heads = [];
let branches = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return heads.concat(roots);
    if (sel === '.branch__title') return branches;
    return [];
  },
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS',
  'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS',
  'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS',
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MI_OPTIONS, MI_STORYLETS, MI_INDEX, MI_STRICT, MI_WINDOWS, MI_CLASS, MI_BRANCH_CLASS, miAllowed,'
    + ' miOnIsland, miBadgeText, miSpec, miStoryletSpec, miRatings, miColor, carouselLookup, factionText, inFotzArea,'
    + ' CAROUSEL_COLOR_PAYOUT, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES, ' + TABLES.join(', ') + ' }; })();');
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
const key = api.normalizeName;
const rows = api.MI_OPTIONS;
const row = (name, storylet) => rows.find((e) => e.name === name && (!storylet || e.storylet === storylet));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function otherNames(own) {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key).filter(Boolean);
}
const ON_ISLAND = "It's Tester! Welcome to Mutton Island, delicious friend!";
const IN_LONDON = "It's Tester! Welcome to Spite, delicious friend!";

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k) || !key(n)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('every row is either a label or carries a payout tag',
  rows.filter((e) => !e.label && !e.tag).map((e) => e.name), []);

check('every storylet has a Time Passing window for its heading badge',
  api.MI_STORYLETS.filter((s) => !api.MI_WINDOWS[s]), []);

check('every strict name is a storylet here', api.MI_STRICT.filter((s) => !api.MI_STORYLETS.includes(s)), []);

// The clock is the point: these seven are the only lines that take Time
// Passing away, and each one has to say so in words rather than in a colour.
check('the lines that end the cycle, and "reset" on exactly those',
  [rows.filter((e) => e.reset).map((e) => e.name),
    rows.every((e) => /reset/.test(api.miBadgeText(e)) === !!e.reset)],
  [['Head to your ship at the jetty', 'Rescue the crew', 'Help yourself to ‘salvage’', 'Attend the Feast',
    'Follow them up the path', 'What does it portend?', 'It would be criminal not to'], true]);

check('every Time Passing 9 storylet has a line that ends the cycle',
  api.MI_STORYLETS.filter((s) => /ends it/.test(api.MI_WINDOWS[s] || ''))
    .filter((s) => !rows.some((e) => e.storylet === s && e.reset)), []);

check('badges for each shape of row',
  ['Talk to the fellow', 'Rescue the crew', 'The voice of the wind', 'Try the Rubbery Lumps', 'What does it portend?',
    'I bid the wind speak', 'Head to your ship at the jetty'].map((n) => api.miBadgeText(row(n))),
  ['Hint ×145? fail Scandal +1', 'quirks · reset · Favours: The Docks +1', 'progress only? · Nightmares +1',
    'Dangerous +1 · Persuasive +1 · Wounds −1 ▼', 'Implication ×2 + Secret ×7 · Nightmares +3? fail Nightmares +2 · reset',
    'Stormy-Eyed +1 CP', 'leave · resets']);

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 6).
check('every faction result is on the badge, after it',
  rows.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name, api.miBadgeText(e).endsWith(' · ' + api.factionText(e.factions))]),
  [['Rescue the crew', true]]);

check('the two rows the guide gets wrong are named, and say the page is followed',
  rows.filter((e) => e.guide).map((e) => [e.name, /the page is followed/.test(api.miSpec(e).title)]),
  [['The voice of the wind', true], ['Follow the Ecstatic Venge-Rat', true]]);

// The wind's voice is an OPTION of The Mutton Island Wind on its page, and the
// guide's table has it as a storylet. If it were filed the guide's way it
// would never resolve, because no heading on screen is ever headed that.
check('the wind’s voice resolves inside The Mutton Island Wind and nowhere else',
  ['The Mutton Island Wind', 'Well Watching'].map((s) => {
    const e = api.carouselLookup(api.MI_INDEX, 'The voice of the wind', key(s));
    return e && e.storylet;
  }), ['The Mutton Island Wind', null]);

check('an ordinary heading is badged only on a greeting that says the island, in all three states',
  [ON_ISLAND, IN_LONDON, null].map((g) => {
    greeting = g;
    return [api.miAllowed('Crash!'), api.miAllowed('Inside the Cock and Magpie'),
      !!api.miStoryletSpec(key('A Great Feast')), !!api.miSpec(row('Attend the Feast'))];
  }),
  [[true, true, true, true], [false, true, false, false], [false, true, false, false]]);
greeting = null;

// One greeting, two features on this island: the festival's area list and this
// gate have to agree about what the game calls the place.
check('the festival and this feature read the same greeting',
  [ON_ISLAND, IN_LONDON].map((g) => { greeting = g; return [api.miOnIsland(), api.inFotzArea()]; }),
  [[true, true], [false, false]]);
greeting = null;

check('the rules line carries the guide’s Stormy-Eyed grind',
  /0.81 CP of Stormy-Eyed an action/.test(api.miSpec(row('I bid the wind speak')).title), true);

check('the registered pass: a heading, an option under its open storylet, and the gate lifting',
  (() => {
    const list = makeHeading('Well Watching', 'storylet__heading');
    const open = makeHeading('The Mutton Island Wind', 'storylet-root__heading');
    const branch = makeHeading('I bid the wind speak');
    heads = [list];
    roots = [open];
    branches = [branch];
    api.miRatings();
    const out = [text(list, api.MI_CLASS), text(open, api.MI_CLASS), text(branch, api.MI_BRANCH_CLASS)];
    greeting = ON_ISLAND;
    api.miRatings();
    out.push(text(list, api.MI_CLASS));
    greeting = null;
    heads = []; roots = []; branches = [];
    return out;
  })(),
  [null, 'Time Passing under 7', 'Stormy-Eyed +1 CP', 'Time Passing 7–8']);

check('no Mutton Island name is in another feature’s table',
  (() => {
    const others = otherNames('MI_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'mutton-island'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
