(() => {
  const text = JSON.stringify(window.__flRec, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = 'fl-capture-api.json';
  a.click();
  console.log((window.__flRec || []).length + ' calls saved');
})();
