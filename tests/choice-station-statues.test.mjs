// Ad-hoc test for FallenLondon/choice-helper.js's Station Statues feature ('station-statues') on the
// shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The 53 statues the guide lists, by station, and every rating the guide gives, one by one,
//    and that a rating reads N/4 (a range as 2-3/4) so it does not depend on colour.
//  - What a card option takes and gives, that its tooltip names the statue, the rating and the
//    value, and that the two Church statues at Jericho, which share an option title, are one entry.
//  - The sketching option on all seven cards, matched through the (subject) placeholder, and the
//    Fate cost of removing a statue (3 at Station VIII, 10 elsewhere).
//  - A statue built from an Offices branch is badged there while the heading stays Station
//    Developments', the same title on two cards is told apart by the open card, and the
//    Under the Statue cards are badged once, in the hand and opened.
//  - That no option is filed under the same storylet in another feature's table.
//
// Options come from the card and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-26, with Statues at the GHR Stations (Guide) as the cross-check.
//
//   node tests/choice-station-statues.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
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
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
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
let list = [];
let branches = [];
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
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

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { CAROUSEL_COLOR_NEUTRAL, pqSpec, pqStoryletSpec, ST_CFG, ST_OPTIONS, ST_INDEX, ST_DEF, stRatings, SD_EG, SD_JL, SD_EV, SD_BA, SD_BI, SD_MO,'
    + ' SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, HW_OPTIONS, RBG_OPTIONS, SD_OPTIONS, TLC_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const key = api.normalizeName;
const OFFICES = 'Offices of the Tracklayer’s Union: ';
const opt = (card, name) => api.ST_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const label = (card, name) => api.pqSpec(opt(card, name), api.ST_CFG).text;
const title = (card, name) => api.pqSpec(opt(card, name), api.ST_CFG).title;
const builds = api.ST_OPTIONS.filter((e) => /^(Put up|Install) /.test(e.name));

check('every entry names its storylet and option and has a badge and a tooltip, and none repeats',
  [api.ST_OPTIONS.every((e) => e.storylet && e.name && e.label && e.title),
    new Set(api.ST_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.ST_OPTIONS.length],
  [true, true]);

check('the guide’s 53 statues are all there: 6 at Ealing, 4 Jericho, 3 Magistracy, 3 Balmoral, 14 Station VIII, 5 Burrow, 4 Moulin, 8 Hurlers, 6 Marigold',
  (() => {
    const at = (s) => builds.filter((e) => key(e.storylet) === key(s)).length;
    return [builds.length, at(api.SD_EG), at(api.SD_JL), at(api.SD_EV), at(api.SD_BA), at('A Selection of Statues'),
      at(api.SD_BI), at(api.SD_MO), at('Commissioning a Statue'), at('Consider building a statue at Marigold Station')];
  })(), [53, 6, 4, 3, 3, 14, 5, 4, 8, 6]);

check('the guide’s ratings, one by one',
  (() => {
    const want = {
      'Put up a statue honouring Sinning Jenny, former Mayor and current Board Member': '3',
      'Put up a statue honouring Feducci, former Mayor and current Board Member': '2',
      'Put up a statue honouring the Jovial Contrarian, former Mayor and current Board Member': '3',
      'Put up a statue honouring Virginia, former Mayor and current Board Member': '2–3',
      'Put up a statue honouring the Tentacled Entrepreneur': '2',
      'Install a statue to the current Poet-Laureate': '1',
      'Put up a statue honouring the Dean of Xenotheology': '2',
      'Put up a statue honouring the Bishop of Southwark': '3',
      'Put up a statue honouring the Bishop of Saint Fiacre’s': '4',
      'Put up a statue honouring yourself, Pre-eminent Scholar of the Correspondence': '1–2',
      'Put up a statue honouring the Gracious Widow': '2–3',
      'Put up a statue in honour of the Clay Highwayman': '3–4',
      'Put up a statue honouring the Defender of Public Safety, which is yourself': '2–3',
      'Put up a statue honouring St. Augustine of Canterbury': '1',
      'Put up a statue honouring St. Hildegard of Bingen': '1',
      'Put up a statue honouring your Custom-Made Saint': '1–2',
      'Put up a sculptural memento mori – in the form of a statue of yourself': '3–4',
      'Put up a statue honouring the Bishop of Watchmaker’s Hill, that is, Yourself': '1',
      'Put up a statue honouring a Legendary Zee-Captain, that is, Yourself': '3',
      'Put up a statue honouring London’s Ambassador to the Khanate, that is, Yourself': '2–3',
      'Put up a statue of Clio, the Muse of History': '3',
      'Put up a statue honouring Moulin’s preeminent Archaeologist, that is, yourself': '3',
      'Put up a statue honouring the Liberation of Night': '2–3',
      'Put up a statue honouring the Fingerkings': '3',
      'Put up a statue honouring the Anchoress': '3',
      'Put up a statue honouring Goat-Demons': '3–4',
      'Put up a statue honouring your Overgoat': '3–4',
      'Put up a statue honouring your Übergoat': '3–4',
      'Put up a statue honouring your Heptagoat': '1',
      'Put up a statue honouring yourself, a Steward of the Discordance': '1–2',
      'Put up a statue honouring the Marigold Devils': '1–2',
      'Put up a statue honouring yourself, a Respectable Industrialist': '1',
    };
    const got = {};
    builds.forEach((e) => { if (e.rate) got[e.name] = e.rate; });
    const mism = Object.keys(want).filter((n) => got[n] !== want[n]);
    return [mism, Object.keys(got).length - Object.keys(want).length];
  })(), [[], 4]);

check('a rating shows as N/4 on the badge and the text form of a range survives without colour',
  [label(api.SD_JL, 'Put up a statue honouring the Bishop of Saint Fiacre’s'),
    label(api.SD_EG, 'Put up a statue honouring Virginia, former Mayor and current Board Member'),
    label('A Selection of Statues', 'Put up a statue honouring Mr Fires'),
    label(api.SD_BA, 'Put up a statue in honour of the Empress’ Consort')],
  ['rated 4/4 · Church ×4 → 30 E', 'rated 2–3/4 · Hell ×2 → 12.5–20 E', 'no reward · looks only', 'no reward · counts for all statues']);

check('a card option says what it takes and gives, and its tooltip names the statue, its rating and the value',
  [label('Under the Statue', 'Call in favours from Urchins'),
    /the statue of Sinning Jenny/.test(title('Under the Statue', 'Call in favours from Urchins')),
    /rates the statue 3 of 4/.test(title('Under the Statue', 'Call in favours from Urchins')),
    /values the reward at 28.5 Echoes/.test(title('Under the Statue', 'Call in favours from Urchins')),
    label('Under the Statue at the Hurlers', 'Call in favours from Hell'),
    label('Under the Statue', 'Call in favours from Hell')],
  ['Urchins ×4 ▼ → Puzzle-Damask Scrap ×1 +2 more', true, true, true, 'Hell ×4 ▼ → Nightsoil ×60', 'Hell ×2 ▼ → Muscaria Brandy ×8, or Brass Ring ×1']);

check('the two Church statues at Jericho are one entry, since both pages carry one title',
  [api.ST_OPTIONS.filter((e) => key(e.storylet) === key('Under the Statue at Jericho Locks') && key(e.name) === key('Call in favours from the Church')).length,
    /Two pages carry this title/.test(title('Under the Statue at Jericho Locks', 'Call in favours from the Church'))],
  [1, true]);

check('the sketching option is on seven cards, in the game’s wording, and Station VIII’s says why it is easier in the dark',
  [api.ST_OPTIONS.filter((e) => e.name === 'Practice sketching the Statue to (subject)').length,
    api.ST_INDEX.some((r) => r.matches(key('Practice sketching the Statue to Sinning Jenny')) && r.storylet === key('Under the Statue')),
    /250 minus 10 a point of Station VIII: Darkness/.test(title('Under the Statue at Station VIII', 'Practice sketching the Statue to (subject)'))],
  [7, true, true]);

check('removing a statue costs Fate, 3 at Station VIII and 10 elsewhere, and the melted wording of the Hurlers is found',
  [label('Under the Statue at Station VIII', 'Have this statue removed'),
    label('Under the Statue', 'Have this statue removed'),
    api.ST_INDEX.some((r) => r.matches(key('Have this statue melted (10 FATE)')) && r.storylet === key('Under the Statue at the Hurlers'))],
  ['Fate 3 → statue removed', 'Fate 10 → statue removed', true]);

check('a statue built from an Offices branch is badged there, and the heading stays Station Developments’',
  (() => {
    const head = makeHeading(api.SD_EG);
    const good = makeHeading('Put up a statue honouring Feducci, former Mayor and current Board Member');
    roots = [head];
    branches = [good];
    api.stRatings();
    const b = badgeOf(good, api.ST_DEF.branchCls);
    const out = [badgeOf(head, api.ST_DEF.cls), b && b.textContent];
    roots = [];
    branches = [];
    return out;
  })(), [null, 'rated 2/4 · Tomb-Colonies ×2 → 18 E']);

check('the storylets of Station VIII, the Hurlers and Marigold are headed and their options badged',
  (() => {
    const out = [];
    ['A Selection of Statues', 'Commissioning a Statue', 'Consider building a statue at Marigold Station'].forEach((n) => {
      const head = makeHeading(n);
      roots = [head];
      api.stRatings();
      const b = badgeOf(head, api.ST_DEF.cls);
      out.push(b && b.textContent);
      roots = [];
    });
    return out;
  })(), ['statues', 'statues', 'statues']);

check('the same option title on two cards is told apart by the open card, and a stray title gets nothing',
  (() => {
    const t = (h) => { const b = badgeOf(h, api.ST_DEF.branchCls); return b && b.textContent; };
    const out = [];
    [['Under the Statue', 'Call in favours from Hell'], ['Under the Statue at the Hurlers', 'Call in favours from Hell'],
      ['Under the Statue at Moulin', 'Call in favours from Hell']].forEach(([card, name]) => {
      const head = makeHeading(card);
      const o = makeHeading(name);
      roots = [head];
      branches = [o];
      api.stRatings();
      out.push(t(o));
      roots = [];
      branches = [];
    });
    return out;
  })(), ['Hell ×2 ▼ → Muscaria Brandy ×8, or Brass Ring ×1', 'Hell ×4 ▼ → Nightsoil ×60', null]);

check('each Under the Statue card is badged in the hand and once when opened, and no other card is',
  (() => {
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    const card = makeHeading('Under the Statue at Moulin');
    const other = makeHeading('A drunk');
    hand = [card, other];
    api.stRatings();
    const out = [t(card, api.ST_DEF.cardCls), t(other, api.ST_DEF.cardCls)];
    hand = [];
    const head = makeHeading('Under the Statue at Moulin');
    roots = [head];
    api.stRatings();
    out.push(t(head, api.ST_DEF.cardCls), t(head, api.ST_DEF.cls));
    roots = [];
    return out;
  })(), ['statue rewards', null, 'statue rewards', null]);

check('no option is filed under the same storylet in another feature’s table',
  (() => {
    const mine = api.ST_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS, ...api.TLC_OPTIONS].map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'station-statues'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
