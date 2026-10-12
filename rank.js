/* Classement en ligne (Firebase). Seuls le pseudo, la région et le score Kardia sont publiés. */
(function () {
  const ui = K.ui;
  const V = '10.12.2', BASE = `https://www.gstatic.com/firebasejs/${V}/`;
  const REGIONS = {
    'Auvergne-Rhône-Alpes': '01 03 07 15 26 38 42 43 63 69 73 74', 'Bourgogne-Franche-Comté': '21 25 39 58 70 71 89 90', 'Bretagne': '22 29 35 56',
    'Centre-Val de Loire': '18 28 36 37 41 45', 'Corse': '20', 'Grand Est': '08 10 51 52 54 55 57 67 68 88', 'Hauts-de-France': '02 59 60 62 80',
    'Île-de-France': '75 77 78 91 92 93 94 95', 'Normandie': '14 27 50 61 76', 'Nouvelle-Aquitaine': '16 17 19 23 24 33 40 47 64 79 86 87',
    'Occitanie': '09 11 12 30 31 32 34 46 48 65 66 81 82', 'Pays de la Loire': '44 49 53 72 85', 'Provence-Alpes-Côte d’Azur': '04 05 06 13 83 84', 'Outre-mer': '97 98'
  };
  function region() {
    const pc = ((K.store.get().profile || {}).postcode || '').slice(0, 2);
    for (const [r, list] of Object.entries(REGIONS)) if (pc && list.split(' ').includes(pc)) return r;
    return 'Non renseignée';
  }
  function score() {
    const s = K.store.get();
    return K.collection.score() + 25 * (s.history || []).length + 40 * (K.bonus ? K.bonus.totalLevels() : 0);
  }

  let fb = null, loading = null;
  function loadScript(src) { return new Promise((res, rej) => { const t = document.createElement('script'); t.src = src; t.onload = res; t.onerror = () => rej(new Error('Connexion impossible au classement.')); document.head.appendChild(t); }); }
  async function connect() {
    if (fb) return fb;
    if (!K.firebaseConfig) throw new Error('not-configured');
    if (!loading) loading = (async () => {
      await loadScript(BASE + 'firebase-app-compat.js');
      await loadScript(BASE + 'firebase-auth-compat.js');
      await loadScript(BASE + 'firebase-firestore-compat.js');
      const app = firebase.initializeApp(K.firebaseConfig);
      const cred = await app.auth().signInAnonymously();
      fb = { app, db: app.firestore(), uid: cred.user.uid };
      K.store.update(s => { s.rank = Object.assign({}, s.rank, { uid: fb.uid }); });
      return fb;
    })().catch(e => { loading = null; throw e; });
    return loading;
  }
  let pushTimer;
  function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 4000); }
  async function push() {
    const s = K.store.get(); if (!K.firebaseConfig || !s.rank || !s.rank.optIn || !navigator.onLine) return;
    try {
      const f = await connect();
      await f.db.collection('scores').doc(f.uid).set({ pseudo: String(s.profile.pseudo).slice(0, 20), score: Math.round(score()), region: region(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } catch (e) { /* hors-ligne ou non configuré : on réessaiera plus tard */ }
  }
  async function leave() {
    try { const f = await connect(); await f.db.collection('scores').doc(f.uid).delete(); } catch (e) {}
    K.store.update(s => { s.rank = Object.assign({}, s.rank, { optIn: false }); });
  }

  let tab = 'france', cache = {};
  async function fetchTab(t) {
    const f = await connect(), s = K.store.get(), col = f.db.collection('scores');
    let docs = [];
    if (t === 'france') docs = (await col.orderBy('score', 'desc').limit(50).get()).docs;
    if (t === 'region') docs = (await col.where('region', '==', region()).limit(300).get()).docs;
    if (t === 'amis') {
      const ids = [f.uid].concat(s.friends || []).slice(0, 30);
      docs = (await col.where(firebase.firestore.FieldPath.documentId(), 'in', ids).get()).docs;
    }
    return docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.score - a.score).slice(0, 50);
  }

  function render(el) {
    const s = K.store.get(), me = Math.round(score());
    const header = `<div class="col-top"><div class="col-stat"><b>${me.toLocaleString('fr-FR')}</b><span>ton score Kardia</span></div>
      <div class="col-stat"><b>${ui.esc(region().split('-')[0])}</b><span>ta région</span></div></div>
      <p class="muted small-note">Score Kardia = score de collection + 25 par étape du sentier + 40 par niveau bonus.</p>`;
    if (!K.firebaseConfig) {
      el.innerHTML = header + `<div class="notice"><b>Le classement en ligne n’est pas encore activé.</b><p>Il faut créer le projet Firebase et coller sa configuration dans le fichier firebase-config.js (voir le guide). Ton score est déjà calculé et sera publié dès l’activation.</p></div>`;
      el.onclick = null; return;
    }
    if (!s.rank || !s.rank.optIn) {
      el.innerHTML = header + `<div class="notice"><b>Apparaître dans le classement ?</b><p>Kardia publiera uniquement ton pseudo, ta région et ton score Kardia. Aucune information de santé ne quitte ton téléphone.</p>
        <button class="btn primary wide" data-r="join">Participer</button></div>`;
      el.onclick = async e => { if (e.target.closest('[data-r=join]')) { K.store.update(st => { st.rank = Object.assign({}, st.rank, { optIn: true }); }); await push(); cache = {}; } };
      return;
    }
    const tabs = [['france', 'France'], ['region', 'Ma région'], ['amis', 'Amis']];
    const rows = cache[tab];
    const uid = s.rank.uid;
    el.innerHTML = header + `<div class="chips">${tabs.map(([v, l]) => `<button class="chip ${tab === v ? 'on' : ''}" data-t="${v}">${l}</button>`).join('')}</div>
      <div class="ranking">${rows === undefined ? '<p class="muted center">Chargement…</p>' : rows === null ? '<p class="muted center">Connexion impossible. Vérifie ton réseau.</p>'
        : rows.length ? rows.map((r, i) => `<div class="rk ${r.id === uid ? 'me' : ''}"><span class="rk-pos">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span><b>${ui.esc(r.pseudo)}</b><small>${ui.esc(r.region || '')}</small><span class="rk-score">${Number(r.score).toLocaleString('fr-FR')}</span></div>`).join('')
        : '<p class="muted center">Personne pour l’instant. Invite tes amis !</p>'}</div>
      ${tab === 'amis' ? `<div class="friend-box"><h3 class="q">Ton code ami</h3><p class="code-box">${ui.esc(uid || '…')}</p>
        <div class="row-btns"><button class="btn ghost" data-r="share">Partager</button><button class="btn primary" data-r="add">Ajouter un ami</button></div></div>` : ''}
      <button class="btn text wide" data-r="leave">Ne plus apparaître dans le classement</button>`;
    if (rows === undefined) fetchTab(tab).then(r => { cache[tab] = r; K.world.refresh(); }).catch(() => { cache[tab] = null; K.world.refresh(); });
    el.onclick = async e => {
      const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; delete cache[tab]; return render(el); }
      const a = e.target.closest('[data-r]'); if (!a) return;
      if (a.dataset.r === 'share') K.duo.inviteApp();
      if (a.dataset.r === 'add') addFriend();
      if (a.dataset.r === 'leave' && await ui.confirmBox('Retirer ton score du classement en ligne ?', 'Retirer')) { await leave(); cache = {}; }
    };
  }

  function addFriend() {
    const body = ui.sheet(`<h2 class="sheet-title">Ajouter un ami</h2><p class="muted">Colle le code ami qu’il t’a envoyé (onglet Amis de son classement).</p>
      <textarea class="field" rows="2" name="c"></textarea><button class="btn primary wide" data-f>Ajouter</button>`);
    body.onclick = async e => {
      if (!e.target.closest('[data-f]')) return;
      const m = body.querySelector('[name=c]').value.match(/[A-Za-z0-9]{20,40}/);
      if (!m) return ui.toast('Code ami introuvable.');
      const code = m[0], s = K.store.get();
      if (s.rank && code === s.rank.uid) return ui.toast('C’est ton propre code !');
      if ((s.friends || []).includes(code)) return ui.toast('Cet ami est déjà dans ta liste.');
      try {
        const f = await connect(), d = await f.db.collection('scores').doc(code).get();
        if (!d.exists) return ui.toast('Aucun joueur avec ce code. Ton ami doit d’abord participer au classement.');
        K.store.update(st => { st.friends = (st.friends || []).concat(code).slice(0, 29); });
        cache = {}; ui.close(); ui.toast(`${d.data().pseudo} ajouté à tes amis !`);
      } catch (err) { ui.toast('Connexion impossible. Réessaie plus tard.'); }
    };
  }

  document.addEventListener('kardia:change', schedulePush);
  window.addEventListener('online', schedulePush);
  K.rank = { render, score, region, push };
})();
