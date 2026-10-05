# Changelog

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
