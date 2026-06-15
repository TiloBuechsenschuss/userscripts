# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## What this is

A collection of standalone **userscripts** (Tampermonkey / Greasemonkey / Violentmonkey)
for two browser games:

- `KingdomOfLoathing/` — scripts for kingdomofloathing.com
- `TwilightHeroes/` — scripts for twilightheroes.com

There is **no build, no bundler, no package manager, no test suite, and no lint config**.
Each `.js` file is the shippable artifact: a single self-contained IIFE prefixed with a
`// ==UserScript== ... // ==/UserScript==` metadata block. You edit the file, the user
reloads it in their userscript manager. "Running" a script means installing it in a
userscript manager and loading the matching game page — it cannot be exercised from this repo.

## Distribution model (important)

Each script carries a `@downloadURL` pointing at its own raw GitHub path on `main`, e.g.
`https://raw.githubusercontent.com/.../main/KingdomOfLoathing/codpiece.js`. Consequences:

- **The file's location in the repo is its public URL.** Renaming or moving a file breaks
  auto-updates for everyone who has it installed. If you move one, update its `@downloadURL`.
- **Bump `@version` on any user-facing change.** Userscript managers only pull updates when
  the remote `@version` is higher than the installed one. An edit without a version bump will
  not reach installed users.
- Keep the `@match` / `@include` lines in sync with the actual page(s) the script touches.
  Both bare and `www.` hosts are matched deliberately; preserve both.

## Conventions that recur across scripts

- One IIFE, `'use strict';`, no external dependencies, `@grant none` (plain page APIs only).
- **Idempotency guard**: before injecting UI, bail if the element already exists
  (e.g. `if (document.getElementById(...)) return;`). Scripts may run more than once per page.
- **Defensive DOM scraping**: these games emit legacy table/`<font>` HTML. Scripts locate
  anchors by walking from a known `<h2>`/icon, checking `colspan`/`width` attributes, etc.,
  with fallbacks rather than assuming a fixed structure. Match this style when extending them.
- Inline styles via `el.style.cssText`; no stylesheets.

## Game-specific notes

**Kingdom of Loathing** is **frameset-based**. The UI is split across `topmenu`/`awesomemenu`,
`charpane`, and `mainpane` frames. Two things follow:

- State you need may live in a *sibling frame* — see `codpiece.js` `getPwd()`, which probes
  inputs, page globals, links, `top.frames['charpane']`, and inline script text in turn.
- Any action-triggering request needs the player's **`pwd` hash** appended; without it the
  server rejects the request. Navigate `top.frames['mainpane']` to show results, or `fetch`
  with `credentials: 'same-origin'` to fire silently.
- **`choice.php` is shared by every choice adventure.** A script matching it must identify the
  specific choice before injecting anything — gate on the hidden `whichchoice` value (e.g.
  `codpiece.js` only acts when `input[name="whichchoice"][value="1588"]`, the Eternity Codpiece
  decoration screen, is present). `codpiece.js` also shows the pattern for applying several
  form submissions in one go: replay each slot's `Replace` form as a sequential
  `fetch(... credentials:'same-origin')` POST, then `location.reload()` once so the server stays
  authoritative about item availability rather than trusting the stale page. Named gem setups
  are persisted in `localStorage` under `tm-codpiece-setups`.

**Twilight Heroes** is plain (non-frame) pages scraped from table layout. State that must
survive the full-page reload after equip/unequip/use is stashed in `sessionStorage`
(see `inventory-filter.js`, keyed per page via `TEXT_KEY`/`TYPE_KEY`). That one script
serves several pages with the same `<td width=50%><b>name</b></td>` item layout
(wear.php, inventory.php, use.php) by matching all of them and locating the table from a
known `<h1>`/`<h2>` heading; extend `HEADINGS` rather than forking the file when another
such page turns up.

## Verifying a change

There is nothing to run here. Validate by reasoning about the DOM the script targets and,
when possible, by installing the edited file in a userscript manager against the live page.
Don't claim a script "works" from static review alone — say it's untested in-game.
