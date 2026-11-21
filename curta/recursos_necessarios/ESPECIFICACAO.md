# Recursos necessários para a animação articulada

Projeto: **Nosso Amor em 180 Segundos**. Este documento diz exatamente quais PNGs
preciso receber para tirar a rigidez da animação **sem perder a qualidade visual atual**.

A arte de referência obrigatória é a das 5 imagens originais (`assets/referencias/*.png`).
As folhas de animação (`assets/referencias/folha/folha_animacao*.png`) servem só como
**guia de pose e de movimento**. Não são arte final: cada pose ali tem entre 90 e 260 px de
altura, e no filme os personagens aparecem com 450 a 1100 px.

---

## 1. Comparação: o que já existe e o que a folha nova acrescenta

| Recurso | Já existe no projeto (alta resolução) | Folha nova (só referência) | Situação |
|---|---|---|---|
| Ele, camisa preta, **frente** | PNG 1024×1536 + recorte em peças (rig) | sim | **Aproveitado.** Peças escondidas (mãos, roupa atrás dos braços) foram improvisadas |
| Ela, vestido amarelo, **frente** | PNG 1024×1536 + recorte em peças (rig) | sim | **Aproveitado.** Saia atrás das mãos preenchida automaticamente |
| Ele e ela, **3/4 frente, perfil, 3/4 costas, costas** | não existe | sim (261 px) | **Falta** em alta resolução |
| Caminhada (8 quadros), corrida (6) | só caminhada de frente, simulada no rig | sim (92 px) | Referência de tempo e poses-chave |
| Sentar e levantar | simulado de frente (parece agachado) | sim, 3/4 e perfil (~120 px) | **Resolve com as peças de perfil/3/4** |
| Abraço (6 quadros) e beijo na testa (6 quadros) | montado em camadas no rig | sim (~130–160 px) | Referência; quadros finais opcionais (seção 6) |
| Mãos (aberta, apontando, segurando, coração) | desenhadas por código | sim (38 px) | **Falta** em alta resolução |
| Bocas, olhos, sobrancelhas | pintados por código sobre a arte | sim (5–25 px) | **Falta** em alta resolução |
| Expressões completas | pintadas por código | sim (75 px) | Referência de expressão |
| Objetos (celular, buquê, cartão, banco, mala) | buquê (PNG), o resto vetorial | sim | Buquê aproveitado; o resto já funciona |
| Roupa de casa dela (camiseta + short jeans) | não existe | sim | Opcional para a cena dos lírios (precisa de aprovação) |

**Divergências da folha em relação ao roteiro e às imagens originais (não usar):**
- Ele de camisa branca aparece de **calça jeans**; o roteiro pede **short preto**.
- Rostos, orelhas e olhos na folha têm proporções um pouco diferentes das imagens originais.
  A arte nova precisa seguir as **imagens originais**, não a folha.

---

## 2. Regras técnicas (valem para todos os arquivos)

1. **Formato:** PNG RGBA 8 bits, fundo **transparente**, sRGB, sem sombra, brilho ou halo
   (a folha tem um brilho alaranjado em volta: ele não pode vir nos arquivos).
2. **Canvas fixo:** cada peça de corpo vem num **canvas de 1024 × 1536 px, no lugar exato onde
   fica na pose neutra**, igual às imagens originais. Não recortar nem centralizar: o
   posicionamento é a própria informação de montagem. Eu recorto e calculo os deslocamentos.
3. **Escala:** personagem com cerca de **1450 px** do topo da cabeça até a sola, pés na
   **linha y = 1492** (ele) e **y = 1501** (ela), centralizado em x ≈ 505.
4. **Pose neutra para as peças:** em pé, **braços soltos ao lado do corpo** (afastados uns 10°,
   **fora do bolso**), mãos relaxadas, pernas retas, olhando para frente.
5. **Peças completas:** cada peça é pintada **inteira, inclusive a parte que fica escondida**
   atrás da peça vizinha. A camisa continua por baixo dos braços, a saia continua por baixo das
   mãos e o pescoço desce até a gola.
6. **Sobreposição nas juntas:** perto de cada pivô, a peça "filha" começa com uma **ponta
   arredondada** que passa **40 px** além do pivô, por baixo da peça "mãe". Exemplos: o braço
   entra 40 px no ombro e o antebraço começa 40 px acima do cotovelo. Isso evita buracos ao girar.
7. **Traço e luz** idênticos às imagens originais: mesma espessura de contorno, mesma textura
   de pelo e mesma direção de luz.
8. **Lados:** nos nomes, `esq` e `dir` são o **lado da imagem (de quem olha)**.
9. **Pivôs:** junto com cada pasta de vista, enviar um **`pivos.json`** com a coordenada (x, y)
   de cada articulação no canvas. O modelo está em `pivos_modelo.json`. Se for mais fácil,
   enviar uma camada `pivos.png` com um ponto vermelho em cada junta.

---

## 3. Pontos de articulação (rig 2D)

Hierarquia (cada peça gira em torno do seu pivô e carrega as filhas):

```
raiz (meio dos pés)
└─ quadril ............. pivô P8 cintura
   ├─ tronco ........... gira no P8
   │  ├─ pescoço ....... P1
   │  │  └─ cabeça ..... P1
   │  │     ├─ orelha_esq / orelha_dir ... P15 / P16 (movimento secundário)
   │  │     ├─ laço (ela) ................ base do laço (movimento secundário)
   │  │     └─ olhos, íris, pálpebras, sobrancelhas, boca (camadas do rosto)
   │  ├─ braco_esq ..... P2 ombro → antebraco_esq P4 cotovelo → mao_esq P6 pulso
   │  └─ braco_dir ..... P3 ombro → antebraco_dir P5 cotovelo → mao_dir P7 pulso
   ├─ coxa_esq ......... P9 quadril → canela_esq P11 joelho → pe_esq P13 tornozelo
   ├─ coxa_dir ......... P10 quadril → canela_dir P12 joelho → pe_dir P14 tornozelo
   └─ saia (ela) ....... P8 (balança atrasada)
```

Coordenadas na **vista de frente**, no canvas 1024×1536 (ver `guia_pivos_*.png`).
P4–P7 são aproximados para o braço solto; o ilustrador ajusta e informa no `pivos.json`.

| Pivô | Ele (camisa preta) | Ela (vestido amarelo) |
|---|---|---|
| P1 pescoço | (535, 452) | (502, 552) |
| P2 / P3 ombros | (330, 528) / (690, 528) | (392, 596) / (612, 596) |
| P4 / P5 cotovelos | (300, 660) / (718, 660) | (355, 715) / (648, 715) |
| P6 / P7 pulsos | (292, 880) / (726, 880) | (330, 930) / (672, 930) |
| P8 cintura | (505, 900) | (500, 790) |
| P9 / P10 quadris | (405, 950) / (595, 950) | (432, 1010) / (568, 1010) |
| P11 / P12 joelhos | (400, 1185) / (595, 1185) | (428, 1265) / (572, 1265) |
| P13 / P14 tornozelos | (392, 1395) / (605, 1395) | (425, 1430) / (575, 1430) |
| P15 / P16 orelhas | (342, 285) / (684, 285) | (306, 350) / (694, 345) |

Nas vistas **perfil** e **3/4** valem os mesmos nomes. O perfil tem um lado "da frente"
(perto da câmera) e um "de trás", então as peças se chamam `braco_frente` / `braco_tras`,
`coxa_frente` / `coxa_tras` e assim por diante. Perfil e 3/4 olhando **para a direita**
(eu espelho para a esquerda).

**Ordem de camadas (de trás para frente):** braço de trás, perna de trás, (saia), quadril,
perna da frente, tronco, pescoço, orelhas, cabeça, rosto, braço da frente, mão da frente.
Na vista de frente: pernas, quadril, saia, tronco, braços, pescoço, orelhas, cabeça e rosto.

---

## 4. Estrutura exata de pastas e arquivos

Enviar em `curta/recursos/` (ou num ZIP com esta estrutura):

```
recursos/
├─ ele_camisa_preta/
│  ├─ frente/                      ← PRIORIDADE 1 (reencontro)
│  │  ├─ 00_referencia_completa.png     pose neutra inteira montada (para conferir)
│  │  ├─ cabeca_base.png                cabeça SEM olhos, boca e sobrancelhas (pele contínua), sem orelhas
│  │  ├─ orelha_esq.png  orelha_dir.png
│  │  ├─ pescoco.png
│  │  ├─ tronco.png                     camisa completa (inclusive atrás dos braços), com gola
│  │  ├─ braco_esq.png  antebraco_esq.png
│  │  ├─ braco_dir.png  antebraco_dir.png   (relógio no antebraço onde ele já usa)
│  │  ├─ quadril.png                    cós e quadril da calça
│  │  ├─ coxa_esq.png  canela_esq.png  pe_esq.png
│  │  ├─ coxa_dir.png  canela_dir.png  pe_dir.png
│  │  ├─ rosto/          (todas em canvas 1024×1536, na posição do rosto)
│  │  │  ├─ olho_esq_branco.png  olho_esq_iris.png
│  │  │  ├─ olho_dir_branco.png  olho_dir_iris.png
│  │  │  ├─ palpebras_meio.png  palpebras_tristes.png
│  │  │  ├─ olhos_fechados_neutros.png  olhos_fechados_felizes.png
│  │  │  ├─ sobrancelhas_neutras.png  sobrancelhas_preocupadas.png
│  │  │  ├─ sobrancelhas_surpresas.png  sobrancelhas_tristes.png
│  │  │  └─ boca_sorriso.png  boca_neutra.png  boca_triste.png  boca_preocupada.png
│  │  │     boca_riso_aberto.png  boca_o.png  boca_beijo.png
│  │  └─ pivos.json
│  ├─ perfil/                      ← PRIORIDADE 1 (caminhar, sentar e levantar de verdade)
│  │  ├─ 00_referencia_completa.png
│  │  ├─ cabeca_base.png  orelha.png  pescoco.png  tronco.png  quadril.png
│  │  ├─ braco_frente.png  antebraco_frente.png  braco_tras.png  antebraco_tras.png
│  │  ├─ coxa_frente.png  canela_frente.png  pe_frente.png
│  │  ├─ coxa_tras.png  canela_tras.png  pe_tras.png
│  │  ├─ rosto/  olho_branco.png  olho_iris.png  olhos_fechados_felizes.png
│  │  │          sobrancelha_neutra.png  sobrancelha_preocupada.png
│  │  │          boca_sorriso.png  boca_triste.png  boca_beijo.png  boca_riso_aberto.png
│  │  └─ pivos.json
│  ├─ tres_quartos/                ← PRIORIDADE 1 (abraço e beijo na testa)
│  │  └─ mesma lista da vista de frente (peças + rosto/ + pivos.json)
│  └─ maos/                        ← PRIORIDADE 1
│     └─ mao_{aberta,relaxada,fechada,segurando,apoiada,digitando}_{esq,dir}.png
│
├─ ela_vestido_amarelo/
│  ├─ frente/                      ← PRIORIDADE 1
│  │  ├─ 00_referencia_completa.png
│  │  ├─ cabelo_tras.png                cabelo atrás da cabeça (balança)
│  │  ├─ cabeca_base.png                sem olhos, boca, sobrancelhas, orelhas e laço
│  │  ├─ laco.png                       laço amarelo (movimento secundário)
│  │  ├─ orelha_esq.png  orelha_dir.png
│  │  ├─ pescoco.png                    com o colar de coração
│  │  ├─ tronco.png                     corpete completo com a faixa da cintura
│  │  ├─ manga_esq.png  manga_dir.png   mangas bufantes (são o "braço" superior)
│  │  ├─ antebraco_esq.png  antebraco_dir.png   (pulseira no braço onde ela já usa)
│  │  ├─ saia.png                       saia completa (inclusive atrás das mãos)
│  │  ├─ perna_esq.png  perna_dir.png   do quadril (sob a saia) até o tornozelo
│  │  ├─ pe_esq.png  pe_dir.png
│  │  ├─ rosto/   (mesma lista dele; olhos COM cílios)
│  │  └─ pivos.json
│  ├─ perfil/                      ← PRIORIDADE 1
│  │  └─ cabelo_tras, cabeca_base, laco, orelha, pescoco, tronco,
│  │     manga_frente, antebraco_frente, manga_tras, antebraco_tras,
│  │     saia, perna_frente, pe_frente, perna_tras, pe_tras, rosto/, pivos.json
│  ├─ tres_quartos/                ← PRIORIDADE 1
│  └─ maos/                        ← PRIORIDADE 1 (mesma lista dele)
│
├─ sequencias/                     ← PRIORIDADE 2 (opcional, melhora o contato físico)
│  ├─ abraco/  quadro_01 … quadro_06/
│  │     ele.png  ela.png  ele_bracos_frente.png  ela_bracos_frente.png
│  └─ beijo_testa/  quadro_01 … quadro_06/   (mesmos 4 arquivos)
│
├─ costas/                         ← PRIORIDADE 2 (cena do hotel, TV)
│  ├─ ele_cabeca_ombros_costas.png
│  └─ ela_cabeca_ombros_costas.png
│
└─ outros_figurinos/               ← PRIORIDADE 3 (resto do filme)
   ├─ ele_camisa_branca_short_preto/   frente/ perfil/ (mesma estrutura)
   ├─ ele_moletom/                     frente/ perfil/
   ├─ ela_selecao/                     frente/ perfil/
   └─ ela_casa/                        frente/ perfil/   (se aprovar a roupa da folha)
```

### Dimensões

| Arquivo | Dimensão | Observação |
|---|---|---|
| Peças de corpo, rosto e `00_referencia_completa` | **1024 × 1536** | na posição da pose neutra |
| Mãos (`maos/`) | **400 × 400** | pulso centrado em **(200, 60)**, dedos apontando para baixo |
| Sequências (abraço, beijo) | **2048 × 1536** | os dois no mesmo canvas, cada um em arquivo separado, mesma escala (~1450 px de altura) |
| Costas (hotel) | **1024 × 1536** | cabeça e ombros, mesma escala |

**Contagem da prioridade 1** (reencontro, só ele de camisa preta e ela de vestido):
- **Ele:**
  - vista de frente: 19 peças de corpo + 19 do rosto;
  - perfil: 17 + 9;
  - 3/4: 19 + 19;
  - mãos: 12.
- **Ela:**
  - vista de frente: 19 + 19;
  - perfil: 17 + 9;
  - 3/4: 19 + 19;
  - mãos: 12.

Total: cerca de **230 PNGs**. Pra começar mais rápido, o **mínimo viável** é a vista de
**frente + perfil + mãos** dos dois. Com isso já dá pra caminhar de perfil, sentar e levantar
de perfil, e trocar boca, olhos e mãos com a arte original.

---

## 5. Como cada peça entra no reencontro

| Ação | Vista | Peças usadas |
|---|---|---|
| Espera, olhar a porta, trocar o peso | frente / 3/4 | tronco, quadril, coxas, canelas, cabeça, íris, sobrancelhas preocupadas |
| Consultar o celular | 3/4 | braço, antebraço, `mao_segurando`, olhos olhando para baixo |
| Andar de um lado para o outro | perfil | ciclo de 8 poses-chave (da folha) aplicado às peças do perfil |
| Sentar na calçada | perfil → 3/4 | coxa gira para a horizontal, joelho dobra, `mao_apoiada` nos joelhos |
| Levantar | perfil | tronco inclina para frente, mãos empurram os joelhos, quadril sobe |
| Caminhar até ela | perfil (ele → direita, ela → esquerda) | ciclos de caminhada de cada um; desaceleram no fim |
| Abraço | 3/4 (ou `sequencias/abraco`) | braços envolvendo, `bracos_frente` por cima do corpo do outro |
| Beijo na testa | 3/4 (ou `sequencias/beijo_testa`) | inclinação do tronco e do pescoço, `boca_beijo`, `olhos_fechados_felizes` |

---

## 6. O que continua valendo sem arte nova

O sistema de rig, a câmera, os cenários, o cartão dos lírios, as fotos, a trilha, a
exportação e o player continuam iguais. Quando os arquivos chegarem, eles entram no lugar
das peças recortadas automaticamente: os nomes e pivôs acima são os que o `src/rig.js` vai ler.
