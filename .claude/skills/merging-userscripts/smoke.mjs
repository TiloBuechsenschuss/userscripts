#!/usr/bin/env node
// Smoke-run a userscript IIFE against a stub DOM and report anything it throws.
//
// This exists because `node --check` only PARSES. After splicing code between
// two files it will happily pass a file that calls a helper you left behind in
// the other one -- the failure is a ReferenceError at run time, on a page you
// can't reach from this repo. This runs the IIFE once per page it dispatches on.
//
//   node .claude/skills/merging-userscripts/smoke.mjs <file.js> <pathname>
//
//   node .claude/skills/merging-userscripts/smoke.mjs KingdomOfLoathing/iotm.js /topmenu.php
//   node .claude/skills/merging-userscripts/smoke.mjs KingdomOfLoathing/iotm.js /choice.php
//
// Run it once for EVERY pathname the script branches on -- a half that never
// executes is a half that was never checked.
//
// Note for Git Bash on Windows: a bare `/topmenu.php` argument gets rewritten
// to a Windows path (`C:/Program Files/Git/topmenu.php`). That still contains
// `/topmenu.php`, so the usual pathname regexes still match and the run is
// valid. Pass `//topmenu.php` if you want to suppress the rewriting.
//
// Exit 0 = nothing thrown. Exit 1 = the error is printed.

import { readFileSync } from 'node:fs';

const [path, pathname] = process.argv.slice(2);
if (!path || !pathname) {
  console.error('usage: smoke.mjs <file.js> <pathname>');
  process.exit(2);
}
const src = readFileSync(path, 'utf8');

// A stub element that answers every call these scripts make, and returns
// nothing -- so a script bails the way it would on a page with none of its
// markup. That is the point: we are checking that it RUNS, not what it draws.
const el = () => ({
  id: '', type: '', className: '', textContent: '', title: '', disabled: false,
  value: '', href: '', checked: false, options: [], firstChild: null,
  style: { cssText: '' }, dataset: {},
  addEventListener() {}, removeEventListener() {}, remove() {},
  appendChild() {}, insertBefore() {}, insertAdjacentElement() {},
  insertAdjacentHTML() {}, setAttribute() {}, removeAttribute() {},
  getAttribute: () => null, hasAttribute: () => false,
  closest: () => null, querySelector: () => null, querySelectorAll: () => [],
  getElementsByTagName: () => [],
});

const document = {
  // 'complete' takes the readyState branch that runs immediately, so the body
  // under test actually executes instead of parking on a load listener.
  readyState: 'complete',
  addEventListener() {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementsByTagName: () => [],
  createElement: el,
  createTextNode: el,
  documentElement: { innerHTML: '' },
  body: el(),
  cookie: '',
};

const location = {
  pathname,
  search: '',
  origin: 'https://www.kingdomofloathing.com',
  href: 'https://www.kingdomofloathing.com' + pathname,
  reload() {},
};

const storage = { getItem: () => null, setItem() {}, removeItem() {} };

const window = {
  location, document, addEventListener() {}, removeEventListener() {},
  setInterval: () => 0, clearInterval() {}, setTimeout: () => 0,
  toggle: undefined, top: undefined, frames: {},
};
window.top = window;

let failed = null;
process.on('unhandledRejection', (e) => { failed = e; });

try {
  const fn = new Function(
    'document', 'location', 'window', 'top', 'sessionStorage', 'localStorage',
    'fetch', 'DOMParser', 'alert', 'confirm', 'getComputedStyle', 'console',
    src);
  fn(
    document, location, window, window, storage, storage,
    () => Promise.resolve({
      ok: false, status: 500,
      text: () => Promise.resolve(''),
      json: () => Promise.resolve({}),
    }),
    function DOMParser() { this.parseFromString = () => document; },
    () => {}, () => false, () => ({ display: 'none' }), console);
} catch (e) {
  failed = e;
}

// Let a microtask or two settle so an async boot path can throw before we judge.
// The explicit exit matters: a script that starts a pulse setInterval keeps node
// alive forever otherwise, which is correct behaviour, not a hang to debug.
setTimeout(() => {
  if (failed) {
    console.log('THREW  ', path, pathname);
    console.log('       ', (failed && failed.stack) || failed);
    process.exit(1);
  }
  console.log('OK     ', path, pathname);
  process.exit(0);
}, 200);
