'use strict';
// =====================================================================
//  Cenários (coordenadas de mundo 1920x1080)
// =====================================================================

function paredeChao(ctx, wall1, wall2, floor1, floor2, floorY = 840, plank = true) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, floorY, [[0, wall1], [1, wall2]]); ctx.fillRect(-200, -200, W + 400, floorY + 200);
  ctx.fillStyle = linGrad(ctx, 0, floorY, 0, H, [[0, floor1], [1, floor2]]); ctx.fillRect(-200, floorY, W + 400, H - floorY + 200);
  if (plank) { ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = floorY + 20 + i * i * 9; line(ctx, -200, y, W + 200, y, 'rgba(0,0,0,0.10)', 3); } }
  fillRR(ctx, -200, floorY - 18, W + 400, 18, 0, 'rgba(255,255,255,0.12)');
}
// Janela com chuva/noite/dia
function janela(ctx, T, x, y, w, h, o = {}) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (o.noite) {
    ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, '#0d1430'], [1, '#26345e']]); ctx.fillRect(x, y, w, h);
    // prédios distantes
    for (let i = 0; i < 6; i++) {
      const bx = x + i * w / 5 - 20, bh = h * (0.25 + rnd(i + 3) * 0.3);
      ctx.fillStyle = '#141b36'; ctx.fillRect(bx, y + h - bh, w / 5 - 6, bh);
      for (let j = 0; j < 6; j++) if (rnd(i * 10 + j) > 0.55) { ctx.fillStyle = 'rgba(255,214,120,0.55)'; ctx.fillRect(bx + 8 + (j % 2) * 26, y + h - bh + 12 + Math.floor(j / 2) * 28, 12, 14); }
    }
    if (o.estrelas) for (let i = 0; i < 25; i++) circle(ctx, x + rnd(i + 70) * w, y + rnd(i + 90) * h * 0.5, 1.5 + rnd(i) * 1.5, `rgba(255,255,255,${0.4 + 0.5 * Math.abs(Math.sin(T * 2 + i))})`);
    if (o.chuva) rain(ctx, T, { x, y, w, h, count: 70, alpha: o.chuva, speed: 900, len: 26, lw: 2 });
  } else {
    ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, '#6fb8ec'], [1, '#c8e8fb']]); ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 3; i++) nuvem(ctx, x + ((i * 170 + T * 12) % (w + 200)) - 100, y + 60 + i * 50, 0.5 + i * 0.1);
    ctx.fillStyle = '#7fb069'; ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + h + 30, w * 0.6, 90, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
  // moldura
  ctx.strokeStyle = o.moldura || '#e9e4dc'; ctx.lineWidth = 16; ctx.strokeRect(x, y, w, h);
  line(ctx, x + w / 2, y, x + w / 2, y + h, o.moldura || '#e9e4dc', 10);
  fillRR(ctx, x - 26, y + h, w + 52, 20, 4, o.moldura || '#e9e4dc');
  // cortinas
  if (o.cortina) for (const sx of [0, 1]) {
    const cx = sx ? x + w + 10 : x - 70;
    ctx.fillStyle = o.cortina; ctx.beginPath(); ctx.moveTo(cx, y - 40); ctx.lineTo(cx + 60, y - 40);
    ctx.quadraticCurveTo(cx + 40 + (sx ? -20 : 20), y + h * 0.6, cx + 60, y + h + 40); ctx.lineTo(cx, y + h + 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) line(ctx, cx + i * 15, y - 30, cx + i * 15, y + h + 30, 'rgba(0,0,0,0.12)', 3);
  }
  if (o.cortina) fillRR(ctx, x - 100, y - 52, w + 200, 12, 6, '#8a6a4a');
}
function nuvem(ctx, x, y, s, a = 0.95) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff';
  for (const [dx, dy, r] of [[0, 0, 40], [40, -18, 48], [88, 0, 40], [44, 12, 44], [-34, 10, 30], [120, 12, 28]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function abajur(ctx, T, x, y, on = 1, cor = '#ffcf7a') {
  // (x,y) = base sobre o criado
  fillRR(ctx, x - 22, y - 70, 44, 70, 18, '#c98d5a', 'rgba(0,0,0,0.3)', 2);
  poly(ctx, [x - 60, y - 70, x + 60, y - 70, x + 38, y - 160, x - 38, y - 160], on ? '#ffe7b0' : '#d9c9a8', 'rgba(0,0,0,0.25)', 2);
  if (on) glow(ctx, x, y - 110, 420, cor, 0.45 * on);
}
function criado(ctx, x, y, w = 190, h = 200, cor = '#a87a52') {
  // (x,y) = topo esquerdo
  fillRR(ctx, x, y, w, h, 8, cor, 'rgba(0,0,0,0.3)', 3);
  fillRR(ctx, x - 8, y - 14, w + 16, 18, 6, shade(cor, 1.12));
  line(ctx, x + 12, y + h * 0.5, x + w - 12, y + h * 0.5, 'rgba(0,0,0,0.25)', 3);
  circle(ctx, x + w / 2, y + h * 0.28, 7, '#e6c27a'); circle(ctx, x + w / 2, y + h * 0.75, 7, '#e6c27a');
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
// Cama vista de frente: parte de trás (cabeceira + travesseiros)
function camaFundo(ctx, cx, topY, w, cab = '#7c5a3e', trav = '#f4f1ea') {
  fillRR(ctx, cx - w / 2, topY, w, 420, [60, 60, 6, 6], cab, 'rgba(0,0,0,0.35)', 4);
  fillRR(ctx, cx - w / 2 + 30, topY + 30, w - 60, 320, [40, 40, 4, 4], shade(cab, 1.12));
  for (const sx of [-1, 1]) fillRR(ctx, cx + sx * w * 0.22 - 150, topY + 200, 300, 120, 50, trav, 'rgba(0,0,0,0.15)', 3);
}
// Cobertor por cima (do quadril para baixo)
function camaFrente(ctx, cx, y, w, cor = '#4a6fa5', T = 0, estampa = null) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 20, H + 50);
  ctx.lineTo(cx - w / 2 - 20, y + 30);
  ctx.quadraticCurveTo(cx - w / 2, y - 12, cx - w * 0.2, y - 6);
  ctx.quadraticCurveTo(cx, y + 18 + Math.sin(T * 1.3) * 3, cx + w * 0.2, y - 6);
  ctx.quadraticCurveTo(cx + w / 2, y - 12, cx + w / 2 + 20, y + 30);
  ctx.lineTo(cx + w / 2 + 20, H + 50); ctx.closePath();
  ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.save(); ctx.clip();
  if (estampa) estampa(ctx);
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 8;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - w * 0.4 + i * w * 0.25, y + 40); ctx.quadraticCurveTo(cx - w * 0.35 + i * w * 0.25, y + 160, cx - w * 0.42 + i * w * 0.25, y + 320); ctx.stroke(); }
  fillRR(ctx, cx - w / 2 - 20, y - 10, w + 40, 46, 20, 'rgba(255,255,255,0.22)');
  ctx.restore();
}

// ---------------------------------------------------------------- quartos
const QUARTO_ELE = { cx: 1000, bedW: 760, bedTop: 330, blanket: 720, ns: [1440, 650] };
function quartoEle(ctx, T, o = {}) {
  const noite = o.noite;
  paredeChao(ctx, noite ? '#26304f' : '#a8cde4', noite ? '#1c2440' : '#8fb9d6', noite ? '#3a2c28' : '#c79a6b', noite ? '#2a201d' : '#a87d52');
  janela(ctx, T, 170, 170, 380, 360, { noite, chuva: o.chuva, cortina: noite ? '#2f4a6b' : '#3f6f9b', moldura: noite ? '#9aa4b8' : '#f1ede6' });
  // pôster e prateleira
  fillRR(ctx, 640, 190, 170, 220, 6, noite ? '#3c4566' : '#f6e7c8', 'rgba(0,0,0,0.3)', 4);
  circle(ctx, 725, 280, 50, noite ? '#c0674a' : '#e98a5e'); ellipse(ctx, 725, 280, 80, 14, -0.3, null, noite ? '#e3c08d' : '#f5c87a', 5);
  fillRR(ctx, 1520, 230, 300, 16, 4, '#7c5a3e');
  const cores = ['#e05a4f', '#4f8fe0', '#f2c14e', '#5bb36a', '#9b6ad6'];
  for (let i = 0; i < 7; i++) fillRR(ctx, 1535 + i * 34, 150 + (i % 2) * 14, 28, 80 - (i % 2) * 14, 3, cores[i % 5]);
  camaFundo(ctx, QUARTO_ELE.cx, QUARTO_ELE.bedTop, QUARTO_ELE.bedW, '#6d4c35');
  criado(ctx, QUARTO_ELE.ns[0], QUARTO_ELE.ns[1]);
  abajur(ctx, T, QUARTO_ELE.ns[0] + 95, QUARTO_ELE.ns[1] - 14, o.abajur == null ? 1 : o.abajur);
  if (noite) { ctx.save(); ctx.fillStyle = 'rgba(10,15,40,0.25)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
function cobertorEle(ctx, T) {
  camaFrente(ctx, QUARTO_ELE.cx, QUARTO_ELE.blanket, QUARTO_ELE.bedW + 40, '#3f6496', T, (c) => {
    for (let i = 0; i < 8; i++) fillRR(c, QUARTO_ELE.cx - 420 + i * 110, QUARTO_ELE.blanket + 60, 50, 400, 0, 'rgba(255,255,255,0.05)');
  });
}
const QUARTO_ELA = { cx: 860, bedW: 760, bedTop: 330, blanket: 720, ns: [1300, 650] };
function quartoEla(ctx, T, o = {}) {
  const noite = o.noite;
  paredeChao(ctx, noite ? '#3b2c50' : '#f6dbe5', noite ? '#2b2040' : '#eec6d5', noite ? '#3c2d2d' : '#d4a77a', noite ? '#2a1f20' : '#b38559');
  janela(ctx, T, 1470, 170, 360, 360, { noite, chuva: o.chuva, estrelas: o.estrelas, cortina: noite ? '#6a4a7f' : '#f0a6c0', moldura: noite ? '#b7a6c9' : '#fffaf5' });
  // luzinhas
  ctx.strokeStyle = noite ? '#5a4a3a' : '#9c8a72'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(60, 90); for (let i = 0; i <= 12; i++) ctx.quadraticCurveTo(60 + i * 110 - 55, 140, 60 + i * 110, 90); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const x = 60 + i * 55, yy = 90 + Math.sin((i % 2 ? 0.5 : 0) * Math.PI) * 28 + (i % 2) * 6;
    const tw = 0.55 + 0.45 * Math.sin(T * 2.2 + i * 1.3);
    circle(ctx, x, yy + 12, 7, ['#ffd36b', '#ff9fb8', '#9fe3ff'][i % 3]);
    if (noite) glow(ctx, x, yy + 12, 40, ['#ffd36b', '#ff9fb8', '#9fe3ff'][i % 3], 0.5 * tw);
  }
  // quadro com coração
  fillRR(ctx, 300, 180, 200, 160, 6, '#fff3f6', '#c98aa0', 6);
  heart(ctx, 400, 262, 90, '#f06b8b');
  camaFundo(ctx, QUARTO_ELA.cx, QUARTO_ELA.bedTop, QUARTO_ELA.bedW, '#e7c6d2', '#fffafc');
  // ursinho
  const ux = QUARTO_ELA.cx - 300, uy = QUARTO_ELA.bedTop + 260;
  circle(ctx, ux, uy, 52, '#c99a6b', 'rgba(0,0,0,0.3)', 3); circle(ctx, ux - 40, uy - 44, 20, '#c99a6b'); circle(ctx, ux + 40, uy - 44, 20, '#c99a6b');
  circle(ctx, ux, uy - 70, 40, '#c99a6b', 'rgba(0,0,0,0.3)', 3); circle(ctx, ux - 14, uy - 76, 5, '#222'); circle(ctx, ux + 14, uy - 76, 5, '#222'); ellipse(ctx, ux, uy - 60, 12, 9, 0, '#e8c9a8');
  criado(ctx, QUARTO_ELA.ns[0], QUARTO_ELA.ns[1], 190, 200, '#f1e3d3');
  abajur(ctx, T, QUARTO_ELA.ns[0] + 140, QUARTO_ELA.ns[1] - 14, o.abajur == null ? 1 : o.abajur, '#ffb7cf');
  if (noite) { ctx.save(); ctx.fillStyle = 'rgba(20,10,40,0.25)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
function cobertorEla(ctx, T) {
  camaFrente(ctx, QUARTO_ELA.cx, QUARTO_ELA.blanket, QUARTO_ELA.bedW + 40, '#e98aa9', T, (c) => {
    for (let i = 0; i < 14; i++) heart(c, QUARTO_ELA.cx - 380 + (i % 7) * 125, QUARTO_ELA.blanket + 90 + Math.floor(i / 7) * 120, 34, 'rgba(255,255,255,0.35)');
  });
}
// Personagem sentado na cama (coberto do quadril para baixo)
function naCama(ctx, key, cx, blanketY, h, o = {}) {
  const P = PERS[key], s = h / ALTURA_IMG;
  const y = blanketY + (P.feet - P.hip) * s - 30 * s + (o.sink || 0);
  return drawChar(ctx, key, Object.assign({ x: cx, y, h, crop: P.hip + 40, shadow: false }, o));
}

// Cama vista de cima (deitado)
function camaTopo(ctx, T, cx, cy, cor, corTrav, o = {}) {
  ctx.fillStyle = o.chao || '#2b2238'; ctx.fillRect(-300, -300, W + 600, H + 600);
  fillRR(ctx, cx - 330, cy - 470, 660, 1100, 30, o.lencol || '#eef0f6', 'rgba(0,0,0,0.3)', 5);
  fillRR(ctx, cx - 250, cy - 430, 500, 190, 60, corTrav || '#ffffff', 'rgba(0,0,0,0.12)', 4);
}
function cobertorTopo(ctx, cx, y, cor) {
  fillRR(ctx, cx - 345, y, 690, 900, [40, 40, 30, 30], cor, 'rgba(0,0,0,0.25)', 5);
  fillRR(ctx, cx - 345, y, 690, 70, [40, 40, 0, 0], 'rgba(255,255,255,0.35)');
}

// ---------------------------------------------------------------- sala (cena dos lírios)
const SALA = { porta: [1450, 300, 280, 540] };
function sala(ctx, T, porta = 0, o = {}) {
  paredeChao(ctx, '#f7e6cb', '#efd6b2', '#c9955f', '#a8763f');
  // janela com sol
  janela(ctx, T, 160, 180, 360, 330, { cortina: '#f2b880', moldura: '#fffaf2' });
  glow(ctx, 340, 350, 600, '#fff2c8', 0.35);
  // quadro de flores
  fillRR(ctx, 640, 200, 230, 170, 6, '#fff', '#b88a5a', 8);
  for (let i = 0; i < 3; i++) drawLily(ctx, 700 + i * 55, 285 - (i % 2) * 20, 26, i);
  // sofá
  fillRR(ctx, 560, 560, 560, 200, 40, '#4f9d9a', 'rgba(0,0,0,0.3)', 4);
  fillRR(ctx, 530, 640, 620, 170, 40, '#5bb0ac', 'rgba(0,0,0,0.3)', 4);
  fillRR(ctx, 600, 600, 150, 110, 30, '#f3c36b', 'rgba(0,0,0,0.2)', 3);
  fillRR(ctx, 950, 600, 140, 110, 30, '#f08aa5', 'rgba(0,0,0,0.2)', 3);
  // planta
  fillRR(ctx, 1240, 720, 90, 110, 12, '#d0704a', 'rgba(0,0,0,0.3)', 3);
  for (let i = 0; i < 7; i++) ellipse(ctx, 1285 + Math.cos(i) * 40, 650 - i * 12 + Math.sin(T + i) * 3, 22, 60, -0.8 + i * 0.27, '#4f9a55', 'rgba(0,0,0,0.25)', 2);
  // tapete
  ellipse(ctx, 860, 930, 460, 80, 0, '#e7a46b');
  ellipse(ctx, 860, 930, 400, 60, 0, null, '#f6d08a', 6);
  portaFrente(ctx, T, porta, o);
}
// Porta de entrada (abre para dentro, mostrando a rua)
function portaFrente(ctx, T, open, o = {}) {
  const [x, y, w, h] = SALA.porta;
  // batente
  fillRR(ctx, x - 26, y - 26, w + 52, h + 26, 6, '#fffaf2', 'rgba(0,0,0,0.25)', 3);
  // lado de fora
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, '#8fd0f7'], [0.55, '#d7f0ff'], [0.56, '#c9c3b8'], [1, '#9f988b']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#7fb069'; ctx.fillRect(x, y + h * 0.5, w, 20);
  if (o.fora) o.fora(ctx);
  ctx.restore();
  // folha da porta (dobradiça à direita, abre em direção à câmera)
  const k = Math.cos(open * Math.PI * 0.5);
  const fx = x + w - w * k;
  const bulge = 60 * Math.sin(open * Math.PI * 0.5);
  if (k > 0.02) {
    ctx.beginPath();
    ctx.moveTo(fx, y - bulge * 0.4); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(fx, y + h + bulge * 0.2); ctx.closePath();
    ctx.fillStyle = '#9a5e34'; ctx.fill(); ctx.strokeStyle = '#5e3518'; ctx.lineWidth = 4; ctx.stroke();
    const pw = (x + w - fx);
    for (const [py, ph] of [[0.08, 0.36], [0.52, 0.4]]) {
      fillRR(ctx, fx + pw * 0.14, y + h * py, pw * 0.72, h * ph, 6, null, 'rgba(60,30,10,0.35)', 4);
    }
    circle(ctx, fx + pw * 0.12, y + h * 0.53, 10 * Math.max(0.3, k), '#e8c060', '#7a5a10', 2);
  }
  // campainha
  circle(ctx, x - 60, y + h * 0.45, 12, '#ddd', '#888', 3); circle(ctx, x - 60, y + h * 0.45, 5, '#f2c14e');
}

// ---------------------------------------------------------------- céu e cidade
function ceu(ctx, T, c1 = '#4aa3e8', c2 = '#cdebff') {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, H, [[0, c1], [1, c2]]); ctx.fillRect(-500, -500, W + 1000, H + 1000);
}
function sol(ctx, x, y, r, cor = '#fff2b0') {
  glow(ctx, x, y, r * 5, cor, 0.6); circle(ctx, x, y, r, cor);
}
// São Luís — vista panorâmica (centro histórico com azulejos, mar, palmeiras)
function saoLuis(ctx, T, pan = 0) {
  ceu(ctx, T, '#f59b5c', '#ffd9a0');
  sol(ctx, 1480 - pan * 0.2, 330, 70, '#fff0b8');
  for (let i = 0; i < 4; i++) nuvem(ctx, (i * 520 - pan * 0.3 + T * 8) % 2400 - 200, 140 + i * 30, 0.9, 0.6);
  // mar
  ctx.fillStyle = linGrad(ctx, 0, 520, 0, H, [[0, '#3f86b5'], [1, '#1e4f7c']]); ctx.fillRect(-200, 520, W + 400, H);
  for (let i = 0; i < 30; i++) { const y = 540 + i * 18; line(ctx, (i * 97 + T * 30) % W - 60, y, (i * 97 + T * 30) % W + 40, y, 'rgba(255,230,190,0.35)', 3); }
  // cidade na orla
  ctx.save(); ctx.translate(-pan, 0);
  const cores = ['#f2c14e', '#4f8fc9', '#e86f6f', '#f4f0e6', '#69b38a', '#f29e5c', '#9ec7e8'];
  for (let i = 0; i < 18; i++) {
    const bx = 120 + i * 118, bw = 112, bh = 150 + (i % 3) * 40;
    const by = 640 - bh;
    fillRR(ctx, bx, by, bw, bh, 2, cores[i % 7], 'rgba(0,0,0,0.3)', 3);
    // azulejos
    ctx.fillStyle = 'rgba(40,90,170,0.35)';
    if (i % 2 === 0) for (let yy = by + 8; yy < by + bh - 8; yy += 14) for (let xx = bx + 6; xx < bx + bw - 6; xx += 14) ctx.fillRect(xx, yy, 6, 6);
    // janelas em arco
    for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) {
      const wx = bx + 14 + j * 34, wy = by + 26 + k * 60;
      fillRR(ctx, wx, wy, 22, 38, [11, 11, 2, 2], '#3a5a7a', '#fff', 3);
    }
    poly(ctx, [bx - 6, by, bx + bw + 6, by, bx + bw - 10, by - 22, bx + 10, by - 22], '#b5523b');
  }
  // igreja
  fillRR(ctx, 1000, 360, 90, 280, 4, '#f6f1e4', 'rgba(0,0,0,0.3)', 3); poly(ctx, [990, 360, 1100, 360, 1045, 290], '#e0d8c4');
  fillRR(ctx, 1170, 360, 90, 280, 4, '#f6f1e4', 'rgba(0,0,0,0.3)', 3); poly(ctx, [1160, 360, 1270, 360, 1215, 290], '#e0d8c4');
  fillRR(ctx, 1060, 430, 150, 210, 4, '#fbf7ec', 'rgba(0,0,0,0.3)', 3);
  fillRR(ctx, 1115, 520, 40, 120, [20, 20, 0, 0], '#6d4c35');
  ctx.restore();
  // palmeiras em primeiro plano
  palmeira(ctx, 90, 1080, 1.3, T); palmeira(ctx, 1830, 1080, 1.1, T + 1);
  ctx.fillStyle = '#e9cf96'; ctx.beginPath(); ctx.ellipse(960, 1150, 1300, 200, 0, 0, TAU); ctx.fill();
}
function palmeira(ctx, x, y, s, T, noite = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = noite ? '#2b1d14' : '#8a5a33'; ctx.lineWidth = 26; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -220, 10, -420); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.45 + Math.sin(T * 1.2 + i) * 0.04;
    ctx.strokeStyle = noite ? '#13261c' : '#3f8a4a'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(10, -420);
    ctx.quadraticCurveTo(10 + Math.cos(a) * 120, -420 + Math.sin(a) * 120 - 40, 10 + Math.cos(a) * 220, -420 + Math.sin(a) * 160 + 60);
    ctx.stroke();
  }
  ctx.restore();
}
// Rua de São Luís (chegada)
function ruaSaoLuis(ctx, T, pan = 0) {
  ceu(ctx, T, '#f7a35f', '#ffe2b0');
  ctx.save(); ctx.translate(-pan, 0);
  const cores = ['#f2c14e', '#4f8fc9', '#e8836f', '#f4f0e6', '#69b38a'];
  for (let i = -1; i < 9; i++) {
    const bx = i * 300, bh = 560;
    fillRR(ctx, bx, 820 - bh, 296, bh, 0, cores[(i + 5) % 5], 'rgba(0,0,0,0.25)', 3);
    ctx.fillStyle = 'rgba(30,80,160,0.28)';
    if ((i + 5) % 2 === 0) for (let yy = 300; yy < 800; yy += 22) for (let xx = bx + 10; xx < bx + 286; xx += 22) ctx.fillRect(xx, yy, 10, 10);
    for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) {
      const wx = bx + 30 + j * 90, wy = 330 + k * 200;
      fillRR(ctx, wx, wy, 60, 120, [30, 30, 3, 3], '#365a7c', '#fffaf0', 5);
      fillRR(ctx, wx - 8, wy + 118, 76, 14, 3, '#2e2e2e');
      for (let b = 0; b < 4; b++) line(ctx, wx - 4 + b * 22, wy + 118, wx - 4 + b * 22, wy + 160, '#2e2e2e', 3);
    }
    fillRR(ctx, bx - 4, 250, 304, 22, 0, '#b5523b');
  }
  ctx.restore();
  // calçada de pedras
  ctx.fillStyle = '#b9ad9a'; ctx.fillRect(-200, 820, W + 400, 300);
  ctx.strokeStyle = 'rgba(80,60,40,0.25)'; ctx.lineWidth = 3;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 30; c++) { ctx.beginPath(); ctx.ellipse(c * 80 + (r % 2) * 40 - ((pan * 1.0) % 80), 840 + r * 34, 34, 13, 0, 0, TAU); ctx.stroke(); }
  palmeira(ctx, 1750, 1000, 0.9, T);
}

// ---------------------------------------------------------------- prédio (reencontro)
const PREDIO = { porta: [1210, 470, 220, 370], calcada: 880, meioFio: 905 };
function predio(ctx, T, porta = 0, noite = 0) {
  // céu de entardecer → noite
  const c1 = mixColor('#5a4a8a', '#1b1f45', noite), c2 = mixColor('#f39a6b', '#4a3a6a', noite);
  ceu(ctx, T, c1, c2);
  for (let i = 0; i < 30; i++) circle(ctx, rnd(i + 300) * W, rnd(i + 330) * 300, 1.6, `rgba(255,255,255,${noite * (0.4 + 0.4 * Math.sin(T * 2 + i))})`);
  // prédio
  fillRR(ctx, 520, 60, 1180, 790, 6, '#e9cfb2', 'rgba(0,0,0,0.3)', 4);
  fillRR(ctx, 520, 60, 1180, 40, 4, '#c9a684');
  for (let f = 0; f < 4; f++) for (let j = 0; j < 6; j++) {
    const wx = 580 + j * 185, wy = 130 + f * 160;
    if (f === 3 && j >= 3 && j <= 4) continue;
    const lit = rnd(f * 10 + j) > 0.35;
    fillRR(ctx, wx, wy, 110, 100, 4, lit ? mixColor('#ffe2a0', '#ffd27a', noite) : '#4a5a7a', '#fff', 5);
    if (lit) glow(ctx, wx + 55, wy + 50, 110, '#ffd27a', 0.25 + noite * 0.25);
    fillRR(ctx, wx - 12, wy + 102, 134, 12, 3, '#d8b896');
  }
  // marquise e porta de vidro
  const [x, y, w, h] = PREDIO.porta;
  fillRR(ctx, x - 70, y - 50, w + 140, 30, 6, '#6d5a4a');
  glow(ctx, x + w / 2, y - 10, 160, '#ffe6a8', 0.5 + noite * 0.3);
  fillRR(ctx, x - 14, y - 10, w + 28, h + 10, 4, '#5d6470');
  // interior iluminado
  ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, '#ffe9b8'], [1, '#e8c890']]); ctx.fillRect(x, y, w, h);
  glow(ctx, x + w / 2, y + h * 0.4, 300, '#fff1c8', porta * 0.6);
  predio._dentro && predio._dentro(ctx);
  // folhas de vidro (abre para fora à esquerda)
  const k = Math.cos(porta * Math.PI * 0.45);
  ctx.save();
  ctx.fillStyle = 'rgba(170,210,230,0.45)'; ctx.strokeStyle = '#3d434d'; ctx.lineWidth = 8;
  const lw = w / 2 * k;
  ctx.fillRect(x, y, lw, h); ctx.strokeRect(x, y, lw, h);
  ctx.fillRect(x + w / 2, y, w / 2, h); ctx.strokeRect(x + w / 2, y, w / 2, h);
  line(ctx, x + w / 2 - 20, y + h * 0.5, x + w / 2 - 20, y + h * 0.62, '#c9ccd2', 6);
  ctx.restore();
  // degrau, vasos, interfone
  fillRR(ctx, x - 40, y + h, w + 80, 22, 3, '#bfb2a4', 'rgba(0,0,0,0.3)', 2);
  for (const vx of [x - 120, x + w + 60]) {
    fillRR(ctx, vx, y + h - 80, 60, 80, 8, '#c9704a', 'rgba(0,0,0,0.3)', 2);
    for (let i = 0; i < 5; i++) ellipse(ctx, vx + 30 + (i - 2) * 10, y + h - 110 - (i % 2) * 20, 14, 40, (i - 2) * 0.3, '#4f8a55');
  }
  fillRR(ctx, x + w + 22, y + h * 0.35, 30, 60, 4, '#9aa0a8', '#555', 2);
  for (let i = 0; i < 4; i++) circle(ctx, x + w + 37, y + h * 0.35 + 12 + i * 12, 3, '#333');
  // calçada e rua
  ctx.fillStyle = '#c8c2ba'; ctx.fillRect(-200, PREDIO.porta[1] + h + 20, W + 400, PREDIO.meioFio - (y + h + 20));
  for (let i = 0; i < 20; i++) line(ctx, i * 130 - 40, PREDIO.porta[1] + h + 20, i * 130 - 80, PREDIO.meioFio, 'rgba(0,0,0,0.08)', 3);
  fillRR(ctx, -200, PREDIO.meioFio - 6, W + 400, 22, 0, '#9d968d');
  ctx.fillStyle = '#3c3d44'; ctx.fillRect(-200, PREDIO.meioFio + 16, W + 400, H);
  for (let i = 0; i < 8; i++) fillRR(ctx, i * 300 - 50, 1010, 150, 14, 4, '#e8e2c8');
  // poste
  fillRR(ctx, 300, 300, 18, 600, 6, '#3a3d44');
  line(ctx, 309, 305, 380, 290, '#3a3d44', 12);
  const on = clamp(noite * 1.5);
  ellipse(ctx, 392, 296, 30, 12, 0, on > 0.2 ? '#fff2c0' : '#c9ccd2');
  glow(ctx, 392, 330, 380, '#ffdf9a', on * 0.55);
  // árvore
  fillRR(ctx, 120, 560, 30, 330, 10, '#5a3d28');
  for (let i = 0; i < 6; i++) circle(ctx, 135 + Math.cos(i) * 80, 520 + Math.sin(i * 2) * 50, 90, mixColor('#4f8a55', '#22402a', noite));
}
function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, clamp(t)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// ---------------------------------------------------------------- noite na praia
function marNoite(ctx, T, horizonte = 520, lua = [1500, 200]) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, horizonte, [[0, '#0b1030'], [1, '#2c3a70']]); ctx.fillRect(-1000, -1000, W + 2000, horizonte + 1000);
  for (let i = 0; i < 90; i++) circle(ctx, rnd(i + 500) * (W + 800) - 400, rnd(i + 600) * horizonte * 0.9 - 200, 1 + rnd(i + 700) * 1.8, `rgba(255,255,240,${0.35 + 0.6 * Math.abs(Math.sin(T * (0.6 + rnd(i)) + i))})`);
  glow(ctx, lua[0], lua[1], 260, '#fff6d8', 0.35); circle(ctx, lua[0], lua[1], 62, '#fff7df');
  circle(ctx, lua[0] - 18, lua[1] - 10, 12, 'rgba(220,210,180,0.5)'); circle(ctx, lua[0] + 20, lua[1] + 18, 9, 'rgba(220,210,180,0.5)');
  ctx.fillStyle = linGrad(ctx, 0, horizonte, 0, horizonte + 220, [[0, '#1e3463'], [1, '#13284a']]); ctx.fillRect(-1000, horizonte, W + 2000, 260);
  // reflexo da lua
  for (let i = 0; i < 14; i++) { const y = horizonte + 12 + i * 15; const w = 40 + i * 8 + Math.sin(T * 2 + i) * 14; fillRR(ctx, lua[0] - w / 2 + Math.sin(T + i) * 8, y, w, 5, 3, `rgba(255,246,200,${0.55 - i * 0.03})`); }
  // ondas
  for (let k = 0; k < 3; k++) {
    const y = horizonte + 190 + k * 18 + Math.sin(T * 0.9 + k) * 8;
    ctx.strokeStyle = `rgba(230,240,255,${0.5 - k * 0.12})`; ctx.lineWidth = 5;
    ctx.beginPath(); for (let x = -1000; x <= W + 1000; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.012 + T * 1.6 + k) * 6); ctx.stroke();
  }
}
function areia(ctx, y0 = 740, noite = true) {
  ctx.fillStyle = linGrad(ctx, 0, y0, 0, H + 200, [[0, noite ? '#a08b6a' : '#ecd49e'], [1, noite ? '#6e5d45' : '#d6b77a']]);
  ctx.beginPath(); ctx.moveTo(-1000, y0 + 10); for (let x = -1000; x <= W + 1000; x += 60) ctx.lineTo(x, y0 + Math.sin(x * 0.004) * 8); ctx.lineTo(W + 1000, H + 400); ctx.lineTo(-1000, H + 400); ctx.closePath(); ctx.fill();
}
function restaurante(ctx, T) {
  marNoite(ctx, T, 500, [1550, 170]);
  palmeira(ctx, 120, 760, 0.9, T, true); palmeira(ctx, 1800, 760, 0.8, T + 2, true);
  // deque de madeira
  ctx.fillStyle = linGrad(ctx, 0, 700, 0, H, [[0, '#8a5a3a'], [1, '#5e3a22']]); ctx.fillRect(-200, 700, W + 400, 500);
  for (let i = 0; i < 9; i++) line(ctx, -200, 720 + i * i * 6, W + 200, 720 + i * i * 6, 'rgba(0,0,0,0.25)', 3);
  // grade
  for (let i = 0; i < 24; i++) line(ctx, i * 85, 620, i * 85, 705, '#6b4429', 8);
  line(ctx, -20, 620, W + 20, 620, '#6b4429', 10);
  // varal de luzinhas
  for (const [y0, sag] of [[90, 90], [140, 70]]) {
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-20, y0); ctx.quadraticCurveTo(W / 2, y0 + sag * 2, W + 20, y0); ctx.stroke();
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x = lerp(-20, W + 20, t), y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0;
      circle(ctx, x, y + 10, 8, '#ffe6a0'); glow(ctx, x, y + 10, 60, '#ffd27a', 0.45 + 0.15 * Math.sin(T * 3 + i));
    }
  }
}
function mesaJantar(ctx, T, x, y) {
  // toalha
  fillRR(ctx, x - 520, y, 1040, 40, 10, '#fffaf2', 'rgba(0,0,0,0.25)', 3);
  ctx.fillStyle = '#f4ece0'; ctx.beginPath(); ctx.moveTo(x - 520, y + 30); ctx.lineTo(x + 520, y + 30); ctx.lineTo(x + 560, H + 20); ctx.lineTo(x - 560, H + 20); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) line(ctx, x - 250 + i * 100, y + 50, x - 270 + i * 108, H, 'rgba(0,0,0,0.08)', 4);
  // pratos, taças, vela
  for (const sx of [-1, 1]) {
    ellipse(ctx, x + sx * 250, y + 12, 85, 20, 0, '#ffffff', 'rgba(0,0,0,0.2)', 2);
    ellipse(ctx, x + sx * 250, y + 8, 50, 11, 0, sx < 0 ? '#e7a35a' : '#d9785a');
    poly(ctx, [x + sx * 60 - 16, y - 70, x + sx * 60 + 16, y - 70, x + sx * 60 + 10, y - 30, x + sx * 60 - 10, y - 30], 'rgba(220,240,255,0.5)', 'rgba(255,255,255,0.7)', 2);
    line(ctx, x + sx * 60, y - 30, x + sx * 60, y + 4, 'rgba(255,255,255,0.7)', 3);
    fillRR(ctx, x + sx * 60 - 14, y - 58, 28, 22, 4, 'rgba(190,40,70,0.7)');
  }
  fillRR(ctx, x - 12, y - 60, 24, 64, 4, '#fff4dc');
  const fl = Math.sin(T * 13) * 2 + Math.sin(T * 7.3) * 2;
  ellipse(ctx, x + fl * 0.3, y - 74, 9, 17 + fl * 0.5, 0, '#ffcf5a');
  ellipse(ctx, x + fl * 0.3, y - 70, 4, 8, 0, '#fff7d0');
  glow(ctx, x, y - 70, 260, '#ffc86a', 0.55 + fl * 0.02);
}

// ---------------------------------------------------------------- hotel
function hotelQuarto(ctx, T, tvLuz = null) {
  paredeChao(ctx, '#e9d9c0', '#d9c4a4', '#cbb9a2', '#ad9a82', 860, false);
  // quadro amarelo (como na foto do hotel)
  fillRR(ctx, 760, 120, 400, 220, 4, '#f2b632', 'rgba(0,0,0,0.3)', 4);
  fillRR(ctx, 820, 160, 280, 140, 2, '#9aa27a');
  for (let i = 0; i < 30; i++) circle(ctx, 830 + rnd(i) * 260, 170 + rnd(i + 40) * 120, 6 + rnd(i + 80) * 8, ['#d9c24a', '#7f9a5a', '#e9e2c0', '#b6a24a'][i % 4]);
  for (let i = 0; i < 16; i++) circle(ctx, 770 + rnd(i + 9) * 380, 130 + (i % 2) * 200 + rnd(i) * 10, 5, '#fff7e0');
  camaFundo(ctx, 960, 380, 980, '#c9a77c', '#ffffff');
  // criados e abajures
  criado(ctx, 160, 650, 220, 210, '#c9a77c'); abajur(ctx, T, 270, 636, 1, '#ffd49a');
  criado(ctx, 1540, 650, 220, 210, '#c9a77c'); abajur(ctx, T, 1650, 636, 1, '#ffd49a');
  glow(ctx, 960, 500, 900, '#ffb870', 0.18);
}
function hotelCobertor(ctx, T) {
  camaFrente(ctx, 960, 735, 1020, '#f7f4ee', T, (c) => {
    fillRR(c, 960 - 540, 900, 1080, 120, 0, '#7d8a6a');
  });
}
// Quarto de hotel visto de trás do casal (TV na parede)
function hotelTVFundo(ctx, T, luz = 1) {
  paredeChao(ctx, '#d9c6a8', '#c9b38f', '#b9a68e', '#9b8a74', 820, false);
  // cômoda
  fillRR(ctx, 560, 640, 800, 180, 10, '#b08a62', 'rgba(0,0,0,0.3)', 4);
  for (let i = 0; i < 3; i++) { line(ctx, 580 + i * 260, 730, 820 + i * 260, 730, 'rgba(0,0,0,0.2)', 3); circle(ctx, 700 + i * 260, 690, 6, '#e6c27a'); }
  // cortina e janela escura
  fillRR(ctx, 1500, 120, 300, 560, 4, '#1a2040');
  ctx.fillStyle = '#8a6a5a'; ctx.fillRect(1460, 100, 90, 620); ctx.fillRect(1760, 100, 90, 620);
  // abajur de pé
  fillRR(ctx, 260, 360, 10, 460, 4, '#3a3a3a'); poly(ctx, [200, 360, 330, 360, 300, 260, 230, 260], '#f4e2c0');
  glow(ctx, 265, 320, 380, '#ffd49a', 0.35 * luz);
}
