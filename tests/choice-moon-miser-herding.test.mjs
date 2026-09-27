// Ad-hoc test for FallenLondon/choice-helper.js's Moon-Miser Herding badges
// ('moon-miser-herding').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here: the two risky branches' tooltip says in words
// that failure REMOVES a quality already held (not a harmless miss), the
// three gold cards' guide-verified EPA figures, that a risky option is only
// matched while ITS OWN card is open (the option text is looked up scoped to
// the currently open card, since "We made camp" and "I sent out my old
// friend" are reused option texts elsewhere in this activity -- not tracked
// here, but the lookup shape defends against exactly that trap), and that no
// name collides with another feature's table.
//
// Numbers come from Moon-Miser Herding (Guide) on fallenlondon.wiki, fetched
// through the API on 2026-09-27 (see
// docs/superpowers/research/2026-09-27-mid-firmament.md section 2).
//
//   node tests/choice-moon-miser-herding.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null, attrs: {},
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
    getAttribute(k) { return this.attrs[k] ?? null; },
    setAttribute(k, v) { this.attrs[k] = v; },
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
let storyletRootHeadings = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.hand__card-container') return handCards;
    if (sel === '.hand .small-card__body .media__heading') return [];
    if (sel === '.storylet-root__heading') return storyletRootHeadings;
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
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'AOL_OPTIONS', 'ECDYSIS_OPTIONS',
  'MIDNIGHT_TRADE_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MOON_MISER_RISKY, MOON_MISER_GOLD, moonMiserRiskySpec, moonMiserGoldSpec, moonMiserRatings,'
    + ' MOON_MISER_CLASS, MOON_MISER_BRANCH_CLASS, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, HIGH_SANCTA_CARDS, PC_OPTIONS, VSD_OPTIONS,'
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
    ...TABLES.flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('two risky branches, both stating the quality that failure REMOVES',
  api.MOON_MISER_RISKY.map((e) => [e.card, e.option, e.removes]),
  [['Crag Path', 'I kept my eyes open', 'Seeing a new Frame of Reference'],
    ['Grazing Field', 'I tasted the nectar', 'A Mouthful of Light']]);

check('a risky branch\'s tooltip says REMOVES, not just "failure"',
  api.MOON_MISER_RISKY.every((e) => api.moonMiserRiskySpec(e).title.includes('REMOVES')), true);

check('three gold cards with the guide\'s own EPA figures',
  api.MOON_MISER_GOLD.map((e) => e.epa), [5, 5.01, 5.67]);

check('the gold card tooltip states it cashes out ALL banked Latent Recollections at once',
  api.MOON_MISER_GOLD.every((e) => api.moonMiserGoldSpec(e).title.toLowerCase().includes('all banked')), true);

check('wiring: a risky option only badges while its OWN card is open, not another card, not unopened',
  (() => {
    const eyesOpen = makeHeading('I kept my eyes open');
    branches = [eyesOpen];
    const out = [];
    storyletRootHeadings = [makeHeading('Crag Path')];
    api.moonMiserRatings();
    out.push(text(eyesOpen, api.MOON_MISER_BRANCH_CLASS));
    storyletRootHeadings = [makeHeading('Grazing Field')];
    api.moonMiserRatings();
    out.push(text(eyesOpen, api.MOON_MISER_BRANCH_CLASS));
    storyletRootHeadings = [];
    branches = [];
    return out;
  })(),
  ['? risky', null]);

check('wiring: a gold card badges in the hand by name',
  (() => {
    const blood = makeHandCard('Blood of the Stone');
    handCards = [blood];
    api.moonMiserRatings();
    const b = blood.children.find((c) => c.classList.contains(api.MOON_MISER_CLASS));
    handCards = [];
    return b && b.textContent;
  })(),
  '5 EPA');

check('the bare "Fearful Symmetry" name (without the wiki\'s "(Zenith\'s Gate)" disambiguator, which '
    + 'the guide never confirms the game actually shows) also badges',
  (() => {
    const bare = makeHandCard('Fearful Symmetry');
    handCards = [bare];
    api.moonMiserRatings();
    const b = bare.children.find((c) => c.classList.contains(api.MOON_MISER_CLASS));
    handCards = [];
    return b && b.textContent;
  })(),
  '5.01 EPA');

check('no Moon-Miser Herding name is in another feature\'s table',
  (() => {
    const own = [...api.MOON_MISER_RISKY.map((e) => e.card), ...api.MOON_MISER_RISKY.map((e) => e.option),
      ...api.MOON_MISER_GOLD.map((e) => e.name)].map(key);
    const others = allNames();
    return own.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'moon-miser-herding'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
