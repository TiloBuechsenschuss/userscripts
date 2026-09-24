// Ad-hoc test for FallenLondon/choice-helper.js's Publishing a Newspaper badges
// ('publishing-newspaper').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that each of Hours 12 to 2 has exactly its one
// storylet and every one of them offers each kind of copy the guide's table
// gives it; the guide's claim that only a Salacious edition of 104 is within
// reach without late qualities, which falls out of the table; that a failure
// takes copy away only at Hour 2; and that a badge is only drawn inside its own
// Hour's storylet.
//
// Numbers come from Publishing a Newspaper (Guide) and the storylet and option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node tests/choice-publishing-newspaper.test.mjs

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { factionText, NP_HOURS, NP_STORYLETS, NP_CLASS, NP_BRANCH_CLASS, npStorylet, npSpec, npRatings, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.NP_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);
const kinds = (hour) => [...new Set(rows.filter((e) => e.storylet === api.npStorylet(hour) && e.win)
  .map((e) => e.win[0][0]))].sort();

check('twelve Hours, one storylet each',
  [api.NP_HOURS.length, new Set(api.NP_HOURS.map((h) => h[1])).size, api.NP_HOURS.map((h) => h[0]).join(',')],
  [12, 12, '12,11,10,9,8,7,6,5,4,3,2,1']);

// The guide's table: a dash under Outlandish at Hour 5 and under Meritorious at Hour 3.
check('the kinds of copy each Hour offers are the guide\'s',
  [12, 11, 10, 9, 8, 7, 6, 5, 4, 3].map((h) => kinds(h).join('/')),
  ['Merit/Outl/Sal', 'Merit/Outl/Sal', 'Merit/Outl/Sal', 'Merit/Outl/Sal', 'Merit/Outl/Sal', 'Merit/Outl/Sal',
    'Merit/Outl/Sal', 'Merit/Sal', 'Merit/Outl/Sal', 'Outl/Sal']);

check('only a Hour 2 failure takes copy away',
  rows.filter((e) => (e.lose || []).some((m) => m[1] < 0)).map((e) => e.storylet + ': ' + e.name),
  ['The Temptations of Power: Dishonest outrage', 'The Temptations of Power: Do you have insufficient balderdash?',
    'The Temptations of Power: The interception of scandal']);

// The guide says the 104-copy Meritorious and Outlandish editions are "not
// achievable without late mid-game qualities", and prices the Salacious one
// on the column that spends five Gossip. Taking the best line of one kind at
// every Hour, with nothing that NEEDS a quality or item, is exactly that: 92,
// 92, and 116 for Salacious with the column.
check('without a requirement only Salacious reaches 104, as the guide says',
  ['Merit', 'Outl', 'Sal'].map((kind) => api.NP_HOURS.map((h) => Math.max(0, ...rows
    .filter((e) => e.storylet === h[1] && !e.needs && e.win && e.win[0][0] === kind)
    .map((e) => e.win[0][1]))).reduce((a, b) => a + b, 0)),
  [92, 92, 116]);

check('the guide\'s Echo ranges are on the editions',
  ['A rather poor edition', 'An edition of edification and pleasing truth', 'The tawdry secrets of the famous laid bare!']
    .map((n) => row(n).pays.worth), [45, '34–62', '66.9–71.5']);

check('badges', ['The voice of the streets', 'Covering the Bishop and the candles', 'Dishonest outrage',
  'A column revealing certain facts about an acquaintance', 'An edition of edification and pleasing truth',
  'Get those blasted things running'].map((n) => api.npSpec(row(n)).text),
['Merit +8', 'Merit +12?', 'Merit +12? / −6', 'Sal +24 ▼', 'Merit 60 → Journals · 34–62', 'Hour → 12']);

check('the guide\'s disagreement is said in the tooltip',
  api.npSpec(row('Employ a little theatrical accountancy')).title.includes('The guide says no challenge'), true);

check('the registered pass',
  (() => {
    const devils = makeHeading('A story about devils');
    const spindle = makeHeading('A suggestive story about the Elongated Spindlewolf');
    branches = [devils, spindle];
    roots = [makeHeading('Fresh copy')];
    api.npRatings();
    const out = [text(roots[0], api.NP_CLASS), text(devils, api.NP_BRANCH_CLASS), text(spindle, api.NP_BRANCH_CLASS)];
    roots = [makeHeading('The Meeting Room')];
    api.npRatings();
    out.push(text(roots[0], api.NP_CLASS), text(devils, api.NP_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Hour 10', 'Merit +12?', 'Sal +12?', 'Hour 8', null]);

check('no Newspaper option name is in another feature\'s table',
  (() => { const others = otherNames('NP_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Newspaper storylet is another feature\'s',
  (() => { const others = otherStorylets('NP_OPTIONS');
    return api.NP_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'publishing-newspaper'), true);

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 5).
check('every faction result is on the badge, after it',
  api.NP_OPTIONS.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name || e.branch, (api.npSpec(e).text).endsWith(' · ' + api.factionText(e.factions))]),
  [["Publish a seditious edition",true]]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
