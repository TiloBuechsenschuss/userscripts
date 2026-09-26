// Ad-hoc test for FallenLondon/choice-helper.js's Firmament feature ('firmament') on the shared
// progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The badge form the guide's own words give: `+Duchess 1 · Tyranny =3` (+ gives, - takes, =
//    sets), and that the choices the guide says matter to nothing say so.
//  - The guide's figures part by part: the airship, the Gullet, Lost Naples (the Madonna, the
//    whale), the feast (seats at 5, 3 and 1, endings at Tyranny 1, 3 and 5), the Calendar, and the
//    three histories at Queeneater's.
//  - The warning mark on the lines the guide is unsure of, and its tooltip.
//  - The wiki's "Firmament: " storylet prefix, found under the game's bare heading.
//  - That no option is filed under the same storylet in another feature's table.
//
// Options come from Firmament (Guide) and the option pages it links to on fallenlondon.wiki,
// fetched through the API on 2026-09-26.
//
//   node tests/choice-firmament.test.mjs

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
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, FIR_CFG, FIR_OPTIONS, FIR_INDEX, FIR_DEF, firRatings, IR_OPTIONS,'
    + ' SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, HW_OPTIONS, RBG_OPTIONS, SD_OPTIONS, TLC_OPTIONS, ST_OPTIONS, ML_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const opt = (card, name) => api.FIR_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const lab = (card, name) => opt(card, name).label;

check('every entry names its part, storylet and option, has a badge and a tooltip, and none repeats',
  [api.FIR_OPTIONS.every((e) => e.part && e.storylet && e.name && e.label && e.title && e.color),
    new Set(api.FIR_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.FIR_OPTIONS.length],
  [true, true]);

check('the prologue and every one of the nine parts has choices in it',
  ['Prologue', ...Array.from({ length: 9 }, (_, i) => 'Part ' + (i + 1))]
    .map((p) => api.FIR_OPTIONS.filter((e) => e.part.indexOf(p) === 0).length > 0),
  Array(10).fill(true));

check('Hallow’s Throat and the Gullet: what each choice sets, as the guide says',
  [lab('A Yawning Grave', 'Visit'), lab('A Yawning Grave', 'Fly on'),
    lab('Searching for the Rain', 'Accept the Forlorn Shepherd with open arms'),
    lab('Ascending the Gullet', 'Override the Last Duchess'),
    lab('Spirefall', 'Convince the Vulgate to escape'), lab('Spirefall', 'Leave the Vulgate')],
  ['Duchess =1', 'Dawnseeker =1', '+Shepherd 1 · Accepted the help of a Shepherd =1', '+Service 1 · Menial Decision =2', 'Vulgatis =1', 'Vulgatis =2']);

check('Lost Naples: the Madonna, the miners and the whale',
  [lab('Summer in Naples', 'Tell her that you’ve found her crew'), lab('Summer in Naples', 'Reveal you’ve found their captain'),
    lab('Sink or Swim', 'Sing to the Midnight Whale of the sun'), lab('Sink or Swim', 'Sing to the Midnight Whale of the zee'),
    lab('The Cup and the Moon', 'Say nothing'), lab('The Cup and the Moon', 'Draw on your experience as a citizen')],
  ['Via Madonna =4', 'Via Madonna =5', 'Leviathan’s Call =1 · Whalerise', 'Leviathan’s Call =2 · Whalefall', '+Duchess 3', '+Duchess 1']);

check('the feast: the seats at 5, 3 and 1, the three endings at Tyranny 1, 3 and 5, and the Duchess in Extremis',
  [lab('A Feast of Burgundy', 'Sit at the high table'), lab('A Feast of Burgundy', 'Sit with your officers'), lab('A Feast of Burgundy', 'Sit below the salt'),
    lab('The Great Hall', 'Conclude a dreadful feast'), lab('The Great Hall', 'Conclude an adequate feast'), lab('The Great Hall', 'Conclude a thrilling feast'),
    lab('The Duchess in Extremis', 'Fall upon your own sword'), lab('The Duchess in Extremis', 'Let matters play out')],
  ['+Prestige 5', '+Prestige 3', '+Prestige 1', '+Tyranny 1', '+Tyranny 3', '+Tyranny 5',
    '+Tyranny 3 · Displeasure =2 · +Service 1', '+Tyranny 5 · Displeasure =3']);

check('the Calendar and the Duchess’s bower',
  [lab('A Dream of Burgundy', 'Kneel'), lab('A Dream of Burgundy', 'Remain standing'), lab('A Dream of Burgundy', 'Make a face'),
    lab('The Duchess in her Bower', 'Let her be'), lab('Stella Splendens', 'Replace Burgundian June with Summer')],
  ['+Duchess 1', '−Tyranny 1', '−Tyranny 2', '+Duchess 2 · The Duchess in Her Bower =15', '+Summer 3']);

check('Queeneater’s Castle: Tatterdemalion’s three answers and the three histories',
  [lab('Tatters in Tatters', 'Reassure Tatterdemalion'), lab('Tatters in Tatters', 'Demand answers'), lab('Tatters in Tatters', 'Leave him be'),
    lab('Lost Script: the Performance', 'Request Tragedy'), lab('Missing Mask: the Performance', 'Play Comedy'),
    lab('Consummate Performer, Performing', 'Play History')],
  ['+Dawnseeker 3', '−Dawnseeker 3', '+Dawnseeker 1', '+Summer 3', '+Dawnseeker 3', '+Valentine 3']);

check('the choices the guide says matter to nothing say so, and the ones it is unsure of carry the mark',
  [lab('The Assembly', 'Object'), lab('Stella Splendens', 'Combine June and Summer'), lab('The Butcher’s Block', 'Play the Knave'),
    lab('Choirs Ignite', 'Destroy the Vulgate'), /⚠/.test(lab('The Merry Boughs of May', 'Follow a song')),
    /not sure of this one/.test(opt('Choirs Ignite', 'Destroy the Vulgate').title)],
  ['narrative only', 'no reputation change', 'narrative only ⚠', 'The Vulgate in defeat =2 ⚠', true, true]);

check('the wiki’s "Firmament: " storylets are found under the game’s bare heading, and the options inside are badged',
  (() => {
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    ['A Choice of Commissions', 'Firmament: A Choice of Commissions'].forEach((name) => {
      const head = makeHeading(name);
      const o = makeHeading('Give the order for your airship to be built');
      const stray = makeHeading('Something else');
      roots = [head];
      branches = [o, stray];
      api.firRatings();
      out.push([t(head, api.FIR_DEF.cls), t(o, api.FIR_DEF.branchCls), t(stray, api.FIR_DEF.branchCls)]);
      roots = [];
      branches = [];
    });
    return out;
  })(), [['1 choice', 'Firmament =35 · airship built in a week', null], ['1 choice', 'Firmament =35 · airship built in a week', null]]);

check('no option is filed under the same storylet in another feature’s table',
  (() => {
    const mine = api.FIR_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS, ...api.TLC_OPTIONS, ...api.ST_OPTIONS,
      ...api.ML_OPTIONS, ...api.IR_OPTIONS].map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'firmament'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
