'use strict';
// =====================================================================
//  Objetos independentes: celular, buquê, cartão, mala, TV, avião,
//  calendário, moto e motoboy.
// =====================================================================

// ---------------------------------------------------------------- celular
// (x,y) = centro; w = largura; screen(ctx,w,h) desenha a tela; back=true mostra a traseira
function drawPhone(ctx, x, y, w, rot = 0, o = {}) {
  const h = w * 2.05, r = w * 0.14;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (o.glow) glow(ctx, 0, o.back ? -h * 0.3 : 0, w * 2.6, o.glowColor || '#bfe3ff', o.glow);
  fillRR(ctx, -w / 2, -h / 2, w, h, r, '#17181c', '#000', w * 0.02);
  if (o.back) {
    fillRR(ctx, -w * 0.38, -h * 0.44, w * 0.42, w * 0.62, w * 0.1, '#25272d');
    for (let i = 0; i < 3; i++) circle(ctx, -w * 0.25, -h * 0.4 + i * w * 0.2 + w * 0.05, w * 0.07, '#0b0b0d', '#3a3d44', w * 0.015);
  } else {
    ctx.save();
    rr(ctx, -w / 2 + w * 0.05, -h / 2 + w * 0.05, w * 0.9, h - w * 0.1, r * 0.75); ctx.clip();
    ctx.translate(-w / 2 + w * 0.05, -h / 2 + w * 0.05);
    if (o.screen) o.screen(ctx, w * 0.9, h - w * 0.1);
    else { ctx.fillStyle = '#0a0b0e'; ctx.fillRect(0, 0, w, h); }
    ctx.restore();
    fillRR(ctx, -w * 0.12, -h / 2 + w * 0.08, w * 0.24, w * 0.06, w * 0.03, '#0b0b0d');
  }
  ctx.restore();
}

// Tela de conversa (sem texto: mensagens são barrinhas abstratas)
// st: {typed: nº de "letras", bubbles:[{me:bool, len:0..1, a:alpha}], avatar:'f'|'m', send:0..1, heartPop}
function chatScreen(ctx, w, h, st = {}) {
  ctx.fillStyle = '#efe6dc'; ctx.fillRect(0, 0, w, h);
  // padrão de fundo
  ctx.fillStyle = 'rgba(160,140,120,0.10)';
  for (let i = 0; i < 40; i++) circle(ctx, rnd(i) * w, rnd(i + 50) * h, w * 0.012 + rnd(i + 9) * w * 0.01);
  // cabeçalho
  const hh = h * 0.1;
  ctx.fillStyle = '#1f7a63'; ctx.fillRect(0, 0, w, hh);
  circle(ctx, w * 0.2, hh * 0.55, hh * 0.3, st.avatar === 'f' ? '#f6c21c' : '#9b5a2e');
  if (st.avatar === 'f') { heart(ctx, w * 0.2, hh * 0.58, hh * 0.28, '#e24d6a'); }
  else { circle(ctx, w * 0.2, hh * 0.6, hh * 0.16, '#efa46a'); }
  fillRR(ctx, w * 0.33, hh * 0.42, w * 0.34, hh * 0.18, hh * 0.09, 'rgba(255,255,255,0.85)');
  circle(ctx, w * 0.86, hh * 0.55, hh * 0.08, '#fff'); circle(ctx, w * 0.74, hh * 0.55, hh * 0.08, '#fff');
  // bolhas
  const kbTop = st.keyboard === false ? h * 0.9 : h * 0.62;
  let y = kbTop - h * 0.12;
  const bubbles = (st.bubbles || []).slice().reverse();
  for (const b of bubbles) {
    const bw = w * (0.28 + b.len * 0.42), bh = h * (0.045 + Math.ceil(b.len * 2) * 0.022);
    y -= bh + h * 0.02;
    const bx = b.me ? w - bw - w * 0.05 : w * 0.05;
    ctx.save(); ctx.globalAlpha = b.a == null ? 1 : b.a;
    const sc = b.pop == null ? 1 : easeOutBack(b.pop);
    ctx.translate(bx + bw / 2, y + bh / 2); ctx.scale(sc, sc); ctx.translate(-(bx + bw / 2), -(y + bh / 2));
    fillRR(ctx, bx, y, bw, bh, h * 0.018, b.me ? '#d6f8c4' : '#ffffff');
    if (b.heart) heart(ctx, bx + bw / 2, y + bh / 2, bh * 0.6, '#e8405f');
    else {
      const lines = Math.max(1, Math.ceil(b.len * 2));
      for (let i = 0; i < lines; i++) fillRR(ctx, bx + w * 0.035, y + bh * 0.22 + i * h * 0.024, (bw - w * 0.07) * (i === lines - 1 ? 0.6 : 1), h * 0.011, h * 0.005, 'rgba(60,60,60,0.35)');
    }
    if (b.me) { line(ctx, bx + bw - w * 0.09, y + bh - h * 0.012, bx + bw - w * 0.07, y + bh - h * 0.006, '#34b7f1', w * 0.008); line(ctx, bx + bw - w * 0.07, y + bh - h * 0.006, bx + bw - w * 0.04, y + bh - h * 0.02, '#34b7f1', w * 0.008); }
    ctx.restore();
  }
  // campo de digitação
  const fy = kbTop - h * 0.085;
  fillRR(ctx, w * 0.04, fy, w * 0.74, h * 0.065, h * 0.032, '#ffffff');
  const typed = st.typed || 0;
  for (let i = 0; i < typed; i++) {
    const row = Math.floor(i / 14), col = i % 14;
    if (row > 0) break;
    const cw = w * 0.04;
    if ((i + 1) % 5 === 0) continue; // "espaço"
    fillRR(ctx, w * 0.08 + col * cw, fy + h * 0.022, cw * 0.78, h * 0.022, h * 0.006, '#3b3b3b');
  }
  if (st.cursor) fillRR(ctx, w * 0.08 + Math.min(typed, 14) * w * 0.04, fy + h * 0.016, w * 0.008, h * 0.034, 1, '#1f7a63');
  const sp = st.send || 0;
  circle(ctx, w * 0.88, fy + h * 0.0325, h * 0.034 * (1 - sp * 0.15), '#1f9e6f');
  poly(ctx, [w * 0.865, fy + h * 0.02, w * 0.905, fy + h * 0.0325, w * 0.865, fy + h * 0.045, w * 0.872, fy + h * 0.0325], '#fff');
  // teclado
  if (st.keyboard !== false) {
    ctx.fillStyle = '#d5d8de'; ctx.fillRect(0, kbTop, w, h - kbTop);
    const rows = [10, 9, 7], kh = (h - kbTop) / 5;
    rows.forEach((n, r) => {
      const kw = w / 10.6;
      const x0 = (w - n * kw) / 2;
      for (let i = 0; i < n; i++) {
        const hi = st.key === r * 10 + i;
        fillRR(ctx, x0 + i * kw + kw * 0.08, kbTop + kh * 0.35 + r * kh * 1.1, kw * 0.84, kh * 0.85, w * 0.012, hi ? '#9aa3b2' : '#fbfbfc');
      }
    });
    fillRR(ctx, w * 0.28, kbTop + kh * 3.75, w * 0.44, kh * 0.85, w * 0.012, st.key === 99 ? '#9aa3b2' : '#fbfbfc');
    fillRR(ctx, w * 0.82, kbTop + kh * 2.55, w * 0.13, kh * 0.85, w * 0.012, st.key === 98 ? '#7b8597' : '#b3bac6');
  }
}

// Tela de notificação (celular aceso sobre a mesa)
function notifScreen(ctx, w, h, a = 1) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, h, [[0, '#2a3f6b'], [1, '#13203d']]); ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = a;
  fillRR(ctx, w * 0.06, h * 0.22, w * 0.88, h * 0.12, w * 0.06, 'rgba(255,255,255,0.92)');
  circle(ctx, w * 0.17, h * 0.28, w * 0.07, '#25d366');
  fillRR(ctx, w * 0.3, h * 0.25, w * 0.4, h * 0.018, 4, '#666'); fillRR(ctx, w * 0.3, h * 0.29, w * 0.55, h * 0.016, 4, '#aaa');
  ctx.globalAlpha = 1;
}
// Tela de chamada de vídeo: mostra o rosto do outro
function callScreen(ctx, w, h, key, T, extra = {}) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, h, [[0, extra.bg1 || '#f6dfe8'], [1, extra.bg2 || '#d9b3c4']]); ctx.fillRect(0, 0, w, h);
  drawChar(ctx, key, Object.assign({ x: w / 2, y: h * 1.72, h: h * 1.55, shadow: false, blink: blinkAt(T, 21) }, extra.face || {}));
  fillRR(ctx, w * 0.06, h * 0.7, w * 0.26, h * 0.15, w * 0.04, 'rgba(40,40,40,0.55)');
  circle(ctx, w * 0.3, h * 0.92, w * 0.08, '#e0383e'); circle(ctx, w * 0.7, h * 0.92, w * 0.08, 'rgba(255,255,255,0.35)');
}

// ---------------------------------------------------------------- buquê e cartão
let IMG_BUQUE = null;
// (x,y) = centro do buquê; h = altura
function drawBouquet(ctx, x, y, h, rot = 0, o = {}) {
  if (!IMG_BUQUE) return;
  const w = h * IMG_BUQUE.width / IMG_BUQUE.height;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.drawImage(IMG_BUQUE, -w / 2, -h / 2, w, h);
  if (o.card !== false) drawSmallCard(ctx, w * 0.17, h * 0.2, h * 0.16, 0.18);
  ctx.restore();
}
function drawSmallCard(ctx, x, y, w, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const h = w * 0.68;
  line(ctx, -w * 0.25, -h * 0.5, -w * 0.45, -h * 1.0, '#d7b56d', w * 0.03);
  fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.05, '#fbf3e3', '#c9a24c', w * 0.035);
  fillRR(ctx, -w / 2 + w * 0.07, -h / 2 + w * 0.07, w - w * 0.14, h - w * 0.14, w * 0.03, null, '#d9b866', w * 0.015);
  drawLily(ctx, 0, 0, w * 0.22, 0.2);
  ctx.restore();
}
// Lírio branco estilizado
function drawLily(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i * TAU / 6);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.45, -r * 0.5, 0, -r * 1.15);
    ctx.quadraticCurveTo(-r * 0.45, -r * 0.5, 0, 0);
    ctx.fillStyle = i % 2 ? '#fffdf6' : '#f6f1e2'; ctx.fill();
    ctx.strokeStyle = 'rgba(180,170,140,0.7)'; ctx.lineWidth = r * 0.04; ctx.stroke();
    line(ctx, 0, -r * 0.1, 0, -r * 0.7, 'rgba(190,210,120,0.6)', r * 0.04);
    ctx.restore();
  }
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.35;
    line(ctx, 0, 0, Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65, '#c8d77a', r * 0.035);
    ellipse(ctx, Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68, r * 0.09, r * 0.05, a, '#d9822b');
  }
  ctx.restore();
}

// Cartão aberto em close (texto EXATO do roteiro)
const TEXTO_CARTAO = [
  'Essas flores são um pequeno gesto,',
  'mas foram escolhidas com muito carinho.',
  'Espero que elas deixem o seu dia',
  'mais bonito e tirem um sorriso seu.',
];
const ASSINATURA = 'Com carinho, Eduardo';
// open: 0 = fechado (capa) .. 1 = aberto ; w = largura do cartão aberto
function drawCardOpen(ctx, cx, cy, w, open = 1) {
  const h = w * 0.62, half = w / 2;
  ctx.save(); ctx.translate(cx, cy);
  // sombra
  ctx.save(); ctx.globalAlpha = 0.35; fillRR(ctx, -half * (0.5 + open * 0.5) + 18, -h / 2 + 24, half * (1 + open), h, 18, '#000'); ctx.restore();
  // página direita (interior com texto)
  cardPanel(ctx, 0, -h / 2, half, h, true);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, -h / 2, half, h); ctx.clip();
  ctx.fillStyle = '#4a2c17'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fs = Math.round(w * 0.0275);
  ctx.font = `600 ${fs}px "Dancing Script", cursive`;
  TEXTO_CARTAO.forEach((l, i) => ctx.fillText(l, half / 2, -h * 0.25 + i * fs * 1.42));
  ctx.font = `700 ${Math.round(fs * 1.12)}px "Dancing Script", cursive`;
  ctx.fillText(ASSINATURA, half / 2, h * 0.27);
  heart(ctx, half / 2, h * 0.38, fs * 0.6, '#d4a64a');
  ctx.restore();
  // página esquerda (abre girando)
  const k = Math.cos(open * Math.PI); // 1 fechado (sobre a direita) -> -1 aberto
  ctx.save();
  ctx.scale(k, 1);
  cardPanel(ctx, 0, -h / 2, half, h, false);
  ctx.restore();
  // dobra
  line(ctx, 0, -h / 2 + 6, 0, h / 2 - 6, 'rgba(150,110,40,0.35)', 3);
  ctx.restore();
}
function cardPanel(ctx, x, y, w, h, inside = false) {
  ctx.fillStyle = linGrad(ctx, x, y, x + w, y + h, [[0, '#fdf7ea'], [1, '#f4e6c8']]);
  rr(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = '#c9a24c'; ctx.lineWidth = 5; ctx.stroke();
  rr(ctx, x + 18, y + 18, w - 36, h - 36, 8); ctx.strokeStyle = '#dcbc6e'; ctx.lineWidth = 2; ctx.stroke();
  // cantos dourados
  for (const [cx, cy] of [[x + 30, y + 30], [x + w - 30, y + 30], [x + 30, y + h - 30], [x + w - 30, y + h - 30]]) star(ctx, cx, cy, 9, '#d4a64a', 4, 0.35);
  if (!inside) {
    // capa / verso: ilustração de lírios
    const s = Math.min(w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    line(ctx, x + w * 0.5, y + h * 0.85, x + w * 0.42, y + h * 0.45, '#7aa35a', s * 0.02);
    line(ctx, x + w * 0.5, y + h * 0.85, x + w * 0.64, y + h * 0.5, '#7aa35a', s * 0.02);
    ellipse(ctx, x + w * 0.38, y + h * 0.7, s * 0.09, s * 0.03, -0.6, '#8cb86a');
    ellipse(ctx, x + w * 0.62, y + h * 0.72, s * 0.09, s * 0.03, 0.6, '#8cb86a');
    drawLily(ctx, x + w * 0.42, y + h * 0.42, s * 0.16, -0.3);
    drawLily(ctx, x + w * 0.64, y + h * 0.47, s * 0.13, 0.4);
    ellipse(ctx, x + w * 0.52, y + h * 0.28, s * 0.03, s * 0.07, 0.3, '#cfe3a0', '#9fbf6a', 2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- mala
function drawSuitcaseUpright(ctx, x, y, h, rot = 0) {
  // (x,y) = base central (rodinhas)
  const w = h * 0.62;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // alça
  line(ctx, -w * 0.18, -h, -w * 0.18, -h * 1.55, '#555b66', h * 0.035);
  line(ctx, w * 0.18, -h, w * 0.18, -h * 1.55, '#555b66', h * 0.035);
  fillRR(ctx, -w * 0.25, -h * 1.6, w * 0.5, h * 0.08, h * 0.03, '#2d3038');
  fillRR(ctx, -w / 2, -h, w, h * 0.95, h * 0.08, '#2f5d8c', '#18324d', h * 0.012);
  for (let i = 1; i < 4; i++) line(ctx, -w / 2 + w * i / 4, -h * 0.95, -w / 2 + w * i / 4, -h * 0.1, 'rgba(255,255,255,0.12)', h * 0.012);
  fillRR(ctx, -w * 0.15, -h * 1.02, w * 0.3, h * 0.05, h * 0.02, '#1d3a57');
  circle(ctx, -w * 0.35, -h * 0.03, h * 0.04, '#222'); circle(ctx, w * 0.35, -h * 0.03, h * 0.04, '#222');
  ctx.restore();
}
// Mala aberta sobre a cama (vista de cima/frente). lid: 1 aberta → 0 fechada; zip 0..1
function drawSuitcaseOpen(ctx, x, y, w, lid, items, zip = 0) {
  const h = w * 0.62;
  ctx.save(); ctx.translate(x, y);
  // tampa (atrás, em pé quando aberta)
  if (lid > 0.02) {
    const lh = h * lid;
    fillRR(ctx, -w / 2, -lh, w, lh, 18, '#2a5683', '#18324d', 4);
    fillRR(ctx, -w / 2 + 18, -lh + 14, w - 36, lh - 20, 12, '#3f6fa0');
  }
  // fundo (caixa)
  fillRR(ctx, -w / 2, 0, w, h, 18, '#2f5d8c', '#18324d', 4);
  fillRR(ctx, -w / 2 + 16, 12, w - 32, h - 28, 12, '#4a7cad');
  // roupas
  items.forEach((it) => {
    if (it.a <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(it.a);
    fillRR(ctx, it.x - it.w / 2, it.y - it.h / 2, it.w, it.h, 10, it.c, 'rgba(0,0,0,0.35)', 3);
    line(ctx, it.x - it.w * 0.4, it.y, it.x + it.w * 0.4, it.y, 'rgba(0,0,0,0.15)', 3);
    ctx.restore();
  });
  // tampa fechando por cima
  if (lid < 1) {
    const k = 1 - lid;
    ctx.save(); ctx.globalAlpha = smooth(k * 1.4);
    fillRR(ctx, -w / 2, h * (1 - k) - 4, w, h * k + 4, 18, '#2a5683', '#18324d', 4);
    if (k > 0.95) {
      for (let i = 1; i < 4; i++) line(ctx, -w / 2 + w * i / 4, 20, -w / 2 + w * i / 4, h - 20, 'rgba(255,255,255,0.12)', 6);
      // zíper
      line(ctx, -w / 2 + 10, h - 8, w / 2 - 10, h - 8, '#1b2f45', 8);
      const zx = lerp(-w / 2 + 20, w / 2 - 20, zip);
      fillRR(ctx, zx - 14, h - 22, 28, 26, 6, '#c9ccd2', '#555', 2);
    }
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- TV
// (x,y) = centro da tela; w,h = tamanho da tela; content = canvas ou função
function drawTV(ctx, x, y, w, h, content, o = {}) {
  ctx.save();
  // pé
  if (o.stand !== false) {
    poly(ctx, [x - w * 0.08, y + h / 2 + 10, x + w * 0.08, y + h / 2 + 10, x + w * 0.05, y + h / 2 + h * 0.16, x - w * 0.05, y + h / 2 + h * 0.16], '#1b1b1f');
    fillRR(ctx, x - w * 0.22, y + h / 2 + h * 0.14, w * 0.44, h * 0.04, 6, '#232327');
  }
  const b = w * 0.022;
  fillRR(ctx, x - w / 2 - b, y - h / 2 - b, w + 2 * b, h + 2 * b, b * 0.8, '#111114', '#000', 2);
  ctx.save();
  ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.clip();
  if (typeof content === 'function') { ctx.translate(x - w / 2, y - h / 2); content(ctx, w, h); }
  else if (content) ctx.drawImage(content, x - w / 2, y - h / 2, w, h);
  ctx.restore();
  // reflexo
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  poly(ctx, [x - w / 2, y - h / 2, x - w * 0.1, y - h / 2, x - w * 0.35, y + h / 2, x - w / 2, y + h / 2]);
  ctx.fill();
  circle(ctx, x + w / 2 - b * 0.6, y + h / 2 + b * 0.5, b * 0.18, o.ledColor || '#e33');
  ctx.restore();
}

// ---------------------------------------------------------------- avião
function drawPlane(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  // asa traseira
  poly(ctx, [-10, 4, 30, 2, -40, 70, -62, 70], '#cfd8e3', '#6d7a8a', 2);
  // fuselagem
  ctx.beginPath();
  ctx.moveTo(-190, -10); ctx.quadraticCurveTo(-170, -30, -120, -26); ctx.lineTo(150, -24);
  ctx.quadraticCurveTo(205, -20, 210, 2); ctx.quadraticCurveTo(205, 22, 150, 24); ctx.lineTo(-150, 22);
  ctx.quadraticCurveTo(-190, 16, -190, -10); ctx.closePath();
  ctx.fillStyle = '#f6f8fb'; ctx.fill(); ctx.strokeStyle = '#6d7a8a'; ctx.lineWidth = 2.5; ctx.stroke();
  fillRR(ctx, -150, 6, 330, 8, 4, '#2f7fd1');
  // cauda
  poly(ctx, [-150, -22, -185, -95, -160, -95, -110, -24], '#2f7fd1', '#24588f', 2);
  for (let i = 0; i < 12; i++) fillRR(ctx, -100 + i * 21, -12, 11, 11, 4, '#7fb3e6');
  poly(ctx, [178, -14, 196, -6, 182, -4], '#5d7894');
  // asa
  poly(ctx, [-20, 6, 40, 6, -40, -70, -70, -70], '#e3e9f0', '#6d7a8a', 2);
  ctx.restore();
}

// ---------------------------------------------------------------- calendário (sem texto)
const COR_MESES = ['#e2575f', '#4f9bd9', '#58b368', '#f0a43a'];
function drawCalendarPage(ctx, x, y, w, color, heartDay) {
  const h = w * 1.05;
  fillRR(ctx, x - w / 2, y, w, h, 16, '#fffdf8', 'rgba(0,0,0,0.25)', 3);
  ctx.save(); rr(ctx, x - w / 2, y, w, h, 16); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(x - w / 2, y, w, h * 0.22);
  ctx.restore();
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
    const cx = x - w * 0.4 + c * w * 0.133, cy = y + h * 0.3 + r * h * 0.135;
    const idx = r * 7 + c;
    if (idx === heartDay) heart(ctx, cx + w * 0.04, cy + h * 0.045, w * 0.1, '#e8405f');
    else fillRR(ctx, cx, cy, w * 0.08, h * 0.09, 4, idx % 7 === 0 ? 'rgba(226,87,95,0.35)' : 'rgba(80,80,90,0.18)');
  }
}

// ---------------------------------------------------------------- moto e motoboy
function drawMotorbike(ctx, x, y, s, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s);
  for (const wx of [-80, 85]) { circle(ctx, wx, -32, 32, '#1d1d20'); circle(ctx, wx, -32, 15, '#9aa0a8'); circle(ctx, wx, -32, 5, '#333'); }
  poly(ctx, [-90, -55, -30, -78, 40, -78, 70, -60, 90, -40, 40, -42, -40, -42], '#d8432f', '#5a160c', 3);
  fillRR(ctx, -55, -95, 70, 18, 8, '#1d1d20');
  line(ctx, 70, -60, 95, -110, '#444', 6); line(ctx, 82, -110, 110, -110, '#222', 7);
  circle(ctx, 112, -86, 9, '#ffe9a8', '#666', 2);
  fillRR(ctx, -125, -150, 80, 70, 8, '#f07a1a', '#7a3a08', 3);
  ctx.restore();
}
// Motoboy simples (capacete com viseira). (x,y) = pés; h = altura
// armOut 0..1 estende os braços (entregando); returns posição das mãos
function drawMotoboy(ctx, x, y, h, o = {}) {
  const s = h / 100;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip || 1), s);
  const bob = o.bob || 0; ctx.translate(0, -bob);
  // mochila térmica
  fillRR(ctx, -16, -74, 32, 30, 3, '#f07a1a', '#3a1c0c', 0.6);
  // pernas
  const lift = o.walk != null ? Math.sin(o.walk) * 3 : 0;
  strokePolyM(ctx, [-5, -38, -5.5, -4 - Math.max(0, lift)], 8.5, '#3d4046');
  strokePolyM(ctx, [5, -38, 5.5, -4 - Math.max(0, -lift)], 8.5, '#3d4046');
  fillRR(ctx, -10.5, -6 - Math.max(0, lift), 10, 7, 2, '#1b1b1e'); fillRR(ctx, 0.5, -6 - Math.max(0, -lift), 10, 7, 2, '#1b1b1e');
  // tronco (jaqueta)
  fillRR(ctx, -12, -66, 24, 30, 5, '#d8432f', '#3a1c0c', 0.6);
  fillRR(ctx, -12, -50, 24, 2.4, 0, '#eeeee4');
  line(ctx, 0, -64, 0, -38, 'rgba(0,0,0,0.3)', 0.6);
  // braços
  const k = o.armOut || 0;
  const hands = [];
  for (const sx of [-1, 1]) {
    const shx = sx * 11, shy = -62;
    const hx = lerp(sx * 14, sx * 6 + 15, k), hy = lerp(-40, -52, k);
    const ex = lerp(sx * 14, sx * 9 + 6, k), ey = lerp(-51, -55, k);
    strokePolyM(ctx, [shx, shy, ex, ey, hx, hy], 6.5, '#d8432f');
    circle(ctx, hx, hy, 3.4, '#26262b', '#000', 0.5);
    hands.push([hx, hy]);
  }
  // capacete
  ctx.save(); ctx.translate(0, -79); ctx.rotate(o.nod || 0);
  fillRR(ctx, -4, 8, 8, 6, 2, '#3a2a20');
  circle(ctx, 0, 0, 13.5, '#d8432f', '#3a1c0c', 0.7);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, TAU); ctx.clip();
  fillRR(ctx, -10, -4, 20, 10, 4, '#2b2f38');
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-10, -4, 8, 10);
  fillRR(ctx, -16, 8, 32, 8, 0, '#b6321f');
  ctx.restore();
  ellipse(ctx, -5, -8, 4, 2, -0.5, 'rgba(255,255,255,0.45)');
  ctx.restore();
  ctx.restore();
  // centro entre as mãos no mundo
  const mx = x + (o.flip || 1) * s * (hands[0][0] + hands[1][0]) / 2, my = y - bob * s + s * (hands[0][1] + hands[1][1]) / 2;
  return { hand: [mx, my] };
}
function strokePolyM(ctx, pts, w, color) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = '#2a1206'; ctx.lineWidth = w + 1.2; ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
}
