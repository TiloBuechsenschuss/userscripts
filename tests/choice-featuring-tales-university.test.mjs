// Ad-hoc test for FallenLondon/choice-helper.js's Featuring in the Tales of
// the University badges ('featuring-tales-university').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// This is the one feature in the file that badges storylet HEADINGS and nothing
// else, because the guide records no option tables for the storyline. So what
// is worth pinning is small and specific: the line runs in order and has no
// gaps, the two irreversible steps are marked and only those two, and the two
// titles that end in a blank the game fills in are found both bare and filled.
// That last one is the failure that would show as no badge at all.
//
// Content comes from Featuring in the Tales of the University (Guide) and the
// category of the same name on fallenlondon.wiki, fetched through the API on
// 2026-09-16.
//
//   node tests/choice-featuring-tales-university.test.mjs

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
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { FTU_STEPS, FTU_BLANKS, FTU_STORYLETS, FTU_CLASS, FTU_MARK_LOCKS, ftuFind, ftuSpec,'
    + ' ftuRatings, TP_OPTIONS, TP_STORYLETS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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

check('the line runs in order, with every level from 1 to 29 accounted for',
  (() => {
    const levels = api.FTU_STEPS.map((e) => e.step);
    const ordered = levels.every((n, i) => i === 0 || n >= levels[i - 1]);
    const gaps = [];
    for (let n = 1; n <= 29; n++) if (!levels.includes(n)) gaps.push(n);
    return [ordered, gaps];
  })(), [true, []]);

check('two steps are irreversible, and only those two',
  api.FTU_STEPS.filter((e) => e.warning).map((e) => [e.step, e.storylet]),
  [[6, 'Making your Name: A most notable academic'],
    [26, 'Making Your Name: Reveal the murderer of the Senior Reader in']]);

check('an irreversible step is marked on the badge and a plain one is not',
  ['Making your Name: A most notable academic', 'A new vocation']
    .map((n) => api.ftuSpec(api.ftuFind(n)).text.endsWith(api.FTU_MARK_LOCKS)),
  [true, false]);

// The mark is its own shape rather than the ▼ the rest of the file uses for
// "uses something up": nothing is consumed here, a door closes.
check('the lock mark is not the uses-something-up mark',
  [api.FTU_MARK_LOCKS, api.FTU_MARK_LOCKS === '▼'], ['⏏', false]);

// Two titles end in a blank the game fills in with a department. Both readings
// have to find the row; if neither did, those two storylets would go unbadged
// and nothing else would say so.
check('the two blanked titles are found bare and filled in',
  ['Making Your Name: Meet the Department of',
    'Making Your Name: Meet the Department of Antiquarian Esquivalience',
    'Making Your Name: Reveal the murderer of the Senior Reader in',
    'Making Your Name: Reveal the murderer of the Senior Reader in Antiquarian Esquivalience']
    .map((n) => { const s = api.ftuFind(n); return s && s.step; }),
  [8, 8, 26, 26]);

check('the two blanks are the only wildcarded titles', Object.keys(api.FTU_BLANKS),
  ['Making Your Name: Meet the Department of',
    'Making Your Name: Reveal the murderer of the Senior Reader in']);

check('a storylet that is not on the line gets nothing',
  ['Off to the library', 'Attend a feast', 'A day at the library'].map((n) => api.ftuFind(n)),
  [null, null, null]);

// The two University features overlap on purpose, and must not answer for each
// other's storylets: this one owns the story steps, Term Passing... owns the
// carousels.
check('no storylet is claimed by both this feature and Term Passing...',
  api.FTU_STORYLETS.filter((s) => api.TP_STORYLETS.some((t) => key(t) === key(s))), []);

check('badges', ['A new vocation', 'Making your Name: A most notable academic',
  'Making Your Name: Horrors in the chamber!', 'What is it all for?']
  .map((n) => api.ftuSpec(api.ftuFind(n)).text),
  ['FTU 5 · opens the Term Passing... carousel',
    'FTU 6 · locks the first carousel ⏏',
    'FTU 9 · the murder, and the second carousel opens',
    'FTU 29 · Watchful +500 CP']);

check('the investigation steps say what they need',
  api.ftuSpec(api.ftuFind('Making Your Name: Look into love')).title.includes('Investigating... 5'), true);

check('the registered pass',
  (() => {
    roots = [makeHeading('Making Your Name: Meet the Department of Numismatics'),
      makeHeading('Off to the library')];
    api.ftuRatings();
    const out = roots.map((r) => text(r, api.FTU_CLASS));
    roots = [];
    return out;
  })(),
  ['FTU 8 · tea with the Department', null]);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'featuring-tales-university'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
