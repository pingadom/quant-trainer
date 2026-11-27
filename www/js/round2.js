// Optiver interview 2 prep (#/code/round2): the round after the tech screening, a system design
// role-play and a live coding challenge, about an hour each over Zoom. The hub gathers what the
// invitation says, what candidates report, how to approach each interview, the role-plays (system
// design problems in design-problems.js marked `system`) and the live coding mocks (problems in
// code-problems.js with a `mock` id, run in parts at #/code/round2/live/<mock>).
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));

  const MOCKS = {
    positions: { title: 'Position keeper', blurb: 'Positions from fills, then realised P&L with FIFO lots, then mark-to-market P&L and a position limit.' },
    feed: { title: 'Order book from a feed', blurb: 'Price levels, then sequence numbers with gaps and duplicates, then the cost of buying or selling a quantity.' },
    risk: { title: 'Pre-trade risk gate', blurb: 'Size and rate limits, then position limits, then a kill switch that trips itself.' },
  };

  const SD_STEPS = [
    ['Restate and ask (about 10 minutes)', 'Say the goal back in one sentence, then ask about: who uses it and how (automated or people); how fast it must be and whether we compete on speed; volumes (updates and orders per second, peaks); what the exchange offers (protocols, locations); what happens if it goes wrong (money at risk, rules such as kill switches); budget and team; records the regulator needs; what comes next (more markets).'],
    ['Do the numbers', 'Message rates × message size = bandwidth; distance × 5 µs per km of fibre = latency; state size; orders per second. Say them out loud: it turns opinions into decisions.'],
    ['Draw the flow (about 25 minutes)', 'Market data in → book → strategy → risk checks → order gateway → exchange, and execution reports back to positions. Then the slow side: recording, monitoring, user interface, storage. Keep the latency-critical path separate from everything else.'],
    ['Place it physically', 'Where the servers sit (colocated at the exchange, or not), what crosses which network, what must be fast and what can be cheap.'],
    ['Make it safe', 'Pre-trade risk limits, a kill switch, sequence numbers and gap recovery, cancel-on-disconnect, reconciliation, monitoring and alerts. Trading systems are judged on what happens when things go wrong.'],
    ['Handle the curveballs (about 20 minutes)', 'Disconnects, lost data, crashes, bugs, growth, cost cuts. For each: what we detect, what we do automatically, what a person decides.'],
    ['Close with trade-offs', 'Name what you chose, what it cost, and what you\'d do with more time or money.'],
  ];

  const SD_NUMBERS = [
    ['Light in fibre', '5 µs per km (2/3 of c); microwave ~3.3 µs per km'],
    ['Amsterdam ↔ Frankfurt', '363 km straight: ~1.8–2.4 ms one way by fibre, ~1.2 ms by microwave'],
    ['London ↔ New York round trip', '~60–70 ms'],
    ['Colocated round trip to the exchange', 'tens of µs'],
    ['Kernel TCP round trip in a data centre', '~10–50 µs; ~1–5 µs with kernel bypass'],
    ['A small market data message', '~32–100 bytes; 50,000/s × 64 B ≈ 26 Mb/s'],
    ['Main memory / L1 cache', '~100 ns / ~1 ns'],
    ['Disk write with fsync', 'up to milliseconds: keep it off the hot path'],
  ];

  const LC_STEPS = [
    ['Read and restate', 'Say what each method must do and what it returns. Ask about the inputs: sizes, ranges, can things be missing or repeated, what to return in odd cases.'],
    ['Work an example by hand', 'Use the given example; make one tricky case (empty, a flip from long to short, a duplicate message).'],
    ['Choose the data structures out loud', 'Say what you\'ll store and what each operation will cost before typing. Interviewers care about why: "a deque, because fills close the oldest lot first".'],
    ['Write clean code in small steps', 'Good names, small helper methods, no clever one-liners. Run it on the example early, not just at the end.'],
    ['Test like an engineer', 'Walk through edge cases; say how you\'d unit-test it. Fix bugs calmly, out loud.'],
    ['Expect the next part', 'The interviewer will add a requirement once it works. Code that\'s easy to extend (clear state, separate methods) makes part 2 quick.'],
  ];

  const PY_TOOLS = [
    ['collections.deque', 'FIFO queues: lots, time windows, message buffers. O(1) at both ends.'],
    ['dict / defaultdict', 'Per-symbol state, order id → order, price → size.'],
    ['heapq', 'Best price with lazy deletion; earliest event first. Negate for a max-heap.'],
    ['bisect / insort', 'A sorted list of price levels: O(log n) search, O(n) insert (fast in practice).'],
    ['dataclasses / __slots__', 'Readable records (an Order with id, side, price, qty) that use less memory.'],
    ['enum or string constants', '"BUY"/"SELL", order states: never compare free-typed strings in many places.'],
  ];

  const PLAN = [
    ['Days 1–2', 'Read this page and the fundamentals cheat sheet. Do the first live coding mock (position keeper), all three parts, against the clock.'],
    ['Days 3–4', 'Role-play "Trading BMW in Frankfurt from Amsterdam" out loud, recorded. Listen back: did you ask before designing? Redo the weakest part.'],
    ['Days 5–6', 'Live coding mock 2 (order book from a feed). Then the existing limit order book problem.'],
    ['Days 7–8', 'Role-plays: order flow, then prices from several exchanges.'],
    ['Days 9–10', 'Live coding mock 3 (risk gate). Rapid-fire fundamentals daily.'],
    ['Days 11–12', 'Role-plays: market data platform, remote desk. Redo your lowest-scoring role-play.'],
    ['Day before', 'One full role-play and one live coding mock, then stop. Prepare two questions for each interviewer.'],
  ];

  const SOURCES = [
    ['Optiver\'s invitation to this round (your email)', '', 'Official: a system design role-play as a startup trading firm\'s CTO, where you ask the questions; a live coding challenge on a practical trading problem in Python, C++ or Java on the Optiver Assessment Platform; about an hour each, over Zoom.'],
    ['Optiver: interview tips for software engineers', 'https://optiver.com/working-at-optiver/career-hub/optiver-interview-tips-for-software-engineers/', 'Official advice: clarifying questions, explaining design choices, data structure costs, fundamentals.'],
    ['FastPrep: 15 Optiver SWE intern system design experiences, 2020–2026', 'https://www.fastprep.io/experience/2020-2026-optiver-swe-intern-system-design-interviews-15-experiences-e2q46vdzda', 'Candidate reports: an Amsterdam trading company needing to use the Frankfurt exchange (asked about hardware, latency, bandwidth, cost and the UI); a cross-site trading app where compression mattered; prices from several exchanges with fast queries; concurrency follow-ups. Unverified, but consistent.'],
    ['Quantt: Optiver interview', 'https://www.quantt.co.uk/resources/optiver-interview', 'Prep site: an order book with limit, market and cancel as a typical coding problem; cache behaviour, allocation and lock-free structures.'],
    ['SpaceComplexity: Optiver system design', 'https://spacecomplexity.ai/blog/optiver-system-design-interview', 'Prep site, unsourced: ask the latency target first; multicast with gap recovery; no databases or message brokers on the order path.'],
  ];

  // ---------------------------------------------------------------- a dated plan to your interview
  // Six steps of preparation, fitted to the days between setting the date and the interview: more
  // days stretch a step over two, fewer squeeze several into one. Tasks the app can see tick
  // themselves (a module's self-checks answered, a role-play scored, a mock part solved); the rest
  // you tick. Anything left from an earlier day comes back as "catch up".
  const DAY = 864e5;
  const S = () => store.get().code;
  const mod = (id) => {
    const m = QT.round2Guide.byId[id], n = QT.round2Guide.MODULES.indexOf(m) + 1;
    return { id: `mod-${id}`, label: `Study guide module ${n}: ${m.title}`, href: `#/code/round2/guide/${id}`, auto: () => m.checks.every((c) => c.id in (S().r2g || {})) };
  };
  const rp = (id, how) => ({ id: `rp-${id}`, label: `Role-play: ${QT.design.byId(id).title}${how ? `, ${how}` : ''}`, href: `#/code/design/${id}`, auto: () => (S().design[id] || []).length > 0 });
  const part = (id) => { const P = QT.code.PROBLEMS.find((x) => x.id === id); return { id: `lc-${id}`, label: `Live coding: ${MOCKS[P.mock].title}, part ${P.part}`, href: `#/code/${id}`, auto: () => !!S().p[id]?.solved }; };
  const mock = (m) => { const ps = QT.code.PROBLEMS.filter((P) => P.mock === m); return { id: `mock-${m}`, label: `Live coding mock: ${MOCKS[m].title}, all ${ps.length} parts in an hour`, href: `#/code/round2/live/${m}`, auto: () => ps.every((P) => S().p[P.id]?.solved) }; };
  const leet = (n, title, slug) => ({ id: `leet-${n}`, label: `LeetCode ${n}: ${title}`, href: `https://leetcode.com/problems/${slug}/`, ext: true });
  const hand = (id, label, href) => ({ id, label, href });
  const STEPS = () => [
    [mod('markets'), mod('anatomy'), part('lc-pos-1')],
    [mod('requirements'), rp('sd-frankfurt', 'out loud and recorded'), part('lc-pos-2'), part('lc-pos-3')],
    [mod('building-blocks'), mod('reliability'), rp('sd-order-flow'), leet(1656, 'Design an Ordered Stream', 'design-an-ordered-stream'), leet(1801, 'Number of Orders in the Backlog', 'number-of-orders-in-the-backlog')],
    [mod('networking'), mod('concurrency'), mock('feed')],
    [mod('class-design'), mod('techniques'), rp('sd-multi-prices'), hand('lc-design-2', 'Two LeetCode design problems from the class design module', '#/code/round2/guide/class-design')],
    [mod('communication'), mock('risk'), hand('redo-rp', 'Redo your lowest-scoring role-play', '#/code/round2'), { id: 'fund-drill', label: 'Rapid-fire fundamentals: 10 questions out loud', href: '#/code/screening/fundamentals/drill', auto: () => S().fundLog.length > 0 }],
  ];
  const ON_THE_DAY = () => [
    hand('day-sheet', 'Read the fundamentals cheat sheet', '#/code/screening/fundamentals/sheet'),
    hand('day-say', 'Read the "say it" lines of each study guide module', '#/code/round2/guide'),
    hand('day-qs', 'Prepare two questions for each interviewer', '#/code/round2'),
  ];
  const isoDays = (a, b) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / DAY);

  // Where you are in the plan today, or null with no date set. `left` < 0 once the day has passed.
  function planStatus() {
    const T = S().r2plan;
    if (!T || !T.date) return null;
    const today = QT.dayKey(new Date()), left = isoDays(today, T.date);
    const isDone = (t) => (t.auto ? t.auto() : false) || !!T.done[t.id];
    if (left < 0) return { T, left, tasks: [], late: [], isDone };
    if (left === 0) { const tasks = ON_THE_DAY(); return { T, left, tasks, late: [], isDone, done: tasks.filter(isDone).length }; }
    const steps = STEPS(), n = steps.length;
    const total = Math.max(1, isoDays(T.start || today, T.date)), k = Math.min(total - 1, Math.max(0, isoDays(T.start || today, today)));
    const a = Math.floor((k * n) / total), b = Math.max(a, Math.floor(((k + 1) * n) / total) - 1);
    const tasks = steps.slice(a, b + 1).flat();
    const late = steps.slice(0, a).flat().filter((t) => !isDone(t));
    return { T, left, tasks, late, isDone, done: tasks.filter(isDone).length, steps: [a + 1, b + 1, n] };
  }

  function planCard() {
    const st = planStatus(), today = QT.dayKey(new Date());
    if (!st) {
      return `<form class="card" id="r2-form"><h2 style="margin-top:0">When is your interview?</h2>
        <p class="small">Set the date for a daily checklist that fits the study guide, the role-plays and the live coding mocks into the days you have. The date stays on this device.</p>
        <div class="row"><label class="small" for="r2-date">Interview date</label><input type="date" id="r2-date" min="${today}" required><button>Make my plan</button></div></form>`;
    }
    if (st.left < 0) return `<div class="card"><p style="margin:0">Your interview date (${st.T.date}) has passed. How did it go? Add what you were asked to <a href="#/stories">Stories</a>. <button type="button" class="link" id="r2-clear">Set a new date</button></p></div>`;
    const li = (t) => { const auto = t.auto && t.auto(), ok = st.isDone(t); return `<li><label><input type="checkbox" data-r2task="${t.id}"${ok ? ' checked' : ''}${auto ? ' disabled' : ''}> <a href="${t.href}"${t.ext ? ' target="_blank" rel="noopener"' : ''}>${esc(t.label)}</a></label>${auto ? ' <span class="small">(done)</span>' : ''}</li>`; };
    const when = st.left === 0 ? 'today' : st.left === 1 ? 'tomorrow' : `in ${st.left} days`;
    return `<div class="card" id="r2-plan"><h2 style="margin-top:0">Interview 2 ${when}</h2>
      <p class="small">${st.left === 0 ? 'Light review only. No new material today.' : `Today: step ${st.steps[0]}${st.steps[1] > st.steps[0] ? `–${st.steps[1]}` : ''} of ${st.steps[2]} · ${st.done} of ${st.tasks.length} done`}</p>
      <ul class="plan-tasks">${st.tasks.map(li).join('')}</ul>
      ${st.late.length ? `<details><summary class="small"><b>Catch up: ${st.late.length} from earlier days</b></summary><ul class="plan-tasks">${st.late.map(li).join('')}</ul></details>` : ''}
      <p class="small">${st.T.date} · <button type="button" class="link" id="r2-clear">Change the date</button></p></div>`;
  }

  function wirePlan(el, again) {
    const T = S().r2plan;
    el.querySelector('#r2-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = el.querySelector('#r2-date').value;
      if (!/^\d{4}-\d\d-\d\d$/.test(v)) return;
      Object.assign(T, { date: v, start: QT.dayKey(new Date()) });
      store.save();
      again();
    });
    el.querySelector('#r2-clear')?.addEventListener('click', () => { T.date = ''; store.save(); again(); });
    el.querySelectorAll('[data-r2task]').forEach((b) => b.addEventListener('change', () => {
      if (b.checked) T.done[b.dataset.r2task] = 1;
      else delete T.done[b.dataset.r2task];
      store.touchDay();
      store.save();
    }));
  }

  function hub(el) {
    const D = QT.design, C = QT.code, runs = store.get().code.design;
    const sys = D.PROBLEMS.filter((P) => P.system);
    const solved = (id) => store.get().code.p[id]?.solved;
    el.innerHTML = `
      <a class="back" href="#/swe/interviews">← Interview prep</a>
      <h1>Optiver interview 2: system design and live coding</h1>
      <p class="lede">The round after the tech screening: two interviews of about an hour each, over Zoom. In one you play the CTO of a startup trading firm and design a system by asking the right questions; in the other you solve a practical trading problem in code. This page has what to expect, how to approach each, realistic mocks of both, and a day-by-day plan to your interview date.</p>
      ${planCard()}
      <a class="card sc-promo" href="#/code/round2/guide"><b>Study guide: the knowledge underneath</b><span class="small">Ten modules: how exchanges work, the anatomy of a trading system, requirements and numbers, building blocks, reliability, networking, concurrency, class design, algorithms, communication. Each with examples, lines to say, self-checks and LeetCode practice.</span></a>
      <div class="row" style="margin:0 0 12px"><a class="btn" href="#/code/design/sd-frankfurt">Start with the classic role-play</a><a class="btn ghost" href="#/code/round2/live/positions">Live coding mock 1</a><a class="btn ghost" href="#/code/screening/fundamentals/sheet">Fundamentals cheat sheet</a></div>

      <h2>What to expect</h2>
      <div class="sc-look">
        <div class="card"><b>System design: a role-play</b><p class="small" style="margin:4px 0 0">You are the CTO of a startup trading company. The interviewer has the requirements and gives them at the start or when asked; it's up to you to ask the questions that lead to a working solution. No trading knowledge is required. Candidates report prompts like an Amsterdam firm that needs to trade on the Frankfurt exchange, prices from several exchanges, or a trading app across two offices, with follow-ups on hardware, latency, bandwidth, cost, failures and concurrency.</p></div>
        <div class="card"><b>Live coding: a practical trading problem</b><p class="small" style="margin:4px 0 0">You code in Python (or C++ or Java) on the Optiver Assessment Platform, talking through your approach. Expect a class whose methods handle a stream of trading events (orders, fills, prices) and a problem that grows as the interviewer adds requirements. They're interested in how you approach it and how clearly you explain your thinking.</p></div>
      </div>

      <h2>System design: how to run the role-play</h2>
      <ol class="sc-plan">${SD_STEPS.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol>
      <details class="card"><summary><b>Numbers worth knowing</b></summary><table class="hb-table">${SD_NUMBERS.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table></details>
      <h3>Role-plays</h3>
      <p class="small">Each takes about an hour. Write your questions before anything is revealed; the interviewer's answers only appear once you've asked. Then design, face the curveballs one at a time, compare with a model design, and score yourself.</p>
      <div class="menu">${sys.map((P) => { const r = runs[P.id] || [], last = r[r.length - 1]; return `<a class="card" href="#/code/design/${P.id}"><b>${esc(P.title)}</b><span class="small">${esc(P.prompt.split('. ').slice(1, 2).join('') || P.prompt.slice(0, 90))}</span><span class="small">${last ? `last ${(last.s.reduce((a, b) => a + b, 0) / last.s.length).toFixed(1)}/3 · ${last.c[0]} of ${last.c[1]} key questions` : 'not tried'}</span></a>`; }).join('')}</div>
      <p class="small">Also useful: the <a href="#/code/screening/fundamentals">fundamentals</a> (architecture, networking, concurrency, memory) and the data-structure <a href="#/code/design">design discussions</a> (order book, feed handler, rate limiter, risk check).</p>

      <h2>Live coding: how to approach it</h2>
      <ol class="sc-plan">${LC_STEPS.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol>
      <details class="card"><summary><b>The Python you'll reach for</b></summary><table class="hb-table">${PY_TOOLS.map(([a, b]) => `<tr><td><code>${esc(a)}</code></td><td>${esc(b)}</td></tr>`).join('')}</table></details>
      <h3>Live coding mocks</h3>
      <p class="small">Each mock is three parts that build on each other, run against hidden tests. Give yourself an hour for all three, talk out loud, and start each part from your code for the last one.</p>
      <div class="menu">${Object.entries(MOCKS).map(([id, M]) => { const ps = C.PROBLEMS.filter((P) => P.mock === id); return `<a class="card" href="#/code/round2/live/${id}"><b>${esc(M.title)}</b><span class="small">${esc(M.blurb)}</span><span class="small">${ps.filter((P) => solved(P.id)).length} of ${ps.length} parts solved</span></a>`; }).join('')}</div>
      <p class="small">More practice: <a href="#/code/opt-order-book">limit order book</a>, <a href="#/code/opt-lru">LRU cache</a>, <a href="#/code/opt-ring-deque">ring buffer</a>, <a href="#/code/opt-debug-position">debug: position and P&amp;L</a>.</p>

      <h2>A two-week plan</h2>
      <ol class="sc-plan">${PLAN.map(([h, t]) => `<li><b>${esc(h)}:</b> ${esc(t)}</li>`).join('')}</ol>

      <h2>Sources</h2>
      <ul class="small">${SOURCES.map(([t, url, note]) => `<li>${url ? `<a href="${url}" target="_blank" rel="noopener">${esc(t)}</a>` : `<b>${esc(t)}</b>`}: ${esc(note)}</li>`).join('')}</ul>
      <p class="small">The role-plays, coding problems, numbers and model answers are ours. Every coding part is checked in CI against an independent brute-force version.</p>`;
  }

  function liveMock(el, id) {
    const M = MOCKS[id], parts = QT.code.PROBLEMS.filter((P) => P.mock === id).sort((a, b) => a.part - b.part);
    const T = (store.get().code.r2 ||= {});
    const startedAt = T[id] || 0, live = startedAt && Date.now() - startedAt < 3 * 3600e3;
    el.innerHTML = `
      <a class="back" href="#/code/round2">← Interview 2 prep</a>
      <h1>Live coding mock: ${esc(M.title)}</h1>
      <p class="lede">${esc(M.blurb)} Allow an hour for all three parts, as in the interview. Read each part fully, say your plan before typing, and start each part from your code for the last one (there's a button on the part's page).</p>
      <div class="card"><div class="row"><button type="button" id="lm-go">${live ? 'Restart the hour' : 'Start the hour'}</button><span class="mono" id="lm-clock" aria-live="off"></span></div>
        <p class="small" style="margin:8px 0 0">The clock keeps running while you move between parts. Rough pacing: part 1 in 10–15 minutes, part 2 by 35, part 3 by 55, with time to talk about tests and extensions.</p></div>
      <ol class="sc-plan">${parts.map((P) => `<li><a href="#/code/${P.id}"><b>${esc(P.title)}</b></a> <span class="chip">${P.diff}</span> ${store.get().code.p[P.id]?.solved ? '<span class="status-tag done">Solved</span>' : ''}</li>`).join('')}</ol>
      <details class="card"><summary><b>What the interviewer will ask once it works</b></summary><ul>
        <li>What does each method cost, and what breaks first with 100 times the data?</li>
        <li>How would you test it? Which edge cases worry you?</li>
        <li>What would change to make it thread-safe, or to handle many symbols on many cores?</li>
        <li>What would you do differently in C++, or in production?</li></ul></details>`;
    const clock = el.querySelector('#lm-clock');
    let timer = null;
    const draw = () => {
      const s = T[id];
      if (!s) { clock.textContent = ''; return; }
      const left = Math.max(0, s + 3600e3 - Date.now());
      clock.textContent = left ? `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} left` : 'Time is up: how far did you get?';
    };
    if (live) { draw(); timer = setInterval(draw, 1000); }
    QT.cleanup = () => clearInterval(timer);
    el.querySelector('#lm-go').addEventListener('click', (e) => {
      T[id] = Date.now();
      store.touchDay();
      store.save();
      e.target.textContent = 'Restart the hour';
      clearInterval(timer);
      draw();
      timer = setInterval(draw, 1000);
    });
  }

  // ---------------------------------------------------------------- the study guide
  const G = () => QT.round2Guide;
  const marks = () => (store.get().code.r2g ||= {});
  const lcList = (rows) => `<ul class="fd-lc">${rows.map(([n, title, slug, diff, why]) => `<li><a href="https://leetcode.com/problems/${slug}/" target="_blank" rel="noopener">${n}. ${esc(title)}</a> <span class="chip">${diff}</span>${why ? ` <span class="small">${esc(why)}</span>` : ''}</li>`).join('')}</ul>`;
  const score = (m) => m.checks.filter((c) => marks()[c.id] === 1).length;

  function guideIndex(el) {
    el.innerHTML = `
      <a class="back" href="#/code/round2">← Interview 2 prep</a>
      <h1>Interview 2 study guide</h1>
      <p class="lede">Everything underneath the system design role-play and the live coding challenge, in ten modules. Each teaches the knowledge with examples, gives you lines to say in the interview, checks you with a few questions, and points to practice: free LeetCode problems, handbook chapters and the mocks.</p>
      ${planCard()}
      <details class="card"><summary><b>The plan in full</b></summary>
      <ol class="sc-plan">${G().PLAN.map(([d, t]) => `<li><b>${esc(d)}:</b> ${esc(t)}</li>`).join('')}</ol>
      <p class="small">This is the plan for an interview on Tuesday 1 December. Set your date above and the checklist fits the same steps into the days you have.</p></details>
      <h2>Modules</h2>
      <div class="menu">${G().MODULES.map((m, i) => `<a class="card" href="#/code/round2/guide/${m.id}"><b>${i + 1}. ${esc(m.title)}</b><span class="small">${esc(m.why.split('. ')[0])}.</span><span class="small">self-check ${score(m)}/${m.checks.length}</span></a>`).join('')}</div>`;
  }

  function guideModule(el, m) {
    const all = G().MODULES, i = all.indexOf(m), next = all[i + 1];
    const dev = (m.devbook || []).filter((id) => QT.hbChapters?.[id]);
    el.innerHTML = `
      <a class="back" href="#/code/round2/guide">← Study guide</a>
      <h1>${i + 1}. ${esc(m.title)}</h1>
      <p class="lede">${esc(m.why)}</p>
      ${m.sections.map(([h, html]) => `<h2>${esc(h)}</h2><div class="card">${html}</div>`).join('')}
      <h2>Say it in the interview</h2>
      <div class="card"><ul style="margin:0">${m.say.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <h2>Check yourself</h2>
      <div>${m.checks.map(checkHtml).join('')}</div>
      ${m.leetcode.length ? `<h2>LeetCode practice</h2><p class="small">Free problems that train this module's technique. Solve them in Python, explaining your choices out loud.</p>${lcList(m.leetcode)}` : ''}
      ${dev.length ? `<h2>Go deeper: quant dev handbook</h2>${dev.map((id) => `<div class="card"><a href="#/devbook/${id}"><b>${esc(QT.hbChapters[id].title)}</b></a>${(QT.devbook.LEETCODE[id] || []).length ? lcList(QT.devbook.LEETCODE[id].map(([n, t, s, d]) => [n, t, s, d, ''])) : ''}</div>`).join('')}` : ''}
      <h2>Practise in the app</h2>
      <div class="row">${m.links.map(([l, h]) => `<a class="btn ghost" href="${h}">${esc(l)}</a>`).join('')}</div>
      <div class="row" style="margin-top:14px">${next ? `<a class="btn" href="#/code/round2/guide/${next.id}">Next: ${esc(next.title)} →</a>` : ''}<a class="btn ghost" href="#/code/round2/guide">All modules</a></div>`;
    el.querySelectorAll('.r2-check').forEach((box) => wireCheck(box, m.checks.find((c) => c.id === box.dataset.id)));
  }

  function checkHtml(c) {
    const prev = marks()[c.id] === 1 ? ' <span class="status-tag done">Right last time</span>' : '';
    if (c.opts) {
      const order = c.opts.map((_, k) => k).sort((a, b) => ((a * 5 + c.id.length) % 4) - ((b * 5 + c.id.length) % 4));
      return `<div class="card r2-check" data-id="${c.id}"><p class="question">${esc(c.q)}${prev}</p>
        <div class="hb-opts">${order.map((k) => `<button type="button" class="hb-opt" data-k="${k}">${esc(c.opts[k][0])}</button>`).join('')}</div>
        <div class="hb-fb" aria-live="polite"></div><div class="solution" hidden>${c.sol}</div></div>`;
    }
    return `<form class="card r2-check" data-id="${c.id}" autocomplete="off"><p class="question">${esc(c.q)}${prev}</p>
      <div class="answer-row"><input type="text" aria-label="Your answer" placeholder="Your answer"><button>Check</button></div>
      <div class="hb-fb" aria-live="polite"></div><div class="solution" hidden>${c.sol}</div></form>`;
  }

  function wireCheck(box, c) {
    const fb = box.querySelector('.hb-fb'), sol = box.querySelector('.solution');
    const record = (ok) => { marks()[c.id] = ok ? 1 : 0; store.touchDay(); store.save(); };
    if (c.opts) {
      box.querySelectorAll('.hb-opt').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k, ok = k === 0;
        box.querySelectorAll('.hb-opt').forEach((x) => { x.disabled = true; });
        b.classList.add(ok ? 'right' : 'wrong');
        fb.innerHTML = ok ? '<span class="fb-inline ok">✓ Right</span>' : `<span class="fb-inline bad">Not that one.</span> ${esc(c.opts[k][1] || '')}`;
        sol.hidden = false;
        record(ok);
      }));
      return;
    }
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = box.querySelector('input').value;
      if (!raw.trim()) { fb.textContent = 'Type an answer first.'; return; }
      const v = QT.parseAnswer(raw);
      if (Number.isNaN(v)) { fb.textContent = "Couldn't read that. Try a number like 3.9 or 10000."; return; }
      const ok = QT.isCorrectFor(v, c);
      fb.innerHTML = ok ? '<span class="fb-inline ok">✓ Right</span>' : '<span class="fb-inline bad">Not quite.</span>';
      sol.hidden = false;
      record(ok);
    });
  }

  QT.round2View = (el, a, b) => {
    if (a === 'live' && MOCKS[b]) return liveMock(el, b);
    if (a === 'guide' && b && G().byId[b]) return guideModule(el, G().byId[b]);
    if (a === 'guide') guideIndex(el);
    else hub(el);
    wirePlan(el, () => QT.round2View(el, a, b));
  };
  QT.round2 = { MOCKS, planStatus };
})();
