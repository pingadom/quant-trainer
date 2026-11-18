"""Checks for the data-tools part of the quant dev handbook (www/js/dev-part6.js): NumPy, pandas,
Polars and market data. Imported by verify_devbook.py, which runs the chapters' listings.

ANSWERS derives each numeric answer by running the operation the question describes in the real
library (or by plain arithmetic), not by copying the chapter's working. TESTS checks each listing
against slow, obviously correct Python loops on fixed and random inputs.

Run under both the newest releases and the browser's versions (numpy 2.0.2, pandas 2.2.3,
Polars 1.18.0, see research/requirements-browser.txt), since the drills run in Pyodide.
"""
import math
import random
import warnings
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import polars as pl

rng = random.Random(23)
T0 = datetime(2026, 3, 2, 9, 0, 0)


def ts(sec):
    return T0 + timedelta(seconds=sec)


def close(a, b, eps=1e-9):
    return abs(a - b) <= eps * max(1.0, abs(a), abs(b))


def norm_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def bs_call0(s, k, sigma, t):
    """Black-Scholes call with zero rates."""
    d1 = (math.log(s / k) + 0.5 * sigma ** 2 * t) / (sigma * math.sqrt(t))
    return s * norm_cdf(d1) - k * norm_cdf(d1 - sigma * math.sqrt(t))


# ---------------------------------------------------------------- answers, by running the libraries
def _answers():
    a = {}
    # NumPy
    arr = np.arange(5)
    b = arr[1:3]
    b[0] = 99
    view_val = int(arr[1])
    p = np.array([100, 120, 90, 110.0])
    mc_pay = None
    z = np.random.default_rng(0).standard_normal(1_000_000)
    st = 100 * np.exp(-0.02 + 0.2 * z)
    mc_pay = np.maximum(st - 100, 0)
    a["dsa-numpy"] = {
        0: np.zeros(1_000_000).nbytes / 1e6,
        1: -100 * float((p / np.maximum.accumulate(p) - 1).min()),
        2: np.ones((3, 4)).sum(axis=0).size,
        3: (np.ones((5, 1)) + np.ones(3)).size,
        4: view_val,
        5: len([np.arange(10)[i:i + 3] for i in range(10 - 3 + 1)]),
        6: 10_000 * (0.04 / 0.01) ** 2 / 1000,
        "h0": int(np.arange(12).reshape(3, 4).sum(axis=1)[-1]),
        "h1": int((np.array([100], dtype=np.int8) * 2)[0]),
        "h2": float(np.nanmean([1, np.nan, 3])),
        "h3": (np.ones(2000)[:, None] - np.ones(500)[None, :]).size / 1e6,
        "h7": round(float(mc_pay.mean()), 2),
    }
    # The quoted Black-Scholes value and standard error.
    assert abs(bs_call0(100, 100, 0.2, 1) - 7.97) < 0.005
    assert 0.012 < mc_pay.std(ddof=1) / 1000 < 0.015
    assert abs(mc_pay.mean() - bs_call0(100, 100, 0.2, 1)) < 0.05

    # pandas
    s1 = pd.Series([1, 2, 3], index=list("abc"))
    s2 = pd.Series([10, 20, 30], index=list("bcd"))
    trades = pd.DataFrame({"desk": ["a", "a", "b"], "pnl": [1.0, 3.0, 5.0]})
    share = trades["pnl"] / trades.groupby("desk")["pnl"].transform("sum")
    left = pd.DataFrame({"key": ["A", "A"], "v": [1, 2]})
    right = pd.DataFrame({"key": ["A"] * 3, "w": [1, 2, 3]})
    tr = pd.DataFrame({"t": [ts(3)], "sym": ["X"], "px": [100.2]})
    qt = pd.DataFrame({"t": [ts(0), ts(3), ts(4)], "sym": ["X"] * 3, "bid": [100.0, 100.1, 99.9]})
    asof = pd.merge_asof(tr, qt, on="t", by="sym")
    hl = pd.DataFrame({"key": ["A", "B", "B"]})
    hr = pd.DataFrame({"key": ["B", "B", "C"]})
    big = pd.DataFrame({"desk": [f"d{i % 4}" for i in range(1000)], "pnl": np.ones(1000)})
    tr2 = pd.DataFrame({"t": [ts(1), ts(5)], "sym": ["X", "X"]})
    qt2 = pd.DataFrame({"t": [ts(0), ts(2), ts(6)], "sym": ["X"] * 3, "bid": [99.0, 100.0, 101.0]})
    tol = pd.merge_asof(tr2, qt2, on="t", by="sym", tolerance=pd.Timedelta("2s"))
    a["dsa-pandas"] = {
        0: float((s1 + s2).sum()),
        1: float(share.iloc[1]),
        2: len(left.merge(right, on="key")),
        3: float(asof["bid"].iloc[0]),
        4: int(pd.Series([1, 2, 3, 4, 5.0]).rolling(3).mean().isna().sum()),
        5: float(pd.Series([1, None, 3]).mean()),
        "h0": len(hl.merge(hr, on="key")),
        "h1": round(float(pd.Series([100, 110, 99]).pct_change().iloc[-1]), 10),
        "h2": len(big.groupby("desk")["pnl"].transform("sum")),
        "h3": 0 if pd.isna(tol["bid"].iloc[1]) else float(tol["bid"].iloc[1]),
    }
    # The resample question (m2): 4 rows, and 09:02 is empty.
    tick_t = [ts(10), ts(50), ts(80), ts(180)]
    px = pd.Series([100, 101, 99, 102.0], index=pd.DatetimeIndex(tick_t))
    o = px.resample("1min").ohlc()
    assert len(o) == 4 and o.iloc[2].isna().all()
    # Chained assignment (m3) leaves the frame unchanged, in pandas 2 and 3.
    df = pd.DataFrame({"qty": [1, -1, 2], "flag": [0, 0, 0]})
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df[df.qty > 0]["flag"] = 1
    assert df["flag"].tolist() == [0, 0, 0]
    df.loc[df.qty > 0, "flag"] = 1
    assert df["flag"].tolist() == [1, 0, 1]
    # merge_asof without exact matches takes the earlier quote, as the solution says.
    assert float(pd.merge_asof(tr, qt, on="t", by="sym", allow_exact_matches=False)["bid"].iloc[0]) == 100.0
    # An integer column with a gap becomes float64; "Int64" keeps integers.
    assert pd.Series([1, 2, None]).dtype == np.float64 and pd.Series([1, 2, None], dtype="Int64").dtype == "Int64"

    # Polars
    pdesk = pl.DataFrame({"desk": ["a", "a", "b"], "pnl": [1.0, 3.0, 5.0]})
    pshare = pdesk.with_columns(share=pl.col("pnl") / pl.col("pnl").sum().over("desk"))["share"][1]
    ticks = pl.DataFrame({"t": tick_t, "px": [100.0, 101, 99, 102]})
    bars = ticks.sort("t").group_by_dynamic("t", every="1m").agg(pl.col("px").last())
    at = pl.DataFrame({"t": [1, 3, 5], "sym": ["A"] * 3})
    aq = pl.DataFrame({"t": [0, 3, 4], "sym": ["A"] * 3, "bid": [10.0, 11, 12]})
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        joined = at.join_asof(aq, on="t", by="sym")
    cs = pl.DataFrame({"desk": ["a", "a", "b", "a"], "pnl": [1, 2, 5, 4]}).with_columns(c=pl.col("pnl").cum_sum().over("desk"))
    a["dsa-polars"] = {
        0: float(pshare),
        1: pl.DataFrame({"x": [1, None, 3]}).select(pl.col("x").sum()).item(),
        2: 100 * 3 / 40,
        3: bars.height,
        4: joined["bid"].to_list()[-1],
        "h0": cs["c"].to_list()[-1],
        "h1": pl.Series([1, None, None, 4]).null_count(),
        "h2": pl.DataFrame({"px": [3.0, 1, 2]}).select(pl.col("px").pct_change()).to_series().to_list()[-1],
    }
    assert joined["bid"].to_list() == [10.0, 11.0, 12.0]
    # Facts stated in the chapter.
    try:
        pl.DataFrame({"x": [1, 2]}).select(pl.col("x").sum(), pl.col("x").mean())
        raise AssertionError("duplicate names should be refused")
    except pl.exceptions.DuplicateError:
        pass
    try:
        pl.DataFrame({"px": [100, 101, 99.5]})
        raise AssertionError("mixed int and float should be refused")
    except TypeError:
        pass
    nan_sum = pl.DataFrame({"x": [1.0, float("nan"), 3.0]}).select(pl.col("x").sum()).item()
    assert math.isnan(nan_sum)
    assert pl.from_pandas(pd.DataFrame({"x": [1.0, np.nan]}))["x"].null_count() == 1  # NaN -> null here
    lazy_plan = pl.DataFrame({"a": [1], "b": [2], "c": [3]}).lazy().filter(pl.col("a") > 0).select("b").explain()
    assert "PROJECT" in lazy_plan
    # NaN made inside Polars stays NaN; pivot(on=...) and unpivot exist, as the chapters say.
    assert math.isnan(pl.DataFrame({"a": [0.0]}).select(pl.col("a") / pl.col("a")).item())
    lp = pl.DataFrame({"date": [1, 1, 2], "sym": ["A", "B", "A"], "px": [1.0, 2.0, 3.0]})
    wide_pl = lp.pivot(on="sym", index="date", values="px")
    assert wide_pl.columns == ["date", "A", "B"] and wide_pl["B"].to_list() == [2.0, None]
    assert wide_pl.unpivot(index="date").height == 4
    rv = pl.DataFrame({"t": [ts(0), ts(60), ts(120), ts(400)], "x": [1.0, 2.0, 3.0, 4.0]})
    assert rv.with_columns(r=pl.col("x").rolling_sum_by("t", window_size="5m"))["r"].to_list() == [1.0, 3.0, 6.0, 7.0]

    # Market data
    dates = pd.date_range("2026-03-02", periods=5, freq="D")
    long = pd.concat([
        pd.DataFrame({"date": dates, "sym": "A", "px": [10.0, 11, 12, 13, 14]}),
        pd.DataFrame({"date": dates[[0, 1, 3, 4]], "sym": "B", "px": [20.0, 21, 22, 23]}),
    ])
    wide = long.pivot(index="date", columns="sym", values="px").sort_index().pct_change(fill_method=None)
    prices = pd.Series([100, 102, 101.0])
    sig = pd.Series([1, 1, 0.0])
    day3 = (sig.shift(1) * prices.pct_change()).iloc[2]
    pos = pd.Series([0, 1, 1, -1.0])
    a["dsa-marketdata"] = {
        0: int(wide["B"].isna().sum()),
        1: round(100 * float(day3), 2),
        2: abs(-1 - 1) * 5,
        3: 100e6 * 5 * 8 / 1e9,
        "h0": round(float((pd.Series([0, 1, 1.0]) * pd.Series([100, 110, 99.0]).pct_change()).fillna(0).sum()), 10),
        "h1": float(pos.diff().abs().fillna(pos.abs()).sum()),
        "h2": 50e6 * 2 / 1e6,
        "h3": round(math.sqrt(252) * 0.0004 / 0.01, 2),
    }
    assert np.array([1], dtype=np.int64).nbytes == np.array([1.0]).nbytes == 8  # m2: same size
    return a


ANSWERS = _answers()


# ---------------------------------------------------------------- slow reference versions
def loop_returns(p):
    return [p[i + 1] / p[i] - 1 for i in range(len(p) - 1)]


def loop_drawdown(p):
    worst, peak = 0.0, -math.inf
    for x in p:
        peak = max(peak, x)
        worst = min(worst, x / peak - 1)
    return worst


def rand_prices(n):
    out, x = [], 100.0
    for _ in range(n):
        x *= math.exp(rng.gauss(0, 0.02))
        out.append(round(x, 4))
    return out


def rand_trades(n, desks="abc", syms=("A", "B", "C")):
    return pd.DataFrame({
        "desk": [rng.choice(desks) for _ in range(n)],
        "sym": [rng.choice(syms) for _ in range(n)],
        "px": [round(rng.uniform(95, 105), 2) for _ in range(n)],
        "qty": [rng.randint(1, 500) for _ in range(n)],
        "pnl": [round(rng.gauss(0, 10), 2) for _ in range(n)],
    })


def rand_ticks(n, span=400):
    secs = sorted(rng.sample(range(span), n))
    return [ts(s + rng.random()) for s in secs], [round(rng.uniform(99, 101), 2) for _ in secs], [rng.randint(1, 9) for _ in secs]


def loop_bars(times, pxs, qtys):
    """{minute start: (open, high, low, close, volume, vwap)} for minutes with ticks."""
    out = {}
    for t, p, q in zip(times, pxs, qtys):
        m = t.replace(second=0, microsecond=0)
        if m not in out:
            out[m] = [p, p, p, p, 0, 0.0]
        b = out[m]
        b[1], b[2], b[3] = max(b[1], p), min(b[2], p), p
        b[4] += q
        b[5] += p * q
    return {m: (o, h, lo, c, v, pv / v) for m, (o, h, lo, c, v, pv) in out.items()}


# ---------------------------------------------------------------- listing tests
def t_np_returns(ns):
    for _ in range(100):
        p = rand_prices(rng.randint(2, 30))
        assert np.allclose(ns["simple_returns"](p), loop_returns(p))
        assert np.allclose(ns["log_returns"](p), [math.log(p[i + 1] / p[i]) for i in range(len(p) - 1)])
        assert close(ns["max_drawdown"](p), loop_drawdown(p))
    assert ns["max_drawdown"]([1, 2, 3]) == 0.0
    for _ in range(50):
        s = [rng.uniform(-2, 2) for _ in range(20)]
        th = rng.uniform(0, 1)
        assert list(ns["positions"](s, th)) == [1 if x > th else -1 if x < -th else 0 for x in s]


def t_np_broadcast(ns):
    for _ in range(50):
        n, k = rng.randint(3, 12), rng.randint(1, 5)
        X = [[rng.uniform(-5, 5) for _ in range(k)] for _ in range(n)]
        Z = ns["zscore_columns"](X)
        for j in range(k):
            col = [r[j] for r in X]
            mu = sum(col) / n
            sd = math.sqrt(sum((c - mu) ** 2 for c in col) / n)
            assert all(close(Z[i][j], (X[i][j] - mu) / sd, 1e-7) for i in range(n))
        a, b = [rng.uniform(-9, 9) for _ in range(n)], [rng.uniform(-9, 9) for _ in range(k)]
        D = ns["pairwise_abs_diff"](a, b)
        assert D.shape == (n, k) and all(close(D[i][j], abs(a[i] - b[j])) for i in range(n) for j in range(k))
        C = ns["cov_matrix"](X)
        for i in range(k):
            for j in range(k):
                ci, cj = [r[i] for r in X], [r[j] for r in X]
                mi, mj = sum(ci) / n, sum(cj) / n
                assert close(C[i][j], sum((x - mi) * (y - mj) for x, y in zip(ci, cj)) / (n - 1), 1e-7)


def t_np_fast(ns):
    for _ in range(100):
        x = [rng.uniform(-5, 5) for _ in range(rng.randint(1, 30))]
        w = rng.randint(1, len(x))
        got = ns["rolling_mean"](x, w)
        want = [sum(x[i:i + w]) / w for i in range(len(x) - w + 1)]
        assert len(got) == len(want) and np.allclose(got, want)
    est, se = ns["mc_call"](100, 100, 0.2, 1, 200_000, seed=3)
    assert abs(est - bs_call0(100, 100, 0.2, 1)) < 4 * se and 0.02 < se < 0.04
    est, se = ns["mc_call"](100, 110, 0.3, 0.5, 200_000, seed=4)
    assert abs(est - bs_call0(100, 110, 0.3, 0.5)) < 4 * se
    assert ns["mc_call"](100, 100, 0.2, 1, 1000, seed=5) == ns["mc_call"](100, 100, 0.2, 1, 1000, seed=5)


def t_pd_select(ns):
    for _ in range(40):
        t = rand_trades(rng.randint(0, 25))
        before = t.copy()
        m, syms = rng.randint(1, 500), rng.sample(["A", "B", "C"], rng.randint(1, 2))
        got = ns["big_fills"](t, m, syms)
        want = sorted([r for r in t.itertuples() if r.qty >= m and r.sym in syms], key=lambda r: -r.qty)
        assert list(got["qty"]) == [r.qty for r in want]
        assert set(got.index) == {r.Index for r in want}
        n = ns["add_notional"](t)
        assert all(close(v, p * q) for v, p, q in zip(n["notional"], t["px"], t["qty"]))
        assert "notional" not in t.columns and t.equals(before)


def t_pd_groupby(ns):
    for _ in range(40):
        t = rand_trades(rng.randint(1, 30))
        s = ns["desk_summary"](t)
        for d in set(t["desk"]):
            rows = t[t.desk == d]
            assert s.loc[d, "n"] == len(rows) and s.loc[d, "qty"] == rows.qty.sum()
            assert close(s.loc[d, "vwap"], sum(p * q for p, q in zip(rows.px, rows.qty)) / rows.qty.sum())
        assert len(s) == t.desk.nunique()
        t = t.assign(pnl=[abs(x) + 1 for x in t.pnl])
        share = ns["pnl_share"](t)
        totals = {d: t[t.desk == d].pnl.sum() for d in set(t.desk)}
        assert all(close(share[i], t.pnl[i] / totals[t.desk[i]]) for i in t.index)


def t_pd_asof(ns):
    for _ in range(40):
        syms = ["A", "B"]
        q = pd.DataFrame({"t": [ts(rng.randint(0, 60)) for _ in range(12)], "sym": [rng.choice(syms) for _ in range(12)]})
        q["bid"] = [round(rng.uniform(99, 100), 2) for _ in range(12)]
        q["ask"] = q["bid"] + 0.02
        tr = pd.DataFrame({"t": [ts(rng.randint(0, 70)) for _ in range(8)], "sym": [rng.choice(syms) for _ in range(8)],
                           "px": [round(rng.uniform(99, 100), 2) for _ in range(8)]})
        got = ns["mark_trades"](tr, q).sort_values(["t", "sym", "px"]).reset_index(drop=True)
        rows = []
        for r in tr.itertuples():
            prior = q[(q.sym == r.sym) & (q.t <= r.t)]
            if len(prior):
                latest = prior[prior.t == prior.t.max()].iloc[-1]
                mid = (latest.bid + latest.ask) / 2
                rows.append((r.t, r.sym, r.px, latest.bid, (r.px - mid) / mid * 1e4))
            else:
                rows.append((r.t, r.sym, r.px, math.nan, math.nan))
        rows.sort(key=lambda x: (x[0], x[1], x[2]))
        assert len(got) == len(rows)
        for g, w in zip(got.itertuples(), rows):
            if math.isnan(w[3]):
                assert math.isnan(g.bid) and math.isnan(g.edge_bps)
            elif (q[(q.sym == w[1]) & (q.t == q[(q.sym == w[1]) & (q.t <= w[0])].t.max())].shape[0]) == 1:
                assert close(g.bid, w[3]) and close(g.edge_bps, w[4], 1e-7)


def t_pd_time(ns):
    for _ in range(30):
        times, pxs, qtys = rand_ticks(rng.randint(1, 25))
        ticks = pd.DataFrame({"px": pxs, "qty": qtys}, index=pd.DatetimeIndex(times))
        got = ns["minute_bars"](ticks)
        want = loop_bars(times, pxs, qtys)
        assert len(got) == len(want)
        for m, row in got.iterrows():
            o, h, lo, c, v, vw = want[m.to_pydatetime()]
            assert (row.open, row.high, row.low, row.close, row.volume) == (o, h, lo, c, v) and close(row.vwap, vw)
    for _ in range(30):
        p = pd.Series(rand_prices(rng.randint(5, 40)))
        fast, slow = rng.randint(1, 3), rng.randint(3, 6)
        got = ns["crossover_pnl"](p, fast, slow)
        want = [0.0]
        for i in range(1, len(p)):
            j = i - 1  # yesterday's signal
            on = j >= slow - 1 and sum(p[j - fast + 1:j + 1]) / fast > sum(p[j - slow + 1:j + 1]) / slow
            want.append((p[i] / p[i - 1] - 1) if on else 0.0)
        assert np.allclose(got.values, want)


def t_pl_basics(ns):
    for _ in range(40):
        t = rand_trades(rng.randint(1, 30))
        pt = pl.DataFrame({c: t[c].tolist() for c in t.columns})
        r = ns["desk_report"](pt)
        assert r["qty"].to_list() == sorted(r["qty"].to_list(), reverse=True)
        for row in r.iter_rows(named=True):
            rows = t[t.desk == row["desk"]]
            assert row["n"] == len(rows) and row["qty"] == rows.qty.sum()
            assert close(row["vwap"], sum(p * q for p, q in zip(rows.px, rows.qty)) / rows.qty.sum())
        pt = pt.with_columns(pnl=pl.col("pnl").abs() + 1)
        sh = ns["with_share"](pt)
        totals = {}
        for d, x in zip(pt["desk"], pt["pnl"]):
            totals[d] = totals.get(d, 0) + x
        assert all(close(s, x / totals[d]) for s, x, d in zip(sh["share"], pt["pnl"], pt["desk"]))
        signed = pt.with_columns(qty=pl.Series([rng.choice([-1, 1]) * q for q in pt["qty"]]))
        sides = ns["label_side"](signed)["side"].to_list()
        assert sides == ["buy" if q > 0 else "sell" for q in signed["qty"]]


def t_pl_lazy(ns):
    for _ in range(40):
        t = rand_trades(rng.randint(0, 30))
        pt = pl.DataFrame({"sym": t["sym"].tolist(), "qty": [rng.choice([-1, 1]) * q for q in t["qty"]]},
                          schema={"sym": pl.String, "qty": pl.Int64})
        m = rng.randint(1, 400)
        got = ns["big_trade_volume"](pt, m)
        want = {}
        for s, q in zip(pt["sym"], pt["qty"]):
            if abs(q) >= m:
                want[s] = want.get(s, 0) + abs(q)
        assert got["sym"].to_list() == sorted(want) and got["big_qty"].to_list() == [want[s] for s in sorted(want)]


def t_pl_time(ns):
    for _ in range(30):
        times, pxs, qtys = rand_ticks(rng.randint(1, 25))
        order = list(range(len(times)))
        rng.shuffle(order)  # the function must sort
        ticks = pl.DataFrame({"t": [times[i] for i in order], "px": [pxs[i] for i in order], "qty": [qtys[i] for i in order]})
        got = ns["minute_bars_pl"](ticks)
        want = loop_bars(times, pxs, qtys)
        assert got.height == len(want)
        for row in got.iter_rows(named=True):
            o, h, lo, c, v, vw = want[row["t"]]
            assert (row["open"], row["high"], row["low"], row["close"], row["volume"]) == (o, h, lo, c, v) and close(row["vwap"], vw)
    for _ in range(30):
        qt = sorted(rng.sample(range(60), 10))
        quotes = pl.DataFrame({"t": [ts(s) for s in qt], "sym": [rng.choice("AB") for _ in qt], "bid": [round(rng.uniform(99, 100), 2) for _ in qt]})
        quotes = quotes.with_columns(ask=pl.col("bid") + 0.02)
        tt = [rng.randint(0, 70) for _ in range(8)]
        trades = pl.DataFrame({"t": [ts(s) for s in tt], "sym": [rng.choice("AB") for _ in tt], "px": [round(rng.uniform(99, 100), 2) for _ in tt]})
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            got = ns["mark_trades_pl"](trades, quotes)
        for row in got.iter_rows(named=True):
            prior = [r for r in quotes.iter_rows(named=True) if r["sym"] == row["sym"] and r["t"] <= row["t"]]
            if not prior:
                assert row["bid"] is None and row["edge_bps"] is None
            else:
                last = prior[-1]
                mid = (last["bid"] + last["ask"]) / 2
                assert close(row["bid"], last["bid"]) and close(row["edge_bps"], (row["px"] - mid) / mid * 1e4, 1e-7)
    for _ in range(30):
        rows = [(s, d, round(rng.uniform(50, 150), 2)) for s in "ABC" for d in rng.sample(range(20), rng.randint(1, 6))]
        rng.shuffle(rows)
        df = pl.DataFrame({"sym": [r[0] for r in rows], "t": [r[1] for r in rows], "px": [r[2] for r in rows]})
        got = ns["log_returns_by_symbol"](df)
        for s in "ABC":
            series = sorted((d, p) for sym, d, p in rows if sym == s)
            want = [None] + [math.log(series[i][1] / series[i - 1][1]) for i in range(1, len(series))]
            sub = got.filter(pl.col("sym") == s)
            assert sub["t"].to_list() == [d for d, _ in series]
            for g, w in zip(sub["ret"].to_list(), want):
                assert (g is None and w is None) or close(g, w)


def t_md_wide(ns):
    for _ in range(30):
        dates = pd.date_range("2026-01-05", periods=8, freq="D")
        rows = []
        for s in "ABC":
            for d in sorted(rng.sample(list(dates), rng.randint(1, 8))):
                rows.append((d, s, round(rng.uniform(10, 20), 2)))
        rng.shuffle(rows)
        long = pd.DataFrame(rows, columns=["date", "sym", "px"])
        got = ns["wide_returns"](long)
        all_dates = sorted({r[0] for r in rows})
        assert list(got.index) == all_dates
        for s in "ABC":
            px = {d: p for d, sym, p in rows if sym == s}
            for i, d in enumerate(all_dates):
                prev = all_dates[i - 1] if i else None
                want = px[d] / px[prev] - 1 if i and d in px and prev in px else math.nan
                g = got.loc[d, s]
                assert (math.isnan(want) and math.isnan(g)) or close(g, want)


def t_md_clean(ns):
    for _ in range(40):
        n = rng.randint(1, 20)
        base = pd.DataFrame({"t": [ts(rng.randint(0, 30)) for _ in range(n)], "id": range(n),
                             "px": [round(rng.choice([100, 100.5, 101, 130]), 2) for _ in range(n)]})
        raw = pd.concat([base, base.sample(rng.randint(0, n), random_state=rng.randint(0, 99))]).sample(frac=1, random_state=1)
        got = ns["clean_trades"](raw, 0.1)
        assert len(got) == n and got["id"].nunique() == n
        assert list(got["t"]) == sorted(got["t"])
        px = list(got["px"])
        for i, p in enumerate(px):
            window = sorted(px[max(0, i - 2):i + 3])
            m = len(window)
            med = window[m // 2] if m % 2 else (window[m // 2 - 1] + window[m // 2]) / 2
            assert bool(got["bad"].iloc[i]) == (abs(p / med - 1) > 0.1)


def t_md_backtest(ns):
    for _ in range(50):
        n = rng.randint(2, 30)
        p = pd.Series(rand_prices(n))
        sig = pd.Series([rng.choice([-1.0, 0.0, 0.5, 1.0]) for _ in range(n)])
        cost = rng.choice([0.0, 0.0005, 0.001])
        got = ns["backtest"](p, sig, cost)
        want, prev = [], 0.0
        for i in range(n):
            pos = sig[i - 1] if i else 0.0
            r = p[i] / p[i - 1] - 1 if i else 0.0
            want.append(pos * r - cost * abs(pos - prev))
            prev = pos
        assert np.allclose(got.values, want)
        d = pd.Series([rng.gauss(0.001, 0.01) for _ in range(40)])
        assert close(ns["sharpe"](d), math.sqrt(252) * d.mean() / d.std())
    assert ns["sharpe"](pd.Series([0.01, 0.01])) == 0.0


TESTS = {name[2:]: fn for name, fn in globals().items() if name.startswith("t_") and callable(fn)}
