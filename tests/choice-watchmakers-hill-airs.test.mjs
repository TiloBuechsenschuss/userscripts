// Ad-hoc test for FallenLondon/choice-helper.js's Watchmaker's Hill "A Name Scrawled in Blood" Airs
// storylets ('watchmakers-hill-airs').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: all 6 storylet headings badge with their own Airs window and
// A Name Scrawled in Blood requirement in words; the two storylets with real Jade Fragment rewards
// have 4 option rows whose Jade count and Dangerous difficulty are pinned as transcribed (they are
// equal on three rows but NOT on "Talk them through your wounds": 45 Jade at difficulty 48); the
// four informational storylets never get a fabricated ranking number; the feature is distinct from
// menace-eradication's "The Department of Menace Eradication"; and no name collides.
//
// Numbers come from the six storylets' pages on fallenlondon.wiki, fetched through the API on
// 2026-09-27/28 -- see docs/superpowers/research/2026-09-27-airs-of-london-group-d.md section E.
//
//   node tests/choice-watchmakers-hill-airs.test.mjs

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
    'return { WATCHMAKERS_HILL_AIRS_OPTIONS, watchmakersHillAirsSpec, watchmakersHillAirsStoryletSpec, WATCHMAKERS_HILL_AIRS_STORYLETS, watchmakersHillAirsRatings, WATCHMAKERS_HILL_AIRS_CLASS, WATCHMAKERS_HILL_AIRS_BRANCH_CLASS,'
    + ' SHIFTING_STREETS_OPTIONS, CLATHERMONT_OPTIONS, DIVORCE_OPTIONS, HALLOWMAS_OPTIONS, CANDLEFINDER_CLAY_MEN_OPTIONS, CHW_OPTIONS, ON_THE_TRAIL_OPTIONS, CLAY_QUARTERS_OPTIONS, UNIVERSITY_CREATURE_OPTIONS,'
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
const row = (name) => api.WATCHMAKERS_HILL_AIRS_OPTIONS.find((e) => e.name === name);
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
    ...api.DIVORCE_OPTIONS.map((e) => e.name), ...api.HALLOWMAS_OPTIONS.map((e) => e.name), ...api.CLATHERMONT_OPTIONS.map((e) => e.name), ...api.SHIFTING_STREETS_OPTIONS.map((e) => e.name), ...api.CANDLEFINDER_CLAY_MEN_OPTIONS.map((e) => e.name), ...api.CHW_OPTIONS.map((e) => e.name), ...api.ON_THE_TRAIL_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

const S = api.WATCHMAKERS_HILL_AIRS_STORYLETS;

check('6 storylets with their Airs window and Name Scrawled in Blood level',
  S.map((s) => [s.name, s.blood, s.airs]),
  [['A Marksmanship Competition for a Prize of Jade!', 1, [0, 50]], ['Donate your body to science for an hour or two', 3, [0, 25]],
    ['Rescue Shipwrecked Clay Men', 3, [26, 50]], ['Deal with Unfinished Men', 3, [51, 75]],
    ['Guard duty at the Observatory', 1, [51, 100]], ['Provide Training at the Department of Menace Eradication', 3, [76, 100]]]);

check('the four ranked option rows: Jade count and Dangerous difficulty as transcribed',
  api.WATCHMAKERS_HILL_AIRS_OPTIONS.map((e) => [e.count, e.ch.diff]), [[21, 21], [24, 24], [45, 45], [45, 48]]);

check('every heading badge states its own Airs window and blood level in words',
  S.map((s) => { const t = api.watchmakersHillAirsStoryletSpec(key(s.name)).title;
    return t.includes('Airs of London ' + s.airs[0] + '-' + s.airs[1]) && t.includes('A Name Scrawled in Blood ' + s.blood); }),
  Array(6).fill(true));

check('the four informational storylets carry no fabricated ranking number',
  ['Rescue Shipwrecked Clay Men', 'Deal with Unfinished Men', 'Guard duty at the Observatory',
    'Provide Training at the Department of Menace Eradication']
    .map((n) => /[?×x]\d|\d/.test(api.watchmakersHillAirsStoryletSpec(key(n)).text.replace(/Airs \d+-\d+ only/, ''))),
  [false, false, false, false]);

check('the two ranked storylets\' headings name the best Jade reward but stay availability first',
  ['A Marksmanship Competition for a Prize of Jade!', 'Donate your body to science for an hour or two']
    .map((n) => api.watchmakersHillAirsStoryletSpec(key(n)).text.startsWith('Airs ')), [true, true]);

check('menace-eradication\'s own storylet is not badged by this feature',
  api.watchmakersHillAirsStoryletSpec(key('The Department of Menace Eradication')), null);

check('an option badge shows the Jade count and a challenge mark',
  api.WATCHMAKERS_HILL_AIRS_OPTIONS.map((e) => api.watchmakersHillAirsSpec(e).text),
  ['Jade ×21?', 'Jade ×24?', 'Jade ×45?', 'Jade ×45 + Greyfields ×2?']);

check('wiring: badges only appear while one of the six storylets is open',
  (() => {
    const head = makeHeading('Lie very, very still');
    branches = [head];
    const out = [];
    roots = [makeHeading('Donate your body to science for an hour or two')];
    api.watchmakersHillAirsRatings();
    out.push(text(head, api.WATCHMAKERS_HILL_AIRS_BRANCH_CLASS) !== null);
    roots = [makeHeading('A Marksmanship Competition for a Prize of Jade!')];
    api.watchmakersHillAirsRatings();
    out.push(text(head, api.WATCHMAKERS_HILL_AIRS_BRANCH_CLASS) !== null);
    roots = [makeHeading('Some Other Storylet')];
    api.watchmakersHillAirsRatings();
    out.push(text(head, api.WATCHMAKERS_HILL_AIRS_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false, false]);

check('no name here is in another feature\'s table',
  (() => { const others = allNames();
    return [...S.map((s) => s.name), ...api.WATCHMAKERS_HILL_AIRS_OPTIONS.map((e) => e.name)].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'watchmakers-hill-airs'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
