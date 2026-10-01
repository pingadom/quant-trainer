# Contributing

## Add an interview question you were asked

The easiest way is the [question form](https://github.com/pingadom/quant-trainer/issues/new?template=interview-question.yml). Paraphrase it in your own words and include the firm, role and stage if you're comfortable sharing them.

To add one directly, edit `www/js/bank.js`:

- `firm`, `role`, `stage`, `cat`, and `src: [label, url]` pointing to where it was reported.
- `kind: 'reported'` only when a candidate says it was asked; otherwise `'guide'`.
- Numeric `parts` (each with `q`, `a`, `sol`, and ideally a `sim` Monte Carlo trial) or an `open` model answer. Mark follow-ups you made up with `ext: true`.
- Add an independent derivation to `research/verify_results.py`, so CI checks the answer two ways.

## Add a question generator

Generators live in `www/js/gens-*.js` and return `{ q, a, sol, tol?, sim?, trials? }`. Add the skill name to `SKILLS` in `www/js/topics.js` (same order as the generators). `npm test` runs each generator 300 times and checks `sim` against `a`.

## Before opening a pull request

```bash
npm install
npm run lint && npm test && npm run test:e2e
```

If you add a file to `www/`, add it to `ASSETS` in `www/sw.js`; the tests check scripts.
