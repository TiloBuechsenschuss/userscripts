---
okf: 1
title: Open questions about Fallen London
kind: open-questions
domain: fallenlondon.com
status: open
updated: 2026-10-25
see_also: [api.md, challenges.md, equipment.md, agents-tab.md]
---

# Open questions

Each entry says what is unknown, why it matters, what the code does meanwhile,
and what capture would settle it. When one is settled, move the fact into the
right file and delete the entry.

## The Airs of London: the Plans tab and the outcome page

- **Unknown:** how the Plans tab (`/plans`, assumed) draws a bookmarked
  branch's requirements: whether it uses the storylet's
  `.quality-requirement [aria-label]` icons, and the exact wording of a
  LOCKED Airs requirement (assumed `You need The Airs of London 76 (you have 42)`,
  after the Renown wording in [api.md](api.md)).
- **Unknown:** the reply shape of `GET /api/plan` (seen, never studied).
- **Unknown:** what the outcome page shows after an option that re-rolls or
  sets The Airs of London: nothing, a message naming the quality, the new
  level, or the level's flavour text ("A bat zips past, not far overhead.",
  which the wiki maps to 1-10).
- **Matters:** the Airs of London panel banks the Airs it reads. Without the
  Plans tab it is read only inside a storylet with an Airs-gated option, and
  without the outcome page every banked value is stale after one action.
- **Meanwhile:** the Plans tab is read with the storylet reader and filed as
  `plans`; a locked text without "(you have N)" reads as nothing; the panel
  labels every banked value "last read" with its age.
- **Capture:** the outer HTML of one Airs-gated plan on the Plans tab, locked
  and unlocked; the JSON of `GET /api/plan`; the outcome page of Confound the
  Constables or any re-rolling option.

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

