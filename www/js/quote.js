// "Make me a market": the interviewer names a quantity and asks for a two-sided price. They
// trade against you, usually on the side where you're wrong (they know the answer) but sometimes
// at random, and ask where your market is now. You're judged on the things interviewers watch:
// a sensible width, moving your price after a trade, and not being picked off.
(function () {
  const R = QT.rand, store = QT.store, f = QT.fmtNum;
  const ROUND = 5, QUOTES = 3, MAX_RATIO = 2, INFORMED = 0.75;

  // Which side the interviewer takes: 'buy' (lifts your ask) or 'sell' (hits your bid).
  // With probability INFORMED they trade towards the truth, otherwise at random, so a fill is
  // evidence (P(right direction) = 0.875) but not proof.
  function interviewerSide(bid, ask, truth, rnd = Math.random) {
    if (rnd() < INFORMED) return truth >= (bid + ask) / 2 ? 'buy' : 'sell';
    return rnd() < 0.5 ? 'buy' : 'sell';
  }
  // Your P&L on one trade as a % of the true value. They buy at your ask: you're short at that price.
  const tradePnl = (t, truth) => (100 * (t.side === 'buy' ? t.px - truth : truth - t.px)) / truth;
  // After they buy you should move up (they may know something); after they sell, move down.
  const movedWithFlow = (prev, cur) => {
    const m0 = (prev.bid + prev.ask) / 2, m1 = (cur.bid + cur.ask) / 2;
    return prev.side === 'buy' ? m1 > m0 : m1 < m0;
  };
  // Validation messages in the interviewer's voice; null when the quote is acceptable.
  function checkQuote(bid, ask) {
    if (!Number.isFinite(bid) || !Number.isFinite(ask)) return 'Give me a bid and an ask.';
    if (bid <= 0) return 'Everything here is positive, so your bid should be too.';
    if (ask <= bid) return 'Your ask has to be above your bid.';
    if (ask > MAX_RATIO * bid) return `Too wide: nobody trades on that. Keep your ask within ${MAX_RATIO}× your bid.`;
    return null;
  }
  const SAY = {
    buy: (px) => R.pick([`I'll buy at ${px}.`, `Mine at ${px}.`, `I lift your ${px} offer.`]),
    sell: (px) => R.pick([`I'll sell at ${px}.`, `Yours at ${px}.`, `I hit your ${px} bid.`]),
  };
  const AGAIN = ['Where are you now?', "What's your market now?", 'Update me.'];

  function render(el) {
    const st = store.get().quote;
    el.innerHTML = `
      <h1>Make me a market</h1>
      <p class="lede">A favourite live interview format. The interviewer names a quantity and asks for a <b>bid</b> (where you'd buy) and an <b>ask</b> (where you'd sell). They trade with you, then ask for a new market. ${QUOTES} quotes per question, ${ROUND} questions.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${st.rounds}</div><div class="k">rounds played</div></div>
        <div class="tile"><div class="v">${st.n ? Math.round((100 * st.hits) / st.n) + '%' : '–'}</div><div class="k">final markets containing the answer</div></div>
        <div class="tile"><div class="v">${st.requotes ? Math.round((100 * st.withFlow) / st.requotes) + '%' : '–'}</div><div class="k">re-quotes moved with the trade</div></div>
        <div class="tile"><div class="v">${st.n ? f(st.pnl / st.n) + '%' : '–'}</div><div class="k">average P&amp;L per question</div></div>
      </div>
      <div class="card">
        <h3>How it works</h3>
        <ul>
          <li><b>Width:</b> your ask can be at most ${MAX_RATIO}× your bid. Interviewers push back on wide markets.</li>
          <li><b>The interviewer knows the answer</b> and usually trades on the side where you're wrong, but sometimes trades at random. A trade is evidence, not proof.</li>
          <li><b>“Mine”</b> means they buy from you at your ask; <b>“yours”</b> means they sell to you at your bid.</li>
          <li>Each trade is one unit, settled at the true value. P&amp;L is shown as a % of that value.</li>
        </ul>
        <details><summary>Tips</summary><ul>
          <li>Centre the first market on your best estimate, and size the width to your uncertainty.</li>
          <li>After they buy, move your market up; after they sell, move it down. They may know something.</li>
          <li>Don't jump all the way past your old market. They're right about 7 times in 8 here, not always.</li>
          <li>Say your reasoning out loud: a quick estimate path (“about 9 million people, so…”) is what the interviewer is listening for.</li>
        </ul></details>
        <button id="start" style="margin-top:12px">Start a round of ${ROUND}</button>
      </div>`;
    el.querySelector('#start').addEventListener('click', () => play(el));
  }

  function play(el) {
    const qs = R.shuffle(QT.estimateFacts).slice(0, ROUND);
    const results = [];
    let i = 0, quotes = [];

    function show(msg) {
      const [q, unit] = qs[i];
      el.innerHTML = `
        <h1>Make me a market</h1>
        <div class="session"><span>Question ${i + 1} of ${ROUND}</span><span>Quote ${quotes.length + 1} of ${QUOTES}</span></div>
        <div class="card">
          <div class="question">${q}${unit ? ` <span class="small">(${unit})</span>` : ''}</div>
          ${quotes.length ? `<ol class="mm-tape">${quotes.map((t) => `<li><span class="mono">${t.bid} – ${t.ask}</span> <span class="say">${t.said}</span></li>`).join('')}</ol>` : ''}
          <p class="interviewer">${quotes.length ? R.pick(AGAIN) : 'Make me a market.'}</p>
          <form class="row" id="mq">
            <label>Bid <input type="text" inputmode="decimal" autocomplete="off" id="bid" style="width:120px"></label>
            <label>Ask <input type="text" inputmode="decimal" autocomplete="off" id="ask" style="width:120px"></label>
            <button>Quote</button>
          </form>
          <p class="small" id="qerr" aria-live="polite">${msg || ''}</p>
        </div>`;
      const form = el.querySelector('#mq'), bid = el.querySelector('#bid'), ask = el.querySelector('#ask');
      const kp = QT.keypad.attach(form, [bid, ask], (inp) => (inp === bid ? kp.focus(ask) : form.requestSubmit()));
      if (!kp) bid.focus();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const b = QT.parseAnswer(bid.value), a = QT.parseAnswer(ask.value), err = checkQuote(b, a);
        if (err) return (el.querySelector('#qerr').textContent = err);
        const truth = qs[i][2], side = interviewerSide(b, a, truth), px = side === 'buy' ? a : b;
        quotes.push({ bid: b, ask: a, side, px, said: SAY[side](px) });
        if (quotes.length < QUOTES) show();
        else settle();
      });
    }

    function settle() {
      const [q, unit, truth, note] = qs[i];
      const last = quotes[quotes.length - 1], hit = truth >= last.bid && truth <= last.ask;
      const pnl = quotes.reduce((s, t) => s + tradePnl(t, truth), 0);
      const flow = quotes.slice(1).map((t, k) => movedWithFlow(quotes[k], t));
      results.push({ q, truth, hit, pnl, pts: hit ? last.bid / last.ask : 0, flow: flow.filter(Boolean).length, requotes: flow.length });
      const cls = (x) => (x > 0 ? 'pos' : x < 0 ? 'neg' : '');
      const advice = [];
      if (flow.some((x) => !x)) advice.push("At least once you didn't move your market in the direction they traded. They usually know more than you, so lean with the flow.");
      if (!hit) advice.push(`The answer was ${truth < last.bid ? 'below' : 'above'} your final market.`);
      if (hit && last.ask / last.bid > 1.6) advice.push('Your final market contained the answer but was wide. With more practice, tighten as you trade.');
      el.innerHTML = `
        <h1>Make me a market</h1>
        <div class="session"><span>Question ${i + 1} of ${ROUND}</span><span>Settled</span></div>
        <div class="card">
          <div class="question">${q}${unit ? ` <span class="small">(${unit})</span>` : ''}</div>
          <div class="table-wrap"><table>
            <tr><th>Your market</th><th>They</th><th class="num">Your P&amp;L</th></tr>
            ${quotes.map((t) => `<tr><td class="mono">${t.bid} – ${t.ask}</td><td>${t.side === 'buy' ? 'bought' : 'sold'} at ${t.px}</td><td class="num ${cls(tradePnl(t, truth))}">${f(tradePnl(t, truth))}%</td></tr>`).join('')}
          </table></div>
          <div class="fb ${hit ? 'ok' : 'bad'}">${hit ? '✓' : '✗'} Answer: <b>${f(truth)}</b>${unit ? ' ' + unit : ''}. ${hit ? 'Inside your final market.' : 'Outside your final market.'}</div>
          <p class="small">${note}</p>
          <p>Total P&amp;L: <b class="${cls(pnl)}">${f(pnl)}%</b> of the true value · re-quotes that moved with the trade: <b>${flow.filter(Boolean).length}/${flow.length}</b></p>
          ${advice.length ? `<div class="coach-tip">${advice.join(' ')}</div>` : ''}
          <button id="next" style="margin-top:12px">${i + 1 < ROUND ? 'Next question →' : 'See results'}</button>
        </div>`;
      const btn = el.querySelector('#next');
      btn.focus();
      btn.addEventListener('click', () => {
        quotes = [];
        if (++i < ROUND) show();
        else finish();
      });
    }

    function finish() {
      const st = store.get().quote;
      const hits = results.filter((r) => r.hit).length, pnl = results.reduce((s, r) => s + r.pnl, 0);
      st.rounds++;
      st.n += results.length;
      st.hits += hits;
      st.pnl += pnl;
      st.withFlow += results.reduce((s, r) => s + r.flow, 0);
      st.requotes += results.reduce((s, r) => s + r.requotes, 0);
      store.log(st.history, { pnl: pnl / results.length, hits, n: results.length });
      store.touchDay();
      store.save();
      el.innerHTML = `
        <h1>Round complete</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${hits}/${ROUND}</div><div class="k">final markets contained the answer</div></div>
          <div class="tile"><div class="v">${f(pnl / ROUND)}%</div><div class="k">average P&amp;L per question</div></div>
          <div class="tile"><div class="v">${f(results.reduce((s, r) => s + r.pts, 0))}</div><div class="k">tightness score / ${ROUND} (bid ÷ ask when you contained it)</div></div>
        </div>
        <div class="card table-wrap"><table>
          <tr><th>Quantity</th><th class="num">Answer</th><th class="num">P&amp;L</th><th class="num">Moved with flow</th></tr>
          ${results.map((r) => `<tr><td>${r.q}</td><td class="num ${r.hit ? 'pos' : 'neg'}">${f(r.truth)}</td><td class="num">${f(r.pnl)}%</td><td class="num">${r.flow}/${r.requotes}</td></tr>`).join('')}
        </table></div>
        <div class="row" style="margin-top:18px"><button id="again">Play again</button><a class="btn ghost" href="#/progress">See your progress</a></div>`;
      el.querySelector('#again').addEventListener('click', () => play(el));
    }

    show();
  }

  QT.quote = { render, interviewerSide, tradePnl, movedWithFlow, checkQuote, INFORMED, MAX_RATIO };
})();
