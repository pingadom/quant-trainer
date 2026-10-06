// Home: a welcome with one clear first step for new users; "Up next" and progress for everyone else.
(function () {
  const store = QT.store, f = QT.fmtNum, U = QT.ui;

  // Accuracy over the last 7 days as candlesticks: each day opens at the previous practised day's
  // accuracy and closes at its own (filled = up). Days without practice show a dot.
  function candles(log) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const xs = log.filter((x) => x.t >= d.getTime() && x.t < d.getTime() + 864e5);
      days.push({ d, acc: xs.length ? (100 * xs.filter((x) => x.ok).length) / xs.length : null });
    }
    const before = log.filter((x) => x.t < days[0].d.getTime()).slice(-20);
    let prev = before.length ? (100 * before.filter((x) => x.ok).length) / before.length : null;
    const px = (v) => (v * 40) / 100;
    const label = [];
    const bars = days.map(({ d, acc }) => {
      const day = d.toLocaleDateString('en-GB', { weekday: 'short' });
      if (acc === null) { label.push(`${day}: no practice`); return '<span class="candle none"><span class="body"></span></span>'; }
      const open = prev ?? acc, lo = Math.min(open, acc), hi = Math.max(open, acc), up = acc >= open;
      prev = acc;
      label.push(`${day}: ${Math.round(acc)}%`);
      return `<span class="candle ${up ? 'up' : 'down'}"><span class="wick" style="bottom:${px(Math.max(0, lo - 6))}px;height:${px(Math.min(100, hi + 6) - Math.max(0, lo - 6))}px"></span><span class="body" style="bottom:${px(lo)}px;height:${Math.max(3, px(hi - lo))}px"></span></span>`;
    });
    return `<span class="candles" role="img" aria-label="Accuracy over the last 7 days. ${label.join(', ')}">${bars.join('')}</span>`;
  }

  // Countdown to an interview with today's prep progress, or an invitation to make a plan.
  function planCard() {
    const st = QT.plan.todayStatus();
    if (!st) return `<p class="small" style="margin:14px 0 0">Interview coming up? <a href="#/plan">Make a prep plan</a> for the firm and date.</p>`;
    const name = QT.firms[st.p.firm]?.name || st.p.firm;
    if (st.left < 0) return `<a class="card shortcut daily-card" href="#/plan"><b>How did ${name} go?</b><span>Add the questions you were asked</span></a>`;
    return `<a class="card shortcut primary daily-card" href="#/plan"><b>${name} interview ${st.left === 0 ? 'today' : st.left === 1 ? 'tomorrow' : `in ${st.left} days`}</b><span>Today's prep: ${st.done}/${st.tasks.length} done</span></a>`;
  }

  function home(el) {
    const s = store.get();
    const attempts = Object.values(s.topics).reduce((a, t) => a + t.attempts, 0);
    const correct = Object.values(s.topics).reduce((a, t) => a + t.correct, 0);
    const strong = QT.coach.allIds().filter((id) => QT.coach.stat(id).status === 'strong').length;
    const todo = QT.cases.filter((c) => U.caseProgress(c).answered < c.questions.length);
    const featured = todo.length ? todo[new Date().getDate() % todo.length] : null;
    const hour = new Date().getHours(), hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const streak = store.streak();

    if (store.isEmpty()) {
      el.innerHTML = `
        <div class="hero">
          <div class="eyebrow">Welcome</div>
          <h1>Get ready for quant trading interviews</h1>
          <p>Probability, statistics, mental maths and market making, plus real questions candidates report from firms like Jane Street, SIG and Optiver.</p>
          <a class="btn btn-lg" href="#/coach/diagnostic">Start with a 15-minute diagnostic</a>
          <a class="hero-alt" href="#/review">or jump straight into practice →</a>
          <p class="small" style="margin:14px 0 0">New here? <a href="#/tour">Take the 1-minute tour</a>.</p>
        </div>
        ${QT.plan.todayStatus() ? planCard() : ''}
        <p class="small">Just looking around? <button type="button" class="link" id="demo">See it with sample data</button> to explore the coach and skill map without practising first.</p>
        <h2>How it works</h2>
        <ol class="steps">
          <li><b>Diagnose.</b> One question from each of the ${QT.topics.length} topics shows where you stand.</li>
          <li><b>Practise what the coach suggests.</b> It tracks ${QT.coach.allIds().length} skills, spots the kind of mistakes you make, and picks the next exercise.</li>
          <li><b>Test yourself for real.</b> Timed mental maths and online-test practice, trading games (including Jane Street's Figgie), and mock interviews you answer out loud.</li>
        </ol>
        <p class="small">Everything is saved on this device. No account needed.</p>`;
      el.querySelector('#demo').addEventListener('click', () => {
        QT.demo.load();
        QT.route();
      });
      return;
    }

    const [top, ...more] = QT.coach.recommend();
    const today = s.daily[QT.dayKey(new Date())], dstreak = QT.daily.streak();
    el.innerHTML = `
      <div class="greet">
        <div><div class="eyebrow">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>${hello}</h1></div>
        ${s.log.length ? `<div class="week">${candles(s.log)}<span class="small mono">accuracy, last 7 days</span></div>` : ''}
      </div>
      <p class="lede">${streak > 1 ? `${streak}-day streak. Keep it going.` : streak === 1 ? 'You practised today. Nice.' : 'Pick up where you left off.'}</p>

      ${top ? `<div class="card upnext">
        <div class="eyebrow">Up next</div>
        <h2>${top.title}</h2>
        ${top.voice ? `<p class="voice">“${top.voice}”</p>` : ''}
        <p>${top.why}</p>
        <a class="btn btn-lg" href="${top.href}">${top.label}</a>
      </div>` : ''}

      ${more.length ? `<h2>Also recommended</h2><div class="recs">${more.slice(0, 2).map(U.recCard).join('')}</div>
      <p><a href="#/coach">See your full coaching plan →</a></p>` : ''}

      ${planCard()}
      <a class="card shortcut${today?.done ? '' : ' primary'} daily-card" href="#/daily"><b>Daily challenge${today?.done ? `: ${today.r.filter(Boolean).length}/5 today ✓` : ''}</b><span>${today?.done ? 'Done for today. Share your result or come back tomorrow.' : `5 questions, the same for everyone today${dstreak ? ` · ${dstreak}-day streak` : ''}`}</span></a>

      <h2>Your progress <a class="h-link" href="#/progress">Charts →</a></h2>
      <div class="tiles">
        <a class="tile" href="#/coach"><div class="v">${strong}<span class="of">/${QT.coach.allIds().length}</span></div><div class="k">skills strong</div></a>
        <div class="tile"><div class="v">${attempts}</div><div class="k">problems solved</div></div>
        <div class="tile"><div class="v">${attempts ? U.pctStr(correct / attempts) : '–'}</div><div class="k">accuracy</div></div>
        <div class="tile"><div class="v">${streak}</div><div class="k">day streak</div></div>
      </div>

      <h2>Keep sharp</h2>
      <div class="shortcuts">
        <a class="card shortcut" href="#/bank"><b>Interview questions</b><span>${U.bankDone()}/${QT.bank.length} done · mock interviews</span></a>
        <a class="card shortcut" href="#/mental"><b>Mental maths</b><span>${QT.mental.best80() !== null ? `80-in-8 best ${QT.flair.flap(QT.mental.best80())} net` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/figgie"><b>Figgie</b><span>${s.figgie.games ? `${s.figgie.games} games · avg P&amp;L ${f(s.figgie.total / s.figgie.games)}` : "Jane Street's trading card game"}</span></a>
        <a class="card shortcut" href="#/quote"><b>Make me a market</b><span>${s.quote.n ? `${Math.round((100 * s.quote.hits) / s.quote.n)}% of final markets right` : 'The live interview format'}</span></a>
        <a class="card shortcut" href="#/kelly"><b>Bet sizing</b><span>${s.kelly.best !== null ? `best sizing score ${Math.round(s.kelly.best * 100)}%` : 'How much would you stake?'}</span></a>
        <a class="card shortcut" href="#/market"><b>Market making</b><span>${s.market.games ? `${s.market.games} games · avg P&amp;L ${f(s.market.total / s.market.games)}` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/estimate"><b>Estimation</b><span>${s.estimate.n ? `${Math.round((100 * s.estimate.hits) / s.estimate.n)}% of ranges correct` : 'Not tried yet'}</span></a>
        ${featured ? `<a class="card shortcut" href="#/case/${featured.id}"><b>Case of the day</b><span>${featured.title} (${featured.year})</span></a>` : ''}
        <a class="card shortcut" href="#/roadmap"><b>Roadmap</b><span>Books, projects and milestones</span></a>
      </div>`;
  }

  QT.views = Object.assign(QT.views || {}, { '': home });
})();
