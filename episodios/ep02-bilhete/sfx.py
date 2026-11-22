# Synthesizes all sound effects procedurally (no downloaded audio) and mixes them on the timeline in sfx.json
import json, numpy as np, wave
SR = 44100
rng = np.random.default_rng(7)
def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d); return e
def tone(f, dur, decay, harm=((1, 1),), a=0.004):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(w * np.sin(2 * np.pi * f * h * t) for h, w in harm); return s * env(n, a, decay)
def add(out, p, s):
    m = min(len(s), len(out) - p)
    if m > 0: out[p:p + m] += s[:m]
def lowpass(x, k):
    c = np.cumsum(np.insert(x, 0, 0)); return (c[k:] - c[:-k]) / k
def whoosh():
    n = int(0.45 * SR); x = rng.standard_normal(n + 400)
    out = np.zeros(n); t = np.arange(n) / n
    for i, k in enumerate((60, 30, 14, 8)):
        seg = lowpass(x, k)[:n]; out += seg * np.exp(-((t - 0.25 - i * 0.08) / 0.18) ** 2)
    return out / np.abs(out).max() * 0.8
def paper():
    n = int(0.35 * SR); out = np.zeros(n)
    for _ in range(14):
        p = rng.integers(0, n - 1500); L = rng.integers(300, 1400)
        b = rng.standard_normal(L) * np.hanning(L) * rng.uniform(0.3, 1); out[p:p + L] += b
    out = out - lowpass(np.pad(out, (0, 5)), 6)[:n] * 0.6
    return out / np.abs(out).max() * 0.6
def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 700 * np.exp(-t * 18) + 180
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.05) * 0.8
def ding():
    return tone(1318.5, 1.6, 0.45, ((1, 1), (2.01, 0.45), (3.02, 0.2), (4.1, 0.08))) * 0.55
def sparkle():
    out = np.zeros(int(1.2 * SR))
    for i, f in enumerate((1568, 1975.5, 2349.3, 3136, 3951)):
        s = tone(f, 0.7, 0.18, ((1, 1), (2, 0.3))) * 0.35; p = int(i * 0.07 * SR); add(out, p, s)
    return out
def step():
    n = int(0.14 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 95 * t) * env(n, 0.002, 0.04) + lowpass(rng.standard_normal(n + 20), 20)[:n] * env(n, 0.001, 0.02) * 2
    return s * 0.6
def bird():
    out = np.zeros(int(0.7 * SR))
    for k, st in enumerate((0, 0.14, 0.42)):
        n = int(0.09 * SR); t = np.arange(n) / SR; f = 2600 + 1400 * np.sin(np.pi * t / t[-1]) + k * 200
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(n) * 0.4; p = int(st * SR); add(out, p, s)
    return out
def shopbell():
    out = np.zeros(int(1.4 * SR))
    for i, f in enumerate((2093, 2637, 2093, 2637)):
        s = tone(f, 0.9, 0.22, ((1, 1), (2.7, 0.25))) * 0.3; p = int(i * 0.09 * SR); add(out, p, s)
    return out
def boing():
    n = int(0.45 * SR); t = np.arange(n) / SR; f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4) + 60 * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 0.18) * 0.6
def warm():
    out = np.zeros(int(3.0 * SR))
    for i, f in enumerate((261.6, 329.6, 392.0, 523.3)):
        n = int(2.4 * SR); t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.25) * np.exp(-t / 1.1) * 0.22
        p = int(i * 0.12 * SR); add(out, p, s)
    return out
def sad():
    out = np.zeros(int(2.4 * SR))
    for i, f in enumerate((329.6, 293.7, 261.6)):
        s = tone(f, 1.2, 0.5, ((1, 1), (2, 0.35), (3, 0.12)), a=0.01) * 0.4; p = int(i * 0.42 * SR); add(out, p, s)
    return out
def musicbox():
    notes = (523.3, 659.3, 784.0, 1046.5, 784.0, 659.3, 784.0, 1046.5, 1318.5)
    out = np.zeros(int(4.5 * SR))
    for i, f in enumerate(notes):
        s = tone(f, 1.2, 0.35, ((1, 1), (2, 0.4), (3.9, 0.1))) * 0.3; p = int(i * 0.36 * SR); add(out, p, s)
    return out
GEN = dict(whoosh=whoosh, paper=paper, pop=pop, ding=ding, sparkle=sparkle, step=step, bird=bird, shopbell=shopbell, boing=boing, warm=warm, sad=sad, musicbox=musicbox)
cfg = json.load(open('sfx.json'))
N = int((cfg['dur'] + 1) * SR); mix = np.zeros(N)
for ev in cfg['sfx']:
    s = GEN[ev['type']]() * ev['vol']; p = int(ev['t'] * SR)
    if p >= N: continue
    s = s[:N - p]; mix[p:p + len(s)] += s
mix = mix / max(1e-9, np.abs(mix).max()) * 0.5  # peak about -6 dB, leaves room for narration
stereo = np.repeat((mix * 32767).astype(np.int16)[:, None], 2, axis=1)
with wave.open('efeitos.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(stereo.tobytes())
print('ok', len(cfg['sfx']), 'events')
