# Changelog

## 0.23.0

- **Hints for every interview question:** 726 hints across all 216 parts of the 154 questions (3–5 each), revealed one at a time with "Hint (1 of 4)". They build from a nudge (what to look at) to the method and the set-up, but never the answer: a test checks that no hint contains its part's answer, that every part has at least three, and that every hint belongs to a real question. They're on the question page, on open-ended and behavioural questions, in mock interviews and in Think aloud (labelled by part).
- **Answers found with hints count, but stay unsure:** the result says "with 2 hints", and the question stays flagged unsure until you get it right unaided (or tick it off yourself).

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
