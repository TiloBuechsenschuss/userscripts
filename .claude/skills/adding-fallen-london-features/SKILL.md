---
name: adding-fallen-london-features
description: Use when adding, changing or removing a feature in FallenLondon/choice-helper.js — a rating badge on opportunity cards, storylets or their branches, the reference panel behind one, or a table transcribed from a Fallen London wiki guide.
---

# Adding a feature to FallenLondon/choice-helper.js

## Overview

**A badge is a claim, and every claim needs a source you can cite.** A badge quoting a
line you cannot take, or a number no wiki page supports, is worse than no badge — it
spends the player's actions for them. Everything below follows from that.

Advice lives in `choice-helper.js`; `ux-enhancers.js` keeps the quality-of-life tweaks —
the "⚙ UX" launcher and the Factions panel. The two were one file until UX Enhancers 3.0.
A panel added here reaches the launcher's menu through `window.__flUxPanels`, and a helper
both files carry (the Myself/Possessions scrapes, the cache, `h`, `UI`, `TH`/`TD`) must be
changed in **both** — `fl-shared-helpers.test.mjs` fails otherwise. AGENTS.md's Fallen
London section has the whole contract between them.

Fallen London is a React SPA with one URL. Nothing you inject survives a re-render, so
the whole script is a `FEATURES` registry re-run by a `requestAnimationFrame`-debounced
`MutationObserver` on `document.body`. Every feature therefore runs **hundreds of times**
and must be idempotent, cheap, and safe to re-run against a node React has recycled for
different content. `@grant none`: inline styles only, no `GM_*`, no stylesheet.

## Where a badge can go

| What you are rating | Host selector | `place` |
|---|---|---|
| Opportunity cards (all three layouts) | call `eachCardName(visit)` | it gives you `place` and `style` |
| A storylet in the list | `.storylet__heading` | `'after'` |
| An opened storylet | `.storylet-root__heading` | `'after'` |
| One option inside an opened storylet | `.branch__title` | `'after'` |

`eachCardName` covers the wide hand (image-only, name in `.hand__image` alt, badge
overlaid top-left because `wiki-links.js` owns top-right), the compact hand
(`.hand .small-card__body .media__heading`) and the opened card. Use it rather than
re-deriving those three shapes.

Read a name with **`headingName(el)`, never `textContent`** — `wiki-links.js` appends its
"W" anchor into the same heading, so `textContent` yields `"A drunkW"` and matches
nothing. And never put a badge *inside* a heading, for the same reason in reverse.

## Checklist

Work in this order. **TRAP** marks the ones that get skipped.

1. **Get the data from the wiki API, not the rendered page.** Anubis blocks plain fetches;
   `WebFetch` fails. This works:
   ```sh
   curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
     "https://fallenlondon.wiki/w/api.php?action=parse&page=Port%20Carnelian%20(Guide)&prop=wikitext&format=json&formatversion=2"
   ```
   For a whole category at once, list the titles first (`list=categorymembers`, follow
   `cmcontinue`) and fetch the wikitext in batches of about 30 (`titles=A|B|C`): a
   `generator=categorymembers` query that carries content gets an Anubis page back the
   moment it continues, and the failure looks like invalid JSON rather than a block.
   Prefer the **individual card and option pages** over a guide's summary table where the
   two can disagree — `ZEE_CARDS` is built that way because the Zailing guide's table goes
   stale, and where they conflicted the page won (A Spit of Land is -1, not the guide's -2).
   Record which source you took, in the comment above the table.

2. **Decide what the badge's one number MEANS, and write the reasoning into the file.**
   This is the design, and it is not obvious. `bestZeeLine` ranks cheapest Troubled Waters
   first with progress only as the tie-break — the opposite of the first attempt — because
   almost every line at zee makes full progress anyway, so cost is the number that actually
   varies across a hand. Port Carnelian's badge is the net gain, marked when it was paid
   for out of Imperial Legitimacy, because nine of its rows are worth the same +5 and the
   mark is the only thing separating them. Get this wrong and every badge is confidently
   wrong together.

3. **Write the table.** One entry per row of the source, in one `const`, and say in its
   comment that corrections go there **and nowhere else**. Where the source states a total
   *and* the parts it is made of, **carry both** — it looks like duplication and it is the
   cross-check that catches a transcription typo, which is otherwise invisible until the
   actions are spent.

4. **TRAP — never let a table field collapse two different claims.** "Pays 10 of *one* of
   the two currencies, the game's choice" folded into two `+10` fields reads as 10 of each
   and becomes the best row in the table. Give it its own field (`either`) and spell it out
   in words in the tooltip. Same for "no reward at all" versus "reward not recorded": a
   `null` and a `0` are different claims.

5. **TRAP — the title the game shows is not always the wiki's page title.** A randomiser
   can rewrite an option's title: The Airs of London and the forty-odd other Airs
   qualities, and per-quality fill-ins like `(growth)`, `(direction)` or `(an Urchin)`.
   A title your table does not carry goes **unbadged**, so before you write a name down,
   open the option page and look for a `{{Variant table}}` with `|Effect = Title`
   **inside the action's description block** — one in a Success or Failure block retitles
   the *result* and needs nothing from you. Then either
   - carry the other titles in the entry's `aliases` (the brawl fight has eight; The
     Rewards of Intrigue's Urchin option two, a Cross and a Nought), or
   - where the page title itself is a placeholder the game fills in, add it to
     `CAROUSEL_PLACEHOLDER`, which wildcards it. Enumerate as aliases instead wherever
     two options on one storylet could then match the same title — that is why the Sixth
     Coil's verbs are listed in `SIXTH_MIRROR_VERBS` and only its nouns are wildcarded.

   Find them in bulk rather than page by page: every Airs quality files its retitles under
   its own `Category:<quality> Text Uses`, and `list=allcategories&acprefix=Airs` (plus
   `acprefix=The Airs`) lists every such quality. A pass over all 40 of those categories
   on 2026-09-17 found the only Airs retitles in a badged storylet are the two aliased
   above. The rest sit in storylets no feature has reached yet, and are these — alias them
   the day a feature does, rather than fetching 40 categories again:

   | Storylet or card | What is retitled | Titles | Quality |
   |---|---|---|---|
   | The Usual Glut of Weather (card) | its option *Take a stroll in the (Weather)* | 5 | The Airs of London |
   | A Jaunt in the (Weather) (storylet) | the storylet's own heading | 5 | The Airs of London |
   | Among the Rubble in (Location) (The Waswood) | *Leap over (an obstacle)* | 3 | Airs of the Rubble |
   | A Labyrinth of Roof and Bone (card) | *(Go one way in the catacombs)* and *(Go the other way in the catacombs)* | 20 each | Airs of the Sous |
   | Hunting the (Roof Prey) (card) | the card's own name | 5 | Airs of the Hunt |
   | The Wellspring of Spatial Uncertainty | *Attempt to travel (horizontally / vertically / rotationally / cardinally)* | 4 each | Airs of Broken Space |
   | Poise (card) | *Represent the (Alignment) view on a proposed edifice* | 5 | Airs of Ealing Gardens |
   | Begin an intrigue | *Expand your network: Recruit (Agent)* | 10 | Airs of the Khanate |
   | Choose a case | the guilt half of *(Prosecute)* / *(Defend) (a defendant) charged with (crime)* | 2 | Second Airs For CourtRoom |

   The pre-Waswood *Leap over (an obstacle)* page is retired; take the Waswood one. Success
   and failure TEXT varies with the Airs on many more pages than these: that retitles no
   option and needs no alias.

6. **Write the badge spec as a pure function** — `xBadgeSpec(entry) -> { text, color, title }`,
   entry in, description out, no DOM. That is what makes the arithmetic behind every badge
   testable, and every existing feature does it.

   **The badge text has two parts, in this order:** the badge itself (step 2's number and its
   marks), then **every faction result the line has** — each `Renown: <faction>` and
   `Favours: <faction>` it gives or takes, signed, joined with ` · `:
   `War +1 CP? · Favours: Revolutionaries +1`, `Amber ×300? · Favours: Society +1`,
   `Jade ≈1.5 × Persuasive · Favours: Society −1`. A line with no faction result has no second
   part. The faction part is never the tooltip's alone, and never folded into a payout tag.
   Carry it as its own table field (e.g. `factions: [['Favours: Society', 1]]`) so the spec
   appends it and the suite can pin, for every row with the field, that the badge ends with it.

7. **Colour is a value, not decoration — and never the only carrier.** The reader is
   **red-green weak**, so a claim that lives only in a hue is a claim they cannot read. Every
   badge must still say what it means with the colour stripped off: a mark told apart by
   **shape** (`▲`/`▼`, `★`, `?`, `▾`), a word, or the number itself. Then:
   - **A ramp is for a number, not a category.** One colour per value the table actually pays,
     and test *that* — "adjacent steps differ" passes happily while two real values collide,
     which is exactly how `fotzColor` shipped with 125 and 150 the same colour. A cost scale
     runs green→red (`zeeColor`); a reward ladder runs up to gold. Both are quantities, and
     the quantity is printed on the badge too.
   - **Never make red-against-green the whole distinction.** Where the metaphor is right
     anyway, separate the two along the **blue-yellow** axis, which red-green weakness leaves
     intact — lean the green teal, the red warm brick (`PC_COLOR_LEGIT_GAIN` /
     `PC_COLOR_LEGIT_SPEND`) — and give each side its own **shape** as well.
   - **Spending the channel on the wrong axis is a real failure mode.** `pcColor` ranked nine
     identical +5s by shade, which read as a ranking that was not there; `pcPaint` now colours
     the thing that actually varies.
   If the palette is **light** (so it reads on FL's dark card art), pass `spec.ink` — white on
   light is not legible, and the contrast in both directions belongs in the test. So does a
   test that the **text alone** separates two things a colour separates.

8. **Write the tooltip as the whole argument.** It is not a caption: on a phone there is no
   hover, so `makeBadge` also opens the same text as a tap panel, and it is the only place
   the reasoning exists. Every option, its requirement, what it gives, what a failure costs.
   Put the menaces in the headline too, or a line that is cheap in one currency and
   expensive in another reads as free.

9. **Gate it, in the honest direction.** `currentArea()` reads the screen-reader greeting.
   Three strengths, and which you may use depends only on evidence:
   - **Confirm-only** (`inZee`, `inPortCarnelian`) — the area list is a *guess*. It may say
     "yes, definitely here" and must never say "no". Default to this.
   - **Exact list** (`SPITE_AREAS`) — only once a greeting has been captured **verbatim
     in-game**. Then an unrecognised area may clear badges.
   - **Three-state** (`fotzWhere` → `yes`/`no`/`unknown`) — both halves captured.

   The table is the real scope until then. Where a name is generic enough to belong to
   another storylet, mark that entry `strict` and badge it only on a confirmed greeting.
   Six entries across the four features earn it, and each has a stated reason — the wiki
   disambiguates the title (`His Amused Lordship - 2`), or the name is one ordinary English
   word. Do not spread `strict` on suspicion: refusing on an unverified list blacks the
   feature out in the one place it exists for.

10. **Wire `attachBadge`.** One `cls` and one dataset `flag` per feature, both unique in the
   file. **The `value` must carry every input the spec depends on**, not just the name —
   `fotz-card-ratings` passes `name + depth + source + holdings.sig`, or setting your depth
   leaves the badges quoting the old one. React recycles container nodes, so a boolean flag
   would leave the last card's badge on the next card. A `null` spec means "nothing to say
   here" *and* clears a badge left by a previous occupant.

11. **TRAP — two features on one selector.** `.branch__title` is walked by both
    `fotz-supplication` and `port-carnelian`. `host.after()` inserts *immediately* after the
    host, so the badge drawn second sits nearer the heading than the one drawn first — which
    is why `attachBadge` walks the whole run of badge siblings to find its own. If you add a
    third feature to a shared selector, give it its own class/flag pair and re-run the
    sibling-order tests in `choice-port-carnelian.test.mjs`.

12. **TRAP — anything you draw into the page needs a signature guard.** Your own writes
    trigger the MutationObserver that redraws you. `attachBadge`'s flag is that guard for
    badges; an in-page control needs its own (`depthSig`), and a timestamp in the signature
    must be **bucketed**, or it redraws on every scan forever.

13. **Register in `FEATURES`.** Order matters where one feature's side effect feeds another
    (`fotz-depth-control` runs *after* `fotz-card-ratings`, which is where `forgetStaleDepth`
    lives). Wrap nothing in try/catch yourself — `scan()` already isolates each feature.

14. **Panel — only if the user decided on one.** Whether a guide gets a panel behind ⚙ UX is
    always the user's call (planning-a-fallen-london-guide-feature); no answer, ask. Push `{ id, icon, label, hint, render }`
    onto `choice-helper.js`'s `PANELS` — `registerPanels` hands the list to UX Enhancers'
    launcher at load, in order; `render(ctx)` is called fresh on every open, so nothing needs
    invalidating. The launcher and its `ctx` are the other script's, so a panel that must be
    redrawn from outside keeps its own `ctx` (see `fotzPanelCtx`).
    Build it with `h()` and `wikiLink()`, styles from `UI` / `TH` / `TD`. For a long table,
    copy the Zailing panel's filter: match `row.dataset.<x>Search` rather than `textContent`,
    so a term can hit an option the collapsed row does not show, and hide a group heading
    whose rows have all gone.

15. **Write `tests/choice-<feature>.test.mjs`.** It evaluates the IIFE against a
    stub DOM and re-exports internals by replacing the closing `})();`. Copy the harness
    from `choice-port-carnelian.test.mjs` or `choice-fruits-of-the-zee.test.mjs` — those two are the
    stubs that implement `after()` and a derived `nextElementSibling`, which you need for
    any `'after'` badge. The others throw on `after()` and will not do.
    Pin: the table's shape, the stated-versus-derived cross-check, the ranking rule and its
    one exception, the badge marks, the gate in **all three** greeting states, that no name
    of yours is in any other feature's table, and **build the whole panel** — a few hundred
    hand-built nodes is where a typo hides.

16. **TRAP — you just broke three other suites.** `choice-crowds-of-spite`,
    `choice-fruits-of-the-zee` and `choice-zailing` each assert the **whole** `FEATURES` and
    `PANELS` roster by hand. Adding one entry fails all three, in suites for features you
    never touched. A new **panel** breaks one more: `ux-launcher-docking` pins the four panel
    ids Choice Helper registers. `check.mjs` in this directory finds the first three.

17. **Metadata and docs.** Bump `@version` in `FallenLondon/choice-helper.js` **and** the
    loader's `@version` in `all-in-one/fallen-london.js` by hand (`bump-loaders.mjs` skips a
    loader you already edited). Extend the script's `@description` paragraph, the
    `choice-helper.js` row in `README.md`, and `AGENTS.md` — the feature's own section, an
    entry in the test-file list, and a line in the **"Not verified in-game"** list saying
    exactly what a player should report back. Leave `@downloadURL` alone; the path did not
    change.

## Verify

```sh
node --check FallenLondon/choice-helper.js
node .claude/skills/adding-fallen-london-features/check.mjs
for t in tests/*.test.mjs; do node "$t" | tail -1; done
node scripts/bump-loaders.mjs --check
```

Read the suite output rather than grepping for one phrase — they end with three different
strings (`All passed`, `All checks passed.`, `all good`), so a single-pattern check reports
false failures.

`check.mjs` loads the script against a stub DOM and audits the wiring the tests do not:
every `run` and `render` is callable, every panel actually builds, no two features share a
badge class or dataset flag, every roster suite lists exactly the registered features and
panels, a new feature has a suite and an `AGENTS.md` write-up, no `GM_*` under
`@grant none`, and `@version` bumped on both the script and the loader. Pass
`--feature <name>` to scope the coverage check.

## Do not

- **Do not invent a selector.** Every selector in this file is either verified against a
  real capture or shared with `wiki-links.js` and verified there. If you need markup nobody
  has captured, say so and gate on what you do have — `fotzDepth`'s four-tier answer exists
  because the honest answer to "how deep are you" is sometimes "I cannot tell", and the
  badge then shows a **range** rather than a number it cannot justify.
- **Do not badge a line the player cannot take.** Options behind an item, a quality or
  piracy are left out of the ranking and kept in the tooltip; a marker (`▾`) says one is
  hiding there. A card with nothing else returns `gated: true` and says so.
- **Do not quote the advertised half of a coin flip.** Where the wiki gives both outcomes
  *and* the odds (a Luck challenge), rank on the expected value. Where it does not (a stat
  challenge — the difficulty is the player's business), keep the success value and let the
  badge's `?` say so. `twFail` exists on thirteen options for this reason; do not spread it.
- **Do not reuse `UI.text` on a light control.** It is a cream for a near-black background.
  A light card needs its own checked constants — see `DEPTH_INK`.
- **Do not put the same name in two tables.** Three features can badge one card container
  and each takes the same corner. A test asserts no name is in more than one table; keep it
  that way rather than deciding which wins.
