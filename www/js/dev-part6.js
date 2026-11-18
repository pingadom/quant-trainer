// Quant dev handbook, Part 6: the data tools: NumPy, pandas and Polars, and working with market
// data in them. See devbook-content.js. Code listings are run by research/verify_devbook.py, under
// both the newest releases and the versions the browser's Python has (numpy 2.0, pandas 2.2,
// Polars 1.18), and the drills these chapters link to are in data-drills.js.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    'dsa-numpy': {
      title: 'NumPy: arrays and vectorised code', minutes: 50,
      why: 'Almost every numerical Python library is built on NumPy arrays, and quant developer interviews assume you can use them fluently: compute returns without a loop, demean a matrix in one line, and know when an operation copies data and when it doesn\'t. The skill underneath is <b>vectorised thinking</b>: describing a calculation on whole arrays, so it runs in compiled code instead of the Python interpreter.',
      goals: ['Explain what an ndarray is (dtype, shape, contiguous memory) and why it is fast', 'Replace loops with vectorised operations, reductions along an axis, and boolean masks', 'Apply the broadcasting rules to combine arrays of different shapes', 'Know when you get a view and when a copy, and avoid the silent dtype traps', 'Write fast Monte Carlo and rolling calculations'],
      prereq: ['dsa-python', 'dsa-window'],
      sections: [
        { h: 'Why arrays are fast', blocks: [
          `<p>A Python list of a million floats is a million pointers to a million separate float objects, each with a type tag and a reference count. Adding 1 to each one means a million trips through the interpreter: look up the type, find the + method, allocate a new object. That costs tens of nanoseconds per element.</p>
           <p>A NumPy <b>ndarray</b> is one block of memory holding raw numbers of a single type, the <b>dtype</b> (float64, int64, bool…), plus a <b>shape</b> saying how to read it as a grid. <code>a + 1</code> hands the whole block to a loop written in C, which runs at close to the speed of the hardware, often 50 to 100 times faster than the Python loop. That is all "vectorised" means: one Python call that does n elements' work in compiled code.</p>
           <table class="hb-table"><tr><th>To make</th><th>Write</th></tr>
             <tr><td>From a list</td><td><code>np.array([1.0, 2.5, 4.0])</code></td></tr>
             <tr><td>A range, or n evenly spaced points</td><td><code>np.arange(10)</code>, <code>np.linspace(0, 1, 5)</code></td></tr>
             <tr><td>Filled with zeros or ones</td><td><code>np.zeros((3, 4))</code>, <code>np.ones(5)</code></td></tr>
             <tr><td>A new shape for the same data</td><td><code>a.reshape(3, 4)</code>, <code>a.ravel()</code></td></tr>
             <tr><td>Its shape, dtype and size</td><td><code>a.shape</code>, <code>a.dtype</code>, <code>a.nbytes</code></td></tr></table>`,
          { q: 'How many megabytes does an array of 1,000,000 float64 values take? (1 MB = 10⁶ bytes.)', a: 8, tol: { abs: 0.01 }, hint: 'A float64 is 64 bits.', sol: 'Each float64 is 8 bytes, so 10⁶ × 8 = 8 × 10⁶ bytes = <b>8 MB</b>, in one block. The same numbers as a Python list take about 32 MB: an 8-byte pointer plus a 24-byte float object each.' },
          { idea: 'Think in whole arrays. If you are writing <code>for i in range(len(a))</code> over a NumPy array, there is almost always a one-line array expression that does the same thing in C.' },
        ] },
        { h: 'Vectorising: arithmetic, reductions and masks', blocks: [
          `<p>Arithmetic and functions like <code>np.log</code>, <code>np.exp</code> and <code>np.maximum</code> work element by element (they're called <b>ufuncs</b>). Slices give shifted copies of a series without a loop: <code>p[1:]</code> is "tomorrow" and <code>p[:-1]</code> is "today", so <code>p[1:] / p[:-1] - 1</code> is every daily return at once.</p>
           <p><b>Reductions</b> (<code>sum</code>, <code>mean</code>, <code>std</code>, <code>max</code>, <code>argmax</code>) collapse an axis. For a 2-D array of returns with days as rows and stocks as columns, <code>R.mean(axis=0)</code> averages down the rows, giving one mean per stock; <code>axis=1</code> gives one value per day. Remember it as "the axis you name is the one that disappears".</p>
           <p><b>Cumulative</b> versions keep every running value: <code>np.cumsum</code>, <code>np.cumprod</code>, and <code>np.maximum.accumulate</code> (the running maximum, which gives drawdowns). <b>Boolean masks</b> select or count: <code>r[r &lt; 0]</code> is the losing days, <code>(r &lt; 0).mean()</code> the fraction of them, and <code>np.where(cond, x, y)</code> picks element by element.</p>`,
          { code: `import numpy as np


def simple_returns(prices):
    p = np.asarray(prices, dtype=float)
    return p[1:] / p[:-1] - 1                # every day's return, no loop


def log_returns(prices):
    return np.diff(np.log(np.asarray(prices, dtype=float)))


def max_drawdown(prices):
    """The worst fall from a running peak, as a negative fraction (0 if prices never fall)."""
    p = np.asarray(prices, dtype=float)
    peak = np.maximum.accumulate(p)          # the highest price so far, at each point
    return float((p / peak - 1).min())


def positions(signal, threshold):
    """+1 above the threshold, -1 below minus the threshold, 0 in between."""
    s = np.asarray(signal, dtype=float)
    return np.where(s > threshold, 1, np.where(s < -threshold, -1, 0))`, test: 'np_returns' },
          { q: 'Prices go 100, 120, 90, 110. What is the maximum drawdown, as a percentage (a positive number)?', a: 25, tol: { abs: 0.01 }, hint: 'The running peak is 120 when the price is 90.', sol: 'The running peak is 100, 120, 120, 120, so p/peak − 1 is 0, 0, −0.25, −0.083. The worst is −0.25: a drawdown of <b>25%</b>.' },
          { q: 'A has shape (3, 4). How many values does A.sum(axis=0) return?', a: 4, tol: { abs: 0.1 }, hint: 'The axis you name disappears.', sol: 'Summing over axis 0 (the 3 rows) leaves one value per column: shape (4,), so <b>4</b> values.' },
          { trap: '<code>and</code>, <code>or</code> and <code>not</code> don\'t work on arrays: <code>(r &gt; 0) and (r &lt; 0.01)</code> raises "the truth value of an array is ambiguous". Use <code>&amp;</code>, <code>|</code> and <code>~</code>, with brackets round each comparison, because <code>&amp;</code> binds more tightly than <code>&gt;</code>.' },
        ] },
        { h: 'Broadcasting', blocks: [
          `<p>Arithmetic between arrays of different shapes follows the <b>broadcasting rules</b>. Line the shapes up from the right. Each pair of dimensions must be equal, or one of them must be 1 (a missing dimension counts as 1). A dimension of 1 is stretched to match, without copying any data.</p>
           <table class="hb-table"><tr><th>Shapes</th><th>Result</th><th>Why</th></tr>
             <tr><td>(250, 50) and (50,)</td><td>(250, 50)</td><td>(50,) is treated as (1, 50): one row, repeated for each day</td></tr>
             <tr><td>(5, 1) and (3,)</td><td>(5, 3)</td><td>both stretch: every pair of values</td></tr>
             <tr><td>(3, 4) and (3,)</td><td>error</td><td>the trailing 4 and 3 don't match</td></tr></table>
           <p>That's why <code>R - R.mean(axis=0)</code> demeans every column in one line: the means have shape (n_stocks,), which lines up with the columns. To subtract a per-<i>row</i> value, give it shape (n, 1) with <code>x[:, None]</code> (or <code>keepdims=True</code>). The same trick builds every pairwise combination: <code>a[:, None] - b[None, :]</code> is the matrix of all differences.</p>`,
          { code: `import numpy as np


def zscore_columns(X):
    """Standardise each column: subtract its mean and divide by its standard deviation."""
    X = np.asarray(X, dtype=float)
    return (X - X.mean(axis=0)) / X.std(axis=0)          # (n, k) with (k,): per column


def pairwise_abs_diff(a, b):
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    return np.abs(a[:, None] - b[None, :])               # (len(a), 1) with (1, len(b))


def cov_matrix(R):
    """Sample covariance of the columns of R (rows are days), as np.cov(R, rowvar=False)."""
    R = np.asarray(R, dtype=float)
    D = R - R.mean(axis=0)
    return D.T @ D / (len(R) - 1)                        # @ is matrix multiplication`, test: 'np_broadcast' },
          { id: 'm1', q: 'A has shape (3, 4) and v has shape (3,): one value per row. What does A - v do?', opts: [['Raises an error: the shapes don\'t broadcast'], ['Subtracts v[i] from row i', 'That needs v[:, None], shape (3, 1). Shapes line up from the right, so (3,) is matched against the 4 columns.'], ['Subtracts v from the first three columns', 'Broadcasting never pads or truncates; mismatched dimensions are an error.'], ['Subtracts the mean of v from every value', 'NumPy doesn\'t reduce an operand to make shapes fit.']], sol: 'Shapes are compared from the right: 4 against 3, which are neither equal nor 1, so NumPy raises "operands could not be broadcast together". Write <code>A - v[:, None]</code> to subtract per row.' },
          { q: 'How many values are in the result of np.ones((5, 1)) + np.ones(3)?', a: 15, tol: { abs: 0.1 }, hint: 'Both arrays stretch.', sol: '(5, 1) and (3,) → (5, 1) and (1, 3) → (5, 3): <b>15</b> values, one for every pair.' },
          { market: 'Broadcasting is how risk code stays short: a (days × stocks) return matrix minus its column means, times a (stocks,) weight vector, gives portfolio P&amp;L for every day in one expression, and <code>w @ C @ w</code> gives the portfolio variance from a covariance matrix.' },
        ] },
        { h: 'Views, copies and dtypes', blocks: [
          `<p>A <b>slice</b> (<code>a[1:3]</code>, <code>A[:, 0]</code>) is a <b>view</b>: a new array object looking at the same memory. Writing through it changes the original. That makes slicing free, but it surprises people. <b>Fancy indexing</b> with a list of positions (<code>a[[1, 2]]</code>) or a boolean mask (<code>a[a &gt; 0]</code>) can't be described as a stride through memory, so it returns a <b>copy</b>. Call <code>.copy()</code> when you need an independent array, and <code>np.shares_memory(a, b)</code> tells you which you have.</p>
           <p>The dtype is fixed, and NumPy doesn't check for overflow inside arrays: <code>np.array([100], dtype=np.int8) * 2</code> wraps round to −56 without a warning. Assigning a float into an int array truncates it silently. Floats have the usual problems: <code>0.1 + 0.2 == 0.3</code> is False, so compare with <code>np.isclose</code>. <code>NaN</code> spreads through arithmetic and isn't equal to itself, so use <code>np.isnan</code> to find it and <code>np.nansum</code>, <code>np.nanmean</code> to skip it.</p>`,
          { q: 'a = np.arange(5); b = a[1:3]; b[0] = 99. What is a[1] now?', a: 99, tol: { abs: 0.1 }, hint: 'Is b a view or a copy?', sol: 'A slice is a view of the same memory, so writing b[0] writes a[1]: <b>99</b>.' },
          { id: 'm2', q: 'a = np.arange(5); c = a[[1, 2]]; c[0] = -1. What happens to a?', opts: [['Nothing: fancy indexing made a copy'], ['a[1] becomes −1', 'That would happen with a slice, a[1:3]. A list of positions gives a copy.'], ['It raises an error', 'Writing into a copy is allowed; it just doesn\'t affect a.'], ['a[0] becomes −1', 'c[0] refers to c\'s first element, which was copied from a[1].']], sol: 'Indexing with a list (or a mask) returns a new array, so a is unchanged. Only basic slices are views.' },
          { trap: 'Growing an array in a loop with <code>np.append</code> copies the whole array every time, so n appends cost O(n²). Collect values in a Python list and convert once, or allocate with <code>np.empty(n)</code> and fill it.' },
        ] },
        { h: 'Fast rolling calculations and Monte Carlo', blocks: [
          `<p>Two patterns cover most "make this fast" questions. <b>Rolling windows</b> come from cumulative sums: with c = cumsum of x (and a 0 in front), the sum of x[i:i+w] is c[i+w] − c[i], so every window's mean is <code>(c[w:] - c[:-w]) / w</code> in O(n). (<code>sliding_window_view</code> gives every window as a 2-D view without copying, which is clear but does O(n·w) work.)</p>
           <p><b>Monte Carlo</b> should draw all the random numbers at once. Use a seeded generator, <code>rng = np.random.default_rng(seed)</code>, rather than the old global <code>np.random.seed</code>, so results repeat and functions don't interfere with each other. Then price a payoff on a whole vector of simulated outcomes, and report the standard error alongside the estimate.</p>`,
          { code: `import numpy as np


def rolling_mean(x, w):
    """Mean of each full window of w values: len(x) - w + 1 results, in O(n)."""
    c = np.cumsum(np.concatenate(([0.0], np.asarray(x, dtype=float))))
    return (c[w:] - c[:-w]) / w


def mc_call(s0, k, sigma, t, n, seed=0):
    """A European call with zero rates, from n simulated prices at expiry.
    Returns the estimate and its standard error."""
    rng = np.random.default_rng(seed)
    z = rng.standard_normal(n)
    st = s0 * np.exp(-0.5 * sigma ** 2 * t + sigma * np.sqrt(t) * z)
    payoff = np.maximum(st - k, 0.0)
    return float(payoff.mean()), float(payoff.std(ddof=1) / np.sqrt(n))`, test: 'np_fast' },
          { q: 'rolling_mean(x, 3) on an array of 10 values: how many results does it return?', a: 8, tol: { abs: 0.1 }, hint: 'Count the full windows.', sol: 'Windows start at positions 0 to 7: 10 − 3 + 1 = <b>8</b> results.' },
          { q: 'A Monte Carlo estimate has standard error 0.04 with 10,000 paths. About how many paths give a standard error of 0.01, in thousands?', a: 160, tol: { abs: 0.5 }, hint: 'The standard error falls like 1/√n.', sol: 'To quarter the error you need 4² = 16 times the paths: 160,000, so <b>160</b> thousand.' },
          { trap: '<code>np.vectorize</code> doesn\'t make code fast: it\'s a Python loop with a nicer interface. Real speed comes from expressing the calculation with array operations.' },
        ] },
      ],
      takeaways: ['An ndarray is one typed block of memory; vectorised operations loop in C, 50 to 100 times faster than Python.', 'Reductions take an axis, and the axis you name disappears. Masks select, count and choose (np.where).', 'Broadcasting lines shapes up from the right; each pair must match or be 1. Use x[:, None] for per-row operations.', 'Slices are views, while fancy and boolean indexing copy. Dtypes overflow and truncate silently, and <code>NaN</code> spreads.', 'Rolling sums come from a cumsum difference. Monte Carlo: a seeded default_rng, all draws at once, report the standard error.'],
      explain: { q: 'Why is a NumPy expression like (p[1:] / p[:-1] - 1).std() so much faster than the same calculation in a Python loop?', a: 'The array stores raw numbers of one type in one block of memory, so each operation is a single call into a C loop that runs straight through it. A Python loop does the same work one element at a time through the interpreter: it looks up types, dispatches the operator, and allocates a new float object for every result. The arithmetic is the same; the per-element overhead is what disappears. The slices themselves cost nothing, because they are views of the same memory.' },
      homework: [
        { lvl: 'core', q: 'np.arange(12).reshape(3, 4).sum(axis=1): what is the last value?', a: 38, tol: { abs: 0.1 }, hint: 'The last row is 8, 9, 10, 11.', sol: '<p>reshape(3, 4) fills row by row, so the rows are 0–3, 4–7 and 8–11. Summing along axis 1 gives one value per row, and the last is 8 + 9 + 10 + 11 = <b>38</b>.</p>' },
        { lvl: 'core', q: 'np.array([100], dtype=np.int8) * 2: what value is stored?', a: -56, tol: { abs: 0.1 }, hint: 'int8 holds −128 to 127, and wraps round.', sol: '<p>200 doesn\'t fit in int8, and NumPy array arithmetic wraps without a warning: 200 − 256 = <b>−56</b>. Use a wide enough dtype (int64, or float64) for anything that can grow, like cumulative volume.</p>' },
        { lvl: 'core', q: 'What does np.nanmean([1, np.nan, 3]) return?', a: 2, tol: { abs: 0.001 }, hint: 'It skips the <code>NaN</code>.', sol: '<p>The nan-functions ignore missing values: (1 + 3)/2 = <b>2</b>. Plain np.mean would return nan, because <code>NaN</code> spreads through arithmetic.</p>' },
        { lvl: 'core', q: 'a has 2,000 values and b has 500. How many million values does a[:, None] - b[None, :] create?', a: 1, tol: { abs: 0.001 }, hint: 'The result has one value per pair.', sol: '<p>(2000, 1) with (1, 500) broadcasts to (2000, 500): <b>1</b> million values, 8 MB as float64. Broadcasting is free, but the result isn\'t; pairwise tricks on large inputs can run out of memory.</p>' },
        { lvl: 'interview', q: 'An interviewer gives you a loop that computes a 20-day rolling standard deviation of 10 million prices, and asks you to make it fast. What do you do, and what can go wrong numerically?', sol: '<p><b>Why the loop is slow.</b> For each of 10 million positions it recomputes a standard deviation over 20 values in Python: about 200 million interpreted operations, minutes of work.</p><p><b>Vectorise with running sums.</b> The variance of a window only needs Σx and Σx² over it, and both are differences of cumulative sums, exactly as for a rolling mean:</p><div class="hb-eq">var = (Σx² − (Σx)²/w) / (w − 1)</div><pre class="sc-code">import numpy as np\n\ndef rolling_std(x, w):\n    x = np.asarray(x, dtype=float)\n    x = x - x[0]                    # shift first: see below\n    c1 = np.cumsum(np.concatenate(([0.0], x)))\n    c2 = np.cumsum(np.concatenate(([0.0], x * x)))\n    s1, s2 = c1[w:] - c1[:-w], c2[w:] - c2[:-w]\n    var = (s2 - s1 * s1 / w) / (w - 1)\n    return np.sqrt(np.maximum(var, 0.0))</pre><p>That\'s a handful of array operations, well under a second for 10 million values.</p><p><b>The numerical trap: catastrophic cancellation.</b> With prices near 100 and tiny moves, Σx² and (Σx)²/w are both about 200,000 and agree in their first eight or nine digits. Subtracting them leaves only the last few digits, which are mostly rounding error, and the variance can even come out slightly negative. Subtracting a constant near the data first (above, the first price) keeps the numbers small; working with returns instead of prices helps too. pandas\' <code>rolling(w).std()</code> uses a numerically careful running algorithm and is a good default.</p><p><b>Always check</b> a fast version against a slow, obviously correct one (np.std on each window) on a sample.</p>' },
        { lvl: 'interview', q: 'What is the difference between a view and a copy in NumPy, and when does each happen? Give a bug it can cause.', sol: '<p><b>Two kinds of result.</b> A <b>view</b> is a new array object that looks at the same memory as the original; a <b>copy</b> owns new memory. Writing through a view changes the original; writing to a copy doesn\'t.</p><table class="hb-table"><tr><th>Gives a view</th><th>Gives a copy</th></tr><tr><td>basic slices: <code>a[2:10]</code>, <code>a[::2]</code>, <code>A[:, 0]</code></td><td>indexing with a list or array of positions: <code>a[[1, 5]]</code></td></tr><tr><td><code>A.T</code>, and <code>reshape</code> when the memory layout allows</td><td>boolean masks: <code>a[a &gt; 0]</code></td></tr><tr><td></td><td>arithmetic results (<code>a + 1</code>), and <code>.copy()</code></td></tr></table><p><b>Why:</b> a slice can be described as "start here, step by this much" through the same memory. An arbitrary list of positions can\'t, so NumPy has to gather the values into new memory.</p><pre class="sc-code">import numpy as np\n\ndef clean_last_window(prices, cap):\n    window = prices[-20:]            # a view of the caller\'s array!\n    window[window &gt; cap] = cap       # ...so this edits prices too\n    return window\n\nprices = np.array([100.0, 250.0, 101.0])\nclean_last_window(prices, 200.0)\nassert prices[1] == 200.0            # the caller\'s data changed</pre><p><b>The fix:</b> <code>window = prices[-20:].copy()</code> when you intend to modify it, or write functions that never modify their inputs. <code>np.shares_memory(a, b)</code> tells you which case you have.</p>' },
        { lvl: 'stretch', q: 'Write max_drawdown so it also returns the dates (indices) of the peak and the trough, still in O(n) with NumPy.', sol: '<p><b>Two observations.</b> The trough is the day with the deepest drawdown, so it\'s an argmin. The peak that drawdown is measured from is the highest price on or before the trough, so it\'s an argmax over the prices up to the trough.</p><pre class="sc-code">import numpy as np\n\ndef max_drawdown_dates(prices):\n    p = np.asarray(prices, dtype=float)\n    dd = p / np.maximum.accumulate(p) - 1\n    trough = int(np.argmin(dd))\n    peak = int(np.argmax(p[:trough + 1]))\n    return float(dd[trough]), peak, trough</pre><p><b>Example.</b> Prices 100, 120, 90, 130, 80, 95: the running peak is 100, 120, 120, 130, 130, 130, and the deepest drawdown is on day 4 (80/130 − 1 = −38.5%). The highest price up to day 4 is 130 on day 3, so the answer is (−0.385, 3, 4).</p><p><b>Details.</b> If prices never fall, dd is all zeros and argmin returns day 0, giving (0.0, 0, 0). If the peak price occurs twice, argmax returns the first; say whether you want the first or the last peak. Every step is one pass over the array, so O(n).</p>' },
        { lvl: 'lab', q: 'Run mc_call(100, 100, 0.2, 1, 1_000_000), with its default seed of 0. The Black–Scholes price with zero rates is about 7.97. What does the estimate round to (2 decimal places)?', a: 7.98, tol: { abs: 0.05 }, hint: 'The standard error is about 0.013.', sol: '<p>Seed 0 gives <b>7.98</b> (7.9829), with a standard error of 0.0132: about 1.3 standard errors above 7.966, the Black–Scholes value, which is ordinary luck. Another seed gives another answer within a few hundredths, and with 10,000 paths the estimate wanders by about ±0.14. That is why you always report the standard error with the estimate.</p>' },
      ],
      practice: [['Drill: returns and drawdowns in NumPy', '#/code/data/np-drawdown'], ['Drill: demean and standardise with broadcasting', '#/code/data/np-zscore'], ['Drill: rolling mean in O(n)', '#/code/data/np-rolling'], ['Drill: Monte Carlo with a seeded generator', '#/code/data/np-mc']],
    },

    'dsa-pandas': {
      title: 'pandas: tables, groups and time series', minutes: 60,
      why: 'pandas is the default tool for tabular data in finance: loading trades, joining them to quotes, resampling ticks into bars, and computing P&amp;L by desk. Interviews for quant developer and data-heavy roles test it directly ("compute VWAP per symbol", "join each trade to the prevailing quote") and test the traps: index alignment, chained assignment, and look-ahead in time series.',
      goals: ['Select rows and columns with boolean masks, .loc and .iloc, and understand index alignment', 'Summarise with groupby: agg for one row per group, transform for one value per row', 'Join tables with merge, spot row explosions, and join on time with merge_asof', 'Resample and roll time series without look-ahead', 'Avoid chained assignment and slow row-by-row code'],
      prereq: ['dsa-numpy', 'dsa-hashing'],
      sections: [
        { h: 'Series, DataFrames and the index', blocks: [
          `<p>A <b>Series</b> is a NumPy array with labels (the <b>index</b>); a <b>DataFrame</b> is a set of Series sharing one index, one per column. Selecting:</p>
           <table class="hb-table"><tr><th>To get</th><th>Write</th></tr>
             <tr><td>A column, or several</td><td><code>df["px"]</code>, <code>df[["sym", "px"]]</code></td></tr>
             <tr><td>Rows matching a condition</td><td><code>df[(df.qty &gt; 100) &amp; df.sym.isin(["A", "B"])]</code></td></tr>
             <tr><td>By label</td><td><code>df.loc[rows, cols]</code>, e.g. <code>df.loc[mask, "px"]</code></td></tr>
             <tr><td>By position</td><td><code>df.iloc[:5, 0]</code></td></tr>
             <tr><td>A new column, without changing df</td><td><code>df.assign(notional=df.px * df.qty)</code></td></tr></table>
           <p>The index makes pandas different from NumPy: arithmetic between two Series <b>aligns on labels</b>, not positions. Labels that are in only one of them give <code>NaN</code>. This is a feature (prices for different stocks line up by date automatically) and a classic source of bugs, when two series you thought matched have different indexes.</p>`,
          { code: `import pandas as pd


def big_fills(trades, min_qty, syms):
    """Trades of at least min_qty in the given symbols, largest first."""
    mask = (trades["qty"] >= min_qty) & trades["sym"].isin(syms)
    return trades.loc[mask].sort_values("qty", ascending=False)


def add_notional(trades):
    """A new frame with a notional column; the input is left unchanged."""
    return trades.assign(notional=trades["px"] * trades["qty"])`, test: 'pd_select' },
          { q: 's1 = pd.Series([1, 2, 3], index=["a", "b", "c"]) and s2 = pd.Series([10, 20, 30], index=["b", "c", "d"]). What is (s1 + s2).sum()?', a: 35, tol: { abs: 0.01 }, hint: 'Labels align; sum() skips <code>NaN</code>.', sol: 'Aligning on labels gives a: <code>NaN</code>, b: 2 + 10 = 12, c: 3 + 20 = 23, d: <code>NaN</code>. sum() skips <code>NaN</code>, so the total is <b>35</b>, not 1 + 2 + 3 + 10 + 20 + 30 = 66.' },
          { trap: 'An integer column with a missing value becomes float64 (<code>NaN</code> is a float), so IDs like 1001 come back as 1001.0. Use the nullable <code>"Int64"</code> dtype (capital I) if you need integers with gaps.' },
        ] },
        { h: 'groupby: split, apply, combine', blocks: [
          `<p><code>df.groupby("desk")</code> splits the rows by desk. What you do next decides the shape of the answer:</p>
           <ul><li><b>agg</b> (or sum, mean, size…) gives <b>one row per group</b>. Named aggregation keeps it readable: <code>.agg(qty=("qty", "sum"), n=("qty", "size"))</code>.</li>
           <li><b>transform</b> gives <b>one value per original row</b>, the group's result broadcast back, so you can compare each row with its group: its share of the desk's P&amp;L, or its value minus the group mean.</li>
           <li><b>apply</b> runs any Python function on each group. It is flexible and slow; reach for it last.</li></ul>
           <p>For a weighted average like VWAP, aggregate the pieces (Σ px·qty and Σ qty) and divide afterwards. The mean of prices is not the VWAP.</p>`,
          { code: `import pandas as pd


def desk_summary(trades):
    """One row per desk: number of trades, total quantity and VWAP."""
    t = trades.assign(pv=trades["px"] * trades["qty"])
    g = t.groupby("desk").agg(n=("qty", "size"), qty=("qty", "sum"), pv=("pv", "sum"))
    return g.assign(vwap=g["pv"] / g["qty"]).drop(columns="pv")


def pnl_share(trades):
    """Each trade's share of its desk's total P&L, aligned with the original rows."""
    return trades["pnl"] / trades.groupby("desk")["pnl"].transform("sum")`, test: 'pd_groupby' },
          { id: 'm1', q: 'You want each trade\'s P&L minus the average P&L of its desk, as a new column. Which do you use?', opts: [['groupby("desk")["pnl"].transform("mean")'], ['groupby("desk")["pnl"].mean()', 'That gives one row per desk, which no longer lines up with the trades.'], ['groupby("desk")["pnl"].agg("mean")', 'agg is the same as mean() here: one row per desk.'], ['df["pnl"].rolling("desk").mean()', 'rolling works on windows of rows or time, not on groups.']], sol: 'transform returns a result for every original row, aligned with the frame\'s index, so <code>df.pnl - df.groupby("desk").pnl.transform("mean")</code> works directly.' },
          { q: 'Desk a has trades with P&L 1 and 3; desk b has one trade with P&L 5. What is pnl_share for desk a\'s second trade?', a: 0.75, tol: { abs: 0.001 }, hint: 'Desk a\'s total is 4.', sol: '3 / (1 + 3) = <b>0.75</b>.' },
        ] },
        { h: 'Joining tables, and joining on time', blocks: [
          `<p><code>left.merge(right, on="key", how="left")</code> is a SQL join: how is inner, left, right or outer. The trap is <b>duplicate keys</b>: every matching pair produces a row, so a key appearing 2 times on the left and 3 on the right gives 6 rows. Pass <code>validate="many_to_one"</code> (or one_to_one) and pandas will raise if the right-hand key isn't unique, instead of silently multiplying your P&amp;L.</p>
           <p>Market data rarely matches exactly on time: a trade at 09:00:03.217 needs the quote that was live then, which was last updated at 09:00:02.950. <code>pd.merge_asof(trades, quotes, on="t", by="sym")</code> takes, for each trade, the latest quote at or before it, matching within each symbol. Both frames must be sorted by the time column. <code>direction="backward"</code> (the default) uses only the past, so there is no look-ahead; <code>tolerance=pd.Timedelta("1s")</code> refuses quotes that are too stale; <code>allow_exact_matches=False</code> excludes a quote with exactly the trade's timestamp, if that quote might have been caused by the trade.</p>`,
          { code: `import pandas as pd


def mark_trades(trades, quotes):
    """Attach the latest quote at or before each trade (same symbol), and the trade's
    distance from the mid in basis points. Both frames have a datetime column t."""
    m = pd.merge_asof(trades.sort_values("t"), quotes.sort_values("t"),
                      on="t", by="sym", direction="backward")
    mid = (m["bid"] + m["ask"]) / 2
    return m.assign(edge_bps=(m["px"] - mid) / mid * 1e4)`, test: 'pd_asof' },
          { q: 'The left table has key A twice; the right table has key A three times. How many rows does an inner merge on the key produce?', a: 6, tol: { abs: 0.1 }, hint: 'Every matching pair.', sol: '2 × 3 = <b>6</b>: every left A pairs with every right A. With validate="many_to_one" pandas would raise instead.' },
          { q: 'Quotes update at 09:00:00 (bid 100.0), 09:00:03 (bid 100.1) and 09:00:04 (bid 99.9). merge_asof with the defaults attaches which bid to a trade at 09:00:03?', a: 100.1, tol: { abs: 0.001 }, hint: '"At or before".', sol: 'By default an exact timestamp matches, so the trade gets the 09:00:03 quote: <b>100.1</b>. With allow_exact_matches=False it would get 100.0.' },
        ] },
        { h: 'Time series: resample, rolling and shift', blocks: [
          `<p>With a <b>DatetimeIndex</b>, pandas understands time. <code>resample("1min")</code> groups into calendar buckets: <code>px.resample("1min").ohlc()</code> makes bars, <code>qty.resample("1min").sum()</code> volume. A minute with no ticks still gets a row, full of <code>NaN</code> (and a volume of 0), so drop or fill it deliberately. <code>rolling(20)</code> is a window of 20 rows; <code>rolling("5min")</code> a window of time, which is what you want for irregular ticks. The first <i>w</i> − 1 values of a 20-row rolling mean are <code>NaN</code>, because the window isn't full yet.</p>
           <p><code>shift(1)</code> moves values one step later and <code>pct_change()</code> is <code>x / x.shift(1) - 1</code>. Shift is how you avoid <b>look-ahead</b>: a signal computed from today's close can only be traded tomorrow, so the position must be <code>signal.shift(1)</code>. Forgetting this is the most common reason a backtest looks too good to be true.</p>`,
          { code: `import pandas as pd


def minute_bars(ticks):
    """OHLC, volume and VWAP per minute, from ticks indexed by time with columns px and qty.
    Minutes with no trades are dropped."""
    bars = ticks["px"].resample("1min").ohlc()
    bars["volume"] = ticks["qty"].resample("1min").sum()
    pv = (ticks["px"] * ticks["qty"]).resample("1min").sum()
    bars["vwap"] = pv / bars["volume"]
    return bars.dropna(subset=["open"])


def crossover_pnl(prices, fast, slow):
    """Daily return of holding the stock when the fast moving average is above the slow one.
    The decision uses today's close, so it earns tomorrow's return: hence shift(1)."""
    signal = (prices.rolling(fast).mean() > prices.rolling(slow).mean()).astype(float)
    return (signal.shift(1) * prices.pct_change()).fillna(0.0)`, test: 'pd_time' },
          { q: 'A Series of 5 values: how many <code>NaN</code> does .rolling(3).mean() produce?', a: 2, tol: { abs: 0.1 }, hint: 'The window needs 3 values.', sol: 'The first two positions don\'t have three values yet: <b>2</b> <code>NaN</code>, then 3 means.' },
          { id: 'm2', q: 'Ticks arrive at 09:00:10, 09:00:50, 09:01:20 and 09:03:00. What does px.resample("1min").ohlc() return?', opts: [['4 rows, with 09:02 all <code>NaN</code>'], ['3 rows: one per minute that has a tick', 'pandas resample creates every bucket in the range, empty or not. (Polars group_by_dynamic does give 3.)'], ['4 rows, with 09:02 copying 09:01', 'resample doesn\'t forward-fill unless you ask with .ffill().'], ['2 rows: 09:00 and 09:01', 'The 09:03 tick gets its own bucket.']], sol: 'Buckets run from 09:00 to 09:03, so there are 4 rows, and 09:02 has no ticks: <code>NaN</code> for open, high, low and close. That\'s why minute_bars drops rows with no open.' },
          { trap: 'Normalising with statistics of the whole sample (<code>(x - x.mean()) / x.std()</code>) before a backtest leaks the future into the past. Use rolling or expanding statistics, shifted, so each day only sees what was known then.' },
        ] },
        { h: 'Changing data safely, and fast', blocks: [
          `<p><b>Chained assignment</b> is the best-known pandas bug: <code>df[df.qty &gt; 0]["flag"] = 1</code> filters (making a new frame), then sets the column on that temporary frame, and df never changes. Always set through one <code>.loc</code> call: <code>df.loc[df.qty &gt; 0, "flag"] = 1</code>. Older pandas sometimes let a chained write through and warned with <code>SettingWithCopyWarning</code>; pandas 3 uses <b>copy-on-write</b> everywhere, so a chained write never changes the original. Either way, the fix is the same.</p>
           <p>For speed, the order of preference is: a vectorised column expression (<code>df.px * df.qty</code>, <code>np.where</code>, <code>.str</code> and <code>.dt</code> methods); then a groupby with a built-in aggregation; then <code>apply</code>; and last <code>iterrows</code>, which is slower still. A row-wise <code>apply(..., axis=1)</code> over millions of rows runs Python once per row. Convert repeated strings like symbols to <code>category</code> to save memory, and store data as Parquet rather than CSV.</p>`,
          { id: 'm3', q: 'df[df.qty > 0]["flag"] = 1. What happens to df?', opts: [['It is unchanged: the write goes to a temporary frame'], ['flag becomes 1 on the rows with qty > 0', 'That is what was meant, but the first [...] makes a new frame; the write goes there.'], ['flag becomes 1 on every row', 'The mask is applied first; df\'s other rows aren\'t touched either.'], ['pandas raises an error', 'It warns, but doesn\'t raise: the bug is silent unless you read warnings.']], sol: 'Chained indexing writes to an intermediate result, not df. Use <code>df.loc[df.qty &gt; 0, "flag"] = 1</code>.' },
          { q: 'pd.Series([1, None, 3]).mean(): what is it?', a: 2, tol: { abs: 0.001 }, hint: 'pandas skips missing values by default.', sol: 'The None becomes <code>NaN</code>, and pandas reductions skip <code>NaN</code> (skipna=True): (1 + 3)/2 = <b>2</b>. NumPy\'s np.mean on the same values would give nan.' },
          { market: 'Real desk data is messy: duplicate trade reports, timestamps in different time zones, corrections that cancel earlier rows. Make every step a function that returns a new frame (assign, merge, filter) instead of modifying in place; it is easier to test and you can rerun it from the raw data.' },
        ] },
      ],
      takeaways: ['A DataFrame is labelled columns sharing an index, and arithmetic aligns on labels, not position.', 'groupby + agg gives one row per group; transform gives one value per row. Build weighted averages from sums.', 'merge multiplies duplicate keys, so use validate=. merge_asof joins on the latest earlier time, by symbol.', 'resample makes calendar buckets (empty ones included); rolling("5min") handles irregular ticks; shift(1) prevents look-ahead.', 'Set values with a single .loc, never chained indexing. Vectorise before you apply; never iterrows on big data.'],
      explain: { q: 'Why does pandas have both agg and transform on a groupby, and when do you need each?', a: 'They answer different questions. agg summarises: it collapses each group to one row, giving a table indexed by the group keys, which is what you want for a report (P&L per desk). transform computes a group statistic but hands it back for every original row, in the original order, so it lines up with the frame. You need it whenever a row is compared with its own group: share of the desk\'s P&L, value minus group mean, rank within the day. Using agg there leaves you with a shorter table that no longer aligns, and you would have to merge it back.' },
      homework: [
        { lvl: 'core', q: 'left has keys [A, B, B] and right has keys [B, B, C]. How many rows does left.merge(right, on="key") (an inner join) give?', a: 4, tol: { abs: 0.1 }, hint: 'Only B matches.', sol: '<p>A and C have no partner. Each of the two left Bs pairs with each of the two right Bs: 2 × 2 = <b>4</b> rows.</p>' },
        { lvl: 'core', q: 'prices = pd.Series([100, 110, 99]). What is the last value of prices.pct_change()? (As a decimal.)', a: -0.1, tol: { abs: 0.0001 }, hint: '99/110 − 1.', sol: '<p>99/110 − 1 = <b>−0.1</b>. The first value is <code>NaN</code>, because there is no previous price.</p>' },
        { lvl: 'core', q: 'df has 1,000 rows across 4 desks. How many rows does df.groupby("desk")["pnl"].transform("sum") return?', a: 1000, tol: { abs: 0.1 }, hint: 'transform keeps the original shape.', sol: '<p><b>1,000</b>: one value per original row (each row gets its desk\'s total). .sum() instead of transform would return 4.</p>' },
        { lvl: 'core', q: 'Trades at 09:00:01 and 09:00:05; quotes at 09:00:00 (bid 99), 09:00:02 (bid 100) and 09:00:06 (bid 101). With merge_asof and tolerance=pd.Timedelta("2s"), what bid does the 09:00:05 trade get? (Answer 0 if none.)', a: 0, tol: { abs: 0.001 }, hint: 'The latest earlier quote is 3 seconds old.', sol: '<p>The latest quote at or before 09:00:05 is from 09:00:02, which is 3 seconds old, beyond the 2-second tolerance, so the bid is <code>NaN</code>: answer <b>0</b>. The 09:00:06 quote is in the future and is never used with direction="backward".</p>' },
        { lvl: 'interview', q: 'A colleague\'s pandas job computes a fee for each of 20 million trades with df.apply(fee_fn, axis=1) and takes 15 minutes. How would you speed it up?', sol: '<p><b>Find where the time goes.</b> <code>apply(fee_fn, axis=1)</code> builds a Series object for each of the 20 million rows and calls a Python function on it. The arithmetic is trivial; the per-row overhead (tens of microseconds) is the whole cost.</p><p><b>Rewrite the rule as column operations.</b> Suppose the fee is 0.5 bp of notional, with a minimum of 1.00, and venue X charges double:</p><pre class="sc-code">import numpy as np\nimport pandas as pd\n\ndef fees(trades):\n    notional = trades["px"] * trades["qty"]\n    fee = np.maximum(notional * 0.5e-4, 1.0)\n    return fee.where(trades["venue"] != "X", fee * 2)</pre><p>Each line processes all 20 million rows in compiled code: seconds instead of minutes. The general tools: arithmetic on columns; <code>np.where</code> and <code>np.select</code> for conditions; <code>pd.cut</code> for tiers; <code>map</code> or a merge with a small table for per-venue or per-client rates.</p><p><b>Then check and tidy.</b> Compare the new fees with the old function on a random sample of rows (they should match to the penny). Set dtypes (<code>category</code> for venue and symbol), and read only the columns you need. If the data doesn\'t fit in memory, process a day at a time or use Polars\' lazy engine.</p>' },
        { lvl: 'interview', q: 'Why can\'t you join trades to quotes with an ordinary merge on the timestamp? What does merge_asof need, and what can still go wrong?', sol: '<p><b>Why an ordinary merge fails.</b> A trade at 09:30:00.217 and the quote that was live at that moment (last updated at 09:30:00.150) have different timestamps, so an exact join on time matches almost nothing.</p><p><b>What merge_asof does.</b> For each trade, it takes the latest quote at or before the trade\'s time: the quote that was in force. Example: quotes at 09:00:00, 09:00:03 and 09:00:04; trades at 09:00:01 and 09:00:05 get the 09:00:00 and 09:00:04 quotes.</p><pre class="sc-code">import pandas as pd\n\ndef attach_quotes(trades, quotes):\n    return pd.merge_asof(\n        trades.sort_values("t"), quotes.sort_values("t"),\n        on="t", by="sym",                  # match within each symbol\n        tolerance=pd.Timedelta("1s"),      # refuse stale quotes\n        allow_exact_matches=False)         # see below</pre><p><b>What it needs:</b> both frames sorted by the time column, and <code>by="sym"</code> when there are several symbols, or a trade in one stock picks up another stock\'s quote.</p><p><b>What can still go wrong:</b></p><ul><li><b>Stale quotes</b> after a quiet spell or a gap in the data: <code>tolerance</code> turns them into <code>NaN</code> instead of silently using old prices.</li><li><b>The trade\'s own effect:</b> a quote stamped at exactly the trade\'s time may be the market\'s reaction to the trade; <code>allow_exact_matches=False</code> uses the quote before it.</li><li><b>Clocks:</b> trades and quotes from different systems can disagree by milliseconds, so "before" isn\'t always before.</li><li><b>Time zones:</b> if one column is UTC and the other exchange-local, the join is silently wrong by hours.</li></ul>' },
        { lvl: 'interview', q: 'Explain chained assignment, and why df.loc[mask, "col"] = v is the fix.', sol: '<p><b>What Python actually runs.</b> <code>df[mask]["col"] = v</code> is two separate steps:</p><ol><li><code>tmp = df[mask]</code>: filtering with a boolean mask builds a <i>new</i> DataFrame.</li><li><code>tmp["col"] = v</code>: sets the column on that temporary frame, which is then thrown away.</li></ol><p>So df never changes, and nothing tells you unless you read the warning.</p><pre class="sc-code">import pandas as pd\n\ndf = pd.DataFrame({"qty": [1, -1, 2], "flag": [0, 0, 0]})\ndf.loc[df["qty"] &gt; 0, "flag"] = 1     # one call on df itself\nassert df["flag"].tolist() == [1, 0, 1]</pre><p><b>Why .loc fixes it.</b> <code>df.loc[mask, "col"] = v</code> is a single assignment made on df, with both the rows and the column in one call, so pandas writes into df. The same applies to single values: write <code>df.loc[0, "col"] = v</code>, not <code>df["col"][0] = v</code>.</p><p><b>Versions.</b> In pandas 2 some chained writes happened to go through (when the intermediate was a view), with a SettingWithCopyWarning or FutureWarning. pandas 3 uses copy-on-write everywhere: every intermediate behaves as a copy, so a chained write never changes the original. The rule "one .loc call" is right in every version.</p>' },
        { lvl: 'stretch', q: 'Build minute bars without resample: given ticks with a time column t, use groupby on a floored timestamp. How do the results differ from resample?', sol: '<p><b>The idea.</b> resample needs a DatetimeIndex, but you can do the same with an ordinary groupby: round each tick\'s time down to its minute, and group by that.</p><pre class="sc-code">import pandas as pd\n\ndef minute_bars_groupby(ticks):\n    """ticks: columns t (datetime), px, qty, sorted by t."""\n    key = ticks["t"].dt.floor("1min")\n    return ticks.groupby(key).agg(\n        open=("px", "first"), high=("px", "max"),\n        low=("px", "min"), close=("px", "last"),\n        volume=("qty", "sum"))</pre><p><b>How it differs from resample.</b></p><ul><li><b>Empty minutes:</b> groupby only creates groups that exist, so a minute with no ticks is simply absent. resample creates every minute in the range and fills empty ones with <code>NaN</code> (and 0 volume). Neither is wrong; decide which you want, and reindex if you need every minute.</li><li><b>Order:</b> first and last only mean open and close if the ticks are sorted by time.</li><li><b>Flexibility:</b> it works on a column, and you can group by symbol too: <code>groupby(["sym", key])</code>.</li></ul>' },
      ],
      practice: [['Drill: VWAP per symbol with groupby', '#/code/data/pd-vwap'], ['Drill: each trade\'s share of its desk', '#/code/data/pd-share'], ['Drill: mark trades to the prevailing quote', '#/code/data/pd-asof'], ['Drill: minute bars from ticks', '#/code/data/pd-bars']],
    },

    'dsa-polars': {
      title: 'Polars: expressions and lazy queries', minutes: 50,
      why: 'Polars is a newer DataFrame library, written in Rust on top of the Apache Arrow memory format. It uses every core, has no index to trip over, and can optimise a whole query before running it, so it is often several times faster than pandas and handles data bigger than memory. Trading firms increasingly use it for research pipelines, and it rewards a different way of writing: you describe columns with <b>expressions</b>, and Polars decides how to compute them.',
      goals: ['Write queries with expressions in select, with_columns, filter and group_by().agg()', 'Use over() for group-wise columns and when/then/otherwise for conditions', 'Explain lazy evaluation, query optimisation and when to collect()', 'Make bars with group_by_dynamic and join on time with join_asof', 'Translate between pandas and Polars, and know where they behave differently'],
      prereq: ['dsa-pandas'],
      sections: [
        { h: 'Expressions and contexts', blocks: [
          `<p>In pandas you mostly operate on columns you have already pulled out. In Polars you write an <b>expression</b>, a recipe such as <code>pl.col("px") * pl.col("qty")</code>, and pass it to a <b>context</b> that decides what happens to the result:</p>
           <table class="hb-table"><tr><th>Context</th><th>Result</th></tr>
             <tr><td><code>df.select(...)</code></td><td>only the expressions you list</td></tr>
             <tr><td><code>df.with_columns(...)</code></td><td>all existing columns, plus new or replaced ones</td></tr>
             <tr><td><code>df.filter(...)</code></td><td>the rows where a boolean expression is true</td></tr>
             <tr><td><code>df.group_by("desk").agg(...)</code></td><td>one row per group, one column per expression</td></tr></table>
           <p>Name results with keyword arguments (<code>with_columns(notional=pl.col("px") * pl.col("qty"))</code>) or <code>.alias()</code>. Expressions in one context are independent of each other, so Polars runs them in parallel; a column created in one <code>with_columns</code> can only be used in the next. There is no index: rows have no labels, nothing aligns by accident, and you join explicitly. Polars is also strict about types: a column has exactly one dtype, so <code>pl.DataFrame({"px": [100, 101, 99.5]})</code> raises an error where pandas would quietly convert.</p>`,
          { code: `import polars as pl


def desk_report(trades):
    """Per desk: number of trades, total quantity and VWAP, biggest desk first."""
    return (
        trades.group_by("desk")
        .agg(
            n=pl.len(),
            qty=pl.col("qty").sum(),
            vwap=(pl.col("px") * pl.col("qty")).sum() / pl.col("qty").sum(),
        )
        .sort("qty", descending=True)
    )


def with_share(trades):
    """Each trade's share of its desk's P&L: over() is a group-wise column, like transform."""
    return trades.with_columns(share=pl.col("pnl") / pl.col("pnl").sum().over("desk"))


def label_side(trades):
    return trades.with_columns(
        side=pl.when(pl.col("qty") > 0).then(pl.lit("buy")).otherwise(pl.lit("sell"))
    )`, test: 'pl_basics' },
          { q: 'Desk a has P&L 1 and 3, desk b has 5. In with_share, what is the share for desk a\'s P&L of 3?', a: 0.75, tol: { abs: 0.001 }, hint: 'over("desk") sums within the desk.', sol: '<code>pl.col("pnl").sum().over("desk")</code> is 4 for both of desk a\'s rows, so the share is 3/4 = <b>0.75</b>. over() is Polars\' version of pandas\' groupby().transform().' },
          { id: 'm1', q: 'df.select(pl.col("x").sum(), pl.col("x").mean()) raises an error. Why?', opts: [['Both results are named "x", and column names must be unique'], ['sum and mean can\'t be used in the same select', 'Any number of expressions can share a context, as long as their names differ.'], ['select needs a group_by first to aggregate', 'select can aggregate a whole column; the result is a single row.'], ['x must be cast to a float before mean()', 'mean() works on integers and returns a float.']], sol: 'An expression keeps its input column\'s name, so both outputs are called x, and Polars refuses duplicate names (DuplicateError). Name them: <code>select(total=pl.col("x").sum(), avg=pl.col("x").mean())</code>.' },
        ] },
        { h: 'Missing values: null is not NaN', blocks: [
          `<p>Polars has two different kinds of "missing". <b>null</b> means no value, and any column type can have it; aggregations skip nulls, as pandas skips <code>NaN</code>. <b><code>NaN</code></b> is a floating-point value ("not a number", from 0/0), and it spreads like it does in NumPy: the sum of [1.0, <code>NaN</code>, 3.0] is <code>NaN</code>. Data loaded from CSV or Parquet uses null for blanks; <code>NaN</code> only appears from float arithmetic, or from converting pandas data. Use <code>is_null</code>, <code>fill_null</code> and <code>drop_nulls</code> for one, and <code>is_nan</code>, <code>fill_nan</code> for the other.</p>`,
          { q: 'pl.DataFrame({"x": [1, None, 3]}).select(pl.col("x").sum()): what is the value?', a: 4, tol: { abs: 0.01 }, hint: 'None becomes null, and aggregations skip nulls.', sol: 'The None is a null, so the sum is 1 + 3 = <b>4</b>. With a <code>NaN</code> in a float column instead, the sum would be <code>NaN</code>.' },
          { trap: '<code>pl.from_pandas</code> turns pandas\' <code>NaN</code> into null by default (<code>nan_to_null=True</code>), but a <code>NaN</code> made inside Polars, say by 0/0, stays <code>NaN</code> and poisons sums and means. When a Polars aggregate comes out as <code>NaN</code>, check <code>is_nan().sum()</code> as well as <code>null_count()</code>.' },
        ] },
        { h: 'Lazy queries', blocks: [
          `<p>Everything so far ran <b>eagerly</b>: each call computed a result immediately. Call <code>.lazy()</code> on a DataFrame, or start from <code>pl.scan_parquet(...)</code> or <code>pl.scan_csv(...)</code>, and you get a <b>LazyFrame</b>: the same methods build a query plan, and nothing runs until <code>.collect()</code>.</p>
           <p>Seeing the whole query lets Polars optimise it, as a database does. <b>Projection pushdown</b> reads only the columns the query uses; <b>predicate pushdown</b> applies filters while reading, so rows you'll throw away are never loaded; and common work is shared between steps. <code>.explain()</code> prints the optimised plan. For data bigger than memory, Polars can also run the plan in a <b>streaming</b> mode that processes the file in batches.</p>`,
          { code: `import polars as pl


def big_trade_volume(trades, min_qty):
    """Total absolute quantity of large trades per symbol. Built lazily, run by collect()."""
    return (
        trades.lazy()
        .filter(pl.col("qty").abs() >= min_qty)
        .group_by("sym")
        .agg(big_qty=pl.col("qty").abs().sum())
        .sort("sym")
        .collect()
    )`, test: 'pl_lazy' },
          { id: 'm2', q: 'A 40-column Parquet file has 2 billion rows; your query uses 3 columns and one day out of a year. Why is scan_parquet(...)…collect() much faster than read_parquet(...) and then the same steps?', opts: [['The lazy plan reads only 3 columns and skips rows outside the day'], ['Lazy mode runs on the GPU by default', 'Polars runs on the CPU unless you ask for the GPU engine.'], ['read_parquet is single-threaded but scan_parquet is not', 'Both use every core; the difference is how much data is read at all.'], ['Lazy mode caches the file between runs', 'Each collect() runs the plan again.']], sol: 'With the whole plan visible, Polars pushes the column selection and the date filter into the reader (projection and predicate pushdown). Parquet stores columns separately, with statistics for each block of rows, so most of the file is never read. The eager version loads all 40 columns of every row first.' },
          { q: 'A query selects 3 of a file\'s 40 equally sized columns. With projection pushdown, roughly what percentage of the column data is read?', a: 7.5, tol: { abs: 0.01 }, hint: '3 out of 40.', sol: '3/40 = <b>7.5%</b>. That\'s the case for columnar formats like Parquet: unused columns cost nothing.' },
        ] },
        { h: 'Time series: dynamic groups, rolling windows and as-of joins', blocks: [
          `<p>Sort by time first, then:</p>
           <ul><li><code>group_by_dynamic("t", every="1m")</code> groups rows into time buckets; give it the aggregations in <code>.agg()</code>, as with group_by. Unlike pandas' resample, it only creates buckets that contain rows.</li>
           <li><code>pl.col("px").rolling_mean_by("t", window_size="5m")</code> is a rolling mean over a time window, for irregular ticks; <code>rolling_mean(20)</code> counts rows.</li>
           <li><code>shift(1)</code>, <code>pct_change()</code>, <code>cum_sum()</code> and <code>diff()</code> work like pandas, and with <code>.over("sym")</code> they run within each symbol, so one symbol's last price never leaks into the next symbol's first return.</li>
           <li><code>trades.join_asof(quotes, on="t", by="sym")</code> attaches the latest quote at or before each trade (<code>strategy="backward"</code> is the default); both sides must be sorted by t.</li></ul>`,
          { code: `import polars as pl


def minute_bars_pl(ticks):
    """OHLC, volume and VWAP per minute; ticks has a datetime column t, and px and qty."""
    return (
        ticks.sort("t")
        .group_by_dynamic("t", every="1m")
        .agg(
            open=pl.col("px").first(),
            high=pl.col("px").max(),
            low=pl.col("px").min(),
            close=pl.col("px").last(),
            volume=pl.col("qty").sum(),
            vwap=(pl.col("px") * pl.col("qty")).sum() / pl.col("qty").sum(),
        )
    )


def mark_trades_pl(trades, quotes):
    """The latest quote at or before each trade, per symbol, and the edge to the mid in bps."""
    m = trades.sort("t").join_asof(quotes.sort("t"), on="t", by="sym")
    mid = (pl.col("bid") + pl.col("ask")) / 2
    return m.with_columns(edge_bps=(pl.col("px") - mid) / mid * 1e4)


def log_returns_by_symbol(prices):
    """Log returns per symbol from long data (sym, t, px): shift within each symbol."""
    return prices.sort("sym", "t").with_columns(
        ret=(pl.col("px") / pl.col("px").shift(1)).log().over("sym")
    )`, test: 'pl_time' },
          { q: 'Ticks at 09:00:10, 09:00:50, 09:01:20 and 09:03:00. How many rows does group_by_dynamic("t", every="1m") produce?', a: 3, tol: { abs: 0.1 }, hint: 'Only buckets with rows.', sol: 'The buckets 09:00, 09:01 and 09:03 contain ticks; 09:02 is empty and isn\'t created: <b>3</b> rows. pandas\' resample would give 4, with a <code>NaN</code> row for 09:02.' },
          { q: 'Trades at t = 1, 3, 5; quotes at t = 0 (bid 10), 3 (bid 11) and 4 (bid 12). After join_asof on t, what bid does the trade at t = 5 get?', a: 12, tol: { abs: 0.01 }, hint: 'The latest quote at or before 5.', sol: 'The quote at t = 4 is the latest at or before 5: bid <b>12</b>. (The trade at 1 gets 10, and the one at 3 gets 11, an exact match.)' },
        ] },
        { h: 'pandas or Polars?', blocks: [
          `<table class="hb-table"><tr><th>pandas</th><th>Polars</th></tr>
             <tr><td><code>df[df.qty &gt; 0]</code></td><td><code>df.filter(pl.col("qty") &gt; 0)</code></td></tr>
             <tr><td><code>df.assign(n=df.px * df.qty)</code></td><td><code>df.with_columns(n=pl.col("px") * pl.col("qty"))</code></td></tr>
             <tr><td><code>df.groupby("k").agg(q=("qty", "sum"))</code></td><td><code>df.group_by("k").agg(q=pl.col("qty").sum())</code></td></tr>
             <tr><td><code>df.groupby("k").x.transform("sum")</code></td><td><code>pl.col("x").sum().over("k")</code></td></tr>
             <tr><td><code>np.where(c, a, b)</code></td><td><code>pl.when(c).then(a).otherwise(b)</code></td></tr>
             <tr><td><code>pd.merge_asof(a, b, on="t", by="s")</code></td><td><code>a.join_asof(b, on="t", by="s")</code></td></tr>
             <tr><td><code>s.resample("1min").ohlc()</code></td><td><code>group_by_dynamic("t", every="1m").agg(...)</code></td></tr></table>
           <p>Choose Polars for large data, long pipelines, and anything that benefits from lazy optimisation and every core. pandas still wins for small interactive work, for its huge ecosystem (statsmodels, plotting, most tutorials), and where code already exists. They interoperate through Arrow: <code>pl.from_pandas(df)</code> and <code>df.to_pandas()</code> (which needs the pyarrow package installed). In an interview, say which you'd use and why; the reasoning matters more than the syntax.</p>`,
          { id: 'm3', q: 'Which pandas habit has no direct equivalent in Polars?', opts: [['Relying on the index to align rows'], ['Grouping and aggregating', 'group_by().agg() does this.'], ['Joining on the latest earlier timestamp', 'join_asof does this.'], ['Conditional columns', 'when/then/otherwise does this.']], sol: 'Polars has no index, so nothing aligns by label: rows match by position within a frame, and you join explicitly on key columns. That removes a whole class of silent alignment bugs, but pandas code that leans on the index needs rewriting.' },
          { market: 'A common setup: research notebooks in pandas, and the nightly jobs that build features over years of tick data in Polars lazy queries reading Parquet. Interviewers like candidates who can explain the trade-off rather than just favour one library.' },
        ] },
      ],
      takeaways: ['Expressions (pl.col(...) arithmetic) go into contexts: select, with_columns, filter, group_by().agg().', 'over() is a group-wise column (pandas transform); when/then/otherwise is a conditional.', 'No index and strict types: nothing aligns or converts silently, and output names must be unique.', 'null (missing, skipped) is different from <code>NaN</code> (a float that spreads).', 'Lazy: scan_* or .lazy(), then collect(). Pushdown reads only the columns and rows you need.', 'Time series: sort first; group_by_dynamic for bars (no empty buckets), join_asof for quotes, shift().over("sym") for returns.'],
      explain: { q: 'Why can a lazy Polars query beat the same steps run one at a time?', a: 'Run eagerly, each step has to produce its full result before the next starts, without knowing what comes later: read every column, then filter, then drop most columns. A lazy query is a plan, so the optimiser sees the whole thing before any work is done. It pushes filters and column choices down into the file reader, so unneeded data is never read; it can reorder and combine steps and share repeated work; and it can stream the plan in batches when the data doesn\'t fit in memory. The arithmetic is the same, but far less data moves.' },
      homework: [
        { lvl: 'core', q: 'Desks a, a, b, a have P&L 1, 2, 5, 4 in that order. What is the last value of pl.col("pnl").cum_sum().over("desk")?', a: 7, tol: { abs: 0.01 }, hint: 'A running total within desk a.', sol: '<p>Within desk a the running totals are 1, 3, then 7 (1 + 2 + 4). The last row is desk a\'s third trade: <b>7</b>. over() returns results in the original row order.</p>' },
        { lvl: 'core', q: 'How many nulls does pl.Series([1, None, None, 4]).null_count() report?', a: 2, tol: { abs: 0.1 }, hint: 'Each None is a null.', sol: '<p><b>2</b>. The series is integer typed with two nulls; Polars doesn\'t need to convert it to float, unlike pandas without the nullable dtype.</p>' },
        { lvl: 'core', q: 'Prices 3, 1, 2. What is the last value of pl.col("px").pct_change()?', a: 1, tol: { abs: 0.001 }, hint: '2/1 − 1.', sol: '<p>2/1 − 1 = <b>1</b> (a 100% rise). The first value is null, because there is no previous price.</p>' },
        { lvl: 'core', q: 'Translate to Polars: df["z"] = (df.x - df.groupby("k").x.transform("mean")) / df.groupby("k").x.transform("std").', sol: '<p><b>Map each piece.</b> groupby(...).transform(...) becomes an aggregation followed by <code>.over(...)</code>, which gives every row its group\'s value; assignment to a column becomes <code>with_columns</code>, which returns a new frame.</p><pre class="sc-code">import polars as pl\n\ndef zscore_within(df):\n    x = pl.col("x")\n    return df.with_columns(\n        z=(x - x.mean().over("k")) / x.std().over("k"))</pre><p><b>Check it</b> on k = a, a, b, b, b and x = 1, 3, 2, 4, 9: group a has mean 2 and standard deviation 1.41, so its z-scores are ∓0.71; group b has mean 5 and standard deviation 3.61. Both libraries use the sample standard deviation (ddof = 1) by default, so pandas and Polars give the same numbers.</p><p>Building x once as a variable keeps the expression readable, and Polars computes the repeated group statistics efficiently.</p>' },
        { lvl: 'interview', q: 'You have 50 GB of tick data as Parquet files and a 16 GB laptop. Compute the daily VWAP per symbol. How?', sol: '<p><b>The problem is memory, not speed.</b> 50 GB can\'t be loaded into 16 GB of RAM. But the answer is small (one row per day per symbol), and the query only needs 4 columns. So never load the data: describe the query and let Polars run it in pieces.</p><pre class="sc-code">import polars as pl\n\ndef daily_vwap(path):\n    return (\n        pl.scan_parquet(path)                 # lazy: reads nothing yet\n        .select("t", "sym", "px", "qty")      # only 4 columns are read\n        .with_columns(day=pl.col("t").dt.date())\n        .group_by("day", "sym")\n        .agg(vwap=(pl.col("px") * pl.col("qty")).sum()\n             / pl.col("qty").sum())\n        .sort("day", "sym")\n    )</pre><p>Call <code>.collect()</code> on the result to run it. Two things make it fit:</p><ul><li><b>Projection pushdown:</b> Parquet stores each column separately, so reading 4 columns of a 40-column file touches a tenth of the bytes.</li><li><b>Streaming:</b> Polars can run the plan in batches, keeping only the running sums per (day, symbol) in memory. Ask for the streaming engine when you collect (the argument\'s name has changed between versions, so check the documentation for yours).</li></ul><p><b>Alternatives worth naming:</b> process one file (one day) at a time in a loop and concatenate the small results, or run the same query in DuckDB SQL directly on the Parquet files. And check one day against a simple pandas version.</p>' },
        { lvl: 'interview', q: 'When would you choose pandas over Polars, and the other way round?', sol: '<p><b>Lead with the deciding factors:</b> how big the data is, how often the code runs, and who has to maintain it.</p><table class="hb-table"><tr><th>Choose Polars when…</th><th>Choose pandas when…</th></tr><tr><td>data is large or growing, possibly bigger than memory (lazy queries, streaming)</td><td>data is small and the work is interactive exploration</td></tr><tr><td>a pipeline runs every day and speed or memory cost money</td><td>you need its ecosystem: statsmodels, scikit-learn examples, plotting, most online answers</td></tr><tr><td>you want every core used without extra work</td><td>a team and a codebase already use it</td></tr><tr><td>you want strict types and no index, so nothing aligns or converts silently</td><td>the index is genuinely useful, e.g. aligning many time series by date</td></tr></table><p><b>They work together.</b> A common pattern: heavy feature-building over years of data in Polars, then hand the small result to pandas (<code>.to_pandas()</code>) for modelling and plots.</p><p><b>What the interviewer listens for</b> is reasoning, not loyalty to one library: say what you\'d use for <i>their</i> case and why, and what would change your mind.</p>' },
        { lvl: 'stretch', q: 'Compute a 5-minute rolling VWAP for each symbol on irregular ticks in Polars.', sol: '<p><b>Two ideas combined.</b> A weighted average over a window is (rolling Σ px·qty) / (rolling Σ qty), never a rolling mean of prices. And "the last 5 minutes" on irregular ticks is a <i>time</i> window, so use the <code>_by</code> rolling functions keyed on the time column. Wrap both in <code>.over("sym")</code> so each symbol\'s window contains only its own ticks.</p><pre class="sc-code">import polars as pl\n\ndef rolling_vwap(ticks, window="5m"):\n    pv = pl.col("pv").rolling_sum_by("t", window_size=window)\n    q = pl.col("qty").rolling_sum_by("t", window_size=window)\n    return (\n        ticks.sort("sym", "t")\n        .with_columns(pv=pl.col("px") * pl.col("qty"))\n        .with_columns(vwap5=(pv / q).over("sym"))\n    )</pre><p><b>Why two with_columns.</b> Expressions in one context run independently, so a column created there can\'t be used in the same call. pv is created first, then used in the second call.</p><p><b>Example.</b> Symbol A trades 1 at 10.00 at 09:00 and 2 at 11.00 at 09:02, then 1 at 12.00 at 09:07. At 09:02 the window holds both earlier trades: (10 + 22)/3 = 10.67. At 09:07 the 5-minute window (09:02, 09:07] holds only the last trade: 12.00.</p>' },
      ],
      practice: [['Drill: desk report with group_by', '#/code/data/pl-report'], ['Drill: z-scores within groups with over()', '#/code/data/pl-over'], ['Drill: minute bars with group_by_dynamic', '#/code/data/pl-bars'], ['Drill: returns per symbol without leaking', '#/code/data/pl-returns']],
    },

    'dsa-marketdata': {
      title: 'Working with market data', minutes: 45,
      why: 'Knowing the libraries is half the job. The other half is the data itself: ticks arrive out of order and duplicated, stocks have different trading days, and a backtest that peeks one row into the future looks brilliant and loses money. Quant developer interviews often hand you a small, messy dataset and watch how you clean it, reshape it and test a simple idea without fooling yourself.',
      goals: ['Reshape between long and wide data, and align series with different calendars', 'Clean tick data: duplicates, ordering, time zones and bad prints', 'Write a vectorised backtest with costs and no look-ahead', 'Estimate memory, and choose dtypes and file formats'],
      prereq: ['dsa-polars'],
      sections: [
        { h: 'Long and wide', blocks: [
          `<p>Market data comes in two shapes. <b>Long</b> (tidy) data has one row per observation: (date, sym, px). It is how data is stored and how group_by works. <b>Wide</b> data has one row per date and one column per symbol, which is what you need for matrix maths: a return matrix, a correlation matrix, portfolio weights times returns.</p>
           <p>Convert with <code>long.pivot(index="date", columns="sym", values="px")</code> in pandas (or <code>pivot(on="sym", index="date", values="px")</code> in Polars), and back with <code>melt</code> (Polars: <code>unpivot</code>). Pivoting aligns calendars: a stock that didn't trade on a date gets <code>NaN</code> there. Don't fill missing <i>prices</i> with 0. Forward-fill a price for a short gap at most (<code>ffill(limit=…)</code>), and leave the return missing rather than invent one.</p>`,
          { code: `import pandas as pd


def wide_returns(long):
    """Daily returns, one column per symbol, from long data with columns date, sym, px.
    A day a stock didn't trade gives NaN, not a made-up return."""
    wide = long.pivot(index="date", columns="sym", values="px").sort_index()
    return wide.pct_change(fill_method=None)`, test: 'md_wide' },
          { q: 'Stock A trades on 5 days; stock B trades on 4 of them (it missed day 3). After pivoting and pct_change(fill_method=None), how many of B\'s 5 returns are <code>NaN</code>?', a: 3, tol: { abs: 0.1 }, hint: 'Day 1 has no previous price, and the gap breaks two returns.', sol: 'Day 1: no previous price. Day 3: no price. Day 4: the previous price (day 3) is missing. So <b>3</b> <code>NaN</code>, and only day 2 and day 5 have returns. (Older pandas filled the gap before computing returns by default, quietly inventing a 2-day return on day 4.)' },
        ] },
        { h: 'Cleaning ticks', blocks: [
          `<p>A checklist for raw trades and quotes:</p>
           <ol><li><b>Sort</b> by time (and a sequence number, if there is one); feeds and merged files are often out of order.</li>
           <li><b>Drop exact duplicates</b>, which come from replays and from reading both copies of a redundant (A/B) feed, but keep genuine repeated trades: two fills of 100 at the same price and millisecond can both be real. A trade or sequence ID is what tells them apart.</li>
           <li><b>Time zones</b>: store UTC, convert for display. <code>tz_localize</code> attaches a zone to naive timestamps; <code>tz_convert</code> changes the zone. Daylight saving moves exchange opens relative to UTC twice a year.</li>
           <li><b>Session filters</b>: keep regular hours unless you want auctions and pre-market.</li>
           <li><b>Bad prints</b>: flag prices far from a rolling median, rather than deleting outliers by eye. A real crash also looks like an outlier, so flag first and decide afterwards.</li></ol>`,
          { code: `import pandas as pd


def clean_trades(trades, max_dev):
    """Sort by time, drop exact duplicate rows, and flag prices more than max_dev (a fraction)
    away from the rolling median of the 5 trades centred on each one."""
    t = trades.sort_values("t", kind="stable").drop_duplicates().reset_index(drop=True)
    med = t["px"].rolling(5, center=True, min_periods=1).median()
    return t.assign(bad=(t["px"] / med - 1).abs() > max_dev)`, test: 'md_clean' },
          { id: 'm1', q: 'Two trade records have the same time, symbol, price and size, but different trade IDs. What should cleaning do?', opts: [['Keep both: the IDs show they are separate fills'], ['Drop one: matching time and price means a duplicate', 'Separate fills often share all of these; the ID is what tells you they are distinct.'], ['Drop both, as the data is unreliable', 'There is no evidence anything is wrong.'], ['Merge them into one record of twice the size', 'That changes the trade count, which some signals depend on.']], sol: 'Deduplicate on the full record, including IDs. Rows that differ only in trade ID are genuine separate trades; deleting one understates volume.' },
          { trap: 'Mixing naive and time-zone-aware timestamps, or comparing exchange-local times with UTC, shifts data by hours without any error. Convert everything to UTC as you load it, and assert the zone in tests.' },
        ] },
        { h: 'A backtest that doesn\'t lie', blocks: [
          `<p>A vectorised backtest is a few lines: positions from a signal, shifted one step so each trade uses only past information; P&amp;L as position × next return; costs on every change of position. The hard part is honesty:</p>
           <ul><li><b>Look-ahead:</b> a signal using today's close can't be traded at today's close. Shift, and be careful with anything computed over the whole sample (normalising, choosing parameters).</li>
           <li><b>Costs:</b> charge for turnover, |position<sub>t</sub> − position<sub>t−1</sub>| × cost. Many strategies that look good gross are flat net.</li>
           <li><b>Survivorship:</b> today's index members are the companies that survived. Backtesting on them ignores the ones that went bust.</li>
           <li><b>Overfitting:</b> trying 500 parameter sets and reporting the best is a search for luck. Keep a period you never look at until the end.</li></ul>`,
          { code: `import numpy as np
import pandas as pd


def backtest(prices, signal, cost):
    """Net daily returns of holding signal (a position from -1 to 1, decided at each close).
    cost is the fraction paid per unit of position traded."""
    pos = signal.shift(1).fillna(0.0)                 # decided yesterday, held today
    gross = pos * prices.pct_change().fillna(0.0)
    turnover = pos.diff().abs().fillna(pos.abs())     # the first day buys the whole position
    return gross - cost * turnover


def sharpe(daily, periods=252):
    sd = daily.std()
    return float(np.sqrt(periods) * daily.mean() / sd) if sd > 0 else 0.0`, test: 'md_backtest' },
          { q: 'Prices 100, 102, 101 and a signal of 1, 1, 0 (decided at each close). With no costs, what is the strategy\'s return on day 3, in percent? (2 decimal places.)', a: -0.98, tol: { abs: 0.005 }, hint: 'Day 3\'s position is day 2\'s signal.', sol: 'Day 3\'s position is the signal from day 2\'s close, 1, so it earns 101/102 − 1 = <b>−0.98%</b>. Without the shift it would use day 3\'s signal of 0 and dodge the loss: look-ahead.' },
          { q: 'A strategy flips between +1 and −1 every day, with costs of 5 basis points per unit traded. What does it pay in costs each day after the first, in basis points?', a: 10, tol: { abs: 0.01 }, hint: 'Going from +1 to −1 trades 2 units.', sol: 'Each flip trades |−1 − 1| = 2 units, at 5 bp each: <b>10</b> bp a day, about 25% a year over 252 days. High-turnover signals need a big edge.' },
        ] },
        { h: 'Memory, dtypes and file formats', blocks: [
          `<p>Estimate before you load: rows × columns × bytes per value. 100 million ticks with 5 float64 columns is 100M × 5 × 8 = 4 GB, before any copies made along the way (pandas operations often need 2 to 3 times the data size in working memory).</p>
           <ul><li><b>Prices as integer ticks</b> (int64 hundredths, or the instrument's tick size) avoid float rounding and compare exactly; <b>float32</b> halves memory but keeps only about 7 significant digits, too few for 12345.6789.</li>
           <li><b>Symbols as categories</b> (pandas <code>category</code>, Polars <code>Categorical</code>/<code>Enum</code>) store each distinct string once, plus a small integer code per row.</li>
           <li><b>Parquet, not CSV</b>: columnar, compressed, typed, and readable a few columns at a time. CSV loses dtypes and time zones, and must be parsed in full every time.</li>
           <li>Process <b>in chunks</b> (a day at a time) or lazily when it doesn't fit.</li></ul>`,
          { q: '100 million ticks with 5 float64 columns: how many GB is that in memory? (1 GB = 10⁹ bytes.)', a: 4, tol: { abs: 0.01 }, hint: '8 bytes per value.', sol: '10⁸ × 5 × 8 = 4 × 10⁹ bytes = <b>4 GB</b>.' },
          { id: 'm2', q: 'Why store prices as integer ticks rather than float64?', opts: [['Exact arithmetic and comparisons, with no rounding errors'], ['Integers take less memory than float64', 'int64 and float64 are both 8 bytes.'], ['Floats can\'t represent negative prices', 'They can; some contracts really do trade negative.'], ['pandas can\'t sort float columns quickly', 'Sorting floats is as fast as sorting integers.']], sol: 'A price like 100.07 isn\'t exactly representable in binary floating point, so sums drift and equality tests fail (is this order at the best price?). An integer count of ticks is exact, which matters in order books and P&amp;L reconciliation.' },
          { market: 'In an interview take-home, state your assumptions about the data (time zone, sessions, what a duplicate is) in a short README, and include a few asserts that check them. It shows the care that real data work needs, and graders look for it.' },
        ] },
      ],
      takeaways: ['Long data for storage and grouping; wide for matrix maths. Pivoting exposes missing days: leave gaps as <code>NaN</code>.', 'Clean ticks: sort, drop exact duplicates (keep real repeated fills), work in UTC, flag bad prints against a rolling median.', 'Backtests: shift the signal, charge costs on turnover, and beware survivorship and overfitting.', 'Estimate memory as rows × columns × bytes. Integer ticks, categories and Parquet keep data small and exact.'],
      explain: { q: 'Your backtest shows a Sharpe ratio of 4 on daily data. What do you check before believing it?', a: 'First, look-ahead: is every input to the position known before the return it earns? Check the shift, any normalisation or parameter choice made on the whole sample, and timestamps (close prices used before the close, data published with a delay). Second, costs and execution: turnover times realistic costs, slippage, and whether the trades could be filled at those prices. Third, the universe: survivorship bias, delisted stocks and corporate actions (splits and dividends in the price series). Fourth, overfitting: how many variants were tried, and how it does on data held out from the start. A Sharpe of 4 from a simple daily strategy is far more likely to be a bug than an edge.' },
      homework: [
        { lvl: 'core', q: 'Prices 100, 110, 99, and positions (already shifted) of 0, 1, 1. With no costs, what is the total of the daily strategy returns? (As a decimal.)', a: 0, tol: { abs: 0.0001 }, hint: 'Returns are +10% and −10%.', sol: '<p>Day 2: 1 × (110/100 − 1) = 0.1. Day 3: 1 × (99/110 − 1) = −0.1. The sum is <b>0</b>, although the compounded result is 1.1 × 0.9 − 1 = −1%: sums of simple returns aren\'t compounded returns.</p>' },
        { lvl: 'core', q: 'Positions over 4 days are 0, 1, 1, −1. How many units of turnover is that in total?', a: 3, tol: { abs: 0.1 }, hint: 'Add |change| each day.', sol: '<p>|1 − 0| + |1 − 1| + |−1 − 1| = 1 + 0 + 2 = <b>3</b>.</p>' },
        { lvl: 'core', q: 'A symbol column has 50 million rows but only 500 distinct symbols. Roughly how many MB do the category codes take, at 2 bytes each?', a: 100, tol: { abs: 0.5 }, hint: '50M × 2 bytes.', sol: '<p>50 × 10⁶ × 2 bytes = <b>100 MB</b> for the codes, plus a tiny table of 500 strings. As Python string objects the same column takes several GB.</p>' },
        { lvl: 'core', q: 'Daily strategy returns have mean 0.04% and standard deviation 1%. What is the annualised Sharpe ratio with 252 days? (2 decimal places.)', a: 0.63, tol: { abs: 0.01 }, hint: '√252 × mean / sd.', sol: '<p>√252 × 0.0004/0.01 = 15.87 × 0.04 = <b>0.63</b>.</p>' },
        { lvl: 'interview', q: 'You\'re given a CSV of a day\'s trades in several stocks and asked to report each stock\'s VWAP and number of trades, and to flag anything suspicious. Talk through your approach.', sol: '<p><b>Talk through it in four stages,</b> saying your assumptions as you go.</p><ol><li><b>Load with care.</b> Give explicit dtypes and parse the timestamps; say which time zone they\'re in (and convert to UTC).</li><li><b>Look before computing.</b> Row count; nulls per column; min and max price and size per symbol; timestamps inside the trading session; whether rows are sorted by time.</li><li><b>Clean, and flag rather than delete.</b> Sort by time. Drop exact duplicate rows (all columns, including any trade ID); rows that differ only in ID are separate fills and must stay. Flag zero or negative prices and sizes, and prices far from a rolling median.</li><li><b>Compute and report.</b></li></ol><pre class="sc-code">import pandas as pd\n\ndef summary(trades):\n    t = trades.sort_values("t").drop_duplicates()\n    t = t.assign(pv=t["px"] * t["qty"])\n    g = t.groupby("sym").agg(n=("qty", "size"), qty=("qty", "sum"),\n                             pv=("pv", "sum"))\n    return g.assign(vwap=g["pv"] / g["qty"]).drop(columns="pv")</pre><p><b>Report flagged rows separately</b>, with the VWAP both with and without them, so the reader can judge. Write it as functions with a few asserts (no duplicate IDs, prices positive, times sorted), so it runs again on tomorrow\'s file unchanged.</p>' },
        { lvl: 'interview', q: 'List four ways a backtest can look better than reality, and how to guard against each.', sol: '<ol><li><b>Look-ahead bias:</b> using information that wasn\'t available when the decision was made. Example: a signal computed from today\'s close and traded at today\'s close, or a z-score normalised with the whole sample\'s mean. <i>Guard:</i> shift signals by one period, use only past data in every statistic (rolling or expanding windows), and use data as it was known at the time (point-in-time), including publication delays.</li><li><b>Ignoring costs:</b> commissions, the bid–ask spread and market impact. A strategy that trades every day can lose 10–25% a year to costs. <i>Guard:</i> charge costs on turnover, and check the result survives doubling them.</li><li><b>Survivorship bias:</b> testing on today\'s index members, which are by definition the companies that survived. The ones that went bust, and would have lost money, are missing. <i>Guard:</i> use the universe as it was on each date, including delisted stocks.</li><li><b>Overfitting:</b> trying hundreds of parameter choices and reporting the best finds luck, not an edge. <i>Guard:</i> limit what you try, keep a final period you never look at until the end, test walk-forward, and prefer ideas with an economic reason to work.</li></ol><p><b>Two more worth mentioning:</b> corporate actions (use prices adjusted for splits and dividends, or a split looks like a 50% crash), and stale prices for illiquid assets, which make volatility look lower and Sharpe ratios higher than they are.</p>' },
        { lvl: 'stretch', q: 'Write the backtest in Polars for many symbols at once, from long data (date, sym, px, signal).', sol: '<p><b>The same logic as the pandas version,</b> but every step that looks at the previous row must run within each symbol, or one symbol\'s last price leaks into the next symbol\'s first return.</p><pre class="sc-code">import polars as pl\n\ndef backtest_all(df, cost):\n    """df: long data with columns date, sym, px, signal."""\n    pos = pl.col("pos")\n    trade = pos.diff().abs().over("sym").fill_null(pos.abs())\n    return (\n        df.sort("sym", "date")\n        .with_columns(\n            pos=pl.col("signal").shift(1).over("sym").fill_null(0.0),\n            ret=pl.col("px").pct_change().over("sym").fill_null(0.0))\n        .with_columns(net=pos * pl.col("ret") - cost * trade)\n    )</pre><p><b>What each piece does.</b> pos is yesterday\'s signal (so no look-ahead), ret is today\'s return, and the cost is charged on the size of each change in position, with the first day\'s trade being the whole position. pos is created in the first with_columns and used in the second.</p><p><b>The portfolio\'s daily return</b> is then <code>.group_by("date").agg(pl.col("net").sum())</code> (or a weighted sum, if positions are scaled). Checking one symbol against the pandas backtest is a quick way to catch a missing <code>.over</code>.</p>' },
      ],
      practice: [['Drill: daily returns from long data', '#/code/data/md-wide'], ['Drill: a backtest with costs', '#/code/data/md-backtest'], ['Drill: clean a day of trades', '#/code/data/md-clean']],
    },
  });
})();
