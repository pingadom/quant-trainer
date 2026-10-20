// The Theo handbook: a course from the basics up to everything a quant trading interview tests.
// Parts hold chapters in a suggested order; each chapter is short sections of explanation with
// worked examples, interactive tools (`widget`, drawn by views/handbook.js), and "check yourself"
// questions. A chapter counts as done when all its checks have been answered correctly.
//
// Check answers are re-derived in research/verify_results.py (keys "hb.<chapter>.<n>").
// Chapters with `planned: true` aren't written yet: they show what's coming and link to practice.
(function () {
  const PARTS = [
    { id: 'foundations', title: 'Part 1 · Foundations', blurb: 'Fast arithmetic, counting, and the core of probability: everything later builds on this.', chapters: ['arith', 'counting', 'prob-basics', 'conditional', 'expectation', 'variance'] },
    { id: 'probability', title: 'Part 2 · Interview probability', blurb: 'The techniques behind most interview puzzles: distributions, symmetry, recursion, Markov chains, random walks and optimal stopping.', chapters: ['distributions', 'symmetry', 'recursion', 'markov', 'walks', 'stopping', 'continuous'] },
    { id: 'statistics', title: 'Part 3 · Statistics', blurb: 'From many samples to a decision: the law of large numbers, the CLT, confidence and estimation.', chapters: ['clt', 'estimation'] },
    { id: 'trading', title: 'Part 4 · Trading', blurb: 'Turning probability into prices and bets: sizing, market making, options and estimation.', chapters: ['betting', 'market-making', 'options', 'fermi', 'games'] },
    { id: 'craft', title: 'Part 5 · Interview craft', blurb: 'How to perform on the day: thinking aloud, speed, and sanity checks.', chapters: ['craft'] },
  ];

  const CHAPTERS = {
    // ---------------------------------------------------------------- Part 1
    arith: {
      title: 'Numbers, fractions and fast arithmetic', minutes: 20,
      goals: ['Convert between fractions, decimals and percentages instantly', 'Multiply two-digit numbers in your head with three tricks', 'Handle compounding percentages and orders of magnitude'],
      sections: [
        { h: 'Why speed matters', html: `<p>Most trading firms screen with a timed arithmetic test (Optiver's 80 questions in 8 minutes, Zetamac, Flow Traders' 10-minute test). Later, in interviews, quick arithmetic frees your attention for the actual problem. Speed comes from <b>knowing a few facts cold</b> and <b>a handful of tricks</b>, not from calculating faster.</p>` },
        { h: 'Fractions, decimals and percentages', html: `<p>Memorise these. They come up constantly, and every other fraction is close to one of them.</p>
          <table class="hb-table"><tr><th>Fraction</th><th>Decimal</th><th>Fraction</th><th>Decimal</th></tr>
          <tr><td>1/2</td><td>0.5</td><td>1/7</td><td>0.142857…</td></tr>
          <tr><td>1/3</td><td>0.333…</td><td>1/8</td><td>0.125</td></tr>
          <tr><td>1/4</td><td>0.25</td><td>1/9</td><td>0.111…</td></tr>
          <tr><td>1/5</td><td>0.2</td><td>1/11</td><td>0.0909…</td></tr>
          <tr><td>1/6</td><td>0.1666…</td><td>1/12</td><td>0.08333…</td></tr>
          <tr><td>1/16</td><td>0.0625</td><td>1/32</td><td>0.03125</td></tr></table>
          <p>To convert anything else, <b>build it from these</b>: 3/8 = 3 × 0.125; 7/12 = 1/2 + 1/12; 5/6 = 1 − 1/6. Sevenths cycle through the digits 142857, starting at a different point for each numerator (2/7 = 0.285714…, 3/7 = 0.428571…).</p>`,
          checks: [
            { q: 'Write 3/8 as a decimal.', a: 0.375, hint: 'It is three times 1/8.', sol: '3 × 0.125 = <b>0.375</b>.' },
            { q: 'Write 7/12 as a decimal, to 3 decimal places.', a: 7 / 12, tol: { abs: 0.001 }, hint: 'Split it as 1/2 + 1/12.', sol: '0.5 + 0.0833 = <b>0.583</b>.' },
          ] },
        { h: 'Three multiplication tricks', html: `<ul>
            <li><b>Round and correct.</b> 49 × 76 = 50 × 76 − 76 = 3800 − 76 = 3724.</li>
            <li><b>Difference of squares.</b> If two numbers sit either side of a round number: (a − b)(a + b) = a² − b². So 38 × 42 = 40² − 2² = 1596.</li>
            <li><b>Near a base.</b> For two numbers near 100: 97 × 96 = (100 − 3)(100 − 4) = 100 × (100 − 3 − 4) + 3 × 4 = 9300 + 12 = 9312.</li></ul>
          <p>Always run a <b>last-digit check</b> (7 × 6 ends in 2, so 97 × 96 must end in 2) and a <b>size check</b> (97 × 96 is a bit under 100 × 100).</p>`,
          checks: [
            { q: '47 × 53', a: 2491, tol: { abs: 0.5 }, hint: 'They sit either side of 50.', sol: '50² − 3² = 2500 − 9 = <b>2491</b>.' },
            { q: '98 × 97', a: 9506, tol: { abs: 0.5 }, hint: 'Both are near 100: subtract both gaps from 100, then add the product of the gaps.', sol: '100 × (100 − 2 − 3) + 2 × 3 = 9500 + 6 = <b>9506</b>.' },
          ] },
        { h: 'Percentages compound', html: `<p>Percentage changes multiply rather than add. Up 20% then down 20% leaves you at 1.2 × 0.8 = 0.96: down 4%. For small changes, (1 + x)(1 + y) ≈ 1 + x + y + xy, and the xy term is the error in just adding them.</p>`,
          checks: [{ q: 'A price rises 10%, then another 10%. By what factor has it grown?', a: 1.21, hint: 'Multiply the two factors.', sol: '1.1 × 1.1 = <b>1.21</b>: up 21%, not 20%.' }] },
        { h: 'Orders of magnitude', html: `<p>Know 2<sup>10</sup> = 1024 ≈ 10³, log₁₀ 2 ≈ 0.301, log₁₀ 3 ≈ 0.477 and ln 10 ≈ 2.303. They turn big products into small sums: 2<sup>20</sup> ≈ 10⁶, and 3<sup>10</sup> = 10<sup>4.77</sup> ≈ 59,000. The number of digits of N is ⌊log₁₀ N⌋ + 1.</p>`,
          checks: [{ q: 'How many digits does 2<sup>20</sup> have?', a: 7, tol: { abs: 0.5 }, hint: 'Use 2¹⁰ = 1024 and square it, or log₁₀ 2 ≈ 0.301.', sol: '2²⁰ = 1024² = 1,048,576: <b>7</b> digits. Or 20 × 0.301 = 6.02, so ⌊6.02⌋ + 1 = 7.' }] },
      ],
      takeaways: ['Know the common fractions as decimals by heart; build others from them.', 'Round-and-correct, difference of squares and near-base cover most multiplications.', 'Always check the last digit and the size.', 'Percentages multiply; 2¹⁰ ≈ 10³ and log₁₀ 2 ≈ 0.3 handle magnitudes.'],
      practice: [['Speed tricks', '#/tricks'], ['Zetamac', '#/mental'], ['80-in-8 test', '#/mental']],
    },

    counting: {
      title: 'Counting', minutes: 25,
      goals: ['Count arrangements with the multiplication rule', 'Know when order matters: permutations v combinations', 'Use complements, repeated items and stars and bars'],
      sections: [
        { h: 'The multiplication rule', html: `<p>If a choice happens in stages, with a ways for the first stage and b for the second (whatever the first was), there are a × b outcomes in total. A 3-letter code has 26 × 26 × 26 possibilities; a 3-letter code with <i>no repeated letter</i> has 26 × 25 × 24.</p>`, widget: 'counting',
          checks: [{ q: 'How many 3-letter codes can be made from 26 letters if letters may repeat?', a: 17576, tol: { abs: 0.5 }, hint: 'Three stages, 26 choices each.', sol: '26³ = <b>17,576</b>.' }] },
        { h: 'Permutations: order matters', html: `<p>Arranging n different things in a row: n! = n × (n − 1) × … × 1 ways. Choosing an ordered list of k from n: n × (n − 1) × … × (n − k + 1) = n!/(n − k)!.</p>`,
          checks: [{ q: 'In how many ways can gold, silver and bronze go to 8 runners?', a: 336, tol: { abs: 0.5 }, hint: '8 choices for gold, then 7, then 6.', sol: '8 × 7 × 6 = <b>336</b>.' }] },
        { h: 'Combinations: order doesn\'t matter', html: `<p>Choosing a <i>set</i> of k from n: C(n, k) = n!/(k!(n − k)!). Each set of k appears k! times among the ordered lists, which is why we divide by k!. Useful facts: C(n, k) = C(n, n − k), and C(n, 2) = n(n − 1)/2 counts pairs.</p>`,
          checks: [{ q: 'Six people each shake hands once with everyone else. How many handshakes?', a: 15, tol: { abs: 0.5 }, hint: 'Each handshake is a pair of people.', sol: 'C(6, 2) = 6 × 5/2 = <b>15</b>.' }] },
        { h: 'Repeated items', html: `<p>To arrange items where some are identical, count as if all were different, then divide by the ways of shuffling the identical ones among themselves. MISSISSIPPI: 11!/(4! 4! 2!).</p>`,
          checks: [{ q: 'How many distinct arrangements are there of the letters of BANANA?', a: 60, tol: { abs: 0.5 }, hint: '6 letters: three As and two Ns.', sol: '6!/(3! 2!) = 720/12 = <b>60</b>.' }] },
        { h: 'Stars and bars', html: `<p>Splitting n identical items among k people (zero allowed) is the same as arranging n stars and k − 1 bars in a row: C(n + k − 1, k − 1) ways. If everyone must get at least one, give each person one first, leaving n − k to split freely: C(n − 1, k − 1).</p>`,
          checks: [{ q: 'In how many ways can 10 identical coins be split among 3 people (someone may get none)?', a: 66, tol: { abs: 0.5 }, hint: '10 stars and 2 bars.', sol: 'C(12, 2) = <b>66</b>.' }] },
        { h: 'Count the complement', html: `<p>"At least one" is usually easiest as "all outcomes minus none". PINs with at least one repeated digit = all PINs − PINs with all digits different.</p>`,
          checks: [{ q: 'How many 4-digit PINs (0000 to 9999) have at least one repeated digit?', a: 4960, tol: { abs: 0.5 }, hint: 'Subtract the PINs with four different digits from 10,000.', sol: '10,000 − 10 × 9 × 8 × 7 = 10,000 − 5,040 = <b>4,960</b>.' }] },
      ],
      takeaways: ['Stages multiply.', 'Order matters: n!/(n − k)!. It doesn\'t: divide again by k!.', 'Identical items: divide by their internal arrangements.', 'Identical items into boxes: stars and bars.', '"At least one": count the complement.'],
      practice: [['Combinatorics interview questions', '#/search/combinatorics'], ['Cards topic', '#/topic/cards']],
    },

    'prob-basics': {
      title: 'Probability basics', minutes: 25,
      goals: ['Turn a problem into equally likely outcomes', 'Use the complement, addition and multiplication rules', 'Tell independent events from mutually exclusive ones'],
      sections: [
        { h: 'Equally likely outcomes', html: `<p>When every outcome is equally likely, P(event) = (outcomes in the event)/(all outcomes). The skill is choosing outcomes that really <i>are</i> equally likely. With two dice, use the 36 ordered pairs (first die, second die), not the 11 totals: a total of 7 can happen 6 ways, a total of 2 only 1 way.</p>`, widget: 'dice',
          checks: [
            { q: 'Two dice are rolled. What is the probability their total is 7?', a: 1 / 6, hint: 'Count the ordered pairs that add to 7.', sol: '6 of the 36 pairs: (1,6), (2,5), …, (6,1). <b>1/6</b>.' },
            { q: 'Two dice: what is the probability they show the same number?', a: 1 / 6, hint: 'Whatever the first die shows, what must the second do?', sol: 'The second die must match the first: <b>1/6</b>.' },
          ] },
        { h: 'The complement rule', html: `<p>P(not A) = 1 − P(A). It turns "at least one" problems into "none" problems, which usually multiply cleanly.</p>`,
          checks: [{ q: 'You roll a die 4 times. What is the probability of at least one six?', a: 1 - (5 / 6) ** 4, tol: { abs: 0.002 }, hint: 'Find the chance of no sixes in 4 rolls first.', sol: '1 − (5/6)⁴ = 1 − 625/1296 ≈ <b>0.518</b>. (Slightly better than evens: a famous 17th-century gambling bet.)' }] },
        { h: 'The addition rule', html: `<p>P(A or B) = P(A) + P(B) − P(A and B). Subtract the overlap, or you count it twice. If A and B can't both happen (<b>mutually exclusive</b>), the overlap is zero.</p>`,
          checks: [{ q: 'A card is drawn from a standard deck. What is the probability it is a heart or a king?', a: 4 / 13, hint: '13 hearts, 4 kings, and one card is both.', sol: '(13 + 4 − 1)/52 = 16/52 = <b>4/13</b>.' }] },
        { h: 'Independence', html: `<p>A and B are <b>independent</b> if knowing one happened doesn't change the chance of the other; then P(A and B) = P(A) × P(B). Don't confuse this with mutually exclusive: two events that can't happen together are very <i>dependent</i> (if one happens, the other certainly didn't).</p>`,
          checks: [
            { q: 'A fair coin is flipped three times. What is the probability of heads, heads, tails, in that order?', a: 1 / 8, hint: 'Flips are independent: multiply.', sol: '(½)³ = <b>1/8</b>.' },
            { q: 'Three flips: what is the probability of at least one head?', a: 7 / 8, hint: 'Complement.', sol: '1 − (½)³ = <b>7/8</b>.' },
          ] },
      ],
      takeaways: ['Pick outcomes that are genuinely equally likely (ordered pairs, not totals).', '"At least one": 1 − P(none).', 'Or: add, then subtract the overlap.', 'Independent ≠ mutually exclusive.'],
      practice: [['Dice topic', '#/topic/dice'], ['Cards topic', '#/topic/cards'], ['Probability interview questions', '#/search/probability']],
    },

    conditional: {
      title: 'Conditional probability and Bayes', minutes: 30,
      goals: ['Compute P(A | B) by shrinking the sample space', 'Use trees and the law of total probability', 'Update beliefs with Bayes, in natural frequencies and in odds'],
      sections: [
        { h: 'Conditioning shrinks the world', html: `<p>P(A | B) = P(A and B)/P(B): restrict attention to the outcomes where B happened, and ask what fraction of those also have A.</p>`,
          checks: [{ q: 'Two dice sum to 8. What is the probability both are even?', a: 3 / 5, hint: 'List the ordered pairs that sum to 8.', sol: 'Pairs summing to 8: (2,6), (3,5), (4,4), (5,3), (6,2). Both even: 3 of these 5. <b>3/5</b>.' }] },
        { h: 'Trees: multiply along branches', html: `<p>P(A and B) = P(A) × P(B | A). For draws without replacement, each stage's probability depends on what came before.</p>`,
          checks: [{ q: 'Two cards are dealt from a shuffled deck. What is the probability both are aces?', a: 1 / 221, tol: { abs: 0.0002 }, hint: 'First an ace (4 of 52), then an ace from what is left.', sol: '(4/52)(3/51) = 12/2652 = <b>1/221</b>.' }] },
        { h: 'The law of total probability', html: `<p>If one of several situations must hold, P(A) = Σ P(situation) × P(A | situation). Example: urn X holds 2 red and 1 blue ball, urn Y holds 1 red and 3 blue. Pick an urn at random, then a ball.</p>`,
          checks: [
            { q: 'In that set-up, what is the probability of drawing red?', a: 11 / 24, hint: 'Average the two urns\' chances of red.', sol: '½ × 2/3 + ½ × 1/4 = 1/3 + 1/8 = <b>11/24</b>.' },
            { q: 'You drew red. What is the probability it came from urn X?', a: 8 / 11, hint: 'The share of the red probability that came via urn X.', sol: '(½ × 2/3)/(11/24) = (1/3)/(11/24) = <b>8/11</b>. That\'s Bayes\' theorem.' },
          ] },
        { h: 'Bayes with natural frequencies', html: `<p>Bayes' theorem says P(H | E) = P(E | H)P(H)/P(E). In practice, imagine 1,000 people and count. A rare condition plus an imperfect test gives many more false positives than true ones, so a positive result is less conclusive than it feels.</p>`, widget: 'bayes',
          checks: [{ q: '2% of people have a condition. The test catches 90% of cases and wrongly flags 10% of healthy people. Someone tests positive. What is the probability they have it?', a: 0.018 / (0.018 + 0.098), tol: { abs: 0.003 }, hint: 'Out of 1,000 people, how many are true positives and how many false positives?', sol: 'Of 1,000: 20 have it, 18 test positive; 980 don\'t, 98 test positive. 18/(18 + 98) ≈ <b>0.155</b>.' }] },
        { h: 'Bayes in odds form', html: `<p>Posterior odds = prior odds × likelihood ratio, where the likelihood ratio is P(evidence | H)/P(evidence | not H). It's the fastest form in interviews, and repeated evidence simply multiplies.</p>`,
          checks: [{ q: 'Prior odds of a coin being biased are 1 : 4. A flip comes up heads, which is 3 times as likely if it is biased. What is the probability it is biased now?', a: 3 / 7, hint: 'Multiply the odds by 3, then convert odds a : b to a/(a + b).', sol: 'Posterior odds 3 : 4, so P = <b>3/7</b>.' }] },
      ],
      takeaways: ['Condition by restricting to the outcomes where the evidence happened.', 'Trees multiply; the law of total probability adds the branches.', 'Natural frequencies make Bayes intuitive; odds × likelihood ratio makes it fast.', 'Rare events + imperfect tests ⇒ most positives are false.'],
      practice: [['Bayes topic', '#/topic/bayes'], ['Monty Hall', '#/iq/cl-monty-hall'], ['Two-child problem', '#/iq/imc-two-child'], ['Bayes interview questions', '#/search/bayes']],
    },

    expectation: {
      title: 'Random variables and expected value', minutes: 30,
      goals: ['Compute expected values and price simple games', 'Use linearity of expectation, even for dependent variables', 'Count with indicator variables'],
      sections: [
        { h: 'Expected value', html: `<p>A random variable X takes values with probabilities. Its expected value E[X] = Σ x · P(X = x) is the long-run average, which is why it's the fair price of a game paid out as X. Watch it settle down in the simulation below.</p>`, widget: 'lln',
          checks: [{ q: 'What is the expected value of a fair die roll?', a: 3.5, hint: 'Average the faces.', sol: '(1 + 2 + … + 6)/6 = <b>3.5</b>.' }] },
        { h: 'Linearity of expectation', html: `<p>E[X + Y] = E[X] + E[Y] and E[aX] = aE[X], <b>always</b>, even when X and Y are dependent. This is the most useful fact in interview probability: break a complicated total into simple pieces and add their expectations.</p>`,
          checks: [{ q: 'What is the expected total of three dice?', a: 10.5, hint: 'Add three expectations.', sol: '3 × 3.5 = <b>10.5</b>.' }] },
        { h: 'Indicator variables', html: `<p>To find the expected <i>number</i> of things that happen, write the count as a sum of indicators (1 if thing i happens, else 0). Each indicator's expectation is just its probability. You never need the full distribution.</p>`,
          checks: [
            { q: 'You roll a die 6 times. What is the expected number of different faces you see?', a: 6 * (1 - (5 / 6) ** 6), tol: { abs: 0.01 }, hint: 'For each face, what is the chance it appears at least once?', sol: 'Each face appears with probability 1 − (5/6)⁶ ≈ 0.665. Six faces: 6 × 0.665 ≈ <b>3.99</b>.' },
            { q: '10 people take random hats from a pile of their own hats. How many expect to get their own hat?', a: 1, hint: 'Each person gets their own hat with what probability?', sol: '10 × 1/10 = <b>1</b>, for any number of people.' },
          ] },
        { h: 'Pricing a game', html: `<p>A game's value is E[payout] − cost. Positive means you'd play at that price; the fair price makes it zero.</p>`,
          checks: [{ q: 'You pay $1 to roll a die and receive $5 if it shows a six. What is your expected profit?', a: -1 / 6, tol: { abs: 0.005 }, hint: 'Expected winnings minus the cost.', sol: '5 × 1/6 − 1 = <b>−1/6</b> ≈ −$0.17 a game.' }] },
        { h: 'E[g(X)] is not g(E[X])', html: `<p>The expected square isn't the square of the expectation. For a convex g (like x²), E[g(X)] ≥ g(E[X]) (Jensen's inequality). Interviewers love this: being paid the square of a die roll is worth more than 3.5².</p>`,
          checks: [{ q: 'You are paid the square of a die roll. What is the game worth?', a: 91 / 6, hint: 'Average 1, 4, 9, 16, 25, 36.', sol: '91/6 ≈ <b>15.17</b>, more than 3.5² = 12.25.' }] },
      ],
      takeaways: ['E[X] is the long-run average: the fair price.', 'Linearity always holds, dependence or not.', 'Counts = sums of indicators; E[indicator] = probability.', 'E[g(X)] ≠ g(E[X]) unless g is linear.'],
      practice: [['Expected value topic', '#/topic/ev'], ['Expected value interview questions', '#/search/expected%20value'], ['Reroll game', '#/iq/js-reroll']],
    },

    variance: {
      title: 'Variance, covariance and correlation', minutes: 25,
      goals: ['Compute variance and standard deviation', 'Use the rules for scaling and adding random variables', 'Understand covariance, correlation and the √n rule'],
      sections: [
        { h: 'Variance measures spread', html: `<p>Var(X) = E[(X − μ)²] = E[X²] − (E[X])². The standard deviation σ = √Var is in the same units as X. For a die: E[X²] = 91/6 and E[X]² = 12.25.</p>`,
          checks: [{ q: 'What is the variance of a fair die roll?', a: 35 / 12, tol: { abs: 0.005 }, hint: 'E[X²] − (E[X])².', sol: '91/6 − 49/4 = 35/12 ≈ <b>2.92</b>.' }] },
        { h: 'Scaling and shifting', html: `<p>Var(aX + b) = a² Var(X): shifting doesn't change spread, scaling by a multiplies the standard deviation by |a|.</p>`,
          checks: [{ q: 'X is a die roll. What is Var(3X + 2)?', a: 9 * 35 / 12, tol: { abs: 0.01 }, hint: 'The +2 does nothing; the 3 gets squared.', sol: '9 × 35/12 = <b>26.25</b>.' }] },
        { h: 'Adding independent variables: the √n rule', html: `<p>For independent X and Y, Var(X + Y) = Var(X) + Var(Y). So the total of n independent copies has standard deviation σ√n, and their average σ/√n. Averages get more precise slowly: four times the data halves the error.</p>`, widget: 'sqrtn',
          checks: [
            { q: 'What is the standard deviation of the total of 100 dice?', a: Math.sqrt(100 * 35 / 12), tol: { abs: 0.05 }, hint: 'Add 100 variances, then take the square root.', sol: '√(100 × 35/12) = √291.7 ≈ <b>17.1</b>.' },
            { q: 'And of their average?', a: Math.sqrt(100 * 35 / 12) / 100, tol: { abs: 0.002 }, hint: 'Divide the total by 100.', sol: '17.1/100 ≈ <b>0.171</b>.' },
          ] },
        { h: 'Covariance and correlation', html: `<p>Cov(X, Y) = E[XY] − E[X]E[Y] measures how X and Y move together. In general Var(X ± Y) = Var(X) + Var(Y) ± 2Cov(X, Y). Correlation ρ = Cov/(σ_X σ_Y) lies between −1 and 1. Zero correlation doesn't mean independence (Y = X² with X symmetric). This is the maths of diversification: combining positively correlated bets reduces risk less.</p>`,
          checks: [
            { q: 'X and Y each have variance 1 and correlation 0.5. What is Var(X − Y)?', a: 1, hint: 'Var(X) + Var(Y) − 2Cov(X, Y), with Cov = ρσσ.', sol: '1 + 1 − 2 × 0.5 = <b>1</b>.' },
            { q: 'X and Y are independent, each with variance 1. What is the correlation between X and X + Y?', a: Math.SQRT1_2, tol: { abs: 0.005 }, hint: 'Cov(X, X + Y) = Var(X). What is the standard deviation of X + Y?', sol: 'Cov = 1, sd(X + Y) = √2, so ρ = 1/√2 ≈ <b>0.707</b>.' },
          ] },
      ],
      takeaways: ['Var = E[X²] − (E[X])²; σ = √Var.', 'Var(aX + b) = a² Var(X).', 'Independent variances add: totals spread like √n, averages shrink like 1/√n.', 'Var(X ± Y) = Var X + Var Y ± 2Cov; zero correlation ≠ independence.'],
      practice: [['Moments topic', '#/topic/moments'], ['Formula cards', '#/flashcards']],
    },

    // ---------------------------------------------------------------- planned (outline for now)
    // ---------------------------------------------------------------- Part 2
    distributions: {
      title: 'The distributions you need', minutes: 30,
      goals: ['Recognise the binomial, geometric, Poisson, exponential and normal from a description', 'Know each one\'s mean and variance without looking them up', 'Use the normal\'s 68–95–99.7 rule for quick probabilities'],
      sections: [
        { h: 'Binomial: counting successes', html: `<p>n independent trials, each a success with probability p. The number of successes X is <b>binomial</b>: P(X = k) = C(n, k) p<sup>k</sup>(1 − p)<sup>n − k</sup>, with mean np and variance np(1 − p). It's a sum of n independent 0/1 variables, which is where the mean and variance come from.</p>`, widget: 'dist',
          checks: [
            { q: 'A fair coin is flipped 10 times. What is the probability of exactly 3 heads?', a: 120 / 1024, tol: { abs: 0.001 }, hint: 'C(10, 3) ways, each with probability (½)¹⁰.', sol: 'C(10, 3)/2¹⁰ = 120/1024 ≈ <b>0.117</b>.' },
            { q: 'What is the standard deviation of the number of heads in 400 fair flips?', a: 10, hint: '√(np(1 − p)).', sol: '√(400 × ¼) = √100 = <b>10</b>.' },
          ] },
        { h: 'Geometric: waiting for the first success', html: `<p>Repeat independent trials until the first success. The number of trials is <b>geometric</b>: P(first success on trial k) = (1 − p)<sup>k − 1</sup>p, with mean 1/p and variance (1 − p)/p². "On average you wait 1/p tries" answers a surprising number of interview questions.</p>`,
          checks: [{ q: 'You roll a die until it shows a 1 or a 2. What is the expected number of rolls?', a: 3, hint: 'Each roll succeeds with probability 2/6.', sol: 'p = 1/3, so 1/p = <b>3</b>.' }] },
        { h: 'Poisson: counting rare events', html: `<p>When events happen independently at a steady average rate λ per unit of time (trades, arrivals, typos), the count in one unit is <b>Poisson</b>: P(X = k) = e<sup>−λ</sup> λ<sup>k</sup>/k!. Mean and variance are both λ. It's also the limit of a binomial with many trials and a small p, with λ = np.</p>`,
          checks: [{ q: 'Trades arrive at an average of 2 a minute, independently. What is the probability of no trades in a given minute?', a: Math.exp(-2), tol: { abs: 0.002 }, hint: 'P(X = 0) = e<sup>−λ</sup>.', sol: 'e<sup>−2</sup> ≈ <b>0.135</b>.' }] },
        { h: 'Exponential: waiting times with no memory', html: `<p>The time between Poisson events is <b>exponential</b> with rate λ: mean 1/λ. It's <b>memoryless</b>: having already waited doesn't change how much longer you'll wait. That breaks most people's intuition.</p>`,
          checks: [{ q: 'Buses arrive as a Poisson process, one every 10 minutes on average. You have already waited 5 minutes. How many more minutes do you expect to wait?', a: 10, hint: 'Memorylessness.', sol: 'Still <b>10</b> minutes: the process doesn\'t remember how long you\'ve been there.' }] },
        { h: 'The normal distribution', html: `<p>Sums of many small independent effects are approximately <b>normal</b> (the central limit theorem, Part 3). For a normal with mean μ and standard deviation σ: about 68% lies within 1σ, 95% within 2σ, and 99.7% within 3σ. To use it, <b>standardise</b>: z = (x − μ)/σ.</p>`,
          checks: [{ q: 'X is normal with mean 100 and standard deviation 15. Roughly what is P(X > 130)?', a: 1 - 0.97725, tol: { abs: 0.003 }, hint: '130 is 2 standard deviations above the mean; 95% lies within ±2σ.', sol: 'z = 2. 5% lies outside ±2σ, half of it above: ≈ <b>0.025</b> (exactly 0.0228).' }] },
      ],
      takeaways: ['Binomial: successes in n trials; mean np, variance np(1 − p).', 'Geometric: trials until the first success; mean 1/p.', 'Poisson: rare events at rate λ; mean = variance = λ.', 'Exponential: memoryless waiting; mean 1/λ.', 'Normal: 68–95–99.7; standardise with z = (x − μ)/σ.'],
      practice: [['Distributions topic', '#/topic/dist'], ['Formula cards', '#/flashcards']],
    },

    symmetry: {
      title: 'Symmetry and clever counting', minutes: 30,
      goals: ['Spot symmetries that make an answer obvious', 'Use indicator variables on harder counting questions', 'Use the "equal gaps" argument for positions in a random order'],
      sections: [
        { h: 'Symmetry first', html: `<p>Before calculating, ask what can't matter. In a shuffled deck, the ace of spades is equally likely to be above or below the king of spades. Two players with identical chances have identical win probabilities. Symmetry often gives the answer outright, or reduces it to "½ of what's left".</p>`,
          checks: [
            { q: 'A deck is shuffled. What is the probability the ace of spades is above the king of spades?', a: 0.5, hint: 'Swap the two cards.', sol: 'Swapping them maps every arrangement to one with the opposite order: <b>½</b>.' },
            { q: '4 fair coin flips. What is the probability of more heads than tails?', a: 5 / 16, hint: 'More heads, more tails, or a tie. The first two are symmetric.', sol: 'P(tie) = C(4, 2)/16 = 6/16. The rest splits evenly: (1 − 6/16)/2 = <b>5/16</b>.' },
          ] },
        { h: 'Indicators for harder counts', html: `<p>Linearity plus indicators (Part 1) handles counts that look hopeless. The number of runs in a sequence of flips is 1 plus the number of places where a flip differs from the one before. The number of empty boxes is a sum of "box i is empty" indicators.</p>`,
          checks: [
            { q: 'A coin is flipped 10 times. What is the expected number of runs (maximal blocks of the same side, e.g. HHTH has 3)?', a: 5.5, hint: 'Runs = 1 + the number of switches between consecutive flips.', sol: '9 adjacent pairs, each a switch with probability ½: 1 + 9 × ½ = <b>5.5</b>.' },
            { q: '10 balls are dropped independently into 10 boxes. What is the expected number of empty boxes?', a: 10 * 0.9 ** 10, tol: { abs: 0.02 }, hint: 'Each box is empty with probability (9/10)¹⁰.', sol: '10 × 0.9¹⁰ ≈ 10 × 0.349 ≈ <b>3.49</b>.' },
          ] },
        { h: 'Equal gaps', html: `<p>Place K special items at random among N in a row (say aces in a deck). By symmetry, the K items split the other N − K into K + 1 gaps of equal expected size. So the first special item appears on average at position (N + 1)/(K + 1).</p>`,
          checks: [{ q: 'Turning over a shuffled deck, at what position does the first heart appear on average?', a: 53 / 14, tol: { abs: 0.01 }, hint: '13 hearts split the 39 other cards into 14 gaps.', sol: '(52 + 1)/(13 + 1) = 53/14 ≈ <b>3.79</b>.' }] },
      ],
      takeaways: ['Ask what can\'t matter: symmetry often gives the answer outright.', 'Ties break symmetry: (1 − P(tie))/2.', 'Write counts as sums of indicators.', 'K random special items among N: the first is at (N + 1)/(K + 1) on average.'],
      practice: [['Puzzles topic', '#/topic/puzzles'], ['Classic puzzles', '#/bank/common'], ['Ants on a stick', '#/iq/wc-ants']],
    },

    recursion: {
      title: 'First-step analysis', minutes: 30,
      goals: ['Write an equation for an unknown by conditioning on what happens first', 'Solve waiting-time and win-probability problems this way', 'Handle patterns of coin flips, including overlapping ones'],
      sections: [
        { h: 'Condition on the first step', html: `<p>Call the answer E (or p). Ask what can happen on the first step, and what the problem looks like afterwards. Often it looks like the original problem again, so E appears on both sides. For the expected number of rolls to get a six: E = 1 + (5/6)E, so E = 6.</p>`,
          checks: [{ q: 'A and B take turns rolling a die, A first. The first to roll a six wins. What is A\'s chance of winning?', a: 6 / 11, hint: 'If neither of the first two rolls is a six, A is back where she started: p = 1/6 + (5/6)(5/6)p.', sol: 'p = (1/6)/(1 − 25/36) = (1/6)/(11/36) = <b>6/11</b>.' }] },
        { h: 'Patterns of flips', html: `<p>To find the expected wait for a pattern, track how much of it you've built so far. Each state gets an equation. Patterns that overlap with themselves (like HTH, which starts again with its own last H) take longer than ones that don't.</p>`,
          checks: [
            { q: 'What is the expected number of fair coin flips until you first see HT?', a: 4, hint: 'Once you have an H, you only need a T: wait for an H (2 flips), then a T (2 more).', sol: '2 + 2 = <b>4</b>. An H that follows an H doesn\'t lose progress.' },
            { q: 'And until HHH?', a: 14, hint: 'States 0, H, HH. A tail always sends you back to the start.', sol: 'E₂ = 1 + ½E₀, E₁ = 1 + ½E₂ + ½E₀, E₀ = 1 + ½E₁ + ½E₀. Solving gives E₀ = <b>14</b> (= 2 + 4 + 8).' },
          ] },
        { h: 'Games that loop back', html: `<p>Tennis from deuce, table tennis at 10–10: you need two points in a row, and a split returns you to the same state. Look at pairs of points: P(win) = p²/(p² + q²), ignoring the splits.</p>`,
          checks: [{ q: 'You win each point with probability 2/3. From deuce, what is your probability of winning the game?', a: 4 / 5, hint: 'p² = 4/9 and q² = 1/9.', sol: '(4/9)/(4/9 + 1/9) = <b>4/5</b>.' }] },
        { h: 'Explore: race the patterns', html: `<p>Simulate any three-flip pattern and compare with the exact answer.</p>`, widget: 'pattern' },
      ],
      takeaways: ['Name the unknown, condition on the first step, and solve the equation.', 'Patterns: one state per prefix you\'ve built.', 'Self-overlapping patterns take longer (HTH: 10, HHH: 14, but HTT: 8).', 'Loops back to the same state: only the steps that end the game matter.'],
      practice: [['Expected value topic', '#/topic/ev'], ['HTH', '#/iq/sig-hth'], ['HHT v HTT', '#/iq/js-hht-htt'], ['Deuce', '#/iq/wc-deuce']],
    },

    markov: {
      title: 'Markov chains', minutes: 30,
      goals: ['Model a process as states with transition probabilities', 'Find stationary distributions and return times', 'Compute expected hitting times by first-step analysis on the states'],
      sections: [
        { h: 'States and transitions', html: `<p>A <b>Markov chain</b> moves between states, and where it goes next depends only on where it is now. Draw the states and arrows with probabilities, then look for structure: symmetric states can be merged (all corners of a cube at the same distance from the target behave alike).</p>`, widget: 'markov',
          checks: [{ q: 'Weather: a sunny day is followed by rain with probability 0.2; a rainy day by sun with probability 0.4. In the long run, what fraction of days are rainy?', a: 1 / 3, hint: 'In balance, the flow sunny → rainy equals the flow rainy → sunny.', sol: 'π<sub>S</sub> × 0.2 = π<sub>R</sub> × 0.4, so π<sub>R</sub> = 0.2/(0.2 + 0.4) = <b>1/3</b>.' }] },
        { h: 'Return times', html: `<p>In the long run, if the chain spends a fraction π of its time in a state, it returns to that state every 1/π steps on average.</p>`,
          checks: [{ q: 'In the weather chain, starting on a sunny day, how many days until the next sunny day, on average?', a: 1.5, hint: 'π<sub>S</sub> = 2/3.', sol: '1/π<sub>S</sub> = 1/(2/3) = <b>1.5</b> days.' }] },
        { h: 'Hitting times', html: `<p>To find the expected time to reach a target, write h<sub>i</sub> = 1 + Σ P(i → j) h<sub>j</sub> for every state i (with h = 0 at the target) and solve. Symmetry keeps the system small.</p>`,
          checks: [{ q: 'A walker on positions 0, 1, 2, 3 moves left or right with probability ½ each, except that from 0 it always moves to 1. Starting at 0, what is the expected number of steps to reach 3?', a: 9, hint: 'h₃ = 0, h₀ = 1 + h₁, and h<sub>i</sub> = 1 + ½h<sub>i−1</sub> + ½h<sub>i+1</sub> for i = 1, 2.', sol: 'Solving: h₂ = 5, h₁ = 8, h₀ = <b>9</b>. In general n² steps to reach n from a reflecting wall.' }] },
      ],
      takeaways: ['Next state depends only on the current one.', 'Stationary distribution: balance the flows; return time = 1/π.', 'Hitting times: one equation per state, h = 1 + Σ P h.', 'Merge symmetric states before solving.'],
      practice: [['Markov chains topic', '#/topic/markov'], ['Cube walk', '#/iq/wc-cube-walk'], ['Random rook', '#/iq/drw-rook']],
    },

    walks: {
      title: 'Random walks and martingales', minutes: 30,
      goals: ['Solve gambler\'s ruin, fair and biased', 'Use the martingale trick: a fair game\'s expected value never changes', 'Find expected durations with Wald\'s identity and the i(N − i) formula'],
      sections: [
        { h: 'Fair games are martingales', html: `<p>If each step has expected change zero, your expected position at any stopping time is where you started. For a fair ±1 walk from i that stops at 0 or N: i = N × P(reach N), so P(reach N) = i/N.</p>`, widget: 'walk',
          checks: [
            { q: 'You have $3 and bet $1 on fair coin flips until you have $10 or nothing. What is the probability you reach $10?', a: 0.3, hint: 'Your expected wealth stays at 3.', sol: '3/10 = <b>0.3</b>.' },
            { q: 'How many flips does that game last on average?', a: 21, hint: 'For a fair walk between barriers, the expected duration is i(N − i).', sol: '3 × 7 = <b>21</b>.' },
          ] },
        { h: 'Biased walks', html: `<p>If each step is +1 with probability p and −1 with q = 1 − p, let r = q/p. Then P(reach N before 0, starting from i) = (1 − r<sup>i</sup>)/(1 − r<sup>N</sup>). (The quantity r<sup>X</sup> is a martingale, which is where this comes from.)</p>`,
          checks: [{ q: 'Steps are +1 with probability 0.6. Starting at 2, what is the probability of reaching 4 before 0?', a: 9 / 13, tol: { abs: 0.003 }, hint: 'r = 0.4/0.6 = 2/3.', sol: '(1 − 4/9)/(1 − 16/81) = (5/9)/(65/81) = <b>9/13</b> ≈ 0.69.' }] },
        { h: 'Wald\'s identity', html: `<p>For a walk with average step μ, stopped at a time T that doesn't peek into the future, E[position at T] = μ × E[T]. If the walk hits its target exactly (steps of ±1), that gives E[T] directly.</p>`,
          checks: [{ q: 'A walk steps +1 with probability 0.6 and −1 with 0.4, starting at 0. What is the expected number of steps to first reach +5?', a: 25, hint: 'The drift is 0.6 − 0.4 per step.', sol: '5 = 0.2 × E[T], so E[T] = <b>25</b>.' }] },
      ],
      takeaways: ['Fair game: expected value at the stop = start, so P(reach N) = i/N.', 'Fair walk duration between barriers: i(N − i).', 'Biased: (1 − r<sup>i</sup>)/(1 − r<sup>N</sup>) with r = q/p.', 'Wald: target = drift × expected time.'],
      practice: [['Random walks topic', '#/topic/walks'], ['Gambler\'s ruin', '#/iq/fr-ruin-6-4'], ['Walk to −100 or +50', '#/iq/imc-walk']],
    },

    stopping: {
      title: 'Optimal stopping and dynamic programming', minutes: 30,
      goals: ['Solve stopping games by backward induction', 'Set thresholds: stop when what you have beats what continuing is worth', 'Value options to continue, including costly ones'],
      sections: [
        { h: 'Work backwards', html: `<p>In a game with a limited number of chances, solve the last decision first. Its value tells you the threshold for the decision before it. In "roll a die, reroll if you like, keep the last roll": a reroll is worth 3.5, so keep 4, 5 and 6.</p>`,
          checks: [
            { q: 'With one reroll allowed, what is the game worth?', a: 4.25, hint: 'Keep 4–6; reroll otherwise for 3.5.', sol: '(4 + 5 + 6)/6 + (3/6) × 3.5 = 2.5 + 1.75 = <b>4.25</b>.' },
            { q: 'With two rerolls?', a: 14 / 3, tol: { abs: 0.01 }, hint: 'Continuing is now worth 4.25, so keep only 5 and 6.', sol: '(5 + 6)/6 + (4/6) × 4.25 = <b>14/3</b> ≈ 4.67.' },
          ] },
        { h: 'Options have value', html: `<p>The right to do something later is worth the improvement it brings: value with the option minus value without it. Interviewers often ask "what would you pay for the reroll?"</p>`,
          checks: [{ q: 'What is the option of one reroll worth?', a: 0.75, hint: 'Compare with no reroll.', sol: '4.25 − 3.5 = <b>$0.75</b>.' }] },
        { h: 'Costly, unlimited tries', html: `<p>If you may reroll forever but each reroll costs c, the game's value V satisfies a stationary threshold rule: stop on x when x ≥ V − c. Try thresholds "stop on the top k faces" and pick the best.</p>`,
          checks: [{ q: 'A die pays its face; you may reroll as often as you like for $1 each time. What is the game worth?', a: 4, hint: 'Value of "stop on the top k faces" = (13 − k)/2 − (6/k − 1). Try k = 3 and k = 4.', sol: 'k = 3: 5 − 1 = 4; k = 4: 4.5 − 0.5 = 4. Both give <b>$4</b>: stop on 4 or more (indifferent at 3).' }] },
        { h: 'The secretary problem', html: `<p>When you can't go back, a good rule is: observe some, then take the first that beats everything seen. Skipping the first n/e (about 37%) wins about 37% of the time, for any large n.</p>`,
          checks: [{ q: 'With 100 candidates, about how many should you see and reject before choosing?', a: 37, tol: { abs: 1.5 }, hint: 'n/e.', sol: '100/e ≈ <b>37</b>.' }] },
        { h: 'Explore: more rerolls', html: `<p>With more rerolls, the same backward reasoning gives a higher threshold and a higher value.</p>`, widget: 'reroll' },
      ],
      takeaways: ['Solve the last decision first; its value sets the earlier thresholds.', 'Stop when what you have beats what continuing is worth.', 'Option value = value with it − value without it.', 'Can\'t go back: skip about 37%, then take the next best-so-far.'],
      practice: [['Reroll game', '#/iq/js-reroll'], ['Paid rerolls', '#/iq/js-d100-pay'], ['Secretary problem', '#/iq/cl-secretary'], ['Hat game', '#/iq/wc-hat']],
    },

    continuous: {
      title: 'Continuous probability and geometry', minutes: 30,
      goals: ['Turn uniform-random questions into areas', 'Know the order statistics of uniforms', 'Compute expectations by integrating or by symmetry'],
      sections: [
        { h: 'Probability as area', html: `<p>Two independent uniforms on [0, 1] are a random point in the unit square, so a probability is just the area of a region. Draw it. The meeting problem, the broken stick and many "random time" questions become geometry.</p>`, widget: 'area',
          checks: [
            { q: 'X and Y are independent uniforms on [0, 1]. What is P(X + Y < 1.5)?', a: 0.875, hint: 'Only a corner triangle has X + Y ≥ 1.5.', sol: 'The corner triangle has legs ½, area ⅛. P = 1 − ⅛ = <b>0.875</b>.' },
            { q: 'Two people arrive at random times within an hour and each waits 10 minutes. What is the probability they meet?', a: 11 / 36, tol: { abs: 0.003 }, hint: 'They miss in two corner triangles with legs 5/6.', sol: '1 − (5/6)² = <b>11/36</b> ≈ 0.31.' },
          ] },
        { h: 'Order statistics', html: `<p>Drop n uniform points on [0, 1]. By the equal-gaps argument (Part 2, symmetry), they split the interval into n + 1 pieces of equal expected length 1/(n + 1). So E[min] = 1/(n + 1) and E[max] = n/(n + 1).</p>`,
          checks: [
            { q: 'What is the expected maximum of 3 independent uniforms on [0, 1]?', a: 0.75, hint: 'n/(n + 1).', sol: '3/4 = <b>0.75</b>.' },
            { q: 'A stick is broken at two uniformly random points. What is the expected length of the shortest piece?', a: 1 / 9, tol: { abs: 0.002 }, hint: 'Find P(shortest > t): every piece must exceed t, which leaves a triangle of side 1 − 3t. Then E = ∫ P(shortest > t) dt.', sol: '1/3² = <b>1/9</b>. (The longest averages 11/18.)' },
          ] },
        { h: 'Integrating when you have to', html: `<p>E[g(X)] = ∫ g(x) f(x) dx. For a uniform on [0, 1], f = 1, so it's just the average of g over the interval. Look for symmetry first: E[|X − ½|] is the average distance from the middle.</p>`,
          checks: [{ q: 'X is uniform on [0, 1]. What is E[|X − ½|]?', a: 0.25, hint: '|X − ½| is uniform on [0, ½].', sol: 'Uniform on [0, ½], so its mean is <b>¼</b>.' }] },
      ],
      takeaways: ['Two uniforms = a point in the square; probabilities are areas.', 'n uniform points: equal expected gaps of 1/(n + 1).', 'E[max of n] = n/(n + 1); E[min] = 1/(n + 1).', 'Use symmetry before integrating.'],
      practice: [['Broken stick', '#/iq/wc-stick-triangle'], ['Meeting problem', '#/iq/sq-meeting'], ['Semicircle', '#/iq/cl-semicircle'], ['Distance to an edge', '#/iq/hrt-edge-distance']],
    },
    clt: { planned: true, title: 'The law of large numbers and the CLT', blurb: 'Why averages settle down, why sums look normal, and the normal approximation you\'ll use constantly.', practice: [['Stats lab', '#/lab'], ['Inference topic', '#/topic/inference']] },
    estimation: { planned: true, title: 'Estimation and regression', blurb: 'Estimators, bias and variance, maximum likelihood, confidence intervals and least squares.', practice: [['Inference topic', '#/topic/inference'], ['Regression topic', '#/topic/regression']] },
    betting: { planned: true, title: 'Betting and position sizing', blurb: 'Expected value isn\'t enough: risk, the Kelly criterion, and why over-betting a winning edge loses money.', practice: [['Bet sizing game', '#/kelly'], ['Finance topic', '#/topic/finance']] },
    'market-making': { planned: true, title: 'Market making', blurb: 'Fair value, bids and offers, spread width, adverse selection and managing inventory.', practice: [['Make me a market', '#/quote'], ['Market making on dice', '#/market'], ['Figgie', '#/figgie']] },
    options: { planned: true, title: 'Options', blurb: 'Payoffs, put–call parity, the Greeks by intuition, and common strategies.', practice: [['Options topic', '#/topic/options'], ['Options interview questions', '#/search/options']] },
    fermi: { planned: true, title: 'Estimation and calibration', blurb: 'Fermi estimates, confidence ranges that are actually 90%, and turning estimates into markets.', practice: [['Estimation game', '#/estimate']] },
    games: { planned: true, title: 'Game theory for traders', blurb: 'Mixed strategies, bluffing frequencies, and backward induction in games like the pirate vote.', practice: [['Two-card poker', '#/iq/fr-poker'], ['Pirate vote', '#/iq/tib-pirates']] },
    craft: { planned: true, title: 'On the day', blurb: 'Think aloud, structure your answer, estimate first, sanity-check, and recover from mistakes.', practice: [['Think aloud', '#/talk'], ['Mock interview', '#/mock']] },
  };

  QT.handbook = { PARTS, CHAPTERS };
})();
