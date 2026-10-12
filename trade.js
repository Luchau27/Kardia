/* Offrir un doublon à un ami grâce à un code (fonctionne sans serveur, par SMS ou WhatsApp). */
(function () {
  const ui = K.ui, SALT = 'kardia-coeur-penche';
  const R2C = { C: 'C', R: 'R', 'É': 'E', L: 'L' }, C2R = { C: 'C', R: 'R', E: 'É', L: 'L' };
  function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).padStart(4, '0').slice(-4); }
  function make(k) {
    const p = K.collection.parse(k), nonce = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
    const body = `${p.id}.${R2C[p.r]}${p.v}.${nonce}`; return `KDA.${body}.${hash(body + SALT)}`;
  }
  function read(txt) {
    const m = String(txt || '').match(/KDA\.([a-z]{2,3}-\d{2})\.([CREL])([nhfl])\.([a-z0-9]{6})\.([a-z0-9]{4})/i);
    if (!m) throw new Error('Aucun code Kardia trouvé. Vérifie que tu as tout collé.');
    const id = m[1].toLowerCase(), rc = m[2].toUpperCase(), v = m[3].toLowerCase(), nonce = m[4].toLowerCase();
    const body = `${id}.${rc}${v}.${nonce}`;
    if (hash(body + SALT) !== m[5].toLowerCase()) throw new Error('Ce code n’est pas valide.');
    const card = K.collection.byId[id], r = C2R[rc];
    if (!card || !card.r.includes(r)) throw new Error('Ce code n’est pas valide.');
    return { id, r, v, nonce, card };
  }

  function giftForm(keys) {
    const body = ui.sheet(`<h2 class="sheet-title">Offrir un doublon</h2>
      <p class="muted">Choisis l’exemplaire à offrir. Il quitte ta collection et devient un code à envoyer à ton ami.</p>
      <div class="grid small">${keys.map(k => K.collection.cardHTML(K.collection.parse(k))).join('')}</div>`);
    body.onclick = e => { const c = e.target.closest('.kcard'); if (c) give(c.dataset.key); };
  }
  async function give(k) {
    const p = K.collection.parse(k);
    if (!(await ui.confirmBox(`Offrir ${p.card.name} (${K.collection.RNAME[p.r]}) ? La carte quittera ta collection.`, 'Offrir'))) return;
    const code = make(k);
    K.store.update(s => { if ((s.collection[k] || 0) > 1) s.collection[k] -= 1; });
    const text = `Je t’offre la carte ${p.card.name} (${K.collection.RNAME[p.r]}) sur Kardia ! Ouvre Kardia > Collection > « J’ai un code » et colle : ${code}`;
    const body = ui.sheet(`<h2 class="sheet-title">Ton cadeau est prêt</h2>
      <p class="muted">Envoie ce code à ton ami. Il ne fonctionne qu’une fois sur son téléphone.</p>
      <p class="code-box">${code}</p>
      <div class="actions">${navigator.share ? '<button class="btn primary" data-g="share">Envoyer</button>' : ''}<button class="btn ghost" data-g="copy">Copier le message</button></div>`);
    body.onclick = async e => {
      const a = e.target.closest('[data-g]'); if (!a) return;
      if (a.dataset.g === 'share') { try { await navigator.share({ title: 'Une carte Kardia pour toi', text }); } catch (err) {} }
      if (a.dataset.g === 'copy') { try { await navigator.clipboard.writeText(text); ui.toast('Message copié.'); } catch (err) { ui.toast('Copie impossible : recopie le code à la main.'); } }
    };
  }

  function redeemForm() {
    const body = ui.sheet(`<h2 class="sheet-title">J’ai un code</h2>
      <p class="muted">Colle le message ou le code reçu de ton ami.</p>
      <textarea class="field" rows="3" name="code" placeholder="KDA.org-01.Rn.xxxxxx.xxxx"></textarea>
      <button class="btn primary wide" data-r="ok">Recevoir la carte</button>`);
    body.onclick = e => {
      if (!e.target.closest('[data-r]')) return;
      try {
        const g = read(body.querySelector('[name=code]').value);
        if ((K.store.get().redeemed || []).includes(g.nonce)) throw new Error('Ce code a déjà été utilisé sur ce téléphone.');
        K.store.update(s => { s.redeemed = s.redeemed || []; s.redeemed.push(g.nonce); });
        const [res] = K.collection.addCards([{ id: g.id, r: g.r, v: g.v }]);
        ui.sheet(`<h2 class="sheet-title">Cadeau reçu !</h2><div class="detail-card">${K.collection.cardHTML(res, { cls: 'big', isNew: res.isNew })}</div><button class="btn primary wide" data-x>Super</button>`).onclick = ev => { if (ev.target.closest('[data-x]')) ui.close(); };
      } catch (err) { ui.toast(err.message); }
    };
  }
  K.trade = { giftForm, redeemForm, make, read };
})();
