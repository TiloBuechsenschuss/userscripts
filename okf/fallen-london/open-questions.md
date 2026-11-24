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
- **Unknown:** whether a `@grant none`, `@run-at document-start` userscript is
  injected into the page early enough to wrap `XMLHttpRequest` before the
  game's first `GET /api/character/myself`, in each userscript manager we
  support (Tampermonkey, Violentmonkey, Greasemonkey).
- **Unknown:** which actions make the game fetch `/api/character/myself` again,
  so how stale a copy observed at boot gets.
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

- **Unknown:** what `dirty` (outfit reply) and `isOutfit` (possessions) mean.
  `isOutfit` is not "worn". `dirty` was true after an equip and false after a
  reload.
- **Matters:** low; nothing depends on them.

## Second chances

- **Unknown:** the exact effect of spending a second-chance item on the
  displayed percentage.
- **Meanwhile:** ignored.

## Limits

- **Unknown:** any rate limit on the API, and how long the token lasts.
- **Meanwhile:** one request at a time, no polling; an authentication failure
  stops the feature and says so.


## Saved outfits: renaming, saving, switching through the page

Raised 2026-11-24 by the saved-outfit shortcuts requirements
(`docs/superpowers/specs/2026-11-24-saved-outfit-shortcuts-requirements.md`).
Name length is settled: the game accepted a 21-character name, and the script
will write at most 20.

- **Unknown:** the call that renames a saved outfit (path, body, reply).
- **Unknown:** whether an equip changes the selected saved outfit by itself,
  or needs a separate save; what the outfit reply's `dirty`, `type` and
  `isFavourite` mean.
- **Unknown:** whether outfit names keep their letter case, whether two
  outfits may share a name, and which characters are allowed.
- **Unknown:** whether outfits can be created or deleted, or only renamed;
  whether `maxOutfits: 4` is this account's real limit.
- **Unknown:** the markup of the outfit control on Possessions, and whether
  switching through it redraws the page without a reload.
- **Matters:** the saved-outfit shortcuts cannot be planned without them.
- **Meanwhile:** nothing uses saved outfits.
- **Capture:** follow
  [`docs/tools/fallen-london/outfit-capture-guide.md`](../../docs/tools/fallen-london/outfit-capture-guide.md).
  Its recorder also notes `xhr` or `fetch` per call, which settles the first
  question under "Observing the game's own API traffic" for the calls it sees.
