/* Données : tout reste sur le téléphone (localStorage + IndexedDB pour les photos de preuve). */
(function () {
  const KEY = 'kardia.state.v1';
  const DB = 'kardia-proofs', ST = 'proofs';
  const fresh = () => ({
    version: 1, profile: null, avatar: null, echeances: {}, checkins: {},
    wallet: { pulsations: 0 }, history: [], createdAt: new Date().toISOString(),
    collection: {}, packs: [], daily: {}, stats: { quizCorrect: 0, packsOpened: 0 }, objClaimed: {}, redeemed: [], quizSeen: []
  });
  let state = null;

  function load() {
    try { const raw = localStorage.getItem(KEY); state = raw ? Object.assign(fresh(), JSON.parse(raw)) : fresh(); }
    catch (e) { state = fresh(); }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { if (K.ui) K.ui.toast('Enregistrement impossible : la mémoire du téléphone est pleine.'); }
  }
  function get() { return state || load(); }
  function update(fn) { fn(get()); save(); document.dispatchEvent(new CustomEvent('kardia:change')); }
  function rec(id) { const s = get(); return s.echeances[id] || (s.echeances[id] = {}); }
  function reset() { localStorage.removeItem(KEY); state = fresh(); try { indexedDB.deleteDatabase(DB); } catch (e) {} }
  function exportJSON() { return JSON.stringify(get(), null, 2); }
  function importJSON(txt) {
    const d = JSON.parse(txt);
    if (!d || typeof d !== 'object' || !d.wallet || !('profile' in d)) throw new Error('Ce fichier n’est pas une sauvegarde Kardia.');
    state = Object.assign(fresh(), d); save();
  }

  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  async function putProof(id, blob) {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction(ST, 'readwrite'); tx.objectStore(ST).put(blob, id);
      tx.oncomplete = () => res(id); tx.onerror = () => rej(tx.error);
    });
  }
  async function getProof(id) {
    const d = await db();
    return new Promise((res, rej) => {
      const r = d.transaction(ST, 'readonly').objectStore(ST).get(id);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  K.store = { load, save, get, update, rec, reset, exportJSON, importJSON, putProof, getProof };
})();
