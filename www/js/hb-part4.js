// Handbook, Part 4: Trading. See handbook-content.js for how chapters are structured.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    betting: {
      title: 'Betting and position sizing', minutes: 50,
      why: 'Finding an edge is half the job. Bet too little and you waste it; bet too much and you go broke on a winning strategy. Kelly tells you where the line is, and why good traders stay well inside it.',
      goals: ['Explain why expected value alone is not enough', 'Derive and use the Kelly fraction', 'Show why over-betting a winning edge loses money', 'Connect Kelly to Sharpe ratios and leverage'],
      prereq: ['expectation', 'toolkit', 'walks'],
      sections: [
        { h: 'Expected value isn\'t enough', blocks: [
          `<p>A coin game: each round your wealth goes up 50% on heads, or down 40% on tails. The expected return is +5% a round. You'd take it, right? But your money compounds, so what matters is the product of many rounds.</p>`,
          { worked: 'positive EV, negative growth', q: 'You play the +50%/−40% game for many rounds, betting everything each time. What happens to a typical player?', steps: [
            ['Look at one head and one tail. What is the factor?', '1.5 × 0.6 = 0.9.'],
            ['In the long run, about half of the flips are heads. So what happens over 2n rounds?', 'Your wealth is about 0.9ⁿ × your start: it shrinks to nothing.'],
            ['Yet the average across all players is growing. How?', 'A tiny number of very lucky players hold nearly all of the money. The mean is pulled up by them, while the typical player is ruined.'],
          ] },
          { idea: 'You live one path through time, not the average across parallel universes. For compounding wealth, the number that matters is the expected growth rate, E[ln(1 + return)], not the expected return.' },
          { q: 'In that game, by what factor does wealth change over one head and one tail?', a: 0.9, hint: '1.5 × 0.6.', sol: '<b>0.9</b>.' },
        ] },
        { h: 'The Kelly fraction', blocks: [
          `<p>Bet a fraction f of your wealth on a bet that pays b to 1, winning with probability p (with q = 1 − p). Your growth rate per bet is</p>
           <div class="hb-eq">g(f) = p ln(1 + bf) + q ln(1 − f)</div>
           <p>Set the derivative to zero, and you get the <b>Kelly fraction</b>:</p>
           <div class="hb-eq">f* = (bp − q)/b = edge/odds</div>`,
          { proof: 'g′(f) = pb/(1 + bf) − q/(1 − f) = 0. Cross-multiply: pb(1 − f) = q(1 + bf), so pb − q = bf(p + q) = bf. Hence f* = (pb − q)/b.', title: 'Derive it' },
          { q: 'An even-money bet (b = 1) wins with probability 0.6. What is the Kelly fraction?', a: 0.2, hint: '(1 × 0.6 − 0.4)/1.', sol: '<b>0.2</b>.' },
          { q: 'A bet pays 2 to 1, and wins with probability 0.5. What is the Kelly fraction?', a: 0.25, hint: '(2 × 0.5 − 0.5)/2.', sol: '<b>0.25</b>.' },
          { q: 'With p = 0.6 and b = 1, what is the growth rate per bet at f = 0.2? Give 4 decimal places.', a: 0.6 * Math.log(1.2) + 0.4 * Math.log(0.8), tol: { abs: 0.0005 }, hint: '0.6 ln 1.2 + 0.4 ln 0.8.', sol: '≈ <b>0.0201</b>, or about 2% a bet.' },
        ] },
        { h: 'Over-betting', blocks: [
          `<p>Growth is a hill. It rises with f, peaks at f*, then falls. At about 2f* it's back to zero, and beyond that you're going broke on a bet with a positive edge.</p>`,
          { fig: 'plot', x: [0, 0.5], y: [-0.08, 0.03], xl: 'fraction bet', yl: 'growth per bet', xt: [0, [0.2, 'f*'], [0.4, '2f*']], yt: [-0.06, 0, 0.02], fns: [{ f: (x) => 0.6 * Math.log(1 + x) + 0.4 * Math.log(1 - x) }], pts: [{ x: 0.2, y: 0.0201, tone: 'ok' }], labels: [{ x: 0.22, y: 0.024, t: 'full Kelly', tone: 'ok' }, { x: 0.5, y: 0.019, t: 'past 2f*, you lose', tone: 'bad', a: 'end' }], alt: 'Growth against bet size for p equals 0.6: it peaks at 0.2 and hits zero near 0.4.', cap: 'p = 0.6, even money. Half Kelly (f = 0.1) gets about three quarters of the peak growth, at half the risk.' },
          { widget: 'kelly', predict: { q: 'On a coin with a 58% win chance at even money, what happens if you bet 40% of your wealth every time?', opts: ['You lose money in the long run', 'You grow faster than at Kelly', 'You grow slowly, but safely'], then: 'Slide the fraction, and find the top of the hill.' } },
          { id: 'm1', q: 'Why do most professionals bet half Kelly or less?', opts: [['Estimated edges may be too high'], ['Half Kelly has a higher growth rate', 'Full Kelly has the highest growth, if p is known exactly.'], ['Regulators require it', 'They don\'t.'], ['Kelly only works for coins', 'It works for any bet.']], sol: 'If you overstate your edge by a factor of 2, full Kelly really means betting 2f*, with zero growth. Half Kelly with the same mistake is full Kelly. Also, half Kelly halves volatility and gives up only a quarter of the growth.' },
        ] },
        { h: 'Kelly with a Sharpe ratio', blocks: [
          `<p>For a continuous return with mean μ and volatility σ (excess of the risk-free rate), the growth rate at leverage f is about fμ − ½f²σ². Maximising:</p>
           <div class="hb-eq">f* = μ/σ² &nbsp;&nbsp; g* = μ²/(2σ²) = Sharpe²/2</div>`,
          { q: 'A strategy has μ = 10% and σ = 20% a year. What is the Kelly leverage?', a: 2.5, hint: 'μ/σ².', sol: '0.1/0.04 = <b>2.5</b>.' },
          { q: 'What is the maximum growth rate for a Sharpe ratio of 0.5, as a decimal?', a: 0.125, hint: 'Sharpe²/2.', sol: '<b>0.125</b>, or 12.5% a year.' },
          { market: 'In a pod, your size is set by risk limits, not Kelly. But the logic carries over: scale positions by conviction over variance, and cut size when your estimate of edge falls.' },
        ] },
        { h: 'How bad can it get?', blocks: [
          `<p>Kelly sizing still gives violent swings. At full Kelly, in continuous time, the chance of your wealth ever falling to a fraction x of its starting level is x itself: a 50% chance of halving at some point. At a fraction c of Kelly, it's x<sup>2/c − 1</sup>.</p>`,
          { q: 'At half Kelly, what is the chance of your wealth ever halving?', a: 1 / 8, hint: 'c = ½, so the exponent is 3.', sol: '(½)³ = <b>1/8</b>.' },
        ] },
      ],
      takeaways: ['Compounding wealth: maximise E[ln(1 + r)], not E[r].', 'Kelly: f* = (bp − q)/b.', 'At 2f* growth falls to zero; beyond it, you go broke with an edge.', 'Half Kelly: ¾ of the growth, ½ of the risk.', 'Continuous: f* = μ/σ², g* = Sharpe²/2.', 'Estimated edges argue for betting less.'],
      explain: { q: 'How can a bet with a positive expected return make most people who take it repeatedly poorer?', a: 'Wealth multiplies, so losses take a bite out of a bigger or smaller base. The long-run outcome depends on the average of the logs, and volatility drags that down by about σ²/2. With a big enough bet, the drag exceeds the edge: the mean is held up by a few lucky paths, while the typical path falls.' },
      homework: [
        { lvl: 'core', q: 'An even-money bet wins 55% of the time. What is the Kelly fraction?', a: 0.1, hint: '2p − 1 at even money.', sol: '<b>0.1</b>.' },
        { lvl: 'core', q: 'A bet pays 3 to 1, and wins 40% of the time. What is the Kelly fraction?', a: 0.2, hint: '(3 × 0.4 − 0.6)/3.', sol: '0.6/3 = <b>0.2</b>.' },
        { lvl: 'core', q: 'What is the growth per bet at Kelly for p = 0.55 at even money? Give 4 decimal places.', a: 0.55 * Math.log(1.1) + 0.45 * Math.log(0.9), tol: { abs: 0.0002 }, hint: 'g(0.1).', sol: '≈ <b>0.0050</b>.' },
        { lvl: 'core', q: 'A strategy has μ = 8% and σ = 16%. What is the Kelly leverage?', a: 3.125, hint: 'μ/σ².', sol: '0.08/0.0256 = <b>3.125</b>.' },
        { lvl: 'interview', q: 'You have $100,000. A coin pays 2 to 1, and is fair. How much do you bet at full Kelly?', a: 25000, tol: { abs: 1 }, hint: 'f* = 0.25.', sol: '<b>$25,000</b>.' },
        { lvl: 'interview', q: 'What is the maximum growth rate for a Sharpe ratio of 1?', a: 0.5, hint: 'Sharpe²/2.', sol: '<b>0.5</b> a year, before costs and estimation error.' },
        { lvl: 'interview', q: 'In the continuous formula, what fraction of the maximum growth do you get at half Kelly?', a: 0.75, hint: 'g(cf*) = (c − c²/2) × Sharpe². Divide by Sharpe²/2.', sol: '2(½ − ⅛) = <b>¾</b>.' },
        { lvl: 'stretch', q: 'Using g(f) = fμ − ½f²σ², show that growth is exactly zero at 2f*, and explain the volatility drag.', sol: 'g(2μ/σ²) = 2μ²/σ² − ½(4μ²/σ⁴)σ² = 0. The term −½f²σ² is the drag: it grows with the square of the size, while the edge grows only linearly, so doubling past the peak cancels the gain.' },
        { lvl: 'lab', q: 'Play the Bet sizing game in the app three times. First bet too small, then near Kelly, then at twice Kelly. Write down what each felt like.', sol: 'Most people find that near-Kelly sizing already feels too aggressive. That feeling is useful: full Kelly has deep drawdowns even when everything is right.' },
      ],
      practice: [['Bet sizing game', '#/kelly'], ['Finance topic', '#/topic/finance'], ['Kelly question', '#/sse/all/any/kelly']],
    },

    'market-making': {
      title: 'Market making', minutes: 60,
      why: 'Being asked to "make a market" is the signature trading interview question, and even at a hedge fund, it tests how you price, size and update under pressure. There\'s a clear script for it, and you can drill it.',
      goals: ['Read an order book and compute execution costs', 'Quote a two-sided market around a fair value', 'Explain adverse selection and price it', 'Skew for inventory, update on flow, and follow the answer script'],
      prereq: ['expectation', 'conditional', 'variance'],
      sections: [
        { h: 'How a market works', blocks: [
          `<p>A <b>limit order</b> says "I'll buy up to this price" and rests in the <b>order book</b>. A <b>market order</b> trades immediately against the best resting orders. The best buy is the <b>bid</b>, and the best sell is the <b>ask</b> (or offer). Their difference is the <b>spread</b>, and the midpoint is the <b>mid</b>.</p>`,
          { fig: 'book', asks: [['100.03', 200], ['100.02', 300], ['100.01', 100]], bids: [['99.99', 300], ['99.98', 200], ['99.97', 400]], alt: 'An order book: asks at 100.01, 100.02 and 100.03, and bids at 99.99, 99.98 and 99.97, with sizes.', cap: 'Best bid 99.99, best ask 100.01. A big market order "walks the book" through several levels.' },
          { q: 'In that book, what is the spread?', a: 0.02, hint: 'Best ask − best bid.', sol: '100.01 − 99.99 = <b>0.02</b>.' },
          { q: 'And the mid?', a: 100, hint: 'Halfway.', sol: '<b>100.00</b>.' },
          { q: 'You send a market order to buy 300 shares. What is your average price, to 4 decimal places?', a: (100 * 100.01 + 200 * 100.02) / 300, tol: { abs: 0.0002 }, hint: '100 at 100.01, then 200 at 100.02.', sol: '≈ <b>100.0167</b>. Size costs money.' },
          { market: 'Market makers like Citadel Securities earn the spread by quoting both sides, and manage the risk. Hedge funds like Citadel take positions and pay the spread. The two are separate firms, so know which you\'re interviewing with. In a fund interview, market-making questions test your pricing and updating, rather than a job description.' },
        ] },
        { h: 'Quoting around fair value', blocks: [
          `<p>"Make me a market on X" means: give a bid and an ask. Your job is to find <b>fair value</b> (the expected value of X), then set a <b>width</b> that compensates for your uncertainty and for trading against people who may know more.</p>
           <p>The width should grow with your uncertainty, roughly with the standard deviation of X, and shrink if you're confident. Wide isn't "wrong", but no one trades with a market that's too wide.</p>`,
          { worked: 'two dice', q: 'Make a market on the total of two dice.', steps: [
            ['What is fair value?', '7.'],
            ['How uncertain is it?', 'sd = √(2 × 35/12) ≈ 2.4.'],
            ['So what width might you start with?', 'Something like 6.5 to 7.5 or 6 to 8. The risk is contained: no one knows more than you, as the dice are fair. So you can be tight.'],
            ['What do you say out loud?', '"Fair is 7. I\'d be 6.5 bid, 7.5 offered, 5 up." Then wait for the response, and say your position after any trade.'],
          ] },
          { q: 'What is fair value for the total of three dice?', a: 10.5, hint: '3 × 3.5.', sol: '<b>10.5</b>.' },
          { q: 'You sell 5 at 52, and the fair value turns out to be 50. What is your profit?', a: 10, hint: 'Sold above value: (price − value) × size.', sol: '(52 − 50) × 5 = <b>+10</b>.' },
          { trap: 'Selling at 52 when the value turns out to be 50 is a profit: you got more than it was worth. Under pressure, people get the sign backwards. Say it aloud: bought below value, or sold above value, is good.' },
        ] },
        { h: 'Adverse selection', blocks: [
          `<p>Why do markets have a spread at all? Because some of the people you trade with know more than you. When they buy, it's because the price is too low. So <b>a trade is information</b>. You must set your quotes as if you've already seen the trade:</p>
           <div class="hb-eq">ask = E[value | someone buys] &nbsp;&nbsp; bid = E[value | someone sells]</div>`,
          { worked: 'pricing informed flow', q: 'A stock is worth 90 or 110, equally likely. 25% of traders know which; the rest buy or sell at random. Where should your ask be?', steps: [
            ['If the value is 110, how likely is a buy?', 'Informed always buy, and the rest buy half the time: 0.25 + 0.75 × 0.5 = 0.625.'],
            ['If the value is 90?', 'Only the uninformed buy: 0.375.'],
            ['Apply Bayes: given a buy, what is P(110)?', '0.625/(0.625 + 0.375) = 0.625.'],
            'So ask = 0.625 × 110 + 0.375 × 90 = 102.5. The half-width of 2.5 is exactly informed share × 10.',
          ] },
          { widget: 'adverse', predict: { q: 'If the share of informed traders doubles, the width you need…', opts: ['doubles', 'stays the same', 'grows four times'], then: 'Try it. Set your half-width too tight and see your profit per trade.' } },
          { q: 'Same stock (90 or 110), with 20% informed. What is the break-even half-width?', a: 2, hint: 'Informed share × 10.', sol: '0.2 × 10 = <b>2</b>.' },
          { q: 'At those numbers, someone buys from you. What is your new fair value?', a: 102, hint: 'E[value | buy].', sol: 'P(110 | buy) = 0.6, so 0.6 × 110 + 0.4 × 90 = <b>102</b>.' },
          { idea: 'One-way flow is information. If someone keeps lifting your offer, don\'t just manage the position: move your fair value. That\'s the difference between a beginner and a trader.' },
        ] },
        { h: 'Inventory', blocks: [
          `<p>Trades leave you with a position, and a position has risk. If you're long, you want to sell, so you <b>skew</b> both quotes down: a lower ask attracts buyers, and a lower bid discourages more selling to you. If you're short, skew up. This isn't changing your view of value, only your appetite.</p>`,
          { fig: 'plot', x: [-3, 3], y: [98, 102], h: 200, xl: 'your position (hundreds of shares)', yl: 'quote', xt: [-2, 0, 2], yt: [99, 100, 101], fns: [{ f: (x) => 100.6 - 0.2 * x, tone: 'bad' }, { f: (x) => 99.4 - 0.2 * x, tone: 'ok' }, { f: () => 100, tone: 'muted', dash: true }], labels: [{ x: -2.8, y: 101.5, t: 'ask', tone: 'bad' }, { x: -2.8, y: 99.45, t: 'bid', tone: 'ok' }, { x: -1.6, y: 100.12, t: 'fair value' }], alt: 'Bid and ask lines sloping down as position grows, with fair value flat.', cap: 'The quotes slide against your position, while fair value stays put.' },
          { id: 'm1', q: 'You\'re long 10 and fair value is 50. What is the best thing to do with your next quote?', opts: [['Quote 49 at 50.5: lean to sell'], ['Quote 49.5 at 50.5: stay centred', 'That ignores your inventory.'], ['Quote 50.5 at 51.5: raise both, to show confidence', 'That invites more selling to you.'], ['Stop quoting', 'Then you can\'t reduce the position by trading.']], sol: 'Your ask at 50.5 is close, so you\'re likely to sell, and your lower bid reduces the chance of adding to the long.' },
        ] },
        { h: 'The answer script', blocks: [
          { fig: 'flow', alt: 'The market-making answer script.', steps: ['Say your fair value', 'Pick a width from the sd', 'Quote bid and ask', 'After each trade or reveal: update fair', 'State your position', 'Re-quote with a skew'] },
          `<p>Interviewers mark the process more than the numbers. Talk through each step, and never go silent. If new information arrives (a die is revealed), recompute fair value first, and only then set your width. Less remaining uncertainty means a tighter market.</p>`,
          { q: 'You\'re making a market on the sum of two dice. One die is revealed: a 5. What is the new fair value?', a: 8.5, hint: '5 + 3.5.', sol: '<b>8.5</b>, and your width should be narrower, as only one die is left.' },
          { id: 'm2', q: 'Your bids have been hit three times in a row at falling prices, and you have no news. What is the best read?', opts: [['Informed selling: lower fair value'], ['The sellers are wrong, so buy more', 'That\'s the classic way to get run over.'], ['Nothing has changed', 'One-way flow is evidence.'], ['Widen only on the ask side', 'The bid is where you\'re being hit.']], sol: 'Update on flow. Sellers may know something, so adjust fair value, and widen as uncertainty has risen. Once you\'ve moved, you can ask whether the market has overreacted.' },
        ] },
      ],
      takeaways: ['Bid, ask, spread, mid; market orders walk the book.', 'Fair value = EV. Width grows with uncertainty.', 'ask = E[value | buy], bid = E[value | sell].', 'Half-width covers informed share × their edge.', 'Long: skew down. Short: skew up. Skew isn\'t a view.', 'Script: fair, width, quote, update, position, re-quote.'],
      explain: { q: 'Why does a market maker lose money on some trades even with a spread, and what sets the width?', a: 'When a trader knows the value, they only trade when you\'re wrong, so those trades lose more than the half-spread. Uninformed traders pay the half-spread. Break-even width balances the two, so the spread is the price of trading against an unknown mix of the two, plus the cost of inventory risk.' },
      homework: [
        { lvl: 'core', q: 'You buy 10 at 99, and sell 10 at 101. What is your profit?', a: 20, hint: '2 per unit.', sol: '<b>20</b>.' },
        { lvl: 'core', q: 'Make a market on heads in 10 flips, at $1 each. What is the standard deviation of X? Give 2 decimal places.', a: Math.sqrt(2.5), tol: { abs: 0.01 }, hint: '√(npq).', sol: '≈ <b>1.58</b>. So a market like 4.5 at 5.5 is a sensible start.' },
        { lvl: 'core', q: 'A stock is worth 90 or 110, equally likely, and 30% of traders are informed. What is your break-even half-width?', a: 3, hint: 'Share × 10.', sol: '<b>3</b>.' },
        { lvl: 'core', q: 'In the book above, you sell 400 at market. What is your average price, to 4 decimal places?', a: (300 * 99.99 + 100 * 99.98) / 400, tol: { abs: 0.0002 }, hint: '300 at 99.99, then 100 at 99.98.', sol: '<b>99.9875</b>.' },
        { lvl: 'interview', q: 'Cards numbered 1 to 13 (one of each). Three are drawn. What is fair value for their total?', a: 21, hint: '3 × 7.', sol: '<b>21</b>.' },
        { lvl: 'interview', q: 'The first card is revealed as a 13. What is fair value now?', a: 26, hint: 'The other 12 cards average 6.5.', sol: '13 + 2 × 6.5 = <b>26</b>.' },
        { lvl: 'interview', q: 'Fair is 100, your half-width is 0.05, and you skew by 0.02 per 100 shares. You\'re long 300. Where is your bid?', a: 99.89, tol: { abs: 0.0005 }, hint: 'Skew down by 0.06.', sol: '100 − 0.05 − 0.06 = <b>99.89</b>.' },
        { lvl: 'stretch', q: 'In the 90/110 model, with informed share μ, derive ask = 100 + 10μ from Bayes. What does this say about spreads around earnings announcements?', sol: 'P(buy | 110) = μ + (1 − μ)/2 = (1 + μ)/2, and P(buy | 90) = (1 − μ)/2. So P(110 | buy) = (1 + μ)/2, and the ask is 100 + 10μ. Before earnings, both the informed share and the size of the value gap rise, so spreads widen.' },
        { lvl: 'lab', q: 'Play Make me a market in the app for 15 minutes, and then the Citadel market-making simulator at level 2. Say the whole script out loud. Which step did you skip under pressure?', sol: 'Most people skip stating their position, or forget to update fair value after a one-way flow. Pick the one you skipped, and focus on it next time.' },
      ],
      practice: [['Make me a market', '#/quote'], ['Market simulator', '#/sse/sim'], ['Market making on dice', '#/market'], ['Figgie', '#/figgie']],
    },

    options: {
      title: 'Options', minutes: 60,
      why: 'Options are prices on uncertainty itself. Even if you never trade them, they teach you to think about convexity, hedging and no-arbitrage, and they come up in most trading interviews.',
      goals: ['Draw payoffs for calls, puts and common positions', 'Use put–call parity', 'Price an option with a one-step tree and explain risk-neutral pricing', 'Estimate at-the-money prices, and reason with the Greeks'],
      prereq: ['expectation', 'variance', 'distributions'],
      sections: [
        { h: 'Payoffs', blocks: [
          `<p>A <b>call</b> is the right, not the obligation, to buy a stock at the <b>strike</b> K at expiry. A <b>put</b> is the right to sell. At expiry, with stock price S:</p>
           <div class="hb-eq">call = max(S − K, 0) &nbsp;&nbsp; put = max(K − S, 0)</div>
           <p>Options cost a <b>premium</b>, so your profit is the payoff minus what you paid.</p>`,
          { fig: 'plot', x: [70, 130], y: [-20, 30], xl: 'stock at expiry', yl: 'profit', xt: [80, 100, 120], yt: [-10, 0, 10, 20], fns: [{ f: (s) => Math.max(0, s - 100) - 6 }, { f: (s) => Math.max(0, 100 - s) - 6, tone: 'bad', dash: true }], labels: [{ x: 116, y: 18, t: 'call', tone: 'acc' }, { x: 73, y: 25, t: 'put', tone: 'bad' }, { x: 102, y: -12, t: 'lose the premium' }], alt: 'Profit of a long call and a long put at strike 100, each bought for 6.', cap: 'Bought for 6, strike 100. Limited loss, open-ended gain. That kink at the strike is what you\'re paying for.' },
          { widget: 'payoff' },
          { q: 'A call has strike 100, and the stock ends at 115. What is its payoff?', a: 15, hint: 'max(S − K, 0).', sol: '<b>15</b>.' },
          { q: 'A put has strike 100, and the stock ends at 115. What is its payoff?', a: 0, hint: 'max(K − S, 0).', sol: '<b>0</b>.' },
          { q: 'You paid 6 for that call. What is your profit?', a: 9, hint: 'Payoff − premium.', sol: '<b>9</b>.' },
        ] },
        { h: 'Put–call parity', blocks: [
          `<p>Compare two portfolios, with the same strike and expiry. <b>A:</b> long a call, short a put. At expiry, this is worth S − K, whichever way the stock goes. <b>B:</b> long the stock, and borrow K to repay at expiry. This is also worth S − K. The same payoff must have the same price:</p>
           <div class="hb-eq">C − P = S − K e<sup>−rT</sup></div>`,
          { fig: 'plot', x: [70, 130], y: [-30, 30], xl: 'stock at expiry', xt: [80, 100, 120], yt: [-20, 0, 20], fns: [{ f: (s) => Math.max(0, s - 100), tone: 'ok' }, { f: (s) => -Math.max(0, 100 - s), tone: 'bad' }, { f: (s) => s - 100, tone: 'ink', dash: true }], labels: [{ x: 73, y: 3, t: 'long call', tone: 'ok' }, { x: 110, y: -6, t: 'short put', tone: 'bad' }, { x: 76, y: 22, t: 'sum: stock − K' }], alt: 'A long call plus a short put add up to a straight line, the same as stock minus strike.', cap: 'Long call + short put = a straight line. No model is needed: it\'s pure no-arbitrage.' },
          { idea: 'If two things pay the same in every future, they must cost the same today. Otherwise you buy the cheap one, sell the dear one, and pocket the gap. Most of pricing comes from this one idea.' },
          { q: 'With zero rates, S = 100, K = 100 and the call costs 8. What does the put cost?', a: 8, hint: 'C − P = S − K.', sol: '<b>8</b>.' },
          { q: 'With zero rates, S = 105, K = 100 and the call costs 10. What does the put cost?', a: 5, hint: 'P = C − S + K.', sol: '10 − 5 = <b>5</b>.' },
        ] },
        { h: 'Pricing with a tree', blocks: [
          `<p>Suppose a stock at 100 will be at 120 or 80 next period, with zero rates. What's a call with strike 100 worth? You might think you need the probability of going up. You don't.</p>`,
          { fig: 'tree', colW: 150, rowH: 70, leafW: 170, root: { t: '100', kids: [{ p: 'q', t: '120: call pays 20', tone: 'ok' }, { p: '1 − q', t: '80: call pays 0', tone: 'bad' }] }, alt: 'A one-step tree: from 100 up to 120, where the call pays 20, or down to 80, where it pays 0.', cap: 'q isn\'t the real probability. It\'s the probability that makes the stock a fair bet.' },
          { worked: 'replication', q: 'Price that call by building it from stock and cash.', steps: [
            ['Hold Δ shares. What Δ matches the call\'s swing?', 'The call swings 20 and the stock swings 40, so Δ = 0.5.'],
            ['In the down state, 0.5 shares are worth 40, but the call pays 0. What fixes this?', 'Borrow 40 today, and repay it. Then the portfolio pays 0 down and 60 − 40 = 20 up: the same as the call.'],
            ['What does the portfolio cost today?', '0.5 × 100 − 40 = 10.'],
            'So the call must cost <b>10</b>. No probabilities were used, as anyone can buy the replica.',
          ] },
          `<p>The shortcut: find the <b>risk-neutral</b> probability q that makes the stock fair: 100 = 120q + 80(1 − q) gives q = ½. Then the option's price is just its expected payoff under q, discounted.</p>`,
          { q: 'A stock at 100 goes to 120 or 80. What is a call with strike 90 worth? Use zero rates.', a: 15, hint: 'q = ½. Payoffs: 30 and 0.', sol: '½ × 30 = <b>15</b>.' },
          { id: 'm1', q: 'In that tree, the real chance of going up is 90%. What happens to the call\'s value?', opts: [['Nothing: same replica cost'], ['It rises to 18', 'That would let you arbitrage against the replica.'], ['It falls', 'The value isn\'t linked to the real probability.'], ['It depends on your risk appetite', 'Replication doesn\'t need preferences.']], sol: 'The replicating portfolio is fixed by the two outcomes, not by their probabilities. The real drift is already in the stock\'s current price.' },
        ] },
        { h: 'Black–Scholes without the pain', blocks: [
          `<p>Let the tree have many tiny steps, and you get Black–Scholes. The inputs are stock price, strike, time, rates and <b>volatility</b>, the only one you can't look up. Interview tool: for an at-the-money option with zero rates,</p>
           <div class="hb-eq">call ≈ put ≈ 0.4 × S × σ × √T</div>
           <p>It comes from E[max(Z, 0)] = 1/√(2π) ≈ 0.4 for a standard normal Z.</p>`,
          { q: 'S = 100, σ = 25%, T = 1 year. Roughly what is an at-the-money call worth?', a: 10, tol: { abs: 0.1 }, hint: '0.4 × 100 × 0.25 × 1.', sol: '<b>10</b>.' },
          { q: 'S = 100, σ = 20%, T = 3 months. Roughly what is an at-the-money call worth?', a: 4, tol: { abs: 0.05 }, hint: '√T = ½.', sol: '0.4 × 100 × 0.2 × 0.5 = <b>4</b>.' },
          { widget: 'greeks', predict: { q: 'As an at-the-money call approaches expiry, does the option get more or less sensitive to small moves in the stock (its gamma)?', opts: ['More sensitive', 'Less sensitive', 'No change'], then: 'Set the stock near 100, then slide time down to 1 month and watch gamma.' } },
        ] },
        { h: 'The Greeks', blocks: [
          `<table class="hb-table"><tr><th>Greek</th><th>Sensitivity to</th><th>Rule of thumb</th></tr>
            <tr><td>Delta Δ</td><td>stock price</td><td>About 0.5 at the money; roughly P(finishes in the money)</td></tr>
            <tr><td>Gamma Γ</td><td>how delta changes</td><td>Peaks at the money, near expiry</td></tr>
            <tr><td>Vega</td><td>volatility</td><td>Largest at the money, with lots of time</td></tr>
            <tr><td>Theta θ</td><td>time passing</td><td>Long options lose value each day</td></tr></table>
           <p>Delta hedging: hold −Δ shares for each option, and small moves cancel. What's left is gamma against theta. For a delta-hedged long option over one day:</p>
           <div class="hb-eq">P&amp;L ≈ ½ Γ (ΔS)² + θ</div>
           <p>So being long options is a bet that realised volatility beats implied volatility.</p>`,
          { q: 'You\'re long 100 calls, each on one share, with delta 0.5. How many shares do you short to be delta-neutral?', a: 50, hint: '100 × 0.5.', sol: '<b>50</b>.' },
          { q: 'A delta-hedged option has Γ = 0.05, and the stock moves 2. What is the gamma P&L, before theta?', a: 0.1, hint: '½ Γ (ΔS)².', sol: '½ × 0.05 × 4 = <b>0.1</b>.' },
          { market: 'Quick conversion: divide annual volatility by 16 for a typical daily move. Implied vol of 32% means the market is pricing about 2% a day. If you think the stock will move less than that, options are expensive.' },
        ] },
        { h: 'Common positions', blocks: [
          `<table class="hb-table"><tr><th>Position</th><th>Built from</th><th>View</th></tr>
            <tr><td>Straddle</td><td>call + put, same strike</td><td>Big move, either way</td></tr>
            <tr><td>Strangle</td><td>out-of-the-money call + put</td><td>Very big move, more cheaply</td></tr>
            <tr><td>Call spread</td><td>long low call, short high call</td><td>Up, capped, cheaper</td></tr>
            <tr><td>Butterfly</td><td>long 90 and 110, short two 100s</td><td>Stays near 100</td></tr>
            <tr><td>Covered call</td><td>long stock, short call</td><td>Flat or slightly up</td></tr></table>
           <p>A call spread with strikes very close together is almost a <b>digital</b>: a bet that pays 1 if S ends above K. So the slope of call price with strike tells you the market's probability.</p>`,
          { q: 'Using the 0.4 rule, what does an at-the-money straddle cost with S = 100, σ = 20%, T = 1?', a: 16, tol: { abs: 0.2 }, hint: 'Twice the call.', sol: '2 × 8 = <b>16</b>.' },
          { id: 'm2', q: 'Should you ever exercise an American call early, on a stock with no dividends?', opts: [['No: selling is always better'], ['Yes, once it\'s deep in the money', 'You\'d throw away the time value.'], ['Yes, if rates are high', 'High rates make early exercise worse for a call.'], ['Yes, just before expiry', 'At expiry is fine.']], sol: 'A call is worth at least S − Ke<sup>−rT</sup> ≥ S − K, more than exercising gives you. So sell it, or hedge it. Puts and dividend-paying stocks are different.' },
        ] },
      ],
      takeaways: ['Call = max(S − K, 0); put = max(K − S, 0).', 'Parity: C − P = S − Ke<sup>−rT</sup>.', 'Replicate to price: real probabilities don\'t enter.', 'Risk-neutral q makes the stock fair.', 'ATM call ≈ 0.4 S σ √T; straddle ≈ 0.8 S σ √T.', 'Hedged option P&L ≈ ½Γ(ΔS)² + θ.', 'Annual vol/16 ≈ daily move.'],
      explain: { q: 'Why does an option\'s price not depend on the real probability that the stock goes up?', a: 'You can build the option\'s payoff exactly from stock and borrowing. That portfolio has a known cost, whatever the probabilities are. If the option cost anything else, you\'d have a free profit. The market\'s view of direction is already in the stock price.' },
      homework: [
        { lvl: 'core', q: 'S = 100, K = 100, r = 5%, T = 1 and C = 10. What is the put worth?', a: 10 - 100 + 100 * Math.exp(-0.05), tol: { abs: 0.01 }, hint: 'P = C − S + Ke<sup>−rT</sup>.', sol: '10 − 100 + 95.12 = <b>5.12</b>.' },
        { lvl: 'core', q: 'A stock at 100 goes to 110 or 90. With zero rates, what is a call with strike 100 worth?', a: 5, hint: 'q = ½.', sol: '<b>5</b>.' },
        { lvl: 'core', q: 'What is the delta of that call, in the tree?', a: 0.5, hint: 'Call swing/stock swing.', sol: '10/20 = <b>0.5</b>.' },
        { lvl: 'core', q: 'A stock at 100 moves ±10 twice, with zero rates. What is a call with strike 100 worth, using q = ½?', a: 5, hint: 'Ends at 120, 100 or 80, with chances ¼, ½, ¼.', sol: '¼ × 20 = <b>5</b>.' },
        { lvl: 'interview', q: 'S = 50, σ = 40%, T = 3 months. Estimate an at-the-money straddle.', a: 8, tol: { abs: 0.1 }, hint: '0.8 S σ √T.', sol: '0.8 × 50 × 0.4 × 0.5 = <b>8</b>.' },
        { lvl: 'interview', q: 'Calls cost 10.00 at strike 100 and 9.52 at strike 101. What does this imply for the probability that the stock ends above about 100.5?', a: 0.48, tol: { abs: 0.005 }, hint: 'A $1 call spread almost pays $1 if S ends above.', sol: '≈ <b>0.48</b>.' },
        { lvl: 'interview', q: 'Implied vol is 48%. Roughly what daily move, in percent, is that?', a: 3, tol: { abs: 0.05 }, hint: 'Divide by 16.', sol: '<b>3%</b>.' },
        { lvl: 'stretch', q: 'Show that E[max(Z, 0)] = 1/√(2π) for a standard normal Z, and use it to justify the 0.4 rule.', sol: '∫₀<sup>∞</sup> z φ(z) dz = [−φ(z)]₀<sup>∞</sup> = φ(0) = 1/√(2π) ≈ 0.4. For an at-the-money option, S<sub>T</sub> − S ≈ Sσ√T Z, so E[max(S<sub>T</sub> − S, 0)] ≈ 0.4 Sσ√T.' },
        { lvl: 'lab', q: 'Find an option chain for a large stock. Take the at-the-money straddle, and compare its price with 0.8 S σ √T using the listed implied vol. Also read off the market\'s implied daily move.', sol: 'The rule should land within a few percent. If there\'s an earnings date before expiry, the short-dated implied vol will be much higher than the long-dated one: the market is pricing in a jump.' },
      ],
      practice: [['Options topic', '#/topic/options'], ['Options interview questions', '#/search/options']],
    },

    fermi: {
      title: 'Estimation and calibration', minutes: 35,
      why: 'Traders price things with no data, then get paid for being roughly right, quickly, and knowing how wrong they could be. The skill can be taught: it\'s a method and a habit of honest ranges.',
      goals: ['Break any estimate into parts you can guess', 'Combine rough numbers with logs and geometric means', 'Give ranges that really are 90%', 'Turn an estimate into a market'],
      prereq: ['arith', 'variance'],
      sections: [
        { h: 'The method', blocks: [
          { fig: 'flow', alt: 'The Fermi method.', steps: ['Define what\'s asked', 'Split into parts', 'State assumptions', 'Round and multiply', 'Check from another angle', 'Give a range'] },
          `<p>Pick a split where each part is something you have a feel for: population, share of people, frequency, unit size. Say your assumptions out loud, as the interviewer is marking how you think.</p>`,
          { worked: 'petrol stations', q: 'How many petrol stations are there in the UK?', steps: [
            ['What drives demand?', 'Cars. About 33 million in the UK.'],
            ['How often does a car need a fill?', 'About every 2 weeks, so 33m/14 ≈ 2.4 million fills a day.'],
            ['How many fills can one station do?', 'Say a car every 3 minutes for 16 hours: about 300. Allow for busy stations and call it 500.'],
            'So 2.4m/500 ≈ 5,000 stations. As a check, the real figure is a little over 8,000. We\'re within a factor of 2, which is a good result for a Fermi estimate.',
          ] },
          { fig: 'tree', colW: 104, rowH: 36, leafW: 190, root: { t: 'stations', kids: [{ t: 'fills a day', kids: [{ t: 'cars: 33m' }, { t: 'fills per car: 1 per 14 days' }] }, { t: 'per station', kids: [{ t: 'a car every few minutes' }, { t: '16 hours a day' }] }] }, alt: 'A tree splitting stations into fills per day and fills per station.', cap: 'A good split ends in numbers you can defend.' },
        ] },
        { h: 'Working in logs', blocks: [
          `<p>With rough numbers, think in orders of magnitude. To multiply, add the exponents: 3 × 10⁴ × 2 × 10³ = 6 × 10⁷. If your guess for something lies between a and b, use the <b>geometric mean</b> √(ab), not the average. Between 100 and 10,000, your middle guess is 1,000, not 5,000.</p>`,
          { q: 'Something is between 100 and 10,000. What is the geometric mean?', a: 1000, tol: { abs: 0.5 }, hint: '√(100 × 10,000).', sol: '<b>1,000</b>.' },
          { q: '3 × 10⁴ × 2 × 10³ = ?', a: 6e7, tol: { rel: 0.001 }, hint: 'Multiply the leading digits, and add the exponents.', sol: '<b>6 × 10⁷</b>.' },
          `<p>Errors combine in log space. If each of k independent parts could be off by a factor of 2, the total is typically off by 2<sup>√k</sup>, not 2<sup>k</sup>: errors partly cancel, by the √n rule. That's why decomposing helps.</p>`,
          { q: 'You multiply 4 independent estimates, each typically off by a factor of 2. What is the typical overall error factor?', a: 4, tol: { abs: 0.05 }, hint: '2<sup>√4</sup>.', sol: '2² = <b>4</b>, far better than 2⁴ = 16.' },
        ] },
        { h: 'Calibration', blocks: [
          `<p>A <b>90% interval</b> should contain the truth 9 times in 10. Almost everyone's intervals are too narrow: people say 90% and hit around 50%. Luckily, this improves quickly with feedback. A good technique: ask yourself separately "what's the lowest it could plausibly be?" and "the highest?", and bet against yourself at each end.</p>`,
          { fig: 'plot', x: [0.5, 1], y: [0.5, 1], w: 280, h: 260, xl: 'confidence you stated', yl: 'how often you were right', xt: [0.5, 0.7, 0.9], yt: [0.5, 0.7, 0.9], fns: [{ f: (x) => x, tone: 'muted', dash: true }, { f: (x) => 0.5 + 0.35 * (x - 0.5) / 0.5, tone: 'bad' }], labels: [{ x: 0.54, y: 0.64, t: 'perfect' }, { x: 0.72, y: 0.6, t: 'typical person', tone: 'bad' }], alt: 'A calibration plot: the typical person lies below the diagonal.', cap: 'Below the line means overconfident. Your Estimation game score tracks this.' },
          { q: 'You give ten 90% intervals. How many do you expect to miss, if you\'re calibrated?', a: 1, hint: '10%.', sol: '<b>1</b>.' },
          { id: 'm1', q: 'You gave twenty 90% intervals, and missed nine. What should you do?', opts: [['Widen your ranges'], ['Narrow your ranges to be more decisive', 'That would make it worse.'], ['Nothing: missing nine is about right', 'You should have missed about two.'], ['Only answer questions you know', 'Then you can\'t price anything new.']], sol: 'You hit 55% on 90% intervals. Widen them, especially on the side you\'re surest of, and go on measuring.' },
        ] },
        { h: 'From estimate to market', blocks: [
          `<p>A range is a market. If your 90% interval is 40–90 million, your mid is near the geometric mean, about 60 million, and it's roughly ±1.6 sds in logs. Quote around that with a width reflecting your uncertainty, and update when a counterparty trades. That's how Fermi and market-making questions combine.</p>`,
          { id: 'm2', q: 'An interviewer asks "How many cups of coffee a day in the UK? Make me a market." What should you do first?', opts: [['Estimate aloud, then quote wide'], ['Ask for the answer', 'They want to see how you build it.'], ['Quote a tight market, to look confident', 'A tight market on a wild guess will get picked off.'], ['Refuse: you can\'t know', 'Pricing what you can\'t know is the job.']], sol: 'Build it: 68m people, a share who drink coffee, cups per drinker. Then quote wide, since your uncertainty is large, and tighten as you learn.' },
        ] },
      ],
      takeaways: ['Define, split, assume, multiply, check, give a range.', 'Use the geometric mean between a low and a high.', 'k independent factor-of-2 errors combine to about 2<sup>√k</sup>.', 'Most 90% intervals are too narrow. Measure yours.', 'A range is a market: quote wide when you\'re unsure.'],
      explain: { q: 'Why does splitting an estimate into parts help, even if each part is a guess?', a: 'Each part is something you know better than the total, and independent errors partly cancel: in log terms they add like variances. So several rough parts beat one rough guess at the whole.' },
      homework: [
        { lvl: 'core', q: 'What is the geometric mean of 2 and 200?', a: 20, hint: '√400.', sol: '<b>20</b>.' },
        { lvl: 'core', q: 'About how many seconds are there in a year? Give your answer to within 5%.', a: 365.25 * 86400, tol: { rel: 0.05 }, hint: '365 × 24 × 3600.', sol: 'About <b>3.15 × 10⁷</b>. (π × 10⁷ is a nice way to remember it.)' },
        { lvl: 'core', q: 'About how many heartbeats are there in an 80-year life, at 70 a minute? Give your answer to within 30%.', a: 70 * 60 * 24 * 365.25 * 80, tol: { rel: 0.3 }, hint: 'Beats per year × 80.', sol: 'About <b>3 × 10⁹</b>.' },
        { lvl: 'interview', q: 'Estimate the number of barbers in London, out loud and on paper. State your assumptions, your answer and a 90% range. Then check from a second angle.', sol: 'One route: 9m people; half need a cut every 6 weeks, so 3.5m cuts a month or about 150k a working day; at 12 cuts a day, about 12,000 barbers. A range of 5,000 to 25,000 is honest. Second angle: count high streets. About 2,000 town-centre clusters with 5 shops each, and 2 barbers a shop, gives 20,000. They agree within a factor of 2.' },
        { lvl: 'interview', q: 'Estimate the daily trading volume, in dollars, of a large US stock with a market cap of $500 billion. What assumption matters most?', sol: 'Assume about 0.3–0.5% of market cap trades a day: $1.5bn–$2.5bn. The key assumption is annual turnover, around 100% of shares. That lets you sanity-check: $500bn a year/252 days ≈ $2bn.' },
        { lvl: 'stretch', q: 'Why does the geometric mean make more sense than the average when you estimate a positive quantity spanning several orders of magnitude?', sol: 'Your uncertainty is about ratios, not differences: being off by ten times either way is equally bad. So it\'s symmetric in logs, and the midpoint in logs is the geometric mean. The arithmetic mean is dominated by the top of the range.' },
        { lvl: 'lab', q: 'Play 10 rounds of the Estimation game in the app. Count how often the truth fell in your 90% interval. Then play 10 more, widening your ranges. What was your hit rate each time?', sol: 'If your first hit rate is near 50–60%, you\'re normal. Aim for 8 or 9 in 10. It\'s one of the fastest skills to improve.' },
      ],
      practice: [['Estimation game', '#/estimate'], ['Make me a market', '#/quote']],
    },

    games: {
      title: 'Game theory for traders', minutes: 50,
      why: 'Markets, poker and interviews all have other people in them, and those people are thinking too. Game theory tells you how to act when your best move depends on theirs. Poker is the cleanest place to see it.',
      goals: ['Find dominant strategies and Nash equilibria', 'Solve mixed strategies by indifference', 'Compute pot odds and optimal bluffing frequencies', 'Reason backwards, and avoid the winner\'s curse'],
      prereq: ['expectation', 'stopping'],
      sections: [
        { h: 'Dominance and equilibrium', blocks: [
          `<p>A strategy is <b>dominant</b> if it's best whatever the other player does. A <b>Nash equilibrium</b> is a set of strategies where no one gains by changing alone. In the prisoner's dilemma, defecting is dominant, so both defect, even though both would prefer to cooperate.</p>
           <table class="hb-table"><tr><th></th><th>They cooperate</th><th>They defect</th></tr><tr><td>You cooperate</td><td>3, 3</td><td>0, 5</td></tr><tr><td>You defect</td><td>5, 0</td><td>1, 1</td></tr></table>`,
          { id: 'm1', q: 'In the table above, why is (cooperate, cooperate) not an equilibrium?', opts: [['Each gains by defecting'], ['It has the lowest total', 'It has the highest total.'], ['Players can\'t cooperate', 'They can, but it\'s not stable.'], ['The payoffs are equal', 'That\'s not the reason.']], sol: 'From (3, 3), switching to defect gives 5, so it isn\'t stable. Repeating the game changes this: cooperation can then be sustained, which is why long-term relationships matter in markets.' },
        ] },
        { h: 'Mixed strategies', blocks: [
          `<p>Some games have no stable pure choice: in rock–paper–scissors, any fixed strategy loses. You must randomise. The key idea is <b>indifference</b>: mix so that your opponent can't gain by choosing any particular response.</p>`,
          { worked: 'solving a 2×2 game', q: 'You play Row against Column. Payoffs to you: (Top, Left) = 2, (Top, Right) = −1, (Bottom, Left) = −1, (Bottom, Right) = 1. It\'s zero-sum. What mix should you use?', steps: [
            ['Let p = P(Top). What does Column\'s choice of Left give you?', '2p − (1 − p) = 3p − 1.'],
            ['And Right?', '−p + (1 − p) = 1 − 2p.'],
            ['Make Column indifferent.', '3p − 1 = 1 − 2p, so p = 2/5.'],
            'The value is 3(2/5) − 1 = <b>1/5</b> a round to you, whatever Column does.',
          ] },
          { q: 'Solve this game: payoffs to you (T, L) = 3, (T, R) = 0, (B, L) = 0, (B, R) = 1. What is your P(Top)?', a: 0.25, hint: '3p = 1 − p.', sol: '<b>1/4</b>: you rarely play the big-payoff row, as your opponent would avoid it otherwise.' },
          { q: 'What is the value of that game to you?', a: 0.75, hint: '3p.', sol: '<b>3/4</b>.' },
          { idea: 'In equilibrium you randomise to stop being exploited, not because you like the odds. If your opponent departs from equilibrium, you can do better by exploiting them, at the risk of being exploited in turn. That\'s the core trade-off of opponent modelling.' },
        ] },
        { h: 'Bluffing and pot odds', blocks: [
          `<p>Poker's maths is game theory with numbers you can do at the table. To call a bet s into a pot p, you pay s to win p + s. So you need to win at least</p>
           <div class="hb-eq">required equity = s/(p + 2s)</div>
           <p>The bettor wants to make the caller indifferent, so among all bets, the share of bluffs should be exactly this same number. The caller, meanwhile, must call often enough to stop the bettor bluffing freely: a share p/(p + s) of the time.</p>`,
          { fig: 'tree', colW: 120, leafW: 150, root: { kids: [{ p: 'value', t: 'bet', kids: [{ p: 'call', t: 'win p + s', tone: 'ok' }, { p: 'fold', t: 'win p' }] }, { p: 'bluff', t: 'bet', kids: [{ p: 'call', t: 'lose s', tone: 'bad' }, { p: 'fold', t: 'win p', tone: 'ok' }] }] }, alt: 'A tree of a value bet and a bluff, each being called or folded to.', cap: 'A bet carries both hands. Mix them so that the opponent can\'t tell, and can\'t profit from either choice.' },
          { q: 'The pot is 100 and you face a bet of 50. What equity do you need to call?', a: 0.25, hint: 's/(p + 2s).', sol: '50/200 = <b>0.25</b>.' },
          { q: 'You bet the size of the pot. What share of your bets should be bluffs?', a: 1 / 3, tol: { abs: 0.003 }, hint: 'With s = p: p/(3p).', sol: '<b>1/3</b>.' },
          { q: 'The pot is 100 and the bet is 50. How often must the caller continue to stop any bluff from being profitable?', a: 2 / 3, tol: { abs: 0.003 }, hint: 'p/(p + s).', sol: '100/150 = <b>2/3</b>.' },
          { market: 'Traders face the same problem as poker players: every order reveals information. Hide size, randomise timing, and don\'t always trade the same way, or others will trade against your pattern.' },
        ] },
        { h: 'Backward induction', blocks: [
          { worked: 'the pirate vote', q: '5 pirates of strict rank split 100 coins. The top pirate proposes a split; if at least half approve, it stands. If not, the proposer is thrown overboard, and the next proposes. Pirates want to survive, then get coins, then see others thrown over. What does the top pirate propose?', steps: [
            ['Start at the end. Two pirates, D and E: what happens?', 'D gives himself 100: his own vote is half. E gets 0.'],
            ['Three pirates, C, D, E: who can C buy?', 'E gets 0 if C dies, so 1 coin buys E: C 99, D 0, E 1.'],
            ['Four pirates: who\'s cheapest?', 'B needs one more vote. D gets 0 if B dies, so 1 coin buys D: B 99, C 0, D 1, E 0.'],
            ['Five pirates: A needs two more votes.', 'C and E get 0 under B\'s plan, so 1 coin each buys them: A 98, B 0, C 1, D 0, E 1.'],
          ] },
          { q: 'With 3 pirates and 100 coins, how many coins does the top pirate keep?', a: 99, hint: 'One coin buys the pirate who would otherwise get nothing.', sol: '<b>99</b>.' },
        ] },
        { h: 'Auctions and the winner\'s curse', blocks: [
          `<p>In a <b>second-price auction</b>, you pay the second-highest bid, so bidding your true value is dominant: it can't help to change the price you pay. In a <b>first-price auction</b>, you shade your bid. With 2 bidders and uniform values, bid v/2.</p>
           <p>When the item has one true value that no bidder knows (a company, an oil field, a block of stock), winning is bad news: you're the one who estimated highest. That's the <b>winner's curse</b>. Bid as if you've won.</p>`,
          { worked: 'buying a company', q: 'A firm is worth V, uniform on [0, 100], to its owner, and you know how to make it worth 1.5V. The owner knows V; you don\'t. They\'ll sell if your bid b exceeds V. What should you bid?', steps: [
            ['If your bid is accepted, what do you learn about V?', 'V &lt; b, so V is uniform on [0, b], averaging b/2.'],
            ['What\'s it worth to you, given it was accepted?', '1.5 × b/2 = 0.75b.'],
            'You pay b for something worth 0.75b, at any b. So the right bid is <b>0</b>.',
          ] },
          { q: 'What is the best bid in that game, in dollars?', a: 0, hint: 'E[worth | accepted] = 0.75b.', sol: '<b>0</b>.' },
          { q: 'First-price auction, 2 bidders, uniform values on [0, 1]. Your value is 0.8. What do you bid?', a: 0.4, hint: 'v/2.', sol: '<b>0.4</b>.' },
          { id: 'm2', q: 'A block of stock is offered to you, cheap, by a seller who approached only you. What is the right first thought?', opts: [['Why is it being sold to me?'], ['A bargain: buy before anyone else does', 'That\'s the winner\'s curse.'], ['Offer more, to be sure of getting it', 'That makes it worse.'], ['It must be fair, as markets are efficient', 'This offer is selected against you.']], sol: 'A trade is information. Offers that reach you are selected: the good ones were taken by others, or the seller knows more. Condition on the fact that it reached you.' },
        ] },
        { h: 'Thinking about thinking', blocks: [
          `<p>Keynes compared markets to a contest where you must pick what others will pick. Everyone guesses a number from 0 to 100, and the winner is closest to ⅔ of the average. Pure logic says 0: each round of reasoning cuts the bound by ⅔. Real groups average near 30. The right answer depends on how many steps others really think, which is why equilibrium is a benchmark, not a forecast.</p>`,
          { id: 'm3', q: 'In the ⅔-of-the-average game with ordinary people, what\'s a sensible guess?', opts: [['Around 20'], ['0: the equilibrium', 'Only right if everyone reasons all the way.'], ['67: two-thirds of the maximum', 'That\'s one step, and only if the others average 100.'], ['50: the middle', 'That ignores the ⅔.']], sol: 'If typical players pick about 33, then ⅔ of that is 22. You win by being one step ahead of the crowd, not infinitely many. Good trading is similar.' },
        ] },
      ],
      takeaways: ['Dominant strategies and Nash equilibrium: no one gains by moving alone.', 'Mixed strategies come from making the opponent indifferent.', 'Pot odds: need s/(p + 2s). Bluff share is the same number; defend p/(p + s).', 'Work backwards.', 'Second-price: bid your value. Common value: bid as if you\'ve won.', 'Equilibrium is a benchmark: exploit real behaviour, carefully.'],
      explain: { q: 'How would you explain the trade-off between playing equilibrium and exploiting an opponent, using your own project if you have one?', a: 'Equilibrium can\'t be beaten, but it also leaves profit on the table against mistakes. Exploiting a modelled weakness earns more, but it changes your own strategy, which opens you up if the model is wrong or the opponent adapts. A sound approach sizes the deviation by confidence in the model: start near equilibrium, and shift gradually as evidence builds.' },
      homework: [
        { lvl: 'core', q: 'Matching pennies: you win 1 if the coins match, and lose 1 if not. What is your equilibrium P(heads)?', a: 0.5, hint: 'Symmetry.', sol: '<b>½</b>.' },
        { lvl: 'core', q: 'Payoffs to you: (T, L) = 3, (T, R) = −1, (B, L) = −1, (B, R) = 1. What is your P(Top)?', a: 1 / 3, tol: { abs: 0.003 }, hint: '4p − 1 = 1 − 2p.', sol: '<b>1/3</b>.' },
        { lvl: 'core', q: 'The pot is 120, and the bet is 60. What equity do you need to call?', a: 0.25, hint: 's/(p + 2s).', sol: '60/240 = <b>0.25</b>.' },
        { lvl: 'core', q: 'The bet is the size of the pot. What share of the time must you defend?', a: 0.5, hint: 'p/(p + s).', sol: '<b>½</b>.' },
        { lvl: 'interview', q: 'You bet twice the pot. What share of your bets should be bluffs?', a: 0.4, hint: 's = 2p, so 2p/(5p).', sol: '<b>0.4</b>.' },
        { lvl: 'interview', q: 'With 5 pirates and 100 coins, as in the worked example, how many coins does the top pirate keep?', a: 98, hint: 'Buy two votes at 1 coin each.', sol: '<b>98</b>.' },
        { lvl: 'interview', q: 'Rock–paper–scissors, but rock beating scissors pays 2 (and scissors losing costs 2). All other wins pay 1. What is the equilibrium probability of paper?', a: 0.5, hint: 'Let the probabilities of R, P and S be r, p and s. Each reply must earn 0: rock earns 2s − p, paper earns r − s, and scissors earns p − 2r.', sol: 'So r = s and p = 2s, which gives r = s = ¼ and p = <b>½</b>. Raising the prize on rock makes rock no more common: paper is what changes.' },
        { lvl: 'stretch', q: 'Kuhn poker: each of two players antes 1 and gets one card from {J, Q, K}. Player 1 may check or bet 1. Why must Player 1 sometimes bet the worst hand, J?', sol: 'If Player 1 only bet K, Player 2 would fold everything but K to a bet, and K would win nothing extra. Bluffing J some of the time keeps Player 2 calling. In equilibrium Player 1 bets J with some probability α up to ⅓, and K at 3α, and always checks Q. Player 2 always calls with K, and calls with Q a third of the time. Player 1\'s value is −1/18. Even the smallest poker game needs mixing.' },
        { lvl: 'lab', q: 'Play Figgie in the app, or a few rounds of rock–paper–scissors against a friend, and try to spot and exploit a pattern. Then write down what they could have noticed about you.', sol: 'Humans repeat winning moves and switch after losses. Exploiting that wins, until they notice. It\'s the same adaptive loop that opponent modelling tries to automate.' },
      ],
      practice: [['Two-card poker', '#/iq/fr-poker'], ['Pirate vote', '#/iq/tib-pirates'], ['Figgie', '#/figgie']],
    },
  });
})();
