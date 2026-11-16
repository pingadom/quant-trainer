"""Checks every testable claim about Python behaviour in Theo's software-engineering content.

The Python internals cards (www/js/cards-python.js) name a check function for each claim that
can be tested; the knowledge-quiz questions about Python behaviour (www/js/code-quiz.js) are
listed in QUIZ below. This script reads both files, makes sure every check they name exists here,
runs them, and fails on any mismatch. Claims about cost (O(n) against O(1)) are explained on the
cards, not timed: timing tests are flaky. CPython-only details are skipped on other interpreters.

Run: python research/verify_internals.py
"""

import array
import bisect
import dis
import gc
import heapq
import itertools
import platform
import queue
import random
import re
import sys
import threading
import time
import weakref
from collections import OrderedDict, deque
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CPYTHON = platform.python_implementation() == "CPython"
BITS64 = sys.maxsize > 2**32


def py_list_layout():
    big, small = "x" * 100_000, 1
    a, b = [big] * 10, [small] * 10
    # a list holds references: the same object, and the list's size doesn't depend on the items
    assert a[0] is big and a[3] is a[7]
    assert sys.getsizeof(a) == sys.getsizeof(b)


def py_list_append():
    # over-allocation: the size changes in steps, not on every append
    a, sizes = [], []
    for i in range(200):
        a.append(i)
        sizes.append(sys.getsizeof(a))
    changes = sum(1 for x, y in zip(sizes, sizes[1:]) if x != y)
    assert changes < 40, changes


def py_dict_layout():
    d = {}
    for k in ["c", "a", "d", "b", "e"]:
        d[k] = 1
    del d["d"]
    d["f"] = 1
    d["a"] = 2  # re-assigning keeps the position
    assert list(d) == ["c", "a", "b", "e", "f"]
    del d["c"]
    d["c"] = 3  # deleting and re-inserting moves it to the end
    assert list(d) == ["a", "b", "e", "f", "c"]


def py_dict_keys():
    d = {(1, "x"): 1}
    assert d[(1, "x")] == 1
    try:
        d[[1, 2]] = 1
    except TypeError:
        pass
    else:
        raise AssertionError("a list was accepted as a key")
    try:
        d[(1, [2])] = 1
    except TypeError:
        pass
    else:
        raise AssertionError("a tuple holding a list was accepted as a key")


def py_set():
    s = set(range(1000))
    assert 500 in s and 1000 not in s
    s.add(5)
    s.discard(7)
    assert len(s) == 999  # membership and size; never its order


def py_deque():
    d = deque([2, 3])
    d.appendleft(1)
    d.append(4)
    assert list(d) == [1, 2, 3, 4]
    assert d.popleft() == 1 and d.pop() == 4
    assert d[1] == 3


def py_deque_maxlen():
    d = deque([1, 2, 3], maxlen=3)
    d.append(4)
    assert list(d) == [2, 3, 4]
    d.appendleft(0)
    assert list(d) == [0, 2, 3]


def heap_ok(h):
    return all(h[i] <= h[c] for i in range(len(h)) for c in (2 * i + 1, 2 * i + 2) if c < len(h))


def py_heapq():
    rng = random.Random(1)
    h = []
    for _ in range(500):
        heapq.heappush(h, rng.randint(0, 1000))
        if rng.random() < 0.3:
            heapq.heappop(h)
        assert heap_ok(h) and h[0] == min(h)
    xs = [rng.random() for _ in range(300)]
    heapq.heapify(xs)
    assert heap_ok(xs)


def py_heapq_max():
    prices = [101, 99, 105, 100, 103]
    h = []
    for p in prices:
        heapq.heappush(h, -p)
    assert [-heapq.heappop(h) for _ in prices] == sorted(prices, reverse=True)


def py_heapq_ties():
    class Order:  # deliberately not comparable
        def __init__(self, name):
            self.name = name

    h, counter = [], itertools.count()
    for name, prio in [("a", 5), ("b", 1), ("c", 5), ("d", 1), ("e", 5)]:
        heapq.heappush(h, (prio, next(counter), Order(name)))
    assert [heapq.heappop(h)[2].name for _ in range(5)] == ["b", "d", "a", "c", "e"]


def py_heapq_delete():
    h, live = [], {}
    for oid, price in [(1, 100), (2, 99), (3, 101), (4, 98)]:
        heapq.heappush(h, (price, oid))
        live[oid] = price
    del live[4]  # cancel the best order: just forget it
    del live[2]
    while h and h[0][1] not in live:  # skip stale entries when they reach the top
        heapq.heappop(h)
    assert h[0] == (100, 1)


def py_bisect():
    rng = random.Random(2)
    a = []
    for _ in range(300):
        bisect.insort(a, rng.randint(0, 50))
        assert all(x <= y for x, y in zip(a, a[1:]))
    assert bisect.bisect_left([1, 2, 2, 3], 2) == 1 and bisect.bisect_right([1, 2, 2, 3], 2) == 3


def py_sorted_stdlib():
    assert sys.version_info >= (3, 10)
    names = sys.stdlib_module_names
    assert "sortedcontainers" not in names
    assert {"heapq", "bisect", "collections"} <= names


def py_sort():
    recs = [(3, "a"), (1, "b"), (3, "c"), (1, "d"), (2, "e"), (3, "f")]
    out = sorted(recs, key=lambda r: r[0])
    assert out == [(1, "b"), (1, "d"), (2, "e"), (3, "a"), (3, "c"), (3, "f")]  # stable


def py_str_join():
    parts = [str(i) for i in range(1000)]
    s = ""
    for p in parts:
        s += p
    assert "".join(parts) == s
    assert isinstance("", str) and not hasattr("", "append")  # immutable: no in-place append


def py_ordereddict():
    cache = OrderedDict()
    for k in "abc":
        cache[k] = k
    cache.move_to_end("a")  # used: now most recent
    assert cache.popitem(last=False)[0] == "b"  # least recently used goes first
    assert list(cache) == ["c", "a"]


def py_int_size():
    assert array.array("q").itemsize == 8
    if CPYTHON and BITS64:
        assert sys.getsizeof(1) == 28
        assert sys.getsizeof(10**6) == 28


def py_small_int():
    if CPYTHON:
        assert int("256") is int("256")
        assert int("257") is not int("257")
        assert int("-5") is int("-5") and int("-6") is not int("-6")
    assert int("257") == int("257")


def py_slots():
    class Plain:
        def __init__(self):
            self.price = 1

    class Slotted:
        __slots__ = ("price", "qty")

        def __init__(self):
            self.price = 1

    p, s = Plain(), Slotted()
    assert hasattr(p, "__dict__") and not hasattr(s, "__dict__")
    try:
        s.other = 1
    except AttributeError:
        pass
    else:
        raise AssertionError("a slotted instance accepted a new attribute")


def py_contiguous():
    n = 10_000
    lst, arr = list(range(1000, 1000 + n)), array.array("q", range(1000, 1000 + n))
    if CPYTHON and BITS64:
        list_total = sys.getsizeof(lst) + sum(sys.getsizeof(x) for x in lst)
        assert list_total > 4 * sys.getsizeof(arr)
    assert arr.itemsize * n <= sys.getsizeof(arr) < 1.2 * arr.itemsize * n + 200  # raw values, little overhead


def py_gil_atomic():
    def f():
        x = 0
        x += 1
        return x

    ops = [i.opname for i in dis.get_instructions(f)]
    i = ops.index("LOAD_CONST", ops.index("STORE_FAST"))  # the `1` of `x += 1`
    assert ops[i - 1].startswith("LOAD_FAST"), ops
    assert ops[i + 1] in ("BINARY_OP", "INPLACE_ADD"), ops
    assert ops[i + 2] == "STORE_FAST", ops


def py_queue():
    q, out = queue.Queue(), []

    def consumer():
        while (item := q.get()) is not None:
            out.append(item)

    t = threading.Thread(target=consumer)
    t.start()
    for i in range(100):
        q.put(i)
    q.put(None)
    t.join(5)
    assert out == list(range(100))  # FIFO, nothing lost


def py_memory():
    class Node:
        pass

    if CPYTHON:
        freed = []
        a = Node()
        weakref.finalize(a, freed.append, "a")
        del a  # last reference gone: freed at once by reference counting
        assert freed == ["a"]
    b, c = Node(), Node()
    b.other, c.other = c, b  # a cycle: counting alone never frees it
    r = weakref.ref(b)
    del b, c
    gc.collect()
    assert r() is None


def py_generators():
    def prices():
        p = 100
        while True:  # endless: only works because it's lazy
            p += 1
            yield p

    g = prices()
    assert list(itertools.islice(g, 3)) == [101, 102, 103]
    assert next(g) == 104


def py_time():
    info = time.get_clock_info("monotonic")
    assert info.monotonic and not info.adjustable
    a = time.monotonic()
    b = time.monotonic()
    assert b >= a
    assert time.get_clock_info("perf_counter").monotonic


def py_list_pop0():
    a = [1, 2, 3]
    assert a.pop(0) == 1 and a == [2, 3]


# Quiz questions about Python behaviour, with the check for each.
QUIZ = {
    "py-dict-order": py_dict_layout,
    "py-maxheap": py_heapq_max,
    "py-insort": py_bisect,
    "py-plus-atomic": py_gil_atomic,
    "py-deque-maxlen": py_deque_maxlen,
    "py-slots-q": py_slots,
    "mem-refcount": py_memory,
    "py-pop0": py_list_pop0,
}


def sketches():
    """The Python sketch in each design problem's model answer, by problem id."""
    src = (ROOT / "www/js/design-problems.js").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"id: '(d-[a-z0-9-]+)'.*?sketch: `(.*?)`", src, re.S):
        out[m.group(1)] = m.group(2).replace("\\\\", "\\")
    return out


def as_class(code, name="Thing"):
    """Wrap a method sketch (def ...(self, ...)) in a class so it can be run."""
    return f"class {name}:\n" + "\n".join("    " + line for line in code.split("\n"))


def run(code):
    env = {"deque": deque, "OrderedDict": OrderedDict, "heapq": heapq, "time": time}
    exec(code, env)
    return env


def sketch_order_book(code):
    env = run(code)
    side = env["Side"](is_bid=True)
    O = env["Order"]

    def order(price, live=True):
        o = O()
        o.price, o.live = price, live
        side.levels.setdefault(price, deque()).append(o)
        heapq.heappush(side.heap, side.sign * price)
        return o

    order(100)
    top = order(102)
    order(101, live=False)
    assert side.best() == 102
    top.live = False  # cancelled: the level empties lazily
    assert side.best() == 100  # 102 dropped, and 101 held only a cancelled order
    assert 102 not in side.levels


def sketch_feed_handler(code):
    env = run(as_class(code, "Handler"))
    H = env["Handler"]
    h = H()
    h.next_seq, h.pending, h.recovering, h.applied, h.stale = 1, {}, False, [], None
    h.apply = lambda m: h.applied.append(m.seq)

    def start(a, b):
        h.recovering = True

    h.start_recovery = start
    h.publish_stale = lambda v: setattr(h, "stale", v)

    class M:
        def __init__(self, seq):
            self.seq = seq

    for s in [1, 2, 2, 4, 5, 1, 3, 6]:
        h.on_message(M(s))
    assert h.applied == [1, 2, 3, 4, 5, 6], h.applied
    assert not h.pending and not h.recovering and h.stale is False


def sketch_lru(code):
    env = run(code)
    c = env["LRUCache"](2)
    c.put("a", 1)
    c.put("b", 2)
    assert c.get("a") == 1
    c.put("c", 3)  # evicts b, the least recently used
    assert c.get("b") is None and c.get("a") == 1 and c.get("c") == 3


def sketch_rate_limiter(code):
    env = run(code)
    r = env["RateLimiter"](3)
    assert [r.try_send(t) for t in (0.0, 0.1, 0.2, 0.3)] == [True, True, True, False]
    assert r.try_send(1.05) is True  # the send at 0.0 has left the window
    assert r.try_send(1.06) is False


def sketch_risk_check(code):
    env = run(as_class(code, "Risk"))
    r = env["Risk"]()

    class L:
        max_qty, collar, max_pos = 100, 5, 150

    class O:
        def __init__(self, side, qty, price, symbol="X"):
            self.side, self.qty, self.price, self.symbol = side, qty, price, symbol

    r.killed, r.lim = False, L
    r.ref_price, r.position, r.open_buy, r.open_sell = {"X": 50}, {"X": 0}, {"X": 0}, {"X": 0}
    assert r.check(O("BUY", 10, 50)) is None
    assert r.check(O("BUY", 101, 50)) == "size"
    assert r.check(O("BUY", 10, 56)) == "price"
    assert r.check(O("BUY", 10, 50, "Y")) == "price"  # no reference price: fail closed
    r.open_buy["X"] = 100
    assert r.check(O("BUY", 60, 50)) == "position"  # open orders count towards the limit
    assert r.check(O("SELL", 60, 50)) is None
    r.killed = True
    assert r.check(O("BUY", 1, 50)) == "kill switch"


def sketch_best_venue(code):
    env = run(as_class(code, "Best"))
    b = env["Best"]()
    b.quotes, b.max_age = [None] * 5, 1.0
    b.on_quote(0, 99, 101, 10.0)
    b.on_quote(1, 100, 102, 10.1)
    assert (b.best_bid, b.best_ask) == (100, 101)
    b.on_quote(2, 98, 103, 11.05)  # venue 0's quote (time 10.0) is now stale
    assert (b.best_bid, b.best_ask) == (100, 102)


SKETCHES = {
    "d-order-book": sketch_order_book,
    "d-feed-handler": sketch_feed_handler,
    "d-lru": sketch_lru,
    "d-rate-limiter": sketch_rate_limiter,
    "d-risk-check": sketch_risk_check,
    "d-best-venue": sketch_best_venue,
}


# ---- Tech screening code reviews: each planted bug breaks the original; the improved version fixes it.

def screening_snippets():
    """(original, improved) Python source for each code-review exercise, by id."""
    src = (ROOT / "www/js/screening-content.js").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"id: '([a-z0-9-]+)', title:.*?code: `(.*?)`,.*?improved: `(.*?)`,", src, re.S):
        out[m.group(1)] = tuple(x.replace("\\\\", "\\") for x in (m.group(2), m.group(3)))
    return out


class FakeTime:
    """Stands in for the time module: a clock you move by hand, and a sleep that just advances it."""

    def __init__(self):
        self.now = 1000.0

    def time(self):
        return self.now

    monotonic = time

    def sleep(self, s):
        self.now += s


def load(code, **globs):
    ns = {"__name__": "snippet"}
    exec(code, ns)
    ns.update(globs)  # replace modules the snippet imported, e.g. a fake clock
    return ns


def scr_pnl(orig, fixed):
    fills = [{"trader": "ann", "side": "BUY", "qty": 10, "price": 100.0, "mark": 101.5},
             {"trader": "bob", "side": "SELL", "qty": 5, "price": 50.0, "mark": 49.0}]
    f = load(orig)["pnl_by_trader"]
    first, _ = f(fills)
    first = dict(first)
    second, _ = f(fills)
    assert second["ann"] == 2 * first["ann"], "the mutable default should accumulate across calls"
    g = load(fixed)["pnl_by_trader"]
    assert g(fills) == g(fills) == {"ann": Decimal("15.0"), "bob": Decimal("5.0")}
    try:
        g([{"trader": "x", "side": "buyy", "qty": 1, "price": 1, "mark": 2}])
    except ValueError:
        pass
    else:
        raise AssertionError("the fixed version should reject an unknown side")
    assert load(fixed)["format_report"]({"b": Decimal("1.5"), "a": Decimal("-2")}) == "a: -2.00\nb: 1.50\n"


def scr_cache(orig, fixed):
    clock, calls = FakeTime(), []

    def fetch(sym):
        calls.append(sym)
        return 100 + len(calls)

    old = load(orig, time=clock)["PriceCache"](fetch, ttl=1.0)
    old.get("X")
    clock.now += 5
    old.get("X")
    assert len(calls) == 1, "the reversed comparison should never refresh"
    calls.clear()
    new = load(fixed)["PriceCache"](fetch, ttl=1.0, clock=clock.time)
    a = new.get("X")
    assert new.get("X") == a and len(calls) == 1  # fresh hit
    clock.now += 5
    assert new.get("X") != a and len(calls) == 2  # stale: refreshed


def scr_order(orig, fixed):
    ok = {"side": "BUY", "qty": 1000, "price": 1.15}
    old = load(orig)["check_order"]
    assert "price not on tick" in old({"side": "BUY", "qty": 5, "price": 1.15}), "float modulo should reject 1.15"
    assert "bad quantity" in old(ok), "the original should reject exactly the maximum"
    new = load(fixed)["check_order"]
    assert new(ok) == []
    assert new({"side": "BUY", "qty": 5, "price": 1.155}) == ["price not on tick"]
    assert "bad quantity" in new({"side": "BUY", "qty": True, "price": 1.0})
    assert "bad quantity" in new({"side": "BUY", "qty": 10.5, "price": 1.0})
    assert "bad quantity" in new({"side": "BUY", "qty": 1001, "price": 1.0})


def scr_moving(orig, fixed):
    old = load(orig)["MovingAverage"](2)
    out = [old.on_trade(p) for p in (1, 2, 3)]
    assert out[-1] == 2.0, "the original keeps n + 1 prices"
    rng = random.Random(5)
    for n in (1, 3, 7):
        new = load(fixed)["MovingAverage"](n)
        prices = []
        for _ in range(300):
            p = rng.uniform(90, 110)
            prices.append(p)
            got, want = new.on_trade(p), sum(prices[-n:]) / len(prices[-n:])
            assert abs(got - want) < 1e-9, (n, got, want)


def scr_retry(orig, fixed):
    class Gateway:
        def __init__(self, exc):
            self.exc, self.sent, self.calls = exc, [], 0

        def send(self, order):
            self.calls += 1
            self.sent.append(order["client_id"])  # it reaches the exchange…
            if self.calls == 1:
                raise self.exc("reply lost")  # …but the reply is lost
            return "ack"

        def status(self, cid):
            return "ack" if cid in self.sent else None

    clock = FakeTime()
    g = Gateway(TimeoutError)
    load(orig, time=clock)["send_with_retry"](g, {"client_id": "A1"})
    assert g.sent == ["A1", "A1"], "the original should send the order twice"
    ns = load(fixed, time=clock)
    g = Gateway(ns["Transient"])
    assert ns["send_with_retry"](g, {"client_id": "A1"}) == "ack"
    assert g.sent == ["A1"], "the fixed version should find the order instead of resending"

    class Down:
        calls = 0

        def send(self, order):
            Down.calls += 1
            raise ns["Transient"]("down")

        def status(self, cid):
            return None

    try:
        ns["send_with_retry"](Down(), {"client_id": "B"}, attempts=3)
    except ns["Transient"]:
        pass
    assert Down.calls == 3, "the fixed version should give up after a bounded number of attempts"


def scr_loader(orig, fixed):
    import os
    import tempfile
    rows = 'date,account,symbol,qty,price\n2026-11-13,"Smith, J",ACME,100,10.5\n2026-11-13,FUND1,XYZ,50,20.25\n'
    fd, path = tempfile.mkstemp(suffix=".csv")
    try:
        with os.fdopen(fd, "w", newline="") as f:
            f.write(rows)
        assert len(load(orig)["load_trades"](path)) == 1, "the comma inside quotes should drop a row"
        got = load(fixed)["load_trades"](path)
        assert len(got) == 2 and got[0]["account"] == "Smith, J" and got[1]["price"] == Decimal("20.25")
    finally:
        os.remove(path)


SCREENING = {
    "pnl-report": scr_pnl, "price-cache": scr_cache, "order-check": scr_order,
    "moving-average": scr_moving, "order-retry": scr_retry, "trade-loader": scr_loader,
}



# ---------------------------------------------------------------- spotting drills (spotting-content.js)
# For each snippet with planted lines, SPOT[id](ns) must fail (raise or assert) on the original and
# pass on the fix; a clean snippet must pass as it is. Each test gets a fresh namespace.

def spotting_items():
    """{id: (code, bad_lines, fix)} and [(id, code, out)] from spotting-content.js."""
    src = (ROOT / "www/js/spotting-content.js").read_text(encoding="utf-8")
    items = {}
    pat = r"\{ id: '([a-z0-9-]+)', fam: '[a-z]+', ctx: '.*?',\s*code: `(.*?)`,\s*bad: \[([0-9, ]*)\],.*?fix: (?:`(.*?)`|'') \}"
    for m in re.finditer(pat, src, re.S):
        bad = [int(x) for x in m.group(3).replace(" ", "").split(",") if x]
        items[m.group(1)] = (m.group(2), bad, m.group(4) or "")
    traces = [(m.group(1), m.group(2), m.group(3).replace("\\'", "'"))
              for m in re.finditer(r"\{ id: '(t-[a-z0-9-]+)', fam: '[a-z]+', code: `(.*?)`, out: ['\"](.*?)['\"], why:", src, re.S)]
    return items, traces


def _race(take_ids, threads=8, per=5000, tries=5):
    """True if concurrent take() calls ever hand out a duplicate id."""
    import threading
    old = sys.getswitchinterval()
    sys.setswitchinterval(1e-6)
    try:
        for _ in range(tries):
            out, gen = [], take_ids()
            def work():
                local = [gen.take("s") for _ in range(per)]
                out.extend(local)
            ts = [threading.Thread(target=work) for _ in range(threads)]
            for t in ts:
                t.start()
            for t in ts:
                t.join()
            if len(set(out)) < len(out):
                return True
        return False
    finally:
        sys.setswitchinterval(old)


def spot_last_k_average(ns):
    assert ns["last_k_average"]([1, 2, 3, 4], 2) == 3.5


def spot_fillable_qty(ns):
    assert ns["fillable_qty"]([(100, 5), (101, 3), (102, 9)], 101) == 8


def spot_simple_returns(ns):
    r = ns["returns"]([100, 110, 99])
    assert len(r) == 2 and abs(r[0] - 0.1) < 1e-12 and abs(r[1] + 0.1) < 1e-12


def spot_avg_fill_price(ns):
    assert ns["avg_price"]([]) is None
    assert ns["avg_price"]([{"qty": 1, "price": 10}, {"qty": 3, "price": 14}]) == 13


def spot_spread(ns):
    assert ns["spread"]([], [101]) is None and ns["spread"]([99, 100], [101, 102]) == 1


def spot_limit_zero(ns):
    f = ns["within_limit"]
    assert f(5, 0) is False and f(0, 0) is True and f(5, None) is True and f(5, 10) is True


def spot_default_dict(ns):
    ns["record_fill"]("a", 1)
    assert ns["record_fill"]("b", 2) == {"b": [2]}


def spot_grid_alias(ns):
    assert ns["positions_grid"]([(0, 0, 5)], 2, 1) == [[5], [0]]


def spot_shallow_copy(ns):
    y = {"X": {"pnl": 7, "pos": 1}}
    t = ns["start_of_day"](y)
    assert t["X"]["pnl"] == 0 and y["X"]["pnl"] == 7


def spot_remove_while_iterating(ns):
    orders = [{"status": s} for s in ["live", "cancelled", "cancelled", "live"]]
    assert [o["status"] for o in ns["drop_cancelled"](orders)] == ["live", "live"]


def spot_expire_quotes(ns):
    q = {"A": {"t": 0}, "B": {"t": 9}, "C": {"t": 1}}
    ns["expire"](q, 10, 5)
    assert q == {"B": {"t": 9}}


def spot_float_equal(ns):
    assert ns["notional_matches"]([(1, 0.1), (2, 0.1)], 0.3)
    assert not ns["notional_matches"]([(1, 0.1)], 0.2)


def spot_split_fee(ns):
    for fee in range(0, 200):
        for n in range(1, 8):
            parts = ns["split_fee"](fee, n)
            assert len(parts) == n and sum(parts) == fee and max(parts) - min(parts) <= 1, (fee, n, parts)


def spot_mid_floor(ns):
    assert ns["mid_ticks"](100, 101) == 100.5


def spot_wall_clock_latency(ns):
    class Clock:  # the wall clock steps back 2 s (an NTP correction) during the send
        wall, mono = 1000.0, 50.0
        def time(self):
            return self.wall
        def perf_counter(self):
            return self.mono
        monotonic = perf_counter
    c = Clock()
    ns["time"] = c
    def send(order):
        c.wall -= 2.0
        c.mono += 0.003
    lat = ns["timed_send"](send, {})
    assert abs(lat - 0.003) < 1e-9, lat


def spot_market_hours_tz(ns):
    from datetime import datetime, timezone
    # 07:30 UTC in November is 08:30 in Amsterdam: open. 16:00 UTC is 17:00 there: closed.
    assert ns["market_open"](datetime(2026, 11, 16, 7, 30, tzinfo=timezone.utc)) is True
    assert ns["market_open"](datetime(2026, 11, 16, 16, 0, tzinfo=timezone.utc)) is False


def spot_string_dates(ns):
    trades = [{"ts": "10/12/2026 08:00"}, {"ts": "15/11/2026 10:00"}]
    assert ns["after"](trades, "16/11/2026 09:30") == [trades[0]]


def spot_bare_except(ns):
    import contextlib
    import io
    with contextlib.redirect_stdout(io.StringIO()):
        assert ns["load_prices"]([{"sym": "A", "px": "1.5"}, {"sym": "B", "px": "n/a"}]) == {"A": 1.5}
    try:
        ns["load_prices"]([{"sym": "A", "price": "1.5"}])   # the column was renamed
    except KeyError:
        return
    raise AssertionError("a renamed column was silently ignored")


def spot_half_done(ns):
    pos = {"A": 10}
    try:
        ns["move_position"](pos, "A", "B", 4)
    except KeyError:
        pass
    assert pos == {"A": 10}, pos
    pos = {"A": 10, "B": 0}
    ns["move_position"](pos, "A", "B", 4)
    assert pos == {"A": 6, "B": 4}


def spot_zero_price(ns):
    assert ns["get_price"]({}, "X") is None and ns["get_price"]({"X": 5}, "X") == 5


def spot_open_no_with(ns):
    closed = []
    class F:
        def __init__(self, *a):
            self.lines = ["a\n", "b\n"]
        def __iter__(self):
            return iter(self.lines)
        def close(self):
            closed.append(1)
        def __enter__(self):
            return self
        def __exit__(self, *a):
            self.close()
    ns["open"] = F
    assert ns["count_lines"]("x") == 2 and closed == [1]


def spot_lock_no_finally(ns):
    class Bad:
        def apply(self, order):
            raise ValueError("bad order")
    try:
        ns["update"](Bad(), {})
    except ValueError:
        pass
    assert not ns["lock"].locked(), "the lock was left held"


class _Counted:
    eq = 0
    def __init__(self, v):
        self.v = v
    def __eq__(self, o):
        _Counted.eq += 1
        return self.v == o.v
    def __hash__(self):
        return hash(self.v)


def spot_in_list(ns):
    seen = [_Counted(i) for i in range(400)]
    today = [_Counted(i) for i in range(300, 700)]
    _Counted.eq = 0
    out = ns["new_ids"](today, seen)
    assert [x.v for x in out] == list(range(400, 700))
    assert _Counted.eq < 2000, f"{_Counted.eq} comparisons for 400 x 400 ids"


def spot_pop_front(ns):
    class Queue(list):  # counts removals from the front, each of which shifts the whole list
        front = 0
        def pop(self, i=-1):
            if i == 0 and len(self) > 1:
                Queue.front += 1
            return super().pop(i)
    got = []
    ns["process"](Queue(range(1000)), got.append)
    assert got == list(range(1000))
    assert Queue.front == 0, f"{Queue.front} pops from the front of a list: O(n) each"


def spot_sort_in_loop(ns):
    import time as _t
    assert ns["running_high"]([3, 1, 4, 1, 5]) == [3, 3, 4, 4, 5]
    t0 = _t.perf_counter()
    ns["running_high"](list(range(6000, 0, -1)))
    took = _t.perf_counter() - t0
    assert took < 0.05, f"{took:.3f} s for 6,000 ticks"


def spot_id_race(ns):
    assert not _race(ns["OrderIds"]), "duplicate order ids"


def spot_cache_race(ns):
    import threading
    import time as _t
    calls = []
    def load(sym):
        calls.append(sym)
        _t.sleep(0.02)
        return {"sym": sym}
    ts = [threading.Thread(target=ns["get_instrument"], args=("ASML", load)) for _ in range(8)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    assert calls == ["ASML"], f"loaded {len(calls)} times"


def spot_retry_duplicate(ns):
    received = []
    def send(order):  # the exchange gets it, but the ack is lost the first time
        received.append(order["id"])
        if len(received) == 1:
            raise TimeoutError
        return "ack"
    status = lambda oid: "ack" if oid in received else None
    f = ns["send_with_retry"]
    try:
        f(send, {"id": "c1"}, status)
    except TypeError:
        f(send, {"id": "c1"})   # the original takes no status function
    assert received == ["c1"], f"sent {len(received)} times"


def spot_retry_forever(ns):
    class Stop(Exception):
        pass
    slept = []
    class T:
        def sleep(self, s):
            slept.append(s)
            if len(slept) > 100:
                raise Stop
    ns["time"] = T()
    def down():
        raise ConnectionError
    try:
        ns["connect"](down)
    except Stop:
        raise AssertionError("retried more than 100 times")
    except ConnectionError:
        pass
    assert len(slept) <= 10 and slept[-1] > slept[0], slept


def spot_sell_sign(ns):
    assert ns["position_after"]([("BUY", 5), ("SELL", 3)]) == 2


def spot_is_equal(ns):
    assert ns["hit_max_size"](500, int("500")) is True and ns["hit_max_size"](10, 500) is False


def spot_late_binding(ns):
    a = ns["make_alerts"](["ASML", "SHEL"])
    assert a[0](10) == "ASML at 10" and a[1](11) == "SHEL at 11"


def spot_and_or(ns):
    f = ns["should_quote"]
    assert f(1, 9, 2, 5) is False and f(1, 1, 2, 5) is True


def spot_clean_vwap(ns):
    assert ns["vwap"]([]) is None and ns["vwap"]([(1, 10), (3, 14)]) == 13


def spot_clean_window_max(ns):
    import random as _r
    rng = _r.Random(3)
    for _ in range(200):
        a = [rng.randint(0, 9) for _ in range(rng.randint(1, 12))]
        k = rng.randint(1, len(a))
        assert ns["rolling_max"](a, k) == [max(a[i:i + k]) for i in range(len(a) - k + 1)]


def spot_clean_net(ns):
    assert ns["net_position"]([("BUY", 5), ("SELL", 3), ("SELL", 4)]) == -2
    try:
        ns["net_position"]([("SHORT", 1)])
    except KeyError:
        return
    raise AssertionError("an unknown side should raise")


SPOT = {name[5:].replace("_", "-"): fn for name, fn in list(globals().items()) if name.startswith("spot_") and callable(fn)}


def check_spotting():
    """Problems found, and the number of checks run."""
    items, traces = spotting_items()
    problems, ran = [], 0
    if len(items) < 30 or len(traces) < 10:
        problems.append(f"only found {len(items)} spotting snippets and {len(traces)} traces")
    for sid in set(items) | set(SPOT):
        if sid not in items or sid not in SPOT:
            problems.append(f"spotting {sid}: {'no test here' if sid not in SPOT else 'not found in spotting-content.js'}")
            continue
        code, bad, fix = items[sid]
        n = code.count("\n") + 1
        if any(not 1 <= b <= n for b in bad):
            problems.append(f"spotting {sid}: flagged line out of range {bad}")
        if bad and not fix:
            problems.append(f"spotting {sid}: planted lines but no fix")
        try:
            SPOT[sid](load(code))
            ok = True
        except Exception:
            ok = False
        if bad and ok:
            problems.append(f"spotting {sid}: the original passes its test, so the planted bug isn't real")
        if not bad and not ok:
            problems.append(f"spotting {sid}: the 'clean' snippet fails its test")
        if bad:
            try:
                SPOT[sid](load(fix))
            except Exception as e:
                problems.append(f"spotting {sid}: the fix fails: {type(e).__name__}: {e}")
        ran += 1
    import contextlib
    import io
    for tid, code, out in traces:
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                exec(code, {"__name__": "trace"})
        except Exception as e:
            problems.append(f"trace {tid} raised {type(e).__name__}")
            continue
        if buf.getvalue().strip() != out:
            problems.append(f"trace {tid}: prints {buf.getvalue().strip()!r}, the app says {out!r}")
        ran += 1
    return problems, ran, len(items), len(traces)


def main():
    cards_src = (ROOT / "www/js/cards-python.js").read_text(encoding="utf-8")
    quiz_src = (ROOT / "www/js/code-quiz.js").read_text(encoding="utf-8")
    cards = re.findall(r"C\('([a-z0-9-]+)',", cards_src)
    named = re.findall(r"'(py_[a-z0-9_]+)'\)", cards_src)
    problems, ran = [], 0
    if len(cards) < 25:
        problems.append(f"only found {len(cards)} cards in cards-python.js")
    for name in named:
        fn = globals().get(name)
        if not callable(fn):
            problems.append(f"card check {name} is not defined here")
            continue
        try:
            fn()
            ran += 1
        except AssertionError as e:
            problems.append(f"card check {name} failed: {e}")
    for qid, fn in QUIZ.items():
        if f"Q('{qid}'" not in quiz_src:
            problems.append(f"quiz question {qid} not found in code-quiz.js")
            continue
        try:
            fn()
            ran += 1
        except AssertionError as e:
            problems.append(f"quiz {qid} ({fn.__name__}) failed: {e}")
    found = sketches()
    for pid in set(found) | set(SKETCHES):
        if pid not in SKETCHES or pid not in found:
            problems.append(f"design sketch {pid}: {'no test here' if pid not in SKETCHES else 'not found in design-problems.js'}")
            continue
        try:
            SKETCHES[pid](found[pid])
            ran += 1
        except Exception as e:  # a sketch that doesn't even run is a failure too
            problems.append(f"design sketch {pid} failed: {type(e).__name__}: {e}")
    snippets = screening_snippets()
    for eid in set(snippets) | set(SCREENING):
        if eid not in SCREENING or eid not in snippets:
            problems.append(f"screening {eid}: {'no test here' if eid not in SCREENING else 'not found in screening-content.js'}")
            continue
        try:
            SCREENING[eid](*snippets[eid])
            ran += 1
        except Exception as e:
            problems.append(f"screening {eid} failed: {type(e).__name__}: {e}")
    sp_problems, sp_ran, n_spot, n_trace = check_spotting()
    problems += sp_problems
    ran += sp_ran
    unchecked = len(cards) - len(named)
    print(f"{len(cards)} cards ({len(named)} with checks, {unchecked} explained only), {len(QUIZ)} quiz questions, {len(found)} design sketches, {len(snippets)} code-review snippets, {n_spot} spotting snippets and {n_trace} traces; {ran} checks run on {platform.python_implementation()} {platform.python_version()}")
    for p in problems:
        print("FAIL", p)
    if problems:
        sys.exit(1)
    print("All internals checks pass.")


if __name__ == "__main__":
    main()
