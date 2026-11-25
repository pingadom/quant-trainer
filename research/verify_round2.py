"""Re-derives the numeric self-checks in the interview 2 study guide (www/js/round2-guide.js).

    node tests/export-round2.js > r2.json && python research/verify_round2.py r2.json
"""
import json
import sys
from collections import deque


def fifo_realised(fills):
    """Realised P&L closing the oldest open lots first; fills are (signed qty, price)."""
    lots, real = deque(), 0
    for q, p in fills:
        while q and lots and (lots[0][0] > 0) != (q > 0):
            m = min(abs(q), abs(lots[0][0]))
            s = 1 if lots[0][0] > 0 else -1
            real += m * (p - lots[0][1]) * s
            lots[0][0] -= m * s
            q += m * s
            if lots[0][0] == 0:
                lots.popleft()
        if q:
            lots.append([q, p])
    return real


def walk_asks(asks, qty):
    cost = 0
    for price, size in asks:
        take = min(qty, size)
        cost += take * price
        qty -= take
    return cost


DERIVED = {
    "mk-1": round((100.02 - 99.98) / 0.01),
    "mk-2": walk_asks([(1000, 100), (1001, 150), (1002, 200)], 300) / 100,   # integer cents, then euros
    "mk-3": fifo_realised([(100, 50), (100, 52), (-150, 53)]),
    "rq-1": round(2000 * 64 * 8.5 * 3600 / 1e9, 1),
    "rq-2": 50_000 - round(1 / 25e-6),
    "rq-3": round(365 * 24 * 60 * 0.0001, 1),
    "rq-4": 363 * 5 / 1000,                                                 # 1.815 ms exactly
    "nw-1": 2000 * 4 * 100 * 8 / 1e6,
    "cc-2": 1 / 0.2,
}
assert fifo_realised([(100, 50), (100, 52), (-150, 53)]) == 350


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    fails = 0
    got = {c["id"]: c for c in data["checks"]}
    for cid, c in got.items():
        if cid not in DERIVED:
            print(f"FAIL {cid}: no independent derivation")
            fails += 1
        elif abs(c["a"] - DERIVED[cid]) > max(c.get("tol", {}).get("abs", 1e-4), 1e-9):
            print(f"FAIL {cid}: app says {c['a']}, derived {DERIVED[cid]}")
            fails += 1
    for cid in set(DERIVED) - set(got):
        print(f"FAIL {cid}: derived here but not in the app")
        fails += 1
    print(f"{len(got)} numeric checks: {'ALL AGREE' if not fails else f'{fails} FAILURES'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
