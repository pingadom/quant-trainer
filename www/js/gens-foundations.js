// Foundations-track problem generators (same shape as gens-interview.js).
(function () {
  const R = QT.rand, M = QT.m, f = QT.fmtNum;
  const pct = (x) => `${+(x * 100).toPrecision(4)}%`;
  const EXACT = { abs: 0.5, rel: 0 };
  const TABLE = { abs: 0.003, rel: 0.02 }; // answers that need a Φ table lookup
  const PHI = `<p class="small">Φ(0.5)=0.6915 · Φ(1)=0.8413 · Φ(1.5)=0.9332 · Φ(1.645)=0.95 · Φ(1.96)=0.975 · Φ(2)=0.9772 · Φ(2.5)=0.9938 · Φ(3)=0.9987</p>`;
  QT.gens = QT.gens || {};

  QT.gens.dist = [
    () => {
      const mu = R.int(50, 150), s = R.int(5, 25), z = R.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]), x = mu + z * s;
      const a = 1 - M.normCdf(z);
      return {
        q: `X ~ N(μ = ${mu}, σ = ${s}). Find P(X > ${x}).${PHI}`,
        a,
        tol: TABLE,
        sol: `Standardise: z = (${x} − ${mu})/${s} = ${z}. P(Z > ${z}) = 1 − Φ(${z}) ≈ ${f(a)}. Remember Φ(−z) = 1 − Φ(z).`,
      };
    },
    () => {
      const l = R.int(1, 6), k = R.int(0, 6), a = (Math.exp(-l) * l ** k) / M.fact(k);
      return {
        q: `Orders arrive as a Poisson process averaging ${l} per minute. What is the probability of exactly ${k} orders in a given minute?`,
        a,
        sol: `P(N = ${k}) = e<sup>−${l}</sup>·${l}<sup>${k}</sup>/${k}! ≈ ${f(a)}.`,
      };
    },
    () => {
      const l = R.pick([0.2, 0.5, 1, 2]), s = R.int(1, 5), t = R.int(1, 4), a = Math.exp(-l * t);
      return {
        q: `Waiting time T ~ Exponential(rate λ = ${l}). Given you've already waited ${s}, what is P(T > ${s + t} | T > ${s})?`,
        a,
        sol: `The exponential distribution is memoryless: P(T > s+t | T > s) = P(T > t) = e<sup>−λt</sup> = e<sup>−${f(l * t)}</sup> ≈ ${f(a)}. The ${s} already waited is irrelevant.`,
      };
    },
    () => {
      const lo = R.int(-10, 5), hi = lo + R.int(2, 20), a = (hi - lo) ** 2 / 12;
      return {
        q: `X ~ Uniform(${lo}, ${hi}). What is Var(X)?`,
        a,
        sol: `Var = (b − a)²/12 = ${(hi - lo) ** 2}/12 ≈ ${f(a)}.`,
      };
    },
    () => {
      const n = R.int(5, 20), p = R.pick([0.05, 0.1, 0.2, 0.3]), a = (1 - p) ** n + n * p * (1 - p) ** (n - 1);
      return {
        q: `A strategy makes ${n} independent trades per week, each losing with probability ${p}. What is the probability of at most one losing trade in a week?`,
        a,
        sol: `Binomial(${n}, ${p}): P(X ≤ 1) = (1−p)<sup>${n}</sup> + ${n}p(1−p)<sup>${n - 1}</sup> ≈ ${f((1 - p) ** n)} + ${f(n * p * (1 - p) ** (n - 1))} = ${f(a)}.`,
      };
    },
  ];

  QT.gens.moments = [
    () => {
      const vx = R.int(1, 9), vy = R.int(1, 9), rho = R.pick([-0.5, -0.2, 0.3, 0.5, 0.8]);
      const cov = +(rho * Math.sqrt(vx * vy)).toFixed(1), a1 = R.pick([1, 2, 3, -1]), b1 = R.pick([1, 2, -1, -2]);
      const ans = a1 * a1 * vx + b1 * b1 * vy + 2 * a1 * b1 * cov;
      return {
        q: `Var(X) = ${vx}, Var(Y) = ${vy}, Cov(X,Y) = ${cov}. Find Var(${a1}X ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)}Y).`,
        a: ans,
        sol: `Var(aX + bY) = a²Var(X) + b²Var(Y) + 2ab·Cov = ${a1 * a1}·${vx} + ${b1 * b1}·${vy} + 2·(${a1})(${b1})·${cov} = ${f(ans)}.`,
      };
    },
    () => {
      const sx = R.int(1, 6), sy = R.int(1, 6), rho = R.pick([-0.7, -0.4, 0.2, 0.5, 0.9]), cov = +(rho * sx * sy).toFixed(2);
      return {
        q: `Var(X) = ${sx * sx}, Var(Y) = ${sy * sy}, Cov(X,Y) = ${cov}. What is the correlation ρ(X,Y)?`,
        a: cov / (sx * sy),
        sol: `ρ = Cov/(σ<sub>X</sub>σ<sub>Y</sub>) = ${cov}/(${sx}·${sy}) = ${f(cov / (sx * sy))}. Watch out: you're given variances, so take square roots first.`,
      };
    },
    () => {
      const vals = [R.int(-5, 0), R.int(1, 4), R.int(5, 10)];
      const ps = R.pick([[0.2, 0.5, 0.3], [0.1, 0.6, 0.3], [0.25, 0.25, 0.5], [0.3, 0.4, 0.3]]);
      const m = vals.reduce((s, v, i) => s + v * ps[i], 0), m2 = vals.reduce((s, v, i) => s + v * v * ps[i], 0), a = m2 - m * m;
      return {
        q: `A trade pays ${vals.map((v, i) => `${v} with probability ${ps[i]}`).join(', ')}. What is the variance of the payoff?`,
        a,
        sol: `E[X] = ${f(m)}, E[X²] = ${f(m2)}. Var = E[X²] − (E[X])² = ${f(m2)} − ${f(m * m)} = ${f(a)}.`,
      };
    },
    () => {
      const vx = R.int(1, 9), vy = R.int(1, 9);
      return {
        q: `X and Y are independent with Var(X) = ${vx} and Var(Y) = ${vy}. What is Var(X − Y)?`,
        a: vx + vy,
        sol: `Var(X − Y) = Var(X) + Var(Y) − 2Cov = ${vx} + ${vy} − 0 = ${vx + vy}. Variances add even when you subtract, so a spread is riskier than either leg alone unless the legs are correlated.`,
      };
    },
  ];

  QT.gens.inference = [
    () => {
      const mu0 = R.int(20, 200), s = R.int(5, 30), n = R.pick([16, 25, 36, 49, 64, 100]);
      const xbar = +(mu0 + (R.float(-2.8, 2.8, 1) * s) / Math.sqrt(n)).toFixed(1), a = (xbar - mu0) / (s / Math.sqrt(n));
      return {
        q: `A process has known σ = ${s}. A sample of n = ${n} gives x̄ = ${xbar}. Compute the z-statistic for H₀: μ = ${mu0}.`,
        a,
        tol: { abs: 0.01, rel: 0.01 },
        sol: `z = (x̄ − μ₀)/(σ/√n) = (${xbar} − ${mu0})/(${s}/${Math.sqrt(n)}) = ${f(a)}. |z| > 1.96 rejects at 5% (two-sided).`,
      };
    },
    () => {
      const s = R.int(2, 40), n = R.pick([16, 25, 36, 64, 100, 400]), a = (1.96 * s) / Math.sqrt(n);
      return {
        q: `A sample of n = ${n} has standard deviation ${s}. Using z = 1.96, what is the half-width of the 95% confidence interval for the mean?`,
        a,
        sol: `Half-width = 1.96·s/√n = 1.96·${s}/${Math.sqrt(n)} = ${f(a)}. Quadrupling n only halves the width.`,
      };
    },
    () => {
      const z = R.pick([1, 1.5, 1.645, 1.96, 2, 2.5, 3]) * R.pick([1, -1]), a = 2 * (1 - M.normCdf(Math.abs(z)));
      return {
        q: `A test statistic is z = ${z}. What is the two-sided p-value?${PHI}`,
        a,
        tol: TABLE,
        sol: `p = 2·(1 − Φ(|z|)) = 2·(1 − ${f(M.normCdf(Math.abs(z)))}) ≈ ${f(a)}.`,
      };
    },
    () => {
      const s = R.int(5, 50), E = R.int(1, 5), raw = ((1.96 * s) / E) ** 2, a = Math.ceil(raw);
      return {
        q: `Returns have σ = ${s} bps. How many observations do you need so the 95% CI for the mean has half-width at most ${E} bps? (z = 1.96)`,
        a,
        tol: EXACT,
        sol: `Need 1.96σ/√n ≤ E ⇒ n ≥ (1.96·${s}/${E})² = ${f(raw)}, so n = ${a} (round up).`,
      };
    },
    () => {
      const p = R.pick([0.1, 0.2, 0.3, 0.45, 0.5, 0.55, 0.6]), n = R.pick([100, 400, 900, 2500]), a = Math.sqrt((p * (1 - p)) / n);
      return {
        q: `A signal predicted direction correctly in ${pct(p)} of n = ${n} trades. What is the standard error of that hit rate?`,
        a,
        sol: `SE = √(p(1−p)/n) = √(${p}·${+(1 - p).toFixed(2)}/${n}) ≈ ${f(a)}.`,
      };
    },
    () => {
      const sr = R.pick([0.5, 0.8, 1, 1.5, 2]), yrs = R.pick([1, 2, 3, 4, 5, 9]), a = sr * Math.sqrt(yrs);
      return {
        q: `A backtest shows an annualised Sharpe ratio of ${sr} over ${yrs} year${yrs > 1 ? 's' : ''}. Approximately what is the t-statistic that the true mean return is non-zero?`,
        a,
        sol: `t = mean/(σ/√N) = SR<sub>period</sub>·√N = SR<sub>annual</sub>·√years = ${sr}·√${yrs} ≈ ${f(a)}. Short backtests rarely prove anything, and testing many strategies makes it worse.`,
      };
    },
  ];

  QT.gens.regression = [
    () => {
      const sm = R.pick([0.15, 0.2, 0.25]), beta = R.pick([0.5, 0.8, 1.2, 1.5]), cov = +(beta * sm * sm).toFixed(4);
      return {
        q: `The market has annual volatility ${pct(sm)}. A stock's covariance with the market is ${cov}. What is the stock's beta?`,
        a: cov / (sm * sm),
        sol: `β = Cov(r<sub>s</sub>, r<sub>m</sub>)/Var(r<sub>m</sub>) = ${cov}/${f(sm * sm)} = ${f(cov / (sm * sm))}. This is exactly the OLS slope of stock returns on market returns.`,
      };
    },
    () => {
      const b = R.pick([-2, -1, 1, 2, 3]), c = R.int(0, 10), xs = [1, 2, 3, 4, 5], ys = xs.map((x) => c + b * x + R.int(-2, 2));
      const ybar = M.mean(ys), sxy = xs.reduce((s, x, i) => s + (x - 3) * (ys[i] - ybar), 0), a = sxy / 10;
      return {
        q: `Fit OLS y = α + βx to the points ${xs.map((x, i) => `(${x}, ${ys[i]})`).join(', ')}. What is β?`,
        a,
        sol: `x̄ = 3, ȳ = ${f(ybar)}. Σ(x−x̄)² = 10, Σ(x−x̄)(y−ȳ) = ${f(sxy)}. β = ${f(sxy)}/10 = ${f(a)}.`,
      };
    },
    () => {
      const rho = R.pick([-0.6, -0.3, 0.4, 0.5, 0.8]), sx = R.pick([1, 2, 4, 5]), sy = R.pick([1, 3, 6, 10]), a = (rho * sy) / sx;
      return {
        q: `ρ(X,Y) = ${rho}, σ<sub>X</sub> = ${sx}, σ<sub>Y</sub> = ${sy}. What is the OLS slope when regressing Y on X?`,
        a,
        sol: `β = ρ·σ<sub>Y</sub>/σ<sub>X</sub> = ${rho}·${sy}/${sx} = ${f(a)}.`,
      };
    },
    () => {
      const b = R.float(0.3, 1.5, 1), c = R.float(0.1, 0.9 / b, 2), a = b * c;
      return {
        q: `Regressing Y on X gives slope ${b}. Regressing X on Y gives slope ${c}. What is R² of either regression?`,
        a,
        sol: `The slopes are ρσ<sub>Y</sub>/σ<sub>X</sub> and ρσ<sub>X</sub>/σ<sub>Y</sub>, so their product is ρ² = R² = ${b}·${c} = ${f(a)}. The slopes are not reciprocals unless |ρ| = 1.`,
      };
    },
    () => {
      const xbar = R.float(-2, 5, 1), ybar = R.float(-5, 10, 1), b = R.float(-2, 3, 1), a = ybar - b * xbar;
      return {
        q: `In an OLS fit, x̄ = ${xbar}, ȳ = ${ybar}, and the slope is ${b}. What is the intercept?`,
        a,
        tol: { abs: 0.01, rel: 0.01 },
        sol: `The OLS line passes through (x̄, ȳ): α = ȳ − βx̄ = ${ybar} − (${b})(${xbar}) = ${f(a)}.`,
      };
    },
  ];

  QT.gens.finance = [
    () => {
      const mu = R.float(0.02, 0.1, 2), s = R.float(0.8, 2.5, 1), a = (mu / s) * Math.sqrt(252);
      return {
        q: `A strategy's daily returns have mean ${mu}% and standard deviation ${s}%. What is its annualised Sharpe ratio? (252 trading days, zero risk-free rate)`,
        a,
        sol: `The mean scales with T and σ with √T, so SR<sub>annual</sub> = (μ/σ)·√252 = (${mu}/${s})·15.87 ≈ ${f(a)}.`,
      };
    },
    () => {
      const w = R.pick([0.3, 0.4, 0.5, 0.6, 0.7]), s1 = R.pick([0.1, 0.15, 0.2]), s2 = R.pick([0.2, 0.25, 0.3, 0.4]), rho = R.pick([-0.5, 0, 0.3, 0.6]);
      const a = Math.sqrt(w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2);
      return {
        q: `Portfolio: ${pct(w)} in asset A (vol ${pct(s1)}), ${pct(1 - w)} in asset B (vol ${pct(s2)}), correlation ${rho}. What is the portfolio volatility? (decimal or %)`,
        a,
        sol: `σ<sub>p</sub>² = w²σ<sub>A</sub>² + (1−w)²σ<sub>B</sub>² + 2w(1−w)ρσ<sub>A</sub>σ<sub>B</sub> = ${f(a * a)}, so σ<sub>p</sub> ≈ ${f(a)} (${pct(a)}).`,
      };
    },
    () => {
      const p = R.pick([0.52, 0.55, 0.6, 0.65]), b = R.pick([1, 1.5, 2, 3]), a = p - (1 - p) / b;
      return {
        q: `A bet wins with probability ${p} and pays ${b}:1 (you lose your stake otherwise). What fraction of bankroll does the Kelly criterion stake?`,
        a,
        sol: `f* = p − q/b = ${p} − ${+(1 - p).toFixed(2)}/${b} = ${f(a)}. Traders often use "half Kelly": edge estimates are noisy, and over-betting is much worse than under-betting.`,
      };
    },
    () => {
      const rs = [R.int(-10, 15), R.int(-10, 15), R.int(-10, 15)], a = rs.reduce((p, r) => p * (1 + r / 100), 1) - 1;
      return {
        q: `A position returns ${rs.map((r) => `${r}%`).join(', ')} over three consecutive months. What is the total return? (decimal or %)`,
        a,
        sol: `Returns compound: ${rs.map((r) => `(${f(1 + r / 100)})`).join('·')} − 1 ≈ ${f(a)} (${pct(a)}), not the simple sum ${rs.reduce((s, r) => s + r, 0)}%. Log returns do add: Σ ln(1+r<sub>i</sub>) = ${f(Math.log(1 + a))}.`,
      };
    },
    () => {
      const d = R.float(0.5, 3, 1), a = (d / 100) * Math.sqrt(252);
      return {
        q: `A stock has daily volatility ${d}%. What is its annualised volatility? (252 trading days; decimal or %)`,
        a,
        sol: `σ<sub>annual</sub> = σ<sub>daily</sub>·√252 ≈ ${d}% × 15.87 = ${pct(a)}. Handy rule: divide annual vol by 16 to get daily.`,
      };
    },
    () => {
      const V = R.pick([1, 5, 10, 25]) * 1e6, s = R.pick([1, 1.5, 2, 3]), a = 1.645 * (s / 100) * V;
      return {
        q: `You hold a $${V / 1e6}m position with daily volatility ${s}%. Assuming normal returns with zero mean, what is the 1-day 95% VaR in dollars?`,
        a,
        sol: `VaR<sub>95</sub> = 1.645·σ·V = 1.645 × ${s / 100} × ${V.toLocaleString()} ≈ $${Math.round(a).toLocaleString()}. Real returns have fat tails, so normal VaR understates extreme losses.`,
      };
    },
    () => {
      const mu = R.pick([0.05, 0.08, 0.1, 0.15]), s = R.pick([0.1, 0.2, 0.3, 0.5, 0.6]), a = mu - (s * s) / 2;
      return {
        q: `An asset has expected arithmetic return ${pct(mu)} per year and volatility ${pct(s)}. Approximately what is its expected geometric (compound) growth rate? (decimal or %)`,
        a,
        tol: { abs: 0.001, rel: 0.02 },
        sol: `g ≈ μ − σ²/2 = ${mu} − ${f((s * s) / 2)} = ${f(a)}. This is "volatility drag": high vol eats compound growth even when the average return is positive. You can see it in the Stats lab.`,
      };
    },
  ];

  QT.gens.timeseries = [
    () => {
      const phi = R.pick([0.3, 0.5, 0.7, 0.9, -0.5]), se = R.int(1, 4), a = (se * se) / (1 - phi * phi);
      return {
        q: `X<sub>t</sub> = ${phi}·X<sub>t−1</sub> + ε<sub>t</sub>, where ε<sub>t</sub> is white noise with variance ${se * se}. What is the stationary variance of X?`,
        a,
        sol: `Var(X) = φ²Var(X) + σ<sub>ε</sub>² ⇒ Var(X) = σ<sub>ε</sub>²/(1 − φ²) = ${se * se}/${f(1 - phi * phi)} ≈ ${f(a)}.`,
      };
    },
    () => {
      const phi = R.pick([0.5, 0.8, 0.9, 0.95, 0.98]), a = Math.log(0.5) / Math.log(phi);
      return {
        q: `A spread follows an AR(1) with daily coefficient φ = ${phi}. What is its half-life of mean reversion in days?`,
        a,
        sol: `Deviations decay like φ<sup>h</sup>. Setting φ<sup>h</sup> = ½ gives h = ln(½)/ln(φ) = ${f(a)} days. This is a key number for sizing and holding stat-arb trades.`,
      };
    },
    () => {
      const mu = R.int(0, 20), phi = R.pick([0.5, 0.8, 0.9]), dev = R.pick([-8, -5, -3, 3, 5, 8]), x = mu + dev, h = R.int(1, 5);
      const a = mu + phi ** h * dev;
      return {
        q: `X<sub>t</sub> − ${mu} = ${phi}(X<sub>t−1</sub> − ${mu}) + ε<sub>t</sub>. Today X = ${x}. What is the forecast E[X<sub>t+${h}</sub>]?`,
        a,
        sol: `E[X<sub>t+h</sub>] = μ + φ<sup>h</sup>(X<sub>t</sub> − μ) = ${mu} + ${phi}<sup>${h}</sup>·(${dev}) = ${f(a)}.`,
      };
    },
    () => {
      const phi = R.pick([0.4, 0.6, 0.8, 0.9, -0.6]), k = R.int(2, 5), a = phi ** k;
      return {
        q: `For a stationary AR(1) with φ = ${phi}, what is the autocorrelation at lag ${k}?`,
        a,
        sol: `ρ(k) = φ<sup>k</sup> = ${phi}<sup>${k}</sup> ≈ ${f(a)}. The ACF decays geometrically while the PACF cuts off after lag 1, which is how you identify an AR(1).`,
      };
    },
    () => {
      const s = R.pick([0.5, 1, 1.5, 2]), n = R.pick([4, 9, 16, 25, 100]), a = s * Math.sqrt(n);
      return {
        q: `A price follows a random walk with daily change standard deviation $${s}. What is the standard deviation of the change over ${n} days?`,
        a,
        sol: `Independent increments mean variance scales with n, so σ<sub>${n}</sub> = ${s}·√${n} = ${f(a)}.`,
      };
    },
  ];
})();
