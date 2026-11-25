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

  function hub(el) {
    const D = QT.design, C = QT.code, runs = store.get().code.design;
    const sys = D.PROBLEMS.filter((P) => P.system);
    const solved = (id) => store.get().code.p[id]?.solved;
    el.innerHTML = `
      <a class="back" href="#/code">← Coding</a>
      <h1>Optiver interview 2: system design and live coding</h1>
      <p class="lede">The round after the tech screening: two interviews of about an hour each, over Zoom. In one you play the CTO of a startup trading firm and design a system by asking the right questions; in the other you solve a practical trading problem in code. This page has what to expect, how to approach each, realistic mocks of both, and a two-week plan.</p>
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

  QT.round2View = (el, a, b) => (a === 'live' && MOCKS[b] ? liveMock(el, b) : hub(el));
  QT.round2 = { MOCKS };
})();
