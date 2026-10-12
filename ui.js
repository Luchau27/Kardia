/* Petits outils d'interface : fenêtres du bas, messages, récompenses, icônes. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  function h(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  const HEART = 'M50 86C22 66 8 49 11 31 14 15 33 9 50 25 67 9 86 15 89 31 92 49 78 66 50 86Z';
  function logo(size = 64) {
    return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="${HEART}" fill="#E8344E" transform="rotate(-16 50 50)"/></svg>`;
  }
  const icons = {
    puls: `<svg class="ico-puls" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5 16.2 2 12.6 2.6 8.6 3.2 5 7.4 3.6 12 7.6 16.6 3.6 20.8 5 21.4 8.6 22 12.6 19 16.2 12 21Z" fill="#E8344E"/><path d="M5 11.5h4l1.5-3 2.5 6 1.6-3H19" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    shop: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    missions: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>`,
    bonus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7L12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    cards: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3.5" width="12" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 7v11.5a2 2 0 0 0 2 2H15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    rank: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20v-6h4v6M10 20V9h4v11M15 20v-8h4v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    map: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20c0-4 12-3 12-8S8 9 8 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.2"/><circle cx="8" cy="4" r="2" fill="currentColor"/><circle cx="6" cy="20" r="2" fill="currentColor"/></svg>`,
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function sheet(html, opts = {}) {
    const root = $('#sheet-root'); root.innerHTML = '';
    const wrap = h(`<div class="sheet-wrap"><div class="sheet-backdrop"></div><div class="sheet ${opts.cls || ''}" role="dialog" aria-modal="true"><div class="sheet-grip"></div><div class="sheet-body">${html}</div></div></div>`);
    root.appendChild(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    if (!opts.locked) wrap.querySelector('.sheet-backdrop').addEventListener('click', close);
    return wrap.querySelector('.sheet-body');
  }
  function close() {
    const w = $('#sheet-root .sheet-wrap.open'); if (!w) return;
    w.classList.remove('open'); setTimeout(() => w.remove(), 260);
  }

  function reward({ title, amount, sub }) {
    const cur = K.config.currency.name;
    const o = h(`<div class="reward" role="dialog" aria-modal="true">
      <div class="reward-rays"></div>
      <div class="reward-card">
        <div class="reward-heart">${logo(84)}</div>
        <h2>${esc(title)}</h2>
        <div class="reward-amount">${icons.puls}<span>+${amount}</span> ${esc(cur)}</div>
        ${sub ? `<p>${esc(sub)}</p>` : ''}
        <button class="btn primary wide">Continuer</button>
      </div></div>`);
    document.body.appendChild(o);
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
    o.querySelector('button').onclick = () => { o.classList.add('out'); setTimeout(() => o.remove(), 300); };
  }

  function confirmBox(text, okLabel = 'Confirmer') {
    return new Promise(res => {
      const b = sheet(`<h2 class="sheet-title">${esc(text)}</h2><div class="row-btns"><button class="btn ghost" data-a="no">Annuler</button><button class="btn danger" data-a="yes">${esc(okLabel)}</button></div>`);
      b.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; close(); res(a.dataset.a === 'yes'); });
    });
  }

  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  K.ui = { $, h, esc, logo, icons, toast, sheet, close, reward, confirmBox, slug };
})();
