<!-- theo-content-v1. After editing, run: node tools/import-content.js -->

### 5.1 Track: statistics-regression

### q-stat-001
- **track:** statistics-regression
- **tags:** [regression, beta, correlation]
- **difficulty:** 1
- **time_target_s:** 60
- **answer_type:** numeric
- **prompt:** corr(X,Y) = 0.6, σ_Y = 20%, σ_X = 10%. What is the OLS slope when regressing Y on X?
- **hint_1:** β = Cov(X,Y)/Var(X).
- **hint_2:** Rewrite this as ρ·σ_Y/σ_X.
- **answer:** 1.2
- **answer_numeric:** 1.2
- **tolerance:** 0.001
- **solution:**
  β = ρ·σ_Y/σ_X = 0.6 × 20/10 = 1.2.

### q-stat-002
- **track:** statistics-regression
- **tags:** [regression, correlation, symmetry]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** Regressing Y on X gives slope 0.8. Regressing X on Y gives slope 0.45. What is corr(X,Y)?
- **hint_1:** Write both slopes in terms of ρ, σ_X and σ_Y.
- **hint_2:** Multiply the two slopes together.
- **answer:** 0.6
- **answer_numeric:** 0.6
- **tolerance:** 0.001
- **solution:**
  β_YX·β_XY = (ρσ_Y/σ_X)(ρσ_X/σ_Y) = ρ². So ρ² = 0.36 and ρ = 0.6. It is positive because both slopes are positive.
  Follow-up insight: the two regression lines are different lines unless |ρ| = 1.

### q-stat-003
- **track:** statistics-regression
- **tags:** [correlation-matrix, psd, bounds]
- **difficulty:** 3
- **time_target_s:** 150
- **answer_type:** numeric
- **prompt:** Three random variables all have the same pairwise correlation ρ. What is the smallest possible value of ρ?
- **hint_1:** Var(X+Y+Z) ≥ 0.
- **hint_2:** Use standardised variables. The variance of the sum is 3 + 6ρ.
- **answer:** -1/2
- **answer_numeric:** -0.5
- **tolerance:** 0.001
- **solution:**
  For standardised X, Y, Z: Var(X+Y+Z) = 3 + 6ρ ≥ 0, so ρ ≥ −1/2. In general, n equicorrelated variables need ρ ≥ −1/(n−1). (Equivalently, the correlation matrix must be positive semi-definite.)

### q-stat-004
- **track:** statistics-regression
- **tags:** [correlation-matrix, psd, bounds]
- **difficulty:** 4
- **time_target_s:** 180
- **answer_type:** numeric
- **prompt:** corr(X,Y) = 0.9 and corr(Y,Z) = 0.9. What is the minimum possible corr(X,Z)?
- **hint_1:** The 3×3 correlation matrix must have a non-negative determinant.
- **hint_2:** Bound: ρ_XZ ≥ ρ_XY·ρ_YZ − √((1−ρ_XY²)(1−ρ_YZ²)).
- **answer:** 0.62
- **answer_numeric:** 0.62
- **tolerance:** 0.005
- **solution:**
  ρ_XZ ≥ 0.81 − √(0.19 × 0.19) = 0.81 − 0.19 = 0.62.
  Intuition: in angle terms, each pair is cos⁻¹(0.9) ≈ 25.8° apart, so X and Z are at most 51.7° apart, and cos 51.7° ≈ 0.62.

### q-stat-005
- **track:** statistics-regression
- **tags:** [correlation, normal]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** X and Y are independent N(0,1). What is corr(X, X+Y)?
- **hint_1:** Cov(X, X+Y) = Var(X) + Cov(X,Y).
- **hint_2:** Var(X+Y) = 2.
- **answer:** 1/√2
- **answer_numeric:** 0.7071
- **tolerance:** 0.001
- **solution:**
  Cov = 1 and the SDs are 1 and √2, so ρ = 1/√2 ≈ 0.707.

### q-stat-006
- **track:** statistics-regression
- **tags:** [sharpe, annualisation]
- **difficulty:** 1
- **time_target_s:** 60
- **answer_type:** numeric
- **prompt:** A strategy averages 0.05% a day with a daily SD of 1%, and daily returns are independent. What is its annualised Sharpe ratio (252 trading days)? Ignore the risk-free rate.
- **hint_1:** The mean scales with T and the SD with √T.
- **hint_2:** Sharpe_annual = Sharpe_daily × √252.
- **answer:** ≈ 0.79
- **answer_numeric:** 0.794
- **tolerance:** 0.01
- **solution:**
  Daily Sharpe = 0.05/1 = 0.05, and × √252 ≈ 15.87 gives about 0.79.
  This assumes independent returns. Autocorrelation breaks the √T scaling.

### q-stat-007
- **track:** statistics-regression
- **tags:** [multiple-testing, false-discovery]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** You test 100 signals that are pure noise, each at the 5% significance level, independently. What is the probability that at least one looks significant?
- **hint_1:** Use the complement.
- **hint_2:** 0.95¹⁰⁰ ≈ e⁻⁵.
- **answer:** ≈ 99.4%
- **answer_numeric:** 0.994
- **tolerance:** 0.002
- **solution:**
  1 − 0.95¹⁰⁰ ≈ 1 − 0.0059 = 0.994. You'd expect about 5 false positives.
  Remedies: Bonferroni correction (α/n), a held-out test set, and a requirement for an economic rationale.

### q-stat-008
- **track:** statistics-regression
- **tags:** [r-squared, regression]
- **difficulty:** 1
- **time_target_s:** 45
- **answer_type:** numeric
- **prompt:** In a simple linear regression, corr(X,Y) = 0.3. What is R²?
- **hint_1:** For one regressor, R² = ρ².
- **hint_2:**
- **answer:** 0.09
- **answer_numeric:** 0.09
- **tolerance:** 0.001
- **solution:**
  R² = 0.3² = 0.09, so X explains 9% of the variance in Y. In finance this is often a meaningful signal, since daily return predictability is tiny.

### q-stat-009
- **track:** statistics-regression
- **tags:** [portfolio, diversification, variance]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** Two assets each have 20% volatility and a correlation of 0.5. What is the volatility of a 50/50 portfolio?
- **hint_1:** Var = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂.
- **hint_2:** Each term works out to 0.01.
- **answer:** ≈ 17.3%
- **answer_numeric:** 0.1732
- **tolerance:** 0.002
- **solution:**
  Var = 0.25(0.04) + 0.25(0.04) + 2(0.25)(0.5)(0.04) = 0.03, and √0.03 ≈ 17.3%.

### q-stat-010
- **track:** statistics-regression
- **tags:** [standard-error, clt]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** Daily returns have an SD of 1%. Over one year (252 days), what is the standard error of the estimated mean daily return, in %?
- **hint_1:** SE = σ/√n.
- **hint_2:** √252 ≈ 15.87.
- **answer:** ≈ 0.063%
- **answer_numeric:** 0.063
- **tolerance:** 0.001
- **solution:**
  1%/15.87 ≈ 0.063%. That's larger than a typical edge of around 0.05% a day, which is why a year of data rarely proves anything.

### q-stat-011
- **track:** statistics-regression
- **tags:** [multicollinearity, regression]
- **difficulty:** 2
- **time_target_s:** 120
- **answer_type:** conceptual
- **prompt:** You add a feature that is an exact copy of an existing feature to an OLS regression. What happens to the coefficients, the fit, and the predictions?
- **hint_1:** Think about whether XᵀX can be inverted.
- **hint_2:** Can the coefficients be uniquely determined?
- **answer:** Coefficients become unidentified; fit and predictions are unchanged
- **answer_numeric:**
- **tolerance:**
- **solution:**
  XᵀX becomes singular, so OLS has no unique solution. Any split β₁ + β₂ = β_original fits equally well. R² and predictions are unchanged. With near-duplicates, the coefficients have huge variance and swing in sign. Fixes: drop one feature, combine them, or use ridge regularisation.

### q-stat-012
- **track:** statistics-regression
- **tags:** [pca, factors, equities]
- **difficulty:** 2
- **time_target_s:** 120
- **answer_type:** conceptual
- **prompt:** You run PCA on the daily returns of 500 stocks. What does the first principal component usually represent, and why?
- **hint_1:** PCA finds the direction of maximum variance.
- **hint_2:** What drives most stocks at the same time?
- **answer:** The market factor
- **answer_numeric:**
- **tolerance:**
- **solution:**
  PC1 is roughly an equal-sign weighting of all stocks, which is the market, because the common market move is the largest shared source of variance. Later components often match sectors or styles. Stat-arb uses this by trading the residuals after removing the top components.

### 5.2 Track: equity-quant

### q-eq-001
- **track:** equity-quant
- **tags:** [backtesting, overfitting, scepticism]
- **difficulty:** 3
- **time_target_s:** 180
- **answer_type:** conceptual
- **prompt:** A colleague shows you a backtest of a daily equity strategy with an annualised Sharpe ratio of 3. What do you check before believing it?
- **hint_1:** Think about data problems, then costs, then statistics.
- **hint_2:** Look-ahead, survivorship, costs, overfitting, capacity, crowding.
- **answer:** Look-ahead, survivorship, costs, overfitting, capacity, crowding, regime
- **answer_numeric:**
- **tolerance:**
- **solution:**
  1. **Look-ahead bias:** was any data used before it was actually available (closing prices used at the close, restated fundamentals)?
  2. **Survivorship bias:** does the stock universe include companies that were later delisted?
  3. **Costs:** spread, market impact and borrow costs for shorts. Many high-Sharpe strategies are really high-turnover strategies.
  4. **Overfitting:** how many variants were tried? Is there out-of-sample or walk-forward evidence?
  5. **Capacity:** does it still work at realistic size?
  6. **Crowding/regime:** is it a known factor exposure that can unwind sharply?
  7. **Economic rationale:** why should the edge exist, and who is on the other side?

### q-eq-002
- **track:** equity-quant
- **tags:** [signals, momentum, mean-reversion]
- **difficulty:** 1
- **time_target_s:** 90
- **answer_type:** conceptual
- **prompt:** Explain the difference between momentum and short-term reversal in equities, and the typical horizon of each.
- **hint_1:** One says trends persist, the other says moves overshoot.
- **hint_2:** Classic momentum uses about 12 months of returns and skips the most recent month.
- **answer:** Momentum ≈ 3–12 months persists; reversal ≈ days–1 month reverts
- **answer_numeric:**
- **tolerance:**
- **solution:**
  **Momentum:** stocks with strong 3–12 month returns tend to keep outperforming (classically 12-month returns skipping the last month). Explanations: underreaction and slow diffusion of information.
  **Short-term reversal:** last week's or month's winners tend to underperform briefly. Explanations: liquidity provision and overreaction.
  The skipped month in the momentum signal exists to avoid the reversal effect.

### q-eq-003
- **track:** equity-quant
- **tags:** [hedging, beta, neutrality]
- **difficulty:** 1
- **time_target_s:** 60
- **answer_type:** numeric
- **prompt:** You are long $10m of a stock with β = 1.5 to the index. How much index exposure must you short to be beta-neutral, in $m?
- **hint_1:** Beta exposure = position × β.
- **hint_2:**
- **answer:** $15m
- **answer_numeric:** 15
- **tolerance:** 0.01
- **solution:**
  $10m × 1.5 = $15m of index exposure, so short $15m of index futures. What's left is the stock-specific (idiosyncratic) return, plus any sector or style exposure you haven't hedged.

### q-eq-004
- **track:** equity-quant
- **tags:** [market-impact, square-root-law, costs]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** Under the square-root impact model, trading 1% of a stock's daily volume costs 10 bps of impact. How much impact, in bps, does trading 4% of daily volume cost?
- **hint_1:** Impact ∝ σ·√(Q/V).
- **hint_2:** Four times the size gives √4 times the impact.
- **answer:** 20 bps
- **answer_numeric:** 20
- **tolerance:** 0.01
- **solution:**
  10 × √4 = 20 bps. Total cost (impact × size) therefore grows like Q^1.5, so doubling a strategy's size more than doubles its costs. This is the root of capacity limits.

### q-eq-005
- **track:** equity-quant
- **tags:** [turnover, costs, net-alpha]
- **difficulty:** 2
- **time_target_s:** 90
- **answer_type:** numeric
- **prompt:** A strategy has 20% annual gross alpha. It trades 50× its book value a year at an all-in cost of 10 bps per unit traded. What is its net annual alpha, in %?
- **hint_1:** Annual cost = turnover × cost per unit.
- **hint_2:** 50 × 0.10% = ?
- **answer:** 15%
- **answer_numeric:** 15
- **tolerance:** 0.01
- **solution:**
  Cost = 50 × 0.10% = 5% a year, so net = 20% − 5% = 15%. If costs doubled to 20 bps, net alpha would fall from 15% to 10%. Execution quality is therefore a direct source of alpha, which is a core reason this desk exists.

### q-eq-006
- **track:** equity-quant
- **tags:** [neutrality, risk, factors]
- **difficulty:** 2
- **time_target_s:** 120
- **answer_type:** conceptual
- **prompt:** Why would a systematic equity strategy be built to be beta-neutral and sector-neutral?
- **hint_1:** What return are you actually trying to capture?
- **hint_2:** What happens to an unhedged long-tech, short-energy book in a sector rotation?
- **answer:** To isolate the signal from unrewarded common-factor risk
- **answer_numeric:**
- **tolerance:**
- **solution:**
  The goal is to earn the **signal's** return, not market or sector moves. Unhedged exposure adds large variance with no expected return from your model, which lowers the Sharpe ratio. It also creates concentrated risks (a sector rotation can wipe out months of alpha). Neutralising also makes performance attribution clean.

### q-eq-007
- **track:** equity-quant
- **tags:** [crowding, semi-systematic, judgement]
- **difficulty:** 3
- **time_target_s:** 150
- **answer_type:** conceptual
- **prompt:** What can a semi-systematic trader add that a fully systematic strategy can't? Give a concrete example.
- **hint_1:** What information does the model not have?
- **hint_2:** Crowding, events, regime changes, execution.
- **answer:** Judgement on regime, crowding, events and execution
- **answer_numeric:**
- **tolerance:**
- **solution:**
  Models learn from historical data, so they're weakest when conditions change. A trader can:
  - **reduce exposure** to a crowded factor before an unwind (e.g. a sharp reversal in momentum and quant long-short positioning)
  - **avoid events** the model doesn't understand (M&A, earnings, index rebalances, regulatory news)
  - **improve execution** by timing trades and choosing venues and algorithms
  - **decide sizing** using real-time context on risk.
  The trade-off is that discretion can bring back bias, so the trader's overrides must be measured too.

### 5.3 Track: python-drills (code-task)

### q-py-001
- **track:** python-drills
- **tags:** [pandas, returns, volatility]
- **difficulty:** 1
- **time_target_s:** 300
- **answer_type:** code-task
- **prompt:** Write `ann_vol(prices: pd.Series) -> float` that returns the annualised volatility of daily simple returns (252 days, sample SD).
- **hint_1:** `prices.pct_change().dropna()`
- **hint_2:** Multiply the SD by `np.sqrt(252)`.
- **answer:** `prices.pct_change().dropna().std() * np.sqrt(252)`
- **tests:** prices = [100, 101, 99, 102, 103] → compare with the reference implementation, tolerance 1e-9
- **solution:**
  ```python
  import numpy as np, pandas as pd
  def ann_vol(prices: pd.Series) -> float:
      r = prices.pct_change().dropna()
      return r.std(ddof=1) * np.sqrt(252)
  ```

### q-py-002
- **track:** python-drills
- **tags:** [backtest, lookahead, pandas]
- **difficulty:** 2
- **time_target_s:** 600
- **answer_type:** code-task
- **prompt:** Given daily `prices`, go long 1 unit when the 5-day moving average is above the 20-day moving average, and stay flat otherwise. Return the series of daily strategy returns **without look-ahead bias**.
- **hint_1:** A signal computed from today's close can only earn tomorrow's return.
- **hint_2:** `.shift(1)` the position.
- **answer:** position = (ma5 > ma20).astype(int).shift(1); strat = position * returns
- **tests:** synthetic random-walk prices (seed 0, 300 days) → compare with the reference; also assert that the first 20 values are 0 or NaN
- **solution:**
  ```python
  def ma_cross_returns(prices: pd.Series) -> pd.Series:
      r = prices.pct_change()
      signal = (prices.rolling(5).mean() > prices.rolling(20).mean()).astype(int)
      position = signal.shift(1)          # trade on the next bar, so no look-ahead
      return (position * r).fillna(0.0)
  ```
  Common bug: forgetting `.shift(1)`, which makes the strategy use information from the same day it trades.

### q-py-003
- **track:** python-drills
- **tags:** [numpy, correlation, rolling]
- **difficulty:** 2
- **time_target_s:** 300
- **answer_type:** code-task
- **prompt:** Given two price series `a` and `b`, return their 60-day rolling correlation of daily returns.
- **hint_1:** Convert to returns first. Correlating prices gives misleading results.
- **hint_2:** `ra.rolling(60).corr(rb)`
- **answer:** `a.pct_change().rolling(60).corr(b.pct_change())`
- **tests:** two correlated synthetic series (seed 1) → compare with the reference, tolerance 1e-9
- **solution:**
  ```python
  def rolling_corr(a: pd.Series, b: pd.Series, w: int = 60) -> pd.Series:
      return a.pct_change().rolling(w).corr(b.pct_change())
  ```
  Interview point: two prices that both trend upwards look highly correlated even when their returns are unrelated (spurious correlation from non-stationary series).

### 5.4 Track: project deep-dive (behavioural)

### q-proj-001
- **track:** behavioural
- **tags:** [project-deep-dive, poker, bayesian]
- **difficulty:** 3
- **time_target_s:** 180
- **answer_type:** conceptual
- **prompt:** Walk me through your poker opponent-modelling project. How does the model update its beliefs, and how do you decide how much to exploit those beliefs?
- **hint_1:** Prior → observation → posterior → action.
- **hint_2:** Exploitation vs exploitability, with the equilibrium as the baseline.
- **answer:** Self-graded against the structure below
- **answer_numeric:**
- **tolerance:**
- **solution:**
  Structure: the problem (cold-start modelling in heads-up restricted-action NLHE) → the prior and its justification → the update rule per observed action → how confidence drives the deviation from equilibrium → the tournament comparison (round-robin vs Swiss) → one result → one mistake fixed.
  Trading link: the posterior's confidence sets the bet size, like the strength of a signal setting position size. Over-exploiting a weak read is like over-sizing a noisy signal.

### q-proj-002
- **track:** behavioural
- **tags:** [why-role, semi-systematic]
- **difficulty:** 2
- **time_target_s:** 120
- **answer_type:** conceptual
- **prompt:** You applied to Investment & Trading. Why does a semi-systematic equities role suit you?
- **hint_1:** Link your CS and quantitative skills to the systematic side, and your decision-making to the discretionary side.
- **hint_2:**
- **answer:** Self-graded
- **answer_numeric:**
- **tolerance:**
- **solution:**
  Structure: the systematic side matches the CS, statistics and modelling skills you've shown → the discretionary side matches decision-making under uncertainty (poker, real-time leadership) → genuine interest in where models fail and judgement adds value (see q-eq-007).
