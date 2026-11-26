// The Quant SWE guide (#/swe): the software engineering side of Theo as its own track, for quant
// developer and software engineering roles at trading firms. It sets out the principles in eight
// parts, and for each points to where Theo teaches it (handbook chapters, fundamentals, study
// guide modules) and where to practise it (problems, drills, role-plays, mocks), with progress.
(function () {
  const esc = (s) => QT.escapeHtml(String(s ?? ''));
  const S = () => QT.store.get();

  // Progress readers: [done, total] for a part.
  const devDone = (ids) => [ids.filter((id) => S().handbook[id]?.done).length, ids.length];
  const solved = (pred) => { const ps = QT.code.PROBLEMS.filter(pred); return [ps.filter((P) => S().code.p[P.id]?.solved).length, ps.length]; };
  const DEV = (part) => (QT.devbook.PARTS.find((p) => p.id === part)?.chapters || []);

  const PARTS = [
    {
      id: 'python', title: 'Your language, and what happens underneath',
      principles: [
        'Know the data model: names are references, some objects are mutable and some aren\'t, and copying is explicit.',
        'Know what every built-in costs in time and memory: list, dict, set, deque, heapq, bisect, and why (dynamic arrays, hash tables, binary heaps).',
        'Know the memory footprint: every Python value is an object with a header, containers hold pointers, and NumPy stores raw numbers.',
        'Know the runtime: reference counting, the GIL, what threads can and can\'t speed up.',
        'Write code a colleague can read: clear names, small functions, no cleverness without a reason.',
      ],
      learn: [['Quant dev handbook: Python for interviews', '#/devbook/dsa-python'], ['Fundamentals: Python from the inside', '#/code/screening/fundamentals/python'], ['Python internals cards', '#/flashcards/python']],
      practise: [['CS knowledge quiz', '#/code/quiz'], ['Warm-up problems', '#/code']],
      progress: () => devDone(['dsa-complexity', 'dsa-python']),
      unit: 'chapters',
    },
    {
      id: 'dsa', title: 'Data structures and algorithms',
      principles: [
        'Read the input limits first: they tell you the complexity you need (10⁵ items rules out O(n²)).',
        'Most problems are a known pattern: two pointers, sliding window, hashing, stacks, heaps, graphs, binary search, sorting, backtracking, dynamic programming, greedy.',
        'Amortised costs matter: an item pushed once and popped once makes a loop O(n) overall.',
        'Start with the brute force, say its cost, then remove the repeated work.',
        'Test your own code: a small case by hand, then the edges (empty, one item, duplicates, extremes).',
      ],
      learn: [['Quant dev handbook, parts 1–5', '#/devbook']],
      practise: [['Coding problems (Optiver-style)', '#/code'], ['LeetCode lists in each handbook chapter', '#/devbook']],
      progress: () => devDone(['dsa-foundations', 'dsa-linear', 'dsa-nonlinear', 'dsa-techniques', 'dsa-practice'].flatMap(DEV)),
      unit: 'chapters',
    },
    {
      id: 'systems', title: 'Computer systems: how hardware shapes software',
      principles: [
        'Memory is ~100× slower than cache, so data layout often matters more than operation counts.',
        'Allocation, page faults, system calls and context switches cost microseconds: keep them off the hot path.',
        'Shared mutable state needs synchronisation; better still, give each piece of state one owner.',
        'Distance is latency: 5 µs per km of fibre, and no software beats it.',
        'Answer fundamentals questions as: the physical fact → the constraint it creates → the design choice → the trade-off.',
      ],
      learn: [['Fundamentals: five topics', '#/code/screening/fundamentals'], ['Fundamentals cheat sheet', '#/code/screening/fundamentals/sheet']],
      practise: [['Rapid-fire fundamentals', '#/code/screening/fundamentals/drill'], ['Self-checks in each topic', '#/code/screening/fundamentals']],
      progress: () => { const t = QT.fundamentals.TOPICS.flatMap((x) => x.checks); return [t.filter((c) => S().code.fund[c.id] === 1).length, t.length]; },
      unit: 'self-checks right',
    },
    {
      id: 'data', title: 'Numerical and data tools',
      principles: [
        'Vectorise: express a calculation on whole arrays so it runs in compiled code.',
        'Know when you get a view and when a copy, and the silent traps (integer overflow, NaN, float equality).',
        'In pandas, aggregate with groupby, align on the index deliberately, and never use chained assignment.',
        'In Polars, write expressions and let lazy queries push filters and column choices into the reader.',
        'With market data, never look ahead: shift signals, and test on data the decision couldn\'t have seen.',
      ],
      learn: [['Quant dev handbook, part 6: NumPy, pandas, Polars, market data', '#/devbook/dsa-numpy']],
      practise: [['Data drills (run in the browser)', '#/code/data']],
      progress: () => { const it = QT.dataDrills.ITEMS; return [it.filter((d) => S().code.data[d.id]?.ok).length, it.length]; },
      unit: 'drills passed',
    },
    {
      id: 'trading', title: 'Markets and trading systems',
      principles: [
        'Know the objects: orders, the order book, price-time matching, fills, positions, P&L.',
        'Know the pipeline: market data in → book → strategy → risk checks → order gateway → exchange, with recording and monitoring off the hot path.',
        'Every order is a state machine tracked by your own id; messages cross, so a cancel isn\'t done until it\'s confirmed.',
        'Prices are integer ticks, never floats.',
        'Safety is part of the design: risk limits, kill switches, sequence numbers, cancel-on-disconnect, reconciliation.',
      ],
      learn: [['Study guide: how exchanges work', '#/code/round2/guide/markets'], ['Study guide: anatomy of a trading system', '#/code/round2/guide/anatomy'], ['Study guide: reliability', '#/code/round2/guide/reliability']],
      practise: [['Live coding mocks (positions, feed, risk)', '#/code/round2'], ['Limit order book', '#/code/opt-order-book']],
      progress: () => solved((P) => P.group === 'live' || P.id === 'opt-order-book'),
      unit: 'problems solved',
    },
    {
      id: 'design', title: 'System design',
      principles: [
        'Requirements before boxes: users, volumes, latency, the cost of failure, constraints. Play them back.',
        'Do the numbers out loud: bandwidth, storage, capacity, latency from distance.',
        'Separate the latency-critical path from everything else.',
        'Design for failure: for each one, say how it\'s detected, what happens automatically, and what a person decides.',
        'Name the trade-offs (cost, complexity, speed, consistency) and change the design when the requirements change.',
      ],
      learn: [['Study guide: requirements and numbers', '#/code/round2/guide/requirements'], ['Study guide: building blocks', '#/code/round2/guide/building-blocks'], ['Study guide: networking', '#/code/round2/guide/networking'], ['Study guide: concurrency', '#/code/round2/guide/concurrency']],
      practise: [['CTO role-plays', '#/code/round2'], ['Data-structure design discussions', '#/code/design']],
      progress: () => { const ps = QT.design.PROBLEMS; return [ps.filter((P) => (S().code.design[P.id] || []).length).length, ps.length]; },
      unit: 'designs practised',
    },
    {
      id: 'practice', title: 'Engineering practice: review, debugging, testing, deployment',
      principles: [
        'Read code by asking what it\'s for, then the awkward inputs, then trace one case by hand.',
        'Recognise bug families by their tells: off-by-one, mutable defaults, float equality, unprotected shared state, retries that duplicate.',
        'Rank issues by business impact: what would this cost if it shipped?',
        'Test each rule, the edges, and against a slow obviously-correct version.',
        'Deploy safely: tests, staging or a simulator, a careful rollout, monitoring, a fast rollback.',
      ],
      learn: [['Tech screening guide', '#/code/screening'], ['Learning to spot bugs', '#/code/screening/spot']],
      practise: [['Snippets to review', '#/code/screening'], ['Bug-spotting drills', '#/code/screening/spot/mix'], ['Debugging problems', '#/code/opt-debug-position']],
      progress: () => { const ex = QT.screening.EXERCISES; return [ex.filter((E) => (S().code.review[E.id] || []).length).length, ex.length]; },
      unit: 'snippets reviewed',
    },
    {
      id: 'interviewing', title: 'Interviewing as an engineer',
      principles: [
        'Clarify, give examples, state a brute force, optimise, code, test, analyse: a method stops panic.',
        'Narrate decisions, not keystrokes; say why you chose each structure.',
        'Treat hints and pushback as new information and adapt out loud.',
        'Leave time to test, and to say what you\'d change for production.',
        'Have your stories and your questions for them ready.',
      ],
      learn: [['Quant dev handbook: a method for coding interviews', '#/devbook/dsa-interview'], ['Study guide: designing a class under pressure', '#/code/round2/guide/class-design'], ['Study guide: communication', '#/code/round2/guide/communication']],
      practise: [['Tech screening mock (45 min)', '#/code/screening/mock'], ['Interview 2 mocks', '#/code/round2'], ['Stories', '#/stories']],
      progress: () => [S().code.smocks.length ? 1 : 0, 1],
      unit: 'full mock done',
    },
  ];

  // Firm-specific preparation, one entry per firm, each stage in the order the process runs.
  const FIRMS = [
    {
      name: 'Optiver',
      role: 'Software engineer (internship and graduate)',
      stages: [
        {
          title: 'Tech screening',
          what: 'Review a snippet, suggest improvements, plan a deployment and discuss fundamentals: 45 minutes with an engineer.',
          href: '#/code/screening',
          links: [['Prep guide', '#/code/screening'], ['Bug spotting', '#/code/screening/spot'], ['Systems fundamentals', '#/code/screening/fundamentals'], ['Cheat sheet', '#/code/screening/sheet'], ['45-minute mock', '#/code/screening/mock']],
        },
        {
          title: 'Interview 2',
          what: 'Two interviews of about an hour: a system design role-play as a startup trading firm\'s CTO, and live coding on a practical trading problem.',
          href: '#/code/round2',
          links: [['Overview and mocks', '#/code/round2'], ['Study guide', '#/code/round2/guide'], ['Live coding: positions', '#/code/round2/live/positions'], ['CTO role-play: Frankfurt', '#/code/design/sd-frankfurt']],
        },
      ],
    },
  ];

  function interviews(el) {
    el.innerHTML = `
      <a class="back" href="#/swe">← Quant SWE guide</a>
      <h1>SWE interview prep</h1>
      <p class="lede">Preparation for a particular firm's software engineering interviews, stage by stage, in the order the process runs. What every firm tests is in the <a href="#/swe">Quant SWE guide</a>; this is the firm-specific layer on top.</p>
      ${FIRMS.map((f) => `
        <h2>${esc(f.name)}</h2>
        <p class="small">${esc(f.role)}</p>
        ${f.stages.map((s, i) => `
          <section class="card swe-part">
            <div class="swe-head"><h3><a href="${s.href}">${i + 1}. ${esc(s.title)}</a></h3></div>
            <p class="small">${esc(s.what)}</p>
            <div class="swe-links">${s.links.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>
          </section>`).join('')}`).join('')}
      <p class="small">Preparing for another firm? Start from the <a href="#/swe">eight parts of the guide</a>: the coding, systems and design rounds at trading firms test the same ground.</p>`;
  }

  function view(el) {
    const parts = PARTS.map((p) => ({ ...p, pr: p.progress() }));
    el.innerHTML = `
      <h1>Quant SWE guide</h1>
      <p class="lede">The software engineering side of trading firms, as its own track: what quant developers and software engineers are expected to know, in eight parts. Each part states the principles, then where to learn them and where to practise. The trading side of Theo (probability, mental maths, market making) is separate.</p>
      <div class="card"><b>Who it's for.</b> Software engineering and quant developer roles at trading firms: the people who build the trading systems, research platforms and tools. Interviews test coding (data structures and algorithms in a practical setting), computer systems fundamentals, system design for low-latency, reliable systems, and how you communicate while doing it.</div>
      <h2>Where to start</h2>
      <div class="menu">
        <a class="card" href="#/code/round2/guide"><b>An interview soon</b><span class="small">The interview 2 study guide, with a day-by-day plan, then the mocks.</span></a>
        <a class="card" href="#/devbook"><b>Building foundations</b><span class="small">The quant dev handbook from the start, a chapter a day, with its LeetCode problems.</span></a>
        <a class="card" href="#/code/screening/fundamentals/sheet"><b>A quick refresher</b><span class="small">The fundamentals cheat sheet and the rapid-fire questions.</span></a>
      </div>
      <h2>The eight parts</h2>
      ${parts.map((p, i) => `
        <section class="card swe-part" id="swe-${p.id}">
          <div class="swe-head"><h3>${i + 1}. ${esc(p.title)}</h3><span class="small">${p.pr[0]} of ${p.pr[1]} ${esc(p.unit)}</span></div>
          <div class="swe-bar" role="img" aria-label="${p.pr[0]} of ${p.pr[1]} ${esc(p.unit)}"><span style="width:${p.pr[1] ? Math.round((100 * p.pr[0]) / p.pr[1]) : 0}%"></span></div>
          <p class="small" style="margin:10px 0 4px"><b>The principles</b></p>
          <ul class="swe-principles">${p.principles.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="swe-links"><span class="small"><b>Learn:</b></span>${p.learn.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>
          <div class="swe-links"><span class="small"><b>Practise:</b></span>${p.practise.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div>
        </section>`).join('')}
      <h2>Firm-specific preparation</h2>
      <div class="menu">${FIRMS.flatMap((f) => f.stages.map((s) => `<a class="card" href="${s.href}"><b>${esc(f.name)}: ${esc(s.title.toLowerCase())}</b><span class="small">${esc(s.what)}</span></a>`)).join('')}<a class="card" href="#/swe/interviews"><b>All interview prep</b><span class="small">Every firm and stage on one page.</span></a></div>
      <h2>Everything in this track</h2>
      <ul class="small">
        <li><a href="#/devbook">Quant dev handbook</a>: 21 chapters on data structures, algorithms and data tools, with tested Python and LeetCode lists.</li>
        <li><a href="#/code">Coding problems</a>: Optiver-style class problems, data structures, debugging and live coding mocks, run against hidden tests.</li>
        <li><a href="#/code/screening/fundamentals">Systems fundamentals</a>: architecture, memory, concurrency, networking and Python internals.</li>
        <li><a href="#/code/design">Design discussions</a> and <a href="#/code/round2">CTO role-plays</a>.</li>
        <li><a href="#/code/data">Data drills</a>: NumPy, pandas and Polars.</li>
        <li><a href="#/code/screening">Tech screening</a>: code review, bug spotting, deployment plans, mocks.</li>
        <li><a href="#/code/quiz">CS knowledge quiz</a> and <a href="#/flashcards/python">Python internals cards</a>.</li>
      </ul>`;
  }

  QT.sweView = view;
  QT.sweInterviews = interviews;
  QT.swe = { PARTS };
})();
