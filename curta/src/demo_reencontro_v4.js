'use strict';
// =====================================================================
//  DEMONSTRAÇÃO v4 (20 s) — O REENCONTRO em PERFIL, com a arte recebida.
//  Caminhada dele: 8 quadros da folha (quadro escolhido pela distância).
//  Espera, celular, sentar, levantar, abraço e beijo: rig de perfil com IK.
// =====================================================================
window.DURACAO_FILME = 20;
const SHOTS = [];
function shot(t0, t1, draw) { SHOTS.push({ t0, t1, draw }); }
const EH = 560, FH = 465;
const CHAO = PREDIO.calcada;
const XE_ESPERA = 640, XE_ABRACO = 905, XF_PORTA = 1320, XF_ABRACO = 988;
const PASSO_E = 0.74 * EH;                    // distância de um ciclo de 8 quadros
const K = (T, keys) => kf(T, keys, smooth);
const KE = (T, keys) => kf(T, keys, easeInOut);

// ---------------------------------------------------------------- caminhada dele (sprites)
function andarEle(T) {
  let x, d0, d1, t0, t1;
  if (T < 3.2) { x = KE(T, [[0, -180], [3.0, XE_ESPERA]]); d0 = -180; d1 = XE_ESPERA; }
  else { x = KE(T, [[12.25, XE_ESPERA], [14.55, XE_ABRACO]]); d0 = XE_ESPERA; d1 = XE_ABRACO; }
  // fase alinhada para terminar num quadro de pés juntos (q8)
  const total = (d1 - d0) / PASSO_E;
  const off = 7.4 / 8 - (total % 1);
  return { x, fase: (x - d0) / PASSO_E + off };
}
// mistura sprite ↔ rig
function pesoSprite(T) {
  return K(T, [[0, 1], [2.85, 1], [3.15, 0], [12.15, 0], [12.35, 1], [14.4, 1], [14.65, 0], [20, 0]]);
}

// ---------------------------------------------------------------- ELE (rig)
let ANK = null; // tornozelos em repouso (coordenadas locais do rig)
function poseEle(T, x) {
  const p = poseP({ x, y: CHAO, h: EH, flip: 1, zBase: 0 });
  const d = RP.m_perfil.d;
  if (!ANK) ANK = { N: d.partes.peN.pivo, T: d.partes.peT.pivo };
  const s = EH / d.altura;
  const f = { blink: blinkAt(T, 3) };
  // respiração
  const br = Math.sin(T * 1.7);
  addP(p, 'tronco', 'rot', br * 0.008); addP(p, 'cabeca', 'rot', Math.sin(T * 0.8) * 0.015);
  // ---- espera
  const olhaPorta = K(T, [[3.0, 0], [3.5, 1], [3.7, 1], [4.0, 0], [5.6, 0], [6.0, 1], [6.2, 1]]);
  addP(p, 'cabeca', 'rot', -0.07 * olhaPorta);
  const cel = K(T, [[3.7, 0], [4.25, 1], [5.2, 1], [5.65, 0]]);
  if (cel > 0) {
    p.maos.N = [x + 0.19 * EH, CHAO - 0.7 * EH + Math.sin(T * 1.2) * 2];
    p.ik = { maoN: cel };
    p.maoVar.N = cel > 0.45 ? 'celular' : 'relaxada';
    addP(p, 'cabeca', 'rot', 0.2 * cel);
  }
  if (T > 4.6) { f.meio = T > 4.6 && T < 9.9 && T < 10.45 ? 1 : 0; }
  if (T > 4.8 && T < 10.45) f.boca = 'triste';
  // troca de peso entre as pernas
  const pesoK = K(T, [[5.4, 0], [5.8, 1], [6.3, -0.6], [6.6, 0]]);
  addP(p, 'quadril', 'dx', 10 * pesoK); p.lean = (p.lean || 0) - 0.015 * pesoK;
  // ---- suspiro
  const sus = Math.sin(seg(T, 6.4, 7.1) * Math.PI);
  addP(p, 'tronco', 'dy', -12 * sus); addP(p, 'cabeca', 'dy', -6 * sus);
  if (T > 6.7 && T < 7.05) f.blink = 1;
  // ---- sentar (6.9–8.4) e levantar (11.0–12.2)
  const desce = kf(T, [[6.9, 0], [7.15, -0.04], [8.25, 1.03], [8.5, 1.0], [11.25, 1.0], [11.4, 1.0], [12.05, -0.03], [12.25, 0]], easeInOut);
  const DROP = 285;
  if (desce !== 0) {
    addP(p, 'quadril', 'dy', DROP * desce);
    const frente = clamp(desce) * 115;
    for (const lado of ['N', 'T']) {
      const a = ANK[lado];
      p.pes[lado] = [x + (a[0] - d.cx + frente + (lado === 'T' ? -14 : 0)) * s, CHAO - (d.pes - a[1]) * s];
    }
    p.ik = Object.assign(p.ik || {}, { peN: 1, peT: 1 });
  }
  // inclinação do tronco: ao descer, sentado, e antecipação ao levantar
  const incl = 0.32 * Math.sin(seg(T, 6.95, 8.4) * Math.PI) + 0.16 * K(T, [[7.8, 0], [8.3, 1], [11.0, 1], [11.3, 1.9], [11.7, 2.0], [12.1, 0]]);
  addP(p, 'tronco', 'rot', incl);
  // mãos nos joelhos
  const apoio = K(T, [[7.4, 0], [8.2, 1], [11.75, 1], [12.0, 0]]);
  if (apoio > 0) {
    const tmp = poseP(JSON.parse(JSON.stringify({ x: p.x, y: p.y, h: p.h, flip: 1, lean: p.lean, parts: p.parts, pes: p.pes, ik: p.ik })));
    resolverP('m_perfil', tmp);
    const pts = ptsP('m_perfil', tmp);
    p.maos.N = [pts.joelhoN.x + 6, pts.joelhoN.y - 4];
    p.maos.T = [pts.joelhoT.x + 2, pts.joelhoT.y - 2];
    p.ik = Object.assign(p.ik || {}, { maoN: apoio, maoT: apoio });
    p.maoVar = { N: 'relaxada', T: 'relaxada' };
  }
  // cabeça baixa (desânimo) e reação ao vê-la
  const baixa = K(T, [[8.4, 0], [9.9, 1], [10.45, 1], [10.85, 0]]);
  addP(p, 'cabeca', 'rot', 0.3 * baixa); addP(p, 'cabeca', 'dy', 10 * baixa);
  if (T > 10.45 && T < 14.6) {
    f.meio = 0;
    f.boca = T < 10.9 ? 'o' : 'sorriso_aberto';
    f.brilho = K(T, [[10.7, 0], [10.95, 1], [14, 1]]);
    addP(p, 'cabeca', 'rot', -0.06 * K(T, [[10.45, 0], [10.8, 1], [11.0, 0.4]]));
  }
  return { p, f };
}

// ---------------------------------------------------------------- ELA (rig)
function poseEla(T) {
  const x = KE(T, [[0, XF_PORTA], [12.4, XF_PORTA], [14.75, XF_ABRACO], [20, XF_ABRACO]]);
  const degrau = PREDIO.porta[1] + PREDIO.porta[3] + 12;
  const y = lerp(degrau, CHAO, K(T, [[10.0, 0], [10.45, 1]]));
  const p = poseP({ x, y, h: FH, flip: -1, zBase: 1 });
  const f = { blink: blinkAt(T, 5), boca: 'sorriso_aberto', brilho: 1, blush: 0.5 };
  addP(p, 'tronco', 'rot', Math.sin(T * 1.6 + 2) * 0.008);
  addP(p, 'cabeca', 'rot', Math.sin(T * 0.7 + 1) * 0.02);
  // passinho para fora da porta
  const sai = Math.sin(seg(T, 10.0, 10.45) * Math.PI);
  p.bob = sai * 14;
  addP(p, 'pernaN', 'rot', -0.2 * sai); addP(p, 'pernaN', 'dy', -18 * sai);
  // caminhada: pernas alternadas, braços acompanham, desacelera ao chegar
  const dt = 0.04, v = Math.abs(KE(T + dt, [[12.4, XF_PORTA], [14.75, XF_ABRACO]]) - KE(T - dt, [[12.4, XF_PORTA], [14.75, XF_ABRACO]])) / (2 * dt);
  const amp = smooth(clamp(v / (FH * 0.28)));
  const fase = (XF_PORTA - x) / (FH * 0.34) * Math.PI;
  const sw = Math.sin(fase) * amp;
  addP(p, 'pernaN', 'rot', -0.26 * sw); addP(p, 'pernaT', 'rot', 0.26 * sw);
  addP(p, 'pernaN', 'dy', -30 * Math.max(0, sw)); addP(p, 'pernaT', 'dy', -30 * Math.max(0, -sw));
  addP(p, 'bracoN', 'rot', 0.22 * sw); addP(p, 'bracoT', 'rot', -0.22 * sw);
  p.bob += Math.abs(Math.sin(fase)) * 0.02 * FH * amp;
  p.lean = 0.03 * amp;
  return { p, f };
}

// ---------------------------------------------------------------- braços abertos, abraço e beijo
function contato(T, E, F) {
  const abre = K(T, [[14.2, 0], [14.85, 1]]);
  const hug = K(T, [[14.85, 0], [15.35, 1]]);
  if (abre <= 0) return { hug: 0, kiss: 0 };
  const sE = EH / RP.m_perfil.d.altura;
  // braços abertos para a frente
  E.p.maos.N = [E.p.x + 0.27 * EH, CHAO - 0.6 * EH];
  E.p.maos.T = [E.p.x + 0.22 * EH, CHAO - 0.64 * EH];
  F.p.maos.N = [F.p.x - 0.27 * FH, CHAO - 0.6 * FH];
  F.p.maos.T = [F.p.x - 0.22 * FH, CHAO - 0.64 * FH];
  E.p.ik = { maoN: abre, maoT: abre }; F.p.ik = { maoN: abre, maoT: abre };
  E.p.maoVar = { N: 'aberta', T: 'aberta' };
  if (hug <= 0) return { hug: 0, kiss: 0 };
  const recosta = K(T, [[15.0, 0], [15.6, 1], [17.0, 1], [17.5, 0], [18.8, 0], [19.4, 0.5]]);
  const afasta = K(T, [[17.0, 0], [17.5, 1], [17.7, 1], [18.2, 0]]);
  const beijo = K(T, [[17.6, 0], [18.25, 1], [18.9, 1], [19.4, 0.35]]);
  const sway = Math.sin((T - 15.0) * 1.7) * 0.012 * hug;
  E.p.lean = 0.05 * hug - 0.04 * afasta + 0.08 * beijo + sway;
  F.p.lean = 0.05 * hug * (0.6 + 0.4 * recosta) - sway;
  addP(E.p, 'tronco', 'rot', 0.06 * beijo);
  addP(E.p, 'cabeca', 'rot', 0.16 * hug - 0.2 * afasta + 0.3 * beijo);
  addP(F.p, 'cabeca', 'rot', 0.18 * recosta - 0.2 * afasta - 0.24 * beijo);
  F.p.lean -= 0.03 * beijo;
  // mãos nas costas do outro (o braço da frente passa por cima do corpo do outro)
  const pf = ptsP('f_perfil', Object.assign(poseP({}), F.p, { _M: null }));
  const pm = ptsP('m_perfil', Object.assign(poseP({}), E.p, { _M: null }));
  const mix2 = (a, b, k) => [lerp(a[0], b.x, k), lerp(a[1], b.y, k)];
  E.p.maos.N = mix2(E.p.maos.N, { x: pf.costas.x - 8, y: pf.costas.y - 30 }, hug);
  E.p.maos.T = mix2(E.p.maos.T, { x: pf.costas.x - 20, y: pf.costas.y + 10 }, hug);
  F.p.maos.N = mix2(F.p.maos.N, { x: pm.costas.x + 10, y: pm.costas.y + 10 }, hug);
  F.p.maos.T = mix2(F.p.maos.T, { x: pm.costas.x + 22, y: pm.costas.y - 20 }, hug);
  E.p.z.bracoN = 1.92; E.p.z.antebracoN = 1.93; E.p.z.maoN = 1.94;
  F.p.z.bracoT = -0.3; F.p.z.antebracoT = -0.29;
  E.p.z.cabeca = 2.2; E.p.z.pescoco = 0.3;
  // rostos
  E.f = { blink: 0, fechado: (afasta > 0.5 && beijo < 0.4) ? 0 : 1, boca: beijo > 0.5 ? 'o' : 'sorriso', blush: 0.5, brilho: afasta };
  F.f = { blink: 0, fechado: afasta > 0.5 ? 0 : 1, boca: afasta > 0.5 ? 'sorriso_aberto' : 'sorriso', blush: 0.6 + 0.3 * beijo, brilho: afasta };
  // beijo: leva a boca dele até a testa dela (correção fina na cabeça)
  if (beijo > 0) {
    const pm2 = ptsP('m_perfil', Object.assign(poseP({}), E.p, { _M: null }));
    const pf2 = ptsP('f_perfil', Object.assign(poseP({}), F.p, { _M: null }));
    const dx = clamp((pf2.testa.x + 6 - pm2.boca.x) / sE, -40, 40), dy = clamp((pf2.testa.y - 16 - pm2.boca.y) / sE, -40, 40);
    addP(E.p, 'cabeca', 'dx', dx * beijo); addP(E.p, 'cabeca', 'dy', dy * beijo);
  }
  return { hug, kiss: beijo };
}

// ---------------------------------------------------------------- cena
function estado(T) {
  const a = andarEle(T);
  const E = poseEle(T, a.x);
  const F = T >= 9.6 ? poseEla(T) : null;
  const c = F ? contato(T, E, F) : { hug: 0, kiss: 0 };
  E.p.face = E.f; if (F) F.p.face = F.f;
  return { a, E, F, c, ws: pesoSprite(T) };
}
function cena(ctx, T, st) {
  const noite = 0.3 + clamp(seg(T, 0, 10) * 0.3);
  const porta = K(T, [[9.6, 0], [10.0, 1], [11.5, 1], [12.5, 0.15]]);
  predio._dentro = st.F && T < 10.2 ? (c) => {
    const [x, y, w, h] = PREDIO.porta;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalAlpha *= K(T, [[9.65, 0], [9.95, 1]]);
    drawP(c, [['f_perfil', st.F.p]]);
    c.restore();
  } : null;
  predio(ctx, T + 88, porta, noite);
  predio._dentro = null;
  if (porta > 0) { const [x, y, w, h] = PREDIO.porta; glow(ctx, x + w / 2, y + h, 420, '#ffe6b0', 0.3 * porta); }
  const lista = [];
  const ws = st.ws;
  if (ws < 1) { st.E.p.alpha = 1 - ws; lista.push(['m_perfil', st.E.p]); }
  if (st.F && T >= 10.2) lista.push(['f_perfil', st.F.p]);
  // sombra no chão
  for (const [n, p] of lista) { ctx.save(); ctx.globalAlpha *= 0.22 * (p.alpha == null ? 1 : p.alpha); ellipse(ctx, p.x + (n === 'm_perfil' ? 10 : -10), CHAO + 2, p.h * 0.2, 12, 0, '#000'); ctx.restore(); }
  const pts = lista.length ? drawP(ctx, lista) : [];
  if (ws > 0) {
    ctx.save(); ctx.globalAlpha *= 0.22 * ws; ellipse(ctx, st.a.x + 10, CHAO + 2, EH * 0.2, 12, 0, '#000'); ctx.restore();
    drawSpriteAndar(ctx, st.a.x, CHAO, EH, st.a.fase, 1, ws);
  }
  if (st.c.hug > 0.6 && st.F) floatHearts(ctx, T, 15.4, 17.2, (st.a.x + st.F.p.x) / 2, CHAO - 0.95 * EH, { n: 7, spread: 200, size: 26, seed: 61 });
  if (st.c.kiss > 0.8 && pts.length > 1) {
    const f = pts[pts.length - 1].testa;
    floatHearts(ctx, T, 18.2, 19.8, f.x, f.y - 30, { n: 6, spread: 110, size: 22, seed: 71 });
    sparkles(ctx, T, 18.2, 19.3, f.x, f.y, { n: 9, spread: 130, size: 12 });
  }
  return pts;
}
function primeiroPlano(ctx, camX, camY, z, T) {
  ctx.save();
  ctx.translate(-(camX - 960) * 0.45 * z, -(camY - 560) * 0.2);
  for (const [bx, by, r, c] of [[-60, 1100, 200, '#1c3524'], [140, 1130, 160, '#26432c'], [1880, 1110, 210, '#1c3524'], [2080, 1090, 170, '#26432c']]) {
    for (let i = 0; i < 6; i++) circle(ctx, bx + Math.cos(i * 1.7) * r * 0.6 + Math.sin(T * 1.2 + i) * 5, by - Math.abs(Math.sin(i * 2.1)) * r * 0.6, r * 0.5, c);
  }
  ctx.restore();
}
function tomada(camFn) {
  return (ctx, T) => {
    const st = estado(T);
    const [cx, cy, z] = camFn(T, st);
    ctx.save(); camera(ctx, cx, cy, z); cena(ctx, T, st); ctx.restore();
    primeiroPlano(ctx, cx, cy, z, T);
  };
}
const cabecaEle = (st) => ptsP('m_perfil', Object.assign(poseP({}), st.E.p, { _M: null })).olho;
shot(0, 3.2, tomada(T => [lerp(560, 760, eio(T, 0, 3.2)), 580, 1.05]));
shot(3.2, 6.3, tomada(T => [XE_ESPERA + 40, CHAO - 0.56 * EH, lerp(1.7, 1.8, seg(T, 3.2, 6.3))]));
shot(6.3, 9.6, tomada(T => [XE_ESPERA + 90, lerp(650, 670, seg(T, 6.3, 9.6)), 1.35]));
shot(9.6, 10.45, tomada(T => [1250, 610, 1.4]));
shot(10.45, 11.1, tomada((T, st) => { const h = cabecaEle(st); return [h.x - 10, h.y + 40, 2.6]; }));
shot(11.1, 14.75, tomada(T => [lerp(840, 870, seg(T, 11.1, 14.75)), 600, 1.12]));
shot(14.75, 17.4, tomada(T => [(XE_ABRACO + XF_ABRACO) / 2, CHAO - 0.6 * EH, lerp(1.75, 1.85, seg(T, 14.75, 17.4))]));
shot(17.4, 20, tomada(T => [(XE_ABRACO + XF_ABRACO) / 2 + 10, CHAO - 0.78 * EH, lerp(2.45, 2.6, seg(T, 17.4, 20))]));

window.CARREGAR = async function () {
  await carregarFontes();
  await carregarPerfil(['m_perfil', 'f_perfil']);
};
function renderAt(ctx, T) {
  T = clamp(T, 0, window.DURACAO_FILME - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let i = SHOTS.findIndex(s => T >= s.t0 && T < s.t1);
  if (i < 0) i = SHOTS.length - 1;
  ctx.save(); SHOTS[i].draw(ctx, T); ctx.restore();
  vignette(ctx, 0.3);
  fade(ctx, 1 - seg(T, 0, 0.6));
  fade(ctx, seg(T, 19.3, 20));
}
