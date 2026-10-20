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
    distributions: { planned: true, title: 'The distributions you need', blurb: 'Bernoulli, binomial, geometric, Poisson, uniform, exponential and normal: what each models, its mean and variance, and how to spot it.', practice: [['Distributions topic', '#/topic/dist'], ['Formula cards', '#/flashcards']] },
    symmetry: { planned: true, title: 'Symmetry and clever counting', blurb: 'The tricks that turn hard puzzles into one-liners: symmetry, linearity with indicators, and looking at the right random variable.', practice: [['Puzzles topic', '#/topic/puzzles'], ['Classic puzzles', '#/bank/common']] },
    recursion: { planned: true, title: 'First-step analysis', blurb: 'Condition on what happens first and write an equation for the answer: waiting times, patterns like HTH, and win probabilities.', practice: [['Expected value topic', '#/topic/ev'], ['HTH question', '#/iq/sig-hth']] },
    markov: { planned: true, title: 'Markov chains', blurb: 'States, transition probabilities, hitting times and stationary distributions, with the cube walk and the rook.', practice: [['Markov chains topic', '#/topic/markov'], ['Cube walk', '#/iq/wc-cube-walk']] },
    walks: { planned: true, title: 'Random walks and martingales', blurb: 'Gambler\'s ruin, the martingale trick, and expected times between barriers.', practice: [['Random walks topic', '#/topic/walks'], ['Gambler\'s ruin', '#/iq/fr-ruin-6-4']] },
    stopping: { planned: true, title: 'Optimal stopping and dynamic programming', blurb: 'When to stop: reroll games, paid rerolls, the secretary problem and backward induction.', practice: [['Reroll game', '#/iq/js-reroll'], ['Paid rerolls', '#/iq/js-d100-pay']] },
    continuous: { planned: true, title: 'Continuous probability and geometry', blurb: 'Uniform points, order statistics and probability as area: the stick, the meeting problem and the semicircle.', practice: [['Broken stick', '#/iq/wc-stick-triangle'], ['Meeting problem', '#/iq/sq-meeting']] },
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
