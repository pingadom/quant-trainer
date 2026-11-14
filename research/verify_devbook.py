"""Checks for the quant dev handbook (www/js/dev-part*.js).

Two independent checks:

1. ANSWERS["dsa-..."][key] derives every numeric answer here by brute force (trying every
   subarray, every order, every capacity...), without the chapters' own algorithms.
   verify_results.py imports ANSWERS and compares them with the app's values.
2. Every Python listing in the chapters ({ code, test }) is extracted and run. The listings of a
   chapter share one namespace, in order, as a reader would paste them. TESTS[name] checks each
   one against brute force on fixed and random inputs.

    python research/verify_devbook.py
"""
import itertools
import math
import random
import re
import sys
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rng = random.Random(11)


# ---------------------------------------------------------------- brute-force helpers
def subarrays(a):
    return [a[i:j] for i in range(len(a)) for j in range(i + 1, len(a) + 1)]


def substrings(s):
    return [s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1)]


def bf_longest_unique(s):
    return max((len(t) for t in substrings(s) if len(set(t)) == len(t)), default=0)


def bf_band(prices, w):
    return max((len(t) for t in subarrays(prices) if max(t) - min(t) <= w), default=0)


def bf_lis(a):
    best = 0
    for mask in range(1 << len(a)):
        sub = [a[i] for i in range(len(a)) if mask >> i & 1]
        if all(x < y for x, y in zip(sub, sub[1:])):
            best = max(best, len(sub))
    return best


def bf_lcs(a, b):
    best = 0
    for mask in range(1 << len(a)):
        sub = "".join(a[i] for i in range(len(a)) if mask >> i & 1)
        it = iter(b)
        if all(ch in it for ch in sub):
            best = max(best, len(sub))
    return best


def bf_edit(a, b):
    # breadth-first search over strings, one insert/delete/replace per step (small alphabet)
    letters = set(a + b)
    frontier, seen, d = {a}, {a}, 0
    while b not in frontier:
        nxt = set()
        for s in frontier:
            for i in range(len(s) + 1):
                for ch in letters:
                    nxt.add(s[:i] + ch + s[i:])
                    if i < len(s):
                        nxt.add(s[:i] + ch + s[i + 1:])
                if i < len(s):
                    nxt.add(s[:i] + s[i + 1:])
        frontier = {s for s in nxt if s not in seen and len(s) <= max(len(a), len(b)) + 1}
        seen |= frontier
        d += 1
    return d


def bf_trades(prices, fee=0, limit=None):
    """Best profit over every choice of position (0 or 1 unit) each day."""
    best = 0
    for pos in itertools.product((0, 1), repeat=len(prices)):
        cash, held, trades = 0, 0, 0
        for p, want in zip(prices, pos):
            if want and not held:
                cash -= p
                held = 1
            elif not want and held:
                cash += p - fee
                held = 0
                trades += 1
        if held:
            continue  # must end flat
        if limit is None or trades <= limit:
            best = max(best, cash)
    return best


def bf_min_coins(coins, amount):
    for n in range(amount + 1):
        if any(sum(c) == amount for c in itertools.combinations_with_replacement(coins, n)):
            return n
    return -1


def bf_count_ways(coins, amount):
    return sum(1 for n in range(amount + 1) for c in itertools.combinations_with_replacement(coins, n) if sum(c) == amount)


def bf_rob(v):
    best = 0
    for mask in range(1 << len(v)):
        if mask & (mask >> 1) == 0:
            best = max(best, sum(v[i] for i in range(len(v)) if mask >> i & 1))
    return best


def bf_knapsack(items, cap):
    return max(sum(v for w, v in s) for r in range(len(items) + 1) for s in itertools.combinations(items, r) if sum(w for w, v in s) <= cap)


def bf_queens(n):
    return sum(1 for p in itertools.permutations(range(n)) if len({r - c for r, c in enumerate(p)}) == n and len({r + c for r, c in enumerate(p)}) == n)


def bf_brackets(n):
    def ok(s):
        d = 0
        for ch in s:
            d += 1 if ch == "(" else -1
            if d < 0:
                return False
        return d == 0
    return sum(ok(s) for s in itertools.product("()", repeat=2 * n))


def bf_combo_sum(cands, target):
    out = set()
    for n in range(1, target // min(cands) + 1):
        for c in itertools.combinations_with_replacement(sorted(cands), n):
            if sum(c) == target:
                out.add(c)
    return out


def bf_days(weights, cap):
    """Days needed at capacity cap, trying every way to cut the sequence into consecutive days."""
    n = len(weights)
    best = n + 1
    for cuts in range(1 << (n - 1)):
        groups, cur = [], [weights[0]]
        for i in range(1, n):
            if cuts >> (i - 1) & 1:
                groups.append(cur)
                cur = []
            cur.append(weights[i])
        groups.append(cur)
        if all(sum(g) <= cap for g in groups):
            best = min(best, len(groups))
    return best


def bf_min_capacity(weights, days):
    return next(c for c in range(1, sum(weights) + 1) if bf_days(weights, c) <= days)


def bf_max_meetings(iv):
    return max(r for r in range(len(iv) + 1) for s in itertools.combinations(iv, r)
               if all(a[1] <= b[0] or b[1] <= a[0] for a, b in itertools.combinations(s, 2)))


def bf_live(iv, closed=False):
    pts = sorted({x for s, e in iv for x in (s, e)} | {(s + e) / 2 for s, e in iv})
    return max(sum(s <= t <= e if closed else s <= t < e for s, e in iv) for t in pts)


def bf_union_intervals(iv):
    """Number of merged groups of closed intervals: connected components of the overlap graph."""
    n = len(iv)
    parent = list(range(n))

    def f(x):
        while parent[x] != x:
            x = parent[x]
        return x
    for i, j in itertools.combinations(range(n), 2):
        if iv[i][0] <= iv[j][1] and iv[j][0] <= iv[i][1]:
            parent[f(i)] = f(j)
    return len({f(i) for i in range(n)})


def bf_shortest(edges, a, b, weighted=False):
    nodes = {x for e in edges for x in e[:2]}
    dist = {(u, v): (0 if u == v else math.inf) for u in nodes for v in nodes}
    for e in edges:
        w = e[2] if weighted else 1
        dist[e[0], e[1]] = min(dist[e[0], e[1]], w)
        dist[e[1], e[0]] = min(dist[e[1], e[0]], w)
    for k in nodes:  # Floyd-Warshall: a different algorithm from the chapter's BFS / Dijkstra
        for u in nodes:
            for v in nodes:
                dist[u, v] = min(dist[u, v], dist[u, k] + dist[k, v])
    return dist[a, b]


def bf_components(n, edges):
    adj = [[False] * n for _ in range(n)]
    for a, b in edges:
        adj[a][b] = adj[b][a] = True
    for k in range(n):
        for i in range(n):
            for j in range(n):
                adj[i][j] = adj[i][j] or (adj[i][k] and adj[k][j])
    return len({frozenset([i] + [j for j in range(n) if adj[i][j]]) for i in range(n)})


def bf_jump_min(j):
    @lru_cache(maxsize=None)
    def f(i):
        if i >= len(j) - 1:
            return 0
        return min((1 + f(i + s) for s in range(1, j[i] + 1)), default=math.inf)
    return f(0)


def bf_gas_start(gas, cost):
    n = len(gas)
    for s in range(n):
        tank = 0
        for k in range(n):
            i = (s + k) % n
            tank += gas[i] - cost[i]
            if tank < 0:
                break
        else:
            return s
    return -1


def pointer_checks(a, target):
    """How many sums two pointers compute before finding target (stepping by hand, written out)."""
    lo, hi, n = 0, len(a) - 1, 0
    while lo < hi:
        n += 1
        if a[lo] + a[hi] == target:
            return n
        lo, hi = (lo + 1, hi) if a[lo] + a[hi] < target else (lo, hi - 1)
    return None


def greedy_coins(coins, amount):
    n = 0
    while amount:
        amount -= max(c for c in coins if c <= amount)
        n += 1
    return n


def bf_rpn(tokens):
    # evaluate by repeated rewriting of "a b op" triples: a different method from a stack
    t = list(tokens)
    while len(t) > 1:
        for i in range(len(t) - 2):
            if t[i + 2] in "+-*/" and t[i] not in "+-*/" and t[i + 1] not in "+-*/":
                a, b, op = int(t[i]), int(t[i + 1]), t[i + 2]
                v = a + b if op == "+" else a - b if op == "-" else a * b if op == "*" else math.trunc(a / b)
                t[i:i + 3] = [str(v)]
                break
    return int(t[0])


def bf_largest_rect(h):
    return max(min(h[i:j]) * (j - i) for i in range(len(h)) for j in range(i + 1, len(h) + 1))


def bf_balanced(s):
    while any(p in s for p in ("()", "[]", "{}")):
        for p in ("()", "[]", "{}"):
            s = s.replace(p, "")
    return int(s == "")


def bf_islands(grid):
    cells = {(r, c) for r, row in enumerate(grid) for c, ch in enumerate(row) if ch == "1"}
    count = 0
    while cells:
        count += 1
        group = {cells.pop()}
        grew = True
        while grew:
            near = {x for x in cells if any(abs(x[0] - g[0]) + abs(x[1] - g[1]) == 1 for g in group)}
            grew = bool(near)
            group |= near
            cells -= near
    return count


def bf_rate(times, limit, window):
    accepted = []
    for t in times:
        if sum(1 for a in accepted if a > t - window) < limit:
            accepted.append(t)
    return len(accepted)


def bf_bucket(events, rate, cap):
    """events: (time, count). Simulate a bucket in tiny time steps, an independent discretisation."""
    tokens, last, ok = float(cap), 0.0, 0
    for t, k in events:
        steps = round((t - last) * 1000)
        for _ in range(steps):
            tokens = min(cap, tokens + rate / 1000)
        last = t
        for _ in range(k):
            if tokens >= 1 - 1e-9:
                tokens -= 1
                ok += 1
    return ok


# Trees as tuples (val, left, right), independent of the chapters' TreeNode class.
def tt_insert(t, v):
    if t is None:
        return (v, None, None)
    return (t[0], tt_insert(t[1], v), t[2]) if v < t[0] else (t[0], t[1], tt_insert(t[2], v))


def tt_bst(vals):
    t = None
    for v in vals:
        t = tt_insert(t, v)
    return t


def tt_nodes(t, depth=1, path=()):
    """(value, depth, path of ancestor values) for every node."""
    if t is None:
        return []
    here = path + (t[0],)
    return [(t[0], depth, here)] + tt_nodes(t[1], depth + 1, here) + tt_nodes(t[2], depth + 1, here)


def tt_diameter(t):
    nodes = tt_nodes(t)
    best = 0
    for (_, da, pa), (_, db, pb) in itertools.combinations(nodes, 2):
        common = max(i for i in range(min(len(pa), len(pb))) if pa[i] == pb[i]) + 1
        best = max(best, da + db - 2 * common)
    return best


def queue_ops(ops):
    q, popped = [], []
    for op in ops:
        if op == "pop":
            popped.append(q.pop(0))
        else:
            q.append(op)
    return popped


T_SMALL = (1, (2, (4, None, None), (5, None, None)), (3, None, None))
T_LEET = (3, (9, None, None), (20, (15, None, None), (7, None, None)))
T_LEVELS = (1, (2, (4, None, None), (5, None, None)), (3, (6, None, None), None))
LCA = tt_nodes(tt_bst([6, 2, 8, 0, 4, 7, 9, 3, 5]))
_p3 = next(p for v, d, p in LCA if v == 3)
_p5 = next(p for v, d, p in LCA if v == 5)

# ---------------------------------------------------------------- the answers
ANSWERS = {
    "dsa-complexity": {
        0: round(1e6 * math.log2(1e6) / 1e6), 1: sum(1 for i in range(100) for j in range(i + 1, 100)),
        "x1": math.ceil(math.log2(1e9 + 1)), "h0": 1024 * 10,
        "h1": next(k for k in range(100) if 3 ** 10 // 3 ** k <= 1), "h2": len(list(itertools.product((0, 1), repeat=20))),
        "h3": 2 * (100_000 / 10_000) ** 2,
    },
    "dsa-python": {
        0: 1, 1: math.floor(-7 / 2), 2: 5,  # [[0] * 3] * 2 repeats one row: both rows are the same list
        "h0": max([3, 1, 2]), "h1": sorted([5, 1, 4])[1], "h2": max("mississippi".count(c) for c in "misp"),
        "h3": [10, 20, 20, 30].index(20),
    },
    "dsa-arrays": {
        0: max(min(h1, h2) * (j - i) for (i, h1), (j, h2) in itertools.combinations(enumerate([1, 8, 6, 2, 5, 4, 8, 3, 7]), 2)),
        1: len(set([1, 1, 2, 3, 3, 3, 4])), 2: sum(1 for t in subarrays([1, 2, 3, -3, 3]) if sum(t) == 3),
        "x1": sum([2, -1, 3, 4, -2][1:4]), "h0": pointer_checks([1, 3, 4, 6, 8, 11], 10), "h1": sum([5, 1, 4, 2, 7, 3, 6][2:6]),
        "h2": sum(1 for t in subarrays([1, 1, 1]) if sum(t) == 2), "h3": 2 + 5,
    },
    "dsa-window": {
        0: max(sum(t) for t in subarrays([2, 1, 5, 1, 3, 2]) if len(t) == 3), 1: bf_longest_unique("abcabcbb"),
        2: min(len(t) for t in subarrays([2, 3, 1, 2, 4, 3]) if sum(t) >= 7),
        3: max([1, 3, -1, -3, 5, 3, 6, 7][3:6]),
        "h0": max(sum(t) / 4 for t in subarrays([1, 12, -5, -6, 50, 3]) if len(t) == 4), "h1": bf_longest_unique("pwwkew"),
        "h2": max(len(t) for t in substrings("eceba") if len(set(t)) <= 2),
        "h3": sum(max(t) for t in subarrays([4, 2, 12, 3, 8, 1]) if len(t) == 2),
    },
    "dsa-hashing": {
        0: sum(next((i, j) for i, j in itertools.combinations(range(3), 2) if [3, 2, 4][i] + [3, 2, 4][j] == 6)),
        1: len({tuple(sorted(w)) for w in ["eat", "tea", "tan", "ate", "nat", "bat"]}),
        2: max(len(t) for t in subarrays(sorted({100, 4, 200, 1, 3, 2})) if all(y - x == 1 for x, y in zip(t, t[1:]))),
        "h0": next(i for i, c in enumerate("loveleetcode") if "loveleetcode".count(c) == 1), "h1": len({3, 1, 3, 2, 1, 3}),
        "h2": int(sorted("listen") == sorted("silent")),
        "h3": int(any(a == b and j - i <= 3 for (i, a), (j, b) in itertools.combinations(enumerate([1, 2, 3, 1]), 2))),
    },
    "dsa-stacks": {
        0: bf_rpn(["4", "13", "5", "/", "+"]),
        1: next(k for k in range(1, 7) if [100, 80, 60, 70, 60, 75][5 - k] > 75),  # days back until a higher price
        2: queue_ops([1, 2, 3, "pop", 4, "pop", "pop"])[-1],
        "h0": bf_balanced("{[()()]}"),
        "h1": sum(next((y for y in a[i + 1:] if y > x), -1) for a in [[2, 1, 2, 4, 3]] for i, x in enumerate(a)),
        "h2": next(d for d in range(1, 6) if [73, 74, 75, 71, 69, 72, 76, 73][2 + d] > 75), "h3": bf_largest_rect([2, 4]),
    },
    "dsa-linked": {
        0: [1, 2, 3, 4][::-1][0], 1: [1, 2, 3, 4, 5, 6][len([1, 2, 3, 4, 5, 6]) // 2],
        "x1": [1, 2][::-1][0],  # after two passes the reversed part is 2 -> 1
        "h0": sorted([1, 4, 5] + [1, 3, 4])[3], "h1": [1, 2, 3, 4, 5][-2],
        "h2": next(n for n in range(1, 30) if n // 2 + 1 == 6),
    },
    "dsa-trees": {
        0: sum(2 ** k for k in range(4)), 1: max(d for _, d, _ in tt_nodes(tt_bst(range(1, 8)))), "x1": tt_diameter(T_SMALL),
        "h0": max(d for _, d, _ in tt_nodes(T_LEET)), "h1": sorted([5, 3, 8, 1, 4, 7, 9])[2],
        "h2": max(d for _, d, _ in tt_nodes(T_LEVELS)), "h3": [a for a, b in zip(_p3, _p5) if a == b][-1],
    },
    "dsa-heaps": {
        0: 2 * 3 + 1, 1: sorted([3, 2, 1, 5, 6, 4])[-2], 2: (3 + 5) / 2, "h0": (10 - 1) // 2,
        "h1": sorted([7, 2, 9, 4])[1], "h2": sorted([1, 4, 7, 2, 5, 8, 3, 6, 9])[4], "h3": sorted([2, 3, 4])[1],
    },
    "dsa-graphs": {
        0: bf_islands(["11000", "11000", "00100", "00011"]),
        1: bf_shortest([("A", "B"), ("A", "C"), ("B", "D"), ("C", "D"), ("D", "E")], "A", "E"),
        2: bf_shortest([("A", "B", 4), ("A", "C", 1), ("C", "B", 2), ("B", "D", 1), ("C", "D", 5)], "A", "D", weighted=True),
        "h0": bf_components(6, [(0, 1), (1, 2), (3, 4)]),
        "h1": next(c for c in range(4) if all(p.index(c) == 3 for p in itertools.permutations(range(4))
                                             if all(p.index(a) < p.index(b) for a, b in [(0, 1), (0, 2), (1, 3), (2, 3)]))),
        "h2": bf_shortest([((r, c), (r + dr, c + dc)) for r in range(3) for c in range(3) for dr, dc in ((0, 1), (1, 0)) if r + dr < 3 and c + dc < 3], (0, 0), (2, 2)),
        "h3": sum(bf_components(5, E[:i]) == bf_components(5, E[:i + 1]) for E in [[(0, 1), (2, 3), (1, 3), (0, 2)]] for i in range(4)),
    },
    "dsa-binsearch": {
        0: [1, 3, 3, 3, 7, 9].index(3), 1: min([4, 5, 6, 7, 0, 1, 2]), "x1": bf_min_capacity([3, 2, 2, 4, 1, 4], 3),
        2: math.ceil(math.log2(1_000_000)), "h0": [1, 2, 5, 5, 5, 5, 8].count(5), "h1": math.isqrt(2_000_000),
        "h2": [1, 2, 1, 3, 5, 6, 4][5],
        "h3": next(k for k in range(1, 12) if sum(-(-p // k) for p in [3, 6, 7, 11]) <= 8),
    },
    "dsa-sorting": {
        0: math.ceil(math.log2(math.factorial(4))), 1: bf_union_intervals([(1, 3), (2, 6), (8, 10), (15, 18)]),
        2: bf_live([(0, 30), (5, 10), (15, 20)]), "h0": 5 - 1, "h1": bf_live([(1, 5), (2, 6), (4, 8), (7, 9)]),
        "h2": sorted([7, 1, 5, 3, 9])[2], "h3": 4 + 4 - 1,
    },
    "dsa-backtracking": {
        0: len(list(itertools.permutations(range(5)))), 1: len(bf_combo_sum([2, 3, 6, 7], 7)), 2: bf_brackets(3),
        3: bf_queens(6), "h0": 2 ** 6, "h1": len(list(itertools.combinations(range(6), 3))), "h2": bf_queens(5),
        "h3": len(set(itertools.permutations([1, 1, 2]))),
    },
    "dsa-dp": {
        0: bf_min_coins([1, 2, 5], 11), 1: bf_count_ways([1, 2, 5], 5), 2: bf_rob([2, 7, 9, 3, 1]),
        "x1": bf_trades([1, 3, 2, 8, 4, 9], fee=2), 3: bf_edit("horse", "ros"),
        "h0": sum(1 for n in range(11) for steps in itertools.product((1, 2), repeat=n) if sum(steps) == 10),
        "h1": bf_lcs("abcde", "ace"), "h2": bf_lis([10, 9, 2, 5, 3, 7, 101, 18]),
        "h3": len(set(itertools.permutations("DD" + "RRRRRR"))), "h4": bf_trades([7, 1, 5, 3, 6, 4]),
    },
    "dsa-greedy": {
        0: bf_max_meetings([(1, 3), (2, 4), (3, 5), (6, 7)]), 1: int(bf_jump_min([3, 2, 1, 0, 4]) < math.inf),
        2: greedy_coins([1, 3, 4], 6),
        "h0": bf_jump_min([2, 3, 1, 1, 4]), "h1": 60 + 100 + 120 * 20 / 30,
        "h2": max(sum(c >= g for c, g in zip(p, [1, 2, 3])) for p in itertools.permutations([1, 1, 0])),  # 0 = no cookie
        "h3": bf_gas_start([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]),
    },
    "dsa-streaming": {
        0: round((101 * 20 + 102 * 10) / 30, 2), 1: 0.5 * 30 + 0.5 * (0.5 * 20 + 0.5 * 10), 2: bf_rate([0, 1, 2, 3, 10, 11], 3, 10),
        3: max(p for o, p in {"a": 100, "b": 101, "c": 99, "d": 101}.items() if o not in "bd"),
        "h0": sum([3, 4, 5]) / 3, "h1": bf_rate([0, 1, 2, 5, 6], 2, 5), "h2": round(math.log(0.5) / math.log(0.8), 2),
        "h3": bf_bucket([(0, 8), (2, 3)], 1, 5),
    },
    "dsa-interview": {
        0: (10 ** 5) ** 2 / 1e9, 1: bf_band([8, 2, 4, 7], 4), 2: bf_band([], 5), "h0": round(1e6 * math.log2(1e6) / 1e6),
        "h1": math.comb(10_000, 2) / 1e6, "h2": bf_band([4, 2, 2, 2, 4, 4, 2, 2], 0), "h3": 5000 ** 2 / 1e6,
    },
}

# Side checks on the answers above that need a little more than one expression.
assert bf_min_coins([1, 3, 4], 6) == 2  # greedy's 3 coins really is beaten
assert bf_knapsack([(1, 1), (3, 4), (4, 5), (5, 7)], 7) == 9  # the worked knapsack
assert bf_knapsack([(10, 60), (20, 100), (30, 120)], 50) == 220  # the 0/1 version quoted beside the fractional one
assert bf_min_capacity(list(range(1, 11)), 5) == 15  # the worked shipping example
assert bf_band([10, 1, 2, 4, 7, 2], 5) == 4  # the worked band example
assert bf_trades([1, 3, 2, 8, 4, 9], fee=2) == 8
assert [bf_queens(n) for n in range(1, 9)] == [1, 0, 0, 2, 10, 4, 40, 92]  # the sequence quoted in a hint
assert [bf_brackets(n) for n in (3, 5)] == [5, 42]
assert bf_days([3, 2, 2, 4, 1, 4], 5) == 4


# ---------------------------------------------------------------- running the listings
def listings():
    """[(chapter id, test name, code)] in file order."""
    out = []
    for f in sorted((ROOT / "www/js").glob("dev-part*.js")):
        src = f.read_text(encoding="utf-8")
        starts = [(m.start(), m.group(1)) for m in re.finditer(r"^    '(dsa-[a-z-]+)': \{", src, re.M)]
        for m in re.finditer(r"\{ code: `(.*?)`, test: '([a-z_0-9]+)' \}", src, re.S):
            chap = [c for pos, c in starts if pos < m.start()][-1]
            out.append((chap, m.group(2), m.group(1).replace("\\\\", "\\")))
    return out


def rand_list(n, lo=-5, hi=9):
    return [rng.randint(lo, hi) for _ in range(n)]


def build_tree(ns, vals):
    """A random binary tree on vals, returned with the chapter's own TreeNode class."""
    if not vals:
        return None
    k = rng.randrange(len(vals))
    return ns["TreeNode"](vals[k], build_tree(ns, vals[:k]), build_tree(ns, vals[k + 1:]))


def tree_inorder(t):
    return tree_inorder(t.left) + [t.val] + tree_inorder(t.right) if t else []


def tree_depth(t):
    return 0 if t is None else 1 + max(tree_depth(t.left), tree_depth(t.right))


def tree_paths(t):
    """Longest path in edges, by trying every pair of nodes via their depths from each node."""
    nodes, parent = [], {}

    def walk(n, p):
        if n:
            nodes.append(n)
            parent[id(n)] = p
            walk(n.left, n)
            walk(n.right, n)
    walk(t, None)

    def ancestors(n):
        out = []
        while n is not None:
            out.append(n)
            n = parent[id(n)]
        return out
    best = 0
    for a, b in itertools.combinations(nodes, 2):
        aa, bb = ancestors(a), ancestors(b)
        common = next(x for x in aa if any(x is y for y in bb))
        best = max(best, aa.index(common) + [id(y) for y in bb].index(id(common)))
    return best


def t_fib_memo(ns):
    a, b = 0, 1
    for n in range(60):
        assert ns["fib"](n) == a, n
        a, b = b, a + b


def t_py_idioms(ns):
    words = "the cat the dog a cat the a b".split()
    assert ns["top_k_words"](words, 2) == ["the", "a"]  # a and cat tie on 2; a wins alphabetically
    assert ns["group_by_symbol"]([("X", 1), ("Y", 2), ("X", 3)]) == {"X": [1, 3], "Y": [2]}
    for _ in range(50):
        a = rand_list(rng.randint(0, 12))
        k = rng.randint(0, 5)
        assert ns["k_smallest"](a, k) == sorted(a)[:k]


def t_pair_with_sum(ns):
    for _ in range(300):
        a = sorted(rand_list(rng.randint(0, 10)))
        t = rng.randint(-8, 16)
        r = ns["pair_with_sum"](a, t)
        exists = any(x + y == t for x, y in itertools.combinations(a, 2))
        assert (r is not None) == exists, (a, t, r)
        if r:
            assert r[0] < r[1] and a[r[0]] + a[r[1]] == t


def t_dedupe_sorted(ns):
    for _ in range(200):
        a = sorted(rand_list(rng.randint(0, 12), 0, 5))
        want = sorted(set(a))
        b = list(a)
        n = ns["dedupe_sorted"](b)
        assert b[:n] == want, (a, b, n)


def t_subarray_sum(ns):
    for _ in range(200):
        a = rand_list(rng.randint(0, 10), -3, 3)
        k = rng.randint(-3, 5)
        assert ns["count_subarrays_with_sum"](a, k) == sum(1 for t in subarrays(a) if sum(t) == k)


def t_max_window_sum(ns):
    for _ in range(200):
        a = rand_list(rng.randint(1, 10))
        k = rng.randint(1, len(a))
        assert ns["max_window_sum"](a, k) == max(sum(t) for t in subarrays(a) if len(t) == k)


def t_variable_window(ns):
    for _ in range(200):
        s = "".join(rng.choice("abcd") for _ in range(rng.randint(0, 10)))
        assert ns["longest_unique"](s) == bf_longest_unique(s), s
        a = rand_list(rng.randint(0, 9), 0, 6)
        t = rng.randint(1, 15)
        want = min((len(x) for x in subarrays(a) if sum(x) >= t), default=0)
        assert ns["shortest_with_sum"](a, t) == want, (a, t)


def t_window_max(ns):
    for _ in range(200):
        a = rand_list(rng.randint(1, 10))
        k = rng.randint(1, len(a))
        assert ns["window_max"](a, k) == [max(a[i:i + k]) for i in range(len(a) - k + 1)]


def t_two_sum(ns):
    for _ in range(300):
        a = rand_list(rng.randint(0, 8))
        t = rng.randint(-6, 12)
        r = ns["two_sum"](a, t)
        exists = any(a[i] + a[j] == t for i, j in itertools.combinations(range(len(a)), 2))
        assert (r is not None) == exists and (r is None or (r[0] < r[1] and a[r[0]] + a[r[1]] == t)), (a, t, r)


def t_hash_patterns(ns):
    g = ns["group_anagrams"](["eat", "tea", "tan", "ate", "nat", "bat"])
    assert sorted(sorted(x) for x in g) == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]
    for _ in range(200):
        a = rand_list(rng.randint(0, 10), -4, 8)
        s = sorted(set(a))
        want = max((len(t) for t in subarrays(s) if all(y - x == 1 for x, y in zip(t, t[1:]))), default=0)
        assert ns["longest_consecutive"](a) == want, a


def t_stack_basics(ns):
    for _ in range(300):
        s = "".join(rng.choice("()[]{}") for _ in range(rng.randint(0, 8)))
        assert ns["balanced"](s) == bool(bf_balanced(s)), s
    assert ns["eval_rpn"](["2", "1", "+", "3", "*"]) == 9
    assert ns["eval_rpn"](["4", "13", "5", "/", "+"]) == 6
    assert ns["eval_rpn"](["7", "-2", "/"]) == -3  # truncates towards zero


def t_monotonic_stack(ns):
    for _ in range(200):
        a = rand_list(rng.randint(0, 10), 0, 6)
        spans = [next((i - j for j in range(i - 1, -1, -1) if a[j] > a[i]), i + 1) for i in range(len(a))]
        assert ns["stock_span"](a) == spans, a
        assert ns["next_greater"](a) == [next((y for y in a[i + 1:] if y > x), -1) for i, x in enumerate(a)], a


def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out


def from_list(ns, vals):
    head = None
    for v in reversed(vals):
        head = ns["Node"](v, head)
    return head


def t_linked_basics(ns):
    for _ in range(100):
        a = rand_list(rng.randint(0, 8))
        assert to_list(ns["reverse"](from_list(ns, a))) == a[::-1]
        x, y = sorted(rand_list(rng.randint(0, 5))), sorted(rand_list(rng.randint(0, 5)))
        assert to_list(ns["merge_sorted"](from_list(ns, x), from_list(ns, y))) == sorted(x + y)


def t_fast_slow(ns):
    for n in range(1, 12):
        head = from_list(ns, list(range(n)))
        assert ns["middle"](head).val == n // 2
        assert not ns["has_cycle"](head)
        tail = head
        while tail.next:
            tail = tail.next
        for k in range(n):  # loop the tail back to node k
            node = head
            for _ in range(k):
                node = node.next
            tail.next = node
            assert ns["has_cycle"](head)
        tail.next = None


def t_traversals(ns):
    for _ in range(100):
        vals = rand_list(rng.randint(0, 9))
        t = build_tree(ns, vals)
        assert ns["inorder"](t) == vals  # build_tree keeps vals in in-order
        lv = ns["level_order"](t)
        assert len(lv) == tree_depth(t) and sorted(x for level in lv for x in level) == sorted(vals)


def t_tree_recursion(ns):
    for _ in range(100):
        t = build_tree(ns, rand_list(rng.randint(0, 9)))
        assert ns["max_depth"](t) == tree_depth(t)
        assert ns["diameter"](t) == tree_paths(t)


def t_bst(ns):
    for _ in range(100):
        vals = rng.sample(range(50), rng.randint(0, 10))
        root = None
        for v in vals:
            root = ns["insert"](root, v)
        assert tree_inorder(root) == sorted(vals) and ns["is_bst"](root)
    bad = ns["TreeNode"](5, ns["TreeNode"](3, None, ns["TreeNode"](6)), ns["TreeNode"](8))
    assert not ns["is_bst"](bad)  # 6 is right of 3 but left of 5


def t_heap_topk(ns):
    for _ in range(100):
        a = rand_list(rng.randint(0, 12))
        k = rng.randint(1, 5)
        assert ns["k_largest"](a, k) == sorted(a, reverse=True)[:k]
        streams = [sorted(rand_list(rng.randint(0, 4))) for _ in range(rng.randint(0, 4))]
        assert ns["merge_sorted_streams"](streams) == sorted(x for s in streams for x in s)


def t_running_median(ns):
    for _ in range(50):
        rm, seen = ns["RunningMedian"](), []
        for x in rand_list(rng.randint(1, 12)):
            rm.add(x)
            seen.append(x)
            s, n = sorted(seen), len(seen)
            want = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
            assert rm.median() == want, seen


def t_islands(ns):
    for _ in range(100):
        g = ["".join(rng.choice("01") for _ in range(5)) for _ in range(4)]
        assert ns["count_islands"](g) == bf_islands(g), g


def rand_graph(n, p):
    return [(a, b) for a, b in itertools.combinations(range(n), 2) if rng.random() < p]


def t_bfs(ns):
    for _ in range(100):
        edges = rand_graph(6, 0.3)
        g = {i: [] for i in range(6)}
        for a, b in edges:
            g[a].append(b)
            g[b].append(a)
        d = bf_shortest(edges + [(i, i) for i in range(6)], 0, 5)
        assert ns["bfs_steps"](g, 0, 5) == (-1 if d == math.inf else d)


def t_topo(ns):
    for _ in range(100):
        n = 5
        edges = [(a, b) for a in range(n) for b in range(n) if a != b and rng.random() < 0.15]
        order = ns["topo_order"](n, edges)
        valid = [p for p in itertools.permutations(range(n)) if all(p.index(a) < p.index(b) for a, b in edges)]
        assert (order is None) == (not valid)
        if order is not None:
            assert tuple(order) in valid


def t_dijkstra_uf(ns):
    for _ in range(100):
        edges = [(a, b, rng.randint(0, 9)) for a, b in rand_graph(6, 0.4)]
        g = {i: [] for i in range(6)}
        for a, b, w in edges:
            g[a].append((b, w))
            g[b].append((a, w))
        dist = ns["dijkstra"](g, 0)
        for v in range(6):
            d = bf_shortest(edges + [(i, i, 0) for i in range(6)], 0, v, weighted=True)
            assert dist.get(v, math.inf) == d
        uf = ns["UnionFind"](6)
        und = []
        for a, b, _ in edges:
            joined_before = bf_components(6, und) == bf_components(6, und + [(a, b)])
            assert uf.union(a, b) == (not joined_before)
            und.append((a, b))


def t_binsearch(ns):
    import bisect
    for _ in range(300):
        a = sorted(rand_list(rng.randint(0, 10), 0, 6))
        x = rng.randint(-1, 7)
        assert ns["lower_bound"](a, x) == bisect.bisect_left(a, x)


def t_rotated(ns):
    for n in range(1, 10):
        base = sorted(rng.sample(range(40), n))
        for r in range(n):
            assert ns["rotated_min"](base[r:] + base[:r]) == base[0]


def t_intervals(ns):
    for _ in range(200):
        iv = [sorted((rng.randint(0, 12), rng.randint(0, 12))) for _ in range(rng.randint(1, 6))]
        iv = [[s, e] for s, e in iv]
        merged = ns["merge_intervals"]([list(x) for x in iv])
        assert len(merged) == bf_union_intervals([tuple(x) for x in iv])
        assert all(merged[i][1] < merged[i + 1][0] for i in range(len(merged) - 1))
        half = [(s, e) for s, e in iv if s < e]
        if half:
            assert ns["max_overlap"](half) == bf_live(half)


def t_quickselect(ns):
    for _ in range(200):
        a = rand_list(rng.randint(1, 12))
        k = rng.randrange(len(a))
        assert ns["quickselect"](list(a), k) == sorted(a)[k]


def t_backtrack_basic(ns):
    for n in range(0, 6):
        items = list(range(n))
        subs = ns["subsets"](items)
        assert len(subs) == 2 ** n and len({tuple(s) for s in subs}) == 2 ** n
        perms = ns["permutations"](items)
        assert sorted(map(tuple, perms)) == sorted(itertools.permutations(items))


def t_backtrack_prune(ns):
    for cands, t in [([2, 3, 6, 7], 7), ([2, 3, 5], 8), ([2], 1), ([1, 2], 4)]:
        assert {tuple(c) for c in ns["combination_sum"](cands, t)} == bf_combo_sum(cands, t)
    assert [ns["n_queens"](n) for n in range(1, 9)] == [bf_queens(n) for n in range(1, 9)]


def t_coins(ns):
    for coins in ([1, 2, 5], [1, 3, 4], [2], [3, 7]):
        for amount in range(0, 16):
            want = bf_min_coins(coins, amount)
            assert ns["coin_change"](coins, amount) == want, (coins, amount)
            assert ns["count_ways"](coins, amount) == bf_count_ways(coins, amount)


def t_dp_1d(ns):
    for _ in range(100):
        v = rand_list(rng.randint(0, 9), 0, 9)
        assert ns["rob"](v) == bf_rob(v)
        p = rand_list(rng.randint(1, 8), 1, 12)
        assert ns["max_profit_one_trade"](p) == bf_trades(p, limit=1)
        fee = rng.randint(0, 3)
        assert ns["max_profit_with_fee"](p, fee) == bf_trades(p, fee=fee)


def t_dp_2d(ns):
    for _ in range(60):
        a = "".join(rng.choice("abc") for _ in range(rng.randint(0, 6)))
        b = "".join(rng.choice("abc") for _ in range(rng.randint(0, 5)))
        assert ns["lcs"](a, b) == bf_lcs(a, b)
        if len(a) + len(b) <= 8:
            assert ns["edit_distance"](a, b) == bf_edit(a, b), (a, b)
        items = [(rng.randint(1, 6), rng.randint(0, 9)) for _ in range(rng.randint(0, 6))]
        cap = rng.randint(0, 12)
        assert ns["knapsack"](items, cap) == bf_knapsack(items, cap)
    assert ns["edit_distance"]("horse", "ros") == 3


def t_greedy(ns):
    for _ in range(200):
        iv = [tuple(sorted(rng.sample(range(12), 2))) for _ in range(rng.randint(0, 6))]
        assert ns["max_non_overlapping"](iv) == (bf_max_meetings(iv) if iv else 0)
        j = rand_list(rng.randint(1, 7), 0, 3)
        assert ns["can_reach_end"](j) == (bf_jump_min(j) < math.inf), j


def t_rolling(ns):
    for _ in range(50):
        w = rng.randint(1, 20)
        r = ns["RollingVWAP"](w)
        trades, t = [], 0
        for _ in range(rng.randint(1, 15)):
            t += rng.randint(0, 8)
            px, q = rng.randint(95, 105), rng.randint(1, 5)
            r.add(t, px, q)
            trades.append((t, px, q))
            live = [(p, q) for s, p, q in trades if s > t - w]
            assert abs(r.value() - sum(p * q for p, q in live) / sum(q for p, q in live)) < 1e-9
    vals = rand_list(10)
    out = ns["ewma"](vals, 0.3)
    for i in range(len(vals)):  # the closed form: weights 0.3 * 0.7^k, with the first value taking the rest
        want = sum(0.3 * 0.7 ** k * vals[i - k] for k in range(i)) + 0.7 ** i * vals[0]
        assert abs(out[i] - want) < 1e-9


def t_rate_limit(ns):
    for _ in range(100):
        limit, w = rng.randint(1, 4), rng.randint(1, 10)
        times = sorted(rng.randint(0, 30) for _ in range(rng.randint(0, 15)))
        rl = ns["RateLimiter"](limit, w)
        assert sum(rl.allow(t) for t in times) == bf_rate(times, limit, w)
    for _ in range(30):
        rate, cap = rng.choice([0.5, 1, 2]), rng.randint(1, 5)
        events, t = [], 0
        for _ in range(rng.randint(1, 6)):
            t += rng.randint(0, 4)
            events.append((t, rng.randint(1, 4)))
        tb = ns["TokenBucket"](rate, cap)
        got = sum(tb.allow(t) for t, k in events for _ in range(k))
        assert got == bf_bucket(events, rate, cap), (rate, cap, events)


def t_lazy_heap(ns):
    for _ in range(100):
        bb, live = ns["BestBid"](), {}
        for i in range(rng.randint(1, 20)):
            if live and rng.random() < 0.4:
                oid = rng.choice(list(live))
                bb.cancel(oid)
                del live[oid]
            else:
                live[i] = rng.randint(95, 105)
                bb.add(i, live[i])
            assert bb.best() == (max(live.values()) if live else None)


def t_lru(ns):
    for _ in range(100):
        cap = rng.randint(1, 3)
        c, model = ns["LRUCache"](cap), []  # model: list of (key, value), least recent first
        for _ in range(20):
            k = rng.randint(0, 4)
            if rng.random() < 0.5:
                hit = next((v for kk, v in model if kk == k), None)
                assert c.get(k) == hit
                if hit is not None:
                    model = [x for x in model if x[0] != k] + [(k, hit)]
            else:
                v = rng.randint(0, 99)
                c.put(k, v)
                model = [x for x in model if x[0] != k] + [(k, v)]
                model = model[-cap:]


def t_band(ns):
    for _ in range(300):
        p = rand_list(rng.randint(0, 10), 0, 9)
        w = rng.randint(0, 5)
        assert ns["longest_in_band"](p, w) == bf_band(p, w), (p, w)


TESTS = {name[2:]: fn for name, fn in globals().items() if name.startswith("t_") and callable(fn)}


def main():
    problems, ran = [], 0
    found = listings()
    names = [n for _, n, _ in found]
    if len(set(names)) != len(names):
        problems.append("two listings share a test name")
    for name in set(TESTS) - set(names):
        problems.append(f"test {name} has no listing in dev-part*.js")
    spaces = {}
    for chap, name, code in found:
        ns = spaces.setdefault(chap, {"__name__": "listing"})
        try:
            exec(code, ns)
        except Exception as e:
            problems.append(f"{chap} listing {name} does not run: {type(e).__name__}: {e}")
            continue
        if name not in TESTS:
            problems.append(f"{chap} listing {name} has no test here")
            continue
        try:
            TESTS[name](ns)
            ran += 1
        except Exception as e:
            problems.append(f"{chap} listing {name} failed: {type(e).__name__}: {e}")
    keys = sum(len(v) for v in ANSWERS.values())
    print(f"{len(found)} code listings in {len(spaces)} chapters, {ran} tested; {keys} numeric answers derived")
    for p in problems:
        print("FAIL", p)
    if problems:
        sys.exit(1)
    print("All quant dev handbook checks pass.")


if __name__ == "__main__":
    main()
