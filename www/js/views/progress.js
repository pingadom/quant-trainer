// Progress: how you're improving over time. Everything here is drawn from data the app already
// stores; a chart appears once there are at least two points to compare.
(function () {
  const store = QT.store, f = QT.fmtNum, C = QT.chart;
  const BLOCK = 20; // answers per point on the accuracy and speed charts

  const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  const pctFmt = (x) => `${Math.round(x)}%`;
  const card = (title, note, chart) => `<div class="card chart-card"><h3>${title}</h3>${note ? `<p class="small">${note}</p>` : ''}${chart}</div>`;

  // Days practised over the last 26 weeks, one square per day, weeks as columns (like GitHub).
  function heatmap(days) {
    const set = new Set(days), today = new Date(), cells = [], WEEKS = 26;
    const start = new Date(today), dow = (today.getDay() + 6) % 7; // rows run Monday to Sunday
    start.setDate(start.getDate() - (WEEKS - 1) * 7 - dow);
    let n = 0, total = 0;
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        if (day > today) continue;
        total++;
        const on = set.has(QT.dayKey(day));
        if (on) n++;
        cells.push(`<rect x="${w * 12}" y="${d * 12}" width="10" height="10" rx="2" class="${on ? 'hm-on' : 'hm-off'}"><title>${QT.dayKey(day)}${on ? ': practised' : ''}</title></rect>`);
      }
    }
    return { n, total, svg: `<svg class="heatmap" viewBox="0 0 ${WEEKS * 12} 84" role="img" aria-label="Practised on ${n} of the last ${total} days">${cells.join('')}</svg>` };
  }

  function longestStreak(days) {
    const sorted = [...new Set(days)].sort();
    let best = 0, run = 0, prev = null;
    for (const d of sorted) {
      const t = Date.parse(d + 'T12:00:00');
      run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = t;
    }
    return best;
  }

  // Answer log → blocks of BLOCK answers: accuracy (%) and median seconds per block.
  function blocks(log) {
    const out = [];
    for (let i = 0; i + BLOCK <= log.length; i += BLOCK) {
      const b = log.slice(i, i + BLOCK);
      out.push({ acc: (100 * b.filter((x) => x.ok).length) / BLOCK, secs: median(b.map((x) => x.ms).filter((x) => x > 0)) / 1000 });
    }
    return out;
  }

  function progress(el) {
    const s = store.get(), charts = [], todo = [];
    const add = (ok, html, missing) => (ok ? charts.push(html) : todo.push(missing));

    const hm = heatmap(s.days);
    const b = blocks(s.log);
    add(b.length >= 2, card('Accuracy', `Share correct in each block of ${BLOCK} practice answers, oldest first.`,
      C.line([{ name: 'Accuracy', values: b.map((x) => x.acc) }], { label: `Accuracy per ${BLOCK} answers: from ${pctFmt(b[0]?.acc ?? 0)} to ${pctFmt(b[b.length - 1]?.acc ?? 0)}`, fmt: pctFmt, min: 0, max: 100, xFirst: 'first answers', xLast: 'latest' })),
      ['Practice', '#/review', `answer ${Math.max(0, 2 * BLOCK - s.log.length)} more questions`]);
    add(b.length >= 2 && b.every((x) => Number.isFinite(x.secs)), card('Speed', `Median seconds per answer in each block of ${BLOCK}.`,
      C.line([{ name: 'Seconds', values: b.map((x) => x.secs) }], { label: `Median answer time per ${BLOCK} answers: from ${f(b[0]?.secs ?? 0)} to ${f(b[b.length - 1]?.secs ?? 0)} seconds`, xFirst: 'first answers', xLast: 'latest' })),
      null);

    const net = (r) => r.correct - r.wrong;
    const full = s.mental.full?.runs || [], typed = s.mental.fullTyped?.runs || [], sprint = s.mental.sprint?.runs || [];
    add(full.length + typed.length >= 2, card('80 in 8', 'Net score per run (right − wrong). ~55 is a commonly quoted pass line.',
      C.line([...(full.length ? [{ name: 'Multiple choice', values: full.map(net) }] : []), ...(typed.length ? [{ name: 'Typed', values: typed.map(net), dashed: true }] : [])], { label: `80 in 8 net scores over ${full.length + typed.length} runs`, target: { y: 55, name: 'Pass line ~55' }, xFirst: 'first run', xLast: 'latest' })),
      ['80 in 8', '#/mental', 'play it twice']);
    add(sprint.length >= 2, card('2-minute sprint', 'Correct answers per sprint.', C.line([{ name: 'Correct', values: sprint.map((r) => r.correct) }], { label: `Sprint scores over ${sprint.length} runs`, xFirst: 'first run', xLast: 'latest' })), null);

    const est = s.estimate.history;
    add(est.length >= 2, card('Calibration', 'Share of your ranges that contained the truth, per round. Honest 90% ranges should land near the line.',
      C.line([{ name: 'Hit rate', values: est.map((x) => x.hits * 10) }], { label: `Estimation hit rate over ${est.length} rounds`, fmt: pctFmt, min: 0, max: 100, target: { y: 90, name: '90% target' }, xFirst: 'first round', xLast: 'latest' })),
      ['Estimation', '#/estimate', 'play two rounds']);

    const qh = s.quote.history;
    add(qh.length >= 2, card('Make me a market', 'Average P&amp;L per question (% of the true value), per round.',
      C.line([{ name: 'P&L %', values: qh.map((x) => x.pnl) }], { label: `Market-quoting P&L over ${qh.length} rounds`, fmt: (x) => `${f(Math.round(x * 10) / 10)}%`, xFirst: 'first round', xLast: 'latest' })),
      ['Make me a market', '#/quote', 'play two rounds']);

    const kh = s.kelly.history;
    add(kh.length >= 2, card('Bet sizing', 'Sizing score per game: your expected growth as a share of Kelly’s.',
      C.line([{ name: 'Sizing score', values: kh.map((x) => Math.max(-100, x.eff * 100)) }], { label: `Bet-sizing scores over ${kh.length} games`, fmt: pctFmt, target: { y: 100, name: 'Kelly' }, xFirst: 'first game', xLast: 'latest' })),
      ['Bet sizing', '#/kelly', 'play two games']);

    const fh = s.figgie.history, mh = s.market.history;
    add(fh.length >= 2, card('Figgie', 'Chips won or lost per game.', C.line([{ name: 'P&L', values: fh.map((x) => x.pnl) }], { label: `Figgie P&L over ${fh.length} games`, xFirst: 'first game', xLast: 'latest' })), ['Figgie', '#/figgie', 'play two games']);
    add(mh.length >= 2, card('Market making', 'P&amp;L per dice game.', C.line([{ name: 'P&L', values: mh.map((x) => x.pnl) }], { label: `Market-making P&L over ${mh.length} games`, xFirst: 'first game', xLast: 'latest' })), ['Market making', '#/market', 'play two games']);

    const dailyDays = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const r = s.daily[QT.dayKey(d)];
      dailyDays.push(r?.done ? r.r.filter(Boolean).length : null);
    }
    add(dailyDays.filter((x) => x !== null).length >= 2, card('Daily challenge', 'Correct out of 5, last 30 days (gaps are days you skipped).',
      C.line([{ name: 'Correct', values: dailyDays }], { label: 'Daily challenge scores over the last 30 days', min: 0, max: 5, xFirst: '30 days ago', xLast: 'today' })),
      ['Daily challenge', '#/daily', 'do it on two days']);

    const oaSeries = Object.entries(QT.oa.TESTS).filter(([k]) => (s.oa[k]?.runs?.length || 0) >= 2);
    for (const [k, t] of oaSeries) charts.push(card(t.name, `Score per run (${t.unit}).`, C.line([{ name: t.name, values: s.oa[k].runs.map((x) => x.score) }], { label: `${t.name} scores over ${s.oa[k].runs.length} runs`, xFirst: 'first run', xLast: 'latest' })));
    if (!oaSeries.length) todo.push(['Online tests', '#/oa', 'take one twice']);

    const th = s.talk.history;
    add(th.length >= 2, card('Think aloud', 'Self-review score per session.', C.line([{ name: 'Score', values: th.map((x) => (100 * x.score) / (x.of || 6)) }], { label: `Think-aloud self-review over ${th.length} sessions`, fmt: pctFmt, min: 0, max: 100, xFirst: 'first session', xLast: 'latest' })), ['Think aloud', '#/talk', 'do two sessions']);

    // Speed vs target by topic, from the coach's per-skill timings (correct answers only).
    const rows = QT.topics.map((t) => {
      const times = t.skills.map((_, gi) => QT.coach.stat(QT.coach.idOf(t.id, gi)).time).filter((x) => x);
      const m = QT.mastery(t.id);
      return { t, m, time: times.length ? median(times) : null };
    }).filter((r) => r.m.attempts);

    el.innerHTML = `
      <h1>Progress</h1>
      <p class="lede">How you're improving over time, across everything you practise.</p>
      <div class="card">
        <h3>Activity</h3>
        ${hm.svg}
        <p class="small">Practised on <b>${hm.n}</b> of the last ${hm.total} days · current streak <b>${store.streak()}</b> · longest <b>${longestStreak(s.days)}</b></p>
      </div>
      ${rows.length ? `<div class="card table-wrap"><h3>Speed and accuracy by topic</h3><table>
        <tr><th>Topic</th><th class="num">Recent accuracy</th><th class="num">Median time</th><th class="num">Target</th></tr>
        ${rows.map((r) => `<tr><td><a href="#/topic/${r.t.id}">${r.t.name}</a></td><td class="num">${QT.ui.pctStr(r.m.recentAcc)}</td><td class="num ${r.time && r.time > r.t.target * 1.5 ? 'neg' : ''}">${r.time ? f(Math.round(r.time)) + 's' : '–'}</td><td class="num">${r.t.target}s</td></tr>`).join('')}
      </table><p class="small">Times are medians of correct answers. Red: more than 1.5× the target.</p></div>` : ''}
      <div class="chart-grid">${charts.join('')}</div>
      ${todo.filter(Boolean).length ? `<h2>More charts unlock as you play</h2><ul class="unlock">${todo.filter(Boolean).map(([name, href, what]) => `<li><a href="${href}">${name}</a>: ${what}</li>`).join('')}</ul>` : ''}`;
  }

  QT.views = Object.assign(QT.views || {}, { progress });
  QT.progress = { blocks, longestStreak, heatmap };
})();
