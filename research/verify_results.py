"""
Independent verification of the interview-question answers.

Every headline result in the app's interview bank is re-derived here in Python by a *different
method* from the JavaScript (exact rational enumeration, backward induction, solving the Bellman
equation, absorbing Markov chains, a linear program for the poker game). With --js, each value is
compared against what the app actually serves, so two independent implementations must agree.

    python research/verify_results.py                       # derivations only
    node tests/export-answers.js > answers.json
    python research/verify_results.py --js answers.json     # cross-check (CI does this)
"""

from __future__ import annotations

import argparse
import itertools
import json
import math
import sys
from fractions import Fraction as Fr

import numpy as np
from scipy.optimize import brentq, linprog
from scipy.integrate import quad

R: dict[str, tuple[float, str]] = {}  # "<bank id>.<part>" -> (value, how it was derived)


def record(key, value, how):
    R[key] = (float(value), how)


DIE = range(1, 7)

# ---------------------------------------------------------------- Jane Street
# Rerolls by backward induction with exact fractions: value with r rerolls left.
def reroll_value(rerolls, faces=6):
    v = Fr(faces + 1, 2)
    for _ in range(rerolls):
        v = sum(max(Fr(x), v) for x in range(1, faces + 1)) / faces
    return v


record("js-reroll.0", reroll_value(0), "exact mean of a die")
record("js-reroll.1", reroll_value(1), "backward induction, exact fractions")
record("js-reroll.2", reroll_value(2), "backward induction, exact fractions")
record("sig-two-rolls.0", reroll_value(1), "backward induction, exact fractions")

# 30-sided vs 20-sided: enumerate all 600 outcomes exactly. Ties go to the opponent.
d30 = sum(Fr(x if x > y else -y, 600) for x in range(1, 31) for y in range(1, 21))
record("js-d30-d20.0", d30, f"exact enumeration = {d30}")

# 100-sided die, $1 per reroll: solve the Bellman equation V = E[max(X, V - 1)] numerically
# (no threshold formula assumed), then read off the optimal stopping threshold.
def bellman(v):
    x = np.arange(1, 101)
    return np.maximum(x, v - 1).mean() - v


V = brentq(bellman, 1, 100, xtol=1e-12)
record("js-d100-pay.0", V, "root of the Bellman equation (Brent's method)")
record("js-d100-pay.1", math.ceil(V - 1), "smallest roll worth keeping: ceil(V - 1)")

# d20 vs sum of three d6: exact enumeration of P(d20 strictly higher).
three = [a + b + c for a in DIE for b in DIE for c in DIE]
p_d20 = Fr(sum(1 for d in range(1, 21) for s in three if d > s), 20 * 216)
record("js-d20-3d6.0", p_d20, f"exact enumeration = {p_d20}")
record("js-d20-3d6.1", Fr(20 ** 2 - 1, 12), "variance of a discrete uniform on 1..20")

# Best guess for the sum of two dice under absolute error: the minimiser of E|S - g|.
sums = [a + b for a in DIE for b in DIE]
g = min(range(2, 13), key=lambda g: sum(abs(s - g) for s in sums))
record("js-two-dice-guess.0", g, "argmin over guesses of E|S - g|")
record("js-two-dice-guess.1", Fr(sum(abs(s - 7) for s in sums), 36), "exact E|S - 7|")

# ---------------------------------------------------------------- SIG
ev3 = Fr(0)
for roll in itertools.product(DIE, repeat=3):
    distinct = len(set(roll))
    ev3 += Fr({1: 10, 2: 5, 3: -2}[distinct], 216)
record("sig-three-dice.0", ev3, f"exact enumeration of 216 rolls = {ev3}")

record("sig-painting.0", 0.2 * 500_000 + 0.8 * 10_000, "expected value")
record("sig-painting.1", brentq(lambda p: p * 500 + (1 - p) * 10 - 120, 0, 1), "root of the breakeven equation")

# Ascending order of 4 distinct cards: brute force over every ordered draw from smaller decks.
# The probability doesn't depend on deck size, which is the point of the question.
for n in (5, 6, 7, 8):
    draws = list(itertools.permutations(range(n), 4))
    p = Fr(sum(1 for d in draws if list(d) == sorted(d)), len(draws))
    assert p == Fr(1, 24), (n, p)
record("sig-97-cards.0", Fr(1, 24), "brute force on decks of 5–8 cards (all = 1/24)")
record("sig-97-cards.1", Fr(10, 24) - Fr(23, 24), "expected profit at $10 vs $1")

ranks = [r for r in range(13) for _ in range(4)]
pairs = [(i, j) for i in range(52) for j in range(52) if i != j]
record("sig-next-card.0", Fr(sum(1 for i, j in pairs if ranks[j] > ranks[i]), len(pairs)), "exact enumeration of ordered card pairs")
five = [j for j in range(52) if ranks[j] == 3]  # rank index 3 = the 5 (ranks 2..A)
after5 = [(i, j) for i in five[:1] for j in range(52) if j != i]
record("sig-next-card.1", Fr(sum(1 for i, j in after5 if ranks[j] > ranks[i]), len(after5)), "exact count after seeing a 5")

# ---------------------------------------------------------------- Optiver
# Tennis from 30–30 as an absorbing Markov chain over (my points, their points).
def tennis_from_30_30(p):
    states = [(a, b) for a in range(5) for b in range(5)]
    idx = {s: i for i, s in enumerate(states)}

    def norm(a, b):  # collapse to deuce-equivalent states
        while a >= 3 and b >= 3:
            a, b = a - 1, b - 1
        return a, b

    def won(a, b):
        return a >= 4 and a - b >= 2

    def lost(a, b):
        return b >= 4 and b - a >= 2

    n = len(states)
    A = np.eye(n)
    rhs = np.zeros(n)
    for (a, b), i in idx.items():
        if won(a, b):
            rhs[i] = 1
            continue
        if lost(a, b):
            continue
        A[i, idx[norm(a + 1, b)]] -= p
        A[i, idx[norm(a, b + 1)]] -= 1 - p
    return np.linalg.solve(A, rhs)[idx[(2, 2)]]


record("opt-tennis.0", tennis_from_30_30(0.6), "absorbing Markov chain, linear solve")
record("opt-tennis.1", tennis_from_30_30(0.9), "absorbing Markov chain, linear solve")
inc = Fr(sum(1 for r in itertools.product(DIE, repeat=3) if r[0] < r[1] < r[2]), 216)
record("opt-increasing.0", inc, f"exact enumeration = {inc}")

# ---------------------------------------------------------------- IMC
# Gambler's ruin with $1 vs $2, A wins rounds with p = 2/3: fundamental matrix of the chain.
p = 2 / 3
Q = np.array([[0, p], [1 - p, 0]])  # transient states: A has $1, A has $2
Rm = np.array([[1 - p, 0], [0, p]])  # absorbing: A broke, A wins all ($3)
B = np.linalg.solve(np.eye(2) - Q, Rm)
record("imc-bankrupt.0", B[0, 1], "absorption probabilities, (I - Q)^-1 R")
record("imc-higher-die.0", Fr(sum(max(a, b) for a in DIE for b in DIE), 36), "exact enumeration")
record("imc-odd.0", 1 / 0.5, "geometric mean 1/p")

# ---------------------------------------------------------------- Citadel
record("cit-cubed.0", Fr(sum(x ** 3 for x in DIE), 6), "exact mean of X³")
record("cit-cubed.1", Fr(7, 2) ** 3, "(E X)³")

# ---------------------------------------------------------------- Five Rings
# Two-card poker (ace/queen, $1 antes, $1 bet). Rows: player 1 with a queen checks or bluffs
# (with an ace they always bet). Columns: player 2 folds or calls. Payoffs to player 1, averaged
# over the deal. Solve the zero-sum game as a linear program.
M = np.array([[0.5 * 1 + 0.5 * -1, 0.5 * 2 + 0.5 * -1],   # check queen: vs fold, vs call
              [0.5 * 1 + 0.5 * 1, 0.5 * 2 + 0.5 * -2]])   # bluff queen
# Player 1: maximise v s.t. x·M[:, j] >= v for all j, sum x = 1, x >= 0.
res = linprog(c=[0, 0, -1], A_ub=np.hstack([-M.T, np.ones((2, 1))]), b_ub=[0, 0],
              A_eq=[[1, 1, 0]], b_eq=[1], bounds=[(0, 1), (0, 1), (None, None)])
bluff, value = res.x[1], res.x[2]
# Player 2: minimise u s.t. M[i, :]·y <= u, sum y = 1.
res2 = linprog(c=[0, 0, 1], A_ub=np.hstack([M, -np.ones((2, 1))]), b_ub=[0, 0],
               A_eq=[[1, 1, 0]], b_eq=[1], bounds=[(0, 1), (0, 1), (None, None)])
call = res2.x[1]
assert abs(value - res2.x[2]) < 1e-9  # minimax theorem: both LPs give the same value
record("fr-poker.0", bluff, "linear program (player 1's maximin strategy)")
record("fr-poker.1", call, "linear program (player 2's minimax strategy)")
record("fr-poker.2", value, "game value from the LP")

# ---------------------------------------------------------------- Two Sigma, Flow, common formats
x, y = np.array([1, 2, 3]), np.array([2, 3, 7])
record("ts-ols-stream.0", np.linalg.lstsq(x[:, None], y, rcond=None)[0][0], "least squares through the origin (numpy lstsq)")
record("flow-poker.0", 1 - math.comb(38, 2) / math.comb(47, 2), "1 - C(38,2)/C(47,2): no out in two cards")
record("mm-geo.0", sum(k * 0.5 ** k for k in range(1, 200)), "series Σ k·2^-k")
record("mm-geo.1", math.sqrt(sum(k * k * 0.5 ** k for k in range(1, 200)) - 4), "√(E[K²] − E[K]²) by series")
med = Fr(sum(sorted(r)[2] for r in itertools.product(DIE, repeat=5)), 6 ** 5)
record("mm-median5.0", med, f"exact enumeration of 7,776 rolls = {med}")
record("opt-parity-rates.0", 10 - 100 + 100 * math.exp(-0.05), "put–call parity with continuous compounding")

# ---------------------------------------------------------------- Wincent
# Win-by-two from deuce: absorbing chain on the lead (−2..2), solved as a linear system.
def deuce(p):
    q = 1 - p
    A = np.array([[1, -p, 0], [-q, 1, -p], [0, -q, 1]])
    win = np.linalg.solve(A, np.array([0, 0, p]))[1]
    steps = np.linalg.solve(A, np.ones(3))[1]
    return win, steps


w, n = deuce(0.4)
record("wc-deuce.0", w, "absorbing Markov chain on the lead")
record("wc-deuce.1", n, "expected absorption time of the same chain")


# Threes (Conroy, problem 56): exact optimal value by enumerating every roll and every number of
# lowest dice kept, with exact fractions.
FACES3 = (1, 2, 0, 4, 5, 6)
_threes = {0: Fr(0)}


def threes(n):
    if n not in _threes:
        total = Fr(0)
        for roll in itertools.product(FACES3, repeat=n):
            s = sorted(roll)
            total += min(sum(s[:k]) + threes(n - k) for k in range(1, n + 1))
        _threes[n] = total / 6 ** n
    return _threes[n]


record("wc-threes.0", threes(1), "exact mean of a Threes die")
record("wc-threes.1", threes(2), f"exact enumeration = {threes(2)}")
record("wc-threes.2", threes(5), f"exact dynamic programme = {threes(5)}")

# Random walk on a cube: hitting time of the opposite corner from the full 8-state chain.
P = np.zeros((8, 8))
for v in range(8):
    for b in range(3):
        P[v, v ^ (1 << b)] = 1 / 3
others = [v for v in range(8) if v != 7]
h = np.linalg.solve(np.eye(7) - P[np.ix_(others, others)], np.ones(7))
record("wc-cube-walk.0", h[0], "fundamental matrix of the 8-corner chain")
eigval, eigvec = np.linalg.eig(P.T)
pi = np.real(eigvec[:, np.argmin(abs(eigval - 1))])
record("wc-cube-walk.1", 1 / (pi[0] / pi.sum()), "1 / stationary probability")

# Branching process: smallest fixed point of the offspring generating function, by iteration.
qx = 0.0
for _ in range(2000):
    qx = 0.25 + 0.25 * qx + 0.5 * qx * qx
record("wc-branching.0", qx, "iterate q ← G(q) from 0")

# Ants: E[max of 100 iid U(0, 100)] by adaptive quadrature of x·f_max(x), f_max(x) = n x^(n−1) / L^n.

ants, _ = quad(lambda x: x * 100 * (x / 100) ** 99 / 100, 0, 100, epsabs=1e-13, epsrel=1e-13)
record("wc-ants.0", ants, "adaptive quadrature of x·f_max(x)")

post = Fr(2, 10) * Fr(7, 10) ** 3 / (Fr(2, 10) * Fr(7, 10) ** 3 + Fr(8, 10) * Fr(5, 10) ** 3)
record("wc-bayes-trader.0", post, f"Bayes with exact fractions = {post}")

# Kelly: maximise expected log growth numerically instead of using the formula.
g = lambda f: 0.6 * math.log(1 + f) + 0.4 * math.log(1 - f)  # noqa: E731
fk = brentq(lambda f: 0.6 / (1 + f) - 0.4 / (1 - f), 0.01, 0.9)
record("wc-kelly-coin.0", fk, "root of d/df E[log growth]")
record("wc-kelly-coin.1", g(fk), "E[log growth] at that root")

# ---------------------------------------------------------------- More reported questions
record("opt-all-faces.0", Fr(sum(len(set(r)) == 6 for r in itertools.product(DIE, repeat=6)), 6 ** 6), "count of 46,656 sequences")
record("opt-all-faces.1", sum(Fr(6, 6 - k) for k in range(6)), "sum of geometric waits")


# Three cards: best of every deterministic strategy (stop at once, or decide on the second card
# from the difference between the first two), over all 6 orders.
def best_three_cards():
    orders = list(itertools.permutations((0, 1, 2)))
    best = Fr(sum(a for a, _, _ in orders), 6)
    for keep in itertools.product((False, True), repeat=4):
        rule = dict(zip((-2, -1, 1, 2), keep))
        best = max(best, Fr(sum(b if rule[b - a] else c for a, b, c in orders), 6))
    return best


record("opt-three-cards.0", best_three_cards(), "search over all strategies")
pb = sum(Fr(1, 4) ** k for k in range(1, 80))  # B wins on flip 2k with prob (1/2)^(2k)
record("imc-b-wins.0", pb, "series Σ (1/4)^k, truncated")
record("imc-b-wins.1", Fr(1, 4) / Fr(1, 3), "P(TH) / P(B wins)")
# Walk from 0 between −100 and +50: solve the 151-state absorbing chain directly.
M = np.eye(151)
for i in range(1, 150):
    M[i, i - 1] = M[i, i + 1] = -0.5
rhs = np.zeros(151)
rhs[0] = 1
record("imc-walk.0", np.linalg.solve(M, rhs)[100], "linear system over 151 states")
rhs = np.ones(151)
rhs[0] = rhs[150] = 0
record("imc-walk.1", np.linalg.solve(M, rhs)[100], "expected absorption time, same system")
record("akuna-fair-coin.0", 2 / (2 * 0.7 * 0.3), "pairs until HT or TH, two flips each")
out = sum(n * Fr(math.comb(n - 1, 2) * math.comb(102 - n, 4), math.comb(102, 7)) for n in range(3, 103))
record("dv-outliers.0", out, f"negative hypergeometric, exact = {out}")
record("drw-ht-product.0", sum(Fr(math.comb(100, h), 2 ** 100) * h * (100 - h) for h in range(101)), "exact binomial sum")
four = sum(Fr(1, 16) * (sum(r) + (Fr(1, 2) if sum(r) < 4 else 0)) for r in itertools.product((0, 1), repeat=4))
record("js-four-coins.0", four, f"enumeration of 16 outcomes = {four}")


# ---------------------------------------------------------------- report
def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--js", help="answers.json from tests/export-answers.js to cross-check")
    args = ap.parse_args()

    js = json.load(open(args.js, encoding="utf-8")) if args.js else {}
    bad = 0
    print(f"{'question part':24s} {'Python':>14s} {'app (JS)':>14s}  method")
    for key, (val, how) in R.items():
        if js:
            if key not in js:
                print(f"{key:24s} {val:14.6f} {'MISSING':>14s}  {how}")
                bad += 1
                continue
            ok = math.isclose(val, js[key], rel_tol=1e-9, abs_tol=1e-9)
            bad += not ok
            print(f"{key:24s} {val:14.6f} {js[key]:14.6f}  {'✓' if ok else '✗ MISMATCH'} {how}")
        else:
            print(f"{key:24s} {val:14.6f}  {how}")
    if js:
        unverified = sorted(set(js) - set(R))
        print(f"\n{len(R) - bad}/{len(R)} values agree with the app.", f"Not independently derived (rules of thumb or trivial arithmetic): {', '.join(unverified)}" if unverified else "")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
