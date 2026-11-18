// Data drills: short NumPy, pandas and Polars exercises that run in the browser (js/code-worker.js,
// Pyodide with numpy 2.0, pandas 2.2 and Polars 1.18), linked from the data-tools chapters of the
// quant dev handbook (dev-part6.js). Each `test` is Python: run() gets `solution`, the namespace of
// your code, and returns [name, passed, detail] for each case. research/verify_data.py checks that
// every reference solution passes, the starter code fails, and common mistakes are caught.
(function () {
  const HEAD = `
import math, time
import numpy as np
import pandas as pd

def need(name):
    f = solution.get(name)
    if f is None:
        raise NameError('Define a function called ' + name)
    def call(*args, **kwargs):
        out = f(*args, **kwargs)
        if out is None:
            raise ValueError(name + ' returned None: did you forget to return the result?')
        return out
    return call

def case(name, check):
    try:
        ok, why = check()
        return [name, bool(ok), why]
    except (KeyboardInterrupt, SystemExit):
        raise
    except BaseException as e:  # Polars reports some misuse as a PanicException, not an Exception
        return [name, False, type(e).__name__ + ': ' + str(e).strip().split(chr(10))[0]]

def near(a, b, eps=1e-9):
    return abs(a - b) <= eps * max(1.0, abs(a), abs(b))

def same_list(got, want, eps=1e-9):
    got, want = list(got), list(want)
    if len(got) != len(want):
        return False, 'got %d values, expected %d' % (len(got), len(want))
    for i, (g, w) in enumerate(zip(got, want)):
        gm = g is None or (isinstance(g, float) and math.isnan(g))
        wm = w is None or (isinstance(w, float) and math.isnan(w))
        if gm != wm or (not wm and not near(float(g), float(w), eps)):
            return False, 'value %d: got %r, expected %r' % (i, g, w)
    return True, 'all %d values match' % len(want)

def walk(seed, n=60):
    r = np.random.default_rng(seed)
    return [float(x) for x in np.round(100 * np.exp(np.cumsum(r.normal(0, 0.02, n))), 4)]

def stamp(sec):
    return pd.Timestamp('2026-03-02 09:00:00') + pd.Timedelta(seconds=float(sec))

def timed(call):
    t0 = time.perf_counter()
    out = call()
    return out, time.perf_counter() - t0

def fast_enough(name, call, ref_call, factor=10, floor=0.15):
    def chk():
        base = min(timed(ref_call)[1] for _ in range(2))
        _, took = timed(call)
        limit = factor * base + floor
        return took <= limit, 'took %.2f s; a vectorised version takes about %.2f s here' % (took, base)
    return case(name, chk)
`;
  const PL = `
import polars as pl

def pl_rows(df, cols):
    return [tuple(r[c] for c in cols) for r in df.iter_rows(named=True)]
`;

  const ITEMS = [
    // ------------------------------------------------------------------ NumPy
    { id: 'np-drawdown', lib: 'numpy', chapter: 'dsa-numpy', title: 'Maximum drawdown without a loop',
      task: '<p>Write <code>max_drawdown(prices)</code>: the worst fall from a running peak, as a negative fraction (for example −0.25 for a 25% fall), or 0.0 if prices never fall. <code>prices</code> is a list or array. Use NumPy, not a Python loop: one test has a million prices.</p>',
      hint: 'np.maximum.accumulate gives the running peak.',
      starter: 'import numpy as np\n\n\ndef max_drawdown(prices):\n    p = np.asarray(prices, dtype=float)\n    # The running peak, then the worst value of p / peak - 1\n    pass\n',
      sol: 'import numpy as np\n\n\ndef max_drawdown(prices):\n    p = np.asarray(prices, dtype=float)\n    peak = np.maximum.accumulate(p)\n    return float((p / peak - 1).min())\n',
      test: `${HEAD}
def ref(p):
    worst, peak = 0.0, -math.inf
    for x in p:
        peak = max(peak, x)
        worst = min(worst, x / peak - 1)
    return worst

def run():
    f, out = need('max_drawdown'), []
    for name, p in [('The example: 100, 120, 90, 110', [100, 120, 90, 110]), ('Prices that only rise', [1.0, 2, 3, 4]),
                    ('One price', [50.0]), ('A 500-day random walk', walk(7, 500))]:
        out.append(case(name, lambda p=p: (lambda g, w: (near(g, w), 'got %.6g, expected %.6g' % (g, w)))(float(f(p)), ref(p))))
    big = np.array(walk(8, 1_000_000))
    out.append(fast_enough('A million prices, fast', lambda: f(big), lambda: (big / np.maximum.accumulate(big) - 1).min()))
    return out
` },
    { id: 'np-zscore', lib: 'numpy', chapter: 'dsa-numpy', title: 'Standardise every column with broadcasting',
      task: '<p>Write <code>zscore_columns(X)</code> for a 2-D array with one row per day and one column per stock. Return an array of the same shape in which each column has had its own mean subtracted and been divided by its own standard deviation (NumPy\'s default, ddof = 0). Don\'t modify X, and don\'t loop over columns.</p>',
      hint: 'X.mean(axis=0) has one value per column, and broadcasts against X.',
      starter: 'import numpy as np\n\n\ndef zscore_columns(X):\n    X = np.asarray(X, dtype=float)\n    pass\n',
      sol: 'import numpy as np\n\n\ndef zscore_columns(X):\n    X = np.asarray(X, dtype=float)\n    return (X - X.mean(axis=0)) / X.std(axis=0)\n',
      test: `${HEAD}
def ref(X):
    X = [list(map(float, r)) for r in X]
    n, k = len(X), len(X[0])
    out = [[0.0] * k for _ in range(n)]
    for j in range(k):
        col = [r[j] for r in X]
        mu = sum(col) / n
        sd = math.sqrt(sum((c - mu) ** 2 for c in col) / n)
        for i in range(n):
            out[i][j] = (X[i][j] - mu) / sd
    return out

def check(X):
    got = np.asarray(need('zscore_columns')(X), dtype=float)
    want = np.array(ref(X))
    if got.shape != want.shape:
        return False, 'shape %s, expected %s' % (got.shape, want.shape)
    worst = float(np.abs(got - want).max())
    return worst < 1e-9, 'largest difference %.3g' % worst

def run():
    r = np.random.default_rng(3)
    small = np.array([[1.0, 10], [2, 20], [3, 60]])
    rand = r.normal(0, 1, (50, 5)) * [1, 2, 3, 4, 5] + [0, 1, -1, 10, 100]
    out = [case('The example (3 days, 2 stocks)', lambda: check(small)), case('50 days, 5 stocks on different scales', lambda: check(rand))]
    def untouched():
        X = rand.copy()
        need('zscore_columns')(X)
        return bool(np.array_equal(X, rand)), 'X must not be changed'
    out.append(case('X is left unchanged', untouched))
    big = r.normal(0, 1, (200_000, 10))
    out.append(fast_enough('200,000 rows, fast', lambda: need('zscore_columns')(big), lambda: (big - big.mean(axis=0)) / big.std(axis=0)))
    return out
` },
    { id: 'np-rolling', lib: 'numpy', chapter: 'dsa-numpy', title: 'A rolling mean in O(n)',
      task: '<p>Write <code>rolling_mean(x, w)</code>: the mean of every full window of <code>w</code> consecutive values, as an array of length <code>len(x) - w + 1</code>. It must take O(n) time whatever <code>w</code> is: one test has 200,000 values and a window of 5,000.</p>',
      hint: 'With c the cumulative sum and a 0 in front, the sum of x[i:i+w] is c[i+w] − c[i].',
      starter: 'import numpy as np\n\n\ndef rolling_mean(x, w):\n    x = np.asarray(x, dtype=float)\n    pass\n',
      sol: 'import numpy as np\n\n\ndef rolling_mean(x, w):\n    c = np.cumsum(np.concatenate(([0.0], np.asarray(x, dtype=float))))\n    return (c[w:] - c[:-w]) / w\n',
      test: `${HEAD}
def ref(x, w):
    return [sum(x[i:i + w]) / w for i in range(len(x) - w + 1)]

def run():
    f, out = need('rolling_mean'), []
    r = np.random.default_rng(4)
    rand = [float(v) for v in r.normal(0, 1, 200)]
    for name, x, w in [('1, 2, 3, 4, 5 with w = 2', [1.0, 2, 3, 4, 5], 2), ('w = 1 returns x', [3.0, 1, 4, 1, 5], 1),
                       ('w = len(x) gives one value', [2.0, 4, 6], 3), ('200 random values, w = 7', rand, 7)]:
        out.append(case(name, lambda x=x, w=w: same_list(f(x, w), ref(x, w), 1e-7)))
    big = r.normal(0, 1, 200_000)
    def base():
        c = np.cumsum(np.concatenate(([0.0], big)))
        return (c[5000:] - c[:-5000]) / 5000
    out.append(fast_enough('200,000 values, w = 5,000, fast', lambda: f(big, 5000), base))
    return out
` },
    { id: 'np-mc', lib: 'numpy', chapter: 'dsa-numpy', title: 'Monte Carlo with a seeded generator',
      task: '<p>Write <code>mc_call(s0, k, sigma, t, n, seed)</code> that prices a European call with zero interest rates by simulating <code>n</code> prices at expiry, S = s0 · exp(−σ²t/2 + σ√t · Z) with Z standard normal, and averaging the payoff max(S − k, 0). Return <code>(estimate, standard_error)</code>. Use <code>np.random.default_rng(seed)</code>, so the same seed gives the same answer, and draw all n values at once.</p>',
      hint: 'The standard error is the payoffs\' standard deviation divided by √n.',
      starter: 'import numpy as np\n\n\ndef mc_call(s0, k, sigma, t, n, seed):\n    rng = np.random.default_rng(seed)\n    pass\n',
      sol: 'import numpy as np\n\n\ndef mc_call(s0, k, sigma, t, n, seed):\n    rng = np.random.default_rng(seed)\n    z = rng.standard_normal(n)\n    st = s0 * np.exp(-0.5 * sigma ** 2 * t + sigma * np.sqrt(t) * z)\n    payoff = np.maximum(st - k, 0.0)\n    return float(payoff.mean()), float(payoff.std(ddof=1) / np.sqrt(n))\n',
      test: `${HEAD}
def ncdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def bs(s, k, sig, t):
    d1 = (math.log(s / k) + 0.5 * sig * sig * t) / (sig * math.sqrt(t))
    return s * ncdf(d1) - k * ncdf(d1 - sig * math.sqrt(t))

def true_se(s, k, sig, t, n):
    z = np.random.default_rng(99).standard_normal(400_000)
    pay = np.maximum(s * np.exp(-0.5 * sig * sig * t + sig * math.sqrt(t) * z) - k, 0)
    return pay.std() / math.sqrt(n)

def run():
    f, out = need('mc_call'), []
    for name, args in [('At the money: 100, 100, 20%, 1 year', (100, 100, 0.2, 1.0)), ('Out of the money: 100, 120, 30%, half a year', (100, 120, 0.3, 0.5))]:
        def chk(args=args):
            est, se = f(*args, 200_000, 1)
            want = bs(*args)
            return abs(est - want) < 4 * se, 'got %.4f, Black-Scholes %.4f, standard error %.4f' % (est, want, se)
        out.append(case(name + ': within 4 standard errors of Black-Scholes', chk))
    def se_ok():
        _, se = f(100, 100, 0.2, 1.0, 50_000, 2)
        want = true_se(100, 100, 0.2, 1.0, 50_000)
        return 0.8 < se / want < 1.25, 'standard error %.4f, expected about %.4f' % (se, want)
    out.append(case('The standard error is the right size', se_ok))
    def seeded():
        a, b, c = f(100, 100, 0.2, 1.0, 1000, 5), f(100, 100, 0.2, 1.0, 1000, 5), f(100, 100, 0.2, 1.0, 1000, 6)
        return a == b and a != c, 'the same seed must give the same answer, and a different seed a different one'
    out.append(case('Reproducible with a seed', seeded))
    def base():
        z = np.random.default_rng(0).standard_normal(1_000_000)
        return np.maximum(100 * np.exp(-0.02 + 0.2 * z) - 100, 0).mean()
    out.append(fast_enough('A million paths, fast', lambda: f(100, 100, 0.2, 1.0, 1_000_000, 0), base))
    return out
` },

    // ------------------------------------------------------------------ pandas
    { id: 'pd-vwap', lib: 'pandas', chapter: 'dsa-pandas', title: 'VWAP per symbol with groupby',
      task: '<p><code>trades</code> is a DataFrame with columns <code>sym</code>, <code>px</code> and <code>qty</code>. Write <code>vwap_by_symbol(trades)</code> returning a Series indexed by symbol (sorted) whose values are each symbol\'s volume-weighted average price, Σ px·qty / Σ qty. Don\'t modify <code>trades</code>.</p>',
      hint: 'Aggregate px·qty and qty separately, then divide. The mean of px isn\'t the VWAP.',
      starter: 'import pandas as pd\n\n\ndef vwap_by_symbol(trades):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef vwap_by_symbol(trades):\n    t = trades.assign(pv=trades["px"] * trades["qty"])\n    g = t.groupby("sym")[["pv", "qty"]].sum()\n    return g["pv"] / g["qty"]\n',
      test: `${HEAD}
def ref(t):
    out = {}
    for s, p, q in zip(t['sym'], t['px'], t['qty']):
        a = out.setdefault(s, [0.0, 0])
        a[0] += p * q
        a[1] += q
    return {s: a[0] / a[1] for s, a in out.items()}

def check(t):
    before = t.copy()
    got = need('vwap_by_symbol')(t)
    want = ref(t)
    if not t.equals(before):
        return False, 'trades was modified'
    got = pd.Series(got)
    if sorted(map(str, got.index)) != sorted(want) or list(got.index) != sorted(want):
        return False, 'index %s, expected the symbols in order %s' % (list(got.index), sorted(want))
    return same_list(got.values, [want[s] for s in sorted(want)])

def rand(seed, n):
    r = np.random.default_rng(seed)
    return pd.DataFrame({'sym': r.choice(['MSFT', 'AAPL', 'NVDA'], n), 'px': np.round(r.uniform(95, 105, n), 2), 'qty': r.integers(1, 1000, n)})

def run():
    ex = pd.DataFrame({'sym': ['A', 'B', 'A'], 'px': [100.0, 50.0, 102.0], 'qty': [100, 10, 300]})
    return [case('The example: A trades 100 at 100 and 300 at 102', lambda: check(ex)), case('500 random trades in 3 symbols', lambda: check(rand(1, 500))), case('A single trade', lambda: check(rand(2, 1)))]
` },
    { id: 'pd-share', lib: 'pandas', chapter: 'dsa-pandas', title: 'Each trade\'s share of its desk',
      task: '<p><code>trades</code> has columns <code>desk</code> and <code>pnl</code> (all positive here) and any index. Write <code>pnl_share(trades)</code> returning a Series, aligned with <code>trades</code> (same index, same order), giving each trade\'s P&amp;L divided by its desk\'s total P&amp;L.</p>',
      hint: 'groupby(...).transform("sum") gives every row its group\'s total.',
      starter: 'import pandas as pd\n\n\ndef pnl_share(trades):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef pnl_share(trades):\n    return trades["pnl"] / trades.groupby("desk")["pnl"].transform("sum")\n',
      test: `${HEAD}
def check(t):
    got = need('pnl_share')(t)
    tot = {}
    for d, p in zip(t['desk'], t['pnl']):
        tot[d] = tot.get(d, 0) + p
    want = [p / tot[d] for d, p in zip(t['desk'], t['pnl'])]
    if not isinstance(got, pd.Series):
        return False, 'return a pandas Series, not %s' % type(got).__name__
    if list(got.index) != list(t.index):
        return False, 'the result must keep the index of trades, in the same order'
    return same_list(got.values, want)

def run():
    ex = pd.DataFrame({'desk': ['a', 'a', 'b'], 'pnl': [1.0, 3.0, 5.0]})
    r = np.random.default_rng(5)
    big = pd.DataFrame({'desk': r.choice(list('abcd'), 300), 'pnl': r.uniform(1, 50, 300)}, index=r.permutation(np.arange(1000, 1300)))
    return [case('The example: desk a has 1 and 3, desk b has 5', lambda: check(ex)), case('300 trades with a shuffled index', lambda: check(big))]
` },
    { id: 'pd-asof', lib: 'pandas', chapter: 'dsa-pandas', title: 'Mark trades to the prevailing quote',
      task: '<p><code>trades</code> has columns <code>t</code> (datetime), <code>sym</code> and <code>px</code>; <code>quotes</code> has <code>t</code>, <code>sym</code>, <code>bid</code> and <code>ask</code>. Neither is sorted. Write <code>mark_trades(trades, quotes)</code>: for each trade, the latest quote for the same symbol at or before the trade\'s time. Return the trades sorted by time with the <code>bid</code> and <code>ask</code> columns added, and <code>edge_bps</code> = (px − mid)/mid × 10,000, where mid = (bid + ask)/2. Trades with no earlier quote get <code>NaN</code>.</p>',
      hint: 'pd.merge_asof needs both frames sorted by t, and by="sym".',
      starter: 'import pandas as pd\n\n\ndef mark_trades(trades, quotes):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef mark_trades(trades, quotes):\n    m = pd.merge_asof(trades.sort_values("t"), quotes.sort_values("t"), on="t", by="sym")\n    mid = (m["bid"] + m["ask"]) / 2\n    return m.assign(edge_bps=(m["px"] - mid) / mid * 1e4)\n',
      test: `${HEAD}
def ref(trades, quotes):
    rows = []
    for t, s, p in sorted(zip(trades['t'], trades['sym'], trades['px']), key=lambda x: x[0]):
        prior = [(qt, b, a) for qt, qs, b, a in zip(quotes['t'], quotes['sym'], quotes['bid'], quotes['ask']) if qs == s and qt <= t]
        if prior:
            _, b, a = max(prior, key=lambda x: x[0])
            mid = (b + a) / 2
            rows.append((t, s, b, (p - mid) / mid * 1e4))
        else:
            rows.append((t, s, float('nan'), float('nan')))
    return rows

def check(trades, quotes):
    got = need('mark_trades')(trades.copy(), quotes.copy())
    want = ref(trades, quotes)
    if len(got) != len(want):
        return False, 'got %d rows, expected %d (one per trade)' % (len(got), len(want))
    if list(got['t']) != [w[0] for w in want]:
        return False, 'sort the result by time'
    ok, why = same_list(got['bid'], [w[2] for w in want])
    if not ok:
        return False, 'bid: ' + why
    ok, why = same_list(got['edge_bps'], [w[3] for w in want], 1e-7)
    return ok, ('edge_bps: ' + why) if not ok else why

def run():
    q = pd.DataFrame({'t': [stamp(4), stamp(0), stamp(3)], 'sym': ['X', 'X', 'X'], 'bid': [99.9, 100.0, 100.1], 'ask': [100.1, 100.2, 100.3]})
    tr = pd.DataFrame({'t': [stamp(5), stamp(1), stamp(3)], 'sym': ['X', 'X', 'X'], 'px': [100.0, 100.1, 100.2]})
    early = pd.DataFrame({'t': [stamp(-5), stamp(2)], 'sym': ['X', 'X'], 'px': [99.0, 100.0]})
    r = np.random.default_rng(6)
    qs = sorted(r.choice(600, 40, replace=False))
    q2 = pd.DataFrame({'t': [stamp(s) for s in qs], 'sym': r.choice(['A', 'B'], 40), 'bid': np.round(r.uniform(99, 100, 40), 2)})
    q2['ask'] = q2['bid'] + 0.02
    q2 = q2.sample(frac=1, random_state=1)
    t2 = pd.DataFrame({'t': [stamp(s + 0.5) for s in r.choice(600, 25, replace=False)], 'sym': r.choice(['A', 'B'], 25), 'px': np.round(r.uniform(99, 100, 25), 2)})
    return [case('One symbol, quotes and trades out of order', lambda: check(tr, q)), case('A trade before the first quote gets NaN', lambda: check(early, q)),
            case("Two symbols: never use the other symbol's quote", lambda: check(t2, q2))]
` },
    { id: 'pd-bars', lib: 'pandas', chapter: 'dsa-pandas', title: 'Minute bars from ticks',
      task: '<p><code>ticks</code> is a DataFrame indexed by time (a DatetimeIndex, sorted) with columns <code>px</code> and <code>qty</code>. Write <code>minute_bars(ticks)</code> returning one row per minute that has at least one tick, indexed by the minute\'s start, with columns <code>open</code>, <code>high</code>, <code>low</code>, <code>close</code>, <code>volume</code> (Σ qty) and <code>vwap</code> (Σ px·qty / Σ qty). Minutes without ticks must not appear.</p>',
      hint: 'resample("1min") with ohlc() and sum(), then drop the empty minutes.',
      starter: 'import pandas as pd\n\n\ndef minute_bars(ticks):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef minute_bars(ticks):\n    bars = ticks["px"].resample("1min").ohlc()\n    bars["volume"] = ticks["qty"].resample("1min").sum()\n    pv = (ticks["px"] * ticks["qty"]).resample("1min").sum()\n    bars["vwap"] = pv / bars["volume"]\n    return bars.dropna(subset=["open"])\n',
      test: `${HEAD}
def ref(ticks):
    out = {}
    for t, p, q in zip(ticks.index, ticks['px'], ticks['qty']):
        m = t.floor('1min')
        b = out.get(m)
        if b is None:
            out[m] = b = [p, p, p, p, 0, 0.0]
        b[1], b[2], b[3] = max(b[1], p), min(b[2], p), p
        b[4] += q
        b[5] += p * q
    return {m: (o, h, l, c, v, pv / v) for m, (o, h, l, c, v, pv) in out.items()}

def check(ticks):
    got = need('minute_bars')(ticks)
    want = ref(ticks)
    if sorted(want) != list(got.index):
        return False, 'rows for minutes %s, expected %s' % ([str(x.time()) for x in got.index], [str(x.time()) for x in sorted(want)])
    for m, row in got.iterrows():
        w = want[m]
        g = (row['open'], row['high'], row['low'], row['close'], row['volume'], row['vwap'])
        if not all(near(float(a), float(b)) for a, b in zip(g, w)):
            return False, 'minute %s: got %s, expected %s' % (m.time(), tuple(round(float(x), 4) for x in g), tuple(round(float(x), 4) for x in w))
    return True, '%d bars match' % len(want)

def run():
    ex = pd.DataFrame({'px': [100.0, 101, 99, 102], 'qty': [1, 2, 3, 4]}, index=pd.DatetimeIndex([stamp(10), stamp(50), stamp(80), stamp(180)]))
    r = np.random.default_rng(7)
    secs = np.sort(r.choice(900, 120, replace=False)) + 0.25
    rand = pd.DataFrame({'px': np.round(r.uniform(99, 101, 120), 2), 'qty': r.integers(1, 50, 120)}, index=pd.DatetimeIndex([stamp(s) for s in secs]))
    return [case('The example: ticks at 09:00:10, :50, 09:01:20 and 09:03:00 (no 09:02 bar)', lambda: check(ex)), case('120 ticks over 15 minutes', lambda: check(rand))]
` },

    // ------------------------------------------------------------------ Polars
    { id: 'pl-report', lib: 'polars', chapter: 'dsa-polars', title: 'A desk report with group_by',
      task: '<p><code>trades</code> is a Polars DataFrame with columns <code>desk</code>, <code>px</code> and <code>qty</code>. Write <code>desk_report(trades)</code> returning one row per desk with columns <code>desk</code>, <code>n</code> (number of trades), <code>qty</code> (total quantity) and <code>vwap</code>, sorted by total quantity, largest first.</p>',
      hint: 'group_by("desk").agg(...) with pl.len(), and sort(..., descending=True).',
      starter: 'import polars as pl\n\n\ndef desk_report(trades):\n    pass\n',
      sol: 'import polars as pl\n\n\ndef desk_report(trades):\n    return (\n        trades.group_by("desk")\n        .agg(\n            n=pl.len(),\n            qty=pl.col("qty").sum(),\n            vwap=(pl.col("px") * pl.col("qty")).sum() / pl.col("qty").sum(),\n        )\n        .sort("qty", descending=True)\n    )\n',
      test: `${HEAD}${PL}
def check(df):
    got = need('desk_report')(df)
    acc = {}
    for d, p, q in zip(df['desk'], df['px'], df['qty']):
        a = acc.setdefault(d, [0, 0, 0.0])
        a[0] += 1
        a[1] += q
        a[2] += p * q
    want = sorted(((d, n, q, pv / q) for d, (n, q, pv) in acc.items()), key=lambda x: -x[2])
    for c in ('desk', 'n', 'qty', 'vwap'):
        if c not in got.columns:
            return False, 'missing column ' + c
    rows = pl_rows(got, ['desk', 'n', 'qty', 'vwap'])
    if [r[0] for r in rows] != [w[0] for w in want]:
        return False, 'desks in order %s, expected %s' % ([r[0] for r in rows], [w[0] for w in want])
    for r, w in zip(rows, want):
        if r[1] != w[1] or r[2] != w[2] or not near(r[3], w[3]):
            return False, 'desk %s: got %s, expected %s' % (w[0], r[1:], w[1:])
    return True, '%d desks match' % len(want)

def run():
    ex = pl.DataFrame({'desk': ['a', 'b', 'a'], 'px': [100.0, 50.0, 102.0], 'qty': [100, 10, 300]})
    r = np.random.default_rng(8)
    rand = pl.DataFrame({'desk': [str(x) for x in r.choice(['rates', 'fx', 'equity', 'credit'], 400)], 'px': [float(x) for x in np.round(r.uniform(95, 105, 400), 2)], 'qty': [int(x) for x in r.integers(1, 1000, 400)]})
    return [case('The example: two desks', lambda: check(ex)), case('400 trades on 4 desks', lambda: check(rand))]
` },
    { id: 'pl-over', lib: 'polars', chapter: 'dsa-polars', title: 'Z-scores within groups with over()',
      task: '<p>Write <code>zscore_within(df, by, col)</code> that returns <code>df</code> with a new column <code>z</code>: each value of <code>col</code> minus the mean of its group (rows with the same value of <code>by</code>), divided by the group\'s sample standard deviation (Polars\' default, ddof = 1). Keep the rows in their original order.</p>',
      hint: 'pl.col(col).mean().over(by) is the group mean, on every row.',
      starter: 'import polars as pl\n\n\ndef zscore_within(df, by, col):\n    pass\n',
      sol: 'import polars as pl\n\n\ndef zscore_within(df, by, col):\n    x = pl.col(col)\n    return df.with_columns(z=(x - x.mean().over(by)) / x.std().over(by))\n',
      test: `${HEAD}${PL}
def check(df, by, col):
    got = need('zscore_within')(df, by, col)
    groups = {}
    for g, x in zip(df[by], df[col]):
        groups.setdefault(g, []).append(x)
    stats = {}
    for g, xs in groups.items():
        m = sum(xs) / len(xs)
        stats[g] = (m, math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1)))
    want = [(x - stats[g][0]) / stats[g][1] for g, x in zip(df[by], df[col])]
    if 'z' not in got.columns:
        return False, 'add a column called z'
    if got[col].to_list() != df[col].to_list():
        return False, 'keep the rows in their original order'
    return same_list(got['z'].to_list(), want)

def run():
    ex = pl.DataFrame({'k': ['a', 'a', 'b', 'b', 'b'], 'x': [1.0, 3.0, 2.0, 4.0, 9.0]})
    r = np.random.default_rng(9)
    rand = pl.DataFrame({'sym': [str(s) for s in r.choice(['A', 'B', 'C'], 200)], 'ret': [float(v) for v in r.normal(0, 0.01, 200)]})
    return [case('The example: groups a and b', lambda: check(ex, 'k', 'x')), case('200 returns in 3 symbols', lambda: check(rand, 'sym', 'ret'))]
` },
    { id: 'pl-bars', lib: 'polars', chapter: 'dsa-polars', title: 'Minute bars with group_by_dynamic',
      task: '<p><code>ticks</code> is a Polars DataFrame with columns <code>t</code> (datetime, <b>not sorted</b>), <code>px</code> and <code>qty</code>. Write <code>minute_bars_pl(ticks)</code> returning one row per minute that has ticks, with columns <code>t</code> (the minute\'s start), <code>open</code>, <code>high</code>, <code>low</code>, <code>close</code>, <code>volume</code> and <code>vwap</code>, in time order.</p>',
      hint: 'Sort by t first, then group_by_dynamic("t", every="1m").agg(...).',
      starter: 'import polars as pl\n\n\ndef minute_bars_pl(ticks):\n    pass\n',
      sol: 'import polars as pl\n\n\ndef minute_bars_pl(ticks):\n    return (\n        ticks.sort("t")\n        .group_by_dynamic("t", every="1m")\n        .agg(\n            open=pl.col("px").first(),\n            high=pl.col("px").max(),\n            low=pl.col("px").min(),\n            close=pl.col("px").last(),\n            volume=pl.col("qty").sum(),\n            vwap=(pl.col("px") * pl.col("qty")).sum() / pl.col("qty").sum(),\n        )\n    )\n',
      test: `${HEAD}${PL}
def check(df):
    got = need('minute_bars_pl')(df)
    out = {}
    for t, p, q in sorted(zip(df['t'], df['px'], df['qty']), key=lambda x: x[0]):
        m = t.replace(second=0, microsecond=0)
        b = out.get(m)
        if b is None:
            out[m] = b = [p, p, p, p, 0, 0.0]
        b[1], b[2], b[3] = max(b[1], p), min(b[2], p), p
        b[4] += q
        b[5] += p * q
    cols = ['t', 'open', 'high', 'low', 'close', 'volume', 'vwap']
    for c in cols:
        if c not in got.columns:
            return False, 'missing column ' + c
    rows = pl_rows(got, cols)
    if [r[0] for r in rows] != sorted(out):
        return False, 'bars for %s, expected %s' % ([str(r[0].time()) for r in rows], [str(m.time()) for m in sorted(out)])
    for r in rows:
        o, h, l, c, v, pv = out[r[0]]
        if not all(near(float(a), float(b)) for a, b in zip(r[1:], (o, h, l, c, v, pv / v))):
            return False, 'minute %s: got %s' % (r[0].time(), r[1:])
    return True, '%d bars match' % len(out)

def run():
    base = stamp(0).to_pydatetime()
    from datetime import timedelta
    def frame(secs, px, qty):
        return pl.DataFrame({'t': [base + timedelta(seconds=float(s)) for s in secs], 'px': [float(p) for p in px], 'qty': [int(q) for q in qty]})
    ex = frame([180, 10, 80, 50], [102, 100, 99, 101], [4, 1, 3, 2])
    r = np.random.default_rng(10)
    secs = r.choice(900, 120, replace=False) + 0.5
    rand = frame(secs, np.round(r.uniform(99, 101, 120), 2), r.integers(1, 50, 120))
    return [case('The example, out of order (no 09:02 bar)', lambda: check(ex)), case('120 shuffled ticks over 15 minutes', lambda: check(rand))]
` },
    { id: 'pl-returns', lib: 'polars', chapter: 'dsa-polars', title: 'Returns per symbol without leaking',
      task: '<p><code>prices</code> is long data: columns <code>sym</code>, <code>t</code> (an integer day) and <code>px</code>, in any order. Write <code>log_returns_by_symbol(prices)</code> returning the rows sorted by <code>sym</code> then <code>t</code>, with a column <code>ret</code> = ln(px / previous px of the same symbol). Each symbol\'s first row gets null: one symbol\'s last price must never be used for the next symbol\'s first return.</p>',
      hint: 'shift(1) inside .over("sym").',
      starter: 'import polars as pl\n\n\ndef log_returns_by_symbol(prices):\n    pass\n',
      sol: 'import polars as pl\n\n\ndef log_returns_by_symbol(prices):\n    return prices.sort("sym", "t").with_columns(\n        ret=(pl.col("px") / pl.col("px").shift(1)).log().over("sym")\n    )\n',
      test: `${HEAD}${PL}
def check(df):
    got = need('log_returns_by_symbol')(df)
    rows = sorted(zip(df['sym'], df['t'], df['px']))
    want, prev = [], {}
    for s, t, p in rows:
        want.append(math.log(p / prev[s]) if s in prev else None)
        prev[s] = p
    if 'ret' not in got.columns:
        return False, 'add a column called ret'
    if pl_rows(got, ['sym', 't']) != [(s, t) for s, t, _ in rows]:
        return False, 'sort the rows by sym, then t'
    return same_list(got['ret'].to_list(), want)

def run():
    ex = pl.DataFrame({'sym': ['B', 'A', 'A', 'B', 'A'], 't': [1, 2, 1, 2, 3], 'px': [50.0, 110.0, 100.0, 55.0, 99.0]})
    r = np.random.default_rng(11)
    rows = [(s, int(d), float(np.round(r.uniform(20, 200), 2))) for s in ['A', 'B', 'C', 'D'] for d in r.choice(60, 15, replace=False)]
    r.shuffle(rows)
    rand = pl.DataFrame({'sym': [x[0] for x in rows], 't': [x[1] for x in rows], 'px': [x[2] for x in rows]})
    return [case('The example: two symbols, shuffled', lambda: check(ex)), case('4 symbols, 15 days each', lambda: check(rand))]
` },

    // ------------------------------------------------------------------ market data
    { id: 'md-wide', lib: 'market', chapter: 'dsa-marketdata', title: 'Daily returns from long data',
      task: '<p><code>long</code> has columns <code>date</code>, <code>sym</code> and <code>px</code>, one row per stock per day it traded, in any order. Write <code>wide_returns(long)</code> returning a DataFrame with one row per date (sorted) and one column per symbol, holding simple daily returns. Where a stock has no price on a day, or none on the day before, the return must be <code>NaN</code>: don\'t invent a return across a gap.</p>',
      hint: 'pivot, sort_index, then pct_change(fill_method=None).',
      starter: 'import pandas as pd\n\n\ndef wide_returns(long):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef wide_returns(long):\n    wide = long.pivot(index="date", columns="sym", values="px").sort_index()\n    return wide.pct_change(fill_method=None)\n',
      test: `${HEAD}
def check(long):
    got = need('wide_returns')(long)
    dates = sorted(set(long['date']))
    px = {(d, s): p for d, s, p in zip(long['date'], long['sym'], long['px'])}
    if list(got.index) != dates:
        return False, 'one row per date, in order'
    for s in sorted(set(long['sym'])):
        if s not in got.columns:
            return False, 'missing column ' + s
        want = [px[(d, s)] / px[(dates[i - 1], s)] - 1 if i and (d, s) in px and (dates[i - 1], s) in px else float('nan') for i, d in enumerate(dates)]
        ok, why = same_list([float(x) for x in got[s]], want)
        if not ok:
            return False, s + ': ' + why
    return True, 'every return matches'

def run():
    d = pd.date_range('2026-03-02', periods=5, freq='D')
    ex = pd.DataFrame({'date': list(d) + list(d[[0, 1, 3, 4]]), 'sym': ['A'] * 5 + ['B'] * 4, 'px': [10.0, 11, 12, 13, 14, 20, 21, 22, 23]}).sample(frac=1, random_state=2)
    r = np.random.default_rng(12)
    days = pd.date_range('2026-01-05', periods=30, freq='D')
    rows = [(days[i], s, float(np.round(r.uniform(10, 50), 2))) for s in 'WXYZ' for i in sorted(r.choice(30, 22, replace=False))]
    rand = pd.DataFrame(rows, columns=['date', 'sym', 'px']).sample(frac=1, random_state=3)
    return [case('The example: B misses day 3', lambda: check(ex)), case('4 stocks with gaps over 30 days', lambda: check(rand))]
` },
    { id: 'md-backtest', lib: 'market', chapter: 'dsa-marketdata', title: 'A backtest with costs and no look-ahead',
      task: '<p><code>prices</code> and <code>signal</code> are Series with the same index, one value per day. The signal (a position from −1 to 1) is decided at each day\'s close, so it is held over the <i>next</i> day. Write <code>backtest(prices, signal, cost)</code> returning the daily net return: yesterday\'s signal × today\'s return, minus <code>cost</code> × the size of today\'s change in position. The first day has no position, and returns 0 unless that is a change.</p>',
      hint: 'pos = signal.shift(1).fillna(0); turnover = |pos.diff()|, with the first day\'s turnover being |pos|.',
      starter: 'import pandas as pd\n\n\ndef backtest(prices, signal, cost):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef backtest(prices, signal, cost):\n    pos = signal.shift(1).fillna(0.0)\n    gross = pos * prices.pct_change().fillna(0.0)\n    turnover = pos.diff().abs().fillna(pos.abs())\n    return gross - cost * turnover\n',
      test: `${HEAD}
def ref(p, s, cost):
    out, prev = [], 0.0
    for i in range(len(p)):
        pos = s.iloc[i - 1] if i else 0.0
        r = p.iloc[i] / p.iloc[i - 1] - 1 if i else 0.0
        out.append(pos * r - cost * abs(pos - prev))
        prev = pos
    return out

def check(p, s, cost):
    got = need('backtest')(p, s, cost)
    return same_list(list(got), ref(p, s, cost))

def run():
    ex_p, ex_s = pd.Series([100.0, 102, 101]), pd.Series([1.0, 1, 0])
    r = np.random.default_rng(13)
    p = pd.Series(walk(14, 250), index=pd.date_range('2026-01-01', periods=250, freq='D'))
    s = pd.Series(r.choice([-1.0, -0.5, 0, 0.5, 1], 250), index=p.index)
    return [case('The example, no costs: day 3 must lose 0.98%', lambda: check(ex_p, ex_s, 0.0)), case('250 days, costs of 10 bp per unit traded', lambda: check(p, s, 0.001))]
` },
    { id: 'md-clean', lib: 'market', chapter: 'dsa-marketdata', title: 'Clean a day of trades',
      task: '<p><code>trades</code> has columns <code>t</code> (datetime), <code>id</code> (a trade ID) and <code>px</code>, out of order, and some rows appear twice because a feed was replayed. Write <code>clean_trades(trades, max_dev)</code> that sorts by time (keeping the original order for equal times), drops rows that are exact duplicates of an earlier row, resets the index, and adds a boolean column <code>bad</code>: True where px differs by more than <code>max_dev</code> (a fraction) from the median of the 5 trades centred on it (fewer at the start and end). Two trades with the same time and price but different IDs are both real.</p>',
      hint: 'sort_values("t", kind="stable"), drop_duplicates(), then rolling(5, center=True, min_periods=1).median().',
      starter: 'import pandas as pd\n\n\ndef clean_trades(trades, max_dev):\n    pass\n',
      sol: 'import pandas as pd\n\n\ndef clean_trades(trades, max_dev):\n    t = trades.sort_values("t", kind="stable").drop_duplicates().reset_index(drop=True)\n    med = t["px"].rolling(5, center=True, min_periods=1).median()\n    return t.assign(bad=(t["px"] / med - 1).abs() > max_dev)\n',
      test: `${HEAD}
def ref(trades, max_dev):
    seen, rows = set(), []
    for t, i, p in sorted(zip(trades['t'], trades['id'], trades['px']), key=lambda x: x[0]):
        if (t, i, p) not in seen:
            seen.add((t, i, p))
            rows.append((t, i, p))
    out = []
    for k, (t, i, p) in enumerate(rows):
        w = sorted(x[2] for x in rows[max(0, k - 2):k + 3])
        n = len(w)
        med = w[n // 2] if n % 2 else (w[n // 2 - 1] + w[n // 2]) / 2
        out.append((t, i, p, abs(p / med - 1) > max_dev))
    return out

def check(trades, max_dev):
    got = need('clean_trades')(trades.copy(), max_dev)
    want = ref(trades, max_dev)
    if len(got) != len(want):
        return False, 'got %d rows, expected %d' % (len(got), len(want))
    if list(got.index) != list(range(len(want))):
        return False, 'reset the index to 0, 1, 2, ...'
    if [(a, b) for a, b in zip(got['t'], got['id'])] != [(w[0], w[1]) for w in want]:
        return False, 'rows are not sorted by time, or the wrong rows were dropped'
    bad = [bool(x) for x in got['bad']]
    want_bad = [w[3] for w in want]
    if bad != want_bad:
        k = next(j for j in range(len(bad)) if bad[j] != want_bad[j])
        return False, 'row %d (px %s): bad = %s, expected %s' % (k, want[k][2], bad[k], want_bad[k])
    return True, '%d rows, %d flagged' % (len(want), sum(want_bad))

def run():
    base = pd.DataFrame({'t': [stamp(s) for s in (5, 1, 3, 3, 9, 7)], 'id': [5, 1, 3, 4, 9, 7], 'px': [100.0, 100.2, 100.1, 100.1, 130.0, 100.3]})
    ex = pd.concat([base, base.iloc[[0, 2]]]).reset_index(drop=True)
    r = np.random.default_rng(15)
    n = 80
    b2 = pd.DataFrame({'t': [stamp(int(s)) for s in r.integers(0, 300, n)], 'id': np.arange(n), 'px': np.where(r.random(n) < 0.05, 125.0, np.round(r.uniform(99.5, 100.5, n), 2))})
    rand = pd.concat([b2, b2.sample(20, random_state=4)]).sample(frac=1, random_state=5).reset_index(drop=True)
    return [case('The example: a replayed feed and one bad print', lambda: check(ex, 0.1)), case('80 trades, 20 replayed, a few bad prints', lambda: check(rand, 0.1)),
            case('The same trades with a tighter 2% limit', lambda: check(rand, 0.02))]
` },
  ];

  const LIBS = [
    { id: 'numpy', name: 'NumPy', blurb: 'Vectorised arrays: returns, drawdowns, broadcasting, rolling windows and Monte Carlo.' },
    { id: 'pandas', name: 'pandas', blurb: 'Tables with an index: groupby, transform, as-of joins and resampling.' },
    { id: 'polars', name: 'Polars', blurb: 'Expressions, over(), dynamic groups and per-symbol windows.' },
    { id: 'market', name: 'Market data', blurb: 'Reshaping, cleaning and backtesting real-looking data with pandas.' },
  ];
  // Packages each library's drills need in the browser.
  const PKGS = { numpy: ['numpy', 'pandas'], pandas: ['numpy', 'pandas'], market: ['numpy', 'pandas'], polars: ['numpy', 'pandas', 'polars'] };
  const byId = Object.fromEntries(ITEMS.map((d) => [d.id, d]));
  QT.dataDrills = { ITEMS, LIBS, PKGS, byId };
})();
