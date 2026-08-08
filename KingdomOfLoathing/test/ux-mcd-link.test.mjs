// Ad-hoc test for KingdomOfLoathing/ux-enhancers.js's monster aggravation
// device line.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (a pathname matching no feature, so run() is a no-op) and pulls out the
// helpers.
//
// The trap this exists for: which device you get is decided by the moon sign's
// ZONE, not by its stat. Platypus is a Muscle sign but a Little Canadia one, so
// "muscle sign means the detuned radio" sends a third of players to a page they
// can't use. The map below is KoLmafia's ZodiacSign table.
//
// The labels and URLs are KoL's own, taken from real charpane HTML (KoLmafia's
// charpane test fixtures), which is also where the compact/expanded distinction
// comes from -- so both are pinned here rather than left to drift.
//
//   node KingdomOfLoathing/test/ux-mcd-link.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

const page = { links: [] };
const fakeDoc = {
  images: [],
  readyState: 'complete',
  querySelector: (sel) => page.links.find((l) => l.matches(sel)) || null,
  querySelectorAll: () => page.links,
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
};
const fakeLocation = { pathname: '/nowhere.php', origin: 'https://www.kingdomofloathing.com' };

const wrapped = src
  .replace('(function () {', 'globalThis.__ux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MCD_DEVICES, mcdDeviceForSign, mcdDeviceForLabel, mcdTooltip, ' +
    'findExistingMcdLink, findCompactStatRow, localPwd }; })();');
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

// --- moon sign -> device ---------------------------------------------------

const sign = (s) => api.mcdDeviceForSign(s);

check('the three Degrassi Knoll signs get the detuned radio', [
  sign('Mongoose'), sign('Wallaby'), sign('Vole'),
], ['knoll', 'knoll', 'knoll']);

// Platypus is a MUSCLE sign and a CANADIA one. Grouping by stat would put it
// on the radio; grouping by zone (correct) puts it on the MCD.
check('the three Little Canadia signs get the Mind-Control Device', [
  sign('Platypus'), sign('Opossum'), sign('Marmot'),
], ['canadia', 'canadia', 'canadia']);

check('the three Gnomad signs get the Annoy-o-Tron', [
  sign('Wombat'), sign('Blender'), sign('Packrat'),
], ['gnomads', 'gnomads', 'gnomads']);

check('Bad Moon gets Heartbreaker\'s Hotel', sign('Bad Moon'), 'badmoon');
check('the sign is matched case- and space-insensitively', [
  sign('packrat'), sign('  BAD MOON  '),
], ['gnomads', 'badmoon']);

check('no sign means no device — say nothing rather than guess', [
  sign('None'), sign(''), sign(null), sign(undefined), sign('Wallabee'),
], [null, null, null, null, null]);

// --- the device table ------------------------------------------------------

const dev = (k) => api.MCD_DEVICES[k];

check('each device carries KoL\'s own URL', [
  dev('knoll').url, dev('canadia').url, dev('gnomads').url, dev('badmoon').url,
], [
  'inv_use.php?whichitem=2682',
  'place.php?whichplace=canadia&action=lc_mcd',
  'gnomes.php?place=machine',
  'adventure.php?snarfblat=148',
]);

check('only the radio needs a pwd — it is the one that is an inventory item', [
  dev('knoll').pwd, dev('canadia').pwd, dev('gnomads').pwd, dev('badmoon').pwd,
], [true, false, false, false]);

// Most dials stop at 10. Canadia's goes to 11 (it's one higher), and so does
// Heartbreaker's — which is what makes the Boss Boss trophy reachable.
check('the dial ranges match the wiki', [
  dev('knoll').max, dev('canadia').max, dev('gnomads').max, dev('badmoon').max,
], [10, 11, 10, 11]);

check('the trophy is only promised where 11 is reachable', [
  /Boss Boss/.test(api.mcdTooltip(dev('canadia'))),
  /Boss Boss/.test(api.mcdTooltip(dev('badmoon'))),
  /Boss Boss/.test(api.mcdTooltip(dev('knoll'))),
  /Boss Boss/.test(api.mcdTooltip(dev('gnomads'))),
], [true, true, false, false]);

check('the tooltip states the range', [
  /0-10/.test(api.mcdTooltip(dev('knoll'))),
  /0-11/.test(api.mcdTooltip(dev('canadia'))),
], [true, true]);

// --- recognising KoL's own line --------------------------------------------

// The expanded pane and the compact pane use different wording for the same
// four devices; both have to be recognised or the line gets duplicated.
check('the expanded pane\'s labels are recognised', [
  api.mcdDeviceForLabel('Detuned Radio'), api.mcdDeviceForLabel('Mind Control'),
  api.mcdDeviceForLabel('Annoy-o-Tron 5k'), api.mcdDeviceForLabel('Heartbreaker\'s'),
], ['knoll', 'canadia', 'gnomads', 'badmoon']);

check('the compact pane\'s abbreviations are recognised', [
  api.mcdDeviceForLabel('Radio'), api.mcdDeviceForLabel('MC'),
  api.mcdDeviceForLabel('AOT5K'), api.mcdDeviceForLabel('HH'),
], ['knoll', 'canadia', 'gnomads', 'badmoon']);

check('a trailing colon and odd casing don\'t matter', [
  api.mcdDeviceForLabel(' aot5k: '), api.mcdDeviceForLabel('DETUNED RADIO'),
], ['gnomads', 'knoll']);

check('anything else is not a device line', [
  api.mcdDeviceForLabel('Adv'), api.mcdDeviceForLabel('PvP'),
  api.mcdDeviceForLabel('The Skeleton Store'), api.mcdDeviceForLabel(''),
], [null, null, null, null]);

// --- reading the pane ------------------------------------------------------

// Minimal stand-ins for the two shapes of charpane. `matches` only has to cope
// with the selectors the script actually uses.
function link(href, text, row) {
  return {
    href: href,
    textContent: text,
    getAttribute: (k) => (k === 'href' ? href : null),
    matches: (sel) => sel.includes('peevpee.php')
      ? href.includes('peevpee.php')
      : sel.includes('pwd=') ? href.includes('pwd=')
        : sel.includes('charsheet.php') ? href.includes('charsheet.php') : false,
    closest: () => row || null,
  };
}
const cell = (bold) => ({ querySelector: () => (bold ? {} : null) });

// Compact: <tr><td align=right><a href=peevpee.php>PvP</a>:</td><td><b>48</b></td></tr>
const compactRows = [{ id: 'adv' }, { id: 'pvp' }, { id: 'mcd' }];
const compactRow = { children: [cell(false), cell(true)], parentNode: { children: compactRows } };
page.links = [link('peevpee.php', 'PvP', compactRow)];
check('the compact pane is recognised by the <b> count beside PvP',
  api.findCompactStatRow(), compactRows[compactRows.length - 1]);

// Expanded: the same things are icons with <span class=black>48</span>, no <b>.
const expandedRow = { children: [cell(false), cell(false)], parentNode: { children: [] } };
page.links = [link('peevpee.php', '', expandedRow)];
check('the expanded pane is not mistaken for the compact one',
  api.findCompactStatRow(), null);

page.links = [];
check('no PvP row at all is not the compact pane', api.findCompactStatRow(), null);

// The device line KoL draws itself, which must be left alone.
page.links = [
  link('adventure.php?snarfblat=439', 'The Skeleton Store'),
  link('inv_use.php?pwd=abc123&whichitem=2682', 'Detuned Radio'),
];
const found = api.findExistingMcdLink();
check('KoL\'s own device line is found by its label',
  found && found.textContent, 'Detuned Radio');

// A "last adventure" link to Hey Deze is NOT the Heartbreaker's device line --
// which is why the label, not the href, is what identifies it.
page.links = [link('adventure.php?snarfblat=148', 'Heartbreaker\'s Hotel')];
check('a last-adventure link to the same zone is not the device line',
  api.findExistingMcdLink(), null);

check('the pwd comes off any pwd-carrying link when pwdhash is absent',
  (() => {
    page.links = [link('questlog.php?pwd=deadbeef01', 'Quests')];
    return api.localPwd();
  })(), 'deadbeef01');

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
