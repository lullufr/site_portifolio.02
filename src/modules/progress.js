// Bateria de progresso: acompanha a posição real da rolagem.
export function initProgress() {
  const battery = document.getElementById('battery');
  const label = document.getElementById('batteryLabel');
  if (!battery || !label) return;

  let queued = false;
  let lastPercent = -1;

  const update = () => {
    queued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    battery.style.setProperty('--p', ratio.toFixed(4));

    const percent = Math.round(ratio * 100);
    if (percent !== lastPercent) {
      lastPercent = percent;
      label.textContent = `${percent}%`;
      battery.setAttribute('aria-valuenow', String(percent));
      battery.setAttribute('aria-valuetext', `${percent}% da página percorrida`);
    }
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  // A altura da página muda quando fontes e conteúdos carregam ou abrem.
  if ('ResizeObserver' in window) new ResizeObserver(request).observe(document.body);
  update();
}
