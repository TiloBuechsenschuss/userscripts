#!/usr/bin/env node
// Audit the wiring of FallenLondon/ux-enhancers.js's feature registry.
//
// This exists because the failure mode of adding a feature to this file is
// never a syntax error -- it is a feature that parses, loads, and is never
// called, or one whose badge quietly fights another's, or four OTHER test
// suites that now fail on a roster they assert by hand. `node --check` sees
// none of that.
//
//   node .claude/skills/adding-fallen-london-features/check.mjs
//   node .claude/skills/adding-fallen-london-features/check.mjs --feature port-carnelian
//
// Exit 0 = every check passed. Exit 1 = the failures are printed, worst first.
//
// It evaluates the IIFE against a stub DOM and reads FEATURES and PANELS out of
// it, so the registry checks are on the real objects rather than on a regex
// over the source. Everything else is static.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPT = join(repo, 'FallenLondon', 'ux-enhancers.js');
const LOADER = join(repo, 'all-in-one', 'fallen-london.js');
const TESTDIR = join(repo, 'FallenLondon', 'test');

const only = process.argv.includes('--feature')
  ? process.argv[process.argv.indexOf('--feature') + 1] : null;

const problems = [];
const notes = [];
const fail = (what, why) => problems.push({ what, why });
const note = (text) => notes.push(text);

const src = readFileSync(SCRIPT, 'utf8');

// --- load the registries ----------------------------------------------------
//
// The same string surgery every suite in FallenLondon/test uses, but asking
// only for the two names that always exist, so this needs no editing when a
// feature adds internals of its own.

function makeEl() {
  const el = {
    nodeType: 1, tagName: 'DIV', className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [],
    parentNode: null, nextElementSibling: null,
    classList: { contains: () => false },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    remove() {}, after() {}, addEventListener() {}, querySelector: () => null,
  };
  return el;
}

let registries = null;
try {
  const wrapped = src
    .replace('(function () {', 'globalThis.__flCheck = (function () {')
    .replace(/\}\)\(\);\s*$/, 'return { FEATURES, PANELS }; })();');
  const doc = {
    body: makeEl(), querySelectorAll: () => [], querySelector: () => null,
    getElementById: () => null, createElement: makeEl,
    createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
    addEventListener() {},
  };
  class Observer { observe() {} }
  registries = new Function(
    'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
    wrapped + '\nreturn globalThis.__flCheck;',
  )(doc, Observer, () => {}, () => ({ position: 'relative' }), console);
} catch (e) {
  fail('the script does not load', String(e && e.message || e));
}

// --- 1. the registries are well formed --------------------------------------

if (registries) {
  const { FEATURES, PANELS } = registries;

  FEATURES.forEach(function (feature, i) {
    if (!feature.name) fail('FEATURES[' + i + ']', 'has no name');
    if (typeof feature.run !== 'function') {
      fail('feature "' + feature.name + '"', 'its `run` is not a function');
    }
  });

  const dupes = FEATURES.map((f) => f.name).filter((n, i, all) => all.indexOf(n) !== i);
  if (dupes.length) fail('FEATURES', 'duplicate names: ' + dupes.join(', '));

  PANELS.forEach(function (panel, i) {
    for (const field of ['id', 'icon', 'label', 'hint']) {
      if (!panel[field]) fail('PANELS[' + i + ']', 'has no ' + field);
    }
    if (typeof panel.render !== 'function') {
      fail('panel "' + panel.id + '"', 'its `render` is not a function');
    }
  });

  // Every panel must actually build. It is a few hundred hand-built nodes and
  // a typo in it throws into Fallen London's own render loop.
  PANELS.forEach(function (panel) {
    try {
      panel.render();
    } catch (e) {
      fail('panel "' + panel.id + '" render()', String(e && e.message || e));
    }
  });

  // --- 2. the rosters other suites assert by hand --------------------------
  //
  // This is the trap. Adding one entry to FEATURES or PANELS breaks the four
  // suites that pin the whole roster, and they are suites for features you did
  // not touch, so nothing points at you.
  const suites = readdirSync(TESTDIR).filter((f) => f.endsWith('.test.mjs'));
  const rosterSuites = suites.filter((f) =>
    /FEATURES\.map|PANELS\.map/.test(readFileSync(join(TESTDIR, f), 'utf8')));

  // Read the EXPECTED ARRAY, not the whole file. A suite that pins both
  // rosters names every panel id somewhere in it, so a file-wide `includes`
  // would pass a FEATURES array that is missing the new entry.
  const expectedAfter = (text, marker) => {
    const at = text.indexOf(marker);
    if (at === -1) return null;
    const open = text.indexOf('[', at);
    const close = text.indexOf(']', open);
    if (open === -1 || close === -1) return null;
    return [...text.slice(open, close).matchAll(/'([^']+)'/g)].map((m) => m[1]);
  };

  for (const suite of rosterSuites) {
    const text = readFileSync(join(TESTDIR, suite), 'utf8');
    for (const [marker, wanted, label] of [
      ['FEATURES.map', FEATURES.map((f) => f.name), 'FEATURES'],
      ['PANELS.map', PANELS.map((p) => p.id), 'PANELS'],
    ]) {
      const listed = expectedAfter(text, marker);
      if (!listed) continue;
      const missing = wanted.filter((n) => !listed.includes(n));
      const extra = listed.filter((n) => !wanted.includes(n));
      if (missing.length) {
        fail(suite, 'its ' + label + ' roster is missing ' + missing.map((n) => '"' + n + '"').join(', '));
      }
      if (extra.length) {
        fail(suite, 'its ' + label + ' roster names ' + extra.map((n) => '"' + n + '"').join(', ')
          + ', which is not registered');
      }
    }
  }
  note(rosterSuites.length + ' suite(s) pin a roster: ' + rosterSuites.join(', '));

  // --- 3. a feature with its own logic wants its own suite -----------------
  const named = only ? FEATURES.filter((f) => f.name === only) : FEATURES;
  if (only && !named.length) fail('--feature ' + only, 'no such entry in FEATURES');
  for (const feature of named) {
    const covered = suites.some((s) =>
      readFileSync(join(TESTDIR, s), 'utf8').includes("'" + feature.name + "'"));
    if (!covered) fail('feature "' + feature.name + '"', 'no suite in FallenLondon/test names it');
  }
}

// --- 4. no two badge features share a class or a dataset flag ---------------
//
// `attachBadge` keys everything off these two. Two features sharing either one
// clear each other's badges, and the symptom is a badge that flickers rather
// than an error.
const constant = (re) => {
  const out = new Map();
  let m;
  const rx = new RegExp(re, 'g');
  while ((m = rx.exec(src))) out.set(m[1], m[2]);
  return out;
};
const classes = constant("const ([A-Z0-9_]*CLASS) = '([^']+)'");
const flags = constant("const ([A-Z0-9_]*FLAG) = '([^']+)'");

for (const [label, map] of [['class', classes], ['dataset flag', flags]]) {
  const seen = new Map();
  for (const [name, value] of map) {
    if (seen.has(value)) {
      fail('badge ' + label + " '" + value + "'",
        'declared twice, as ' + seen.get(value) + ' and ' + name
        + ' — two features sharing one will clear each other');
    }
    seen.set(value, name);
  }
}
note(classes.size + ' badge class constants, ' + flags.size + ' dataset flags, all distinct');

// --- 5. inline styles only --------------------------------------------------
//
// The header is `@grant none`, so GM_addStyle does not exist, and a stylesheet
// is one more thing a React re-render can drop.
// Comments are stripped first: this file DISCUSSES `GM_addStyle` at length in
// the comment explaining why it cannot use it.
const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, '');
for (const banned of ['GM_addStyle', 'GM_setValue', 'GM_getValue', 'GM_xmlhttpRequest']) {
  if (code.includes(banned)) fail(banned, 'used, but the header is @grant none');
}

// --- 6. the metadata block --------------------------------------------------
const meta = (file, key) => {
  const m = readFileSync(file, 'utf8').match(new RegExp('^// @' + key + '\\s+(.+)$', 'm'));
  return m ? m[1].trim().replace(/\r$/, '') : null;
};

const url = meta(SCRIPT, 'downloadURL');
if (!url || !url.endsWith('/FallenLondon/ux-enhancers.js')) {
  fail('@downloadURL', 'does not end in the file\'s own path: ' + url);
}

// A change to the script that does not bump @version ships to nobody: a
// userscript manager updates on the version number and on nothing else.
let head = null;
try {
  head = execFileSync('git', ['show', 'HEAD:FallenLondon/ux-enhancers.js'],
    { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch { /* not a checkout, or a new file: skip the comparison */ }

if (head != null) {
  const changed = head.replace(/\r/g, '') !== src.replace(/\r/g, '');
  const wasVersion = (head.match(/^\/\/ @version\s+(.+)$/m) || [])[1];
  const isVersion = meta(SCRIPT, 'version');
  if (changed && wasVersion && wasVersion.trim() === isVersion) {
    fail('@version', 'the script changed but @version is still ' + isVersion);
  }
  if (changed) {
    let loaderHead = null;
    try {
      loaderHead = execFileSync('git', ['show', 'HEAD:all-in-one/fallen-london.js'],
        { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch { /* ignore */ }
    const loaderWas = loaderHead && (loaderHead.match(/^\/\/ @version\s+(.+)$/m) || [])[1];
    if (loaderWas && loaderWas.trim() === meta(LOADER, 'version')) {
      fail('all-in-one/fallen-london.js @version',
        'still ' + meta(LOADER, 'version') + ', but the script it @requires changed');
    }
  }
  note(changed ? 'ux-enhancers.js differs from HEAD' : 'ux-enhancers.js matches HEAD');
}

// --- 7. a NEW feature has to be written up ----------------------------------
//
// Only new ones. AGENTS.md documents the features that carry judgement, and
// some of the older background jobs are described without being named; going
// back and renaming them is not this check's business.
if (registries && head != null) {
  const before = new Set(
    [...head.matchAll(/\{\s*name:\s*'([^']+)',\s*run:/g)].map((m) => m[1]));
  const fresh = registries.FEATURES.map((f) => f.name).filter((n) => !before.has(n));
  const agents = readFileSync(join(repo, 'AGENTS.md'), 'utf8');
  for (const name of fresh) {
    if (!agents.includes(name)) {
      fail('AGENTS.md', 'the new feature "' + name + '" is not written up there');
    }
  }
  if (fresh.length) note('new since HEAD: ' + fresh.join(', '));
}

// --- report -----------------------------------------------------------------

for (const line of notes) console.log('  ·', line);
if (!problems.length) {
  console.log('\nall good');
  process.exit(0);
}
console.log('');
for (const problem of problems) console.log('FAIL |', problem.what + ': ' + problem.why);
console.log('\n' + problems.length + ' problem(s)');
process.exit(1);
