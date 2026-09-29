// Ad-hoc test for FallenLondon/choice-helper.js's Coffee with the Last Constable / A drink with
// the Cheery Man badges ('cheery-man-constable').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 9 + 9 = 18 rows (one per DISPLAY text; the wiki's numbered page titles are merged into variants) with a `side` field telling the two cards apart,
// that both cards' two real challenges each show the challenge mark, that all 6
// Fate/Acquaintance-gated rows state their requirement, and that the two storylets never
// cross-badge each other's options.
//
// Numbers come from Coffee with the Last Constable and A drink with the Cheery Man on
// fallenlondon.wiki, fetched through the API on 2026-09-27 -- see
// docs/superpowers/research/2026-09-27-airs-of-london-group-a.md sections 5 and 6.
//
//   node tests/choice-cheery-man-constable.test.mjs

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
    'return { carouselLookup, CHEERY_CONSTABLE_INDEX, CHEERY_CONSTABLE_OPTIONS, cheeryManConstableSpec, cheeryManConstableRatings,'
    + ' CHEERY_CONSTABLE_CLASS, CHEERY_CONSTABLE_BRANCH_CLASS, FFIR_OPTIONS, FEAST_OPTIONS,'
    + ' TOWER_OF_EYES_OPTIONS, RATTUS_FABER_OPTIONS, AOL_OPTIONS, ECDYSIS_OPTIONS,'
    + ' MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, HIGH_SANCTA_CARDS,'
    + ' MOON_MISER_RISKY, MOON_MISER_GOLD, SOUS_BONES, RED_STAGE_MAIN, RED_STAGE_FINALE,'
    + ' RED_STAGE_HAZARD, MOTH_STEPS, QUARTZ_ACTIONS, PC_OPTIONS, VSD_OPTIONS,'
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
const row = (name) => api.CHEERY_CONSTABLE_OPTIONS.find((e) => e.name === name);
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
    ...api.FEAST_OPTIONS.map((e) => e.name), ...api.FFIR_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('9 + 9 = 18 rows, side field correct', [
  api.CHEERY_CONSTABLE_OPTIONS.filter((e) => e.side === 'constable').length,
  api.CHEERY_CONSTABLE_OPTIONS.filter((e) => e.side === 'cheery').length,
], [9, 9]);

check('both cards\' two real challenges show the challenge mark',
  ['Talk about the Cheery Man', 'Invite her home with you', 'The Last Constable', 'Hint that you might want to stay the night']
    .every((n) => api.cheeryManConstableSpec(row(n)).text.includes('?')),
  true);

check('all 4 Fate/Acquaintance/item-gated rows state their requirement',
  ["She's not alone", 'Tell her your own story', "He's not alone", 'The Last Constable'].every((n) => {
    const e = row(n);
    return api.cheeryManConstableSpec(e).title.toLowerCase().includes('requires');
  }),
  true);

check('merged display texts are reachable by the bare text AND the numbered wiki title, and nothing else is ambiguous',
  (() => {
    const at = (n, st) => api.carouselLookup(api.CHEERY_CONSTABLE_INDEX, n, key(st)) !== null;
    const C = 'Coffee with the Last Constable';
    const H = 'A drink with the Cheery Man';
    return [at('Just chat', C), at('Just chat 1', C), at('Just chat 2', C), at("Ask her what she's working on", C),
      at("Ask her what she's working on 3", C), at("She's not alone", C), at("She's not alone 2", C),
      at('The Last Constable', H), at('The Last Constable 2', H), at("Whatever's on his mind", H),
      at("Whatever's on his mind (High Airs)", H), at("He's not alone", H), at("He's not alone 3", H),
      at('Just chat', H)];
  })(), [true, true, true, true, true, true, true, true, true, true, true, true, true, false]);

check('a merged row lists every Airs window in its tooltip and says the text is shared',
  (() => { const t = api.cheeryManConstableSpec(row('Just chat')).title; return [t.includes('1-50'), t.includes('51-100'), t.includes('different Airs')]; })(),
  [true, true, true]);

check('wiring: a Constable-side option only badges while Coffee with the Last Constable is open',
  (() => {
    const chat = makeHeading('Just chat');
    branches = [chat];
    const out = [];
    roots = [makeHeading('Coffee with the Last Constable')];
    api.cheeryManConstableRatings();
    out.push(text(chat, api.CHEERY_CONSTABLE_BRANCH_CLASS) !== null);
    roots = [makeHeading('A drink with the Cheery Man')];
    api.cheeryManConstableRatings();
    out.push(text(chat, api.CHEERY_CONSTABLE_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no Cheery Man/Constable name is in another feature\'s table',
  (() => { const others = allNames();
    return api.CHEERY_CONSTABLE_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'cheery-man-constable'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
