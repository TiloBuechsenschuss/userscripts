#!/usr/bin/env node
// Auto-bump the @version of each "loader" userscript when one of the files it
// @require's has changed.
//
// Why this exists: the all-in-one.js loaders pull each bundled script straight
// from GitHub via @require. Userscript managers cache those @require resources
// and only re-fetch them when the LOADER's own @version goes up. So editing
// codpiece.js without bumping all-in-one.js means installed users never see the
// change. This script closes that gap.
//
// Usage:
//   node scripts/bump-loaders.mjs            Compare working tree vs HEAD, bump in place.
//   node scripts/bump-loaders.mjs --staged   Look at staged changes only, bump and `git add`
//                                            the loader (intended for the pre-commit hook).
//   node scripts/bump-loaders.mjs --check     Report what would change; exit 1 if a bump is
//                                            needed; write nothing. Good for CI.
//   node scripts/bump-loaders.mjs --force      Force-bump every loader, ignoring change
//                                            detection (and the "loader already edited" guard).
//   node scripts/bump-loaders.mjs --force kol  Force-bump only loaders whose path contains
//                                            "kol" (substring match; repeatable). Aliases:
//                                            kol -> KingdomOfLoathing, th -> TwilightHeroes.
//                                            Combine with --staged to also `git add` them.
//
// A loader is any tracked .js file whose metadata block @require's another file
// in THIS repo. No config list to maintain -- add a loader and it's covered.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const STAGED = argv.includes('--staged');
const CHECK = argv.includes('--check');

// --force                bump every loader, ignoring change detection.
// --force <match>        only loaders whose repo path contains <match> (repeatable).
// --force=<match>        same, attached form.
let FORCE = false;
const forceMatches = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--force') {
    FORCE = true;
    const next = argv[i + 1];
    if (next && !next.startsWith('-')) {
      forceMatches.push(next);
      i++;
    }
  } else if (a.startsWith('--force=')) {
    FORCE = true;
    forceMatches.push(a.slice('--force='.length));
  }
}

// Short aliases for the --force <match> term, so `--force kol` hits the
// KingdomOfLoathing loader and `--force th` hits the TwilightHeroes one.
const ALIASES = { kol: 'kingdomofloathing', th: 'twilightheroes' };
const resolveMatch = (m) => (ALIASES[m.toLowerCase()] ?? m).toLowerCase();

function git(...a) {
  return execFileSync('git', a, { encoding: 'utf8' }).trim();
}

const repoRoot = git('rev-parse', '--show-toplevel');

// All tracked .js files, as repo-relative POSIX paths (how git reports them).
const tracked = git('ls-files', '*.js')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

// Set of files that changed, depending on mode.
const changed = new Set(
  (STAGED
    ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR')
    : git('diff', '--name-only', 'HEAD')
  )
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
);

// Pull the repo-relative path out of a raw.githubusercontent.com @require URL
// for THIS repo. Returns null for external requires (other repos / CDNs).
function requirePathFromUrl(url) {
  const m = url.match(
    /raw\.githubusercontent\.com\/[^/]+\/userscripts\/(?:refs\/heads\/)?[^/]+\/(.+)$/
  );
  return m ? m[1] : null;
}

const VERSION_RE = /^(\/\/\s*@version\s+)(\d+(?:\.\d+)*)(\s*)$/m;

function bumpVersion(version) {
  const parts = version.split('.').map(Number);
  parts[parts.length - 1] += 1;
  return parts.join('.');
}

let needWork = false;
let forceHit = false;
const summary = [];

for (const file of tracked) {
  const abs = join(repoRoot, file);
  const text = readFileSync(abs, 'utf8');

  // Only consider the metadata block.
  const metaMatch = text.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
  if (!metaMatch) continue;
  const meta = metaMatch[0];

  const requires = [...meta.matchAll(/\/\/\s*@require\s+(\S+)/g)]
    .map((m) => requirePathFromUrl(m[1]))
    .filter(Boolean);

  if (requires.length === 0) continue; // not a loader for this repo

  const fileLc = file.toLowerCase();
  const isForced =
    FORCE &&
    (forceMatches.length === 0 || forceMatches.some((m) => fileLc.includes(resolveMatch(m))));

  const changedRequires = requires.filter((r) => changed.has(r));

  // --force bypasses change detection and the "already edited" guard entirely.
  if (!isForced) {
    if (changedRequires.length === 0) continue; // nothing it bundles changed

    // If the loader itself was already touched in this changeset, assume the
    // human is handling its @version on purpose -- don't second-guess them.
    if (changed.has(file)) {
      summary.push(`= ${file}: required files changed but loader already modified; left alone.`);
      continue;
    }
  }

  forceHit = forceHit || isForced;

  const vm = meta.match(VERSION_RE);
  if (!vm) {
    summary.push(`! ${file}: has @require's but no parseable @version; skipped.`);
    continue;
  }

  const oldV = vm[2];
  const newV = bumpVersion(oldV);
  needWork = true;

  const reason = isForced
    ? changedRequires.length
      ? `forced; ${changedRequires.join(', ')}`
      : 'forced'
    : changedRequires.join(', ');

  if (CHECK) {
    summary.push(`* ${file}: ${oldV} -> ${newV} (needed; ${reason})`);
    continue;
  }

  const newMeta = meta.replace(VERSION_RE, `$1${newV}$3`);
  writeFileSync(abs, text.replace(meta, newMeta));
  if (STAGED) git('add', '--', file);
  summary.push(`* ${file}: ${oldV} -> ${newV}  [${reason}]`);
}

// A --force <match> that hit no loader is almost certainly a typo -- say so.
if (FORCE && forceMatches.length > 0 && !forceHit) {
  console.error(`bump-loaders: --force matched no loader for: ${forceMatches.join(', ')}`);
  process.exit(2);
}

if (summary.length === 0) {
  console.log('bump-loaders: no loader needs a version bump.');
} else {
  console.log(summary.join('\n'));
}

// In --check mode, a needed bump is a failure (so CI / a hook can block).
if (CHECK && needWork) process.exit(1);
