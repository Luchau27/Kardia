/* Le quiz du jour : 3 questions tirées chaque jour dans la banque. */
(function () {
  const ui = K.ui, D = K.dates;
  const Q = [
    ['Combien de fois ton cœur bat-il environ par jour ?', ['10 000', '100 000', '1 million', '50 000'], 1, 'Environ 100 000 battements par jour, sans aucune pause.'],
    ['À quel âge commence le dépistage organisé du cancer colorectal ?', ['40 ans', '45 ans', '50 ans', '60 ans'], 2, 'Un test à faire chez soi tous les 2 ans, de 50 à 74 ans.'],
    ['Jusqu’à quel âge le dépistage IST en laboratoire est-il gratuit et sans ordonnance ?', ['Moins de 18 ans', 'Moins de 21 ans', 'Moins de 26 ans', 'Moins de 30 ans'], 2, 'Gratuit avant 26 ans. Après, il reste possible sans ordonnance et il est remboursé.'],
    ['Quel numéro appeler pour une urgence médicale en France ?', ['15', '17', '115', '3114'], 0, 'Le 15 joint le SAMU. Le 112 fonctionne aussi partout en Europe.'],
    ['À quoi sert le 3114 ?', ['Les urgences dentaires', 'La prévention du suicide', 'Les pompiers', 'La météo'], 1, 'Le 3114 répond 24h/24 aux personnes en souffrance psychique et à leurs proches. C’est gratuit.'],
    ['Quel est le plus grand organe du corps ?', ['Le foie', 'Le cerveau', 'La peau', 'L’intestin'], 2, 'La peau couvre environ 2 m² chez l’adulte.'],
    ['Quel est le plus petit os du corps ?', ['L’étrier', 'La rotule', 'Le coccyx', 'Une phalange'], 0, 'L’étrier, dans l’oreille, mesure environ 3 mm.'],
    ['Combien d’os compte une main ?', ['5', '14', '27', '42'], 2, '27 os, ce qui lui donne sa précision.'],
    ['À quels âges se font les rappels diphtérie-tétanos-polio chez l’adulte ?', ['20, 40 et 60 ans', '25, 45 et 65 ans', '30, 50 et 70 ans', 'Tous les 5 ans'], 1, 'À 25, 45 et 65 ans, puis tous les 10 ans.'],
    ['Tous les combien faut-il remettre de la crème solaire ?', ['30 minutes', '2 heures', '4 heures', 'Une fois par jour'], 1, 'Toutes les 2 heures environ, et après chaque baignade.'],
    ['Vrai ou faux : les UV traversent les nuages.', ['Vrai', 'Faux'], 0, 'Vrai : on peut attraper un coup de soleil par temps couvert.'],
    ['Contre la gastro, quel lavage de mains est le plus efficace ?', ['Gel hydroalcoolique', 'Eau et savon', 'Eau seule', 'Lingette sèche'], 1, 'Le virus de la gastro résiste mieux au gel : eau et savon, c’est le top.'],
    ['Le dépistage du cancer du col de l’utérus concerne quel âge ?', ['18 à 50 ans', '25 à 65 ans', '30 à 74 ans', '50 à 74 ans'], 1, 'De 25 à 65 ans, chez le médecin, le gynécologue ou la sage-femme.'],
    ['De 30 à 65 ans, le dépistage du col se fait par…', ['Un frottis chaque année', 'Un test HPV tous les 5 ans', 'Une prise de sang', 'Une échographie'], 1, 'Un test HPV tous les 5 ans s’il est normal.'],
    ['À quel âge le dépistage organisé du cancer du sein est-il proposé ?', ['40 à 60 ans', '45 à 70 ans', '50 à 74 ans', '25 à 65 ans'], 2, 'Une mammographie tous les 2 ans de 50 à 74 ans, sur invitation.'],
    ['Pourquoi n’existe-t-il pas de vaccin contre le rhume ?', ['Il n’est pas dangereux', 'Il y a plus de 100 virus différents', 'Personne n’a essayé', 'Il vient du froid'], 1, 'Plus de 100 rhinovirus différents : impossible de tous les cibler.'],
    ['Pourquoi le vaccin contre la grippe se refait-il chaque année ?', ['Il s’use', 'Le virus change', 'C’est obligatoire', 'Pour le plaisir'], 1, 'Le virus de la grippe évolue chaque hiver, le vaccin est donc mis à jour.'],
    ['Les antibiotiques sont efficaces contre…', ['Les virus', 'Les bactéries', 'Les deux', 'Les allergies'], 1, 'Seulement les bactéries. Contre un rhume ou une grippe, ils ne servent à rien.'],
    ['À quoi sert le test rapide de l’angine ?', ['Savoir si des antibiotiques sont utiles', 'Mesurer la fièvre', 'Tester une allergie', 'Vérifier les vaccins'], 0, 'Il dit si l’angine est due à une bactérie. Possible chez le médecin ou en pharmacie.'],
    ['Combien de séances chez un psychologue « Mon soutien psy » rembourse-t-il par an ?', ['4', '8', '12', '20'], 2, 'Jusqu’à 12 séances par an avec un psychologue partenaire.'],
    ['Combien de temps faut-il se brosser les dents ?', ['30 secondes', '2 minutes', '5 minutes', '10 minutes'], 1, '2 minutes, deux fois par jour.'],
    ['Jusqu’à quel âge l’examen M’T dents est-il gratuit chaque année ?', ['18 ans', '24 ans', '26 ans', '30 ans'], 1, 'Un examen bucco-dentaire 100 % pris en charge chaque année jusqu’à 24 ans.'],
    ['Ton pharmacien peut-il te vacciner ?', ['Non, jamais', 'Seulement contre la grippe', 'Oui, contre de nombreuses maladies', 'Seulement les enfants'], 2, 'Le pharmacien peut faire de nombreux vaccins chez l’adulte.'],
    ['À quel âge peut-on s’inscrire au registre des donneurs de moelle osseuse ?', ['16 à 30 ans', '18 à 35 ans', '18 à 60 ans', 'À tout âge'], 1, 'L’inscription est ouverte de 18 à 35 ans.'],
    ['Combien de temps dure le prélèvement lors d’un don de sang ?', ['2 minutes', 'Environ 10 minutes', '45 minutes', '2 heures'], 1, 'Le prélèvement prend environ 10 minutes ; prévois un peu plus avec l’entretien et la collation.'],
    ['À quel âge peut-on donner son sang en France ?', ['16 à 60 ans', '18 à 70 ans', '21 à 65 ans', '18 à 50 ans'], 1, 'De 18 à 70 ans, en bonne santé.'],
    ['À quoi sert la règle ABCDE ?', ['Surveiller les grains de beauté', 'Apprendre les vitamines', 'Gérer son stress', 'Faire un massage cardiaque'], 0, 'Asymétrie, Bords, Couleur, Diamètre, Évolution : au moindre doute, consulte.'],
    ['Combien d’heures de sommeil sont conseillées pour un adulte ?', ['5 à 6 h', '7 à 9 h', '10 à 11 h', '4 h suffisent'], 1, 'Entre 7 et 9 heures pour la plupart des adultes.'],
    ['Quelle durée minimale d’activité physique modérée est conseillée par semaine ?', ['60 minutes', '150 minutes', '500 minutes', '20 minutes'], 1, 'Au moins 150 minutes par semaine, par exemple 30 minutes 5 jours sur 7.'],
    ['Quel muscle surnomme-t-on « le deuxième cœur » ?', ['Le biceps', 'Le mollet', 'Le diaphragme', 'Le trapèze'], 1, 'En marchant, le mollet aide le sang à remonter vers le cœur.'],
    ['Que provoquent les écrans juste avant de dormir ?', ['Ils aident à s’endormir', 'Ils retardent l’endormissement', 'Rien du tout', 'Ils renforcent la vue'], 1, 'La lumière et la stimulation retardent l’endormissement.'],
    ['D’où vient le hoquet ?', ['Du cœur', 'Du diaphragme', 'De l’estomac', 'Des poumons'], 1, 'Le diaphragme se contracte par surprise.'],
    ['Quel est le plus gros muscle du corps ?', ['Le quadriceps', 'Le grand fessier', 'Le biceps', 'Le grand dorsal'], 1, 'Le grand fessier, moteur de la marche et de la course.'],
    ['Combien de temps vit un globule rouge ?', ['3 jours', 'Environ 120 jours', '10 ans', 'Toute la vie'], 1, 'Environ 120 jours, puis la rate le recycle.'],
    ['Quelles cellules fabriquent les anticorps ?', ['Les globules rouges', 'Les lymphocytes B', 'Les neurones', 'Les plaquettes'], 1, 'Les lymphocytes B fabriquent les anticorps et gardent la mémoire des infections.'],
    ['Comment agit un vaccin ?', ['Il tue tous les microbes', 'Il entraîne le système immunitaire', 'Il remplace le sommeil', 'Il soigne une maladie déjà là'], 1, 'Il apprend au corps à reconnaître un microbe sans tomber malade.'],
    ['Où pond le moustique tigre ?', ['Dans les arbres', 'Dans l’eau stagnante', 'Dans le sable', 'Dans les fleurs'], 1, 'Soucoupes, seaux, gouttières : vider l’eau stagnante l’empêche de pondre.'],
    ['Que faire après une balade en forêt ?', ['Rien', 'Vérifier sa peau pour les tiques', 'Prendre un antibiotique', 'Boire du lait'], 1, 'Retirer vite une tique réduit le risque de maladie de Lyme.'],
    ['Pourquoi déclarer un médecin traitant ?', ['C’est payant', 'Pour être mieux remboursé et suivi', 'C’est obligatoire pour voyager', 'Pour avoir des vaccins'], 1, 'Il coordonne ton suivi et tes soins sont mieux remboursés.'],
    ['À quoi sert le 116 117 ?', ['Joindre un médecin de garde', 'Les pompiers', 'La police', 'La météo'], 0, 'Le soir et le week-end, il oriente vers un médecin de garde.'],
    ['Le bilan « Mon bilan prévention » est pris en charge à…', ['30 %', '60 %', '100 %', 'Il n’est pas remboursé'], 2, '100 %, sans avance de frais.'],
    ['Une perte d’audition due au bruit est-elle réversible ?', ['Oui, toujours', 'Souvent non', 'Oui, avec du repos', 'Seulement chez les jeunes'], 1, 'Les dégâts sont souvent définitifs : bouchons d’oreille en concert !'],
    ['Jusqu’à quel âge les préservatifs sont-ils gratuits en pharmacie ?', ['Moins de 18 ans', 'Moins de 21 ans', 'Moins de 26 ans', 'Ils ne sont jamais gratuits'], 2, 'Gratuits et sans ordonnance en pharmacie avant 26 ans.'],
    ['La chlamydia donne-t-elle toujours des symptômes ?', ['Oui, toujours', 'Non, souvent aucun', 'Seulement en hiver', 'Seulement chez les hommes'], 1, 'Elle passe souvent inaperçue, d’où l’intérêt du dépistage.'],
    ['Combien de paires de côtes avons-nous ?', ['10', '12', '14', '24'], 1, '12 paires qui protègent le cœur et les poumons.'],
    ['Quelles cellules fabriquent la mélanine ?', ['Les mélanocytes', 'Les neurones', 'Les globules blancs', 'Les ostéoblastes'], 0, 'La mélanine colore la peau et la protège du soleil.'],
    ['Quel organe fabrique l’insuline ?', ['Le foie', 'Le pancréas', 'Les reins', 'La rate'], 1, 'L’insuline fait entrer le sucre dans les cellules.'],
    ['Quel est l’os le plus long du corps ?', ['Le tibia', 'L’humérus', 'Le fémur', 'La colonne'], 2, 'Le fémur, dans la cuisse.'],
    ['Après 65 ans, à quelle fréquence se fait le rappel du tétanos ?', ['Tous les 2 ans', 'Tous les 5 ans', 'Tous les 10 ans', 'Plus jamais'], 2, 'Tous les 10 ans après 65 ans.'],
    ['Combien de temps dure une formation aux premiers secours (PSC1) ?', ['Environ une journée', 'Une semaine', 'Un mois', '1 heure'], 0, 'Environ 7 heures pour apprendre les gestes qui sauvent.']
  ];

  function seededPick(n) {
    const s = K.store.get(), seen = new Set((s.quizSeen || []).slice(-30));
    let pool = Q.map((_, i) => i).filter(i => !seen.has(i)); if (pool.length < n) pool = Q.map((_, i) => i);
    let seed = Number(D.todayISO().replace(/-/g, '')) % 2147483647 || 1;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, n);
  }

  function open() {
    const day = K.missions.today();
    if (day.quiz) { ui.sheet(`<h2 class="sheet-title">Quiz du jour terminé</h2><p>Tu as eu <b>${day.quiz.score}/3</b> aujourd’hui. Reviens demain pour 3 nouvelles questions !</p>`); return; }
    const ids = seededPick(3); let i = 0, score = 0;
    const body = ui.sheet('<div class="quiz"></div>', { locked: true });
    const box = body.querySelector('.quiz');
    function show() {
      const [q, opts] = Q[ids[i]];
      box.innerHTML = `<p class="quiz-step">Question ${i + 1} sur 3</p><h2 class="sheet-title">${ui.esc(q)}</h2>
        <div class="quiz-opts">${opts.map((o, k) => `<button class="opt" data-k="${k}">${ui.esc(o)}</button>`).join('')}</div><div class="quiz-ex"></div>`;
    }
    box.onclick = e => {
      const o = e.target.closest('.opt'); const nx = e.target.closest('[data-next]');
      if (o && !box.querySelector('.opt.ok, .opt.ko')) {
        const [, , a, ex] = Q[ids[i]], k = Number(o.dataset.k);
        box.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (Number(b.dataset.k) === a) b.classList.add('ok'); });
        if (k === a) score++; else o.classList.add('ko');
        box.querySelector('.quiz-ex').innerHTML = `<p class="${k === a ? 'good' : 'bad'}">${k === a ? 'Bonne réponse !' : 'Pas tout à fait.'}</p><p>${ui.esc(ex)}</p><button class="btn primary wide" data-next>${i < 2 ? 'Question suivante' : 'Voir mon score'}</button>`;
      }
      if (nx) { i++; if (i < 3) show(); else finish(); }
    };
    function finish() {
      const gain = score * 15;
      K.store.update(s => { s.stats.quizCorrect = (s.stats.quizCorrect || 0) + score; s.quizSeen = (s.quizSeen || []).concat(ids).slice(-60); s.wallet.pulsations += gain; });
      K.missions.mark('quiz', { score });
      box.innerHTML = `<h2 class="sheet-title">${score === 3 ? 'Sans faute !' : score === 2 ? 'Bien joué !' : 'Merci d’avoir joué !'}</h2>
        <p class="quiz-score">${score}/3</p><p class="center">${ui.icons.puls} +${gain} ${K.config.currency.name}</p>
        <p class="muted center">Pense à récupérer la récompense de la mission dans l’onglet Missions.</p>
        <button class="btn primary wide" data-close>Fermer</button>`;
      box.onclick = e => { if (e.target.closest('[data-close]')) ui.close(); };
    }
    show();
  }
  K.quiz = { open, count: Q.length };
})();
