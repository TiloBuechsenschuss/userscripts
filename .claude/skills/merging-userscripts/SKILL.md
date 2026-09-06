---
name: merging-userscripts
description: Use when folding one userscript in this repo into another, splitting a merged one back out, renaming a script file, or deleting a script that people have installed.
---

# Merging and splitting userscripts

## Overview

**A file's path in this repo is its public URL, and deleting it does not uninstall it.**
A dead `@downloadURL` stops delivering updates; the copy already in someone's userscript
manager keeps running forever. Every rule below follows from that.

One `.js` file is one self-contained IIFE with no module system, so two features can only
share a helper by living in the same file. That is the *only* good reason to merge.

## Merge checklist

Work in this order. Items marked **TRAP** are the ones that get skipped.

1. **Pick the host by whose URL survives.** The host keeps its path and `@downloadURL`;
   the other file is deleted and its installers are stranded. Prefer the host that other
   files already name (in `AGENTS.md`, in another script's comments) and the one with more
   tests — repointing one test file beats repointing three.
2. **List top-level declarations in both** and resolve every collision before splicing:
   ```sh
   decl() { grep -oE "^  (async )?function [A-Za-z0-9_]+|^  (const|let|var) [A-Za-z0-9_]+" "$1" | sort -u; }
   comm -12 <(decl a.js) <(decl b.js)
   ```
   Identical implementations → keep one. Same name, different meaning (two popups, two
   `addButton`s) → rename the absorbed one with a prefix.
3. **TRAP — match line endings.** The repo is mixed: 17 CRLF files, 14 LF, no pattern.
   Check both files (`git show HEAD:path | file -`, or count `\r\n` in Python) and convert
   the lifted text to the *host's* endings, or you get a mixed-ending file and every later
   exact-match edit fails confusingly. Check the trailing newline at EOF too — the two
   files may not agree, and the merged file should keep the host's convention.
4. **Move each half's guards.** A file-level `if (document.getElementById(ID)) return;`
   becomes a per-feature guard *inside* that feature's builder — otherwise one feature
   present suppresses the other. Same for a top-level pathname bail: it becomes a branch in
   the dispatcher at the end of the IIFE.
5. **TRAP — audit symbols after splicing.** `node --check` only parses; it will not tell
   you that you lifted `castMax()` but left `reload()` behind. Verify every name the lifted
   code uses is declared exactly once in the merged file, then smoke-run it (below).
6. **TRAP — repoint the tests, and fix their anchors.** Tests re-expose internals by string
   surgery on the source. All of them replace `'(function () {'` (safe — first occurrence
   is the host's opener). The *second* anchor is a literal call site — `'  boot();'`,
   `'addButton();'`, `'const puzzle = currentPuzzle();'` — and a merge moves or renames it.
   Update `readFileSync(join(here, '..', 'HOST.js'))` and switch the second anchor to the
   merge-proof form, with a pathname no dispatch branch matches:
   ```js
   .replace(/\}\)\(\);\s*$/, 'return { thingUnderTest }; })();');
   ```
7. **TRAP — check cross-file contracts.** Grep the whole repo for element ids and storage
   keys the absorbed file owned. Another script may reach across frames for one
   (`auto-mine.js` clicks `#tm-charpane-heal`). Keep such an id byte-identical.
8. **Metadata on the host:** bump `@version`, merge `@description`, union the `@match`
   lines (both bare and `www.` hosts), update `@name` if it no longer describes the file.
   Leave `@downloadURL` alone — the path did not change.
9. **Carry over the absorbed file's attribution.** A copyright or license line in its
   header (`// Original: Copyright 2010 Ian Walker, GPL v3 or later.`) and any ported-from
   credit must survive next to the code it covers. Losing it in a splice is a licensing
   regression, not a tidy-up. Merge the two change logs rather than dropping one.
10. **Delete the absorbed file.** No stub.
11. **Loader:** drop its `@require` from `all-in-one/<game>.js` and **bump the loader's
    `@version` by hand** — `bump-loaders.mjs` deliberately skips a loader you already
    edited. Check whether the `@match` union still needs the absorbed script's pages (it
    usually does — the host inherited them).
12. **TRAP — update `AGENTS.md`, not just `README.md`.** `AGENTS.md` documents invariants
    by filename and will now describe something that no longer exists. `README.md` needs
    the table row removed *and* a row added to **"Merged / removed scripts"** naming the
    host and the version that first carried the feature.
13. **Fix comment references in other scripts** — `git grep <old-basename>` catches these.
    A deliberate historical note ("was its own X before the merge") is fine; a live
    cross-reference is not.

## Splitting one back out

1. **Restore from the git object store, not `git checkout`** — git-tree writes are blocked
   here. Read the blob and write the bytes yourself, restoring the file's *original*
   working-tree line endings (blobs are always LF; the working tree may not be):
   ```sh
   git show HEAD:KingdomOfLoathing/foo.js   # then write, converting endings as needed
   ```
   Confirm with `git diff --stat HEAD -- <paths>` returning empty.
2. **Check the host's diff scope first.** If the host also carries unrelated changes, a
   wholesale restore discards them — revert only the merge hunks.
3. **Re-add the `@require`** in its original position in the loader.
4. **Do not roll the loader `@version` back** if other changes still ride on it.
5. **Drop that row from README's "Merged / removed scripts" table** — the file exists
   again — and restore whatever `AGENTS.md` invariant the merge had rewritten.
6. **Re-verify the invariant the split restores.** If two files are meant to hold
   byte-identical copies of a function, diff them and prove it.

## Verify

```sh
for f in */*.js all-in-one/*.js; do node --check "$f" || echo "FAIL $f"; done
for t in */test/*.test.mjs; do node "$t" | tail -1; done
node scripts/bump-loaders.mjs --check          # must exit 0
git grep -n '<deleted-basename>'                # only historical notes may remain
```

Read the test output rather than grepping it for one phrase: the suites end with three
different strings — `All passed`, `All checks passed.` and `all good` — so a
single-pattern check reports false failures.

Also confirm each `@downloadURL` still matches its own path (strip `\r` first — CRLF files
break a naive `$` anchor).

**Smoke-run each merged file** with `smoke.mjs` in this skill's directory, once per
pathname the file dispatches on. This is the step that catches a helper left behind in the
other file — `node --check` only parses and passes such a file:

```sh
node .claude/skills/merging-userscripts/smoke.mjs KingdomOfLoathing/iotm.js //topmenu.php
node .claude/skills/merging-userscripts/smoke.mjs KingdomOfLoathing/iotm.js //choice.php
```

Use a leading `//` on the pathname under Git Bash. A half you never ran is a half you
never checked, so cover every branch.

## Known gotcha

`scripts/bump-loaders.mjs` walks `git ls-files`, so a file deleted from the working tree
but still in the index used to crash it with `ENOENT`. It now skips missing files. If you
see that error, the guard was lost.

## Do not merge

- Scripts whose charters conflict. `quest-helper.js` never submits anything; an
  auto-solver does. Merging them puts the one rule that makes it safe next to code that
  breaks it.
- Scripts needing different `@grant`. `adventure-choices.js` uses `GM_*` and cannot join
  an `@grant none` file or the loader.
- Two features on the same page that share no code. Same page is not a reason; a shared
  helper is.
