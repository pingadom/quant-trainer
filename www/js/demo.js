// Demo profile: lets visitors (e.g. someone reviewing the project) see the coach, skill map and
// progress populated without practising first. It's generated deterministically, clearly
// labelled with a banner, and replaced the moment you choose "Start my own".
(function () {
  const store = QT.store, DAY = 864e5;

  // Accuracy by topic for the sample learner: strong on sequences and dice, weak on time series.
  const PROFILE = { dice: 0.88, cards: 0.8, bayes: 0.52, ev: 0.74, walks: 0.6, options: 0.42, puzzles: 0.7, sequences: 0.95, dist: 0.84, moments: 0.7, inference: 0.5, regression: 0.66, finance: 0.6, timeseries: 0.35 };
  const ERR_MIX = [['method', 5], ['complement', 4], ['precision', 3], ['scale', 3], ['factor2', 2], ['square', 1]];

  function load() {
    store.reset();
    let seed = 20261001; // Park–Miller LCG: same demo every time (and in screenshots)
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pickErr = () => {
      let r = rnd() * ERR_MIX.reduce((a, [, w]) => a + w, 0);
      for (const [type, w] of ERR_MIX) if ((r -= w) <= 0) return type;
      return 'method';
    };

    const weak = [];
    for (const t of QT.topics) {
      t.skills.forEach((name, gi) => {
        if (rnd() < 0.15) return; // some skills not tried yet
        const id = QT.coach.idOf(t.id, gi), n = 3 + Math.floor(rnd() * 7);
        let misses = 0;
        for (let i = 0; i < n; i++) {
          const ok = rnd() < PROFILE[t.id] + (rnd() - 0.5) * 0.25;
          QT.coach.observe(id, ok, t.target * (0.6 + rnd()) * 1000);
          store.recordAttempt(t.id, ok);
          if (!ok) { misses++; QT.coach.logError(pickErr(), id, `${t.name} · ${name}`); }
        }
        if (misses * 2 > n) weak.push([t, gi]);
      });
    }

    const s = store.get(), now = Date.now();
    s.days = Array.from({ length: 9 }, (_, i) => {
      const d = new Date(now - i * DAY);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    s.mental = { sprint: { best: 17, runs: [] }, full: { best: 48, runs: [{ date: new Date(now - 2 * DAY).toISOString(), correct: 58, wrong: 10 }] } };
    s.market = { games: 6, total: -4, best: 3, history: [] };
    s.estimate = { rounds: 3, best: 4.1, hits: 21, n: 30 };
    s.cases = { ltcm: { results: [true, true] }, 'black-monday': { results: [true, false] } };
    s.bank = { 'js-reroll': { results: [true, true, false] }, 'sig-three-dice': { results: [true] }, 'opt-tennis': { results: [true, true] } };
    for (const [t, gi] of weak.slice(0, 4)) QT.mistakes.add(`${t.name} · ${t.skills[gi]}`, t.gens[gi]());
    for (const m of QT.mistakes.all()) m.due = now - 1;
    s.demo = true;
    store.save();
  }

  QT.demo = { load };
})();
