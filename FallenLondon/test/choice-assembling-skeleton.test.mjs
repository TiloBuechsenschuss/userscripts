// Ad-hoc test for FallenLondon/choice-helper.js's Assembling a Skeleton badges
// ('assembling-skeleton').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that Implausibility is only ever a failure's (every
// row carries it as [failure, success] with the success lower), the three rows
// where the option page overrules the guide's table, that exactly the buyers the
// guide files under Bone Market Exhaustion are marked "exhausts" and pay their
// secondary reward by multiplying, and that "(skeleton type)" matches the
// description the game puts at the end of a bone's title.
//
// Numbers come from Assembling a Skeleton (Guide)/Bones and /Buyers and every
// bone's option page on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-assembling-skeleton.test.mjs

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
    'return { SKEL_BONES, SKEL_BUYERS, SKEL_CLASS, SKEL_BRANCH_CLASS, skelSpec, skelRatings, factionText, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const bones = api.SKEL_BONES;
const buyers = api.SKEL_BUYERS;
const row = (name) => api.SKEL_OPTIONS.find((e) => e.name === name);

check('Implausibility is a failure\'s, never more on a success than on a failure',
  bones.flatMap((e) => e.attrs.filter((a) => a[0] === 'Implausibility' && a[2] > a[1]).map(() => e.name)), []);

check('the option page overrules the guide\'s table on exactly three pennies, and says so',
  bones.filter((e) => e.guide).map((e) => [e.name, e.value, e.guide]),
  [['Apply a Knotted Humerus to your (skeleton type)', 300, '10 pennies'],
    ['Apply a Devourer’s Thighbone to your (skeleton type)', 625, '650 pennies'],
    ['Put a Withered Tentacle on your (skeleton type)', 250, '50 pennies'],
    ['Apply a Withered Tentacle as a tail on your (skeleton type)', 250, '50–250 pennies']]);

check('exactly the multiplying buyers exhaust',
  buyers.map((e) => [e.name, e.exhausts, /[×²]/.test(e.scales || '') && !/^5 ×/.test(e.scales)]).filter((r) => r[1] !== r[2]),
  []);

check('the Implausibility factor is 75 on every exhausting buyer', [...new Set(buyers.filter((e) => e.exhausts)
  .map((e) => e.implausibility))], [75]);

check('badges', ['Affix a Horned Skull to your (skeleton type)', 'Apply Plaster Tail Bones to your (skeleton type)',
  'Build on the Leviathan Frame', 'Sell to Mrs Plenty', 'Sell to a Teller of Terrors'].map((n) => api.skelSpec(row(n)).text),
['1250p · Antiquity +1 · Menace +1–2?', '250p · Implausibility +1–4?', '31250p · Antiquity +1 · Menace +1',
  'Scrip p÷50 · Pies × Menace', 'Morelways p÷10 · Feathers × 4 × Menace² · exhausts']);

check('the tooltip says which way a range runs',
  api.skelSpec(row('Affix a Horned Skull to your (skeleton type)')).title.includes('Menace: +2 on a success, +1 on a failure.'),
  true);

check('the registered pass: a bone found under the skeleton\'s own description',
  (() => {
    const bone = makeHeading('Affix a Horned Skull to your Menacing Primate');
    const buyer = makeHeading('Sell to a Naive Collector');
    branches = [bone, buyer];
    roots = [makeHeading('Assemble a Skeleton')];
    api.skelRatings();
    const out = [text(roots[0], api.SKEL_CLASS), text(bone, api.SKEL_BRANCH_CLASS), text(buyer, api.SKEL_BRANCH_CLASS)];
    roots = [makeHeading('Seeking Buyers')];
    api.skelRatings();
    out.push(text(bone, api.SKEL_BRANCH_CLASS), text(buyer, api.SKEL_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['build', '1250p · Antiquity +1 · Menace +1–2?', null, null, 'Bombazine p÷250']);

check('no skeleton option name is in another feature\'s table',
  (() => { const others = otherNames('SKEL_OPTIONS');
    return [...new Set(api.SKEL_OPTIONS.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'assembling-skeleton'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
