// Formula flashcards: the results interviewers expect you to know cold, as flip cards on a
// spaced schedule. A card you get right moves to a longer gap (1, 3, 7, 21, then 60 days); one
// you miss comes back later in the same session and starts again tomorrow.
(function () {
  const store = QT.store, DAY = 864e5;
  const GAPS = [1, 3, 7, 21, 60], SESSION = 20, NEW_PER_SESSION = 8;

  // [id, topic, front, back]
  const CARDS = [
    ['p-atleast', 'Probability', 'P(at least one)', '1 − P(none). For n independent tries at probability p: 1 − (1 − p)<sup>n</sup>.'],
    ['p-bayes', 'Probability', "Bayes' rule in odds form", 'Posterior odds = prior odds × likelihood ratio.'],
    ['p-linear', 'Probability', 'Linearity of expectation', 'E[X + Y] = E[X] + E[Y], even when X and Y are dependent. Write counts as sums of indicators.'],
    ['p-tailsum', 'Probability', 'Tail-sum formula (X ≥ 0, whole numbers)', 'E[X] = Σ<sub>k≥1</sub> P(X ≥ k).'],
    ['p-geom', 'Probability', 'Expected tries until the first success (probability p each)', '1/p.'],
    ['p-coupon', 'Probability', 'Coupon collector: expected draws to see all n types', 'n(1 + ½ + ⅓ + … + 1/n) ≈ n ln n. Six faces of a die: 14.7 rolls.'],
    ['p-die', 'Probability', 'One fair die: mean and variance', 'Mean 3.5, variance 35/12 ≈ 2.92.'],
    ['p-twodice', 'Probability', 'Two dice: P(sum = k)', '(6 − |k − 7|)/36. Most likely sum 7, probability 1/6.'],
    ['p-birthday', 'Probability', 'Birthday problem: P(no shared birthday) for n people', '≈ exp(−n²/(2 × 365)). 23 people is just over 50% for a match.'],
    ['p-ruin', 'Probability', "Fair gambler's ruin from i, absorbing at 0 and N", 'P(reach N first) = i/N. Expected duration i(N − i).'],
    ['p-ruinb', 'Probability', "Biased gambler's ruin (win p, lose q, r = q/p)", 'P(reach N first) = (1 − r<sup>i</sup>)/(1 − r<sup>N</sup>).'],
    ['p-hh', 'Probability', 'Fair coin: expected flips until HH, and until HT', 'HH: 6. HT: 4. (HH overlaps itself, so a miss can waste the progress.)'],
    ['p-order', 'Probability', 'k-th smallest of n independent uniforms on [0, 1]', 'Mean k/(n + 1). The largest: n/(n + 1).'],
    ['p-branch', 'Probability', 'Branching process: extinction probability', 'The smallest root in [0, 1] of q = G(q), G being the offspring generating function. Certain if mean offspring ≤ 1.'],
    ['p-stat2', 'Probability', 'Two-state chain: long-run share of time in B', 'π<sub>B</sub> = P(A→B)/(P(A→B) + P(B→A)). Expected return time to a state = 1/π.'],
    ['s-varsum', 'Statistics', 'Var(aX + bY)', 'a²Var X + b²Var Y + 2ab Cov(X, Y).'],
    ['s-var', 'Statistics', 'Variance from moments', 'Var X = E[X²] − (E[X])².'],
    ['s-corr', 'Statistics', 'Correlation', 'ρ = Cov(X, Y)/(σ<sub>X</sub> σ<sub>Y</sub>), between −1 and 1.'],
    ['s-se', 'Statistics', 'Standard error of a sample mean', 'σ/√n. Four times the data halves it.'],
    ['s-ci', 'Statistics', '95% confidence interval for a mean', 'x̄ ± 1.96 × σ/√n.'],
    ['s-normal', 'Statistics', 'Normal tails: P(|Z| > 1), > 1.96, > 2.58', 'About 32%, 5% and 1%.'],
    ['s-poisson', 'Statistics', 'Poisson(λ): mean and variance', 'Both λ.'],
    ['s-exp', 'Statistics', 'Exponential(λ): mean, and its special property', 'Mean 1/λ. Memoryless: P(X > s + t | X > s) = P(X > t).'],
    ['s-unif', 'Statistics', 'Uniform(a, b): variance', '(b − a)²/12.'],
    ['s-beta', 'Statistics', 'OLS slope (simple regression)', 'β = Cov(X, Y)/Var(X) = ρ σ<sub>Y</sub>/σ<sub>X</sub>. Intercept: ȳ − βx̄.'],
    ['s-r2', 'Statistics', 'R² in a simple regression', 'ρ², the squared correlation.'],
    ['s-pval', 'Statistics', 'What a p-value is (and is not)', 'P(data at least this extreme | H<sub>0</sub> true). It is not the probability that H<sub>0</sub> is true.'],
    ['f-kelly', 'Trading', 'Kelly fraction for a bet paying b to 1, won with probability p', 'f* = p − q/b (edge ÷ odds). Twice Kelly gives roughly zero growth.'],
    ['f-annvol', 'Trading', 'Annualising daily volatility', 'Multiply by √252 ≈ 15.9. Mean returns scale with time, volatility with its square root.'],
    ['f-sharpe', 'Trading', 'Annualising a daily Sharpe ratio', 'Multiply by √252 ≈ 15.9.'],
    ['f-atm', 'Trading', 'At-the-money call, rule of thumb', '≈ 0.4 × σ × S × √T.'],
    ['f-straddle', 'Trading', 'At-the-money straddle, rule of thumb', '≈ 0.8 × σ × S × √T.'],
    ['f-parity', 'Trading', 'Put–call parity', 'C − P = S − K e<sup>−rT</sup>; with zero rates, C − P = S − K.'],
    ['f-drag', 'Trading', 'Compound (geometric) growth rate', '≈ μ − σ²/2. Volatility drag: a +50% then −50% year loses 25%.'],
    ['f-var', 'Trading', 'Normal value at risk, 95% and 99%', '1.645σ and 2.33σ.'],
    ['f-delta', 'Trading', 'Delta-hedging an option you own', 'Hold −Δ of the underlying per option (×100 per standard equity contract).'],
    ['f-72', 'Trading', 'Rule of 72', 'Years to double ≈ 72 ÷ (interest rate in %).'],
    ['f-ar1', 'Trading', 'AR(1) stationary variance', 'σ<sub>ε</sub>²/(1 − φ²). Autocorrelation at lag k: φ<sup>k</sup>.'],
    ['f-halflife', 'Trading', 'Mean-reversion half-life of an AR(1)', 'ln(½)/ln φ.'],
    ['m-sevenths', 'Mental maths', '1/7 as a decimal', '0.142857 repeating; every n/7 uses the same six digits.'],
    ['m-eighths', 'Mental maths', '1/8 and 1/16', '0.125 and 0.0625.'],
    ['m-consts', 'Mental maths', '√2, √3, ln 2, e', '1.414, 1.732, 0.693, 2.718.'],
    ['m-twos', 'Mental maths', '2<sup>10</sup> and 2<sup>20</sup>', '1,024 (≈ 10³) and 1,048,576 (≈ 10⁶).'],
  ];
  const byId = Object.fromEntries(CARDS.map((c) => [c[0], c]));

  const deck = () => store.get().flash;
  const dueIds = (now = Date.now()) => CARDS.filter((c) => deck()[c[0]] && deck()[c[0]].due <= now).map((c) => c[0]);
  const newIds = () => CARDS.filter((c) => !deck()[c[0]]).map((c) => c[0]);

  // Right: next gap; wrong: back to the start, due tomorrow (and again later this session).
  function grade(id, ok, now = Date.now()) {
    const d = deck(), c = d[id] || { box: -1, due: 0 };
    c.box = ok ? Math.min(GAPS.length - 1, c.box + 1) : 0;
    c.due = now + (ok ? GAPS[c.box] : 1) * DAY;
    d[id] = c;
    return c;
  }

  function render(el) {
    const due = dueIds(), fresh = newIds(), learned = CARDS.length - fresh.length;
    const mastered = CARDS.filter((c) => (deck()[c[0]]?.box ?? -1) >= 3).length;
    const n = Math.min(SESSION, due.length + Math.min(NEW_PER_SESSION, fresh.length));
    const topics = [...new Set(CARDS.map((c) => c[1]))];
    el.innerHTML = `
      <h1>Formula cards</h1>
      <p class="lede">The results interviewers expect you to know cold. Say the answer out loud, flip, and be honest: cards you know come back less and less often.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${due.length}</div><div class="k">due now</div></div>
        <div class="tile"><div class="v">${learned}/${CARDS.length}</div><div class="k">started</div></div>
        <div class="tile"><div class="v">${mastered}</div><div class="k">well known (21+ day gap)</div></div>
      </div>
      <div class="card">
        ${n ? `<p style="margin-top:0">${due.length ? `${Math.min(due.length, SESSION)} due` : 'Nothing due'}${fresh.length && n > Math.min(due.length, SESSION) ? `, plus ${n - Math.min(due.length, SESSION)} new` : ''}.</p><button id="fc-go" class="btn-lg">Start (${n} card${n > 1 ? 's' : ''})</button>`
          : '<p style="margin:0">All caught up. Come back tomorrow.</p>'}
      </div>
      <h2>All cards</h2>
      ${topics.map((t) => `<details class="card"><summary><b>${t}</b> <span class="small">${CARDS.filter((c) => c[1] === t).length} cards</span></summary>
        <dl class="fc-list">${CARDS.filter((c) => c[1] === t).map((c) => `<dt>${c[2]}</dt><dd>${c[3]}</dd>`).join('')}</dl></details>`).join('')}`;
    const go = el.querySelector('#fc-go');
    if (go) go.addEventListener('click', () => session(el, [...due.slice(0, SESSION), ...fresh.slice(0, Math.max(0, n - Math.min(due.length, SESSION)))]));
  }

  function session(el, ids) {
    const queue = [...ids], total = ids.length;
    let flipped = false, right = 0, seen = 0, onKey = null;
    QT.cleanup = () => document.removeEventListener('keydown', onKey);
    function show() {
      if (!queue.length) return finish();
      flipped = false;
      const [, topic, front] = byId[queue[0]];
      el.innerHTML = `
        <a class="back" href="#/flashcards">← Formula cards</a>
        <div class="session"><span>${topic}</span><span class="mono">${Math.min(seen + 1, total)} / ${total}</span></div>
        <div class="card fc-card" id="fc-card">
          <div class="fc-front">${front}</div>
          <div class="fc-back" id="fc-back" hidden></div>
        </div>
        <div class="row" id="fc-actions"><button id="fc-flip" class="btn-lg">Show answer</button><span class="small">or press Space</span></div>`;
      el.querySelector('#fc-flip').addEventListener('click', flip);
      el.querySelector('#fc-flip').focus();
    }
    function flip() {
      if (flipped) return;
      flipped = true;
      const back = el.querySelector('#fc-back');
      back.innerHTML = byId[queue[0]][3];
      back.hidden = false;
      el.querySelector('#fc-actions').innerHTML = `<button id="fc-yes">Got it</button><button id="fc-no" class="ghost">Not yet</button><span class="small">keys 1 / 2</span>`;
      el.querySelector('#fc-yes').addEventListener('click', () => answer(true));
      el.querySelector('#fc-no').addEventListener('click', () => answer(false));
      el.querySelector('#fc-yes').focus();
    }
    function answer(ok) {
      const id = queue.shift();
      grade(id, ok);
      seen++;
      if (ok) right++;
      else queue.push(id); // once more before the session ends
      store.touchDay();
      store.save();
      show();
    }
    onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === ' ' && !flipped) { e.preventDefault(); flip(); }
      else if (flipped && e.key === '1') answer(true);
      else if (flipped && e.key === '2') answer(false);
    };
    document.addEventListener('keydown', onKey);
    function finish() {
      document.removeEventListener('keydown', onKey);
      QT.cleanup = null;
      el.innerHTML = `
        <div class="title-row"><h1>Cards done</h1>${right === seen && seen ? QT.flair.stamp('Clean sweep') : ''}</div>
        <div class="card"><p style="margin-top:0">${total} card${total > 1 ? 's' : ''} reviewed; you marked “Got it” ${right} time${right === 1 ? '' : 's'} out of ${seen}.</p>
          <p class="small">Cards you knew come back in ${GAPS[0]}–${GAPS[GAPS.length - 1]} days depending on how well you know them; the rest come back tomorrow.</p>
          <div class="row"><a class="btn" href="#/flashcards">Back to the deck</a><a class="btn ghost" href="#/">Home</a></div></div>`;
    }
    show();
  }

  QT.flashcards = { CARDS, grade, dueIds, newIds };
  QT.views = Object.assign(QT.views || {}, { flashcards: render });
})();
