---
okf: 1
title: Shared show/hide settings (Fallen London userscripts)
kind: reference
domain: fallenlondon.com
status: current
verified: not yet in the live game
see_also: [open-questions.md, ../kingdom-of-loathing/hide-ui-settings.md]
---

# Shared show/hide settings

A way for the three Fallen London userscripts (`wiki-links.js` 0.9, `ux-enhancers.js` 3.5,
`choice-helper.js` 1.51, loader 0.75) to let the player switch off pieces of injected UI from one
place. It is the Fallen London counterpart of the Kingdom of Loathing one
(`../kingdom-of-loathing/hide-ui-settings.md`), changed where the two games differ: Fallen London
is one document with no frames, and one script holds about 150 features.

## What the player sees

- **⚙ UX → Settings** (always the last entry of the launcher menu). One collapsible section per
  category, each headed by a checkbox that shows a dash when only some of its features are shown,
  then one "Show <thing>" checkbox per feature. Checked means shown. Changes apply at once.
- Categories, in this order: Wiki links, UX tweaks, London, Airs of London, Zailing, Parabola,
  Firmament, Railway & beyond, **Seasonal** (festival and holiday content such as the Fruits of the
  Zee) and **Menu entries** (the panels in the ⚙ UX menu, switched separately from their badges).
- **Account page:** on `/account` a box titled "Userscript settings" is appended after the page's tabs (inside `div.account`, whatever tab is open). It needs no launcher, so it works with Choice Helper or Wiki Links alone. Each script calls `flUiMountAccountBox()` from `scan`; the first creates `#fl-ui-settings-box`, the rest redraw it only when the catalogue grows, and a re-render that drops it is repaired on the next scan.
- The ⚙ UX menu entry needs UX Enhancers (it owns the launcher).

## Storage

| Item | Value |
|---|---|
| `localStorage` key | `tm-fl-hidden-ui` |
| Shape | `{ "<scriptId>.<featureId>": true }` |
| Script ids | `wiki`, `ux`, `choice`, and `menu` for menu entries (feature id = panel id) |

Only hidden things are stored, so a feature added later is shown by default. Every write re-reads
the key first. Corrupt JSON, a non-object value, blocked storage, or no `window` at all read as
"nothing hidden", and a blocked write is swallowed.

## Shared code

Each script carries a copy of the code between `// --- BEGIN tm-fl-ui-settings` and
`// --- END tm-fl-ui-settings ---`, byte-identical (`tests/fl-ui-settings.test.mjs` checks it).
It uses plain DOM only, because `wiki-links.js` has none of the helpers the other two share.

| Function | Job |
|---|---|
| `flUiHidden(scriptId, featureId)` | true when the player hid it |
| `flUiSetHidden(scriptId, featureId, hidden)` | read-modify-write, then announces the change |
| `flUiOnChange(fn)` | runs `fn` on a switch, here (window event `fl-ui-settings-change`) or in another tab (`storage`) |
| `flUiRegister(scriptId, title, features)` | adds `[{ id, label, group }]` to the catalogue |
| `flUiRenderSettings()` | builds the settings view from the catalogue |

The catalogue is `window.__flUiFeatures`, on the page window (all three scripts are `@grant none`),
so the view lists whichever scripts are installed, in any load order. `storage` events never fire
in the document that wrote, and the game is one document, so `flUiSetHidden` raises the window
event itself.

## Features

An entry with a `group` can be switched off. Without one it cannot: the launcher (the way back),
and the captures `faction-capture`, `pending-item` and `fotz-capture`, which draw nothing.

- **`ux-enhancers.js`** files its two features in the entries. `equipment-helper` and
  `equipment-optimizer` carry an `off()` that removes their stars, summary line, BDR option and
  value, and Optimize button.
- **`choice-helper.js`** files its ~150 features in `FEATURE_GROUPS` (name lists per category) and
  `FEATURE_LABELS`; `scan` stamps `group` and `label` onto the entries. A new feature must be
  filed there, or `tests/fl-ui-settings.test.mjs` and the skill's `check.mjs` fail.
- **`wiki-links.js`** has one switch, `wiki.badge`, for the "W" badges.
- **Menu entries** are the panels of both scripts, registered under `menu`. `menuPanels()` leaves
  out the hidden ones and closes an open panel that has just been hidden. Settings is never
  hideable.

## Turning a feature off

- `scan` skips a hidden feature. An entry's optional `keep()` still runs, for state that is not UI:
  `fotz-card-ratings` keeps forgetting a stale dive depth.
- A badge drawn while a feature runs is stamped `data-fl-feature` and remembered with its host
  and flag (`attachBadge`, via `currentFeature`). When the feature is switched off,
  `clearFeatureBadges(name)` removes those badges and deletes the host flags, because
  `attachBadge` would otherwise see an unchanged key and never redraw. Switching on draws again on
  the next scan.
- A feature that draws other things has an `off()` that does the same for them
  (`fotz-depth-control`, `equipment-helper`, `equipment-optimizer`).
- Hidden `port-carnelian` and `university-laboratory` no longer start their background refresh,
  since it exists only to feed their badges.

## What was verified

**Unit tested** (`tests/fl-ui-settings.test.mjs`): the block copies, the storage rules, that every
feature is filed, the category order, the menu filter, and the badge stamp and sweep against a
stub DOM.

**Captured 2026-10-07** (`temp/capure-results/fl-capture-account.html`): the route is `/account`; the page is `div.content.container > div.account` holding `h1`, a tab list (`nav__list`, buttons `role=tab`) and `div.stack-content` with one tabpanel. An "Extensions" tab the capture shows is not ours.

**Not yet checked in the live game**: the account box,  the look and touch size of the settings view, that a
switch removes badges from a real hand at once, and that React does not fight the removal.
