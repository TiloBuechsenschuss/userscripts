// ==UserScript==
// @name         KoL Auto Mine
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/auto-mine.js
// @version      0.5
// @description  A port of the loathers/oreo KoLmafia script to the browser: farms 1,970 carat gold in the Velvet / Gold Mine. Whenever you are looking at mining.php it paints its advice onto the mine -- the recommended square, the route to it, and why -- and puts a "Mine" button in that same advice box, which opens a panel where you pick a strategy (pjb, oreo, ev, ev-cluster), a visibility mode and a turn budget and press Start; the run then drives mining.php from the menu frame, choosing each square by oreo's expected-value model and finding a new cavern when nothing left is worth a turn. The panel also keeps a running total of the turns you have spent mining today, which starts over at each KoL rollover. Unlike oreo it never buys or equips anything -- it reads what you already have and refuses to start when something is missing. The one exception is healing: when HP reaches the floor it can press charpane-heal.js's own "heal" button and carry on, which you can switch off in the panel.
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @match        https://www.kingdomofloathing.com/mining.php*
// @match        https://kingdomofloathing.com/mining.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every KoL script and
  // runs them on the union of all matched pages. Guard our own pages
  // explicitly. A no-op for the standalone install, whose @match already scopes
  // it here.
  //
  // TWO pages, and the halves they run are different:
  //
  //   menu frame  -- the engine and its panel. See "WHY THIS RUNS IN THE MENU
  //                  FRAME" below; same reasoning as auto-combat.js.
  //   mining.php  -- the advisor overlay, and the button that starts a run,
  //                  which sits in the advisor's own box.
  //
  // The button used to live in the charpane, beside Auto Combat's, and it
  // moved here on purpose: the mine is the only place a mining run makes sense
  // to start, the advice already tells you what the run is about to do, and a
  // button next to that advice reads as "do this" rather than as a control
  // stranded three frames away from the thing it drives. The charpane is still
  // READ across the frames -- for the character name and for charpane-heal.js's
  // heal button -- but the script no longer runs there.
  //
  // Everything above the page dispatch is defined on both and used by
  // whichever half needs it. The strategy core in particular is shared: the
  // advisor and the engine must not be able to disagree about the best square.
  const ON_MENU = /\/(awesomemenu|topmenu)\.php/i.test(location.pathname);
  const ON_MINE = /\/mining\.php/i.test(location.pathname);
  if (!ON_MENU && !ON_MINE) return;

  // ===================================================================
  // WHY THIS RUNS IN THE MENU FRAME
  //
  // Same choice as auto-combat.js, for the same reason: topmenu/awesomemenu is
  // the only frame that is not torn down while you play, so a driver loop has
  // somewhere to stand. The loop talks to the server with
  // `fetch(credentials:'same-origin')` and never navigates a frame, so the run
  // survives you clicking around in the mainpane, and reloading the whole
  // frameset (F5) kills it. There is deliberately no resume-after-reload.
  //
  // A mining loop could just as well have lived on mining.php itself -- unlike
  // adventure.php, the mine page does not replace itself out from under you.
  // It lives here anyway so that the button, the panel and the log work the
  // same way they do for Auto Combat, and so that closing the mine page does
  // not silently kill a run you were told was running.
  // ===================================================================

  const ORIGIN = location.origin;

  // The Velvet / Gold Mine. oreo is a mine-6 script: its whole probability
  // model (six unsmoothed velvet in one connected cluster, three New Age
  // healing crystals, one gold plus a coin-flip second, fifteen targets in
  // all) describes this mine and is simply wrong in Itznotyerzitz or the Knob
  // Shaft. Nothing here tries to generalise.
  const MINE = 6;

  const BUTTON_ID = 'tm-automine-btn';
  const PANEL_ID = 'tm-automine-panel';
  const ADVICE_ID = 'tm-automine-advice';
  // The advice box is a row: the text on the left, the Mine button on the
  // right. paintAdvice writes the text, so it needs its own node -- setting
  // textContent on the box would take the button with it.
  const ADVICE_TEXT_ID = 'tm-automine-advice-text';
  const MENU_API = 'tmAutoMine';

  const PREFS_KEY = 'tm-automine-prefs';
  // Our stand-in for KoLmafia's `mineLayout6`: what each square we have opened
  // in THIS cavern turned out to hold. Suffixed with the character name so a
  // multi does not inherit someone else's cavern.
  const LAYOUT_KEY = 'tm-automine-layout';
  // Turns spent mining today, also per character. Survives stopping and
  // restarting the run, and the frameset reload that kills one.
  const DAILY_KEY = 'tm-automine-daily';
  // The last character name we managed to read. See characterName(): the name
  // is what suffixes the two keys above, and it has to survive a charpane that
  // is momentarily unreadable.
  const CHARACTER_KEY = 'tm-automine-character';

  // charpane-heal.js's button. We press that script's button rather than
  // casting anything ourselves: it already knows which heal skills you own and
  // in what order to try them, and a second copy of that list here would be a
  // second copy to keep in step.
  const HEAL_BUTTON_ID = 'tm-charpane-heal';

  // Pause between requests. KoL is a small game on modest hardware and this is
  // a bot loop; keep it civil. Raise it, don't lower it.
  const REQUEST_DELAY_MS = 500;

  // Hard ceiling on requests per run, as a multiple of the turns asked for.
  // Finding a new cavern costs a request without costing a turn and a run may
  // reset many times, so cycles > turns is normal -- this only exists to bound
  // a loop that has stopped making progress.
  const CYCLE_BUDGET_FACTOR = 3;
  const CYCLE_BUDGET_CONSTANT = 40;

  // Pressing the heal button is a click, not a promise -- charpane-heal.js
  // casts in its own frame and tells us nothing -- so progress is read back
  // from api.php. Poll this often, give up after this many polls, and give up
  // early after this many polls in a row that did not move HP at all.
  const HEAL_POLL_MS = 1500;
  const HEAL_POLL_LIMIT = 40;
  const HEAL_STALL_LIMIT = 4;

  // minin' dynamite, from KoLmafia's data/items.txt. Only ever counted, never
  // bought -- the script reads what you hold and uses it to discount a route,
  // and that is the whole of its involvement.
  const DYNAMITE_ITEM_ID = 7950;

  // ===================================================================
  // THE STRATEGY CORE
  //
  // A direct port of oreo's src/strategy.ts. The numbers are theirs: the row
  // weights, the cluster weights, the calibrated lambdas, the 0.496 chance of
  // a second gold. Keep this section a translation rather than a rewrite --
  // when oreo recalibrates, the diff should be obvious.
  //
  // Two coordinate systems meet here, and mixing them up is the classic bug:
  //
  //   KoL's        (col, row), both 1..6, row 1 at the TOP of the mine and row
  //                6 at the bottom, where you are standing. This is what the
  //                page's alt text says and what `which` is built from.
  //   oreo's       a flat index 0..35 with index 0..5 being the FRONT row --
  //                that is, KoL row 6 -- which is why `isLegal` can say "row 0
  //                is always reachable".
  //
  // coordinateToIndex/indexToCoordinate convert; statePositionToIndex converts
  // from the 36-character state string, which is in KoL's order.
  // ===================================================================

  const STRATEGIES = ['pjb', 'oreo', 'ev', 'ev-cluster'];
  const VISIBILITIES = ['low', 'auto', 'high'];

  const DEFAULT_VALUES = { ore: 25, gold: 20000, crystal: 69, cave: 0 };
  const DEFAULT_SECOND_GOLD_CHANCE = 0.496;

  const TARGETS_PER_MINE = 15;
  const ROW_ORE_WEIGHT = [0, 0, 0.1868, 0.4698, 0.6209, 0.67];
  const CLUSTER_ROW_WEIGHT = [0, 0, 0.46, 0.46, 0.46, 1];
  const CENTER = 3;

  const rowOf = (index) => Math.floor(index / 6);
  const colOf = (index) => index % 6;

  const NEIGHBORS = Array.from({ length: 36 }, (_, index) => {
    const row = rowOf(index);
    const col = colOf(index);
    const result = [];
    if (row > 0) result.push(index - 6);
    if (row < 5) result.push(index + 6);
    if (col > 0) result.push(index - 1);
    if (col < 5) result.push(index + 1);
    return result;
  });

  function coordinateToIndex(coordinate) {
    return (6 - coordinate[1]) * 6 + coordinate[0] - 1;
  }

  function indexToCoordinate(index) {
    return [colOf(index) + 1, 6 - rowOf(index)];
  }

  function statePositionToIndex(position) {
    const gameRow = Math.floor(position / 6);
    return (5 - gameRow) * 6 + (position % 6);
  }

  // A square can be dug when it is still wall and either sits in the front row
  // or touches something already open. Note this is computed, not read off the
  // page: the page's own anchors say the same thing, and the two are
  // cross-checked in the advisor, but the engine plans routes through squares
  // that are not yet reachable and so cannot ask the page about them.
  function isLegal(index, opened) {
    return (
      !opened.has(index) &&
      (rowOf(index) === 0 || NEIGHBORS[index].some((neighbor) => opened.has(neighbor)))
    );
  }

  // Dijkstra over the unopened squares, from every square that is reachable
  // right now, with each square costing a turn (or the price of a stick of
  // dynamite, when we hold one and the square is known to be dull). The
  // tie-break on the lower parent index is oreo's and is load-bearing for
  // reproducibility: without it two equal-cost routes are picked by iteration
  // order, and the same board can advise two different squares.
  function minimumCostPaths(opened, starts, tileCost) {
    const distances = Array(36).fill(Infinity);
    const parents = Array(36).fill(-1);
    const visited = new Set();

    for (const start of [...starts].sort((a, b) => a - b)) {
      if (!opened.has(start)) distances[start] = tileCost(start);
    }

    for (let step = 0; step < 36; step++) {
      let current = -1;
      for (let index = 0; index < 36; index++) {
        if (!visited.has(index) && (current < 0 || distances[index] < distances[current])) {
          current = index;
        }
      }
      if (current < 0 || !Number.isFinite(distances[current])) break;
      visited.add(current);

      for (const neighbor of NEIGHBORS[current]) {
        if (opened.has(neighbor) || visited.has(neighbor)) continue;
        const candidate = distances[current] + tileCost(neighbor);
        if (
          candidate < distances[neighbor] ||
          (candidate === distances[neighbor] &&
            (parents[neighbor] < 0 || current < parents[neighbor]))
        ) {
          distances[neighbor] = candidate;
          parents[neighbor] = current;
        }
      }
    }

    const paths = new Map();
    for (let target = 0; target < 36; target++) {
      if (!Number.isFinite(distances[target])) continue;
      const path = [];
      for (let node = target; node >= 0; node = parents[node]) path.unshift(node);
      paths.set(target, { cost: distances[target], path });
    }
    return paths;
  }

  // Every connected six-square shape the ore vein could be, restricted to the
  // back four rows (oreo's `rowOf >= 2`), each weighted by the row weights.
  // There are 1226 of them and enumerating them costs about 10ms, which is
  // cheap -- but the menu frame loads with the game and does not need this
  // until you start a run, so it is built on first use rather than at load.
  let oreClustersMemo = null;
  function oreClusters() {
    if (oreClustersMemo) return oreClustersMemo;
    const region = Array.from({ length: 36 }, (_, index) => index).filter(
      (index) => rowOf(index) >= 2
    );
    const inRegion = new Set(region);
    const seen = new Set();
    const clusters = [];

    const grow = (tiles) => {
      const key = [...tiles].sort((a, b) => a - b).join(',');
      if (seen.has(key)) return;
      seen.add(key);
      if (tiles.length === 6) {
        clusters.push([...tiles]);
        return;
      }
      const present = new Set(tiles);
      for (const tile of tiles) {
        for (const neighbor of NEIGHBORS[tile]) {
          if (inRegion.has(neighbor) && !present.has(neighbor)) grow([...tiles, neighbor]);
        }
      }
    };

    for (const start of region) grow([start]);
    oreClustersMemo = clusters.map((tiles) => ({
      tiles,
      weight: tiles.reduce((weight, tile) => weight * CLUSTER_ROW_WEIGHT[rowOf(tile)], 1),
    }));
    return oreClustersMemo;
  }

  // The posterior probability that each square is ore, given everything we
  // know, computed by keeping only the vein shapes still consistent with it.
  // Returns null when nothing is consistent -- which means one of our
  // observations is wrong, not that the mine is strange, so the caller falls
  // back to the per-square estimate and says so once.
  function clusterOrePosterior(knownOre, knownNonOre, sparkleSubset) {
    const mass = Array(36).fill(0);
    let total = 0;
    for (const cluster of oreClusters()) {
      if ([...knownOre].some((tile) => !cluster.tiles.includes(tile))) continue;
      if (cluster.tiles.some((tile) => knownNonOre.has(tile))) continue;
      if (sparkleSubset && cluster.tiles.some((tile) => !sparkleSubset.has(tile))) continue;
      total += cluster.weight;
      for (const tile of cluster.tiles) mass[tile] += cluster.weight;
    }
    if (total === 0) return null;
    for (let index = 0; index < mass.length; index++) mass[index] /= total;
    return mass;
  }

  class StrategyController {
    constructor(strategy, visibility, lambdaOverride, values, secondGoldChance, onWarning) {
      this.knownSparkles = new Set();
      this.knownDull = new Set();
      this.observed = new Map();
      this.opened = new Set();
      this.plannedPath = [];
      this.fullMineSeen = false;
      this.dynamitePrice = Infinity;
      this.dynamiteAvailable = 0;
      this.stateAvailable = true;
      this.warnedImpossibleCluster = false;

      this.strategy = strategy;
      this.visibility = visibility;
      this.lambdaOverride = lambdaOverride || 0;
      this.values = values || DEFAULT_VALUES;
      this.secondGoldChance =
        secondGoldChance == null ? DEFAULT_SECOND_GOLD_CHANCE : secondGoldChance;
      this.onWarning = onWarning || function () {};

      if (
        !Number.isFinite(this.secondGoldChance) ||
        this.secondGoldChance < 0 ||
        this.secondGoldChance > 1
      ) {
        throw new Error('Second-gold chance must be between zero and one.');
      }
    }

    reset() {
      this.knownSparkles.clear();
      this.knownDull.clear();
      this.observed.clear();
      this.opened.clear();
      this.plannedPath = [];
      this.fullMineSeen = false;
      this.stateAvailable = true;
      this.warnedImpossibleCluster = false;
    }

    // rawState is the 36-character string; previouslyMined is what our stored
    // layout says about squares already opened in this cavern, as
    // [[col,row], resource] pairs.
    update(rawState, hasObjectDetection, previouslyMined) {
      if (!rawState || rawState.length !== 36) {
        this.knownSparkles.clear();
        this.knownDull.clear();
        this.opened.clear();
        this.plannedPath = [];
        this.stateAvailable = false;
        return;
      }
      this.stateAvailable = true;

      this.opened = new Set();
      for (let position = 0; position < rawState.length; position++) {
        if (rawState[position] === 'o') this.opened.add(statePositionToIndex(position));
      }
      for (const entry of previouslyMined || []) {
        const index = coordinateToIndex(entry[0]);
        if (this.opened.has(index)) this.observed.set(index, entry[1]);
      }

      const fullVisibility = this.visibility !== 'low' && hasObjectDetection;
      if (fullVisibility) this.fullMineSeen = true;

      for (let position = 0; position < rawState.length; position++) {
        const index = statePositionToIndex(position);
        if (this.opened.has(index) || (!fullVisibility && !isLegal(index, this.opened))) continue;
        if (rawState[position] === '*') {
          this.knownSparkles.add(index);
          this.knownDull.delete(index);
        } else {
          this.knownDull.add(index);
          this.knownSparkles.delete(index);
        }
      }
      for (const index of this.opened) this.knownSparkles.delete(index);
      this.plannedPath = this.plannedPath.filter((index) => !this.opened.has(index));
    }

    // A sparkle that yielded nothing was a cave-in: KoLmafia infers the same
    // thing from the absence of an item, and it matters because a cave-in
    // square is proof that square was not ore.
    recordMine(coordinate, resource) {
      const index = coordinateToIndex(coordinate);
      const wasSparkle = this.knownSparkles.has(index);
      this.knownSparkles.delete(index);
      this.opened.add(index);
      if (resource) this.observed.set(index, resource);
      else if (wasSparkle) this.observed.set(index, 'cave');
    }

    shouldResetAfterGold() {
      return this.strategy === 'pjb' || this.strategy === 'oreo';
    }

    needsObjectDetection() {
      return this.visibility === 'high' && !this.fullMineSeen;
    }

    setDynamitePrice(price) {
      // Infinity is a legal price here, and it is the important one: it is the
      // constructor's own default and what makeController passes whenever the
      // panel's dynamite field is 0 or blank, meaning "a stick has no price I
      // know, so never route through dull rock". Number.isFinite refused
      // exactly that value, so the DEFAULT preferences threw on every
      // controller ever built -- which took the advisor down, and with it the
      // Mine button that lives in the advisor's box. Only NaN and negatives
      // are actually wrong.
      if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
        throw new Error('Dynamite price must be non-negative.');
      }
      this.dynamitePrice = price;
    }

    setDynamiteAvailable(quantity) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error('Available dynamite must be a non-negative integer.');
      }
      if (this.dynamiteAvailable > 0 && quantity === 0) this.plannedPath = [];
      this.dynamiteAvailable = quantity;
    }

    shouldUseDynamite() {
      return this.dynamitePrice < this.turnValue();
    }

    decide() {
      if (!this.stateAvailable) {
        return { action: 'reset', reason: 'mine state is unavailable' };
      }
      if (this.plannedPath.length > 0) {
        const next = this.plannedPath[0];
        if (isLegal(next, this.opened)) {
          return {
            action: 'mine',
            coordinate: indexToCoordinate(next),
            reason: 'continuing the selected EV route',
            path: this.plannedPath.slice(),
          };
        }
        this.plannedPath = [];
      }

      if (this.strategy === 'pjb' || this.strategy === 'oreo') {
        return this.communityDecision();
      }
      return this.evDecision(this.strategy === 'ev-cluster');
    }

    communityDecision() {
      const candidates = [...this.knownSparkles]
        .filter((index) => rowOf(index) <= 1 && isLegal(index, this.opened))
        .sort((a, b) => a - b);
      if (candidates.length > 0) {
        return {
          action: 'mine',
          coordinate: indexToCoordinate(candidates[0]),
          reason: 'mining the first accessible front-two-row sparkle',
          path: [candidates[0]],
        };
      }

      if (this.opened.size > 0) {
        return { action: 'reset', reason: 'no accessible front-two-row sparkle remains' };
      }

      let column = CENTER;
      if (this.strategy === 'oreo' && this.fullMineSeen) {
        let bestStart = -1;
        let bestLength = 0;
        for (let start = 0; start < 6; ) {
          if (!this.knownSparkles.has(6 + start)) {
            start++;
            continue;
          }
          let end = start;
          while (end < 6 && this.knownSparkles.has(6 + end)) end++;
          if (end - start > bestLength) {
            bestStart = start;
            bestLength = end - start;
          }
          start = end;
        }
        if (bestStart >= 0) column = bestStart;
      }
      return {
        action: 'mine',
        coordinate: indexToCoordinate(column),
        reason:
          column === CENTER
            ? 'probing the center of the front row'
            : 'probing above the longest second-row sparkle vein',
        path: [column],
      };
    }

    evDecision(cluster) {
      const ev = this.expectedValues(cluster);
      const starts = new Set();
      for (let index = 0; index < 6; index++) {
        if (!this.opened.has(index)) starts.add(index);
      }
      for (const opened of this.opened) {
        for (const neighbor of NEIGHBORS[opened]) {
          if (!this.opened.has(neighbor)) starts.add(neighbor);
        }
      }

      let best = null;
      const lambda = this.turnValue();
      const paths = minimumCostPaths(this.opened, starts, (index) =>
        this.knownDull.has(index) && this.shouldUseDynamite() && this.dynamiteAvailable > 0
          ? this.dynamitePrice
          : lambda
      );
      for (const target of [...this.knownSparkles].sort((a, b) => a - b)) {
        const route = paths.get(target);
        if (!route) continue;
        const reward = ev[target];
        const score = reward - route.cost;
        if (!best || score > best.score) {
          best = { path: route.path, score, reward };
        }
      }

      if (!best) {
        return this.opened.size === 0
          ? {
              action: 'mine',
              coordinate: indexToCoordinate(CENTER),
              reason: 'probing the center because no sparkle is visible',
              path: [CENTER],
            }
          : { action: 'reset', reason: 'no visible sparkle remains' };
      }
      if (this.opened.size > 0 && best.score < 0) {
        return {
          action: 'reset',
          reason: 'best route EV ' + best.reward.toFixed(0) + ' is below its turn/dynamite cost',
        };
      }

      this.plannedPath = best.path;
      return {
        action: 'mine',
        coordinate: indexToCoordinate(best.path[0]),
        reason:
          'best route has EV ' +
          best.reward.toFixed(0) +
          ', ' +
          best.path.length +
          ' step(s), lambda=' +
          lambda,
        path: best.path.slice(),
      };
    }

    // What another turn in this cavern is worth. Below this, resetting wins.
    // The constants are oreo's calibrated defaults; there is no calibration
    // harness here (it needs mall prices and a thousand synthetic boards), so
    // recalibrating means running oreo in KoLmafia and pasting the number into
    // the panel's lambda field.
    turnValue() {
      if (this.lambdaOverride > 0) return this.lambdaOverride;
      if (this.strategy === 'ev-cluster') return this.fullMineSeen ? 3500 : 3714;
      if (this.strategy === 'ev') return 3571;
      return 3500;
    }

    expectedValues(cluster) {
      return cluster ? this.clusterExpectedValues() : this.perTileExpectedValues();
    }

    remainingCounts(targetCount) {
      let ore = 0;
      let crystal = 0;
      let gold = 0;
      for (const type of this.observed.values()) {
        if (type === 'ore') ore++;
        else if (type === 'crystal') crystal++;
        else if (type === 'gold') gold++;
      }
      const oreRemaining = Math.max(0, 6 - ore);
      const crystalRemaining = Math.max(0, 3 - crystal);
      const goldRemaining = Math.max(0, 1 + this.secondGoldChance - gold);
      return {
        oreRemaining,
        crystalRemaining,
        goldRemaining,
        caveRemaining: Math.max(
          0,
          targetCount - oreRemaining - crystalRemaining - goldRemaining
        ),
      };
    }

    perTileExpectedValues() {
      const result = Array(36).fill(0);
      const targets = [...this.knownSparkles];
      const targetCount = this.fullMineSeen
        ? targets.length
        : TARGETS_PER_MINE - this.observed.size;
      const counts = this.remainingCounts(targetCount);
      const oreProbability = new Map();

      if (this.fullMineSeen) {
        const eligible = targets.filter(
          (index) =>
            rowOf(index) >= 2 &&
            NEIGHBORS[index].some(
              (neighbor) =>
                this.observed.get(neighbor) === 'ore' || this.knownSparkles.has(neighbor)
            )
        );
        const weightTotal = eligible.reduce(
          (sum, index) => sum + ROW_ORE_WEIGHT[rowOf(index)],
          0
        );
        for (const index of eligible) {
          oreProbability.set(
            index,
            weightTotal > 0
              ? Math.min(1, (counts.oreRemaining * ROW_ORE_WEIGHT[rowOf(index)]) / weightTotal)
              : 0
          );
        }
      }

      for (const index of targets) {
        let pOre = oreProbability.has(index) ? oreProbability.get(index) : 0;
        if (!this.fullMineSeen && rowOf(index) >= 2 && counts.oreRemaining > 0) {
          const adjacentPossibleOre = NEIGHBORS[index].some(
            (neighbor) =>
              this.observed.get(neighbor) === 'ore' || this.knownSparkles.has(neighbor)
          );
          pOre = Math.min(1, ROW_ORE_WEIGHT[rowOf(index)] * (adjacentPossibleOre ? 1 : 0.3));
        }
        result[index] = this.nonOreAdjustedValue(pOre, counts);
      }
      return result;
    }

    clusterExpectedValues() {
      const knownOre = new Set();
      const knownNonOre = new Set();
      for (const entry of this.observed) {
        if (entry[1] === 'ore') knownOre.add(entry[0]);
        else knownNonOre.add(entry[0]);
      }
      for (const index of this.knownDull) knownNonOre.add(index);
      const unknownOpened = [...this.opened].filter(
        (index) => !this.observed.has(index) && !this.knownDull.has(index)
      );
      const subset = this.fullMineSeen
        ? new Set([...this.knownSparkles, ...knownOre, ...unknownOpened])
        : null;
      const pOre = clusterOrePosterior(knownOre, knownNonOre, subset);
      if (pOre === null) {
        if (!this.warnedImpossibleCluster) {
          this.onWarning(
            'Observed mine state is inconsistent with every ore cluster; using per-tile estimates.'
          );
          this.warnedImpossibleCluster = true;
        }
        return this.perTileExpectedValues();
      }
      const targetCount = this.fullMineSeen
        ? this.knownSparkles.size
        : TARGETS_PER_MINE - this.observed.size;
      const counts = this.remainingCounts(targetCount);
      const result = Array(36).fill(0);
      for (const index of this.knownSparkles) {
        result[index] = this.nonOreAdjustedValue(
          counts.oreRemaining > 0 ? pOre[index] : 0,
          counts
        );
      }
      return result;
    }

    nonOreAdjustedValue(pOre, counts) {
      const nonOreTotal = counts.goldRemaining + counts.crystalRemaining + counts.caveRemaining;
      const pNonOre = 1 - pOre;
      const pGold = nonOreTotal > 0 ? (pNonOre * counts.goldRemaining) / nonOreTotal : 0;
      const pCrystal = nonOreTotal > 0 ? (pNonOre * counts.crystalRemaining) / nonOreTotal : 0;
      return pOre * this.values.ore + pGold * this.values.gold + pCrystal * this.values.crystal;
    }
  }

  // ===================================================================
  // READING THE MINE PAGE
  //
  // KoLmafia does this in MineDecorator.java and its parse is the contract we
  // copy, because it is the one the fixtures in KoLmafia's own test suite are
  // asserted against:
  //
  //   - The grid lives in <div id='postload'> and is 8x8. The outer ring is
  //     unbreakable scenery; only col and row 1..6 are real squares, which is
  //     why mafia's regex only accepts [123456].
  //   - Every square carries alt='<Name> (col,row)'. "Open Cavern" -> 'o',
  //     "Promising Chunk of Wall" -> '*', "Rocky Wall" -> 'X'.
  //   - The state string is those 36 characters ordered by (row-1)*6+(col-1),
  //     i.e. reading order with row 1 at the top.
  //   - A diggable square is wrapped in <a href='mining.php?mine=6&which=N&
  //     pwd=...'>, where N is col + 8*row -- the index into the full 8-wide
  //     grid, not the 6-wide interior.
  //
  // There are two readers because there are two callers. The engine has the
  // response as text and wants nothing but the state, so it uses the regex
  // reader and never constructs a document. The advisor is already standing in
  // the page and needs the elements themselves to highlight, so it uses the
  // DOM reader. Both hand back the same tile records and both go through
  // stateFromTiles, so they cannot drift apart.
  // ===================================================================

  const TILE_NAME_CODES = {
    'open cavern': 'o',
    'promising chunk of wall': '*',
    'rocky wall': 'X',
  };

  function codeForName(name) {
    const key = String(name || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(TILE_NAME_CODES, key)
      ? TILE_NAME_CODES[key]
      : '?';
  }

  // col + 8*row, the `which` parameter. Derived rather than scraped: it is a
  // pure function of the coordinates, and deriving it means a square we plan a
  // route through -- which has no anchor yet, so nothing to scrape -- is
  // addressed the same way as one we can dig right now.
  function whichFor(col, row) {
    return col + 8 * row;
  }

  function tileRecord(name, col, row, linkedWhich) {
    return {
      name: String(name || '').trim(),
      code: codeForName(name),
      col: col,
      row: row,
      which: whichFor(col, row),
      index: coordinateToIndex([col, row]),
      linked: linkedWhich.has(whichFor(col, row)),
    };
  }

  // Every `which` the page offers a link to. Anchor presence is KoL's own
  // statement of what is diggable, so the advisor cross-checks isLegal against
  // it rather than trusting either alone.
  function linkedWhichFromHtml(html) {
    const linked = new Set();
    const re = /mining\.php\?[^'"\s>]*which=(\d+)/gi;
    let match;
    while ((match = re.exec(html)) !== null) linked.add(Number(match[1]));
    return linked;
  }

  function readTilesFromHtml(html) {
    const text = String(html || '');
    const linked = linkedWhichFromHtml(text);
    const tiles = [];
    // Deliberately tolerant of either quote style and of attribute order; KoL
    // writes alt and title identically, and title is skipped because alt comes
    // first on every square.
    const re = /alt=(['"])([^(]*?)\s*\((\d+),(\d+)\)\1/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const col = Number(match[3]);
      const row = Number(match[4]);
      if (col < 1 || col > 6 || row < 1 || row > 6) continue;
      tiles.push(tileRecord(match[2], col, row, linked));
    }
    return tiles;
  }

  function readTilesFromDoc(doc) {
    // No href scan on this path: standing in the page, the anchor wrapping the
    // square IS the answer, so `closest('a')` below settles `linked` and there
    // is no reason to serialise the document to ask the same question twice.
    const linked = new Set();
    const tiles = [];
    const imgs = doc.querySelectorAll('img[alt]');
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const alt = img.getAttribute('alt') || '';
      const match = /^(.*?)\s*\((\d+),(\d+)\)$/.exec(alt);
      if (!match) continue;
      const col = Number(match[2]);
      const row = Number(match[3]);
      if (col < 1 || col > 6 || row < 1 || row > 6) continue;
      const record = tileRecord(match[1], col, row, linked);
      record.img = img;
      record.cell = img.closest ? img.closest('td') : null;
      record.anchor = img.closest ? img.closest('a') : null;
      if (record.anchor) record.linked = true;
      tiles.push(record);
    }
    return tiles;
  }

  // The 36-character state, or null when the page did not give us a complete
  // grid. Null is the honest answer for "the mainpane is showing something
  // else", and the controller already treats a wrong-length state as
  // unavailable rather than guessing.
  function stateFromTiles(tiles) {
    const cells = Array(36).fill(null);
    for (const tile of tiles) {
      cells[(tile.row - 1) * 6 + (tile.col - 1)] = tile.code;
    }
    if (cells.some((cell) => cell === null)) return null;
    return cells.join('');
  }

  function pwdFromHtml(html) {
    const text = String(html || '');
    let match = /name=['"]?pwd['"]?\s+value=['"]([0-9a-f]{32})['"]/i.exec(text);
    if (match) return match[1];
    match = /[?&]pwd=([0-9a-f]{32})/i.exec(text);
    return match ? match[1] : null;
  }

  // The part of the page that describes the dig we just made: from the
  // "Results:" header to the start of the mine grid.
  //
  // BOTH ends matter. KoLmafia's relay redraws squares you have already opened
  // with the art of whatever you found there, so once you have struck gold
  // every later page carries a goldnugget.gif in the grid -- reading to the end
  // of the document would report gold on every turn from then on. The grid is
  // in <div id='postload'>, preceded by <div id='preload'>, so the first of
  // those two is the end of anything worth reading.
  function resultScope(html) {
    const text = String(html || '');
    const marker = text.indexOf('Results:');
    const rest = text.slice(marker === -1 ? 0 : marker);
    const grid = rest.search(/<div\s+id=['"]?(pre|post)load/i);
    return grid === -1 ? rest : rest.slice(0, grid);
  }

  // What a dig turned up.
  //
  // Item art from KoLmafia's data/items.txt: unsmoothed velvet rawvelvet.gif,
  // 1,970 carat gold goldnugget.gif, New Age healing crystal nacrystal1.gif.
  // A cave-in shows the generic hp.gif with "You lose N hit points".
  function parseMineResult(html) {
    const scope = resultScope(html);
    if (/itemimages\/goldnugget\.gif/i.test(scope)) return 'gold';
    if (/itemimages\/rawvelvet\.gif/i.test(scope)) return 'ore';
    if (/itemimages\/nacrystal1\.gif/i.test(scope)) return 'crystal';
    if (/itemimages\/hp\.gif/i.test(scope)) return 'cave';
    return null;
  }

  // ===================================================================
  // PERSISTENCE
  //
  // Two keys. Preferences are UI state and survive everything; the layout is
  // the current cavern's observations and is thrown away the moment the cavern
  // changes. The layout is per character -- the name comes off the charpane's
  // charsheet.php link, the same trick quest-helper.js uses for the pyramid --
  // because a multi sharing one cavern's observations would be worse than
  // having none.
  // ===================================================================

  // The name is READ from a frame that can be busy, and that is the whole
  // difficulty. charpane-heal.js finishes by reloading the charpane, and while
  // that reload is in flight the charpane has no charsheet.php link -- so a
  // probe run at that moment used to answer 'unknown', the keys became
  // `...:unknown`, and both stores silently switched to an empty bucket. The
  // visible symptom was the day's turn count dropping to 0 just after a heal
  // and coming back a moment later; the invisible one was turns and cavern
  // observations being written to the stray bucket in between.
  //
  // So a probe that fails no longer answers: it falls through to the last name
  // we knew. Four sources, in this order --
  //
  //   the pages        -- our own document, then the charpane. Asked FIRST,
  //                       and not just out of habit: on a multi this is the
  //                       only source that can tell you the frameset in front
  //                       of you belongs to a different character now.
  //   the cache        -- this frame resolved it earlier. This is the one that
  //                       covers the charpane reload.
  //   localStorage     -- an earlier frame did. Covers a menu frame that loads
  //                       before the charpane has drawn.
  //
  // -- and 'unknown' only when all of them come up empty. api.php carries the
  // name too, and getStatus() feeds it in here; that is the authoritative
  // source and the one immune to what any frame happens to be doing.
  let knownCharacterName = null;

  function rememberCharacterName(name) {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed || trimmed === knownCharacterName) return;
    knownCharacterName = trimmed;
    writeJson(CHARACTER_KEY, { name: trimmed });
    forgetUnknownBuckets();
  }

  // Anything already written under `:unknown` was written by this bug. It
  // cannot be handed back to a character -- on a multi it could belong to
  // either -- so it is dropped rather than merged into someone's total.
  function forgetUnknownBuckets() {
    try {
      window.localStorage.removeItem(DAILY_KEY + ':unknown');
      window.localStorage.removeItem(LAYOUT_KEY + ':unknown');
    } catch (e) { /* storage unavailable; nothing to clean up */ }
  }

  function characterName() {
    const probe = (doc) => {
      if (!doc || !doc.querySelector) return null;
      const link = doc.querySelector('a[href*="charsheet.php"]');
      const text = link && link.textContent ? link.textContent.trim() : '';
      return text || null;
    };
    try {
      const own = probe(document);
      if (own) { rememberCharacterName(own); return knownCharacterName; }
    } catch (e) { /* no document to read */ }
    try {
      const cp = top.frames['charpane'];
      const name = cp && cp.document ? probe(cp.document) : null;
      if (name) { rememberCharacterName(name); return knownCharacterName; }
    } catch (e) { /* cross-frame access failed */ }

    if (knownCharacterName) return knownCharacterName;

    const stored = readJson(CHARACTER_KEY, {});
    if (typeof stored.name === 'string' && stored.name) {
      knownCharacterName = stored.name;
      return knownCharacterName;
    }

    // Never cached: this is "I could not tell", not an answer, and the next
    // call must be free to do better.
    return 'unknown';
  }

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable or full; not worth failing a run over */ }
  }

  const DEFAULT_PREFS = {
    strategy: 'ev-cluster',
    visibility: 'auto',
    turns: '',
    lambda: 0,
    ore: DEFAULT_VALUES.ore,
    gold: DEFAULT_VALUES.gold,
    crystal: DEFAULT_VALUES.crystal,
    dynamite: 0,
    hpFloor: 60,
    healLowHp: true,
  };

  function loadPrefs() {
    const stored = readJson(PREFS_KEY, {});
    const prefs = Object.assign({}, DEFAULT_PREFS, stored);
    if (STRATEGIES.indexOf(prefs.strategy) === -1) prefs.strategy = DEFAULT_PREFS.strategy;
    if (VISIBILITIES.indexOf(prefs.visibility) === -1) prefs.visibility = DEFAULT_PREFS.visibility;
    prefs.healLowHp = prefs.healLowHp !== false;
    return prefs;
  }

  function savePrefs(prefs) {
    writeJson(PREFS_KEY, prefs);
  }

  function layoutKey() {
    return LAYOUT_KEY + ':' + characterName();
  }

  // { "<which>": "ore" | "gold" | "crystal" | "cave" }, mirroring the shape of
  // KoLmafia's mineLayout6 without its HTML.
  function loadLayout() {
    return readJson(layoutKey(), {});
  }

  function recordLayout(which, resource) {
    if (!resource) return;
    const layout = loadLayout();
    layout[String(which)] = resource;
    writeJson(layoutKey(), layout);
  }

  function clearLayout() {
    try {
      window.localStorage.removeItem(layoutKey());
    } catch (e) { /* nothing to clear */ }
  }

  // Layout entries in the shape update() wants. Anything the stored layout
  // claims about a square the mine says is still wall is dropped by update()
  // itself, so a stale entry cannot poison a fresh cavern.
  function layoutEntries() {
    const layout = loadLayout();
    const entries = [];
    for (const key of Object.keys(layout)) {
      const which = Number(key);
      if (!Number.isFinite(which)) continue;
      const col = which % 8;
      const row = Math.floor(which / 8);
      if (col < 1 || col > 6 || row < 1 || row > 6) continue;
      entries.push([[col, row], layout[key]]);
    }
    return entries;
  }

  // A cavern with nothing open is a cavern we have never dug in, so whatever
  // the layout remembers belongs to a previous one. This is the only automatic
  // clear besides the explicit one on reset, and it is what makes the advisor
  // correct after you press Find New Cavern yourself.
  function forgetLayoutIfFreshCavern(state) {
    if (state && state.indexOf('o') === -1) clearLayout();
  }

  // ---- turns spent today ----------------------------------------------
  //
  // "Today" is KoL's day, not the browser's: turns belong to the day they were
  // spent in, and KoL's day ends at rollover (3:30am Arizona time), which for
  // most players is the middle of an afternoon. api.php's status block carries
  // `rollover`, the unix time of the NEXT rollover -- one value, constant for
  // the whole of a KoL day and different on the next one, which is a day key
  // as it stands. `daynumber` is the fallback if a future api.php drops it,
  // and the browser's own date is the last resort.
  //
  // There is no midnight timer and nothing has to be running for the counter
  // to start over: reading it with a day key that does not match the stored
  // one IS the reset.
  function localDayKey() {
    const now = new Date();
    return 'l' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  }

  function dayKeyFromStatus(json) {
    const rollover = num(json && json.rollover);
    if (rollover) return 'r' + rollover;
    const daynumber = num(json && json.daynumber);
    if (daynumber) return 'd' + daynumber;
    return localDayKey();
  }

  function dailyKey() {
    return DAILY_KEY + ':' + characterName();
  }

  // { day: <day key>, turns: N }.
  function loadDaily() {
    const stored = readJson(dailyKey(), {});
    const turns = Number(stored.turns);
    return {
      day: typeof stored.day === 'string' ? stored.day : null,
      turns: Number.isFinite(turns) && turns > 0 ? turns : 0,
    };
  }

  // The stored total, or 0 when it belongs to a day that is over. A null
  // dayKey means "I have no status to compare against" -- show what is stored
  // rather than a zero we cannot justify.
  function dailyTurns(dayKey) {
    const record = loadDaily();
    if (dayKey && record.day !== dayKey) return 0;
    return record.turns;
  }

  function addDailyTurns(dayKey, delta) {
    const record = loadDaily();
    const base = dayKey && record.day !== dayKey ? 0 : record.turns;
    const next = { day: dayKey || record.day, turns: base + Math.max(0, delta) };
    writeJson(dailyKey(), next);
    return next.turns;
  }

  function makeController(prefs, onWarning) {
    const controller = new StrategyController(
      prefs.strategy,
      prefs.visibility,
      Number(prefs.lambda) || 0,
      {
        ore: Number(prefs.ore) || 0,
        gold: Number(prefs.gold) || 0,
        crystal: Number(prefs.crystal) || 0,
        cave: 0,
      },
      DEFAULT_SECOND_GOLD_CHANCE,
      onWarning
    );
    const price = Number(prefs.dynamite);
    controller.setDynamitePrice(Number.isFinite(price) && price > 0 ? price : Infinity);
    return controller;
  }

  // ===================================================================
  // SERVER PLUMBING
  // ===================================================================

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const num = (value) => {
    const parsed = parseInt(String(value == null ? '' : value).replace(/,/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  async function getStatus() {
    const res = await fetch(ORIGIN + '/api.php?what=status&for=tm-auto-mine', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('api.php returned HTTP ' + res.status);
    const json = await res.json();
    // The one source that does not depend on a frame being idle. Every key
    // computed after this point is keyed to the right character even if the
    // charpane is mid-reload.
    rememberCharacterName(json.name);
    return {
      pwd: json.pwd,
      name: json.name,
      adventures: num(json.adventures),
      hp: num(json.hp),
      maxhp: num(json.maxhp),
      dayKey: dayKeyFromStatus(json),
      raw: json,
    };
  }

  async function getText(url) {
    const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    return res.text();
  }

  async function postForm(path, fields) {
    const body = new URLSearchParams();
    for (const key of Object.keys(fields)) body.append(key, String(fields[key]));
    const res = await fetch(ORIGIN + '/' + path.replace(/^\//, ''), {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + path);
    return res.text();
  }

  // api.php's status block lists active effects. libram also counts the
  // Dwarvish War Uniform as granting Object Detection; that outfit cannot be
  // worn in the Velvet / Gold Mine alongside the mining drill, so only the
  // effect is checked here.
  function hasObjectDetection(status) {
    const effects = status && status.raw && status.raw.effects;
    if (!effects || typeof effects !== 'object') return false;
    return Object.keys(effects).some((key) => {
      const entry = effects[key];
      const name = Array.isArray(entry) ? entry[0] : entry && entry.name;
      return typeof name === 'string' && /object detection/i.test(name);
    });
  }

  // How many sticks of minin' dynamite you are holding. Never a purchase: the
  // script reads what you have and uses it to discount a route through dull
  // rock, and that is the whole of its involvement.
  async function getDynamiteCount() {
    try {
      const res = await fetch(ORIGIN + '/api.php?what=inventory&for=tm-auto-mine', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) return 0;
      const json = await res.json();
      const count = num(json[String(DYNAMITE_ITEM_ID)]);
      return count && count > 0 ? count : 0;
    } catch (e) {
      return 0;
    }
  }

  // ===================================================================
  // HEALING
  //
  // The script still buys and equips nothing. Healing is the one thing it can
  // now do for itself, and it does it by pressing the "heal" button
  // charpane-heal.js puts next to the HP line -- that script owns the list of
  // heal skills and the order to try them in, and this one owns none of it.
  //
  // Two consequences worth knowing:
  //
  //   - No button means no healing. charpane-heal.js may not be installed, and
  //     the charpane is rebuilt on most turns, so the button is looked up
  //     fresh every time rather than held.
  //   - The click returns immediately; the casting happens in the other frame
  //     and reports nothing back, and it ends by reloading the charpane, which
  //     destroys the very button we pressed. So progress is read from api.php
  //     instead. If charpane-heal.js puts up an alert() (no skills found, say),
  //     the tab's modal blocks everything until you dismiss it, and the poll
  //     below simply waits it out.
  // ===================================================================

  function charpaneHealButton() {
    try {
      const cp = top.frames['charpane'];
      return (cp && cp.document && cp.document.getElementById(HEAL_BUTTON_ID)) || null;
    } catch (e) {
      return null; // cross-frame access failed
    }
  }

  // Press the button and wait for HP to clear `floor`. Resolves to the status
  // read that cleared it, or null with a reason for the log.
  async function healAboveFloor(floor, status) {
    if (status.maxhp != null && status.maxhp <= floor) {
      return { status: null, reason: 'your maximum HP of ' + status.maxhp + ' is at or below the floor' };
    }
    const btn = charpaneHealButton();
    if (!btn) {
      return { status: null, reason: 'no heal button in the charpane (is charpane-heal.js installed?)' };
    }
    log('HP is ' + status.hp + '; pressing the charpane heal button.');
    // A disabled button is charpane-heal.js already healing. Don't press it
    // again -- just wait on the same poll.
    if (!btn.disabled) btn.click();

    let last = status.hp;
    let stalled = 0;
    for (let poll = 0; poll < HEAL_POLL_LIMIT; poll++) {
      await sleep(HEAL_POLL_MS);
      // Stop is a whole minute away at the far end of this poll otherwise, and
      // a Stop press that appears to do nothing reads as a hung run.
      if (RUN.stopRequested) return { status: null, reason: 'stopped while healing' };
      let now;
      try {
        now = await getStatus();
      } catch (e) {
        continue; // a failed read is not a failed heal; poll again
      }
      if (now.hp == null) continue;
      if (now.hp > floor) return { status: now, reason: null };
      if (now.hp === last) {
        if (++stalled >= HEAL_STALL_LIMIT) break;
      } else {
        stalled = 0;
        last = now.hp;
      }
    }
    return { status: null, reason: 'healing did not get HP above ' + floor + ' (now ' + last + ')' };
  }

  // ===================================================================
  // THE ENGINE
  // ===================================================================

  const RUN = {
    active: false,
    stopRequested: false,
    requested: null, // turns asked for; null means "until adventures run out"
    used: 0, // adventures actually spent, measured from api.php
    resets: 0,
    cycle: 0,
    startAdv: null,
    lastAdv: null, // previous adventure total, for the per-pass difference
    today: dailyTurns(null), // turns spent mining today; see the daily store
    status: '',
    log: [],
    found: { gold: 0, ore: 0, crystal: 0, cave: 0 },
  };

  const LOG_LIMIT = 200;

  function log(message, kind) {
    RUN.log.push({ t: new Date(), msg: String(message), kind: kind || 'info' });
    if (RUN.log.length > LOG_LIMIT) RUN.log.splice(0, RUN.log.length - LOG_LIMIT);
    renderPanel();
  }

  function setStatus(text) {
    RUN.status = text;
    renderPanel();
    syncButton();
  }

  // Everything that must be true before a single turn is spent. oreo aborts
  // for the same reasons; the difference is that oreo can fix most of them by
  // buying and equipping, and we cannot, so each one is a refusal with a name
  // rather than a shopping list.
  //
  // The mining drill and the 15 Hot Resistance oreo checks for are not checked
  // here, for a reason worth keeping: without them KoL does not show you this
  // page at all, so a readable mine grid IS the check. What is genuinely
  // unchecked is the hippy medical kit, which only reduces cave-in damage --
  // the HP floor covers that ground instead.
  function preflight(state, tiles, pwd, status, prefs) {
    if (!pwd) return 'could not find your pwd hash on the mine page';
    if (!state) return 'that is not a mine grid -- open the Velvet / Gold Mine first';
    if (tiles.some((tile) => tile.code === '?')) {
      return 'the mine page has a square this script does not recognise';
    }
    if (status.adventures != null && status.adventures <= 0) return 'no adventures left';
    const floor = Number(prefs.hpFloor) || 0;
    if (status.hp != null && status.hp <= floor) {
      return 'HP is ' + status.hp + ', at or below the floor of ' + floor;
    }
    return null;
  }

  // Turns are MEASURED from api.php's adventure total rather than counted from
  // requests sent, because a free mining action (Unaccompanied Miner, Loded)
  // digs a square without costing one. `used` is this run's total and `today`
  // adds each pass's difference to the day's, so stopping and starting again
  // does not restart the daily count. Eating a lasagna mid-run raises the
  // total; the difference is clamped at zero rather than crediting you turns.
  function noteTurns(status) {
    if (status.adventures == null) return;
    if (RUN.startAdv != null) RUN.used = Math.max(0, RUN.startAdv - status.adventures);
    const spent = RUN.lastAdv == null ? 0 : Math.max(0, RUN.lastAdv - status.adventures);
    RUN.lastAdv = status.adventures;
    RUN.today = spent > 0
      ? addDailyTurns(status.dayKey, spent)
      : dailyTurns(status.dayKey);
  }

  function budget() {
    const asked = RUN.requested == null ? 200 : RUN.requested;
    return asked * CYCLE_BUDGET_FACTOR + CYCLE_BUDGET_CONSTANT;
  }

  function stop(reason) {
    RUN.stopRequested = true;
    if (reason) log(reason, 'warn');
  }

  // Finding a new cavern is free and is the page's own form, so it is posted
  // the way the page posts it. The layout belongs to the cavern and goes with
  // it.
  async function findNewCavern(pwd) {
    RUN.resets++;
    clearLayout();
    return postForm('mining.php', { mine: MINE, reset: 1, pwd: pwd });
  }

  async function runSession(prefs) {
    RUN.active = true;
    RUN.stopRequested = false;
    RUN.used = 0;
    RUN.resets = 0;
    RUN.cycle = 0;
    RUN.startAdv = null;
    RUN.lastAdv = null;
    RUN.log = [];
    RUN.found = { gold: 0, ore: 0, crystal: 0, cave: 0 };

    const controller = makeController(prefs, (message) => log(message, 'warn'));
    let pwd = null;

    try {
      const status = await getStatus();
      RUN.startAdv = status.adventures;
      noteTurns(status); // no turns yet; this seeds the baseline and the day
      pwd = status.pwd || null;

      controller.setDynamiteAvailable(await getDynamiteCount());
      if (controller.needsObjectDetection() && !hasObjectDetection(status)) {
        log(
          'High visibility asked for, but you do not have Object Detection. ' +
            'This script never buys a potion of detection -- running as low visibility.',
          'warn'
        );
      }

      // Seed from the mine itself. Every later pass reads the state out of the
      // response to the action we just took, so this is the only extra request
      // the run makes.
      let html = await getText(ORIGIN + '/mining.php?mine=' + MINE);

      while (!RUN.stopRequested) {
        if (RUN.cycle++ > budget()) {
          stop('request budget exhausted without finishing; stopping rather than spinning');
          break;
        }

        const tiles = readTilesFromHtml(html);
        const state = stateFromTiles(tiles);
        pwd = pwdFromHtml(html) || pwd;

        let fresh = await getStatus();
        // Account for the last dig before anything can stop the run, so turns
        // already spent always land in the day's total.
        noteTurns(fresh);

        // Low HP is the one refusal the script can now do something about.
        // Heal first, then let preflight judge the result -- if the heal did
        // not clear the floor, the run stops exactly as it did before.
        const floor = Number(prefs.hpFloor) || 0;
        if (prefs.healLowHp && fresh.hp != null && fresh.hp <= floor) {
          const healed = await healAboveFloor(floor, fresh);
          if (healed.status) {
            fresh = healed.status;
            noteTurns(fresh);
            log('healed to ' + fresh.hp + ' HP; carrying on.');
          } else {
            log(healed.reason, 'warn');
          }
        }

        const gate = preflight(state, tiles, pwd, fresh, prefs);
        if (gate) {
          stop('stopping: ' + gate);
          break;
        }

        // turns=0 is oreo's "free mining actions only": the moment a dig has
        // actually cost an adventure, the free ones are gone.
        if (RUN.requested === 0 && RUN.used > 0) {
          stop('free mining actions used up');
          break;
        }
        if (RUN.requested != null && RUN.requested > 0 && RUN.used >= RUN.requested) {
          stop('turn budget reached');
          break;
        }

        forgetLayoutIfFreshCavern(state);
        const layout = loadLayout();
        controller.update(state, hasObjectDetection(fresh), layoutEntries());

        // pjb and oreo leave a cavern the moment it has given up its gold; the
        // EV strategies decide that for themselves through the score.
        if (
          controller.shouldResetAfterGold() &&
          Object.keys(layout).some((key) => layout[key] === 'gold')
        ) {
          log('Found gold in this cavern; moving on.');
          html = await findNewCavern(pwd);
          controller.reset();
          await sleep(REQUEST_DELAY_MS);
          continue;
        }

        const decision = controller.decide();
        if (decision.action === 'reset') {
          log('New cavern: ' + decision.reason);
          html = await findNewCavern(pwd);
          controller.reset();
          await sleep(REQUEST_DELAY_MS);
          continue;
        }

        const coordinate = decision.coordinate;
        const index = coordinateToIndex(coordinate);
        const wasSparkle = controller.knownSparkles.has(index);
        const which = whichFor(coordinate[0], coordinate[1]);
        setStatus('digging (' + coordinate[0] + ',' + coordinate[1] + ') -- ' + decision.reason);

        html = await getText(
          ORIGIN + '/mining.php?mine=' + MINE + '&which=' + which + '&pwd=' + pwd
        );
        const resource = parseMineResult(html);
        const recorded = resource || (wasSparkle ? 'cave' : null);
        controller.recordMine(coordinate, resource);
        if (recorded) {
          recordLayout(which, recorded);
          RUN.found[recorded] = (RUN.found[recorded] || 0) + 1;
          log(
            '(' + coordinate[0] + ',' + coordinate[1] + ') gave ' +
              (recorded === 'cave' ? 'a cave-in' : recorded)
          );
        }
        await sleep(REQUEST_DELAY_MS);
      }
    } catch (error) {
      log('stopped: ' + (error && error.message ? error.message : String(error)), 'error');
    } finally {
      RUN.active = false;
      RUN.stopRequested = false;
      setStatus(
        'stopped after ' + RUN.used + ' turn(s), ' + RUN.resets + ' cavern(s): ' +
          RUN.found.gold + ' gold, ' + RUN.found.ore + ' velvet, ' +
          RUN.found.crystal + ' crystal, ' + RUN.found.cave + ' cave-in(s)' +
          ' -- ' + RUN.today + ' turn(s) mined today'
      );
    }
  }

  // ===================================================================
  // THE PANEL
  //
  // Rendered into the mainpane document, like auto-combat's, because the menu
  // frame is a strip and the panel is not. It is pure UI: closing it does not
  // touch the run.
  // ===================================================================

  let panelCleanup = null;
  let panelRefs = null;

  function panelDoc() {
    try {
      const mp = top.frames['mainpane'];
      if (mp && mp.document && mp.document.body) return mp.document;
    } catch (e) { /* cross-frame access failed; fall back */ }
    return document.body ? document : null;
  }

  function panelEl() {
    const doc = panelDoc();
    return doc ? doc.getElementById(PANEL_ID) : null;
  }

  function closePanel() {
    if (panelCleanup) {
      panelCleanup();
      panelCleanup = null;
    }
  }

  function el(doc, tag, css, text) {
    const node = doc.createElement(tag);
    if (css) node.style.cssText = css;
    if (text != null) node.textContent = text;
    return node;
  }

  function labelledInput(doc, row, text, value, width) {
    row.appendChild(el(doc, 'span', 'color:#333', text));
    const input = el(doc, 'input', 'width:' + (width || 60) + 'px;font-size:11px');
    input.type = 'text';
    input.value = value == null ? '' : String(value);
    row.appendChild(input);
    return input;
  }

  function labelledCheckbox(doc, row, text, checked) {
    const label = el(doc, 'label', 'color:#333;display:flex;gap:3px;align-items:center;cursor:pointer');
    const input = el(doc, 'input');
    input.type = 'checkbox';
    input.checked = !!checked;
    label.appendChild(input);
    label.appendChild(el(doc, 'span', null, text));
    row.appendChild(label);
    return input;
  }

  function selectRow(doc, pop, labelText, options, current) {
    const row = el(doc, 'div', 'display:flex;gap:6px;align-items:center');
    row.appendChild(el(doc, 'span', 'color:#333', labelText));
    const select = el(doc, 'select', 'flex:1;font-size:12px');
    options.forEach((name) => {
      const option = el(doc, 'option', null, name);
      option.value = name;
      select.appendChild(option);
    });
    select.value = current;
    row.appendChild(select);
    pop.appendChild(row);
    return select;
  }

  function openPanel() {
    closePanel();
    const doc = panelDoc();
    if (!doc) return;

    const prefs = loadPrefs();

    const pop = el(
      doc,
      'div',
      [
        'position:fixed',
        'top:40px',
        'right:20px',
        'z-index:99999',
        'width:340px',
        'display:flex',
        'flex-direction:column',
        'gap:6px',
        'padding:8px',
        'background:#f5f5ff',
        'border:1px solid blue',
        'border-radius:4px',
        'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
        'font-family:arial,sans-serif',
        'font-size:12px',
      ].join(';')
    );
    pop.id = PANEL_ID;

    pop.appendChild(
      el(doc, 'div', 'font-weight:bold;border-bottom:1px solid #ccd', 'Auto Mine (oreo)')
    );

    const strategySel = selectRow(doc, pop, 'Strategy', STRATEGIES, prefs.strategy);
    const visSel = selectRow(doc, pop, 'Visibility', VISIBILITIES, prefs.visibility);

    const turnsRow = el(doc, 'div', 'display:flex;gap:6px;align-items:center');
    const turnsInput = labelledInput(doc, turnsRow, 'Turns', prefs.turns, 50);
    const lambdaInput = labelledInput(doc, turnsRow, 'lambda', prefs.lambda, 60);
    pop.appendChild(turnsRow);
    pop.appendChild(
      el(
        doc,
        'div',
        'color:#555;font-size:11px',
        'Turns: blank runs until adventures run out, 0 uses free mining actions only. ' +
          "lambda 0 uses oreo's calibrated default for the strategy."
      )
    );

    const valueRow = el(doc, 'div', 'display:flex;gap:6px;align-items:center');
    const oreInput = labelledInput(doc, valueRow, 'velvet', prefs.ore, 50);
    const goldInput = labelledInput(doc, valueRow, 'gold', prefs.gold, 60);
    const crystalInput = labelledInput(doc, valueRow, 'crystal', prefs.crystal, 50);
    pop.appendChild(valueRow);

    const miscRow = el(doc, 'div', 'display:flex;gap:6px;align-items:center');
    const dynamiteInput = labelledInput(doc, miscRow, 'dynamite', prefs.dynamite, 60);
    const hpInput = labelledInput(doc, miscRow, 'HP floor', prefs.hpFloor, 50);
    const healBox = labelledCheckbox(doc, miscRow, 'heal at floor', prefs.healLowHp);
    pop.appendChild(miscRow);
    pop.appendChild(
      el(
        doc,
        'div',
        'color:#555;font-size:11px',
        'Nothing is ever bought or equipped. Dynamite is the price of a stick you ' +
          'already hold, used to discount a route through dull rock; 0 ignores it. ' +
          '"heal at floor" presses the charpane\'s own heal button when HP reaches ' +
          'the floor instead of stopping; without it, or without charpane-heal.js, ' +
          'the run stops there.'
      )
    );

    const buttons = el(doc, 'div', 'display:flex;gap:6px');
    const startBtn = el(doc, 'button', 'flex:1;font-size:12px;cursor:pointer', 'Start');
    startBtn.type = 'button';
    const stopBtn = el(doc, 'button', 'flex:1;font-size:12px;cursor:pointer', 'Stop');
    stopBtn.type = 'button';
    const closeBtn = el(doc, 'button', 'font-size:12px;cursor:pointer', 'Close');
    closeBtn.type = 'button';
    buttons.appendChild(startBtn);
    buttons.appendChild(stopBtn);
    buttons.appendChild(closeBtn);
    pop.appendChild(buttons);

    const statusLine = el(doc, 'div', 'font-size:11px;color:#224;min-height:14px');
    pop.appendChild(statusLine);

    const logBox = el(
      doc,
      'div',
      [
        'font-size:11px',
        'font-family:monospace',
        'height:150px',
        'overflow:auto',
        'background:white',
        'border:1px solid #ccd',
        'padding:4px',
        'white-space:pre-wrap',
      ].join(';')
    );
    pop.appendChild(logBox);

    function collect() {
      const next = {
        strategy: strategySel.value,
        visibility: visSel.value,
        turns: turnsInput.value.trim(),
        lambda: Number(lambdaInput.value) || 0,
        ore: Number(oreInput.value) || 0,
        gold: Number(goldInput.value) || 0,
        crystal: Number(crystalInput.value) || 0,
        dynamite: Number(dynamiteInput.value) || 0,
        hpFloor: Number(hpInput.value) || 0,
        healLowHp: healBox.checked,
      };
      savePrefs(next);
      return next;
    }

    startBtn.addEventListener('click', function () {
      if (RUN.active) return;
      const next = collect();
      RUN.requested = next.turns === '' ? null : Math.max(0, Number(next.turns) || 0);
      setStatus('starting');
      runSession(next);
    });
    stopBtn.addEventListener('click', function () {
      if (!RUN.active) return;
      stop('stop requested');
    });
    closeBtn.addEventListener('click', closePanel);
    [strategySel, visSel, healBox].forEach((input) =>
      input.addEventListener('change', collect)
    );

    doc.body.appendChild(pop);

    panelCleanup = function () {
      if (pop.parentNode) pop.parentNode.removeChild(pop);
      panelRefs = null;
    };
    panelRefs = { doc: doc, statusLine: statusLine, logBox: logBox };
    renderPanel();
    refreshDailyDisplay();
  }

  // The daily total is stored with the day it belongs to, and only a status
  // read can say which day it is now. Opening the panel while idle is
  // therefore worth one api.php request: without it a panel opened the morning
  // after a run would show yesterday's turns as today's.
  function refreshDailyDisplay() {
    if (RUN.active) return; // the run's own status reads keep this current
    getStatus().then(
      (status) => {
        RUN.today = dailyTurns(status.dayKey);
        renderPanel();
      },
      () => { /* offline or logged out; leave the stored total showing */ }
    );
  }

  function renderPanel() {
    if (!panelRefs) return;
    const refs = panelRefs;
    try {
      refs.statusLine.textContent =
        (RUN.active ? 'running' : 'idle') +
        ' -- ' + RUN.used + ' turn(s), ' + RUN.resets + ' cavern(s)' +
        ' -- ' + RUN.today + ' turn(s) today' +
        (RUN.status ? ' -- ' + RUN.status : '');
      const lines = RUN.log.map((entry) => {
        const stamp = entry.t.toTimeString().slice(0, 8);
        const mark = entry.kind === 'error' ? '!! ' : entry.kind === 'warn' ? ' * ' : '   ';
        return stamp + mark + entry.msg;
      });
      refs.logBox.textContent = lines.join('\n');
      refs.logBox.scrollTop = refs.logBox.scrollHeight;
    } catch (e) {
      // The mainpane navigated out from under the panel. Drop the references
      // rather than throwing on every log line for the rest of the run.
      panelRefs = null;
    }
  }

  // ===================================================================
  // THE MINE BUTTON
  //
  // The button lives in the advisor's box on mining.php, at the right-hand end
  // of the line that says which square to dig. Unlike auto-combat.js, whose
  // button has to be reachable from wherever you happen to be fighting, this
  // one has exactly one sensible home: you cannot mine from anywhere else, and
  // the advice beside it is the run's first move spelled out.
  //
  // The button owns no state -- it looks the engine up across the frames on
  // every click, so a button left over on a stale mine page cannot drive a
  // dead engine.
  // ===================================================================

  function engine() {
    const wins = [];
    try { wins.push(top.frames['topmenu']); } catch (e) { /* not reachable */ }
    try { wins.push(top.frames['awesomemenu']); } catch (e) { /* not reachable */ }
    try { Array.prototype.push.apply(wins, Array.prototype.slice.call(top.frames)); }
    catch (e) { /* not reachable */ }
    for (const win of wins) {
      try { if (win && win[MENU_API]) return win[MENU_API]; } catch (e) { /* cross-origin */ }
    }
    return null;
  }

  // The engine paints the button from the menu frame, so it has to reach into
  // the mainpane to find it -- and the mainpane is usually showing something
  // else, in which case there is no button and nothing to paint.
  function buttonEl() {
    if (ON_MINE) return document.getElementById(BUTTON_ID);
    try {
      const mp = top.frames['mainpane'];
      return (mp && mp.document && mp.document.getElementById(BUTTON_ID)) || null;
    } catch (e) {
      return null;
    }
  }

  function syncButton() {
    const btn = buttonEl();
    if (!btn) return;
    paintButton(btn, { active: RUN.active });
  }

  function paintButton(btn, state) {
    if (state && state.active) {
      btn.textContent = 'Mine ▶';
      btn.style.backgroundColor = '#d8f0d8';
      btn.title = 'Auto Mine: running';
    } else {
      btn.textContent = 'Mine';
      btn.style.backgroundColor = 'white';
      btn.title = 'Auto Mine (oreo)';
    }
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.title = 'Auto Mine (oreo)';
    btn.textContent = 'Mine';
    // Roomier than the old sidebar button: the advice box is 520px of
    // mainpane, not a strip of charpane, so the button no longer has to be
    // 18px tall to fit.
    btn.style.cssText = [
      'flex:0 0 auto',
      'padding:2px 10px',
      'font-size:11px',
      'font-family:arial',
      'cursor:pointer',
      'white-space:nowrap',
      'border:1px solid #b8860b',
      'border-radius:3px',
      'background-color:white',
    ].join(';');
    btn.addEventListener('click', function () {
      const api = engine();
      if (!api) {
        // Honest failure. A button that silently does nothing would read as a
        // broken run rather than as a script that isn't loaded where it needs
        // to be.
        const win = window.alert ? window : (document.defaultView || window);
        win.alert(
          "Auto Mine isn't running in the menu frame, so there is no engine for " +
            'this button to talk to. Reload the game (F5) -- and check the script ' +
            'is enabled on topmenu.php / awesomemenu.php.'
        );
        return;
      }
      api.toggle();
      const btnNow = document.getElementById(BUTTON_ID);
      if (btnNow) paintButton(btnNow, api.state());
    });
    return btn;
  }

  // The engine's half of the contract, published on the menu frame's window so
  // the mine page's copy can reach it. Deliberately tiny: open/close the panel,
  // and say whether a run is going.
  function publishEngine() {
    window[MENU_API] = {
      toggle: function () {
        if (panelEl()) closePanel();
        else openPanel();
      },
      state: function () {
        return { active: RUN.active };
      },
    };
  }

  // ===================================================================
  // THE ADVISOR
  //
  // The same decision the engine would make, painted onto the mine you are
  // looking at. It commits nothing -- no click is fired and no request is sent
  // beyond one api.php read for the Object Detection check -- which is why it
  // needs no button of its own and simply runs.
  //
  // Styling note, inherited from mine-sparkle-highlight.js: KoL's CSP allows
  // inline style ATTRIBUTES but blocks script-injected stylesheets, so CSS
  // classes and @keyframes silently do nothing and the pulse has to be a JS
  // timer toggling an inline box-shadow. This one styles the <td> rather than
  // the <img> on purpose: mine-sparkle-highlight.js owns the img's outline and
  // box-shadow, and two scripts writing the same property is a fight neither
  // wins.
  // ===================================================================

  let advisorTimer = null;

  // The advice box, and the Mine button inside it. One node builds both,
  // because the button has no other home and an advice box without it would be
  // a box you cannot act on.
  function adviceBox(doc) {
    let box = doc.getElementById(ADVICE_ID);
    if (box) return box; // idempotency guard
    box = doc.createElement('div');
    box.id = ADVICE_ID;
    box.style.cssText = [
      'margin:6px auto',
      'padding:6px 8px',
      'max-width:520px',
      'border:1px solid #b8860b',
      'border-radius:4px',
      'background:#fffbe6',
      'font-family:arial,sans-serif',
      'font-size:12px',
      'text-align:left',
      'color:#333',
      'display:flex',
      'gap:8px',
      'align-items:center',
    ].join(';');

    const text = doc.createElement('span');
    text.id = ADVICE_TEXT_ID;
    text.style.cssText = 'flex:1 1 auto';
    box.appendChild(text);

    const btn = makeButton();
    box.appendChild(btn);
    const api = engine();
    if (api) paintButton(btn, api.state());

    const postload = doc.getElementById('postload');
    if (postload && postload.parentNode) {
      postload.insertAdjacentElement('beforebegin', box);
    } else if (doc.body) {
      doc.body.insertBefore(box, doc.body.firstChild);
    }
    return box;
  }

  // Where paintAdvice writes. Falls back to the box itself only if the span is
  // somehow missing, which would mean someone else rebuilt our node.
  function adviceText(doc) {
    return doc.getElementById(ADVICE_TEXT_ID) || adviceBox(doc);
  }

  function paintAdvice(tiles, decision, state) {
    const doc = document;
    adviceBox(doc); // builds the box and its button on first paint
    const line = adviceText(doc);
    const byIndex = new Map();
    tiles.forEach((tile) => byIndex.set(tile.index, tile));

    if (advisorTimer) {
      clearInterval(advisorTimer);
      advisorTimer = null;
    }
    tiles.forEach((tile) => {
      if (tile.cell) tile.cell.style.boxShadow = '';
    });

    if (decision.action === 'reset') {
      line.textContent = 'Find a new cavern: ' + decision.reason + '.';
      return;
    }

    const path = decision.path || [];
    const target = coordinateToIndex(decision.coordinate);

    path.forEach((index) => {
      const tile = byIndex.get(index);
      if (!tile || !tile.cell || index === target) return;
      tile.cell.style.boxShadow = 'inset 0 0 0 3px rgba(0,200,255,0.85)';
    });

    const targetTile = byIndex.get(target);
    if (targetTile && targetTile.cell) {
      let on = false;
      const pulse = () => {
        on = !on;
        targetTile.cell.style.boxShadow = on
          ? 'inset 0 0 0 4px gold, 0 0 12px 2px gold'
          : 'inset 0 0 0 4px gold';
      };
      pulse();
      advisorTimer = setInterval(pulse, 450);
    }

    // The page's own anchors are the authority on what can be dug. Disagreeing
    // with them means our state read is wrong, and saying so is far better
    // than quietly advising a square you cannot click.
    const reachable = !targetTile || targetTile.linked;
    const opened = state.split('o').length - 1;
    line.textContent =
      'Dig (' + decision.coordinate[0] + ',' + decision.coordinate[1] + ')' +
      (path.length > 1 ? ' -- ' + path.length + ' step route' : '') +
      '. ' + decision.reason + '.' +
      (reachable
        ? ''
        : ' NOTE: the page offers no link for that square, so this reading may be wrong.') +
      ' [' + opened + ' square(s) open]';
  }

  async function runAdvisor() {
    // oreo is a mine-6 script and its model does not describe the other mines,
    // so say nothing anywhere else rather than advise from the wrong numbers.
    //
    // These two refusals now also gate the Start button, which is the point:
    // the button appears exactly where a run could be started, and in the
    // Itznotyerzitz Mine or on an unreadable grid there is nothing to start.
    if (!/[?&]mine=6(\D|$)/.test(location.search)) return;
    const tiles = readTilesFromDoc(document);
    const state = stateFromTiles(tiles);
    if (!state) return; // not a mine grid; say nothing rather than guess

    // The box, and the button inside it, BEFORE anything that can throw.
    // Working out the advice used to come first and paint at the end, which
    // was harmless while the button lived in the charpane -- a bad preference
    // just meant no advice. Now the button is in this box, so the same throw
    // took away the only way to open the panel and fix the preference that
    // caused it. That is how one rejected dynamite price read as "the script
    // is gone".
    adviceBox(document);

    try {
      const prefs = loadPrefs();
      forgetLayoutIfFreshCavern(state);

      let objectDetection = false;
      if (prefs.visibility !== 'low') {
        try {
          objectDetection = hasObjectDetection(await getStatus());
        } catch (e) {
          objectDetection = false;
        }
      }

      const controller = makeController(prefs, function () {});
      // The advisor deliberately assumes no dynamite: it cannot know whether
      // you intend to spend a stick, and advising a route that is only worth
      // it if you blow one would be advice you did not ask for.
      controller.setDynamiteAvailable(0);
      controller.update(state, objectDetection, layoutEntries());
      paintAdvice(tiles, controller.decide(), state);
    } catch (error) {
      // Say what went wrong where the advice would have been. The button is
      // still there, so the panel is still reachable.
      adviceText(document).textContent =
        'Auto Mine could not work out a square: ' +
        (error && error.message ? error.message : String(error)) +
        ' -- open the panel and check the settings.';
    }
  }

  function boot() {
    if (ON_MENU) { publishEngine(); return; }
    if (ON_MINE) {
      // The grid is inside a div the page reveals in window.onload, so the
      // markup is there from the start even though it is display:none -- alt
      // text does not care about visibility. Still wait for the document, so
      // there is something to query.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAdvisor);
      } else {
        runAdvisor();
      }
    }
  }

  // The one boot call, kept on a line of its own: the tests replace exactly
  // this line with a `return { ... }` to reach the internals (the re-expose
  // trick from AGENTS.md). Move or rename it and the two
  // test/auto-mine-*.test.mjs files need the same edit.
  boot();
})();
