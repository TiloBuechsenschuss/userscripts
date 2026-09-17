// Ad-hoc test for FallenLondon/choice-helper.js's Empress' Court badges
// ('empress-court').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: Inspired 17 and 24 are the guide's 153 and 300
// CP; every minor work pays 17 Echoes and every major one 30; the badges;
// and the guide disagreements.
//
// Numbers come from Artistry in the Empress' Court (Guide), its five table
// subpages and the storylet and option pages on fallenlondon.wiki, fetched
// through the API on 2026-09-15.
//
//   node FallenLondon/test/choice-empress-court.test.mjs

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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { COURT_STORYLETS, COURT_MINOR, COURT_MAJOR, COURT_CLASS, COURT_BRANCH_CLASS, courtLevelCp, courtEchoes,'
    + ' courtBadgeText, courtSpec, courtStoryletSpec, courtRatings, ' + TABLES.join(', ')
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
const rows = api.COURT_OPTIONS;
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
  ].map(key).filter(Boolean);
}

check('Inspired 17 and 24 are the guide\'s 153 and 300 CP', [api.courtLevelCp(17), api.courtLevelCp(24)], [153, 300]);

check('every minor work pays 17 Echoes and every major one 30',
  [...new Set(rows.filter((e) => e.work).map((e) => (api.COURT_MAJOR.includes(e.storylet) ? 'major ' : 'minor ') + api.courtEchoes(e)))],
  ['minor 17', 'major 30']);

check('storylet plus title identifies a row',
  (() => { const seen = new Set(); let d = 0; rows.forEach((e) => { const k = key(e.storylet) + '|' + key(e.name); if (seen.has(k)) d++; seen.add(k); }); return d; })(), 0);

check('badges for each kind of row',
  ['Consult the lead’s Opinions', 'Seek out inspiration among artists', 'Toss it onto the fire', 'Come to an equitable arrangement',
   'Seek inspiration in indulgence', 'Passion and bats', 'Mortification of the flesh!', 'A Wry Satirical Comedy', 'A History',
   'A Tragedy of Romance', 'The ballet'].map((n) => api.courtBadgeText(row(n))),
  ['Inspired +15/−20?', 'Inspired +30? ▼ · Favours: Bohemians −1', '≈Inspired +7', 'Inspired +15 ▼', '≈Inspired +15 ▼', 'Inspired +35? +Suspicion ▼ · Favours: Revolutionaries −1',
   'Inspired +5', 'Moon-Pearl ×1700', 'Brass ×1700 +Scandal', 'Moon-Pearl ×3000 +Scandal', 'minor · Inspired 17']);

check('the guide disagrees with the pages in the organ recital and eleven works',
  rows.filter((e) => e.guide).map((e) => e.name),
  ['An organ recital at All Christs', 'A Patriotic Anthem', 'A Drinking Song!', 'A Renaissance Piece!', 'A Political Anthem!',
   'An infernal work', 'A work of burning dance', 'A sleek suit', 'A return to the styles of yore', 'A Tragedy of Romance',
   'An Allegorical Satire', 'A Gothic Romance']);

check('a finished work says what it is worth and what it raises',
  api.courtSpec(row('A Carnelian work')).title.includes('Moon-Pearl ×1700 (17 Echoes) and Making Waves +7 CP, Tribute ×1–2'), true);

check('the storylet summaries', ['What’s your next work?', 'Stage your ballet!', 'Your novel is complete!', 'The lead']
  .map((s) => api.courtStoryletSpec(key(s)).text), ['works', 'minor work · 17', 'major work · 30', 'Inspired...']);

check('the registered pass: choosing, then finishing',
  (() => {
    const ballet = makeHeading('The ballet');
    const carnelian = makeHeading('A Carnelian work');
    branches = [ballet, carnelian];
    roots = [makeHeading("What's your next work?")];
    api.courtRatings();
    const out = [text(roots[0], api.COURT_CLASS), text(ballet, api.COURT_BRANCH_CLASS), text(carnelian, api.COURT_BRANCH_CLASS)];
    roots = [makeHeading('Stage your ballet!')];
    api.courtRatings();
    out.push(text(ballet, api.COURT_BRANCH_CLASS), text(carnelian, api.COURT_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['works', 'minor · Inspired 17', null, null, 'Moon-Pearl ×1700']);

check('no Empress\' Court name is in another feature\'s table',
  (() => { const others = otherNames('COURT_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'empress-court'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
