"""Checks the Python in the handbooks' written model answers (homework with no numeric answer).

Every <pre class="sc-code"> block in a model answer must compile. A block that defines a function or
class must have a test here (TESTS), which runs it against slow, obviously correct code; blocks in
RUN are executed as they stand (they hold their own asserts). Everything else (fragments that use
names defined elsewhere, like a DataFrame df) is compiled only.

    node tests/export-models.js > models.json && python research/verify_models.py models.json
"""
import html
import itertools
import json
import random
import re
import sys
from collections import Counter

rng = random.Random(5)


def blocks(sol):
    return [html.unescape(m) for m in re.findall(r'<pre class="sc-code">(.*?)</pre>', sol, re.S)]


# ---------------------------------------------------------------- tests, keyed by (chapter, homework key)
def t_dfs(ns):
    g = {0: [1, 2], 1: [3], 2: [3], 3: [], 4: [0]}
    assert set(ns["dfs"](0, g)) == {0, 1, 2, 3} and ns["dfs"](0, g)[0] == 0
    chain = {i: [i + 1] for i in range(200_000)}
    chain[200_000] = []
    assert len(ns["dfs"](0, chain)) == 200_001          # no recursion limit


def t_top_k(ns):
    assert ns["top_k"]([1, 1, 1, 2, 2, 3], 2) == [1, 2]
    for _ in range(200):
        a = [rng.randint(0, 6) for _ in range(rng.randint(1, 30))]
        k = rng.randint(1, len(set(a)))
        got = ns["top_k"](a, k)
        c = Counter(a)
        assert len(got) == k == len(set(got))
        assert min(c[x] for x in got) >= max([c[x] for x in c if x not in got], default=0)


def t_drop_cancelled(ns):
    class O:
        def __init__(self, c):
            self.cancelled = c
    for _ in range(200):
        orders = [O(rng.random() < 0.5) for _ in range(rng.randint(0, 12))]
        alias, keep = orders, [o for o in orders if not o.cancelled]
        ns["drop_cancelled"](orders)
        assert alias is orders and orders == keep


def t_max_profit(ns):
    assert ns["max_profit"]([7, 1, 5, 3, 6, 4]) == 5 and ns["max_profit"]([5, 4, 3]) == 0 and ns["max_profit"]([]) == 0
    for _ in range(500):
        p = [rng.randint(1, 20) for _ in range(rng.randint(0, 12))]
        want = max([p[j] - p[i] for i, j in itertools.combinations(range(len(p)), 2)] + [0])
        assert ns["max_profit"](p) == want


def t_count_subarrays(ns):
    assert ns["count_subarrays"]([3, -2, 2], 3) == 2
    for _ in range(500):
        a = [rng.randint(-4, 4) for _ in range(rng.randint(0, 12))]
        k = rng.randint(-4, 6)
        want = sum(sum(a[i:j]) == k for i in range(len(a)) for j in range(i + 1, len(a) + 1))
        assert ns["count_subarrays"](a, k) == want


def t_rect(ns):
    S = ns["build"]([[1, 2], [3, 4]])
    assert S[2][2] == 10 and ns["rect_sum"](S, 1, 1, 2, 2) == 4
    for _ in range(100):
        r, c = rng.randint(1, 6), rng.randint(1, 6)
        g = [[rng.randint(-5, 9) for _ in range(c)] for _ in range(r)]
        S = ns["build"](g)
        for _ in range(20):
            r1, r2 = sorted(rng.sample(range(r + 1), 2))
            c1, c2 = sorted(rng.sample(range(c + 1), 2))
            assert ns["rect_sum"](S, r1, c1, r2, c2) == sum(g[i][j] for i in range(r1, r2) for j in range(c1, c2))


def t_window_max(ns):
    w = ns["WindowMax"](60)
    for t, p, m in [(0, 101, 101), (10, 99, 101), (20, 100, 101), (70, 98, 100)]:
        w.add(t, p)
        assert w.max() == m
    for _ in range(200):
        span = rng.randint(1, 20)
        w, seen, t = ns["WindowMax"](span), [], 0
        for _ in range(rng.randint(1, 30)):
            t += rng.randint(0, 6)
            p = rng.randint(90, 110)
            w.add(t, p)
            seen.append((t, p))
            assert w.max() == max(q for s, q in seen if s > t - span)


def t_min_window(ns):
    f = ns["min_window"]
    assert f("ADOBECODEBANC", "ABC") == "BANC" and f("a", "aa") == "" and f("a", "a") == "a"
    for _ in range(400):
        s = "".join(rng.choice("abc") for _ in range(rng.randint(0, 10)))
        t = "".join(rng.choice("abc") for _ in range(rng.randint(1, 3)))
        need = Counter(t)
        cands = [s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1) if not need - Counter(s[i:j])]
        got = f(s, t)
        if not cands:
            assert got == ""
        else:
            assert len(got) == min(map(len, cands)) and not need - Counter(got)


def t_orders(ns):
    ns["on_new"](1, "B", 100, 5)
    ns["on_new"](2, "S", 101, 3)
    ns["on_fill"](1, 2)
    assert ns["orders"][1]["qty"] == 3
    ns["on_fill"](1, 3)
    ns["on_cancel"](2)
    ns["on_cancel"](99)
    assert ns["orders"] == {}


def t_random_set(ns):
    rs, model = ns["RandomSet"](), set()
    for _ in range(3000):
        x = rng.randint(0, 20)
        if rng.random() < 0.5:
            assert rs.insert(x) == (x not in model)
            model.add(x)
        else:
            assert rs.remove(x) == (x in model)
            model.discard(x)
        assert sorted(rs.items) == sorted(model) and all(rs.items[i] == v for v, i in rs.pos.items())
        if model:
            assert rs.get_random() in model



class LNode:
    def __init__(self, val, next=None):
        self.val, self.next = val, next


def linked(vals):
    head = None
    for v in reversed(vals):
        head = LNode(v, head)
    return head


def values(head, limit=1000):
    out = []
    while head and len(out) < limit:
        out.append(head.val)
        head = head.next
    return out


class TNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right


def rand_tree(n, lo=0, hi=50):
    """A random binary tree (not a BST) with n nodes."""
    if n == 0:
        return None
    k = rng.randint(0, n - 1)
    return TNode(rng.randint(lo, hi), rand_tree(k, lo, hi), rand_tree(n - 1 - k, lo, hi))


def t_min_stack(ns):
    st, model = ns["MinStack"](), []
    for _ in range(3000):
        if model and rng.random() < 0.4:
            assert st.pop() == model.pop()
        else:
            x = rng.randint(-20, 20)
            st.push(x)
            model.append(x)
        if model:
            assert st.get_min() == min(model) and st.top() == model[-1]


def t_prev_greater(ns):
    p = [100, 80, 60, 70, 60, 75, 85]
    assert ns["previous_greater"](p) == [-1, 100, 80, 80, 70, 80, 100]
    assert ns["stock_span"](p) == [1, 1, 1, 2, 1, 4, 6]
    for _ in range(300):
        a = [rng.randint(1, 9) for _ in range(rng.randint(0, 15))]
        want = [next((a[j] for j in range(i - 1, -1, -1) if a[j] > a[i]), -1) for i in range(len(a))]
        span = [next((i - j for j in range(i - 1, -1, -1) if a[j] > a[i]), i + 1) for i in range(len(a))]
        assert ns["previous_greater"](a) == want and ns["stock_span"](a) == span


def t_cycle_start(ns):
    for _ in range(300):
        n = rng.randint(1, 20)
        nodes = [LNode(i) for i in range(n)]
        for a, b in zip(nodes, nodes[1:]):
            a.next = b
        start = rng.choice([None] + list(range(n)))
        if start is not None:
            nodes[-1].next = nodes[start]
        got = ns["cycle_start"](nodes[0])
        assert got is (nodes[start] if start is not None else None)


def t_palindrome(ns):
    for _ in range(500):
        n = rng.randint(0, 9)
        half = [rng.randint(0, 2) for _ in range(n // 2)]
        vals = half + ([rng.randint(0, 2)] if n % 2 else []) + half[::-1] if rng.random() < 0.5 else [rng.randint(0, 2) for _ in range(n)]
        assert ns["is_palindrome"](linked(vals)) == (vals == vals[::-1])


def t_reverse_groups(ns):
    N = ns["Node"]
    def mk(vals):
        head = None
        for v in reversed(vals):
            head = N(v, head)
        return head
    assert values(ns["reverse_groups"](mk([1, 2, 3, 4, 5]), 2)) == [2, 1, 4, 3, 5]
    for _ in range(300):
        vals = list(range(rng.randint(0, 12)))
        k = rng.randint(1, 5)
        want = []
        for i in range(0, len(vals), k):
            g = vals[i:i + k]
            want += g[::-1] if len(g) == k else g
        assert values(ns["reverse_groups"](mk(vals), k)) == want


def t_right_side(ns):
    root = TNode(1, TNode(2, None, TNode(5)), TNode(3))
    assert ns["right_side"](root) == [1, 3, 5] and ns["right_side"](None) == []
    for _ in range(200):
        t = rand_tree(rng.randint(1, 20))
        levels, cur = [], [t]
        while cur:
            levels.append(cur[-1].val)
            cur = [c for n in cur for c in (n.left, n.right) if c]
        assert ns["right_side"](t) == levels


def t_serialise(ns):
    def same(a, b):
        return (a is None and b is None) or (a is not None and b is not None and a.val == b.val and same(a.left, b.left) and same(a.right, b.right))
    T = ns["TreeNode"]
    t = T(1, T(2), T(3, T(4), T(5)))
    assert ns["serialise"](t) == "1,2,#,#,3,4,#,#,5,#,#"
    for _ in range(200):
        t = rand_tree(rng.randint(0, 25), -9, 99)
        assert same(ns["deserialise"](ns["serialise"](t)), t)


def t_kth_bst(ns):
    def insert(root, v):
        if root is None:
            return TNode(v)
        if v < root.val:
            root.left = insert(root.left, v)
        else:
            root.right = insert(root.right, v)
        return root
    for _ in range(200):
        vals = rng.sample(range(100), rng.randint(1, 25))
        root = None
        for v in vals:
            root = insert(root, v)
        k = rng.randint(1, len(vals))
        assert ns["kth_smallest"](root, k) == sorted(vals)[k - 1]


def t_schedule(ns):
    assert ns["schedule"]([3, 2, 4], 2) == [(0, 0), (1, 0), (1, 2)]
    for _ in range(200):
        k = rng.randint(1, 4)
        ds = [rng.randint(1, 9) for _ in range(rng.randint(0, 15))]
        free, want = [0] * k, []
        for d in ds:
            m = min(range(k), key=lambda i: (free[i], i))
            want.append((m, free[m]))
            free[m] += d
        assert ns["schedule"](ds, k) == want


def t_bids(ns):
    b, live = ns["Bids"](), {}
    for _ in range(3000):
        if live and rng.random() < 0.45:
            p = rng.choice(list(live))
            q = rng.randint(1, live[p])
            b.remove(p, q)
            live[p] -= q
            if live[p] == 0:
                del live[p]
        else:
            p, q = rng.randint(95, 105), rng.randint(1, 5)
            b.add(p, q)
            live[p] = live.get(p, 0) + q
        assert b.best() == (max(live) if live else None)


def t_pair_sum(ns):
    assert ns["kth_smallest_pair_sum"]([1, 7, 11], [2, 4, 6], 3) == 7
    for _ in range(300):
        a = sorted(rng.randint(0, 20) for _ in range(rng.randint(1, 7)))
        b = sorted(rng.randint(0, 20) for _ in range(rng.randint(1, 7)))
        sums = sorted(x + y for x in a for y in b)
        k = rng.randint(1, len(sums))
        assert ns["kth_smallest_pair_sum"](a, b, k) == sums[k - 1]


def t_arbitrage(ns):
    import math
    cur = ["USD", "EUR", "GBP"]
    fair = {("USD", "EUR"): 0.9, ("EUR", "USD"): 1 / 0.9, ("EUR", "GBP"): 0.8, ("GBP", "EUR"): 1.25, ("USD", "GBP"): 0.72, ("GBP", "USD"): 1 / 0.72}
    assert not ns["arbitrage"](cur, fair)
    rich = dict(fair)
    rich[("GBP", "USD")] = 1.45
    assert ns["arbitrage"](cur, rich)
    for _ in range(200):
        n = rng.randint(2, 4)
        cs = list(range(n))
        rates = {(a, b): math.exp(rng.uniform(-0.3, 0.3)) for a in cs for b in cs if a != b and rng.random() < 0.8}
        best = 0.0
        for r in range(2, n + 1):
            for cyc in itertools.permutations(cs, r):
                edges = list(zip(cyc, cyc[1:] + cyc[:1]))
                if all(e in rates for e in edges):
                    best = max(best, sum(math.log(rates[e]) for e in edges))
        assert ns["arbitrage"](cs, rates) == (best > 1e-9)


def t_dijkstra(ns):
    for _ in range(200):
        n = rng.randint(1, 8)
        g = {u: [] for u in range(n)}
        for u in range(n):
            for v in range(n):
                if u != v and rng.random() < 0.35:
                    g[u].append((v, rng.randint(0, 9)))
        dist = {0: 0}
        for _ in range(n):  # Bellman-Ford as the reference
            for u in g:
                for v, w in g[u]:
                    if u in dist and dist[u] + w < dist.get(v, float("inf")):
                        dist[v] = dist[u] + w
        assert ns["dijkstra"](g, 0) == dist


def t_one_break(ns):
    from collections import deque
    f = ns["shortest_with_one_break"]
    assert f([[0, 1], [1, 0]]) == 2 and f([[0]]) == 0
    for _ in range(300):
        r, c = rng.randint(1, 5), rng.randint(1, 5)
        g = [[1 if rng.random() < 0.35 else 0 for _ in range(c)] for _ in range(r)]
        best = -1
        walls = [None] + [(i, j) for i in range(r) for j in range(c) if g[i][j]]
        for w in walls:  # reference: plain BFS with each single wall removed
            h = [row[:] for row in g]
            if w:
                h[w[0]][w[1]] = 0
            if h[0][0]:
                continue
            d, q = {(0, 0): 0}, deque([(0, 0)])
            while q:
                i, j = q.popleft()
                for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b2 = i + di, j + dj
                    if 0 <= a < r and 0 <= b2 < c and not h[a][b2] and (a, b2) not in d:
                        d[(a, b2)] = d[(i, j)] + 1
                        q.append((a, b2))
            if (r - 1, c - 1) in d and (best < 0 or d[(r - 1, c - 1)] < best):
                best = d[(r - 1, c - 1)]
        assert f(g) == best, (g, f(g), best)



def t_count_between(ns):
    assert ns["count_between"]([1, 3, 3, 5, 8], 3, 8) == 3
    for _ in range(300):
        t = sorted(rng.randint(0, 20) for _ in range(rng.randint(0, 15)))
        a, b = sorted(rng.sample(range(-2, 23), 2))
        assert ns["count_between"](t, a, b) == sum(a <= x < b for x in t)


def t_median(ns):
    import statistics
    assert ns["median_two_sorted"]([1, 3], [2, 4, 5]) == 3
    for _ in range(500):
        A = sorted(rng.randint(-9, 9) for _ in range(rng.randint(0, 6)))
        B = sorted(rng.randint(-9, 9) for _ in range(rng.randint(0 if A else 1, 6)))
        assert ns["median_two_sorted"](A, B) == statistics.median(A + B)


def t_sort_two_keys(ns):
    from types import SimpleNamespace as R
    for _ in range(100):
        tr = [R(symbol=rng.choice("ABC"), time=rng.randint(0, 9), id=i) for i in range(rng.randint(0, 20))]
        want = sorted(tr, key=lambda x: (x.symbol, x.time))
        for f in ("by_symbol_then_time", "by_symbol_then_time_two_passes"):
            assert [x.id for x in ns[f](tr)] == [x.id for x in want]


def t_counting_sort(ns):
    for _ in range(200):
        items = [(rng.randint(0, 6), i) for i in range(rng.randint(0, 25))]
        assert ns["counting_sort"](items, lambda x: x[0], 7) == sorted(items, key=lambda x: x[0])


def t_insert_interval(ns):
    f = ns["insert_interval"]
    assert f([(1, 2), (3, 5), (6, 7), (8, 10), (12, 16)], (4, 8)) == [(1, 2), (3, 10), (12, 16)]
    for _ in range(500):
        pts = sorted(rng.sample(range(40), 2 * rng.randint(0, 5)))
        iv = [(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)]
        a, b = sorted(rng.sample(range(-2, 42), 2))
        merged = []
        for x, y in sorted(iv + [(a, b)]):
            if merged and x <= merged[-1][1]:
                merged[-1] = (merged[-1][0], max(merged[-1][1], y))
            else:
                merged.append((x, y))
        assert f(iv, (a, b)) == merged


def t_brackets(ns):
    def ok(s):
        d = 0
        for ch in s:
            d += 1 if ch == "(" else -1
            if d < 0:
                return False
        return d == 0
    for n in range(0, 9):
        got = ns["brackets"](n)
        want = ["".join(p) for p in itertools.product("()", repeat=2 * n) if ok(p)]
        assert sorted(got) == sorted(want) and len(set(got)) == len(got)


def t_word_search(ns):
    def brute(board, word):
        R, C = len(board), len(board[0])
        def go(r, c, i, used):
            if board[r][c] != word[i]:
                return False
            if i == len(word) - 1:
                return True
            return any(go(r + dr, c + dc, i + 1, used | {(r, c)}) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))
                       if 0 <= r + dr < R and 0 <= c + dc < C and (r + dr, c + dc) not in used | {(r, c)})
        return any(go(r, c, 0, frozenset()) for r in range(R) for c in range(C))
    b = [list("ABCE"), list("SFCS"), list("ADEE")]
    assert ns["exists"](b, "ABCCED") and not ns["exists"](b, "ABCB")
    for _ in range(300):
        R, C = rng.randint(1, 4), rng.randint(1, 4)
        board = [[rng.choice("ab") for _ in range(C)] for _ in range(R)]
        word = "".join(rng.choice("ab") for _ in range(rng.randint(1, 5)))
        before = [row[:] for row in board]
        assert ns["exists"](board, word) == brute(board, word) and board == before


def t_partition(ns):
    for _ in range(400):
        a = [rng.randint(1, 12) for _ in range(rng.randint(1, 10))]
        want = any(2 * sum(c) == sum(a) for r in range(len(a) + 1) for c in itertools.combinations(a, r))
        assert ns["can_partition"](a) == want


def bf_trades_k(p, k):
    from functools import lru_cache
    @lru_cache(None)
    def go(i, left, holding):
        if i == len(p):
            return 0 if not holding else float("-inf")
        best = go(i + 1, left, holding)
        if holding:
            best = max(best, p[i] + go(i + 1, left, False))
        elif left:
            best = max(best, -p[i] + go(i + 1, left - 1, True))
        return best
    return go(0, k, False)


def t_profit_k(ns):
    assert ns["max_profit_k"]([3, 2, 6, 5, 0, 3], 2) == 7 and ns["max_profit_k"]([3, 2, 6, 5, 0, 3], 1) == 4
    for _ in range(400):
        p = tuple(rng.randint(0, 9) for _ in range(rng.randint(0, 9)))
        k = rng.randint(0, 4)
        assert ns["max_profit_k"](list(p), k) == bf_trades_k(p, k)


def t_profit_unlimited(ns):
    assert ns["max_profit_unlimited"]([1, 5, 3, 6]) == 7
    for _ in range(300):
        p = tuple(rng.randint(0, 9) for _ in range(rng.randint(0, 9)))
        assert ns["max_profit_unlimited"](list(p)) == bf_trades_k(p, len(p))


def t_least_interval(ns):
    from functools import lru_cache
    def brute(tasks, n):
        names = sorted(set(tasks))
        @lru_cache(None)
        def go(remaining, cool):
            if not any(remaining):
                return 0
            best = 1 + go(remaining, tuple(max(0, c - 1) for c in cool)) if any(cool) else float("inf")  # idle
            for i, r in enumerate(remaining):
                if r and cool[i] == 0:
                    rem = remaining[:i] + (r - 1,) + remaining[i + 1:]
                    nc = tuple(n if j == i else max(0, c - 1) for j, c in enumerate(cool))
                    best = min(best, 1 + go(rem, nc))
            return best
        return go(tuple(tasks.count(x) for x in names), tuple(0 for _ in names))
    assert ns["least_interval"](list("AAABBBC"), 2) == 8
    for _ in range(150):
        tasks = [rng.choice("ABC") for _ in range(rng.randint(1, 7))]
        n = rng.randint(0, 3)
        assert ns["least_interval"](tasks, n) == brute(tasks, n)


def t_arrows(ns):
    assert ns["min_arrows"]([(10, 16), (2, 8), (1, 6), (7, 12)]) == 2
    for _ in range(300):
        bs = []
        for _ in range(rng.randint(0, 6)):
            a = rng.randint(0, 12)
            bs.append((a, a + rng.randint(0, 5)))
        pts = sorted({x for b in bs for x in b})
        best = next(r for r in range(len(bs) + 1) if any(all(any(a <= x <= b for x in xs) for a, b in bs) for xs in itertools.combinations(pts, r)))
        assert ns["min_arrows"](bs) == best



def t_book(ns):
    b = ns["Book"]()
    live = {}
    for i in range(3000):
        if live and rng.random() < 0.45:
            oid = rng.choice(list(live))
            b.cancel(oid)
            del live[oid]
        else:
            side, px, q = rng.choice("BS"), rng.randint(95, 105), rng.randint(1, 9)
            b.add(i, side, px, q)
            live[i] = (side, px, q)
        for side, pick in (("B", max), ("S", min)):
            prices = [p for s2, p, _ in live.values() if s2 == side]
            assert b.best(side) == (pick(prices) if prices else None)
        side, px = rng.choice("BS"), rng.randint(95, 105)
        assert b.volume_at(side, px) == sum(q for s2, p, q in live.values() if s2 == side and p == px)


def t_feed(ns):
    got = []
    h = ns["FeedHandler"](got.append)
    for seq in (1, 2, 4, 2, 3, 5):
        h.on_message(seq, seq)
    assert got == [1, 2, 3, 4, 5]
    for _ in range(300):
        n = rng.randint(1, 15)
        msgs = list(range(1, n + 1)) * 2
        rng.shuffle(msgs)
        got = []
        h = ns["FeedHandler"](got.append)
        for seq in msgs:
            h.on_message(seq, seq)
        assert got == list(range(1, n + 1))


def t_rolling_std(ns):
    import numpy as np
    for _ in range(100):
        x = 100 + np.cumsum(np.random.default_rng(rng.randint(0, 999)).normal(0, 0.01, rng.randint(25, 200)))
        w = rng.randint(2, 20)
        want = [np.std(x[i:i + w], ddof=1) for i in range(len(x) - w + 1)]
        assert np.allclose(ns["rolling_std"](x, w), want, atol=1e-7)


def t_view(ns):
    import numpy as np
    p = np.array([1.0, 500.0, 2.0])
    ns["clean_last_window"](p, 10.0)
    assert p[1] == 10.0


def t_dd_dates(ns):
    assert ns["max_drawdown_dates"]([100, 120, 90, 130, 80, 95])[1:] == (3, 4)
    assert ns["max_drawdown_dates"]([1, 2, 3]) == (0.0, 0, 0)
    for _ in range(300):
        p = [rng.randint(1, 20) for _ in range(rng.randint(1, 12))]
        dd, peak, trough = ns["max_drawdown_dates"](p)
        best = min([p[j] / p[i] - 1 for i in range(len(p)) for j in range(i, len(p))])
        assert abs(dd - best) < 1e-12 and peak <= trough and abs(p[trough] / p[peak] - 1 - best) < 1e-12


def t_fees(ns):
    import pandas as pd
    t = pd.DataFrame({"px": [100.0, 10.0, 200.0], "qty": [1000, 5, 1000], "venue": ["A", "A", "X"]})
    got = ns["fees"](t).tolist()
    want = [max(p * q * 0.5e-4, 1.0) * (2 if v == "X" else 1) for p, q, v in zip(t.px, t.qty, t.venue)]
    assert all(abs(a - b) < 1e-12 for a, b in zip(got, want))


def t_attach_quotes(ns):
    import pandas as pd
    T = lambda s: pd.Timestamp("2026-03-02 09:00:00") + pd.Timedelta(seconds=s)
    q = pd.DataFrame({"t": [T(4), T(0), T(3), T(3)], "sym": ["A", "A", "A", "B"], "bid": [99.9, 100.0, 100.1, 50.0]})
    tr = pd.DataFrame({"t": [T(5), T(3), T(10), T(3.5), T(0.5)], "sym": ["A", "A", "A", "B", "A"]})
    m = ns["attach_quotes"](tr, q)
    got = dict(zip(zip(m.t, m.sym), m.bid))
    assert pd.isna(got[(T(3), "A")])          # exact match excluded; 09:00:00 is 3 s old
    assert got[(T(0.5), "A")] == 100.0
    assert got[(T(5), "A")] == 99.9
    assert pd.isna(got[(T(10), "A")])         # 6 s stale: beyond tolerance
    assert got[(T(3.5), "B")] == 50.0


def t_bars_groupby(ns):
    import pandas as pd
    T = lambda s: pd.Timestamp("2026-03-02 09:00:00") + pd.Timedelta(seconds=s)
    ticks = pd.DataFrame({"t": [T(10), T(50), T(80), T(180)], "px": [100.0, 101, 99, 102], "qty": [1, 2, 3, 4]})
    b = ns["minute_bars_groupby"](ticks)
    assert len(b) == 3 and b["close"].tolist() == [101.0, 99.0, 102.0] and b["volume"].tolist() == [3, 3, 4]
    assert b["high"].tolist() == [101.0, 99.0, 102.0] and b["open"].tolist() == [100.0, 99.0, 102.0]


def t_pl_z(ns):
    import polars as pl
    df = pl.DataFrame({"k": ["a", "a", "b", "b", "b"], "x": [1.0, 3, 2, 4, 9]})
    z = ns["zscore_within"](df)["z"].to_list()
    assert abs(z[0] + 0.7071067811865476) < 1e-12 and abs(z[4] - 4 / 13 ** 0.5) < 1e-12


def t_daily_vwap(ns):
    import os, tempfile
    from datetime import datetime, timedelta
    import polars as pl
    rows = [(datetime(2026, 3, 2 + d, 9) + timedelta(minutes=m), s, float(rng.randint(90, 110)), rng.randint(1, 9))
            for d in range(3) for m in range(20) for s in ("A", "B") if rng.random() < 0.7]
    df = pl.DataFrame({"t": [r[0] for r in rows], "sym": [r[1] for r in rows], "px": [r[2] for r in rows],
                       "qty": [r[3] for r in rows], "junk": [0] * len(rows)})
    path = os.path.join(tempfile.mkdtemp(), "ticks.parquet")
    df.write_parquet(path)
    got = ns["daily_vwap"](path).collect()
    acc = {}
    for t, s, px, q in rows:
        a = acc.setdefault((t.date(), s), [0.0, 0])
        a[0] += px * q
        a[1] += q
    assert got.height == len(acc)
    for r in got.iter_rows(named=True):
        pv, q = acc[(r["day"], r["sym"])]
        assert abs(r["vwap"] - pv / q) < 1e-9


def t_rolling_vwap(ns):
    import polars as pl
    from datetime import datetime, timedelta
    T0 = datetime(2026, 3, 2, 9)
    tk = pl.DataFrame({"sym": ["A", "B", "A", "A", "B"], "t": [T0 + timedelta(minutes=m) for m in (0, 1, 2, 7, 3)],
                       "px": [10.0, 20, 11, 12, 21], "qty": [1, 1, 2, 1, 3]})
    out = ns["rolling_vwap"](tk)
    got = {(r["sym"], r["t"]): r["vwap5"] for r in out.iter_rows(named=True)}
    assert abs(got[("A", T0 + timedelta(minutes=2))] - 32 / 3) < 1e-12
    assert got[("A", T0 + timedelta(minutes=7))] == 12.0
    assert abs(got[("B", T0 + timedelta(minutes=3))] - (20 + 63) / 4) < 1e-12


def t_summary(ns):
    import pandas as pd
    t = pd.DataFrame({"t": [3, 1, 2, 2], "id": [3, 1, 2, 2], "sym": ["A", "A", "B", "B"], "px": [10.0, 12.0, 5.0, 5.0], "qty": [1, 3, 2, 2]})
    g = ns["summary"](t)
    assert g.loc["A", "n"] == 2 and g.loc["B", "n"] == 1 and abs(g.loc["A", "vwap"] - 46 / 4) < 1e-12


def t_pl_backtest(ns):
    import polars as pl
    for _ in range(50):
        rows = []
        for s in "AB":
            px = 100.0
            for d in range(rng.randint(2, 8)):
                px *= 1 + rng.uniform(-0.02, 0.02)
                rows.append((d, s, px, rng.choice([-1.0, 0.0, 1.0])))
        rng.shuffle(rows)
        df = pl.DataFrame({"date": [r[0] for r in rows], "sym": [r[1] for r in rows], "px": [r[2] for r in rows], "signal": [r[3] for r in rows]})
        cost = 0.001
        out = ns["backtest_all"](df, cost)
        got = {(r["sym"], r["date"]): r["net"] for r in out.iter_rows(named=True)}
        for s in "AB":
            ser = sorted((d, px, sig) for d, sym, px, sig in rows if sym == s)
            prev = 0.0
            for i, (d, px, _) in enumerate(ser):
                pos = ser[i - 1][2] if i else 0.0
                r = px / ser[i - 1][1] - 1 if i else 0.0
                assert abs(got[(s, d)] - (pos * r - cost * abs(pos - prev))) < 1e-12
                prev = pos


TESTS = {
    ("dsa-complexity", "h5"): t_dfs,
    ("dsa-python", "h4"): t_top_k,
    ("dsa-python", "h5"): t_drop_cancelled,
    ("dsa-arrays", "h4"): t_max_profit,
    ("dsa-arrays", "h5"): t_count_subarrays,
    ("dsa-arrays", "h6"): t_rect,
    ("dsa-window", "h4"): t_window_max,
    ("dsa-window", "h5"): t_min_window,
    ("dsa-hashing", "h4"): t_orders,
    ("dsa-hashing", "h6"): t_random_set,
    ("dsa-stacks", "h4"): t_min_stack,
    ("dsa-stacks", "h6"): t_prev_greater,
    ("dsa-linked", "h3"): t_cycle_start,
    ("dsa-linked", "h4"): t_palindrome,
    ("dsa-linked", "h6"): t_reverse_groups,
    ("dsa-trees", "h4"): t_right_side,
    ("dsa-trees", "h5"): t_serialise,
    ("dsa-trees", "h6"): t_kth_bst,
    ("dsa-heaps", "h4"): t_schedule,
    ("dsa-heaps", "h5"): t_bids,
    ("dsa-heaps", "h6"): t_pair_sum,
    ("dsa-graphs", "h4"): t_arbitrage,
    ("dsa-graphs", "h5"): t_dijkstra,
    ("dsa-graphs", "h6"): t_one_break,
    ("dsa-binsearch", "h4"): t_count_between,
    ("dsa-binsearch", "h6"): t_median,
    ("dsa-sorting", "h4"): t_sort_two_keys,
    ("dsa-sorting", "h5"): t_counting_sort,
    ("dsa-sorting", "h6"): t_insert_interval,
    ("dsa-backtracking", "h4"): t_brackets,
    ("dsa-backtracking", "h5"): t_word_search,
    ("dsa-backtracking", "h6"): t_partition,
    ("dsa-dp", "h6"): t_profit_k,
    ("dsa-greedy", "h4"): t_profit_unlimited,
    ("dsa-greedy", "h5"): t_least_interval,
    ("dsa-greedy", "h6"): t_arrows,
    ("dsa-streaming", "h4"): t_book,
    ("dsa-streaming", "h5"): t_feed,
    ("dsa-numpy", "h4"): t_rolling_std,
    ("dsa-numpy", "h5"): t_view,
    ("dsa-numpy", "h6"): t_dd_dates,
    ("dsa-pandas", "h4"): t_fees,
    ("dsa-pandas", "h5"): t_attach_quotes,
    ("dsa-pandas", "h7"): t_bars_groupby,
    ("dsa-polars", "h3"): t_pl_z,
    ("dsa-polars", "h4"): t_daily_vwap,
    ("dsa-polars", "h6"): t_rolling_vwap,
    ("dsa-marketdata", "h4"): t_summary,
    ("dsa-marketdata", "h6"): t_pl_backtest,
}
RUN = {("dsa-python", "h6"), ("dsa-pandas", "h6"), ("linalg", "h9")}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    items = json.load(open(sys.argv[1], encoding="utf-8"))
    fails = n_blocks = n_tested = 0
    keys = set()
    for it in items:
        key = (it["id"], it["key"])
        keys.add(key)
        code = blocks(it["sol"])
        for src in code:
            n_blocks += 1
            for line in src.split(chr(10)):
                if len(line) > 72:
                    print(f"FAIL {key}: a code line is over 72 characters (it scrolls on a phone): {line.strip()[:50]}")
                    fails += 1
            try:
                compile(src, f"{key}", "exec")
            except SyntaxError as e:
                print(f"FAIL {key}: a code block doesn't compile: {e}")
                fails += 1
        for tag in ("p", "li", "ol", "ul", "table", "tr", "td", "th", "b", "i", "code", "pre"):
            if len(re.findall(rf"<{tag}[ >]", it["sol"])) != it["sol"].count(f"</{tag}>"):
                print(f"FAIL {key}: unbalanced <{tag}> tags")
                fails += 1
        defines = any(re.search(r"^(def|class) ", src, re.M) for src in code)
        if defines and key not in TESTS:
            print(f"FAIL {key}: defines a function or class but has no test in verify_models.py")
            fails += 1
        if key in TESTS or key in RUN:
            ns = {"__name__": "model"}
            try:
                for src in code:
                    exec(src, ns)
                if key in TESTS:
                    TESTS[key](ns)
                n_tested += 1
            except Exception as e:
                print(f"FAIL {key}: {type(e).__name__}: {e}")
                fails += 1
    for key in (set(TESTS) | RUN) - keys:
        print(f"FAIL {key}: tested here, but no such model answer")
        fails += 1
    print(f"{len(items)} model answers, {n_blocks} code blocks, {n_tested} run against tests: {'ALL PASS' if not fails else f'{fails} FAILURES'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
