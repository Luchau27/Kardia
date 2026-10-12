/* Inviter un ami (rendez-vous à deux, découverte de Kardia) et rappels dans l'agenda. */
(function () {
  const ui = K.ui, D = K.dates;
  const appURL = () => location.origin + location.pathname;
  async function share(text, title) {
    if (navigator.share) { try { await navigator.share({ title, text }); return; } catch (e) { return; } }
    try { await navigator.clipboard.writeText(text); ui.toast('Message copié, colle-le à ton ami.'); } catch (e) { ui.toast('Partage impossible sur cet appareil.'); }
  }
  function invite(what, date) {
    const p = K.store.get().profile || {};
    share(`${p.pseudo || 'Moi'} t’invite : ${what}${date ? ' le ' + D.fr(date) : ''}, on y va ensemble ? C’est plus simple à deux 💪 Et rejoins-moi sur Kardia : ${appURL()}`, 'On y va ensemble ?');
  }
  function inviteApp() {
    const s = K.store.get();
    share(`Je joue à Kardia, un jeu qui transforme nos rendez-vous santé en aventure. Rejoins-moi : ${appURL()}${s.rank && s.rank.uid ? `\nMon code ami : ${s.rank.uid}` : ''}`, 'Rejoins-moi sur Kardia');
  }

  /* Rappel au format agenda (.ics), compatible iPhone, Android et ordinateur. */
  function reminder(title, date, note) {
    const d = date || D.addDays(D.today(), 7);
    const ymd = D.iso(d).replace(/-/g, ''), stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const esc = t => String(t).replace(/[,;\\]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kardia//FR', 'BEGIN:VEVENT', `UID:${Date.now()}@kardia`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd}`, `SUMMARY:${esc('Kardia · ' + title)}`, `DESCRIPTION:${esc(note || 'Une étape de ton sentier Kardia.')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Rappel Kardia', 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const file = new File([ics], 'kardia-rappel.ics', { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Rappel Kardia' }).catch(() => {}); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = 'kardia-rappel.ics'; document.body.appendChild(a); a.click(); a.remove();
    ui.toast('Ouvre le fichier pour l’ajouter à ton agenda.');
  }
  K.duo = { invite, inviteApp, reminder, share };
})();
