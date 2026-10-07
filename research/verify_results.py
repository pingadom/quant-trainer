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

# Ants: E[max of 500 iid U(0, 100)] by adaptive quadrature of x·f_max(x), f_max(x) = n x^(n−1) / L^n.

ants, _ = quad(lambda x: x * 500 * (x / 100) ** 499 / 100, 0, 100, epsabs=1e-13, epsrel=1e-13, points=[99, 99.9])
record("wc-ants.0", ants, "adaptive quadrature of x·f_max(x)")

# Hat of bills: solve the optimal-stopping problem by backward induction over the bills left
# (ones, tens, hundred), comparing "stop now" (mean of what's left) with "see one more draw".
def hat_value():
    from functools import lru_cache

    @lru_cache(None)
    def V(a, b, c):
        n = a + b + c
        stop = Fr(a * 1 + b * 10 + c * 100, n)
        if n == 1:
            return stop
        cont = Fr(0)
        for k, (cnt, nxt) in enumerate(((a, (a - 1, b, c)), (b, (a, b - 1, c)), (c, (a, b, c - 1)))):
            if cnt:
                cont += Fr(cnt, n) * V(*nxt)
        return max(stop, cont)

    import sys as _s
    _s.setrecursionlimit(10000)
    return V(100, 10, 1)


record("wc-hat.0", hat_value(), "optimal stopping by backward induction over 2,222 states")


# Dice until the total exceeds 100: exact expectations by backward recursion from 100 down.
def over_100():
    Et, Er = [Fr(0)] * 107, [Fr(0)] * 107
    for t in range(100, -1, -1):
        Et[t] = sum((Fr(t + d) if t + d > 100 else Et[t + d]) for d in DIE) / 6
        Er[t] = sum((Fr(1) if t + d > 100 else 1 + Er[t + d]) for d in DIE) / 6
    return Et[0], Er[0]


tot, rolls = over_100()
record("wc-over-100.0", tot, "exact backward recursion")
record("wc-over-100.1", rolls, "exact backward recursion")
# Broken stick: for break points u < v, the allowed u-interval has length 1 − v when v > ½.
tri, _ = quad(lambda v: (1 - v) if v > 0.5 else 0.0, 0, 1, points=[0.5], epsabs=1e-14)
record("wc-stick-triangle.0", 2 * tri, "integral over the unit square of break points")
sieve = bytearray([1]) * (10 ** 6 + 1)
sieve[0] = sieve[1] = 0
for i in range(2, 1001):
    if sieve[i]:
        sieve[i * i::i] = bytearray(len(range(i * i, 10 ** 6 + 1, i)))
record("wc-primes.0", sum(sieve), "sieve of Eratosthenes")

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


# ---------------------------------------------------------------- bank-reports.js (Oct 2026 collection)
def pattern_race(a, b):
    """P(pattern a appears before pattern b) with a fair coin: solve the prefix-state Markov chain."""
    states = sorted({a[:i] for i in range(len(a))} | {b[:i] for i in range(len(b))}, key=len)
    idx = {st: i for i, st in enumerate(states)}

    def step(st, c):
        s2 = st + c
        if s2.endswith(a):
            return "A"
        if s2.endswith(b):
            return "B"
        while s2 not in idx:
            s2 = s2[1:]
        return s2

    M, rhs = np.eye(len(states)), np.zeros(len(states))
    for st, i in idx.items():
        for c in "HT":
            nx = step(st, c)
            if nx == "A":
                rhs[i] += 0.5
            elif nx != "B":
                M[i, idx[nx]] -= 0.5
    return np.linalg.solve(M, rhs)[idx[""]]


def wait_pattern(pat, p, symbols):
    """Expected trials until `pat` appears, P(symbols[0]) = p: exact, by value iteration on fractions
    replaced with a linear solve over prefix states."""
    pr = {symbols[0]: float(p), symbols[1]: 1 - float(p)}
    states = [pat[:i] for i in range(len(pat))]

    def nxt(st, c):
        s2 = st + c
        while s2 and not pat.startswith(s2):
            s2 = s2[1:]
        return s2

    n = len(states)
    M, rhs = np.eye(n), np.ones(n)
    for i, st in enumerate(states):
        for c in symbols:
            n2 = nxt(st, c)
            if n2 != pat:
                M[i, states.index(n2)] -= pr[c]
    return np.linalg.solve(M, rhs)[0]


def paid_reroll(n, cost):
    """Value of a fresh roll when each reroll costs `cost`: the Bellman fixed point."""
    return brentq(lambda v: sum(max(x, v - cost) for x in range(1, n + 1)) / n - v, 0, n + 1)


record("js-three-coins.0", (Fr(1, 3) * 1) / (Fr(1, 3) * 1 + Fr(1, 3) * Fr(1, 2)), "Bayes over the three coins")
bids = np.linspace(0, 1000, 1001)
profit = [quad(lambda v, b=b: (1.5 * v - b) / 1000, 0, b)[0] if b else 0.0 for b in bids]
record("js-treasure-bid.0", bids[int(np.argmax(profit))], "grid search of numerically integrated profit")
record("js-treasure-bid.1", quad(lambda v: (1.5 * v - 1000) / 1000, 0, 1000)[0], "integral")
record("js-circle-regions.0", math.comb(5, 4) + math.comb(5, 2) + 1, "1 + C(n,2) + C(n,4)")
record("js-circle-regions.1", math.comb(6, 4) + math.comb(6, 2) + 1, "1 + C(n,2) + C(n,4)")
record("js-even-heads.0", sum(Fr(math.comb(100, k), 2 ** 100) for k in range(0, 101, 2)), "exact binomial sum")
record("js-one-question.0", 99, "log2 of 2^100 / 2")
record("js-go-first.0", sum(Fr(1, 2) ** (2 * k + 1) for k in range(300)), "geometric series over the first player's turns")
record("js-go-first.1", 30 * (2 * Fr(2, 3) - 1), "30 x (P(win) - P(lose))")
tails4 = [sum(r) for r in itertools.product((0, 1), repeat=4)]
record("js-four-tails.0", Fr(tails4.count(3), sum(t >= 2 for t in tails4)), "enumerate 16 outcomes")
record("js-hht-htt.0", pattern_race("HHT", "HTT"), "prefix-state Markov chain")
record("js-socks.0", Fr(1, 2) * 2 + Fr(1, 2) * 3, "match on draw 2, else draw 3")
record("js-up-down-20.0", Fr(6, 5) * Fr(4, 5), "1.2 x 0.8")
record("js-up-down-20.1", sum(1 for n in range(1, 120) for u in range(n + 1) if Fr(6, 5) ** u * Fr(4, 5) ** (n - u) == 1), "exact search, n < 120")
record("js-handshakes.0", 15 - 1, "the host's partner shook n - 1 hands for n couples")
w = next(ws for ws in itertools.combinations(range(1, 26), 5) if sorted(a + b for a, b in itertools.combinations(ws, 2)) == [16, 17, 18, 19, 20, 21, 22, 24, 25, 26])
record("js-melons.0", max(w), f"search over weights {w}")
record("js-melons.1", min(w), f"search over weights {w}")
reach = {0: Fr(1)}
for t in range(2, 200, 2):
    reach[t] = sum(reach[t - k] for k in range(2, 13, 2) if t - k >= 0) / 12
end = {s: sum(reach[s - k] for k in range(1, 13, 2) if s - k >= 0) / 12 for s in range(1, 199, 2)}
record("js-odd-sum-d12.0", max(end, key=end.get), "exact distribution of the stopping total")
record("js-odd-sum-d12.1", end[11], f"exact = {end[11]}")
record("js-cheap-rerolls.0", paid_reroll(10, 0.1), "Bellman equation, brentq")
record("js-cheap-rerolls.1", paid_reroll(100, 0.01), "Bellman equation, brentq")


def bus_ok(x):
    for _ in range(3):
        if x % 4:
            return False
        x = x // 4 + 7
    return True


record("js-bus.0", next(x for x in range(1, 10000) if bus_ok(x)), "search")
sums = {}
for a in range(1, 7):
    for b in range(1, 11):
        sums[a + b] = sums.get(a + b, 0) + Fr(1, 60)
best = max(sums, key=lambda s: s * sums[s])
record("js-guess-sum.0", best, "argmax of s x P(s)")
record("js-guess-sum.1", best * sums[best], "s x P(s)")
record("js-amoeba.0", brentq(lambda q: (1 + q + q * q + q ** 3) / 4 - q, 0, 0.9), "smallest root of q = G(q)")
record("js-square-37.0", 37 ** 2, "arithmetic")
record("opt-80in8-examples.0", 46 ** 2, "arithmetic")
record("opt-80in8-examples.1", round(2 / 17, 4), "rounded to 4 dp")
record("opt-bp-power.0", Fr(44, 157) * 10000, "exact")
record("opt-bp-power.1", round(7 ** 2.5), "rounded")
record("opt-circle-ages.0", Fr(sum(1 for p in itertools.permutations(range(5)) if list(p) in (sorted(p), sorted(p)[::-1])), math.factorial(5)), "enumerate seatings")
record("opt-five-flips.0", sum(Fr(math.comb(5, h), 32) * (2 * h - 5) for h in range(6)), "exact")
record("opt-five-flips.1", math.sqrt(sum(Fr(math.comb(5, h), 32) * (2 * h - 5) ** 2 for h in range(6))), "exact second moment")
record("opt-hundred-flips.0", math.sqrt(100 * 0.25), "sqrt(npq)")
record("opt-hundred-flips.1", round(math.comb(100, 50) / 2 ** 100, 4), "exact, to 4 dp")
pairs = list(itertools.product(DIE, DIE))
record("opt-doubles-cancelled.0", Fr(sum(a + b for a, b in pairs if a != b), 36), "enumerate 36 rolls")
record("opt-doubles-cancelled.1", Fr(sum(a + b for a, b in pairs if a != b), 30), "mean over the 30 non-doubles")
pay = {x: (2 * x if x % 2 == 0 else x) for x in DIE}
e1 = Fr(sum(pay.values()), 6)
record("sig-even-bonus.0", e1, "enumerate faces")
record("sig-even-bonus.1", Fr(sum(max(pay[x], e1) for x in DIE), 6), "keep a payout above the reroll value")
record("sig-wait-six.0", 6, "geometric mean 1/p")
record("sig-ordered-rolls.0", Fr(sum(a < b for a, b in pairs), 36), "enumerate 36 rolls")
chambers = [1, 1, 0, 0, 0, 0]
empty = [i for i in range(6) if not chambers[i]]
record("sig-revolver.0", Fr(sum(not chambers[(i + 1) % 6] for i in empty), len(empty)), "enumerate empty chambers")
record("sig-revolver.1", Fr(len(empty), 6), "empty chambers / 6")
hd = [Fr(math.comb(3, k), 8) for k in range(4)]
pm = sum(x * x for x in hd)
record("sig-match-heads.0", pm, "sum of squared binomial probabilities")
record("sig-match-heads.1", 2 * pm - (1 - pm), "2P - (1 - P)")
record("sig-hth.0", wait_pattern("HTH", 0.5, "HT"), "prefix chain linear solve")
record("sig-25-swimmers.0", 7, "5 heats + winners' race + candidates' race (standard optimum)")
record("sig-hawk.0", 1 - math.exp(math.log(0.2) / 2), "Poisson: P(none) = exp(-rate x t)")
record("sig-sock-drawer.0", Fr(1, 2) * Fr(2, 5) ** 2 / (Fr(1, 2) * Fr(2, 5) ** 2 + Fr(1, 2) * Fr(7, 10) ** 2), "Bayes")
mover_wins = {}
for t in range(50, -1, -1):
    moves = [t + k for k in range(1, 11) if t + k <= 50]
    mover_wins[t] = any(m == 50 or not mover_wins[m] for m in moves)
record("sig-count-50.0", next(k for k in range(1, 11) if not mover_wins[k]), "backward induction over totals")
record("sig-circle-ages.0", Fr(2, math.factorial(4)), "2 of 4! seatings")
record("imc-three-profits.0", Fr(1, math.factorial(3)), "one of 3! orderings")
record("imc-two-child.0", Fr(1, 3), "BB among BB, BG, GB")
record("imc-two-child.1", Fr(1, 2), "other child independent")
cells = list(itertools.permutations(range(16), 3))
record("imc-grid-balls.0", Fr(sum(len({c // 4 for c in t}) < 3 or len({c % 4 for c in t}) < 3 for t in cells), len(cells)), "enumerate placements")
days = list(itertools.product(range(7), repeat=3))
record("imc-weekday.0", Fr(sum(len(set(d)) < 3 for d in days), len(days)), "enumerate 343 cases")
record("cit-every-face.0", 6 * sum(Fr(1, k) for k in range(1, 7)), "coupon collector")
record("cit-coin-ranges.0", sum(math.comb(100, k) for k in range(40, 61)) / 2 ** 100, "exact binomial")
perms5 = list(itertools.permutations(range(1, 6)))
record("cit-local-min.0", Fr(sum(sum(p[i] < p[i - 1] and p[i] < p[(i + 1) % 5] for i in range(5)) for p in perms5), len(perms5)), "enumerate 120 circles")
record("cit-sqrt-30.0", math.sqrt(30), "sqrt")
M = np.zeros((52, 52))
rhs = np.ones(52)
for k in range(52):
    M[k, k] = 1
    if k < 51:
        M[k, k] -= 1 - (k + 1) / 52
        M[k, k + 1] -= (k + 1) / 52
rhs[51] = 0
record("drw-bottom-card.0", np.linalg.solve(M, rhs)[0], "absorbing chain on the number of cards below")
ROT_X, ROT_Y = (2, 3, 1, 0, 4, 5), (0, 1, 4, 5, 3, 2)  # faces: up, down, front, back, left, right
group, frontier = {tuple(range(6))}, [tuple(range(6))]
while frontier:
    g = frontier.pop()
    for h in (ROT_X, ROT_Y):
        c = tuple(g[h[i]] for i in range(6))
        if c not in group:
            group.add(c)
            frontier.append(c)
orbits = {min(tuple(col[g[i]] for i in range(6)) for g in group) for col in itertools.permutations(range(6))}
record("drw-cube-colours.0", len(orbits), f"orbits under the {len(group)}-element rotation group")
num = den = Fr(0)
for n in range(1, 500):
    pn, pa = Fr(5, 6) ** (n - 1) * Fr(1, 6), 1 - Fr(4, 5) ** (n - 1)
    num += n * pn * pa
    den += pn * pa
record("hrt-three-before-six.0", num / den, "series over the game length")
record("fr-ten-second-estimates.0", 10 ** 0.1, "exact")
record("fr-ten-second-estimates.1", math.log(3) / math.log(1.2), "exact")
record("fr-ten-second-estimates.2", len(str(math.factorial(50))), "count the digits")
record("fr-ten-second-estimates.3", 50 * 25 * 2, "50 m x 25 m x 2 m")
record("fr-pizza.0", 1 + sum(range(1, 11)), "lazy caterer")
record("fr-second-die.0", Fr(sum(a + (Fr(7, 2) if a <= 4 else 0) for a in DIE), 6), "condition on the first die")
record("fr-traffic.0", 1 - math.sqrt(0.75), "Poisson halving")
M = np.eye(11)
rhs = np.zeros(11)
rhs[10] = 1
for a in range(1, 10):
    M[a, a - 1] -= 0.5
    M[a, a + 1] -= 0.5
record("fr-ruin-6-4.0", np.linalg.solve(M, rhs)[6], "gambler's ruin linear system")
dist, e_walk = {0: 1.0}, 0.0
for n in range(1, 500):
    nd = {}
    for d, pr in dist.items():
        for step, q in ((1, 2 / 3), (-1, 1 / 3)):
            if d + step == 2:
                e_walk += n * pr * q
            elif d + step > -80:
                nd[d + step] = nd.get(d + step, 0) + pr * q
    dist = nd
record("fr-walk-two.0", e_walk, "first-passage distribution by DP")
three = list(itertools.product((0, 1), repeat=3))
some = [t for t in three if sum(t)]
record("akuna-told-heads.0", Fr(sum(sum(t) == 3 for t in some), len(some)), "enumerate")
record("akuna-told-heads.1", Fr(sum(sum(t) == 2 for t in some), len(some)), "enumerate")
record("akuna-told-heads.2", Fr(sum(t[1] and t[2] for t in three if t[0]), sum(t[0] for t in three)), "condition on coin 1")
record("akuna-max-dice.0", Fr(sum(max(p) for p in itertools.product(DIE, repeat=2)), 36), "enumerate")
record("akuna-max-dice.1", Fr(sum(max(p) for p in itertools.product(DIE, repeat=3)), 216), "enumerate")


def look_say(s):
    return "".join(f"{len(list(g))}{k}" for k, g in itertools.groupby(s))


terms = ["12"]
for _ in range(4):
    terms.append(look_say(terms[-1]))
assert terms[1:4] == ["1112", "3112", "132112"], terms
record("akuna-look-say.0", int(terms[4]), "look-and-say rule")
record("jump-triple.0", next(40 - a - b for a in range(1, 40) for b in range(a, 40) if 40 - a - b > 0 and a * a + b * b == (40 - a - b) ** 2), "search")
record("jump-normal.0", 0.5, "X - 5Y is symmetric about 0")
record("mav-pens.0", -4, "four sales")
record("mav-pens.1", 13 + 16 + 19 + 22 - 4 * 22, "proceeds - value")
record("mav-pens.2", max(p for p in range(100) if 4 * p < 70), "4p < 70")
record("mav-chessboard.0", sum((9 - w) * (9 - h) for w in range(1, 9) for h in range(1, 9)), "count by rectangle size")
record("mav-weighings.0", math.ceil(math.log(8, 3)), "information bound (achievable)")
record("mav-weighings.1", math.ceil(math.log(24, 3)), "information bound over 24 cases (achievable)")
record("mav-17-7.0", round(17 / 7, 10), "rounded to 10 dp")


def n_cycles(p):
    seen, c = set(), 0
    for i in range(len(p)):
        if i not in seen:
            c += 1
            j = i
            while j not in seen:
                seen.add(j)
                j = p[j]
    return c


perms4 = list(itertools.permutations(range(4)))
record("mav-cycles.0", Fr(sum(n_cycles(p) for p in perms4), len(perms4)), "enumerate 24 permutations")
blocks = [c for c in range(3) for _ in range(6)]
draws = list(itertools.combinations(range(18), 5))
record("mav-tower.0", Fr(sum(len({blocks[i] for i in d}) == 2 for d in draws), len(draws)), "enumerate 8568 draws")
record("mav-numerical-test.0", 35 * 26, "arithmetic")
record("mav-numerical-test.1", 15 * 76, "arithmetic")
record("flow-etf-weight.0", 0.08 * 5, "weight x move")
record("flow-maths-test.0", 23 * 52, "arithmetic")
record("flow-maths-test.1", 9234 * 2435, "arithmetic")
record("flow-watermelon.0", 1 / 0.02, "dry mass is constant")
record("dv-ten-cards.0", math.sqrt(10 * Fr(13 ** 2 - 1, 12)), "variance of a discrete uniform")
conv = {0: Fr(1)}
for _ in range(10):
    nd = {}
    for s_, pr in conv.items():
        for r in range(1, 14):
            nd[s_ + r] = nd.get(s_ + r, 0) + pr / 13
    conv = nd
record("dv-ten-cards.1", round(float(sum(abs(s_ - 70) * pr for s_, pr in conv.items())), 4), "exact convolution, to 4 dp")
deck = [r for r in range(1, 14) for _ in range(4)]
record("dv-three-cards.0", 3 * Fr(sum(deck), 52), "linearity")
var1 = Fr(sum(x * x for x in deck), 52) - Fr(sum(deck), 52) ** 2
record("dv-three-cards.1", math.sqrt(3 * var1 * Fr(49, 51)), "finite-population variance")
record("om-abs-diff.0", Fr(sum(abs(a - b) for a, b in pairs), 36), "enumerate")
record("bel-local-max.0", 18 * Fr(1, 3), "linearity: P(tallest of three) = 1/3")
record("sq-meeting.0", 1 - Fr(3, 4) ** 2, "unit-square geometry")
lik_b = 3 * Fr(2, 3) ** 2 * Fr(1, 3) * Fr(3, 8)
lik_f = Fr(3, 8) * 3 * Fr(2, 3) * Fr(1, 3) ** 2
record("sq-biased-coin.0", lik_b / (lik_b + lik_f), "Bayes with binomial likelihoods")
record("val-two-fives.0", wait_pattern("55", Fr(1, 6), "5x"), "prefix chain linear solve")


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
