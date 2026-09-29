# Airs of London storylets — group D research (final 37, long tail)

Scope: the last 37 entries of TODO.md's "Airs of London storylets (no guide)" list (The Flit and
its King down to Work in your Cabinet Noir — each named by 1-3 wiki pages). Fetched via the wiki
API (`action=query&prop=revisions&rvprop=content`, browser User-Agent, batched multi-title
requests), 2026-09-27. Storylet pages first; option pages fetched for the ones that turned out to
carry real economic content. No code touched.

Cross-checked against `FallenLondon/choice-helper.js` throughout (grep for each storylet/option
name) before recommending anything as "new" — several turned out to already exist elsewhere or to
belong to features not yet built.

---

## A. Already fully covered — no new work

- **Rob a drunk** [1 unlock] — the `someone-is-coming` feature already badges this storylet's
  option "A furious and incoherent drunken rat" (`SIC_DRUNK`, choice-helper.js:11057/11092). The
  Airs-gated option is one of its OTHER three (An anonymous wretch / A cavalry officer / A
  spirifer? (2 FATE) — not yet identified which; low priority since the SiC cash-out option is
  already the reason to visit this card). Not fetched further. **Recommend: leave as-is,** note in
  a follow-up that the non-SiC option's Airs window is still unknown if anyone wants full coverage.

## B. Wrong quality entirely — not Airs of London

- **The Prussian Salon** [as listed, but wrongly] — its four gated options ("Critique the work of
  the Night Painter" etc.) are gated by **Airs of Ealing Gardens**, a different randomiser, rolled
  once per Helicon House visit. Same non-relation the Midnight Trade research already flagged for
  its own "Airs of the Leviathan" — this is not `The Airs of London` and doesn't belong on this
  list at all (likely a wiki-category miscategorisation upstream). **Recommend: no action here;**
  Helicon House already has its own `helicon-house` feature if this is ever worth revisiting under
  its own quality.

## C. Retired — skip

- **Mrs Gebrandt asks for your help** [1 unlock] — carries `{{Retired}}`. A 2011 Feast-of-the-Rose
  one-off, `Unlocked with = ... Airs of London 45` (a single point, not a window — itself a sign
  this is old-style content predating the window convention). **Recommend: skip, retired.**

## D. Fold into the existing `someone-is-coming` feature — 4 storylets, 8 rows

All four are "Ambition: Nemesis" visiting-storylets with the **identical shape**: two Airs-gated
options, one for Airs 1-50 ("stay indoors"/tea), one for 51-100 ("go for a walk"), **both already
raising `Someone Is Coming +1 CP`** exactly like the six `SIC_OPTIONS` gain-rows already in
`choice-helper.js` (`sicGain` pattern, line ~11064). This is a direct, low-risk extension of an
existing table, not a new feature:

- **A Neathy Education** [2 unlock]: "Conduct your lesson" (Airs 1-50) → Confident Smile ×1,
  Memory of Distant Shores ×5, Airs reroll, SiC +1. "Go for a walk (with your Daughter)" (Airs
  51+) → Sudden Insight ×1, Dubious Testimony ×5, Airs reroll, SiC +1.
- **Duty Calls** [2 unlock]: "Take tea (with your Brother)" (Airs 1-50) → same Confident
  Smile/Memory of Distant Shores shape, SiC +1. "Go for a walk (with your Brother)" (Airs 51) →
  same Sudden Insight/Dubious Testimony shape, SiC +1.
- **Visiting the Person who Was your Spouse** [2 unlock]: "Take tea (with your Spouse)" (Airs
  1-50), "Go for a walk (with your Spouse)" (Airs 51-100) — identical shape.
- **Visiting the Person who Was your Lover** [2 unlock]: "Take tea (with your Lover)" (Airs 1-50),
  "Go for a walk (with your Lover)" (Airs 51-100) — identical shape.

None of these four storylet names or option names are in any existing table (checked). **Trap:**
"Take tea"/"Go for a walk" alone are dangerously generic — every option here is written WITH a
parenthetical ("with your Brother" etc.) in the wikitext, but the in-game rendered text may or may
not keep the parenthetical (needs an in-game capture); if the game drops it, all four storylets'
options collide on bare "Take tea" / "Go for a walk" and need `strict` gating on the storylet name
via `sicE(storylet, name, ...)`'s existing storylet-scoping (which already disambiguates by design,
same as Moon-Miser Herding's card-scoped lookup this session already built). **Recommend: add 8
rows to `SIC_OPTIONS`, scoped per storylet exactly like the existing rows.**

## E. New small standalone feature: Watchmaker's Hill "Name Scrawled in Blood" Airs-window storylets

Six storylets, all at Watchmaker's Hill (bar one), all gated on **both** `A Name Scrawled in
Blood N` AND an `Airs of London` window for the WHOLE storylet (not a per-option gate) — the
storylet simply doesn't appear outside its window. Most have one or two options with no real
choice to rank; the badge value here is availability, not reward comparison:

| Storylet | A Name Scrawled in Blood | Airs window | Options |
|---|---|---|---|
| A Marksmanship Competition for a Prize of Jade! [1] | 1 | 0-50 | 2: "Stick with shooting bottles off the end of the jetty" (Dangerous 21, Jade Fragment ×21, Airs reroll, rare success bonus) / "Turn me round!..." (Dangerous 24, Jade Fragment ×24, Airs reroll, rare success bonus) |
| Donate your body to science for an hour or two [1] | 3 | 0-25 | 2: "Lie very, very still" (Dangerous 45, Jade Fragment ×45, Airs reroll) / "Talk them through your wounds" (Dangerous 48, Jade Fragment ×45 + Bottle of Greyfields 1879 ×2, Airs reroll) |
| Rescue Shipwrecked Clay Men [1] | 3 | 26-50 | 1: "Go to their assistance" |
| Deal with Unfinished Men [1] | 3 | 51-75 | 2: "Stand guard" / "Root out the Unfinished Men" |
| Guard duty at the Observatory [1] | 1 | 51-100 | 1: "Offer your services" |
| Provide Training at the Department of Menace Eradication [1] | 3 | 76-100 | 1: "Bring a gun and a stern expression" |

**Confirmed NOT the same as the existing `menace-eradication` feature** — that badges "The
Department of Menace Eradication" (a different storylet, different ID) and its hunt chain; this
one is a standalone Watchmaker's Hill storylet that merely shares a name with the Department.

Together these six cover the FULL 0-100 Airs range in overlapping/adjacent bands at increasing
A Name Scrawled in Blood requirements — reads like a deliberate "your monster-hunting reputation
unlocks a new activity every quarter of the Airs cycle" design. **Recommend: one new feature**
(e.g. `watchmakers-hill-airs`) badging all six storylet headings with their availability window in
words ("Airs 51-100 only") — informational for the four single-option storylets (nothing to rank),
and a real Jade-Fragment-value badge for the two 2-option storylets (Marksmanship Competition,
Donate your body — both options are a flat "success value = the difficulty" shape, i.e. rank by
Dangerous difficulty like an EPA-of-one-currency ranking). All six storylets' rewards are now
fetched (this section, updated 2026-09-28) — ready to spec without further research.

## F. New standalone feature candidates: 2 small cards with real economic content

- **An opportunity for profit** [1 unlock] — a card, `Locked with = A Name in Seven Secret
  Alphabets 3`. Two options, both real: "Eavesdrop (opportunity)" (Watchful 12, Moon-Pearl ×60
  bundled ≤24, Airs reroll) and "Buy them both a drink" (Persuasive 10, costs Piece of Rostygold
  ×10, gives Favours: Criminals +1, Airs reroll). Neither option's Airs WINDOW was found in the
  fetched text (both just say `{{Airs|The Airs of London}}`, meaning they REROLL Airs on outcome,
  not that they're windowed — the "[1 unlock]" in TODO likely refers to a third state or a
  different reading; needs re-checking against the category source). **Recommend: small
  standalone feature**, two real options worth a badge, faction result on one (must appear after
  the badge per the file's own faction-result convention).
- **The Alleys of Spite** [2 unlock] — a storylet, two options: "Follow an unsuspecting mark"
  (Airs 0-50, Shadowy 3, Whispered Hint ×3, a rare success) and "Eavesdrop on a random target"
  (Airs 51-100, Shadowy 4, Whispered Hint ×10). Both `Locked with = A Name Whispered in Darkness`
  (an item/quality gate — check whether the player can always take these). Not in any existing
  Spite feature's table (checked `spite-card-ratings`, `season-in-soup`, `boxful-of-intrigue`,
  `underclay`). **Recommend: fold into a small standalone feature**, real reward, real Airs
  windows, clean data.

## G. Bigger storyline, not fully scoped here — document only for now

- **Candlefinder: Canvassing the Dockers** [2 unlock] and **Candlefinder: Canvassing the Servants**
  [2 unlock] — both are ONE STEP of what is clearly a larger "Candlefinder" investigation
  storyline ("Canvassing the X" naming pattern implies more locations exist). Their Airs-gated
  options ("Probe in dark corners" Shadowy 200 + Inerrant scaling, Dept: Detecting +4 CP; "Watch
  the comings and goings" Watchful 70 + Insubstantial scaling, Detecting +4 CP) raise a
  "Detecting..." progress quality — the same shared-vocabulary shape as THiO/Casing/Running
  Battle. No feature in this file currently touches "Candlefinder" or "Detecting..." at all.
  Picking off just these two of what might be five or six Candlefinder locations would be the same
  mistake the skill warns against (transcribing a fragment instead of the whole mechanic).
  **Recommend: document only** — flag "Candlefinder" as a storyline worth its own dedicated
  research pass (category `list=allcategories&acprefix=Candlefinder` or similar) before badging
  any single location, same treatment Someone Is Coming and Menace Locations already got.

## H. Fully fetched, 2026-09-28 — every entry resolved

All 16 remaining entries' option pages (or redirect targets) have now been fetched and read.
Every recommendation below follows a real fetch, not a guess.

### H1. Standalone feature candidates (real, fetched reward data)

- **The Flit and its King** [3 unlock] — was WRONGLY guessed "zero-value narrative" in the first
  pass; a full option-page fetch overturns that. Its three Airs-window redirects are real:
  - Airs 0-33 → **Getting to know the Flit** → "Go for a wander" (Shadowy 61, Whispered Hint ×61)
    / "Go for a run!" (Shadowy 64, Whispered Hint ×64).
  - Airs 34-66 → **Courier for Revolutionaries** → "Taking messages" (Shadowy 66, Proscribed
    Material ×17).
  - Airs 67-100 → **Race across the Flit** → redirects to storylet **Race Across the Flit**, two
    options ("Spire runners – to the guttering!" / "Hell for leather") — the only pair in this
    whole 61-entry list whose reward is still unfetched (time-boxed out of this pass; fetch before
    writing the table row).
  No existing feature touches "The Flit and its King" or any of its sub-storylets (checked: not in
  `arbor`, `the-hunt-is-on`, `running-battle`, or anything else grepped for "Flit"). **Recommend:
  new standalone feature** — all Shadowy-challenge, Whispered-Hint/Proscribed-Material rewards,
  clean EPA-style ranking. One pair of options still needs fetching before implementation.
- **Bones in the River** [1 unlock] — "Explore the riverbank in low tide" (Airs 0-25, Watchful
  200, Headless Skeleton ×1 + Unidentified Thigh Bone ×1, Airs reroll). Its sibling option "Search
  an especially useful bit of shore" is gated by the item "Survey of the Neath's Bones", not Airs
  — unrelated to this list, but real (Watchful 200, Knotted Humerus ×1 / Femur of a Surface Deer +
  Nightmares +1 on failure). **Recommend: small standalone feature** covering both options of this
  one card (only one is Airs-specific, but both belong to the same card face).
- **The Chandleress' Complaint** [1 unlock] — "Confide in the Chandleress" (Airs 96-100 — a narrow
  window, Favours: The Docks +1, Dangerous −5 CP, Airs reroll). Its other three options are NOT
  Airs-gated: "Light a candle, and wait" (Dangerous 10, Lump of Lamplighter Beeswax scaled to
  Dangerous), "Ask the Chandleress about the rat-catchers' traditions" (Persuasive 10, Whispered
  Hint ×30), "Back to the Department 2" (a 0-cost exit that **redirects to "The Department of
  Menace Eradication"** — this storylet is reached from somewhere in the DME hunt chain, worth a
  note in the tooltip, but its own table entry is `DME_DEPARTMENT`, a different storylet, so no
  table collision). **Recommend: small standalone feature**, all four options real and fetched.

### H2. Document only — real content confirmed, but seasonal / Fate-gated / niche enough to skip badging

- **SNOWBOUND!** [2 unlock] — "An unexpected volunteer" (30 Fate, `Locked with: Incarnadine Fur
  Robe`), two Airs windows (1-50 / 51-100), unlocks a one-time "Mr Sacks"/Bazaar-Masters access
  chain (Free Evening +1 capped at 5, Connected: The Masters of the Bazaar +3 CP, clears the
  Snowbound lock). Real and fully fetched, but a 30-Fate one-off behind an item lock, in a
  once-a-year seasonal card. **Document only** — not worth a badge for a purchase this rare and
  this expensive.
- **Celebrate the Feast of the Exceptional Rose!** [1 unlock] — "Observe the spires of the Bazaar"
  (Airs 90+, Watchful 50, Appalling Secret ×6, Airs reroll). Real, single option, but the Feast of
  the Exceptional Rose is a time-limited annual event card with many unrelated Fate/social
  options around it. **Document only** — seasonal, low traffic, one clean option not worth a
  dedicated feature on its own.
- **A masked revel for the Feast of the Rose!** [1 unlock] — "Cast aside your mask!" (needs Mask
  of the Rose + Airs 90+, a **Luck Challenge 50**, loses the Mask on use). Same seasonal Feast
  event as above, Luck-gated. **Document only.**
- **Perusal of Forgotten Pages** [1 text] — the `#REDIRECT` target is `The Censored Census of
  1862`'s Item Action, single option **"Sift through the pages"**: Watchful 150, Proscribed
  Material ×41-55 (success) / ×25 (failure), Airs reroll. The Airs *text* varies (6 flavour
  variants on success, 3 on failure — case names like "The Case of the Viennese Carpenter"), but
  the **reward number itself does not change with the Airs band** — this is a pure flavour-text
  case wearing an economic action's clothes. **Document only**: if ever badged, it's a plain
  one-option action (Watchful 150 → Proscribed Material), not really "Airs content" in the
  ranking sense — the Airs connection is cosmetic.
- **Read incoming mail** [2 text] — of its 19 options, exactly two mention Airs of London (checked
  all 19 directly): **"Read shared case files"** (needs a Shared Case File item, Watchful CP via
  an `{{SCurveTable}}` formula, title/summary text varies by Airs band — 5 case names) and
  **"Follow a coded instruction"** (needs a Coded Instruction item, Shadowy+Watchful CP via the
  same SCurve shape, Suspicion +1-7, title/description varies by Airs band — 9 chess-move
  flavour texts). Both are pure text-retitle cases on item-gated, formula-driven actions; neither
  reward varies by Airs band. **Document only** — matches the skill's own policy for a retitle
  on an untouched storylet (no feature touches "Read incoming mail" at all).
- **The Usual Glut of Weather** [2 text] and **The Usual Glut of Weather (The Waswood)** [1 text]
  — unchanged from the first pass: exactly the two entries the `adding-fallen-london-features`
  skill's own step-5 table already names as known-but-unbadged retitles ("Take a stroll in the
  (Weather)", 5 titles, quality "The Airs of London"). **Document only, alias the day a feature
  reaches "A Jaunt in the (Weather)" or "The Usual Glut of Weather."**

### H3. Already covered — no new work

- **Work in your Cabinet Noir** [1 text] — **fully covered already.** Confirmed directly in
  `choice-helper.js`: the `deciphering` feature's own comment (line ~29594) says "Work in your
  Cabinet Noir and its option pages fetched through the API", and the block comment at the top of
  the file (line ~509-512) states "the Cabinet Noir badges each code-breaking option" (`deciphering`)
  and "Disappearing badges the Cabinet Noir's other half" (`disappearing`). No new work — this
  entry can be struck from the TODO list entirely, not merely marked document-only.

### H4. Confirmed dead end — no Airs of London content found

- **The Seeking Road** [1 unlock] — the FULL page (not the earlier truncated fetch) carries **zero
  mentions of "Airs of London" anywhere**; every gate on this page is `Seeking Mr Eaten's Name`
  (SMEN) level, an entirely different, exceptionally niche quality. Whatever put this on the
  original 2026-09-17 category harvest is not visible on the storylet's own page and is not worth
  chasing through 20+ individual SMEN sub-option pages for what would be, at best, one incidental
  mention in an ultra-rare storyline. **Recommend: skip**, and flag the original category harvest
  as having one false positive here.
- **This Morning's Gazette** [1 text] — the FULL page also carries **zero mentions of "Airs of
  London"**; its only variant condition is "The Rat Market, in Eclipse". The actual Airs-tagged
  page (if the original harvest wasn't also a false positive here) would be one of ~19 untested
  headline sub-options in a pure-flavour newspaper mechanic with no economic stakes. **Recommend:
  skip** — not worth chasing further for a flavour-only newspaper headline.
- **Fallen London, where everything is as it should be** [1 text] — the FULL page (20 options,
  all now visible) carries no direct Airs mention either; its Option19, **"Experience a glut of
  weather"**, is simply a narrative link into the already-documented Usual Glut of Weather
  mechanic (see H2). **No separate action needed** — its "Airs relevance" is entirely that link,
  already covered by the existing Usual-Glut-of-Weather note.
- **A Public Lecture** [1 text] — confirmed the `/Fads` subpage is a **red herring**: its variant
  condition is "Palaeontological Fads", not Airs of London, at all. The genuine Airs-tagged
  content (if the original harvest is correct) is on one of this storylet's 7 untested options,
  not fetched in this pass (time-boxed: none of the option names gave an obvious hint which one).
  **Recommend: skip** unless someone wants to burn 7 more fetches on a single flavour lecture card.
- **An Invitation to the Bazaar** [1 text] — resolved: "Attend one of the gatherings of the
  Masters" carries a `{{Variant table}}` on its SUCCESS DESCRIPTION TEXT keyed to Airs bands (2-24,
  25-48, ...) — pure flavour, no reward variance. Its sibling option "Rethink your allegiances" is
  an opt-out branch, unrelated to Airs. **Document only** — same retitle-only shape as H2.

---

## Summary for the parent task

Of the 37 (all now fully resolved, nothing left unfetched except one pair of options on Race
Across the Flit):

- **1 already covered, struck from scope** — Rob a drunk (someone-is-coming).
- **1 already covered, struck from scope** — Work in your Cabinet Noir (deciphering +
  disappearing).
- **1 wrong quality** — The Prussian Salon (Airs of Ealing Gardens, not Airs of London).
- **1 retired** — Mrs Gebrandt asks for your help.
- **4 fold into the existing `someone-is-coming` feature** — 8 new rows (A Neathy Education, Duty
  Calls, Visiting the Person who Was your Spouse/Lover), clean fetched data, one generic-name
  trap to gate on storylet name.
- **1 new feature bundling 6 storylets** — the Watchmaker's Hill "Name Scrawled in Blood" +
  Airs-window cluster, all six now fully fetched and reward-complete.
- **5 further standalone-feature candidates with clean, fully-fetched data** — An opportunity for
  profit, The Alleys of Spite, The Flit and its King (bar one unfetched option pair), Bones in the
  River, The Chandleress' Complaint.
- **2 belong to a bigger under-researched storyline** — the two Candlefinder locations found;
  document only, needs its own dedicated pass before badging any single location.
- **7 document-only (real content confirmed, but seasonal/Fate/Luck-gated, item-gated-with-no-
  Airs-reward-variance, or pure text retitle)** — SNOWBOUND!, Celebrate the Feast of the
  Exceptional Rose!, A masked revel for the Feast of the Rose!, Perusal of Forgotten Pages, Read
  incoming mail, The Usual Glut of Weather, The Usual Glut of Weather (The Waswood).
- **4 confirmed dead ends, no Airs of London content found on the real page** — The Seeking Road,
  This Morning's Gazette, Fallen London where everything is as it should be (covered by the Usual
  Glut of Weather link instead), A Public Lecture.

So: **12 storylets resolve to real badge-worthy content** (4 folding into `someone-is-coming`, 6
in the new Watchmaker's Hill feature, 5 standalone candidates — one option pair still unfetched on
one of the 5), **9 resolve to document-only** (real but not worth badging, or pure retitle), **2
belong to a deferred bigger storyline**, and **6 resolve to "no action needed"** (2 already
covered by existing features, 1 wrong quality, 1 retired, 1 redundant-with-another-entry, 1 total
dead end alongside 3 more dead ends counted in the document-only-adjacent group above — see H4 for
the exact four). Every number above is traceable to a real fetch in this file; none are guesses.

No name collisions found against any existing feature's table for the storylets recommended for
new work (sections D, E, F, H1) — checked directly against every grep this pass ran.
