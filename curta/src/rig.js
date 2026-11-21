'use strict';
// =====================================================================
//  Rig 2D (animação esquelética) feito com PEÇAS RECORTADAS das imagens
//  fornecidas (assets/rig/<personagem>/). Hierarquia:
//   raiz → quadril → tronco → pescoço/cabeça, braço → antebraço → mão
//                  → coxa → canela (ele) | perna (ela, sob a saia)
//  Olhos: fundo + íris móvel (olhar). Pálpebras, boca, blush e lágrimas
//  são pintados por cima (expressao() em personagens.js).
// =====================================================================
const RIG = {};
const DEG = 180 / Math.PI;
const COR_MAO = { m_preta: ['#b05a27', '#d98a52'], f_vestido: ['#8a4520', '#c97a48'] };

async function carregarRigs(nomes) {
  for (const n of nomes) {
    const d = window.RIG_DATA[n];
    const r = { d, img: {}, olhos: [], ordem: [] };
    for (const k in d.partes) r.img[k] = await carregarImagem(`assets/rig/${n}/${k}.png`);
    for (let i = 0; i < d.olhos.length; i++) {
      r.olhos.push({ fundo: await carregarImagem(`assets/rig/${n}/olho${i}_fundo.png`), iris: await carregarImagem(`assets/rig/${n}/olho${i}_iris.png`) });
    }
    // ordem topológica (pais antes dos filhos)
    const vis = new Set(['raiz']);
    while (r.ordem.length < Object.keys(d.partes).length) {
      for (const k in d.partes) if (!vis.has(k) && vis.has(d.partes[k].pai)) { r.ordem.push(k); vis.add(k); }
    }
    RIG[n] = r;
  }
}

// ---------------------------------------------------------------- pose
// pose = { x, y, h, flip, lean, bob, parts:{peça:{rot,dx,dy,sx,sy,alpha}},
//          maos:{E:[wx,wy], D:[wx,wy]}, maoFora:{E:0..1,D:0..1}, unidas (ela),
//          face:{...expressão, look:[x,y], brow:{up,sad}}, z:{peça:z}, zBase }
function novaPose(o) { return Object.assign({ parts: {}, face: {}, maos: {}, maoFora: {}, z: {}, zBase: 0 }, o); }
function part(pose, k, v) { pose.parts[k] = Object.assign(pose.parts[k] || {}, v); return pose; }
function addPart(pose, k, campo, v) { const p = pose.parts[k] || (pose.parts[k] = {}); p[campo] = (p[campo] || 0) + v; }

// Matrizes de cada peça (imagem → mundo da cena)
function matrizes(n, pose, semIK) {
  const r = RIG[n], P = PERS[n], d = r.d;
  const s = (pose.h || 520) / ALTURA_IMG;
  const M = {};
  M.raiz = new DOMMatrix().translate(pose.x, pose.y - (pose.bob || 0)).rotate((pose.lean || 0) * DEG)
    .scale(s * (pose.flip || 1), s).translate(-P.cx, -P.feet);
  for (const k of r.ordem) {
    const p = d.partes[k], t = pose.parts[k] || {};
    M[k] = M[p.pai].translate(p.pivo[0] + (t.dx || 0), p.pivo[1] + (t.dy || 0)).rotate((t.rot || 0) * DEG).translate(-p.pivo[0], -p.pivo[1]);
  }
  return M;
}

// IK de 2 ossos: posiciona a mão (ponta do antebraço) num alvo do mundo
function resolverIK(n, pose) {
  const d = RIG[n].d;
  for (const lado of ['E', 'D']) {
    const alvo = pose.maos[lado];
    if (!alvo) continue;
    const M = matrizes(n, pose);
    const b = d.partes['braco' + lado], a = d.partes['antebraco' + lado];
    const S = b.pivo, E = a.pivo, Wr = a.ponta;
    const loc = M.tronco.inverse().transformPoint(new DOMPoint(alvo[0], alvo[1]));
    const L1 = Math.hypot(E[0] - S[0], E[1] - S[1]), L2 = Math.hypot(Wr[0] - E[0], Wr[1] - E[1]);
    let dx = loc.x - S[0], dy = loc.y - S[1], dd = Math.hypot(dx, dy);
    const maxd = (L1 + L2) * 0.995;
    if (dd > maxd) { dx *= maxd / dd; dy *= maxd / dd; dd = maxd; }
    dd = Math.max(dd, Math.abs(L1 - L2) + 5);
    const th = Math.atan2(dy, dx);
    const al = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
    // cotovelo para fora do corpo
    const c1 = [S[0] + L1 * Math.cos(th + al), S[1] + L1 * Math.sin(th + al)];
    const c2 = [S[0] + L1 * Math.cos(th - al), S[1] + L1 * Math.sin(th - al)];
    const fora = lado === 'E' ? (c1[0] < c2[0] ? c1 : c2) : (c1[0] > c2[0] ? c1 : c2);
    const restUp = Math.atan2(E[1] - S[1], E[0] - S[0]);
    const newUp = Math.atan2(fora[1] - S[1], fora[0] - S[0]);
    const r1 = newUp - restUp;
    const restFo = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
    const newFo = Math.atan2(S[1] + dy - fora[1], S[0] + dx - fora[0]);
    const k = pose.ik == null ? 1 : (pose.ik[lado] == null ? 1 : pose.ik[lado]);
    const rb = (pose.parts['braco' + lado] || {}).rot || 0, ra = (pose.parts['antebraco' + lado] || {}).rot || 0;
    part(pose, 'braco' + lado, { rot: lerp(rb, angNorm(r1), k) });
    part(pose, 'antebraco' + lado, { rot: lerp(ra, angNorm(newFo - restFo - r1), k) });
  }
}
function angNorm(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

// Gera a lista de operações de desenho (para misturar 2 personagens por z)
function rigOps(n, pose) {
  resolverIK(n, pose);
  const r = RIG[n], d = r.d, P = PERS[n];
  const M = matrizes(n, pose);
  const ops = [];
  const zb = pose.zBase || 0;
  for (const k of r.ordem) {
    const p = d.partes[k], t = pose.parts[k] || {};
    if (k === 'maos' && (pose.unidas == null ? 1 : pose.unidas) < 0.02) continue;
    const z = zb + (pose.z[k] != null ? pose.z[k] : p.z / 100);
    ops.push({ z, draw: (ctx, base) => {
      ctx.save();
      const m = base.multiply(k === 'maos' ? M.antebracoD : M[k]);
      ctx.setTransform(m);
      if (t.sx || t.sy) { ctx.translate(p.pivo[0], p.pivo[1]); ctx.scale(t.sx || 1, t.sy || 1); ctx.translate(-p.pivo[0], -p.pivo[1]); }
      let a = t.alpha == null ? 1 : t.alpha;
      if (k === 'maos') a *= pose.unidas == null ? 1 : pose.unidas;
      ctx.globalAlpha *= a;
      ctx.drawImage(r.img[k], p.x, p.y);
      if (k === 'cabeca') rosto(ctx, n, pose);
      ctx.restore();
    } });
    // mãos (patinhas) na ponta do antebraço
    if (k.startsWith('antebraco')) {
      const lado = k.slice(-1);
      const fora = n === 'f_vestido' ? 1 - (pose.unidas == null ? 1 : pose.unidas) : (pose.maoFora[lado] || 0);
      if (fora > 0.02) {
        const zm = zb + (pose.z['mao' + lado] != null ? pose.z['mao' + lado] : (pose.z[k] != null ? pose.z[k] - zb : p.z / 100) + 0.001);
        ops.push({ z: zm, draw: (ctx, base) => {
          ctx.save(); ctx.setTransform(base.multiply(M[k]));
          ctx.globalAlpha *= clamp(fora * 1.5);
          const ang = Math.atan2(p.ponta[1] - p.pivo[1], p.ponta[0] - p.pivo[0]) - Math.PI / 2;
          const sc = n === 'f_vestido' ? 1.0 : 1.15;
          patinha(ctx, p.ponta[0], p.ponta[1] + 6, 46 * sc, ang, COR_MAO[n], lado, (pose.dedos || {})[lado] || 0, n === 'f_vestido' && lado === 'D');
          ctx.restore();
        } });
      }
    }
  }
  pose._M = M;
  return ops;
}
// Desenha um personagem sozinho
function drawRig(ctx, n, pose) {
  const base = ctx.getTransform();
  const ops = rigOps(n, pose).sort((a, b) => a.z - b.z);
  for (const o of ops) o.draw(ctx, base);
  return pontos(n, pose);
}
// Desenha vários personagens intercalando as peças por profundidade
function drawRigs(ctx, lista) {
  const base = ctx.getTransform();
  let ops = [];
  for (const [n, pose] of lista) ops = ops.concat(rigOps(n, pose));
  ops.sort((a, b) => a.z - b.z);
  for (const o of ops) o.draw(ctx, base);
  return lista.map(([n, pose]) => pontos(n, pose));
}
// Pontos úteis no mundo (para câmera, objetos e interação)
function pontos(n, pose) {
  const M = pose._M || matrizes(n, pose), P = PERS[n], d = RIG[n].d;
  const pt = (m, x, y) => m.transformPoint(new DOMPoint(x, y));
  const out = {
    head: pt(M.cabeca, P.mouth[0], (P.eyes[0][1] + P.mouth[1]) / 2),
    mouth: pt(M.cabeca, P.mouth[0], P.mouth[1]),
    forehead: pt(M.cabeca, (P.eyes[0][0] + P.eyes[1][0]) / 2, P.eyes[0][1] - 85),
    chest: pt(M.tronco, P.cx, P.neck + 170),
    waist: pt(M.tronco, P.cx, n === 'f_vestido' ? 780 : 860),
    ombroE: pt(M.tronco, d.partes.bracoE.pivo[0], d.partes.bracoE.pivo[1]),
    ombroD: pt(M.tronco, d.partes.bracoD.pivo[0], d.partes.bracoD.pivo[1]),
    maoE: pt(M.antebracoE, ...d.partes.antebracoE.ponta),
    maoD: pt(M.antebracoD, ...d.partes.antebracoD.ponta),
  };
  if (d.partes.canelaE) { out.joelhoE = pt(M.canelaE, ...d.partes.canelaE.pivo); out.joelhoD = pt(M.canelaD, ...d.partes.canelaD.pivo); }
  return out;
}

// Rosto: olhos com íris móvel, sobrancelhas e expressões
function rosto(ctx, n, pose) {
  const r = RIG[n], d = r.d, P = PERS[n], f = pose.face || {};
  const look = f.look || [0, 0];
  d.olhos.forEach((o, i) => {
    const im = r.olhos[i];
    ctx.drawImage(im.fundo, o.fundo.x, o.fundo.y);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(o.cx, o.cy, o.rx * 0.97, o.ry * 0.97, 0, 0, TAU); ctx.clip();
    ctx.drawImage(im.iris, o.iris.x + look[0] * o.rx * 0.36, o.iris.y + look[1] * o.ry * 0.32);
    ctx.restore();
  });
  // sobrancelhas (ele não tem sobrancelhas desenhadas: aparecem só na emoção)
  const bu = f.browUp || 0, bs = f.browSad || 0;
  const forca = P.g === 'm' ? clamp(Math.abs(bu) * 0.9 + bs * 0.9) : 0;
  if (forca > 0.02) {
    ctx.save(); ctx.globalAlpha *= forca * 0.85;
    P.eyes.forEach(([ex, ey], i) => {
      const dir = i === 0 ? -1 : 1, [rx, ry] = P.er;
      const by = ey - ry - 24 - bu * 16;
      const xin = ex - dir * rx * 0.55, xout = ex + dir * rx * 0.85;
      ctx.beginPath(); ctx.moveTo(xin, by - bs * 16); ctx.quadraticCurveTo(ex, by - 10 - bs * 4, xout, by + bs * 10);
      ctx.strokeStyle = '#4a200a'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
    });
    ctx.restore();
  }
  expressao(ctx, P, f);
}

// Patinha de macaco (mão fora do bolso): dedos articuláveis (aberta/fechada)
function patinha(ctx, x, y, r, ang, cores, lado, abre = 0, pulseira = false) {
  const [pelo, palma] = cores;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const L = '#2a1206';
  // dedos
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * (0.28 + abre * 0.18);
    const len = r * (0.75 + (i === 1 || i === 2 ? 0.12 : 0)) * (0.75 + abre * 0.45);
    ctx.save(); ctx.rotate(a);
    ellipse(ctx, 0, r * 0.55 + len * 0.45, r * 0.24, len * 0.5, 0, pelo, L, r * 0.07);
    ellipse(ctx, 0, r * 0.55 + len * 0.75, r * 0.15, len * 0.2, 0, palma);
    ctx.restore();
  }
  // polegar
  ctx.save(); ctx.rotate(lado === 'E' ? -0.9 - abre * 0.4 : 0.9 + abre * 0.4);
  ellipse(ctx, 0, r * 0.75, r * 0.22, r * 0.45, 0, pelo, L, r * 0.07);
  ctx.restore();
  ellipse(ctx, 0, r * 0.2, r * 0.78, r * 0.7, 0, pelo, L, r * 0.08);
  ellipse(ctx, 0, r * 0.32, r * 0.45, r * 0.35, 0, rgba(palma.length === 7 ? palma : '#d98a52', 0.55));
  if (pulseira) { fillRR(ctx, -r * 0.7, -r * 0.55, r * 1.4, r * 0.3, r * 0.15, '#f0c03a', '#a87a10', r * 0.05); }
  ctx.restore();
}

// ---------------------------------------------------------------- ações
// Respiração e micro movimentos (nunca fica totalmente parado)
function respirar(pose, T, k = 1, seed = 0) {
  const b = Math.sin(T * 1.6 + seed) * k;
  addPart(pose, 'tronco', 'rot', b * 0.006);
  addPart(pose, 'tronco', 'dy', -Math.abs(b) * 3);
  addPart(pose, 'cabeca', 'rot', Math.sin(T * 0.7 + seed) * 0.02 * k);
  addPart(pose, 'cabeca', 'dy', b * 2);
  addPart(pose, 'quadril', 'rot', Math.sin(T * 0.5 + seed) * 0.006 * k);
  return pose;
}
// Ciclo de caminhada (fase em radianos; amp 0..1; braços balançam se soltos)
function andar(pose, n, fase, amp = 1, bracos = true) {
  if (amp <= 0) return pose;
  const s = Math.sin(fase), c = Math.cos(fase);
  const h = pose.h || 520;
  pose.bob = (pose.bob || 0) + Math.abs(s) * 0.025 * h * amp;
  addPart(pose, 'quadril', 'rot', 0.03 * s * amp);
  addPart(pose, 'tronco', 'rot', -0.025 * s * amp);
  addPart(pose, 'cabeca', 'rot', 0.02 * c * amp);
  if (n === 'm_preta') {
    addPart(pose, 'coxaE', 'rot', 0.07 * s * amp); addPart(pose, 'coxaD', 'rot', 0.07 * s * amp);
    addPart(pose, 'canelaE', 'dy', -60 * Math.max(0, s) * amp); addPart(pose, 'canelaD', 'dy', -60 * Math.max(0, -s) * amp);
    addPart(pose, 'canelaE', 'rot', -0.06 * Math.max(0, s) * amp); addPart(pose, 'canelaD', 'rot', 0.06 * Math.max(0, -s) * amp);
  } else {
    addPart(pose, 'pernaE', 'rot', 0.07 * s * amp); addPart(pose, 'pernaD', 'rot', 0.07 * s * amp);
    addPart(pose, 'pernaE', 'dy', -45 * Math.max(0, s) * amp); addPart(pose, 'pernaD', 'dy', -45 * Math.max(0, -s) * amp);
    addPart(pose, 'quadril', 'rot', 0.025 * Math.sin(fase - 0.6) * amp); // saia balança atrasada
  }
  if (bracos) {
    addPart(pose, 'bracoE', 'rot', -0.16 * s * amp); addPart(pose, 'bracoD', 'rot', -0.16 * s * amp);
    addPart(pose, 'antebracoE', 'rot', -0.1 * Math.max(0, s) * amp); addPart(pose, 'antebracoD', 'rot', 0.1 * Math.max(0, -s) * amp);
  }
  return pose;
}
// Sentar na calçada (vista de frente: coxas em escorço, canelas na vertical)
function sentar(pose, n, k) {
  if (k <= 0 || n !== 'm_preta') return pose;
  const sy = lerp(1, -0.12, k); // coxa em escorço (joelho sobe à frente do quadril)
  addPart(pose, 'quadril', 'dy', 235 * (1 - sy));
  part(pose, 'coxaE', { sy }); part(pose, 'coxaD', { sy });
  addPart(pose, 'coxaE', 'rot', 0.22 * k); addPart(pose, 'coxaD', 'rot', -0.22 * k);
  addPart(pose, 'canelaE', 'dy', -(1 - sy) * 235); addPart(pose, 'canelaD', 'dy', -(1 - sy) * 235);
  addPart(pose, 'canelaE', 'rot', -0.24 * k); addPart(pose, 'canelaD', 'rot', 0.24 * k);
  return pose;
}
// Curva com antecipação (recuo antes) e acomodação (passa um pouco e volta)
function antecip(t, a = 0.12, o = 0.08) {
  t = clamp(t);
  if (t < 0.2) return -a * Math.sin(t / 0.2 * Math.PI);
  const u = (t - 0.2) / 0.8;
  return easeOutBack(u) * (1 + o) - o * u;
}
