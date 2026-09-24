// Ad-hoc test for FallenLondon/choice-helper.js's Airs of London feature ('airs-of-london'):
// the six London storylets whose options are gated on The Airs of London, and the storylets
// their redirecting options open.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan()
// finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The table's shape: every window is inside 0-100, every item a success gives or spends has
//    a Bazaar price (or is the Honey-Dens' Cross-economy pair), every redirect opens a storylet
//    that holds options.
//  - That the windows do what the pages say: each of the four-way splits partitions 0-100
//    exactly, and every Airs value has SOME option in Opportunism in Spite and in Working for
//    the Widow, which is what makes the storylets always playable.
//  - The arithmetic behind the badge, by hand: a range pays its middle, a Luck option is its
//    expected value, a rare success and a bundle are NOT in the number.
//  - The trap: the Honey-Dens' six dreams share ONE title, so they may not each get a badge.
//  - The title traps: "(gendertitle)" is a wildcard, "Accept the task" is two options told
//    apart only by the open storylet, "(5 FATE)" is an alias.
//  - Every guide-versus-page disagreement, by name, so a tidy-up that takes the other figure
//    fails here rather than in the game.
//
// Numbers come from the option and storylet pages on fallenlondon.wiki, fetched through the API
// on 2026-09-24, with The Airs of London's Notable Ranges as the cross-check.
//
//   node tests/choice-airs-of-london.test.mjs

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
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
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

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { carouselMatcher, carouselLookup, CAROUSEL_COLOR_NEUTRAL, CAROUSEL_COLOR_LABEL,'
    + ' AOL_OPTIONS, AOL_DREAMS, AOL_PRICE, AOL_UNPRICED, AOL_TOP, AOL_STORYLETS, AOL_INDEX, AOL_BANDS,'
    + ' AOL_CLASS, AOL_BRANCH_CLASS, AOL_DREAM, AOL_SPITE, AOL_LADY, AOL_HILL, AOL_GAME, AOL_WIDOW, AOL_HONEY,'
    + ' aolEpa, aolBadgeText, aolSpec, aolStoryletSpec, aolAirsFrom, aolRatings, aolWindows, aolColor,'
    + ' LBI_STORYLETS, VH_STORYLET, LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS,'
    + ' LAB_CARDS, ARBOR_OPTIONS, PC_OPTIONS, VSD_OPTIONS,'
    + ' normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const opt = (storylet, name) => api.AOL_OPTIONS.find((e) => e.storylet === storylet && e.name === name);
const text = (storylet, name) => api.aolBadgeText(opt(storylet, name));
const near = (a, b) => Math.abs(a - b) < 1e-9;

// === the table's shape =====================================================

const top = api.AOL_OPTIONS.filter((e) => api.AOL_TOP.includes(e.storylet));
const inner = api.AOL_OPTIONS.filter((e) => !api.AOL_TOP.includes(e.storylet));

check('every top-level option carries an Airs window inside 0-100, low to high',
  top.filter((e) => !e.airs || !e.airs.length
    || e.airs.some((w) => !(w[0] >= 0 && w[1] <= 100 && w[0] <= w[1]))).map((e) => e.name), []);

check('and no inner option does: the window is on the option that opens the storylet',
  inner.filter((e) => e.airs).map((e) => e.name), []);

check('every redirect opens a storylet that holds options',
  top.filter((e) => e.open).filter((e) => !inner.some((o) => o.storylet === e.open)).map((e) => e.name), []);

check('and every inner storylet is opened by exactly one option',
  [...new Set(inner.map((e) => e.storylet))]
    .filter((s) => top.filter((e) => e.open === s).length !== 1), []);

check('every item a success, a rare success, a failure or a cost names has a Bazaar price',
  api.AOL_OPTIONS.flatMap((e) => [e.g, e.u, e.rare && e.rare.g, e.fail && e.fail.g])
    .flatMap((l) => l || []).map((p) => p[0])
    .filter((n) => !(n in api.AOL_PRICE)), []);

check('the only Cross-economy items are the Honey-Dens\' pair, and never in a badged option',
  [api.AOL_UNPRICED.slice().sort(),
    api.AOL_DREAMS.flatMap((d) => d.g).map((p) => p[0]).filter((n) => api.AOL_UNPRICED.includes(n)).sort()],
  [['Memory of Light', 'Vision of the Surface'], ['Memory of Light', 'Vision of the Surface']]);

check('every faction result on a badge ends the badge text',
  api.AOL_OPTIONS.filter((e) => e.f && e.f.length).filter((e) => {
    const t = api.aolBadgeText(e);
    return !e.f.every((p, i) => i < e.f.length - 1 || t.endsWith(' ' + (p[1] < 0 ? '−' : '+') + Math.abs(p[1])));
  }).map((e) => e.name), []);

check('no top-level option is a repeat of another under the same storylet',
  top.map((e) => key(e.storylet) + '|' + key(e.name)).filter((k, i, all) => all.indexOf(k) !== i), []);

// === the windows do what the pages say =====================================

const covered = (win) => Array.from({ length: 101 }, (_, i) => i)
  .filter((n) => win.some((w) => n >= w[0] && n <= w[1]));
const winsOf = (storylet) => top.filter((e) => e.storylet === storylet).flatMap((e) => e.airs);
const overlaps = (storylet) => {
  const ws = top.filter((e) => e.storylet === storylet).map((e) => e.airs);
  const out = [];
  ws.forEach((a, i) => ws.forEach((b, j) => {
    if (i < j && a.some((x) => b.some((y) => x[0] <= y[1] && y[0] <= x[1]))) out.push([i, j]);
  }));
  return out;
};

check('Opportunism in Spite and Working for the Widow offer something at every Airs from 0 to 100',
  [covered(winsOf(api.AOL_SPITE)).length, covered(winsOf(api.AOL_WIDOW)).length], [101, 101]);

check('Business on Watchmaker\'s Hill and Life on Ladybones Road are exact quarters, none overlapping',
  [api.AOL_HILL, api.AOL_LADY].map((s) => [covered(winsOf(s)).length, overlaps(s).length]), [[101, 0], [101, 0]]);

check('the Great Game\'s five "Gather resources" windows are an exact partition of 0-100',
  (() => {
    const ws = top.filter((e) => e.name.startsWith('Gather resources')).map((e) => e.airs);
    return [ws.length, covered(ws.flat()).length,
      ws.flat().reduce((n, w) => n + (w[1] - w[0] + 1), 0)];
  })(), [5, 101, 101]);

check('Christen Jack is offered at both ends of the Airs, 0-12 and 88-100',
  opt(api.AOL_SPITE, 'Christen Jack for a Stuttering Fence').airs, [[0, 12], [88, 100]]);

check('the Notable Ranges: Confound the Constables at 0-25, the Widow\'s audience at 33-67, the Weasel-Seller at 76+',
  [opt(api.AOL_SPITE, 'Confound the Constables').airs, opt(api.AOL_WIDOW, 'Attend an audience with the Gracious Widow').airs,
    opt(api.AOL_SPITE, 'Waylay a Weasel-Seller').airs],
  [[[0, 25]], [[33, 67]], [[76, 100]]]);

check('the Airs page and the pages disagree on the Confound the Constables suspicion, and the pages are followed',
  [opt('Confound the Constables', 'A man with a past').q, opt('Confound the Constables', 'A riskier option: hide in a rookery').q,
    /−4 or −3/.test(opt(api.AOL_SPITE, 'Confound the Constables').guide)],
  [[['Suspicion', -3]], [['Suspicion', -4]], true]);

check('the Widow\'s audience pays the Notable Ranges\' 36 Jade Fragment and Connected +10',
  [opt(api.AOL_WIDOW, 'Attend an audience with the Gracious Widow').g, opt(api.AOL_WIDOW, 'Attend an audience with the Gracious Widow').f],
  [[['Jade Fragment', 36]], [['Connected: The Widow', 10]]]);

check('the Honey-Dens: six dreams, the Spotted Shadows window follows the option page (1-25) and quotes the storylet (0-25)',
  [api.AOL_DREAMS.length, api.AOL_DREAMS[0].airs, api.AOL_DREAMS[0].guideAirs], [6, [1, 25], '0–25']);

// === the arithmetic, by hand ==============================================

check('a success pays the Bazaar sell price: 42 Glim is 0.42 Echoes',
  near(api.aolEpa(opt(api.AOL_SPITE, 'Burgle a Glim assayer’s office')), 0.42), true);

check('a range pays its middle: 26-35 Moon-Pearls, 30.5 x 0.01',
  near(api.aolEpa(opt('Befriend a tomb-colonist', 'Accept the task')), 0.305), true);

check('a cost is taken off: 50 Moon-Pearls for a drawing lesson is -0.50, and Fascinating rides along',
  [near(api.aolEpa(opt(api.AOL_GAME, 'Fascinate: attend drawing lessons to impress the Courier')), -0.5),
    text(api.AOL_GAME, 'Fascinate: attend drawing lessons to impress the Courier')],
  [true, '−0.50 E · Fascinating +6–8']);

check('the Luck option is its expected value: 30% of 42 Jade Fragment, marked ≈ and not ?',
  [near(api.aolEpa(opt('Help Bring in Peach Brandy', 'Sneak a sip of the brandy')), 0.126),
    text('Help Bring in Peach Brandy', 'Sneak a sip of the brandy')],
  [true, '0.13 E≈ · Wounds −8 · Connected: The Widow +5']);

check('a rare success is in the tooltip and NOT in the number: the Weasel-Seller is 2 Lucky Weasels, 0.40',
  [text(api.AOL_SPITE, 'Waylay a Weasel-Seller'),
    /Rare success: Araby Fighting-Weasel ×1\. No page states its odds/.test(api.aolSpec(opt(api.AOL_SPITE, 'Waylay a Weasel-Seller')).title)],
  ['0.40 E?', true]);

check('a random bundle is not priced: it says so and shows its cap',
  [text(api.AOL_SPITE, 'Pick pockets at a ring fight'), text('Assist the Fisher-Kings', 'Rob the urchins'),
    api.aolEpa(opt('Assist the Fisher-Kings', 'Rob the urchins'))],
  ['bundle 1–66?', 'bundle ≤56?', null]);

check('what a line moves comes after the Echoes, a menace it removes signed: A man with a past',
  text('Confound the Constables', 'A man with a past'), '0.44 E? · Suspicion −3');

check('a line with nothing to price shows what it moves: the rookery, and a Fascinate',
  [text('Confound the Constables', 'A riskier option: hide in a rookery'),
    text(api.AOL_GAME, 'Fascinate: sketch the Courier on napkins')],
  ['Suspicion −4?', 'Fascinating +2?']);

check('the factions close the badge, a spent Favour signed: selling Society\'s secrets',
  text(api.AOL_GAME, 'Trade on your connections: sell Society’s secrets'), '1.51 E? · Game +5 · Favours: Society −1');

check('and a rise in a faction: the Widow\'s tea',
  text(api.AOL_WIDOW, 'Help Bring in Smuggled Tea Under Cover of Darkness'), '0.43 E? · Connected: The Widow +3');

check('a payment that is FATE is said in the tooltip, not priced: the Great Game paramour',
  [/Costs 5 FATE\./.test(api.aolSpec(opt(api.AOL_GAME, 'Investigate the Courier’s paramour')).title),
    text(api.AOL_GAME, 'Investigate the Courier’s paramour')],
  [true, '1.00 E · Game +11 · Subtle +3']);

check('the tooltip carries the window, the challenge with its certain point, and whether Airs is re-rolled',
  (() => {
    const t = api.aolSpec(opt(api.AOL_SPITE, 'Burgle a Glim assayer’s office')).title;
    return [/The Airs of London 13–38/.test(t), /Shadowy 42, certain at Shadowy 70/.test(t),
      /re-rolled on a success and not on a failure/.test(t)];
  })(), [true, true, true]);

check('an option the page never lists re-rolling Airs says so',
  /does not list this option re-rolling Airs/.test(api.aolSpec(
    { ...opt('Avoid an Unfair Tax on Jewels', 'Retrieve \'costume\' jewellery'), airs: [[34, 100]] }).title), true);

// === a redirecting option carries its best line ===========================

check('a redirect shows "best" where its inside is priced: Confound the Constables, and its tooltip lists both',
  (() => {
    const s = api.aolSpec(opt(api.AOL_SPITE, 'Confound the Constables'));
    return [s.text, /A man with a past — 0\.44 E\? · Suspicion −3/.test(s.title),
      /A riskier option: hide in a rookery — Suspicion −4\?/.test(s.title), /Needs: A Name Whispered in Darkness 3/.test(s.title)];
  })(), ['best 0.44 E? · Suspicion −3', true, true, true]);

check('and does not claim a "best" where nothing inside is priced: the Fisher-Kings show both bundles',
  api.aolSpec(opt(api.AOL_SPITE, 'Assist the Fisher-Kings')).text, 'bundle ≤50? | bundle ≤56?');

check('the best of Watchmaker\'s Hill\'s weasels is the Moon-Pearls, 40.5, not the Rostygold, 35.5',
  api.aolSpec(opt(api.AOL_HILL, 'Encounter: an enthusiastic outing')).text, 'best 0.51 E?');

check('every redirect resolves to a badge',
  top.filter((e) => e.open).filter((e) => !api.aolSpec(e)).map((e) => e.name), []);

// === the title traps ======================================================

check('"(gendertitle)" is a wildcard, and the two weasel options do not match each other\'s title',
  (() => {
    const l = (name) => api.carouselLookup(api.AOL_INDEX, name, key('Weasel-fanciers are abroad'));
    return [l('One lady and a weasel').name, l('One gentleman and a weasel of distinction').name, l('One and a weasel')];
  })(), ['One (gendertitle) and a weasel', 'One (gendertitle) and a weasel of distinction', null]);

check('"Accept the task" is two options, told apart only by the storylet that is open',
  (() => {
    const l = (open) => api.carouselLookup(api.AOL_INDEX, 'Accept the task', key(open));
    return [l('Befriend a tomb-colonist').ch, l('Beguile a Useful Official').ch, l('Rumourmongering!')];
  })(), [['Persuasive', 20], ['Persuasive', 25], null]);

check('"(5 FATE)" and "(3 FATE)" are titles the game may or may not carry: both are answered',
  [api.carouselLookup(api.AOL_INDEX, 'Investigate the Courier’s paramour (5 FATE)', key(api.AOL_GAME)) !== null,
    api.carouselLookup(api.AOL_INDEX, 'Investigate the Courier’s paramour', key(api.AOL_GAME)) !== null,
    api.carouselLookup(api.AOL_INDEX, 'Books and papers (3 FATE)', key('Burgle a grand residence')) !== null,
    api.carouselLookup(api.AOL_INDEX, 'Books and papers', key('Burgle a grand residence')) !== null],
  [true, true, true, true]);

check('an option answers only inside its own open storylet: a glim burglary is not a thing on the Widow\'s list',
  [api.carouselLookup(api.AOL_INDEX, 'Burgle a Glim assayer’s office', key(api.AOL_WIDOW)),
    api.carouselLookup(api.AOL_INDEX, 'Burgle a Glim assayer’s office', key(api.AOL_SPITE)) !== null],
  [null, true]);

check('the six Honey-Dens dreams are ONE title and get one label, never a badge each',
  (() => {
    const e = api.carouselLookup(api.AOL_INDEX, 'Deepen your acquaintance with Prisoner’s Honey', key(api.AOL_HONEY));
    const s = api.aolSpec(e);
    return [!!e, s.text, api.AOL_DREAMS.every((d) => s.title.includes('Airs ' + d.airs[0] + '–' + d.airs[1]))];
  })(), [true, 'dream, by Airs', true]);

check('the dream tooltip prices a dream at its gross per action, and leaves the Cross-economy pair unpriced',
  (() => {
    const t = api.aolSpec(api.AOL_INDEX.find((r) => r.entry.dream).entry).title;
    return [/Dream of a City[^\n]*1\.30 E\?/.test(t) || /Dream of a City[^\n]*1\.3 E\?/.test(t),
      /Dream of Spotted Shadows[^\n]*Cross-economy, no Bazaar price/.test(t),
      /the option page is followed/.test(t)];
  })(), [true, true, true]);

// === colour is a value, and the number is printed =========================

check('five bands, five colours, all different',
  new Set(api.AOL_BANDS.map((b) => b.color)).size, 5);

check('every band is legible under white ink (WCAG contrast at least 4.5)',
  (() => {
    const lum = (hex) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    return api.AOL_BANDS.filter((b) => 1.05 / (lum(b.color) + 0.05) < 4.5).map((b) => b.color);
  })(), []);

check('the bands cut where the design says: 0.09 blue, 0.42 olive, 1.5 orange, nothing to price grey',
  [api.aolColor(0.09), api.aolColor(0.42), api.aolColor(1.51), api.aolColor(null)],
  [api.AOL_BANDS[0].color, api.AOL_BANDS[2].color, api.AOL_BANDS[4].color, api.CAROUSEL_COLOR_NEUTRAL]);

// === the current Airs =====================================================

check('the Airs text parser reads the number after the quality name, and nothing else',
  [api.aolAirsFrom('You unlocked this with The Airs of London 47'), api.aolAirsFrom('The Airs of London: 100'),
    api.aolAirsFrom('The Airs of London 250'), api.aolAirsFrom('Airs of the Khanate 40'), api.aolAirsFrom(null)],
  [47, 100, null, null, null]);

// === the wiring ==========================================================

check('no storylet of this feature is another carousel\'s',
  (() => {
    const own = api.AOL_STORYLETS.map(key);
    const others = [...api.LBI_STORYLETS, api.VH_STORYLET].map(key);
    return own.filter((s) => others.includes(s));
  })(), []);

check('no option title is also a card or option name in another feature\'s table',
  (() => {
    const others = [
      ...api.ZEE_CARDS.map((c) => key(c.name)), ...api.SPITE_CARDS.map((c) => key(c.name)),
      ...api.FOTZ_CARDS.map((c) => key(c.name)), ...api.LAB_CARDS.map((c) => key(c.name)),
      ...api.ARBOR_OPTIONS.map((e) => key(e.name)),
      ...api.PC_OPTIONS.flatMap((p) => [key(p.name), p.branch ? key(p.branch) : '']),
      ...api.VSD_OPTIONS.flatMap((v) => [key(v.storylet), key(v.branch)]),
      ...api.LBI_OPTIONS.map((e) => key(e.name)), ...api.VH_OPTIONS.map((e) => key(e.name)),
      ...api.DME_OPTIONS.map((e) => key(e.name)),
    ];
    return api.AOL_OPTIONS.map((e) => key(e.name)).filter((n) => others.includes(n));
  })(), []);

check('the registered pass badges an open storylet\'s options, opens nothing else, and clears on leaving',
  (() => {
    const glim = makeHeading('Burgle a Glim assayer’s office');
    const wander = makeHeading('Waylay a Weasel-Seller');
    const strange = makeHeading('Something else entirely');
    branches = [glim, wander, strange];
    const t = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
    const out = [];
    roots = [makeHeading('Opportunism in Spite')];
    api.aolRatings();
    out.push([t(roots[0], api.AOL_CLASS), t(glim, api.AOL_BRANCH_CLASS), t(wander, api.AOL_BRANCH_CLASS),
      t(strange, api.AOL_BRANCH_CLASS)]);
    roots = [makeHeading('Working for the Widow')];
    api.aolRatings();
    out.push([t(glim, api.AOL_BRANCH_CLASS), t(wander, api.AOL_BRANCH_CLASS)]);
    roots = [];
    api.aolRatings();
    out.push([t(glim, api.AOL_BRANCH_CLASS)]);
    branches = [];
    return out;
  })(),
  [['Airs', '0.42 E? · Daring +1', '0.40 E?', null], [null, null], [null]]);

check('a top-level storylet in the list gets its summary with nothing open',
  (() => {
    list = [makeHeading('Business on Watchmaker’s Hill')];
    api.aolRatings();
    const b = badgeOf(list[0], api.AOL_CLASS);
    list = [];
    return b && b.textContent;
  })(), 'Airs');

check('the feature is registered',
  api.FEATURES.some((f) => f.name === 'airs-of-london'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
