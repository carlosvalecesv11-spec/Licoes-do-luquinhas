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
  if (p.luq) return drawLuq(p);
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
  const lx = p.sneakers ? 31 : (kid ? 30 : 34), lw = p.sneakers ? 60 : (kid ? 46 : 50);
  for (const sx of [-1, 1]) {
    if (p.shorts) { shape(p.skin, rr(sx * lx - lw / 2 + 4, hipY - 10, lw - 8, L - 8, 16)); shape(p.pants, rr(sx * lx - lw / 2 - 6, hipY - 10, lw + 12, L * 0.62, 12)); }
    else shape(p.pants, rr(sx * lx - lw / 2, hipY - 10, lw, L - 8, 16));
    if (p.sneakers) {
      const sx2 = sx * (lx + 8);
      shape('#8f8a84', rr(sx2 - 46, -24, 92, 30, 14));
      shape(p.shoes, () => { ctx.moveTo(sx2 - 44, -12); ctx.quadraticCurveTo(sx2 - 40, -52, sx2, -52); ctx.quadraticCurveTo(sx2 + 40, -52, sx2 + 44, -12); ctx.closePath(); });
      ctx.strokeStyle = 'rgba(38,34,47,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx2 - 16, -38); ctx.lineTo(sx2 + 16, -38); ctx.moveTo(sx2 - 18, -28); ctx.lineTo(sx2 + 18, -28); ctx.stroke();
    } else shape(p.shoes, ell(sx * (lx + 10), -6, 42, 20));
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
    if (p.shortSleeves) {
      limb(ax, ay, hx, hy, aw - 4, p.skin);
      shape(p.skin, ell(hx, hy, kid ? 26 : 28, kid ? 26 : 28));
      const k = 0.22; limb(ax, ay, ax + (hx - ax) * k, ay + (hy - ay) * k, aw + 14, p.shirt);
    } else {
      limb(ax, ay, hx, hy, aw, p.sleeve || p.cardigan || p.shirt);
      shape(p.skin, ell(hx, hy, kid ? 24 : 26, kid ? 24 : 26));
    }
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
  shape(p.skin, ell(-100, 8, 24, 30));
  shape(p.skin, ell(100, 8, 24, 30));
  if (p.earInner) { ctx.fillStyle = p.earInner; ctx.beginPath(); ctx.ellipse(-104, 8, 10, 16, 0, 0, 7); ctx.ellipse(104, 8, 10, 16, 0, 0, 7); ctx.fill(); }
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
  } else if (p.hair === 'neat') {
    // smooth black hair with a small jagged fringe and shine marks
    shape(hc, () => {
      ctx.moveTo(-104, 2); ctx.quadraticCurveTo(-112, -118, 0, -120); ctx.quadraticCurveTo(112, -118, 104, 2);
      ctx.lineTo(96, -24); ctx.quadraticCurveTo(84, -66, 52, -76);
      const pts = [[40, -70], [26, -80], [10, -72], [-6, -82], [-22, -73], [-38, -80], [-54, -74]];
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.quadraticCurveTo(-84, -68, -96, -24); ctx.closePath();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-58, -92); ctx.quadraticCurveTo(-30, -106, -2, -96); ctx.moveTo(16, -100); ctx.quadraticCurveTo(44, -108, 66, -92); ctx.stroke();
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
  const ex = p.iris ? 42 : 38, ey = -8;
  const bl = p.blink ? 0.12 : 1;
  const lookX = (p.look || 0) * 9;
  for (const sx of [-1, 1]) {
    if (p.iris) {
      shape('#ffffff', ell(sx * ex, ey + 2, 34, 34 * bl), 8);
      if (bl > 0.5) {
        const ir = p.expr === 'shock' ? 15 : 22, cx2 = sx * ex + lookX, cy2 = ey + 4;
        ctx.fillStyle = p.iris; ctx.beginPath(); ctx.arc(cx2, cy2, ir, 0, 7); ctx.fill();
        ctx.fillStyle = '#3a1e10'; ctx.beginPath(); ctx.arc(cx2, cy2, ir * 0.48, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx2 + ir * 0.35, cy2 - ir * 0.4, ir * 0.36, 0, 7); ctx.arc(cx2 - ir * 0.4, cy2 + ir * 0.35, ir * 0.16, 0, 7); ctx.fill();
      }
      continue;
    }
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
  ctx.lineWidth = 9; ctx.strokeStyle = p.browColor || INK; ctx.lineCap = 'round';
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


// ---------- Luquinhas (custom organic drawing, reference coords: feet center at (520,1440)) ----------
function drawLuq(p) {
  const OL = 12;
  const S = (fill, fn, lw = OL) => shape(fill, fn, lw);
  ctx.save();
  ctx.translate(p.x, p.y);
  const sc = (p.s || 1) * 0.41;
  ctx.scale(sc * (p.flip ? -1 : 1), sc);
  ctx.translate(-520, -1440);
  const skin = '#f9b78b', shirt = '#b5cfa9', jeans = '#87a5c2', cream = '#f6efe0', hairC = '#1c1c20';
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.ellipse(520, 1438, 230, 30, 0, 0, 7); ctx.fill();
  // shoes
  for (const x of [420, 618]) {
    S('#8f8a84', rr(x - 92, 1380, 184, 56, 26));
    S(cream, () => { ctx.moveTo(x - 88, 1408); ctx.quadraticCurveTo(x - 84, 1340, x, 1338); ctx.quadraticCurveTo(x + 84, 1340, x + 88, 1408); ctx.closePath(); });
    ctx.strokeStyle = 'rgba(38,34,47,0.6)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 28, 1366); ctx.lineTo(x + 28, 1366); ctx.moveTo(x - 32, 1386); ctx.lineTo(x + 32, 1386); ctx.stroke();
  }
  // pants
  S(jeans, () => { ctx.moveTo(376, 1000); ctx.lineTo(664, 1000); ctx.lineTo(668, 1356); ctx.lineTo(536, 1356); ctx.lineTo(520, 1070); ctx.lineTo(504, 1356); ctx.lineTo(372, 1356); ctx.closePath(); });
  // arms + sleeves (behind torso edges)
  const arm = (side, ang, peace, thumb) => {
    ctx.save();
    ctx.translate(520 + side * 150, 712); ctx.scale(side, 1); // side -1 = left (mirror so local -x is outward)
    ctx.scale(-1, 1); // local: outward = -x
    ctx.rotate(ang * 0.3);
    // skin arm, hinged at the sleeve opening
    ctx.save(); ctx.translate(-66, 126); ctx.rotate(ang * 0.7);
    S(skin, () => { ctx.moveTo(-32, -10); ctx.quadraticCurveTo(-30, 72, -28, 146); ctx.lineTo(34, 146); ctx.quadraticCurveTo(32, 72, 26, -6); ctx.closePath(); });
    if (peace) {
      // two fingers in a V, pointing along the arm
      for (const [x1, x2] of [[-16, -44], [16, 40]]) {
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, 190); ctx.lineTo(x2, 292);
        ctx.lineWidth = 34 + OL * 2; ctx.strokeStyle = INK; ctx.stroke();
        ctx.lineWidth = 34; ctx.strokeStyle = skin; ctx.stroke();
      }
    }
    S(skin, ell(4, 174, 58, 58));
    if (thumb) {
      // thumbs up: thumb always points up on screen, whatever the arm angle
      ctx.save(); ctx.translate(4, 174); ctx.rotate(-ang);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(14, -30); ctx.lineTo(14, -108);
      ctx.lineWidth = 36 + OL * 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 36; ctx.strokeStyle = skin; ctx.stroke();
      S(skin, ell(0, 0, 58, 58));
      ctx.strokeStyle = 'rgba(38,34,47,0.55)'; ctx.lineWidth = 8;
      for (const yy of [-14, 10, 32]) { ctx.beginPath(); ctx.moveTo(-40, yy); ctx.quadraticCurveTo(-14, yy + 6, 10, yy); ctx.stroke(); }
      ctx.restore();
    }
    if (peace) { ctx.strokeStyle = 'rgba(38,34,47,0.6)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-30, 150); ctx.quadraticCurveTo(4, 140, 36, 152); ctx.stroke(); }
    ctx.restore();
    // sleeve
    S(shirt, () => { ctx.moveTo(50, -6); ctx.quadraticCurveTo(-50, 0, -112, 100); ctx.quadraticCurveTo(-126, 128, -98, 136); ctx.quadraticCurveTo(-40, 150, 14, 128); ctx.closePath(); });
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-30, 30); ctx.quadraticCurveTo(-58, 56, -74, 92); ctx.stroke();
    ctx.restore();
  };
  // torso
  S(shirt, () => {
    ctx.moveTo(440, 684); ctx.quadraticCurveTo(400, 692, 372, 712);
    ctx.quadraticCurveTo(388, 860, 372, 1026); ctx.quadraticCurveTo(520, 1060, 668, 1026);
    ctx.quadraticCurveTo(652, 860, 668, 712); ctx.quadraticCurveTo(640, 692, 600, 684); ctx.closePath();
  });
  ctx.strokeStyle = 'rgba(38,34,47,0.35)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(420, 760); ctx.quadraticCurveTo(395, 880, 378, 990); ctx.moveTo(620, 760); ctx.quadraticCurveTo(645, 880, 662, 990); ctx.stroke();
  arm(-1, p.armL || 0);
  arm(1, p.armR || 0, p.peaceR, p.thumbR);
  // collar
  S(skin, () => { ctx.moveTo(445, 684); ctx.quadraticCurveTo(520, 740, 595, 684); ctx.closePath(); }, 10);
  // head
  ctx.save();
  ctx.translate(520, 690); ctx.rotate(p.tilt || 0); ctx.translate(-520, -690);
  S(hairC, ell(520, 372, 300, 300));
  for (const sx of [-1, 1]) {
    S(skin, ell(520 + sx * 296, 452, 56, 76));
    ctx.fillStyle = '#f39a6a'; ctx.beginPath(); ctx.ellipse(520 + sx * 306, 452, 24, 44, 0, 0, 7); ctx.fill();
  }
  S(skin, ell(520, 452, 278, 240));
  // fringe / front hair
  S(hairC, () => {
    ctx.moveTo(244, 444); ctx.lineTo(252, 330); ctx.quadraticCurveTo(262, 280, 296, 262);
    ctx.lineTo(400, 238); ctx.lineTo(468, 264); ctx.lineTo(500, 244); ctx.lineTo(560, 236); ctx.lineTo(580, 262); ctx.lineTo(640, 248); ctx.lineTo(716, 258);
    ctx.quadraticCurveTo(772, 278, 790, 330); ctx.lineTo(798, 444);
    ctx.bezierCurveTo(830, 200, 730, 72, 520, 72); ctx.bezierCurveTo(310, 72, 210, 200, 244, 444); ctx.closePath();
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 24; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(380, 140); ctx.quadraticCurveTo(450, 112, 520, 138); ctx.moveTo(574, 126); ctx.quadraticCurveTo(640, 106, 702, 144); ctx.stroke();
  // cheeks
  ctx.fillStyle = p.angry ? 'rgba(235,60,60,0.5)' : 'rgba(255,130,140,0.4)';
  ctx.beginPath(); ctx.ellipse(338, 530, 50, 30, 0, 0, 7); ctx.ellipse(702, 530, 50, 30, 0, 0, 7); ctx.fill();
  // brows
  ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 17; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const cx = 520 + sx * 150; ctx.beginPath();
    if (p.angry) { ctx.moveTo(cx + sx * 50, 300); ctx.lineTo(cx - sx * 45, 330); }
    else if (p.expr === 'sad') { ctx.moveTo(cx + sx * 50, 330); ctx.lineTo(cx - sx * 45, 305); }
    else if (p.expr === 'shock') { ctx.moveTo(cx + sx * 48, 296); ctx.quadraticCurveTo(cx, 266, cx - sx * 45, 290); }
    else { ctx.moveTo(cx + sx * 48, 326); ctx.quadraticCurveTo(cx, 298, cx - sx * 45, 314); }
    ctx.stroke();
  }
  // eyes
  const lk = (p.look || 0) * 16;
  for (const sx of [-1, 1]) {
    const cx = 520 + sx * 120, cy = 428;
    if (p.blink || (p.wink && sx === 1)) {
      ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); if (p.wink && !p.blink) { ctx.moveTo(cx - 58, cy + 10); ctx.quadraticCurveTo(cx, cy - 40, cx + 58, cy + 10); } else { ctx.moveTo(cx - 60, cy); ctx.quadraticCurveTo(cx, cy + 34, cx + 60, cy); } ctx.stroke();
      continue;
    }
    S('#ffffff', ell(cx, cy, 84, 84));
    const ir = p.expr === 'shock' ? 36 : 56;
    ctx.fillStyle = '#8b4a1c'; ctx.beginPath(); ctx.arc(cx + lk, cy + 4, ir, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a1e10'; ctx.beginPath(); ctx.arc(cx + lk, cy + 4, ir * 0.46, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + lk + ir * 0.42, cy - ir * 0.42, ir * 0.36, 0, 7); ctx.arc(cx + lk - ir * 0.42, cy + ir * 0.48, ir * 0.15, 0, 7); ctx.fill();
  }
  // nose
  if (p.blueNose > 0.01) { const k = p.blueNose; S('#2f7bff', ell(520, 492, 36 * k, 28 * k), 10); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(508, 482, 11 * k, 7 * k, 0, 0, 7); ctx.fill(); }
  else { ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(494, 490); ctx.quadraticCurveTo(520, 512, 546, 490); ctx.stroke(); }
  // mouth
  const talk = p.talk || 0;
  if (talk > 0.02) {
    const d = 40 + talk * 60;
    S('#7a2233', () => { ctx.moveTo(440, 556); ctx.lineTo(600, 556); ctx.quadraticCurveTo(596, 556 + d, 520, 556 + d); ctx.quadraticCurveTo(444, 556 + d, 440, 556); ctx.closePath(); }, 10);
    ctx.save(); ctx.beginPath(); ctx.moveTo(440, 556); ctx.lineTo(600, 556); ctx.quadraticCurveTo(596, 556 + d, 520, 556 + d); ctx.quadraticCurveTo(444, 556 + d, 440, 556); ctx.clip();
    ctx.fillStyle = '#ff7f8e'; ctx.beginPath(); ctx.ellipse(520, 556 + d, 50, 30, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(440, 548, 160, 18); ctx.restore();
    S(null, () => { ctx.moveTo(440, 556); ctx.lineTo(600, 556); ctx.quadraticCurveTo(596, 556 + d, 520, 556 + d); ctx.quadraticCurveTo(444, 556 + d, 440, 556); ctx.closePath(); }, 10);
  } else if (p.expr === 'shock') {
    S('#7a2233', ell(520, 590, 40, 52), 10);
  } else if (p.expr === 'sad' || p.angry) {
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(460, 610); ctx.quadraticCurveTo(520, 566, 580, 610); ctx.stroke();
  } else {
    S('#ffffff', () => { ctx.moveTo(420, 548); ctx.lineTo(620, 548); ctx.quadraticCurveTo(612, 644, 520, 644); ctx.quadraticCurveTo(428, 644, 420, 548); ctx.closePath(); }, 11);
  }
  if (p.sweat) S('#8fd3ff', () => { ctx.moveTo(800, 300); ctx.quadraticCurveTo(768, 352, 800, 362); ctx.quadraticCurveTo(832, 352, 800, 300); }, 8);
  if (p.tear) { const ty = p.tear * 2; S('#8fd3ff', () => { ctx.moveTo(360, 500 + ty); ctx.quadraticCurveTo(340, 540 + ty, 360, 546 + ty); ctx.quadraticCurveTo(380, 540 + ty, 360, 500 + ty); }, 8); }
  ctx.restore(); // head
  ctx.restore();
}

// ---------- Pinscher dog (black & tan), reference coords: paws at y~1240 ----------
function drawPin(p) {
  const OL = 12, S = (f, fn, lw = OL) => shape(f, fn, lw);
  const blk = '#3b3942', blk2 = '#2e2c34', tan = '#e9a35c', light = '#f7dcb4', pink = '#f0967e';
  ctx.save(); ctx.translate(p.x, p.y); const sc = (p.s || 1) * 0.5; ctx.scale(sc * (p.flip ? -1 : 1), sc); ctx.translate(-560, -1240);
  const t = p.t || 0;
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.ellipse(500, 1240, 300, 28, 0, 0, 7); ctx.fill();
  // tapered leg with tan "sock" and light paw
  const leg = (x, top, dx, col) => {
    const bx = x + dx;
    const path = () => { ctx.moveTo(x - 40, top); ctx.quadraticCurveTo(x - 44 + dx * 0.4, top + 160, bx - 26, 1196); ctx.lineTo(bx + 26, 1196); ctx.quadraticCurveTo(x + 40 + dx * 0.6, top + 160, x + 40, top); ctx.closePath(); };
    S(col, path);
    ctx.save(); ctx.beginPath(); path(); ctx.clip();
    ctx.fillStyle = tan; ctx.beginPath(); ctx.moveTo(x - 80, 1240); ctx.lineTo(x - 80, top + (1196 - top) * 0.52); ctx.lineTo(x + dx * 0.6, top + (1196 - top) * 0.38); ctx.lineTo(x + 90, top + (1196 - top) * 0.5); ctx.lineTo(x + 90, 1240); ctx.closePath(); ctx.fill();
    ctx.restore(); S(null, path);
    S(light, () => { ctx.moveTo(bx - 50, 1238); ctx.quadraticCurveTo(bx - 52, 1176, bx, 1174); ctx.quadraticCurveTo(bx + 58, 1176, bx + 60, 1238); ctx.closePath(); });
    ctx.strokeStyle = 'rgba(60,40,30,0.7)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bx - 8, 1210); ctx.lineTo(bx - 8, 1236); ctx.moveTo(bx + 20, 1208); ctx.lineTo(bx + 20, 1236); ctx.stroke();
  };
  leg(350, 900, -30, blk2); leg(650, 910, 20, blk2); leg(250, 860, -50, blk); leg(560, 920, 30, blk);
  ctx.save(); ctx.translate(0, 60);
  // tail
  ctx.save(); ctx.translate(290, 700); ctx.rotate(Math.sin(t * 9) * 0.15);
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-120, -110, -60, -330, 120, -300);
  ctx.lineWidth = 58 + OL * 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 58; ctx.strokeStyle = blk; ctx.stroke();
  ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-60, -90); ctx.bezierCurveTo(-80, -170, -40, -250, 30, -276); ctx.stroke();
  ctx.restore();
  // body
  S(blk, () => { ctx.moveTo(270, 690); ctx.bezierCurveTo(270, 610, 420, 610, 520, 655); ctx.bezierCurveTo(600, 690, 680, 650, 730, 700); ctx.bezierCurveTo(800, 780, 770, 880, 700, 905); ctx.bezierCurveTo(560, 940, 380, 925, 300, 885); ctx.bezierCurveTo(210, 840, 225, 750, 270, 690); ctx.closePath(); });
  S(tan, () => { ctx.moveTo(610, 790); ctx.quadraticCurveTo(665, 760, 705, 805); ctx.quadraticCurveTo(740, 772, 772, 790); ctx.quadraticCurveTo(760, 870, 705, 900); ctx.quadraticCurveTo(645, 870, 610, 790); ctx.closePath(); }, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(330, 660); ctx.quadraticCurveTo(400, 640, 470, 668); ctx.stroke();
  // head
  ctx.save(); ctx.translate(760, 680); ctx.rotate(p.tilt || 0); ctx.translate(-760, -680);
  for (const [bx1, by1, tx, ty, bx2, by2] of [[580, 400, 510, 110, 700, 300], [860, 290, 930, 60, 1000, 340]]) {
    S(blk, () => { ctx.moveTo(bx1, by1); ctx.quadraticCurveTo(tx - 30, ty + 60, tx, ty); ctx.quadraticCurveTo(tx + 50, ty + 60, bx2, by2); ctx.closePath(); });
    const cx = (bx1 + bx2 + tx) / 3, cy = (by1 + by2 + ty) / 3;
    ctx.fillStyle = pink; ctx.beginPath(); ctx.moveTo(cx + (bx1 - cx) * 0.55, cy + (by1 - cy) * 0.55); ctx.quadraticCurveTo(cx + (tx - cx) * 0.6 - 18, cy + (ty - cy) * 0.6 + 40, cx + (tx - cx) * 0.85, cy + (ty - cy) * 0.85); ctx.quadraticCurveTo(cx + (tx - cx) * 0.6 + 30, cy + (ty - cy) * 0.6 + 40, cx + (bx2 - cx) * 0.55, cy + (by2 - cy) * 0.55); ctx.closePath(); ctx.fill();
  }
  S('#9cc48a', () => { ctx.moveTo(620, 640); ctx.quadraticCurveTo(700, 715, 800, 690); ctx.lineTo(808, 728); ctx.quadraticCurveTo(700, 765, 608, 680); ctx.closePath(); }, 10);
  S(blk, ell(800, 470, 215, 205));
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(710, 300); ctx.quadraticCurveTo(790, 268, 870, 290); ctx.stroke();
  // cheek + brow tan marks
  ctx.fillStyle = tan; ctx.beginPath(); ctx.ellipse(690, 585, 70, 48, 0.2, 0, 7); ctx.ellipse(745, 362, 46, 22, -0.2, 0, 7); ctx.ellipse(935, 338, 34, 18, -0.1, 0, 7); ctx.fill();
  // mouth (under the snout)
  const open = p.talk ? 0.5 + p.talk * 0.7 : 1;
  S('#7a2233', () => { ctx.moveTo(770, 585); ctx.quadraticCurveTo(860, 615, 960, 590); ctx.quadraticCurveTo(935, 590 + 90 * open, 860, 594 + 90 * open); ctx.quadraticCurveTo(785, 588 + 70 * open, 770, 585); ctx.closePath(); }, 10);
  ctx.save(); ctx.beginPath(); ctx.moveTo(770, 585); ctx.quadraticCurveTo(860, 615, 960, 590); ctx.quadraticCurveTo(935, 590 + 90 * open, 860, 594 + 90 * open); ctx.quadraticCurveTo(785, 588 + 70 * open, 770, 585); ctx.clip();
  ctx.fillStyle = '#ff8fa0'; ctx.beginPath(); ctx.ellipse(860, 590 + 85 * open, 54, 34, 0, 0, 7); ctx.fill(); ctx.restore();
  // snout
  S(tan, () => { ctx.moveTo(830, 522); ctx.quadraticCurveTo(910, 492, 990, 500); ctx.quadraticCurveTo(1048, 526, 1016, 572); ctx.quadraticCurveTo(950, 606, 860, 596); ctx.quadraticCurveTo(806, 582, 815, 546); ctx.closePath(); });
  // eyes
  const eye = (cx, cy, r) => {
    if (p.blink) { ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.quadraticCurveTo(cx, cy + r * 0.5, cx + r, cy); ctx.stroke(); return; }
    S('#ffffff', ell(cx, cy, r, r * 1.05));
    ctx.fillStyle = '#3a2316'; ctx.beginPath(); ctx.arc(cx + 4, cy + 4, r * 0.78, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.28, r * 0.26, 0, 7); ctx.arc(cx - r * 0.3, cy + r * 0.36, r * 0.1, 0, 7); ctx.fill();
  };
  eye(745, 440, 72); eye(945, 405, 48);
  // nose
  S(INK, ell(1000, 518, 40, 28), 0);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(988, 508, 12, 7, -0.2, 0, 7); ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.restore();
}
