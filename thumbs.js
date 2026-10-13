/* Miniatures : les grandes images (cartes, packs) sont réduites une seule fois, une par une,
   puis gardées sur le téléphone. La collection affiche ces miniatures : beaucoup moins de mémoire,
   ce qui évite que le téléphone ferme l'appli. */
(function () {
  const W = 360, DB = 'kardia-thumbs', ST = 'thumbs';
  const mem = new Map();
  let chain = Promise.resolve();

  function db() {
    return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  async function idbGet(k) { try { const d = await db(); return await new Promise(res => { const q = d.transaction(ST).objectStore(ST).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } }
  async function idbPut(k, v) { try { const d = await db(); d.transaction(ST, 'readwrite').objectStore(ST).put(v, k); } catch (e) {} }

  async function make(url) {
    const img = new Image(); img.decoding = 'async'; img.src = url;
    await img.decode();
    const w = Math.min(W, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    img.src = '';
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    c.width = c.height = 0;
    return blob;
  }
  /* Renvoie l'adresse d'une miniature (fabriquée si besoin, une image à la fois). */
  function get(url) {
    if (mem.has(url)) return mem.get(url);
    const p = chain = chain.then(async () => {
      let blob = await idbGet(url);
      if (!blob) { try { blob = await make(url); if (blob) idbPut(url, blob); } catch (e) { return url; } }
      return blob ? URL.createObjectURL(blob) : url;
    });
    mem.set(url, p);
    return p;
  }

  /* Les images marquées data-thumb reçoivent leur miniature quand elles arrivent à l'écran. */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return; const img = e.target; io.unobserve(img);
    get(img.dataset.thumb).then(src => { img.src = src; img.classList.add('ready'); });
  }), { rootMargin: '300px' }) : null;
  function scan(root) {
    (root || document).querySelectorAll('img[data-thumb]:not([data-seen])').forEach(img => {
      img.dataset.seen = '1';
      if (io) io.observe(img); else get(img.dataset.thumb).then(src => { img.src = src; });
    });
  }
  new MutationObserver(() => scan()).observe(document.body, { childList: true, subtree: true });

  K.thumbs = { get, scan };
})();
