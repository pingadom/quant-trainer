// Real market events, each turned into a statistics lesson with worked questions.
// Facts are from the linked sources. Questions marked `illus: true` use illustrative
// numbers chosen to teach the concept, not historical figures.
(function () {
  const TABLE = { abs: 0.003, rel: 0.02 };

  QT.cases = [
    {
      id: 'black-monday', year: 1987, title: 'Black Monday', tags: ['fat tails', 'feedback loops'],
      summary: `On 19 October 1987 the Dow Jones Industrial Average fell 22.6% in a single session, still its worst one-day percentage drop. NYSE volume roughly doubled its previous record. A major amplifier was <b>portfolio insurance</b>: institutions hedged by selling index futures as prices fell, which pushed prices lower and triggered more automatic selling.`,
      facts: ['Dow −22.6% on 19 Oct 1987', 'NYSE volume ≈ 604 million shares, nearly double the prior record', 'Exchange circuit breakers were introduced afterwards'],
      lesson: `Under a normal model this day is essentially impossible. Markets have fat tails, and hedging rules that everyone follows can create the very crash they insure against.`,
      questions: [
        { q: `Suppose the Dow's typical daily volatility was about 1%. Treating daily returns as normal, how many standard deviations was the 22.6% fall?`, a: 22.6, tol: { abs: 0.1, rel: 0 }, illus: true,
          sol: `22.6% / 1% = 22.6σ. Under a normal distribution, P(Z < −22.6) is around 10<sup>−113</sup>. Nothing that rare should ever be observed, so the model is wrong, not the market.` },
        { q: `Under the same normal model, a −5σ day has probability about 2.87 × 10<sup>−7</sup>. With 252 trading days a year, how many years would you expect to wait for one?`, a: 1 / 2.8665e-7 / 252, tol: { abs: 1, rel: 0.03 },
          sol: `Expected wait = 1/p days = 1/2.87×10<sup>−7</sup> ≈ 3.5 million days ≈ 13,800 years. Real equity markets produce several 5σ days per decade, which is direct evidence of fat tails.` },
      ],
      sources: [['Wikipedia: Black Monday (1987)', 'https://en.wikipedia.org/wiki/Black_Monday_(1987)']],
    },
    {
      id: 'ltcm', year: 1998, title: 'Long-Term Capital Management', tags: ['leverage', 'correlation'],
      summary: `LTCM, whose partners included Nobel laureates, ran convergence trades: small, statistically reliable spreads amplified with heavy borrowing. At the start of 1998 it had about $5bn of equity and had borrowed over $125bn. After Russia's default in August 1998, spreads widened instead of converging. Positions that had looked diversified all moved together.`,
      facts: ['≈ $5bn equity, > $125bn borrowed (early 1998)', 'Lost $4.6bn in under four months', 'NY Fed brokered a ≈ $3.6bn recapitalisation by 14 institutions (23 Sept 1998)'],
      lesson: `Leverage turns small moves into total loss. Correlations estimated in calm periods rise sharply in a crisis, just when you need diversification most.`,
      questions: [
        { q: `Take LTCM's assets as ≈ $130bn ($125bn borrowed + $5bn equity). What percentage fall in asset value wipes out the equity? (decimal or %)`, a: 5 / 130,
          sol: `5/130 ≈ 3.8%. At ~26× leverage, a sub-4% move in the whole book ends the fund.` },
        { q: `A book has 10 equally weighted positions, each with 10% volatility and pairwise correlation ρ. Portfolio vol = σ·√(1/N + (1 − 1/N)ρ). In calm markets ρ = 0.1. What is portfolio volatility if ρ jumps to 0.8? (decimal or %)`, a: 0.1 * Math.sqrt(0.1 + 0.9 * 0.8), illus: true,
          sol: `At ρ = 0.1: 10%·√0.19 ≈ 4.4%. At ρ = 0.8: 10%·√0.82 ≈ 9.1%. Risk roughly doubles with no change in positions; the diversification benefit has disappeared.` },
      ],
      sources: [['Wikipedia: Long-Term Capital Management', 'https://en.wikipedia.org/wiki/Long-Term_Capital_Management'], ['GAO report on LTCM (2000)', 'https://www.gao.gov/assets/ggd-00-67r.pdf']],
    },
    {
      id: 'barings', year: 1995, title: 'Barings & Nick Leeson', tags: ['operational risk', 'martingale betting'],
      summary: `Nick Leeson, head of Barings' Singapore futures unit, was meant to run low-risk arbitrage but controlled both trading <i>and</i> the back office. He hid losses in error account 88888 (£208m by the end of 1994). After the Kobe earthquake on 17 January 1995 hit the Nikkei, he doubled down on a recovery that never came.`,
      facts: ['Losses reached £827m (≈ $1.4bn), about twice the bank\'s available trading capital', 'Barings, the UK\'s oldest merchant bank, was declared insolvent on 26 Feb 1995'],
      lesson: `"Double down to win it back" is a martingale betting strategy. It wins small amounts often and eventually loses everything. Separating trading from settlement is basic risk control.`,
      questions: [
        { q: `A trader starts with a 1-unit bet and doubles the stake after every loss. After 7 consecutive losses, what is the cumulative loss in units?`, a: 127, tol: { abs: 0.5, rel: 0 },
          sol: `1 + 2 + 4 + … + 64 = 2<sup>7</sup> − 1 = 127 units, and the next bet needed is 128. Exposure grows exponentially while the eventual win is just 1 unit.` },
        { q: `With fair coin-flip bets, what is the probability of losing the first 7 in a row?`, a: 1 / 128,
          sol: `(1/2)<sup>7</sup> = 1/128 ≈ 0.0078. Rare per attempt, but a trader who runs the strategy repeatedly will almost surely hit such a streak.` },
      ],
      sources: [['Wikipedia: Nick Leeson', 'https://en.wikipedia.org/wiki/Nick_Leeson']],
    },
    {
      id: 'amaranth', year: 2006, title: 'Amaranth Advisors', tags: ['concentration', 'leverage'],
      summary: `Amaranth's star energy trader held enormous, concentrated positions in natural gas futures spreads (bets on the price difference between delivery months). When the spreads moved against him in September 2006, the positions were too large to exit without moving the market further.`,
      facts: ['Losses of roughly $6bn+, mostly in September 2006: then the largest hedge-fund collapse', 'Reported leverage of about 8:1', 'The CFTC later charged Amaranth and the trader with attempted manipulation of natural gas futures prices'],
      lesson: `When you are a large share of a market, the price you see is not the price you can exit at. Size, liquidity and leverage together determine the true risk.`,
      questions: [
        { q: `With 8:1 leverage, what adverse move in the positions wipes out the fund's equity? (decimal or %)`, a: 1 / 8,
          sol: `1/8 = 12.5%. Natural gas spreads can move that much in days.` },
      ],
      sources: [['Wikipedia: Amaranth Advisors', 'https://en.wikipedia.org/wiki/Amaranth_Advisors']],
    },
    {
      id: 'quant-quake', year: 2007, title: 'The Quant Quake', tags: ['crowding', 'independence'],
      summary: `In the week of 6 August 2007, many quantitative market-neutral (stat-arb) equity funds suffered unprecedented losses on the 7th and 8th while the overall market barely moved. By Friday the 10th, the price moves had largely reversed. Khandani & Lo argue that the rapid unwinding of one or more large similar portfolios forced losses on everyone holding the same trades.`,
      facts: ['Losses concentrated in quant equity market-neutral funds, 7–9 Aug 2007', 'Sharp rebound on 10 Aug', 'Analysed in "What Happened to the Quants in August 2007?" (Khandani & Lo)'],
      lesson: `Your returns are not independent of other traders' positions. If many funds use similar signals, a forced seller anywhere becomes your risk. i.i.d. assumptions badly understate multi-day tail risk.`,
      questions: [
        { q: `A market-neutral fund runs at 10% annualised volatility and loses 12% over three days. Assuming i.i.d. daily returns (252 trading days), how many standard deviations is that loss?`, a: 0.12 / (0.1 * Math.sqrt(3 / 252)), tol: { abs: 0.1, rel: 0.02 }, illus: true,
          sol: `3-day σ = 10% × √(3/252) ≈ 1.09%. 12%/1.09% ≈ 11σ. Under independence that is effectively impossible; under crowding it happens.` },
      ],
      sources: [['Khandani & Lo, NBER working paper', 'https://www.nber.org/system/files/working_papers/w14465/w14465.pdf']],
    },
    {
      id: 'flash-crash', year: 2010, title: 'The Flash Crash', tags: ['liquidity', 'execution'],
      summary: `On 6 May 2010 the Dow fell nearly 1,000 points in under half an hour, then largely recovered. The joint SEC/CFTC report found the trigger was a single large sell program: 75,000 E-mini S&P 500 futures (≈ $4.1bn) executed by an algorithm set to sell at 9% of the previous minute's volume, with no regard to price or time.`,
      facts: ['Sell program ≈ $4.1bn / 75,000 E-mini contracts', 'Participation-rate algorithm at 9% of volume, completed in about 20 minutes', 'High-frequency traders passed contracts back and forth, inflating volume'],
      lesson: `Volume is not liquidity. An algorithm keyed to volume speeds up when intermediaries churn inventory among themselves, even though no real buyers are arriving.`,
      questions: [
        { q: `An E-mini S&P 500 contract is worth $50 × the index. If 75,000 contracts were worth $4.1bn, what index level does that imply?`, a: 4.1e9 / (75000 * 50), tol: { abs: 1, rel: 0.01 },
          sol: `$4.1bn / (75,000 × $50) ≈ 1,093. That is consistent with where the S&P 500 traded in May 2010.` },
        { q: `If the 75,000 contracts were sold over 20 minutes at 9% participation, what was the average total market volume per minute (in contracts)?`, a: 75000 / 20 / 0.09, tol: { abs: 1, rel: 0.02 },
          sol: `75,000/20 = 3,750 sold per minute, which is 9% of volume, so volume ≈ 3,750/0.09 ≈ 41,700 contracts per minute.` },
      ],
      sources: [['Joint SEC/CFTC staff report (Sept 2010)', 'https://www.banking.senate.gov/download/joint-staff-report-from-sec-and-cftc-regarding-market-events-of-may-6-2010&download=1']],
    },
    {
      id: 'knight', year: 2012, title: 'Knight Capital', tags: ['operational risk', 'kill switches'],
      summary: `On 1 August 2012, Knight deployed new trading code to only seven of its eight order-routing servers. A reused flag woke up long-dead "Power Peg" code on the eighth, which sent millions of child orders into the market. In about 45 minutes Knight executed over 397 million shares across 154 stocks.`,
      facts: ['≈ 4 million executions, 154 stocks, 397 million shares, ≈ 45 minutes', 'Pre-tax loss ≈ $440m', 'SEC fine of $12m for risk-control failures'],
      lesson: `For a trading firm, a software deployment is a market risk event. Pre-trade limits, monitoring and a working kill switch matter as much as alpha.`,
      questions: [
        { q: `A $440m loss over 45 minutes is how many dollars lost per second, on average?`, a: 440e6 / 2700, tol: { abs: 1, rel: 0.02 },
          sol: `45 minutes = 2,700 s, and $440m / 2,700 ≈ $163,000 per second.` },
        { q: `397 million shares over 45 minutes is how many shares executed per second?`, a: 397e6 / 2700, tol: { abs: 1, rel: 0.02 },
          sol: `397m / 2,700 ≈ 147,000 shares per second.` },
      ],
      sources: [['Knight Capital Form 10-Q (SEC)', 'https://www.sec.gov/Archives/edgar/data/0001060749/000119312512346917/d361681d10q.htm'], ['Wikipedia: Knight Capital Group', 'https://en.wikipedia.org/wiki/Knight_Capital_Group']],
    },
    {
      id: 'snb', year: 2015, title: 'Swiss franc de-peg', tags: ['jump risk', 'leverage', 'VaR'],
      summary: `From 2011 the Swiss National Bank capped the franc at 1.20 per euro. At 09:30 GMT on 15 January 2015 it abandoned the floor without warning. The franc jumped about 30% against the euro at the extreme, and there was almost no liquidity for around 40 minutes. Stop-loss orders filled far away from their trigger prices.`,
      facts: ['EUR/CHF floor at 1.20 removed 15 Jan 2015', 'FXCM clients ran up ≈ $275m of negative balances', 'Leucadia lent FXCM $300m the next day'],
      lesson: `A pegged price has tiny historical volatility, so historical VaR says the risk is near zero. The real risk is a jump. Stops do not protect you through a gap, and leverage turns a jump into losses larger than your deposit.`,
      questions: [
        { q: `A trader is long EUR/CHF at 1.20 with 2% margin (50:1 leverage). What percentage fall in EUR/CHF wipes out the margin? (decimal or %)`, a: 0.02, illus: true,
          sol: `With 50:1 leverage, a 1/50 = 2% move wipes out the margin.` },
        { q: `If EUR/CHF gaps down 15% before the broker can close the position, how many times the margin does the trader lose?`, a: 7.5, illus: true,
          sol: `15% × 50 = 750% of the margin, i.e. 7.5×. The trader now owes the broker 6.5× their deposit. Many FXCM clients were in this situation.` },
      ],
      sources: [['FXCM Form 10-K 2015 (SEC)', 'https://www.sec.gov/Archives/edgar/data/0001499912/000149991216000015/fxcm-20151231x10k.htm'], ['Finance Magnates: Leucadia $300m lifeline', 'https://www.financemagnates.com/forex/brokers/breaking-leucadia-hands-fxcm-300-mln-life-line/']],
    },
    {
      id: 'volmageddon', year: 2018, title: 'Volmageddon', tags: ['short volatility', 'negative skew', 'path dependence'],
      summary: `Exchange-traded products that paid the inverse of daily VIX-futures returns had delivered years of steady gains. On 5 February 2018 the S&P 500 fell 4.1% and the VIX rose from 17.31 to 37.32 (+115.6%), its largest one-day percentage rise ever. Credit Suisse's XIV note fell from $108.37 to $4.22 and was terminated.`,
      facts: ['VIX +115.6% in one day', 'XIV ≈ −96%, triggering an "acceleration event" and redemption', 'S&P 500 −4.1%, its largest daily drop since 2011'],
      lesson: `Selling volatility collects small premiums while staying short convexity. The return distribution is strongly negatively skewed: a high Sharpe ratio right up until the blow-up. Daily-rebalanced products are also path-dependent.`,
      questions: [
        { q: `A −1× daily-rebalanced product tracks an index that rises 20% one day and falls 16.67% the next, ending unchanged. What is the product's total return over the two days? (decimal or %)`, a: 0.8 * (1 + 1 / 6) - 1, tol: { abs: 0.001, rel: 0.01 }, illus: true,
          sol: `Day 1: −20% → 0.80. Day 2: +16.67% → 0.80 × 1.1667 ≈ 0.933. That is −6.7% even though the index is flat. Daily rebalancing loses value when the path is volatile.` },
        { q: `A short-vol strategy returns +1% in 98% of months and −40% in 2% of months. What is its expected monthly return? (decimal or %)`, a: 0.98 * 0.01 - 0.02 * 0.4, tol: { abs: 0.0002, rel: 0.02 }, illus: true,
          sol: `0.98 × 1% − 0.02 × 40% = 0.98% − 0.8% = 0.18%. It is barely positive, even though 49 months out of 50 look great. A short backtest would likely contain no blow-up at all.` },
      ],
      sources: [['Macroption: VIX all-time highs and biggest spikes', 'https://macroption.com/vix-all-time-high/'], ['finews.asia: Credit Suisse and XIV', 'https://www.finews.asia/finance/26411-credit-suisse-xiv-volatility-vix-market-maker']],
    },
    {
      id: 'neg-oil', year: 2020, title: 'Negative oil', tags: ['model risk', 'distributions'],
      summary: `On 20 April 2020, the day before expiry, the May WTI crude futures contract settled at <b>−$37.63</b>. COVID lockdowns had collapsed demand, storage at the Cushing, Oklahoma delivery point was nearly full, and holders who couldn't take physical delivery paid to get out. Earlier that month CME had announced it would switch its energy options model from Black–Scholes (lognormal) to Bachelier (normal) so it could handle zero and negative prices.`,
      facts: ['May 2020 WTI settled at −$37.63 on 20 Apr 2020: the first negative price in NYMEX WTI history', 'Physically settled contract; storage constraints', 'CME notice of 8 Apr 2020 on switching to the Bachelier model'],
      lesson: `Distributional assumptions are choices. A lognormal model says negative prices have zero probability. When the world violates a model's support, pricing and risk systems break.`,
      questions: [
        { q: `Under Black–Scholes the futures price is lognormal. What probability does the model assign to the price ending below zero?`, a: 0, tol: { abs: 0.0001, rel: 0 },
          sol: `Zero. A lognormal variable is e<sup>X</sup>, which is always positive. The event that actually happened was impossible in the model.` },
        { q: `Under the Bachelier (normal) model, the futures price is $10 with a normal volatility of $8 until expiry. What is P(price < 0)? (Φ(1.25) = 0.8944)`, a: 1 - QT.m.normCdf(1.25), tol: TABLE, illus: true,
          sol: `z = (0 − 10)/8 = −1.25, so P = Φ(−1.25) = 1 − 0.8944 ≈ 0.106.` },
      ],
      sources: [['Miffre et al., Energy Journal summary', 'https://www.iaee.org/ej/ejexec/ej44-1-Miffre-exsum.pdf'], ['Wikipedia: Bachelier model', 'https://en.wikipedia.org/wiki/Bachelier_model']],
    },
    {
      id: 'gamestop', year: 2021, title: 'GameStop short squeeze', tags: ['crowding', 'unbounded loss'],
      summary: `By 22 January 2021 about 140% of GameStop's public float had been sold short. Retail traders coordinating on Reddit bought shares and call options, forcing short sellers to buy back into a rising market. Melvin Capital, a prominent short, lost about 53% in January.`,
      facts: ['≈ 140% of float sold short (22 Jan 2021)', 'Melvin Capital −53% in January 2021, down from $12.5bn at the start of the year', 'Short interest above 100% of float had occurred only about 15 times in the prior decade (per Goldman Sachs)'],
      lesson: `A short position has capped gains and unlimited losses, which is a negatively skewed payoff. A crowded short is fragile because everyone must buy back through the same door.`,
      questions: [
        { q: `You short a stock at $20 and it rises to $300. Your loss is what multiple of the initial position value?`, a: 14, illus: true,
          sol: `(300 − 20)/20 = 14× the position. A long position can lose at most 1×.` },
        { q: `Short interest is 70 million shares and average daily volume is 10 million. What is "days to cover"?`, a: 7, illus: true,
          sol: `70m / 10m = 7 days, and that assumes shorts could take all of the volume. High days-to-cover signals squeeze risk.` },
      ],
      sources: [['Wikipedia: GameStop short squeeze', 'https://en.wikipedia.org/wiki/GameStop_short_squeeze'], ['Bloomberg: Melvin lost 53% in January', 'https://www.bloomberg.com/news/articles/2021-01-31/melvin-lost-53-in-january-hurt-by-gamestop-other-bets-dj']],
    },
    {
      id: 'archegos', year: 2021, title: 'Archegos', tags: ['leverage', 'concentration', 'liquidity'],
      summary: `Bill Hwang's family office built huge, concentrated stock positions through total return swaps with several prime brokers. Because swaps kept the exposure off public filings, each bank saw only its own slice. When the stocks fell in late March 2021, Archegos could not meet margin calls, and the banks raced to dump the same shares.`,
      facts: ['Credit Suisse lost ≈ $5.5bn; Nomura ≈ $2bn; Morgan Stanley ≈ $1bn', 'Total bank losses approached $10bn'],
      lesson: `Hidden leverage and concentration compound each other. Exit liquidity is finite, and the last bank to sell takes the worst prices.`,
      questions: [
        { q: `A fund has $10bn of equity and $50bn of long positions in a handful of stocks. If those stocks fall 20%, what fraction of the equity is lost? (decimal or %)`, a: 1, tol: { abs: 0.01, rel: 0 }, illus: true,
          sol: `20% × $50bn = $10bn, which is 100% of the equity. 5× leverage means a 20% move wipes you out.` },
        { q: `You hold $3bn of a stock that trades $300m per day. If you can sell 20% of daily volume without crashing the price, how many trading days does it take to exit?`, a: 50, tol: { abs: 0.5, rel: 0 }, illus: true,
          sol: `20% × $300m = $60m per day, and $3bn / $60m = 50 days. In a margin call you have hours, not 50 days.` },
      ],
      sources: [['Wikipedia: Archegos Capital Management', 'https://en.wikipedia.org/wiki/Archegos_Capital_Management'], ['Fortune: bank losses from Archegos', 'https://fortune.com/2021/04/27/heres-how-much-big-banks-have-lost-so-far-from-the-archegos-collapse/']],
    },
    {
      id: 'medallion', year: 1988, title: 'Renaissance Medallion', tags: ['small edge', 'law of large numbers'],
      summary: `Renaissance Technologies' Medallion fund is widely regarded as the most successful trading fund ever. In Gregory Zuckerman's <i>The Man Who Solved the Market</i>, co-CEO Robert Mercer is quoted describing a win rate of only about 50.75%. The edge is tiny per trade, but it is applied across an enormous number of trades.`,
      facts: ['Reported win rate ≈ 50.75% of trades', 'Source: Zuckerman, "The Man Who Solved the Market" (2019)'],
      lesson: `You don't need to be right often. You need a real edge, many independent bets, and correct sizing. By the law of large numbers, a 0.75% edge becomes near-certain profit.`,
      questions: [
        { q: `Even-money bets of ±1 unit win with probability 0.5075. What is the expected profit per bet?`, a: 0.015,
          sol: `E = 0.5075 − 0.4925 = 2p − 1 = 0.015 units per bet.` },
        { q: `Roughly how many independent bets are needed before expected total profit is 3 standard deviations above zero? (SD per bet ≈ 1)`, a: (3 / 0.015) ** 2 * (1 - 0.015 ** 2), tol: { abs: 1, rel: 0.02 },
          sol: `After N bets: mean = 0.015N, SD ≈ √N. Setting 0.015N = 3√N gives √N = 200, so N ≈ 40,000. A high-frequency fund makes that many bets quickly.` },
        { q: `What fraction of bankroll does the Kelly criterion stake on each such bet?`, a: 0.015,
          sol: `For even-money bets, f* = p − q = 2p − 1 = 1.5%.` },
      ],
      sources: [['Penguin Random House: The Man Who Solved the Market', 'https://www.penguinrandomhouse.com/books/557104/the-man-who-solved-the-market-by-gregory-zuckerman/9780593148198']],
    },
    {
      id: 'thorp', year: 1962, title: 'Ed Thorp & the Kelly criterion', tags: ['Kelly', 'position sizing'],
      summary: `Mathematician Ed Thorp's <i>Beat the Dealer</i> (1962) proved that card counting could beat blackjack. Claude Shannon pointed him to John Kelly's 1956 Bell Labs paper on optimal bet sizing, which he used to size bets as the odds shifted. He later ran Princeton Newport Partners, one of the first quantitative hedge funds.`,
      facts: ['Princeton Newport Partners (1969–1988): ≈ 19.1% annualised before fees, 15.1% after', 'Only three losing months out of about 230'],
      lesson: `Edge tells you <i>whether</i> to bet; Kelly tells you <i>how much</i>. Over-betting destroys long-run growth even when your edge is real.`,
      questions: [
        { q: `A card counter has an even-money bet that wins with probability 0.505. What Kelly fraction should they stake?`, a: 0.01, illus: true,
          sol: `f* = 2p − 1 = 0.01, i.e. 1% of bankroll.` },
        { q: `Long-run log growth per bet ≈ f·μ − f²σ²/2, with edge μ = 0.01 and σ² ≈ 1. What is the growth rate if the counter bets twice Kelly (f = 0.02)?`, a: 0, tol: { abs: 0.000005, rel: 0 }, illus: true,
          sol: `0.02 × 0.01 − 0.02²/2 = 0.0002 − 0.0002 = 0. At 2× Kelly your long-run growth is zero despite a real edge, and beyond that it turns negative.` },
      ],
      sources: [['Wikipedia: Edward O. Thorp', 'https://en.wikipedia.org/wiki/Edward_O._Thorp'], ['Learning from Ed Thorp (mastersinvest)', 'https://mastersinvest.com/newblog/2017/7/21/learning-from-ed-thorp']],
    },
  ].sort((a, b) => a.year - b.year);

  QT.caseById = (id) => QT.cases.find((c) => c.id === id);
})();
