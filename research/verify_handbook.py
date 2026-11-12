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


def risk_neutral_call(s, k, sigma, t, payoff=None):
    """E[payoff(S_T)] with S_T = s exp(-sigma^2 t/2 + sigma sqrt(t) Z), by integrating over Z (no formula)."""
    pay = payoff or (lambda x: max(x - k, 0.0))
    f = lambda z: pay(s * exp(-0.5 * sigma ** 2 * t + sigma * sqrt(t) * z)) * norm.pdf(z)
    return quad(f, -12, 12, points=[0.0], limit=200)[0]


def eig(m):
    return np.linalg.eigvals(np.array(m, float))


def solve(m, b):
    return np.linalg.solve(np.array(m, float), np.array(b, float))


FIT = np.polyfit([0, 1, 2], [1, 2, 4], 1)
full_deck = [(r, s) for r in range(13) for s in range(4)]

def ruin_far(i, p=0.6, top=300):
    """P(hit 0) from i for a +1 (p) / -1 walk, by solving the first-step equations on 0..top."""
    A = np.zeros((top + 1, top + 1))
    rhs = np.zeros(top + 1)
    A[0, 0], rhs[0] = 1, 1
    A[top, top] = 1  # far enough up that ruin from there is negligible
    for k in range(1, top):
        A[k, k], A[k, k + 1], A[k, k - 1] = 1, -p, -(1 - p)
    return np.linalg.solve(A, rhs)[i]


def red_black_value(r, b):
    """Red-and-black card game value by brute force over every order of the deck and every
    "stop when the running score reaches k" rule, which contains the optimal rule for small decks."""
    deck = "R" * r + "B" * b
    orders = set(itertools.permutations(deck))
    best = Fr(0)
    for k in range(0, r + 1):
        total = Fr(0)
        for o in orders:
            score = 0
            for card in o:
                if score >= k and k > 0:
                    break
                score += 1 if card == "R" else -1
            total += score
        best = max(best, total / len(orders))
    return best


def ols_slope_omitted(n=400_000, seed=3):
    """Slope of y on x1 alone when y = x1 + 2 x2 and x2 = 0.5 x1 + noise, by simulation (rounded)."""
    rng = np.random.default_rng(seed)
    x1 = rng.standard_normal(n)
    x2 = 0.5 * x1 + rng.standard_normal(n)
    y = x1 + 2 * x2 + rng.standard_normal(n)
    return round(np.polyfit(x1, y, 1)[0], 1)


def ols_slope_noisy(n=400_000, seed=4):
    """Slope of y on a noisy reading of x (signal and noise variance 1), true slope 2 (rounded)."""
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    y = 2 * x + rng.standard_normal(n)
    return round(np.polyfit(x + rng.standard_normal(n), y, 1)[0], 1)


def garch_long_run(omega, alpha, beta, steps=20_000):
    """Long-run variance of a GARCH(1, 1), by iterating the expected-variance recursion from zero."""
    v = 0.0
    for _ in range(steps):
        v = omega + (alpha + beta) * v
    return v


ANSWERS = {
    "arith": {
        # added with the deeper chapter
        "x1": sqrt(50),
        "x2": max(Fr(7, 9), Fr(11, 14)),
        "a1": Fr(16 * 25, 100), "a2": 85 ** 2,
        "h0": 73 * 67, "h1": 99 * 87, "h2": Fr(5, 8), "h3": 35 ** 2, "h4": Fr(25, 75), "h5": len(str(3 ** 20)), "h6": 25_000_000 * 8 / 10_000, "h7": 1.02 ** 35,
    },
    "toolkit": {
        # added with the deeper chapter
        "x1": exp(-1),
        "x2": quad(lambda x: x * exp(-2 * x), 0, np.inf)[0],
        0: 7, 1: log(1.1 * 0.9), 2: sum(range(101)), 3: Fr(3, 2), 5: 3, 6: 2, 7: quad(lambda x: 3 * x * x, 0, 2)[0], 8: 0.5 * 0.04 + 0.5 * 0.02, 9: 4 + 1 + 1 + 9,
        "h0": log(1.3), "h1": sum(range(2, 201, 2)), "h2": 1 / (1 - 0.9), "h3": 1 / math.e, "h4": quad(lambda x: x + x * x, 0, 1)[0], "h5": 0.25 * 0.04 + 0.25 * 0.09 + 2 * 0.25 * 0.01,
    },
    "counting": {
        # added with the deeper chapter
        "x2": len(set(itertools.permutations("RRRRRUUUUU"))),
        "x3": sum(all(p[i] != i for i in range(5)) for p in itertools.permutations(range(5))),
        "a1": comb(52, 5), "a2": comb(9, 2), "a3": comb(13, 2) * 6 * 6 * 44,
        "h0": math.factorial(5), "h1": math.factorial(4), "h2": len(set(itertools.permutations("TOOT"))), "h3": comb(13, 3) * comb(39, 2), "h4": comb(9, 3),
        "h5": sum(len(set(t)) == 3 for t in itertools.product(DIE, repeat=3)), "h6": 4 * comb(13, 5),
    },
    "prob-basics": {
        "h0": prob(lambda p: sum(p) >= 10, TWO), "h1": prob(lambda p: 6 in p, TWO),
        "h2": prob(lambda c: c[1] < 2 or c[0] >= 10, full_deck),
        "h3": Fr(2, 2 ** 10), "h4": Fr(39, 51) * Fr(26, 50), "h5": 1 - Fr(11 * 10 * 9 * 8, 12 ** 4),
        # added with the deeper chapter: by enumeration where it is small enough
        "x1": 1 - Fr(49, 50) ** 50,
        "x2": prob(lambda c: c[1] == 0 or c[0] >= 10 or c[0] == 0, full_deck),
        "x4": Fr(sum(1 for p in itertools.permutations("RRRRRBBB") if p[2] == "B"), math.factorial(8)),
    },
    "conditional": {
        # added with the deeper chapter
        "x1": Fr(comb(13, 3), comb(52, 3)),
        "x2": (Fr(1, 2) * Fr(1, 2) ** 4 + Fr(1, 2)) / (Fr(1, 2) * Fr(1, 2) ** 3 + Fr(1, 2)),
        "a1": Fr(9, 13),
        "h0": prob(lambda p: sum(p) >= 9, [p for p in TWO if p[0] >= 4]), "h1": Fr(2, 3), "h2": Fr(6, 10) * Fr(1, 100) + Fr(4, 10) * Fr(3, 100),
        "h3": (Fr(4, 10) * Fr(3, 100)) / (Fr(6, 10) * Fr(1, 100) + Fr(4, 10) * Fr(3, 100)),
        "h4": Fr(1, 100) / (Fr(1, 100) + Fr(99, 100) * Fr(1, 128)), "h5": 0.2 * 0.9 / (0.2 * 0.9 + 0.8 * 0.5),
    },
    "expectation": {
        # added with the deeper chapter
        "x1": 1 + Fr(19, 2),
        "x2": 1 / Fr(2, 6),
        "x3": Fr(35, 37) - Fr(36, 37),
        "a1": sum(Fr(6, 6 - k) for k in range(6)),
        "h0": max_two(), "h1": Fr(19, 4), "h2": Fr(5, 13), "h3": Fr(7, 2) - 4, "h4": 5 * Fr(3, 4) ** 4, "h5": Fr(53, 5),
    },
    "variance": {
        # added with the deeper chapter
        "x1": Fr(1, 9),
        "x2": sqrt(400 * 0.5 * 0.5),
        "x3": float(min(np.linspace(0, 2, 200001), key=lambda w: (w * 0.1) ** 2 + ((1 - w) * 0.2) ** 2 + 2 * w * (1 - w) * 0.5 * 0.1 * 0.2)),  # numerical minimum
        "a1": 0.3 / 5,
        "h0": 0.3 * 0.7, "h1": 0.02 * 5, "h2": 3 / (2 * 3), "h3": 4 * 4 + 9 - 2 * 2 * 3, "h4": 1, "h5": Fr(2, 3), "h6": 0.01 / 0.05,
    },
    "distributions": {
        # added with the deeper chapter
        "x1": 2 ** 2 * exp(-2) / 2,
        "x2": Fr(2, 5),
        "x3": 2.326,  # the quoted quantile; checked against scipy just below
        "h0": comb(5, 2) * Fr(1, 6) ** 2 * Fr(5, 6) ** 3, "h1": 4 * exp(-3), "h2": 0.8 ** 3, "h3": exp(-2), "h4": 0.9545, "h5": exp(-5), "h6": 5,
    },
    "symmetry": {
        # added with the deeper chapter
        "x2": sum(Fr(1, i) for i in range(1, 11)),
        "a1": Fr(4 * 53, 5),
        "h0": prob(lambda p: p[0] > p[1], TWO), "h1": Fr(1, 2), "h2": 5 * 0.8 ** 20, "h3": Fr(9, 2), "h4": 51 * Fr(25, 51), "h5": 4 * Fr(13, 52), "h6": 1,
    },
    "recursion": {
        # added with the deeper chapter
        "x1": prob(lambda r: 3 in itertools.accumulate(r), itertools.product(DIE, repeat=3)),
        "h0": wait_for("HH"), "h1": 3, "h2": Fr(1, 2) / (1 - Fr(1, 4)), "h3": 0.36 / (0.36 + 0.16), "h4": 6 * 7, "h5": 1 + 6, "h6": race("HHT", "HTH"),
    },
    "markov": {
        # added with the deeper chapter
        "x1": float((np.linalg.matrix_power(np.array([[0.8, 0.2], [0.4, 0.6]]), 2))[0, 1]),
        "h0": 0.1 / 0.4, "h1": 4, "h2": Fr(1, 2), "h3": 1 / 0.1, "h4": knight_return(), "h5": hit_reflecting(4), "h6": 2,
    },
    "walks": {
        # added with the deeper chapter
        "x1": round(float(ruin_far(2)), 9),
        "x2": Fr(sum(all(sum(1 if i in c else -1 for i in range(k + 1)) > 0 for k in range(10)) for c in map(set, itertools.combinations(range(10), 6))), comb(10, 6)),
        "a1": walk_touch(4, 2),
        "h0": ruin(5, 20, 0.5), "h1": 75, "h2": ruin(5, 10, 0.55), "h3": 20 / 0.1, "h4": ruin(50, 100, 0.49), "h5": walk_touch(6, 2), "h6": 2 * 0.15866,
    },
    "stopping": {
        # added with the deeper chapter
        "x1": red_black_value(2, 2),
        "h0": reroll(3), "h1": sum(max(Fr(sum(p)), Fr(7)) for p in TWO) / 36, "h2": max(Fr(13 - k, 2) - Fr(1, 2) * (Fr(6, k) - 1) for k in range(1, 7)),
        "h3": reroll(2) - reroll(1), "h4": uniform_game(2), "h5": 20 / math.e,
    },
    "continuous": {
        # added with the deeper chapter
        "x1": quad(lambda x: sqrt(x), 0, 1)[0],
        "x2": quad(lambda th: 0.25 * math.sin(th), 0, pi / 2)[0] / (0.5 * pi / 2),
        "h0": 0.125, "h1": 0.25, "h2": 0.2, "h3": 0.75, "h4": Fr(1, 3), "h5": pi / 4, "h6": quad(lambda x: x * x * 2 * x, 0, 1)[0],
    },
    "linalg": {
        0: float(np.linalg.norm([3, 4])), 1: float(np.dot([1, 2, 3], [4, 5, 6])), 2: 1 / float(np.linalg.norm([1, 1])),
        3: float((np.array([[1, 2], [3, 4]]) @ np.array([1, 1]))[1]), 4: float((np.array([[1, 2], [3, 4]]) @ np.array([[0, 1], [1, 0]]))[0, 0]),
        5: float(np.linalg.det([[3, 1], [2, 4]])), 6: 0, 7: float(solve([[1, 1], [1, -1]], [5, 1])[0]), 8: 2 * 3,
        9: int(np.linalg.matrix_rank(np.array([[1, 2], [2, 4]]))), 10: float((np.array([[1, 0], [1, 1], [1, 2]]).T @ np.array([[1, 0], [1, 1], [1, 2]]))[1, 1]),
        11: float(max(eig([[4, 1], [2, 3]]).real)), 12: float(np.prod(eig([[5, 2], [2, 2]]).real)), 13: float(min(eig([[0.8, 0.2], [0.4, 0.6]]).real)),
        14: float(min(eig([[1, 2], [2, 1]]).real)), 15: float(np.linalg.cholesky(np.array([[1, 0.6], [0.6, 1]]))[1, 1]),
        "h0": float(np.linalg.norm([1, 2, 2])), "h1": float(np.linalg.inv(np.array([[2, 1], [5, 3]]))[0, 1]), "h2": float(solve([[3, 2], [1, -1]], [12, -1])[1]),
        "h3": float(max(eig([[6, 2], [2, 3]]).real)), "h4": float(np.linalg.det([[2, 0, 0], [1, 3, 0], [4, 5, 1]])),
        "h5": float(max(eig([[1, 0.5, 0.5], [0.5, 1, 0.5], [0.5, 0.5, 1]]).real)), "h6": log(0.5) / log(float(min(eig([[0.9, 0.1], [0.1, 0.9]]).real))),
        "h7": float(np.linalg.cholesky(np.array([[1, -0.5], [-0.5, 1]]))[1, 1]),
    },
    "brownian": {
        # added with the deeper chapter
        "x1": 2 / 0.5,  # Wald; confirmed by simulation just below
        0: 4, 1: round(norm.sf(1), 5), 2: min(2, 5), 3: 0.5, 4: 3, 5: 100 * sqrt(2 / pi) * sqrt(1 / 100), 6: 2 * round(norm.sf(1), 5),
        7: quad(lambda m: 2 * norm.sf(m / 2), 0, 50)[0], 8: sqrt(100), 9: 3 / (3 + 1), 10: 1 * 3, 11: 1 / (1 + exp(-2 * 0.5 / 1 ** 2 * 1)),
        "h0": 3 - 1, "h1": round(norm.sf(2 / sqrt(4)), 5), "h2": min(1, 3), "h3": 2, "h4": 2 * round(norm.sf(2), 5), "h5": 2 * 1, "h6": 2 * round(norm.sf(0.03 / (0.01 * sqrt(9))), 5),
    },
    "stochastic": {
        # added with the deeper chapter
        "x1": -0.5 * 0.2 ** 2 * 100 ** 2 * 0.02,
        0: 1 + 0.1 * 0.01 + 0.2 * sqrt(0.01) * 1, 1: float(norm.moment(4, scale=sqrt(2))), 2: (2 ** 2 - 1) / 2, 3: 0.1 - 0.2 ** 2 / 2,
        4: 100 * exp(0.1 - 0.2 ** 2 / 2), 5: quad(lambda z: 100 * exp(0.08 + 0.2 * z) * norm.pdf(z), -12, 12)[0], 6: round(norm.cdf(0.08 / 0.2), 5),
        7: (log(100 / 100) + 0.5 * 0.2 ** 2) / 0.2, 8: 100 * (2 * round(norm.cdf(0.1), 5) - 1), 9: 1 - round(norm.cdf(0.1), 5),
        10: log(2) / 0.5, 11: 1 ** 2 / (2 * 0.5), 12: -log(0.95),
        "h0": 100 * exp(0.05 - 0.3 ** 2 / 2), "h1": round(norm.cdf((0.05 - 0.3 ** 2 / 2) / 0.3), 5), "h2": quad(lambda z: exp(sqrt(2) * z) * norm.pdf(z), -15, 15)[0],
        "h3": 100 * (2 * round(norm.cdf(0.075), 5) - 1), "h4": log(2) / 0.1, "h5": 0.25 * sqrt(4), "h6": quad(lambda z: exp(2 * (-0.02 + 0.2 * z)) * norm.pdf(z), -12, 12)[0],
    },
    "clt": {
        # added with the deeper chapter
        "x1": float(np.std(np.array([35] * 1 + [-1] * 36))),  # population sd over the 37 equally likely pockets
        "x2": sqrt(1 ** 2 / 100 + 1 ** 2 / 100),  # in percent: sd 1% over 100 days each
        0: round(norm.sf(1), 5), 1: 2 / sqrt(400), 2: 2 * sqrt(10000 / 4), 3: (2 * 0.5 / 0.01) ** 2,
        "h0": sqrt(36 * 35 / 12), "h1": round(norm.sf(2), 4), "h2": 10 / 5, "h3": 100 * 4, "h4": (2 / 0.01) ** 2, "h5": 0.05 * sqrt(252),
    },
    "estimation": {
        # added with the deeper chapter
        "x1": 0.04 * (((0.6 + 1e-6) / (0.4 - 1e-6)) - ((0.6 - 1e-6) / (0.4 + 1e-6))) / 2e-6,  # numerical derivative of the odds
        "x2": Fr(3, 600),
        "x3": 0.10 * 0.02 ** 2 / (0.02 ** 2 + 0.04 ** 2),
        0: 0.1 ** 2 + 0.02, 1: Fr(4, 5), 2: Fr(7, 10), 3: Fr(2 + 4 + 3 + 3, 4), 4: 100 * 1.25 - 1, 5: 1.96 * 20 / 10, 6: beta(9, 3).mean(),
        "h0": 3 / (2 + 3 + 7), "h1": sqrt(0.55 * 0.45 / 400), "h2": 0.55 - 1.96 * sqrt(0.55 * 0.45 / 400), "h3": 0.9, "h4": beta(5, 15).mean(), "h5": (1.96 * 0.5 / 0.02) ** 2,
    },
    "testing": {
        # added with the deeper chapter
        "x1": (0.12 - 0.05) / sqrt(0.025 ** 2 + 0.025 ** 2),
        "x2": (2.8 / 0.05) ** 2,  # the rounded 2.8 the chapter teaches (checked against exact quantiles below)
        0: (60 - 50) / sqrt(100 / 4), 1: round(2 * norm.sf(2), 4), 2: 1.5 * sqrt(4), 3: (2 / 0.4) ** 2, 4: 1 - 0.95 ** 100, 5: 0.05 / 50, 6: 0.05 * 900 / (0.05 * 900 + 0.8 * 100),
        "h0": 30 / sqrt(1000 / 4), "h1": 0.1 / (2 / sqrt(400)), "h2": round(norm.sf(-0.04), 3), "h3": (2 / 2) ** 2, "h4": 1 - (1 - 0.0062) ** 20, "h5": 0.01 * 0.5 / (0.01 * 0.5 + 0.99 * 0.01),
    },
    "regression": {
        # added with the deeper chapter
        "x1": float(ols_slope_omitted()),
        "x2": float(ols_slope_noisy()),
        0: 0.5 * 30 / 10, 1: 2 + 1.5 * 4, 2: 0.6 ** 2, 3: (1 - 0.36) * 25, 4: 0.6 / 0.2, 5: 0.5 * 2,
        "h0": float(FIT[0]), "h1": float(FIT[1]), "h2": 0.7 * 30 / 15, "h3": 2 / (1 * sqrt(100)), "h4": 2 * 2 / (1 * sqrt(100)), "h5": 0.02 ** 2, "h6": 4 / 5,
    },
    "matrix": {
        # added with the deeper chapter
        "x1": int(np.triu(np.ones((100, 100))).sum()),
        0: float(np.array([0.6, 0.4]) @ np.array([[0.04, 0.01], [0.01, 0.01]]) @ np.array([0.6, 0.4])), 1: 0.3 / sqrt(3), 2: min_equal_corr(4), 3: min_third_corr(0.8), 4: float(np.linalg.eigvalsh(np.array([[1, 0.6], [0.6, 1]]))[-1]), 5: top_share(10, 0.3),
        "h0": min_third_corr(0.6), "h1": sqrt(0.16) * 0.25, "h2": (0.04 - 0.01) / (0.01 + 0.04 - 2 * 0.01), "h3": 3, "h4": 0.09 / (0.01 + 0.09), "h5": top_share(500, 0.2), "h6": min_third_corr(0.9),
    },
    "timeseries": {
        # added with the deeper chapter
        "x1": 100 * sqrt(garch_long_run(0.000002, 0.08, 0.90)),
        0: 1 + 0.2, 1: 3 / (1 - 0.25), 2: log(0.5) / log(0.9), 3: 0.8 ** 2 * 10, 4: 0.94 * 1 + 0.06 * 4,
        "h0": log(0.5) / log(0.5), "h1": 1 / (1 - 0.81), "h2": sqrt(2 * 1 * (1 - 0.5)), "h3": 2 * 0.95 ** 14, "h4": log(0.5) / log(0.94), "h5": 2 * 100,
    },
    "betting": {
        # added with the deeper chapter
        "x1": float(max(np.linspace(0, 5, 500001), key=lambda f: 0.5 * log(1 + 0.2 * f) + 0.5 * log(1 - 0.1 * f) if f < 10 else -1)),
        0: 1.5 * 0.6, 1: Fr(1 * 6 - 4, 10), 2: (2 * 0.5 - 0.5) / 2, 3: 0.6 * log(1.2) + 0.4 * log(0.8), 4: 0.1 / 0.2 ** 2, 5: 0.5 ** 2 / 2, 6: Fr(1, 2) ** 3,
        "h0": 2 * 0.55 - 1, "h1": (3 * 0.4 - 0.6) / 3, "h2": 0.55 * log(1.1) + 0.45 * log(0.9), "h3": 0.08 / 0.16 ** 2, "h4": 100000 * 0.25, "h5": 0.5, "h6": 2 * (0.5 - 0.125),
    },
    "market-making": {
        # added with the deeper chapter
        "x1": 90 + 20 * (Fr(1, 2) * Fr(6, 10) ** 2) / (Fr(1, 2) * Fr(6, 10) ** 2 + Fr(1, 2) * Fr(4, 10) ** 2),
        0: 100.01 - 99.99, 1: (100.01 + 99.99) / 2, 2: (100 * 100.01 + 200 * 100.02) / 300, 3: 3 * 3.5, 4: (52 - 50) * 5, 5: 0.2 * 10, 6: 0.6 * 110 + 0.4 * 90, 7: 5 + 3.5,
        "h0": 10 * (101 - 99), "h1": sqrt(10 / 4), "h2": 0.3 * 10, "h3": (300 * 99.99 + 100 * 99.98) / 400, "h4": 3 * sum(range(1, 14)) / 13, "h5": 13 + 2 * sum(range(1, 13)) / 12, "h6": 100 - 0.05 - 0.02 * 3,
    },
    "options": {
        # added with the deeper chapter
        "x1": max(100 - 90, 0),
        0: max(115 - 100, 0), 1: max(100 - 115, 0), 2: 15 - 6, 3: 8 - 100 + 100, 4: 10 - 105 + 100, 5: one_step(100, 120, 80, 90), 6: 0.4 * 100 * 0.25, 7: 0.4 * 100 * 0.2 * 0.5, 8: 100 * 0.5, 9: 0.5 * 0.05 * 4, 10: 2 * 0.4 * 100 * 0.2,
        "h0": 10 - 100 + 100 * exp(-0.05), "h1": one_step(100, 110, 90, 100), "h2": (10 - 0) / (110 - 90), "h3": 0.25 * max(120 - 100, 0), "h4": 0.8 * 50 * 0.4 * 0.5, "h5": 10 - 9.52, "h6": 48 / 16,
    },
    "fermi": {
        # added with the deeper chapter
        "x1": sqrt(20 * 500),
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

# Records: the harmonic-sum answer agrees with brute force over all orderings of 7.
assert Fr(sum(sum(1 for i in range(7) if p[i] == max(p[: i + 1])) for p in itertools.permutations(range(7))), math.factorial(7)) == sum(Fr(1, i) for i in range(1, 8))

# The 2.8 in the testing chapter's sample-size rule: z for 97.5% plus z for 80%.
assert abs(norm.ppf(0.975) + norm.ppf(0.8) - 2.8) < 0.01

# Brownian chapter: the expected time for 0.5t + W(t) to reach 2 is 4 (Wald), by simulation.
_rng = np.random.default_rng(7)
_x = np.zeros(20_000)
_t = np.full(20_000, np.nan)
for _k in range(1, 6001):  # steps of 0.01 up to t = 60
    _x += 0.5 * 0.01 + 0.1 * _rng.standard_normal(20_000)
    _hit = np.isnan(_t) & (_x >= 2)
    _t[_hit] = _k * 0.01
assert abs(np.nanmean(_t) - ANSWERS["brownian"]["x1"]) < 0.15, np.nanmean(_t)

# Stochastic chapter: theta + half sigma^2 S^2 gamma = 0 for a Black-Scholes call with r = 0,
# checked by finite differences on the closed-form price.
def _bs_call(S, K, sig, T):
    d1 = (log(S / K) + 0.5 * sig * sig * T) / (sig * sqrt(T))
    return S * norm.cdf(d1) - K * norm.cdf(d1 - sig * sqrt(T))


_h, _dt = 0.01, 1e-5
_gamma = (_bs_call(100 + _h, 105, 0.2, 0.5) - 2 * _bs_call(100, 105, 0.2, 0.5) + _bs_call(100 - _h, 105, 0.2, 0.5)) / _h ** 2
_theta = -(_bs_call(100, 105, 0.2, 0.5) - _bs_call(100, 105, 0.2, 0.5 - _dt)) / _dt  # value falls as expiry nears
assert abs(_theta + 0.5 * 0.2 ** 2 * 100 ** 2 * _gamma) < 1e-3, (_theta, _gamma)

# The 99% normal quantile quoted in the distributions chapter.
assert abs(norm.ppf(0.99) - ANSWERS["distributions"]["x3"]) < 0.001

# The rounded Black-Scholes answers must still be close to the exact risk-neutral prices.
assert abs(ANSWERS["stochastic"][8] - risk_neutral_call(100, 100, 0.2, 1)) < 0.01
assert abs(ANSWERS["stochastic"][9] - risk_neutral_call(100, 100, 0.2, 1, lambda x: float(x > 100))) < 0.001
assert abs(ANSWERS["stochastic"]["h3"] - risk_neutral_call(100, 100, 0.3, 0.25)) < 0.01
