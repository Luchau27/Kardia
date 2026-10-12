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
        return `<div class="shop-item"><div class="mini-pack big t-${t}">${ui.logo(34)}<b>${ui.esc(P.name)}</b></div>
          <div class="shop-txt"><b>${ui.esc(P.name)}</b><small>${P.size} cartes${P.guarantee ? ', dont au moins une Épique' : ''}${P.pickCat ? ', d’une catégorie au choix' : ''}</small>
          <small class="odds">Commune ${pct(P.odds.C)} · Rare ${pct(P.odds.R)} · Épique ${pct(P.odds['É'])} · Légendaire ${pct(P.odds.L)}</small>
          <button class="btn ${ok ? 'primary' : 'ghost'} sm" data-buy="${t}" ${ok ? '' : 'disabled'}>${ui.icons.puls} ${P.price}</button></div></div>`;
      }).join('')}</div>
      <p class="muted small-note">Le Pack Boss ne s’achète pas : il se gagne en franchissant les étapes du sentier.</p>`;
    el.onclick = e => { const b = e.target.closest('[data-buy]'); if (b && !b.disabled) buy(b.dataset.buy); };
  }
  function buy(type, cat) {
    const P = K.config.packs[type];
    if (P.pickCat && !cat) {
      const body = ui.sheet(`<h2 class="sheet-title">Quelle catégorie ?</h2><div class="menu">${K.CATS.map(c => `<button data-cat="${c.code}">${c.emoji} ${ui.esc(c.name)} <small>${K.collection.catCount(c.code)}/${K.collection.catTotal(c.code)}</small></button>`).join('')}</div>`);
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
