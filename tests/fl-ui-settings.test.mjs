// Ad-hoc test for the shared Fallen London show/hide switches (tm-fl-ui-settings).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script.
//
// What's pinned here:
//
//   - The tm-fl-ui-settings block is byte-identical in wiki-links.js, ux-enhancers.js and
//     choice-helper.js.
//   - Storage: default shown, set/unset round trip, two scripts never clobber each other,
//     corrupt or wrong-shaped JSON reads as nothing hidden, blocked storage does not throw,
//     and a switch announces itself on the window.
//   - Every Choice Helper feature is filed under a known category or is named here as drawing
//     nothing; no name is filed twice or filed but missing; the launcher and the captures are
//     never switchable.
//   - The settings view lists categories in the fixed order, and a menu entry switched off
//     leaves the launcher menu while Settings stays.
//   - A badge drawn while a feature runs is taken out again when that feature is switched off,
//     and its host's flag goes with it so switching on draws it again.
//
//   node tests/fl-ui-settings.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = (f) => readFileSync(join(here, '..', 'FallenLondon', f), 'utf8').replace(/\r\n/g, '\n');
const WIKI = 'wiki-links.js', UX = 'ux-enhancers.js', CHOICE = 'choice-helper.js';

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- the shared block -------------------------------------------------------

const block = (s) => s.match(/ {2}\/\/ --- BEGIN tm-fl-ui-settings[\s\S]*?\/\/ --- END tm-fl-ui-settings ---\n/);
const bw = block(source(WIKI)), bu = block(source(UX)), bc = block(source(CHOICE));
check('block present in all three scripts', !!(bw && bu && bc), true);
check('block byte-identical', bw && bu && bc && bw[0] === bu[0] && bw[0] === bc[0], true);

// --- a stub page ------------------------------------------------------------

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
      this.removed = true;
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

function makePage(opts) {
  const store = opts && opts.store ? opts.store : { d: {} };
  const storage = {
    getItem: (k) => { if (store.blocked) throw new Error('blocked'); return k in store.d ? store.d[k] : null; },
    setItem: (k, v) => { if (store.blocked) throw new Error('blocked'); store.d[k] = String(v); },
    removeItem: (k) => { delete store.d[k]; },
  };
  const body = makeEl('body');
  const badges = [];
  const doc = {
    body, documentElement: body,
    createElement: makeEl,
    createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
    getElementById: () => null, querySelector: () => null,
    // Only the badge sweep asks for these; hand it what the test drew.
    querySelectorAll: (sel) => (String(sel).indexOf('data-fl-feature') >= 0 ? badges.filter((b) => !b.removed) : []),
    addEventListener() {}, elementsFromPoint: () => [],
  };
  const errors = [];
  return {
    doc, store, storage, errors, badges,
    win: makeWindow(),
    console: { error: (...a) => errors.push(a.map(String).join(' ')), log() {}, warn() {} },
  };
}

function load(page, file, names, extra) {
  const wrapped = source(file)
    .replace('(function () {', 'globalThis.__flUiTest = (function () {')
    .replace(/\}\)\(\);\s*$/, (extra || '') + '\nreturn { ' + names.join(', ') + ' }; })();');
  return new Function(
    'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
    'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event', 'CustomEvent',
    'window', wrapped + '\nreturn globalThis.__flUiTest;')(
    page.doc, class { observe() {} }, () => {}, () => ({ position: 'relative' }), page.console,
    URLSearchParams, page.storage, page.storage, page.location || { pathname: '/' }, class {}, CustomEvent,
    page.win);
}

// --- storage ----------------------------------------------------------------

const BLOCK_NAMES = ['flUiHidden', 'flUiSetHidden', 'flUiOnChange', 'flUiRegister', 'flUiRenderSettings'];
{
  const page = makePage();
  const api = load(page, WIKI, BLOCK_NAMES);
  const seen = [];
  api.flUiOnChange(() => seen.push('change'));
  check('default is shown', api.flUiHidden('choice', 'arbor'), false);
  api.flUiSetHidden('choice', 'arbor', true);
  check('hidden after set', api.flUiHidden('choice', 'arbor'), true);
  check('a switch announces itself on the window', seen, ['change']);
  api.flUiSetHidden('ux', 'launcher', true);
  check('two scripts do not clobber each other',
    [api.flUiHidden('choice', 'arbor'), api.flUiHidden('ux', 'launcher')], [true, true]);
  check('only hidden things are stored', JSON.parse(page.store.d['tm-fl-hidden-ui']),
    { 'choice.arbor': true, 'ux.launcher': true });
  api.flUiSetHidden('choice', 'arbor', false);
  check('shown again deletes the key', JSON.parse(page.store.d['tm-fl-hidden-ui']), { 'ux.launcher': true });

  for (const bad of ['{not json', '[1,2]', '"str"', 'null', '7']) {
    page.store.d['tm-fl-hidden-ui'] = bad;
    check('reads as nothing hidden: ' + bad, api.flUiHidden('ux', 'launcher'), false);
  }
  page.store.blocked = true;
  let threw = false;
  try { api.flUiSetHidden('ux', 'x', true); api.flUiHidden('ux', 'x'); } catch (e) { threw = true; }
  check('blocked storage does not throw', threw, false);
}

// --- the registries ---------------------------------------------------------

const NO_UI = ['fotz-capture'];
const UX_NO_UI = ['launcher', 'faction-capture', 'pending-item'];
{
  const page = makePage();
  load(page, WIKI, []);
  const ux = load(page, UX, ['FEATURES', 'PANELS', 'menuPanels', ...BLOCK_NAMES]);
  const choice = load(page, CHOICE, ['FEATURES', 'FEATURE_GROUPS', 'PANELS', 'attachBadge',
    'clearFeatureBadges', ...BLOCK_NAMES]);

  check('neither script threw while loading', page.errors, []);

  const known = ['Wiki links', 'UX tweaks', 'London', 'Airs of London', 'Zailing', 'Parabola',
    'Firmament', 'Railway & beyond', 'Seasonal', 'Menu entries'];
  const cf = choice.FEATURES;
  check('every Choice Helper feature is filed or draws nothing',
    cf.filter((f) => !f.group && !NO_UI.includes(f.name)).map((f) => f.name), []);
  check('...and what draws nothing is not switchable',
    cf.filter((f) => NO_UI.includes(f.name) && f.group).map((f) => f.name), []);
  check('every group is a known category', cf.filter((f) => f.group && !known.includes(f.group)).map((f) => f.name), []);
  check('every switchable feature has a label', cf.filter((f) => f.group && !f.label).map((f) => f.name), []);
  const listed = Object.values(choice.FEATURE_GROUPS).flat();
  check('nothing is filed that is not a feature', listed.filter((n) => !cf.some((f) => f.name === n)), []);
  check('nothing is filed twice', listed.filter((n, i) => listed.indexOf(n) !== i), []);

  check('UX Enhancers: the launcher and the captures cannot be switched',
    ux.FEATURES.filter((f) => UX_NO_UI.includes(f.name) && f.group).map((f) => f.name), []);
  check('UX Enhancers: every other feature is filed, labelled, and has a teardown',
    ux.FEATURES.filter((f) => !UX_NO_UI.includes(f.name) && !(f.group && f.label && f.off)).map((f) => f.name), []);

  // The settings view.
  const text = ux.flUiRenderSettings().textContent;
  const at = (g) => text.indexOf(g + ' (');
  const present = known.filter((g) => at(g) >= 0);
  check('categories appear in the fixed order',
    present.slice().sort((a, b) => at(a) - at(b)), present);
  check('the wiki badge is listed', at('Wiki links') >= 0, true);
  check('a feature reads "Show <label>"', text.indexOf('Show Fruits of the Zee depth control') >= 0, true);

  // Menu entries.
  check('Settings is the last menu entry', ux.menuPanels().slice(-1)[0].id, 'settings');
  ux.flUiSetHidden('menu', 'zailing', true);
  const ids = ux.menuPanels().map((p) => p.id);
  check('a menu entry switched off leaves the menu, Settings stays',
    [ids.includes('zailing'), ids.includes('factions'), ids.includes('settings')], [false, true, true]);
  ux.flUiSetHidden('choice', 'fotz-card-ratings', true);
  check('a menu entry follows its seasonal feature off',
    ux.menuPanels().some((p) => p.id === 'fruits-of-the-zee'), false);
  ux.flUiSetHidden('choice', 'fotz-card-ratings', false);
  check('...and comes back with it', ux.menuPanels().some((p) => p.id === 'fruits-of-the-zee'), true);
  check('the settings view has a search box', ux.flUiRenderSettings().children.some((c) => c.type === 'search'), true);
  ux.flUiSetHidden('menu', 'settings', true);
  check('Settings itself cannot be switched off', ux.menuPanels().some((p) => p.id === 'settings'), true);

}

// A separate load so the badge stub can reach the shared `__set`.
{
  const page = makePage();
  const code = 'function __set(n) { currentFeature = n; } globalThis.__flSet = __set;';
  const choice = load(page, CHOICE, ['attachBadge', 'clearFeatureBadges'], code);
  const set = globalThis.__flSet;
  const draw = (host, name, flag) => {
    set(name);
    host.after = (b) => { page.badges.push(b); b.parentNode = host.parentNode; };
    choice.attachBadge(host, { cls: 'fl-x-' + name, flag, value: 'v', spec: { text: 't', title: 'ttl', color: '#000' }, place: 'after' });
    set(null);
  };
  const a = makeEl('h2'), b = makeEl('h2');
  draw(a, 'arbor', 'flA');
  draw(b, 'piracy', 'flB');
  check('a badge drawn during a feature is stamped with it',
    page.badges.map((x) => x.dataset.flFeature), ['arbor', 'piracy']);
  check('...and its host carries the flag', [a.dataset.flA, b.dataset.flB], ['+v', '+v']);
  choice.clearFeatureBadges('arbor');
  check('switching off removes that feature\'s badge only',
    page.badges.map((x) => !!x.removed), [true, false]);
  check('...and clears the flag so switching on draws it again', [a.dataset.flA, b.dataset.flB], [undefined, '+v']);
  draw(a, 'arbor', 'flA');
  check('switching on draws it again', page.badges.filter((x) => !x.removed).length, 2);
  check('no errors', page.errors, []);
}

// The Account page box.
{
  const page = makePage();
  const host = makeEl('div');
  page.location = { pathname: '/account' };
  page.doc.querySelector = (sel) => (sel === '.account' ? host : null);
  load(page, WIKI, []);
  const box = host.children.find((c) => c.id === 'fl-ui-settings-box');
  check('on /account the box is appended to the page', !!box, true);
  check('...with the heading and the wiki switch', box && box.textContent.indexOf('Userscript settings') >= 0 && box.textContent.indexOf('wiki') >= 0, true);
  const other = makePage();
  other.doc.querySelector = () => makeEl('div');
  load(other, WIKI, []);
  check('elsewhere nothing is mounted and nothing breaks', other.errors, []);
}

console.log(failures ? failures + ' FAILED' : 'all passed');
process.exit(failures ? 1 : 0);
