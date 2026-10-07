---
okf: 1
title: Rare-monster watch list (KoL userscripts)
kind: reference
domain: kingdomofloathing.com
status: current
updated: 2026-10-07
see_also: [hide-ui-settings.md, open-questions.md]
---

# Rare-monster watch list

Monsters the player wants flagged. `ux-enhancers.js` 1.27 draws a banner on `fight.php` and edits the list on `account.php`;
`auto-combat.js` 0.10 stops the run instead of attacking one.

## Where the list is edited

- **fight.php:** `☆ watch <name>` on an unwatched monster, `unwatch` on a watched one, and an `edit list` link to the settings panel.
- **account.php:** a "KoL UX Enhancers — rare monsters" fieldset in the shared `#tm-kol-settings` panel (the one in `hide-ui-settings.md`): every watched monster with `[remove]`, and name + note + Add. `ux-enhancers.js` does not carry the shared block, so it finds the panel by id and builds it with the same look if it ran first.

## Storage

| Item | Value |
|---|---|
| `localStorage` key | `tm-kol-rare-monsters` |
| Shape | `{ "added": [{ "name", "note" }], "removed": ["name"] }` |
| Scope | per browser, shared by every character |

Names are normalised: lower case, spaces collapsed, one leading `a`/`an`/`the` dropped (KoL prints
`a rampaging adding machine`). `removed` exists so a built-in can be unwatched without a code
change. Corrupt JSON, a wrong shape or blocked storage all read as "built-ins only".

## Shared code block

Both scripts carry the code between `// --- BEGIN tm-kol-rare-monsters (keep byte-identical across
scripts) ---` and `// --- END tm-kol-rare-monsters ---`. `tests/kol-rare-monsters.test.mjs` fails if
the copies differ.

## Built-ins

| Monster | Why | Source |
|---|---|---|
| rampaging adding machine | combines scrolls; auto-attack aborts against it | **verified** against the KoL wiki page, 2026-10-07 |

## Open

- **unknown:** auto-combat only checks the first round of a fight; not captured whether a fight
  can start with a different monster name in `#monname` than a later round.
