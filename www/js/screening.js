// Tech screening practice (#/code/screening): code-review exercises from screening-content.js,
// run the way the interview goes. Read the snippet, write your review against the clock, compare
// with a model review ranked by severity, see the improved version, write a deployment plan, then
// answer the fundamentals follow-ups. The mock (#/code/screening/mock) strings it all together in
// 45 minutes. Results are saved in state.code.review and state.code.smocks.
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const S = QT.screening;
  const SEV = { high: 'High', med: 'Medium', low: 'Low' };
  const sevRank = { high: 0, med: 1, low: 2 };

  const codeBlock = (code) => `<pre class="sc-code" tabindex="0"><code>${code.split('\n').map((l, i) => `<span class="sc-ln" aria-hidden="true">${i + 1}</span>${esc(l)}`).join('\n')}</code></pre>`;
  const runs = (id) => store.get().code.review[id] || [];

  function hub(el) {
    const mocks = store.get().code.smocks, G = S.GUIDE;
    el.innerHTML = `
      <a class="back" href="#/code">← Coding</a>
      <h1>Optiver tech screening: prep guide</h1>
      <p class="lede">Everything for the 45-minute software engineering tech screening in one place: what it is, what the interviewer looks for, a plan for the 45 minutes, how to prepare, what to say, and practice for each part.</p>
      <div class="row" style="margin:0 0 12px"><a class="btn" href="#/code/screening/sheet">One-page cheat sheet</a><a class="btn ghost" href="#/code/screening/mock">Full 45-minute mock</a><a class="btn ghost" href="#/code/screening/fundamentals/drill">Rapid-fire fundamentals</a></div>
      <nav class="card sc-toc" aria-label="On this page"><b>On this page</b> <button type="button" class="link" data-jump="sc-what">What it is</button> · <button type="button" class="link" data-jump="sc-look">What they look for</button> · <button type="button" class="link" data-jump="sc-time">The 45 minutes</button> · <button type="button" class="link" data-jump="sc-plan">How to prepare</button> · <button type="button" class="link" data-jump="sc-say">What to say</button> · <button type="button" class="link" data-jump="sc-snip">Practice snippets</button> · <button type="button" class="link" data-jump="sc-check">Checklists</button> · <button type="button" class="link" data-jump="sc-src">Sources</button></nav>
      <h2 id="sc-what">What the tech screening is</h2>
      <div class="card">${G.format}
        <p class="small" style="margin-bottom:6px"><b>Where it sits in the process:</b></p>
        <ol class="small" style="margin:0">${G.stages.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol></div>
      <h2 id="sc-look">What they look for</h2>
      <div class="sc-look">${G.looking.map(([h, t]) => `<div class="card"><b>${esc(h)}</b><p class="small" style="margin:4px 0 0">${esc(t)}</p></div>`).join('')}</div>
      <h2 id="sc-time">A plan for the 45 minutes</h2>
      <p class="small">Our estimate of how the time divides; the interviewer leads, so treat it as a guide to pacing, not a script.</p>
      <div class="fd-scroll"><table class="hb-table"><tr><th>Time</th><th>What happens</th><th>What to do</th></tr>${G.timing.map(([a, b, c]) => `<tr><td class="mono">${esc(a)}</td><td>${esc(b)}</td><td class="small">${esc(c)}</td></tr>`).join('')}</table></div>
      <div class="row" style="margin:12px 0"><a class="btn" href="#/code/screening/mock">Full mock: 45 minutes</a>${mocks.length ? `<span class="small">${mocks.length} mock${mocks.length > 1 ? 's' : ''} done, last ${(mocks[mocks.length - 1].s.reduce((a, b) => a + b, 0) / mocks[mocks.length - 1].s.length).toFixed(1)}/3</span>` : ''}</div>
      <h2 id="sc-plan">How to prepare, in order</h2>
      <ol class="sc-plan">${G.plan.map(([h, t, href]) => `<li><a href="${href}"><b>${esc(h)}</b></a>: ${esc(t)}</li>`).join('')}</ol>
      <a class="card sc-promo" href="#/code/screening/spot"><b>Learning to spot bugs</b><span class="small">The method behind a good review, ${QT.spotting.FAMILIES.length} families of bug with the tell that gives each away, ${QT.spotting.ITEMS.length} short snippets to train your eye, and ${QT.spotting.TRACES.length} "run it in your head" questions. Start here if you find bugs hard to see.</span></a>
      <a class="card sc-promo" href="#/code/screening/fundamentals"><b>Fundamentals: how hardware shapes design</b><span class="small">Computer architecture, memory management, concurrency, networking, and Python from the inside: the physical reality, the constraint it creates, the design it leads to. Latency numbers, the hot path of a trading system, ${QT.fundamentals.TOPICS.reduce((n, t) => n + t.questions.length, 0)} questions with model answers, and a self-check.</span></a>
      <h3>Related LeetCode problems</h3>
      <p class="small">LeetCode has no code-review problems, but these free ones are closest to the code you'll be shown: small trading-style systems where the choice of data structure matters. Each fundamentals topic lists more.</p>
      ${QT.fundamentalsLeetcode(G.leetcode)}
      <h2 id="sc-say">What to say: useful phrases</h2>
      <div class="card"><ul style="margin:0">${G.phrases.map(([h, t]) => `<li><b>${esc(h)}:</b> ${esc(t)}</li>`).join('')}</ul></div>
      <h2 id="sc-snip">Snippets to review</h2>
      <div class="menu">${S.EXERCISES.map((E) => {
        const r = runs(E.id), last = r[r.length - 1];
        const high = E.issues.filter((i) => i.sev === 'high').length;
        return `<a class="card" href="#/code/screening/${E.id}"><b>${esc(E.title)}</b><span class="small">${E.issues.length} issues to find (${high} serious) · about ${E.minutes} min</span><span class="small">${last ? `last: found ${last.f} of ${last.t}, ${last.h} of ${high} serious` : 'not tried'}</span></a>`;
      }).join('')}</div>
      <h2>How to review code in an interview</h2>
      <div class="card"><p style="margin-top:0">Read it once end to end before commenting, and say what you think it's for. Then go through in this order, raising the most serious things first, and for each one say <b>what's wrong, how you'd fix it, and what it would cost the business</b> if it shipped.</p>
        <ol>${S.REVIEW_ORDER.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol>
        <p class="small" style="margin-bottom:0">Ask questions when the context is unclear ("how often is this called?", "is this on the order path?"): the answer changes which issues matter. Prefer a few well-explained serious issues to a long list of style points.</p></div>
      <h2>What a deployment plan covers</h2>
      <div class="card"><ol style="margin-top:0">${S.DEPLOY_PLAN.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol>
        <p class="small" style="margin-bottom:0">Tie each step to the risk of this particular change. A fix on the order path needs a simulated exchange and a canary; a fix to a report needs a parallel run and a comparison. "Test it, deploy it, monitor it" with nothing specific is the weak answer.</p></div>
      <h2 id="sc-check">Checklists</h2>
      <div class="sc-look"><div class="card"><b>The day before</b><ul class="small" style="margin:6px 0 0">${G.before.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div class="card"><b>In the interview</b><ul class="small" style="margin:6px 0 0">${G.during.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></div>
      <h2 id="sc-src">Sources</h2>
      <ul class="small">${G.sources.map(([t, url, note]) => `<li>${url ? `<a href="${url}" target="_blank" rel="noopener">${esc(t)}</a>` : `<b>${esc(t)}</b>`}: ${esc(note)}</li>`).join('')}</ul>
      <p class="small">The snippets, model answers and timings are ours. Every planted bug is checked by running the code in research/verify_internals.py.</p>`;
    el.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => el.querySelector(`#${b.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  }

  // One exercise. In the mock, opts.stage limits what is shown and opts.onDone gets the result.
  function exercise(el, E) {
    const high = E.issues.filter((i) => i.sev === 'high').length;
    const issues = [...E.issues].sort((a, b) => sevRank[a.sev] - sevRank[b.sev]);
    el.innerHTML = `
      <a class="back" href="#/code/screening">← Tech screening</a>
      <h1>${esc(E.title)}</h1>
      <div class="card"><span class="eyebrow">The interviewer says</span><p style="margin-bottom:0">${esc(E.context)}</p></div>
      ${codeBlock(E.code)}
      <div class="row"><button type="button" class="ghost" id="sc-clock-go">Start the clock (${E.minutes} min)</button><span class="mono" id="sc-clock" aria-live="off"></span></div>
      <h2>1. Your review</h2>
      <p class="small">Write each issue you'd raise, most serious first: what's wrong, the fix, and why it matters. Say it out loud as you write.</p>
      <label class="small" for="sc-mine">Your review</label>
      <textarea id="sc-mine" rows="7" placeholder="Line 1: …"></textarea>
      <div class="row"><button type="button" id="sc-reveal">Compare with a model review</button></div>
      <div id="sc-model" hidden>
        <p class="small">Tick each one you raised (or clearly would have). Serious ones first.</p>
        <ul class="sc-issues">${issues.map((x, i) => `<li class="sc-issue sev-${x.sev}"><label><input type="checkbox" data-i="${i}"> <span class="chip">${SEV[x.sev]}</span> <span class="chip">${esc(x.cat)}</span> <span class="small">line ${esc(x.lines)}</span></label>
          <p>${esc(x.what)}</p><p class="small"><b>Fix:</b> ${esc(x.fix)}</p><p class="small"><b>Why it matters:</b> ${esc(x.impact)}</p></li>`).join('')}</ul>
        <details class="card"><summary><b>An improved version</b></summary>${codeBlock(E.improved)}</details>
        <h2>2. Deployment plan</h2>
        <p class="question">${esc(E.deploy.ask)}</p>
        <label class="small" for="sc-deploy">Your plan</label>
        <textarea id="sc-deploy" rows="5" placeholder="Test… stage… roll out… monitor… roll back…"></textarea>
        <div class="row"><button type="button" class="ghost" id="sc-deploy-go">Compare with a strong plan</button></div>
        <ul id="sc-deploy-good" class="dz-good" hidden>${E.deploy.good.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
        <h2>3. Fundamentals follow-ups</h2>
        <p class="small">Answer each out loud before opening it.</p>
        ${E.fundamentals.map(([q, a]) => `<details class="fu"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
        <div class="row" style="margin-top:14px"><button type="button" id="sc-save">Save my result</button><span class="small" id="sc-saved" aria-live="polite"></span></div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    let tick = null;
    QT.cleanup = () => clearInterval(tick);
    $('#sc-clock-go').addEventListener('click', () => {
      const end = Date.now() + E.minutes * 60000;
      $('#sc-clock-go').disabled = true;
      const draw = () => {
        const left = Math.max(0, end - Date.now());
        $('#sc-clock').textContent = left ? `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} left` : 'Time: compare with the model review.';
        if (!left) clearInterval(tick);
      };
      tick = setInterval(draw, 500);
      draw();
    });
    $('#sc-reveal').addEventListener('click', () => {
      $('#sc-model').hidden = false;
      $('#sc-reveal').disabled = true;
      $('#sc-mine').readOnly = true;
      clearInterval(tick);
    });
    $('#sc-deploy-go').addEventListener('click', () => { $('#sc-deploy-good').hidden = false; });
    $('#sc-save').addEventListener('click', () => {
      const got = [...el.querySelectorAll('.sc-issues input')].map((b) => b.checked);
      const f = got.filter(Boolean).length, h = issues.filter((x, i) => got[i] && x.sev === 'high').length;
      const all = store.get().code.review;
      all[E.id] = [...(all[E.id] || []), { date: new Date().toISOString(), f, t: issues.length, h }].slice(-20);
      store.touchDay();
      store.save();
      const missed = issues.filter((x, i) => !got[i] && x.sev === 'high');
      $('#sc-saved').textContent = `Saved: ${f} of ${issues.length} issues, ${h} of ${high} serious.${missed.length ? ` Missed serious: ${missed.map((x) => x.cat.toLowerCase()).join(', ')}.` : ''}`;
    });
  }

  // ---------------------------------------------------------------- the 45-minute mock
  const STAGES = [
    { t: 3, h: 'Introductions and first read', p: 'Introduce yourself in two sentences. Then read the snippet end to end, and say what you think it does and what you\'d want to know about how it\'s used.' },
    { t: 15, h: 'Review the code', p: 'Write your review, most serious issues first, saying each out loud: what\'s wrong, the fix, and what it would cost if it shipped.' },
    { t: 10, h: 'Discuss improvements', p: 'Compare with the model review. For anything you missed, say how you\'d have found it (a test, a question about usage). Then talk through the improved version.' },
    { t: 10, h: 'Deployment plan', p: 'Outline how you\'d get the fix into production safely: testing, staging, rollout, monitoring, rollback, communication.' },
    { t: 5, h: 'CS fundamentals', p: 'Answer each follow-up out loud, then open it to check.' },
    { t: 2, h: 'Your questions', p: 'Ask two questions about the team or the work. Good ones show you thought about the job: how they test changes to trading systems, how deployments are rolled out, what a first project looks like.' },
  ];
  const MOCK_RUBRIC = ['Read and understood the code before commenting', 'Found the serious issues, most serious first', 'Explained the business impact of each issue', 'Proposed concrete, correct fixes', 'Gave a deployment plan specific to this change', 'Explained fundamentals clearly, and asked good questions'];

  function mock(el) {
    const E = S.EXERCISES[Math.floor(Math.random() * S.EXERCISES.length)];
    const start = Date.now(), total = STAGES.reduce((a, s) => a + s.t, 0) * 60000;
    let stage = 0, tick = null;
    const issues = [...E.issues].sort((a, b) => sevRank[a.sev] - sevRank[b.sev]);
    el.innerHTML = `
      <a class="back" href="#/code/screening">← Tech screening</a>
      <h1>Tech screening mock</h1>
      <div class="session"><span id="mk-stage"></span><span class="mono" id="mk-clock"></span></div>
      <div class="card"><span class="eyebrow">The interviewer says</span><p style="margin-bottom:0">${esc(E.context)}</p></div>
      ${codeBlock(E.code)}
      <div class="card" id="mk-prompt"></div>
      <div id="mk-body"></div>
      <div class="row"><button type="button" id="mk-next">Next stage</button></div>`;
    const $ = (s) => el.querySelector(s), body = $('#mk-body');
    QT.cleanup = () => clearInterval(tick);
    const stageEnd = (k) => start + STAGES.slice(0, k + 1).reduce((a, s) => a + s.t, 0) * 60000;
    const draw = () => {
      const left = Math.max(0, start + total - Date.now()), over = Date.now() > stageEnd(stage);
      $('#mk-clock').textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} left${over ? ' · move on' : ''}`;
    };
    function show() {
      const S0 = STAGES[stage];
      $('#mk-stage').textContent = `Stage ${stage + 1} of ${STAGES.length}: ${S0.h} (${S0.t} min)`;
      $('#mk-prompt').innerHTML = `<b>${esc(S0.h)}.</b> ${esc(S0.p)}`;
      if (stage === 1) body.innerHTML = '<label class="small" for="mk-review">Your review</label><textarea id="mk-review" rows="8" placeholder="Most serious first…"></textarea>';
      if (stage === 2) {
        body.insertAdjacentHTML('beforeend', `<ul class="sc-issues">${issues.map((x, i) => `<li class="sc-issue sev-${x.sev}"><label><input type="checkbox" data-i="${i}"> <span class="chip">${SEV[x.sev]}</span> <span class="chip">${esc(x.cat)}</span> <span class="small">line ${esc(x.lines)}</span></label><p>${esc(x.what)}</p><p class="small"><b>Fix:</b> ${esc(x.fix)} <b>Impact:</b> ${esc(x.impact)}</p></li>`).join('')}</ul><details class="card"><summary><b>An improved version</b></summary>${codeBlock(E.improved)}</details>`);
        if ($('#mk-review')) $('#mk-review').readOnly = true;
      }
      if (stage === 3) body.insertAdjacentHTML('beforeend', `<h2>Deployment plan</h2><p class="question">${esc(E.deploy.ask)}</p><textarea id="mk-deploy" rows="5" aria-label="Your deployment plan"></textarea><details class="card"><summary>Compare with a strong plan (after writing yours)</summary><ul>${E.deploy.good.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></details>`);
      if (stage === 4) {
        // The snippet's own follow-ups, then two from the fundamentals bank, as an interviewer might widen the discussion.
        const bank = QT.fundamentals.TOPICS.flatMap((t) => t.questions).map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).slice(0, 2).map((x) => x[1]);
        body.insertAdjacentHTML('beforeend', `<h2>Fundamentals</h2>${E.fundamentals.map(([q, a]) => `<details class="fu"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}<p class="small">And more widely:</p>${bank.map(([q, a]) => `<details class="fu"><summary>${esc(q)}</summary><div>${a}</div></details>`).join('')}`);
      }
      if (stage === STAGES.length - 1) $('#mk-next').textContent = 'Finish and score yourself';
      draw();
    }
    function finish() {
      clearInterval(tick);
      QT.cleanup = null;
      const counts = () => {
        const found = [...el.querySelectorAll('.sc-issues input')].map((b) => b.checked);
        return [found.filter(Boolean).length, issues.filter((x, i) => found[i] && x.sev === 'high').length];
      };
      $('#mk-next').remove();
      $('#mk-prompt').innerHTML = `<b>Done in ${Math.round((Date.now() - start) / 60000)} minutes.</b> Check the issues you raised in the list above, then score yourself honestly:`;
      body.insertAdjacentHTML('beforeend', `<form id="mk-rubric" class="card">${MOCK_RUBRIC.map((r, i) => `<fieldset class="dz-score"><legend>${esc(r)}</legend>${[1, 2, 3].map((v) => `<label><input type="radio" name="r${i}" value="${v}" required> ${['', 'Not yet', 'Partly', 'Yes'][v]}</label>`).join('')}</fieldset>`).join('')}<button>Save the mock</button><p class="small" id="mk-saved" aria-live="polite"></p></form>`);
      $('#mk-rubric').addEventListener('submit', (e) => {
        e.preventDefault();
        const s = MOCK_RUBRIC.map((_, i) => +new FormData(e.target).get(`r${i}`)), [f, h] = counts();
        const all = store.get().code;
        all.smocks = [...all.smocks, { date: new Date().toISOString(), id: E.id, s, f, h }].slice(-30);
        all.review[E.id] = [...(all.review[E.id] || []), { date: new Date().toISOString(), f, t: issues.length, h }].slice(-20);
        store.touchDay();
        store.save();
        const weakest = MOCK_RUBRIC[s.indexOf(Math.min(...s))];
        const nHigh = issues.filter((x) => x.sev === 'high').length;
        $('#mk-saved').textContent = `Saved: ${(s.reduce((a, b) => a + b, 0) / s.length).toFixed(1)} out of 3, with ${f} of ${issues.length} issues found (${h} of ${nHigh} serious). ${Math.min(...s) === 3 ? 'Strong across the board: try another snippet.' : `Work on: ${weakest.toLowerCase()}.`}`;
      });
    }
    $('#mk-next').addEventListener('click', () => {
      if (stage === STAGES.length - 1) return finish();
      stage++;
      show();
    });
    tick = setInterval(draw, 1000);
    show();
  }

  QT.screeningView = (el, id, sub) => {
    if (id === 'mock') return mock(el);
    if (id === 'spot') return QT.spottingView(el, sub);
    if (id === 'fundamentals') return QT.fundamentalsView(el, sub);
    if (id === 'sheet') return QT.screeningSheet(el);
    const E = id && S.byId(id);
    return E ? exercise(el, E) : hub(el);
  };
  QT.screeningView.STAGES = STAGES;
})();
