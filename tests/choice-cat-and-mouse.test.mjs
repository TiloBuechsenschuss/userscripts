// Ad-hoc test for FallenLondon/choice-helper.js's Cat and Mouse badges
// ('cat-and-mouse').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The guide's maximum Cat per case (63, and 67 for the Deranged Medium),
//    rebuilt from the table band by band: it is what catches a wrong Cat or a
//    wrong Mouse on any pursuit row.
//  - The guide's Echo cost of each item line, and the Luck lines' expectation.
//  - The guide-versus-page disagreements, by name.
//  - Titles shared by the two pursuit storylets resolving by the open one.
//
// Numbers come from Cat and Mouse (Guide) and its storylet and option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-cat-and-mouse.test.mjs

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

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let list = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
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
    'return { CM_OPTIONS, CM_INDEX, CM_STORYLETS, CM_ENDINGS, CM_DETECTIVE, CM_SEARCH, CM_ELUSIVE, CM_MAP,'
    + ' CM_MIRROR, CM_CLASS, CM_BRANCH_CLASS, cmBadgeText, cmColor, cmSpec, cmStoryletSpec, cmExpected, cmCertainAt,'
    + ' cmRatings, carouselLookup, CAROUSEL_COLOR_PROGRESS, CAROUSEL_COLOR_PAYOUT, CAROUSEL_COLOR_SETUP,'
    + ' FQ_OPTIONS, SOUP_OPTIONS, LBI_OPTIONS, DME_OPTIONS, VH_OPTIONS, ARBOR_OPTIONS, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const key = api.normalizeName;
const row = (name, storylet) => api.CM_OPTIONS.find((e) => e.name === name && (!storylet || e.storylet === storylet));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};

// --- the table is well formed ----------------------------------------------

check('every option is filed under one of the storylets',
  api.CM_OPTIONS.filter((e) => !api.CM_STORYLETS.includes(e.storylet)).map((e) => e.name), []);

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of api.CM_OPTIONS) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('every row says something on its badge',
  api.CM_OPTIONS.filter((e) => !api.cmBadgeText(e)).map((e) => e.name), []);

// --- the guide's maximum Cat -----------------------------------------------
//
// Start at Cat 1, then in every Mouse band take the best Cat per Mouse open to
// that case, times the Mouse in the band. The Fate option is left out: the
// guide's maximum is without it.

const BAND_WIDTH = { '7–10': 4, '3–6': 4, '2': 1 };
const CASES = [
  ['the Aunt', [api.CM_ELUSIVE, api.CM_MIRROR]], ['the Burglar', [api.CM_ELUSIVE, api.CM_MIRROR]],
  ['the Medium', [api.CM_ELUSIVE, api.CM_MIRROR]], ['the Officer', [api.CM_MAP]],
  ['the Clay Man', [api.CM_MAP]], ['the Astronomer', [api.CM_MAP]],
];

check('the guide\'s maximum Cat: 63 for every case, 67 for the Medium',
  CASES.map(([chase, storylets]) => [chase, 1 + Object.keys(BAND_WIDTH).reduce((sum, band) => {
    const rows = api.CM_OPTIONS.filter((e) => storylets.includes(e.storylet) && e.band === band
      && (!e.chase || e.chase === chase));
    return sum + BAND_WIDTH[band] * Math.max(...rows.map((e) => e.cat / (e.mouse || 1)));
  }, 0)]),
  [['the Aunt', 63], ['the Burglar', 63], ['the Medium', 67], ['the Officer', 63], ['the Clay Man', 63],
   ['the Astronomer', 63]]);

check('every case can start: one start row per chase',
  CASES.map(([chase]) => api.CM_OPTIONS.filter((e) => e.start && e.start.chase === chase).length),
  [1, 1, 1, 1, 1, 1]);

check('and every chase-only row names a case that exists',
  api.CM_OPTIONS.filter((e) => e.chase && !CASES.some(([c]) => c === e.chase)).map((e) => e.name), []);

// --- the pursuit options ---------------------------------------------------

check('the guide\'s Echo cost of every item line',
  api.CM_OPTIONS.filter((e) => e.band && e.echoes != null).map((e) => [e.storylet === api.CM_MAP ? 'map' : 'det', e.echoes]),
  [['det', 0.5], ['det', 1.6], ['det', 4.2], ['det', 2.5], ['det', 12.5],
   ['map', 0.5], ['map', 1.5], ['map', 1.5], ['map', 2.5], ['map', 12.5]]);

check('Luck lines are their expectation, marked as one',
  ['Early days: follow your nose', 'Time is passing: follow your nose', 'Last chance! – follow your nose',
   'Look at the ivory frame'].map((n) => api.cmBadgeText(row(n))),
  ['≈Cat +3.5', '≈Cat +5.6', '≈Cat +7', '≈Cat +8.1']);

check('the four options spending two Mouse say so',
  api.CM_OPTIONS.filter((e) => e.mouse === 2).map((e) => api.cmBadgeText(e)),
  ['Cat +10 Mouse −2 ▼', 'Cat +10 Mouse −2 ▼ · Favours: Society −1', 'Cat +10 Mouse −2 ▼', 'Cat +10 Mouse −2 ▼']);

check('a sure line: Cat, and what it uses up',
  [api.cmBadgeText(row('Time is passing: play it safe', api.CM_MAP)), api.cmColor(row('Time is passing: play it safe'))],
  ['Cat +8 ▼', api.CAROUSEL_COLOR_PROGRESS]);

check('the Fate line',
  api.cmBadgeText(row('Fate is on your side.')), 'Cat +40 · Fate 15');

check('a Luck tooltip says a failure spends the Mouse for nothing',
  api.cmSpec(row('Early days: follow your nose')).title.includes('30%: Mouse −1 for nothing. Expected: Cat +3.5.'), true);

// --- starting and ending ---------------------------------------------------

check('what starting each case says',
  api.CM_OPTIONS.filter((e) => e.start).map((e) => api.cmBadgeText(e)),
  ['Journals · 0.81 EPA ▼', 'Plaques · 1.19 EPA ▼', 'Light · 1.46 EPA ▼',
   'Left half? ▼', 'Right half? ▼', 'Right half · 1.61 EPA? ▼']);

check('the map-half searches are certain four levels up, and the guide is a level higher still',
  api.CM_OPTIONS.filter((e) => e.storylet === api.CM_SEARCH).map((e) => [api.cmCertainAt(e.ch), e.guide.ch]),
  [[5, 'Respectable 2, certain at 6'], [9, 'Dreaded 6, certain at 10'], [9, 'Bizarre 6, certain at 10']]);

check('every ending storylet has one 60+, at least one 50+ and one <50',
  api.CM_ENDINGS.map((s) => ['60+', '50+', '<50'].map((c) =>
    api.CM_OPTIONS.filter((e) => e.storylet === s && e.ending.cat === c).length)),
  [[1, 2, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]]);

check('ending badges: the Cat it needs, then what it pays',
  ['A notable success – the aunt herself!', 'Take the fee', 'Sternly shut'].map((n) => api.cmBadgeText(row(n))),
  ['60+ Journals + Jade', '50+ Jade ×1500', '<50 Plaques ×4']);

// --- guide versus page -----------------------------------------------------

check('the guide disagrees with the pages in exactly six rows',
  api.CM_OPTIONS.filter((e) => e.guide).map((e) => [e.name, Object.keys(e.guide)[0]]),
  [['Seek out the Disgruntled Naval Officer', 'ch'], ['Look for the Masked Clay Man', 'ch'],
   ['Hunt down the Enterprising Astronomer', 'ch'], ['Time is passing: play it safe', 'actions'],
   ['Look at the ivory frame', 'luck'], ['Time is passing: play it safe', 'actions']]);

check('and every such tooltip says the page is followed',
  api.CM_OPTIONS.filter((e) => e.guide && !/page (?:is followed|records 1 and is followed)/.test(api.cmSpec(e).title))
    .map((e) => e.name), []);

// --- looking one up --------------------------------------------------------

check('a title both pursuit storylets use resolves by the open one',
  [api.CM_ELUSIVE, api.CM_MAP, api.CM_DETECTIVE].map((s) => {
    const e = api.carouselLookup(api.CM_INDEX, 'Time is passing: play it safe', key(s));
    return e && e.uses;
  }),
  ['An Identity Uncovered! ×1', 'Partial Map ×1', null]);

check('the wiki\'s suffixed titles and the game\'s spellings are found',
  [['Early days: play it safe 2', api.CM_MAP], ['There he is! 2', 'Finding the Screaming Map: The Enterprising Astronomer'],
   ['Fate is on your side. (15 FATE)', api.CM_ELUSIVE], ['Last chance! - follow your nose', api.CM_ELUSIVE],
   ["You've found him!", 'Finding the Screaming Map: the Disgruntled Naval Officer']].map(([n, s]) => {
    const e = api.carouselLookup(api.CM_INDEX, n, key(s));
    return e && api.cmBadgeText(e);
  }),
  ['Cat +5 ▼', '50+ Right half', 'Cat +40 · Fate 15', '≈Cat +7', '50+ Left half']);

check('the storylet summaries',
  api.CM_STORYLETS.map((s) => { const spec = api.cmStoryletSpec(key(s)); return spec && spec.text; }),
  ['cases', 'map halves', 'Cat 50 by Mouse 1', 'Cat 50 by Mouse 1', null,
   'ending', 'ending', 'ending', 'ending', 'ending', 'ending']);

check('each summary lists every option of its storylet',
  api.CM_STORYLETS.filter((s) => s !== api.CM_MIRROR).map((s) => {
    const title = api.cmStoryletSpec(key(s)).title;
    return api.CM_OPTIONS.filter((e) => e.storylet === s && !title.includes(e.name)).length;
  }), Array(10).fill(0));

// --- the registered pass ---------------------------------------------------

check('switching pursuit storylets redraws the shared titles and drops the other case\'s',
  (() => {
    const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
    const safe = makeHeading('Time is passing: play it safe');
    const honey = makeHeading('Pursue the Aunt among honey-dealers');
    const officer = makeHeading('An Officer and a Nostalgic');
    branches = [safe, honey, officer];
    const out = [];
    roots = [makeHeading('Cat and Mouse: an Elusive Target')];
    api.cmRatings();
    out.push([text(roots[0], api.CM_CLASS), text(safe, api.CM_BRANCH_CLASS), text(honey, api.CM_BRANCH_CLASS),
      text(officer, api.CM_BRANCH_CLASS)]);
    roots = [makeHeading('Cat and Mouse: the Screaming Map')];
    api.cmRatings();
    out.push([text(safe, api.CM_BRANCH_CLASS), text(honey, api.CM_BRANCH_CLASS), text(officer, api.CM_BRANCH_CLASS)]);
    roots = [];
    api.cmRatings();
    out.push([text(safe, api.CM_BRANCH_CLASS)]);
    branches = [];
    return out;
  })(),
  [['Cat 50 by Mouse 1', 'Cat +8 ▼', 'Cat +10 Mouse −2 ▼', null], ['Cat +8 ▼', null, 'Cat +10 Mouse −2 ▼'], [null]]);

// --- no name in another table ----------------------------------------------

check('no Cat and Mouse name is in another feature\'s table',
  (() => {
    const others = [
      ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
      ...api.LAB_CARDS.map((c) => c.name), ...api.ARBOR_OPTIONS.map((e) => e.name),
      ...api.LBI_OPTIONS.map((e) => e.name), ...api.DME_OPTIONS.map((e) => e.name), ...api.VH_OPTIONS.map((e) => e.name),
      ...api.FQ_OPTIONS.map((e) => e.name), ...api.SOUP_OPTIONS.map((e) => e.name),
      ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']),
      ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
    ].map(key);
    return api.CM_OPTIONS.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'cat-and-mouse'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
