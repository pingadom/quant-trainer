<!-- theo-content-v1. After editing, run: node tools/import-content.js -->

## C.1 Probability

### q-prob-001
- **track:** probability
- **tags:** [expectation, dice, distribution-of-max]
- **difficulty:** 2
- **time_target_s:** 120
- **prompt:** Two fair dice are rolled. What is the expected value of the maximum?
- **hint_1:** Find P(max ≤ k) first.
- **hint_2:** P(max = k) = P(max ≤ k) − P(max ≤ k−1).
- **answer:** 161/36
- **answer_numeric:** 4.4722
- **tolerance:** 0.01
- **solution:**
  P(max ≤ k) = (k/6)² = k²/36, so P(max = k) = (k² − (k−1)²)/36 = (2k−1)/36.
  E = Σₖ k(2k−1)/36 = (2Σk² − Σk)/36 = (2·91 − 21)/36 = 161/36 ≈ 4.47.

### q-prob-002
- **track:** probability
- **tags:** [conditional, classic]
- **difficulty:** 1
- **time_target_s:** 60
- **prompt:** A family has two children and at least one is a boy. What is the probability both are boys?
- **hint_1:** List the equally likely outcomes.
- **hint_2:** The condition rules out only GG.
- **answer:** 1/3
- **answer_numeric:** 0.3333
- **tolerance:** 0.005
- **solution:**
  Equally likely outcomes: BB, BG, GB, GG. The condition removes GG, leaving 3, of which 1 (BB) has two boys. P = 1/3.

### q-prob-003
- **track:** probability
- **tags:** [conditional, classic, monty-hall]
- **difficulty:** 1
- **time_target_s:** 60
- **prompt:** In the Monty Hall problem, what is the probability of winning if you switch?
- **hint_1:** How often is your first pick right?
- **hint_2:** The host's reveal never changes that.
- **answer:** 2/3
- **answer_numeric:** 0.6667
- **tolerance:** 0.005
- **solution:**
  Your first pick is right with probability 1/3. The host always opens a goat door, which gives no new information about your door. Switching wins exactly when your first pick was wrong: 2/3.

### q-prob-004
- **track:** probability
- **tags:** [bayes, base-rates]
- **difficulty:** 2
- **time_target_s:** 120
- **prompt:** A disease affects 1% of people. A test detects 99% of true cases and gives false positives for 5% of healthy people. Given a positive test, what is P(disease)?
- **hint_1:** Use Bayes. Compute P(+) using the law of total probability.
- **hint_2:** P(+) = 0.01·0.99 + 0.99·0.05.
- **answer:** 1/6
- **answer_numeric:** 0.1667
- **tolerance:** 0.005
- **solution:**
  P(+) = 0.0099 + 0.0495 = 0.0594. P(D|+) = 0.0099/0.0594 = 1/6 ≈ 16.7%.
  False positives from the large healthy group swamp the true positives.

### q-prob-005
- **track:** probability
- **tags:** [coupon-collector, expectation, geometric]
- **difficulty:** 3
- **time_target_s:** 150
- **prompt:** What is the expected number of rolls of a fair die to see every face at least once?
- **hint_1:** Split the process into stages: waiting for the 1st new face, the 2nd, and so on.
- **hint_2:** With k faces already seen, the wait for a new one is Geometric((6−k)/6).
- **answer:** 14.7
- **answer_numeric:** 14.7
- **tolerance:** 0.05
- **solution:**
  Stage k (having seen k faces) has expected length 6/(6−k). Sum = 6(1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6) = 6 × 2.45 = 14.7.

### q-prob-006
- **track:** probability
- **tags:** [first-step-analysis, coins]
- **difficulty:** 3
- **time_target_s:** 150
- **prompt:** What is the expected number of fair coin flips until you get two heads in a row?
- **hint_1:** Define E (from scratch) and E₁ (just flipped an H).
- **hint_2:** E = 1 + ½E₁ + ½E and E₁ = 1 + ½·0 + ½E.
- **answer:** 6
- **answer_numeric:** 6
- **tolerance:** 0
- **solution:**
  From E₁ = 1 + ½E, substitute into E = 1 + ½(1 + ½E) + ½E = 1.5 + ¾E, so ¼E = 1.5 and E = 6.
  (For HT the answer is 4, because a failed attempt still leaves you with an H.)

### q-prob-007
- **track:** probability
- **tags:** [first-step-analysis, dice]
- **difficulty:** 3
- **time_target_s:** 150
- **prompt:** What is the expected number of die rolls until two 6s in a row?
- **hint_1:** You need a 6 first, which takes 6 rolls on average.
- **hint_2:** After that 6, one more roll either finishes or sends you back to the start.
- **answer:** 42
- **answer_numeric:** 42
- **tolerance:** 0
- **solution:**
  E = 6 + 1 + (5/6)E, so (1/6)E = 7 and E = 42.

### q-prob-008
- **track:** probability
- **tags:** [symmetry, cards, expectation]
- **difficulty:** 3
- **time_target_s:** 120
- **prompt:** A standard deck is shuffled. What is the expected position of the first ace?
- **hint_1:** The 4 aces split the other 48 cards into 5 gaps.
- **hint_2:** By symmetry, every gap has the same expected size.
- **answer:** 10.6
- **answer_numeric:** 10.6
- **tolerance:** 0.01
- **solution:**
  Each of the 5 gaps holds 48/5 = 9.6 cards on average. The first ace comes right after the first gap: 9.6 + 1 = 10.6 = (52+1)/(4+1).

### q-prob-009
- **track:** probability
- **tags:** [geometric-probability, continuous]
- **difficulty:** 4
- **time_target_s:** 240
- **prompt:** A stick is broken at two uniformly random points. What is the probability the three pieces form a triangle?
- **hint_1:** The triangle inequality means every piece must be shorter than ½.
- **hint_2:** Draw the unit square of (x, y) and shade the region where that holds.
- **answer:** 1/4
- **answer_numeric:** 0.25
- **tolerance:** 0.005
- **solution:**
  Take x < y (half the square, by symmetry). The pieces are x, y−x and 1−y, and each must be < ½, so x < ½, y > ½ and y − x < ½. This region is a triangle of area 1/8 inside the half-square of area ½, giving 1/4.

### q-prob-010
- **track:** probability
- **tags:** [symmetry, classic]
- **difficulty:** 1
- **time_target_s:** 60
- **prompt:** Three ants sit at the corners of a triangle and each picks a random direction along an edge. What is the probability that at least two collide?
- **hint_1:** When is there no collision?
- **hint_2:** Only when all three move the same way.
- **answer:** 3/4
- **answer_numeric:** 0.75
- **tolerance:** 0.005
- **solution:**
  There are 2³ = 8 equally likely direction choices. Only 2 (all clockwise or all anticlockwise) avoid a collision. P = 1 − 2/8 = 3/4.

### q-prob-011
- **track:** probability
- **tags:** [random-walk, gamblers-ruin, martingale]
- **difficulty:** 3
- **time_target_s:** 120
- **prompt:** A fair ±1 random walk starts at 1 and stops at 0 or 3. What is the probability it reaches 3?
- **hint_1:** For a fair walk, the expected position never changes (it's a martingale).
- **hint_2:** 1 = 3p + 0(1−p).
- **answer:** 1/3
- **answer_numeric:** 0.3333
- **tolerance:** 0.005
- **solution:**
  The expected final position equals the start: 3p = 1, so p = 1/3. In general, P(hit N before 0 | start at k) = k/N.

### q-prob-012
- **track:** probability
- **tags:** [order-statistics, uniform, continuous]
- **difficulty:** 2
- **time_target_s:** 90
- **prompt:** Two independent Uniform(0,1) values are drawn. What is the expected value of the larger one?
- **hint_1:** P(max ≤ x) = x².
- **hint_2:** Differentiate to get the density, then integrate x·f(x).
- **answer:** 2/3
- **answer_numeric:** 0.6667
- **tolerance:** 0.005
- **solution:**
  The density is 2x, so E = ∫₀¹ x·2x dx = 2/3. In general, E[max of n] = n/(n+1), and the minimum of two has expectation 1/3.

### q-prob-013
- **track:** probability
- **tags:** [linearity, indicators, permutations]
- **difficulty:** 2
- **time_target_s:** 90
- **prompt:** A deck of n cards is shuffled uniformly at random. What is the expected number of cards that end up in their original position?
- **hint_1:** Let Iᵢ = 1 if card i stays in place.
- **hint_2:** Use linearity. Independence isn't needed.
- **answer:** 1
- **answer_numeric:** 1
- **tolerance:** 0
- **solution:**
  E[Iᵢ] = 1/n. Summing over n cards gives 1, for any n.

## C.2 Expected value and decisions

### q-ev-001
- **track:** expected-value
- **tags:** [optimal-stopping, dice]
- **difficulty:** 2
- **time_target_s:** 90
- **prompt:** You roll a die and may reroll once, keeping the final value. What is the fair price of this game?
- **hint_1:** A reroll is worth 3.5.
- **hint_2:** Keep any roll above 3.5.
- **answer:** 4.25
- **answer_numeric:** 4.25
- **tolerance:** 0.01
- **solution:**
  Keep 4, 5, 6 (average 5, with probability ½). Otherwise reroll for 3.5. EV = ½·5 + ½·3.5 = 4.25.

### q-ev-002
- **track:** expected-value
- **tags:** [optimal-stopping, dice, backward-induction]
- **difficulty:** 3
- **time_target_s:** 120
- **prompt:** Same game, but you may reroll up to twice. What is the fair price?
- **hint_1:** Work backwards. With one reroll left, the game is worth 4.25.
- **hint_2:** On the first roll, keep only results above 4.25.
- **answer:** 14/3
- **answer_numeric:** 4.6667
- **tolerance:** 0.01
- **solution:**
  Keep 5 or 6 (average 5.5, with probability 1/3). Otherwise continue for 4.25. EV = (1/3)·5.5 + (2/3)·4.25 = 1.8333 + 2.8333 = 14/3.

### q-ev-003
- **track:** expected-value
- **tags:** [pricing, dice, second-moment]
- **difficulty:** 1
- **time_target_s:** 60
- **prompt:** A game pays the square of one die roll. What is the fair price?
- **hint_1:** You need E[X²], not E[X]².
- **hint_2:** 1+4+9+16+25+36 = 91.
- **answer:** 91/6
- **answer_numeric:** 15.1667
- **tolerance:** 0.01
- **solution:**
  E[X²] = 91/6 ≈ 15.17. Note that E[X]² = 12.25 is lower. The gap is the variance, 35/12.

### q-ev-004
- **track:** expected-value
- **tags:** [kelly, sizing, risk]
- **difficulty:** 2
- **time_target_s:** 90
- **prompt:** You win 60% of even-money bets. What fraction of your bankroll should you bet each time to maximise long-run growth?
- **hint_1:** Kelly: f* = (bp − q)/b.
- **hint_2:** Here b = 1.
- **answer:** 0.2
- **answer_numeric:** 0.2
- **tolerance:** 0.005
- **solution:**
  f* = 0.6 − 0.4 = 0.2, so bet 20%. In practice people often use half Kelly (10%) to cut variance while keeping about 75% of the growth rate.

## C.3 Market making (use with the A3 simulator)

### q-mm-001
- **track:** market-making
- **tags:** [quoting, updating, dice]
- **difficulty:** 2
- **time_target_s:** 120
- **prompt:** Make a market on the sum of two dice. The counterparty buys at your offer, then tells you one die shows a 1. Re-quote.
- **hint_1:** The initial fair value is 7.
- **hint_2:** After the reveal, fair = 1 + 3.5.
- **answer:** "6.5 at 7.5, then 4 at 5"
- **answer_numeric:** 4.5
- **tolerance:** 0.5
- **solution:**
  Fair is 7 and the SD is √(2·35/12) ≈ 2.4, so quote 6.5 at 7.5. You're now short one at 7.5. After the reveal, fair = 4.5, so your short is +3 in expectation. Re-quote around 4.5: 4 at 5. Buying back at 5 locks in a profit of 2.5.

### q-mm-002
- **track:** market-making
- **tags:** [quoting, binomial]
- **difficulty:** 2
- **time_target_s:** 90
- **prompt:** Make a market on the number of heads in 10 fair coin flips.
- **hint_1:** Binomial(10, ½).
- **hint_2:** SD = √(np(1−p)).
- **answer:** "4.5 at 5.5"
- **answer_numeric:** 5
- **tolerance:** 0.5
- **solution:**
  Fair is 5 and the SD is √2.5 ≈ 1.58. A width of about 1 is reasonable, so quote 4.5 at 5.5. Widen if you're unsure the coin is fair.

### q-mm-003
- **track:** market-making
- **tags:** [adverse-selection, inventory]
- **difficulty:** 3
- **time_target_s:** 90
- **prompt:** Your offer is lifted five times in a row. What do you do and why?
- **hint_1:** What does one-directional flow suggest?
- **hint_2:** Think about fair value, width and position separately.
- **answer:** "Raise fair value, widen, skew up"
- **answer_numeric:**
- **tolerance:**
- **solution:**
  Persistent buying suggests informed flow (adverse selection), so revise fair value upwards. Widen while you're uncertain. You're also now short five, so skew your quotes up to attract sellers and discourage more buyers. Never just re-quote the same market.

## C.4 Mental maths

### q-mm-arith-001
- **track:** mental-maths
- **tags:** [multiplication]
- **difficulty:** 1
- **time_target_s:** 10
- **prompt:** 64 × 15
- **hint_1:** 64 × 10 + 64 × 5
- **hint_2:** 640 + 320
- **answer:** 960
- **answer_numeric:** 960
- **tolerance:** 0
- **solution:**
  640 + 320 = 960.

### q-mm-arith-002
- **track:** mental-maths
- **tags:** [percentages]
- **difficulty:** 1
- **time_target_s:** 10
- **prompt:** 7.5% of 480
- **hint_1:** 10% − 2.5%
- **hint_2:** 48 − 12
- **answer:** 36
- **answer_numeric:** 36
- **tolerance:** 0
- **solution:**
  10% of 480 = 48 and 2.5% = 12, so 48 − 12 = 36.

### q-mm-arith-003
- **track:** mental-maths
- **tags:** [squares]
- **difficulty:** 1
- **time_target_s:** 10
- **prompt:** 99²
- **hint_1:** (100 − 1)²
- **hint_2:** 10000 − 200 + 1
- **answer:** 9801
- **answer_numeric:** 9801
- **tolerance:** 0
- **solution:**
  10000 − 200 + 1 = 9801.

### q-mm-arith-004
- **track:** mental-maths
- **tags:** [percent-change, fractions]
- **difficulty:** 2
- **time_target_s:** 15
- **prompt:** A stock moves from 84 to 91. What is the percentage change?
- **hint_1:** Change / start.
- **hint_2:** 7/84 = 1/12.
- **answer:** 8.33%
- **answer_numeric:** 8.333
- **tolerance:** 0.01
- **solution:**
  7/84 = 1/12 ≈ 8.33%.

### q-mm-arith-005
- **track:** mental-maths
- **tags:** [multiplication, powers-of-2]
- **difficulty:** 1
- **time_target_s:** 10
- **prompt:** 125 × 32
- **hint_1:** 125 × 8 = 1000
- **hint_2:** 32 = 8 × 4
- **answer:** 4000
- **answer_numeric:** 4000
- **tolerance:** 0
- **solution:**
  1000 × 4 = 4000.

## C.5 Fermi (use with A4)

### q-fermi-001
- **track:** fermi
- **tags:** [consumer, decomposition]
- **difficulty:** 2
- **time_target_s:** 180
- **prompt:** Estimate the number of cups of coffee drunk in the UK per day.
- **hint_1:** Population × share of coffee drinkers × cups per drinker.
- **hint_2:** Cross-check using the number of cafés.
- **answer:** "About 100 million"
- **answer_numeric:** 103000000
- **tolerance:** "log10 error ≤ 0.3"
- **solution:**
  About 50m adults × 60% drinkers × 2 cups ≈ 60m a day. Cross-check: at 300 cups per café per day, 60m cups would need 200k outlets, which is too many for cafés alone, so most coffee is made at home. That's consistent. The answer is most sensitive to the share of people who drink coffee.
  Reference: the British Coffee Association puts UK consumption at about 103 million cups a day, so this estimate is within a factor of 2.

## C.6 Behavioural prompts (use with A6)

### q-beh-001
- **track:** behavioural
- **tags:** [why-trading]
- **prompt:** Why trading?
- **solution:**
  Model structure: what draws you (decision-making under uncertainty, fast feedback) → evidence (projects, competitions, games of incomplete information such as poker) → why now.

### q-beh-002
- **track:** behavioural
- **tags:** [why-firm, citadel]
- **prompt:** Why Citadel rather than Citadel Securities or a bank?
- **solution:**
  Model structure: a correct statement of fund vs market maker → specific reasons (multi-strategy, investment in technology and data, risk discipline) → fit with your own skills.

### q-beh-003
- **track:** behavioural
- **tags:** [uncertainty, star]
- **prompt:** Tell me about a decision you made with incomplete information.
- **solution:**
  STAR. The Result must be measurable, and close with what you'd do differently.

### q-beh-004
- **track:** behavioural
- **tags:** [project-deep-dive]
- **prompt:** Walk me through your most technical project. What was the hardest design decision?
- **solution:**
  Model structure: problem → approach → one key decision and its trade-off → result → a mistake you fixed. Expect follow-up questions on every claim.
