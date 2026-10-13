/* Réglages : profil, héros, sauvegarde et restauration des données. */
(function () {
  const ui = K.ui;
  function open() {
    const s = K.store.get();
    const body = ui.sheet(`
      <h2 class="sheet-title">${ui.esc(s.profile.pseudo)}</h2>
      <p class="muted">Tes données restent uniquement sur ce téléphone. Pense à les sauvegarder de temps en temps.</p>
      <div class="menu">
        <button data-s="profile">Modifier mon profil santé</button>
        <button data-s="med">Mes infos médicales</button>
        <button data-s="avatar">Changer de héros</button>
        <button data-s="export">Sauvegarder mes données</button>
        <label>Restaurer une sauvegarde<input type="file" accept="application/json,.json" hidden data-import></label>
        <button data-s="images">Actualiser les images du dépôt</button>
        <button data-s="install">Installer Kardia sur l’écran d’accueil</button>
        <button data-s="reset" class="danger-txt">Tout effacer</button>
      </div>
      <p class="version">Kardia ${K.config.version}</p>`);
    body.addEventListener('click', async e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      const a = b.dataset.s;
      if (a === 'profile') { ui.close(); K.onboarding.start({ edit: true }); }
      if (a === 'avatar') { ui.close(); K.onboarding.start({ edit: true, only: 'avatar' }); }
      if (a === 'export') {
        const blob = new Blob([K.store.exportJSON()], { type: 'application/json' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
        link.download = `kardia-sauvegarde-${K.dates.todayISO()}.json`; document.body.appendChild(link); link.click(); link.remove();
        ui.toast('Sauvegarde téléchargée (sans les photos de preuve).');
      }
      if (a === 'install') installHelp();
      if (a === 'med') K.med.open();
      if (a === 'images') { ui.toast('Recherche des nouvelles images…'); const ch = await K.vis.check(true); ui.close(); K.world.render(); ui.toast(ch ? 'Nouvelles images chargées.' : 'Aucune nouvelle image trouvée.'); }
      if (a === 'reset') {
        if (await ui.confirmBox('Effacer toutes tes données Kardia sur ce téléphone ?', 'Tout effacer')) { K.store.reset(); location.reload(); }
      }
    });
    body.querySelector('[data-import]').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try { K.store.importJSON(await f.text()); ui.close(); ui.toast('Données restaurées.'); K.app.boot(); }
      catch (err) { ui.toast(err.message || 'Fichier illisible.'); }
    });
  }
  function installHelp() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    ui.sheet(`<h2 class="sheet-title">Installer Kardia</h2>
      ${ios ? `<p>Dans <b>Safari</b> : touche le bouton <b>Partager</b> (carré avec une flèche), puis <b>Sur l’écran d’accueil</b>.</p>`
            : `<p>Dans <b>Chrome</b> : touche le menu <b>⋮</b> en haut à droite, puis <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.</p>`}
      <p class="muted">L’icône Kardia apparaîtra avec tes autres applis, et le jeu marchera même sans réseau.</p>`);
  }
  K.settings = { open, installHelp };
})();
