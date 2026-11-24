// Ad-hoc test for FallenLondon/choice-helper.js's Candlefinder Canvassing badges
// ('candlefinder-canvassing': the Clay Men, the Servants and the Dockers).
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: all 21 options across the three storylets (the two Clay Men options
// with no Airs window were missing until 2026-11-24), the Detecting... amounts, challenge marks only
// on the rows that have a challenge, the closers badged as payouts (Clay Men → 60, the other two
// +10), "Put the pieces together" resolving to its own storylet's row, the difficulty caveat on
// every challenge row, the unsure +8 said in words (not with "?", which means a challenge), and no
// name collision with any other feature.
//
// Sources: the three storylet pages and all 21 option pages on fallenlondon.wiki, fetched through
// the API (Clay Men 2026-09-27, the rest 2026-11-24); The Candlefinder Society (Guide) as a
// cross-check. Plan: docs/superpowers/plans/2026-11-24-candlefinder-canvassing.md.
//
//   node tests/choice-candlefinder-canvassing.test.mjs

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
    'return { CANDLEFINDER_CANVASSING_OPTIONS, CANDLEFINDER_CANVASSING_INDEX, candlefinderCanvassingSpec, candlefinderCanvassingStoryletSpec, candlefinderCanvassingRatings, CANDLEFINDER_CANVASSING_CLASS, CANDLEFINDER_CANVASSING_BRANCH_CLASS, carouselLookup, CF_DIFF_NOTE,'
    + ' SHIFTING_STREETS_OPTIONS, CLATHERMONT_OPTIONS, DIVORCE_OPTIONS, HALLOWMAS_OPTIONS, CLAY_QUARTERS_OPTIONS, UNIVERSITY_CREATURE_OPTIONS,'
    + ' LAB_CARDS, BURNING_CITY_OPTIONS, TIME_IN_BED_OPTIONS, CHEERY_CONSTABLE_OPTIONS,'
    + ' FFIR_OPTIONS, FEAST_OPTIONS, TOWER_OF_EYES_OPTIONS, RATTUS_FABER_OPTIONS, AOL_OPTIONS,'
    + ' ECDYSIS_OPTIONS, MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS,'
    + ' HIGH_SANCTA_CARDS, MOON_MISER_RISKY, MOON_MISER_GOLD, SOUS_BONES, RED_STAGE_MAIN,'
    + ' RED_STAGE_FINALE, RED_STAGE_HAZARD, MOTH_STEPS, QUARTZ_ACTIONS, PC_OPTIONS, VSD_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const OPTS = api.CANDLEFINDER_CANVASSING_OPTIONS;
const row = (name, st) => OPTS.find((e) => e.name === name && (!st || e.storylet === st));
const CM = 'Candlefinder: Canvassing the Clay Men';
const SV = 'Candlefinder: Canvassing the Servants';
const DK = 'Candlefinder: Canvassing the Dockers';
const of = (st) => OPTS.filter((e) => e.storylet === st);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function allNames() {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...api.HIGH_SANCTA_CARDS.map((c) => c.name),
    ...api.MOON_MISER_RISKY.flatMap((e) => [e.card, e.option]), ...api.MOON_MISER_GOLD.map((e) => e.name),
    ...api.SOUS_BONES.map((e) => e.name),
    ...api.RED_STAGE_MAIN.map((e) => e.name), ...api.RED_STAGE_FINALE.map((e) => e.name), ...api.RED_STAGE_HAZARD.map((e) => e.name),
    ...api.MOTH_STEPS.map((e) => e.name), ...api.QUARTZ_ACTIONS.map((e) => e.name),
    ...api.RATTUS_FABER_OPTIONS.map((e) => e.name), ...api.TOWER_OF_EYES_OPTIONS.map((e) => e.name),
    ...api.FEAST_OPTIONS.map((e) => e.name), ...api.FFIR_OPTIONS.map((e) => e.name), ...api.CHEERY_CONSTABLE_OPTIONS.map((e) => e.name),
    ...api.TIME_IN_BED_OPTIONS.map((e) => e.name), ...api.BURNING_CITY_OPTIONS.map((e) => e.name),
    ...api.UNIVERSITY_CREATURE_OPTIONS.map((e) => e.name), ...api.CLAY_QUARTERS_OPTIONS.map((e) => e.name),
    ...api.DIVORCE_OPTIONS.map((e) => e.name), ...api.HALLOWMAS_OPTIONS.map((e) => e.name), ...api.CLATHERMONT_OPTIONS.map((e) => e.name), ...api.SHIFTING_STREETS_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('7 rows per storylet, in page order',
  [CM, SV, DK].map((st) => of(st).map((e) => e.name)),
  [['Emancipate a Clay Man', 'Patch up an injured Clay Man', 'Send in the Gravel-Voiced Gossip',
    'Keep track of Clay movements', 'Be open about your motives', 'Eavesdrop on private conversations',
    'Concrete evidence'],
  ['Watch the comings and goings', 'Flirt with a footman', 'Approach a senior maid', 'Steal some correspondence',
    'A chambermaid is not what she seems', 'Casually stroll downstairs', 'Put the pieces together'],
  ['Pop in to the Blind Helmsman', 'Probe in dark corners', 'Observe arrivals and departures', 'Lean on the foreman',
    'Armwrestle a dockworker', 'Recognise a familiar face', 'Put the pieces together']]);

check('21 rows in all, every one on one of the three storylets', [OPTS.length, OPTS.every((e) => [CM, SV, DK].includes(e.storylet))], [21, true]);

check('badge text, Clay Men',
  of(CM).map((e) => api.candlefinderCanvassingSpec(e).text),
  ['Detecting... +8', 'Detecting... +6?', 'Detecting... +6', 'Detecting... +6?', 'Detecting... +4?',
    'Detecting... +4?', 'Case progress → 60']);

check('badge text, Servants',
  of(SV).map((e) => api.candlefinderCanvassingSpec(e).text),
  ['Detecting... +4?', 'Detecting... +4?', 'Detecting... +6?', 'Detecting... +6?', 'Detecting... +8',
    'Detecting... +8 unconfirmed', 'Case progress +10']);

check('badge text, Dockers',
  of(DK).map((e) => api.candlefinderCanvassingSpec(e).text),
  ['Detecting... +8', 'Detecting... +4?', 'Detecting... +4?', 'Detecting... +6?', 'Detecting... +6?',
    'Detecting... +8', 'Case progress +10']);

check('the "?" mark is exactly the rows with a challenge',
  OPTS.map((e) => api.candlefinderCanvassingSpec(e).text.includes('?')), OPTS.map((e) => !!e.ch));

check('difficulties as the pages record them',
  OPTS.filter((e) => e.ch).map((e) => e.ch.stat + ' ' + e.ch.diff),
  ['Dangerous 150', 'Shadowy 130', 'Persuasive 150', 'Watchful 150',
    'Watchful 70', 'Persuasive 70', 'Watchful 100', 'Shadowy 56',
    'Shadowy 200', 'Watchful 200', 'Dangerous 200', 'Dangerous 200']);

check('every challenge row carries the may-differ-by-case note, and only those',
  OPTS.map((e) => api.candlefinderCanvassingSpec(e).title.includes(api.CF_DIFF_NOTE)), OPTS.map((e) => !!e.ch));

check('Patch up says its 150 was confirmed in game; no other row claims it',
  OPTS.filter((e) => api.candlefinderCanvassingSpec(e).title.includes('confirmed in game')).map((e) => e.name),
  ['Patch up an injured Clay Man']);

check('closers are payouts in the payout colour, progress rows are not',
  OPTS.map((e) => api.candlefinderCanvassingSpec(e).color === '#8a6420'), OPTS.map((e) => !!e.closes));

check('each closer removes its own lead',
  [[CM, 'Concrete evidence', 'Clay Men of London'], [SV, 'Put the pieces together', 'The Shuttered Palace Downstairs'],
    [DK, 'Put the pieces together', 'The Workers of the Docks']]
    .map(([st, n, lead]) => api.candlefinderCanvassingSpec(row(n, st)).title.includes('Candlefinder Lead: ' + lead)),
  [true, true, true]);

check('"Put the pieces together" resolves to its own storylet\'s row',
  [SV, DK, CM].map((st) => { const e = api.carouselLookup(api.CANDLEFINDER_CANVASSING_INDEX, 'Put the pieces together', key(st));
    return e && e.storylet; }),
  [SV, DK, null]);

check('the unsure +8 is said in words in the tooltip too',
  api.candlefinderCanvassingSpec(row('Casually stroll downstairs')).title.includes('the wiki is unsure'), true);

check('the Blind Helmsman says it needs no Detecting... yet',
  api.candlefinderCanvassingSpec(row('Pop in to the Blind Helmsman')).title.includes('no Detecting... yet'), true);

check('Eavesdrop: Watchful 150, no Airs window, Nightmares on failure',
  (() => { const t = api.candlefinderCanvassingSpec(row('Eavesdrop on private conversations')).title;
    return [t.includes('Watchful 150'), t.includes('no Airs window'), t.includes('Failure: Nightmares +1')]; })(),
  [true, true, true]);

check('"Be open about your motives" states its below-40 window in words',
  api.candlefinderCanvassingSpec(row('Be open about your motives')).title.toLowerCase().includes('below 40'), true);

check('storylet headings: one label each, nothing on another storylet',
  [CM, SV, DK, 'Some Other Storylet'].map((st) => { const s = api.candlefinderCanvassingStoryletSpec(key(st)); return s && s.text; }),
  ['Clay Men', 'Servants', 'Dockers', null]);

check('wiring: badges only appear while their own storylet is open',
  (() => {
    const names = ['Emancipate a Clay Man', 'Eavesdrop on private conversations', 'Concrete evidence',
      'Put the pieces together', 'Lean on the foreman', 'Flirt with a footman'];
    const run = (open) => {
      const heads = names.map(makeHeading);
      branches = heads;
      roots = [makeHeading(open)];
      api.candlefinderCanvassingRatings();
      const out = heads.map((h) => text(h, api.CANDLEFINDER_CANVASSING_BRANCH_CLASS));
      roots = []; branches = [];
      return out;
    };
    return [run(CM), run(SV), run(DK), run('Some Other Storylet')];
  })(),
  [['Detecting... +8', 'Detecting... +4?', 'Case progress → 60', null, null, null],
    [null, null, null, 'Case progress +10', null, 'Detecting... +4?'],
    [null, null, null, 'Case progress +10', 'Detecting... +6?', null],
    [null, null, null, null, null, null]]);

check('no Canvassing name is in another feature\'s table',
  (() => { const others = allNames();
    return OPTS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'candlefinder-canvassing'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
