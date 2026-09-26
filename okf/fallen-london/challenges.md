---
okf: 1
title: Challenges and chances of success
kind: model
domain: fallenlondon.com
status: verified-with-limits
verified: 2026-09-26
source: the same storylets read under three different outfits
see_also: [api.md, equipment.md, open-questions.md]
---

# Challenges and chances of success

## What the game sends

A challenge in `childBranches[].challenges[]` carries `name` (the quality it is
tested on), `category`, `targetNumber`, `secondChanceId`, `bonuses` and a
description such as `A <em class='diff4'>chancy</em> challenge`.

- **Verified.** `targetNumber` is the percentage chance the game **shows**
  ("Your Mithridacy quality gives you a 60% chance of success" and
  `targetNumber: 60`). It is not a difficulty.
- **Verified.** No difficulty, no level and no broad/narrow flag is sent. The
  words in the description (`chancy`, `straightforward`, `almost impossible`)
  are bands of the percentage.
- **Verified.** The game **floors** what it shows: a true 66.7% is shown as 66,
  88.7 as 88 and 79.8 as 79.

## The two formulas

`level` is your **effective** level in the challenge's quality (see
[equipment.md](equipment.md)).

| Kind | Chance | Certain at |
|---|---|---|
| broad | `0.6 x level / difficulty` | five thirds of the difficulty |
| narrow | `0.6 + 0.1 x (level - difficulty)` | difficulty + 4 |

Both are **clamped to 10%..100%**.

Evidence (all from the capture; "shown" is what the game displayed after the
outfit changed):

| Quality (category) | Level | Shown | Level after | Shown after | Model |
|---|---|---|---|---|---|
| Mithridacy (Skills) | 1 | 60% | 3 | 80% | narrow, 80 |
| Mithridacy (Skills) | 1 | 20% | 3 | 40% | narrow, 40 |
| Persuasive (BasicAbility) | 270 | 90% | 266 | 88% | broad, 88.7 |
| Persuasive (BasicAbility) | 270 | 90% | 200 | 66% | broad, 66.7 |
| Persuasive (BasicAbility) | 270 | 81% | 266 | 79% | broad, 79.8 |
| Persuasive (BasicAbility) | 270 | 81% | 200 | 60% | broad, 60.0 |

## Which kind is it?

- **Working rule, checked on the rows above:** a `BasicAbility` challenge
  (Persuasive, Shadowy, Watchful, Dangerous) is broad; a `Skills` challenge
  (Mithridacy) is narrow.
- Narrow moves in steps of ten points, so **a shown percentage that is not a
  multiple of ten is always broad**, whatever the category.
- A stat at level 0 cannot be broad (it would show 0%).
- **Assumed.** Other categories (Luck, advanced skills, menaces...) were not
  captured. Treat the rule as a guess for them and check the prediction
  against what the game shows afterwards.

## Deriving the difficulty

From the shown percentage `p` (as a fraction) and your level:

- broad: `difficulty = 0.6 x level / p`; the game floors what it shows, so use
  `p = (shown + 0.5) / 100`.
- narrow: `difficulty = level - (p - 0.6) / 0.1`.

## What the percentage hides

- **At 100%** the challenge could be one level or a hundred above certain, so
  it says nothing about how far the level may fall. (Shadowy 151 shown as 100%
  fell to 92% at 138.) Treat it as fixed at 100% and keep the stat where it is.
- **At 10%** the floor hides how far the challenge is from changing.
  (Mithridacy shown as 10% stayed 10% after +2 levels, where narrow would give
  30%.) Treat it as fixed.

## Several challenges on one action

An action can have several (the example had Mithridacy and Shadowy).
**Assumed:** all must pass, so the chance is the product. The capture does not
prove it; see [open-questions.md](open-questions.md).

## Second chance

`secondChanceId` names a quality (an item you can spend) that gives a re-roll,
`secondChanceLevel` how many you hold, and `canAffordSecondChance` whether you
can pay. It was ignored in the model, which maximises the first-chance figure.

## Combined challenges

The wiki has an "Outfit Planner - Weighted Combination Challenges" page: some
challenges add several stats together (Shadowy x1 plus Neathproofed x15).
None of the 15 captured challenges had a non-empty `bonuses`; if one does,
treat the challenge as not modelled.
