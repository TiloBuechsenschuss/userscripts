// Ad-hoc test for FallenLondon/choice-helper.js's Iron Republic feature ('iron-republic') on the
// shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The guide's table, row by row: every Day option is an entry with the doors the guide gives
//    (success day, failure day), and no Day option is missing from the guide.
//  - The graph itself: every door leads to a day that exists, every day is reachable from Day 1
//    and can reach Day 99, and Three devils is the one door that goes back.
//  - The badge form: the day, what it costs or pays, the failure's day and cost, `?` for a challenge.
//  - The guide's disagreements with the option pages, and what it prints in bold, in the tooltips.
//  - A Day heading naming its doors, Day 81 found under its bare wiki title, and an option inside
//    an open Day badged while a stray title is not.
//  - That no option is filed under the same storylet in another feature's table.
//
// Options come from the option pages on fallenlondon.wiki, fetched through the API on 2026-09-26,
// with Iron Republic Street Map as the cross-check.
//
//   node tests/choice-iron-republic.test.mjs

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
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, IR_CFG, IR_OPTIONS, IR_INDEX, IR_DEF, irRatings,'
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
const opt = (card, name) => api.IR_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const dayOf = (s) => { const m = /^Day (\d+),/.exec(s); return m ? Number(m[1]) : null; };

// The guide's table, row by row: day, option, success day, failure day (null where the row has none).
const GUIDE = [
  [1, 'Looking backwards', 12, 8], [8, 'Enjoy your facelessness', 12, null], [8, 'An exchange of knowledge', 15, 17],
  [8, 'Poking about (2 FATE)', 12, null], [12, 'The forbidding of subtraction, a sudden rain of unbecoming thoughts...', 19, 17],
  [15, 'One must also consider the nature of the speaker', 32, 23], [17, 'Run for it', 19, null], [17, 'In the thick', 27, 32],
  [19, 'Talk them down', 27, 32], [23, 'Arguments in the street', 30, null], [23, 'Nod and walk', 38, null],
  [27, 'Municipal amenities', 34, 34], [30, 'A lucky number', 32, 38], [32, 'Stuck in', 34, null], [32, 'Remaining safe', 38, null],
  [34, 'A firm hand', 38, null], [34, 'The hand of mercy', 40, null], [38, 'The wall', 40, null],
  [40, 'Express your disapproval', 42, null], [40, 'Look closer', 48, null], [40, 'Debate the Republic’s law', 51, 55],
  [42, 'Three devils', null, null], [48, 'A killing in trade', 55, 61], [51, 'Off to the party', 64, 71],
  [55, 'Half a thought', 61, null], [55, 'Looking back', 64, null], [61, 'Taking a look, carefully', 64, 81],
  [64, 'Opening a hole', 78, 81], [71, 'Going elsewhere', 78, null], [71, 'The Forest', 88, null],
  [78, 'Packed in', 'Day 99', null], [78, 'Enough! (2 FATE)', 'Day 99', null], [81, 'Righting alarm', 'Day 99', null],
  [88, 'Out and about', 'Day 99', null],
];

check('every row of the guide’s table is an entry with the same doors, and nothing else is a Day option',
  (() => {
    const bad = [];
    GUIDE.forEach(([day, name, to, toF]) => {
      const e = api.IR_OPTIONS.find((o) => (dayOf(o.storylet) === day || (day === 81 && /Day Numbers/.test(o.storylet))) && key(o.name) === key(name));
      if (!e) { bad.push(['missing', day, name]); return; }
      if ((e.to === undefined ? null : e.to) !== to || (e.toF === undefined ? null : e.toF) !== toF) bad.push([day, name, e.to, e.toF]);
    });
    const dayOptions = api.IR_OPTIONS.filter((o) => /^Day /.test(o.storylet) || /Day Numbers/.test(o.storylet)).length;
    return [bad, dayOptions === GUIDE.length];
  })(), [[], true]);

check('Three devils is the one door that goes back, to Day 8',
  [opt('Day 42, Forgotten Bronze Drum', 'Three devils').back, api.IR_OPTIONS.filter((o) => o.back !== undefined).length,
    opt('Day 42, Forgotten Bronze Drum', 'Three devils').label],
  [8, 1, 'back → Day 8 · Changed +2']);

check('the graph: every door leads to a day that exists, every day can be reached from Day 1, and every day can reach Day 99',
  (() => {
    const days = new Set([1, 81]);
    api.IR_OPTIONS.forEach((o) => { const d = dayOf(o.storylet); if (d) days.add(d); });
    const edges = {};
    api.IR_OPTIONS.forEach((o) => {
      const from = /Day Numbers/.test(o.storylet) ? 81 : dayOf(o.storylet);
      if (!from) return;
      const outs = [o.to, o.toF, o.back].filter((x) => x !== undefined).map((x) => (x === 'Day 99' ? 99 : x));
      (edges[from] = edges[from] || []).push(...outs);
    });
    const missing = [];
    Object.values(edges).flat().forEach((d) => { if (d !== 99 && !days.has(d)) missing.push(d); });
    const reach = (start, next) => { const seen = new Set([start]); const q = [start]; while (q.length) { const n = q.pop(); (next(n) || []).forEach((m) => { if (!seen.has(m)) { seen.add(m); q.push(m); } }); } return seen; };
    const fromOne = reach(1, (n) => edges[n]);
    const rev = {};
    Object.entries(edges).forEach(([f, ts]) => ts.forEach((t) => { (rev[t] = rev[t] || []).push(Number(f)); }));
    const toEnd = reach(99, (n) => rev[n]);
    return [missing, [...days].filter((d) => !fromOne.has(d)), [...days].filter((d) => !toEnd.has(d))];
  })(), [[], [], []]);

check('the badge names the day, the menace it costs and where a failure goes',
  [opt('Day 1, Hurled from High Places', 'Looking backwards').label,
    opt('Day 51, Eternity of Clarity', 'Off to the party').label,
    opt('Day 64, Clasped in Thunder', 'Opening a hole').label,
    opt('Day 8, Looking Back for Ever', 'Enjoy your facelessness').label],
  ['→ Day 12? · Wounds +5 · Scandal +2 · fail → Day 8 · Nightmares +3, Suspicion +3',
    '→ Day 64? · Scandal set to 3 · fail → Day 71 · Nightmares +1',
    '→ Day 78? · Proscribed Material ×75 · fail → Day 81 · Wounds +1',
    '→ Day 12 · Scandal +5 · Nightmares set to 3 · Hedonist +3 (up to 10)']);

check('the guide’s disagreements with the pages are in the tooltips, and what it bolds is named',
  [/guide gives Wounds 5/.test(opt('Day 27, Nobler Hunger', 'Municipal amenities').title),
    /guide gives no consequence on a success; the page adds Nightmares \+2/.test(opt('Day 8, Looking Back for Ever', 'An exchange of knowledge').title),
    /guide prints Soul −200 on a failure in bold/.test(opt('Day 48, Above Eagles', 'A killing in trade').title),
    /Costs 2 FATE/.test(opt('Day 78, Stars Barely Remembered', 'Enough! (2 FATE)').title)],
  [true, true, true, true]);

check('the way out has its eight options and the Renown: Hell 40 item',
  [api.IR_OPTIONS.filter((o) => o.storylet === 'A Day for Reading').length,
    opt('A Day Outside of Days', 'Open the gate').label],
  [8, 'Favours: Hell ×7 ▼ → Infernal Vinification Apparatus']);

check('a Day heading names the days its doors lead to, and Day 81 is found under its bare title',
  (() => {
    const out = [];
    [['Day 40, Talons Marking Solitude'], ['The Day Numbers Stopped Working']].forEach(([n]) => {
      const head = makeHeading(n);
      roots = [head];
      api.irRatings();
      const b = badgeOf(head, api.IR_DEF.cls);
      out.push(b && b.textContent);
      roots = [];
    });
    return out;
  })(), ['→ 42 / 48 / 51 / 55', '→ 99']);

check('an option inside an open Day is badged, and a stray title gets nothing',
  (() => {
    const t = (h) => { const b = badgeOf(h, api.IR_DEF.branchCls); return b && b.textContent; };
    const head = makeHeading('Day 40, Talons Marking Solitude');
    const good = makeHeading('Express your disapproval');
    const stray = makeHeading('Run for it');
    roots = [head];
    branches = [good, stray];
    api.irRatings();
    const out = [t(good), t(stray)];
    roots = [];
    branches = [];
    return out;
  })(), ['→ Day 42 · Suspicion +5', null]);

check('no option is filed under the same storylet in another feature’s table',
  (() => {
    const mine = api.IR_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS, ...api.TLC_OPTIONS, ...api.ST_OPTIONS, ...api.ML_OPTIONS]
      .map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'iron-republic'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
