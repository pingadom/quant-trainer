# Research

Two pieces of analysis behind the app, both reproducible from this folder.

## 1. Which learner model should the coach use? → [REPORT.md](REPORT.md)

The coach decides what to practise from an estimate of how likely you are to answer each of 79 skills correctly. [`learner_models.py`](learner_models.py) compares seven models: the app's original per-skill Beta, a full-history Beta, overall accuracy, Elo, Elo with population priors, Bayesian Knowledge Tracing and Performance Factor Analysis.

- **Data:** simulated learners whose true ability, learning and forgetting are known, practising under the app's own question-selection policy.
- **Two structurally different ground truths,** so no model family is favoured.
- **Evaluation:** prequential, fitted on training learners and scored on held-out ones, with bootstrap confidence intervals.

**Result:** the original model was among the weakest predictors, because its noisy per-skill estimates are biased by the app's own selection. Elo beats it under both truths and now drives question selection (v0.8.0).

```bash
pip install -r research/requirements.txt
python research/learner_models.py            # ~30 s; regenerates REPORT.md, results.json, figures/
python research/learner_models.py --export my-progress.json   # also score your own exported history
```

## 2. Are the interview answers right? → [verify_results.py](verify_results.py)

Re-derives every interview-bank answer in Python by a different method from the app: exact rational enumeration, backward induction, the Bellman equation, absorbing Markov chains, and a linear program for the poker game. In CI, it checks each value against what the app actually serves.

```bash
python research/verify_results.py
node tests/export-answers.js > answers.json && python research/verify_results.py --js answers.json
```

## 3. Are the Citadel SSE answers right? → [verify_sse.py](verify_sse.py)

Re-derives every numeric answer in `content/*.md` by exact enumeration, dynamic programming or a direct formula, and checks the stored answer is within that question's tolerance.

```bash
node tests/export-sse.js > sse.json && python research/verify_sse.py sse.json
```

## 4. Are the coding problems' tests right? → [verify_code.py](verify_code.py)

Each coding problem has reference solutions in JavaScript and Python. The app's tests (hand-written, plus seeded random and large cases whose expected output comes from the JavaScript reference) are exported and run against the Python reference, and against a brute-force Python version written a different, slower way. The debugging problems' buggy starter code must fail at least one case.

```bash
node tests/export-code.js > code.json && python research/verify_code.py code.json
```
