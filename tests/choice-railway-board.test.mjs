// Ad-hoc test for FallenLondon/choice-helper.js's Railway Board badges
// ('railway-board').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every one of the 26 board members has both
// a Persuade title and an Invite title, since the same fact is badged on
// both; that each has a lever or an explicit note that none is recorded, a
// silent gap there being a badge that says nothing; the split of members
// across the three levers, which is the number the guide's advice rests on;
// and the five counters with their gains.
//
// Numbers come from Railway Board (Guide), its member table and the three board storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node tests/choice-railway-board.test.mjs

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

function makeHeading(text, className) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.className = className || '';
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let heads = [];
let branches = [];
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return heads.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
    return [];
  },
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS',
  'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS',
  'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS',
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS',
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS',
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS',
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { RB_OPTIONS, RB_INDEX, RB_MEMBERS, RB_STORYLETS, RB_CONVENE, RB_DEBATE, RB_ADD, RB_CLASS, RB_BRANCH_CLASS, rbBadgeText, rbSpec, rbStoryletSpec, rbRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, '
    + TABLES.join(', ') + ' }; })();');
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
const rows = api.RB_OPTIONS;
const row = (name, storylet) => rows.find((e) => e.name === name && (!storylet || e.storylet === storylet));
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

// Every table in the file is keyed on storylet PLUS title, and `carouselLookup`
// refuses to answer when two rows of one storylet match -- so a repeated key
// here is an option that would go unbadged.
check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k) || !key(n)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('no Railway Board name is in another feature\u2019s table',
  (() => {
    const others = otherNames('RB_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('twenty-six members, each with a Persuade and an Invite title',
  [api.RB_MEMBERS.length,
    api.RB_MEMBERS.filter((m) => !m.persuade || !m.invite).map((m) => m.who)],
  [26, []]);

// A member with neither a lever nor a note would badge as if a counter helped
// when none does.
check('every member has a lever or says that none is recorded',
  api.RB_MEMBERS.filter((m) => !m.lever && !m.special).map((m) => m.who), []);

// The guide's advice is "build a board that shares a lever", and this is the
// arithmetic behind it.
check('the split across the three levers',
  ['Corruption', 'Obfuscation', 'Respectability', null]
    .map((l) => api.RB_MEMBERS.filter((m) => m.lever === l).length),
  [6, 7, 8, 5]);

check('every member with a lever has a cap for it',
  api.RB_MEMBERS.filter((m) => m.lever && !(m.cap > 0)).map((m) => m.who), []);

check('the five counters, what they raise and by how much',
  rows.filter((e) => e.counter).map((e) => [e.name, e.counter, e.gain, !!e.ch]),
  [['Hint at one or two things you know', 'Corruption', 6, false],
    ['Treat your fellow board members to a sumptuous repast', 'Corruption', 3, false],
    ['Begin the meeting with a few words', 'Obfuscation', 6, false],
    ['Confuse truth and fiction', 'Obfuscation', 4, true],
    ['Rely on your personal respectability and authority', 'Respectability', 3, true]]);

// A counter's tooltip has to name who it actually helps, or the number on it
// is a number about nothing.
check('a counter’s tooltip lists the members it moves',
  (() => {
    const t = api.rbSpec(row('Confuse truth and fiction')).title;
    return [/The Efficient Commissioner/.test(t), /Furnace Ancona/.test(t), /Virginia/.test(t)];
  })(), [true, true, false]);

check('the same lever is badged on Persuade and on Invite',
  [api.rbBadgeText(row('Persuade the Drummer')), api.rbBadgeText(row('Invite the Drummer to the Board'))],
  ['Corruption −40 · Infernal Interests (60)', 'Corruption · Infernal Interests (60)']);

check('badges for each shape of row',
  ['Persuade the Efficient Commissioner', 'Persuade the Jovial Contrarian', 'Confuse truth and fiction',
    'Hint at one or two things you know', 'Vote a dividend to the shareholders']
    .map((n) => api.rbBadgeText(row(n))),
  ['Obfuscation −40 · the Bazaar (40)', 'no lever', 'Obfuscation +4?', 'Corruption +6',
    'Moon-Pearl ×2,000+ · Diamond ×2 · Debt +5']);

check('the headings',
  api.RB_STORYLETS.map((s) => api.rbStoryletSpec(key(s)).text),
  ['the proposals this guide prices', 'Corruption 6 · Obfuscation 7 · Respectability 8 · none 5',
    'Corruption 6 · Obfuscation 7 · Respectability 8 · none 5']);

check('the registered pass: the debate heading, a member and a counter',
  (() => {
    const open = makeHeading(api.RB_DEBATE, 'storylet-root__heading');
    const member = makeHeading('Persuade Virginia');
    const counter = makeHeading('Treat your fellow board members to a sumptuous repast');
    roots = [open];
    branches = [member, counter];
    api.rbRatings();
    const out = [text(open, api.RB_CLASS), text(member, api.RB_BRANCH_CLASS), text(counter, api.RB_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Corruption 6 · Obfuscation 7 · Respectability 8 · none 5',
    'Corruption −40 · Infernal Interests (40)', 'Corruption +3 ▼']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'railway-board'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
