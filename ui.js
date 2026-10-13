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
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5Z" fill="currentColor"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2L5 13.5h6L10 22l9-12.5h-6.2L13.5 2Z" fill="currentColor"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5 16.2 2 12.6 2.6 8.6 3.2 5 7.4 3.6 12 7.6 16.6 3.6 20.8 5 21.4 8.6 22 12.6 19 16.2 12 21Z" fill="currentColor"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`,
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  /* Icônes des niveaux bonus (remplacées par visuels/bonus-xxx.png si présent). */
  const B = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${d}</svg>`;
  const bonusIcons = {
    sang: B('<path d="M12 3c3.5 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.5 6-11Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>'),
    plasma: B('<path d="M12 3c3.5 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.5 6-11Z"/><path d="M8 14.5c1.3 1 2.7 1 4 0s2.7-1 4 0"/>'),
    plaquettes: B('<circle cx="8" cy="9" r="3.2"/><circle cx="16" cy="9" r="3.2"/><circle cx="12" cy="16" r="3.2"/>'),
    moelle: B('<path d="M12 21v-8"/><path d="M12 13c0-4.5 3-7 7.5-7 0 4.5-3 7-7.5 7Z"/><path d="M12 15.5c0-3.5-2.2-5.5-6-5.5 0 3.5 2.2 5.5 6 5.5Z"/>'),
    secours: B('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M12 8.5v7M8.5 12h7"/>'),
    organes: B('<path d="M4 5h16v11H10l-6 4V5Z"/><path d="M12 13.6c-2-1.4-3-2.4-3-3.6a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.2-1 2.2-3 3.6Z"/>'),
    duo: B('<circle cx="9" cy="8.5" r="3"/><circle cx="15.5" cy="8.5" r="3"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M15.5 14.5c3 0 5.5 2.2 5.5 5.5"/>'),
    ambassadeur: B('<path d="M4 10v4h3l7 4V6l-7 4H4Z"/><path d="M17.5 9.5c1.2 1.2 1.2 3.8 0 5"/><path d="M20 7.5c2.3 2.5 2.3 6.5 0 9"/>')
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function sheet(html, opts = {}) {
    const root = $('#sheet-root'); root.innerHTML = '';
    const wrap = h(`<div class="sheet-wrap"><div class="sheet-backdrop"></div><div class="sheet ${opts.cls || ''}" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${opts.locked ? '' : '<button class="sheet-x" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>'}<div class="sheet-body">${html}</div></div></div>`);
    root.appendChild(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    if (!opts.locked) {
      wrap.querySelector('.sheet-backdrop').addEventListener('click', close);
      wrap.querySelector('.sheet-x').addEventListener('click', close);
      swipeToClose(wrap.querySelector('.sheet'));
    }
    return wrap.querySelector('.sheet-body');
  }
  /* Glisser la fenêtre vers le bas pour la fermer (quand elle est tout en haut de son contenu). */
  function swipeToClose(sh) {
    let y0 = null, dy = 0;
    sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; } else y0 = null; }, { passive: true });
    sh.addEventListener('touchmove', e => {
      if (y0 === null) return; dy = e.touches[0].clientY - y0;
      if (dy > 0 && sh.scrollTop <= 0) { e.preventDefault(); sh.style.transform = `translateY(${dy}px)`; } else if (dy < 0) { y0 = null; sh.style.transform = ''; sh.style.transition = ''; }
    }, { passive: false });
    sh.addEventListener('touchend', () => {
      if (y0 === null) return; y0 = null; sh.style.transition = '';
      if (dy > 90) { sh.style.transform = ''; close(); } else sh.style.transform = '';
    });
  }

  function close() {
    const w = $('#sheet-root .sheet-wrap.open'); if (!w) return;
    w.classList.remove('open'); setTimeout(() => w.remove(), 260);
  }

  function reward({ title, amount, sub, extra }) {
    const cur = K.config.currency.name;
    const o = h(`<div class="reward" role="dialog" aria-modal="true">
      <div class="reward-rays"></div>
      <div class="reward-card">
        <div class="reward-heart">${logo(84)}</div>
        <h2>${esc(title)}</h2>
        ${amount ? `<div class="reward-amount">${icons.puls}<span>+${amount}</span> ${esc(cur)}</div>` : ''}
        ${extra ? `<p class="reward-extra">${esc(extra)}</p>` : ''}${sub ? `<p>${esc(sub)}</p>` : ''}
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

  K.ui = { $, h, esc, logo, icons, bonusIcons, toast, sheet, close, reward, confirmBox, slug };
})();
