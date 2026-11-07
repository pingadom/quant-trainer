// Phone-screen mock: one timed run through the parts of a first-round trading interview, in the
// order a 45–60 minute call usually takes. Citadel's Investment & Trading invitations describe a
// 45–60 minute Zoom screen with a member of the team; most trading phone screens share this shape.
//   1. Introduce yourself        5 min   (your saved answer from Stories, spoken against a timer)
//   2. Mental maths             10 min   (trader-style: percentages, % change, fractions, products)
//   3. Probability and EV       15 min   (interview questions from the bank, firm's own first)
//   4. Market making            10 min   (quote, they trade, information is revealed, re-quote)
//   5. Behavioural + questions   5 min
// Each part can also be practised on its own.
(function () {
  const R = QT.rand, store = QT.store, f = QT.fmtNum;
  const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
  const esc = (s) => QT.escapeHtml(String(s ?? ''));
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const PARTS = [
    { id: 'intro', name: 'Introduce yourself', mins: 5 },
    { id: 'mental', name: 'Mental maths', mins: 10 },
    { id: 'prob', name: 'Probability and expected value', mins: 15 },
    { id: 'mm', name: 'Market making', mins: 10 },
    { id: 'beh', name: 'Behavioural and your questions', mins: 5 },
  ];
  const MENTAL_N = 10, PROB_N = 4, MM_N = 2;

  // ---------------------------------------------------------------- mental maths, spoken style
  // The arithmetic a trader does out loud: percentages, % moves, fractions as decimals, products.
  const pctAnswer = (a) => ({ a, tol: { abs: 0.06, rel: 0 }, ok: (v) => Math.abs(v - a) <= 0.06 || Math.abs(100 * v - a) <= 0.06 });
  const traderGens = [
    () => { const p = R.pick([2.5, 7.5, 12.5, 15, 35, 45, 0.5]), y = R.int(2, 24) * 40; return { q: `${p}% of ${y}`, a: round((p * y) / 100, 2), sol: `${p}% of ${y} = ${y} × ${p / 100} = <b>${f(round((p * y) / 100, 2))}</b>. Build it from 10%, 5% and 1% pieces.` }; },
    () => {
      const d = R.pick([4, 5, 8, 10, 12, 16, 20, 25]), k = R.int(2, 12), up = Math.random() < 0.6, s = d * k, e = up ? s + k : s - k, pc = round((100 * (e - s)) / s, 2);
      return { q: `A stock goes from ${s} to ${e}. What is the percentage change? <span class="small">(8.3 or 8.3% both work)</span>`, ...pctAnswer(pc), sol: `Change ÷ start = ${e - s}/${s} = ${up ? '' : '−'}1/${d} = <b>${f(pc)}%</b>.` };
    },
    () => { const d = R.pick([7, 8, 9, 11, 12, 16, 40]); let n = R.int(1, d - 1); while (QT.m.gcd(n, d) !== 1) n = R.int(1, d - 1); return { q: `${n}/${d} as a decimal (3 dp)`, a: round(n / d, 3), tol: { abs: 0.0006, rel: 0 }, sol: `${n}/${d} = <b>${round(n / d, 4)}</b>…. Know 1/7, 1/8, 1/9, 1/11, 1/12 and 1/16 by heart and scale.` }; },
    () => { const a = R.int(12, 99), b = R.pick([15, 25, 35, 45, 75, 98, 99, 101, 102]); return { q: `${a} × ${b}`, a: a * b, tol: { abs: 0, rel: 0 }, sol: `${a} × ${b} = <b>${a * b}</b>. ${b > 90 ? `Use ${a} × 100 ${b < 100 ? '−' : '+'} ${a} × ${Math.abs(100 - b)}.` : `Split ${b} into ${b - (b % 10)} + ${b % 10}, or use × 100 ÷ 4 for 25 and 75.`}` }; },
    () => { const n = R.pick([15, 25, 35, 45, 55, 65, 75, 85, 95, 21, 29, 31, 39, 41, 49, 51, 59, 61, 69, 71, 79, 81, 89, 91, 99]); return { q: `${n}²`, a: n * n, tol: { abs: 0, rel: 0 }, sol: `${n}² = <b>${n * n}</b>. ${n % 10 === 5 ? `For a number ending in 5: ${(n - 5) / 10} × ${(n + 5) / 10} = ${((n - 5) / 10) * ((n + 5) / 10)}, then append 25.` : `Go from the nearest multiple of 10: (${n % 10 === 1 ? n - 1 : n + 1} ${n % 10 === 1 ? '+' : '−'} 1)² = ${(n % 10 === 1 ? n - 1 : n + 1) ** 2} ${n % 10 === 1 ? '+' : '−'} ${2 * (n % 10 === 1 ? n - 1 : n + 1)} + 1.`}` }; },
    () => { const a = R.int(3, 9) * 1000 + R.pick([0, 200, 400, 500, 600, 800]), r = R.pick([2, 3, 4, 5, 6, 8]); return { q: `A position of ${a.toLocaleString('en-GB')} shares; you sell ${r === 2 ? 'half' : `1/${r}`} of it. How many shares are left?`, a: a - a / r, tol: { abs: 0, rel: 0 }, sol: `${a} − ${a}/${r} = <b>${f(a - a / r)}</b>.` }; },
    () => { const p = R.pick([0.5, 1, 2, 3, 4]), y = R.pick([50, 80, 120, 250, 400]); return { q: `You buy at ${y} and the price rises ${p}% twice in a row. What is the new price (2 dp)?`, a: round(y * (1 + p / 100) ** 2, 2), tol: { abs: 0.011, rel: 0 }, sol: `${y} × ${1 + p / 100}² = ${y} × ${round((1 + p / 100) ** 2, 4)} = <b>${f(round(y * (1 + p / 100) ** 2, 2))}</b>. Two moves of p% compound to slightly more than 2p%.` }; },
  ];
  const mentalItem = () => {
    const g = R.pick(traderGens)(), part = { q: g.q, a: g.a, tol: g.tol, sol: g.sol, ...(g.ok ? { ok: g.ok } : {}) };
    return { tag: 'Mental maths', p: part, practiceOnly: true };
  };

  // ---------------------------------------------------------------- market making with reveals
  // Exact distributions by enumeration, so every fair value and standard deviation is computed
  // rather than typed in.
  const DIE = [1, 2, 3, 4, 5, 6];
  const stats = (pairs) => {
    const m = pairs.reduce((s, [x, p]) => s + x * p, 0), v = pairs.reduce((s, [x, p]) => s + p * (x - m) ** 2, 0);
    return { fair: m, sd: Math.sqrt(v) };
  };
  const dice = (n, fn) => { // every outcome of n dice, equally likely
    let rows = [[]];
    for (let i = 0; i < n; i++) rows = rows.flatMap((r) => DIE.map((d) => [...r, d]));
    return rows.map((r) => [fn(r), 1 / rows.length]);
  };
  const binom = (n, plus = 0) => Array.from({ length: n + 1 }, (_, k) => [k + plus, QT.m.comb(n, k) / 2 ** n]);
  const DECK = Array.from({ length: 52 }, (_, i) => (i % 13) + 1);
  const draws = (cards, k) => { // sums of k cards drawn without replacement
    const out = [];
    const go = (start, left, sum) => { if (!left) { out.push(sum); return; } for (let i = start; i < cards.length; i++) go(i + 1, left - 1, sum + cards[i]); };
    go(0, k, 0);
    return out.map((s) => [s, 1 / out.length]);
  };
  const SCENARIOS = [
    { id: 'two-dice', q: 'the sum of two dice', before: () => dice(2, (r) => r[0] + r[1]), reveal: 'I look at the first die: it is a 1.', after: () => DIE.map((d) => [1 + d, 1 / 6]),
      why: 'Each die averages 3.5, so 7; the SD is √(2 × 35/12) ≈ 2.4.', why2: 'One die is known, so 1 + 3.5 = 4.5, and only one die of uncertainty is left (SD ≈ 1.7).' },
    { id: 'ten-flips', q: 'the number of heads in 10 fair coin flips', before: () => binom(10), reveal: 'The first four flips were all heads.', after: () => binom(6, 4),
      why: 'Binomial(10, ½): mean 5, SD √(10 × ¼) ≈ 1.6.', why2: '4 heads banked plus 6 flips left at ½ each: 4 + 3 = 7, SD √1.5 ≈ 1.2.' },
    { id: 'max-dice', q: 'the higher of two dice', before: () => dice(2, (r) => Math.max(...r)), reveal: 'The first die is a 5.', after: () => DIE.map((d) => [Math.max(5, d), 1 / 6]),
      why: 'P(max ≤ k) = k²/36, so P(max = k) = (2k − 1)/36 and the mean is 161/36 ≈ 4.47 (SD ≈ 1.4).', why2: 'The max is 5 unless the other die is a 6: (5 × 5 + 6)/6 = 31/6 ≈ 5.17. Very little uncertainty is left, so quote tight.' },
    { id: 'three-dice', q: 'the sum of three dice', before: () => dice(3, (r) => r[0] + r[1] + r[2]), reveal: 'The first two dice add up to 4.', after: () => DIE.map((d) => [4 + d, 1 / 6]),
      why: '3 × 3.5 = 10.5, SD √(3 × 35/12) ≈ 3.0.', why2: '4 + 3.5 = 7.5, with one die left (SD ≈ 1.7).' },
    { id: 'three-cards', q: 'the sum of three cards from a shuffled deck (ace = 1, jack = 11, queen = 12, king = 13)', before: () => draws(DECK, 3), reveal: 'The first card is a king.', after: () => draws(DECK.filter((x, i) => i !== 12), 2).map(([s, p]) => [13 + s, p]),
      why: 'Each card averages 7, so 21. Without replacement the SD is a little under √3 × √14 ≈ 6.5: about 6.3.', why2: 'A king is gone from the deck, so each other card now averages (364 − 13)/51 ≈ 6.88: 13 + 2 × 6.88 ≈ 26.8.' },
    { id: 'product', q: 'the product of two dice', before: () => dice(2, (r) => r[0] * r[1]), reveal: 'The first die is a 6.', after: () => DIE.map((d) => [6 * d, 1 / 6]),
      why: 'Independent, so E[XY] = 3.5 × 3.5 = 12.25. The SD is large, about 8.9, because the product is spread from 1 to 36.', why2: '6 × 3.5 = 21, SD 6 × 1.7 ≈ 10.2. The reveal moved the value a lot but did not shrink the spread.' },
  ];
  const sayTrade = (side, px) => (side === 'buy' ? `I buy at ${f(px)}.` : `I sell at ${f(px)}.`);

  // Grade one quote. `against`: the fair value and SD it should be judged by.
  function gradeQuote(bid, ask, { fair, sd }) {
    const width = ask - bid;
    return { centred: bid <= fair + 1e-9 && fair <= ask + 1e-9, tight: width > 0 && width <= 2 * sd + 1e-9, mid: (bid + ask) / 2 };
  }
  const tradePnl = (side, px, value) => (side === 'buy' ? px - value : value - px); // you're short when they buy

  function checkQuote(bid, ask) {
    if (!Number.isFinite(bid) || !Number.isFinite(ask)) return 'Give me a bid and an ask.';
    if (ask <= bid) return 'Your ask has to be above your bid.';
    return null;
  }

  // One scenario, three quotes: open, after their trade, after the reveal. Calls done(points, of).
  function mmScenario(box, sc, label, done) {
    const A = stats(sc.before()), B = stats(sc.after());
    const quotes = [];
    let side = null, px = null;
    function ask(msg, prompt) {
      box.innerHTML = `
        <div class="card">
          <div class="q-top"><span class="tag">${label}</span></div>
          <div class="question">Make me a market on ${sc.q}.</div>
          ${quotes.length ? `<ol class="mm-tape">${quotes.map((t) => `<li><span class="mono">${f(t.bid)} – ${f(t.ask)}</span> <span class="say">${t.said}</span></li>`).join('')}</ol>` : ''}
          <p class="interviewer">${prompt}</p>
          <form class="row" id="mq">
            <label>Bid <input type="text" inputmode="decimal" autocomplete="off" id="bid" style="width:110px"></label>
            <label>Ask <input type="text" inputmode="decimal" autocomplete="off" id="ask" style="width:110px"></label>
            <button>Quote</button>
          </form>
          <p class="small" id="qerr" aria-live="polite">${msg || 'Say your fair value and your reasoning out loud before you type.'}</p>
        </div>`;
      const form = box.querySelector('#mq'), b = box.querySelector('#bid'), a = box.querySelector('#ask');
      const kp = QT.keypad.attach(form, [b, a], (inp) => (inp === b ? kp.focus(a) : form.requestSubmit()), { keys: '.-' });
      if (!kp) b.focus({ preventScroll: true });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const bid = QT.parseAnswer(b.value), ak = QT.parseAnswer(a.value), err = checkQuote(bid, ak);
        if (err) return (box.querySelector('#qerr').textContent = err);
        step(bid, ak);
      });
    }
    function step(bid, ak) {
      if (!quotes.length) {
        side = R.pick(['buy', 'sell']);
        px = side === 'buy' ? ak : bid;
        quotes.push({ bid, ask: ak, said: sayTrade(side, px) });
        return ask('', 'Where are you now?');
      }
      if (quotes.length === 1) {
        quotes.push({ bid, ask: ak, said: '' });
        return ask('', `${sc.reveal} Where's your market?`);
      }
      quotes.push({ bid, ask: ak, said: '' });
      settle();
    }
    function settle() {
      const g1 = gradeQuote(quotes[0].bid, quotes[0].ask, A), g3 = gradeQuote(quotes[2].bid, quotes[2].ask, B);
      const m0 = (quotes[0].bid + quotes[0].ask) / 2, m1 = (quotes[1].bid + quotes[1].ask) / 2;
      const leaned = side === 'buy' ? m1 > m0 : m1 < m0, overshoot = Math.abs(m1 - m0) > A.sd;
      const checks = [
        [g1.centred, `Opening market contains the fair value ${f(round(A.fair, 2))}`],
        [g1.tight, `Opening width at most 2 SD (${f(round(2 * A.sd, 1))})`],
        [leaned && !overshoot, `After they ${side === 'buy' ? 'bought' : 'sold'}, you moved ${side === 'buy' ? 'up' : 'down'}, by less than 1 SD`],
        [g3.centred, `After the reveal, your market contains the new fair value ${f(round(B.fair, 2))}`],
        [g3.tight, `After the reveal, width at most 2 SD (${f(round(2 * B.sd, 1))})`],
      ];
      const pts = checks.filter((c) => c[0]).length, pnl = tradePnl(side, px, B.fair);
      box.innerHTML = `
        <div class="card">
          <div class="q-top"><span class="tag">${label}</span><span class="q-score">${pts}/${checks.length}</span></div>
          <div class="question">Make me a market on ${sc.q}.</div>
          <ul class="mm-checks">${checks.map(([ok, t]) => `<li class="${ok ? 'pos' : 'neg'}">${ok ? '✓' : '✗'} ${t}</li>`).join('')}</ul>
          <div class="solution-box"><div class="solution">
            <p><b>Before:</b> ${sc.why} A sensible opening market: ${f(round(A.fair - Math.min(1, A.sd / 2), 1))} – ${f(round(A.fair + Math.min(1, A.sd / 2), 1))}.</p>
            <p><b>After the reveal:</b> ${sc.why2}</p>
            <p><b>Your trade:</b> they ${side === 'buy' ? 'bought from' : 'sold to'} you at ${f(px)}, so you're ${side === 'buy' ? 'short' : 'long'} one. Marked at the new fair value that's <b class="${pnl >= 0 ? 'pos' : 'neg'}">${pnl >= 0 ? '+' : ''}${f(round(pnl, 2))}</b>. Say your position out loud when you re-quote; interviewers listen for it.</p>
          </div></div>
          <button type="button" id="mm-next" style="margin-top:12px">Continue →</button>
        </div>`;
      const nx = box.querySelector('#mm-next');
      nx.focus({ preventScroll: true });
      nx.addEventListener('click', () => done(pts, checks.length));
    }
    ask('', 'Make me a market.');
  }

  // ---------------------------------------------------------------- spoken parts
  // A talk timer with a target, your saved notes for the prompt, and a short self-check.
  function spoken(box, { label, prompt, storyId, target, checks, extra = '' }, done) {
    const story = QT.stories?.get(storyId), start = Date.now();
    box.innerHTML = `
      <div class="card">
        <div class="q-top"><span class="tag">${label}</span><span class="mono" id="sp-clock">0:00</span></div>
        <div class="question">${prompt}</div>
        <p class="small">Answer out loud, as you would on the call. Aim for ${target}.</p>
        ${story ? `<details><summary>Your notes for this answer</summary><div class="story-notes">${story}</div></details>` : `<p class="small">You haven't written notes for this one yet. <a href="#/stories/${storyId}">Write them in Stories</a> after this run.</p>`}
        ${extra}
        <fieldset class="sp-checks"><legend class="small">When you've finished speaking, tick what you did:</legend>
          ${checks.map((c, i) => `<label class="check"><input type="checkbox" data-c="${i}"> ${c}</label>`).join('')}
        </fieldset>
        <button type="button" id="sp-done" style="margin-top:12px">Done →</button>
      </div>`;
    const ck = box.querySelector('#sp-clock');
    const t = setInterval(() => { ck.textContent = clock((Date.now() - start) / 1000); }, 500);
    const prev = QT.cleanup;
    QT.cleanup = () => { clearInterval(t); if (prev) prev(); };
    box.querySelector('#sp-done').addEventListener('click', () => {
      clearInterval(t);
      done(box.querySelectorAll('[data-c]:checked').length, checks.length, (Date.now() - start) / 1000);
    });
  }

  const INTRO_CHECKS = ['Kept it under 2 minutes', 'Gave one specific reason for wanting to trade', 'Backed it with evidence (a project, game, competition or result)', 'Finished with why this role'];
  const BEH_CHECKS = ['Set the scene in a sentence or two', 'Said what <i>I</i> did, not the team', 'Gave a result, with a number if there was one', 'Said what I learned or would do differently'];
  const ASK_THEM = [
    'What does a strong intern do in the first two weeks that a weaker one doesn\'t?',
    'How is the team\'s trading split between discretionary judgement and systematic signals?',
    'How do interns get feedback on their decisions during the summer?',
    'What does the interviewer\'s own day look like, and what surprised them when they joined?',
  ];

  // ---------------------------------------------------------------- bank questions for part 3
  function probPick(firm, n) {
    const s = store.get(), touched = (b) => (s.bank[b.id]?.results || []).some((r) => r !== null && r !== undefined);
    const ok = (b) => b.parts && /Probability|Expected value|Conditional|Statistics|Combinatorics/.test(b.cat);
    const own = QT.rand.shuffle(QT.bank.filter((b) => ok(b) && firm && b.firm === firm));
    const rest = QT.rand.shuffle(QT.bank.filter((b) => ok(b) && b.firm !== firm));
    const fresh = (l) => [...l.filter((b) => !touched(b)), ...l.filter(touched)];
    return [...fresh(own).slice(0, 2), ...fresh(rest)].slice(0, n);
  }

  // ---------------------------------------------------------------- the run
  function render(el, a1, a2) {
    if (a1 === 'part' && PARTS.some((p) => p.id === a2)) return run(el, null, [a2]);
    const firm = a1 && Object.prototype.hasOwnProperty.call(QT.firms, a1) ? a1 : a1 === undefined ? QT.ui.targetFirm() : null;
    if (a2 === 'go') return run(el, firm, PARTS.map((p) => p.id));
    const runs = store.get().screen.runs, F = firm && QT.firms[firm];
    el.innerHTML = `
      <h1>Phone-screen mock${F ? `: ${esc(F.name)}` : ''}</h1>
      <p class="lede">A full first-round interview, timed: the five parts a 45–60 minute trading phone screen usually covers, in order. Treat it as the real thing. Sit at a desk, no calculator, and <b>talk out loud the whole time</b>.</p>
      ${firm === 'citadel' ? `<div class="card"><h3>Citadel: what this screen is</h3><p style="margin-top:0">Invitations for Citadel's Investment &amp; Trading internship describe a 45–60 minute Zoom interview with a member of the team. The role is at <b>Citadel</b>, the investment manager, not Citadel Securities. Its posting asks for in-depth interest in a financial market, statistical thinking under uncertainty, and some programming.</p><p class="small" style="margin-bottom:0">Read the <a href="#/bank/citadel">Citadel profile and questions</a> and write your <a href="#/stories">Stories</a> before your first run.</p></div>` : ''}
      <div class="card table-wrap"><table>
        <tr><th>Part</th><th class="num">Minutes</th><th></th></tr>
        ${PARTS.map((p) => `<tr><td>${p.name}</td><td class="num">${p.mins}</td><td><a href="#/screen/part/${p.id}">Practise alone</a></td></tr>`).join('')}
      </table></div>
      <div class="row" style="margin:14px 0"><a class="btn" href="#/screen/${firm || 'citadel'}/go">Start the full mock (45 minutes)</a>${firm ? '' : ' <a class="btn ghost" href="#/screen/citadel">Citadel version</a>'}</div>
      ${runs.length ? `<h2>Your runs</h2><div class="card table-wrap"><table>
        <tr><th>Date</th><th class="num">Time</th><th class="num">Mental</th><th class="num">Probability</th><th class="num">Market making</th><th class="num">Self-check</th></tr>
        ${runs.slice(-8).reverse().map((r) => `<tr><td>${esc(r.date.slice(0, 10))}</td><td class="num">${clock(r.secs)}</td>${['mental', 'prob', 'mm', 'self'].map((k) => `<td class="num">${r[k][1] ? `${r[k][0]}/${r[k][1]}` : '–'}</td>`).join('')}</tr>`).join('')}
      </table></div>` : ''}`;
  }

  function run(el, firm, ids) {
    const parts = PARTS.filter((p) => ids.includes(p.id)), full = parts.length === PARTS.length;
    const res = { mental: [0, 0], prob: [0, 0], mm: [0, 0], self: [0, 0] }, used = {};
    const start = Date.now();
    let k = 0, partStart = start;
    const name = firm && QT.firms[firm] ? QT.firms[firm].name : '';
    el.innerHTML = `
      <a class="back" href="#/screen${firm ? '/' + firm : ''}">← Phone-screen mock</a>
      <h1>${full ? `Phone-screen mock${name ? `: ${esc(name)}` : ''}` : parts[0].name}</h1>
      <div class="session"><span id="sc-part"></span><span class="mono" id="sc-clock">0:00</span></div>
      <div id="sc-box"></div>`;
    const box = el.querySelector('#sc-box'), $part = el.querySelector('#sc-part'), $clock = el.querySelector('#sc-clock');
    const tick = setInterval(() => {
      const s = (Date.now() - partStart) / 1000, budget = parts[k] ? parts[k].mins * 60 : 0;
      $clock.textContent = `${clock(s)} / ${clock(budget)}`;
      $clock.classList.toggle('neg', s > budget);
    }, 500);
    QT.cleanup = () => clearInterval(tick);

    function nextPart() {
      if (parts[k]) used[parts[k].id] = (Date.now() - partStart) / 1000;
      k++;
      if (k >= parts.length) return finish();
      begin();
    }
    function begin() {
      const p = parts[k];
      partStart = Date.now();
      $part.textContent = full ? `Part ${k + 1} of ${parts.length}: ${p.name}` : p.name;
      if (p.id === 'intro') {
        return spoken(box, { label: 'Opening', prompt: '"Tell me about yourself, and why trading."', storyId: 'intro', target: 'about 90 seconds to 2 minutes', checks: INTRO_CHECKS }, (r, n) => { res.self[0] += r; res.self[1] += n; nextPart(); });
      }
      if (p.id === 'mental') {
        let i = 0;
        return QT.ui.questionCard(box, () => (i++ < MENTAL_N ? { ...mentalItem(), tag: `Mental maths · ${i} of ${MENTAL_N}`, record: (ok) => { res.mental[1]++; if (ok) res.mental[0]++; } } : null), () => nextPart());
      }
      if (p.id === 'prob') {
        const pick = probPick(firm, PROB_N);
        return QT.ui.questionCard(box, QT.bankSource(pick, (i) => `Q${i + 1}/${pick.length}`, (ok) => { res.prob[1]++; if (ok) res.prob[0]++; }), () => nextPart());
      }
      if (p.id === 'mm') {
        const scs = R.shuffle(SCENARIOS).slice(0, MM_N);
        let j = 0;
        const go = () => (j < scs.length ? mmScenario(box, scs[j], `Market ${j + 1} of ${scs.length}`, (pts, of) => { res.mm[0] += pts; res.mm[1] += of; j++; go(); }) : nextPart());
        return go();
      }
      const story = R.pick(QT.stories.PROMPTS.filter((s) => s.star));
      return spoken(box, {
        label: 'Behavioural', prompt: `"${story.q}"`, storyId: story.id, target: 'about 2 minutes', checks: BEH_CHECKS,
        extra: `<details><summary>Then: "Do you have any questions for me?"</summary><p class="small">Always have two ready. Ask about the work, not pay or hours. For example:</p><ul>${ASK_THEM.map((q) => `<li>${q}</li>`).join('')}</ul></details>`,
      }, (r, n) => { res.self[0] += r; res.self[1] += n; nextPart(); });
    }
    function finish() {
      clearInterval(tick);
      const secs = (Date.now() - start) / 1000;
      if (full) {
        const st = store.get().screen;
        st.runs.push({ date: new Date().toISOString(), firm: firm || '', secs, ...res });
        if (st.runs.length > 50) st.runs.splice(0, st.runs.length - 50);
        store.touchDay();
        store.save();
      }
      const pc = ([r, n]) => (n ? `${r}/${n}` : '–');
      const weak = [];
      if (res.mental[1] && res.mental[0] / res.mental[1] < 0.8) weak.push(['Mental maths', '#/mental', 'Zetamac and 80 in 8']);
      if (res.prob[1] && res.prob[0] / res.prob[1] < 0.7) weak.push(['Probability', '#/handbook', 'the Handbook, Part 2']);
      if (res.mm[1] && res.mm[0] / res.mm[1] < 0.7) weak.push(['Market making', '#/screen/part/mm', 'the market-making part on its own']);
      if (res.self[1] && res.self[0] / res.self[1] < 0.75) weak.push(['Spoken answers', '#/stories', 'Stories']);
      $part.textContent = 'Finished';
      $clock.textContent = clock(secs);
      $clock.classList.remove('neg');
      box.innerHTML = `
        <div class="card">
          <h3>${full ? 'Mock complete' : 'Part complete'} in ${clock(secs)}</h3>
          <div class="table-wrap"><table>
            <tr><th>Part</th><th class="num">Time (budget)</th><th class="num">Score</th></tr>
            ${parts.map((p) => `<tr><td>${p.name}</td><td class="num ${used[p.id] > p.mins * 60 ? 'neg' : ''}">${clock(used[p.id] || 0)} (${p.mins}:00)</td><td class="num">${p.id === 'intro' || p.id === 'beh' ? 'self-check' : pc(res[p.id])}</td></tr>`).join('')}
            ${res.self[1] ? `<tr><td>Self-check on spoken answers</td><td></td><td class="num">${pc(res.self)}</td></tr>` : ''}
          </table></div>
          ${weak.length ? `<div class="coach-tip"><b>Work on next:</b> ${weak.map(([w, href, what]) => `${w}: <a href="${href}">${what}</a>`).join(' · ')}</div>` : '<p>Solid run. Do another on a different day: the questions and markets change each time.</p>'}
          <p class="small">An interviewer also scores what you can't see here: did you explain each step out loud, state your plan before calculating, and check your answers? Recording yourself in <a href="#/talk">Think aloud</a> shows you how you come across.</p>
          <div class="row"><a class="btn" href="#/screen${firm ? '/' + firm : ''}">Back</a></div>
        </div>`;
    }
    begin();
  }

  QT.screen = { render, PARTS, SCENARIOS, stats, gradeQuote, tradePnl, traderGens, probPick, mm: mmScenario };
})();
