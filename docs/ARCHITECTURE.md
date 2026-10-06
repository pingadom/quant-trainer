# Architecture

## Constraints that shaped it

- **No build step.** Plain browser scripts sharing one namespace (`window.QT`), loaded in order with `defer`. Anyone can read or run it, and the same `www/` folder is the website, the PWA and the native app's web layer.
- **No server.** All state lives on the device, which keeps the privacy story simple. It is also why the learner model can't use population data yet (see [research/REPORT.md](../research/REPORT.md)).
- **Content is code.** Questions are generator functions, not static data, so practice never runs out and every answer can be tested.

## Modules (`www/js/`)

| Layer | Files | Responsibility |
|---|---|---|
| Appearance | `theme.js` (loaded before paint), `flair.js`, `css/style.css` | Theme tokens as CSS custom properties per `[data-theme]`; ticker tape, rolling numbers, stamps, bell |
| Foundation | `config.js`, `core.js` | RNG, maths, answer parsing, the store (localStorage), schema validation of imported data, version |
| Platform | `platform.js` | Everything that differs between website, installed PWA and native app: storage mirroring, file export, back button, status bar, service worker, install prompt, analytics |
| Content | `gens-*.js`, `topics.js`, `cases.js`, `bank.js`, `estimate.js` | Question generators (84 skills in 15 topics), case studies, the interview bank, estimation facts |
| Learning engine | `coach.js`, `review.js` | Skill statistics, Elo model, error diagnosis, recommendations, adaptive sessions; spaced-repetition deck |
| UI | `ui.js`, `views/*.js`, `keypad.js`, `chart.js`, `demo.js` | Shared question card and cards, SVG line charts, one file per screen |
| Mini-apps | `mental.js`, `tricks.js`, `market.js`, `quote.js`, `kelly.js`, `figgie.js`, `daily.js`, `oa.js`, `talk.js`, `lab.js` | Self-contained games and drills. Each keeps its logic in pure functions (exported on `QT.*` and unit-tested) separate from its screen code |
| Shell | `app.js` | Hash router (`#/topic/dice` → `views.topic(main, 'dice')`), nav state, page titles, demo banner |

## Data flow for one answer

```
question source (coach.source / drill / case / bank)
   → ui.questionCard shows item.p.q
   → user answers → QT.parseAnswer → QT.isCorrect
   → item.record(ok)           topic / case / bank progress
   → coach.observe(skill, ok)  recent window, answer time, Elo update, answer log
   → mistakes.add (if wrong)   spaced-repetition deck
   → coach.classify + logError error-type diagnosis shown to the user
   → store.save()              localStorage (+ native durable mirror)
```

## State (`QT.store.get()`)

`topics`, `skills` (recent window and times), `elo` (θ, per-skill b and n), `log` (per-answer history, capped at 5,000), `errors`, `mistakes`, `cases`, `bank`, `mental`, `market`, `estimate`, `quote`, `kelly`, `figgie`, `daily` (results by date, last 400 days), `oa`, `talk`, `tricks`, `roadmap`, `days`, `demo`. Game histories are capped at 100 entries. Exported as JSON; on import, every field is rebuilt by `sanitizeState` in `core.js`.

## Notable designs

- **Daily challenge without a server.** The question generators draw from `Math.random`; `daily.js` swaps in a seeded PRNG (mulberry32, seeded by an FNV-1a hash of the date) while it builds the day's five questions, then restores it. Every copy of the app produces the same questions for the same date.
- **Figgie engine.** Pure functions over a game object (`newGame`, `post`, `buy`, `sell`, `botAct`, `payouts`) with injectable randomness, so tests play whole games and check that cards and chips are conserved. Bots value cards with the exact Bayesian posterior over the 12 possible deck layouts, P(layout | hand) ∝ Π C(suit size, cards held); the posterior is tested for calibration (E[P(true goal)] = E[Σ P²]).
- **Luck-free scoring.** Bet sizing scores your stakes by expected log-growth relative to Kelly on the same bets, not by the final bankroll, so a lucky run can't hide over-betting.
- **Charts.** `chart.js` draws an SVG stretched to its container with non-scaling strokes; axis labels are HTML so they stay legible on phones, and colours come from the theme's CSS variables.

- **Themes.** Each theme is a block of CSS custom properties on `[data-theme='…']` (not just `:root`), so any element can preview another theme: the Appearance screen's swatches are drawn in their own themes' colours. With no attribute set, `prefers-color-scheme` picks Notebook or Night desk. CI runs axe colour-contrast checks on six screens in every theme.

## Testing

| Level | Where | What |
|---|---|---|
| Unit | `tests/checks.js` (Node + browser) | Every generator 300×; Monte Carlo vs exact within 5 SE; case/bank data; parsing; security; coach model; Kelly optimality; Figgie posterior calibration and conservation; daily determinism; build consistency |
| Cross-language | `research/verify_results.py` | Independent Python derivations must equal the app's answers |
| End-to-end | `tests/e2e/` (Playwright) | Real flows on desktop and a touch phone, offline mode, axe accessibility, no console errors or CSP violations |
| Audit | Lighthouse CI | Accessibility, best practices, SEO, performance |
