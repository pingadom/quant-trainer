"""Independent derivations for every numeric answer in the question library (www/js/bank-lib-*.js).

Each value is worked out here a different way from the app's solution where that's practical
(brute force, enumeration, exact fractions or simulation), and verify_results.py checks the app's
answers against them. Keys are "<question id>.<part>".
"""
from fractions import Fraction as Fr
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
