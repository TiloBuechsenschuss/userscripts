// Ad-hoc test for FallenLondon/choice-helper.js's Following up Rumours of
// Cornelius badges ('cornelius').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that the badge names the LEVEL a rung leaves the
// quality at rather than the small change it pays, since the level is what
// decides whether the next rung exists; that the deciphering rung is a cap
// rather than a jump and says so differently; that the vote's three titles are
// one row with the Bridge Troubles suffixes as aliases, because without them
// the most important line in the guide goes unbadged; and that this feature
// and `railway-board` share the Board's storylet without sharing an option.
//
// Numbers come from Following up Rumours of Cornelius (Guide) and the option
// pages on fallenlondon.wiki, fetched through the API on 2026-09-21.
//
//   node FallenLondon/test/choice-cornelius.test.mjs

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
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null
    ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS', 'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS', 'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS', 'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS', 'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS', 'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS', 'PB_OPTIONS', 'CH_OPTIONS', 'LH_OPTIONS', 'MX_OPTIONS', 'MG_OPTIONS', 'KA_OPTIONS', 'AS_OPTIONS', 'CN_OPTIONS', 'CHW_OPTIONS', 'HR_OPTIONS', 'CCM_OPTIONS', 'DH_OPTIONS', 'MR_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CN_OPTIONS, CN_INDEX, CN_EVENLODE, CN_CONVENE, CN_STORYLETS, CN_VOTE_AT, CN_CAP, CN_CLASS, CN_BRANCH_CLASS, cnBadgeText, cnSpec, cnStoryletSpec, cnRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.CN_OPTIONS;
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

check('no Cornelius name is in another feature\u2019s table',
  (() => {
    const others = otherNames('CN_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);

// The ladder, in the order the guide climbs it.
check('the rungs and the levels they leave you at',
  rows.filter((e) => e.sets != null).map((e) => [e.name, e.sets]),
  [['Ask the local opinion of Furnace Ancona', 1],
    ['Demonstrate your commitment to the Prehistoricists, then ask about Furnace Ancona', 1],
    ['Follow up what you\u2019ve learned of Cornelius', 2],
    ['Keep investigating this question of Cornelius', 3],
    ['Plans for the Neath', 8],
    ['Track down Cornelius', 9],
    ['Track down Cornelius', 9],
    ['Appoint Cornelius in Furnace\u2019s place', 10]]);

check('the vote wants 7 and the quality stops at 8', [api.CN_VOTE_AT, api.CN_CAP], [7, 8]);

// A jump and a cap are different claims and read differently.
check('a jump says \u2192 and the cap says +1 to',
  ['Follow up what you\u2019ve learned of Cornelius', 'Plans for the Neath'].map((n) => api.cnBadgeText(row(n))),
  ['Cornelius \u2192 2 ?', 'Cornelius +1 to 8']);

// Bridge Troubles rewrites this title, and a title the table does not carry
// goes unbadged.
check('the vote is matched under all three of its titles',
  ['Appoint Cornelius in Furnace\u2019s place',
    'Appoint Cornelius in Furnace\u2019s place \u2013 until you find someone better',
    'Appoint Cornelius in Furnace\u2019s place \u2013 until the moment you recover Furnace']
    .map((n) => {
      const e = api.carouselLookup(api.CN_INDEX, n, key(api.CN_CONVENE));
      return e && e.sets;
    }), [10, 10, 10]);

// Two options wear one title in two different places, and each is one row.
check('the two Track down Cornelius rows sit under different storylets',
  rows.filter((e) => e.name === 'Track down Cornelius').map((e) => e.storylet),
  ['Plans and plots', 'The Next Stretch of Track']);

check('both of them say that a second option wears the same title',
  rows.filter((e) => e.name === 'Track down Cornelius')
    .every((e) => /Two options wear this title/.test(e.note)), true);

// The Board's storylet carries two features; neither may answer for the other.
check('the Board storylet is shared with railway-board and no option is',
  (() => {
    const mine = rows.filter((e) => e.storylet === api.CN_CONVENE).map((e) => key(e.name));
    const theirs = api.RB_OPTIONS.filter((e) => e.storylet === api.CN_CONVENE).map((e) => key(e.name));
    return [mine.length > 0, theirs.length > 0, mine.filter((n) => theirs.includes(n))];
  })(), [true, true, []]);

check('every rung with a challenge marks it, and every one without does not',
  rows.filter((e) => e.sets != null)
    .map((e) => api.cnBadgeText(e).includes('?') === !!e.ch).every(Boolean), true);

check('the heading', api.cnStoryletSpec(key(api.CN_EVENLODE)).text,
  'Cornelius \u00b7 7 to put him in the chair');

check('the registered pass: the Evenlode heading and two of its rungs',
  (() => {
    const open = makeHeading(api.CN_EVENLODE, 'storylet-root__heading');
    const first = makeHeading('Ask the local opinion of Furnace Ancona');
    const third = makeHeading('Keep investigating this question of Cornelius');
    roots = [open];
    branches = [first, third];
    api.cnRatings();
    const out = [text(open, api.CN_CLASS), text(first, api.CN_BRANCH_CLASS), text(third, api.CN_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['Cornelius \u00b7 7 to put him in the chair', 'Cornelius \u2192 1 ?', 'Cornelius \u2192 3 ?']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'cornelius'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
