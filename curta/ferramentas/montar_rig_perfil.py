#!/usr/bin/env python3
"""
Monta os rigs de PERFIL a partir das folhas recebidas (recursos/recebidos/):
  - ele: cabeça e camisa do perfil montado; braços, coxas, canelas, tênis e mãos
         das peças avulsas da própria folha.
  - ela: cabeça, vestido e braço do perfil montado; pernas da peça avulsa.
Também separa os 8 quadros da caminhada dele (figuras inteiras, sem sobreposição).

Saída: assets/rig/m_perfil/, assets/rig/f_perfil/, assets/sprites/ele_caminhada/
Coordenadas do rig = coordenadas da folha de perfil (o personagem montado = pose neutra).
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REC = os.path.join(RAIZ, 'recursos', 'recebidos')


def carregar(nome):
    return np.array(Image.open(os.path.join(REC, nome)).convert('RGBA'))


def comp_mask(im, box):
    """Máscara da maior peça dentro do retângulo (x0,y0,x1,y1)."""
    x0, y0, x1, y1 = box
    a = im[y0:y1, x0:x1, 3]
    m = a > 30
    lab, n = ndimage.label(m)
    if n == 0:
        return None
    areas = ndimage.sum(m, lab, range(1, n + 1))
    k = int(np.argmax(areas)) + 1
    mm = ndimage.binary_dilation(lab == k, iterations=1) & (a > 8)
    out = np.zeros(im.shape[:2], bool)
    out[y0:y1, x0:x1] = mm
    return out


def poly_mask(shape, pts):
    m = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    return np.array(m) > 0


def inpaint(rgb, known, region, iters=3000):
    img = rgb.astype(np.float64).copy(); k = known.copy(); todo = region & ~known
    ker = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]], float)
    for _ in range(iters):
        if not todo.any():
            break
        w = ndimage.convolve(k.astype(float), ker, mode='constant')
        fr = todo & (w > 0)
        if not fr.any():
            break
        for c in range(3):
            s = ndimage.convolve(img[..., c] * k, ker, mode='constant')
            img[..., c][fr] = s[fr] / w[fr]
        k |= fr; todo &= ~fr
    filled = region & ~known
    for c in range(3):
        b = ndimage.gaussian_filter(img[..., c], 2.5)
        img[..., c][filled] = b[filled]
    return img


def contorno(rgba, largura=2):
    a = rgba[..., 3] > 128
    borda = a & ~ndimage.binary_erosion(a, iterations=largura)
    for c, v in enumerate((30, 14, 6)):
        ch = rgba[..., c].astype(float); ch[borda] = ch[borda] * 0.3 + v * 0.7; rgba[..., c] = ch.astype(np.uint8)
    return rgba


def caixa_olho(S, regiao):
    x0, y0, x1, y1 = regiao
    p = S[y0:y1, x0:x1].astype(int)
    branco = (p[..., :3].min(-1) > 215) & (p[..., 3] > 200)
    lab, n = ndimage.label(branco)
    k = int(np.argmax(ndimage.sum(branco, lab, range(1, n + 1)))) + 1
    ys, xs = np.where(lab == k)
    return [int(x0 + xs.min()), int(y0 + ys.min()), int(x0 + xs.max()), int(y0 + ys.max())]


def ajustar(S, mask, W, H, alvo):
    ys, xs = np.where(mask)
    p = S[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()
    p[..., 3] = np.where(mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1], p[..., 3], 0)
    x0, y0, x1, y1 = alvo
    img = Image.fromarray(p).resize((x1 - x0, y1 - y0), Image.LANCZOS)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(img, (x0, y0))
    return np.array(c)


class Rig:
    def __init__(self, nome, W, H):
        self.nome, self.W, self.H = nome, W, H
        self.pasta = os.path.join(RAIZ, 'assets', 'rig', nome)
        os.makedirs(self.pasta, exist_ok=True)
        self.d = {'perfil': True, 'partes': {}, 'olhos': [], 'rosto': {}}

    def salvar_rgba(self, arq, rgba):
        ys, xs = np.where(rgba[..., 3] > 0)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        Image.fromarray(rgba[y0:y1, x0:x1]).save(os.path.join(self.pasta, arq + '.png'), optimize=True)
        return {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}

    def parte(self, nome, rgba, pai, pivo, z, **extra):
        info = self.salvar_rgba(nome, rgba)
        info.update({'pai': pai, 'pivo': [float(pivo[0]), float(pivo[1])], 'z': z})
        info.update(extra)
        self.d['partes'][nome] = info

    def variante(self, parte, var, rgba):
        info = self.salvar_rgba(f'{parte}__{var}', rgba)
        self.d['partes'][parte].setdefault('variantes', {})[var] = info

    def rosto(self, nome, rgba):
        self.d['rosto'][nome] = self.salvar_rgba('rosto_' + nome, rgba)

    def gravar(self, extras):
        self.d.update(extras)
        with open(os.path.join(self.pasta, 'rig.json'), 'w') as f:
            json.dump(self.d, f, indent=1)
        with open(os.path.join(self.pasta, 'rig.js'), 'w') as f:
            f.write('window.RIG_DATA = window.RIG_DATA || {};\nwindow.RIG_DATA[%s] = %s;\n' % (json.dumps(self.nome), json.dumps(self.d)))
        print(self.nome, 'ok:', ', '.join(self.d['partes'].keys()), '| rosto:', ', '.join(self.d['rosto'].keys()))


def colocar(src, mask, W, H, escala, ancora_src, ancora_dst, escurecer=1.0, flip=False):
    """Recorta a peça (mask) da folha, escala e posiciona no canvas do rig (ancora_src -> ancora_dst)."""
    ys, xs = np.where(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    p = src[y0:y1, x0:x1].copy(); p[..., 3] = np.where(mask[y0:y1, x0:x1], p[..., 3], 0)
    img = Image.fromarray(p)
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    nw, nh = max(1, round(img.width * escala)), max(1, round(img.height * escala))
    img = img.resize((nw, nh), Image.LANCZOS)
    ax = (ancora_src[0] - x0) * escala if not flip else (x1 - ancora_src[0]) * escala
    ay = (ancora_src[1] - y0) * escala
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(img, (int(round(ancora_dst[0] - ax)), int(round(ancora_dst[1] - ay))))
    out = np.array(canvas)
    if escurecer != 1.0:
        out[..., :3] = (out[..., :3].astype(float) * escurecer).astype(np.uint8)
    return out


def estender_topo(rgba, linhas):
    """Prolonga o topo da peça para cima (fica escondido sob a junta)."""
    ys = np.where(rgba[..., 3].any(1))[0]
    if len(ys) == 0:
        return rgba
    top = ys.min()
    for y in range(max(0, top - linhas), top):
        rgba[y] = rgba[top + 2]
    return rgba


# =====================================================================
# ELE — perfil (olhando para a direita)
# =====================================================================
def ele():
    S = carregar('ele_perfil_pecas.png')
    H, W = S.shape[:2]
    alpha = S[..., 3] > 30
    fig = comp_mask(S, (23, 9, 278, 897))
    r = Rig('m_perfil', W, H)
    lum = S[..., :3].astype(int).mean(-1)

    # cabeça (do personagem montado), até o queixo; a gola fica no tronco
    cab = fig & poly_mask(S.shape, [[0, 0], [300, 0], [300, 262], [0, 262]])
    rr_, gg_, bb_ = S[..., 0].astype(int), S[..., 1].astype(int), S[..., 2].astype(int)
    camisa = (rr_ < 75) & (np.abs(rr_ - bb_) < 22)
    cab &= ~((np.mgrid[0:H, 0:W][0] > 222) & camisa)
    cab = ndimage.binary_opening(cab, iterations=1)
    c = S.copy(); c[..., 3] = np.where(cab, S[..., 3], 0)
    r.parte('cabeca', c, 'tronco', (160, 250), 50)

    # pescoço (peça avulsa 4) atrás da cabeça
    neck = comp_mask(S, (304, 266, 387, 351))
    r.parte('pescoco', colocar(S, neck, W, H, 0.9, (345, 300), (165, 262)), 'tronco', (165, 255), 39)

    # tronco: camisa do personagem montado SEM o braço (área do braço preenchida)
    braco_reg = poly_mask(S.shape, [[58, 285], [142, 282], [150, 400], [158, 470], [165, 540], [185, 612], [96, 618], [92, 545], [58, 470], [50, 400]])
    tronco_reg = poly_mask(S.shape, [[78, 238], [205, 238], [216, 290], [222, 420], [226, 540], [150, 548], [70, 540], [62, 400], [68, 300]])
    conhecido = fig & tronco_reg & ~braco_reg & ~((np.mgrid[0:H, 0:W][1] > 214) & (np.mgrid[0:H, 0:W][0] > 500))
    alvo_t = tronco_reg & fig & ~poly_mask(S.shape, [[0, 300], [76, 300], [76, 560], [0, 560]])
    rgb = inpaint(S[..., :3], conhecido, alvo_t)
    t = S.copy(); t[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    t[..., 3] = np.where(alvo_t, 255, 0)
    t[..., 3] = np.where(conhecido, S[..., 3], t[..., 3])
    r.parte('tronco', contorno(t), 'quadril', (140, 535), 40)

    # quadril (cós da calça) do personagem montado
    q = S.copy(); qreg = fig & poly_mask(S.shape, [[70, 512], [222, 512], [216, 592], [74, 592]])
    q[..., 3] = np.where(qreg, S[..., 3], 0)
    r.parte('quadril', q, 'raiz', (140, 540), 30)

    # pernas: coxas 26/25, canelas 34/33, tênis 43/44 (peças avulsas), escala 0.9
    E = 1.13
    for lado, (coxa, canela, tenis), esc, z0 in [('N', ((668, 1047, 772, 1244), (677, 1255, 776, 1419), (547, 1425, 732, 1520)), 1.0, 26),
                                                ('T', ((539, 1047, 644, 1243), (530, 1255, 635, 1412), (784, 1437, 955, 1520)), 0.86, 10)]:
        quad = (138 if lado == 'N' else 156, 548)
        m = comp_mask(S, coxa); bx = (coxa[0] + coxa[2]) / 2
        r.parte('coxa' + lado, colocar(S, m, W, H, E, (bx, coxa[1] + 22), quad, esc), 'quadril', quad, z0)
        joelho = (quad[0], quad[1] + (coxa[3] - coxa[1] - 48) * E)
        m = comp_mask(S, canela); bx = (canela[0] + canela[2]) / 2
        cn = estender_topo(colocar(S, m, W, H, E, (bx, canela[1] + 10), joelho, esc), 20)
        r.parte('canela' + lado, cn, 'coxa' + lado, joelho, z0 - 2)
        tornozelo = (joelho[0], joelho[1] + (canela[3] - canela[1] - 52) * E)
        m = comp_mask(S, tenis)
        ax = tenis[0] + (tenis[2] - tenis[0]) * 0.32  # tornozelo fica a ~1/3 do calcanhar
        r.parte('pe' + lado, colocar(S, m, W, H, E, (ax, tenis[1] + 18), (tornozelo[0], tornozelo[1] - 4), esc), 'canela' + lado, tornozelo, z0 - 1)

    # braços: peças 9 (perto) e 11 (longe) divididas no punho dobrado (cotovelo)
    for lado, box, esc, z0 in [('N', (492, 609, 608, 849), 1.0, 46), ('T', (868, 609, 966, 848), 0.75, 6)]:
        m = comp_mask(S, box)
        ombro = (108, 302) if lado == 'N' else (128, 300)
        bx = (box[0] + box[2]) / 2
        full = colocar(S, m, W, H, 1.0, (bx, box[1] + 28), ombro, esc)
        rr, gg = full[..., 0].astype(int), full[..., 1].astype(int)
        pelo = (full[..., 3] > 0) & (rr > 70) & (rr > gg * 1.25)
        yy = np.mgrid[0:H, 0:W][0]
        ys = np.where(pelo.any(1))[0]
        corte = int(np.percentile(ys, 8))           # onde o pelo do antebraço aparece
        ante = full.copy(); ante[..., 3] = np.where((yy >= corte - 4) & (full[..., 3] > 0), full[..., 3], 0)
        ante[..., 3] = np.where(ante[..., 3] > 0, ante[..., 3], 0)
        # só o pelo abaixo do corte vira antebraço; prolonga por baixo do punho
        ante[..., 3] = np.where(pelo | ((yy >= corte + 6) & (full[..., 3] > 0)), ante[..., 3], 0)
        ante = estender_topo(ante, 34)
        sup = full.copy(); sup[..., 3] = np.where(yy < corte + 14, full[..., 3], 0)
        ys2 = np.where(ante[..., 3].any(1))[0]
        cotovelo = (ombro[0] + 6, corte + 6)
        pulso_y = ys2.max() - 6
        xs_p = np.where(ante[pulso_y - 10, :, 3] > 0)[0]
        pulso = (float(xs_p.mean()) if len(xs_p) else ombro[0], float(pulso_y))
        r.parte('braco' + lado, sup, 'tronco', ombro, z0 + 1)
        r.parte('antebraco' + lado, ante, 'braco' + lado, cotovelo, z0, ponta=[pulso[0], pulso[1]])
        # mão relaxada (12) e variantes: aberta (13), segurando (16), fechada (14)
        maos = {'relaxada': (337, 869, 417, 1022), 'aberta': (434, 859, 535, 1030), 'segurando': (791, 868, 884, 1023), 'fechada': (556, 865, 647, 1014)}
        base = None
        for var, mb in maos.items():
            mm = comp_mask(S, mb)
            mx = (mb[0] + mb[2]) / 2
            img = colocar(S, mm, W, H, 0.82, (mx, mb[1] + 26), (pulso[0], pulso[1] - 8), esc)
            if base is None:
                r.parte('mao' + lado, img, 'antebraco' + lado, (pulso[0], pulso[1] - 6), z0 + 0.5)
                base = True
            r.variante('mao' + lado, var, img)

    # mão segurando o celular (folha de mãos, peça 8: mão + celular)
    M = carregar('maos.png')
    mc = np.zeros(M.shape[:2], bool); mc[690:985, 60:322] = M[690:985, 60:322, 3] > 30
    pz = r.d['partes']['antebracoN']['ponta']
    r.variante('maoN', 'celular', colocar(M, mc, W, H, 0.4, (150, 712), (pz[0], pz[1] - 8)))
    # rosto (sobreposições): pálpebras e bocas da folha
    ob = caixa_olho(S, (190, 100, 262, 200))
    olho = {'cx': (ob[0] + ob[2]) / 2, 'cy': (ob[1] + ob[3]) / 2, 'caixa': ob}
    for nome, box in [('olho_fechado', (67, 1193, 141, 1246)), ('olho_meio', (70, 1114, 138, 1179))]:
        m = comp_mask(S, box)
        r.rosto(nome, ajustar(S, m, W, H, [ob[0] - 7, ob[1] - 6, ob[2] + 9, ob[3] + 8]))
    boca = {'cx': 228, 'cy': 204}
    for nome, box, larg in [('boca_riso', (228, 1320, 293, 1360), 40), ('boca_aberta', (146, 1325, 206, 1360), 36),
                            ('boca_sorriso_aberto', (145, 1280, 206, 1307), 36), ('boca_o', (75, 1376, 95, 1404), 14), ('boca_triste', (232, 1384, 291, 1397), 34)]:
        m = comp_mask(S, box); bx, by = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        esc = larg / (box[2] - box[0])
        img = colocar(S, m, W, H, esc, (bx, by), (boca['cx'], boca['cy'] + 2))
        if nome == 'boca_triste':  # a folha traz a curva "feliz": vira para a tristeza
            img = np.flipud(img); ys = np.where(img[..., 3].any(1))[0]
            img = np.roll(img, int(boca['cy'] + 4 - ys.mean()), axis=0)
        r.rosto(nome, img)
    r.gravar({'altura': 884, 'cx': 160, 'pes': 893, 'olho': olho, 'boca': boca, 'pele': '#%02x%02x%02x' % tuple(S[196, 250, :3]),
             'pts': {'testa': [232, 98], 'peito': [212, 340], 'costas': [84, 400], 'ombro': [108, 302], 'boca': [246, 206], 'nuca': [96, 200]}})


# =====================================================================
# ELA — perfil (olhando para a direita; no filme é espelhada para a esquerda)
# =====================================================================
def ela():
    S = carregar('ela_perfil_pecas.png')
    H, W = S.shape[:2]
    fig = comp_mask(S, (15, 18, 376, 1125))
    r = Rig('f_perfil', W, H)
    yy, xx = np.mgrid[0:H, 0:W]

    cab = fig & poly_mask(S.shape, [[0, 0], [390, 0], [390, 325], [345, 348], [300, 360], [262, 352], [172, 378], [10, 385], [0, 360]])
    c = S.copy(); c[..., 3] = np.where(cab, S[..., 3], 0)
    r.parte('cabeca', c, 'tronco', (230, 380), 50)

    braco_reg = poly_mask(S.shape, [[136, 388], [258, 388], [266, 508], [150, 518], [130, 450]])
    ante_reg = poly_mask(S.shape, [[160, 494], [254, 494], [262, 690], [296, 742], [282, 798], [196, 798], [184, 700], [160, 600]])
    corpo_reg = fig & ~cab & poly_mask(S.shape, [[0, 330], [400, 330], [400, 830], [0, 830]])
    alvo = corpo_reg | ((braco_reg | ante_reg) & poly_mask(S.shape, [[60, 380], [380, 380], [380, 820], [60, 820]]) & ndimage.binary_fill_holes(fig))
    conhecido = corpo_reg & ~braco_reg & ~ante_reg
    rgb = inpaint(S[..., :3], conhecido, alvo)
    t = S.copy(); t[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    t[..., 3] = np.where(alvo, 255, 0); t[..., 3] = np.where(conhecido, S[..., 3], t[..., 3])
    rr_, gg_ = S[..., 0].astype(int), S[..., 1].astype(int)
    perna_pelo = (gg_ < 105) & (rr_ > 70)
    t[..., 3] = np.where((yy > 770) & perna_pelo & ~ndimage.binary_dilation(gg_ > 140, iterations=4), 0, t[..., 3])
    t[..., 3] = np.where(yy > 830, 0, t[..., 3])
    r.parte('quadril', contorno(t), 'raiz', (235, 570), 30)
    # o "tronco" é o mesmo corpo (vestido inteiro); fica como peça vazia para a hierarquia
    vazio = np.zeros_like(S); vazio[560, 235] = [0, 0, 0, 1]
    r.parte('tronco', vazio, 'quadril', (235, 570), 31)

    for lado, esc, z0 in [('N', 1.0, 46), ('T', 0.78, 6)]:
        dx = 0 if lado == 'N' else 30
        b = S.copy(); b[..., 3] = np.where(fig & braco_reg, S[..., 3], 0)
        a = S.copy(); a[..., 3] = np.where(fig & ante_reg & ~braco_reg | (fig & ante_reg & (yy > 500)), S[..., 3], 0)
        a = estender_topo(a, 26)
        if dx:
            b = np.roll(b, dx, axis=1); a = np.roll(a, dx, axis=1)
        if esc != 1.0:
            for arr in (a, b):
                arr[..., :3] = (arr[..., :3].astype(float) * esc).astype(np.uint8)
        r.parte('braco' + lado, b, 'tronco', (200 + dx, 425), z0 + 1)
        r.parte('antebraco' + lado, a, 'braco' + lado, (208 + dx, 505), z0, ponta=[245 + dx, 770])

    # pernas: peça avulsa 16 (perfil), a de trás escurecida
    m = comp_mask(S, (692, 805, 856, 1115))
    for lado, x, esc, z0 in [('N', 200, 1.0, 20), ('T', 236, 0.78, 12)]:
        perna = estender_topo(colocar(S, m, W, H, 1.0, (740, 812), (x, 800), esc), 70)
        r.parte('perna' + lado, perna, 'quadril', (x, 740), z0)

    ob = caixa_olho(S, (262, 180, 345, 290))
    olho = {'cx': (ob[0] + ob[2]) / 2, 'cy': (ob[1] + ob[3]) / 2, 'caixa': ob}
    for nome, box in [('olho_fechado', (672, 1154, 807, 1230)), ('olho_meio', (688, 1269, 809, 1328))]:
        mm = comp_mask(S, box)
        r.rosto(nome, ajustar(S, mm, W, H, [ob[0] - 16, ob[1] - 10, ob[2] + 12, ob[3] + 10]))
    boca = {'cx': 332, 'cy': 300}
    for nome, box, larg in [('boca_riso', (450, 1448, 573, 1516), 50), ('boca_aberta', (295, 1458, 408, 1517), 44),
                            ('boca_sorriso_aberto', (160, 1458, 259, 1503), 40), ('boca_o', (630, 1446, 691, 1516), 22), ('boca_beijo', (751, 1457, 838, 1511), 34)]:
        mm = comp_mask(S, box); bx, by = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        r.rosto(nome, colocar(S, mm, W, H, larg / (box[2] - box[0]), (bx, by), (boca['cx'], boca['cy'] + 4)))
    r.gravar({'altura': 1100, 'cx': 220, 'pes': 1112, 'olho': olho, 'boca': boca, 'pele': '#%02x%02x%02x' % tuple(S[285, 330, :3]),
             'pts': {'testa': [300, 170], 'peito': [292, 452], 'costas': [156, 470], 'ombro': [200, 425], 'boca': [345, 300], 'nuca': [70, 260], 'bochecha': [290, 285]}})


# =====================================================================
# Caminhada dele — 8 quadros inteiros (alinhados pela linha dos pés)
# =====================================================================
def caminhada():
    S = carregar('ele_caminhada_perfil_8q.png')
    pasta = os.path.join(RAIZ, 'assets', 'sprites', 'ele_caminhada'); os.makedirs(pasta, exist_ok=True)
    caixas = [(5, 61, 300, 670), (314, 61, 557, 669), (608, 61, 842, 671), (877, 60, 1091, 671),
              (1092, 61, 1407, 671), (1418, 60, 1648, 670), (1677, 61, 1896, 670), (1916, 61, 2171, 673)]
    info = []
    for i, b in enumerate(caixas):
        m = comp_mask(S, (b[0] - 3, b[1] - 3, min(S.shape[1], b[2] + 3), min(S.shape[0], b[3] + 3)))
        ys, xs = np.where(m)
        p = S[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy(); p[..., 3] = np.where(m[ys.min():ys.max() + 1, xs.min():xs.max() + 1], p[..., 3], 0)
        Image.fromarray(p).save(os.path.join(pasta, f'q{i + 1}.png'))
        # referência horizontal: nuca/cabeça (estável durante o ciclo)
        topo = m[ys.min():ys.min() + 120]
        cx = float(np.where(topo.any(0))[0].mean())
        info.append({'x': int(xs.min()), 'y': int(ys.min()), 'w': int(xs.max() - xs.min() + 1), 'h': int(ys.max() - ys.min() + 1), 'cx': cx, 'pes': int(ys.max())})
    with open(os.path.join(pasta, 'quadros.js'), 'w') as f:
        f.write('window.CAMINHADA_ELE = %s;\n' % json.dumps(info))
    print('caminhada ok', [q['h'] for q in info])


if __name__ == '__main__':
    ele(); ela(); caminhada()
