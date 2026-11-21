'use strict';
// =====================================================================
//  Motor: carrega imagens, prepara fotos, conteúdo da TV e renderiza
//  qualquer instante T (determinístico — o mesmo T gera o mesmo quadro).
// =====================================================================
const FOTO_CANVAS = [];
let TVC = null, TVA = null;

function carregarImagem(src) {
  return new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => erro(new Error('Falha ao carregar ' + src)); i.src = src; });
}
async function carregarTudo() {
  await carregarFontes();
  const imgs = {};
  for (const k in PERS) imgs[PERS[k].src] = await carregarImagem(PERS[k].src);
  prepararPersonagens(imgs);
  IMG_BUQUE = await carregarImagem('assets/objetos/buque_lirios.png');
  const lista = window.FOTOS || [];
  for (const f of lista) FOTO_CANVAS.push(comporFoto(await carregarImagem('fotos/' + f)));
  TVC = document.createElement('canvas'); TVC.width = W; TVC.height = H;
  TVA = document.createElement('canvas'); TVA.width = W; TVA.height = H;
}
// Foto inteira (proporção preservada) sobre fundo desfocado da própria foto
function comporFoto(img) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cover = Math.max(W / img.width, H / img.height) * 1.15;
  g.filter = 'blur(42px) brightness(0.55)';
  g.drawImage(img, (W - img.width * cover) / 2, (H - img.height * cover) / 2, img.width * cover, img.height * cover);
  g.filter = 'none';
  const cont = Math.min(W / img.width, H / img.height) * 0.94;
  const w = img.width * cont, h = img.height * cont;
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50;
  g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  return c;
}

// ---------------------------------------------------------------- conteúdo da TV
let _tvT = null;
function tvConteudo(T) {
  if (_tvT === T) return TVC;
  _tvT = T;
  const g = TVC.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (T < 140) desenhoAnimado(g, T);
  else if (T < 145) {
    const a = TVA.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    desenhoAnimado(a, Math.min(T, 140) + (T - 140) * 0.3);
    falhaTV(g, T, seg(T, 140, 144.6));
  } else if (T < 147.2) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  else if (T < 150) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const k = easeOut(seg(T, 147.3, 149.2));
    const r = 6 + 34 * k + Math.sin(T * 6) * 2;
    glow(g, W / 2, H / 2, r * 9, '#ffffff', 0.7 * k, 'source-over');
    circle(g, W / 2, H / 2, r, '#ffffff');
    fade(g, seg(T, 149.4, 150), '#ffffff');
  } else fotosNaTV(g, T);
  return TVC;
}
function fotosNaTV(g, T) {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const n = FOTO_CANVAS.length; if (!n) return;
  const t0 = 150, t1 = 175, d = (t1 - t0) / n, xf = 0.9;
  for (let i = 0; i < n; i++) {
    const a = t0 + i * d, b = a + d;
    if (T < a - 0.01 || T > b + xf) continue;
    let alpha = i === 0 ? seg(T, a, a + 0.5) : seg(T, a, a + xf);
    if (i === n - 1) alpha *= 1 - seg(T, 173.0, 175);
    const k = seg(T, a, b + xf);
    const sc = 1 + 0.045 * k;
    g.save(); g.globalAlpha = alpha;
    g.translate(W / 2, H / 2); g.scale(sc, sc); g.translate(-W / 2, -H / 2);
    g.drawImage(FOTO_CANVAS[i], 0, 0);
    g.restore();
  }
  if (T < 150.6) fade(g, 1 - seg(T, 150, 150.6), '#ffffff');
}
// Desenho animado fofo na TV: dois coelhinhos apaixonados num jardim
function desenhoAnimado(g, T) {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, '#8fd3ff'], [1, '#e6f7ff']]); g.fillRect(0, 0, W, H);
  sol(g, 1650, 180, 90, '#fff3a0');
  nuvem(g, (T * 30) % 2300 - 300, 180, 1.4); nuvem(g, (T * 22 + 900) % 2300 - 300, 120, 1.1);
  g.fillStyle = '#7ccf6a'; g.beginPath(); g.ellipse(500, 1150, 1100, 420, 0, 0, TAU); g.fill();
  g.fillStyle = '#65bb58'; g.beginPath(); g.ellipse(1500, 1180, 1000, 440, 0, 0, TAU); g.fill();
  for (let i = 0; i < 26; i++) {
    const x = rnd(i + 200) * W, y = 820 + rnd(i + 230) * 220;
    line(g, x, y, x, y + 60, '#3f8a3a', 8);
    const c = ['#ff7fa8', '#ffd84a', '#ff9a4a', '#c88bff', '#ffffff'][i % 5];
    for (let p = 0; p < 5; p++) circle(g, x + Math.cos(p * 1.256 + T) * 18, y + Math.sin(p * 1.256 + T) * 18, 14, c);
    circle(g, x, y, 11, '#ffcf3a');
  }
  // coelhinhos
  const hugK = eio(T, 137.0, 137.8);
  const ax = lerp(T < 135 ? 620 + Math.sin(T * 2) * 120 : 760, 880, hugK);
  const bx = lerp(1260 + Math.sin(T * 1.7) * 90 * (T < 135 ? 1 : 0), 1040, hugK);
  const hopA = T < 135 ? Math.abs(Math.sin(T * 6)) * 60 : 0, hopB = T < 135 ? Math.abs(Math.sin(T * 5 + 1)) * 50 : 0;
  coelho(g, ax, 780 - hopA, 1, '#ffffff', '#ffb6c8', T, 1);
  const offer = T > 135 && T < 137.4 ? eio(T, 135.0, 135.6) : 0;
  coelho(g, bx, 790 - hopB, -1, '#ffc8d8', '#ff8fb0', T, 0.95);
  if (offer > 0 || hugK > 0) {
    const fx = ax + 110 + offer * 20, fy = 690;
    line(g, fx, fy, fx, fy + 90, '#3f8a3a', 7);
    for (let p = 0; p < 6; p++) circle(g, fx + Math.cos(p * 1.05) * 20, fy + Math.sin(p * 1.05) * 20, 16, '#ff6f9a');
    circle(g, fx, fy, 12, '#ffe04a');
  }
  if (hugK > 0.5) {
    const k = seg(T, 137.6, 139.5);
    heart(g, 960, 440 - k * 60, 150 * easeOutBack(Math.min(1, k * 3)), '#ff4d7a', '#fff', 6);
    for (let i = 0; i < 8; i++) heart(g, 960 + Math.cos(i * 0.8) * 300 * k, 460 - Math.sin(i * 0.8) * 200 * k, 40, `rgba(255,120,160,${1 - k})`);
  }
}
function coelho(g, x, y, dir, cor, interno, T, s) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  ellipse(g, 0, 60, 120, 20, 0, 'rgba(0,0,0,0.12)');
  ellipse(g, 0, -20, 95, 85, 0, cor, '#5a4a4a', 5);
  circle(g, -90, 10, 26, cor, '#5a4a4a', 5);
  for (const ex of [-40, 25]) {
    g.save(); g.translate(ex, -210); g.rotate(ex < 0 ? -0.2 + Math.sin(T * 3) * 0.05 : 0.15);
    ellipse(g, 0, -70, 30, 95, 0, cor, '#5a4a4a', 5); ellipse(g, 0, -65, 15, 70, 0, interno);
    g.restore();
  }
  circle(g, 0, -150, 85, cor, '#5a4a4a', 5);
  circle(g, 25, -165, 13, '#3a2a2a'); circle(g, 30, -170, 4, '#fff');
  circle(g, -25, -165, 13, '#3a2a2a'); circle(g, -20, -170, 4, '#fff');
  ellipse(g, 0, -138, 10, 7, 0, '#ff8fa8');
  g.beginPath(); g.arc(0, -128, 16, 0.3, Math.PI - 0.3); g.strokeStyle = '#3a2a2a'; g.lineWidth = 5; g.stroke();
  ellipse(g, 55, -130, 18, 10, 0, 'rgba(255,120,150,0.5)'); ellipse(g, -55, -130, 18, 10, 0, 'rgba(255,120,150,0.5)');
  g.restore();
}
// Falha da TV: faixas deslocadas, cores, chiado e "neve"
function falhaTV(g, T, k) {
  const f = Math.floor(T * 30);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const pisca = rnd(f * 3.3) < k * 0.5;
  if (!pisca) {
    const bands = 18;
    for (let i = 0; i < bands; i++) {
      const y = i * H / bands, h = H / bands + 1;
      const off = (rnd(f * 7 + i) - 0.5) * 300 * k * (rnd(f + i * 11) < 0.4 + k * 0.5 ? 1 : 0);
      g.drawImage(TVA, 0, y, W, h, off, y, W, h);
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 * k;
    g.drawImage(TVA, 14 * k * 3, 0); g.restore();
  }
  // neve
  const n = Math.floor(400 + k * 3200);
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rnd(f * 131 + i) * 255);
    g.fillStyle = `rgba(${v},${v},${v},${0.35 + k * 0.6})`;
    g.fillRect(rnd(f * 17 + i * 3) * W, rnd(f * 29 + i * 5) * H, 6 + rnd(i) * 18, 4 + rnd(i + 1) * 6);
  }
  // linhas de varredura
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  if (rnd(f * 5.1) < 0.3 * k) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, rnd(f) * H, W, 30 + rnd(f + 3) * 80); }
}

// ---------------------------------------------------------------- render
let _off = null;
function renderAt(ctx, T) {
  T = clamp(T, 0, DURACAO - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let i = SHOTS.findIndex(s => T >= s.t0 && T < s.t1);
  if (i < 0) i = SHOTS.length - 1;
  const s = SHOTS[i];
  const xf = s.xf || 0;
  if (i > 0 && xf > 0 && T < s.t0 + xf) {
    ctx.save(); SHOTS[i - 1].draw(ctx, T); ctx.restore();
    if (!_off) { _off = document.createElement('canvas'); _off.width = W; _off.height = H; }
    const o = _off.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
    o.save(); s.draw(o, T); o.restore();
    ctx.save(); ctx.globalAlpha = smooth((T - s.t0) / xf); ctx.drawImage(_off, 0, 0); ctx.restore();
  } else {
    ctx.save(); s.draw(ctx, T); ctx.restore();
  }
  if (T < 175) vignette(ctx, 0.3);
}
