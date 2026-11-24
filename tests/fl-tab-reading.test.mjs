// Ad-hoc test for the tab-reading engine both Fallen London scripts carry
// (`tabSource` / `wantTab` / `captureTabs` / `refreshTabs`, "shared: reading
// the tabs" in either file).
//
// What it pins, because each was a reported problem or the point of the
// rework:
//
//  - ONE refresh feeds every feature. Every feature registers what it wants off
//    which tab, and a refresh started from any one panel banks all of them --
//    so the next panel opened is as fresh as the one whose Refresh was pressed.
//  - Walking onto Myself or Possessions with a panel open redraws that panel.
//    Before, the tab was banked but the panel kept showing the old reading
//    until it was closed and opened again.
//  - Automatic refreshes cannot loop: a tab read or tried within its window is
//    not loaded again, a tab that will not load is not retried on every
//    redraw, and the Agents tab (one panel's) is not booted on every refresh.
//  - The two scripts share the work: a frame either loads is banked by both,
//    and a tab one has just taken is not due for the other.
//
//   node tests/fl-tab-reading.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = (file) => readFileSync(join(here, '..', 'FallenLondon', file), 'utf8');
const UX = 'ux-enhancers.js';
const CHOICE = 'choice-helper.js';

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- tab documents ------------------------------------------------------------

function qualityDoc(pairs, search) {
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
    querySelector: (sel) => (sel === 'input.input--item-search' && search ? { value: search } : null),
  };
}

function possessionsDoc(names) {
  const nodes = names.map((name) => ({
    getAttribute: (k) => (k === 'aria-label' ? name + '; flavour text' : null),
    querySelector: () => null,
  }));
  return {
    body: {},
    querySelectorAll: (sel) => (sel === '[data-quality-id]' ? nodes : []),
    querySelector: () => null,
  };
}

const BLANK = { body: {}, querySelectorAll: () => [], querySelector: () => null };
const MYSELF = qualityDoc([['Renown: Bohemians', '27/55'], ['Striped Delights', '40'], ['Spirit of Hallowmas', '12']]);
const ITEMS = Array.from({ length: 25 }, (_, i) => 'Item number ' + i).concat(['Witch-Stone × 3']);
const POSSESSIONS = possessionsDoc(ITEMS);

// --- a page both scripts can run in ------------------------------------------------

function makeEl(tag) {
  const el = {
    nodeType: 1, tagName: String(tag || 'div').toUpperCase(), id: '', className: '', title: '',
    style: { cssText: '' }, dataset: {}, children: [], childNodes: [], parentNode: null, _text: '',
    get textContent() { return this._text + this.children.map((c) => c.textContent || '').join(''); },
    set textContent(v) { this._text = String(v); this.children = []; },
    classList: { contains: () => false },
    appendChild(c) { c.parentNode = this; if (c.nodeType === 1) this.children.push(c); return c; },
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

class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init ? init.detail : null; }
}

function makePage() {
  const store = new Map();
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
  const page = { store, storage, screen: BLANK, frames: {}, booted: [], errors: [] };
  const body = makeEl('body');
  // A hidden frame gets whatever document the test says that route draws; a
  // route with none never finishes loading, and times out.
  body.appendChild = function (c) {
    c.parentNode = this;
    this.children.push(c);
    if (c.tagName === 'IFRAME') {
      page.booted.push(c.src);
      c.contentDocument = page.frames[c.src] || null;
    }
    return c;
  };
  page.doc = {
    body, documentElement: body, createElement: makeEl,
    createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
    getElementById: () => null,
    querySelectorAll: (sel) => page.screen.querySelectorAll(sel),
    querySelector: (sel) => page.screen.querySelector(sel),
    addEventListener() {}, elementsFromPoint: () => [],
  };
  const listeners = {};
  page.win = {
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent(e) { (listeners[e.type] || []).forEach((fn) => fn(e)); return true; },
  };
  page.console = { error: (...a) => page.errors.push(a.map(String).join(' ')), log() {}, warn() {} };
  return page;
}

// Real timers, but the frame's 20-second give-up fires at once, so a route that
// never loads fails in a test-sized moment.
const quickTimeout = (fn, ms) => setTimeout(fn, ms >= 1000 ? 5 : ms);

function load(page, file, names) {
  const wrapped = source(file)
    .replace('(function () {', 'globalThis.__flTabs = (function () {')
    .replace(/\}\)\(\);\s*$/, 'return { ' + names.join(', ') + ' }; })();');
  return new Function(
    'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
    'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event', 'CustomEvent',
    'window', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    wrapped + '\nreturn globalThis.__flTabs;')(
    page.doc, class { observe() {} }, () => {}, () => ({ position: 'relative' }), page.console,
    URLSearchParams, page.storage, page.storage, { pathname: '/' }, class {}, CustomEvent,
    page.win, quickTimeout, (fn) => setInterval(fn, 1), clearTimeout, clearInterval);
}

const ENGINE = ['tabSources', 'refreshTabs', 'refreshTabsNow', 'autoRefreshTabs', 'captureTabs', 'tabDue',
  'tabById', 'TABS_KEY', 'FEATURES'];
const CHOICE_NAMES = ENGINE.concat(['PANELS', 'PC_CACHE_KEY', 'FOTZ_CACHE_KEY', 'COUNTS_KEY', 'LAB_CACHE_KEY',
  'CTD_CACHE_KEY', 'PHF_CACHE_KEY', 'WW_CACHE_KEY', 'HM_CACHE_KEY', 'AGENTS_KEY', 'readPcState', 'readHmSpirit',
  'renderPortCarnelianPanel', 'renderWwPanel', 'renderHallowmasPanel']);
const UX_NAMES = ENGINE.concat(['CACHE_KEY', 'ITEMS_KEY', 'renderFactionsPanel']);

const flush = () => new Promise((r) => setTimeout(r, 0));
const fakeCtx = () => {
  const ctx = { draws: 0, rerender() { this.draws++; } };
  return ctx;
};
const cached = (page, key) => (page.store.has(key) ? JSON.parse(page.store.get(key)) : null);

// --- one refresh, every feature ----------------------------------------------------

{
  const page = makePage();
  page.frames['/myself'] = MYSELF;
  page.frames['/possessions'] = POSSESSIONS;
  const choice = load(page, CHOICE, CHOICE_NAMES);

  check('Choice Helper reads three tabs, Myself first',
    choice.tabSources.map((s) => s.id + ' ' + s.path), ['myself /myself', 'possessions /possessions', 'agents /agents']);
  check('...and every feature that reads Myself asked for it, rather than being listed by the refresh',
    choice.tabById('myself').wants.length, 7);
  check('the capture is one feature, the first, drawing nothing and filed under no switch',
    [choice.FEATURES[0].name, choice.FEATURES[0].group || null], ['tab-capture', null]);

  const ctx = fakeCtx();
  // The Whisker-Ways panel, opened on nothing at all: its own Refresh is what
  // pays for everyone's.
  choice.renderWwPanel(ctx);
  await choice.refreshTabs(false);
  await flush();
  const keys = ['PC_CACHE_KEY', 'FOTZ_CACHE_KEY', 'LAB_CACHE_KEY', 'CTD_CACHE_KEY', 'PHF_CACHE_KEY',
    'WW_CACHE_KEY', 'HM_CACHE_KEY', 'COUNTS_KEY'];
  check('one refresh from one panel banks every feature\'s figures, Myself and Possessions alike',
    keys.filter((k) => !cached(page, choice[k])), []);
  check('...the other panels read them: Port Carnelian\'s purse and Hallowmas\'s Spirit',
    [choice.readPcState().values['Striped Delights'], choice.readHmSpirit().spirit], [40, 12]);
  check('...each tab was booted once, in order, the Agents tab last',
    page.booted, ['/myself', '/possessions', '/agents']);
  check('...an Agents tab that never drew is banked as a failed read, not as no Agents',
    !!cached(page, choice.AGENTS_KEY).failedAt, true);
  check('...and the panel that asked was redrawn as the tabs landed', ctx.draws >= 1, true);

  page.booted.length = 0;
  const again = fakeCtx();
  check('an automatic refresh a moment later loads nothing: every tab was just read or tried',
    [choice.autoRefreshTabs(again, true), page.booted], [false, []]);
  check('...the failed Agents tab is not due for an hour, the others for a minute',
    choice.tabSources.map((s) => [s.id, s.retry / 60000]), [['myself', 1], ['possessions', 1], ['agents', 60]]);

  await choice.refreshTabsNow();
  await flush();
  check('a Refresh button loads every tab regardless', page.booted, ['/myself', '/possessions', '/agents']);
  check('...and nothing threw anywhere', page.errors, []);
}

// --- walking onto a tab with a panel open -------------------------------------------

{
  const page = makePage();
  const choice = load(page, CHOICE, CHOICE_NAMES);
  page.storage.setItem('fl-ux-auto-refresh', '0');
  const ctx = fakeCtx();
  choice.renderPortCarnelianPanel(ctx);
  check('the Port Carnelian panel opens on no reading', choice.readPcState(), null);

  page.screen = MYSELF;
  choice.captureTabs();
  await flush();
  check('walking onto Myself banks it for every feature and redraws the open panel',
    [ctx.draws, cached(page, choice.PC_CACHE_KEY).values['Striped Delights'],
      cached(page, choice.WW_CACHE_KEY) != null], [1, 40, true]);

  choice.captureTabs();
  await flush();
  check('the same tab on the next scan is not banked or redrawn again', ctx.draws, 1);

  page.screen = qualityDoc([['Renown: Bohemians', '27/55'], ['Striped Delights', '40']], 'Strip');
  choice.captureTabs();
  await flush();
  check('typing in the Myself search box is a change: the reading is re-banked as partial',
    [ctx.draws, cached(page, choice.PC_CACHE_KEY).partial], [2, true]);

  page.screen = BLANK;
  choice.captureTabs();
  await flush();
  check('walking off it redraws once more, so "live" turns into a banked age', ctx.draws, 3);

  page.screen = POSSESSIONS;
  choice.captureTabs();
  await flush();
  check('walking onto Possessions does the same for what you hold',
    [ctx.draws, cached(page, choice.COUNTS_KEY).held.length], [4, 26]);
  check('no frame was booted for any of it', page.booted, []);
}

// --- every panel that shows a tab takes part ----------------------------------------

{
  const page = makePage();
  page.storage.setItem('fl-ux-auto-refresh', '0');
  const choice = load(page, CHOICE, CHOICE_NAMES);
  const reading = ['port-carnelian', 'fruits-of-the-zee', 'university-laboratory', 'spending-secrets',
    'philosofruits', 'whisker-ways', 'hallowmas'];
  const watched = [];
  for (const panel of choice.PANELS) {
    if (!reading.includes(panel.id)) continue;
    const ctx = fakeCtx();
    panel.render(ctx);
    page.screen = page.screen === MYSELF ? BLANK : MYSELF;
    choice.captureTabs();
    await flush();
    if (ctx.draws > 0) watched.push(panel.id);
  }
  check('every panel that shows a Myself or Possessions figure is redrawn when the tab goes by',
    watched, reading);
  check('...without starting a refresh, with auto-refresh off', page.booted, []);
}

// --- the two scripts together --------------------------------------------------------

{
  const page = makePage();
  page.frames['/myself'] = MYSELF;
  page.frames['/possessions'] = POSSESSIONS;
  const ux = load(page, UX, UX_NAMES);
  const choice = load(page, CHOICE, CHOICE_NAMES);
  check('UX Enhancers reads the same two tabs, through the same engine',
    ux.tabSources.map((s) => s.id), ['myself', 'possessions']);

  const factions = fakeCtx();
  ux.autoRefreshTabs(factions, false); // the Factions panel was opened last
  await choice.refreshTabsNow();
  await flush();
  check('a refresh Choice Helper runs is banked by UX Enhancers off the same frames',
    [cached(page, ux.CACHE_KEY).values.bohemians.renown, cached(page, ux.ITEMS_KEY).owned.length], [27, 26]);
  check('...and redraws the Factions panel, if that is the one open', factions.draws >= 1, true);
  check('...with each page booted once between the two of them',
    page.booted, ['/myself', '/possessions', '/agents']);

  page.booted.length = 0;
  check('a tab one script has just read is not due for the other\'s automatic refresh',
    [ux.autoRefreshTabs(fakeCtx(), true), page.booted], [false, []]);
  check('...and nothing threw', page.errors, []);
}

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
