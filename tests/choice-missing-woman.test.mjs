// Ad-hoc test for FallenLondon/choice-helper.js's Searching out a Missing Woman
// badges ('missing-woman').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's 11 actions (1 start, 9 progress, 1 end)
// out of the CP arithmetic; that every Looking in High Places and Low reached by
// a choice leaves at least one storylet open at 2 and at 4, which is the whole
// point of the choice; the Luck cards at their expected value; the guide's 5.5
// actions a Contraption; and that the two titles the game shares resolve by
// storylet.
//
// Numbers come from Searching out a Missing Woman (Guide) and the storylet,
// card and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node tests/choice-missing-woman.test.mjs

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
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS', 'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS',
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MWS, MWS_HAND, MWS_STORYLETS, MWS_CLASS, MWS_BRANCH_CLASS, mwsSpec, mwsRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
    + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
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
  ].map(key).filter(Boolean);
}
function otherStorylets(own) {
  return TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.storylet)).map(key).filter(Boolean);
}
const rows = api.MWS_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);

// Level 2 → 3 is 3 CP and 4 → 5 is 5 CP at 1 CP an action, plus the start, the
// choice at 3 and the payout.
check('11 actions a round at full success, as the guide says',
  (() => { const per = Math.max(...rows.filter((e) => e.win && e.ch).map((e) => e.win[0][1]));
    return 1 + 3 / per + 1 + 5 / per + 1; })(), 11);

check('every Looking a choice can set leaves a storylet open at Search 2 and at 4',
  [1, 2, 3].map((looking) => ['Search 2', 'Search 4'].map((at) => Object.entries(api.MWS.headings)
    .filter(([s, h]) => h.indexOf(at) === 0 && !/card|choose|cash/.test(h))
    .filter(([s, h]) => { const m = h.match(/Looking (\d)–(\d)/); return !m || (looking >= +m[1] && looking <= +m[2]); })
    .length > 0)), [[true, true], [true, true], [true, true]]);

check('the two Luck cards at their expected value, and ranked by it in the hand',
  [api.mwsSpec(row('Follow her')).text, api.carouselHandSpec(api.MWS_HAND, 'Less fierce than he looks').text],
  ['≈Search +1.2 CP', '≈Search +1.2 CP']);

check('badges', ['Whatever is necessary', 'Ask them', 'The carpet bag', 'A friendly gesture', 'Down to business']
  .map((n) => api.mwsSpec(row(n)).text),
['Search → 2 Looking → 2', 'Search +1 CP?', 'Contraptions ×2', 'Labour ×4 + Villains ▼', 'Tension +1 CP']);

check('the carpet bag carries the guide\'s 5.5 actions a Contraption',
  [11 / Number(row('The carpet bag').gives.match(/×(\d+)/)[1]), row('The carpet bag').note.includes('5.5 actions')],
  [5.5, true]);

check('"Millicent Clathermont" resolves by the open storylet',
  (() => {
    const millicent = makeHeading('Millicent Clathermont');
    branches = [millicent];
    roots = [makeHeading('Who is she?')];
    api.mwsRatings();
    const out = [text(roots[0], api.MWS_CLASS), text(millicent, api.MWS_BRANCH_CLASS)];
    roots = [makeHeading('The End of a Search')];
    api.mwsRatings();
    out.push(text(millicent, api.MWS_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Search 3 · choose', 'Search → 4 Looking → 1', 'story · Clathermont → 9']);

check('no Missing Woman option name is in another feature\'s table',
  (() => { const others = otherNames('MWS_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Missing Woman storylet is another feature\'s',
  (() => { const others = otherStorylets('MWS_OPTIONS');
    return api.MWS_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'missing-woman'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
