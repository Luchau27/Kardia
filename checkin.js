/* Météo intérieure du jour + sommeil + activité : alimentent les 3 barres et le ciel du monde. */
(function () {
  const D = K.dates;
  const W = d => `<svg class="wx" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const SUN = '<circle cx="16" cy="16" r="5.5" fill="currentColor"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/>';
  const CLOUD = '<path d="M9 24h14a5 5 0 0 0 .5-10 7 7 0 0 0-13.4 1.6A4.3 4.3 0 0 0 9 24Z"/>';
  const MOODS = [
    { v: 5, e: W(SUN), l: 'Radieux' },
    { v: 4, e: W('<circle cx="12" cy="11" r="4.5" fill="currentColor"/><path d="M12 2.5v2M4.5 11h-2M6.3 5.3l1.4 1.4M17.7 5.3l-1.4 1.4"/><path d="M12 27h11a4.5 4.5 0 0 0 .4-9 6 6 0 0 0-11.4 1.4A3.8 3.8 0 0 0 12 27Z" fill="var(--nuit-2)"/>'), l: 'Bien' },
    { v: 3, e: W(CLOUD), l: 'Bof' },
    { v: 2, e: W('<path d="M9 19h14a5 5 0 0 0 .5-10 7 7 0 0 0-13.4 1.6A4.3 4.3 0 0 0 9 19Z"/><path d="M11 23l-1.5 4M17 23l-1.5 4M23 23l-1.5 4"/>'), l: 'Pas top' },
    { v: 1, e: W('<path d="M9 18h14a5 5 0 0 0 .5-10 7 7 0 0 0-13.4 1.6A4.3 4.3 0 0 0 9 18Z"/><path d="M17 20l-3.5 5h4l-3 5" stroke-width="2.4"/>'), l: 'Difficile' }
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
