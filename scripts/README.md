# scripts/

Maintenance helpers. No build tooling is required to ship userscripts; these
just automate a chore.

## bump-loaders.mjs

The loaders in `all-in-one/` pull each bundled script from GitHub via `@require`.
Userscript managers cache those required resources and only re-fetch them when
the **loader's own `@version`** increases. So changing, say, `iotm.js`
without bumping the matching loader means installed users never receive the update.

This script finds every loader (any tracked `.js` whose metadata block
`@require`s another file in this repo) and, when one of its required files has
changed, increments the loader's `@version`.

```sh
node scripts/bump-loaders.mjs            # working tree vs HEAD; bump in place
node scripts/bump-loaders.mjs --staged   # staged changes only; bump + git add the loader
node scripts/bump-loaders.mjs --check     # report only; exit 1 if a bump is needed (CI)
node scripts/bump-loaders.mjs --force      # bump every loader, ignoring change detection
node scripts/bump-loaders.mjs --force kingdom-of-loathing  # bump only loaders whose path contains "kingdom-of-loathing"
```

If the loader itself was already edited in the same changeset, the script leaves
its version alone — it assumes you bumped it deliberately.

### `--force`

Use this when you hand-edit a loader (or just want to push a fresh fetch without
touching a bundled file). It bumps the matched loader(s) unconditionally —
ignoring change detection *and* the "loader already edited" guard.

- Bare `--force` bumps every loader.
- `--force <text>` restricts to loaders whose repo path contains `<text>`
  (case-insensitive substring; repeatable, e.g. `--force kol --force th`).
- Aliases: `kol` → `kingdom-of-loathing`, `th` → `twilight-heroes`, `fl` → `fallen-london`.
- A `--force <text>` that matches no loader exits non-zero (likely a typo).
- Combine with `--staged` to also `git add` the bumped loader(s); with `--check`
  to preview without writing.

## pre-commit (git hook)

Runs `bump-loaders.mjs --staged` before each commit so the version bump is
included automatically. Install it once:

```sh
git config core.hooksPath scripts          # use scripts/ as the hooks dir, or
cp scripts/pre-commit .git/hooks/pre-commit # copy into the default location
```

Bypass for one commit with `git commit --no-verify`.
