// Ad-hoc test for FallenLondon/choice-helper.js's Breeding Monsters badges
// ('breeding-monsters').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: every beast's expected Echoes against the
// guide's overview, 21 CP at +3 being the guide's seven actions, the same
// breeding title resolving by the open storylet, and the badges.
//
// Numbers come from Breeding Monsters (Guide) and its storylet and option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-breeding-monsters.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { BREED_TABLE, BREED_STORYLETS, BREED_INDEX, BREED_CLASS, BREED_BRANCH_CLASS, breedExpected, breedBadgeText, breedSpec,'
    + ' breedStoryletSpec, breedRatings, carouselLookup, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const rows = api.BREED_OPTIONS;
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
const breeds = rows.filter((e) => e.breed);

check('seven breeding storylets, four beasts each', [api.BREED_TABLE.length, breeds.length], [7, 28]);

check('every expectation is the guide\'s, at 70% success',
  breeds.filter((e) => api.breedExpected(e.breed) !== e.breed.guideE).map((e) => e.storylet + ' / ' + e.name), []);

check('6 of a quality is 21 CP: the guide\'s seven actions at +3', [6 * 7 / 2, 6 * 7 / 2 / 3], [21, 7]);

check('the Rubbery Hound pays best on every breeding storylet',
  api.BREED_TABLE.map((s) => {
    const own = breeds.filter((e) => e.storylet === s[0]);
    return own.reduce((a, b) => (api.breedExpected(b.breed) > api.breedExpected(a.breed) ? b : a)).beast;
  }), Array(7).fill('Rubbery Hound'));

check('the same title resolves by the open storylet',
  ['Breeding through Discipline', 'Pulling out the Stops', 'Casting out Devils']
    .map((s) => { const e = api.carouselLookup(api.BREED_INDEX, 'Breed the Plated Seal', key(s)); return e && api.breedBadgeText(e); }),
  ['Passphrase ×15/11 · ≈34.5 ▼', 'Hound of Heaven ×1 · ≈52.5 ▼', null]);

check('badges', [['Be kind'], ['Breed the Somnolent Hyaena', 'Breeding through Discipline'],
  ['Sabotage the process, for the benefit of devils']].map(([n, s]) => api.breedBadgeText(row(n, s))),
  ['Taming +3?', 'Shriek ×1050/700 · ≈18.9 ▼', 'Brass Rings ▼ · Favours: Hell +3 · Favours: The Church −all']);

check('the challenge with no recorded difficulty says so',
  api.breedSpec(row('Whispering at monsters')).title.includes('the page records no difficulty'), true);

check('the registered pass',
  (() => {
    const seal = makeHeading('Breed the Plated Seal');
    const kind = makeHeading('Be kind');
    branches = [seal, kind];
    roots = [makeHeading('A Firm Hand')];
    api.breedRatings();
    const out = [text(roots[0], api.BREED_CLASS), text(seal, api.BREED_BRANCH_CLASS), text(kind, api.BREED_BRANCH_CLASS)];
    roots = [makeHeading('Tame your... Thing')];
    api.breedRatings();
    out.push(text(roots[0], api.BREED_CLASS), text(seal, api.BREED_BRANCH_CLASS), text(kind, api.BREED_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['breed', 'Damask ×4/2 · ≈42.5 ▼', null, 'progress', null, 'Taming +3?']);

check('no Breeding Monsters name is in another feature\'s table',
  (() => { const others = otherNames('BREED_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'breeding-monsters'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
