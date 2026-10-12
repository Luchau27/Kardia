/* Démarrage de Kardia. */
(function () {
  function boot() {
    const s = K.store.load();
    if (!s.profile || !s.avatar) { K.onboarding.start(); return; }
    K.world.render();
    if (!K.checkin.doneToday()) setTimeout(() => { if (!document.querySelector('.sheet-wrap.open')) K.checkin.open(); }, 900);
  }
  K.app = { boot };
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  boot();
})();
