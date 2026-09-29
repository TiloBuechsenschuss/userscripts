// Ad-hoc test for FallenLondon/choice-helper.js's Stacks badges ('the-stacks').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 56 card options, 8 books and 8 finale options; that every progress
// figure is one the option pages give (5, 10 or 15); that the eight options whose failure adds
// Noises in the Library 6 say so IN THE BADGE and take the risk colour; the marks ("?" for a stat
// check, "≈" for a Luck challenge at its odds, the spent-resource mark); the book chooser against
// the finales (the guide's Echo and Stuiver totals for a book must equal what its finale option
// carries); the wiring, which is keyed by the OPEN CARD because the option names are ordinary
// phrases ("Take the opposite door", "Move on quickly", "Keep going"); the two wiki titles of the
// Chained Volume; and that no card title of ours is a quoted string anywhere else in the file.
//
// Numbers come from the guide's card tables and the card, option and storylet pages on
// fallenlondon.wiki, fetched through the API on 2026-09-29 -- see
// docs/superpowers/research/2026-09-29-the-stacks.md.
//
//   node tests/choice-the-stacks.test.mjs

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
    'return { STACKS_OPTIONS, STACKS_BOOKS, STACKS_FINALES, STACKS_ALL, STACKS_STORYLETS, stacksSpec, stacksCardSpec,'
    + ' stacksRatings, STACKS_CLASS, STACKS_BRANCH_CLASS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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

const cards = api.STACKS_OPTIONS;
const all = api.STACKS_ALL;
const find = (storylet, name) => all.find((e) => e.storylet === storylet && e.name === name);
const spec = (storylet, name) => api.stacksSpec(find(storylet, name));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function badgeText(cardTitle, optionTitle) {
  const head = makeHeading(optionTitle);
  branches = [head];
  roots = [makeHeading(cardTitle)];
  api.stacksRatings();
  const out = text(head, api.STACKS_BRANCH_CLASS);
  roots = []; branches = [];
  return out;
}

// --- shape ------------------------------------------------------------------------------------------------------

check('56 card options, 8 books, 8 finale options', [cards.length, api.STACKS_BOOKS.length, api.STACKS_FINALES.length], [56, 8, 8]);
check('29 headings carry the feature', api.STACKS_STORYLETS.length, 29);
check('no (storylet, option) pair is listed twice',
  all.map((e) => api.normalizeName(e.storylet) + '|' + api.normalizeName(e.name)).filter((k, i, a) => a.indexOf(k) !== i), []);
check('every progress figure is one the option pages give: 5, 10 or 15',
  [...new Set(cards.filter((e) => e.p != null).map((e) => e.p))].sort((a, b) => a - b), [5, 10, 15]);
check('an option is either progress, a gain or a label, never two',
  cards.filter((e) => [e.p != null, Boolean(e.gain), Boolean(e.label)].filter(Boolean).length !== 1).map((e) => e.name), []);
check('the two stage-only markers are 1 or 2, and the four stage-1 and five stage-2 options are the ones the pages restrict',
  [cards.filter((e) => e.only === 1).map((e) => e.name), cards.filter((e) => e.only === 2).map((e) => e.name)],
  [['Course correct', 'Search for a reference card', 'Try to understand the organisation of the library', 'Situate yourself within the greater whole'],
    ['Pick through the drawers', 'Take the opposite door', 'Unlock the cart', 'Rethink your movements', 'Reject the significance of shape']]);

// --- the badge -----------------------------------------------------------------------------------------------------

check('a plain progress option says only its progress',
  [spec('A Locked Gate', 'Use a key').text, spec('A Glimpse through a Window', 'Move on quickly').text, spec('A Librarian’s Office', 'Take the opposite door').text],
  ['P +15 ▼ Key', 'P +5', 'P +5']);
check('a stat check quotes the success value and marks it "?"; a Luck challenge quotes the expected progress and marks it "≈"',
  [spec('A Black Gallery', 'Light a lantern').text, spec('A Grand Staircase', 'Go up').text, spec('A Stone Gallery', 'Make your way through the silent gallery').text],
  ['P +5? · fail N +2', 'P +3≈ · fail N +2', 'P +5 · fail Nightmares +2']);
check('an option that pays no progress says what it pays',
  [spec('A Dead End?', 'Take advantage of the vantage point').text, spec('A Gaoler-Librarian', 'Try to lift one of its keys').text,
    spec('A Terrible Shushing', 'Find a hiding place').text],
  ['Routes +2 · TP ×50?', 'Key +1? · fail N +6', 'N −3?']);
check('a spent resource carries the spent mark and its name',
  [spec('A God’s Eye View', 'Focus on the path ahead').text, spec('A Tea Room?', 'Consult your maps of the library').text,
    spec('The Shape of the Labyrinth', 'Rethink your movements').text],
  ['P +15 ▼ Ont', 'P +10 ▼ Route?', 'P +10 ▼ Routes']);
check('what an option always adds comes before the risk (Hurry along: Noises +2, +4 on a failure)',
  spec('A Terrible Shushing', 'Hurry along').text, 'P +5? · N +2 · fail N +4');
const noises6 = cards.filter((e) => e.risk && /N \+6/.test(e.risk));
check('the eight options whose failure adds Noises +6 say so in the badge and take the risk colour',
  noises6.map((e) => [e.name, api.stacksSpec(e).text.includes('N +6'), api.stacksSpec(e).color === api.stacksSpec(noises6[0]).color]),
  [['Continue on the same heading', true, true], ['Climb', true, true], ['Use furniture as stepping stones', true, true],
    ['Follow a borehole through the back of a bookcase', true, true], ['Keep going', true, true], ['Try to lift one of its keys', true, true],
    ['Distract the volumes', true, true], ['Do not read the titles', true, true]]);
check('no other card option takes the risk colour',
  cards.filter((e) => api.stacksSpec(e).color === api.stacksSpec(noises6[0]).color).length, 8);
check('every option that adds or risks Noises states the autofire in words and that the script cannot read it',
  cards.filter((e) => (e.risk && /N /.test(e.risk)) || (e.also && /N /.test(e.also)))
    .every((e) => api.stacksSpec(e).title.includes('WE WILL HAVE SILENCE') && api.stacksSpec(e).title.includes('cannot read Noises')), true);
check('an option with no Noises does not carry the autofire note',
  api.stacksSpec(find('A Locked Gate', 'Use a key')).title.includes('WE WILL HAVE SILENCE'), false);
check('a "?" the page itself marks stays a "?" in the text, never a number',
  [spec('A Flowering Gallery', 'Keep going').text, spec('A Gaoler-Librarian', 'Hide and hope it passes you by').text, spec('A Dead End?', 'Make a lot of noise').text],
  ['P +5? · fail Nightmares +? · N +6', 'no reward? · fail Wounds +4? · N +1', 'N +4? · Routes · Apostate']);
check('Fate and Apostate options say so in the badge and their requirement in the tooltip, and none is left out',
  [spec('A Dead End?', 'See through the Cartographer’s eyes'), spec('A Terrible Shushing', 'Quiet the Cartographer'), spec('A Gallery of Faces', 'Sneak through the gallery'),
    spec('An Atrium', 'Open a black door')].map((s) => [s.text.includes('Fate') || s.text.includes('Apostate'),
    s.title.includes('Clamorous Cartographer') || s.title.includes('Graven Apostate')]),
  [[true, true], [true, true], [true, true], [true, true]]);
check('a Luck option\'s tooltip says its odds and that the badge quotes the expected value',
  spec('A Grand Staircase', 'Go up').title.includes('A Luck challenge at 50%: the badge quotes the expected progress.'), true);
check('a stat check\'s tooltip says the difficulty is the player\'s business and gives the page\'s bonus',
  spec('An Atrium', 'Continue on the same heading').title.includes('Broad Watchful 220 (each Inerrant and each Route adds 15)'), true);
check('an option locked by an item or a quality names it in words',
  [spec('A Poison-Gallery', 'Prepare an antidote').title.includes('1 Flask of Abominable Salts'),
    spec('A Map Room', 'Paint new routes upon maps of the library').title.includes('Palette of Revealing Pigments'),
    spec('A Grand Staircase', 'Go down').title.includes('no Route in hand'),
    spec('A Stone Gallery', 'Follow a borehole through the back of a bookcase').title.includes('Hour of Dim Pale Moonlight')],
  [true, true, true, true]);

// --- the books and the finales: the chooser against what its finale carries ---------------------------------------

const book = (code) => api.STACKS_BOOKS.find((b) => b.code === code);
const fin = (name) => api.STACKS_FINALES.find((f) => f.name === name);
check('the guide\'s totals for a book equal the totals its finale option carries',
  [[201, 'Walk in'], [203, 'Help those you can'], [203, 'Grab whatever you can carry'], [205, 'Explore while you can'],
    [206, 'Approach the monument'], [206, 'Approach the monument once more']]
    .map(([c, n]) => [book(c).est, fin(n).est.split(' · ')[0]]).filter(([a, b]) => a !== b), []);
check('the Annal\'s two finales together are its chooser row (113.5 or 100 E; s2240 or s2000)',
  [book(202).est, fin('Return with one of the carcasses').est, fin('Return with the lighthouse-keeper’s ledgers and charts').est],
  ['≈113.5 E or ≈100 E', '≈113.5 E · s2240', '≈100 E · s2000']);
check('a book\'s badge is its Echo and Stuiver totals, and its tooltip labels them the guide\'s estimate and says what it needs',
  [spec('A Card Catalogue', 'Look for a copy of the Index of Banned Works, 1899 Edition').text,
    spec('A Card Catalogue', 'Look for a copy of The Book of Proper Speech').title.includes('Firmament 365'),
    spec('A Card Catalogue', 'Look for a copy of The Book of Proper Speech').title.includes('need Risen Burgundy to sell'),
    spec('A Card Catalogue', 'Look for a copy of A Codex of Unreal Places').title.includes('A Fate option'),
    spec('A Card Catalogue', 'Look for the Liber Animarum').text],
  ['≈116 E · s2320', true, true, true, '≈75 E (+ up to 312.5 E to sell your soul again)']);
check('every book says it is the guide\'s estimate, not a page fact',
  api.STACKS_BOOKS.every((b) => api.stacksSpec(b).title.includes('its estimate, not a page fact')), true);
check('the eight books are 201-207 and the Liber Animarum (99), 204 the Fate one and 206 the Apostate one',
  [api.STACKS_BOOKS.map((b) => b.code), book(204).fate, book(206).apostate], [[201, 202, 203, 204, 205, 206, 207, 99], true, true]);
check('the Unchain it option says it always adds Noises 5-8 and asks Noises below 7',
  [spec('A Chained Volume', 'Unchain it').text, spec('A Chained Volume', 'Unchain it').title.includes('Noises below 7')],
  ['Glimpse of Anathema ≈312.5 E · s6250 ▼ Key · N +5–8', true]);

// --- wiring: the card is the gate and the key ------------------------------------------------------------------------

check('an option is badged while its own card is open',
  badgeText('A Librarian’s Office', 'Take the opposite door'), 'P +5');
check('an ordinary phrase is badged under its own card only',
  [badgeText('A Map Room', 'Take the opposite door'), badgeText('A Librarian’s Office', 'Take the opposite door'),
    badgeText('A Glimpse through a Window', 'Move on quickly'), badgeText('A Tea Room?', 'Move on quickly')],
  [null, 'P +5', 'P +5', null]);
check('the game\'s straight apostrophe matches the table\'s curly one, in the card and in the option',
  [badgeText('A Librarian\'s Office', 'Pick through the drawers'), badgeText('A God\'s Eye View', 'Focus on the path ahead'),
    badgeText('A Solonacean Gallery', 'Don\'t go anywhere')],
  ['TP ×40 · Key, Route or Ont≈', 'P +15 ▼ Ont', 'P +15 ▼ Routes · the hour re-rolled · Apostate']);
check('a "Take a moment to regroup" on another card is not badged (Seven of Loins has its own row for it)',
  [badgeText('A Tea Room?', 'Take a moment to regroup'), badgeText('Seven of Loins: Reflection', 'Take a moment to regroup')],
  ['N −1 · Nightmares −1 · Wounds −1', null]);
check('the wiki\'s disambiguated card headings still match: (Apocrypha Found), Poison-Gallery in either case',
  [badgeText('(Apocrypha Found)', 'Claim the book'), badgeText('A poison-gallery', 'Prepare an antidote'), badgeText('A Poison-Gallery', 'Prepare an antidote')],
  ['ends stage 1: claim the book', 'P +5 ▼ Flask? · fail Wounds +2 · N +1', 'P +5 ▼ Flask? · fail Wounds +2 · N +1']);
check('both wiki titles of the Chained Volume gate its option',
  ['A Chained Volume', 'A Chained Volume (First time)', 'A Chained Volume (Repeated)'].map((h) => badgeText(h, 'Unchain it')),
  ['Glimpse of Anathema ≈312.5 E · s6250 ▼ Key · N +5–8', 'Glimpse of Anathema ≈312.5 E · s6250 ▼ Key · N +5–8', 'Glimpse of Anathema ≈312.5 E · s6250 ▼ Key · N +5–8']);
check('the Annal\'s "(no Shepherd)" title is matched as well',
  [badgeText('A Card Catalogue', 'Look for a copy of the Annal of Lost Stars'), badgeText('A Card Catalogue', 'Look for a copy of the Annal of Lost Stars (no Shepherd)')],
  ['≈113.5 E or ≈100 E · s2240 or s2000', '≈113.5 E or ≈100 E · s2240 or s2000']);
check('nothing is badged while some other storylet is open', badgeText('Some Other Storylet', 'Use a key'), null);
check('every option, book and finale is reachable through the wiring, not only through its spec',
  all.filter((e) => badgeText(e.storylet, e.name) === null).map((e) => e.name), []);
check('an open card\'s heading is labelled with its options; the chooser says what a book differs in',
  [text((() => { const h = makeHeading('A Locked Gate'); roots = [h]; branches = []; api.stacksRatings(); roots = []; return h; })(), api.STACKS_CLASS),
    text((() => { const h = makeHeading('A Card Catalogue'); roots = [h]; branches = []; api.stacksRatings(); roots = []; return h; })(), api.STACKS_CLASS),
    api.stacksCardSpec(api.normalizeName('A Locked Gate')).title.includes('Use a key: P +15 ▼ Key')],
  ['The Stacks: 1 option', 'Choose a book', true]);
check('a heading that is not one of ours gets no label',
  (() => { const h = makeHeading('An Unrelated Storylet'); roots = [h]; api.stacksRatings(); roots = []; return text(h, api.STACKS_CLASS); })(), null);
check('colour is never the only carrier: every text says what it means without it', all.every((e) => api.stacksSpec(e).text.length > 3), true);

// --- no card title of ours is a quoted string elsewhere ------------------------------------------------------------

const START = '// === feature: The Stacks';
const END = '// === feature: The Marrow Behind';
const a = src.indexOf(START);
const b = src.indexOf(END);
const outside = src.slice(0, a) + src.slice(b);
const quoted = (name) => [name, name.replace(/’/g, '\'')].some((n) => outside.includes('\'' + n.replace(/'/g, '\\\'') + '\'')
  || outside.includes('"' + n + '"'));
check('no card or finale title of the Stacks is a quoted string anywhere else in the file',
  api.STACKS_STORYLETS.filter(quoted), []);
check('no book title of the Stacks is a quoted string anywhere else in the file', api.STACKS_BOOKS.map((x) => x.name).filter(quoted), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'the-stacks'), true);
check('the feature has its own badge class and dataset flag, unique in the file',
  [api.STACKS_CLASS, api.STACKS_BRANCH_CLASS].map((c) => src.split('\'' + c + '\'').length - 1), [1, 1]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
