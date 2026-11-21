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
secao(0.0, 10.9, 72, [Am, Fmaj7, Dm7, E7], 'arp', vel=0.26, padv=0.2)
melodia(0.8, 72, [(76, 2), (77, 2), (76, 3), (None, 1), (74, 2), (72, 2), (71, 4), (None, 2)], vel=0.32, ate=10.6)
secao(10.9, 20.5, 76, [C, G, Am, F], 'arp', vel=0.5, padv=0.3, baixo=0.45, cordas=0.35)
melodia(10.95, 76, TEMA, vel=0.6, ate=20)
melodia(10.95, 76, TEMA, inst=bell, vel=0.22, oitava=12, ate=20)
ambiente(0.0, 20.0, 120, 900, 0.035)
tecla(2.5, 0.5); tecla(2.75, 0.5)
passo(4.25, 0.3)
suspiro(5.65, 0.8)
papel(6.6, 0.6, 0.25); batida_suave(7.75, 0.35)
suspiro(8.9, 0.5)
porta(9.6, 0.3)
prato_reverso(10.85, 1.2)
brilho(10.9, 0.45)
papel(11.3, 0.5, 0.25)
passos(12.45, 14.7, 2.2, 0.5)
passos(12.75, 14.75, 2.5, 0.3)
papel(14.7, 0.7, 0.3)
brilho(18.0, 0.45)
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
