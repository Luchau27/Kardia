/* Les échéances santé (adultes, France). Chaque règle dit si elle concerne la personne et quand elle tombe.
   due = null  → à faire dès que possible.  due = Date → date prévue.  undefined → ne concerne pas. */
(function () {
  const D = K.dates;
  const isF = p => p.sex === 'F' || p.sex === 'N';
  const isM = p => p.sex === 'M' || p.sex === 'N';
  const every = (last, months) => last ? D.addMonths(last, months) : null;
  const ageAt = (birth, d) => D.age(birth, d);

  const RULES = [
    {
      id: 'medecin-traitant', title: 'Déclarer ton médecin traitant', short: 'Médecin traitant',
      boss: 'Le Gardien du Portail', emoji: '🩺', type: 'ami', kind: 'admin', prio: 1,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Le médecin traitant coordonne ton suivi : c’est lui qui te connaît et t’oriente vers les bons spécialistes.',
      money: () => 'Déclaration gratuite, à faire avec le médecin lors d’une consultation. Ensuite, tes soins sont mieux remboursés.',
      when: (p, c) => (p.hasMT === 'oui' || c.last) ? undefined : null
    },
    {
      id: 'carnet', title: 'Retrouver ton carnet de vaccination', short: 'Carnet de vaccins',
      boss: 'Le Grimoire perdu', emoji: '📖', type: 'ami', kind: 'admin', prio: 2,
      why: 'Ton carnet dit quels vaccins tu as déjà reçus. Regarde dans Mon espace santé, chez tes parents, ou demande à ton médecin.',
      money: () => 'Gratuit.',
      when: (p, c) => (c.last || !Object.values(p.vax || {}).includes('nsp')) ? undefined : null
    },
    {
      id: 'bilan-prevention', title: 'Mon bilan prévention', short: 'Bilan prévention',
      boss: 'Le Grand Check-up', emoji: '🧭', type: 'boss', kind: 'rdv', prio: 3,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Un rendez-vous dédié à ta santé globale : sommeil, alimentation, activité, santé mentale, vaccins et dépistages.',
      money: () => '100 % pris en charge par l’Assurance Maladie, sans avance de frais. Possible aussi chez un pharmacien, un infirmier ou une sage-femme.',
      when: (p, c) => {
        const windows = [[18, 25], [45, 50], [60, 65], [70, 75]];
        for (const [a, b] of windows) {
          if (c.age < a) return D.birthday(c.birth, a);
          if (c.age <= b) {
            if (c.last && ageAt(c.birth, c.last) >= a) continue; // déjà fait dans cette fenêtre
            return null;
          }
        }
        return undefined;
      }
    },
    {
      id: 'dtp', title: 'Rappel diphtérie-tétanos-polio', short: 'Rappel DTP',
      boss: 'Le Bacille rouillé', emoji: '💉', type: 'boss', kind: 'rdv', prio: 4,
      doctolib: 'medecin-generaliste', maps: 'pharmacie',
      why: 'Les rappels se font à 25 ans (avec la coqueluche), 45 ans, 65 ans, puis tous les 10 ans. Ton pharmacien peut aussi le faire.',
      money: () => 'Vaccin remboursé par l’Assurance Maladie, le reste est généralement couvert par ta mutuelle.',
      when: (p, c) => {
        const ms = [25, 45, 65]; for (let a = 75; a <= 115; a += 10) ms.push(a);
        const doneSince = m => (c.last && ageAt(c.birth, c.last) >= m) || (m === 25 && p.vax && p.vax.dtp25 === 'oui');
        let current = null; for (const m of ms) if (c.age >= m) current = m;
        if (current !== null && !doneSince(current)) return null;
        const next = ms.find(m => m > c.age); return next ? D.birthday(c.birth, next) : undefined;
      }
    },
    {
      id: 'hpv', title: 'Vaccin HPV : vérifier le rattrapage', short: 'Vaccin HPV',
      boss: 'Le Masque aux mille formes', emoji: '💉', type: 'boss', kind: 'rdv', prio: 5,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Le vaccin contre les papillomavirus protège contre plusieurs cancers. Ton médecin te dira si un rattrapage est possible pour toi à ton âge.',
      money: () => 'Vaccin remboursé par l’Assurance Maladie.',
      when: (p, c) => (c.age <= 26 && !c.last && !(p.vax && p.vax.hpv === 'oui')) ? null : undefined
    },
    {
      id: 'ror', title: 'Compléter le ROR (2 doses)', short: 'Vaccin ROR',
      boss: 'Le Trio à pois', emoji: '💉', type: 'boss', kind: 'rdv', prio: 6,
      doctolib: 'medecin-generaliste', maps: 'pharmacie',
      why: 'Rougeole, oreillons, rubéole : deux doses protègent pour la vie. Recommandé pour toutes les personnes nées depuis 1980.',
      money: () => 'Vaccin pris en charge par l’Assurance Maladie.',
      when: (p, c) => (!c.last && c.birth.getFullYear() >= 1980 && p.vax && p.vax.ror === 'non') ? null : undefined
    },
    {
      id: 'grippe', title: 'Vaccin contre la grippe', short: 'Vaccin grippe',
      boss: 'Le Caméléon de l’hiver', emoji: '🤧', type: 'boss', kind: 'rdv', prio: 7,
      doctolib: null, maps: 'pharmacie',
      why: 'Conseillé chaque automne si tu as une maladie chronique (ou à partir de 65 ans). Le virus change chaque année.',
      money: () => 'Gratuit pour les personnes concernées, avec le bon envoyé par l’Assurance Maladie. Faisable en pharmacie.',
      when: (p, c) => {
        if (!((p.chronic || []).length || c.age >= 65)) return undefined;
        const t = c.today, y = t.getFullYear();
        const start = new Date(t >= new Date(y, 9, 15, 12) ? y : y - 1, 9, 15, 12);
        const nextStart = new Date(start.getFullYear() + 1, 9, 15, 12);
        if (c.last && c.last >= start) return nextStart;
        return D.diffDays(start, t) <= 140 ? null : nextStart;
      }
    },
    {
      id: 'dentiste', title: 'Contrôle chez le dentiste', short: 'Dentiste',
      boss: 'Le Mineur de Carie', emoji: '🦷', type: 'boss', kind: 'rdv', prio: 8,
      doctolib: 'dentiste', maps: 'dentiste',
      why: 'Un contrôle par an repère les caries et les problèmes de gencives avant qu’ils fassent mal.',
      money: c => c.age <= 24 ? 'Examen 100 % pris en charge chaque année jusqu’à 24 ans avec M’T dents, sans avance de frais.' : 'Consultation remboursée par l’Assurance Maladie et ta mutuelle.',
      when: (p, c) => every(c.last, 12)
    },
    {
      id: 'ophtalmo', title: 'Bilan de la vue', short: 'Ophtalmo',
      boss: 'Le Brouillard', emoji: '👁️', type: 'boss', kind: 'rdv', prio: 9,
      doctolib: 'ophtalmologue', maps: 'ophtalmologiste',
      why: 'Environ tous les 2 ans, ou dès que ta vue change. L’orthoptiste peut aussi faire ce bilan.',
      money: () => 'Consultation remboursée par l’Assurance Maladie et ta mutuelle.',
      when: (p, c) => every(c.last, 24)
    },
    {
      id: 'gyneco', title: 'Suivi gynécologique', short: 'Suivi gynéco',
      boss: 'La Gardienne du jardin', emoji: '🌷', type: 'ami', kind: 'rdv', prio: 10,
      doctolib: 'sage-femme', maps: 'sage-femme',
      why: 'Un suivi régulier pour la contraception, les questions intimes et la prévention. Médecin, gynécologue ou sage-femme : au choix.',
      money: () => 'Consultation remboursée par l’Assurance Maladie et ta mutuelle.',
      when: (p, c) => isF(p) ? every(c.last, 12) : undefined
    },
    {
      id: 'col', title: 'Dépistage du cancer du col de l’utérus', short: 'Dépistage col',
      boss: 'L’Ombre discrète', emoji: '🌸', type: 'boss', kind: 'rdv', prio: 11,
      doctolib: 'sage-femme', maps: 'sage-femme',
      why: 'De 25 à 29 ans : examen tous les 3 ans. De 30 à 65 ans : test HPV tous les 5 ans. Rapide, chez le médecin ou la sage-femme.',
      money: () => 'Pris en charge à 100 % dans le cadre du dépistage organisé.',
      when: (p, c) => {
        if (!isF(p) || c.age > 65) return undefined;
        if (c.age < 25) return D.birthday(c.birth, 25);
        return every(c.last, c.age < 30 ? 36 : 60);
      }
    },
    {
      id: 'sein', title: 'Dépistage du cancer du sein', short: 'Dépistage sein',
      boss: 'Le Ruban rose', emoji: '🎗️', type: 'ami', kind: 'rdv', prio: 12,
      doctolib: null, maps: 'centre de radiologie',
      why: 'Une mammographie tous les 2 ans de 50 à 74 ans, sur invitation.',
      money: () => 'Pris en charge à 100 % dans le cadre du dépistage organisé.',
      when: (p, c) => {
        if (!isF(p) || c.age > 74) return undefined;
        if (c.age < 50) return (p.family || []).includes('sein') ? undefined : D.birthday(c.birth, 50);
        return every(c.last, 24);
      }
    },
    {
      id: 'famille-sein', title: 'Parler de ton suivi du sein', short: 'Suivi sein',
      boss: 'Le Fil des ancêtres', emoji: '🧬', type: 'ami', kind: 'rdv', prio: 12,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Avec des antécédents familiaux, un suivi adapté et parfois plus précoce peut être proposé. Ton médecin évaluera ce qui convient.',
      money: () => 'Consultation remboursée par l’Assurance Maladie.',
      when: (p, c) => (isF(p) && c.age < 50 && (p.family || []).includes('sein') && !c.last) ? null : undefined
    },
    {
      id: 'colorectal', title: 'Dépistage du cancer colorectal', short: 'Dépistage côlon',
      boss: 'Le Labyrinthe', emoji: '🧪', type: 'boss', kind: 'rdv', prio: 13,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Un test simple à faire chez soi tous les 2 ans, de 50 à 74 ans.',
      money: () => 'Test gratuit dans le cadre du dépistage organisé.',
      when: (p, c) => {
        if (c.age > 74) return undefined;
        if (c.age < 50) return (p.family || []).includes('colorectal') ? undefined : D.birthday(c.birth, 50);
        return every(c.last, 24);
      }
    },
    {
      id: 'famille-colorectal', title: 'Parler du dépistage colorectal', short: 'Suivi côlon',
      boss: 'Le Fil des ancêtres', emoji: '🧬', type: 'ami', kind: 'rdv', prio: 13,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Avec un cancer colorectal dans la famille proche, un dépistage plus précoce peut être recommandé. Ton médecin te dira quand.',
      money: () => 'Consultation remboursée par l’Assurance Maladie.',
      when: (p, c) => (c.age < 50 && c.age >= 30 && (p.family || []).includes('colorectal') && !c.last) ? null : undefined
    },
    {
      id: 'peau', title: 'Auto-examen de la peau', short: 'Examen peau',
      boss: 'Le Miroir', emoji: '🪞', type: 'ami', kind: 'auto', prio: 14,
      why: 'Une fois par an, observe tes grains de beauté. Règle ABCDE : asymétrique, bords irréguliers, couleur variable, diamètre qui grandit, évolution. Au moindre doute, consulte.',
      money: () => 'Gratuit, à faire chez toi devant un miroir.',
      when: (p, c) => every(c.last, 12)
    },
    {
      id: 'dermato', title: 'Contrôle chez le dermatologue', short: 'Dermato',
      boss: 'Le Soleil espiègle', emoji: '☀️', type: 'boss', kind: 'rdv', prio: 15,
      doctolib: 'dermatologue', maps: 'dermatologue',
      why: 'Avec beaucoup de grains de beauté ou une peau très claire, un contrôle régulier est conseillé.',
      money: () => 'Consultation remboursée, en passant par ton médecin traitant pour un meilleur remboursement.',
      when: (p, c) => p.skinRisk ? every(c.last, 12) : undefined
    },
    {
      id: 'ist', title: 'Dépistage IST', short: 'Dépistage IST',
      boss: 'L’Espion invisible', emoji: '🔬', type: 'boss', kind: 'rdv', prio: 16,
      doctolib: null, maps: 'laboratoire d’analyses médicales',
      why: 'Beaucoup d’IST ne donnent aucun symptôme. Conseillé une fois par an et à chaque nouveau partenaire.',
      money: c => c.age < 26 ? 'Gratuit et sans ordonnance en laboratoire avant 26 ans.' : 'Sans ordonnance en laboratoire, remboursé par l’Assurance Maladie.',
      when: (p, c) => c.age <= 25 ? every(c.last, 12) : undefined
    },
    {
      id: 'cholesterol', title: 'Bilan du cholestérol', short: 'Cholestérol',
      boss: 'Le Bouchon', emoji: '🩸', type: 'boss', kind: 'rdv', prio: 17,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Une prise de sang conseillée à partir de 40 ans pour les hommes et 50 ans pour les femmes, à refaire selon les résultats.',
      money: () => 'Prise de sang remboursée sur ordonnance.',
      when: (p, c) => {
        const start = p.sex === 'F' ? 50 : 40;
        if (c.age < start) return D.birthday(c.birth, start);
        return every(c.last, 60);
      }
    },
    {
      id: 'chronique', title: 'Suivi de ta maladie chronique', short: 'Suivi régulier',
      boss: 'Le Compagnon de route', emoji: '🤝', type: 'ami', kind: 'rdv', prio: 0,
      doctolib: 'medecin-generaliste', maps: 'médecin généraliste',
      why: 'Un suivi régulier, au rythme convenu avec ton médecin. Par défaut, Kardia te le rappelle tous les 6 mois.',
      money: () => 'Selon ta situation, la prise en charge peut aller jusqu’à 100 %. Renseigne-toi auprès de ton médecin.',
      when: (p, c) => (p.chronic || []).length ? every(c.last, 6) : undefined
    }
  ];

  const byId = Object.fromEntries(RULES.map(r => [r.id, r]));

  /* Calcule le sentier : étapes à venir triées + dernières étapes réussies. */
  function plan(state) {
    const p = state.profile; if (!p) return { upcoming: [], done: [] };
    const today = D.today(), birth = D.parse(p.birth), age = D.age(birth, today);
    const upcoming = [];
    for (const r of RULES) {
      const rec = state.echeances[r.id] || {};
      const c = { today, birth, age, last: D.parse(rec.last) };
      let due = r.when(p, c);
      if (due === undefined) continue;
      if (due && due > D.addMonths(today, 36)) continue; // trop loin pour le sentier
      const snooze = D.parse(rec.snoozeUntil);
      if (snooze && snooze > today && (!due || due < snooze)) due = snooze;
      const planned = D.parse(rec.planned);
      let status, label;
      if (planned && planned >= today) { status = 'planned'; label = 'RDV le ' + D.short(planned); }
      else if (!due) { status = 'now'; label = 'À planifier'; }
      else if (due < today) { status = 'late'; label = 'En retard ' + D.relative(due); }
      else { const n = D.diffDays(today, due); status = n <= 30 ? 'soon' : 'future'; label = (snooze && due === snooze ? 'Décalé · ' : '') + D.relative(due); }
      upcoming.push({ rule: r, rec, due, planned, status, label, sortDate: planned || due || today });
    }
    // Pour que le sentier reste une aventure, seules 3 étapes sont « à planifier » en même temps :
    // les suivantes reçoivent une date conseillée, espacée de 2 semaines.
    const nows = upcoming.filter(u => u.status === 'now').sort((a, b) => a.rule.prio - b.rule.prio);
    nows.slice(3).forEach((u, i) => {
      const d = D.addDays(today, 14 * (i + 1));
      u.due = d; u.sortDate = d; u.suggested = true;
      u.status = D.diffDays(today, d) <= 30 ? 'soon' : 'future';
      u.label = 'Conseillé ' + D.relative(d);
    });
    const rank = { late: 0, now: 1, planned: 2, soon: 2, future: 2 };
    upcoming.sort((a, b) => (rank[a.status] - rank[b.status]) || (a.sortDate - b.sortDate) || (a.rule.prio - b.rule.prio));
    const done = (state.history || []).filter(h => byId[h.id]).slice(-3).map(h => ({ rule: byId[h.id], date: D.parse(h.date) }));
    return { upcoming, done };
  }

  function money(rule, state) {
    const p = state.profile; const birth = D.parse(p.birth);
    return rule.money({ age: D.age(birth), birth });
  }

  K.rules = { RULES, byId, plan, money };
})();
