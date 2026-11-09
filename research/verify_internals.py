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
    unchecked = len(cards) - len(named)
    print(f"{len(cards)} cards ({len(named)} with checks, {unchecked} explained only), {len(QUIZ)} quiz questions, {len(found)} design sketches; {ran} checks run on {platform.python_implementation()} {platform.python_version()}")
    for p in problems:
        print("FAIL", p)
    if problems:
        sys.exit(1)
    print("All internals checks pass.")


if __name__ == "__main__":
    main()
