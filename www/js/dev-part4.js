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
        { lvl: 'interview', q: 'A sorted array of timestamps holds millions of trades. How do you count the trades between 10:00:00 and 10:05:00 in O(log n)?', sol: '<p>Two binary searches: left = bisect_left(times, start), right = bisect_left(times, end) for a half-open window [start, end) (or bisect_right for an inclusive end). The count is right − left, and times[left:right] are the trades. This is how time-range queries on tick data stay fast.</p>' },
        { lvl: 'interview', q: 'Why is (lo + hi) // 2 safe in Python, when (lo + hi) / 2 in C++ or Java can be a bug?', sol: '<p>In C++ or Java with 32-bit ints, lo + hi can overflow when both are large (above about 1.07 billion each), giving a negative midpoint. The safe form is lo + (hi − lo) / 2. Python integers have arbitrary precision, so lo + hi never overflows, and // is integer division. It\'s still worth mentioning in an interview.</p>' },
        { lvl: 'stretch', q: 'Find the median of two sorted arrays of sizes m and n in O(log(min(m, n))).', sol: '<p>Binary search over how many elements the shorter array contributes to the left half. For a split i in A, the split in B is j = (m + n + 1)/2 − i. The split is right when A[i − 1] ≤ B[j] and B[j − 1] ≤ A[i] (with ±∞ at the ends). If A[i − 1] &gt; B[j], move i left; otherwise right. Then the median comes from the maximum of the left parts and the minimum of the right parts. The difficulty is purely in the boundaries, so test lengths 0 and 1.</p>' },
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
        { lvl: 'interview', q: 'Sort a million trade records by (symbol, then time). How, and what property of the sort matters?', sol: '<p><b>One sort with a tuple key:</b> sorted(trades, key=lambda t: (t.symbol, t.time)). Or two sorts, by time and then by symbol, which relies on the sort being <b>stable</b> (equal symbols keep their time order). Python\'s Timsort is stable, O(n log n), and close to O(n) if the data arrives nearly sorted, as tick data often does.</p>' },
        { lvl: 'interview', q: 'When would you use counting sort instead of the built-in sort?', sol: '<p>When keys are small integers in a known range, like price ticks within a day\'s band, hours of the day, or ratings 1–5. Counting sort is O(n + k) with k the range, beating O(n log n) when k is small compared with n. It\'s stable if you place elements from the back, which radix sort relies on. For general data, or a huge range, the built-in sort wins.</p>' },
        { lvl: 'stretch', q: 'Insert a new interval into a sorted list of non-overlapping intervals, merging where needed, in O(n).', sol: '<p>One pass in three phases: copy every interval that ends before the new one starts; then, while intervals overlap the new one, absorb them (new start = min of starts, new end = max of ends); append the merged interval; copy the rest. No sorting needed because the input is already sorted: O(n). Finding the first overlapping position by binary search speeds up the first phase, but the copying is still O(n).</p>' },
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
        { lvl: 'interview', q: 'Generate all valid strings of n pairs of brackets. What pruning rules make every branch produce a valid string?', sol: '<p>Build the string left to right, tracking open and close counts. Add "(" while open &lt; n; add ")" only while close &lt; open. Both rules together guarantee every completed string (length 2n) is valid, so there\'s no wasted work: the number of results is the Catalan number C(n) = C(2n, n)/(n + 1) (5 for n = 3, 42 for n = 5).</p>' },
        { lvl: 'interview', q: 'A word-search grid: does a word appear as a path of adjacent cells, each used at most once? Outline the search and its worst-case cost.', sol: '<p>Start a DFS from every cell matching the first letter. At each step, try the 4 neighbours that match the next letter and aren\'t already on the current path (mark the cell, recurse, then unmark it: choose, explore, undo). Return True as soon as the whole word matches.</p><p>Worst case: O(rows × cols × 3<sup>L</sup>) for a word of length L (after the first step each cell has at most 3 unvisited neighbours). Pruning by letter makes it fast in practice.</p>' },
        { lvl: 'stretch', q: 'Partition a list into two subsets with equal sums: why is backtracking slow here, and what\'s the better approach?', sol: '<p>Backtracking tries up to 2ⁿ subsets: fine for n ≤ 20, hopeless for 100. But the question only asks whether some subset reaches total/2, and the reachable sums are at most the total. Dynamic programming over "which sums are reachable using the first i items" (a set, or a bitset) is O(n × total): a subset-sum DP, in the next chapter.</p>' },
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
        { lvl: 'interview', q: 'Explain why greedy fails for coin change with coins 1, 3, 4 and amount 6, and how DP gets it right.', sol: '<p>Greedy takes the biggest coin that fits: 4, then 1, then 1: three coins. But 3 + 3 uses two. Greedy\'s local choice (take 4) rules out the better global answer.</p><p>DP considers every last coin: dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2. It works for any coin system because it tries all options for each amount, once.</p>' },
        { lvl: 'stretch', q: 'You may make at most k trades (buy then sell) on n days of prices. Set up the DP and give its cost.', sol: '<p>State: for each t = 1…k, buy[t] = best value after the t-th buy, sell[t] = best value after the t-th sell. Each day, update for t = 1…k: buy[t] = max(buy[t], sell[t − 1] − p), sell[t] = max(sell[t], buy[t] + p), with sell[0] = 0. The answer is sell[k]. O(nk) time, O(k) memory. If k ≥ n/2, the limit doesn\'t bind and the greedy "take every rise" answer applies in O(n).</p>' },
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
        { lvl: 'interview', q: 'With unlimited trades on prices, "take every rise" is optimal. Give the exchange argument.', sol: '<p>Any profit from holding between a buy at day i and a sell at day j equals the sum of the day-to-day changes in between. Splitting it into the positive changes alone can only increase the total (you drop the negative days by being flat then). And taking every positive change is achievable with no fees. So the sum of all positive daily changes is an upper bound that the greedy strategy reaches: optimal. A fee per trade breaks the argument, because splitting a trade into many costs extra fees: then use the cash/held DP.</p>' },
        { lvl: 'interview', q: 'Task scheduler: tasks with a cooldown of n between equal tasks. Why does the answer depend only on the most frequent task\'s count?', sol: '<p>If the most frequent task appears f times, its copies need at least (f − 1) gaps of n slots between them, giving a frame of (f − 1)(n + 1) + (number of tasks with frequency f) slots. Other tasks fill the gaps greedily; if there are more tasks than gaps, no idle time is needed and the answer is just the number of tasks. So the answer is max(len(tasks), (f − 1)(n + 1) + count_max). The greedy fill argument is what justifies it.</p>' },
        { lvl: 'stretch', q: 'Minimum number of arrows to burst balloons given as intervals (an arrow at x bursts every balloon covering x). Which greedy rule, and why is it the same as interval scheduling?', sol: '<p>Sort by end; shoot an arrow at the end of the first balloon; skip every balloon it bursts (start ≤ arrow); repeat with the next unburst balloon. The arrows sit at the ends of a maximal set of non-overlapping balloons, and any two of those need different arrows, so the count is optimal: the minimum number of arrows equals the maximum number of pairwise disjoint intervals.</p>' },
      ],
      practice: [['Coding problems', '#/code'], ['Peak number of live orders', '#/code/opt-peak-live']],
    },
  });
})();
