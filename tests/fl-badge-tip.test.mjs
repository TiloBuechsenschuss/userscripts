// Ad-hoc test for FallenLondon/choice-helper.js's tap-to-read badge panel --
// the thing that makes a badge's reasoning reachable on a phone, where a
// `title` is invisible.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// Why this file exists: the panel is DISMISSED by two document-and-window
// handlers, and both of them used to fire on events that came from INSIDE the
// panel -- so a click on it closed it, and scrolling it closed it, which made
// a panel taller than 60vh unreadable. The stub here therefore records what
// the script binds to `document` and `window` and fires those handlers by
// hand, which is the only way to reach that code at all; nothing else in
// FallenLondon/test binds either.
//
//   node tests/fl-badge-tip.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// A stub element with enough of a parent chain for `closest`, which is what
// both dismissal handlers ask the event target for.
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), nodeType: 1, id: '', className: '', title: '',
    textContent: '', style: { cssText: '' }, dataset: {}, childNodes: [], children: [],
    parentNode: null, isConnected: true, offsetWidth: 100, offsetHeight: 40,
    handlers: {},
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
    after() {},
    addEventListener(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); },
    dispatch(type, ev) { (this.handlers[type] || []).forEach((fn) => fn(ev)); },
    getBoundingClientRect() { return { left: 10, top: 10, right: 60, bottom: 24 }; },
    querySelector: () => null,
    matches(sel) {
      if (sel.startsWith('#')) return this.id === sel.slice(1);
      if (sel.startsWith('.')) return String(this.className).split(/\s+/).includes(sel.slice(1));
      return false;
    },
    closest(sel) {
      for (let n = this; n; n = n.parentNode) if (n.matches && n.matches(sel)) return n;
      return null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  return el;
}

const docHandlers = {};
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: (id) => fakeDoc.body.children.find((c) => c.id === id) || null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
  addEventListener(type, fn) { (docHandlers[type] = docHandlers[type] || []).push(fn); },
};
const winHandlers = {};
const fakeWin = {
  innerWidth: 400,
  innerHeight: 800,
  addEventListener(type, fn) { (winHandlers[type] = winHandlers[type] || []).push(fn); },
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { makeBadge, showTip, hideTip, pruneTip, TIP_ID, BADGE_CLASS }; })();');
const api = new Function(
  'document', 'window', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;',
)(fakeDoc, fakeWin, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const SPEC = { text: 'Bees +25?', color: '#1b7d67', title: 'line one\nline two\nline three' };
const tips = () => fakeDoc.body.children.filter((c) => c.id === api.TIP_ID);
const tip = () => tips()[0] || null;

function makeBadgeIn(parent) {
  const badge = api.makeBadge(SPEC, 'fl-ux-test');
  (parent || fakeDoc.body).appendChild(badge);
  return badge;
}

function tapBadge(badge) {
  const ev = { target: badge, stopPropagation() {}, preventDefault() {} };
  badge.dispatch('click', ev);
}

function fireDoc(type, ev) { (docHandlers[type] || []).forEach((fn) => fn(ev)); }
function fireWin(type, ev) { (winHandlers[type] || []).forEach((fn) => fn(ev)); }

const badge = makeBadgeIn();

// --- the panel opens at all ------------------------------------------------

tapBadge(badge);
check('a tap opens the panel with the whole title', [tips().length, tip().textContent],
  [1, SPEC.title]);

check('the panel is scrollable, which is the only reason it can be read at all',
  ['max-height:60vh', 'overflow:auto', 'overscroll-behavior:contain']
    .filter((rule) => !tip().style.cssText.includes(rule)), []);

// --- the two dismissal handlers must ignore the panel itself ---------------
//
// This is the bug this file was written for. The panel is `overflow:auto` and
// capped at 60vh, so any tooltip longer than that has to be scrolled -- and
// both handlers used to fire on events raised by the panel's own scrollbar and
// its own scrolling, closing it before a word past the cap could be read.

{
  const inner = makeEl('span');
  tip().appendChild(inner);

  fireDoc('click', { target: tip() });
  check('clicking the panel does NOT close it', tips().length, 1);

  fireDoc('click', { target: inner });
  check('clicking something inside the panel does not close it either', tips().length, 1);

  fireWin('scroll', { target: tip() });
  check('scrolling the panel does NOT close it', tips().length, 1);

  fireWin('scroll', { target: inner });
  check('a scroll raised inside the panel does not close it either', tips().length, 1);
}

// --- but everything else still dismisses -----------------------------------

fireWin('scroll', { target: fakeDoc });
check('scrolling the PAGE still closes it, since the panel is fixed and the badge is not',
  tips().length, 0);

tapBadge(badge);
check('...and it reopens', tips().length, 1);

fireWin('resize', {});
check('a resize still closes it', tips().length, 0);

tapBadge(badge);
fireDoc('click', { target: makeEl('div') });
check('a click anywhere else still closes it', tips().length, 0);

tapBadge(badge);
fireDoc('keydown', { key: 'Escape' });
check('Escape still closes it', tips().length, 0);

// --- the badge exemption is unchanged --------------------------------------
//
// The capture-phase click handler exempts the badge so that a second tap on
// the SAME badge toggles rather than redraws; without that, `tipAnchor` would
// be cleared before the badge's own handler could see it.

tapBadge(badge);
fireDoc('click', { target: badge });
check('the capture handler still lets a tap on the badge through', tips().length, 1);
tapBadge(badge);
check('so a second tap on the same badge closes it', tips().length, 0);

// A different badge opens its own panel rather than a second one.
{
  const other = makeBadgeIn();
  tapBadge(badge);
  tapBadge(other);
  check('tapping another badge moves the panel, never opens two', tips().length, 1);
  api.hideTip();
}

// --- React throwing the badge away -----------------------------------------

tapBadge(badge);
badge.isConnected = false;
api.pruneTip();
check('a panel whose badge has been re-rendered away goes with it', tips().length, 0);
badge.isConnected = true;

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
