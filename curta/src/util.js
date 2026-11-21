'use strict';
// =====================================================================
//  Utilidades: matemática, easing, aleatório determinístico e desenho
// =====================================================================
const W = 1920, H = 1080, FPS = 30, DURACAO = 180;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const easeIn = t => { t = clamp(t); return t * t * t; };
const easeOutBack = t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const seg = (T, a, b) => clamp((T - a) / (b - a));
const sm = (T, a, b) => smooth(seg(T, a, b));
const eio = (T, a, b) => easeInOut(seg(T, a, b));
const TAU = Math.PI * 2;

function mix(a, b, t) {
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], t));
  return lerp(a, b, t);
}
// Interpolação por quadros-chave: keys = [[t, valor], ...]
function kf(T, keys, ease = smooth) {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (T <= t1) return mix(v0, v1, ease((T - t0) / Math.max(1e-6, t1 - t0)));
  }
  return keys[keys.length - 1][1];
}
// Aleatório determinístico (mesmo valor para o mesmo índice)
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function rnd2(i, j) { return rnd(i * 57.31 + j * 13.17); }
// Piscar de olhos automático
function blinkAt(T, seed = 0) {
  const period = 3.2 + rnd(seed) * 1.6;
  const ph = ((T + rnd(seed + 7) * period) % period + period) % period;
  return ph < 0.17 ? Math.sin(ph / 0.17 * Math.PI) : 0;
}
// Ciclo de caminhada: retorna fase (radianos) para uma caminhada entre t0 e t1
function walkPhase(T, t0, t1, stepsPerSec = 2.2) {
  const tt = clamp(T, t0, t1) - t0;
  return tt * stepsPerSec * Math.PI;
}

// ---------------------------------------------------------------- desenho
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(ctx, x, y, w, h, r, fill, stroke, lw) {
  rr(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function circle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function ellipse(ctx, x, y, rx, ry, rot, fill, stroke, lw) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot || 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function line(ctx, x0, y0, x1, y1, color, lw) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  ctx.strokeStyle = color; ctx.lineWidth = lw || 1; ctx.lineCap = 'round'; ctx.stroke();
}
function linGrad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function radGrad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
// Brilho radial (luz)
function glow(ctx, x, y, r, color, alpha = 1, mode = 'lighter') {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = clamp(alpha);
  ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, color], [1, rgba(color, 0)]]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function heartPath(ctx, x, y, s) {
  const k = s / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + k * 0.95);
  ctx.bezierCurveTo(x - k * 1.35, y + k * 0.05, x - k * 1.0, y - k * 1.1, x, y - k * 0.45);
  ctx.bezierCurveTo(x + k * 1.0, y - k * 1.1, x + k * 1.35, y + k * 0.05, x, y + k * 0.95);
  ctx.closePath();
}
function heart(ctx, x, y, s, fill, stroke, lw) {
  heartPath(ctx, x, y, s);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function star(ctx, x, y, r, fill, spikes = 4, inner = 0.35, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + i * Math.PI / spikes - Math.PI / 2;
    const rr2 = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
// Câmera: centraliza (cx,cy) do mundo na tela com zoom z
function camera(ctx, cx, cy, z, rot = 0) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  if (rot) ctx.rotate(rot);
  ctx.translate(-cx, -cy);
}
function vignette(ctx, strength = 0.55, color = '#000') {
  ctx.save();
  ctx.fillStyle = radGrad(ctx, W / 2, H / 2, H * 0.45, H * 1.05, [[0, rgba(color, 0)], [1, rgba(color, strength)]]);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function fade(ctx, a, color = '#000') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// Chuva em espaço de tela
function rain(ctx, T, o = {}) {
  const n = o.count || 260, alpha = o.alpha == null ? 0.55 : o.alpha;
  if (alpha <= 0) return;
  const x0 = o.x || 0, y0 = o.y || 0, w = o.w || W, h = o.h || H;
  ctx.save();
  ctx.strokeStyle = o.color || 'rgba(190,210,255,1)';
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sp = (o.speed || 1300) * (0.75 + rnd(i * 3.1) * 0.5);
    const len = (o.len || 34) * (0.6 + rnd(i * 1.7) * 0.8);
    const yy = ((rnd(i * 2.3) * (h + 200) + T * sp) % (h + 200)) - 100;
    const xx = rnd(i * 5.9) * (w + 200) - 100 - yy * 0.18;
    ctx.globalAlpha = alpha * (0.35 + rnd(i * 7.7) * 0.65);
    ctx.lineWidth = (o.lw || 2) * (0.6 + rnd(i * 4.4) * 0.6);
    ctx.beginPath();
    ctx.moveTo(x0 + xx, y0 + yy);
    ctx.lineTo(x0 + xx - len * 0.18, y0 + yy + len);
    ctx.stroke();
  }
  ctx.restore();
}
// Partículas de corações flutuando (determinístico)
function floatHearts(ctx, T, t0, t1, x, y, o = {}) {
  if (T < t0) return;
  const n = o.n || 8, spread = o.spread || 120, size = o.size || 26, life = o.life || 2.2, rise = o.rise || 220;
  const seed = o.seed || 1;
  for (let i = 0; i < n; i++) {
    const born = t0 + (t1 - t0) * (i / n) + rnd(seed + i) * 0.2;
    const age = T - born;
    if (age < 0 || age > life) continue;
    const k = age / life;
    const hx = x + (rnd(seed + i * 3) - 0.5) * spread + Math.sin(age * 3 + i) * 14;
    const hy = y - k * rise;
    const a = Math.sin(k * Math.PI);
    ctx.save(); ctx.globalAlpha = a * (o.alpha || 0.95);
    heart(ctx, hx, hy, size * (0.6 + rnd(seed + i * 5) * 0.6) * (0.6 + 0.4 * easeOutBack(k * 3)), o.color || '#ff5d7a');
    ctx.restore();
  }
}
function sparkles(ctx, T, t0, t1, x, y, o = {}) {
  if (T < t0 || T > t1 + 1) return;
  const n = o.n || 14, spread = o.spread || 200, seed = o.seed || 3;
  for (let i = 0; i < n; i++) {
    const born = t0 + (t1 - t0) * rnd(seed + i * 1.3);
    const age = T - born; if (age < 0 || age > 0.9) continue;
    const k = age / 0.9;
    const sx = x + (rnd(seed + i * 2.1) - 0.5) * spread, sy = y + (rnd(seed + i * 3.7) - 0.5) * spread * 0.8 - k * 30;
    ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI);
    star(ctx, sx, sy, (o.size || 16) * Math.sin(k * Math.PI), o.color || '#fff6c8', 4, 0.3, k);
    ctx.restore();
  }
}
