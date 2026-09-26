---
okf: 1
title: The Fallen London web API
kind: reference
domain: fallenlondon.com
status: verified
verified: 2026-09-26
source: live capture of the game's own XHR traffic, plus one probe
see_also: [challenges.md, equipment.md, open-questions.md]
---

# The Fallen London web API

The game at `https://www.fallenlondon.com` is a single-page React app. It draws
everything from a JSON API on a separate host. The HTML routes (`/myself`,
`/possessions`) are an empty shell; there is nothing to parse in them.

## Base and authentication

| | |
|---|---|
| Base URL | `https://api.fallenlondon.com` |
| Header | `Authorization: Bearer <token>` (verified: a `GET /api/outfit` from the page with it returned 200) |
| Token | `localStorage.access_token` on `www.fallenlondon.com`. It may be stored with surrounding double quotes; strip them. |
| Same origin? | No, but the API answers requests made from a script running on `www.fallenlondon.com`. |
| Content type | JSON. `POST` bodies are JSON; a few `POST`s have no body at all. |

Never log the token, store it anywhere else, or send it to any host other than
`api.fallenlondon.com`. The recorder used to gather these facts did not capture
request headers for that reason.

## Endpoints seen

Verified means seen in the capture with the stated shape.

| Call | Body | What it does | Verified |
|---|---|---|---|
| `GET /api/character/myself` | none | Everything you own and every quality (about 350 KB). See below. | yes |
| `GET /api/outfit` | none | The current outfit: which item is worn in each slot. | yes |
| `POST /api/outfit/equip` | `{"qualityId": <item id>}` | Equips that item in its slot, replacing what was worn. Replies with the new outfit. | yes |
| `POST /api/outfit/unequip` | `{"qualityId": <id of the item worn>}` | Empties the slot that item is worn in. Replies with the new outfit, where that slot has no `qualityId`. | yes |
| `POST /api/outfit/change` | `{"outfitId": <saved outfit id>}` | Switches to a saved outfit. Replies with the new outfit. | yes |
| `POST /api/storylet` | none | The storylet you are currently in, with its branches. The game calls it after every navigation. Read-only in the capture. | yes |
| `POST /api/storylet/begin` | `{"eventId": <storylet id>}` | Opens a storylet from a list. | yes |
| `POST /api/storylet/goback` | none | Leaves the open storylet. | yes |
| `GET /api/opportunity` | none | The opportunity-card hand. | yes (shape not studied) |
| `POST /api/map/move` | `{"areaId": <id>}` | Moves you to an area. | yes (shape not studied) |
| `GET /api/plan` | none | Your plans. | yes (shape not studied) |
| `GET /api/messages` | none | Messages. | yes (shape not studied) |
| `GET /api/settings` | none | Settings. | yes (shape not studied) |

Calls that choose a branch or spend actions were never made during the capture
and their names are unknown. Nothing in this repository may call them.

## `GET /api/character/myself`

Top-level keys: `character`, `possessions`, `restrictedUserInterfaceElements`.

- `character`: `name`, `description`, `descriptiveText`, `avatarImage`,
  `currentDomicile` (`name`, `description`, `image`, `maxHandSize`),
  `outfits` (saved outfits: `{ name, selected, type, id }`), `mantelpieceItem`,
  `scrapbookStatus`, `actions`, `journalIsPrivate`, `user`, `canChangeOutfit`,
  `setting` (the area you are in: `name`, `canChangeOutfit`, `canOpenMap`,
  `canTravel`, `itemsUsableHere`, `isInfiniteDraw`, `id`), `id`.
- `possessions`: a list of groups `{ categories: [...], name, possessions: [...], image? }`.
  The groups are named after item categories (`Hat`, `Clothing`, ...) and
  after quality groups (`Menaces`, `Accomplishments`, ...). About 70 groups.
- Each possession: `id`, `name`, `nameAndLevel`, `category`, `nature`,
  `level`, `effectiveLevel`, `cap`, `equippable`, `enhancements`,
  `description`, `image`, `qualityPossessedId`, `himbleLevel`,
  `progressAsPercentage`, `allowedOn`, and sometimes `isOutfit`,
  `useEventId`, `isLoanable`, `bonusOrPenaltyDisplay` (e.g. `"+11"`),
  `levelDescription`, `availableAt`.

Stats such as Shadowy are possessions with `category: "BasicAbility"` and
`equippable: false`. Skills such as Mithridacy have `category: "Skills"`.
See [equipment.md](equipment.md) for what `level`, `effectiveLevel` and
`enhancements` mean.

## `GET /api/outfit` and the reply of `equip` / `change`

```json
{
  "slots": [
    { "name": "Hat", "qualityId": 312, "canChange": true, "isEffect": false, "isOutfit": true },
    { "name": "Luggage", "canChange": true, "isEffect": false, "isOutfit": true },
    { "name": "Boon", "canChange": false, "isEffect": true, "isOutfit": true }
  ],
  "dirty": false, "maxOutfits": 4, "isFavourite": false, "isSuccess": true
}
```

- `qualityId` is the id of the item worn in that slot; **absent means empty**.
  This is the only place the worn item is listed: the `myself` reply does not
  say which items are worn.
- `canChange: false` marks a slot the game will not let you change.
- `isEffect: true` marks `Boon` and `Burden`, which hold temporary effects, not
  equipment.
- `dirty` was `true` in the reply to `equip` and `false` in a later `GET`;
  what it means is unknown.
- `isSuccess` is `true` on success.

## `POST /api/storylet`

```json
{
  "canChangeOutfit": true,
  "phase": "In",
  "actions": 1,
  "storylet": {
    "id": 349254, "name": "...", "description": "...", "category": "...",
    "canGoBack": true, "isLocked": false,
    "childBranches": [ /* branches, below */ ],
    "qualityRequirements": [ /* requirements of the storylet itself */ ]
  },
  "hasUpdatedCharacter": false, "elapsed": 0, "isSuccess": true
}
```

- `phase: "In"` means you are inside a storylet. Other phases were not
  captured.
- `canChangeOutfit` says whether the game lets you change outfit right now.
  It was `true` in every captured storylet.

### A branch (one action)

Keys: `id`, `name`, `description`, `planKey`, `currencyCost`, `actionCost`,
`buttonText`, `challenges`, `qualityRequirements`, `actionLocked`,
`currencyLocked`, `qualityLocked`, `isLocked`, `ordering`, `image`.
`data-branch-id` on the page's `.branch` element is this `id`.

### A challenge

```json
{ "name": "Mithridacy", "targetNumber": 60,
  "description": "A <em class='diff4'>chancy</em> challenge",
  "category": "Skills", "nature": "Status", "type": "Challenge",
  "canAffordSecondChance": false, "secondChanceId": 0, "secondChanceLevel": 0,
  "bonuses": [], "image": "mithridacy_sidebar", "id": 349191 }
```

`targetNumber` is the **percentage chance the game shows**, not a difficulty.
No difficulty and no broad/narrow flag is sent. See
[challenges.md](challenges.md).

### A quality requirement

```json
{ "allowedOn": "Character", "qualityId": 143583, "qualityName": "Airs of Industry",
  "tooltip": "You unlocked this with <span class='quality-name'>Airs of Industry</span> 42 <em>(you needed 30-70)</em>",
  "category": "Randomizer", "nature": "Status", "status": "Unlocked",
  "bonuses": [], "image": "chimneys", "id": 349139 }
```

`status` is `"Unlocked"` or `"Locked"`. The `tooltip` (HTML stripped) takes these
wordings, all verbatim from the capture:

| Status | Wording | Meaning |
|---|---|---|
| Unlocked | `You unlocked this with Airs of Industry 42 (you needed 30-70)` | level must be in 30..70 |
| Unlocked | `You unlocked this with Dangerous 183 (you needed 70)` | at least 70 |
| Unlocked | `You unlocked this with The Airs of London 1 (you needed 50 at most)` | at most 50 |
| Unlocked | `You unlocked this with any Time Passing in Office (you needed exactly 0)` | exactly 0 |
| Unlocked | `You unlocked this with A Crooked Cross (you have 1 in all)` | an item you hold |
| Unlocked | `You unlocked this by not having any An Absentee Governor` | you must not have it |
| Unlocked | `Unlocked when A Person of Some Importance - is: A Significant Individual...` | an accomplishment state |
| Locked | `You need A Church in the Wild 50` | at least 50 |
| Locked | `You need Renown: Rubbery Men 25 (you have 18)` | at least 25, you have 18 |
| Locked | `Unlocked when A Professional Specialisation is: Schismatic` | an accomplishment state |


## Etiquette

The game's own client makes these calls, so making them from a userscript is
the same traffic. Keep it the same: one request at a time, no polling, only
the endpoints listed above, and never one that spends an action.
