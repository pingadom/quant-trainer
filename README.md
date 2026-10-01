# Quant Trainer

Practice for quant trading interviews: probability, statistics, mental maths, market making, real reported interview questions and market case studies.



## Run it locally

```bash
npm run serve
```

Then open <http://localhost:8765/www/>. Any static file server works; opening `www/index.html` directly also works, just without offline mode. Use `localhost` rather than `127.0.0.1`.

## What's inside

| Section | What it trains |
|---|---|
| **Interview questions** | 24 questions candidates report from Jane Street, SIG, Optiver, IMC, Citadel, Five Rings, Two Sigma and Flow Traders, plus common formats. Each is paraphrased with a source link, has worked solutions and follow-ups, shows each firm's reported process, and can be run as a timed mock interview. |
| **Practice** | 14 topics, 79 randomised generators, worked solutions, Monte Carlo "check by simulation", and adaptive mixed review. |
| **Coach** | Tracks all 79 skills individually (accuracy and speed), diagnoses each wrong answer (complement slip, % vs decimal, sign, inverted ratio, factor of 2, variance vs SD, rounding, method), and ranks recommendations with reasons and one-tap drills. Includes a 14-question diagnostic, a skill map, error habits, and responsive sessions that repeat a missed skill straight away and rest mastered ones. |
| **Mistakes deck** | Every wrong answer is saved exactly as you saw it and comes back for spaced review after 1, 3, 7 and 21 days until mastered. |
| **Estimation & calibration** | Quote a low–high range on 43 fact-checked quantities. You score low/high if the truth is inside (the interval format reported for Optiver), and it tracks whether your ranges are honest 90% intervals. |
| **Case studies** | 14 real market events (LTCM, Black Monday, Volmageddon, negative oil, Archegos, …), each with verified facts, the statistical lesson, questions and sources. |
| **Mental maths** | "80 in 8" (multiple choice, net scoring, no going back) and a 2-minute sprint. |
| **Market making** | Quote on hidden dice against informed and noise traders. |
| **Stats lab** | CLT and volatility-drag simulations. |
| **Roadmap** | Staged plan with books, projects and auto-tracked milestones. |

## How the two targets differ

All platform differences live in [`www/js/platform.js`](www/js/platform.js):

| | Website | Installed web app | Native app |
|---|---|---|---|
| Offline | Service worker (network-first) | Service worker | Files bundled in the app |
| Storage | `localStorage` | `localStorage` | `localStorage`, mirrored to the Preferences plugin and restored if the WebView storage is wiped |
| Export progress | File download | File download | Native share sheet (Filesystem + Share plugins) |
| Install prompt | "Install" button (Chrome/Edge/Android) or Add-to-Home-Screen tip (iOS) | hidden | hidden |
| Back button | browser | browser | Android back key steps through screens, exits from home |

Native plugins are reached through `window.Capacitor.Plugins` at runtime, so the web build never depends on them.

## Deploy the website

**GitHub Pages (set up):** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the tests on every push to `main`, then publishes `www/`. One-time setup: repository **Settings → Pages → Source: GitHub Actions**. The site appears at `https://<user>.github.io/<repo>/`. All paths are relative, so it works under a sub-path.

**Other hosts:** [`netlify.toml`](netlify.toml) and [`vercel.json`](vercel.json) are included (publish directory `www`; the tests run as the build step). For Cloudflare Pages, set the output directory to `www`. Any static host works if it serves `sw.js` with `Cache-Control: no-cache`.

## Build the app

### Android, in the cloud (no local tools)

[`.github/workflows/android.yml`](.github/workflows/android.yml) generates the native project, icons and splash screens, then builds a debug-signed APK.

- **Actions → Build Android app → Run workflow**, then download the APK from the run's artifacts. Install it on your phone (allow "install unknown apps").
- Or push a version tag (`git tag v0.4.0 && git push --tags`) to also attach the APK to a GitHub release.

### Android or iOS, locally

Requires **Node 22+** (this machine currently has Node 6), plus Android Studio for Android, or a Mac with Xcode 26 for iOS.

```bash
npm install
npx cap add android                       # or: npx cap add ios
npx capacitor-assets generate             # icons + splash screens from assets/
npm run android                           # sync www/ and open Android Studio
```

`android/` and `ios/` are generated and git-ignored; `www/` is the only source of truth. After changing the web app, `npx cap sync` copies it in again.

### Before publishing to an app store

- Change `appId` in [`capacitor.config.json`](capacitor.config.json) (`dev.quanttrainer.app`) to a reverse domain you own. It can't be changed after release.
- Google Play needs a signed release bundle (AAB) and a privacy policy. All data stays on the device, which makes the policy simple.
- The App Store requires an Apple Developer account and a Mac for building.

## Releasing a version

The version lives in three places, and the tests fail if they disagree: `package.json`, `QT.VERSION` in `www/js/core.js`, and `VERSION` in `www/sw.js`. Bumping `sw.js` also makes returning website visitors fetch fresh files.

## Tests

- **In CI / with Node 22:** `npm test`
- **In a browser:** open <http://localhost:8765/tests/check.html> while `npm run serve` is running.

The suite ([`tests/checks.js`](tests/checks.js)) runs every generator 300 times, compares every exact answer with a Monte Carlo estimate (within 5 standard errors), validates case studies and interview questions (sources, ids, answers), checks answer parsing, and checks that every script is precached and the versions match.

## Adding content

**A problem generator** (`www/js/gens-*.js`) returns:

```js
{
  q: 'question html', a: 0.25, sol: 'worked solution html',
  tol: { abs: 1e-4, rel: 0.01 },    // optional; default shown
  sim: () => 1 | 0 | value | null,  // optional Monte Carlo trial (null = reject, for conditioning)
  trials: 100000,                   // optional
}
```

Register new topics in `www/js/topics.js`.

**A case study** goes in `www/js/cases.js`. Mark questions that use made-up numbers with `illus: true`, and cite a source for every fact.

**An interview question** goes in `www/js/bank.js`. Set `firm`, `role`, `stage`, `cat` and `src: [label, url]`, and `kind: 'reported'` only when a candidate says it was asked (otherwise `'guide'`). Give it numeric `parts` or an `open` model answer, and mark follow-ups you added yourself with `ext: true`. Paraphrase rather than copy.

If you add a file to `www/`, add it to `ASSETS` in `www/sw.js` (the tests check scripts).

## Layout

```
www/                     the app: the only source of truth for both targets
  index.html, manifest.webmanifest, sw.js, icons/, css/
  js/core.js             RNG, maths, answer parsing, storage, version
  js/platform.js         web vs native differences
  js/gens-*.js           problem generators
  js/topics.js, cases.js, bank.js
  js/keypad.js, mental.js, market.js, lab.js, app.js
assets/                  source images for native icons/splash (@capacitor/assets)
tests/                   checks.js (shared), check.html (browser), run-node.js (CI)
.github/workflows/       deploy.yml (website), android.yml (APK)
capacitor.config.json    native wrapper config
netlify.toml, vercel.json
```
