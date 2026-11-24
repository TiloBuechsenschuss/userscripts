# FL Small Mercies: reference

> **Snapshot, not a live mirror.** Read on **2026-11-24** from
> <https://github.com/lensvol/fl-small-mercies> at commit `0ca935a`
> (committed 2026-11-06, `manifest.json` version 3.5.0). The project is under active
> development: **check the live repository before relying on anything below**,
> especially endpoint names, reply shapes and IDs.
>
> Analysis only. Nothing from it is used by any script in this repository yet. The
> game facts it suggests are also in [`okf/fallen-london/fl-small-mercies.md`](../../okf/fallen-london/fl-small-mercies.md),
> labelled *assumed*, since none of them has been checked against a capture of ours.

## 1. What it is

A **browser extension** (Manifest V3; Chrome, Firefox and Opera, with a mobile mode chosen by a "mobile" user agent),
not a userscript, written in TypeScript and bundled with webpack. Author Kirill Borisov
(`lensvol`), MIT licence (copyright 2020). Its README calls it a set of small "fixers" for the
Fallen London UI, each switchable on its own from an "Extensions" tab it adds to the game's
**Account** screen. The README says it is *not* whitelisted by Failbetter Games.

The one thing that matters most for us: **it makes no API calls of its own.** Every game fact it
uses comes from **reading the game's own XHR traffic as it passes**, and several features work by
**rewriting those replies (and, in one case, a request) before the game's React code sees them**.
There is no `fetch`, no token-bearing request, and no iframe anywhere in its source.

## 2. Architecture

### 2.1 Pieces and where they run

| Piece | File | Runs in | Job |
|---|---|---|---|
| Early sniffer | `src/early_sniffer.js` | page (`world: "MAIN"`), `document_start` | Wraps `XMLHttpRequest.prototype.open` before the game boots, to catch the first `/api/character/myself` reply (see 2.3). |
| Content script | `src/content.ts` | isolated world, `document_start` | Injects the payload as `<script type="module">`, relays `FL_SM_*` messages between page and background. |
| Payload | `src/inject.ts` (+ everything it imports) | page | Installs the API interceptor, the game-state model, every fixer, the settings page and one central `MutationObserver`. |
| Background | `src/background.ts` | service worker | Stores settings in `chrome.storage.local`, pushes them to every Fallen London tab, swaps the MAGCATS icon stylesheets with `chrome.scripting.insertCSS/removeCSS`. |

Permissions: `storage`, `tabs`, `scripting`; host permission `https://www.fallenlondon.com/*`
only. It does not ask for `api.fallenlondon.com`, which it does not need: it only watches requests
the page itself makes.

### 2.2 The API interceptor (`src/api_interceptor.ts`)

A singleton `FLApiInterceptor` that monkey-patches two prototype methods in the page:

- **`XMLHttpRequest.prototype.open`**: remembers the URL and adds a `readystatechange` listener.
  When the request is done with a status from 200 to 300, it hands the `responseText` to every
  listener registered for that URL's **path** (`onResponseReceived("/api/storylet", fn)`), each
  getting a `structuredClone` of the parsed JSON that it may mutate in place, then makes
  `responseText` writable on that XHR instance and replaces it with the re-serialised result. Paths
  nobody listens to are not parsed at all.
- **`XMLHttpRequest.prototype.send`**: only for URLs containing `api.fallenlondon.com`. It parses
  the JSON body and runs the request listeners for that path (`onRequestSent`). A listener may
  return
  - an `OverridenResponse`: the request is **never sent**; a fake reply is written into the XHR
    (`responseText`, `readyState = 4`, `status`) and `onreadystatechange` is called by hand;
  - an `AmendedRequest`: fields are merged into the body before it is sent;
  - nothing: the request goes out unchanged.

It also picks up the login token: at install time from `localStorage.access_token` or
`sessionStorage.access_token`, and afterwards from the `jwt` field of `/api/login` and
`/api/login/user` replies, with an `onTokenChanged` hook. The token is held but never used to make
a request.

Only XHR is patched, not `fetch`. That every feature works implies the game's API calls go through
XHR, but that is an inference (see the OKF file).

Replacing `responseText` only helps if the interceptor's listener runs before the game's own
handler on the same XHR. It is added inside `open`, so it runs first for any handler the game
attaches after calling `open`. That the game does so is implied by the features working, not shown.

### 2.3 The early sniffer and the stash

The payload is an ES module loaded from the extension, so it starts late enough to miss the game's
first `GET /api/character/myself`, which carries almost the whole character. `early_sniffer.js` is
plain JS injected into the page at `document_start` (manifest `world: "MAIN"`): it wraps `open`,
keeps the first `/api/character/myself` reply in a `Map`, and when the payload asks
(`FL_SM_divulgeStash` window event) posts it back with `window.postMessage`, switching to
forwarding further replies live until the payload sends `FL_SM_stopSniffing` (which it does after
the first one it processes).

**Possible bug (our reading of the code, not run):** the replay uses
`responses.forEach((url, capturedResponse) => ...)`, but `Map.prototype.forEach` passes
`(value, key)`, so the stashed reply is posted with `url` = the JSON body and `response` = the URL.
The receiver checks `event.data.url.endsWith("/api/character/myself")`, which the body does not
satisfy, so a stashed reply would be dropped and only the live-forwarding path would work. If this
technique is copied, do not copy that line.

### 2.4 The game-state model (`src/game_state.ts`)

`GameStateController` listens to the interceptor and keeps a `GameState`: user (id, name, jwt),
character (id, name), location (setting id/name, area id/name), storylet phase (`Available`, `In`,
`End`), current storylet, opportunity deck, outfit slots, saved outfits, actions left, and every
quality, indexed by category + name and by id. Fixers subscribe to change events instead of
listening to the network themselves:

| Event | Raised from |
|---|---|
| `CharacterDataLoaded` | `/api/character/myself` (qualities are reset and rebuilt) |
| `UserDataLoaded` | `/api/login`, `/api/login/user` |
| `QualityChanged` (previous, current) | quality-change messages in `/api/storylet/choosebranch`; `possessionsChanged` in `/api/exchange/buy` and `/sell`; a level differing in a `/myself` reload |
| `ActionsCountChanged` | `/api/character/myself`, `/api/character/actions`, `/api/storylet/choosebranch` |
| `LocationChanged` | `/api/login*` (`area`), `/myself` (`character.setting`), `/api/map`, `/api/map/move`, `AreaChangeMessage` / `SettingChangeMessage` in branch results |
| `StoryletChanged`, `StoryletPhaseChanged` | `/api/storylet`, `/begin`, `/goback`, `/choosebranch` |
| `EquipmentChanged` (slot, previous, current) | `/api/outfit`, `/outfit/change`, `/equip`, `/unequip`, `/equipHighest` |
| `OutfitChanged`, `OutfitContentsLoaded` | `/myself` (`outfits[].selected`), `/api/outfit`, `/api/outfit/change` |
| `OpportunityDeckChanged` | `/api/opportunity`, `/draw`, `/discard` |

It also harvests **"World" qualities** (ones with `allowedOn: "World"`) from the requirement
tooltips in storylet lists, storylet branches and `/api/plan`, by cutting the text out of
`<li class='current'>…</li>` in the tooltip HTML.

### 2.5 Fixers and the DOM side

Each feature is a class in `src/fixers/`, listed in `src/fixers/index.ts` (order matters: the EPA
tracker must come before the Penny-to-Echo converter). A fixer opts into any of four duck-typed
roles: `applySettings` (all), `linkNetworkTools` (interceptor), `linkState` (game state),
`onNodeAdded`/`onNodeRemoved`/`checkEligibility` (DOM), and `worksOnMobile` (skipped on mobile when
false). One document-wide `MutationObserver` in `inject.ts` feeds every added or removed `div`/`li`
to each DOM fixer, disconnecting itself while it does so its own changes do not re-trigger it.

### 2.6 Settings and storage

- Settings: a schema in `src/constants.ts` (grouped, each a boolean or a choice), stored in
  `chrome.storage.local` under `settings` by the background worker and broadcast to every Fallen
  London tab. The page side draws its own "Extensions" tab into the Account screen
  (`ul[aria-label='Account sections']`, `div[role='tabpanel']`).
- `localStorage` keys it writes in the page: `fl_sm_epa_tracker_<characterId>` (EPA tracker,
  `tracking|wealth|actions`), and the **game's own** `hidden_storylets` (see `persistent_premium`
  below).

### 2.7 Data sets

`src/datasets/` holds tables generated from the Fallen London wiki's Semantic MediaWiki API
(`https://fallenlondon.wiki/w/api.php`, `action=ask`) by `scripts/dump_pyramidal_qualities.py`
(`[[Increase Type::Pyramidal]]`) and `scripts/extract_item_prices.py` (`[[Sells for::+]]`, plus a
hard-coded list), and committed: `PYRAMIDAL_QUALITY_IDS`, `VANITY_QUALITY_IDS`,
`SKELETON_QUALITIES`, `ITEM_PRICES_BY_ID` / `ITEM_ID_BY_NAME` (Echo value per item), and
`COMMUNITY_SNIPPETS`. (Both scripts turn TLS certificate checking off; irrelevant to us unless
reused.)

## 3. Features

Setting key and default from `src/constants.ts`. **How** says which mechanism the fixer uses:
**R** rewrites an API reply, **Q** intercepts or fakes a request, **S** reads the game-state model,
**D** edits the DOM.

### Branch results

| Fixer | Setting (default) | How | What it does |
|---|---|---|---|
| `BranchResultsFixer` | `remove_quality_cap_msgs` (on), `remove_simple_challenge_text` (on) | R | Drops `QualityCapMessage`s with `changeType: "Unaltered"` from `/choosebranch`; strips "(Simple challenges mean you don't learn so much.)" and the "old territory" sentence from roll messages. |
| `ChangePointsAnnotationFixer` | `annotate_cp_changes` (on) | R, S | Appends "(+N CP)" to `PyramidQualityChangeMessage`s. Tracks change points per pyramidal quality: CP for level *n* is 1+2+…+*n*, with the step capped at 50 (70 for Watchful/Shadowy/Dangerous/Persuasive); the remainder is parsed from the tooltip ("N change points, M more needed to reach level L"). Starting values come from `/myself` and are marked "approximately" because `/myself` lacks progress for some. Also handles auto-fire cards, which arrive as an `End`-phase reply to `/api/storylet/begin`. |
| `EchoPenniesFixer` | `convert_pennies_to_echoes` (on) | R | Rewrites Penny amounts as Echoes (÷100) in branch requirement tooltips and in the Penny change message. |
| `EpaTrackerFixer` | `show_epa_tracker` (off), `branch_results_worth` (off), `branch_net_worth` (off), `colorize_worth_annotations` (on) | R, S, D | Values every item change in a branch result at its Echo price; can annotate each line, add a "Net worth change" line, and run a Start/Stop/Reset **Echoes-per-action tracker** in the left sidebar (uses the reply's `elapsed` as the action count). Also listens to `/api/agents/branch`. |
| `KhanateOracleFixer` | `enable_khanate_oracle` (off) | R | After branch 250668, reads the new *Airs of the Khanate* (0–100) and adds a message naming the recruit prospect for that band of ten (Academic … Soldier). |
| `TwoStepConfirmationsFixer` | `two_step_confirmations` (off) | Q | For a hard-coded list of 58 "dangerous" branch ids (more are commented out), the `/choosebranch` request is **not sent**; a fake storylet with "YES!" / "...No." is returned instead. "No" replays the stored storylet reply; "YES!" uses a fake id (77 000 000 + real id) which the request hook rewrites back to the real id. |

### Left sidebar

| Fixer | Setting (default) | How | What it does |
|---|---|---|---|
| `ShopTransactionFixer` | `track_shop_transactions` (on) | S, D | Updates the Echoes (Penny ÷ 100) and Scrip counters live after a buy or sell. |
| `LocationQualitiesFixer` | `hide_nonlocal_qualities` (on) | S, D | Hides five sidebar qualities outside their place (e.g. *Moonlit* outside Balmoral, *The City Waning* outside the City of the Tracklayers). |
| `AsceticModeFixer` | `ascetic_mode` (off), `remove_fate_counter` (off) | D | Removes the location banner and candles; removes the Fate counter. |
| `MaxedOutScrollbarsFixer` | `maxed_out_scrollbars` (on) | S, D | Hides progress bars of qualities at their `cap` or at 100% progress. |
| `CurrencyIconsFixer` | `scrip_icon`, `stuiver_icon`, `shillings_icon` (all on) | D | Adds icons to those currency counters. |
| `MoreCurrencyDisplaysFixer` | `display_more_currencies` (on), `display_currencies_everywhere` (off) | S, D | Adds counters for Khaganian Coinage, Justificande Coin, Memory of a Tale, Hinterland Prosperity, Attar, Ambergris and Blood Oaths, shown only in the settings where they are spent unless told otherwise. |
| `ThousandSeparatorFixer` | `add_thousands_separator` (on) | D | Commas in currency counters (also used by shop and EPA displays). |
| `SidebarShieldsFixer` | `compact_ability_sidebar` (off), `shield_golden_pulse`, `shield_highlight_modifier`, `shield_counter_animation`, `shield_eager_load` | S, D | A compact grid of stats, menaces and advanced skills. With `shield_eager_load` it **predicts** new levels from an equipment change by adding and removing the items' `enhancements` (menace enhancements excluded), before the next `/myself` confirms them. |

### Possessions and Myself tabs

| Fixer | Setting (default) | How | What it does |
|---|---|---|---|
| `SingleItemIconFixer` | `hide_single_item_icon` (on) | D | Hides the "1" counter on single items. |
| `WorthDisplayFixer` | `add_worth_tooltips` (off) | D | Adds "Worth N Echoes" to item tooltips (Tippy, `data-tippy-root`). |
| `ThingSortFixer` | `sort_neathbow_boxes`, `sort_city_mysteries`, `sort_discordance_seals`, `sort_dreams` (all on) | D | Re-orders those icons into a canonical order by id. |
| `VanitySectionFixer` | `show_vanity_section` (off), `only_completed_vanities` (on) | R, D | Adds a "Vanities" group to the `/myself` reply's `possessions`; hides incomplete ones in the DOM. |

### Central column

| Fixer | Setting (default) | How | What it does |
|---|---|---|---|
| `BranchProtectorFixer` | `ship_saver` (on), `piggy_bank_saver` (on) | R | Marks "Get rid of your current ship" (storylet 335704, branch 251811) and "Break the bank" (380520, 278678) as quality-locked with a fake requirement. *Our reading:* the early return tests only `ship_saver`, so turning that off also turns off the piggy-bank lock. |
| `PersistentPremiumFixer` | `persistent_premium` (off) | R | In London (setting 2) re-types gold-framed (`category: "Premium"`) storylets as `deckType: "Persistent"` and adds their ids to the game's `localStorage.hidden_storylets` (`{ <settingId>: [storyletId…] }`). |
| `PlanButtonsFixer` | `remove_plan_buttons` (off) | D | Removes the Plans button and branch plan buttonlets. |
| `ProfileLinkFixer` | `add_profile_link` (on) | S, D | Adds a Profile tab, built from the character name. |
| `AutoScrollFixer` | `auto_scroll_back` (on), `scroll_back_behavior` | D | Scrolls back to the storylet after a branch is chosen. |
| `ShopPricesFixer` | `shop_price_totals` (on) | D | Hovering "Sell" shows price × quantity, minus an amount reserved by another extension's `.flgf__reserve-display` if present. |
| `SocialEmptyReqsFixer` | `fix_empty_requirements` (on) | D | Removes the empty requirements bar in social storylets. |
| `DiscordanceChecksFixer` | `prettify_discordance_checks` (off) | D | Joke rewording of Steward of the Discordance challenges. |

### Right sidebar and misc

| Fixer | Setting (default) | How | What it does |
|---|---|---|---|
| `FavourTrackerFixer` | `display_favour_tracker` (on), `show_zero_favours` (off) | S, D | Favours per faction in the right sidebar, with Renown in the tooltip. Desktop only. |
| `RightSidebarFixer` | `remove_mask_banner` (off), `remove_sidebar_snippets` (on) | D | Removes the cross-promotion banner and the snippets. |
| `ContactsSnippetFixer` | `remove_contacts_snippet` (on) | D | Hides the "Make Contacts" snippet. |
| `CustomSnippetsFixer` | `enable_custom_snippets` (off), `replace_fbg_snippets` (off) | R, D | Mixes community snippets into `/api/infobar` and `/api/infobar/snippets` replies. |
| `AfterFallYearFixer` | `show_af_year` (off) | D | Journal dates shown as years After Fall (year − 122). |
| `TreasureMapFixer` | `show_treasure_marker` (on) | R, S | Marks the area named by *Directions to a Hidden Stash* (quality 144084, level as an index into nine places) in the `/api/map` reply. |
| `AdvancedArtFixer` | `magcats_icons` | background | Swaps advanced-skill icon sets by CSS. |

## 4. API surface it touches

Every endpoint it hooks, from `game_state.ts` and the fixers. "Ours" says whether
[`okf/fallen-london/api.md`](../../okf/fallen-london/api.md) already lists it from our own capture.
Shapes are in `src/interfaces.ts`; the OKF file summarises the ones we lacked.

| Endpoint | Hooked as | Ours |
|---|---|---|
| `/api/login`, `/api/login/user` | reply (`jwt`, `user`, `area`) | no |
| `/api/character/myself` | reply (and stashed early) | yes |
| `/api/character/actions` | reply (`actions`, `actionBankSize`, `nextActionAt`, `currentTime`) | no |
| `/api/outfit`, `/outfit/change`, `/equip`, `/unequip` | reply | yes |
| `/api/outfit/equipHighest` | reply | no |
| `/api/storylet`, `/storylet/begin`, `/storylet/goback` | reply | yes |
| `/api/storylet/choosebranch` | request (`{ branchId, secondChanceIds }`) and reply | no |
| `/api/agents/branch` | reply | no |
| `/api/map`, `/api/map/move` | reply | `/move` only |
| `/api/exchange/buy`, `/api/exchange/sell` | reply (`possessionsChanged`, `message`) | no |
| `/api/plan` | reply | yes |
| `/api/opportunity`, `/opportunity/draw`, `/opportunity/discard` | reply | `/api/opportunity` only |
| `/api/infobar`, `/api/infobar/snippets` | reply | no |

Methods are not recorded by the extension (it keys on path only).

## 5. What this could mean for this repository

Not decided, not implemented: the user asked for analysis only (2026-11-24). Notes for when
"faster API calls" is picked up.

1. **Listen instead of asking.** Today Choice Helper and UX Enhancers get character data either by
   calling the API with the page's token (`GET /api/character/myself` is about 350 KB, plus
   `/api/outfit` and `POST /api/storylet`, one after another, per Optimize-equipment click) or by
   booting the whole game in a hidden iframe (Myself, Possessions, Agents tabs; several seconds
   each). The game already fetches `/api/character/myself` at boot and after many actions. A
   passive XHR hook, as in 2.2, would get the same JSON at no cost and keep it current between
   reloads. Requests we make would then be only the ones the game has not just made.
2. **Keep state current from branch results.** `/choosebranch` replies carry the new level of every
   quality that changed (`possession` in each quality-change message). Applying those, as
   `GameStateController` does, keeps a cached `/myself` usable without re-fetching it.
3. **Cheap calls exist.** `/api/character/actions` returns the action count without the 350 KB
   `/myself`, if that is all a feature needs.
4. **The early-boot problem is real.** Our scripts are `@run-at document-idle`; the first
   `/myself` is gone by then. Catching it needs a hook installed at `document-start` in the page
   context, the job of `early_sniffer.js`. Whether each userscript manager we support runs an
   `@grant none`, `@run-at document-start` script in the page early enough is not known (see
   `okf/fallen-london/open-questions.md`). Fallback when the first reply is missed: fetch once,
   as now.
5. **Read-only only.** Small Mercies also fakes replies and rewrites a `/choosebranch` request. That
   is far outside what this repo does, and `okf/fallen-london/api.md` still forbids calling
   anything that chooses a branch or spends actions. Knowing the endpoint's name changes nothing.
6. **Licence.** MIT: borrowing code means keeping its copyright and permission notice. Re-deriving
   the technique (a few lines of prototype wrapping) needs no copying.

## 6. Re-checking this document

```bash
git clone --depth 1 https://github.com/lensvol/fl-small-mercies
```

Start with `src/api_interceptor.ts`, `src/early_sniffer.js`, `src/game_state.ts`,
`src/interfaces.ts` and `src/fixers/index.ts`; `git log` since `0ca935a` shows what moved. Update
the date and commit at the top of this file and of the OKF file when you do.
