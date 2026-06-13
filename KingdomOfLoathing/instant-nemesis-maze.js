// ==UserScript==
// @name           KoL Instant Nemesis Maze v1.1
// @author         Tilo
// @namespace      https://github.com/TiloBuechsenschuss
// @description    Version 1.1 - Clicks through the nemesis lava maze for you.
// @include        *127.0.0.1:*/volcanomaze.php*
// @include        *.kingdomofloathing.com/volcanomaze.php*
// @match          https://*.kingdomofloathing.com/volcanomaze.php*
// @grant          none
// ==/UserScript==

// Original: Copyright 2010 Ian Walker, GPL v3 or later.
//
// Change history
// 1.0 - Original release
// 1.1 - Fixed navigation for HTTPS (the hardcoded "http://" redirect was
//       blocked by browsers as mixed content inside the HTTPS frameset).
//       Replaced GM_log with console.log, added @match for modern managers.

(function() {
    // Determine which maze we are looking at by examining the top left 4x4.
    var signatories = [42, 41, 40, 39, 29, 28, 27, 26, 16, 15, 14, 13, 3, 2, 1, 0];
    var m = 1;
    var sig = 0;
    for (var i = 0; i < 16; i++) {
        var elem = document.getElementById("sq" + signatories[i]);
        if (!elem) {
            console.log("Instant Maze: maze squares not found, giving up.");
            return;
        }
        if (elem.getAttribute("class").indexOf("yes") != -1) {
            sig += m;
        }
        m *= 2;
    }
    var maze;
    // There is one collision, which we handle by a special case.  These
    // signature values are opaque and have only been tested for maze #4.
    if (sig == 33345) {
        var elem = document.getElementById("sq45");
        if (elem.getAttribute("class").indexOf("yes") != -1) {
            maze = 5;
        } else {
            maze = 6;
        }
    } else if (sig == 32832 || sig == 5250 || sig == 8193 || sig == 17188 || sig == 2072) {
        maze = 1;
    } else if (sig == 4168 || sig == 8708 || sig == 16416 || sig == 35075 || sig == 1168) {
        maze = 2;
    } else if (sig == 37024 || sig == 17664 || sig == 8220 || sig == 65 || sig == 2562) {
        maze = 3;
    } else if (sig == 1089 || sig == 2432 || sig == 33312 || sig == 20500 || sig == 8202) {
        maze = 4;
    } else if (sig == 8208 || sig == 1284 || sig == 18472 || sig == 4226) {
        maze = 5;
    } else if (sig == 5136 || sig == 8324 || sig == 2080 || sig == 16650) {
        maze = 6;
    } else {
        console.log("Instant Maze: couldn't identify the maze (signature = " + sig + "), giving up.");
        return;
    }
    // Strategies are maps (currentpos -> nextpos).  They were generated from
    // http://ben.bloomroad.com/kol/nemesis/volcano/lava{1..6}_path.txt
    var strategies = [{"6,12": "7,12", "7,12": "8,12", "8,12": "9,11", "9,11": "8,11", "8,11": "9,10", "9,10": "10,9", "10,9": "10,8", "10,8": "9,7", "9,7": "10,6", "10,6": "10,5", "10,5": "10,4", "10,4": "11,3", "11,3": "10,2", "10,2": "9,1", "9,1": "8,0", "8,0": "9,0", "9,0": "10,1", "10,1": "11,0", "11,0": "12,1", "12,1": "12,2", "12,2": "12,3", "12,3": "12,4", "12,4": "12,5", "12,5": "11,6", "11,6": "12,7", "12,7": "12,8", "12,8": "12,9", "12,9": "12,10", "12,10": "12,11", "12,11": "11,12", "11,12": "10,12", "10,12": "11,11", "11,11": "10,10", "10,10": "9,9", "9,9": "8,9", "8,9": "7,10", "7,10": "6,10", "6,10": "5,9", "5,9": "4,10", "4,10": "3,9", "3,9": "3,8", "3,8": "3,7", "3,7": "2,6", "2,6": "1,6", "1,6": "0,5", "0,5": "1,4", "1,4": "2,3", "2,3": "2,4", "2,4": "1,3", "1,3": "0,3", "0,3": "1,2", "1,2": "1,1", "1,1": "2,0", "2,0": "3,1", "3,1": "4,1", "4,1": "5,2", "5,2": "6,2", "6,2": "7,2", "7,2": "8,3", "8,3": "7,3", "7,3": "6,3", "6,3": "7,4", "7,4": "6,5", "6,5": "6,6"},
                      {"6,12": "5,12", "5,12": "4,12", "4,12": "3,11", "3,11": "4,11", "4,11": "3,10", "3,10": "2,9", "2,9": "2,8", "2,8": "3,7", "3,7": "2,6", "2,6": "2,5", "2,5": "2,4", "2,4": "1,3", "1,3": "2,2", "2,2": "3,1", "3,1": "4,0", "4,0": "3,0", "3,0": "2,0", "2,0": "1,0", "1,0": "0,1", "0,1": "0,2", "0,2": "0,3", "0,3": "0,4", "0,4": "0,5", "0,5": "1,6", "1,6": "0,7", "0,7": "0,8", "0,8": "0,9", "0,9": "0,10", "0,10": "0,11", "0,11": "1,12", "1,12": "2,12", "2,12": "1,11", "1,11": "2,10", "2,10": "3,9", "3,9": "4,9", "4,9": "5,10", "5,10": "6,10", "6,10": "7,9", "7,9": "8,10", "8,10": "9,9", "9,9": "9,8", "9,8": "9,7", "9,7": "10,6", "10,6": "11,6", "11,6": "12,5", "12,5": "11,4", "11,4": "10,3", "10,3": "10,4", "10,4": "11,3", "11,3": "12,3", "12,3": "11,2", "11,2": "11,1", "11,1": "10,0", "10,0": "9,1", "9,1": "8,1", "8,1": "7,2", "7,2": "6,2", "6,2": "5,2", "5,2": "4,3", "4,3": "5,3", "5,3": "6,3", "6,3": "5,4", "5,4": "6,5", "6,5": "6,6"},
                      {"6,12": "7,12", "7,12": "8,11", "8,11": "9,11", "9,11": "10,11", "10,11": "9,10", "9,10": "9,9", "9,9": "8,10", "8,10": "7,9", "7,9": "6,10", "6,10": "5,10", "5,10": "4,10", "4,10": "3,11", "3,11": "2,10", "2,10": "1,11", "1,11": "0,10", "0,10": "1,9", "1,9": "2,9", "2,9": "1,8", "1,8": "0,7", "0,7": "0,6", "0,6": "1,5", "1,5": "0,4", "0,4": "0,3", "0,3": "1,2", "1,2": "2,1", "2,1": "3,0", "3,0": "4,0", "4,0": "5,1", "5,1": "6,0", "6,0": "7,0", "7,0": "8,1", "8,1": "9,1", "9,1": "10,2", "10,2": "11,3", "11,3": "10,4", "10,4": "9,5", "9,5": "8,6", "8,6": "8,7", "8,7": "7,7", "7,7": "6,6"},
                      {"6,12": "5,12", "5,12": "4,11", "4,11": "3,11", "3,11": "2,11", "2,11": "3,10", "3,10": "3,9", "3,9": "4,10", "4,10": "5,9", "5,9": "6,10", "6,10": "7,10", "7,10": "8,10", "8,10": "9,11", "9,11": "10,10", "10,10": "11,11", "11,11": "12,10", "12,10": "11,9", "11,9": "10,9", "10,9": "11,8", "11,8": "12,7", "12,7": "12,6", "12,6": "11,5", "11,5": "12,4", "12,4": "11,3", "11,3": "11,2", "11,2": "10,1", "10,1": "9,0", "9,0": "8,0", "8,0": "7,1", "7,1": "6,0", "6,0": "5,0", "5,0": "4,1", "4,1": "3,1", "3,1": "2,2", "2,2": "1,3", "1,3": "2,4", "2,4": "3,5", "3,5": "3,6", "3,6": "4,7", "4,7": "5,7", "5,7": "6,6"},
                      {"6,12": "7,12", "7,12": "8,12", "8,12": "9,11", "9,11": "10,11", "10,11": "11,10", "11,10": "11,9", "11,9": "11,8", "11,8": "12,7", "12,7": "12,6", "12,6": "11,5", "11,5": "11,4", "11,4": "11,3", "11,3": "10,2", "10,2": "9,1", "9,1": "8,1", "8,1": "7,0", "7,0": "6,0", "6,0": "5,1", "5,1": "4,1", "4,1": "3,0", "3,0": "2,0", "2,0": "1,1", "1,1": "1,2", "1,2": "0,3", "0,3": "0,4", "0,4": "1,5", "1,5": "2,4", "2,4": "3,3", "3,3": "4,3", "4,3": "5,3", "5,3": "6,2", "6,2": "7,2", "7,2": "8,3", "8,3": "9,4", "9,4": "9,5", "9,5": "9,6", "9,6": "10,7", "10,7": "9,7", "9,7": "8,6", "8,6": "8,7", "8,7": "7,8", "7,8": "6,8", "6,8": "5,8", "5,8": "4,7", "4,7": "5,6", "5,6": "6,6"},
                      {"6,12": "5,12", "5,12": "4,12", "4,12": "3,11", "3,11": "2,11", "2,11": "1,10", "1,10": "1,9", "1,9": "1,8", "1,8": "0,7", "0,7": "0,6", "0,6": "1,5", "1,5": "1,4", "1,4": "1,3", "1,3": "2,2", "2,2": "3,1", "3,1": "4,1", "4,1": "5,0", "5,0": "6,0", "6,0": "7,1", "7,1": "8,1", "8,1": "9,0", "9,0": "10,0", "10,0": "11,1", "11,1": "11,2", "11,2": "12,3", "12,3": "12,4", "12,4": "11,5", "11,5": "10,4", "10,4": "9,3", "9,3": "8,3", "8,3": "7,3", "7,3": "6,2", "6,2": "5,2", "5,2": "4,3", "4,3": "3,4", "3,4": "3,5", "3,5": "3,6", "3,6": "2,7", "2,7": "3,7", "3,7": "4,6", "4,6": "4,7", "4,7": "5,8", "5,8": "6,8", "6,8": "7,8", "7,8": "8,7", "8,7": "7,6", "7,6": "6,6"}];

    var strategy = strategies[maze - 1];
    var you = document.getElementById("you");
    if (!you) {
        console.log("Instant Maze: couldn't find your position, giving up.");
        return;
    }
    var pos = you.parentNode.getAttribute("rel");
    var next = strategy[pos];
    if (typeof(next) == "undefined") {
        var warning_table = document.createElement("center");
        warning_table.innerHTML = "<table width=95% cellspacing=0 cellpadding=0><tr><td style='color: white;' align=center bgcolor=red><b><a class='nounder' href='showplayer.php?who=1044239' style='color: white'>JiK4eva</a>'s Instant Maze</b></td></tr><tr><td style='padding: 5px; border: 1px solid red;'>Instant Maze doesn't know where to go next. If you have manually moved away from the optimal path, restarting the maze should correct this. Otherwise, the script is broken.</td></tr><tr><td height=4></td></tr></table>";
        var page_body = document.getElementsByTagName("body")[0];
        page_body.insertBefore(warning_table, page_body.firstChild);
        return;
    } else if (next == "6,6") {
        var warning_table = document.createElement("center");
        warning_table.innerHTML = "<table width=95% cellspacing=0 cellpadding=0><tr><td style='color: white;' align=center bgcolor=blue><b><a class='nounder' href='showplayer.php?who=1044239' style='color: white'>JiK4eva</a>'s Instant Maze</b></td></tr><tr><td style='padding: 5px; border: 1px solid blue;'>Step up, I sense you're on the precipice of something!</td></tr><tr><td height=4></td></tr></table>";
        var page_body = document.getElementsByTagName("body")[0];
        page_body.insertBefore(warning_table, page_body.firstChild);
        return;
    }
    // Relative URL: preserves the current protocol (https), host, and port.
    // The old version hardcoded "http://", which modern browsers block as
    // mixed content when the maze frame is served over https.
    window.location.href = "volcanomaze.php?move=" + next;
})();