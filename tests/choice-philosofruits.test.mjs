// Ad-hoc test for FallenLondon/choice-helper.js's Philosofruits badges.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// What's worth pinning here:
//
//  - The table against the guide's own rules: every ordinary option raises one
//    of the five qualities by one; the three that raise none are the ones the
//    guide names; each conversion card is drawn at 3 of the flavour it spends.
//  - The guide's stated default (Broad 180, certain at 300) against
//    broadCertainAt, which derives it.
//  - Matching by PICTURE, the first feature that does: the key is the same for
//    the game's URL and the wiki's file name; a picture two options share is
//    told apart by the open card; an opened storylet that merely shares a
//    card's picture is not badged.
//  - That a TITLE, once filled in, wins: a card of another name with the same
//    picture is no longer badged, and the "not recorded yet" line goes.
//  - The gate in all three greeting states (the Wisp-Ways, elsewhere, none),
//    and that leaving clears the badges.
//
// Numbers come from Philosofruits (Guide) on fallenlondon.wiki.
//
//   node tests/choice-philosofruits.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------
//
// A small tree that answers the selectors this feature asks: a tag, `.class`,
// `#id`, `tag.class`, joined by descendant spaces and commas. Unlike the other
// suites it needs `closest()` and descendant `querySelector`, since a picture
// is found by walking from a heading up to its card or branch and back down.

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
    'return { PHF_CARDS, PHF_AREAS, PHF_QUALITIES, PHF_COLOR, PHF_COLOR_OTHER, PHF_COLOR_CARD,'
    + ' PHF_BROAD_DEFAULT, PHF_BROAD_CERTAIN, PHF_NARROW_DEFAULT, PHF_NARROW_CERTAIN, PHF_SKILLS,'
    + ' PHF_CLASS, PHF_FLAG, PHF_BRANCH_CLASS, PHF_BRANCH_FLAG, BADGE_CLASS,'
    + ' phfImageKey, phfDeltaText, phfOptionText, phfOptionSpec, phfCardSpec, phfFindCard, phfFindOption,'
    + ' phfHere, phfRatings, broadCertainAt, FEATURES, PANELS }; })();');
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

const card = (image) => api.PHF_CARDS.find((c) => c.image === image);
const allOptions = api.PHF_CARDS.flatMap((c) => c.options);
const delta = (o) => Object.keys(o.win).sort().map((k) => k + o.win[k]).join(' ');

// --- the table ---------------------------------------------------------------

check('13 cards, 24 options, as the guide\'s Cards table',
  [api.PHF_CARDS.length, allOptions.length], [13, 24]);

check('no two cards share a picture',
  new Set(api.PHF_CARDS.map((c) => api.phfImageKey(c.image))).size, 13);

// The wiki has no titles; these three were read off the game (a phone
// screenshot of the hand, 2026-10-07) and tied to their rows by the card art.
check('the card titles read off the game, on the rows whose art they show',
  api.PHF_CARDS.filter((c) => c.title).map((c) => c.image + ': ' + c.title),
  ['passerby: A Philosophy Close to Home', 'argument: A Meeting of Minds', 'jungle: The Deeper Wisp-Ways']);
check('no option title yet', allOptions.filter((o) => o.title).length, 0);

check('every challenge names a known stat and a number or the default',
  allOptions.filter((o) => o.ch && !(['Watchful', 'Shadowy', 'Dangerous', 'Persuasive'].concat(api.PHF_SKILLS)
    .includes(o.ch[0]) && (o.ch[1] === null || typeof o.ch[1] === 'number'))).map((o) => o.image), []);

// "Playing a card will let you raise one of these qualities by one level on
// success": every option does exactly that, bar the three conversions and the
// three the guide shows paying something else.
const plain = allOptions.filter((o) => Object.keys(o.win).length === 1 && Object.values(o.win)[0] === 1);
check('18 options raise exactly one quality by one',
  plain.length, 18);
check('per quality: Y 5, A 3, C 3, F 3, R 4',
  ['Y', 'A', 'C', 'F', 'R'].map((q) => plain.filter((o) => o.win[q]).length), [5, 3, 3, 3, 4]);
check('the three that raise none: cherries, the creepy hand, the cockatoo',
  allOptions.filter((o) => !Object.keys(o.win).length).map((o) => o.image),
  ['cherriessmall', 'creepyhandsmall', 'heartfruitsmall']);
check('the conversions trade 3 of a flavour for 3 Yield',
  allOptions.filter((o) => o.win.Y === 3).map(delta), ['C-3 Y3', 'A-3 Y3', 'F-3 Y3']);
check('each conversion card is drawn at 3 of the flavour it spends',
  ['drowned', 'spidertree', 'parrot'].map((i) => {
    const c = card(i);
    const q = Object.keys(c.drawn)[0];
    return c.drawn[q] === 3 && c.options[0].win[q] === -3;
  }), [true, true, true]);
check('the cockatoo is drawn at Yield 3+', card('elegaiccockatoo').drawn, { Y: 3 });
check('only the Shadowy option on the crowd clears the hand',
  allOptions.filter((o) => o.clears).map((o) => o.image + ':' + o.ch[0]), ['salon3small:Shadowy']);

check('the guide\'s broad default is certain at the level it states',
  api.broadCertainAt(api.PHF_BROAD_DEFAULT), api.PHF_BROAD_CERTAIN);
check('the narrow default and its certain level, as the guide states them',
  [api.PHF_NARROW_DEFAULT, api.PHF_NARROW_CERTAIN], [5, 10]);

// --- the badge -----------------------------------------------------------------

check('picture key: the game URL and the wiki file name agree',
  [api.phfImageKey('https://images.fallenlondon.com/cards/treeblue.png?v=3'), api.phfImageKey('Treeblue.png'),
    api.phfImageKey('treeblue')], ['treeblue', 'treeblue', 'treeblue']);
check('picture key: an icon\'s small variant is the icon',
  [api.phfImageKey('treesmall.png'), api.phfImageKey('/icons/tree.png')], ['tree', 'tree']);
check('picture key: nothing is nothing', [api.phfImageKey(null), api.phfImageKey('')], [null, null]);

check('delta text: Yield first, a count only above one',
  [api.phfDeltaText({ A: 1 }), api.phfDeltaText({ C: -3, Y: 3 }), api.phfDeltaText({})], ['+A', '+3Y −3C', '']);

check('card badges, as the hand shows them',
  ['treeblue', 'crowd2', 'mangrovecollege_interior', 'drowned', 'elegaiccockatoo', 'jungle']
    .map((i) => api.phfCardSpec(card(i), '').text),
  ['+A? / +R?', '+C? / +A? / +F? / +Y? · clears hand',
    'Nightmares −4? · Wounds +2 / +Y · Nightmares +2 / Solacefruit ×10?', '+3Y −3C', 'Wounds −2?', '+Y?']);

check('every option badge names its letter -- the text alone carries the claim',
  allOptions.filter((o) => {
    const t = api.phfOptionText(o);
    return Object.keys(o.win).some((q) => !t.includes(q));
  }).map((o) => o.image), []);

check('every option takes its letter\'s colour; the three that raise none, grey',
  allOptions.map((o) => api.phfOptionSpec(card('treeblue'), o, '', '').color === (
    o.win.Y > 0 ? api.PHF_COLOR.Y : Object.keys(o.win).length ? api.PHF_COLOR[Object.keys(o.win)[0]] : api.PHF_COLOR_OTHER))
    .every(Boolean), true);

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const palette = Object.values(api.PHF_COLOR).concat([api.PHF_COLOR_OTHER, api.PHF_COLOR_CARD]);
check('seven distinct colours', new Set(palette).size, 7);
check('white text reads on every one of them (contrast 4.5+)',
  palette.filter((c) => 1.05 / (lum(c) + 0.05) < 4.5), []);

const fistTip = api.phfOptionSpec(card('stick'), card('stick').options[0], '', '').title;
check('tooltip: a failure that moves a quality says so',
  fistTip.includes('Failure: Fruitful Curiosity +2.'), true);
check('tooltip: the guide\'s 150 is certain at 250',
  fistTip.includes('Broad Dangerous 150, certain at 250'), true);
check('tooltip: a "-" failure is not claimed to be nothing',
  api.phfOptionSpec(card('treeblue'), card('treeblue').options[1], '', '').title
    .includes('Failure: nothing the guide records.'), true);
check('tooltip: the "2" after a Skill is said to be a reading',
  api.phfOptionSpec(card('treeblue'), card('treeblue').options[0], '', '').title
    .includes('“Shapeling Arts 2”, read as the difficulty'), true);
check('tooltip: a Rot option says when Rot opens',
  api.phfOptionSpec(card('treeblue'), card('treeblue').options[1], '', '').title
    .includes('The Dream of the Hintershroom'), true);
check('tooltip: an untitled card quotes what the game shows, to copy in',
  api.phfCardSpec(card('treeblue'), 'A Lone Tree').title
    .includes('The game shows “A Lone Tree”: that is the title to copy into PHF_CARDS.'), true);
check('tooltip: a titled card has no such line',
  api.phfCardSpec(card('jungle'), 'The Deeper Wisp-Ways').title.includes('not recorded'), false);

// --- matching ------------------------------------------------------------------

check('a card by picture', api.phfFindCard('Anything', 'crowd2').card.image, 'crowd2');
check('an unknown picture is no card', api.phfFindCard('Anything', 'zzz'), null);
check('one picture on two cards: the open card decides',
  [delta(api.phfFindOption(card('passerby'), '', 'salon3')), delta(api.phfFindOption(card('crowd2'), '', 'salon3'))],
  ['F1', 'Y1']);

// --- the gate ------------------------------------------------------------------

function greet(area) {
  body.children.filter((c) => c.id === 'accessible-sidebar').forEach((c) => c.remove());
  if (area == null) return;
  const side = makeEl('div', 'accessible-sidebar u-visually-hidden', {}, [
    makeEl('h1', 'welcome', {}, ["It's TheFairUnknown! Welcome to " + area + ', delicious friend!']),
  ]);
  side.id = 'accessible-sidebar';
  body.appendChild(side);
}

greet('The Wisp-Ways');
check('greeting: the Wisp-Ways', api.phfHere(), true);
greet('Wisp-Ways');
check('greeting: without the article', api.phfHere(), true);
greet('Mangrove College');
check('greeting: the college outside is not it', api.phfHere(), false);
greet(null);
check('greeting: none read is not it', api.phfHere(), false);

// --- the whole pass over the page ----------------------------------------------

function handCard(alt, image) {
  return makeEl('div', 'hand__card-container', {}, [
    makeEl('div', 'hand__card', {}, [makeEl('img', 'hand__image', { alt, src: '//images.fallenlondon.com/cards/' + image + '.png' })]),
  ]);
}
function openCard(name, image, options) {
  return makeEl('div', 'media media--root', {}, [
    makeEl('div', 'media__left', {}, [makeEl('img', '', { src: '//images.fallenlondon.com/icons/' + image + '.png' })]),
    makeEl('div', 'media__body', {}, [makeEl('h1', 'media__heading storylet-root__heading', {}, [name])]),
    makeEl('div', 'storylet__branches', {}, options.map((o) => makeEl('div', 'media branch media--branch', {}, [
      makeEl('div', 'media__left branch__left', {}, [makeEl('img', '', { src: '//images.fallenlondon.com/icons/' + o[1] + '.png' })]),
      makeEl('div', 'media__body branch__body', {}, [makeEl('div', '', {}, [
        makeEl('h2', 'media__heading heading heading--3 branch__title', {}, [o[0]]),
      ])]),
    ]))),
  ]);
}
function stage(...nodes) {
  body.children.filter((c) => c.id !== 'accessible-sidebar').forEach((c) => c.remove());
  nodes.forEach((n) => body.appendChild(n));
}
const badges = (cls) => body.querySelectorAll('.' + cls).map((b) => b.textContent);

greet('The Wisp-Ways');
stage(handCard('A Philosophical Tree', 'treeblue'), handCard('A Crowd', 'crowd2'), handCard('Something Else', 'zzz'));
api.phfRatings();
check('hand: the two known pictures are badged, the third is not',
  badges(api.PHF_CLASS), ['+A? / +R?', '+C? / +A? / +F? / +Y? · clears hand']);
api.phfRatings();
check('hand: a second pass draws nothing twice', badges(api.PHF_CLASS).length, 2);
greet('Mangrove College');
api.phfRatings();
check('hand: leaving the Wisp-Ways clears them', badges(api.PHF_CLASS), []);

greet('The Wisp-Ways');
stage(openCard('An Overgrown Courtyard', 'mangrovecollege_interior',
  [['Taste the fruit', 'cherriessmall'], ['Gather windfalls', 'applegallssmall'], ['Reach into the hollow', 'creepyhandsmall']]));
api.phfRatings();
check('opened card: the card and its three options',
  [badges(api.PHF_CLASS), badges(api.PHF_BRANCH_CLASS)],
  [['Nightmares −4? · Wounds +2 / +Y · Nightmares +2 / Solacefruit ×10?'],
    ['Nightmares −4? · Wounds +2', '+Y · Nightmares +2', 'Solacefruit ×10?']]);
check('opened card: an option\'s tooltip quotes the title the game shows',
  body.querySelector('.' + api.PHF_BRANCH_CLASS).title.includes('The game shows “Taste the fruit”'), true);

stage(openCard('Harvest the Fruit', 'mangrovecollege_interior',
  [['Harvest', 'cherriessmall'], ['Harvest the rot', 'someothersmall']]));
api.phfRatings();
check('opened storylet with the card\'s picture but not its options: nothing',
  [badges(api.PHF_CLASS), badges(api.PHF_BRANCH_CLASS)], [[], []]);

stage(openCard('A Philosophy Close to Home', 'passerby', [['Talk', 'salon3small'], ['Look', 'ring_brokensmall']]));
api.phfRatings();
check('opened card: the shared picture reads as this card\'s option', badges(api.PHF_BRANCH_CLASS), ['+F?', '+R?']);
stage(openCard('A Crowd', 'crowd2', [['A', 'uttershroom_portsmall'], ['B', 'spidertreesmall'], ['C', 'servantsmall'],
  ['D', 'salon3small']]));
api.phfRatings();
check('opened card: and as the other card\'s on the other card',
  badges(api.PHF_BRANCH_CLASS), ['+C?', '+A?', '+F?', '+Y? · clears hand']);

// --- the hand from the screenshot -------------------------------------------------
//
// The phone (compact) layout, as captured 2026-10-07: three titled cards. They
// are badged by title, so a picture the stub does not even carry is no matter.

function smallCard(name) {
  return makeEl('div', 'small-card-container', {}, [
    makeEl('div', 'small-card__body', {}, [makeEl('h2', 'media__heading heading heading--3', {}, [name])]),
  ]);
}
greet('The Wisp-Ways');
stage(makeEl('div', 'hand', {}, [smallCard('A Philosophy Close to Home'), smallCard('A Meeting of Minds'),
  smallCard('The Deeper Wisp-Ways')]));
api.phfRatings();
check('screenshot hand: all three badged by title',
  badges(api.PHF_CLASS), ['+F? / +R?', '+C? / +A? / +F? / +R?', '+Y?']);
greet('Mangrove College');
api.phfRatings();
check('screenshot hand: still only under the Wisp-Ways greeting', badges(api.PHF_CLASS), []);
greet('The Wisp-Ways');

// --- a title filled in -----------------------------------------------------------

card('treeblue').title = 'The Tree of Philosophies';
stage(handCard('The Tree of Philosophies', 'somethingelse'), handCard('An Oak', 'treeblue'));
api.phfRatings();
check('titled: matched by its title whatever the picture, and its picture alone no longer counts',
  badges(api.PHF_CLASS), ['+A? / +R?']);
check('titled: no "not recorded" line',
  body.querySelector('.' + api.PHF_CLASS).title.includes('not recorded'), false);
card('treeblue').title = null;

// --- registration ----------------------------------------------------------------

check('registered once, with no panel',
  [api.FEATURES.filter((f) => f.name === 'philosofruits').length, api.PANELS.some((p) => /philosofruit/.test(p.id))],
  [1, false]);

console.log(failures ? failures + ' FAILED' : 'All passed');
process.exitCode = failures ? 1 : 0;
