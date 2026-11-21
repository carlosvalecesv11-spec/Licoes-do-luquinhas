// Captura um quadro de uma página para conferência visual.
// Uso: node ferramentas/captura.js <pagina-relativa> <saida.png> [js para avaliar]
// Os arquivos são servidos direto do disco (sem servidor HTTP).
const { chromium } = require('playwright');
const { abrirPagina } = require('./servir');
(async () => {
  const [,, rel, out, js] = process.argv;
  const b = await chromium.launch();
  const pg = await abrirPagina(b, rel);
  if (js) await pg.evaluate(js);
  await pg.waitForFunction(() => document.title === 'pronto' || window.CURTA_PRONTO, null, { timeout: 30000 }).catch(()=>{}); await pg.waitForTimeout(100);
  await (await pg.$('canvas')).screenshot({ path: out });
  await b.close();
})();
