// Ad-hoc test for FallenLondon/choice-helper.js's Sixth Coil badges
// ('sixth-coil').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here is the thing that makes this feature different
// from every other carousel: BOTH the storylet headings and the option titles
// are randomised, so the suite rebuilds every title the four randomiser
// qualities can produce -- verb x direction x passage, on all 35 rooms -- and
// asserts each one resolves to exactly ONE row. A wildcarded verb would make
// "Sneak north through a bent trail" and "Slip through a cracked mirror" the
// same pattern, `carouselLookup` would answer nothing, and no badge would
// appear at all; that failure is invisible without this sweep.
//
// Then: the sealed door being the only action that pays Patrolling without
// Coiling, the Unburdened arithmetic a Burden costs you, and the badges.
//
// Numbers come from Patrolling The Sixth Coil (Guide) and the four floor
// storylets and their option pages on fallenlondon.wiki, fetched through the
// API on 2026-09-16.
//
//   node FallenLondon/test/choice-sixth-coil.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { SIXTH_FLOORS, SIXTH_ROOMS, SIXTH_STORYLETS, SIXTH_MIRROR_VERBS, SIXTH_EXITS, SIXTH_INDEX,'
    + ' SIXTH_CAP, SIXTH_BURDEN_COST, SIXTH_UNBURDENED_START, SIXTH_UNBURDENED_PER_ATTRIBUTE,'
    + ' SIXTH_CLASS, SIXTH_BRANCH_CLASS, sixthBadgeText, sixthSpec, sixthStoryletSpec, sixthRatings,'
    + ' carouselLookup, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
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
const rows = api.SIXTH_ROOM_OPTIONS;
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

// The words the randomiser qualities can put into a title. Directions come
// from Sixth Coil: Directions/Tables, passages from each option's own page.
const DIRECTIONS = ['northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north'];
const PASSAGES = {
  Workshop: ['a telescope', 'a peephole', 'a mullioned window', 'a porthole'],
  Warzone: ['a gap in the barbed wire', 'cover', 'a foxhole', 'a muddy trench', 'a break in the rubble'],
  Mansion: ['a gilded door', 'a mahogany door', 'a jewelled door', 'a concealed door',
    'a door covered in feathers', 'a sliding door'],
  Jungle: ['a gap in the underbrush', 'a bent trail', 'a tree hollow', 'a steep ditch'],
};
const MIRRORS = ['a black mirror', 'a brass mirror', 'a hand mirror', 'a gold-framed mirror',
  'a cracked mirror', 'a bronze mirror'];

function titlesFor(floor) {
  const out = [];
  const joiner = floor.floor === 'Workshop' ? 'into' : 'through';
  for (const verb of floor.verbs) {
    for (const dir of DIRECTIONS) {
      for (const passage of PASSAGES[floor.floor]) out.push(verb + ' ' + dir + ' ' + joiner + ' ' + passage);
    }
  }
  for (const verb of api.SIXTH_MIRROR_VERBS) {
    for (const mirror of MIRRORS) out.push(verb + ' through ' + mirror);
  }
  for (const dir of DIRECTIONS) {
    out.push('Pass ' + dir + ' through a gaping maw', 'Remember a passage ' + dir,
      'Examine a sealed door to the ' + dir);
  }
  for (const passage of PASSAGES[floor.floor]) {
    out.push('Climb up ' + passage, 'Descend into ' + passage);
  }
  out.push('Resolve to leave this place', 'Shed your burdens', 'Escape the labyrinth', floor.pickUp);
  return out;
}

check('four floors, 35 rooms between them, and two storylets besides',
  [api.SIXTH_FLOORS.length, api.SIXTH_ROOMS.length, api.SIXTH_STORYLETS.length],
  [4, 35, 37]);

check('each floor has its own attribute and Burden',
  api.SIXTH_FLOORS.map((f) => [f.floor, f.attribute, f.burden]),
  [['Workshop', 'Watchful', 'Predatory Clarity'], ['Warzone', 'Dangerous', 'Heavy Iron'],
    ['Mansion', 'Persuasive', 'Velvet Countenance'], ['Jungle', 'Shadowy', 'Clinging Shadow']]);

// The sweep. Every title the randomisers can build, in every room, must match
// exactly one row -- `carouselLookup` returns null both when nothing matches
// and when two rows do, and either way the option goes unbadged.
check('every randomised title in every room resolves to exactly one row',
  (() => {
    const bad = [];
    let seen = 0;
    for (const floor of api.SIXTH_FLOORS) {
      const titles = titlesFor(floor);
      for (const room of floor.rooms) {
        for (const title of titles) {
          seen++;
          if (!api.carouselLookup(api.SIXTH_INDEX, title, key(room))) bad.push(room + ' | ' + title);
        }
      }
    }
    return [bad.slice(0, 5), seen > 3000];
  })(), [[], true]);

check('no mirror verb is also a floor\'s wandering verb',
  api.SIXTH_FLOORS.flatMap((f) => f.verbs).filter((v) => api.SIXTH_MIRROR_VERBS.includes(v)), []);

// The guide's own arithmetic for when to leave: an ordinary action adds 1 to
// both qualities, so the sealed door -- 2 Patrolling and no Coiling -- is
// worth twice one, and it is the only option like that.
check('the sealed door and the four Burdens are what pay Patrolling without Coiling, '
  + 'and only the door pays two',
  [[...new Set(rows.filter((e) => e.patrol && !e.coil).map((e) => e.name))],
    [...new Set(rows.filter((e) => e.patrol === 2).map((e) => e.name))]],
  [['Pick up the ornate magnifying glass', 'Examine a sealed door to the (direction)',
    'Pick up an ornate revolver', 'Take the ornate mask', 'Pick up a beautiful cloak'],
  ['Examine a sealed door to the (direction)']]);

check('a Burden costs three levels of Unburdened, worth 60 points of every attribute',
  [api.SIXTH_BURDEN_COST * api.SIXTH_UNBURDENED_PER_ATTRIBUTE,
    api.SIXTH_UNBURDENED_START * api.SIXTH_UNBURDENED_PER_ATTRIBUTE],
  [60, 240]);

check('four exit payouts, one per Burden, each with its own menace',
  api.SIXTH_EXITS.filter((e) => e.kind === 'payout').map((e) => [e.burden, e.menace]),
  [['Predatory Clarity', 'Nightmares'], ['Clinging Shadow', 'Suspicion'], ['Heavy Iron', 'Wounds'],
    ['Velvet Countenance', 'Scandal']]);

check('an exit payout\'s tooltip works its figure out at the cap of ' + api.SIXTH_CAP,
  api.sixthSpec(row('Remember your scars')).title.includes('×80 at the cap of 40'), true);

check('badges', [['Gaze (somewhere) into (the workshop)', 'Optical Gallery'],
  ['Examine a sealed door to the (direction)', 'Muddy Trench'],
  ['Pick up an ornate revolver', 'Muddy Trench'], ['Remember your scars'],
  ['Resolve to leave this place', 'Hedge Maze'], ['Shed your burdens', 'Hedge Maze']]
  .map(([n, s]) => api.sixthBadgeText(row(n, s))),
  ['Patrol +1 Coil +1 · Watchful 250?', 'Patrol +2', '+Heavy Iron · Unburdened −3',
    'Journals ×2 Shrieks ×10 per Patrol · Wounds +1', 'start leaving?', 'drops every Burden ▼']);

check('a room heading names its floor, its attribute and its Burden',
  ['Muddy Trench', 'Circular Observatory', 'Exiting the Sixth Coil', 'Entering the Sixth Coil']
    .map((s) => api.sixthStoryletSpec(key(s)).text),
  ['Warzone · Dangerous · Heavy Iron', 'Workshop · Watchful · Predatory Clarity',
    'cash in the Burdens', 'the way in']);

check('the registered pass',
  (() => {
    const wander = makeHeading('Scry south into a porthole');
    const scars = makeHeading('Remember your scars');
    branches = [wander, scars];
    roots = [makeHeading('Ink Repository')];
    api.sixthRatings();
    const out = [text(roots[0], api.SIXTH_CLASS), text(wander, api.SIXTH_BRANCH_CLASS),
      text(scars, api.SIXTH_BRANCH_CLASS)];
    roots = [makeHeading('Exiting the Sixth Coil')];
    api.sixthRatings();
    out.push(text(roots[0], api.SIXTH_CLASS), text(wander, api.SIXTH_BRANCH_CLASS),
      text(scars, api.SIXTH_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Workshop · Watchful · Predatory Clarity', 'Patrol +1 Coil +1 · Watchful 250?', null,
    'cash in the Burdens', null, 'Journals ×2 Shrieks ×10 per Patrol · Wounds +1']);

check('no Sixth Coil name is in another feature\'s table',
  (() => { const others = otherNames('SIXTH_ROOM_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'sixth-coil'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
