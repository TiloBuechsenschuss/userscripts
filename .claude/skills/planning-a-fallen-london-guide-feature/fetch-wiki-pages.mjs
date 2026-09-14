#!/usr/bin/env node
// Fetch many fallenlondon.wiki pages' wikitext in a few API calls.
//
//   node fetch-wiki-pages.mjs titles.txt outdir
//
// titles.txt: one page title per line. Each page lands in outdir as
// "<title as asked>.txt", its first line "== <resolved title> ==". Redirects are
// followed; missing pages are listed at the end.
//
// Why this shape: the rendered wiki sits behind Anubis, so WebFetch and plain
// page loads fail, while api.php answers a browser User-Agent. Older Node has no
// global `fetch`, hence `https`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import https from 'node:https';

const [, , list, out] = process.argv;
if (!list || !out) {
  console.error('usage: node fetch-wiki-pages.mjs titles.txt outdir');
  process.exit(2);
}
mkdirSync(out, { recursive: true });
const titles = readFileSync(list, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (c) => { body += c; });
    res.on('end', () => resolve(body));
  }).on('error', reject);
});

const missing = [];
for (let i = 0; i < titles.length; i += 40) {
  const chunk = titles.slice(i, i + 40);
  const url = 'https://fallenlondon.wiki/w/api.php?' + new URLSearchParams({
    action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', redirects: '1',
    format: 'json', formatversion: '2', titles: chunk.join('|'),
  });
  const j = JSON.parse(await get(url));
  const asked = new Map();
  for (const n of j.query.normalized || []) asked.set(n.to, n.from);
  for (const r of j.query.redirects || []) asked.set(r.to, asked.get(r.from) || r.from);
  for (const p of j.query.pages) {
    const name = asked.get(p.title) || p.title;
    if (p.missing || !p.revisions) { missing.push(name); continue; }
    writeFileSync(out + '/' + name.replace(/[\\/:*?"<>|]/g, '_') + '.txt',
      '== ' + p.title + ' ==\n' + p.revisions[0].slots.main.content);
  }
}
console.log('fetched', titles.length - missing.length, 'missing', missing.length);
for (const m of missing) console.log('MISSING', m);
