// Ad-hoc test for FallenLondon/choice-helper.js's Brawling with Dockers badges
// ('brawling-dockers').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: every variable reward's stated cap against the
// Brawl it is reached at (cap = 25 × (that Brawl − the threshold)), which is
// the cross-check on fourteen transcribed numbers; the guide's "the special
// attack is no harder than the plain fight from about 83"; that a lone fighter
// out-earns a group on every fighting option; and that the side is read off the
// reward titles on screen, and both figures shown until one is.
//
// Numbers come from Brawling with Dockers (Guide) and the option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-brawling-dockers.test.mjs

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS', 'BRAWL_OPTIONS', 'SKEL_OPTIONS',
  'PROF_OPTIONS', 'HG_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { BRAWL_FIGHTS, BRAWL_REWARDS, BRAWL_PER_POINT, BRAWL_CLASS, BRAWL_BRANCH_CLASS, brawlDiffAt, brawlSide, brawlSpec, brawlRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.BRAWL_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);

check('every variable reward\'s cap is 25 a point from its threshold to the Brawl it is reached at',
  api.BRAWL_REWARDS.filter((r) => r.variable).flatMap((r) => [0, 1]
    .filter((i) => r.variable.cap[i] !== api.BRAWL_PER_POINT * (r.variable.capAt[i] - r.at[i]))
    .map((i) => r.alone + ' ' + i)), []);

check('the special attacks are no harder than the plain fight from Brawl 84, as the guide says',
  [84, 83].map((b) => api.brawlDiffAt(row('Swing from that rope overhead!').ch, b, false)
    <= api.brawlDiffAt(row('Fight without taking your eye off the goods!').ch, b, false)), [true, false]);

check('alone pays at least as much on every fighting option, and a group\'s threshold is lower on every reward',
  [api.BRAWL_FIGHTS.filter((f) => f.win[1] < f.win[0]).map((f) => f.name),
    api.BRAWL_REWARDS.filter((r) => r.at[0] >= r.at[1]).map((r) => r.group)], [[], []]);

check('the side is read off the reward titles',
  [api.brawlSide(['Claim the coffer of Admiralty coinage']), api.brawlSide(['Accept a share of the extremely dusty crates']),
    api.brawlSide(['Fight without taking your eye off the goods!'])], ['alone', 'group', null]);

check('badges with the side unknown, alone, and for a group',
  [api.brawlSpec(row('Swing from that rope overhead!'), null).text, api.brawlSpec(row('Swing from that rope overhead!'), 'alone').text,
    api.brawlSpec(row('Fight without taking your eye off the goods!'), 'group').text,
    api.brawlSpec(row('Accept a share of the coffer of Admiralty maps'), null).text,
    api.brawlSpec(row('Claim the extremely dusty crates'), null).text],
  ['Brawl +13/+15? / −4/−5', 'Brawl +15? / −5', 'Brawl +9?', '90 → Maps · Rostygold ×25/pt to 100', '150 → Biscuits']);

check('the registered pass reads the side from a reward on screen',
  (() => {
    const fight = makeHeading('Deploy that barrel of gunpowder!');
    const reward = makeHeading('Claim the coffer of Admiralty coinage');
    branches = [fight, reward];
    roots = [makeHeading('Intervene in a Dockers’ Brawl')];
    api.brawlRatings();
    const out = [text(roots[0], api.BRAWL_CLASS), text(fight, api.BRAWL_BRANCH_CLASS), text(reward, api.BRAWL_BRANCH_CLASS)];
    branches = [fight];
    api.brawlRatings();
    out.push(text(fight, api.BRAWL_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['brawl', 'Brawl +15? / −5', '20 → Coin · Rostygold ×25/pt to 150', 'Brawl +13/+15? / −4/−5']);

check('no brawl option name is in another feature\'s table',
  (() => { const others = otherNames('BRAWL_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'brawling-dockers'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
