// Ad-hoc test for FallenLondon/choice-helper.js's Social Actions badges
// ('social-actions').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the correspondence thresholds against the CP
// each reward spends, one deadly option per assassin card found under either
// Horsehead Amulet title, a sending option per letter that earns
// Corresponding..., and the badges.
//
// Numbers come from Social Actions (Guide) and its storylet, card and option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-15.
//
//   node tests/choice-social-actions.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null,
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
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      node.parentNode = p;
      p.children.splice(p.children.indexOf(this) + 1, 0, node);
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
    },
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { SOCIAL_STORYLETS, SOCIAL_INDEX, SOCIAL_LETTERS, SOCIAL_REWARDS, SOCIAL_CLASS, SOCIAL_BRANCH_CLASS,'
    + ' socialLevelCp, socialBadgeText, socialSpec, socialRatings, carouselLookup, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;')(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const key = api.normalizeName;
const rows = api.SOCIAL_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function otherNames(own) {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}
const ASSASSINS = ['A Curious Taste', 'A Crack of Gunfire!', 'A Sudden Shadow!', 'A Warning Croak'];

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('each reward spends exactly the CP of the level it needs',
  rows.filter((e) => e.cost != null).map((e) => api.socialLevelCp(e.needsLevel) === e.cost), Array(7).fill(true));

check('one deadly option on each assassin card', ASSASSINS.map((s) => rows.filter((e) => e.storylet === s && e.death).length),
  [1, 1, 1, 1]);

check('and it is found under either Horsehead Amulet title',
  ['Drink up. Try to enjoy it. (No Horsehead Amulet)', 'Drink up. Try to enjoy it. (Horsehead Amulet)', 'Drink up. Try to enjoy it.']
    .map((n) => { const e = api.carouselLookup(api.SOCIAL_INDEX, n, key('A Curious Taste')); return e && api.socialBadgeText(e); }),
  ['☠ death', '☠ death', '☠ death']);

check('fourteen letters to compose, and fourteen to send',
  [rows.filter((e) => e.letter || e.name === 'Write down a question').length, rows.filter((e) => e.sent).length], [14, 14]);

check('badges for each kind of row',
  ['Write some case notes into a letter', 'Compose advice for an investigation', 'Send a coded letter', 'Discard your letter',
   'For the secrets', 'Pretend to drink', 'Stand and dare him to take the shot', 'Write down a name in Gant']
    .map((n) => api.socialBadgeText(row(n))),
  ['Watchful · Corr +1 ▼', 'Investigating · Corr +1? ▼', 'Corr +3', 'Hints ×250+', '10 CP → Clues + Secrets', 'Diamond?',
   '☠ death', 'your Scandal & Suspicion ▼']);

check('a scaling challenge is worked out at base 150',
  api.socialSpec(row('Climb up to the Flit and face him head-on')).title.includes('90% of your base Dangerous -- 135 at base 150, certain at 225'),
  true);

check('the registered pass: letters, then an assassin card',
  (() => {
    const notes = makeHeading('Write some case notes into a letter');
    const stab = makeHeading('Allow yourself to be stabbed');
    branches = [notes, stab];
    roots = [makeHeading('Epistolary Matters')];
    api.socialRatings();
    const out = [text(roots[0], api.SOCIAL_CLASS), text(notes, api.SOCIAL_BRANCH_CLASS), text(stab, api.SOCIAL_BRANCH_CLASS)];
    roots = [makeHeading('A Sudden Shadow!')];
    api.socialRatings();
    out.push(text(roots[0], api.SOCIAL_CLASS), text(notes, api.SOCIAL_BRANCH_CLASS), text(stab, api.SOCIAL_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['letters', 'Watchful · Corr +1 ▼', null, 'assassin', null, '☠ death']);

check('no Social Actions name is in another feature\'s table',
  (() => { const others = otherNames('SOCIAL_OPTIONS');
    return rows.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'social-actions'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
