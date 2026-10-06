// Demo profile: lets visitors (e.g. someone reviewing the project) see the coach, skill map and
// progress populated without practising first. It's generated deterministically, clearly
// labelled with a banner, and replaced the moment you choose "Start my own".
(function () {
  const store = QT.store, DAY = 864e5;

  // Accuracy by topic for the sample learner: strong on sequences and dice, weak on time series.
  const PROFILE = { dice: 0.88, cards: 0.8, bayes: 0.52, ev: 0.74, walks: 0.6, markov: 0.48, options: 0.42, puzzles: 0.7, sequences: 0.95, dist: 0.84, moments: 0.7, inference: 0.5, regression: 0.66, finance: 0.6, timeseries: 0.35 };
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
    // Histories for the progress charts: a learner who is slowly improving, with noise.
    const ago = (i, n) => new Date(now - (n - i) * DAY * 0.8).toISOString();
    const trend = (n, from, to, noise) => Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1) + (rnd() - 0.5) * noise);
    const fullNet = trend(8, 34, 52, 8).map(Math.round);
    s.mental = {
      zetamac: { best: 38, runs: trend(6, 24, 37, 5).map((c, i) => ({ date: ago(i, 6), correct: Math.round(c), wrong: 0 })) },
      full: { best: Math.max(...fullNet), runs: fullNet.map((x, i) => ({ date: ago(i, 8), correct: x + 9, wrong: 9 })) },
    };
    const pnl = trend(6, -6, 4, 6).map(Math.round);
    s.market = { games: 6, total: pnl.reduce((a, b) => a + b, 0), best: Math.max(...pnl), history: pnl.map((x, i) => ({ date: ago(i, 6), pnl: x, midErr: 1 })) };
    const hits = [6, 7, 7, 8, 8, 9];
    s.estimate = { rounds: 6, best: 4.1, hits: hits.reduce((a, b) => a + b, 0), n: 60, history: hits.map((h, i) => ({ date: ago(i, 6), score: 2 + h / 4, hits: h })) };
    s.quote = { rounds: 4, n: 20, hits: 13, withFlow: 27, requotes: 40, pnl: -18, history: trend(4, -12, 3, 4).map((x, i) => ({ date: ago(i, 4), pnl: x, hits: 3, n: 5 })) };
    const eff = trend(5, 0.35, 0.85, 0.15);
    s.kelly = { games: 5, best: Math.max(...eff), history: eff.map((e, i) => ({ date: ago(i, 5), eff: e, final: 100 + 80 * e, kelly: 180 })) };
    const fg = trend(5, -40, 25, 30).map(Math.round);
    s.figgie = { games: 5, total: fg.reduce((a, b) => a + b, 0), best: Math.max(...fg), wins: 2, history: fg.map((x, i) => ({ date: ago(i, 5), pnl: x })) };
    s.oa = { seq: { best: 13, runs: [9, 11, 10, 13].map((x, i) => ({ date: ago(i, 4), score: x })) }, span: { best: 7, runs: [6, 6, 7].map((x, i) => ({ date: ago(i, 3), score: x })) } };
    s.talk = { sessions: 3, history: [3, 4, 5].map((x, i) => ({ date: ago(i, 3), id: QT.bank[i].id, secs: 240, score: x, of: 6 })) };
    // Mental-maths speed by type: fractions are the sample learner's slow spot.
    const sp = (median, miss, n = 20) => ({ times: Array.from({ length: n }, () => Math.round(median * 1000 * (0.7 + rnd() * 0.6))), oks: Array.from({ length: n }, () => (rnd() < miss ? 0 : 1)) });
    s.speed = { frac: sp(9.5, 0.3), mul2: sp(7.8, 0.15), pct: sp(5.2, 0.1), sq: sp(4.5, 0.05), div: sp(5.8, 0.1), sub3: sp(4.1, 0.05) };
    for (const [i, d] of s.days.slice(1).entries()) s.daily[d] = { r: [1, 1, 0, 1, i % 3 ? 1 : 0], ms: 300000, start: now - (i + 1) * DAY, done: true };
    s.cases = { ltcm: { results: [true, true] }, 'black-monday': { results: [true, false] } };
    s.bank = { 'js-reroll': { results: [true, true, false] }, 'sig-three-dice': { results: [true] }, 'opt-tennis': { results: [true, true] } };
    for (const [t, gi] of weak.slice(0, 4)) QT.mistakes.add(`${t.name} · ${t.skills[gi]}`, t.gens[gi]());
    for (const m of QT.mistakes.all()) m.due = now - 1;
    s.demo = true;
    store.save();
  }

  QT.demo = { load };
})();
