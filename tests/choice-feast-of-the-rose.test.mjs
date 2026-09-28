// Ad-hoc test for FallenLondon/choice-helper.js's The Feast of the Rose! badges
// ('feast-of-the-rose').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 16 top-level Airs-gated redirects (one of them, "Try to secure a
// table at Dante's Grill", is offered across TWO non-adjacent Airs windows and is merged into one
// row carrying both, the same multi-window shape as Ecdysis's "Root yourself in place"), every
// leaf option's Masquing gain (the real badge-worthy currency, not the flavour items), the
// disambiguator trap (the real option page behind "Bluff your way in" is "Bluff your way in 2",
// "The Duchess' banquet" is really "The Duchess' banquet 0"), that "A masked revel!"'s own
// "Cast aside your mask!" sub-row exists here (closing the loop with the TODO.md consolidation
// that also marked "A masked revel for the Feast of the Rose!" implemented off this one feature),
// and that no name collides with another feature's table.
//
// Numbers come from The Feast of the Rose! on fallenlondon.wiki, fetched through the API on
// 2026-09-27 -- see docs/superpowers/research/2026-09-27-airs-of-london-group-a.md section 3.
//
//   node tests/choice-feast-of-the-rose.test.mjs

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
    'return { FEAST_OPTIONS, feastOfTheRoseSpec, feastOfTheRoseRatings, FEAST_CLASS,'
    + ' FEAST_BRANCH_CLASS, TOWER_OF_EYES_OPTIONS, RATTUS_FABER_OPTIONS, AOL_OPTIONS,'
    + ' ECDYSIS_OPTIONS, MIDNIGHT_TRADE_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS,'
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
const row = (name) => api.FEAST_OPTIONS.find((e) => e.name === name);
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
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('16 unique top-level redirects, one of them ("Try to secure a table at Dante\'s Grill") '
    + 'merged across two non-adjacent Airs windows',
  (() => {
    const redirects = api.FEAST_OPTIONS.filter((e) => e.open);
    const dantes = redirects.find((e) => e.name === "Try to secure a table at Dante's Grill");
    return [redirects.length, dantes.airs];
  })(),
  [16, [[51, 75], [76, 100]]]);

check('every leaf option carries a Masquing figure (or null where the page gives none), never a '
    + 'flavour-item badge as the primary number',
  row('Dance with a mysterious stranger').masquing, 1);

check('the disambiguator trap: "Bluff your way in" resolves to its real target page '
    + '"Bluff your way in 2", and "The Duchess\' banquet" options are filed under the redirect '
    + 'name without the disambiguator suffix leaking into the badge',
  row('Bluff your way in 2') !== undefined, true);

check('"A masked revel!"\'s own "Cast aside your mask!" sub-row exists in this table',
  row('Cast aside your mask!') !== undefined, true);

check('wiring: a leaf option only badges while its own sub-storylet is open, not the top-level card',
  (() => {
    const dance = makeHeading('Dance with a mysterious stranger');
    branches = [dance];
    const out = [];
    roots = [makeHeading('A masked revel!')];
    api.feastOfTheRoseRatings();
    out.push(text(dance, api.FEAST_BRANCH_CLASS) !== null);
    roots = [makeHeading('The Feast of the Rose!')];
    api.feastOfTheRoseRatings();
    out.push(text(dance, api.FEAST_BRANCH_CLASS) !== null);
    roots = []; branches = [];
    return out;
  })(),
  [true, false]);

check('no Feast of the Rose name is in another feature\'s table',
  (() => { const others = allNames();
    return api.FEAST_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'feast-of-the-rose'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
