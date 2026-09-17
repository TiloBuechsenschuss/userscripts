// Ad-hoc test for FallenLondon/choice-helper.js's Hunter's Keep badges
// ('hunters-keep').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - That the badge is NOT the progress. Every option here moves Time Passing
//    the same way, so a badge quoting it would say the same thing forty times;
//    the table has to carry a payout for every row that is not a label, and
//    the rules line has to be the one place the +2/+1 is stated.
//  - The ★ for Hunter's Insight, on exactly the rows the guide marks. Half the
//    table is invisible on a first cycle, and a badge that does not say so
//    sends a first-time visitor looking for an option that is not there.
//  - "Talk to her" titles an option on BOTH Talk to Lucy and Find out more of
//    Lucy's story, with different figures. Each has to resolve under its own
//    open storylet and nowhere else.
//  - The strict gate in all three greeting states: four headings here are
//    ordinary English, and the greeting on the island has never been captured,
//    so the gate may only ever confirm.
//  - And that no Hunter's Keep name is in another feature's table.
//
// Numbers come from Time Passing at Hunter's Keep (Guide) and the island's
// storylet and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-hunters-keep.test.mjs

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
    'return { HK_OPTIONS, HK_STORYLETS, HK_INDEX, HK_STRICT, HK_WINDOWS, HK_CLASS, HK_BRANCH_CLASS, HK_MARK_INSIGHT,'
    + ' hkAllowed, hkOnIsland, hkBadgeText, hkSpec, hkStoryletSpec, hkRatings, hkColor, carouselLookup, factionText,'
    + ' CAROUSEL_COLOR_PAYOUT, CAROUSEL_COLOR_RISK, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS,'
    + ' VSD_OPTIONS, HG_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, ' + TABLES.join(', ') + ' }; })();');
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
const rows = api.HK_OPTIONS;
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
const ON_ISLAND = "It's Tester! Welcome to Hunter's Keep, delicious friend!";
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

// The badge is the payout, so every row that is not a way in, a way out or an
// ending label has to have one -- a row with no `tag` would badge "undefined".
check('every row is either a label or carries a payout tag',
  rows.filter((e) => !e.label && !e.tag).map((e) => e.name), []);

check('every storylet has a Time Passing window for its heading badge',
  api.HK_STORYLETS.filter((s) => !api.HK_WINDOWS[s]), []);

check('every strict name is a storylet here', api.HK_STRICT.filter((s) => !api.HK_STORYLETS.includes(s)), []);

// The guide marks the second-cycle options with Hunter's Insight; there are
// fifteen of them, and each one is out of reach until a cycle has been run.
check('the fifteen Hunter’s Insight options, and ★ on exactly those',
  [rows.filter((e) => e.insight).length,
    rows.every((e) => api.hkBadgeText(e).includes(api.HK_MARK_INSIGHT) === !!e.insight)],
  [15, true]);

check('badges for each shape of row',
  ['Have a look in the boathouse', 'Listen to her sing', 'Tell them about yourself', 'Look directly into the well',
    'Fish in the well', 'Find your ship', 'The Furies?'].map((n) => api.hkBadgeText(row(n))),
  ['Silk ×110? fail Wounds +2', 'Clue ×50 · Nightmares −2? fail a Popular Song ★', 'Clue ×70? ▼',
    'Peckish +2 · Wounds +2 · Nightmares +2', 'Tentacle-Key? fail Wounds +1 ★', 'leave · clears both',
    'Cynthia’s ending · Dangerous +5 CP']);

// Colour is a category and never the only carrier: gold for the lines that
// cash the carousel in, brick for the ones that cost menace whatever happens
// or 2 CP on a failure -- and both say so in words on the badge itself.
check('the payout colour is on the key and the three endings, and nothing else',
  rows.filter((e) => api.hkColor(e) === api.CAROUSEL_COLOR_PAYOUT).map((e) => e.name),
  ['Fish in the well', 'What falls down the well?', 'Trust Cynthia’s advice', 'Gather round the piano',
    'Take part in the chorus', 'Join the sisters in the herb-garden']);

check('a brick badge always names the menace in its text',
  rows.filter((e) => api.hkColor(e) === api.CAROUSEL_COLOR_RISK)
    .every((e) => /Wounds|Nightmares|Scandal|Suspicion|Peckish/.test(api.hkBadgeText(e))), true);

// "Talk to her" is on two storylets with different figures, so the open
// storylet is the whole of the difference.
check('"Talk to her" resolves under each of its two storylets, and nowhere else',
  ['Talk to Lucy', 'Find out more of Lucy’s story', 'Talk to Phoebe']
    .map((s) => { const e = api.carouselLookup(api.HK_INDEX, 'Talk to her', key(s)); return e && e.tag; }),
  ['Gossip ×2 + Clue ×7', 'Gossip ×2 · Wounds −1', null]);

check('the wiki’s disambiguated titles are carried as aliases',
  ['Investigate 1', 'Prepare yourself', 'Talk to her 2'].map((n) =>
    rows.some((e) => (e.aliases || []).includes(n))), [true, true, true]);

check('an ordinary heading is badged only on a greeting that says the island, in all three states',
  [ON_ISLAND, IN_LONDON, null].map((g) => {
    greeting = g;
    return [api.hkAllowed('Exploring the island'), api.hkAllowed('Talk to Phoebe'),
      !!api.hkStoryletSpec(key('A game of charades')), !!api.hkSpec(row('The Furies?'))];
  }),
  [[true, true, true, true], [false, true, false, false], [false, true, false, false]]);
greeting = null;

check('the rules line states the progress the badge leaves out',
  /\+2 CP on a success/.test(api.hkSpec(row('Charm her')).title), true);

check('the registered pass: a heading, an option under its open storylet, and the gate lifting',
  (() => {
    const list = makeHeading('Talk to Lucy', 'storylet__heading');
    const open = makeHeading('Talk to Lucy', 'storylet-root__heading');
    const gated = makeHeading('Exploring the island', 'storylet__heading');
    const branch = makeHeading('Ask her to take a stroll with you');
    heads = [list, gated];
    roots = [open];
    branches = [branch];
    api.hkRatings();
    const out = [text(list, api.HK_CLASS), text(branch, api.HK_BRANCH_CLASS), text(gated, api.HK_CLASS)];
    greeting = ON_ISLAND;
    api.hkRatings();
    out.push(text(gated, api.HK_CLASS));
    greeting = null;
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['Time Passing 3–6', 'Hint ×116? ★', null, 'Time Passing 2–6']);

check('no Hunter’s Keep name is in another feature’s table',
  (() => {
    const others = otherNames('HK_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

// One title IS shared with another feature: Hearts' Game has a "Prepare
// yourself" of its own. It owns the plain title as a name, so this table
// carries the wiki's numbered one and reaches the screen through the alias --
// and each is looked up inside its own open storylet anyway.
check('"Prepare yourself" is an alias here and a name in Hearts’ Game',
  [row('Prepare yourself 1').aliases, api.HG_OPTIONS.some((e) => e.name === 'Prepare yourself'),
    !!api.carouselLookup(api.HK_INDEX, 'Prepare yourself', key('Prepare to find out what the well has to offer'))],
  [['Prepare yourself'], true, true]);

// Nothing on this island pays a Renown or a Favour; if that ever changes, the
// faction result belongs on the badge after it, like everywhere else.
check('no row claims a faction result', rows.filter((e) => e.factions).map((e) => e.name), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'hunters-keep'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
