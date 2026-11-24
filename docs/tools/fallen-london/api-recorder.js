/*
 * Fallen London API recorder: paste into the DevTools console on www.fallenlondon.com.
 *
 * It records every call the page makes to api.fallenlondon.com, through XMLHttpRequest
 * and fetch: method, path, request body, status and reply body. It also records markup
 * you ask it to snapshot or watch. It only listens. It sends nothing itself and never
 * records request headers, so the login token is not in the recording.
 *
 *   __flRec.mark('label')           a labelled line in the log, so steps can be told apart
 *   __flRec.snap(selector, label)   the outerHTML of every match, now
 *   __flRec.watch(selector, label)  records the outerHTML of the matches every time it
 *                                   changes (for menus that exist only while open, and
 *                                   would close if you clicked into the console)
 *   __flRec.unwatch()               stops all watches
 *   __flRec.summary()               a table of what is recorded so far
 *   __flRec.save(name?, { full })   downloads the log as JSON. By default the large
 *                                   /api/character/myself reply is cut down to the
 *                                   outfit fields; { full: true } keeps it whole.
 *   __flRec.json({ full })          the same JSON as a string (copy(__flRec.json()))
 *   __flRec.stop()                  puts XMLHttpRequest and fetch back as they were
 *
 * A page reload ends the recording: save first. Calls made before the paste are not seen.
 * Kept in docs/tools/fallen-london/; see outfit-capture-guide.md for a worked use.
 */
(function () {
  'use strict';
  if (window.__flRec && window.__flRec.active) {
    console.warn('[flRec] Already recording. Run __flRec.stop() first to start over.');
    return;
  }

  const API_HOST = 'api.fallenlondon.com';
  const t0 = Date.now();
  const log = [];
  let seq = 0;
  const orig = {
    open: XMLHttpRequest.prototype.open,
    send: XMLHttpRequest.prototype.send,
    fetch: window.fetch,
  };
  const watches = [];

  function apiPath(url) {
    try {
      const u = new URL(url, location.href);
      return u.host === API_HOST ? u.pathname + u.search : null;
    } catch (e) {
      return null;
    }
  }

  function parse(text) {
    if (text == null || text === '') return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return String(text);
    }
  }

  function bodyText(body) {
    if (body == null) return null;
    if (typeof body === 'string') return body;
    try {
      return JSON.stringify(body);
    } catch (e) {
      return '[body not readable]';
    }
  }

  function add(entry) {
    entry.seq = ++seq;
    entry.ms = Date.now() - t0;
    log.push(entry);
    const what = entry.kind === 'call'
      ? entry.method + ' ' + entry.path + ' -> ' + entry.status + ' (' + entry.via + ')'
      : entry.kind + ' ' + (entry.label || '') + (entry.selector ? ' [' + entry.selector + ']' : '');
    console.log('[flRec] #' + entry.seq + ' ' + what);
  }

  // --- XMLHttpRequest --------------------------------------------------------
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__flRecInfo = { method: String(method || 'GET').toUpperCase(), path: apiPath(String(url)) };
    return orig.open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const info = this.__flRecInfo;
    if (info && info.path) {
      const request = parse(bodyText(body));
      const xhr = this;
      xhr.addEventListener('loadend', function () {
        let text = null;
        try {
          text = (xhr.responseType === '' || xhr.responseType === 'text')
            ? xhr.responseText : JSON.stringify(xhr.response);
        } catch (e) {
          text = '[reply not readable]';
        }
        add({ kind: 'call', via: 'xhr', method: info.method, path: info.path, request: request,
          status: xhr.status, reply: parse(text) });
      });
    }
    return orig.send.apply(this, arguments);
  };

  // --- fetch -----------------------------------------------------------------
  // A page that kept its own reference to fetch before the paste is not seen here;
  // the XMLHttpRequest wrapper does not have that gap.
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    const path = apiPath(url);
    if (!path) return orig.fetch.apply(window, arguments);
    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const request = parse(bodyText(init && init.body));
    return orig.fetch.apply(window, arguments).then(function (res) {
      res.clone().text().then(function (text) {
        add({ kind: 'call', via: 'fetch', method: method, path: path, request: request,
          status: res.status, reply: parse(text) });
      }, function () {
        add({ kind: 'call', via: 'fetch', method: method, path: path, request: request,
          status: res.status, reply: '[reply not readable]' });
      });
      return res;
    }, function (err) {
      add({ kind: 'call', via: 'fetch', method: method, path: path, request: request,
        status: 0, reply: '[network error]' });
      throw err;
    });
  };

  // --- markup ----------------------------------------------------------------
  function htmlOf(selector) {
    return Array.from(document.querySelectorAll(selector)).map(function (el) { return el.outerHTML; });
  }

  function snap(selector, label) {
    const html = htmlOf(selector);
    add({ kind: 'dom', label: label || '', selector: selector, count: html.length, html: html });
    if (!html.length) console.warn('[flRec] Nothing matches ' + selector);
  }

  // Records only when the matched markup changed, at most every 150 ms, so an open
  // menu is caught without flooding the log.
  function watch(selector, label) {
    let last = null;
    let timer = null;
    const check = function () {
      timer = null;
      const html = htmlOf(selector);
      const key = html.join('\n');
      if (key === last) return;
      last = key;
      add({ kind: 'dom', label: (label || '') + ' (watch)', selector: selector, count: html.length, html: html });
    };
    const mo = new MutationObserver(function () {
      if (!timer) timer = setTimeout(check, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    watches.push(mo);
    check();
  }

  function unwatch() {
    while (watches.length) watches.pop().disconnect();
  }

  // --- output ----------------------------------------------------------------
  // /api/character/myself is about 350 KB and holds the whole character. Unless asked
  // for in full, only what the outfit questions need is kept.
  function trimmed(entry) {
    if (entry.kind !== 'call' || !/^\/api\/character\/myself/.test(entry.path)) return entry;
    const c = (entry.reply && entry.reply.character) || {};
    return Object.assign({}, entry, {
      reply: {
        trimmedByRecorder: true,
        character: {
          outfits: c.outfits,
          canChangeOutfit: c.canChangeOutfit,
          setting: c.setting ? { canChangeOutfit: c.setting.canChangeOutfit } : undefined,
        },
      },
    });
  }

  function json(opts) {
    const full = !!(opts && opts.full);
    return JSON.stringify({
      recorder: 'docs/tools/fallen-london/api-recorder.js',
      page: location.pathname,
      startedAt: new Date(t0).toISOString(),
      savedAt: new Date().toISOString(),
      full: full,
      log: full ? log : log.map(trimmed),
    }, null, 2);
  }

  function save(name, opts) {
    const blob = new Blob([json(opts)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name || 'fl-capture-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    console.log('[flRec] Saved ' + log.length + ' entries as ' + a.download);
  }

  function summary() {
    console.table(log.map(function (e) {
      return {
        seq: e.seq, ms: e.ms, kind: e.kind,
        what: e.kind === 'call' ? e.method + ' ' + e.path : e.label,
        status: e.status, request: e.kind === 'call' ? JSON.stringify(e.request) : '',
      };
    }));
  }

  function stop() {
    XMLHttpRequest.prototype.open = orig.open;
    XMLHttpRequest.prototype.send = orig.send;
    window.fetch = orig.fetch;
    unwatch();
    window.__flRec.active = false;
    console.log('[flRec] Stopped. The log is still in __flRec.log and can be saved.');
  }

  window.__flRec = {
    active: true, log: log,
    mark: function (label) { add({ kind: 'mark', label: String(label) }); },
    snap: snap, watch: watch, unwatch: unwatch, summary: summary, json: json, save: save, stop: stop,
  };
  console.log('[flRec] Recording calls to ' + API_HOST + '. __flRec.mark("step") labels a step; '
    + '__flRec.save() downloads the log.');
})();
