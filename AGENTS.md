# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## What this is

A collection of standalone **userscripts** (Tampermonkey / Greasemonkey / Violentmonkey)
for three browser games:

- `KingdomOfLoathing/` — scripts for kingdomofloathing.com
- `TwilightHeroes/` — scripts for twilightheroes.com
- `FallenLondon/` — scripts for fallenlondon.com

- `all-in-one/` — one "loader" userscript per game (`kingdom-of-loathing.js`,
  `twilight-heroes.js`, `fallen-london.js`). Each carries no logic of its own; it
  `@require`s every individual script for that game from GitHub, so a single install
  pulls in the whole set. Bumping a loader is automated — see `scripts/bump-loaders.mjs`.

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

- **`@name` starts with the game's prefix** so a script sorts next to its siblings in the
  userscript manager's (alphabetical) list. Use exactly: `Twilight Heroes ` for `TwilightHeroes/`,
  `KoL ` for `KingdomOfLoathing/`, and `Fallen London ` for `FallenLondon/` (e.g.
  `Twilight Heroes Autobox`, `KoL Codpiece Button`, `Fallen London Wiki Links`). Keep the
  prefix identical across a game's scripts — don't expand `KoL` to `Kingdom of Loathing` for
  one script, or it'll sort away from the rest.
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

`autobox.js` is a *multi-page* TH script: its `main.php` branch injects the trigger button,
and its `criminology.php` branch drives the Black Box quest across the page reloads that each
form submission causes. The "run in progress" flag lives in `sessionStorage` (`th-autobox-active`)
— the same survive-the-reload pattern, but it spans navigation between two different pages, so
each branch is gated on `location.pathname` up front (also what makes it safe to bundle). The
quest-advancing logic it inherits from the legacy original is index-based (`forms.length > 3` →
submit `forms[2]`, else follow the first `<a>`) and is **unverified against the live page**;
preserve it faithfully rather than "improving" form heuristics you can't test in-game.

**Fallen London** is a different animal from the other two: a **single-page React app**.
There are no per-page URLs to `@match` — everything happens under `fallenlondon.com/*`, and
the game swaps storylets, branches and results into the DOM client-side without any page
navigation. Two consequences:

- A one-shot `document-idle` pass (the KoL/TH model) misses anything drawn after load.
  Scripts must re-scan on DOM changes — see `wiki-links.js`, which runs once and then on a
  debounced `MutationObserver(document.body, {childList, subtree})`, relying on a per-element
  `data-*` flag to stay idempotent across the repeated passes.
- `wiki-links.js`'s selectors are verified against real HTML. The wiki-link helper is confirmed
  (the wiki is MediaWiki; `wiki/Special:Search?search=...&go=Go` resolves exact titles and
  otherwise lands on search results). A storylet title shows up three ways, all badged: in a list
  it's `<h2 class="... storylet__heading">` inside `.media.storylet`; atop an opened storylet it's
  `<h1 class="... storylet-root__heading">` inside `.media--root`; and each opportunity card in hand,
  which has two layouts. In the compact (small-media) layout the card title is a bare
  `<h2 class="media__heading ...">` reached by scoping `.hand .small-card__body .media__heading`
  (the bare `.media__heading` alone would also hit the "Opportunity deck" label and storylet
  headings, so the `.hand` scope is what keeps it to in-hand cards). In the full-width layout the
  card is image-only with no heading — the title lives solely in `.hand__image`'s `alt`/`aria-label`
  — so it's handled by a separate `linkHandCards()` that reads that attribute and overlays a badge in
  the card corner (rather than the text-append path). The text selectors that go through `addBadge`
  live in one `TITLE_SELECTORS` array. Two things are deliberately NOT matched: the unscoped
  `.media__heading` (reused all over the SPA — would over-badge), and `.branch__title`, the per-choice
  titles inside an opened storylet (they're choices, not articles — left unlinked by request).

## Verifying a change

There is nothing to run here. Validate by reasoning about the DOM the script targets and,
when possible, by installing the edited file in a userscript manager against the live page.
Don't claim a script "works" from static review alone — say it's untested in-game.
