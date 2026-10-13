/* Visuels personnalisés.
   Sur GitHub Pages, l'appli lit la liste des fichiers du dépôt (une fois toutes les 10 minutes au plus)
   et reconnaît toute seule les images, quel que soit le dossier :
   - visuels nommés : decor.png, verso.png, heros-neurone.png, pack-boss.png, bonus-sang.png, boss-dentiste.png…
   - cartes : n'importe quel nom contenant le code de la carte (ORG-01, OS-10, MUS-05…).
       « … ORG-01 … .png »      → rareté 1 de la carte (Commune)
       « … ORG-01 … (1).png »   → rareté 2 (Rare)
       « … ORG-01 … (2).png »   → rareté 3 (Épique)
       « … ORG-01 … (3).png »   → rareté 4 (Légendaire)
     Si la carte n'existe pas dans toutes les raretés, les numéros suivent ses raretés dans l'ordre.
     Un nom contenant « dos » = dos de la carte ; « full » = Full Art ; « limit » = édition limitée. */
(function () {
  const KEY = 'kardia.visuels.v2', TTL = 10 * 60 * 1000;
  const NAMES = [
    'decor', 'verso',
    'heros-globule-blanc', 'heros-globule-rouge', 'heros-plaquette', 'heros-neurone', 'heros-cellule-nk',
    'pack-gratuit', 'pack-standard', 'pack-categorie', 'pack-premium', 'pack-boss', 'pack-cadeau',
    'bonus-sang', 'bonus-plasma', 'bonus-plaquettes', 'bonus-moelle', 'bonus-secours', 'bonus-organes', 'bonus-duo', 'bonus-ambassadeur'
  ].concat(K.rules.RULES.map(r => 'boss-' + r.id));
  const ALIAS = { 'pack-du-jour': 'pack-gratuit', 'pack-jour': 'pack-gratuit', 'globule-blanc': 'heros-globule-blanc', 'globule-rouge': 'heros-globule-rouge', 'cellule-nk': 'heros-cellule-nk' };
  const CODE = /(?:^|[^a-z])(org|os|mus|cel|enn|met)[\s_-]?(\d{1,2})(?!\d)/i;
  const IMG = /\.(png|jpe?g|webp)$/i;

  let st;
  try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
  st.named = st.named || {}; st.cards = st.cards || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const encPath = p => p.split('/').map(encodeURIComponent).join('/');

  const has = n => !!st.named[n];
  const url = n => st.named[n] || ('visuels/' + n + '.png');
  const cardImg = (id, slot) => (st.cards[id] || {})[slot] || null;

  function repo() {
    if (K.config.githubRepo) return K.config.githubRepo;
    const h = location.hostname; if (!h.endsWith('.github.io')) return null;
    const owner = h.split('.')[0], seg = location.pathname.split('/').filter(Boolean)[0];
    return seg && !seg.includes('.') ? `${owner}/${seg}` : `${owner}/${owner}.github.io`;
  }

  function parse(paths, shas) {
    shas = shas || {};
    const enc = p => encPath(p) + (shas[p] ? '?v=' + shas[p].slice(0, 8) : '');
    const named = {}, cards = {}, byId = Object.fromEntries(K.CARDS.map(c => [c.id, c]));
    paths.filter(p => IMG.test(p)).forEach(p => {
      const base = p.split('/').pop(), m = base.match(CODE);
      if (!m) {
        /* Nom souple : « Pack Standard.png », « kardia_pack-standard (1).png », « Pack catégorie.jpg »… */
        const norm = '-' + base.replace(IMG, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-';
        const hit = NAMES.find(n => norm.includes('-' + n + '-')) || Object.keys(ALIAS).find(a => norm.includes('-' + a + '-'));
        const name = ALIAS[hit] || hit;
        if (name && (!named[name] || p.startsWith('visuels/'))) named[name] = enc(p);
        return;
      }
      const id = m[1].toLowerCase() + '-' + m[2].padStart(2, '0'), card = byId[id]; if (!card) return;
      const low = base.toLowerCase(); let slot;
      if (/(^|[^a-z])(dos|verso)([^a-z]|$)/.test(low)) slot = 'dos';
      else if (/full/.test(low)) slot = 'f';
      else if (/limit/.test(low)) slot = 'l';
      else { const n = (base.match(/\((\d+)\)\s*\.[a-z]+$/i) || [])[1]; slot = card.r[n ? Number(n) : 0]; if (!slot) return; }
      const e = cards[id] || (cards[id] = {});
      if (!e[slot]) e[slot] = enc(p);
    });
    return { named, cards };
  }

  function load(src) {
    return new Promise(res => { const i = new Image(); const t = setTimeout(() => res(false), 6000); i.onload = () => { clearTimeout(t); res(true); }; i.onerror = () => { clearTimeout(t); res(false); }; i.src = src; });
  }

  /* Renvoie true si de nouvelles images sont apparues (l'écran est alors redessiné). */
  let seq = 0;
  async function check(force) {
    if (!navigator.onLine) return false;
    if (!force && st.at && Date.now() - st.at < TTL) return false;
    const my = ++seq;
    const before = JSON.stringify([st.named, st.cards]);
    const r = repo();
    try {
      if (!r) throw new Error('no-repo');
      let data = null;
      for (const ref of ['main', 'master']) {
        const res = await fetch(`https://api.github.com/repos/${r}/git/trees/${ref}?recursive=1`, { cache: 'no-store' });
        if (res.ok) { data = await res.json(); break; }
        if (res.status === 403 || res.status === 429) throw new Error('limite');
      }
      if (!data) throw new Error('api');
      const blobs = (data.tree || []).filter(x => x.type === 'blob');
      const parsed = parse(blobs.map(x => x.path), Object.fromEntries(blobs.map(x => [x.path, x.sha || ''])));
      if (my !== seq) return false; /* une vérification plus récente a pris le relais */
      st.named = parsed.named; st.cards = parsed.cards;
    } catch (e) {
      /* Hors GitHub (ou limite de l'API atteinte) : on teste les noms simples dans « visuels » et « cartes ». */
      if (r && Object.keys(st.cards).length) { st.at = Date.now(); save(); return false; }
      const named = {};
      await Promise.all(NAMES.map(async n => { for (const d of ['visuels/', 'cartes/']) if (await load(d + n + '.png')) { named[n] = d + n + '.png'; return; } }));
      if (my !== seq) return false;
      st.named = named;
    }
    st.at = Date.now(); save();
    return before !== JSON.stringify([st.named, st.cards]);
  }

  K.vis = { has, url, cardImg, check, parse, NAMES };
})();
