// Figgie: the card trading game Jane Street created to teach trading (rules: figgie.com).
// Four players, 40 cards in four suits of 12, 10, 10 and 8. The "goal suit" is the suit of the
// same colour as the 12-card suit, so it has 8 or 10 cards. Everyone antes 50 into a 200-chip pot.
// At the end each goal-suit card pays 10 chips and whoever holds the most goal cards takes the
// rest of the pot (split on a tie). In between, players trade cards one at a time; after any
// trade every bid and offer is cleared.
//
// The engine below is pure (no DOM, randomness injectable) so tests can play whole bot games.
// You are player 0; three bots with different styles fill the other seats.
(function () {
  const store = QT.store, f = QT.fmtNum;
  const SUITS = [
    { sym: '♠', name: 'spades', red: false },
    { sym: '♣', name: 'clubs', red: false },
    { sym: '♥', name: 'hearts', red: true },
    { sym: '♦', name: 'diamonds', red: true },
  ];
  const PARTNER = [1, 0, 3, 2]; // the other suit of the same colour
  const START_CHIPS = 350, ANTE = 50, POT = 200, PER_CARD = 10;

  // The 12 equally likely deck layouts: which suit has 12 cards and which has 8.
  const CONFIGS = [];
  for (let twelve = 0; twelve < 4; twelve++) {
    for (let eight = 0; eight < 4; eight++) {
      if (eight === twelve) continue;
      const sizes = [10, 10, 10, 10];
      sizes[twelve] = 12;
      sizes[eight] = 8;
      CONFIGS.push({ twelve, eight, goal: PARTNER[twelve], sizes });
    }
  }

  // Bayes from your hand alone: P(layout | hand) ∝ Π C(suit size, cards you hold of it)
  // (multivariate hypergeometric with a uniform prior). Returns layout weights and the
  // marginal probabilities that each suit is the goal suit and the 12-card suit.
  function posterior(counts) {
    const w = CONFIGS.map((c) => c.sizes.reduce((p, n, s) => p * QT.m.comb(n, counts[s]), 1));
    const tot = w.reduce((a, b) => a + b, 0);
    const norm = w.map((x) => x / tot);
    const goal = [0, 0, 0, 0], twelve = [0, 0, 0, 0];
    CONFIGS.forEach((c, k) => {
      goal[c.goal] += norm[k];
      twelve[c.twelve] += norm[k];
    });
    return { w: norm, goal, twelve };
  }

  // A rough value per card: P(goal) × (10 chips + an even share of the bonus per goal card).
  function valuation(counts) {
    const { w } = posterior(counts), v = [0, 0, 0, 0];
    CONFIGS.forEach((c, k) => {
      const n = c.sizes[c.goal];
      v[c.goal] += w[k] * (PER_CARD + (POT - PER_CARD * n) / n);
    });
    return v;
  }

  // Bot styles. edge: how far from their value they quote and trade; pace: ms between actions.
  const BOTS = [
    { name: 'Ada', style: 'Careful counter: values cards from her own hand (Bayes) and quotes wide around that.', edge: 3, pace: [1400, 3600] },
    { name: 'Ben', style: 'Aggressive: counts his hand like Ada, quotes tighter and leans with what others are buying.', edge: 1.5, pace: [1000, 2800], flow: 1.5 },
    { name: 'Cal', style: 'Noise trader: has a random opinion of each suit and trades eagerly, a source of profit if you read the cards better.', edge: 1, pace: [900, 2400], noise: true },
  ];

  function newGame(rnd = Math.random) {
    const cfg = CONFIGS[Math.floor(rnd() * CONFIGS.length)];
    const deck = [];
    cfg.sizes.forEach((n, s) => { for (let k = 0; k < n; k++) deck.push(s); });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const players = ['You', ...BOTS.map((b) => b.name)].map((name) => ({ name, chips: START_CHIPS - ANTE, hand: [0, 0, 0, 0], pushed: [0, 0, 0, 0] }));
    deck.forEach((s, k) => players[k % players.length].hand[s]++);
    players.forEach((p, i) => {
      p.start = [...p.hand];
      if (!i) return;
      p.bot = BOTS[i - 1];
      p.val = p.bot.noise ? [0, 1, 2, 3].map(() => 4 + Math.round(rnd() * 12)) : valuation(p.hand);
    });
    return { cfg, players, book: [0, 1, 2, 3].map(() => ({ bid: null, ask: null })), tape: [], pressure: [0, 0, 0, 0], rnd };
  }

  // ---- order book: every action returns null on success or a message saying why not ----
  // `sign` is +1 when the buyer took an offer (buying pressure), −1 when the seller hit a bid.
  function trade(g, buyer, seller, s, px, sign) {
    const B = g.players[buyer], S = g.players[seller];
    S.hand[s]--;
    B.hand[s]++;
    B.chips -= px;
    S.chips += px;
    g.pressure[s] += sign;
    g.players[sign > 0 ? buyer : seller].pushed[s] += sign;
    g.tape.push({ buyer, seller, s, px });
    g.book.forEach((b) => { b.bid = b.ask = null; }); // Figgie rule: a trade clears all orders
  }
  function buy(g, who, s) {
    const a = g.book[s].ask;
    if (!a) return 'Nobody is offering that suit.';
    if (a.who === who) return "That's your own offer.";
    if (g.players[who].chips < a.px) return 'Not enough chips.';
    trade(g, who, a.who, s, a.px, 1);
    return null;
  }
  function sell(g, who, s) {
    const b = g.book[s].bid;
    if (!b) return 'Nobody is bidding for that suit.';
    if (b.who === who) return "That's your own bid.";
    if (g.players[who].hand[s] < 1) return `You have no ${SUITS[s].name} to sell.`;
    trade(g, b.who, who, s, b.px, -1);
    return null;
  }
  function post(g, who, s, side, px) {
    const P = g.players[who], b = g.book[s];
    if (!Number.isInteger(px) || px < 1) return 'Prices are whole numbers of chips, at least 1.';
    if (side === 'bid') {
      if (px > P.chips) return 'Not enough chips to back that bid.';
      if (b.ask && b.ask.who !== who && px >= b.ask.px) return buy(g, who, s); // crosses the offer: trade at the offer
      if (b.ask && b.ask.who === who && px >= b.ask.px) return 'Your bid must be below your own offer.';
      if (b.bid && b.bid.who !== who && px <= b.bid.px) return `Bids must beat the current ${b.bid.px}.`;
      b.bid = { who, px };
    } else {
      if (P.hand[s] < 1) return `You have no ${SUITS[s].name} to offer.`;
      if (b.bid && b.bid.who !== who && px <= b.bid.px) return sell(g, who, s); // crosses the bid
      if (b.bid && b.bid.who === who && px <= b.bid.px) return 'Your offer must be above your own bid.';
      if (b.ask && b.ask.who !== who && px >= b.ask.px) return `Offers must be under the current ${b.ask.px}.`;
      b.ask = { who, px };
    }
    return null;
  }

  // One bot decision: take the best mispriced order if there is one, otherwise improve a quote.
  function botAct(g, i) {
    const P = g.players[i], bot = P.bot, rnd = g.rnd;
    // Ben also leans with other players' net buying pressure in each suit.
    const val = P.val.map((v, s) => (bot.flow ? Math.max(0, v + Math.max(-6, Math.min(6, bot.flow * (g.pressure[s] - P.pushed[s])))) : v));
    let best = null;
    for (let s = 0; s < 4; s++) {
      const { bid, ask } = g.book[s];
      if (ask && ask.who !== i && ask.px <= val[s] - bot.edge && P.chips >= ask.px) {
        const gain = val[s] - ask.px;
        if (!best || gain > best.gain) best = { gain, act: () => buy(g, i, s) };
      }
      if (bid && bid.who !== i && P.hand[s] > 0 && bid.px >= val[s] + bot.edge) {
        const gain = bid.px - val[s];
        if (!best || gain > best.gain) best = { gain, act: () => sell(g, i, s) };
      }
    }
    if (best) return best.act();
    // The noise trader sometimes just takes a random order: liquidity for whoever reads the cards.
    if (bot.noise && rnd() < 0.25) {
      const s = Math.floor(rnd() * 4), { bid, ask } = g.book[s];
      if (rnd() < 0.5 && ask && ask.who !== i && ask.px <= 30) return buy(g, i, s);
      if (bid && bid.who !== i) return sell(g, i, s);
    }
    if (rnd() < 0.15) return 'pass';
    const s = Math.floor(rnd() * 4);
    if (rnd() < 0.5 || P.hand[s] < 1) {
      const px = Math.floor(val[s] - bot.edge - rnd() * 3);
      return px >= 1 ? post(g, i, s, 'bid', Math.min(px, P.chips)) : 'pass';
    }
    return post(g, i, s, 'ask', Math.max(1, Math.ceil(val[s] + bot.edge + rnd() * 3)));
  }

  // Final chips for each player: 10 per goal card, plus the bonus to whoever holds the most.
  function payouts(g) {
    const goal = g.cfg.goal, held = g.players.map((p) => p.hand[goal]), top = Math.max(...held);
    const winners = held.filter((h) => h === top).length, bonus = POT - PER_CARD * g.cfg.sizes[goal];
    return held.map((h) => h * PER_CARD + (h === top ? bonus / winners : 0));
  }

  // ---------------- screen ----------------
  const suitTag = (s) => `<span class="suit${SUITS[s].red ? ' red' : ''}" aria-label="${SUITS[s].name}">${SUITS[s].sym}</span>`;
  const pct = (x) => `${Math.round(x * 100)}%`;
  // A little stack of chips, one bar per 50 chips, so the table reads at a glance.
  const chipStack = (n) => `<span class="chips" aria-hidden="true">${Array.from({ length: Math.max(1, Math.min(10, Math.round(n / 50))) }, (_, i) => `<i style="height:${6 + ((i * 5) % 11)}px"></i>`).join('')}</span>`;

  function render(el) {
    const st = store.get().figgie;
    el.innerHTML = `
      <h1>Figgie</h1>
      <p class="lede">A fast card trading game created by Jane Street to teach trading. You trade against three bots for a few minutes; the cards everyone holds at the end decide the payout. It practises what trading interviews test: turning private information into a view, reading other people's trades, and not getting picked off.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${st.games}</div><div class="k">games played</div></div>
        <div class="tile"><div class="v">${st.games ? f(st.total / st.games) : '–'}</div><div class="k">average P&amp;L (chips)</div></div>
        <div class="tile"><div class="v">${st.best ?? '–'}</div><div class="k">best P&amp;L</div></div>
        <div class="tile"><div class="v">${st.wins}</div><div class="k">games won</div></div>
      </div>
      <div class="card lesson">
        <h3>Rules</h3>
        <ul>
          <li>40 cards: one suit has <b>12</b> cards, one has <b>8</b>, two have <b>10</b>. You don't know which.</li>
          <li>The <b>goal suit</b> is the same colour as the 12-card suit (♠ with ♣, ♥ with ♦). It has 8 or 10 cards.</li>
          <li>Everyone antes ${ANTE} chips: a pot of ${POT}. At the end, each goal-suit card you hold pays <b>${PER_CARD}</b>, and the player with the most goal cards takes the rest of the pot (split on a tie).</li>
          <li>Trade one card at a time: post a bid or an offer, or hit someone else's. <b>After every trade, all bids and offers are cleared.</b></li>
        </ul>
        <details><summary>How to think about it</summary><ul>
          <li>Your hand is evidence. If you hold 5 hearts, hearts is probably the 12-card suit, so <b>diamonds</b> is probably the goal suit, and your hearts are likely worth nothing.</li>
          <li>Sell the suit you think is long to anyone paying for it; buy the likely goal suit below its value (a goal card is worth 10 chips plus a share of the bonus, roughly 20–25 chips if you knew for sure).</li>
          <li>Watch the tape: players who keep buying one suit probably think it's the goal.</li>
          <li>Tap “Show the maths” during a game to see the Bayesian probabilities from your hand.</li>
        </ul></details>
        <div class="row" style="margin-top:12px"><button data-mins="4">Play (4 minutes)</button><button class="ghost" data-mins="2">Quick game (2 minutes)</button></div>
        <p class="small">Rules as published at <a href="https://www.figgie.com/" target="_blank" rel="noopener">figgie.com</a>. Bots run on this device.</p>
      </div>`;
    el.querySelectorAll('[data-mins]').forEach((b) => b.addEventListener('click', () => play(el, +b.dataset.mins)));
  }

  function play(el, mins) {
    const g = newGame(), you = g.players[0], end = Date.now() + mins * 60000;
    const next = g.players.map((p) => (p.bot ? Date.now() + 1500 + Math.random() * 1500 : Infinity));
    let timer = null, over = false;

    el.innerHTML = `
      <h1>Figgie</h1>
      <div class="session"><span class="mono" id="fg-time"></span><span>Chips <b id="fg-chips"></b> · pot ${POT}</span></div>
      <div class="card fg-board">
        ${[0, 1, 2, 3].map((s) => `
        <div class="fg-row" data-s="${s}">
          <div class="fg-suit"><span class="card-face${SUITS[s].red ? ' red' : ''}" role="img" aria-label="${SUITS[s].name}"><span class="corner" aria-hidden="true">${SUITS[s].sym}</span><span aria-hidden="true">${SUITS[s].sym}</span><span class="count" data-hold="${s}"></span></span><span class="small">you hold <b data-hold-text="${s}"></b></span></div>
          <div class="fg-book">
            <button type="button" class="ghost" data-sell="${s}" aria-label="Sell ${SUITS[s].name} at the best bid"></button>
            <button type="button" class="ghost" data-buy="${s}" aria-label="Buy ${SUITS[s].name} at the best offer"></button>
          </div>
          <div class="fg-post">
            <input type="text" inputmode="numeric" autocomplete="off" aria-label="Price for ${SUITS[s].name}" placeholder="price" data-px="${s}">
            <button type="button" class="ghost" data-post="bid" data-s="${s}">Bid</button>
            <button type="button" class="ghost" data-post="ask" data-s="${s}">Offer</button>
          </div>
        </div>`).join('')}
        <p class="small" id="fg-msg" aria-live="polite"></p>
      </div>
      <div class="grid">
        <div class="card"><h3>Players</h3><table class="fg-players" id="fg-players"></table></div>
        <div class="card"><h3>Trades</h3><ol class="fg-tape" id="fg-tape"></ol></div>
      </div>
      <details class="card" id="fg-maths"><summary>Show the maths</summary><div id="fg-post"></div></details>`;

    const $ = (s) => el.querySelector(s), msg = $('#fg-msg');
    const say = (t) => { msg.textContent = t || ''; };
    const who = (i) => (i === 0 ? 'you' : g.players[i].name);

    const P0 = posterior(you.start);
    $('#fg-post').innerHTML = `
      <p class="small">From your starting hand alone (${you.start.map((n, s) => `${n}${SUITS[s].sym}`).join(' ')}), Bayes' rule over the 12 possible decks gives:</p>
      <div class="table-wrap"><table><tr><th>Suit</th><th class="num">P(12-card suit)</th><th class="num">P(goal suit)</th></tr>
      ${[0, 1, 2, 3].map((s) => `<tr><td>${suitTag(s)} ${SUITS[s].name}</td><td class="num">${pct(P0.twelve[s])}</td><td class="num"><b>${pct(P0.goal[s])}</b></td></tr>`).join('')}</table></div>
      <p class="small">Each deck layout's likelihood is the product of C(suit size, cards you hold) over the four suits. A suit you hold many of is probably the 12-card suit, which makes the other suit of its colour the goal.</p>`;

    function draw() {
      $('#fg-chips').textContent = you.chips;
      for (let s = 0; s < 4; s++) {
        const { bid, ask } = g.book[s];
        $(`[data-hold="${s}"]`).textContent = you.hand[s];
        $(`[data-hold-text="${s}"]`).textContent = you.hand[s];
        const sb = $(`[data-sell="${s}"]`), bb = $(`[data-buy="${s}"]`);
        sb.innerHTML = !bid ? '<span class="small">no bid</span>' : bid.who === 0 ? `Your bid <b>${bid.px}</b>` : `Sell <b>@${bid.px}</b> <span class="small">${who(bid.who)}</span>`;
        sb.dataset.at = bid ? bid.px : '';
        sb.disabled = over || !bid || bid.who === 0 || you.hand[s] < 1;
        bb.innerHTML = !ask ? '<span class="small">no offer</span>' : ask.who === 0 ? `Your offer <b>${ask.px}</b>` : `Buy <b>@${ask.px}</b> <span class="small">${who(ask.who)}</span>`;
        bb.dataset.at = ask ? ask.px : '';
        bb.disabled = over || !ask || ask.who === 0 || you.chips < ask.px;
      }
      $('#fg-players').innerHTML = `<tr><th>Player</th><th class="num">Chips</th><th class="num">Cards</th></tr>` +
        g.players.map((p) => `<tr><td>${p.name}</td><td class="num">${chipStack(p.chips)}${p.chips}</td><td class="num">${p.hand.reduce((a, b) => a + b, 0)}</td></tr>`).join('');
      $('#fg-tape').innerHTML = g.tape.slice(-8).reverse().map((t) => `<li>${suitTag(t.s)} <b>${t.px}</b>: ${who(t.seller)} → ${who(t.buyer)}</li>`).join('') || '<li class="small">No trades yet.</li>';
    }

    // Prices move while you decide: only trade at the price on the button you pressed.
    el.querySelector('.fg-board').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || over) return;
      const s = +(btn.dataset.sell ?? btn.dataset.buy ?? btn.dataset.s);
      if (btn.dataset.sell !== undefined || btn.dataset.buy !== undefined) {
        const side = btn.dataset.sell !== undefined ? 'bid' : 'ask', cur = g.book[s][side];
        if (!cur || String(cur.px) !== btn.dataset.at) { say('The price moved. Check the new one.'); return draw(); }
        say(btn.dataset.sell !== undefined ? sell(g, 0, s) : buy(g, 0, s));
      } else if (btn.dataset.post) {
        const inp = el.querySelector(`[data-px="${s}"]`), px = QT.parseAnswer(inp.value);
        const err = post(g, 0, s, btn.dataset.post, px);
        say(err);
        if (!err) inp.value = '';
      }
      draw();
    });

    const tick = () => {
      const now = Date.now(), left = Math.max(0, end - now);
      $('#fg-time').textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} left`;
      if (!left) return finish();
      let moved = false;
      g.players.forEach((p, i) => {
        if (!p.bot || now < next[i]) return;
        botAct(g, i);
        moved = true;
        next[i] = now + p.bot.pace[0] + Math.random() * (p.bot.pace[1] - p.bot.pace[0]);
      });
      if (moved) draw();
    };
    timer = setInterval(tick, 200);
    QT.cleanup = () => clearInterval(timer);

    function finish() {
      over = true;
      clearInterval(timer);
      QT.cleanup = null;
      const pay = payouts(g), goal = g.cfg.goal;
      const pnl = g.players.map((p, i) => p.chips + pay[i] - START_CHIPS);
      const won = pnl[0] === Math.max(...pnl);
      const st = store.get().figgie;
      st.games++;
      st.total += pnl[0];
      st.best = st.best === null ? pnl[0] : Math.max(st.best, pnl[0]);
      if (won) st.wins++;
      store.log(st.history, { pnl: pnl[0] });
      store.touchDay();
      store.save();
      const cls = (x) => (x > 0 ? 'pos' : x < 0 ? 'neg' : '');
      const yourGoalP = P0.goal[goal];
      el.innerHTML = `
        <div class="title-row"><h1>Figgie: ${won ? 'you won!' : 'game over'}</h1>${won ? QT.flair.milestone('Winner') : ''}</div>
        <div class="tiles">
          <div class="tile"><div class="v">${suitTag(goal)}</div><div class="k">goal suit (${g.cfg.sizes[goal]} cards)</div></div>
          <div class="tile"><div class="v">${suitTag(g.cfg.twelve)}</div><div class="k">12-card suit</div></div>
          <div class="tile"><div class="v ${cls(pnl[0])}">${pnl[0] > 0 ? '+' : ''}${f(pnl[0])}</div><div class="k">your P&amp;L (chips)</div></div>
        </div>
        <div class="card table-wrap"><table>
          <tr><th>Player</th><th class="num">Goal cards</th><th class="num">Payout</th><th class="num">Trading</th><th class="num">P&amp;L</th></tr>
          ${g.players.map((p, i) => `<tr><td>${p.name}</td><td class="num">${p.hand[goal]}</td><td class="num">${f(pay[i])}</td><td class="num">${p.chips - (START_CHIPS - ANTE) > 0 ? '+' : ''}${p.chips - (START_CHIPS - ANTE)}</td><td class="num ${cls(pnl[i])}">${f(pnl[i])}</td></tr>`).join('')}
        </table></div>
        <div class="card">
          <p style="margin-top:0">Your starting hand gave the goal suit a <b>${pct(yourGoalP)}</b> chance${yourGoalP === Math.max(...P0.goal) ? ', the highest of the four, so your hand pointed the right way' : `; your hand pointed to ${suitTag(P0.goal.indexOf(Math.max(...P0.goal)))} as the goal instead, which happens: a hand is only a sample`}. ${g.tape.length} trades happened in total.</p>
          <p class="small">${BOTS.map((b) => `<b>${b.name}</b>: ${b.style}`).join('<br>')}</p>
        </div>
        <div class="row" style="margin-top:18px"><button id="again">Play again</button><a class="btn ghost" href="#/figgie">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => play(el, mins));
    }

    tick();
    draw();
  }

  QT.figgie = { render, SUITS, CONFIGS, posterior, valuation, newGame, buy, sell, post, botAct, payouts, START_CHIPS, ANTE, POT };
})();
