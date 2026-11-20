const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/luquinhas.html'); await p.evaluate(() => window.ready);
  const o = await p.evaluate(() => window.exportAll());
  fs.mkdirSync('luq', { recursive: true });
  for (const [k, d] of Object.entries(o)) fs.writeFileSync(`luq/${k}.png`, Buffer.from(d.split(',')[1], 'base64'));
  await b.close();
})();
