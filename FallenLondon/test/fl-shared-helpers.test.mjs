// Ad-hoc test for what FallenLondon/ux-enhancers.js and FallenLondon/choice-helper.js
// share now that they are two files.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads both userscripts, evaluates their IIFEs against a stub
// DOM and pulls out the internals.
//
// The two were one file until UX Enhancers 3.0. A userscript has no imports, so
// every helper both need -- the Myself and Possessions scrapes, the cache, the
// hidden-frame refresh, the panel styling -- is carried twice, and what they
// share at run time goes through the page: one array and one event on `window`.
// That makes two ways to break them that no other suite can see, because every
// other suite loads only one of the two:
//
//  - The copies DRIFT. A fix to `readPossessionCounts` in one file and not the
//    other is a bug that looks fixed. So every top-level declaration the two
//    files have in common must be byte-identical, except a short list that
//    differs on purpose and says why.
//  - The contract breaks. Choice Helper's panels have to reach UX Enhancers'
//    menu whichever script loads first, and a page one script loads in a
//    hidden frame has to be banked by the other, or the split doubled the cost
//    of every background refresh.
//
//   node FallenLondon/test/fl-shared-helpers.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const UX = 'ux-enhancers.js';
const CHOICE = 'choice-helper.js';
const source = (file) => readFileSync(join(here, '..', file), 'utf8');

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- the copies ------------------------------------------------------------

// Every top-level declaration, by name, as the text it spans. A function runs
// to its closing `  }`; a const or let to the first `;` that closes every
// bracket it opened, so a multi-line table or string concatenation comes out
// whole.
function declarations(src) {
  const lines = src.split(/\r?\n/);
  const out = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = /^  (?:async )?(function|const|let) ([A-Za-z0-9_]+)/.exec(lines[i]);
    if (!m) continue;
    let j = i;
    if (m[1] === 'function') {
      while (j < lines.length && lines[j] !== '  }') j++;
    } else {
      let depth = 0;
      for (; j < lines.length; j++) {
        const code = lines[j].replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/\/\/.*$/, '');
        for (const c of code) {
          if ('([{'.includes(c)) depth++;
          else if (')]}'.includes(c)) depth--;
        }
        if (depth <= 0 && /;\s*$/.test(code)) break;
      }
    }
    out.set(m[2], lines.slice(i, j + 1).join('\n'));
  }
  return out;
}

const uxDecl = declarations(source(UX));
const choiceDecl = declarations(source(CHOICE));

// The ones that differ ON PURPOSE. Anything else declared in both files is a
// copy, and a copy that has drifted is a bug in one of them.
const DIFFERENT = {
  SCRIPT_ID: 'which script is talking -- the one thing the shared block may not share',
  refreshBackgroundState: 'each refreshes and banks only its own numbers',
  FEATURES: 'each registry holds its own features',
  PANELS: 'each script\'s own panels',
  scan: 'the dispatch: Choice Helper also prunes a tap-to-read panel',
};

// The helpers this suite exists for. Listed, so that renaming one in a single
// file shows up as a missing copy rather than as two unrelated names that
// happen to pass.
const SHARED = [
  'h', 'wikiHref', 'wikiLink', 'TAG_RE', 'normalizeName', 'itemKey', 'UI', 'viewportSize',
  'TH', 'TD', 'COLOR_READY', 'COLOR_FULL',
  'FACTION_QUALITY_RE', 'parseQualityItem', 'readQualities', 'OWNED_MARKER', 'ITEM_COUNT_RE',
  'itemNameFromLabel', 'itemCountFromLabel', 'itemCountFromNode', 'readPossessionCounts',
  'characterName', 'loadCache', 'saveCache', 'REFRESH_TIMEOUT_MS', 'loadInFrame',
  'AUTO_KEY', 'autoRefreshEnabled', 'setAutoRefresh', 'FRESH_MS', 'stateIsFresh', 'ageText',
  'PANEL_REGISTRY', 'FRAME_EVENT', 'pageWindow', 'sharedPanels', 'shareFrame', 'onSharedFrame',
  'myselfLoaded', 'possessionsLoaded', 'LAUNCHER_ID', 'LAUNCHER_BUTTON_ID',
];

check('every shared helper is declared in both files',
  SHARED.filter((n) => !uxDecl.has(n) || !choiceDecl.has(n)), []);

const common = [...uxDecl.keys()].filter((n) => choiceDecl.has(n));
check('every declaration the two files have in common is byte-identical, bar the listed ones',
  common.filter((n) => !(n in DIFFERENT) && uxDecl.get(n) !== choiceDecl.get(n)), []);

check('...and the listed ones really do differ, so the list cannot go stale',
  Object.keys(DIFFERENT).filter((n) => uxDecl.get(n) === choiceDecl.get(n)), []);

// --- a stub page -----------------------------------------------------------

function makeEl(tag) {
  const el = {
    nodeType: 1, tagName: String(tag || 'div').toUpperCase(), id: '', className: '', title: '',
    style: { cssText: '' }, dataset: {}, children: [], childNodes: [], parentNode: null,
    _text: '',
    get textContent() { return this._text + this.children.map((c) => c.textContent || '').join(''); },
    set textContent(v) { this._text = String(v); this.children = []; this.childNodes = []; },
    get isConnected() { return false; },
    classList: { contains: () => false },
    appendChild(c) {
      if (c.parentNode && c.parentNode.children) {
        c.parentNode.children = c.parentNode.children.filter((n) => n !== c);
      }
      c.parentNode = this;
      if (c.nodeType === 1) this.children.push(c);
      else this._text += c.nodeValue;
      return c;
    },
    insertBefore(c) { return this.appendChild(c); },
    remove() {
      if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    after() {}, contains: () => false, closest: () => null,
    addEventListener() {}, setAttribute() {}, getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    querySelector: () => null, querySelectorAll: () => [],
  };
  return el;
}

function makeWindow() {
  const listeners = {};
  return {
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent(e) { (listeners[e.type] || []).forEach((fn) => fn(e)); return true; },
  };
}

class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init ? init.detail : null;
  }
}

function makePage(withWindow) {
  const store = new Map();
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
  const body = makeEl('body');
  const doc = {
    body, documentElement: body,
    createElement: makeEl,
    createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, elementsFromPoint: () => [],
  };
  const errors = [];
  return {
    doc, store, storage, errors,
    win: withWindow ? makeWindow() : undefined,
    console: { error: (...a) => errors.push(a.map(String).join(' ')), log() {}, warn() {} },
  };
}

function load(page, file, names) {
  const wrapped = source(file)
    .replace('(function () {', 'globalThis.__flShared = (function () {')
    .replace(/\}\)\(\);\s*$/, 'return { ' + names.join(', ') + ' }; })();');
  return new Function(
    'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
    'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event', 'CustomEvent',
    'window', wrapped + '\nreturn globalThis.__flShared;')(
    page.doc, class { observe() {} }, () => {}, () => ({ position: 'relative' }), page.console,
    URLSearchParams, page.storage, page.storage, { pathname: '/' }, class {}, CustomEvent,
    page.win);
}

const UX_NAMES = ['menuPanels', 'sharedPanels', 'shareFrame', 'myselfLoaded', 'possessionsLoaded',
  'CACHE_KEY', 'ITEMS_KEY', 'SCRIPT_ID'];
const CHOICE_NAMES = ['PANELS', 'registerPanels', 'shareFrame', 'PC_CACHE_KEY', 'FOTZ_CACHE_KEY',
  'COUNTS_KEY', 'SCRIPT_ID'];

// --- the panel registry ----------------------------------------------------

const CHOICE_PANELS = ['zailing', 'port-carnelian', 'scientific-voyages', 'fruits-of-the-zee', 'university-laboratory'];

for (const first of [UX, CHOICE]) {
  const page = makePage(true);
  const order = first === UX ? [UX, CHOICE] : [CHOICE, UX];
  const apis = {};
  for (const file of order) apis[file] = load(page, file, file === UX ? UX_NAMES : CHOICE_NAMES);
  const ids = apis[UX].menuPanels().map((p) => p.id);
  check('loaded ' + order.join(' then ') + ': the menu holds Factions and then Choice Helper\'s five',
    ids, ['factions', ...CHOICE_PANELS]);
  check('...and neither script threw while loading', page.errors, []);
  apis[CHOICE].registerPanels();
  check('...registering again adds nothing', page.win.__flUxPanels.map((p) => p.id), CHOICE_PANELS);
}

{
  const page = makePage(false);
  const ux = load(page, UX, UX_NAMES);
  const choice = load(page, CHOICE, CHOICE_NAMES);
  check('with no window at all, UX Enhancers offers its own panels and nothing breaks',
    [ux.menuPanels().map((p) => p.id), ux.sharedPanels(), page.errors], [['factions'], null, []]);
  choice.shareFrame('/myself', qualityDoc([['Renown: Bohemians', '27/55']]));
  check('...and sharing a frame is a quiet no-op', page.errors, []);
}

check('the two scripts introduce themselves differently, which is what stops one hearing itself',
  (() => {
    const page = makePage(true);
    return load(page, UX, UX_NAMES).SCRIPT_ID !== load(page, CHOICE, CHOICE_NAMES).SCRIPT_ID;
  })(), true);

// --- sharing a hidden frame ------------------------------------------------

function qualityDoc(pairs) {
  const items = pairs.map(([alt, level]) => ({
    querySelector(sel) {
      if (sel === '.quality-item__name') return { textContent: alt + ' ' + level };
      if (sel === 'img[alt]') return { getAttribute: () => alt };
      return null;
    },
  }));
  return {
    body: {},
    querySelectorAll: (sel) => (sel === 'li.quality-item' ? items : []),
    querySelector: () => null,
  };
}

function possessionsDoc(count) {
  const nodes = Array.from({ length: count }, (_, i) => ({
    getAttribute: (k) => (k === 'aria-label' ? 'Item number ' + i + '; flavour text' : null),
    querySelector: () => null,
  }));
  return {
    body: {},
    querySelectorAll: (sel) => (sel === '[data-quality-id]' ? nodes : []),
    querySelector: () => null,
  };
}

{
  const page = makePage(true);
  const ux = load(page, UX, UX_NAMES);
  const choice = load(page, CHOICE, CHOICE_NAMES);
  const myself = qualityDoc([['Renown: Bohemians', '27/55'], ['Striped Delights', '40']]);

  check('a Myself page without a single faction quality is not loaded yet',
    [ux.myselfLoaded(qualityDoc([['Striped Delights', '40']])), !!ux.myselfLoaded(myself)],
    [null, true]);
  check('a Possessions page of twenty items or fewer is not loaded yet',
    [choice.shareFrame && ux.possessionsLoaded(possessionsDoc(20)), !!ux.possessionsLoaded(possessionsDoc(21))],
    [null, true]);

  ux.shareFrame('/myself', myself);
  check('a Myself page UX Enhancers loaded is banked by Choice Helper -- festival and purse both',
    [page.store.has(choice.FOTZ_CACHE_KEY), page.store.has(choice.PC_CACHE_KEY)], [true, true]);
  check('...and not by UX Enhancers itself on hearing its own event, which is its refresh\'s job',
    page.store.has(ux.CACHE_KEY), false);
  check('the purse Choice Helper banked is the one on that page',
    JSON.parse(page.store.get(choice.PC_CACHE_KEY)).values['Striped Delights'], 40);

  page.store.clear();
  choice.shareFrame('/myself', myself);
  check('a Myself page Choice Helper loaded is banked by UX Enhancers, and not by itself',
    [page.store.has(ux.CACHE_KEY), page.store.has(choice.PC_CACHE_KEY)], [true, false]);
  check('the Renown UX Enhancers banked is the one on that page',
    JSON.parse(page.store.get(ux.CACHE_KEY)).values.bohemians, { renown: 27, favours: 0, favoursCap: 7 });

  page.store.clear();
  choice.shareFrame('/possessions', possessionsDoc(25));
  ux.shareFrame('/possessions', possessionsDoc(30));
  check('each script banks the other\'s Possessions page -- owned items one way, counts the other',
    [JSON.parse(page.store.get(ux.ITEMS_KEY) || '{}').owned.length,
      JSON.parse(page.store.get(choice.COUNTS_KEY) || '{}').held.length],
    [25, 30]);
  check('none of it threw', page.errors, []);
}

console.log(failures ? '\n' + failures + ' check(s) FAILED.' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
