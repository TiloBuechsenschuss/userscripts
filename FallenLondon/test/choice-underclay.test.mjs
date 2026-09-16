// Ad-hoc test for FallenLondon/choice-helper.js's Underclay badges
// ('underclay').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the two cross-checks the transcription rests on --
// every broad challenge's "Min for 100%" being the difficulty × 5 ÷ 3, and the
// guide's Echoes-per-point falling into three bands by the TOTAL points a
// reward costs, which is what catches a mistyped cost on one of the three
// two-currency rows. Then the two progress qualities never being mixed up, the
// failures that take progress back appearing on the badge where the ones that
// raise a menace do not, and the badges.
//
// Numbers come from Underclay (Guide) and the storylet and option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node FallenLondon/test/choice-underclay.test.mjs

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
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { UC_PROGRESS, UC_REWARDS, UC_WAYS, UC_STORYLETS, UC_INDEX, UC_SURPLUS_GLIM, UC_CLASS,'
    + ' UC_BRANCH_CLASS, ucBadgeText, ucSpec, ucStoryletSpec, ucRatings, broadCertainAt, carouselLookup, '
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
const rows = api.UC_OPTIONS;
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

check('four storylets: the hub, the two halves and the way in',
  api.UC_STORYLETS,
  ['Confessions from the Stone', 'Lies for Clay Men to Tell', 'Escape from Underclay',
    'Descend to the Underclay Quarter']);

check('the two halves keep to their own quality',
  ['Confessions from the Stone', 'Lies for Clay Men to Tell'].map((s) =>
    [...new Set(api.UC_PROGRESS.filter((e) => e.storylet === s).map((e) => e.quality))]),
  [['Confessions'], ['Falsehoods']]);

// The guide states a "Min for 100%" for every challenge. For a broad one it is
// the difficulty × 5 ÷ 3, which is the rule the rest of this file uses; a slip
// in either number shows up here.
check('every broad challenge\'s "Min for 100%" is the difficulty × 5 ÷ 3',
  api.UC_PROGRESS.filter((e) => !e.ch.narrow && api.broadCertainAt(e.ch.diff) !== e.sure)
    .map((e) => [e.name, api.broadCertainAt(e.ch.diff), e.sure]), []);

// The three narrow ones are a different convention: this guide puts 100% five
// levels above the difficulty where the Master-Classes guide uses four. Carried
// as stated rather than smoothed.
check('the three narrow challenges are the guide\'s difficulty plus five',
  api.UC_PROGRESS.filter((e) => e.ch.narrow).map((e) => [e.ch.stat, e.ch.diff, e.sure]),
  [['Steward of the Discordance', 8, 13], ['Mithridacy', 5, 10], ['Mithridacy', 10, 15]]);

// The guide's rate depends on the TOTAL points a reward costs, not on which
// currency they are in, which is what makes the three two-currency rows check
// the other six.
check('the Echoes per point fall into three bands by total cost',
  [...new Set(api.UC_REWARDS.map((e) => (e.costConfessions + e.costFalsehoods) + '=' + e.perPoint))].sort(),
  ['100=0.125', '50=0.15', '600=0.104']);

check('nine rewards in the guide\'s table, and a tenth off the option pages',
  [api.UC_REWARDS.length, api.UC_WAYS.filter((e) => e.kind === 'reward').map((e) => e.name)],
  [9, ['Send an Unfinished Man to fight for the Admiralty']]);

check('every surplus point pays Shard of Glim ×' + api.UC_SURPLUS_GLIM,
  [api.UC_SURPLUS_GLIM, api.ucSpec(row('Send an Unfinished Man to Spite')).title
    .includes('Shard of Glim ×' + api.UC_SURPLUS_GLIM)],
  [10, true]);

// A failure that takes progress back is on the badge; one that raises a menace
// is not, so a cheap line and a costly one never read alike.
check('only a failure that costs progress is on the badge',
  [api.ucBadgeText(row('Extract confessions from the Calcified Men')),
    api.ucBadgeText(row('Console the Calcified Man')),
    api.ucSpec(row('Console the Calcified Man')).title.includes('Nightmares +5 CP')],
  ['Confessions +30? −13', 'Confessions +38?', true]);

check('badges', ['Commingle fact and falsehood', 'Provide a reference', 'Send an Unfinished Man to Spite',
  'Send the Unfinished Man to teach Second City History', 'Speak to the Calcified Men', 'Leave Underclay']
  .map((n) => api.ucBadgeText(row(n))),
  ['Falsehoods +33? −5', 'Falsehoods +36? ▼', 'Fal 50 → Labour ×3 · 0.15/pt',
    'Conf 300 Fal 300 → Enigma ×1 · 0.104/pt', 'free · to Stone Confessions', 'free']);

check('storylet headings',
  ['Escape from Underclay', 'Confessions from the Stone', 'Lies for Clay Men to Tell']
    .map((s) => api.ucStoryletSpec(key(s)).text),
  ['the hub · cash out', 'Stone Confessions', 'Convincing Falsehoods']);

check('the registered pass',
  (() => {
    const extract = makeHeading('Extract confessions from the Calcified Men');
    const spite = makeHeading('Send an Unfinished Man to Spite');
    branches = [extract, spite];
    roots = [makeHeading('Confessions from the Stone')];
    api.ucRatings();
    const out = [text(roots[0], api.UC_CLASS), text(extract, api.UC_BRANCH_CLASS),
      text(spite, api.UC_BRANCH_CLASS)];
    roots = [makeHeading('Escape from Underclay')];
    api.ucRatings();
    out.push(text(roots[0], api.UC_CLASS), text(extract, api.UC_BRANCH_CLASS),
      text(spite, api.UC_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Stone Confessions', 'Confessions +30? −13', null,
    'the hub · cash out', null, 'Fal 50 → Labour ×3 · 0.15/pt']);

check('no Underclay name is in another feature\'s table',
  (() => { const others = otherNames('UC_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'underclay'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
