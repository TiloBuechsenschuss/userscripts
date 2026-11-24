---
okf: 1
title: What FL Small Mercies' source says about the game
kind: reference
domain: fallenlondon.com
status: third-party
updated: 2026-11-24
source: source code of https://github.com/lensvol/fl-small-mercies at commit 0ca935a (committed 2026-11-06, version 3.5.0), read 2026-11-24; a live check against the repository is recommended before relying on any of it
see_also: [api.md, open-questions.md, ../../docs/fl-small-mercies/reference.md]
---

# What FL Small Mercies' source says about the game

FL Small Mercies is a browser extension that reads (and partly rewrites) the
game's own API traffic. Its TypeScript types and handlers imply facts about the
game that our own captures do not cover. They are collected here.

**Everything in this file is assumed.** It was read out of someone else's
source on 2026-11-24, not checked against a capture of ours, and the project
changes: **check the live repository first**, then check the fact with a capture
before code depends on it. When a capture confirms one, move it into
[api.md](api.md) (or the right file) as verified and delete it here.

What the extension is and does, feature by feature:
[docs/fl-small-mercies/reference.md](../../docs/fl-small-mercies/reference.md).

## How the game's API traffic can be observed

| Claim | Status |
|---|---|
| The game makes its calls to `api.fallenlondon.com` with `XMLHttpRequest`. The extension patches only `XMLHttpRequest.prototype.open` and `.send`, never `fetch`, and all its network-based features work. | assumed |
| A listener added to an XHR inside a wrapped `open` runs before the game's own handler, so replacing `responseText` on that instance (made writable with `Object.defineProperty`) changes what the game reads. | assumed |
| The game requests `GET /api/character/myself` while booting, early enough that a script installed after the page's modules start can miss it; it is requested again later "depending on some conditions" the author did not list. | assumed (the author's comment in `early_sniffer.js`) |
| The login token may be in `sessionStorage.access_token` when it is not in `localStorage.access_token`. | assumed |
| The replies of `/api/login` and `/api/login/user` carry the current token as `jwt`. | assumed |

Our scripts are `@grant none` and `@run-at document-idle`; whether an
interceptor can be installed early enough from a userscript is an open
question, in [open-questions.md](open-questions.md).

## Endpoints not in api.md

Path only: the extension keys on the path and never records the method. Not
one of these has been called or captured by us.

| Path | What its handler implies | Status |
|---|---|---|
| `/api/login`, `/api/login/user` | Reply: `{ jwt, user: { id, name, emailAddress, nex, createdAt, hasMessagingEmail }, area, hasCharacter, privilegeLevel, shouldDisplayAuthNag, isSuccess }`. | assumed |
| `/api/character/actions` | Reply: `{ actions, actionBankSize, nextActionAt, currentTime }`. A small way to get the action count. | assumed |
| `/api/storylet/choosebranch` | Choosing a branch. Request body `{ branchId, secondChanceIds: [] }`. Reply: below. **Never call it:** api.md's rule against calls that spend actions stands. | assumed |
| `/api/agents/branch` | An agent's branch result; handled like a `choosebranch` reply (has `messages`). | assumed |
| `/api/outfit/equipHighest` | Reply is an outfit (`slots`, ...), like `equip`. Request body and exact effect unknown. | assumed |
| `/api/map` | Reply: `{ currentArea, areas: [area], isSuccess }`; an area has `id, name, description, unavailableDescription, image, areaKey, parentAreaKey, childAreas, canMoveTo, discovered, unlocked, premiumSubRequired, showOps, canChangeOutfit, ...`. `isSuccess` can be false with no areas. | assumed |
| `/api/exchange/buy`, `/api/exchange/sell` | Reply: `{ isSuccess, message, possessionsChanged: [possession] }`. | assumed |
| `/api/opportunity/draw`, `/api/opportunity/discard` | Reply has the same shape as `GET /api/opportunity`. | assumed |
| `/api/infobar`, `/api/infobar/snippets` | Reply: `{ snippets: [{ id, title, description, image }], advert: { image, altText, url } }`, or for the second possibly the bare array. | assumed |

## Reply shapes we had not studied

### `GET /api/opportunity` (and draw / discard)

`{ isSuccess, isInAStorylet, displayCards: [card], eligibleForCardsCount,
maxHandSize, maxDeckSize, currency, nextActionAt, currentTime }`; a card is
`{ eventId, name, category, teaser, image, isAutoFire, stickiness,
unlockedWithDescription, qualityRequirements }`. Status: assumed.

### `POST /api/storylet` outside a storylet

When you are not in a storylet, the reply has **`storylets`** (a list) instead of
`storylet`, with `phase` (`"Available"`), `actions`, `canChangeOutfit`,
`hasUpdatedCharacter`. Phases handled: `Available`, `In`, `End`. A storylet in
the list has `deckType`, `distribution`, `urgency`, `category` (gold-framed ones
are `"Premium"`), `teaser`, `qualityRequirements`. Status: assumed; api.md has
only the `In` reply, from our capture.

### A `choosebranch` reply

`{ isSuccess, actions, phase, elapsed, messages: [...], endStorylet?, storylet?,
setting, canChangeOutfit, hasUpdatedCharacter }`. `endStorylet` is
`{ rootEventId, event: { id, name, description, image, deckType }, canGoAgain,
isLinkingEvent, isDirectLinkingEvent }`. `elapsed` is used as the number of
actions the branch took. Status: assumed.

Each message has `type`, `message` (HTML), and usually `image`, `tooltip`,
`priority`:

| `type` | Extra fields | Notes |
|---|---|---|
| `DifficultyRollSuccessMessage`, `DifficultyRollFailureMessage` | | The roll text. |
| `StandardQualityChangeMessage` | `possession`, `changeType` (`Increased`, `Decreased`, `Gained`, `Lost`, `Unaltered`) | Text like "You've gained 5 x Penny (new total 1,234)". |
| `PyramidQualityChangeMessage` | `possession`, `changeType`, `progressBar: { type: "Pyramid", leftScore, rightScore, startPercentage, endPercentage }` | Tooltip like "N change points, M more needed to reach level L". `Unaltered` means change points moved but the level did not. When a quality changes twice in one result, both messages carry the same final `possession`; only the progress bar tells them apart. |
| `QualityExplicitlySetMessage` | `possession`, `changeType` | A quality set to a value; on `Lost` the old amount is not in the message. |
| `QualityCapMessage` | `possession`, `changeType`, `isSidebar?` | |
| `AreaChangeMessage` | `area` | You moved. |
| `SettingChangeMessage` | `setting` | You changed setting. |
| `InfoMessage` | | Plain text. |
| `LivingStoryStartedMessage` | | |

`possession` is a full quality as in `/myself`, **with its new level**, so a
reply carries enough to update a cached `/myself` without fetching it again.
Status: assumed (it is what the extension relies on).

### Auto-fire opportunity cards

An auto-fire card's result arrives as the reply to `POST /api/storylet/begin`,
with `phase: "End"` and `messages`, i.e. shaped like a `choosebranch` reply.
Status: assumed (the author's comment in `cp_annotation.ts`).

### Plans and world qualities

`GET /api/plan`: `{ isSuccess, active: [plan], complete: [plan] }`, a plan being
`{ id, areaName, branch }`. A requirement with `allowedOn: "World"` has the
current value inside its tooltip HTML as `<li class='current'>…</li>`. Status:
assumed.

## Page facts

| Claim | Status |
|---|---|
| On the Myself tab the quality icons carry the quality id in `data-branch-id` (the game reuses the attribute). | assumed |
| `localStorage.hidden_storylets` is the game's own record of hidden storylets: JSON `{ "<settingId>": [storyletId, ...] }`. The extension writes to it. | assumed |
| London's setting id is 2. | assumed |
| The Account screen's section list is `ul[aria-label='Account sections']`, its panel `div[role='tabpanel']`. | assumed |

## IDs it hard-codes

Quality ids: Watchful 209, Shadowy 210, Dangerous 211, Persuasive 212, Wounds
214, Scandal 215, Suspicion 216, Nightmares 217, Penny 22390 (100 per Echo),
Hinterland Scrip 125025, Directions to a Hidden Stash 144084. Setting ids:
Khanate (Inner) 107955, Khanate (Copper Quarter) 107959, Irem 107975, The Far
Hinterland 107982, Hallow's Throat 107987, Midnight Moon 107989, Queeneater's
108001; area Arbor 110903. Status: assumed (from the source; the comments
name them).

Change points: reaching level *n* of a pyramidal quality costs 1+2+…+*n*,
with each step capped at 50, or at 70 for the four main stats. Status: assumed.
