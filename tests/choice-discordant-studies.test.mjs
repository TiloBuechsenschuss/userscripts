// Ad-hoc test for FallenLondon/choice-helper.js's Discordant Studies feature ('discordant-studies') on
// the shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The road, step by step: Crystalline Knowledge climbing 1 to 6 and Cold Comfort 3 to 7 in the
//    guide's order, each step needing the level below it.
//  - The badge form: `Knowledge -> 2 · Cold Comfort -> 5`, and the wiki's numbered pages found
//    under the game's titles.
//  - Deeper Discordant Studies' tiers kept in the guide's order (Hint 1, Hint 2, the answer) in
//    the tooltip, and the Costs and Rewards guide's figures on the first deep step.
//  - The heading naming its steps, and the "Discordant Studies" storylet found under its bare title.
//  - That no option is filed under the same storylet in another feature's table.
//
// Options come from the option pages on fallenlondon.wiki, fetched through the API on 2026-09-26,
// with The Hurlers (Guide), Discordant Studies - Costs and Rewards and Deeper Discordant Studies
// as the cross-check.
//
//   node tests/choice-discordant-studies.test.mjs

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
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, HS_CFG, HS_OPTIONS, HS_INDEX, HS_DEF, hsRatings, IR_OPTIONS, FIR_OPTIONS,'
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
const opt = (card, name) => api.HS_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const lab = (card, name) => opt(card, name).label;

check('every entry names its step, storylet and option, has a badge and a tooltip, and none repeats',
  [api.HS_OPTIONS.every((e) => e.step && e.storylet && e.name && e.label && e.title && e.color),
    new Set(api.HS_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.HS_OPTIONS.length],
  [true, true]);

check('Crystalline Knowledge climbs by one at each of its steps, from 1 to 6, in the guide’s order',
  (() => {
    const at = api.HS_OPTIONS.filter((e) => /^Knowledge → \d/.test(e.label)).map((e) => [e.step, Number(/→ (\d+)/.exec(e.label)[1])]);
    const levels = at.map((x) => x[1]);
    const steps = at.map((x) => x[0]);
    return [levels, steps.every((s, i) => i === 0 || s >= steps[i - 1])];
  })(), [[1, 2, 3, 4, 5, 6], true]);

check('Cold Comfort climbs from 3 to 7 in the guide’s order, and each step needs the level below it',
  (() => {
    const cc = api.HS_OPTIONS.filter((e) => /Cold Comfort → \d/.test(e.label));
    const levels = cc.map((e) => Number(/Cold Comfort → (\d)/.exec(e.label)[1]));
    const needsBelow = cc.filter((e) => /Cold Comfort \d/.test(e.needs || ''))
      .every((e) => new RegExp('Cold Comfort ' + (Number(/Cold Comfort → (\d)/.exec(e.label)[1]) - 1)).test(e.needs));
    return [levels, needsBelow];
  })(), [[3, 4, 5, 6, 7], true]);

check('the steps of the road, badge by badge',
  [lab('Around the Embers', 'Speak with the Caprine Vagabond'), lab('The Steward’s Oath', 'Swear the oath'),
    lab('Speaking with the Steward', 'Discuss the Hurlers'), lab('Not Observing Anything', 'Don’t talk about the game'),
    lab('The Adulterine Castle', 'Approach the Anchoress'), lab('Speaking with the Steward', 'Discuss the Anchoress')],
  ['Knowledge → 1', 'Knowledge → 2 · Cold Comfort → 5 · Nightmares +11?', 'Cold Comfort → 3 · Trust → 0', 'Knowledge → 4 · Steward +1',
    'Knowledge → 5 · Memory of Discordance −1', 'Knowledge → 6']);

check('the wiki’s numbered pages are found under the game’s titles, and Open your eyes is one entry that says it has two levels',
  [api.HS_INDEX.some((r) => r.matches(key('Discuss the Hurlers again')) && r.storylet === key('Speaking with the Steward')),
    api.HS_INDEX.some((r) => r.matches(key('Approach the Anchoress')) && r.storylet === key('The Adulterine Castle')),
    api.HS_OPTIONS.filter((e) => key(e.name) === key('Open your eyes')).length,
    /two levels/.test(opt('On the Ice', 'Open your eyes').title)],
  [true, true, 1, true]);

check('Deeper Discordant Studies keeps the guide’s tiers in order: Hint 1, then Hint 2, then the answer',
  (() => {
    const withHints = api.HS_OPTIONS.filter((e) => e.hints);
    const ordered = withHints.every((e) => {
      const t = e.title;
      return t.indexOf('Hint 1:') < t.indexOf('Hint 2:') && t.indexOf('Hint 2:') < t.indexOf('Answer:') && e.hints.length === 3;
    });
    const seals = opt('On the Ice', 'Close your eyes').title;
    return [withHints.length, ordered, /What to do with what you found/.test(seals), /From there/.test(seals)];
  })(), [4, true, true, true]);

check('the first deep step carries the costs and rewards guide’s figures',
  (() => {
    const t = opt('Discordant Studies', 'Reflect upon a Memory of Discordance').title;
    return [/narrow 8 on Chess/.test(t), /broad 300 on Watchful/.test(t), /Crystalline Knowledge \+4 \(level 6 to 10\)/.test(t), /Advancing the Liberation of Night \+110/.test(t)];
  })(), [true, true, true, true]);

check('a step’s heading names its steps, and the "Discordant Studies" storylet is found under the game’s heading',
  (() => {
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const out = [];
    const head = makeHeading('Speaking with the Steward');
    roots = [head];
    api.hsRatings();
    out.push(t(head, api.HS_DEF.cls));
    roots = [];
    const h2 = makeHeading('Discordant Studies');
    const o = makeHeading('Reflect upon a Memory of Discordance');
    roots = [h2];
    branches = [o];
    api.hsRatings();
    out.push(t(o, api.HS_DEF.branchCls));
    roots = [];
    branches = [];
    return out;
  })(), ['step 3, 4, 6, 10, 11', 'Knowledge +1 · Steward +2 · Nightmares +11?']);

check('no option is filed under the same storylet in another feature’s table',
  (() => {
    const mine = api.HS_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS, ...api.TLC_OPTIONS, ...api.ST_OPTIONS,
      ...api.ML_OPTIONS, ...api.IR_OPTIONS, ...api.FIR_OPTIONS].map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'discordant-studies'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
