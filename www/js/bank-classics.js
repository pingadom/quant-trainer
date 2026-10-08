// Classic puzzles that interview-prep books and interviewers draw on, written in our own words
// with our own solutions and linked to a public reference for each. They're `kind: 'guide'`
// (practice in a common format, not a report from one firm), except where a firm report names
// the puzzle without its rules: then it's `reported`, with the standard rules stated in `note`.
// Every answer is re-derived in research/verify_results.py.
(function () {
  const R = QT.rand;
  const EXACT = { abs: 0.5, rel: 0 };
  const WIKI = (title, label = title.replace(/_/g, ' ')) => [`Wikipedia: ${label}`, `https://en.wikipedia.org/wiki/${title}`];
  const GD = (path) => `https://www.glassdoor.com/Interview/${path}`;
  const classic = (q) => ({ firm: 'common', role: 'Any', stage: 'Interview', kind: 'guide', ...q });

  QT.firms.tibra = {
    name: 'Tibra',
    process: ['Junior quant trader candidates report game-theory puzzles (the pirate vote and its extensions), dice and graph questions about expected values, and a medium dynamic-programming coding task.'],
    sources: [['Glassdoor: Tibra graduate trader', GD('Tibra-Graduate-Trader-Interview-Questions-EI_IE197452.0%2C5_KO6%2C21.htm')]],
  };

  // Ways the senior pirate can split `coins` among n pirates (0 = proposer), under the rules in the note.
  function pirates(n, coins = 100) {
    let alloc = [coins]; // one pirate keeps everything
    for (let k = 2; k <= n; k++) {
      // Buy the cheapest votes: pirates who'd get 0 in the next round take 1 coin.
      const need = Math.ceil(k / 2) - 1, next = alloc; // votes needed besides your own
      const order = next.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).slice(0, need);
      const mine = Array(k).fill(0);
      for (const [v, i] of order) mine[i + 1] = v + 1;
      mine[0] = coins - mine.reduce((s, x) => s + x, 0);
      alloc = mine;
    }
    return alloc;
  }

  QT.bank.push(
    // ---------------------------------------------------------------- reported, standard rules added
    {
      id: 'virtu-clock', firm: 'virtu', role: 'Quant Trader', stage: 'Interview', cat: 'Logic', kind: 'reported',
      src: ['Glassdoor', GD('Brainteasers-such-as-hour-and-hand-minute-100-door-and-100-people-alternatively-opening-closing-the-doors-questions-about-QTN_5604421.htm')],
      note: `Reported only as "hour hand and minute hand" brainteasers. These are the usual versions.`,
      q: `An analogue clock's hour and minute hands move continuously.`,
      parts: [
        { q: `(a) How many times do the hands point the same way in 24 hours?`, a: 22, tol: EXACT,
          sol: `The minute hand gains 360 − 30 = 330° an hour on the hour hand, so it laps it every 12/11 hours. In 24 hours that's 24 × 11/12 = 22 times (not 24: the overlap near 11 and 1 o'clock is the same one, at 12).` },
        { q: `(b) What is the angle between the hands at 3:15, in degrees?`, a: 7.5,
          sol: `The minute hand is at 90°. The hour hand has moved a quarter of the way from 3 to 4: 90 + 7.5 = 97.5°. Difference: 7.5°.` },
      ],
    },
    {
      id: 'virtu-doors', firm: 'virtu', role: 'Quant Trader', stage: 'Interview', cat: 'Logic', kind: 'reported',
      src: ['Glassdoor', GD('Brainteasers-such-as-hour-and-hand-minute-100-door-and-100-people-alternatively-opening-closing-the-doors-questions-about-QTN_5604421.htm')],
      note: `Reported by name only; this is the standard version.`,
      q: `100 doors start closed. Person 1 toggles every door, person 2 every 2nd door, person 3 every 3rd, and so on up to person 100.`,
      parts: [{ q: `How many doors are open at the end?`, a: 10, tol: EXACT,
        sol: `Door d is toggled once for each divisor of d. Divisors come in pairs (k and d/k) except when d is a perfect square, so only squares have an odd number of toggles and end open: 1, 4, 9, …, 100. Ten doors.` }],
    },
    {
      id: 'tib-pirates', firm: 'tibra', role: 'Junior Quant Trader', stage: 'Interview', cat: 'Game theory', kind: 'reported',
      src: ['Glassdoor search: quant trader', GD('quant-trader-interview-questions-SRCH_KO0%2C12.htm')],
      note: `The report doesn't give the full rules. Standard version: the most senior pirate proposes a split; everyone votes; it passes with at least half the votes (the proposer votes too); otherwise the proposer is thrown overboard and the next most senior proposes. Pirates are perfectly rational, want gold first, and given equal gold would rather throw someone overboard.`,
      q: `Five pirates of strictly ranked seniority divide 100 gold coins.`,
      parts: [
        { q: `(a) How many coins does the most senior pirate keep?`, a: pirates(5)[0], tol: EXACT,
          sol: `Work up from small numbers. Two pirates: the senior's own vote is half, so they keep all 100. Three: the senior needs one more vote and buys the pirate who'd get 0 with two left, for 1 coin: 99, 0, 1. Four: needs one more vote; the cheapest is the pirate who'd get 0 next: 99, 0, 1, 0. Five: needs two more votes; buy the two who'd get 0: <b>98</b>, 0, 1, 0, 1.` },
        { q: `(b) Follow-up (reported): with seven pirates?`, a: pirates(7)[0], tol: EXACT,
          sol: `Same pattern: the senior needs ⌈7/2⌉ − 1 = 3 extra votes and buys the three pirates who'd get nothing in the six-pirate split, for 1 coin each: 97.` },
      ],
      followups: ['What changes when there are more than 200 pirates and not enough coins to buy votes?'],
    },
    {
      id: 'akuna-st-petersburg', firm: 'akuna', role: 'Quantitative Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor: Akuna quantitative trader', 'https://www.glassdoor.com/Interview/AKUNA-CAPITAL-Quantitative-Trader-Interview-Questions-EI_IE608116.0%2C13_KO14%2C33.htm'],
      note: `Reported by name ("what would you pay for the St Petersburg lottery"); these are the standard rules.`,
      q: `A fair coin is tossed until it lands heads. If that takes k tosses you win $2<sup>k</sup>.`,
      parts: [
        { q: `(a) If the payout is capped at $2<sup>20</sup> (about $1 million, all the bank can pay), what is the game worth?`, a: 21,
          sol: `Each k ≤ 20 contributes 2<sup>k</sup> × 2<sup>−k</sup> = $1, so $20 in total. Every longer game pays the cap, 2<sup>20</sup>, with probability 2<sup>−20</sup>: $1 more. $21. Uncapped, the sum is 1 + 1 + 1 + … = ∞, which is the paradox, but no counterparty can pay infinite amounts, and a realistic cap makes it worth very little.` },
        { q: `(b) Follow-up (ours): with the cap at $2<sup>30</sup> (about $1 billion)?`, a: 31, ext: true,
          sol: `$31. A thousand times the bankroll only adds $10 of value: the "infinite" expectation lives entirely in absurdly unlikely outcomes.` },
      ],
      followups: ['Without a cap, how would risk aversion (e.g. log utility) price it? (About $4 for log utility of the prize alone.)'],
    },

    // ---------------------------------------------------------------- classics (practice)
    classic({
      id: 'cl-monty-hall', cat: 'Conditional probability', src: WIKI('Monty_Hall_problem'),
      q: `There are three doors: a car behind one, goats behind the others. You pick a door. The host, who knows where the car is, opens another door to show a goat and offers you the chance to switch.`,
      parts: [
        { q: `(a) What is your chance of winning if you switch?`, a: 2 / 3,
          sol: `Your first pick is right with probability 1/3, and the host's reveal doesn't change that (he can always show a goat). So the other closed door has the remaining 2/3. Switching wins whenever your first pick was wrong.`,
          sim: () => { const car = R.int(0, 2), pick = R.int(0, 2); return pick !== car ? 1 : 0; } },
        { q: `(b) Same game with 100 doors: the host opens 98 goat doors. Chance of winning if you switch?`, a: 99 / 100,
          sol: `Your first pick is right 1% of the time; the one door the host leaves shut has the other 99%.` },
      ],
      followups: ['What if the host opened a door at random and it happened to show a goat? (Then switching wins 1/2.)'],
    }),
    classic({
      id: 'cl-birthday', cat: 'Probability', src: WIKI('Birthday_problem'),
      q: `Ignore leap years and assume birthdays are uniform over 365 days.`,
      parts: [
        { q: `(a) What is the smallest group in which the chance of a shared birthday exceeds 1/2?`, a: 23, tol: EXACT,
          sol: `P(all different) = (365/365)(364/365)…((365 − n + 1)/365). It first drops below 1/2 at n = 23. Quick check: there are C(23, 2) = 253 pairs, each matching with probability 1/365, so roughly 1 − e<sup>−253/365</sup> ≈ 0.50.` },
        { q: `(b) What is the probability for a group of 23?`, a: 0.5072972343239854, tol: { abs: 0.005, rel: 0 },
          sol: `1 − Π<sub>k=0</sub><sup>22</sup>(365 − k)/365 ≈ 0.507.`,
          sim: () => { const seen = new Set(); for (let i = 0; i < 23; i++) { const d = R.int(1, 365); if (seen.has(d)) return 1; seen.add(d); } return 0; } },
      ],
    }),
    classic({
      id: 'cl-secretary', cat: 'Optimal stopping', src: WIKI('Secretary_problem'),
      q: `n candidates are interviewed in random order. After each one you must hire them on the spot or reject them for good, and you can only rank each against those you've already seen. You want the single best.`,
      parts: [
        { q: `(a) With n = 3, what is your best chance of hiring the best candidate?`, a: 1 / 2,
          sol: `Reject the first, then hire the first one better than everyone so far (or the last). Of the 6 orders, this wins in 3: when the best is 2nd, or when it's 3rd and the 2nd is worse than the 1st. Hiring blind wins only 1/3.` },
        { q: `(b) For large n, the best strategy (reject the first n/e, then take the next record) wins with what probability?`, a: 1 / Math.E,
          sol: `If you reject the first r and take the next record, P(win) ≈ (r/n) ln(n/r), maximised at r = n/e with value 1/e ≈ 0.368.` },
      ],
    }),
    classic({
      id: 'cl-buffon', cat: 'Probability', src: WIKI('Buffon%27s_needle_problem', "Buffon's needle problem"),
      q: `Parallel lines are drawn on the floor one needle-length apart. A needle is dropped at random.`,
      parts: [{ q: `What is the probability it crosses a line?`, a: 2 / Math.PI,
        sol: `Let x be the distance from the needle's centre to the nearest line (uniform on [0, ½]) and θ its angle (uniform on [0, π/2]). It crosses if x ≤ ½ sin θ. Averaging: P = (2/π)∫ sin θ dθ over [0, π/2] = 2/π ≈ 0.637. (This is how you can estimate π by dropping needles.)`,
        sim: () => (Math.random() * 0.5 <= 0.5 * Math.sin(Math.random() * Math.PI / 2) ? 1 : 0) }],
    }),
    classic({
      id: 'cl-derangements', cat: 'Combinatorics', src: WIKI('Derangement'),
      q: `Four people check their hats, and the hats are handed back at random.`,
      parts: [
        { q: `(a) What is the probability nobody gets their own hat back?`, a: 3 / 8,
          sol: `Inclusion–exclusion: P = 1 − 1/1! + 1/2! − 1/3! + 1/4! = 9/24 = 3/8. As n grows this tends to 1/e ≈ 0.368, and it's already close at n = 4.`,
          sim: () => (R.shuffle([0, 1, 2, 3]).every((h, i) => h !== i) ? 1 : 0) },
        { q: `(b) What is the expected number who get their own hat?`, a: 1,
          sol: `Each person gets their own hat with probability 1/4, so by linearity 4 × 1/4 = 1, for any n.` },
      ],
    }),
    classic({
      id: 'cl-ballot', cat: 'Combinatorics', src: WIKI('Bertrand%27s_ballot_theorem', "Bertrand's ballot theorem"),
      q: `Candidate A gets 6 votes and B gets 4. The votes are counted in random order.`,
      parts: [{ q: `What is the probability A is strictly ahead throughout the count?`, a: 1 / 5,
        sol: `Ballot theorem: (a − b)/(a + b) = 2/10 = 1/5. Reflection argument: A must take the first vote; any count where B ties at some point can be reflected up to that tie into a count that starts with B, so the bad orders starting with A match all orders starting with B (probability 4/10). P = 6/10 − 4/10 = 1/5.`,
        sim: () => { let d = 0; for (const v of R.shuffle([1, 1, 1, 1, 1, 1, -1, -1, -1, -1])) { d += v; if (d <= 0) return 0; } return 1; } }],
    }),
    classic({
      id: 'cl-100-prisoners', cat: 'Probability', src: WIKI('100_prisoners_problem'),
      q: `100 numbered prisoners. 100 boxes each hold one prisoner's number, shuffled. Each prisoner may open 50 boxes, alone and without communicating afterwards. All are freed only if every prisoner finds their own number. They may agree a strategy beforehand.`,
      parts: [{ q: `With the best strategy, what is the chance they all succeed?`, a: 1 - [...Array(50)].reduce((s, _, i) => s + 1 / (51 + i), 0), tol: { abs: 0.01, rel: 0 },
        sol: `Each prisoner opens the box with their own number, then the box numbered by what they found, and so on: they follow the cycle containing their number. All succeed exactly when the shuffle has no cycle longer than 50. P(some cycle of length k &gt; 50) = 1/k, and at most one such cycle can exist, so P(success) = 1 − (1/51 + … + 1/100) ≈ 1 − ln 2 ≈ 0.31. Opening at random would give (1/2)<sup>100</sup>.` }],
    }),
    classic({
      id: 'cl-first-ace', cat: 'Expected value', src: WIKI('Negative_hypergeometric_distribution'),
      q: `You turn over cards from a shuffled 52-card deck until the first ace.`,
      parts: [{ q: `What is the expected number of cards turned over, including the ace?`, a: 53 / 5,
        sol: `The 4 aces split the 48 other cards into 5 gaps of equal expected size, 48/5 = 9.6 cards each. You turn over the first gap plus the ace: 9.6 + 1 = 10.6 = 53/5.`,
        sim: () => R.shuffle([...Array(52).keys()]).findIndex((c) => c < 4) + 1 }],
    }),
    classic({
      id: 'cl-semicircle', cat: 'Probability', src: WIKI('Wendel%27s_theorem', "Wendel's theorem"),
      q: `Three points are chosen at random on a circle.`,
      parts: [{ q: `What is the probability that the triangle they form contains the centre?`, a: 1 / 4,
        sol: `It contains the centre unless all three lie in a semicircle. For each point, the chance the other two lie in the semicircle clockwise from it is (1/2)² = 1/4, and these 3 events can't overlap, so P(semicircle) = 3/4 and the answer is 1/4.`,
        sim: () => { const a = [Math.random(), Math.random(), Math.random()].sort((x, y) => x - y), g = [a[1] - a[0], a[2] - a[1], 1 - a[2] + a[0]]; return Math.max(...g) < 0.5 ? 1 : 0; } }],
      followups: ['Four points: chance the quadrilateral contains the centre? (1/2.)'],
    }),
    classic({
      id: 'cl-polya', cat: 'Markov chains', src: WIKI('P%C3%B3lya_urn_model', 'Pólya urn model'),
      q: `An urn starts with one red and one blue ball. Repeatedly draw a ball at random and put it back together with another ball of the same colour.`,
      parts: [{ q: `In the first 10 draws, what is the probability exactly 5 are red?`, a: 1 / 11,
        sol: `Any particular sequence with k reds in n draws has probability k!(n − k)!/(n + 1)!, the same for every order. Multiply by C(n, k): 1/(n + 1). So every count 0 to 10 is equally likely: 1/11. The long-run fraction of red is uniform on [0, 1].`,
        sim: () => { let r = 1, b = 1, k = 0; for (let i = 0; i < 10; i++) { if (Math.random() < r / (r + b)) { r++; k++; } else b++; } return k === 5 ? 1 : 0; } }],
    }),
    classic({
      id: 'cl-newton-pepys', cat: 'Probability', src: WIKI('Newton%E2%80%93Pepys_problem', 'Newton–Pepys problem'),
      q: `Which is most likely: at least one six with 6 dice, at least two sixes with 12 dice, or at least three sixes with 18 dice?`,
      parts: [
        { q: `(a) P(at least one six in 6 dice)?`, a: 1 - (5 / 6) ** 6, tol: { abs: 0.005, rel: 0 }, sol: `1 − (5/6)⁶ ≈ 0.665.` },
        { q: `(b) P(at least two sixes in 12 dice)?`, a: 1 - (5 / 6) ** 12 - 12 * (1 / 6) * (5 / 6) ** 11, tol: { abs: 0.005, rel: 0 },
          sol: `1 − (5/6)¹² − 12(1/6)(5/6)¹¹ ≈ 0.619. The first is most likely: the expected number of sixes is the same (1, 2, 3), but the distribution gets more spread around it, and "at least the mean" gets less likely. Isaac Newton answered this for Samuel Pepys in 1693.` },
      ],
    }),
    classic({
      id: 'cl-base-rate', cat: 'Bayes', src: WIKI('Base_rate_fallacy'),
      q: `1% of people have a condition. A test catches 99% of those who have it, but also flags 5% of those who don't. Someone tests positive.`,
      parts: [{ q: `What is the probability they have the condition?`, a: 0.0099 / (0.0099 + 0.0495),
        sol: `Out of 10,000 people: 100 have it and 99 test positive; 9,900 don't and 495 test positive. P = 99/(99 + 495) = 1/6 ≈ 0.17. The false positives swamp the true ones because the condition is rare.` }],
    }),
    classic({
      id: 'cl-trailing-zeros', cat: 'Mental maths', src: WIKI('Trailing_zero'),
      q: `Count the zeros at the end of 100! (100 factorial).`,
      parts: [{ q: `How many?`, a: 24, tol: EXACT,
        sol: `Each trailing zero needs a factor 10 = 2 × 5, and 5s are the scarce factor. Multiples of 5 up to 100 give 20; multiples of 25 give one more each, 4 more. Total 24.` }],
    }),
    classic({
      id: 'cl-uniform-sum', cat: 'Expected value', src: WIKI('E_(mathematical_constant)', 'e (mathematical constant)'),
      q: `Add independent uniform random numbers from [0, 1] until the total exceeds 1.`,
      parts: [{ q: `What is the expected number of numbers you add?`, a: Math.E,
        sol: `You need more than n numbers exactly when the first n sum to at most 1, which has probability 1/n! (the volume of a simplex). E[N] = Σ<sub>n≥0</sub> P(N &gt; n) = Σ 1/n! = e ≈ 2.718.`,
        sim: () => { let s = 0, n = 0; while (s <= 1) { s += Math.random(); n++; } return n; } }],
    }),
    classic({
      id: 'cl-egg-drop', cat: 'Logic', src: WIKI('Dynamic_programming#Egg_dropping_puzzle', 'egg dropping puzzle'),
      q: `You have two identical eggs and a 100-storey building. An egg breaks if dropped from floor f or above, for some unknown f, and survives otherwise. A broken egg can't be reused.`,
      parts: [{ q: `What is the fewest drops that guarantees finding f?`, a: 14, tol: EXACT,
        sol: `With d drops you can cover d + (d − 1) + … + 1 = d(d + 1)/2 floors: drop the first egg from floor d; if it breaks, check the d − 1 floors below one by one; if not, go up d − 1 more, and so on. You need d(d + 1)/2 ≥ 100, so d = 14 (start at floor 14, then 27, 39, …).` }],
    }),
    classic({
      id: 'cl-two-envelopes', cat: 'Decision making', src: WIKI('Two_envelopes_problem'),
      q: `Two envelopes hold money, one twice the other. You open one and see $100. "The other has $50 or $200 with equal chance, worth $125 on average, so always switch." What's wrong with this argument?`,
      open: { model: `<p>It treats "the other is double" and "the other is half" as equally likely whatever amount you see. That can't hold for every amount: no probability distribution puts equal weight on all of …, $50, $100, $200, … (the total would be infinite). Once you fix a real prior, seeing $100 does change the odds, and switching helps for some amounts and hurts for others. Before opening, the envelopes are symmetric. The fix is to name the two amounts A and 2A, rather than "X and 2X or X/2": switching gains A or loses A with equal chance, so it's worth exactly zero.</p>` },
    }),
  );
})();
