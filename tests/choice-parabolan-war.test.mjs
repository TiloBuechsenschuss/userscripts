// Ad-hoc test for FallenLondon/choice-helper.js's Parabolan War badges
// ('parabolan-war').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every Ravages option's Echoes-per-Ravage is
// what its own parts come to and lands on one of the guide's two rates, that
// every campaign carries its stages, both endings and its effect on Parabolan
// Dominance, that every piece of the Company leans one way, that every stage
// option says what a success pays and what a failure costs (and that the ones
// with no Ravages on a failure are exactly the guide's skill and Morale-spend
// types), that the "(enemies)" titles resolve however the game fills them in,
// and that every title the wiki splits into several pages is one row.
//
// Numbers come from Parabolan War (Guide) and the Dolorous Pavilion's storylet
// pages on fallenlondon.wiki, fetched through the API on 2026-09-17; the stage
// and story storylets and every option page they list on 2026-11-27.
//
//   node tests/choice-parabolan-war.test.mjs

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
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return heads.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
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
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS',
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS',
  'PW_OPTIONS', 'CE_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { PW_OPTIONS, PW_STORYLETS, PW_STAGES, PW_WASTES, PW_MOUNTAINS, PW_SHORE, PW_RIVER, PW_RULES, pwColor, CAROUSEL_COLOR_RISK, CAROUSEL_COLOR_PROGRESS, PW_INDEX, PW_CAUSE, PW_AFTERMATH, PW_MUNITIONS, PW_LOGISTICS, PW_GENERAL, PW_STRICT, PW_CLASS, PW_BRANCH_CLASS, pwBadgeText, pwSpec, pwStoryletSpec, pwAllowed, pwRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, '
    + TABLES.join(', ') + ' }; })();');
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
const rows = api.PW_OPTIONS;
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

// Every Ravages option is a price, and the price is recomputed here from its
// parts: the item's own Echo value times how many of them, over the Ravages it
// clears, IS the rate. The guide's two rates are 1.00 and 1.25, and nothing in
// the table may quietly land between them.
check('every Ravages option’s rate is what its parts come to',
  rows.filter((e) => e.cleared != null)
    .every((e) => Math.round((e.count * e.unit / e.cleared) * 100) / 100 === e.rate), true);

check('the eighteen Ravages options are six scars times three, at the guide’s two rates',
  [rows.filter((e) => e.cleared != null).length,
    [...new Set(rows.filter((e) => e.cleared != null).map((e) => e.rate))].sort(),
    [...new Set(rows.filter((e) => e.cleared != null).map((e) => e.cleared + '/' + e.actions))].sort()],
  [18, [1, 1.25], ['10/5', '2/1']]);

check('every campaign carries its stages, both endings and what it does to Dominance',
  rows.filter((e) => e.storylet === api.PW_CAUSE && !e.label).map((e) => [e.stages, !!e.endings, e.dominance]),
  [[3, true, null], [3, true, null], [5, true, 'Cats'], [5, true, 'Fingerkings'], [3, true, null],
    [5, true, 'the Red-Handed Queen'], [5, true, null]]);

check('badges for each shape of row',
  ['The Cats', 'The Viscountess', 'Words, Broken', 'Bejewel the Dome of Scales', 'Introduce new designs to the Dome',
    'Move out!', 'Form your Grand Parabolan Company'].map((n) => api.pwBadgeText(row(n))),
  ['5 stages · Dominance: Cats', '3 stages · Dominance unchanged', 'Oneironaut +1 ▼',
    'Ravages −2 · 1 action · 1.00 each ▼', 'Ravages −10 · 5 actions · 1.25 each ▼',
    'march · Morale from your leanings', 'form it · an Airag']);

// Every piece of the Company leans one way or the other, and that pair is the
// whole of what those choices do -- so a piece with no lean is a row missing
// its point.
check('every armament and every piece of infrastructure leans one way',
  rows.filter((e) => (e.storylet === api.PW_MUNITIONS || e.storylet === api.PW_LOGISTICS) && !e.label)
    .map((e) => e.lean),
  ['Oneironaut', 'Oneironaut', 'Cultivator', 'Oneironaut', 'Cultivator', 'Cultivator',
    'Oneironaut', 'Cultivator', 'Cultivator', 'Oneironaut', 'Oneironaut', 'Cultivator']);

// The rules line keeps the guide's rates, and says which source the badges
// follow where the guide's prose and the option pages disagree.
check('the rules line keeps the guide’s rates and says the pages win',
  [/1\.67/.test(api.PW_RULES), /1\.33/.test(api.PW_RULES), /badges follow the pages/.test(api.PW_RULES)],
  [true, true, true]);

// === The stages ===========================================================
const steps = rows.filter((e) => e.kind);
check('each stage carries the action options its storylet page lists',
  api.PW_STAGES.map((s) => steps.filter((e) => e.storylet === s).length),
  [6, 6, 6, 6, 7, 6, 6]);

check('every stage option has a challenge, a success that makes Advance!, and a failure',
  steps.filter((e) => !(e.ch && e.ch.stat && e.ch.diff && e.win && e.win.adv > 0 && e.lose)).map((e) => e.name), []);

// The guide's claim about the two kinds that never cost a Ravage on failure,
// checked against what was transcribed off the pages.
check('the options whose failure costs no Ravages are exactly the skill and Morale-spend ones',
  [...new Set(steps.filter((e) => !e.lose.rav).map((e) => e.kind))].sort(), ['skill', 'spend']);

check('a stage option’s badge, for each action type',
  [['Rally your army onward', api.PW_WASTES], ['Deploy Counter-Factual Phantasies', api.PW_WASTES],
    ['Host a hunt', api.PW_WASTES], ['Employ the arts of Glasswhispery', api.PW_WASTES],
    ['Gather the Flowers of Nevermore', api.PW_MOUNTAINS], ['Sail the Wanting-Way', api.PW_RIVER],
    ['Siege an Insidious Spinney', api.PW_SHORE], ['Delegate to yourself', api.PW_RIVER]]
    .map(([n, s]) => api.pwBadgeText(row(n, s))),
  ['safe · Advance +1 either way · fail Ravages +1', 'Airs · Advance +4? · fail Ravages +1',
    'Advance +1? · Morale +1 · fail Ravages +2', 'skill · Advance +2? ▼ · fail Nightmares +3 CP, no Ravages',
    'fast · Advance +3? · Ravages +2 · fail Ravages +2', 'Morale −5 → Advance +6? · fail Morale −3, no Ravages',
    'Airs · Advance +4? · fail Ravages +1, Solacefruit +2',
    'safe · Advance +2 either way ▼ · Mirror-Fed +1 · fail Ravages +1']);

// Colour repeats what the words say, never alone: brick exactly where the
// badge names a Ravage cost, teal exactly where it says there is none.
check('a stage option’s colour is carried by its text as well',
  steps.filter((e) => {
    const t = api.pwBadgeText(e);
    const c = api.pwColor(e);
    return c === api.CAROUSEL_COLOR_RISK ? !/Ravages \+/.test(t) : !(c === api.CAROUSEL_COLOR_PROGRESS && /no Ravages/.test(t));
  }).map((e) => e.name), []);

check('every option that uses items says so with ▼ and names them in the tooltip',
  steps.filter((e) => e.uses).filter((e) => {
    const spec = api.pwSpec(e);
    return !spec.text.includes('▼') || !spec.title.includes(e.uses);
  }).map((e) => e.name), []);

// "(enemies)" is filled in by the game with the power you are fighting; the
// wiki lists most fill-ins for two of the three and none for the third.
const hit = (name, storylet) => {
  const e = api.carouselLookup(api.PW_INDEX, name, key(storylet));
  return e && e.name;
};
check('the "(enemies)" titles resolve however the game fills them in, and never into each other',
  [hit('Lure the Fingerkings with false fruit', api.PW_MOUNTAINS), hit('Lure the hidden enemies with false fruit', api.PW_MOUNTAINS),
    hit('Lure your legions with false fruit', api.PW_MOUNTAINS),
    hit('Toxify the waters of the cats', api.PW_MOUNTAINS), hit('Toxify the waters of your legions', api.PW_MOUNTAINS),
    hit('Dream your way past the Fingerkings', api.PW_SHORE)],
  ['Lure the (enemies) with false fruit', 'Lure the (enemies) with false fruit', 'Lure the (enemies) with false fruit',
    'Toxify the waters of the (enemies)', 'Toxify the waters of the (enemies)', 'Dream your way past the (enemies)']);

// Titles the wiki splits into several pages are one title on screen, so each
// is one row: two rows would match the same heading and badge neither.
check('a title the wiki splits into pages is one row, found by its plain title',
  [hit('Return to your Base-Camp', api.PW_WASTES), hit('Return to your Base-Camp', api.PW_RIVER),
    hit('Defend the castle', api.PW_MOUNTAINS), hit('Bear witness', 'The Bloody-Handed End'),
    hit('Leave the Palatinate', 'The Palatinate, Regained'), hit('Give the Calendar your word', 'The Highest of Sancta'),
    hit('Walk away', 'The Entanglement of Glass'), hit('Enter Arbor', api.PW_SHORE)],
  ['Return to your Base-Camp (from a Campaign)', 'Return to your Base-Camp (from the Hanging Mountains)',
    'Defend the castle', 'Bear witness', 'Leave the Palatinate', 'Give the Calendar your word',
    'Walk away (The Entanglement of Glass)', 'Enter Arbor 2']);

// === The story between the stages =========================================
check('each of the Chessboard’s three choices offers one of each Leaning',
  ['A Quiet Moment with the Appalling Socialite', 'The Rosy Crown', 'Queen of Roses']
    .map((s) => rows.filter((e) => e.storylet === s && e.leaning).map((e) => e.leaning)),
  [['White Leaning +1', 'Red Leaning +1', 'Black Leaning +1'], ['White Leaning +2', 'Red Leaning +2', 'Black Leaning +2'],
    ['White Leaning +2', 'Red Leaning +2', 'Black Leaning +2 · Red Leaning +2']]);

// An ending's pay, as the story pages give it, against the cause rows taken
// from the guide's campaign table: the item each ending leads with must be in
// some campaign's endings.
check('every ending’s item is one the campaign table also records',
  (() => {
    const all = rows.filter((e) => e.storylet === api.PW_CAUSE && e.endings).map((e) => e.endings).join(' ');
    const words = { Edicts: 'Edicts of the First City', Parable: 'Parabolan Parable', Almanac: 'Waswood Almanac',
      Mortification: 'Mortification of a Great Power', Revelation: 'Oneiromantic Revelation' };
    return rows.filter((e) => e.ending && e.storylet !== 'The Highest of Sancta' && !/^(as|by) /.test(e.tag))
      .map((e) => e.tag.split(' · ')[0].replace(/ ×\d+$/, ''))
      .map((w) => words[w] || w).filter((w) => !all.includes(w));
  })(), []);

check('every ending, Leaning and onward step has a badge and a tooltip',
  rows.filter((e) => e.ending || e.leaning || e.onward).filter((e) => {
    const spec = api.pwSpec(e);
    return !spec || !spec.text || !spec.title.includes(e.name);
  }).map((e) => e.name), []);

// "A Visitor" is two ordinary words; it is badged only where the greeting says
// the Pavilion, in all three greeting states.
check('the one ordinary heading is gated on the greeting, in all three states',
  ['It’s Tester! Welcome to The Dolorous Pavilion, delicious friend!',
    'It’s Tester! Welcome to Spite, delicious friend!', null].map((g) => {
    greeting = g;
    return [api.pwAllowed('A Visitor'), api.pwAllowed(api.PW_CAUSE), !!api.pwStoryletSpec(key('A Visitor'))];
  }),
  [[true, true, true], [false, true, false], [false, true, false]]);
greeting = null;

check('a heading says which part of the war it is',
  [api.PW_CAUSE, api.PW_AFTERMATH, api.PW_MUNITIONS, api.PW_GENERAL, api.PW_WASTES, 'The Rosy Crown']
    .map((s) => api.pwStoryletSpec(key(s)).text),
  ['pick a cause', 'clear the Ravages', 'Armaments · 3 needed', 'appoint a General', 'stage 1 · Advance! 24',
    'Chessboard · after stage 3 · a Leaning']);

check('every storylet in the table has a heading of its own',
  api.PW_STORYLETS.filter((s) => !api.PW_STRICT.includes(s) && api.pwStoryletSpec(key(s)).text === 'the Pavilion'), []);

check('the registered pass: a heading and an option under its open storylet',
  (() => {
    const list = makeHeading(api.PW_CAUSE, 'storylet__heading');
    const open = makeHeading(api.PW_AFTERMATH, 'storylet-root__heading');
    const branch = makeHeading('Dam the Waswood with truths');
    const elsewhere = makeHeading('The Cats');
    heads = [list];
    roots = [open];
    branches = [branch, elsewhere];
    api.pwRatings();
    const out = [text(list, api.PW_CLASS), text(open, api.PW_CLASS), text(branch, api.PW_BRANCH_CLASS),
      text(elsewhere, api.PW_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['pick a cause', 'clear the Ravages', 'Ravages −2 · 1 action · 1.25 each ▼', null]);

check('the registered pass on a stage: the option the user found unbadged now is',
  (() => {
    const open = makeHeading(api.PW_WASTES, 'storylet-root__heading');
    const hunt = makeHeading('Host a hunt');
    const trench = makeHeading('Lead your army through forgotten trenches');
    roots = [open];
    branches = [hunt, trench];
    api.pwRatings();
    const out = [text(open, api.PW_CLASS), text(hunt, api.PW_BRANCH_CLASS), text(trench, api.PW_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['stage 1 · Advance! 24', 'Advance +1? · Morale +1 · fail Ravages +2', 'Airs · Advance +4? · fail Ravages +1']);

check('no Parabolan War name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PW_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'parabolan-war'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
