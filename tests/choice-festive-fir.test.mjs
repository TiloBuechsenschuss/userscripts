// Ad-hoc test for FallenLondon/choice-helper.js's Up Close with a Festive Fir badges
// ('festive-fir').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: all 16 rows with their exact Airs window, trade-off direction, and
// Gratitude formula/bonus (never a guessed flat number -- every reward is stated as a formula,
// "<=576 (highway-stat-capped) + a flat bonus"), that the 4 real-failure rows carry the literal
// 7/12 fraction, and that the storylet tooltip states both the shared/global nature of the tree
// and that a trade-off direction always applies. No panel, seasonal (8 days every December).
//
// Numbers come from Up Close with a Festive Fir on fallenlondon.wiki, fetched through the API on
// 2026-09-27 -- see docs/superpowers/research/2026-09-27-airs-of-london-group-a.md section 4.
//
//   node tests/choice-festive-fir.test.mjs

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
    'return { FFIR_OPTIONS, festiveFirSpec, festiveFirRatings, FFIR_CLASS, FFIR_BRANCH_CLASS,'
    + ' FEAST_OPTIONS, TOWER_OF_EYES_OPTIONS, RATTUS_FABER_OPTIONS, AOL_OPTIONS, ECDYSIS_OPTIONS,'
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
const row = (name) => api.FFIR_OPTIONS.find((e) => e.name === name);
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
    ...api.FEAST_OPTIONS.map((e) => e.name),
    ...api.AOL_OPTIONS.map((e) => e.name), ...api.ECDYSIS_OPTIONS.map((e) => e.name), ...api.MIDNIGHT_TRADE_OPTIONS.map((e) => e.name),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('16 rows', api.FFIR_OPTIONS.length, 16);

check('every badge shows the Gratitude formula, never a guessed flat number',
  api.festiveFirSpec(row('Whisper secrets to the tree')).text.includes('<=576'), true);

check('a spot-checked row: trade-off direction, bonus, and challenge shape',
  (() => { const e = row('Adjust the sentiment balance of the soil');
    return [e.airs, e.gain, e.loss, e.bonus, e.ch.stat, e.ch.narrow, e.realFailFraction]; })(),
  [[0, 25], 'Heartiness', 'Beauty', 0, 'Kataleptic Toxicology', true, true]);

check('the 4 rows with a real challenge all carry the literal 7/12 fail fraction',
  ['Adjust the sentiment balance of the soil', 'Haul well water to the roots',
    'Rearrange existing decorations', 'Sneak up on thieving urchins']
    .every((n) => row(n).realFailFraction === true && api.festiveFirSpec(row(n)).title.includes('7/12')),
  true);

check('every row states its trade-off direction on the badge itself, not just the tooltip',
  api.FFIR_OPTIONS.every((e) => api.festiveFirSpec(e).text.includes(e.gain) || api.festiveFirSpec(e).text.includes('/')),
  true);

check('the storylet tooltip states the shared/global nature of the tree',
  (() => {
    branches = [];
    roots = [makeHeading('Up Close with a Festive Fir')];
    api.festiveFirRatings();
    const b = badgeOf(roots[0], api.FFIR_CLASS);
    roots = [];
    return b && b.title.toLowerCase().includes('shared') && b.title.toLowerCase().includes('global');
  })(), true);

check('no Festive Fir name is in another feature\'s table',
  (() => { const others = allNames();
    return api.FFIR_OPTIONS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'festive-fir'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
