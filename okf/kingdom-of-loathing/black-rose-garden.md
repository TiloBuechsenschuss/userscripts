---
okf: 1
title: Black Rose Garden page data
kind: reference
domain: kingdomofloathing.com
status: current
verified: 2026-10-01
see_also: [open-questions.md]
---

# Black Rose Garden page data

Used by the top-down map, which ships twice: inside `KingdomOfLoathing/iotm.js` (so also in the
all-in-one loader) and as the extra offer `KingdomOfLoathing/standalone/black-rose-garden.js` for players who want
only the map. The code is identical in both (`tests/black-rose-garden.test.mjs` checks it); they
share the `tm-iotm-rosegarden` storage key and the `tm-rosegarden` element id, so installing both
draws one map.

The garden is choice 1637 (`choice.php`, reached from the campground after using a black
garden rose). Its first-person view is drawn by the game's own `rosegarden.<date>.js` from a
global the page writes inline.

## The `RG` object

**Verified** 2026-10-01 against a saved page of a finished garden and the header comment of
`rosegarden.20261001a.js`.

| Field | Shape |
|---|---|
| `w` | grid width, 31 (grid is 31 x 31 = 961 chars, row-major) |
| `grid` | one char per cell: `0` floor, `1` wall, `2` rocks, `3` decor (walkable), `4` poi, `8` start, `5`/`6`/`7` other wall art |
| `pos` | `{x, y, f}`; `f` is 0 north, 1 east, 2 south, 3 west |
| `pois` | `[{i, x, y, k, d, label, img?, frames?}]`; `k` is monster, fountain, food, booze, spleen or chest; `d` is 1 once dealt with |
| `plaques` | `[{x, y, f, icon}]`; on the face of wall cell (x, y) seen while facing `f`; `icon` is an `icon_<letter>.png` name or empty for a blank plaque |

Walls are `1`, `5`, `6`, `7`. Only a pending monster blocks movement; every other poi is walked
over and used from the next cell.

## Position save

**Verified** (read from the renderer source). Whenever a run of moves ends the renderer sends
`POST choice.php` with `whichchoice=1637&pwd=...&option=4&rgx=X&rgy=Y&rgf=F`; the reply is
ignored. Using a poi submits a form and reloads the page with a fresh `RG`.

## Plaque letters

**Verified** against the wiki gallery: `icon_a.png` is A through `icon_z.png` is Z. What the
letters spell, and what they unlock, is not recorded here.

## Wiki

Monsters listed on the wiki page: rose golem, giant flamingo statue, rose garden gnome,
hollow-eyed angel statue, rose garden ghost. The page itself is a stub.
