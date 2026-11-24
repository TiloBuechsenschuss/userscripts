(() => {
  const btn = [...document.querySelectorAll('button, [role="button"], a')]
    .find((e) => /^\s*equip\s*$/i.test(e.textContent));
  if (!btn) {
    return console.log('No Equip button on screen. Open the item popup first.');
  }
  const chain = [];
  let root = btn;
  for (let i = 0; i < 6 && root.parentElement; i++) {
    chain.push(root.tagName.toLowerCase()
      + (root.getAttribute('role') ? '[role=' + root.getAttribute('role') + ']' : '')
      + (root.className && root.className.baseVal === undefined ? '.' + String(root.className).trim().split(/\s+/).join('.') : ''));
    if (root.parentElement === document.body) break;
    root = root.parentElement;
  }
  console.log('Button and its parents, innermost first:\n' + chain.join('\n'));
  const html = root.outerHTML;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = 'fl-capture-popup.html';
  a.click();
  console.log('fl-capture-popup.html: ' + html.length + ' characters saved');
})();
