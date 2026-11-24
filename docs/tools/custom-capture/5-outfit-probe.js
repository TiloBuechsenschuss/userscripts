(async () => {
  const seen = [...new Set(
    performance.getEntriesByType('resource').map((e) => e.name)
      .filter((u) => /api\.fallenlondon\.com/.test(u))
  )];
  console.log('API URLs seen since page load:\n' + seen.join('\n'));
  const raw = localStorage.getItem('access_token') || '';
  const tok = raw.replace(/^"|"$/g, '');
  console.log('token stored as: length ' + raw.length
    + ', quoted: ' + /^"/.test(raw) + ', starts: ' + tok.slice(0, 2) + '...');
  const url = 'https://api.fallenlondon.com/api/outfit';
  try {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + tok } });
    const text = await res.text();
    console.log('GET /api/outfit -> HTTP ' + res.status + ', ' + text.length + ' chars');
    console.log(text.slice(0, 300));
    if (res.ok) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = 'fl-capture-outfit.json';
      a.click();
    }
  } catch (e) {
    console.log('GET /api/outfit failed: ' + e);
  }
})();
