#!/usr/bin/env node
// Regenerates data/kol-use-yields-items.tsv: every Kingdom of Loathing item that
// hands you other items when you use it.
//
// The wiki marks each such payout with an {{acquire|item=...|num=...}} or
// {{meat|amount=...}} template inside the article's "When Used" section, so the list is
// derived rather than curated: walk Category:Usable Items (and its subcategories), pull
// the raw wikitext of every member, and read those templates out of that section.
//
// Each row is also given a class, which is what the userscript groups the inventory by.
// Three of the four fall out of the wiki text; the fourth, "multiuse", comes from
// KoLMafia's concoctions.txt, the one place the multi-use recipes are written down as
// data -- a smoked potsherd makes five different things depending on how many you use
// at once, and no amount of reading the item's own article says so.
//
//   node scripts/fetch-kol-item-yields.mjs                # rewrite the data file
//   node scripts/fetch-kol-item-yields.mjs --check        # exit 1 if the data file is stale
//   node scripts/fetch-kol-item-yields.mjs --print-ids    # re-emit the id list for the userscript
//   node scripts/fetch-kol-item-yields.mjs --print-classes # ... grouped by class
//
// The wiki serves 403 to unrecognised User-Agents, hence the browser UA below.

import { get } from 'node:https';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'kol-use-yields-items.tsv');
const API = 'https://wiki.kingdomofloathing.com/api.php';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const ROOT_CATEGORY = 'Category:Usable Items';
const BATCH = 50; // titles per revisions query — the API's cap for anonymous callers
const MAFIA = 'https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/data/';

// The classes the userscript groups by, in the order it shows them. First match wins,
// so an item that is both multi-use and a Meat payout is filed under multiuse: how many
// to use at once is the more interesting question, and the Meat is still in its row.
const CLASSES = ['multiuse', 'meat', 'random', 'items'];

function fetchJson(url, attempt = 0) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  }).catch(async (err) => {
    if (attempt >= 3) throw err;
    process.stderr.write(`  retry ${attempt + 1}: ${err.message}\n`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    return fetchJson(url, attempt + 1);
  });
}

function api(params) {
  const query = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  return fetchJson(`${API}?${query}`);
}

// Every ns=0 member of a category, recursing into its subcategories.
async function categoryMembers(category, seen = new Set()) {
  if (seen.has(category)) return [];
  seen.add(category);

  const titles = [];
  const subcats = [];
  let cont = {};
  for (;;) {
    const data = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmlimit: '500',
      cmnamespace: '0|14',
      ...cont,
    });
    for (const member of data.query.categorymembers) {
      (member.ns === 14 ? subcats : titles).push(member.title);
    }
    if (!data.continue) break;
    cont = data.continue;
  }
  for (const sub of subcats) titles.push(...(await categoryMembers(sub, seen)));
  return [...new Set(titles)].sort();
}

async function wikitext(titles) {
  const pages = new Map();
  for (let i = 0; i < titles.length; i += BATCH) {
    const data = await api({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: titles.slice(i, i + BATCH).join('|'),
    });
    for (const page of data.query.pages) {
      const content = page.revisions?.[0]?.slots?.main?.content;
      if (content) pages.set(page.title, content);
    }
    process.stderr.write(`  fetched ${Math.min(i + BATCH, titles.length)}/${titles.length}\n`);
  }
  return pages;
}

// Item ids, so consumers can match a KoL page's own `rel="id=NNNN"` instead of
// matching names -- names differ between the wiki and the game in punctuation and
// HTML entities, ids never do. The wiki keeps them in a Cargo table whose rows are
// the "Data:<item name>" subpages, one per item, so the page name joins straight
// onto an article title.
async function cargoItemIds() {
  const ids = new Map();
  for (let offset = 0; ; offset += 500) {
    const data = await api({
      action: 'cargoquery',
      tables: 'Items',
      fields: '_pageName=page,itemid',
      limit: '500',
      offset: String(offset),
    });
    const batch = data.cargoquery || [];
    for (const { title } of batch) {
      const id = Number(title.itemid);
      if (Number.isInteger(id) && id > 0) ids.set(title.page.replace(/^Data:/, ''), id);
    }
    process.stderr.write(`  item ids: ${ids.size}\n`);
    if (batch.length < 500) return ids;
  }
}

function fetchText(url, attempt = 0) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    }).on('error', reject);
  }).catch(async (err) => {
    if (attempt >= 3) throw err;
    process.stderr.write(`  retry ${attempt + 1}: ${err.message}\n`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    return fetchText(url, attempt + 1);
  });
}

// The multi-use recipes, from KoLMafia's concoctions.txt: lines whose method is MUSE,
// read as "use N of this ingredient at once and you get that". Keyed by item id, since
// the ingredient is named there and the wiki's rows are keyed by id.
//
//   pottery yo-yo  MUSE  smoked potsherd (5)
//   pottery hat    MUSE  smoked potsherd (7)
//
// An ingredient with several such lines is the interesting case -- the count decides
// what you get -- and 35 of the 48 are like that.
async function mafiaMultiUse() {
  const [items, concoctions] = await Promise.all([
    fetchText(MAFIA + 'items.txt'),
    fetchText(MAFIA + 'concoctions.txt'),
  ]);

  const idByName = new Map();
  for (const line of items.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [id, name] = line.split('\t');
    if (Number(id) && name) idByName.set(name.toLowerCase(), Number(id));
  }

  const recipes = new Map(); // itemid -> [{ count, output }]
  for (const line of concoctions.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [output, methods, ingredient] = line.split('\t');
    if (!methods || methods.split(',')[0].trim() !== 'MUSE' || !ingredient) continue;
    const m = /^(.*?)\s*\((\d+)\)\s*$/.exec(ingredient);
    const name = (m ? m[1] : ingredient).trim().toLowerCase();
    const id = idByName.get(name);
    if (!id) continue;
    if (!recipes.has(id)) recipes.set(id, []);
    recipes.get(id).push({ count: m ? Number(m[2]) : 1, output: output.trim() });
  }
  for (const list of recipes.values()) list.sort((a, b) => a.count - b.count);
  return recipes;
}

// "When Used" and its wordier siblings, up to the next top-level heading.
const USE_SECTION = /^==[ \t]*(?:When Used|When Consumed|When Opened)[ \t]*==([\s\S]*?)(?=^==[^=]|$(?![\s\S]))/gim;
const ACQUIRE = /\{\{\s*acquire\s*\|([\s\S]*?)\}\}/gi;
// {{meat|amount=400-600}}, {{meat|Mval=250}}, or a bare {{meat}} for "some". The
// `\s*[|}]` is what keeps {{meat range|...}} -- a different template -- out.
const MEAT = /\{\{\s*meat\s*(\|[^}]*)?\}\}/gi;

// A book that turns into "<book> (used)" is still an item-for-item trade, but it is
// not a source of *other* items, so it gets flagged rather than dropped.
const isSelf = (yieldName, title) =>
  yieldName.replace(/\s*\([^)]*\)$/, '').toLowerCase() === title.toLowerCase();

function templateFields(body) {
  const fields = {};
  for (const part of String(body || '').split('|')) {
    const eq = part.indexOf('=');
    if (eq > 0) fields[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return fields;
}

function parseYields(text, title) {
  const yields = [];
  for (const [, section] of text.matchAll(USE_SECTION)) {
    for (const [, body] of section.matchAll(ACQUIRE)) {
      const fields = templateFields(body);
      const name = fields.item || fields['1'];
      if (!name) continue;
      const num = (fields.num || '1').trim();
      yields.push({ name, num, self: isSelf(name, title) });
    }
  }
  return yields;
}

// Meat an item pays out when used -- an old leather wallet is as much a container
// as a foodbucket is, it just holds Meat. Returns the amount as the wiki writes it
// ("400-600", "3,000", "some"), or '' for an item that pays no Meat.
//
// `type` is the direction: the template defaults to "gain", and lose / spent / bet
// are costs, so those are not payouts and must not count. `Mval` is the average
// where the wiki gives a distribution instead of a range.
function parseMeat(text) {
  const amounts = [];
  for (const [, section] of text.matchAll(USE_SECTION)) {
    for (const [, body] of section.matchAll(MEAT)) {
      const fields = templateFields(body);
      const type = (fields.type || 'gain').toLowerCase();
      if (type !== 'gain') continue;
      amounts.push(fields.amount || fields.Mval || 'some');
    }
  }
  // Several {{meat}} in one section means alternative outcomes, not a sum, so
  // they are listed rather than added up.
  return [...new Set(amounts)].join(' / ');
}

// "item name" or "item name x0-3"; a leading "*" marks a self-transform, so mixed
// rows stay readable without cross-referencing the self_transform column.
const formatYield = (y) =>
  `${y.self ? '*' : ''}${y.name}${y.num && y.num !== '1' ? ` x${y.num}` : ''}`;

// Describes the ITEM yields only; a Meat payout is never a self-transform. An item
// with no item yields at all (a wallet, which pays only Meat) is "no", not "all".
const selfKind = (yields) => {
  if (!yields.length) return 'no';
  const selfCount = yields.filter((y) => y.self).length;
  return selfCount === yields.length ? 'all' : selfCount ? 'part' : 'no';
};

// Worth filtering for: it hands you a different item, or it hands you Meat. An item
// that only turns into a used copy of itself does neither.
const paysOut = (row) => Boolean(row.meat) || selfKind(row.yields) !== 'all';

// A quantity the wiki could not pin down: a range ("0-3"), or "some".
const isVague = (text) => /\bx(?:\d+-\d+|some|\?|[A-Z])\b/.test(text || '');

// Which group the userscript files this item under. First match wins, in CLASSES order.
function classOf(row) {
  if (row.multiuse) return 'multiuse';
  if (row.meat) return 'meat';
  if (isVague(row.yields.map(formatYield).join('; '))) return 'random';
  return 'items';
}

function render(rows, pageCount) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `# Kingdom of Loathing items that yield other items when used.`,
    `# Derived from {{acquire}} templates in the "When Used" section of every article in`,
    `# ${ROOT_CATEGORY} (and subcategories) on wiki.kingdomofloathing.com.`,
    `# Generated ${today} by scripts/fetch-kol-item-yields.mjs from ${pageCount} pages.`,
    `#`,
    `# itemid: KoL's own item number, from the wiki's Cargo "Items" table. Empty when the`,
    `#         article has no Data: subpage to read one from.`,
    `# self_transform: all  = every yield is the same item in another state (e.g. a book`,
    `#                        becoming "<book> (used)") — no new items come out of it`,
    `#                 part = mixed; the self-transforming yields are prefixed with "*"`,
    `#                 no   = every yield is a different item, or the item pays only Meat`,
    `# meat: Meat the item pays out when used, as the wiki writes it ("400-600", "3,000",`,
    `#       "some"); " / " separates alternative outcomes. Empty = pays no Meat. Meat the`,
    `#       item COSTS you ({{meat|type=lose|...}}) is not counted here.`,
    `# class: what the userscript groups by; first match of ${CLASSES.join(', ')}.`,
    `#        multiuse = using N at once decides what you get (from KoLMafia's MUSE recipes)`,
    `#        meat     = pays Meat; random = the wiki can only give a range or "some"`,
    `#        items    = a fixed set of items`,
    `# multiuse: the recipes, "N=what you get", "; "-separated. Empty unless class=multiuse.`,
    `# yields: "; "-separated; "xN" suffix is the quantity or range the wiki lists.`,
    `item\titemid\tclass\tself_transform\tmeat\tmultiuse\tyields`,
    ...rows.map((row) =>
      [
        row.title,
        row.itemid ?? '',
        classOf(row),
        selfKind(row.yields),
        row.meat,
        (row.multiuse || []).map((r) => `${r.count}=${r.output}`).join('; '),
        row.yields.map(formatYield).join('; '),
      ].join('\t'),
    ),
  ].join('\n') + '\n';
}

// Everything but the "Generated <date>" line, so --check does not fail on the date alone.
const stripVolatile = (tsv) => tsv.replace(/^# Generated .*$/m, '');

// Reads the data file back and prints the item ids worth filtering on, wrapped for
// pasting into a userscript. Rows that only turn into a used copy of themselves are
// left out -- unless they also pay Meat. Offline -- no wiki traffic.
// The data file back as { class: [ids] }, dropping the rows that only turn into a used
// copy of themselves -- unless they pay Meat too.
function readIdsByClass() {
  const byClass = new Map(CLASSES.map((name) => [name, []]));
  for (const line of readFileSync(OUT, 'utf8').split('\n')) {
    if (!line || line.startsWith('#') || line.startsWith('item\t')) continue;
    const [, itemid, cls, kind, meat] = line.split('\t');
    if (!itemid || (kind === 'all' && !meat)) continue;
    (byClass.get(cls) || byClass.get('items')).push(Number(itemid));
  }
  for (const ids of byClass.values()) ids.sort((a, b) => a - b);
  return byClass;
}

// Wraps a list of ids into indented source lines short enough to paste.
function wrapIds(ids, indent = '    ') {
  const lines = [];
  let row = '';
  for (const id of ids) {
    const next = row ? `${row} ${id},` : `${indent}${id},`;
    if (next.length > 92) {
      lines.push(row);
      row = `${indent}${id},`;
    } else {
      row = next;
    }
  }
  if (row) lines.push(row);
  return lines.join('\n');
}

function printIds() {
  const byClass = readIdsByClass();
  const ids = [].concat(...byClass.values()).sort((a, b) => a - b);
  process.stdout.write(`${wrapIds(ids)}\n`);
  process.stderr.write(`${ids.length} ids\n`);
}

// The same ids, grouped -- what the userscript's YIELD_CLASSES is pasted from.
function printClasses() {
  const byClass = readIdsByClass();
  const out = [];
  let total = 0;
  for (const name of CLASSES) {
    const ids = byClass.get(name);
    total += ids.length;
    out.push(`    ${name}: [`, wrapIds(ids, '      '), '    ],');
  }
  process.stdout.write(`${out.join('\n')}\n`);
  process.stderr.write(
    `${total} ids: ${CLASSES.map((n) => `${n} ${byClass.get(n).length}`).join(', ')}\n`,
  );
}

async function main() {
  const check = process.argv.includes('--check');
  if (process.argv.includes('--print-ids')) return printIds();
  if (process.argv.includes('--print-classes')) return printClasses();

  process.stderr.write(`listing ${ROOT_CATEGORY} ...\n`);
  const titles = await categoryMembers(ROOT_CATEGORY);
  process.stderr.write(`  ${titles.length} pages\n`);
  const pages = await wikitext(titles);
  process.stderr.write('reading item ids from the Cargo Items table ...\n');
  const itemIds = await cargoItemIds();
  process.stderr.write("reading multi-use recipes from KoLMafia's concoctions.txt ...\n");
  const multiUse = await mafiaMultiUse();
  process.stderr.write(`  ${multiUse.size} multi-use items\n`);

  const rows = [];
  for (const title of [...pages.keys()].sort()) {
    const text = pages.get(title);
    const yields = parseYields(text, title);
    const meat = parseMeat(text);
    const itemid = itemIds.get(title);
    if (yields.length || meat) {
      rows.push({ title, itemid, meat, yields, multiuse: itemid ? multiUse.get(itemid) : null });
    }
  }
  const tsv = render(rows, pages.size);

  if (check) {
    let current = '';
    try {
      current = readFileSync(OUT, 'utf8');
    } catch {
      /* missing file counts as stale */
    }
    if (stripVolatile(current) !== stripVolatile(tsv)) {
      process.stderr.write(`${OUT} is out of date — rerun without --check\n`);
      process.exit(1);
    }
    process.stdout.write(`${OUT} is up to date (${rows.length} items)\n`);
    return;
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, tsv);
  const meatRows = rows.filter((r) => r.meat).length;
  const filtered = rows.filter(paysOut).length;
  const missing = rows.filter((r) => !r.itemid);
  process.stdout.write(
    `${rows.length} of ${pages.size} usable items pay out ` +
      `(${meatRows} pay Meat, ${filtered} worth filtering for) -> ${OUT}\n`,
  );
  if (missing.length) {
    process.stderr.write(
      `no item id for ${missing.length}: ${missing.map((r) => r.title).join(', ')}\n`,
    );
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
