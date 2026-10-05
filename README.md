# Quant Trainer

**Interview practice for quant trading: probability, statistics, mental maths and market making, with an adaptive coach and real questions candidates report from trading firms.** It runs as a website and an Android app from one codebase.

[![Quality](https://github.com/pingadom/quant-trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/pingadom/quant-trainer/actions/workflows/ci.yml)
[![Deploy](https://github.com/pingadom/quant-trainer/actions/workflows/deploy.yml/badge.svg)](https://github.com/pingadom/quant-trainer/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/github/v/release/pingadom/quant-trainer)](https://github.com/pingadom/quant-trainer/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**[Open the app](https://pingadom.github.io/quant-trainer/)** · **[Explore with sample data](https://pingadom.github.io/quant-trainer/?demo#/coach)** · **[Android APK](https://github.com/pingadom/quant-trainer/releases/latest)** · **[Research report](research/REPORT.md)**

![Home screen with the coach's next recommendation](docs/screenshots/desktop-home.png)

| Coach and skill map | A reported interview question | On a phone |
|---|---|---|
| ![Coach](docs/screenshots/desktop-coach.png) | ![Interview question](docs/screenshots/mobile-interview.png) | ![Phone home](docs/screenshots/mobile-home.png) |

## Technical highlights

- **A learner model chosen by out-of-sample evaluation.** The coach estimates your chance of answering each of 79 skills. I compared seven models (per-skill Beta, Elo, Bayesian Knowledge Tracing, Performance Factor Analysis and others) prequentially on simulated learners, with two structurally different ground truths and bootstrap CIs. The original per-skill estimate turned out to be biased by the app's own question selection. Elo beat it under both truths (log loss −0.046 and −0.024, 95% CIs clear of zero) and now drives the coach. → [research/REPORT.md](research/REPORT.md)
- **Every answer checked twice, by different methods.**
  - In the app, Monte Carlo simulations are tested against the exact answers within 5 standard errors.
  - In CI, a separate [Python derivation](research/verify_results.py) of every interview answer (exact fractions, the Bellman equation, Markov chains, a linear program for a poker game) must match what the app serves: **35/35 agree**.
  - This caught a widely circulated wrong answer to a reported Jane Street question (10.2; the correct value is 8.15).
- **Diagnoses the kind of mistake, not just whether you were wrong.** Wrong answers are classified as complement slip, percent vs decimal, factor of 2, variance vs SD, rounding, and so on, and the advice targets that slip. Missed questions return on a spaced-repetition schedule.
- **One codebase, website + native app.**
  - Plain HTML/JS with no build step, deployed as an offline-capable PWA.
  - Wrapped with [Capacitor](https://capacitorjs.com/) for Android and iOS. CI builds the APK and a signed Play Store bundle.
  - Platform differences (storage, export, back button) live in [one module](www/js/platform.js).
- **Engineering hygiene.**
  - ESLint; unit tests run in Node and the browser.
  - Playwright end-to-end tests on desktop and a touch phone, including offline mode.
  - axe accessibility checks and WCAG AA colour contrast; Lighthouse in CI.
  - A Content Security Policy, and schema validation that stops an imported progress file from injecting script.

## What's inside

| | |
|---|---|
| **Coach** | Tracks 79 skills, diagnoses error types, ranks what to practise next with reasons, and offers a 14-question diagnostic and one-tap drills. |
| **Practice** | 14 topics and 79 randomised question generators with worked solutions and a "check by simulation" button. Adaptive mixed practice. |
| **Interview questions** | 24 questions candidates report from Jane Street, SIG, Optiver, IMC, Citadel, Five Rings, Two Sigma and Flow Traders, each sourced, with follow-ups and a timed mock-interview mode. |
| **Mistakes to review** | Every wrong answer comes back after 1, 3, 7 and 21 days until mastered. |
| **Mental maths** | The "80 in 8" format with net scoring, answered as multiple choice or typed, plus a 2-minute sprint. |
| **Speed tricks** | 20 short guides to faster arithmetic (near-100 multiplication, squaring, fractions, last-digit checks, guessing strategy under negative marking…), each with a drill that walks through the trick. |
| **Market making** | Quote on hidden dice against informed and noise traders. |
| **Estimation & calibration** | Range quoting on 43 fact-checked quantities; checks whether your 90% ranges really contain the answer 90% of the time. |
| **Case studies** | 14 real market events (LTCM, Black Monday, Volmageddon, negative oil, …) as statistics lessons, with sources. |

## Run it

```bash
npm run serve                     # then open http://localhost:8765/www/
```

No build step: any static file server works, and opening `www/index.html` directly works too (without offline mode).

```bash
npm install
npm test                          # unit tests: generators, simulations, security, coach
npm run lint
npm run test:e2e                  # Playwright, desktop + phone, with accessibility checks
pip install -r research/requirements.txt
npm run verify                    # Python re-derivation vs the app's answers
npm run research                  # learner-model study → research/REPORT.md
```

## How it's built

- **Code:** [`www/`](www/) is the whole app: views in `js/views/`, the coach and Elo model in `js/coach.js`, storage and input validation in `js/core.js`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Website:** every push to `main` is tested and deployed to GitHub Pages; Netlify and Vercel configs are included.
- **Android and Play Store:** tagging a version builds the APK. Releases and Play Store signing are covered in [docs/RELEASING.md](docs/RELEASING.md).
- **Privacy:** all progress stays on the device. See the [privacy notice](https://pingadom.github.io/quant-trainer/privacy.html).

## Contributing

If you've had a quant interview, the most useful thing you can add is a question you were asked. The [question form](https://github.com/pingadom/quant-trainer/issues/new?template=interview-question.yml) takes two minutes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgements

Built with AI pair-programming ([Claude Code](https://claude.com/claude-code)). Interview questions are paraphrased from public candidate reports and linked to their sources; firms' names are used only to attribute those reports.

## License

[MIT](LICENSE)
