// ---------- helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
const easeBack = k => { k = clamp(k, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

function shape(fill, fn, lw = LW, stroke = INK) {
  ctx.beginPath(); fn();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
const ell = (x, y, rx, ry, rot = 0) => () => ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
const rr = (x, y, w, h, r) => () => ctx.roundRect(x, y, w, h, r);
const poly = pts => () => { ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };

function limb(x1, y1, x2, y2, w, color) {
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.lineWidth = w + LW * 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
}

// ---------- characters ----------
// p: {x,y,s, skin, shirt, pants, shoes, hair, hairColor, kind:'kid'|'adult', talk(0..1), expr, armL, armR, look, blink, extras}
function person(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s * (p.flip ? -1 : 1), p.s);
  const kid = p.kind === 'kid';
  const L = kid ? 150 : 300, T = kid ? 190 : 280, R = kid ? 135 : 108;
  const hipY = -L, shY = -L - T;
  const torsoW = kid ? 78 : 92;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.beginPath(); ctx.ellipse(0, 4, torsoW * 1.5, 16, 0, 0, Math.PI * 2); ctx.fill();

  // legs
  const lx = kid ? 30 : 34, lw = kid ? 46 : 50;
  for (const sx of [-1, 1]) {
    if (p.shorts) { shape(p.skin, rr(sx * lx - lw / 2 + 4, hipY - 10, lw - 8, L - 8, 16)); shape(p.pants, rr(sx * lx - lw / 2 - 6, hipY - 10, lw + 12, L * 0.62, 12)); }
    else shape(p.pants, rr(sx * lx - lw / 2, hipY - 10, lw, L - 8, 16));
    shape(p.shoes, ell(sx * (lx + 10), -6, 42, 20));
  }
  // torso
  if (p.dress) {
    shape(p.shirt, poly([-torsoW + 8, shY, torsoW - 8, shY, torsoW + 45, hipY + L * 0.5, -torsoW - 45, hipY + L * 0.5]));
    shape(null, () => { ctx.moveTo(-torsoW + 4, shY + T * 0.45); ctx.lineTo(torsoW - 4, shY + T * 0.45); }, 6);
  } else {
    shape(p.shirt, rr(-torsoW, shY, torsoW * 2, T + 14, 34));
    if (p.number) {
      ctx.font = '700 70px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.strokeText(p.number, 0, shY + T * 0.48);
      ctx.fillStyle = p.numberColor || '#ffffff'; ctx.fillText(p.number, 0, shY + T * 0.48);
    }
    if (p.cardigan) {
      shape(p.cardigan, poly([-torsoW, shY + 20, -18, shY + 10, -10, hipY + 14, -torsoW, hipY + 14]));
      shape(p.cardigan, poly([torsoW, shY + 20, 18, shY + 10, 10, hipY + 14, torsoW, hipY + 14]));
    }
  }
  // arms
  const armLen = kid ? 150 : 210, aw = kid ? 34 : 38;
  const arms = [[-1, p.armL || 0], [1, p.armR || 0]];
  for (const [sx, ang] of arms) {
    const ax = sx * (torsoW - 10), ay = shY + 34;
    const a = 0.18 + ang; // angle from straight down, outward
    const hx = ax + sx * Math.sin(a) * armLen, hy = ay + Math.cos(a) * armLen;
    limb(ax, ay, hx, hy, aw, p.sleeve || p.cardigan || p.shirt);
    shape(p.skin, ell(hx, hy, kid ? 24 : 26, kid ? 24 : 26));
  }
  // neck
  shape(p.skin, rr(-18, shY - 26, 36, 36, 8));
  // head
  const hy = shY - R * 0.82;
  ctx.save(); ctx.translate(0, hy);
  const hs = R / 100; ctx.scale(hs, hs);
  ctx.rotate(p.tilt || 0);
  head(p);
  ctx.restore();
  ctx.restore();
}

function head(p) {
  const hc = p.hairColor || '#2d1f1a';
  // hair behind
  if (p.hair === 'curly') {
    for (let i = 0; i < 11; i++) {
      const a = Math.PI + i * Math.PI / 10;
      shape(hc, ell(Math.cos(a) * 92, Math.sin(a) * 88 - 8, 34, 34));
    }
  } else if (p.hair === 'bun') {
    shape(hc, ell(0, -112, 46, 42));
    shape(hc, ell(0, -20, 112, 108));
  } else if (p.hair === 'long') {
    shape(hc, rr(-112, -90, 224, 210, 90));
  }
  // ears
  shape(p.skin, ell(-100, 8, 22, 28));
  shape(p.skin, ell(100, 8, 22, 28));
  // face
  shape(p.skin, ell(0, 0, 100, 100));
  // hair front
  if (p.hair === 'curly') {
    for (let i = 0; i < 7; i++) shape(hc, ell(-66 + i * 22, -78 + Math.abs(i - 3) * 6, 30, 26), 0);
    shape(null, () => { ctx.arc(0, -10, 100, Math.PI * 1.08, Math.PI * 1.92); }, 0);
  } else if (p.hair === 'bun' || p.hair === 'long') {
    shape(hc, () => { ctx.moveTo(-100, -5); ctx.quadraticCurveTo(-95, -105, 0, -102); ctx.quadraticCurveTo(95, -105, 100, -5); ctx.quadraticCurveTo(40, -70, -10, -60); ctx.quadraticCurveTo(-60, -55, -100, -5); });
  } else if (p.hair === 'pineapple') {
    // tall funny haircut
    shape('#e8a33a', () => { ctx.moveTo(-78, -50); ctx.lineTo(-70, -230); ctx.quadraticCurveTo(0, -270, 70, -230); ctx.lineTo(78, -50); ctx.quadraticCurveTo(0, -95, -78, -50); });
    ctx.strokeStyle = '#b8761f'; ctx.lineWidth = 6;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-60, -90 - i * 0 + i * 30); ctx.lineTo(60, -120 + i * 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(60, -90 + i * 30); ctx.lineTo(-60, -120 + i * 30); ctx.stroke(); }
    for (let i = -2; i <= 2; i++) shape('#4dbb5b', poly([i * 22 - 14, -240, i * 30 + Math.sign(i) * 18, -330 + Math.abs(i) * 30, i * 22 + 14, -240]));
  } else if (p.hair === 'bald') {
    shape(hc, ell(-92, -10, 30, 44));
    shape(hc, ell(92, -10, 30, 44));
    shape(null, () => { ctx.moveTo(-20, -96); ctx.quadraticCurveTo(-5, -125, 12, -100); }, 5);
  } else if (p.hair === 'wavy') {
    // short dark hair, fuller and wavy on top, short sides
    shape(hc, () => { ctx.moveTo(-102, 0); ctx.quadraticCurveTo(-112, -70, -70, -100); ctx.quadraticCurveTo(-40, -132, 0, -122); ctx.quadraticCurveTo(50, -138, 80, -104); ctx.quadraticCurveTo(112, -76, 102, 0); ctx.quadraticCurveTo(94, -48, 70, -58); ctx.quadraticCurveTo(40, -46, 22, -66); ctx.quadraticCurveTo(-10, -50, -36, -66); ctx.quadraticCurveTo(-62, -48, -84, -56); ctx.quadraticCurveTo(-98, -40, -102, 0); });
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-50, -100); ctx.quadraticCurveTo(-20, -112, 6, -100); ctx.moveTo(24, -108); ctx.quadraticCurveTo(50, -116, 70, -96); ctx.stroke();
  } else if (p.hair === 'short') {
    shape(hc, () => { ctx.moveTo(-100, -10); ctx.quadraticCurveTo(-100, -112, 0, -108); ctx.quadraticCurveTo(100, -112, 100, -10); ctx.quadraticCurveTo(70, -60, 0, -62); ctx.quadraticCurveTo(-70, -60, -100, -10); });
  }
  // cheeks
  ctx.fillStyle = p.angry ? 'rgba(235,60,60,0.55)' : 'rgba(255,120,140,0.45)';
  ctx.beginPath(); ctx.ellipse(-62, 34, 18, 12, 0, 0, 7); ctx.ellipse(62, 34, 18, 12, 0, 0, 7); ctx.fill();
  if (p.angry) { ctx.fillStyle = 'rgba(235,60,60,0.22)'; ctx.beginPath(); ctx.ellipse(0, 0, 100, 100, 0, 0, 7); ctx.fill(); }

  // eyes
  const ex = 38, ey = -8;
  const bl = p.blink ? 0.12 : 1;
  const lookX = (p.look || 0) * 9;
  for (const sx of [-1, 1]) {
    shape('#ffffff', ell(sx * ex, ey, 27, 32 * bl));
    if (bl > 0.5) {
      const pr = p.expr === 'shock' ? 8 : 14;
      shape(INK, ell(sx * ex + lookX, ey + 4, pr, pr), 0);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx * ex + lookX - 4, ey - 2, 4.5, 0, 7); ctx.fill();
    }
  }
  if (p.glasses) {
    ctx.lineWidth = 6; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.arc(-ex, ey, 38, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey, 38, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-ex + 38, ey); ctx.lineTo(ex - 38, ey); ctx.stroke();
  }
  // brows
  ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    if (p.angry) { ctx.moveTo(sx * 64, -62); ctx.lineTo(sx * 16, -42); }
    else if (p.expr === 'sad') { ctx.moveTo(sx * 64, -46); ctx.lineTo(sx * 18, -62); }
    else if (p.expr === 'shock') { ctx.moveTo(sx * 62, -70); ctx.quadraticCurveTo(sx * 40, -84, sx * 16, -72); }
    else { ctx.moveTo(sx * 60, -56); ctx.quadraticCurveTo(sx * 40, -66, sx * 18, -58); }
    ctx.stroke();
  }
  // nose
  if (p.blueNose > 0.01) { const k = p.blueNose; shape('#2f7bff', ell(0, 20, 22 * k, 17 * k), 6); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-7 * k, 14 * k, 6 * k, 4 * k, 0, 0, 7); ctx.fill(); }
  else { ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-6, 18); ctx.quadraticCurveTo(0, 26, 8, 18); ctx.stroke(); }

  // mouth
  const talk = p.talk || 0;
  if (talk > 0.02) {
    const h = 10 + talk * 30;
    shape('#7a2233', ell(0, 54, 30, h * 0.7 + 4));
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 54, 30, h * 0.7 + 4, 0, 0, 7); ctx.clip();
    ctx.fillStyle = '#ff7f8e'; ctx.beginPath(); ctx.ellipse(0, 54 + h * 0.6, 22, 14, 0, 0, 7); ctx.fill(); ctx.restore();
  } else if (p.expr === 'sad' || p.angry) {
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-26, 64); ctx.quadraticCurveTo(0, 42, 26, 64); ctx.stroke();
  } else if (p.expr === 'shock') {
    shape('#7a2233', ell(0, 58, 18, 24));
  } else if (p.expr === 'grin') {
    shape('#ffffff', () => { ctx.moveTo(-40, 42); ctx.quadraticCurveTo(0, 100, 40, 42); ctx.closePath(); });
  } else {
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-30, 46); ctx.quadraticCurveTo(0, 74, 30, 46); ctx.stroke();
  }
  if (p.scarf) {
    shape('#e2453c', rr(-112, 2, 224, 96, 44));
    ctx.save(); ctx.beginPath(); ctx.roundRect(-112, 2, 224, 96, 44); ctx.clip();
    ctx.fillStyle = '#ffffff'; for (let i = -3; i < 4; i++) ctx.fillRect(i * 60 - 10, 0, 22, 100); ctx.restore();
    shape(null, rr(-112, 2, 224, 96, 44));
  }
  if (p.tophat) {
    shape('#2b2b38', ell(0, -92, 128, 22));
    shape('#2b2b38', rr(-72, -250, 144, 160, 10));
    shape('#e2453c', rr(-72, -130, 144, 30, 0));
  }
  if (p.choco) {
    ctx.fillStyle = '#5a3420';
    ctx.beginPath(); ctx.ellipse(-30, 70, 16, 11, 0.3, 0, 7); ctx.ellipse(36, 62, 12, 9, -0.4, 0, 7); ctx.ellipse(-56, 52, 8, 6, 0, 0, 7); ctx.fill();
  }
  if (p.sweat) {
    shape('#8fd3ff', () => { ctx.moveTo(108, -70); ctx.quadraticCurveTo(84, -30, 108, -24); ctx.quadraticCurveTo(132, -30, 108, -70); }, 5);
  }
  if (p.tear) {
    const ty = p.tear;
    shape('#8fd3ff', () => { ctx.moveTo(-50, 18 + ty); ctx.quadraticCurveTo(-64, 44 + ty, -50, 48 + ty); ctx.quadraticCurveTo(-36, 44 + ty, -50, 18 + ty); }, 5);
  }
}

// dog "Paçoca" (caramelo)
function dog(d) {
  ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.s * (d.flip ? -1 : 1), d.s);
  const fur = '#d99a4e', dark = '#a8682c', cream = '#f6dfb8';
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.ellipse(0, 4, 130, 16, 0, 0, 7); ctx.fill();
  // tail
  const wag = Math.sin(d.t * (d.wagFast ? 22 : 9)) * 0.5;
  ctx.save(); ctx.translate(80, -50); ctx.rotate(-0.6 + wag);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(70, -20, 80, -95);
  ctx.lineWidth = 34 + LW * 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = 34; ctx.strokeStyle = fur; ctx.stroke();
  ctx.restore();
  // back legs + body
  shape(fur, ell(-70, -30, 52, 34));
  shape(fur, ell(70, -30, 52, 34));
  shape(fur, ell(0, -115, 100, 112));
  shape(cream, ell(0, -95, 55, 78), 0);
  // front legs
  for (const sx of [-1, 1]) {
    shape(fur, rr(sx * 38 - 22, -120, 44, 116, 18));
    shape(cream, ell(sx * 38, -8, 30, 18));
  }
  // collar
  shape('#e2453c', rr(-62, -206, 124, 26, 12));
  shape('#ffd23f', ell(0, -172, 16, 16));
  // head
  ctx.save(); ctx.translate(0, -285); ctx.rotate(d.tilt || 0);
  for (const sx of [-1, 1]) {
    ctx.save(); ctx.translate(sx * 82, -40); ctx.rotate(sx * (0.35 + Math.sin(d.t * 3) * 0.04));
    shape(dark, ell(0, 40, 34, 70)); ctx.restore();
  }
  shape(fur, ell(0, 0, 102, 94));
  shape(cream, ell(0, 42, 62, 46));
  // eyes
  const bl = d.blink ? 0.12 : 1;
  for (const sx of [-1, 1]) {
    shape('#ffffff', ell(sx * 40, -18, 24, 28 * bl));
    if (bl > 0.5) {
      shape(INK, ell(sx * 40 + (d.look || 0) * 7, -14, 12, 12), 0);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx * 40 - 3 + (d.look || 0) * 7, -19, 4, 0, 7); ctx.fill();
    }
  }
  ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 60, -60); ctx.quadraticCurveTo(sx * 40, -70, sx * 22, -60); ctx.stroke(); }
  // nose
  shape(INK, ell(0, 20, 22, 15), 0);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-7, 15, 6, 4, 0, 0, 7); ctx.fill();
  // mouth
  const talk = d.talk || 0;
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(0, 48); ctx.stroke();
  if (talk > 0.02) {
    shape('#7a2233', ell(0, 66, 28, 8 + talk * 24));
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 66, 28, 8 + talk * 24, 0, 0, 7); ctx.clip();
    ctx.fillStyle = '#ff7f8e'; ctx.beginPath(); ctx.ellipse(0, 78 + talk * 14, 20, 14, 0, 0, 7); ctx.fill(); ctx.restore();
  } else {
    ctx.beginPath(); ctx.moveTo(-30, 44); ctx.quadraticCurveTo(-15, 62, 0, 48); ctx.quadraticCurveTo(15, 62, 30, 44); ctx.stroke();
    if (d.tongue) shape('#ff7f8e', () => { ctx.moveTo(-14, 56); ctx.lineTo(-14, 80); ctx.quadraticCurveTo(0, 96, 14, 80); ctx.lineTo(14, 56); }, 5);
  }
  ctx.restore();
  ctx.restore();
}

