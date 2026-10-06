// Topic catalogue: ties each generator set to a track, a name and a short formula sheet.
(function () {
  const G = QT.gens;
  QT.topics = [
    {
      id: 'dice', track: 'interview', name: 'Dice & coins', blurb: 'Counting outcomes, complements, binomials.', gens: G.dice,
      notes: `<ul><li>Complement for "at least one": 1 − P(none).</li><li>Sum of two dice: P(k) = (6 − |k − 7|)/36.</li><li>One die: mean 3.5, variance 35/12.</li><li>Binomial: P(k) = C(n,k)p<sup>k</sup>(1−p)<sup>n−k</sup>.</li></ul>`,
    },
    {
      id: 'cards', track: 'interview', name: 'Cards & combinatorics', blurb: 'Hands, arrangements, birthday problems.', gens: G.cards,
      notes: `<ul><li>Unordered selection: C(n,k). Arrangements with repeats: n!/(n₁!n₂!…).</li><li>Count sequentially (12/51 · 11/50…) or with combinations, and use one to check the other.</li><li>Birthday: P(no match) ≈ exp(−n²/2d).</li></ul>`,
    },
    {
      id: 'bayes', track: 'interview', name: 'Conditional & Bayes', blurb: 'Updating beliefs from evidence.', gens: G.bayes,
      notes: `<ul><li>Posterior odds = prior odds × likelihood ratio.</li><li>Conditioning shrinks the sample space, so recount inside it.</li><li>Base rates dominate when evidence is weak.</li></ul>`,
    },
    {
      id: 'ev', track: 'interview', name: 'Expected value & games', blurb: 'Linearity, optimal stopping, fair prices.', gens: G.ev,
      notes: `<ul><li>Linearity of expectation works even with dependence; use indicator variables.</li><li>Tail sum: E[X] = Σ P(X ≥ k) for non-negative integer X.</li><li>Games with choices: solve backwards from the last decision.</li><li>A geometric waiting time with success probability p has mean 1/p.</li></ul>`,
    },
    {
      id: 'walks', track: 'interview', name: 'Random walks & martingales', blurb: "Gambler's ruin, optional stopping.", gens: G.walks,
      notes: `<ul><li>Fair game ⇒ martingale ⇒ E[stopped value] = start value.</li><li>Fair ruin: P(hit N before 0 | start i) = i/N, with expected duration i(N−i).</li><li>Biased: P = (1 − r<sup>i</sup>)/(1 − r<sup>N</sup>) with r = q/p.</li></ul>`,
    },
    {
      id: 'markov', track: 'interview', name: 'Markov chains & order statistics', blurb: 'Hitting times, stationary states, branching, order statistics.', gens: G.markov,
      notes: `<ul><li>Hitting times: write E<sub>state</sub> = 1 + Σ P(next)·E<sub>next</sub> for each state and solve; group symmetric states first.</li><li>Stationary distribution: balance the flows (π<sub>A</sub>·P(A→B) = π<sub>B</sub>·P(B→A) for two states); return time = 1/π.</li><li>Branching: extinction q solves q = G(q), the offspring generating function; take the smallest root in [0, 1].</li><li>k-th smallest of n uniforms has mean k/(n + 1).</li></ul>`,
    },
    {
      id: 'options', track: 'interview', name: 'Options', blurb: 'Parity, quick pricing, deltas.', gens: G.options,
      notes: `<ul><li>Put–call parity (r = 0): C − P = S − K.</li><li>ATM call ≈ 0.4·σ·S·√T; ATM straddle ≈ 0.8·σ·S·√T.</li><li>One-step binomial: q = (S₀ − S<sub>d</sub>)/(S<sub>u</sub> − S<sub>d</sub>), price = E<sub>q</sub>[payoff].</li><li>Delta-hedge: hold −Δ shares per option (×100 per contract).</li></ul>`,
    },
    {
      id: 'puzzles', track: 'interview', name: 'Classic brainteasers', blurb: 'Monty Hall, coin patterns, symmetry.', gens: G.puzzles,
      notes: `<ul><li>Look for symmetry before you calculate.</li><li>Coin patterns: E[wait] = Σ 2<sup>k</sup> over self-overlaps k.</li><li>K special cards among N: E[position of first] = (N+1)/(K+1).</li><li>Say your reasoning out loud; interviewers score the process.</li></ul>`,
    },
    {
      id: 'sequences', track: 'interview', name: 'Number sequences', blurb: 'Next-term puzzles, as in Optiver and Maven screens.', gens: G.sequences,
      notes: `<ul><li>First try differences; if they change, take second differences.</li><li>No pattern in differences? Try ratios (geometric, ×k ± c).</li><li>Check alternate terms for two interleaved sequences.</li><li>Recognise squares, cubes and Fibonacci instantly.</li></ul>`,
    },
    {
      id: 'dist', track: 'foundations', name: 'Distributions', blurb: 'Normal, Poisson, exponential, binomial.', gens: G.dist,
      notes: `<ul><li>Standardise: z = (x − μ)/σ.</li><li>Poisson(λ): mean = var = λ.</li><li>Exponential(λ): mean 1/λ, memoryless.</li><li>Uniform(a,b): var (b−a)²/12.</li></ul>`,
    },
    {
      id: 'moments', track: 'foundations', name: 'Variance & covariance', blurb: 'The algebra behind risk.', gens: G.moments,
      notes: `<ul><li>Var(X) = E[X²] − E[X]².</li><li>Var(aX + bY) = a²Var X + b²Var Y + 2ab Cov(X,Y).</li><li>ρ = Cov/(σ<sub>X</sub>σ<sub>Y</sub>).</li></ul>`,
    },
    {
      id: 'inference', track: 'foundations', name: 'Estimation & testing', blurb: 'z-tests, CIs, p-values, sample size.', gens: G.inference,
      notes: `<ul><li>SE of the mean: σ/√n. 95% CI: x̄ ± 1.96·SE.</li><li>p-value: probability of data at least this extreme if H₀ is true. It is <i>not</i> P(H₀ true).</li><li>Sharpe t-stat ≈ SR<sub>annual</sub>·√years.</li></ul>`,
    },
    {
      id: 'regression', track: 'foundations', name: 'Regression & correlation', blurb: 'OLS, beta, R².', gens: G.regression,
      notes: `<ul><li>β = Cov(X,Y)/Var(X) = ρσ<sub>Y</sub>/σ<sub>X</sub>.</li><li>α = ȳ − βx̄.</li><li>Simple regression: R² = ρ².</li></ul>`,
    },
    {
      id: 'finance', track: 'foundations', name: 'Returns, risk & sizing', blurb: 'Sharpe, vol, VaR, Kelly.', gens: G.finance,
      notes: `<ul><li>The mean scales with T, volatility with √T; √252 ≈ 15.87.</li><li>Kelly: f* = p − q/b.</li><li>Geometric growth ≈ μ − σ²/2.</li><li>Normal VaR<sub>95</sub> = 1.645σ.</li></ul>`,
    },
    {
      id: 'timeseries', track: 'foundations', name: 'Time series', blurb: 'AR(1), mean reversion, random walks.', gens: G.timeseries,
      notes: `<ul><li>AR(1): Var = σ<sub>ε</sub>²/(1−φ²), ACF ρ(k) = φ<sup>k</sup>.</li><li>Half-life = ln(½)/ln φ.</li><li>Random walk: variance grows linearly with time.</li></ul>`,
    },
  ];

  // One named skill per generator (same order as `gens`), so the coach can pinpoint
  // exactly which technique is weak rather than just the topic.
  const SKILLS = {
    dice: ['Two-dice sums', 'Complement rule', 'Binomial counts', 'Three-dice tails', 'Variance of sums'],
    cards: ['Same-suit hands', 'At least one ace', 'Arrangements with repeats', 'Birthday problem', 'Committees with a chair'],
    bayes: ['Base rates (medical test)', 'Odds-form Bayes', 'Conditioning on "at least one"', 'Conditioning on dice sums', 'Two-urn Bayes'],
    ev: ['Reroll games (backward induction)', 'Expected maximum (tail sum)', 'Coupon collector', 'Indicator variables', 'Runs of heads', 'Convex payoffs', 'Broken stick'],
    walks: ["Fair gambler's ruin", 'Expected ruin duration', "Biased gambler's ruin", 'Return to origin'],
    markov: ['Hitting time on a cycle', 'Runs (waiting for k in a row)', 'Two-state stationary distribution', 'Order statistics of uniforms', 'Branching-process extinction'],
    options: ['Put–call parity', 'ATM rule of thumb', 'Implied vol from a straddle', 'One-step binomial pricing', 'Calls on dice', 'Delta hedging'],
    puzzles: ['Monty Hall (n doors)', 'Coin-pattern waiting times', 'First special card', 'Points in a semicircle', 'Uniform sums', 'Airplane seat', 'Broken-stick triangle'],
    sequences: ['Arithmetic', 'Geometric', 'Squares ± c', 'Fibonacci-style', 'Second differences', 'Interleaved sequences', 'Multiply-and-add', 'Cubes'],
    dist: ['Normal tails', 'Poisson probabilities', 'Exponential memorylessness', 'Uniform variance', 'Binomial "at most one"'],
    moments: ['Var(aX + bY)', 'Correlation from covariance', 'Discrete variance', 'Var(X − Y) for independents'],
    inference: ['z-statistic', 'Confidence-interval width', 'Two-sided p-value', 'Sample size', 'SE of a proportion', 'Sharpe t-statistic'],
    regression: ['Beta from covariance', 'OLS slope by hand', 'Slope from correlation', 'R² from two slopes', 'Intercept through the means'],
    finance: ['Annualised Sharpe', 'Two-asset portfolio vol', 'Kelly fraction', 'Compounding returns', 'Annualising volatility', 'Normal VaR', 'Volatility drag'],
    timeseries: ['AR(1) variance', 'Mean-reversion half-life', 'AR(1) forecast', 'AR(1) autocorrelation', 'Random-walk scaling'],
  };
  // Seconds a confident answer should take, used to flag skills that are right but slow.
  const TARGET = { sequences: 20, dice: 60, cards: 60, puzzles: 75 };
  QT.topics.forEach((t) => {
    t.skills = SKILLS[t.id];
    t.target = TARGET[t.id] || 90;
  });

  QT.topicById = (id) => QT.topics.find((t) => t.id === id);
})();
