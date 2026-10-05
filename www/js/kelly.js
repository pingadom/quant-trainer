// Bet sizing: a run of bets with known odds where you choose how much of your bankroll to stake.
// A Kelly bettor and a half-Kelly bettor take the same bets with the same outcomes alongside you.
// Luck is removed from the final verdict by comparing expected log-growth, not final bankroll.
(function () {
  const store = QT.store, f = QT.fmtNum;
  const ROUNDS = 20, START = 100;
  const ODDS = [0.5, 1, 1, 1.5, 2, 3, 4];
  const ODDS_LABEL = { 0.5: '1 to 2', 1: 'evens (1 to 1)', 1.5: '3 to 2', 2: '2 to 1', 3: '3 to 1', 4: '4 to 1' };

  // Kelly fraction for a bet that wins b per unit staked with probability p: f* = p − q/b.
  // Negative means the bet has negative expected value: stake nothing.
  const kellyF = (p, b) => p - (1 - p) / b;
  // Expected log-growth of the bankroll per bet when staking fraction x.
  const growth = (x, p, b) => (x >= 1 ? (p < 1 ? -Infinity : Math.log(1 + b)) : p * Math.log(1 + x * b) + (1 - p) * Math.log(1 - x));

  // About a quarter of bets have negative expected value; the rest have a Kelly stake of 5–50%.
  function makeBet(rnd = Math.random) {
    const wantNeg = rnd() < 0.25;
    for (;;) {
      const b = ODDS[Math.floor(rnd() * ODDS.length)], p = Math.round(5 * (2 + Math.floor(rnd() * 17))) / 100;
      const k = kellyF(p, b);
      if (wantNeg ? k < -0.02 && k > -0.5 : k >= 0.05 && k <= 0.5) return { p, b };
    }
  }

  // Share of the Kelly bettor's expected log-growth you achieved over the same bets (1 = Kelly).
  function efficiency(bets) {
    const you = bets.reduce((s, x) => s + growth(x.f, x.p, x.b), 0);
    const best = bets.reduce((s, x) => s + growth(Math.max(0, kellyF(x.p, x.b)), x.p, x.b), 0);
    return best > 0 ? you / best : null;
  }
  const pct = (x) => `${f(Math.round(x * 1000) / 10)}%`;
  const effStr = (e) => (e === null ? '–' : e === -Infinity ? '−∞' : pct(e));

  function render(el) {
    const st = store.get().kelly;
    el.innerHTML = `
      <h1>Bet sizing</h1>
      <p class="lede">Trading interviews often ask not just whether to take a bet but <b>how much</b> to stake. You'll get ${ROUNDS} bets with known odds. Choose what share of your bankroll to stake on each. A Kelly bettor and a half-Kelly bettor take the same bets beside you.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${st.games}</div><div class="k">games played</div></div>
        <div class="tile"><div class="v">${effStr(st.best)}</div><div class="k">best sizing score</div></div>
      </div>
      <div class="card lesson">
        <h3>The Kelly criterion in two lines</h3>
        <p>For a bet that pays <b>b</b> to 1 and wins with probability <b>p</b> (lose with q = 1 − p), the stake that maximises long-run growth is</p>
        <p class="formula">f* = p − q / b <span class="small">(edge ÷ odds)</span></p>
        <p>If f* is negative the bet loses money on average: stake nothing. Staking <b>twice</b> Kelly gives roughly zero growth, and more than that shrinks your bankroll even though every bet is in your favour. Many traders use <b>half Kelly</b>: about three quarters of the growth with half the swings.</p>
        <details><summary>Where it comes from</summary>
          <p>Staking a fraction x, your bankroll is multiplied by (1 + xb) with probability p and by (1 − x) otherwise. Over many bets, growth per bet is the expected log: g(x) = p·ln(1 + xb) + q·ln(1 − x). Setting g′(x) = pb/(1 + xb) − q/(1 − x) = 0 gives x = p − q/b.</p>
          <p>Example: a coin that wins 60% at evens (b = 1) gives f* = 0.6 − 0.4 = 20% of your bankroll.</p>
        </details>
        <p class="small">Your <b>sizing score</b> is the share of Kelly's expected growth your stakes would earn on average over the same bets, so it doesn't depend on how the coins happened to land. 100% is Kelly.</p>
        <button id="start">Start ${ROUNDS} bets</button>
      </div>`;
    el.querySelector('#start').addEventListener('click', () => play(el));
  }

  function play(el) {
    const bankrolls = { you: START, kelly: START, half: START }, paths = { you: [START], kelly: [START], half: [START] };
    const bets = [];
    let i = 0, bet = makeBet();

    function show(msg) {
      el.innerHTML = `
        <h1>Bet sizing</h1>
        <div class="session"><span>Bet ${i + 1} of ${ROUNDS}</span><span class="mono">Bankroll ${f(round2(bankrolls.you))}</span></div>
        <div class="card">
          <div class="question">Wins with probability <b>${Math.round(bet.p * 100)}%</b> and pays <b>${ODDS_LABEL[bet.b]}</b><span class="small"> (win ${bet.b} per 1 staked; lose your stake otherwise)</span></div>
          <form id="kf">
            <label for="stake">Stake (% of bankroll)</label>
            <div class="row">
              <input type="range" id="stake-r" min="0" max="100" step="1" value="0" aria-label="Stake slider, percent of bankroll" style="flex:1;min-width:160px">
              <input type="text" inputmode="decimal" autocomplete="off" id="stake" value="0" style="width:80px">
              <span class="small" id="amt"></span>
            </div>
            <div class="row" style="margin-top:8px">${[0, 5, 10, 25, 50].map((x) => `<button type="button" class="ghost chip-btn" data-x="${x}">${x}%</button>`).join('')}</div>
            <button style="margin-top:12px">Place bet</button>
            <p class="small" id="kerr" aria-live="polite">${msg || ''}</p>
          </form>
        </div>
        ${bets.length ? `<p class="small">Kelly's bankroll: ${f(round2(bankrolls.kelly))} · half Kelly: ${f(round2(bankrolls.half))}</p>` : ''}`;
      const box = el.querySelector('#stake'), slider = el.querySelector('#stake-r'), amt = el.querySelector('#amt');
      const sync = (v) => { amt.textContent = Number.isFinite(v) ? `= ${f(round2((bankrolls.you * Math.min(100, Math.max(0, v))) / 100))}` : ''; };
      slider.addEventListener('input', () => { box.value = slider.value; sync(+slider.value); });
      box.addEventListener('input', () => { const v = QT.parseAnswer(box.value.replace('%', '')); if (Number.isFinite(v)) slider.value = v; sync(v); });
      el.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => { box.value = slider.value = b.dataset.x; sync(+b.dataset.x); }));
      sync(0);
      el.querySelector('#kf').addEventListener('submit', (e) => {
        e.preventDefault();
        const v = QT.parseAnswer(box.value.replace('%', ''));
        if (!Number.isFinite(v) || v < 0 || v > 100) return (el.querySelector('#kerr').textContent = 'Enter a stake between 0 and 100%.');
        place(v / 100);
      });
    }

    function place(x) {
      const won = Math.random() < bet.p, k = kellyF(bet.p, bet.b);
      const settle = (who, frac) => {
        const stake = bankrolls[who] * frac;
        bankrolls[who] += won ? stake * bet.b : -stake;
        paths[who].push(bankrolls[who]);
      };
      settle('you', x);
      settle('kelly', Math.max(0, k));
      settle('half', Math.max(0, k / 2));
      bets.push({ ...bet, f: x, won });
      const notes = [];
      if (k <= 0) notes.push(x > 0 ? 'This bet had <b>negative expected value</b>: the right stake was 0.' : 'Right: this bet had negative expected value, so the correct stake was 0.');
      else {
        notes.push(`Kelly stake: ${Math.round(bet.p * 100)}% − ${Math.round((1 - bet.p) * 100)}% ÷ ${bet.b} = <b>${pct(k)}</b>.`);
        if (x > 2 * k) notes.push('You staked more than twice Kelly. On average that <b>shrinks</b> your bankroll, even though the bet is in your favour.');
        else if (x > k * 1.25) notes.push('Above Kelly: more risk for less growth.');
        else if (x < k * 0.3) notes.push('Well under Kelly: safe, but you left growth on the table.');
      }
      const ruined = bankrolls.you < 0.01;
      el.innerHTML = `
        <h1>Bet sizing</h1>
        <div class="session"><span>Bet ${i + 1} of ${ROUNDS}</span><span class="mono">Bankroll ${f(round2(bankrolls.you))}</span></div>
        <div class="card">
          <div class="fb ${won ? 'ok' : 'bad'}">${won ? '✓ The bet won.' : '✗ The bet lost.'} You staked ${pct(x)}.</div>
          <p>${notes.join(' ')}</p>
          ${ruined ? '<div class="coach-tip"><b>You\'re out of money.</b> Betting everything means one loss ends the game, however good the odds.</div>' : ''}
          <button id="next">${!ruined && i + 1 < ROUNDS ? 'Next bet →' : 'See results'}</button>
        </div>`;
      const btn = el.querySelector('#next');
      btn.focus();
      btn.addEventListener('click', () => {
        if (ruined || ++i >= ROUNDS) return finish();
        bet = makeBet();
        show();
      });
    }

    function finish() {
      const eff = efficiency(bets), st = store.get().kelly;
      const stored = eff === null ? null : Math.max(-9.99, eff);
      const prevBest = st.best;
      st.games++;
      if (stored !== null) st.best = st.best === null ? stored : Math.max(st.best, stored);
      store.log(st.history, { eff: stored ?? 0, final: round2(bankrolls.you), kelly: round2(bankrolls.kelly) });
      store.touchDay();
      store.save();
      const over = bets.filter((x) => kellyF(x.p, x.b) > 0 && x.f > 2 * kellyF(x.p, x.b)).length;
      const negTaken = bets.filter((x) => kellyF(x.p, x.b) <= 0 && x.f > 0).length;
      el.innerHTML = `
        <div class="title-row"><h1>Results</h1>${stored !== null && (prevBest === null || stored > prevBest) ? QT.flair.milestone('New best') : ''}</div>
        <div class="tiles">
          <div class="tile"><div class="v">${f(round2(bankrolls.you))}</div><div class="k">your bankroll (from ${START})</div></div>
          <div class="tile"><div class="v">${f(round2(bankrolls.kelly))}</div><div class="k">Kelly</div></div>
          <div class="tile"><div class="v">${f(round2(bankrolls.half))}</div><div class="k">half Kelly</div></div>
          <div class="tile"><div class="v">${effStr(eff)}</div><div class="k">sizing score (Kelly = 100%)</div></div>
        </div>
        <div class="card">
          ${QT.chart.line([{ name: 'You', values: paths.you }, { name: 'Kelly', values: paths.kelly }, { name: 'Half Kelly', values: paths.half, dashed: true }], { label: `Bankroll over ${bets.length} bets: you ended at ${f(round2(bankrolls.you))}, Kelly at ${f(round2(bankrolls.kelly))}, half Kelly at ${f(round2(bankrolls.half))}`, xFirst: 'start', xLast: `bet ${bets.length}` })}
          <p>${verdict(eff, over, negTaken)}</p>
          <p class="small">Final bankrolls depend on luck; the sizing score doesn't. It compares the average growth your stakes would earn with Kelly's on these same bets.</p>
        </div>
        <div class="row" style="margin-top:18px"><button id="again">Play again</button><a class="btn ghost" href="#/kelly">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => play(el));
    }

    show();
  }

  function verdict(eff, over, negTaken) {
    const bits = [];
    if (eff === null) return 'No bets were placed.';
    if (eff === 0) return 'You staked nothing on every bet: no risk, but no growth either. Most of these bets were in your favour.';
    if (eff >= 0.9) bits.push('Excellent sizing: close to the growth-optimal stakes.');
    else if (eff >= 0.6) bits.push('Good sizing, with some room to tighten.');
    else if (eff > 0) bits.push('Your stakes grew the bankroll on average, but well below what Kelly would have.');
    else bits.push('On average your stakes would <b>shrink</b> the bankroll, even though most bets were favourable. That is what over-betting does.');
    if (over) bits.push(`${over} bet${over > 1 ? 's were' : ' was'} more than twice the Kelly stake.`);
    if (negTaken) bits.push(`You staked on ${negTaken} negative-expected-value bet${negTaken > 1 ? 's' : ''}; check p × b against q before betting.`);
    return bits.join(' ');
  }
  const round2 = (x) => Math.round(x * 100) / 100;

  QT.kelly = { render, kellyF, growth, makeBet, efficiency };
})();
