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
    const all = QT.topics.map((t) => ({ t, m: QT.mastery(t.id) }));
    const attempts = all.reduce((a, x) => a + x.m.attempts, 0);
    const correct = Object.values(s.topics).reduce((a, t) => a + t.correct, 0);
    const weakest = [...all].sort((a, b) => a.m.score - b.m.score).slice(0, 3);
    const mk = s.market;
    const todo = QT.cases.filter((c) => caseProgress(c).answered < c.questions.length);
    const featured = todo.length ? todo[new Date().getDate() % todo.length] : null;

    el.innerHTML = `
      <h1>Dashboard</h1>
      <p class="lede">A daily routine: 15 mixed-review problems, one mental-maths sprint and one market-making game. Consistency beats cramming.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${store.streak()}</div><div class="k">day streak</div></div>
        <div class="tile"><div class="v">${attempts}</div><div class="k">problems attempted</div></div>
        <div class="tile"><div class="v">${attempts ? pctStr(correct / attempts) : '–'}</div><div class="k">overall accuracy</div></div>
        <div class="tile"><div class="v">${s.mental.full?.best ?? '–'}</div><div class="k">80-in-8 best (net)</div></div>
        <div class="tile"><div class="v">${mk.games ? f(mk.total / mk.games) : '–'}</div><div class="k">avg market P&amp;L</div></div>
        <div class="tile"><div class="v">${casesDone()}/${QT.cases.length}</div><div class="k">case studies</div></div>
        <div class="tile"><div class="v">${bankDone()}/${QT.bank.length}</div><div class="k">interview questions</div></div>
      </div>

      <h2>Real interview questions</h2>
      <div class="card">
        <p style="margin-top:0">Questions candidates report from Jane Street, SIG, Optiver, IMC, Citadel, Five Rings, Two Sigma and Flow Traders, with worked solutions and each firm's reported process.</p>
        <div class="row"><a class="btn" href="#/bank">Browse questions</a><a class="btn ghost" href="#/mock">Start a mock interview</a></div>
      </div>

      ${QT.mistakes.due().length ? `<div class="card due-card"><b>${QT.mistakes.due().length} mistake${QT.mistakes.due().length > 1 ? 's' : ''} due for review.</b> Spaced review is the fastest way to stop repeating them. <a class="btn" href="#/mistakes/due">Review now</a></div>` : ''}

      ${featured ? `<h2>Today's case study</h2>${caseCard(featured)}` : ''}

      <h2>Focus next</h2>
      <div class="grid">${weakest.map(({ t, m }) => topicCard(t, m)).join('')}</div>
      <div class="row" style="margin-top:14px">
        <a class="btn" href="#/review">Start mixed review</a>
        <a class="btn ghost" href="#/mental">Mental maths</a>
        <a class="btn ghost" href="#/market">Market making</a>
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
      <h1>Topics</h1>
      <p class="lede">Every problem is randomly generated, so you can drill a topic indefinitely. The bar shows mastery: recent accuracy, discounted until you've done about 20 problems.</p>
      <div class="row"><a class="btn" href="#/review">Mixed review</a><a class="btn ghost" href="#/mistakes">Mistakes deck <span class="badge" data-badge="mistakes" hidden></span></a><a class="btn ghost" href="#/bank">Real interview questions</a></div>
      ${Object.entries(TRACKS).map(([k, label]) => `
        <h2>${label}</h2>
        <div class="grid">${QT.topics.filter((t) => t.track === k).map((t) => topicCard(t, QT.mastery(t.id))).join('')}</div>`).join('')}`;
  }

  // Weighted pick: weak and unseen topics come up more often.
  function adaptivePick(pool) {
    const w = pool.map((t) => 1.2 - QT.mastery(t.id).score);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) if ((r -= w[i]) <= 0) return pool[i];
    return pool[pool.length - 1];
  }

  const topicSource = (pickTopic) => () => {
    const t = pickTopic();
    return { tag: t.name, p: R.pick(t.gens)(), record: (ok) => store.recordAttempt(t.id, ok) };
  };

  function topicView(el, id) {
    const t = QT.topicById(id);
    if (!t) return practice(el);
    el.innerHTML = `
      <a class="back" href="#/practice">← Topics</a>
      <h1>${t.name}</h1>
      <p class="lede">${TRACKS[t.track]} · ${t.blurb}</p>
      <details class="notes"><summary>Key formulas</summary>${t.notes}</details>
      <div id="qbox"></div>`;
    questionCard(el.querySelector('#qbox'), topicSource(() => t));
  }

  function reviewView(el, track) {
    const pool = QT.topics.filter((t) => !TRACKS[track] || t.track === track);
    el.innerHTML = `
      <h1>Mixed review</h1>
      <p class="lede">${TRACKS[track] || 'All topics'}. Weak topics come up more often.</p>
      <div class="row" style="margin-bottom:14px">
        ${[['', 'All'], ['interview', 'Interview'], ['foundations', 'Foundations']].map(([k, l]) => `<a class="btn ${(track || '') === k ? '' : 'ghost'}" href="#/review${k ? '/' + k : ''}">${l}</a>`).join('')}
      </div>
      <div id="qbox"></div>`;
    questionCard(el.querySelector('#qbox'), topicSource(() => adaptivePick(pool)));
  }

  // A question card driven by `source()`, which returns { tag, p, record(ok) } or null when finished.
  function questionCard(box, source, onDone) {
    let solved = 0, right = 0, item, answered = false, simToken = 0;

    box.innerHTML = `
      <div class="session"><span id="s-count"></span></div>
      <div class="card">
        <div class="tag" id="p-tag"></div>
        <div class="question" id="p-q"></div>
        <form class="answer-row" id="p-form">
          <input type="text" id="p-in" inputmode="decimal" autocomplete="off" placeholder="e.g. 5/36, 0.139 or 13.9%" aria-label="Your answer">
          <button id="p-btn">Check</button>
          <button type="button" class="ghost" id="p-skip">Show answer</button>
        </form>
        <div id="p-fb" aria-live="polite"></div>
      </div>
      <p class="small" style="margin-top:12px">Answers can be decimals, fractions or percentages; small rounding differences are accepted. Press Enter (↵) again for the next problem.</p>`;

    const $ = (s) => box.querySelector(s);
    const $in = $('#p-in'), $fb = $('#p-fb'), $btn = $('#p-btn'), $skip = $('#p-skip'), form = $('#p-form');
    const kp = QT.keypad.attach(form, [$in], () => form.requestSubmit());

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
      $btn.textContent = 'Check';
      $skip.hidden = false;
      $('#s-count').textContent = solved ? `This session: ${right}/${solved} correct` : 'New session';
      if (!kp) $in.focus();
    }

    function reveal(ok, userVal) {
      const p = item.p;
      answered = true;
      solved++;
      if (ok) right++;
      const fate = item.record(ok);
      if (!ok && !item.isReview) QT.mistakes.add(item.tag, p); // comes back for spaced review
      updateBadges();
      $in.disabled = true;
      $skip.hidden = true;
      $btn.textContent = 'Next →';
      $('#s-count').textContent = `This session: ${right}/${solved} correct`;
      const note = item.isReview ? (fate === 'mastered' ? ' · mastered, removed from your deck' : ok ? ` · ${fate}` : ' · back to tomorrow') : !ok ? ' · saved to your mistakes deck' : '';
      const head = ok
        ? `<div class="fb ok">✓ Correct: ${f(p.a)}<span class="fb-note">${note}</span></div>`
        : `<div class="fb bad">✗ ${userVal === undefined ? 'Answer' : `You said ${f(userVal)}. Answer`}: ${f(p.a)}<span class="fb-note">${note}</span></div>`;
      $fb.innerHTML = `${head}<div class="solution">${p.sol}</div>
        ${p.sim ? `<div class="row" style="margin-top:10px"><button type="button" class="ghost" id="p-sim">Check by simulation</button></div><div class="sim-out" id="p-simout"></div>` : ''}`;
      if (p.sim) $('#p-sim').addEventListener('click', runSim);
      if (!kp) $btn.focus();
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
      const v = QT.parseAnswer($in.value);
      if (Number.isNaN(v)) {
        $fb.innerHTML = `<div class="fb bad">Couldn't read that. Try a number like 0.25, 1/4 or 25%.</div>`;
        return;
      }
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
        <a class="back" href="#/mistakes">← Mistakes deck</a>
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
      <h1>Mistakes deck</h1>
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
      <div class="menu">
        <a class="card" href="#/mental"><b>Mental maths</b><span class="small">80-in-8 format and a 2-minute sprint</span></a>
        <a class="card" href="#/market"><b>Market making</b><span class="small">Quote on hidden dice against informed flow</span></a>
        <a class="card" href="#/estimate"><b>Estimation &amp; calibration</b><span class="small">Quote ranges on unknown quantities</span></a>
        <a class="card" href="#/mistakes"><b>Mistakes deck <span class="badge" data-badge="mistakes" hidden></span></b><span class="small">Spaced review of everything you got wrong</span></a>
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
    estimate: (el) => QT.estimate.render(el),
    more: moreView,
    mental: (el) => QT.mental.render(el),
    market: (el) => QT.market.render(el),
    lab: (el) => QT.lab.render(el),
    roadmap,
  };
  // Which nav item lights up for each route (the bottom tab bar has fewer items than the sidebar).
  const NAV_PARENT = { topic: 'practice', case: 'cases', iq: 'bank', mock: 'bank' };
  const TAB_PARENT = { topic: 'practice', review: 'practice', mistakes: 'practice', case: 'cases', iq: 'bank', mock: 'bank', mental: 'more', market: 'more', estimate: 'more', lab: 'more', roadmap: 'more' };

  function route() {
    if (QT.cleanup) QT.cleanup();
    QT.cleanup = null;
    const [name = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
    const key = name in routes ? name : '';
    routes[key](main, arg);
    const navKey = NAV_PARENT[key] ?? key, tabKey = TAB_PARENT[key] ?? key;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === navKey));
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.route === tabKey));
    updateBadges();
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
