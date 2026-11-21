# Nosso Amor em 180 Segundos

Curta romântico em animação 2D (1920×1080, 16:9, 180 s), feito a partir do roteiro "Versão 3".
Os personagens são as imagens fornecidas (`assets/referencias/`), animadas por código:
cabeça separada do corpo, piscar, expressões, pulos, caminhada, giro, abraço e beijo na testa.
Sem narração, sem legendas e sem balões. Os únicos textos são o cartão dos lírios e "Eu te amo.".

## Estrutura

| Pasta / arquivo | Conteúdo |
|---|---|
| `src/personagens.js` | Personagens e figurinos (usa as imagens fornecidas), expressões, patinhas |
| `src/objetos.js` | Celular, buquê, cartão (texto exato), mala, TV, avião, calendário, moto, motoboy |
| `src/cenarios.js` | Quartos, sala, São Luís, prédio, restaurante, praia, hotel |
| `src/cenas.js` | Linha do tempo: as 10 cenas com os tempos do roteiro |
| `src/motor.js` | Carregamento, TV (desenho, falha, fotos) e renderização |
| `src/player.js` + `index.html` | Reprodução: play/pausa, reiniciar, busca, tela cheia |
| `audio/gerar_trilha.py` | Trilha original + efeitos (chuva, notificações, campainha, passos, aeroporto, ondas, balanço, TV) |
| `exportar/exportar.js` | Exportação para MP4 |
| `fotos/` | Fotos reais do casal + `fotos.js` (ordem). Os arquivos de foto não são versionados. |

## Trocar ou reorganizar as fotos

Coloque as fotos em `fotos/` e edite a lista em `fotos/fotos.js`. O tempo da cena 9 é dividido
igualmente entre as fotos. Cada foto aparece inteira (sem cortes) sobre um fundo desfocado dela mesma.

## Gerar o vídeo

```bash
pip install numpy scipy
python3 audio/gerar_trilha.py                       # gera audio/trilha.wav
ffmpeg -i audio/trilha.wav -c:a aac -b:a 192k audio/trilha.m4a   # áudio do player
npm install playwright                              # se ainda não tiver
node exportar/exportar.js saida/nosso_amor_180s.mp4 3
```

Para assistir no navegador, abra `index.html` (barra de espaço = play/pausa).
