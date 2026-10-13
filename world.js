/* L'écran principal : le monde en 2D (vue rapprochée) et le sentier (vue dézoomée). */
(function () {
  const ui = K.ui, D = K.dates;

  /* ---------- Décor : collines et arbres-bronches, générés une fois ---------- */
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function hills(w, h, base, amp, k1, k2, ph) {
    let d = `M0 ${h}`;
    for (let x = 0; x <= w; x += 10) {
      const y = base - amp * (0.6 * Math.sin(2 * Math.PI * k1 * x / w + ph) + 0.4 * Math.sin(2 * Math.PI * k2 * x / w + ph * 2.3));
      d += `L${x} ${y.toFixed(1)}`;
    }
    return d + `L${w} ${h}Z`;
  }
  function tree(x, y, len, ang, depth, w, r, out) {
    const x2 = x + len * Math.cos(ang), y2 = y - len * Math.sin(ang), f = v => v.toFixed(1);
    out.push(`<line x1="${f(x)}" y1="${f(y)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="${f(w)}"/>`);
    if (depth === 0) { out.push(`<circle cx="${f(x2)}" cy="${f(y2)}" r="${f(w * 1.8 + 4)}"/>`); return; }
    const s = 0.42 + r() * 0.25;
    tree(x2, y2, len * (0.7 + r() * 0.08), ang + s, depth - 1, w * 0.68, r, out);
    tree(x2, y2, len * (0.7 + r() * 0.08), ang - s, depth - 1, w * 0.68, r, out);
  }
  function forest(xs, ground, seed, scale) {
    const r = rng(seed), out = [];
    xs.forEach(x => tree(x, ground + 6, 62 * scale, Math.PI / 2 + (r() - .5) * .15, 5, 13 * scale, r, out));
    return `<g class="tree">${out.join('')}</g>`;
  }
  let decor;
  function buildDecor() {
    if (decor) return decor;
    const far = `<svg viewBox="0 0 1000 400" preserveAspectRatio="none"><path class="far-p" d="${hills(1000, 400, 250, 46, 2, 3, .7)}"/></svg>`;
    const mid = `<svg viewBox="0 0 1000 400"><path class="mid-p" d="${hills(1000, 400, 340, 18, 1, 4, 2.1)}"/>${forest([150, 560, 840], 330, 7, 1)}${forest([380], 336, 11, .7)}</svg>`;
    let grass = ''; const r = rng(3);
    for (let i = 0; i < 46; i++) { const x = (i * 21.7 + r() * 10) % 1000, hgt = 8 + r() * 12; grass += `M${x.toFixed(1)} 48l4 -${hgt.toFixed(1)}l4 ${hgt.toFixed(1)}Z`; }
    const near = `<svg viewBox="0 0 1000 200" preserveAspectRatio="none"><path class="near-p" d="${hills(1000, 200, 46, 4, 2, 3, .3)}"/><path class="near-p" d="${grass}"/><path class="trail" d="M0 82C250 72 500 92 750 80S1000 82 1000 82"/></svg>`;
    decor = { far, mid, near };
    return decor;
  }
  const tile = (svg, n = 3) => Array(n).fill(svg).join('');

  const bossIcon = r => K.vis && K.vis.has('boss-' + r.id) ? `<img class="boss-img" alt="" src="${K.vis.url('boss-' + r.id)}">` : r.emoji;

  /* ---------- Rendu ---------- */
  let root, mode = 'scene';
  function render() {
    if (K.missions) K.missions.ensureFreePack();
    const s = K.store.get(), dec = buildDecor(), hasDecor = K.vis && K.vis.has('decor');
    root = document.getElementById('app');
    root.innerHTML = `
    <main class="game ${hasDecor ? 'has-decor' : ''}" data-mood="${K.checkin.mood()}" style="--ground:${(K.config.decorGround || .14) * 100}vh">
      <section class="scene" aria-label="Ton monde">
        ${hasDecor ? `<div class="decor"><div class="decor-strip">${[0, 1, 2, 3].map(i => `<img alt="" class="${i % 2 ? 'mir' : ''}" src="${K.vis.url('decor')}">`).join('')}</div></div>` : `<div class="sky"></div><div class="sun"></div>
        <div class="layer far">${tile(dec.far)}</div>
        <div class="layer mid">${tile(dec.mid)}</div>
        <div class="layer near">${tile(dec.near)}</div>`}
        <div class="rain" aria-hidden="true"></div>
        <button class="hero" aria-label="Ton héros. Double-tape pour lui parler.">${K.avatar.svg(s.avatar, { walking: true })}</button>
        <div class="bubble" hidden></div>
        <button class="teaser" hidden></button>
        <button class="daily-pack" data-a="daily-pack" hidden aria-label="Ouvrir ton pack du jour"></button>
        <p class="pinch-hint">Pince l’écran pour voir ton sentier</p>
      </section>
      <section class="map" aria-label="Ton sentier" hidden>
        <header class="map-head"><button class="icon-btn" data-a="close-map" aria-label="Revenir au monde">${ui.icons.back}</button><h2>Ton sentier</h2></header>
        <div class="map-track"></div>
      </section>
      <section class="panel" hidden>
        <header class="map-head"><button class="icon-btn" data-a="close-panel" aria-label="Revenir au monde">${ui.icons.back}</button><h2></h2></header>
        <div class="panel-body"></div>
      </section>
      <header class="hud">
        <div class="hud-left">
          <button class="me-btn" data-a="settings" aria-label="Réglages">${ui.esc((s.profile.pseudo || '?').slice(0, 1).toUpperCase())}</button>
          <button class="stats" data-a="checkin" aria-label="Mettre à jour ma météo intérieure"></button>
        </div>
        <div class="hud-right">
          <div class="wallet" aria-label="${K.config.currency.name}">${ui.icons.puls}<span data-wallet></span></div>
          <button class="icon-btn shop" data-a="tab" data-tab="shop" aria-label="Boutique">${ui.icons.shop}</button>
        </div>
      </header>
      <nav class="tabbar">
        <button data-a="tab" data-tab="missions">${ui.icons.missions}<span>Missions</span><i class="badge" data-badge="missions" hidden></i></button>
        <button data-a="tab" data-tab="collection">${ui.icons.cards}<span>Collection</span><i class="badge" data-badge="collection" hidden></i></button>
        <button class="tab-map" data-a="tab" data-tab="map" aria-label="Mon sentier"><span class="tab-map-circle">${ui.icons.map}</span><span>Sentier</span></button>
        <button data-a="tab" data-tab="rank">${ui.icons.rank}<span>Classement</span></button>
        <button data-a="tab" data-tab="bonus">${ui.icons.bonus}<span>Bonus</span></button>
      </nav>
    </main>`;
    bind();
    refresh();
    startPowers();
    if (mode === 'map') openMap(true);
    else if (panel) openPanel(panel);
  }

  function refresh() {
    if (!root || !root.querySelector('.game')) return;
    const s = K.store.get(), b = K.checkin.bars();
    root.querySelector('.game').dataset.mood = K.checkin.mood();
    root.querySelector('[data-wallet]').textContent = s.wallet.pulsations.toLocaleString('fr-FR');
    root.querySelector('.stats').innerHTML = [['sleep', ui.icons.moon, 'Sommeil'], ['activity', ui.icons.bolt, 'Activité'], ['heart', ui.icons.heart, 'Cœur']].map(([k, e, l]) =>
      `<span class="stat st-${k}" title="${l}"><i aria-hidden="true">${e}</i><span class="bar" role="meter" aria-label="${l}" aria-valuenow="${b[k]}" aria-valuemin="0" aria-valuemax="100"><b style="width:${b[k]}%"></b></span></span>`).join('');
    const dp = root.querySelector('.daily-pack'), fi = K.missions ? K.missions.freePackIndex() : -1;
    dp.hidden = fi < 0; if (fi >= 0 && !dp.innerHTML) dp.innerHTML = K.collection.packVisual('gratuit') + '<span class="dp-label">Pack du jour</span>';
    const next = K.rules.plan(s).upcoming[0], t = root.querySelector('.teaser');
    if (next) {
      t.hidden = false; t.dataset.id = next.rule.id; t.className = 'teaser st-' + next.status;
      t.innerHTML = `<span class="t-emoji">${bossIcon(next.rule)}</span><span><small>Prochaine étape</small><b>${ui.esc(next.rule.short)}</b><em>${ui.esc(next.label)}</em></span>`;
    } else t.hidden = true;
    if (mode === 'map') renderMap();
    if (panel) renderPanel();
    const bm = root.querySelector('[data-badge=missions]'), bc = root.querySelector('[data-badge=collection]');
    const nm = K.missions ? K.missions.claimable() : 0, np = s.packs ? s.packs.length : 0;
    bm.hidden = !nm; bm.textContent = nm; bc.hidden = !np; bc.textContent = np;
  }

  /* ---------- Panneaux (missions, collection, boutique) ---------- */
  const PANELS = {
    missions: { title: 'Missions', render: el => K.missions.render(el) },
    collection: { title: 'Collection', render: el => K.collection.renderGallery(el) },
    shop: { title: 'Boutique', render: el => K.shop.render(el) },
    rank: { title: 'Classement', render: el => K.rank.render(el) },
    bonus: { title: 'Niveaux bonus', render: el => K.bonus.render(el) }
  };
  let panel = null;
  function setTab(name) { root.querySelectorAll('.tabbar [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name)); }
  function openPanel(name) {
    if (!PANELS[name]) return;
    if (mode === 'map') closeMap(true);
    panel = name;
    const el = root.querySelector('.panel'); el.hidden = false;
    el.querySelector('h2').textContent = PANELS[name].title;
    root.querySelector('.game').classList.add('paneling');
    renderPanel(); el.scrollTop = 0; setTab(name);
  }
  function renderPanel() { const el = root.querySelector('.panel'), st = el.scrollTop; PANELS[panel].render(el.querySelector('.panel-body')); el.scrollTop = st; }
  function closePanel() {
    panel = null; const el = root.querySelector('.panel'); if (el) el.hidden = true;
    root.querySelector('.game').classList.remove('paneling'); setTab(mode === 'map' ? 'map' : null);
  }

  /* ---------- Sentier ---------- */
  function renderMap() {
    const s = K.store.get(), plan = K.rules.plan(s), track = root.querySelector('.map-track');
    const items = [...plan.done.map(d => ({ t: 'done', ...d })), { t: 'me' }, ...plan.upcoming.map((u, i) => ({ t: 'up', i, ...u })), { t: 'end' }];
    const gap = 172, pad = 150, H = pad * 2 + gap * (items.length - 1);
    track.style.height = H + 'px';
    const W = track.clientWidth || 360;
    const pts = items.map((_, i) => ({ x: W / 2 + Math.sin(i * 1.15 + .4) * W * 0.27, y: H - pad - i * gap }));
    let d = `M${pts[0].x} ${pts[0].y + pad}L${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], my = (p.y + q.y) / 2; d += `C${p.x} ${my} ${q.x} ${my} ${q.x} ${q.y}`; }
    const meIdx = items.findIndex(x => x.t === 'me');
    const splitY = pts[meIdx].y;
    let html = `<svg class="trail-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><clipPath id="past"><rect x="0" y="${splitY}" width="${W}" height="${H}"/></clipPath><clipPath id="future"><rect x="0" y="0" width="${W}" height="${splitY}"/></clipPath></defs>
      <path d="${d}" class="trail-bg"/><path d="${d}" class="trail-future" clip-path="url(#future)"/><path d="${d}" class="trail-past" clip-path="url(#past)"/></svg>`;
    items.forEach((it, i) => {
      const { x, y } = pts[i], pos = `style="left:${x}px;top:${y}px"`;
      if (it.t === 'me') html += `<div class="node me" ${pos}>${K.avatar.svg(s.avatar, { walking: true })}<span class="n-label"><b>${ui.esc(s.profile.pseudo)}</b></span></div>`;
      else if (it.t === 'done') html += `<div class="node done" ${pos}><span class="n-circle"><span class="n-e">${bossIcon(it.rule)}</span><i class="check">${ui.icons.check}</i></span><span class="n-label"><b>${ui.esc(it.rule.short)}</b><em>Réussi le ${D.short(it.date)}</em></span></div>`;
      else if (it.t === 'end') html += `<div class="node end" ${pos}><span class="n-circle">…</span><span class="n-label"><em>La suite s’écrit avec toi</em></span></div>`;
      else html += `<button class="node up st-${it.status} ${it.i >= 4 ? 'fog' : ''} ${it.rule.type}" data-id="${it.rule.id}" ${pos}>
          <span class="n-circle"><span class="n-e">${bossIcon(it.rule)}</span></span>
          <span class="n-label"><b>${ui.esc(it.rule.short)}</b><em>${ui.esc(it.label)}</em></span></button>`;
    });
    track.innerHTML = html;
    return pts[meIdx].y;
  }

  function openMap(instant) {
    if (panel) closePanel();
    mode = 'map'; setTab('map');
    const scene = root.querySelector('.scene'), map = root.querySelector('.map');
    map.hidden = false; root.querySelector('.game').classList.add('mapping');
    const meY = renderMap();
    map.scrollTop = Math.max(0, meY - map.clientHeight * 0.68);
    scene.style.transform = '';
    if (!instant) { map.classList.add('enter'); requestAnimationFrame(() => requestAnimationFrame(() => map.classList.remove('enter'))); }
  }
  function closeMap(instant) {
    mode = 'scene'; setTab(null);
    const map = root.querySelector('.map'); root.querySelector('.game').classList.remove('mapping');
    if (instant) { map.hidden = true; return; }
    map.classList.add('leave');
    setTimeout(() => { map.hidden = true; map.classList.remove('leave'); }, 280);
  }

  /* ---------- Gestes : pincer pour dézoomer / zoomer ---------- */
  function pinch(el, onMove, onEnd) {
    const pts = new Map(); let start = 0, ratio = 1;
    const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    el.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { start = dist(); ratio = 1; } });
    el.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && start) { ratio = dist() / start; onMove(ratio); }
    });
    const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (start && pts.size < 2) { onEnd(ratio); start = 0; ratio = 1; } };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, up));
  }

  /* ---------- Héros : son pouvoir toutes les 10 secondes ---------- */
  let powerTimer;
  function startPowers() {
    clearInterval(powerTimer);
    powerTimer = setInterval(() => {
      if (document.hidden || mode !== 'scene' || panel) return;
      const av = root && root.querySelector('.hero .avatar'); if (!av) return;
      av.classList.remove('power'); void av.getBoundingClientRect(); av.classList.add('power');
      const T = K.avatar.TYPES[av.dataset.type], b = root.querySelector('.bubble');
      if (T && b && b.hidden) { b.textContent = T.power; b.hidden = false; clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { b.hidden = true; }, 1600); }
      setTimeout(() => av.classList.remove('power'), 1700);
    }, 10000);
  }

  /* ---------- Héros : double-tape = assistant ---------- */
  let lastTap = 0, bubbleTimer;
  function heroTap() {
    const now = Date.now();
    if (now - lastTap < 400) { lastTap = 0; if (K.assistant) K.assistant.open(); else helpSheet(); return; }
    lastTap = now;
    const b = root.querySelector('.bubble'), s = K.store.get();
    const lines = [`Salut ${s.profile.pseudo} !`, 'On avance ensemble ?', 'Double-tape-moi si quelque chose ne va pas.', 'Tu veux qu’on parle ? Double-tape-moi.', 'Une étape t’attend sur le sentier.'];
    b.textContent = lines[Math.floor(Math.random() * lines.length)]; b.hidden = false;
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { b.hidden = true; }, 2600);
  }
  function helpSheet() {
    ui.sheet(`
      <h2 class="sheet-title">Je t’écoute</h2>
      <p class="muted">Bientôt, je pourrai t’orienter selon ce que tu ressens. En attendant, voici qui peut t’aider tout de suite :</p>
      <div class="help-list">
        <a class="help urgent" href="tel:15"><b>15</b><span>SAMU, urgence médicale</span></a>
        <a class="help urgent" href="tel:112"><b>112</b><span>Urgences, depuis toute l’Europe</span></a>
        <a class="help" href="tel:3114"><b>3114</b><span>Souffrance psychique, idées suicidaires. 24h/24, gratuit</span></a>
        <a class="help" href="tel:0972394050"><b>SOS Amitié</b><span>Écoute anonyme, 24h/24</span></a>
        <a class="help" href="tel:116117"><b>116 117</b><span>Médecin de garde, soirs et week-ends</span></a>
      </div>`);
  }

  /* ---------- Événements ---------- */
  let clickBound = false;
  function bind() {
    const scene = root.querySelector('.scene'), map = root.querySelector('.map');
    if (!clickBound) { clickBound = true; root.addEventListener('click', onClick); }
    pinch(scene, r => { if (r < 1) scene.style.transform = `scale(${Math.max(.6, r)})`; }, r => { scene.style.transform = ''; if (r < 0.85) openMap(); });
    pinch(map, () => {}, r => { if (r > 1.18) closeMap(); });
    scene.addEventListener('wheel', e => { if (e.deltaY > 30) openMap(); }, { passive: true });
  }
  function onClick(e) {
      const a = e.target.closest('[data-a]');
      if (a) {
        const act = a.dataset.a;
        if (act === 'open-map') openMap();
        if (act === 'toggle-map') mode === 'map' ? closeMap() : openMap();
        if (act === 'close-panel') closePanel();
        if (act === 'tab') {
          const t = a.dataset.tab;
          if (t === 'map') { mode === 'map' ? closeMap() : openMap(); }
          else if (panel === t) closePanel(); else openPanel(t);
        }
        if (act === 'close-map') closeMap();
        if (act === 'checkin') K.checkin.open();
        if (act === 'daily-pack') { const i = K.missions.freePackIndex(); if (i >= 0) K.collection.openPack(i); }
        if (act === 'settings') K.settings.open();
        if (act === 'soon') ui.toast(`${a.dataset.what} arrive avec la prochaine mise à jour.`);
        return;
      }
      const node = e.target.closest('.node.up, .teaser'); if (node && node.dataset.id) { K.echeance.open(node.dataset.id); return; }
      if (e.target.closest('.hero')) heroTap();
  }

  document.addEventListener('kardia:change', () => refresh());
  window.addEventListener('resize', () => { if (mode === 'map' && root) renderMap(); });
  document.addEventListener('gesturestart', e => e.preventDefault());

  K.world = { render, refresh, openMap, closeMap, openPanel, closePanel, bossIcon };
})();
