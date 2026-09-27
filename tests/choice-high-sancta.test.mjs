// Ad-hoc test for FallenLondon/choice-helper.js's The High Sancta card badges
// ('high-sancta').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here: the guide's per-card echo values are its own
// rounded ESTIMATE (~{{e}}12.50), not fetched per option page -- every row
// but one must carry an `approx` marker, and a future "tidy-up" that drops
// the `~` on all 28 would silently promote a guess to a fact. The one named
// exception (Unsigned in Triplicate, {{e}}12.60) must NOT carry it. Sound of
// Wings burden cards (8 other locations) are explicitly out of scope and must
// not appear in this table. No name collides with another card feature.
//
// Numbers come from The High Sancta (Guide) on fallenlondon.wiki, fetched
// through the API on 2026-09-27 (see
// docs/superpowers/research/2026-09-27-mid-firmament.md section 1).
//
//   node tests/choice-high-sancta.test.mjs

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
let compactHeadings = [];
let storyletRootHeadings = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.hand__card-container') return handCards;
    if (sel === '.hand .small-card__body .media__heading') return compactHeadings;
    if (sel === '.storylet-root__heading') return storyletRootHeadings;
    return [];
  },
  querySelector: (sel) => {
    if (sel === '#accessible-sidebar .welcome' && greeting != null) {
      const el = makeEl('p');
      el.textContent = 'Welcome to ' + greeting + ', delicious friend!';
      return el;
    }
    return null;
  },
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
    'return { HIGH_SANCTA_CARDS, highSanctaSpec, highSanctaRatings, HIGH_SANCTA_CLASS, inHighSancta, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS,'
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
const row = (name) => api.HIGH_SANCTA_CARDS.find((e) => e.name === name);
function otherNames(own) {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...TABLES.flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].filter((n) => n !== own).map(key);
}

check('27 approximate cards plus one exact one, plus the Lost in the Black reference row',
  [api.HIGH_SANCTA_CARDS.filter((e) => e.approx).length, api.HIGH_SANCTA_CARDS.filter((e) => e.approx === false).length,
    api.HIGH_SANCTA_CARDS.some((e) => e.name === 'Lost in the Black')],
  [27, 1, true]);

check('every approximate card carries the ~ marker in its badge text',
  api.HIGH_SANCTA_CARDS.filter((e) => e.approx).every((e) => api.highSanctaSpec(e).text.startsWith('~')), true);

check('Unsigned in Triplicate does NOT carry the ~ marker, and is the guide\'s one stated exact figure',
  (() => { const e = row('Unsigned in Triplicate'); return [e.echo, api.highSanctaSpec(e).text]; })(),
  [12.60, '12.6 E']);

check('every approximate card is valued at 12.5 E, in the file\'s own "N E" convention, never a literal wiki template',
  [api.HIGH_SANCTA_CARDS.filter((e) => e.approx).every((e) => e.echo === 12.5),
    api.HIGH_SANCTA_CARDS.every((e) => api.highSanctaSpec(e).text.indexOf('{{') === -1
      && api.highSanctaSpec(e).title.indexOf('{{') === -1)],
  [true, true]);

check('the three tiers are all present (28 cards: 10 + 9 + 9, per the guide\'s own tables)',
  [1, 2, 3].map((t) => api.HIGH_SANCTA_CARDS.filter((e) => e.tier === t).length), [10, 9, 9]);

check('none of the 8 Sound of Wings burden cards are in this table (out of scope)',
  api.HIGH_SANCTA_CARDS.some((e) => e.name.indexOf('Sound of Wings') !== -1), false);

check('the approx tooltip states it is a guide estimate, not a per-card fetch',
  api.highSanctaSpec(row('Bleeding In')).title.toLowerCase().includes('guide estimate'), true);

check('Lost in the Black is informational, not a ranking, and carries the guide\'s average EPA',
  (() => { const t = api.highSanctaSpec(row('Lost in the Black')).title; return [t.includes('10.10'), t.toLowerCase().includes('counterlight')]; })(),
  [true, true]);

check('wiring: the wide (image-only) hand layout badges a known card and ignores an unknown one',
  (() => {
    const bleeding = makeHandCard('Bleeding In');
    const unknown = makeHandCard('Some Unrelated Card');
    handCards = [bleeding, unknown];
    api.highSanctaRatings();
    const badgeText = (host) => {
      const b = host.children.find((c) => c.classList.contains(api.HIGH_SANCTA_CLASS));
      return b ? b.textContent : null;
    };
    const out = [badgeText(bleeding), badgeText(unknown)];
    handCards = [];
    return out;
  })(),
  ['~12.5 E', null]);

check('7 generic single-word card names are marked strict; the other 21 are not',
  api.HIGH_SANCTA_CARDS.filter((e) => e.strict).map((e) => e.name).sort(),
  ['Black Ice', 'Chained', 'Coronation', 'Reliquaries', 'Sloughing', 'Statuary', 'Waning'].sort());

check('a strict card only badges on a confirmed "High Sancta" greeting; a non-strict one badges regardless',
  (() => {
    const badgeText = (host) => {
      const b = host.children.find((c) => c.classList.contains(api.HIGH_SANCTA_CLASS));
      return b ? b.textContent : null;
    };
    const out = [];
    greeting = null;
    let coronation = makeHandCard('Coronation');
    let bleeding = makeHandCard('Bleeding In');
    handCards = [coronation, bleeding];
    api.highSanctaRatings();
    out.push([badgeText(coronation), badgeText(bleeding)]);
    greeting = 'The High Sancta';
    coronation = makeHandCard('Coronation');
    bleeding = makeHandCard('Bleeding In');
    handCards = [coronation, bleeding];
    api.highSanctaRatings();
    out.push([badgeText(coronation), badgeText(bleeding)]);
    handCards = []; greeting = null;
    return out;
  })(),
  [[null, '~12.5 E'], ['~12.5 E', '~12.5 E']]);

check('inHighSancta never says yes on an unrelated greeting, and never says yes with none',
  [api.inHighSancta(fakeDoc), (() => { greeting = 'Somewhere Else'; const r = api.inHighSancta(fakeDoc); greeting = null; return r; })()],
  [false, false]);

check('no High Sancta card name is in another card-based feature\'s table',
  (() => { const others = otherNames(null);
    return api.HIGH_SANCTA_CARDS.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'high-sancta'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
