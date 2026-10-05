# Changelog

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
