---
okf: 1
title: Fallen London knowledge base
kind: index
domain: fallenlondon.com
status: current
updated: 2026-09-26
---

# Fallen London knowledge base

What we know about how Fallen London behaves, written down as structured
markdown so a script author (human or agent) does not have to re-derive it.
Every claim says how it was established, and what is still unknown is kept in
one place.

## How to read these files

- **Verified** means checked against a real capture from a logged-in account.
  The capture date and the check are given next to the claim.
- **Assumed** means it is a working guess. Nothing may depend on it silently:
  a script that relies on an assumption must check it at run time and say so
  when it fails.
- **Unknown** claims live in [open-questions.md](open-questions.md), never in
  the other files.

## Files

| File | About |
|---|---|
| [api.md](api.md) | The game's own web API: base URL, authentication, every endpoint seen, request and reply shapes. |
| [challenges.md](challenges.md) | How a challenge's shown percentage relates to your level: broad and narrow, the 10% floor, the 100% cap, and how to infer what the game does not send. |
| [equipment.md](equipment.md) | Outfit slots, items, stat bonuses, effective versus base level, and how equipping works. |
| [open-questions.md](open-questions.md) | What has not been captured or verified yet, and what to capture to settle it. |

## How the facts were gathered

A recorder pasted into the browser console wrapped `XMLHttpRequest` and
`fetch` on `www.fallenlondon.com` and kept, for each call to
`api.fallenlondon.com`, the method, URL, request body, status and reply body.
Request headers were **not** recorded, so no login token is in the capture.
The session then opened storylets, equipped and unequipped items, switched to
a saved outfit and back, and saved the recording to a JSON file. One further
read-only `GET /api/outfit` was made with the page's own token to learn what
the worn items are. The raw captures contain personal data (character name,
possessions) and are not committed.

## Related code

- `FallenLondon/ux-enhancers.js`: the `equipment-optimizer` feature reads all of
  this (see the section in `AGENTS.md`).
- `tests/ux-equipment-optimizer.test.mjs`: pins the numbers in
  [challenges.md](challenges.md) and [equipment.md](equipment.md) with values
  from the capture.
