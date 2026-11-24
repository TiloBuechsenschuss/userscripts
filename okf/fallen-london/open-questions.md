---
okf: 1
title: Open questions about Fallen London
kind: open-questions
domain: fallenlondon.com
status: open
updated: 2026-11-24
see_also: [api.md, challenges.md, equipment.md, agents-tab.md, fl-small-mercies.md]
---

# Open questions

Each entry says what is unknown, why it matters, what the code does meanwhile,
and what capture would settle it. When one is settled, move the fact into the
right file and delete the entry.

## Observing the game's own API traffic from a userscript

Raised 2026-11-24 by reading FL Small Mercies (see
[fl-small-mercies.md](fl-small-mercies.md), commit `0ca935a`; check the live
repository first, it may have changed).

- **Unknown:** whether the game makes its `api.fallenlondon.com` calls with
  `XMLHttpRequest` only, or also with `fetch`. Our recorder wrapped both and did
  not note which one each call came through; the extension wraps only XHR.
  *Partial answer (2026-11-24):* in the outfit capture every call came through
  XHR (`outfit/change`, `outfit/equip`, `outfit/rename`, `plan`, `messages`,
  `character/myself`). A page load and storylet calls were not in it.
- **Unknown:** whether a `@grant none`, `@run-at document-start` userscript is
  injected into the page early enough to wrap `XMLHttpRequest` before the
  game's first `GET /api/character/myself`, in each userscript manager we
  support (Tampermonkey, Violentmonkey, Greasemonkey).
- **Unknown:** which actions make the game fetch `/api/character/myself` again,
  so how stale a copy observed at boot gets. *Seen 2026-11-24:* an outfit switch
  and an equip on Possessions each did; a rename did not.
- **Unknown:** the method, body and effect of `/api/outfit/equipHighest`.
- **Matters:** observing the replies the game already fetches would replace our
  own `GET /api/character/myself` (about 350 KB) and the hidden-iframe tab
  loads with zero extra requests.
- **Meanwhile:** nothing depends on it; the scripts fetch or load tabs as before.
- **Capture:** run the recorder with its log noting `xhr` or `fetch` per call,
  through a page load and a few actions; and a `document-start` script per
  manager that logs whether its wrapper saw the boot `/myself`.

## The Agents tab

- **Unknown:** what `/agents` shows a character with no Agents, or one who has
  not unlocked them (an empty list with "0/N Active Plots", a different page,
  or a redirect), and what a filled equipment slot on an agent looks like.
- **Matters:** `readAgents` waits for the "Active Plots" count; a page without
  one reads as a failure, which is banked and retried after an hour rather than
  read as "no agents".
- **Meanwhile:** the Hallowmas panel says "Agents tab could not be read" and
  keeps the Infiltrator row conditional.
- **Capture:** `/agents` on a character with no Agents, and on one with an item
  equipped on an agent.
- **Unknown:** whether an Agent ever shows on the Possessions tab. Nothing
  depends on it any more.

## Challenges that combine stats

- **Unknown:** how a weighted challenge (Shadowy x1 plus Neathproofed x15) is
  sent. All 15 captured challenges had `bonuses: []`.
- **Matters:** the per-stat model would optimise the wrong thing for them.
- **Meanwhile:** a challenge with a non-empty `bonuses` is not modelled.
- **Capture:** open *Use furniture as stepping stones* (or any action known to
  add stats) with the recorder running.

## Do all challenges have to pass?

- **Assumed:** yes, so the chance is the product. Not shown by the capture.
- **Capture:** compare the game's own account of an action with two challenges
  (the wiki guide for the storylet, or a few attempts recorded).

## Kind of non-BasicAbility, non-Skills challenges

- **Unknown:** whether Luck, advanced-skill and other categories follow the
  BasicAbility-broad, Skills-narrow rule.
- **Meanwhile:** the rule, then the check of the prediction against what the
  game shows after an outfit change.
- **Capture:** the same storylet under two outfits, for one such challenge.

## Unlocking an action with equipment

- **Known now:** the wording of locked requirements (see [api.md](api.md)).
- **Unknown:** whether a requirement on a stat can be met by gear in practice
  (no locked stat requirement was captured; the locked ones seen were on story
  qualities, renown and accomplishments).
- **Matters:** the optimizer does not try to unlock anything; it only guards a
  met requirement on a stat gear can change.
- **Capture:** a locked action whose requirement is a stat, such as
  `You need Dangerous 300 (you have 189)`.

## `dirty`, `isOutfit`, and `hasUpdatedCharacter`

- **Unknown:** what `isOutfit` (possessions) means. It is not "worn".
  (`dirty` is settled: the worn items differ from the saved outfit; see
  [equipment.md](equipment.md), "Saved outfits".)
- **Matters:** low; nothing depends on them.

## Second chances

- **Unknown:** the exact effect of spending a second-chance item on the
  displayed percentage.
- **Meanwhile:** ignored.

## Limits

- **Unknown:** any rate limit on the API, and how long the token lasts.
- **Meanwhile:** one request at a time, no polling; an authentication failure
  stops the feature and says so.


## Saved outfits: duplicate names, and switching from a script

Raised 2026-11-24 by the saved-outfit shortcuts requirements
(`docs/superpowers/specs/2026-11-24-saved-outfit-shortcuts-requirements.md`).
Renaming, saving (`POST /api/outfit/save`; there is no auto-save), names,
limits and the outfit control's markup were settled by a capture the same day; see "Saved outfits" in
[equipment.md](equipment.md).

- **Unknown:** whether the server refuses a rename to a name another outfit
  already has. The page refuses it before sending anything.
- **Unknown:** whether a script can switch outfits through the page by setting
  the hidden `#a11y-outfit-dropdown` select, or must click the react-select
  option.
- **Matters:** low. The script keeps names unique itself; the switch can fall
  back to `POST /api/outfit/change` and a reload, as the swaps do.
- **Meanwhile:** nothing uses saved outfits.
- **Capture:** the switch question is settled by a prototype while planning the
  saved-outfit shortcuts.
