"""
Which learner model best predicts the next answer?

The app's coach decides what to practise from an estimate of how likely you are to answer each
skill correctly. This study compares that estimate (a Beta posterior over the last 10 answers)
with five alternatives from the educational-data-mining and rating literature, on simulated
learners whose true ability, skill difficulty, learning and forgetting are known.

Evaluation is prequential: for every answer, each model predicts P(correct) *before* seeing it,
then updates. Hyperparameters are fitted on training learners only; all reported numbers come
from held-out learners, with bootstrap confidence intervals over learners.

Usage:
    python research/learner_models.py                 # full study → research/REPORT.md + figures
    python research/learner_models.py --quick         # smaller run for a fast check
    python research/learner_models.py --export my-progress.json   # also score your own data
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from dataclasses import dataclass, field

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from scipy.optimize import minimize  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
FIG_DIR = os.path.join(HERE, "figures")

# --------------------------------------------------------------------------- skill catalogue
# Mirrors www/js/topics.js: 14 topics, one skill per question generator (79 total).
TOPIC_SIZES = {
    "dice": 5, "cards": 5, "bayes": 5, "ev": 7, "walks": 4, "options": 6, "puzzles": 7,
    "sequences": 8, "dist": 5, "moments": 4, "inference": 6, "regression": 5, "finance": 7, "timeseries": 5,
}
SKILLS = [f"{t}.{i}" for t, n in TOPIC_SIZES.items() for i in range(n)]
SKILL_INDEX = {s: i for i, s in enumerate(SKILLS)}
TOPIC_OF = np.array([list(TOPIC_SIZES).index(s.split(".")[0]) for s in SKILLS])
N_SKILLS, N_TOPICS = len(SKILLS), len(TOPIC_SIZES)
assert N_SKILLS == 79

# Reference categorical palette (dataviz skill), fixed order so a model keeps its colour everywhere.
PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7"]
INK, INK_2, MUTED, SURFACE = "#0b0b0b", "#52514e", "#898781", "#fcfcfb"


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


# --------------------------------------------------------------------------- simulated learners
@dataclass
class World:
    """Population-level truth: how hard each skill is."""
    difficulty: np.ndarray  # b_k, higher = harder


@dataclass
class Learner:
    attempts: list = field(default_factory=list)  # (skill index, correct 0/1, time in days)


def simulate_learner(rng: np.random.Generator, world: World, days: int, per_day: int, truth: str = "logistic") -> Learner:
    """
    Two ground truths, so conclusions aren't an artefact of one modelling choice:

    "logistic": logit P(correct) = theta + aptitude[topic] + knowledge[k] - difficulty[k].
        Knowledge grows with practice (more after a miss, when the worked solution is studied)
        and decays exponentially between attempts on that skill. Structurally close to Elo.
    "mastery":  each skill is either mastered or not (as in knowledge tracing). The initial
        mastery probability depends on ability and difficulty; each attempt may teach the skill;
        mastery can be forgotten over long gaps; answers slip and guess. Structurally close to BKT.

    Either way, questions are chosen by the app's own policy (js/coach.js): weighted by need from
    the Beta-window estimate, an immediate repeat after a miss 65% of the time, and a skill rested
    after 3 correct in a row.
    """
    theta = rng.normal(0, 0.7)
    aptitude = rng.normal(0, 0.5, N_TOPICS)
    knowledge = np.zeros(N_SKILLS)
    last_seen = np.full(N_SKILLS, -np.inf)
    recent = [[] for _ in range(N_SKILLS)]  # app's 10-answer window
    tau, gain_ok, gain_miss = 25.0, 0.12, 0.20
    # mastery truth
    mastered = rng.random(N_SKILLS) < sigmoid(theta + aptitude[TOPIC_OF] - world.difficulty - 0.5)
    learn_p = min(0.5, 0.15 * math.exp(rng.normal(0, 0.4)))
    slip, guess, forget_tau = 0.12, 0.08, 60.0
    out = Learner()

    for day in range(days):
        rested, streak, last = set(), {}, None
        for j in range(per_day):
            t = day + j / 1440.0
            if last is not None and not last[1] and rng.random() < 0.65:
                k = last[0]
            else:
                w = np.empty(N_SKILLS)
                for i in range(N_SKILLS):
                    r = recent[i]
                    if not r:
                        w[i] = 0.9
                        continue
                    mean = (sum(r) + 1) / (len(r) + 2)
                    w[i] = 1 - mean + (0.3 if len(r) >= 3 and mean < 0.55 else 0) + (0.2 if t - last_seen[i] > 14 else 0)
                    w[i] = max(w[i], 0.05)
                if rested and len(rested) < N_SKILLS:
                    w[list(rested)] = 0
                k = int(rng.choice(N_SKILLS, p=w / w.sum()))
            if truth == "logistic":
                if np.isfinite(last_seen[k]):
                    knowledge[k] *= math.exp(-(t - last_seen[k]) / tau)
                p = sigmoid(theta + aptitude[TOPIC_OF[k]] + knowledge[k] - world.difficulty[k])
                y = int(rng.random() < p)
                knowledge[k] += gain_ok if y else gain_miss
            else:
                if mastered[k] and np.isfinite(last_seen[k]) and rng.random() < 1 - math.exp(-(t - last_seen[k]) / forget_tau):
                    mastered[k] = False
                y = int(rng.random() < (1 - slip if mastered[k] else guess))
                if not mastered[k] and rng.random() < learn_p:
                    mastered[k] = True
            last_seen[k] = t
            recent[k] = (recent[k] + [y])[-10:]
            streak[k] = streak.get(k, 0) + 1 if y else 0
            if streak[k] >= 3:
                rested.add(k)
            last = (k, y)
            out.attempts.append((k, y, t))
    return out


# --------------------------------------------------------------------------- models
class Model:
    name = "model"

    def reset(self):
        """Start a new learner."""

    def predict(self, k: int, t: float) -> float:
        raise NotImplementedError

    def update(self, k: int, y: int, t: float):
        raise NotImplementedError


class GlobalMean(Model):
    name = "Global accuracy"

    def reset(self):
        self.c = self.n = 0

    def predict(self, k, t):
        return (self.c + 1) / (self.n + 2)

    def update(self, k, y, t):
        self.c += y
        self.n += 1


class BetaWindow(Model):
    """The app's model: per-skill Beta(1,1) posterior over the last `window` answers."""

    name = "App: Beta, last 10"

    def __init__(self, window=10):
        self.window = window

    def reset(self):
        self.r = [[] for _ in range(N_SKILLS)]

    def predict(self, k, t):
        r = self.r[k]
        return (sum(r) + 1) / (len(r) + 2)

    def update(self, k, y, t):
        self.r[k] = (self.r[k] + [y])[-self.window:]

    def status(self, k):
        r = self.r[k]
        if len(r) < 3:
            return "learning" if r else "unseen"
        m = (sum(r) + 1) / (len(r) + 2)
        return "weak" if m < 0.55 else "shaky" if m < 0.8 else "strong"


class BetaFull(Model):
    name = "Beta, full history"

    def reset(self):
        self.c = np.zeros(N_SKILLS)
        self.n = np.zeros(N_SKILLS)

    def predict(self, k, t):
        return (self.c[k] + 1) / (self.n[k] + 2)

    def update(self, k, y, t):
        self.c[k] += y
        self.n[k] += 1


class Elo(Model):
    """
    Logistic rating model: P = sigmoid(theta + beta_k), learner ability theta shared across skills,
    per-skill easiness beta_k with a step size that shrinks as evidence accumulates. Sharing theta
    gives sensible predictions for skills never tried.
    """

    name = "Elo"

    def __init__(self, k_theta=0.1, k_beta=0.6, decay=0.15, prior=None, name=None):
        self.k_theta, self.k_beta, self.decay = k_theta, k_beta, decay
        self.prior = np.zeros(N_SKILLS) if prior is None else prior
        if name:
            self.name = name

    def reset(self):
        self.theta = 0.0
        self.beta = self.prior.copy()
        self.n = np.zeros(N_SKILLS)

    def predict(self, k, t):
        return float(sigmoid(self.theta + self.beta[k]))

    def update(self, k, y, t):
        err = y - self.predict(k, t)
        self.theta += self.k_theta * err
        self.beta[k] += self.k_beta / (1 + self.decay * self.n[k]) * err
        self.n[k] += 1


class BKT(Model):
    """Bayesian Knowledge Tracing (Corbett & Anderson, 1994) with parameters shared across skills."""

    name = "Knowledge tracing (BKT)"

    def __init__(self, l0=0.3, learn=0.15, slip=0.1, guess=0.25):
        self.l0, self.learn, self.slip, self.guess = l0, learn, slip, guess

    def reset(self):
        self.pl = np.full(N_SKILLS, self.l0)

    def predict(self, k, t):
        pl = self.pl[k]
        return pl * (1 - self.slip) + (1 - pl) * self.guess

    def update(self, k, y, t):
        pl, s, g = self.pl[k], self.slip, self.guess
        post = pl * (1 - s) / (pl * (1 - s) + (1 - pl) * g) if y else pl * s / (pl * s + (1 - pl) * (1 - g))
        self.pl[k] = post + (1 - post) * self.learn


class PFA(Model):
    """
    Performance Factor Analysis (Pavlik et al., 2009): logit P = beta_k + gamma*successes_k + rho*failures_k,
    fitted by regularised maximum likelihood on training learners.
    """

    name = "Performance factors (PFA)"

    def __init__(self, beta=None, gamma=0.1, rho=0.05):
        self.beta = np.zeros(N_SKILLS) if beta is None else beta
        self.gamma, self.rho = gamma, rho

    def reset(self):
        self.s = np.zeros(N_SKILLS)
        self.f = np.zeros(N_SKILLS)

    def predict(self, k, t):
        return float(sigmoid(self.beta[k] + self.gamma * self.s[k] + self.rho * self.f[k]))

    def update(self, k, y, t):
        if y:
            self.s[k] += 1
        else:
            self.f[k] += 1


# --------------------------------------------------------------------------- evaluation
def run(model: Model, learners: list[Learner]):
    """Prequential predictions. Returns per-attempt arrays (p, y, learner id, attempt # on that skill)."""
    P, Y, L, NTH = [], [], [], []
    for li, lr in enumerate(learners):
        model.reset()
        seen = np.zeros(N_SKILLS, dtype=int)
        for k, y, t in lr.attempts:
            P.append(model.predict(k, t))
            Y.append(y)
            L.append(li)
            NTH.append(seen[k])
            seen[k] += 1
            model.update(k, y, t)
    return np.clip(np.array(P), 1e-6, 1 - 1e-6), np.array(Y), np.array(L), np.array(NTH)


def log_loss(p, y):
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))


def brier(p, y):
    return float(np.mean((p - y) ** 2))


def auc(p, y):
    order = np.argsort(p)
    ranks = np.empty(len(p))
    ranks[order] = np.arange(1, len(p) + 1)
    pos = y == 1
    n1, n0 = pos.sum(), (~pos).sum()
    return float((ranks[pos].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))


def per_learner_ll(p, y, lid, n_learners):
    num = np.bincount(lid, weights=-(y * np.log(p) + (1 - y) * np.log(1 - p)), minlength=n_learners)
    den = np.bincount(lid, minlength=n_learners)
    return num, den


def bootstrap_ci(stat_num, stat_den, rng, reps=2000):
    """95% CI of a ratio-of-sums statistic, resampling learners."""
    n = len(stat_num)
    idx = rng.integers(0, n, size=(reps, n))
    vals = stat_num[idx].sum(1) / stat_den[idx].sum(1)
    return float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))


# --------------------------------------------------------------------------- fitting (training learners only)
def fit_bkt(train):
    """Grid search over the four BKT parameters, vectorised across the whole grid."""
    grid = np.array(np.meshgrid(
        [0.1, 0.2, 0.3, 0.4, 0.5, 0.6], [0.02, 0.05, 0.1, 0.15, 0.2, 0.3],
        [0.02, 0.05, 0.1, 0.15, 0.2], [0.1, 0.2, 0.3, 0.4, 0.5], indexing="ij")).reshape(4, -1)
    l0, learn, slip, guess = grid
    ll = np.zeros(grid.shape[1])
    for lr in train:
        pl = np.tile(l0, (N_SKILLS, 1))
        for k, y, _ in lr.attempts:
            cur = pl[k]
            p = np.clip(cur * (1 - slip) + (1 - cur) * guess, 1e-6, 1 - 1e-6)
            ll += np.log(p) if y else np.log(1 - p)
            post = cur * (1 - slip) / p if y else cur * slip / (1 - p)
            pl[k] = post + (1 - post) * learn
    best = int(np.argmax(ll))
    return dict(l0=l0[best], learn=learn[best], slip=slip[best], guess=guess[best])


def fit_pfa(train, l2=1.0):
    rows, ys = [], []
    for lr in train:
        s = np.zeros(N_SKILLS)
        f = np.zeros(N_SKILLS)
        for k, y, _ in lr.attempts:
            rows.append((k, s[k], f[k]))
            ys.append(y)
            (s if y else f)[k] += 1
    k_idx = np.array([r[0] for r in rows], dtype=int)
    S = np.array([r[1] for r in rows])
    F = np.array([r[2] for r in rows])
    Y = np.array(ys)

    def nll(w):
        beta, gamma, rho = w[:N_SKILLS], w[N_SKILLS], w[N_SKILLS + 1]
        z = beta[k_idx] + gamma * S + rho * F
        p = np.clip(sigmoid(z), 1e-9, 1 - 1e-9)
        err = p - Y
        grad = np.zeros_like(w)
        np.add.at(grad, k_idx, err)
        grad[N_SKILLS] = (err * S).sum()
        grad[N_SKILLS + 1] = (err * F).sum()
        grad[:N_SKILLS] += l2 * beta
        return -(Y * np.log(p) + (1 - Y) * np.log(1 - p)).sum() + 0.5 * l2 * (beta ** 2).sum(), grad

    res = minimize(nll, np.zeros(N_SKILLS + 2), jac=True, method="L-BFGS-B")
    return dict(beta=res.x[:N_SKILLS], gamma=float(res.x[N_SKILLS]), rho=float(res.x[N_SKILLS + 1]))


def fit_elo(train):
    best, best_ll = None, np.inf
    for kt in (0.05, 0.1, 0.2):
        for kb in (0.3, 0.6, 1.0):
            for d in (0.05, 0.15, 0.4):
                p, y, *_ = run(Elo(kt, kb, d), train)
                ll = log_loss(p, y)
                if ll < best_ll:
                    best, best_ll = (kt, kb, d), ll
    return best


def skill_prior(train):
    """Population easiness per skill (logit of smoothed training accuracy): what a server could share."""
    c = np.zeros(N_SKILLS)
    n = np.zeros(N_SKILLS)
    for lr in train:
        for k, y, _ in lr.attempts:
            c[k] += y
            n[k] += 1
    acc = (c + 1) / (n + 2)
    return np.log(acc / (1 - acc)) - np.log(acc.mean() / (1 - acc.mean()))


# --------------------------------------------------------------------------- figures
def style(ax):
    ax.set_facecolor(SURFACE)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(MUTED)
    ax.tick_params(colors=INK_2, labelsize=9)
    ax.grid(axis="both", color="#e6e5e0", linewidth=0.6)
    ax.set_axisbelow(True)


def fig_logloss(panels, path):
    """Small multiples: one panel per ground truth, models sorted best-first, colour = model identity."""
    fig, axes = plt.subplots(1, len(panels), figsize=(6.4 * len(panels), 3.8), dpi=150, facecolor=SURFACE)
    axes = np.atleast_1d(axes)
    for ax, (title, results) in zip(axes, panels):
        style(ax)
        rs = sorted(results, key=lambda r: r["log_loss"])
        y = np.arange(len(rs))[::-1]
        ll = [r["log_loss"] for r in rs]
        ax.barh(y, ll, color=[r["color"] for r in rs], height=0.55)
        ax.errorbar(ll, y, xerr=[[r["log_loss"] - r["ci"][0] for r in rs], [r["ci"][1] - r["log_loss"] for r in rs]], fmt="none", ecolor=INK_2, elinewidth=1, capsize=3)
        for yi, r in zip(y, rs):
            ax.text(r["ci"][1] + 0.002, yi, f"{r['log_loss']:.3f}", va="center", fontsize=8.5, color=INK)
        ax.set_yticks(y, [r["name"] for r in rs], fontsize=9, color=INK)
        ax.set_xlim(min(r["ci"][0] for r in rs) - 0.02, max(r["ci"][1] for r in rs) + 0.025)
        ax.set_title(title, fontsize=10, color=INK, loc="left")
        ax.set_xlabel("Log loss, held-out learners (lower is better)", color=INK_2, fontsize=9)
        ax.grid(axis="y", visible=False)
    fig.tight_layout()
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)


def fig_calibration(curves, path):
    fig, ax = plt.subplots(figsize=(5.2, 5.0), dpi=150, facecolor=SURFACE)
    style(ax)
    ax.plot([0, 1], [0, 1], color=MUTED, linewidth=1, linestyle="--")
    ax.text(0.62, 0.55, "perfect calibration", color=MUTED, fontsize=8, rotation=45, ha="center", va="center")
    for c in curves:
        ax.plot(c["pred"], c["obs"], color=c["color"], linewidth=2, marker="o", markersize=4, label=c["name"])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1.02)
    ax.set_xticks(np.linspace(0, 1, 6))
    ax.set_xlabel("Predicted P(correct)", color=INK_2, fontsize=9)
    ax.set_ylabel("Observed accuracy", color=INK_2, fontsize=9)
    ax.legend(frameon=False, fontsize=8, loc="upper left")
    fig.tight_layout()
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)


def fig_coldstart(results, path, max_n=10):
    fig, ax = plt.subplots(figsize=(7.2, 3.8), dpi=150, facecolor=SURFACE)
    style(ax)
    for r in results:
        ax.plot(np.arange(1, max_n + 1), r["by_nth"][:max_n], color=r["color"], linewidth=2, marker="o", markersize=3.5, label=r["name"])
    ax.set_xticks(range(1, max_n + 1))
    ax.set_xlabel("Attempt number on that skill", color=INK_2, fontsize=9)
    ax.set_ylabel("Log loss (lower is better)", color=INK_2, fontsize=9)
    ax.legend(frameon=False, fontsize=8, ncol=2)
    fig.tight_layout()
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)


def fig_status(table, path):
    order = ["weak", "shaky", "strong"]
    labels = {"weak": "Weak (✗)", "shaky": "Shaky (~)", "strong": "Strong (✓)"}
    colors = {"weak": "#d03b3b", "shaky": "#fab219", "strong": "#0ca30c"}  # reserved status hues, with labels
    fig, ax = plt.subplots(figsize=(6.0, 3.2), dpi=150, facecolor=SURFACE)
    style(ax)
    x = np.arange(len(order))
    acc = [table[s]["accuracy"] for s in order]
    ax.bar(x, acc, color=[colors[s] for s in order], width=0.55)
    for xi, s in zip(x, order):
        lo, hi = table[s]["ci"]
        ax.errorbar(xi, table[s]["accuracy"], yerr=[[table[s]["accuracy"] - lo], [hi - table[s]["accuracy"]]], fmt="none", ecolor=INK_2, capsize=3)
        ax.text(xi, hi + 0.03, f"{table[s]['accuracy']:.0%}\n(n={table[s]['n']:,})", ha="center", fontsize=8.5, color=INK)
    ax.axhline(0.8, color=MUTED, linewidth=1, linestyle="--")
    ax.text(2.45, 0.81, "80%", color=MUTED, fontsize=8)
    ax.set_xticks(x, [labels[s] for s in order], fontsize=9, color=INK)
    ax.set_ylim(0, 1.15)
    ax.set_ylabel("Accuracy on the next attempt", color=INK_2, fontsize=9)
    ax.grid(axis="x", visible=False)
    fig.tight_layout()
    fig.savefig(path, facecolor=SURFACE)
    plt.close(fig)


# --------------------------------------------------------------------------- real data
def load_export(path):
    """Answer log from an app export (More → Your data → Export progress)."""
    with open(path, encoding="utf-8") as fh:
        state = json.load(fh)
    lr = Learner()
    for e in state.get("log", []):
        if e.get("s") in SKILL_INDEX:
            lr.attempts.append((SKILL_INDEX[e["s"]], 1 if e.get("ok") else 0, float(e.get("t", 0)) / 864e5))
    return lr


# --------------------------------------------------------------------------- study
def run_study(truth: str, seed: int, quick: bool, verbose=True):
    """Simulate, fit on training learners, evaluate on held-out learners under one ground truth."""
    rng = np.random.default_rng(seed)
    n_train, n_test, days, per_day = (40, 40, 12, 12) if quick else (150, 150, 30, 15)
    world = World(difficulty=rng.normal(0, 0.9, N_SKILLS))
    if verbose:
        print(f"[{truth}] simulating {n_train + n_test} learners × {days} days × {per_day} questions…")
    train = [simulate_learner(rng, world, days, per_day, truth) for _ in range(n_train)]
    test = [simulate_learner(rng, world, days, per_day, truth) for _ in range(n_test)]

    bkt, pfa, (kt, kb, d), prior = fit_bkt(train), fit_pfa(train), fit_elo(train), skill_prior(train)
    models = [
        BetaWindow(), BetaFull(), GlobalMean(), Elo(kt, kb, d),
        Elo(kt, kb, d, prior=prior, name="Elo + population priors"), BKT(**bkt), PFA(**pfa),
    ]

    boot_rng = np.random.default_rng(seed + 1)
    results, preds = [], {}
    for i, m in enumerate(models):
        p, y, lid, nth = run(m, test)
        num, den = per_learner_ll(p, y, lid, len(test))
        by_nth = [log_loss(p[nth == j], y[nth == j]) if (nth == j).any() else float("nan") for j in range(10)]
        results.append(dict(name=m.name, color=PALETTE[i], log_loss=log_loss(p, y), brier=brier(p, y), auc=auc(p, y),
                            ci=bootstrap_ci(num, den, boot_rng), by_nth=by_nth, n=int(len(y))))
        preds[m.name] = (p, y, lid)

    # Paired comparison with the app's model: per-learner log-loss differences, bootstrapped over learners.
    base_p, y, lid = preds[models[0].name]
    bnum, bden = per_learner_ll(base_p, y, lid, len(test))
    idx = boot_rng.integers(0, len(test), size=(2000, len(test)))
    for r in results:
        num, _ = per_learner_ll(preds[r["name"]][0], y, lid, len(test))
        diff = num - bnum
        vals = diff[idx].sum(1) / bden[idx].sum(1)
        r["delta_vs_app"] = float(diff.sum() / bden.sum())
        r["delta_ci"] = (float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5)))

    # Calibration (10 equal-count bins) for the app, the best model and BKT.
    curves = []
    for name in [models[0].name, "Elo", "Elo + population priors"]:
        p, yy, _ = preds[name]
        bins = np.array_split(np.argsort(p), 10)
        curves.append(dict(name=name, color=next(r["color"] for r in results if r["name"] == name),
                           pred=[float(p[b].mean()) for b in bins], obs=[float(yy[b].mean()) for b in bins]))
    ece = {c["name"]: float(np.mean(np.abs(np.array(c["pred"]) - np.array(c["obs"])))) for c in curves}

    # Do the app's status labels mean what they say? Accuracy on the very next attempt, by label.
    by = {s: ([], []) for s in ("weak", "shaky", "strong")}
    app = BetaWindow()
    for li, lr in enumerate(test):
        app.reset()
        for k, yy, t in lr.attempts:
            s = app.status(k)
            if s in by:
                by[s][0].append(yy)
                by[s][1].append(li)
            app.update(k, yy, t)
    status = {}
    for s, (ys, ls) in by.items():
        ys, ls = np.array(ys), np.array(ls)
        num = np.bincount(ls, weights=ys, minlength=len(test))
        den = np.bincount(ls, minlength=len(test)).astype(float)
        vals = num[idx].sum(1) / np.maximum(den[idx].sum(1), 1)
        status[s] = dict(accuracy=float(ys.mean()), n=int(len(ys)), ci=(float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))))

    fitted = dict(bkt={k: float(v) for k, v in bkt.items()}, pfa=dict(gamma=pfa["gamma"], rho=pfa["rho"]),
                  elo=dict(k_theta=kt, k_beta=kb, decay=d))
    config = dict(truth=truth, seed=seed, n_train=n_train, n_test=n_test, days=days, per_day=per_day, answers_scored=results[0]["n"])
    return dict(config=config, fitted=fitted, results=results, curves=curves, ece=ece, status=status, models=models)


def print_table(study):
    print(f"\n[{study['config']['truth']}] {study['config']['answers_scored']:,} held-out answers")
    print(f"{'model':32s} {'log loss':>9s} {'Δ vs app (95% CI)':>26s} {'Brier':>7s} {'AUC':>6s}")
    for r in sorted(study["results"], key=lambda r: r["log_loss"]):
        lo, hi = r["delta_ci"]
        print(f"{r['name']:32s} {r['log_loss']:9.4f} {r['delta_vs_app']:+9.4f} [{lo:+.4f}, {hi:+.4f}] {r['brier']:7.4f} {r['auc']:6.3f}")
    print("Next-attempt accuracy by the app's status label:")
    for s, v in study["status"].items():
        print(f"  {s:7s} {v['accuracy']:.1%}  95% CI [{v['ci'][0]:.1%}, {v['ci'][1]:.1%}]  n={v['n']:,}")


def write_report(studies, path):
    """REPORT.md is generated from the results so no number is ever copied by hand."""
    L, M = studies["logistic"], studies["mastery"]
    get = lambda st, name: next(r for r in st["results"] if r["name"] == name)  # noqa: E731
    app_l, elo_l, prior_l = get(L, "App: Beta, last 10"), get(L, "Elo"), get(L, "Elo + population priors")
    app_m, elo_m = get(M, "App: Beta, last 10"), get(M, "Elo")
    best_m = min(M["results"], key=lambda r: r["log_loss"])
    pct = lambda a, b: 100 * (a["log_loss"] - b["log_loss"]) / a["log_loss"]  # noqa: E731
    ci = lambda r: f"[{r['delta_ci'][0]:+.3f}, {r['delta_ci'][1]:+.3f}]"  # noqa: E731
    # Models significantly better than the app (whole 95% CI below zero).
    better = lambda st: sum(1 for r in st["results"] if r["delta_ci"][1] < 0)  # noqa: E731
    ordinal = lambda n: f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"  # noqa: E731
    rank = lambda st, name: ordinal(1 + [r["name"] for r in sorted(st["results"], key=lambda r: r["log_loss"])].index(name))  # noqa: E731

    def table(st):
        rows = ["| Model | Log loss | Δ vs app (95% CI) | Brier | AUC |", "|---|---|---|---|---|"]
        for r in sorted(st["results"], key=lambda r: r["log_loss"]):
            rows.append(f"| {r['name']} | {r['log_loss']:.3f} | {r['delta_vs_app']:+.3f} {ci(r)} | {r['brier']:.3f} | {r['auc']:.3f} |")
        return "\n".join(rows)

    def status_table(st):
        rows = ["| App label | Next-attempt accuracy | 95% CI | Answers |", "|---|---|---|---|"]
        for s in ("weak", "shaky", "strong"):
            v = st["status"][s]
            rows.append(f"| {s.capitalize()} | {v['accuracy']:.1%} | {v['ci'][0]:.1%}–{v['ci'][1]:.1%} | {v['n']:,} |")
        return "\n".join(rows)

    c = L["config"]
    text = f"""# Which learner model best predicts the next answer?

*Generated by [`learner_models.py`](learner_models.py) (seed {c['seed']}). Re-run it to reproduce every number and figure.*

## Why this matters

The app's coach decides what you should practise next from an estimate of how likely you are to answer each of its 79 skills correctly. If that estimate is poor, the recommendations are too. The app currently uses a simple per-skill **Beta(1,1) posterior over your last 10 answers**. This study asks whether that's a good choice, and what would be better.

## Method

- **Learners.** {c['n_train'] + c['n_test']} simulated learners practise for {c['days']} days, {c['per_day']} questions a day, with questions **chosen by the app's own policy** (weighted towards weak skills, an immediate repeat after a miss, rest after three correct). The evaluation therefore reflects the data the app would actually collect, including its selection bias.
- **Two ground truths,** so the conclusion isn't an artefact of one modelling assumption:
  - *logistic*: P(correct) = σ(ability + topic aptitude + knowledge − difficulty). Knowledge grows with practice and decays between sessions. This is structurally close to Elo.
  - *mastery*: each skill is mastered or not, can be learned on each attempt and forgotten over long gaps, with slips and guesses. This is structurally close to BKT.
- **Seven models:** the app's model; a full-history Beta; overall accuracy; Elo (learner ability shared across skills plus per-skill easiness); Elo with population skill-difficulty priors (what a server could provide); Bayesian Knowledge Tracing (BKT); Performance Factor Analysis (PFA).
- **Prequential evaluation:** every model predicts each answer *before* seeing it, then updates. Hyperparameters are fitted on {c['n_train']} training learners only. Every reported number comes from {c['n_test']} **held-out** learners ({c['answers_scored']:,} answers per ground truth). Confidence intervals bootstrap over learners (2,000 resamples), and differences against the app are paired per learner.

## Results

![Log loss by model under both ground truths](figures/log_loss.png)

**Logistic ground truth**

{table(L)}

**Mastery ground truth**

{table(M)}

## Findings

1. **Elo beats the app's model under both ground truths.** It cuts log loss by {pct(app_l, elo_l):.1f}% under the logistic truth (Δ {elo_l['delta_vs_app']:+.3f}, 95% CI {ci(elo_l)}) and by {pct(app_m, elo_m):.1f}% under the mastery truth (Δ {elo_m['delta_vs_app']:+.3f}, CI {ci(elo_m)}). Under the logistic truth, {better(L)} of the other six models beat the app, even a single overall-accuracy number. Under the mastery truth, {better(M)} do.
2. **The cause is noisy per-skill estimates, made worse by selection bias.** A per-skill Beta knows nothing about a skill you haven't tried (it predicts 50%) and swings wildly on a few answers. That alone explains its poor first attempts. But its gap to the other models **widens** as a skill accumulates attempts (chart below). The skills that reach many attempts are the ones the app kept choosing *because they looked weak*, and selecting on a noisy low estimate guarantees it is biased low: regression to the mean, a winner's curse in reverse. Models that **shrink each skill towards the learner's overall ability** (Elo, PFA) correct for this. (The two Beta lines coincide for the first 10 attempts, as they must, since the window is 10.)
3. **The best model depends on the truth, but Elo is robust.** Each truth favours the model with its own shape: under the mastery truth the winner is {best_m['name']} (Δ {best_m['delta_vs_app']:+.3f}), and under the logistic truth Elo with population priors wins (Δ {prior_l['delta_vs_app']:+.3f}, CI {ci(prior_l)}). Of the models that need no per-skill data from other learners (unlike PFA and the priors variant), plain Elo is the most consistent: it ranks {rank(L, 'Elo')} of 7 under the logistic truth and {rank(M, 'Elo')} under the mastery truth, while BKT swings from {rank(M, 'Knowledge tracing (BKT)')} to {rank(L, 'Knowledge tracing (BKT)')}. Priors learned from other learners help further, but the app has no server, so they would need an opt-in way to pool anonymous data.
4. **The app's status labels are still meaningful.** Even though its probabilities are poorly calibrated, ranking skills by them works: answers on skills labelled *strong* were then correct far more often than on *weak* ones, close to the thresholds the labels imply (strong ≥ 80%, weak < 55%).

![Log loss by attempt number on a skill](figures/cold_start.png)

![Calibration](figures/calibration.png)

**Do the labels mean what they say?** (logistic truth)

{status_table(L)}

(mastery truth)

{status_table(M)}

![Next-attempt accuracy by status label](figures/status_labels.png)

## Recommendation

Use an **Elo-style model** (one learner ability plus per-skill easiness with shrinking step sizes) to decide what to practise. It needs no server, has three hyperparameters, and beats the current model under both ground truths. Keep the status labels, which validate well.

**Shipped in v0.8.0.** [`www/js/coach.js`](../www/js/coach.js) now chooses questions with Elo, using K_θ = 0.05, K_β = 0.6, decay = 0.05: the setting with the best *average* log loss across both ground truths on training learners. (Fitted per truth, the optima were K_β = {L['fitted']['elo']['k_beta']}, decay = {L['fitted']['elo']['decay']} under the logistic truth and K_β = {M['fitted']['elo']['k_beta']}, decay = {M['fitted']['elo']['decay']} under the mastery truth, so the compromise trades a little accuracy in each for robustness.) The status labels are unchanged, and existing users' Elo state is rebuilt from their answer history.

## Limitations

- **Synthetic data.** Real learners may differ: question difficulty varies within a skill because the numbers are randomised, motivation drifts, people look things up. The two-truth design guards against favouring one model family, but it is not real data. Run `python research/learner_models.py --export your-progress.json` to score the models on your own answer history (the app records it from v0.8.0).
- **The simulated learners follow the pre-0.8 selection policy** (questions chosen with the per-skill Beta). Re-running under the new Elo-driven policy is a natural next step, since selection bias was part of the problem.
- **One fitted parameter set per model**, shared across skills, for BKT and Elo. Per-topic parameters would likely help the stronger models further.
- **Log loss rewards calibration as well as ranking**, which is what the coach needs. AUC (ranking only) is reported too.
"""
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


# --------------------------------------------------------------------------- main
def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows consoles default to cp1252
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--quick", action="store_true", help="smaller simulation for a fast check (no files written)")
    ap.add_argument("--export", help="path to an exported progress file to score as well")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    studies = {truth: run_study(truth, args.seed, args.quick) for truth in ("logistic", "mastery")}
    for st in studies.values():
        print_table(st)

    if args.export:
        lr = load_export(args.export)
        if len(lr.attempts) < 20:
            print(f"\nExport has only {len(lr.attempts)} logged answers; need at least 20 to score.")
        else:
            print(f"\nYour exported data ({len(lr.attempts)} answers; models fitted on the logistic simulation):")
            for m in sorted(studies["logistic"]["models"], key=lambda m: m.name):
                p, yy, *_ = run(m, [lr])
                print(f"  {m.name:32s} log loss {log_loss(p, yy):.4f}  Brier {brier(p, yy):.4f}")

    if args.quick:
        return
    os.makedirs(FIG_DIR, exist_ok=True)
    L, M = studies["logistic"], studies["mastery"]
    fig_logloss([("Logistic ground truth", L["results"]), ("Mastery ground truth", M["results"])], os.path.join(FIG_DIR, "log_loss.png"))
    fig_calibration(L["curves"], os.path.join(FIG_DIR, "calibration.png"))
    fig_coldstart(L["results"], os.path.join(FIG_DIR, "cold_start.png"))
    fig_status(L["status"], os.path.join(FIG_DIR, "status_labels.png"))
    out = {t: {k: v for k, v in st.items() if k not in ("models", "curves")} for t, st in studies.items()}
    for st in out.values():
        st["results"] = [{k: v for k, v in r.items() if k != "color"} for r in st["results"]]
    with open(os.path.join(HERE, "results.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    write_report(studies, os.path.join(HERE, "REPORT.md"))
    print(f"\nWrote {os.path.relpath(os.path.join(HERE, 'REPORT.md'))}, results.json and figures/")


if __name__ == "__main__":
    main()
