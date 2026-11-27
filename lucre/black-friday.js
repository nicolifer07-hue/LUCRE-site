let scheduled = false;

function updateHeaderOffset() {
  scheduled = false;
  const banner = document.getElementById('lucre-black-friday');
  const offset = banner ? Math.max(0, banner.getBoundingClientRect().bottom) : 0;
  document.documentElement.style.setProperty('--lucre-banner-offset', offset + 'px');
}

function scheduleOffsetUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateHeaderOffset);
}

window.addEventListener('scroll', scheduleOffsetUpdate, { passive: true });
window.addEventListener('resize', scheduleOffsetUpdate, { passive: true });
document.addEventListener('astro:page-load', updateHeaderOffset);
updateHeaderOffset();
