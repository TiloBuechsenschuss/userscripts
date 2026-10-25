---
okf: 1
title: The Plans tab (/plans)
kind: reference
domain: fallenlondon.com
status: verified
verified: 2026-10-25
source: one rendered /plans page from a logged-in character (ten active plans, one completed), The Airs of London at 84
see_also: [index.md, api.md, open-questions.md]
---

# The Plans tab (`/plans`)

The player marks a storylet option as a plan with the bookmark buttonlet on
its branch (`.branch__plan-buttonlet`). The Plans tab lists every plan with
the option's requirements, drawn the same way a storylet draws them. Choice
Helper reads The Airs of London off it.

## Route

**Verified (2026-10-25).** The main tab bar links it as `/plans`
(`li.nav__item[data-name="plans"] > a[href="/plans"]`).

## Layout

**Verified (2026-10-25).** Inside `.tab-content__bordered-container`:

- `h1.heading--1` "My Plans", then an `h2.heading--2` "Active Plans" and,
  further down, an `h2.heading--2` "Completed Plans". The two lists are
  siblings of these headings, not children: a plan's section is known only by
  which heading comes before it.
- One `div.branch.plans_separator` per plan. Its title is
  `h2.media__heading`, **not** `.branch__title`, so the storylet badge
  features (which walk `.branch__title`) draw nothing here.
- `h4.heading--4` under the title names the area ("Spite", "Bazaar
  Side-Streets", "Wolfstack Docks").
- The plan's buttonlets are Edit and Delete; a completed plan adds Restart.
- The requirements are in the plan's `.buttons`, after the note form's Save
  button.

## Requirement icons

**Verified (2026-10-25).** The same markup as on a storylet: a
`div.icon.quality-requirement` holding a `div[aria-label]` and an
`img[aria-label]` with the same text. A locked one adds `icon--locked`. Both
active and completed plans show their requirements against your current
qualities, so a completed plan still reads.

Wordings seen, verbatim:

| State | Example |
|---|---|
| unlocked, a range | `You unlocked this with The Airs of London 84 (you needed 64-87)` |
| locked, an upper bound | `You can't do this when you have The Airs of London higher than 25 (you have 84)` |
| unlocked, a level | `You unlocked this with A Name Whispered in Darkness 7 (you needed 3)` |
| unlocked, exact | `You unlocked this with Investing in Shipping and Salvage 20 (you needed exactly 20)` |
| unlocked, at most | `You unlocked this with Number of Workers in your Laboratory 3 (you needed 3 at most)` |
| locked, a count | `You need 5,000 Nodules of Deep Amber (you have 1,676)` |
| locked, no count shown | `You need 3 Amber Ha'pennies` |
| locked, an item | `You need a Parabola-Linen Frock` |
| unlocked, an item | `You unlocked this with a Comprehensive Bribe (you have 5 in all)` |
| unlocked by absence | `You unlocked this by not having any Parabolan Defences` |
| locked, a stat | `Your Shadowy must be at least 200 without equipment modifiers.` |

Counts of 1,000 and more carry a thousands separator.

## How Choice Helper reads it

`aolCurrentAirs` walks `.quality-requirement [aria-label]` on every scan and
`aolAirsFrom` takes the first Airs it finds: the number after the name when
unlocked, and only the `(you have N)` when the text is a "can't" or a "need".
On `/plans` the reading is banked as source `plans`. A plan for any
Airs-gated option works, locked or unlocked, active or completed.
