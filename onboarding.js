/* Inscription : quelques questions pour construire ton sentier santé, puis le choix du héros. */
(function () {
  const ui = K.ui, D = K.dates;
  const VISITS = [['lt1', 'Moins d’1 an'], ['1to2', '1 à 2 ans'], ['2to3', '2 à 3 ans'], ['gt3', 'Plus de 3 ans ou jamais'], ['nsp', 'Je ne sais pas']];
  const YNN = [['oui', 'Oui'], ['non', 'Non'], ['nsp', 'Je ne sais pas']];
  const CHRONIC = [['asthme', 'Asthme'], ['diabete', 'Diabète'], ['hypertension', 'Hypertension'], ['coeur', 'Maladie cardiaque'], ['autre', 'Autre maladie chronique']];
  const FAMILY = [['sein', 'Cancer du sein'], ['colorectal', 'Cancer colorectal'], ['coeur', 'Maladie cardiaque avant 55 ans']];

  let d, stepIdx, steps, opts;
  const ageOf = () => d.birth ? D.age(D.parse(d.birth)) : 30;
  const fem = () => d.sex === 'F' || d.sex === 'N';

  function seg(name, list, val, multi) {
    const vals = multi ? (val || []) : [val];
    return `<div class="seg ${multi ? 'multi' : ''}" data-name="${name}">${list.map(([v, l]) => `<button type="button" data-v="${v}" class="${vals.includes(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  }
  const q = (label, html) => `<div class="qblock"><h3 class="q">${label}</h3>${html}</div>`;
  const read = (f, name, multi) => {
    const on = [...f.querySelectorAll(`.seg[data-name="${name}"] .on`)].map(b => b.dataset.v);
    return multi ? on : on[0];
  };

  const ALL = [
    { id: 'hello', next: 'Commencer', render: () => `
      <div class="ob-hero">${ui.logo(110)}<h1>Kardia</h1><p class="lead">Ta santé, version aventure.</p>
      <p>Ton héros avance sur un sentier où chaque rendez-vous santé est une étape à franchir. Tes réponses restent uniquement sur ce téléphone.</p></div>` },
    { id: 'birth', title: 'Quelle est ta date de naissance ?', hint: 'Elle sert à calculer tes vaccins, bilans et dépistages.',
      render: () => `<input class="field" type="date" name="birth" value="${d.birth || ''}" max="${D.todayISO()}">`,
      collect: f => {
        d.birth = f.querySelector('[name=birth]').value;
        if (!d.birth) return 'Indique ta date de naissance.';
        const a = ageOf(); if (a < 18) return 'Kardia est réservé aux personnes de 18 ans et plus.'; if (a > 110) return 'Vérifie la date saisie.';
      } },
    { id: 'me', title: 'Comment on t’appelle ?', hint: 'Ton pseudo apparaîtra dans le jeu. La ville sert à trouver des professionnels près de chez toi.',
      render: () => `<label class="lbl">Pseudo<input class="field" name="pseudo" maxlength="20" autocomplete="nickname" value="${ui.esc(d.pseudo || '')}"></label>
        <label class="lbl">Ville<input class="field" name="city" autocomplete="address-level2" value="${ui.esc(d.city || '')}"></label>
        <label class="lbl">Code postal<input class="field" name="postcode" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${ui.esc(d.postcode || '')}"></label>`,
      collect: f => {
        d.pseudo = f.querySelector('[name=pseudo]').value.trim(); d.city = f.querySelector('[name=city]').value.trim(); d.postcode = f.querySelector('[name=postcode]').value.trim();
        if (d.pseudo.length < 2) return 'Choisis un pseudo d’au moins 2 caractères.';
        if (d.postcode && !/^\d{5}$/.test(d.postcode)) return 'Le code postal doit avoir 5 chiffres.';
      } },
    { id: 'sex', title: 'Ton sexe à la naissance', hint: 'Certains dépistages en dépendent, comme celui du col de l’utérus ou du sein.',
      render: () => seg('sex', [['F', 'Femme'], ['M', 'Homme'], ['N', 'Je préfère ne pas le dire']], d.sex),
      collect: f => { d.sex = read(f, 'sex'); if (!d.sex) return 'Choisis une réponse.'; } },
    { id: 'suivi', title: 'Ton suivi actuel', hint: 'Une estimation suffit.',
      render: () => {
        let h = q('As-tu déclaré un médecin traitant ?', seg('hasMT', YNN, d.hasMT));
        h += q('Ton dernier passage chez le dentiste', seg('v_dentiste', VISITS, (d.visits || {}).dentiste));
        h += q('Ton dernier contrôle des yeux', seg('v_ophtalmo', VISITS, (d.visits || {}).ophtalmo));
        if (fem()) h += q('Ton dernier suivi gynécologique', seg('v_gyneco', VISITS, (d.visits || {}).gyneco));
        if (fem() && ageOf() >= 25) h += q('Ton dernier dépistage du col (frottis ou test HPV)', seg('v_col', VISITS, (d.visits || {}).col));
        h += q('Ton dernier dépistage IST', seg('v_ist', VISITS, (d.visits || {}).ist));
        return h;
      },
      collect: f => {
        d.hasMT = read(f, 'hasMT'); d.visits = {};
        ['dentiste', 'ophtalmo', 'gyneco', 'col', 'ist'].forEach(k => { const v = read(f, 'v_' + k); if (v) d.visits[k] = v; });
        if (!opts.edit && (!d.hasMT || !d.visits.dentiste || !d.visits.ophtalmo)) return 'Réponds au moins aux trois premières questions.';
      } },
    { id: 'sante', title: 'Ta santé en bref', hint: 'Coche ce qui te concerne, ou rien. Ces infos ne quittent jamais ton téléphone.',
      render: () => q('Une maladie suivie au long cours ?', seg('chronic', CHRONIC, d.chronic, true)) +
        q('Dans ta famille proche (parents, frères, sœurs)', seg('family', FAMILY, d.family, true)) +
        q('Ta peau', seg('skin', [['oui', 'Beaucoup de grains de beauté ou peau très claire']], d.skinRisk ? 'oui' : null, true)),
      collect: f => { d.chronic = read(f, 'chronic', true); d.family = read(f, 'family', true); d.skinRisk = read(f, 'skin', true).includes('oui'); } },
    { id: 'vax', title: 'Tes vaccins', hint: 'Si tu ne sais pas, Kardia t’aidera à retrouver ton carnet.',
      render: () => {
        const v = d.vax || {}; let h = '';
        if (ageOf() >= 25) h += q('Rappel diphtérie-tétanos-polio fait depuis tes 25 ans', seg('dtp25', YNN, v.dtp25));
        if (ageOf() <= 26) h += q('Vaccin contre les papillomavirus (HPV)', seg('hpv', YNN, v.hpv));
        h += q('Deux doses de ROR (rougeole, oreillons, rubéole)', seg('ror', YNN, v.ror));
        return h;
      },
      collect: f => {
        d.vax = {}; ['dtp25', 'hpv', 'ror'].forEach(k => { const v = read(f, k); if (v) d.vax[k] = v; });
        if (!d.vax.ror) return 'Réponds à chaque question, « Je ne sais pas » compte aussi.';
        if (ageOf() >= 25 && !d.vax.dtp25) return 'Réponds à chaque question, « Je ne sais pas » compte aussi.';
        if (ageOf() <= 26 && !d.vax.hpv) return 'Réponds à chaque question, « Je ne sais pas » compte aussi.';
      } },
    { id: 'dons', title: 'Les dons t’intéressent ?', hint: 'Sang, plasma, plaquettes, moelle osseuse. Si ce n’est pas pour toi, tu auras des défis équivalents, sans aucune différence de récompense.',
      render: () => seg('dons', [['oui', 'Oui'], ['non', 'Non'], ['plus-tard', 'Plus tard']], d.dons),
      collect: f => { d.dons = read(f, 'dons'); if (!d.dons) return 'Choisis une réponse.'; } },
    { id: 'avatar', title: 'Choisis ton héros', next: 'C’est parti', render: avatarStep, collect: () => {} }
  ];

  function avatarStep() {
    const av = d.avatar, T = K.avatar.TYPES[av.type];
    return `<div class="av-stage">${K.avatar.svg(av, { walking: true })}<p class="av-name"><b>${T.name}</b> ${T.role}</p></div>
      <div class="av-types">${Object.entries(K.avatar.TYPES).map(([k, t]) => `<button type="button" data-ob-type="${k}" class="${k === av.type ? 'on' : ''}" aria-label="${t.name}">${K.avatar.svg({ type: k, color: 0, acc: 'none' })}<small>${t.name}</small></button>`).join('')}</div>
      ${K.avatar.hasImage(av.type) ? '' : `<h3 class="q">Couleurs</h3>
      <div class="av-colors">${T.colors.map((c, i) => `<button type="button" data-ob-color="${i}" class="${i === av.color ? 'on' : ''}" style="--c1:${c[0]};--c2:${c[2]}" aria-label="Couleur ${i + 1}"></button>`).join('')}</div>
      <h3 class="q">Accessoire</h3>
      <div class="seg wrap">${Object.entries(K.avatar.ACCESSORIES).map(([k, l]) => `<button type="button" data-ob-acc="${k}" class="${k === av.acc ? 'on' : ''} ${K.avatar.LOCKED[k] ? 'locked' : ''}">${K.avatar.LOCKED[k] ? '<span class="lock" aria-hidden="true"></span>' : ''}${l}</button>`).join('')}</div>`}`;
  }

  function start(o = {}) {
    opts = o;
    const s = K.store.get();
    d = JSON.parse(JSON.stringify(s.profile || {}));
    d.avatar = s.avatar ? { ...s.avatar } : { type: 'globule-blanc', color: 0, acc: 'none' };
    steps = o.only === 'avatar' ? ALL.filter(x => x.id === 'avatar') : ALL.filter(x => !(o.edit && x.id === 'hello'));
    stepIdx = 0; show();
  }

  function show() {
    const st = steps[stepIdx], app = document.getElementById('app');
    const progress = steps.length > 1 ? `<div class="ob-progress"><i style="width:${(stepIdx + 1) / steps.length * 100}%"></i></div>` : '';
    app.innerHTML = `<main class="onboarding step-${st.id}">${progress}
      <form class="ob-card" novalidate>
        ${st.title ? `<h2>${st.title}</h2>` : ''}${st.hint ? `<p class="muted">${st.hint}</p>` : ''}
        <div class="ob-fields">${st.render()}</div>
        <p class="ob-error" role="alert"></p>
      </form>
      <footer class="ob-foot">
        ${stepIdx > 0 || opts.edit ? `<button type="button" class="btn ghost" data-ob="back">${stepIdx === 0 ? 'Annuler' : 'Retour'}</button>` : '<span></span>'}
        <button type="button" class="btn primary" data-ob="next">${st.next || (opts.edit && stepIdx === steps.length - 1 ? 'Enregistrer' : 'Continuer')}</button>
      </footer></main>`;
    const f = app.querySelector('form');
    f.addEventListener('submit', e => e.preventDefault());
    app.querySelector('.ob-fields').addEventListener('click', onField);
    app.querySelector('[data-ob=next]').onclick = next;
    const back = app.querySelector('[data-ob=back]');
    if (back) back.onclick = () => { if (stepIdx === 0) return K.app.boot(); stepIdx--; show(); };
    const first = f.querySelector('input'); if (first && st.id !== 'avatar') setTimeout(() => first.focus({ preventScroll: true }), 50);
  }

  function onField(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.obType) { d.avatar.type = b.dataset.obType; d.avatar.color = 0; return refreshAvatar(); }
    if (b.dataset.obColor) { d.avatar.color = Number(b.dataset.obColor); return refreshAvatar(); }
    if (b.dataset.obAcc) {
      if (K.avatar.LOCKED[b.dataset.obAcc]) { ui.toast(K.avatar.LOCKED[b.dataset.obAcc]); return; }
      d.avatar.acc = b.dataset.obAcc; return refreshAvatar();
    }
    const segEl = b.closest('.seg'); if (!segEl) return;
    if (segEl.classList.contains('multi')) b.classList.toggle('on');
    else segEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    if (segEl.dataset.name === 'sex') d.sex = b.dataset.v;
  }
  function refreshAvatar() { document.querySelector('.ob-fields').innerHTML = avatarStep(); }

  function next() {
    const st = steps[stepIdx], f = document.querySelector('.ob-card');
    const err = st.collect ? st.collect(f) : null;
    if (err) { const el = f.querySelector('.ob-error'); el.textContent = err; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    if (stepIdx < steps.length - 1) { stepIdx++; show(); return; }
    finish();
  }

  function visitDate(code) {
    const m = { lt1: 6, '1to2': 18, '2to3': 30 }[code];
    return m ? D.iso(D.addMonths(D.today(), -m)) : null;
  }

  function finish() {
    const first = !K.store.get().profile;
    K.store.update(s => {
      if (opts.only !== 'avatar') {
        const { avatar, visits, ...profile } = d;
        s.profile = profile;
        Object.entries(visits || {}).forEach(([id, code]) => {
          const dt = visitDate(code); if (!dt) return;
          const rec = s.echeances[id] || (s.echeances[id] = {});
          if (!rec.last || dt > rec.last) rec.last = dt;
        });
      }
      s.avatar = d.avatar;
    });
    K.app.boot();
    if (first) setTimeout(() => K.ui.toast('Bienvenue ! Pince l’écran pour découvrir ton sentier.'), 500);
  }

  K.onboarding = { start };
})();
