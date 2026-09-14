---
name: planning-a-fallen-london-guide-feature
description: Use when the user links a Fallen London wiki guide, area or activity (a "(Guide)" page, a place, a festival) and asks for a new Choice Helper feature, or asks for an analysis, choices or a plan for one — before any code is written.
---

# Planning a Fallen London guide feature

## Overview

A guide becomes badges, and maybe a reference panel behind the **⚙ UX** button. **Whether it gets a
panel is the user's decision, every time.** Everything else here is the analysis that lets them
make that and the other choices well. Implementation follows
**REQUIRED SUB-SKILL: adding-fallen-london-features**.

## The panel decision

Put it to the user as its **own question**, never folded into a scope option.

- The request already says ("with a panel", "badges only") → that is the decision.
- Otherwise ask, with your recommendation and what the panel would hold.
- "Go with recommendations" counts only if the panel question was on the list they answered.
- Never started implementing without an answer → stop and ask.

## Analysis

1. **Fetch through the API, never WebFetch** (Anubis). Batch many pages in one call with
   `node fetch-wiki-pages.mjs titles.txt outdir` (this directory), then
   `node extract-wiki-pages.mjs outdir > extract.txt` to squash the templates. Take the guide, its
   subpages (`/Tables`, `/Cards`, `/Calculators`), then **every card and option page** — they win
   where they disagree with the guide, and they usually do.
2. **Classify what pays.** Opportunity cards (`eachCardName`) or storylets and branches only? Flat
   numbers, or formulas on qualities (Myself tab) and items (Possessions)? A `(see below)` with
   `{{SCurveTable}}` is `y + height / (1 + e^(−k(x − mid)))`, rounded half to even (Module:SCurve).
3. **Find the traps.** Option names shared across cards or areas; generic card names (`strict`);
   the Luck odds on each option page (`LuckChallenge`); guide-vs-page disagreements worth keeping
   as a cross-check.
4. **The greeting.** Unknown → ask the user to read the sidebar in-game. It may be an ordinary
   area name (the lab says "The University"): then it can say *no* but not *yes*.

## Presenting choices

Numbered, recommendation first, one line of trade-off each:

1. **Panel behind ⚙ UX — yes or no**, and what it would hold.
2. Which cards and options are in scope; what is deferred and why.
3. What the badge's one number means.
4. What an unread input shows (range, `?`, manual control).
5. Extra advice layers, if any.

Then the plan: data → pure specs → wiring → gate → panel (only if chosen) → tests → docs → verify.
Close by asking for anything only the game can tell you, such as the greeting.

## Common mistakes

| Mistake | Fix |
|---|---|
| Panel bundled into "scope C" | Separate question 1 |
| Transcribing the guide's summary table | Option pages; guide as cross-check |
| Assuming an area-name greeting confirms the area | Ask; ordinary names can only say no |
| Node `fetch is not defined` | The bundled scripts use `https` |
