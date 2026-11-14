// Quant dev handbook, Parts 1–2 (first half): complexity, Python, arrays, sliding windows, hashing.
// See devbook-content.js. Code listings ({ code, test }) are run by research/verify_internals.py.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    'dsa-complexity': {
      title: 'Complexity: what an algorithm costs', minutes: 40,
      why: 'Every coding interview ends with "what does it cost, and can you do better?". Knowing how to count operations, and how to read the input limits to tell which complexity is required, decides which algorithm to reach for before you write a line.',
      goals: ['Describe running time and memory with big-O, including amortised costs', 'Read the input limits and work out the complexity they require', 'Count the cost of loops, halving loops and recursion', 'Spot accidental O(n²) and exponential code'],
      sections: [
        { h: 'What big-O measures', blocks: [
          `<p>Big-O describes how the work grows with the input size n, ignoring constant factors and small terms. 3n² + 100n + 7 is O(n²): double n and the work roughly quadruples. That's the question that matters at scale: an O(n) algorithm on 10 million items is fast; an O(n²) one takes days.</p>
           <p>Three refinements come up constantly:</p>
           <ul><li><b>Worst case v average.</b> A hash-table lookup is O(1) on average but O(n) in the worst case (every key collides). Quicksort is O(n log n) on average, O(n²) in the worst case. Say which you mean.</li>
           <li><b>Amortised.</b> Appending to a dynamic array (a Python list) occasionally copies everything, but averaged over many appends each costs O(1).</li>
           <li><b>Space.</b> Extra memory used, beyond the input. A recursive function uses O(depth) stack space even if it allocates nothing.</li></ul>`,
          { fig: 'plot', x: [1, 32], y: [0, 160], xl: 'n', yl: 'steps', xt: [8, 16, 32], yt: [0, 50, 100, 150], fns: [{ f: (n) => n, tone: 'ok' }, { f: (n) => n * Math.log2(n), tone: 'acc' }, { f: (n) => n * n / 4, tone: 'bad' }], labels: [{ x: 27, y: 38, t: 'n', tone: 'ok' }, { x: 19, y: 120, t: 'n log n', tone: 'acc' }, { x: 21, y: 152, t: 'n²/4', tone: 'bad' }], alt: 'Growth of n, n log n and n squared over 4.', cap: 'Even with a small constant, n² overtakes n log n quickly. At n = 1,000,000 the gap is 50,000 times.' },
          { q: 'Roughly how many steps does an O(n log₂ n) algorithm take on n = 1,000,000 items? Give the answer in millions.', a: 20, tol: { abs: 1 }, hint: 'log₂ of a million is about 20.', sol: 'log₂ 10⁶ ≈ 19.9, so n log₂ n ≈ 10⁶ × 20 = 2 × 10⁷: about <b>20 million</b>. An O(n²) algorithm would need 10¹², about 50,000 times more.' },
        ] },
        { h: 'Reading the constraints', blocks: [
          `<p>Interview problems state their limits, and the limits tell you the intended complexity. Python does roughly 10⁷ simple operations a second, so aim for at most about 10⁷–10⁸ steps:</p>
           <table class="hb-table"><tr><th>n up to about</th><th>Fast enough</th><th>Typical technique</th></tr>
           <tr><td>10</td><td>O(n!)</td><td>try every permutation</td></tr>
           <tr><td>20</td><td>O(2ⁿ)</td><td>try every subset, backtracking</td></tr>
           <tr><td>500</td><td>O(n³)</td><td>triple loops, interval DP</td></tr>
           <tr><td>5,000</td><td>O(n²)</td><td>all pairs, 2-D DP</td></tr>
           <tr><td>10⁵–10⁶</td><td>O(n log n)</td><td>sorting, heaps, binary search</td></tr>
           <tr><td>10⁷ and more</td><td>O(n) or O(log n)</td><td>one pass, hashing, maths</td></tr></table>
           <p>So "n up to 200,000" rules out comparing all pairs before you have even read the rest of the problem.</p>`,
          { id: 'm1', q: 'An interview problem says the input has up to 200,000 numbers. Which approach is fast enough in Python?', opts: [['O(n log n)'], ['O(n²)', 'That is 4 × 10¹⁰ steps: hours.'], ['O(2ⁿ)', 'Hopeless beyond n ≈ 25.'], ['O(n³)', 'Far too slow, even for n = 5,000.']], sol: 'n log n is about 200,000 × 18 ≈ 3.5 million steps, well under a second. n² is 4 × 10¹⁰.' },
        ] },
        { h: 'Counting loops and recursion', blocks: [
          `<p>Most costs come from three shapes:</p>
           <ul><li><b>Nested loops.</b> Two loops over n items are O(n²). A loop over every pair i &lt; j does n(n − 1)/2 iterations, still O(n²).</li>
           <li><b>Halving.</b> A loop that halves its range each time (binary search, repeated division) runs about log₂ n times.</li>
           <li><b>Recursion.</b> Draw the call tree: cost = (number of calls) × (work per call). A function that calls itself twice on n − 1 makes about 2ⁿ calls; one that splits in half and does O(n) work per level makes log n levels of O(n): O(n log n).</li></ul>
           <p>Hidden loops count too: <code>x in my_list</code>, <code>my_list.index(x)</code>, <code>s[a:b]</code> slicing, <code>list.insert(0, x)</code> and <code>sum(window)</code> are all O(n) each, and a loop around any of them makes O(n²).</p>`,
          { q: 'How many times does the inner line run in <code>for i in range(100): for j in range(i + 1, 100): …</code>?', a: 4950, tol: { abs: 0.5 }, hint: 'It visits each pair i &lt; j once: C(100, 2).', sol: 'It runs once for each pair i &lt; j: C(100, 2) = 100 × 99/2 = <b>4,950</b>. Half of 100², but still O(n²).' },
          { worked: 'the cost of naive Fibonacci', q: 'fib(n) = fib(n − 1) + fib(n − 2), with fib(0) = 0 and fib(1) = 1, written recursively. How many calls does fib(30) make?', steps: [
            ['Let C(n) be the number of calls. Write a recursion for it.', 'C(n) = 1 + C(n − 1) + C(n − 2), with C(0) = C(1) = 1.'],
            ['Compare with Fibonacci itself.', 'C(n) + 1 satisfies the Fibonacci recursion, so C(n) = 2F(n + 1) − 1.'],
            'C(30) = 2 × 1,346,269 − 1 ≈ <b>2.7 million calls</b>, to compute a number you could get in 30 additions. The calls grow like φⁿ ≈ 1.618ⁿ: exponential, because the same subproblems are solved again and again.',
            'Caching each answer the first time (memoisation) cuts it to 31 calls: the idea behind dynamic programming.',
          ] },
          { code: `from functools import lru_cache


@lru_cache(maxsize=None)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)   # each n is computed once: O(n) calls`, test: 'fib_memo' },
          { id: 'x1', q: 'Binary search on a sorted list of 1,000,000,000 items: at most how many comparisons?', a: 30, tol: { abs: 0.5 }, hint: 'Each comparison halves the range: 2³⁰ ≈ 10⁹.', sol: '⌈log₂ 10⁹⌉ = <b>30</b>, since 2³⁰ = 1,073,741,824. Every extra factor of 1,000 in size costs only 10 more comparisons.' },
        ] },
        { h: 'Space, and recursion depth', blocks: [
          `<p>Memory matters as much as time in trading systems, where a process may hold a large order book and must never pause to collect garbage. Count the extra memory an algorithm allocates: a hash set of n items is O(n); a fixed number of variables is O(1).</p>
           <p>Recursion uses stack space for every active call. Python's default recursion limit is 1,000, so a recursive depth-first search on a path of 100,000 nodes will crash with RecursionError. Interviewers like to ask how you'd fix it: convert to an explicit stack (iterative), or raise the limit with sys.setrecursionlimit (risky: the C stack can still overflow).</p>`,
          { trap: 'Code that "looks O(n)" is often O(n²) because of a hidden linear operation inside the loop. Read each line and ask what it costs.' },
          { id: 'm2', q: 'Which of these, run once per item in a loop over n items, makes the whole loop O(n²)?', opts: [['my_list.pop(0)'], ['my_list.append(x)', 'Amortised O(1).'], ['my_dict[key] = x', 'O(1) on average.'], ['my_set.add(x)', 'O(1) on average.']], sol: 'pop(0) shifts every remaining element: O(n) each time, O(n²) in total. A collections.deque gives O(1) popleft.' },
        ] },
      ],
      takeaways: ['Big-O is how work grows with n; say worst, average or amortised.', 'Python does about 10⁷ simple steps a second: read the limits to find the required complexity.', 'Nested loops O(n²), halving O(log n), splitting with linear work O(n log n), branching recursion exponential.', 'Hidden O(n) operations (in, index, slicing, insert(0), pop(0), sum) inside loops make O(n²).', 'Recursion costs O(depth) stack; Python stops at depth 1,000.'],
      explain: { q: 'An interviewer says "n is up to 10⁵". Explain how that changes your approach.', a: 'With 10⁵ items an O(n²) algorithm does 10¹⁰ steps, far too slow, so I need O(n log n) or better: sorting, a heap, binary search or a single pass with a hash map. I would say that out loud first, so we agree on the target before I pick an algorithm.' },
      homework: [
        { lvl: 'core', q: 'Merge sort on n = 1,024 items does at most about n log₂ n comparisons. How many is that?', a: 10240, tol: { abs: 0.5 }, hint: 'log₂ 1,024 = 10.', sol: '<p><b>Approach:</b> plug in n log₂ n.</p><ol><li>log₂ 1,024 = 10, since 2¹⁰ = 1,024.</li><li>1,024 × 10 = <b>10,240</b> comparisons.</li></ol><p>An all-pairs algorithm would do about 1,024²/2 ≈ 524,000, fifty times more.</p>' },
        { lvl: 'core', q: 'A loop runs <code>while n > 1: n //= 3</code>, starting from n = 3¹⁰ = 59,049. How many iterations?', a: 10, tol: { abs: 0.5 }, hint: 'Each pass divides by 3.', sol: '<p><b>Approach:</b> dividing by 3 each pass takes log₃ n passes.</p><ol><li>59,049 = 3¹⁰, so after 10 divisions n = 1 and the loop stops.</li><li><b>10</b> iterations: O(log n), whatever the base.</li></ol>' },
        { lvl: 'core', q: 'How many distinct subsets does a set of 20 items have?', a: 1048576, tol: { abs: 0.5 }, hint: 'Each item is in or out.', sol: '<p><b>Approach:</b> each of the 20 items is independently in or out of a subset.</p><ol><li>2²⁰ = <b>1,048,576</b>.</li></ol><p>About a million: trying every subset is fine at n = 20 (around a second in Python), and hopeless at n = 40 (10¹²).</p>' },
        { lvl: 'interview', q: 'Code that, for each of n orders, scans a Python list of all open order ids with <code>if oid in open_ids</code>, takes 2 seconds for n = 10,000. Roughly how long for n = 100,000, if the list also grows tenfold?', a: 200, tol: { abs: 1 }, hint: 'The work is n × (list length): both grow tenfold.', sol: '<p><b>Approach:</b> the cost is (number of checks) × (cost of each check) = n × n, so O(n²).</p><ol><li>Ten times the input means 100 times the work: 2 × 100 = <b>200 seconds</b>.</li></ol><p><b>The fix:</b> keep open ids in a set, making each check O(1) on average: total O(n), about 0.2 seconds.</p>' },
        { lvl: 'interview', q: 'Why is appending to a Python list O(1) amortised, when it sometimes copies the whole list? Explain it in a few sentences.', sol: '<p>When a list is full, CPython allocates a bigger array (about 12.5% larger plus a constant, so geometrically growing) and copies the elements. Because capacity grows geometrically, a list that reaches n items has copied at most a constant times n elements in total: copies of sizes growing geometrically sum to O(n). Spread over n appends, that\'s O(1) each.</p><p><b>The point to add in an interview:</b> amortised is not worst case. A single append can take O(n), which matters on a latency-critical path; if you know the size, preallocate.</p>' },
        { lvl: 'interview', q: 'A recursive depth-first search crashes with RecursionError on a long chain of nodes. Give two fixes and their trade-offs.', sol: '<p><b>1. Make it iterative</b> with an explicit stack (a list): push the start node, then repeatedly pop a node, process it and push its unvisited neighbours. No depth limit, and usually faster in Python. The trade-off is slightly more code, and post-order processing needs care (push a marker, or track state).</p><p><b>2. Raise the limit</b> with sys.setrecursionlimit. Quick, but the C stack can still overflow and crash the whole interpreter, and deep recursion is slow in Python. Fine for a quick script, not for production.</p>' },
        { lvl: 'stretch', q: 'Show that a recursion that makes two calls on half the input and does O(n) extra work, T(n) = 2T(n/2) + cn, is O(n log n).', sol: '<p><b>Recursion tree:</b> level 0 has one call doing cn work; level 1 has two calls on n/2, doing 2 × c(n/2) = cn; level k has 2ᵏ calls on n/2ᵏ, again cn in total. The tree has log₂ n levels before the pieces have size 1. Total: cn × log₂ n = O(n log n).</p><p>This is merge sort. If the extra work were O(1) instead, each level would do 2ᵏ work and the total would be O(n); if there were three calls on n/2, the last level would dominate and the total would be O(n<sup>log₂ 3</sup>) ≈ O(n<sup>1.58</sup>) (the master theorem in general).</p>' },
        { lvl: 'lab', q: 'In Python, time <code>x in my_list</code> against <code>x in my_set</code> for sizes 10³, 10⁴, 10⁵ and 10⁶ using timeit. How do the times scale?', sol: '<p>The list lookup grows roughly tenfold with each tenfold size increase (O(n)); the set lookup stays roughly flat (O(1) average), at well under a microsecond. At 10⁶ the list lookup takes milliseconds, so doing it inside a loop of 10⁶ is about an hour.</p>' },
      ],
      practice: [['Python internals cards', '#/flashcards/python'], ['Knowledge quiz', '#/code/quiz'], ['Pairs with a target sum', '#/code/opt-pair-sum']],
    },

    'dsa-python': {
      title: 'Python for coding interviews', minutes: 35,
      why: 'In an interview you have no time to rebuild a heap or a counter. Knowing exactly which built-in does what, and what it costs, turns a 40-line answer into 10 lines, and avoids the classic Python bugs interviewers watch for.',
      goals: ['Pick the right built-in container and know its costs', 'Use collections and heapq, bisect and itertools fluently', 'Sort with keys, and know sorting is stable', 'Avoid the Python traps: aliased lists, mutable defaults, integer division'],
      prereq: ['dsa-complexity'],
      sections: [
        { h: 'The containers and what they cost', blocks: [
          `<table class="hb-table"><tr><th>Need</th><th>Use</th><th>Costs</th></tr>
           <tr><td>Indexed sequence, stack</td><td><code>list</code></td><td>index, append, pop() O(1); insert/pop at the front, <code>in</code>, slicing O(n)</td></tr>
           <tr><td>Queue, both ends</td><td><code>collections.deque</code></td><td>append/pop at either end O(1); indexing the middle O(n)</td></tr>
           <tr><td>Lookup by key</td><td><code>dict</code></td><td>get, set, delete, <code>in</code> O(1) average; keeps insertion order</td></tr>
           <tr><td>Membership, dedupe</td><td><code>set</code></td><td>add, remove, <code>in</code> O(1) average; no order</td></tr>
           <tr><td>Counting</td><td><code>collections.Counter</code></td><td>a dict of counts; <code>most_common(k)</code></td></tr>
           <tr><td>Grouping</td><td><code>collections.defaultdict(list)</code></td><td>missing keys start as an empty list</td></tr>
           <tr><td>Smallest item, repeatedly</td><td><code>heapq</code> on a list</td><td>push/pop O(log n), peek <code>h[0]</code> O(1), <code>heapify</code> O(n)</td></tr>
           <tr><td>Sorted list with insertion</td><td><code>bisect</code></td><td>find O(log n), insert O(n)</td></tr></table>
           <p>Python has no built-in balanced tree (sorted map). Use a heap with lazy deletion, a sorted list with bisect, or the third-party sortedcontainers if allowed.</p>`,
          { q: 'You need to repeatedly remove the oldest of n items and add new ones at the back. With a deque, what does each removal cost? (Answer 1 for O(1), 2 for O(log n), 3 for O(n).)', a: 1, tol: { abs: 0.1 }, hint: 'deque.popleft.', sol: 'deque.popleft() is <b>O(1)</b>: a deque is a linked list of blocks. With a list, pop(0) would be O(n).' },
        ] },
        { h: 'Idioms that save time', blocks: [
          `<p>A handful of idioms cover most interview code:</p>
           <ul><li><code>for i, x in enumerate(xs)</code> and <code>for a, b in zip(xs, ys)</code> instead of index arithmetic.</li>
           <li><code>sorted(items, key=lambda t: (t.price, -t.time))</code>: sort by several fields, with a minus sign to reverse one. Sorting is <b>stable</b>, so you can also sort twice, least important key first.</li>
           <li><code>heapq.heappush(h, (priority, counter, item))</code>: a tuple with a tie-breaking counter, so items themselves are never compared.</li>
           <li><code>Counter(s).most_common(k)</code>, <code>defaultdict(list)</code>, <code>dict.get(k, default)</code>, <code>setdefault</code>.</li>
           <li><code>"".join(parts)</code> to build strings, never <code>+=</code> in a loop.</li>
           <li><code>float("inf")</code> as an initial minimum, <code>divmod(a, b)</code>, <code>a // b</code> for integer division (it rounds towards −∞: <code>-7 // 2 == -4</code>).</li></ul>`,
          { code: `import heapq
from collections import Counter, defaultdict


def top_k_words(words, k):
    """The k most common words, ties broken alphabetically."""
    counts = Counter(words)
    return sorted(counts, key=lambda w: (-counts[w], w))[:k]


def group_by_symbol(trades):
    """trades: (symbol, qty) pairs -> {symbol: [qty, ...]} in arrival order."""
    groups = defaultdict(list)
    for sym, qty in trades:
        groups[sym].append(qty)
    return dict(groups)


def k_smallest(nums, k):
    return heapq.nsmallest(k, nums)   # O(n log k)`, test: 'py_idioms' },
          { q: 'What is <code>-7 // 2</code> in Python?', a: -4, tol: { abs: 0.1 }, hint: 'Floor division rounds towards minus infinity.', sol: '−3.5 rounded down (towards −∞) is <b>−4</b>. C++ and Java truncate towards zero and give −3: a classic source of off-by-one bugs when porting code.' },
        ] },
        { h: 'The traps', blocks: [
          `<p>Interviewers watch for these:</p>
           <ul><li><b>Aliased rows.</b> <code>grid = [[0] * 3] * 2</code> makes two references to the same inner list; setting <code>grid[0][0] = 1</code> changes both rows. Use <code>[[0] * 3 for _ in range(2)]</code>.</li>
           <li><b>Mutable default arguments.</b> <code>def f(x, seen=[])</code> shares one list across calls. Use <code>None</code> and create it inside.</li>
           <li><b>Modifying a collection while iterating over it.</b> Removing from a list or dict during a for loop skips items or raises. Iterate over a copy, or build a new one.</li>
           <li><b>Copying.</b> <code>b = a</code> copies nothing; <code>a[:]</code> or <code>list(a)</code> copies one level; nested structures need <code>copy.deepcopy</code>.</li>
           <li><b>Floats.</b> Never compare prices with ==; use integers (ticks, cents) or a tolerance.</li></ul>`,
          { q: 'After <code>grid = [[0] * 3] * 2</code> and <code>grid[0][0] = 5</code>, what is <code>grid[1][0]</code>?', a: 5, tol: { abs: 0.1 }, hint: 'Both rows are the same list object.', sol: 'The outer list holds two references to one inner list, so changing grid[0][0] changes grid[1][0] too: <b>5</b>.' },
          { id: 'm1', q: 'You sort trades by price with sorted(..., key=price). Two trades have the same price. In what order do they come out?', opts: [['Their original order'], ['Random order', 'Python\'s sort is deterministic.'], ['By trade id', 'Only if you include it in the key.'], ['Reversed', 'Only with reverse=True, and even then equal items keep their order.']], sol: 'Python\'s sort is stable: equal keys keep their original relative order. That\'s why sorting by time and then by price leaves each price level in time order.' },
        ] },
      ],
      takeaways: ['list for stacks and indexing, deque for queues, dict/set for O(1) lookup, heapq for "smallest next", bisect for sorted inserts.', 'Counter, defaultdict, enumerate, zip and sorted(key=…) do most of the work.', 'Sorting is stable; sort by several keys with a tuple.', '// rounds towards −∞.', 'Traps: [[0]*n]*m aliasing, mutable defaults, mutating while iterating, shallow copies, float ==.'],
      explain: { q: 'Why does [[0] * 3] * 2 behave strangely, and what would you write instead?', a: 'Multiplying a list repeats references, not copies. The inner list [0, 0, 0] is created once and the outer list holds it twice, so both "rows" are one object. Writing [[0] * 3 for _ in range(2)] runs the inner expression twice and creates two separate lists.' },
      homework: [
        { lvl: 'core', q: 'What does <code>sorted([3, 1, 2], key=lambda x: -x)[0]</code> return?', a: 3, tol: { abs: 0.1 }, hint: 'Sorting by −x puts the largest first.', sol: '<p>The keys are −3, −1, −2, so ascending order of the key is 3, 2, 1. The first element is <b>3</b>. Equivalent to sorted(..., reverse=True).</p>' },
        { lvl: 'core', q: 'After <code>h = []</code>, pushing 5, 1, 4 with heapq.heappush, and one heappop, what is <code>h[0]</code>?', a: 4, tol: { abs: 0.1 }, hint: 'heappop removes the smallest; h[0] is then the new smallest.', sol: '<p>The heap holds 1, 4, 5. heappop removes 1, leaving 4 and 5, so h[0] = <b>4</b>. heapq is a min-heap; for a max-heap push negated values.</p>' },
        { lvl: 'core', q: 'What does <code>Counter("mississippi").most_common(1)[0][1]</code> return?', a: 4, tol: { abs: 0.1 }, hint: 'Count each letter.', sol: '<p>Counts: i 4, s 4, p 2, m 1. The most common count is <b>4</b> (most_common breaks the tie between i and s by first appearance: i).</p>' },
        { lvl: 'core', q: 'Using bisect.bisect_left on the sorted list [10, 20, 20, 30], what index is returned for 20?', a: 1, tol: { abs: 0.1 }, hint: 'bisect_left returns the first position where 20 could go.', sol: '<p>bisect_left finds the leftmost position at which 20 could be inserted keeping order: before the existing 20s, index <b>1</b>. bisect_right would return 3. The difference is how you count "items less than x" (bisect_left) against "items at most x" (bisect_right).</p>' },
        { lvl: 'interview', q: 'Write a one-line expression that returns the k most frequent elements of a list nums.', sol: '<p><code>[x for x, _ in Counter(nums).most_common(k)]</code>, O(n log k) (most_common uses a heap when k is given). In an interview, mention the O(n) alternative: bucket the elements by frequency (frequencies run from 1 to n), then read buckets from the top.</p>' },
        { lvl: 'interview', q: 'A colleague removes cancelled orders with <code>for o in orders: if o.cancelled: orders.remove(o)</code>. What goes wrong, and what would you write?', sol: '<p><b>Two problems.</b> Removing from a list while iterating over it shifts the remaining items left, so the item right after each removed one is skipped: two cancelled orders in a row leave the second behind. And each remove is O(n), so the loop is O(n²).</p><p><b>Instead:</b> <code>orders = [o for o in orders if not o.cancelled]</code>, one O(n) pass that builds a new list (or assign to orders[:] to modify it in place for other references).</p>' },
        { lvl: 'stretch', q: 'Explain why <code>a = [1, 2]; b = a; b.append(3)</code> changes a, while <code>x = 1; y = x; y += 1</code> doesn\'t change x.', sol: '<p>Names in Python are references to objects. b = a makes b refer to the same list, and append mutates that list in place, so a sees it. Integers are immutable: y += 1 creates a new int object 2 and rebinds y to it, leaving x referring to 1. The same distinction explains why mutable default arguments are shared: the default is one object, mutated in place by each call.</p>' },
      ],
      practice: [['Python internals cards', '#/flashcards/python'], ['LRU cache', '#/code/opt-lru'], ['Knowledge quiz', '#/code/quiz']],
    },

    'dsa-arrays': {
      title: 'Arrays: two pointers and prefix sums', minutes: 45,
      why: 'More interview questions are about arrays and strings than anything else, and most of them fall to two ideas: walking two pointers through the data instead of trying every pair, and precomputing running totals so any range sum is one subtraction.',
      goals: ['Use two pointers on sorted data and for in-place rewrites', 'Answer range-sum queries in O(1) with prefix sums', 'Count subarrays with a given sum using prefix sums and a hash map', 'Apply range updates with a difference array'],
      prereq: ['dsa-python'],
      sections: [
        { h: 'Two pointers on sorted data', blocks: [
          `<p>Looking for a pair with a target sum in a <b>sorted</b> array? All pairs is O(n²). Instead put one pointer at each end. If the pair sums too low, only moving the left pointer right can help; too high, move the right pointer left. Each step discards a whole row of pairs that can't work, so it's O(n).</p>
           <p>Why it's safe to discard: if a[lo] + a[hi] &lt; target, then a[lo] + a[j] &lt; target for every j ≤ hi too (the array is sorted), so a[lo] can't be in any answer: move lo. That argument is what to say in the interview.</p>`,
          { code: `def pair_with_sum(a, target):
    """a sorted ascending. Return indices (i, j), i < j, with a[i] + a[j] == target, or None."""
    lo, hi = 0, len(a) - 1
    while lo < hi:
        s = a[lo] + a[hi]
        if s == target:
            return lo, hi
        if s < target:
            lo += 1          # a[lo] is too small to pair with anything left
        else:
            hi -= 1          # a[hi] is too big to pair with anything left
    return None`, test: 'pair_with_sum' },
          { worked: 'container with most water', q: 'Vertical lines of heights [1, 8, 6, 2, 5, 4, 8, 3, 7] stand at x = 0…8. Two lines and the x-axis hold water. What is the most water?', steps: [
            ['Water between lines i and j?', 'width × shorter height = (j − i) × min(h[i], h[j]).'],
            ['Start with the widest pair (0 and 8). Which pointer should move?', 'The shorter line (height 1): keeping it, any narrower pair holds less. So move it inwards.'],
            'Always move the shorter side. The best pair is lines 1 and 8 (heights 8 and 7): width 7 × height 7 = <b>49</b>.',
            'O(n) instead of O(n²), by the same "discard what can\'t win" argument.',
          ] },
          { q: 'Heights [1, 8, 6, 2, 5, 4, 8, 3, 7]: what is the most water between two lines?', a: 49, tol: { abs: 0.5 }, hint: 'Lines at x = 1 and x = 8.', sol: 'Lines 1 and 8 have heights 8 and 7, 7 apart: 7 × 7 = <b>49</b>. Two pointers, moving the shorter side each time, find it in one pass.' },
        ] },
        { h: 'Two pointers for in-place rewrites', blocks: [
          `<p>A second use: a <b>slow</b> pointer marks where to write, a <b>fast</b> pointer reads ahead. Removing duplicates from a sorted array in place, moving zeros to the end, or filtering a list without extra memory all take this shape: O(n) time, O(1) extra space.</p>`,
          { code: `def dedupe_sorted(a):
    """Remove duplicates from sorted list a in place; return the new length."""
    if not a:
        return 0
    write = 1
    for read in range(1, len(a)):
        if a[read] != a[write - 1]:
            a[write] = a[read]
            write += 1
    return write`, test: 'dedupe_sorted' },
          { q: 'Running dedupe_sorted on [1, 1, 2, 3, 3, 3, 4] returns what length?', a: 4, tol: { abs: 0.1 }, hint: 'The distinct values.', sol: 'The distinct values 1, 2, 3, 4 are written to the front: length <b>4</b>.' },
        ] },
        { h: 'Prefix sums', blocks: [
          `<p>Precompute P[i] = a[0] + … + a[i − 1] (with P[0] = 0). Then the sum of any range a[l] … a[r − 1] is P[r] − P[l]: O(1) per query after O(n) set-up. It's the same trick as cumulative P&L: the P&L between two days is the difference of the running totals.</p>
           <p>The powerful extension: <b>count subarrays that sum to k</b>. A subarray from l to r sums to k exactly when P[r] − P[l] = k, i.e. P[l] = P[r] − k. Walk through the array keeping a hash map of how many times each prefix sum has occurred; at each r, add the count of P[r] − k. O(n), and it works with negative numbers, where a sliding window doesn't.</p>`,
          { code: `from collections import defaultdict


def count_subarrays_with_sum(a, k):
    seen = defaultdict(int)
    seen[0] = 1            # the empty prefix
    total = count = 0
    for x in a:
        total += x
        count += seen[total - k]   # earlier prefixes that leave exactly k
        seen[total] += 1
    return count`, test: 'subarray_sum' },
          { q: 'How many contiguous subarrays of [1, 2, 3, −3, 3] sum to 3?', a: 5, tol: { abs: 0.1 }, hint: 'Prefix sums are 0, 1, 3, 6, 3, 6. Count pairs (earlier, later) that differ by exactly 3.', sol: 'Prefix sums 0, 1, 3, 6, 3, 6. For each later prefix, count earlier ones exactly 3 lower: the first 3 has one (0); the first 6 has one (3); the second 3 has one (0); the last 6 has two (both 3s). Total <b>5</b>: [1, 2], [3], [1, 2, 3, −3], [3, −3, 3] and the final [3].' },
          { id: 'x1', q: 'For a = [2, −1, 3, 4, −2], with P[0] = 0, what is P[4] − P[1] (the sum of a[1] … a[3])?', a: 6, tol: { abs: 0.1 }, hint: '−1 + 3 + 4.', sol: 'P = [0, 2, 1, 4, 8, 6]. P[4] − P[1] = 8 − 2 = <b>6</b> = −1 + 3 + 4.' },
        ] },
        { h: 'Difference arrays: range updates', blocks: [
          `<p>The reverse problem: many updates "add v to every element from l to r", then read the final array. Instead of touching every element per update (O(n) each), record D[l] += v and D[r + 1] −= v, then take a running sum at the end. Each update is O(1). Use it for "how many orders were live at each time" or "total position at each price level" from a list of intervals.</p>`,
          { trap: 'Off-by-one errors live here. Write down whether ranges are inclusive or half-open ([l, r) is usually cleanest) before coding, and test a one-element range.' },
        ] },
      ],
      takeaways: ['Sorted data + pair search: two pointers from the ends, O(n). Argue why each step discards only losers.', 'In-place rewrites: slow write pointer, fast read pointer.', 'Prefix sums: range sum = P[r] − P[l] in O(1).', 'Count subarrays summing to k: prefix sums + a hash map of counts, O(n), works with negatives.', 'Many range updates: a difference array, then one running sum.'],
      explain: { q: 'Why does the two-pointer pair search never miss the answer?', a: 'If the current pair sums too low, the left value plus any value at or left of the right pointer is also too low, because the array is sorted. So the left value can\'t be in any remaining answer and moving it loses nothing. The same holds for the right value when the sum is too high. Each step removes one value that can\'t be part of a solution, so if a solution exists the pointers reach it.' },
      homework: [
        { lvl: 'core', q: 'In the sorted array [1, 3, 4, 6, 8, 11], two pointers search for a pair summing to 10. How many sum checks until it finds 4 + 6?', a: 5, tol: { abs: 0.1 }, hint: 'Start with 1 + 11, and move one pointer after each check.', sol: '<p><b>Trace:</b></p><ol><li>1 + 11 = 12, too big: move the right pointer to 8.</li><li>1 + 8 = 9, too small: move the left pointer to 3.</li><li>3 + 8 = 11, too big: right pointer to 6.</li><li>3 + 6 = 9, too small: left pointer to 4.</li><li>4 + 6 = 10: found, after <b>5</b> checks.</li></ol><p>At most n − 1 checks in general, against 15 for all pairs here.</p>' },
        { lvl: 'core', q: 'What is the sum of the subarray a[2] … a[5] (inclusive) of a = [5, 1, 4, 2, 7, 3, 6], using prefix sums?', a: 16, tol: { abs: 0.1 }, hint: 'P[6] − P[2].', sol: '<p><b>Approach:</b> with P[i] = sum of the first i elements, a[2] … a[5] = P[6] − P[2].</p><ol><li>P = [0, 5, 6, 10, 12, 19, 22, 28].</li><li>P[6] − P[2] = 22 − 6 = <b>16</b> = 4 + 2 + 7 + 3.</li></ol>' },
        { lvl: 'core', q: 'How many contiguous subarrays of [1, 1, 1] sum to 2?', a: 2, tol: { abs: 0.1 }, hint: 'Positions 0–1 and 1–2.', sol: '<p>The subarrays [1, 1] starting at 0 and at 1: <b>2</b>. With prefix sums 0, 1, 2, 3, the pairs two apart are (0, 2) and (1, 3).</p>' },
        { lvl: 'core', q: 'Five slots start at 0. Apply "add 2 to slots 1–3" and "add 5 to slots 2–4" (inclusive) with a difference array. What is slot 3 at the end?', a: 7, tol: { abs: 0.1 }, hint: 'Both ranges cover slot 3.', sol: '<p>D after the updates: D[1] += 2, D[4] −= 2, D[2] += 5, D[5] −= 5. Running sums over slots 0–4: 0, 2, 7, 7, 5. Slot 3 = <b>7</b>, covered by both updates.</p>' },
        { lvl: 'interview', q: 'Given prices for n days, find the maximum profit from one buy and one later sell. Describe an O(n) algorithm and say why it is correct.', sol: '<p><b>One pass, tracking the lowest price so far.</b> For each day, the best sale today is today\'s price minus the cheapest earlier price. Keep min_so_far and best = max(best, price − min_so_far), then update min_so_far.</p><p><b>Correctness:</b> the optimal pair (buy at i, sell at j &gt; i) is considered on day j, because min_so_far at day j is at most price[i]. O(n) time, O(1) space. (It\'s also a prefix-minimum: the two-pointer idea in disguise.)</p>' },
        { lvl: 'interview', q: 'Why doesn\'t a sliding window work for "count subarrays summing to k" when the array has negative numbers, while prefix sums do?', sol: '<p>A sliding window relies on monotonicity: extending the window only increases the sum and shrinking only decreases it, so you know which end to move. With negatives, extending can lower the sum and shrinking can raise it, so there\'s no safe move.</p><p>Prefix sums don\'t need any ordering: every subarray sum is P[r] − P[l], and the hash map counts all earlier P[l] = P[r] − k directly, whatever the signs.</p>' },
        { lvl: 'stretch', q: 'Extend prefix sums to two dimensions: how do you get the sum of any rectangle in a grid in O(1)?', sol: '<p>Precompute S[i][j] = sum of the rectangle from (0, 0) to (i − 1, j − 1), using S[i][j] = grid[i−1][j−1] + S[i−1][j] + S[i][j−1] − S[i−1][j−1] (inclusion–exclusion). Then the rectangle with rows r1…r2−1 and columns c1…c2−1 has sum S[r2][c2] − S[r1][c2] − S[r2][c1] + S[r1][c1]. O(rows × cols) set-up, O(1) per query.</p>' },
      ],
      practice: [['Pairs with a target sum', '#/code/opt-pair-sum'], ['Prices after dividends', '#/code/opt-dividends'], ['Coding problems', '#/code']],
    },
  });
})();
