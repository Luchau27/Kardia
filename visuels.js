/* Visuels personnalisés : si une image existe dans le dossier « visuels » du dépôt, elle remplace le dessin par défaut. */
(function () {
  const DIR = 'visuels/', KEY = 'kardia.visuels.v1';
  const NAMES = [
    'decor', 'verso',
    'heros-globule-blanc', 'heros-globule-rouge', 'heros-plaquette', 'heros-neurone', 'heros-cellule-nk',
    'pack-gratuit', 'pack-standard', 'pack-categorie', 'pack-premium', 'pack-boss',
    'bonus-sang', 'bonus-plasma', 'bonus-plaquettes', 'bonus-moelle', 'bonus-secours', 'bonus-organes', 'bonus-duo', 'bonus-ambassadeur'
  ].concat(K.rules.RULES.map(r => 'boss-' + r.id));
  let known = {};
  try { known = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { known = {}; }

  /* Les images peuvent être dans « visuels » ou dans « cartes » : l'appli cherche dans les deux. */
  const DIRS = [DIR, 'cartes/'];
  const url = n => (typeof known[n] === 'string' ? known[n] : DIR) + n + '.png';
  const has = n => !!known[n];
  function load(src) {
    return new Promise(res => { const i = new Image(); const t = setTimeout(() => res(false), 6000); i.onload = () => { clearTimeout(t); res(true); }; i.onerror = () => { clearTimeout(t); res(false); }; i.src = src + '?v=' + Date.now().toString(36).slice(0, -3); });
  }
  async function probe(n) { for (const d of DIRS) if (await load(d + n + '.png')) return d; return false; }
  /* Vérifie en arrière-plan quelles images existent ; si ça change, l'écran est redessiné. */
  async function check() {
    if (!navigator.onLine) return false;
    const res = await Promise.all(NAMES.map(probe)), next = {};
    NAMES.forEach((n, i) => { if (res[i]) next[n] = res[i]; });
    const changed = JSON.stringify(next) !== JSON.stringify(known);
    known = next; try { localStorage.setItem(KEY, JSON.stringify(known)); } catch (e) {}
    return changed;
  }
  K.vis = { has, url, check, NAMES };
})();
