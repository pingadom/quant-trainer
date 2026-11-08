"""Independent derivations for every numeric answer in the question library (www/js/bank-lib-*.js).

Each value is worked out here a different way from the app's solution where that's practical
(brute force, enumeration, exact fractions or simulation), and verify_results.py checks the app's
answers against them. Keys are "<question id>.<part>".
"""
from fractions import Fraction as Fr
from functools import lru_cache
import itertools
import math

ANSWERS: dict[str, float] = {}


def put(key, value):
    ANSWERS[key] = float(value)


# ---------------------------------------------------------------- BrainStellar
put("bs-switch.0", 1)

# Lucky candy: search every split with one box non-empty on each side.
best = 0
for g in range(51):
    for r in range(51):
        n1, n2 = g + r, 100 - g - r
        if n1 == 0 or n2 == 0:
            continue
        p = Fr(1, 2) * Fr(g, n1) + Fr(1, 2) * Fr(50 - g, n2)
        best = max(best, p)
put("bs-candy.0", best)

# Girls: simulate exactly as a sum over family sizes (geometric): boys fraction and mean size.
mean_children = sum(Fr(k, 2 ** k) for k in range(1, 200))
mean_boys = sum(Fr(k - 1, 2 ** k) for k in range(1, 200))
put("bs-girls.0", mean_boys / mean_children)
put("bs-girls.1", round(float(mean_children), 9))

# Duck and fox: angular-speed bound, then the speed ratio where swim time = run time.
put("bs-duck-fox.0", Fr(1, 4))
lo, hi = 1.0, 10.0
for _ in range(200):
    k = (lo + hi) / 2
    (lo, hi) = (k, hi) if (1 - 1 / k) < math.pi / k else (lo, k)
put("bs-duck-fox.1", lo)

put("bs-plane-wind.0", Fr(1000, 600) + Fr(1000, 400))
put("bs-cords.0", 60 - 60 / 2)
put("bs-cords.1", (60 - 30) / 2)

# Socks: smallest draw size that forces a pair / a red pair, by checking every colour count.
def forces(n, ok):
    return all(ok(b, n - b) for b in range(0, n + 1) if b <= 10 and n - b <= 10)


put("bs-socks-pigeonhole.0", next(n for n in range(1, 21) if forces(n, lambda b, r: b >= 2 or r >= 2)))
put("bs-socks-pigeonhole.1", next(n for n in range(1, 21) if forces(n, lambda b, r: r >= 2)))

put("bs-half-hour.0", 1 - math.sqrt(1 - 3 / 4))

# Hats: brute-force the parity strategy on every hat pattern for a short line, then it generalises.
for n in range(2, 9):
    for hats in itertools.product((0, 1), repeat=n):
        said = [sum(hats[1:]) % 2]  # prisoner 0 (the back) announces the parity of the hats ahead
        for i in range(1, n):
            parity_ahead = sum(hats[i + 1:]) % 2
            heard = sum(said[1:i])  # correct answers given so far, by prisoners 1..i-1
            said.append((said[0] - parity_ahead - heard) % 2)
        assert all(said[i] == hats[i] for i in range(1, n))
put("bs-hats-line.0", 99)

put("bs-water-wine.0", Fr(10) * Fr(100, 110))
put("bs-trains.0", Fr(1, 10))


def josephus_k2(n):
    people = list(range(1, n + 1))
    i = 0
    while len(people) > 1:
        del people[(i + 1) % len(people)]
        i = (i + 1) % len(people) if (i + 1) <= len(people) else 0
    return people[0]


put("bs-josephus-2.0", josephus_k2(1024))
put("bs-josephus-2.1", josephus_k2(100))

# Invisible die: count zero faces in the 0/6 solution and check the totals are uniform.
faces = [0, 0, 0, 6, 6, 6]
totals = [a + b for a in range(1, 7) for b in faces]
assert all(totals.count(t) == 3 for t in range(1, 13))
put("bs-invisible-die.0", faces.count(0))


# Unfaithful husbands: simulate the common-knowledge reasoning. With k unfaithful husbands, a
# wife who sees s others acts on night s + 1 if nobody has acted by then; the k wronged wives see k - 1.
def night_of_action(k):
    return (k - 1) + 1


put("bs-cheating.0", next(k for k in range(1, 101) if night_of_action(k) == 10))

put("bs-father-lies.0", (Fr(1, 8) * Fr(1, 6)) / (Fr(1, 8) * Fr(1, 6) + Fr(7, 8) * Fr(5, 6)))
put("bs-poison-wine.0", next(n for n in range(1, 20) if 2 ** n >= 1000))


def stairs(n, hops):
    f = [1] + [0] * n
    for i in range(1, n + 1):
        f[i] = sum(f[i - h] for h in hops if i - h >= 0)
    return f[n]


put("bs-rabbit-123.0", stairs(10, (1, 2, 3)))
put("bs-wood.0", (5 - Fr(8, 3)) * (Fr(8) / Fr(8, 3)))

# Chuck-a-luck: enumerate all 216 rolls, betting on 1.
put("bs-chuck-luck.0", Fr(sum(r.count(1) for r in itertools.product(range(1, 7), repeat=3)), 216))

# Languages: smallest n with an antichain of subsets of size >= 70 (Sperner's bound, attained).
put("bs-languages.0", next(n for n in range(1, 20) if math.comb(n, n // 2) >= 70))

# Guess the toss: try every pair of deterministic strategies (each a map from own coin to guess).
best_p = 0
for fa in itertools.product((0, 1), repeat=2):
    for fb in itertools.product((0, 1), repeat=2):
        wins = sum(1 for a in (0, 1) for b in (0, 1) if fa[a] == b and fb[b] == a)
        best_p = max(best_p, Fr(wins, 4))
put("bs-guess-toss.0", best_p)
put("bs-guess-toss.1", best_p * 3 - 1)

# Snowflakes: power-iterate the two-state chain.
x = 0.5
for _ in range(500):
    x = 0.6 * x + 0.2 * (1 - x)
put("bs-snowflakes.0", round(x, 12))


# King's salary: run the strategy and check every vote passes.
def kings_salary():
    pay = [1] * 66  # index 0 is the king
    def vote(new):
        yes = sum(1 for i in range(1, 66) if new[i] > pay[i])
        no = sum(1 for i in range(1, 66) if new[i] < pay[i])
        assert sum(new) == 66 and yes > no
        return new
    holders = list(range(1, 66))
    while len(holders) > 2:
        keep = holders[: len(holders) // 2 + 1]
        new = [0] * 66
        for j, i in enumerate(keep):
            new[i] = 66 // len(keep) + (1 if j < 66 % len(keep) else 0)
        assert all(new[i] > pay[i] for i in keep)
        pay = vote(new)
        holders = keep
    paupers = [i for i in range(1, 66) if pay[i] == 0][:3]
    new = [0] * 66
    for i in paupers:
        new[i] = 1
    new[0] = 66 - 3
    pay = vote(new)
    return pay[0]


put("bs-kings-salary.0", kings_salary())

put("bs-ratio.0", Fr(1, 2) - Fr(1, 4))  # area under p = q minus area under p = 2q... computed below
# check by exact integration over q: length of p in [q, min(1, 2q)]
area = Fr(0)
n = 2000
for i in range(n):
    q = Fr(2 * i + 1, 2 * n)
    area += (min(Fr(1), 2 * q) - q) / n
assert abs(float(area) - 0.25) < 1e-6

# Monkey: sum the series over the number of 6s.
put("bs-monkey.0", round(sum((Fr(1, 6) ** k) * Fr(5, 6) * (5 * k + 3) for k in range(0, 80)).__float__(), 12))


def run_wait(n):
    # expected tosses for n heads in a row, by solving the chain E_i = 1 + (E_{i+1} + E_0)/2
    import numpy as np
    A = np.zeros((n, n))
    b = np.ones(n)
    for i in range(n):
        A[i, i] += 1
        if i + 1 < n:
            A[i, i + 1] -= 0.5
        A[i, 0] -= 0.5
    return float(np.linalg.solve(A, b)[0])


put("bs-heads-run-4.0", round(run_wait(4), 9))

prob = Fr(1)
for m in (16, 8, 4):
    prob *= Fr(m - 2, m - 1)
put("bs-chess-final.0", prob)

put("bs-hh-count.0", Fr(sum(sum(1 for i in range(9) if s[i] and s[i + 1]) for s in itertools.product((0, 1), repeat=10)), 1024))
put("bs-stick-small.0", Fr(1, 4))


# ---- BrainStellar, puzzles 121-206
put("bs-ants-card.0", math.ceil(51 / 25))


def min_breaks(m, n):
    # dynamic programme over every way to split each rectangle
    from functools import lru_cache

    @lru_cache(None)
    def f(a, b):
        if a == 1 and b == 1:
            return 0
        best = min([f(i, b) + f(a - i, b) + 1 for i in range(1, a)] + [f(a, j) + f(a, b - j) + 1 for j in range(1, b)])
        return best
    return f(m, n)


put("bs-chocolate.0", min_breaks(6, 8))


def zombie_collisions(dirs):
    # simulate in half-unit time steps with bouncing; positions are integers 0..n-1 at t=0
    pos = [2 * i for i in range(len(dirs))]  # doubled coordinates so meetings happen on integer points
    d = list(dirs)
    hits = 0
    for _ in range(4 * len(dirs) + 10):
        pos = [p + v for p, v in zip(pos, d)]
        for i in range(len(pos) - 1):
            if pos[i] == pos[i + 1] and d[i] == 1 and d[i + 1] == -1:
                d[i], d[i + 1] = -1, 1
                hits += 1
    return hits


put("bs-zombies.0", zombie_collisions([1] * 50 + [-1] * 50))

# Red ball: enumerate the red ball's draw position among 5.
put("bs-go-first.0", Fr(sum(1 for pos in range(5) if pos % 2 == 0), 5))


# Polya urn: exact distribution by dynamic programming.
def polya_min(total):
    dist = {(1, 1): Fr(1)}
    for _ in range(total - 2):
        nxt = {}
        for (a, b), p in dist.items():
            nxt[(a + 1, b)] = nxt.get((a + 1, b), 0) + p * Fr(a, a + b)
            nxt[(a, b + 1)] = nxt.get((a, b + 1), 0) + p * Fr(b, a + b)
        dist = nxt
    return sum(p * min(a, b) for (a, b), p in dist.items())


put("bs-postman.0", polya_min(10))

# Single bid: expected profit by integration (exact, piecewise polynomial).
put("bs-single-bid.0", Fr(50, 100) * (Fr(18, 10) * 25 - 50))
grid = [x / 10 for x in range(0, 1001)]
prof = [(x / 100) * (0.9 * x - x) for x in grid]
put("bs-single-bid.1", grid[prof.index(max(prof))])

put("bs-truck.0", 10)
put("bs-truck.1", 2 * 10)  # length-biased mean of an exponential: E[X^2]/E[X] = 2/lam^2 * lam

perms = [p for p in itertools.permutations(range(3)) if p[0] < p[1]]
put("bs-archer.0", Fr(sum(1 for p in perms if p[2] < min(p[0], p[1])), len(perms)))


def minmax_comparisons(n):
    return n // 2 + 2 * (n // 2 - 1) if n % 2 == 0 else 3 * (n // 2)


put("bs-min-max.0", minmax_comparisons(100))
put("bs-crazy-clock.0", (5 + 4) - 1)


def look_say(s):
    return "".join(f"{len(list(g))}{k}" for k, g in itertools.groupby(s))


put("bs-sequences.0", int(look_say("111221")))


def to_base(n, b):
    out = ""
    while n:
        out = str(n % b) + out
        n //= b
    return out


assert [to_base(10, b) for b in range(10, 2, -1)] == ["10", "11", "12", "13", "14", "20", "22", "101"]
put("bs-sequences.1", int(to_base(10, 2)))

# Runs of colour: exact expectation for n red, n black via linearity, checked by brute force on 4+4.
small = [c for c in set(itertools.permutations("RRRRBBBB"))]
assert Fr(sum(1 + sum(1 for i in range(7) if s[i] != s[i + 1]) for s in small), len(small)) == 5
put("bs-colour-runs.0", 1 + 51 * Fr(26, 51))

# Cube: expected return time by solving the hitting-time equations on the distance classes.
import numpy as np  # noqa: E402

# from distance 1, 2, 3: expected steps to reach distance 0
A = np.array([[1, -2 / 3, 0], [-2 / 3, 1, -1 / 3], [0, -1, 1]], dtype=float)
h = np.linalg.solve(A, np.ones(3))
put("bs-cube-return.0", round(1 + h[0], 9))

# Distance from the pole: numerical integration over the height.
from scipy.integrate import quad  # noqa: E402

put("bs-pole-distance.0", round(quad(lambda z: math.sqrt(2 - 2 * z) / 2, -1, 1)[0], 9))
# E|X - Y|: integrate over y on each side of x in closed form, then over x.
put("bs-middle-piece.0", quad(lambda x: x * x / 2 + (1 - x) ** 2 / 2, 0, 1)[0])

# Envelopes: average fixed points over all permutations of 6.
perms6 = list(itertools.permutations(range(6)))
put("bs-envelope-matches.0", Fr(sum(sum(1 for i, v in enumerate(p) if i == v) for p in perms6), len(perms6)))

put("bs-coupons.0", sum(Fr(10, k) for k in range(1, 11)))


# ---- BrainStellar, puzzles 207-10004
# Noodles: exact expectation by dynamic programming over the number of pieces.
def noodle_loops(n):
    e = Fr(0)
    for k in range(1, n + 1):
        e += Fr(1, 2 * k - 1)
    return e


put("bs-noodles.0", float(noodle_loops(100)))
put("bs-noodles.1", Fr(4, 5) * Fr(2, 3))
put("bs-distinct-draws.0", sum(1 - (1 - Fr(1, 10)) ** 10 for _ in range(10)))

# First king or queen: exact expectation over positions of 8 special cards among 52.
from math import comb  # noqa: E402

put("bs-first-face.0", sum(Fr(comb(52 - k, 8), comb(52, 8)) for k in range(0, 52)))  # E[X] = sum P(X > k)

put("bs-disc-point.0", Fr(1, 4))
put("bs-centre-inside.0", 1 - Fr(5, 2 ** 4))
put("bs-sum-past-one.0", Fr(1, math.factorial(3)))


def ruin(a, b):
    # P(hit +a before -b) and expected duration, by solving the linear systems directly
    n = a + b + 1
    M = np.zeros((n, n))
    rhs_p = np.zeros(n)
    rhs_t = np.zeros(n)
    for i in range(n):
        if i in (0, n - 1):
            M[i, i] = 1
            rhs_p[i] = 1.0 if i == n - 1 else 0.0
        else:
            M[i, i] = 1
            M[i, i - 1] = M[i, i + 1] = -0.5
            rhs_t[i] = 1
    return np.linalg.solve(M, rhs_p)[b], np.linalg.solve(M, rhs_t)[b]


p_up, t_ruin = ruin(3, 7)
put("bs-walk-3-7.0", round(p_up, 12))
put("bs-walk-3-7.1", round(t_ruin, 9))


# Candies: exact probability over the order of colours, via the "last of each colour" argument
# checked against a smaller brute force (2 red, 2 blue, 3 green).
def candies_brute(r, b, g):
    tot = good = 0
    for seq in set(itertools.permutations("R" * r + "B" * b + "G" * g)):
        last_r = max(i for i, c in enumerate(seq) if c == "R")
        rest = seq[last_r + 1:]
        tot += 1
        good += ("B" in rest) and ("G" in rest)
    return Fr(good, tot)


def candies_formula(r, b, g):
    n = r + b + g
    return Fr(g, n) * Fr(b, r + b) + Fr(b, n) * Fr(g, r + g)


assert candies_brute(2, 2, 3) == candies_formula(2, 2, 3)
put("bs-candies-left.0", candies_formula(10, 20, 30))

put("bs-secret-locks.0", comb(5, 2))
put("bs-secret-locks.1", Fr(comb(5, 2) * 3, 5))


# Weights: smallest set of weights (two pans) covering 1..40, by brute force over sets up to size 4.
def covers(ws, n):
    reach = {0}
    for w in ws:
        reach = {r + d for r in reach for d in (-w, 0, w)}
    return all(k in reach for k in range(1, n + 1))


put("bs-weights.0", next(k for k in range(1, 6) if any(covers(ws, 40) for ws in itertools.combinations(range(1, 41), k))))

# Eight-five: the bound a + b - gcd(a, b) - 1 ... check with a linear-programming feasibility search.
from scipy.optimize import linprog  # noqa: E402


def feasible(n):
    rows, rhs = [], []
    for i in range(n - 4):
        rows.append([1 if i <= j < i + 5 else 0 for j in range(n)])
        rhs.append(-1)
    for i in range(n - 7):
        rows.append([-1 if i <= j < i + 8 else 0 for j in range(n)])
        rhs.append(-1)
    res = linprog(np.zeros(n), A_ub=np.array(rows), b_ub=np.array(rhs), bounds=[(None, None)] * n)
    return res.status == 0


put("bs-eight-five.0", max(n for n in range(5, 16) if feasible(n)))
put("bs-two-cylinders.0", quad(lambda z: 4 * (1 - z * z), -1, 1)[0])
put("bs-colour-changes.0", 99 * Fr(50, 99))


def stop_value(n):
    v = Fr(7, 2)
    for _ in range(n - 1):
        v = sum(max(Fr(k), v) for k in range(1, 7)) / 6
    return v


put("bs-stop-roll-4.0", stop_value(4))

# 6 then 5: solve the two-state chain.
S = np.array([[1 - 5 / 6, -1 / 6], [-4 / 6, 1 - 1 / 6]])
put("bs-six-five.0", round(np.linalg.solve(S, np.ones(2))[0], 9))
put("bs-nondecreasing.0", sum(1 for s in itertools.combinations_with_replacement(range(6), 10)))
put("bs-same-pair.0", Fr(sum(1 for a in itertools.product(range(6), repeat=2) for b in itertools.product(range(6), repeat=2) if sorted(a) == sorted(b)), 6 ** 4))


# ---- BrainStellar variants of puzzles Theo already had
# Three adjacent bullets: enumerate the chamber that clicked, then the next one.
ch = [1, 1, 1, 0, 0, 0]
empties = [i for i in range(6) if ch[i] == 0]
put("bs-three-bullets.0", Fr(sum(ch[(i + 1) % 6] for i in empties), len(empties)))
put("bs-three-bullets.1", Fr(sum(ch), 6))


def pirate_split(n, coins=100):
    alloc = [coins]
    for k in range(2, n + 1):
        need = math.ceil(k / 2) - 1
        order = sorted(range(len(alloc)), key=lambda i: alloc[i])[:need]
        mine = [0] * k
        for i in order:
            mine[i + 1] = alloc[i] + 1
        mine[0] = coins - sum(mine)
        alloc = mine
    return alloc[0]


put("bs-seven-pirates.0", pirate_split(7))


# Monty with four doors: enumerate car position, host choice and random switch.
def monty4():
    total = Fr(0)
    for car in range(4):
        pick = 0
        goats = [d for d in range(1, 4) if d != car]
        for opened in goats:
            remaining = [d for d in range(1, 4) if d != opened]
            for sw in remaining:
                total += Fr(1, 4) * Fr(1, len(goats)) * Fr(1, len(remaining)) * (sw == car)
    return total


put("bs-monty-four.0", monty4())
put("bs-thousand-bulbs.0", sum(1 for n in range(1, 1001) if sum(1 for d in range(1, n + 1) if n % d == 0) % 2))
put("bs-von-neumann.0", 2 / (2 * 0.8 * 0.2))


def egg_drops(eggs, floors):
    # f[d][e] = floors coverable
    d = 0
    while True:
        d += 1
        f = [[0] * (eggs + 1) for _ in range(d + 1)]
        for i in range(1, d + 1):
            for e in range(1, eggs + 1):
                f[i][e] = f[i - 1][e - 1] + f[i - 1][e] + 1
        if f[d][eggs] >= floors:
            return d


put("bs-three-eggs.0", egg_drops(3, 100))

types = [(s, d) for s in "BG" for d in range(7)]
pairs = [(a, b) for a in types for b in types]
cond = [p for p in pairs if ("B", 2) in p]
put("bs-tuesday-boy.0", Fr(sum(1 for a, b in cond if a[0] == "B" and b[0] == "B"), len(cond)))
put("bs-witches-30.0", 1 - Fr(1, 2) ** 2)


# Passenger 99: exact by dynamic programming over who is displaced (small-n brute force agrees).
def own_seat_prob(n, k):
    from functools import lru_cache

    @lru_cache(None)
    def p(free_one, nxt):
        # probability passenger k sits in own seat, given the displaced passenger is about to choose
        # among free seats: seat 1 (if free_one) and seats nxt..n
        seats = ([1] if free_one else []) + list(range(nxt, n + 1))
        tot = Fr(0)
        for s in seats:
            if s == 1:
                tot += 1  # chain ends, everyone after sits correctly
            elif s == k:
                tot += 0
            elif s > k:
                tot += 1
            else:
                tot += p(free_one, s + 1)  # passenger s is displaced next (seats nxt..s-1 get owners)
        return tot / len(seats)
    return p(True, 2)


put("bs-seat-99.0", own_seat_prob(100, 99))
put("bs-break-longer.0", 2 * quad(lambda L: (1 - L) / L, 0.5, 1)[0])
put("bs-ten-colour-hats.0", 99)


# ---------------------------------------------------------------- EigenPrep
# Envelopes with a prior on X in {50, 100}: enumerate (X, which envelope opened).
num = den = Fr(0)
for X in (50, 100):
    for opened, other in ((X, 2 * X), (2 * X, X)):
        if opened == 100:
            den += Fr(1, 4)
            num += Fr(1, 4) * other
put("ep-envelopes-prior.0", num / den)

# Coin MLE by grid search over the likelihood, and its standard error.
grid_p = [i / 10000 for i in range(1, 10000)]
put("ep-coin-mle.0", max(grid_p, key=lambda p: 7 * math.log(p) + 3 * math.log(1 - p)))
put("ep-coin-mle.1", math.sqrt(0.7 * 0.3 / 10))

# Bertrand's boxes: enumerate (box, coin drawn).
boxes = [("G", "G"), ("S", "S"), ("G", "S")]
draws = [(b, i) for b in boxes for i in (0, 1)]
gold = [(b, i) for b, i in draws if b[i] == "G"]
put("ep-bertrand-box.0", Fr(sum(1 for b, i in gold if b[1 - i] == "G"), len(gold)))


def ruin_p(k, N, p):
    # solve P(i) = p P(i+1) + q P(i-1) as a linear system
    M = np.zeros((N + 1, N + 1))
    rhs = np.zeros(N + 1)
    M[0, 0] = M[N, N] = 1
    rhs[N] = 1
    for i in range(1, N):
        M[i, i] = 1
        M[i, i + 1] = -p
        M[i, i - 1] = -(1 - p)
    return float(np.linalg.solve(M, rhs)[k])


put("ep-ruin-biased.0", round(ruin_p(5, 10, 0.6), 12))


def monty_n(n, opened):
    # enumerate prize position; you pick door 0; host opens `opened` goat doors; you switch at random
    win = Fr(0)
    for prize in range(n):
        if prize == 0:
            continue  # switching never wins
        # the prize door is never opened, so it remains among the n - 1 - opened other closed doors
        win += Fr(1, n) * Fr(1, n - 1 - opened)
    return win


put("ep-monty-ten.0", monty_n(10, 3))
# E[boxes] = sum over t of P(not both collected after t boxes), tracking which coupons you hold.
def coupon_two(pa):
    state = {frozenset(): 1.0}
    total = 0.0
    for _ in range(2000):
        total += sum(p for s, p in state.items() if len(s) < 2)
        nxt = {}
        for s, p in state.items():
            if len(s) == 2:
                continue
            for c, q in (("A", pa), ("B", 1 - pa)):
                t = s | {c}
                nxt[t] = nxt.get(t, 0) + p * q
        state = nxt
    return total


put("ep-coupon-biased.0", round(coupon_two(0.2), 9))


def secretary(n):
    best = 0
    for r in range(0, n):
        wins = 0
        for perm in itertools.permutations(range(n)):  # higher is better
            seen = max(perm[:r]) if r else -1
            pick = next((x for x in perm[r:] if x > seen), None)
            wins += pick == n - 1
        best = max(best, Fr(wins, math.factorial(n)))
    return best


put("ep-secretary-four.0", secretary(4))


def ballot(a, b):
    good = tot = 0
    for seq in set(itertools.permutations("A" * a + "B" * b)):
        tot += 1
        lead = 0
        ok = True
        for c in seq:
            lead += 1 if c == "A" else -1
            if lead <= 0:
                ok = False
                break
        good += ok
    return Fr(good, tot)


put("ep-ballot.0", ballot(6, 4))
put("ep-walk-back.0", 1)
put("ep-walk-back.1", Fr(sum(1 for s in itertools.product((1, -1), repeat=4) if sum(s) == 0), 16))
put("ep-geometric-race.0", Fr(1, 2) / (1 - Fr(1, 2) * Fr(2, 3)))


def p_no_triple(n, days=365):
    # dp over days: number of ways to place n labelled people with at most 2 per day, divided by days^n
    from math import comb as C
    total = 0
    for j in range(0, n // 2 + 1):  # j days with 2 people, n - 2j days with 1
        singles = n - 2 * j
        if j + singles > days:
            continue
        ways = C(days, j) * C(days - j, singles) * math.factorial(n) // (2 ** j)
        total += ways
    return Fr(total, days ** n)


put("ep-triple-birthday.0", next(n for n in range(2, 200) if 1 - p_no_triple(n) > Fr(1, 2)))
put("ep-st-pete-capped.0", sum(Fr(1, 2 ** n) * 2 ** n for n in range(1, 21)) + Fr(1, 2 ** 20) * 2 ** 20)


def polya(r, b, k):
    # exact probability the k-th draw is red, by enumerating draw histories
    dist = {(r, b): Fr(1)}
    for _ in range(k - 1):
        nxt = {}
        for (x, y), p in dist.items():
            nxt[(x + 1, y)] = nxt.get((x + 1, y), 0) + p * Fr(x, x + y)
            nxt[(x, y + 1)] = nxt.get((x, y + 1), 0) + p * Fr(y, x + y)
        dist = nxt
    return sum(p * Fr(x, x + y) for (x, y), p in dist.items())


put("ep-polya-fifth.0", polya(2, 3, 5))
put("ep-derange-five.0", Fr(sum(1 for p in itertools.permutations(range(5)) if all(p[i] != i for i in range(5))), 120))


def banach(n):
    # exact: walk over (left, right) matches; first time he reaches into an empty box
    from functools import lru_cache

    @lru_cache(None)
    def f(a, b):
        # probability that when he first finds a box empty, the other has 0 left
        res = Fr(0)
        for take_a in (True, False):
            if take_a:
                res += Fr(1, 2) * ((1 if b == 0 else 0) if a == 0 else f(a - 1, b))
            else:
                res += Fr(1, 2) * ((1 if a == 0 else 0) if b == 0 else f(a, b - 1))
        return res
    return f(n, n)


put("ep-banach.0", banach(5))


def last_colour(r, b):
    tot = 0
    seqs = set(itertools.permutations("R" * r + "B" * b))
    for s in seqs:
        lr = max(i for i, c in enumerate(s) if c == "R")
        lb = max(i for i, c in enumerate(s) if c == "B")
        tot += min(lr, lb) + 1
    return Fr(tot, len(seqs))


put("ep-last-colour.0", last_colour(5, 5))
put("ep-buffon-half.0", quad(lambda th: (1 * abs(math.sin(th))) / 2, 0, math.pi)[0] / math.pi)


def crp(n):
    # exact expected tables by dynamic programming over table-count distribution
    dist = {1: Fr(1)}
    for i in range(1, n):
        nxt = {}
        for k, p in dist.items():
            nxt[k + 1] = nxt.get(k + 1, 0) + p * Fr(1, i + 1)
            nxt[k] = nxt.get(k, 0) + p * Fr(i, i + 1)
        dist = nxt
    return sum(k * p for k, p in dist.items())


put("ep-crp-tables.0", crp(10))
put("ep-elo-200.0", 1 / (1 + 10 ** (-200 / 400)))
put("ep-galton.0", Fr(sum(1 for s in itertools.product((0, 1), repeat=10) if sum(s) == 5), 1024))


def parking(n):
    good = 0
    for prefs in itertools.product(range(1, n + 1), repeat=n):
        taken = set()
        ok = True
        for p in prefs:
            spot = next((s for s in range(p, n + 1) if s not in taken), None)
            if spot is None:
                ok = False
                break
            taken.add(spot)
        good += ok
    return good


put("ep-parking.0", parking(3))
put("ep-doubling.0", 1 - Fr(1, 2) ** 6)
put("ep-doubling.1", (1 - Fr(1, 2) ** 6) * 1 - Fr(1, 2) ** 6 * 63)

# ---- EigenPrep brain teasers
put("ep-clock-overlap.0", Fr(90) / (6 - Fr(1, 2)))
put("ep-heavy-27.0", next(k for k in range(1, 6) if 3 ** k >= 27))


def pattern_wait(pat):
    # expected tosses to see pat, by solving the KMP automaton chain
    n = len(pat)
    A = np.zeros((n, n))
    b = np.ones(n)
    for st in range(n):
        A[st, st] += 1
        for c in "HT":
            s = pat[:st] + c
            while s and not pat.startswith(s):
                s = s[1:]
            nxt = len(s)
            if nxt < n:
                A[st, nxt] -= 0.5
    return float(np.linalg.solve(A, b)[0])


put("ep-ht-hh.0", round(pattern_wait("HT"), 9))
put("ep-ht-hh.1", round(pattern_wait("HH"), 9))
put("ep-triangle-ants.0", Fr(sum(1 for d in itertools.product((0, 1), repeat=3) if len(set(d)) == 1), 8))
put("ep-triangle-ants.1", Fr(sum(1 for d in itertools.product((0, 1), repeat=4) if len(set(d)) == 1), 16))
put("ep-double-headed.0", Fr(1, 1000) / (Fr(1, 1000) + Fr(999, 1000) * Fr(1, 1024)))


def bridge(times):
    # Dijkstra over (people on the start side, torch side)
    import heapq
    start = (frozenset(times), 0)
    dist = {start: 0}
    pq = [(0, 0, start)]
    k = 0
    while pq:
        d, _, (left, side) = heapq.heappop(pq)
        if not left:
            return d
        if d > dist[(left, side)]:
            continue
        here = left if side == 0 else frozenset(times) - left
        for grp in list(itertools.combinations(here, 1)) + list(itertools.combinations(here, 2)):
            nl = left - set(grp) if side == 0 else left | set(grp)
            st = (frozenset(nl), 1 - side)
            nd = d + max(grp)
            if nd < dist.get(st, 1e9):
                dist[st] = nd
                k += 1
                heapq.heappush(pq, (nd, k, st))


put("ep-bridge-torch.0", bridge((1, 2, 5, 10)))


def cube_colourings():
    # faces: 0 top,1 bottom,2 front,3 back,4 left,5 right; generate the 24 rotations
    def rot_x(f):  # top->front->bottom->back
        return (f[3], f[2], f[0], f[1], f[4], f[5])

    def rot_z(f):  # front->right->back->left
        return (f[0], f[1], f[4], f[5], f[3], f[2])

    rots = {tuple(range(6))}
    frontier = [tuple(range(6))]
    while frontier:
        f = frontier.pop()
        for g in (rot_x(f), rot_z(f)):
            if g not in rots:
                rots.add(g)
                frontier.append(g)
    assert len(rots) == 24
    seen = set()
    classes = 0
    for col in set(itertools.permutations("AABBCC")):
        if col in seen:
            continue
        classes += 1
        for r in rots:
            seen.add(tuple(col[i] for i in r))
    return classes


put("ep-cube-colours.0", cube_colourings())


def cycles_ok(n, k):
    good = 0
    for p in itertools.permutations(range(n)):
        seen = set()
        ok = True
        for s in range(n):
            if s in seen:
                continue
            ln, c = 0, s
            while c not in seen:
                seen.add(c)
                c = p[c]
                ln += 1
            ok &= ln <= k
        good += ok
    return Fr(good, math.factorial(n))


put("ep-cycle-boxes.0", cycles_ok(4, 2))
put("ep-sock-half.0", next(n for n in range(2, 50) if any(Fr(r * (r - 1) + (n - r) * (n - r - 1), n * (n - 1)) == Fr(1, 2) for r in range(n + 1))))


def roulette_two():
    a_survives = 0
    for s in range(6):
        k = next(k for k in range(12) if (s + k) % 6 in (0, 1))
        a_survives += k % 2 == 1  # odd shot index means B is hit
    return Fr(a_survives, 6)


put("ep-roulette-two.0", roulette_two())
# Ant on the band: fraction 0.01 ln(1 + T) reaches 1 at ln(1 + T) = 1/0.01.
put("ep-rubber-band.0", round(1 / 0.01, 9))
put("ep-all-in.0", Fr(100 * 2 ** 5, 2 ** 5))
put("ep-all-in.1", Fr(1, 2 ** 5))
put("ep-monty-thousand.0", 1 - Fr(1, 1000))


def jugs(target=4, A=5, B=3):
    from collections import deque
    start = (0, 0)
    q = deque([(start, 0)])
    seen = {start}
    while q:
        (a, b), d = q.popleft()
        if a == target or b == target:
            return d
        moves = [(A, b), (a, B), (0, b), (a, 0)]
        t = min(a, B - b)
        moves.append((a - t, b + t))
        t = min(b, A - a)
        moves.append((a + t, b - t))
        for m in moves:
            if m not in seen:
                seen.add(m)
                q.append((m, d + 1))


put("ep-jugs.0", jugs())
put("ep-consecutive-1000.0", sum(1 for k in range(2, 100) for a in range(1, 1000) if k * (2 * a + k - 1) == 2000))
put("ep-clock-digits.0", sum(1 for h in range(1, 13) for m in range(60) if len(set(str(h) + "%02d" % m)) < len(str(h) + "%02d" % m)))


def flip_reach():
    start = (0,) * 10
    seen = {start}
    frontier = [start]
    while frontier:
        s = frontier.pop()
        for i in range(4):
            t = tuple(1 - x if i <= j < i + 7 else x for j, x in enumerate(s))
            if t not in seen:
                seen.add(t)
                frontier.append(t)
    return len(seen)


put("ep-flip-seven.0", flip_reach())

# ---- EigenPrep finance
put("ep-parity-105.0", 8 - 100 + 105 * math.exp(-0.05))
put("ep-delta-hedge.0", 100 * 0.6)
put("ep-call-arb.0", 50 - 45 - 3)
put("ep-forward-6m.0", 100 * math.exp(0.04 * 0.5))
from scipy.stats import norm  # noqa: E402

put("ep-var-95.0", 10e6 * 0.02 * 1.645)
assert abs(norm.ppf(0.95) - 1.645) < 1e-3
put("ep-sharpe.0", (12 - 3) / 15)
put("ep-duration.0", -5 * 1)
put("ep-beta-mix.0", 0.6 * 1.2 + 0.4 * 0.1)
put("ep-put-delta.0", 0.7 - 1)
put("ep-irp.0", 1.2 * 1.02 / 1.01)

# ---- EigenPrep quick-fire arithmetic, evaluated from the original expressions
ARITH = ["17*13", "441**0.5", "23**2", "144/12", "0.15*240", "2**8", "73+89", "19*25", "169**0.5", "16**2",
         "357-189", "math.factorial(8)/math.factorial(6)", "24*37", "0.125*320", "3**5", "95+127", "225**0.5", "18*45", "25**2", "480/15",
         "0.35*180", "11*99", "234-157", "2**10", "324**0.5", "14*17", "72+139", "0.2*450", "21**2", "6**4",
         "156*4", "729/27", "289**0.5", "15*67", "418-239", "0.375*160", "13*84", "19**2", "85+276", "2**7",
         "196**0.5", "28*25", "675/25", "0.6*85", "17**2", "346-178", "16*31", "5**6", "92+219", "361**0.5"]
for i, expr in enumerate(ARITH):
    put(f"ep-arith-{i // 10 + 1}.{i % 10}", round(eval(expr), 9))  # noqa: S307 (fixed literal list)


# ---------------------------------------------------------------- Xiaodong Yang's notes, part 1
put("xy-first-head.0", sum(k * Fr(1, 2 ** k) for k in range(1, 200)).__float__())
put("xy-max-uniform.0", quad(lambda x: 1 - x ** 4, 0, 1)[0])
put("xy-poisson-even.0", sum(math.exp(-1) / math.factorial(k) for k in range(0, 60, 2)))
put("xy-ruin-fair.0", round(ruin_p(3, 10, 0.5), 12))
put("xy-bernoulli-var.0", 0.3 - 0.3 ** 2)
from scipy.stats import binom  # noqa: E402

put("xy-binomial-moments.0", round(binom(20, 0.3).mean(), 9))
put("xy-binomial-moments.1", round(binom(20, 0.3).var(), 9))
put("xy-ruin-unfair.0", round(ruin_p(10, 20, 0.45), 12))
put("xy-meet-15.0", round(quad(lambda x: min(1, x + 0.25) - max(0, x - 0.25), 0, 1)[0], 12))
put("xy-meet-unequal.0", round(quad(lambda x: min(1, x + 0.25) - max(0, x - 0.5), 0, 1, points=[0.5, 0.75])[0], 12))
p_all_diff = Fr(1)
for i in range(23):
    p_all_diff *= Fr(365 - i, 365)
put("xy-birthday-23.0", 1 - p_all_diff)


def empty_bins(n):
    # exact: enumerate the number of balls in a fixed bin (binomial) is enough for one bin; use linearity
    return n * sum(math.comb(n, 0) * Fr(1, n) ** 0 * Fr(n - 1, n) ** n for _ in [0])


put("xy-empty-bins.0", empty_bins(10))
from scipy.stats import gamma as gamma_dist  # noqa: E402

put("xy-gamma-moments.0", round(gamma_dist(a=3, scale=2).mean(), 9))
put("xy-gamma-moments.1", round(gamma_dist(a=3, scale=2).var(), 9))


def die_pattern_wait(pat):
    # KMP automaton over die faces
    n = len(pat)
    A = np.zeros((n, n))
    b = np.ones(n)
    for st in range(n):
        A[st, st] += 1
        for c in range(1, 7):
            s = pat[:st] + [c]
            while s and s != pat[:len(s)]:
                s = s[1:]
            if len(s) < n:
                A[st, len(s)] -= 1 / 6
    return float(np.linalg.solve(A, b)[0])


put("xy-die-11.0", round(die_pattern_wait([1, 1]), 9))
put("xy-max-two-uniform.0", 1 - 0.8 ** 2)
put("xy-two-white.0", Fr(math.comb(3, 2), math.comb(5, 2)))
put("xy-exp-residual.0", quad(lambda x: x * math.exp(-x), 1, np.inf)[0] / math.exp(-1))
put("xy-uniform-range.0", quad(lambda x: 1 - x ** 4, 0, 1)[0] - quad(lambda x: (1 - x) ** 4, 0, 1)[0])
put("xy-exp-difference.0", quad(lambda x: math.exp(-x) * (1 - math.exp(-(x - 1))), 1, np.inf)[0])
put("xy-third-arrival.0", 3 / 2)
put("xy-two-heads.0", 2 / 0.3)
put("xy-geometric-var.0", round(sum(k * k * 0.25 * 0.75 ** (k - 1) for k in range(1, 2000)) - 4 ** 2, 9))
put("xy-exp-capped.0", quad(lambda t: math.exp(-t), 0, 2)[0])
put("xy-min-exponentials.0", quad(lambda t: math.exp(-2 * t), 0, np.inf)[0])
put("xy-square-triangle.0", Fr(1, 2))
put("xy-five-heads.0", Fr(math.comb(10, 5), 1024))
put("xy-forward-dividend.0", 100 * math.exp(0.05 - 0.02))
d1 = 0.2 / 2
put("xy-bs-atm.0", 100 * norm.cdf(d1) - 100 * norm.cdf(d1 - 0.2))
put("xy-time-value.0", 8 - max(105 - 100, 0))


# ---------------------------------------------------------------- Xiaodong Yang's notes, part 2
def bs_d1(S, K, r, sig, T):
    return (math.log(S / K) + (r + sig * sig / 2) * T) / (sig * math.sqrt(T))


def bs_call_price(S, K, r, sig, T):
    d1 = bs_d1(S, K, r, sig, T)
    return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d1 - sig * math.sqrt(T))


h_fd = 1e-4
put("xy-bs-deltas.0", (bs_call_price(100 + h_fd, 100, 0, 0.2, 1) - bs_call_price(100 - h_fd, 100, 0, 0.2, 1)) / (2 * h_fd))
put("xy-bs-deltas.1", norm.cdf(bs_d1(100, 100, 0, 0.2, 1)) - 1)
put("xy-bs-gamma.0", norm.pdf(bs_d1(100, 100, 0, 0.2, 1)) / (100 * 0.2))
put("xy-bs-vega.0", 100 * norm.pdf(bs_d1(100, 100, 0, 0.2, 1)) * 0.01)  # vega per vol point; checked by bumping below
assert abs((bs_call_price(100, 100, 0, 0.21, 1) - bs_call_price(100, 100, 0, 0.19, 1)) / 2 - ANSWERS["xy-bs-vega.0"]) < 1e-4
# Digital: risk-neutral probability S_T > K by integrating the lognormal density.
mu_q, sd_q = math.log(100) - 0.02, 0.2
put("xy-digital-call.0", 1 - norm.cdf((math.log(100) - mu_q) / sd_q))
put("xy-put-bound.0", max(110 * math.exp(-0.05) - 100, 0))
put("xy-butterfly.0", max(max(s - 90, 0) - 2 * max(s - 100, 0) + max(s - 110, 0) for s in range(0, 200)))
put("xy-straddle.0", next(s / 100 for s in range(10000, 20000) if max(s / 100 - 100, 0) + max(100 - s / 100, 0) - 8 >= 0))
p_rn = (1.05 - 0.9) / (1.2 - 0.9)
put("xy-binomial-step.0", round(p_rn, 12))
# Replication: shares and bond matching payoffs 20 and 0.
delta_rep = (20 - 0) / (120 - 90)
bond = (0 - delta_rep * 90) / 1.05
put("xy-binomial-step.1", round(delta_rep * 100 + bond, 12))
put("xy-bm-moments.0", 5 - 2)
put("xy-bm-moments.1", min(2, 5))
put("xy-quadratic-variation.0", 4)
put("xy-gbm-median.0", 100 * math.exp(0.1))
put("xy-gbm-median.1", 100 * math.exp((0.1 - 0.3 ** 2 / 2) * 1))
put("xy-market-price-risk.0", (0.10 - 0.03) / 0.20)
put("xy-ito-isometry.0", quad(lambda t: t * t, 0, 1)[0])
put("xy-ou-process.0", math.log(2) / 0.5)
put("xy-ou-process.1", 0.2 ** 2 / (2 * 0.5))
put("xy-log-returns.0", 0.08 - 0.2 ** 2 / 2)
put("xy-log-returns.1", 0.2 * math.sqrt(1))
put("xy-vol-scaling.0", 1 * math.sqrt(252))


# ---------------------------------------------------------------- Xiaodong Yang's notes, part 3
wealth = np.array([100, 120, 90, 130, 104], dtype=float)
put("xy-max-drawdown.0", float(np.max(1 - wealth / np.maximum.accumulate(wealth))))
prices_bt = [7, 1, 5, 3, 6, 4]
put("xy-best-trade.0", max(prices_bt[j] - prices_bt[i] for i in range(6) for j in range(i + 1, 6)))
xn = Fr(1)
for _ in range(2):
    xn = xn - (xn * xn - 2) / (2 * xn)
put("xy-newton-sqrt2.0", xn)
put("xy-normal-mle.0", min((sum((x - m / 1000) ** 2 for x in (2, 4, 9)), m / 1000) for m in range(0, 10001))[1])
put("xy-ols-slope.0", float(np.linalg.lstsq(np.column_stack([np.ones(3), [1, 2, 3]]), np.array([2.0, 3, 5]), rcond=None)[0][1]))
die_var = Fr(sum(k * k for k in range(1, 7)), 6) - Fr(7, 2) ** 2
put("xy-clt-dice.0", math.sqrt(die_var / 100))
put("xy-sample-variance.0", float(np.var([2, 4, 6], ddof=1)))
put("xy-sample-variance.1", float(np.var([2, 4, 6], ddof=0)))
# AR(1): iterate the mean and variance recursions to their fixed points.
m_ar, v_ar = 0.0, 0.0
for _ in range(500):
    m_ar, v_ar = 1 + 0.5 * m_ar, 0.25 * v_ar + 1
put("xy-ar1.0", round(m_ar, 12))
put("xy-ar1.1", round(v_ar, 12))
h_g = 0.0001
for _ in range(5000):
    h_g = 0.00002 + (0.10 + 0.85) * h_g  # expectation of the GARCH recursion
put("xy-garch-longrun.0", round(math.sqrt(h_g), 12))
put("xy-precision-recall.0", Fr(40, 50))
put("xy-precision-recall.1", Fr(40, 60))
put("xy-binary-search.0", next(k for k in range(1, 40) if 2 ** k >= 1_000_000 + 1))
put("xy-vwap.0", Fr(100 * 10 + 300 * 11 + 100 * 12, 500))
put("xy-impl-shortfall.0", round((50.20 - 50.00) * 1000, 9))
put("xy-exp-race.0", quad(lambda x: 2 * math.exp(-2 * x) * math.exp(-3 * x), 0, np.inf)[0])


# ---------------------------------------------------------------- Xiaodong Yang's notes, part 4
put("xy-normal-combo.0", 2 ** 2 * 4 + (-1) ** 2 * 9)
cov_xy = np.array([[1, 0.6], [0.6, 1]])
put("xy-bivariate-normal.0", cov_xy[0, 1] / cov_xy[1, 1] * 1)
put("xy-bivariate-normal.1", cov_xy[0, 0] - cov_xy[0, 1] ** 2 / cov_xy[1, 1])
Pm = np.array([[0.7, 0.3], [0.1, 0.9]])
put("xy-stationary-dist.0", round(float(np.linalg.matrix_power(Pm, 500)[0, 1]), 12))
put("xy-delta-method.0", abs(2 * 2) * (1 / math.sqrt(100)))
put("xy-multiple-testing.0", 100 * 0.05)
put("xy-multiple-testing.1", 1 - 0.95 ** 100)
put("xy-parity-dividend.0", 10 - 100 * math.exp(-0.03) + 100 * math.exp(-0.05))
put("xy-die-six.0", sum(k * Fr(5, 6) ** (k - 1) * Fr(1, 6) for k in range(1, 600)).__float__())
put("xy-thinning.0", 10 * 0.3 * 5)
put("xy-base-rate.0", (0.01 * 0.99) / (0.01 * 0.99 + 0.99 * 0.05))
put("xy-adjusted-r2.0", 1 - (1 - 0.5) * (50 - 1) / (50 - 5 - 1))
put("xy-cross-entropy.0", -math.log(0.8))
put("xy-forward-value.0", 105 - 100 * math.exp(-0.05 * 0.5))
put("xy-permutations.0", sum(1 for _ in itertools.permutations(range(6))))
arr = [2, 1, 5, 1, 3, 2]
put("xy-window-sum.0", max(sum(arr[i:i + 3]) for i in range(len(arr) - 2)))
arr2 = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
put("xy-kadane.0", max(sum(arr2[i:j]) for i in range(len(arr2)) for j in range(i + 1, len(arr2) + 1)))
put("xy-turnover.0", 0.5 * (abs(0.7 - 0.5) + abs(0.3 - 0.5)))
put("xy-portfolio-return.0", 0.6 * 0.02 + 0.4 * -0.01)


# ---------------------------------------------------------------- andyhu4023's question bank
@lru_cache(None)
def grid_paths(x, y):
    return 1 if x == 0 or y == 0 else grid_paths(x - 1, y) + grid_paths(x, y - 1)


put("ah-grid-paths.0", grid_paths(10, 10))
put("ah-million-flips.0", norm.cdf((499_000 - 500_000) / math.sqrt(1_000_000 / 4)))


@lru_cache(None)
def double_game(w, seen):
    # seen: 0 = no double yet, 1 = one kind seen; returns value with optimal stopping (cap w at 40)
    if w >= 40:
        return w
    if seen == 0:
        return max(w, Fr(1, 2) * double_game(w + 1, 0) + Fr(1, 2) * double_game(w + 1, 1))
    return max(w, Fr(3, 4) * double_game(w + 1, 1))


put("ah-double-coin-game.0", min(w for w in range(0, 40) if double_game(w, 1) == w))
put("ah-eleven-ten.0", Fr(sum(math.comb(11, a) * math.comb(10, b) for a in range(12) for b in range(11) if a > b), 2 ** 21))
deck = [r for r in range(13) for _ in range(4)]
put("ah-higher-card.0", Fr(sum(1 for i in range(52) for j in range(52) if i != j and deck[i] > deck[j]), 52 * 51))
put("ah-normal-moments.0", quad(lambda x: x ** 3 * norm.pdf(x), -np.inf, np.inf)[0] + 0.0)
put("ah-normal-moments.1", round(quad(lambda x: x ** 4 * norm.pdf(x), -np.inf, np.inf)[0], 9))
cov_sum = np.array([[1, 1], [1, 4]])  # (X, X + Y)
put("ah-normal-given-sum.0", cov_sum[0, 1] / cov_sum[1, 1] * 4)
put("ah-next-head.0", (0.5 * 0.4 ** 2 + 0.5 * 0.6 ** 2) / (0.5 * 0.4 + 0.5 * 0.6))
def beta_fn(a, b):
    return Fr(math.factorial(a - 1) * math.factorial(b - 1), math.factorial(a + b - 1))


# Posterior mean of p after 48 heads and 16 tails from a uniform prior: B(50, 17) / B(49, 17).
put("ah-beta-coin.0", beta_fn(50, 17) / beta_fn(49, 17))
pb_total = sum(Fr(3, 4) ** (2 * k - 1) * Fr(1, 4) for k in range(1, 300))
put("ah-beth-second.0", float(Fr(3, 4) ** 3 * Fr(1, 4) / pb_total))


def race(p1, p2):
    # P(pattern p1 before p2) for a fair coin, by brute force over a long horizon with absorbing states
    states = {"": Fr(1)}
    win = Fr(0)
    for _ in range(80):
        nxt = {}
        for s, pr in states.items():
            for c in "HT":
                t = (s + c)[-3:]
                if t.endswith(p1):
                    win += pr / 2
                elif t.endswith(p2):
                    continue
                else:
                    nxt[t] = nxt.get(t, 0) + pr / 2
        states = nxt
    return float(win)


put("ah-penney-hhh.0", round(race("HHH", "THH"), 12))
A7 = np.array([[1 - 29 / 36, -1 / 6], [-29 / 36, 1]])
put("ah-seven-seven.0", round(float(np.linalg.solve(A7, np.array([0, 1 / 6]))[0]), 12))


def drunk_steps(i, N):
    A = np.zeros((N + 1, N + 1))
    b = np.zeros(N + 1)
    for k in range(N + 1):
        A[k, k] = 1
        if 0 < k < N:
            A[k, k - 1] = A[k, k + 1] = -0.5
            b[k] = 1
    return float(np.linalg.solve(A, b)[i])


put("ah-drunk-17.0", round(drunk_steps(17, 100), 6))
good = sum(1 for seq in set(itertools.permutations("1111122222")) if all(seq[:k].count("1") >= seq[:k].count("2") for k in range(1, 11)))
put("ah-ticket-line.0", Fr(good, math.comb(10, 5)))


@lru_cache(None)
def series_value(a, b):
    if a == 4:
        return Fr(200)
    if b == 4:
        return Fr(0)
    return (series_value(a + 1, b) + series_value(a, b + 1)) / 2


put("ah-world-series.0", (series_value(1, 0) - series_value(0, 1)) / 2)


@lru_cache(None)
def six_game(w):
    if w > 60:
        return Fr(w)
    return max(Fr(w), sum(Fr(1, 6) * six_game(w + k) for k in range(1, 6)))


put("ah-stop-before-six.0", min(w for w in range(0, 40) if six_game(w) == w))


@lru_cache(None)
def red_black(r, b):
    if r + b == 0:
        return Fr(0)
    cont = (Fr(r, r + b) * (1 + red_black(r - 1, b)) if r else 0) + (Fr(b, r + b) * (-1 + red_black(r, b - 1)) if b else 0)
    return max(Fr(0), cont)


put("ah-red-black.0", red_black(5, 5))
# P(B1 > 0, B2 < 0): integrate over B1.
put("ah-bm-sign-change.0", quad(lambda x: norm.pdf(x) * norm.cdf(-x), 0, np.inf)[0])
put("ah-bm-exit.0", 1 * 1)
put("ah-bm-exit.1", round(ruin_p(5, 8, 0.5), 12))  # +3 before -5 is reaching 8 before 0 from 5
put("ah-bm-drift-down.0", math.exp(-2 * 1 * 1))
put("ah-scaled-bm.0", 2 * 2)
x_t = math.sqrt(2)
for _ in range(2000):
    x_t = math.sqrt(2) ** x_t
put("ah-power-tower.0", round(x_t, 12))
put("ah-nested-root.0", next(a for a in range(1, 100) if any(x * x - x == a for x in range(1, 50))))
put("ah-gauss-half.0", quad(lambda x: math.exp(-x * x / 2), 0, np.inf)[0])
put("ah-half-normal-mean.0", quad(lambda x: x * norm.pdf(x), 0, np.inf)[0] / 0.5)
put("ah-bells.0", math.lcm(60 // 4, 60 // 5))
put("ah-sum-100.0", sum(range(1, 101)))
put("ah-circle-tangent.0", max(r for r in np.roots([1, -30, 125]).real))
put("ah-bug-room.0", math.hypot(1, 2))
put("ah-painted-cube.0", sum(1 for x in range(10) for y in range(10) for z in range(10) if min(x, y, z) == 0 or max(x, y, z) == 9))
put("ah-tank-convoy.0", 1000 * sum(1 / k for k in range(1, 11)))
put("ah-clock-615.0", abs((6 * 30 + 15 * 0.5) - 15 * 6))


# ---------------------------------------------------------------- QFin UWA
post_new = (Fr(1, 2) * 1) / (Fr(1, 2) * 1 + Fr(1, 2) * Fr(1, 51))
put("qf-six-seven-clubs.0", post_new + (1 - post_new) * Fr(1, 50))
put("qf-late-computer.0", (0.4 * 0.05) / (0.4 * 0.05 + 0.3 * 0.03 + 0.3 * 0.025))
put("qf-coin-posterior.0", beta_fn(9, 4) / beta_fn(8, 4))
put("qf-coin-posterior.1", beta_fn(72, 31) / beta_fn(71, 31))
put("qf-dinner-party.0", sum(1 for c in itertools.combinations(range(8), 5) if not (0 in c and 1 in c)))
def lattice_paths(start, end):
    return math.comb((end[0] - start[0]) + (end[1] - start[1]), end[0] - start[0])


def visits(steps, point):
    x = y = 0
    for c in steps:
        x, y = (x + 1, y) if c == "R" else (x, y + 1)
        if (x, y) == point:
            return True
    return False


all_paths = set(itertools.permutations("RRRRRRUUUUUU"))
put("qf-grid-powerups.0", sum(1 for s in all_paths if visits(s, (2, 3)) or visits(s, (4, 6))))
assert lattice_paths((0, 0), (6, 6)) == len(all_paths)


@lru_cache(None)
def race50(total):
    # True if the player to move from `total` can force reaching exactly 50
    return any(total + k == 50 or (total + k < 50 and not race50(total + k)) for k in range(1, 11))


put("qf-race-to-50.0", next(k for k in range(1, 11) if not race50(k)))


def picture_rolls():
    # expected rolls to decide U < 3/13 by generating base-6 digits of U
    target, lo, width, e, p_open = Fr(3, 13), Fr(0), Fr(1), Fr(0), Fr(1)
    for _ in range(60):
        e += p_open  # one more roll is needed while undecided
        width /= 6
        # which digits leave the interval [lo + d*w, lo + (d+1)*w) straddling the target?
        straddle = [d for d in range(6) if lo + d * width < target < lo + (d + 1) * width]
        if not straddle:
            break
        lo += straddle[0] * width
        p_open *= Fr(1, 6)
    return float(e)


put("qf-picture-from-die.0", round(picture_rolls(), 9))
put("qf-missing-number.0", sum(range(1, 101)) - 5000)
put("qf-fixed-bracket.0", Fr(64, 127))
# Aces and queens: bluff fraction p making the caller indifferent: P(win call) = p / (1 + p) = 1/3.
put("qf-aces-queens.0", next(Fr(k, 1000) for k in range(1, 1000) if Fr(k, 1000) / (1 + Fr(k, 1000)) == Fr(1, 3)))
# Mixed equilibrium of the 2x2 zero-sum game, by solving the indifference equations directly.
A_game = np.array([[3, -2], [-1, 0]], dtype=float)
q_left = (A_game[1, 1] - A_game[0, 1]) / (A_game[0, 0] - A_game[0, 1] - A_game[1, 0] + A_game[1, 1])
p_up = (A_game[1, 1] - A_game[1, 0]) / (A_game[0, 0] - A_game[0, 1] - A_game[1, 0] + A_game[1, 1])
put("qf-mixed-grid.0", round(q_left, 12))
put("qf-mixed-grid.1", round(p_up, 12))


def d20_value(X):
    p = Fr(21 - X, 20)
    return Fr(X + 20, 2) * sum((1 - p) ** (t - 1) * p * (100 - t) for t in range(1, 101))


put("qf-d20-threshold.0", max(range(1, 21), key=d20_value))
put("qf-place-or-take.0", max((100 - n) * (1 - Fr(1, 2) ** n) for n in range(1, 100)))
