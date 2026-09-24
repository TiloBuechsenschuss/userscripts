// Ad-hoc test for FallenLondon/choice-helper.js's Professional Activities badges
// ('professional-activities').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's three tiers -- 90/0 for 320, 180/4 or
// 140/10 for 410, 200/12 for 450 -- as the shape every job must fall into, with
// the rows that break it being exactly the ones carrying a `guide` note; eleven
// jobs a profession, two specialist jobs per specialisation; every Services
// Rendered a job earns having a payout to spend it on; and the failure's flat 200.
//
// Numbers come from Professional Activities (Guide) and the six storylet pages
// and every job and payout page on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node tests/choice-professional-activities.test.mjs

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS', 'BRAWL_OPTIONS', 'SKEL_OPTIONS',
  'PROF_OPTIONS', 'HG_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { PROF_JOBS, PROF_PAYMENTS, PROF_STORYLETS, PROF_CLASS, PROF_BRANCH_CLASS, profSpec, profRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const jobs = api.PROF_JOBS;
const pays = api.PROF_PAYMENTS;
const row = (name) => api.PROF_OPTIONS.find((e) => e.name === name);
const tier = (e) => [e.ch.diff, e.narrow.diff].join('/');

check('eleven jobs a profession, and six professions',
  [...new Set(jobs.map((e) => e.profession))].map((p) => jobs.filter((e) => e.profession === p).length), [11, 11, 11, 11, 11, 11]);

// Three break the guide's tiers: two where the page disagrees with the guide's
// own table, and the Correspondent's Möbius text, where both say 180/10.
check('every job fits a guide tier, save three',
  jobs.filter((e) => !({ '90/0': 320, '180/4': 410, '140/10': 410, '200/12': 450 }[tier(e)] === e.win)).map((e) => e.name),
  ['Extract a catalogue of venoms', 'Translate a Möbius text', '‘The subject of a suspended writ’']);

check('the rows that break the tier are among the ones that carry what the guide says',
  jobs.filter((e) => ['Extract a catalogue of venoms', '‘The subject of a suspended writ’'].includes(e.name))
    .every((e) => !!e.guide), true);

check('every failure pays the flat 200', [...new Set(jobs.map((e) => e.lose))], [200]);

check('every Services Rendered a job earns has a payout',
  [...new Set(jobs.map((e) => e.services).filter(Boolean))].filter((s) => !pays.some((p) => p.services === s)), []);

check('two specialist jobs per specialisation',
  Object.values(jobs.filter((e) => /specialisation/.test(e.needs || '')).reduce((c, e) => {
    c[e.needs] = (c[e.needs] || 0) + 1; return c;
  }, {})).every((n) => n === 2), true);

check('badges', ['Officiate a Wedding', 'Recover an infernal artifact', 'In souls', 'In Rostygold']
  .map((n) => api.profSpec(row(n)).text),
['Invoices +410? / +200', 'Invoices +410? / +200 · Services: Hell +1', '1600 + Hell ×5 → Portfolio + Souls ×175', '500 → Rostygold']);

check('the tooltip names both challenges, the Airs and the guide\'s disagreement',
  (() => { const t = api.profSpec(row('Engineer a fortification')).title;
    return [t.includes('Challenge: Persuasive 200'), t.includes('And: Glasswork 12 (narrow)'), t.includes('Airs of Industry 51–100'),
      t.includes('The guide says broad 200, narrow 13, 450 pennies')]; })(), [true, true, true, true]);

check('the registered pass, with a quoted Licentiate title',
  (() => {
    const job = makeHeading('\'The Rabid Hound\'');
    branches = [job];
    roots = [makeHeading('The Business of a Licentiate')];
    api.profRatings();
    const out = [text(roots[0], api.PROF_CLASS), text(job, api.PROF_BRANCH_CLASS)];
    roots = [makeHeading('The Business of a Silverer')];
    api.profRatings();
    out.push(text(job, api.PROF_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Licentiate jobs', 'Invoices +320? / +200 · Services: Constables +1', null]);

check('no Professional Activities option name is in another feature\'s table',
  (() => { const others = otherNames('PROF_OPTIONS');
    return [...new Set(api.PROF_OPTIONS.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Professional Activities storylet is another feature\'s',
  (() => { const others = otherStorylets('PROF_OPTIONS');
    return api.PROF_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'professional-activities'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
