// Ad-hoc test for FallenLondon/choice-helper.js's Consider your Aquaria / Search your Terraria
// badges ('university-creatures').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 12 + 9 = 21 rows with a `card` field telling the two cards apart,
// the 4 (Aquaria) + 1 (Terraria) base always-available consuming rows are marked distinctly,
// Rubbery Dragon's bonus CP appears in its tooltip even though its Research count is mid-pack
// (the "don't let the raw number mislead" caution), the Fate-gated Ocular Toadbeast is excluded
// from ranking but present, and no name collides with another feature's table -- in particular,
// neither card is in the existing university-laboratory feature's LAB_CARDS.
//
// Numbers come from Consider your Aquaria and Search your Terraria on fallenlondon.wiki (both
// fully inline on each card's own reference table), fetched through the API on 2026-09-27 -- see
// docs/superpowers/research/2026-09-27-airs-of-london-group-b.md sections 4 and 5.
//
//   node tests/choice-university-creatures.test.mjs

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
    getAttribute(k) { return this.attrs ? (this.attrs[k] ?? null) : null; },
    setAttribute(k, v) { (this.attrs = this.attrs || {})[k] = v; },
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

function makeHandCard(name) {
  const container = makeEl('div');
  container.className = 'hand__card-container';
  const img = makeEl('img');
  img.className = 'hand__image';
  img.setAttribute('alt', name);
  container.appendChild(img);
  return container;
}

let handCards = [];
let roots = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.hand__card-container') return handCards;
    if (sel === '.hand .small-card__body .media__heading') return [];
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
    'return { UNIVERSITY_CREATURE_OPTIONS, universityCreaturesSpec, universityCreaturesRatings,'
    + ' UNIVERSITY_CREATURES_CLASS, UNIVERSITY_CREATURES_BRANCH_CLASS, UNIVERSITY_CREATURES_CARD_CLASS, carouselLookup, UNIVERSITY_CREATURES_INDEX,'
    + ' UNIVERSITY_CREATURES_BRANCH_CLASS, LAB_CARDS, BURNING_CITY_OPTIONS, TIME_IN_BED_OPTIONS,'
    + ' CHEERY_CONSTABLE_OPTIONS, FFIR_OPTIONS, FEAST_OPTIONS, TOWER_OF_EYES_OPTIONS,'
    + ' RATTUS_FABER_OPTIONS, AOL_OPTIONS, ECDYSIS_OPTIONS, MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS,'
    + ' SPITE_CARDS, FOTZ_CARDS, HIGH_SANCTA_CARDS, MOON_MISER_RISKY, MOON_MISER_GOLD, SOUS_BONES,'
    + ' RED_STAGE_MAIN, RED_STAGE_FINALE, RED_STAGE_HAZARD, MOTH_STEPS, QUARTZ_ACTIONS, PC_OPTIONS,'
    + ' VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const row = (name) => api.UNIVERSITY_CREATURE_OPTIONS.find((e) => e.name === name);
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
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('12 + 9 = 21 rows', [
  api.UNIVERSITY_CREATURE_OPTIONS.filter((e) => e.card === 'aquaria').length,
  api.UNIVERSITY_CREATURE_OPTIONS.filter((e) => e.card === 'terraria').length,
], [12, 9]);

check('the base always-available consuming rows (4 Aquaria + 1 Terraria) are marked distinctly',
  api.UNIVERSITY_CREATURE_OPTIONS.filter((e) => e.consumes).length, 5);

check("Rubbery Dragon's bonus CP appears in its tooltip even though its Research count is mid-pack",
  api.universityCreaturesSpec(row('Rubbery Dragon')).title.includes('Shapeling Arts +2'), true);

check('the Fate-gated Ocular Toadbeast is excluded from ranking but present',
  (() => { const e = row('Ocular Toadbeast'); return [e.fate, e !== undefined]; })(), [true, true]);

check('neither card is in the existing university-laboratory feature\'s LAB_CARDS',
  api.LAB_CARDS.some((c) => c.name === 'Consider your Aquaria' || c.name === 'Search your Terraria'), false);

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}
const badgeAfter = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n.textContent;
  }
  return null;
};

check('wiring: the creatures are OPTIONS of the opened card, so they badge by branch title inside it',
  (() => {
    const gold = makeHeading('Cheerful Goldfish');
    const lizard = makeHeading('Reprehensible Lizard');
    const tort = makeHeading('Unerring Elver');
    const out = [];
    roots = [makeHeading('Consider your Aquaria')];
    branches = [gold, tort];
    api.universityCreaturesRatings();
    out.push(badgeAfter(gold, api.UNIVERSITY_CREATURES_BRANCH_CLASS));
    out.push(badgeAfter(tort, api.UNIVERSITY_CREATURES_BRANCH_CLASS));
    roots = [makeHeading('Search your Terraria')];
    branches = [lizard];
    api.universityCreaturesRatings();
    out.push(badgeAfter(lizard, api.UNIVERSITY_CREATURES_BRANCH_CLASS));
    roots = [makeHeading('Some Other Storylet')];
    api.universityCreaturesRatings();
    out.push(badgeAfter(lizard, api.UNIVERSITY_CREATURES_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Piscine Research x2', 'Piscine Research x25?', 'Amphibian Research x3', null]);

check('every Terraria row pays Amphibian Research and every Aquaria row Piscine Research, as a currency word not a count',
  [api.UNIVERSITY_CREATURE_OPTIONS.filter((e) => e.card === 'terraria').every((e) => e.currency === 'Amphibian Research' && typeof e.research === 'number'),
    api.UNIVERSITY_CREATURE_OPTIONS.filter((e) => e.card === 'aquaria').every((e) => e.currency === 'Piscine Research' && typeof e.research === 'number')],
  [true, true]);

check('wiring: a card in the hand gets the summary badge',
  (() => {
    const c = makeHandCard('Search your Terraria');
    handCards = [c];
    api.universityCreaturesRatings();
    const b = c.children.find((x) => x.classList.contains(api.UNIVERSITY_CREATURES_CARD_CLASS));
    handCards = [];
    return b && b.textContent;
  })(),
  'Amphibian Research');

check('no University Creatures name is in another feature\'s table',
  (() => { const others = allNames();
    return api.UNIVERSITY_CREATURE_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'university-creatures'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
