/* L'assistant du héros (double-tape) : des questions guidées qui orientent vers la bonne personne. */
(function () {
  const ui = K.ui, D = K.dates;
  const tel = (num, label, desc, urgent) => ({ kind: 'tel', num, label, desc, urgent });
  const doc = (spec, label, desc) => ({ kind: 'doctolib', spec, label, desc });
  const maps = (q, label, desc) => ({ kind: 'maps', q, label, desc });
  const S15 = tel('15', '15', 'SAMU, urgence médicale', true);
  const S112 = tel('112', '112', 'Urgences, partout en Europe', true);
  const GARDE = tel('116117', '116 117', 'Médecin de garde, soirs et week-ends');

  const T = {
    root: { q: 'Qu’est-ce qui ne va pas aujourd’hui ?', opts: [['malade', 'Je suis malade'], ['mal', 'J’ai mal quelque part'], ['tete', 'Ça ne va pas dans ma tête'], ['intime', 'Sexualité, contraception'], ['blessure', 'Je me suis blessé·e'], ['urgent', 'C’est urgent']] },
    malade: { title: 'Repose-toi, on s’occupe du reste', text: 'Fièvre, rhume, gastro : repos, hydratation, et ton pharmacien peut te conseiller sans rendez-vous. Je peux aussi décaler tes prochaines étapes, surtout les vaccins, le temps que tu ailles mieux.',
      warn: 'Appelle le 15 si tu as du mal à respirer, une fièvre très élevée qui ne baisse pas, une raideur de la nuque, une confusion ou si ton état s’aggrave vite.',
      snooze: true, who: [doc('medecin-generaliste', 'Voir un médecin généraliste'), maps('pharmacie', 'Pharmacie autour de moi', 'Conseils sans rendez-vous'), GARDE, S15] },
    mal: { q: 'Où as-tu mal ?', opts: [['dents', 'Aux dents'], ['dos', 'Au dos ou aux articulations'], ['tetemal', 'À la tête'], ['ventre', 'Au ventre'], ['poitrine', 'À la poitrine']] },
    dents: { title: 'Direction le dentiste', text: 'Une douleur dentaire ne passe pas toute seule. Le dimanche et les jours fériés, le 116 117 ou le 15 t’orientent vers le dentiste de garde de ton département.',
      who: [doc('dentiste', 'Trouver un dentiste'), GARDE] },
    dos: { title: 'Bouge doucement', text: 'Pour un mal de dos, rester actif aide généralement plus que rester allongé. Si la douleur dure plus de quelques jours, consulte ton médecin, qui pourra t’orienter vers un kiné.',
      warn: 'Appelle le 15 en cas de perte de force ou de sensibilité dans les jambes, ou de troubles pour uriner.',
      who: [doc('medecin-generaliste', 'Voir un médecin généraliste'), doc('masseur-kinesitherapeute', 'Trouver un kiné'), S15] },
    tetemal: { title: 'Mal de tête', text: 'Un mal de tête habituel peut être soulagé avec les conseils de ton pharmacien. S’il revient souvent, parles-en à ton médecin.',
      warn: 'Appelle le 15 tout de suite si le mal de tête est brutal et très violent, ou s’il s’accompagne d’une faiblesse, de troubles de la parole ou de la vue, ou d’une raideur de la nuque.',
      who: [maps('pharmacie', 'Pharmacie autour de moi'), doc('medecin-generaliste', 'Voir un médecin généraliste'), S15] },
    ventre: { title: 'Mal au ventre', text: 'Ton pharmacien peut conseiller pour une gêne digestive. Consulte un médecin si la douleur persiste ou s’accompagne de fièvre.',
      warn: 'Appelle le 15 si la douleur est très violente, si ton ventre est dur, ou si tu vomis du sang.',
      who: [maps('pharmacie', 'Pharmacie autour de moi'), doc('medecin-generaliste', 'Voir un médecin généraliste'), GARDE, S15] },
    poitrine: { title: 'Appelle le 15 maintenant', text: 'Une douleur dans la poitrine doit toujours être prise au sérieux. N’attends pas et ne conduis pas toi-même.', who: [S15, S112], alert: true },
    tete: { q: 'Qu’est-ce qui se passe ?', opts: [['stress', 'Stress, anxiété, fatigue'], ['noir', 'J’ai des idées noires'], ['parler', 'J’ai besoin de parler']] },
    stress: { title: 'Tu n’as pas à gérer ça seul·e', text: 'Avec Mon soutien psy, des séances chez un psychologue partenaire sont remboursées, sans passer par ton médecin. Ton médecin généraliste peut aussi t’aider à faire le point.',
      who: [doc('psychologue', 'Trouver un psychologue'), doc('medecin-generaliste', 'Voir un médecin généraliste'), tel('0972394050', 'SOS Amitié', 'Écoute anonyme 24h/24')] },
    noir: { title: 'Parle à quelqu’un maintenant', text: 'Tu comptes. Des personnes formées sont là pour t’écouter, jour et nuit, gratuitement.', alert: true,
      who: [tel('3114', '3114', 'Prévention du suicide, 24h/24, gratuit', true), S15, tel('0972394050', 'SOS Amitié', 'Écoute anonyme 24h/24')] },
    parler: { title: 'Quelqu’un t’écoute', text: 'Parler fait du bien, même quand on ne sait pas par où commencer.', youth: true,
      who: [tel('0972394050', 'SOS Amitié', 'Écoute anonyme 24h/24'), tel('3114', '3114', 'Si ça devient trop lourd, 24h/24')] },
    intime: { title: 'Santé sexuelle', text: 'La contraception d’urgence est disponible gratuitement en pharmacie, sans ordonnance. Le dépistage IST se fait sans ordonnance en laboratoire, gratuitement avant 26 ans. Une sage-femme ou un centre de santé sexuelle peut répondre à toutes tes questions.',
      who: [maps('pharmacie', 'Pharmacie autour de moi', 'Contraception d’urgence'), maps('laboratoire d’analyses médicales', 'Laboratoire autour de moi', 'Dépistage IST'), doc('sage-femme', 'Trouver une sage-femme'), tel('3919', '3919', 'Violences, écoute anonyme et gratuite')] },
    blessure: { q: 'C’est grave ?', opts: [['blessgrave', 'Saignement important, malaise ou os déformé'], ['blessleger', 'Plutôt léger']] },
    blessgrave: { title: 'Appelle les secours', text: 'Appuie fort sur une plaie qui saigne, ne bouge pas un membre déformé, et reste avec la personne en attendant les secours.', alert: true, who: [S15, S112, tel('18', '18', 'Pompiers', true)] },
    blessleger: { title: 'Les bons réflexes', text: 'Nettoie la plaie à l’eau et au savon. Pour une brûlure, refroidis-la environ 15 minutes sous l’eau tempérée. Ton pharmacien peut regarder et te conseiller. Vérifie aussi ton rappel antitétanique.',
      who: [maps('pharmacie', 'Pharmacie autour de moi'), doc('medecin-generaliste', 'Voir un médecin généraliste'), GARDE] },
    urgent: { title: 'Les numéros d’urgence', text: 'En cas de danger, appelle sans attendre.', alert: true,
      who: [S15, S112, tel('18', '18', 'Pompiers', true), tel('3114', '3114', 'Prévention du suicide, 24h/24'), tel('17', '17', 'Police secours', true), GARDE] }
  };

  function link(w) {
    const p = K.store.get().profile || {};
    if (w.kind === 'tel') return `<a class="help ${w.urgent ? 'urgent' : ''}" href="tel:${w.num}"><b>${ui.esc(w.label)}</b><span>${ui.esc(w.desc || '')}</span></a>`;
    if (w.kind === 'doctolib') return `<a class="help" href="https://www.doctolib.fr/${w.spec}${p.city ? '/' + ui.slug(p.city) : ''}" target="_blank" rel="noopener"><b class="hl-ico">Doctolib</b><span>${ui.esc(w.label)}${w.desc ? `<small>${ui.esc(w.desc)}</small>` : ''}</span></a>`;
    return `<a class="help" href="https://www.google.com/maps/search/${encodeURIComponent(w.q + ' ' + (p.postcode || '') + ' ' + (p.city || ''))}" target="_blank" rel="noopener"><b class="hl-ico">Carte</b><span>${ui.esc(w.label)}${w.desc ? `<small>${ui.esc(w.desc)}</small>` : ''}</span></a>`;
  }

  function open(node = 'root', trail = []) {
    const n = T[node], s = K.store.get(), age = s.profile ? D.age(D.parse(s.profile.birth)) : 30;
    const head = node === 'root' ? `<div class="asst-head">${K.avatar.svg(s.avatar)}<p class="asst-bubble">Je t’écoute, ${ui.esc(s.profile.pseudo)}. ${ui.esc(n.q)}</p></div>` : '';
    let html = head;
    if (n.opts) html += `${node !== 'root' ? `<h2 class="sheet-title">${ui.esc(n.q)}</h2>` : ''}<div class="asst-opts">${n.opts.map(([k, l]) => `<button class="opt row" data-n="${k}"><span>${l}</span>${ui.icons.chevron}</button>`).join('')}</div>`;
    else {
      const who = n.who.slice(); if (n.youth && age <= 25) who.splice(1, 0, tel('0800235236', 'Fil Santé Jeunes', 'Jusqu’à 25 ans, anonyme et gratuit'));
      html += `<h2 class="sheet-title ${n.alert ? 'alert' : ''}">${ui.esc(n.title)}</h2><p>${ui.esc(n.text)}</p>
        ${n.warn ? `<p class="asst-warn"><b>Attention</b> ${ui.esc(n.warn)}</p>` : ''}
        ${n.snooze ? '<button class="btn primary wide" data-snooze>Décaler mes étapes des 2 prochaines semaines</button>' : ''}
        <div class="help-list">${who.map(link).join('')}</div>`;
    }
    if (node !== 'root') html += `<button class="btn text wide" data-back>Retour</button>`;
    html += `<p class="asst-note">Je t’oriente, je ne remplace pas un professionnel de santé.</p>`;
    const body = ui.sheet(html);
    body.onclick = e => {
      const o = e.target.closest('[data-n]'); if (o) return open(o.dataset.n, trail.concat(node));
      if (e.target.closest('[data-back]')) return open(trail[trail.length - 1] || 'root', trail.slice(0, -1));
      if (e.target.closest('[data-snooze]')) snooze();
    };
  }

  function snooze() {
    const plan = K.rules.plan(K.store.get()), lim = D.addDays(D.today(), 14), until = D.iso(lim);
    const ids = plan.upcoming.filter(u => u.status !== 'planned' && (!u.due || u.due <= lim)).map(u => u.rule.id);
    K.store.update(s => ids.forEach(id => { const r = s.echeances[id] || (s.echeances[id] = {}); r.snoozeUntil = until; }));
    ui.toast(ids.length ? `${ids.length} étape${ids.length > 1 ? 's' : ''} décalée${ids.length > 1 ? 's' : ''} de 2 semaines. Soigne-toi bien !` : 'Aucune étape à décaler dans les 2 semaines.');
  }

  K.assistant = { open };
})();
