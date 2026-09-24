// Ad-hoc test for FallenLondon/choice-helper.js's Riding the Savage Cobbles
// badges ('savage-cobbles').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the guide's two cross-checks -- 14 actions to
// level 7 at full success, and "Dangerous 209" as the level that makes every
// patrol certain -- then the conclusions' Echo values, which is what the badge
// quotes, and that a patrol badge is only drawn inside its own storylet.
//
// Numbers come from Riding the Savage Cobbles (Guide) and the storylet and
// option pages on fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node tests/choice-savage-cobbles.test.mjs

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
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { RSC_STORYLETS, RSC_LOW, RSC_MID, RSC_CLASS, RSC_BRANCH_CLASS, rscSpec, rscRatings, broadCertainAt, posiBadgeText, carouselHandSpec, '
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
const rows = api.RSC_OPTIONS;
const row = (name) => rows.find((e) => e.name === name);

// Level 7 is 1 + 2 + … + 7 = 28 CP, which the best patrol makes 2 CP at a time.
check('14 actions to level 7 at full success, as the guide says',
  28 / Math.max(...rows.filter((e) => e.win && e.ch).map((e) => e.win[0][1])), 14);

check('Dangerous 209 makes every Dangerous patrol certain, as the guide says',
  Math.max(...rows.filter((e) => e.win && e.ch && e.ch.stat === 'Dangerous').map((e) => api.broadCertainAt(e.ch.diff))), 209);

check('the conclusions\' Echo values are the guide\'s',
  rows.filter((e) => e.pays).map((e) => [e.pays.worth, e.pays.failWorth == null ? null : e.pays.failWorth]),
  [[17.5, 7.5], [17.5, 9.5], [18.5, 9.6], [18.5, 9.5], [18, null]]);

check('eight patrol storylets, four at 0–4 and four at 5–6',
  [api.RSC_LOW.length, api.RSC_MID.length, [...api.RSC_LOW, ...api.RSC_MID].every((s) => api.RSC_STORYLETS.includes(s))],
  [4, 4, true]);

check('badges', ['Into the street with bottle and truncheon', 'Have a little word', 'Walk away', 'Go and crack some heads',
  'BLEF! BLEF!', 'Turn a blind eye'].map((n) => api.rscSpec(row(n)).text),
['Cobbles +2 CP? / +1', 'Cobbles +1 CP', 'Cobbles −2 CP', 'Rifles · 17.5? / 7.5', 'Documents ×36 · 18',
  'Dangerous +5 CP · keeps Cobbles']);

check('a failure\'s menace is in the tooltip',
  [api.rscSpec(row('Run to the scene!')).title.includes('Failure: Riding the Savage Cobbles +1 CP, Nightmares +1 CP.'),
    api.rscSpec(row('Keep a quiet dignity')).title.includes('Proscribed Material ×240, Wounds +2 CP')],
  [true, true]);

check('the registered pass',
  (() => {
    const option = makeHeading('Get to it');
    branches = [option];
    roots = [makeHeading('Foil a Robbery')];
    api.rscRatings();
    const out = [text(roots[0], api.RSC_CLASS), text(option, api.RSC_BRANCH_CLASS)];
    roots = [makeHeading('Messenger Duty')];
    api.rscRatings();
    out.push(text(roots[0], api.RSC_CLASS), text(option, api.RSC_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['Cobbles 0–4', 'Cobbles +2 CP? / +1', 'Cobbles 0–4', null]);

check('no Savage Cobbles option name is in another feature\'s table',
  (() => { const others = otherNames('RSC_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Savage Cobbles storylet is another feature\'s',
  (() => { const others = otherStorylets('RSC_OPTIONS');
    return api.RSC_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'savage-cobbles'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
