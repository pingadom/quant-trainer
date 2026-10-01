# Architecture

## Constraints that shaped it

- **No build step.** Plain browser scripts sharing one namespace (`window.QT`), loaded in order with `defer`. Anyone can read or run it, and the same `www/` folder is the website, the PWA and the native app's web layer.
- **No server.** All state lives on the device, which keeps the privacy story simple. It is also why the learner model can't use population data yet (see [research/REPORT.md](../research/REPORT.md)).
- **Content is code.** Questions are generator functions, not static data, so practice never runs out and every answer can be tested.

## Modules (`www/js/`)

| Layer | Files | Responsibility |
|---|---|---|
| Foundation | `config.js`, `core.js` | RNG, maths, answer parsing, the store (localStorage), schema validation of imported data, version |
| Platform | `platform.js` | Everything that differs between website, installed PWA and native app: storage mirroring, file export, back button, status bar, service worker, install prompt, analytics |
| Content | `gens-*.js`, `topics.js`, `cases.js`, `bank.js`, `estimate.js` | Question generators (79 skills in 14 topics), case studies, the interview bank, estimation facts |
| Learning engine | `coach.js`, `review.js` | Skill statistics, Elo model, error diagnosis, recommendations, adaptive sessions; spaced-repetition deck |
| UI | `ui.js`, `views/*.js`, `keypad.js`, `mental.js`, `market.js`, `lab.js`, `demo.js` | Shared question card and cards; one file per screen; self-contained mini-apps |
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

`topics`, `skills` (recent window and times), `elo` (θ, per-skill b and n), `log` (per-answer history, capped at 5,000), `errors`, `mistakes`, `cases`, `bank`, `mental`, `market`, `estimate`, `roadmap`, `days`, `demo`. Exported as JSON; on import, every field is rebuilt by `sanitizeState` in `core.js`.

## Testing

| Level | Where | What |
|---|---|---|
| Unit | `tests/checks.js` (Node + browser) | Every generator 300×; Monte Carlo vs exact within 5 SE; case/bank data; parsing; security; coach model; build consistency |
| Cross-language | `research/verify_results.py` | Independent Python derivations must equal the app's answers |
| End-to-end | `tests/e2e/` (Playwright) | Real flows on desktop and a touch phone, offline mode, axe accessibility, no console errors or CSP violations |
| Audit | Lighthouse CI | Accessibility, best practices, SEO, performance |
