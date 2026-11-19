"""Re-derives the numeric self-checks and the checkable claims in the tech-screening fundamentals
(www/js/fundamentals-content.js). The CPython memory figures are measured with sys.getsizeof, so
this must run on 64-bit CPython 3.12 (as CI does).

    node tests/export-fundamentals.js > fund.json && python research/verify_fundamentals.py fund.json
"""
import json
import struct
import sys
from collections import deque

# Each numeric check, derived independently of the text.
DERIVED = {
    "arch-1": 1_000_000 * 8 / 64 / 1000,               # thousands of 64-byte lines
    "arch-2": 100 / 1,                                   # DRAM ~100 ns v L1 ~1 ns
    "mem-1": 64 * 2**30 / (4 * 2**10) / 1e6,             # millions of 4 KB pages in 64 GB
    "conc-1": round(1 / (0.1 + 0.9 / 8), 2),             # Amdahl
    "net-1": 100 / 200_000 * 1e6,                        # µs for 100 km at 200,000 km/s
    "net-2": 1500 * 8 / 10e9 * 1e6,                      # µs to serialise 1,500 bytes at 10 Gb/s
}


def python_facts():
    """The CPython sizes quoted in the 'Python from the inside' topic."""
    assert struct.calcsize("P") == 8, "run on 64-bit CPython"
    assert sys.version_info[:2] == (3, 12), "sizes are quoted for CPython 3.12"
    g = sys.getsizeof
    assert g(1.0) == 24 and g(1) == 28
    xs = [float(i) for i in range(1_000_000)]
    total_mb = (g(xs) + sum(g(x) for x in xs)) / 1e6
    assert 31.5 < total_mb < 33.5, total_mb                # "about 32 MB"
    DERIVED["py-1"] = 8 + 24                                # pointers + float objects
    caps, last, lst = [], g([]), []
    for i in range(40):
        lst.append(i)
        if g(lst) != last:
            caps.append((g(lst) - g([])) // 8)
            last = g(lst)
    assert caps[:6] == [4, 8, 16, 24, 32, 40], caps         # the growth sequence quoted
    assert 30_000 < g({i: i for i in range(1000)}) < 45_000  # "about 37 KB"
    assert g(deque()) > 0


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    python_facts()
    fails = 0
    numeric = {c["id"]: c for c in data["checks"] if "a" in c}
    for cid, c in numeric.items():
        if cid not in DERIVED:
            print(f"FAIL {cid}: no independent derivation here")
            fails += 1
            continue
        tol = max(c.get("tol", {}).get("abs", 1e-4), 1e-9)
        if abs(c["a"] - DERIVED[cid]) > tol:
            print(f"FAIL {cid}: app says {c['a']}, derived {DERIVED[cid]}")
            fails += 1
    for cid in set(DERIVED) - set(numeric):
        print(f"FAIL {cid}: derived here but not in the app")
        fails += 1
    print(f"{len(numeric)} numeric checks and the CPython size facts: {'ALL AGREE' if not fails else f'{fails} FAILURES'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
