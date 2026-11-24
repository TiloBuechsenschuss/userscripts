---
okf: 1
title: Equipment, outfits and effective levels
kind: model
domain: fallenlondon.com
status: verified
verified: 2026-09-26
source: four outfit states, each read from the API right after an equip or a saved-outfit switch
see_also: [api.md, challenges.md, open-questions.md]
---

# Equipment, outfits and effective levels

## Effective level and base level

Every stat (and skill) possession has two numbers:

- `level`: the base level, from your progress.
- `effectiveLevel`: the level the game uses for challenges, with the gear you
  wear (and any other bonus) included. `bonusOrPenaltyDisplay` is their
  difference as text (`"+11"`).

**Verified** in four outfit states, five stats each (20 of 20 comparisons):
`effectiveLevel - level` equals the sum of the `enhancements` for that stat of
every item worn. So for a set of slots you control:

```
base = effectiveLevel - sum of the worn items' bonuses in those slots
```

and the effective level under another outfit is `base` plus that outfit's
bonuses. A real swap, checked: Iron Hat (id 304: Dangerous +5, Persuasive -1)
to Beguiling Mask (id 310: Dangerous -1, Persuasive +6) moved Dangerous
189 to 183 and Persuasive 263 to 270, exactly the two items' bonuses.

## Items

An item is a possession with `equippable: true`. Its stat bonuses are in
`enhancements`: `[{ qualityName, qualityId, level, category, affectsPyramid }]`.
`level` there is the bonus (negative for a penalty). `id` is the number to send
to `equip`. **Equip by `id`**, not by name.

Some enhancements name things that are not levels (Respectable, menaces). Only
the ones a challenge is tested on matter for chances.

## Slots

The outfit lists 21 slots, in this order: Boon, Burden, Hat, Clothing,
Adornment, Gloves, Weapon, Boots, Luggage, Companion, Treasure, Destiny,
ToolOfTheTrade, Affiliation, Transportation, Home Comfort, Ship, Crew, Airship,
Spouse, Club.

- **Fixed** (`canChange: false`): Boon, Burden (temporary effects, `isEffect`),
  Destiny, Ship, Airship, Spouse, Club.
- **Changeable equipment slots**: Hat, Clothing, Adornment, Gloves, Weapon,
  Boots, Luggage, Companion, Treasure, ToolOfTheTrade, Affiliation,
  Transportation, Home Comfort, Crew.
- Every slot holds one item. No group held more than one.

### Which items go in a slot

The item's `category` is the slot's name with the spaces removed (`Home Comfort`
is `HomeComfort`), with one exception: the slot **Spouse** takes category
**ConstantCompanion**. Verified for all 30 worn items in two outfit states (16 and 14).
Categories seen on equippable items: Hat, Clothing, Gloves, Weapon, Boots, Companion, Destiny,
Affiliation, Transportation, HomeComfort, Ship, ConstantCompanion, Club,
ToolOfTheTrade, Adornment, Luggage, Crew.

## What is worn

- `GET /api/outfit` lists the worn item per slot (`qualityId`; absent = empty).
- The `myself` reply does **not** say what is worn. Its `isOutfit` flag is not
  it: 56 items were flagged, against 16 worn.
- The Possessions page marks the worn item `.equipped-item` (see the
  `equipment-helper` section of `AGENTS.md`); the API is the way to read it
  without opening that page.

## Equipping

- `POST /api/outfit/equip` with `{"qualityId": <id>}` puts that item in its
  slot. The reply is the new outfit; check `isSuccess` and that the slot now
  shows the id.
- **Verified** that equipping an item replaces the worn one.
- `POST /api/outfit/unequip` with `{"qualityId": <the item worn>}` empties its
  slot. It takes the id of the **item**, not the slot. The reply is the new
  outfit, with that slot's `qualityId` missing. Verified on the Adornment slot
  (2026-09-26): the stat levels dropped by exactly the item's bonuses (Watchful
  258 to 266 when it went back on: +8, the item's Watchful +8), and the click on a
  worn item in the Possessions page is what sends it.
- `POST /api/outfit/change` with `{"outfitId": ...}` switches to a saved outfit.
  `character.outfits` lists them (`{ name, selected, type, id }`) and
  `maxOutfits` was 4. See "Saved outfits" below.
- `canChangeOutfit` (on `character`, on `character.setting` and on the storylet reply)
  says whether the game allows it now.
- **Assumed:** after an equip made through the API the game's own copy of your
  character (Possessions, sidebar) stays as it was until something refetches it,
  because the page only refreshes what it changed itself. Two ways to get a
  consistent page: reload it (F5 during a storylet returns the same storylet,
  verified by hand), or make the change through the game's own screens (click
  the items on the Possessions tab, then go back: the Story tab refetches
  `GET /api/opportunity` and `POST /api/storylet` on arrival, seen in the
  capture). Neither route has been tried after an API equip.

## Saved outfits

**Verified 2026-11-24** with the outfit capture guide
(`docs/tools/fallen-london/outfit-capture-guide.md`) on one account.

- **No auto-save.** An equip or unequip changes what you wear, not the selected
  saved outfit. The outfit reply then says `dirty: true`, and the save button
  next to the dropdown is enabled. Switching to another outfit drops the
  unsaved change without asking: switching back brings back the saved item.
- **Saving** is a separate button (`.buttonlet-save-outfit`, disabled while
  nothing is changed). It sends `POST /api/outfit/save` with no body, so it
  always saves into the **selected** outfit. The reply is the outfit reply with
  `dirty: false`. The page refetched nothing after it (only `GET /api/messages`).
  Verified twice on 2026-11-24 (save with a spare hat, then save the original
  back).
- **Renaming:** `POST /api/outfit/rename {"outfitId": n, "newName": "..."}`.
  Letter case is kept. The page takes up to 21 characters (`maxlength="21"`).
  The page refuses a name another outfit already has (tooltip, no call sent);
  whether the server would refuse it too is not known. The page did not refetch
  the outfit list after a rename.
- **No create, no delete.** The controls are the dropdown, a favourite star,
  edit name, save, and "Equip Highest". The outfits are fixed places; the
  account seen has 17, although the outfit reply says `maxOutfits: 4`.
- `type` is one of `Standard`, `Purchased`, `GivenInGame`, `Exceptional`,
  `EnhancedExceptional`. *Our reading:* how the place was obtained.
- **The outfit control on Possessions** (`.outfit-controls`):
  - a react-select dropdown, plus a visually hidden
    `<select id="a11y-outfit-dropdown">` whose `<option value>` is the outfit
    id and whose text is `Name (type)`;
  - picking an outfit sends `POST /api/outfit/change`, then the page refetches
    `GET /api/plan` and `GET /api/character/myself` and redraws the item list
    without a reload;
  - the pencil button (`.buttonlet-edit`) swaps the dropdown for
    `form.outfit-controls__outfit-rename-form`: an input
    (`.outfit-controls__outfit-rename-field`), a check button
    (`.buttonlet-check`) and a cancel button (`.buttonlet-delete`, an ×).
    The script (3.13) drives this form and the save button after a store; see
    "What the script does with saved outfits". Unverified in game.
  - Not verified: whether a script can switch outfits by setting the hidden
    select, or must open the react-select menu and click the option.

## Items that ask before equipping

Clicking a spare item on the Possessions tab does not always equip it. An item
that "may be used or equipped" (the Ridiculous Hat, captured 2026-09-26) opens a
popup instead. **Verified markup:**

```
.ReactModal__Overlay
  .ReactModal__Content[role="dialog"][tabindex="-1"][aria-modal="true"]
    .tooltip--item-modal
      .icon.tooltip__icon > img[alt=<item name>]
      .tooltip__desc
        p.item__name
        p "This item may be used or equipped."
        .tooltip__buttons
          button "Use"
          button "Equip"
```

- **"Use" spends or activates the item.** Automation must click only the button
  reading exactly "Equip".
- There is no Close button. react-modal closes on Escape (on the focused dialog)
  or on a click on `.ReactModal__Overlay`.
- **Unknown:** whether a worn item can open a similar popup with an Unequip
  button. Clicking a worn item in the Adornment slot emptied it directly.
- The API `POST /api/outfit/equip` does not go through this popup.

## What the script does with saved outfits

`ux-enhancers.js` 3.13 uses the saved outfits to avoid equipping by hand: it switches to an outfit
named for the stat (or to a `temp` outfit that holds the stat set), and stores improvements into a free
`temp` outfit. When it changed the outfit through the Possessions page, it renames with the pencil /
check form (setting the field through the native value setter and an `input` event) and saves with the
save button, then goes back to the story; after the first step the page does not take (a save button
already disabled counts as one), or in a run that already used the API, the rest of the store uses the
rename and save calls instead. Driving that form and button is **not verified in the real game**. It never writes to an outfit that is not a temp: `temp` (any
case) followed by the end of the name, a digit or a capital letter (`temp1`, `tempGlaWat`; not
"Tempest" or "Temple Club"). Every
switch is confirmed by the selected id from `GET /api/character/myself`. **Not verified in the real
game yet**, for the API fallback path only (rename and save calls): whether the page's dropdown and
save button show the new state after an API rename or save without the game refetching.
