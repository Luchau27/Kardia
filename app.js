/* Démarrage de Kardia. */
(function () {
  function boot() {
    const s = K.store.load();
    if (!s.profile || !s.avatar) { K.onboarding.start(); return; }
    K.collection.ensureGift();
    K.avatar.keepCurrent();
    K.world.render();
    if (!K.checkin.doneToday()) setTimeout(() => { if (!document.querySelector('.sheet-wrap.open')) K.checkin.open(); }, 900);
  }
  K.app = { boot };
  /* Vérifie les images du dossier « visuels » en arrière-plan, et redessine si de nouvelles sont arrivées. */
  setTimeout(() => K.vis.check().then(changed => {
    const s = K.store.get();
    if (changed && s.profile && s.avatar && document.querySelector('.game')) K.world.render();
  }).catch(() => {}), 600);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  boot();
})();
