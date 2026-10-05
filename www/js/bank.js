// Interview question bank: questions candidates report being asked at specific firms,
// paraphrased in our own words and linked to where they were reported.
//
// Each entry:
//   firm     key into QT.firms ('common' = widely used format, not tied to one firm)
//   role, stage   as reported, where known
//   src      [label, url] where the question was reported
//   kind     'reported' (a candidate says it was asked) | 'guide' (prep-guide example; not verified as asked)
//   q        the question stem
//   parts    numeric sub-questions [{ q, a, tol?, sol, sim?, trials?, ext? }]; ext = our follow-up, not reported
//   open     for questions with no single number: { model: html } shown for self-grading
//   note     optional caveat shown under the question
(function () {
  const R = QT.rand;
  const EXACT = { abs: 0.5, rel: 0 };

  const GD = (path) => `https://www.glassdoor.com/Interview/${path}`;

  QT.firms = {
    js: {
      name: 'Jane Street',
      process: [
        'Official: phone interviews first, then a final round covering problem solving, probability & statistics, coding (any language), data analysis and general interests.',
        'Official: no finance knowledge or advanced maths needed. They look for a methodical approach, clear communication, correcting your own mistakes, and asking why.',
        'Candidates report a ~30-minute first technical round of probability and brainteasers, with betting and market-making rounds later.',
        'Jane Street publishes a ~23-minute mock trading interview video on its site. Watch it before any interview.',
      ],
      sources: [['Jane Street: Trading interviews (official)', 'https://www.janestreet.com/trading-interviews/'], ['Glassdoor: Jane Street trader interviews', GD('Jane-Street-Trader-Interview-Questions-EI_IE255549.0,11_KO12,18.htm')]],
    },
    sig: {
      name: 'SIG (Susquehanna)',
      process: [
        'Commonly described as 4 stages: online quant test → recruiter call with at least one probability/EV question → ~60-min technical with a senior trader (probability, Markov chains) → final round with EV games and a group board-game exercise.',
        'Strong decision-theory and poker culture: they test whether you think in expected value rather than the most likely outcome.',
      ],
      sources: [['Tradermath: SIG interview guide', 'https://www.tradermath.org/knowledge-base/sig-interview-guide'], ['Glassdoor: SIG interviews', GD('Susquehanna-International-Group-SIG-Interview-Questions-E24446.htm')]],
    },
    optiver: {
      name: 'Optiver',
      process: [
        'Online assessment reported to include the 80-in-8 mental maths test, a "Beat the Odds" probability section, Zap-N reaction/neuro games and number-sequence puzzles.',
        'Later rounds reported to include probability questions, estimation, and trading/betting games with dice, coins and cards where you look for arbitrage and size bets.',
      ],
      sources: [['Glassdoor: Optiver OA components', GD('80-in-8-80-questions-in-8-minutes-Testing-your-ability-in-math-calculation-Zap-N-9-short-neuro-assessment-games-take-QTN_6844844.htm')], ['QuantVault: Optiver process', 'https://quantvault.org/optiver-interview-process.html']],
    },
    imc: {
      name: 'IMC',
      process: [
        'Candidates report an online assessment with probability and game questions (some mention a cognitive/Neurolytics test), an HR/behavioural interview, then technical rounds.',
        'Technical rounds reported to include a market-making game (quote bid/ask, explain your spread) and probability puzzles with twists.',
      ],
      sources: [['Glassdoor: IMC interview question pages', GD('Lots-of-probability-questions-and-game-theory-mostly-things-involving-probability-of-winning-a-game-or-getting-a-certain-o-QTN_2874765.htm')], ['Glassdoor: IMC graduate quant trader', GD('IMC-Trading-Graduate-Quant-Trader-Interview-Questions-EI_IE278100.0,11_KO12,33.htm')]],
    },
    citadel: {
      name: 'Citadel / Citadel Securities',
      process: [
        'Candidates report an online assessment of probability/EV questions followed by a technical call with a trader.',
        'Expected-value questions often come with a twist (e.g. an option to reroll), and you may be asked for the variance as well as the mean.',
      ],
      sources: [['Glassdoor: Citadel quant trader', 'https://www.glassdoor.ca/Interview/Citadel-Quantitative-Trader-Interview-Questions-EI_IE14937.0,7_KO8,27.htm']],
    },
    fiverings: {
      name: 'Five Rings',
      process: [
        'Reported online assessment of about 19 maths questions where close approximations are accepted.',
        'Technical interviews are described as very probability-heavy, with an expectation that you explain exactly how you reached each answer. Game theory comes up.',
      ],
      sources: [['Glassdoor: Five Rings quant trader', GD('Five-Rings-Quantitative-Trader-Interview-Questions-EI_IE375785.0,10_KO11,30.htm')]],
    },
    twosigma: {
      name: 'Two Sigma',
      process: [
        'Quant researcher interviews reported to cover OLS assumptions and derivations, implementing regression (including streaming updates), and open-ended model-design and data-analysis cases.',
      ],
      sources: [['Glassdoor: Two Sigma quant research', GD('Two-Sigma-Quantitative-Research-Interview-Questions-EI_IE241045.0,9_KO10,31.htm')], ['Exponent: QR interview guide', 'https://www.tryexponent.com/blog/quant-researcher-interview-guide']],
    },
    flow: {
      name: 'Flow Traders',
      process: [
        'Candidates report a mental maths test with no scratch work (estimation matters), a recruiter screen with probability questions, then technical rounds with quick arithmetic and probability, including poker odds.',
      ],
      sources: [['Glassdoor: Flow Traders maths test', GD('The-math-test-although-on-paper-tests-mental-math-and-so-no-scratch-work-is-allowed-Also-make-sure-you-can-estimate-th-QTN_775004.htm')]],
    },
    maven: {
      name: 'Maven Securities',
      process: [
        'Candidates report online tests of mental maths (≈50 questions in 5 minutes), number sequences (≈30 in 6 minutes) and probability (≈18 in 30 minutes).',
        'Technical rounds reported to include brainteasers, probability and market-making games done without pen and paper.',
      ],
      sources: [['Glassdoor: Maven Securities trader', GD('Maven-Securities-Trader-Interview-Questions-EI_IE716525.0,16_KO17,23.htm')]],
    },
    wincent: {
      name: 'Wincent',
      process: [
        'Official (Quant Research/Trading internship, Bratislava): four stages. An online maths test taken at home (probability, logic and maths, low-to-medium difficulty), a 45-minute quant interview (medium problems), a 90-minute quant interview (your background plus medium-hard problems), then an on-site round in Bratislava built around betting games.',
        'Candidates describe the online test as 12 numeric-answer problems in two timed sections (6 easier, then 6 medium), proctored, with pen, paper and a basic calculator. Some also report a separate coding test (HackerRank) for intern roles.',
        'Reported interview themes: probability, Bayes, expected value and variance, combinatorics, Markov chains, and mental maths under time pressure. Several candidates say the questions feel like variants of the "Green Book" (Zhou, A Practical Guide to Quantitative Finance Interviews).',
        'Wincent is a high-frequency crypto market maker. Interns describe morning betting games and an on-site game where "the stakes kept building up", so practise bet sizing and staying calm as stakes grow.',
      ],
      sources: [
        ['Wincent: Quantitative Research Internship (official)', 'https://www.wincent.com/careers/quantitative-research-internship-quant-research-trading-starting-summer-2027/'],
        ['Wincent: Internship experience (official)', 'https://www.wincent.com/featured-insights/internship-experience/'],
        ['Glassdoor: Wincent interviews', GD('Wincent-Capital-Management-Interview-Questions-E8216941.htm')],
        ['QuantVault: Wincent online assessment', 'https://quantvault.org/wincent-capital-management-online-assessment.html'],
      ],
    },
    akuna: {
      name: 'Akuna Capital',
      process: [
        'Candidates report a timed mental maths and number-sequence assessment, then technical interviews with a trader covering probability, statistics and market making.',
        'Probability questions are often described as "Green Book" style: dice, cards and coins, and how you would bet on them.',
      ],
      sources: [['Glassdoor: Akuna quant trader interviews', GD('AKUNA-CAPITAL-Quant-Trader-Interview-Questions-EI_IE608116.0,13_KO14,26.htm')]],
    },
    davinci: {
      name: 'Da Vinci Derivatives',
      process: [
        'Candidates report a fast online assessment (one describes 20 probability questions in 12 minutes, all mental maths), then interviews mixing mental maths, probability, expected value, brainteasers and behavioural questions.',
      ],
      sources: [['Glassdoor: Da Vinci graduate trader interviews', GD('Da-Vinci-Derivatives-Graduate-Trader-Interview-Questions-EI_IE2997120.0,20_KO21,36.htm')]],
    },
    drw: {
      name: 'DRW',
      process: [
        'Candidates report an online assessment of statistics and probability, a phone screen, then a superday with behavioural and technical rounds including market-making games.',
      ],
      sources: [['Glassdoor: DRW trading intern interviews', GD('DRW-Trading-Intern-Interview-Questions-EI_IE235115.0,3_KO4,18.htm')]],
    },
    common: {
      name: 'Common formats',
      process: ['Widely used question formats from prep guides. They are not verified as asked at any one firm, but you will meet their structure everywhere.'],
      sources: [['Quantt: quant trader interview questions', 'https://www.quantt.co.uk/resources/quant-trader-interview-questions']],
    },
  };

  const d30v20 = (() => {
    let win = 0, lose = 0;
    for (let x = 1; x <= 30; x++) for (let y = 1; y <= 20; y++) (x > y ? (win += x) : (lose += y));
    return (win - lose) / 600;
  })();

  QT.bank = [
    // ---------------------------------------------------------------- Jane Street
    {
      id: 'js-reroll', firm: 'js', role: 'Trader', stage: 'Phone', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', GD('a-expected-value-of-a-die-b-suppose-you-play-a-game-where-you-get-a-dollar-amount-equivalent-to-the-number-of-dots-that-QTN_30411.htm')],
      q: `You're paid in dollars the number showing on a fair die.`,
      parts: [
        { q: `(a) What is the expected value of a single roll?`, a: 3.5, sol: `(1+…+6)/6 = 3.5.` },
        { q: `(b) After seeing your roll you may reroll once, but must keep the second result. What is the game worth under optimal play?`, a: 4.25,
          sol: `A reroll is worth 3.5, so keep 4, 5 or 6 and reroll 1–3. Value = (4+5+6)/6 + (3/6)·3.5 = 2.5 + 1.75 = 4.25.`, sim: () => { const x = R.die(); return x >= 4 ? x : R.die(); } },
        { q: `(c) Now you may reroll up to twice. What is it worth?`, a: 14 / 3,
          sol: `Work backwards. With one reroll left the game is worth 4.25, so on the first roll keep only 5 or 6: (5+6)/6 + (4/6)·4.25 = 11/6 + 17/6 = 14/3 ≈ 4.67.`,
          sim: () => { let x = R.die(); if (x >= 5) return x; x = R.die(); return x >= 4 ? x : R.die(); } },
      ],
      followups: ['What if each reroll costs $0.25?', 'How would you price it with n rerolls? What does the value converge to?'],
    },
    {
      id: 'js-d30-d20', firm: 'js', role: 'Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', GD('person-A-has-a-30-sided-and-person-B-has-a-20-sided-die-both-players-role-and-the-person-with-the-highest-role-win-on-a-d-QTN_646053.htm')],
      q: `You roll a 30-sided die; your opponent rolls a 20-sided die. The higher roll wins, and ties go to your opponent. The loser pays the winner the value of the winning roll in dollars.`,
      note: `A figure of 10.2 circulates online for this one. Computing directly from the rules as stated gives 8.15, so check it with the simulation, and in an interview confirm the rules before you start.`,
      parts: [
        { q: `What is the expected value of this game for you?`, a: d30v20,
          sol: `Condition on your roll x. If x ≤ 20 you beat x − 1 of the opponent's 20 faces; if x > 20 you beat all 20. E[winnings] = Σ x·min(x−1, 20)/600 = 7760/600 ≈ 12.93. E[payments] = Σ<sub>y≤20</sub> y·y/600 (you lose whenever your roll ≤ theirs) = 2870/600 ≈ 4.78. EV ≈ 12.93 − 4.78 = <b>8.15</b>.`,
          sim: () => { const x = R.die(30), y = R.die(20); return x > y ? x : -y; } },
      ],
      followups: ['What is your probability of winning a round?', 'How much would you pay to swap your die for a 40-sided one?'],
    },
    {
      id: 'js-d100-pay', firm: 'js', role: 'Trader', stage: 'Interview', cat: 'Optimal stopping', kind: 'reported',
      src: ['Glassdoor', GD('You-are-given-a-die-with-100-sides-One-side-has-1-dot-one-has-2-dots-and-so-on-up-until-100-You-are-given-a-chance-to-ro-QTN_688189.htm')],
      q: `A 100-sided die shows 1 to 100. After each roll you can take that many dollars, or pay $1 to roll again, as many times as you like.`,
      parts: [
        { q: `(a) What is the game worth under optimal play?`, a: 101.5 - 7 - 100 / 14, tol: { abs: 0.1, rel: 0 },
          sol: `Use a threshold strategy: stop on any of the top n faces. Each attempt stops with probability n/100, so the expected number of rolls is 100/n and you pay (100/n − 1) dollars. When you stop, the average value is (201 − n)/2. Value V(n) = (201 − n)/2 − (100/n − 1) = 101.5 − n/2 − 100/n. This is maximised near n = √200 ≈ 14.1, and n = 14 gives V ≈ <b>87.36</b>. One candidate reported being told the answer is "above 80".`,
          sim: () => { let paid = 0, x; while ((x = R.die(100)) < 87) paid++; return x - paid; } },
        { q: `(b) What is the lowest roll you should accept?`, a: 87, tol: EXACT,
          sol: `Stop on the top 14 faces, i.e. 87–100. Check: reroll whenever your roll is below V − 1 ≈ 86.4, the value of continuing after paying $1.` },
      ],
      followups: ['How does the answer scale if rerolls cost $c?'],
    },
    {
      id: 'js-d20-3d6', firm: 'js', role: 'Trader', stage: 'Interview', cat: 'Probability', kind: 'reported',
      src: ['Glassdoor', GD('Jane-Street-Trader-Interview-Questions-EI_IE255549.0,11_KO12,18.htm')],
      q: `To roll the higher number against an opponent, would you rather use one 20-sided die or the sum of three 6-sided dice (your opponent gets the other)?`,
      note: `Reported as a choice question. The numeric parts below are how you'd justify the answer.`,
      parts: [
        { q: `(a) What is the probability the 20-sided die beats 3d6 (strictly higher)?`, a: 0.475,
          sol: `Both are symmetric around the same mean, 10.5, so D − S is symmetric around 0 and P(D > S) = P(S > D). A tie happens with probability 1/20, since for any 3d6 total from 3 to 18 the d20 matches it with chance 1/20. So each side wins with (1 − 0.05)/2 = <b>0.475</b>. It's a coin flip.`,
          sim: () => (R.die(20) > R.die() + R.die() + R.die() ? 1 : 0) },
        { q: `(b) Follow-up (ours): what is the variance of the d20, and of 3d6?`, a: 33.25, ext: true,
          sol: `d20: (20² − 1)/12 = 33.25. 3d6: 3 × 35/12 = 8.75. Same mean, very different spread. If you are paid your roll, or need a high target like 18+, the choice matters even though the head-to-head is even.` },
      ],
      followups: ['What if ties are re-rolled?', 'Which would you pick if you needed at least 17?'],
    },
    {
      id: 'js-two-dice-guess', firm: 'js', role: 'Trader', stage: 'Interview', cat: 'Estimation', kind: 'reported',
      src: ['Glassdoor', GD('1-Sum-of-two-normal-dice-You-want-to-get-as-close-to-the-actual-number-as-possible-What-would-be-your-strategy-What-s-t-QTN_401147.htm')],
      q: `Two fair dice are rolled. You want to guess a number as close as possible to their sum.`,
      parts: [
        { q: `(a) What number should you guess?`, a: 7, tol: EXACT, sol: `7 is the mode, the median and the mean. For absolute error the median is optimal.` },
        { q: `(b) Follow-up (ours): what is your expected absolute error?`, a: 70 / 36, ext: true,
          sol: `E|S − 7| = 2·(1·5 + 2·4 + 3·3 + 4·2 + 5·1)/36 = 70/36 ≈ 1.94.`, sim: () => Math.abs(R.die() + R.die() - 7) },
      ],
      followups: ['What if you are penalised by squared error instead? (Still 7: the mean minimises squared error.)'],
    },

    // ---------------------------------------------------------------- SIG
    {
      id: 'sig-three-dice', firm: 'sig', role: 'Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', GD('You-roll-3-dice-If-you-get-the-same-number-you-earn-10-If-you-get-two-numbers-the-same-you-get-5-If-the-numbers-ar-QTN_3992347.htm')],
      q: `Roll three dice. All three the same: you win $10. Exactly two the same: you win $5. All different: you lose $2.`,
      parts: [
        { q: `What is your expected profit per game?`, a: 1.25,
          sol: `P(triple) = 6/216 = 1/36. P(all different) = 6·5·4/216 = 20/36. P(exactly a pair) = 1 − 21/36 = 15/36. EV = (10·1 + 5·15 − 2·20)/36 = 45/36 = <b>$1.25</b>.`,
          sim: () => { const a = R.die(), b = R.die(), c = R.die(); return a === b && b === c ? 10 : a === b || b === c || a === c ? 5 : -2; } },
      ],
      followups: ['How much would you pay to play 100 times? What is the standard deviation of your total?'],
    },
    {
      id: 'sig-painting', firm: 'sig', role: 'Trading intern', stage: 'Interview', cat: 'Decision making', kind: 'reported',
      src: ['The Wall Street Quants (reported SIG question)', 'https://thewallstreetquants.com/solution/sig/painting-value-probability-decision'],
      q: `A painting has an 80% chance of being a fake. Real, it's worth $500k; fake, $10k. The seller wants $120k.`,
      parts: [
        { q: `(a) What is the painting's expected value (in dollars)?`, a: 108000, tol: { abs: 1, rel: 0.001 },
          sol: `0.2 × 500k + 0.8 × 10k = <b>$108k</b>. That's below $120k, so on EV alone you don't buy.` },
        { q: `(b) Follow-up (ours): above what probability of it being real would you buy at $120k?`, a: 110 / 490, ext: true,
          sol: `p·500 + (1 − p)·10 = 120 ⇒ 490p = 110 ⇒ p ≈ 0.224. Your 20% estimate is close to breakeven, so ask how you could cheaply improve it (an expert, provenance) before deciding.` },
      ],
      followups: ['Would you buy it if you could resell it tomorrow for $115k with certainty to someone who believes it is real?'],
    },
    {
      id: 'sig-97-cards', firm: 'sig', role: 'Assistant Trader', stage: 'Interview', cat: 'Combinatorics', kind: 'reported',
      src: ['Glassdoor', GD('Option-pricing-question-You-have-a-deck-of-97-cards-and-I-will-pay-you-10-if-I-draw-4-cards-and-they-are-in-ascending-o-QTN_360882.htm')],
      q: `A deck has 97 distinct numbered cards. Four are drawn. If they come out in ascending order (not necessarily consecutive) you're paid $10; otherwise you pay $1.`,
      parts: [
        { q: `(a) What is the probability the four cards are in ascending order?`, a: 1 / 24,
          sol: `Any 4 distinct cards are equally likely to appear in each of their 4! = 24 orders, and exactly one is ascending. So P = 1/24, and the 97 is a distraction.`,
          sim: () => { const s = new Set(); const o = []; while (o.length < 4) { const c = R.int(1, 97); if (!s.has(c)) { s.add(c); o.push(c); } } return o[0] < o[1] && o[1] < o[2] && o[2] < o[3] ? 1 : 0; } },
        { q: `(b) What is your expected profit per game?`, a: 10 / 24 - 23 / 24,
          sol: `10·(1/24) − 1·(23/24) = −13/24 ≈ −$0.54. Don't play. The fair payout would be $23.` },
      ],
      followups: ['What payout makes this fair?', 'What if the deck had repeated numbers?'],
    },
    {
      id: 'sig-next-card', firm: 'sig', role: 'Quant Trader', stage: 'Interview', cat: 'Probability', kind: 'reported',
      src: ['Glassdoor', GD('Susquehanna-International-Group-SIG-Quantitative-Trader-Interview-Questions-EI_IE24446.0,35_KO36,55.htm')],
      q: `A card is drawn from a shuffled deck. You bet on whether the next card will be strictly higher in rank.`,
      note: `As reported, the question continues into bet sizing. The key insight is that the right bet depends on the card you see.`,
      parts: [
        { q: `(a) Before seeing the first card, what is P(next card is strictly higher)?`, a: 8 / 17,
          sol: `P(same rank) = 3/51. By symmetry, "higher" and "lower" split the rest equally: (1 − 3/51)/2 = 24/51 = 8/17 ≈ 0.47.`,
          sim: () => { const a = R.int(0, 51); let b; do { b = R.int(0, 51); } while (b === a); return (b % 13) > (a % 13) ? 1 : 0; } },
        { q: `(b) Follow-up (ours): the first card is a 5 (ranks 2…A). What is P(next is higher)?`, a: 36 / 51, ext: true,
          sol: `Ranks above 5: 6–A is 9 ranks × 4 = 36 cards out of 51 remaining, so ≈ 0.71. After a 5 you bet big; after a jack you bet the other way or not at all.` },
      ],
      followups: ['How much of a $100 bankroll would you bet after seeing a 5 at even odds? (Kelly: 2p − 1.)'],
    },
    {
      id: 'sig-two-rolls', firm: 'sig', role: 'Junior Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', GD('Questions-about-dice-rolling-Can-roll-die-max-2-times-and-get-whatever-value-is-on-the-die-on-your-last-roll-be-it-first-QTN_18212.htm')],
      q: `You may roll a die up to twice and are paid the value of your last roll.`,
      parts: [{ q: `What is the expected value?`, a: 4.25, sol: `Keep 4–6 (above the 3.5 value of rerolling): 15/6 + (1/2)(3.5) = 4.25. The same structure was reported at Jane Street, so expect it.` }],
      followups: ['How much would you pay for a third roll?'],
    },

    // ---------------------------------------------------------------- Optiver
    {
      id: 'opt-tennis', firm: 'optiver', role: 'Quantitative Trader', stage: 'Technical', cat: 'Markov chains', kind: 'reported',
      src: ['Glassdoor (Nov 2018)', 'https://www.glassdoor.sg/Interview/Optiver-Interview-E243355-RVW23639027.htm'],
      q: `In a tennis game you're tied at 30–30. You win each point with probability 0.6.`,
      parts: [
        { q: `(a) What is your probability of winning the game?`, a: 0.36 / 0.52,
          sol: `Key insight: 30–30 is strategically identical to deuce, since you need two points in a row to win. From deuce, P(win) = p²/(p² + q²) = 0.36/0.52 ≈ <b>0.692</b> (win–win; or split and return to deuce).`,
          sim: () => { let d = 0; for (;;) { d += Math.random() < 0.6 ? 1 : -1; if (d === 2) return 1; if (d === -2) return 0; } } },
        { q: `(b) Now p = 0.9. What is your probability of winning?`, a: 0.81 / 0.82,
          sol: `0.81/(0.81 + 0.01) ≈ 0.988. Deuce amplifies the better player's edge.` },
      ],
      followups: ['What is the expected number of points played from 30–30?'],
    },
    {
      id: 'opt-increasing', firm: 'optiver', role: 'Quantitative Trading Intern', stage: 'Interview', cat: 'Combinatorics', kind: 'reported',
      src: ['Glassdoor', 'https://www.glassdoor.com/Interview/Optiver-Quantitative-Trading-Intern-Interview-Questions-EI_IE243355.0,7_KO8,35.htm'],
      q: `You roll three dice at once and read them left to right.`,
      parts: [{ q: `What is the probability the three numbers are strictly increasing?`, a: 20 / 216,
        sol: `Choose 3 distinct values, C(6,3) = 20 ways, and each has exactly one increasing arrangement. P = 20/216 = 5/54 ≈ 0.093.`,
        sim: () => { const a = R.die(), b = R.die(), c = R.die(); return a < b && b < c ? 1 : 0; } }],
      followups: ['Non-decreasing instead? (C(8,3) = 56 multisets → 56/216.)'],
    },

    // ---------------------------------------------------------------- IMC
    {
      id: 'imc-bankrupt', firm: 'imc', role: 'Trader', stage: 'Online assessment', cat: 'Random walks', kind: 'reported',
      src: ['Glassdoor', GD('Lots-of-probability-questions-and-game-theory-mostly-things-involving-probability-of-winning-a-game-or-getting-a-certain-o-QTN_2874765.htm')],
      q: `Player A has $1 and player B has $2. They play rounds for $1 each; A wins any round with probability 2/3. They play until one player is broke.`,
      parts: [{ q: `What is the probability that A wins everything?`, a: 4 / 7,
        sol: `Gambler's ruin with i = 1, N = 3 and r = q/p = 1/2: P = (1 − r)/(1 − r³) = (1/2)/(7/8) = <b>4/7</b>. Or directly: A must win the first round (2/3), then from $2 either wins again or drops back to $1: P₂ = 2/3 + (1/3)P₁, P₁ = (2/3)P₂ ⇒ P₁ = 4/7.`,
        sim: () => { let a = 1; while (a > 0 && a < 3) a += Math.random() < 2 / 3 ? 1 : -1; return a === 3 ? 1 : 0; } }],
      followups: ['Expected number of rounds?'],
    },
    {
      id: 'imc-higher-die', firm: 'imc', role: 'Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', 'https://www.glassdoor.ie/Interview/IMC-Trading-Interview-Questions-E278100.htm'],
      q: `Two dice are rolled.`,
      parts: [{ q: `What is the expected value of the higher of the two?`, a: 161 / 36,
        sol: `P(max ≤ m) = (m/6)², so P(max = m) = (2m − 1)/36. E = Σ m(2m − 1)/36 = 161/36 ≈ 4.47.`,
        sim: () => Math.max(R.die(), R.die()) }],
      followups: ['And the lower? (By symmetry, 7 − 4.47 = 2.53.)'],
    },
    {
      id: 'imc-odd', firm: 'imc', role: 'Graduate Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', 'https://www.glassdoor.com/Interview/IMC-Trading-Graduate-Quant-Trader-Interview-Questions-EI_IE278100.0,11_KO12,33.htm'],
      q: `You roll a die repeatedly.`,
      parts: [{ q: `What is the expected number of rolls until you see an odd number?`, a: 2,
        sol: `Geometric with p = 1/2: E = 1/p = 2. It's a warm-up, so expect a harder follow-up straight after.` }],
      followups: ['Expected rolls until you have seen all three odd faces? (Each new one takes 6/3, then 6/2, then 6/1 rolls on average: 2 + 3 + 6 = 11.)'],
    },

    // ---------------------------------------------------------------- Citadel
    {
      id: 'cit-cubed', firm: 'citadel', role: 'Quantitative Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor', GD('expected-value-of-dice-roll-cubed-QTN_6073364.htm')],
      q: `A fair die is rolled and you receive the cube of the result.`,
      parts: [
        { q: `What is the expected value?`, a: 441 / 6, sol: `(1 + 8 + 27 + 64 + 125 + 216)/6 = 441/6 = 73.5. Shortcut: Σk³ = (Σk)² = 21² = 441.`, sim: () => R.die() ** 3 },
        { q: `Follow-up (ours): what is (E[X])³, and why is it smaller?`, a: 42.875, ext: true, sol: `3.5³ = 42.875. Cubing is convex on positive numbers, so by Jensen's inequality E[X³] ≥ (E[X])³. The same idea explains why options are worth more with more volatility.` },
      ],
      followups: ['What is the variance of the payout?'],
    },

    // ---------------------------------------------------------------- Five Rings
    {
      id: 'fr-poker', firm: 'fiverings', role: 'Quantitative Trader', stage: 'Technical', cat: 'Game theory', kind: 'reported',
      src: ['Glassdoor', 'https://www.glassdoor.com/Interview/Five-Rings-Interview-E375785-RVW100931449.htm'],
      q: `A two-card poker game: you're dealt an ace or a queen at random, and only you see it. Each player has put $1 in the pot. You may raise $1 or check (checking goes straight to showdown, where the ace wins). If you raise, your opponent can call $1 or fold. Your opponent knows your strategy.`,
      note: `The reported wording is ambiguous about the deal. This is the standard version of the game it describes, the classic bluffing model.`,
      parts: [
        { q: `(a) With an ace you always raise. With a queen, what bluffing frequency q makes your opponent indifferent between calling and folding?`, a: 1 / 3,
          sol: `Facing a raise, calling wins $2 if you're bluffing and loses $2 against an ace; folding loses $1. Indifference: 2·q/(1+q) − 2·1/(1+q) = −1 ⇒ 3q = 1 ⇒ <b>q = 1/3</b>.` },
        { q: `(b) How often should your opponent call to make your bluff break even?`, a: 2 / 3,
          sol: `Bluffing: +1 if they fold, −2 if they call; checking a queen loses 1. (1 − c) − 2c = −1 ⇒ c = 2/3.` },
        { q: `(c) What is the game worth to you per hand?`, a: 1 / 3,
          sol: `Ace: raise, called 2/3 of the time (+2) and folded 1/3 (+1): 5/3. Queen: −1 (indifferent between bluffing and checking). Average: (5/3 − 1)/2 = 1/3 dollar per hand. Information plus correctly mixed bluffing is worth money.` },
      ],
      followups: ['What changes if the raise size is $2?'],
    },

    // ---------------------------------------------------------------- Two Sigma
    {
      id: 'ts-ols-stream', firm: 'twosigma', role: 'Quantitative Researcher', stage: 'Online assessment', cat: 'Regression', kind: 'reported',
      src: ['Medium: interview questions from Two Sigma', 'https://medium.com/@tzjy/interview-questions-from-two-sigma-9f810888743c'],
      q: `Implement linear regression <i>without an intercept</i>, y ≈ βx: first on a batch of data, then on streaming data where points arrive one at a time.`,
      parts: [
        { q: `Practice (ours): for the points (1, 2), (2, 3), (3, 7), what is β?`, a: 29 / 14, ext: true,
          sol: `Through the origin: β = Σxy / Σx² = (2 + 6 + 21)/(1 + 4 + 9) = 29/14 ≈ 2.07. For streaming, keep running sums Sxy and Sxx, update them per point in O(1) time and memory, and report β = Sxy/Sxx. With an intercept you also track n, Σx and Σy.` },
      ],
      followups: ['How would you make it numerically stable?', 'How would you down-weight old data (exponential forgetting)?', 'What goes wrong if x is nearly constant?'],
    },
    {
      id: 'ts-rent', firm: 'twosigma', role: 'Quantitative Researcher', stage: 'Final round', cat: 'Model design', kind: 'reported',
      src: ['Exponent: QR interview guide', 'https://www.tryexponent.com/blog/quant-researcher-interview-guide'],
      q: `Design a model to predict rent prices in Manhattan.`,
      open: { model: `<ul>
        <li><b>Clarify the target:</b> monthly asking rent or achieved rent? Per unit or per square foot? Forecast horizon?</li>
        <li><b>Data:</b> listings (size, bedrooms, floor, amenities, building age), location (neighbourhood, subway distance), time (seasonality, rate environment).</li>
        <li><b>Baseline first:</b> a regression of log(rent) on log(sq ft) plus neighbourhood fixed effects. Explain why logs help (multiplicative effects, skew).</li>
        <li><b>Then:</b> gradient-boosted trees for interactions; spatial features.</li>
        <li><b>Validation:</b> split by time (not randomly) to avoid leakage; check errors by neighbourhood and price band; watch for survivorship (listed ≠ rented).</li>
        <li><b>Say what you'd monitor</b> after deployment, and when the model would fail (regime shifts, new developments).</li></ul>` },
      followups: ['How would you detect overfitting?', 'Which single feature do you expect to matter most, and how would you check?'],
    },

    // ---------------------------------------------------------------- Flow Traders
    {
      id: 'flow-poker', firm: 'flow', role: 'Trader Intern', stage: 'Technical', cat: 'Probability', kind: 'reported',
      src: ['Glassdoor', 'https://www.glassdoor.com.au/Interview/Flow-Traders-Interview-Questions-E258344.htm'],
      q: `Reported: "what is the probability of winning a Texas Hold'em hand post-flop?" Here is a concrete version you should be able to do in your head.`,
      parts: [
        { q: `Practice (ours): after the flop you hold a flush draw (9 outs among 47 unseen cards). What is the probability of completing it by the river (two more cards)?`, a: 1 - (38 / 47) * (37 / 46), ext: true,
          sol: `P(miss both) = (38/47)(37/46) ≈ 0.650, so P(hit) ≈ <b>0.35</b>. The "rule of 4" (outs × 4 ≈ 36%) gets you there instantly, and interviewers like seeing a quick approximation checked against the exact answer.`,
          sim: () => { const a = R.int(0, 46); let b; do { b = R.int(0, 46); } while (b === a); return a < 9 || b < 9 ? 1 : 0; } },
      ],
      followups: ['With 9 outs and one card to come? (≈ 9/46 ≈ 0.196; rule of 2 gives 18%.)'],
    },

    // ---------------------------------------------------------------- Wincent
    {
      id: 'wc-deuce', firm: 'wincent', role: 'Quant researcher', stage: 'Interview', cat: 'Probability', kind: 'reported',
      src: ['Glassdoor: Wincent interviews', GD('Wincent-Capital-Management-Interview-Questions-E8216941.htm')],
      q: `Table tennis: the score is 10–10, so you need to win by two points. You win each point with probability 40%, independently.`,
      parts: [
        { q: `(a) What is the probability that you win the game?`, a: 4 / 13,
          sol: `Look at points in pairs. Win both (0.4² = 0.16): you win. Lose both (0.6² = 0.36): you lose. Split them (0.48): you're back at deuce. Only the deciding pairs matter, so P(win) = 0.16 / (0.16 + 0.36) = 16/52 = <b>4/13 ≈ 0.308</b>.`,
          sim: () => { let lead = 0; while (Math.abs(lead) < 2) lead += Math.random() < 0.4 ? 1 : -1; return lead > 0 ? 1 : 0; } },
        { q: `(b) Follow-up (ours): how many more points are played, on average?`, a: 2 / 0.52, ext: true,
          sol: `Each pair of points ends the game with probability 0.52, so the number of pairs is geometric with mean 1/0.52. Points = 2/0.52 = <b>≈ 3.85</b>.`,
          sim: () => { let lead = 0, n = 0; while (Math.abs(lead) < 2) { lead += Math.random() < 0.4 ? 1 : -1; n++; } return n; } },
      ],
      followups: ['What if you win each point on your own serve with probability 0.5 and on theirs with 0.3, alternating serves every point?', 'At what point-win probability is your chance of winning from deuce exactly 1/3?'],
    },
    {
      id: 'wc-threes', firm: 'wincent', role: 'Quant trading intern', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor: Wincent interviews', GD('Wincent-Capital-Management-Interview-Questions-E8216941.htm')],
      note: `A candidate reports being asked "a very tricky variant" of the game of Threes from Matthew Conroy's <i>A Collection of Dice Problems</i> (problem 56). The variant itself isn't public, so practise the original until the backward-induction method is automatic.`,
      q: `Threes: roll five dice. Threes count as zero; other faces count at face value; you want the lowest total. After each roll you must keep at least one die (kept dice add to your score) and re-roll the rest. Play optimally.`,
      parts: [
        { q: `(a) With one die left to roll, what is your expected score from it?`, a: 3,
          sol: `(1 + 2 + 0 + 4 + 5 + 6)/6 = 18/6 = <b>3</b>.` },
        { q: `(b) With two dice left, what is your expected score under optimal play?`, a: 79 / 18,
          sol: `You must keep the lower die. Keep the other one too if it beats re-rolling, whose expected value is 3: keep it if it shows 0 (a three), 1 or 2. Averaging min + min(other, 3) over all 36 rolls gives 158/36 = <b>79/18 ≈ 4.389</b>.` },
        { q: `(c) Follow-up (from Conroy's solution): the expected score of the full five-dice game under optimal play?`, a: 504205555 / 80621568, tol: { abs: 0.005, rel: 0 }, ext: true,
          sol: `Work backwards: E₁ = 3, E₂ = 79/18 ≈ 4.389, E₃ ≈ 5.234, E₄ ≈ 5.834. With n dice, keep the lowest and then choose how many more of the next-lowest to keep by comparing their sum with the value of re-rolling the rest. This gives E₅ ≈ <b>6.254</b>. Note the surprise in the three-dice strategy: a 2 is worth keeping next to another 2, but not next to a 4.` },
      ],
      followups: ['Why must the optimal strategy keep the lowest dice first?', 'How does the answer change if you may keep zero dice on a roll (but still at most five rolls)?'],
    },
    {
      id: 'wc-cube-walk', firm: 'wincent', role: 'Quant (online test topic)', stage: 'Online test', cat: 'Markov chains', kind: 'guide',
      src: ['QuantVault: Wincent online assessment (lists "Random Walk on a Cube")', 'https://quantvault.org/wincent-capital-management-online-assessment.html'],
      note: `Practice on a topic a prep site lists for Wincent's online test. The wording is ours, not a reported question.`,
      q: `A bug walks on the corners of a cube. Each second it moves along one of the three edges from its corner, chosen at random.`,
      parts: [
        { q: `(a) Expected number of moves to reach the opposite corner?`, a: 10,
          sol: `Group corners by distance from the target (3, 2, 1, 0). From 3 you always go to 2; from 2 you go to 1 with probability 2/3 or back to 3 with 1/3; from 1 you finish with probability 1/3, else back to 2. Solve h₃ = 1 + h₂, h₂ = 1 + ⅔h₁ + ⅓h₃, h₁ = 1 + ⅔h₂: h₁ = 7, h₂ = 9, h₃ = <b>10</b>.`,
          sim: () => { let x = 0, n = 0; while (x !== 7) { x ^= 1 << Math.floor(Math.random() * 3); n++; } return n; } },
        { q: `(b) Expected number of moves to return to the starting corner?`, a: 8,
          sol: `The walk is symmetric, so in the long run it spends 1/8 of its time at each corner; the expected return time is 1/(1/8) = <b>8</b>.` },
      ],
      followups: ['What about a random walk on the 16 corners of a 4-dimensional cube to the opposite corner?'],
    },
    {
      id: 'wc-branching', firm: 'wincent', role: 'Quant (online test topic)', stage: 'Online test', cat: 'Probability', kind: 'guide',
      src: ['QuantVault: Wincent online assessment (lists branching-process extinction)', 'https://quantvault.org/wincent-capital-management-online-assessment.html'],
      note: `Practice on a topic a prep site lists for Wincent's online test. The wording is ours.`,
      q: `A cell, each minute, dies with probability 1/4, stays a single cell with probability 1/4, or splits into two with probability 1/2. Every cell behaves independently. You start with one cell.`,
      parts: [
        { q: `What is the probability that the population eventually dies out?`, a: 0.5,
          sol: `Let q be the extinction probability. Condition on the first minute: q = ¼ + ¼q + ½q² (two cells must both die out: q²). So 2q² − 3q + 1 = 0, giving q = 1 or q = ½. The mean number of offspring is 1.25 > 1, so extinction is not certain and q = <b>½</b>.`,
          sim: () => { let n = 1; for (let t = 0; t < 200 && n > 0 && n < 60; t++) { let m = 0; for (let i = 0; i < n; i++) { const u = Math.random(); m += u < 0.25 ? 0 : u < 0.5 ? 1 : 2; } n = m; } return n === 0 ? 1 : 0; }, trials: 20000 },
      ],
      followups: ['What is the expected population after 3 minutes? (1.25³)'],
    },
    {
      id: 'wc-ants', firm: 'wincent', role: 'Quant (online test topic)', stage: 'Online test', cat: 'Probability', kind: 'guide',
      src: ['QuantVault: Wincent online assessment (lists "100 Ants on a String")', 'https://quantvault.org/wincent-capital-management-online-assessment.html'],
      note: `Our version of a classic, on a topic a prep site lists for Wincent's online test.`,
      q: `100 ants are dropped at uniformly random points on a 1-metre string, each facing left or right at random, walking at 1 cm/s. When two ants meet, both turn around. Ants fall off at the ends.`,
      parts: [
        { q: `What is the expected time, in seconds, until the last ant falls off?`, a: 10000 / 101,
          sol: `Two ants bouncing off each other look exactly like two ants passing through each other (only the labels swap). So each "ghost" ant walks straight off: its time is the distance to the end it faces, uniform on 0–100 s. The last one falls at the maximum of 100 independent U(0, 100): E = 100 × 100/101 = <b>≈ 99.0 s</b>.`,
          sim: () => { let m = 0; for (let i = 0; i < 100; i++) m = Math.max(m, Math.random() * 100); return m; }, trials: 20000 },
      ],
      followups: ['What is the expected number of collisions?', 'Which ant falls off last, and does it depend on the directions?'],
    },
    {
      id: 'wc-bayes-trader', firm: 'wincent', role: 'Quant (interview topic)', stage: 'Interview', cat: 'Bayes', kind: 'guide',
      src: ['Glassdoor: Wincent interviews (Bayesian statistics reported as a theme)', GD('Wincent-Capital-Management-Interview-Questions-E8216941.htm')],
      note: `Our question on a theme candidates report from Wincent interviews (Bayesian updating).`,
      q: `20% of traders are skilled. A skilled trader makes money on a given day with probability 70%, an unskilled one with probability 50%. A trader made money on each of their first 3 days.`,
      parts: [
        { q: `What is the probability that they are skilled?`, a: 343 / 843,
          sol: `Prior odds 0.2 : 0.8 = 1 : 4. Likelihood ratio (0.7/0.5)³ = 2.744. Posterior odds 2.744 : 4, so P = 2.744/6.744 = 343/843 ≈ <b>0.407</b>. Three good days only double the prior.`,
          sim: () => { const skilled = Math.random() < 0.2, p = skilled ? 0.7 : 0.5; if (!(Math.random() < p && Math.random() < p && Math.random() < p)) return null; return skilled ? 1 : 0; } },
      ],
      followups: ['How many winning days in a row before you are 90% sure they are skilled?'],
    },
    {
      id: 'wc-kelly-coin', firm: 'wincent', role: 'Quant trading (on-site betting games)', stage: 'On-site', cat: 'Bet sizing', kind: 'guide',
      src: ['Wincent: Internship experience (betting games where stakes build up)', 'https://www.wincent.com/featured-insights/internship-experience/'],
      note: `Wincent's on-site round is built around betting games. This is our warm-up for that format, not a reported game.`,
      q: `You may bet any fraction of your bankroll, again and again, at even money on a coin that lands heads 60% of the time.`,
      parts: [
        { q: `(a) What fraction of your bankroll should you bet each time to maximise long-run growth?`, a: 0.2,
          sol: `Kelly: f* = p − q/b = 0.6 − 0.4/1 = <b>20%</b>.` },
        { q: `(b) What is the expected log-growth per bet at that fraction?`, a: 0.6 * Math.log(1.2) + 0.4 * Math.log(0.8), tol: { abs: 0.0005, rel: 0 },
          sol: `0.6·ln 1.2 + 0.4·ln 0.8 = 0.6 × 0.1823 − 0.4 × 0.2231 ≈ <b>0.0201</b>, about 2% a bet. Bet 40% (twice Kelly) and growth falls to about −0.0024 (0.6·ln 1.4 + 0.4·ln 0.6): favourable bets, shrinking bankroll.` },
      ],
      followups: ['The stakes double every round but the coin is the same. Does your fraction change?', 'You are only 80% sure the coin is 60/40 (otherwise it is fair). What fraction now?'],
    },

    // ---------------------------------------------------------------- More reported questions (October 2026)
    {
      id: 'opt-all-faces', firm: 'optiver', role: 'Trading intern', stage: 'Interview', cat: 'Probability', kind: 'reported',
      src: ['Glassdoor: Optiver intern interviews', GD('Optiver-Intern-Interview-Questions-EI_IE243355.0,7_KO8,14.htm')],
      q: `You roll a fair die six times.`,
      parts: [
        { q: `(a) What is the probability that every number 1–6 appears exactly once?`, a: 5 / 324,
          sol: `Favourable sequences: 6! = 720. All sequences: 6⁶ = 46,656. P = 720/46,656 = <b>5/324 ≈ 0.0154</b>.`,
          sim: () => new Set([R.die(), R.die(), R.die(), R.die(), R.die(), R.die()]).size === 6 ? 1 : 0 },
        { q: `(b) Follow-up (ours): on average, how many rolls until you have seen every face?`, a: 14.7, ext: true,
          sol: `Coupon collector: after k faces seen, the wait for a new one is geometric with mean 6/(6 − k). Sum: 6(1 + ½ + ⅓ + ¼ + ⅕ + ⅙) = <b>14.7</b>.`,
          sim: () => { const s = new Set(); let n = 0; while (s.size < 6) { s.add(R.die()); n++; } return n; } },
      ],
      followups: ['How likely is it that you need more than 20 rolls?'],
    },
    {
      id: 'opt-three-cards', firm: 'optiver', role: 'Trader', stage: 'Interview', cat: 'Optimal stopping', kind: 'reported',
      src: ['Glassdoor: Optiver interview question', GD('You-have-3-cards-each-labeled-n-n-1-n-2-and-you-don-t-know-n-The-rules-of-the-game-All-cards-start-face-down-You-flip-QTN_1848772.htm')],
      q: `Three face-down cards show n, n + 1 and n + 2, in random order, and you don't know n. Turn one over: keep it, or turn another. Keep that, or take the last card. You win the value of the card you keep.`,
      parts: [
        { q: `Under the best strategy, how much more than n do you win on average?`, a: 4 / 3,
          sol: `The first card tells you nothing (n is unknown), so always look at a second. Then compare: if the second is higher, keep it (it is the top card or the middle card, equally likely, worth n + 1.5 on average, while the last card would be worth n + 1). If it is lower, take the last card. Over the 6 orders this wins 1, 2, 2, 2, 1, 0 above n: average <b>4/3</b>, against 1 for keeping the first card.` },
      ],
      followups: ['With four cards n … n + 3?', 'Now you are told n is 0, 10 or 20, equally likely. Does the strategy change?'],
    },
    {
      id: 'imc-b-wins', firm: 'imc', role: 'Graduate quant researcher', stage: 'Interview', cat: 'Conditional probability', kind: 'reported',
      src: ['Glassdoor: IMC interviews', GD('IMC-Trading-Interview-Questions-E278100.htm')],
      q: `A and B take turns flipping a fair coin, A first. Whoever flips the first head wins.`,
      parts: [
        { q: `(a) What is the probability that B wins?`, a: 1 / 3,
          sol: `If A flips tails (½), B is in A's position. So P(B) = ½ · P(A) and P(A) + P(B) = 1, giving P(B) = <b>1/3</b>.`,
          sim: () => { for (let t = 0; ; t++) if (Math.random() < 0.5) return t % 2; } },
        { q: `(b) Given that B won, what is the probability B won on their first flip?`, a: 3 / 4,
          sol: `P(B wins on the first flip) = P(T, H) = 1/4. Divide by P(B wins) = 1/3: <b>3/4</b>.`,
          sim: () => { for (let t = 0; ; t++) if (Math.random() < 0.5) return t % 2 ? (t === 1 ? 1 : 0) : null; } },
      ],
      followups: ['What if the coin lands heads with probability p?'],
    },
    {
      id: 'imc-walk', firm: 'imc', role: 'Quantitative analyst', stage: 'Interview', cat: 'Random walks', kind: 'reported',
      src: ['Glassdoor: IMC interviews', GD('IMC-Trading-Interview-Questions-E278100.htm')],
      q: `You start at 0. Each fair coin flip moves you up 1 (heads) or down 1 (tails).`,
      parts: [
        { q: `(a) What is the probability you reach −100 before +50?`, a: 1 / 3,
          sol: `Your position is a martingale, so its expected value when you stop is 0: −100·P + 50·(1 − P) = 0, giving P = 50/150 = <b>1/3</b>. The closer barrier is twice as likely.` },
        { q: `(b) Follow-up (ours): how many flips does it take on average?`, a: 5000, ext: true,
          sol: `For a fair walk between barriers at distances a and b, the expected time is a·b = 100 × 50 = <b>5,000</b> (X² − n is also a martingale).` },
      ],
      followups: ['What if the coin is 51% heads?'],
    },
    {
      id: 'akuna-fair-coin', firm: 'akuna', role: 'Quant trader', stage: 'Interview', cat: 'Probability', kind: 'reported',
      src: ['Glassdoor: Akuna quant trader interviews', GD('AKUNA-CAPITAL-Quant-Trader-Interview-Questions-EI_IE608116.0,13_KO14,26.htm')],
      q: `You have a coin that lands heads 70% of the time. How can you use it to make a fair 50/50 decision?`,
      parts: [
        { q: `Using the standard method (flip twice; HT means A, TH means B, otherwise flip twice again), how many flips do you need on average?`, a: 1 / 0.21,
          sol: `HT and TH each have probability 0.7 × 0.3 = 0.21, so the method is fair. A pair decides with probability 0.42, so the number of pairs is geometric with mean 1/0.42, and flips = 2/0.42 = <b>≈ 4.76</b>.`,
          sim: () => { let n = 0; for (;;) { const a = Math.random() < 0.7, b = Math.random() < 0.7; n += 2; if (a !== b) return n; } } },
      ],
      followups: ['Can you do better on average by reusing the HH and TT outcomes?'],
    },
    {
      id: 'dv-outliers', firm: 'davinci', role: 'Graduate trader', stage: 'Online test', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor: Da Vinci graduate trader interviews', GD('Da-Vinci-Derivatives-Graduate-Trader-Interview-Questions-EI_IE2997120.0,20_KO21,36.htm')],
      q: `A dataset has 102 samples, 7 of which are outliers. You pick samples at random without replacement.`,
      parts: [
        { q: `On average, how many samples do you pick until you find the third outlier?`, a: 309 / 8,
          sol: `The 7 outliers split the 95 normal samples into 8 gaps, each holding 95/8 on average by symmetry. The third outlier comes after 3 gaps and 3 outliers: 3 × 95/8 + 3 = 3 × 103/8 = <b>38.625</b>. In general the k-th of K special items among N sits at k(N + 1)/(K + 1).`,
          sim: () => { const a = R.shuffle([...Array(102).keys()]); let seen = 0; for (let i = 0; i < 102; i++) if (a[i] < 7 && ++seen === 3) return i + 1; return null; } },
      ],
      followups: ['And until the last outlier?'],
    },
    {
      id: 'drw-ht-product', firm: 'drw', role: 'Trading intern', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor: DRW trading intern interviews', GD('DRW-Trading-Intern-Interview-Questions-EI_IE235115.0,3_KO4,18.htm')],
      q: `You flip a fair coin 100 times.`,
      parts: [
        { q: `What is the expected value of (number of heads) × (number of tails)?`, a: 2475,
          sol: `With H heads, E[H(100 − H)] = 100·E[H] − E[H²]. E[H] = 50 and E[H²] = Var + mean² = 25 + 2,500. So 5,000 − 2,525 = <b>2,475</b>, a little below 50 × 50 because of the spread.`,
          sim: () => { let h = 0; for (let i = 0; i < 100; i++) h += Math.random() < 0.5; return h * (100 - h); } },
      ],
      followups: ['What is P(H × T = 2,500)?'],
    },
    {
      id: 'js-four-coins', firm: 'js', role: 'Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported',
      src: ['Glassdoor: Jane Street interview question', GD('There-are-four-coins-For-each-heads-you-get-you-get-1-You-can-also-re-flip-one-coin-after-the-initial-four-flips-Wh-QTN_973092.htm')],
      q: `Flip four fair coins and get $1 for each head. After seeing them, you may re-flip one coin.`,
      parts: [
        { q: `What is the most you would pay to play?`, a: 79 / 32,
          sol: `Without the re-flip: $2. Re-flip a tail whenever you have one (probability 15/16), gaining $0.50 on average. Total 2 + 15/32 = <b>$2.469</b>.`,
          sim: () => { let h = 0; for (let i = 0; i < 4; i++) h += Math.random() < 0.5; return h + (h < 4 && Math.random() < 0.5 ? 1 : 0); } },
      ],
      followups: ['What if you can re-flip every tail once?', 'What if the re-flip costs $0.40?'],
    },

    // ---------------------------------------------------------------- Common formats
    {
      id: 'mm-geo', firm: 'common', role: 'Any trading role', stage: 'Market making', cat: 'Market making', kind: 'guide',
      src: ['Quantt: quant trader interview questions', 'https://www.quantt.co.uk/resources/quant-trader-interview-questions'],
      q: `"I flip a fair coin until it lands heads and pay you the number of flips. Make me a market."`,
      parts: [
        { q: `What fair value should your market be centred on?`, a: 2, sol: `Geometric with p = ½, so E = 2. A sensible first market is something like 1.5 @ 2.5. Say it out loud, then adjust when the interviewer trades against you.` },
        { q: `Follow-up (ours): what is the standard deviation of the payout? (This guides your spread width.)`, a: Math.sqrt(2), ext: true, sol: `Var = (1 − p)/p² = 2, so SD ≈ 1.41. With a wide distribution and a counterparty who may know more, a spread of about ±0.5 is reasonable.` },
      ],
      followups: ['The interviewer buys at your offer three times. What do you do? (Raise your market; they may know something.)'],
    },
    {
      id: 'mm-median5', firm: 'common', role: 'Any trading role', stage: 'Market making', cat: 'Market making', kind: 'guide',
      src: ['Quantt: quant trader interview questions', 'https://www.quantt.co.uk/resources/quant-trader-interview-questions'],
      q: `"I roll five dice and pay you the <b>median</b>. Make me a market."`,
      parts: [{ q: `Where should the market be centred?`, a: 3.5, sol: `By symmetry (face k ↔ 7 − k) the median's distribution is symmetric around 3.5, so E = 3.5. The median is more concentrated than a single die, so you can quote tighter than for one die.`,
        sim: () => { const d = [R.die(), R.die(), R.die(), R.die(), R.die()].sort((a, b) => a - b); return d[2]; } }],
      followups: ['What is P(median = 1)?'],
    },
    {
      id: 'opt-parity-rates', firm: 'common', role: 'Options trader', stage: 'Technical', cat: 'Options', kind: 'guide',
      src: ['Quantt: quant trader interview questions', 'https://www.quantt.co.uk/resources/quant-trader-interview-questions'],
      q: `A stock is at $100. The 1-year at-the-money call is worth $10. Rates are 5% (continuously compounded), no dividends.`,
      parts: [
        { q: `(a) What is the 1-year ATM put worth?`, a: 10 - 100 + 100 * Math.exp(-0.05), tol: { abs: 0.02, rel: 0 },
          sol: `C − P = S − K·e<sup>−rT</sup> ⇒ P = 10 − 100 + 100e<sup>−0.05</sup> ≈ 10 − 100 + 95.12 = <b>5.12</b>. With positive rates, ATM calls are worth more than ATM puts.` },
        { q: `(b) Roughly how much does the call's value change if implied volatility falls by 1 point?`, a: -0.4, tol: { abs: 0.03, rel: 0 },
          sol: `ATM vega ≈ 0.4·S·√T per 1.00 of vol = 40, so 1 point (0.01) is about <b>−$0.40</b>. Some prep material says about $4, which is off by a factor of ten, so check units out loud.` },
      ],
      followups: ['What is the ATM straddle worth at 30% vol? (≈ 0.8 × 0.3 × 100 = $24.)'],
    },
    {
      id: 'judge-quote', firm: 'common', role: 'Any trading role', stage: 'Technical', cat: 'Market making', kind: 'guide',
      src: ['Quantt: quant trader interview questions', 'https://www.quantt.co.uk/resources/quant-trader-interview-questions'],
      q: `The market is 10 bid, 11 offered. You think fair value is 10.4.`,
      parts: [
        { q: `(a) What is your expected profit per share if you sell at 10?`, a: -0.4, tol: { abs: 0.01, rel: 0 }, sol: `You sell something worth 10.4 for 10: −0.4.` },
        { q: `(b) If you buy at 11?`, a: -0.6, tol: { abs: 0.01, rel: 0 }, sol: `−0.6. Both trades lose, so do neither. Instead join the market with your own quote around 10.4 (e.g. 10.2 @ 10.6) and let others trade with you.` },
      ],
      followups: ['When would you cross the spread anyway? (Urgent hedging, strong short-term signal.)'],
    },
  ];

  QT.bankById = (id) => QT.bank.find((b) => b.id === id);
})();
