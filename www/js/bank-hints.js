// Hints for every interview question, revealed one at a time. Each part's hints build up:
// first a nudge (what to look at), then the method, then the set-up, but never the answer
// itself. Keyed by question id, one list per part (open-ended questions have one list).
// tests/checks.js makes sure every part has hints and that no hint contains its answer.
(function () {
  const HINTS = {
    // ---------------------------------------------------------------- bank.js
    'js-reroll': [
      [`Expected value is the probability-weighted average of the payouts.`, `Each face 1–6 is equally likely, so it's just the average face.`, `Add 1 + 2 + … + 6 and divide by 6.`],
      [`Decide what to do after seeing the first roll: keep it or reroll?`, `What is a reroll worth to you? You must keep whatever comes up.`, `A reroll is worth the single-roll value from (a). Keep any roll above that, reroll the rest.`, `So keep 4, 5, 6 and reroll 1, 2, 3. Value = (average of the kept faces × their probability) + P(reroll) × (value of a reroll).`],
      [`Work backwards from the last decision.`, `With one reroll left the game is worth your answer to (b). That's what the first reroll is worth.`, `On the first roll, keep only faces above the value of continuing. Which faces are those?`, `Keep 5 and 6. Value = (5 + 6)/6 + (4/6) × (answer to b).`],
    ],
    'js-d30-d20': [
      [`Split the game into what you win and what you pay, and find the expectation of each.`, `Condition on your roll x. With 600 equally likely (x, y) pairs, count the ones where you win.`, `If x ≤ 20 you beat x − 1 of their faces (ties go to them); if x > 20 you beat all 20. You collect x each time you win.`, `When you lose you pay their roll y, and you lose whenever x ≤ y. For a given y that happens y times out of 30.`, `E[win] = Σ x·min(x − 1, 20)/600 and E[pay] = Σ y·y/600 over y = 1…20. Subtract.`],
    ],
    'js-d100-pay': [
      [`Guess the shape of a good strategy first: stop once the roll is high enough.`, `Say you stop on any of the top n faces. How many rolls does that take on average, and what do you pay?`, `Each roll stops with probability n/100, so you roll 100/n times on average and pay for 100/n − 1 rerolls. The average stopping value is the mean of the top n faces.`, `Value V(n) = (201 − n)/2 − (100/n − 1). Maximise over n: calculus says n ≈ √200, then check the nearest whole numbers.`],
      [`The cutoff is the lowest face you'd keep under your best n.`, `Equivalent check: reroll whenever your roll is below (game value − $1), because continuing costs $1 and is worth the game value.`, `Use your answer to (a) and see which faces fall below value − 1.`],
    ],
    'js-d20-3d6': [
      [`Compare the two distributions: what are their means?`, `Both have mean 10.5 and are symmetric about it, so by symmetry P(D > S) = P(S > D).`, `So the answer is (1 − P(tie))/2. What is P(tie)?`, `Whatever 3d6 shows (always between 3 and 18), the d20 matches it with probability 1/20.`],
      [`A fair n-sided die has variance (n² − 1)/12.`, `For 3d6, variances of independent dice add: three times the variance of one d6.`, `One d6: (36 − 1)/12. The question asks for the d20 value first.`],
    ],
    'js-two-dice-guess': [
      [`Which total is most likely? Which total is in the middle?`, `To minimise the expected distance from the truth, guess the median.`, `The distribution of two dice is symmetric around its mean, so mean, median and mode coincide.`],
      [`List the distances from your guess and their probabilities.`, `|S − 7| is 0, 1, 2, 3, 4, 5 with counts 6, 10, 8, 6, 4, 2 out of 36.`, `Multiply each distance by its count, add, divide by 36. Equivalently 2·(1·5 + 2·4 + 3·3 + 4·2 + 5·1)/36.`],
    ],
    'sig-three-dice': [
      [`Find the probability of each outcome: triple, exactly a pair, all different.`, `There are 216 equally likely rolls. How many are triples?`, `All different: 6 × 5 × 4 rolls. A pair is whatever's left: 216 − triples − all different.`, `EV = 10·P(triple) + 5·P(pair) − 2·P(all different).`],
    ],
    'sig-painting': [
      [`Weight each outcome by its probability.`, `Real with probability 0.2 (worth 500k), fake with 0.8 (worth 10k).`, `0.2 × 500,000 + 0.8 × 10,000.`],
      [`Find the probability p that makes the painting's expected value equal the price.`, `Expected value as a function of p: p·500k + (1 − p)·10k.`, `Set that equal to 120k and solve for p.`],
    ],
    'sig-97-cards': [
      [`Does the number of cards in the deck matter?`, `Any 4 distinct cards are equally likely to come out in any of their orders.`, `How many orders do 4 cards have, and how many of them are ascending?`],
      [`Use your probability from (a).`, `You win $10 with probability p and lose $1 otherwise.`, `EV = 10p − (1 − p).`],
    ],
    'sig-next-card': [
      [`Before seeing anything, "higher" and "lower" are symmetric.`, `So the answer is (1 − P(same rank))/2.`, `After one card, 51 remain and 3 of them share its rank.`],
      [`Count the cards strictly above a 5.`, `Ranks above 5 are 6 through ace. How many ranks is that, and how many cards each?`, `Divide by the 51 cards left.`],
    ],
    'sig-two-rolls': [
      [`Decide after the first roll: keep it or roll again?`, `A second roll is worth the plain average of a die.`, `Keep faces above that average, roll again otherwise.`, `Value = (sum of kept faces)/6 + P(roll again) × (average of a die).`],
    ],
    'opt-tennis': [
      [`List what can happen from 30–30. Does it remind you of another score?`, `From 30–30 you need two points in a row to win; if the points split you're back at the same situation (deuce).`, `Group points in pairs: win both (p²), lose both (q²), or split (back to the start).`, `Only the pairs that end the game matter: P(win) = p²/(p² + q²).`],
      [`Same formula as (a), with p = 0.9.`, `p² = 0.81 and q² = 0.01.`, `Sanity check before computing: with a 90% point win, should the game be closer to 0.9 or to 1?`],
    ],
    'opt-increasing': [
      [`The dice can repeat, so first think about which rolls even could be strictly increasing.`, `Only rolls with three different values can be.`, `For any set of 3 different values, exactly one of its orders is increasing.`, `Count the sets: choose 3 values from 6. Divide by all 216 rolls.`],
    ],
    'imc-bankrupt': [
      [`Track A's money: it starts at 1 and the game ends at 0 or 3.`, `Let P₁ and P₂ be A's chance of winning everything from $1 and from $2.`, `From $1, A must win the next round: P₁ = (2/3)·P₂. From $2, A wins now or drops back: P₂ = 2/3 + (1/3)·P₁.`, `Solve the two equations. (Or use the gambler's ruin formula with r = q/p = 1/2.)`],
    ],
    'imc-higher-die': [
      [`It's easier to find P(max ≤ m) than P(max = m).`, `max ≤ m means both dice are ≤ m: (m/6)².`, `So P(max = m) = (m/6)² − ((m − 1)/6)² = (2m − 1)/36.`, `E = Σ m(2m − 1)/36 for m = 1…6.`],
    ],
    'imc-odd': [
      [`Each roll is odd with probability 1/2, independently.`, `The number of tries until the first success is geometric.`, `A geometric distribution with success probability p has mean 1/p.`],
    ],
    'cit-cubed': [
      [`Average the six possible payouts.`, `The cubes are 1, 8, 27, 64, 125, 216.`, `Shortcut: 1³ + … + n³ = (1 + … + n)².`],
      [`Cube the expected roll, 3.5.`, `Compare with (a): cubing is convex, so Jensen's inequality says E[X³] ≥ (E[X])³.`, `3.5³ = 3.5 × 12.25.`],
    ],
    'fr-poker': [
      [`Look at it from your opponent's side when you raise: are they facing an ace or a bluff?`, `If you bluff a queen with probability q, a raise is a bluff with probability q/(1 + q).`, `Calling: +2 against a bluff, −2 against an ace. Folding: −1. Make the two equal.`, `Solve 2·q/(1 + q) − 2/(1 + q) = −1 for q.`],
      [`Now look from your side with a queen: compare bluffing with checking.`, `Checking a queen goes to showdown and loses your $1.`, `Bluffing: +1 if they fold, −2 if they call. With call frequency c, that's (1 − c) − 2c.`, `Set that equal to −1 and solve for c.`],
      [`Average over the two cards you could be dealt (each 1/2).`, `With an ace you raise and they call 2/3 of the time: you win 2 when called and 1 when they fold.`, `With a queen you're indifferent, so value it as checking: −1.`, `Game value = ½(ace value) + ½(−1).`],
    ],
    'ts-ols-stream': [
      [`With no intercept, least squares minimises Σ(y − βx)².`, `Differentiate with respect to β and set it to zero.`, `β = Σxy / Σx². Compute both sums for the three points.`],
    ],
    'ts-rent': [
      [`Start by pinning down exactly what you're predicting and how it will be used.`, `Then list the data you'd want: what describes a flat, where it is, and when it's let.`, `Propose a simple, explainable baseline before anything clever.`, `Say how you'd test it honestly (time-based split) and which errors matter most.`],
    ],
    'flow-poker': [
      [`It's easier to find the chance of missing on both cards.`, `On the turn, 38 of the 47 unseen cards miss. On the river, 37 of 46.`, `P(hit) = 1 − (38/47)(37/46). Quick check: the "rule of 4" says outs × 4 %.`],
    ],
    'wc-deuce': [
      [`At 10–10 you need two points in a row; a split brings you back to 10–10.`, `Look at the points in pairs: win–win, lose–lose, or a split.`, `Win–win has probability 0.4², lose–lose 0.6². A split restarts.`, `Ignore the splits: P(win) = 0.4²/(0.4² + 0.6²).`],
      [`Each pair of points ends the game with a fixed probability.`, `That probability is 0.4² + 0.6². The number of pairs is geometric.`, `Expected pairs = 1/(that probability); each pair is 2 points.`],
    ],
    'wc-threes': [
      [`It's one die, so the expected score is just the average of what each face is worth.`, `Threes count as zero, so the faces are worth 1, 2, 0, 4, 5, 6.`, `Average those six values.`],
      [`You must keep at least one die: always keep the lower one.`, `Then decide on the other: keep it, or re-roll it (worth your answer to (a))?`, `Keep the second die only if it shows less than 3, i.e. a three (0), 1 or 2.`, `Average min(d₁, d₂) + min(max(d₁, d₂), 3) over all 36 rolls (using 0 for a three).`],
      [`Build up from fewer dice: E₁ = 3, E₂ = answer (b).`, `With n dice: keep the lowest, then decide how many more of the next-lowest to keep by comparing their sum with the value of re-rolling the rest.`, `Compute E₃ and E₄ the same way before E₅. This one really needs a careful table or a computer.`],
    ],
    'wc-hat': [
      [`If you say stop now, what do you expect to get?`, `It's the average of the bills still in the hat.`, `How does that average change, on average, after one bill is drawn and seen?`, `It's a martingale: the expected average after a draw equals the average now. So waiting can't help on average.`],
    ],
    'wc-over-100': [
      [`The final total is 100 plus an overshoot. Estimate the overshoot.`, `The roll that crosses 100 is more likely to be a big one (bigger rolls cover more ground).`, `Renewal theory: the expected overshoot is E[X(X + 1)]/(2E[X]) for a die roll X.`, `E[X²] = 91/6 and E[X] = 3.5. Plug in and add to 100.`],
      [`Relate the final total to the number of rolls.`, `Wald's identity: E[total] = E[number of rolls] × E[one roll].`, `Divide your answer to (a) by 3.5.`],
    ],
    'wc-stick-triangle': [
      [`When can three lengths make a triangle?`, `Each piece must be shorter than the other two combined, i.e. shorter than half the stick.`, `Draw the two break points as (x, y) in the unit square and shade where all three pieces are below ½.`, `The good region is two small triangles; find their total area.`],
    ],
    'wc-primes': [
      [`Use the prime number theorem: primes thin out like 1/ln x.`, `π(x) ≈ x/ln x. You need ln(10⁶).`, `ln 10 ≈ 2.303, so ln(10⁶) ≈ 13.8.`, `x/(ln x − 1) is a noticeably better approximation than x/ln x.`],
    ],
    'wc-cube-walk': [
      [`Group the corners by distance from the target: 3, 2, 1, 0.`, `From distance 3 you always move to 2. From 2: to 1 with probability 2/3, back to 3 with 1/3. From 1: finish with 1/3, back to 2 with 2/3.`, `Write h₃ = 1 + h₂, h₂ = 1 + ⅔h₁ + ⅓h₃, h₁ = 1 + ⅔h₂.`, `Solve the three equations for h₃.`],
      [`Think about how often the bug is at its starting corner in the long run.`, `By symmetry it spends the same fraction of time at every corner.`, `Expected return time = 1 / (long-run fraction of time at that corner).`],
    ],
    'wc-branching': [
      [`Let q be the probability that a line starting from one cell dies out.`, `Condition on what happens in the first minute.`, `If it splits into two, both lines must die out independently: probability q².`, `q = ¼ + ¼q + ½q². Solve, and think about which root is the answer (is the mean number of offspring above 1?).`],
    ],
    'wc-ants': [
      [`The bouncing is a distraction. What if the ants walked through each other instead?`, `Two ants bouncing look exactly like two ants passing (only the labels swap), so the times ants fall off don't change.`, `Each "ghost" ant falls off after a time uniform between 0 and 100 seconds.`, `You need the expected maximum of 500 independent uniforms on [0, 100]: for n uniforms on [0, 1] it's n/(n + 1).`],
    ],
    'wc-bayes-trader': [
      [`Bayes: compare how likely three winning days are for each type.`, `Prior odds skilled : unskilled = 0.2 : 0.8 = 1 : 4.`, `Likelihood ratio = (0.7/0.5)³.`, `Posterior odds = prior odds × likelihood ratio. Convert odds to a probability.`],
    ],
    'wc-kelly-coin': [
      [`Kelly: bet the fraction that maximises the expected log of your bankroll.`, `For even money (b = 1), Kelly is f* = p − q.`, `p = 0.6 and q = 0.4.`],
      [`After one bet your bankroll is multiplied by 1 + f or 1 − f.`, `Expected log-growth = p·ln(1 + f) + q·ln(1 − f).`, `Use f = 0.2: 0.6·ln 1.2 + 0.4·ln 0.8.`],
    ],
    'opt-all-faces': [
      [`Count the favourable sequences and all sequences.`, `All sequences of six rolls: 6⁶.`, `Sequences using each face once are the orderings of 1–6: 6!.`],
      [`Break the wait into stages: waiting for the 1st new face, the 2nd, and so on.`, `With k faces already seen, a roll is new with probability (6 − k)/6.`, `Each stage is geometric with mean 6/(6 − k). Add the stages.`],
    ],
    'opt-three-cards': [
      [`The first card tells you nothing on its own (n is unknown). What should you do after it?`, `Always look at a second card. Now you can compare two cards.`, `If the second is higher than the first, it's the top or the middle card. Keep it or swap for the last?`, `If the second is lower, take the last card. Go through all 6 orders and average your winnings above n.`],
    ],
    'imc-b-wins': [
      [`What happens if A's first flip is tails?`, `Then B is in exactly A's starting position.`, `So P(B wins) = ½ × P(A wins), and the two add to 1.`],
      [`Use conditional probability: P(first flip wins | B wins).`, `B wins on their first flip if A flips T then B flips H.`, `Divide that probability by P(B wins) from (a).`],
    ],
    'imc-walk': [
      [`A fair walk is a martingale: its expected position never changes.`, `So the expected position when you stop is 0.`, `You stop at −100 with probability P or at +50 otherwise: −100P + 50(1 − P) = 0.`],
      [`For a fair ±1 walk, X² − n is also a martingale.`, `That gives E[time] = E[X² at the end].`, `For barriers at distances a and b, this works out to a × b.`],
    ],
    'akuna-fair-coin': [
      [`Check the method is fair first: HT and TH have the same probability.`, `Each pair of flips decides with probability P(HT) + P(TH).`, `That's 2 × 0.7 × 0.3. The number of pairs needed is geometric.`, `Expected flips = 2 / P(a pair decides).`],
    ],
    'dv-outliers': [
      [`Think about where the outliers sit in a random order.`, `The 7 outliers split the 95 normal samples into 8 gaps.`, `By symmetry each gap holds 95/8 normal samples on average.`, `The third outlier comes after 3 gaps and 3 outliers.`],
    ],
    'drw-ht-product': [
      [`With H heads, tails = 100 − H, so you want E[H(100 − H)].`, `Expand: 100·E[H] − E[H²].`, `E[H²] = Var(H) + (E[H])². For 100 fair flips, Var = 100 × ¼.`],
    ],
    'js-four-coins': [
      [`Without the re-flip, what are four coins worth?`, `When does a re-flip help? Re-flip a tail if you have one.`, `A re-flipped tail gains $1 with probability ½: worth $0.50.`, `You have at least one tail with probability 1 − (1/2)⁴. Add that × $0.50 to the base value.`],
    ],
    'mm-geo': [
      [`Centre your market on the expected payout.`, `The number of flips until the first head is geometric with p = ½.`, `Geometric mean = 1/p.`],
      [`The spread tells you how wide to quote: a payout that varies a lot needs a wider market.`, `For a geometric distribution, Var = (1 − p)/p².`, `With p = ½, compute the variance, then take the square root.`],
    ],
    'mm-median5': [
      [`Is the median of five dice symmetric around anything?`, `Swap every face k for 7 − k: the distribution of the median is mirrored.`, `A symmetric distribution is centred at its point of symmetry.`],
    ],
    'opt-parity-rates': [
      [`Use put–call parity, which needs no model.`, `C − P = S − K·e<sup>−rT</sup>.`, `Here S = K = 100, r = 0.05, T = 1, C = 10. Solve for P; e<sup>−0.05</sup> ≈ 0.951.`],
      [`Vega measures how much the option's price moves per unit of volatility.`, `For an at-the-money option, vega ≈ 0.4·S·√T per 1.00 (100 points) of volatility.`, `Scale down to a 1-point move (0.01), and mind the sign: vol falls.`],
    ],
    'judge-quote': [
      [`Always compare a trade price with your own fair value, not with the other side of the market.`, `Selling at 10 means you receive 10 for something worth 10.4 to you.`, `Profit per share = price received − fair value.`],
      [`Buying at 11 means you pay 11 for something worth 10.4.`, `Profit per share = fair value − price paid.`, `Once you have both answers, ask: should you trade at all, or quote your own market?`],
    ],
    // ---------------------------------------------------------------- bank-reports.js
    'js-three-coins': [[`Don't count coins: count the ways of seeing heads.`, `How many heads faces does each coin have?`, `The double-headed coin has 2, the normal coin 1, the double-tailed coin 0. Each face is equally likely to be the one facing up.`, `P = (heads faces on the double-headed coin) / (all heads faces).`]],
    'js-treasure-bid': [
      [`Ask what you learn when your bid is accepted.`, `If you bid b, the seller only sells when V < b, so given a trade V is uniform on [0, b].`, `Given a trade, what is V on average, what do you resell for, and what did you pay?`, `You pay b and resell for 1.5 × (b/2). Is that ever positive?`],
      [`Bidding the maximum means you always buy, so V is just uniform on [0, 1000].`, `Expected resale = 1.5 × E[V]. Subtract what you pay.`, `E[V] for a uniform on [0, 1000] is the midpoint.`],
    ],
    'js-circle-regions': [
      [`Draw it: 1, 2, 3 and 4 points give 1, 2, 4 and 8 regions.`, `Carefully draw 5 points with all chords. Don't assume the pattern.`, `Count: each chord adds one region, plus one for each chord it crosses.`],
      [`The doubling pattern breaks here. Count properly.`, `Regions = 1 + (number of chords) + (number of crossings).`, `Chords: one per pair of points, C(N, 2). Crossings: one per set of 4 points, C(N, 4).`],
    ],
    'js-even-heads': [[`You don't need to add up binomial coefficients.`, `Condition on the first 99 flips. Whatever they gave, how many outcomes of the last flip make the total even?`, `Exactly one of the two outcomes works, and it has probability ½.`]],
    'js-one-question': [[`How many equally likely sequences are there?`, `A yes/no answer splits the 2<sup>100</sup> sequences into two groups. You then guess one sequence in the group you're told.`, `Your chance is P(group) × 1/(size of group). Try a few splits: does it ever change?`, `It's always 2/2<sup>100</sup>. Write that as 1/2<sup>k</sup>.`]],
    'js-go-first': [
      [`Let p be the first player's chance of winning.`, `They win immediately with probability ½. Otherwise the roles swap.`, `p = ½ + ½(1 − p). Solve.`],
      [`You win $30 with probability p and lose $30 otherwise.`, `Expected value = 30p − 30(1 − p), with p from (a).`, `If going second is the alternative, also work out what going second is worth and compare.`],
    ],
    'js-four-tails': [[`Conditional probability: restrict to outcomes with at least two tails.`, `Count outcomes by number of tails: 0, 1, 2, 3, 4 tails occur 1, 4, 6, 4, 1 times out of 16.`, `Those with at least two tails: 6 + 4 + 1. Those with exactly three: 4.`]],
    'js-hht-htt': [
      [`Nothing matters until the first H. Start from "just seen an H".`, `If the next toss is H (you have HH), can HTT ever beat HHT now?`, `From HH, the run of H's must end with a T, completing HHT. So HH means A wins.`, `From HT: a T completes HTT (B wins); an H puts you back at "just seen an H". Write p = ½·1 + ½·(½·0 + ½·p).`],
    ],
    'js-socks': [[`When can you be forced to draw a third sock?`, `The first two match with probability ½.`, `If they don't match you hold one of each colour, so the third sock always matches.`, `E = 2 × P(match on draw 2) + 3 × P(not).`]],
    'js-up-down-20': [
      [`Percentage moves multiply, they don't add.`, `Up 20% multiplies by 1.2; down 20% by 0.8.`, `Multiply 1.2 by 0.8 (the order doesn't matter).`],
      [`After u up days and d down days the price is 1.2<sup>u</sup> × 0.8<sup>d</sup> times the start.`, `Write it as fractions: (6/5)<sup>u</sup>(4/5)<sup>d</sup> = 6<sup>u</sup>4<sup>d</sup>/5<sup>u + d</sup>.`, `Can a number with no factor of 5 on top equal a power of 5 on the bottom?`],
    ],
    'js-handshakes': [[`What are the possible handshake counts for one person?`, `Each person can shake hands with at most 28 others (not themselves, not their partner). So 29 different answers must be 0, 1, …, 28.`, `Who did the person with 28 not shake? Who shook nobody? Show they're a couple.`, `Remove that couple and repeat: 27 pairs with 1, and so on. Which count is left unpaired?`]],
    'js-melons': [
      [`Each melon appears in how many of the ten pair sums?`, `Each is in 4 pairs, so the sum of all ten totals is 4 × (total weight).`, `Sort the weights a ≤ b ≤ c ≤ d ≤ e. The smallest pair sum is a + b and the largest d + e. Use those with the total to find c.`, `Then the second-smallest sum is a + c and the second-largest c + e.`],
      [`Same working as (a): you'll have all five weights.`, `a + b = 16 and a + c = 17, with c from (a).`, `Check your five weights by listing all ten pair sums.`],
    ],
    'js-pooled-average': [[`Think about how the combined rate is computed: total goals over total shots.`, `Each match's rate is weighted by how many shots were taken in it.`, `Try a small example where one team takes most of its shots in the easy match.`, `This has a name: Simpson's paradox.`]],
    'js-odd-sum-d12': [
      [`The total stays even until the first odd roll, which ends the game. So the final total is (some even total) + (an odd roll).`, `Which even totals can you be sitting on before the last roll, and how likely is each?`, `Being at 0 has probability 1; every other even total has probability below 1.`, `A final total collects one path from each even total within one roll below it. Which final totals can still be reached straight from the start, and which of those has the most even totals feeding it?`],
      [`P(end at 11) = (1/12) × Σ P(pass through even total t), for t = 0, 2, …, 10.`, `P(pass through 0) = 1. P(pass through 2) = 1/12. Each later value is (the sum of the previous ones it can be reached from)/12.`, `Compute P(4), P(6), P(8), P(10) in turn, add them all up and divide by 12.`],
    ],
    'js-cheap-rerolls': [
      [`Try a threshold strategy: stop on the top k faces.`, `You roll n/k times on average and pay 1/n for each of the n/k − 1 rerolls. The average stopping value is the mean of the top k faces.`, `V(k) = (2n − k + 1)/2 − (1/n)(n/k − 1). Try k = 1, 2, 3.`, `For n = 10, compare V(1), V(2) and V(3).`],
      [`Same formula with n = 100.`, `For k = 1 and k = 2 it simplifies to n − 1 + 1/n.`, `Check k = 3 too, to confirm it's no better.`],
    ],
    'js-bus': [[`Each stop takes x passengers to x/4 + 7. What does that require of x?`, `x must be divisible by 4 before every stop.`, `Write x = 4a. After stop 1 there are a + 7, which also needs to be divisible by 4.`, `Keep going: find the conditions on a, then on the next variable, and take the smallest.`]],
    'js-guess-sum': [
      [`You don't want the most likely total. You want the biggest expected payout.`, `Expected payout for guessing s is s × P(s).`, `The totals in the flat middle of the distribution can each be made 6 ways out of 60; totals outside it fewer ways.`, `Among the equally likely totals, pick the largest. Then check whether 12 × P(12) is bigger.`],
      [`Expected payout of a guess = (amount paid if right) × P(right).`, `Your guess × the probability of that total.`, `It can be made 6 ways out of 60.`],
    ],
    'js-amoeba': [[`Let p be the probability that one amoeba's line dies out.`, `Condition on the first minute. With k amoebas, all k lines must die out: p<sup>k</sup>.`, `p = ¼(1 + p + p² + p³).`, `p = 1 is always a root; factor it out and solve the quadratic. Take the root in [0, 1).`]],
    'js-square-37': [[`Round to a number that's easy to square.`, `37 = 40 − 3.`, `(a − b)² = a² − 2ab + b².`]],
    'opt-80in8-examples': [
      [`Round to 50.`, `46 = 50 − 4. Use (a − b)² = a² − 2ab + b².`, `50² = 2500 is easy; correct from there.`],
      [`Learn 1/17 = 0.0588235… (its cycle repeats every 16 digits).`, `2/17 is twice that.`, `Or do long division: 20 ÷ 17 = 1 r 3, 30 ÷ 17 = 1 r 13, 130 ÷ 17 = 7 r 11, …`],
    ],
    'opt-bp-power': [
      [`One basis point is 0.01%, so multiply the fraction by 10,000.`, `44/157 is close to 44/160 = 0.275.`, `Correct for using 160 instead of 157: multiply by 160/157 ≈ 1.019.`],
      [`7<sup>2.5</sup> = 7² × √7.`, `√7 is between 2.6 and 2.7: 2.6² = 6.76, 2.65² ≈ 7.02.`, `Multiply 49 by your estimate of √7.`],
    ],
    'opt-circle-ages': [[`Rotations don't matter: fix the youngest person's seat.`, `Now arrange the other five people around them.`, `How many arrangements are there, and how many go up in age clockwise? Anticlockwise?`]],
    'opt-five-flips': [
      [`Use linearity: work out one coin, then multiply.`, `One coin is worth +1 or −1 with equal probability.`, `Symmetry: +1 and −1 are equally likely, so what does each coin average?`],
      [`Variances of independent coins add.`, `One coin: ±1 around a mean of 0, so its variance is 1.`, `Total variance = 5; take the square root.`],
    ],
    'opt-hundred-flips': [
      [`The number of heads is binomial with n = 100 and p = ½.`, `Variance = np(1 − p).`, `Take the square root of the variance to get the standard deviation.`],
      [`Exactly: C(100, 50)/2<sup>100</sup>. Too hard by hand, so approximate.`, `The binomial is close to a normal with σ from (a).`, `The chance of one exact value at the mean is about the normal density at its peak: 1/(σ√(2π)).`],
    ],
    'opt-doubles-cancelled': [
      [`Start from the plain expected total of two dice, 7.`, `Subtract what the doubles contribute: each double (1,1), …, (6,6) has probability 1/36.`, `The doubles' totals are 2, 4, …, 12.`],
      [`Rerolling doubles means conditioning on "not a double".`, `E[total | not double] = E[total × 1(not double)] / P(not double).`, `Use (a) for the top and 30/36 for the bottom. Or: what is the average of the doubles?`],
    ],
    'sig-even-bonus': [
      [`List the six payouts: odd faces pay their value, even faces pay double.`, `Payouts: 1, 4, 3, 8, 5, 12.`, `Average them.`],
      [`A reroll is worth your answer to (a).`, `Keep a payout only if it beats that.`, `Which faces have payouts above the reroll value?`, `Value = (sum of kept payouts)/6 + P(reroll) × (value of a reroll).`],
    ],
    'sig-wait-six': [[`Each roll is a 6 with probability 1/6.`, `The number of rolls until the first success is geometric.`, `Geometric mean = 1/p. Or: E = 1 + (5/6)E.`]],
    'sig-ordered-rolls': [[`Three cases: first < second, first > second, or a tie.`, `By symmetry the first two are equally likely.`, `A tie has probability 1/6. Split what's left equally.`]],
    'sig-revolver': [
      [`You know the click came from an empty chamber. Which one?`, `It's equally likely to be any of the 4 empty chambers.`, `Lay out the chambers in a circle: B, B, E, E, E, E. For each empty chamber, is the next one empty?`],
      [`Spinning again resets everything.`, `How many of the 6 chambers are empty?`, `Compare with (a) to decide whether to spin.`],
    ],
    'sig-match-heads': [
      [`Find the distribution of heads for three coins: 0, 1, 2, 3 with probabilities 1, 3, 3, 1 over 8.`, `P(match) = Σ P(you get k) × P(friend gets k).`, `Square each probability and add.`],
      [`You win 2 with probability p from (a) and lose 1 otherwise.`, `EV = 2p − (1 − p).`, `A negative answer means the bet is unfavourable to you.`],
    ],
    'sig-hth': [[`Track how much of HTH you've built so far: nothing, "H", or "HT".`, `From "HT", a T sends you back to the start; but from "H", another H keeps you at "H".`, `Write E₀ = 1 + ½E₁ + ½E₀, E₁ = 1 + ½E₁ + ½E₂, E₂ = 1 + ½·0 + ½E₀.`, `Solve for E₀. (Shortcut: HTH overlaps itself, which adds 2 to the 8 flips of a non-overlapping pattern.)`]],
    'sig-25-swimmers': [[`Start by racing everyone once: five heats.`, `Race the five heat winners. That race's winner is the fastest overall.`, `Which swimmers could still be 2nd or 3rd overall? Rule out anyone with three or more faster swimmers known.`, `You should find exactly five candidates. Race them.`]],
    'sig-hawk': [[`You need a model of when hawks arrive. Assume a steady rate, independent over time.`, `Then "no hawk in an hour" = "no hawk in the first half" and "no hawk in the second half".`, `P(none in ½ hour)² = P(none in an hour) = 0.2.`, `Take the square root, then subtract from 1.`]],
    'sig-sock-drawer': [[`Bayes: compare how likely two reds are from each drawer.`, `With replacement, P(two reds | X) = 0.4², P(two reds | Y) = 0.7².`, `Equal priors cancel, so P(X | two reds) = 0.4² / (0.4² + 0.7²).`]],
    'sig-count-50': [[`Work backwards from 50.`, `If you can say a total from which your opponent can't reach 50, but whatever they add you can, you win.`, `From 39, any move (1–10) lands on 40–49, and you then reach 50. So 39 is a winning total to say.`, `The winning totals are spaced 11 apart going down from 50.`]],
    'sig-circle-ages': [[`Fix the youngest person's seat.`, `The other four can sit 4! ways.`, `Exactly one order goes up clockwise and one goes up anticlockwise.`]],
    'imc-three-profits': [[`Does the uniform distribution or the €100k matter?`, `Ties have probability 0, and every ordering of A, B, C is equally likely by symmetry.`, `How many orderings are there?`]],
    'imc-options-payoffs': [[`Write each payoff at expiry first: a call pays max(S − K, 0), a put max(K − S, 0).`, `Then subtract the premium you paid (long) or add the premium you received (short).`, `Read off the worst and best cases from your sketch.`, `For the short put, think about who pays whom for taking on risk, and when that's a good deal.`]],
    'imc-swim-atlantic': [[`Break it into distance and speed.`, `Roughly how far is Amsterdam to New York? (Several thousand kilometres.)`, `How fast does a strong swimmer go, and for how many hours a day?`, `Distance ÷ (km per day). Then give a range and say what would change it most.`]],
    'imc-two-child': [
      [`List the equally likely families: BB, BG, GB, GG.`, `"At least one boy" rules out only GG.`, `How many of the remaining families are BB?`],
      [`Now the information is about one particular child.`, `The other child is independent of the one you met.`, `Or count: in BB you always meet a boy, in BG and GB only half the time. Weight the families accordingly.`],
    ],
    'imc-grid-balls': [[`Use the complement: find P(no two share a row or column).`, `Place the balls one at a time. The first can go anywhere.`, `The second must avoid the first's row and column: how many of the remaining 15 squares are allowed?`, `The third must avoid two rows and two columns: how many of the remaining 14 squares?`]],
    'imc-weekday': [[`Use the complement: all three born on different weekdays.`, `The first can be any day, the second must differ (6/7), the third must differ from both (5/7).`, `Subtract from 1.`]],
    'cit-every-face': [[`Break the wait into stages: the 1st new face, the 2nd, and so on up to the 6th.`, `With k faces already seen, each roll is new with probability (6 − k)/6.`, `Each stage is geometric with mean 6/(6 − k).`, `Add them: 6(1/6 + 1/5 + 1/4 + 1/3 + 1/2 + 1).`]],
    'cit-coin-ranges': [[`Work out each range in standard deviations from the mean.`, `100 flips: mean 50, σ = 5. So 40–60 is ±2σ.`, `About 95% of a normal is within ±2σ; including the endpoints pushes it a little higher.`, `1000 flips: σ ≈ 15.8, so 400–600 is about ±6σ. Which is more likely?`]],
    'cit-local-min': [[`Use linearity: find the probability that one position is a local minimum, then multiply by 5.`, `A number and its two neighbours are three different values in random order.`, `What's the chance the middle one is the smallest of three?`]],
    'cit-sqrt-30': [[`Find a nearby perfect square: 5.5² = 30.25.`, `Refine with one Newton step: x − (x² − 30)/(2x).`, `5.5 − 0.25/11.`]],
    'drw-bottom-card': [[`Watch the original bottom card. How does it move up?`, `It rises only when a card is inserted below it. Count the cards below it.`, `With k cards below, a moved card lands below it with probability (k + 1)/52, which takes 52/(k + 1) moves on average.`, `It reaches the top when 51 cards are below it. Add the expected waits for k = 0, …, 50.`]],
    'drw-cube-colours': [[`Count colourings first, then divide by the symmetries.`, `There are 6! ways to paint the faces.`, `How many rotations does a cube have? (6 faces could be on top × 4 ways to turn it.)`, `Or directly: put colour 1 on the bottom, choose the top, then arrange the four sides around a circle.`]],
    'hrt-three-before-six': [[`Let N be the number of rolls until the first 6, and A the event that a 3 came first.`, `By symmetry between 3 and 6, P(A) = ½.`, `Given N = n, the n − 1 earlier rolls are uniform on 1–5, so P(no 3 | N = n) = (4/5)<sup>n − 1</sup>.`, `E[N | A] = (E[N] − E[N; not A]) / P(A). Compute E[N; not A] = Σ n(5/6)<sup>n − 1</sup>(1/6)(4/5)<sup>n − 1</sup>.`]],
    'fr-ten-second-estimates': [
      [`Take logs: log₁₀ of the answer is 0.1.`, `log₁₀ 2 ≈ 0.301, so 10<sup>0.1</sup> is close to the cube root of 2.`, `Find the number between 1.2 and 1.3 whose cube is 2: try cubing a couple of candidates.`],
      [`log<sub>1.2</sub> 3 = ln 3 / ln 1.2.`, `ln 3 ≈ 1.099 and ln 1.2 ≈ 0.182.`, `Check by repeated squaring: 1.2² = 1.44, 1.2⁴ ≈ 2.07.`],
      [`The number of digits of x is ⌊log₁₀ x⌋ + 1.`, `Stirling: log₁₀ n! ≈ n·log₁₀(n/e) + ½·log₁₀(2πn).`, `50/e ≈ 18.4, and log₁₀ 18.4 ≈ 1.265.`],
      [`Olympic pools are 50 m long and 25 m wide.`, `They're about 2 m deep (at least).`, `Length × width × depth.`],
    ],
    'fr-pizza': [[`Each new cut can cross every earlier cut once.`, `A cut crossing k earlier cuts adds k + 1 pieces.`, `Start from 1 piece and add 1 + 2 + … + 10.`]],
    'fr-second-die': [[`Use linearity: the first die plus the second die when it's rolled.`, `The first die averages 3.5.`, `The second is rolled with probability 4/6 and averages 3.5.`]],
    'fr-traffic': [[`Assume cars arrive at a steady rate, independently over time.`, `"No car in a minute" = "no car in either half".`, `P(none in 30 s)² = 3/4. Take the square root, then subtract from 1.`]],
    'fr-ruin-6-4': [[`Is the game fair? If so, what does that say about A's expected wealth?`, `A fair game keeps A's expected money at $6 forever.`, `At the end A has $10 (probability p) or $0. So 10p = 6.`]],
    'fr-walk-two': [[`Each toss changes heads − tails by +1 (prob 2/3) or −1.`, `The average drift per toss is 2/3 − 1/3.`, `Moves are ±1, so you hit +2 exactly. Wald: (target) = (drift) × E[tosses].`, `Or: getting up by one takes E₁ = 1 + (1/3)·2E₁ tosses; you need that twice.`]],
    'akuna-told-heads': [
      [`Ask first: which reading of "one of them is heads" is meant?`, `List the 8 outcomes and cross out those with no heads.`, `7 outcomes remain, all equally likely. How many are HHH?`],
      [`Same 7 outcomes as (a).`, `How many have exactly two heads?`, `Exactly two heads means one tail, which can be any of the three coins.`],
      [`Now you've learned about one specific coin.`, `The other two coins are independent of it.`, `Both must be heads.`],
    ],
    'akuna-max-dice': [
      [`P(max ≤ m) = (m/6)².`, `P(max = m) = (2m − 1)/36.`, `E = Σ m(2m − 1)/36.`],
      [`For a positive integer variable, E[X] = Σ P(X ≥ m).`, `P(max ≥ m) = 1 − ((m − 1)/6)³.`, `Sum over m = 1…6: 6 − (0³ + 1³ + … + 5³)/216.`],
    ],
    'akuna-look-say': [[`Try reading each term out loud.`, `"12" is "one 1, one 2" → 1112.`, `Read 132112 the same way, group by group: 1, 3, 2, 11, 2.`]],
    'akuna-planets': [[`It's not numeric. Think of a well-known ordered list.`, `M, V, E, M, J: something in order from the Sun.`, `What comes after Jupiter?`]],
    'jump-triple': [[`Substitute c = 40 − a − b into a² + b² = c².`, `Expand: 0 = 1600 − 80(a + b) + 2ab.`, `That rearranges to (40 − a)(40 − b) = 800.`, `Find a factor pair of 800 with both factors under 40. (Or recall Pythagorean triples whose perimeter is 40.)`]],
    'jump-normal': [[`Rewrite the event as X − 5Y > 0.`, `X − 5Y is a combination of independent normals, so it's normal.`, `What is its mean? Is it symmetric about 0?`]],
    'mav-pens': [
      [`Each sale makes you shorter by one pen.`, `You sold four times.`, `Short positions are negative.`],
      [`Add up what you received.`, `Compare with what the four pens are worth at 22 each.`, `13 + 16 + 19 + 22.`],
      [`You need to buy 4 pens for less than you received in total.`, `4p < 70. Solve for p, then take the largest whole number.`, `Whole numbers only, and strictly less, so check the boundary.`],
    ],
    'mav-chessboard': [[`A rectangle is fixed by its left and right edges and its top and bottom edges.`, `An 8 × 8 board has 9 vertical lines and 9 horizontal lines.`, `Choose 2 of the 9 vertical lines and 2 of the 9 horizontal lines.`]],
    'mav-weighings': [
      [`Each weighing has three outcomes: left heavier, right heavier, balance.`, `So k weighings can tell apart at most 3<sup>k</sup> cases. How many cases are there?`, `Try weighing 3 against 3 first.`],
      [`Count the cases: 12 balls × (heavier or lighter).`, `Compare with 3<sup>k</sup> for k = 2 and 3.`, `Start with 4 against 4; the hard part is the rearrangement in the second weighing.`],
    ],
    'mav-17-7': [[`Split it: 17/7 = 2 + 3/7.`, `Sevenths repeat the digits 142857, starting at different points.`, `1/7 = 0.142857…, so 3/7 starts at 4: 0.428571… Write out enough digits, then round.`]],
    'mav-cycles': [[`Build the permutation one person at a time.`, `When the k-th person is placed, they close a new cycle with probability 1/k.`, `By linearity, E[cycles] = 1 + 1/2 + … + 1/n.`]],
    'mav-tower': [[`Count draws: there are C(18, 5) ways to draw 5 blocks.`, `Choose which two colours appear (3 ways).`, `From those 12 blocks, draw 5, then remove the draws that use only one colour.`, `3 × (C(12, 5) − 2·C(6, 5)) / C(18, 5).`]],
    'mav-numerical-test': [
      [`Halve one and double the other.`, `35 × 26 = 70 × 13.`, `Then 70 × 13 = 7 × 130.`],
      [`Same trick: 15 × 76 = 30 × 38.`, `30 × 38 = 3 × 380.`, `Or: 15 × 76 = 10 × 76 + 5 × 76.`],
    ],
    'flow-etf-weight': [[`The ETF's value is a weighted sum of its holdings.`, `Only one holding moves.`, `ETF move = weight × stock move = 0.08 × 5%.`]],
    'flow-maths-test': [
      [`Split one number into a round part and a small part.`, `23 × 52 = 23 × 50 + 23 × 2.`, `Add the two products.`],
      [`Only the nearest million is needed, so round.`, `9234 × 2435 ≈ 9234 × 2400 + 9234 × 35.`, `9234 × 24 ≈ 221,600, so × 2400 ≈ 22.16 million.`],
    ],
    'flow-watermelon': [[`Focus on what doesn't change: the non-water part.`, `Before: 1% of 100 pounds is not water.`, `After, that same amount is 2% of the new weight.`]],
    'dv-ten-cards': [
      [`Find the variance of one card first.`, `A uniform value on 1…n has variance (n² − 1)/12.`, `Variances of independent cards add. Take the square root at the end.`],
      [`The total of 10 cards is close to normal, centred at 70.`, `For a normal, E|X − μ| = σ√(2/π) ≈ 0.8σ.`, `Use σ from (a).`],
    ],
    'dv-three-cards': [
      [`Use linearity of expectation.`, `Each card averages (1 + … + 13)/13.`, `Replacement doesn't matter for the mean.`],
      [`With replacement, variances add: 3 × (one card's variance).`, `One card's variance is (13² − 1)/12.`, `Without replacement, multiply the variance by the finite-population correction (N − n)/(N − 1) = 49/51, then take the square root.`],
    ],
    'ec-option-strategies': [[`Draw each payoff at expiry before naming any Greeks.`, `Straddle and strangle profit from big moves. Butterfly and condor profit from small ones.`, `A calendar spread mixes two expiries at the same strike.`, `Long big-move strategies are long gamma and vega; short ones are the opposite. Think about which option decays faster in a calendar.`]],
    'ec-vix-hibor': [[`VIX: think "fear gauge". What market does it measure, and from what prices?`, `HIBOR: break the acronym down: Hong Kong, Interbank, Offered Rate.`, `For US rates, which Fed committee meets about eight times a year?`]],
    'om-abs-diff': [[`List the possible differences: 0 to 5.`, `A difference of d (d ≥ 1) happens in 2(6 − d) of the 36 rolls.`, `Σ d × 2(6 − d) / 36.`]],
    'bel-local-max': [[`Use linearity: find the chance one person is taller than both neighbours, then multiply by 18.`, `A person and their two neighbours are three different heights in random order.`, `How likely is the middle one to be the tallest of three?`]],
    'sq-meeting': [[`Draw arrival times as a point (x, y) in a unit square (hours).`, `They meet if |x − y| ≤ 1/4.`, `The miss region is two corner triangles. Find their area and subtract from 1.`]],
    'sq-biased-coin': [[`Two hypotheses: coin 1 is biased, or coin 2 is.`, `Compute the probability of both results under each hypothesis.`, `Coin 1 biased: P(2 of 3 heads at 2/3) × P(1 of 3 heads at 1/2). Coin 2 biased: the reverse.`, `Equal priors, so P = L₁/(L₁ + L₂).`]],
    'val-two-fives': [[`Track your progress: no 5 yet, or "just rolled a 5".`, `From "just rolled a 5", another 5 wins; anything else sends you back to the start.`, `E₀ = 1 + (1/6)E₁ + (5/6)E₀ and E₁ = 1 + (5/6)E₀.`, `Solve. (Shortcut for two in a row with probability p: 1/p + 1/p².)`]],
    'opt-behavioural': [[`Pick specific stories before the interview: one achievement, one team conflict.`, `For "why Optiver", name something concrete about how the firm trades or trains.`, `Keep each answer to about two minutes: situation, what you did, result, lesson.`]],
    'sig-behavioural': [[`Split it: why trading, then why SIG.`, `Give a specific moment you got hooked on trading-style decisions.`, `For SIG, mention something concrete, such as its focus on decision-making under uncertainty and games.`]],
    'imc-behavioural': [[`Prepare one example for each question; don't improvise all four.`, `For risk: show you size decisions to your edge and know when to stop.`, `For the personality test: agree or disagree with specifics, and show self-awareness.`]],
    'cit-behavioural': [[`Avoid answers about money or prestige.`, `Describe a moment that made you want to trade (a game, a market you followed).`, `End with evidence you already think in probabilities.`]],
    'hrt-behavioural': [[`Pick a project you can defend line by line.`, `Be clear about what you did versus your team.`, `Prepare for "why that method?" and "how would you know if it was wrong?"`]],
    'fr-behavioural': [[`Why trading, why Five Rings, why you: about a minute each.`, `Name something concrete about the firm.`, `Show you enjoy probability and games, with an example.`]],
    'jump-behavioural': [[`Be honest about your level.`, `If you have no professional experience, talk about the games you've practised.`, `Mention quote widths, how you adjusted after being hit, and inventory you carried.`]],
    'mav-behavioural': [[`Prepare four short stories: a setback, a trading mistake, an achievement, and what you do for fun.`, `For the mistake: own it quickly, explain your thinking at the time, then what you'd do now.`, `Keep each answer specific and under two minutes.`]],
    'flow-behavioural': [[`Market makers earn the spread and get paid for providing liquidity.`, `For Flow Traders specifically: think ETFs, and creating or redeeming units.`, `Arbitrage: a riskless profit from a price difference. Give an example, like an ETF priced above its holdings.`]],
    'dv-behavioural': [[`For "why Da Vinci", tie your past experience to options trading.`, `For the first-year question, name a real weakness and your plan to fix it.`, `Avoid "I'm a perfectionist".`]],
    'virtu-behavioural': [[`How does an electronic market maker earn money? Spreads, at huge volume.`, `For HFT, think technology, latency, risk limits and costs, not just prediction.`, `For skills, pick two concrete ones and an example of each.`]],
    // ---------------------------------------------------------------- bank-classics.js
    'virtu-clock': [
      [`How fast does each hand turn, in degrees per hour?`, `Minute hand: 360°/h. Hour hand: 30°/h. So the minute hand gains 330° an hour.`, `It catches the hour hand once every time it gains a full 360°: every 12/11 hours.`, `How many of those intervals fit into 24 hours? (Not 24: watch what happens around 12.)`],
      [`At 3:15 the minute hand points at the 3: 90°.`, `The hour hand isn't exactly on the 3: it has moved a quarter of the way to the 4.`, `Each hour mark is 30°. How far past 90° has the hour hand moved, and where is the minute hand?`],
    ],
    'virtu-doors': [[`Door d is toggled once by each person whose number divides d.`, `A door ends open if it's toggled an odd number of times.`, `Divisors come in pairs (k and d/k). When does a number have an unpaired divisor?`, `Only perfect squares. How many squares are there up to 100?`]],
    'tib-pirates': [
      [`Work up from small numbers of pirates.`, `Two pirates: the proposer's own vote is half, so the proposal passes. What does the proposer keep?`, `Three pirates: the proposer needs one more vote. Buy the cheapest one: the pirate who'd get nothing if it went down to two, for 1 coin.`, `Keep going to four, then five. Each time, buy the votes of pirates who'd get 0 in the next round down, at 1 coin each.`],
      [`Use the pattern from (a), continued to six pirates.`, `With seven pirates the proposer needs ⌈7/2⌉ − 1 extra votes.`, `Each of those votes costs 1 coin: buy pirates who'd get nothing in the six-pirate split.`],
    ],
    'akuna-st-petersburg': [
      [`Write the expected value as a sum over k, the number of tosses.`, `P(first head on toss k) = 2<sup>−k</sup>, and the prize is 2<sup>k</sup>. What does each k ≤ 20 contribute?`, `Each k up to 20 contributes exactly $1.`, `Every longer game pays the cap 2<sup>20</sup>. What is P(no head in the first 20 tosses)?`],
      [`Same reasoning as (a), with the cap at 2<sup>30</sup>.`, `Each k ≤ 30 contributes $1, and the tail contributes one more.`, `Notice how little a thousand-times bigger bank adds.`],
    ],
    'cl-monty-hall': [
      [`What's the chance your first pick is right? Does the host's action change that?`, `The host can always open a goat door, so his reveal tells you nothing new about your own door.`, `Your door keeps its 1/3. Where does the rest of the probability go?`, `Switching wins exactly when your first pick was wrong.`],
      [`Same idea with 100 doors.`, `Your first pick is right 1% of the time.`, `The host leaves exactly one other door closed. When does switching to it win?`],
    ],
    'cl-birthday': [
      [`Use the complement: everyone has a different birthday.`, `P(all different) = (365/365)(364/365)(363/365)… for n people.`, `Rough version: C(n, 2) pairs, each matching with probability 1/365, so P(no match) ≈ e<sup>−n(n − 1)/730</sup>.`, `Find the n where that drops below ½: n(n − 1)/730 ≈ ln 2.`],
      [`Compute 1 − Π (365 − k)/365 for k = 0 to 22.`, `Or use the approximation 1 − e<sup>−253/365</sup>, since C(23, 2) = 253.`, `ln(1 − x) ≈ −x for small x, which is where the approximation comes from.`],
    ],
    'cl-secretary': [
      [`With 3 candidates, consider the strategy: reject the first, then hire the first one better than everyone so far.`, `List the 6 orders of ranks (worst = 1, best = 3).`, `For each order, see who gets hired under that strategy, and count the orders where it's the best.`],
      [`Reject the first r candidates, then take the next one who beats all of them.`, `For large n, P(win) ≈ (r/n)·ln(n/r).`, `Let x = r/n and maximise x·ln(1/x). Differentiate and set it to zero.`],
    ],
    'cl-buffon': [
      [`Two random things: the distance from the needle's centre to the nearest line, and the needle's angle.`, `With length = spacing = 1, the centre's distance x is uniform on [0, ½] and the angle θ uniform on [0, π/2].`, `The needle crosses a line when x ≤ ½·sin θ.`, `Average that probability over θ: (2/π)·∫ sin θ dθ over [0, π/2].`],
    ],
    'cl-derangements': [
      [`Use inclusion–exclusion on "person i gets their own hat".`, `P(at least one match) = Σ P(one fixed) − Σ P(two fixed) + …`, `That gives P(no match) = 1 − 1/1! + 1/2! − 1/3! + 1/4!.`],
      [`Use linearity: each person gets their own hat with what probability?`, `Each person's hat is equally likely to be any of the 4 hats.`, `Add the four probabilities.`],
    ],
    'cl-ballot': [
      [`For A to be ahead throughout, which vote must come first?`, `Count the "bad" orders where B catches up at some point.`, `Reflection: flip every vote before the first tie. That maps bad orders starting with A to orders starting with B, one to one.`, `P = P(A first) − P(B first) = a/(a + b) − b/(a + b).`],
    ],
    'cl-100-prisoners': [
      [`Random searching gives (½)<sup>100</sup>. The prisoners need their successes to be correlated.`, `Each prisoner opens the box with their own number, then the box numbered by what they find, and so on.`, `That follows the cycle of the shuffle containing their number. They all succeed exactly when no cycle is longer than 50.`, `P(some cycle has length k > 50) = 1/k, and two such cycles can't both exist. Add 1/k for k = 51…100 and subtract from 1.`],
    ],
    'cl-first-ace': [
      [`Use symmetry: where do the 4 aces fall among the other 48 cards?`, `The aces split the 48 non-aces into 5 gaps.`, `By symmetry each gap holds the same number of cards on average: 48/5.`, `You turn over the first gap, plus the ace that ends it.`],
    ],
    'cl-semicircle': [
      [`When does the triangle miss the centre?`, `Exactly when all three points lie in some semicircle.`, `For each point, find the chance that the other two lie in the semicircle clockwise from it: (½)².`, `Those three events can't happen together, so P(semicircle) = 3 × ¼. Take the complement.`],
    ],
    'cl-polya': [
      [`Work out the probability of one specific sequence, e.g. 5 reds then 5 blues.`, `Reds come out with probabilities 1/2, 2/3, 3/4, … and the blues similarly. Multiply.`, `Any order with k reds out of n gives the same product: k!(n − k)!/(n + 1)!.`, `Multiply by the number of such orders, C(n, k). What do you notice?`],
    ],
    'cl-newton-pepys': [
      [`Complement: no sixes at all.`, `P(no six on one die) = 5/6. Six dice are independent.`, `(5/6)⁶: square 5/6 three times, or note (5/6)³ ≈ 0.579.`],
      [`Complement: zero sixes or exactly one six.`, `P(0) = (5/6)<sup>12</sup>; P(1) = 12 × (1/6) × (5/6)<sup>11</sup>.`, `Subtract both from 1, then compare with (a).`],
    ],
    'cl-base-rate': [
      [`Imagine 10,000 people and count.`, `How many have the condition, and how many of those test positive?`, `How many don't have it, and how many of those test positive anyway?`, `P = (true positives) / (all positives).`],
    ],
    'cl-trailing-zeros': [
      [`Each trailing zero comes from a factor of 10 = 2 × 5.`, `There are far more 2s than 5s, so count the factors of 5.`, `Multiples of 5 up to 100 each give one. Multiples of 25 give an extra one.`],
    ],
    'cl-uniform-sum': [
      [`Use E[N] = Σ P(N > n) for n = 0, 1, 2, …`, `N > n means the first n numbers sum to at most 1.`, `That probability is the volume of a simplex: 1/n!.`, `Sum 1/n! from n = 0. Which constant is that?`],
    ],
    'cl-egg-drop': [
      [`With one egg you can only climb one floor at a time. What does the first egg buy you?`, `Drop the first egg at floor d. If it breaks, check floors 1 to d − 1 one by one: d drops in total.`, `If it survives, you have one drop fewer, so go up d − 1 floors next, then d − 2, …`, `With d drops you cover d + (d − 1) + … + 1 = d(d + 1)/2 floors. Find the smallest d with that ≥ 100.`],
    ],
    'cl-two-envelopes': [
      [`The argument treats "the other envelope is double" and "half" as equally likely, whatever you see. Can that be true for every amount?`, `Try writing down a prior over amounts that would make it true. What goes wrong?`, `Before opening, call the amounts A and 2A, rather than X and 2X-or-X/2.`, `Switching then gains A or loses A with equal chance.`],
    ],
  };

  for (const b of QT.bank) {
    const h = HINTS[b.id] || [];
    (b.parts || []).forEach((p, i) => { p.hints = h[i] || []; });
    if (b.open) b.open.hints = h[0] || [];
  }
  QT.bankHints = HINTS;
})();
