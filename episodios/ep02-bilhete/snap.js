const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8767/video.html'); await p.evaluate(() => window.ready);
  const info = await p.evaluate(() => ({ dur: window.DUR, lines: LINES.map(l => [l[0], l[1]]), scenes: SCENES.map(s => [s.name, s.start]) }));
  console.log(JSON.stringify(info));
  let ts = process.argv.slice(2).map(Number);
  if (!ts.length) ts = [1.0, ...info.lines.map(l => (l[0] + l[1]) / 2)];
  fs.mkdirSync('snaps', { recursive: true });
  for (const [i, t] of ts.entries()) { const d = await p.evaluate(t => window.frame(t), t); fs.writeFileSync(`snaps/s${String(i).padStart(2, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close();
})();
