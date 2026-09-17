// Ad-hoc test for FallenLondon/choice-helper.js's Temple Club badges
// ('temple-club').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every exchange's badge names what it takes
// as well as what it gives, that ★ is on exactly the guide's four reasons to
// come, that an exchange is coloured as a payout while the invitation is not
// (and says so in words), and that an ordinary title like "Sly" is answered
// only inside The Immaculate Entrepreneur.
//
// Numbers come from The Temple Club (Guide) and the option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-temple-club.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

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
    'return { factionText, TC_STORYLETS, TC_MARK_WORTH, TC_CLASS, TC_BRANCH_CLASS, tcSpec, tcRatings, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.TC_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);

check('★ is on the guide\'s four reasons to come, and nowhere else',
  rows.filter((e) => e.label.indexOf(api.TC_MARK_WORTH) === 0).map((e) => e.name),
  ['The drunk in the corner', 'Ponder the nature of the Red Science', 'Commission a portrait', 'A new home']);

check('every exchange says what it takes and what it gives',
  rows.filter((e) => e.uses && e.label.indexOf('→') === -1).map((e) => e.name), []);

check('an exchange is a payout; the invitation is not, and its words say so', [
  api.tcSpec(row('Sly')).color === api.tcSpec(row('Paintings')).color,
  api.tcSpec(row('Sly')).color !== api.tcSpec(row('Make the invitation')).color,
  api.tcSpec(row('Make the invitation')).text,
], [true, true, 'invite a friend']);

check('badges', ['Fund Tomb-Colonist defences', 'The drunk in the corner', 'Throw in a coin and take a drink',
  'Make discreet inquiries into the Tragedy Procedures'].map((n) => api.tcSpec(row(n)).text),
['Rostygold ×300 → Scintillack', '★ Notion ×2500 → Masters +1 CP', 'Jade ×50 → 1 of 4', 'Clues ×100']);

check('the guide\'s verdict is in the tooltip',
  [api.tcSpec(row('Assist acquaintances entangled in bureaucracy')).title.includes('a bad use of your favours'),
    api.tcSpec(row('Commission a portrait')).title.includes('Needs: Notability 10, Scandal 7')],
  [true, true]);

check('the registered pass',
  (() => {
    const sly = makeHeading('Sly');
    branches = [sly];
    roots = [makeHeading('The Immaculate Entrepreneur')];
    api.tcRatings();
    const out = [text(roots[0], api.TC_CLASS), text(sly, api.TC_BRANCH_CLASS)];
    roots = [makeHeading('Chart the Course of Empire')];
    api.tcRatings();
    out.push(text(sly, api.TC_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['bulk exchanges', 'Correspondence ×180 → Documents ×20', null]);

check('no Temple Club option name is in another feature\'s table',
  (() => { const others = otherNames('TC_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Temple Club storylet is another feature\'s',
  (() => { const others = otherStorylets('TC_OPTIONS');
    return api.TC_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'temple-club'), true);

// Renown and Favours an option gives or takes follow the badge itself, never
// the tooltip alone (the adding-fallen-london-features skill, step 5).
check('every faction result is on the badge, after it',
  api.TC_OPTIONS.filter((e) => e.factions && e.factions.length)
    .map((e) => [e.name || e.branch, (api.tcSpec(e).text).endsWith(' · ' + api.factionText(e.factions))]),
  [["Assist acquaintances entangled in bureaucracy",true]]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
