// Ad-hoc test for FallenLondon/choice-helper.js's Plaster Face feature ('plaster-face') on the shared
// progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The guide's table of investigation options, row by row: what each rat pays on a success, what
//    a failure takes off Serenity, and the two purchases and the face-defacing.
//  - The story as a chain: every level from 0 to 9 has a step that sets the next, and the three
//    endings set 20 (kill, constables) or 15 (join the Big Rat).
//  - The guide's disagreements with the pages (Serenity 7 against 6, the Fate the page omits).
//  - The Alliance: Casing for three Talkers, a Bandit for fifteen Antique Mysteries.
//  - What the Running Battle feature owns is not here, and the four cards are badged in the hand.
//  - That no option is filed under the same storylet in another feature's table.
//
// Options come from the option pages on fallenlondon.wiki, fetched through the API on 2026-09-27,
// with Seeking the Meaning of the Plaster Face (Guide) as the cross-check.
//
//   node tests/choice-plaster-face.test.mjs

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
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, PF_CFG, PF_OPTIONS, PF_INDEX, PF_DEF, pfRatings, IR_OPTIONS, FIR_OPTIONS, HS_OPTIONS,'
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
const opt = (card, name) => api.PF_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const lab = (card, name) => opt(card, name).label;

check('every entry names its storylet and option, has a badge and a tooltip, and none repeats',
  [api.PF_OPTIONS.every((e) => e.storylet && e.name && e.label && e.title && e.color),
    new Set(api.PF_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.PF_OPTIONS.length],
  [true, true]);

check('the guide’s table of investigation options: what each rat pays on a success and takes on a failure',
  [lab('Investigating the Big Rat', 'Have the Talkative Rat ask the Big Rat’s guards'),
    lab('Investigating the Big Rat', 'Have the Working Rat drill a peephole into the Big Rat’s lair'),
    lab('Investigating the Big Rat', 'Have the Rattus Faber Bandit-Chief discover the Big Rat’s next move'),
    lab('Investigating the Big Rat', 'Let the Disgraced Rattus Faber Bandit-Chief loiter'),
    lab('Investigating the Big Rat', 'Make a contribution in Lamplighter Beeswax'),
    lab('Investigating the Big Rat', 'Send a lavish tribute of Foxfire Candles'),
    lab('Investigating the Big Rat', 'Deface the face')],
  ['HRMI +3 (60%) · Foxfire Candle Stub ×50 · fail Serenity −4', 'HRMI +1 (70%) · fail Serenity −1', 'HRMI +3 (80%) · fail Serenity −10',
    'HRMI +4 (50%) · fail Serenity −2', 'Serenity +1 · HRMI +3 · −Lump of Lamplighter Beeswax ×100',
    'HRMI +3 · Serenity +10 · −Foxfire Candle Stub ×500', 'Serenity −3? · fail Wounds +1, HRMI −1']);

check('the guide’s "exactly 15 CP": five HRMI needs, and the guide’s rare successes are on the rats',
  [/HRMI \+3/.test(opt('Investigating the Big Rat', 'Have the Talkative Rat ask the Big Rat’s guards').r.join(',')),
    opt('Investigating the Big Rat', 'Let the Disgraced Rattus Faber Bandit-Chief loiter').r,
    /ive successes with the Bandit or the Talker/.test(opt('Investigating the Big Rat', 'Have the Talkative Rat ask the Big Rat’s guards').title)],
  [true, ['HRMI +5'], true]);

check('the story is a chain: every level from 0 to 9 has a step that sets the next, and the endings set 15 or 20',
  (() => {
    const steps = {};
    api.PF_OPTIONS.filter((e) => e.at !== undefined).forEach((e) => {
      const m = e.w.map((x) => /^Plaster → (\d+)/.exec(x)).find(Boolean);
      if (m) (steps[e.at] = steps[e.at] || new Set()).add(Number(m[1]));
    });
    const chain = Array.from({ length: 10 }, (_, i) => steps[i] && [...steps[i]].join(','));
    const ends = ['Kill him', 'Hand him over to the Constables', 'What good would extermination do?'].map((n) => opt('Decide the fate of the Big Rat', n).w[0]);
    return [chain, ends];
  })(), [['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], ['Plaster → 20', 'Plaster → 20', 'Plaster → 15']]);

check('the ending payouts, and the guide’s Fate that the page lacks',
  [lab('Decide the fate of the Big Rat', 'Kill him'), lab('Decide the fate of the Big Rat', 'Hand him over to the Constables'),
    /1 Fate/.test(opt('Decide the fate of the Big Rat', 'Kill him').title)],
  ['Plaster → 20 · SaRC +3 · Piece of Rostygold ×2000', 'Plaster → 20 · Suspicion −15 · Piece of Rostygold ×500, Favours: Constables ×3', true]);

check('the guide and the page disagree, and the tooltip says so',
  [/guide gives 7 where the page says 6/.test(opt('Who Controls the Face?', 'Send a Talkative Rat into the upper room').title),
    opt('Who Controls the Face?', 'Send a Talkative Rat into the upper room').n,
    /lower Serenity all the way to 4/.test(opt('You Have Done Well', 'Attack psychologically').title)],
  [true, ['Serenity', 6], true]);

check('the Alliance: Casing for three Talkers as the guide says, a Bandit for fifteen Antique Mysteries',
  [lab('Alliance with the Big Rat', 'Purchase some assistance with Casing...'), lab('Alliance with the Big Rat', 'Acquire a new rat companion')],
  ['Casing +9 · −Talker ×3', 'Wounds +1 · +Bandit · −Antique Mystery ×15']);

check('what Running Battle already owns is not here: the five options of Gather your forces, the purchase and the Ambush',
  [api.PF_OPTIONS.some((e) => key(e.storylet) === key('Gather your forces against the Big Rat')),
    api.PF_OPTIONS.some((e) => key(e.storylet) === key('Spring the Ambush on the Big Rat')),
    api.PF_OPTIONS.some((e) => key(e.name) === key('Purchase some Running Battle assistance…'))],
  [false, false, false]);

check('the four cards are badged in the hand, and a step storylet is headed with its level',
  (() => {
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    const cards = ['Sartorial squeamishness', 'The Departed', 'The Albino Rat’s story', 'Rat Melancholy'].map(makeHeading);
    hand = cards;
    api.pfRatings();
    cards.forEach((c) => out.push(t(c, api.PF_DEF.cardCls)));
    hand = [];
    const head = makeHeading('Making Contacts');
    const o = makeHeading('Send the Talkative Rat');
    roots = [head];
    branches = [o];
    api.pfRatings();
    out.push(t(head, api.PF_DEF.cls), t(o, api.PF_DEF.branchCls));
    roots = [];
    branches = [];
    return out;
  })(), ['starts SaRC', 'SaRC by the pile', 'Albino Rat', 'the Albino Rat’s card', 'Plaster 5 → 6', 'Plaster → 6? · fail Serenity +10']);

check('no option is filed under the same storylet in another feature’s table',
  (() => {
    const mine = api.PF_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS, ...api.TLC_OPTIONS, ...api.ST_OPTIONS,
      ...api.ML_OPTIONS, ...api.IR_OPTIONS, ...api.FIR_OPTIONS, ...api.HS_OPTIONS].map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'plaster-face'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
