// Ad-hoc test for KingdomOfLoathing/auto-mine.js's advice box on mining.php,
// which is also where the Start button lives.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out the advisor's box builders.
//
// Two things are pinned here, and both are ways the button can vanish now that
// it shares its fate with the advisor.
//
// The first is the repaint: the advisor rewrites its line on every load, and it
// used to do that by setting `textContent` on the box itself. That wipes every
// child, so the button would go the moment any advice was painted -- which is
// always. The box is therefore a row of two nodes, a text span and the button,
// and the advisor only ever writes to the span.
//
// The second is at the bottom of this file: the controller must be buildable
// from the shipped preferences, because an exception on the way to the advice
// takes the button with it and leaves no way into the panel to undo whatever
// caused it.
//
//   node KingdomOfLoathing/test/auto-mine-advice-box.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'auto-mine.js'), 'utf8');

// --- the smallest DOM this code can be asked to build into ------------------

function makeElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    id: '',
    type: '',
    title: '',
    textContent: '',
    children: [],
    parentNode: null,
    style: { cssText: '' },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, ref) {
      child.parentNode = this;
      const at = ref ? this.children.indexOf(ref) : -1;
      if (at < 0) this.children.push(child);
      else this.children.splice(at, 0, child);
      return child;
    },
    insertAdjacentElement(position, node) {
      const parent = this.parentNode;
      if (!parent) return null;
      node.parentNode = parent;
      const at = parent.children.indexOf(this);
      parent.children.splice(position === 'beforebegin' ? at : at + 1, 0, node);
      return node;
    },
    addEventListener() {},
    get firstChild() { return this.children[0] || null; },
  };
}

// Only nodes actually in the tree are findable, which is what makes the
// idempotency guard in adviceBox mean anything.
function findById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children) {
    const hit = findById(child, id);
    if (hit) return hit;
  }
  return null;
}

const body = makeElement('body');
const fakeDoc = {
  body: body,
  createElement: (tag) => makeElement(tag),
  getElementById: (id) => findById(body, id),
  querySelector: () => null,
  querySelectorAll: () => [],
  readyState: 'complete',
  addEventListener: () => {},
};
const fakeLocation = {
  pathname: '/mining.php',
  search: '?mine=6',
  origin: 'https://www.kingdomofloathing.com',
};
const store = new Map();
const fakeWindow = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  },
};

const wrapped = src
  .replace('(function () {', 'globalThis.__am = (function () {')
  .replace('  boot();',
    '  return { adviceBox, adviceText, paintAdvice, buttonEl, paintButton, ' +
    'makeController, loadPrefs, ' +
    'ADVICE_ID, ADVICE_TEXT_ID, BUTTON_ID };');
if (wrapped === src) throw new Error('could not rewrite auto-mine.js for testing');

// `top` is an empty object: reaching for top.frames throws, so engine() finds
// nothing, which is exactly the state of a mine page whose menu frame never
// loaded the script. The button must still be built.
const fn = new Function('document', 'location', 'window', 'top', wrapped);
fn(fakeDoc, fakeLocation, fakeWindow, {});
const api = globalThis.__am;

let failures = 0;
function check(label, actual, expected) {
  const ok = Object.is(actual, expected);
  if (!ok) failures++;
  console.log(
    (ok ? 'ok   ' : 'FAIL ') + label +
    (ok ? '' : '\n       expected ' + JSON.stringify(expected) +
               '\n       got      ' + JSON.stringify(actual))
  );
}

// --- the box is built once, with the button in it ---------------------------

check('the ids are the ones the rest of the repo knows', api.ADVICE_ID, 'tm-automine-advice');
check('the button keeps its id', api.BUTTON_ID, 'tm-automine-btn');

const box = api.adviceBox(fakeDoc);
check('the box lands in the page', box.parentNode, body);
check('it is a row of exactly two nodes', box.children.length, 2);
check('the first is the text span', box.children[0].id, api.ADVICE_TEXT_ID);
check('the second is the button', box.children[1].id, api.BUTTON_ID);
check('the button is a button', box.children[1].tagName, 'BUTTON');
check('...that does not submit anything', box.children[1].type, 'button');
check('it reads "Mine" before a run', box.children[1].textContent, 'Mine');

check('asking again returns the same box', api.adviceBox(fakeDoc), box);
check('...and does not add a second button', box.children.length, 2);
check('adviceText finds the span', api.adviceText(fakeDoc), box.children[0]);

// The engine paints the button from the menu frame; on the mine page itself it
// is the local document that has it.
check('buttonEl finds the button on the mine page', api.buttonEl(), box.children[1]);

// --- painting advice must not take the button with it -----------------------

const button = box.children[1];
const state = 'o'.repeat(36);

api.paintAdvice([], { action: 'reset', reason: 'nothing left worth a turn' }, state);
check('a reset verdict is written to the span',
  box.children[0].textContent, 'Find a new cavern: nothing left worth a turn.');
check('the button survives a reset verdict', box.children.length, 2);
check('...and is still the same node', box.children[1], button);

api.paintAdvice(
  [],
  { action: 'dig', coordinate: [3, 4], reason: 'best expected value', path: [10, 11] },
  state
);
check('a dig verdict names the square',
  box.children[0].textContent.startsWith('Dig (3,4)'), true);
check('the button survives a dig verdict', box.children.length, 2);
check('...and is still the same node', box.children[1], button);
check('the advice never leaks into the button', button.textContent, 'Mine');

// --- the button says whether a run is going ---------------------------------

api.paintButton(button, { active: true });
check('a running button says so', button.textContent, 'Mine ▶');
api.paintButton(button, { active: false });
check('...and goes back', button.textContent, 'Mine');

// --- the default preferences must build a controller ------------------------
//
// Reported as "I set velvet and crystal to 0, Start didn't work, and on reload
// the button was gone". The zeros were innocent. Saving the panel wrote the
// dynamite field as 0, makeController turns "0 or blank" into a price of
// Infinity ("no price I know, so never route through dull rock"), and
// setDynamitePrice rejected Infinity through Number.isFinite. So the DEFAULT
// preferences threw, the advisor died before it painted, and the button --
// which now lives in the advisor's box -- went with it. The panel was then
// unreachable, so the bad preference could not be undone from the UI.
//
// The zeros are pinned alongside it so the report reads back correctly: a
// player who values only gold is asking a legitimate question of the model.

function builds(label, prefs) {
  let threw = null;
  try {
    const controller = api.makeController(prefs, () => {});
    controller.setDynamiteAvailable(0);
  } catch (e) {
    threw = e && e.message ? e.message : String(e);
  }
  check(label, threw, null);
}

builds('the shipped defaults build a controller', api.loadPrefs());
builds('...with dynamite 0, which is the default',
  Object.assign(api.loadPrefs(), { dynamite: 0 }));
builds('...with the dynamite field left blank',
  Object.assign(api.loadPrefs(), { dynamite: '' }));
builds('...with unreadable text in the dynamite field',
  Object.assign(api.loadPrefs(), { dynamite: 'lots' }));
builds('...and with velvet and crystal valued at nothing',
  Object.assign(api.loadPrefs(), { ore: 0, crystal: 0, dynamite: 0 }));
builds('a real dynamite price still builds',
  Object.assign(api.loadPrefs(), { dynamite: 2500 }));

// The guard still has to guard: a negative price is a typo, not a sentinel.
let refused = null;
try {
  api.makeController(api.loadPrefs(), () => {}).setDynamitePrice(-1);
} catch (e) {
  refused = e.message;
}
check('a negative price is still refused', refused, 'Dynamite price must be non-negative.');

let refusedNaN = null;
try {
  api.makeController(api.loadPrefs(), () => {}).setDynamitePrice(NaN);
} catch (e) {
  refusedNaN = e.message;
}
check('so is NaN', refusedNaN, 'Dynamite price must be non-negative.');

console.log(failures ? '\n' + failures + ' failure(s)' : '\nAll passed');
process.exit(failures ? 1 : 0);
