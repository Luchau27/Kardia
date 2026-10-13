/* La boutique : acheter des packs avec les Pulsations. */
(function () {
  const ui = K.ui;
  const SHOP = ['standard', 'categorie', 'premium'];
  const pct = v => (v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
  function render(el) {
    const s = K.store.get(), cur = K.config.currency.name;
    el.innerHTML = `<p class="muted">Tu gagnes des ${cur} avec les étapes du sentier, les missions, le quiz et le recyclage des doublons.</p>
      <div class="shop">${SHOP.map(t => {
        const P = K.config.packs[t], ok = s.wallet.pulsations >= P.price;
        return `<div class="shop-item">${K.collection.packVisual(t)}
          <div class="shop-txt"><b>${ui.esc(P.name)}</b><small>${P.size} cartes${P.guarantee ? ', dont au moins une Épique' : ''}${P.pickCat ? ', d’une catégorie au choix' : ''}</small>
          <small class="odds">Commune ${pct(P.odds.C)} · Rare ${pct(P.odds.R)} · Épique ${pct(P.odds['É'])} · Légendaire ${pct(P.odds.L)}</small>
          <button class="btn ${ok ? 'primary' : 'ghost'} sm" data-buy="${t}" ${ok ? '' : 'disabled'}>${ui.icons.puls} ${P.price}</button></div></div>`;
      }).join('')}</div>
      <p class="muted small-note">Le Pack Boss ne s’achète pas : il se gagne en franchissant les étapes du sentier.</p>
      <div class="sec-head"><h3 class="sec">Ton héros</h3></div>
      <div class="shop-item">${K.avatar.svg(K.store.get().avatar, { cls: 'shop-hero' })}<div class="shop-txt"><b>Héros et couleurs</b>
        <small>Débloque le Neurone (${K.avatar.heroPrice('neurone')}) et la Cellule NK (${K.avatar.heroPrice('cellule-nk')}), et de nouvelles couleurs pour chaque héros.</small>
        <button class="btn primary sm" data-hero>Personnaliser</button></div></div>`;
    el.onclick = e => {
      if (e.target.closest('[data-hero]')) return K.onboarding.start({ edit: true, only: 'avatar' });
      const b = e.target.closest('[data-buy]'); if (b && !b.disabled) buy(b.dataset.buy);
    };
  }
  function buy(type, cat) {
    const P = K.config.packs[type];
    if (P.pickCat && !cat) {
      const body = ui.sheet(`<h2 class="sheet-title">Quelle catégorie ?</h2><div class="menu">${K.CATS.map(c => `<button data-cat="${c.code}">${ui.esc(c.name)} <small>${K.collection.catCount(c.code)}/${K.collection.catTotal(c.code)}</small></button>`).join('')}</div>`);
      body.onclick = e => { const b = e.target.closest('[data-cat]'); if (b) { ui.close(); buy(type, b.dataset.cat); } };
      return;
    }
    if (K.store.get().wallet.pulsations < P.price) { ui.toast(`Pas assez de ${K.config.currency.name}.`); return; }
    K.store.update(s => { s.wallet.pulsations -= P.price; s.packs.push({ type, cat: cat || null, from: 'boutique', at: K.dates.todayISO() }); });
    K.missions.mark('achat');
    K.collection.openPack(K.store.get().packs.length - 1);
  }
  K.shop = { render };
})();
