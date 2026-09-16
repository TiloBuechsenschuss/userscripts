// Ad-hoc test for FallenLondon/choice-helper.js's Tales of Mahogany Hall
// badges ('mahogany-hall').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the CP arithmetic the whole feature turns on --
// the seven days needing Tales 8 through 14 in order, a failed show costing
// more CP than a success, and *Smoke and mirrors* being the one Saturday row
// that ADDS Tales instead of spending it -- the two storylets that share the
// title "Assist a hypnotist" resolving by the open storylet, the rows that
// refuse to be a figure, and the badges.
//
// Numbers come from Tales of Mahogany Hall (Guide) and the storylet and option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-16.
//
//   node FallenLondon/test/choice-mahogany-hall.test.mjs

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
    'return { MH_DAYS, MH_BUILD, MH_SHOWS, MH_ODD, MH_STORYLETS, MH_SHOW_STORYLETS, MH_INDEX, MH_CLASS,'
    + ' MH_BRANCH_CLASS, mhPay, mhBadgeText, mhSpec, mhStoryletSpec, mhRatings, carouselLookup, '
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
const rows = api.MH_OPTIONS;
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

check('seven days, in order, needing Tales 8 to 14',
  api.MH_DAYS.map((d) => [d[0], d[2]]),
  [['Monday', 8], ['Tuesday', 9], ['Wednesday', 10], ['Thursday', 11], ['Friday', 12], ['Saturday', 13],
    ['Sunday', 14]]);

check('every day\'s show storylet is in the storylet list',
  api.MH_SHOW_STORYLETS.filter((s) => !api.MH_STORYLETS.includes(s)), []);

// The guide's whole warning about cashing out: a failed show costs more CP
// than a success does, so a show you cannot pass costs you the grind twice.
check('a failed show never costs less CP than a success',
  api.MH_SHOWS.filter((e) => e.costFail != null && e.costFail <= e.cost).map((e) => e.name), []);

check('the four options on Variety is the spice of life! are the +2 CP ones, and the rest pay +1',
  [...new Set(api.MH_BUILD.map((e) => e.storylet + ' ' + e.tales))].sort(),
  ['Box Office Burglary 1', 'The cutthroat world of advertising 1', 'The magic of the theatre 1',
    'The mystic arts 1', 'Ticket touting 1', 'Variety is the spice of life! 2']);

check('Smoke and mirrors is the one Saturday row that ADDS Tales',
  rows.filter((e) => e.kind === 'build' && api.MH_DAYS[5][1].includes(e.storylet)).map((e) => e.name),
  ['Smoke and mirrors']);

check('the same option title resolves by the open storylet',
  ['The magic of the theatre', 'The mystic arts', 'Box Office Burglary']
    .map((s) => { const e = api.carouselLookup(api.MH_INDEX, 'Assist a hypnotist', key(s)); return e && api.mhBadgeText(e); }),
  ['Tales +1? · Pearls ×105', 'Tales +1? · Diamonds ×1 Pearls ×91', null]);

check('Watch from the audience is on two storylets and each gets its own badge',
  ['Watching the Grand Illusion', 'The CHARMING and EXOTIC Kashmiri Princess']
    .map((s) => api.mhBadgeText(row('Watch from the audience', s))),
  ['−20 CP? · Clues ×57', '−20 CP? · Clues ×112']);

check('badges', [['Steal props and goods from other theatres'], ['Take a backstage role'],
  ['Friday', 'The weekly variety bill!'], ['Book a Decaying Humorist'], ['Spread the seeds'],
  ['‘Obtain’ licences from the Ministry of Public Decency']]
  .map(([n, s]) => api.mhBadgeText(row(n, s))),
  ['Tales +2? · Brass ×102', '−8 CP? · Jade ×200', 'Tales 12 · Song +1 CP', '−14 CP · Tomb-Colonies ×1',
    '−20 CP · 3 menaces, 2 factions ▼', 'Tales +2? · Inklings ×30 ▼']);

// Friday's "reward" is a menace, so it must not read as a count of items.
check('a change-point figure is printed as itself, not as a number of items',
  api.mhPay([['Plagued by a Popular Song', '+1 CP'], ['Moon-Pearl', 200]], false),
  'Song +1 CP Pearls ×200');

check('the four rows that raise menaces whatever happens say so in words instead of a figure',
  api.MH_ODD.filter((e) => /menaces/.test(e.label || '')).map((e) => e.name),
  ['Take to the stage, a strange hunger in your belly', 'Spread the seeds',
    'Indulge your hunger. Sabotage Peppercorn', 'Ask her to sing Pop Goes The Weasel']);

check('the guide\'s two figures for Smoke and mirrors are both in its tooltip',
  ['×226', '×113'].map((n) => api.mhSpec(row('Smoke and mirrors')).title.includes(n)), [true, true]);

check('a day storylet\'s heading names the day, the Tales and the show\'s own reward',
  ['Light Entertainment!', 'The EXOTIC and DELIGHTFUL Kashmiri Princess', 'Variety is the spice of life!',
    'The weekly variety bill!'].map((s) => api.mhStoryletSpec(key(s)).text),
  ['Monday · Tales 8 · Inklings ×3', 'Sunday · Tales 14 · Secrets ×4', 'build', 'cash out']);

check('the registered pass',
  (() => {
    const hypnotist = makeHeading('Assist a hypnotist');
    const backstage = makeHeading('Take a backstage role');
    branches = [hypnotist, backstage];
    roots = [makeHeading('The mystic arts')];
    api.mhRatings();
    const out = [text(roots[0], api.MH_CLASS), text(hypnotist, api.MH_BRANCH_CLASS),
      text(backstage, api.MH_BRANCH_CLASS)];
    roots = [makeHeading('Light Entertainment!')];
    api.mhRatings();
    out.push(text(roots[0], api.MH_CLASS), text(hypnotist, api.MH_BRANCH_CLASS),
      text(backstage, api.MH_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['build', 'Tales +1? · Diamonds ×1 Pearls ×91', null,
    'Monday · Tales 8 · Inklings ×3', null, '−8 CP? · Jade ×200']);

check('no Mahogany Hall name is in another feature\'s table',
  (() => { const others = otherNames('MH_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'mahogany-hall'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
