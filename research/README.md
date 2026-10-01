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
