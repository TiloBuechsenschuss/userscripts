// Ad-hoc test for KingdomOfLoathing/daily-checklist.js default seeding.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM,
// and pulls out applySeeds to assert how new defaults reach a list someone
// already has.
//
// Two things here are easy to get wrong and are what this covers:
//   - resting, the tea tree and the garden all link to plain campground.php,
//     and the seed matcher treats a url as identity -- so the two new ones
//     would look like the resting entry that's already in the list and never
//     get seeded;
//   - there's no reordering UI, so a new default has to be spliced in beside
//     the neighbour it was written next to, not appended to the bottom.
//
//   node KingdomOfLoathing/test/daily-checklist-seeding.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'daily-checklist.js'), 'utf8');

// The pathname has to be one the script accepts or it bails on its first line
// before declaring anything. Nothing below applySeeds is exercised.
const fakeDoc = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
};
const fakeLocation = { pathname: '/topmenu.php' };

// Re-expose the IIFE's internals: hand the helpers back at the call that would
// otherwise start touching the DOM.
const wrapped = src
  .replace('(function () {', 'globalThis.__dc = (function () {')
  .replace('addButton();', 'return { applySeeds, SEED_ITEMS, SEED_VERSION };');
const fn = new Function('document', 'location', 'window', 'localStorage',
  wrapped + '\nreturn globalThis.__dc;');
const api = fn(fakeDoc, fakeLocation, {}, { getItem: () => null, setItem: () => {} });

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const texts = (s) => s.items.map((it) => it.text);
const visibleSeeds = api.SEED_ITEMS.filter((sd) => !sd.hidden);
const after = (list, text) => list[list.indexOf(text) + 1];

const REST = 'Rest (free and with fullness / drunkenness)';
const TEA = 'Shake the tea tree';
const GARDEN = 'Harvest the garden';

// --- a brand-new list -----------------------------------------------------

const fresh = { date: '2026-07-28', items: [], seed: 0 };
check('a fresh list is seeded', api.applySeeds(fresh), true);
check('...in SEED_ITEMS order, hidden ones skipped',
  texts(fresh), visibleSeeds.map((sd) => sd.text));
check('...with the tea tree directly under resting', after(texts(fresh), REST), TEA);
check('...and the garden under that', after(texts(fresh), TEA), GARDEN);

check('seeding twice at the same marker is a no-op', api.applySeeds(fresh), false);

// --- a list someone already has -------------------------------------------
// The state before this change: every visible seed except the two new ones,
// plus a task of the user's own at the bottom.
function priorList() {
  const items = visibleSeeds
    .filter((sd) => sd.text !== TEA && sd.text !== GARDEN)
    .map((sd) => ({
      text: sd.text, done: true, off: !!sd.off,
      url: sd.url, disabled: sd.disabled, seeded: true,
    }));
  items.push({ text: 'My own task', done: false, off: false });
  return { date: '2026-07-28', items, seed: api.SEED_VERSION - 1, ronin: true };
}

const old = priorList();
check('an existing list is updated', api.applySeeds(old), true);
check('the tea tree is added under resting, not at the bottom',
  after(texts(old), REST), TEA);
check('the garden follows it', after(texts(old), TEA), GARDEN);
// Neither is actually gated by ronin -- the tea tree works in-run and the
// garden is only blocked in Bad Moon -- so they carry no run-state restriction
// and stay available in both phases.
check('neither is restricted to a run phase', [
  old.items.find((it) => it.text === TEA).disabled,
  old.items.find((it) => it.text === GARDEN).disabled,
], [undefined, undefined]);
check('both link to the campground', [
  old.items.find((it) => it.text === TEA).url,
  old.items.find((it) => it.text === GARDEN).url,
], ['/campground.php', '/campground.php']);

// The shared url must not make them collide with resting, or with each other.
check('exactly one tea tree and one garden were added', [
  texts(old).filter((t) => t === TEA).length,
  texts(old).filter((t) => t === GARDEN).length,
], [1, 1]);
check('resting is untouched by its url twins', [
  texts(old).filter((t) => t === REST).length,
  old.items.find((it) => it.text === REST).disabled,
], [1, undefined]);
check('resting stays checked — seeding doesn\'t reset progress',
  old.items.find((it) => it.text === REST).done, true);

// A task the user added themselves keeps its place at the end.
check('the user\'s own task is still last and unseeded', [
  texts(old)[texts(old).length - 1],
  !!old.items[old.items.length - 1].seeded,
], ['My own task', false]);

check('nothing else moved', texts(old).filter((t) => t !== 'My own task'),
  visibleSeeds.map((sd) => sd.text));

// --- a reworded task still matches its seed by url ------------------------
// The url is identity only when one seed uses it, which is what lets a task
// whose text changed be recognised rather than duplicated.
const reworded = {
  date: '2026-07-28', seed: api.SEED_VERSION - 1, ronin: true,
  items: [{ text: 'bounty hunting', done: false, off: false, url: '/bhh.php', seeded: true }],
};
api.applySeeds(reworded);
check('a renamed task is matched by its unique url, not duplicated',
  texts(reworded).filter((t) => /bounty|bounties/i.test(t)), ['bounty hunting']);
check('...and gets the run-state flag backfilled onto it',
  reworded.items[0].disabled, 'ronin');

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
