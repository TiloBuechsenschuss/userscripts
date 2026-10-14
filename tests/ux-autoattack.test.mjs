// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js's charpane Auto-Attack
// dropdown: reading account.php's option list and shortening its labels.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a pathname matching no feature, so run() is a no-op) and pulls out the
// helpers.
//
// The options below are KoL's own markup, trimmed from KoLmafia's fixture
// src/test/root/request/test_account_tab_combat.html: "0" is disabled, "1" the
// weapon, skills carry a cost in parentheses and macros say "(Combat Macro)".
//
//   node tests/ux-autoattack.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseAutoAttackOptions, shortAutoAttackLabel, kolUiHidden, kolUiSetHidden, ' +
    'UX_HIDEABLE, UX_SCRIPT_ID }; })();');
if (wrapped === src) throw new Error('could not rewrite ux-enhancers.js for testing');
// The hide-UI switch is localStorage-backed; a Map stands in for it.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

const fn = new Function('document', 'location', 'window', wrapped + '\nreturn globalThis.__ux;');
const api = fn(fakeDoc, fakeLocation, {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// A select as DOMParser would hand it over: textContent has entities decoded.
function accountDoc(options) {
  const opts = options.map(([value, text]) => ({
    getAttribute: (n) => (n === 'value' ? value : null),
    textContent: text,
  }));
  const select = { querySelectorAll: () => opts };
  return { querySelector: (sel) => (sel === 'select[name="autoattack"]' ? select : null) };
}

const parsed = api.parseAutoAttackOptions(accountDoc([
  ['0', '(disabled)'],
  ['1', 'Attack with your weapon'],
  ['4012', 'Saucegeyser (24 Muscularity Points)'],
  ['4023', 'Käsesoßesturm (10 Muscularity Points)'],
  ['99166447', 'b2arf (Combat Macro)'],
  ['991208', '  simple   attack (Combat Macro) '],
  ['', 'junk'],
]));

check('options are read with their kind', parsed.map((o) => [o.value, o.kind]), [
  ['0', 'off'], ['1', 'weapon'], ['4012', 'skill'], ['4023', 'skill'],
  ['99166447', 'macro'], ['991208', 'macro'],
]);
check('labels keep the game text, whitespace collapsed', parsed[5].label,
  'simple attack (Combat Macro)');
check('no select on the page is null, not an empty list',
  api.parseAutoAttackOptions({ querySelector: () => null }), null);

const s = api.shortAutoAttackLabel;
check('costs and the macro tag are dropped', [
  s('Saucegeyser (24 Muscularity Points)'),
  s('Transcendent Olfaction (1 use left today)'),
  s('Implode Universe (13 times today, 50 MP)'),
  s('Blood Bucatini (10 HP)'),
  s('b2arf (Combat Macro)'),
], ['Saucegeyser', 'Transcendent Olfaction', 'Implode Universe', 'Blood Bucatini', 'b2arf']);
check('a label with no parentheses is left alone', s('Harpoon!'), 'Harpoon!');
check('only the last group goes', s('Disco Dance II: Electric Boogaloo (4 MP)'),
  'Disco Dance II: Electric Boogaloo');
check('a label that is only parentheses survives', s('(disabled)'), '(disabled)');

// --- hide-UI switch -------------------------------------------------------
// Same key and shape iotm.js / quest-helper.js use (okf hide-ui-settings.md):
// only hidden features are stored, and other scripts' entries survive a write.

check('the switch is listed for account.php', api.UX_HIDEABLE.map((f) => f.id), ['autoattack']);
check('nothing stored means shown', api.kolUiHidden(api.UX_SCRIPT_ID, 'autoattack'), false);
store.set('tm-kol-hidden-ui', JSON.stringify({ 'iotm.cupid': true }));
api.kolUiSetHidden(api.UX_SCRIPT_ID, 'autoattack', true);
check('hiding writes ux-enhancers.autoattack and keeps the others',
  JSON.parse(store.get('tm-kol-hidden-ui')), { 'iotm.cupid': true, 'ux-enhancers.autoattack': true });
check('and reads back hidden', api.kolUiHidden('ux-enhancers', 'autoattack'), true);
api.kolUiSetHidden(api.UX_SCRIPT_ID, 'autoattack', false);
check('showing deletes the key rather than storing false',
  JSON.parse(store.get('tm-kol-hidden-ui')), { 'iotm.cupid': true });
store.set('tm-kol-hidden-ui', '{not json');
check('corrupt storage reads as shown', api.kolUiHidden('ux-enhancers', 'autoattack'), false);

if (failures) { console.log(failures + ' failed'); process.exit(1); }
console.log('all passed');
