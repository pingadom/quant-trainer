// Shared UI building blocks used by the views in js/views/: progress helpers, cards, and the
// question card that every practice mode (topics, coach, mistakes, cases, interviews) runs on.
(function () {
  const store = QT.store, f = QT.fmtNum;
  const esc = QT.escapeHtml;

  const TRACKS = { interview: 'Interview track', foundations: 'Foundations track' };
  const pctStr = (x) => (x === null ? '–' : `${Math.round(x * 100)}%`);

  // ---- progress ----
  const answered = (r) => r.filter((x) => x !== undefined && x !== null).length;
  const caseProgress = (c) => {
    const r = store.get().cases[c.id]?.results || [];
    return { answered: answered(r), right: r.filter(Boolean).length, total: c.questions.length };
  };
  const casesDone = () => QT.cases.filter((c) => caseProgress(c).answered === c.questions.length).length;
  const bankProgress = (b) => {
    const r = store.get().bank[b.id]?.results || [];
    return { answered: answered(r), right: r.filter(Boolean).length, total: b.parts ? b.parts.length : 1 };
  };
  const bankDone = () => QT.bank.filter((b) => { const p = bankProgress(b); return p.answered === p.total; }).length;
  const recordBank = (id, i, ok) => {
    const rec = (store.get().bank[id] ||= { results: [] });
    rec.results[i] = ok;
    store.touchDay();
    store.save();
  };

  function updateBadges() {
    const n = QT.mistakes.due().length;
    document.querySelectorAll('[data-badge="mistakes"]').forEach((b) => {
      b.textContent = n;
      b.hidden = !n;
    });
  }

  // ---- cards ----
  // Skill status uses the reserved status colours, always paired with an icon and a label.
  const STATUS = {
    strong: { icon: '✓', label: 'Strong' },
    shaky: { icon: '~', label: 'Shaky' },
    weak: { icon: '✗', label: 'Weak' },
    learning: { icon: '…', label: 'Learning' },
    unseen: { icon: '○', label: 'Not started' },
  };

  // Secondary styling: on any screen only the single most important action is a filled button.
  const recCard = (r) => `
    <div class="card rec">
      <div class="rec-body"><b>${r.title}</b><p class="small">${r.why}</p></div>
      <a class="btn ghost" href="${r.href}">${r.label}</a>
    </div>`;

  function skillChip(t, gi) {
    const s = QT.coach.stat(QT.coach.idOf(t.id, gi)), S = STATUS[s.status], name = t.skills[gi];
    const detail = s.n ? `${s.recentC}/${s.recentN} recently correct, model estimate ${Math.round(s.p * 100)}%${s.time ? `, median ${f(s.time)}s (target ${t.target}s)` : ''}` : 'not started';
    return `<a class="sk st-${s.status}" href="#/drill/${t.id}/${gi}" title="${name}: ${S.label}, ${detail}. Tap to drill." aria-label="${name}: ${S.label}, ${detail}. Drill this skill."><i aria-hidden="true">${S.icon}</i>${name}</a>`;
  }

  const topicCard = (t, m) => `
    <a class="card topic-card" href="#/topic/${t.id}">
      <h3>${t.name}</h3>
      <div class="small">${t.blurb}</div>
      <div class="bar"><i style="width:${Math.round(m.score * 100)}%"></i></div>
      <div class="meta"><span>${m.attempts ? `recent ${pctStr(m.recentAcc)}` : 'not started'}</span><span>${m.attempts} done</span></div>
    </a>`;

  function caseCard(c) {
    const p = caseProgress(c);
    return `
      <a class="card topic-card" href="#/case/${c.id}">
        <div class="small mono">${c.year}</div>
        <h3>${c.title}</h3>
        <div class="chips">${c.tags.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
        <div class="meta" style="margin-top:10px"><span>${p.answered ? `${p.right}/${p.total} correct` : `${p.total} question${p.total > 1 ? 's' : ''}`}</span><span>${p.answered === p.total ? '✓ done' : ''}</span></div>
      </a>`;
  }

  // ---- the question card ----
  // Driven by `source()`, which returns { tag, p, record(ok), skill?, isReview? } or null when done.
  // Answer flow: verdict → "Next question" → coach diagnosis → worked solution, in that order,
  // so the way forward is never below a long explanation. On phones the keypad hides after
  // answering and the page scrolls to keep the result in view.
  function questionCard(box, source, onDone) {
    let solved = 0, right = 0, item, done = false, simToken = 0, shownAt = 0;
    const HINT = 'Decimal, fraction (5/36) or percent (13.9%)';

    box.innerHTML = `
      <div class="card qcard" id="qcard">
        <div class="q-top"><span class="tag" id="p-tag"></span><span class="q-score" id="s-count"></span></div>
        <div class="question" id="p-q"></div>
        <form class="answer-row" id="p-form">
          <input type="text" id="p-in" inputmode="decimal" autocomplete="off" placeholder="Your answer" aria-label="Your answer" aria-describedby="p-hint">
          <button id="p-btn">Check</button>
        </form>
        <div class="q-actions" id="p-actions">
          <span class="small" id="p-hint">${HINT}</span>
          <button type="button" class="link" id="p-skip">Show answer</button>
        </div>
        <div id="p-fb" aria-live="polite"></div>
      </div>`;

    const $ = (s) => box.querySelector(s);
    const $in = $('#p-in'), $fb = $('#p-fb'), $hint = $('#p-hint'), form = $('#p-form'), $actions = $('#p-actions'), card = $('#qcard');
    // On touch screens the on-screen pad replaces the Check button (its ↵ key checks).
    const kp = QT.keypad.attach($actions, [$in], () => form.requestSubmit());
    if (kp) card.classList.add('has-keypad');

    // Scroll a node into view only if it's off-screen (the phone keypad pushes things down).
    const keepInView = (node) => {
      const r = node.getBoundingClientRect(), bottomBar = window.innerWidth <= 760 ? 80 : 0;
      if (r.top < 0 || r.top > window.innerHeight - bottomBar - 120) node.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    const hint = (msg, nudge) => {
      $hint.textContent = msg;
      $hint.classList.toggle('nudge', nudge);
    };

    function next() {
      item = source();
      if (!item) return onDone && onDone(box, { solved, right });
      done = false;
      simToken++;
      $('#p-tag').textContent = item.tag;
      $('#p-q').innerHTML = item.p.q;
      $fb.innerHTML = '';
      $in.value = '';
      $in.disabled = false;
      $actions.hidden = false;
      hint(HINT, false);
      if (kp) kp.pad.hidden = false;
      $('#s-count').textContent = solved ? `${right}/${solved} correct` : '';
      shownAt = Date.now();
      if (solved) keepInView(card);
      if (!kp) $in.focus({ preventScroll: true });
    }

    function reveal(ok, userVal) {
      const p = item.p;
      done = true;
      solved++;
      if (ok) right++;
      const fate = item.record(ok);
      if (item.skill) QT.coach.observe(item.skill, ok, Date.now() - shownAt);
      // practiceOnly items (arithmetic drills) don't feed the mistakes deck or the coach's habits,
      // which are about probability and statistics; they still get the diagnosis tip below.
      if (!ok && !item.isReview && !item.practiceOnly) QT.mistakes.add(item.tag, p); // comes back for spaced review
      // Diagnose what kind of mistake this was, so the advice is about the actual slip.
      const errType = ok ? null : QT.coach.classify(userVal, p.a);
      if (errType && !item.practiceOnly) QT.coach.logError(errType, item.skill, item.tag);
      updateBadges();
      $in.disabled = true;
      $actions.hidden = true;
      if (kp) kp.pad.hidden = true; // nothing to type now; keeps the result on screen
      $('#s-count').textContent = `${right}/${solved} correct`;
      const note = item.isReview ? (fate === 'mastered' ? ' · mastered, removed from your deck' : ok ? ` · ${fate}` : ' · back to tomorrow') : !ok && !item.practiceOnly ? ' · saved to review later' : '';
      const head = ok
        ? `<div class="fb ok">✓ Correct: ${f(p.a)}<span class="fb-note">${note}</span></div>`
        : `<div class="fb bad">✗ ${userVal === undefined ? 'Answer' : `You said ${f(userVal)}. Answer`}: ${f(p.a)}<span class="fb-note">${note}</span></div>`;
      const E = errType && QT.coach.ERRORS[errType], sk = item.skill && QT.coach.parse(item.skill);
      const tip = E ? `<div class="coach-tip"><b>Coach · ${E.label}.</b> ${E.advice}${sk ? ` <a href="#/drill/${sk.topic.id}/${sk.gi}">Drill “${sk.name}” →</a>` : ''}</div>` : '';
      $fb.innerHTML = `${head}<button type="button" class="next-btn" id="p-next">Next question →</button>${tip}
        <details class="solution-box" open><summary>Worked solution</summary><div class="solution">${p.sol}</div>
        ${p.sim ? `<div class="row" style="margin-top:10px"><button type="button" class="ghost" id="p-sim">Check by simulation</button></div><div class="sim-out" id="p-simout"></div>` : ''}</details>`;
      if (p.sim) $('#p-sim').addEventListener('click', runSim);
      const $next = $('#p-next');
      $next.addEventListener('click', next);
      $next.focus({ preventScroll: true }); // Enter goes to the next question
      keepInView($fb.firstElementChild);
    }

    function runSim() {
      const p = item.p, token = simToken, trials = p.trials || 100000, out = $('#p-simout');
      out.textContent = `Running ${trials.toLocaleString()} trials…`;
      setTimeout(() => {
        let sum = 0, used = 0;
        for (let i = 0; i < trials; i++) {
          const v = p.sim();
          if (v === null) continue;
          sum += v;
          used++;
        }
        if (token !== simToken) return;
        out.innerHTML = `Monte Carlo estimate: <b>${f(sum / used)}</b> from ${used.toLocaleString()} ${used < trials ? 'accepted ' : ''}trials (exact: ${f(p.a)})`;
      }, 20);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (done) return next();
      if (!$in.value.trim()) return hint('Type an answer first, or tap "Show answer".', true);
      const v = QT.parseAnswer($in.value);
      if (Number.isNaN(v)) return hint("Couldn't read that. Try 0.25, 1/4 or 25%.", true);
      reveal(QT.isCorrect(v, item.p.a, item.p.tol), v);
    });
    $('#p-skip').addEventListener('click', () => reveal(false));
    next();
  }

  QT.ui = { TRACKS, pctStr, esc, caseProgress, casesDone, bankProgress, bankDone, recordBank, updateBadges, STATUS, recCard, skillChip, topicCard, caseCard, questionCard };
})();
