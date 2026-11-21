// Abre uma página do projeto no Chromium servindo os arquivos direto do disco
// via interceptação de requisições (origem fictícia http://curta.local).
const path = require('path');
const fs = require('fs');
const RAIZ = path.resolve(__dirname, '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ttf': 'font/ttf', '.css': 'text/css', '.m4a': 'audio/mp4', '.wav': 'audio/wav' };

async function abrirPagina(browser, rel, viewport = { width: 1920, height: 1080 }) {
  const pg = await browser.newPage({ viewport });
  pg.on('pageerror', e => console.error('ERRO:', e.message));
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console:', m.text()); });
  await pg.route('http://curta.local/**', async route => {
    const u = new URL(route.request().url());
    const f = path.join(RAIZ, decodeURIComponent(u.pathname));
    if (!f.startsWith(RAIZ) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nao encontrado' });
    route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  });
  await pg.goto('http://curta.local/' + rel);
  return pg;
}
module.exports = { abrirPagina, RAIZ };
