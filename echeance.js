/* Fiche d'une étape du sentier : explication, remboursement, prise de RDV, preuve, victoire. */
(function () {
  const D = K.dates, ui = K.ui;

  function findItem(id) { return K.rules.plan(K.store.get()).upcoming.find(u => u.rule.id === id); }

  function doctolibURL(rule) {
    const p = K.store.get().profile || {};
    const city = ui.slug(p.city);
    return `https://www.doctolib.fr/${rule.doctolib}${city ? '/' + city : ''}`;
  }
  function mapsURL(query, pos) {
    const q = encodeURIComponent(query);
    if (pos) return `https://www.google.com/maps/search/${q}/@${pos.lat},${pos.lng},14z`;
    const p = K.store.get().profile || {};
    return `https://www.google.com/maps/search/${q}+${encodeURIComponent((p.postcode || '') + ' ' + (p.city || ''))}`;
  }
  function nearMe(rule) {
    if (!navigator.geolocation) { window.open(mapsURL(rule.maps), '_blank'); return; }
    ui.toast('Recherche autour de toi…');
    navigator.geolocation.getCurrentPosition(
      pos => window.open(mapsURL(rule.maps, { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }), '_blank'),
      () => { ui.toast('Localisation refusée : recherche autour de ta ville.'); window.open(mapsURL(rule.maps), '_blank'); },
      { timeout: 8000, maximumAge: 600000 }
    );
  }

  function open(id) {
    const it = findItem(id); if (!it) return;
    const r = it.rule, s = K.store.get();
    const statusTxt = { late: 'En retard', now: 'À planifier', planned: 'Rendez-vous prévu', soon: 'Bientôt', future: 'Plus tard' }[it.status];
    const reward = K.config.rewards[r.kind];
    const body = ui.sheet(`
      <div class="ech-head st-${it.status}">
        <div class="ech-emoji">${r.emoji}</div>
        <div><p class="ech-boss">${r.type === 'boss' ? 'Boss' : 'Allié'} · ${ui.esc(r.boss)}</p>
        <h2 class="sheet-title">${ui.esc(r.title)}</h2>
        <p class="ech-status"><span class="pill st-${it.status}">${statusTxt}</span> ${ui.esc(it.status === 'late' ? D.relative(it.due) : it.status === 'now' ? '' : it.label)}</p></div>
      </div>
      <p>${ui.esc(r.why)}</p>
      <div class="money"><span>💶</span><p>${ui.esc(K.rules.money(r, s))}</p></div>
      <p class="reward-hint">${ui.icons.puls} Victoire : <b>+${reward}</b> ${K.config.currency.name}${it.due && it.status !== 'late' ? ` · bonus de <b>+${K.config.rewards.earlyBonus}</b> si tu le fais en avance` : ''}</p>
      <div class="actions">
        ${r.doctolib ? `<a class="btn doctolib" href="${doctolibURL(r)}" target="_blank" rel="noopener">Chercher sur Doctolib</a>` : ''}
        ${r.maps ? `<button class="btn ghost" data-a="near">📍 Autour de moi</button>` : ''}
        ${r.kind === 'rdv' ? `<button class="btn ghost" data-a="plan">📅 ${it.planned ? 'Modifier mon RDV' : 'J’ai pris rendez-vous'}</button>` : ''}
        <button class="btn primary" data-a="done">${r.kind === 'rdv' ? '✅ J’ai fait ce rendez-vous' : '✅ C’est fait'}</button>
        <button class="btn text" data-a="snooze">Décaler de 2 semaines</button>
      </div>`);
    body.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'near') nearMe(r);
      if (a.dataset.a === 'plan') planForm(r, it);
      if (a.dataset.a === 'done') proofForm(r, it);
      if (a.dataset.a === 'snooze') {
        K.store.update(st => { const rec = st.echeances[r.id] || (st.echeances[r.id] = {}); rec.snoozeUntil = D.iso(D.addDays(D.today(), 14)); });
        ui.close(); ui.toast('Étape décalée de 2 semaines.');
      }
    });
  }

  function planForm(r, it) {
    const body = ui.sheet(`
      <h2 class="sheet-title">Ton rendez-vous</h2>
      <p class="muted">${ui.esc(r.title)}</p>
      <label class="lbl">Date du rendez-vous<input class="field" type="date" name="d" min="${D.todayISO()}" value="${it.planned ? D.iso(it.planned) : ''}"></label>
      <div class="row-btns"><button class="btn ghost" data-a="back">Retour</button><button class="btn primary" data-a="ok">Enregistrer</button></div>`);
    body.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'back') return open(r.id);
      const v = body.querySelector('[name=d]').value; if (!v) { ui.toast('Choisis une date.'); return; }
      K.store.update(st => { const rec = st.echeances[r.id] || (st.echeances[r.id] = {}); rec.planned = v; delete rec.snoozeUntil; });
      ui.close(); ui.toast('Rendez-vous noté le ' + D.short(D.parse(v)) + '.');
    });
  }

  async function compress(file) {
    if (!file.type.startsWith('image/')) return file;
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise(res => c.toBlob(b => res(b || file), 'image/jpeg', 0.72));
    } catch (e) { return file; }
  }

  function proofForm(r, it) {
    const needProof = r.kind === 'rdv';
    const body = ui.sheet(`
      <h2 class="sheet-title">${needProof ? 'Ajoute ta preuve' : 'Bravo !'}</h2>
      <p class="muted">${needProof ? 'Une photo de la facture, de l’ordonnance ou du compte-rendu suffit. Elle reste sur ton téléphone.' : 'Tu peux ajouter une photo si tu veux, ce n’est pas obligatoire.'}</p>
      <div class="proof-pick">
        <label class="btn ghost">📸 Prendre une photo<input type="file" accept="image/*" capture="environment" hidden data-in></label>
        <label class="btn ghost">📄 Choisir un fichier<input type="file" accept="image/*,application/pdf" hidden data-in></label>
      </div>
      <div class="proof-preview" hidden></div>
      <label class="lbl">Date du rendez-vous<input class="field" type="date" name="d" max="${D.todayISO()}" value="${D.todayISO()}"></label>
      <div class="row-btns"><button class="btn ghost" data-a="back">Retour</button><button class="btn primary" data-a="ok" ${needProof ? 'disabled' : ''}>Valider l’étape</button></div>`);
    let file = null;
    body.querySelectorAll('[data-in]').forEach(inp => inp.addEventListener('change', () => {
      file = inp.files[0]; if (!file) return;
      const pv = body.querySelector('.proof-preview'); pv.hidden = false;
      pv.innerHTML = file.type.startsWith('image/') ? `<img alt="Aperçu de la preuve" src="${URL.createObjectURL(file)}">` : `<p>📄 ${ui.esc(file.name)}</p>`;
      body.querySelector('[data-a=ok]').disabled = false;
    }));
    body.addEventListener('click', async e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'back') return open(r.id);
      if (a.disabled) return;
      a.disabled = true;
      const date = body.querySelector('[name=d]').value || D.todayISO();
      let proofId = null;
      if (file) {
        if (file.size > 8 * 1024 * 1024 && !file.type.startsWith('image/')) { ui.toast('Fichier trop lourd (8 Mo maximum).'); a.disabled = false; return; }
        try { proofId = r.id + '-' + Date.now(); await K.store.putProof(proofId, await compress(file)); }
        catch (err) { proofId = null; ui.toast('La preuve n’a pas pu être enregistrée, mais l’étape est validée.'); }
      }
      complete(r, it, date, proofId);
    });
  }

  function complete(r, it, dateISO, proofId) {
    const base = K.config.rewards[r.kind];
    const early = it.due && !it.suggested && D.parse(dateISO) < it.due ? K.config.rewards.earlyBonus : 0;
    const amount = base + early;
    K.store.update(s => {
      const rec = s.echeances[r.id] || (s.echeances[r.id] = {});
      rec.last = dateISO; delete rec.planned; delete rec.snoozeUntil;
      s.history.push({ id: r.id, date: dateISO, proof: proofId, reward: amount });
      s.wallet.pulsations += amount;
    });
    ui.close();
    setTimeout(() => ui.reward({
      title: r.type === 'boss' ? `${r.boss} est vaincu !` : `${r.boss} te rejoint !`,
      amount, sub: early ? `Dont +${early} pour l’avance. Ton héros avance sur le sentier.` : 'Ton héros avance sur le sentier.'
    }), 280);
  }

  K.echeance = { open };
})();
