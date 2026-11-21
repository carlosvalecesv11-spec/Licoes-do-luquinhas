// Gera quadros em instantes escolhidos (para revisão visual).
// Uso: node ferramentas/contato.js <pasta-saida> t1 t2 t3 ...
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { abrirPagina } = require('./servir');
(async () => {
  const [,, outDir, ...ts] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const pg = await abrirPagina(b, process.env.PAGINA || 'index.html');
  await pg.waitForFunction(() => window.CURTA_PRONTO, null, { timeout: 60000 });
  for (const t of ts) {
    const url = await pg.evaluate(t => window.CURTA.renderJPEG(parseFloat(t), 0.85), t);
    fs.writeFileSync(path.join(outDir, `q_${String(parseFloat(t).toFixed(1)).padStart(6, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
