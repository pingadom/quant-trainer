// Stories: your answers to the questions every trading interview asks that have no number at the
// end ("tell me about yourself", "why this firm", "a time you were wrong"). You write the points
// once, field by field, then rehearse them out loud against a timer. Interviewers can tell a
// prepared story from one made up on the spot, and the prepared one is shorter and has a result.
// Saved with the rest of your progress (state.stories), so backups include them.
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const WPM = 140; // a calm speaking pace
  const STAR = ['Situation: where and when, in one or two sentences', 'Task: what you had to achieve, and what made it hard', 'Action: what you did (say "I", not "we")', 'Result: what happened, with a number if there is one', 'Lesson: what you learned or would do differently'];

  // `star`: a behavioural story the phone-screen mock may ask for.
  const PROMPTS = [
    { id: 'intro', group: 'Openers', q: 'Tell me about yourself.', words: [180, 280],
      fields: ['Who you are now: course, year, one line', 'What got you into markets or trading: one specific moment', 'Evidence that you think in probabilities (a project, game, competition or result)', 'Why this role, and why now'],
      tip: 'Two minutes at most. It is a trailer for the rest of the interview, not your CV read aloud: pick the two things you most want them to ask about.' },
    { id: 'why-trading', group: 'Openers', q: 'Why trading?', words: [120, 220],
      fields: ['The hook: a specific experience, not "I like maths"', 'What you enjoy about deciding under uncertainty with fast, measurable feedback', 'Evidence you already do this (games of incomplete information, betting on your own forecasts, a trading competition)', 'What you want to get better at'],
      tip: 'Avoid money, prestige and "fast-paced environment". A concrete story about a decision you made with odds in mind beats any adjective.' },
    { id: 'why-firm', group: 'Openers', q: 'Why this firm? (At Citadel: why not Citadel Securities, or a bank?)', words: [120, 220],
      fields: ['What the firm is, in one correct sentence', 'Something specific about how it works, and where you learned it', 'How the role\'s objectives fit what you are good at', 'Why not the alternatives'],
      tip: 'Get the basics right. <b>Citadel</b> is an investment manager running five strategies (Equities, Fixed Income &amp; Macro, Commodities, Credit &amp; Convertibles, Global Quantitative Strategies), with a risk group that sits outside the investment teams and reports to the CEO. <b>Citadel Securities</b> is a separate firm, a market maker that earns the spread on client flow. A bank\'s trading desk mostly serves clients. The Investment &amp; Trading internship is at Citadel: it takes positions on its own capital within risk limits. Its posting asks interns to develop in-depth knowledge of a financial market and apply statistics to trading.' },
    { id: 'market', group: 'Markets', q: 'Which market do you follow? Talk me through a recent move.', words: [150, 260],
      fields: ['The market, and why you follow it', 'A recent move: what happened, with the numbers (level, % move, dates)', 'What drove it, in your view, and what the market was pricing before', 'How you would have traded it, and what would change your mind'],
      tip: 'Citadel\'s I&amp;T posting asks for "passion for the markets" and "in-depth knowledge of a financial market". Pick one market and know it properly: the main drivers, the latest big move, what is priced in, and who the other side of the trade is. Check your numbers the morning of the interview.' },
    { id: 'pitch', group: 'Markets', q: 'Pitch me a trade.', words: [150, 260],
      fields: ['The trade: instrument, direction, and how big relative to your risk', 'Your edge: why you think the market is wrong', 'Catalyst and time frame', 'Risk: what loses money, and where you would get out'],
      tip: 'A small, clear trade with a reason the market might be wrong beats a grand macro view. Expect "what\'s the other side thinking?" and "how much would you put on?"' },
    { id: 'uncertain', group: 'Experience', star: true, q: 'Tell me about a decision you made with incomplete information.', words: [180, 300], fields: STAR,
      tip: 'Say what you knew, what you didn\'t, and how you weighed the odds. Trading is this every day.' },
    { id: 'wrong', group: 'Experience', star: true, q: 'Tell me about a time you were wrong and changed your mind.', words: [180, 300], fields: STAR,
      tip: 'Choose a real mistake with a cost. What they want to hear is how fast you noticed and what you changed, not that you were never wrong.' },
    { id: 'pressure', group: 'Experience', star: true, q: 'Tell me about a time you worked under real time pressure.', words: [180, 300], fields: STAR,
      tip: 'Show how you prioritised: what you chose not to do matters as much as what you did.' },
    { id: 'team', group: 'Experience', star: true, q: 'Tell me about a disagreement with a teammate. How did you resolve it?', words: [180, 300], fields: STAR,
      tip: 'Show you argued from evidence and could be persuaded. No villains.' },
    { id: 'learn', group: 'Experience', star: true, q: 'Tell me about something difficult you had to learn quickly.', words: [180, 300], fields: STAR,
      tip: 'Interns are judged on how fast they learn. Say how you learned it, not just that you did.' },
    { id: 'project', group: 'Experience', star: true, q: 'Walk me through your most technical project. What was the hardest decision?', words: [180, 320],
      fields: ['The problem, and why it mattered', 'Your approach, and the tools or methods you used', 'One key design decision and its trade-off', 'The result, with a number', 'A mistake you found and fixed'],
      tip: 'Expect follow-up questions on every claim. Only include what you can defend in detail, and know your numbers.' },
  ];
  const GROUPS = ['Openers', 'Markets', 'Experience'];

  const all = () => store.get().stories;
  const fieldsOf = (id) => all()[id]?.f || [];
  const words = (s) => (String(s).match(/[A-Za-z0-9'’£$%.,-]+/g) || []).length;
  const totalWords = (id) => fieldsOf(id).reduce((n, s) => n + words(s), 0);
  const filled = (p) => p.fields.every((_, i) => (fieldsOf(p.id)[i] || '').trim().length > 0);
  // Your notes for a prompt as safe HTML (null when there are none), for the phone-screen mock.
  function get(id) {
    const p = PROMPTS.find((x) => x.id === id), f = fieldsOf(id);
    if (!p || !f.some((s) => s && s.trim())) return null;
    return `<dl>${p.fields.map((label, i) => (f[i] && f[i].trim() ? `<dt>${esc(label.split(':')[0])}</dt><dd>${esc(f[i]).replace(/\n/g, '<br>')}</dd>` : '')).join('')}</dl>`;
  }
  const mins = (w) => (w / WPM).toFixed(1).replace(/\.0$/, '');

  function render(el, id) {
    const p = id && PROMPTS.find((x) => x.id === id);
    if (p) return edit(el, p);
    const ready = PROMPTS.filter(filled).length;
    el.innerHTML = `
      <h1>Stories</h1>
      <p class="lede">Your answers to the questions with no number at the end. Write the points for each one, then rehearse them out loud against the clock. About two minutes each: roughly ${WPM * 2} words.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${ready}/${PROMPTS.length}</div><div class="k">answers written</div></div>
      </div>
      ${GROUPS.map((g) => `<h2>${g}</h2><div class="menu">${PROMPTS.filter((x) => x.group === g).map((x) => {
        const w = totalWords(x.id);
        return `<a class="card" href="#/stories/${x.id}"><b>${esc(x.q)}</b><span class="small">${filled(x) ? '✓ written' : w ? 'started' : 'not started'}${w ? ` · ${w} words ≈ ${mins(w)} min spoken` : ''}</span></a>`;
      }).join('')}</div>`).join('')}
      <p class="small" style="margin-top:16px">Stories are saved on this device with the rest of your progress and included in backups. Rehearse them in a <a href="#/screen">phone-screen mock</a>.</p>`;
  }

  function edit(el, p) {
    const f = fieldsOf(p.id);
    let timer = null, t0 = 0;
    el.innerHTML = `
      <a class="back" href="#/stories">← Stories</a>
      <h1>${esc(p.q)}</h1>
      <div class="card"><p style="margin:0">${p.tip}</p></div>
      <form class="card story-form" id="story">
        ${p.fields.map((label, i) => `<label class="story-field"><span>${esc(label)}</span><textarea data-i="${i}" rows="3">${esc(f[i] || '')}</textarea></label>`).join('')}
        <p class="small" id="st-count" aria-live="polite"></p>
      </form>
      <div class="card">
        <h3>Rehearse</h3>
        <p class="small" style="margin-top:0">Read your points once, then look away and say the answer out loud. Aim for ${mins(p.words[0])}–${mins(p.words[1])} minutes.</p>
        <div class="row"><button type="button" id="st-go">Start the clock</button><span class="mono" id="st-clock" style="font-size:1.4em">0:00</span></div>
      </div>`;
    const form = el.querySelector('#story'), $count = el.querySelector('#st-count');
    const count = () => {
      const w = [...form.querySelectorAll('textarea')].reduce((n, t) => n + words(t.value), 0), [lo, hi] = p.words;
      $count.textContent = `${w} words ≈ ${mins(w)} min spoken. ${w < lo ? 'Room for more detail.' : w > hi ? 'Long: cut it to the points that matter most.' : 'A good length.'} Saved automatically.`;
    };
    form.addEventListener('input', (e) => {
      if (!e.target.matches('textarea')) return;
      const st = all();
      const rec = st[p.id] || (st[p.id] = { f: [], t: 0 });
      rec.f[+e.target.dataset.i] = e.target.value.slice(0, 4000);
      rec.f = Array.from({ length: p.fields.length }, (_, i) => rec.f[i] || '');
      rec.t = Date.now();
      store.save();
      count();
    });
    count();
    const $clock = el.querySelector('#st-clock'), $go = el.querySelector('#st-go');
    const stop = () => { clearInterval(timer); timer = null; $go.textContent = 'Start the clock'; };
    $go.addEventListener('click', () => {
      if (timer) return stop();
      t0 = Date.now();
      $go.textContent = 'Stop';
      timer = setInterval(() => {
        const s = (Date.now() - t0) / 1000;
        $clock.textContent = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
        $clock.classList.toggle('neg', s > (p.words[1] / WPM) * 60);
      }, 250);
    });
    QT.cleanup = () => clearInterval(timer);
  }

  QT.stories = { render, get, PROMPTS, words };
})();
