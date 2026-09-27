// Ad-hoc test for FallenLondon/choice-helper.js's Upon a Red Stage badges
// ('upon-a-red-stage').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node
// script: evaluates the userscript's IIFE against a stub DOM and pulls out
// the internals.
//
// What's worth pinning here: the badge shows the SUCCESS value marked `?`
// (this repo has no mechanism to read a live success chance -- no computed
// expected value is fabricated), the Finale table's success/failure menace
// columns are NOT mirrored (a Dangerous-check row gives Wounds on success and
// Nightmares on failure; a Persuasive-check row the reverse -- a shared
// "menace" bucket would silently flip this), the ten Hazard cards all pay the
// identical flat 650/250 SA and never receive a fabricated "best" ranking,
// generic option names ("Rule", "Plot", "Yearn") only badge while their own
// storylet is open, and no name collides with another feature's table.
//
// Numbers come from Upon a Red Stage (Guide) on fallenlondon.wiki, fetched
// through the API on 2026-09-27, spot-checked against the option page for
// "Usurp the role of King" (exact match) -- see
// docs/superpowers/research/2026-09-27-late-firmament.md section 1.
//
//   node tests/choice-red-stage.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null, attrs: {},
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
      const m = /^([a-z]+)?(?:\.([\w-]+))?$/.exec(sel);
      return this.children.find((c) => (!m[1] || c.tagName === m[1].toUpperCase())
        && (!m[2] || String(c.className).split(/\s+/).includes(m[2]))) || null;
    },
    getAttribute(k) { return this.attrs[k] ?? null; },
    setAttribute(k, v) { this.attrs[k] = v; },
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

function makeHandCard(name) {
  const container = makeEl('div');
  container.className = 'hand__card-container';
  const img = makeEl('img');
  img.className = 'hand__image';
  img.setAttribute('alt', name);
  container.appendChild(img);
  return container;
}

let roots = [];
let branches = [];
let handCards = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
    if (sel === '.branch__title') return branches;
    if (sel === '.hand__card-container') return handCards;
    if (sel === '.hand .small-card__body .media__heading') return [];
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
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'AOL_OPTIONS', 'ECDYSIS_OPTIONS',
  'MIDNIGHT_TRADE_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { RED_STAGE_MAIN, RED_STAGE_FINALE, RED_STAGE_HAZARD, redStageSpec, redStageFinaleSpec,'
    + ' redStageRatings, RED_STAGE_CLASS, RED_STAGE_BRANCH_CLASS, RED_STAGE_CARD_CLASS, ' + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, HIGH_SANCTA_CARDS, MOON_MISER_RISKY, MOON_MISER_GOLD,'
    + ' SOUS_BONES, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const mainRow = (name) => api.RED_STAGE_MAIN.find((e) => e.name === name);
const finaleRow = (name) => api.RED_STAGE_FINALE.find((e) => e.name === name);
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function allNames() {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...api.HIGH_SANCTA_CARDS.map((c) => c.name),
    ...api.MOON_MISER_RISKY.flatMap((e) => [e.card, e.option]), ...api.MOON_MISER_GOLD.map((e) => e.name),
    ...api.SOUS_BONES.map((e) => e.name),
    ...TABLES.flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key);
}

check('28 main-table rows, 6 finale rows (3 "Usurp" rows, one per role, stay distinct; "Resist the '
    + 'temptation of bloodshed"/"Deliver a final epilogue"/"Abandon your part" collapse from 3 '
    + 'role-copies each to 1 -- the option text is IDENTICAL across roles, and carouselLookup '
    + 'refuses an ambiguous match, so 3 identically-named rows would leave all of them dead), '
    + '10 hazard cards',
  [api.RED_STAGE_MAIN.length, api.RED_STAGE_FINALE.length, api.RED_STAGE_HAZARD.length,
    new Set(api.RED_STAGE_FINALE.map((e) => e.name)).size],
  [28, 6, 10, 6]);

check('a spot-checked main row exactly matches the option page',
  (() => { const e = mainRow('Usurp the role of King'); return e ? null : 'not in main table (expected: finale only)'; })(),
  'not in main table (expected: finale only)');

check('the spot-checked finale row (Usurp the role of King) matches the option page exactly',
  (() => { const e = finaleRow('Usurp the role of King');
    return [e.ch.stat, e.ch.diff, e.succSA, e.succMenace, e.failSA, e.failMenace]; })(),
  ['Dangerous', 320, 675, ['Wounds', 3], 220, ['Nightmares', 4]]);

check('badge text shows the SUCCESS value marked `?`, never a fabricated expected value',
  api.redStageSpec(mainRow('Exposit')), { text: '400 SA?', color: '#8a6420', title: api.redStageSpec(mainRow('Exposit')).title });

check('Finale success/failure menace are NOT mirrored -- a Dangerous row gives Wounds on success, '
    + 'Nightmares on failure; the reverse for the matching Persuasive row',
  (() => {
    const usurpKing = finaleRow('Usurp the role of King');
    const epilogue = finaleRow('Deliver a final epilogue');
    return [usurpKing.succMenace[0], usurpKing.failMenace[0], epilogue.succMenace[0], epilogue.failMenace[0]];
  })(),
  ['Wounds', 'Nightmares', 'Nightmares', 'Wounds']);

check('every finale row can actually be looked up through carouselLookup\'s real matching path '
    + '(not just the spec function called directly) -- this is what would have caught the dead '
    + 'duplicate-name rows before the fix',
  (() => {
    const out = [];
    ['Usurp the role of King', 'Resist the temptation of bloodshed', 'Deliver a final epilogue', 'Abandon your part']
      .forEach((n) => {
        const h = makeHeading(n);
        branches = [h];
        roots = [makeHeading('Catastrophe: An Ending')];
        api.redStageRatings();
        out.push(text(h, api.RED_STAGE_BRANCH_CLASS) !== null);
        roots = []; branches = [];
      });
    return out;
  })(),
  [true, true, true, true]);

check('a finale badge names both menaces, never a shared bucket',
  api.redStageFinaleSpec(finaleRow('Usurp the role of King')).text, '675 SA? ▲Wounds+3');

check('all 10 Hazard cards pay the identical flat 650/250 SA and carry no computed ranking',
  [new Set(api.RED_STAGE_HAZARD.map((e) => e.name)).size, api.RED_STAGE_HAZARD.every((e) => e.stat)],
  [10, true]);

check('an opened Hazard card badges via its own class, and a second scan does not redraw or clear it '
    + '(the carousel storylet-loop and the card loop must use DIFFERENT classes, or the storylet-'
    + 'loop\'s null spec clears what the card loop just drew, and the card loop redraws it every '
    + 'scan forever -- a real infinite-rescan bug this pins)',
  (() => {
    const opened = makeHeading('Intermission: A Flash of Bone');
    // The opened Hazard card renders as a `.storylet-root__heading`, same as any opened card;
    // eachCardName inserts its badge with `after()`, as a sibling, not a child.
    roots = [opened];
    branches = [];
    api.redStageRatings();
    const firstBadge = badgeOf(opened, api.RED_STAGE_CARD_CLASS);
    api.redStageRatings();
    const secondBadge = badgeOf(opened, api.RED_STAGE_CARD_CLASS);
    roots = [];
    // Same node, not a new one -- attachBadge's own idempotency guard took the
    // early return on the second call, which is only possible if nothing
    // upstream (the storylet-loop's null spec) wrote a conflicting dataset
    // value for the SAME class first.
    return [firstBadge !== null, firstBadge === secondBadge];
  })(),
  [true, true]);

check('the (Role) and (Character) placeholders match, so "Embody the role of the (Role)" and '
    + '"Exploit the (Character)\'s hamartia" can badge at all',
  (() => {
    const embody = makeHeading('Embody the role of the King');
    const exploit = makeHeading("Exploit the Duchess's hamartia");
    branches = [embody, exploit];
    roots = [makeHeading('On a Red, Red Stage')];
    api.redStageRatings();
    const out = [text(embody, api.RED_STAGE_BRANCH_CLASS) !== null, text(exploit, api.RED_STAGE_BRANCH_CLASS) !== null];
    roots = []; branches = [];
    return out;
  })(),
  [true, true]);

check('wiring: a generic option name ("Rule") only badges while "On a Red, Red Stage" is open',
  (() => {
    const rule = makeHeading('Rule');
    branches = [rule];
    const out = [];
    roots = [makeHeading('On a Red, Red Stage')];
    api.redStageRatings();
    out.push(text(rule, api.RED_STAGE_BRANCH_CLASS));
    roots = [makeHeading('Some Other Storylet')];
    api.redStageRatings();
    out.push(text(rule, api.RED_STAGE_BRANCH_CLASS));
    roots = []; branches = [];
    return out;
  })(),
  ['500 SA?', null]);

check('wiring: a Finale option only badges under "Catastrophe: An Ending"',
  (() => {
    const usurp = makeHeading('Usurp the role of King');
    branches = [usurp];
    roots = [makeHeading('Catastrophe: An Ending')];
    api.redStageRatings();
    const out = text(usurp, api.RED_STAGE_BRANCH_CLASS);
    roots = []; branches = [];
    return out;
  })(),
  '675 SA? ▲Wounds+3');

check('no Red Stage name is in another feature\'s table',
  (() => {
    const own = [...api.RED_STAGE_MAIN.map((e) => e.name), ...api.RED_STAGE_FINALE.map((e) => e.name),
      ...api.RED_STAGE_HAZARD.map((e) => e.name)].map(key);
    const others = allNames();
    return own.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'upon-a-red-stage'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
