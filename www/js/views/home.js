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
    if (!st) return `<a class="card shortcut daily-card" href="#/plan"><b>Interview coming up?</b><span>Make a prep plan for the firm and date: a daily checklist and a countdown.</span></a>`;
    const name = QT.firms[st.p.firm]?.name || st.p.firm;
    if (st.left < 0) return `<a class="card shortcut daily-card" href="#/plan"><b>How did ${name} go?</b><span>Add the questions you were asked</span></a>`;
    return `<a class="card shortcut primary daily-card" href="#/plan"><b>${name} interview ${st.left === 0 ? 'today' : st.left === 1 ? 'tomorrow' : `in ${st.left} days`}</b><span>Today's prep: ${st.done}/${st.tasks.length} done</span></a>`;
  }

  // Your bests in the timed arithmetic games you've played, e.g. "Zetamac 41 · 60 in 6: 23 net".
  function mentalBests(s) {
    const m = s.mental, best = (k) => m[k]?.best ?? null, out = [];
    if (best('zetamac') !== null) out.push(`Zetamac best ${QT.flair.flap(best('zetamac'))}`);
    if (QT.mental.best80() !== null) out.push(`80 in 8: ${QT.flair.flap(QT.mental.best80())} net`);
    if (best('ft60') !== null) out.push(`60 in 6: ${QT.flair.flap(best('ft60'))} net`);
    return out.join(' · ');
  }

  // Progress lives in this browser only. After a week of practice with no backup in a month (and
  // no automatic backup file), suggest one. The Android app keeps its own durable copy.
  function backupNudge(s) {
    if (s.demo || QT.platform.native || s.days.length < 7) return '';
    if (QT.backupFile && QT.backupFile.status() === 'on') return '';
    if (s.lastExport && Date.now() - s.lastExport < 30 * 864e5) return '';
    return `<p class="small backup-nudge">Your progress is saved in this browser only${s.lastExport ? ', and your last backup is over a month old' : ''}. <a href="#/more">Export a backup</a> so you can't lose ${s.days.length} days of practice.</p>`;
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
          <h2 class="starts-head">Where do you want to start?</h2>
          <div class="starts">
            <a class="card shortcut primary" href="#/review"><b>Try a question</b><span>Jump straight in. The coach learns from your first answer.</span></a>
            <a class="card shortcut" href="#/plan"><b>Plan for an interview</b><span>Pick the firm and date for a daily checklist and a countdown.</span></a>
            <a class="card shortcut" href="#/handbook"><b>Learn from the beginning</b><span>The handbook: a course from the basics up.</span></a>
            <a class="card shortcut" href="#/coach/diagnostic"><b>Find your gaps</b><span>A 15-minute diagnostic, one question from each topic.</span></a>
          </div>
          <div class="row" style="margin-top:16px"><button type="button" class="ghost" id="demo">Explore with sample data</button><a href="#/tour">Take the 1-minute tour</a></div>
        </div>
        ${QT.plan.todayStatus() ? planCard() : ''}
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
      </div>
      <p class="lede">${streak > 1 ? `${streak}-day streak. Keep it going.` : streak === 1 ? 'You practised today. Nice.' : 'Pick up where you left off.'}</p>

      <div class="home-grid">
      <div class="home-main">
      ${top ? `<div class="card upnext">
        <div class="eyebrow">Up next</div>
        <h2>${top.title}</h2>
        ${top.voice ? `<p class="voice">“${top.voice}”</p>` : ''}
        <p>${top.why}</p>
        <a class="btn btn-lg" href="${top.href}">${top.label}</a>
      </div>` : ''}

      ${more.length ? `<h2>Also recommended</h2><div class="recs">${more.slice(0, 2).map(U.recCard).join('')}</div>
      <p class="more-link"><a href="#/coach">See your full coaching plan →</a></p>` : ''}
      </div>

      <aside class="home-side" aria-label="Today and your progress">
      ${planCard()}
      <a class="card shortcut${today?.done ? '' : ' primary'} daily-card" href="#/daily"><b>Daily challenge${today?.done ? `: ${today.r.filter(Boolean).length}/5 today ✓` : ''}</b><span>${today?.done ? 'Done for today. Share your result or come back tomorrow.' : `5 questions, the same for everyone today${dstreak ? ` · ${dstreak}-day streak` : ''}`}</span></a>

      <section class="card side-card">
        <h2>Your progress <a class="h-link" href="#/progress">Charts →</a></h2>
        <div class="tiles tiles-2">
          <a class="tile" href="#/coach"><div class="v">${strong}<span class="of">/${QT.coach.allIds().length}</span></div><div class="k">skills strong</div></a>
          <div class="tile"><div class="v">${attempts}</div><div class="k">topic questions answered</div></div>
          <div class="tile"><div class="v">${attempts ? U.pctStr(correct / attempts) : '–'}</div><div class="k">accuracy, all time</div></div>
          <div class="tile"><div class="v">${streak}</div><div class="k">day streak</div></div>
        </div>
        ${s.log.length ? `<div class="week"><span class="small">Accuracy, last 7 days</span>${candles(s.log)}</div>` : ''}
      </section>
      ${backupNudge(s)}
      </aside>

      <div class="home-more">
      <h2>Keep sharp</h2>
      <div class="shortcuts">
        <a class="card shortcut" href="#/bank"><b>Interview questions</b><span>${U.bankDone()}/${QT.bank.length} done${U.bankCounts().unsure ? ` · ${U.bankCounts().unsure} unsure` : ''} · mock interviews</span></a>
        <a class="card shortcut" href="#/mental"><b>Mental maths</b><span>${mentalBests(s) || 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/figgie"><b>Figgie</b><span>${s.figgie.games ? `${s.figgie.games} games · avg P&amp;L ${f(s.figgie.total / s.figgie.games)}` : "Jane Street's trading card game"}</span></a>
        <a class="card shortcut" href="#/quote"><b>Make me a market</b><span>${s.quote.n ? `${Math.round((100 * s.quote.hits) / s.quote.n)}% of final markets right` : 'The live interview format'}</span></a>
        <a class="card shortcut" href="#/kelly"><b>Bet sizing</b><span>${s.kelly.best !== null ? `best sizing score ${Math.round(s.kelly.best * 100)}%` : 'How much would you stake?'}</span></a>
        <a class="card shortcut" href="#/market"><b>Market making</b><span>${s.market.games ? `${s.market.games} games · avg P&amp;L ${f(s.market.total / s.market.games)}` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/estimate"><b>Estimation</b><span>${s.estimate.n ? `${Math.round((100 * s.estimate.hits) / s.estimate.n)}% of ranges correct` : 'Not tried yet'}</span></a>
        ${featured ? `<a class="card shortcut" href="#/case/${featured.id}"><b>Case of the day</b><span>${featured.title} (${featured.year})</span></a>` : ''}
        <a class="card shortcut" href="#/roadmap"><b>Roadmap</b><span>Books, projects and milestones</span></a>
      </div>
      </div>
      </div>`;
  }

  QT.views = Object.assign(QT.views || {}, { '': home });
})();
