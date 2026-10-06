// Market-making game on the sum of five hidden dice.
// You quote bid/ask each round against an informed trader (who has peeked at some hidden dice)
// and a noise trader (who trades randomly). Spread earned from noise vs. losses to the informed
// trader is the core tension of real market making.
(function () {
  const R = QT.rand, store = QT.store, f = QT.fmtNum;
  const N_DICE = 5, MAX_WIDTH = 4, NOISE_PROB = 0.6;

  function render(el) {
    const m = store.get().market;
    el.innerHTML = `
      <h1>Market making</h1>
      <p class="lede">Five fair dice are rolled face down. You make a market on their <b>sum</b>. Each round you quote a bid and an ask (width at most ${MAX_WIDTH}). Two traders may deal with you:
      an <b>informed</b> trader who has peeked at up to two hidden dice and trades only when your price is wrong, and a <b>noise</b> trader who buys or sells at random.
      After each round one die is revealed. At the end the contract settles at the true sum.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${m.games}</div><div class="k">games played</div></div>
        <div class="tile"><div class="v">${m.games ? f(m.total / m.games) : '–'}</div><div class="k">average P&amp;L</div></div>
        <div class="tile"><div class="v">${m.best ?? '–'}</div><div class="k">best P&amp;L</div></div>
      </div>
      <div id="game"></div>`;
    play(el.querySelector('#game'));
  }

  function play(el) {
    const dice = Array.from({ length: N_DICE }, () => R.die());
    const truth = dice.reduce((a, b) => a + b, 0);
    let revealed = 0, pos = 0, cash = 0;
    const log = [], trades = [];

    const fair = () => dice.slice(0, revealed).reduce((a, b) => a + b, 0) + 3.5 * (N_DICE - revealed);

    function draw() {
      const over = revealed >= N_DICE;
      el.innerHTML = `
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h3>Round ${Math.min(revealed + 1, N_DICE)} of ${N_DICE}</h3>
            <span class="mono small">Position: <b>${pos > 0 ? '+' : ''}${pos}</b> · Cash: <b>${f(cash)}</b></span>
          </div>
          <div class="dice">${dice.map((d, i) => `<div class="die ${i < revealed ? (i === revealed - 1 ? 'flip' : '') : 'hidden'}">${i < revealed ? QT.flair.dieFace(d) : '?'}</div>`).join('')}</div>
          ${over ? '' : `
          <form class="row" id="quote">
            <label>Bid <input type="text" inputmode="decimal" autocomplete="off" id="bid" style="width:90px"></label>
            <label>Ask <input type="text" inputmode="decimal" autocomplete="off" id="ask" style="width:90px"></label>
            <button>Quote</button>
            <span class="small" id="qerr"></span>
          </form>
          <p class="small" style="margin-top:10px">Hint: think about the expected sum given what's revealed, and how your inventory should skew your quotes.</p>`}
        </div>
        ${log.length ? `<h2>Round log</h2><div class="card table-wrap"><table>
          <tr><th>Rd</th><th class="num">Fair value</th><th class="num">Your quote</th><th>Trades</th><th class="num">Position</th></tr>
          ${log.map((r) => `<tr><td>${r.round}</td><td class="num">${f(r.fair)}</td><td class="num">${r.bid} / ${r.ask}</td><td>${r.trades || '<span class="small">none</span>'}</td><td class="num">${r.pos}</td></tr>`).join('')}
        </table></div>` : ''}
        <div id="result"></div>`;
      if (!over) {
        const form = el.querySelector('#quote'), bid = el.querySelector('#bid'), ask = el.querySelector('#ask');
        form.addEventListener('submit', onQuote);
        // On the keypad, ↵ on the bid moves to the ask; ↵ on the ask sends the quote.
        const kp = QT.keypad.attach(form, [bid, ask], (inp) => (inp === bid ? kp.focus(ask) : form.requestSubmit()), { keys: '.' });
        if (!kp) bid.focus();
      }
    }

    function onQuote(e) {
      e.preventDefault();
      const bid = QT.parseAnswer(el.querySelector('#bid').value), ask = QT.parseAnswer(el.querySelector('#ask').value);
      const err = el.querySelector('#qerr');
      if (!Number.isFinite(bid) || !Number.isFinite(ask)) return (err.textContent = 'Enter both a bid and an ask.');
      if (ask <= bid) return (err.textContent = 'Ask must be above bid.');
      if (ask - bid > MAX_WIDTH) return (err.textContent = `Max width is ${MAX_WIDTH}.`);

      const hidden = [];
      for (let i = revealed; i < N_DICE; i++) hidden.push(i);
      const seen = R.shuffle(hidden).slice(0, Math.min(2, hidden.length));
      const informedEV = fair() + seen.reduce((s, i) => s + dice[i] - 3.5, 0);
      const acts = [];
      const deal = (who, side) => {
        // side: 'buy' means the trader buys from you at your ask
        if (side === 'buy') { pos -= 1; cash += ask; trades.push({ who, px: ask, sign: -1 }); acts.push(`${who} <b>buys</b> @ ${ask}`); }
        else { pos += 1; cash -= bid; trades.push({ who, px: bid, sign: 1 }); acts.push(`${who} <b>sells</b> @ ${bid}`); }
      };
      if (informedEV > ask) deal('Informed', 'buy');
      else if (informedEV < bid) deal('Informed', 'sell');
      if (Math.random() < NOISE_PROB) deal('Noise', Math.random() < 0.5 ? 'buy' : 'sell');

      log.push({ round: revealed + 1, fair: fair(), bid, ask, trades: acts.join('; '), pos });
      revealed++;
      draw();
      if (revealed >= N_DICE) settle();
    }

    function settle() {
      const pnl = cash + pos * truth;
      // P&L per trade: sign = +1 if you bought (you gain truth − px), −1 if you sold (px − truth)
      const by = (who) => trades.filter((t) => t.who === who).reduce((s, t) => s + t.sign * (truth - t.px), 0);
      const midErr = log.reduce((s, r) => s + Math.abs((r.bid + r.ask) / 2 - r.fair), 0) / log.length;
      const m = store.get().market;
      m.games++;
      m.total += pnl;
      m.best = m.best === null ? pnl : Math.max(m.best, pnl);
      m.history.push({ date: new Date().toISOString(), pnl, midErr });
      if (m.history.length > 100) m.history.shift();
      store.touchDay();
      store.save();

      const cls = (x) => (x > 0 ? 'pos' : x < 0 ? 'neg' : '');
      el.querySelector('#result').innerHTML = `
        <h2>Settlement</h2>
        <div class="tiles">
          <div class="tile"><div class="v">${truth}</div><div class="k">true sum</div></div>
          <div class="tile"><div class="v ${cls(pnl)}">${f(pnl)}</div><div class="k">your P&amp;L</div></div>
          <div class="tile"><div class="v ${cls(by('Noise'))}">${f(by('Noise'))}</div><div class="k">vs noise trader</div></div>
          <div class="tile"><div class="v ${cls(by('Informed'))}">${f(by('Informed'))}</div><div class="k">vs informed trader</div></div>
          <div class="tile"><div class="v">${f(midErr)}</div><div class="k">avg |mid − fair|</div></div>
        </div>
        <div class="card"><p><b>What to look for.</b> Against noise you earn roughly half your spread per trade. Against the informed trader you lose, and the loss grows as fewer dice stay hidden, because their peek is worth more. A good market maker keeps the mid close to fair value, widens when information risk is high, and skews quotes to shed unwanted inventory.</p>
        <button id="again">New game</button></div>`;
      el.querySelector('#again').addEventListener('click', () => render(el.closest('main')));
    }

    draw();
  }

  QT.market = { render };
})();
