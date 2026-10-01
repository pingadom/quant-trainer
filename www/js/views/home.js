// Home: a welcome with one clear first step for new users; "Up next" and progress for everyone else.
(function () {
  const store = QT.store, f = QT.fmtNum, U = QT.ui;

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
        </div>
        <h2>How it works</h2>
        <ol class="steps">
          <li><b>Diagnose.</b> One question from each of the ${QT.topics.length} topics shows where you stand.</li>
          <li><b>Practise what the coach suggests.</b> It tracks ${QT.coach.allIds().length} skills, spots the kind of mistakes you make, and picks the next exercise.</li>
          <li><b>Test yourself for real.</b> Timed mental maths, a market-making game, and mock interviews built from reported questions.</li>
        </ol>
        <p class="small">Everything is saved on this device. No account needed.</p>`;
      return;
    }

    const [top, ...more] = QT.coach.recommend();
    el.innerHTML = `
      <h1>${hello}</h1>
      <p class="lede">${streak > 1 ? `${streak}-day streak. Keep it going.` : streak === 1 ? 'You practised today. Nice.' : 'Pick up where you left off.'}</p>

      ${top ? `<div class="card upnext">
        <div class="eyebrow">Up next</div>
        <h2>${top.title}</h2>
        <p>${top.why}</p>
        <a class="btn btn-lg" href="${top.href}">${top.label}</a>
      </div>` : ''}

      ${more.length ? `<h2>Also recommended</h2><div class="recs">${more.slice(0, 2).map(U.recCard).join('')}</div>
      <p><a href="#/coach">See your full coaching plan →</a></p>` : ''}

      <h2>Your progress</h2>
      <div class="tiles">
        <a class="tile" href="#/coach"><div class="v">${strong}<span class="of">/${QT.coach.allIds().length}</span></div><div class="k">skills strong</div></a>
        <div class="tile"><div class="v">${attempts}</div><div class="k">problems solved</div></div>
        <div class="tile"><div class="v">${attempts ? U.pctStr(correct / attempts) : '–'}</div><div class="k">accuracy</div></div>
        <div class="tile"><div class="v">${streak}</div><div class="k">day streak</div></div>
      </div>

      <h2>Keep sharp</h2>
      <div class="shortcuts">
        <a class="card shortcut" href="#/bank"><b>Interview questions</b><span>${U.bankDone()}/${QT.bank.length} done · mock interviews</span></a>
        <a class="card shortcut" href="#/mental"><b>Mental maths</b><span>${s.mental.full?.best != null ? `80-in-8 best: ${s.mental.full.best} net` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/market"><b>Market making</b><span>${s.market.games ? `${s.market.games} games · avg P&amp;L ${f(s.market.total / s.market.games)}` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/estimate"><b>Estimation</b><span>${s.estimate.n ? `${Math.round((100 * s.estimate.hits) / s.estimate.n)}% of ranges correct` : 'Not tried yet'}</span></a>
        ${featured ? `<a class="card shortcut" href="#/case/${featured.id}"><b>Case of the day</b><span>${featured.title} (${featured.year})</span></a>` : ''}
        <a class="card shortcut" href="#/roadmap"><b>Roadmap</b><span>Books, projects and milestones</span></a>
      </div>`;
  }

  QT.views = Object.assign(QT.views || {}, { '': home });
})();
