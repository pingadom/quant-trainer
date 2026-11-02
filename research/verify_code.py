"""Cross-checks the coding problems (www/js/code-problems.js) in Python.

For every problem it runs, on every test case exported by tests/export-code.js:
  1. the Python reference solution shown in the app, against the expected outputs (hand-written
     for the listed tests, from the JavaScript reference for the random and large ones), so the
     two references must agree;
  2. a brute-force version written here a different, slower way (skipping the large cases), so a
     shared misreading of the task in both references would still be caught;
  3. for the debugging problems, the buggy starter code, which must fail at least one case.

    node tests/export-code.js > code.json && python research/verify_code.py code.json
"""
import argparse
import datetime
import json
import re
import sys
from collections import Counter


def snake(s):
    return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s).lower()


def norm(x):
    if isinstance(x, tuple):
        return [norm(v) for v in x]
    if isinstance(x, list):
        return [norm(v) for v in x]
    return x


def same(a, b):
    if b is None:
        return a is None
    if isinstance(b, bool) or isinstance(a, bool):
        return a is b
    if isinstance(b, (int, float)):
        return isinstance(a, (int, float)) and abs(a - b) <= 1e-6 * max(1, abs(b))
    if isinstance(b, list):
        return isinstance(a, list) and len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    return a == b


def run(impl, kind, case):
    if kind == 'fn':
        return norm(impl(*json.loads(json.dumps(case['args']))))
    obj = impl(*json.loads(json.dumps(case['init'])))
    return [norm(getattr(obj, snake(op[0]))(*op[1:])) for op in json.loads(json.dumps(case['ops']))]


# ---------------------------------------------------------------- brute-force versions
class WorstTrade:
    def __init__(self):
        self.trades, self.value = [], {}

    def on_trade(self, tid, inst, side, price, volume):
        self.trades.append((tid, inst, side, price))

    def on_price(self, inst, v):
        self.value[inst] = v

    def worst_trade(self, inst):
        if inst not in self.value:
            return 'NO BAD TRADES'
        v, worst = self.value[inst], None
        for tid, i, side, p in self.trades:
            pnl = v - p if side == 'BUY' else p - v
            if i == inst and pnl < 0 and (worst is None or pnl <= worst[0]):
                worst = (pnl, tid)
        return worst[1] if worst else 'NO BAD TRADES'


class Checkout:
    def __init__(self):
        self.lines = {}

    def _find(self, c):
        for line, q in self.lines.items():
            for k, (cc, _) in enumerate(q):
                if cc == c:
                    return q, k
        return None, None

    def enter(self, c, line, items):
        self.lines.setdefault(line, []).append([c, items])

    def change(self, c, items):
        q, k = self._find(c)
        if q is None:
            return []
        if items == 0:
            q.pop(k)
            return [c]
        if items > q[k][1]:
            q.append([c, items])
            q.pop(k)
        else:
            q[k][1] = items
        return []

    def serve(self, line, n):
        q, out = self.lines.get(line, []), []
        while q and n > 0:
            if q[0][1] <= n:
                n -= q[0][1]
                out.append(q.pop(0)[0])
            else:
                q[0][1] -= n
                n = 0
        return out

    def serve_all(self):
        return [c for line in sorted(self.lines) for c in self.serve(line, 1)]


class TicketBot:
    def __init__(self, wishes):
        self.wishes = [list(w) + [False] for w in wishes]
        self.parts = {}

    def packet(self, msg, value):
        self.parts.setdefault(msg, []).append(value)
        if len(self.parts[msg]) != 5:
            return None
        a, v, p, c, s = self.parts[msg]
        for w in self.wishes:
            if w[:2] == [a, v] and not w[5] and p <= w[2] and c >= w[3] and s >= w[4]:
                w[5] = True
                return [msg, w[4]]
        return None


class LogMonitor:
    def __init__(self):
        self.logs = []

    def log(self, t, service):
        self.logs.append((t, service))

    def _window(self, t):
        return [s for x, s in self.logs if t - 3600 < x <= t]

    def count(self, t):
        return len(self._window(t))

    def busiest(self, t):
        c = Counter(self._window(t))
        return min(c, key=lambda s: (-c[s], s)) if c else ''


class TruckHub:
    def __init__(self, positions):
        self.start = [list(p) for p in positions]
        self.moves = []      # (truck, dx, dy) in order
        self.since = {}      # (client, truck) -> index of the first move the client gets
        self.polled = {}     # client -> moves already handed out

    def subscribe(self, client, truck):
        self.since.setdefault((client, truck), len(self.moves))
        self.polled.setdefault(client, len(self.moves))
        x, y = self.start[truck]
        for t, dx, dy in self.moves:
            if t == truck:
                x, y = x + dx, y + dy
        return [x, y]

    def move(self, truck, dx, dy):
        self.moves.append((truck, dx, dy))

    def poll(self, client):
        if client not in self.polled:
            return []
        out = [[t, dx, dy] for k, (t, dx, dy) in enumerate(self.moves)
               if k >= self.polled[client] and (client, t) in self.since and k >= self.since[(client, t)]]
        self.polled[client] = len(self.moves)
        return out


class Decoder:
    def __init__(self):
        self.got, self.done, self.last = {}, set(), -1

    def _complete(self):
        found = set()
        for left, ch in self.got.items():
            if ch != '-':
                continue
            s = left + 1
            while self.got.get(s, '-') != '-':
                s += 1
            if self.got.get(s) == '-' and s > left + 1:
                found.add((left, s))
        return found

    def sample(self, seq, ch):
        self.got[seq] = ch
        now = self._complete()
        new, self.done = now - self.done, now
        if not new:
            return []
        left, right = max(new)
        if left < self.last:
            return []
        self.last = left
        return [''.join(self.got[s] for s in range(left + 1, right))]


class PumpkinShow:
    def __init__(self, ours, schedule):
        self.weight = dict(ours)
        self.plan = [[name, a, b, False, False] for name, a, b in schedule]   # entered, left
        self.rivals, self.mine = [], set()

    def entered(self, time, weight):
        for p in self.plan:
            if p[1] == time and self.weight[p[0]] == weight and not p[3]:
                p[3] = True
                self.mine.add(p[0])
                return
        self.rivals.append(weight)

    def left(self, time, weight):
        for p in self.plan:
            if p[2] == time and self.weight[p[0]] == weight and not p[4]:
                p[4] = True
                self.mine.discard(p[0])
                return
        self.rivals.remove(weight)

    def leaders(self, time):
        top = max(self.rivals, default=float('-inf'))
        return sorted(n for n in self.mine if self.weight[n] >= top)


class Dividends:
    def __init__(self, price, amounts, days):
        self.price, self.divs = price, [list(x) for x in zip(amounts, days)]

    def update(self, i, amount, day):
        self.divs[i] = [amount, day]

    def price_on(self, day):
        return self.price - sum(a for a, d in self.divs if d <= day)


class OrderBook:
    def __init__(self):
        self.book, self.seq = [], 0   # [id, side, price, qty, seq]

    def limit(self, oid, side, price, qty):
        fills = []
        while qty > 0:
            opp = [o for o in self.book if o[1] != side]
            if not opp:
                break
            best = min(opp, key=lambda o: (o[2] if side == 'BUY' else -o[2], o[4]))
            if (best[2] > price) if side == 'BUY' else (best[2] < price):
                break
            q = min(qty, best[3])
            fills.append([best[0], best[2], q])
            qty -= q
            best[3] -= q
            if best[3] == 0:
                self.book.remove(best)
        if qty > 0:
            self.seq += 1
            self.book.append([oid, side, price, qty, self.seq])
        return fills

    def cancel(self, oid):
        for o in self.book:
            if o[0] == oid:
                self.book.remove(o)
                return True
        return False

    def top(self):
        bids = [o[2] for o in self.book if o[1] == 'BUY']
        asks = [o[2] for o in self.book if o[1] == 'SELL']
        return [max(bids) if bids else None, min(asks) if asks else None]


def route(edges, trip):
    pieces = edges.split(' ')
    if not all(re.fullmatch(r'\[[A-Z],[A-Z],[0-9]+\]', p) for p in pieces) or not re.fullmatch(r'[A-Z]->[A-Z],[0-9]+', trip):
        return 'E1'
    roads = [(p[1], p[3], int(p[5:-1])) for p in pieces]
    pairs = [frozenset((a, b)) for a, b, _ in roads]
    if any(a == b or d == 0 for a, b, d in roads) or len(set(pairs)) < len(pairs):
        return 'E2'
    start, end, limit = trip[0], trip[3], int(trip[5:])
    nodes = {a for a, _, _ in roads} | {b for _, b, _ in roads}
    if start not in nodes or end not in nodes:
        return 'E2'
    reach, todo = {start}, [start]   # connected?
    while todo:
        u = todo.pop()
        for a, b, _ in roads:
            for x, y in ((a, b), (b, a)):
                if x == u and y not in reach:
                    reach.add(y)
                    todo.append(y)
    if reach != nodes:
        return 'E2'
    paths = []   # every simple path, by depth-first search

    def walk(path, dist):
        if path[-1] == end:
            paths.append((dist, path))
            return
        for a, b, d in roads:
            for x, y in ((a, b), (b, a)):
                if x == path[-1] and y not in path:
                    walk(path + [y], dist + d)
    walk([start], 0)
    best = min(d for d, _ in paths)
    shortest = [p for d, p in paths if d == best]
    if len(shortest) > 1:
        return 'E2'
    return 'E3' if best > limit else '->'.join(shortest[0])


def tree(pairs):
    pieces = pairs.split(' ')
    if not all(re.fullmatch(r'\([A-Z],[A-Z]\)', p) for p in pieces):
        return 'E1'
    edges = [(p[1], p[3]) for p in pieces]
    if len(set(edges)) < len(edges):
        return 'E2'
    nodes = {x for e in edges for x in e}
    if any(sum(1 for p, _ in edges if p == n) > 2 for n in nodes):
        return 'E3'
    if any(sum(1 for _, c in edges if c == n) > 1 for n in nodes):
        return 'E4'
    roots = sorted(n for n in nodes if all(c != n for _, c in edges))
    seen, todo = set(roots), list(roots)   # with one parent each, a node unreachable from every root is on a cycle
    while todo:
        u = todo.pop()
        for p, c in edges:
            if p == u and c not in seen:
                seen.add(c)
                todo.append(c)
    if seen != nodes:
        return 'E5'
    if len(roots) > 1:
        return 'E6'

    def show(n):
        return '(' + n + ''.join(show(c) for p, c in sorted(edges, key=lambda e: e[1]) if p == n) + ')'
    return show(roots[0])


class RingDeque:
    def __init__(self, capacity):
        self.cap, self.items = capacity, []

    def push_back(self, x):
        if len(self.items) == self.cap:
            return False
        self.items.append(x)
        return True

    def push_front(self, x):
        if len(self.items) == self.cap:
            return False
        self.items.insert(0, x)
        return True

    def pop_front(self):
        return self.items.pop(0) if self.items else None

    def pop_back(self):
        return self.items.pop() if self.items else None

    def front(self):
        return self.items[0] if self.items else None

    def back(self):
        return self.items[-1] if self.items else None

    def size(self):
        return len(self.items)


class LRUCache:
    def __init__(self, capacity):
        self.cap, self.keys, self.vals = capacity, [], {}   # keys: least recent first

    def get(self, key):
        if key not in self.vals:
            return -1
        self.keys.remove(key)
        self.keys.append(key)
        return self.vals[key]

    def put(self, key, value):
        if key in self.vals:
            self.keys.remove(key)
        elif len(self.keys) == self.cap:
            del self.vals[self.keys.pop(0)]
        self.keys.append(key)
        self.vals[key] = value


def peak_live(orders):
    best, at = 0, None
    for t in sorted({s for s, _ in orders}):
        live = sum(1 for s, e in orders if s <= t < e)
        if live > best:
            best, at = live, t
    return [best, at]


class Position:
    # Tracks total cost rather than the average price.
    def __init__(self):
        self.qty, self.cost, self.pnl = 0, 0.0, 0.0

    def fill(self, side, price, qty):
        sign = 1 if side == 'BUY' else -1
        for _ in range(qty):   # one unit at a time
            if self.qty == 0 or (self.qty > 0) == (sign > 0):
                self.cost += price
            else:
                avg = self.cost / abs(self.qty)
                self.pnl += (price - avg) if self.qty > 0 else (avg - price)
                self.cost -= avg
            self.qty += sign

    def position(self):
        return self.qty

    def average(self):
        return self.cost / abs(self.qty) if self.qty else None

    def realised(self):
        return self.pnl


def match_orders(orders):
    book, trades = [], []   # [index, side, price, qty left]
    for i, (side, price, qty) in enumerate(orders):
        while qty > 0:
            opp = [o for o in book if o[1] != side and (o[2] <= price if side == 'BUY' else o[2] >= price)]
            if not opp:
                break
            best = min(opp, key=lambda o: (o[2] if side == 'BUY' else -o[2], o[0]))
            q = min(qty, best[3])
            trades.append([i, best[0], best[2], q] if side == 'BUY' else [best[0], i, best[2], q])
            qty -= q
            best[3] -= q
            if best[3] == 0:
                book.remove(best)
        if qty > 0:
            book.append([i, side, price, qty])
    return trades


def pair_sum(nums, target):
    return sorted({(min(nums[i], nums[j]), max(nums[i], nums[j]))
                   for i in range(len(nums)) for j in range(i + 1, len(nums)) if nums[i] + nums[j] == target})


def days_between(a, b):
    return (datetime.date.fromisoformat(b) - datetime.date.fromisoformat(a)).days


BRUTE = {
    'opt-worst-trade': WorstTrade, 'opt-checkout': Checkout, 'opt-tickets': TicketBot, 'opt-log-window': LogMonitor,
    'opt-trucks': TruckHub, 'opt-numbers-station': Decoder, 'opt-pumpkins': PumpkinShow, 'opt-dividends': Dividends,
    'opt-order-book': OrderBook, 'opt-route': route, 'opt-tree-errors': tree, 'opt-ring-deque': RingDeque,
    'opt-lru': LRUCache, 'opt-peak-live': peak_live, 'opt-debug-position': Position, 'opt-debug-matcher': match_orders,
    'opt-pair-sum': pair_sum, 'opt-days-between': days_between,
}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('code', help='JSON from tests/export-code.js')
    data = json.load(open(ap.parse_args().code, encoding='utf8'))
    fails, checked = 0, 0
    for P in data:
        ns = {'__name__': 'reference'}
        exec(compile(P['ref'], P['id'] + '.py', 'exec'), ns)
        brute = BRUTE.get(P['id'])
        if brute is None:
            print(f"FAIL {P['id']}: no brute-force version")
            fails += 1
        bad_starter = 0
        if P['starter']:
            sns = {'__name__': 'starter'}
            exec(compile(P['starter'], P['id'] + '-starter.py', 'exec'), sns)
        for case in P['cases']:
            checked += 1
            got = run(ns[P['name']], P['kind'], case)
            if not same(got, case['out']):
                fails += 1
                print(f"FAIL {P['id']} {case['label']}: reference gave {json.dumps(got)[:200]}, expected {json.dumps(case['out'])[:200]}")
            if brute and not case['perf']:
                got = run(brute, P['kind'], case)
                if not same(got, case['out']):
                    fails += 1
                    print(f"FAIL {P['id']} {case['label']}: brute force gave {json.dumps(got)[:200]}, expected {json.dumps(case['out'])[:200]}")
            if P['starter']:
                try:
                    bad_starter += not same(run(sns[P['name']], P['kind'], case), case['out'])
                except Exception:
                    bad_starter += 1
        if P['starter'] and not bad_starter:
            fails += 1
            print(f"FAIL {P['id']}: the buggy starter passes every case")
        print(f"{P['id']}: {len(P['cases'])} cases" + (f", buggy starter fails {bad_starter}" if P['starter'] else ''))
    print(f"{len(data)} problems, {checked} cases: {'ALL AGREE' if not fails else f'{fails} FAILURES'}")
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
