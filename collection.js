/* Cartes : tirages, packs, ouverture, galerie, recyclage, fabrication et cadeaux entre amis. */
(function () {
  const ui = K.ui;
  const RAR = ['C', 'R', 'É', 'L'];
  const RNAME = { C: 'Commune', R: 'Rare', 'É': 'Épique', L: 'Légendaire' };
  const RCLS = { C: 'c', R: 'r', 'É': 'e', L: 'l' };
  const VNAME = { n: '', h: 'Holo', f: 'Full Art', l: 'Édition limitée' };
  const PTS = { C: 1, R: 3, 'É': 10, L: 40 };
  const byId = Object.fromEntries(K.CARDS.map(c => [c.id, c]));
  const catById = Object.fromEntries(K.CATS.map(c => [c.code, c]));
  const key = (id, r, v) => `${id}|${r}|${v}`;
  const parse = k => { const [id, r, v] = k.split('|'); return { id, r, v, card: byId[id] }; };
  const col = () => K.store.get().collection;
  const cur = () => K.config.currency.name;

  function ownedIds() { const s = new Set(); const c = col(); for (const k in c) if (c[k] > 0) s.add(k.split('|')[0]); return s; }
  function versions(id) { const c = col(); return Object.keys(c).filter(k => k.startsWith(id + '|') && c[k] > 0).map(k => ({ ...parse(k), n: c[k] })); }
  function best(id) {
    const vs = versions(id); if (!vs.length) return null;
    vs.sort((a, b) => (RAR.indexOf(b.r) - RAR.indexOf(a.r)) || ((b.v !== 'n') - (a.v !== 'n')));
    return vs[0];
  }
  function score() { let t = 0; const c = col(); for (const k in c) if (c[k] > 0) { const p = parse(k); t += PTS[p.r] * (p.v === 'n' ? 1 : 2); } return t; }
  function catCount(code) { const o = ownedIds(); return K.CARDS.filter(c => c.cat === code && o.has(c.id)).length; }
  function catTotal(code) { return K.CARDS.filter(c => c.cat === code).length; }
  function anyCatComplete() { return K.CATS.some(c => catCount(c.code) === catTotal(c.code)); }
  function dupCount() { let n = 0; const c = col(); for (const k in c) if (c[k] > 1) n += c[k] - 1; return n; }

  /* ---------- Tirage ---------- */
  function rollRarity(odds) { const x = Math.random(); let acc = 0; for (const r of RAR) { acc += odds[r] || 0; if (x < acc) return r; } return 'C'; }
  function pickCard(r, cat) {
    let pool = K.CARDS.filter(c => c.r.includes(r) && (!cat || c.cat === cat));
    if (!pool.length) pool = K.CARDS.filter(c => !cat || c.cat === cat);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function rollVariant(card, r) {
    const m = new Date().getMonth() + 1;
    if (card.ev && card.evm === m && Math.random() < 0.25) return 'l';
    if (r === 'C') return 'n';
    if (card.fa && Math.random() < 0.04) return 'f';
    if (card.holo && Math.random() < 0.15) return 'h';
    return 'n';
  }
  function draw(type, cat) {
    const P = K.config.packs[type], out = [];
    for (let i = 0; i < P.size; i++) {
      let r = rollRarity(P.odds);
      if (P.guarantee && i === P.size - 1 && !out.some(x => RAR.indexOf(x.r) >= RAR.indexOf(P.guarantee)) && RAR.indexOf(r) < RAR.indexOf(P.guarantee)) r = P.guarantee;
      const card = pickCard(r, cat); if (!card.r.includes(r)) r = 'C';
      out.push({ id: card.id, r, v: rollVariant(card, r) });
    }
    return out.sort((a, b) => RAR.indexOf(a.r) - RAR.indexOf(b.r));
  }

  /* Cadeau unique : le Cœur dans ses 4 raretés, pour voir les cartes illustrées. */
  function ensureGift() {
    const s = K.store.get(); s.gifts = s.gifts || {};
    if (s.gifts.coeur) return;
    K.store.update(st => { st.gifts = Object.assign({}, st.gifts, { coeur: true }); st.packs.unshift({ type: 'cadeau', from: 'cadeau', at: K.dates.todayISO(), cards: [{ id: 'org-01', r: 'C', v: 'n' }, { id: 'org-01', r: 'R', v: 'n' }, { id: 'org-01', r: 'É', v: 'n' }, { id: 'org-01', r: 'L', v: 'h' }] }); });
  }
  function grantPack(type, opts = {}) { K.store.update(s => { s.packs.push({ type, cat: opts.cat || null, from: opts.from || null, at: K.dates.todayISO() }); }); }
  function addCards(cards) {
    const before = ownedIds(), seen = new Set();
    K.store.update(s => { cards.forEach(c => { const k = key(c.id, c.r, c.v); s.collection[k] = (s.collection[k] || 0) + 1; }); });
    return cards.map(c => { const isNew = !before.has(c.id) && !seen.has(c.id); seen.add(c.id); return { ...c, isNew }; });
  }

  /* ---------- Affichage d'une carte ---------- */
  function fileOf(c, v) { return K.config.cardsPath + c.file + (v === 'f' ? '-fullart' : v === 'l' ? '-limitee' : '') + '.png'; }
  /* Image de carte déposée dans le dépôt (une par rareté, plus Full Art / édition limitée). */
  function artFor(c, r, v) {
    if (!K.vis || !K.vis.cardImg) return null;
    if (v === 'f' || v === 'l') { const x = K.vis.cardImg(c.id, v); if (x) return x; }
    return K.vis.cardImg(c.id, r) || K.vis.cardImg(c.id, 'C');
  }
  function cardHTML(x, o = {}) {
    const c = byId[x.id], art = artFor(c, x.r, x.v);
    if (art) {
      return `<div class="kcard full r-${RCLS[x.r]} v-${x.v} cat-${c.cat} ${o.cls || ''}" data-id="${c.id}" data-key="${key(x.id, x.r, x.v)}">
        ${o.cls && o.cls.includes('big') ? `<img class="kc-full" alt="${ui.esc(c.name)} ${RNAME[x.r]}" src="${art}">` : `<img class="kc-full" alt="${ui.esc(c.name)} ${RNAME[x.r]}" data-thumb="${art}">`}
        <span class="kc-tag">${RNAME[x.r]}${x.v === 'h' ? ' · Holo' : x.v === 'f' ? ' · Full Art' : ''}</span>
        ${o.count > 1 ? `<span class="kc-count">×${o.count}</span>` : ''}${o.isNew ? '<span class="kc-new">Nouveau</span>' : ''}
      </div>`;
    }
    return `<div class="kcard r-${RCLS[x.r]} v-${x.v} cat-${c.cat} ${o.cls || ''}" data-id="${c.id}" data-key="${key(x.id, x.r, x.v)}">
      <div class="kc-art"><div class="kc-ph"><span>${c.emo}</span></div><img loading="lazy" alt="" src="${fileOf(c, x.v)}" onerror="this.remove()"></div>
      <div class="kc-band"><b>${ui.esc(c.name)}</b><span class="kc-rar">${RNAME[x.r]}${x.v !== 'n' && x.v !== 'l' ? ' · ' + VNAME[x.v] : ''}</span></div>
      ${o.count > 1 ? `<span class="kc-count">×${o.count}</span>` : ''}${o.isNew ? '<span class="kc-new">Nouveau</span>' : ''}
    </div>`;
  }
  function missingHTML(c, r) {
    return `<div class="kcard missing cat-${c.cat} ${r ? 'r-' + RCLS[r] : ''}" data-id="${c.id}" ${r ? `data-r="${r}"` : ''}><div class="kc-art"><div class="kc-ph"><span>?</span></div></div><div class="kc-band"><b>${ui.esc(c.name)}</b><span class="kc-rar">${r ? RNAME[r] : 'À trouver'}</span></div></div>`;
  }
  /* Un emplacement par carte et par rareté. */
  const slots = cat => K.CARDS.filter(c => !cat || c.cat === cat).reduce((t, c) => t + c.r.length, 0);
  function ownedSlots(cat) { const set = new Set(); const cl = col(); for (const k in cl) if (cl[k] > 0) { const p = parse(k); if (!cat || p.card.cat === cat) set.add(p.id + '|' + p.r); } return set.size; }

  /* ---------- Visuel d'un pack (image du dossier visuels, sinon dessin) ---------- */
  function packVisual(type, size, cat) {
    const P = K.config.packs[type];
    if (K.vis && K.vis.has('pack-' + type)) return `<span class="pack-v img ${size || ''} t-${type}"><img alt="${ui.esc(P.name)}" ${size === 'big' ? 'src' : 'data-thumb'}="${K.vis.url('pack-' + type)}">${cat ? `<small class="pack-cat">${ui.esc(catById[cat].name)}</small>` : ''}</span>`;
    return `<span class="pack-v ${size || ''} t-${type}">${ui.logo(size === 'tiny' ? 14 : size === 'big' ? 64 : 30)}<b>${ui.esc(P.name.replace('Pack ', ''))}</b>${cat ? `<small class="pack-cat">${ui.esc(catById[cat].name)}</small>` : ''}</span>`;
  }
  function backFace() { return K.vis && K.vis.has('verso') ? `<img class="verso" alt="" src="${K.vis.url('verso')}">` : backHTML(null); }

  /* Dos de carte dessiné par l'appli : les textes viennent de cards.js et de config.js, donc faciles à modifier. */
  function backHTML(c, r) {
    const B = K.config.back || {};
    const fact = c ? ((K.FACTS && K.FACTS[c.id] && K.FACTS[c.id][r]) || c.fact) : '';
    const know = typeof B.know === 'object' ? (B.know[r] || B.know.R) : B.know;
    const pulse = '<svg class="kb-pulse" viewBox="0 0 120 20" aria-hidden="true"><path d="M0 10h42l5-5 6 5 4 9 5-17 4 13 3-5h51" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    return `<div class="kback ${c ? '' : 'down'}">
      <div class="kb-rays"></div><div class="kb-edge"></div><div class="kb-frame"></div>
      <p class="kb-top">${ui.esc(B.top || '')}</p>
      <div class="kb-medal"><i class="kb-ring r1"></i><i class="kb-ring r2"></i><i class="kb-ring r3"></i>
        <div class="kb-core"><b>${ui.esc(B.logo || 'Kardia')}</b>${pulse}</div></div>
      ${c ? `<p class="kb-know">${ui.esc(know || '')}</p><p class="kb-fact">${ui.esc(fact)}</p>
      <div class="kb-foot"><span>${c.id.toUpperCase()}</span><span>${ui.esc(c.name)}</span></div>` : ''}
    </div>`;
  }

  /* ---------- Ouverture d'un pack ---------- */
  function openPack(index = 0) {
    const s = K.store.get(), pack = s.packs[index]; if (!pack) return;
    const P = K.config.packs[pack.type];
    const ov = ui.h(`<div class="opening" role="dialog" aria-modal="true">
      <div class="op-stage">
        <button class="foil" aria-label="Ouvrir le ${ui.esc(P.name)}">${packVisual(pack.type, 'big', pack.cat)}</button>
        <p class="op-name">${ui.esc(P.name)}</p>
        <p class="op-hint">Touche le pack pour l’ouvrir</p>
      </div></div>`);
    document.body.appendChild(ov);
    ov.querySelector('.foil').onclick = () => {
      const cards = pack.cards ? pack.cards.map(c => ({ ...c })) : draw(pack.type, pack.cat);
      K.store.update(st => { st.packs.splice(index, 1); st.stats.packsOpened = (st.stats.packsOpened || 0) + 1; });
      const res = addCards(cards);
      if (pack.type === 'gratuit' && K.missions) K.missions.mark('pack');
      ov.querySelector('.foil').classList.add('torn');
      setTimeout(() => reveal(ov, res), 420);
    };
  }
  function reveal(ov, res) {
    const left = K.store.get().packs.length;
    ov.querySelector('.op-stage').innerHTML = `
      <p class="op-hint">Touche chaque carte pour la retourner</p>
      <div class="op-cards">${res.map((x, i) => `<button class="flip r-${RCLS[x.r]}" style="--d:${i * 90}ms" aria-label="Retourner la carte ${i + 1}">
        <span class="flip-in"><span class="flip-back">${backFace()}</span><span class="flip-front">${cardHTML(x, { isNew: x.isNew })}</span></span></button>`).join('')}</div>
      <div class="op-actions"><button class="btn ghost" data-op="all">Tout retourner</button>
      <button class="btn primary" data-op="done">${left ? `Pack suivant (${left})` : 'Continuer'}</button></div>`;
    ov.onclick = e => {
      const f = e.target.closest('.flip');
      if (f && !f.classList.contains('on')) { f.classList.add('on'); if ((f.classList.contains('r-e') || f.classList.contains('r-l')) && navigator.vibrate) navigator.vibrate(f.classList.contains('r-l') ? [40, 40, 120] : 50); return; }
      const a = e.target.closest('[data-op]'); if (!a) return;
      if (a.dataset.op === 'all') ov.querySelectorAll('.flip').forEach((x, i) => setTimeout(() => x.classList.add('on'), i * 120));
      if (a.dataset.op === 'done') { ov.remove(); if (K.store.get().packs.length) openPack(0); }
    };
  }

  /* ---------- Galerie ---------- */
  let fCat = 'all', fRar = 'all', showMissing = true, limit = 48;
  function renderGallery(el) {
    const s = K.store.get(), owned = ownedIds(), packs = s.packs, dups = dupCount();
    const list = K.CARDS.filter(c => fCat === 'all' || c.cat === fCat);
    const all = list.flatMap(c => c.r.split('').filter(r => fRar === 'all' || r === fRar).map(r => {
      const vs = versions(c.id).filter(v => v.r === r);
      if (!vs.length) return showMissing ? missingHTML(c, r) : '';
      vs.sort((a, b) => (b.v !== 'n') - (a.v !== 'n'));
      return cardHTML(vs[0], { count: vs.reduce((t, v) => t + v.n, 0) });
    })).filter(Boolean);
    /* Affichage par lots pour ménager la mémoire du téléphone. */
    const items = all.slice(0, limit).join('') + (all.length > limit ? `<button class="btn ghost more" data-more>Afficher plus (${all.length - limit})</button>` : '');
    el.innerHTML = `
      <div class="col-top">
        <div class="col-stat"><b>${ownedSlots()}</b><span>/ ${slots()} cartes</span></div>
        <div class="col-stat"><b>${score().toLocaleString('fr-FR')}</b><span>score de collection</span></div>
      </div>
      ${packs.length ? `<div class="sec-head"><h3 class="sec">Packs à ouvrir</h3><span class="sec-meta">${packs.length}</span></div><div class="packs-row">${packs.map((p, i) => `<button class="pack-btn" data-pack="${i}">${packVisual(p.type, '', p.cat)}</button>`).join('')}</div>` : ''}
      <div class="col-tools">
        <button class="chip" data-c="code">J’ai un code cadeau</button>
        ${dups ? `<button class="chip" data-c="recycle-all">Recycler ${dups} doublon${dups > 1 ? 's' : ''}</button>` : ''}
      </div>
      <div class="chips" role="tablist">${[['all', 'Toutes', '']].concat(K.CATS.map(c => [c.code, c.name, ` ${ownedSlots(c.code)}/${slots(c.code)}`])).map(([v, l, n]) => `<button class="chip ${fCat === v ? 'on' : ''}" data-fc="${v}">${l}<small>${n}</small></button>`).join('')}</div>
      <div class="chips">${[['all', 'Toutes raretés']].concat(RAR.map(r => [r, RNAME[r]])).map(([v, l]) => `<button class="chip small r-${RCLS[v] || 'all'} ${fRar === v ? 'on' : ''}" data-fr="${v}">${l}</button>`).join('')}
        <button class="chip small ${showMissing ? 'on' : ''}" data-fm>Manquantes</button></div>
      <div class="grid">${items || '<p class="muted empty">Aucune carte ici pour l’instant. Ouvre un pack pour commencer ta collection.</p>'}</div>`;
    el.onclick = e => {
      const t = e.target.closest('button, .kcard'); if (!t) return;
      if (t.dataset.pack !== undefined) return openPack(Number(t.dataset.pack));
      if (t.hasAttribute('data-more')) { limit += 48; return renderGallery(el); }
      if (t.dataset.fc) { fCat = t.dataset.fc; limit = 48; return renderGallery(el); }
      if (t.dataset.fr) { fRar = t.dataset.fr; limit = 48; return renderGallery(el); }
      if (t.hasAttribute('data-fm')) { showMissing = !showMissing; limit = 48; return renderGallery(el); }
      if (t.dataset.c === 'code') return K.trade.redeemForm();
      if (t.dataset.c === 'recycle-all') return recycleAll();
      if (t.classList.contains('kcard')) return detail(t.dataset.id, t.dataset.r || (t.dataset.key || '').split('|')[1]);
    };
  }

  /* ---------- Fiche d'une carte ---------- */
  function detail(id, r) {
    const c = byId[id];
    r = r || (best(id) || {}).r || c.r[0];
    const vs = versions(id).filter(v => v.r === r).sort((a, b) => (b.v !== 'n') - (a.v !== 'n'));
    const b = vs[0], dup = vs.filter(v => v.n > 1);
    const recycleGain = dup.reduce((t, v) => t + (v.n - 1) * K.config.recycle[v.r] * (v.v === 'n' ? 1 : 2), 0);
    const body = ui.sheet(`
      <div class="detail-card">${b ? `<button class="flipper" aria-label="Retourner la carte"><span class="flip-in"><span class="flip-front">${cardHTML(b, { cls: 'big', count: vs.reduce((t, v) => t + v.n, 0) })}</span>
        <span class="flip-back">${K.vis && K.vis.cardImg(c.id, 'dos') ? `<img class="back-img" alt="" src="${K.vis.cardImg(c.id, 'dos')}">` : backHTML(c, r)}</span></span></button>` : missingHTML(c, r).replace('kcard missing', 'kcard missing big')}</div>
      ${b ? '<p class="muted center">Touche la carte pour lire son anecdote.</p>' : ''}
      <div class="actions">
        ${recycleGain ? `<button class="btn ghost" data-d="recycle">Recycler les doublons · +${recycleGain}</button>` : ''}
        ${dup.length ? `<button class="btn ghost" data-d="gift">Offrir un doublon à un ami</button>` : ''}
        ${!b ? `<button class="btn primary" data-craft="${r}">Fabriquer · ${K.config.craft[r]} ${cur()}</button>` : ''}
      </div>`);
    body.onclick = e => {
      if (e.target.closest('.flipper')) { e.target.closest('.flipper').classList.toggle('on'); return; }
      const a = e.target.closest('[data-d], [data-craft]'); if (!a) return;
      if (a.dataset.d === 'recycle') { recycle(id, r); detail(id, r); }
      if (a.dataset.d === 'gift') K.trade.giftForm(dup.map(v => key(v.id, v.r, v.v)));
      if (a.dataset.craft) craft(id, a.dataset.craft);
    };
  }

  function recycle(id, r) {
    let gain = 0;
    K.store.update(s => {
      Object.keys(s.collection).forEach(k => {
        if (id && !k.startsWith(id + '|')) return;
        if (r && k.split('|')[1] !== r) return;
        const n = s.collection[k]; if (n > 1) { const p = parse(k); gain += (n - 1) * K.config.recycle[p.r] * (p.v === 'n' ? 1 : 2); s.collection[k] = 1; }
      });
      s.wallet.pulsations += gain;
    });
    if (gain) ui.toast(`+${gain} ${cur()} grâce au recyclage.`);
    return gain;
  }
  async function recycleAll() {
    if (await ui.confirmBox(`Recycler tous tes doublons ? Tu gardes un exemplaire de chaque version.`, 'Recycler')) recycle(null);
  }
  function craft(id, r) {
    const cost = K.config.craft[r], s = K.store.get();
    if (s.wallet.pulsations < cost) { ui.toast(`Il te manque ${cost - s.wallet.pulsations} ${cur()}.`); return; }
    K.store.update(st => { st.wallet.pulsations -= cost; const k = key(id, r, 'n'); st.collection[k] = (st.collection[k] || 0) + 1; });
    ui.close(); ui.toast(`${byId[id].name} ${RNAME[r]} rejoint ta collection !`);
  }

  /* Dos des cartes : image propre à la carte (xxx-dos.png, déjà avec l'anecdote),
     sinon dos commun (dos.png) avec l'anecdote écrite par-dessus, sinon texte seul. */
  function backLoaded(img) { img.parentNode.classList.add(img.dataset.generic ? 'img-bg' : 'img-full'); }
  function backFailed(img) {
    if (!img.dataset.generic && K.vis && K.vis.has('verso')) { img.dataset.generic = '1'; img.src = K.vis.url('verso'); return; }
    img.remove();
  }

  K.collection = { backHTML, packVisual, ensureGift, RAR, RNAME, RCLS, byId, catById, key, parse, ownedIds, versions, score, catCount, catTotal, anyCatComplete, draw, grantPack, addCards, openPack, cardHTML, renderGallery, detail };
})();
