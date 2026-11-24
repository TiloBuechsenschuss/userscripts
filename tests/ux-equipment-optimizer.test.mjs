// Ad-hoc test for FallenLondon/ux-enhancers.js's equipment optimizer.
//
// No test runner in this repo (see AGENTS.md): a standalone Node script that
// reads the userscript, evaluates its IIFE against a stub DOM and pulls out
// the internals.
//
// What it pins, with data from a real capture (2026-09-26, the game's own
// api.fallenlondon.com replies):
//
//  - The chance model: broad is 60% x level / difficulty, narrow is 60% + 10
//    points a level, both between 10% and 100%.
//  - Reading a challenge: `targetNumber` is the percentage the game SHOWS (and
//    floors), not a difficulty, so kind and difficulty are inferred from it and
//    the level. Real rows: Mithridacy 1 -> 3 took 60% to 80% and 20% to 40%;
//    Persuasive 270 -> 200 took 90% to 66% and 81% to 60%.
//  - The optimizer, exact: highest success chance, then fewest slots changed,
//    cross-checked against an exhaustive search.
//  - The API client, gear and level readers, and the planning glue.
//  - Applying an outfit, undoing it, and the button and result line.
//
//   node tests/ux-equipment-optimizer.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'ux-enhancers.js'), 'utf8');

let failures = 0;
const pending = [];
// `got` may be a function, so a missing feature FAILS the check instead of
// stopping the whole file on the first ReferenceError.
function check(label, got, expected) {
  let g;
  try {
    g = JSON.stringify(typeof got === 'function' ? got() : got);
  } catch (e) {
    g = 'THREW ' + (e && e.message);
  }
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
// Async checks run in order after ALL the sync code, so each starts from a
// signed-in state and sets up anything else itself.
function checkAsync(label, fn, expected) {
  pending.push(async () => {
    storage.setItem('access_token', '"tok-abc.123"');
    let g;
    try {
      g = JSON.stringify(await fn());
    } catch (e) {
      g = 'THREW ' + (e && e.message);
    }
    const e = JSON.stringify(expected);
    const ok = g === e;
    if (!ok) failures++;
    console.log((ok ? 'PASS' : 'FAIL'), '|', label);
    if (!ok) console.log('   expected:', e, '\n   got:     ', g);
  });
}

// --- stub DOM --------------------------------------------------------------

const docListeners = [];

function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    nodeType: 1,
    id: '',
    className: '',
    title: '',
    style: { cssText: '' },
    dataset: {},
    attrs: {},
    children: [],
    childNodes: [],
    parentNode: null,
    listeners: {},
    get parentElement() { return this.parentNode; },
    get isConnected() {
      let n = this;
      while (n.parentNode) n = n.parentNode;
      return n === doc.documentElement;
    },
    get textContent() {
      return this.childNodes.map((c) => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join('');
    },
    set textContent(v) {
      this.children = [];
      this.childNodes = [];
      if (v !== '' && v != null) this.appendChild(doc.createTextNode(v));
    },
    get previousElementSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.children.indexOf(this);
      return i > 0 ? this.parentNode.children[i - 1] : null;
    },
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.children.indexOf(this);
      return i >= 0 ? this.parentNode.children[i + 1] || null : null;
    },
    get nextSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.childNodes.indexOf(this);
      return i >= 0 ? this.parentNode.childNodes[i + 1] || null : null;
    },
    appendChild(c) {
      if (c.parentNode) c.remove();
      c.parentNode = this;
      this.childNodes.push(c);
      if (c.nodeType === 1) this.children.push(c);
      return c;
    },
    insertBefore(c, ref) {
      if (!ref) return this.appendChild(c);
      if (c.parentNode) c.remove();
      c.parentNode = this;
      this.childNodes.splice(this.childNodes.indexOf(ref), 0, c);
      if (c.nodeType === 1) {
        let j = this.children.length;
        for (let k = this.childNodes.indexOf(c) + 1; k < this.childNodes.length; k++) {
          const idx = this.children.indexOf(this.childNodes[k]);
          if (idx >= 0) { j = idx; break; }
        }
        this.children.splice(j, 0, c);
      }
      return c;
    },
    remove() {
      const p = this.parentNode;
      if (!p) return;
      p.childNodes = p.childNodes.filter((n) => n !== this);
      p.children = p.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    after() {},
    contains(other) {
      for (let n = other; n; n = n.parentNode) if (n === this) return true;
      return false;
    },
    closest(sel) {
      for (let n = this; n; n = n.parentNode) if (n.nodeType === 1 && matches(n, sel)) return n;
      return null;
    },
    cloneNode() {
      const copy = makeEl(this.tagName);
      copy.id = this.id;
      copy.className = this.className;
      copy.attrs = Object.assign({}, this.attrs);
      return copy;
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    // An event delivered to the node's listeners, then up its parents when it bubbles.
    dispatchEvent(ev) {
      ev.target = this;
      for (let n = this; n; n = n.parentNode) {
        (n.listeners && n.listeners[ev.type] || []).forEach((fn) => fn(ev));
        if (!ev.bubbles) break;
      }
      return true;
    },
    // A click as the browser delivers it: the document's capture listeners
    // first, then the node's own, then whatever React would have done.
    click() {
      const ev = { target: this, preventDefault() {}, stopPropagation() { this.stopped = true; } };
      docListeners.filter((l) => l.type === 'click' && l.capture).forEach((l) => l.fn(ev));
      (this.listeners.click || []).forEach((fn) => fn(ev));
      if (!ev.stopped && this.onReact) this.onReact();
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    querySelector(sel) { return descendants(this).find((n) => matches(n, sel)) || null; },
    querySelectorAll(sel) { return descendants(this).filter((n) => matches(n, sel)); },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  return el;
}

function descendants(root) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) { out.push(c); walk(c); }
  })(root);
  return out;
}

function matches(el, sel) {
  return sel.split(',').some((part) => matchesOne(el, part.trim()));
}
function matchesOne(el, sel) {
  const parts = sel.split(/\s+/).filter(Boolean);
  if (!matchesSimple(el, parts.pop())) return false;
  let node = el.parentNode;
  for (const want of parts.reverse()) {
    let found = false;
    for (; node; node = node.parentNode) {
      if (node.nodeType === 1 && matchesSimple(node, want)) {
        found = true;
        node = node.parentNode;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}
function matchesSimple(el, sel) {
  const idm = /^([a-zA-Z]*)#([\w-]+)$/.exec(sel);
  if (idm) return el.id === idm[2] && (!idm[1] || el.tagName === idm[1].toUpperCase());
  const m = /^([a-zA-Z]+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:([*^$]?=)"([^"]*)")?\])?$/.exec(sel);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  if (m[2]) {
    const classes = String(el.className).split(/\s+/);
    for (const c of m[2].split('.').filter(Boolean)) if (!classes.includes(c)) return false;
  }
  if (m[3]) {
    const v = m[3] === 'id' ? el.id : m[3] === 'class' ? el.className : m[3] === 'title' ? el.title : el.getAttribute(m[3]);
    if (v == null || v === '') return false;
    if (m[4] === '=' && v !== m[5]) return false;
    if (m[4] === '*=' && !v.includes(m[5])) return false;
    if (m[4] === '^=' && !v.startsWith(m[5])) return false;
    if (m[4] === '$=' && !v.endsWith(m[5])) return false;
  }
  return true;
}

const doc = {
  documentElement: null,
  body: null,
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), parentNode: null, remove() {} }),
  getElementById: (id) => descendants(doc.documentElement).find((n) => n.id === id) || null,
  querySelector: (sel) => descendants(doc.documentElement).find((n) => matches(n, sel)) || null,
  querySelectorAll: (sel) => descendants(doc.documentElement).filter((n) => matches(n, sel)),
  addEventListener(type, fn, capture) { docListeners.push({ type, fn, capture: !!capture }); },
  elementsFromPoint: () => [],
};
doc.documentElement = makeEl('html');
doc.body = doc.documentElement.appendChild(makeEl('body'));

const store = new Map();
const storage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};


const add = (parent, tag, className, props) => {
  const el = parent.appendChild(makeEl(tag));
  el.className = className || '';
  Object.assign(el, props || {});
  return el;
};

// --- load the script -------------------------------------------------------

// Everything the test reads out of the script. A name that does not exist yet
// comes back undefined, so its check fails by name rather than the file
// crashing.
const NAMES = [
  'EO_TIMING', 'challengeChance', 'inferChallenge', 'successChance', 'optimizeOutfit',
  'flApi', 'flToken',
  'gearFrom', 'levelOf', 'baseFor', 'branchFrom', 'requirementsFor',
  'planFor',
  'applySwaps', 'saveUndo', 'readUndo', 'clearUndo', 'undoFor', 'undoSwaps', 'saveResult', 'readResult', 'clearResult',
  'equipmentOptimizer',
  'STAT_CODES', 'statCode', 'keyFor', 'tempName', 'parseTemp', 'sameKey', 'freeTempName', 'chooseOutfit',
  'runOptimize', 'runUndo',
  'eoSoftIo', 'changeOutfitApi', 'renameOutfit', 'saveOutfit', 'storeInTemp', 'markTempUsed', 'readTempUsed',
  'emptySwaps', 'runEmpty', 'outfitEmptier', 'outfitEmptierOff',
];
const exposed = NAMES.map((n) => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ');
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/, 'return { ' + exposed + ' }; })();');

class StubEvent { constructor(type, init) { this.type = type; Object.assign(this, init || {}); } }

let fetchImpl = () => Promise.reject(new Error('no fetch stub set'));
let backHandler = () => {};
const historyStub = { back() { backHandler(); } };
const reloads = [];
const location = { pathname: '/', reload() { reloads.push(1); } };
// How the game lays out its button row, switchable per check: flex direction
// of `.storylet__buttons`, and the float of the Go button.
const layoutStub = { rowDirection: 'row', goFloat: 'none' };
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event', 'MouseEvent', 'KeyboardEvent', 'fetch', 'history',
  wrapped + '\nreturn globalThis.__flux;')(
  doc, class { observe() {} }, () => {}, (el) => (String(el && el.className).includes('storylet__buttons')
    ? { position: 'static', color: 'rgb(51, 51, 51)', display: 'flex', flexDirection: layoutStub.rowDirection }
    : String(el && el.className).includes('button--go')
    // Longhands only, the shorthands empty, as some browsers report them.
    ? { position: 'static', color: 'rgb(51, 51, 51)', height: '40px', padding: '', fontFamily: 'Lato', float: layoutStub.goFloat, cssFloat: layoutStub.goFloat,
      paddingTop: '0px', paddingRight: '20px', paddingBottom: '0px', paddingLeft: '20px',
      fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: '40px',
      borderRadius: '', borderTopLeftRadius: '2px', borderTopRightRadius: '2px', borderBottomRightRadius: '2px',
      borderBottomLeftRadius: '2px' }
    : { position: 'static', color: 'rgb(51, 51, 51)' }),
  console, URLSearchParams, storage, storage, location, class {}, StubEvent, StubEvent,
  (...args) => fetchImpl(...args), historyStub);

// --- the chance model ------------------------------------------------------

check('narrow: 60% at the difficulty', () => api.challengeChance('narrow', 1, 1), 0.6);
check('narrow: two levels up is 80%', () => api.challengeChance('narrow', 1, 3), 0.8);
check('narrow: the floor is 10%', () => api.challengeChance('narrow', 30, 0), 0.1);
check('narrow: the cap is 100%', () => api.challengeChance('narrow', 0, 9), 1);
check('broad: 60% at the difficulty', () => api.challengeChance('broad', 90, 90), 0.6);
check('broad: certain at five thirds of it', () => api.challengeChance('broad', 90, 150), 1);
check('broad: the floor is 10% too', () => api.challengeChance('broad', 900, 3), 0.1);

// --- reading a challenge, against the game's own numbers ------------------

const CH = (category, name, targetNumber, bonuses) => ({ category, name, targetNumber, bonuses: bonuses || [] });

// category, stat, level now, shown now, level after, what the game then showed.
// Rows from the 2026-09-26 capture (the same storylets under three outfits).
const REAL_ROWS = [
  ['Skills', 'Mithridacy', 1, 60, 3, 80],
  ['Skills', 'Mithridacy', 1, 20, 3, 40],
  ['BasicAbility', 'Persuasive', 270, 90, 266, 88],
  ['BasicAbility', 'Persuasive', 270, 90, 200, 66],
  ['BasicAbility', 'Persuasive', 270, 81, 266, 79],
  ['BasicAbility', 'Persuasive', 270, 81, 200, 60],
];
for (const [category, name, s0, p0, s1, shown] of REAL_ROWS) {
  check('predicts the game: ' + name + ' ' + s0 + ' -> ' + s1 + ' (' + p0 + '% -> ' + shown + '%)', () => {
    const c = api.inferChallenge(CH(category, name, p0), s0);
    const predicted = Math.floor(api.challengeChance(c.kind, c.diff, s1) * 100 + 1e-9);
    return Math.abs(predicted - shown) <= 1;
  }, true);
}
check('a Skills challenge is narrow, a BasicAbility broad',
  () => [api.inferChallenge(CH('Skills', 'Mithridacy', 60), 1).kind,
    api.inferChallenge(CH('BasicAbility', 'Persuasive', 90), 270).kind], ['narrow', 'broad']);
check('a percentage that is not a multiple of ten is broad, whatever the category',
  () => api.inferChallenge(CH('Skills', 'Zeefaring', 43), 20).kind, 'broad');
check('a stat at level 0 cannot be broad',
  () => api.inferChallenge(CH('BasicAbility', 'Watchful', 60), 0).kind, 'narrow');
// 10% is the floor: it hides how far below the difficulty you are (reported
// 2026-11-24: "Already the best" on a 10% Mithridacy challenge with Mithridacy
// gear owned). It is read as "at least this hard": the difficulty at which 10%
// is exact, so any gain in the stat counts and the most of it is worn.
check('10% narrow: at least level + 5, and marked as a floor',
  () => api.inferChallenge(CH('Skills', 'Mithridacy', 10), 1),
  { kind: 'narrow', diff: 6, terms: [{ stat: 'mithridacy', weight: 1 }], floor: true });
check('10% broad: at least six times the level, and marked as a floor',
  () => api.inferChallenge(CH('BasicAbility', 'Persuasive', 10), 200),
  { kind: 'broad', diff: 1200, terms: [{ stat: 'persuasive', weight: 1 }], floor: true });
check('10% at the floor still predicts exactly 10% now',
  () => { const c = api.inferChallenge(CH('Skills', 'Mithridacy', 10), 1); return api.challengeChance(c.kind, c.diff, 1); }, 0.1);
check('100% hides the headroom too: fixed, and the stat is held where it is',
  () => api.inferChallenge(CH('BasicAbility', 'Shadowy', 100), 151),
  { fixed: 1, hold: { stat: 'shadowy', min: 151 } });
check('a challenge that combines stats is not modelled',
  () => api.inferChallenge(CH('Skills', 'Neathproofed', 50, [{}]), 5), null);

// --- the optimizer ---------------------------------------------------------

// The real swap: Iron Hat (304) -> Beguiling Mask (310). Persuasive 263 -> 270
// and Dangerous 189 -> 183 in the capture, exactly the two items' bonuses.
const hatSlot = () => ({ name: 'Hat', items: [
  { id: 304, name: 'Iron Hat', equipped: true, bonus: { dangerous: 5, persuasive: -1 } },
  { id: 310, name: 'Beguiling Mask', equipped: false, bonus: { dangerous: -1, persuasive: 6 } },
] });
const persuasive90 = () => api.inferChallenge(CH('BasicAbility', 'Persuasive', 90), 263);
const dangerous99 = () => api.inferChallenge(CH('BasicAbility', 'Dangerous', 99), 189);

check('a Persuasive challenge takes the Beguiling Mask',
  () => api.optimizeOutfit([hatSlot()], { persuasive: 264 }, [persuasive90()], []).picks, [310]);
check('...and reaches the level the capture shows',
  () => api.optimizeOutfit([hatSlot()], { persuasive: 264 }, [persuasive90()], []).levels.persuasive, 270);
check('a Dangerous challenge keeps the Iron Hat',
  () => api.optimizeOutfit([hatSlot()], { dangerous: 184 }, [dangerous99()], []).picks, [304]);
check('nothing worth changing leaves the changes at zero',
  () => api.optimizeOutfit([hatSlot()], { dangerous: 184 }, [dangerous99()], []).changes, 0);

// Two challenges pulling opposite ways: the product is what counts.
const twoWay = () => {
  const slots = [
    { name: 'Hat', items: [
      { id: 'a', equipped: true, bonus: { persuasive: 10 } },
      { id: 'b', equipped: false, bonus: { mithridacy: 2 } },
    ] },
    { name: 'Gloves', items: [
      { id: 'c', equipped: true, bonus: {} },
      { id: 'd', equipped: false, bonus: { persuasive: 3 } },
    ] },
  ];
  const challenges = [
    { kind: 'narrow', diff: 1, terms: [{ stat: 'mithridacy', weight: 1 }] },
    { kind: 'broad', diff: 100, terms: [{ stat: 'persuasive', weight: 1 }] },
  ];
  return api.optimizeOutfit(slots, { mithridacy: 1, persuasive: 100 }, challenges, []);
};
check('two challenges: give up 10 Persuasive for +2 Mithridacy only where the product rises',
  () => twoWay().picks, ['b', 'd']);
check('two challenges: the winning product', () => Math.round(twoWay().chance * 1000), 494);

check('ties keep what you are wearing',
  () => api.optimizeOutfit([{ name: 'Hat', items: [
    { id: 1, equipped: false, bonus: { a: 5 } }, { id: 2, equipped: true, bonus: { a: 5 } }] }],
  { a: 0 }, [{ kind: 'narrow', diff: 0, terms: [{ stat: 'a', weight: 1 }] }], []).picks, [2]);
check('a fixed 100% challenge, held, stops the stat dropping',
  () => api.optimizeOutfit([hatSlot()], { persuasive: 264, dangerous: 184 },
    [api.inferChallenge(CH('BasicAbility', 'Dangerous', 100), 189),
      { kind: 'broad', diff: 175, terms: [{ stat: 'persuasive', weight: 1 }] }],
    [{ stat: 'dangerous', min: 189 }]).picks, [304]);
check('a range to stay inside beats a better chance outside it',
  () => api.optimizeOutfit([hatSlot()], { persuasive: 264, shadowy: 40 },
    [persuasive90()], [{ stat: 'persuasive', min: 260, max: 265 }]).picks, [304]);
check('no outfit meets an impossible requirement',
  () => api.optimizeOutfit([hatSlot()], { persuasive: 0 }, [persuasive90()],
    [{ stat: 'persuasive', min: 999 }]), null);
check('a weighted term counts its weight',
  () => api.successChance(
    [{ kind: 'broad', diff: 100, terms: [{ stat: 'shadowy', weight: 1 }, { stat: 'neathproofed', weight: 15 }] }],
    { shadowy: 40, neathproofed: 4 }), 0.6);
check('fixed challenges multiply in',
  () => api.successChance([{ fixed: 0.5 }, { fixed: 0.5 }], {}), 0.25);
check('a slot with only the worn item is left alone',
  () => api.optimizeOutfit([{ name: 'Ship', items: [{ id: 9, equipped: true, bonus: { a: 1 } }] }],
    { a: 0 }, [{ kind: 'narrow', diff: 0, terms: [{ stat: 'a', weight: 1 }] }], []).picks, [9]);

// Against an exhaustive search: seeded, so a failure reproduces.
(function bruteForce() {
  let seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const STATS = ['a', 'b', 'c'];
  let bad = 0;
  let infeasible = 0;
  const N = 600;
  for (let t = 0; t < N; t++) {
    const slots = [];
    for (let s = 0, ns = ri(1, 5); s < ns; s++) {
      const items = [];
      for (let i = 0, n = ri(1, 4); i < n; i++) {
        const bonus = {};
        STATS.forEach((st) => { if (rnd() < 0.5) bonus[st] = ri(-3, 6); });
        items.push({ id: s + ':' + i, equipped: false, bonus });
      }
      items[ri(0, items.length - 1)].equipped = true;
      slots.push({ name: 's' + s, items });
    }
    const base = { a: ri(0, 30), b: ri(0, 30), c: ri(0, 30) };
    const challenges = [];
    if (rnd() < 0.15) challenges.push({ fixed: 0.5 + rnd() * 0.5 });
    challenges.push({
      kind: rnd() < 0.5 ? 'broad' : 'narrow', diff: ri(5, 40),
      terms: [{ stat: 'a', weight: 1 }].concat(rnd() < 0.4 ? [{ stat: 'b', weight: 2 }] : []),
    });
    if (rnd() < 0.5) challenges.push({ kind: 'narrow', diff: ri(0, 30), terms: [{ stat: 'c', weight: 1 }] });
    const reqs = rnd() < 0.4
      ? [{ stat: 'c', min: ri(0, 25), max: rnd() < 0.5 ? ri(26, 60) : undefined }] : [];
    const got = api.optimizeOutfit ? api.optimizeOutfit(slots, base, challenges, reqs) : undefined;

    let bestP = -1;
    let bestChanges = 1e9;
    const rec = (i, S, ch) => {
      if (i === slots.length) {
        if (reqs.some((r) => S[r.stat] < (r.min == null ? -Infinity : r.min)
          || S[r.stat] > (r.max == null ? Infinity : r.max))) return;
        const p = api.successChance(challenges, S);
        if (p > bestP + 1e-12 || (Math.abs(p - bestP) <= 1e-12 && ch < bestChanges)) { bestP = p; bestChanges = ch; }
        return;
      }
      for (const it of slots[i].items) {
        const S2 = Object.assign({}, S);
        STATS.forEach((st) => { S2[st] += it.bonus[st] || 0; });
        rec(i + 1, S2, ch + (it.equipped ? 0 : 1));
      }
    };
    try {
      rec(0, Object.assign({}, base), 0);
    } catch (e) {
      bad++;
      break;
    }
    if (!got) {
      infeasible++;
      if (bestP >= 0) bad++;
    } else if (Math.abs(got.chance - bestP) > 1e-9 || got.changes !== bestChanges) {
      bad++;
    }
  }
  check('the optimizer matches an exhaustive search on ' + N + ' random outfits (' + infeasible + ' infeasible)', bad, 0);
})();

check('a pathological wardrobe (twelve slots of ten, three stats, a range) answers inside a second and says it is approximate', () => {
  let seed = 5;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const slots = [];
  for (let s = 0; s < 12; s++) {
    const items = [];
    for (let i = 0; i < 10; i++) {
      items.push({ id: s + ':' + i, equipped: i === 0,
        bonus: { a: Math.floor(rnd() * 12) - 3, b: Math.floor(rnd() * 12) - 3, c: Math.floor(rnd() * 8) - 2 } });
    }
    slots.push({ name: 's' + s, items });
  }
  const t0 = Date.now();
  const r = api.optimizeOutfit(slots, { a: 50, b: 50, c: 10 },
    [{ kind: 'broad', diff: 90, terms: [{ stat: 'a', weight: 1 }] },
      { kind: 'narrow', diff: 20, terms: [{ stat: 'c', weight: 1 }] }],
    [{ stat: 'b', min: 40, max: 200 }]);
  return [Date.now() - t0 < 1000, r.approx === true];
}, [true, true]);
check('a normal wardrobe is answered exactly, with no approx flag',
  () => api.optimizeOutfit([hatSlot()], { persuasive: 264 }, [persuasive90()], []).approx, undefined);

// --- the API client --------------------------------------------------------

const reply = (status, body) => Promise.resolve({
  status, ok: status >= 200 && status < 300, json: () => Promise.resolve(body),
});
const calls = [];
function stubFetch(handler) {
  calls.length = 0;
  fetchImpl = (url, init) => { calls.push({ url, init }); return handler(url, init); };
}

storage.removeItem('access_token');
check('no token: nothing is sent and the reason is "auth"', () => {
  stubFetch(() => reply(200, {}));
  return api.flToken();
}, '');
checkAsync('no token: the request is refused before fetch is called', async () => {
  storage.removeItem('access_token');
  stubFetch(() => reply(200, {}));
  try {
    await api.flApi('GET', '/api/outfit');
    return 'resolved';
  } catch (e) {
    return [e.kind, calls.length];
  }
}, ['auth', 0]);

storage.setItem('access_token', '"tok-abc.123"');
check('the token is read with its quotes stripped', () => api.flToken(), 'tok-abc.123');
storage.setItem('access_token', 'tok-bare');
check('a bare token is read as it is', () => api.flToken(), 'tok-bare');
storage.setItem('access_token', '"tok-abc.123"');

checkAsync('GET sends the bearer header to the game API and no body', async () => {
  stubFetch(() => reply(200, { slots: [] }));
  const out = await api.flApi('GET', '/api/outfit');
  const c = calls[0];
  return [out, c.url, c.init.method, c.init.headers.Authorization, 'body' in c.init];
}, [{ slots: [] }, 'https://api.fallenlondon.com/api/outfit', 'GET', 'Bearer tok-abc.123', false]);

checkAsync('POST sends a JSON body with its content type', async () => {
  stubFetch(() => reply(200, { isSuccess: true }));
  await api.flApi('POST', '/api/outfit/equip', { qualityId: 310 });
  const c = calls[0];
  return [c.init.method, c.init.body, c.init.headers['Content-Type']];
}, ['POST', '{"qualityId":310}', 'application/json']);

checkAsync('a POST with no body sends none', async () => {
  stubFetch(() => reply(200, {}));
  await api.flApi('POST', '/api/storylet');
  return ['body' in calls[0].init, 'Content-Type' in calls[0].init.headers];
}, [false, false]);

for (const [status, kind] of [[401, 'auth'], [403, 'auth'], [429, 'http'], [500, 'http']]) {
  checkAsync('HTTP ' + status + ' is a "' + kind + '" failure with its status', async () => {
    stubFetch(() => reply(status, {}));
    try {
      await api.flApi('GET', '/api/outfit');
      return 'resolved';
    } catch (e) {
      return [e.kind, e.status];
    }
  }, [kind, status]);
}

checkAsync('a fetch that throws is a "network" failure', async () => {
  stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
  try {
    await api.flApi('GET', '/api/outfit');
    return 'resolved';
  } catch (e) {
    return e.kind;
  }
}, 'network');

checkAsync('the token never appears in an error message', async () => {
  stubFetch(() => reply(401, {}));
  try {
    await api.flApi('GET', '/api/outfit');
    return 'resolved';
  } catch (e) {
    return String(e.message).includes('tok-abc');
  }
}, false);

checkAsync('a reply that is not JSON is an "http" failure, not a raw parse error', async () => {
  stubFetch(() => Promise.resolve({ status: 200, ok: true, json: () => Promise.reject(new SyntaxError('Unexpected token <')) }));
  try {
    await api.flApi('GET', '/api/outfit');
    return 'resolved';
  } catch (e) {
    return e.kind;
  }
}, 'http');

// --- reading levels, gear and the open storylet ---------------------------

// Items and stats from the 2026-09-26 capture (shapes trimmed to the fields the
// game sends that we read). Ids, names, categories, bonuses and levels are real.
const item = (id, name, category, enh) => ({
  id, name, category, equippable: true, level: 1, effectiveLevel: 1,
  enhancements: enh.map(([qualityName, level]) => ({ qualityName, level, category: 'BasicAbility' })),
});
const stat = (name, category, level, effectiveLevel) => ({
  id: 1, name, category, equippable: false, level, effectiveLevel, enhancements: [],
});
const MYSELF = {
  possessions: [
    { name: 'Hat', possessions: [
      item(304, 'Iron Hat', 'Hat', [['Dangerous', 5], ['Persuasive', -1]]),
      item(310, 'Beguiling Mask', 'Hat', [['Dangerous', -1], ['Persuasive', 6]]),
      item(312, 'Extraordinary Hat', 'Hat', [['Watchful', 8], ['Shadowy', -1], ['Dangerous', 2]]),
      item(556, 'Ridiculous Hat', 'Hat', [['Respectable', -1]]),
    ] },
    { name: 'Luggage', possessions: [
      item(147136, 'Ambiguous Portmanteau', 'Luggage', [['Respectable', 1], ['Shapeling Arts', 1]]),
      item(147174, 'Portable, Mutable, Unlosable Chess Set', 'Luggage', [['Persuasive', 6], ['Nightmares', 1], ['Bizarre', 1]]),
    ] },
    { name: 'Companion', possessions: [
      item(134971, 'The Minister of Culture', 'Companion', [['Persuasive', 10], ['Respectable', 1]]),
    ] },
    { name: 'Constant Companion', possessions: [
      item(143857, 'Incendiary Tastemaker', 'ConstantCompanion', [['Watchful', 1], ['Dreaded', 2]]),
    ] },
    // Not from the capture: a crew member, so a changeable EMPTY slot has an item.
    { name: 'Crew', possessions: [item(900001, 'A Test Crewman', 'Crew', [['Dangerous', 1]])] },
    { name: 'Basic abilities', possessions: [
      stat('Persuasive', 'BasicAbility', 200, 263), stat('Dangerous', 'BasicAbility', 180, 189),
      stat('Shadowy', 'BasicAbility', 140, 151), stat('Mithridacy', 'Skills', 0, 1),
    ] },
  ],
};
// GET /api/outfit as the game sent it, trimmed to the slots above.
const OUTFIT = { slots: [
  { name: 'Boon', canChange: false, isEffect: true, isOutfit: true },
  { name: 'Hat', qualityId: 304, canChange: true, isEffect: false, isOutfit: true },
  { name: 'Luggage', qualityId: 147174, canChange: true, isEffect: false, isOutfit: true },
  { name: 'Companion', qualityId: 134971, canChange: true, isEffect: false, isOutfit: true },
  { name: 'Treasure', canChange: true, isEffect: false, isOutfit: true },
  { name: 'Destiny', qualityId: 105300, canChange: false, isEffect: false, isOutfit: true },
  { name: 'Crew', canChange: true, isEffect: false, isOutfit: true },
  { name: 'Spouse', qualityId: 143857, canChange: false, isEffect: false, isOutfit: true },
], dirty: false, maxOutfits: 4, isFavourite: false, isSuccess: true };

const gear = () => api.gearFrom(OUTFIT, MYSELF);
check('slots you can change are offered when they hold something or you own something for them',
  () => gear().slots.map((s) => s.name), ['Hat', 'Luggage', 'Companion', 'Crew']);
check('a slot offers every item of its category, the worn one flagged',
  () => gear().slots[0].items.map((i) => [i.id, i.equipped]),
  [[304, true], [310, false], [312, false], [556, false]]);
check('bonuses are keyed by normalised stat name, negatives kept',
  () => [gear().slots[0].items[0].bonus, gear().slots[0].items[3].bonus],
  [{ dangerous: 5, persuasive: -1 }, { respectable: -1 }]);
check('an empty slot you own items for offers "nothing" as what is worn, then the items',
  () => gear().slots[3].items.map((i) => [i.id, i.name, i.equipped, i.bonus]),
  [[null, 'nothing', true, {}], [900001, 'A Test Crewman', false, { dangerous: 1 }]]);
check('an empty slot you own nothing for is not offered (Treasure)',
  () => gear().slots.some((s) => s.name === 'Treasure'), false);
check('the Spouse slot takes the ConstantCompanion category',
  () => api.gearFrom({ slots: [{ name: 'Spouse', qualityId: 143857, canChange: true, isEffect: false }] }, MYSELF)
    .slots.map((s) => [s.name, s.items.map((i) => i.id)]), [['Spouse', [143857]]]);
check('a slot named with a space takes the category without one',
  () => api.gearFrom({ slots: [{ name: 'Home Comfort', qualityId: 7, canChange: true, isEffect: false }] },
    { possessions: [{ name: 'Home Comfort', possessions: [item(7, 'A Hearth', 'HomeComfort', [['Watchful', 1]])] }] })
    .slots.map((s) => s.name), ['Home Comfort']);
check('a worn item the possessions do not list drops its slot instead of throwing',
  () => api.gearFrom({ slots: [{ name: 'Hat', qualityId: 999999, canChange: true, isEffect: false }] }, MYSELF).slots, []);

check('effective level is read off the stat; an unknown stat is null',
  () => [api.levelOf(MYSELF, 'persuasive'), api.levelOf(MYSELF, 'no such stat')], [263, null]);
check('base level takes off what the changeable gear worn now gives (Iron Hat -1, Chess Set +6, Minister +10)',
  () => api.baseFor(MYSELF, gear().slots, 'persuasive'), 263 - (-1 + 6 + 10));
check('base level of a stat no worn item touches is the effective level',
  () => api.baseFor(MYSELF, gear().slots, 'shadowy'), 151);

const STORYLET = { canChangeOutfit: true, phase: 'In', storylet: { childBranches: [
  { id: 255908, name: 'Reconcile newcomers to the halakha of the Neath', challenges: [], qualityRequirements: [] },
] } };
check('a branch is found by its id, given as a number or as the page\'s text',
  () => [api.branchFrom(STORYLET, 255908).name, api.branchFrom(STORYLET, '255908').id, api.branchFrom(STORYLET, 1)],
  ['Reconcile newcomers to the halakha of the Neath', 255908, null]);
check('no storylet at all is no branch',
  () => [api.branchFrom({}, 1), api.branchFrom(null, 1)], [null, null]);

// Requirement tooltips: every wording below is verbatim from the capture.
const req = (qualityName, status, tooltip) => ({ qualityName, status, tooltip });
const reqs = (...list) => api.requirementsFor({ qualityRequirements: list }, gear().slots, MYSELF);
check('a met requirement on something no gear changes needs no guard (Airs of Industry, 30-70)',
  () => reqs(req('Airs of Industry', 'Unlocked',
    "You unlocked this with <span class='quality-name'>Airs of Industry</span> 42 <em>(you needed 30-70)</em>")), []);
check('a met "needed 70" on a stat gear changes is a floor',
  () => reqs(req('Dangerous', 'Unlocked', 'You unlocked this with Dangerous 183 (you needed 70)')),
  [{ stat: 'dangerous', min: 70 }]);
check('a met range is a floor and a ceiling',
  () => reqs(req('Shadowy', 'Unlocked', 'You unlocked this with Shadowy 42 (you needed 30-70)')),
  [{ stat: 'shadowy', min: 30, max: 70 }]);
check('"at most" is a ceiling',
  () => reqs(req('Dangerous', 'Unlocked', 'You unlocked this with Dangerous 1 (you needed 50 at most)')),
  [{ stat: 'dangerous', max: 50 }]);
check('"exactly" is both',
  () => reqs(req('Dangerous', 'Unlocked', 'You unlocked this with any Dangerous (you needed exactly 0)')),
  [{ stat: 'dangerous', min: 0, max: 0 }]);
check('a tooltip with no number pins the stat where it is',
  () => reqs(req('Persuasive', 'Unlocked', 'You unlocked this by not having any Persuasive')),
  [{ stat: 'persuasive', min: 263, max: 263 }]);
check('a requirement you do not meet is not guarded',
  () => reqs(req('Dangerous', 'Locked', 'You need Dangerous 300 (you have 189)')), []);

// --- planning one action ---------------------------------------------------

// "Preach the doctrine of the Burrow Church" as the game sent it: Mithridacy
// 20% (a "high-risk" narrow skill challenge) and Persuasive 90% (broad).
const chal = (name, category, targetNumber, bonuses) => ({ name, category, targetNumber, bonuses: bonuses || [] });
const PREACH = {
  id: 255911, name: 'Preach the doctrine of the Burrow Church',
  challenges: [chal('Mithridacy', 'Skills', 20), chal('Persuasive', 'BasicAbility', 90)],
  qualityRequirements: [
    { qualityName: 'Airs of Industry', status: 'Unlocked', tooltip: 'You unlocked this with Airs of Industry 42 (you needed 40-60)' },
    { qualityName: 'A Church in the Wild', status: 'Locked', tooltip: 'You need A Church in the Wild 50' },
  ],
};
const storyletWith = (extra) => Object.assign({ canChangeOutfit: true, phase: 'In', storylet: { childBranches: [PREACH] } }, extra || {});
const planOf = (branch, extra) => api.planFor(branch, storyletWith(extra), OUTFIT, MYSELF);
check('a challenge shown at 10% is not "already the best": the gear with the most of the stat goes on', () => {
  const p = planOf(Object.assign({}, PREACH, { challenges: [chal('Persuasive', 'BasicAbility', 10)], qualityRequirements: [] }));
  return [p.status, p.swaps.map((s) => s.to.name), p.floored];
}, ['change', ['Beguiling Mask'], ['Persuasive']]);

check('a Persuasive challenge plans the swap from the Iron Hat to the Beguiling Mask',
  () => {
    const p = planOf(PREACH);
    return [p.status, p.swaps];
  },
  ['change', [{ slot: 'Hat', from: { id: 304, name: 'Iron Hat' }, to: { id: 310, name: 'Beguiling Mask' } }]]);
check('the plan is better than now, and "now" is the game\'s own 20% x 90%',
  () => {
    const p = planOf(PREACH);
    return [p.after > p.before, Math.abs(p.before - 0.2 * 0.905) < 0.005];
  }, [true, true]);
check('the plan says what the game should show afterwards, per challenge, floored',
  () => {
    const p = planOf(PREACH);
    return [p.predicted.map((x) => x.name), p.predicted[0].shown, p.predicted[1].shown >= 91];
  }, [['Mithridacy', 'Persuasive'], 20, true]);
check('an empty slot is filled when an item helps a challenge (a Dangerous +1 crewman for a Dangerous challenge)',
  () => {
    const p = planOf(Object.assign({}, PREACH, { challenges: [chal('Dangerous', 'BasicAbility', 90)] }));
    return [p.status, p.swaps];
  },
  ['change', [{ slot: 'Crew', from: { id: null, name: 'nothing' }, to: { id: 900001, name: 'A Test Crewman' } }]]);
check('an empty slot stays empty when no item helps (the crewman gives only Dangerous)',
  () => planOf(PREACH).swaps.map((s) => s.slot), ['Hat']);
check('the inferred challenges are kept for the check after the run',
  () => planOf(PREACH).challenges.map((c) => c.kind), ['narrow', 'broad']);

check('a Dangerous challenge at 100% is fixed and the outfit is already the best',
  () => planOf(Object.assign({}, PREACH, { challenges: [chal('Dangerous', 'BasicAbility', 100)] })).status, 'already');
check('a met requirement range on Persuasive keeps the Iron Hat, so nothing changes',
  () => planOf(Object.assign({}, PREACH, {
    qualityRequirements: [{ qualityName: 'Persuasive', status: 'Unlocked', tooltip: 'You unlocked this with Persuasive 263 (you needed 30-263)' }],
  })).status, 'already');
check('a 100% challenge on Dangerous holds Dangerous, which stops the Persuasive swap that would drop it',
  () => planOf(Object.assign({}, PREACH, {
    challenges: [chal('Persuasive', 'BasicAbility', 60), chal('Dangerous', 'BasicAbility', 100)],
  })).status, 'already');

const O = (id, name, selected) => ({ id, name, selected: !!selected, type: 'Standard' });
const PL = (stats, status) => ({ status: status || 'change', stats });
check('plan lists the stats it models, not Luck', () => planOf(Object.assign({}, PREACH, {
  challenges: PREACH.challenges.concat([chal('Luck', 'Luck', 50)]) })).stats, ['Mithridacy', 'Persuasive']);
check('stat outfit by game name', () => api.chooseOutfit(PL(['Persuasive']), [O(1, 'persuasive '), O(2, 'temp1')], {}).kind, 'stat');
check('stat outfit by code', () => api.chooseOutfit(PL(['Persuasive']), [O(1, 'PER')], {}).outfit.id, 1);
check('no other word forms', () => api.chooseOutfit(PL(['Persuasive']), [O(1, 'Persuasion')], {}).kind, 'none');
check('two stats never pick a stat outfit', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(1, 'Watchful'), O(2, 'tempWatGla')], {}),
  { kind: 'hit', outfit: O(2, 'tempWatGla'), codes: ['Gla', 'Wat'] });
check('stat beats temp hit', () => api.chooseOutfit(PL(['Watchful']), [O(2, 'tempWat'), O(1, 'Wat')], {}).outfit.id, 1);
check('hit applies even when already best', () => api.chooseOutfit(PL(['Watchful'], 'already'), [O(2, 'tempWat')], {}).kind, 'hit');
check('store: free temp first', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(3, 'tempDan'), O(4, 'temp2')], {}).outfit.id, 4);
check('store: least recently used keyed temp', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(3, 'tempDan'), O(5, 'tempSha')], { 3: 200, 5: 100 }).outfit.id, 5);
check('store: never when already best', () => api.chooseOutfit(PL(['Watchful', 'Glasswork'], 'already'), [O(4, 'temp2')], {}), { kind: 'none', reason: 'already' });
check('no code: no lookup, says which', () => api.chooseOutfit(PL(['Watchful', 'Nightmares']), [O(4, 'temp2')], {}), { kind: 'none', reason: 'no-code', missing: ['Nightmares'] });
check('no temp at all', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(1, 'Watchful')], {}), { kind: 'none', reason: 'no-temp' });

const blocked = (branch, extra) => {
  const p = planOf(branch, extra);
  return [p.status, p.reason];
};
check('no challenges, no plan',
  () => blocked(Object.assign({}, PREACH, { challenges: [] })), ['blocked', 'no-challenge']);
check('a branch the storylet no longer has, no plan', () => blocked(null), ['blocked', 'no-branch']);
check('a challenge that combines stats is refused',
  () => blocked(Object.assign({}, PREACH, { challenges: [chal('Persuasive', 'BasicAbility', 50, [{}])] })),
  ['blocked', 'combined']);
check('a storylet the game will not let you change outfit in',
  () => blocked(PREACH, { canChangeOutfit: false }), ['blocked', 'cannot-change']);
check('not being inside a storylet',
  () => blocked(PREACH, { phase: 'Available' }), ['blocked', 'not-in-storylet']);
// Reported 2026-09-26: "Could not read your level in a stat this challenge
// tests." A quality with no possession is level 0 (a skill you have not
// started), and one that nothing you wear touches is left as the game shows it
// and NAMED, instead of refusing the whole action.
check('a challenge on something you have no level in and nothing you wear changes is left as shown, and named',
  () => {
    const p = planOf(Object.assign({}, PREACH, { challenges: [chal('Luck', 'Luck', 50), chal('Persuasive', 'BasicAbility', 90)] }));
    return [p.status, p.ignored, p.predicted[0], p.swaps.map((s) => s.slot)];
  }, ['change', ['Luck'], { name: 'Luck', shown: 50 }, ['Hat']]);
check('a plan with nothing else to do still names what it did not count',
  () => {
    const p = planOf(Object.assign({}, PREACH, { challenges: [chal('Luck', 'Luck', 50)] }));
    return [p.status, p.ignored];
  }, ['already', ['Luck']]);
check('a stat with no possession that something you own boosts counts as level 0 plus what you wear',
  () => {
    const p = planOf(Object.assign({}, PREACH, { challenges: [chal('Watchful', 'BasicAbility', 50)] }));
    return [p.status, p.swaps.map((s) => s.to.name), p.ignored];
  }, ['change', ['Extraordinary Hat'], []]);
check('the base of a stat with no possession is 0, whatever is worn',
  () => api.baseFor(MYSELF, gear().slots, 'watchful'), 0);

// --- applying an outfit, and undoing it ------------------------------------

const SWAP_HAT = { slot: 'Hat', from: { id: 304, name: 'Iron Hat' }, to: { id: 310, name: 'Beguiling Mask' } };
const SWAP_LUGGAGE = { slot: 'Luggage', from: { id: 147174, name: 'Chess Set' }, to: { id: 147136, name: 'Ambiguous Portmanteau' } };

// A stand-in for the game: `equip` answers with the slots as they would be.
function fakeGame(behaviour) {
  const sent = [];
  const worn = { Hat: 304, Luggage: 147174 };
  const slotOf = { 310: 'Hat', 304: 'Hat', 147136: 'Luggage', 147174: 'Luggage', 900001: 'Crew' };
  const call = async (method, path, body) => {
    sent.push([method, path, body]);
    if (path === '/api/outfit/unequip') {
      if (!(behaviour && behaviour.ignore === body.qualityId)) delete worn[slotOf[body.qualityId]];
      return { isSuccess: !(behaviour && behaviour.fail === body.qualityId), slots: Object.keys(worn).map((name) => ({ name, qualityId: worn[name] })) };
    }
    if (behaviour && behaviour.fail === body.qualityId) return { isSuccess: false, slots: [] };
    if (behaviour && behaviour.throwOn === body.qualityId) throw Object.assign(new Error('offline'), { kind: 'network' });
    if (!(behaviour && behaviour.ignore === body.qualityId)) worn[slotOf[body.qualityId]] = body.qualityId;
    return { isSuccess: true, slots: Object.keys(worn).map((name) => ({ name, qualityId: worn[name] })) };
  };
  return { call, sent, worn };
}

checkAsync('each swap is one equip call, in order, one at a time, by item id', async () => {
  const g = fakeGame();
  const out = await api.applySwaps([SWAP_HAT, SWAP_LUGGAGE], g.call);
  return [g.sent, out.done.length, out.failed];
}, [[['POST', '/api/outfit/equip', { qualityId: 310 }], ['POST', '/api/outfit/equip', { qualityId: 147136 }]], 2, null]);

checkAsync('no swaps, no calls', async () => {
  const g = fakeGame();
  const out = await api.applySwaps([], g.call);
  return [g.sent.length, out.done, out.failed];
}, [0, [], null]);

checkAsync('a reply that says it failed stops the run; nothing after it is sent', async () => {
  const g = fakeGame({ fail: 310 });
  const out = await api.applySwaps([SWAP_HAT, SWAP_LUGGAGE], g.call);
  return [g.sent.length, out.done.length, out.failed && out.failed.slot];
}, [1, 0, 'Hat']);

checkAsync('a success that leaves the slot unchanged is a failure, not a success', async () => {
  const g = fakeGame({ ignore: 310 });
  const out = await api.applySwaps([SWAP_HAT, SWAP_LUGGAGE], g.call);
  return [out.done.length, out.failed && out.failed.slot];
}, [0, 'Hat']);

checkAsync('the swaps that worked before a failure are reported as done', async () => {
  const g = fakeGame({ fail: 147136 });
  const out = await api.applySwaps([SWAP_HAT, SWAP_LUGGAGE], g.call);
  return [out.done.map((s) => s.slot), out.failed && out.failed.slot];
}, [['Hat'], 'Luggage']);

checkAsync('a thrown error is returned with the swap it stopped on, not rethrown', async () => {
  const g = fakeGame({ throwOn: 310 });
  const out = await api.applySwaps([SWAP_HAT], g.call);
  return [out.failed.slot, out.error.kind, out.done];
}, ['Hat', 'network', []]);

const FILL_CREW = { slot: 'Crew', from: { id: null, name: 'nothing' }, to: { id: 900001, name: 'A Test Crewman' } };
checkAsync('filling an empty slot is an equip call, and emptying it again is an unequip of the item worn', async () => {
  const g = fakeGame();
  const filled = await api.applySwaps([FILL_CREW], g.call);
  const emptied = await api.applySwaps([{ slot: 'Crew', from: { id: 900001, name: 'A Test Crewman' }, to: { id: null, name: 'nothing' } }], g.call);
  return [g.sent, filled.failed, emptied.failed, g.worn.Crew];
}, [[['POST', '/api/outfit/equip', { qualityId: 900001 }], ['POST', '/api/outfit/unequip', { qualityId: 900001 }]], null, null, undefined]);
checkAsync('an unequip after which the slot still holds the item is a failure', async () => {
  const g = fakeGame({ ignore: 900001 });
  g.worn.Crew = 900001;
  const out = await api.applySwaps([{ slot: 'Crew', from: { id: 900001, name: 'A Test Crewman' }, to: { id: null, name: 'nothing' } }], g.call);
  return out.failed && out.failed.slot;
}, 'Crew');

// Undo records.
check('an undo record round-trips', () => {
  storage.removeItem('fl-ux-equip-undo');
  api.saveUndo({ branchId: 255911, restore: [{ slot: 'Hat', id: 304, name: 'Iron Hat' }] });
  const r = api.readUndo();
  return [r.branchId, r.restore];
}, [255911, [{ slot: 'Hat', id: 304, name: 'Iron Hat' }]]);
check('an undo record older than 30 minutes is dropped', () => {
  storage.removeItem('fl-ux-equip-undo');
  api.saveUndo({ branchId: 1, restore: [], at: Date.now() - 31 * 60 * 1000 });
  return api.readUndo();
}, null);
check('a corrupt undo record reads as nothing', () => {
  storage.setItem('fl-ux-equip-undo', '{not json');
  return api.readUndo();
}, null);
check('clearing removes it', () => {
  api.saveUndo({ branchId: 1, restore: [] });
  api.clearUndo();
  return api.readUndo();
}, null);
check('the record for a run keeps what each changed slot held, and undoing equips those back',
  () => {
    const rec = api.undoFor([SWAP_HAT, SWAP_LUGGAGE], 255911);
    return [rec.restore, api.undoSwaps(rec).map((s) => [s.slot, s.to.id])];
  },
  [[{ slot: 'Hat', id: 304, name: 'Iron Hat', was: 310, wasName: 'Beguiling Mask' },
    { slot: 'Luggage', id: 147174, name: 'Chess Set', was: 147136, wasName: 'Ambiguous Portmanteau' }],
  [['Hat', 304], ['Luggage', 147174]]]);
check('undoing a filled slot empties it: the item to take out is remembered',
  () => {
    const rec = api.undoFor([FILL_CREW], 255911);
    return [rec.restore, api.undoSwaps(rec)];
  },
  [[{ slot: 'Crew', id: null, name: 'nothing', was: 900001, wasName: 'A Test Crewman' }],
    [{ slot: 'Crew', from: { id: 900001, name: 'A Test Crewman' }, to: { id: null, name: 'nothing' } }]]);

// Result lines shown after the page reloads.
check('a result line round-trips and keeps its branch', () => {
  storage.removeItem('fl-ux-equip-result');
  api.saveResult({ branchId: 255911, lines: ['Chance 18% -> 27%'], undoable: true });
  const r = api.readResult();
  return [r.branchId, r.lines, r.undoable];
}, [255911, ['Chance 18% -> 27%'], true]);
check('a result older than 30 minutes is dropped, and a corrupt one reads as nothing', () => {
  storage.removeItem('fl-ux-equip-result');
  api.saveResult({ branchId: 1, lines: ['x'], at: Date.now() - 31 * 60 * 1000 });
  const old = api.readResult();
  storage.setItem('fl-ux-equip-result', 'nope');
  return [old, api.readResult()];
}, [null, null]);
check('clearing a result removes it', () => {
  api.saveResult({ branchId: 1, lines: ['x'] });
  api.clearResult();
  return api.readResult();
}, null);

// --- the button, the run, and the result line ------------------------------

// The page: one action list with the "Preach..." branch as the game draws it
// (class names from the 2026-09-26 capture of a real branch), and a second
// branch that has no challenge at all.
function branchEl(parent, id, withChallenges) {
  const b = add(parent, 'div', 'media branch media--branch');
  b.setAttribute('data-branch-id', String(id));
  const body = add(b, 'div', 'media__body branch__body');
  add(body, 'h2', 'media__heading heading heading--3 branch__title').textContent = 'A branch ' + id;
  if (withChallenges) {
    const box = add(body, 'div', 'challenges');
    for (const [stat, text] of [['Mithridacy', 'A chancy challenge'], ['Persuasive', 'A low-risk challenge']]) {
      const c = add(add(box, 'div', 'challenge-and-second-chance'), 'div', 'challenge');
      const icon = add(add(c, 'div', 'challenge__left'), 'div', 'js-icon icon icon--circular challenge__icon');
      add(icon, 'img').setAttribute('alt', stat);
      add(add(c, 'div', 'challenge__body'), 'h3', 'challenge__heading').textContent = text;
    }
  }
  const buttons = add(body, 'div', 'buttons storylet__buttons');
  add(buttons, 'button', 'js-tt button button--primary button--go').textContent = 'Go';
  return b;
}

const eoPage = add(doc.body, 'div', 'storylet-page');
function resetPage() {
  for (const child of eoPage.children.slice()) child.remove();
  return [branchEl(eoPage, 255911, true), branchEl(eoPage, 255912, false)];
}
const eoWrap = (b) => b.querySelector('.fl-ux-eo');
// The words only: the buttons in the panel are not part of the message.
const eoLine = (b) => {
  const line = b.querySelector('.fl-ux-eo-line');
  return line ? line.children.filter((c) => c.tagName === 'DIV').map((c) => c.textContent).join('\n') : '';
};
const eoButton = (b) => b.querySelector('.fl-ux-eo-run');

async function waitFor(cond, ms) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > (ms || 1500)) return false;
    await new Promise((r) => setTimeout(r, 1));
  }
  return true;
}

// The game, as far as this feature can see it. The truth is a Persuasive
// difficulty of 175 (broad): 0.6 x level / 175, shown floored, so 263 shows 90.
// Worn items change the level exactly by their bonuses, as the capture showed.
function fakeServer(opts) {
  opts = opts || {};
  const worn = { Hat: 304, Luggage: 147174, Companion: 134971 };
  const items = {};
  for (const g of MYSELF.possessions) {
    for (const p of g.possessions) if (p.equippable) items[p.id] = p;
  }
  const bonus = (name) => Object.keys(worn).reduce((n, slot) => n + (items[worn[slot]].enhancements
    .filter((e) => e.qualityName === name).reduce((m, e) => m + e.level, 0)), 0);
  // `burden`: { outfit name: n } -- that outfit carries something no gear
  // changes that takes n off Persuasive (a burden, say).
  const burden = () => ((opts.burden || {})[(selectedOutfit() || {}).name] || 0);
  const level = () => 248 + bonus('Persuasive') - burden();
  const shown = () => opts.stuck ? 90 : Math.floor(0.6 * level() / 175 * 100 + 1e-9);
  // The Dangerous scenario: broad, true difficulty 200, base 184 (189 with the Iron Hat).
  const dangerousLevel = () => 184 + bonus('Dangerous');
  const dangerousShown = () => Math.floor(0.6 * dangerousLevel() / 200 * 100 + 1e-9);
  const log = [];
  const outfitList = (opts.outfits || [{ id: 6065356, name: 'Dangerous', selected: true, type: 'Standard' }])
    .map((o) => Object.assign({ type: 'Standard' }, o));
  const saved = {};
  for (const o of outfitList) saved[o.id] = Object.assign({}, (opts.saved || {})[o.id] || worn);
  let dirty = !!opts.dirty;
  let changes = 0;
  const selectedOutfit = () => outfitList.filter((o) => o.selected)[0];
  // `needDangerous`: the branch needs at least that much Dangerous, a stat
  // none of its challenges tests; unmet, the branch is locked.
  const needMet = () => !opts.needDangerous || dangerousLevel() >= opts.needDangerous;
  const slotsNow = () => OUTFIT.slots.map((s) => (worn[s.name] ? Object.assign({}, s, { qualityId: worn[s.name] })
    : ['Hat', 'Luggage', 'Companion'].includes(s.name) ? Object.assign({}, s, { qualityId: undefined }) : s));
  fetchImpl = async (url, init) => {
    const path = url.replace('https://api.fallenlondon.com', '');
    log.push([init.method, path, init.body ? JSON.parse(init.body) : undefined, init.headers.Authorization]);
    if (opts.gate) await opts.gate;
    if (path === '/api/character/myself') {
      const copy = JSON.parse(JSON.stringify(MYSELF));
      copy.character = { outfits: JSON.parse(JSON.stringify(outfitList)), canChangeOutfit: opts.cannotChange !== true };
      for (const g of copy.possessions) {
        for (const p of g.possessions) {
          if (p.name === 'Persuasive') p.effectiveLevel = level();
          if (p.name === 'Dangerous' && !p.equippable) p.effectiveLevel = dangerousLevel();
        }
      }
      return reply(200, copy);
    }
    if (path === '/api/outfit') return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty }));
    if (path === '/api/storylet') {
      return reply(200, { canChangeOutfit: opts.cannotChange !== true, phase: 'In', storylet: { childBranches: [Object.assign({}, PREACH, {
        // `lockedIn`: the action locks while the outfit of that name is selected.
        isLocked: (!!opts.lockedIn && (selectedOutfit() || {}).name === opts.lockedIn) || !needMet(),
        challenges: opts.dangerous
          ? [chal('Dangerous', 'BasicAbility', dangerousShown())]
          : opts.persuasive ? [chal('Persuasive', 'BasicAbility', shown())]
          : [chal('Mithridacy', 'Skills', 20), chal('Persuasive', 'BasicAbility', shown())]
            .concat(opts.luck ? [chal('Luck', 'Luck', 50)] : []),
        qualityRequirements: opts.needDangerous ? [needMet()
          ? { qualityName: 'Dangerous', status: 'Unlocked',
            tooltip: 'You unlocked this with Dangerous ' + dangerousLevel() + ' <em>(you needed ' + opts.needDangerous + ')</em>' }
          : { qualityName: 'Dangerous', status: 'Locked', tooltip: 'You need Dangerous ' + opts.needDangerous }] : [],
      })] } });
    }
    if (path === '/api/outfit/unequip') {
      const id = JSON.parse(init.body).qualityId;
      if (opts.failUnequip) return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: false }));
      delete worn[items[id].category];
      dirty = true;
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: true }));
    }
    if (path === '/api/outfit/equip') {
      const id = JSON.parse(init.body).qualityId;
      if (opts.failEquip) return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: false }));
      worn[items[id].category] = id;
      dirty = true;
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: true }));
    }
    if (path === '/api/outfit/change') {
      const id = JSON.parse(init.body).outfitId;
      changes++;
      // `failChangeFrom`: the n-th change call and every one after it fail.
      if (opts.failChange || (opts.failChangeFrom && changes >= opts.failChangeFrom)) return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty, isSuccess: false }));
      for (const k of Object.keys(worn)) delete worn[k];
      Object.assign(worn, saved[id]);
      for (const o of outfitList) o.selected = o.id === id;
      dirty = false;
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty, isSuccess: true }));
    }
    if (path === '/api/outfit/rename') {
      const body = JSON.parse(init.body);
      if (opts.failRename === body.newName) return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty, isSuccess: false }));
      outfitList.filter((o) => o.id === body.outfitId)[0].name = body.newName;
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty, isSuccess: true, message: 'renamed' }));
    }
    if (path === '/api/outfit/save') {
      if (opts.failSave) return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty, isSuccess: false }));
      saved[selectedOutfit().id] = Object.assign({}, worn);
      dirty = false;
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), dirty, isSuccess: true }));
    }
    return reply(404, {});
  };
  return { worn, log, saved, outfits: () => JSON.parse(JSON.stringify(outfitList)),
    calls: (path) => log.filter((c) => c[1] === path), equips: () => log.filter((c) => c[1] === '/api/outfit/equip').map((c) => c[2].qualityId) };
}

checkAsync('store: free name, save, key name, in that order', async () => {
  const s = fakeServer({ outfits: [{ id: 7, name: 'tempDan', selected: true }, { id: 8, name: 'temp1' }] });
  const r = await api.storeInTemp({ id: 7, name: 'tempDan' }, ['Gla', 'Wat'], s.outfits(), api.flApi);
  return [r, s.log.filter((c) => c[1].startsWith('/api/outfit/')).map((c) => [c[1], c[2]])];
}, [{ ok: true, name: 'tempGlaWat' }, [
  ['/api/outfit/rename', { outfitId: 7, newName: 'temp2' }],
  ['/api/outfit/save', undefined],
  ['/api/outfit/rename', { outfitId: 7, newName: 'tempGlaWat' }]]]);
checkAsync('store: a free temp is not renamed first', async () => {
  const s = fakeServer({ outfits: [{ id: 8, name: 'temp1', selected: true }] });
  await api.storeInTemp({ id: 8, name: 'temp1' }, ['Wat'], s.outfits(), api.flApi);
  return s.calls('/api/outfit/rename').length;
}, 1);
checkAsync('store: last rename fails, the free name stays (Review Focus 5)', async () => {
  const s = fakeServer({ failRename: 'tempWat', outfits: [{ id: 7, name: 'tempDan', selected: true }] });
  return api.storeInTemp({ id: 7, name: 'tempDan' }, ['Wat'], s.outfits(), api.flApi);
}, { ok: false, name: 'temp1' });
checkAsync('store: save fails, no key is written', async () => {
  const s = fakeServer({ failSave: true, outfits: [{ id: 8, name: 'temp1', selected: true }] });
  const r = await api.storeInTemp({ id: 8, name: 'temp1' }, ['Wat'], s.outfits(), api.flApi);
  return [r, s.calls('/api/outfit/rename').length];
}, [{ ok: false, name: 'temp1' }, 0]);
check('temp use times survive a broken store', () => { storage.setItem('fl-ux-temp-used', '{bad'); return api.readTempUsed(); }, {});

function freshWorld(opts) {
  storage.removeItem('fl-ux-equip-undo');
  storage.removeItem('fl-ux-equip-result');
  storage.removeItem('fl-ux-equip-calc');
  storage.setItem('access_token', '"tok-abc.123"');
  reloads.length = 0;
  return { server: fakeServer(opts), branches: resetPage() };
}

check('one scan puts one button on the branch that has challenges and none on the other', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  api.equipmentOptimizer();
  return [branches[0].querySelectorAll('.fl-ux-eo').length, branches[1].querySelectorAll('.fl-ux-eo').length,
    branches[0].querySelectorAll('button').length];
}, [1, 0, 2]);
check('the button sits in the game\'s button row, right before Go', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const row = branches[0].querySelector('.storylet__buttons');
  return row.children.map((c) => c.textContent);
}, ['Optimize equipment', 'Go']);
check('reversed row: the button comes after Go in the markup, so it shows left of Go, with a gap', () => {
  layoutStub.rowDirection = 'row-reverse';
  try {
    const { branches } = freshWorld();
    api.equipmentOptimizer();
    const row = branches[0].querySelector('.storylet__buttons');
    return [row.children.map((c) => c.textContent), /margin-right:\s*8px/.test(eoButton(branches[0]).style.cssText)];
  } finally { layoutStub.rowDirection = 'row'; }
}, [['Go', 'Optimize equipment'], true]);
check('Go floated right: ours floats right too, after Go, so it shows left of Go, with a gap', () => {
  layoutStub.goFloat = 'right';
  try {
    const { branches } = freshWorld();
    api.equipmentOptimizer();
    const row = branches[0].querySelector('.storylet__buttons');
    const css = eoButton(branches[0]).style.cssText;
    return [row.children.map((c) => c.textContent), /float:\s*right/.test(css), /margin-right:\s*8px/.test(css)];
  } finally { layoutStub.goFloat = 'none'; }
}, [['Go', 'Optimize equipment'], true, true]);
check('plain row: before Go in the markup, with a gap on its right', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const row = branches[0].querySelector('.storylet__buttons');
  return [row.children.map((c) => c.textContent), /margin-right:\s*8px/.test(eoButton(branches[0]).style.cssText)];
}, [['Optimize equipment', 'Go'], true]);
check('the result panel is after the button row, not in it', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const row = branches[0].querySelector('.storylet__buttons');
  return [row.querySelector('.fl-ux-eo'), row.nextSibling && row.nextSibling.className];
}, [null, 'fl-ux-eo']);
check('the button takes the game button\'s shape and keeps its own colours', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const css = eoButton(branches[0]).style.cssText;
  return [/height:\s*40px/.test(css), /font-size:\s*13px/.test(css), /text-transform:\s*uppercase/.test(css),
    /min-height:\s*44px/.test(css), css.includes('background')];
}, [true, true, true, false, true]);
check('final I4: padding and corners are copied as longhands, so empty shorthands do not lose them', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const css = eoButton(branches[0]).style.cssText;
  return [/padding-top:\s*0px/.test(css), /padding-right:\s*20px/.test(css), /padding-bottom:\s*0px/.test(css),
    /padding-left:\s*20px/.test(css), /border-top-left-radius:\s*2px/.test(css), /border-top-right-radius:\s*2px/.test(css),
    /border-bottom-right-radius:\s*2px/.test(css), /border-bottom-left-radius:\s*2px/.test(css)];
}, [true, true, true, true, true, true, true, true]);
check('our button never squeezes Go: it does not flex, and the row may wrap', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const row = branches[0].querySelector('.storylet__buttons');
  return [/flex:\s*0 0 auto/.test(eoButton(branches[0]).style.cssText), row.style.flexWrap];
}, [true, 'wrap']);
checkAsync('after a run that rebuilds the button, it reads Optimize equipment and none is stale', async () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => reloads.length > 0);
  api.equipmentOptimizer();
  const all = branches[0].querySelectorAll('.fl-ux-eo-run');
  return [all.length, all[0].textContent];
}, [1, 'Optimize equipment']);
check('a rescan neither doubles the button nor loses it when React drops one of the two', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  api.equipmentOptimizer();
  const n1 = branches[0].querySelectorAll('.fl-ux-eo-run').length;
  eoButton(branches[0]).remove();
  api.equipmentOptimizer();
  const n2 = [branches[0].querySelectorAll('.fl-ux-eo-run').length, branches[0].querySelectorAll('.fl-ux-eo').length];
  eoWrap(branches[0]).remove();
  api.equipmentOptimizer();
  return [n1, n2, branches[0].querySelectorAll('.fl-ux-eo-run').length, branches[0].querySelectorAll('.fl-ux-eo').length];
}, [1, [1, 1], 1, 1]);
check('when React throws the wrapper away, the next scan puts one back', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  eoWrap(branches[0]).remove();
  api.equipmentOptimizer();
  return branches[0].querySelectorAll('.fl-ux-eo').length;
}, 1);

checkAsync('clicking it plans, equips the Beguiling Mask by id, keeps an undo, saves the result and reloads', async () => {
  const { server, branches } = freshWorld();
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => reloads.length > 0);
  const result = api.readResult();
  const undo = api.readUndo();
  return [server.equips(), reloads.length, result.branchId, result.undoable,
    result.lines.join(' ').includes('Hat: Iron Hat → Beguiling Mask'),
    result.lines.join(' ').includes('18.0%') && result.lines.join(' ').includes('18.4%'),
    result.lines.join(' ').includes('▲'),
    undo.restore, server.log.every((c) => c[3] === 'Bearer tok-abc.123')];
}, [[310], 1, '255911', true, true, true, true,
  [{ slot: 'Hat', id: 304, name: 'Iron Hat', was: 310, wasName: 'Beguiling Mask' }], true]);

checkAsync('the calls are one at a time, and only the game\'s own read and equip endpoints', async () => {
  const { server, branches } = freshWorld();
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => reloads.length > 0);
  return server.log.map((c) => c[0] + ' ' + c[1]);
}, ['GET /api/character/myself', 'GET /api/outfit', 'POST /api/storylet', 'POST /api/outfit/equip', 'POST /api/storylet']);

checkAsync('a stored result for some other action is not drawn here', async () => {
  const { branches } = freshWorld();
  api.saveResult({ branchId: 999, lines: ['Chance 1.0% → 2.0%'], undoable: true });
  api.equipmentOptimizer();
  return [eoLine(branches[0]), branches[0].querySelector('.fl-ux-eo-undo')];
}, ['', null]);

checkAsync('a stored result is drawn under the branch it belongs to', async () => {
  const { branches } = freshWorld();
  api.saveResult({ branchId: 255911, lines: ['Chance 18.0% → 18.4%'], undoable: true });
  api.equipmentOptimizer();
  const undo = branches[0].querySelector('.fl-ux-eo-undo');
  return [eoLine(branches[0]).includes('18.4%'), undo !== null && /height:\s*40px/.test(undo.style.cssText)];
}, [true, true]);

checkAsync('Undo puts the Iron Hat back, says so after the reload, and clears the undo', async () => {
  const { server, branches } = freshWorld();
  server.worn.Hat = 310;
  api.saveUndo(api.undoFor([SWAP_HAT], 255911));
  api.saveResult({ branchId: 255911, lines: ['x'], undoable: true });
  api.equipmentOptimizer();
  branches[0].querySelector('.fl-ux-eo-undo').click();
  await waitFor(() => reloads.length > 0);
  return [server.equips(), reloads.length, api.readUndo(), api.readResult().lines.join(' ').includes('Restored')];
}, [[304], 1, null, true]);

checkAsync('run again on the best outfit: it says so, equips nothing, does not reload', async () => {
  const { server, branches } = freshWorld();
  server.worn.Hat = 310;
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => eoLine(branches[0]).length > 0);
  return [eoLine(branches[0]).includes('Already the best outfit'), server.equips(), reloads.length];
}, [true, [], 0]);

checkAsync('a storylet that forbids outfit changes says so and changes nothing', async () => {
  const { server, branches } = freshWorld({ cannotChange: true });
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => eoLine(branches[0]).length > 0);
  return [eoLine(branches[0]), server.equips(), reloads.length];
}, ['The game does not let you change your outfit here.', [], 0]);

checkAsync('signed out: it says to sign in and calls nothing', async () => {
  const { server, branches } = freshWorld();
  storage.removeItem('access_token');
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => eoLine(branches[0]).length > 0);
  return [eoLine(branches[0]).includes('Sign in'), server.log.length];
}, [true, 0]);

checkAsync('an equip the game refuses is reported, nothing was changed, and there is no reload or undo', async () => {
  const { server, branches } = freshWorld({ failEquip: true });
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => eoLine(branches[0]).length > 0);
  return [eoLine(branches[0]).includes('Could not equip Beguiling Mask'), reloads.length, api.readUndo()];
}, [true, 0, null]);

checkAsync('an empty slot is filled by an equip, the line says so, and the undo remembers it', async () => {
  const { server, branches } = freshWorld({ dangerous: true });
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => reloads.length > 0);
  const result = api.readResult();
  return [server.log.filter((c) => c[1].startsWith('/api/outfit/')).map((c) => [c[1], c[2]]),
    server.worn.Crew, result.lines.join(' ').includes('Crew: nothing \u2192 A Test Crewman'),
    api.readUndo().restore];
}, [[['/api/outfit/equip', { qualityId: 900001 }]], 900001, true,
  [{ slot: 'Crew', id: null, name: 'nothing', was: 900001, wasName: 'A Test Crewman' }]]);

checkAsync('Undo of a filled slot takes the item out again with an unequip', async () => {
  const { server, branches } = freshWorld({ dangerous: true });
  server.worn.Crew = 900001;
  api.saveUndo(api.undoFor([FILL_CREW], 255911));
  api.saveResult({ branchId: 255911, lines: ['x'], undoable: true });
  api.equipmentOptimizer();
  branches[0].querySelector('.fl-ux-eo-undo').click();
  await waitFor(() => reloads.length > 0);
  return [server.log.filter((c) => c[1].startsWith('/api/outfit/')).map((c) => [c[1], c[2]]),
    server.worn.Crew, api.readUndo()];
}, [[['/api/outfit/unequip', { qualityId: 900001 }]], undefined, null]);

checkAsync('what the run did not count is said in the result, by name', async () => {
  const { branches } = freshWorld({ luck: true });
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => reloads.length > 0);
  const text = api.readResult().lines.join(' ');
  return [text.includes('Not counted: Luck'), text.includes('Hat: Iron Hat')];
}, [true, true]);

checkAsync('a second click while it runs does nothing, and the button says it is working', async () => {
  let open;
  const gate = new Promise((r) => { open = r; });
  const { server, branches } = freshWorld({ gate });
  api.equipmentOptimizer();
  const btn = eoButton(branches[0]);
  btn.click();
  btn.click();
  await new Promise((r) => setTimeout(r, 5));
  const label = btn.textContent;
  const callsWhileWaiting = server.log.length;
  open();
  await waitFor(() => reloads.length > 0);
  return [label, callsWhileWaiting, server.equips()];
}, ['Optimizing…', 1, [310]]);

checkAsync('when the game shows something other than predicted, the result says so and offers the undo', async () => {
  const { branches } = freshWorld({ stuck: true });
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => reloads.length > 0);
  const r = api.readResult();
  return [r.lines.join(' ').includes('Predicted'), r.undoable];
}, [true, true]);

// --- legibility on any page ------------------------------------------------
//
// Reported 2026-09-26: the result text was barely readable on a white action.
// The panel now brings its own background AND ink, so nothing depends on what
// is behind it.

function rgbOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function contrastOf(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = rgbOf(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const hi = Math.max(lum(a), lum(b));
  const lo = Math.min(lum(a), lum(b));
  return (hi + 0.05) / (lo + 0.05);
}
const cssColor = (css, prop) => {
  const m = new RegExp('(?:^|;)\\s*' + prop + ':\\s*(#[0-9a-fA-F]{6})').exec(css);
  return m ? m[1] : null;
};
const drawnBranch = () => {
  const { branches } = freshWorld();
  api.saveResult({ branchId: 255911, lines: ['Chance 18.0% → 18.4%  ▲ +0.4, better.', 'Hat: Iron Hat → Beguiling Mask.'], undoable: true });
  api.equipmentOptimizer();
  return branches[0];
};

check('the result panel has a background and an ink of its own, at contrast 7 or better', () => {
  const css = drawnBranch().querySelector('.fl-ux-eo-line').style.cssText;
  const bg = cssColor(css, 'background');
  const ink = cssColor(css, 'color');
  return bg !== null && ink !== null && contrastOf(bg, ink) >= 7;
}, true);
check('...and it does not depend on white or transparent showing through', () => {
  const css = drawnBranch().querySelector('.fl-ux-eo-line').style.cssText;
  return [cssColor(css, 'background') !== '#ffffff', /background:\s*transparent/.test(css)];
}, [true, false]);
check('every line of text carries the panel\'s ink itself, so a page style cannot recolour it', () => {
  const line = drawnBranch().querySelector('.fl-ux-eo-line');
  const ink = cssColor(line.style.cssText, 'color');
  return line.children.filter((c) => c.tagName === 'DIV').map((c) => cssColor(c.style.cssText, 'color') === ink);
}, [true, true]);
check('the panel shows only while it has something to say', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const line = branches[0].querySelector('.fl-ux-eo-line');
  const empty = line.style.display;
  api.saveResult({ branchId: 255911, lines: ['x'], undoable: false });
  api.equipmentOptimizer();
  return [empty, line.style.display];
}, ['none', 'block']);
check('the buttons keep their own colours too: readable, and edged so they show on any page', () => {
  const branch = drawnBranch();
  return ['.fl-ux-eo-run', '.fl-ux-eo-undo'].map((sel) => {
    const css = branch.querySelector(sel).style.cssText;
    return [contrastOf(cssColor(css, 'background'), cssColor(css, 'color')) >= 7, /border:\s*1px solid/.test(css)];
  });
}, [[true, true], [true, true]]);

// --- changing outfit through the page, without a reload --------------------
//
// Reported 2026-09-26: reloading the whole app after every run is harsh. The
// run now goes to the Possessions tab with the game's own router link, clicks
// the items as you would, and goes back: the Story tab refetches on arrival
// (seen in the capture), and the game's own state stays consistent because the
// GAME did the equipping. If any step will not go that way, the remaining
// swaps are made through the API and the page reloads, as before.

api.EO_TIMING && Object.assign(api.EO_TIMING, { pageMs: 60, itemMs: 60, backMs: 60 });

// A stand-in for the game's own screens. Clicking an available item equips it,
// clicking a worn item empties its slot, and history.back() returns to the story.
function softWorld(opts) {
  opts = opts || {};
  // Nothing left over from the last world: a stale link would answer for this one.
  for (const el of doc.body.querySelectorAll('a.cursor-pointer, .possessions')) el.remove();
  const w = freshWorld(opts);
  const spa = { equips: [], unequips: [], navClicks: 0, backs: 0, switches: 0, pageRenames: 0, pageSaves: 0, pageCancels: 0, pageEdits: 0, saveClicks: 0 };
  const byId = {};
  for (const g of MYSELF.possessions) for (const p of g.possessions) if (p.equippable) byId[p.id] = p;
  let screen = null;
  let renaming = false;
  // Worn differs from what the selected outfit holds: the game's "dirty".
  const dirtyNow = () => {
    const sel = w.server.outfits().find((o) => o.selected);
    const norm = (m) => JSON.stringify(Object.keys(m || {}).sort().map((k) => [k, m[k]]));
    return !!sel && norm(w.server.worn) !== norm(w.server.saved[sel.id]);
  };
  // `label`: the dropdown shows this name whatever is selected (a stale page).
  // `wrongOption`: { name: id } -- clicking that option selects another outfit,
  // and the dropdown then shows the name clicked (a stale label).
  let shownName = opts.label || null;
  // The saved-outfit dropdown as captured 2026-11-24: a hidden select, and
  // a react-select whose menu opens on a mousedown on its control.
  const drawOutfitControls = (parent) => {
    const wrap = add(add(parent, 'div', 'outfit-controls'), 'div', 'outfit-controls__dropdown-and-buttons');
    // The "Show:" filter: a second react-select in the same scope, BEFORE the
    // outfit one. Anything that touches it is counted.
    const decoy = add(add(wrap, 'div'), 'div', 'css-2-container');
    const decoyControl = add(decoy, 'div', 'css-d1-control');
    add(add(decoyControl, 'div', 'css-d2'), 'div', 'css-d3-singleValue').textContent = 'Everything';
    add(decoyControl, 'input').setAttribute('role', 'combobox');
    decoyControl.addEventListener('mousedown', () => {
      spa.decoyOpens = (spa.decoyOpens || 0) + 1;
      const menu = add(decoy, 'div');
      menu.setAttribute('role', 'listbox');
      for (const n of ['Everything', 'Persuasive', 'Nope']) { const o = add(menu, 'div'); o.setAttribute('role', 'option'); o.textContent = n; }
    });
    decoyControl.querySelector('input').addEventListener('keydown', () => { spa.decoyEscapes = (spa.decoyEscapes || 0) + 1; });
    const current = w.server.outfits().find((o) => o.selected);
    // Rename mode, as captured 2026-11-24: the pencil swaps the dropdown for a
    // form with the name field, a check (save the name) and an × (cancel).
    // `deadRename`: the check does nothing. `stickyForm`: the check renames
    // but the form stays open until cancelled (the dropdown then shows the
    // new name).
    if (renaming) {
      const form = add(wrap, 'form', 'outfit-controls__outfit-rename-form');
      const field = add(form, 'input', 'outfit-controls__outfit-rename-field');
      field.value = current ? current.name : '';
      const formButton = (kind, act) => {
        const b = add(form, 'button', 'buttonlet-container');
        add(add(b, 'span', 'buttonlet fa-stack fa-lg buttonlet-enabled buttonlet-' + kind), 'span', 'fa fa-circle fa-stack-2x');
        b.onReact = act;
      };
      formButton('check', async () => {
        if (opts.deadRename) return;
        spa.pageRenames++;
        await fetchImpl('https://api.fallenlondon.com/api/outfit/rename',
          { method: 'POST', headers: {}, body: JSON.stringify({ outfitId: current.id, newName: field.value }) });
        if (opts.stickyForm) return;
        renaming = false;
        drawPossessions();
      });
      formButton('delete', () => { spa.pageCancels++; renaming = false; drawPossessions(); });
      return;
    }
    const select = add(wrap, 'select', 'u-visually-hidden outfit-controls__accessible-select');
    select.id = 'a11y-outfit-dropdown';
    for (const o of w.server.outfits()) add(select, 'option').setAttribute('value', String(o.id));
    const sib = add(wrap, 'div');
    sib.setAttribute('aria-hidden', 'true');
    const visual = add(sib, 'div', 'css-1-container');
    const control = add(visual, 'div', 'css-f92gjm-control');
    const holder = add(control, 'div', 'css-hlgwow');
    add(holder, 'div', 'css-gj4dr3-singleValue').textContent = shownName || (current ? current.name : '');
    const input = add(holder, 'input');
    input.setAttribute('role', 'combobox');
    input.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      spa.escapes = (spa.escapes || 0) + 1;
      const menu = visual.querySelector('[role="listbox"]');
      if (menu) menu.remove();
    });
    // The game's own round icon buttons after the dropdown (captured markup):
    // star, edit, save. Rename mode swaps them for a form, so none are drawn.
    // As captured: the buttons sit inside the dropdown's own flex div, after
    // the "Outfit" label -- not directly in `.outfit-controls__dropdown-and-buttons`.
    const inner = add(wrap, 'div');
    add(inner, 'span', 'heading heading--3').textContent = 'Outfit';
    if (!opts.renameMode) {
      for (const [kind, icon] of [['star-o', 'fa fa-inverse fa-stack-1x fa-star-o'], ['edit', 'fa fa-inverse fa-stack-1x fa-pencil'],
        ['save-outfit', 'fa fa-inverse fa-stack-1x fl-ico fl-ico-save-outfit']]) {
        const gb = add(inner, 'button', 'buttonlet-container');
        gb.type = 'button';
        // The save button is disabled while the worn items equal the saved
        // outfit; `stuckSave`: always disabled (a lagging dirty flag).
        const off = kind === 'save-outfit' && (opts.stuckSave || !dirtyNow());
        if (off) gb.disabled = true;
        const st = add(gb, 'span', 'buttonlet fa-stack fa-lg buttonlet-' + (off ? 'disabled' : 'enabled') + ' buttonlet-' + kind);
        add(st, 'span', 'fa fa-circle fa-stack-2x');
        add(st, 'span', icon);
        add(st, 'span', 'u-visually-hidden').textContent = kind;
        if (kind === 'edit') gb.onReact = () => { spa.pageEdits++; renaming = true; drawPossessions(); };
        // `deadSave`: the click does nothing.
        if (kind === 'save-outfit') {
          gb.onReact = async () => {
            spa.saveClicks++;
            if (gb.disabled || opts.deadSave) return;
            spa.pageSaves++;
            await fetchImpl('https://api.fallenlondon.com/api/outfit/save', { method: 'POST', headers: {} });
            drawPossessions();
          };
        }
      }
    }
    control.addEventListener('mousedown', () => {
      if (opts.deadDropdown) return;
      const menu = add(visual, 'div');
      menu.setAttribute('role', 'listbox');
      for (const o of w.server.outfits()) {
        const opt = add(menu, 'div');
        opt.setAttribute('role', 'option');
        opt.textContent = o.name;
        opt.onReact = async () => {
          spa.switches++;
          const wrong = opts.wrongOption && opts.wrongOption[o.name];
          if (wrong) shownName = o.name;
          await fetchImpl('https://api.fallenlondon.com/api/outfit/change',
            { method: 'POST', headers: {}, body: JSON.stringify({ outfitId: wrong || o.id }) });
          drawPossessions();
        };
      }
    });
  };
  const drawPossessions = () => {
    if (screen) screen.remove();
    screen = add(doc.body, 'div', 'possessions');
    if (!opts.noDropdown) drawOutfitControls(screen);
    const list = add(screen, 'ul', 'equipment-group-list');
    for (const slot of ['Hat', 'Luggage', 'Companion', 'Crew']) {
      const g = add(add(list, 'li', 'equipment-group-list__item'), 'div', 'equipment-group');
      add(g, 'h2', 'equipment-group__name').textContent = slot;
      const wrap = add(g, 'div', 'equipment-group__slot-and-available-items');
      const slotBox = add(wrap, 'div', 'equipment-group__equipment-slot-container');
      const avail = add(wrap, 'ul', 'available-item-list');
      for (const p of Object.values(byId).filter((x) => x.category === slot)) {
        const isWorn = w.server.worn[slot] === p.id;
        if (!isWorn && opts.hideItems && opts.hideItems.includes(p.id)) continue;
        const node = isWorn
          ? add(slotBox, 'div', 'equipped-item')
          : add(add(avail, 'li', 'available-item-list__item'), 'div', 'icon icon--emphasize icon--available-item');
        node.setAttribute('data-quality-id', String(p.id));
        const button = add(node, 'div');
        button.setAttribute('role', 'button');
        button.onReact = () => {
          if (opts.ignoreClick === true || (Array.isArray(opts.ignoreClick) && opts.ignoreClick.includes(p.id))) return;
          if (isWorn) { delete w.server.worn[slot]; spa.unequips.push(p.id); } else { w.server.worn[slot] = p.id; spa.equips.push(p.id); }
          drawPossessions();
        };
      }
    }
  };
  if (!opts.noLink) {
    const nav = add(doc.body, 'a', 'cursor-pointer');
    nav.setAttribute('href', '/possessions');
    nav.onReact = () => {
      spa.navClicks++;
      for (const child of eoPage.children.slice()) child.remove();
      drawPossessions();
    };
  }
  backHandler = () => {
    spa.backs++;
    renaming = false;
    if (screen) screen.remove();
    resetPage();
  };
  return Object.assign(w, { spa, story: () => eoPage.querySelector('.branch[data-branch-id="255911"]') });
}

checkAsync('a run goes through the game\'s own Possessions screen and back: the game equips, nothing is reloaded', async () => {
  const w = softWorld();
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => w.spa.backs > 0 && eoLine(w.story()).length > 0, 3000);
  return [w.spa.navClicks, w.spa.equips, w.server.equips(), w.spa.backs, reloads.length,
    eoLine(w.story()).includes('18.4%'), eoLine(w.story()).includes('Hat: Iron Hat → Beguiling Mask'),
    w.story().querySelector('.fl-ux-eo-undo') !== null];
}, [1, [310], [], 1, 0, true, true, true]);

checkAsync('with no Possessions link to click, the API makes the swaps and the page reloads, as before', async () => {
  const w = softWorld({ noLink: true });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => reloads.length > 0, 3000);
  return [w.spa.equips, w.server.equips(), reloads.length];
}, [[], [310], 1]);

checkAsync('an item the Possessions list does not show (a filter hides it) falls back to the API and a reload', async () => {
  const w = softWorld({ hideItems: [310] });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => reloads.length > 0, 3000);
  return [w.spa.equips, w.server.equips(), reloads.length];
}, [[], [310], 1]);

checkAsync('a click the game ignores falls back to the API and a reload', async () => {
  const w = softWorld({ ignoreClick: true });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => reloads.length > 0, 3000);
  return [w.spa.equips, w.server.equips(), reloads.length];
}, [[], [310], 1]);

checkAsync('Undo goes the same way: the game puts the Iron Hat back, no reload', async () => {
  const w = softWorld();
  w.server.worn.Hat = 310;
  api.saveUndo(api.undoFor([SWAP_HAT], 255911));
  api.saveResult({ branchId: 255911, lines: ['x'], undoable: true });
  api.equipmentOptimizer();
  w.branches[0].querySelector('.fl-ux-eo-undo').click();
  await waitFor(() => w.spa.backs > 0 && eoLine(w.story()).includes('Restored'), 3000);
  return [w.spa.equips, reloads.length, api.readUndo(), eoLine(w.story()).includes('Restored')];
}, [[304], 0, null, true]);

checkAsync('filling an empty slot is a click on the item, and undoing it a click on the worn item', async () => {
  const w = softWorld({ dangerous: true });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => w.spa.backs > 0 && eoLine(w.story()).length > 0, 3000);
  const filled = [w.spa.equips, w.server.worn.Crew];
  w.story().querySelector('.fl-ux-eo-undo').click();
  await waitFor(() => w.spa.backs > 1 && eoLine(w.story()).includes('Restored'), 3000);
  return [filled, w.spa.unequips, w.server.worn.Crew, reloads.length];
}, [[[900001], 900001], [900001], undefined, 0]);

checkAsync('the dropdown switches the outfit and the page shows it', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 2, name: 'Persuasive' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  const ok = await io.switchOutfit('Persuasive');
  return [ok, w.spa.switches, w.server.outfits().find((o) => o.selected).name];
}, [true, 1, 'Persuasive']);
checkAsync('the outfit already shown is not switched to again', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 2, name: 'Persuasive' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return [await io.switchOutfit('Dangerous'), w.spa.switches];
}, [true, 0]);
checkAsync('an outfit the menu does not list gives false and closes the menu', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'A', selected: true }, { id: 2, name: 'B' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return [await io.switchOutfit('Nope'), doc.body.querySelector('[role="listbox"]'), w.spa.escapes];
}, [false, null, 1]);
checkAsync('no dropdown on the page gives false', async () => {
  softWorld({ noDropdown: true });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return io.switchOutfit('B');
}, false);
checkAsync('already on Possessions: no second link click', async () => {
  const w = softWorld();
  const io = api.eoSoftIo();
  await io.goToPossessions(); await io.goToPossessions();
  return w.spa.navClicks;
}, 1);
checkAsync('a dropdown that does not open gives false and leaves no menu', async () => {
  const w = softWorld({ deadDropdown: true, outfits: [{ id: 1, name: 'A', selected: true }, { id: 2, name: 'B' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return [await io.switchOutfit('B'), doc.body.querySelector('[role="listbox"]'), w.spa.escapes];
}, [false, null, 1]);
checkAsync('a second react-select in the same scope is left alone', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 2, name: 'Persuasive' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  const ok = await io.switchOutfit('Persuasive');
  const miss = await io.switchOutfit('Nope');
  return [ok, w.server.outfits().find((o) => o.selected).name, miss, w.spa.decoyOpens, w.spa.decoyEscapes];
}, [true, 'Persuasive', false, undefined, undefined]);

// --- dismissing the result, and items that ask before equipping ------------

check('the result panel has a Dismiss button, touch-sized, that clears it and forgets the result', () => {
  const branch = drawnBranch();
  const dismiss = branch.querySelector('.fl-ux-eo-dismiss');
  const shown = [dismiss !== null, dismiss.textContent, /height:\s*40px/.test(dismiss.style.cssText)];
  dismiss.click();
  const line = branch.querySelector('.fl-ux-eo-line');
  return shown.concat([line.style.display, line.children.length, api.readResult()]);
}, [true, 'Dismiss', true, 'none', 0, null]);
check('a scan after dismissing does not bring the result back', () => {
  const branch = drawnBranch();
  branch.querySelector('.fl-ux-eo-dismiss').click();
  api.equipmentOptimizer();
  return branch.querySelector('.fl-ux-eo-line').style.display;
}, 'none');
checkAsync('a message that is not a result (already the best outfit) can be dismissed too', async () => {
  const { server, branches } = freshWorld();
  server.worn.Hat = 310;
  api.equipmentOptimizer();
  eoButton(branches[0]).click();
  await waitFor(() => eoLine(branches[0]).length > 0);
  branches[0].querySelector('.fl-ux-eo-dismiss').click();
  return [branches[0].querySelector('.fl-ux-eo-line').style.display, eoLine(branches[0])];
}, ['none', '']);

// Some items do not equip on a click: the game opens a react-modal popup with
// "Use" and "Equip" buttons (reported 2026-09-26, with the popup left open on
// Possessions; the markup below is from the capture of the Ridiculous Hat's).
// It has no Close button: react-modal closes on Escape or a click on its
// overlay. The run must click Equip, NEVER Use, and close what it opened when
// it gives up.
function softWorldWithPopups(opts) {
  const w = softWorld(Object.assign({ ignoreClick: true }, opts));
  const worldSpa = w.spa;
  // Replace the item behaviour: clicking opens a popup instead of acting.
  const popupFor = (kind, id, slot) => {
    for (const el of doc.body.querySelectorAll('.ReactModalPortal')) el.remove();
    const portal = add(doc.body, 'div', 'ReactModalPortal');
    const overlay = add(portal, 'div', 'ReactModal__Overlay ReactModal__Overlay--after-open modal--tooltip-like__overlay');
    overlay.onReact = () => portal.remove();
    const content = add(overlay, 'div', 'ReactModal__Content ReactModal__Content--after-open modal--tooltip-like__content');
    content.setAttribute('role', 'dialog');
    const buttons = add(add(add(content, 'div', 'tooltip--item-modal'), 'div', 'tooltip__desc'), 'div', 'tooltip__buttons');
    const use = add(buttons, 'button', 'button button--primary button--sm button--tooltip');
    use.textContent = 'Use';
    use.onReact = () => { worldSpa.uses = (worldSpa.uses || 0) + 1; };
    const act = add(buttons, 'button', 'button button--primary button--sm button--tooltip');
    act.textContent = kind === 'equip' ? 'Equip' : 'Unequip';
    act.onReact = () => {
      if (opts && opts.popupDead) return;
      if (kind === 'equip') { w.server.worn[slot] = id; worldSpa.equips.push(id); } else { delete w.server.worn[slot]; worldSpa.unequips.push(id); }
      portal.remove();
      // The list redraws with the new state.
      redraw();
    };
    return portal;
  };
  let redraw = () => {};
  // Reach the possessions drawing through a click on the link, then hook the items.
  const nav = doc.body.querySelector('a.cursor-pointer');
  if (nav) {
    const first = nav.onReact;
    const hook = () => {
      for (const node of doc.body.querySelectorAll('.icon--available-item, .equipped-item')) {
        const id = Number(node.getAttribute('data-quality-id'));
        const button = node.children[0];
        const isWorn = String(node.className).includes('equipped-item');
        const slot = { 304: 'Hat', 310: 'Hat', 312: 'Hat', 556: 'Hat', 900001: 'Crew', 147174: 'Luggage', 147136: 'Luggage', 134971: 'Companion' }[id];
        button.onReact = () => popupFor(isWorn ? 'unequip' : 'equip', id, slot);
      }
    };
    nav.onReact = () => { first(); hook(); redraw = () => { first(); hook(); }; };
  }
  return w;
}

checkAsync('an item that asks first: the run clicks Equip (never Use) in its popup, and nothing is left open', async () => {
  const w = softWorldWithPopups();
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => w.spa.backs > 0 && eoLine(w.story()).length > 0, 3000);
  return [w.spa.equips, w.server.equips(), reloads.length, doc.body.querySelector('.ReactModalPortal'), w.spa.uses || 0];
}, [[310], [], 0, null, 0]);

checkAsync('a popup whose Equip does nothing: the API makes the swap, the popup is closed by its overlay, the page reloads', async () => {
  const w = softWorldWithPopups({ popupDead: true });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => reloads.length > 0, 3000);
  return [w.spa.equips, w.server.equips(), reloads.length, doc.body.querySelector('.ReactModalPortal'), w.spa.uses || 0];
}, [[], [310], 1, null, 0]);

checkAsync('emptying a slot can also ask first (Unequip in a popup)', async () => {
  const w = softWorldWithPopups({ dangerous: true });
  w.server.worn.Crew = 900001;
  api.saveUndo(api.undoFor([FILL_CREW], 255911));
  api.saveResult({ branchId: 255911, lines: ['x'], undoable: true });
  api.equipmentOptimizer();
  w.branches[0].querySelector('.fl-ux-eo-undo').click();
  await waitFor(() => w.spa.backs > 0 && eoLine(w.story()).includes('Restored'), 3000);
  return [w.spa.unequips, w.server.worn.Crew, reloads.length, doc.body.querySelector('.ReactModalPortal')];
}, [[900001], undefined, 0, null]);

// --- finish ----------------------------------------------------------------

// --- saved-outfit shortcuts: stat codes and temp names ---------------------

check('codes are unique and three letters', () => {
  const v = Object.values(api.STAT_CODES);
  return [v.length, new Set(v).size, v.every((c) => /^[A-Z][a-z]{2}$/.test(c))];
}, [20, 20, true]);
check('key: sorted, unique, missing kept', () => api.keyFor(['Watchful', 'Glasswork', 'Watchful', 'Luck']),
  { codes: ['Gla', 'Wat'], missing: ['Luck'] });
check('name: temp + codes', () => api.tempName(['Gla', 'Wat']), 'tempGlaWat');
check('name: six stats do not fit in 20', () => api.tempName(['Art', 'Che', 'Dan', 'Gla', 'Kat', 'Wat']), null);
check('parse: hand order matches as a set', () => api.parseTemp('tempWatGla'), { free: false, codes: ['Gla', 'Wat'] });
check('parse: case of the prefix ignored', () => api.parseTemp('TEMPGlaWat'), { free: false, codes: ['Gla', 'Wat'] });
check('parse: digits and bare temp are free', () => [api.parseTemp('temp'), api.parseTemp('temp3')], [{ free: true }, { free: true }]);
check('parse: junk suffix is free', () => api.parseTemp('tempFooWat'), { free: true });
check('parse: not a temp', () => api.parseTemp('Persuasive'), null);
check('final I2: words that merely start with temp are not temps',
  () => [api.parseTemp('Tempest'), api.parseTemp('Temple Club'), api.parseTemp('Temporary hat')], [null, null, null]);
check('final I2: the end, a digit or a capital after the prefix makes a temp, in any case of the prefix',
  () => [api.parseTemp('Temp'), api.parseTemp('TEMP2'), api.parseTemp('TempWat')],
  [{ free: true }, { free: true }, { free: false, codes: ['Wat'] }]);
check('sameKey is a set compare', () => [api.sameKey(['Wat', 'Gla'], ['Gla', 'Wat']), api.sameKey(['Wat'], ['Gla', 'Wat'])], [true, false]);
const OUTS = [1, 2, 3, 4, 5, 6].map((n) => ({ id: 6171218 + n, name: 'temp' + n })).concat([{ id: 9, name: 'tempGlaWat' }]);
check('free name skips temp1..temp6', () => api.freeTempName(OUTS, 9), 'temp7');
check('free name does not count the outfit itself', () => api.freeTempName([{ id: 9, name: 'temp1' }], 9), 'temp1');

// --- saved-outfit shortcuts: the run (spec §5) -----------------------------

const P_OUTFITS = [{ id: 1, name: 'Dangerous', selected: true }, { id: 2, name: 'Persuasive' }];
const P_SELECTED = [{ id: 1, name: 'Dangerous' }, { id: 2, name: 'Persuasive', selected: true }];
// The best for Persuasive: the Beguiling Mask (+6), the Chess Set (+6), the Minister (+10).
const BEST_P = { Hat: 310, Luggage: 147174, Companion: 134971 };
const runEo = () => api.runOptimize(255911, api.flApi, api.eoSoftIo(), false);
const outfitCalls = (s) => s.log.filter((c) => c[1].startsWith('/api/outfit/')).map((c) => [c[1], c[2]]);
const selectedName = (s) => s.outfits().find((o) => o.selected).name;

checkAsync('§5.1 a stat outfit not worn: one switch, no equips, the line names it, undo goes back to the old outfit', async () => {
  const w = softWorld({ persuasive: true, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await runEo();
  return [w.spa.switches, w.spa.equips.length, w.server.equips().length, r.lines.slice(0, 2),
    api.readUndo().outfitId, r.undoable, w.spa.backs];
}, [1, 0, 0, ['Switched to Persuasive.', 'Chance 90.0% → 92.0%  ▲ +2.0, better.'], 1, true, 1]);
checkAsync('§5.1 Undo after a switch: switches back, equips nothing', async () => {
  const w = softWorld({ persuasive: true, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  await runEo();
  const r = await api.runUndo(api.flApi, api.eoSoftIo());
  return [w.spa.switches, selectedName(w.server), w.server.equips().length, w.spa.equips.length, r.lines, api.readUndo()];
}, [2, 'Dangerous', 0, 0, ['Switched back to Dangerous.'], null]);
checkAsync('§5.2 the stat outfit already worn: no switch, says so', async () => {
  const w = softWorld({ persuasive: true, outfits: P_SELECTED });
  w.server.worn.Hat = 310;
  const r = await runEo();
  return [w.spa.switches, r.lines];
}, [0, ['Already wearing Persuasive.', 'Already the best outfit: 92.0%.']]);
checkAsync('§5.3 two stats, temp1 free: switched to temp1, swapped, saved, renamed tempMitPer', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }] });
  storage.removeItem('fl-ux-temp-used');
  const r = await runEo();
  return [w.spa.switches, w.spa.equips, outfitCalls(w.server).slice(-2), r.lines[0], r.lines.includes('Saved as tempMitPer.'),
    w.server.outfits().map((o) => o.name), w.server.saved[8].Hat, Object.keys(api.readTempUsed()), api.readUndo().outfitId];
}, [1, [310], [['/api/outfit/save', undefined], ['/api/outfit/rename', { outfitId: 8, newName: 'tempMitPer' }]],
  'Switched to temp1.', true, ['Dangerous', 'tempMitPer'], 310, ['8'], 1]);
checkAsync('§5.4 the next run with tempMitPer holding the optimum: one switch, no equips, no save', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'tempMitPer' }], saved: { 8: BEST_P } });
  const r = await runEo();
  return [w.spa.switches, w.spa.equips.length, w.server.equips().length, w.server.calls('/api/outfit/save').length, r.lines[0]];
}, [1, 0, 0, 0, 'Switched to tempMitPer.']);
checkAsync('§5.5 a swap fails after the switch to temp1: nothing saved or renamed, temp1 keeps its name', async () => {
  const w = softWorld({ failEquip: true, ignoreClick: true, outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }] });
  const r = await runEo();
  return [w.server.calls('/api/outfit/save').length, w.server.calls('/api/outfit/rename').length,
    w.server.outfits().map((o) => o.name), r.lines[0], /^Could not equip Beguiling Mask/.test(r.lines[1]), r.undoable];
}, [0, 0, ['Dangerous', 'temp1'], 'Switched to temp1.', true, true]);
checkAsync('§5.7 outfit changes forbidden: blocked as today, no switch', async () => {
  const w = softWorld({ cannotChange: true, persuasive: true, outfits: P_OUTFITS });
  const r = await runEo();
  return [r.lines, w.spa.switches];
}, [['The game does not let you change your outfit here.'], 0]);
checkAsync('§5.8 a stat outfit that lowers the chance: switched back, says why, the next press calculates', async () => {
  // A burden on Persuasive that no gear takes off: 89% is the best the outfit can reach.
  const w = softWorld({ persuasive: true, burden: { Persuasive: 10 }, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await runEo();
  const first = [r.lines, w.spa.switches, selectedName(w.server), api.readUndo(), !!r.undoable];
  const again = await runEo();
  return first.concat([w.spa.switches, w.spa.equips, /^Chance 90\.0% → 92\.0%/.test(again.lines[0])]);
}, [['Switched back from Persuasive: the chance dropped from 90.0% to 89.0%.', 'Press again for a calculated outfit instead.'],
  2, 'Dangerous', null, false, 2, [310], true]);
checkAsync('final I3: a stat outfit shown lower whose best reachable is not lower: kept, improved unsaved', async () => {
  const w = softWorld({ persuasive: true, outfits: P_OUTFITS, saved: { 2: { Hat: 304, Luggage: 147136, Companion: 134971 } } });
  const r = await runEo();
  return [r.lines[0], selectedName(w.server), w.spa.equips, w.server.calls('/api/outfit/save').length, w.server.saved[2].Luggage,
    / \(unsaved\)\.$/.test(r.lines[1]), storage.getItem('fl-ux-equip-calc')];
}, ['Switched to Persuasive.', 'Persuasive', [310, 147174], 0, 147136, true, null]);
checkAsync('§5.8 a stat outfit that locks the action: switched back', async () => {
  const w = softWorld({ persuasive: true, lockedIn: 'Persuasive', outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await runEo();
  storage.removeItem('fl-ux-equip-calc');
  return [r.lines[0], w.spa.switches, selectedName(w.server)];
}, ['Switched back from Persuasive: the action is locked in it.', 2, 'Dangerous']);
checkAsync('§5.9 unsaved changes: asks first, no switch; a second tap on the same button switches', async () => {
  const w = softWorld({ persuasive: true, dirty: true, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => eoLine(w.branches[0]).length > 0);
  const first = [eoLine(w.branches[0]), w.spa.switches, eoWrap(w.branches[0]).dataset.flUxEoConfirm];
  eoButton(w.branches[0]).click();
  await waitFor(() => w.spa.backs > 0 && eoLine(w.story()).length > 0, 3000);
  return first.concat([w.spa.switches, eoLine(w.story()).split('\n')[0]]);
}, ['Unsaved changes on Dangerous will be lost. Tap again to switch to Persuasive.', 0, '1', 1, 'Switched to Persuasive.']);
checkAsync('§5.9 the run itself returns confirm, and a confirmed run does not ask', async () => {
  const w = softWorld({ persuasive: true, dirty: true, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const asked = await runEo();
  const switchesAfterAsk = w.spa.switches;
  const went = await api.runOptimize(255911, api.flApi, api.eoSoftIo(), true);
  return [asked.confirm, switchesAfterAsk, w.spa.switches, went.confirm, went.lines[0]];
}, [true, 0, 1, undefined, 'Switched to Persuasive.']);
checkAsync('§5.10 a stat outfit and a better hat owned: switch, hat on unsaved, no save', async () => {
  const w = softWorld({ persuasive: true, outfits: P_OUTFITS });
  const r = await runEo();
  return [w.spa.switches, w.spa.equips, w.server.calls('/api/outfit/save').length, r.lines[0], / \(unsaved\)\.$/.test(r.lines[1]),
    w.server.saved[2].Hat];
}, [1, [310], 0, 'Switched to Persuasive.', true, 304]);
checkAsync('Review Focus 1: unsaved changes but the target is already worn: no prompt', async () => {
  const w = softWorld({ persuasive: true, dirty: true, outfits: P_SELECTED });
  const r = await runEo();
  return [r.confirm, w.spa.switches, r.lines[0]];
}, [undefined, 0, 'Already wearing Persuasive.']);
checkAsync('Review Focus 4: a dropdown that will not switch: the API switches, swaps go through the API, one reload', async () => {
  const w = softWorld({ persuasive: true, deadDropdown: true, outfits: P_OUTFITS });
  api.equipmentOptimizer();
  eoButton(w.branches[0]).click();
  await waitFor(() => reloads.length > 0, 3000);
  return [w.server.calls('/api/outfit/change').map((c) => [c[2], c[3]]), w.server.equips(), w.spa.equips, w.spa.unequips,
    reloads.length, api.readResult().lines[0]];
}, [[[{ outfitId: 2 }, 'Bearer tok-abc.123']], [310], [], [], 1, 'Switched to Persuasive.']);
checkAsync('no temp at all: today\'s run, plus the hint', async () => {
  const w = softWorld();
  const r = await runEo();
  return [w.spa.switches, w.spa.equips, r.lines[r.lines.length - 1]];
}, [0, [310], 'Rename an outfit to temp1 to keep results for next time.']);

// Every switch is confirmed by the selected id in a fresh read: the page's
// labels can be stale after an API switch or rename (task 5 review).
const changeBodies = (s) => s.calls('/api/outfit/change').map((c) => [c[2], c[3] || null]);
checkAsync('review (a): dead dropdown and a stat outfit that lowers the chance: API there, API back, really back', async () => {
  const w = softWorld({ persuasive: true, deadDropdown: true, burden: { Persuasive: 10 }, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await runEo();
  storage.removeItem('fl-ux-equip-calc');
  return [changeBodies(w.server), r.lines[0], selectedName(w.server), r.reload, w.spa.switches];
}, [[[{ outfitId: 2 }, 'Bearer tok-abc.123'], [{ outfitId: 1 }, 'Bearer tok-abc.123']],
  'Switched back from Persuasive: the chance dropped from 90.0% to 89.0%.', 'Dangerous', true, 0]);
checkAsync('review (b): a page switch whose label matches but selects another outfit: the API redoes it, the save goes into the right one', async () => {
  const w = softWorld({ wrongOption: { temp1: 9 },
    outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }, { id: 9, name: 'temp2' }] });
  const r = await runEo();
  return [changeBodies(w.server).map((c) => c[0]), selectedName(w.server), w.server.saved[8].Hat, w.server.saved[9].Hat,
    w.server.outfits().map((o) => o.name), r.lines.includes('Saved as tempMitPer.'), w.server.equips(), w.spa.equips, r.reload];
}, [[{ outfitId: 9 }, { outfitId: 8 }], 'tempMitPer', 310, 304, ['Dangerous', 'tempMitPer', 'temp2'], true, [310], [], true]);
checkAsync('review (c): both switch routes fail: says so, nothing equipped, saved or renamed, no undo', async () => {
  const w = softWorld({ persuasive: true, deadDropdown: true, failChange: true, outfits: P_OUTFITS });
  const r = await runEo();
  return [r.lines, w.server.calls('/api/outfit/equip').length, w.server.calls('/api/outfit/save').length,
    w.server.calls('/api/outfit/rename').length, w.spa.equips, api.readUndo(), !!r.undoable];
}, [['Could not switch to Persuasive.'], 0, 0, 0, [], null, false]);
checkAsync('review (d): a hit that still finds a better item saves it into the keyed temp, which keeps its name', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'tempMitPer' }] });
  const r = await runEo();
  return [w.spa.switches, w.spa.equips, w.server.saved[8].Hat, w.server.outfits().map((o) => o.name),
    w.server.calls('/api/outfit/rename').map((c) => c[2].newName), r.lines.includes('Saved as tempMitPer.')];
}, [1, [310], 310, ['Dangerous', 'tempMitPer'], ['temp1', 'tempMitPer'], true]);
checkAsync('review (e): Undo after an API switch, with a dropdown still showing the old name: the API really switches back', async () => {
  const w = softWorld({ persuasive: true, deadDropdown: true, label: 'Dangerous', outfits: P_OUTFITS, saved: { 2: BEST_P } });
  await runEo();
  const u = await api.runUndo(api.flApi, api.eoSoftIo());
  return [changeBodies(w.server).map((c) => c[0]), selectedName(w.server), u.lines, u.reload, api.readUndo()];
}, [[{ outfitId: 2 }, { outfitId: 1 }], 'Dangerous', ['Switched back to Dangerous.'], true, null]);
checkAsync('review (minor): the "calculate next" mark survives a run that could not read the game', async () => {
  softWorld({ persuasive: true, outfits: P_OUTFITS });
  storage.setItem('fl-ux-equip-calc', JSON.stringify({ at: Date.now(), branchId: 255911 }));
  storage.removeItem('access_token');
  const r = await runEo();
  const kept = storage.getItem('fl-ux-equip-calc') !== null;
  storage.removeItem('fl-ux-equip-calc');
  return [/Sign in/.test(r.lines[0]), kept];
}, [true, true]);

// --- final review fixes (2026-11-24) -----------------------------------------

checkAsync('final C1(a): a store guards a requirement met in the outfit worn before, though the empty temp misses it', async () => {
  // Dangerous 189 needed, tested by no challenge. Worn: the Iron Hat (Dangerous +5), so the Chess Set is the only
  // gain; the Beguiling Mask would drop Dangerous to 183. temp1 is empty: Dangerous 184, locked there.
  const w = softWorld({ needDangerous: 189, outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }],
    saved: { 8: {} } });
  w.server.worn.Luggage = 147136;
  storage.removeItem('fl-ux-temp-used');
  const r = await runEo();
  return [r.lines[0], r.lines.includes('Saved as tempMitPer.'), w.server.saved[8].Hat, w.server.saved[8].Luggage,
    selectedName(w.server), r.lines.some((l) => /locked/.test(l))];
}, ['Switched to temp1.', true, 304, 147174, 'tempMitPer', false]);
checkAsync('final C1(b): the re-read after the swaps shows the action locked: no save, no rename, switched back', async () => {
  const w = softWorld({ lockedIn: 'temp1', outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }] });
  const r = await runEo();
  const calc = storage.getItem('fl-ux-equip-calc') !== null;
  storage.removeItem('fl-ux-equip-calc');
  return [w.server.calls('/api/outfit/save').length, w.server.calls('/api/outfit/rename').length, r.lines[0],
    selectedName(w.server), w.server.outfits().map((o) => o.name), w.server.saved[8].Hat, api.readUndo(), calc];
}, [0, 0, 'Switched back from temp1: the action is locked in it.', 'Dangerous', ['Dangerous', 'temp1'], 304, null, true]);
checkAsync('final I3: a hit temp missing a better item, shown lower but not at its best: kept, the item applied and saved', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'tempMitPer' }],
    saved: { 8: { Hat: 304, Luggage: 147136, Companion: 134971 } } });
  const r = await runEo();
  return [r.lines[0], selectedName(w.server), w.spa.equips, w.server.saved[8].Hat, w.server.saved[8].Luggage,
    r.lines.includes('Saved as tempMitPer.'), storage.getItem('fl-ux-equip-calc')];
}, ['Switched to tempMitPer.', 'tempMitPer', [310, 147174], 310, 147174, true, null]);
checkAsync('final minor 5: the page switched but said no, then the API failed: says what is worn, keeps the undo', async () => {
  const w = softWorld({ persuasive: true, label: 'Dangerous', failChangeFrom: 2, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await runEo();
  return [r.lines, selectedName(w.server), (api.readUndo() || {}).outfitId, !!r.undoable];
}, [['Could not switch to Persuasive. You are wearing Persuasive.'], 'Persuasive', 1, true]);
checkAsync('final minor 6: a confirmed switch over unsaved changes, then the safety net: says the changes are gone', async () => {
  const w = softWorld({ persuasive: true, dirty: true, lockedIn: 'Persuasive', outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await api.runOptimize(255911, api.flApi, api.eoSoftIo(), true);
  storage.removeItem('fl-ux-equip-calc');
  return [r.lines[0], selectedName(w.server)];
}, ['Switched back from Persuasive: the action is locked in it. Your unsaved changes are gone.', 'Dangerous']);
checkAsync('final: a safety-net switch-back that fails: says so, keeps the undo, does not force a calculation', async () => {
  const w = softWorld({ persuasive: true, lockedIn: 'Persuasive', failChangeFrom: 2, outfits: P_OUTFITS, saved: { 2: BEST_P } });
  const r = await runEo();
  return [r.lines, selectedName(w.server), (api.readUndo() || {}).outfitId, !!r.undoable, storage.getItem('fl-ux-equip-calc')];
}, [['Could not switch back to Dangerous.', 'Persuasive: the action is locked in it. Use Undo to try again.'],
  'Persuasive', 1, true, null]);

// --- task A: a temp store renames and saves through the game's own controls --
//
// Reported 2026-11-24: after an API rename the dropdown on Possessions still
// showed temp1, because the game's own state never learned the new name. A
// store or hit on the page route now stays on Possessions after the swaps,
// renames with the pencil / check form and saves with the save button, then
// goes back once. Each step falls back to the API when the page does not
// respond.

// A run whose `back` first notes what the page shows at that moment.
async function runEoSeen() {
  const io = api.eoSoftIo();
  const seen = {};
  const back = io.back;
  io.back = async (id) => {
    const v = doc.body.querySelector('.css-gj4dr3-singleValue');
    seen.name = v ? v.textContent : null;
    seen.form = !!doc.body.querySelector('form.outfit-controls__outfit-rename-form');
    return back(id);
  };
  const r = await api.runOptimize(255911, api.flApi, io, false);
  return { r, seen };
}
const T1_WORLD = () => ({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }] });

checkAsync('task A 1: a free temp stored on the page route: renamed and saved through the page, one back, no reload', async () => {
  const w = softWorld(T1_WORLD());
  storage.removeItem('fl-ux-temp-used');
  const { r, seen } = await runEoSeen();
  return [w.spa.pageSaves, w.spa.pageRenames, w.server.outfits().map((o) => o.name), w.server.saved[8].Hat, seen.name,
    w.spa.backs, !!r.reload, reloads.length, r.lines.includes('Saved as tempMitPer.')];
}, [1, 1, ['Dangerous', 'tempMitPer'], 310, 'tempMitPer', 1, false, 0, true]);
checkAsync('task A 2: a keyed temp stored on the page route: page rename, page save, page rename, in that order', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 3, name: 'tempDan' }] });
  storage.removeItem('fl-ux-temp-used');
  const { r, seen } = await runEoSeen();
  return [w.spa.pageRenames, w.spa.pageSaves,
    outfitCalls(w.server).filter((c) => /rename|save/.test(c[0])), seen.name, w.spa.backs, r.lines.includes('Saved as tempMitPer.')];
}, [2, 1, [['/api/outfit/rename', { outfitId: 3, newName: 'temp1' }], ['/api/outfit/save', undefined],
  ['/api/outfit/rename', { outfitId: 3, newName: 'tempMitPer' }]], 'tempMitPer', 1, true]);
checkAsync('task A 3: a page rename that does nothing: the form is cancelled, the API renames, still saved, no reload', async () => {
  const w = softWorld(Object.assign({ deadRename: true }, T1_WORLD()));
  storage.removeItem('fl-ux-temp-used');
  const { r, seen } = await runEoSeen();
  return [w.spa.pageRenames, w.spa.pageCancels, seen.form, w.server.calls('/api/outfit/rename').map((c) => c[2]),
    w.spa.pageSaves, r.lines.includes('Saved as tempMitPer.'), w.server.outfits().map((o) => o.name), w.spa.backs, !!r.reload];
}, [0, 1, false, [{ outfitId: 8, newName: 'tempMitPer' }], 1, true, ['Dangerous', 'tempMitPer'], 1, false]);
checkAsync('task A 4: a page save that does nothing: the API saves, and the key rename after it goes to the API too', async () => {
  const w = softWorld(Object.assign({ deadSave: true }, T1_WORLD()));
  storage.removeItem('fl-ux-temp-used');
  const { r } = await runEoSeen();
  return [w.spa.pageSaves, w.server.calls('/api/outfit/save').length, w.server.saved[8].Hat, w.spa.pageRenames, w.spa.pageEdits,
    w.server.calls('/api/outfit/rename').length, r.lines.includes('Saved as tempMitPer.'), w.spa.backs];
}, [0, 1, 310, 0, 0, 1, true, 1]);
checkAsync('task A 5: the API switch route (dead dropdown): the API stores as before, the page reloads', async () => {
  const w = softWorld(Object.assign({ deadDropdown: true }, T1_WORLD()));
  storage.removeItem('fl-ux-temp-used');
  const { r } = await runEoSeen();
  return [w.spa.pageSaves, w.spa.pageRenames, outfitCalls(w.server).filter((c) => /rename|save/.test(c[0])),
    w.server.saved[8].Hat, r.lines.includes('Saved as tempMitPer.'), !!r.reload, w.spa.backs];
}, [0, 0, [['/api/outfit/save', undefined], ['/api/outfit/rename', { outfitId: 8, newName: 'tempMitPer' }]], 310, true, true, 1]);
checkAsync('task A 6: a hit with a swap on the page route: one back, saved through the page', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'tempMitPer' }] });
  const { r, seen } = await runEoSeen();
  return [w.spa.backs, w.spa.pageSaves, w.spa.pageRenames, w.server.saved[8].Hat, seen.name,
    r.lines.includes('Saved as tempMitPer.'), !!r.reload];
}, [1, 1, 2, 310, 'tempMitPer', true, false]);
checkAsync('task A 7: the temp already worn (no switch), swaps in the page: stored through the page, one back', async () => {
  const w = softWorld({ outfits: [{ id: 8, name: 'temp1', selected: true }] });
  storage.removeItem('fl-ux-temp-used');
  const { r, seen } = await runEoSeen();
  return [r.lines[0], w.spa.equips, w.spa.backs, w.spa.pageSaves, w.spa.pageRenames, w.server.saved[8].Hat, seen.name,
    r.lines.includes('Saved as tempMitPer.'), !!r.reload];
}, ['Already wearing temp1.', [310], 1, 1, 1, 310, 'tempMitPer', true, false]);
checkAsync('task A 8: the re-read shows the action locked after page swaps: switched back through the page, one back', async () => {
  const w = softWorld({ lockedIn: 'temp1', outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 8, name: 'temp1' }] });
  const { r } = await runEoSeen();
  storage.removeItem('fl-ux-equip-calc');
  return [r.lines[0], w.spa.backs, w.spa.pageSaves, w.spa.pageRenames, selectedName(w.server), w.spa.navClicks];
}, ['Switched back from temp1: the action is locked in it.', 1, 0, 0, 'Dangerous', 1]);
checkAsync('task A fix 1: a save button already disabled is a page miss: false, no click', async () => {
  const w = softWorld({ outfits: [{ id: 8, name: 'temp1', selected: true }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return [await io.saveOnPage(), w.spa.saveClicks, w.spa.pageSaves, w.server.calls('/api/outfit/save').length];
}, [false, 0, 0, 0]);
checkAsync('task A fix 1: the save button stuck disabled while the outfit is dirty: the API saves, the line is true', async () => {
  const w = softWorld(Object.assign({ stuckSave: true }, T1_WORLD()));
  storage.removeItem('fl-ux-temp-used');
  const { r } = await runEoSeen();
  const seenName = doc.body.querySelector('.css-gj4dr3-singleValue');
  return [w.spa.saveClicks, w.spa.pageSaves, w.server.calls('/api/outfit/save').length, w.server.saved[8].Hat,
    r.lines.includes('Saved as tempMitPer.'), w.server.outfits().map((o) => o.name), w.spa.backs, w.spa.pageRenames];
}, [0, 0, 1, 310, true, ['Dangerous', 'tempMitPer'], 1, 1]);
// A greyed-out save button saves through the API but does not give up the
// page for the key rename after it: a store with nothing to swap (the temp
// already holds the best gear) must still show the new name in the dropdown.
checkAsync('task A fix 4: a store with nothing to swap: API save, the key rename still through the page, the dropdown shows it', async () => {
  const w = softWorld(Object.assign({ saved: { 8: { Hat: 310, Luggage: 147174, Companion: 134971 } } }, T1_WORLD()));
  storage.removeItem('fl-ux-temp-used');
  const { r, seen } = await runEoSeen();
  return [w.spa.equips.length, w.server.calls('/api/outfit/save').length, w.spa.pageRenames, seen.name,
    r.lines.includes('Saved as tempMitPer.'), w.spa.backs];
}, [0, 1, 1, 'tempMitPer', true, 1]);
checkAsync('task A fix 2: a dead page rename on a keyed store: the rest of the store goes straight to the API', async () => {
  const w = softWorld({ deadRename: true, outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 3, name: 'tempDan' }] });
  storage.removeItem('fl-ux-temp-used');
  const { r } = await runEoSeen();
  return [w.spa.pageEdits, w.spa.pageCancels, w.spa.saveClicks, w.spa.pageRenames,
    outfitCalls(w.server).filter((c) => /rename|save/.test(c[0])), r.lines.includes('Saved as tempMitPer.'), w.spa.backs];
}, [1, 1, 0, 0, [['/api/outfit/rename', { outfitId: 3, newName: 'temp1' }], ['/api/outfit/save', undefined],
  ['/api/outfit/rename', { outfitId: 3, newName: 'tempMitPer' }]], true, 1]);
checkAsync('task A fix 3: a rename that went through though the wait timed out: counted done, no API rename', async () => {
  const w = softWorld(Object.assign({ stickyForm: true }, T1_WORLD()));
  storage.removeItem('fl-ux-temp-used');
  const { r, seen } = await runEoSeen();
  return [w.spa.pageRenames, w.spa.pageCancels, w.server.calls('/api/outfit/rename').length, seen.name,
    r.lines.includes('Saved as tempMitPer.'), w.server.outfits().map((o) => o.name)];
}, [1, 1, 1, 'tempMitPer', true, ['Dangerous', 'tempMitPer']]);
checkAsync('task A: no outfit controls: page rename and save give false', async () => {
  softWorld({ noDropdown: true });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return [await io.renameOnPage('x'), await io.saveOnPage()];
}, [false, false]);

// --- R3: the Empty outfit button ---------------------------------------------

check('empty: only changeable, filled, non-effect slots; locked counted', () => api.emptySwaps(OUTFIT),
  { swaps: [
    { slot: 'Hat', from: { id: 304, name: 'Hat' }, to: { id: null, name: 'nothing' } },
    { slot: 'Luggage', from: { id: 147174, name: 'Luggage' }, to: { id: null, name: 'nothing' } },
    { slot: 'Companion', from: { id: 134971, name: 'Companion' }, to: { id: null, name: 'nothing' } }],
    locked: 2 });
const emptyWorld = (opts) => {
  const w = softWorld(opts);
  doc.body.querySelectorAll('a.cursor-pointer')[0].click();
  return w;
};
const runEmptyNow = () => api.runEmpty(api.flApi, api.eoSoftIo());
// Emptying goes through the API, one unequip at a time, then ONE reload: a
// click makes the game refetch /plan and the 350 KB /myself after every item
// (about 1.2 s each in the 2026-11-24 captures), an API unequip does not.
checkAsync('empty: a keyed temp is emptied through the API, renamed to a free name, saved, then the page reloads', async () => {
  const w = emptyWorld({ outfits: [{ id: 5, name: 'tempGlaWat', selected: true }, { id: 6, name: 'temp2' }] });
  const r = await runEmptyNow();
  return [r.lines, r.reload || false, w.spa.unequips, w.server.calls('/api/outfit/unequip').map((c) => c[2].qualityId),
    outfitCalls(w.server).filter((c) => !/unequip/.test(c[0])), w.server.outfits().map((o) => o.name), w.server.saved[5]];
}, [['Emptied 3 slots.', '2 slots cannot be changed.', 'Renamed tempGlaWat to temp1 and saved.'], true, [], [304, 147174, 134971],
  [['/api/outfit/rename', { outfitId: 5, newName: 'temp1' }], ['/api/outfit/save', undefined]], ['temp1', 'temp2'], {}]);
checkAsync('empty: a free temp is saved without a rename', async () => {
  const w = emptyWorld({ outfits: [{ id: 5, name: 'temp3', selected: true }] });
  const r = await runEmptyNow();
  return [r.lines[2], outfitCalls(w.server).filter((c) => !/unequip/.test(c[0]))];
}, ['Saved.', [['/api/outfit/save', undefined]]]);
checkAsync('empty: a named outfit is emptied but never renamed or saved', async () => {
  const w = emptyWorld({ outfits: [{ id: 2, name: 'Persuasive', selected: true }] });
  const r = await runEmptyNow();
  return [r.lines, r.reload, w.spa.unequips.length, w.server.calls('/api/outfit/unequip').length,
    w.server.calls('/api/outfit/rename').length, w.server.calls('/api/outfit/save').length];
}, [['Emptied 3 slots.', '2 slots cannot be changed.', 'Not saved.'], true, 0, 3, 0, 0]);
checkAsync('empty: every unequip comes first, one at a time, then the rename, then the save', async () => {
  const w = emptyWorld({ outfits: [{ id: 5, name: 'tempGlaWat', selected: true }] });
  await runEmptyNow();
  return w.server.log.map((c) => c[1]).filter((p) => /unequip|rename|save/.test(p));
}, ['/api/outfit/unequip', '/api/outfit/unequip', '/api/outfit/unequip', '/api/outfit/rename', '/api/outfit/save']);
checkAsync('empty: the outfit name comes from a fresh read, not the page (whose dropdown can be stale)', async () => {
  const w = emptyWorld({ label: 'temp1', outfits: [{ id: 5, name: 'tempGlaWat', selected: true }] });
  const r = await runEmptyNow();
  return [w.server.calls('/api/character/myself').length, r.lines[r.lines.length - 1]];
}, [1, 'Renamed tempGlaWat to temp1 and saved.']);
checkAsync('empty: an unequip that fails: nothing is renamed or saved', async () => {
  const w = emptyWorld({ ignoreClick: true, failUnequip: true, outfits: [{ id: 5, name: 'tempGlaWat', selected: true }] });
  const r = await runEmptyNow();
  return [w.server.calls('/api/outfit/rename').length, w.server.calls('/api/outfit/save').length, /^Could not take off Hat/.test(r.lines[0]),
    r.lines.some((l) => /nothing was saved/.test(l)), w.server.outfits()[0].name];
}, [0, 0, true, true, 'tempGlaWat']);
checkAsync('empty: the rename fails: no save, and it says so', async () => {
  const w = emptyWorld({ failRename: 'temp1', outfits: [{ id: 5, name: 'tempGlaWat', selected: true }] });
  const r = await runEmptyNow();
  return [r.lines[r.lines.length - 1], w.server.calls('/api/outfit/save').length];
}, ['Could not rename tempGlaWat; nothing was saved.', 0]);
checkAsync('empty: the save fails: it says so', async () => {
  const w = emptyWorld({ failSave: true, outfits: [{ id: 5, name: 'temp1', selected: true }] });
  const r = await runEmptyNow();
  return r.lines[r.lines.length - 1];
}, 'Could not save the outfit.');
checkAsync('empty: outfit changes forbidden: says so, touches nothing', async () => {
  const w = emptyWorld({ cannotChange: true, outfits: [{ id: 5, name: 'temp1', selected: true }] });
  const r = await runEmptyNow();
  return [r.lines, w.spa.unequips.length, w.server.calls('/api/outfit/save').length];
}, [['The game does not let you change your outfit here.'], 0, 0]);
checkAsync('empty: a round icon button like the game buttons, right after its save button; a tap runs it', async () => {
  const w = emptyWorld({ outfits: [{ id: 5, name: 'temp1', selected: true }] });
  api.outfitEmptier(); api.outfitEmptier();
  const btns = doc.body.querySelectorAll('.fl-ux-empty');
  const b = btns[0];
  const kids = b.parentNode.children.filter((c) => c.tagName === 'BUTTON');
  const icon = b.querySelector('.fa-trash');
  const shape = [b.className, !!b.querySelector('.buttonlet.fa-stack.fa-lg.buttonlet-enabled'), !!b.querySelector('.fa.fa-circle.fa-stack-2x'),
    icon && icon.className, b.querySelector('.u-visually-hidden').textContent, b.title.length > 0, b.style.cssText];
  b.click();
  await waitFor(() => w.server.calls('/api/outfit/save').length > 0, 3000);
  await waitFor(() => { api.outfitEmptier(); return /Saved/.test((doc.body.querySelector('.fl-ux-empty-line') || { textContent: '' }).textContent); }, 3000);
  return [btns.length, b.tagName, kids.indexOf(b), kids.length, shape, w.server.calls('/api/outfit/unequip').length,
    doc.body.querySelector('.fl-ux-empty-line').textContent.includes('Saved.')];
}, [1, 'BUTTON', 3, 4, ['buttonlet-container fl-ux-empty', true, true, 'fa fa-inverse fa-stack-1x fa-trash', 'Empty outfit', true, ''], 3, true]);
checkAsync('empty: the result line goes under the whole outfit box, not into its grid', async () => {
  emptyWorld({ outfits: [{ id: 5, name: 'temp1', selected: true }] });
  api.outfitEmptier();
  const box = doc.body.querySelector('.outfit-controls');
  const wrap = doc.body.querySelector('.fl-ux-empty-wrap');
  return [box.querySelector('.fl-ux-empty-wrap') === null, box.nextSibling === wrap];
}, [true, true]);
checkAsync('empty: in rename mode (no game buttons) no button is drawn', async () => {
  const w = emptyWorld({ renameMode: true, outfits: [{ id: 5, name: 'temp1', selected: true }] });
  api.outfitEmptier();
  const during = doc.body.querySelectorAll('.fl-ux-empty').length;
  return [during];
}, [0]);
checkAsync('empty: switched off, the button and the line go', async () => {
  emptyWorld({ outfits: [{ id: 5, name: 'temp1', selected: true }] });
  api.outfitEmptier();
  api.outfitEmptierOff();
  return [doc.body.querySelectorAll('.fl-ux-empty').length, doc.body.querySelectorAll('.fl-ux-empty-wrap').length];
}, [0, 0]);

checkAsync('empty: the game redraws the screen mid-run and a new button is built: the line lands in the new one', async () => {
  const w = emptyWorld({ outfits: [{ id: 5, name: 'temp1', selected: true }] });
  api.outfitEmptier();
  const oldWrap = doc.body.querySelector('.fl-ux-empty-wrap');
  const real = fetchImpl;
  fetchImpl = async (url, init) => {
    if (url.endsWith("/api/outfit/save")) {
      doc.body.querySelectorAll('a.cursor-pointer')[0].click();
      api.outfitEmptier();
    }
    return real(url, init);
  };
  doc.body.querySelector('.fl-ux-empty').click();
  await waitFor(() => w.server.calls('/api/outfit/save').length > 0, 3000);
  await waitFor(() => { api.outfitEmptier(); return /Saved/.test((doc.body.querySelector('.fl-ux-empty-line') || { textContent: '' }).textContent); }, 3000);
  const fresh = doc.body.querySelector('.fl-ux-empty-wrap');
  return [fresh !== oldWrap, fresh.querySelector('.fl-ux-empty-line').textContent.includes('Saved.'),
    storage.getItem('fl-ux-empty-result')];
}, [true, true, null]);
checkAsync('empty: a kept result line is drawn once into the button already there, then forgotten', async () => {
  softWorld({ outfits: [{ id: 5, name: 'temp1', selected: true }] });
  doc.body.querySelectorAll('a.cursor-pointer')[0].click();
  api.outfitEmptier();
  storage.setItem('fl-ux-empty-result', JSON.stringify({ at: Date.now(), lines: ['Emptied 3 slots.', 'Saved.'] }));
  api.outfitEmptier();
  const line = doc.body.querySelector('.fl-ux-empty-line');
  const drawn = line.children.filter((c) => c.tagName === 'DIV').map((c) => c.textContent);
  api.outfitEmptier();
  return [drawn, line.children.filter((c) => c.tagName === 'DIV').length, storage.getItem('fl-ux-empty-result')];
}, [['Emptied 3 slots.', 'Saved.'], 2, null]);

(async () => {
  for (const fn of pending) await fn();
  if (failures) {
    console.log('\n' + failures + ' check(s) FAILED.');
    process.exit(1);
  }
  console.log('\nAll checks passed.');
})();
