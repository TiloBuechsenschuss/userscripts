---
okf: 1
title: The outcome page
kind: reference
domain: fallenlondon.com
status: verified
verified: 2026-10-25
source: one rendered outcome of Sift through the pages (a success that re-rolled The Airs of London)
see_also: [index.md, plans-tab.md, open-questions.md]
---

# The outcome page

What the Story tab shows after an action resolves, before **Onwards**.

## Layout

**Verified (2026-10-25).** Inside `.tab-content__bordered-container`:

- `.media--root` with the result's title as `h1.storylet-root__heading` (here
  "One page amongst many") and its text in `.storylet-root__description-container`.
  The title is the result's, not the storylet's, so a feature gated on an open
  storylet's heading does not match it.
- `div.branch.media--quality-updates`, one `div.quality-update` per change, in
  the order the game lists them. Each has `.quality-update__left` (an icon
  whose inner `div` carries the quality's name as `aria-label`, empty for the
  challenge line and the net-worth line) and `.quality-update__body > div` with
  the text.
- `.buttons--storylet-exit-options`: **Onwards** and, where the action can be
  repeated, **Try again**.

## Lines seen, verbatim

| Icon `aria-label` | Body text |
|---|---|
| (empty) | `You succeeded in a Watchful challenge!` |
| `Proscribed Material` | `You've gained 44 x Proscribed Material (new total 1,511).` then `<em class="worth-branch-annotation worth-annotation-increase">(+1.76 Echoes)</em>` |
| `The Airs of London` | `<em>Two costermongers stagger past, roaring drunk, their neckerchiefs alive with the colours of night.</em>` |
| (empty) | `<em>Net worth change: <span class="worth-branch-annotation …">+1.76 Echoes</span></em>` |

## The Airs of London

**Verified (2026-10-25).** A re-roll prints **no number**. The line is the
flavour text for the new level from the wiki's Airs table on The Airs of
London, here the line for 84–88. The icon is `icon--circular` with
`aria-label="The Airs of London"`.

Choice Helper matches the line against that table (`AOL_AIRS_TEXT`), badges
it with the level or range, and banks the range as source `outcome`.

**Assumed:** that every quality the game calls an "Airs" quality reports a
re-roll this way. Only The Airs of London has been seen.
