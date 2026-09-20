// Ad-hoc test for FallenLondon/choice-helper.js's Jericho Library badges
// ('jericho-library').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every research option carries what a FAILURE
// does as well as what a success pays, since several pay their failure in
// Wounds or Nightmares and two pay research; that the easy options are the
// twenty-fives and are marked as always available; that every advanced option
// names a Lead and a stage, which is what decides whether it is on the screen;
// and the one title this feature shares with Forgotten Quarter Expeditions.
//
// Numbers come from Jericho Library (Guide), the five topic storylets and the three project storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-jericho-library.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { JL_OPTIONS, JL_INDEX, JL_PROJECTS, JL_STORYLETS, JL_STAGE_PROGRESS, JL_LEAD_USES, JL_LIBRARY, JL_CARTOGRAPHY, JL_LANGUAGES, JL_CLASS, JL_BRANCH_CLASS, jlBadgeText, jlSpec, jlStoryletSpec, jlRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.JL_OPTIONS;
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


check('the three projects and what each is worth',
  api.JL_PROJECTS.map((p) => [p.name, p.pays, p.echoes]),
  [['History of the Hinterlands', 'a False Hagiotoponym', 62.5],
    ['History of Mutability', 'an Oneiromantic Revelation', 62.5],
    ['Mystery of the Elder Continent', 'a Primaeval Hint', 62.5]]);

check('a stage wants 200 research, and a lead is good for 3 uses then 4',
  [api.JL_STAGE_PROGRESS, api.JL_LEAD_USES[1], api.JL_LEAD_USES[2], api.JL_LEAD_USES[3]], [200, 3, 4, 4]);

// A research option with no failure recorded would badge as free when it is
// not. Every one of them has to say what a failure does.
check('every research option says what a failure does',
  rows.filter((e) => e.research != null && e.fail == null && !e.failMenace).map((e) => e.name), []);

check('every advanced option names a lead, a stage and a project',
  rows.filter((e) => e.research != null && !e.easy)
    .filter((e) => !e.lead || !e.stage || !e.project).map((e) => e.name), []);

check('the easy options are the twenty-fives and the assistants',
  rows.filter((e) => e.easy).map((e) => e.research),
  [25, 25, 7, 25, 25, 7, 25, 25, 7, 25, 25, 7, 25, 25, 7]);

// The stage-three options that pay their failure in menaces, and the two whose
// failure still pays research. Both are why `fail` and `failMenace` are
// separate fields rather than one number.
check('the failures that are menaces, and the failures that pay',
  [rows.filter((e) => e.failMenace).map((e) => [e.name, e.failMenace]),
    rows.filter((e) => e.fail > 0).map((e) => [e.name, e.fail])],
  [[['Posit impossible conclusions', 'Nightmares +5 CP'], ['Test out your theories', 'Wounds +5 CP'],
    ['Converse with devils', 'Nightmares +5 CP'], ['Repair destroyed texts', 'Wounds +5 CP'],
    ['Apply unwise chemical substances with wild abandon', 'Wounds +5 CP'],
    ['Arrange an interlibrary loan with Port Carnelian', 'Nightmares +5 CP'],
    ['Begin an expedition', 'Wounds +3 CP']],
    [['Contemplate False Globes', 2], ['Tease out the subtleties hidden in Presbyterate nomenclature', 8]]]);

check('badges for each shape of row',
  ['Study antique terrain', 'Beguile unwitting scholars', 'Test out your theories',
    'Tease out the subtleties hidden in Presbyterate nomenclature', 'Perform field research', 'Conclude your thesis']
    .map((n) => api.jlBadgeText(row(n))),
  ['+39? \u00b7 fail \u22122 \u00b7 Cartography 1', '+25? \u00b7 fail costs nothing \u00b7 any stage',
    '+41? \u00b7 fail Wounds +5 CP \u00b7 Cartography 3',
    '+25? \u00b7 fail +8 \u00b7 Ancient Languages 2', 'Lead: Cartography', '62.5 Echoes']);

// Enlist qualified assistance is a different companion in each of three
// storylets, and only the open storylet decides which row answers.
check('the three assistants are told apart by their storylet',
  [api.JL_CARTOGRAPHY, api.JL_LANGUAGES, 'Unanticipated Ecologies'].map((s) => {
    const e = api.carouselLookup(api.JL_INDEX, 'Enlist qualified assistance', key(s));
    return e && e.needs;
  }),
  ['The Pirate-Poet, Inscribed Anew', 'an Ebullient Undertaker', 'A Monster-Hunting Academic']);

check('the merged titles are one entry each',
  ['Conclude your thesis', 'Resume your studies'].map((n) => rows.filter((e) => e.name === n).length), [1, 1]);

check('the tooltip of an advanced option names its lead, stage and uses',
  /Needs Lead: Cartography, in stage 1 of History of the Hinterlands \u2014 and a Lead may be used 3 times/
    .test(api.jlSpec(row('Study antique terrain')).title), true);

check('the library heading carries the three projects and their rewards',
  (() => {
    const t = api.jlStoryletSpec(key(api.JL_LIBRARY)).title;
    return [/False Hagiotoponym/.test(t), /Oneiromantic Revelation/.test(t), /Primaeval Hint/.test(t)];
  })(), [true, true, true]);

check('the registered pass: a topic heading, an easy option and an advanced one',
  (() => {
    const open = makeHeading(api.JL_CARTOGRAPHY, 'storylet-root__heading');
    const easy = makeHeading('Acquire recent maps');
    const lead = makeHeading('Chart forlorn pathways');
    roots = [open];
    branches = [easy, lead];
    api.jlRatings();
    const out = [text(open, api.JL_CLASS), text(easy, api.JL_BRANCH_CLASS), text(lead, api.JL_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['research 7\u201341 an action', '+25? \u00b7 fail costs nothing \u00b7 any stage',
    '+32? \u00b7 fail \u22122 \u00b7 Cartography 2']);

// One known exception, and only one: Forgotten Quarter Expeditions has a
// "Begin an Expedition" of its own, under a different storylet, which
// `carouselRatings` can never confuse with this one.
check('exactly one Jericho name is in another feature\u2019s table',
  (() => {
    const others = otherNames('JL_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), ['Begin an expedition']);

check('and the shared title belongs to two different storylets',
  [row('Begin an expedition').storylet,
    api.FQ_OPTIONS.find((e) => key(e.name) === key('Begin an expedition')).storylet],
  ['Unanticipated Ecologies', 'Prepare for an Expedition']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'jericho-library'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
