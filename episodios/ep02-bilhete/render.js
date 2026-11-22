// Renders video.html to an mp4 (no audio) and writes the sound-effect timeline to sfx.json
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
(async () => {
  const FPS = 30;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8767/video.html'); await p.evaluate(() => window.ready);
  const { dur, sfx } = await p.evaluate(() => ({ dur: window.DUR, sfx: window.SFX }));
  fs.writeFileSync('sfx.json', JSON.stringify({ dur, sfx }));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', 'video_sem_audio.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.ceil(dur * FPS);
  for (let i = 0; i < n; i++) {
    const d = await p.evaluate(t => window.frame(t), i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log('frames', n, 'dur', dur);
})();
