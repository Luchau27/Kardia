/* Infos médicales facultatives : elles servent à dire si un don est possible pour toi en ce moment.
   Elles restent uniquement sur ce téléphone. Les règles exactes sont toujours vérifiées lors de l'entretien avant le don. */
(function () {
  const ui = K.ui;
  const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const med = () => (K.store.get().profile || {}).med || {};
  const filled = () => Object.keys(med()).length > 0;

  function open(after) {
    const m = med(), p = K.store.get().profile || {}, fem = p.sex === 'F' || p.sex === 'N';
    const seg = (name, list, val) => `<div class="seg" data-name="${name}">${list.map(([v, l]) => `<button type="button" data-v="${v}" class="${val === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const yn = [['non', 'Non'], ['oui', 'Oui']];
    const body = ui.sheet(`
      <h2 class="sheet-title">Mes infos médicales</h2>
      <p class="muted">Facultatif. Ça permet de savoir si un don est possible pour toi en ce moment. Rien ne quitte ton téléphone.</p>
      <h3 class="q">Groupe sanguin</h3>${seg('blood', GROUPS.map(g => [g, g]).concat([['nsp', 'Je ne sais pas']]), m.blood)}
      <h3 class="q">Tu pèses au moins 50 kg ?</h3>${seg('weight', [['oui', 'Oui'], ['non', 'Non']], m.weight)}
      ${fem ? `<h3 class="q">Enceinte, ou accouchement il y a moins de 6 mois ?</h3>${seg('preg', yn, m.preg)}` : ''}
      <h3 class="q">Tatouage ou piercing il y a moins de 4 mois ?</h3>${seg('tattoo', yn, m.tattoo)}
      <h3 class="q">Un traitement médical en cours ?</h3>${seg('treat', yn, m.treat)}
      <h3 class="q">Allergies connues</h3>
      <textarea class="field" rows="2" name="allergies" placeholder="Par exemple : pénicilline, arachide…">${ui.esc(m.allergies || '')}</textarea>
      <button class="btn primary wide" data-m="save">Enregistrer</button>`);
    body.onclick = e => {
      const b = e.target.closest('.seg button');
      if (b) { b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); return; }
      if (!e.target.closest('[data-m=save]')) return;
      const val = n => { const on = body.querySelector(`.seg[data-name="${n}"] .on`); return on ? on.dataset.v : undefined; };
      const next = { blood: val('blood'), weight: val('weight'), preg: val('preg'), tattoo: val('tattoo'), treat: val('treat'), allergies: body.querySelector('[name=allergies]').value.trim().slice(0, 200) };
      Object.keys(next).forEach(k => { if (!next[k]) delete next[k]; });
      K.store.update(s => { s.profile.med = next; });
      ui.close(); ui.toast('Infos médicales enregistrées.');
      if (after) setTimeout(after, 300);
    };
  }

  /* Pour un niveau bonus de don : peut-on donner maintenant ? */
  function donCheck(id) {
    const m = med(), blocks = [], notes = [];
    if (['sang', 'plasma', 'plaquettes'].includes(id)) {
      if (m.weight === 'non') blocks.push('Le don demande de peser au moins 50 kg.');
      if (m.preg === 'oui') blocks.push('Pendant une grossesse, le don n’est pas possible. Il redevient possible 6 mois après l’accouchement.');
      if (m.tattoo === 'oui') blocks.push('Après un tatouage ou un piercing, il faut attendre 4 mois avant de donner.');
      if (m.treat === 'oui') notes.push('Signale ton traitement lors de l’entretien avant le don : le médecin te dira si c’est compatible.');
    }
    if (id === 'sang' && m.blood === 'O-') notes.push('Ton groupe O- est donneur universel de globules rouges : ton don peut aider n’importe qui.');
    if (id === 'sang' && m.blood && m.blood.endsWith('-') && m.blood !== 'O-') notes.push('Les groupes rhésus négatif sont plus rares : ton don est particulièrement recherché.');
    if (id === 'plasma' && (m.blood === 'AB+' || m.blood === 'AB-')) notes.push('Ton plasma de groupe AB est compatible avec tous les patients : il est très recherché.');
    return { ok: !blocks.length, blocks, notes };
  }

  K.med = { open, donCheck, filled, get: med };
})();
