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
    if (!t.freeGiven) K.store.update(s => { s.daily.freeGiven = true; s.packs.push({ type: 'gratuit', at: D.todayISO() }); });
  }
  function freePackIndex() { return K.store.get().packs.findIndex(p => p.type === 'gratuit'); }

  /* Les 4 premières missions rapportent de quoi acheter un Pack Standard (300). */
  const DAILY = [
    { id: 'meteo', label: 'Donner ta météo intérieure', reward: 60, done: () => K.checkin.doneToday(), go: () => K.checkin.open() },
    { id: 'quiz', label: 'Faire le quiz du jour', reward: 80, done: t => !!t.done.quiz, go: () => K.quiz.open() },
    { id: 'pack', label: 'Ouvrir ton pack du jour', reward: 60, done: t => !!t.done.pack, go: () => { const i = freePackIndex(); if (i >= 0) K.collection.openPack(i); else ui.toast('Ton pack du jour a déjà été ouvert.'); } },
    { id: 'pas', label: 'Marcher 10 000 pas', reward: 120, done: t => !!t.done.pas, go: () => stepsForm() },
    { id: 'achat', label: 'Acheter un pack en boutique', reward: 50, done: t => !!t.done.achat, go: () => K.world.openPanel('shop') }
  ];
  const PERFECT = { pack: 'premium' };

  /* Récompenses : d'abord des Pulsations, puis des packs de plus en plus rares. */
  const P = n => ({ p: n }), PK = (t, n) => ({ pack: t, p: n || 0 });
  const rarityCount = r => { const ids = new Set(); const c = K.store.get().collection; for (const k in c) if (c[k] > 0) { const p = K.collection.parse(k); if (p.r === r) ids.add(p.id); } return ids.size; };
  const rarityMax = r => K.CARDS.filter(c => c.r.includes(r)).length;
  const steps = (max, fr) => { const out = []; fr.forEach(f => { const v = Math.max(1, Math.ceil(max * f)); if (!out.includes(v)) out.push(v); }); return out; };

  function objectives() {
    const RN = K.collection.RNAME, s = K.store.get();
    const groups = [
      { title: 'Aventure', items: [
        { id: 'sentier', label: 'Étapes du sentier réussies', val: () => s.history.length, tiers: [1, 3, 6, 12], rew: [P(400), P(800), PK('premium'), PK('boss')] },
        { id: 'quiz', label: 'Bonnes réponses au quiz', val: () => s.stats.quizCorrect || 0, tiers: [10, 30, 75, 150], rew: [P(300), P(600), PK('standard'), PK('premium')] },
        { id: 'regularite', label: 'Jours de météo intérieure', val: () => Object.keys(s.checkins).length, tiers: [3, 10, 30, 100], rew: [P(300), P(600), PK('premium'), PK('boss')] },
        { id: 'packs', label: 'Packs ouverts', val: () => s.stats.packsOpened || 0, tiers: [5, 20, 50, 100], rew: [P(300), P(600), PK('premium'), PK('boss')] }
      ] },
      { title: 'Collection', items: [
        { id: 'collection', label: 'Cartes différentes', val: () => K.collection.ownedIds().size, tiers: steps(K.CARDS.length, [.08, .2, .4, .7, 1]), rew: [P(400), P(700), PK('standard', 300), PK('premium', 500), PK('boss', 1000)] }
      ] },
      { title: 'Par catégorie', items: K.CATS.map(c => {
        const max = K.collection.catTotal(c.code);
        return { id: 'cat-' + c.code, label: c.name, val: () => K.collection.catCount(c.code), tiers: steps(max, [.25, .5, .75, 1]), rew: [P(300), P(500), PK('standard'), PK('premium', 500)] };
      }) },
      { title: 'Par rareté', items: K.collection.RAR.map(r => ({ id: 'rar-' + r, label: `Cartes ${RN[r].toLowerCase()}s différentes`, val: () => rarityCount(r), tiers: steps(rarityMax(r), [.1, .25, .5, 1]), rew: r === 'C' ? [P(300), P(500), PK('standard'), PK('premium')] : r === 'R' ? [P(400), P(700), PK('premium'), PK('boss')] : [P(600), PK('premium'), PK('boss'), PK('boss', 1500)] }))
      }
    ];
    return groups;
  }
  const allObjectives = () => objectives().flatMap(g => g.items);

  function rewardBadge(r, size) {
    if (r.pack) return `<span class="rbadge pack ${size || ''}">${K.collection.packVisual(r.pack, 'tiny')}<small>${K.config.packs[r.pack].name.replace('Pack ', '')}${r.p ? ` +${r.p}` : ''}</small></span>`;
    return `<span class="rbadge ${size || ''}">${ui.icons.puls}<b>+${r.p}</b></span>`;
  }
  function rewardText(r) { return [r.p ? `${r.p} ${cur()}` : '', r.pack ? K.config.packs[r.pack].name : ''].filter(Boolean).join(' + '); }
  function give(r) {
    K.store.update(s => { if (r.p) s.wallet.pulsations += r.p; if (r.pack) s.packs.push({ type: r.pack, from: 'objectif', at: D.todayISO() }); });
    ui.toast(`${rewardText(r)} ${r.pack ? '· à ouvrir dans ta Collection' : ''}`);
  }

  function claimable() {
    const s = K.store.get(), t = today(); let n = 0;
    DAILY.forEach(m => { if (m.done(t) && !t.claimed[m.id]) n++; });
    if (DAILY.every(m => t.claimed[m.id]) && !t.claimed.perfect) n++;
    allObjectives().forEach(o => { const lvl = s.objClaimed[o.id] || 0; if (o.tiers[lvl] && o.val() >= o.tiers[lvl]) n++; });
    return n;
  }

  function render(el) {
    const s = K.store.get(), t = today(), allClaimed = DAILY.every(m => t.claimed[m.id]);
    const nClaimed = DAILY.filter(m => t.claimed[m.id]).length;
    el.innerHTML = `
      <div class="sec-head"><h3 class="sec">Missions du jour</h3><span class="sec-meta">${nClaimed} / ${DAILY.length}</span></div>
      <div class="mlist">${DAILY.map(m => {
        const done = m.done(t), got = t.claimed[m.id];
        return `<div class="mission ${got ? 'got' : done ? 'ready' : ''}"><span class="check-box ${done ? 'on' : ''}" aria-hidden="true"></span>
          <span class="m-txt"><b>${m.label}</b></span>${rewardBadge({ p: m.reward }, 'sm')}
          ${got ? '<span class="m-state">Reçu</span>' : done ? `<button class="btn primary sm" data-claim="${m.id}">Récupérer</button>` : `<button class="btn ghost sm" data-go="${m.id}">Go</button>`}</div>`;
      }).join('')}
      <div class="mission perfect ${t.claimed.perfect ? 'got' : allClaimed ? 'ready' : ''}"><span class="check-box star ${allClaimed ? 'on' : ''}" aria-hidden="true"></span>
        <span class="m-txt"><b>Journée parfaite</b><small>Toutes les missions récupérées</small></span>${rewardBadge(PERFECT, 'sm')}
        ${t.claimed.perfect ? '<span class="m-state">Reçu</span>' : allClaimed ? '<button class="btn primary sm" data-claim="perfect">Récupérer</button>' : `<span class="m-state">${nClaimed}/${DAILY.length}</span>`}</div></div>
      ${objectives().map(g => `<div class="sec-head"><h3 class="sec">${g.title}</h3></div><div class="mlist">${g.items.map(o => objRow(o, s)).join('')}</div>`).join('')}`;
    el.onclick = e => {
      const c = e.target.closest('[data-claim]'), g = e.target.closest('[data-go]'), o = e.target.closest('[data-obj]');
      if (c) claim(c.dataset.claim);
      if (g) DAILY.find(m => m.id === g.dataset.go).go();
      if (o) claimObj(o.dataset.obj);
    };
  }
  function objRow(o, s) {
    const lvl = s.objClaimed[o.id] || 0, tier = o.tiers[lvl], v = o.val();
    if (tier === undefined) return `<div class="obj got"><span class="rbadge done">MAX</span><span class="m-txt"><b>${o.label}</b><small>Tous les paliers réussis</small></span></div>`;
    const pct = Math.min(100, Math.round(v / tier * 100)), ready = v >= tier;
    return `<div class="obj ${ready ? 'ready' : ''}">${rewardBadge(o.rew[lvl])}
      <span class="m-txt"><b>${o.label}</b><small>Palier ${lvl + 1} / ${o.tiers.length}</small>
      <span class="obj-bar"><i style="width:${pct}%"></i></span><small class="obj-num">${Math.min(v, tier)} / ${tier}</small></span>
      ${ready ? `<button class="btn primary sm" data-obj="${o.id}">Récupérer</button>` : `<span class="dots">${o.tiers.map((_, k) => `<i class="${k < lvl ? 'on' : ''}"></i>`).join('')}</span>`}</div>`;
  }

  function claim(id) {
    if (id === 'perfect') { K.store.update(s => { s.daily.claimed.perfect = true; }); give(PERFECT); return; }
    const amount = DAILY.find(m => m.id === id).reward;
    K.store.update(s => { s.daily.claimed[id] = true; s.wallet.pulsations += amount; });
    ui.toast(`+${amount} ${cur()}`);
  }
  function claimObj(id) {
    const o = allObjectives().find(x => x.id === id), s = K.store.get(), lvl = s.objClaimed[id] || 0, tier = o.tiers[lvl];
    if (tier === undefined || o.val() < tier) return;
    K.store.update(st => { st.objClaimed[id] = lvl + 1; });
    give(o.rew[lvl]);
  }

  function stepsForm() {
    const body = ui.sheet(`<h2 class="sheet-title">10 000 pas aujourd’hui ?</h2>
      <p class="muted">Regarde le compteur de pas de ton téléphone ou de ta montre. On te fait confiance.</p>
      <div class="row-btns"><button class="btn ghost" data-p="no">Pas encore</button><button class="btn primary" data-p="yes">Oui, c’est fait</button></div>`);
    body.onclick = e => {
      const a = e.target.closest('[data-p]'); if (!a) return; ui.close();
      if (a.dataset.p === 'yes') { mark('pas'); ui.toast('Bravo ! Récupère ta récompense dans Missions.'); }
    };
  }

  K.missions = { today, mark, ensureFreePack, freePackIndex, claimable, render, rewardBadge, rewardText };
})();
