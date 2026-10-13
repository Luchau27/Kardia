/* Les héros de Kardia : des cellules du corps personnifiées, dessinées en vectoriel. */
(function () {
  const TYPES = {
    'globule-blanc': { name: 'Globule blanc', role: 'Le défenseur', power: 'Bouclier immunitaire !', colors: [['#F7F4FF', '#CFC6EE', '#4F7DFF'], ['#FFF6EA', '#E6D2B8', '#E8344E'], ['#EFFFF8', '#BFE5D6', '#16A88F'], ['#FDF0FF', '#E2C6F0', '#B05CFF'], ['#EAF6FF', '#BFD8EE', '#FF9F1C'], ['#3A3A48', '#22222C', '#E8344E']] },
    'globule-rouge': { name: 'Globule rouge', role: 'Le livreur', power: 'Livraison express !', colors: [['#F0435C', '#B01F37', '#FFC94A'], ['#FF6B5E', '#C23F35', '#6FE3FF'], ['#DD2F6B', '#9C1749', '#FFE27A'], ['#FF9F43', '#C96A16', '#4F7DFF'], ['#8E5CFF', '#5E35C9', '#FFD166'], ['#2BC4A8', '#13836E', '#FF6B8A']] },
    'plaquette': { name: 'Plaquette', role: 'La réparatrice', power: 'Réparation éclair !', colors: [['#FFC94A', '#D9931A', '#3D6BFF'], ['#FFD98C', '#E0A545', '#E8344E'], ['#B5EE6A', '#7CBD35', '#7C4DFF'], ['#FF8FB1', '#D35C82', '#2BC4A8'], ['#7FD3FF', '#3E9ACB', '#FFC94A'], ['#C9A7FF', '#8E6AD8', '#FF6B5E']] },
    'neurone': { name: 'Neurone', role: 'Le stratège', power: 'Décharge électrique !', colors: [['#9B7BFF', '#6646D6', '#7CF5FF'], ['#FF8AD6', '#CC4EA4', '#FFF07A'], ['#5CD2FF', '#2A95CC', '#FFB23F'], ['#FFD166', '#D19A1C', '#9B7BFF'], ['#7AF0B4', '#2FB37A', '#FF5FA2'], ['#FF6B6B', '#C23B3B', '#7CF5FF']] },
    'cellule-nk': { name: 'Cellule NK', role: 'La ninja', power: 'Attaque éclair !', colors: [['#343B63', '#1E2340', '#E8344E'], ['#40336A', '#261D44', '#30C9B4'], ['#1F4D4D', '#113232', '#FFB23F'], ['#5A1F2E', '#3A1220', '#FFC94A'], ['#2E2E2E', '#141414', '#7CF5FF'], ['#E7E2F0', '#B8B0C8', '#E8344E']] }
  };
  /* Prix en Pulsations : 3 héros offerts, 2 à débloquer ; la première couleur est offerte. */
  const PRICES = { hero: { 'neurone': 1500, 'cellule-nk': 2500 }, color: [0, 300, 300, 600, 600, 800] };
  const unlocks = () => { const s = K.store.get(); s.unlocks = s.unlocks || { heroes: [], colors: {} }; s.unlocks.colors = s.unlocks.colors || {}; return s.unlocks; };
  const heroPrice = t => PRICES.hero[t] || 0;
  const colorPrice = i => PRICES.color[i] || 0;
  const heroOwned = t => !heroPrice(t) || unlocks().heroes.includes(t);
  const colorOwned = (t, i) => !colorPrice(i) || (unlocks().colors[t] || []).includes(i);
  function buy(kind, t, i) {
    const price = kind === 'hero' ? heroPrice(t) : colorPrice(i), s = K.store.get();
    if (s.wallet.pulsations < price) { K.ui.toast(`Il te manque ${price - s.wallet.pulsations} ${K.config.currency.name}.`); return false; }
    K.store.update(st => {
      st.wallet.pulsations -= price; const u = st.unlocks = st.unlocks || { heroes: [], colors: {} }; u.colors = u.colors || {};
      if (kind === 'hero') u.heroes.push(t); else (u.colors[t] = u.colors[t] || []).push(i);
    });
    return true;
  }
  /* Ce que le joueur utilise déjà reste à lui. */
  function keepCurrent() {
    const av = K.store.get().avatar; if (!av) return;
    if (!heroOwned(av.type) || !colorOwned(av.type, av.color)) K.store.update(st => {
      const u = st.unlocks = st.unlocks || { heroes: [], colors: {} }; u.colors = u.colors || {};
      if (heroPrice(av.type) && !u.heroes.includes(av.type)) u.heroes.push(av.type);
      if (colorPrice(av.color)) { const a = u.colors[av.type] = u.colors[av.type] || []; if (!a.includes(av.color)) a.push(av.color); }
    });
  }

  const ACCESSORIES = { none: 'Aucun', lunettes: 'Lunettes', casquette: 'Casquette', bandeau: 'Bandeau', ecouteurs: 'Écouteurs', couronne: 'Couronne' };
  const LOCKED_MSG = { couronne: 'Se débloque en complétant une catégorie de cartes' };
  const LOCKED = new Proxy(LOCKED_MSG, { get: (t, k) => (k === 'couronne' && K.collection && K.collection.anyCatComplete()) ? undefined : t[k] });
  const INK = '#1B1426';

  function blob(cx, cy, R, fn, n = 56) {
    const pts = [];
    for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; const r = R + fn(t); pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    const f = v => v.toFixed(1); let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      if (i === 0) { const pm = pts[n - 1]; d += `M${f((pm[0] + p[0]) / 2)},${f((pm[1] + p[1]) / 2)}`; }
      d += `Q${f(p[0])},${f(p[1])} ${f(m[0])},${f(m[1])}`;
    }
    return d + 'Z';
  }

  function face(type) {
    const pupil = type === 'globule-rouge' ? '#2A0E14' : INK;
    return `<g class="eyes">
      <ellipse cx="48" cy="62" rx="8.5" ry="9.5" fill="#fff"/><ellipse cx="72" cy="62" rx="8.5" ry="9.5" fill="#fff"/>
      <circle class="pupil" cx="49.5" cy="63.5" r="4.6" fill="${pupil}"/><circle class="pupil" cx="73.5" cy="63.5" r="4.6" fill="${pupil}"/>
      <circle cx="51" cy="61.5" r="1.7" fill="#fff"/><circle cx="75" cy="61.5" r="1.7" fill="#fff"/></g>
      <circle cx="39" cy="75" r="5" fill="#FF7A9A" opacity=".45"/><circle cx="81" cy="75" r="5" fill="#FF7A9A" opacity=".45"/>
      <path d="M53 77Q60 85 67 77" fill="none" stroke="${pupil}" stroke-width="3" stroke-linecap="round"/>`;
  }

  function body(type, c) {
    const [c1, c2, a] = c;
    switch (type) {
      case 'globule-blanc':
        return `<path d="M30 52Q60 40 90 52L101 110Q60 124 19 110Z" fill="${a}"/>
          <path d="${blob(60, 66, 40, t => 3.4 * Math.sin(7 * t) + 1.6 * Math.sin(3 * t + 1))}" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <g fill="${c2}" opacity=".45"><circle cx="78" cy="88" r="6"/><circle cx="68" cy="94" r="5"/><circle cx="86" cy="80" r="4"/></g>`;
      case 'globule-rouge':
        return `<g fill="${a}" opacity=".9"><circle cx="104" cy="44" r="6"/><circle cx="111" cy="31" r="4"/><circle cx="102" cy="22" r="2.6"/></g>
          <ellipse cx="60" cy="68" rx="44" ry="40" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <ellipse cx="60" cy="70" rx="28" ry="23" fill="${c2}" opacity=".35"/>
          <path d="M30 46Q40 34 54 31" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`;
      case 'plaquette':
        return `<path d="${blob(60, 67, 38, t => 6 * Math.sin(3 * t) + 3 * Math.sin(5 * t + .5))}" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <g transform="rotate(-20 86 84)"><rect x="76" y="80" width="20" height="9" rx="3" fill="${a}"/><rect x="83" y="73" width="6" height="22" rx="3" fill="${a}" opacity=".8"/></g>`;
      case 'neurone': {
        let d = ''; const n = 6;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.3;
          const x1 = 60 + 34 * Math.cos(ang), y1 = 66 + 34 * Math.sin(ang);
          const x2 = 60 + 54 * Math.cos(ang), y2 = 66 + 54 * Math.sin(ang);
          const xa = x2 + 9 * Math.cos(ang + .7), ya = y2 + 9 * Math.sin(ang + .7);
          const xb = x2 + 9 * Math.cos(ang - .7), yb = y2 + 9 * Math.sin(ang - .7);
          if (y2 > 100) continue; // pas de branche sous les pieds
          d += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}M${x2.toFixed(1)} ${y2.toFixed(1)}L${xa.toFixed(1)} ${ya.toFixed(1)}M${x2.toFixed(1)} ${y2.toFixed(1)}L${xb.toFixed(1)} ${yb.toFixed(1)}"/>
                <circle class="spark" cx="${xa.toFixed(1)}" cy="${ya.toFixed(1)}" r="3" fill="${a}"/><circle class="spark" cx="${xb.toFixed(1)}" cy="${yb.toFixed(1)}" r="3" fill="${a}"/>`;
        }
        return `<g stroke="${c2}" stroke-width="5" stroke-linecap="round" fill="none">${d}</g>
          <circle cx="60" cy="66" r="37" fill="${c1}" stroke="${c2}" stroke-width="3"/>`;
      }
      case 'cellule-nk':
        return `<circle cx="60" cy="67" r="39" fill="${c1}" stroke="${c2}" stroke-width="3"/>
          <g class="tails"><path d="M95 56Q110 52 116 60Q106 60 98 63Z" fill="${a}"/><path d="M95 62Q108 66 112 76Q102 70 96 68Z" fill="${a}"/></g>
          <path d="M22 54Q60 44 98 54L98 70Q60 62 22 70Z" fill="${a}"/>`;
    }
    return '';
  }

  function accessory(acc, c) {
    const a = c[2];
    switch (acc) {
      case 'lunettes': return `<g fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="2.6"><circle cx="48" cy="62" r="11"/><circle cx="72" cy="62" r="11"/></g><path d="M59 61h2" stroke="${INK}" stroke-width="2.6"/>`;
      case 'casquette': return `<path d="M27 42Q60 6 93 42Z" fill="${a}"/><path d="M60 42Q96 36 110 45Q92 50 60 46Z" fill="${INK}" opacity=".85"/><circle cx="60" cy="20" r="3" fill="${INK}"/>`;
      case 'bandeau': return `<path d="M22 46Q60 26 98 46L98 55Q60 36 22 55Z" fill="${a}"/><path d="M22 50Q60 31 98 50" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`;
      case 'ecouteurs': return `<path d="M24 60Q24 18 60 18Q96 18 96 60" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="15" y="54" width="13" height="20" rx="6" fill="${a}" stroke="${INK}" stroke-width="2"/><rect x="92" y="54" width="13" height="20" rx="6" fill="${a}" stroke="${INK}" stroke-width="2"/>`;
      case 'couronne': return `<path d="M38 36L42 16 52 28 60 12 68 28 78 16 82 36Z" fill="#FFC94A" stroke="#C98A12" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="27" r="3" fill="#E8344E"/>`;
    }
    return '';
  }

  function svg(av, opts = {}) {
    av = av || { type: 'globule-blanc', color: 0, acc: 'none' };
    const T = TYPES[av.type] || TYPES['globule-blanc'];
    const c = T.colors[av.color] || T.colors[0];
    const cls = ['avatar', opts.walking ? 'walking' : '', opts.cls || ''].join(' ');
    return `<svg class="${cls}" data-type="${av.type}" viewBox="0 0 120 128" role="img" aria-label="${T.name}">
      <ellipse cx="60" cy="122" rx="30" ry="5" fill="#000" opacity=".22" class="shadow"/>
      <g class="leg leg-l"><ellipse cx="47" cy="111" rx="8" ry="10" fill="${c[1]}"/></g>
      <g class="leg leg-r"><ellipse cx="73" cy="111" rx="8" ry="10" fill="${c[1]}"/></g>
      <g class="bob">${body(av.type, c)}${face(av.type)}${accessory(av.acc, c)}</g>
    </svg>`;
  }

  K.avatar = { TYPES, ACCESSORIES, LOCKED, svg, heroPrice, colorPrice, heroOwned, colorOwned, buy, keepCurrent };
})();
