#!/usr/bin/env python3
"""
Organiza a folha de referência (assets/referencias/folha/folha_animacao.png)
em PNGs transparentes separados, UM POR POSE, apenas quando a pose está
isolada (não encosta em outra figura). Poses sobrepostas (abraço/beijo)
são guardadas como quadro inteiro de referência, sem recorte de partes.

Saída: assets/referencias/folha/poses/<grupo>/<grupo>_NN.png + indice.png + indice.json
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLHA = os.path.join(RAIZ, 'assets', 'referencias', 'folha', 'folha_animacao.png')
SAIDA = os.path.join(RAIZ, 'assets', 'referencias', 'folha', 'poses')

# (grupo, retângulo x0,y0,x1,y1, área mínima, separar por figura?)
PAINEIS = [
    ('modelo_ele', (20, 30, 548, 296), 3000, True),
    ('modelo_ela', (558, 24, 1078, 296), 3000, True),
    ('expressoes_ele', (1096, 28, 1532, 112), 1500, True),
    ('expressoes_ele', (1096, 136, 1532, 222), 1500, True),
    ('expressoes_ela', (1096, 276, 1532, 362), 1500, True),
    ('expressoes_ela', (1096, 380, 1532, 468), 1500, True),
    ('partes_rig', (14, 332, 632, 492), 250, True),
    ('bocas', (655, 322, 1076, 352), 60, True),
    ('olhos', (655, 376, 1076, 418), 120, True),
    ('sobrancelhas', (655, 440, 1076, 482), 60, True),
    ('andar_ele', (14, 528, 446, 626), 800, True),
    ('andar_ela', (458, 528, 882, 626), 800, True),
    ('correr', (893, 528, 1246, 626), 800, True),
    ('sentar_ele', (14, 662, 442, 796), 800, True),
    ('sentar_ela', (456, 662, 840, 796), 800, True),
    ('segurar_objetos', (848, 662, 1246, 796), 1500, True),
    ('roupas', (1256, 528, 1532, 992), 3000, True),
    ('abraco_quadros', (14, 832, 700, 1008), 2500, True),
    ('beijo_quadros', (712, 832, 1248, 1008), 2500, True),
]


def main():
    im = np.array(Image.open(FOLHA).convert('RGBA'))
    os.makedirs(SAIDA, exist_ok=True)
    indice = {}
    cont = {}
    for grupo, (x0, y0, x1, y1), amin, _ in PAINEIS:
        reg = im[y0:y1, x0:x1].copy()
        a = reg[..., 3]
        rgb = reg[..., :3].astype(int)
        # opaco e não-texto (rótulos são quase brancos)
        branco = (rgb.min(-1) > 225)
        m = (a > 170)
        lab, n = ndimage.label(ndimage.binary_closing(m, iterations=2))
        objs = ndimage.find_objects(lab)
        comps = []
        for i, sl in enumerate(objs):
            mm = lab[sl] == i + 1
            area = mm.sum()
            if area < amin:
                continue
            frac_branco = (branco[sl] & mm).sum() / area
            if frac_branco > 0.55 and grupo not in ('olhos',):
                continue  # texto
            comps.append((sl[1].start, sl, i + 1))
        comps.sort(key=lambda c: c[0])
        pasta = os.path.join(SAIDA, grupo)
        os.makedirs(pasta, exist_ok=True)
        for _, sl, idx in comps:
            mm = (lab == idx)
            mm = ndimage.binary_dilation(mm, iterations=1)
            ys, xs = np.where(mm)
            by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            out = reg[by0:by1, bx0:bx1].copy()
            out[..., 3] = np.where(mm[by0:by1, bx0:bx1], np.clip((out[..., 3].astype(int) - 60) * 255 // 150, 0, 255), 0).astype(np.uint8)
            k = cont.get(grupo, 0) + 1
            cont[grupo] = k
            nome = f'{grupo}_{k:02d}.png'
            Image.fromarray(out).save(os.path.join(pasta, nome))
            indice.setdefault(grupo, []).append({'arquivo': f'{grupo}/{nome}', 'x': int(x0 + bx0), 'y': int(y0 + by0),
                                                 'w': int(bx1 - bx0), 'h': int(by1 - by0)})
    with open(os.path.join(SAIDA, 'indice.json'), 'w') as f:
        json.dump(indice, f, indent=1, ensure_ascii=False)
    # folha-índice para conferência
    tiles = []
    for g, lst in indice.items():
        for it in lst:
            p = Image.open(os.path.join(SAIDA, it['arquivo']))
            bg = Image.new('RGBA', p.size, (120, 200, 120, 255)); bg.alpha_composite(p)
            t = Image.new('RGB', (150, 190), (30, 30, 30))
            bg.thumbnail((146, 160)); t.paste(bg.convert('RGB'), (2, 2))
            ImageDraw.Draw(t).text((3, 172), os.path.basename(it['arquivo'])[:-4] + f" {it['w']}x{it['h']}", fill=(255, 255, 0))
            tiles.append(t)
    cols = 12
    out = Image.new('RGB', (cols * 150, ((len(tiles) + cols - 1) // cols) * 190), (10, 10, 10))
    for i, t in enumerate(tiles):
        out.paste(t, ((i % cols) * 150, (i // cols) * 190))
    out.save(os.path.join(SAIDA, 'indice.png'))
    for g, lst in indice.items():
        print(f'{g}: {len(lst)} — alturas {[it["h"] for it in lst]}')


if __name__ == '__main__':
    main()
