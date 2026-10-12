/* Météo intérieure du jour + sommeil + activité : alimentent les 3 barres et le ciel du monde. */
(function () {
  const D = K.dates;
  const MOODS = [
    { v: 5, e: '☀️', l: 'Radieux' }, { v: 4, e: '🌤️', l: 'Bien' }, { v: 3, e: '⛅', l: 'Bof' },
    { v: 2, e: '🌧️', l: 'Pas top' }, { v: 1, e: '⛈️', l: 'Difficile' }
  ];
  const SLEEP = [{ v: 100, l: 'Très bien' }, { v: 75, l: 'Bien' }, { v: 50, l: 'Moyen' }, { v: 25, l: 'Mal' }];
  const ACT = [{ v: 100, l: 'Du sport' }, { v: 80, l: '30 min et +' }, { v: 50, l: 'Un peu' }, { v: 20, l: 'Pas du tout' }];

  function lastDays(n) {
    const s = K.store.get(), out = [];
    for (let i = 0; i < n; i++) { const d = D.iso(D.addDays(D.today(), -i)); if (s.checkins[d]) out.push(s.checkins[d]); }
    return out;
  }
  const avg = (arr, k, def) => { const v = arr.map(x => x[k]).filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : def; };

  function bars() {
    const d3 = lastDays(3), d7 = lastDays(7);
    return {
      sleep: Math.round(avg(d3, 'sleep', 60)),
      activity: Math.round(avg(d3, 'act', 50)),
      heart: Math.round((avg(d7, 'mood', 3.6) - 1) / 4 * 80 + 20)
    };
  }
  function mood() { const t = K.store.get().checkins[D.todayISO()]; if (t) return t.mood; const r = lastDays(3)[0]; return r ? r.mood : 4; }
  function doneToday() { return !!K.store.get().checkins[D.todayISO()]; }

  function open() {
    const cur = K.store.get().checkins[D.todayISO()] || {};
    const seg = (name, arr, val, fmt) => `<div class="seg" data-name="${name}">${arr.map(o => `<button type="button" class="${o.v === val ? 'on' : ''}" data-v="${o.v}">${fmt(o)}</button>`).join('')}</div>`;
    const body = K.ui.sheet(`
      <h2 class="sheet-title">Ta météo intérieure</h2>
      <p class="muted">Comment tu te sens aujourd’hui, dans ta tête et dans ton corps ?</p>
      ${seg('mood', MOODS, cur.mood, o => `<span class="big-emoji">${o.e}</span><small>${o.l}</small>`)}
      <h3 class="q">Cette nuit, tu as dormi…</h3>
      ${seg('sleep', SLEEP, cur.sleep, o => o.l)}
      <h3 class="q">Hier, tu as bougé…</h3>
      ${seg('act', ACT, cur.act, o => o.l)}
      <button class="btn primary wide" data-save>Enregistrer</button>`);
    body.addEventListener('click', e => {
      const b = e.target.closest('.seg button');
      if (b) { b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); return; }
      if (e.target.closest('[data-save]')) {
        const val = n => { const on = body.querySelector(`.seg[data-name="${n}"] .on`); return on ? Number(on.dataset.v) : undefined; };
        const entry = { mood: val('mood'), sleep: val('sleep'), act: val('act') };
        if (!entry.mood) { K.ui.toast('Choisis au moins ta météo du jour.'); return; }
        K.store.update(s => { s.checkins[D.todayISO()] = entry; });
        K.ui.close();
        if (entry.mood <= 2) setTimeout(() => K.ui.toast('Journée difficile ? Double-tape sur ton héros, il est là pour t’orienter.'), 400);
      }
    });
  }

  K.checkin = { open, bars, mood, doneToday, MOODS };
})();
