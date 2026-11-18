"""Checks the data drills (www/js/data-drills.js), which run in the browser's Python.

For every drill:
1. the reference solution passes every hidden test;
2. the starter code fails at least one (so the tests really test something);
3. each common mistake listed below fails at least one test, so the tests catch the errors
   people actually make, not only obviously broken code.

Run it under the newest releases and under the browser's versions (numpy 2.0.2, pandas 2.2.3,
Polars 1.18.0: research/requirements-browser.txt).

    node tests/export-data.js > data.json && python research/verify_data.py data.json
"""
import json
import sys
import warnings

# Each mistake: (what it gets wrong, (old, new) replacements applied to the reference solution).
MISTAKES = {
    "np-drawdown": [("drawdown from the overall maximum, not the running peak", [("np.maximum.accumulate(p)", "p.max()")]),
                    ("a Python loop", [("    peak = np.maximum.accumulate(p)\n    return float((p / peak - 1).min())",
                                        "    worst, peak = 0.0, p[0]\n    for x in p:\n        peak = max(peak, x)\n        worst = min(worst, x / peak - 1)\n    return float(worst)")])],
    "np-zscore": [("the whole array's mean and deviation", [("X.mean(axis=0)", "X.mean()"), ("X.std(axis=0)", "X.std()")]),
                  ("rows instead of columns", [("X.mean(axis=0)", "X.mean(axis=1, keepdims=True)"), ("X.std(axis=0)", "X.std(axis=1, keepdims=True)")]),
                  ("modifies X in place", [("    return (X - X.mean(axis=0)) / X.std(axis=0)",
                                            "    X -= X.mean(axis=0)\n    X /= X.std(axis=0)\n    return X")])],
    "np-rolling": [("an off-by-one window", [("(c[w:] - c[:-w]) / w", "(c[w + 1:] - c[1:-w]) / w")]),
                   ("O(n·w) with a loop over windows", [("    c = np.cumsum(np.concatenate(([0.0], np.asarray(x, dtype=float))))\n    return (c[w:] - c[:-w]) / w",
                                                        "    x = np.asarray(x, dtype=float)\n    return np.array([x[i:i + w].mean() for i in range(len(x) - w + 1)])")])],
    "np-mc": [("forgets the -sigma^2 t / 2 drift", [("-0.5 * sigma ** 2 * t + ", "")]),
              ("standard error without the square root of n", [("/ np.sqrt(n)", "")]),
              ("ignores the seed", [("np.random.default_rng(seed)", "np.random.default_rng()")])],
    "pd-vwap": [("the mean price, not volume-weighted", [("    t = trades.assign(pv=trades[\"px\"] * trades[\"qty\"])\n    g = t.groupby(\"sym\")[[\"pv\", \"qty\"]].sum()\n    return g[\"pv\"] / g[\"qty\"]",
                                                         "    return trades.groupby(\"sym\")[\"px\"].mean()")]),
                ("modifies the input", [("    t = trades.assign(pv=", "    t = trades\n    t[\"pv\"] = (")])],
    "pd-share": [("agg instead of transform", [("transform(\"sum\")", "sum()")]),
                 ("returns a NumPy array, losing the index", [("    return trades[\"pnl\"] / trades.groupby(\"desk\")[\"pnl\"].transform(\"sum\")",
                                                                "    return (trades[\"pnl\"] / trades.groupby(\"desk\")[\"pnl\"].transform(\"sum\")).values")])],
    "pd-asof": [("no by=: uses the other symbol's quote", [(", by=\"sym\"", "")]),
                ("forward instead of backward", [("on=\"t\", by=\"sym\")", "on=\"t\", by=\"sym\", direction=\"forward\")")]),
                ("a plain merge on time", [("pd.merge_asof(trades.sort_values(\"t\"), quotes.sort_values(\"t\"), on=\"t\", by=\"sym\")",
                                            "trades.merge(quotes, on=[\"t\", \"sym\"], how=\"left\").sort_values(\"t\")")])],
    "pd-bars": [("keeps empty minutes", [("    return bars.dropna(subset=[\"open\"])", "    return bars")]),
                ("mean price instead of VWAP", [("pv / bars[\"volume\"]", "ticks[\"px\"].resample(\"1min\").mean()")])],
    "pl-report": [("mean price instead of VWAP", [("(pl.col(\"px\") * pl.col(\"qty\")).sum() / pl.col(\"qty\").sum()", "pl.col(\"px\").mean()")]),
                  ("sorted the wrong way", [("descending=True", "descending=False")])],
    "pl-over": [("the overall mean, not the group's", [("x.mean().over(by)", "x.mean()")]),
                ("population deviation", [("x.std().over(by)", "x.std(ddof=0).over(by)")])],
    "pl-bars": [("doesn't sort first", [("ticks.sort(\"t\")\n        .group_by_dynamic", "ticks.set_sorted(\"t\")\n        .group_by_dynamic")]),
                ("mean price instead of VWAP", [("vwap=(pl.col(\"px\") * pl.col(\"qty\")).sum() / pl.col(\"qty\").sum()", "vwap=pl.col(\"px\").mean()")])],
    "pl-returns": [("shifts across symbols", [(").log().over(\"sym\")", ").log()")]),
                   ("simple instead of log returns", [("(pl.col(\"px\") / pl.col(\"px\").shift(1)).log()", "(pl.col(\"px\") / pl.col(\"px\").shift(1) - 1)")])],
    "md-wide": [("fills the gap before computing returns", [("wide.pct_change(fill_method=None)", "wide.ffill().pct_change()")]),
                ("fills missing prices with 0", [("wide.pct_change(fill_method=None)", "wide.fillna(0).pct_change(fill_method=None)")])],
    "md-backtest": [("look-ahead: no shift", [("signal.shift(1).fillna(0.0)", "signal.fillna(0.0)")]),
                    ("no costs", [("    return gross - cost * turnover", "    return gross")]),
                    ("costs on the position, not on trading", [("pos.diff().abs().fillna(pos.abs())", "pos.abs()")])],
    "md-clean": [("drops repeated time and price even with different IDs", [(".drop_duplicates()", ".drop_duplicates(subset=[\"t\", \"px\"])")]),
                 ("compares with the mean instead of the median", [(".median()", ".mean()")]),
                 ("unstable sort", [("sort_values(\"t\", kind=\"stable\")", "sort_values(\"t\", kind=\"quicksort\", ascending=False).iloc[::-1]")])],
}


def run(code, test):
    env = {"solution": {"__name__": "solution"}}
    try:
        exec(code, env["solution"])
        exec(test, env)
        return [(n, ok, why) for n, ok, why in env["run"]()]
    except (KeyboardInterrupt, SystemExit):
        raise
    except BaseException as e:  # a drill whose code won't even run counts as failing
        return [("(load)", False, f"{type(e).__name__}: {e}")]


def mutate(sol, edits):
    for old, new in edits:
        if old not in sol:
            raise ValueError(f"mistake edit not found: {old!r}")
        sol = sol.replace(old, new)
    return sol


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    warnings.simplefilter("ignore")
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    import numpy, pandas, polars
    print(f"numpy {numpy.__version__}, pandas {pandas.__version__}, polars {polars.__version__}")
    fails, n_mistakes = 0, 0
    ids = {d["id"] for d in data["drills"]}
    for missing in sorted(ids - set(MISTAKES)):
        print(f"FAIL {missing}: list at least one common mistake for it here")
        fails += 1
    for d in data["drills"]:
        res = run(d["sol"], d["test"])
        for n, ok, why in res:
            if not ok:
                print(f"FAIL {d['id']}: the reference fails \"{n}\": {why}")
                fails += 1
        if len(res) < 2:
            print(f"FAIL {d['id']}: needs at least two test cases")
            fails += 1
        if all(ok for _, ok, _ in run(d["starter"], d["test"])):
            print(f"FAIL {d['id']}: the starter code passes every test")
            fails += 1
        for what, edits in MISTAKES.get(d["id"], []):
            n_mistakes += 1
            try:
                wrong = mutate(d["sol"], edits)
            except ValueError as e:
                print(f"FAIL {d['id']}: {e}")
                fails += 1
                continue
            if all(ok for _, ok, _ in run(wrong, d["test"])):
                print(f"FAIL {d['id']}: the tests don't catch a common mistake: {what}")
                fails += 1
    print(f"{len(data['drills'])} data drills, {n_mistakes} common mistakes: {'ALL CHECKS PASS' if not fails else f'{fails} FAILURES'}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
