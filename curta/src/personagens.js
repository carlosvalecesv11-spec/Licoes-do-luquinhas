'use strict';
// =====================================================================
//  Personagens: usam AS IMAGENS FORNECIDAS (assets/referencias/*.png).
//  Cada imagem é separada em "cabeça" e "corpo" para animar a cabeça;
//  piscar, expressões, blush e lágrimas são pintados por cima da arte.
//  Coordenadas abaixo são em pixels da imagem original (1024x1536).
// =====================================================================

const PERS = {
  // macaquinho — camisa branca, short preto, tênis branco (cenas 1, 2, 4)
  m_branca: { src: 'assets/referencias/macaquinho_camisa_branca.png', g: 'm', cx: 510, feet: 1478, y1: 470, neck: 520, jawW: 125, hip: 940,
    eyes: [[463, 323], [600, 324]], er: [50, 47], mouth: [530, 426, 68], skin: '#ed9a62', muz: '#f09d65', sleeve: '#f7efe6', fur: '#7a3d1b' },
  // macaquinho — moletom preto (cena 5)
  m_moletom: { src: 'assets/referencias/macaquinho_moletom.png', g: 'm', cx: 505, feet: 1478, y1: 392, neck: 450, jawW: 112, hip: 865,
    eyes: [[463, 263], [586, 264]], er: [42, 42], mouth: [526, 361, 66], skin: '#ef9e66', muz: '#ef9f67', sleeve: '#26232a', fur: '#7a3d1b' },
  // macaquinho — camisa preta manga longa (cenas 6 a 9)
  m_preta: { src: 'assets/referencias/macaquinho_camisa_preta.png', g: 'm', cx: 509, feet: 1492, y1: 398, neck: 450, jawW: 114, hip: 870,
    eyes: [[473, 263], [605, 263]], er: [42, 42], mouth: [535, 362, 66], skin: '#f69a59', muz: '#f79c5c', sleeve: '#1e1b1d', fur: '#7a3d1b' },
  // macaquinha — blusa da Seleção (cenas 1 a 4)
  f_selecao: { src: 'assets/referencias/macaquinha_selecao.png', g: 'f', cx: 494, feet: 1492, y1: 456, neck: 510, jawW: 112, hip: 875,
    eyes: [[414, 328], [569, 318]], er: [47, 45], mouth: [502, 425, 60], skin: '#e3935d', muz: '#e49560', sleeve: '#f6f2ec', fur: '#6e3416' },
  // macaquinha — vestido amarelo (cenas 6 a 9)
  f_vestido: { src: 'assets/referencias/macaquinha_vestido_amarelo.png', g: 'f', cx: 499, feet: 1501, y1: 494, neck: 552, jawW: 116, hip: 1170,
    eyes: [[410, 356], [574, 343]], er: [48, 46], mouth: [502, 459, 62], skin: '#f09555', muz: '#f19855', sleeve: '#f5bd1c', fur: '#6e3416' },
};
const ALTURA_IMG = 1450; // altura útil (topo da cabeça até os pés)

// Prepara camadas cabeça/corpo a partir da imagem carregada
function prepararPersonagens(imgs) {
  for (const k in PERS) {
    const P = PERS[k], img = imgs[P.src];
    P.img = img;
    const w = img.width, h = img.height;
    const mask = (c) => {
      c.beginPath();
      c.rect(0, 0, w, P.y1);
      c.ellipse(P.mouth[0], P.y1, P.jawW, P.neck - P.y1, 0, 0, Math.PI);
    };
    const head = document.createElement('canvas'); head.width = w; head.height = h;
    let c = head.getContext('2d');
    c.save(); mask(c); c.clip(); c.drawImage(img, 0, 0); c.restore();
    const body = document.createElement('canvas'); body.width = w; body.height = h;
    c = body.getContext('2d');
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    // remove a cabeça, deixando um pouco do pescoço por baixo
    c.beginPath(); c.rect(0, 0, w, P.y1 - 30);
    c.ellipse(P.mouth[0], P.y1 - 30, P.jawW * 0.92, (P.neck - P.y1) * 0.55, 0, 0, Math.PI); c.fill();
    // silhueta da cabeça (para vista por trás)
    const sil = document.createElement('canvas'); sil.width = w; sil.height = h;
    c = sil.getContext('2d'); c.drawImage(head, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = '#2a170c'; c.fillRect(0, 0, w, h);
    if (P.g === 'f') { // laço amarelo visto por trás
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = '#b88a12'; c.fillRect(0, 0, w, P.eyes[0][1] - 150);
    }
    P.head = head; P.body = body; P.sil = sil;
  }
}

// --------------------------------------------------------------------
// drawChar(ctx, chave, o)
//  o.x, o.y      posição dos pés no mundo
//  o.h           altura na tela (px) — padrão 520
//  o.flip        -1 espelha
//  o.lean        inclinação do corpo (rad) em torno dos pés
//  o.bob         deslocamento vertical (px, + sobe)
//  o.squash      achatamento (1 = normal)
//  o.sit         0..1 encolhe as pernas (sentado)
//  o.crop        corta abaixo desta linha (px da imagem) — ex.: coberto pelo cobertor
//  o.headTilt    rotação da cabeça (rad); o.headDY desloca (px imagem)
//  o.blink, o.happyEyes, o.sad (0..1), o.mouth ('sad'|'flat'|'open'|'laugh'|'o'|'kiss'), o.open
//  o.blush, o.tear, o.sparkle, o.glow (luz do celular/TV no rosto: {color, a})
//  o.alpha
// Retorna pontos úteis no mundo: head, chest, hip, hand(L/R)
// --------------------------------------------------------------------
function drawChar(ctx, key, o) {
  const P = PERS[key];
  const s = (o.h || 520) / ALTURA_IMG;
  const base = ctx.getTransform();
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.translate(o.x, o.y - (o.bob || 0));
  if (o.lean) ctx.rotate(o.lean);
  ctx.scale(s * (o.flip || 1), s * (o.squash || 1));
  if (o.stretchX) ctx.scale(o.stretchX, 1);
  ctx.translate(-P.cx, -P.feet);

  const sit = clamp(o.sit || 0);
  const legsH = P.feet - P.hip;
  const shrink = legsH * 0.58 * sit;       // quanto as pernas encolhem
  const crop = o.crop || 99999;

  // sombra no chão
  if (o.shadow !== false && crop > P.feet - 10) {
    ctx.save(); ctx.globalAlpha *= 0.28;
    ellipse(ctx, P.cx, P.feet - 8, 230 * (1 - (o.bob || 0) / 900), 26, 0, '#000');
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(-2000, -2000, 5000, crop + 2000 + shrink); ctx.clip();
  // pernas (encolhidas quando sentado)
  if (crop > P.hip) {
    const w = P.img.width;
    ctx.drawImage(P.body, 0, P.hip, w, legsH, 0, P.hip + shrink, w, legsH - shrink);
  }
  ctx.translate(0, shrink);
  // corpo
  ctx.drawImage(P.body, 0, 0, P.img.width, P.hip + 2, 0, 0, P.img.width, P.hip + 2);
  ctx.restore();

  ctx.translate(0, shrink);
  const bodyM = ctx.getTransform();
  // cabeça
  ctx.save();
  const px = P.mouth[0], py = P.neck;
  ctx.translate(px + (o.headDX || 0), py + (o.headDY || 0));
  ctx.rotate(o.headTilt || 0);
  ctx.translate(-px, -py);
  ctx.drawImage(P.head, 0, 0);
  expressao(ctx, P, o);
  const headM = ctx.getTransform();
  ctx.restore();

  const inv = base.inverse();
  const toW = (M, x, y) => inv.multiply(M).transformPoint(new DOMPoint(x, y));
  const out = {
    s, P,
    head: toW(headM, P.mouth[0], (P.eyes[0][1] + P.mouth[1]) / 2),
    mouth: toW(headM, P.mouth[0], P.mouth[1]),
    forehead: toW(headM, (P.eyes[0][0] + P.eyes[1][0]) / 2, P.eyes[0][1] - 90),
    chest: toW(bodyM, P.cx, P.neck + 170),
    belly: toW(bodyM, P.cx, (P.neck + P.hip) / 2 + 60),
    hip: toW(bodyM, P.cx, P.hip),
    shoulderL: toW(bodyM, P.cx - 150, P.neck + 80),
    shoulderR: toW(bodyM, P.cx + 150, P.neck + 80),
    top: toW(headM, P.cx, 40),
  };
  ctx.restore();
  return out;
}

// Pinta piscar / expressões sobre a arte original (coordenadas da imagem)
function expressao(ctx, P, o) {
  const [mx, my, mw] = P.mouth;
  // luz no rosto (celular / TV)
  if (o.glow && o.glow.a > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = clamp(o.glow.a);
    ctx.fillStyle = radGrad(ctx, mx, my + 40, 20, 360, [[0, o.glow.color], [1, rgba(o.glow.color, 0)]]);
    ctx.fillRect(mx - 400, my - 400, 800, 800);
    ctx.restore();
  }
  // boca
  const m = o.mouth;
  if (m && m !== 'smile') {
    // cobre o sorriso original
    ctx.save();
    ctx.fillStyle = radGrad(ctx, mx, my + 4, mw * 0.6, mw * 1.45, [[0, P.muz], [0.75, P.muz], [1, rgba(P.muz, 0)]]);
    ctx.beginPath(); ctx.ellipse(mx, my + 4, mw * 1.45, 34, 0, 0, TAU); ctx.fill();
    ctx.restore();
    const ink = '#3d1606';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (m === 'sad') {
      ctx.beginPath(); ctx.moveTo(mx - mw * 0.62, my + 14); ctx.quadraticCurveTo(mx, my - 12, mx + mw * 0.62, my + 14);
      ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.stroke();
    } else if (m === 'flat') {
      ctx.beginPath(); ctx.moveTo(mx - mw * 0.5, my + 4); ctx.quadraticCurveTo(mx, my + 8, mx + mw * 0.5, my + 4);
      ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.stroke();
    } else if (m === 'o') {
      ellipse(ctx, mx, my + 6, 15, 21 * (o.open || 1), 0, '#5a1a0e', ink, 5);
    } else if (m === 'kiss') {
      ellipse(ctx, mx + 4, my + 2, 12, 11, 0, '#c45a4a', ink, 5);
    } else { // 'open' / 'laugh' — sorriso aberto
      const op = o.open == null ? 1 : o.open;
      const ww = mw * (m === 'laugh' ? 0.95 : 0.8);
      ctx.beginPath();
      ctx.moveTo(mx - ww, my - 6);
      ctx.quadraticCurveTo(mx, my + 2, mx + ww, my - 6);
      ctx.quadraticCurveTo(mx, my + 20 + 50 * op, mx - ww, my - 6);
      ctx.closePath();
      ctx.fillStyle = '#5a1a0e'; ctx.fill();
      ctx.save(); ctx.clip();
      ellipse(ctx, mx, my + 18 + 46 * op, ww * 0.62, 22, 0, '#e46a6a');
      fillRR(ctx, mx - ww * 0.7, my - 12, ww * 1.4, 14, 4, '#fff8f0');
      ctx.restore();
      ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.stroke();
    }
  }
  // olhos
  const blink = clamp(Math.max(o.blink || 0, o.happyEyes || 0));
  const sad = clamp(o.sad || 0);
  P.eyes.forEach(([ex, ey], i) => {
    const [rx, ry] = P.er;
    const out = i === 0 ? -1 : 1; // lado externo
    if (o.sparkle) {
      ctx.save(); ctx.globalAlpha = clamp(o.sparkle);
      circle(ctx, ex + rx * 0.05, ey - ry * 0.25, rx * 0.18, '#ffffff');
      ellipse(ctx, ex, ey + ry * 0.62, rx * 0.62, ry * 0.14, 0, 'rgba(190,232,255,0.75)');
      ctx.restore();
    }
    if (blink > 0.02 || sad > 0.02) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(ex, ey, rx * 1.12, ry * 1.14, 0, 0, TAU); ctx.clip();
      // pálpebra: desce do topo (piscar) / cai no canto externo (tristeza)
      const top = ey - ry * 1.2;
      const lidIn = top + ry * 2.4 * blink + ry * 0.45 * sad;
      const lidOut = top + ry * 2.4 * blink + ry * 1.05 * sad;
      const xin = ex - out * rx * 1.2, xout = ex + out * rx * 1.2;
      ctx.beginPath();
      ctx.moveTo(xin, top - 10); ctx.lineTo(xout, top - 10); ctx.lineTo(xout, lidOut); ctx.lineTo(xin, lidIn); ctx.closePath();
      ctx.fillStyle = P.skin; ctx.fill();
      ctx.restore();
      if (blink > 0.92) {
        ctx.beginPath();
        if ((o.happyEyes || 0) >= (o.blink || 0)) {
          ctx.moveTo(ex - rx * 0.9, ey + 8); ctx.quadraticCurveTo(ex, ey - ry * 0.75, ex + rx * 0.9, ey + 8);
        } else {
          ctx.moveTo(ex - rx * 0.95, ey + 2); ctx.quadraticCurveTo(ex, ey + ry * 0.55, ex + rx * 0.95, ey + 2);
        }
        ctx.strokeStyle = '#2a1004'; ctx.lineWidth = P.g === 'f' ? 8 : 6.5; ctx.lineCap = 'round'; ctx.stroke();
        if (P.g === 'f') {
          ctx.lineWidth = 4;
          for (let j = 0; j < 3; j++) {
            const ax = ex + out * (rx * 0.95 - j * 13), ay = ey + 6 - j * 2;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + out * 9, ay - 12); ctx.stroke();
          }
        }
      } else {
        const lidY = (a) => lerp(lidIn, lidOut, a);
        ctx.beginPath();
        ctx.moveTo(xin, lidIn); ctx.lineTo(xout, lidOut);
        ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx * 1.12, ry * 1.14, 0, 0, TAU); ctx.clip();
        ctx.beginPath(); ctx.moveTo(ex - rx * 1.2, lidY(out < 0 ? 1 : 0)); ctx.lineTo(ex + rx * 1.2, lidY(out < 0 ? 0 : 1));
        ctx.strokeStyle = '#2a1004'; ctx.lineWidth = 6; ctx.stroke();
        ctx.restore();
      }
    }
    if (o.tear) {
      const k = o.tear % 1;
      ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI);
      const tx = ex + out * rx * 0.35, ty = ey + ry + 10 + k * 70;
      ctx.beginPath(); ctx.moveTo(tx, ty - 16);
      ctx.quadraticCurveTo(tx + 12, ty + 6, tx, ty + 10); ctx.quadraticCurveTo(tx - 12, ty + 6, tx, ty - 16);
      ctx.fillStyle = 'rgba(170,225,255,0.95)'; ctx.fill();
      ctx.restore();
    }
  });
  if (o.blush) {
    ctx.save(); ctx.globalAlpha = clamp(o.blush) * 0.45;
    for (const [ex, ey] of P.eyes) {
      ctx.fillStyle = radGrad(ctx, ex + (ex < mx ? -14 : 14), ey + P.er[1] + 34, 2, 46, [[0, '#ff5a6e'], [1, 'rgba(255,90,110,0)']]);
      ctx.fillRect(ex - 70, ey, 140, 140);
    }
    ctx.restore();
  }
}

// Patinha (mão) segurando algo — desenhada por cima do objeto
function paw(ctx, x, y, r, key, ang = 0) {
  const P = PERS[key];
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ellipse(ctx, 0, 0, r, r * 0.86, 0, P.fur, '#2a1206', r * 0.12);
  ellipse(ctx, -r * 0.25, -r * 0.2, r * 0.42, r * 0.3, -0.4, 'rgba(255,190,140,0.35)');
  for (let i = -1; i <= 1; i++) line(ctx, i * r * 0.32, r * 0.25, i * r * 0.36, r * 0.7, 'rgba(30,10,0,0.55)', r * 0.08);
  ctx.restore();
}
// Braço (manga + patinha) de um ponto a outro — usado para abraço e mãos dadas
function arm(ctx, key, x0, y0, x1, y1, w, sleeveUntil = 1) {
  const P = PERS[key];
  const mx = lerp(x0, x1, sleeveUntil), my = lerp(y0, y1, sleeveUntil);
  ctx.lineCap = 'round';
  line(ctx, x0, y0, x1, y1, '#2a1206', w + 4);
  line(ctx, x0, y0, x1, y1, P.fur, w);
  if (sleeveUntil > 0) { line(ctx, x0, y0, mx, my, '#1a0b04', w * 1.15 + 4); line(ctx, x0, y0, mx, my, P.sleeve, w * 1.15); }
  paw(ctx, x1, y1, w * 0.62, key, Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2);
}

// Silhueta da cabeça vista por trás (cena do hotel)
function drawHeadBack(ctx, key, x, y, h, o = {}) {
  const P = PERS[key];
  const s = h / ALTURA_IMG;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(s, s); ctx.translate(-P.mouth[0], -P.neck);
  // ombros
  ctx.fillStyle = o.cor || '#24140c';
  ctx.beginPath(); ctx.ellipse(P.mouth[0], P.neck + 300, 340, 290, 0, Math.PI, TAU); ctx.fill();
  ctx.globalAlpha *= 0.97;
  ctx.drawImage(P.sil, 0, 0);
  ctx.restore();
}
