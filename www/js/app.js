// App shell: routing, dashboard, practice sessions, case studies, settings and roadmap.
(function () {
  const store = QT.store, f = QT.fmtNum, R = QT.rand;
  const main = document.getElementById('main');
  const TRACKS = { interview: 'Interview track', foundations: 'Foundations track' };
  const pctStr = (x) => (x === null ? '–' : `${Math.round(x * 100)}%`);

  const caseProgress = (c) => {
    const r = store.get().cases[c.id]?.results || [];
    return { answered: r.filter((x) => x !== undefined && x !== null).length, right: r.filter(Boolean).length, total: c.questions.length };
  };
  const casesDone = () => QT.cases.filter((c) => caseProgress(c).answered === c.questions.length).length;

  // ---------------------------------------------------------------- dashboard
  function dashboard(el) {
    const s = store.get();
    const attempts = Object.values(s.topics).reduce((a, t) => a + t.attempts, 0);
    const correct = Object.values(s.topics).reduce((a, t) => a + t.correct, 0);
    const strong = QT.coach.allIds().filter((id) => QT.coach.stat(id).status === 'strong').length;
    const todo = QT.cases.filter((c) => caseProgress(c).answered < c.questions.length);
    const featured = todo.length ? todo[new Date().getDate() % todo.length] : null;
    const hour = new Date().getHours(), hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const streak = store.streak();

    // First visit: one clear first step instead of a wall of empty stats.
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

      ${more.length ? `<h2>Also recommended</h2><div class="recs">${more.slice(0, 2).map(recCard).join('')}</div>
      <p><a href="#/coach">See your full coaching plan →</a></p>` : ''}

      <h2>Your progress</h2>
      <div class="tiles">
        <a class="tile" href="#/coach"><div class="v">${strong}<span class="of">/${QT.coach.allIds().length}</span></div><div class="k">skills strong</div></a>
        <div class="tile"><div class="v">${attempts}</div><div class="k">problems solved</div></div>
        <div class="tile"><div class="v">${attempts ? pctStr(correct / attempts) : '–'}</div><div class="k">accuracy</div></div>
        <div class="tile"><div class="v">${streak}</div><div class="k">day streak</div></div>
      </div>

      <h2>Keep sharp</h2>
      <div class="shortcuts">
        <a class="card shortcut" href="#/bank"><b>Interview questions</b><span>${bankDone()}/${QT.bank.length} done · mock interviews</span></a>
        <a class="card shortcut" href="#/mental"><b>Mental maths</b><span>${s.mental.full?.best != null ? `80-in-8 best: ${s.mental.full.best} net` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/market"><b>Market making</b><span>${s.market.games ? `${s.market.games} games · avg P&amp;L ${f(s.market.total / s.market.games)}` : 'Not tried yet'}</span></a>
        <a class="card shortcut" href="#/estimate"><b>Estimation</b><span>${s.estimate.n ? `${Math.round((100 * s.estimate.hits) / s.estimate.n)}% of ranges correct` : 'Not tried yet'}</span></a>
        ${featured ? `<a class="card shortcut" href="#/case/${featured.id}"><b>Case of the day</b><span>${featured.title} (${featured.year})</span></a>` : ''}
        <a class="card shortcut" href="#/roadmap"><b>Roadmap</b><span>Books, projects and milestones</span></a>
      </div>`;
  }

  function topicCard(t, m) {
    return `
      <a class="card topic-card" href="#/topic/${t.id}">
        <h3>${t.name}</h3>
        <div class="small">${t.blurb}</div>
        <div class="bar"><i style="width:${Math.round(m.score * 100)}%"></i></div>
        <div class="meta"><span>${m.attempts ? `recent ${pctStr(m.recentAcc)}` : 'not started'}</span><span>${m.attempts} done</span></div>
      </a>`;
  }

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

  // ---------------------------------------------------------------- practice
  function practice(el) {
    el.innerHTML = `
      <h1>Practice</h1>
      <div class="shortcuts two">
        <a class="card shortcut primary" href="#/review"><b>Mixed practice</b><span>Questions from every topic, weighted towards your weak spots</span></a>
        <a class="card shortcut" href="#/mistakes"><b>Mistakes to review <span class="badge" data-badge="mistakes" hidden></span></b><span>${QT.mistakes.all().length ? `${QT.mistakes.due().length} due now · ${QT.mistakes.all().length} saved` : 'Questions you get wrong come back here'}</span></a>
      </div>
      <p class="small">Or pick a topic. Every question is freshly generated, and the bar shows your recent accuracy.</p>
      ${Object.entries(TRACKS).map(([k, label]) => `
        <h2>${label}</h2>
        <div class="grid">${QT.topics.filter((t) => t.track === k).map((t) => topicCard(t, QT.mastery(t.id))).join('')}</div>`).join('')}`;
  }

  function topicView(el, id) {
    const t = QT.topicById(id);
    if (!t) return practice(el);
    el.innerHTML = `
      <a class="back" href="#/practice">← Practice</a>
      <h1>${t.name}</h1>
      <p class="lede">${TRACKS[t.track]} · ${t.blurb}</p>
      <details class="notes"><summary>Key formulas</summary>${t.notes}</details>
      <div id="qbox"></div>`;
    questionCard(el.querySelector('#qbox'), QT.coach.source(QT.coach.allIds([t]), { showTopic: false }));
  }

  function reviewView(el, track) {
    const pool = QT.topics.filter((t) => !TRACKS[track] || t.track === track);
    el.innerHTML = `
      <h1>Mixed practice</h1>
      <p class="lede">Questions from every topic, chosen for you: weaker skills come up more, and a miss is followed by a similar question.</p>
      <div class="seg" role="tablist" aria-label="Which questions">
        ${[['', 'All topics'], ['interview', 'Interview'], ['foundations', 'Foundations']].map(([k, l]) => `<a role="tab" aria-selected="${(track || '') === k}" class="${(track || '') === k ? 'on' : ''}" href="#/review${k ? '/' + k : ''}">${l}</a>`).join('')}
      </div>
      <div id="qbox"></div>`;
    questionCard(el.querySelector('#qbox'), QT.coach.source(QT.coach.allIds(pool)));
  }

  // A question card driven by `source()`, which returns { tag, p, record(ok) } or null when finished.
  function questionCard(box, source, onDone) {
    let solved = 0, right = 0, item, answered = false, simToken = 0, shownAt = 0;

    box.innerHTML = `
      <div class="card qcard" id="qcard">
        <div class="q-top"><span class="tag" id="p-tag"></span><span class="q-score" id="s-count"></span></div>
        <div class="question" id="p-q"></div>
        <form class="answer-row" id="p-form">
          <input type="text" id="p-in" inputmode="decimal" autocomplete="off" placeholder="Your answer" aria-label="Your answer" aria-describedby="p-hint">
          <button id="p-btn">Check</button>
        </form>
        <div class="q-actions" id="p-actions">
          <span class="small" id="p-hint">Decimal, fraction (5/36) or percent (13.9%)</span>
          <button type="button" class="link" id="p-skip">Show answer</button>
        </div>
        <div id="p-fb" aria-live="polite"></div>
      </div>`;

    const $ = (s) => box.querySelector(s);
    const $in = $('#p-in'), $fb = $('#p-fb'), $skip = $('#p-skip'), form = $('#p-form'), $actions = $('#p-actions'), card = $('#qcard');
    // On touch screens the on-screen pad replaces the Check button (its ↵ key checks).
    const kp = QT.keypad.attach($actions, [$in], () => form.requestSubmit());
    if (kp) card.classList.add('has-keypad');

    // Bring part of the card into view if it's off-screen (phones: the keypad pushes things down).
    const reveal_ = (node, where = 'start') => {
      const r = node.getBoundingClientRect(), bottomBar = window.innerWidth <= 760 ? 80 : 0;
      if (r.top < 0 || r.top > window.innerHeight - bottomBar - 120) node.scrollIntoView({ block: where, behavior: 'smooth' });
    };

    function next() {
      item = source();
      if (!item) return onDone && onDone(box, { solved, right });
      answered = false;
      simToken++;
      $('#p-tag').textContent = item.tag;
      $('#p-q').innerHTML = item.p.q;
      $fb.innerHTML = '';
      $in.value = '';
      $in.disabled = false;
      $actions.hidden = false;
      $('#p-hint').classList.remove('nudge');
      $('#p-hint').textContent = 'Decimal, fraction (5/36) or percent (13.9%)';
      if (kp) kp.pad.hidden = false;
      $('#s-count').textContent = solved ? `${right}/${solved} correct` : '';
      shownAt = Date.now();
      if (solved) reveal_(card);
      if (!kp) $in.focus({ preventScroll: true });
    }

    function reveal(ok, userVal) {
      const p = item.p;
      answered = true;
      solved++;
      if (ok) right++;
      const fate = item.record(ok);
      if (item.skill) QT.coach.observe(item.skill, ok, Date.now() - shownAt);
      if (!ok && !item.isReview) QT.mistakes.add(item.tag, p); // comes back for spaced review
      // Diagnose what kind of mistake this was, so the advice is about the actual slip.
      const errType = ok ? null : QT.coach.classify(userVal, p.a);
      if (errType) QT.coach.logError(errType, item.skill, item.tag);
      updateBadges();
      $in.disabled = true;
      $actions.hidden = true;
      if (kp) kp.pad.hidden = true; // nothing to type now; keeps the result on screen
      $('#s-count').textContent = `${right}/${solved} correct`;
      const note = item.isReview ? (fate === 'mastered' ? ' · mastered, removed from your deck' : ok ? ` · ${fate}` : ' · back to tomorrow') : !ok ? ' · saved to review later' : '';
      const head = ok
        ? `<div class="fb ok">✓ Correct: ${f(p.a)}<span class="fb-note">${note}</span></div>`
        : `<div class="fb bad">✗ ${userVal === undefined ? 'Answer' : `You said ${f(userVal)}. Answer`}: ${f(p.a)}<span class="fb-note">${note}</span></div>`;
      const E = errType && QT.coach.ERRORS[errType], sk = item.skill && QT.coach.parse(item.skill);
      const tip = E ? `<div class="coach-tip"><b>Coach · ${E.label}.</b> ${E.advice}${sk ? ` <a href="#/drill/${sk.topic.id}/${sk.gi}">Drill “${sk.name}” →</a>` : ''}</div>` : '';
      // Verdict, then the way forward, then the explanation: the button never ends up below a long solution.
      $fb.innerHTML = `${head}<button type="button" class="next-btn" id="p-next">Next question →</button>${tip}
        <details class="solution-box" open><summary>Worked solution</summary><div class="solution">${p.sol}</div>
        ${p.sim ? `<div class="row" style="margin-top:10px"><button type="button" class="ghost" id="p-sim">Check by simulation</button></div><div class="sim-out" id="p-simout"></div>` : ''}</details>`;
      if (p.sim) $('#p-sim').addEventListener('click', runSim);
      const $next = $('#p-next');
      $next.addEventListener('click', next);
      $next.focus({ preventScroll: true }); // Enter goes to the next question
      reveal_($fb.firstElementChild);
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
      if (answered) return next();
      const hint = $('#p-hint');
      if (!$in.value.trim()) {
        hint.textContent = 'Type an answer first, or tap "Show answer".';
        hint.classList.add('nudge');
        return;
      }
      const v = QT.parseAnswer($in.value);
      if (Number.isNaN(v)) {
        hint.textContent = "Couldn't read that. Try 0.25, 1/4 or 25%.";
        hint.classList.add('nudge');
        return;
      }
      hint.classList.remove('nudge');
      hint.textContent = 'Decimal, fraction (5/36) or percent (13.9%)';
      reveal(QT.isCorrect(v, item.p.a, item.p.tol), v);
    });
    $skip.addEventListener('click', () => reveal(false));
    next();
  }

  // ---------------------------------------------------------------- case studies
  function casesView(el) {
    el.innerHTML = `
      <h1>Case studies</h1>
      <p class="lede">Real market events, each turned into a statistics lesson. Interviewers love candidates who can connect a formula to something that actually happened, and these are the stories that shaped how trading firms think about risk.</p>
      <div class="grid">${QT.cases.map(caseCard).join('')}</div>`;
  }

  function caseView(el, id) {
    const c = QT.caseById(id);
    if (!c) return casesView(el);
    const idx = QT.cases.indexOf(c), nextCase = QT.cases[(idx + 1) % QT.cases.length];
    el.innerHTML = `
      <a class="back" href="#/cases">← All case studies</a>
      <div class="small mono">${c.year}</div>
      <h1>${c.title}</h1>
      <div class="chips" style="margin-bottom:16px">${c.tags.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
      <div class="card case-body">
        <p>${c.summary}</p>
        <h3>Key facts</h3>
        <ul>${c.facts.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>
      <h2>The lesson</h2>
      <div class="card"><p style="margin:0">${c.lesson}</p></div>
      <h2>Work it through</h2>
      <div id="qbox"></div>
      <h2>Sources</h2>
      <ul class="sources">${c.sources.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`).join('')}</ul>
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/case/${nextCase.id}">Next: ${nextCase.title} →</a></div>`;

    let i = 0;
    const source = () => {
      if (i >= c.questions.length) return null;
      const qi = i++, q = c.questions[qi];
      return {
        tag: `Question ${qi + 1} of ${c.questions.length}${q.illus ? ' · illustrative numbers' : ''}`,
        p: q,
        record: (ok) => {
          const s = store.get(), rec = (s.cases[c.id] ||= { results: [] });
          rec.results[qi] = ok;
          store.touchDay();
          store.save();
        },
      };
    };
    questionCard(el.querySelector('#qbox'), source, (box, r) => {
      box.innerHTML = `<div class="card"><h3>Case complete: ${r.right}/${r.solved} correct</h3>
        <p class="small">Try explaining this event out loud in two minutes: what happened, which assumption failed, and the number that shows it.</p>
        <div class="row"><button class="ghost" id="redo">Redo questions</button><a class="btn" href="#/case/${nextCase.id}">Next case →</a></div></div>`;
      box.querySelector('#redo').addEventListener('click', () => route());
    });
  }

  // ---------------------------------------------------------------- interview bank
  const bankProgress = (b) => {
    const r = store.get().bank[b.id]?.results || [];
    const n = b.parts ? b.parts.length : 1;
    return { answered: r.filter((x) => x !== undefined && x !== null).length, right: r.filter(Boolean).length, total: n };
  };
  const bankDone = () => QT.bank.filter((b) => bankProgress(b).answered === bankProgress(b).total).length;
  const recordBank = (id, i, ok) => {
    const s = store.get(), rec = (s.bank[id] ||= { results: [] });
    rec.results[i] = ok;
    store.touchDay();
    store.save();
  };
  const firmBadge = (b) => `<span class="tag firm">${QT.firms[b.firm].name}</span>`;
  const plain = (html) => html.replace(/<[^>]+>/g, '');

  // Parts of one or more bank questions, fed to questionCard in order.
  const bankSource = (items, label) => {
    const queue = [];
    items.forEach((b, qi) => (b.parts || []).forEach((part, pi) => queue.push({ b, part, pi, qi })));
    let k = 0;
    return () => {
      if (k >= queue.length) return null;
      const { b, part, pi, qi } = queue[k++];
      return {
        tag: `${label ? label(qi) + ' · ' : ''}${QT.firms[b.firm].name}${b.parts.length > 1 ? ` · part ${pi + 1} of ${b.parts.length}` : ''}${part.ext ? ' · our follow-up' : ''}`,
        p: { ...part, q: `<p class="stem">${b.q}</p><p>${part.q}</p>` },
        record: (ok) => recordBank(b.id, pi, ok),
      };
    };
  };

  function bankView(el, firm) {
    const list = QT.bank.filter((b) => !firm || b.firm === firm);
    const F = firm && QT.firms[firm];
    el.innerHTML = `
      <h1>Interview questions</h1>
      <p class="lede">Questions candidates report being asked at trading firms, rewritten in our own words with worked solutions and a link to where each was reported. Treat attributions as candidate reports, not official material, and expect interviewers to change the numbers.</p>
      <div class="chips filter">
        <a class="chip ${firm ? '' : 'on'}" href="#/bank">All (${QT.bank.length})</a>
        ${Object.entries(QT.firms).map(([k, v]) => { const n = QT.bank.filter((b) => b.firm === k).length; return n ? `<a class="chip ${firm === k ? 'on' : ''}" href="#/bank/${k}">${v.name} (${n})</a>` : ''; }).join('')}
      </div>
      ${F ? `<details class="card intel" ${window.innerWidth > 760 ? 'open' : ''}><summary><b>How ${F.name} interviews</b> (as reported)</summary>
        <ul>${F.process.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="small">Sources: ${F.sources.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`).join(' · ')}</p></details>` : ''}
      <div class="row" style="margin:14px 0">
        <a class="btn" href="#/mock${firm ? '/' + firm : ''}">Mock interview${F ? `: ${F.name}` : ''} (5 questions)</a>
        <span class="small">${bankDone()}/${QT.bank.length} completed</span>
      </div>
      <div class="qlist">
        ${list.map((b) => { const p = bankProgress(b); return `
          <a class="card qitem" href="#/iq/${b.id}">
            <div class="row" style="gap:6px">${firmBadge(b)}<span class="small">${b.role} · ${b.stage} · ${b.cat}</span>${b.kind === 'guide' ? '<span class="chip">prep-guide format</span>' : ''}</div>
            <div class="qtext">${plain(b.q)}</div>
            <div class="meta"><span>${b.open ? 'open-ended' : `${b.parts.length} part${b.parts.length > 1 ? 's' : ''}`}</span><span>${p.answered === p.total ? `✓ ${p.right}/${p.total}` : p.answered ? `${p.answered}/${p.total} done` : ''}</span></div>
          </a>`; }).join('')}
      </div>`;
  }

  function bankQuestion(el, id) {
    const b = QT.bankById(id);
    if (!b) return bankView(el);
    const same = QT.bank.filter((x) => x.firm === b.firm), next = same[(same.indexOf(b) + 1) % same.length];
    el.innerHTML = `
      <a class="back" href="#/bank/${b.firm}">← ${QT.firms[b.firm].name} questions</a>
      <div class="row" style="gap:6px;margin-bottom:6px">${firmBadge(b)}<span class="small">${b.role} · ${b.stage} · ${b.cat}</span></div>
      <p class="small">${b.kind === 'reported' ? 'Reported by a candidate' : 'Common format from prep guides (not verified as asked at one firm)'} · source: <a href="${b.src[1]}" target="_blank" rel="noopener">${b.src[0]}</a></p>
      ${b.note ? `<div class="card note">${b.note}</div>` : ''}
      <div id="qbox"></div>
      ${b.followups?.length ? `<h2>Interviewers may push further</h2><ul class="followups">${b.followups.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/iq/${next.id}">Next ${QT.firms[b.firm].name} question →</a></div>`;
    const box = el.querySelector('#qbox');
    if (b.open) return openCard(box, b);
    questionCard(box, bankSource([b]), (bx, r) => {
      bx.innerHTML = `<div class="card"><h3>Done: ${r.right}/${r.solved} parts correct</h3>
        <p class="small">Now answer it again out loud as if to an interviewer: state your approach first, then the numbers, then sanity-check the result.</p>
        <button class="ghost" id="redo">Try again</button></div>`;
      bx.querySelector('#redo').addEventListener('click', () => route());
    });
  }

  // Open-ended questions: think, reveal a model answer, then self-grade.
  function openCard(box, b) {
    box.innerHTML = `
      <div class="card">
        <div class="question">${b.q}</div>
        <p class="small">Take 2–3 minutes and talk it through out loud (or jot bullet points), then compare.</p>
        <button id="reveal">Reveal model answer</button>
        <div id="model" hidden>
          <div class="solution">${b.open.model}</div>
          <div class="row" style="margin-top:12px"><span class="small">How did you do?</span>
            <button class="ghost" data-ok="1">Covered the key points</button><button class="ghost" data-ok="0">Missed some</button></div>
        </div>
      </div>`;
    box.querySelector('#reveal').addEventListener('click', (e) => {
      e.target.hidden = true;
      box.querySelector('#model').hidden = false;
    });
    box.querySelectorAll('[data-ok]').forEach((btn) => btn.addEventListener('click', () => {
      recordBank(b.id, 0, btn.dataset.ok === '1');
      btn.parentElement.innerHTML = `<span class="small">Saved. Try it again in a few days.</span>`;
    }));
  }

  function mockView(el, firm) {
    const pool = QT.bank.filter((b) => b.parts && (!firm || b.firm === firm));
    const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    const start = Date.now();
    el.innerHTML = `
      <a class="back" href="#/bank${firm ? '/' + firm : ''}">← Interview questions</a>
      <h1>Mock interview${firm ? `: ${QT.firms[firm].name}` : ''}</h1>
      <div class="session"><span>${pick.length} questions · talk through each one out loud before you type</span><span class="mono" id="mock-clock">0:00</span></div>
      <div id="qbox"></div>`;
    const clock = el.querySelector('#mock-clock');
    const t = setInterval(() => { const s = Math.floor((Date.now() - start) / 1000); clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
    QT.cleanup = () => clearInterval(t);
    questionCard(el.querySelector('#qbox'), bankSource(pick, (i) => `Q${i + 1}/${pick.length}`), (box, r) => {
      clearInterval(t);
      box.innerHTML = `<div class="card">
        <h3>Mock complete: ${r.right}/${r.solved} parts correct in ${clock.textContent}</h3>
        <p>Jane Street's own advice for its trading interviews is a good self-review checklist. Did you:</p>
        <ul><li><b>Approach methodically:</b> state a plan before calculating?</li><li><b>Communicate clearly:</b> could an interviewer follow every step?</li><li><b>Correct mistakes:</b> did you sanity-check answers and fix errors yourself?</li><li><b>Ask why:</b> did you clarify ambiguous rules before starting?</li></ul>
        <p class="small">Source: <a href="https://www.janestreet.com/trading-interviews/" target="_blank" rel="noopener">janestreet.com/trading-interviews</a></p>
        <div class="row"><button id="again">Another mock</button><a class="btn ghost" href="#/bank${firm ? '/' + firm : ''}">Back to questions</a></div></div>`;
      box.querySelector('#again').addEventListener('click', () => route());
    });
  }

  // ---------------------------------------------------------------- coach
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
    const detail = s.n ? `${s.recentC}/${s.recentN} recently correct${s.time ? `, median ${f(s.time)}s (target ${t.target}s)` : ''}` : 'not started';
    return `<a class="sk st-${s.status}" href="#/drill/${t.id}/${gi}" title="${name}: ${S.label}, ${detail}. Tap to drill." aria-label="${name}: ${S.label}, ${detail}. Drill this skill."><i aria-hidden="true">${S.icon}</i>${name}</a>`;
  }

  function coachView(el, mode) {
    if (mode === 'session') return coachSession(el);
    if (mode === 'diagnostic') return diagnosticView(el);
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
      <div class="recs">${recs.slice(0, 6).map(recCard).join('')}</div>

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
      <div class="legend" role="list">${Object.entries(STATUS).map(([k, v]) => `<span class="sk st-${k}" role="listitem"><i aria-hidden="true">${v.icon}</i>${v.label} · ${counts[k] || 0}</span>`).join('')}</div>
      ${QT.topics.map((t) => `
        <div class="skill-topic">
          <h3><a href="#/topic/${t.id}">${t.name}</a></h3>
          <div class="skill-chips">${t.skills.map((_, gi) => skillChip(t, gi)).join('')}</div>
        </div>`).join('')}`;
  }

  function coachSession(el) {
    const focus = QT.coach.focus();
    el.innerHTML = `
      <a class="back" href="#/coach">← Coach</a>
      <h1>Coaching session</h1>
      <p class="lede">10 questions on: ${focus.map((id) => QT.coach.parse(id).name).join(', ')}. Miss one and you'll usually get another like it straight away.</p>
      <div id="qbox"></div>`;
    questionCard(el.querySelector('#qbox'), QT.coach.source(focus, { limit: 10, label: (i) => `Q${i}/10` }), (box, r) => {
      box.innerHTML = `<div class="card"><h3>Session done: ${r.right}/${r.solved} correct</h3><p class="small">Your recommendations have been updated.</p></div>
        <div class="recs">${QT.coach.recommend().slice(0, 3).map(recCard).join('')}</div>
        <div class="row" style="margin-top:12px"><a class="btn ghost" href="#/coach">Back to coach</a></div>`;
    });
  }

  function diagnosticView(el) {
    el.innerHTML = `
      <a class="back" href="#/coach">← Coach</a>
      <h1>Diagnostic</h1>
      <p class="lede">One question from each of the ${QT.topics.length} topics. Answer as you would in an interview, estimating rather than skipping if you're unsure. Afterwards you'll see your gaps and a plan.</p>
      <div id="qbox"></div>`;
    questionCard(el.querySelector('#qbox'), QT.coach.diagnosticSource(), (box, r) => {
      box.innerHTML = `<div class="card"><h3>Diagnostic complete: ${r.right}/${r.solved}</h3><p class="small">Your skill map and recommendations are ready.</p><a class="btn" href="#/coach">See your plan</a></div>`;
    });
  }

  function drillView(el, topicId, giStr) {
    const t = QT.topicById(topicId), gi = +giStr;
    if (!t || !t.skills[gi]) return coachView(el);
    const id = QT.coach.idOf(t.id, gi), name = t.skills[gi], before = QT.coach.stat(id).status;
    el.innerHTML = `
      <a class="back" href="#/coach">← Coach</a>
      <h1>Drill: ${name}</h1>
      <p class="lede">${t.name} · 5 questions on this one skill${t.target ? `, aiming for under ${t.target}s each` : ''}.</p>
      <details class="notes"><summary>Key formulas</summary>${t.notes}</details>
      <div id="qbox"></div>`;
    let k = 0;
    const source = () => (k++ < 5 ? { tag: `Drill ${k}/5 · ${name}`, p: t.gens[gi](), skill: id, record: (ok) => store.recordAttempt(t.id, ok) } : null);
    questionCard(el.querySelector('#qbox'), source, (box, r) => {
      const after = QT.coach.stat(id);
      box.innerHTML = `<div class="card">
        <h3>${r.right}/${r.solved} correct · ${STATUS[before].label} → ${STATUS[after.status].label}</h3>
        <p class="small">${after.status === 'strong' ? 'Solid. It will come back occasionally to stay fresh.' : after.status === 'weak' ? 'Still weak. Reread the worked solutions and the key formulas, then try again later today.' : 'Getting there. One more round should make it reliable.'}</p>
        <div class="row"><button id="again">Another 5</button><a class="btn ghost" href="#/coach">Back to coach</a></div></div>`;
      box.querySelector('#again').addEventListener('click', () => route());
    });
  }

  // ---------------------------------------------------------------- mistakes deck
  function updateBadges() {
    const n = QT.mistakes.due().length;
    document.querySelectorAll('[data-badge="mistakes"]').forEach((b) => {
      b.textContent = n;
      b.hidden = !n;
    });
  }

  function mistakesView(el, mode) {
    const all = QT.mistakes.all(), due = QT.mistakes.due();
    const reviewing = mode === 'due' ? due : mode === 'all' ? [...all] : null;
    if (reviewing && reviewing.length) {
      el.innerHTML = `
        <a class="back" href="#/mistakes">← Mistakes to review</a>
        <h1>Reviewing ${reviewing.length} mistake${reviewing.length > 1 ? 's' : ''}</h1>
        <p class="lede">Get one right and it comes back later (${QT.mistakes.INTERVALS.slice(1).join(', ')} days). Get it right at every step and it's retired.</p>
        <div id="qbox"></div>`;
      let k = 0;
      const source = () => {
        if (k >= reviewing.length) return null;
        const m = reviewing[k++];
        return { tag: `${m.tag} · review`, p: m.p, isReview: true, record: (ok) => QT.mistakes.review(m, ok) };
      };
      questionCard(el.querySelector('#qbox'), source, (box, r) => {
        box.innerHTML = `<div class="card"><h3>Review done: ${r.right}/${r.solved} correct</h3><p class="small">${QT.mistakes.all().length} card(s) left in your deck; ${store.get().mastered || 0} mastered so far.</p><a class="btn" href="#/mistakes">Back to deck</a></div>`;
      });
      return;
    }
    const fmtDue = (t) => {
      const d = Math.ceil((t - Date.now()) / 864e5);
      return d <= 0 ? 'due now' : d === 1 ? 'tomorrow' : `in ${d} days`;
    };
    el.innerHTML = `
      <h1>Mistakes to review</h1>
      <p class="lede">Every problem you get wrong is saved here exactly as you saw it. It returns after 1 day; each correct review pushes it out further (3, 7, 21 days) until it's retired. Revisiting mistakes at growing intervals is one of the most effective ways to learn.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${due.length}</div><div class="k">due now</div></div>
        <div class="tile"><div class="v">${all.length}</div><div class="k">in deck</div></div>
        <div class="tile"><div class="v">${store.get().mastered || 0}</div><div class="k">mastered</div></div>
      </div>
      ${all.length ? `<div class="row" style="margin:6px 0 18px">
          ${due.length ? `<a class="btn" href="#/mistakes/due">Review ${due.length} due</a>` : ''}
          <a class="btn ${due.length ? 'ghost' : ''}" href="#/mistakes/all">Review all ${all.length} now</a>
        </div>
        <div class="card table-wrap"><table>
          <tr><th>Problem</th><th>Topic</th><th class="num">Next review</th></tr>
          ${[...all].sort((a, b) => a.due - b.due).map((m) => `<tr><td>${m.key.slice(0, 90)}${m.key.length > 90 ? '…' : ''}</td><td class="small">${m.tag}</td><td class="num">${fmtDue(m.due)}</td></tr>`).join('')}
        </table></div>`
      : `<div class="card"><p style="margin:0">Your deck is empty. Wrong answers in practice, interview questions and case studies land here automatically.</p></div>`}`;
  }

  // ---------------------------------------------------------------- more / settings
  function moreView(el) {
    let pref = 'auto';
    try { pref = localStorage.getItem('qt-keypad') || 'auto'; } catch { /* ignore */ }
    el.innerHTML = `
      <h1>More</h1>
      <h2 class="menu-head">Interview prep</h2>
      <div class="menu">
        <a class="card" href="#/mental"><b>Mental maths</b><span class="small">80-in-8 format and a 2-minute sprint</span></a>
        <a class="card" href="#/market"><b>Market making</b><span class="small">Quote on hidden dice against informed flow</span></a>
        <a class="card" href="#/estimate"><b>Estimation &amp; calibration</b><span class="small">Quote ranges on unknown quantities</span></a>
      </div>
      <h2 class="menu-head">Learn</h2>
      <div class="menu">
        <a class="card" href="#/cases"><b>Case studies</b><span class="small">Real market events as statistics lessons</span></a>
        <a class="card" href="#/lab"><b>Stats lab</b><span class="small">CLT and volatility-drag simulations</span></a>
        <a class="card" href="#/roadmap"><b>Roadmap</b><span class="small">Stages, books and milestones</span></a>
      </div>

      <div id="install"></div>

      <h2>Settings</h2>
      <div class="card">
        <label for="kp">On-screen number pad</label>
        <select id="kp" style="margin-left:8px">
          ${['auto', 'on', 'off'].map((v) => `<option value="${v}" ${pref === v ? 'selected' : ''}>${v === 'auto' ? 'Automatic (touch screens)' : v === 'on' ? 'Always' : 'Never'}</option>`).join('')}
        </select>
      </div>

      <h2>Your data</h2>
      <p class="small">Progress is saved on this device only. Export a backup to move it between devices.</p>
      <div class="row">
        <button class="ghost" id="exp">Export progress</button>
        <label class="btn ghost" style="margin:0">Import<input type="file" id="imp" accept=".json,application/json" hidden></label>
        <button class="ghost" id="rst">Reset</button>
      </div>
      <p class="small" id="exp-msg"></p>
      <p class="small version">Quant Trainer ${QT.VERSION} · running as ${QT.platform.mode()}</p>`;

    // "Install as an app" card: only on the website, and only where installing is possible.
    const installBox = el.querySelector('#install');
    const drawInstall = () => {
      const P = QT.platform;
      if (P.native || P.standalone()) return (installBox.innerHTML = '');
      if (P.canInstall()) {
        installBox.innerHTML = `<h2>Install the app</h2><div class="card"><p style="margin-top:0">Add Quant Trainer to your home screen. It opens full-screen and works offline.</p><button id="do-install">Install</button></div>`;
        installBox.querySelector('#do-install').addEventListener('click', async () => { if (await P.install()) drawInstall(); });
      } else if (P.isIOS) {
        installBox.innerHTML = `<h2>Install the app</h2><div class="card"><p style="margin:0">In Safari, tap <b>Share</b> then <b>Add to Home Screen</b>. It opens full-screen and works offline.</p></div>`;
      } else installBox.innerHTML = '';
    };
    drawInstall();
    document.addEventListener('qt:installable', drawInstall, { once: true });

    el.querySelector('#kp').addEventListener('change', (e) => {
      try { localStorage.setItem('qt-keypad', e.target.value); } catch { /* ignore */ }
    });
    el.querySelector('#exp').addEventListener('click', async () => {
      const msg = el.querySelector('#exp-msg');
      try {
        const how = await QT.platform.exportFile(`quant-trainer-progress-${new Date().toISOString().slice(0, 10)}.json`, store.exportJson());
        msg.textContent = how === 'copied' ? 'Progress copied to the clipboard. Paste it somewhere safe.' : how === 'downloaded' ? 'Progress file downloaded.' : '';
      } catch {
        msg.textContent = 'Export failed. Try again.';
      }
    });
    el.querySelector('#imp').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        store.importJson(await file.text());
        location.hash = '#/';
      } catch {
        alert('That file could not be read as a progress export.');
      }
    });
    el.querySelector('#rst').addEventListener('click', () => {
      if (confirm('Erase all progress? This cannot be undone.')) {
        store.reset();
        location.hash = '#/';
      }
    });
  }

  // ---------------------------------------------------------------- roadmap
  const trackStats = (track) => {
    const ts = QT.topics.filter((t) => t.track === track).map((t) => store.get().topics[t.id] || { attempts: 0, correct: 0 });
    const a = ts.reduce((s, t) => s + t.attempts, 0), c = ts.reduce((s, t) => s + t.correct, 0);
    return { a, acc: a ? c / a : 0 };
  };

  const ROADMAP = [
    {
      stage: '1 · Probability fluency',
      items: [
        { id: 'p100', text: 'Solve 150 interview-track problems at 80%+ accuracy', auto: () => { const s = trackStats('interview'); return { done: s.a >= 150 && s.acc >= 0.8, note: `${s.a}/150 · ${pctStr(s.acc)}` }; } },
        { id: 'mosteller', text: 'Work through "Fifty Challenging Problems in Probability" (Mosteller)' },
        { id: 'sprint', text: 'Score 20+ on the 2-minute mental-maths sprint', auto: () => { const b = store.get().mental.sprint?.best ?? 0; return { done: b >= 20, note: `best ${b}` }; } },
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
        { id: 'cases', text: 'Work through every case study and be able to explain each in two minutes', auto: () => ({ done: casesDone() === QT.cases.length, note: `${casesDone()}/${QT.cases.length}` }) },
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
        { id: 'full55', text: 'Score 55+ net on the 80-in-8 test (commonly reported pass line; aim for 70+)', auto: () => { const b = store.get().mental.full?.best ?? 0; return { done: b >= 55, note: `best ${b}` }; } },
        { id: 'bank', text: 'Complete every question in the interview bank', auto: () => ({ done: bankDone() === QT.bank.length, note: `${bankDone()}/${QT.bank.length}` }) },
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

  // ---------------------------------------------------------------- router
  const routes = {
    '': dashboard,
    practice,
    topic: topicView,
    review: reviewView,
    cases: casesView,
    case: caseView,
    bank: bankView,
    iq: bankQuestion,
    mock: mockView,
    mistakes: mistakesView,
    coach: coachView,
    drill: drillView,
    estimate: (el) => QT.estimate.render(el),
    more: moreView,
    mental: (el) => QT.mental.render(el),
    market: (el) => QT.market.render(el),
    lab: (el) => QT.lab.render(el),
    roadmap,
  };
  // Which nav item lights up for each route (the bottom tab bar has fewer items than the sidebar).
  const NAV_PARENT = { topic: 'practice', case: 'cases', iq: 'bank', mock: 'bank', drill: 'coach' };
  const TAB_PARENT = { topic: 'practice', review: 'practice', mistakes: 'practice', drill: 'coach', cases: 'more', case: 'more', iq: 'bank', mock: 'bank', mental: 'more', market: 'more', estimate: 'more', lab: 'more', roadmap: 'more' };

  function route() {
    if (QT.cleanup) QT.cleanup();
    QT.cleanup = null;
    const [name = '', ...args] = location.hash.replace(/^#\/?/, '').split('/');
    const key = name in routes ? name : '';
    routes[key](main, ...args);
    const navKey = NAV_PARENT[key] ?? key, tabKey = TAB_PARENT[key] ?? key;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === navKey));
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.route === tabKey));
    updateBadges();
    const h1 = main.querySelector('h1');
    document.title = key && h1 ? `${h1.textContent} · Quant Trainer` : 'Quant Trainer';
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();

  // Native: if the WebView's storage was cleared but the durable copy survives, restore it.
  if (QT.platform.native && store.isEmpty()) {
    QT.platform.restore(store.KEY).then((json) => {
      if (!json) return;
      try {
        store.importJson(json);
        route();
      } catch { /* corrupt backup: keep the fresh state */ }
    });
  }
})();
