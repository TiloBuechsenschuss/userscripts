// Ad-hoc test for FallenLondon/choice-helper.js's Hellworm feature ('hellworm') on the shared
// progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The three plays and what they do: a play (+1, Nightmares -1 to -8), a ride (+1 to 2, a
//    Scandal and two Aeolian Screams) and the milking at 7 that takes all of it.
//  - The three purchases are labels with the price, and the polish says it does nothing.
//  - The guide's disagreements (Nightmares 1 to 7, the Kataleptic Toxicology) and that its Echoes
//    are tooltip text only.
//  - The one card, in the hand and opened, badged once, with its options inside.
//  - That no title is in another feature's table.
//
// Numbers come from the option pages on fallenlondon.wiki, fetched through the API on 2026-09-25,
// with Hellworm (Guide) as the cross-check.
//
//   node tests/choice-hellworm.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
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
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
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
let list = [];
let branches = [];
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
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
    'return { carouselLookup, carouselRange, CAROUSEL_COLOR_NEUTRAL, CAROUSEL_COLOR_LABEL, CAROUSEL_COLOR_PROGRESS,'
    + ' CAROUSEL_COLOR_PAYOUT, PQ_SHORT, pqBadgeText, pqSpec, pqStoryletSpec, pqCardSpec, pqRatings,'
    + ' HW_CFG, HW_OPTIONS, HW_INDEX, HW_DEF, HW_CARDS, hwRatings, SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS,'
    + ' CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, ARBOR_OPTIONS,'
    + ' PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);







let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const key = api.normalizeName;
const CARD = 'Your Very Own Hellworm';
const hw = (name) => api.HW_OPTIONS.find((e) => e.name === name);
const ht = (name) => api.pqBadgeText(hw(name), api.HW_CFG);

check('a play raises the Disposition by 1 and takes 1 to 8 Nightmares off',
  ht('Play with your hellworm'), 'Disp +1 · Nightmares −1–8');

check('a ride raises it by 1 or 2, adds a Scandal and pays two Aeolian Screams',
  ht('Ride your hellworm'), 'Disp +1–2 · Scandal +1 · Aeolian Scream ×2');

check('the milking needs 7, takes all of it and pays one of 33 rewards',
  [ht('Milk your hellworm'), hw('Milk your hellworm').spend, /Takes all 7 back/.test(api.pqSpec(hw('Milk your hellworm'), api.HW_CFG).title)],
  ['Disp 7 ▼ → one of 33 rewards', 7, true]);

check('the three purchases are labels with a price, and the polish says it does nothing',
  ['Purchase a hellworm saddle', 'Purchase a pair of Hellworm-Riding Boots', 'Purchase an amount of Hellworm-Riding Boot Polish'].map(ht),
  ['Scrip ×200,000 → saddle', 'Scrip ×200,000 → boots', 'Scrip ×200,000 → nothing']);

check('the guide disagrees on the Nightmares and omits the Kataleptic Toxicology, and both are carried',
  [/1 to −7|−1 to −7/.test(hw('Play with your hellworm').guide), /Kataleptic Toxicology/.test(hw('Milk your hellworm').guide),
    hw('Milk your hellworm').needs], [true, true, 'Kataleptic Toxicology 5']);

check('the guide Echoes are in the tooltips and never on a badge',
  [/10\.03 Echoes per action/.test(api.pqSpec(hw('Play with your hellworm'), api.HW_CFG).title),
    /15\.54 Echoes per action/.test(api.pqSpec(hw('Ride your hellworm'), api.HW_CFG).title),
    /80\.26 Echoes/.test(api.pqSpec(hw('Milk your hellworm'), api.HW_CFG).title),
    api.HW_OPTIONS.some((e) => /Echoes|EPA/.test(api.pqBadgeText(e, api.HW_CFG)))], [true, true, true, false]);

check('the card in the hand, and the opened card with one badge on the heading and one on its option',
  (() => {
    const card = makeHeading(CARD);
    const opt = makeHeading('Ride your hellworm');
    hand = [card];
    branches = [opt];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    api.hwRatings();
    out.push(t(card, api.HW_DEF.cardCls));
    hand = [];
    roots = [makeHeading(CARD)];
    api.hwRatings();
    out.push([t(roots[0], api.HW_DEF.cardCls), t(roots[0], api.HW_DEF.cls), t(opt, api.HW_DEF.branchCls)]);
    roots = [];
    branches = [];
    return out;
  })(), ['Disp +1 · milk at 7', ['Disp +1 · milk at 7', null, 'Disp +1–2 · Scandal +1 · Aeolian Scream ×2']]);

check('a card of another feature is left alone',
  (() => {
    const card = makeHeading('A drunk');
    hand = [card];
    api.hwRatings();
    const out = badgeOf(card, api.HW_DEF.cardCls);
    hand = [];
    return out;
  })(), null);

check('there are six options, all on the one card, and none repeats',
  [api.HW_OPTIONS.length, api.HW_OPTIONS.every((e) => key(e.storylet) === key(CARD)),
    new Set(api.HW_OPTIONS.map((e) => key(e.name))).size], [6, true, 6]);

check('no option title is also a title in the tables of the other features',
  (() => {
    const mine = api.HW_OPTIONS.map((e) => key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS].map((e) => key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'hellworm'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
