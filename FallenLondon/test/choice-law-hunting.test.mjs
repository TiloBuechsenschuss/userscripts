// Ad-hoc test for FallenLondon/choice-helper.js's Law-Hunting badges
// ('law-hunting').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the three self-forms, their quarry-forms,
// their checks and their menaces line up one for one, since picking the wrong
// form triples the length of a hunt; that every option answers to its plain
// title as well as to the wiki's \"(Hell's Chagrin)\" one, the activity having
// moved here from the Estival; and the efficiency band, which is the only
// number in the activity.
//
// Numbers come from Law-Hunting (Guide), To Hunt a Law and The Theory and Practice of Law on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-law-hunting.test.mjs

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
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS',
  'PB_OPTIONS', 'CH_OPTIONS', 'LH_OPTIONS', 'MX_OPTIONS', 'MG_OPTIONS', 'KA_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { LH_OPTIONS, LH_INDEX, LH_FORMS, LH_LAWS, LH_STORYLETS, LH_TARGET, LH_EFFICIENT, LH_SOMEWHAT, LH_INEFFICIENT, LH_THEORY, LH_CLASS, LH_BRANCH_CLASS, lhBadgeText, lhSpec, lhStoryletSpec, lhRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.LH_OPTIONS;
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

check('no Law-Hunting name is in another feature\u2019s table',
  (() => {
    const others = otherNames('LH_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the three forms, what each beats, its check and its menace',
  api.LH_FORMS.map((f) => [f.form, f.law, f.ch.stat, f.ch.diff, f.menace]),
  [['Scholar', 'Sigils', 'Watchful', 190, 'Wounds'],
    ['Hunter', 'a Beast', 'Dangerous', 190, 'Scandal'],
    ['Idea', 'Abstract Thought', 'Persuasive', 190, 'Nightmares']]);

check('every form states what changing into it costs, and what waives that',
  api.LH_FORMS.filter((f) => !f.cost || !f.free).map((f) => f.form), []);

check('the efficiency band, and the chase it has to fill',
  [api.LH_INEFFICIENT, api.LH_SOMEWHAT, api.LH_EFFICIENT, api.LH_TARGET,
    Math.ceil(api.LH_TARGET / api.LH_EFFICIENT)],
  [2, 4, 6, 55, 10]);

check('the four laws, and what catching each pays',
  api.LH_LAWS.map((l) => [l.law, !!l.pays, !!l.start]),
  [['spatial', true, true], ['temporal', true, true], ['causal', true, true], ['ontological', true, true]]);

// The wiki disambiguates every option of this carousel; the game shows the
// plain title, so a missing alias means a blank badge.
check('every option of the hunt answers to its plain title too',
  rows.filter((e) => e.storylet === api.LH_THEORY).map((e) => {
    const plain = e.name.replace(' (Hell’s Chagrin)', '');
    const found = api.carouselLookup(api.LH_INDEX, plain, key(api.LH_THEORY));
    return found === e;
  }).every(Boolean), true);

check('badges for each shape of row',
  ['Hunt a rogue causal law', 'Engage in scholarly pursuit (Hell’s Chagrin)',
    'Adopt the tactics of a hunter (Hell’s Chagrin)', 'Make a breakthrough in legal theory (Hell’s Chagrin)',
    'Pin down the rogue (type) law (Hell’s Chagrin)'].map((n) => api.lhBadgeText(row(n))),
  ['a causal law · a Mortification of a Great Power and An Identity Uncovered!',
    'Capturing +2 to +6? · fail Wounds', 'become the Hunter ▼ · for a Beast', 'Capturing +9 ▾',
    'springs the trap · needs 10']);

// The game puts the kind of law where "(type)" is, so the finisher has to be
// matched on the rest of the title.
check('the finisher is matched whatever kind of law it names',
  ['Pin down the rogue spatial law', 'Pin down the rogue ontological law'].map((n) => {
    const e = api.carouselLookup(api.LH_INDEX, n, key(api.LH_THEORY));
    return e && e.trap;
  }), [true, true]);

check('the headings',
  api.LH_STORYLETS.map((s) => api.lhStoryletSpec(key(s)).text),
  ['4 laws · each pays two 62.5 Echo items', 'Capturing to 55 CP · 6 a turn at best']);

check('the breakthrough says what it costs you as well as what it pays',
  /the law then turns into a Beast/.test(api.lhSpec(row('Make a breakthrough in legal theory (Hell’s Chagrin)'))
    .title), true);

check('the registered pass: the hunt heading, a hunt action and a form change',
  (() => {
    const open = makeHeading(api.LH_THEORY, 'storylet-root__heading');
    const hunt = makeHeading('Engage in scholarly pursuit');
    const change = makeHeading('Adopt the form of an idea');
    roots = [open];
    branches = [hunt, change];
    api.lhRatings();
    const out = [text(open, api.LH_CLASS), text(hunt, api.LH_BRANCH_CLASS), text(change, api.LH_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Capturing to 55 CP · 6 a turn at best', 'Capturing +2 to +6? · fail Wounds',
    'become the Idea ▼ · for Abstract Thought']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'law-hunting'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
