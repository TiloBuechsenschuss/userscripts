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

## fetch-kol-item-yields.mjs

Regenerates `data/kol-use-yields-items.tsv`, the list of Kingdom of Loathing items
that hand you other items or Meat when used (the Mer-kin foodbucket, gift packages,
scrolls, the old leather wallet, and so on).

The list is derived, not curated. Every such payout is written on the wiki as an
`{{acquire|item=...|num=...}}` or `{{meat|amount=...}}` template inside the article's
"When Used" section, so the script walks `Category:Usable Items` plus its
subcategories, pulls each member's raw wikitext through the MediaWiki API, and reads
those templates out of that section. `{{meat|type=lose|...}}` is what an item *costs*
you, not a payout, and is not counted.

Scope is deliberately items you **use**. Food and drink are not in
`Category:Usable Items` and are not crawled, so `hell ramen` — which pays Meat when
eaten — is absent by design; including it would mean pulling in every consumable.

```sh
node scripts/fetch-kol-item-yields.mjs                 # rewrite the data file
node scripts/fetch-kol-item-yields.mjs --check         # exit 1 if the data file is stale
node scripts/fetch-kol-item-yields.mjs --print-ids     # re-emit the flat id list
node scripts/fetch-kol-item-yields.mjs --print-classes # ... grouped, for YIELD_CLASSES
```

Both print modes read the data file back (no wiki traffic) and emit the item ids worth
filtering on, wrapped ready to paste into `KingdomOfLoathing/ux-enhancers.js` —
`--print-classes` into the `YIELD_CLASSES` map its "pays out" filter and "group by type"
box use, `--print-ids` as one flat list. Self-transform-only rows are left out of both.
When you refresh the data file, re-emit the list too and bump the userscript's
`@version`.

Columns are `item`, `itemid`, `class`, `self_transform`, `meat`, `multiuse`, `yields`. `self_transform`
describes the *item* yields only — it separates the ones that just turn into
themselves in another state, a book becoming `<book> (used)`, from the ones that
produce genuinely different items: `all`, `part` (mixed, with the self-transforming
yields prefixed `*`), or `no`. Quantities and Meat amounts keep the wiki's own
wording, including ranges (`x0-3`, `400-600`) and vague counts (`xsome`, `some`).

Coverage of the Meat side was checked against the wiki's own
`Template:Meat-Producing Items` navbox: every item it lists is in the data file
except the two foods, which are out of scope as above.

The wiki answers 403 to unrecognised User-Agents, so the script sends a browser one.
A full run is ~70 API requests over ~3,400 pages and takes a couple of minutes.
