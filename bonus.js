/* Niveaux bonus : dons et gestes solidaires, chacun avec des paliers (niveau 1, 2, 3…). */
(function () {
  const ui = K.ui, D = K.dates;
  const EFS = 'https://dondesang.efs.sante.fr';
  const WORLDS = [
    { id: 'sang', icon: '🩸', name: 'Don du sang', don: true, age: [18, 70], tiers: [1, 2, 5, 10, 20], action: 'J’ai fait un don de sang', proof: true,
      info: 'De 18 à 70 ans. Compte au moins 8 semaines entre deux dons de sang. Le prélèvement dure environ 10 minutes, mange bien avant d’y aller.', link: EFS, linkLabel: 'Trouver une collecte',
      why: 'Il faut environ 10 000 dons par jour en France pour soigner les malades et les blessés. Les globules rouges ne se conservent que 42 jours : rien ne remplace un don régulier. Un seul don peut aider plusieurs patients.' },
    { id: 'plasma', icon: '🟡', name: 'Don de plasma', don: true, age: [18, 65], tiers: [1, 3, 6, 12], action: 'J’ai fait un don de plasma', proof: true,
      info: 'Le plasma sert à soigner et à fabriquer des médicaments. Le don se fait sur rendez-vous, dans une maison du don.', link: EFS, linkLabel: 'Prendre rendez-vous',
      why: 'Le plasma sert à fabriquer des médicaments vitaux pour des personnes atteintes de maladies rares ou de déficits immunitaires. La France doit en importer une grande partie : chaque don compte.' },
    { id: 'plaquettes', icon: '🧡', name: 'Don de plaquettes', don: true, age: [18, 65], tiers: [1, 3, 6], action: 'J’ai fait un don de plaquettes', proof: true,
      info: 'Les plaquettes aident notamment les personnes soignées pour un cancer. Le don se fait sur rendez-vous, dans une maison du don.', link: EFS, linkLabel: 'Prendre rendez-vous',
      why: 'Les plaquettes ne se conservent que 7 jours. Les personnes atteintes de leucémie ou en chimiothérapie en ont besoin en permanence : les stocks doivent être renouvelés sans arrêt.' },
    { id: 'moelle', icon: '🌱', name: 'Registre moelle osseuse', don: true, age: [18, 35], tiers: [1], rew: [{ p: 1000, pack: 'boss' }], action: 'Je me suis inscrit·e au registre', proof: true,
      info: 'L’inscription est ouverte de 18 à 35 ans, et tu restes inscrit·e jusqu’à 60 ans. Un donneur compatible peut sauver la vie d’un malade de leucémie.', link: 'https://www.dondemoelleosseuse.fr', linkLabel: 'S’inscrire',
      why: 'Pour environ 3 malades sur 4, aucun donneur compatible n’existe dans la famille : leur espoir repose sur des inconnus inscrits au registre. Le plus souvent, le don se fait par une simple prise de sang.' },
    { id: 'secours', icon: '⛑️', name: 'Premiers secours', tiers: [1, 2], steps: ['Suivre une formation aux premiers secours (PSC1)', 'Devenir citoyen sauveteur (appli SAUV Life ou Staying Alive)'], proofs: [true, false],
      info: 'La formation PSC1 dure environ une journée et apprend les gestes qui sauvent. Les applis de citoyens sauveteurs t’alertent si quelqu’un fait un arrêt cardiaque près de toi.',
      why: 'Chaque année en France, des dizaines de milliers de personnes font un arrêt cardiaque hors de l’hôpital. Chaque minute sans massage cardiaque fait chuter les chances de survie : le premier témoin peut tout changer.' },
    { id: 'organes', icon: '💬', name: 'Don d’organes', tiers: [1], rew: [{ p: 600, pack: 'premium' }], steps: ['Dire à tes proches ta position sur le don d’organes'], proofs: [false],
      info: 'En France, chacun est donneur présumé, sauf inscription au registre des refus. Le plus important : que tes proches connaissent ta position, quelle qu’elle soit.',
      why: 'Plus de 20 000 personnes ont besoin d’une greffe chaque année en France. Dans un moment très difficile, savoir ce que tu voulais aide tes proches à respecter ton choix.' },
    { id: 'duo', icon: '🤝', name: 'Duo santé', tiers: [1, 3, 5], action: 'J’ai accompagné un ami à un rendez-vous santé', proof: true, invite: true,
      info: 'Un dépistage, un vaccin, un don : c’est plus facile à deux. Invite un ami, accompagne-le, et prenez une photo ensemble.',
      why: 'Un rendez-vous santé qu’on repousse, c’est souvent juste un rendez-vous qu’on n’a pas envie de faire seul. Être accompagné rassure et aide à passer le cap.' },
    { id: 'ambassadeur', icon: '📣', name: 'Ambassadeur', tiers: [1, 3, 5], auto: () => (K.store.get().friends || []).length, invite: true,
      info: 'Fais découvrir Kardia à tes amis et ajoute-les dans le classement grâce à leur code ami. Chaque ami ajouté compte.',
      why: 'Le meilleur rappel santé vient souvent d’un proche. À plusieurs, on se motive, et on ose plus facilement prendre rendez-vous.' }
  ];
  const LEVEL_REWARDS = [{ p: 500, pack: 'standard' }, { p: 800, pack: 'premium' }, { p: 1200, pack: 'premium' }, { p: 1500, pack: 'boss' }, { p: 2000, pack: 'boss' }];
  const rewardOf = (w, lvl) => (w.rew && w.rew[lvl]) || LEVEL_REWARDS[Math.min(lvl, LEVEL_REWARDS.length - 1)];
  const icon = w => K.vis && K.vis.has('bonus-' + w.id) ? `<img alt="" src="${K.vis.url('bonus-' + w.id)}">` : ui.bonusIcons[w.id];

  function stateOf(w) { const b = (K.store.get().bonus || {})[w.id] || { count: 0, level: 0 }; if (w.auto) b.count = w.auto(); return b; }
  function levelFor(w, count) { return w.tiers.filter(t => count >= t).length; }
  function totalLevels() { return WORLDS.reduce((t, w) => t + Math.min((stateOf(w).level || 0), w.tiers.length), 0); }
  function eligible(w) {
    if (!w.age) return true; const p = K.store.get().profile; if (!p) return true;
    const a = D.age(D.parse(p.birth)); return a >= w.age[0] && a <= w.age[1];
  }

  /* Donne les récompenses des paliers atteints mais pas encore récompensés. */
  function settle(w) {
    const st = stateOf(w), reached = levelFor(w, st.count), from = st.level || 0;
    if (reached <= from) return;
    let pts = 0; const packs = [];
    for (let l = from; l < reached; l++) { const r = rewardOf(w, l); pts += r.p || 0; if (r.pack) packs.push(r.pack); }
    K.store.update(s => { s.bonus = s.bonus || {}; s.bonus[w.id] = Object.assign({ count: 0 }, s.bonus[w.id], { level: reached }); s.wallet.pulsations += pts; packs.forEach(t => s.packs.push({ type: t, from: 'bonus-' + w.id, at: D.todayISO() })); });
    ui.reward({ title: `${w.name} : niveau ${reached}`, amount: pts, extra: packs.map(t => K.config.packs[t].name).join(' + ') + ' à ouvrir dans ta Collection', sub: reached < w.tiers.length ? `Prochain niveau : ${w.steps ? w.steps[reached] : w.tiers[reached] + ' fois'}.` : 'Niveau maximum atteint. Bravo !' });
  }

  function render(el) {
    const p = K.store.get().profile, noDons = p && p.dons === 'non';
    const list = WORLDS.filter(eligible);
    const sorted = noDons ? list.filter(w => !w.don).concat(list.filter(w => w.don)) : list;
    WORLDS.filter(w => w.auto).forEach(w => { if (levelFor(w, stateOf(w).count) > (stateOf(w).level || 0)) setTimeout(() => settle(w), 300); });
    el.innerHTML = `<p class="muted">Des gestes solidaires qui ne sont pas des rendez-vous obligatoires, mais qui comptent. Chaque niveau franchi rapporte des packs et fait monter ton score Kardia.</p>
      ${noDons ? '<p class="muted small-note">Les dons sont en bas de la liste, si un jour ça te tente. Les autres niveaux rapportent exactement autant.</p>' : ''}
      <button class="med-btn" data-med><span><b>${K.med.filled() ? 'Mes infos médicales' : 'Compléter mes infos médicales'}</b><small>Groupe sanguin, poids, grossesse, allergies… pour savoir si tu peux donner.</small></span>${ui.icons.chevron}</button>
      <div class="worlds">${sorted.map(w => {
        const st = stateOf(w), lvl = st.level || 0, max = w.tiers.length, done = lvl >= max;
        const next = done ? 'Niveau maximum' : w.steps ? w.steps[lvl] : `${Math.min(st.count, w.tiers[lvl])} / ${w.tiers[lvl]}`;
        const chk = K.med.donCheck(w.id);
        return `<button class="world ${done ? 'done' : ''} ${chk.ok ? '' : 'paused'}" data-w="${w.id}"><span class="w-ico">${icon(w)}</span><b>${ui.esc(w.name)}</b>
          <span class="w-lvl">Niveau ${lvl} / ${max}</span><span class="dots">${w.tiers.map((_, k) => `<i class="${k < lvl ? 'on' : ''}"></i>`).join('')}</span><small>${ui.esc(chk.ok ? next : 'Pas pour le moment')}</small></button>`;
      }).join('')}</div>`;
    el.onclick = e => { if (e.target.closest('[data-med]')) return K.med.open(); const b = e.target.closest('[data-w]'); if (b) open(b.dataset.w); };
  }

  function open(id) {
    const w = WORLDS.find(x => x.id === id), st = stateOf(w), lvl = st.level || 0, done = lvl >= w.tiers.length;
    const stairs = w.tiers.map((t, k) => `<li class="${k < lvl ? 'ok' : k === lvl ? 'cur' : ''}"><span class="st-n">${k < lvl ? ui.icons.check : `<i>${k + 1}</i>`}</span><span class="st-t"><b>Niveau ${k + 1}</b><small>${w.steps ? ui.esc(w.steps[k]) : `${t} fois`}</small></span>${K.missions.rewardBadge(rewardOf(w, k), 'sm')}</li>`).reverse().join('');
    const chk = K.med.donCheck(w.id);
    const canAct = !done && !w.auto && chk.ok;
    const body = ui.sheet(`<div class="ech-head"><div class="ech-emoji w-ico">${icon(w)}</div><div><p class="ech-boss">Niveau bonus</p><h2 class="sheet-title">${ui.esc(w.name)}</h2>
      <p class="ech-status">${w.auto ? `${st.count} ami${st.count > 1 ? 's' : ''} ajouté${st.count > 1 ? 's' : ''}` : w.steps ? '' : `${st.count} fois au total`}</p></div></div>
      ${w.why ? `<div class="why"><b>Pourquoi c’est précieux</b><p>${ui.esc(w.why)}</p></div>` : ''}
      <p>${ui.esc(w.info)}</p>
      ${chk.blocks.length ? `<div class="asst-warn"><b>Pas pour le moment</b> ${chk.blocks.map(ui.esc).join(' ')}</div>` : ''}
      ${chk.notes.map(n => `<p class="med-note">${ui.esc(n)}</p>`).join('')}
      ${w.don && !K.med.filled() ? '<button class="btn text wide" data-b="med">Vérifier si je peux donner (infos médicales)</button>' : ''}
      <ol class="stairs">${stairs}</ol>
      <div class="actions">
        ${w.link ? `<a class="btn doctolib" href="${w.link}" target="_blank" rel="noopener">${ui.esc(w.linkLabel)}</a>` : ''}
        ${canAct ? `<button class="btn primary" data-b="do">${ui.esc(w.steps ? w.steps[lvl] : w.action)}</button>` : ''}
        ${w.invite || w.don ? '<button class="btn ghost" data-b="invite">Inviter un ami</button>' : ''}
        ${w.auto ? '<button class="btn ghost" data-b="rank">Ouvrir le classement</button>' : ''}
      </div>`);
    body.onclick = e => {
      const a = e.target.closest('[data-b]'); if (!a) return;
      if (a.dataset.b === 'invite') K.duo.invite(w.name);
      if (a.dataset.b === 'med') K.med.open(() => open(w.id));
      if (a.dataset.b === 'rank') { ui.close(); K.world.openPanel('rank'); }
      if (a.dataset.b === 'do') {
        const needProof = w.steps ? w.proofs[lvl] : w.proof;
        if (!needProof) return validate(w, null);
        proofForm(w);
      }
    };
  }

  function proofForm(w) {
    const body = ui.sheet(`<h2 class="sheet-title">Ajoute ta preuve</h2>
      <p class="muted">Une photo de ta carte de donneur, de ton attestation ou de toi sur place. Elle reste sur ton téléphone.</p>
      <div class="proof-pick"><label class="btn ghost">Prendre une photo<input type="file" accept="image/*" capture="environment" hidden data-in></label>
      <label class="btn ghost">Choisir un fichier<input type="file" accept="image/*,application/pdf" hidden data-in></label></div>
      <div class="proof-preview" hidden></div>
      <div class="row-btns"><button class="btn ghost" data-a2="back">Retour</button><button class="btn primary" data-a2="ok" disabled>Valider</button></div>`);
    let file = null;
    body.querySelectorAll('[data-in]').forEach(inp => inp.addEventListener('change', () => {
      file = inp.files[0]; if (!file) return;
      const pv = body.querySelector('.proof-preview'); pv.hidden = false;
      pv.innerHTML = file.type.startsWith('image/') ? `<img alt="Aperçu" src="${URL.createObjectURL(file)}">` : `<p>Fichier : ${ui.esc(file.name)}</p>`;
      body.querySelector('[data-a2=ok]').disabled = false;
    }));
    body.onclick = async e => {
      const a = e.target.closest('[data-a2]'); if (!a || a.disabled) return;
      if (a.dataset.a2 === 'back') return open(w.id);
      a.disabled = true; let pid = null;
      try { pid = 'bonus-' + w.id + '-' + Date.now(); await K.store.putProof(pid, file); } catch (err) { pid = null; }
      validate(w, pid);
    };
  }

  function validate(w, proofId) {
    K.store.update(s => { s.bonus = s.bonus || {}; const b = s.bonus[w.id] || (s.bonus[w.id] = { count: 0, level: 0 }); b.count += 1; b.proofs = (b.proofs || []).concat(proofId ? [proofId] : []).slice(-30); });
    ui.close();
    const st = stateOf(w);
    if (levelFor(w, st.count) > (st.level || 0)) setTimeout(() => settle(w), 280);
    else ui.toast(`Bravo ! Encore ${w.tiers[st.level || 0] - st.count} pour le niveau suivant.`);
  }

  K.bonus = { WORLDS, render, open, totalLevels };
})();
