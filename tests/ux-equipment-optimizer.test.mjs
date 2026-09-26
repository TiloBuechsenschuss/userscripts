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
  const m = /^([a-zA-Z]+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:([*^$]?=)"([^"]*)")?\])?$/.exec(sel);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  if (m[2]) {
    const classes = String(el.className).split(/\s+/);
    for (const c of m[2].split('.').filter(Boolean)) if (!classes.includes(c)) return false;
  }
  if (m[3]) {
    const v = m[3] === 'id' ? el.id : m[3] === 'title' ? el.title : el.getAttribute(m[3]);
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
];
const exposed = NAMES.map((n) => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ');
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/, 'return { ' + exposed + ' }; })();');

let fetchImpl = () => Promise.reject(new Error('no fetch stub set'));
let backHandler = () => {};
const historyStub = { back() { backHandler(); } };
const reloads = [];
const location = { pathname: '/', reload() { reloads.push(1); } };
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event', 'fetch', 'history',
  wrapped + '\nreturn globalThis.__flux;')(
  doc, class { observe() {} }, () => {}, () => ({ position: 'static', color: 'rgb(51, 51, 51)' }),
  console, URLSearchParams, storage, storage, location, class {},
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
check('10% is the floor and hides the headroom, so it is fixed',
  () => api.inferChallenge(CH('Skills', 'Mithridacy', 10), 1), { fixed: 0.1 });
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
check('a stat you have no level in, on a challenge that is not fixed',
  () => blocked(Object.assign({}, PREACH, { challenges: [chal('Neathproofed', 'Skills', 50)] })),
  ['blocked', 'no-level']);
check('a fixed challenge on a quality with no level is simply left as it is',
  () => planOf(Object.assign({}, PREACH, { challenges: [chal('Neathproofed', 'Skills', 100)] })).status, 'already');

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
const eoLine = (b) => (b.querySelector('.fl-ux-eo-line') || { textContent: '' }).textContent;
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
  const level = () => 248 + bonus('Persuasive');
  const shown = () => opts.stuck ? 90 : Math.floor(0.6 * level() / 175 * 100 + 1e-9);
  // The Dangerous scenario: broad, true difficulty 200, base 184 (189 with the Iron Hat).
  const dangerousLevel = () => 184 + bonus('Dangerous');
  const dangerousShown = () => Math.floor(0.6 * dangerousLevel() / 200 * 100 + 1e-9);
  const log = [];
  const slotsNow = () => OUTFIT.slots.map((s) => (worn[s.name] ? Object.assign({}, s, { qualityId: worn[s.name] }) : s));
  fetchImpl = async (url, init) => {
    const path = url.replace('https://api.fallenlondon.com', '');
    log.push([init.method, path, init.body ? JSON.parse(init.body) : undefined, init.headers.Authorization]);
    if (opts.gate) await opts.gate;
    if (path === '/api/character/myself') {
      const copy = JSON.parse(JSON.stringify(MYSELF));
      for (const g of copy.possessions) {
        for (const p of g.possessions) {
          if (p.name === 'Persuasive') p.effectiveLevel = level();
          if (p.name === 'Dangerous' && !p.equippable) p.effectiveLevel = dangerousLevel();
        }
      }
      return reply(200, copy);
    }
    if (path === '/api/outfit') return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow() }));
    if (path === '/api/storylet') {
      return reply(200, { canChangeOutfit: opts.cannotChange !== true, phase: 'In', storylet: { childBranches: [Object.assign({}, PREACH, {
        challenges: opts.dangerous
          ? [chal('Dangerous', 'BasicAbility', dangerousShown())]
          : [chal('Mithridacy', 'Skills', 20), chal('Persuasive', 'BasicAbility', shown())],
        qualityRequirements: [],
      })] } });
    }
    if (path === '/api/outfit/unequip') {
      const id = JSON.parse(init.body).qualityId;
      delete worn[items[id].category];
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: true }));
    }
    if (path === '/api/outfit/equip') {
      const id = JSON.parse(init.body).qualityId;
      if (opts.failEquip) return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: false }));
      worn[items[id].category] = id;
      return reply(200, Object.assign({}, OUTFIT, { slots: slotsNow(), isSuccess: true }));
    }
    return reply(404, {});
  };
  return { worn, log, equips: () => log.filter((c) => c[1] === '/api/outfit/equip').map((c) => c[2].qualityId) };
}

function freshWorld(opts) {
  storage.removeItem('fl-ux-equip-undo');
  storage.removeItem('fl-ux-equip-result');
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
check('the button sits with the action\'s own buttons, and is a real, touch-sized button', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const b = eoButton(branches[0]);
  return [b.closest('.storylet__buttons') !== null, b.type, b.textContent, /min-height:\s*44px/.test(b.style.cssText)];
}, [true, 'button', 'Optimize equipment', true]);
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
  return [eoLine(branches[0]).includes('18.4%'), undo !== null && /min-height:\s*44px/.test(undo.style.cssText)];
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
  const spa = { equips: [], unequips: [], navClicks: 0, backs: 0 };
  const byId = {};
  for (const g of MYSELF.possessions) for (const p of g.possessions) if (p.equippable) byId[p.id] = p;
  let screen = null;
  const drawPossessions = () => {
    if (screen) screen.remove();
    screen = add(doc.body, 'div', 'possessions');
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
          if (opts.ignoreClick) return;
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

// --- finish ----------------------------------------------------------------

(async () => {
  for (const fn of pending) await fn();
  if (failures) {
    console.log('\n' + failures + ' check(s) FAILED.');
    process.exit(1);
  }
  console.log('\nAll checks passed.');
})();
