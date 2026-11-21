// Exporta o curta para MP4 1920x1080 30fps com a trilha sonora.
// Uso: node exportar/exportar.js [saida.mp4] [workers]
// Renderiza cada quadro no Chromium (Playwright) e codifica com ffmpeg.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { abrirPagina, RAIZ } = require('../ferramentas/servir');

const FPS = 30, DURACAO = parseFloat(process.env.DURACAO || '180'), TOTAL = Math.round(FPS * DURACAO);
const PAGINA = process.env.PAGINA || 'index.html';
const saida = path.resolve(process.argv[2] || path.join(RAIZ, 'saida', 'nosso_amor_180s.mp4'));
const nW = parseInt(process.argv[3] || '3', 10);
const tmp = path.join(path.dirname(saida), '.partes_' + path.basename(saida, '.mp4'));
fs.mkdirSync(tmp, { recursive: true });

async function worker(b, id, f0, f1) {
  const pg = await abrirPagina(b, PAGINA);
  await pg.waitForFunction(() => window.CURTA_PRONTO, null, { timeout: 120000 });
  const arq = path.join(tmp, `parte_${id}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), arq], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const url = await pg.evaluate(t => window.CURTA.renderJPEG(t, 0.94), (f + 0.5) / FPS);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`[${id}] quadro ${f - f0}/${f1 - f0} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((ok, erro) => ff.on('close', c => (c === 0 ? ok() : erro(new Error('ffmpeg falhou')))));
  await pg.close();
  return arq;
}

(async () => {
  const b = await chromium.launch();
  const por = Math.ceil(TOTAL / nW);
  const partes = await Promise.all(Array.from({ length: nW }, (_, i) => worker(b, i, i * por, Math.min(TOTAL, (i + 1) * por))));
  await b.close();
  const lista = path.join(tmp, 'lista.txt');
  fs.writeFileSync(lista, partes.map(p => `file '${p}'`).join('\n'));
  const audio = path.join(RAIZ, process.env.AUDIO || 'audio/trilha.wav');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-i', audio,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', saida], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('Pronto:', saida);
})();
