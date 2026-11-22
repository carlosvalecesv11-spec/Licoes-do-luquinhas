'use strict';
// =====================================================================
//  Rig 2D de PERFIL (arte recebida: assets/rig/m_perfil e f_perfil)
//  e sprites da caminhada (assets/sprites/ele_caminhada).
//  Peças: cabeça, pescoço, tronco, quadril, braço/antebraço/mão (perto N
//  e longe T), coxa/canela/pé (ele) ou perna (ela, sob a saia).
//  Rosto: pálpebras (fechado, meio) e bocas trocadas com a arte da folha.
// =====================================================================
const RP = {};
let SPR_ANDAR = [];

async function carregarPerfil(nomes) {
  for (const n of nomes) {
    const d = window.RIG_DATA[n];
    const r = { d, img: {}, var: {}, rosto: {}, ordem: [] };
    for (const k in d.partes) {
      r.img[k] = await carregarImagem(`assets/rig/${n}/${k}.png`);
      const v = d.partes[k].variantes || {};
      for (const vn in v) r.var[k + '__' + vn] = await carregarImagem(`assets/rig/${n}/${k}__${vn}.png`);
    }
    for (const k in d.rosto) r.rosto[k] = await carregarImagem(`assets/rig/${n}/rosto_${k}.png`);
    const vis = new Set(['raiz']);
    while (r.ordem.length < Object.keys(d.partes).length) {
      for (const k in d.partes) if (!vis.has(k) && vis.has(d.partes[k].pai)) { r.ordem.push(k); vis.add(k); }
    }
    RP[n] = r;
  }
  SPR_ANDAR = [];
  for (let i = 1; i <= 8; i++) SPR_ANDAR.push(await carregarImagem(`assets/sprites/ele_caminhada/q${i}.png`));
}

// pose: { x, y, h, flip(1 olha p/ direita, -1 p/ esquerda), lean (p/ frente +), bob,
//         parts:{peça:{rot,dx,dy}}, maos:{N:[wx,wy],T:[..]}, pes:{N:[wx,wy],T:[..]},
//         maoVar:{N:'relaxada'|'aberta'|'segurando'|'fechada'|'celular'}, face:{...}, z:{...}, zBase, alpha }
function poseP(o) { return Object.assign({ parts: {}, maos: {}, pes: {}, maoVar: {}, face: {}, z: {}, zBase: 0 }, o); }
function addP(pose, k, campo, v) { const p = pose.parts[k] || (pose.parts[k] = {}); p[campo] = (p[campo] || 0) + v; }

function matP(n, pose) {
  const r = RP[n], d = r.d;
  const s = (pose.h || 520) / d.altura;
  const M = {};
  M.raiz = new DOMMatrix().translate(pose.x, pose.y - (pose.bob || 0)).scale(s * (pose.flip || 1), s)
    .rotate((pose.lean || 0) * DEG).translate(-d.cx, -d.pes);
  for (const k of r.ordem) {
    const p = d.partes[k], t = pose.parts[k] || {};
    M[k] = M[p.pai].translate(p.pivo[0] + (t.dx || 0), p.pivo[1] + (t.dy || 0)).rotate((t.rot || 0) * DEG).translate(-p.pivo[0], -p.pivo[1]);
  }
  return M;
}
// IK de dois ossos em coordenadas locais da peça-mãe; escolhe o lado da dobra
function ik2P(S, E, Wr, loc, escolha) {
  const L1 = Math.hypot(E[0] - S[0], E[1] - S[1]), L2 = Math.hypot(Wr[0] - E[0], Wr[1] - E[1]);
  let dx = loc.x - S[0], dy = loc.y - S[1], dd = Math.hypot(dx, dy);
  const maxd = (L1 + L2) * 0.998;
  if (dd > maxd) { dx *= maxd / dd; dy *= maxd / dd; dd = maxd; }
  dd = Math.max(dd, Math.abs(L1 - L2) + 4);
  const th = Math.atan2(dy, dx), al = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
  const c1 = [S[0] + L1 * Math.cos(th + al), S[1] + L1 * Math.sin(th + al)];
  const c2 = [S[0] + L1 * Math.cos(th - al), S[1] + L1 * Math.sin(th - al)];
  const J = escolha(c1, c2);
  const r1 = Math.atan2(J[1] - S[1], J[0] - S[0]) - Math.atan2(E[1] - S[1], E[0] - S[0]);
  const r2 = Math.atan2(S[1] + dy - J[1], S[0] + dx - J[0]) - Math.atan2(Wr[1] - E[1], Wr[0] - E[0]) - r1;
  return [angNorm(r1), angNorm(r2)];
}
function resolverP(n, pose) {
  const d = RP[n].d;
  const peso = (lado, tipo) => { const w = (pose.ik || {})[tipo + lado]; return w == null ? 1 : w; };
  for (const lado of ['N', 'T']) {
    const alvo = pose.maos[lado];
    if (alvo) {
      const M = matP(n, pose);
      const b = d.partes['braco' + lado], a = d.partes['antebraco' + lado];
      const loc = M.tronco.inverse().transformPoint(new DOMPoint(alvo[0], alvo[1]));
      // cotovelo para trás e para baixo (olhando para a direita no espaço local)
      const [r1, r2] = ik2P(b.pivo, a.pivo, a.ponta, loc, (c1, c2) => ((c1[1] - c1[0] * 0.8) > (c2[1] - c2[0] * 0.8) ? c1 : c2));
      const k = peso(lado, 'mao');
      const tb = pose.parts['braco' + lado] || {}, ta = pose.parts['antebraco' + lado] || {};
      pose.parts['braco' + lado] = Object.assign(tb, { rot: lerp(tb.rot || 0, r1, k) });
      pose.parts['antebraco' + lado] = Object.assign(ta, { rot: lerp(ta.rot || 0, r2, k) });
    }
    const pe = pose.pes[lado];
    if (pe && d.partes['coxa' + lado]) {
      const M = matP(n, pose);
      const c = d.partes['coxa' + lado], cn = d.partes['canela' + lado], p = d.partes['pe' + lado];
      const loc = M.quadril.inverse().transformPoint(new DOMPoint(pe[0], pe[1]));
      // joelho para a frente e para cima
      const [r1, r2] = ik2P(c.pivo, cn.pivo, p.pivo, loc, (c1, c2) => ((c1[0] - c1[1]) > (c2[0] - c2[1]) ? c1 : c2));
      const k = peso(lado, 'pe');
      const tc = pose.parts['coxa' + lado] || {}, tn = pose.parts['canela' + lado] || {};
      pose.parts['coxa' + lado] = Object.assign(tc, { rot: lerp(tc.rot || 0, r1, k) });
      pose.parts['canela' + lado] = Object.assign(tn, { rot: lerp(tn.rot || 0, r2, k) });
      // pé fica paralelo ao chão
      const tp = pose.parts['pe' + lado] || {};
      pose.parts['pe' + lado] = Object.assign(tp, { rot: (tp.rot || 0) - r1 - r2 - (pose.lean || 0) - ((pose.parts.quadril || {}).rot || 0) });
    }
  }
}
function opsP(n, pose) {
  resolverP(n, pose);
  const r = RP[n], d = r.d, M = matP(n, pose);
  const ops = [];
  for (const k of r.ordem) {
    if (window.__esc && n === window.__esc[0] && /^(braco|antebraco|mao)/.test(k) && k.endsWith(window.__esc[1])) continue; // depuração
    const p = d.partes[k];
    const z = (pose.zBase || 0) + (pose.z[k] != null ? pose.z[k] : p.z / 100);
    ops.push({ z, draw: (ctx, base) => {
      ctx.save(); ctx.setTransform(base.multiply(M[k]));
      if (pose.alpha != null) ctx.globalAlpha *= pose.alpha;
      const lado = k.slice(-1);
      if (k.startsWith('mao') && pose.maoVar[lado] && pose.maoVar[lado] !== 'relaxada' && r.var[k + '__' + pose.maoVar[lado]]) {
        const v = p.variantes[pose.maoVar[lado]];
        ctx.drawImage(r.var[k + '__' + pose.maoVar[lado]], v.x, v.y);
      } else ctx.drawImage(r.img[k], p.x, p.y);
      if (k === 'cabeca') rostoP(ctx, n, pose.face || {});
      ctx.restore();
    } });
  }
  pose._M = M;
  return ops;
}
function rostoP(ctx, n, f) {
  const r = RP[n], d = r.d, R = d.rosto;
  const put = (nome) => { const i = R[nome]; if (i) ctx.drawImage(r.rosto[nome], i.x, i.y); };
  // pálpebras
  const fechado = Math.max(f.blink || 0, f.fechado || 0);
  if (fechado > 0.5) put('olho_fechado');
  else if (f.meio) put('olho_meio');
  // brilho nos olhos (emoção)
  if (f.brilho && fechado <= 0.5) {
    const o = d.olho;
    ctx.save(); ctx.globalAlpha *= clamp(f.brilho);
    star(ctx, o.cx + 3, o.cy - 8, 9, '#ffffff', 4, 0.3);
    ctx.restore();
  }
  // blush
  if (f.blush) {
    const o = d.olho;
    ctx.save(); ctx.globalAlpha *= clamp(f.blush) * 0.4;
    ctx.fillStyle = radGrad(ctx, o.cx + 6, o.cy + 42, 2, 34, [[0, '#ff5a6e'], [1, 'rgba(255,90,110,0)']]);
    ctx.fillRect(o.cx - 40, o.cy, 90, 90);
    ctx.restore();
  }
  // boca
  if (f.boca && f.boca !== 'sorriso') {
    const b = d.boca;
    ctx.save();
    ctx.fillStyle = d.pele;
    ctx.beginPath(); ctx.ellipse(b.cx - 2, b.cy + 2, 17, 11, 0, 0, TAU); ctx.fill();
    ctx.restore();
    put('boca_' + f.boca);
  }
}
function drawP(ctx, lista) {
  const base = ctx.getTransform();
  let ops = [];
  for (const [n, pose] of lista) ops = ops.concat(opsP(n, pose));
  ops.sort((a, b) => a.z - b.z);
  for (const o of ops) o.draw(ctx, base);
  return lista.map(([n, pose]) => ptsP(n, pose));
}
function ptsP(n, pose) {
  const M = pose._M || matP(n, pose), d = RP[n].d;
  const pt = (k, q) => M[k].transformPoint(new DOMPoint(q[0], q[1]));
  const P = d.pts;
  const o = {
    testa: pt('cabeca', P.testa), boca: pt('cabeca', P.boca), nuca: pt('cabeca', P.nuca),
    peito: pt('tronco', P.peito), costas: pt('tronco', P.costas), ombro: pt('tronco', P.ombro),
    olho: pt('cabeca', [d.olho.cx, d.olho.cy]),
    maoN: pt('antebracoN', d.partes.antebracoN.ponta),
  };
  if (P.bochecha) o.bochecha = pt('cabeca', P.bochecha);
  if (d.partes.canelaN) o.joelhoN = pt('canelaN', d.partes.canelaN.pivo), o.joelhoT = pt('canelaT', d.partes.canelaT.pivo);
  return o;
}

// Sprite da caminhada dele: quadro escolhido pela distância percorrida (sem pé deslizando)
// fase: 0..1 dentro do ciclo de 8 quadros
function drawSpriteAndar(ctx, x, y, h, fase, flip = 1, alpha = 1) {
  const i = ((Math.floor(fase * 8) % 8) + 8) % 8;
  const q = window.CAMINHADA_ELE[i], img = SPR_ANDAR[i];
  const s = h / 612;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.scale(s * flip, s);
  ctx.drawImage(img, -(q.cx - q.x), -(q.pes - q.y));
  ctx.restore();
}
