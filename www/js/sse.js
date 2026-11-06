// Citadel SSE prep: one place to train for the Quantitative Trading, Semi-Systematic Equities
// phone screen. Questions come from content/*.md (see tools/import-content.js) and each card goes
// attempt → hint 1 → hint 2 → submit → solution, against a target time. Going over the target is
// shown but isn't a fail. Every attempt is saved in state.sse.attempts as
// { question_id, tags, correct, time_s, hints_used, timestamp }; correct is 1, 0.5 or 0.
(function () {
  const store = QT.store, U = () => QT.ui, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const ALL = QT.sseContent;
  const INTERVIEW = Date.parse('2026-11-23T13:00:00Z');
  const TRACKS = {
    probability: 'Probability', 'expected-value': 'Expected value', 'statistics-regression': 'Statistics and regression', 'equity-quant': 'Equity quant',
    'market-making': 'Market making', 'mental-maths': 'Mental maths', fermi: 'Fermi estimates', 'python-drills': 'Python drills', behavioural: 'Behavioural and projects',
  };
  const ALPHA = 0.3, HINT_COST = 0.15; // mastery: weight of the newest attempt, cost of each hint

  const byId = (id) => ALL.find((q) => q.id === id);
  const attempts = () => store.get().sse.attempts;
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const pct = (x) => `${Math.round(x * 100)}%`;
  const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // ---------------------------------------------------------------- checking answers
  // What was typed, as a number (NaN if unreadable): anything parseAnswer reads, or an expression.
  // Quotes such as "4 at 5" count as their mid. Units are dropped ($15m, 20 bps); on an estimate
  // k, m and bn are multipliers (70m is 70 million).
  function readAnswer(raw, q) {
    let s = String(raw ?? '').trim().replace(/^[$£]/, '');
    const quote = s.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (quote) {
      const [a, b] = [readAnswer(quote[1], q), readAnswer(quote[2], q)];
      return (a + b) / 2;
    }
    let scale = 1;
    if (q && q.logTol) {
      const m = s.match(/^(.*?\d)\s*(k|thousand|m|mn|million|bn|billion)$/i);
      if (m) {
        s = m[1];
        scale = /^k|^t/i.test(m[2]) ? 1e3 : /^b/i.test(m[2]) ? 1e9 : 1e6;
      }
    } else s = s.replace(/(\d)\s*(bps|bp|m|days?)$/i, '$1');
    const v = QT.parseAnswer(s);
    return (Number.isFinite(v) ? v : QT.evalExpr(s)) * scale;
  }
  // true or false, or null when it can't be read (which isn't a wrong answer). |user − answer| ≤
  // tolerance. Percent answers can be stored either way, so 8.33% matches a stored 8.333, and 17.3
  // matches a stored 0.1732 when the answer is a percentage.
  function check(raw, q) {
    const v = readAnswer(raw, q);
    if (!Number.isFinite(v)) return null;
    if (q.logTol) return v > 0 && Math.abs(Math.log10(v / q.value)) <= q.logTol + 1e-9;
    const near = (x) => Math.abs(x - q.value) <= q.tol + 1e-9;
    if (near(v)) return true;
    if (/%\s*$/.test(raw) && near(v * 100)) return true;
    return !!q.percent && (near(v / 100) || near(v * 100));
  }

  // ---------------------------------------------------------------- attempts and mastery
  function logAttempt(q, correct, time_s, hints_used, notes) {
    const a = { question_id: q.id, tags: q.tags, correct, time_s: Math.round(time_s * 10) / 10, hints_used, timestamp: new Date().toISOString() };
    if (notes) a.notes = notes.slice(0, 4000);
    attempts().push(a);
    if (attempts().length > 5000) attempts().shift();
    store.touchDay();
    store.save();
    return a;
  }
  // One attempt's score out of 1: correct × min(1, target ÷ time), less a deduction for each hint.
  const attemptScore = (a, target) => Math.max(0, a.correct * Math.min(1, target / Math.max(a.time_s, 0.1)) - HINT_COST * a.hints_used);
  // Exponentially weighted average, oldest first, starting at the first score.
  const ewma = (scores) => scores.reduce((m, s, i) => (i ? ALPHA * s + (1 - ALPHA) * m : s), 0);
  const scoresFor = (list) => list.map((a) => attemptScore(a, byId(a.question_id)?.time || 60));
  const questionMastery = (id, log = attempts()) => ewma(scoresFor(log.filter((a) => a.question_id === id)));
  const tagMastery = (tag, log = attempts()) => ewma(scoresFor(log.filter((a) => a.tags.includes(tag))));
  // Attempted and correct count distinct questions (correct: right on its latest attempt). Mastery
  // averages over every question in the track, so untried questions count as zero.
  function trackStats(track, log = attempts()) {
    const qs = ALL.filter((q) => q.track === track);
    const tried = qs.filter((q) => log.some((a) => a.question_id === q.id));
    const last = (q) => [...log].reverse().find((a) => a.question_id === q.id);
    return { track, n: qs.length, attempted: tried.length, correct: tried.filter((q) => last(q).correct === 1).length, mastery: qs.reduce((s, q) => s + questionMastery(q.id, log), 0) / (qs.length || 1) };
  }
  const readiness = (log = attempts()) => {
    const ts = Object.keys(TRACKS).map((t) => trackStats(t, log));
    return ts.reduce((s, t) => s + t.mastery, 0) / ts.length;
  };
  const allTags = () => [...new Set(ALL.flatMap((q) => q.tags))].sort();
  const filtered = (track, tag) => ALL.filter((q) => (!track || q.track === track) && (!tag || q.tags.includes(tag)));
  // Drill order: questions you haven't tried, easiest first, then your lowest mastery.
  function queue(list) {
    const log = attempts(), seen = (q) => log.some((a) => a.question_id === q.id);
    return [...list].sort((a, b) => (seen(a) - seen(b)) || (seen(a) ? questionMastery(a.id, log) - questionMastery(b.id, log) : a.difficulty - b.difficulty));
  }

  // ---------------------------------------------------------------- the question card
  // One question. `done(attempt)` runs when you press Next. `think` adds a box for your reasoning,
  // saved with the attempt.
  function card(box, q, { label = TRACKS[q.track], think = false, nextText = 'Next question →', done }) {
    const numeric = q.type === 'numeric', t0 = Date.now();
    let finished = false, attempt = null, frozen = null; // frozen: the time at the reveal
    const secs = () => frozen ?? (Date.now() - t0) / 1000;
    box.innerHTML = `
      <div class="card qcard sse-card" id="c-card">
        <div class="q-top"><span class="tag">${esc(label)} · level ${q.difficulty}</span><span class="mono sse-timer" id="c-time" title="Going over the target is fine: it isn't marked as a fail"></span></div>
        <div class="question">${q.prompt}</div>
        <div id="c-hints">${U().hintBox(q.hints)}</div>
        ${numeric ? `
          <form class="answer-row" id="c-form">
            <input type="text" id="c-in" inputmode="decimal" autocomplete="off" placeholder="Your answer" aria-label="Your answer" aria-describedby="c-msg">
            <button>Submit</button>
          </form>
          <div class="q-actions" id="c-actions"><span class="small" id="c-msg">${q.logTol ? 'A number, such as 70 million, 70m or 7e7' : q.track === 'market-making' ? 'Your fair value, or a quote such as 4 at 5' : 'Fraction, decimal, percent or expression, such as 5/36, 8.33% or sqrt(2)/2'}</span><button type="button" class="link" id="c-skip">I don't know</button></div>` : ''}
        ${!numeric || think ? `<label class="small" for="c-notes">${q.type === 'code-task' ? 'Your code' : numeric ? 'Think aloud: your reasoning' : 'Your answer, in note form'}</label><textarea id="c-notes" rows="${q.type === 'code-task' ? 8 : 4}" spellcheck="${q.type !== 'code-task'}"></textarea>` : ''}
        ${numeric ? '' : '<button type="button" id="c-reveal">Reveal the solution</button>'}
        <div id="c-out" aria-live="polite"></div>
      </div>`;
    const $ = (s) => box.querySelector(s), hintsUsed = U().wireHints($('#c-hints'), q.hints), notes = () => $('#c-notes')?.value.trim() || '';
    const $time = $('#c-time');
    const tick = () => {
      const s = secs();
      $time.textContent = `${clock(s)} / ${clock(q.time)}`;
      $time.classList.toggle('over', s > q.time);
    };
    tick();
    const timer = setInterval(tick, 500);
    const stop = () => clearInterval(timer);
    QT.cleanup = stop;
    const solution = (head) => `${head}<details class="solution-box" open><summary>Worked solution</summary><div class="solution"><p><b>Answer:</b> ${q.answer}</p>${q.solution}</div></details>`;
    const next = () => `<button type="button" class="next-btn" id="c-next">${esc(nextText)}</button>`;
    const wireNext = () => {
      const b = $('#c-next');
      b.addEventListener('click', () => done(attempt));
      b.focus({ preventScroll: true });
    };
    const overNote = (s) => (s > q.time ? ` · ${clock(s)}, over the ${clock(q.time)} target` : ` · ${clock(s)}`);
    function finish(correct) {
      finished = true;
      stop();
      const s = secs();
      $time.textContent = `${clock(s)} / ${clock(q.time)}`;
      $('#c-hints').querySelector('.hint-btn')?.setAttribute('hidden', '');
      attempt = logAttempt(q, correct, s, hintsUsed(), notes());
      return s;
    }
    if (numeric) {
      const form = $('#c-form'), $in = $('#c-in'), $actions = $('#c-actions');
      const kp = QT.keypad.attach($actions, [$in], () => form.requestSubmit());
      if (kp) $('#c-card').classList.add('has-keypad');
      const close = (ok, shown) => {
        const s = finish(ok ? 1 : 0);
        $in.disabled = true;
        $actions.hidden = true;
        form.querySelector('button').disabled = true;
        if (kp) kp.pad.hidden = true;
        $('#c-out').innerHTML = solution(`<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : shown ? `✗ You said ${esc(shown)}` : '✗ Not answered'}<span class="fb-note">${overNote(s)}</span></div>${next()}`);
        wireNext();
      };
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (finished) return;
        const ok = check($in.value, q);
        if (ok === null) {
          $('#c-msg').textContent = $in.value.trim() ? "I can't read that as a number. Try a decimal, a fraction or something like sqrt(2)/2." : 'Type an answer first, or press "I don\'t know".';
          $('#c-msg').classList.add('nudge');
          return;
        }
        close(ok, $in.value);
      });
      $('#c-skip').addEventListener('click', () => { if (!finished) close(false, ''); });
      if (!kp) $in.focus({ preventScroll: true });
    } else {
      $('#c-reveal').addEventListener('click', (e) => {
        e.target.hidden = true;
        frozen = secs();
        stop();
        $time.textContent = `${clock(frozen)} / ${clock(q.time)}`;
        $('#c-out').innerHTML = solution(`<div class="row sse-grade" role="group" aria-label="How did you do?"><span class="small">Compare with the solution. How did you do?</span>${[['1', 'Correct'], ['0.5', 'Partial'], ['0', 'Missed']].map(([v, t]) => `<button type="button" class="ghost" data-grade="${v}">${t}</button>`).join('')}</div><div id="c-then"></div>`);
        box.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
          if (finished) return;
          finish(+b.dataset.grade);
          box.querySelectorAll('[data-grade]').forEach((x) => { x.disabled = true; x.setAttribute('aria-pressed', String(x === b)); });
          $('#c-then').innerHTML = next();
          wireNext();
        }));
      });
    }
    return stop;
  }

  // ---------------------------------------------------------------- screens
  function render(el, a, b, c) {
    if (a === 'all') return browse(el, b, c);
    if (a === 'drill') return drill(el, b, c);
    if (a === 'q' && byId(b)) return single(el, byId(b));
    plan(el);
  }
  const some = (x) => (x && x !== 'any' ? x : null);
  const trackOf = (x) => (Object.prototype.hasOwnProperty.call(TRACKS, x) ? x : null);

  function countdown() {
    const ms = INTERVIEW - Date.now();
    if (ms <= 0) return 'Interview time reached';
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    return `${d} day${d === 1 ? '' : 's'} ${h} h ${m} min`;
  }

  function plan(el) {
    const stats = Object.keys(TRACKS).map((t) => trackStats(t)), n = attempts().length;
    const tried = stats.reduce((s, t) => s + t.attempted, 0);
    el.innerHTML = `
      <h1>Citadel SSE prep</h1>
      <p class="lede">Quantitative Trading, Semi-Systematic Equities: Phone Screen 1. 45 minutes on Zoom, Monday 23 November, 13:00 GMT.</p>
      <div class="tiles">
        <div class="tile"><div class="v sse-clock" id="sse-count">${countdown()}</div><div class="k">until the interview</div></div>
        <div class="tile"><div class="v">${pct(readiness())}</div><div class="k">readiness (average mastery)</div></div>
        <div class="tile"><div class="v">${tried}<span class="of">/${ALL.length}</span></div><div class="k">questions attempted</div></div>
        <div class="tile"><div class="v">${n}</div><div class="k">attempts logged</div></div>
      </div>
      <div class="row" style="margin:14px 0"><a class="btn" href="#/sse/drill">Drill the next questions</a><a class="btn ghost" href="#/sse/all">All questions by track and tag</a></div>
      <div class="card table-wrap">
        <table class="sse-table">
          <thead><tr><th>Track</th><th class="num">Attempted</th><th class="num">Correct</th><th>Mastery</th><th></th></tr></thead>
          <tbody>${stats.map((t) => `<tr><td><a href="#/sse/all/${t.track}">${TRACKS[t.track]}</a></td><td class="num">${t.attempted}/${t.n}</td><td class="num">${t.correct}</td>
            <td><div class="bar" role="progressbar" aria-label="${TRACKS[t.track]} mastery" aria-valuenow="${Math.round(t.mastery * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${t.mastery * 100}%"></i></div></td>
            <td class="num">${pct(t.mastery)} · <a href="#/sse/drill/${t.track}" aria-label="Drill ${TRACKS[t.track]}">Drill</a></td></tr>`).join('')}</tbody>
        </table>
        <p class="small" style="margin-bottom:0">Mastery weights recent attempts most, counts speed against each question's target, takes off for hints, and counts untried questions as zero. Mental maths here is only a few cards: keep up <a href="#/mental">Zetamac and flow training</a> too.</p>
      </div>`;
    const timer = setInterval(() => { const c = el.querySelector('#sse-count'); if (c) c.textContent = countdown(); }, 20000);
    QT.cleanup = () => clearInterval(timer);
  }

  function browse(el, trackArg, tagArg) {
    const track = trackOf(some(trackArg)), tags = allTags(), tag = tags.includes(some(tagArg)) ? some(tagArg) : null, list = filtered(track, tag);
    const log = attempts(), shown = [...new Set(filtered(track).flatMap((q) => q.tags))].sort();
    const status = (q) => {
      const last = [...log].reverse().find((a) => a.question_id === q.id);
      return !last ? 'not tried' : last.correct === 1 ? '✓ right last time' : last.correct ? 'partly right last time' : '✗ missed last time';
    };
    el.innerHTML = `
      <a class="back" href="#/sse">← Citadel SSE prep</a>
      <h1>All questions</h1>
      <div class="chips filter" role="group" aria-label="Track">
        <a class="chip ${track ? '' : 'on'}" href="#/sse/all">All (${ALL.length})</a>
        ${Object.entries(TRACKS).map(([k, v]) => `<a class="chip ${track === k ? 'on' : ''}" href="#/sse/all/${k}">${v} (${filtered(k).length})</a>`).join('')}
      </div>
      <div class="chips filter" role="group" aria-label="Tag">
        <a class="chip ${tag ? '' : 'on'}" href="#/sse/all/${track || 'any'}">Any tag</a>
        ${shown.map((t) => `<a class="chip ${tag === t ? 'on' : ''}" href="#/sse/all/${track || 'any'}/${t}">${t}</a>`).join('')}
      </div>
      <div class="row" style="margin:12px 0"><a class="btn" href="#/sse/drill/${track || 'any'}/${tag || 'any'}">Drill these (${list.length})</a></div>
      <div class="sse-list">${list.map((q) => `<a class="card" href="#/sse/q/${q.id}"><b>${esc(plain(q.prompt).slice(0, 110))}${plain(q.prompt).length > 110 ? '…' : ''}</b><br><span class="small">${TRACKS[q.track]} · level ${q.difficulty} · target ${clock(q.time)} · ${status(q)}</span></a>`).join('')}</div>`;
  }

  function drill(el, trackArg, tagArg) {
    const track = trackOf(some(trackArg)), tag = allTags().includes(some(tagArg)) ? some(tagArg) : null;
    const list = queue(filtered(track, tag)), title = track ? TRACKS[track] : tag || 'Next questions';
    let i = 0, right = 0, done = 0;
    el.innerHTML = `<a class="back" href="#/sse">← Citadel SSE prep</a><h1>${esc(title)}${track && tag ? `: ${esc(tag)}` : ''}</h1><div id="d-box"></div>`;
    const box = el.querySelector('#d-box');
    const show = () => {
      if (i >= list.length) {
        box.innerHTML = `<div class="card"><p style="margin-top:0"><b>${list.length ? `That's all ${list.length} in this set` : 'Nothing in this set'}.</b> ${done ? `${right} of ${done} right.` : ''}</p><a class="btn" href="#/sse">Back to the plan</a></div>`;
        return;
      }
      card(box, list[i], { label: `${i + 1} of ${list.length} · ${TRACKS[list[i].track]}`, done: (a) => {
        done++;
        right += a.correct === 1 ? 1 : 0;
        i++;
        show();
      } });
    };
    show();
  }

  function single(el, q) {
    el.innerHTML = `<a class="back" href="#/sse/all/${q.track}">← ${TRACKS[q.track]}</a><h1>${TRACKS[q.track]}</h1><div id="d-box"></div>`;
    card(el.querySelector('#d-box'), q, { nextText: `Back to ${TRACKS[q.track].toLowerCase()}`, done: () => { location.hash = `#/sse/all/${q.track}`; } });
  }

  QT.sse = { render, TRACKS, INTERVIEW, readAnswer, check, attemptScore, ewma, questionMastery, tagMastery, trackStats, readiness, logAttempt, filtered, queue, allTags, card };
})();
