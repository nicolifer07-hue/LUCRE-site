function initLucreCarousel() {
  const carousel = document.querySelector('[data-lucre-carousel]');
  if (!carousel || carousel.dataset.ready) return;

  carousel.dataset.ready = 'true';
  const player = carousel.querySelector('video');
  const picks = [...carousel.querySelectorAll('[data-lucre-video]')];
  const status = carousel.querySelector('[role="status"]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let visible = false;
  let pausedByVisitor = false;
  let pausedByVisibility = false;

  function play() {
    if (player.paused) player.play().catch(() => {});
  }

  function select(index, requested = false) {
    active = (index + picks.length) % picks.length;
    picks.forEach((pick, position) => {
      pick.setAttribute('aria-pressed', String(position === active));
    });
    const number = active + 1;
    player.poster = '/LUCRE-site/lucre/video-' + number + '.webp';
    player.src = '/LUCRE-site/lucre/video-' + number + '.mp4';
    status.textContent = 'Vídeo ' + number + ' de ' + picks.length;
    pausedByVisitor = false;
    if (requested || (visible && !reducedMotion.matches)) play();
  }

  picks.forEach((pick, index) => pick.addEventListener('click', () => select(index, true)));
  carousel.querySelector('[data-lucre-prev]').addEventListener('click', () => select(active - 1, true));
  carousel.querySelector('[data-lucre-next]').addEventListener('click', () => select(active + 1, true));
  player.addEventListener('ended', () => {
    if (!reducedMotion.matches && visible) select(active + 1);
  });
  player.addEventListener('pause', () => {
    if (!pausedByVisibility && !player.ended) pausedByVisitor = true;
  });
  player.addEventListener('play', () => { pausedByVisitor = false; });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      if (!reducedMotion.matches && !pausedByVisitor) play();
    } else if (!player.paused) {
      pausedByVisibility = true;
      player.addEventListener('pause', () => { pausedByVisibility = false; }, {once: true});
      player.pause();
    }
  }, {threshold: 0.25});
  observer.observe(player);
  document.addEventListener('astro:before-swap', () => observer.disconnect(), {once: true});
}

initLucreCarousel();
document.addEventListener('astro:page-load', initLucreCarousel);
