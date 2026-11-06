"""Re-derives every numeric answer in the Citadel SSE questions (content/*.md) from scratch.

Each answer is computed here independently of the worked solution: by exact enumeration, dynamic
programming or a direct formula. The stored answer must lie within the question's own tolerance
of that value, so a typing slip in the content fails CI. Every numeric question must have a check.

    node tests/export-sse.js > sse.json && python research/verify_sse.py sse.json
"""
import argparse
import json
import math
import sys
from fractions import Fraction as Fr
from itertools import permutations, product

DIE = range(1, 7)


def expected_max_two_dice():
    return Fr(sum(max(a, b) for a, b in product(DIE, DIE)), 36)


def two_boys():
    kids = list(product('BG', repeat=2))
    some = [k for k in kids if 'B' in k]
    return Fr(sum(k == ('B', 'B') for k in some), len(some))


def monty_switch():
    wins = total = 0
    for car, pick in product(range(3), repeat=2):
        opens = [d for d in range(3) if d not in (car, pick)]
        for host in opens:
            weight = Fr(1, len(opens))
            switch = next(d for d in range(3) if d not in (pick, host))
            total += weight
            wins += weight * (switch == car)
    return wins / total


def disease():
    pos = Fr(1, 100) * Fr(99, 100) + Fr(99, 100) * Fr(5, 100)
    return Fr(1, 100) * Fr(99, 100) / pos


def coupon_die():
    return sum(Fr(6, 6 - k) for k in range(6))


def run_length_flips(p, run):
    """Expected trials for `run` successes in a row: E_k = 1 + p E_{k+1} + (1-p) E_0, solved exactly."""
    # E_0 = (1 - p^run) / ((1 - p) p^run)
    return (1 - p ** run) / ((1 - p) * p ** run)


def first_ace():
    # E[position] = sum over k ≥ 0 of P(first k cards hold no ace).
    total, none = Fr(0), Fr(1)
    for k in range(49):
        total += none
        none *= Fr(48 - k, 52 - k)
    return total


def broken_stick(n=2000):
    """Midpoint grid over the unit square."""
    hits = 0
    for i in range(n):
        for j in range(n):
            a, b = sorted(((i + 0.5) / n, (j + 0.5) / n))
            hits += max(a, b - a, 1 - b) < 0.5
    return hits / n ** 2


def ants():
    good = sum(len(set(d)) == 1 for d in product((0, 1), repeat=3))
    return Fr(8 - good, 8)


def ruin_prob(start, top):
    """Solves the first-step equations for a fair walk by iterating to convergence."""
    p = [0.0] * (top + 1)
    p[top] = 1.0
    for _ in range(20000):
        for k in range(1, top):
            p[k] = 0.5 * (p[k - 1] + p[k + 1])
    return p[start]


def fixed_points(n=6):
    perms = list(permutations(range(n)))
    return Fr(sum(sum(p[i] == i for i in range(n)) for p in perms), len(perms))


def reroll_value(rerolls):
    v = Fr(7, 2)
    for _ in range(rerolls):
        v = sum(max(Fr(k), v) for k in DIE) / 6
    return v


def kelly_even(p):
    grid = [i / 10000 for i in range(1, 9999)]
    return max(grid, key=lambda f: p * math.log(1 + f) + (1 - p) * math.log(1 - f))


def min_equicorrelation():
    # Smallest ρ with the 3×3 matrix positive semi-definite: its smallest eigenvalue is 1 − ρ.. and 1 + 2ρ.
    return min(r / 1000 for r in range(-1000, 1001) if 1 + 2 * (r / 1000) >= 0 and 1 - r / 1000 >= 0)


def min_corr_xz(rxy, ryz):
    """Scans ρ_XZ for the smallest value with a non-negative determinant."""
    det = lambda r: 1 + 2 * rxy * ryz * r - rxy ** 2 - ryz ** 2 - r ** 2
    return min(r / 100000 for r in range(-100000, 100001) if det(r / 100000) >= -1e-12)


CHECKS = {
    'q-prob-001': expected_max_two_dice,
    'q-prob-002': two_boys,
    'q-prob-003': monty_switch,
    'q-prob-004': disease,
    'q-prob-005': coupon_die,
    'q-prob-006': lambda: run_length_flips(Fr(1, 2), 2),
    'q-prob-007': lambda: run_length_flips(Fr(1, 6), 2),
    'q-prob-008': first_ace,
    'q-prob-009': broken_stick,
    'q-prob-010': ants,
    'q-prob-011': lambda: ruin_prob(1, 3),
    'q-prob-012': lambda: sum((i + 0.5) / 2000 * 2 * (i + 0.5) / 2000 / 2000 for i in range(2000)),
    'q-prob-013': fixed_points,
    'q-ev-001': lambda: reroll_value(1),
    'q-ev-002': lambda: reroll_value(2),
    'q-ev-003': lambda: Fr(sum(k * k for k in DIE), 6),
    'q-ev-004': lambda: kelly_even(0.6),
    'q-mm-001': lambda: 1 + Fr(7, 2),
    'q-mm-002': lambda: Fr(sum(sum(f) for f in product((0, 1), repeat=10)), 2 ** 10),
    'q-mm-arith-001': lambda: 64 * 15,
    'q-mm-arith-002': lambda: Fr(75, 1000) * 480,
    'q-mm-arith-003': lambda: 99 ** 2,
    'q-mm-arith-004': lambda: Fr(91 - 84, 84) * 100,
    'q-mm-arith-005': lambda: 125 * 32,
    'q-fermi-001': lambda: 103e6,  # the British Coffee Association's figure, not a derivation
    'q-stat-001': lambda: 0.6 * 20 / 10,
    'q-stat-002': lambda: math.sqrt(0.8 * 0.45),
    'q-stat-003': min_equicorrelation,
    'q-stat-004': lambda: min_corr_xz(0.9, 0.9),
    'q-stat-005': lambda: 1 / math.sqrt(1 * (1 + 1)),
    'q-stat-006': lambda: 0.05 / 1 * math.sqrt(252),
    'q-stat-007': lambda: 1 - 0.95 ** 100,
    'q-stat-008': lambda: 0.3 ** 2,
    'q-stat-009': lambda: math.sqrt(0.25 * 0.04 + 0.25 * 0.04 + 2 * 0.25 * 0.5 * 0.04),
    'q-stat-010': lambda: 1 / math.sqrt(252),
    'q-eq-003': lambda: 10 * 1.5,
    'q-eq-004': lambda: 10 * math.sqrt(4 / 1),
    'q-eq-005': lambda: 20 - 50 * 0.10,
}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('content', help='JSON from tests/export-sse.js')
    numeric = json.load(open(ap.parse_args().content, encoding='utf8'))
    fails = 0
    for q in numeric:
        fn = CHECKS.get(q['id'])
        if fn is None:
            print(f"FAIL {q['id']}: no independent check")
            fails += 1
            continue
        exact = float(fn())
        tol = q.get('tol')
        ok = abs(math.log10(q['value'] / exact)) <= 1e-9 if tol is None else abs(q['value'] - exact) <= tol + 1e-9
        if not ok:
            print(f"FAIL {q['id']}: stored {q['value']}, computed {exact}, tolerance {tol}")
            fails += 1
    extra = set(CHECKS) - {q['id'] for q in numeric}
    for qid in sorted(extra):
        print(f"FAIL {qid}: checked here but not a numeric question")
        fails += 1
    print(f"{len(numeric)} numeric answers: {'ALL AGREE' if not fails else f'{fails} FAILURES'}")
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
