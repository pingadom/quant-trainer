// Question library: EigenPrep's quiz bank (CU Quants, MIT licence), rewritten in our own words with
// our own hints and worked solutions. Several of the source answers are wrong (the cube colouring,
// the two-player roulette, betting everything on a fair coin, the defective coin); ours are
// re-derived in research/verify_library.py. Puzzles already in the library from BrainStellar
// (the cords, the poisoned wine, the chameleons, the pirates, the three switches, the chocolate bar)
// are not repeated; classics Theo already had appear as variants with new numbers.
(function () {
  const EXACT = { abs: 0.5, rel: 0 };

  QT.library.add('ep', [
    // ---------------------------------------------------------------- probability
    ['envelopes-prior', 'Expected value', 'm', 'Two envelopes with a real prior',
      `Two envelopes hold X and 2X dollars, where X is 50 or 100 with equal probability. You open one at random and see $100.`,
      [{ q: `What is the expected amount in the other envelope?`, a: 125,
        h: [`Seeing $100 can happen two ways: X = 50 and you opened the larger, or X = 100 and you opened the smaller.`, `Each of those has prior probability ½ × ½.`, `So the other envelope holds $50 or $200, each with probability ½.`],
        s: [`With a genuine prior over X, Bayes says what "the other envelope" is worth.`,
          [`P(X = 50 and you hold 2X) = ¼; P(X = 100 and you hold X) = ¼. Equal, so each is ½ given what you saw.`, `E[other] = ½ × 50 + ½ × 200 = <b>$125</b>, so here switching is right.`],
          `Had you seen $200, the other would certainly be $100; seeing $50, certainly $100. Over all outcomes switching gains nothing on average.`, `Assuming "double or half, equally likely" for every amount, which no real prior allows.`] }]],

    ['coin-mle', 'Statistics', 'e', 'Estimating a coin’s bias',
      `A coin of unknown bias lands heads 7 times in 10 tosses.`,
      [{ q: `(a) What is the maximum-likelihood estimate of P(heads)?`, a: 0.7,
        h: [`The likelihood is p<sup>7</sup>(1 − p)<sup>3</sup>.`, `Maximise its log: 7 ln p + 3 ln(1 − p).`, `Set the derivative 7/p − 3/(1 − p) to zero.`],
        s: [`The binomial MLE is the observed proportion h/n.`,
          [`7/p = 3/(1 − p) ⇒ 7 − 7p = 3p ⇒ p = 7/10.`, `p̂ = <b>0.7</b>.`],
          `The estimate always matches the sample frequency.`, ``] },
      { q: `(b) What is its standard error?`, a: Math.sqrt(0.21 / 10), tol: { abs: 0.005, rel: 0 },
        h: [`The variance of a sample proportion is p(1 − p)/n.`, `Plug in the estimate for p.`],
        s: [`SE = √(p̂(1 − p̂)/n).`,
          [`√(0.7 × 0.3/10) = √0.021 ≈ <b>0.145</b>.`],
          `So a rough 95% interval is 0.7 ± 0.28: ten tosses tell you little.`, ``] }]],

    ['bertrand-box', 'Conditional probability', 'e', "Bertrand's boxes",
      `Three boxes hold two gold coins, two silver coins, and one of each. You pick a box at random and draw a coin at random from it: it's gold.`,
      [{ q: `What is the probability the other coin in that box is gold?`, a: 2 / 3,
        h: [`Count gold coins, not boxes: each of the three gold coins is equally likely to be the one you drew.`, `Two of the three gold coins are in the gold-gold box.`],
        s: [`Condition on which gold coin you drew; each is equally likely.`,
          [`Three gold coins, two of them in the gold-gold box.`, `P = <b>2/3</b>.`],
          `Bayes: (1 × ⅓)/(1 × ⅓ + ½ × ⅓) = 2/3.`, `Answering ½ because "it's one of two boxes".`] }]],

    ['ruin-biased', 'Random walks', 'm', 'Ruin with a biased game',
      `A gambler with $5 bets $1 a round, winning with probability 0.6, until reaching $10 or $0.`,
      [{ q: `What is the probability of reaching $10?`, a: (1 - (2 / 3) ** 5) / (1 - (2 / 3) ** 10),
        h: [`Let P(k) be the success probability from $k: P(k) = 0.6P(k + 1) + 0.4P(k − 1), with P(0) = 0 and P(10) = 1.`, `The solution has the form A + B(q/p)<sup>k</sup> with q/p = 2/3.`, `So P(k) = (1 − (q/p)<sup>k</sup>)/(1 − (q/p)<sup>N</sup>).`],
        s: [`Gambler's ruin with ratio r = q/p: P(k) = (1 − r<sup>k</sup>)/(1 − r<sup>N</sup>).`,
          [`r = 0.4/0.6 = 2/3, k = 5, N = 10.`, `(1 − 0.1317)/(1 − 0.0173) ≈ <b>0.884</b>.`],
          `A fair game would give 5/10 = 0.5; a modest edge helps a lot.`, ``] }]],

    ['monty-ten', 'Conditional probability', 'm', 'Monty Hall with ten doors',
      `There are 10 doors and one prize. You pick a door; the host, who knows where the prize is, opens 3 other doors with no prize. You switch to one of the 6 other closed doors at random.`,
      [{ q: `What is your chance of winning?`, a: 0.15,
        h: [`Your first door keeps its 1/10 chance.`, `The other 6 closed doors share the remaining 9/10 equally.`],
        s: [`The opened doors' probability flows to the other closed doors, not to yours.`,
          [`Each of the 6 other closed doors has 9/10 ÷ 6 = 0.15.`, `Switching wins with probability <b>0.15</b>, against 0.1 for staying.`],
          `With 3 doors and one opened this gives the familiar 2/3.`, ``] }]],

    ['coupon-biased', 'Expected value', 'm', 'Two coupons, unequal odds',
      `Each box contains one of two coupons: A with probability 0.2, B with probability 0.8.`,
      [{ q: `What is the expected number of boxes to collect both?`, a: 5.25,
        h: [`The time to get both is the maximum of the times to get each.`, `E[max] = E[T<sub>A</sub>] + E[T<sub>B</sub>] − E[min].`, `The first box always gives one of them, so E[min] = 1.`],
        s: [`max(T<sub>A</sub>, T<sub>B</sub>) = T<sub>A</sub> + T<sub>B</sub> − min.`,
          [`E[T<sub>A</sub>] = 5, E[T<sub>B</sub>] = 1.25, E[min] = 1.`, `E = 5 + 1.25 − 1 = <b>5.25</b>.`],
          `Equal odds would give 3: rare coupons are what make collecting slow.`, ``] }]],

    ['secretary-four', 'Optimal stopping', 'm', 'The secretary problem with four',
      `Four candidates arrive in random order. After each interview you must hire or reject on the spot, and you want the best of the four.`,
      [{ q: `With the best rule (reject the first r, then take the first one better than all before), what is the probability of hiring the best?`, a: 11 / 24,
        h: [`Try r = 0, 1, 2, 3 and compute each success probability.`, `With cutoff r, you hire the best if it is at position k > r and the best of the first k − 1 is among the first r.`, `P(r) = (r/n) × Σ from k = r + 1 to n of 1/(k − 1).`],
        s: [`Compute P(r) = (r/4)(1/r + … + 1/3) for each cutoff.`,
          [`r = 1: ¼(1 + ½ + ⅓) = 11/24. r = 2: ½(½ + ⅓) = 5/12.`, `r = 1 is best: <b>11/24 ≈ 0.458</b>.`],
          `For large n the best cutoff is n/e and the success probability tends to 1/e ≈ 0.37.`, ``] }]],

    ['ballot', 'Combinatorics', 'm', 'Always ahead in the count',
      `Candidate A gets 6 votes and B gets 4, counted in random order.`,
      [{ q: `What is the probability A is strictly ahead throughout the count?`, a: 0.2,
        h: [`This is Bertrand's ballot theorem.`, `P(always ahead) = (a − b)/(a + b).`],
        s: [`Ballot theorem.`,
          [`(6 − 4)/(6 + 4) = <b>0.2</b>.`],
          `The first vote must go to A (probability 0.6), so the answer must be below 0.6.`, ``] }]],

    ['walk-back', 'Random walks', 'e', 'Back at zero',
      `A symmetric random walk starts at 0 and steps ±1.`,
      [{ q: `(a) What is the probability it ever returns to 0?`, a: 1, tol: { abs: 0.001, rel: 0 },
        h: [`In one dimension the symmetric walk is recurrent.`, `Gambler's ruin: from 1, it reaches 0 before N with probability 1 − 1/N, and N can be as large as you like.`],
        s: [`One-dimensional symmetric walks are recurrent.`,
          [`From ±1, hitting 0 before ±N has probability 1 − 1/N → 1.`, `So it returns with probability <b>1</b> (though the expected return time is infinite).`],
          `In three or more dimensions the return probability is below 1.`, ``] },
      { q: `(b) What is the probability it is at 0 after exactly 4 steps?`, a: 3 / 8,
        h: [`It needs exactly two +1 steps and two −1 steps.`, `Count the orders: C(4, 2).`],
        s: [`Count paths with two ups and two downs.`,
          [`C(4, 2)/2<sup>4</sup> = 6/16 = <b>3/8</b>.`],
          `After 2 steps it would be 2/4 = ½.`, ``] }]],

    ['geometric-race', 'Probability', 'e', 'First success wins',
      `Each round, player 1 succeeds with probability ½ and player 2 with probability ⅓, independently. The first to succeed wins; if both succeed in the same round, player 1 wins.`,
      [{ q: `What is the probability player 1 wins?`, a: 0.75,
        h: [`Condition on the first round in which someone succeeds.`, `Each round ends the game with probability 1 − (½)(⅔).`, `Player 1 wins that round with probability ½.`],
        s: [`Only the deciding round matters.`,
          [`P(round decides) = 1 − ½ × ⅔ = ⅔. P(player 1 succeeds in it) = ½.`, `P = (½)/(⅔) = <b>¾</b>.`],
          `Formula p₁/(p₁ + p₂ − p₁p₂) = 0.5/0.667.`, ``] }]],

    ['triple-birthday', 'Probability', 'h', 'Three people, one birthday',
      `People's birthdays are independent and uniform over 365 days.`,
      [{ q: `What is the smallest group in which the chance that some three share a birthday exceeds ½?`, a: 88, tol: EXACT,
        h: [`Count assignments where no day has three or more people: each day has 0, 1 or 2 people.`, `With j days holding two people and n − 2j holding one, count the ways and divide by 365<sup>n</sup>.`, `Compute it for a few group sizes between 80 and 90 (a computer helps) and find where it crosses ½.`],
        s: [`P(no triple) = Σ over j of [ways with j pairs and n − 2j singles] / 365<sup>n</sup>.`,
          [`At n = 87 the chance of a triple is just under ½; at n = 88 it is just over.`, `So <b>88</b> people.`],
          `For pairs the threshold is 23; triples need almost four times as many.`, ``] }]],

    ['st-pete-capped', 'Expected value', 'm', 'St Petersburg with a cap',
      `A fair coin is tossed until it lands heads; if that takes n tosses you win $2<sup>n</sup>, but the casino can pay at most $2<sup>20</sup> (about $1 million).`,
      [{ q: `What is the fair price of the game?`, a: 21, tol: { abs: 0.001, rel: 0 },
        h: [`Each n up to 20 contributes (½)<sup>n</sup> × 2<sup>n</sup> = 1 to the expectation.`, `Beyond 20 tosses you get the capped $2<sup>20</sup>.`, `P(more than 20 tosses) = (½)<sup>20</sup>.`],
        s: [`A cap turns the infinite expectation into a small finite one.`,
          [`Uncapped part: 20 × 1 = 20.`, `Capped part: (½)<sup>20</sup> × 2<sup>20</sup> = 1.`, `Fair price = <b>$21</b>.`],
          `Each doubling of the cap adds only $1, which is why people won't pay much.`, ``] }]],

    ['polya-fifth', 'Probability', 'm', 'Pólya urn',
      `An urn starts with 2 red and 3 black balls. Each time you draw a ball, you put it back with another of the same colour.`,
      [{ q: `What is the probability the fifth ball drawn is red?`, a: 0.4,
        h: [`The Pólya urn is exchangeable: every draw has the same distribution.`, `So the fifth draw is red with the same probability as the first.`],
        s: [`Exchangeability: P(n-th draw red) = r/(r + b) for every n.`,
          [`2/(2 + 3) = <b>0.4</b>.`],
          `Check the second draw: ⅖ × ½ + ⅗ × ⅓ = ⅕ + ⅕ = ⅖.`, ``] }]],

    ['derange-five', 'Combinatorics', 'm', 'Nobody gets their own hat',
      `Five people take back their hats at random.`,
      [{ q: `What is the probability no one gets their own hat?`, a: 11 / 30,
        h: [`Use inclusion–exclusion over the people who do get their own hat.`, `P = 1 − 1/1! + 1/2! − 1/3! + 1/4! − 1/5!.`, `Or count derangements: D₅ = 4(D₄ + D₃) with D₃ = 2, D₄ = 9.`],
        s: [`Derangements: D₅ = 44 out of 120 permutations.`,
          [`D₅ = 4 × (9 + 2) = 44.`, `P = 44/120 = <b>11/30 ≈ 0.367</b>.`],
          `Already very close to 1/e ≈ 0.368.`, ``] }]],

    ['banach', 'Probability', 'h', "Banach's matchboxes",
      `A man carries two matchboxes, each with 5 matches, and takes a match from a box chosen at random each time.`,
      [{ q: `What is the probability that when he first opens an empty box, the other is also empty?`, a: 252 / 1024,
        h: [`He finds a box empty when he reaches for it after using its 5 matches. For the other to be empty too, he must have used all 10 matches first.`, `The first 10 draws must be 5 of each, and the 11th reach can go to either box.`, `P = C(10, 5)/2<sup>10</sup>.`],
        s: [`Both empty at that moment means the first 10 picks split 5 and 5.`,
          [`C(10, 5)/2<sup>10</sup> = 252/1024 ≈ <b>0.246</b>.`],
          `In general P(k left) = C(2n − k, n)/2<sup>2n − k</sup>; k = 0 gives this.`, ``] }]],

    ['generals', 'Logic', 'm', 'The two generals',
      `Two generals must attack at the same time to win. They can only communicate by messengers who may be captured, and neither will attack without being sure the other will.`,
      { open: `<p><b>No protocol guarantees coordination.</b> Suppose some protocol always works, and take a run with the fewest messages that ends in both attacking. Its last message might have been lost; the sender can't tell, so they act the same either way, and the receiver then lacks it. The protocol must still lead both to attack without that message, which gives a shorter successful run. Contradiction. In practice systems accept a small risk (acknowledgements, timeouts), which is why distributed systems settle for probabilistic or eventual agreement.</p>`,
        h: [`Suppose a protocol always reaches agreement, and look at its shortest successful run.`, `What if the last message in that run is lost?`, `The sender can't tell the difference, so it must behave the same way.`] }],

    ['last-colour', 'Expected value', 'h', 'Until one colour runs out',
      `A deck has 5 red and 5 blue cards, shuffled. You deal cards until every card of one colour has been dealt.`,
      [{ q: `What is the expected number of cards dealt?`, a: 25 / 3,
        h: [`Count instead the cards left at the end: the run of the other colour after the last card of the exhausted colour.`, `For each red card, P(it comes after every blue card) = 1/(5 + 1).`, `Expected leftovers = 5/6 (red) + 5/6 (blue).`],
        s: [`Cards dealt = 10 − cards left; the leftovers are a tail of one colour.`,
          [`A red card is left over if it follows all 5 blues: probability 1/6. Same for each blue.`, `E[left] = 5/6 + 5/6 = 5/3.`, `E[dealt] = 10 − 5/3 = <b>25/3 ≈ 8.33</b>.`],
          `In general r + b − r/(b + 1) − b/(r + 1).`, ``] }]],

    ['buffon-half', 'Probability', 'm', "Buffon's needle",
      `A needle of length 1 is dropped on a floor ruled with parallel lines 2 apart.`,
      [{ q: `What is the probability the needle crosses a line?`, a: 1 / Math.PI,
        h: [`For a short needle (L ≤ D), P(cross) = 2L/(πD).`, `Equivalently, the expected number of crossings is proportional to length, and a circle of diameter D always crosses twice.`],
        s: [`Buffon: P = 2L/(πD).`,
          [`2 × 1/(π × 2) = <b>1/π ≈ 0.318</b>.`],
          `A needle as long as the gap (L = D) would cross with probability 2/π ≈ 0.64.`, ``] }]],

    ['crp-tables', 'Expected value', 'h', 'The Chinese restaurant',
      `Customers arrive one at a time. The first sits at a new table. Customer i + 1 sits at a new table with probability 1/(i + 1), otherwise at an occupied table (in proportion to how full it is).`,
      [{ q: `What is the expected number of tables after 10 customers?`, a: 7381 / 2520,
        h: [`Use an indicator for "customer i opens a new table".`, `Customer i opens a table with probability 1/i (with concentration α = 1).`, `Add 1 + 1/2 + … + 1/10.`],
        s: [`Linearity: E[tables] = Σ P(customer i opens one) = H<sub>10</sub>.`,
          [`H<sub>10</sub> = 1 + 1/2 + … + 1/10 ≈ <b>2.93</b>.`],
          `It grows like ln n: 100 customers give only about 5.2 tables.`, ``] }]],

    ['elo-200', 'Probability', 'e', 'Elo expected score',
      `In the Elo system, a player rated D points above an opponent has expected score 1/(1 + 10<sup>−D/400</sup>).`,
      [{ q: `What is the expected score of a player rated 200 points higher?`, a: 1 / (1 + 10 ** -0.5), tol: { abs: 0.005, rel: 0 },
        h: [`Plug D = 200 into the formula: 10<sup>−200/400</sup> = 10<sup>−0.5</sup>.`, `10<sup>−0.5</sup> = 1/√10 ≈ 0.316.`],
        s: [`Direct substitution.`,
          [`1/(1 + 0.316) ≈ <b>0.76</b>.`],
          `400 points gives 1/(1 + 0.1) ≈ 0.91.`, ``] }]],

    ['galton', 'Probability', 'e', 'The Galton board',
      `A ball falls through 10 rows of pegs, bouncing left or right with equal chance at each.`,
      [{ q: `What is the probability it lands in the middle bin (5 lefts and 5 rights)?`, a: 252 / 1024,
        h: [`The final bin is the number of right bounces, which is binomial.`, `P(5 rights) = C(10, 5)/2<sup>10</sup>.`],
        s: [`Binomial(10, ½) at its mode.`,
          [`252/1024 ≈ <b>0.246</b>.`],
          `Normal approximation: 1/√(2π × 2.5) ≈ 0.25.`, ``] }]],

    ['parking', 'Combinatorics', 'h', 'Parking functions',
      `Three cars arrive one at a time at three spaces in a row. Each car has a preferred space and takes the first free space at or after it; if none is free it leaves. A list of preferences is a "parking function" if all three cars park.`,
      [{ q: `How many of the 27 preference lists are parking functions?`, a: 16, tol: EXACT,
        h: [`There's a famous formula: (n + 1)<sup>n − 1</sup>.`, `Or count directly: the sorted preferences must satisfy p₍₁₎ ≤ 1, p₍₂₎ ≤ 2, p₍₃₎ ≤ 3.`, `Pollak's argument: add a 4th space and make the street circular.`],
        s: [`Pollak's circle argument gives (n + 1)<sup>n − 1</sup>.`,
          [`(3 + 1)<sup>2</sup> = <b>16</b>.`],
          `For two cars: 3 lists (11, 12, 21) out of 4, matching 3¹ = 3.`, ``] }]],

    ['doubling', 'Expected value', 'm', 'The doubling strategy',
      `You have $63 and bet on a fair coin: $1, and after each loss double the bet (2, 4, 8, …), stopping at your first win. You can afford 6 losses in a row ($1 + $2 + … + $32 = $63).`,
      [{ q: `(a) What is the probability you finish $1 up?`, a: 63 / 64,
        h: [`You end up $1 ahead unless you lose 6 times in a row.`, `P(6 losses in a row) = (½)<sup>6</sup>.`],
        s: [`You win a cycle unless the first six bets all lose.`,
          [`1 − (½)<sup>6</sup> = <b>63/64</b>.`],
          `High chance of a small win…`, ``] },
      { q: `(b) What is your expected profit?`, a: 0, tol: { abs: 0.001, rel: 0 },
        h: [`You win $1 with probability 63/64 and lose $63 otherwise.`, `Multiply out.`],
        s: [`A fair game stays fair whatever the betting system.`,
          [`63/64 × 1 − 1/64 × 63 = <b>0</b>.`],
          `Optional stopping: a bounded betting system can't beat a martingale.`, `Thinking the 63/64 win rate makes it profitable.`] }]],

    // ---------------------------------------------------------------- brain teasers
    ['clock-overlap', 'Logic', 'e', 'When the hands meet',
      `Between 3:00 and 4:00, the hour and minute hands of a clock point the same way once.`,
      [{ q: `How many minutes after 3:00 does that happen?`, a: 180 / 11,
        h: [`The minute hand moves 6° a minute, the hour hand 0.5°.`, `At 3:00 the hour hand is 90° ahead.`, `Solve 6t = 90 + 0.5t.`],
        s: [`The minute hand gains 5.5° a minute and must make up 90°.`,
          [`t = 90/5.5 = 180/11.`, `≈ <b>16.36</b> minutes, about 3:16:22.`],
          `Overlaps are 12/11 hours apart: 3 × 12/11 h = 3h 16.36 min.`, ``] }]],

    ['heavy-27', 'Logic', 'm', 'Find the heavy ball',
      `27 balls look the same; one is slightly heavier. You have a two-pan balance.`,
      [{ q: `What is the fewest weighings that always finds the heavy ball?`, a: 3, tol: EXACT,
        h: [`Each weighing has three outcomes: left heavier, right heavier, balance.`, `So k weighings can tell apart at most 3<sup>k</sup> balls.`, `Weigh 9 against 9 first.`],
        s: [`Each weighing splits the candidates into three groups.`,
          [`9 v 9: the heavy ball is in the heavier group or the 9 left out.`, `3 v 3, then 1 v 1.`, `3<sup>3</sup> = 27, so <b>3</b> weighings.`],
          `12 balls also need 3 (since 9 < 12 ≤ 27); 28 would need 4.`, ``] }]],

    ['ht-hh', 'Expected value', 'm', 'Waiting for HT or HH',
      `Alice tosses a fair coin until she sees HT; Bob tosses until he sees HH.`,
      [{ q: `(a) Expected tosses for Alice (HT)?`, a: 4, tol: EXACT,
        h: [`Wait for the first H (2 tosses on average).`, `After an H, she just needs a T, and further Hs don't hurt.`, `That's another 2 tosses on average.`],
        s: [`HT: wait for H, then wait for T; a second H doesn't set her back.`,
          [`2 + 2 = <b>4</b>.`],
          `For a non-overlapping pattern of length k, the wait is 2<sup>k</sup> = 4.`, ``] },
      { q: `(b) Expected tosses for Bob (HH)?`, a: 6, tol: EXACT,
        h: [`After an H, a T sends Bob all the way back to the start.`, `Let E be from scratch and F after one H: E = 1 + ½F + ½E, F = 1 + ½ × 0 + ½E.`],
        s: [`HH overlaps itself, and a failed second toss loses all progress.`,
          [`From the two equations, E = <b>6</b>.`],
          `Patterns that overlap themselves take longer: HH 6, HT 4.`, `Thinking both patterns take the same time because each has probability ¼.`] }]],

    ['triangle-ants', 'Probability', 'e', 'Ants on a polygon',
      `Ants sit at the corners of a polygon. Each picks a direction along an edge at random and walks.`,
      [{ q: `(a) With 3 ants on a triangle, what is the probability none collide?`, a: 0.25,
        h: [`They avoid each other only if all go the same way round.`, `There are 2<sup>3</sup> equally likely choices.`],
        s: [`Only "all clockwise" and "all anticlockwise" avoid collisions.`,
          [`2/8 = <b>¼</b>.`],
          ``, ``] },
      { q: `(b) With 4 ants on a square?`, a: 0.125,
        h: [`Same idea: they're safe only if all go the same way round.`, `Now there are 2<sup>4</sup> equally likely choices.`],
        s: [`Still only two safe choices.`,
          [`2/16 = <b>1/8</b>.`],
          `For n ants: 2/2<sup>n</sup>.`, ``] }]],

    ['double-headed', 'Conditional probability', 'm', 'A double-headed coin',
      `One of 1,000 coins has heads on both sides. You pick a coin at random and toss it 10 times: all heads.`,
      [{ q: `What is the probability you picked the double-headed coin?`, a: 1024 / 2023,
        h: [`Bayes: compare 1/1000 × 1 with 999/1000 × (½)<sup>10</sup>.`, `(½)<sup>10</sup> = 1/1024.`, `The ratio of the two weights is 1024 : 999.`],
        s: [`Posterior odds = prior odds × likelihood ratio = (1/999) × 1024.`,
          [`P = 1024/(1024 + 999) = 1024/2023 ≈ <b>0.506</b>.`],
          `Ten heads is about 1 in 1,000, the same as the prior: hence roughly 50/50.`, `Ignoring the 1-in-1,000 prior and saying "almost certainly".`] }]],

    ['bridge-torch', 'Logic', 'm', 'Crossing the bridge',
      `Four people cross a bridge at night with one torch; at most two cross at a time, at the slower one's pace. They take 1, 2, 5 and 10 minutes.`,
      [{ q: `What is the shortest total time?`, a: 17, tol: EXACT,
        h: [`Send the two slowest across together, so the 10 doesn't add on top of the 5.`, `Use the two fastest to ferry the torch back.`, `1 and 2 cross, 1 returns, 5 and 10 cross, 2 returns, 1 and 2 cross.`],
        s: [`Pair the two slowest; let the two fastest carry the torch.`,
          [`2 + 1 + 10 + 2 + 2 = <b>17</b> minutes.`],
          `Escorting each person with the 1-minute walker gives 19.`, `Answering 19.`] }]],

    ['cube-colours', 'Combinatorics', 'h', 'Colouring a cube',
      `Each face of a cube is painted one of three colours, using each colour on exactly two faces. Two cubes are the same if one can be rotated to look like the other.`,
      [{ q: `How many different cubes are there?`, a: 6, tol: EXACT,
        h: [`Classify by how many colours sit on opposite faces.`, `All three on opposite pairs: 1 way. Exactly one colour on an opposite pair: count the arrangements of the other four faces.`, `No colour opposite itself: check the arrangements and their mirror images.`],
        s: [`Case by the number of colours painted on opposite faces.`,
          [`All three opposite: 1. Exactly one opposite: 3 (which colour). None opposite: 2 (mirror images).`, `Total <b>6</b>.`],
          `Burnside over the 24 rotations: the identity fixes all 90 colourings, each of the 3 face half-turns fixes 6, each of the 6 edge half-turns fixes 6, the rest fix none: (90 + 18 + 36)/24 = 6.`, `Answering 3 by treating colours as interchangeable.`] }]],

    ['cycle-boxes', 'Probability', 'h', 'Following the chain of boxes',
      `4 prisoners numbered 1–4; 4 boxes hold their numbers in random order. Each may open 2 boxes, starting with the box of their own number and then opening the box named by the slip inside. All go free if everyone finds their number.`,
      [{ q: `What is the probability they all go free?`, a: 5 / 12,
        h: [`A prisoner finds their number exactly when their cycle in the permutation has length at most 2.`, `So everyone succeeds when the random permutation has no cycle longer than 2.`, `Count permutations of 4 made only of fixed points and swaps.`],
        s: [`Success ⇔ every cycle has length ≤ 2.`,
          [`Identity 1, one swap 6, two swaps 3: 10 permutations.`, `10/24 = <b>5/12 ≈ 0.42</b>, against (½)<sup>4</sup> = 1/16 with random choices.`],
          `With 100 prisoners and 50 boxes each, the same strategy works about 31% of the time.`, ``] }]],

    ['hourglasses', 'Logic', 'm', 'Two hourglasses',
      `You have a 7-minute and an 11-minute hourglass.`,
      { open: `<p>Start both. When the 7 runs out (minute 7), turn it over. When the 11 runs out (minute 11), the 7 has run for 4 minutes since it was turned: turn it over again, so those 4 minutes run back. It empties at minute <b>15</b>.</p><p>(Alternatively: start both; when the 7 empties, start timing; the 11 has 4 minutes left; then turn the 11 over for 11 more: 4 + 11 = 15.)</p>`,
        h: [`15 = 11 + 4, and 4 = 11 − 7.`, `Start both glasses together and see what is left in one when the other runs out.`, `Turning a glass over at the right moment "replays" the sand that has fallen.`] }],

    ['sock-half', 'Combinatorics', 'm', 'Socks with even odds',
      `A drawer holds red and blue socks. Drawing two at random, the chance they match is exactly ½.`,
      [{ q: `What is the smallest possible number of socks in the drawer?`, a: 4, tol: EXACT,
        h: [`With r red and b blue, P(match) = [r(r − 1) + b(b − 1)]/[n(n − 1)].`, `Setting this to ½ gives (r − b)² = r + b.`, `So the total must be a perfect square.`],
        s: [`P(match) = ½ ⇔ (r − b)² = n.`,
          [`n = 1 doesn't allow a pair; n = 4 with r = 3, b = 1: (3·2 + 0)/(4·3) = ½.`, `Smallest drawer: <b>4</b> socks.`],
          `The next solutions are 9 (6 and 3) and 16 (10 and 6).`, ``] }]],

    ['roulette-two', 'Probability', 'm', 'Two-player roulette',
      `A six-shot revolver has bullets in two adjacent chambers. The cylinder is spun once; then players A and B alternately pull the trigger (A first), without spinning again, until someone is shot.`,
      [{ q: `What is the probability A survives?`, a: 1 / 3,
        h: [`The spin picks the starting chamber uniformly; after that everything is determined.`, `For each of the 6 starting chambers, find the shot number at which the first bullet comes up.`, `A shoots on shots 1, 3, 5; B on shots 2, 4.`],
        s: [`List the six starting positions and who meets the first bullet.`,
          [`Bullet on shot 1 (two starts), shot 2, shot 3, shot 4, shot 5: one start each.`, `B is hit on shots 2 and 4: 2 starts out of 6.`, `P(A survives) = <b>1/3</b>.`],
          `Going first is bad here: A faces the first shot and also shots 3 and 5.`, ``] }]],

    ['rubber-band', 'Logic', 'h', 'The ant on the rubber band',
      `An ant walks at 1 cm/s along a 1 m rubber band, from one end, while the far end is pulled away so the band grows by 1 m every second (stretching evenly).`,
      [{ q: `The ant reaches the far end after e<sup>k</sup> − 1 seconds. What is k?`, a: 100, tol: EXACT,
        h: [`Track the ant's position as a fraction of the band, which stretching doesn't change.`, `At time t the band is (1 + t) m long, so the fraction grows at 0.01/(1 + t) per second.`, `Integrate: 0.01 ln(1 + T) = 1.`],
        s: [`Even stretching keeps fractions fixed; only walking moves the ant's fraction.`,
          [`Fraction after T seconds: 0.01 ln(1 + T).`, `It reaches 1 when ln(1 + T) = 100, so T = e<sup>100</sup> − 1: k = <b>100</b>.`],
          `That's about 10<sup>43</sup> seconds, but finite.`, `Saying it never arrives because the band outruns it.`] }]],

    ['wise-men', 'Logic', 'h', 'Three wise men',
      `Three wise men each wear a red or blue hat and can see the other two hats. They're told at least one hat is red, and asked to say their own colour as soon as they know it. All three hats are in fact red. After a long silence, one says "red".`,
      { open: `<p>He reasons: <b>if my hat were blue</b>, each of the others would see one red and one blue. Each would think, "if mine were blue too, the third man would see two blues and immediately say red." When the third man stays silent, each of the two would conclude their own hat is red and speak quickly.</p><p>Since nobody has spoken after a long silence, his assumption must be wrong: <b>his hat is red</b>. The silence is the information.</p>`,
        h: [`Suppose your hat were blue. What would the other two see, and what would they conclude?`, `Work through what one of them would deduce from the third man's silence.`, `If no one speaks for a long time, which assumption has failed?`] }],

    ['all-in', 'Expected value', 'm', 'Betting everything',
      `You start with $100 and bet everything on each of 5 tosses of a fair coin (heads doubles your stake, tails loses it).`,
      [{ q: `(a) What is your expected wealth after 5 tosses?`, a: 100, tol: { abs: 0.01, rel: 0 },
        h: [`Each fair bet leaves the expected wealth unchanged.`, `Or: you end with your stake multiplied by 2<sup>5</sup> with probability (½)<sup>5</sup>, and nothing otherwise.`],
        s: [`Fair bets are martingales: expected wealth stays at the start.`,
          [`3200 × 1/32 = <b>$100</b>.`],
          `The expected value is the same for any strategy in a fair game.`, `Answering 100 × (3/2)<sup>5</sup>.`] },
      { q: `(b) What is the probability you still have any money?`, a: 1 / 32,
        h: [`Losing any single toss wipes you out.`, `So you must win every toss: multiply the chances.`],
        s: [`All five tosses must be heads.`,
          [`(½)<sup>5</sup> = <b>1/32</b>.`],
          `Same mean, huge spread: that's why expected value alone is a poor guide.`, ``] }]],

    ['monty-thousand', 'Conditional probability', 'e', 'Monty Hall with 1,000 boxes',
      `One of 1,000 boxes holds a prize. You pick box 1. The host, who knows where the prize is, opens 998 of the others, all empty.`,
      [{ q: `What is the probability the one remaining unopened box holds the prize?`, a: 0.999,
        h: [`Your box was right with probability 1/1000, and the host's actions can't change that.`, `Everything else flows to the one box he left closed.`],
        s: [`The host concentrates all of the other boxes' probability onto one box.`,
          [`1 − 1/1000 = <b>0.999</b>.`],
          `With three doors the same reasoning gives 2/3.`, ``] }]],

    ['cake-cut', 'Game theory', 'e', 'Sharing a cake fairly',
      `Two people value different parts of a cake differently. They want each to feel they got at least half by their own valuation.`,
      { open: `<p><b>I cut, you choose.</b> The cutter divides the cake into two pieces they value equally; the chooser takes whichever piece they prefer. The chooser gets at least half by their valuation (they pick the better one), and the cutter gets exactly half by theirs whichever piece is left. Neither needs to know the other's preferences.</p>`,
        h: [`Give each person a role that protects them.`, `If you cut, how should you cut so you don't mind which piece you get?`, `If you choose, what do you pick?`] }],

    ['jugs', 'Logic', 'm', 'Measuring 4 litres',
      `You have a 5-litre and a 3-litre jug and unlimited water. A move is filling a jug, emptying it, or pouring one into the other until one is empty or the other full.`,
      [{ q: `What is the fewest moves that leaves exactly 4 litres in a jug?`, a: 6, tol: EXACT,
        h: [`Try filling the 5 and pouring into the 3, or filling the 3 and pouring into the 5.`, `Track the pair (big jug, small jug) after each move.`, `Fill 5, pour into 3, empty 3, pour, fill 5, pour.`],
        s: [`Search the states (big, small); the shortest route is 6 moves.`,
          [`(5,0) → (2,3) → (2,0) → (0,2) → (5,2) → (4,3).`, `<b>6</b> moves.`],
          `The other route (filling the 3 first) takes 8.`, ``] }]],

    ['handshake-parity', 'Combinatorics', 'e', 'Odd handshakes',
      `At a party some pairs of people shake hands.`,
      { open: `<p>Add up, over all people, the number of hands each shook. Every handshake is counted twice (once for each person), so the total is <b>even</b>. The people with an even count contribute an even amount, so the odd counts must add to an even number, which needs an <b>even number of people with odd counts</b>. (This is the handshake lemma.)</p>`,
        h: [`Add up everyone's number of handshakes.`, `How many times is each handshake counted in that total?`, `A sum of odd numbers is even only if there are evenly many of them.`] }],

    ['consecutive-1000', 'Combinatorics', 'm', 'Consecutive sums to 1,000',
      `In how many ways can 1,000 be written as a sum of two or more consecutive positive integers?`,
      [{ q: `Number of ways:`, a: 3, tol: EXACT,
        h: [`k consecutive numbers starting at a sum to k(2a + k − 1)/2.`, `So 2000 = k(2a + k − 1), where k and 2a + k − 1 have opposite parity.`, `Each odd divisor of 1000 other than 1 gives one way.`],
        s: [`Ways (including the one-term sum) = number of odd divisors.`,
          [`1000 = 2³ × 5³ has odd divisors 1, 5, 25, 125: four.`, `Dropping the one-term sum: <b>3</b> ways (198–202, 28–52, and 55–70).`],
          `Powers of two have only the trivial representation.`, ``] }]],

    ['clock-digits', 'Combinatorics', 'h', 'Repeated digits on a clock',
      `A 12-hour digital clock shows times from 1:00 to 12:59 (no leading zero on the hour).`,
      [{ q: `Of the 720 displays, how many contain some digit at least twice?`, a: 272, tol: EXACT,
        h: [`Count the displays with all digits different, then subtract from 720.`, `For a one-digit hour h, the first minute digit (0–5) must avoid h, and the second minute digit must avoid both.`, `Treat the hours 10, 11 and 12 separately: 11 always repeats.`],
        s: [`Count displays with no repeated digit, hour by hour.`,
          [`Hours 1–5: first minute digit 5 choices (0–5 minus h), second 8: 40 each, 200 in all.`, `Hours 6–9: 6 × 8 = 48 each, 192 in all. Hours 10 and 12: 4 × 7 = 28 each. Hour 11: none.`, `448 with no repeat, so 720 − 448 = <b>272</b> repeat a digit.`],
          `272/720 ≈ 38%.`, ``] }]],

    ['flip-seven', 'Combinatorics', 'h', 'Flipping seven coins',
      `10 coins lie in a row. A move flips any 7 consecutive coins.`,
      [{ q: `Starting from all heads, how many different arrangements can you reach?`, a: 16, tol: EXACT,
        h: [`There are only 4 possible moves (windows starting at positions 1–4), and order doesn't matter.`, `Doing a move twice undoes it, so each move is used 0 or 1 times.`, `Check that different sets of moves give different results.`],
        s: [`Moves commute and are self-inverse, so a reachable pattern is a subset of the 4 moves.`,
          [`The 4 windows are independent (each covers a coin no later window does at its left end), so all 2⁴ subsets differ.`, `<b>16</b> arrangements, out of 1,024: most patterns can't be fixed.`],
          `So the answer to "can you always get back to all heads?" is no.`, ``] }]],

    ['knights-tour', 'Logic', 'm', "A knight's tour",
      `Can a knight visit every square of an 8 × 8 chessboard exactly once and finish a knight's move from where it started?`,
      { open: `<p><b>Yes.</b> Closed knight's tours exist on the 8 × 8 board (there are about 13 trillion of them, counting directions). A practical way to find one is <b>Warnsdorff's rule</b>: always move to the square with the fewest onward moves, which rarely gets stuck; backtracking fixes the occasional dead end. Note that a closed tour needs an even number of squares, because each knight move changes square colour.</p>`,
        h: [`Knight moves always change the colour of the square.`, `So a closed tour must alternate colours: what does that need of the number of squares?`, `For constructing one, a greedy rule works well: go where there are fewest onward moves.`] }],

    // ---------------------------------------------------------------- finance
    ['parity-105', 'Options', 'e', 'Put–call parity',
      `A stock is at $100. A 1-year call struck at $105 costs $8. The risk-free rate is 5% (continuous); no dividends.`,
      [{ q: `What should the 1-year $105 put cost?`, a: 8 - 100 + 105 * Math.exp(-0.05), tol: { abs: 0.02, rel: 0 },
        h: [`Put–call parity: C − P = S − K e<sup>−rT</sup>.`, `K e<sup>−rT</sup> = 105 × e<sup>−0.05</sup> ≈ 105 × 0.9512.`, `Solve for P.`],
        s: [`Parity ties the put to the call, stock and bond.`,
          [`K e<sup>−rT</sup> ≈ 99.88.`, `P = C − S + K e<sup>−rT</sup> = 8 − 100 + 99.88 ≈ <b>$7.88</b>.`],
          `Here K e<sup>−rT</sup> ≈ S, so the call and put are worth almost the same (C − P = 0.12).`, `Forgetting to discount the strike (which gives $13).`] }]],

    ['delta-hedge', 'Options', 'e', 'Delta hedging a short call',
      `You've sold 100 calls, each on one share, with delta 0.6.`,
      [{ q: `How many shares should you hold to be delta-neutral?`, a: 60, tol: EXACT,
        h: [`A short call has delta −0.6 per option.`, `Total option delta: 100 × (−0.6).`, `Hold shares (delta 1 each) to cancel it.`],
        s: [`Offset the options' delta with shares.`,
          [`Position delta = −60.`, `Buy <b>60</b> shares.`],
          `As the stock rises the call's delta grows, so you buy more: short gamma.`, `Selling shares instead of buying.`] }]],

    ['call-arb', 'Options', 'e', 'A call below intrinsic value',
      `A stock trades at $50 and an American call struck at $45 trades at $3.`,
      [{ q: `What riskless profit per share can you lock in?`, a: 2, tol: { abs: 0.01, rel: 0 },
        h: [`An American call can be exercised immediately for S − K.`, `Compare that intrinsic value with the price.`],
        s: [`Buy below intrinsic value and exercise.`,
          [`Buy the call for $3, exercise at $45, sell the share at $50.`, `Profit 50 − 45 − 3 = <b>$2</b>.`],
          `For a European call, the bound is C ≥ S − K e<sup>−rT</sup>, also violated here.`, ``] }]],

    ['forward-6m', 'Finance', 'e', 'A forward price',
      `A non-dividend stock is at $100 and the risk-free rate is 4% (continuous).`,
      [{ q: `What is the 6-month forward price?`, a: 100 * Math.exp(0.02), tol: { abs: 0.01, rel: 0 },
        h: [`No-arbitrage forward: F = S e<sup>rT</sup>.`, `T = 0.5, so rT = 0.02.`],
        s: [`Cost of carry: buy the stock with borrowed money and hold it.`,
          [`F = 100 e<sup>0.02</sup> ≈ <b>$102.02</b>.`],
          `Simple interest gives 102.00; continuous compounding adds 2 cents.`, ``] }]],

    ['var-95', 'Finance', 'e', 'One-day VaR',
      `A $10 million portfolio has daily volatility 2%, and returns are taken to be normal with mean zero.`,
      [{ q: `What is the 1-day 95% value at risk, in dollars?`, a: 10e6 * 0.02 * 1.645, tol: { abs: 500, rel: 0 },
        h: [`95% one-sided corresponds to 1.645 standard deviations.`, `One standard deviation is $10m × 2%.`],
        s: [`VaR = z × σ × value.`,
          [`σ in dollars = $200,000.`, `1.645 × 200,000 = <b>$329,000</b>.`],
          `99% would use 2.33: about $466,000.`, `Using 1.96 (the two-sided 95% value).`] }]],

    ['sharpe', 'Finance', 'e', 'Sharpe ratio',
      `A portfolio is expected to return 12% a year with 15% volatility; the risk-free rate is 3%.`,
      [{ q: `What is its Sharpe ratio?`, a: 0.6,
        h: [`Sharpe measures excess return per unit of risk.`, `Sharpe = (expected return − risk-free rate)/volatility.`],
        s: [`Excess return per unit of risk.`,
          [`(12 − 3)/15 = <b>0.6</b>.`],
          `Annual Sharpe 0.6 is roughly what broad equity indices have managed historically.`, `Leaving out the risk-free rate (giving 0.8).`] }]],

    ['duration', 'Finance', 'e', 'Duration',
      `A bond has (modified) duration 5 years. Yields rise by 1 percentage point.`,
      [{ q: `By roughly what percentage does its price change?`, a: -5, tol: { abs: 0.05, rel: 0 },
        h: [`ΔP/P ≈ −D × Δy.`, `Δy = 0.01.`],
        s: [`First-order (duration) approximation.`,
          [`−5 × 0.01 = −0.05: about <b>−5%</b>.`],
          `Convexity makes the true fall slightly smaller than 5%.`, ``] }]],

    ['beta-mix', 'Finance', 'e', 'Portfolio beta',
      `A portfolio is 60% stocks with beta 1.2 and 40% bonds with beta 0.1.`,
      [{ q: `What is the portfolio's beta?`, a: 0.76,
        h: [`Beta is linear in the weights.`, `0.6 × 1.2 + 0.4 × 0.1.`],
        s: [`Weighted average of betas.`,
          [`0.72 + 0.04 = <b>0.76</b>.`],
          ``, ``] }]],

    ['put-delta', 'Options', 'm', 'Call and put deltas',
      `A European call on a non-dividend stock has delta 0.7.`,
      [{ q: `What is the delta of the put with the same strike and expiry?`, a: -0.3,
        h: [`Differentiate put–call parity C − P = S − K e<sup>−rT</sup> with respect to S.`, `So Δ<sub>call</sub> − Δ<sub>put</sub> = 1.`],
        s: [`Parity: the call minus the put is a forward, whose delta is 1.`,
          [`Δ<sub>put</sub> = 0.7 − 1 = <b>−0.3</b>.`],
          `A quoted pair of 0.7 and −0.2 would point to dividends, early exercise or mispricing.`, ``] }]],

    ['irp', 'Finance', 'e', 'Interest-rate parity',
      `EUR/USD is 1.20 (dollars per euro). One-year rates are 2% in USD and 1% in EUR.`,
      [{ q: `What should the 1-year forward rate be?`, a: 1.2 * 1.02 / 1.01, tol: { abs: 0.0005, rel: 0 },
        h: [`Covered interest parity: F = S × (1 + r<sub>USD</sub>)/(1 + r<sub>EUR</sub>).`, `The currency with the higher rate trades at a forward discount.`],
        s: [`No arbitrage between holding dollars and holding euros with the currency risk hedged.`,
          [`F = 1.20 × 1.02/1.01 ≈ <b>1.2119</b>.`],
          `The euro is worth more forward because euro rates are lower.`, ``] }]],

    ['vol-call', 'Options', 'e', 'Volatility and a call',
      `Why does a call option's value rise when volatility rises?`,
      { open: `<p>The call's payoff max(S − K, 0) is <b>convex</b>: big moves up add a lot, big moves down cost nothing more once the option is worthless. Spreading out the distribution of the stock price (with the same forward) therefore raises the expected payoff. Formally vega = S φ(d₁)√T > 0. The same holds for puts.</p>`,
        h: [`Sketch the payoff of a call.`, `What happens to an option's payoff in a very bad scenario compared with a very good one?`, `Jensen's inequality for a convex payoff.`] }],

    ['rates-options', 'Options', 'e', 'Interest rates and options',
      `How do higher interest rates affect call and put prices?`,
      { open: `<p><b>Calls rise, puts fall.</b> Owning a call is like buying the stock later for K, so a higher rate lowers the present value of the strike you'll pay (K e<sup>−rT</sup>), making the call worth more; a put pays you K later, which is worth less. Equivalently, the forward S e<sup>rT</sup> rises with r. The effect (rho) is largest for long-dated, in-the-money options.</p>`,
        h: [`Write put–call parity and look at the strike term.`, `A call is a deferred purchase; a put is a deferred sale.`] }],

    ['gamma-atm', 'Options', 'e', 'Where gamma is largest',
      `Why is gamma highest for at-the-money options, especially near expiry?`,
      { open: `<p>Gamma is the rate of change of delta. Deep in or out of the money, delta is stuck near 1 or 0 and barely moves. At the money, a small move in the stock swings the option between finishing in and out of the money, so delta changes fastest. Near expiry the option's payoff kinks sharply at the strike, so ATM gamma grows like 1/(σS√T).</p>`,
        h: [`Gamma measures how fast delta changes.`, `Where is delta most uncertain: deep ITM, deep OTM, or at the money?`] }],

    ['skew', 'Options', 'm', 'The volatility skew',
      `Why do out-of-the-money equity puts usually have higher implied volatility than at-the-money options?`,
      { open: `<p>Markets fall faster than they rise and crash risk is real, so returns have a fat left tail that a lognormal model understates; investors pay up for downside protection; and volatility tends to rise as prices fall (the leverage effect, and spot–vol correlation). Higher demand for puts plus a fatter left tail shows up as higher implied volatility at low strikes: the skew.</p>`,
        h: [`Think about what returns actually look like in a crash.`, `Who buys out-of-the-money puts, and why?`, `What happens to volatility when stocks fall?`] }],

    ['dividends-options', 'Options', 'e', 'Dividends and options',
      `How do expected dividends affect call and put prices?`,
      { open: `<p>The stock price drops by about the dividend on the ex-date, and option holders don't receive dividends. So expected dividends lower the forward price: <b>calls are worth less and puts more</b>. They can also make early exercise of an American call worthwhile, just before an ex-date.</p>`,
        h: [`What happens to the share price on the ex-dividend date?`, `Does the option holder get the dividend?`] }],

    ['american-call', 'Options', 'm', 'Exercising an American call early',
      `When should you exercise an American call on a stock that pays no dividends before expiry?`,
      { open: `<p><b>Never.</b> Exercising now gives S − K. But the call is worth at least S − K e<sup>−rT</sup> > S − K (with positive rates), plus the insurance value of not owning the stock if it falls. Selling the call (or hedging by shorting the stock) is always better than exercising. With dividends, exercising just before an ex-date can be optimal.</p>`,
        h: [`Compare the exercise value S − K with the lower bound on the call price.`, `Exercising early gives up two things: interest on the strike, and protection if the stock falls.`] }],

    ['carry-trade', 'Finance', 'e', 'The carry trade',
      `What is a currency carry trade, and what is its main risk?`,
      { open: `<p>Borrow in a low-interest currency, convert, and invest in a high-interest currency, earning the rate difference. Uncovered interest parity says the high-yield currency should depreciate enough to cancel this on average, but empirically it often doesn't. The main risk is a <b>sharp move in the exchange rate</b>, typically in a risk-off crash when carry trades unwind together: steady small gains, occasional large losses.</p>`,
        h: [`Where does the profit come from?`, `What would wipe out the interest-rate gain?`] }],

    ['cds', 'Finance', 'm', 'What drives a CDS spread',
      `What determines the price of a credit default swap?`,
      { open: `<p>Roughly, spread ≈ (default intensity) × (loss given default), so the main drivers are the <b>probability of default</b> of the reference name and the <b>expected recovery rate</b>. Also: maturity, interest rates for discounting, the seller's own credit (counterparty risk), liquidity, and any correlation between the reference name and the protection seller (wrong-way risk).</p>`,
        h: [`A CDS is insurance on a bond's default.`, `How much would the insurer expect to pay out, and how often?`] }],

    ['repo', 'Finance', 'e', 'Repo',
      `What is a repo, and what is the repo rate?`,
      { open: `<p>A repurchase agreement is a sale of securities with an agreement to buy them back later at a slightly higher price: in effect a <b>secured loan</b> with the securities as collateral. The repo rate is the implied interest rate. It's the core funding market for banks and leveraged investors and transmits central-bank policy; "special" collateral that is in demand trades at lower repo rates.</p>`,
        h: [`Think of it as a loan: who lends, who borrows, and what is the collateral?`, `The difference between the sale price and the repurchase price is the interest.`] }],

    ['emh', 'Finance', 'm', 'Active management in efficient markets',
      `If markets are efficient, how can an active manager add value?`,
      { open: `<p>Markets are only approximately efficient, and someone must be paid to make them so (the Grossman–Stiglitz argument). Managers can add value by: being compensated for providing liquidity or bearing risks others avoid; exploiting behavioural biases and constraints of other investors (forced sellers, index rebalancing); having faster or better information processing; and managing risk, costs and taxes well. Net of fees, most don't, which is the evidence for efficiency.</p>`,
        h: [`If prices were perfectly efficient, who would bother gathering information?`, `Some returns are payment for risk or liquidity, not skill.`] }],

    ['inverted-curve', 'Finance', 'e', 'An inverted yield curve',
      `What does an inverted yield curve (short rates above long rates) usually signal?`,
      { open: `<p>That markets expect <b>rates to fall</b>, usually because they expect the economy to weaken and the central bank to cut. Inversions (e.g. 10-year below 3-month) have preceded most US recessions, with a lag of roughly a year or two, though the term premium and quantitative easing complicate the signal.</p>`,
        h: [`Long rates reflect expected future short rates.`, `Why would investors expect short rates to fall?`] }],

    ['theta-moneyness', 'Options', 'e', 'Time decay and moneyness',
      `How does theta vary with moneyness?`,
      { open: `<p>Time decay is largest for <b>at-the-money</b> options, which hold the most time value, and it accelerates as expiry nears (roughly like 1/√T). Deep in-the-money options are mostly intrinsic value and deep out-of-the-money ones have little value left, so both decay slowly. Theta and gamma go together: long gamma means paying theta.</p>`,
        h: [`Theta eats time value. Which options have the most time value?`, `Relate it to gamma: the option you'd most like to own for movement costs the most to hold.`] }],

    ['liquidity-options', 'Options', 'm', 'Liquidity and option prices',
      `How does liquidity risk affect option prices?`,
      { open: `<p>Illiquid options are harder to hedge and to exit, so market makers widen bid–ask spreads and charge for the inventory and model risk they carry. Prices (and implied vols) are pushed in the direction of the demand: options that are hard to hedge and in demand trade rich. Thin markets also make quotes stale and less informative.</p>`,
        h: [`What does a market maker need to do after selling you an option?`, `What does it cost them if that's hard?`] }],

    ['contango', 'Finance', 'e', 'Contango and backwardation',
      `What are contango and backwardation in futures markets?`,
      { open: `<p><b>Contango</b>: futures prices above spot, rising with maturity, typical when carrying the asset costs money (storage, financing) and there's no shortage. <b>Backwardation</b>: futures below spot, common when a commodity is scarce now and holding it has a "convenience yield". The roll yield earned by holding futures is negative in contango and positive in backwardation.</p>`,
        h: [`Futures price ≈ spot × e<sup>(r + storage − convenience yield)T</sup>.`, `Which term dominates when supply is tight?`] }],

    ['short-vol', 'Options', 'm', 'Trading a view that vol is too high',
      `You think realised volatility will be lower than implied. How do you trade it?`,
      { open: `<p>Be <b>short vega and short gamma</b>: sell straddles or strangles (or sell options and delta-hedge them), so you collect the time decay implied by the high vol and pay out only the smaller realised moves. If you delta-hedge, profit ≈ ½ Γ S² (σ<sub>implied</sub>² − σ<sub>realised</sub>²) per unit time. Risks: a large jump, and implied vol rising further before you're proved right. Variance swaps give a cleaner exposure.</p>`,
        h: [`Which option positions profit when the stock moves less than expected?`, `If you delta-hedge a short option, what do you earn and what do you pay?`] }],

    ['bid-ask', 'Market making', 'm', 'Why bid–ask spreads exist',
      `What causes bid–ask spreads, and when are they wider?`,
      { open: `<p>Spreads pay market makers for <b>inventory risk</b>, <b>adverse selection</b> (losing to better-informed traders) and order-processing costs. They're wider for illiquid or volatile stocks, larger trade sizes, around news and at the open and close, and when the market maker already holds a large position.</p>`,
        h: [`What does a market maker risk by quoting both sides?`, `Who is most likely to trade against their quote?`] }],

    ['mc-barrier', 'Options', 'm', 'Pricing a barrier option by simulation',
      `How would you price a down-and-out call by Monte Carlo?`,
      { open: `<p>Simulate many risk-neutral paths of the stock (e.g. GBM with drift r), checking the barrier along each path. If a path touches the barrier the payoff is 0; otherwise it's max(S<sub>T</sub> − K, 0). Average the payoffs and discount at e<sup>−rT</sup>. Watch two issues: <b>discrete monitoring</b> misses crossings between time steps (use fine steps or a Brownian-bridge correction), and the standard error falls only as 1/√N, so use variance reduction (antithetic paths, control variates).</p>`,
        h: [`Simulate under the risk-neutral measure.`, `What must you check along each path, not just at the end?`, `What goes wrong if you only check the barrier at each time step?`] }],

    ['el-ul', 'Finance', 'm', 'Expected and unexpected credit loss',
      `What's the difference between expected and unexpected loss in credit risk?`,
      { open: `<p><b>Expected loss</b> = PD × LGD × EAD, the average loss, which should be priced into loan rates and provisioned. <b>Unexpected loss</b> is the variability around it (e.g. a high percentile of the loss distribution minus EL), which capital must absorb. Correlated defaults make unexpected loss much larger than diversification would suggest.</p>`,
        h: [`One is an average; the other is about the tail.`, `Which is covered by pricing, and which by capital?`] }],

    ['rwa', 'Finance', 'm', 'Risk-weighted assets',
      `What are risk-weighted assets in bank regulation?`,
      { open: `<p>Each asset is multiplied by a risk weight reflecting its credit risk (for example government bonds near 0%, residential mortgages around 35%, unrated corporate loans 100%), and banks must hold capital of at least a set fraction of the total (for example 8% total capital, with higher common-equity buffers). Large banks may use internal models for the weights, within regulatory floors.</p>`,
        h: [`Capital requirements depend on how risky the assets are.`, `How would you scale a safe asset versus a risky loan?`] }],

    ['pairs-trade', 'Statistics', 'm', 'Pairs trading',
      `Describe a pairs-trading strategy and its main risks.`,
      { open: `<p>Find two securities whose prices move together (ideally <b>cointegrated</b>), model the spread between them, and when the spread is unusually wide buy the cheap one and short the rich one, closing when it reverts. Risks: the relationship breaks (a merger, a fundamental change), the spread widens further before reverting (so you must size for it), crowding in the same trades, and costs and shorting constraints eating the edge. Test for cointegration out of sample rather than just correlation.</p>`,
        h: [`What has to be true about the two prices for the spread to revert?`, `What happens if the relationship changes for good?`] }],
  ]);
  // ---------------------------------------------------------------- fast arithmetic
  // EigenPrep's 50 quick-fire sums, as five sets of ten. Each part gets method hints and worked
  // steps for its kind of sum.
  const F = QT.fmtNum;
  const ARITH = [
    ['×', 17, 13], ['√', 441], ['²', 23], ['÷', 144, 12], ['%', 15, 240], ['^', 2, 8], ['+', 73, 89], ['×', 19, 25], ['√', 169], ['²', 16],
    ['−', 357, 189], ['!', 8, 6], ['×', 24, 37], ['%', 12.5, 320], ['^', 3, 5], ['+', 95, 127], ['√', 225], ['×', 18, 45], ['²', 25], ['÷', 480, 15],
    ['%', 35, 180], ['×', 11, 99], ['−', 234, 157], ['^', 2, 10], ['√', 324], ['×', 14, 17], ['+', 72, 139], ['%', 20, 450], ['²', 21], ['^', 6, 4],
    ['×', 156, 4], ['÷', 729, 27], ['√', 289], ['×', 15, 67], ['−', 418, 239], ['%', 37.5, 160], ['×', 13, 84], ['²', 19], ['+', 85, 276], ['^', 2, 7],
    ['√', 196], ['×', 28, 25], ['÷', 675, 25], ['%', 60, 85], ['²', 17], ['−', 346, 178], ['×', 16, 31], ['^', 5, 6], ['+', 92, 219], ['√', 361],
  ];
  const sup = (n) => `<sup>${n}</sup>`;
  function arithPart([op, x, y]) {
    const near10 = (n) => Math.round(n / 10) * 10;
    switch (op) {
      case '×': {
        const t = Math.floor(y / 10) * 10, u = y - t, a = x * y;
        return { q: `${x} × ${y}`, a, h: [`Split one number into tens and units.`, `${x} × ${y} = ${x} × ${t} + ${x} × ${u}.`],
          s: [`Distribute over tens and units.`, [`${x} × ${t} = ${F(x * t)}; ${x} × ${u} = ${F(x * u)}.`, `Total <b>${F(a)}</b>.`], `Last digits: ${x % 10} × ${y % 10} ends in ${(x * y) % 10}.`, ``] };
      }
      case '²': {
        const r = near10(x), d = x - r, a = x * x;
        return { q: `${x}²`, a, h: [`Use (r + d)² = r² + 2rd + d² with r a round number.`, `Take r = ${r} and d = ${d}.`],
          s: [`Square around the nearest multiple of ten.`, [`${r}² = ${F(r * r)}; 2 × ${r} × ${d} = ${F(2 * r * d)}; ${d}² = ${d * d}.`, `Total <b>${F(a)}</b>.`], `It ends in ${(x % 10) ** 2 % 10}, like ${x % 10}².`, ``] };
      }
      case '√': {
        const a = Math.round(Math.sqrt(x));
        return { q: `√${x}`, a, h: [`Find the two squares of multiples of ten it lies between.`, `The last digit of ${x} narrows the last digit of the root to two choices.`],
          s: [`Bracket between round squares, then use the last digit.`, [`${Math.floor(a / 10) * 10}² ≤ ${x} < ${(Math.floor(a / 10) + 1) * 10}², and the last digit fits ${a % 10}.`, `√${x} = <b>${a}</b>.`], `Check: ${a} × ${a} = ${x}.`, ``] };
      }
      case '÷': {
        const a = x / y;
        return { q: `${x} ÷ ${y}`, a, h: [`Treat it as a missing factor: the divisor times what gives the dividend?`, `Try a round guess and adjust.`],
          s: [`Division as a missing factor.`, [`${y} × ${a} = ${x}.`, `So <b>${a}</b>.`], `Rough size: ${x}/${y} ≈ ${F(Math.round(x / y))}.`, ``] };
      }
      case '%': {
        const a = (x * y) / 100;
        return { q: `${x}% of ${y}`, a, h: [`x% of y = y% of x: use whichever is easier.`, `Build it from 10%, 5% and 1% pieces, or a simple fraction.`],
          s: [`Turn the percentage into a fraction or easy pieces.`, [`${x}% = ${x}/100, so ${y} × ${x}/100.`, `= <b>${F(a)}</b>.`], `${x}% is ${x < 50 ? 'under half' : 'over half'}, so the answer should be ${x < 50 ? 'under' : 'over'} ${F(y / 2)}.`, ``] };
      }
      case '^': {
        const a = x ** y;
        return { q: `${x}${sup(y)}`, a, h: [`Square repeatedly: x², x⁴, x⁸ …`, `Combine the powers you need.`],
          s: [`Build the power from squares.`, [`${x}${sup(y)} = ${Array(y).fill(x).join(' × ')}.`, `= <b>${F(a)}</b>.`], ``, ``] };
      }
      case '!': {
        const a = x * (x - 1);
        return { q: `${x}! ÷ ${y}!`, a, h: [`Write out ${x}! and cancel ${y}!.`, `Only the top two factors are left.`],
          s: [`Factorials cancel.`, [`${x}!/${y}! = ${x} × ${x - 1}.`, `= <b>${a}</b>.`], ``, ``] };
      }
      case '+': {
        const a = x + y;
        return { q: `${x} + ${y}`, a, h: [`Add the hundreds and tens first, then the units.`, `Or round one number and correct.`],
          s: [`Round and compensate.`, [`${x} + ${near10(y)} = ${x + near10(y)}, then ${y - near10(y) >= 0 ? '+' : '−'} ${Math.abs(y - near10(y))}.`, `= <b>${a}</b>.`], ``, ``] };
      }
      default: { // −
        const a = x - y, r = near10(y);
        return { q: `${x} − ${y}`, a, h: [`Subtract a round number, then correct.`, `${x} − ${r}, then adjust by ${Math.abs(r - y)}.`],
          s: [`Round and compensate.`, [`${x} − ${r} = ${x - r}, then ${r - y >= 0 ? '+' : '−'} ${Math.abs(r - y)}.`, `= <b>${a}</b>.`], `Check by adding back: ${a} + ${y} = ${x}.`, ``] };
      }
    }
  }
  QT.library.add('ep', [0, 1, 2, 3, 4].map((k) => [`arith-${k + 1}`, 'Mental maths', 'e', `Quick-fire arithmetic ${k + 1}`,
    `Ten sums to do in your head, as fast as you can.`,
    ARITH.slice(10 * k, 10 * k + 10).map((item) => { const p = arithPart(item); return { ...p, h: [...p.h, `Estimate the size first, so a slip stands out.`], tol: EXACT }; })]));
})();
