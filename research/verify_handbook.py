"""Independent answers for the handbook's checks and homework.

ANSWERS[chapter][key] is derived here without looking at the app: by enumeration or exact fractions
where possible, otherwise numerically. research/verify_results.py cross-checks each one against the
app to 1e-9, so a check with a deliberately rounded answer is rounded the same way here.

The original checks of Parts 1 and 2 are verified in verify_results.py; this file covers everything
added since. A key is the check's id, its position among checks with no id, or h<n> for homework.
"""
import itertools
import math
from fractions import Fraction as Fr
from math import comb, exp, log, pi, sqrt

import numpy as np
from scipy.integrate import quad
from scipy.stats import beta, norm

DIE = range(1, 7)
TWO = list(itertools.product(DIE, DIE))


def prob(cond, space):
    space = list(space)
    return Fr(sum(1 for s in space if cond(s)), len(space))


def wait_for(pattern):
    """Expected flips of a fair coin until `pattern`, by solving the prefix-state equations."""
    n = len(pattern)
    A = np.zeros((n, n))
    b = np.ones(n)

    def nxt(state, c):
        s = pattern[:state] + c
        while not pattern.startswith(s):
            s = s[1:]
        return len(s)

    for i in range(n):
        A[i, i] += 1
        for c in "HT":
            j = nxt(i, c)
            if j < n:
                A[i, j] -= 0.5
    return float(np.linalg.solve(A, b)[0])


def race(p1, p2):
    """P(p1 appears before p2) in fair coin flips, by value iteration on the last flips."""
    states = [""]
    v = {}
    L = max(len(p1), len(p2))
    for k in range(1, L):
        states += ["".join(s) for s in itertools.product("HT", repeat=k)]
    v = {s: 0.5 for s in states}
    for _ in range(3000):
        for s in states:
            t = 0.0
            for c in "HT":
                u = s + c
                if u.endswith(p1):
                    t += 0.5
                elif u.endswith(p2):
                    continue
                else:
                    t += 0.5 * v[u[-(L - 1):]]
            v[s] = t
    return v[""]


def reroll(n):
    v = Fr(7, 2)
    for _ in range(n):
        v = sum(max(Fr(x), v) for x in DIE) / 6
    return v


def uniform_game(n):
    v = 0.5
    for _ in range(n):
        v = (1 + v * v) / 2
    return v


def walk_touch(n, level):
    hits = 0
    for steps in itertools.product((1, -1), repeat=n):
        s = 0
        for x in steps:
            s += x
            if s == level:
                hits += 1
                break
    return Fr(hits, 2 ** n)


def ruin(i, N, p):
    """P(reach N before 0) by solving the linear system, not the closed form."""
    A = np.eye(N + 1)
    b = np.zeros(N + 1)
    b[N] = 1
    for k in range(1, N):
        A[k, k + 1] = -p
        A[k, k - 1] = -(1 - p)
    return float(np.linalg.solve(A, b)[i])


def hit_reflecting(n):
    """Expected steps from 0 to n with a reflecting wall at 0."""
    A = np.eye(n)
    b = np.ones(n)
    A[0, 1] = -1
    for k in range(1, n):
        A[k, k - 1] = -0.5
        if k + 1 < n:
            A[k, k + 1] = -0.5
    return float(np.linalg.solve(A, b)[0])


def knight_return():
    deg = {}
    for x, y in itertools.product(range(8), repeat=2):
        deg[x, y] = sum(0 <= x + a < 8 and 0 <= y + b < 8 for a, b in itertools.permutations((1, 2, -1, -2), 2) if abs(a) != abs(b))
    return sum(deg.values()) / deg[0, 0]


def max_two():
    return Fr(sum(max(p) for p in TWO), 36)


def min_third_corr(a):
    """The lowest corr(X, Z) that keeps [1 a z; a 1 a; z a 1] positive semi-definite, by bisection."""
    lo, hi = -1.0, a
    for _ in range(80):
        z = (lo + hi) / 2
        if np.linalg.eigvalsh(np.array([[1, a, z], [a, 1, a], [z, a, 1]]))[0] >= -1e-13:
            hi = z
        else:
            lo = z
    return hi


def min_equal_corr(n):
    lo, hi = -1.0, 0.0
    for _ in range(80):
        r = (lo + hi) / 2
        m = np.full((n, n), r)
        np.fill_diagonal(m, 1)
        if np.linalg.eigvalsh(m)[0] >= -1e-13:
            hi = r
        else:
            lo = r
    return hi


def top_share(n, r):
    m = np.full((n, n), float(r))
    np.fill_diagonal(m, 1)
    return float(np.linalg.eigvalsh(m)[-1] / n)


def equal_game(a, b, c, d):
    """Row's mix and value in the zero-sum game [[a, b], [c, d]], by making Column indifferent."""
    p = (d - c) / (a - b - c + d)
    return p, p * a + (1 - p) * c


def rps_paper():
    """Equilibrium of rock-paper-scissors with rock v scissors worth 2: solve A x = 0, sum x = 1."""
    A = np.array([[0, -1, 2], [1, 0, -1], [-2, 1, 0], [1, 1, 1]], float)
    return float(np.linalg.lstsq(A, np.array([0, 0, 0, 1.0]), rcond=None)[0][1])


def one_step(s, up, down, k):
    q = (s - down) / (up - down)
    return q * max(up - k, 0) + (1 - q) * max(down - k, 0)


FIT = np.polyfit([0, 1, 2], [1, 2, 4], 1)
full_deck = [(r, s) for r in range(13) for s in range(4)]

ANSWERS = {
    "arith": {
        "a1": Fr(16 * 25, 100), "a2": 85 ** 2,
        "h0": 73 * 67, "h1": 99 * 87, "h2": Fr(5, 8), "h3": 35 ** 2, "h4": Fr(25, 75), "h5": len(str(3 ** 20)), "h6": 25_000_000 * 8 / 10_000, "h7": 1.02 ** 35,
    },
    "toolkit": {
        0: 7, 1: log(1.1 * 0.9), 2: sum(range(101)), 3: Fr(3, 2), 5: 3, 6: 2, 7: quad(lambda x: 3 * x * x, 0, 2)[0], 8: 0.5 * 0.04 + 0.5 * 0.02, 9: 4 + 1 + 1 + 9,
        "h0": log(1.3), "h1": sum(range(2, 201, 2)), "h2": 1 / (1 - 0.9), "h3": 1 / math.e, "h4": quad(lambda x: x + x * x, 0, 1)[0], "h5": 0.25 * 0.04 + 0.25 * 0.09 + 2 * 0.25 * 0.01,
    },
    "counting": {
        "a1": comb(52, 5), "a2": comb(9, 2), "a3": comb(13, 2) * 6 * 6 * 44,
        "h0": math.factorial(5), "h1": math.factorial(4), "h2": len(set(itertools.permutations("TOOT"))), "h3": comb(13, 3) * comb(39, 2), "h4": comb(9, 3),
        "h5": sum(len(set(t)) == 3 for t in itertools.product(DIE, repeat=3)), "h6": 4 * comb(13, 5),
    },
    "prob-basics": {
        "h0": prob(lambda p: sum(p) >= 10, TWO), "h1": prob(lambda p: 6 in p, TWO),
        "h2": prob(lambda c: c[1] < 2 or c[0] >= 10, full_deck),
        "h3": Fr(2, 2 ** 10), "h4": Fr(39, 51) * Fr(26, 50), "h5": 1 - Fr(11 * 10 * 9 * 8, 12 ** 4),
    },
    "conditional": {
        "a1": Fr(9, 13),
        "h0": prob(lambda p: sum(p) >= 9, [p for p in TWO if p[0] >= 4]), "h1": Fr(2, 3), "h2": Fr(6, 10) * Fr(1, 100) + Fr(4, 10) * Fr(3, 100),
        "h3": (Fr(4, 10) * Fr(3, 100)) / (Fr(6, 10) * Fr(1, 100) + Fr(4, 10) * Fr(3, 100)),
        "h4": Fr(1, 100) / (Fr(1, 100) + Fr(99, 100) * Fr(1, 128)), "h5": 0.2 * 0.9 / (0.2 * 0.9 + 0.8 * 0.5),
    },
    "expectation": {
        "a1": sum(Fr(6, 6 - k) for k in range(6)),
        "h0": max_two(), "h1": Fr(19, 4), "h2": Fr(5, 13), "h3": Fr(7, 2) - 4, "h4": 5 * Fr(3, 4) ** 4, "h5": Fr(53, 5),
    },
    "variance": {
        "a1": 0.3 / 5,
        "h0": 0.3 * 0.7, "h1": 0.02 * 5, "h2": 3 / (2 * 3), "h3": 4 * 4 + 9 - 2 * 2 * 3, "h4": 1, "h5": Fr(2, 3), "h6": 0.01 / 0.05,
    },
    "distributions": {
        "h0": comb(5, 2) * Fr(1, 6) ** 2 * Fr(5, 6) ** 3, "h1": 4 * exp(-3), "h2": 0.8 ** 3, "h3": exp(-2), "h4": 0.9545, "h5": exp(-5), "h6": 5,
    },
    "symmetry": {
        "a1": Fr(4 * 53, 5),
        "h0": prob(lambda p: p[0] > p[1], TWO), "h1": Fr(1, 2), "h2": 5 * 0.8 ** 20, "h3": Fr(9, 2), "h4": 51 * Fr(25, 51), "h5": 4 * Fr(13, 52), "h6": 1,
    },
    "recursion": {
        "h0": wait_for("HH"), "h1": 3, "h2": Fr(1, 2) / (1 - Fr(1, 4)), "h3": 0.36 / (0.36 + 0.16), "h4": 6 * 7, "h5": 1 + 6, "h6": race("HHT", "HTH"),
    },
    "markov": {
        "h0": 0.1 / 0.4, "h1": 4, "h2": Fr(1, 2), "h3": 1 / 0.1, "h4": knight_return(), "h5": hit_reflecting(4), "h6": 2,
    },
    "walks": {
        "a1": walk_touch(4, 2),
        "h0": ruin(5, 20, 0.5), "h1": 75, "h2": ruin(5, 10, 0.55), "h3": 20 / 0.1, "h4": ruin(50, 100, 0.49), "h5": walk_touch(6, 2), "h6": 2 * 0.15866,
    },
    "stopping": {
        "h0": reroll(3), "h1": sum(max(Fr(sum(p)), Fr(7)) for p in TWO) / 36, "h2": max(Fr(13 - k, 2) - Fr(1, 2) * (Fr(6, k) - 1) for k in range(1, 7)),
        "h3": reroll(2) - reroll(1), "h4": uniform_game(2), "h5": 20 / math.e,
    },
    "continuous": {
        "h0": 0.125, "h1": 0.25, "h2": 0.2, "h3": 0.75, "h4": Fr(1, 3), "h5": pi / 4, "h6": quad(lambda x: x * x * 2 * x, 0, 1)[0],
    },
    "clt": {
        0: round(norm.sf(1), 5), 1: 2 / sqrt(400), 2: 2 * sqrt(10000 / 4), 3: (2 * 0.5 / 0.01) ** 2,
        "h0": sqrt(36 * 35 / 12), "h1": round(norm.sf(2), 4), "h2": 10 / 5, "h3": 100 * 4, "h4": (2 / 0.01) ** 2, "h5": 0.05 * sqrt(252),
    },
    "estimation": {
        0: 0.1 ** 2 + 0.02, 1: Fr(4, 5), 2: Fr(7, 10), 3: Fr(2 + 4 + 3 + 3, 4), 4: 100 * 1.25 - 1, 5: 1.96 * 20 / 10, 6: beta(9, 3).mean(),
        "h0": 3 / (2 + 3 + 7), "h1": sqrt(0.55 * 0.45 / 400), "h2": 0.55 - 1.96 * sqrt(0.55 * 0.45 / 400), "h3": 0.9, "h4": beta(5, 15).mean(), "h5": (1.96 * 0.5 / 0.02) ** 2,
    },
    "testing": {
        0: (60 - 50) / sqrt(100 / 4), 1: round(2 * norm.sf(2), 4), 2: 1.5 * sqrt(4), 3: (2 / 0.4) ** 2, 4: 1 - 0.95 ** 100, 5: 0.05 / 50, 6: 0.05 * 900 / (0.05 * 900 + 0.8 * 100),
        "h0": 30 / sqrt(1000 / 4), "h1": 0.1 / (2 / sqrt(400)), "h2": round(norm.sf(-0.04), 3), "h3": (2 / 2) ** 2, "h4": 1 - (1 - 0.0062) ** 20, "h5": 0.01 * 0.5 / (0.01 * 0.5 + 0.99 * 0.01),
    },
    "regression": {
        0: 0.5 * 30 / 10, 1: 2 + 1.5 * 4, 2: 0.6 ** 2, 3: (1 - 0.36) * 25, 4: 0.6 / 0.2, 5: 0.5 * 2,
        "h0": float(FIT[0]), "h1": float(FIT[1]), "h2": 0.7 * 30 / 15, "h3": 2 / (1 * sqrt(100)), "h4": 2 * 2 / (1 * sqrt(100)), "h5": 0.02 ** 2, "h6": 4 / 5,
    },
    "matrix": {
        0: float(np.array([0.6, 0.4]) @ np.array([[0.04, 0.01], [0.01, 0.01]]) @ np.array([0.6, 0.4])), 1: 0.3 / sqrt(3), 2: min_equal_corr(4), 3: min_third_corr(0.8), 4: float(np.linalg.eigvalsh(np.array([[1, 0.6], [0.6, 1]]))[-1]), 5: top_share(10, 0.3),
        "h0": min_third_corr(0.6), "h1": sqrt(0.16) * 0.25, "h2": (0.04 - 0.01) / (0.01 + 0.04 - 2 * 0.01), "h3": 3, "h4": 0.09 / (0.01 + 0.09), "h5": top_share(500, 0.2), "h6": min_third_corr(0.9),
    },
    "timeseries": {
        0: 1 + 0.2, 1: 3 / (1 - 0.25), 2: log(0.5) / log(0.9), 3: 0.8 ** 2 * 10, 4: 0.94 * 1 + 0.06 * 4,
        "h0": log(0.5) / log(0.5), "h1": 1 / (1 - 0.81), "h2": sqrt(2 * 1 * (1 - 0.5)), "h3": 2 * 0.95 ** 14, "h4": log(0.5) / log(0.94), "h5": 2 * 100,
    },
    "betting": {
        0: 1.5 * 0.6, 1: Fr(1 * 6 - 4, 10), 2: (2 * 0.5 - 0.5) / 2, 3: 0.6 * log(1.2) + 0.4 * log(0.8), 4: 0.1 / 0.2 ** 2, 5: 0.5 ** 2 / 2, 6: Fr(1, 2) ** 3,
        "h0": 2 * 0.55 - 1, "h1": (3 * 0.4 - 0.6) / 3, "h2": 0.55 * log(1.1) + 0.45 * log(0.9), "h3": 0.08 / 0.16 ** 2, "h4": 100000 * 0.25, "h5": 0.5, "h6": 2 * (0.5 - 0.125),
    },
    "market-making": {
        0: 100.01 - 99.99, 1: (100.01 + 99.99) / 2, 2: (100 * 100.01 + 200 * 100.02) / 300, 3: 3 * 3.5, 4: (52 - 50) * 5, 5: 0.2 * 10, 6: 0.6 * 110 + 0.4 * 90, 7: 5 + 3.5,
        "h0": 10 * (101 - 99), "h1": sqrt(10 / 4), "h2": 0.3 * 10, "h3": (300 * 99.99 + 100 * 99.98) / 400, "h4": 3 * sum(range(1, 14)) / 13, "h5": 13 + 2 * sum(range(1, 13)) / 12, "h6": 100 - 0.05 - 0.02 * 3,
    },
    "options": {
        0: max(115 - 100, 0), 1: max(100 - 115, 0), 2: 15 - 6, 3: 8 - 100 + 100, 4: 10 - 105 + 100, 5: one_step(100, 120, 80, 90), 6: 0.4 * 100 * 0.25, 7: 0.4 * 100 * 0.2 * 0.5, 8: 100 * 0.5, 9: 0.5 * 0.05 * 4, 10: 2 * 0.4 * 100 * 0.2,
        "h0": 10 - 100 + 100 * exp(-0.05), "h1": one_step(100, 110, 90, 100), "h2": (10 - 0) / (110 - 90), "h3": 0.25 * max(120 - 100, 0), "h4": 0.8 * 50 * 0.4 * 0.5, "h5": 10 - 9.52, "h6": 48 / 16,
    },
    "fermi": {
        0: sqrt(100 * 10000), 1: 3e4 * 2e3, 2: 2 ** sqrt(4), 3: 10 * 0.1,
        "h0": sqrt(2 * 200), "h1": 365.25 * 86400, "h2": 70 * 60 * 24 * 365.25 * 80,
    },
    "games": {
        0: equal_game(3, 0, 0, 1)[0], 1: equal_game(3, 0, 0, 1)[1], 2: 50 / (100 + 2 * 50), 3: 100 / (100 + 2 * 100), 4: 100 / (100 + 50), 5: 99, 6: 0, 7: 0.8 / 2,
        "h0": equal_game(1, -1, -1, 1)[0], "h1": equal_game(3, -1, -1, 1)[0], "h2": 60 / (120 + 120), "h3": 100 / (100 + 100), "h4": 200 / (100 + 400), "h5": 98, "h6": rps_paper(),
    },
    "factors": {
        0: (12 - 2) / 20, 1: 0.1 * sqrt(252), 2: (120 - 90) / 120, 3: 5 * 1.2, 4: 15 - 1.2 * 10, 5: sqrt(0.4 ** 2 - 0.2 ** 2), 6: 0.03 * sqrt(1600),
        "h0": (15 - 5) / 10, "h1": 20 * 0.8 - 10 * 1.1, "h2": 0.5 ** 2, "h3": (1 / 0.02) ** 2, "h4": 10 / 1, "h5": 4 / 20, "h6": 0.2 * sqrt(100),
    },
    "backtest": {
        0: 0.9 * 0.1 + 0.1 * -1, 1: sqrt(2 * log(100)) / sqrt(9), 2: 10 * sqrt(9), 3: 15 - 40 * 0.05, 4: 10 / 100 * 100,
        "h0": 0.75 * 0.08 + 0.25 * -0.3, "h1": 20 - 50 * 0.1, "h2": 16 * sqrt(1 / 4), "h3": 252 / 5, "h4": sqrt(2 * log(1000)) / sqrt(4), "h5": (40 - 200 * 0.05) / 20, "h6": 2 ** (5 - 3),
    },
}
