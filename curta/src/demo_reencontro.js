'use strict';
// =====================================================================
//  DEMONSTRAÇÃO v2 (20 s) — O REENCONTRO, com personagens articulados.
//  Parte 1 Esperando (0–5.6) · Parte 2 Sentando (5.6–9.6)
//  Parte 3 Ela aparece (9.6–12.4) · Parte 4 Reencontro (12.4–16.2)
//  Parte 5 Beijo na testa (16.2–20)
// =====================================================================
window.DURACAO_FILME = 20;
const SHOTS = [];
function shot(t0, t1, draw, xf = 0.15) { SHOTS.push({ t0, t1, draw, xf }); }
const EH = 545, FH = 455;
const CHAO = PREDIO.calcada;   // pés na calçada
const RUA_SENTADO = 1004;      // pés na rua quando sentado no meio-fio
const XE = [[0, 820], [12.45, 820], [14.75, 990], [20, 990]];
const XF = [[0, 1320], [12.7, 1320], [14.8, 1108], [20, 1108]];

// Caminhada guiada pela distância percorrida: passos desaceleram junto com o corpo
function caminhada(T, keys, h) {
  const x = kf(T, keys, easeInOut);
  const dt = 0.04;
  const v = (kf(T + dt, keys, easeInOut) - kf(T - dt, keys, easeInOut)) / (2 * dt);
  const amp = smooth(clamp(Math.abs(v) / (h * 0.24)));
  const fase = (x - keys[0][1]) / (h * 0.13) * Math.PI;
  return { x, amp, fase, v };
}
const K = (T, keys) => kf(T, keys, smooth);

// ---------------------------------------------------------------- ELE
function estadoEle(T) {
  const wk = caminhada(T, XE, EH);
  const k = K(T, [[6.4, 0], [7.0, 0.22], [7.75, 1.05], [8.05, 1.0], [11.1, 1.0], [11.65, 0.6], [12.2, -0.04], [12.45, 0]]);
  const sit = clamp(k, 0, 1.05);
  const p = novaPose({ x: wk.x, y: lerp(CHAO, RUA_SENTADO, clamp(k, 0, 1)), h: EH, zBase: 0 });
  respirar(p, T, 1, 0);
  peso(p, 'm_preta', K(T, [[0, 0.55], [3.9, 0.55], [4.6, -0.7], [5.6, -0.45], [6.3, 0]]));
  andar(p, 'm_preta', wk.fase, wk.amp, false);
  if (k < 0) addPart(p, 'tronco', 'dy', k * 120); // estica ao terminar de levantar
  const f = { blink: blinkAt(T, 3), mouth: 'smile', look: [0.85, -0.05] };

  // Parte 1 — olha a porta, consulta o celular, muda o peso, preocupa-se
  const cel = K(T, [[1.6, 0], [2.15, 1], [3.35, 1], [3.9, 0]]);
  if (cel > 0) {
    p.maoFora.D = clamp(cel * 1.6); p.ik = { D: cel };
    p.maos.D = [wk.x + 0.05 * EH, CHAO - 0.47 * EH + Math.sin(T * 1.3) * 3];
    p.dedos = { D: 0.15 + 0.25 * Math.max(0, Math.sin(T * 14)) * (T > 2.4 && T < 3.0 ? 1 : 0) };
    f.look = [lerp(0.85, 0.2, cel), lerp(-0.05, 0.95, cel)];
    addPart(p, 'cabeca', 'dy', 22 * cel); addPart(p, 'cabeca', 'rot', 0.09 * cel);
    addPart(p, 'tronco', 'rot', 0.012 * cel);
    if (T > 2.6) { f.mouth = 'flat'; f.browSad = 0.35 * cel; f.sad = 0.25 * cel; }
  }
  if (T >= 3.9 && T < 5.6) {
    const a = sm(T, 3.9, 4.3);
    f.look = [0.92, -0.08]; f.browUp = 0.35 * (1 - sm(T, 4.6, 5.0));
    addPart(p, 'cabeca', 'rot', 0.05 * a); p.lean = 0.02 * a;
    if (T > 4.7) {
      const w = sm(T, 4.7, 5.1);
      f.browSad = 0.8 * w; f.sad = 0.4 * w; f.mouth = 'sad';
      addPart(p, 'cabeca', 'rot', Math.sin((T - 4.9) * 8) * 0.03 * Math.sin(seg(T, 4.9, 5.5) * Math.PI));
    }
  }
  // Parte 2 — suspira, flexiona os joelhos, inclina o tronco, senta, apoia os braços
  if (T >= 5.6 && T < 6.6) {
    const s = Math.sin(seg(T, 5.6, 6.5) * Math.PI);
    addPart(p, 'tronco', 'dy', -14 * s); addPart(p, 'cabeca', 'dy', -8 * s);
    f.blink = T > 5.95 && T < 6.3 ? 1 : f.blink; f.mouth = T > 6.0 && T < 6.4 ? 'o' : 'sad'; f.open = 0.35;
    f.browSad = 0.8; f.sad = 0.45; f.look = [0.3, 0.5];
  }
  if (T >= 6.4) {
    const inclina = Math.sin(seg(T, 6.4, 8.0) * Math.PI) * (T < 11 ? 1 : 0);
    addPart(p, 'tronco', 'dy', 16 * inclina); addPart(p, 'cabeca', 'dy', 14 * inclina);
  }
  if (sit > 0.01) {
    sentar(p, 'm_preta', Math.min(1, sit));
    const tmp = matrizes('m_preta', p);
    const jE = tmp.canelaE.transformPoint(new DOMPoint(400, 1185)), jD = tmp.canelaD.transformPoint(new DOMPoint(595, 1185));
    const apoio = K(T, [[7.4, 0], [8.2, 1], [11.7, 1], [12.0, 0]]);
    p.maoFora.E = p.maoFora.D = Math.max(apoio, p.maoFora.D || 0);
    p.ik = { E: apoio, D: Math.max(apoio, (p.ik || {}).D || 0) };
    p.maos.E = [jE.x + 8, jE.y + 2]; p.maos.D = [jD.x - 8, jD.y + 2];
    p.dedos = { E: 0.05, D: 0.05 };
    const baixa = K(T, [[8.1, 0], [9.6, 1], [10.4, 1], [10.85, 0]]);
    addPart(p, 'cabeca', 'dy', 30 * baixa); addPart(p, 'cabeca', 'rot', 0.08 * baixa);
    if (T < 10.4) {
      f.look = [0.1, 0.9]; f.sad = 0.65; f.browSad = 1; f.mouth = 'sad';
      if (T > 9.0 && T < 9.45) f.blink = 1;
    }
  }
  // Parte 3 — percebe, olhos se iluminam, apoia-se e levanta
  if (T >= 10.4 && T < 12.45) {
    const v = sm(T, 10.4, 10.85), luz = sm(T, 10.85, 11.15);
    f.look = [lerp(0.1, 0.85, v), lerp(0.9, -0.35, v)];
    f.sad = 0.65 * (1 - v); f.browSad = 1 - v; f.browUp = 0.9 * luz * (1 - sm(T, 11.8, 12.4));
    f.iris = 1 + 0.14 * luz; f.sparkle = luz;
    f.mouth = T < 10.85 ? 'sad' : T < 11.3 ? 'o' : 'laugh'; f.open = 0.65;
    if (T > 11.1) { const imp = Math.sin(seg(T, 11.1, 11.7) * Math.PI); addPart(p, 'tronco', 'dy', 18 * imp); addPart(p, 'cabeca', 'dy', 10 * imp); }
  }
  // Parte 4 — caminha até ela, abre os braços
  if (T >= 11.9 && T < 14.75) {
    const solta = sm(T, 11.9, 12.35);
    p.maoFora.E = p.maoFora.D = Math.max(solta, p.maoFora.E || 0);
    const abre = sm(T, 13.9, 14.6);
    const sw = Math.sin(wk.fase) * wk.amp;
    p.ik = { E: Math.max(solta, (p.ik || {}).E || 0), D: Math.max(solta, (p.ik || {}).D || 0) };
    const by = p.y - (p.bob || 0);
    p.maos.E = [wk.x - lerp(0.13, 0.34, abre) * EH + sw * 22, by - lerp(0.36, 0.52, abre) * EH - Math.abs(sw) * 10];
    p.maos.D = [wk.x + lerp(0.13, 0.36, abre) * EH + sw * 22, by - lerp(0.36, 0.54, abre) * EH - Math.abs(sw) * 10];
    p.dedos = { E: 0.3 + 0.5 * abre, D: 0.3 + 0.5 * abre };
    addPart(p, 'tronco', 'rot', -0.02 * sw);
    f.look = [0.85, -0.12]; f.mouth = 'laugh'; f.open = 0.55; f.sparkle = 1; f.iris = 1.12; f.blush = 0.4 * abre;
  }
  return { p, f };
}

// ---------------------------------------------------------------- ELA
function estadoEla(T) {
  const wk = caminhada(T, XF, FH);
  const degrau = PREDIO.porta[1] + PREDIO.porta[3] + 12;
  const y = lerp(degrau, CHAO, sm(T, 12.8, 13.3));
  const p = novaPose({ x: wk.x, y, h: FH, zBase: 1 });
  respirar(p, T, 1, 2);
  andar(p, 'f_vestido', wk.fase + 1, wk.amp, false);
  // passinho para fora da porta
  const sai = Math.sin(seg(T, 10.25, 10.75) * Math.PI);
  p.bob = (p.bob || 0) + sai * 10;
  p.unidas = 1 - sm(T, 13.6, 14.1);
  const f = { blink: blinkAt(T, 5), mouth: 'smile', look: [-0.6, 0.05], blush: 0.5 };
  if (T < 11.0) { f.look = [K(T, [[10.2, 0.4], [10.6, -0.3], [11.0, -0.85]]), 0.15]; f.mouth = 'smile'; }
  else { f.mouth = 'laugh'; f.open = 0.6; f.sparkle = 1; f.iris = 1.1; f.look = [-0.85, 0.05]; }
  if (T > 11.0 && T < 13.0) addPart(p, 'cabeca', 'rot', -0.06 * Math.sin(seg(T, 11.0, 11.8) * Math.PI));
  const abre = sm(T, 13.9, 14.6);
  if (T > 13.6 && T < 14.8) {
    p.ik = { E: sm(T, 13.6, 14.1), D: sm(T, 13.6, 14.1) };
    const by = p.y - (p.bob || 0);
    p.maos.E = [wk.x - lerp(0.12, 0.33, abre) * FH, by - lerp(0.38, 0.55, abre) * FH];
    p.maos.D = [wk.x + lerp(0.12, 0.3, abre) * FH, by - lerp(0.38, 0.5, abre) * FH];
    p.dedos = { E: 0.6 * abre, D: 0.6 * abre };
  }
  return { p, f };
}

// ---------------------------------------------------------------- abraço e beijo (contato)
function interacao(T, E, F) {
  const hug = sm(T, 14.6, 15.2);
  if (hug <= 0) return { hug: 0, kiss: 0 };
  const recosta = K(T, [[14.9, 0], [15.4, 1], [16.6, 1], [17.1, 0.15], [20, 0.15]]);  // ela encosta a cabeça
  const afasta = K(T, [[16.2, 0], [16.8, 1], [20, 1]]);                                 // ele afasta a cabeça
  const kiss = K(T, [[17.2, 0], [18.0, 1], [18.9, 1], [19.5, 0.6], [20, 0.6]]);           // inclina e beija
  const sway = Math.sin((T - 14.6) * 1.8) * 0.018 * hug;
  E.p.x += 20 * kiss; F.p.x -= 15 * kiss;
  E.p.lean = (E.p.lean || 0) + 0.035 * hug + sway + 0.06 * kiss;
  F.p.lean = (F.p.lean || 0) - 0.06 * hug * (0.5 + 0.5 * recosta) + sway - 0.02 * kiss;
  // pontos do corpo do outro (para as mãos realmente envolverem)
  const pe = pontos('f_vestido', Object.assign(novaPose({}), F.p, { _M: null }));
  const pm = pontos('m_preta', Object.assign(novaPose({}), E.p, { _M: null }));
  // ELE: braço direito por trás das costas dela (mão aparece no lado de lá), braço esquerdo sobre o ombro dela
  E.p.maoFora.E = E.p.maoFora.D = 1;
  E.p.ik = { E: hug, D: hug };
  E.p.maos.D = [lerp(E.p.maos.D ? E.p.maos.D[0] : pe.ombroD.x, pe.ombroD.x - 6, hug), lerp(E.p.maos.D ? E.p.maos.D[1] : pe.ombroD.y, pe.ombroD.y + 95, hug)];
  E.p.maos.E = [lerp(E.p.maos.E ? E.p.maos.E[0] : pe.ombroE.x, pe.ombroE.x + 34, hug), lerp(E.p.maos.E ? E.p.maos.E[1] : pe.ombroE.y, pe.ombroE.y + 78, hug)];
  E.p.z.bracoD = 0.95; E.p.z.antebracoD = 0.96; E.p.z.maoD = 2.0;
  E.p.z.antebracoE = 1.43; E.p.z.maoE = 1.44;
  E.p.dedos = { E: 0.35, D: 0.45 };
  // ELA: braço esquerdo em volta das costas dele (por trás), braço direito na cintura dele (entre os dois)
  F.p.unidas = 0;
  F.p.ik = { E: hug, D: hug };
  F.p.maos.E = [lerp(F.p.maos.E ? F.p.maos.E[0] : pm.ombroD.x, pm.ombroD.x - 30, hug), lerp(F.p.maos.E ? F.p.maos.E[1] : pm.ombroD.y, pm.ombroD.y + 120, hug)];
  F.p.maos.D = [lerp(F.p.maos.D ? F.p.maos.D[0] : pm.waist.x, pm.waist.x + 25, hug), lerp(F.p.maos.D ? F.p.maos.D[1] : pm.waist.y, pm.waist.y - 40, hug)];
  F.p.z.bracoE = 0.97; F.p.z.antebracoE = -0.1; F.p.z.maoE = -0.05;
  F.p.z.antebracoD = 0.98; F.p.z.maoD = 0.985;
  F.p.dedos = { E: 0.3, D: 0.35 };
  // rostos
  E.f = { blink: blinkAt(T, 3), mouth: kiss > 0.45 ? 'kiss' : 'smile', blush: 0.55, sparkle: 0.4,
    happyEyes: (T < 16.3 || kiss > 0.55) ? 1 : 0, look: [0.65, 0.75] };
  F.f = { blink: blinkAt(T, 5), mouth: 'smile', blush: 0.6 + 0.3 * kiss, sparkle: 0.7,
    happyEyes: (recosta > 0.5 || kiss > 0.35) ? 1 : 0, look: [-0.7, -0.75] };
  // cabeças: ela encosta no peito dele; ele apoia o queixo, afasta, olha e inclina
  addPart(F.p, 'cabeca', 'rot', -0.3 * recosta - 0.1 * kiss);
  addPart(F.p, 'cabeca', 'dx', -28 * recosta); addPart(F.p, 'cabeca', 'dy', 8 * recosta);
  addPart(E.p, 'cabeca', 'rot', 0.12 * hug * (1 - afasta) - 0.03 * afasta * (1 - kiss) + 0.24 * kiss);
  addPart(E.p, 'cabeca', 'dy', -8 * afasta * (1 - kiss));
  addPart(E.p, 'cabeca', 'dx', 10 * kiss);
  addPart(E.p, 'tronco', 'rot', 0.02 * kiss);
  if (kiss > 0.05) E.p.z.cabeca = 3.0;
  return { hug, kiss, recosta };
}

// ---------------------------------------------------------------- estado completo de um instante
function estado(T) {
  const E = estadoEle(T);
  const F = T >= 9.7 ? estadoEla(T) : null;
  const ia = F ? interacao(T, E, F) : { hug: 0, kiss: 0 };
  E.p.face = E.f; if (F) F.p.face = F.f;
  return { E, F, ia };
}
function cabecaRot(p) { return (p.parts.cabeca || {}).rot || 0; }
// orelhas reagem com atraso (movimento secundário)
function secundario(T, st) {
  const ant = estado(T - 0.12);
  orelhas(st.E.p, (cabecaRot(st.E.p) - cabecaRot(ant.E.p)) / 0.12, ((st.E.p.bob || 0) - (ant.E.p.bob || 0)) / 0.12 + (st.E.p.y - ant.E.p.y) / 0.12 * -1, T);
  if (st.F && ant.F) orelhas(st.F.p, (cabecaRot(st.F.p) - cabecaRot(ant.F.p)) / 0.12, ((st.F.p.bob || 0) - (ant.F.p.bob || 0)) / 0.12, T + 1);
}

// ---------------------------------------------------------------- desenho
function cenaDemo(ctx, T, st) {
  const noite = 0.3 + clamp(seg(T, 0, 10) * 0.3);
  const porta = sm(T, 9.6, 10.1) * (1 - sm(T, 12.8, 13.6) * 0.85);
  const { E, F, ia } = st;
  predio._dentro = F && T < 10.3 ? (c) => {
    const [x, y, w, h] = PREDIO.porta;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalAlpha *= sm(T, 9.7, 10.05);
    drawRig(c, 'f_vestido', F.p);
    c.restore();
  } : null;
  predio(ctx, T + 88, porta, noite);
  predio._dentro = null;
  // luz que sai pela porta
  if (porta > 0) { const [x, y, w, h] = PREDIO.porta; glow(ctx, x + w / 2, y + h, 420, '#ffe6b0', 0.35 * porta); }
  const lista = [['m_preta', E.p]];
  if (F && T >= 10.3) lista.push(['f_vestido', F.p]);
  const pts = drawRigs(ctx, lista);
  // celular na mão
  const mf = E.p.maoFora.D || 0;
  if (T > 1.6 && T < 3.95 && mf > 0.25) {
    const m = pts[0].maoD;
    drawPhone(ctx, m.x - 2, m.y - 28, 40, 0.12, { back: true, glow: 0.4 * mf });
  }
  if (ia.hug > 0.6) floatHearts(ctx, T, 15.0, 17.0, (pts[0].head.x + (pts[1] ? pts[1].head.x : 0)) / 2, pts[0].head.y - 60, { n: 7, spread: 220, size: 28, seed: 61 });
  if (ia.kiss > 0.8 && pts[1]) {
    const f = pts[1].forehead;
    floatHearts(ctx, T, 18.0, 19.6, f.x - 10, f.y - 30, { n: 6, spread: 120, size: 24, seed: 71 });
    sparkles(ctx, T, 17.95, 19.0, f.x - 15, f.y, { n: 9, spread: 140, size: 13 });
  }
  return pts;
}
// primeiro plano (paralaxe): arbustos e poste, mais rápidos que o fundo
function primeiroPlano(ctx, camX, camY, z, T) {
  ctx.save();
  ctx.translate(-(camX - 960) * 0.45 * z, -(camY - 560) * 0.2);
  for (const [bx, by, r, c] of [[-60, 1100, 200, '#1c3524'], [140, 1130, 160, '#26432c'], [1880, 1110, 210, '#1c3524'], [2080, 1090, 170, '#26432c']]) {
    for (let i = 0; i < 6; i++) circle(ctx, bx + Math.cos(i * 1.7) * r * 0.6 + Math.sin(T * 1.2 + i) * 5, by - Math.abs(Math.sin(i * 2.1)) * r * 0.6, r * 0.5, c);
  }
  ctx.restore();
}
// Tomada: a câmera pode seguir um ponto do personagem (com suavidade)
function tomada(camFn) {
  return (ctx, T) => {
    const st = estado(T);
    secundario(T, st);
    const [cx, cy, z] = camFn(T, st);
    ctx.save(); camera(ctx, cx, cy, z); cenaDemo(ctx, T, st); ctx.restore();
    primeiroPlano(ctx, cx, cy, z, T);
  };
}
function cabecaDe(st, quem) {
  const s = quem === 'F' ? st.F : st.E;
  const p = pontos(quem === 'F' ? 'f_vestido' : 'm_preta', Object.assign(novaPose({}), s.p, { _M: null }));
  return p.head;
}
// Plano aberto → médio (celular) → médio-aberto → aberto (sentar) → porta → close (olhos) → aberto → médio (abraço) → close (beijo)
shot(0, 1.6, tomada(T => [lerp(880, 900, seg(T, 0, 1.6)), 570, 1.0]), 0);
shot(1.6, 3.9, tomada(T => [845, 505, 1.95]));
shot(3.9, 5.6, tomada(T => [lerp(930, 950, seg(T, 3.9, 5.6)), 560, 1.32]));
shot(5.6, 9.6, tomada(T => [lerp(880, 870, seg(T, 5.6, 9.6)), lerp(590, 610, seg(T, 5.6, 9.6)), 1.12]));
shot(9.6, 10.85, tomada(T => [1060, 600, 1.12]));
shot(10.85, 11.45, tomada((T, st) => { const h = cabecaDe(st, 'E'); return [h.x + 10, h.y + 20, 2.7]; }));
shot(11.45, 14.6, tomada(T => [lerp(1030, 1045, seg(T, 11.45, 14.6)), 610, 1.12]));
shot(14.6, 17.1, tomada(T => [1048, lerp(600, 590, seg(T, 14.6, 17.1)), 1.55]));
shot(17.1, 20, tomada((T, st) => { const a = cabecaDe(st, 'E'), b = cabecaDe(st, 'F'); return [(a.x + b.x) / 2, (a.y + b.y) / 2 + 40, lerp(2.15, 2.3, seg(T, 17.1, 20))]; }));

// ---------------------------------------------------------------- carregamento e render
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
  ctx.save(); SHOTS[i].draw(ctx, T); ctx.restore();
  vignette(ctx, 0.3);
  fade(ctx, 1 - seg(T, 0, 0.6));
  fade(ctx, seg(T, 19.3, 20));
}
