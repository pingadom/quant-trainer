// Roadmap: staged plan with auto-tracked milestones.
(function () {
  const store = QT.store, f = QT.fmtNum, U = QT.ui;

  const trackStats = (track) => {
    const ts = QT.topics.filter((t) => t.track === track).map((t) => store.get().topics[t.id] || { attempts: 0, correct: 0 });
    const a = ts.reduce((s, t) => s + t.attempts, 0), c = ts.reduce((s, t) => s + t.correct, 0);
    return { a, acc: a ? c / a : 0 };
  };

  const ROADMAP = [
    {
      stage: '1 · Probability fluency',
      items: [
        { id: 'p100', text: 'Solve 150 interview-track problems at 80%+ accuracy', auto: () => { const s = trackStats('interview'); return { done: s.a >= 150 && s.acc >= 0.8, note: `${s.a}/150 · ${U.pctStr(s.acc)}` }; } },
        { id: 'mosteller', text: 'Work through "Fifty Challenging Problems in Probability" (Mosteller)' },
        { id: 'sprint', text: 'Score 40+ on Zetamac (default settings)', auto: () => { const b = store.get().mental.zetamac?.best ?? 0; return { done: b >= 40, note: `best ${b}` }; } },
      ],
    },
    {
      stage: '2 · Statistics & inference',
      items: [
        { id: 'found', text: 'Reach 80%+ recent accuracy on every foundations topic (20+ attempts each)', auto: () => { const ts = QT.topics.filter((t) => t.track === 'foundations').map((t) => QT.mastery(t.id)); const ok = ts.filter((m) => m.attempts >= 20 && m.recentAcc >= 0.8).length; return { done: ok === ts.length, note: `${ok}/${ts.length} topics` }; } },
        { id: 'wasserman', text: 'Read "All of Statistics" (Wasserman), chapters 1–13' },
        { id: 'pyproj', text: 'Python project: download real price data, compute returns, vol, beta and autocorrelation with pandas' },
      ],
    },
    {
      stage: '3 · Markets & trading intuition',
      items: [
        { id: 'cases', text: 'Work through every case study and be able to explain each in two minutes', auto: () => ({ done: U.casesDone() === QT.cases.length, note: `${U.casesDone()}/${QT.cases.length}` }) },
        { id: 'calib', text: 'Reach 80–95% calibration over 50+ estimation questions', auto: () => { const e = store.get().estimate; const c = e.n ? e.hits / e.n : 0; return { done: e.n >= 50 && c >= 0.8 && c <= 0.95, note: `${e.n}/50 · ${e.n ? Math.round(c * 100) + '%' : '–'}` }; } },
        { id: 'mm20', text: 'Play 20 market-making games with a positive average P&L', auto: () => { const m = store.get().market; return { done: m.games >= 20 && m.total > 0, note: `${m.games}/20 · avg ${m.games ? f(m.total / m.games) : '–'}` }; } },
        { id: 'natenberg', text: 'Read "Option Volatility and Pricing" (Natenberg)' },
        { id: 'hull', text: 'Read "Options, Futures, and Other Derivatives" (Hull), chapters on pricing and the Greeks' },
        { id: 'backtest', text: 'Build a simple backtester and test a mean-reversion strategy; report Sharpe, drawdown and t-stat honestly' },
      ],
    },
    {
      stage: '4 · Interview readiness',
      items: [
        { id: 'green', text: 'Finish "A Practical Guide to Quantitative Finance Interviews" (Zhou, the "Green Book")' },
        { id: 'heard', text: 'Finish "Heard on the Street" (Crack)' },
        { id: 'full55', text: 'Score 55+ net on the 80-in-8 test (commonly reported pass line; aim for 70+)', auto: () => { const b = QT.mental.best80() ?? 0; return { done: b >= 55, note: `best ${b}` }; } },
        { id: 'bank', text: 'Complete every question in the interview bank', auto: () => ({ done: U.bankDone() === QT.bank.length, note: `${U.bankDone()}/${QT.bank.length}` }) },
        { id: 'jsvideo', text: "Watch Jane Street's official mock trading interview video (janestreet.com/trading-interviews)" },
        { id: 'mock', text: 'Do 5 mock interviews out loud with a friend: explain your reasoning, not just the answer' },
        { id: 'apply', text: 'Apply for spring weeks and internships at trading firms (these open early, often in the autumn before)' },
      ],
    },
  ];

  function roadmap(el) {
    const s = store.get();
    el.innerHTML = `
      <h1>Roadmap to quant trader</h1>
      <p class="lede">Four stages that build on each other. Items with a counter track themselves from your practice; tick the rest off yourself.</p>
      ${ROADMAP.map((st) => `
        <div class="card stage">
          <h3>${st.stage}</h3>
          ${st.items.map((it) => {
            const a = it.auto && it.auto();
            const done = a ? a.done : !!s.roadmap[it.id];
            return `<label class="check ${done ? 'done' : ''}">
              <input type="checkbox" data-id="${it.id}" ${done ? 'checked' : ''} ${a ? 'disabled' : ''}>
              <span class="t">${it.text}</span>
              ${a ? `<span class="auto">${a.note}</span>` : ''}
            </label>`;
          }).join('')}
        </div>`).join('')}`;
    el.querySelectorAll('input[data-id]:not([disabled])').forEach((cb) =>
      cb.addEventListener('change', () => {
        s.roadmap[cb.dataset.id] = cb.checked;
        store.save();
        cb.closest('.check').classList.toggle('done', cb.checked);
      })
    );
  }

  QT.views = Object.assign(QT.views || {}, { roadmap });
})();
