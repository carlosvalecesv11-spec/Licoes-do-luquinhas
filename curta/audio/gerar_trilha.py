#!/usr/bin/env python3
"""
Trilha sonora original + efeitos sonoros do curta "Nosso Amor em 180 Segundos".
Tudo é sintetizado aqui (sem samples de terceiros). Gera audio/trilha.wav (180 s).
Uso:  python3 audio/gerar_trilha.py
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, os

SR = 44100
DUR = 180.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

music = np.zeros((2, N))
sfx = np.zeros((2, N))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(buf, t0, sig, gain=1.0, pan=0.0):
    """Soma um sinal mono (ou estéreo) no buffer a partir de t0 segundos."""
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    if sig.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan)); r = np.sqrt(0.5 * (1 + pan))
        sig = np.vstack([sig * l * 1.414, sig * r * 1.414])
    n = min(sig.shape[1], N - i0)
    if i0 < 0:
        sig = sig[:, -i0:]; n = min(sig.shape[1], N); i0 = 0
    buf[:, i0:i0 + n] += sig[:, :n] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1, f2], 'band', fs=SR, output='sos'), x)


def tvec(d):
    return np.arange(int(d * SR)) / SR

# ------------------------------------------------------------------ instrumentos


def piano(m, dur, vel=0.5):
    f = mtof(m)
    t = tvec(dur + 1.8)
    s = np.zeros_like(t)
    for k, a in enumerate([1, .5, .28, .14, .08, .05, .03], start=1):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > 16000:
            break
        s += a * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (0.9 + 0.75 * k) * (0.6 + f / 900))
    s *= np.minimum(1, t / 0.004)
    rel = np.clip((dur + 0.5 - t) / 0.5, 0, 1)
    s *= rel
    return s * vel * 0.32


def bell(m, dur=1.5, vel=0.4):
    f = mtof(m)
    t = tvec(dur + 1.0)
    s = np.zeros_like(t)
    for r, a, d in [(1, 1, 2.0), (2.0, .45, 3.0), (3.01, .25, 4.5), (4.16, .16, 6), (5.43, .1, 8)]:
        s += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)
    s *= np.minimum(1, t / 0.002)
    return s * vel * 0.3


def pad(ms, dur, vel=0.3, att=1.0, rel=1.4, bright=2200):
    t = tvec(dur + rel)
    s = np.zeros_like(t)
    for m in ms:
        f = mtof(m)
        for det in (-0.004, 0.0, 0.0045):
            for k in range(1, 7):
                s += (1 / k) * np.sin(2 * np.pi * f * (1 + det) * k * t + rng.random() * 6.28) * 0.18
    env = np.minimum(1, t / att) * np.clip((dur + rel - t) / rel, 0, 1)
    s = lp(s * env * (1 + 0.06 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / 2)), bright)
    return s * vel * 0.12 / max(1, len(ms) ** 0.5)


def strings(ms, dur, vel=0.3):
    return pad(ms, dur, vel, att=1.6, rel=1.8, bright=3200)


def bass(m, dur, vel=0.5):
    f = mtof(m)
    t = tvec(dur + 0.3)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    s *= np.exp(-t * 1.2) * np.minimum(1, t / 0.01) * np.clip((dur + 0.3 - t) / 0.3, 0, 1)
    return s * vel * 0.35


def pluck(m, dur=0.3, vel=0.4):
    f = mtof(m)
    t = tvec(dur + 0.4)
    s = np.zeros_like(t)
    for k, a in enumerate([1, .6, .3, .15], start=1):
        s += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 3 * k))
    return s * np.minimum(1, t / 0.002) * vel * 0.3


CH = {'maj': [0, 4, 7], 'min': [0, 3, 7], 'maj7': [0, 4, 7, 11], 'min7': [0, 3, 7, 10], '7': [0, 4, 7, 10], 'sus2': [0, 2, 7]}


def chord(root, q):
    return [root + i for i in CH[q]]

# Progressões (raiz MIDI na oitava 3/4)
C, Dm, Em, F, G, Am, E7 = (48, 'maj'), (50, 'min'), (52, 'min'), (53, 'maj'), (55, 'maj'), (57, 'min'), (52, '7')
Fmaj7, Em7, Dm7, Cmaj7 = (53, 'maj7'), (52, 'min7'), (50, 'min7'), (48, 'maj7')


def secao(t0, t1, bpm, prog, estilo='arp', vel=0.45, padv=0.25, baixo=0.0, beats=4, cordas=0.0):
    """Acompanhamento: percorre a progressão compasso a compasso entre t0 e t1."""
    beat = 60.0 / bpm
    bar = beat * beats
    t = t0
    i = 0
    while t < t1 - 0.05:
        root, q = prog[i % len(prog)]
        notes = chord(root, q)
        bl = min(bar, t1 - t)
        if padv:
            add(music, t, pad([n + 12 for n in notes], bl, padv), pan=-0.2)
        if cordas:
            add(music, t, strings([n + 12 for n in notes] + [notes[0] + 24], bl, cordas), pan=0.25)
        if baixo:
            add(music, t, bass(root - 12, bl * 0.9, baixo))
        if estilo == 'arp':
            seq = [notes[0], notes[1] + 12 if len(notes) > 2 else notes[1], notes[2] + 12, notes[1] + 12, notes[0] + 24, notes[2] + 12, notes[1] + 12, notes[2]]
            for k in range(int(beats * 2)):
                tt = t + k * beat / 2
                if tt < t1:
                    add(music, tt, piano(seq[k % len(seq)] + 0, beat * 0.9, vel * (0.85 if k % 2 else 1)), pan=0.15 * ((k % 3) - 1))
        elif estilo == 'bloco':
            add(music, t, sum_notes([n + 12 for n in notes], bl * 0.95, vel))
        elif estilo == 'saltitante':
            for k in range(beats):
                tt = t + k * beat
                add(music, tt, bass(root - 12 + (7 if k % 2 else 0), beat * 0.5, vel * 0.9))
                add(music, tt + beat / 2, sum_notes([n + 12 for n in notes], beat * 0.3, vel * 0.55, inst=pluck), pan=0.2)
        elif estilo == 'valsa':
            add(music, t, piano(root - 12, beat * 1.5, vel))
            for k in (1, 2):
                add(music, t + k * beat, sum_notes([n + 12 for n in notes], beat * 0.8, vel * 0.55), pan=0.15)
        elif estilo == 'pulso':
            for k in range(beats * 2):
                add(music, t + k * beat / 2, sum_notes([n + 12 for n in notes], beat * 0.4, vel * (1 if k % 2 == 0 else 0.7)), pan=0.1)
        t += bar
        i += 1


def sum_notes(ms, dur, vel, inst=None):
    inst = inst or piano
    sigs = [inst(m, dur, vel / len(ms) ** 0.5) for m in ms]
    n = max(len(s) for s in sigs)
    out = np.zeros(n)
    for s in sigs:
        out[:len(s)] += s
    return out


def melodia(t0, bpm, notas, inst=piano, vel=0.55, oitava=0, pan=0.0, ate=None):
    beat = 60.0 / bpm
    t = t0
    for m, d in notas:
        if ate is not None and t >= ate:
            break
        if m is not None:
            add(music, t, inst(m + oitava, d * beat * 0.95, vel), pan=pan)
        t += d * beat
    return t

# Tema principal (Dó maior) e tema melancólico (Lá menor)
TEMA = [(76, 2), (74, 1), (72, 1), (74, 2), (71, 1), (67, 1), (72, 2), (76, 1), (81, 1), (79, 3), (77, 1),
        (76, 2), (79, 1), (84, 1), (83, 2), (81, 1), (79, 1), (81, 1.5), (79, .5), (77, 1), (76, 1), (74, 4)]
TEMA_FIM = [(76, 2), (74, 1), (72, 1), (74, 2), (71, 1), (67, 1), (72, 4)]
TRISTE = [(None, 4), (69, 1.5), (67, .5), (65, 1), (64, 1), (64, 2), (67, 1), (72, 1), (71, 3), (74, 1), (72, 2), (71, 1), (69, 3)]

# ------------------------------------------------------------------ MÚSICA
# Cena 1 — melancólico
secao(0.0, 18.4, 64, [Am, F, C, G, Am], 'arp', vel=0.32, padv=0.22)
melodia(0.0, 64, TRISTE, vel=0.42, ate=18.2)
# Cena 2 — reconciliação esperançosa
secao(18.4, 24.6, 72, [F, G], 'arp', vel=0.3, padv=0.28)
add(music, 24.65, sum_notes([84, 88, 91], 2.0, 0.5, inst=bell))
secao(24.6, 36.2, 76, [F, G, Em, Am, F, G, C], 'arp', vel=0.38, padv=0.22, baixo=0.25)
melodia(27.0, 76, [(72, 1), (74, 1), (76, 2), (79, 2), (77, 1), (76, 1), (74, 2), (76, 4), (72, 1), (74, 1), (76, 2), (81, 2), (79, 4), (84, 2)], vel=0.42, ate=36)
# Cena 3 — alegria dos lírios
secao(36.0, 51.0, 104, [C, G, Am, F], 'saltitante', vel=0.5, padv=0.12)
melodia(36.9, 104, TEMA[:14], inst=bell, vel=0.55, ate=51)
melodia(36.9, 104, TEMA[:14], inst=pluck, vel=0.35, oitava=-12, ate=51)
secao(51.0, 60.2, 80, [F, G, Am, F, C], 'arp', vel=0.33, padv=0.25, cordas=0.12)
melodia(53.4, 80, [(84, 2), (83, 1), (81, 1), (79, 3), (76, 1), (77, 2), (79, 2), (84, 4)], inst=bell, vel=0.38, ate=60)
# Cena 4 — conversas carinhosas, passagem do tempo
secao(60.0, 75.2, 96, [C, Am, F, G], 'pulso', vel=0.34, padv=0.18, baixo=0.3)
melodia(60.3, 96, [(79, 1), (76, 1), (79, 1), (81, 1), (79, 2), (76, 2), (77, 1), (76, 1), (74, 1), (72, 1), (74, 4),
                   (79, 1), (76, 1), (79, 1), (84, 1), (83, 2), (79, 2), (81, 1), (79, 1), (77, 1), (74, 1), (72, 4)], inst=bell, vel=0.42, ate=75)
# Cena 5 — viagem com expectativa
secao(75.0, 84.0, 112, [F, G, Am, C], 'pulso', vel=0.38, padv=0.25, baixo=0.35)
add(music, 80.0, strings([65, 69, 72, 77], 4.0, 0.25))
secao(84.0, 88.2, 70, [C, F], 'bloco', vel=0.45, padv=0.3, cordas=0.25)
melodia(84.0, 70, [(79, 1), (84, 1), (88, 2), (86, 1)], inst=bell, vel=0.45, ate=88)
# Cena 6 — espera ansiosa → reencontro
secao(88.0, 101.8, 70, [Am, Fmaj7, Dm7, E7], 'arp', vel=0.26, padv=0.2)
melodia(88.5, 70, [(None, 4), (76, 2), (77, 2), (76, 3), (None, 1), (74, 2), (72, 2), (71, 4), (None, 2), (68, 2)], vel=0.33, ate=101.6)
secao(101.8, 110.4, 76, [C, G, Am, F], 'arp', vel=0.5, padv=0.3, baixo=0.45, cordas=0.35)
melodia(101.85, 76, TEMA[:10], vel=0.6, ate=110.2)
melodia(101.85, 76, TEMA[:10], inst=bell, vel=0.25, oitava=12, ate=110.2)
# Cena 7 — jantar, praia, balanço (valsa)
secao(110.0, 125.3, 84, [C, Am, Dm, G, C, Am, F, G], 'valsa', vel=0.42, padv=0.18, beats=3, cordas=0.12)
melodia(110.7, 84, [(76, 3), (79, 2), (77, 1), (76, 3), (74, 3), (77, 3), (81, 2), (79, 1), (79, 6), (76, 3), (72, 2), (74, 1), (77, 3), (76, 3), (74, 6)], vel=0.45, ate=125)
# Cena 8 — hotel aconchegante (até a TV falhar)
secao(125.0, 140.6, 64, [Fmaj7, Em7, Dm7, Cmaj7], 'arp', vel=0.3, padv=0.3)
# 147.5–150: piano entra suavemente após a luz
melodia(147.6, 60, [(72, 1), (76, 1), (79, 1)], vel=0.35)
# Cena 9 — fotografias: clímax
secao(150.0, 157.0, 72, [C, G], 'arp', vel=0.34, padv=0.22)
secao(157.0, 163.6, 72, [Am, F], 'arp', vel=0.4, padv=0.25, baixo=0.35, cordas=0.22)
secao(163.6, 173.6, 72, [C, G, Am], 'arp', vel=0.5, padv=0.3, baixo=0.5, cordas=0.5)
add(music, 173.6, sum_notes([60, 64, 67, 72], 4.5, 0.5))
add(music, 173.6, strings([60, 64, 67, 72, 76], 3.5, 0.35))
fim = melodia(150.1, 72, TEMA, vel=0.58, ate=173.6)
melodia(163.6, 72, TEMA[12:], vel=0.3, oitava=12, inst=bell, ate=173.5)
# Cena 10 — última nota delicada
for i, m in enumerate([72, 76, 79, 84]):
    add(music, 175.6 + i * 0.35, bell(m, 2.5, 0.4))
add(music, 177.2, bell(88, 3.5, 0.5))
add(music, 176.0, pad([60, 67, 76], 3.0, 0.18))

# Caixinha de música do desenho na TV (abafada)
cx = np.zeros((2, N))
tb = 132.0
for i, m in enumerate([84, 88, 91, 88, 86, 89, 93, 89, 84, 88, 91, 96, 93, 91, 88, 86] * 2):
    tt = tb + i * 0.27
    if tt < 140.3:
        add(cx, tt, bell(m, 0.5, 0.35))
cx[0] = lp(cx[0], 3000); cx[1] = lp(cx[1], 3000)
music += cx * 0.7

# ------------------------------------------------------------------ EFEITOS


def ruido(d):
    return rng.standard_normal(int(d * SR))


def env_ar(n, a, r):
    t = np.arange(n) / SR
    d = n / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)


def chuva(t0, t1, amp, fadein=0.5, fadeout=1.0):
    d = t1 - t0
    x = np.vstack([bp(ruido(d), 600, 7000), bp(ruido(d), 600, 7000)])
    n = x.shape[1]
    t = np.arange(n) / SR
    e = np.minimum(1, t / fadein) * np.clip((d - t) / fadeout, 0, 1)
    # gotas
    for _ in range(int(d * 25)):
        p = rng.integers(0, n - 2000)
        g = rng.random() * 0.5
        x[rng.integers(0, 2), p:p + 600] += np.exp(-np.arange(600) / 80) * np.sin(np.arange(600) * (0.3 + rng.random() * 0.2)) * g
    add(sfx, t0, x * e * amp * 0.12)


def tecla(t, v=0.5):
    n = int(0.03 * SR)
    x = hp(ruido(0.03), 2500) * np.exp(-np.arange(n) / 120) + np.sin(np.arange(n) * 2 * np.pi * 1800 / SR) * np.exp(-np.arange(n) / 90) * 0.4
    add(sfx, t, x * v * 0.25, pan=rng.uniform(-0.3, 0.3))


def notificacao(t, v=0.6):
    add(sfx, t, bell(88, 0.25, 1.0) * v, pan=0.1)
    add(sfx, t + 0.12, bell(95, 0.4, 0.9) * v, pan=0.1)


def vibra(t0, d, v=0.4):
    tt = tvec(d)
    x = np.sin(2 * np.pi * 160 * tt) * (np.sin(2 * np.pi * 3 * tt) > 0) * env_ar(len(tt), 0.01, 0.05)
    add(sfx, t0, lp(x, 600) * v * 0.3)


def swoosh(t, d=0.35, v=0.5, f0=400, f1=3000):
    n = int(d * SR)
    x = ruido(d)
    out = np.zeros(n)
    seg = 8
    for k in range(seg):
        a, b = k * n // seg, (k + 1) * n // seg
        fc = f0 + (f1 - f0) * k / seg
        out[a:b] = bp(x, fc * 0.7, min(fc * 1.4, 18000))[a:b]
    add(sfx, t, out * np.sin(np.pi * np.arange(n) / n) * v * 0.35)


def pop(t, v=0.4):
    tt = tvec(0.09)
    f = 500 + 900 * tt / 0.09
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30)
    add(sfx, t, x * v * 0.3, pan=rng.uniform(-0.4, 0.4))


def passo(t, v=0.4, areia=False):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 40) * 0.8 + lp(ruido(0.12), 900 if not areia else 2500) * np.exp(-tt * 35) * (0.6 if not areia else 1.2)
    add(sfx, t, x * v * 0.35, pan=rng.uniform(-0.2, 0.2))


def passos(t0, t1, rate, v=0.4, areia=False):
    t = t0 + 0.5 / rate
    while t < t1:
        passo(t, v * rng.uniform(0.8, 1.1), areia)
        t += 1 / rate


def campainha(t):
    add(sfx, t, bell(76, 1.2, 1.0) * 0.9, pan=0.4)
    add(sfx, t + 0.55, bell(72, 1.6, 1.0) * 0.9, pan=0.4)


def porta(t, v=0.5):
    tt = tvec(0.7)
    f = 230 + 60 * np.sin(2 * np.pi * 7 * tt) + 120 * tt
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 * env_ar(len(tt), 0.05, 0.3)
    add(sfx, t, lp(x, 1800) * v * 0.25, pan=0.4)
    tecla(t - 0.05, 0.8)


def papel(t, d=0.4, v=0.4):
    x = bp(ruido(d), 1500, 7000) * (np.abs(np.sin(np.arange(int(d * SR)) / SR * 2 * np.pi * 13)) ** 2) * env_ar(int(d * SR), 0.03, 0.15)
    add(sfx, t, x * v * 0.3)


def brilho(t, v=0.4):
    for i, m in enumerate([96, 100, 103, 108]):
        add(sfx, t + i * 0.06, bell(m, 0.6, 0.5) * v, pan=-0.3 + i * 0.2)


def tique(t, v=0.3):
    n = int(0.02 * SR)
    add(sfx, t, hp(ruido(0.02), 3000) * np.exp(-np.arange(n) / 60) * v * 0.3)


def ziper(t0, d):
    tt = tvec(d)
    x = bp(ruido(d), 1500, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * tt))) * env_ar(len(tt), 0.02, 0.05)
    add(sfx, t0, x * 0.18)


def rodinhas(t0, d):
    tt = tvec(d)
    x = lp(ruido(d), 400) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt)) * env_ar(len(tt), 0.1, 0.2)
    add(sfx, t0, x * 0.25)


def aviao(t0, d):
    tt = tvec(d)
    x = lp(ruido(d), 500) * 1.2 + bp(ruido(d), 900, 2200) * 0.3
    e = np.sin(np.pi * tt / d) ** 1.5
    pan = np.linspace(-0.9, 0.9, len(tt))
    st = np.vstack([x * e * np.sqrt(0.5 * (1 - pan)), x * e * np.sqrt(0.5 * (1 + pan))])
    add(sfx, t0, st * 0.35)


def aeroporto(t0, d):
    tt = tvec(d)
    x = bp(ruido(d), 250, 1600) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 1.3 * tt))) * env_ar(len(tt), 0.5, 0.8)
    add(sfx, t0, x * 0.06)
    add(sfx, t0 + 0.2, bell(79, 0.8, 0.5) * 0.5); add(sfx, t0 + 0.6, bell(84, 0.8, 0.5) * 0.5); add(sfx, t0 + 1.0, bell(76, 1.2, 0.5) * 0.5)


def ondas(t0, t1, v=0.4):
    d = t1 - t0
    tt = tvec(d)
    sw = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 6.0)) ** 2
    x = np.vstack([lp(ruido(d), 900) * sw, lp(ruido(d), 900) * np.roll(sw, int(SR * 0.4))])
    add(sfx, t0, x * env_ar(len(tt), 0.8, 1.0) * v * 0.25)


def gaivotas(t):
    for k in range(3):
        tt = tvec(0.35)
        f = 1800 - 900 * tt / 0.35
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.35)
        add(sfx, t + k * 0.45, x * 0.05, pan=0.5)


def ambiente(t0, t1, f1, f2, v):
    d = t1 - t0
    x = bp(ruido(d), f1, f2) * env_ar(int(d * SR), 0.8, 0.8)
    add(sfx, t0, x * v)


def rangido(t, v=0.4):
    tt = tvec(0.45)
    f = 620 + 180 * np.sin(np.pi * tt / 0.45) + 40 * np.sin(2 * np.pi * 23 * tt)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.45) ** 2
    add(sfx, t, lp(x, 2500) * v * 0.12)


def suspiro(t, v=0.3):
    tt = tvec(1.0)
    x = bp(ruido(1.0), 400, 2200) * np.sin(np.pi * tt) ** 2
    add(sfx, t, x * v * 0.12)


def estatica(t0, t1):
    d = t1 - t0
    tt = tvec(d)
    k = tt / d
    x = hp(ruido(d), 800) * (0.25 + 0.75 * k)
    burst = (rng.random(int(d * 30)) < 0.3 + 0.5 * np.linspace(0, 1, int(d * 30))).repeat(int(SR / 30))[:len(tt)]
    x = x * (0.6 + 0.4 * burst)
    add(sfx, t0, x * 0.12)


def batida_suave(t, v=0.5):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    add(sfx, t, np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 18) * v * 0.4)


def prato_reverso(t1, d=1.6):
    tt = tvec(d)
    x = hp(ruido(d), 3000) * (tt / d) ** 3
    add(sfx, t1 - d, x * 0.12)


# Cena 1
chuva(0, 6.2, 1.0)
chuva(6.0, 30.0, 0.45, fadeout=4)
suspiro(8.6, 0.6)
batida_suave(11.2, 0.25)
t = 12.3
while t < 13.5:
    tecla(t); t += 0.09 + rng.random() * 0.03
t = 14.1
while t < 14.8:
    tecla(t, 0.4); t += 0.12
t = 15.3
while t < 16.0:
    tecla(t); t += 0.09 + rng.random() * 0.03
swoosh(16.02, 0.35, 0.6)
notificacao(16.5); vibra(16.5, 0.8)
# Cena 2
papel(18.6, 0.3, 0.2)
t = 22.4
while t < 24.0:
    tecla(t, 0.3); t += 0.11
notificacao(24.6); vibra(24.6, 0.6)
for tp in [27.8, 28.6, 29.4, 30.2, 31.0, 31.8, 32.6, 34.8, 35.2]:
    pop(tp)
# Cena 3
campainha(36.8)
passos(38.0, 40.6, 2.8, 0.5)
porta(41.0)
ambiente(41.0, 46.0, 60, 300, 0.05)  # moto ligada lá fora
papel(44.8, 0.5, 0.5)
brilho(46.8, 0.5)
for tp in [47.53, 48.07, 48.6]:
    passo(tp, 0.7)
swoosh(48.8, 1.6, 0.35, 300, 1500)
for tp in [47.2, 47.9, 48.7, 49.4, 50.1]:
    pop(tp, 0.3)
papel(51.8, 0.4, 0.4)
papel(53.4, 0.6, 0.5)
brilho(54.3, 0.35)
brilho(57.9, 0.3)
# Cena 4
for tp in [60.4, 61.0, 61.6, 62.1, 62.6, 69.4, 70.2, 70.9]:
    pop(tp, 0.35)
for k in range(3):
    add(sfx, 63.0 + k * 0.25, bell(84 + (k % 2) * 3, 0.2, 0.4) * 0.6)
t = 65.0
while t < 70.0:
    tique(t, 0.5 if int((t - 65) * 2) % 2 == 0 else 0.35); t += 0.5
for tp in [66.0, 67.6, 69.2]:
    papel(tp, 0.35, 0.6)
notificacao(72.85)
# Cena 5
papel(75.2, 0.6, 0.4); papel(76.4, 0.6, 0.4)
batida_suave(78.25, 0.6)
ziper(78.3, 0.6)
passos(79.2, 80.2, 2.8, 0.45); rodinhas(79.2, 1.0)
aeroporto(79.6, 2.6)
aviao(80.0, 4.2)
ondas(84.0, 86.6, 0.5); gaivotas(84.4); gaivotas(85.6)
ambiente(86.4, 88.2, 200, 1200, 0.03)
passos(86.4, 88.0, 2.8, 0.4); rodinhas(86.4, 1.6)
# Cena 6
ambiente(88.0, 110.0, 120, 900, 0.035)
passos(95.0, 96.3, 2.6, 0.45); passos(96.5, 97.8, 2.6, 0.45)
suspiro(98.0, 0.7)
papel(99.0, 0.4, 0.2)
prato_reverso(101.8)
porta(101.8, 0.3)
brilho(102.5, 0.4)
passos(102.2, 102.9, 3.0, 0.35)
passos(103.6, 105.0, 3.0, 0.5)
papel(105.0, 0.5, 0.25)
brilho(108.1, 0.4)
# Cena 7
ondas(110.0, 125.5, 0.45)
ambiente(110.0, 115.0, 300, 2500, 0.02)
for tp in [110.6, 111.45]:
    add(sfx, tp, bell(100, 0.2, 0.3) * 0.5)
passos(115.0, 120.0, 2.8, 0.35, areia=True)
for tp in [120.8, 122.4, 124.0]:
    rangido(tp, 0.6)
# Cena 8
ambiente(125.0, 140.0, 80, 400, 0.015)
estatica(140.0, 145.0)
brilho(147.3, 0.35)

# ------------------------------------------------------------------ mixagem
def reverb(x, seg=2.4, wet=0.22):
    n = int(seg * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 3.0 / seg * 2.3)
        ir = lp(ir, 5000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[c] = x[c] + wet * fftconvolve(x[c], ir)[:x.shape[1]]
    return out

music = reverb(music, 2.6, 0.28)
sfx = reverb(sfx, 1.2, 0.1)

# Silêncio total quando a TV fica preta (02:25–02:27)
tt = np.arange(N) / SR
duck = np.ones(N)
duck *= np.where((tt > 140.4) & (tt < 147.3), 0, 1)
duck = np.convolve(duck, np.ones(2000) / 2000, mode='same')
music *= duck
sil = np.where((tt > 145.0) & (tt < 147.2), 0, 1).astype(float)
sil = np.convolve(sil, np.ones(800) / 800, mode='same')
sfx *= sil

mix = music * 1.0 + sfx * 1.0
# fade final
mix *= np.clip((DUR - tt) / 1.2, 0, 1)
mix *= np.minimum(1, tt / 0.3)
peak = np.max(np.abs(mix))
mix = mix / peak * 0.89
# compressão suave
mix = np.tanh(mix * 1.3) / np.tanh(1.3)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trilha.wav')
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).T.copy()
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('ok', out, mix.shape[1] / SR, 's')
