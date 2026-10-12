(function () {
  const z = n => String(n).padStart(2, '0');
  const D = {
    today() { const d = new Date(); d.setHours(12, 0, 0, 0); return d; },
    parse(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); },
    iso(d) { return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); },
    todayISO() { return D.iso(D.today()); },
    addMonths(d, n) {
      const r = new Date(d); const day = r.getDate(); r.setDate(1); r.setMonth(r.getMonth() + n);
      const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(); r.setDate(Math.min(day, last)); return r;
    },
    addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; },
    diffDays(a, b) { return Math.round((b - a) / 86400000); },
    age(birth, at) {
      at = at || D.today(); let a = at.getFullYear() - birth.getFullYear();
      const m = at.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) a--; return a;
    },
    birthday(birth, years) { return new Date(birth.getFullYear() + years, birth.getMonth(), birth.getDate(), 12); },
    fr(d) { return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); },
    short(d) { return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); },
    relative(d) {
      const n = D.diffDays(D.today(), d);
      if (n === 0) return "aujourd'hui";
      if (n === 1) return 'demain';
      if (n < 0) { const a = -n; if (a === 1) return 'depuis 1 jour'; if (a < 45) return `depuis ${a} jours`; const mo = Math.round(a / 30.4); return mo < 12 ? `depuis ${mo} mois` : `depuis ${Math.round(mo / 12)} an${mo >= 18 ? 's' : ''}`; }
      if (n < 45) return `dans ${n} jours`;
      const m = Math.round(n / 30.4);
      if (m < 12) return `dans ${m} mois`;
      const y = Math.round(m / 12); return `dans ${y} an${y > 1 ? 's' : ''}`;
    }
  };
  K.dates = D;
})();
