---
okf: 1
title: Shared hide-UI settings (KoL userscripts)
kind: reference
domain: kingdomofloathing.com
status: current
verified: 2026-10-01
see_also: [open-questions.md]
---

# Shared hide-UI settings

A way for several KoL userscripts to let the player switch off pieces of injected UI (the Mer-kin
button, IotM popup actions the player does not own) from one common place. Built into
`KingdomOfLoathing/iotm.js` 1.37 and `KingdomOfLoathing/quest-helper.js` 2.3 (loader 1.57). This
file records the contract so the feature can be rebuilt or moved into another script.

## What the player sees

- **account.php:** one box titled "Userscript settings", the last thing on the page, below KoL's own
  settings. Inside, one fieldset per script, sorted by script id, each a list of checkboxes labelled "Show <thing>".
  Checked means shown.
- **Menu row:** a small gear button (`⚙`, title "Userscript settings (account.php)") that opens
  `/account.php#tm-kol-settings` in the `mainpane` frame. The box does not exist yet when the browser
  handles that hash, so the script scrolls to it itself, and again on the window `load` event.
- A switch takes effect without a reload in the menu and sidebar frames.

## Storage

| Item | Value |
|---|---|
| `localStorage` key | `tm-kol-hidden-ui` |
| Shape | `{ "<scriptId>.<featureId>": true }` |
| Scope | per browser, shared by every character (KoL pages are one origin) |

Only hidden features are stored. A feature added later is therefore shown by default, and
"unhide" deletes the key. Every write re-reads the key first, so two scripts toggling never
overwrite each other. Corrupt JSON, a non-object value or blocked storage all read as "nothing
hidden"; a blocked write is swallowed.

## Shared code block

Each script carries its own copy of the code between the markers
`// --- BEGIN tm-kol-ui-settings (keep byte-identical across scripts) ---` and
`// --- END tm-kol-ui-settings ---`. There is no module system, so a copy per file is the only way
to share it. The copies must stay byte-identical, or behaviour starts depending on which script
loaded first. `tests/kol-ui-settings.test.mjs` fails if they differ.

| Function | Job |
|---|---|
| `kolUiHidden(scriptId, featureId)` | true when the player hid it |
| `kolUiSetHidden(scriptId, featureId, hidden)` | read-modify-write of the key |
| `kolUiOnChange(fn)` | runs `fn` when the key changes in another frame (`storage` event) |
| `kolUiSettingsSection(scriptId, title, features)` | on account.php: create the box once, add this script's fieldset once. `features` is `[{ id, label }]` |
| `kolUiSettingsGear()` | in the menu: add the gear once |

The block calls `getButtonRow()`, which is **not** inside it. Every script that carries the block
also needs the shared menu-row helper (see `AGENTS.md`, "The shared menu button row"); the three
copies of `getButtonRow()` (iotm, daily-checklist, quest-helper) must be byte-identical too, and
the test checks that as well.

## Injected once, whichever scripts are present

| Element id | Created by | Guard |
|---|---|---|
| `tm-kol-settings` (the box) | first script to reach account.php | later scripts find it by id and add their fieldset |
| `fieldset[data-tm-script="<scriptId>"]` | each script, once | skipped if already present |
| `tm-kol-settings-btn` (gear) | first script to reach the menu | later scripts return early |

The gear claims CSS `order:3` in `#tm-kol-menu-btns` (checklist 1, IotM 2). In text-mode topmenu,
where there is no row, it goes after `#tm-iotm-btn`, else `#tm-checklist-btn`, else the plain
`edit` link, else the top of the body. The gear is never itself hideable: it is the way back.

## Why `storage` events do the live update

KoL's frames are same-origin. The `storage` event fires in every other document that shares the
origin, and never in the one that wrote. So a checkbox on account.php (mainpane) reaches the
menu frame and charpane, and those frames re-apply their state. It does nothing for the account.php
page itself, which already shows the new state.

## Wiring a script in

1. Paste the block after `'use strict';`, and make sure a byte-identical `getButtonRow()` exists.
2. Add `account.php` to `@match` (both hosts). A script that has no menu code also needs
   `awesomemenu.php` and `topmenu.php` so its gear can load, and its page-gate regex must allow
   `awesomemenu|topmenu|account`.
3. Dispatch on the page. Menu frame: `kolUiSettingsGear()`. account.php:
   `kolUiSettingsSection('<scriptId>', '<Script name>', [{ id, label }, ...])`. Do this before any
   idempotency guard or puzzle code that would return early.
4. Gate each piece of UI on `!kolUiHidden('<scriptId>', '<featureId>')`, and register a
   `kolUiOnChange` handler that removes the piece when hidden and re-adds it when shown.
5. Hide UI only. Do not stop bookkeeping: quest-helper keeps filing dreadscroll clues with its
   Mer-kin button hidden.
6. Bump the script's `@version`, bump the loader by hand (it needs the account.php `@match`), and
   add the new copy to the byte-identical check in the test.

## Features wired so far

| Script id | Feature id | Hides |
|---|---|---|
| `iotm` | `button` | the IotM menu button |
| `iotm` | `codpiece`, `baseball`, `cup13`, `radiobackpack` | that action in the IotM popup (ids match `ACTIONS[].key`) |
| `quest-helper` | `merkin` | the Mer-kin charpane button (its wrapper `div` is removed with it) |
| `quest-helper` | `eightbit` | the 8-Bit Realm box (`#tm-8bit-advice`) |

Choice-page helpers (codpiece panel, Cup of 13s sort, supply drop table, rose garden map, puzzle
bars) are deliberately **not** switchable: they only appear inside their own choice.

## What was verified

**Verified** 2026-10-01 by the author in the live game: the feature works end to end (the box on
account.php, hiding and showing the covered pieces), and the gear fits the menu row. The first
version put the box above the page's first table, over KoL's own settings; it now goes last: the box shows at the bottom and a gear click scrolls to it, while opening
account.php directly (no hash) does not scroll, by design. The unit test covers the storage logic and the
byte-identical copies, not the DOM.

**Assumed**, not separately checked:

- Unhiding the 8-Bit box restores it at once; if not, the next charpane rebuild does.
- `window.open(url, 'mainpane')` targets the main frame by name in every browser.
