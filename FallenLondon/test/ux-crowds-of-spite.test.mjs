// Ad-hoc test for FallenLondon/ux-enhancers.js's Crowds of Spite card ratings.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// Four things are worth pinning, all of them places a plausible "improvement"
// would silently break the badge:
//
//  - Name matching is punctuation-insensitive. The wiki writes "A Constable!"
//    and "A... pickpocket?"; there is no guarantee the game's image alt text
//    punctuates them identically, so the lookup key squashes non-alphanumerics.
//    That squashing must not make two different cards collide.
//  - Every card in the table produces a badge, including the two that pay no
//    trophies at all (Watchful Eyes, the Rat-Catcher) -- those get a word and
//    a distinct colour rather than a nonsense "+null".
//  - The dagger appears on exactly the two inferior-skill-table cards.
//  - headingName() ignores badges hung inside the heading. wiki-links.js
//    appends its "W" anchor into the very same element; reading textContent
//    there yields "A drunkW", which matches no card.
//
// The card numbers come from The Crowds of Spite (Guide) on fallenlondon.wiki.
//
//   node FallenLondon/test/ux-crowds-of-spite.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------
// Just enough for the IIFE to load: an empty document, and the two globals the
// SPA dispatch touches at the end.

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
    nextElementSibling: null,
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
    after() { throw new Error('after() not exercised by these tests'); },
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  return el;
}

// Complete enough that the OTHER features can mount without throwing -- the
// launcher builds real nodes at load. (Its own behaviour is covered by
// ux-factions.test.mjs; here it just must not get in the way.)
// The screen-reader greeting FL puts on every page. `area` drives what
// currentArea() reads, so the gate can be exercised from here.
let area = 'Spite';
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
    'return { SPITE_CARDS, normalizeName, lookupSpiteCard, spiteBadgeSpec, headingName,'
    + ' attachBadge, makeBadge, RATING_COLORS, INFERIOR_MARK, BADGE_CLASS, SPITE_CLASS,'
    + ' SPITE_FLAG, FEATURES, currentArea, inCrowdsOfSpite }; })();');
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

// --- the table -------------------------------------------------------------

check('the guide lists seventeen cards', api.SPITE_CARDS.length, 17);

check('the ratings are the guide\'s bonus trophies',
  api.SPITE_CARDS.map((c) => [c.name, c.bonus]),
  [
    ['A drunk', 0],
    ['A mould-spangled curiosity shop', 1],
    ['A Street Performer', 1],
    ['An Argument', 1],
    ['Gaoler', 1],
    ['The Costermonger', 1],
    ['The Rat-Catcher', null],
    ['The Actress', 2],
    ['A Shopkeeper', 2],
    ['Watchful Eyes', null],
    ['A Constable!', 3],
    ['A Special Constable', 4],
    ['A... pickpocket?', 4],
    ['Jack!', 9],
    ['The Opera Singer', 6],
    ['The Novelist', 7],
    ['The Confidence Artist', 8],
  ]);

check('exactly the drunk and the shop use the inferior skill table',
  api.SPITE_CARDS.filter((c) => c.inferior).map((c) => c.name),
  ['A drunk', 'A mould-spangled curiosity shop']);

check('exactly the three late targets are AYD<5 only',
  api.SPITE_CARDS.filter((c) => c.early).map((c) => c.name),
  ['The Opera Singer', 'The Novelist', 'The Confidence Artist']);

check('every scored rating has a colour (the ramp covers +0..+9)',
  api.SPITE_CARDS.every((c) => typeof c.bonus !== 'number' || !!api.RATING_COLORS[c.bonus]), true);

// --- name matching ---------------------------------------------------------

check('punctuation and case don\'t matter',
  ['A Constable!', 'a constable', 'A CONSTABLE!!!'].map((n) => !!api.lookupSpiteCard(n)),
  [true, true, true]);

check('the ellipsis in "A... pickpocket?" is not load-bearing',
  api.lookupSpiteCard('A pickpocket').name, 'A... pickpocket?');

check('the hyphen in "The Rat-Catcher" is not load-bearing',
  api.lookupSpiteCard('the rat catcher').name, 'The Rat-Catcher');

check('surrounding whitespace is trimmed',
  api.lookupSpiteCard('  Jack!  ').bonus, 9);

check('squashing punctuation collides no two cards',
  new Set(api.SPITE_CARDS.map((c) => api.normalizeName(c.name))).size, api.SPITE_CARDS.length);

check('a card from anywhere else in London is not ours',
  api.lookupSpiteCard('A Stroll around the Hill'), null);

check('an empty or missing name is not ours',
  [api.lookupSpiteCard(''), api.lookupSpiteCard(null), api.lookupSpiteCard(undefined)],
  [null, null, null]);

// --- the badge -------------------------------------------------------------

check('a plain card shows its bonus',
  api.spiteBadgeSpec(api.lookupSpiteCard('The Actress')).text, '+2');

check('the best card in the area is +9 and gold',
  [api.spiteBadgeSpec(api.lookupSpiteCard('Jack!')).text,
   api.spiteBadgeSpec(api.lookupSpiteCard('Jack!')).color],
  ['+9', api.RATING_COLORS[9]]);

check('+0 still reads as +0, not as a blank',
  api.spiteBadgeSpec(api.lookupSpiteCard('A drunk')).text, '+0' + api.INFERIOR_MARK);

check('the dagger marks the inferior skill table and only that',
  api.SPITE_CARDS.filter((c) => api.spiteBadgeSpec(c).text.includes(api.INFERIOR_MARK))
    .map((c) => c.name),
  ['A drunk', 'A mould-spangled curiosity shop']);

check('the tooltip spells the inferior table out',
  /INFERIOR skill table/.test(api.spiteBadgeSpec(api.lookupSpiteCard('A drunk')).title), true);

check('a trophyless card gets a word, never "+null"',
  [api.spiteBadgeSpec(api.lookupSpiteCard('The Rat-Catcher')).text,
   api.spiteBadgeSpec(api.lookupSpiteCard('Watchful Eyes')).text],
  ['rats', 'AYD!']);

check('Watchful Eyes is coloured as the warning it is, not as a score',
  api.spiteBadgeSpec(api.lookupSpiteCard('Watchful Eyes')).color
    !== api.spiteBadgeSpec(api.lookupSpiteCard('The Rat-Catcher')).color, true);

check('every card produces a non-empty label and tooltip',
  api.SPITE_CARDS.every((c) => {
    const s = api.spiteBadgeSpec(c);
    return !!s.text && !!s.color && s.title.includes(c.name)
      && s.title.includes('Shadowy ' + c.shadowy);
  }), true);

// --- reading a name off a heading -----------------------------------------

function heading(text, ...badgeClasses) {
  const h = makeEl('h2');
  h.childNodes.push({ nodeType: 3, nodeValue: text });
  for (const cls of badgeClasses) {
    const b = makeEl('span');
    b.className = cls;
    b.textContent = cls === 'fl-wiki-link' ? 'W' : '+0';
    h.childNodes.push(b);
  }
  return h;
}

check('a bare heading reads as its text', api.headingName(heading('A drunk')), 'A drunk');

check('wiki-links.js\'s "W" is not part of the card name',
  api.headingName(heading('A drunk', 'fl-wiki-link')), 'A drunk');

// Every feature's badge carries the shared BADGE_CLASS, so a future feature's
// badge is skipped here too without headingName having to learn its name.
check('any of this script\'s own badges are skipped, whichever feature added them',
  api.headingName(heading('A drunk',
    api.BADGE_CLASS + ' ' + api.SPITE_CLASS,
    api.BADGE_CLASS + ' fl-ux-some-future-feature',
    'fl-wiki-link')),
  'A drunk');

// --- redrawing when React reuses the container -----------------------------

function rate(host, name) {
  const card = api.lookupSpiteCard(name);
  api.attachBadge(host, {
    cls: api.SPITE_CLASS,
    flag: api.SPITE_FLAG,
    value: name,
    spec: card ? api.spiteBadgeSpec(card) : null,
    place: 'append',
  });
}

const container = makeEl('div');
rate(container, 'A drunk');
check('a known card gets one badge', container.children.map((c) => c.textContent),
  ['+0' + api.INFERIOR_MARK]);

check('the badge carries both the shared class and the feature\'s own',
  container.children[0].className, api.BADGE_CLASS + ' ' + api.SPITE_CLASS);

rate(container, 'A drunk');
check('re-running the scan does not stack a second badge', container.children.length, 1);

// The trap: playing a card leaves React free to reuse this very node for the
// next one. A boolean "already done" flag would leave the drunk's +0 sitting on
// Jack's card, so the flag stores the name and a change redraws.
rate(container, 'Jack!');
check('the same container reused for another card is re-rated',
  container.children.map((c) => c.textContent), ['+9']);

rate(container, 'A Stroll around the Hill');
// The flag records whether a badge was DRAWN, not just which name was seen --
// '-' meaning "nothing to say here". A bare name would make the clearing path
// a no-op on a host already badged for that same name, which is exactly what
// the area gate does when you walk out mid-hand.
check('reused for a card outside the area, the stale badge is removed',
  [container.children.length, container.dataset[api.SPITE_FLAG]],
  [0, '-A Stroll around the Hill']);

// Two features decorating one element must not fight over a single flag.
const shared = makeEl('div');
rate(shared, 'Jack!');
api.attachBadge(shared, {
  cls: 'fl-ux-other', flag: 'flUxOther', value: 'Jack!', place: 'append',
  spec: { text: 'x', color: '#000', title: 'a second feature' },
});
check('a second feature\'s badge coexists with the first',
  shared.children.map((c) => c.textContent), ['+9', 'x']);

rate(shared, 'The Actress');
check('and re-rating one feature leaves the other\'s badge alone',
  shared.children.map((c) => c.textContent), ['x', '+2']);

// --- the area gate ---------------------------------------------------------
//
// The greeting reads "It's <name>! Welcome to The Crowds of Spite, delicious
// friend!" during a promenade -- confirmed in-game, which is what allows this
// to be an exact list rather than the permissive one it started as.

area = 'The Crowds of Spite';
check('the area comes out of the screen-reader greeting',
  api.currentArea(), 'The Crowds of Spite');

check('the promenade and its parent area are in',
  ['The Crowds of Spite', 'Spite'].map((a) => { area = a; return api.inCrowdsOfSpite(); }),
  [true, true]);

check('anywhere else in London is out',
  ['Veilgarden', 'The Flit', 'Wolfstack Docks', 'Mahogany Hall'].map((a) => {
    area = a; return api.inCrowdsOfSpite();
  }), [false, false, false, false]);

// "Area-Diving in Spite" is a real, separate Spite area in FL's own map menu.
// It is not the promenade, and matching on a bare "Spite" substring would have
// let it through -- which is why the check is an exact list, not a contains.
check('a different Spite area is not the promenade', (() => {
  area = 'Area-Diving in Spite'; return api.inCrowdsOfSpite();
})(), false);

// The gate used to allow anything it did not recognise, because only "Spite"
// was verified. It no longer does: the exact wording is known.
area = 'Some Zailing Port We Have Never Heard Of';
check('an unrecognised area no longer gets badges', api.inCrowdsOfSpite(), false);

// The one remaining fail-open. If FL renames the greeting block there is
// nothing to read, and losing the feature outright is worse than a stray badge
// -- the card table still scopes it.
area = null;
check('a page with no greeting at all still gets badges',
  [api.currentArea(), api.inCrowdsOfSpite()], [null, true]);

// A badge drawn in the promenade must come off when you leave, not linger.
area = 'The Crowds of Spite';
const gated = makeEl('div');
rate(gated, 'Jack!');
check('in the promenade the card is rated', gated.children.map((c) => c.textContent), ['+9']);
area = 'Veilgarden';
api.attachBadge(gated, {
  cls: api.SPITE_CLASS, flag: api.SPITE_FLAG, value: 'Jack!', spec: null, place: 'append',
});
check("out of the promenade the same card's badge is cleared", gated.children.length, 0);
area = 'The Crowds of Spite';

// --- the extension point ---------------------------------------------------

check('the card ratings are registered alongside the other features',
  api.FEATURES.map((f) => f.name),
  ['launcher', 'faction-capture', 'fotz-capture', 'pending-item',
    'spite-card-ratings', 'zee-card-ratings', 'fotz-card-ratings', 'fotz-supplication']);

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
