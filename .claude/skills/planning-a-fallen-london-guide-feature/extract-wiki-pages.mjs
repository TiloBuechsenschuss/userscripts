#!/usr/bin/env node
// Squash a directory of wiki pages (from fetch-wiki-pages.mjs) into one
// readable digest: card frequency/unlocks/options, and for each option its
// requirements, challenge and the bullet list under each outcome.
//
//   node extract-wiki-pages.mjs outdir > extract.txt
//
// Outcome labels come from the template name, so "{{Success |Type = alt}}" reads
// as [SUCCESS] and a second [FAILURE] is usually the alternative one — check
// the raw page when it matters. A "(see below)" amount is an {{SCurveTable}}
// the digest drops: read that page raw.

import { readFileSync, readdirSync } from 'node:fs';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node extract-wiki-pages.mjs outdir');
  process.exit(2);
}

function squash(s) {
  let prev;
  do {
    prev = s;
    s = s.replace(/\{\{(IL|Use|Unlock|Lock|Gain|Lose|Set|Remove)\|([^{}]*)\}\}/g, (m, kind, body) => {
      const parts = body.split('|');
      const name = parts[0].trim();
      const app = parts.find((p) => /^\s*Appearance\s*=/i.test(p));
      const plain = parts.slice(1).filter((p) => !/=/.test(p)).map((p) => p.trim()).join(' ');
      const shown = kind === 'Use' && app ? app.replace(/^\s*Appearance\s*=\s*/i, '').trim() : name;
      const tag = kind === 'IL' || kind === 'Use' || kind === 'Unlock' ? '' : kind.toUpperCase() + ' ';
      return tag + shown + (plain ? ' ' + plain : '');
    });
    s = s.replace(/\{\{Hand Discarded[^{}]*\}\}/g, '[discards hand]')
      .replace(/\{\{(Success|Failure) Increase[^{}]*\}\}/g, '')
      .replace(/\{\{FontFate\}\}/g, 'FATE').replace(/\{\{E\}\}/g, 'E')
      .replace(/\{\{!\}\}/g, '|');
  } while (s !== prev);
  return s.replace(/<br\s*\/?>/g, ' / ').replace(/<ref[^>]*>([\s\S]*?)<\/ref>/g, ' [note: $1]')
    .replace(/<ref[^>]*\/>/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/<\/?(sup|sub|small)>/g, '').replace(/'''?/g, '');
}

const KEYS = /^(From Card title|From Storylet title|Frequency|Discardable|Unlocked with|Locked with|Option\d+|BroadDiff|BroadQuality|NarrowDiff|NarrowQuality|LuckChallenge|ModifiedQuality|Challenge information|Wiki Note|Game Instructions)$/i;

for (const f of readdirSync(dir).sort()) {
  const lines = readFileSync(dir + '/' + f, 'utf8').split(/\r?\n/);
  const out = [lines[0]];
  let depth = 0;
  for (const line of lines.slice(1)) {
    const head = /^\{\{(Action|Card|Storylet|Rare Success|Success|Failure|Quality|Item)\b/.exec(line);
    if (head) { out.push('  [' + head[1].toUpperCase() + ']'); depth = 1; }
    if (depth) {
      const m = /^\|\s*([^=]+?)\s*=\s*(.*)$/.exec(line);
      if (m && KEYS.test(m[1])) out.push('    ' + m[1] + ': ' + squash(m[2]));
      depth += (line.match(/\{\{/g) || []).length - (line.match(/\}\}/g) || []).length - (head ? 1 : 0);
      if (depth <= 0 || line.trim() === '}}') depth = 0;
      continue;
    }
    if (/^\s*\*/.test(line)) {
      const t = squash(line.replace(/^\s*\*+\s*/, '')).trim();
      if (t) out.push('    - ' + t);
    }
  }
  console.log(out.join('\n'));
}
