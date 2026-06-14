// ==UserScript==
// @name         KoL Strange Leaflet
// @author       Tilo
// @contributor  Hellion, Tard, Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/strange-leaflet.js
// @version      0.5.7
// @description  Strange Leaflet spoiler script - auto-solves the leaflet text adventure.
// @match        https://www.kingdomofloathing.com/main.php*
// @match        https://kingdomofloathing.com/main.php*
// @match        https://www.kingdomofloathing.com/leaflet.php*
// @match        https://kingdomofloathing.com/leaflet.php*
// @grant        none

// ==/UserScript==

/********************************** Change Log **********************************************
v0.5.7: auto-execute the secret code. Previously the fireplace vision injected a
        manual "reveal the secret code" link and halted (submit=false); now the
        matching magic word (xyzzy/plugh/plover/yoho) is typed and submitted
        automatically, guarded by `codeUsed` so it fires once. Dropped the South
        Bank "last chance" prompt (the word is already used by then).
v0.5.6: fix room-name scraping. The current page wraps the title in
        `<b style="color: white">Name</b>`; the old regex only stripped a bare
        `<b>`, so `td1` never matched any room and an empty command was
        submitted ("you're using words I don't know"). Read tds[0].textContent.
v0.54: modernize for the current site (Tilo):
       - KoL's Content-Security-Policy forbids eval, so the original
         `setTimeout("<code string>", 100)` never ran and the form was never
         submitted. Replaced with a real function and direct form access.
       - `javascript:` hrefs in the secret-code links are CSP-blocked too;
         rebuilt as real anchors with click handlers.
       - Replaced deprecated GM_get/setValue/GM_log with localStorage so the
         script runs under `@grant none` like the rest of this repo.
       - Refreshed metadata (@match, IIFE, 'use strict').
v0.53: fix infinite loop after bowling trophy acquisition.
v0.52: add auto-clicking of the "Do It!" button, except when the secret code is in play.

********************************************************************************************/

(function () {
	'use strict';

	// --- Persistent state (replaces GM_get/setValue) ----------------------
	// GM storage persisted across page loads; localStorage does the same and
	// works under `@grant none`. Values are kept as the same "true"/"false"
	// strings the original logic compared against.
	var STORE_PREFIX = 'tm-kol-strange-leaflet-';
	function getValue(key) { return localStorage.getItem(STORE_PREFIX + key); }
	function setValue(key, val) { localStorage.setItem(STORE_PREFIX + key, val); }

	// On the main page we just reset the "entered a new area" flag and bail.
	if (window.location.pathname.indexOf('/main.php') === 0 ||
		window.location.pathname.indexOf('/main_c.html') === 0 ||
		window.location.pathname.indexOf('/main.html') === 0) {
		setValue('newArea', 'false');
		setValue('codeUsed', ''); // clear the magic-word guard for a fresh attempt
		return;
	}

	// --- Leaflet page -----------------------------------------------------
	var body = document.getElementsByTagName('body')[0];
	var tds = document.getElementsByTagName('td');
	if (!body || tds.length < 3) return; // not the expected leaflet layout

	// Room name lives in tds[0] as `<b style="color: white">Name</b>`; take its
	// plain trimmed text so the `switch` matches (the old regex only stripped a
	// bare `<b>`, not the styled tag, which broke every match). The description
	// + command form is in tds[2].
	var td1 = (tds[0].textContent || '').trim();
	var td3 = tds[2].innerHTML;
	var command = '';
	var code = '';
	var submit = true;

	if (getValue('newArea') == 'true') {
		switch (td1) {
			case "North of the Field":
				command = "south";
			break;

			case "West of House":
				if (td3.indexOf("You leave the house.") != -1) command = "south";
				else command = "east";
			break;

			case "In the House":
				if (td3.indexOf("parchment") != -1) command = "read parchment";
				else if (td3.indexOf("Bits of torn and wadded newspaper") != -1) command = "look fireplace";
				else if (td3.indexOf("An eerie glow surrounds you") != -1 || td3.indexOf("That only works once") != -1) command = "light fireplace";
				else if (td3.indexOf("large pair of boots") != -1 || td3.indexOf("At this point, it's not so much tinder as ash") != -1) command = "get boots";
				else if (td3.indexOf("Okay, got 'em") != -1 || td3.indexOf("You've already got the boots") != -1) command = "wear boots";
				else if (td3.indexOf("With some difficulty, you strap on the boots") != -1 || td3.indexOf("Since you're already wearing them") != -1) command = "west";
				else if (td3.indexOf("The fireplace is stacked with dry firewood and tinder, ready for lighting") != -1) {
					if (td3.indexOf("small white house") != -1) {
						code = "xyzzy";
						command = "light fireplace";
					} else if (td3.indexOf("brick building") != -1) {
						code = "plugh";
						command = "light fireplace";
					} else if (td3.indexOf("bird") != -1) {
						code = "plover";
						command = "light fireplace";
					} else if (td3.indexOf("ship") != -1) {
						code = "yoho";
						command = "light fireplace";
					} else if (td3.indexOf("trophy") != -1) {
						command = "take trophy";
					} else {
						command = "light fireplace";
					}
					if (code != "") {
						// Auto-execute the secret code: type the magic word and
						// submit it. Guard with `codeUsed` so that if the vision
						// text lingers after we've already said the word we just
						// light the fireplace instead of repeating it forever.
						if (getValue("codeUsed") === code) {
							command = "light fireplace";
						} else {
							setValue("codeUsed", code);
							command = code;
						}
					}
				}
				else command = "look tinder";
			break;

			case "South Bank":
				command = "south";
			break;

			case "Forest":
				if (td3.indexOf("south") != -1) command = "south";
				else if (td3.indexOf("east") != -1) command = "east";
				else if (td3.indexOf("west") != -1) command = "west";
				else if (td3.indexOf("north") != -1) command = "north";
			break;

			case "On the other side of the forest maze...":
				if (td3.indexOf("You carefully make your way back down to the forest floor") != -1) command = "look in leaves";
				else command = "up";
			break;

			case "Halfway Up The Tree":
				if (td3.indexOf("large egg encrusted with precious jewels") != -1) command = "get egg";
				else if (td3.indexOf("manage to get the egg without losing your grip on the tree") != -1 || td3.indexOf("You've already got the egg") != -1) command = "throw egg roadrunner";
				else if (td3.indexOf("the ruby, which plummets past you") != -1 || td3.indexOf("You don't have a ruby") != -1) command = "down";
				else if (td3.indexOf("You snatch the scroll out of the air as it flutters down") != -1) command = "gnusto cleesh";
				else if (td3.indexOf("Both the Gnusto scroll and the Cleesh scroll crumble into dust") != -1) command = "up";
				else command = "throw ruby bowl";
			break;

			case "Tabletop":
				if (td3.indexOf("You acquire an item") != -1) command = "exit";
				else if (td3.indexOf("Giant's pinky ring") != -1) command = "get ring";
				else if (td3.indexOf("contents have spilled and drained") != -1) command = "exit";
				else command = "cleesh giant";
			break;

		}
	} else {
		switch (td1) {
			case "West of House":
				if (td3.indexOf("The house's front door is closed.") != -1) command = "open door";
				else if (td3.indexOf("You leave the house.") != -1) command = "north";
				else if (td3.indexOf("The front door of the house is standing open.") != -1) command = "east";
			break;

			case "In the House":
				if (td3.indexOf("An ornate sword hangs above the mantel.") != -1) command = "get sword";
				else command = "west";
			break;

			case "North of the Field":
				if (td3.indexOf("A hefty stick lies on the ground.") != -1) command = "get stick";
				else if (td3.indexOf("A thick hedge blocks the way to the west.") != -1) command = "cut hedge";
				else if (td3.indexOf("You leave the clearing.") != -1) command = "north";
				else command = "west";
			break;

			case "Forest Clearing":
				if (td3.indexOf("You hold the stick in the flames until it lights.") != -1) command = "east";
				else if (td3.indexOf("You don't know what words mean, do you?") != -1 || td3.indexOf("Do what with the what, now?") != -1 || td3.indexOf("You're using words I don't know...") != -1 || td3.indexOf("I don't understand that...") != -1) command = "east";
				else command = "light stick";
			break;

			case "Cave":
				if (td3.indexOf("dangerous-looking serpent coiled around it.") != -1) command = "kill serpent";
				else if (td3.indexOf("surrounded by hacked-up serpent bits") != -1) command = "open chest";
				else if (td3.indexOf("You discover a tiny hole in the wall behind the chest.") != -1 || td3.indexOf("You check to make sure the hole is still there.") != -1) command = "look in hole";
				else if (td3.indexOf("You find a grue egg in the hole!") != -1 || td3.indexOf("There's nothing else in the hole.") != -1) {
					command = "south";
					setValue("newArea", "true");
				}
				else if (td3.indexOf("An empty treasure chest sits near the rear wall.") != -1) command = "look behind chest";
			break;

			default:
				setValue("newArea", "true");
			break;

		}
	}

	// Set the command and (optionally) submit. The original ran this as an
	// eval'd string via setTimeout, which CSP blocks; use a real function.
	setTimeout(function () {
		var form = document.forms['whatnow'];
		if (!form || !form.command) return;
		form.command.value = command;
		if (submit === true) form.submit();
	}, 100);
})();
