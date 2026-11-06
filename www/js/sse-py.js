// Hidden tests for the Python drills in the Citadel SSE questions, run in the browser by
// js/code-worker.js (Pyodide, with numpy and pandas). Each `test` is Python: it gets `solution`,
// the namespace of your code, and its run() returns [name, passed, detail] for each case.
// research/verify_sse.py runs them against the reference solutions too.
(function () {
  const HEAD = `
import numpy as np, pandas as pd

def need(name):
    f = solution.get(name)
    if f is None:
        raise NameError('Define a function called ' + name)
    return f

def walk(seed, n=300, sd=0.01):
    rng = np.random.default_rng(seed)
    return pd.Series(100 * np.exp(np.cumsum(rng.normal(0, sd, n))))

def same(got, want):
    got, want = pd.Series(got).astype(float).reset_index(drop=True), want.astype(float).reset_index(drop=True)
    if len(got) != len(want):
        return False, 'got %d values, expected %d' % (len(got), len(want))
    if not (got.isna() == want.isna()).all():
        return False, 'NaN in the wrong places: %d of your values, %d expected' % (got.isna().sum(), want.isna().sum())
    d = (got - want).abs().max()
    return bool(d == d and d < 1e-9) or not want.notna().any(), 'largest difference %.3g' % d
`;
  QT.ssePy = {
    'q-py-001': {
      starter: 'import numpy as np\nimport pandas as pd\n\ndef ann_vol(prices: pd.Series) -> float:\n    pass\n',
      test: `${HEAD}
def ref(p):
    return p.pct_change().dropna().std(ddof=1) * np.sqrt(252)

def run():
    f, out = need('ann_vol'), []
    for name, p in [('The example prices', pd.Series([100.0, 101, 99, 102, 103])), ('A 300-day random walk', walk(5))]:
        got, want = float(f(p.copy())), ref(p)
        out.append([name, abs(got - want) < 1e-9, 'got %.10g, expected %.10g' % (got, want)])
    return out
`,
    },
    'q-py-002': {
      starter: 'import numpy as np\nimport pandas as pd\n\ndef ma_cross_returns(prices: pd.Series) -> pd.Series:\n    pass\n',
      test: `${HEAD}
def ref(p):
    r = p.pct_change()
    signal = (p.rolling(5).mean() > p.rolling(20).mean()).astype(int)
    return (signal.shift(1) * r).fillna(0.0)

def run():
    f, p, out = need('ma_cross_returns'), walk(0), []
    got = pd.Series(f(p.copy())).reset_index(drop=True)
    ok, why = same(got.fillna(0.0), ref(p))
    out.append(['Matches the reference on a 300-day random walk (seed 0)', ok, why])
    head = got.iloc[:20].fillna(0.0)
    out.append(['The first 20 values are 0 or NaN', bool((head == 0).all()), 'found %d non-zero' % (head != 0).sum()])
    moved = p.copy()
    moved.iloc[200:] = moved.iloc[200:] * 1.5
    later = pd.Series(f(moved)).reset_index(drop=True)
    ok, why = same(later.iloc[:200].fillna(0.0), got.iloc[:200].fillna(0.0))
    out.append(['Changing prices from day 200 leaves earlier returns alone', ok, why])
    signal = (p.rolling(5).mean() > p.rolling(20).mean()).astype(int)
    turns_on = signal[(signal == 1) & (signal.shift(1) == 0)].index
    made = got.fillna(0.0).iloc[turns_on].abs().max()
    out.append(['No look-ahead: nothing is earned on the day the signal turns on', bool(made < 1e-12), 'earned up to %.3g that day' % made])
    return out
`,
    },
    'q-py-003': {
      starter: 'import numpy as np\nimport pandas as pd\n\ndef rolling_corr(a: pd.Series, b: pd.Series, w: int = 60) -> pd.Series:\n    pass\n',
      test: `${HEAD}
def ref(a, b, w=60):
    return a.pct_change().rolling(w).corr(b.pct_change())

def run():
    f, a, out = need('rolling_corr'), walk(1), []
    noise = walk(2)
    b = np.sqrt(a * noise)   # shares half its moves with a
    ok, why = same(f(a.copy(), b.copy()), ref(a, b))
    out.append(['Matches the reference on two correlated series (seed 1)', ok, why])
    ok, why = same(f(a.copy(), a.copy() * 2.0).iloc[61:], pd.Series([1.0] * 239))
    out.append(['A series against a multiple of itself has correlation 1', ok, why])
    return out
`,
    },
  };
})();
