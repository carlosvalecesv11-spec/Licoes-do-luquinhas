'use strict';
// =====================================================================
//  DEMONSTRAÇÃO (20 s) — Cena do reencontro com personagens articulados.
//  Caminhada, espera, celular, andar de um lado para o outro, sentar na
//  calçada, levantar, caminhar até ela, abraço e beijo na testa.
// =====================================================================
window.DURACAO_FILME = 20;
const SHOTS = [];
function shot(t0, t1, draw, xf = 0.3) { SHOTS.push({ t0, t1, draw, xf }); }
const EH = 545, FH = 455;
const CHAO = PREDIO.calcada;          // y dos pés na calçada
const RUA_SENTADO = 1004;             // y dos pés na rua quando sentado no meio-fio

// trajetória com aceleração e desaceleração
function trajeto(T, keys) { return kf(T, keys, easeInOut); }
// amplitude da caminhada (liga/desliga suave)
function passo(T, t0, t1, r = 0.25) { return sm(T, t0, t0 + r) * (1 - sm(T, t1 - r, t1)); }

// ---------------------------------------------------------------- ELE
function poseEle(T) {
  // posição horizontal
  const x = trajeto(T, [[0, 230], [3.0, 820], [7.0, 820], [8.2, 1010], [8.7, 1010], [9.9, 780], [14.2, 780], [15.6, 985], [17.6, 985], [18.0, 972], [20, 972]]);
  const sitK = antecip(seg(T, 10.4, 11.4), 0.1, 0.06) * (1 - clamp(antecip(seg(T, 13.5, 14.2), 0.15, 0.08)));
  const sit = clamp(sitK, -0.2, 1.1);
  const y = lerp(CHAO, RUA_SENTADO, clamp(sit));
  const p = novaPose({ x, y, h: EH, zBase: 0 });
  respirar(p, T, 1, 0);
  // caminhada
  const amp = Math.max(passo(T, 0, 3.0, 0.4), passo(T, 7.0, 8.2), passo(T, 8.7, 9.9), passo(T, 14.2, 15.6) * 1.1);
  const fase = T * 2.35 * Math.PI;
  andar(p, 'm_preta', fase, amp, false);
  // parada com acomodação (inércia)
  p.lean = -0.035 * Math.sin(seg(T, 3.0, 3.6) * Math.PI) + 0.03 * Math.sin(seg(T, 8.2, 8.7) * Math.PI) - 0.03 * Math.sin(seg(T, 9.9, 10.4) * Math.PI);
  // olhar e cabeça
  let look = [0.5, 0];
  let face = { blink: blinkAt(T, 3), mouth: 'smile' };
  if (T < 3.0) { look = [0.6, 0]; face.mouth = 'smile'; }
  else if (T < 4.0) { look = [kf(T, [[3.0, 0.6], [3.5, 0.95], [4.0, 0.9]]), -0.1]; face.browUp = 0.2; }
  if (T >= 4.0 && T < 6.6) { // celular
    const k = sm(T, 4.0, 4.5) * (1 - sm(T, 6.1, 6.6));
    look = [lerp(0.9, 0.15, k), lerp(0, 0.95, k)];
    face.sad = 0.35 * k; face.browSad = 0.5 * k; face.mouth = k > 0.5 ? 'flat' : 'smile';
    addPart(p, 'pescoco', 'dy', 0);
    face.glow = { color: '#bfe3ff', a: 0.55 * k };
    addPart(p, 'cabeca', 'dy', 22 * k); addPart(p, 'cabeca', 'rot', 0.09 * k);
    p.maoFora.D = sm(T, 4.0, 4.35) * (1 - sm(T, 6.3, 6.6));
    p.ik = { D: p.maoFora.D };
    p.maos.D = [x + 0.05 * EH, y - 0.47 * EH + Math.sin(T * 1.3) * 3];
    p.dedos = { D: 0.2 };
  }
  if (T >= 6.6 && T < 10.4) { // preocupado, andando de um lado para o outro
    const dir = T < 8.4 ? 1 : (T < 9.9 ? -1 : 0.4);
    look = [dir * 0.85, 0.05];
    face.sad = 0.45; face.browSad = 0.8; face.mouth = 'flat';
    if (T > 6.6 && T < 7.3) { // suspiro
      const k = Math.sin(seg(T, 6.6, 7.3) * Math.PI);
      addPart(p, 'tronco', 'dy', -10 * k); addPart(p, 'cabeca', 'dy', -6 * k); face.blink = Math.max(face.blink, k > 0.6 ? 1 : 0);
    }
    addPart(p, 'cabeca', 'rot', dir * 0.04);
  }
  if (T >= 9.9 && T < 10.5) { const k = Math.sin(seg(T, 9.9, 10.5) * Math.PI); face.blink = k > 0.5 ? 1 : face.blink; addPart(p, 'tronco', 'dy', -8 * k); }
  // sentado: cabeça baixa, braços apoiados nos joelhos
  if (sit > 0.01) {
    const s = clamp(sit);
    sentar(p, 'm_preta', s);
    const tmp = matrizes('m_preta', p);
    const jE = tmp.canelaE.transformPoint(new DOMPoint(400, 1185)), jD = tmp.canelaD.transformPoint(new DOMPoint(595, 1185));
    p.maoFora.E = p.maoFora.D = s;
    p.ik = { E: s, D: s };
    p.maos.E = [jE.x + 6, jE.y + 4]; p.maos.D = [jD.x - 6, jD.y + 4];
    p.dedos = { E: 0.1, D: 0.1 };
    const desanimo = s * (1 - sm(T, 12.9, 13.3));
    addPart(p, 'cabeca', 'dy', 22 * desanimo); addPart(p, 'cabeca', 'rot', 0.07 * desanimo + Math.sin(T * 0.9) * 0.02 * desanimo);
    addPart(p, 'tronco', 'rot', 0.02 * s);
    if (T < 13.0) { look = [0.15, 0.9]; face.sad = 0.65; face.browSad = 1; face.mouth = 'sad'; face.blink = Math.max(face.blink, T > 11.8 && T < 12.2 ? 1 : 0); }
  }
  // ela aparece: reação
  if (T >= 12.9 && T < 15.6) {
    const k = sm(T, 12.9, 13.3);
    look = [lerp(0.15, 0.9, k), lerp(0.9, -0.15, k)];
    face.sad = 0; face.browSad = 0; face.browUp = 0.8 * k * (1 - sm(T, 14.0, 14.6));
    face.mouth = T < 13.6 ? 'o' : 'laugh'; face.open = 0.7; face.sparkle = k;
    if (T > 13.5) { // levanta e abre os braços
      const a = sm(T, 13.8, 14.6);
      p.maoFora.E = Math.max(p.maoFora.E || 0, a); p.maoFora.D = Math.max(p.maoFora.D || 0, a);
      if (sit < 0.05) {
        p.ik = { E: a, D: a };
        const ab = 0.33 * EH;
        p.maos.E = [x - ab, y - 0.5 * EH - Math.sin(T * 9) * 4 * a];
        p.maos.D = [x + ab + 20, y - 0.52 * EH + Math.sin(T * 9 + 1) * 4 * a];
        p.dedos = { E: 0.8, D: 0.8 };
      }
    }
  }
  return { p, face, look };
}

// ---------------------------------------------------------------- ELA
function poseEla(T) {
  const x = trajeto(T, [[12.6, 1320], [14.2, 1320], [15.6, 1100], [17.6, 1100], [18.0, 1112], [20, 1112]]);
  const sai = sm(T, 13.0, 13.8);
  const y = lerp(PREDIO.porta[1] + PREDIO.porta[3] + 12, CHAO, sm(T, 13.3, 14.3));
  const p = novaPose({ x, y, h: FH, zBase: 1 });
  respirar(p, T, 1, 2);
  const amp = Math.max(passo(T, 13.0, 13.8, 0.2) * 0.7, passo(T, 14.2, 15.6) * 1.1);
  andar(p, 'f_vestido', T * 2.5 * Math.PI + 1, amp, false);
  p.unidas = 1 - sm(T, 14.3, 14.9);
  const abre = sm(T, 14.3, 14.9);
  if (abre > 0 && T < 15.6) {
    p.ik = { E: abre, D: abre };
    p.maos.E = [x - 0.3 * FH - 10, y - 0.52 * FH + Math.sin(T * 9) * 4];
    p.maos.D = [x + 0.3 * FH, y - 0.5 * FH];
  }
  const face = { blink: blinkAt(T, 5), mouth: 'laugh', open: 0.6, sparkle: 1, blush: 0.6 };
  let look = [-0.8, 0.05];
  return { p, face, look };
}

// ---------------------------------------------------------------- abraço e beijo
function interacao(T, E, F) {
  const hug = sm(T, 15.4, 15.9);
  const kiss = sm(T, 18.2, 18.8) * (1 - sm(T, 19.6, 20.2));
  const sway = Math.sin((T - 15.6) * 2.0) * 0.02 * hug;
  E.p.x += 20 * kiss; F.p.x -= 15 * kiss;
  if (hug > 0) {
    const pe = pontos('f_vestido', Object.assign(novaPose({}), F.p, { _M: null }));
    // braços dele: um nas costas dela (atrás do corpo, mão no ombro distante), outro na cintura
    E.p.maoFora.E = E.p.maoFora.D = 1;
    E.p.ik = { E: hug, D: hug };
    E.p.maos.D = [pe.ombroD.x - 10, pe.ombroD.y + 30];
    E.p.maos.E = [pe.waist.x - 70, pe.waist.y - 10];
    E.p.z.bracoD = 0.95; E.p.z.antebracoD = 0.96; E.p.z.maoD = 2.0;
    E.p.z.bracoE = 0.9; E.p.z.antebracoE = 1.9; E.p.z.maoE = 1.95;
    E.p.dedos = { E: 0.3, D: 0.4 };
    // braços dela: um em volta dele (atrás), outro no peito dele
    const pm = pontos('m_preta', Object.assign(novaPose({}), E.p, { _M: null }));
    F.p.unidas = 0;
    F.p.ik = { E: hug, D: hug };
    F.p.maos.E = [pm.ombroD.x - 40, pm.ombroD.y + 60];
    F.p.maos.D = [pm.waist.x + 45, pm.waist.y - 55];
    F.p.z.bracoE = 0.97; F.p.z.antebracoE = -0.1; F.p.z.maoE = -0.05;
    F.p.z.antebracoD = 1.55; F.p.z.maoD = 1.56;
    E.p.lean = (E.p.lean || 0) + 0.05 * hug + sway + 0.06 * kiss;
    F.p.lean = (F.p.lean || 0) - 0.05 * hug + sway - 0.02 * kiss;
    E.face = Object.assign(E.face, { mouth: kiss > 0.3 ? 'kiss' : 'smile', happyEyes: T < 17.6 || kiss > 0.4 ? 1 : 0, blush: 0.6, sparkle: 0.5 });
    F.face = Object.assign(F.face, { mouth: 'smile', happyEyes: T < 17.6 || kiss > 0.3 ? 1 : 0, blush: 0.8 });
    addPart(E.p, 'cabeca', 'rot', 0.12 * hug * (1 - kiss) + 0.24 * kiss);
    addPart(E.p, 'cabeca', 'dx', 10 * kiss);
    addPart(F.p, 'cabeca', 'rot', -0.14 * hug * (1 - kiss) - 0.1 * kiss);
    E.look = [0.8, 0.35]; F.look = [-0.85, -0.55];
    if (kiss > 0.05) E.p.z.cabeca = 3.0;
  }
  E.p.face = Object.assign(E.face, { look: E.look });
  F.p.face = Object.assign(F.face, { look: F.look });
  return { hug, kiss };
}

// ---------------------------------------------------------------- cena
function cenaDemo(ctx, T) {
  const noite = clamp(seg(T, 0, 13) * 0.6);
  const porta = sm(T, 12.6, 13.1) * (1 - sm(T, 14.4, 15.2) * 0.85);
  const E = poseEle(T);
  const F = T >= 12.6 ? poseEla(T) : null;
  const ia = F ? interacao(T, E, F) : { hug: 0, kiss: 0 };
  if (!F) E.p.face = Object.assign(E.face, { look: E.look });
  // ela por trás do vidro antes de sair
  predio._dentro = F && T < 13.2 ? (c) => {
    const [x, y, w, h] = PREDIO.porta;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalAlpha *= sm(T, 12.6, 12.9);
    drawRig(c, 'f_vestido', F.p);
    c.restore();
  } : null;
  predio(ctx, T + 88, porta, noite);
  predio._dentro = null;
  const lista = [['m_preta', E.p]];
  if (F && T >= 13.2) lista.push(['f_vestido', F.p]);
  const pts = drawRigs(ctx, lista);
  // celular
  if (T > 4.0 && T < 6.6 && E.p.maoFora.D > 0.3) {
    const m = pts[0].maoD;
    drawPhone(ctx, m.x - 2, m.y - 30, 40, 0.12, { back: true, glow: 0.35 * E.p.maoFora.D });
  }
  // corações no abraço / beijo
  if (ia.hug > 0.5) floatHearts(ctx, T, 15.8, 17.8, 1040, 560, { n: 8, spread: 240, size: 30, seed: 61 });
  if (ia.kiss > 0.5 && F) {
    const f = pts[1].forehead;
    floatHearts(ctx, T, 18.8, 20, f.x - 20, f.y - 20, { n: 6, spread: 120, size: 26, seed: 71 });
    sparkles(ctx, T, 18.7, 19.8, f.x - 20, f.y, { n: 10, spread: 150, size: 14 });
  }
  // primeiro plano (paralaxe): arbustos
  return pts;
}
function primeiroPlano(ctx, camX, T) {
  ctx.save();
  ctx.translate(-(camX - 960) * 0.35, 0);
  for (const [bx, by, r, c] of [[-60, 1090, 190, '#1f3a26'], [120, 1120, 150, '#2a4a30'], [1880, 1100, 200, '#1f3a26'], [2060, 1080, 160, '#2a4a30']]) {
    for (let i = 0; i < 6; i++) circle(ctx, bx + Math.cos(i * 1.7) * r * 0.6 + Math.sin(T * 1.3 + i) * 4, by - Math.abs(Math.sin(i * 2.1)) * r * 0.6, r * 0.5, c);
  }
  ctx.restore();
}
function tomada(cx, cy, z) {
  return (ctx, T) => {
    const c = typeof cx === 'function' ? cx(T) : cx, y = typeof cy === 'function' ? cy(T) : cy, zz = typeof z === 'function' ? z(T) : z;
    ctx.save(); camera(ctx, c, y, zz); cenaDemo(ctx, T); ctx.restore();
    primeiroPlano(ctx, c, T);
  };
}
shot(0, 4.0, tomada(T => lerp(760, 920, eio(T, 0, 4)), 580, T => lerp(1.0, 1.08, seg(T, 0, 4))), 0);
shot(4.0, 6.6, tomada(T => trajetoCam(T), 500, T => lerp(1.9, 2.05, seg(T, 4, 6.6))), 0.25);
shot(6.6, 12.6, tomada(T => lerp(900, 930, seg(T, 6.6, 12.6)), 600, T => lerp(1.1, 1.22, seg(T, 6.6, 12.6))), 0.25);
shot(12.6, 15.5, tomada(T => lerp(1040, 1030, seg(T, 12.6, 15.5)), 610, 1.15), 0.25);
shot(15.5, 20, tomada(1042, T => lerp(600, 560, eio(T, 15.5, 20)), T => lerp(1.4, 2.05, eio(T, 15.5, 20))), 0.3);
function trajetoCam() { return 860; }

// ---------------------------------------------------------------- carregamento
window.CARREGAR = async function () {
  await carregarFontes();
  await carregarRigs(['m_preta', 'f_vestido']);
};
function renderAt(ctx, T) {
  T = clamp(T, 0, window.DURACAO_FILME - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let i = SHOTS.findIndex(s => T >= s.t0 && T < s.t1);
  if (i < 0) i = SHOTS.length - 1;
  const s = SHOTS[i];
  ctx.save(); s.draw(ctx, T); ctx.restore();
  vignette(ctx, 0.3);
  fade(ctx, 1 - seg(T, 0, 0.6));
  fade(ctx, seg(T, 19.4, 20));
}
