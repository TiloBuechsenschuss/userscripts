// Ad-hoc test for the shared KoL hide-UI settings block.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script.
//
// What's pinned here:
//
//   - The tm-kol-ui-settings block is byte-identical in iotm.js and quest-helper.js, and the
//     three getButtonRow() copies (iotm, daily-checklist, quest-helper) are byte-identical.
//   - Storage: default shown, set/unset round trip, two scripts never clobber each other,
//     corrupt or wrong-shaped JSON reads as nothing hidden, blocked storage does not throw.
//
//   node tests/kol-ui-settings.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, '..', 'KingdomOfLoathing', f), 'utf8').replace(/\r\n/g, '\n');
const iotm = read('iotm.js');
const quest = read('quest-helper.js');
const checklist = read('daily-checklist.js');

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const block = (s) => s.match(/ {2}\/\/ --- BEGIN tm-kol-ui-settings[\s\S]*?\/\/ --- END tm-kol-ui-settings ---\n/);
const row = (s) => s.match(/ {2}function getButtonRow\(\) \{[\s\S]*?\n {2}\}\n/);

const bi = block(iotm), bq = block(quest);
check('block present in iotm.js', !!bi, true);
check('block present in quest-helper.js', !!bq, true);
check('block byte-identical', bi && bq && bi[0] === bq[0], true);

const ri = row(iotm), rc = row(checklist), rq = row(quest);
check('getButtonRow present in all three', !!(ri && rc && rq), true);
check('getButtonRow copies byte-identical', ri && rc && rq && ri[0] === rc[0] && ri[0] === rq[0], true);

// Evaluate the block against a stub store.
function make(store) {
  const ls = {
    getItem: (k) => { if (store.blocked) throw new Error('blocked'); return k in store.d ? store.d[k] : null; },
    setItem: (k, v) => { if (store.blocked) throw new Error('blocked'); store.d[k] = v; }
  };
  const fn = new Function('localStorage', 'window', 'document', 'location',
    bi[0] + '\nreturn { kolUiHidden, kolUiSetHidden };');
  return fn(ls, { addEventListener() {} }, {}, {});
}

const store = { d: {} };
const api = make(store);
check('default is shown', api.kolUiHidden('iotm', 'cup13'), false);
api.kolUiSetHidden('iotm', 'cup13', true);
check('hidden after set', api.kolUiHidden('iotm', 'cup13'), true);
check('other feature untouched', api.kolUiHidden('iotm', 'codpiece'), false);
api.kolUiSetHidden('quest-helper', 'merkin', true);
check('second script does not clobber first', [api.kolUiHidden('iotm', 'cup13'), api.kolUiHidden('quest-helper', 'merkin')], [true, true]);
check('same feature id in two scripts is distinct', api.kolUiHidden('iotm', 'merkin'), false);
api.kolUiSetHidden('iotm', 'cup13', false);
check('unhide removes the key', JSON.parse(store.d['tm-kol-hidden-ui']), { 'quest-helper.merkin': true });

for (const bad of ['not json', '[1,2]', '"x"', 'null', '42']) {
  const s = { d: { 'tm-kol-hidden-ui': bad } };
  check('corrupt storage reads as shown: ' + bad, make(s).kolUiHidden('iotm', 'cup13'), false);
}

const blocked = make({ d: {}, blocked: true });
check('blocked storage reads as shown', blocked.kolUiHidden('iotm', 'cup13'), false);
let threw = false;
try { blocked.kolUiSetHidden('iotm', 'cup13', true); } catch (e) { threw = true; }
check('blocked storage write does not throw', threw, false);

console.log(failures ? failures + ' FAILED' : 'all passed');
process.exit(failures ? 1 : 0);
