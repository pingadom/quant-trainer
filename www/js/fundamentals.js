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
    const t = id && F().byId[id];
    return t ? topic(el, t) : overview(el);
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
