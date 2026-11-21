'use strict';
// Reprodução: play/pausa, reiniciar, busca, tela cheia. O áudio é o relógio.
(function () {
  const tela = document.getElementById('tela');
  const ctx = tela.getContext('2d');
  const audio = document.getElementById('trilha');
  const btPlay = document.getElementById('play'), busca = document.getElementById('busca'), tempo = document.getElementById('tempo');
  const params = new URLSearchParams(location.search);
  let T = 0, tocando = false, inicio = 0, semAudio = false;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function agora() {
    if (!tocando) return T;
    if (!semAudio && !audio.paused && audio.readyState >= 2) return audio.currentTime;
    return (performance.now() - inicio) / 1000;
  }
  function quadro() {
    T = agora();
    if (T >= DURACAO) { T = DURACAO - 0.001; pausar(); }
    renderAt(ctx, T);
    busca.value = T; tempo.textContent = `${fmt(T)} / ${fmt(DURACAO)}`;
    if (tocando) requestAnimationFrame(quadro);
  }
  function tocar() {
    if (T >= DURACAO - 0.01) T = 0;
    tocando = true; btPlay.textContent = '❚❚';
    inicio = performance.now() - T * 1000;
    audio.currentTime = T;
    audio.play().then(() => { semAudio = false; }).catch(() => { semAudio = true; });
    requestAnimationFrame(quadro);
  }
  function pausar() { tocando = false; btPlay.textContent = '▶'; audio.pause(); }
  function ir(t) { T = clamp(t, 0, DURACAO - 0.001); audio.currentTime = T; inicio = performance.now() - T * 1000; if (!tocando) renderAt(ctx, T); tempo.textContent = `${fmt(T)} / ${fmt(DURACAO)}`; }

  btPlay.onclick = () => (tocando ? pausar() : tocar());
  document.getElementById('reiniciar').onclick = () => { ir(0); if (!tocando) tocar(); };
  busca.oninput = () => ir(parseFloat(busca.value));
  document.getElementById('cheia').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {});
  };
  document.addEventListener('fullscreenchange', () => document.body.classList.toggle('cheia', !!document.fullscreenElement));
  document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); btPlay.click(); } });

  // API usada pela exportação para MP4
  window.CURTA = {
    renderJPEG(t, q = 0.93) { renderAt(ctx, t); return tela.toDataURL('image/jpeg', q); },
    render(t) { renderAt(ctx, t); },
  };
  carregarTudo().then(() => {
    document.getElementById('carregando').remove();
    const t0 = parseFloat(params.get('t') || '0');
    ir(t0);
    window.CURTA_PRONTO = true;
  }).catch(e => { document.getElementById('carregando').textContent = 'Erro: ' + e.message; console.error(e); });
})();
