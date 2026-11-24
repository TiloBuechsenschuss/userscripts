// Ad-hoc test for FallenLondon/choice-helper.js's Fate-locked Candlefinder Canvassing in The Flit
// ('candlefinder-flit').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here:
//
//  - The table against the guide: six rows, one per picture, no titles yet, the Detecting...
//    amounts 6/4/4/6/6/8, no invented difficulty.
//  - The gate: the greeting is The Flit (captured verbatim 2026-11-24, split over lines) AND at
//    least two of these pictures are on screen. One alone badges nothing; an unlisted option does
//    not veto; the same pictures anywhere else badge nothing.
//  - Matching by picture until a title is filled in, then by title alone.
//  - No picture shared with Philosofruits or the Whisker-Ways, the other picture-matched features.
//
// Source: The Candlefinder Society (Guide), "Canvassing", fetched through the API on 2026-11-24.
//
//   node tests/choice-candlefinder-flit.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM (copied from choice-whisker-ways.test.mjs) -----------------
//
// It needs `closest()`, descendant `querySelector` and `after()`, since a
// picture is found by walking from a heading up to its branch and back down.

function matchesSimple(el, simple) {
  if (!el || el.nodeType !== 1) return false;
  const m = /^([a-z0-9]*)((?:[.#][\w-]+)*)$/i.exec(simple);
  if (!m) throw new Error('stub cannot parse selector: ' + simple);
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  const parts = m[2].match(/[.#][\w-]+/g) || [];
  return parts.every((p) => (p[0] === '#' ? el.id === p.slice(1)
    : String(el.className).split(/\s+/).includes(p.slice(1))));
}

function matches(el, sel) {
  return sel.split(',').some((one) => {
    const chain = one.trim().split(/\s+/);
    if (!matchesSimple(el, chain[chain.length - 1])) return false;
    let i = chain.length - 2;
    for (let a = el.parentNode; a && i >= 0; a = a.parentNode) {
      if (matchesSimple(a, chain[i])) i--;
    }
    return i < 0;
  });
}

function descendants(root) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) { out.push(c); walk(c); }
  })(root);
  return out;
}

function makeEl(tag, cls, attrs, kids) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    id: '',
    className: cls || '',
    title: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    attributes: Object.assign({}, attrs || {}),
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
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    querySelectorAll(sel) { return descendants(this).filter((d) => matches(d, sel)); },
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    closest(sel) {
      for (let a = this; a && a.nodeType === 1; a = a.parentNode) if (matches(a, sel)) return a;
      return null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  Object.defineProperty(el, 'textContent', {
    get() { return el.childNodes.map((n) => (n.nodeType === 3 ? n.nodeValue : n.textContent)).join(''); },
    set(v) { el.childNodes = [{ nodeType: 3, nodeValue: String(v) }]; el.children = []; },
  });
  (kids || []).forEach((k) => el.appendChild(typeof k === 'string' ? { nodeType: 3, nodeValue: k } : k));
  return el;
}

const body = makeEl('body');
const fakeDoc = {
  body,
  querySelectorAll: (sel) => body.querySelectorAll(sel),
  querySelector: (sel) => body.querySelector(sel),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }
const store = new Map();
const fakeStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
const noTimer = () => 0;

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CANDLEFINDER_FLIT_OPTIONS, CANDLEFINDER_FLIT_CLASS, CF_FLIT_MIN_MATCHES, candlefinderFlitSpec,'
    + ' candlefinderFlitRatings, cfFlitHere, cfFlitFind, phfImageKey, PHF_CARDS, WW_GENERATE, WW_REFINE,'
    + ' FEATURES, FEATURE_GROUPS }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'localStorage', 'setInterval', 'setTimeout', 'clearInterval', 'clearTimeout',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console,
  fakeStorage, noTimer, noTimer, () => {}, () => {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const ROWS = api.CANDLEFINDER_FLIT_OPTIONS;
const row = (k) => ROWS.find((r) => r.key === k);

// --- the table ------------------------------------------------------------------

check('six rows, one per picture the guide shows',
  ROWS.map((r) => r.key), ['valkyrie', 'stutteringurchin', 'urchinslingshot', 'doubleurchin', 'admiraltymedal', 'urchinblond']);
check('every key is already a picture key (the guide\'s File: names)',
  ROWS.filter((r) => api.phfImageKey(r.key) !== r.key).map((r) => r.key), []);
check('the guide\'s File: names reduce to these keys',
  ['Valkyrie.png', 'Stutteringurchin.png', 'Urchinslingshot.png', 'Doubleurchin.png', 'Admiraltymedal.png', 'Urchinblond.png']
    .map(api.phfImageKey), ROWS.map((r) => r.key));
check('no titles yet: the case is not owned', ROWS.filter((r) => r.title).length, 0);
check('Detecting... per row', ROWS.map((r) => r.progress), [6, 4, 4, 6, 6, 8]);
check('no difficulty invented: the guide records none',
  ROWS.filter((r) => r.ch).map((r) => r.ch.diff), [null, null, null, null]);
check('badge text', ROWS.map((r) => api.candlefinderFlitSpec(r).text),
  ['Detecting... +6 unconfirmed', 'Detecting... +4?', 'Detecting... +4?', 'Detecting... +6?', 'Detecting... +6?', 'Detecting... +8']);
check('the "?" mark is exactly the rows with a challenge',
  ROWS.map((r) => api.candlefinderFlitSpec(r).text.includes('?')), ROWS.map((r) => !!r.ch));
check('a challenge tooltip says the difficulty is not recorded',
  api.candlefinderFlitSpec(row('urchinslingshot')).title.includes('Persuasive (difficulty not recorded)'), true);
check('the tooltip quotes the title the game shows, to be copied in',
  api.candlefinderFlitSpec(row('doubleurchin'), 'Some urchin title').title.includes('The game shows “Some urchin title”'), true);
check('no picture shared with Philosofruits or the Whisker-Ways',
  (() => {
    const others = new Set(api.WW_GENERATE.concat(api.WW_REFINE).map((r) => r.key));
    api.PHF_CARDS.forEach((c) => { others.add(api.phfImageKey(c.image)); c.options.forEach((o) => others.add(api.phfImageKey(o.image))); });
    return [others.size > 30, others.has('treeblue'), others.has('crowd2'), ROWS.filter((r) => others.has(r.key)).map((r) => r.key)];
  })(), [true, true, true, []]);

// --- the greeting ---------------------------------------------------------------

function greetRaw(text) {
  body.children.filter((c) => c.id === 'accessible-sidebar').forEach((c) => c.remove());
  if (text == null) return;
  const side = makeEl('div', 'accessible-sidebar u-visually-hidden', {}, [makeEl('h1', 'welcome', {}, [text])]);
  side.id = 'accessible-sidebar';
  body.appendChild(side);
}
const greet = (area) => greetRaw(area == null ? null : "It's TheFairUnknown! Welcome to " + area + ', delicious friend!');

// Verbatim from the game, 2026-11-24: the sentence split over lines.
greetRaw("It's TheFairUnknown!\nWelcome to\n\nThe Flit,\n\ndelicious friend!");
check('greeting: the captured text, split over lines', api.cfFlitHere(), true);
greet('Flit');
check('greeting: without the article', api.cfFlitHere(), true);
greet('Spite');
check('greeting: Spite is not it', api.cfFlitHere(), false);
greet(null);
check('greeting: none read is not it', api.cfFlitHere(), false);

// --- wiring -----------------------------------------------------------------------

function storylet(name, image, options) {
  return makeEl('div', 'tab-content__bordered-container', {}, [
    makeEl('div', 'media media--root', {}, [
      makeEl('div', 'media__left', {}, [makeEl('img', '', { src: '//images.fallenlondon.com/icons/' + image + '.png' })]),
      makeEl('div', 'media__body', {}, [makeEl('h1', 'media__heading storylet-root__heading', {}, [name])]),
    ]),
  ].concat(options.map((o) => makeEl('div', 'media branch media--branch', {}, [
    makeEl('div', 'media__left branch__left', {}, [makeEl('div', 'small-card storylet__card', {}, [
      makeEl('img', 'media__object small-card__image',
        { alt: o[0], src: '//images.fallenlondon.com/icons/' + o[1] + '.png' })])]),
    makeEl('div', 'media__body branch__body', {}, [makeEl('div', '', {}, [
      makeEl('h2', 'media__heading heading heading--3 branch__title', {}, [o[0]]),
    ])]),
  ]))));
}
function stage(...nodes) {
  body.children.filter((c) => c.id !== 'accessible-sidebar').forEach((c) => c.remove());
  nodes.forEach((n) => body.appendChild(n));
}
const badges = () => body.querySelectorAll('.' + api.CANDLEFINDER_FLIT_CLASS).map((b) => b.textContent);

// Below Airs 70 with no orphan and no Detecting...: only the two ungated options are drawn.
const lowAirs = [['An urchin who stutters', 'stutteringurchin'], ['An urchin with a slingshot', 'urchinslingshot']];

greet('The Flit');
stage(storylet('Some Candlefinder storylet', 'candlefinder', lowAirs));
api.candlefinderFlitRatings();
check('the two ungated options, in The Flit: both badged', badges(), ['Detecting... +4?', 'Detecting... +4?']);
api.candlefinderFlitRatings();
check('a second pass draws nothing twice', badges().length, 2);

stage(storylet('Some Candlefinder storylet', 'candlefinder', lowAirs.concat([['Put the pieces together', 'jigsaw']])));
api.candlefinderFlitRatings();
check('an unlisted option (the closer) does not veto', badges(), ['Detecting... +4?', 'Detecting... +4?']);

stage(storylet('Urchin business', 'urchin', [['Talk to an urchin', 'stutteringurchin'], ['Buy a pie', 'pie']]));
api.candlefinderFlitRatings();
check('one matching picture alone badges nothing', badges(), []);

greet('Spite');
stage(storylet('Some Candlefinder storylet', 'candlefinder', lowAirs));
api.candlefinderFlitRatings();
check('the same pictures outside The Flit badge nothing', badges(), []);

greet(null);
api.candlefinderFlitRatings();
check('no greeting read badges nothing', badges(), []);

greet('The Flit');
stage(storylet('Some Candlefinder storylet', 'candlefinder', [
  ['A', 'valkyrie'], ['B', 'stutteringurchin'], ['C', 'urchinslingshot'], ['D', 'doubleurchin'],
  ['E', 'admiraltymedal'], ['F', 'urchinblond'], ['Put the pieces together', 'jigsaw']]));
api.candlefinderFlitRatings();
check('all six on screen, the closer unbadged', badges(),
  ['Detecting... +6 unconfirmed', 'Detecting... +4?', 'Detecting... +4?', 'Detecting... +6?', 'Detecting... +6?', 'Detecting... +8']);

// A filled-in title wins, and the titled row no longer matches by picture.
const sl = row('urchinslingshot');
sl.title = 'An urchin with a slingshot';
check('a titled row matches by its title', api.cfFlitFind('An urchin with a slingshot', 'whatever') === sl, true);
check('a titled row no longer matches by picture', api.cfFlitFind('Something else', 'urchinslingshot'), null);
sl.title = null;

// --- registration -------------------------------------------------------------

check('registered, right after candlefinder-canvassing',
  (() => { const at = (name) => api.FEATURES.findIndex((f) => f.name === name);
    return at('candlefinder-flit') - at('candlefinder-canvassing'); })(), 1);
check('filed under Airs of London', api.FEATURE_GROUPS['Airs of London'].includes('candlefinder-flit'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
