// Coach: recommendations, error habits and the skill map; coaching sessions, the diagnostic and drills.
(function () {
  const store = QT.store, U = QT.ui;

  function coach(el, mode) {
    if (mode === 'session') return session(el);
    if (mode === 'diagnostic') return diagnostic(el);
    const recs = QT.coach.recommend();
    const ids = QT.coach.allIds(), counts = {};
    ids.forEach((id) => { const s = QT.coach.stat(id).status; counts[s] = (counts[s] || 0) + 1; });
    const habits = QT.coach.habits(50), focus = QT.coach.focus().map((id) => QT.coach.parse(id).name);
    const fresh = (counts.unseen || 0) === ids.length;

    el.innerHTML = `
      <h1>Coach</h1>
      <p class="lede">I watch every answer: which skills you miss, what kind of mistake it was, and how long you take. This page turns that into what to practise next.</p>

      ${fresh ? '' : `<div class="card rec">
        <div class="rec-body"><b>10-question coaching session</b><p class="small">Targets: ${focus.slice(0, 4).join(', ')}${focus.length > 4 ? ` and ${focus.length - 4} more` : ''}. It adapts as you go.</p></div>
        <a class="btn" href="#/coach/session">Start</a></div>`}

      <h2>Recommended next</h2>
      <div class="recs">${recs.slice(0, 6).map(U.recCard).join('')}</div>

      <h2>Error habits</h2>
      ${habits.length ? `<div class="card">${habits.map((h) => `
        <div class="habit">
          <div class="habit-row"><span>${h.label}</span><span class="mono">${h.n}</span></div>
          <div class="bar"><i style="width:${Math.round((100 * h.n) / habits[0].n)}%"></i></div>
          <p class="small">${h.advice}</p>
        </div>`).join('')}<p class="small">From your last ${Math.min(store.get().errors.length, 50)} mistakes.</p></div>`
      : `<div class="card"><p class="small" style="margin:0">No mistakes yet. When you get one wrong, I'll work out what kind of slip it was: a complement mix-up, % vs decimal, a factor of 2, variance vs SD, rounding, and so on.</p></div>`}

      <h2>Skill map</h2>
      <p class="small">Each of the ${ids.length} skills, by your recent accuracy. Tap one to drill it.</p>
      <div class="legend" role="list">${Object.entries(U.STATUS).map(([k, v]) => `<span class="sk st-${k}" role="listitem"><i aria-hidden="true">${v.icon}</i>${v.label} · ${counts[k] || 0}</span>`).join('')}</div>
      ${QT.topics.map((t) => `
        <div class="skill-topic">
          <h3><a href="#/topic/${t.id}">${t.name}</a></h3>
          <div class="skill-chips">${t.skills.map((_, gi) => U.skillChip(t, gi)).join('')}</div>
        </div>`).join('')}`;
  }

  function session(el) {
    const focus = QT.coach.focus();
    el.innerHTML = `
      <a class="back" href="#/coach">← Coach</a>
      <h1>Coaching session</h1>
      <p class="lede">10 questions on: ${focus.map((id) => QT.coach.parse(id).name).join(', ')}. Miss one and you'll usually get another like it straight away.</p>
      <div id="qbox"></div>`;
    U.questionCard(el.querySelector('#qbox'), QT.coach.source(focus, { limit: 10, label: (i) => `Q${i}/10` }), (box, r) => {
      box.innerHTML = `<div class="card"><h3>Session done: ${r.right}/${r.solved} correct</h3><p class="small">Your recommendations have been updated.</p></div>
        <div class="recs">${QT.coach.recommend().slice(0, 3).map(U.recCard).join('')}</div>
        <div class="row" style="margin-top:12px"><a class="btn ghost" href="#/coach">Back to coach</a></div>`;
    });
  }

  function diagnostic(el) {
    el.innerHTML = `
      <a class="back" href="#/coach">← Coach</a>
      <h1>Diagnostic</h1>
      <p class="lede">One question from each of the ${QT.topics.length} topics. Answer as you would in an interview, estimating rather than skipping if you're unsure. Afterwards you'll see your gaps and a plan.</p>
      <div id="qbox"></div>`;
    U.questionCard(el.querySelector('#qbox'), QT.coach.diagnosticSource(), (box, r) => {
      box.innerHTML = `<div class="card"><h3>Diagnostic complete: ${r.right}/${r.solved}</h3><p class="small">Your skill map and recommendations are ready.</p><a class="btn" href="#/coach">See your plan</a></div>`;
    });
  }

  function drill(el, topicId, giStr) {
    const t = QT.topicById(topicId), gi = +giStr;
    if (!t || !t.skills[gi]) return coach(el);
    const id = QT.coach.idOf(t.id, gi), name = t.skills[gi], before = QT.coach.stat(id).status;
    el.innerHTML = `
      <a class="back" href="#/coach">← Coach</a>
      <h1>Drill: ${name}</h1>
      <p class="lede">${t.name} · 5 questions on this one skill${t.target ? `, aiming for under ${t.target}s each` : ''}.</p>
      <details class="notes"><summary>Key formulas</summary>${t.notes}</details>
      <div id="qbox"></div>`;
    let k = 0;
    const source = () => (k++ < 5 ? { tag: `Drill ${k}/5 · ${name}`, p: t.gens[gi](), skill: id, record: (ok) => store.recordAttempt(t.id, ok) } : null);
    U.questionCard(el.querySelector('#qbox'), source, (box, r) => {
      const after = QT.coach.stat(id);
      box.innerHTML = `<div class="card">
        <h3>${r.right}/${r.solved} correct · ${U.STATUS[before].label} → ${U.STATUS[after.status].label}</h3>
        <p class="small">${after.status === 'strong' ? 'Solid. It will come back occasionally to stay fresh.' : after.status === 'weak' ? 'Still weak. Reread the worked solutions and the key formulas, then try again later today.' : 'Getting there. One more round should make it reliable.'}</p>
        <div class="row"><button id="again">Another 5</button><a class="btn ghost" href="#/coach">Back to coach</a></div></div>`;
      box.querySelector('#again').addEventListener('click', () => QT.route());
    });
  }

  QT.views = Object.assign(QT.views || {}, { coach, drill });
})();
