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
  `maxOutfits` was 4.
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
