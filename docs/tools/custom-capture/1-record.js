(() => {
  if (window.__flRec) {
    return console.log('already recording: ' + window.__flRec.length);
  }
  const rec = (window.__flRec = []);
  const IMG = /\.(png|jpe?g|gif|svg|css|js|woff2?|ico|map)$/i;
  const keep = (u) => {
    try {
      const x = new URL(u, location.href);
      return /fallenlondon\.com$/.test(x.hostname) && !IMG.test(x.pathname);
    } catch (e) {
      return false;
    }
  };
  const oF = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init && init.method) || (input && input.method) || 'GET';
    const body = init && typeof init.body === 'string' ? init.body : null;
    const p = oF.apply(this, arguments);
    if (keep(url)) {
      p.then((r) => r.clone().text().then((t) => {
        rec.push({ via: 'fetch', method, url, status: r.status, body, response: t });
      })).catch(() => {});
    }
    return p;
  };
  const oOpen = XMLHttpRequest.prototype.open;
  const oSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) {
    this.__fl = { method: m, url: String(u) };
    return oOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (b) {
    const meta = this.__fl;
    if (meta && keep(meta.url)) {
      this.addEventListener('loadend', () => {
        const binary = this.responseType && this.responseType !== 'text';
        rec.push({
          via: 'xhr', method: meta.method, url: meta.url, status: this.status,
          body: typeof b === 'string' ? b : null,
          response: binary ? '[' + this.responseType + ']' : this.responseText,
        });
      });
    }
    return oSend.apply(this, arguments);
  };
  console.log('Recording. Do the steps, then run 2-save.js.');
})();
