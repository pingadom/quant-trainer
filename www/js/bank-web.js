// More reported questions, from candidate interview reports on Wall Street Oasis (read October
// 2026). Same rules as the rest of the bank: paraphrased, linked to the firm's report page, every
// answer derived independently (research/verify_results.py), and any rule a report leaves out is
// stated in `note`. Where a report gives no numbers, the numbers are ours and the note says so.
// Hints are in bank-hints.js and worked solutions in bank-solutions.js, like every other question.
(function () {
  const R = QT.rand;
  const EXACT = { abs: 0.5, rel: 0 };
  const WSO = (slug, name) => [`Wall Street Oasis: ${name} interview reports`, `https://www.wallstreetoasis.com/company/${slug}/interview`];

  Object.assign(QT.firms, {
    tower: {
      name: 'Tower Research Capital',
      process: ['Trader and analyst candidates report Fermi estimates, probability (making a fair coin from a biased one, correlation bounds), and for quant roles regression and machine-learning theory (lasso v ridge).'],
      sources: [WSO('tower-research-capital', 'Tower Research')],
    },
    deshaw: {
      name: 'D. E. Shaw',
      process: ['Quantitative analyst candidates report a research deep dive followed by probability questions, such as turning a biased coin into fair ones efficiently and the random-loops (noodles) problem.'],
      sources: [WSO('de-shaw', 'D. E. Shaw')],
    },
    mako: {
      name: 'Mako',
      process: ['Graduate and trainee options traders report a simulated market-making exercise, mental arithmetic in a group setting, basic probability and Bayes, and questions on option spreads and their Greeks.'],
      sources: [WSO('mako-global', 'Mako')],
    },
  });

  QT.bank.push(
    // ---------------------------------------------------------------- Jump Trading
    {
      id: 'jump-red-card', firm: 'jump', role: 'Algo Trader', stage: 'Interview', cat: 'Optimal stopping', kind: 'reported', src: WSO('jump-trading', 'Jump Trading'),
      note: `Reported twice (an algo trader and a quant research intern). The intern's version: say "next" before any card; if it's red you win $1.`,
      q: `I deal a shuffled 52-card deck face up, one card at a time. At any point before a card is turned you can say "stop": if the next card is red you win, otherwise you lose. You must stop before the deck runs out.`,
      parts: [{ q: `What is your chance of winning under the best strategy?`, a: 0.5,
        sim: () => { const d = R.shuffle([...Array(52).keys()].map((i) => i < 26)); let r = 26, n = 52; for (let i = 0; i < 52; i++) { if (r / n > 0.5 || n === 1) return d[i] ? 1 : 0; if (d[i]) r--; n--; } return 0; } }],
      followups: ['Why can no strategy do better, even "wait until more black cards have gone"?'],
    },
    {
      id: 'jump-bubble-pass', firm: 'jump', role: 'Algo Trader', stage: 'Interview', cat: 'Combinatorics', kind: 'reported', src: WSO('jump-trading', 'Jump Trading'),
      note: `Reported without the list length; the lengths below are ours. The numbers are distinct and in random order.`,
      q: `Run one pass of bubble sort on a random ordering of distinct numbers: compare the first two and swap them if they're out of order, then the second and third, and so on to the end.`,
      parts: [
        { q: `(a) With 4 numbers, what is the probability the list is sorted after one pass?`, a: 1 / 3,
          sim: () => { const p = R.shuffle([0, 1, 2, 3]); for (let i = 0; i < 3; i++) if (p[i] > p[i + 1]) [p[i], p[i + 1]] = [p[i + 1], p[i]]; return p.every((x, i) => x === i) ? 1 : 0; } },
        { q: `(b) With 5 numbers?`, a: 2 / 15 },
      ],
      followups: ['What is it for n numbers?'],
    },
    {
      id: 'jump-corr-sum', firm: 'jump', role: 'Quant Researcher', stage: 'Interview', cat: 'Statistics', kind: 'reported', src: WSO('jump-trading', 'Jump Trading'),
      q: `Three random variables have correlations corr(x₁, x₂) = 0.5, corr(x₁, x₃) = 0.3 and corr(x₂, x₃) = −0.3. You may add a fourth variable x₄.`,
      parts: [{ q: `What is the largest possible value of corr(x₁, x₄) + corr(x₂, x₄) + corr(x₃, x₄)?`, a: 2 }],
    },
    {
      id: 'jump-exp-rate', firm: 'jump', role: 'Quant Researcher', stage: 'Interview', cat: 'Statistics', kind: 'reported', src: WSO('jump-trading', 'Jump Trading'),
      note: `Reported with symbols x and y; the numbers are ours. We read both times as measured from when you sat down.`,
      q: `You sit by a road. Gaps between cars are independent exponential random variables with unknown rate λ. The first car passes 3 minutes after you sit down and the second 8 minutes after you sit down.`,
      parts: [{ q: `What is the maximum-likelihood estimate of λ (cars per minute)?`, a: 0.25 }],
      followups: ['What if you had waited 10 minutes in total and seen exactly these two cars?'],
    },

    // ---------------------------------------------------------------- Hudson River Trading
    {
      id: 'hrt-edge-distance', firm: 'hrt', role: 'Algo Developer (campus)', stage: 'Interview', cat: 'Expected value', kind: 'reported', src: WSO('hudson-river-trading-llc', 'Hudson River Trading'),
      note: `Reported as "expected distance to an edge, with a randomly placed object". We use the usual version: a point uniform in a unit square, distance to the nearest edge.`,
      q: `A point is placed uniformly at random in a 1 × 1 square.`,
      parts: [{ q: `What is the expected distance to the nearest edge?`, a: 1 / 6,
        sim: () => { const x = Math.random(), y = Math.random(); return Math.min(x, 1 - x, y, 1 - y); } }],
    },

    // ---------------------------------------------------------------- DRW
    {
      id: 'drw-rook', firm: 'drw', role: 'Quant Trading Analyst intern', stage: 'Interview', cat: 'Markov chains', kind: 'reported', src: WSO('drw', 'DRW'),
      note: `We assume each move goes to one of the 14 squares a rook can reach from where it stands, uniformly at random.`,
      q: `A rook starts in the bottom-left corner of an empty chessboard and moves at random.`,
      parts: [{ q: `What is the expected number of moves until it reaches the top-right corner?`, a: 70,
        sim: () => { let r = 0, c = 0, n = 0; while (r !== 7 || c !== 7) { const k = R.int(0, 13); if (k < 7) c = k < c ? k : k + 1; else { const j = k - 7; r = j < r ? j : j + 1; } n++; } return n; } }],
      followups: ['The same report asked for a market on this number. How wide, given its spread?'],
    },
    {
      id: 'drw-chords', firm: 'drw', role: 'Quant Trading Analyst intern', stage: 'Interview', cat: 'Expected value', kind: 'reported', src: WSO('drw', 'DRW'),
      note: `Reported for k chords; we take k = 10 and chords whose endpoints are uniform on the circle.`,
      q: `Draw 10 random chords in a circle, each joining two independent uniform points on the circumference.`,
      parts: [{ q: `What is the expected number of intersection points between them?`, a: 15,
        sim: () => { const ch = [...Array(10)].map(() => [Math.random(), Math.random()].sort((a, b) => a - b)); let n = 0; for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) { const [a, b] = ch[i], [c, d] = ch[j]; if ((c > a && c < b) !== (d > a && d < b)) n++; } return n; } }],
    },
    {
      id: 'drw-mental', firm: 'drw', role: 'Trader intern', stage: 'Interview', cat: 'Mental maths', kind: 'reported', src: WSO('drw', 'DRW'),
      q: `Mental multiplication, asked out loud.`,
      parts: [{ q: `73 × 74`, a: 5402, tol: EXACT }],
    },

    // ---------------------------------------------------------------- Old Mission
    {
      id: 'om-chess', firm: 'oldmission', role: 'Quant Trading intern', stage: 'Interview', cat: 'Markov chains', kind: 'reported', src: WSO('old-mission-capital', 'Old Mission'),
      note: `We read "three consecutive games" strictly: a draw breaks a winning streak.`,
      q: `You and I play chess repeatedly. Half of our games are draws; of the decisive ones, I win 2/3. The match ends when someone wins three games in a row.`,
      parts: [{ q: `What is the probability that I win the match?`, a: 86 / 99,
        sim: () => { let me = 0, you = 0; for (;;) { const u = Math.random(); if (u < 1 / 2) { me = you = 0; } else if (u < 1 / 2 + 1 / 3) { me++; you = 0; if (me === 3) return 1; } else { you++; me = 0; if (you === 3) return 0; } } } }],
    },
    {
      id: 'om-sphere-tetra', firm: 'oldmission', role: 'Quant Trading intern', stage: 'Interview', cat: 'Probability', kind: 'reported', src: WSO('old-mission-capital', 'Old Mission'),
      q: `Four points are chosen independently and uniformly on the surface of a sphere.`,
      parts: [{ q: `What is the probability that the centre of the sphere lies inside the tetrahedron they form?`, a: 1 / 8 }],
      followups: ['The 2D version: three points on a circle and the triangle containing the centre?'],
    },
    {
      id: 'om-intern-quickfire', firm: 'oldmission', role: 'Trading intern', stage: 'Interview', cat: 'Expected value', kind: 'reported', src: WSO('old-mission-capital', 'Old Mission'),
      note: `For (b) we assume one reroll, costing $1, and you keep the second roll. For (c), positive whole numbers where order matters.`,
      q: `Quick-fire questions from one trading-intern interview.`,
      parts: [
        { q: `(a) X is uniform on [0, 10]. What is its variance?`, a: 100 / 12 },
        { q: `(b) A die pays $1 per dot. After seeing it you may reroll once for $1, keeping the second roll. What is the game worth?`, a: 23 / 6,
          sim: () => { const x = R.die(); return x >= 3 ? x : R.die() - 1; } },
        { q: `(c) In how many ways can three positive whole numbers (in order) add up to 10?`, a: 36, tol: EXACT },
      ],
    },
    {
      id: 'om-cards', firm: 'oldmission', role: 'Quantitative Research intern', stage: 'Interview', cat: 'Probability', kind: 'reported', src: WSO('old-mission-capital', 'Old Mission'),
      q: `Three questions from one interview.`,
      parts: [
        { q: `(a) What is the probability that a 5-card poker hand is four of a kind?`, a: 1 / 4165, tol: { abs: 0.000005, rel: 0 } },
        { q: `(b) 56 × 67, quickly.`, a: 3752, tol: EXACT },
        { q: `(c) You want to draw a black card and then a red card. With a normal 52-card deck, what is the probability?`, a: 13 / 51,
          sim: () => { const d = R.shuffle([...Array(52).keys()]); return d[0] < 26 && d[1] >= 26 ? 1 : 0; } },
      ],
      followups: ['Would a double deck of 104 cards be better or worse for this, and why?'],
    },

    // ---------------------------------------------------------------- Belvedere
    {
      id: 'bel-dice', firm: 'belvedere', role: 'Quantitative Trading intern', stage: 'Interview', cat: 'Game theory', kind: 'reported', src: WSO('belvedere-trading', 'Belvedere Trading'),
      q: `Three dice: red has faces 2, 6, 7; green has 1, 5, 12; blue has 3, 4, 8 (each face equally likely). Two players each roll a die and the higher number wins. Which die would you choose?`,
      parts: [{ q: `First: what is the probability that red beats green?`, a: 5 / 9,
        sim: () => ([2, 6, 7][R.int(0, 2)] > [1, 5, 12][R.int(0, 2)] ? 1 : 0) }],
      followups: ['Check green against blue and blue against red. So which die should you pick, and when?'],
    },
    {
      id: 'bel-drunk-passenger', firm: 'belvedere', role: 'Trading intern', stage: 'Interview', cat: 'Probability', kind: 'reported', src: WSO('belvedere-trading', 'Belvedere Trading'),
      note: `The usual version: 100 seats, one per passenger. The first passenger sits in a random seat; everyone after takes their own seat if it's free and a random free seat otherwise.`,
      q: `100 passengers board a full plane one at a time. The first has lost their boarding pass and sits in a random seat.`,
      parts: [{ q: `What is the probability that the last passenger sits in their own seat?`, a: 0.5,
        sim: () => { const free = new Set([...Array(100).keys()]); const take = (s) => free.delete(s); take(R.int(0, 99)); for (let p = 1; p < 99; p++) { if (free.has(p)) take(p); else { const f = [...free]; take(f[R.int(0, f.length - 1)]); } } return free.has(99) ? 1 : 0; } }],
    },
    {
      id: 'bel-mental', firm: 'belvedere', role: 'Trading Analyst intern', stage: 'Interview', cat: 'Mental maths', kind: 'reported', src: WSO('belvedere-trading', 'Belvedere Trading'),
      q: `Mental arithmetic reported from Belvedere trading-intern interviews.`,
      parts: [
        { q: `(a) 3/32 as a decimal`, a: 0.09375, tol: { abs: 0.00001, rel: 0 } },
        { q: `(b) 38 × 42`, a: 1596, tol: EXACT },
        { q: `(c) 62 × 74`, a: 4588, tol: EXACT },
      ],
    },

    // ---------------------------------------------------------------- Virtu
    {
      id: 'virtu-quick', firm: 'virtu', role: 'Operations', stage: 'Interview', cat: 'Expected value', kind: 'reported', src: WSO('virtu-financial', 'Virtu Financial'),
      q: `Two quick questions reported from Virtu interviews.`,
      parts: [
        { q: `(a) How many flips of a fair coin do you need on average to get two heads in a row?`, a: 6,
          sim: () => { let n = 0, run = 0; while (run < 2) { n++; run = Math.random() < 0.5 ? run + 1 : 0; } return n; } },
        { q: `(b) Every edge of a cube doubles in length. By what factor does its volume grow?`, a: 8, tol: EXACT },
      ],
    },
    {
      id: 'virtu-uncorrelated', firm: 'virtu', role: 'Quant intern', stage: 'Interview', cat: 'Statistics', kind: 'reported', src: WSO('virtu-financial', 'Virtu Financial'),
      note: `Also reported by a Two Sigma quant research intern.`,
      q: `Give an example of two random variables that are dependent but uncorrelated.`,
      open: { model: `<p>Take X uniform on [−1, 1] (or standard normal) and Y = X². Y is completely determined by X, so they're dependent. But Cov(X, Y) = E[X³] − E[X]E[X²] = 0 − 0 = 0, because X is symmetric around 0. Correlation only measures <i>linear</i> dependence; Y = X² is a perfect but non-linear relationship. Say this before giving the example: interviewers want to hear that zero correlation doesn't imply independence (except for jointly normal variables).</p>` },
    },

    // ---------------------------------------------------------------- Da Vinci
    {
      id: 'dv-running-sum', firm: 'davinci', role: 'Quant intern', stage: 'Interview', cat: 'Markov chains', kind: 'reported', src: WSO('da-vinci-derivatives', 'Da Vinci'),
      q: `You roll a fair die repeatedly and keep a running total.`,
      parts: [
        { q: `(a) What is the probability the running total ever equals exactly 3?`, a: 49 / 216 },
        { q: `(b) Exactly 4?`, a: 343 / 1296 },
        { q: `(c) Which total x is most likely to be hit?`, a: 6, tol: EXACT },
      ],
      followups: ['What does the probability settle to for large x, and why? (1/3.5 = 2/7: on average one total in every 3.5 is visited.)'],
    },
    {
      id: 'dv-vol-delta', firm: 'davinci', role: 'Graduate Quant Trader', stage: 'Interview', cat: 'Options', kind: 'reported', src: WSO('da-vinci-derivatives', 'Da Vinci'),
      q: `An at-the-money call option. Its implied volatility rises without limit.`,
      parts: [{ q: `What does its delta tend to?`, a: 1, tol: { abs: 0.01, rel: 0 } }],
      followups: ['And the put\'s delta? (Tends to 0, by put–call parity.)'],
    },
    {
      id: 'dv-quick-division', firm: 'davinci', role: 'Quant Trading intern', stage: 'Interview', cat: 'Mental maths', kind: 'reported', src: WSO('da-vinci-derivatives', 'Da Vinci'),
      q: `Quick-fire mental maths.`,
      parts: [{ q: `47 ÷ 13, to two decimal places`, a: 47 / 13, tol: { abs: 0.006, rel: 0 } }],
    },

    // ---------------------------------------------------------------- Maven
    {
      id: 'mav-mississippi', firm: 'maven', role: 'Graduate Trader (Chicago)', stage: 'Interview', cat: 'Combinatorics', kind: 'reported', src: WSO('maven-securities', 'Maven Securities'),
      q: `Count the distinct arrangements of the letters of MISSISSIPPI.`,
      parts: [{ q: `How many are there?`, a: 34650, tol: EXACT }],
    },
    {
      id: 'mav-40-factorial', firm: 'maven', role: 'Trading intern', stage: 'Interview', cat: 'Mental maths', kind: 'reported', src: WSO('maven-securities', 'Maven Securities'),
      q: `Which is larger, 10<sup>40</sup> or 40!? Then find the two consecutive factorials that 10<sup>40</sup> lies between.`,
      parts: [{ q: `10<sup>40</sup> lies between (n − 1)! and n!. What is n?`, a: 35, tol: EXACT }],
    },

    // ---------------------------------------------------------------- Squarepoint, Akuna, IMC
    {
      id: 'sq-sd-unbiased', firm: 'squarepoint', role: 'Quant Research intern', stage: 'Interview', cat: 'Statistics', kind: 'reported', src: WSO('squarepoint-capital', 'Squarepoint'),
      q: `The sample variance s² (dividing by n − 1) is an unbiased estimator of σ². Is s an unbiased estimator of σ?`,
      open: { model: `<p><b>No: it's biased low.</b> The square root is concave, so by Jensen's inequality E[s] = E[√s²] ≤ √E[s²] = σ, with strict inequality whenever s² isn't constant. The bias shrinks as n grows (for normal data, E[s] ≈ σ(1 − 1/(4n))). Unbiasedness doesn't survive non-linear transformations; consistency does.</p>` },
    },
    {
      id: 'akuna-risk-ten', firm: 'akuna', role: 'Quantitative Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported', src: WSO('akuna-capital-llc', 'Akuna Capital'),
      q: `We roll two dice. If the total is 10, you win $100; otherwise you lose your stake.`,
      parts: [{ q: `What is the most you should risk (the stake that makes the bet fair)?`, a: 100 / 11 }],
      followups: ['The same interview asked: make a market on the Chicago metro population, then how much you would risk to win $100 if the truth is inside your market.'],
    },
    {
      id: 'imc-alex-blake', firm: 'imc', role: 'Graduate Trader', stage: 'Interview', cat: 'Conditional probability', kind: 'reported', src: WSO('imc-financial-markets', 'IMC'),
      q: `Alex and Blake each flip a fair coin until their first head.`,
      parts: [{ q: `Given that Alex needed fewer flips than Blake, what is Alex's expected number of flips?`, a: 4 / 3,
        sim: () => { for (;;) { let a = 1, b = 1; while (Math.random() < 0.5) a++; while (Math.random() < 0.5) b++; if (a < b) return a; } } }],
    },
    {
      id: 'imc-spaghetti', firm: 'imc', role: 'Quant Trader', stage: 'Interview', cat: 'Expected value', kind: 'reported', src: WSO('imc-financial-markets', 'IMC'),
      note: `Also reported by a D. E. Shaw quantitative analyst candidate (as noodles).`,
      q: `A bowl holds 100 strands of spaghetti. You repeatedly pick two free ends at random and tie them together, until no free ends remain.`,
      parts: [{ q: `What is the expected number of loops?`, a: [...Array(100)].reduce((s, _, k) => s + 1 / (2 * k + 1), 0), tol: { abs: 0.02, rel: 0 },
        sim: () => { let loops = 0; for (let n = 100; n > 0; n--) if (Math.random() < 1 / (2 * n - 1)) loops++; return loops; } }],
    },

    // ---------------------------------------------------------------- Tower Research
    {
      id: 'tower-corr-range', firm: 'tower', role: 'Analyst (prop trading)', stage: 'Interview', cat: 'Statistics', kind: 'reported', src: WSO('tower-research-capital', 'Tower Research'),
      q: `corr(X, Y) = 0.2 and corr(Y, Z) = 0.5. Nothing else is known.`,
      parts: [
        { q: `(a) What is the largest possible value of corr(X, Z)?`, a: 0.1 + Math.sqrt(0.96 * 0.75), tol: { abs: 0.005, rel: 0 } },
        { q: `(b) The smallest?`, a: 0.1 - Math.sqrt(0.96 * 0.75), tol: { abs: 0.005, rel: 0 } },
      ],
    },
    {
      id: 'tower-stairs', firm: 'tower', role: 'Intern', stage: 'Interview', cat: 'Combinatorics', kind: 'reported', src: WSO('tower-research-capital', 'Tower Research'),
      note: `Reported for general n; we use 10 stairs.`,
      q: `You climb a staircase taking 1 or 2 steps at a time.`,
      parts: [{ q: `How many different ways are there to climb 10 stairs?`, a: 89, tol: EXACT }],
    },

    // ---------------------------------------------------------------- D. E. Shaw
    {
      id: 'deshaw-biased-coin', firm: 'deshaw', role: 'Quantitative Analyst', stage: 'Phone', cat: 'Probability', kind: 'reported', src: WSO('de-shaw', 'D. E. Shaw'),
      q: `You have a coin that lands heads with probability 1/3, and you need fair coin flips from it.`,
      parts: [
        { q: `(a) With the standard method (flip twice; HT and TH decide, otherwise repeat), how many biased flips does one fair flip take on average?`, a: 4.5,
          sim: () => { let n = 0; for (;;) { n += 2; const a = Math.random() < 1 / 3, b = Math.random() < 1 / 3; if (a !== b) return n; } } },
        { q: `(b) Follow-up: if you need many fair flips, what is the best possible number of fair flips per biased flip, in the long run?`, a: -(1 / 3 * Math.log2(1 / 3) + 2 / 3 * Math.log2(2 / 3)), tol: { abs: 0.01, rel: 0 } },
      ],
    },

    // ---------------------------------------------------------------- Five Rings
    {
      id: 'fr-max-normals', firm: 'fiverings', role: 'Quant Research intern', stage: 'Interview', cat: 'Probability', kind: 'reported', src: WSO('five-rings-capital-llc', 'Five Rings'),
      note: `We take X and Y independent standard normal.`,
      q: `X and Y are independent standard normal random variables.`,
      parts: [{ q: `What is E[max(X, Y)]?`, a: 1 / Math.sqrt(Math.PI), sim: () => Math.max(R.normal(), R.normal()) }],
    },
    {
      id: 'fr-arc-length', firm: 'fiverings', role: 'Quant intern', stage: 'Interview', cat: 'Mental maths', kind: 'reported', src: WSO('five-rings-capital-llc', 'Five Rings'),
      q: `Find the length of the curve y = x² from x = 0 to x = 9.`,
      parts: [{ q: `Its length (to the nearest whole number, or better)?`, a: (9 * Math.sqrt(325)) / 2 + Math.asinh(18) / 4, tol: { abs: 1, rel: 0 } }],
    },
    {
      id: 'fr-quick-estimates', firm: 'fiverings', role: 'Quant Trader', stage: 'Interview', cat: 'Mental maths', kind: 'reported', src: WSO('five-rings-capital-llc', 'Five Rings'),
      q: `Quick estimates reported from Five Rings interviews.`,
      parts: [
        { q: `(a) 3<sup>3.4</sup>`, a: Math.pow(3, 3.4), tol: { abs: 1, rel: 0 } },
        { q: `(b) A point is uniform in a disc of radius 1. Its average distance from the centre?`, a: 2 / 3,
          sim: () => Math.sqrt(Math.random()) },
      ],
    },

    // ---------------------------------------------------------------- Mako, Jane Street
    {
      id: 'mako-mental', firm: 'mako', role: 'Options Trader Trainee', stage: 'Group interview', cat: 'Mental maths', kind: 'reported', src: WSO('mako-global', 'Mako'),
      q: `Mental arithmetic asked in a group interview with traders.`,
      parts: [
        { q: `(a) 76 × 49`, a: 3724, tol: EXACT },
        { q: `(b) 5302 − 1434`, a: 3868, tol: EXACT },
      ],
    },
    {
      id: 'mako-calendar-straddle', firm: 'mako', role: 'Junior Trader', stage: 'Interview', cat: 'Options', kind: 'reported', src: WSO('mako-global', 'Mako'),
      q: `You buy a near-dated straddle and sell a longer-dated straddle at the same strike. What are your Greeks, and how do they change if the stock rallies sharply through the day?`,
      open: { model: `<ul><li><b>Gamma: long.</b> Near-dated options have more gamma, so the long front straddle dominates.</li><li><b>Theta: short (you pay decay).</b> The front straddle decays fastest.</li><li><b>Vega: short.</b> The back straddle has more vega, so you lose if implied volatility rises across the curve.</li><li><b>Delta: about flat</b> at the start, since both straddles are near zero delta at the money.</li><li><b>After a sharp rally</b> both straddles move out of the money on the put side and in the money on the call side. Being long gamma, you get <b>longer delta</b> as the stock rises, faster in the front month. Gamma (and theta) fall as the options move away from the strike, front month fastest, so the position's gamma and theta both shrink towards zero, while the vega difference persists.</li></ul><p>The trade is a bet on realised volatility now (gamma) against implied volatility later (vega).</p>` },
    },
    {
      id: 'js-meet-20', firm: 'js', role: 'Trade Desk Operations Engineer', stage: 'Interview', cat: 'Probability', kind: 'reported', src: WSO('jane-street-capital', 'Jane Street'),
      q: `Two people each arrive at a uniformly random time within the same hour, and each waits 20 minutes for the other.`,
      parts: [{ q: `What is the probability they meet?`, a: 5 / 9,
        sim: () => (Math.abs(Math.random() - Math.random()) <= 1 / 3 ? 1 : 0) }],
    },
  );
})();
