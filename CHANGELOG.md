# Changelog

## 0.54.0

- **Handbook, Part 3 (Statistics) rewritten in depth**, as Parts 1 and 2 were: fuller explanations, more worked examples, and a worked solution for every homework problem.
  - **The CLT:** counts v proportions in the law of large numbers, how big n needs to be, why casinos are safe, the standard error of a difference, and effective sample size for correlated data.
  - **Estimation:** why MSE splits into bias and variance, standard errors of MLEs, the delta method, t multipliers, the rule of three for rare events, and how much to shrink.
  - **Testing:** one- v two-sided tests, tests and intervals as two views of one thing, two-sample and paired tests, power and the sample-size formula, and Benjamini–Hochberg.
  - **Regression:** the matrix form, what the standard errors assume (and robust errors), omitted-variable bias and errors-in-variables in numbers, and overfitting with adjusted R².
  - **Correlation matrices:** risk contributions, factor models and shrinkage for large matrices.
  - **Time series:** the variance ratio, estimating φ and its bias, unit-root tests, GARCH(1, 1) and its long-run level, and correlation v cointegration.
  - 11 new checks, each re-derived independently in Python (several by simulation). Saved progress is unaffected.

## 0.53.0

- **Handbook, Part 2 (Interview probability) rewritten in depth**, as Part 1 was in 0.52.0: fuller explanations of why each method works, more worked examples, and a worked solution for every homework problem.
  - **Distributions:** the normal approximation with the continuity correction, where the Poisson comes from, racing exponential clocks (which happens first, and when), and the normal quantiles behind confidence intervals and value at risk.
  - **Symmetry:** relabelling, reflection and ordering symmetries, why the equal gaps really are equal, records (1 + ½ + … + 1/n), and the broken stick by symmetry.
  - **First-step analysis:** waits v probabilities, boundary conditions, and recursion on the size of a problem (the running total of die rolls, staircases).
  - **Markov chains:** n-step probabilities as matrix powers, how fast a chain forgets its start, why random walks on graphs spend time in proportion to degree, and absorption probabilities.
  - **Random walks:** ruin against an unlimited opponent, why Wald's identity holds, how far a walk wanders (√n), and the ballot theorem.
  - **Optimal stopping:** the Bellman equation, why options have value, the red-and-black card game, and the secretary rule explained.
  - **Continuous probability:** the CDF method for transformed variables, the tail integral, order statistics in general, and Buffon's needle.
  - 12 new checks, each re-derived independently in Python. Saved progress is unaffected.

## 0.52.0

- **Handbook, Part 1 (Foundations) rewritten in depth.** The chapters were short for the time they claimed, and most homework solutions gave little more than the answer.
  - **Teaching:** every chapter explains why each rule works, not just what it is, with roughly twice to three times the text and three to five worked examples instead of one.
  - **New material:** inclusion–exclusion and derangements, pairwise v full independence, the "any position in a shuffled deck" symmetry, the chain rule, conditional independence (learning a coin's bias), the law of total expectation, the tail-sum formula, Chebyshev's inequality, the variance of dependent counts, the minimum-variance portfolio, lattice paths, the hypergeometric distribution, Taylor approximations and (1 + x/n)ⁿ → eˣ, integration by parts, division and square-root tricks, and casting out nines.
  - **Homework:** every solution is now a worked answer: the approach, the steps, the answer, and a check or the point of the question.
  - **Checks:** solutions show their working, and 20 new checks are added (each answer re-derived independently in Python, as before). Your saved progress is unaffected.

## 0.51.0

Practice for software engineering technical interviews, following Optiver's own advice for its SWE interviews: they test how you think, the data structures you choose and what they cost, how those work in memory, CS fundamentals, and how you explain and revise a design.

- **Design discussions** (Coding → Design discussions): six problems run like the interview: an order book, a market data feed handler, an LRU cache and its extensions, an order rate limiter, a pre-trade risk check and best price across venues. Write your clarifying questions before anything is shown, then work through stages with hints that build up, face the interviewer's pushbacks one at a time, sketch a diagram against a one-minute timer, and compare with a model answer (structures, costs, a Python sketch). Score yourself on a six-point rubric; record yourself talking it through if you like (kept on your device).
- **Python internals cards:** a new deck of 30 cards on how lists, dicts, sets, deques, heaps and sorting work inside and what they cost, plus the GIL, threads, memory and clocks, each with why it matters.
- **30 more knowledge-quiz questions** (75 in all): cache and memory layout, NUMA, huge pages, market data over multicast, sequence gaps, A/B feeds, kernel bypass, deadlock, compare-and-swap, ABA, lock-free ring buffers, memory visibility, more Python, and a new Memory topic.
- **Follow-up questions** on the order book, LRU cache, ring buffer, peak live orders and debug-the-matcher problems, shown once you've solved them.
- **Technical interview countdown** on the Coding page: set your date (kept on this device) for a daily checklist of cards, quiz, one design discussion and one problem. Tasks the app sees you do tick themselves.
- New CI check, research/verify_internals.py: every testable claim about Python behaviour on the cards and quiz, and every design problem's Python sketch, is run against CPython.

## 0.50.0

- **Number sequences trainer** (Online tests → Number sequences).
  - 30 kinds of pattern in three levels, from adding a constant to cubics, sums of the previous three terms, digit sums, squares and cubes interleaved, and letter sequences.
  - Practice mode, by level, by single pattern or aimed at your weak spots, explains the rule and the differences after every answer.
  - Timed tests in the formats candidates report: 15 in 7½ minutes, 24 in 18 and 26 in 25, getting harder as they go, with the pacing chart and a review of what you missed.
  - Accuracy and average time for every kind of pattern.
  - Every pattern is checked against independent next-term solvers, which also make sure no question has a second sensible answer.
- **Cognitive games**, covering the skills game-based assessments (Optiver's Zap-N, IMC's games and others) measure. Our own games, not copies:
  - **Rule switch:** odd or even, or higher or lower than 5, depending on where the digit appears. Measures your switch cost.
  - **Match or not:** are two codes identical? They get longer as you go.
  - **Grid memory:** repeat a sequence of squares.
  - **Make the target:** reach a number with four numbers and + − × ÷.
  - **Stop the dial:** stop a sweeping hand on a mark; tells you if you're consistently early or late.
  - **Order queue:** ship orders from up to four lanes in their ready windows.
  - **Pump or bank:** balloons in three colours with different burst ranges, and the maths of when to stop.
  - Play one at a time or all seven in a row, with personal bests and progress charts.

## 0.49.0

- **Question library: the last two collections**, bringing the bank to 732 questions.
  - **55 from andyhu4023's question bank:** a million coin flips and the CLT, normal variables that are uncorrelated but dependent, betting games with optimal stopping (stop before a six, red and black cards, two coins), Penney's game, the World Series replication bet, Brownian motion (sign changes, exit times, hitting probabilities, drift), calculus and ODEs, linear algebra (determinants, eigenvalues, positive definiteness, QR, LU, SVD), and geometry teasers. Exercises the source takes from the Green Book are left out.
  - **13 from QFin UWA's notes:** the six and seven of clubs, Bayes with three suppliers, Beta posteriors, counting with constraints and power-ups, race to 50, simulating 3/13 with a die, bluffing frequencies, a mixed-strategy equilibrium, the d20 threshold game and place-or-take.
  - As before, every numeric answer is re-derived independently in Python.

## 0.48.0

- **Question library: 275 more questions from Xiaodong Yang's quant interview notes**, bringing the bank to 664.
  - Probability and statistics: order statistics, Poisson and exponential results, ruin, the birthday problem, empty bins, MLE, OLS, the CLT, bias and variance, p-values, bootstrapping, multiple testing, the delta method, AIC v BIC, endogeneity and more.
  - Time series and machine learning: stationarity, AR(1), unit roots, cointegration, GARCH, the Kalman filter, walk-forward validation, regularisation, tree ensembles, calibration, leakage, precision and recall.
  - Derivatives and Greeks: Black–Scholes deltas, gamma, vega and digitals on real numbers, binomial trees, no-arbitrage bounds, butterflies and straddles, the smile, local and stochastic volatility, Breeden–Litzenberger.
  - Stochastic calculus: Brownian motion, Itô's lemma and isometry, GBM mean v median, Girsanov, the market price of risk, Ornstein–Uhlenbeck half-lives, optional stopping, Feynman–Kac.
  - Coding: Python for returns, volatility, VaR, expected shortfall, Monte Carlo, binomial trees, implied vol, backtests without lookahead, as-of merges and bars; algorithms (sliding windows, Kadane, streaming median, LRU cache); C++ and low-latency engineering (RAII, move semantics, cache locality, false sharing, order-book design).
  - Concept questions have a model answer to compare with; wherever a formula can be tried on numbers, the question asks for the number, re-derived independently in Python.
- Weak spots: **Stochastic calculus** joins the Markov chains and random walks area.

## 0.47.0

- **Question library: 80 more questions from EigenPrep** (CU Quants), bringing the bank to 389.
  - Probability: Bertrand's boxes, ruin in a biased game, Monty Hall with ten doors, unequal coupons, the secretary problem with four, the ballot theorem, a birthday shared by three, a capped St Petersburg game, Pólya's urn, Banach's matchboxes, Buffon's needle, the Chinese restaurant process, parking functions and the doubling strategy.
  - Brain teasers: the bridge and torch, colouring a cube, following the chain of boxes, two-player roulette, the ant on the rubber band, water jugs, repeated digits on a clock, and more.
  - Finance: put–call parity, delta hedging, forwards, VaR, Sharpe ratio, duration, beta and interest-rate parity, plus open questions on the skew, early exercise, carry trades, CDS, repo, contango, pairs trading and others with model answers.
  - Five sets of quick-fire arithmetic.
  - Several of the source's answers were wrong (the cube colouring is 6, not 3; two-player roulette is 1/3 for the first player, not 5/7; betting everything on a fair coin keeps the expected wealth at $100). Ours are re-derived independently in Python.
- A new **Finance** topic in the Options weak-spot area.

## 0.46.0

- **Question library**, a large general bank in Interview questions (Firm → Question library). It starts with 102 puzzles from BrainStellar's collection: probability, expected value, Markov chains, random walks, game theory, combinatorics and logic, from easy to hard. More collections follow.
  - Each is rewritten in our own words with hints that build up step by step and a worked solution (key idea, steps, a check, the common trap), and links to its source. Puzzles Theo already had come in as variants with new numbers (three bullets, seven pirates, Monty Hall with four doors, a thousand bulbs, three eggs, the boy born on a Tuesday, …).
  - Every numeric answer is derived a second, independent way in Python, and CI fails if one disagrees.
- **Search and filters in Interview questions:** search the text, filter by topic and difficulty, and load 60 questions at a time.

## 0.45.0

- **The pacing chart is now a line of points.** After Zetamac, 80 in 8, 60 in 6 and the rhythm drill, each answer is a point at the moment you gave it, at the score you were on pace for then: your score so far scaled up to the full time (in 80 in 8 and 60 in 6, net of wrong answers and capped at the questions there are). A stall shows as a drop and a wrong answer as a hollow red ring; your previous best is a dashed line. Point at, tap or arrow-key along the line to see each answer, its time and the pace it left you on. A new note gives your best pace, the last moment you held it, and your final score. The first few seconds are left off, since one quick answer extrapolates to a silly score.
- **Zetamac is at the top of Mental maths.**

## 0.44.0

A visual polish pass, aimed at using Theo on a computer.

- **Wider screens are used properly.** On a monitor 1280px or wider, overview screens (Home, Coach, Practice, Mental maths, Interview questions, Handbook, Progress and others) widen to 1240px. Reading and question screens keep a comfortable line length.
- **Home is a dashboard on a computer:** what to do next on the left; your plan, the daily challenge, your progress and this week's accuracy in a column on the right that stays in view as you scroll.
- **Sidebar icons** for every main section, a larger wordmark, and sections that line up under their icons.
- **Depth and feedback:** cards have a soft shadow, and anything you can click lifts slightly when you point at it (not with reduced motion).
- **Two-column layouts** for Interview questions, the Coach's recommendations and the Handbook's chapter list; 80 in 8 and 60 in 6 side by side on Mental maths, with the speed-trick and flow-training links side by side above them.
- **Smaller touches:** bigger page headings on a computer, topic cards with their accuracy bars lined up, drop-downs in the body font rather than the code font, and a "Make a prep plan" card in place of a line of small text.

## 0.43.0

A redesign of how you find your way around, from a review of every screen and an outside UI/UX review.

- **A shorter sidebar.** Coach, Interview plan and Daily challenge sit at the top. Learn, Practise, Interview prep and Trading games fold away; the one holding the page you're on opens by itself, and any you open stay open. Progress, Roadmap and Settings sit at the bottom.
- **Clearer names:** "Practise by topic" and "Read topic guides" (were Topics and Topic guides), "Weak-spot training" (was Weak spots, now under Practise), "Market-making sim" (was Market making, beside Make me a market).
- **First visit:** four ways to start (try a question, plan for an interview, learn from the beginning, or the 15-minute diagnostic) and a visible "Explore with sample data" button.
- **Your target firm:** the firm in your interview plan, or the last one you picked in Interview questions. Interview questions, Mock interview, the phone-screen mock and the plan form start on it.
- **Interview questions:** a firm drop-down replaces the row of 20+ firm chips, with a shortcut to your firm.
- **More (phone):** recently visited screens first, then every section in a fold-out group of compact rows.
- **Coach:** filter the skill map to Weak, Shaky, Strong, Learning or Not started. Error habits show each kind of slip as a share of your recent mistakes.
- **Home:** "topic questions answered" and "accuracy, all time" (the tile said "problems solved" but counted every attempt). The Mental maths card shows your Zetamac, 80-in-8 and 60-in-6 bests. A reminder to export a backup after a week of practice with none in the past month.
- **Easier to read and tap:** body text 16px (was 15px) and small text 14px; back links, fold-out headings and the "Charts" link have bigger tap targets.
- **Accessibility:** after moving to another screen, keyboard and screen-reader focus goes to its heading. The Stats lab's controls are labelled.
- **Fixes:** the mistakes count on the Practice page's "Mistakes to review" card was grey on red and unreadable. The More page was missing Weak-spot training and described Mental maths without 60 in 6. The sample-data profile now spreads its answers over the streak, so the week's accuracy candles show. New README screenshots.

## 0.42.0

- **Pacing chart after every timed game:** Zetamac (including challenges and single-operation games), 80 in 8, 60 in 6 and the rhythm drill.
  - A column for each slice of the run (10 seconds in a 2-minute Zetamac, 20 or 30 seconds in the longer tests) shows how many questions you answered in it, split into right and wrong (or skipped), against the pace you need (one every 6 seconds for 80 in 8 and 60 in 6) or your own average.
  - Hover over or tap a column to see that slice: how many you answered and the question you spent longest on, including one you were still on when time ran out.
  - Notes underneath: first half against second half, your fastest and slowest stretches, the question where you fell behind the pace for 80 or 60, and the questions that stalled you, with how many answers they cost at your usual speed.

## 0.41.0

- **60 in 6**, practice for Flow Traders' arithmetic test (Mental maths → 60 in 6): 60 multiple-choice questions in 6 minutes, +1 right, −1 wrong, 0 for any not reached, one at a time with no going back.
  - Twelve question types in the reported mix: whole-number sums and products, missing numbers (? − 587 = 73), decimals with different numbers of places, decimal × decimal (10.7 × 13.2), decimals with a missing factor (? × 0.12 = 18), chained multiplication (0.6 × 70 × 5,000), "36 is …% of 80", and fraction sums and products shown as stacked fractions, with options that are often unsimplified (24/2) or mixed numbers.
  - The wrong options are the slips people make: digits lined up on the right instead of at the point, the wrong number of zeros, the inverse fraction, off by ten.
  - Results show net score, right, wrong and not reached, your pace at the halfway mark, whether you guessed in the closing seconds, the fast method for every slow or missed question, and every question with your time. Slow types join your speed reps.
  - Optional live score, as on the practice site. Questions are generated fresh each run; they are not copies of the real test.
- **Two new speed-trick guides:** "Decimals: digits first, then the point" and "Fraction arithmetic at speed".

## 0.40.0

- **Three new Handbook chapters**, bringing it to 31:
  - **Linear algebra** (Part 1): vectors and the dot product, matrices as transformations, determinants and inverses, rank and least squares by the normal equations, eigenvalues and eigenvectors, symmetric and positive semi-definite matrices, and the Cholesky factor.
  - **Brownian motion** (new Part 4, Stochastic processes): the limit of a random walk, independent normal increments, quadratic variation and rough paths, scaling and the reflection principle, martingales and hitting times, with and without drift.
  - **Stochastic calculus and Black–Scholes**: SDEs and the Euler scheme, Itô's lemma, geometric Brownian motion and volatility drag (mean v median), the Black–Scholes equation by hedging, risk-neutral pricing, and the Ornstein–Uhlenbeck process.
  - Each has worked examples, diagrams, checks, homework and a model explanation, with three new tools: a 2×2 matrix explorer, Brownian paths from small steps, and geometric Brownian motion's mean against its median.
  - A new part exam, Stochastic processes. Chapter cross-references now use names rather than numbers.

## 0.39.0

- **The Handbook is now a full course to work through.** It has 28 chapters in six parts, about 23 hours of reading plus homework, and every chapter from Part 3 onwards is new.
  - **New chapters:** the maths toolkit; the law of large numbers and the CLT; estimation and confidence; hypothesis tests and false discoveries; regression; correlation matrices, portfolios and PCA; time series and volatility; betting and position sizing; market making; options; estimation and calibration; game theory; returns, factors and alpha; backtests, overfitting and costs; and on the day. The first 13 chapters were rewritten and extended.
  - **Teaching methods in every chapter:** a warm-up from earlier chapters, worked examples revealed one step at a time with questions to think about, diagrams (77 in all), predict-first simulations, concept checks that explain why a wrong answer is wrong, common mistakes, proofs to fold out, links to the desk, and an "explain it in your own words" box with a model answer.
  - **Homework for every chapter:** 237 problems at Core, Interview and Stretch levels, plus Labs to do away from the screen. Core and Interview problems finish a chapter. Numeric answers are marked automatically; for written ones, compare with the model answer and mark yourself.
  - **Spaced review:** finished chapters come back after 3, 7, 21 and 60 days as mixed questions, and show in the coach.
  - **Exams:** a mixed exam for each part and a final exam, with no hints or feedback until the end, and a report by chapter.
  - **Routes and a summary page:** shorter paths for a two-week or a one-week run-up, and every chapter's summary on one page.
  - **11 new interactive tools:** the CLT, confidence intervals, multiple testing, regression, two-asset portfolios, AR(1), Kelly, adverse selection, option payoffs, option values and overfitting.
  - Your progress on the original checks is kept, but a chapter now also needs its homework to count as finished.
  - Every numeric answer, in checks and homework, is re-derived independently in Python in CI (research/verify_handbook.py), and CI fails if any has no derivation.
- Handbook answers now accept expressions such as `sqrt(2)/2`.
- Leaving the Coding screen while a run fails to start can no longer throw an error.

## 0.38.0

- **Citadel SSE prep: mock, simulator and spaced repetition.**
  - **45-minute mock** (Citadel SSE prep → 45-minute mock): introduction, probability and EV, statistics and regression, market making, a project deep-dive and your questions, with a clock for the whole call and each segment. A think-aloud box beside each question is saved with the attempt. The report gives a score per segment, the time on each question, your three weakest tags and links to drill them.
  - **Market-making simulator:** a hidden value is really drawn (two dice, ten flips or three cards), and you quote against a bot that trades on a noisy signal. L1 is uninformed bots with no information; L2 adds reveals and some informed bots. Your position is marked to the true value, with a width penalty, and the review shows each quote against the fair value at that point. A game takes under three minutes.
  - **Spaced repetition:** after each card choose Again, Hard, Good or Easy, with the next interval shown. Using a hint or missing the answer caps it at Hard. Due cards come first in drills and show on the plan.
  - **Simulator levels 3 and 4:** L3 has sharper bots, so one-way flow is information. L4 adds a position limit and 5 seconds per quote, with a cost for each breach or missed quote.
  - **Mastery by tag:** a heatmap on the plan page, the three next best drills, and your streak.
  - **Python drills run in the browser** against hidden tests with numpy and pandas (about 12 MB more the first time). These include direct look-ahead checks, such as nothing being earned on the day a signal turns on.
- Leaving the Coding screen during a run can no longer throw an error.

## 0.37.0

- **Citadel SSE prep** (Interviews → Citadel SSE prep): one place to train for the Quantitative Trading, Semi-Systematic Equities phone screen.
  - **54 questions in nine tracks,** including two new ones, statistics and regression (12) and equity quant (7), filterable by track and tag. They live in `content/*.md` in the `theo-content-v1` format; `node tools/import-content.js` parses them, reports any errors and regenerates `www/js/sse-content.js`. A test fails if the two ever differ.
  - **Answer checker:** integers, decimals, fractions, percentages and expressions such as `sqrt(2)/2` or `0.05*sqrt(252)`, read by a small parser that never runs what you type. Conceptual questions go reveal, then self-grade (Correct, Partial, Missed).
  - **Question cards:** attempt, hint 1, hint 2, submit, solution, with a timer against each question's target. Going over is shown but isn't a fail.
  - **Every attempt is logged** with its time, hints and tags, and is included in backups.
  - **Plan page:** a countdown to the interview, readiness, and attempted, correct and mastery for each track. Mastery weights recent attempts, counts speed against the target, takes off for hints, and counts untried questions as zero.
  - Every numeric answer is re-derived independently in Python in CI (research/verify_sse.py).

## 0.36.0

- **Flow training for Zetamac's + and −** (Mental maths → Flow training). For the gap between answers that come instantly and ones you have to work out.
  - **Where you slow down:** every + and − answer from Zetamac and the new drills is sorted into eight kinds of sum: adding with and without a carry, adding a number ending in 8 or 9, adding past 100, and the same four for subtracting. A table shows your typical time on each and how often you were automatic (under 1.3 s) or in thinking mode (over 2 s). Zetamac's results screen now shows the split for that game.
  - **Rhythm drill (2 minutes):** a bar empties at your pace. Three answers in a row on the beat quicken it; one behind the beat eases it, so you practise at the edge of your fast mode, keeping up about four times in five. Skip anything that makes you stop and think; the drill reports which kinds of sum broke the rhythm.
  - **Method drill:** a faster method for one kind of sum (such as counting up for borrow subtractions, or rounding 39 to 40 and giving 1 back), four guided sums showing the worked steps, then ten timed ones, compared with your time before.
  - A 10-minute routine using both, and what to do mid-game when you catch yourself narrating the sum.

## 0.35.0

- **Coding: LeetCode links.** 14 of the 18 coding problems now link to the matching problem on LeetCode, so you can submit it there too. Three are the same problem (LRU Cache, Design Circular Deque, Number of Days Between Two Dates); the rest are close relatives that practise the same idea, such as Number of Ways to Arrive at Destination for counting shortest routes, or Design a Food Rating System for a heap with lazy deletion. Each link says how LeetCode's version differs, and marks the two that need LeetCode Premium. They unlock once you've solved the problem here, so you meet it fresh first.

## 0.34.0

- **Coding (SWE)** (Practise → Coding): software engineering interview practice, starting with Optiver's software engineering internship.
  - **18 problems** built from candidate reports (Glassdoor and LeetCode Discuss, 2020–2026), each our own version with the reported task: the long class-design problems Optiver's online assessment is known for (a worst-trade tracker, supermarket checkout queues, a ticket feed, a log monitor, truck position updates, a numbers-station decoder, a heaviest-in-the-tent heap with lazy deletion, prices after dividends, a limit order book, a shortest route with error codes, a tree from pairs with error codes), data structures from technical rounds (a deque on a fixed array, an LRU cache, peak live orders), two debugging exercises (a position and P&L tracker, a slow and wrong order matcher), and two warm-ups.
  - **Run your code here**, in Python or JavaScript. Run the examples, then submit against every test: hand-written edge cases, 25 random cases and a large case whose time limit is a multiple of the reference solution's time on your own device. Failures show the calls up to the first wrong answer, with what came back, the error and anything you printed. Code runs in a web worker, so an endless loop is stopped rather than freezing the app. Python is Pyodide, downloaded once (about 13 MB).
  - Each problem has three hints, a worked solution with its cost and the usual trap, and reference solutions in both languages. Your code is saved as you type.
  - **Knowledge quiz**: 20 multiple-choice questions in 20 minutes on data structures, algorithms, operating systems, concurrency, networking, C++, Python and databases, like the "coding knowledge" part of Optiver's online assessment, from a bank of 45. Answers and explanations at the end; questions you got wrong come back more often.
  - **How Optiver's SWE internship interviews run**, summarised from 2022–2026 candidate reports, and six talk-through questions added to the Optiver interview questions: designing a low-latency trading system, designing a ticketing system, a queue on an array (and between two threads), TCP against UDP for market data and orders, Python against C++ and Java, and the behavioural questions SWE candidates report.
  - Every problem is checked in CI: the JavaScript reference against every case, and the Python reference and a brute-force Python version against the same cases (research/verify_code.py).
- Wide code no longer widens the page on phones.

## 0.33.0

- **Weak spots** (My prep → Weak spots): an adaptive learner that finds your weakest interview skills and trains them.
  - **One estimate per area, pooled from everything you've done:** topic drills, interview questions (a hint counts as part credit, an "unsure" flag as a miss), handbook checks, mental maths by question type, market-making results, and its own sessions. There are nine areas, from mental maths and counting to market making and options.
  - **Honest with little data:** each estimate is (right + 1) ÷ (answered + 2), so two lucky answers don't read as mastery. Areas you haven't tried say so.
  - **12-question sessions** go to the area with the most to gain: low estimate, little evidence, and (with an interview plan) how often that firm asks about it.
  - **Difficulty follows you within an area:** handbook check → drill → interview question. A miss steps down and usually brings the area straight back; two right in a row steps up, then rests it. Market making uses the phone-screen markets with reveals.
  - The coach recommends your weakest area, and interview plans include a session most days.
- **10 more Citadel questions** from candidate reports (Glassdoor and Wall Street Oasis, 2022–2026), each with hints, a worked solution and a Python check:
  - making a market on heads in 100 flips, then 10,000
  - the expected number of uniform draws to pass 2
  - a uniform point on a disk (and the √U trap)
  - Bayes with a bag of stones and a bet on the next one
  - meeting at a station within 10 minutes
  - P(X > 0 | X + Y > 0) and E[X | X + Y > 0] for normals
  - convolution of uniforms
  - a long-vega, short-gamma position
  - regression assumptions and ridge vs lasso
  - Citadel's reported behavioural questions
- Citadel's "die cubed" question gains a reroll follow-up (worth 635/6).

## 0.32.0

- **Phone-screen mock** (Interviews → Phone-screen mock): a full first-round interview, timed part by part, in the order a 45–60 minute trading phone screen runs:
  1. Introduce yourself (5 min): your saved answer, spoken against a timer, then a self-check
  2. Mental maths (10 min): ten trader-style questions (percentages, % moves, fractions as decimals, products, squares, compounding)
  3. Probability and expected value (15 min): four interview questions, the firm's own first, ones you haven't done before
  4. Market making (10 min): two markets where the interviewer trades with you and then **reveals information** ("the first die is a 1"), and you re-quote. Scored on centring, width, leaning with the trade and updating on the reveal, with the fair value, SD and the P&L of your position explained after each one.
  5. Behavioural and your questions (5 min)
- Every part can be practised on its own; full runs are saved and listed. Firm pages link to it, and the Citadel plan schedules it every other day.
- **Stories**: write your answers to the questions with no number at the end, field by field (STAR for experience questions), with a word count, the spoken length, and a rehearsal timer. Prompts include "tell me about yourself", "why trading", "why this firm", "which market do you follow?" and "pitch me a trade". Saved with your progress and included in backups. Interview plans now remind you to write the first three.
- **Citadel profile** rewritten from Citadel's own pages:
  - Citadel (the investment manager, five strategies) and Citadel Securities (the market maker) are separate firms.
  - The Investment & Trading internship is at Citadel.
  - What its posting asks for: in-depth knowledge of a financial market, statistics under uncertainty, and some programming.
  - The phone-screen format.
- **Two classic questions:** the square of a die roll (and its gap to 3.5², the variance), and two 6s in a row against a 6 then a 5 (42 against 36). Both have hints, worked solutions and Python checks.

## 0.31.0

- **Handbook Part 2: Interview probability** is written. It has seven chapters on the techniques behind most interview puzzles:
  1. The distributions you need (binomial, geometric, Poisson, normal)
  2. Symmetry and clever counting (indicators, linearity, equal gaps)
  3. First-step analysis (turn-taking games, coin patterns, deuce)
  4. Markov chains (long-run shares, expected time to absorb)
  5. Random walks and martingales (gambler's ruin, expected duration, biased walks)
  6. Optimal stopping and dynamic programming (rerolls, costly tries, the secretary problem)
  7. Continuous probability and geometry (probability as area, order statistics, broken sticks)
- **32 new "check yourself" questions** with hints and worked solutions. Every answer is re-derived in Python.
- **Six new interactive tools:**
  - a distribution explorer
  - a coin-pattern race (simulated against the exact wait)
  - a two-state Markov chain
  - a gambler's-ruin simulator with sample paths
  - a reroll-game solver
  - random points in the unit square for probability as area
- The tools' starting values never give away a check's answer.

## 0.30.0

- **The Handbook** (Learn → Handbook): a course from the basics up to everything quant trading interviews test, to work through chapter by chapter. Five parts and 21 chapters are planned; **Part 1 (Foundations) is written**:
  1. Numbers, fractions and fast arithmetic
  2. Counting
  3. Probability basics
  4. Conditional probability and Bayes
  5. Random variables and expected value
  6. Variance, covariance and correlation
- Each chapter has goals, short explanations with worked examples, **interactive tools** (a counting calculator, a dice simulator against the exact distribution, a Bayes slider in natural frequencies, the law of large numbers, the √n rule), and **36 "check yourself" questions** with hints and solutions. A chapter is done when all its checks are right; progress is saved and shown on the handbook page. Chapters end with key takeaways and links to the matching practice and interview questions.
- Parts 2–5 are outlined with what each chapter will cover and links to existing practice in the meantime.
- Every check's answer is re-derived in Python like the interview bank. The handbook is in search, the sidebar, More, the welcome screen, and the coach (which suggests the next chapter to newcomers and to anyone part-way through).

## 0.29.0

- **Answers audited for interview-sized working.** Every one of the 243 parts was checked against "could you get this at a whiteboard in a few minutes, and does the solution show how?". Most could. Changes:
  - **Removed as a scored part:** Wincent's Threes (c), the full five-dice expected score, which needs a computer. It's now an "interviewers may push further" follow-up asking for the strategy instead.
  - **Shorter routes in the worked solutions:** HRT's "3 before 6" (the first 3-or-6 takes 3 rolls, then a fresh 6 takes 6: 9, instead of summing a series); DRW's bottom card (H₅₁ ≈ ln 51 + 0.577); IMC's spaghetti (½ ln n + ln 2 + γ/2 instead of adding 100 fractions); Five Rings' arc length (81 plus two small corrections instead of asinh); the birthday problem (1 − e<sup>−253/365</sup>); Jane Street's d30 v d20 (closed-form sums); the Kelly log-growth (ln(1 + x) ≈ x − x²/2); the d12 follow-up ((13/12)⁵ ≈ e<sup>0.4</sup>).
  - **Approximations now marked right:** the rule of 4 for poker outs, ±2σ ≈ 95% for the coin ranges, the birthday and bottom-card approximations, and the arc-length estimate. A new test checks that each solution's quick method is accepted.

## 0.28.1

- **One-operation Zetamac is adjustable:** the "+ only", "− only", "× only" and "÷ only" games use the ranges and duration from Zetamac's Settings. On default ranges each keeps its own best; with custom settings they count as custom games, so bests stay comparable.

## 0.28.0

- **One-operation Zetamac** for targeted practice: "+ only", "− only", "× only" and "÷ only" buttons on the Zetamac card. Each is a normal 2-minute game on Zetamac's default ranges, restricted to one operation, with its own personal best shown on its button. Slow questions still come back as speed reps, and the interview plan counts these games as Zetamac practice.
- **Zetamac flashes green when an answer is accepted.** The next question appears instantly, so it was easy to wonder whether the last answer counted. The answer box (and the score) now flash green for a moment on every correct answer, in every theme. With "less motion" on, it's a brief static highlight instead of a fade.

## 0.27.0

- **35 more reported interview questions** (189 in all, 25 firms), from candidate reports on Wall Street Oasis for Jump, HRT, DRW, Old Mission, Belvedere, Virtu, Da Vinci, Maven, Squarepoint, Akuna, IMC, Five Rings, Jane Street and three firms new to Theo: **Tower Research, D. E. Shaw and Mako**. Highlights: Jump's red-card stopping game and one-pass bubble sort, DRW's random rook (70 moves) and chord crossings, Old Mission's three-in-a-row chess match (86/99) and the tetrahedron containing the centre of a sphere (1/8), Belvedere's non-transitive dice and the drunk passenger, Tower's correlation bounds, IMC's tied spaghetti, and D. E. Shaw's biased coin down to its entropy limit.
  - Every one has 3+ hints, a structured worked solution, and an answer derived independently in Python (240 values now cross-checked). Writing the checks caught one bug in the checking code itself (a chord-crossing count that assumed sorted endpoints), not in the app.
  - Where a report gives no numbers or leaves a rule out, the numbers and assumptions are ours and the question says so.
- Searched also: Glassdoor (already covered by your collection), Reddit and Blind (not readable here; search snippets only, nothing specific and new), and prep sites, which mostly label their questions as unverified. Those weren't used as sources.

## 0.26.0

- **Auto-backup to a file** (Chrome and Edge on a computer): More → Your data → Keep your progress safe → Choose a backup file. Pick a location once (Documents, OneDrive…) and Theo rewrites that file a few seconds after every change. Clearing browser data, a clean-on-exit setting or a cleaner app can't touch it; restore with Import. If the browser asks for permission again after a restart, a Resume button appears.
- **Your progress's safety, shown:** whether the browser has agreed not to clear Theo's data, and when you last exported.
- **Backup reminder:** with three or more days of progress and no copy outside the browser for a week, the coach suggests making one. Exporting counts.

## 0.25.0

- **Progress can no longer be overwritten by an older copy of the app.** A tab left open across an update (or a cached install) runs the old code, which doesn't know about newer fields, such as the ✓/? marks added in 0.22, and dropped them when it saved. Two open tabs share progress, so that could wipe marks made in the new version. Every save now records the version that wrote it; an older copy that sees newer data stops saving and shows "A newer version of Theo is open. Reload." (Copies from before this release can't be fixed retroactively, so reload any old tabs once.)
- **Automatic backups** (More → Your data → Automatic backups): a copy of your progress each day you use Theo, and before anything that replaces it (reset, import, sample data, restoring). The last 10 are kept on the device; each shows its date, days practised and interview questions, with a one-tap Restore. Restoring backs up the current progress first, so it can be undone. If saved progress is ever unreadable, it's backed up before anything is saved over it.
- **"See it with sample data"** is only offered when there's no progress of any kind (before, progress only in mental maths, formula cards or games didn't count), and it backs up first anyway.
- Reset now says a backup is kept, rather than "this cannot be undone".

## 0.24.0

- **Rewritten worked solutions for every numeric interview question** (197 parts). Each now has the same shape: the **key idea** in one sentence, **numbered steps** ending with the answer in bold, a quick **check** you can say out loud (a limiting case, a second method, a sanity bound), and the common **trap** (the wrong answer people give, and why), where there is one. They appear everywhere a solution does: the question page, firm guide pages, the mistakes deck, mock interviews and Think aloud.
- A new check makes sure every solution states its part's answer, so a solution can't silently disagree with the answer the app marks against. Writing the solutions turned up one: the vega question's solution said the call "loses $0.40" while its answer is −0.40; it now says so with the sign.

## 0.23.0

- **Hints for every interview question:** 726 hints across all 216 parts of the 154 questions (3–5 each), revealed one at a time with "Hint (1 of 4)". They build from a nudge (what to look at) to the method and the set-up, but never the answer: a test checks that no hint contains its part's answer, that every part has at least three, and that every hint belongs to a real question. They're on the question page, on open-ended and behavioural questions, in mock interviews and in Think aloud (labelled by part).
- **Answers found with hints count, but stay unsure:** the result says "with 2 hints", and the question stays flagged unsure until you get it right unaided (or tick it off yourself).
- A question's status now updates the moment you answer, not after you press "Next question".

## 0.22.0

- **Tick off interview questions, or flag them unsure.** Every question now has a status: done, unsure or to do. Tick it (✓) or flag it (?) from the list or the question page; pressing the same button again clears it. Answering every part correctly ticks it for you and getting a part wrong flags it unsure, but your own choice always wins. The list has a progress bar (done and unsure), filters for To do / Unsure / Done, and done counts on each firm's chip. The sidebar shows how many are unsure, the question page links to the next unsure one, and the coach brings them up. Statuses are saved with your progress and survive export and import.
- **20 more questions** (154 in all):
  - 16 classic puzzles that prep books and interviewers draw on (Monty Hall, birthday problem, secretary problem, Buffon's needle, derangements, ballot theorem, 100 prisoners, Pólya's urn, Newton–Pepys, base rates, egg drop and more), written in our own words with our own solutions and a public reference for each. They're labelled as practice questions, not reports from a firm. Nothing is copied from the Green Book or any other book.
  - 4 reported questions that were named without rules, now answered with the standard rules stated: Virtu's clock-hands and hundred-doors puzzles, Tibra's pirate vote (5 and 7 pirates; Tibra is a new firm), and Akuna's St Petersburg lottery with a realistic payout cap.
  - Every answer is re-derived in Python (194 values now).
- **Safer import cleaning:** formatted text in an imported progress file is now rebuilt by a small tokenizer instead of the browser's HTML parser, so untrusted markup never reaches a document at all. Allowed formatting (bold, superscripts, lists…) is kept; every other tag and attribute is dropped. The old method was already safe (nothing ran), but Chrome 156 started reporting security-policy warnings when it parsed handler attributes, even inertly. The same code now runs in the Node tests, which previously only saw plain text.
- Ticked and flagged questions are marked with a coloured edge instead of being faded, which kept text below the contrast standard.

## 0.21.0

- **91 more reported interview questions, from 8 more firms** (134 in all, 21 firms). Taken from a curated collection of public Glassdoor trader-interview reports, paraphrased, each linked to its report. New firms: Hudson River Trading, Jump, Eclipse, Old Mission, Belvedere, Squarepoint, Valkyrie and Virtu, each with how they interview (as reported) and a firm guide page.
  - Every numeric answer is derived independently in Python (`research/verify_results.py`, now 167 values), and 74 questions also have a simulation check. Candidates' own answers were never used as the key.
  - Where a report leaves something out (the amoeba's offspring rule, whether socks are replaced, how "doubles are cancelled"), the assumption is stated on the question, and where the reading changes the answer (the two-child problem, "one coin is heads") both readings are answered.
  - Reports missing too much to answer (no numbers, missing game rules) were left out rather than guessed. So were questions already in the app, and one question whose source pointed at a forum post rather than the firm's report.
  - **Behavioural questions** for 11 firms ("Why SIG?", "a time things didn't go as planned", "explain your trading mistake"), with a structure to aim for. They work in Think aloud.
- **Mock interview button** now shows how many questions it will really ask, and offers the all-firms mock for firms with fewer than three numeric questions.
- The browser checks page now fails if any script fails to load, instead of quietly skipping its checks.

## 0.20.0

- **Free topic guides** (`/topics/`): a plain page for each of the 15 topics with its key results and a worked example of every question type (one per skill the coach tracks), plus an index. Like the firm guides, they're generated from the app's own content on every deploy, so they never drift, and search engines can index them. Examples use fixed seeds, so a page only changes when its generator does. Linked from the sidebar (Learn), More, the Practice page and the firm guides.
- **Guide pages read better:** exact answers with recurring decimals show as fractions ("4/13 ≈ 0.30769"), and follow-up questions are no longer labelled "our follow-up" twice.

## 0.19.0

- **Search** (`#/search`, or press `/` on a keyboard): one box across interview questions (including their follow-ups), topics, formula cards (the formula shows in the result), speed tricks, case studies and the app's own screens, so "ants", "kelly" or "zetamac" goes straight there. Every word must match; title matches rank first. Results update as you type and the address is shareable (`#/search/kelly`). In the sidebar under Home and at the top of More on phones.
- **Fixed stale counts:** the coach offered a "14-question diagnostic" and the tour said "Fourteen topics" when there are 15. These now count from the data, as does the number of speed-trick guides.

## 0.18.1

- **Phone number pad fixed:** keys now run in phone order (1 2 3 on top, 0 at the bottom) instead of calculator order, and are bigger. Each screen shows only the keys its answers can need: Zetamac has just digits and delete (answers are accepted automatically, so no Enter); estimation and market making add a decimal point; practice questions keep minus, fraction and percent.

## 0.18.0

- **New name: Theo** (formerly Quant Trainer), after the trader's word for theoretical value. New icon (a serif θ on the notebook's ink and paper) and share image.
- **New address:** https://pingadom.github.io/theo/ (the repository moved to `pingadom/theo`). Progress saved in the browser carries over, because it's stored per site and the site is unchanged; the storage key keeps the old name for that reason. The Android app keeps its package ID, so installed copies update as normal.

## 0.17.0

- **Free firm guide pages** (`/firms/`): a plain page per firm with how its process runs and every question with a hidden worked solution, plus an index. Search engines can index them (the app itself is one page to them). They're generated from the interview bank on every deploy (`tools/firm-pages.js`), listed in the sitemap, and linked from the app.
- **Challenge a friend at Zetamac:** every game on the default settings uses a question list fixed by a short code, so "Challenge a friend" sends a link with exactly the same questions and your score to beat. No server or account needed.
- **Formula cards:** 43 results to know cold (probability, statistics, trading rules of thumb, useful constants) as flip cards on a spaced schedule (1, 3, 7, 21, then 60 days). Space to flip, 1/2 to grade. In Learn, the ticker and the coach.

## 0.16.1

- **Reorganised navigation.** The sidebar is now five groups by what you want to do: **My prep** (interview plan, daily challenge, coach, progress, roadmap), **Learn** (topics, speed tricks, case studies, stats lab), **Practise** (mixed practice, mistakes, mental maths, online tests), **Interviews** (questions, mock interview, think aloud) and **Trading games**. Each group folds away and the app remembers which you've folded; the group you're in always stays open. Mock interview has its own entry. The phone's More page uses the same groups, and the bottom tabs highlight the matching group.

## 0.16.0

- **Zetamac replaces the 2-minute sprint.** It uses Zetamac's default settings: addition (2–100) + (2–100), subtraction as addition in reverse, multiplication (2–12) × (2–100), division as multiplication in reverse, 120 seconds. As on arithmetic.zetamac.com, an answer goes through the moment it's right, with no Enter key. All settings can be changed (operations, ranges, duration), with a one-tap reset to the defaults. Default-settings and custom bests are kept separately.
- Slow Zetamac questions get the same end-of-game review as 80 in 8, with the fast method and its guide. The question you were stuck on when time ran out is included. Slow question types join your spaced speed reps. The ticker, progress chart, roadmap milestone and interview plan now use Zetamac.
- Fix: number boxes inside checkbox rows were squashed to checkbox size.

## 0.15.1

- **Wincent, from the full Glassdoor reports:** four more questions candidates report: the hat of $1, $10 and $100 bills where you call "stop" and take the next bill (a martingale: no strategy beats $2.70), dice rolled until the total passes 100 (estimate the final total and the number of rolls), a stick broken at two points forming a triangle, and estimating the number of primes below a million. The cube-walk and ants questions are now marked as reported (the ants version uses 500 ants, as described). The firm profile adds what candidates say about each stage, including first interviews that end early after a weak first answer.
- 63 answers are now derived independently in Python and checked against the app, including the hat game solved as an optimal-stopping problem.

## 0.15.0

- **Interview prep plan:** choose the firm and the date; get a short checklist for each day until then, weighted to what that firm is reported to test (its topics, two of its questions a day, mental maths where it screens for it, its kind of trading game, and a mock interview plus a spoken answer every third day and the day before). Tasks the app can see you did tick themselves. A countdown sits on the home screen, the coach puts today's prep first, and afterwards it asks you to add the questions you were asked.
- **New topic, Markov chains & order statistics:** hitting times on a polygon, waiting for k in a row, two-state stationary distributions, order statistics of uniforms and branching-process extinction (themes listed for several firms' online tests), each checked by simulation.
- On phones, the 7-day accuracy chart sits under the greeting instead of beside it.

## 0.14.2

- **iPhone:** the install note explains that the home-screen app keeps its own progress (export from Safari, import in the app); the app now asks the browser to keep saved progress persistent; the launch screen and app colours match the Notebook theme.

## 0.14.1

- **Fix:** rows of tags and filters that wrapped onto a second line (interview-question firm filters, case-study tags) spilled over the content below. The Figgie chip-stack style had reused the `.chips` class name and fixed its height. The chart legend had likewise reused the skill map's `.legend`; both now have their own names.
- **Layout audit in CI:** every screen, in every theme, on desktop and phone, is checked for overlapping boxes (including content spilling out of its container), sideways scrolling and text clipped inside buttons (`tests/layout-audit.js`).

## 0.14.0

- **Speed reps:** a mental-maths question type with two or more slow or missed answers in a run is scheduled for a short timed set of 8 questions of just that type. Pass (at most one miss, median under your threshold) and it comes back after 3, then 7, then 21 days before graduating; miss and it's back tomorrow. Due reps appear on the mental maths page, in the ticker and as a coach recommendation.
- **Tour:** a seven-step walkthrough of the app, offered on the welcome screen and from More.

## 0.13.0

- **Wincent:** a firm profile from Wincent's own careers pages (online maths test, 45- and 90-minute quant interviews, on-site betting games in Bratislava) and candidate reports, with the two questions candidates report (table tennis from 10–10 at 40% a point; Conroy's game of Threes, of which a "tricky variant" was asked) and five practice questions, labelled as such, on the topics listed for its online test: a random walk on a cube, branching-process extinction, ants on a string, Bayesian updating and Kelly betting.
- **More reported questions:** Optiver (every face once in six rolls; a three-card stopping game), IMC (first head wins given B won; a random walk to −100 before +50), Akuna (a fair decision from a 70/30 coin), Da Vinci (picks until the third outlier), DRW (expected heads × tails), Jane Street (four coins with one re-flip). New firms: Wincent, Akuna, Da Vinci, DRW.
- Every new answer is derived independently in Python (absorbing Markov chains, exact enumeration, dynamic programming, strategy search) and checked against the app in CI: 58/58 agree.

## 0.12.0

- **The coach uses everything:** mental-maths speed is now remembered by question type across sessions, and your slowest or most-missed type gets a recommendation pointing to the speed trick that fixes it. The coach also reacts to the trading games (losing at Figgie, not moving your market after a trade, sizing bets well below Kelly), suggests games and online tests you haven't tried, and nudges you to answer out loud once you've typed a few interview answers.
- **Mental maths:** a "speed by question type" table (median time and miss rate over your last 30 of each, with the guide for each type).
- **Progress:** a "This week" summary against the week before: questions answered, accuracy, days practised, daily challenges, best 80-in-8 run and Figgie result.
- **Figgie on phones:** the card and prices sit side by side, so all four suits fit on one screen.
- The coach's voice keeps skill names as written ("AR(1)", "Sharpe").

## 0.11.0

- **Themes:** four looks, chosen under More → Appearance, each a full set of colours and type: **Notebook** (paper and ink on faint graph lines, serif headings, monospaced numbers; the default by day), **Night desk** (the same after hours; the default in dark mode), **Chalkboard** and **Terminal**. "Match system" switches between Notebook and Night desk with the device. The theme is applied before the first paint, follows into the Android status bar, and every theme passes WCAG AA contrast checks in CI.
- **Typefaces:** Newsreader, IBM Plex Sans and Mono, and Kalam, self-hosted (SIL Open Font Licence) so they work offline and under the Content Security Policy.
- **Signature details:** a ticker tape of your own numbers across the top (streak, accuracy, 80-in-8, calibration, Figgie, daily…, with ▲▼ moves); numbers that roll into place; ink stamps for milestones (3 in a row, mastered, new best, perfect daily, Figgie win); the coach's voice ("You're short Bayes: 0 of your last 4. Cover it."); a candlestick chart of your accuracy over the last week; split-flap digits; real die faces, card faces and chip stacks in the games; and an optional closing bell. Animations follow the system's reduced-motion setting and can be switched off; sounds are off by default.
- **Mental maths review:** every answer is timed. After each run, questions slower than your threshold (6 s by default, adjustable) and missed ones come back with the fastest way to do that exact question, worked on its own numbers, and a link to the guide that teaches it. A table shows your average time by question type, and one tap starts an untimed drill on the types that slowed you down. Each worked method is checked in tests to reach the right answer.

## 0.10.0

- **Figgie:** Jane Street's card trading game against three bots: a careful Bayesian, an aggressive one that leans with order flow, and a noise trader. Real-time, 2 or 4 minutes, with "Show the maths" giving the exact posterior from your hand.
- **Make me a market:** quote a two-sided price on an unknown quantity; the interviewer (who knows the answer, and is right 7 times in 8) trades against you and asks for a new market. Scored on whether your final market contains the answer, P&L, and whether you moved with the flow.
- **Bet sizing:** 20 bets with known odds; choose your stake. A Kelly and a half-Kelly bettor play the same bets beside you, and the sizing score uses expected log-growth so it doesn't depend on luck.
- **Daily challenge:** the same 5 questions for everyone each day, generated from the date (no server), one attempt, timed, with a shareable result and daily streak.
- **Online tests:** timed number sequences, digit span and running total.
- **Think aloud:** answer a reported question out loud against the clock, optionally recording yourself (kept on the device) with a live transcript showing pace and filler words, then compare with the worked answer and follow-ups and score yourself.
- **Progress:** charts of accuracy and speed over time, 80-in-8, calibration and every game; an activity heatmap; speed against target by topic. The demo profile now includes histories.
- **Fix:** "Back" on a game's results screen (estimation, 80 in 8 and the new games) did nothing, because it linked to the URL you were already on. Links to the current screen now re-open it.
- **Tests:** Kelly optimality, Figgie posterior calibration and card/chip conservation over full bot games, daily-challenge determinism, fill informativeness, schema validation of the new data, and end-to-end and accessibility checks for every new screen.

## 0.9.0

- **Speed tricks:** 20 short guides to faster mental arithmetic (× 5/25/125, × 9/11/99, squares ending in 5, squares near 50 and 100, difference of squares, near-100 multiplication, halve-and-double, complements, fractions as decimals, missing-number questions, percentage shortcuts, last-digit and casting-out-nines checks, estimation, when to guess under negative marking, numbers worth memorising), each with a 10-question drill whose solution walks through the trick.
- **80-in-8 in multiple choice or typed** (with Pass −1); separate personal bests.
- **Answer parsing:** decimal commas (`0,5`, `1.250,5`), mixed numbers (`1 1/2`, `1½`), Unicode minus signs and `½`-style fractions are understood; `5/0` and other infinities are rejected instead of graded.
- **Robustness:**
  - Malformed or unknown links no longer crash the router or leave a blank list.
  - Any screen error shows a recovery message.
  - Two open tabs now share progress instead of overwriting each other.
  - Saved data is schema-validated on load.
  - A mid-review state reload can't delete the wrong mistake card.
  - Ctrl+1 no longer answers an 80-in-8 question.
  - Typed answers are escaped on the results screen.
- **Fair shuffles:** the old `sort(() => Math.random() - 0.5)` put the right 80-in-8 answer in the last position only ~18% of the time. All shuffles now use Fisher–Yates, with a statistical test.
- **Tests:** parser edge cases, trick drills checked against plain evaluation, option-position uniformity, broken links, cross-tab sync, and a seeded monkey test through the whole app. `npm run serve` uses a no-cache dev server so edits always load.

## 0.8.0

- **Coach picks questions with an Elo ability model**, chosen by an out-of-sample study of seven learner models ([research/REPORT.md](research/REPORT.md)). Existing progress is migrated from answer history.
- **Research:** the learner-model study, plus independent Python verification of every interview answer, cross-checked against the app in CI.
- **Security:** imported progress files are schema-validated and sanitised; Content Security Policy; scripts load with `defer`.
- **Accessibility:** colours pass WCAG AA contrast in light and dark modes; axe checks in CI.
- **Quality:** the app is split into view modules; ESLint, Playwright end-to-end tests (desktop and phone, including offline), and Lighthouse CI.
- **Demo profile** (`?demo`) for exploring the coach without practising first.
- Play Store signing pipeline, privacy page, optional cookie-free analytics, MIT licence.

## 0.7.0

- Clearer UI: welcome screen with one first step, an "Up next" home screen, the answer result always visible on phones, and grouped navigation.

## 0.6.0

- Coach: 79 named skills, error-type diagnosis, ranked recommendations, diagnostic, drills, skill map, responsive sessions.

## 0.5.0

- Mistakes deck with spaced repetition; estimation and calibration game; accessibility pass.

## 0.4.0

- Website + Android app from one codebase; cloud APK builds; platform layer.

## 0.3.0 and earlier

- Interview bank with sourced, reported questions; case studies; options, puzzles and sequences topics; mobile UI; first release.
