// Quant dev handbook, Part 4: binary search, sorting and intervals, backtracking, dynamic
// programming, greedy. See devbook-content.js. Code listings are run by research/verify_internals.py.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    'dsa-binsearch': {
      title: 'Binary search', minutes: 40,
      why: 'Binary search is easy to describe and famously easy to get wrong. Done properly, it finds an item in a sorted array, the first time a condition becomes true, or the smallest value of an answer that works, all in O(log n). That last use, "binary search on the answer", turns many hard-looking optimisation questions into simple ones.',
      goals: ['Write binary search without off-by-one errors, using a loop invariant', 'Find the first position where a condition becomes true', 'Search on the answer when feasibility is monotone', 'Use bisect for sorted inserts and range counts'],
      prereq: ['dsa-arrays', 'dsa-complexity'],
      sections: [
        { h: 'One template: the first true', blocks: [
          `<p>Most binary-search bugs come from mixing up inclusive and exclusive bounds. One template avoids them: find the <b>first index where a condition is true</b>, for a condition that is false, false, …, then true, true, … across the range.</p>
           <p>Keep lo and hi with the invariant "the answer is in [lo, hi]". Check the middle: if the condition holds there, the answer is at mid or to its left (hi = mid); otherwise it's to the right (lo = mid + 1). Stop when lo == hi. Finding a value in a sorted array is the condition a[i] ≥ target, then checking whether a[lo] equals it.</p>`,
          { code: `def first_true(lo, hi, cond):
    """Smallest i in [lo, hi] with cond(i) True, given cond is False...False True...True.
    Returns hi if none is True before it (so pass hi one past the end for "none")."""
    while lo < hi:
        mid = (lo + hi) // 2
        if cond(mid):
            hi = mid              # mid works: the answer is mid or earlier
        else:
            lo = mid + 1          # mid fails: the answer is later
    return lo


def lower_bound(a, x):
    """First index with a[i] >= x (len(a) if none): the same as bisect_left."""
    return first_true(0, len(a), lambda i: a[i] >= x)`, test: 'binsearch' },
          { q: 'In [1, 3, 3, 3, 7, 9], what index does lower_bound return for 3?', a: 1, tol: { abs: 0.1 }, hint: 'The first index whose value is at least 3.', sol: 'The first index with a value ≥ 3 is <b>1</b>. The first index with a value &gt; 3 (bisect_right) is 4, so the count of 3s is 4 − 1 = 3: counting occurrences in O(log n).' },
        ] },
        { h: 'Searching a rotated or unusual array', blocks: [
          `<p>Binary search works whenever you can discard half the range with one check, not only on plain sorted arrays. In a sorted array that has been rotated ([4, 5, 6, 7, 0, 1, 2]), the minimum is the first element smaller than the last element: a condition that is false then true, so the template finds it directly. A peak (an element bigger than its neighbours) can be found by moving towards the higher neighbour.</p>`,
          { code: `def rotated_min(a):
    """Minimum of a sorted array rotated by some amount (distinct values)."""
    return a[first_true(0, len(a) - 1, lambda i: a[i] <= a[-1])]`, test: 'rotated' },
          { q: 'What is the minimum of the rotated array [4, 5, 6, 7, 0, 1, 2]? (It\'s the value at the first index where a[i] ≤ the last element.)', a: 0, tol: { abs: 0.1 }, hint: 'Values ≤ 2 start at index 4.', sol: 'a[i] ≤ 2 is false for 4, 5, 6, 7 and true from index 4 on, so the minimum is a[4] = <b>0</b>, found in O(log n).' },
        ] },
        { h: 'Binary search on the answer', blocks: [
          `<p>Many questions ask for the smallest (or largest) value of something that works: the minimum speed to finish in time, the smallest capacity to ship everything in d days, the largest minimum distance. If "x works" implies "anything bigger works" (feasibility is monotone), binary search over x, using a check that runs in O(n). Total: O(n log range).</p>`,
          { worked: 'shipping in d days', q: 'Packages weigh [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], shipped in order, in 5 days. What is the smallest daily capacity that works?', steps: [
            ['What is the range of possible capacities?', 'At least the heaviest package (10), at most the total (55).'],
            ['How do you check a capacity c?', 'Greedily fill each day up to c; count the days needed; it works if that\'s ≤ 5. O(n).'],
            ['Why is binary search allowed?', 'If c works, any bigger capacity works too: feasibility is false, …, false, true, … over c.'],
            'Searching 10–55 gives <b>15</b>: days [1–5], [6, 7], [8], [9], [10].',
          ] },
          { id: 'x1', q: 'Packages [3, 2, 2, 4, 1, 4] must ship in order within 3 days. What is the smallest daily capacity?', a: 6, tol: { abs: 0.1 }, hint: 'Try 6: [3, 2], [2, 4], [1, 4].', sol: 'Capacity 5 needs 4 days ([3, 2], [2], [4, 1], [4]). Capacity 6 manages [3, 2], [2, 4], [1, 4]: 3 days. The answer is <b>6</b>.' },
          { q: 'At most how many loop iterations does first_true make on a range of 1,000,000 positions?', a: 20, tol: { abs: 0.1 }, hint: 'Each iteration at least halves the range (rounding up).', sol: 'The range shrinks 1,000,000 → 500,000 → … → 1, and 2²⁰ = 1,048,576 ≥ 1,000,000, so at most <b>20</b> iterations. A billion positions needs only 30.' },
          { trap: 'Write (lo + hi) // 2, and make sure every branch shrinks the range: hi = mid with lo = mid + 1 always terminates, but lo = mid can loop for ever when hi = lo + 1.' },
        ] },
      ],
      takeaways: ['Use one template: the first index where a monotone condition is true, with hi = mid / lo = mid + 1.', 'lower_bound (bisect_left) and upper_bound (bisect_right); their difference counts occurrences.', 'Binary search needs only a way to discard half: rotated arrays, peaks.', 'Binary search on the answer when "x works" implies "bigger works": O(n log range).'],
      explain: { q: 'What makes a problem suitable for "binary search on the answer"?', a: 'There must be a yes/no check for a candidate value that is monotone: once a value works, every larger value works too (or every smaller one). Then the answers form false, false, …, true, true, and binary search finds the boundary with O(log range) checks. Each check is usually a greedy O(n) pass, so the whole thing is O(n log range).' },
      homework: [
        { lvl: 'core', q: 'How many times does 5 appear in [1, 2, 5, 5, 5, 5, 8], using bisect_right − bisect_left?', a: 4, tol: { abs: 0.1 }, hint: 'bisect_left gives 2, bisect_right 6.', sol: '<p>bisect_left(a, 5) = 2 (first 5) and bisect_right(a, 5) = 6 (just past the last 5). 6 − 2 = <b>4</b>, in O(log n).</p>' },
        { lvl: 'core', q: 'Integer square root: what is the largest integer x with x² ≤ 2,000,000?', a: 1414, tol: { abs: 0.1 }, hint: '1414² = 1,999,396.', sol: '<p>Binary search for the last x with x² ≤ n (or the first with x² &gt; n, minus one). 1414² = 1,999,396 ≤ 2,000,000 and 1415² = 2,002,225 &gt; it: <b>1414</b>. About 21 steps over 0…2,000,000.</p>' },
        { lvl: 'core', q: 'In [1, 2, 1, 3, 5, 6, 4], a peak is an element larger than both neighbours. Moving towards the larger neighbour, binary search can return the peak at index 5. What value is there?', a: 6, tol: { abs: 0.1 }, hint: 'Index 5.', sol: '<p>a[5] = <b>6</b>, bigger than 5 and 4. (Index 1, value 2, is also a peak; binary search returns one of them.) If a[mid] &lt; a[mid + 1], a peak lies to the right, because the values must eventually come down.</p>' },
        { lvl: 'core', q: 'Koko eats bananas: piles [3, 6, 7, 11], 8 hours, eating at most k bananas from one pile per hour. What is the smallest k that finishes in time?', a: 4, tol: { abs: 0.1 }, hint: 'Hours at speed k: the sum of ceil(pile/k).', sol: '<p>At k = 4: 1 + 2 + 2 + 3 = 8 hours ✓. At k = 3: 1 + 2 + 3 + 4 = 10 ✗. Feasibility is monotone in k, so binary search over k from 1 to 11 gives <b>4</b>.</p>' },
        { lvl: 'interview', q: 'A sorted array of timestamps holds millions of trades. How do you count the trades between 10:00:00 and 10:05:00 in O(log n)?', sol: '<p><b>The idea.</b> Because the timestamps are sorted, the trades in any time range sit next to each other in one contiguous block. You only need to find where that block starts and where it ends, and each is one binary search.</p><pre class="sc-code">from bisect import bisect_left, bisect_right\n\ndef count_between(times, start, end):\n    """Trades with start &lt;= t &lt; end (a half-open window)."""\n    lo = bisect_left(times, start)   # first index with t &gt;= start\n    hi = bisect_left(times, end)     # first index with t &gt;= end\n    return hi - lo</pre><p><b>Which bisect?</b> bisect_left(times, x) returns the first position whose value is ≥ x; bisect_right returns the first position whose value is &gt; x. For the half-open window [10:00:00, 10:05:00), which counts a trade at exactly 10:00:00 but not one at 10:05:00, use bisect_left for both ends. To include the end time too, use bisect_right for the end.</p><p><b>Example.</b> times (in seconds) = [1, 3, 3, 5, 8], window [3, 8): lo = 1 (the first 3), hi = 4 (the 8), so 3 trades: 3, 3 and 5.</p><p><b>Cost.</b> Two binary searches, O(log n) each, so a count over millions of trades takes about 40 comparisons. The trades themselves are times[lo:hi], with no scan. This is how time-range queries on tick data stay fast, and why tick stores keep data sorted by time.</p>' },
        { lvl: 'interview', q: 'Why is (lo + hi) // 2 safe in Python, when (lo + hi) / 2 in C++ or Java can be a bug?', sol: '<p><b>The bug in fixed-width languages.</b> In C++ or Java an int is 32 bits and holds at most 2,147,483,647. If lo and hi are both above about 1.07 billion, lo + hi is too big to store and wraps round to a negative number, so the midpoint is negative and the array access crashes or reads garbage. This bug sat in Java\'s own library binary search for about nine years before it was found.</p><p><b>The safe form</b> computes the distance first, which can\'t overflow because hi − lo is at most the array length:</p><div class="hb-eq">mid = lo + (hi − lo) / 2</div><p><b>Why Python is safe.</b> Python\'s integers grow as large as needed, so lo + hi is always exact. <code>//</code> is floor division, so (lo + hi) // 2 is an exact integer midpoint.</p><p><b>In an interview:</b> write the Python version, and mention the overflow form unprompted if the role uses C++ or Java. It shows you know why the idiom exists rather than just copying it.</p>' },
        { lvl: 'stretch', q: 'Find the median of two sorted arrays of sizes m and n in O(log(min(m, n))).', sol: '<p><b>Reframe it.</b> The median splits the combined data into a left half and a right half. Instead of merging, choose <i>how many</i> elements of the shorter array A go in the left half, say i. The left half needs (m + n + 1) // 2 elements in total, so the number taken from B is forced: j = (m + n + 1) // 2 − i. Binary search for the right i.</p><p><b>When is a split right?</b> Every element on the left must be ≤ every element on the right. Within each array that\'s automatic (they\'re sorted), so only the two cross-checks matter: A[i − 1] ≤ B[j] and B[j − 1] ≤ A[i]. If A[i − 1] &gt; B[j], A gave too many: move i left. Otherwise if B[j − 1] &gt; A[i], A gave too few: move i right.</p><pre class="sc-code">def median_two_sorted(A, B):\n    if len(A) &gt; len(B):\n        A, B = B, A                      # binary search the shorter one\n    m, n = len(A), len(B)\n    half = (m + n + 1) // 2\n    lo, hi = 0, m\n    inf = float("inf")\n    while True:\n        i = (lo + hi) // 2\n        j = half - i\n        a_left = A[i - 1] if i &gt; 0 else -inf\n        a_right = A[i] if i &lt; m else inf\n        b_left = B[j - 1] if j &gt; 0 else -inf\n        b_right = B[j] if j &lt; n else inf\n        if a_left &gt; b_right:\n            hi = i - 1                   # took too many from A\n        elif b_left &gt; a_right:\n            lo = i + 1                   # took too few from A\n        else:\n            left_max = max(a_left, b_left)\n            if (m + n) % 2:\n                return left_max\n            return (left_max + min(a_right, b_right)) / 2</pre><p><b>Example.</b> A = [1, 3], B = [2, 4, 5]: half = 3. Try i = 1, j = 2: left is {1} ∪ {2, 4}, right is {3} ∪ {5}; but 4 &gt; 3, so A gave too few. Try i = 2, j = 1: left {1, 3, 2}, right {4, 5}: valid. The total is odd, so the median is max(3, 2) = 3.</p><p><b>Cost.</b> O(log min(m, n)). The ±∞ sentinels handle splits at the very ends; test with an empty array and with arrays of length 1, which is where most attempts break.</p>' },
      ],
      practice: [['Prices after dividends', '#/code/opt-dividends'], ['Coding problems', '#/code']],
    },

    'dsa-sorting': {
      title: 'Sorting and intervals', minutes: 40,
      why: 'Sorting is often the first step that makes a problem easy: once data is in order, duplicates are adjacent, intervals can be merged in one pass, and two pointers work. You should also know what the standard sorts cost, which are stable, and how to find the k-th smallest without sorting at all.',
      goals: ['Know the main sorting algorithms, their costs and stability', 'Sort by custom keys and break ties deliberately', 'Merge overlapping intervals and count overlaps with a sweep line', 'Find the k-th smallest in O(n) on average with quickselect'],
      prereq: ['dsa-binsearch'],
      sections: [
        { h: 'The sorts you should know', blocks: [
          `<table class="hb-table"><tr><th>Sort</th><th>Time</th><th>Extra space</th><th>Stable</th><th>Note</th></tr>
           <tr><td>Merge sort</td><td>O(n log n) always</td><td>O(n)</td><td>yes</td><td>split, sort halves, merge</td></tr>
           <tr><td>Quicksort</td><td>O(n log n) average, O(n²) worst</td><td>O(log n)</td><td>no</td><td>partition round a pivot; fast in practice</td></tr>
           <tr><td>Heapsort</td><td>O(n log n)</td><td>O(1)</td><td>no</td><td>heapify, then pop</td></tr>
           <tr><td>Timsort (Python)</td><td>O(n log n), O(n) on sorted runs</td><td>O(n)</td><td>yes</td><td>merges natural runs</td></tr>
           <tr><td>Counting / radix</td><td>O(n + k)</td><td>O(k)</td><td>yes</td><td>small integer keys only</td></tr></table>
           <p>No comparison sort can beat O(n log n) in the worst case: there are n! possible orders, and each comparison at best halves the possibilities, so you need log₂ n! ≈ n log₂ n comparisons. Counting sort escapes this by not comparing.</p>`,
          { q: 'At least how many comparisons does any comparison sort need, in the worst case, to sort 4 items? (⌈log₂ 4!⌉.)', a: 5, tol: { abs: 0.1 }, hint: '4! = 24, and 2⁴ = 16 &lt; 24 ≤ 32 = 2⁵.', sol: 'There are 24 possible orders, and each comparison has two outcomes, so you need ⌈log₂ 24⌉ = <b>5</b> comparisons in the worst case. Merge sort on 4 items uses at most 5.' },
        ] },
        { h: 'Intervals: sort, then sweep', blocks: [
          `<p>Interval questions (meetings, order lifetimes, trading sessions) almost always start by sorting.</p>
           <ul><li><b>Merge overlapping intervals:</b> sort by start; walk through, extending the current interval while the next one starts before it ends.</li>
           <li><b>Maximum overlap</b> (rooms needed, peak live orders): turn each interval into a +1 event at its start and a −1 at its end, sort the events (ends before starts at the same time, for half-open intervals), and keep a running count. This is a <b>sweep line</b>.</li></ul>`,
          { code: `def merge_intervals(intervals):
    out = []
    for start, end in sorted(intervals):
        if out and start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)     # overlaps: extend
        else:
            out.append([start, end])
    return out


def max_overlap(intervals):
    """Most half-open intervals [s, e) live at once."""
    events = sorted([(s, 1) for s, e in intervals] + [(e, -1) for s, e in intervals])
    live = best = 0
    for _, delta in events:          # at equal times -1 sorts before +1: ends first
        live += delta
        best = max(best, live)
    return best`, test: 'intervals' },
          { q: 'Merging [1, 3], [2, 6], [8, 10], [15, 18] gives how many intervals?', a: 3, tol: { abs: 0.1 }, hint: '[1, 3] and [2, 6] overlap.', sol: '[1, 3] and [2, 6] merge into [1, 6]; the others don\'t overlap: [1, 6], [8, 10], [15, 18] — <b>3</b> intervals.' },
          { q: 'Meetings [0, 30), [5, 10), [15, 20): how many rooms are needed?', a: 2, tol: { abs: 0.1 }, hint: 'The long meeting overlaps each short one, but the short ones don\'t overlap each other.', sol: 'At most two meetings run at once ([0, 30) with either short one), so <b>2</b> rooms. The sweep line counts it in O(n log n).' },
        ] },
        { h: 'The k-th smallest without sorting', blocks: [
          `<p><b>Quickselect</b>: partition around a random pivot like quicksort, but recurse only into the side that contains the k-th position. Average O(n) (n + n/2 + n/4 + …), worst O(n²) (avoided in practice by the random pivot). Use it for medians and percentiles of a large batch. For a stream, use heaps instead.</p>`,
          { code: `import random


def quickselect(a, k):
    """The k-th smallest (k = 0 is the minimum) of list a. Average O(n)."""
    pivot = random.choice(a)
    lo = [x for x in a if x < pivot]
    eq = [x for x in a if x == pivot]
    if k < len(lo):
        return quickselect(lo, k)
    if k < len(lo) + len(eq):
        return pivot
    return quickselect([x for x in a if x > pivot], k - len(lo) - len(eq))`, test: 'quickselect' },
          { id: 'm1', q: 'Why does quickselect run in O(n) on average while quicksort is O(n log n)?', opts: [['It recurses into only one side'], ['It uses a better pivot rule', 'Both pick pivots the same way.'], ['It never compares equal items', 'It does.'], ['It stops after log n steps', 'It stops when the k-th position is found.']], sol: 'After partitioning, quicksort must sort both sides, but quickselect only needs the side containing position k. The work shrinks geometrically, n + n/2 + n/4 + … ≈ 2n, instead of n per level for log n levels.' },
        ] },
      ],
      takeaways: ['Merge sort: stable O(n log n). Quicksort: fast average, O(n²) worst. Python\'s Timsort: stable, O(n) on sorted data.', 'Comparison sorts need Ω(n log n); counting sort avoids comparisons for small integer keys.', 'Intervals: sort by start, then merge or sweep with +1/−1 events.', 'k-th smallest: quickselect in O(n) average; for streams, heaps.'],
      explain: { q: 'Why can no comparison-based sort beat O(n log n) in the worst case?', a: 'A comparison sort must be able to produce each of the n! possible orderings of the input. Each comparison has two outcomes, so after c comparisons it can distinguish at most 2ᶜ cases. To cover n! cases, c must be at least log₂ n!, which is about n log₂ n. Counting and radix sorts get around this by using the values directly instead of comparing them.' },
      homework: [
        { lvl: 'core', q: 'Merging [1, 4] and [4, 5] (closed intervals, touching endpoints count as overlapping) gives one interval. What is its length?', a: 4, tol: { abs: 0.1 }, hint: '[1, 5].', sol: '<p>Touching intervals merge to [1, 5], of length <b>4</b>. Whether touching intervals merge depends on the problem: say which convention you\'re using.</p>' },
        { lvl: 'core', q: 'Intervals [1, 5), [2, 6), [4, 8), [7, 9): what is the largest number live at once?', a: 3, tol: { abs: 0.1 }, hint: 'Look at time 4.', sol: '<p>At time 4, [1, 5), [2, 6) and [4, 8) are all live: <b>3</b>. At 7, [1, 5) and [2, 6) have ended. The sweep line finds the maximum in O(n log n).</p>' },
        { lvl: 'core', q: 'What is the median (3rd smallest) of [7, 1, 5, 3, 9]?', a: 5, tol: { abs: 0.1 }, hint: 'Sorted: 1, 3, 5, 7, 9.', sol: '<p>Sorted, the values are 1, 3, 5, 7, 9; the 3rd smallest is <b>5</b>. Quickselect finds it without sorting the rest.</p>' },
        { lvl: 'core', q: 'How many comparisons does merging two sorted lists of lengths 4 and 4 take at most?', a: 7, tol: { abs: 0.1 }, hint: 'Each comparison outputs one element; the last one needs no comparison.', sol: '<p>Each comparison places one element, and once one list is empty the rest is copied without comparing. The worst case leaves one element at the end: 4 + 4 − 1 = <b>7</b>.</p>' },
        { lvl: 'interview', q: 'Sort a million trade records by (symbol, then time). How, and what property of the sort matters?', sol: '<p><b>Sort once by a tuple key.</b> Python compares tuples element by element, so sorting by (symbol, time) orders by symbol and, within a symbol, by time:</p><pre class="sc-code">from operator import attrgetter\n\ndef by_symbol_then_time(trades):\n    return sorted(trades, key=attrgetter("symbol", "time"))</pre><p><b>The property that matters: stability.</b> A sort is <b>stable</b> if records with equal keys keep their original order. It\'s what makes the other classic approach work: sort by the secondary key first, then by the primary key.</p><pre class="sc-code">def by_symbol_then_time_two_passes(trades):\n    trades = sorted(trades, key=attrgetter("time"))\n    return sorted(trades, key=attrgetter("symbol"))  # keeps time order</pre><p>The second sort only compares symbols, so it leaves equal symbols in the order the first sort put them: by time. With an unstable sort (quicksort or heapsort, as some libraries use), the time order inside each symbol would be scrambled.</p><p><b>Cost.</b> Python\'s sort (Timsort) is stable and O(n log n), and it detects runs that are already in order, so nearly sorted data, which tick data usually is, sorts in close to O(n). A million records take well under a second.</p>' },
        { lvl: 'interview', q: 'When would you use counting sort instead of the built-in sort?', sol: '<p><b>When the keys are small integers in a known range.</b> Prices in ticks within a day\'s band, hours of the day, ratings 1 to 5. Instead of comparing items, count how many have each key, then lay them out in key order:</p><pre class="sc-code">def counting_sort(items, key, k):\n    """Stable sort of items by key(x), an integer in 0..k-1."""\n    counts = [0] * k\n    for x in items:\n        counts[key(x)] += 1\n    start, total = [0] * k, 0\n    for v in range(k):                   # where each key\'s block begins\n        start[v], total = total, total + counts[v]\n    out = [None] * len(items)\n    for x in items:                      # front to back keeps it stable\n        out[start[key(x)]] = x\n        start[key(x)] += 1\n    return out</pre><p><b>Cost.</b> O(n + k), where k is the number of possible keys. That beats O(n log n) when k is small compared with n: sorting 10 million trades into 500 price ticks is two passes. Placing items front to back in their blocks keeps the sort stable, which is what lets radix sort sort by one digit at a time.</p><p><b>When not to:</b> keys that are floats, strings or a huge range (k = 10⁹ would need a billion counters). For general data the built-in sort is the right default.</p>' },
        { lvl: 'stretch', q: 'Insert a new interval into a sorted list of non-overlapping intervals, merging where needed, in O(n).', sol: '<p><b>The idea.</b> Because the intervals are sorted and don\'t overlap, they fall into three groups relative to the new interval: those entirely before it, those that overlap it, and those entirely after it. Handle each group in turn, in one pass.</p><pre class="sc-code">def insert_interval(intervals, new):\n    start, end = new\n    out, i, n = [], 0, len(intervals)\n    # 1. entirely before the new interval\n    while i &lt; n and intervals[i][1] &lt; start:\n        out.append(intervals[i])\n        i += 1\n    # 2. overlapping it: absorb into it\n    while i &lt; n and intervals[i][0] &lt;= end:\n        start = min(start, intervals[i][0])\n        end = max(end, intervals[i][1])\n        i += 1\n    out.append((start, end))\n    out.extend(intervals[i:])    # 3. entirely after\n    return out</pre><p><b>Example.</b> [(1, 2), (3, 5), (6, 7), (8, 10), (12, 16)] with new (4, 8): (1, 2) ends before 4, so copy it. (3, 5), (6, 7) and (8, 10) each start at or before the growing end, so absorb them: the merged interval grows to (3, 10). (12, 16) starts after 10, so copy it. Result: [(1, 2), (3, 10), (12, 16)].</p><p><b>Cost.</b> O(n): each interval is looked at once, and no sorting is needed because the input is sorted already. Binary search could find the first overlap in O(log n), but building the output is O(n) anyway. Decide whether touching intervals like (1, 2) and (2, 3) should merge; this version (≤ in step 2) merges them.</p>' },
      ],
      practice: [['Peak number of live orders', '#/code/opt-peak-live'], ['Coding problems', '#/code']],
    },

    'dsa-backtracking': {
      title: 'Recursion and backtracking', minutes: 40,
      why: 'When a question asks for all subsets, all orderings or all valid combinations, the answer is a systematic search: make a choice, explore, undo the choice. Backtracking is that pattern, and with good pruning it solves puzzles that look exponential within the limits.',
      goals: ['Generate all subsets, permutations and combinations', 'Use the choose–explore–undo template', 'Prune branches that can\'t succeed', 'Estimate the cost of a search from its branching'],
      prereq: ['dsa-complexity', 'dsa-trees'],
      sections: [
        { h: 'The template: choose, explore, undo', blocks: [
          `<p>Picture the search as a tree: each level is a decision, each branch a choice. A recursive function holds the partial answer in a list; at each call it tries each remaining choice, appends it, recurses, then pops it. Record the partial answer whenever it is complete.</p>
           <p>Subsets: each element is in or out, 2ⁿ leaves. Permutations: n choices, then n − 1, …: n! leaves. Combinations of size k: C(n, k). These counts, times O(n) to copy each answer, are the running times, so the "reading the constraints" table applies: subsets for n ≤ 20, permutations for n ≤ 10.</p>`,
          { code: `def subsets(items):
    out, cur = [], []

    def go(i):
        if i == len(items):
            out.append(cur[:])        # a copy: cur keeps changing
            return
        go(i + 1)                     # leave items[i] out
        cur.append(items[i])          # choose it
        go(i + 1)                     # explore
        cur.pop()                     # undo

    go(0)
    return out


def permutations(items):
    out, cur, used = [], [], [False] * len(items)

    def go():
        if len(cur) == len(items):
            out.append(cur[:])
            return
        for i, x in enumerate(items):
            if not used[i]:
                used[i] = True
                cur.append(x)
                go()
                cur.pop()
                used[i] = False

    go()
    return out`, test: 'backtrack_basic' },
          { q: 'How many permutations of 5 distinct items are there?', a: 120, tol: { abs: 0.1 }, hint: '5!.', sol: '5 × 4 × 3 × 2 × 1 = <b>120</b>. Each has length 5 to copy, so generating all of them is O(n · n!).' },
          { trap: 'Appending cur instead of cur[:] stores the same list object every time, which is empty by the end. Always append a copy.' },
        ] },
        { h: 'Pruning', blocks: [
          `<p>Backtracking becomes fast when you stop exploring branches that can't lead to an answer. In combination sum (choose numbers, with repeats, that add up to a target), sort the candidates and stop the loop as soon as a candidate exceeds what's left. In N-queens, track occupied columns and diagonals in sets so each placement is checked in O(1), and only safe squares are tried.</p>`,
          { code: `def combination_sum(candidates, target):
    """All combinations (each number reusable) summing to target, each in non-decreasing order."""
    candidates = sorted(candidates)
    out, cur = [], []

    def go(start, remaining):
        if remaining == 0:
            out.append(cur[:])
            return
        for i in range(start, len(candidates)):
            c = candidates[i]
            if c > remaining:
                break                 # prune: every later candidate is bigger still
            cur.append(c)
            go(i, remaining - c)      # i, not i + 1: c may be used again
            cur.pop()

    go(0, target)
    return out


def n_queens(n):
    """Number of ways to place n non-attacking queens on an n x n board."""
    cols, d1, d2 = set(), set(), set()

    def go(r):
        if r == n:
            return 1
        total = 0
        for c in range(n):
            if c in cols or r - c in d1 or r + c in d2:
                continue
            cols.add(c); d1.add(r - c); d2.add(r + c)
            total += go(r + 1)
            cols.remove(c); d1.remove(r - c); d2.remove(r + c)
        return total

    return go(0)`, test: 'backtrack_prune' },
          { q: 'How many combinations from [2, 3, 6, 7] (numbers reusable) sum to 7?', a: 2, tol: { abs: 0.1 }, hint: '[7] and [2, 2, 3].', sol: '[2, 2, 3] and [7]: <b>2</b>. Starting each recursion at the current index (not 0) avoids counting [2, 3, 2] and [3, 2, 2] again.' },
          { q: 'How many valid strings of 3 pairs of brackets are there? (Add "(" while fewer than 3 are open; add ")" only while it has a "(" to match.)', a: 5, tol: { abs: 0.1 }, hint: '((())), (()()), (())(), ()(()), ()()().', sol: '((())), (()()), (())(), ()(()) and ()()(): <b>5</b>, the Catalan number C(3). With those two pruning rules every branch completes to a valid string, so no work is wasted.' },
          { q: 'How many solutions does the 6-queens puzzle have?', a: 4, tol: { abs: 0.1 }, hint: 'Run the code, or recall: 1, 0, 0, 2, 10, 4 for n = 1…6.', sol: 'The counts for n = 1…8 are 1, 0, 0, 2, 10, 4, 40, 92. For n = 6 there are <b>4</b>.' },
        ] },
      ],
      takeaways: ['Template: choose, explore, undo; record complete answers as copies.', 'Subsets 2ⁿ, permutations n!, combinations C(n, k): know the limits these allow.', 'Avoid duplicate combinations by starting each level at the current index.', 'Prune early: sort and break, or track constraints in sets for O(1) checks.'],
      explain: { q: 'What is the difference between generating subsets and generating combinations that sum to a target, in terms of the search tree?', a: 'Subsets explore the full binary tree of include/exclude decisions, 2ⁿ leaves, and keep every leaf. Combination sum explores a tree where each level picks the next number (from the current index on, to avoid reorderings) and prunes any branch whose running total passes the target, so far fewer nodes are visited, and only branches that hit the target exactly are recorded.' },
      homework: [
        { lvl: 'core', q: 'How many subsets does a 6-element set have, including the empty set?', a: 64, tol: { abs: 0.1 }, hint: '2⁶.', sol: '<p>Each element is in or out: 2⁶ = <b>64</b>.</p>' },
        { lvl: 'core', q: 'How many ways can you choose 3 items from 6 (order not mattering)?', a: 20, tol: { abs: 0.1 }, hint: 'C(6, 3).', sol: '<p>C(6, 3) = 6 × 5 × 4/(3 × 2 × 1) = <b>20</b>. Backtracking generates them by starting each level after the last chosen index.</p>' },
        { lvl: 'core', q: 'How many solutions does the 5-queens puzzle have?', a: 10, tol: { abs: 0.1 }, hint: 'The sequence is 1, 0, 0, 2, 10, 4, …', sol: '<p><b>10</b>. Pruning with column and diagonal sets makes the search fast: far fewer than the 5⁵ = 3,125 column choices are ever tried.</p>' },
        { lvl: 'core', q: 'How many distinct permutations does [1, 1, 2] have?', a: 3, tol: { abs: 0.1 }, hint: '3!/2!.', sol: '<p>3!/2! = <b>3</b>: 112, 121, 211. When generating, sort the input and skip a value equal to the previous one if the previous one is unused at this level, to avoid duplicates.</p>' },
        { lvl: 'interview', q: 'Generate all valid strings of n pairs of brackets. What pruning rules make every branch produce a valid string?', sol: '<p><b>Build the string one character at a time</b>, tracking how many "(" and ")" you\'ve used. Two rules decide what may come next:</p><ol><li>You may add "(" while you\'ve used fewer than n of them.</li><li>You may add ")" only while there are unmatched "(", that is, while close &lt; open.</li></ol><pre class="sc-code">def brackets(n):\n    out = []\n    def build(s, open_, close):\n        if len(s) == 2 * n:\n            out.append(s)\n            return\n        if open_ &lt; n:\n            build(s + "(", open_ + 1, close)\n        if close &lt; open_:\n            build(s + ")", open_, close + 1)\n    build("", 0, 0)\n    return out</pre><p><b>Why every finished string is valid, with no wasted work.</b> Rule 2 means no prefix ever has more ")" than "(", so nothing closes a bracket that isn\'t open. When the string reaches length 2n, rule 1 caps "(" at n, so there are exactly n of each, and everything opened has been closed. And at every step at least one rule allows a move, so no branch dead-ends: the search does work only for strings it will output.</p><p><b>Example.</b> n = 3 gives (((), (()()), (())(), ()(()), ()()(): five strings. The count is the Catalan number C(n) = C(2n, n)/(n + 1): 5 for n = 3, 42 for n = 5. The total cost is O(C(n) × n), essentially the size of the output.</p>' },
        { lvl: 'interview', q: 'A word-search grid: does a word appear as a path of adjacent cells, each used at most once? Outline the search and its worst-case cost.', sol: '<p><b>The search.</b> Try every cell as a starting point. From a cell matching the current letter, try each neighbour that matches the next letter and isn\'t already on the path. If a branch fails, undo and try the next one: <b>choose, explore, undo</b>.</p><pre class="sc-code">def exists(board, word):\n    rows, cols = len(board), len(board[0])\n    def dfs(r, c, i):\n        if i == len(word):\n            return True\n        if not (0 &lt;= r &lt; rows and 0 &lt;= c &lt; cols):\n            return False\n        if board[r][c] != word[i]:\n            return False\n        board[r][c] = "#"                     # choose: mark as used\n        found = any(dfs(r + dr, c + dc, i + 1)\n                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))\n        board[r][c] = word[i]                 # undo\n        return found\n    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))</pre><p>Marking the cell in the board itself (and restoring it) avoids a separate visited set. Because a cell on the path holds "#", it can never match a letter, so it can\'t be reused.</p><p><b>Worst case.</b> From each of the rows × cols starting cells, the first step has up to 4 directions and every later step at most 3 (you can\'t go back to the cell you came from). For a word of length L that\'s O(rows × cols × 3<sup>L</sup>). The bad case is a grid of all "a" and the word "aaa…ab": every path matches until the last letter.</p><p><b>Speed-ups worth mentioning:</b> check first that the board contains enough of each letter; and if one end of the word is a rare letter, search for the reversed word so the search starts from the rare end.</p>' },
        { lvl: 'stretch', q: 'Partition a list into two subsets with equal sums: why is backtracking slow here, and what\'s the better approach?', sol: '<p><b>Why backtracking is slow.</b> Each number goes in one subset or the other, so there are 2ⁿ ways to split. Pruning helps a little, but for n = 100 even a tiny fraction of 2¹⁰⁰ is hopeless.</p><p><b>Ask a smaller question.</b> Two equal halves means one subset sums to exactly total/2 (and if the total is odd, the answer is no immediately). You don\'t need to know <i>which</i> subset, only whether that sum is reachable. And there are at most total + 1 possible sums, however many subsets there are.</p><p><b>Dynamic programming over reachable sums.</b> Start with {0} (the empty subset). For each number x, every sum you could already make, you can now also make plus x.</p><pre class="sc-code">def can_partition(nums):\n    total = sum(nums)\n    if total % 2:\n        return False\n    target = total // 2\n    reachable = {0}\n    for x in nums:\n        reachable |= {s + x for s in reachable if s + x &lt;= target}\n    return target in reachable</pre><p><b>Example.</b> [1, 5, 11, 5]: total 22, target 11. Reachable sums grow {0} → {0, 1} → {0, 1, 5, 6} → {0, 1, 5, 6, 11} → …, and 11 is reachable (11 alone, or 1 + 5 + 5), so yes.</p><p><b>Cost.</b> O(n × total) time: n steps, each touching at most total/2 + 1 sums. Fast when the numbers are modest; it\'s pseudo-polynomial, so huge values can still make it slow. A bitset (one big integer, shifted and OR-ed) speeds this up a lot in Python.</p>' },
      ],
      practice: [['Coding problems', '#/code'], ['Counting chapter (quant handbook)', '#/handbook/counting']],
    },

    'dsa-dp': {
      title: 'Dynamic programming', minutes: 60,
      why: 'Dynamic programming turns exponential searches into polynomial ones by solving each subproblem once. It\'s the topic candidates fear most, but almost every DP question follows the same four steps, and a handful of classic shapes cover most of what interviewers ask, including the "best time to buy and sell" family that trading firms love.',
      goals: ['Recognise overlapping subproblems and optimal substructure', 'Define a state, a recurrence and base cases, then memoise or tabulate', 'Solve the classic 1-D and 2-D shapes: stairs, coin change, knapsack, LCS, edit distance', 'Reduce memory by keeping only the rows you need'],
      prereq: ['dsa-backtracking'],
      sections: [
        { h: 'The four steps', blocks: [
          `<p>DP applies when a problem breaks into subproblems that <b>overlap</b> (the same smaller question is asked many times) and whose best answers combine into the best overall answer. The recipe:</p>
           <ol><li><b>State:</b> what does dp[i] (or dp[i][j]) mean, in words? "The fewest coins to make amount i."</li>
           <li><b>Recurrence:</b> how does it follow from smaller states? dp[i] = 1 + min over coins c of dp[i − c].</li>
           <li><b>Base cases:</b> dp[0] = 0.</li>
           <li><b>Order:</b> compute states in an order where everything a state needs is ready (or use recursion with memoisation and let it work out the order).</li></ol>
           <p>The cost is (number of states) × (work per state). Writing the state in words is the step people skip, and it's the one that makes the rest obvious.</p>`,
          { code: `def coin_change(coins, amount):
    """Fewest coins (unlimited supply of each) to make amount, or -1."""
    INF = float("inf")
    dp = [0] + [INF] * amount          # dp[i] = fewest coins for amount i
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i and dp[i - c] + 1 < dp[i]:
                dp[i] = dp[i - c] + 1
    return dp[amount] if dp[amount] < INF else -1


def count_ways(coins, amount):
    """Number of combinations (order not mattering) of coins making amount."""
    ways = [1] + [0] * amount
    for c in coins:                    # coins outer: each combination counted once
        for i in range(c, amount + 1):
            ways[i] += ways[i - c]
    return ways[amount]`, test: 'coins' },
          { q: 'Coins 1, 2 and 5: what is the fewest number of coins that make 11?', a: 3, tol: { abs: 0.1 }, hint: '5 + 5 + 1.', sol: 'dp[11] = 1 + min(dp[10], dp[9], dp[6]) = 1 + dp[10] = 1 + 2 = <b>3</b> (5 + 5 + 1). Greedy works here, but not with coins 1, 3, 4 and amount 6 (greedy 4 + 1 + 1 = 3 coins; best 3 + 3 = 2).' },
          { q: 'How many ways can coins 1, 2 and 5 make 5, if order doesn\'t matter?', a: 4, tol: { abs: 0.1 }, hint: '5; 2+2+1; 2+1+1+1; 1×5.', sol: '5, 2+2+1, 2+1+1+1 and 1+1+1+1+1: <b>4</b>. Looping over coins in the outer loop counts each combination once; swapping the loops would count orderings (permutations) instead.' },
        ] },
        { h: '1-D shapes: take it or skip it', blocks: [
          `<p>Many 1-D DPs choose, at each position, between taking the current item and skipping it. <b>House robber</b> (no two adjacent): dp[i] = max(dp[i − 1], dp[i − 2] + value[i]). <b>Climbing stairs</b> (1 or 2 steps): ways[i] = ways[i − 1] + ways[i − 2]. <b>Longest increasing subsequence</b>: dp[i] = 1 + max dp[j] over j &lt; i with a[j] &lt; a[i], O(n²) (or O(n log n) with binary search on "tails").</p>
           <p>When each state needs only the last one or two, keep just those variables: O(1) memory.</p>`,
          { code: `def rob(values):
    take = skip = 0                   # best total if we took / skipped the previous house
    for v in values:
        take, skip = skip + v, max(take, skip)
    return max(take, skip)


def max_profit_one_trade(prices):
    """Best profit from one buy then one later sell (0 if none)."""
    lowest, best = float("inf"), 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best


def max_profit_with_fee(prices, fee):
    """Many trades, holding at most one unit, paying fee per round trip."""
    cash, held = 0, -prices[0]        # best value with no position / with one unit
    for p in prices[1:]:
        cash, held = max(cash, held + p - fee), max(held, cash - p)
    return cash`, test: 'dp_1d' },
          { q: 'House robber on [2, 7, 9, 3, 1]: what is the largest total with no two adjacent houses?', a: 12, tol: { abs: 0.1 }, hint: '2 + 9 + 1.', sol: '2 + 9 + 1 = <b>12</b> beats 7 + 3 = 10. dp: 2, 7, 11, 11, 12.' },
          { id: 'x1', q: 'Prices [1, 3, 2, 8, 4, 9] and a fee of 2 per round trip, holding at most one unit. What is the best total profit?', a: 8, tol: { abs: 0.1 }, hint: 'Buy 1, sell 8; buy 4, sell 9.', sol: 'Buy at 1 and sell at 8 (7 − 2 = 5), then buy at 4 and sell at 9 (5 − 2 = 3): <b>8</b>. The two states, cash (flat) and held (long one unit), update from each other every day.' },
          { market: 'The "best time to buy and sell" family is a state machine: each state is a position (flat, long, cooling down), and each day you decide whether to switch. Adding a fee, a limit on trades or a cooldown just adds states. It\'s a small version of how optimal execution problems are set up.' },
        ] },
        { h: '2-D shapes: two sequences or a grid', blocks: [
          `<p>With two strings or a grid, the state is a pair (i, j). <b>Longest common subsequence</b>: if a[i] == b[j], dp[i][j] = 1 + dp[i − 1][j − 1], else the max of dropping one character from either. <b>Edit distance</b> (insert, delete, replace): the min of the three moves, plus 1, or the diagonal if the characters match. <b>0/1 knapsack</b>: dp[i][w] = best value using the first i items within weight w: skip item i, or take it if it fits.</p>
           <p>Each needs only the previous row, so memory drops from O(nm) to O(m). For knapsack, loop weights backwards so each item is used at most once.</p>`,
          { code: `def lcs(a, b):
    prev = [0] * (len(b) + 1)
    for x in a:
        cur = [0]
        for j, y in enumerate(b):
            cur.append(prev[j] + 1 if x == y else max(prev[j + 1], cur[j]))
        prev = cur
    return prev[-1]


def edit_distance(a, b):
    prev = list(range(len(b) + 1))         # turning "" into b[:j] takes j inserts
    for i, x in enumerate(a, 1):
        cur = [i]
        for j, y in enumerate(b, 1):
            cur.append(prev[j - 1] if x == y else 1 + min(prev[j], cur[j - 1], prev[j - 1]))
        prev = cur
    return prev[-1]


def knapsack(items, capacity):
    """items: (weight, value); each used at most once. Best total value."""
    best = [0] * (capacity + 1)
    for w, v in items:
        for c in range(capacity, w - 1, -1):    # backwards: item used once
            best[c] = max(best[c], best[c - w] + v)
    return best[capacity]`, test: 'dp_2d' },
          { q: 'What is the edit distance between "horse" and "ros"?', a: 3, tol: { abs: 0.1 }, hint: 'Replace h with r, delete r, delete e.', sol: 'horse → rorse (replace h) → rose (delete r) → ros (delete e): <b>3</b> edits, and no two-edit route exists. The table is 6 × 4.' },
          { worked: 'knapsack', q: 'Items (weight, value): (1, 1), (3, 4), (4, 5), (5, 7). Capacity 7. What is the best value?', steps: [
            ['State?', 'best[c] = the best value within capacity c using the items considered so far.'],
            ['Try the combinations that fit within 7.', '(3, 4) + (4, 5) = weight 7, value 9. (1, 1) + (5, 7) = weight 6, value 8.'],
            ['Anything better?', 'With the 5-weight item, only the 1 still fits (value 8). Any three items weigh at least 1 + 3 + 4 = 8, too much. So 9 is the best.'],
            'Answer <b>9</b>. The DP checks every capacity for every item: O(n × capacity).',
          ] },
          { trap: 'Knapsack is O(n × capacity), which is "pseudo-polynomial": fine for capacity 10,000, impossible for capacity 10⁹. If weights are huge but values small, swap the roles and DP over value instead.' },
        ] },
      ],
      takeaways: ['DP = overlapping subproblems + optimal substructure.', 'Four steps: state in words, recurrence, base cases, order. Cost = states × work per state.', 'Top-down (memoise the recursion) or bottom-up (fill a table); same complexity.', '1-D: take or skip; stock problems are small state machines.', '2-D: LCS, edit distance, knapsack; keep one previous row to save memory.'],
      explain: { q: 'Explain the difference between memoisation and tabulation, and when you would choose each.', a: 'Memoisation keeps the natural recursive solution and caches each subproblem\'s answer the first time it\'s computed, so it only solves the subproblems that are actually needed and is quick to write. Tabulation fills a table bottom-up in an order where dependencies are ready; it avoids recursion depth limits and makes it easy to drop old rows to save memory. In an interview I often start with memoisation for correctness, then convert to tabulation if depth or memory matter.' },
      homework: [
        { lvl: 'core', q: 'In how many ways can you climb 10 stairs taking 1 or 2 steps at a time?', a: 89, tol: { abs: 0.1 }, hint: 'ways[i] = ways[i − 1] + ways[i − 2], ways[1] = 1, ways[2] = 2.', sol: '<p>1, 2, 3, 5, 8, 13, 21, 34, 55, <b>89</b>: the Fibonacci numbers. O(n) time, O(1) memory keeping two variables.</p>' },
        { lvl: 'core', q: 'What is the length of the longest common subsequence of "abcde" and "ace"?', a: 3, tol: { abs: 0.1 }, hint: '"ace" itself.', sol: '<p>"ace" appears in order inside "abcde", so the LCS has length <b>3</b>. The DP table is 6 × 4.</p>' },
        { lvl: 'core', q: 'What is the length of the longest strictly increasing subsequence of [10, 9, 2, 5, 3, 7, 101, 18]?', a: 4, tol: { abs: 0.1 }, hint: '2, 3, 7, 18 (or 2, 5, 7, 101).', sol: '<p>2, 3, 7, 18 (or 2, 5, 7, 101) has length <b>4</b>. The O(n²) DP: dp = 1, 1, 1, 2, 2, 3, 4, 4.</p>' },
        { lvl: 'core', q: 'How many paths go from the top-left to the bottom-right of a 3 × 7 grid, moving only right or down?', a: 28, tol: { abs: 0.1 }, hint: 'paths[i][j] = paths[i − 1][j] + paths[i][j − 1], or C(8, 2).', sol: '<p>You make 2 down moves and 6 right moves in some order: C(8, 2) = <b>28</b>. The grid DP gives the same and generalises to grids with blocked cells.</p>' },
        { lvl: 'interview', q: 'With unlimited trades but at most one unit held, and no fees, what is the best profit on prices [7, 1, 5, 3, 6, 4]?', a: 7, tol: { abs: 0.1 }, hint: 'Take every rise.', sol: '<p>With no fees, take every day-to-day rise: (5 − 1) + (6 − 3) = 4 + 3 = <b>7</b>. The cash/held DP gives the same; with a fee, small rises stop being worth trading.</p>' },
        { lvl: 'interview', q: 'Explain why greedy fails for coin change with coins 1, 3, 4 and amount 6, and how DP gets it right.', sol: '<p><b>What greedy does.</b> It always takes the largest coin that fits. For 6 with coins {1, 3, 4}: take 4 (2 left), then 1, then 1: <b>3 coins</b>. But 3 + 3 makes 6 with <b>2 coins</b>. Taking the 4 looked best locally but left a remainder, 2, that can only be paid expensively.</p><p><b>What DP does differently.</b> It doesn\'t commit to a coin. It asks, for every amount a from 0 up to the target: what\'s the fewest coins for a, given that the <i>last</i> coin could be any of the coins? If the last coin is c, the rest is a − c, already solved:</p><div class="hb-eq">dp[a] = 1 + min(dp[a − c] for each coin c ≤ a), with dp[0] = 0</div><table class="hb-table"><tr><th>a</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr><tr><td>dp[a]</td><td>0</td><td>1</td><td>2</td><td>1</td><td>1</td><td>2</td><td>2</td></tr></table><p>dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2, using the last coin 3 on top of dp[3] = 1.</p><p><b>Why it\'s always right.</b> An optimal solution has some last coin c, and the coins before it must be an optimal way to pay a − c (otherwise you could swap in a better one). The DP tries every possible c, so it can\'t miss the optimum. Greedy happens to be optimal for systems like 1, 2, 5, 10, but not for every coin system. O(amount × number of coins).</p>' },
        { lvl: 'stretch', q: 'You may make at most k trades (buy then sell) on n days of prices. Set up the DP and give its cost.', sol: '<p><b>Choose the state.</b> At the end of each day, what matters for the future is how many trades you\'ve used and whether you\'re holding the stock. So keep, for each t from 1 to k:</p><ul><li>buy[t]: the best cash position so far if you\'re holding, having made t buys;</li><li>sell[t]: the best cash so far if you\'re flat, having completed t round trips.</li></ul><p><b>Transitions</b> for a day with price p: either do nothing, or move one step through the cycle flat → hold → flat.</p><pre class="sc-code">def max_profit_k(prices, k):\n    if not prices or k == 0:\n        return 0\n    buy = [float("-inf")] * (k + 1)    # holding, after t buys\n    sell = [0] * (k + 1)               # flat, after t sales\n    for p in prices:\n        for t in range(1, k + 1):\n            buy[t] = max(buy[t], sell[t - 1] - p)    # buy today\n            sell[t] = max(sell[t], buy[t] + p)       # sell today\n    return sell[k]</pre><p><b>Example.</b> Prices 3, 2, 6, 5, 0, 3 with k = 2: buy at 2, sell at 6 (+4), buy at 0, sell at 3 (+3): 7. With k = 1 the best is 4.</p><p><b>Cost.</b> O(n × k) time and O(k) memory. The answer is sell[k], because finishing flat always beats holding. If k ≥ n/2 the limit can\'t bind (you can\'t make more than n/2 round trips anyway), so use the O(n) "take every rise" answer instead.</p>' },
      ],
      practice: [['Coding problems', '#/code'], ['Optimal stopping (quant handbook)', '#/handbook/stopping']],
    },

    'dsa-greedy': {
      title: 'Greedy algorithms', minutes: 30,
      why: 'Sometimes the obvious local choice is also the globally best one, and then the solution is a single pass. The skill is knowing when greed is safe, and being able to say why: interviewers will ask you to justify it, usually with an exchange argument.',
      goals: ['Recognise problems where a greedy choice is optimal', 'Justify a greedy algorithm with an exchange argument', 'Solve interval scheduling, jump game and gas station problems', 'Spot when greed fails, and switch to dynamic programming'],
      prereq: ['dsa-sorting', 'dsa-dp'],
      sections: [
        { h: 'When greed works: interval scheduling', blocks: [
          `<p>To fit the most non-overlapping meetings into one room, always pick the meeting that <b>ends earliest</b> among those that start after the last one chosen. Sort by end time, then one pass: O(n log n).</p>
           <p><b>Why it's optimal (exchange argument):</b> take any optimal schedule. Its first meeting ends no earlier than the earliest-ending meeting overall, so swapping it for that one keeps the schedule valid and the same size. Repeat for the next meeting, and so on: the greedy schedule is at least as large as any optimal one.</p>`,
          { code: `def max_non_overlapping(intervals):
    count, end = 0, float("-inf")
    for s, e in sorted(intervals, key=lambda iv: iv[1]):   # earliest end first
        if s >= end:
            count += 1
            end = e
    return count


def can_reach_end(jumps):
    """jumps[i] = furthest jump length from i. Can you reach the last index?"""
    reach = 0
    for i, j in enumerate(jumps):
        if i > reach:
            return False
        reach = max(reach, i + j)
    return True`, test: 'greedy' },
          { q: 'Meetings [1, 3), [2, 4), [3, 5), [6, 7): at most how many can one room hold?', a: 3, tol: { abs: 0.1 }, hint: 'Take [1, 3), [3, 5), [6, 7).', sol: 'Earliest end first: [1, 3), then [3, 5) (starts when the first ends), then [6, 7). <b>3</b>; [2, 4) overlaps the first.' },
          { q: 'Jump lengths [3, 2, 1, 0, 4]: can you reach the last index? (1 for yes, 0 for no.)', a: 0, tol: { abs: 0.1 }, hint: 'Every route lands on index 3, where the jump is 0.', sol: 'The furthest reach from indices 0–3 is index 3, and index 3 has jump length 0, so index 4 is never reached: <b>no</b> (0).' },
        ] },
        { h: 'When greed fails', blocks: [
          `<p>Greedy fails when an early locally-best choice blocks a better overall answer. Coin change with coins 1, 3, 4 (greedy uses 3 coins for 6; the best is 2), 0/1 knapsack (taking the best value-per-weight item first can leave capacity unused), and longest path problems are the classic traps. If you can't find an exchange argument, assume greed is wrong and look for a DP.</p>
           <p>Two greedy classics worth knowing: <b>fractional knapsack</b> (you may take fractions: greedy by value per weight is optimal), and <b>gas station</b> (if the total gas is at least the total cost, start just after the point where the running balance is lowest).</p>`,
          { q: 'Coins 1, 3 and 4, amount 6: how many coins does the greedy rule "take the largest coin that fits" use?', a: 3, tol: { abs: 0.1 }, hint: '4, then 1, then 1.', sol: 'Greedy takes 4, then 1, then 1: <b>3</b> coins, but 3 + 3 uses 2. Taking the 4 first rules out the better answer, so this coin system needs dynamic programming.' },
          { id: 'm1', q: 'For which of these is "take the best-looking option first" guaranteed optimal?', opts: [['Fractional knapsack by value per weight'], ['0/1 knapsack by value per weight', 'Indivisible items can leave capacity wasted.'], ['Coin change with coins 1, 3 and 4', 'Greedy uses 4 + 1 + 1 for 6; 3 + 3 is better.'], ['Longest path in a graph', 'Locally longest edges can lead to dead ends.']], sol: 'With fractions allowed, the best value per weight always fills capacity most profitably, and you can top up exactly with a fraction of the next item. With indivisible items, that exchange argument breaks.' },
        ] },
      ],
      takeaways: ['Greedy = one locally best choice at each step; often sort first.', 'Justify it with an exchange argument: swapping an optimal solution\'s choice for the greedy one never makes it worse.', 'Interval scheduling: earliest end first.', 'Jump game and gas station: track the running reach or balance.', 'No exchange argument? Suspect greed is wrong and use DP.'],
      explain: { q: 'Why does choosing the meeting that ends earliest maximise the number of meetings, while choosing the one that starts earliest doesn\'t?', a: 'Ending earliest leaves the most time for everything that follows, and any optimal schedule\'s first meeting can be swapped for the earliest-ending one without conflicts, so greed never loses. Starting earliest can pick a meeting that runs all day and blocks several shorter ones: one long early meeting beats nothing in that rule, but costs several meetings.' },
      homework: [
        { lvl: 'core', q: 'Jump lengths [2, 3, 1, 1, 4]: what is the fewest jumps to reach the last index?', a: 2, tol: { abs: 0.1 }, hint: '0 → 1 → 4.', sol: '<p>Jump from 0 to 1 (length 1 of the allowed 2), then from 1 to 4 (length 3): <b>2</b> jumps. Greedy by "furthest reach within the current jump\'s range", in O(n).</p>' },
        { lvl: 'core', q: 'Fractional knapsack: capacity 50, items (weight, value) (10, 60), (20, 100), (30, 120). What is the best value?', a: 240, tol: { abs: 0.1 }, hint: 'Take items by value per weight: 6, 5, 4.', sol: '<p>Value per weight: 6, 5, 4. Take all of the first two (weight 30, value 160), then 20/30 of the third (value 80): <b>240</b>. In the 0/1 version the best is 220 (the second and third items).</p>' },
        { lvl: 'core', q: 'Children need cookies of at least their greed factor: greed [1, 2, 3], cookies [1, 1]. How many children can be satisfied?', a: 1, tol: { abs: 0.1 }, hint: 'Sort both; give the smallest cookie that works.', sol: '<p>Sort both and match the smallest sufficient cookie to the least greedy child: only the child with greed 1 can be satisfied: <b>1</b>.</p>' },
        { lvl: 'core', q: 'Gas [1, 2, 3, 4, 5] and costs [3, 4, 5, 1, 2] around a circle: from which station index can you complete the loop?', a: 3, tol: { abs: 0.1 }, hint: 'Start after the point where the running balance is lowest.', sol: '<p>Net gains: −2, −2, −2, 3, 3 (total 0, so a start exists). The running balance is lowest after index 2, so start at index <b>3</b>: 3, 6, 4, 2, 0, never negative.</p>' },
        { lvl: 'interview', q: 'With unlimited trades on prices, "take every rise" is optimal. Give the exchange argument.', sol: '<p><b>Step 1: any trade is a sum of daily changes.</b> Holding from day i to day j earns p[j] − p[i], which equals the sum of the daily changes in between: (p[i+1] − p[i]) + (p[i+2] − p[i+1]) + … + (p[j] − p[j−1]). The middle terms cancel.</p><p><b>Step 2: an upper bound.</b> So any strategy\'s total profit is the sum of the daily changes over the days it holds. That\'s at most the sum of the <i>positive</i> daily changes, because including a negative day can only lower it.</p><p><b>Step 3: greedy reaches the bound.</b> "Hold on exactly the days the price rises" collects every positive change and no negative one. With unlimited trades and no fees, that\'s allowed. A strategy that hits an upper bound on every strategy is optimal.</p><pre class="sc-code">def max_profit_unlimited(prices):\n    return sum(max(0, b - a) for a, b in zip(prices, prices[1:]))</pre><p><b>Example.</b> 1, 5, 3, 6: the daily changes are +4, −2, +3, so the answer is 7 (buy at 1, sell at 5, buy at 3, sell at 6).</p><p><b>That\'s an exchange argument:</b> any solution can be changed, step by step, into the greedy one without getting worse. It breaks with a fee per trade, because splitting one long trade into many short ones then costs fees; use the cash/holding DP instead.</p>' },
        { lvl: 'interview', q: 'Task scheduler: tasks with a cooldown of n between equal tasks. Why does the answer depend only on the most frequent task\'s count?', sol: '<p><b>The bottleneck is the most frequent task.</b> Say task A appears f times, and copies of the same task must be at least n slots apart. Lay out A\'s copies first: between consecutive As there must be n other slots, so they form f − 1 blocks of length n + 1, plus the last A.</p><p><b>Example.</b> Tasks A A A B B B C with n = 2: f = 3, and A and B both have the maximum count. The frame is A B _ | A B _ | A B: (f − 1)(n + 1) slots for the blocks, plus 2 at the end for the tasks tied at the top. C fills one gap: A B C A B _ A B, 8 slots.</p><pre class="sc-code">from collections import Counter\n\ndef least_interval(tasks, n):\n    counts = Counter(tasks)\n    f = max(counts.values())\n    tied = sum(1 for c in counts.values() if c == f)\n    return max(len(tasks), (f - 1) * (n + 1) + tied)</pre><p><b>Why that\'s the answer.</b> The frame (f − 1)(n + 1) + tied is a lower bound: the most frequent tasks alone need that many slots. Every other task appears at most f − 1 times (or exactly f, if tied), so it can always be placed into the gaps without two copies landing in the same block. If there are more tasks than gaps, the frame simply stretches with no idle slots, and the answer is the number of tasks. So the answer is the larger of the two. O(number of tasks).</p>' },
        { lvl: 'stretch', q: 'Minimum number of arrows to burst balloons given as intervals (an arrow at x bursts every balloon covering x). Which greedy rule, and why is it the same as interval scheduling?', sol: '<p><b>The greedy rule.</b> Sort the balloons by their right end. Shoot an arrow at the right end of the first balloon. It bursts every balloon that starts at or before that point. Move to the next balloon not yet burst, and repeat.</p><pre class="sc-code">def min_arrows(balloons):\n    arrows, last = 0, float("-inf")\n    for start, end in sorted(balloons, key=lambda b: b[1]):\n        if start &gt; last:          # not burst by the last arrow\n            arrows += 1\n            last = end            # shoot at this balloon\'s end\n    return arrows</pre><p><b>Why shoot at the end?</b> The first balloon (the one that ends earliest) needs some arrow inside it. Shooting at its very end is as far right as possible while still hitting it, so it bursts every balloon that this balloon could share an arrow with, and more if anything. No other choice does better.</p><p><b>Example.</b> [(10, 16), (2, 8), (1, 6), (7, 12)] sorted by end: (1, 6), (2, 8), (7, 12), (10, 16). Arrow at 6 bursts the first two; arrow at 12 bursts the other two: 2 arrows.</p><p><b>The link to interval scheduling.</b> The balloons that get their own arrow are pairwise disjoint, the same set the "earliest end first" rule picks for scheduling meetings. Disjoint balloons can\'t share an arrow, so you need at least that many; greedy uses exactly that many. So minimum arrows = maximum number of non-overlapping intervals. O(n log n) for the sort.</p>' },
      ],
      practice: [['Coding problems', '#/code'], ['Peak number of live orders', '#/code/opt-peak-live']],
    },
  });
})();
