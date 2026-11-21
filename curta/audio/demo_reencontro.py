#!/usr/bin/env python3
"""Áudio da demonstração do reencontro (20 s): reutiliza os instrumentos e efeitos de gerar_trilha.py."""
import ast, os
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
fonte = open(os.path.join(AQUI, 'gerar_trilha.py'), encoding='utf-8').read()
arv = ast.parse(fonte)
# carrega apenas importações, constantes e funções (sem gerar o filme inteiro)
primeira = min(n.lineno for n in arv.body if isinstance(n, ast.Expr) and isinstance(n.value, ast.Call))
keep = [n for n in arv.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.FunctionDef)) or
        (isinstance(n, ast.Assign) and n.lineno < primeira)]
g = {}
exec(compile(ast.Module(body=keep, type_ignores=[]), 'gerar_trilha', 'exec'), g)
g['DUR'] = 20.0; g['N'] = int(g['SR'] * 20.0)
g['music'] = np.zeros((2, g['N'])); g['sfx'] = np.zeros((2, g['N']))
g['rng'] = np.random.default_rng(11)
exec('''
C, Dm, Em, F, G, Am, E7 = (48, 'maj'), (50, 'min'), (52, 'min'), (53, 'maj'), (55, 'maj'), (57, 'min'), (52, '7')
Fmaj7, Dm7 = (53, 'maj7'), (50, 'min7')
TEMA = [(76, 2), (74, 1), (72, 1), (74, 2), (71, 1), (67, 1), (72, 2), (76, 1), (81, 1), (79, 3), (77, 1)]
secao(0.0, 12.7, 72, [Am, Fmaj7, Dm7, E7], 'arp', vel=0.27, padv=0.2)
melodia(1.0, 72, [(76, 2), (77, 2), (76, 3), (None, 1), (74, 2), (72, 2), (71, 4), (None, 2), (68, 2)], vel=0.33, ate=12.5)
secao(12.7, 20.5, 76, [C, G, Am, F], 'arp', vel=0.5, padv=0.3, baixo=0.45, cordas=0.35)
melodia(12.75, 76, TEMA, vel=0.6, ate=20)
melodia(12.75, 76, TEMA, inst=bell, vel=0.22, oitava=12, ate=20)
ambiente(0.0, 20.0, 120, 900, 0.035)
passos(0.0, 3.0, 2.35, 0.45)
suspiro(6.7, 0.7)
passos(7.0, 8.2, 2.35, 0.45); passos(8.7, 9.9, 2.35, 0.45)
suspiro(9.9, 0.6)
papel(10.6, 0.5, 0.25)
prato_reverso(12.7)
porta(12.6, 0.3)
passos(13.0, 13.8, 2.5, 0.3)
brilho(13.3, 0.4)
papel(13.6, 0.4, 0.25)
passos(14.2, 15.6, 2.4, 0.5)
papel(15.6, 0.6, 0.3)
brilho(18.8, 0.45)
''', g)
music, sfx, SR, N = g['music'], g['sfx'], g['SR'], g['N']
music = g['reverb'](music, 2.6, 0.28); sfx = g['reverb'](sfx, 1.2, 0.1)
mix = music + sfx
tt = np.arange(N) / SR
mix *= np.clip((20 - tt) / 0.8, 0, 1) * np.minimum(1, tt / 0.4)
mix = mix / np.max(np.abs(mix)) * 0.89
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
import wave
out = os.path.join(AQUI, 'demo_reencontro.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).T.copy().tobytes())
print('ok', out)
