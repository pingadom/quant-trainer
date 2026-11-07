// Handbook, Part 2: Interview probability. See handbook-content.js for how chapters are structured.
// Checks without an `id` keep their original order, so saved progress still matches them.
(function () {
  const Fig = QT.hbFig, N = Fig.normal();
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
  const binom = (n, p) => Array.from({ length: n + 1 }, (_, k) => choose(n, k) * p ** k * (1 - p) ** (n - k));
  const fact = (n) => (n < 2 ? 1 : n * fact(n - 1));
  const PATH = [0, 1, 2, 3, 2, 3, 2, 1, 2, 1, 2, 1, 0, 1, 2]; // for the reflection principle

  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    distributions: {
      title: 'The distributions you need', minutes: 50,
      why: 'Most random things in interviews and in markets are one of five shapes. Recognise the shape from the story, and you get the mean, the variance and a formula for free.',
      goals: ['Recognise the binomial, geometric, Poisson, exponential and normal from a description', 'Know each one\'s mean and variance without looking them up', 'Use the normal\'s 68–95–99.7 rule for quick probabilities', 'See how the five connect to each other'],
      prereq: ['expectation', 'variance'],
      sections: [
        { h: 'Binomial: counting successes', blocks: [
          `<p>n independent trials, each a success with probability p. The number of successes X is <b>binomial</b>:</p>
           <div class="hb-eq">P(X = k) = C(n, k) p<sup>k</sup>(1 − p)<sup>n − k</sup> &nbsp;&nbsp; mean np &nbsp;&nbsp; variance np(1 − p)</div>
           <p>Each part has a job: p<sup>k</sup>(1 − p)<sup>n − k</sup> is the chance of one particular sequence, and C(n, k) counts the sequences. It's a sum of n independent 0/1 variables, which is where the mean and variance come from.</p>`,
          { fig: 'bars', vals: binom(10, 0.5), labs: [...Array(11).keys()], tone: (i) => (i === 3 ? 'bad' : ''), xl: 'heads in 10 flips', alt: 'Binomial distribution of heads in 10 flips, peaked at 5.', cap: 'Heads in 10 fair flips. Each bar is C(10, k)/1024.' },
          { widget: 'dist' },
          { q: 'A fair coin is flipped 10 times. What is the probability of exactly 3 heads?', a: 120 / 1024, tol: { abs: 0.001 }, hint: 'C(10, 3) ways, each with probability (½)¹⁰.', sol: 'C(10, 3)/2¹⁰ = 120/1024 ≈ <b>0.117</b>.' },
          { q: 'What is the standard deviation of the number of heads in 400 fair flips?', a: 10, hint: '√(np(1 − p)).', sol: '√(400 × ¼) = √100 = <b>10</b>.' },
        ] },
        { h: 'Geometric: waiting for the first success', blocks: [
          `<p>Repeat independent trials until the first success. The number of trials is <b>geometric</b>: P(first success on trial k) = (1 − p)<sup>k − 1</sup>p, with mean 1/p and variance (1 − p)/p². "On average you wait 1/p tries" answers a surprising number of interview questions.</p>`,
          { proof: 'Let E be the expected wait. The first trial succeeds with probability p, or fails and leaves you where you started: E = 1 + (1 − p)E, so E = 1/p. This is first-step analysis, which has its own chapter soon.' },
          { q: 'You roll a die until it shows a 1 or a 2. What is the expected number of rolls?', a: 3, hint: 'Each roll succeeds with probability 2/6.', sol: 'p = 1/3, so 1/p = <b>3</b>.' },
        ] },
        { h: 'Poisson: counting rare events', blocks: [
          `<p>When events happen independently at a steady average rate λ per unit of time (trades, arrivals, typos), the count in one unit is <b>Poisson</b>: P(X = k) = e<sup>−λ</sup> λ<sup>k</sup>/k!. Mean and variance are both λ.</p>
           <p>It's the limit of a binomial with many trials and a small p, with λ = np. So "1,000 lots, each with a 0.2% chance of failing" is Poisson with λ = 2, and sums of independent Poissons are Poisson with the rates added.</p>`,
          { fig: 'bars', vals: [...Array(11).keys()].map((k) => Math.exp(-3) * 3 ** k / fact(k)), labs: [...Array(11).keys()], xl: 'events in a period, λ = 3', alt: 'Poisson distribution with rate 3, peaked at 2 and 3.', cap: 'Poisson with λ = 3. The spread grows with the rate: the standard deviation is √λ.' },
          { q: 'Trades arrive at an average of 2 a minute, independently. What is the probability of no trades in a given minute?', a: Math.exp(-2), tol: { abs: 0.002 }, hint: 'P(X = 0) = e<sup>−λ</sup>.', sol: 'e<sup>−2</sup> ≈ <b>0.135</b>.' },
        ] },
        { h: 'Exponential: waiting times with no memory', blocks: [
          `<p>The time between Poisson events is <b>exponential</b> with rate λ: P(T &gt; t) = e<sup>−λt</sup>, mean 1/λ. It's <b>memoryless</b>: P(T &gt; s + t | T &gt; s) = P(T &gt; t). Having already waited doesn't change how much longer you'll wait. That breaks most people's intuition.</p>`,
          { fig: 'plot', x: [0, 30], y: [0, 1], xl: 'minutes waited', yl: 'P(still waiting)', xt: [0, 10, 20, 30], yt: [0, 0.5, 1], fns: [{ f: (t) => Math.exp(-t / 10) }, { f: (t) => Math.exp(-(t - 10) / 10), from: 10, tone: 'bad', dash: true }], labels: [{ x: 15, y: 0.7, t: 'restart at 10: the same curve', tone: 'bad' }], alt: 'An exponential survival curve, and the same curve restarted at 10 minutes.', cap: 'Restart the clock at any point and the curve from there is the same shape. Only the exponential has this property.' },
          { q: 'Buses arrive as a Poisson process, one every 10 minutes on average. You have already waited 5 minutes. How many more minutes do you expect to wait?', a: 10, hint: 'Memorylessness.', sol: 'Still <b>10</b> minutes: the process doesn\'t remember how long you\'ve been there.' },
          { id: 'm1', q: 'Buses run exactly every 10 minutes, and you turn up at a random time. How long do you expect to wait, and how does that compare with Poisson buses at the same rate?', opts: [['5 minutes, half the Poisson wait'], ['10 minutes, the same as Poisson', 'With a regular timetable, you land somewhere in a 10-minute gap.'], ['5 minutes, the same as Poisson', 'A Poisson wait from a random moment averages 10 minutes.'], ['10 minutes, twice the Poisson wait', 'Try the uniform gap: what is its mean?']], sol: 'A random arrival in a fixed 10-minute gap waits 5 on average. Poisson gaps vary, and you\'re more likely to land in a long one, so you wait longer: the inspection paradox.' },
        ] },
        { h: 'The normal distribution', blocks: [
          `<p>Sums of many small independent effects are approximately <b>normal</b>. For a normal with mean μ and standard deviation σ: about 68% lies within 1σ, 95% within 2σ, and 99.7% within 3σ. To use it, <b>standardise</b>: z = (x − μ)/σ.</p>`,
          { fig: 'plot', x: [-3.6, 3.6], y: [0, 0.44], xt: [[-2, '−2σ'], [-1, '−1σ'], [0, 'μ'], [1, '+1σ'], [2, '+2σ']], fns: [{ f: N, tone: 'ink' }], area: [{ f: N, from: -2, to: 2, tone: 'acc-soft' }, { f: N, from: -1, to: 1, tone: 'ok-soft' }], labels: [{ x: 0, y: 0.18, t: '68%', a: 'middle' }, { x: 1.5, y: 0.03, t: '95% in all', a: 'middle' }, { x: 2.75, y: 0.06, t: '2.5%', a: 'middle' }, { x: -2.75, y: 0.06, t: '2.5%', a: 'middle' }], alt: 'The bell curve with the central 68 and 95 percent shaded.', cap: 'The rule to carry in your head: 68–95–99.7, with 2.5% in each tail beyond 2σ.' },
          { q: 'X is normal with mean 100 and standard deviation 15. Roughly what is P(X > 130)?', a: 1 - 0.97725, tol: { abs: 0.003 }, hint: '130 is 2 standard deviations above the mean; 95% lies within ±2σ.', sol: 'z = 2. 5% lies outside ±2σ, half of it above: ≈ <b>0.025</b> (exactly 0.0228).' },
          { market: 'Real returns have fatter tails than the normal. A 5σ day should come about once in 7,000 years if returns were normal, yet markets deliver them every few years. Use the normal for quick reasoning, and never to size risk on its own.' },
        ] },
        { h: 'How they connect', blocks: [
          `<table class="hb-table"><tr><th>Name</th><th>The story</th><th>Mean</th><th>Variance</th></tr>
           <tr><td>Bernoulli</td><td>one yes/no trial</td><td>p</td><td>p(1 − p)</td></tr>
           <tr><td>Binomial</td><td>successes in n trials</td><td>np</td><td>np(1 − p)</td></tr>
           <tr><td>Geometric</td><td>trials to first success</td><td>1/p</td><td>(1 − p)/p²</td></tr>
           <tr><td>Poisson</td><td>events at rate λ</td><td>λ</td><td>λ</td></tr>
           <tr><td>Exponential</td><td>time between events</td><td>1/λ</td><td>1/λ²</td></tr>
           <tr><td>Uniform [a, b]</td><td>equally likely over a range</td><td>(a + b)/2</td><td>(b − a)²/12</td></tr>
           <tr><td>Normal</td><td>sum of many small effects</td><td>μ</td><td>σ²</td></tr></table>`,
          { fig: 'flow', alt: 'How distributions connect.', steps: ['Bernoulli', 'sum of n: Binomial', 'n large, p small: Poisson', 'gaps between events: Exponential'], cap: 'And the other way: a binomial with n large and p not small is close to a normal.' },
          { worked: 'spot the distribution', q: 'A desk gets on average 0.5 large orders an hour, independently. What is the chance of at least 2 in a 4-hour session?', steps: [
            ['What is the story?', 'Independent events at a steady rate, so Poisson.'],
            ['What is λ for 4 hours?', '0.5 × 4 = 2.'],
            ['"At least 2" is awkward. What is the complement?', '0 or 1 events: e<sup>−2</sup>(1 + 2) = 3e<sup>−2</sup> ≈ 0.406.'],
            'So the answer is 1 − 0.406 ≈ 0.594.',
          ] },
          { id: 'm2', q: 'You count how many of 50 stocks rose today. Which distribution should you be careful about using, and why?', opts: [['Binomial: trials are dependent'], ['Binomial, as p is too small', 'p near ½ is fine for a binomial.'], ['Binomial, as n is too large', 'Size isn\'t the issue.'], ['No problem at all: it\'s a binomial count', 'The market moves them together.']], sol: 'The binomial needs independent trials. Stocks share a market factor, so the count is far more spread out than a binomial predicts. Always check the assumptions, not just the shape.' },
        ] },
      ],
      takeaways: ['Binomial: successes in n trials; mean np, variance np(1 − p).', 'Geometric: trials until the first success; mean 1/p.', 'Poisson: rare events at rate λ; mean = variance = λ.', 'Exponential: memoryless waiting; mean 1/λ.', 'Normal: 68–95–99.7; standardise with z = (x − μ)/σ.', 'Check independence before trusting a formula.'],
      explain: { q: 'What does it mean for a waiting time to be memoryless? Give an example that is, and one that isn\'t.', a: 'The remaining wait has the same distribution however long you\'ve already waited. The time until the next trade in a Poisson flow is memoryless. The time until the next scheduled train isn\'t: the longer you\'ve waited, the sooner it comes.' },
      homework: [
        { lvl: 'core', q: 'You roll a die 5 times. What is the probability of exactly 2 sixes?', a: 10 * 125 / 7776, tol: { abs: 0.002 }, hint: 'C(5, 2)(1/6)²(5/6)³.', sol: '10 × 125/7776 ≈ <b>0.161</b>.' },
        { lvl: 'core', q: 'X is Poisson with λ = 3. What is P(X ≤ 1)?', a: 4 * Math.exp(-3), tol: { abs: 0.002 }, hint: 'P(0) + P(1).', sol: 'e⁻³(1 + 3) ≈ <b>0.199</b>.' },
        { lvl: 'core', q: 'Each attempt succeeds with probability 0.2. What is the probability that you need more than 3 attempts?', a: 0.512, hint: 'That means the first 3 all fail.', sol: '0.8³ = <b>0.512</b>.' },
        { lvl: 'core', q: 'Waits are exponential with a mean of 10 minutes. What is P(wait > 20 minutes)?', a: Math.exp(-2), tol: { abs: 0.002 }, hint: 'e<sup>−t/mean</sup>.', sol: 'e⁻² ≈ <b>0.135</b>.' },
        { lvl: 'core', q: 'X is normal with mean 50 and sd 10. Roughly what is P(30 &lt; X &lt; 70)?', a: 0.9545, tol: { abs: 0.01 }, hint: 'That\'s ±2σ.', sol: 'About <b>0.95</b>.' },
        { lvl: 'interview', q: '500 flights each lose a bag with probability 1%, independently. Roughly what is the chance that no bags are lost?', a: Math.exp(-5), tol: { abs: 0.0005 }, hint: 'Poisson with λ = 5.', sol: 'e⁻⁵ ≈ <b>0.0067</b>.' },
        { lvl: 'interview', q: 'Buy orders arrive as Poisson with rate 2 a minute, and sell orders as Poisson with rate 3 a minute, independently. What is the variance of the total orders in a minute?', a: 5, hint: 'Poissons add.', sol: 'The total is Poisson(5), so the variance is <b>5</b>.' },
        { lvl: 'stretch', q: 'Prove that the exponential is memoryless, and show that the geometric is too.', sol: 'P(T > s + t | T > s) = e<sup>−λ(s+t)</sup>/e<sup>−λs</sup> = e<sup>−λt</sup>. For the geometric, P(X > m + n | X > m) = (1 − p)<sup>m+n</sup>/(1 − p)<sup>m</sup> = (1 − p)<sup>n</sup>.' },
        { lvl: 'lab', q: 'Sit near a road or a window for 10 minutes and write down the time of every passing car (or use arrivals on a live trade feed). Count arrivals per minute. Is the variance close to the mean, as a Poisson would predict?', sol: 'If the variance is much larger than the mean, arrivals are clustered: traffic lights, or in markets, bursts of orders. Real order flow is strongly clustered, so a Poisson model is only a starting point.' },
      ],
      practice: [['Distributions topic', '#/topic/dist'], ['Formula cards', '#/flashcards']],
    },

    symmetry: {
      title: 'Symmetry and clever counting', minutes: 45,
      why: 'Interviewers love problems that are long if you grind and one line if you look. The look is nearly always symmetry: ask what can\'t matter, and let that do the work.',
      goals: ['Spot symmetries that make an answer obvious', 'Use indicator variables on harder counting questions', 'Use the "equal gaps" argument for positions in a random order'],
      prereq: ['expectation', 'counting'],
      sections: [
        { h: 'Symmetry first', blocks: [
          `<p>Before calculating, ask what can't matter. In a shuffled deck, the ace of spades is equally likely to be above or below the king of spades. Two players with identical chances have identical win probabilities. Symmetry often gives the answer outright, or reduces it to "½ of what's left".</p>`,
          { q: 'A deck is shuffled. What is the probability the ace of spades is above the king of spades?', a: 0.5, hint: 'Swap the two cards.', sol: 'Swapping them maps every arrangement to one with the opposite order: <b>½</b>.' },
          { q: '4 fair coin flips. What is the probability of more heads than tails?', a: 5 / 16, hint: 'More heads, more tails, or a tie. The first two are symmetric.', sol: 'P(tie) = C(4, 2)/16 = 6/16. The rest splits evenly: (1 − 6/16)/2 = <b>5/16</b>.' },
          { worked: 'the clever one', q: 'You and I each flip fair coins: you flip 11, I flip 10. What is the chance you get more heads than me?', steps: [
            ['Set your last coin aside. Compare your first 10 with my 10. What are the three cases?', 'You\'re ahead, you\'re behind, or you\'re tied. By symmetry, ahead and behind have the same probability; call it a. The tie has probability t, with 2a + t = 1.'],
            ['Now add your last coin. When do you finish with more heads?', 'If you were ahead (you stay ahead), or if you were tied and the last coin is a head.'],
            'So P = a + t/2 = (2a + t)/2 = <b>½</b>, without computing anything.',
          ] },
        ] },
        { h: 'Indicators for harder counts', blocks: [
          `<p>Linearity plus indicators handles counts that look hopeless. The number of runs in a sequence of flips is 1 plus the number of places where a flip differs from the one before. The number of empty boxes is a sum of "box i is empty" indicators.</p>`,
          { fig: 'strip', cell: 30, labelW: 80, rows: [{ label: 'flips', cells: ['H', 'H', 'T', 'H', 'T', 'T', 'H', 'H'] }, { label: 'switch?', cells: [{ gap: true }, 0, { t: 1, tone: 'acc' }, { t: 1, tone: 'acc' }, { t: 1, tone: 'acc' }, 0, { t: 1, tone: 'acc' }, 0] }], alt: 'Eight flips with a switch indicator at each position.', cap: '4 switches, so 5 runs: HH, T, H, TT, HH. Runs = switches + 1.' },
          { q: 'A coin is flipped 10 times. What is the expected number of runs (maximal blocks of the same side, e.g. HHTH has 3)?', a: 5.5, hint: 'Runs = 1 + the number of switches between consecutive flips.', sol: '9 adjacent pairs, each a switch with probability ½: 1 + 9 × ½ = <b>5.5</b>.' },
          { q: '10 balls are dropped independently into 10 boxes. What is the expected number of empty boxes?', a: 10 * 0.9 ** 10, tol: { abs: 0.02 }, hint: 'Each box is empty with probability (9/10)¹⁰.', sol: '10 × 0.9¹⁰ ≈ 10 × 0.349 ≈ <b>3.49</b>.' },
        ] },
        { h: 'Equal gaps', blocks: [
          `<p>Place K special items at random among N in a row (say aces in a deck). By symmetry, the K items split the other N − K into K + 1 gaps of equal expected size: no gap is special, so they must all average the same.</p>`,
          { fig: 'strip', cell: 18, rows: [{ cells: ['', '', '', '', '', { t: 'A', tone: 'acc' }, '', '', '', '', '', '', '', { t: 'A', tone: 'acc' }, '', '', { t: 'A', tone: 'acc' }, '', '', '', '', { t: 'A', tone: 'acc' }, '', '', ''] }], wide: true, alt: 'A row of cards with four aces splitting it into five gaps.', cap: 'Four aces split 48 other cards into 5 gaps, each of average size 48/5 = 9.6.' },
          `<p>So the first special item appears on average at position (N − K)/(K + 1) + 1 = (N + 1)/(K + 1).</p>`,
          { q: 'Turning over a shuffled deck, at what position does the first heart appear on average?', a: 53 / 14, tol: { abs: 0.01 }, hint: '13 hearts split the 39 other cards into 14 gaps.', sol: '(52 + 1)/(13 + 1) = 53/14 ≈ <b>3.79</b>.' },
          { id: 'a1', q: 'At what position does the last ace appear on average?', a: 4 * 53 / 5, tol: { abs: 0.01 }, hint: 'By symmetry, count the same gap from the far end, or add four gaps and four aces.', sol: '4 × 53/5 = <b>42.4</b>. From the far end it\'s the mirror image of 10.6.' },
        ] },
        { h: 'Symmetric thinking in a harder puzzle', blocks: [
          { worked: 'the plane seats', q: '100 passengers board a full plane. The first has lost their ticket and sits at random. Everyone after takes their own seat if free, otherwise a random free seat. What is the chance the last passenger gets their own seat?', steps: [
            ['What decides the outcome? Think about which seats matter.', 'Only seat 1 (the lost passenger\'s) and seat 100 (the last passenger\'s). As soon as anyone sits in one of those, the outcome is settled.'],
            ['When someone has to choose at random, how do those two seats compare?', 'They\'re both free and treated the same: whoever chooses is equally likely to pick either.'],
            'So seat 1 and seat 100 are equally likely to be taken first, and the last passenger gets their seat with probability <b>½</b>.',
          ] },
          { idea: 'When a calculation looks like it depends on 100 people, look for the two things that actually matter, and ask whether anything distinguishes them.' },
          { id: 'm1', q: 'Three people draw straws in turn from 3, one short. Is it better to draw first?', opts: [['No, each has a 1/3 chance'], ['Yes: the first has the most straws to choose from', 'More straws also means a smaller share of them are short.'], ['No, it\'s better to go last', 'The last draw has a 1/3 chance too.'], ['Yes: the chance falls with each draw', 'Work out the second person: 2/3 × 1/2.']], sol: 'Imagine laying out the straws in the order drawn: every position is equally likely to hold the short one. So the order doesn\'t matter.' },
        ] },
      ],
      takeaways: ['Ask what can\'t matter: symmetry often gives the answer outright.', 'Ties break symmetry: (1 − P(tie))/2.', 'Write counts as sums of indicators.', 'K random special items among N: the first is at (N + 1)/(K + 1) on average.'],
      explain: { q: 'Give the one-sentence argument for why the first ace in a shuffled deck comes at position 53/5 on average.', a: 'The four aces split the 48 other cards into five gaps, which are interchangeable by symmetry, so each averages 48/5 cards, and the first ace comes right after the first gap: 48/5 + 1 = 53/5.' },
      homework: [
        { lvl: 'core', q: 'Two dice: what is the probability that the first shows more than the second?', a: 5 / 12, tol: { abs: 0.002 }, hint: 'First, find the chance of a tie.', sol: '(1 − 1/6)/2 = <b>5/12</b>.' },
        { lvl: 'core', q: '5 fair flips: what is the probability of more heads than tails?', a: 0.5, hint: 'Can there be a tie?', sol: 'With an odd count no tie is possible, so <b>½</b>.' },
        { lvl: 'core', q: '20 balls go into 5 boxes at random. What is the expected number of empty boxes?', a: 5 * 0.8 ** 20, tol: { abs: 0.002 }, hint: '(4/5)²⁰ for each box.', sol: '5 × 0.8²⁰ ≈ <b>0.058</b>.' },
        { lvl: 'core', q: 'In a random ordering of 1 to 10, what is the expected number of positions where a number is larger than the one after it?', a: 4.5, hint: '9 adjacent pairs.', sol: 'Each pair is out of order with probability ½: <b>4.5</b>.' },
        { lvl: 'interview', q: 'In a shuffled deck, what is the expected number of adjacent pairs with the same colour?', a: 25, tol: { abs: 0.01 }, hint: '51 pairs. Given the first card\'s colour, what is the chance that the next matches?', sol: '51 × 25/51 = <b>25</b>.' },
        { lvl: 'interview', q: 'A hand of 13 cards is dealt. What is the expected number of aces?', a: 1, hint: 'Each ace is in your hand with probability ¼.', sol: '4 × ¼ = <b>1</b>.' },
        { lvl: 'interview', q: 'N ants sit on a 1-metre stick, each walking left or right at 1 m/min. When two meet, they both turn around. What is the longest possible time until all ants have fallen off, in minutes?', a: 1, hint: 'Ants are identical. What does a collision look like if you ignore which ant is which?', sol: 'A collision looks exactly like the ants passing through each other. So each "ghost" walks straight off, in at most <b>1 minute</b>.' },
        { lvl: 'stretch', q: 'A round table has n seats, with n people sitting at random. Show that the expected number of people whose left neighbour is their friend, when each has exactly 2 friends in the room, is 2n/(n − 1).', sol: 'Each person\'s left neighbour is one of the n − 1 others, equally likely. So the chance it\'s a friend is 2/(n − 1). Add over n people.' },
        { lvl: 'lab', q: 'Take a pack. Shuffle and record the position of the first ace 10 times, then the position of the first heart 10 times. Which is closer to its prediction of 10.6 or 3.79, and why?', sol: 'The heart usually lands closer. Its spread is smaller, since it\'s a smaller quantity with less room to vary, so ten trials pin it down better.' },
      ],
      practice: [['Puzzles topic', '#/topic/puzzles'], ['Classic puzzles', '#/bank/common'], ['Ants on a stick', '#/iq/wc-ants']],
    },

    recursion: {
      title: 'First-step analysis', minutes: 45,
      why: 'This is the single most reusable method in interview probability. If a problem has "keep going until…" in it, you almost certainly solve it by writing the answer in terms of itself.',
      goals: ['Write an equation for an unknown by conditioning on what happens first', 'Solve waiting-time and win-probability problems this way', 'Handle patterns of coin flips, including overlapping ones'],
      prereq: ['expectation', 'conditional', 'toolkit'],
      sections: [
        { h: 'Condition on the first step', blocks: [
          `<p>Call the answer E (or p). Ask what can happen on the first step, and what the problem looks like afterwards. Often it looks like the original problem again, so E appears on both sides.</p>`,
          { fig: 'flow', alt: 'The recipe for first-step analysis.', steps: ['Name the unknown', 'List what can happen first', 'Say what the problem becomes', 'Write the equation', 'Solve'] },
          { worked: 'expected rolls for a six', q: 'How many rolls of a die do you expect to need to get a six?', steps: [
            ['Name the unknown.', 'E = the expected number of rolls.'],
            ['What can happen on the first roll?', 'A six, probability 1/6, and you\'re done. Otherwise, probability 5/6, and you\'re back at the start, with one roll used.'],
            ['Write the equation.', 'E = 1 + (5/6)E. The 1 is the roll you just used.'],
            'Solve: E/6 = 1, so E = 6.',
          ] },
          { q: 'A and B take turns rolling a die, A first. The first to roll a six wins. What is A\'s chance of winning?', a: 6 / 11, hint: 'If neither of the first two rolls is a six, A is back where she started: p = 1/6 + (5/6)(5/6)p.', sol: 'p = (1/6)/(1 − 25/36) = (1/6)/(11/36) = <b>6/11</b>.' },
        ] },
        { h: 'Patterns of flips', blocks: [
          `<p>To find the expected wait for a pattern, track how much of it you've built so far. Each state gets an equation. Patterns that overlap with themselves (like HTH, which starts again with its own last H) take longer than ones that don't.</p>`,
          { fig: 'states', w: 420, h: 150, r: 22, nodes: { s: [50, 85, '0'], h: [170, 85, 'H'], hh: [290, 85, 'HH'], d: [390, 85, 'HHH', 'ok'] }, edges: [['s', 'h', '½'], ['h', 'hh', '½'], ['hh', 'd', '½'], ['h', 's', '½', 26], ['hh', 's', '½', 46]], loops: [['s', '½', 'top']], alt: 'States 0, H, HH and HHH. A head moves one step right; a tail returns to 0.', cap: 'Waiting for HHH: a head moves you right, and a tail always sends you back to the start.' },
          { worked: 'a self-overlapping pattern', q: 'What is the expected number of flips to see HTH?', steps: [
            ['What are the states?', 'Nothing useful (E₀), just seen H (E₁), just seen HT (E₂).'],
            ['From the start: heads goes to E₁, tails stays. Write it.', 'E₀ = 1 + ½E₁ + ½E₀, so E₀ = 2 + E₁.'],
            ['From H: heads keeps you at H (that H still counts), tails moves on.', 'E₁ = 1 + ½E₁ + ½E₂, so E₁ = 2 + E₂.'],
            ['From HT: heads finishes. What does tails do?', 'HTT has no useful ending, so back to the start: E₂ = 1 + ½ × 0 + ½E₀.'],
            'Substitute: E₀ = 2 + 2 + 1 + ½E₀, so E₀ = 10.',
          ] },
          { q: 'What is the expected number of fair coin flips until you first see HT?', a: 4, hint: 'Once you have an H, you only need a T: wait for an H (2 flips), then a T (2 more).', sol: '2 + 2 = <b>4</b>. An H that follows an H doesn\'t lose progress.' },
          { q: 'And until HHH?', a: 14, hint: 'States 0, H, HH. A tail always sends you back to the start.', sol: 'E₂ = 1 + ½E₀, E₁ = 1 + ½E₂ + ½E₀, E₀ = 1 + ½E₁ + ½E₀. Solving gives E₀ = <b>14</b> (= 2 + 4 + 8).' },
          { id: 'm1', q: 'Why is the wait for HH (6) longer than the wait for HT (4), when each is equally likely at any given spot?', opts: [['HH overlaps with itself'], ['H is rarer after H than T is', 'After a fair flip, H and T are equally likely.'], ['HH is a less likely pattern overall', 'Each has probability ¼ at any position.'], ['Flips aren\'t independent', 'They are.']], sol: 'After H, a tail in HH wastes everything, while a head in HT keeps your progress. Occurrences of HH bunch together, so it needs longer gaps between bunches to average the same rate.' },
        ] },
        { h: 'Games that loop back', blocks: [
          `<p>Tennis from deuce, table tennis at 10–10: you need two points in a row, and a split returns you to the same state. Look at pairs of points: P(win) = p²/(p² + q²), ignoring the splits.</p>`,
          { fig: 'states', w: 400, h: 110, r: 26, nodes: { l: [50, 55, 'lose', 'bad'], d: [200, 55, 'deuce'], w: [350, 55, 'win', 'ok'] }, edges: [['d', 'w', 'p²'], ['d', 'l', 'q²']], alt: 'From deuce, you win with probability p squared, lose with q squared, and otherwise stay at deuce.', cap: 'Every two points, you win, lose, or return to deuce. Splits don\'t count, so only the ratio p² : q² matters.' },
          { q: 'You win each point with probability 2/3. From deuce, what is your probability of winning the game?', a: 4 / 5, hint: 'p² = 4/9 and q² = 1/9.', sol: '(4/9)/(4/9 + 1/9) = <b>4/5</b>.' },
        ] },
        { h: 'Explore: race the patterns', blocks: [
          `<p>Simulate any pattern and compare with the exact answer. A neat rule: the expected wait is the sum of 2<sup>k</sup> over each length k at which the pattern's start matches its end. HTH: lengths 1 and 3, so 2 + 8 = 10.</p>`,
          { widget: 'pattern', predict: { q: 'Which takes longer on average to appear: HTT or HTH?', opts: ['HTH', 'HTT', 'They take the same time'], then: 'Pick each pattern and simulate it.' } },
        ] },
      ],
      takeaways: ['Name the unknown, condition on the first step, and solve the equation.', 'Patterns: one state per prefix you\'ve built.', 'Self-overlapping patterns take longer (HTH: 10, HHH: 14, but HTT: 8).', 'Loops back to the same state: only the steps that end the game matter.'],
      explain: { q: 'In E = 1 + (5/6)E, what does each term mean?', a: 'E is the expected total. The 1 is the roll you must make regardless. (5/6)E says that with probability 5/6 you\'re in exactly the situation you started in, so you expect E more rolls. With probability 1/6 you\'re done, which adds nothing.' },
      homework: [
        { lvl: 'core', q: 'What is the expected number of flips to see HH?', a: 6, hint: 'States 0 and H.', sol: 'E₀ = 2 + E₁, E₁ = 1 + ½E₀. So E₀ = 3 + ½E₀ and E₀ = <b>6</b>.' },
        { lvl: 'core', q: 'A coin has P(heads) = ⅓. What is the expected number of flips to see a head?', a: 3, hint: 'E = 1 + ⅔E.', sol: '<b>3</b>.' },
        { lvl: 'core', q: 'A and B alternate flipping a fair coin, A first. The first head wins. What is A\'s chance?', a: 2 / 3, tol: { abs: 0.002 }, hint: 'p = ½ + ¼p.', sol: '<b>2/3</b>.' },
        { lvl: 'core', q: 'You win each point with probability 0.6. From deuce, what is your probability of winning?', a: 9 / 13, tol: { abs: 0.002 }, hint: '0.36/(0.36 + 0.16).', sol: '<b>9/13</b> ≈ 0.692.' },
        { lvl: 'interview', q: 'What is the expected number of die rolls until you get two sixes in a row?', a: 42, tol: { abs: 0.01 }, hint: 'States: 0 and "one six". E₀ = 1 + ⅙E₁ + ⅚E₀ and E₁ = 1 + ⅚E₀.', sol: 'E₀ = 6 + E₁ and E₁ = 1 + ⅚E₀, so E₀ = 7 + ⅚E₀ and E₀ = <b>42</b>.' },
        { lvl: 'interview', q: 'You roll a die until two consecutive rolls match. What is the expected number of rolls?', a: 7, tol: { abs: 0.01 }, hint: 'After the first roll, each roll matches the last with probability 1/6.', sol: '1 + 6 = <b>7</b>.' },
        { lvl: 'interview', q: 'HHT and HTH race: flip a coin until one appears. What is the probability that HHT comes first?', a: 2 / 3, tol: { abs: 0.003 }, hint: 'Wait for the first H. Then look at the next flips: HH… leads to HHT for sure; what about HT?', sol: 'After the first H: a next H (½) guarantees HHT. A next T (½) leaves HT: then H gives HTH, and T restarts. So p = ½ + ½ × ½ × p, giving p = <b>2/3</b>.' },
        { lvl: 'stretch', q: 'Show that the expected number of flips to see k heads in a row is 2<sup>k+1</sup> − 2.', sol: 'Let E<sub>k</sub> be the wait. To get k heads you first need k − 1 in a row, then one more flip: a head finishes, a tail restarts. So E<sub>k</sub> = E<sub>k−1</sub> + 1 + ½E<sub>k</sub>, which gives E<sub>k</sub> = 2E<sub>k−1</sub> + 2. With E₀ = 0 this solves to 2<sup>k+1</sup> − 2.' },
        { lvl: 'lab', q: 'With a real coin, count flips until HT, ten times. Then until HH, ten times. Do you see the 4 v 6 difference?', sol: 'You may not: the spread is large for ten trials (the standard deviation of the HH wait is about 4.7). You\'d need about 100 trials to separate them reliably. That\'s worth feeling in your hands.' },
      ],
      practice: [['Expected value topic', '#/topic/ev'], ['HTH', '#/iq/sig-hth'], ['HHT v HTT', '#/iq/js-hht-htt'], ['Deuce', '#/iq/wc-deuce']],
    },

    markov: {
      title: 'Markov chains', minutes: 45,
      why: 'When a process has a state and rules for moving, a Markov chain turns a puzzle into a small set of equations. It\'s also how to think about regimes and order flow.',
      goals: ['Model a process as states with transition probabilities', 'Find stationary distributions and return times', 'Compute expected hitting times by first-step analysis on the states'],
      prereq: ['recursion'],
      sections: [
        { h: 'States and transitions', blocks: [
          `<p>A <b>Markov chain</b> moves between states, and where it goes next depends only on where it is now. Draw the states and arrows with probabilities, then look for structure: symmetric states can be merged.</p>`,
          { fig: 'states', w: 360, h: 170, r: 28, nodes: { s: [100, 100, 'Sun', 'ok-soft'], r: [260, 100, 'Rain', 'acc-soft'] }, edges: [['s', 'r', '0.2', 22], ['r', 's', '0.4', 22]], loops: [['s', '0.8', 'top'], ['r', '0.6', 'top']], alt: 'Two states. Sun stays with 0.8 or moves to rain with 0.2. Rain stays with 0.6 or moves to sun with 0.4.', cap: 'Each state\'s outgoing arrows add to 1.' },
          `<p>The <b>stationary distribution</b> π is the long-run share of time in each state. If the chain is in balance, the flow out of a state equals the flow in. For two states this is one line: π<sub>S</sub> × P(S→R) = π<sub>R</sub> × P(R→S).</p>`,
          { widget: 'markov' },
          { q: 'Weather: a sunny day is followed by rain with probability 0.2; a rainy day by sun with probability 0.4. In the long run, what fraction of days are rainy?', a: 1 / 3, hint: 'In balance, the flow sunny → rainy equals the flow rainy → sunny.', sol: 'π<sub>S</sub> × 0.2 = π<sub>R</sub> × 0.4, so π<sub>R</sub> = 0.2/(0.2 + 0.4) = <b>1/3</b>.' },
        ] },
        { h: 'Return times', blocks: [
          `<p>In the long run, if the chain spends a fraction π of its time in a state, it returns to that state every 1/π steps on average. For a random walk on a graph, π is proportional to each node's number of connections, which makes return times easy.</p>`,
          { q: 'In the weather chain, starting on a sunny day, how many days until the next sunny day, on average?', a: 1.5, hint: 'π<sub>S</sub> = 2/3.', sol: '1/π<sub>S</sub> = 1/(2/3) = <b>1.5</b> days.' },
        ] },
        { h: 'Hitting times', blocks: [
          `<p>To find the expected time to reach a target, write h<sub>i</sub> = 1 + Σ P(i → j) h<sub>j</sub> for every state i (with h = 0 at the target) and solve. Symmetry keeps the system small.</p>`,
          { q: 'A walker on positions 0, 1, 2, 3 moves left or right with probability ½ each, except that from 0 it always moves to 1. Starting at 0, what is the expected number of steps to reach 3?', a: 9, hint: 'h₃ = 0, h₀ = 1 + h₁, and h<sub>i</sub> = 1 + ½h<sub>i−1</sub> + ½h<sub>i+1</sub> for i = 1, 2.', sol: 'Solving: h₂ = 5, h₁ = 8, h₀ = <b>9</b>. In general n² steps to reach n from a reflecting wall.' },
          { fig: 'states', w: 420, h: 140, r: 22, nodes: { a: [50, 80, 'd=3'], b: [160, 80, 'd=2'], c: [270, 80, 'd=1'], t: [375, 80, 'goal', 'ok'] }, edges: [['a', 'b', '1'], ['b', 'c', '⅔', 18], ['c', 'b', '⅔', 18], ['b', 'a', '⅓', 34], ['c', 't', '⅓']], alt: 'Corners of a cube merged by distance from the goal: 3, 2, 1 and 0.', cap: 'A walk on a cube\'s corners. Merging corners by distance from the goal turns 8 states into 4.' },
          { worked: 'the walk on a cube', q: 'A bug walks randomly along the edges of a cube. From the opposite corner, what is the expected number of moves to reach the goal corner?', steps: [
            ['Merge corners. What matters about a corner?', 'Only its distance from the goal, 3, 2, 1 or 0.'],
            ['From distance 3, where can it go?', 'All 3 edges lead to distance 2: h₃ = 1 + h₂.'],
            ['From distance 2?', 'Two edges lead closer, and one back: h₂ = 1 + ⅔h₁ + ⅓h₃.'],
            ['From distance 1?', 'One edge hits the goal, and two go back: h₁ = 1 + ⅔h₂.'],
            'Substitute: h₂ = 1 + ⅔(1 + ⅔h₂) + ⅓(1 + h₂) = 2 + (7/9)h₂, so h₂ = 9, h₁ = 7 and h₃ = <b>10</b>.',
          ] },
          { id: 'm1', q: 'A price is modelled as being in a "trending" or "calm" regime, each with its own daily behaviour. What does the Markov assumption say?', opts: [['Tomorrow depends only on today'], ['Prices never trend for long', 'It says nothing about the length, which depends on the stay probabilities.'], ['Tomorrow\'s regime is independent of today\'s', 'That would be no chain at all.'], ['Regimes last exactly one day', 'A high chance of staying gives long regimes.']], sol: 'The model has no memory beyond the current state. A stay probability of s gives regimes that last 1/(1 − s) days on average.' },
        ] },
      ],
      takeaways: ['Next state depends only on the current one.', 'Stationary distribution: balance the flows; return time = 1/π.', 'Hitting times: one equation per state, h = 1 + Σ P h.', 'Merge symmetric states before solving.', 'Random walk on a graph: π is proportional to degree.'],
      explain: { q: 'What is a stationary distribution, in plain words, and why is the return time 1/π?', a: 'It\'s the pattern of time spent in each state that the chain settles into, and that doesn\'t change from one step to the next. If you spend a fraction π of your time in a state, the visits must be 1/π steps apart on average, as visits per step and steps per visit are reciprocals.' },
      homework: [
        { lvl: 'core', q: 'A two-state chain moves A → B with probability 0.1 and B → A with probability 0.3. What is the long-run share of time in B?', a: 0.25, hint: 'a/(a + b).', sol: '0.1/0.4 = <b>0.25</b>.' },
        { lvl: 'core', q: 'In that chain, what is the expected return time to B?', a: 4, hint: '1/π.', sol: '<b>4</b> steps.' },
        { lvl: 'core', q: 'A chain has states A, B, C. From A it always moves to B; from C it always moves to B; from B it moves to A or C with probability ½ each. What is the long-run share of time in B?', a: 0.5, hint: 'It\'s in B every other step.', sol: '<b>½</b>.' },
        { lvl: 'core', q: 'A regime has a stay probability of 0.9. What is its expected length, in days?', a: 10, hint: 'Geometric.', sol: '1/0.1 = <b>10</b>.' },
        { lvl: 'interview', q: 'A knight starts in a corner of a chessboard and moves at random. What is the expected number of moves until it returns to that corner?', a: 168, tol: { abs: 0.5 }, hint: 'Return time = (sum of all degrees)/(degree of the corner). Squares have 2, 3, 4, 6 or 8 knight moves, and they total 336.', sol: 'Stationary π ∝ degree. The corner has degree 2, and the board totals 336, so 336/2 = <b>168</b>.' },
        { lvl: 'interview', q: 'A walker on positions 0 to 4 moves ±1 with equal chance, with a reflecting wall at 0. What is the expected number of steps from 0 to 4?', a: 16, hint: 'The n² rule, or solve the equations.', sol: '4² = <b>16</b>.' },
        { lvl: 'interview', q: 'A frog hops between three lily pads in a triangle, moving to each of the other two with equal chance. Starting on pad A, what is the expected number of hops to reach pad B?', a: 2, hint: 'Each hop lands on B with probability ½.', sol: 'E = 1 + ½E, so <b>2</b>.' },
        { lvl: 'stretch', q: 'Derive the n² rule: for a fair walk on 0…n with a reflecting wall at 0, show that the expected time to go from i to i + 1 is 2i + 1, and add them up.', sol: 'Let t<sub>i</sub> be the time from i to i + 1. Then t₀ = 1, and t<sub>i</sub> = 1 + ½(t<sub>i−1</sub> + t<sub>i</sub>), which gives t<sub>i</sub> = 2 + t<sub>i−1</sub> = 2i + 1. Summing i = 0 to n − 1 gives n².' },
        { lvl: 'lab', q: 'Classify the last 60 trading days of an index as Up or Down. Count the four kinds of transitions and estimate P(up after up) and P(up after down). Are they different? What would you expect from noise?', sol: 'With 60 days, each estimate has a standard error of about 0.13, so a gap under about 0.2 is noise. Daily index direction has very little persistence. You\'ll formalise this test in chapter 17.' },
      ],
      practice: [['Markov chains topic', '#/topic/markov'], ['Cube walk', '#/iq/wc-cube-walk'], ['Random rook', '#/iq/drw-rook']],
    },

    walks: {
      title: 'Random walks and martingales', minutes: 50,
      why: 'A trader\'s P&L is a random walk with a small drift. This chapter tells you how likely you are to hit a target before a stop, how long it takes, and why no betting system can turn a fair game into a winning one.',
      goals: ['Solve gambler\'s ruin, fair and biased', 'Use the martingale trick: a fair game\'s expected value never changes', 'Find expected durations with Wald\'s identity and the i(N − i) formula', 'Use the reflection principle'],
      prereq: ['recursion', 'markov'],
      sections: [
        { h: 'Fair games are martingales', blocks: [
          `<p>A <b>martingale</b> is a process whose expected next value equals its current value. If each step has expected change zero, your expected position at any sensible stopping time is where you started. For a fair ±1 walk from i that stops at 0 or N:</p>
           <div class="hb-eq">i = N × P(reach N) + 0 × P(reach 0), so P(reach N) = i/N</div>`,
          { fig: 'plot', x: [0, 30], y: [0, 10], xl: 'steps', yl: 'wealth', xt: [0, 10, 20, 30], yt: [0, 3, 10], hlines: [{ y: 10, t: 'target', tone: 'ok' }, { y: 0, tone: 'bad' }], series: [{ step: false, pts: [3, 4, 3, 4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 7, 8, 9, 8, 9, 10].map((v, i) => [i, v]), tone: 'ok' }, { pts: [3, 2, 3, 2, 3, 4, 3, 2, 1, 2, 1, 2, 1, 0].map((v, i) => [i, v]), tone: 'bad' }], alt: 'Two walks from 3: one reaches 10, the other reaches 0.', cap: 'Two walks from 3. Most walks from here end at 0, but those that win, win more. The expected final wealth is still 3.' },
          { widget: 'walk', predict: { q: 'Start at $4, stop at $0 or $10, with a fair coin. What share of walks reach $10?', opts: ['About 40%', 'About 50%', 'About 16%', 'About 60%'], then: 'Run the simulation with Start 4 and Top 10. Then try a small bias, like 0.45.' } },
          { q: 'You have $3 and bet $1 on fair coin flips until you have $10 or nothing. What is the probability you reach $10?', a: 0.3, hint: 'Your expected wealth stays at 3.', sol: '3/10 = <b>0.3</b>.' },
          { q: 'How many flips does that game last on average?', a: 21, hint: 'For a fair walk between barriers, the expected duration is i(N − i).', sol: '3 × 7 = <b>21</b>.' },
          { id: 'm1', q: 'You bet $1 on a fair coin, double after each loss, and stop after your first win. Doesn\'t that guarantee +$1?', opts: [['No: a rare huge loss cancels the wins'], ['Yes, as long as you start small', 'You win $1 most of the time, and lose a fortune occasionally.'], ['Yes, because a win must come eventually', 'Only with unlimited money and no bet limit.'], ['No, because the coin remembers your losses', 'The coin has no memory.']], sol: 'A fair game stays fair for any stopping rule that can\'t see the future, as long as your bets are bounded. Doubling swaps many small wins for one rare catastrophe, and the expected profit stays exactly zero.' },
        ] },
        { h: 'Biased walks', blocks: [
          `<p>If each step is +1 with probability p and −1 with q = 1 − p, let r = q/p. Then</p>
           <div class="hb-eq">P(reach N before 0, starting from i) = (1 − r<sup>i</sup>)/(1 − r<sup>N</sup>)</div>
           <p>The quantity r<sup>X</sup> is a martingale, which is where this comes from.</p>`,
          { proof: 'E[r<sup>X+step</sup>] = r<sup>X</sup>(p·r + q/r) = r<sup>X</sup>(q + p) = r<sup>X</sup>. So r<sup>X</sup> keeps its expected value. At the stop: r<sup>i</sup> = P × r<sup>N</sup> + (1 − P) × 1. Solve for P.' },
          { q: 'Steps are +1 with probability 0.6. Starting at 2, what is the probability of reaching 4 before 0?', a: 9 / 13, tol: { abs: 0.003 }, hint: 'r = 0.4/0.6 = 2/3.', sol: '(1 − 4/9)/(1 − 16/81) = (5/9)/(65/81) = <b>9/13</b> ≈ 0.69.' },
          { market: 'A tiny edge compounds. At p = 0.51, starting with $100 and aiming for $200, r = 0.96 and you reach the target with probability about 98%. At p = 0.49 it\'s about 2%. Over many trades, edge dominates luck, as long as you can\'t be knocked out first.' },
        ] },
        { h: 'Wald\'s identity', blocks: [
          `<p>For a walk with average step μ, stopped at a time T that doesn't peek into the future, E[position at T] = μ × E[T]. If the walk hits its target exactly (steps of ±1), that gives E[T] directly.</p>`,
          { q: 'A walk steps +1 with probability 0.6 and −1 with 0.4, starting at 0. What is the expected number of steps to first reach +5?', a: 25, hint: 'The drift is 0.6 − 0.4 per step.', sol: '5 = 0.2 × E[T], so E[T] = <b>25</b>.' },
        ] },
        { h: 'The reflection principle', blocks: [
          `<p>How likely is a fair walk to touch level a within n steps? Take any path that touches a and ends below it. Reflect everything after the first touch: it's now a path that ends above a, equally likely. So paths touching a split evenly above and below:</p>
           <div class="hb-eq">P(touch a by step n) = 2 P(end above a) + P(end at a)</div>`,
          { fig: 'plot', x: [0, 14], y: [-1, 7], xl: 'steps', xt: [0, 7, 14], yt: [0, 3], hlines: [{ y: 3, t: 'level a', tone: 'acc' }], series: [{ pts: PATH.map((v, i) => [i, v]), tone: 'acc' }, { pts: PATH.slice(3).map((v, i) => [i + 3, 6 - v]), tone: 'bad', dash: true }], alt: 'A path touching level 3, and its mirror image above the level.', cap: 'After the first touch, the mirror-image path is just as likely, so each path below has a twin above.' },
          { id: 'a1', q: 'A fair ±1 walk runs for 4 steps. What is the probability it touches +2 at some point?', a: 3 / 8, tol: { abs: 0.002 }, hint: 'P(S₄ = 4) = 1/16 and P(S₄ = 2) = 4/16.', sol: '2 × 1/16 + 4/16 = <b>3/8</b>.' },
          { market: 'This is why a stop-loss gets hit more often than people expect: a price is about twice as likely to touch a level at some time as to finish beyond it.' },
        ] },
      ],
      takeaways: ['Fair game: expected value at the stop = start, so P(reach N) = i/N.', 'Fair walk duration between barriers: i(N − i).', 'Biased: (1 − r<sup>i</sup>)/(1 − r<sup>N</sup>) with r = q/p.', 'Wald: target = drift × expected time.', 'Touching a level is about twice as likely as ending beyond it.', 'No stopping rule makes a fair game profitable.'],
      explain: { q: 'Why can\'t a clever betting system beat a fair game?', a: 'Each bet has expected profit zero whatever you\'ve done before, since the coin doesn\'t know your history. A sum of zero-expectation bets has zero expectation, for any rule that decides based on the past. Systems reshape the distribution, trading frequent small wins for rare large losses, but they can\'t move its mean.' },
      homework: [
        { lvl: 'core', q: 'You start with $5, and bet $1 at a time on fair flips until you have $20 or nothing. What is the probability of reaching $20?', a: 0.25, hint: 'i/N.', sol: '<b>0.25</b>.' },
        { lvl: 'core', q: 'How long does that game last on average?', a: 75, hint: 'i(N − i).', sol: '5 × 15 = <b>75</b>.' },
        { lvl: 'core', q: 'p = 0.55. Starting at 5, what is the probability of reaching 10 before 0?', a: (1 - (9 / 11) ** 5) / (1 - (9 / 11) ** 10), tol: { abs: 0.003 }, hint: 'r = 9/11. It simplifies to 1/(1 + r⁵).', sol: '1/(1 + (9/11)⁵) ≈ <b>0.732</b>.' },
        { lvl: 'core', q: 'A walk has drift +0.1 a step. What is the expected time to first reach +20?', a: 200, hint: 'Wald.', sol: '20/0.1 = <b>200</b>.' },
        { lvl: 'interview', q: 'At p = 0.49, starting with 50 and betting 1 at a time, what is the chance you double your money before going broke?', a: 1 / (1 + (51 / 49) ** 50), tol: { abs: 0.003 }, hint: 'r = 51/49. Start halfway: 1/(1 + r⁵⁰).', sol: 'r⁵⁰ ≈ 7.4, so about 1/8.4 ≈ <b>0.119</b>. A tiny negative edge is deadly over many bets.' },
        { lvl: 'interview', q: 'A fair ±1 walk runs for 6 steps. What is the probability that it touches +2?', a: 2 * (6 + 1) / 64 + 15 / 64, tol: { abs: 0.002 }, hint: 'P(S₆ = 4 or 6) = 7/64 and P(S₆ = 2) = 15/64.', sol: '2 × 7/64 + 15/64 = <b>29/64</b> ≈ 0.453.' },
        { lvl: 'interview', q: 'A stock with no drift has 1% daily volatility. Roughly what is the chance that it touches −5% at some point in 25 days? Use the normal and reflection.', a: 2 * 0.15866, tol: { abs: 0.02 }, hint: 'Over 25 days the sd is 5%, so −5% is one sd. What is P(end below −1σ)?', sol: '2 × P(Z &lt; −1) = 2 × 0.159 ≈ <b>0.32</b>. About one in three, against 16% to finish there.' },
        { lvl: 'stretch', q: 'Show that S<sub>n</sub>² − n is a martingale for a fair ±1 walk, and use it to derive the i(N − i) duration formula.', sol: 'E[S<sub>n+1</sub>² | S<sub>n</sub>] = S<sub>n</sub>² + 1, so S<sub>n</sub>² − n keeps its expectation. Start at i. At the stop: i² = E[S<sub>T</sub>²] − E[T] = N² × (i/N) − E[T], so E[T] = iN − i² = i(N − i).' },
        { lvl: 'lab', q: 'Play the $3 to $10 game with a coin, ten times over. Record wins and lengths. Then open the Bet sizing game in the app. Does a small edge feel as strong as the maths says?', sol: 'Expect about 3 wins and an average length near 21, with a large spread. Over a few games, a small edge is invisible. Over hundreds it dominates.' },
      ],
      practice: [['Random walks topic', '#/topic/walks'], ['Gambler\'s ruin', '#/iq/fr-ruin-6-4'], ['Walk to −100 or +50', '#/iq/imc-walk']],
    },

    stopping: {
      title: 'Optimal stopping and dynamic programming', minutes: 45,
      why: 'When should you stop and take what you have? Dynamic programming solves it by starting from the end, and the same logic prices American options and decides when to close a position.',
      goals: ['Solve stopping games by backward induction', 'Set thresholds: stop when what you have beats what continuing is worth', 'Value options to continue, including costly ones', 'Use the 37% rule'],
      prereq: ['expectation', 'recursion'],
      sections: [
        { h: 'Work backwards', blocks: [
          `<p>In a game with a limited number of chances, solve the last decision first. Its value tells you the threshold for the decision before it. In "roll a die, reroll if you like, keep the last roll": a reroll is worth 3.5, so keep 4, 5 and 6.</p>`,
          { fig: 'bars', vals: [3.5, 3.5, 3.5, 4, 5, 6], max: 6.5, labs: ['1', '2', '3', '4', '5', '6'], show: ['3.5', '3.5', '3.5', '4', '5', '6'], tone: (i) => (i > 2 ? 'ok' : ''), w: 320, h: 190, xl: 'first roll', alt: 'For a first roll of 1, 2 or 3, rerolling is worth 3.5. For 4, 5 or 6, keep it.', cap: 'What each first roll is worth if you play well: reroll the low ones, and keep the rest. The average of these bars is the game\'s value.' },
          { q: 'With one reroll allowed, what is the game worth?', a: 4.25, hint: 'Keep 4–6; reroll otherwise for 3.5.', sol: '(4 + 5 + 6)/6 + (3/6) × 3.5 = 2.5 + 1.75 = <b>4.25</b>.' },
          { q: 'With two rerolls?', a: 14 / 3, tol: { abs: 0.01 }, hint: 'Continuing is now worth 4.25, so keep only 5 and 6.', sol: '(5 + 6)/6 + (4/6) × 4.25 = <b>14/3</b> ≈ 4.67.' },
        ] },
        { h: 'Options have value', blocks: [
          `<p>The right to do something later is worth the improvement it brings: value with the option minus value without it. Interviewers often ask "what would you pay for the reroll?"</p>`,
          { q: 'What is the option of one reroll worth?', a: 0.75, hint: 'Compare with no reroll.', sol: '4.25 − 3.5 = <b>$0.75</b>.' },
        ] },
        { h: 'Costly, unlimited tries', blocks: [
          `<p>If you may reroll forever but each reroll costs c, there's no last decision to start from. But the future always looks the same, so the game's value V satisfies a stationary threshold rule: stop on x when x ≥ V − c. Try thresholds "stop on the top k faces" and pick the best.</p>
           <p>With the top k faces, you roll 6/k times on average, paying c for all but the first, and your final face averages (13 − k)/2.</p>`,
          { q: 'A die pays its face; you may reroll as often as you like for $1 each time. What is the game worth?', a: 4, hint: 'Value of "stop on the top k faces" = (13 − k)/2 − (6/k − 1). Try k = 3 and k = 4.', sol: 'k = 3: 5 − 1 = 4; k = 4: 4.5 − 0.5 = 4. Both give <b>$4</b>: stop on 4 or more (indifferent at 3).' },
          { id: 'm1', q: 'Why is "keep rolling until you beat your best so far" a bad rule in the costly die game?', opts: [['Past rolls are sunk'], ['It uses too many rolls of a fair die', 'The number of rolls isn\'t the problem by itself.'], ['A higher roll is less likely after a high one', 'Rolls are independent.'], ['It never stops', 'It does stop, at the first six at the latest.']], sol: 'The decision depends only on the state now: this roll against the value of going on. What you\'ve already paid or seen doesn\'t change the future. Letting sunk costs into the decision is a classic trading error too.' },
        ] },
        { h: 'The secretary problem', blocks: [
          `<p>You interview n candidates in random order and must accept or reject each on the spot. You win only if you pick the very best. A good rule: reject the first fraction x, then take the first candidate who beats everyone so far.</p>`,
          { fig: 'plot', x: [0, 1], y: [0, 0.45], xl: 'fraction of candidates skipped', yl: 'P(pick the best)', xt: [0, [0.368, '1/e'], 1], yt: [0, 0.2, [0.368, '0.37']], fns: [{ f: (x) => (x <= 0 ? 0 : -x * Math.log(x)) }], pts: [{ x: 1 / Math.E, y: 1 / Math.E, tone: 'ok' }], alt: 'The curve minus x log x, peaking at x equals 1 over e with value 1 over e.', cap: 'For large n the success rate is −x ln x, which peaks at x = 1/e, with success rate 1/e. You met this function in the toolkit chapter.' },
          { proof: 'You win if the best is at position t > xn, and the best of those before t sits in the skipped part: chance xn/t. Averaging over t gives ∫ₓ¹ (x/t) dt = −x ln x.' },
          { q: 'With 100 candidates, about how many should you see and reject before choosing?', a: 37, tol: { abs: 1.5 }, hint: 'n/e.', sol: '100/e ≈ <b>37</b>.' },
        ] },
        { h: 'Explore: more rerolls', blocks: [
          `<p>With more rerolls, the same backward reasoning gives a higher threshold and a higher value.</p>`,
          { widget: 'reroll' },
          { worked: 'continuous version', q: 'You draw from a uniform on [0, 1], and may redraw once. What is the game worth?', steps: [
            ['What is a redraw worth?', '½, its expected value.'],
            ['So what is the threshold?', 'Keep anything above ½.'],
            ['Value: split by the first draw.', 'With probability ½ you keep, averaging ¾. With probability ½ you redraw, for ½.'],
            'V = ½ × ¾ + ½ × ½ = <b>5/8</b>.',
          ] },
        ] },
      ],
      takeaways: ['Solve the last decision first; its value sets the earlier thresholds.', 'Stop when what you have beats what continuing is worth.', 'Option value = value with it − value without it.', 'Sunk costs don\'t enter the decision.', 'Can\'t go back: skip about 37%, then take the next best-so-far.'],
      explain: { q: 'Why must you solve these problems from the end rather than the start?', a: 'Whether to stop now depends on what continuing is worth, and that depends on what you\'ll do later. Only the last decision can be valued on its own, so you start there and work back, using each value as the threshold for the decision before it.' },
      homework: [
        { lvl: 'core', q: 'With three rerolls of a die, what is the game worth?', a: 89 / 18, tol: { abs: 0.01 }, hint: 'Continuing is worth 14/3 ≈ 4.67, so keep 5 and 6.', sol: '11/6 + (4/6)(14/3) = <b>89/18</b> ≈ 4.94.' },
        { lvl: 'core', q: 'You roll two dice and take the total. You may reroll both once. What is the game worth?', a: 287 / 36, tol: { abs: 0.01 }, hint: 'A reroll is worth 7, so keep 8 or more.', sol: '(40 + 36 + 30 + 22 + 12)/36 + (21/36) × 7 = 287/36 ≈ <b>7.97</b>.' },
        { lvl: 'core', q: 'A die pays its face, and rerolls cost $0.50 each, as many as you like. What is the game worth?', a: 4.5, hint: 'Use (13 − k)/2 − c(6/k − 1) for each k.', sol: 'k = 2: 5.5 − 1 = 4.5. k = 3: 5 − 0.5 = 4.5. So <b>$4.50</b>.' },
        { lvl: 'core', q: 'What is the value of the second reroll, on top of the first?', a: 14 / 3 - 4.25, tol: { abs: 0.01 }, hint: '14/3 − 4.25.', sol: '≈ <b>$0.42</b>: less than the first reroll\'s $0.75.' },
        { lvl: 'interview', q: 'You draw from a uniform on [0, 1], with two redraws allowed. What is the game worth?', a: 0.375 * 0.8125 + 0.625 * 0.625, tol: { abs: 0.002 }, hint: 'With one redraw left, the game is worth 5/8, so that\'s your threshold.', sol: 'Keep above 5/8 (average 13/16), otherwise take 5/8: (3/8)(13/16) + (5/8)(5/8) = 89/128 ≈ <b>0.695</b>.' },
        { lvl: 'interview', q: 'With 20 candidates in the secretary problem, how many should you skip?', a: 20 / Math.E, tol: { abs: 1 }, hint: 'n/e.', sol: 'About <b>7</b>.' },
        { lvl: 'stretch', q: 'For the uniform game, show that the values obey v<sub>n+1</sub> = (1 + v<sub>n</sub>²)/2. What is the limit, and why does it make sense?', sol: 'With threshold v, you keep above it with average (1 + v)/2 and probability 1 − v, otherwise take v: (1 − v)(1 + v)/2 + v² = (1 + v²)/2. The limit solves v = (1 + v²)/2, so v = 1: with endless free tries, you can wait for a value near the maximum.' },
        { lvl: 'lab', q: 'Ask a friend to write 20 different numbers on slips, any size. Draw them one at a time, and try to stop on the largest, using the 37% rule. Play 10 times. How often do you win?', sol: 'You should win about 3 or 4 times in 10, far better than the 1 in 20 from guessing. The rule needs no knowledge of the range of numbers, which is what makes it surprising.' },
      ],
      practice: [['Reroll game', '#/iq/js-reroll'], ['Paid rerolls', '#/iq/js-d100-pay'], ['Secretary problem', '#/iq/cl-secretary'], ['Hat game', '#/iq/wc-hat']],
    },

    continuous: {
      title: 'Continuous probability and geometry', minutes: 45,
      why: 'Random times, random points, broken sticks: with continuous variables, probabilities become lengths and areas, and a good picture often replaces an integral.',
      goals: ['Work with densities and cumulative distributions', 'Turn uniform-random questions into areas', 'Know the order statistics of uniforms', 'Compute expectations by integrating or by symmetry'],
      prereq: ['toolkit', 'distributions', 'symmetry'],
      sections: [
        { h: 'Densities and CDFs', blocks: [
          `<p>A continuous variable has a <b>density</b> f(x): the probability of landing in a small interval dx is about f(x) dx, and P(a &lt; X &lt; b) = ∫ₐᵇ f(x) dx. Any single point has probability zero. The <b>CDF</b> F(x) = P(X ≤ x) adds up the density from the left, so f = F′. For a uniform on [0, 1], f = 1 and F(x) = x.</p>
           <p>One neat tool: for a non-negative X, E[X] = ∫₀<sup>∞</sup> P(X &gt; t) dt.</p>`,
        ] },
        { h: 'Probability as area', blocks: [
          `<p>Two independent uniforms on [0, 1] are a random point in the unit square, so a probability is just the area of a region. Draw it. The meeting problem, the broken stick and many "random time" questions become geometry.</p>`,
          { fig: 'plot', x: [0, 1], y: [0, 1], w: 270, h: 270, xl: 'your arrival', yl: 'their arrival', xt: [0, 1], yt: [0, 1], polys: [{ pts: [[0, 0], [1 / 6, 0], [1, 5 / 6], [1, 1], [5 / 6, 1], [0, 1 / 6]], tone: 'ok-soft' }], fns: [{ f: (x) => x + 1 / 6, tone: 'ok', to: 5 / 6 }, { f: (x) => x - 1 / 6, tone: 'ok', from: 1 / 6 }], labels: [{ x: 0.5, y: 0.47, t: 'meet', a: 'middle' }, { x: 0.22, y: 0.76, t: 'miss', a: 'middle' }, { x: 0.78, y: 0.2, t: 'miss', a: 'middle' }], alt: 'A unit square with a diagonal band where two arrival times differ by at most ten minutes.', cap: 'They meet in the band |x − y| ≤ 1/6. The two corner triangles fit together into a square of side 5/6.' },
          { widget: 'area' },
          { q: 'X and Y are independent uniforms on [0, 1]. What is P(X + Y < 1.5)?', a: 0.875, hint: 'Only a corner triangle has X + Y ≥ 1.5.', sol: 'The corner triangle has legs ½, area ⅛. P = 1 − ⅛ = <b>0.875</b>.' },
          { q: 'Two people arrive at random times within an hour and each waits 10 minutes. What is the probability they meet?', a: 11 / 36, tol: { abs: 0.003 }, hint: 'They miss in two corner triangles with legs 5/6.', sol: '1 − (5/6)² = <b>11/36</b> ≈ 0.31.' },
        ] },
        { h: 'Order statistics', blocks: [
          `<p>Drop n uniform points on [0, 1]. By the equal-gaps argument, they split the interval into n + 1 pieces of equal expected length 1/(n + 1). So E[min] = 1/(n + 1) and E[max] = n/(n + 1).</p>
           <p>For distributions, use this trick: the maximum is below x exactly when <i>all</i> n points are, so P(max ≤ x) = xⁿ.</p>`,
          { fig: 'plot', x: [0, 1], y: [0, 3.2], xl: 'x', xt: [0, 0.5, 1], yt: [0, 1, 2, 3], fns: [{ f: () => 1, tone: 'muted' }, { f: (x) => 2 * x, tone: 'ok' }, { f: (x) => 3 * x * x, tone: 'acc' }], labels: [{ x: 0.05, y: 1.12, t: 'n = 1' }, { x: 0.58, y: 1.5, t: 'n = 2', tone: 'ok' }, { x: 0.62, y: 2.5, t: 'n = 3', tone: 'acc' }], alt: 'Densities of the maximum of 1, 2 and 3 uniforms, pushing towards 1.', cap: 'Density of the maximum: n xⁿ⁻¹. More points push it towards 1.' },
          { q: 'What is the expected maximum of 3 independent uniforms on [0, 1]?', a: 0.75, hint: 'n/(n + 1).', sol: '3/4 = <b>0.75</b>.' },
          { q: 'A stick is broken at two uniformly random points. What is the expected length of the shortest piece?', a: 1 / 9, tol: { abs: 0.002 }, hint: 'Find P(shortest > t): every piece must exceed t, which leaves a triangle of side 1 − 3t. Then E = ∫ P(shortest > t) dt.', sol: '1/3² = <b>1/9</b>. (The longest averages 11/18.)' },
        ] },
        { h: 'Integrating when you have to', blocks: [
          `<p>E[g(X)] = ∫ g(x) f(x) dx. For a uniform on [0, 1], f = 1, so it's just the average of g over the interval. Look for symmetry first: E[|X − ½|] is the average distance from the middle.</p>`,
          { q: 'X is uniform on [0, 1]. What is E[|X − ½|]?', a: 0.25, hint: '|X − ½| is uniform on [0, ½].', sol: 'Uniform on [0, ½], so its mean is <b>¼</b>.' },
          { worked: 'broken stick', q: 'Break a stick at two uniform points. What is the chance the three pieces form a triangle?', steps: [
            ['What must be true of the pieces for a triangle?', 'No piece can be ½ or longer: each side must be shorter than the sum of the other two.'],
            ['Let the cuts be X &lt; Y. Which conditions does that give?', 'X &lt; ½, Y − X &lt; ½ and Y &gt; ½.'],
            ['Draw it in the triangle X &lt; Y, which has area ½.', 'The allowed region is a small triangle with corners (0, ½), (½, ½) and (½, 1), with area ⅛.'],
            'So P = ⅛ ÷ ½ = <b>¼</b>.',
          ] },
          { fig: 'plot', x: [0, 1], y: [0, 1], w: 250, h: 250, xl: 'first cut X', yl: 'second cut Y', xt: [0, 0.5, 1], yt: [0, 0.5, 1], polys: [{ pts: [[0, 0], [1, 1], [0, 1]], tone: 'acc-soft' }, { pts: [[0, 0.5], [0.5, 0.5], [0.5, 1]], tone: 'ok' }], alt: 'The upper triangle of the unit square, with a smaller triangle a quarter of its area shaded.', cap: 'The dark triangle is a quarter of the area where X &lt; Y.' },
          { id: 'm1', q: 'X and Y are independent uniforms on [0, 1]. Which is the most useful first step for P(XY &lt; ½)?', opts: [['Sketch y = 1/(2x) on the square'], ['Average X and Y', 'That\'s a different quantity.'], ['Use the normal approximation', 'There\'s an exact answer from an area.'], ['Multiply P(X &lt; ½) by P(Y &lt; ½)', 'XY can be small without both being small.']], sol: 'The region under y = 1/(2x) in the square has area ½ + ∫<sub>½</sub>¹ 1/(2x) dx = ½ + ½ ln 2 ≈ 0.85.' },
        ] },
      ],
      takeaways: ['Probabilities are areas under a density; F′ = f.', 'Two uniforms = a point in the square; probabilities are areas.', 'n uniform points: equal expected gaps of 1/(n + 1).', 'E[max of n] = n/(n + 1); E[min] = 1/(n + 1).', 'P(max ≤ x) = P(all ≤ x).', 'Use symmetry before integrating.'],
      explain: { q: 'Why is P(max of n uniforms ≤ x) = xⁿ? And how would you use a similar trick for the minimum?', a: 'The largest is below x exactly when every point is, and each point is independently below x with probability x. For the minimum, flip it: the smallest is above x exactly when every point is, so P(min &gt; x) = (1 − x)ⁿ.' },
      homework: [
        { lvl: 'core', q: 'X and Y are independent uniforms on [0, 1]. What is P(X + Y &lt; ½)?', a: 0.125, hint: 'A corner triangle.', sol: 'Area ½ × ½ × ½ = <b>⅛</b>.' },
        { lvl: 'core', q: 'What is the probability that the larger of two uniforms is below ½?', a: 0.25, hint: 'xⁿ.', sol: '(½)² = <b>¼</b>.' },
        { lvl: 'core', q: 'What is the expected minimum of 4 independent uniforms?', a: 0.2, hint: '1/(n + 1).', sol: '<b>⅕</b>.' },
        { lvl: 'core', q: 'X and Y are independent uniforms on [0, 1]. What is P(|X − Y| &lt; ½)?', a: 0.75, hint: 'Two corner triangles with legs ½.', sol: '1 − ¼ = <b>¾</b>.' },
        { lvl: 'interview', q: 'What is E[|X − Y|] for two independent uniforms?', a: 1 / 3, tol: { abs: 0.002 }, hint: 'Two points split [0, 1] into three equal expected gaps.', sol: 'The gap between them is the middle piece: <b>⅓</b>.' },
        { lvl: 'interview', q: 'A point (X, Y) is uniform in the unit square. What is P(X² + Y² &lt; 1)?', a: Math.PI / 4, tol: { abs: 0.002 }, hint: 'A quarter of a circle of radius 1.', sol: 'π/4 ≈ <b>0.785</b>.' },
        { lvl: 'interview', q: 'What is E[max(X, Y)²] for two independent uniforms?', a: 0.5, hint: 'The max has density 2x, so integrate x² · 2x.', sol: '∫₀¹ 2x³ dx = <b>½</b>.' },
        { lvl: 'stretch', q: 'Three points are chosen at random on a circle. Show that the chance they all lie in some semicircle is ¾.', sol: 'Pick one point to be the "first" clockwise in the semicircle. Given that it\'s the first, the other two must fall in the half circle clockwise from it: probability ¼. The 3 choices of first are mutually exclusive, so the total is 3 × ¼ = ¾. In general it\'s n/2ⁿ⁻¹.' },
        { lvl: 'lab', q: 'Estimate π by Monte Carlo. Open Python and run: <code>import random; print(4*sum(random.random()**2+random.random()**2&lt;1 for _ in range(10000))/10000)</code>. How does the error change when you use 100 times as many points?', sol: 'The error is about 0.016 at 10,000 points and about 0.0016 at a million. 100 times more data gives 10 times less error: the √n rule again.' },
      ],
      practice: [['Broken stick', '#/iq/wc-stick-triangle'], ['Meeting problem', '#/iq/sq-meeting'], ['Semicircle', '#/iq/cl-semicircle'], ['Distance to an edge', '#/iq/hrt-edge-distance']],
    },
  });
})();
