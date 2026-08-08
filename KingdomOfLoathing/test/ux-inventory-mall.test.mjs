// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js's inventory [mall] link.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a pathname matching no feature, so run() is a no-op) and pulls out the
// helpers.
//
// Two things are worth pinning. The search term is the item's name in QUOTES:
// KoL's item matcher reads a quoted string as an exact name and anything else
// as a substring, so an unquoted "poppy" would also match every other item
// with poppy in its name. And the link is suppressed for untradeable items --
// `t=0` in the item table's own `rel`, the same flag the page's right-click
// menu gates "Stock in Mall" on -- but only when the flag positively says so,
// since a search that finds nothing is cheaper than a link that never appears.
//
// The markup and the flags come from a real inventory.php page.
//
//   node KingdomOfLoathing/test/ux-inventory-mall.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

const fakeDoc = {
  images: [],
  readyState: 'complete',
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  createTextNode: (t) => ({ text: t }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseItemRel, itemIsTradeable, mallSearchUrl, addMallLink }; })();');
const fn = new Function('document', 'location', 'window',
  wrapped + '\nreturn globalThis.__ux;');
const api = fn(fakeDoc, fakeLocation, {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- the search URL --------------------------------------------------------

check('the name is quoted, so the Mall matches it exactly', api.mallSearchUrl('11-leaf clover'),
  'mall.php?justitems=0&pudnuggler=%2211-leaf%20clover%22');

check('an apostrophe survives', api.mallSearchUrl("Mick's IcyVapoHotness Rub"),
  'mall.php?justitems=0&pudnuggler=%22Mick\'s%20IcyVapoHotness%20Rub%22');

// The page renders &trade; as the character, which is also what KoL's own
// search wants (KoLmafia decodes the entity before searching too).
check('a ™ is encoded, not dropped', api.mallSearchUrl('Newbiesport™ tent'),
  'mall.php?justitems=0&pudnuggler=%22Newbiesport%E2%84%A2%20tent%22');

check('a name carrying a quote can\'t break out of the quoting',
  api.mallSearchUrl('a "fancy" thing'),
  'mall.php?justitems=0&pudnuggler=%22a%20fancy%20thing%22');

// --- the item's flags ------------------------------------------------------

check('the item table\'s rel parses into its flags',
  api.parseItemRel('id=10881&s=0&q=0&d=0&g=0&t=1&n=10&m=0&p=0&u=u'),
  { id: '10881', s: '0', q: '0', d: '0', g: '0', t: '1', n: '10', m: '0', p: '0', u: 'u' });

check('a rel with no flags is just empty', api.parseItemRel(''), {});
check('a missing rel doesn\'t throw', api.parseItemRel(null), {});

check('t is the tradeable flag, and only t=0 suppresses the link', [
  api.itemIsTradeable({ t: '1' }),   // 11-leaf clover
  api.itemIsTradeable({ t: '0' }),   // Chroner, detuned radio, worthless gewgaw
  api.itemIsTradeable({}),           // unreadable: show it anyway
], [true, false, true]);

// --- adding the link -------------------------------------------------------

// Enough of an <table class="item"> for addMallLink: the name in a <b>, the
// <font size=1> the actions live in, and the cell to fall back to.
function fakeItem(rel, name, opts) {
  const box = () => ({ kids: [], appendChild(n) { this.kids.push(n); } });
  const font = opts && opts.noFont ? null : box();
  const cell = box();
  const nameEl = { textContent: name, parentNode: cell };
  return {
    dataset: {},
    font: font,
    cell: cell,
    getAttribute: (k) => (k === 'rel' ? rel : null),
    querySelector: (sel) => {
      if (sel === 'b.ircm' || sel === 'b') return nameEl;
      if (sel === 'font[size="1"]') return font;
      return null;
    },
  };
}

const clover = fakeItem('id=10881&s=0&q=0&d=0&g=0&t=1&n=10&m=0&p=0&u=u', '11-leaf clover');
api.addMallLink(clover);
check('a tradeable item gets a link in the actions row, plus its spacer',
  clover.font.kids.length, 2);
check('...labelled like the page\'s own actions', clover.font.kids[0].textContent, '[mall]');
check('...pointing at the exact-name search', clover.font.kids[0].href,
  'mall.php?justitems=0&pudnuggler=%2211-leaf%20clover%22');
check('...and saying what it does on hover', clover.font.kids[0].title,
  'Search the Mall for 11-leaf clover');

// A second pass (the observer re-runs on every DOM change) must not stack up.
api.addMallLink(clover);
api.addMallLink(clover);
check('re-running adds nothing', clover.font.kids.length, 2);

const chroner = fakeItem('id=7567&s=0&q=0&d=0&g=0&t=0&n=75&m=0&p=0&u=.', 'Chroner');
api.addMallLink(chroner);
check('an untradeable item gets no link — it can never be in the Mall',
  chroner.font.kids.length, 0);
check('...and is still flagged, so it isn\'t re-examined every pass',
  chroner.dataset.tmMallLink, '1');

const noFont = fakeItem('id=1&t=1', 'mystery meat', { noFont: true });
api.addMallLink(noFont);
check('an item with no actions row falls back to the name\'s own cell',
  [noFont.cell.kids.length, noFont.cell.kids[0].textContent], [2, '[mall]']);

const nameless = fakeItem('id=2&t=1', '   ');
api.addMallLink(nameless);
check('an item with no readable name is left alone entirely',
  [nameless.font.kids.length, nameless.dataset.tmMallLink], [0, undefined]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
