// ---------- backgrounds ----------
function cloud(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, 0, 70, 40, 0, 0, 7); ctx.ellipse(-60, 14, 50, 30, 0, 0, 7); ctx.ellipse(60, 14, 55, 30, 0, 0, 7); ctx.ellipse(10, -26, 46, 36, 0, 0, 7); ctx.fill();
  ctx.restore();
}
function windowBox(x, y, w, h, shutter) {
  shape('#fff', rr(x - 14, y - 14, w + 28, h + 28, 4));
  shape(shutter, rr(x, y, w / 2, h, 2), 5);
  shape(shutter, rr(x + w / 2, y, w / 2, h, 2), 5);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 4;
  for (let yy = y + 16; yy < y + h; yy += 18) { ctx.beginPath(); ctx.moveTo(x + 6, yy); ctx.lineTo(x + w - 6, yy); ctx.stroke(); }
  shape('#fff', rr(x - 22, y + h + 8, w + 44, 18, 4), 5);
}
function house(x, y, w, h, wall, roof, shutter) {
  shape(wall, rr(x, y, w, h, 0));
  shape(roof, poly([x - 40, y + 8, x + w / 2, y - 190, x + w + 40, y + 8]));
  windowBox(x + 50, y + 70, 150, 150, shutter);
  windowBox(x + w - 200, y + 70, 150, 150, '#6aa7d8');
}
function bgStreet(t) {
  const g = ctx.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, '#9fd0f2'); g.addColorStop(1, '#d9eefb');
  ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
  cloud(200 + (t * 8) % 1400 - 200, 260, 1.1); cloud(800 - (t * 5) % 1300 + 300, 380, 0.8);
  shape('#f5f0e1', rr(-60, 560, 560, 700, 0)); shape('#d9623f', poly([-100, 568, 220, 330, 540, 568]));
  windowBox(40, 640, 150, 150, '#f08f8f'); windowBox(300, 640, 150, 150, '#f3c94a');
  shape('#8d5a3b', rr(70, 900, 120, 300, 4)); shape('#f3c94a', ell(170, 1050, 9, 9), 4);
  shape('#f3c94a', rr(560, 520, 600, 740, 0)); shape('#d9623f', poly([520, 528, 860, 290, 1200, 528]));
  windowBox(620, 610, 150, 150, '#f3c94a'); windowBox(860, 610, 150, 150, '#6aa7d8');
  // bushes
  ctx.fillStyle = '#5fbf62';
  ctx.beginPath(); for (let i = -1; i < 13; i++) ctx.ellipse(i * 95, 1110, 70, 60, 0, 0, 7); ctx.fill();
  ctx.lineWidth = LW; ctx.strokeStyle = INK; ctx.stroke();
  shape('#cfc6b4', rr(-100, 1150, W + 200, 100, 0));
  shape('#8e8b99', rr(-100, 1250, W + 200, 700, 0));
  ctx.fillStyle = '#f2e7c3'; for (let i = 0; i < 6; i++) ctx.fillRect(i * 260 - 40, 1560, 150, 22);
}
function bgKitchen(t) {
  ctx.fillStyle = '#fbe9b7'; ctx.fillRect(-200, -200, W + 400, H + 400);
  // tiles
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 4;
  for (let y = 700; y < 1150; y += 70) for (let x = 0; x < W; x += 70) ctx.strokeRect(x, y, 70, 70);
  // cabinets top
  for (let i = 0; i < 4; i++) { shape('#7cc4b8', rr(40 + i * 255, 260, 235, 300, 14)); shape('#fff', ell(150 + i * 255, 520, 12, 12), 5); }
  // window
  shape('#bfe6ff', rr(330, 640, 420, 300, 10)); shape(null, () => { ctx.moveTo(540, 640); ctx.lineTo(540, 940); ctx.moveTo(330, 790); ctx.lineTo(750, 790); });
  shape('#ff8a7a', rr(310, 620, 70, 340, 20)); shape('#ff8a7a', rr(700, 620, 70, 340, 20));
  shape('#e9d3a6', rr(-100, 1150, W + 200, 800, 0));
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 5; for (let x = -100; x < W + 100; x += 130) { ctx.beginPath(); ctx.moveTo(x, 1150); ctx.lineTo(x - 80, 1920); ctx.stroke(); }
  shape(null, () => { ctx.moveTo(-100, 1150); ctx.lineTo(W + 100, 1150); });
}
function kitchenTable(t, eaten) {
  shape('#b07040', rr(560, 1040, 560, 50, 10));
  shape('#8a5530', rr(600, 1090, 40, 230, 8)); shape('#8a5530', rr(1040, 1090, 40, 230, 8));
  // plate + cake
  shape('#fff', ell(800, 1036, 130, 22));
  ctx.save(); ctx.translate(800, 980);
  const missing = eaten;
  shape('#6b3b22', () => { ctx.moveTo(-100, 0); ctx.lineTo(-100, 50); ctx.quadraticCurveTo(0, 74, 100, 50); ctx.lineTo(100, 0); });
  shape('#8b4f2c', ell(0, 0, 100, 28));
  shape('#f2f2f2', () => { for (let i = -3; i <= 3; i++) ctx.ellipse(i * 26, -4 + Math.abs(i) * 2, 14, 10, 0, 0, 7); }, 4);
  shape('#e2453c', ell(0, -26, 16, 16), 5);
  if (missing) shape('#fbe9b7', poly([0, 0, 100, 0, 100, 60, 40, 66]), 0), shape(null, () => { ctx.moveTo(0, 0); ctx.lineTo(0, 64); ctx.moveTo(0, 0); ctx.lineTo(100, 0); }, 6);
  ctx.restore();
}
function bgLiving(t) {
  ctx.fillStyle = '#cfe9d6'; ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = 0; x < W; x += 90) ctx.fillRect(x, 0, 40, 1150);
  shape('#fff8e7', rr(330, 380, 330, 240, 6)); shape('#f3c94a', rr(350, 400, 290, 200, 4), 5);
  shape('#ff8a7a', ell(440, 470, 40, 40), 5); shape('#5fbf62', poly([360, 590, 470, 480, 560, 560, 630, 500, 630, 590]), 5);
  // lamp
  shape('#8d5a3b', rr(930, 700, 16, 450, 6)); shape('#fff1a8', poly([870, 700, 1010, 700, 970, 590, 910, 590]));
  shape('#b8a07a', rr(-100, 1150, W + 200, 800, 0));
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 5; for (let y = 1220; y < 1920; y += 80) { ctx.beginPath(); ctx.moveTo(-100, y); ctx.lineTo(W + 100, y); ctx.stroke(); }
  shape(null, () => { ctx.moveTo(-100, 1150); ctx.lineTo(W + 100, 1150); });
  // sofa
  shape('#e2766a', rr(40, 760, 1000, 300, 60));
  shape('#cf5f55', rr(10, 900, 120, 270, 40)); shape('#cf5f55', rr(950, 900, 120, 270, 40));
  shape('#ef8b7f', rr(120, 960, 840, 140, 30));
}
function bgClass(t) {
  ctx.fillStyle = '#f4e8cf'; ctx.fillRect(-200, -200, W + 400, H + 400);
  shape('#8d5a3b', rr(60, 320, 960, 520, 16));
  shape('#2f6b4f', rr(84, 344, 912, 472, 8));
  ctx.font = '700 64px Fredoka'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('LIÇÃO DE CASA', 540, 450); ctx.font = '600 52px Fredoka'; ctx.fillText('2 + 2 = ?', 540, 560);
  ctx.fillText('Entregar HOJE!', 540, 660);
  shape('#fff', ell(920, 200, 60, 60)); shape(null, () => { ctx.moveTo(920, 200); ctx.lineTo(920, 160); ctx.moveTo(920, 200); ctx.lineTo(950, 210); });
  shape('#c9a77c', rr(-100, 1150, W + 200, 800, 0));
  shape(null, () => { ctx.moveTo(-100, 1150); ctx.lineTo(W + 100, 1150); });
}
function bgBedroom(t, lampOn) {
  ctx.fillStyle = '#3d4a86'; ctx.fillRect(-200, -200, W + 400, H + 400);
  shape('#1f2a55', rr(560, 300, 380, 380, 12));
  ctx.fillStyle = '#fff6c9'; ctx.beginPath(); ctx.arc(820, 400, 54, 0, 7); ctx.fill();
  ctx.fillStyle = '#1f2a55'; ctx.beginPath(); ctx.arc(844, 384, 48, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff6c9'; for (const [sx, sy] of [[620, 380], [700, 560], [880, 600], [650, 620], [760, 460]]) { ctx.beginPath(); ctx.arc(sx, sy, 5 + Math.sin(t * 4 + sx) * 2, 0, 7); ctx.fill(); }
  shape(null, () => { ctx.rect(560, 300, 380, 380); ctx.moveTo(750, 300); ctx.lineTo(750, 680); ctx.moveTo(560, 490); ctx.lineTo(940, 490); }, 12, '#e9dcc0');
  shape('#5a4a7a', rr(-100, 1150, W + 200, 800, 0));
  shape(null, () => { ctx.moveTo(-100, 1150); ctx.lineTo(W + 100, 1150); });
  // bed
  shape('#8d5a3b', rr(-60, 820, 70, 420, 12));
  shape('#fff', rr(-40, 900, 380, 110, 30));
  shape('#5bb3e6', rr(-60, 980, 480, 200, 30));
  // lamp on nightstand
  shape('#b07040', rr(430, 1000, 140, 170, 10));
  shape('#8d5a3b', rr(492, 920, 16, 80, 4));
  if (lampOn) { ctx.fillStyle = 'rgba(255,240,150,0.25)'; ctx.beginPath(); ctx.arc(500, 900, 260, 0, 7); ctx.fill(); }
  shape(lampOn ? '#fff1a8' : '#9a94b8', poly([440, 930, 560, 930, 530, 840, 470, 840]));
}

