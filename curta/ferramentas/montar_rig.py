#!/usr/bin/env python3
"""
Recorta as imagens fornecidas dos personagens em PEÇAS ARTICULADAS (rig 2D).
Saída: assets/rig/<personagem>/<peça>.png + rig.json (offset, pivô, pai, ordem).

As áreas que ficavam escondidas atrás de braços/mãos são preenchidas por
difusão das cores vizinhas (a roupa continua a mesma, sem redesenho).
Uso: python3 ferramentas/montar_rig.py
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def poly_mask(shape, pts):
    m = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    return np.array(m) > 0


def ellipse_mask(shape, cx, cy, rx, ry):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1


def inpaint(rgb, known, region, iters=4000):
    """Preenche 'region' (bool) a partir dos pixels 'known' por difusão."""
    img = rgb.astype(np.float64).copy()
    k = known.copy()
    todo = region & ~known
    if not todo.any():
        return img
    ker = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]], float)
    for _ in range(iters):
        if not todo.any():
            break
        w = ndimage.convolve(k.astype(float), ker, mode='constant')
        front = todo & (w > 0)
        if not front.any():
            break
        for c in range(3):
            s = ndimage.convolve(img[..., c] * k, ker, mode='constant')
            img[..., c][front] = s[front] / w[front]
        k = k | front
        todo = todo & ~front
    # suaviza a área preenchida
    filled = region & ~known
    for c in range(3):
        b = ndimage.gaussian_filter(img[..., c], 3)
        img[..., c][filled] = b[filled]
    return img


def contorno(rgba, largura=3, cor=(30, 14, 6)):
    """Escurece a borda da peça (contorno como o da arte original)."""
    a = rgba[..., 3] > 128
    er = ndimage.binary_erosion(a, iterations=largura)
    borda = a & ~er
    for c in range(3):
        ch = rgba[..., c].astype(float)
        ch[borda] = ch[borda] * 0.25 + cor[c] * 0.75
        rgba[..., c] = ch.astype(np.uint8)
    return rgba


def salvar(pasta, nome, rgba, mask, info, borda=False):
    ys, xs = np.where(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out = np.zeros_like(rgba)
    out[mask] = rgba[mask]
    crop = out[y0:y1, x0:x1].copy()
    if borda:
        crop = contorno(crop)
    Image.fromarray(crop).save(os.path.join(pasta, nome + '.png'), optimize=True)
    info['x'], info['y'] = int(x0), int(y0)
    info['w'], info['h'] = int(x1 - x0), int(y1 - y0)
    return info


def construir(nome, src, partes, olhos, extras=None):
    pasta = os.path.join(RAIZ, 'assets', 'rig', nome)
    os.makedirs(pasta, exist_ok=True)
    im = np.array(Image.open(os.path.join(RAIZ, src)).convert('RGBA'))
    H, W = im.shape[:2]
    alpha = im[..., 3] > 20
    tomado = np.zeros((H, W), bool)
    rig = {'src': src, 'partes': {}}
    # 1ª passada: máscaras exclusivas por prioridade
    masks = {}
    for p in partes:
        if p.get('forma') == 'cabeca':
            m = np.zeros((H, W), bool); m[:p['y1'], :] = True
            m |= ellipse_mask((H, W), p['cx'], p['y1'], p['jaw'], p['neck'] - p['y1']) & (np.mgrid[0:H, 0:W][0] >= p['y1'])
        else:
            m = poly_mask((H, W), p['poly'])
        if p.get('dilatar'):
            m = ndimage.binary_dilation(m, iterations=p['dilatar'])
        own = m & alpha & (~tomado if not p.get('compartilha') else True)
        rr, gg, bb = im[..., 0].astype(int), im[..., 1].astype(int), im[..., 2].astype(int)
        amarelo = (rr > 190) & (gg > 120) & (bb < 110) & (gg - bb > 90)
        if p.get('sem_amarelo'):
            own &= ~amarelo
            own = ndimage.binary_opening(own, iterations=2)
        if p.get('limpar'):
            zona = np.zeros((H, W), bool)
            for nm in p['limpar']:
                zona |= ndimage.binary_dilation(masks[nm][0], iterations=22)
            own &= ~(zona & ~amarelo)
        if p.get('sem_escuro_abaixo'):
            yy = np.mgrid[0:H, 0:W][0]
            lum = im[..., :3].astype(float).mean(-1)
            own &= ~((yy > p['sem_escuro_abaixo']) & (lum < 70))
            own = ndimage.binary_opening(own, iterations=2)
        masks[p['nome']] = (m, own)
        if not p.get('compartilha'):
            tomado |= own
    for p in partes:
        m, own = masks[p['nome']]
        rgba = im.copy()
        fill_region = m & (alpha | p.get('preencher_fora', False))
        if p.get('preencher', True):
            buraco = fill_region & ~own
            if buraco.any():
                rgb = inpaint(im[..., :3], own, fill_region)
                rgba[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
                rgba[..., 3] = np.where(fill_region, 255, rgba[..., 3])
            final = fill_region | own
        else:
            final = own
        if p.get('estender_cima'):  # pernas sob a saia: prolonga a pele para cima
            y0 = p['estender_cima']
            ys = np.where(final.any(1))[0]
            top = ys.min()
            for y in range(y0, top):
                final[y] = final[top]
                rgba[y] = rgba[top + (top - y) % 25]
            rgba[..., 3] = np.where(final, 255, rgba[..., 3])
        info = {k: p[k] for k in ('pai', 'pivo', 'z') if k in p}
        for k in ('ponta', 'tipo'):
            if k in p:
                info[k] = p[k]
        if p.get('dilatar'):
            masks[p['nome']] = (m, own)
        rig['partes'][p['nome']] = salvar(pasta, p['nome'], rgba, final, info, borda=p.get('borda', False))

    # olhos: íris móvel + fundo branco
    rig['olhos'] = []
    for i, (cx, cy, rx, ry) in enumerate(olhos):
        reg = ellipse_mask((H, W), cx, cy, rx * 0.93, ry * 0.93)
        lum = im[..., :3].astype(float).mean(-1)
        escuro = reg & (lum < 120)
        ys, xs = np.where(escuro)
        icx, icy = xs.mean(), ys.mean()
        ir = np.sqrt(escuro.sum() / np.pi) * 1.08
        disco = ellipse_mask((H, W), icx, icy, ir, ir) & reg
        branco = reg & ~disco & (lum > 170)
        rgb = inpaint(im[..., :3], branco, reg)
        base = im.copy()
        base[..., :3] = np.where(reg[..., None], np.clip(rgb, 0, 255), im[..., :3]).astype(np.uint8)
        base[..., 3] = np.where(reg, 255, 0)
        bi = salvar(pasta, f'olho{i}_fundo', base, reg, {})
        iris = im.copy(); iris[..., 3] = np.where(disco, 255, 0)
        ii = salvar(pasta, f'olho{i}_iris', iris, disco, {})
        rig['olhos'].append({'cx': cx, 'cy': cy, 'rx': rx * 0.93, 'ry': ry * 0.93, 'fundo': bi, 'iris': ii,
                             'icx': float(icx), 'icy': float(icy), 'ir': float(ir)})
    if extras:
        rig.update(extras)
    with open(os.path.join(pasta, 'rig.json'), 'w') as f:
        json.dump(rig, f, indent=1)
    # versão .js (funciona também abrindo o index.html direto do disco)
    with open(os.path.join(pasta, 'rig.js'), 'w') as f:
        f.write('window.RIG_DATA = window.RIG_DATA || {};\nwindow.RIG_DATA[%s] = %s;\n' % (json.dumps(nome), json.dumps(rig)))
    print(nome, 'ok:', ', '.join(rig['partes'].keys()))


# ---------------------------------------------------------------- MACAQUINHO (camisa preta)
construir('m_preta', 'assets/referencias/macaquinho_camisa_preta.png', [
    dict(nome='cabeca', forma='cabeca', y1=398, cx=535, jaw=114, neck=452, pai='tronco', pivo=[535, 452], z=50, preencher=False),
    dict(nome='antebracoE', pai='bracoE', pivo=[305, 655], ponta=[350, 885], z=46, borda=True, sem_escuro_abaixo=805, dilatar=3,
         poly=[[244, 640], [372, 650], [394, 730], [390, 800], [382, 900], [322, 900], [302, 832], [268, 802], [248, 762], [240, 700]]),
    dict(nome='antebracoD', pai='bracoD', pivo=[715, 655], ponta=[655, 885], z=46, borda=True, sem_escuro_abaixo=805, dilatar=3,
         poly=[[766, 640], [643, 650], [596, 730], [596, 800], [616, 900], [694, 900], [714, 832], [748, 802], [762, 762], [768, 700]]),
    dict(nome='bracoE', pai='tronco', pivo=[330, 528], z=44, borda=True,
         poly=[[322, 468], [292, 512], [262, 578], [246, 652], [302, 672], [372, 664], [368, 600], [362, 545], [348, 492]]),
    dict(nome='bracoD', pai='tronco', pivo=[690, 528], z=44, borda=True,
         poly=[[698, 468], [726, 512], [750, 578], [764, 652], [712, 672], [642, 664], [646, 600], [654, 545], [670, 492]]),
    dict(nome='quadril', pai='raiz', pivo=[505, 935], z=30,
         poly=[[352, 875], [660, 875], [676, 1004], [505, 1014], [334, 1004]]),
    dict(nome='tronco', pai='quadril', pivo=[505, 900], z=40, compartilha=False,
         poly=[[300, 395], [770, 395], [700, 470], [662, 540], [646, 600], [642, 700], [648, 880], [652, 908], [358, 908], [366, 880], [376, 700], [372, 600], [358, 540], [322, 470]]),
    dict(nome='pescoco', pai='tronco', pivo=[535, 452], z=39, compartilha=True, preencher=False,
         poly=[[440, 380], [630, 380], [640, 480], [430, 480]]),
    dict(nome='canelaE', pai='coxaE', pivo=[400, 1185], z=22,
         poly=[[293, 1158], [502, 1158], [500, 1330], [472, 1505], [262, 1505], [276, 1330]]),
    dict(nome='canelaD', pai='coxaD', pivo=[595, 1185], z=22,
         poly=[[503, 1158], [692, 1158], [702, 1300], [742, 1505], [496, 1505], [503, 1330]]),
    dict(nome='coxaE', pai='quadril', pivo=[405, 950], z=24,
         poly=[[296, 900], [505, 900], [502, 1215], [300, 1215]]),
    dict(nome='coxaD', pai='quadril', pivo=[595, 950], z=24,
         poly=[[505, 900], [692, 900], [694, 1215], [503, 1215]]),
], olhos=[(473, 263, 42, 42), (605, 263, 42, 42)])

# ---------------------------------------------------------------- MACAQUINHA (vestido amarelo)
construir('f_vestido', 'assets/referencias/macaquinha_vestido_amarelo.png', [
    dict(nome='cabeca', forma='cabeca', y1=494, cx=502, jaw=116, neck=552, pai='tronco', pivo=[502, 552], z=50, preencher=False),
    dict(nome='maos', sem_amarelo=True, pai='raiz', pivo=[505, 960], z=48, preencher=False, borda=False, dilatar=8,
         poly=[[452, 905], [522, 884], [566, 892], [578, 960], [562, 1042], [468, 1044], [446, 980]]),
    dict(nome='antebracoE', sem_amarelo=True, pai='bracoE', pivo=[368, 712], ponta=[478, 922], z=45, borda=True, dilatar=9,
         poly=[[326, 698], [408, 698], [452, 788], [500, 872], [512, 918], [478, 944], [440, 904], [388, 822], [344, 760]]),
    dict(nome='antebracoD', sem_amarelo=True, pai='bracoD', pivo=[612, 712], ponta=[532, 902], z=45, borda=True, dilatar=9,
         poly=[[574, 698], [654, 698], [634, 782], [594, 862], [566, 906], [520, 920], [512, 884], [544, 818]]),
    dict(nome='bracoE', pai='tronco', pivo=[392, 596], z=46, borda=False, preencher=False,
         poly=[[276, 560], [330, 532], [420, 540], [448, 600], [444, 700], [404, 730], [330, 730], [282, 694], [268, 620]]),
    dict(nome='bracoD', pai='tronco', pivo=[612, 596], z=46, borda=False, preencher=False,
         poly=[[586, 542], [680, 532], [720, 600], [716, 692], [684, 726], [600, 730], [572, 700], [574, 600]]),
    dict(nome='tronco', pai='quadril', pivo=[500, 790], z=40, limpar=['antebracoE', 'antebracoD', 'maos'],
         poly=[[392, 540], [612, 540], [640, 806], [366, 806]]),
    dict(nome='pescoco', pai='tronco', pivo=[502, 552], z=39, compartilha=True, preencher=False,
         poly=[[420, 470], [590, 470], [600, 600], [410, 600]]),
    dict(nome='quadril', pai='raiz', pivo=[500, 790], z=30, limpar=['antebracoE', 'antebracoD', 'maos'],
         poly=[[336, 760], [668, 760], [762, 1000], [806, 1100], [786, 1196], [216, 1196], [196, 1100], [240, 1000]]),
    dict(nome='pernaE', pai='quadril', pivo=[432, 1010], z=20, estender_cima=1010,
         poly=[[352, 1150], [502, 1150], [500, 1508], [338, 1508]]),
    dict(nome='pernaD', pai='quadril', pivo=[568, 1010], z=20, estender_cima=1010,
         poly=[[500, 1150], [656, 1150], [660, 1508], [500, 1508]]),
], olhos=[(410, 356, 48, 46), (574, 343, 48, 46)])
