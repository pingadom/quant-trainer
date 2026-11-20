// Fundamentals for the tech screening (#/code/screening/fundamentals[/<topic>]), from
// fundamentals-content.js. The overview has the answering method, latency numbers and the hot path;
// each topic page has the reality → constraint → design notes, questions with model answers to say
// out loud first, and a self-check. Results are kept in state.code.fund (check id → 1 right, 0 wrong).
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const F = () => QT.fundamentals;
  const done = () => store.get().code.fund;

  const lcList = (rows) => `<ul class="fd-lc">${rows.map(([n, title, slug, diff, why]) => `<li><a href="https://leetcode.com/problems/${slug}/" target="_blank" rel="noopener">${n}. ${esc(title)}</a> <span class="chip">${diff}</span> <span class="small">${esc(why)}</span></li>`).join('')}</ul>`;
  QT.fundamentalsLeetcode = lcList;

  QT.fundamentalsView = (el, id) => {
    if (id === 'drill') return drill(el);
    if (id === 'sheet') return sheet(el);
    const t = id && F().byId[id];
    return t ? topic(el, t) : overview(el);
  };

  // ---------------------------------------------------------------- rapid fire
  // Ten questions from every topic: answer out loud, open the model answer, then mark it. Questions
  // marked "again" come first next time, then ones never seen, then the rest, shuffled.
  const allQs = () => F().TOPICS.flatMap((t) => t.questions.map(([q, a], i) => ({ key: `${t.id}:${i}`, t, q, a })));
  function pickDrill(n) {
    const seen = store.get().code.fundQ, shuffle = (xs) => xs.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const again = shuffle(allQs().filter((x) => seen[x.key] === 0)), fresh = shuffle(allQs().filter((x) => seen[x.key] === undefined)), known = shuffle(allQs().filter((x) => seen[x.key] === 1));
    return [...again, ...fresh, ...known].slice(0, n);
  }
  function drill(el) {
    const qs = pickDrill(10), marks = [];
    let i = 0;
    const show = () => {
      const x = qs[i];
      el.innerHTML = `
        <a class="back" href="#/code/screening/fundamentals">← Fundamentals</a>
        <h1>Rapid fire: fundamentals</h1>
        <div class="session"><span>Question ${i + 1} of ${qs.length}</span><span class="small">${esc(x.t.title)}</span></div>
        <div class="card"><p class="question">${esc(x.q)}</p>
          <p class="small">Answer out loud first, in about a minute: the physical fact, the constraint, the design choice, the trade-off.</p>
          <button type="button" id="fr-show">Show the model answer</button>
          <div class="solution" id="fr-sol" hidden>${x.a}</div>
          <div class="row" id="fr-rate" hidden style="margin-top:10px"><span class="small">How did your answer compare?</span><button type="button" class="ghost" data-r="0">Again: missed key points</button><button type="button" data-r="1">Got it</button></div></div>`;
      el.querySelector('#fr-show').addEventListener('click', (e) => { e.target.hidden = true; el.querySelector('#fr-sol').hidden = false; el.querySelector('#fr-rate').hidden = false; });
      el.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        const ok = b.dataset.r === '1';
        store.get().code.fundQ[x.key] = ok ? 1 : 0;
        marks.push({ x, ok });
        store.save();
        if (++i < qs.length) show(); else end();
      }));
    };
    const end = () => {
      const right = marks.filter((m) => m.ok).length, c = store.get().code;
      c.fundLog = [...c.fundLog, { date: new Date().toISOString(), n: marks.length, right }].slice(-60);
      store.touchDay();
      store.save();
      const missed = marks.filter((m) => !m.ok);
      el.innerHTML = `
        <a class="back" href="#/code/screening/fundamentals">← Fundamentals</a>
        <h1>Rapid fire: done</h1>
        <div class="tiles"><div class="tile"><div class="v">${right}<span class="of">/${marks.length}</span></div><div class="k">answered well</div></div></div>
        ${missed.length ? `<h2>To revisit</h2><p class="small">These come first next time.</p><ul>${missed.map((m) => `<li><a href="#/code/screening/fundamentals/${m.x.t.id}">${esc(m.x.t.title)}</a>: ${esc(m.x.q)}</li>`).join('')}</ul>` : '<p>All ten answered well.</p>'}
        <div class="row" style="margin-top:14px"><button type="button" id="fr-again">Ten more</button><a class="btn ghost" href="#/code/screening/fundamentals">All topics</a></div>`;
      el.querySelector('#fr-again').addEventListener('click', () => drill(el));
    };
    show();
  }

  // ---------------------------------------------------------------- the fundamentals cheat sheet
  function sheet(el) {
    const f = F();
    el.innerHTML = `
      <a class="back no-print" href="#/code/screening/fundamentals">← Fundamentals</a>
      <div class="title-row"><h1>Fundamentals cheat sheet</h1><button type="button" class="ghost no-print" id="fs-print">Print</button></div>
      <p class="small">Each row is an answer: the physical fact, the constraint it creates, and the design choice it leads to. Say them in that order, then add the trade-off.</p>
      ${f.SHEET.map(([title, rows]) => `<section class="fs-sec"><h2>${esc(title)}</h2><div class="fd-scroll"><table class="hb-table fs-table"><tr><th>Physical reality</th><th>Constraint</th><th>Design choice</th></tr>${rows.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table></div></section>`).join('')}
      <section class="fs-sec"><h2>Latency numbers</h2><div class="fd-scroll"><table class="hb-table fs-table">${f.LATENCY.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td></tr>`).join('')}</table></div></section>
      <section class="fs-sec"><h2>Python costs</h2><div class="fd-scroll"><table class="hb-table fs-table">${f.PYCOST.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td></tr>`).join('')}</table></div></section>
      <p class="small no-print">More depth, with questions and model answers, in each <a href="#/code/screening/fundamentals">fundamentals topic</a>.</p>`;
    el.querySelector('#fs-print').addEventListener('click', () => window.print());
  }

  // ---------------------------------------------------------------- the cheat sheet
  // One page for the morning of the screening, and printable.
  QT.screeningSheet = (el) => {
    const S = QT.screening, G = S.GUIDE, f = F();
    const ratios = f.LATENCY.filter(([a]) => /L1|Main memory|context switch|data centre|fibre|London/.test(a));
    el.innerHTML = `
      <a class="back no-print" href="#/code/screening">← Tech screening</a>
      <div class="title-row"><h1>Tech screening: cheat sheet</h1><button type="button" class="ghost no-print" id="sh-print">Print</button></div>
      <p class="small">Everything on one page, for a last read before the interview.</p>
      <div class="sh-grid">
        <section class="card"><h2>The 45 minutes</h2><ol class="small">${G.timing.map(([t, h, d]) => `<li><b>${esc(t)}: ${esc(h)}</b> ${esc(d)}</li>`).join('')}</ol></section>
        <section class="card"><h2>Reviewing the snippet</h2><ol class="small">${S.REVIEW_ORDER.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol><p class="small"><b>For each issue:</b> what's wrong, the fix, the business impact. Most serious first.</p></section>
        <section class="card"><h2>Bug tells</h2><ul class="small">${QT.spotting.FAMILIES.map(([, name, tell]) => `<li><b>${esc(name)}:</b> ${esc(tell)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Deployment plan</h2><ol class="small">${S.DEPLOY_PLAN.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol></section>
        <section class="card"><h2>Answering fundamentals</h2><ol class="small">${f.METHOD.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol>
          <table class="hb-table small">${ratios.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td></tr>`).join('')}</table></section>
        <section class="card"><h2>Python costs</h2><table class="hb-table small">${f.PYCOST.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td></tr>`).join('')}</table>
          <p class="small">A float is a 24-byte object; a list of a million floats is about 32 MB, a NumPy array 8 MB. The GIL: threads help I/O, not CPU work.</p>
          <p class="small no-print"><a href="#/code/screening/fundamentals/sheet">The full fundamentals cheat sheet →</a></p></section>
        <section class="card"><h2>Useful phrases</h2><ul class="small">${G.phrases.map(([h, t]) => `<li><b>${esc(h)}:</b> ${esc(t)}</li>`).join('')}</ul></section>
        <section class="card"><h2>In the interview</h2><ul class="small">${G.during.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
      </div>`;
    el.querySelector('#sh-print').addEventListener('click', () => window.print());
  };

  function score(t) {
    const d = done();
    return t.checks.filter((c) => d[c.id] === 1).length;
  }

  function overview(el) {
    el.innerHTML = `
      <a class="back" href="#/code/screening">← Tech screening</a>
      <h1>Fundamentals: how hardware shapes design</h1>
      <p class="lede">The screening's fundamentals questions cover computer architecture, networking, concurrency and memory management, and the best answers connect them: a physical fact about computers, the constraint it creates, and the design choice it leads to. Each topic below is built that way, with likely questions to answer out loud and a quick self-check.</p>
      <h2>How to answer a fundamentals question</h2>
      <div class="card"><ol style="margin:0">${F().METHOD.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol>
        <p class="small" style="margin-bottom:0">Interviewers care less about exact numbers than about whether you know the ratios (memory is ~100× slower than cache; a city away is milliseconds) and can reason from them.</p></div>
      <div class="row" style="margin:12px 0"><a class="btn" href="#/code/screening/fundamentals/drill">Rapid fire: 10 questions out loud</a><a class="btn ghost" href="#/code/screening/fundamentals/sheet">Fundamentals cheat sheet</a><a class="btn ghost" href="#/code/screening/sheet">Whole-screening cheat sheet</a></div>
      <h2>Topics</h2>
      <div class="menu">${F().TOPICS.map((t) => `<a class="card" href="#/code/screening/fundamentals/${t.id}"><b>${esc(t.title)}</b><span class="small">${esc(t.blurb)}</span><span class="small">${t.questions.length} questions · self-check ${score(t)}/${t.checks.length}</span></a>`).join('')}</div>
      <h2>Latency numbers worth knowing</h2>
      <p class="small">Orders of magnitude for a modern server; exact values vary with hardware, so learn the ratios.</p>
      <div class="fd-scroll"><table class="hb-table fd-lat"><tr><th>Operation</th><th>Time</th><th>Note</th></tr>${F().LATENCY.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td class="mono">${esc(b)}</td><td class="small">${esc(c)}</td></tr>`).join('')}</table></div>
      <h2>Putting it together: the hot path of a trading system</h2>
      <p class="small">If you're asked to "walk through what happens when a price changes", this is the shape of a good answer. Each step names the fundamental that shapes it.</p>
      <ol class="fd-path">${F().HOTPATH.map(([h, what, why]) => `<li><b>${esc(h)}.</b> ${esc(what)}<br><span class="small">${esc(why)}</span></li>`).join('')}</ol>
      <p class="small">The figures are standard orders of magnitude (from vendor documentation and widely published measurements), rounded; the explanations and questions are ours.</p>`;
  }

  function topic(el, t) {
    const all = F().TOPICS, i = all.indexOf(t), next = all[i + 1];
    el.innerHTML = `
      <a class="back" href="#/code/screening/fundamentals">← Fundamentals</a>
      <h1>${esc(t.title)}</h1>
      <h2>The physical reality</h2><div class="card">${t.reality}</div>
      <h2>The constraints it creates</h2><div class="card">${t.constraints}</div>
      <h2>How it shapes design</h2><div class="card">${t.design}</div>
      <h2>Questions to answer out loud</h2>
      <p class="small">Say your answer first (reality → constraint → design → trade-off), then open the model answer.</p>
      ${t.questions.map(([q, a]) => `<details class="card fd-q"><summary><b>${esc(q)}</b></summary><div class="solution">${a}</div></details>`).join('')}
      ${t.leetcode?.length ? `<h2>Related LeetCode problems</h2><p class="small">Free problems that exercise this topic. Solve them in Python, then explain your choice of structure out loud as you would in the screening.</p>${lcList(t.leetcode)}` : ''}
      <h2>Self-check</h2>
      <div id="fd-checks">${t.checks.map(check).join('')}</div>
      <div class="row" style="margin-top:12px">${next ? `<a class="btn" href="#/code/screening/fundamentals/${next.id}">Next: ${esc(next.title)} →</a>` : ''}<a class="btn ghost" href="#/code/screening/fundamentals">All topics</a></div>`;
    el.querySelectorAll('.fd-check').forEach((box) => wire(box, t.checks.find((c) => c.id === box.dataset.id)));
  }

  function check(c) {
    const prev = done()[c.id];
    const status = prev === 1 ? '<span class="status-tag done">Right last time</span>' : '';
    if (c.opts) {
      // The right answer is written first; show the options in a fixed shuffled order.
      const order = c.opts.map((_, i) => i).sort((a, b) => ((a * 7 + c.id.length) % 5) - ((b * 7 + c.id.length) % 5));
      return `<div class="card fd-check" data-id="${c.id}"><p class="question">${esc(c.q)} ${status}</p>
        <div class="hb-opts">${order.map((k) => `<button type="button" class="hb-opt" data-k="${k}">${esc(c.opts[k][0])}</button>`).join('')}</div>
        <div class="hb-fb" aria-live="polite"></div><div class="solution" hidden>${c.sol}</div></div>`;
    }
    return `<form class="card fd-check" data-id="${c.id}" autocomplete="off"><p class="question">${esc(c.q)} ${status}</p>
      <div class="answer-row"><input type="text" aria-label="Your answer" placeholder="Your answer"><button>Check</button></div>
      <div class="hb-fb" aria-live="polite"></div><div class="solution" hidden>${c.sol}</div></form>`;
  }

  function record(c, ok) {
    store.get().code.fund[c.id] = ok ? 1 : 0;
    store.touchDay();
    store.save();
  }

  function wire(box, c) {
    const fb = box.querySelector('.hb-fb'), sol = box.querySelector('.solution');
    if (c.opts) {
      box.querySelectorAll('.hb-opt').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k, ok = k === 0;
        box.querySelectorAll('.hb-opt').forEach((x) => { x.disabled = true; });
        b.classList.add(ok ? 'right' : 'wrong');
        fb.innerHTML = ok ? '<span class="fb-inline ok">✓ Right</span>' : `<span class="fb-inline bad">Not that one.</span> ${esc(c.opts[k][1] || '')}`;
        sol.hidden = false;
        record(c, ok);
      }));
      return;
    }
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = box.querySelector('input').value;
      if (!raw.trim()) { fb.textContent = 'Type an answer first.'; return; }
      const v = QT.parseAnswer(raw);
      if (Number.isNaN(v)) { fb.textContent = "Couldn't read that. Try a number like 4.7 or 125."; return; }
      const ok = QT.isCorrectFor(v, c);
      fb.innerHTML = ok ? '<span class="fb-inline ok">✓ Right</span>' : '<span class="fb-inline bad">Not quite.</span>';
      sol.hidden = false;
      record(c, ok);
    });
  }
})();
