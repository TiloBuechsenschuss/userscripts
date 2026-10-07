// Ad-hoc test for the shared KoL rare-monster watch list.
//
// Standalone Node script, no runner (see AGENTS.md).
//
// What's pinned here:
//   - The tm-kol-rare-monsters block is byte-identical in ux-enhancers.js and auto-combat.js.
//   - Names match whatever article KoL prints; a built-in can be unwatched and re-watched;
//     added entries round-trip; corrupt or blocked storage reads as "built-ins only".
//
//   node tests/kol-rare-monsters.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, '..', 'KingdomOfLoathing', f), 'utf8').replace(/\r\n/g, '\n');
const ux = read('ux-enhancers.js');
const combat = read('auto-combat.js');

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const block = (s) => s.match(/ {2}\/\/ --- BEGIN tm-kol-rare-monsters[\s\S]*?\/\/ --- END tm-kol-rare-monsters ---\n/);
const bu = block(ux), bc = block(combat);
check('block present in ux-enhancers.js', !!bu, true);
check('block present in auto-combat.js', !!bc, true);
check('block byte-identical', bu && bc && bu[0] === bc[0], true);

function make(store) {
  const localStorage = {
    getItem: (k) => { if (store.blocked) throw new Error('blocked'); return k in store.d ? store.d[k] : null; },
    setItem: (k, v) => { if (store.blocked) throw new Error('blocked'); store.d[k] = v; },
  };
  return new Function('localStorage', bu[0] +
    '\nreturn { rareMonsterNorm, rareMonsterList, rareMonsterFor, rareMonsterSetWatched };')(localStorage);
}

let api = make({ d: {} });
check('norm drops article and case', api.rareMonsterNorm('  A Rampaging   Adding Machine '), 'rampaging adding machine');
check('norm keeps a bare article', api.rareMonsterNorm('The'), 'the');
check('built-in matches KoL spelling', !!api.rareMonsterFor('a rampaging adding machine'), true);
check('unknown monster not watched', api.rareMonsterFor('a bat'), null);

api.rareMonsterSetWatched('a Rampaging Adding Machine', false);
check('built-in can be unwatched', api.rareMonsterFor('rampaging adding machine'), null);
api.rareMonsterSetWatched('rampaging adding machine', true);
check('built-in can be watched again', !!api.rareMonsterFor('rampaging adding machine'), true);

api.rareMonsterSetWatched('the Bat', true, 'beware');
check('added entry round trips', api.rareMonsterFor('a bat'),
  { name: 'bat', note: 'beware', builtin: false });
api.rareMonsterSetWatched('bat', false);
check('added entry can be removed', api.rareMonsterFor('bat'), null);

api = make({ d: { 'tm-kol-rare-monsters': '{nope' } });
check('corrupt JSON reads as built-ins', api.rareMonsterList().map((m) => m.name), ['rampaging adding machine']);
api = make({ d: { 'tm-kol-rare-monsters': '[1,2]' } });
check('wrong shape reads as built-ins', api.rareMonsterList().length, 1);
api = make({ d: {}, blocked: true });
check('blocked storage does not throw', (() => { api.rareMonsterSetWatched('x', true); return api.rareMonsterList().length; })(), 1);

console.log(failures ? failures + ' FAILED' : 'all passed');
process.exit(failures ? 1 : 0);
