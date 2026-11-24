(() => {
  const q = (s) => [...document.querySelectorAll(s)]
    .map((e) => e.outerHTML).join('\n');
  const html = location.pathname + '\n'
    + q('.equipment-group-list') + '\n'
    + q('.outfit-controls') + '\n'
    + q('li.quality-item');
  const name = 'fl-capture' + location.pathname.replace(/\W+/g, '-') + '.html';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = name;
  a.click();
  console.log(name + ': ' + html.length + ' characters saved');
})();
