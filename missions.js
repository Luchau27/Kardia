/* Missions du jour (boucle quotidienne) et objectifs à paliers (long terme). */
(function () {
  const ui = K.ui, D = K.dates;
  const cur = () => K.config.currency.name;

  function today() {
    const s = K.store.get(), iso = D.todayISO();
    if (!s.daily || s.daily.date !== iso) { s.daily = { date: iso, done: {}, claimed: {} }; K.store.save(); }
    return Object.assign({ done: {}, claimed: {} }, s.daily, s.daily.done.quiz ? { quiz: s.daily.done.quiz } : {});
  }
  function mark(id, data) { today(); K.store.update(s => { s.daily.done[id] = data || true; }); }
  function ensureFreePack() {
    const t = today();
    if (!t.freeGiven) { K.store.update(s => { s.daily.freeGiven = true; s.packs.push({ type: 'gratuit', at: D.todayISO() }); }); }
  }

  const DAILY = [
    { id: 'meteo', icon: '🌤️', label: 'Donner ta météo intérieure', reward: 30, done: () => K.checkin.doneToday(), go: () => K.checkin.open() },
    { id: 'quiz', icon: '🧠', label: 'Faire le quiz du jour', reward: 40, done: t => !!t.done.quiz, go: () => K.quiz.open() },
    { id: 'pack', icon: '🎁', label: 'Ouvrir ton pack du jour', reward: 20, done: t => !!t.done.pack, go: () => {
      const i = K.store.get().packs.findIndex(p => p.type === 'gratuit');
      if (i >= 0) K.collection.openPack(i); else ui.toast('Ton pack du jour a déjà été ouvert.');
    } },
    { id: 'pas', icon: '👟', label: 'Marcher 10 000 pas', reward: 50, done: t => !!t.done.pas, go: () => stepsForm() },
    { id: 'achat', icon: '🛍️', label: 'Acheter un pack en boutique', reward: 40, done: t => !!t.done.achat, go: () => K.world.openPanel('shop') }
  ];
  const PERFECT = 100;

  const OBJ = [
    { id: 'sentier', icon: '🧭', label: 'Étapes du sentier réussies', val: s => s.history.length, tiers: [[1, 'boss'], [3, 'boss'], [6, 'boss'], [12, 'boss']] },
    { id: 'quiz', icon: '🧠', label: 'Bonnes réponses au quiz', val: s => s.stats.quizCorrect || 0, tiers: [[10, 'standard'], [30, 'standard'], [75, 'premium'], [150, 'premium']] },
    { id: 'collection', icon: '🃏', label: 'Cartes différentes', val: () => K.collection.ownedIds().size, tiers: [[15, 'standard'], [40, 'premium'], [80, 'premium'], [120, 'boss']] },
    { id: 'regularite', icon: '☀️', label: 'Jours de météo intérieure', val: s => Object.keys(s.checkins).length, tiers: [[3, 'standard'], [10, 'standard'], [30, 'premium'], [100, 'premium']] },
    { id: 'packs', icon: '🎁', label: 'Packs ouverts', val: s => s.stats.packsOpened || 0, tiers: [[5, 200], [20, 500], [50, 1000]] }
  ];
  const rewardTxt = r => typeof r === 'number' ? `${r} ${cur()}` : K.config.packs[r].name;

  function claimable() {
    const s = K.store.get(), t = today(); let n = 0;
    DAILY.forEach(m => { if (m.done(t) && !t.claimed[m.id]) n++; });
    if (DAILY.every(m => t.claimed[m.id]) && !t.claimed.perfect) n++;
    OBJ.forEach(o => { const lvl = s.objClaimed[o.id] || 0; if (o.tiers[lvl] && o.val(s) >= o.tiers[lvl][0]) n++; });
    return n;
  }

  function render(el) {
    const s = K.store.get(), t = today();
    const allClaimed = DAILY.every(m => t.claimed[m.id]);
    el.innerHTML = `
      <h3 class="sec">Missions du jour</h3>
      <div class="mlist">${DAILY.map(m => {
        const done = m.done(t), got = t.claimed[m.id];
        return `<div class="mission ${got ? 'got' : done ? 'ready' : ''}"><span class="m-ico">${m.icon}</span>
          <span class="m-txt"><b>${m.label}</b><small>${ui.icons.puls} +${m.reward}</small></span>
          ${got ? '<span class="m-ok">✓</span>' : done ? `<button class="btn primary sm" data-claim="${m.id}">Récupérer</button>` : `<button class="btn ghost sm" data-go="${m.id}">Y aller</button>`}</div>`;
      }).join('')}
      <div class="mission perfect ${t.claimed.perfect ? 'got' : allClaimed ? 'ready' : ''}"><span class="m-ico">⭐</span>
        <span class="m-txt"><b>Journée parfaite</b><small>Toutes les missions · ${ui.icons.puls} +${PERFECT}</small></span>
        ${t.claimed.perfect ? '<span class="m-ok">✓</span>' : allClaimed ? '<button class="btn primary sm" data-claim="perfect">Récupérer</button>' : `<span class="m-prog">${DAILY.filter(m => t.claimed[m.id]).length}/${DAILY.length}</span>`}</div></div>
      <h3 class="sec">Objectifs</h3>
      <p class="muted">Chaque palier atteint te donne une récompense, puis l’objectif suivant se débloque.</p>
      <div class="mlist">${OBJ.map(o => {
        const lvl = s.objClaimed[o.id] || 0, tier = o.tiers[lvl], v = o.val(s);
        if (!tier) return `<div class="obj got"><span class="m-ico">${o.icon}</span><span class="m-txt"><b>${o.label}</b><small>Tous les paliers sont réussis</small></span><span class="m-ok">✓</span></div>`;
        const pct = Math.min(100, Math.round(v / tier[0] * 100)), ready = v >= tier[0];
        return `<div class="obj ${ready ? 'ready' : ''}"><span class="m-ico">${o.icon}</span>
          <span class="m-txt"><b>${o.label}</b><small>Palier ${lvl + 1} sur ${o.tiers.length} · ${rewardTxt(tier[1])}</small>
          <span class="obj-bar"><i style="width:${pct}%"></i></span><small>${Math.min(v, tier[0])} / ${tier[0]}</small></span>
          ${ready ? `<button class="btn primary sm" data-obj="${o.id}">Récupérer</button>` : `<span class="dots">${o.tiers.map((_, k) => `<i class="${k < lvl ? 'on' : ''}"></i>`).join('')}</span>`}</div>`;
      }).join('')}</div>`;
    el.onclick = e => {
      const c = e.target.closest('[data-claim]'), g = e.target.closest('[data-go]'), o = e.target.closest('[data-obj]');
      if (c) claim(c.dataset.claim);
      if (g) DAILY.find(m => m.id === g.dataset.go).go();
      if (o) claimObj(o.dataset.obj);
    };
  }

  function claim(id) {
    const amount = id === 'perfect' ? PERFECT : DAILY.find(m => m.id === id).reward;
    K.store.update(s => { s.daily.claimed[id] = true; s.wallet.pulsations += amount; });
    ui.toast(`+${amount} ${cur()}`);
  }
  function claimObj(id) {
    const o = OBJ.find(x => x.id === id), s = K.store.get(), lvl = s.objClaimed[id] || 0, tier = o.tiers[lvl];
    if (!tier || o.val(s) < tier[0]) return;
    K.store.update(st => { st.objClaimed[id] = lvl + 1; if (typeof tier[1] === 'number') st.wallet.pulsations += tier[1]; });
    if (typeof tier[1] !== 'number') { K.collection.grantPack(tier[1], { from: 'objectif' }); ui.toast(`${K.config.packs[tier[1]].name} ajouté à ta collection !`); }
    else ui.toast(`+${tier[1]} ${cur()}`);
  }

  function stepsForm() {
    const body = ui.sheet(`<h2 class="sheet-title">10 000 pas aujourd’hui ?</h2>
      <p class="muted">Regarde le compteur de pas de ton téléphone ou de ta montre. On te fait confiance !</p>
      <div class="row-btns"><button class="btn ghost" data-p="no">Pas encore</button><button class="btn primary" data-p="yes">Oui, c’est fait</button></div>`);
    body.onclick = e => {
      const a = e.target.closest('[data-p]'); if (!a) return; ui.close();
      if (a.dataset.p === 'yes') { mark('pas'); ui.toast('Bravo ! Récupère ta récompense dans Missions.'); }
    };
  }

  K.missions = { today, mark, ensureFreePack, claimable, render };
})();
