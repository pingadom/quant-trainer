// 45-minute mock of the Semi-Systematic Equities phone screen: six timed segments, with a box to
// think aloud beside each question, then a report with a score per segment, the time on each
// question, your three weakest tags and links to drill them. The clocks are guides: running over
// is shown, and nothing stops you, as in a real call.
(function () {
  const store = QT.store, S = () => QT.sse, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const clock = (s) => `${s < 0 ? '−' : ''}${Math.floor(Math.abs(s) / 60)}:${String(Math.floor(Math.abs(s) % 60)).padStart(2, '0')}`;
  const pct = (x) => `${Math.round(x * 100)}%`;
  const SEGMENTS = [
    { id: 'intro', name: 'Introduction', mins: 3 },
    { id: 'prob', name: 'Probability and expected value', mins: 12 },
    { id: 'stats', name: 'Statistics and regression', mins: 10 },
    { id: 'mm', name: 'Market making', mins: 8 },
    { id: 'project', name: 'Project deep-dive', mins: 7 },
    { id: 'ask', name: 'Your questions', mins: 5 },
  ];
  const ASK = ['How does the desk split decisions between the model and the trader?', 'When did someone last override a signal, and how did you judge whether it was right?', 'What does a strong intern do in their first month on the desk?', 'What has changed most in how the desk handles costs and execution?'];
  const INTRO = { id: 'mock-intro', track: 'behavioural', tags: ['intro'], difficulty: 1, time: 120, type: 'conceptual', prompt: 'Tell me about yourself.', hints: [], answer: 'Self-graded', solution: '<p>About two minutes: who you are now, what drew you to markets, the evidence that you think in probabilities, and why this desk. Pick the two things you most want them to ask about.</p>' };
  const QUESTIONS = { id: 'mock-ask', track: 'behavioural', tags: ['your-questions'], difficulty: 1, time: 180, type: 'conceptual', prompt: 'Do you have any questions for me? Write the two or three you would ask.', hints: [], answer: 'Self-graded', solution: `<p>Ask about the work, not the perks, and listen to the answers. Some that suit this desk:</p><ul>${ASK.map((x) => `<li>${x}</li>`).join('')}</ul>` };

  const pick = (list, n) => {
    const xs = [...list];
    for (let i = xs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs.slice(0, n);
  };
  // The questions for one mock, by segment: a fresh random draw each time.
  function draw() {
    const C = QT.sseContent, mid = (q) => q.difficulty >= 2 && q.difficulty <= 4;
    return {
      intro: [INTRO],
      prob: pick(C.filter((q) => ['probability', 'expected-value'].includes(q.track) && mid(q)), 3),
      stats: pick(S().filtered('statistics-regression'), 3),
      project: pick(C.filter((q) => q.id === 'q-beh-004' || q.id.startsWith('q-proj-')), 2),
      ask: [QUESTIONS],
    };
  }
  // The report's numbers. `rows`: one per question, { seg, q, attempt }; `sim`: the simulator's result.
  function report(rows, sim) {
    const score = (r) => r.attempt.correct;
    const segs = SEGMENTS.map((seg) => {
      const mine = rows.filter((r) => r.seg === seg.id);
      return { id: seg.id, score: seg.id === 'mm' ? (sim ? sim.quality : 0) : mine.length ? mine.reduce((s, r) => s + score(r), 0) / mine.length : 0 };
    });
    const tags = {};
    for (const r of rows) {
      for (const t of r.q.tags) {
        if (S().allTags().includes(t)) (tags[t] ||= []).push(S().attemptScore(r.attempt, r.q.time));
      }
    }
    const weak = Object.entries(tags).map(([t, xs]) => [t, xs.reduce((a, b) => a + b, 0) / xs.length]).sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 3).map(([t]) => t);
    return { segs, weak, overall: segs.reduce((s, x) => s + x.score, 0) / segs.length };
  }

  function intro(el) {
    const past = store.get().sse.mocks.slice(-5).reverse();
    el.innerHTML = `
      <a class="back" href="#/sse">← Citadel SSE prep</a>
      <h1>45-minute mock</h1>
      <p class="lede">A full run at the phone screen. Say your reasoning out loud, and type the outline in the box beside each question: it's saved with your attempt. The clocks are guides, so running over is shown but nothing cuts you off.</p>
      <div class="card table-wrap"><table class="sse-table"><thead><tr><th>Segment</th><th class="num">Minutes</th></tr></thead>
        <tbody>${SEGMENTS.map((s) => `<tr><td>${s.name}</td><td class="num">${s.mins}</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin:14px 0"><button class="btn-lg" id="m-go">Start the mock</button></div>
      ${past.length ? `<h2>Past mocks</h2><div class="card table-wrap"><table class="sse-table"><thead><tr><th>Date</th><th class="num">Overall</th><th class="num">Time</th><th>Weakest tags</th></tr></thead><tbody>${past.map((m) => `<tr><td>${esc(m.date.slice(0, 10))}</td><td class="num">${pct(m.overall)}</td><td class="num">${clock(m.secs)}</td><td>${m.weak.map(esc).join(', ') || '–'}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
    el.querySelector('#m-go').addEventListener('click', () => run(el));
  }

  function run(el) {
    const t0 = Date.now(), plan = draw(), rows = [], spent = {};
    let seg = 0, segAt = t0, sim = null;
    el.innerHTML = `<h1 class="quiz-h">45-minute mock</h1>
      <div class="row" style="justify-content:space-between"><span class="small" id="m-seg"></span><span class="mono"><span id="m-left"></span> left of 45:00</span></div>
      <div id="m-box"></div>`;
    const $ = (s) => el.querySelector(s), box = $('#m-box');
    const tick = () => {
      if (!$('#m-left')) return;
      const s = SEGMENTS[seg], left = s.mins * 60 - (Date.now() - segAt) / 1000;
      $('#m-left').textContent = clock(45 * 60 - (Date.now() - t0) / 1000);
      $('#m-seg').textContent = `Segment ${seg + 1} of ${SEGMENTS.length}: ${s.name} · ${left >= 0 ? `${clock(left)} left` : `${clock(-left)} over`}`;
    };
    const timer = setInterval(tick, 1000);
    QT.cleanup = () => clearInterval(timer);
    function nextSegment() {
      spent[SEGMENTS[seg].id] = (Date.now() - segAt) / 1000;
      seg++;
      segAt = Date.now();
      if (seg < SEGMENTS.length) startSegment();
      else finish();
    }
    function startSegment() {
      tick();
      window.scrollTo(0, 0);
      const s = SEGMENTS[seg];
      if (s.id === 'mm') {
        const ids = Object.keys(QT.sseSim.SCENARIOS);
        return QT.sseSim.play(box, ids[Math.floor(Math.random() * ids.length)], 2, (r) => { sim = r; nextSegment(); }, 'Next segment →');
      }
      const list = plan[s.id];
      let i = 0;
      const show = () => {
        const q = list[i];
        S().card(box, q, {
          label: `${s.name} · ${i + 1} of ${list.length}`, think: true, rate: false, nextText: i + 1 < list.length ? 'Next question →' : 'Next segment →',
          story: q === INTRO ? QT.stories?.get('intro') : null,
          done: (attempt) => {
            rows.push({ seg: s.id, q, attempt });
            i++;
            if (i < list.length) show();
            else nextSegment();
          },
        });
      };
      show();
    }
    function finish() {
      clearInterval(timer);
      QT.cleanup = null;
      const secs = (Date.now() - t0) / 1000, r = report(rows, sim), st = store.get().sse;
      store.log(st.mocks, { secs: Math.round(secs), overall: Math.round(r.overall * 100) / 100, segs: r.segs.map((x) => ({ id: x.id, score: Math.round(x.score * 100) / 100 })), weak: r.weak }, 20);
      store.touchDay();
      store.save();
      const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
      const verdict = (c) => (c === 1 ? '✓' : c ? 'Partial' : '✗');
      el.innerHTML = `
        <h1>Mock report</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${pct(r.overall)}</div><div class="k">overall</div></div>
          <div class="tile"><div class="v">${clock(secs)}</div><div class="k">time, out of 45:00</div></div>
        </div>
        <h2>By segment</h2>
        <div class="card table-wrap"><table class="sse-table"><thead><tr><th>Segment</th><th class="num">Score</th><th class="num">Time</th><th class="num">Allowed</th></tr></thead>
          <tbody>${SEGMENTS.map((s, i) => `<tr><td>${s.name}</td><td class="num">${pct(r.segs[i].score)}</td><td class="num ${spent[s.id] > s.mins * 60 ? 'neg' : ''}">${clock(spent[s.id] || 0)}</td><td class="num">${s.mins}:00</td></tr>`).join('')}</tbody></table>
          <p class="small" style="margin-bottom:0">Market making scores the share of your quotes that contained the fair value with a width of at most 2 SD.</p></div>
        <h2>Time per question</h2>
        <div class="card table-wrap"><table class="sse-table"><thead><tr><th>Question</th><th>Result</th><th class="num">Time</th><th class="num">Target</th><th class="num">Hints</th></tr></thead>
          <tbody>${rows.map(({ q, attempt: a }) => `<tr><td>${esc(plain(q.prompt).slice(0, 70))}${plain(q.prompt).length > 70 ? '…' : ''}</td><td>${verdict(a.correct)}</td><td class="num ${a.time_s > q.time ? 'neg' : ''}">${clock(a.time_s)}</td><td class="num">${clock(q.time)}</td><td class="num">${a.hints_used}</td></tr>`).join('')}</tbody></table></div>
        <h2>Your three weakest tags</h2>
        <div class="row">${r.weak.length ? r.weak.map((t) => `<a class="btn ghost" href="#/sse/drill/any/${esc(t)}">Drill ${esc(t)}</a>`).join('') : '<span class="small">Nothing to go on yet.</span>'}</div>
        <p class="small" style="margin-top:14px">Your think-aloud notes are saved with each attempt.</p>
        <div class="row" style="margin-top:14px"><a class="btn" href="#/sse">Back to the plan</a><a class="btn ghost" href="#/sse/mock">Past mocks</a></div>`;
      window.scrollTo(0, 0);
    }
    startSegment();
  }

  QT.sseMock = { render: intro, SEGMENTS, draw, report };
})();
