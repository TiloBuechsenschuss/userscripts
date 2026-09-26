---
okf: 1
title: Open questions about Fallen London
kind: open-questions
domain: fallenlondon.com
status: open
updated: 2026-09-26
see_also: [api.md, challenges.md, equipment.md]
---

# Open questions

Each entry says what is unknown, why it matters, what the code does meanwhile,
and what capture would settle it. When one is settled, move the fact into the
right file and delete the entry.

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
