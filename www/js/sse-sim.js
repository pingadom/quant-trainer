// Market-making simulator. A hidden value is dealt from a scenario. You quote a bid and an ask, a
// bot decides whether to trade, information is revealed, you quote again, and at the end your
// position is marked to the true value. The review shows each quote against the fair value at
// that point. Unlike "Make me a market" (js/quote.js), the value here is a real draw, and you can
// lose money on a good quote. Pure functions are separate from the screen so they can be tested.
//
// Bots: an informed bot sees the true value plus noise. An uninformed one sees the public fair
// value plus noise, so its trades carry no information, but it still won't pay any price: a
// market that is too wide simply doesn't trade.
(function () {
  const store = QT.store, f = QT.fmtNum;
  const LAMBDA = 0.3; // score = P&L − LAMBDA × average width
  const rnd1 = (x) => Math.round(x * 100) / 100;
  const die = (rnd) => 1 + Math.floor(rnd() * 6);
  const normal = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

  // randomP: the chance a bot is uninformed. sigma: an informed bot's noise, in units of the
  // current standard deviation.
  const LEVELS = {
    1: { name: 'L1: centre on the fair value', about: 'No new information, and every bot is uninformed. Find a sensible mid and width.', reveals: false, randomP: 1, sigma: 0 },
    2: { name: 'L2: update on information', about: 'Information arrives between quotes, and some bots know something. Move your fair value when it does.', reveals: true, randomP: 0.6, sigma: 1 },
  };

  const DECK = Array.from({ length: 52 }, (_, i) => (i % 13) + 1);
  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  // Fair value and SD of the sum of `left` more cards from `rest`, without replacement.
  function cardsLeft(known, rest, left) {
    const m = mean(rest), v = mean(rest.map((x) => (x - m) ** 2)), N = rest.length;
    return { fair: known + left * m, sd: Math.sqrt((left * v * (N - left)) / (N - 1)) };
  }
  const NAMES = { 1: 'ace', 11: 'jack', 12: 'queen', 13: 'king' };
  const cardName = (c) => NAMES[c] || String(c);

  // Each deal gives the true value and the stages: what is known, and the fair value and SD then.
  const SCENARIOS = {
    'two-dice': {
      name: 'the sum of two dice',
      deal(rnd) {
        const [a, b] = [die(rnd), die(rnd)];
        return { value: a + b, stages: [{ text: '', fair: 7, sd: Math.sqrt(35 / 6) }, { text: `One die shows a ${a}.`, fair: a + 3.5, sd: Math.sqrt(35 / 12) }] };
      },
    },
    'ten-flips': {
      name: 'the number of heads in 10 fair coin flips',
      deal(rnd) {
        const flips = Array.from({ length: 10 }, () => (rnd() < 0.5 ? 1 : 0)), heads = (n) => flips.slice(0, n).reduce((s, x) => s + x, 0);
        const at = (n) => ({ fair: heads(n) + (10 - n) / 2, sd: Math.sqrt(10 - n) / 2 });
        return { value: heads(10), stages: [{ text: '', ...at(0) }, { text: `The first 5 flips gave ${heads(5)} head${heads(5) === 1 ? '' : 's'}.`, ...at(5) }, { text: `The first 8 flips gave ${heads(8)} head${heads(8) === 1 ? '' : 's'}.`, ...at(8) }] };
      },
    },
    'three-cards': {
      name: 'the sum of three cards from a shuffled deck (ace = 1, king = 13)',
      deal(rnd) {
        const deck = [...DECK], draw = () => deck.splice(Math.floor(rnd() * deck.length), 1)[0];
        const stages = [{ text: '', ...cardsLeft(0, DECK, 3) }], cards = [];
        for (let i = 0; i < 2; i++) {
          cards.push(draw());
          stages.push({ text: `${i ? 'The second card is' : 'The first card is'} a${[1, 8].includes(cards[i]) ? 'n' : ''} ${cardName(cards[i])}.`, ...cardsLeft(cards.reduce((s, x) => s + x, 0), deck, 3 - cards.length) });
        }
        return { value: cards[0] + cards[1] + draw(), stages };
      },
    },
  };

  // The stages actually played: with no reveals, three quotes on what's known at the start.
  const stagesFor = (deal, level) => (LEVELS[level].reveals ? deal.stages : [deal.stages[0], deal.stages[0], deal.stages[0]]);

  // 'buy' (lifts your ask), 'sell' (hits your bid) or null, and whether it was an informed bot.
  function bot(bid, ask, value, stage, level, rnd) {
    const L = LEVELS[level], informed = rnd() >= L.randomP;
    const signal = informed ? value + L.sigma * stage.sd * normal(rnd) : stage.fair + stage.sd * normal(rnd);
    return { side: signal > ask ? 'buy' : signal < bid ? 'sell' : null, informed };
  }

  // quotes: [{ bid, ask, fair, sd, side, informed }]. If the bot buys, you have sold at your ask.
  function settle(quotes, value) {
    let pnl = 0, adverse = 0, pos = 0, inventory = 0, trades = 0;
    for (const q of quotes) {
      if (!q.side) continue;
      const gain = q.side === 'buy' ? q.ask - value : value - q.bid;
      pnl += gain;
      if (q.informed) adverse += gain;
      pos += q.side === 'buy' ? -1 : 1;
      inventory = Math.max(inventory, Math.abs(pos));
      trades++;
    }
    const width = mean(quotes.map((q) => q.ask - q.bid)), penalty = LAMBDA * width;
    const good = quotes.filter((q) => q.bid <= q.fair + 1e-9 && q.fair <= q.ask + 1e-9 && q.ask - q.bid <= 2 * q.sd + 1e-9).length;
    return { pnl, width, penalty, score: pnl - penalty, adverse, inventory, trades, position: pos, quality: good / quotes.length };
  }

  // ---------------------------------------------------------------- the game
  // done(result) runs after the review. Scenario and level are ids.
  function play(box, scenario, level, done, nextText = 'Play again') {
    const S = SCENARIOS[scenario], deal = S.deal(Math.random), stages = stagesFor(deal, level), quotes = [];
    const said = (q) => (q.side === 'buy' ? `The bot buys from you at ${f(q.ask)}.` : q.side === 'sell' ? `The bot sells to you at ${f(q.bid)}.` : 'No trade.');
    function ask(i) {
      const st = stages[i], pos = quotes.reduce((p, q) => p + (q.side === 'buy' ? -1 : q.side === 'sell' ? 1 : 0), 0);
      box.innerHTML = `
        <div class="card">
          <div class="q-top"><span class="tag">${LEVELS[level].name}</span><span class="q-score">Quote ${i + 1} of ${stages.length} · position ${pos > 0 ? '+' : ''}${pos}</span></div>
          <div class="question">Make a market on ${S.name}.</div>
          ${quotes.length ? `<ol class="mm-tape">${quotes.map((q) => `<li><span class="mono">${f(q.bid)} – ${f(q.ask)}</span> <span class="say">${said(q)}</span></li>`).join('')}</ol>` : ''}
          ${st.text ? `<p class="interviewer">${st.text}</p>` : ''}
          <form class="row" id="sim-q">
            <label>Bid <input type="text" inputmode="decimal" autocomplete="off" id="sim-bid" style="width:110px"></label>
            <label>Ask <input type="text" inputmode="decimal" autocomplete="off" id="sim-ask" style="width:110px"></label>
            <button>Quote</button>
          </form>
          <p class="small" id="sim-msg" aria-live="polite">Say your fair value and width out loud before you type.</p>
        </div>`;
      const form = box.querySelector('#sim-q'), b = box.querySelector('#sim-bid'), a = box.querySelector('#sim-ask');
      const kp = QT.keypad.attach(form, [b, a], (inp) => (inp === b ? kp.focus(a) : form.requestSubmit()), { keys: '.-' });
      if (!kp) b.focus({ preventScroll: true });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const bid = QT.parseAnswer(b.value), ak = QT.parseAnswer(a.value);
        if (!Number.isFinite(bid) || !Number.isFinite(ak) || ak <= bid) {
          box.querySelector('#sim-msg').textContent = 'Give a bid and an ask, with the ask above the bid.';
          return;
        }
        quotes.push({ bid, ask: ak, fair: st.fair, sd: st.sd, text: st.text, ...bot(bid, ak, deal.value, st, level, Math.random) });
        if (i + 1 < stages.length) ask(i + 1);
        else finish();
      });
    }
    function finish() {
      const r = settle(quotes, deal.value);
      const st = store.get().sse;
      store.log(st.sims, { scenario, level, score: rnd1(r.score), pnl: rnd1(r.pnl), width: rnd1(r.width), trades: r.trades, quality: rnd1(r.quality) }, 50);
      store.touchDay();
      store.save();
      const tone = (x) => (x > 0 ? 'pos' : x < 0 ? 'neg' : '');
      const skew = r.inventory >= 2 ? `<p class="small">You held ${r.inventory} at once. When you're long, skew your quotes down to sell; when you're short, skew them up to buy back.</p>` : '';
      box.innerHTML = `
        <div class="card">
          <h3 style="margin-top:0">The true value was ${f(deal.value)}</h3>
          <div class="tiles">
            <div class="tile"><div class="v ${tone(r.score)}">${f(rnd1(r.score))}</div><div class="k">score (P&amp;L − ${LAMBDA} × average width)</div></div>
            <div class="tile"><div class="v ${tone(r.pnl)}">${f(rnd1(r.pnl))}</div><div class="k">P&amp;L at the true value</div></div>
            <div class="tile"><div class="v">${f(rnd1(r.width))}</div><div class="k">average width</div></div>
            <div class="tile"><div class="v">${r.inventory}</div><div class="k">largest position</div></div>
          </div>
          ${quotes.some((q) => q.side && q.informed) ? `<p class="small">P&amp;L against informed bots: <b class="${tone(r.adverse)}">${f(rnd1(r.adverse))}</b>. A large loss here means you aren't updating on the flow.</p>` : ''}
          <div class="table-wrap"><table class="sse-table">
            <thead><tr><th>Known then</th><th class="num">Fair</th><th class="num">Your quote</th><th class="num">Mid vs fair</th><th>Trade</th></tr></thead>
            <tbody>${quotes.map((q) => {
              const off = (q.bid + q.ask) / 2 - q.fair, outside = q.fair < q.bid || q.fair > q.ask;
              return `<tr><td>${q.text || 'Nothing yet'}</td><td class="num">${f(rnd1(q.fair))}</td><td class="num ${outside ? 'neg' : ''}">${f(q.bid)} – ${f(q.ask)}</td><td class="num">${off > 0 ? '+' : ''}${f(rnd1(off))}</td><td>${q.side ? `${q.side === 'buy' ? 'You sold' : 'You bought'} at ${f(q.side === 'buy' ? q.ask : q.bid)}${q.informed ? ' (informed)' : ''}` : 'None'}</td></tr>`;
            }).join('')}</tbody>
          </table></div>
          <p class="small">Fair is the expected value given what was known at that point. Red means your market didn't contain it. A sensible width is around one standard deviation: wide enough to pay for being wrong, tight enough to trade.</p>
          ${skew}
          <button type="button" id="sim-next">${nextText}</button>
        </div>`;
      const nx = box.querySelector('#sim-next');
      nx.focus({ preventScroll: true });
      nx.addEventListener('click', () => done(r));
    }
    ask(0);
  }

  function render(el, scenarioArg, levelArg) {
    const level = LEVELS[levelArg] ? +levelArg : 1, scenario = SCENARIOS[scenarioArg] ? scenarioArg : null;
    if (scenario) {
      el.innerHTML = `<a class="back" href="#/sse/sim">← Simulator</a><h1>Market-making simulator</h1><div id="sim-box"></div>`;
      const again = () => play(el.querySelector('#sim-box'), scenario, level, again);
      return again();
    }
    const runs = store.get().sse.sims.slice(-5).reverse();
    el.innerHTML = `
      <a class="back" href="#/sse">← Citadel SSE prep</a>
      <h1>Market-making simulator</h1>
      <p class="lede">Quote a hidden value against a bot, update as information arrives, and see each quote against the fair value at that point. A game takes under three minutes. Your position is marked to the true value, so a good quote can still lose: judge yourself on the timeline, not one result.</p>
      ${Object.entries(LEVELS).map(([k, L]) => `<div class="card"><h3>${L.name}</h3><p class="small">${L.about}</p><div class="row">${Object.entries(SCENARIOS).map(([id, s]) => `<a class="btn ghost" href="#/sse/sim/${id}/${k}">${s.name.replace(/ \(.*$/, '').replace(/^the /, '')}</a>`).join('')}</div></div>`).join('')}
      ${runs.length ? `<h2>Recent games</h2><div class="card table-wrap"><table class="sse-table"><thead><tr><th>Scenario</th><th>Level</th><th class="num">Score</th><th class="num">P&amp;L</th><th class="num">Width</th><th class="num">Quotes on fair</th></tr></thead><tbody>${runs.map((r) => `<tr><td>${(SCENARIOS[r.scenario]?.name || '').replace(/ \(.*$/, '')}</td><td>L${r.level}</td><td class="num">${f(r.score)}</td><td class="num">${f(r.pnl)}</td><td class="num">${f(r.width)}</td><td class="num">${Math.round(r.quality * 100)}%</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  }

  QT.sseSim = { SCENARIOS, LEVELS, LAMBDA, stagesFor, bot, settle, play, render };
})();
