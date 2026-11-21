'use strict';
// =====================================================================
//  Linha do tempo: 10 cenas, 180 s. Todos os tempos são ABSOLUTOS
//  (em segundos do filme), iguais aos do roteiro.
// =====================================================================
const SHOTS = [];
function shot(t0, t1, draw, xf = 0.45) { SHOTS.push({ t0, t1, draw, xf }); }

// ---------------------------------------------------------------- ajudantes
function hop(T, t0, t1, x0, x1, rate = 2.6, amp = 16) {
  const p = clamp((T - t0) / (t1 - t0));
  const moving = T > t0 && T < t1;
  const ph = (clamp(T, t0, t1) - t0) * rate * Math.PI;
  return { x: lerp(x0, x1, p), bob: moving ? Math.abs(Math.sin(ph)) * amp : 0, lean: moving ? Math.sin(ph) * 0.045 : 0 };
}
const breathe = (T, k = 1) => Math.sin(T * 1.7) * 2.5 * k;
function inHalf(ctx, side, fn) { // tela dividida: side 0 = esquerda, 1 = direita
  ctx.save();
  ctx.beginPath(); ctx.rect(side * W / 2, 0, W / 2, H); ctx.clip();
  ctx.translate(side ? W / 4 : -W / 4, 0);
  fn(ctx);
  ctx.restore();
}
function divisor(ctx, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 4, 0, 8, H);
  glow(ctx, W / 2, H / 2, 400, '#ffffff', 0.25);
  ctx.restore();
}
// celular segurado na beira do cobertor (traseira para a câmera)
function celularNaCama(ctx, T, key, x, y, o = {}) {
  const ty = o.typing ? 1 : 0;
  const jx = o.vibra ? Math.sin(T * 70) * 4 : 0;
  drawPhone(ctx, x + jx, y - 45, 66, o.rot == null ? 0.06 : o.rot, { back: true, glow: (o.glow == null ? 0.45 : o.glow) * 0.35, glowColor: '#cfe8ff' });
  paw(ctx, x - 40, y - 20 + ty * Math.sin(T * 24) * 4, 24, key, 0.4);
  paw(ctx, x + 40, y - 20 + ty * Math.cos(T * 27) * 4, 24, key, -0.4);
}
// ícones que saem do celular (coração, carinha) — sem texto
function popIcons(ctx, T, times, x, y, seed = 1) {
  times.forEach((t0, i) => {
    const age = T - t0; if (age < 0 || age > 1.6) return;
    const k = age / 1.6;
    const px = x + 190 + (rnd(seed + i) - 0.5) * 80, py = y - 60 - easeOut(k) * 200;
    ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * 1.2 > 1 ? 1 : Math.sin(k * Math.PI) * 1.2;
    const s = 46 * easeOutBack(Math.min(1, age * 4));
    fillRR(ctx, px - s * 0.75, py - s * 0.6, s * 1.5, s * 1.2, s * 0.35, '#ffffff', 'rgba(0,0,0,0.15)', 2);
    const kind = Math.floor(rnd(seed * 7 + i) * 3);
    if (kind === 0) heart(ctx, px, py, s * 0.7, '#e8405f');
    else if (kind === 1) { circle(ctx, px, py, s * 0.36, '#f7c843'); circle(ctx, px - s * 0.12, py - s * 0.08, s * 0.05, '#5a3a10'); circle(ctx, px + s * 0.12, py - s * 0.08, s * 0.05, '#5a3a10'); ctx.beginPath(); ctx.arc(px, py + s * 0.02, s * 0.18, 0.2, Math.PI - 0.2); ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = s * 0.05; ctx.stroke(); }
    else { for (let j = 0; j < 3; j++) circle(ctx, px - s * 0.3 + j * s * 0.3, py, s * 0.09, '#7a8a9a'); }
    ctx.restore();
  });
}
function phoneFlat(ctx, T, x, y, lit, vib = 0) {
  const jx = vib ? Math.sin(T * 80) * 3 : 0;
  if (lit) glow(ctx, x + jx, y - 30, 160, '#bfe3ff', 0.7 * lit);
  fillRR(ctx, x - 42 + jx, y - 9, 84, 14, 5, '#17181c', '#000', 2);
  if (lit) fillRR(ctx, x - 38 + jx, y - 9, 76, 4, 2, `rgba(190,227,255,${lit})`);
}

// =====================================================================
// CENA 1 — O ERRO E O AFASTAMENTO (0–18)
// =====================================================================
function cenaEle(ctx, T, o = {}) {
  quartoEle(ctx, T, { noite: o.noite !== false, chuva: o.chuva == null ? 0.8 : o.chuva });
  const out = naCama(ctx, 'm_branca', QUARTO_ELE.cx, QUARTO_ELE.blanket, 640, Object.assign({
    bob: breathe(T), blink: blinkAt(T, 1), glow: { color: '#9fd0ff', a: o.glow == null ? 0.55 : o.glow },
  }, o.face || {}));
  cobertorEle(ctx, T);
  if (o.phone !== false) celularNaCama(ctx, T, 'm_branca', QUARTO_ELE.cx, QUARTO_ELE.blanket, { typing: o.typing, vibra: o.vibra, glow: o.phoneGlow });
  return out;
}
function cenaEla(ctx, T, o = {}) {
  quartoEla(ctx, T, { noite: o.noite !== false, chuva: o.chuva == null ? 0.8 : o.chuva, estrelas: o.estrelas });
  const out = naCama(ctx, 'f_selecao', QUARTO_ELA.cx, QUARTO_ELA.blanket, 610, Object.assign({
    bob: breathe(T + 1), blink: blinkAt(T, 2), glow: { color: '#ffd0e6', a: o.glow == null ? 0.45 : o.glow },
  }, o.face || {}));
  cobertorEla(ctx, T);
  if (o.phone) celularNaCama(ctx, T, 'f_selecao', QUARTO_ELA.cx, QUARTO_ELA.blanket, { typing: o.typing, vibra: o.vibra, glow: o.phoneGlow });
  const ns = QUARTO_ELA.ns;
  if (o.phoneNS != null) phoneFlat(ctx, T, ns[0] + 70, ns[1] - 12, o.phoneNS, o.vibraNS);
  return out;
}

// 00:00–00:06 — chuva, câmera se aproxima da janela
shot(0, 6, (ctx, T) => {
  const z = lerp(1, 3.5, easeInOut(seg(T, 0.6, 5.4)));
  const wx = 960, wy = 520, ww = 540, wh = 304;
  ctx.save();
  camera(ctx, wx, wy, z);
  // céu noturno
  ctx.fillStyle = linGrad(ctx, 0, -200, 0, 1200, [[0, '#070b1c'], [1, '#1a2340']]); ctx.fillRect(-500, -500, W + 1000, H + 1000);
  // interior pela janela
  ctx.save(); ctx.beginPath(); ctx.rect(wx - ww / 2, wy - wh / 2, ww, wh); ctx.clip();
  ctx.translate(wx - ww / 2, wy - wh / 2); ctx.scale(ww / W, wh / H);
  ctx.save(); camera(ctx, 1000, 560, lerp(1.0, 1.08, seg(T, 4, 6)));
  cenaEle(ctx, T, { chuva: 0.6, face: { sad: 0.8, mouth: 'sad', headTilt: 0.05, headDY: 14 } });
  ctx.restore();
  ctx.restore();
  // parede do prédio com o buraco da janela
  ctx.beginPath(); ctx.rect(-600, -600, W + 1200, H + 1200); ctx.rect(wx - ww / 2, wy - wh / 2, ww, wh);
  ctx.fillStyle = '#232a44'; ctx.fill('evenodd');
  ctx.save(); ctx.beginPath(); ctx.rect(-600, -600, W + 1200, H + 1200); ctx.rect(wx - ww / 2, wy - wh / 2, ww, wh); ctx.clip('evenodd');
  for (let r = 0; r < 40; r++) for (let c = 0; c < 30; c++) {
    const bx = c * 90 - 400 + (r % 2) * 45, by = r * 40 - 300;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, 90, 40);
  }
  // outras janelas
  for (const [x, y, lit] of [[300, 200, 0], [1620, 200, 1], [300, 820, 1], [1620, 820, 0], [960, 1000, 0], [960, 40, 1]]) {
    fillRR(ctx, x - 150, y - 85, 300, 170, 4, lit ? '#e8b766' : '#141a2e', '#cfd3dc', 10);
    if (lit) glow(ctx, x, y, 260, '#ffcf7a', 0.25);
  }
  ctx.restore();
  // moldura e luz que sai da janela
  ctx.strokeStyle = '#d7dbe3'; ctx.lineWidth = 14; ctx.strokeRect(wx - ww / 2, wy - wh / 2, ww, wh);
  fillRR(ctx, wx - ww / 2 - 26, wy + wh / 2, ww + 52, 18, 4, '#d7dbe3');
  glow(ctx, wx, wy, 520, '#ffcf8a', 0.18);
  // gotas no vidro
  ctx.save(); ctx.beginPath(); ctx.rect(wx - ww / 2, wy - wh / 2, ww, wh); ctx.clip();
  for (let i = 0; i < 40; i++) {
    const gx = wx - ww / 2 + rnd(i) * ww, gy = wy - wh / 2 + ((rnd(i + 3) * wh + T * (6 + rnd(i) * 20)) % wh);
    ellipse(ctx, gx, gy, 2.5, 3.5, 0, 'rgba(210,230,255,0.45)');
  }
  ctx.restore();
  ctx.restore();
  rain(ctx, T, { alpha: lerp(0.75, 0.25, seg(T, 3, 6)), count: 300 });
  fade(ctx, 1 - seg(T, 0, 1.2));
}, 0);

// 00:06–00:10.2 — ela, magoada, no quarto dela
shot(6, 10.2, (ctx, T) => {
  ctx.save(); camera(ctx, 900, 560, lerp(1.08, 1.2, seg(T, 6, 10.2)));
  const sigh = Math.sin(seg(T, 8.4, 9.8) * Math.PI);
  cenaEla(ctx, T, {
    phone: true, phoneGlow: 0.5,
    face: { sad: 0.75, mouth: 'sad', sparkle: 0.5, headTilt: -0.05, headDY: 12, bob: breathe(T + 1) + sigh * 12, blink: Math.max(blinkAt(T, 2), seg(T, 8.9, 9.1) - seg(T, 9.6, 9.8)) },
  });
  ctx.restore();
  rain(ctx, T, { alpha: 0.12, count: 80 });
});
// 00:10.2–00:12 — ela deixa o celular ao lado da cama (close no criado-mudo)
function insertCriado(ctx, T, phonePos, pawOn, lit = 0) {
  ctx.save(); camera(ctx, QUARTO_ELA.ns[0] + 60, QUARTO_ELA.ns[1] - 40, 2.6);
  quartoEla(ctx, T, { noite: true, chuva: 0.6 });
  const [px, py] = phonePos;
  phoneFlat(ctx, T, px, py, lit);
  if (pawOn > 0.01) {
    const ax = lerp(QUARTO_ELA.ns[0] - 200, px - 20, pawOn), ay = lerp(QUARTO_ELA.ns[1] + 60, py - 6, pawOn);
    arm(ctx, 'f_selecao', QUARTO_ELA.ns[0] - 330, QUARTO_ELA.ns[1] + 230, ax, ay, 44, 0.25);
  }
  ctx.restore();
}
shot(10.2, 12, (ctx, T) => {
  const ns = QUARTO_ELA.ns;
  const k = eio(T, 10.3, 11.2);
  const px = lerp(ns[0] - 120, ns[0] + 70, k), py = lerp(ns[1] + 40, ns[1] - 12, k) - Math.sin(k * Math.PI) * 50;
  const pawOn = T < 11.3 ? 1 : 1 - eio(T, 11.3, 11.9);
  insertCriado(ctx, T, [px, py], pawOn, 0);
});
// 00:12–00:16.4 — ele digita, apaga, digita de novo e envia
function digitado(T) {
  if (T < 12.3) return 0;
  if (T < 13.5) return Math.floor(seg(T, 12.3, 13.5) * 14);
  if (T < 14.1) return 14;
  if (T < 14.8) return Math.ceil((1 - seg(T, 14.1, 14.8)) * 14);
  if (T < 15.3) return 0;
  if (T < 16.0) return Math.floor(seg(T, 15.3, 16.0) * 14);
  return T < 16.1 ? 14 : 0;
}
shot(12, 16.4, (ctx, T) => {
  ctx.fillStyle = linGrad(ctx, 0, 0, W, H, [[0, '#1b2140'], [1, '#0c1024']]); ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) glow(ctx, rnd(i + 5) * W, rnd(i + 9) * H, 90 + rnd(i) * 120, i % 3 ? '#4a6ab0' : '#ffb870', 0.25);
  const typing = (T > 12.3 && T < 13.5) || (T > 15.3 && T < 16.0);
  const deleting = T > 14.1 && T < 14.8;
  const sent = T > 16.05;
  const bubbles = [{ me: false, len: 0.7 }, { me: true, len: 0.35 }, { me: false, len: 0.9 }, { me: false, len: 0.4 }];
  if (sent) bubbles.push({ me: true, len: 0.95, pop: seg(T, 16.05, 16.35) });
  const key = typing ? Math.floor(rnd(Math.floor(T * 11)) * 27) : deleting ? 98 : (T > 15.95 && T < 16.1 ? -1 : null);
  const y = 560 + Math.sin(T * 1.3) * 5;
  drawPhone(ctx, 960, y, 430, -0.02, {
    glow: 0.25,
    screen: (c, w, h) => chatScreen(c, w, h, { avatar: 'f', typed: digitado(T), cursor: Math.floor(T * 2.5) % 2 === 0, key, send: T > 15.95 && T < 16.15 ? 1 : 0, bubbles }),
  });
  // patinhas segurando e digitando
  const tapL = typing ? Math.max(0, Math.sin(T * 22)) * 30 : 0, tapR = typing ? Math.max(0, Math.sin(T * 22 + 1.6)) * 30 : 0;
  const delR = deleting ? Math.max(0, Math.sin(T * 18)) * 30 : 0;
  const sendR = T > 15.9 && T < 16.2 ? 40 : 0;
  arm(ctx, 'm_branca', 640, 1180, 790 + tapL * 0.6, 900 - tapL, 64, 0);
  arm(ctx, 'm_branca', 1280, 1180, 1135 - tapR * 0.5 + (deleting ? 60 : 0) + sendR, 900 - tapR - delR - sendR * 1.5, 64, 0);
  vignette(ctx, 0.5);
}, 0.3);
// 00:16.4–00:18 — o celular dela acende
shot(16.4, 18, (ctx, T) => {
  ctx.save(); camera(ctx, 1000, 560, 1.12);
  const lit = T > 16.5 ? 1 : 0;
  cenaEla(ctx, T, {
    phoneNS: lit, vibraNS: T > 16.5 && T < 17.3,
    face: { sad: lerp(0.7, 0.3, seg(T, 16.9, 17.4)), mouth: T > 17 ? 'o' : 'sad', open: 0.6, headTilt: lerp(-0.04, 0.09, eio(T, 16.8, 17.4)), headDY: 10, glow: { color: '#bfe3ff', a: 0.4 * lit } },
  });
  ctx.restore();
});

// =====================================================================
// CENA 2 — A RECONCILIAÇÃO (18–36)
// =====================================================================
shot(18, 19.3, (ctx, T) => {
  const ns = QUARTO_ELA.ns;
  const k = eio(T, 18.5, 19.2);
  const px = lerp(ns[0] + 70, ns[0] - 160, k), py = lerp(ns[1] - 12, ns[1] + 60, k) - Math.sin(k * Math.PI) * 40;
  const pawOn = T < 18.5 ? eio(T, 18.0, 18.5) : 1;
  insertCriado(ctx, T, [px, py], pawOn, 1);
});
shot(19.3, 24, (ctx, T) => {
  ctx.save(); camera(ctx, 870, 560, lerp(1.15, 1.35, seg(T, 19.3, 24)));
  const think = T < 22.4;
  cenaEla(ctx, T, {
    phone: true, typing: !think, phoneGlow: 0.6, chuva: 0.4,
    face: {
      mouth: T < 22.8 ? 'flat' : 'smile', sad: think ? 0.25 : 0,
      headTilt: think ? Math.sin(T * 1.3) * 0.07 : -0.03, headDY: 12,
      glow: { color: '#bfe3ff', a: 0.6 }, blush: seg(T, 23, 24) * 0.5,
    },
  });
  ctx.restore();
});
shot(24, 27, (ctx, T) => {
  ctx.save(); camera(ctx, 1000, 520, lerp(1.2, 1.5, eio(T, 24, 27)));
  const happy = seg(T, 25.1, 25.6);
  const m = T < 25.1 ? 'sad' : T < 25.6 ? 'o' : T < 26.2 ? 'smile' : 'laugh';
  cenaEle(ctx, T, {
    chuva: 0.4, vibra: T > 24.6 && T < 25.2, phoneGlow: T > 24.6 ? 0.9 : 0.4,
    face: { sad: 0.8 * (1 - happy), mouth: m, open: 0.7, sparkle: happy, blush: seg(T, 25.8, 26.6) * 0.7,
      headDY: lerp(14, 0, happy), bob: breathe(T) + (T > 26.2 ? Math.abs(Math.sin((T - 26.2) * 9)) * 14 : 0),
      happyEyes: T > 26.3 ? 1 : 0, glow: { color: '#bfe3ff', a: 0.4 + 0.5 * seg(T, 24.6, 25) } },
  });
  ctx.restore();
});
// 00:27–00:33 — tela dividida, os dois conversando, rindo
function splitConversa(ctx, T, t0, laughFrom) {
  const laugh = T > laughFrom;
  const shake = laugh ? Math.abs(Math.sin(T * 14)) * 10 : 0;
  inHalf(ctx, 0, (c) => {
    c.save(); camera(c, 1000, 560, 1.25);
    cenaEle(c, T, { chuva: 0.2, phoneGlow: 0.7, typing: !laugh, face: { mouth: laugh ? 'laugh' : 'smile', happyEyes: laugh ? 1 : 0, open: 0.8, bob: breathe(T) + shake, blush: 0.5, glow: { color: '#bfe3ff', a: 0.5 } } });
    popIcons(c, T, [t0 + 0.8, t0 + 2.4, t0 + 4.0, t0 + 5.6], QUARTO_ELE.cx, QUARTO_ELE.blanket - 60, 3);
    c.restore();
  });
  inHalf(ctx, 1, (c) => {
    c.save(); camera(c, 860, 560, 1.25);
    cenaEla(c, T, { chuva: 0.2, phone: true, phoneGlow: 0.7, typing: !laugh, face: { mouth: laugh ? 'laugh' : 'smile', happyEyes: laugh ? 1 : 0, open: 0.8, bob: breathe(T + 1) + (laugh ? Math.abs(Math.sin(T * 14 + 1)) * 10 : 0), blush: 0.6, glow: { color: '#bfe3ff', a: 0.5 } } });
    popIcons(c, T, [t0 + 1.6, t0 + 3.2, t0 + 4.8], QUARTO_ELA.cx, QUARTO_ELA.blanket - 60, 9);
    c.restore();
  });
}
shot(27, 33, (ctx, T) => {
  const wipe = eio(T, 27, 27.6);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, lerp(W, W / 2, wipe), H); ctx.clip();
  if (wipe < 1) { ctx.save(); camera(ctx, 1000, 520, 1.5); cenaEle(ctx, T, { chuva: 0.3, face: { mouth: 'smile', sparkle: 0.6, blush: 0.5 } }); ctx.restore(); }
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(lerp(W, W / 2, wipe), 0, W, H); ctx.clip();
  splitConversa(ctx, T, 27, 30);
  ctx.restore();
  if (wipe >= 1) splitConversa(ctx, T, 27, 30);
  divisor(ctx, wipe);
});
// 00:33–00:36 — deitados, felizes (vista de cima)
function deitado(ctx, T, key, cx, o = {}) {
  const P = PERS[key], h = 760, s = h / ALTURA_IMG;
  const headY = 300;
  const feetY = headY + (P.feet - (P.eyes[0][1] + P.mouth[1]) / 2) * s;
  const blanketY = feetY - (P.feet - (P.neck + 110)) * s;
  camaTopo(ctx, T, cx, 560, null, o.trav, { lencol: o.lencol, chao: o.chao });
  drawChar(ctx, key, Object.assign({ x: cx, y: feetY, h, crop: P.neck + 160, shadow: false, blink: blinkAt(T, o.seed || 4) }, o.face || {}));
  cobertorTopo(ctx, cx, blanketY, o.cor);
  return { blanketY, headY };
}
shot(33, 36, (ctx, T) => {
  inHalf(ctx, 0, (c) => {
    c.save(); camera(c, 960, 560, 1.0, -0.05);
    const r = deitado(c, T, 'm_branca', 960, { cor: '#3f6496', chao: '#1d2640', seed: 5, face: { mouth: 'smile', blush: 0.5, glow: { color: '#bfe3ff', a: 0.5 }, headTilt: -0.08 } });
    drawPhone(c, 1170, 330, 110, 0.35, { back: true, glow: 0.7 });
    paw(c, 1150, 410, 34, 'm_branca', 0.2);
    c.restore();
  });
  inHalf(ctx, 1, (c) => {
    c.save(); camera(c, 960, 560, 1.0, 0.05);
    const hugk = eio(T, 34.5, 35.2);
    const r = deitado(c, T, 'f_selecao', 960, { cor: '#e98aa9', chao: '#2b2040', seed: 6, face: { mouth: hugk > 0.5 ? 'smile' : 'smile', happyEyes: hugk, blush: 0.4 + hugk * 0.5, glow: { color: '#ffd0e6', a: 0.5 }, headTilt: 0.08 } });
    const px = lerp(760, 960, hugk), py = lerp(330, r.blanketY - 10, hugk);
    drawPhone(c, px, py, 110, lerp(-0.35, 0, hugk), { back: true, glow: 0.7 * (1 - hugk * 0.6) });
    paw(c, px + 10, py + 70, 34, 'f_selecao', -0.2);
    if (hugk > 0.2) floatHearts(c, T, 34.8, 36, px, py - 40, { n: 6, size: 34, seed: 21 });
    c.restore();
  });
  divisor(ctx);
});

// =====================================================================
// CENA 3 — A SURPRESA DOS LÍRIOS E O CARTÃO (36–60)
// =====================================================================
const ELA_H = 560;
function anelCampainha(ctx, T, t0) {
  const age = T - t0; if (age < 0 || age > 1.4) return;
  const [x, y, w, h] = SALA.porta;
  for (let i = 0; i < 3; i++) {
    const k = (age * 1.6 - i * 0.25); if (k < 0 || k > 1) continue;
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(x - 60, y + h * 0.45, 20 + k * 70, -0.9, 0.9); ctx.strokeStyle = '#f2b43a'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 60, y + h * 0.45, 20 + k * 70, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
    ctx.restore();
  }
}
shot(36, 40.8, (ctx, T) => {
  ctx.save(); camera(ctx, 960, 560, lerp(1.0, 1.06, seg(T, 36, 40.8)));
  sala(ctx, T, 0);
  anelCampainha(ctx, T, 36.8);
  const w = hop(T, 38.0, 40.6, 760, 1250, 2.8, 22);
  const curious = seg(T, 37.0, 37.5);
  drawChar(ctx, 'f_selecao', { x: w.x, y: 900, h: ELA_H, bob: w.bob + breathe(T) * (T < 38 ? 1 : 0), lean: w.lean,
    blink: blinkAt(T, 7), headTilt: lerp(0, 0.12, curious), mouth: T > 37.0 && T < 38.2 ? 'o' : 'smile', open: 0.7, sad: 0 });
  ctx.restore();
});
function buqueNoPeito(out, dy = 70) { return [out.chest.x, out.chest.y + dy]; }
shot(40.8, 46, (ctx, T) => {
  ctx.save(); camera(ctx, 1430, 560, 1.5);
  const open = eio(T, 41.0, 41.9);
  const armOut = eio(T, 43.6, 44.6) * (1 - eio(T, 45.3, 45.8));
  const leave = hop(T, 45.8, 46.6, 0, 160, 2.6, 10);
  let mb = null;
  sala(ctx, T, open, { fora: (c) => {
    drawMotorbike(c, 1680, 790, 0.9, -1);
    mb = drawMotoboy(c, 1590 + leave.x, 842 - leave.bob, 430, { armOut, nod: Math.sin(seg(T, 45.3, 45.9) * Math.PI) * 0.25 });
  } });
  const surprised = T > 41.6;
  const out = drawChar(ctx, 'f_selecao', { x: 1250, y: 900, h: ELA_H, bob: breathe(T), blink: blinkAt(T, 7),
    headTilt: 0.1, mouth: T < 44.9 ? (surprised ? 'o' : 'smile') : 'laugh', open: 0.8, sparkle: seg(T, 44.6, 45.2) });
  // buquê: do motoboy para ela
  const bh = 330;
  const from = mb ? mb.hand : [1560, 640];
  const to = buqueNoPeito(out);
  const k = eio(T, 44.5, 45.2);
  const bx = lerp(from[0] - 10, to[0], k), by = lerp(from[1] - 60, to[1], k);
  const scaleB = lerp(0.85, 1, k);
  if (T < 44.5 && open < 0.5) { /* buquê escondido atrás da porta */ }
  else drawBouquet(ctx, bx, by, bh * scaleB, lerp(-0.15, 0.05, k));
  if (k >= 1) { paw(ctx, bx - 70, by + 70, 26, 'f_selecao', 0.3); paw(ctx, bx + 70, by + 70, 26, 'f_selecao', -0.3); }
  ctx.restore();
});
shot(46, 51, (ctx, T) => {
  ctx.save(); camera(ctx, 1200, 600, lerp(1.5, 1.7, seg(T, 46, 51)));
  sala(ctx, T, 1, { fora: () => {} });
  const jump = T > 47.0 && T < 48.6 ? Math.abs(Math.sin((T - 47.0) / 1.6 * 3 * Math.PI)) * 80 : 0;
  const sp = seg(T, 48.8, 50.4);
  const stretch = T > 48.8 && T < 50.4 ? Math.cos(sp * 2 * TAU) : 1;
  const st = Math.abs(stretch) < 0.04 ? 0.04 * Math.sign(stretch || 1) : stretch;
  const x = 1250;
  const out = drawChar(ctx, 'f_selecao', { x, y: 900, h: ELA_H, bob: jump + breathe(T), stretchX: st, squash: jump > 0 ? 1 + jump * 0.0006 : 1,
    blink: blinkAt(T, 7), mouth: T < 46.8 ? 'o' : 'laugh', open: 0.9, sparkle: 1, blush: 0.8, happyEyes: T > 48.6 ? 1 : 0 });
  const hug = eio(T, 48.5, 48.8);
  const [bx, by] = buqueNoPeito(out, lerp(70, 40, hug));
  ctx.save(); ctx.translate(x, 0); ctx.scale(st, 1); ctx.translate(-x, 0);
  drawBouquet(ctx, bx, by, 330 * lerp(1, 0.95, hug), 0.05 * Math.sin(T * 3));
  paw(ctx, bx - lerp(70, 40, hug), by + lerp(70, 40, hug), 26, 'f_selecao', 0.3);
  paw(ctx, bx + lerp(70, 40, hug), by + lerp(70, 40, hug), 26, 'f_selecao', -0.3);
  ctx.restore();
  sparkles(ctx, T, 46.8, 50.6, x, 560, { n: 26, spread: 520, size: 22 });
  floatHearts(ctx, T, 47, 50.8, x, 520, { n: 12, spread: 360, size: 40, seed: 31 });
  ctx.restore();
});
shot(51, 53.2, (ctx, T) => {
  ctx.save(); camera(ctx, 1250, 520, lerp(2.0, 2.3, seg(T, 51, 53.2)));
  sala(ctx, T, 1, { fora: () => {} });
  const look = eio(T, 51.0, 51.5) * (1 - eio(T, 52.6, 53.1));
  const out = drawChar(ctx, 'f_selecao', { x: 1250, y: 900, h: ELA_H, bob: breathe(T), blink: blinkAt(T, 8),
    headDY: look * 26, headTilt: look * 0.06, mouth: 'smile', sparkle: 0.6, blush: 0.6 });
  const [bx, by] = buqueNoPeito(out, 45);
  drawBouquet(ctx, bx, by, 330, 0.03, { card: T < 51.8 });
  paw(ctx, bx - 60, by + 60, 26, 'f_selecao', 0.3);
  if (T >= 51.8) {
    const k = eio(T, 51.8, 52.8);
    const cx0 = bx + 330 * 0.66 * 0.17 * (1199 / 1312) / 0.66, cy0 = by + 330 * 0.2;
    const cx = lerp(cx0, out.head.x + 110, k), cy = lerp(cy0, out.head.y + 150, k);
    drawSmallCard(ctx, cx, cy, lerp(53, 80, k), lerp(0.18, -0.1, k));
    paw(ctx, cx + 30, cy + 22, 22, 'f_selecao', -0.5);
  } else paw(ctx, bx + 60, by + 60, 26, 'f_selecao', -0.3);
  ctx.restore();
});
// 00:53.2–00:57.6 — close do cartão (texto exato)
shot(53.2, 57.6, (ctx, T) => {
  ctx.fillStyle = linGrad(ctx, 0, 0, W, H, [[0, '#f3d9b5'], [1, '#d9a878']]); ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) glow(ctx, rnd(i + 40) * W, rnd(i + 60) * H, 120 + rnd(i) * 160, i % 2 ? '#fff3d0' : '#ffd0b0', 0.35);
  const open = eio(T, 53.4, 54.3);
  const zk = eio(T, 54.2, 55.2);
  ctx.save();
  camera(ctx, lerp(960, 1335, zk), lerp(560, 585, zk), lerp(1.0, 1.5, zk) * (1 + seg(T, 55.2, 57.6) * 0.02));
  drawCardOpen(ctx, 960, 560, 1500, open);
  paw(ctx, 1712, 770, 62, 'f_selecao', -1.2);
  paw(ctx, 208, 770, 62, 'f_selecao', 1.2);
  ctx.restore();
  vignette(ctx, 0.35);
}, 0.4);
// 00:57.6–01:00 — reação: cartão no coração, abraça o buquê
shot(57.6, 60, (ctx, T) => {
  ctx.save(); camera(ctx, 1250, 470, lerp(2.0, 2.6, eio(T, 57.6, 60)));
  sala(ctx, T, 1, { fora: () => {} });
  const hugB = eio(T, 58.6, 59.2);
  const out = drawChar(ctx, 'f_selecao', { x: 1250, y: 900, h: ELA_H, bob: breathe(T), blink: blinkAt(T, 9),
    mouth: 'smile', sparkle: 1, tear: T > 57.9 ? (T - 57.9) / 1.6 : 0, blush: 0.9, happyEyes: T > 59.0 ? 1 : 0, headTilt: Math.sin(T * 1.5) * 0.04 });
  const [bx, by] = buqueNoPeito(out, lerp(80, 40, hugB));
  drawBouquet(ctx, bx, by, 330 * lerp(1, 0.96, hugB), 0.02, { card: false });
  const ck = eio(T, 57.7, 58.4);
  const cx = lerp(out.head.x + 110, out.chest.x - 30, ck), cy = lerp(out.head.y + 150, out.chest.y - 20, ck);
  drawSmallCard(ctx, cx, cy, 80, -0.1);
  paw(ctx, cx + 20, cy + 20, 22, 'f_selecao', -0.4);
  paw(ctx, bx - lerp(60, 40, hugB), by + lerp(60, 40, hugB), 26, 'f_selecao', 0.3);
  floatHearts(ctx, T, 58.2, 60, out.head.x, out.head.y - 40, { n: 8, spread: 260, size: 28, seed: 41 });
  ctx.restore();
});

// =====================================================================
// CENA 4 — TRÊS MESES DE WHATSAPP (60–75)
// =====================================================================
shot(60, 63, (ctx, T) => {
  inHalf(ctx, 0, (c) => {
    c.save(); camera(c, 1000, 540, 1.3);
    cenaEle(c, T, { noite: false, chuva: 0, phoneGlow: 0.3, typing: true, face: { mouth: 'smile', blush: 0.4, glow: { color: '#bfe3ff', a: 0.3 } } });
    popIcons(c, T, [60.4, 61.6, 62.6], QUARTO_ELE.cx, QUARTO_ELE.blanket - 60, 13);
    c.restore();
  });
  inHalf(ctx, 1, (c) => {
    c.save(); camera(c, 860, 540, 1.3);
    cenaEla(c, T, { noite: false, chuva: 0, phone: true, phoneGlow: 0.3, typing: true, face: { mouth: T > 61.5 && T < 62.4 ? 'laugh' : 'smile', open: 0.7, blush: 0.5, glow: { color: '#ffd0e6', a: 0.3 } } });
    popIcons(c, T, [61.0, 62.1], QUARTO_ELA.cx, QUARTO_ELA.blanket - 60, 17);
    c.restore();
  });
  divisor(ctx);
});
shot(63, 65, (ctx, T) => {
  // chamadas de vídeo: em cada lado, a tela do celular mostra o outro
  inHalf(ctx, 0, (c) => {
    c.fillStyle = '#a8cde4'; c.fillRect(0, 0, W, H);
    drawPhone(c, 960, 560, 400, -0.03, { screen: (s, w, h) => callScreen(s, w, h, 'f_selecao', T, { face: { mouth: 'laugh', open: 0.6 + 0.3 * Math.sin(T * 9), happyEyes: Math.sin(T * 4) > 0.3 ? 1 : 0, blush: 0.6 } }) });
    paw(c, 760, 900, 60, 'm_branca', 0.4); paw(c, 1160, 900, 60, 'm_branca', -0.4);
  });
  inHalf(ctx, 1, (c) => {
    c.fillStyle = '#f6dbe5'; c.fillRect(0, 0, W, H);
    drawPhone(c, 960, 560, 400, 0.03, { screen: (s, w, h) => callScreen(s, w, h, 'm_branca', T, { bg1: '#d6ecf8', bg2: '#a8cde4', face: { mouth: 'laugh', open: 0.6 + 0.3 * Math.sin(T * 8 + 1), happyEyes: Math.sin(T * 4 + 1) > 0.3 ? 1 : 0 } }) });
    paw(c, 760, 900, 60, 'f_selecao', 0.4); paw(c, 1160, 900, 60, 'f_selecao', -0.4);
  });
  divisor(ctx);
});
// 01:05–01:10 — passagem do tempo: dias e noites, três folhas do calendário
shot(65, 70, (ctx, T) => {
  const ph = (T - 65) / 5 * 3; // 3 ciclos
  const day = 0.5 + 0.5 * Math.cos(ph * TAU);
  ceu(ctx, T, mixColor('#0d1433', '#4aa3e8', day), mixColor('#2a2550', '#cdebff', day));
  const a = ph * TAU;
  sol(ctx, 960 - Math.sin(a) * 760, 760 - Math.cos(a) * 560, 60, '#fff2b0');
  circle(ctx, 960 + Math.sin(a) * 760, 760 + Math.cos(a) * 560, 50, '#fff7df');
  for (let i = 0; i < 40; i++) circle(ctx, rnd(i + 900) * W, rnd(i + 950) * 500, 1.8, `rgba(255,255,255,${(1 - day) * 0.8})`);
  // colinas e casinhas (dele à esquerda, dela à direita)
  ctx.fillStyle = mixColor('#1d3a2a', '#6fb36a', day);
  ctx.beginPath(); ctx.moveTo(0, 900); ctx.quadraticCurveTo(480, 760, 960, 880); ctx.quadraticCurveTo(1440, 1000, W, 820); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  for (const [hx, hy, cor] of [[300, 800, '#4f8fc9'], [1620, 790, '#f08aa5']]) {
    fillRR(ctx, hx - 90, hy - 110, 180, 130, 4, cor, 'rgba(0,0,0,0.3)', 3);
    poly(ctx, [hx - 110, hy - 110, hx + 110, hy - 110, hx, hy - 200], '#b5523b');
    fillRR(ctx, hx - 50, hy - 80, 40, 40, 3, day < 0.5 ? '#ffd27a' : '#cfe8ff');
    if (day < 0.5) glow(ctx, hx - 30, hy - 60, 90, '#ffd27a', 0.6 * (1 - day));
    fillRR(ctx, hx + 20, hy - 60, 36, 80, 3, '#6d4c35');
  }
  // mensagens viajando entre as casas
  for (let i = 0; i < 10; i++) {
    const k = ((T - 65) * 0.55 + i * 0.1) % 1;
    const dir = i % 2;
    const x = dir ? lerp(1600, 320, k) : lerp(320, 1600, k), y = 640 - Math.sin(k * Math.PI) * 300;
    ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI);
    heart(ctx, x, y, 34, i % 3 ? '#ff6f8f' : '#ffd36b');
    ctx.restore();
  }
  // calendário
  const tears = [66.0, 67.6, 69.2];
  const torn = tears.filter(t => T > t + 0.7).length;
  drawCalendarPage(ctx, 960, 170, 360, COR_MESES[Math.min(3, torn + 1)], 10 + torn * 5);
  const cur = tears.findIndex(t => T > t && T <= t + 0.7);
  if (cur >= 0) {
    const k = (T - tears[cur]) / 0.7;
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.translate(960 + k * 380, 170 + k * k * 420); ctx.rotate(k * 1.2);
    drawCalendarPage(ctx, 0, 0, 360, COR_MESES[cur], 10 + cur * 5);
    ctx.restore();
  } else if (torn < 3) drawCalendarPage(ctx, 960, 170, 360, COR_MESES[torn], 10 + torn * 5);
  // argolas
  for (let i = 0; i < 4; i++) fillRR(ctx, 960 - 120 + i * 80, 150, 14, 44, 7, '#8a8f99');
});
// 01:10–01:15 — sequência carinhosa
shot(70, 71.3, (ctx, T) => splitConversa(ctx, T, 69, 70));
shot(71.3, 72.6, (ctx, T) => {
  ctx.save(); camera(ctx, 860, 470, 2.2);
  cenaEla(ctx, T, { noite: false, chuva: 0, phone: true, phoneGlow: 0.5, face: { mouth: 'smile', sparkle: 0.7, blush: 0.8, headTilt: Math.sin(T * 2) * 0.06, glow: { color: '#ffd0e6', a: 0.5 } } });
  floatHearts(ctx, T, 71.4, 72.6, QUARTO_ELA.cx, 380, { n: 5, spread: 240, size: 30, seed: 51 });
  ctx.restore();
});
shot(72.6, 73.8, (ctx, T) => {
  ctx.save(); camera(ctx, 1000, 470, 2.0);
  const hit = T > 72.85;
  cenaEle(ctx, T, { noite: false, chuva: 0, vibra: T > 72.7 && T < 73.0, phoneGlow: hit ? 0.9 : 0.4,
    face: { mouth: hit ? 'laugh' : 'o', open: 0.8, sparkle: hit ? 1 : 0, happyEyes: T > 73.1 ? 1 : 0, bob: hit ? Math.abs(Math.sin((T - 72.85) * 9)) * 16 : 0, blush: 0.6, glow: { color: '#bfe3ff', a: 0.6 } } });
  ctx.restore();
});
shot(73.8, 75, (ctx, T) => {
  const sleep = eio(T, 73.9, 74.6);
  inHalf(ctx, 0, (c) => {
    c.save(); camera(c, 960, 560, 1.0, -0.05);
    deitado(c, T, 'm_branca', 960, { cor: '#3f6496', chao: '#141a30', seed: 5, face: { blink: sleep, mouth: 'smile', glow: { color: '#bfe3ff', a: 0.4 * (1 - sleep) } } });
    phoneFlat(c, T, 1220, 420, 1 - sleep * 0.8);
    c.restore();
  });
  inHalf(ctx, 1, (c) => {
    c.save(); camera(c, 960, 560, 1.0, 0.05);
    deitado(c, T, 'f_selecao', 960, { cor: '#e98aa9', chao: '#201830', seed: 6, face: { blink: sleep, mouth: 'smile', blush: 0.3, glow: { color: '#ffd0e6', a: 0.4 * (1 - sleep) } } });
    phoneFlat(c, T, 700, 420, 1 - sleep * 0.8);
    c.restore();
  });
  ctx.save(); ctx.fillStyle = `rgba(10,10,40,${0.35 * sleep})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  divisor(ctx, 0.8);
});

// =====================================================================
// CENA 5 — A VIAGEM PARA SÃO LUÍS (75–88)
// =====================================================================
shot(75, 78.95, (ctx, T) => {
  // close na mala sobre a cama: roupas, tampa, zíper
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, H, [[0, '#4a6fa5'], [1, '#3a5a8a']]); ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) fillRR(ctx, i * 260 - 40, 0, 120, H, 0, 'rgba(255,255,255,0.05)');
  const items = [];
  const k1 = eio(T, 75.2, 76.2), k2 = eio(T, 76.4, 77.4);
  const it1 = { x: lerp(300, 840, k1), y: lerp(1000, 690, k1) - Math.sin(k1 * Math.PI) * 120, w: 320, h: 120, c: '#f6f1e9', a: 1 };
  const it2 = { x: lerp(1650, 1080, k2), y: lerp(1000, 700, k2) - Math.sin(k2 * Math.PI) * 120, w: 330, h: 110, c: '#26232a', a: T > 76.4 ? 1 : 0 };
  const lid = 1 - eio(T, 77.6, 78.25);
  const zip = eio(T, 78.3, 78.9);
  const inside = (it) => ({ x: it.x - 960, y: it.y - 470, w: it.w, h: it.h, c: it.c, a: it.a });
  const sx = 960, sy = 470;
  drawSuitcaseOpen(ctx, sx, sy, 900, lid, [inside(it1), inside(it2)], zip);
  // patinhas carregando as roupas
  if (T < 76.3) arm(ctx, 'm_moletom', 200, 1200, it1.x - 120, it1.y + 30, 70, 0.75);
  if (T > 76.4 && T < 77.5) arm(ctx, 'm_moletom', 1750, 1200, it2.x + 130, it2.y + 30, 70, 0.75);
  if (T > 77.5 && T < 78.3) { const ky = lerp(250, sy + 558 * (1 - lid) - 10, eio(T, 77.6, 78.25)); arm(ctx, 'm_moletom', 640, 1250, 760, ky, 70, 0.8); arm(ctx, 'm_moletom', 1280, 1250, 1160, ky, 70, 0.8); }
  if (T > 78.3) { const zx = lerp(sx - 430, sx + 430, zip); arm(ctx, 'm_moletom', zx - 200, 1250, zx, sy + 540, 70, 0.8); }
  vignette(ctx, 0.4);
});
shot(78.95, 80, (ctx, T) => {
  ctx.save(); camera(ctx, 900, 560, 1.0);
  quartoEle(ctx, T, { noite: false });
  camaFrente(ctx, QUARTO_ELE.cx, QUARTO_ELE.blanket, QUARTO_ELE.bedW + 40, '#3f6496', T);
  const w = hop(T, 79.2, 80.2, 640, 1180, 2.8, 20);
  drawSuitcaseUpright(ctx, w.x + 230, 960, 250, w.lean * 0.5);
  drawChar(ctx, 'm_moletom', { x: w.x, y: 960, h: 600, bob: w.bob, lean: w.lean, blink: blinkAt(T, 11), mouth: 'laugh', open: 0.7, happyEyes: 0, sparkle: 0.6 });
  paw(ctx, w.x + 175, 960 - 250 * 1.58 - w.bob * 0.3, 26, 'm_moletom', -0.3);
  ctx.restore();
});
shot(80, 84, (ctx, T) => {
  ceu(ctx, T, '#3d8fd8', '#bfe4ff');
  sol(ctx, 1600, 180, 60);
  for (let i = 0; i < 8; i++) nuvem(ctx, ((i * 330 - (T - 80) * 120 * (0.6 + (i % 3) * 0.3)) % 2600 + 2600) % 2600 - 300, 150 + (i % 4) * 190, 1 + (i % 3) * 0.4, 0.9);
  const k = seg(T, 80, 84);
  const px = lerp(-350, 2250, k), py = lerp(640, 380, k) + Math.sin(T * 2) * 6;
  // rastro
  ctx.save(); ctx.globalAlpha = 0.5;
  ctx.fillStyle = linGrad(ctx, px - 900, 0, px - 150, 0, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.9)']]);
  ctx.beginPath(); ctx.moveTo(px - 160, py - 4); ctx.lineTo(px - 900, py + 90); ctx.lineTo(px - 900, py + 100); ctx.lineTo(px - 160, py + 8); ctx.fill();
  ctx.restore();
  drawPlane(ctx, px, py, 1.1, -0.1);
  for (let i = 0; i < 3; i++) nuvem(ctx, ((i * 900 - (T - 80) * 420) % 3000 + 3000) % 3000 - 400, 820 + i * 60, 2.2, 0.95);
});
shot(84, 86.4, (ctx, T) => {
  saoLuis(ctx, T, (T - 84) * 60);
  const k = seg(T, 84, 86.4);
  drawPlane(ctx, lerp(1250, 1700, k), lerp(160, 330, k), 0.28, 0.12);
});
shot(86.4, 88, (ctx, T) => {
  ruaSaoLuis(ctx, T, (T - 86.4) * 40);
  const w = hop(T, 86.4, 88.2, 260, 840, 2.8, 18);
  drawSuitcaseUpright(ctx, w.x - 220, 950, 240, -0.25);
  drawChar(ctx, 'm_moletom', { x: w.x, y: 950, h: 590, bob: w.bob, lean: w.lean, blink: blinkAt(T, 12), mouth: 'laugh', open: 0.6, sparkle: 0.7, headTilt: Math.sin(T * 2.2) * 0.07 });
  paw(ctx, w.x - 175, 950 - 240 * 1.52 - w.bob * 0.3, 26, 'm_moletom', 0.4);
});

// =====================================================================
// CENA 6 — A ESPERA NA FRENTE DO PRÉDIO (88–110)
// =====================================================================
const ELE_H6 = 520, ELA_H6 = 470;
function cenaPredio(ctx, T) {
  const noite = clamp(seg(T, 88, 102) * 0.7);
  const porta = eio(T, 101.8, 102.4) * (1 - eio(T, 103.4, 104.2) * 0.8);
  // ela aparecendo por dentro da porta de vidro
  predio._dentro = (c) => {
    if (T < 101.8 || T > 102.7) return;
    const [x, y, w, h] = PREDIO.porta;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    drawChar(c, 'f_vestido', { x: x + w / 2, y: y + h + 10, h: ELA_H6 * 0.95, blink: 0, alpha: seg(T, 101.8, 102.1), shadow: false });
    c.restore();
  };
  predio(ctx, T, porta, noite);
  predio._dentro = null;
  // --- ele
  let ex = 860, eb = 0, el = 0, sit = 0, ey = PREDIO.calcada;
  const p1 = hop(T, 95.0, 96.3, 860, 1050, 2.6, 14), p2 = hop(T, 96.5, 97.8, 1050, 780, 2.6, 14);
  if (T >= 95.0 && T < 96.4) { ex = p1.x; eb = p1.bob; el = p1.lean; }
  else if (T >= 96.4 && T < 98) { ex = T < 96.5 ? 1050 : p2.x; eb = p2.bob; el = p2.lean; }
  else if (T >= 98) ex = 780;
  sit = eio(T, 98.9, 99.6) * (1 - eio(T, 102.9, 103.4));
  ey = lerp(PREDIO.calcada, PREDIO.meioFio + 40, sit);
  // reencontro: caminham um em direção ao outro
  const meet = eio(T, 103.6, 105.0);
  const sep = eio(T, 107.0, 107.5);
  const exM = lerp(780, 1000, meet) - sep * 12;
  if (T >= 103.4) { ex = exM; ey = PREDIO.calcada; const hw = hop(T, 103.6, 105.0, 0, 0, 3, 14); eb = hw.bob; el = hw.lean; }
  const worried = T > 94.6 && T < 102.5;
  const lookUp = eio(T, 102.4, 102.8);
  const sigh = Math.sin(seg(T, 98.0, 98.8) * Math.PI);
  const hug = T > 105 && T < 107.2;
  const kiss = eio(T, 107.6, 108.2) * (1 - eio(T, 109.3, 109.8));
  const sway = hug ? Math.sin((T - 105) * 2.2) * 0.03 : 0;
  // --- ela
  const st = hop(T, 102.2, 102.9, 0, 0, 3, 10);
  let fx = lerp(1320, 1100, meet) + sep * 12, fy = lerp(PREDIO.porta[1] + PREDIO.porta[3] + 12, PREDIO.calcada, eio(T, 103.0, 103.8));
  const showHer = T >= 102.4;
  const fb = T < 103.6 ? st.bob : hop(T, 103.6, 105.0, 0, 0, 3, 14).bob;

  ex += 6 * kiss; fx -= 6 * kiss;
  const eleOpts = {
    x: ex, y: ey, h: ELE_H6, bob: eb + breathe(T) + sigh * 10, lean: el + sway + kiss * 0.06, sit,
    blink: (T > 98.2 && T < 98.7) ? 1 : blinkAt(T, 13),
    sad: worried ? (T > 99.6 ? 0.7 : 0.45) * (1 - lookUp) : 0,
    mouth: T < 93 ? 'smile' : worried && lookUp < 0.5 ? 'flat' : (T > 102.5 && T < 102.9 ? 'o' : (kiss > 0.3 ? 'kiss' : 'smile')),
    headDY: (T > 99.6 ? 30 : 0) * (1 - lookUp), headTilt: (T > 99.6 ? 0.06 : 0) * (1 - lookUp) + (T < 93 ? Math.sin(T * 1.4) * 0.03 : 0) + kiss * 0.2 + (hug ? 0.08 : 0),
    sparkle: lookUp, happyEyes: hug ? 1 : kiss, blush: hug || kiss > 0 ? 0.6 : 0,
  };
  const ele = drawChar(ctx, 'm_preta', eleOpts);
  if (T > 93 && T < 94.7) { // checa o celular
    const k = eio(T, 93.0, 93.4) * (1 - eio(T, 94.3, 94.7));
    const px = ele.chest.x + 40, py = lerp(ele.hip.y, ele.chest.y + 20, k);
    drawPhone(ctx, px, py, 44, 0.1, { back: true, glow: 0.6 * k });
    paw(ctx, px, py + 30, 17, 'm_preta', -0.2);
  }
  let ela = null;
  if (showHer) {
    ela = drawChar(ctx, 'f_vestido', {
      x: fx, y: fy, h: ELA_H6, bob: fb, lean: -sway - kiss * 0.03,
      blink: blinkAt(T, 14), mouth: hug ? 'smile' : 'laugh', open: 0.6, sparkle: 1, blush: 0.7,
      happyEyes: hug || kiss > 0.4 ? 1 : 0, headTilt: (hug ? -0.1 : 0) - kiss * 0.1,
    });
    // braço dele envolvendo as costas dela
    // mão dele aparecendo nas costas dela (abraço)
    const hugArm = eio(T, 104.9, 105.3) * (1 - eio(T, 107.0, 107.4)) + kiss * 0.8;
    if (hugArm > 0.05) {
      ctx.save(); ctx.globalAlpha *= clamp(hugArm * 1.5);
      paw(ctx, ela.shoulderR.x + 6, ela.shoulderR.y + 70, 24, 'm_preta', -0.5);
      ctx.restore();
    }
    // beijo na testa: a cabeça dele por cima
    if (kiss > 0.05) drawChar(ctx, 'm_preta', Object.assign({}, eleOpts, { crop: PERS.m_preta.y1 - 60, shadow: false }));
  }
  if (hug) floatHearts(ctx, T, 105.2, 107.2, (ex + fx) / 2, 560, { n: 8, spread: 260, size: 36, seed: 61 });
  if (kiss > 0.5) { floatHearts(ctx, T, 108.0, 109.6, ela ? ela.forehead.x : 1000, ela ? ela.forehead.y - 30 : 500, { n: 7, spread: 140, size: 30, seed: 71 }); sparkles(ctx, T, 108.0, 109.5, ela ? ela.forehead.x : 1000, ela ? ela.forehead.y : 500, { n: 10, spread: 160 }); }
  return { ele, ela };
}
shot(88, 93, (ctx, T) => { ctx.save(); camera(ctx, 960, 560, lerp(1.0, 1.06, seg(T, 88, 93))); cenaPredio(ctx, T); ctx.restore(); }, 0.6);
shot(93, 95, (ctx, T) => { ctx.save(); camera(ctx, 900, 560, 1.7); cenaPredio(ctx, T); ctx.restore(); }, 0.25);
shot(95, 101.8, (ctx, T) => { ctx.save(); camera(ctx, 960, 580, lerp(1.0, 1.12, seg(T, 95, 101.8))); cenaPredio(ctx, T); ctx.restore(); }, 0.25);
shot(101.8, 104.6, (ctx, T) => { ctx.save(); camera(ctx, lerp(1060, 1020, seg(T, 101.8, 104.6)), 600, 1.15); cenaPredio(ctx, T); ctx.restore(); }, 0.2);
shot(104.6, 110, (ctx, T) => {
  ctx.save(); camera(ctx, 1045, lerp(620, 600, seg(T, 104.6, 110)), lerp(1.25, 1.9, eio(T, 104.6, 110)));
  cenaPredio(ctx, T); ctx.restore();
}, 0.3);

// =====================================================================
// CENA 7 — O JANTAR, A PRAIA E O BALANÇO (110–125)
// =====================================================================
shot(110, 115, (ctx, T) => {
  ctx.save(); camera(ctx, 960, 560, lerp(1.0, 1.1, seg(T, 110, 115)));
  restaurante(ctx, T);
  const tableY = 720;
  const P1 = PERS.m_preta, P2 = PERS.f_vestido;
  const s1 = 560 / ALTURA_IMG, s2 = 510 / ALTURA_IMG;
  const laugh = T > 111.8 && T < 112.9;
  const ele = drawChar(ctx, 'm_preta', { x: 680, y: tableY + 20 + (P1.feet - P1.hip) * s1, h: 560, crop: P1.hip, shadow: false, bob: breathe(T),
    blink: blinkAt(T, 15), headTilt: 0.08 + Math.sin(T * 1.1) * 0.03, mouth: T > 110.8 && T < 111.5 ? 'flat' : 'smile', blush: 0.4, glow: { color: '#ffc86a', a: 0.4 } });
  const ela = drawChar(ctx, 'f_vestido', { x: 1260, y: tableY + 40 + (P2.feet - 800) * s2, h: 510, crop: 900, shadow: false, bob: breathe(T + 2) + (laugh ? Math.abs(Math.sin(T * 13)) * 8 : 0),
    blink: blinkAt(T, 16), headTilt: -0.08 + Math.sin(T * 1.3) * 0.03, mouth: laugh ? 'laugh' : 'smile', open: 0.8, happyEyes: laugh || (T > 113.5 && T < 114.2) ? 1 : 0, blush: 0.6, glow: { color: '#ffc86a', a: 0.4 } });
  mesaJantar(ctx, T, 960, tableY);
  // ele leva o garfo à boca
  const fk = Math.sin(seg(T, 110.4, 111.6) * Math.PI);
  if (fk > 0.01) {
    const gx = lerp(740, ele.mouth.x + 30, fk), gy = lerp(tableY + 5, ele.mouth.y + 25, fk);
    line(ctx, gx - 30, gy + 30, gx + 10, gy - 10, '#c9ccd2', 7);
    paw(ctx, gx - 30, gy + 34, 24, 'm_preta', -0.6);
  }
  if (T > 113) floatHearts(ctx, T, 113, 115, 960, 480, { n: 6, spread: 300, size: 30, seed: 81 });
  ctx.restore();
});
shot(115, 120, (ctx, T) => {
  const t0 = 115, t1 = 120;
  const cx = lerp(560, 1500, seg(T, t0, t1));
  const camX = cx + 60;
  ctx.save(); camera(ctx, camX, 560, 1.05);
  ctx.save(); ctx.translate(camX * 0.85, 0); marNoite(ctx, T, 500, [1500, 170]); ctx.restore();
  areia(ctx, 720, true);
  for (const px of [200, 900, 1700, 2400]) palmeira(ctx, px, 760, 0.75, T + px, true);
  // pegadas
  const stepDur = 1 / 2.8;
  for (let t = t0 + 0.2; t < T; t += stepDur) {
    const x = lerp(560, 1500, seg(t, t0, t1));
    const age = T - t;
    ctx.save(); ctx.globalAlpha = clamp(1 - age / 6) * 0.5;
    const i = Math.round((t - t0) / stepDur);
    for (const [ox, oy] of [[-110, 0], [95, 4]]) ellipse(ctx, x + ox + (i % 2 ? 22 : -22), 968 + oy, 15, 7, 0, '#5b4a35');
    ctx.restore();
  }
  const w1 = hop(T, t0, t1, 0, 0, 2.8, 14), w2 = hop(T + 0.18, t0, t1 + 0.18, 0, 0, 2.8, 12);
  const ele = drawChar(ctx, 'm_preta', { x: cx - 110, y: 975, h: 520, bob: w1.bob, lean: w1.lean, blink: blinkAt(T, 17), headTilt: 0.08, mouth: 'smile', blush: 0.3 });
  const ela = drawChar(ctx, 'f_vestido', { x: cx + 100, y: 975, h: 470, bob: w2.bob, lean: w2.lean, blink: blinkAt(T, 18), headTilt: -0.1, mouth: 'smile', blush: 0.5, sparkle: 0.4 });
  // mãos dadas
  const jx = cx - 5, jy = (ele.hip.y + ela.hip.y) / 2 - 40;
  arm(ctx, 'm_preta', ele.shoulderR.x - 20, ele.shoulderR.y + 20, jx - 6, jy, 30, 0.85);
  arm(ctx, 'f_vestido', ela.shoulderL.x + 20, ela.shoulderL.y + 20, jx + 6, jy, 26, 0.15);
  ctx.restore();
});
shot(120, 125, (ctx, T) => {
  const z = lerp(1.55, 0.82, eio(T, 120.5, 125));
  ctx.save(); camera(ctx, 960, lerp(640, 560, seg(T, 120, 125)), z);
  marNoite(ctx, T, 520, [1450, 200]);
  areia(ctx, 760, true);
  palmeira(ctx, 300, 820, 0.95, T, true); palmeira(ctx, 1650, 820, 0.85, T + 3, true);
  // estrutura do balanço
  const top = 300, seat = 800, px = 960;
  line(ctx, 620, top - 10, 1300, top - 10, '#5a3a22', 26);
  line(ctx, 650, top, 560, 1000, '#5a3a22', 22); line(ctx, 650, top, 740, 1000, '#5a3a22', 22);
  line(ctx, 1270, top, 1180, 1000, '#5a3a22', 22); line(ctx, 1270, top, 1360, 1000, '#5a3a22', 22);
  const ang = Math.sin((T - 120) / 3.2 * TAU) * 0.055;
  ctx.save(); ctx.translate(px, top); ctx.rotate(ang); ctx.translate(-px, -top);
  line(ctx, 760, top, 760, seat, '#d9c49a', 6); line(ctx, 1160, top, 1160, seat, '#d9c49a', 6);
  const lean = eio(T, 121.2, 122.0);
  const hugA = eio(T, 122.0, 122.8);
  const ele = drawChar(ctx, 'm_preta', { x: 890, y: seat + 100, h: 520, sit: 1, shadow: false, blink: blinkAt(T, 19), headTilt: 0.06 + hugA * 0.08, mouth: 'smile', blush: 0.4, happyEyes: hugA > 0.5 ? 1 : 0 });
  const ela = drawChar(ctx, 'f_vestido', { x: lerp(1060, 1035, lean), y: seat + 75, h: 470, sit: 0.8, shadow: false, lean: -0.12 * lean, blink: blinkAt(T, 20), headTilt: -0.22 * lean, headDX: -20 * lean, mouth: 'smile', blush: 0.6, happyEyes: lean > 0.6 ? 1 : 0 });
  fillRR(ctx, 730, seat, 460, 34, 8, '#8a5a33', '#3a2010', 3);
  if (hugA > 0.05) arm(ctx, 'm_preta', ele.shoulderR.x - 10, ele.shoulderR.y + 10, lerp(ele.shoulderR.x + 30, ela.shoulderR.x - 10, hugA), lerp(ele.shoulderR.y + 70, ela.shoulderR.y + 30, hugA), 32, 0.85);
  ctx.restore();
  floatHearts(ctx, T, 122.5, 125, 960, 520, { n: 6, spread: 200, size: 26, seed: 91 });
  ctx.restore();
});

// =====================================================================
// CENA 8 — UMA NOITE NO HOTEL (125–150)  e  CENA 9 — NOSSAS FOTOGRAFIAS (150–175)
// =====================================================================
const TV = { x: 960, y: 400, w: 640, h: 360 };
function tvLuzCor(T) {
  if (T < 140) return ['#9fd0ff', '#ffc2e0', '#c8ffb0'][Math.floor(T * 0.8) % 3];
  if (T < 145) return '#d8d8d8';
  if (T < 150) return '#ffffff';
  return '#ffe2c8';
}
function tvLuzAlpha(T) {
  if (T < 140) return 0.55 + 0.1 * Math.sin(T * 5);
  if (T < 145) return 0.3 + 0.4 * rnd(Math.floor(T * 20));
  if (T < 147.2) return 0;
  if (T < 150) return 0.25 * seg(T, 147.2, 150);
  return 0.6;
}
function hotelFrente(ctx, T, o = {}) {
  hotelQuarto(ctx, T);
  const luz = { color: tvLuzCor(T), a: tvLuzAlpha(T) };
  const lean = o.lean == null ? 1 : o.lean;
  const ele = naCama(ctx, 'm_preta', 840, 735, 640, Object.assign({ sink: 130, bob: breathe(T), blink: blinkAt(T, 22), glow: luz, headTilt: 0.04 }, o.ele || {}));
  const ela = naCama(ctx, 'f_vestido', 1085, 735, 600, Object.assign({ sink: 160, bob: breathe(T + 1.5), blink: blinkAt(T, 23), glow: luz, lean: -0.07 * lean, headTilt: -0.16 * lean, headDX: -14 * lean }, o.ela || {}));
  hotelCobertor(ctx, T);
  // luz da TV vindo da frente
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = luz.a * 0.6;
  ctx.fillStyle = luz.color; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (T > 145 && T < 147.2) { ctx.save(); ctx.fillStyle = 'rgba(10,8,20,0.45)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  return { ele, ela };
}
function hotelVistaTV(ctx, T) {
  const dark = T > 145 && T < 150 ? 1 - 0.6 * seg(T, 147.2, 150) : 0;
  hotelTVFundo(ctx, T, 1 - dark * 0.7);
  drawTV(ctx, TV.x, TV.y, TV.w, TV.h, tvConteudo(T), { ledColor: T < 145 ? '#3f3' : '#e33' });
  glow(ctx, TV.x, TV.y, 700, tvLuzCor(T), tvLuzAlpha(T) * 0.35);
  if (dark) { ctx.save(); ctx.fillStyle = `rgba(5,5,15,${0.55 * dark})`; ctx.fillRect(0, 0, W, H); ctx.restore(); drawTV(ctx, TV.x, TV.y, TV.w, TV.h, tvConteudo(T), { stand: false }); }
  // cabeças do casal de costas (silhueta)
  drawHeadBack(ctx, 'm_preta', 800, 1075, 820, { tilt: 0.03 });
  drawHeadBack(ctx, 'f_vestido', 1080, 1095, 760, { tilt: -0.22 });
  // cobertor em primeiro plano
  ctx.fillStyle = '#efe8dc'; ctx.beginPath(); ctx.moveTo(-50, H + 20); ctx.quadraticCurveTo(300, 960, 960, 1010); ctx.quadraticCurveTo(1600, 960, W + 50, H + 20); ctx.fill();
}
shot(125, 132, (ctx, T) => {
  ctx.save(); camera(ctx, 960, 560, lerp(1.0, 1.15, seg(T, 125, 132)));
  hotelFrente(ctx, T, { lean: eio(T, 126.5, 128), ela: { mouth: 'smile', blush: 0.5, happyEyes: T > 129 && T < 131 ? 1 : 0 }, ele: { mouth: 'smile' } });
  ctx.restore();
}, 0.8);
shot(132, 137.5, (ctx, T) => { ctx.save(); camera(ctx, 960, 560, lerp(1.0, 1.05, seg(T, 132, 137.5))); hotelVistaTV(ctx, T); ctx.restore(); });
shot(137.5, 140, (ctx, T) => {
  ctx.save(); camera(ctx, 960, 520, 1.35);
  hotelFrente(ctx, T, { ela: { mouth: 'laugh', open: 0.6, blush: 0.6, sparkle: 0.5 }, ele: { mouth: 'laugh', open: 0.5 } });
  ctx.restore();
}, 0.3);
shot(140, 142.6, (ctx, T) => { ctx.save(); camera(ctx, 960, 560, 1.05); hotelVistaTV(ctx, T); ctx.restore(); }, 0.2);
shot(142.6, 145, (ctx, T) => {
  ctx.save(); camera(ctx, 960, 520, 1.35);
  const look = T > 143.4 && T < 144.3;
  hotelFrente(ctx, T, { lean: 0.3,
    ela: { mouth: 'o', open: 0.8, headTilt: look ? -0.12 : 0.02 },
    ele: { mouth: 'o', open: 0.7, headTilt: look ? 0.12 : -0.02 } });
  ctx.restore();
}, 0.2);
shot(145, 156.5, (ctx, T) => { ctx.save(); camera(ctx, 960, 560, 1.05); hotelVistaTV(ctx, T); ctx.restore(); }, 0.2);
shot(156.5, 159.5, (ctx, T) => {
  ctx.save(); camera(ctx, 960, 500, lerp(1.35, 1.5, seg(T, 156.5, 159.5)));
  hotelFrente(ctx, T, { lean: eio(T, 158, 159),
    ela: { mouth: T < 157.4 ? 'o' : 'smile', open: 0.8, sparkle: 1, tear: T > 157.2 ? (T - 157.2) / 1.5 : 0, blush: 0.9 },
    ele: { mouth: 'smile', sparkle: 0.6, headTilt: 0.12, blush: 0.4 } });
  floatHearts(ctx, T, 157.5, 159.5, 960, 420, { n: 7, spread: 300, size: 30, seed: 101 });
  ctx.restore();
}, 0.3);
// 02:39.5–02:55 — câmera aproxima da TV até as fotos ocuparem a tela
shot(159.5, 175, (ctx, T) => {
  const k = eio(T, 163, 170);
  const zFull = W / TV.w * 1.005;
  ctx.save();
  camera(ctx, lerp(960, TV.x, k), lerp(560, TV.y, k), lerp(1.05, zFull, k));
  hotelVistaTV(ctx, T);
  ctx.restore();
  if (k >= 1) { const c = tvConteudo(T); ctx.drawImage(c, 0, 0, W, H); }
}, 0.3);

// =====================================================================
// CENA 10 — EU TE AMO (175–180)
// =====================================================================
shot(175, 180, (ctx, T) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const appear = seg(T, 175.2, 176.6);
  for (let i = 0; i < 70; i++) {
    const born = 175 + rnd(i + 1) * 2.5;
    const a = clamp((T - born) / 1.2) * (0.5 + 0.5 * Math.sin(T * 2 + i * 1.7));
    const x = rnd(i + 2) * W, y = ((rnd(i + 3) * H - (T - 175) * (20 + rnd(i) * 30)) % H + H) % H;
    glow(ctx, x, y, 10 + rnd(i + 5) * 26, '#f7d774', a * 0.8);
    circle(ctx, x, y, 1.5 + rnd(i + 6) * 2, `rgba(255,236,170,${a})`);
  }
  const ta = seg(T, 176.0, 177.4);
  ctx.save();
  ctx.globalAlpha = ta;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '180px "Great Vibes", cursive';
  ctx.shadowColor = 'rgba(255,200,90,0.8)'; ctx.shadowBlur = 40;
  ctx.fillStyle = linGrad(ctx, 0, 430, 0, 640, [[0, '#ffe9a6'], [0.5, '#f2c75a'], [1, '#c9952a']]);
  const sc = 0.96 + 0.04 * easeOut(ta);
  ctx.translate(900, 540); ctx.scale(sc, sc);
  ctx.fillText('Eu te amo.', 0, 0);
  ctx.restore();
  // coração
  const hb = 1 + 0.08 * Math.max(0, Math.sin((T - 176) * 5.2)) * seg(T, 176.5, 177);
  ctx.save(); ctx.globalAlpha = seg(T, 176.6, 177.6);
  glow(ctx, 1330, 545, 110, '#ff4d6d', 0.6);
  heart(ctx, 1330, 548, 88 * hb, '#e8264f', '#ff9aae', 3);
  ctx.restore();
  fade(ctx, seg(T, 178.9, 180));
  void appear;
}, 0.6);
