// Run in the browser console on Fallen London's own settings / account page (the one with
// the game's options), while logged in. Saves one small file; send it back.
(() => {
  const main = document.querySelector('main, #main, .content, [role=main]') || document.body;
  const html = location.pathname + '\n'
    + 'title: ' + document.title + '\n'
    + 'headings: ' + [...document.querySelectorAll('h1,h2,h3')].map((h) => h.className + ' | ' + h.textContent.trim()).join(' || ') + '\n'
    + 'main: ' + main.tagName + '#' + main.id + '.' + main.className + '\n'
    + main.outerHTML.slice(0, 60000);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'fl-capture' + location.pathname.replace(/\W+/g, '-') + '.html';
  a.click();
  console.log(a.download + ': ' + html.length + ' characters saved');
})();
