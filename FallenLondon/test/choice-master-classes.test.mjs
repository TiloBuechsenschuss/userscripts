// Ad-hoc test for FallenLondon/choice-helper.js's Master-Classes in Etiquette
// badges ('master-classes').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the two cross-checks the transcription rests on
// -- a basic lesson pays its own difficulty in goods (97 Slivers at Persuasive
// 97), and a narrow Pygmalion challenge is certain 4 levels above where it
// starts -- together with the ONE row where the guide disagrees with that
// second rule, the Scullery's *Take supper with him*. Then the pupil rates,
// the ▼ on the Pygmalion challenges whose failure pushes you back, and the
// badges.
//
// Numbers come from Master-Classes in Etiquette (Guide) and the storylet and
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node FallenLondon/test/choice-master-classes.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MC_PUPILS, MC_LESSONS, MC_TRIALS, MC_GRADUATIONS, MC_STORYLETS, MC_INDEX, MC_ALIASES,'
    + ' MC_CLASS, MC_BRANCH_CLASS, MC_LEVEL, mcPygSure, mcBadgeText, mcSpec, mcStoryletSpec, mcRatings,'
    + ' carouselLookup, carouselCanonical, ' + TABLES.join(', ')
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
const rows = api.MC_OPTIONS;
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

check('four pupils, two of them Fate-locked',
  [api.MC_PUPILS.length, api.MC_PUPILS.filter((p) => p.fate).length], [4, 2]);

check('six basic lessons per open pupil, at the same six difficulties',
  ['Instructing a Louche Devil', 'Educating Lyme'].map((s) =>
    api.MC_LESSONS.filter((e) => e.storylet === s).map((e) => e.ch.diff)),
  [[97, 99, 102, 105, 108, 111], [97, 99, 102, 105, 108, 111]]);

// The cross-check that catches a transcription slip: a basic lesson pays its
// own difficulty in goods, and the last three of the six are the +3 CP ones.
check('every basic lesson pays its difficulty in goods',
  api.MC_LESSONS.filter((e) => e.gives[0][1] !== e.ch.diff).map((e) => e.name), []);

check('the first three basic lessons pay +2 CP and the last three +3',
  ['Instructing a Louche Devil', 'Educating Lyme'].map((s) =>
    api.MC_LESSONS.filter((e) => e.storylet === s).map((e) => e.pyg)),
  [[2, 2, 2, 3, 3, 3], [2, 2, 2, 3, 3, 3]]);

// A narrow challenge is certain 4 above where it starts. The guide states
// both figures for all thirteen Pygmalion challenges, and exactly one of them
// disagrees -- which is why the tooltip prints both for that row alone.
check('the one row where the guide\'s "100% at" is not the level plus 4',
  api.MC_OPTIONS.filter((e) => e.pygCh && api.mcPygSure(e.pygCh) !== e.pygCh.sure)
    .map((e) => [e.storylet, e.name, api.mcPygSure(e.pygCh), e.pygCh.sure]),
  [['Take the Louche Devil to the Doubt Street Scullery', 'Take supper with him', 13, 14]]);

check('that row\'s tooltip carries both figures, and a row that agrees carries one',
  [api.mcSpec(row('Take supper with him')).title.includes('the guide says 14'),
    api.mcSpec(row('A robust young lady')).title.includes('the guide says')],
  [true, false]);

check('the payout is at Pygmalion ' + api.MC_LEVEL + ' on both pupils, and resets',
  api.MC_GRADUATIONS.map((e) => [e.storylet, api.mcBadgeText(e)]),
  [['A Society dinner with the Louche Devil', 'reset? · Brass ×1000 ▼'],
    ['Set Lyme to writing', 'reset? · Glim ×700 ▼']]);

check('every Pygmalion challenge that pushes you back is marked, and no basic lesson is',
  [api.MC_TRIALS.every((e) => api.mcBadgeText(e).includes('▼ Pyg −')),
    api.MC_LESSONS.some((e) => api.mcBadgeText(e).includes('▼'))],
  [true, false]);

check('badges', [['Elocution'], ['Take on a Clay Pupil'], ['Take on a Rubbery Pupil (5 FATE)'],
  ['Encourage him to be confident'],
  ['Make absolutely sure Jasper and Frank won’t be disappointed (3 FATE)']]
  .map(([n]) => api.mcBadgeText(row(n))),
  ['Pyg +2? · Brass ×97', 'Glim ×3982 · 1.261 EPA', 'Amber ×4854 Trembling Amber ×1 · 1.45 EPA · Fate · Favours: Rubbery Men +1',
    'Pyg +3? · Brass ×109 ▼ Pyg −2', 'Pyg +3? · First Sporing ×1 · Fate · Favours: The Docks +1']);

// The wiki disambiguates the Clay pupil's lesson storylet "Educating Lyme 1".
check('the wiki\'s disambiguated storylet title is aliased to the game\'s',
  api.carouselCanonical(key('Educating Lyme 1'), api.MC_ALIASES), key('Educating Lyme'));

check('storylet headings', ['Provide Master-Classes in Etiquette', 'Instructing a Louche Devil',
  'Set Lyme to writing', 'Introduce Lyme to a Child', 'Giving Lessons at Mahogany Hall']
  .map((s) => api.mcStoryletSpec(key(s)).text),
  ['pick a pupil', 'lessons', 'graduate', 'Pygmalion test', 'the way in']);

check('the registered pass',
  (() => {
    const elocution = makeHeading('Elocution');
    const dexterity = makeHeading('Dexterity');
    branches = [elocution, dexterity];
    roots = [makeHeading('Instructing a Louche Devil')];
    api.mcRatings();
    const out = [text(roots[0], api.MC_CLASS), text(elocution, api.MC_BRANCH_CLASS),
      text(dexterity, api.MC_BRANCH_CLASS)];
    // The heading the wiki calls "Educating Lyme 1" is "Educating Lyme" in the
    // game; both must open the same option table.
    roots = [makeHeading('Educating Lyme')];
    api.mcRatings();
    out.push(text(roots[0], api.MC_CLASS), text(elocution, api.MC_BRANCH_CLASS),
      text(dexterity, api.MC_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['lessons', 'Pyg +2? · Brass ×97', null, 'lessons', null, 'Pyg +2? · Glim ×97']);

check('no Master-Classes name is in another feature\'s table',
  (() => { const others = otherNames('MC_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'master-classes'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
