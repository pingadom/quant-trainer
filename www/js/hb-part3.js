// Handbook, Part 3: Statistics. See handbook-content.js for how chapters are structured.
(function () {
  const Fig = QT.hbFig, N = Fig.normal();

  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    clt: {
      title: 'The law of large numbers and the CLT', minutes: 45,
      why: 'Why can a casino be certain of its profits while each spin is uncertain? Why does a backtest need years of data? Both answers are in this chapter, and it\'s the bridge from probability to statistics.',
      goals: ['State what the law of large numbers does and doesn\'t say', 'Apply the central limit theorem to sums and averages', 'Compute a standard error and size a sample', 'Know when the CLT fails'],
      prereq: ['variance', 'distributions'],
      sections: [
        { h: 'The law of large numbers', blocks: [
          `<p>Average n independent draws with mean μ. As n grows, the average settles on μ. That's the <b>law of large numbers</b>, and it's why the long-run average is the right way to read E[X].</p>`,
          { proof: 'The average has variance σ²/n. Chebyshev\'s inequality says P(|X − μ| ≥ kσ) ≤ 1/k² for any distribution. So P(|average − μ| ≥ ε) ≤ σ²/(nε²), which goes to 0 as n grows.', title: 'Why it\'s true' },
          { trap: 'There\'s no "law of averages" pushing things back. After 10 heads in a row, the next 1,000 flips are still fair: the early surplus isn\'t corrected, it\'s swamped. The average returns to ½ only because the denominator grows.' },
          { id: 'm1', q: 'After 100 flips you have 60 heads. What do you expect after 1,100 flips?', opts: [['About 560 heads'], ['About 550 heads: the surplus is corrected', 'Nothing corrects it. The future flips don\'t know about it.'], ['About 660 heads: the 60% continues', 'A fair coin doesn\'t keep a trend.'], ['It can\'t be said', 'Linearity gives an exact expected value.']], sol: '60 + 500 = 560. The count stays 10 ahead of half, on average, while the proportion falls towards ½.' },
        ] },
        { h: 'The central limit theorem', blocks: [
          `<p>The law of large numbers says where the average ends up. The <b>central limit theorem</b> says how it's spread on the way there. For independent draws with mean μ and finite variance σ²:</p>
           <div class="hb-eq">average of n ≈ Normal(μ, σ²/n) &nbsp;&nbsp; total of n ≈ Normal(nμ, nσ²)</div>
           <p>The amazing part is that it doesn't matter what you started from.</p>`,
          { widget: 'clt', predict: { q: 'Take a skewed distribution: mostly small values, occasionally large. Average 30 draws. What shape are the averages?', opts: ['Close to a symmetric bell', 'Still clearly skewed', 'Roughly flat'], then: 'Try each distribution, and slide n from 1 up to 100.' } },
          { idea: 'Add up enough independent small effects and you get a normal. Only two numbers survive from the original distribution: its mean and its variance. The rest of its shape is forgotten.' },
        ] },
        { h: 'Standard errors', blocks: [
          `<p>The standard deviation of an estimate is its <b>standard error</b>. For an average, SE = σ/√n. It's the key number in all of statistics: to judge any estimate, ask how large it is compared with its standard error.</p>`,
          { worked: 'a total of many dice', q: 'What is the probability that 100 dice total more than 384?', steps: [
            ['What are the mean and sd of one die?', '3.5, and √(35/12) ≈ 1.71.'],
            ['So what about the total of 100?', 'Mean 350, sd 1.71 × 10 = 17.1.'],
            ['How many sds above the mean is 384?', '(384 − 350)/17.1 ≈ 2.'],
            'Normal tail above 2σ: about <b>2.3%</b>.',
          ] },
          { q: 'Now you do one: roughly what is the probability that 100 dice total more than 367? (P(Z &lt; 1) ≈ 0.84.)', a: 0.15866, tol: { abs: 0.01 }, hint: '367 is one sd above the mean.', sol: 'z = 1, so about <b>0.16</b>.' },
          { q: 'A signal\'s daily returns have sd 2%. Over 400 days, what is the standard error of its average daily return, in percent?', a: 0.1, hint: 'σ/√n.', sol: '2/20 = <b>0.1</b>%.' },
          { market: 'A strategy that averages 0.05% a day with 1% daily sd has a standard error of 0.063% over one year. Its mean is smaller than its own error bar. That\'s why one good year proves nothing.' },
        ] },
        { h: 'Counts and proportions', blocks: [
          `<p>A count of successes is a sum of 0/1 variables, so the CLT applies: heads in n flips is about Normal(np, np(1 − p)). A proportion has SE = √(p(1 − p)/n), which is at most 0.5/√n.</p>`,
          { fig: 'plot', x: [4800, 5200], y: [0, 0.0085], xl: 'heads in 10,000 flips', xt: [[4900, '4,900'], [5000, '5,000'], [5100, '5,100']], fns: [{ f: Fig.normal(5000, 50), tone: 'ink' }], area: [{ f: Fig.normal(5000, 50), from: 4900, to: 5100 }], alt: 'A bell curve centred on 5,000 heads, with plus or minus 2 standard deviations shaded.', cap: 'The sd is √(10,000 × ¼) = 50, so about 95% of runs land between 4,900 and 5,100.' },
          { q: '10,000 fair flips. What half-width around 5,000 contains about 95% of outcomes?', a: 100, hint: '2 standard deviations, with sd = √(npq).', sol: '2 × 50 = <b>100</b>.' },
          { q: 'You want to estimate a proportion near ½ to within ±1% at about 95% confidence. How many samples do you need? Use 2 standard errors.', a: 10000, tol: { rel: 0.02 }, hint: 'Set 2 × 0.5/√n = 0.01.', sol: '√n = 100, so <b>n = 10,000</b>.' },
        ] },
        { h: 'When it fails', blocks: [
          `<p>The CLT needs independence (or weak dependence) and finite variance. Markets bend both. Returns cluster, so the effective sample is smaller than it looks. And fat tails mean a handful of days can dominate a sum, so averages converge slowly.</p>`,
          { fig: 'plot', x: [-6, 6], y: [0, 0.42], xt: [-4, -2, 0, 2, 4], fns: [{ f: N, tone: 'ink' }, { f: (x) => 1 / (Math.PI * (1 + x * x)), tone: 'bad', dash: true }], labels: [{ x: 2.2, y: 0.3, t: 'normal' }, { x: 1.75, y: 0.1, t: 'Cauchy: no variance', tone: 'bad' }], alt: 'The normal curve and the much fatter-tailed Cauchy curve.', cap: 'The average of Cauchy draws is just as spread out as one draw: more data doesn\'t help at all. Real returns lie between the two.' },
          { id: 'm2', q: 'You have 10 years of daily returns on 1,000 stocks. Why is that not 2.5 million independent observations?', opts: [['Stocks move together each day'], ['Weekends are missing', 'That\'s a detail, not the main issue.'], ['Daily returns can\'t be averaged', 'They can.'], ['The CLT needs fewer than 1 million points', 'The CLT has no maximum.']], sol: 'One market move affects every stock on the same day. The effective number of independent observations is closer to the number of days, times a modest factor for the independent parts.' },
        ] },
      ],
      takeaways: ['LLN: the average settles on μ. Surpluses are swamped, not corrected.', 'CLT: sums and averages are approximately normal, whatever you started from.', 'Standard error of a mean: σ/√n.', 'Heads in n flips: mean n/2, sd √n/2.', 'Fat tails and dependence slow everything down.'],
      explain: { q: 'What\'s the difference between the law of large numbers and the central limit theorem?', a: 'The LLN says the average converges to the mean: it gives the destination. The CLT describes the error on the way: the average minus the mean, scaled up by √n, looks normal. So the LLN says the error shrinks to zero, and the CLT says how fast and with what shape.' },
      homework: [
        { lvl: 'core', q: 'What is the standard deviation of the total of 36 dice?', a: Math.sqrt(36 * 35 / 12), tol: { abs: 0.02 }, hint: 'σ√n.', sol: '√105 ≈ <b>10.25</b>.' },
        { lvl: 'core', q: '400 fair flips. Roughly what is P(at least 220 heads)?', a: 0.0228, tol: { abs: 0.003 }, hint: 'sd 10, so that\'s z = 2.', sol: 'P(Z ≥ 2) ≈ <b>0.023</b>.' },
        { lvl: 'core', q: 'Observations have sd 10. What is the standard error of the mean of 25 of them?', a: 2, hint: '10/√25.', sol: '<b>2</b>.' },
        { lvl: 'core', q: 'A sample of 100 gives a standard error of 2. How many observations give a standard error of 1?', a: 400, hint: 'Halving the error takes four times the data.', sol: '<b>400</b>.' },
        { lvl: 'interview', q: 'Each trade makes +0.01 on average, with sd 1. How many trades until the expected profit is 2 sds of the total?', a: 40000, tol: { rel: 0.01 }, hint: '0.01n = 2√n.', sol: '√n = 200, so <b>n = 40,000</b>.' },
        { lvl: 'interview', q: 'A strategy averages 0.05% a day with a daily sd of 1%. What is its annualised Sharpe ratio, using 252 days?', a: 0.05 * Math.sqrt(252), tol: { abs: 0.01 }, hint: 'Mean/sd × √252.', sol: '0.05 × 15.87 ≈ <b>0.79</b>.' },
        { lvl: 'stretch', q: 'Sketch why the CLT is true, using the moment generating function of a standardised sum.', sol: 'Let Y have mean 0 and variance 1. The MGF of (Y₁ + … + Yₙ)/√n is M(t/√n)ⁿ, and M(s) ≈ 1 + s²/2 for small s. So it\'s (1 + t²/(2n))ⁿ → e<sup>t²/2</sup>, the MGF of a standard normal. Only the mean and the variance appear: that\'s why the shape is forgotten.' },
        { lvl: 'lab', q: 'Roll 5 dice and record the average, 30 times. Plot a rough histogram on paper. What is its centre, and what spread do you predict?', sol: 'Centre 3.5, and sd 1.71/√5 ≈ 0.76. Even at n = 5 and 30 samples, a bell shape starts to appear.' },
      ],
      practice: [['Stats lab', '#/lab'], ['Inference topic', '#/topic/inference']],
    },

    estimation: {
      title: 'Estimation and confidence', minutes: 50,
      why: 'You never see a true win rate, true alpha or true opponent style. You only see data. Estimation is how to turn that data into a number, and how to say how much to trust it.',
      goals: ['Judge an estimator by its bias and variance', 'Find maximum likelihood estimates', 'Build and correctly interpret confidence intervals', 'Combine prior beliefs with data'],
      prereq: ['clt', 'toolkit'],
      sections: [
        { h: 'What makes an estimator good', blocks: [
          `<p>An <b>estimator</b> is a rule that turns data into a guess. It's a random variable, since a different sample gives a different guess. Two things can go wrong: it can be off on average (<b>bias</b>), or it can jump around (<b>variance</b>). Their combined cost is the mean squared error:</p>
           <div class="hb-eq">MSE = bias² + variance</div>`,
          { fig: 'plot', x: [-3, 5], y: [0, 0.85], xl: 'estimate', xt: [[0, 'truth']], fns: [{ f: Fig.normal(0, 1.4), tone: 'acc' }, { f: Fig.normal(1, 0.5), tone: 'bad' }], labels: [{ x: -2.9, y: 0.34, t: 'unbiased, noisy', tone: 'acc' }, { x: 1.6, y: 0.7, t: 'biased, steady', tone: 'bad' }], vlines: [{ x: 0, tone: 'ok' }], alt: 'Two estimator distributions: one centred on the truth but wide, the other narrow and off-centre.', cap: 'A slightly biased estimator can beat an unbiased one. That\'s the case for shrinkage, which you\'ll want for noisy signals.' },
          { q: 'An estimator has bias 0.1 and variance 0.02. What is its MSE?', a: 0.03, hint: 'bias² + variance.', sol: '0.01 + 0.02 = <b>0.03</b>.' },
          `<p>The usual variance estimate divides by n − 1, not n. Dividing by n would be biased low, as deviations are measured from the sample mean, which is closer to the data than the true mean is.</p>`,
          { q: 'If you divide by n instead of n − 1, your variance estimate is too low by the factor (n − 1)/n on average. What is that factor for n = 5?', a: 0.8, hint: '(n − 1)/n.', sol: '4/5 = <b>0.8</b>.' },
        ] },
        { h: 'Maximum likelihood', blocks: [
          `<p>A universal recipe: choose the parameter that makes your data most probable. Write the likelihood, take logs so products become sums, and set the derivative to zero.</p>`,
          { worked: 'a win rate', q: 'You win 7 of 10 trades. What is the maximum likelihood estimate of your win rate p?', steps: [
            ['Write the likelihood.', 'L(p) = C(10, 7) p⁷(1 − p)³.'],
            ['Take logs.', 'ℓ(p) = 7 ln p + 3 ln(1 − p) + a constant.'],
            ['Differentiate and set to zero.', '7/p − 3/(1 − p) = 0.'],
            'Solving gives p = 7/10, as you\'d expect. The recipe matters when the answer isn\'t obvious.',
          ] },
          { fig: 'plot', x: [0, 1], y: [0, 0.3], xl: 'p', yl: 'likelihood', xt: [0, 0.5, 0.7, 1], fns: [{ f: (p) => 120 * p ** 7 * (1 - p) ** 3 }], vlines: [{ x: 0.7, t: 'MLE', tone: 'ok', side: 'l' }], alt: 'Likelihood of p for 7 wins in 10, peaking at 0.7.', cap: 'The likelihood of p given 7 wins in 10. Notice how wide it is: 0.5 isn\'t ruled out at all.' },
          { q: 'You see 7 heads in 10 flips. What is the maximum likelihood estimate of P(heads)?', a: 0.7, hint: 'k/n.', sol: '<b>0.7</b>.' },
          { q: 'Trades per minute are Poisson. You observe 2, 4, 3 and 3. What is the maximum likelihood estimate of λ?', a: 3, hint: 'For a Poisson, the MLE is the sample mean.', sol: '12/4 = <b>3</b>.' },
          { worked: 'the German tank problem', q: 'Tanks are numbered 1 to N. You capture 5 at random, and the largest serial number is 60. What is your estimate of N?', steps: [
            ['What is the MLE?', 'N = 60: any larger N makes your sample less likely. But that\'s surely too low, since the maximum of a sample can\'t exceed N.'],
            ['Use equal gaps. How do 5 numbers split the range?', 'Into equal average gaps of about m/k = 60/5 = 12.'],
            'So add one average gap: N ≈ m(1 + 1/k) − 1 = 71.',
          ] },
          { q: 'You see 4 tanks, with a highest serial of 100. Using m(1 + 1/k) − 1, what is your estimate of N?', a: 124, tol: { abs: 0.5 }, hint: '100 × 1.25 − 1.', sol: '<b>124</b>.' },
        ] },
        { h: 'Confidence intervals', blocks: [
          `<p>A 95% confidence interval is estimate ± 1.96 standard errors. Its meaning is subtle. The true value is fixed. The <i>interval</i> is random, and 95% of intervals built this way catch the truth.</p>`,
          { widget: 'ci', predict: { q: 'With the 95% multiplier and small samples of 5, about how many of 40 intervals will miss the true mean?', opts: ['More than 2', 'About 2', 'None'], then: 'Try a sample size of 5, then 200, and press New samples a few times.' } },
          { idea: 'Small samples need a wider multiplier, because the standard deviation is estimated too. That\'s the t distribution. At n = 5 the 95% multiplier is 2.78, not 1.96.' },
          { q: 'A sample of 100 has standard deviation 20. What is the half-width of a 95% confidence interval for the mean? Use 1.96.', a: 3.92, tol: { abs: 0.05 }, hint: '1.96 × 20/√100.', sol: '1.96 × 2 = <b>3.92</b>.' },
          { id: 'm1', q: 'A 95% interval for a strategy\'s mean return is [0.1%, 0.5%]. Which statement is right?', opts: [['The procedure catches the truth 95% of the time'], ['There\'s a 95% chance that the mean lies in this interval', 'The mean isn\'t random in this framework. That would need a prior.'], ['95% of days have returns in this range', 'That\'s about the data, not the mean.'], ['If you repeat the test, 95% of new means fall inside', 'Close, but not quite.']], sol: 'It\'s a statement about the method, not this particular interval. For a true probability about the parameter, you need a Bayesian answer.' },
        ] },
        { h: 'Priors and shrinkage', blocks: [
          `<p>A Bayesian treats the unknown p as having a distribution. The handy case: start with a <b>Beta(a, b)</b> prior, which acts like a earlier wins and b earlier losses. Then k wins in n trials gives Beta(a + k, b + n − k), with mean (a + k)/(a + b + n).</p>`,
          { fig: 'plot', x: [0, 1], y: [0, 3.5], xl: 'win rate p', yl: 'density', xt: [0, 0.25, 0.5, 0.75, 1], yt: [1, 2, 3], fns: [{ f: () => 1, tone: 'muted', dash: true }, { f: (p) => 360 * p ** 2 * (1 - p) ** 7, tone: 'acc' }], labels: [{ x: 0.72, y: 1.15, t: 'flat prior' }, { x: 0.33, y: 2.9, t: 'after 2 wins in 9', tone: 'acc' }], alt: 'A flat prior, and a Beta posterior peaked near 0.22 after 2 wins in 9.', cap: 'Data turns a flat prior, Beta(1, 1), into a posterior, here Beta(3, 8). The more trials, the narrower it gets.' },
          { q: 'You start with a flat prior, Beta(1, 1), and win 8 of 10. What is your posterior mean for p?', a: 0.75, hint: '(1 + 8)/(2 + 10).', sol: '9/12 = <b>0.75</b>. The data alone says 0.8, and the prior pulls it towards ½.' },
          { market: 'Shrinkage is how to treat noisy estimates. When 100 analysts forecast returns, the best is partly lucky, so pull extreme estimates back towards the average. The same applies in opponent modelling: with few hands, stay close to the population.' },
        ] },
      ],
      takeaways: ['MSE = bias² + variance. A little bias can be worth it.', 'Sample variance divides by n − 1.', 'MLE: maximise the log-likelihood.', 'CI = estimate ± 1.96 SE. The interval is random, not the truth.', 'Beta(a, b) + k of n wins → mean (a + k)/(a + b + n).', 'Shrink noisy estimates towards a sensible prior.'],
      explain: { q: 'Why would anyone prefer a biased estimator?', a: 'Because what matters is total error. A shrunk estimate is biased, but much less variable, and when data is noisy, the fall in variance is larger than the squared bias. So its typical error is smaller.' },
      homework: [
        { lvl: 'core', q: 'Waiting times 2, 3 and 7 are exponential. What is the maximum likelihood estimate of the rate λ?', a: 0.25, hint: 'n/total.', sol: '3/12 = <b>0.25</b>.' },
        { lvl: 'core', q: 'You win 220 of 400 trades. What is the standard error of the win rate?', a: Math.sqrt(0.55 * 0.45 / 400), tol: { abs: 0.001 }, hint: '√(p(1 − p)/n).', sol: '≈ <b>0.025</b>.' },
        { lvl: 'core', q: 'What is the lower end of the 95% interval for that win rate? Use 1.96.', a: 0.55 - 1.96 * Math.sqrt(0.55 * 0.45 / 400), tol: { abs: 0.002 }, hint: 'p − 1.96 SE.', sol: '0.55 − 0.049 ≈ <b>0.501</b>. Barely above ½.' },
        { lvl: 'core', q: 'Data 0.3, 0.9, 0.5 come from a uniform on [0, θ]. What is the maximum likelihood estimate of θ?', a: 0.9, hint: 'Likelihood is θ⁻ⁿ, so make θ as small as the data allows.', sol: 'The largest value, <b>0.9</b>.' },
        { lvl: 'interview', q: 'Your prior for an opponent\'s raise rate is Beta(2, 8). They raise 3 of 10 hands. What is the posterior mean?', a: 0.25, hint: '(2 + 3)/(10 + 10).', sol: '5/20 = <b>0.25</b>.' },
        { lvl: 'interview', q: 'How many trades do you need to estimate a win rate near ½ to ±2% at 95%? Use 1.96.', a: (1.96 * 0.5 / 0.02) ** 2, tol: { rel: 0.02 }, hint: '1.96 × 0.5/√n = 0.02.', sol: '≈ <b>2,401</b>.' },
        { lvl: 'stretch', q: 'Prove that E[Σ(Xᵢ − X̄)²] = (n − 1)σ².', sol: 'Σ(Xᵢ − X̄)² = Σ(Xᵢ − μ)² − n(X̄ − μ)². Taking expectations: nσ² − n(σ²/n) = (n − 1)σ².' },
        { lvl: 'lab', q: 'Take a poker log, or any win/loss record of 50 or more events. Compute the win rate, its standard error, and a 95% interval. Could your edge be zero?', sol: 'With 50 events the standard error is about 7 percentage points, so you\'d need a win rate near 64% to rule out 50%. Most personal records can\'t distinguish skill from luck at that size. That\'s worth knowing about your own project, and worth saying in an interview.' },
      ],
      practice: [['Inference topic', '#/topic/inference'], ['Stats lab', '#/lab']],
    },

    testing: {
      title: 'Hypothesis tests and false discoveries', minutes: 45,
      why: 'Quant research is a machine for testing ideas, and most ideas are wrong. If you don\'t understand p-values and multiple testing, you\'ll trade noise and call it alpha.',
      goals: ['Run a z-test and read a p-value correctly', 'Explain power and the two kinds of error', 'Turn a Sharpe ratio into a t-statistic', 'Correct for multiple testing and estimate false discoveries'],
      prereq: ['clt', 'estimation', 'conditional'],
      sections: [
        { h: 'The logic of a test', blocks: [
          `<p>Assume nothing is going on (the <b>null hypothesis</b>). Ask how surprising your data would be in that world. The <b>test statistic</b> measures how far the data is from the null, in standard errors:</p>
           <div class="hb-eq">z = (estimate − null value)/standard error</div>
           <p>The <b>p-value</b> is the probability of a result at least this extreme <i>if the null is true</i>.</p>`,
          { fig: 'plot', x: [-3.8, 3.8], y: [0, 0.44], xl: 'z, assuming the null is true', xt: [[-2, '−2'], 0, 2], fns: [{ f: N, tone: 'ink' }], area: [{ f: N, from: 2, to: 3.8, tone: 'bad-soft' }, { f: N, from: -3.8, to: -2, tone: 'bad-soft' }], vlines: [{ x: 2, t: 'your z', tone: 'bad' }], labels: [{ x: 2.65, y: 0.05, t: 'p/2', a: 'middle' }, { x: -2.65, y: 0.05, t: 'p/2', a: 'middle' }], alt: 'The normal curve with both tails beyond plus and minus 2 shaded.', cap: 'A two-sided p-value is the area in both tails. z = 2 gives p ≈ 0.046.' },
          { q: 'A coin lands heads 60 times in 100 flips. What is z under the null of a fair coin?', a: 2, hint: 'Mean 50, sd 5.', sol: '(60 − 50)/5 = <b>2</b>.' },
          { q: 'What is the two-sided p-value for z = 2? Use the fact that 95.45% lies within ±2σ.', a: 0.0455, tol: { abs: 0.005 }, hint: '1 − 0.9545.', sol: '<b>0.0455</b>.' },
          { id: 'm1', q: 'A test gives p = 0.03. What does that mean?', opts: [['P(data this extreme | no effect) = 3%'], ['There\'s a 3% chance that there\'s no effect', 'That\'s P(null | data), which needs a prior.'], ['There\'s a 97% chance that the effect is real', 'Same mistake, flipped.'], ['The effect is large', 'p mixes effect size with sample size.']], sol: 'A p-value is P(data | null), not P(null | data). Confusing them is the most common statistics error of all, and it\'s just P(A | B) v P(B | A) again.' },
        ] },
        { h: 'Two kinds of error, and power', blocks: [
          `<table class="hb-table"><tr><th></th><th>No real effect</th><th>Real effect</th></tr><tr><td>You say "effect"</td><td>Type I (false positive), rate α</td><td>Correct (power)</td></tr><tr><td>You say "nothing"</td><td>Correct</td><td>Type II (false negative), rate β</td></tr></table>
           <p><b>Power</b> = 1 − β is your chance of detecting a real effect. It rises with effect size and with √n. An underpowered study misses real effects, and the ones it does find are exaggerated.</p>`,
          { fig: 'plot', x: [-3.5, 6], y: [0, 0.44], xl: 'test statistic', xt: [0, [1.96, '1.96'], [3, '3']], fns: [{ f: N, tone: 'ink' }, { f: Fig.normal(3, 1), tone: 'ok' }], area: [{ f: Fig.normal(3, 1), from: 1.96, to: 6, tone: 'ok-soft' }, { f: N, from: 1.96, to: 3.5, tone: 'bad-soft' }], vlines: [{ x: 1.96, tone: 'bad' }], labels: [{ x: -2.9, y: 0.32, t: 'if no effect' }, { x: 4.1, y: 0.32, t: 'if real effect', tone: 'ok' }, { x: 3.7, y: 0.08, t: 'power', tone: 'ok' }], alt: 'Two overlapping normal curves, with the part of the right one beyond the cut-off shaded as power.', cap: 'The green shaded area is your power. Red is the false-positive rate. Moving the cut-off trades one for the other; only more data separates the curves.' },
          { id: 'm2', q: 'Your test has only 20% power. You find a significant result. What should worry you?', opts: [['The estimate is probably too big'], ['Nothing: significant is significant', 'Low power means that significant results are mostly the lucky overestimates.'], ['α is too low', 'α is what you set. Power is the issue.'], ['Power only matters when you find nothing', 'It also affects how to read a positive.']], sol: 'At low power, only results inflated by luck clear the bar, so significant estimates exaggerate the effect. Low power also raises the share of false discoveries.' },
        ] },
        { h: 'Sharpe ratios are t-statistics', blocks: [
          `<p>Test whether a strategy's mean return is zero: t = mean/(sd/√n). With annual numbers, n is in years, and mean/sd is the annual Sharpe ratio:</p>
           <div class="hb-eq">t ≈ Sharpe × √years</div>
           <p>So to reach t = 2 with a Sharpe of 1 takes 4 years, and with a Sharpe of 0.5 it takes 16.</p>`,
          { fig: 'plot', x: [0, 3], y: [0, 40], xl: 'true Sharpe ratio', yl: 'years for t = 2', xt: [0.5, 1, 2, 3], yt: [0, 4, 16, 36], fns: [{ f: (s) => (2 / s) ** 2, from: 0.3 }], pts: [{ x: 0.5, y: 16, tone: 'bad' }, { x: 1, y: 4, tone: 'bad' }, { x: 2, y: 1, tone: 'bad' }], alt: 'Years of data needed against Sharpe ratio, falling steeply.', cap: 'Low-Sharpe strategies can\'t be proved from data in a career. High-frequency strategies have a high Sharpe partly because of this: they can be validated quickly.' },
          { q: 'A strategy has a Sharpe ratio of 1.5 over 4 years. What is its t-statistic?', a: 3, hint: 'Sharpe × √years.', sol: '1.5 × 2 = <b>3</b>.' },
          { q: 'How many years of data does a true Sharpe of 0.4 need to reach t = 2?', a: 25, hint: '(2/0.4)².', sol: '<b>25</b> years.' },
        ] },
        { h: 'Multiple testing', blocks: [
          `<p>Test enough ideas and some will pass by luck. With 100 noise signals at the 5% level, you expect 5 false positives, and you'll almost surely see at least one.</p>`,
          { widget: 'noise', predict: { q: 'You test 100 pure-noise signals. What is the largest |t| you are likely to see?', opts: ['Around 2.5 to 3', 'Under 2', 'Over 5'], then: 'Set the slider, and run it a few times.' } },
          { q: 'You test 100 independent noise signals at the 5% level. What is the probability that at least one looks significant?', a: 1 - 0.95 ** 100, tol: { abs: 0.002 }, hint: 'Complement: all 100 fail.', sol: '1 − 0.95¹⁰⁰ ≈ <b>0.994</b>.' },
          `<p>The simple fix is <b>Bonferroni</b>: with m tests, require p &lt; α/m. It's strict, since it guards against even one false positive. A gentler goal is to control the false discovery rate, the share of your discoveries that are false.</p>`,
          { q: 'You test 50 signals. What p-value threshold does Bonferroni give for α = 5%?', a: 0.001, hint: 'α/m.', sol: '0.05/50 = <b>0.001</b>.' },
          { fig: 'dots', cols: 40, size: 9.5, groups: [{ n: 80, tone: 'ok', t: '80 real ideas that pass (of 100)' }, { n: 20, tone: 'dim', t: '20 real ideas that fail' }, { n: 45, tone: 'bad', t: '45 duds that pass (5% of 900)' }, { n: 855, tone: 'dim', t: '855 duds that fail' }], alt: 'A thousand dots: 80 true discoveries and 45 false ones.', cap: '1,000 ideas, 10% real, 80% power, α = 5%. A third of your "discoveries" are false, even though every test was done correctly.' },
          { q: 'Of 1,000 ideas, 10% are real. Your test has 80% power and α = 5%. What fraction of ideas that pass are false?', a: 45 / 125, tol: { abs: 0.003 }, hint: '80 true passes, and 5% of 900 false ones.', sol: '45/(80 + 45) = <b>0.36</b>.' },
          { market: 'Keep a count of everything you tried, including what you threw away. A t-stat of 3 from your first idea means something very different from the best of 500 variations. Many research teams now ask for t above 3 for a new factor, for this reason.' },
        ] },
      ],
      takeaways: ['z = (estimate − null)/SE. p = P(data this extreme | null).', 'p is not P(null | data).', 'Power rises with effect size and √n.', 't ≈ Sharpe × √years.', 'm tests: expect 5% × m false positives. Bonferroni uses α/m.', 'False discovery share depends on how many ideas are real.'],
      explain: { q: 'A colleague says "p = 0.01, so there\'s a 99% chance this signal is real." Explain what\'s wrong, and what you\'d need to know.', a: 'p is the chance of data like this if the signal is noise, not the chance that it\'s noise given the data. To get that, you need the base rate of real signals and the test\'s power, then Bayes. If only 1% of ideas are real, a p of 0.01 can still leave a false discovery about as likely as a true one, and more so if many variations were tried.' },
      homework: [
        { lvl: 'core', q: '530 heads in 1,000 flips. What is z?', a: 30 / Math.sqrt(250), tol: { abs: 0.01 }, hint: 'sd = √250.', sol: '30/15.8 ≈ <b>1.90</b>.' },
        { lvl: 'core', q: 'A signal averages 0.1% a day, with daily sd 2%, over 400 days. What is its t-statistic?', a: 1, tol: { abs: 0.01 }, hint: 'SE = 2/√400.', sol: '0.1/0.1 = <b>1</b>: nothing to see.' },
        { lvl: 'core', q: 'An effect would give z = 2 on average with your sample. What is your power at the two-sided 5% level? (Use P(Z > −0.04) ≈ 0.516.)', a: 0.516, tol: { abs: 0.01 }, hint: 'Reject when z > 1.96. z is Normal(2, 1).', sol: 'P(Z > 1.96 − 2) ≈ <b>0.52</b>. A coin flip.' },
        { lvl: 'core', q: 'A strategy has a true Sharpe of 2. How many years does it take to reach t = 2?', a: 1, hint: '(2/2)².', sol: '<b>1</b> year.' },
        { lvl: 'interview', q: 'You try 20 independent strategies and the best has a one-sided p of 0.0062. What is the chance that the best of 20 noise strategies does this well?', a: 1 - (1 - 0.0062) ** 20, tol: { abs: 0.003 }, hint: '1 − (1 − p)²⁰.', sol: '≈ <b>0.117</b>. Not so impressive any more.' },
        { lvl: 'interview', q: 'Only 1% of tested ideas are real. Power is 50% and α = 1%. What share of ideas that pass are real?', a: 0.005 / (0.005 + 0.0099), tol: { abs: 0.003 }, hint: 'Per 10,000 ideas: 50 true passes, and how many false?', sol: '50/(50 + 99) ≈ <b>0.336</b>.' },
        { lvl: 'stretch', q: 'Explain why looking at a backtest every month and stopping when t &gt; 2 inflates false positives, and how you could correct it.', sol: 'Each look is another test, and a noise walk will eventually cross any fixed level: repeated checking raises the true false-positive rate well above 5%. Fixes: decide the sample size in advance, use a stricter boundary for early looks, or hold out data you touch only once.' },
        { lvl: 'lab', q: 'Run the Noise tool with 100 signals ten times, and write down the largest |t| each time. Then compare with √(2 ln 100) ≈ 3.03.', sol: 'You\'ll mostly see values between 2.3 and 3.3. The √(2 ln m) formula is a good rule of thumb, and you\'ll reuse it for backtest overfitting in chapter 27.' },
      ],
      practice: [['Inference topic', '#/topic/inference'], ['False discovery question', '#/sse/all/any/multiple-testing']],
    },

    regression: {
      title: 'Regression', minutes: 55,
      why: 'Regression is the workhorse of quant research: every beta, every alpha, every factor model and most signals are regressions. You should be able to derive one on a whiteboard and know exactly when not to trust it.',
      goals: ['Fit a line by least squares and interpret the slope', 'Connect the slope to covariance, correlation and R²', 'Test a coefficient and spot multicollinearity', 'Avoid the classic traps: outliers, omitted variables, regression to the mean'],
      prereq: ['variance', 'testing', 'toolkit'],
      sections: [
        { h: 'The least-squares line', blocks: [
          `<p>Given points (x, y), find the line y = α + βx that minimises the sum of squared vertical errors. The answer:</p>
           <div class="hb-eq">β = Cov(x, y)/Var(x) = ρ σ<sub>y</sub>/σ<sub>x</sub> &nbsp;&nbsp; α = ȳ − βx̄</div>
           <p>So the line always passes through the point of means, and its slope is the correlation, rescaled into y-units per x-unit.</p>`,
          { fig: 'plot', x: [0, 6], y: [0, 7], xl: 'x', yl: 'y', xt: [1, 2, 3, 4, 5], yt: [2, 4, 6], fns: [{ f: (x) => 0.9 + 0.9 * x, tone: 'ok' }], segs: [[1, 1.0, 1, 1.8], [2, 3.4, 2, 2.7], [3, 3, 3, 3.6], [4, 5.2, 4, 4.5], [5, 5, 5, 5.4]], pts: [[1, 1], [2, 3.4], [3, 3], [4, 5.2], [5, 5]], alt: 'Five points, their fitted line, and red vertical lines showing the errors.', cap: 'OLS minimises the sum of the squared red lengths. It measures errors vertically: it treats x as known.' },
          { proof: 'Minimise S(α, β) = Σ(yᵢ − α − βxᵢ)². ∂S/∂α = 0 gives ȳ = α + βx̄. Substitute, then ∂S/∂β = 0 gives Σ(xᵢ − x̄)(yᵢ − ȳ) = β Σ(xᵢ − x̄)², so β = Cov/Var.', title: 'Derive it' },
          { q: 'corr(x, y) = 0.5, σ<sub>y</sub> = 30% and σ<sub>x</sub> = 10%. What is the slope of y on x?', a: 1.5, hint: 'ρσ<sub>y</sub>/σ<sub>x</sub>.', sol: '0.5 × 3 = <b>1.5</b>.' },
          { q: 'A fitted line is y = 2 + 1.5x. What does it predict at x = 4?', a: 8, hint: 'Plug it in.', sol: '2 + 6 = <b>8</b>.' },
        ] },
        { h: 'R² and what\'s left over', blocks: [
          `<p>R² is the fraction of y's variance explained by the line. In simple regression, R² = ρ². So the residual variance is (1 − ρ²)Var(y). A correlation of 0.3 explains just 9% of the variance, and a correlation of 0.1 explains 1%, though at scale that can be a very good signal.</p>`,
          { widget: 'fit' },
          { q: 'corr(x, y) = 0.6. What is R²?', a: 0.36, hint: 'ρ².', sol: '<b>0.36</b>.' },
          { q: 'Var(y) = 25 and R² = 0.36. What is the residual variance?', a: 16, hint: '(1 − R²)Var(y).', sol: '0.64 × 25 = <b>16</b>.' },
          { worked: 'two regressions', q: 'Regressing Y on X gives slope 0.5, and X on Y gives slope 0.5 too. What is corr(X, Y)?', steps: [
            ['Write each slope in terms of ρ.', 'β<sub>y|x</sub> = ρσ<sub>y</sub>/σ<sub>x</sub>, and β<sub>x|y</sub> = ρσ<sub>x</sub>/σ<sub>y</sub>.'],
            ['Multiply them.', 'The σ terms cancel: β<sub>y|x</sub> β<sub>x|y</sub> = ρ².'],
            'So ρ² = 0.25, and ρ = 0.5, positive like the slopes.',
          ] },
          { id: 'm1', q: 'Why aren\'t the two regressions inverses of each other?', opts: [['They minimise different errors'], ['They are, unless there\'s an intercept', 'They only are when |ρ| = 1.'], ['Rounding error', 'It\'s a real difference.'], ['Because x is random', 'That isn\'t the reason.']], sol: 'Y on X minimises vertical errors, and X on Y minimises horizontal ones. Slopes multiply to ρ², not 1. With noise, both lines tilt towards the mean: regression to the mean again.' },
        ] },
        { h: 'Is the slope real?', blocks: [
          `<p>A slope is an estimate, so it has a standard error:</p>
           <div class="hb-eq">SE(β) = σ<sub>e</sub>/(σ<sub>x</sub>√n)</div>
           <p>and t = β/SE(β). More data helps, a wider spread in x helps, and more noise hurts. To check the fit, look at the residuals: they should look like shapeless noise.</p>`,
          { q: 'A slope is 0.6 with a standard error of 0.2. What is its t-statistic?', a: 3, hint: 'β/SE.', sol: '<b>3</b>.' },
          { fig: 'plot', x: [0, 10], y: [-3, 3], w: 340, h: 170, xl: 'fitted value', yl: 'residual', xt: [2, 5, 8], yt: [-2, 0, 2], pts: Array.from({ length: 30 }, (_, i) => { const x = 0.3 + i * 0.32; return { x, y: 0.05 * (x - 5) ** 2 * (i % 3 === 0 ? 1.7 : 1) - 0.9 + 0.25 * x * Math.sin(i * 2.4) * 0.7, r: 2.6 }; }), alt: 'Residuals showing a curved pattern and widening spread.', cap: 'Bad residuals: a curve means the relationship isn\'t linear, and a widening spread (heteroskedasticity) means the usual standard errors are wrong.' },
        ] },
        { h: 'Many variables', blocks: [
          `<p>With several variables, y = α + β₁x₁ + β₂x₂ + …, each β is the effect of that variable <i>holding the others fixed</i>. That's different from its simple-regression slope, and when variables are correlated it can even change sign.</p>
           <p><b>Multicollinearity</b>: when x's are highly correlated, the model can't tell them apart. The fit is fine, but the individual β's become unstable, with huge standard errors.</p>`,
          { id: 'm2', q: 'You add an exact copy of a feature to a regression. What happens?', opts: [['Same fit, but coefficients aren\'t unique'], ['R² doubles', 'A copy adds no new information.'], ['The old coefficient is unchanged, and the new one is 0', 'That\'s one of infinitely many solutions.'], ['Predictions become worse', 'Predictions stay the same.']], sol: 'Only the sum of the two coefficients is pinned down. XᵀX is singular, so OLS has no unique solution. Software either fails, or picks one. Ridge regression would split the weight evenly.' },
          { id: 'm3', q: 'You add a random noise column to a regression. What happens to in-sample R²?', opts: [['It rises slightly or stays put'], ['It falls', 'OLS can always set the new β to 0, so R² can\'t fall.'], ['It stays exactly the same, every time', 'Noise always correlates a bit by chance.'], ['It goes to 1', 'Only with as many columns as rows.']], sol: 'In-sample R² never falls when you add variables. That\'s why it can\'t be used to choose a model: use out-of-sample tests or a penalty.' },
          { trap: 'Omitted variables. Ice-cream sales predict drownings, as both rise in hot weather. In markets, a stock\'s exposure to one factor can pose as alpha until you control for a correlated factor.' },
        ] },
        { h: 'Regression to the mean', blocks: [
          `<p>In standardised units, the prediction is ŷ = ρx. Since |ρ| &lt; 1, an extreme x gets a less extreme prediction. It's why the best trader this year tends to be merely good next year, without anything having changed.</p>`,
          { fig: 'plot', x: [-3, 3], y: [-3, 3], w: 300, h: 280, xl: 'score this year, z', yl: 'score next year, z', xt: [-2, 0, 2], yt: [-2, 0, 2], pts: Fig.scatter(70, 0.5, 29), fns: [{ f: (x) => x, tone: 'muted', dash: true }, { f: (x) => 0.5 * x, tone: 'ok' }], labels: [{ x: 2.2, y: 1.7, t: 'y = x' }, { x: 1.9, y: 0.45, t: 'y = ρx', tone: 'ok' }], alt: 'A scatter with correlation 0.5, its flatter regression line and the steeper line y equals x.', cap: 'The regression line is flatter than y = x. The top scorers this year fall back towards average next year.' },
          { q: 'Scores on two tests have correlation 0.5. Someone scores 2 sds above average on the first. How many sds above average do you predict on the second?', a: 1, hint: 'ŷ = ρx.', sol: '0.5 × 2 = <b>1</b>.' },
          { market: 'Beta is a regression slope: regress a stock\'s returns on the market\'s, and the slope is its beta, and the intercept is its alpha. You\'ll build on this in chapter 26.' },
        ] },
      ],
      takeaways: ['β = Cov(x, y)/Var(x) = ρσ<sub>y</sub>/σ<sub>x</sub>; the line goes through the means.', 'R² = ρ²; residual variance = (1 − ρ²)Var(y).', 'β<sub>y|x</sub> β<sub>x|y</sub> = ρ².', 't = β/SE, with SE = σ<sub>e</sub>/(σ<sub>x</sub>√n).', 'Multiple β\'s hold the others fixed. Collinearity makes them unstable, not the fit.', 'In-sample R² never falls: judge out of sample.', 'Prediction is ρ × x: extreme values regress.'],
      explain: { q: 'Explain regression to the mean to someone who thinks last year\'s best fund manager must be the one to back.', a: 'Performance is partly skill, partly luck. The top of any ranking is heavily selected for good luck, and the luck doesn\'t repeat, so the same people fall back towards average. The better the correlation between years, the more of it is skill, but unless it\'s 1 you should predict less extreme results.' },
      homework: [
        { lvl: 'core', q: 'Fit a line through (0, 1), (1, 2), (2, 4) by hand. What is the slope?', a: 1.5, hint: 'x̄ = 1, ȳ = 7/3. Compute Σ(x − x̄)(y − ȳ) and Σ(x − x̄)².', sol: '3/2 = <b>1.5</b>.' },
        { lvl: 'core', q: 'And the intercept?', a: 7 / 3 - 1.5, tol: { abs: 0.003 }, hint: 'ȳ − βx̄.', sol: '7/3 − 3/2 = <b>5/6</b> ≈ 0.833.' },
        { lvl: 'core', q: 'A stock has volatility 30%, the market 15%, and their correlation is 0.7. What is the stock\'s beta?', a: 1.4, hint: 'ρσ<sub>s</sub>/σ<sub>m</sub>.', sol: '0.7 × 2 = <b>1.4</b>.' },
        { lvl: 'core', q: 'In a regression with n = 100, σ<sub>e</sub> = 2 and σ<sub>x</sub> = 1, what is SE(β)?', a: 0.2, hint: 'σ<sub>e</sub>/(σ<sub>x</sub>√n).', sol: '2/10 = <b>0.2</b>.' },
        { lvl: 'interview', q: 'What is the smallest slope that would be significant (t = 2) in that regression?', a: 0.4, hint: '2 × SE.', sol: '<b>0.4</b>.' },
        { lvl: 'interview', q: 'A signal has a daily correlation of 0.02 with next-day returns. What fraction of the variance does it explain?', a: 0.0004, tol: { abs: 0.00001 }, hint: 'ρ².', sol: '<b>0.04%</b>. Tiny, and across thousands of bets, that can be a business.' },
        { lvl: 'interview', q: 'Y = X + e, where X has variance 4, and e has variance 1, independent. What is the slope of X on Y?', a: 0.8, hint: 'Cov(X, Y)/Var(Y).', sol: '4/5 = <b>0.8</b>. It isn\'t 1: you discount Y because it\'s noisy.' },
        { lvl: 'stretch', q: 'Show that OLS residuals have mean zero and are uncorrelated with x. Why does that make R² = ρ²?', sol: 'The first-order conditions are exactly Σeᵢ = 0 and Σeᵢxᵢ = 0. So y = ŷ + e, with ŷ and e uncorrelated, and Var(y) = Var(ŷ) + Var(e). Then Var(ŷ) = β²Var(x) = ρ²Var(y), so the explained share is ρ².' },
        { lvl: 'lab', q: 'In Python, regress a stock\'s daily returns on an index\'s over a year with <code>np.polyfit</code>. Then split the year in half and compare the two betas.', sol: 'Betas wander: a gap of 0.1 to 0.3 between halves is normal, and part of it is estimation error. Compute SE(β) and see how much of the gap it explains.' },
      ],
      practice: [['Regression topic', '#/topic/regression'], ['Regression questions', '#/sse/all/any/regression']],
    },

    matrix: {
      title: 'Correlation matrices, portfolios and PCA', minutes: 50,
      why: 'A book of 500 stocks is a 500 by 500 risk problem. Covariance matrices make it tractable, and PCA tells you what the risks really are. Interviewers love the correlation bound questions too.',
      goals: ['Compute a portfolio\'s risk from a covariance matrix', 'Know what makes a correlation matrix valid, and derive bounds', 'Explain eigenvalues as the variance along a direction', 'Explain what PCA finds in stock returns'],
      prereq: ['variance', 'regression', 'toolkit'],
      sections: [
        { h: 'Covariance matrices', blocks: [
          `<p>Put every pair's covariance in a table Σ, with variances on the diagonal. For weights w, the portfolio's variance is wᵀΣw: the sum of every entry, weighted by both its assets' weights.</p>`,
          { fig: 'strip', cell: 66, rowGap: 3, labelW: 0, rows: [{ cells: [{ t: 'w₁²σ₁²', tone: 'acc-soft' }, 'w₁w₂c₁₂', 'w₁w₃c₁₃'] }, { cells: ['w₁w₂c₁₂', { t: 'w₂²σ₂²', tone: 'acc-soft' }, 'w₂w₃c₂₃'] }, { cells: ['w₁w₃c₁₃', 'w₂w₃c₂₃', { t: 'w₃²σ₃²', tone: 'acc-soft' }] }], alt: 'A three by three grid of variance terms on the diagonal and covariance terms off it.', cap: 'Portfolio variance is the sum of this grid. With n assets there are n diagonal terms and n² − n off-diagonal ones: with many assets, the correlations are what matter.' },
          { widget: 'portfolio', predict: { q: 'With a correlation of −1 between two assets, can you make the portfolio\'s risk exactly zero?', opts: ['Yes', 'No, only at a correlation of 0', 'Only if their volatilities match'], then: 'Set the correlation to −1, and find the bottom of the curve.' } },
          { q: 'Weights are 0.6 and 0.4, volatilities 20% and 10%, and correlation 0.5. What is the portfolio variance?', a: 0.0208, hint: 'w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂.', sol: '0.0144 + 0.0016 + 0.0048 = <b>0.0208</b>.' },
          { q: 'Three uncorrelated assets each have 30% volatility, held in equal weights. What is the portfolio volatility?', a: 0.3 / Math.sqrt(3), tol: { abs: 0.002 }, hint: 'σ/√n.', sol: '≈ <b>0.173</b>.' },
        ] },
        { h: 'What makes a matrix valid', blocks: [
          `<p>Any portfolio's variance must be ≥ 0, so wᵀΣw ≥ 0 for every w. Such a matrix is <b>positive semi-definite</b>, and that's the same as all its eigenvalues being ≥ 0. Not every table of numbers in [−1, 1] qualifies, which gives you the classic interview bounds.</p>`,
          { worked: 'equal correlations', q: 'Three variables all have the same pairwise correlation ρ. What is the smallest possible ρ?', steps: [
            ['Pick a portfolio that makes the off-diagonals work against you.', 'Take the plain sum X + Y + Z, each with variance 1.'],
            ['What is its variance?', '3 + 6ρ.'],
            ['Variance can\'t be negative.', '3 + 6ρ ≥ 0, so ρ ≥ −½.'],
            ['And in general, for n variables?', 'n + n(n − 1)ρ ≥ 0, so ρ ≥ −1/(n − 1).'],
          ] },
          { q: 'Four variables have equal pairwise correlation ρ. What is the smallest possible ρ?', a: -1 / 3, tol: { abs: 0.003 }, hint: '−1/(n − 1).', sol: '<b>−1/3</b>.' },
          `<p>The other classic: given corr(X, Y) = corr(Y, Z) = a, how low can corr(X, Z) go? Think of correlations as cosines of angles between vectors. If X is at angle θ from Y, and Y is at θ from Z, X and Z are at most 2θ apart. So corr(X, Z) ≥ cos 2θ = 2a² − 1.</p>`,
          { fig: 'plot', x: [-0.2, 1.2], y: [-0.1, 1.1], w: 280, h: 240, polys: [], series: [{ pts: [[0, 0], [1, 0]], tone: 'bad' }, { pts: [[0, 0], [0.87, 0.5]], tone: 'acc' }, { pts: [[0, 0], [0.5, 0.87]], tone: 'bad' }], labels: [{ x: 1.02, y: 0.02, t: 'X', tone: 'bad' }, { x: 0.9, y: 0.54, t: 'Y', tone: 'acc' }, { x: 0.52, y: 0.92, t: 'Z', tone: 'bad' }, { x: 0.45, y: 0.1, t: 'θ' }, { x: 0.3, y: 0.34, t: 'θ' }], alt: 'Three unit vectors with X and Z each at angle theta from Y.', cap: 'Correlation is the cosine of the angle between vectors. The widest X and Z can be is 2θ.' },
          { q: 'corr(X, Y) = corr(Y, Z) = 0.8. What is the minimum possible corr(X, Z)?', a: 0.28, hint: '2a² − 1.', sol: '2(0.64) − 1 = <b>0.28</b>.' },
          { id: 'm1', q: 'Why might a correlation matrix estimated from data with gaps not be valid?', opts: [['Pairs use different days'], ['Correlations can\'t be estimated with gaps', 'They can, pair by pair.'], ['The diagonal stops being 1', 'It stays 1.'], ['Valid matrices must be diagonal', 'They needn\'t be.']], sol: 'Pairwise estimates needn\'t be consistent with any single joint distribution, so the matrix may have a negative eigenvalue, which means a "portfolio" with negative variance. Risk models must repair this.' },
        ] },
        { h: 'Eigenvalues are variances', blocks: [
          `<p>Take a unit vector v as portfolio weights. Its variance is vᵀΣv. The direction with the highest variance is the top eigenvector, and that variance is its eigenvalue. The next eigenvector is the highest-variance direction uncorrelated with the first, and so on. Trace is preserved: eigenvalues sum to the total variance.</p>`,
          { fig: 'plot', x: [-3, 3], y: [-3, 3], w: 300, h: 280, xl: 'stock A', yl: 'stock B', xt: [-2, 0, 2], yt: [-2, 0, 2], pts: Fig.scatter(90, 0.8, 41), fns: [{ f: (x) => x, tone: 'ok', from: -2.6, to: 2.6 }, { f: (x) => -x, tone: 'bad', from: -1, to: 1 }], labels: [{ x: -2.8, y: 2.55, t: 'PC1: both move', tone: 'ok' }, { x: -0.3, y: -2.5, t: 'PC2: one v the other', tone: 'bad' }], alt: 'A narrow diagonal cloud with a long axis marked PC1 and a short axis marked PC2.', cap: 'For correlation matrix [1 ρ; ρ 1], the eigenvalues are 1 + ρ and 1 − ρ, along [1, 1] and [1, −1]. Here ρ = 0.8, so the long axis holds 90% of the variance.' },
          { q: 'A 2×2 correlation matrix has ρ = 0.6. What is its largest eigenvalue?', a: 1.6, hint: '1 + ρ.', sol: '<b>1.6</b>.' },
          `<p>For n assets with equal correlation ρ, the top eigenvalue is 1 + (n − 1)ρ, along the equal-weight portfolio, and the rest are all 1 − ρ.</p>`,
          { q: '10 stocks all have correlation 0.3. What share of the total variance does the first principal component explain?', a: 0.37, hint: 'Top eigenvalue/n.', sol: '(1 + 9 × 0.3)/10 = <b>0.37</b>.' },
        ] },
        { h: 'PCA on stock returns', blocks: [
          `<p>Run PCA on daily returns of 500 stocks. The first component has nearly all weights the same sign: that's <b>the market</b>, which usually explains 20–40% of variance. The next few often look like sectors or styles, such as tech against financials, or high beta against low beta. Beyond the first few, most components are noise.</p>`,
          { fig: 'bars', vals: [30, 6, 4.5, 3.5, 2.8, 2.3, 2, 1.8, 1.6, 1.5, 1.4, 1.3], labs: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], show: ['30%', '6%', '', '', '', '', '', '', '', '', '', ''], tone: (i) => (i === 0 ? 'bad' : ''), xl: 'principal component', alt: 'A scree plot: the first component explains about 30 percent, then a sharp drop.', cap: 'An illustrative scree plot for equity returns. One big market factor, a few sector factors, then a long tail.' },
          { id: 'm2', q: 'You have 500 stocks and 250 days of returns. What goes wrong with the sample covariance matrix?', opts: [['It\'s singular, so risk can look like 0'], ['Nothing, as long as the data is clean', 'With fewer days than stocks, it\'s singular.'], ['It has negative entries', 'Those are fine.'], ['PCA takes too long', 'That isn\'t the problem.']], sol: 'Rank is at most 249. So there are combinations with zero sample variance, and an optimiser will pile into these fake riskless portfolios. Fixes: factor models and shrinkage, which reduce what must be estimated.' },
          { market: 'A risk manager thinks in factors, not names. If most of your risk loads on PC1, you have a market bet whatever your stock picks say. Neutralising to the first few components is how a desk isolates stock-specific bets.' },
        ] },
      ],
      takeaways: ['Portfolio variance is wᵀΣw.', 'Valid means wᵀΣw ≥ 0 for all w: eigenvalues ≥ 0.', 'Equal correlations: ρ ≥ −1/(n − 1).', 'corr(X, Z) ≥ 2a² − 1 when both link to Y at a.', 'Eigenvalues are variances along principal directions; they sum to total variance.', 'PC1 of stocks is the market.', 'More stocks than days makes the sample matrix singular: use factors or shrinkage.'],
      explain: { q: 'Explain PCA on stock returns to a non-mathematician, and why a trader cares.', a: 'Stocks move together for a few shared reasons. PCA finds the directions along which the whole market moves the most, in order. The first is usually the market itself, and the next few are things like sectors. A trader cares because a book can look diversified across 100 names while nearly all of its risk is one of those few shared moves.' },
      homework: [
        { lvl: 'core', q: 'corr(X, Y) = corr(Y, Z) = 0.6. What is the minimum possible corr(X, Z)?', a: -0.28, hint: '2a² − 1.', sol: '<b>−0.28</b>.' },
        { lvl: 'core', q: 'Many stocks with 25% volatility and pairwise correlation 0.16, held equally. What does portfolio volatility tend to, as a decimal?', a: 0.1, hint: '√ρ × σ.', sol: '0.4 × 0.25 = <b>0.10</b>.' },
        { lvl: 'core', q: 'Two assets have volatilities 10% and 20%, and correlation 0.5. What weight in the first asset gives minimum variance?', a: 1, hint: 'w₁ = (σ₂² − c)/(σ₁² + σ₂² − 2c), with c = 0.01.', sol: '0.03/0.03 = <b>1</b>: adding the riskier asset doesn\'t help here.' },
        { lvl: 'core', q: 'In a 3×3 correlation matrix, the three eigenvalues sum to what?', a: 3, hint: 'The trace.', sol: '<b>3</b>.' },
        { lvl: 'interview', q: 'Two uncorrelated assets have 10% and 30% volatility, held 50/50. What share of the portfolio\'s variance comes from the second?', a: 0.9, hint: '0.25 × 0.01 against 0.25 × 0.09.', sol: '0.09/0.10 = <b>0.9</b>. Equal money isn\'t equal risk.' },
        { lvl: 'interview', q: '500 stocks all have pairwise correlation 0.2. What share of total variance is in the top component?', a: (1 + 499 * 0.2) / 500, tol: { abs: 0.002 }, hint: '(1 + (n − 1)ρ)/n.', sol: '≈ <b>0.20</b>.' },
        { lvl: 'interview', q: 'Is [1, 0.9, 0.9; 0.9, 1, −0.9; 0.9, −0.9, 1] a valid correlation matrix? Give the bound on the third correlation from the first two: what is the minimum corr(Y, Z) if corr(X, Y) = corr(X, Z) = 0.9?', a: 0.62, hint: '2a² − 1.', sol: '<b>0.62</b>. −0.9 is below that, so the matrix isn\'t valid.' },
        { lvl: 'stretch', q: 'Show that for a symmetric matrix Σ, the unit vector that maximises vᵀΣv is an eigenvector.', sol: 'Maximise vᵀΣv subject to vᵀv = 1 with a Lagrange multiplier: the gradient gives 2Σv − 2λv = 0, so Σv = λv. At that point vᵀΣv = λ, so the maximum is the largest eigenvalue.' },
        { lvl: 'lab', q: 'In Python, download or paste a year of returns for 5 stocks. Compute <code>np.corrcoef</code> and <code>np.linalg.eigh</code>. How much variance does the top eigenvector explain, and are its weights all the same sign?', sol: 'For five large stocks, the top component typically explains 40–60%, with weights of one sign: the market. If a stock\'s weight is much smaller, it\'s less tied to the market.' },
      ],
      practice: [['PCA question', '#/sse/all/any/pca'], ['Correlation bounds', '#/sse/all/any/correlation-matrix'], ['Portfolio question', '#/sse/all/any/portfolio']],
    },

    timeseries: {
      title: 'Time series and volatility', minutes: 50,
      why: 'Market data arrives in order, and that order matters. This chapter gives you the tools to think about mean reversion, momentum and changing volatility, and to avoid being fooled by trends.',
      goals: ['Explain stationarity and why we model returns, not prices', 'Work with autocorrelation and AR(1), including half-life', 'Model volatility with an EWMA', 'Spot spurious regression, and know what cointegration fixes'],
      prereq: ['regression', 'walks'],
      sections: [
        { h: 'Prices wander, returns don\'t', blocks: [
          `<p>A series is <b>stationary</b> if its statistical behaviour doesn't change over time. Prices aren't: their mean and variance drift. Returns nearly are, so we model returns. If log prices follow a random walk, then the log returns are independent noise, and the variance of the price grows with time.</p>`,
          { fig: 'plot', x: [0, 60], y: [80, 125], h: 170, xl: 'days', yl: 'price', xt: [0, 20, 40, 60], yt: [100], series: [{ pts: Fig.scatter(70, 0, 5).slice(0, 61).reduce((a, q, i) => [...a, [i, i ? a[i - 1][1] * (1 + 0.02 * q.y) : 100]], []) }], alt: 'A wandering price series.', cap: 'A price series. Eyes find trends in pure noise, which is why you need tests.' },
          { id: 'm1', q: 'Why is regressing one stock\'s price on another\'s usually a mistake?', opts: [['Random walks often look related'], ['Prices are too large to regress', 'Size isn\'t the issue.'], ['OLS can\'t handle positive numbers', 'It can.'], ['Prices have no variance', 'They have too much, and it grows.']], sol: 'This is spurious regression. Random walks drift, so two unrelated ones often look correlated, with huge t-stats. Regress returns instead, or test for cointegration.' },
        ] },
        { h: 'Autocorrelation', blocks: [
          `<p>Autocorrelation at lag k is the correlation of a series with itself k steps earlier. It's zero for pure noise. Positive at lag 1 means moves tend to continue (momentum), and negative means they tend to reverse.</p>
           <p>Autocorrelation changes how risk scales. With lag-1 autocorrelation ρ:</p>
           <div class="hb-eq">Var(r₁ + r₂) = 2σ²(1 + ρ)</div>`,
          { q: 'Daily returns have lag-1 autocorrelation 0.2. By what factor is two-day variance bigger than twice the daily variance?', a: 1.2, hint: '1 + ρ.', sol: '<b>1.2</b>.' },
          { market: 'Smoothly reported returns, like those of illiquid funds, have positive autocorrelation. So √252 scaling understates their true risk, and their Sharpe ratio looks better than it is.' },
        ] },
        { h: 'AR(1): mean reversion in one line', blocks: [
          `<p>The simplest model with memory says today is a fraction of yesterday plus noise:</p>
           <div class="hb-eq">x<sub>t</sub> = φ x<sub>t−1</sub> + ε<sub>t</sub></div>
           <ul><li>|φ| &lt; 1: stationary, reverts to 0. Long-run variance σ²/(1 − φ²).</li><li>φ = 1: a random walk. Shocks last for ever.</li><li>The forecast k steps ahead is φᵏx₀, so a shock's <b>half-life</b> is ln ½/ln φ.</li></ul>`,
          { widget: 'ar1', predict: { q: 'Compare φ = 0.5 and φ = 0.95. Which one looks more like a trending price?', opts: ['φ = 0.95', 'φ = 0.5', 'They look the same'], then: 'Move the slider, including to −0.5 and to 1.' } },
          { q: 'x follows an AR(1) with φ = 0.5 and noise variance 3. What is its long-run variance?', a: 4, hint: 'σ²/(1 − φ²).', sol: '3/0.75 = <b>4</b>.' },
          { q: 'What is the half-life of a shock when φ = 0.9? Give it to 1 decimal place.', a: Math.log(0.5) / Math.log(0.9), tol: { abs: 0.05 }, hint: 'ln ½/ln φ.', sol: '≈ <b>6.6</b> steps.' },
          { q: 'x₀ = 10, φ = 0.8. What is the expected value of x₂?', a: 6.4, hint: 'φ²x₀.', sol: '0.64 × 10 = <b>6.4</b>.' },
          { proof: 'If the process is stationary, Var(x<sub>t</sub>) = Var(x<sub>t−1</sub>) = V. Then V = φ²V + σ², as ε is independent of the past. So V = σ²/(1 − φ²).', title: 'Why that variance?' },
        ] },
        { h: 'Volatility changes', blocks: [
          `<p>Returns are close to uncorrelated, but their sizes aren't: big moves cluster. So volatility itself is a process you can forecast. The simplest forecast is an exponentially weighted moving average:</p>
           <div class="hb-eq">σ²<sub>t+1</sub> = λσ²<sub>t</sub> + (1 − λ) r²<sub>t</sub></div>
           <p>A high λ (0.94 is a common daily value) means long memory. GARCH adds a pull back to a long-run level.</p>`,
          { fig: 'plot', x: [0, 100], y: [-5, 5], h: 170, xl: 'days', yl: 'return, %', xt: [0, 50, 100], yt: [-4, 0, 4], segs: Array.from({ length: 100 }, (_, i) => { const vol = 0.6 + 2.2 * Math.exp(-((i - 55) ** 2) / 90); const z = Math.sin(i * 12.9898) * 43758.5453; return [i, 0, i, (2 * (z - Math.floor(z)) - 1) * vol * 1.5, 'muted']; }), alt: 'Daily returns with a burst of large moves in the middle.', cap: 'Volatility clustering: calm periods, then a burst. An independent normal model wouldn\'t produce this.' },
          { q: 'Yesterday\'s variance forecast was 1 (in %²), λ = 0.94, and today\'s return was 2%. What is the new forecast?', a: 1.18, hint: '0.94 × 1 + 0.06 × 4.', sol: '<b>1.18</b>, so volatility is about 1.09%.' },
        ] },
        { h: 'Cointegration and pairs', blocks: [
          `<p>Two prices can each wander, while their spread stays stationary, as with two share classes of one company. They're <b>cointegrated</b>. Then the spread is a mean-reverting series you can trade: an AR(1) with φ &lt; 1. To test it, regress one on the other, then test whether the residual is stationary.</p>`,
          { fig: 'plot', x: [0, 60], y: [-3, 3], h: 160, xl: 'days', yl: 'spread, in sds', xt: [0, 30, 60], yt: [-2, 0, 2], hlines: [{ y: 2, t: 'sell the spread', tone: 'bad' }, { y: -2, t: 'buy the spread', tone: 'ok' }], series: [{ pts: Array.from({ length: 61 }, (_, i) => [i, 1.8 * Math.sin(i * 0.33) * Math.cos(i * 0.09) + 0.5 * Math.sin(i * 1.7)]) }], alt: 'A spread oscillating around zero, with bands at plus and minus 2.', cap: 'A stationary spread. The classic trade fades it at the bands, but the risk is that the relationship breaks, and then the spread doesn\'t come back.' },
          { id: 'm2', q: 'You trade a pairs spread with half-life 5 days. It moves against you and stays out for 60 days. What should you think?', opts: [['The relationship may have broken'], ['It\'s now a better bargain, so double up', 'At 12 half-lives, the model should have reverted long ago.'], ['60 days is normal for that half-life', 'Half of a gap should close in 5 days.'], ['Half-lives don\'t apply to spreads', 'They do, while the model holds.']], sol: 'Model risk is the real risk in mean reversion. If a spread ignores its half-life by a factor of 12, the likely story is a regime change, not an ever better bargain.' },
        ] },
      ],
      takeaways: ['Model returns, not prices. Prices are close to random walks.', 'Autocorrelation changes how risk scales: 2σ²(1 + ρ).', 'AR(1): variance σ²/(1 − φ²), forecast φᵏx₀, half-life ln ½/ln φ.', 'Volatility clusters: EWMA σ² = λσ² + (1 − λ)r².', 'Regressing prices on prices is spurious; cointegration is the honest version.', 'Mean reversion trades carry model risk.'],
      explain: { q: 'What is the difference between a stationary AR(1) and a random walk, in terms of what a shock does?', a: 'In a stationary AR(1), a shock fades geometrically, so the series has a level it returns to, and its variance is bounded. In a random walk, every shock is permanent, there\'s no level to return to, and the variance grows without limit.' },
      homework: [
        { lvl: 'core', q: 'What is the half-life of a shock when φ = 0.5?', a: 1, hint: 'ln ½/ln ½.', sol: '<b>1</b> step.' },
        { lvl: 'core', q: 'An AR(1) has φ = 0.9 and noise variance 1. What is its long-run variance?', a: 1 / 0.19, tol: { abs: 0.01 }, hint: '1/(1 − 0.81).', sol: '≈ <b>5.26</b>.' },
        { lvl: 'core', q: 'Daily vol is 1% with lag-1 autocorrelation −0.5. What is the two-day volatility, in percent?', a: 1, hint: '2σ²(1 + ρ).', sol: '√(2 × 0.5) = <b>1%</b>: reversal offsets half the risk.' },
        { lvl: 'core', q: 'A spread with φ = 0.95 is at +2 now. What do you expect it to be in 14 days?', a: 2 * 0.95 ** 14, tol: { abs: 0.01 }, hint: 'φ¹⁴ × 2.', sol: '≈ <b>0.98</b>: about one half-life.' },
        { lvl: 'interview', q: 'What is the half-life, in days, of the weight on old data in an EWMA with λ = 0.94?', a: Math.log(0.5) / Math.log(0.94), tol: { abs: 0.05 }, hint: 'ln ½/ln λ.', sol: '≈ <b>11.2</b> days.' },
        { lvl: 'interview', q: 'A = 2B + spread is cointegrated, and A has 100 shares in your long leg. How many shares of B do you short to hedge?', a: 200, hint: 'Hedge ratio 2.', sol: '<b>200</b> shares.' },
        { lvl: 'stretch', q: 'Show that for an AR(1), the correlation between x<sub>t</sub> and x<sub>t−k</sub> is φᵏ.', sol: 'Substitute repeatedly: x<sub>t</sub> = φᵏx<sub>t−k</sub> + (noise after t − k). The noise is independent of x<sub>t−k</sub>, so Cov(x<sub>t</sub>, x<sub>t−k</sub>) = φᵏV. Dividing by V gives φᵏ.' },
        { lvl: 'lab', q: 'In Python, compute the lag-1 autocorrelation of an index\'s daily returns, and then of their squares. Which is larger?', sol: 'Returns: near 0. Squared returns: clearly positive, often 0.1–0.3. That\'s volatility clustering, in one line: direction is hard to forecast, while size isn\'t.' },
      ],
      practice: [['Time series topic', '#/topic/timeseries'], ['Pandas drills', '#/sse/all/python-drills']],
    },
  });
})();
