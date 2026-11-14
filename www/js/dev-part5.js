// Quant dev handbook, Part 5: algorithms on streaming market data, and a method for coding
// interviews. See devbook-content.js. Code listings are run by research/verify_internals.py.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    'dsa-streaming': {
      title: 'Algorithms on live data', minutes: 45,
      why: 'Trading systems process data as it arrives: you can\'t sort a stream or look at it twice, and every update has to be fast. Quant developer interviews often ask for exactly these building blocks: a rolling VWAP, a rate limiter, an LRU cache, the best bid with cancels. Each is a data structure from earlier chapters, arranged so every update is O(1) or O(log n).',
      goals: ['Keep rolling statistics over a time window with a deque and running sums', 'Build a sliding-window rate limiter and explain the token bucket', 'Track the best price under adds and cancels with a heap and lazy deletion', 'Build an LRU cache, and know where floating-point drift creeps in'],
      prereq: ['dsa-window', 'dsa-heaps', 'dsa-linked'],
      sections: [
        { h: 'Rolling statistics over a time window', blocks: [
          `<p>A rolling statistic over "the last 60 seconds" is a sliding window whose left edge moves with the clock. Keep the window's events in a <b>deque</b>, and keep running sums: add each new event's contribution, and when the oldest event falls out of the window, pop it from the left and subtract its contribution. Each event is added once and removed once, so the cost is O(1) amortised per event, whatever the window size.</p>
           <p>Sums, counts, means, VWAP (Σ price × qty / Σ qty) and variance (from Σx and Σx²) all work this way. The maximum and minimum don't, because you can't "subtract" a maximum: use the monotonic deque from the sliding-windows chapter.</p>
           <p>An <b>exponentially weighted moving average</b> needs no window at all: ewma = α·x + (1 − α)·ewma. Each older value's weight shrinks by a factor (1 − α) per update, and it needs O(1) memory.</p>`,
          { code: `from collections import deque


class RollingVWAP:
    """VWAP of the trades in the last window seconds. O(1) amortised per trade."""

    def __init__(self, window):
        self.window = window
        self.trades = deque()          # (time, price, qty), oldest first
        self.pv = 0.0                  # sum of price * qty in the window
        self.qty = 0                   # sum of qty in the window

    def add(self, t, price, qty):
        self.trades.append((t, price, qty))
        self.pv += price * qty
        self.qty += qty
        while self.trades[0][0] <= t - self.window:     # expired: drop and subtract
            _, p, q = self.trades.popleft()
            self.pv -= p * q
            self.qty -= q

    def value(self):
        return self.pv / self.qty if self.qty else None


def ewma(values, alpha):
    out, avg = [], None
    for x in values:
        avg = x if avg is None else alpha * x + (1 - alpha) * avg
        out.append(avg)
    return out`, test: 'rolling' },
          { q: 'With a 60-second window, trades arrive at t = 0 (100 × 10), t = 30 (101 × 20) and t = 70 (102 × 10). What is the VWAP after the last trade? (2 decimal places.)', a: 101.33, tol: { abs: 0.01 }, hint: 'The trade at t = 0 has left the window.', sol: 'At t = 70 the window is (10, 70], so the t = 0 trade has expired. VWAP = (101 × 20 + 102 × 10)/(20 + 10) = 3,040/30 = <b>101.33</b>.' },
          { q: 'An EWMA with α = 0.5 starts at the first value. After the values 10, 20, 30, what is it?', a: 22.5, tol: { abs: 0.01 }, hint: '10, then 0.5 × 20 + 0.5 × 10 = 15, then…', sol: '10 → 0.5 × 20 + 0.5 × 10 = 15 → 0.5 × 30 + 0.5 × 15 = <b>22.5</b>.' },
          { trap: 'Running float sums drift: subtracting the same values you added doesn\'t always give back exactly what you had, and after millions of updates the error shows. Keep prices as integer ticks and quantities as integers where you can, or recompute the sum from the window now and then.' },
        ] },
        { h: 'Rate limiting', blocks: [
          `<p>"Allow at most 100 orders per second" protects an exchange connection (and is often a hard exchange rule). Two standard designs:</p>
           <ul><li><b>Sliding-window log:</b> keep the timestamps of accepted requests in a deque; drop those older than the window; accept if fewer than the limit remain. Exact, with O(limit) memory.</li>
           <li><b>Token bucket:</b> a bucket holds up to B tokens and refills at r tokens per second; each request spends one token, and is refused (or delayed) when the bucket is empty. O(1) memory, and it allows short bursts of up to B. Refill lazily: when a request arrives, add r × (time since the last request), capped at B.</li></ul>`,
          { code: `from collections import deque


class RateLimiter:
    """At most limit accepted requests in any window-second span."""

    def __init__(self, limit, window):
        self.limit, self.window = limit, window
        self.accepted = deque()

    def allow(self, t):
        while self.accepted and self.accepted[0] <= t - self.window:
            self.accepted.popleft()
        if len(self.accepted) < self.limit:
            self.accepted.append(t)
            return True
        return False


class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity
        self.tokens, self.last = capacity, None

    def allow(self, t):
        if self.last is not None:
            self.tokens = min(self.capacity, self.tokens + self.rate * (t - self.last))
        self.last = t
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False`, test: 'rate_limit' },
          { q: 'A limit of 3 requests per 10 seconds; requests arrive at t = 0, 1, 2, 3, 10, 11. How many are accepted?', a: 5, tol: { abs: 0.1 }, hint: 'At t = 10 the request from t = 0 has left the window.', sol: '0, 1 and 2 are accepted; 3 is refused (three in the last 10 s). At 10, the t = 0 request expires, leaving 2: accepted. At 11, t = 1 expires: accepted. <b>5</b> in total.' },
        ] },
        { h: 'The best price with cancels: lazy deletion', blocks: [
          `<p>A heap gives the best bid in O(1) and adds in O(log n), but it can't remove an arbitrary order. The standard trick is <b>lazy deletion</b>: on a cancel, just mark the order dead (remove it from a dict of live orders). When you look at the top of the heap, pop dead entries until the top is live. Each entry is pushed once and popped at most once, so the cost stays O(log n) amortised.</p>
           <p>In a real book you'd keep a heap of price levels (each level a queue of orders, plus a total size) rather than individual orders, and drop a level when its size reaches zero.</p>`,
          { code: `import heapq


class BestBid:
    """Best (highest) bid under adds and cancels. Order ids are unique."""

    def __init__(self):
        self.heap = []                 # (-price, order_id): heapq is a min-heap
        self.live = {}                 # order_id -> price

    def add(self, order_id, price):
        self.live[order_id] = price
        heapq.heappush(self.heap, (-price, order_id))

    def cancel(self, order_id):
        self.live.pop(order_id, None)  # O(1): the heap entry is cleaned up later

    def best(self):
        while self.heap and self.heap[0][1] not in self.live:
            heapq.heappop(self.heap)   # discard cancelled orders at the top
        return -self.heap[0][0] if self.heap else None`, test: 'lazy_heap' },
          { q: 'Bids are added: a at 100, b at 101, c at 99, d at 101. Then b and d are cancelled. What does best() return?', a: 100, tol: { abs: 0.1 }, hint: 'Both 101 bids are gone.', sol: 'best() pops the two dead 101 entries from the top, then finds a at <b>100</b> live.' },
        ] },
        { h: 'An LRU cache', blocks: [
          `<p>An LRU (least recently used) cache holds at most n entries and, when full, evicts the one used longest ago. The data structure is a hash map plus a doubly linked list in order of use (see the linked-lists chapter); Python's <code>OrderedDict</code> is exactly that, with move_to_end and popitem(last=False) in O(1). In an interview, say which you're using; some interviewers then ask you to write the linked list yourself.</p>`,
          { code: `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()      # least recently used first

    def get(self, key):
        if key not in self.data:
            return None
        self.data.move_to_end(key)     # now the most recently used
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)      # evict the least recently used`, test: 'lru' },
          { id: 'm1', q: 'With capacity 2: put(1), put(2), get(1), put(3). What does the cache now hold?', opts: [['Keys 1 and 3'], ['Keys 2 and 3', 'get(1) made 1 the most recently used, so 2 is evicted.'], ['Keys 1 and 2', 'The cache is full, so put(3) must evict something.'], ['Only key 3', 'Only one key is evicted.']], sol: 'After get(1) the order of use is 2, 1. put(3) evicts the least recently used, 2, leaving 1 and 3.' },
          { market: 'Caches like this sit in front of slow lookups: instrument reference data, risk limits from a database, recent quotes for a pricing service. The design questions are what to evict, how stale an entry may get (a time-to-live), and what happens when the source changes (invalidation).' },
        ] },
      ],
      takeaways: ['Rolling sums over a time window: a deque plus running totals, O(1) amortised per event.', 'Max/min over a window need a monotonic deque; EWMA needs no window at all.', 'Rate limits: a sliding-window log (exact) or a token bucket (O(1) memory, allows bursts).', 'Heaps with lazy deletion handle cancels: mark dead, pop dead entries when they reach the top.', 'LRU = hash map + doubly linked list (OrderedDict). Watch for float drift in long-running sums.'],
      explain: { q: 'Why is lazy deletion from a heap still O(log n) per operation on average, even though best() sometimes pops many entries?', a: 'Every entry is pushed onto the heap exactly once and can be popped at most once, and each push or pop costs O(log n). So over any sequence of operations the total popping work is at most the total pushing work. A single best() call can be slow if many cancelled orders sit at the top, but averaged over all operations (amortised) it\'s O(log n) each.' },
      homework: [
        { lvl: 'core', q: 'A rolling mean over the last 3 values of the stream 1, 2, 3, 4, 5: what is the final value?', a: 4, tol: { abs: 0.1 }, hint: 'The last three values are 3, 4, 5.', sol: '<p>The window holds 3, 4, 5, so the mean is 12/3 = <b>4</b>. With a running sum: add the new value, subtract the one leaving, O(1) per update.</p>' },
        { lvl: 'core', q: 'A limit of 2 requests per 5 seconds; requests at t = 0, 1, 2, 5, 6. How many are accepted?', a: 4, tol: { abs: 0.1 }, hint: 'At t = 5 the request from t = 0 has expired.', sol: '<p>0 and 1 are accepted, 2 is refused. At 5, the t = 0 request expires ([1] remains): accepted. At 6, t = 1 expires ([5] remains): accepted. <b>4</b> accepted.</p>' },
        { lvl: 'core', q: 'An EWMA with α = 0.2: after how many updates does an old value\'s weight fall to half? (2 decimal places; the half-life.)', a: 3.11, tol: { abs: 0.01 }, hint: 'Solve 0.8ⁿ = 0.5.', sol: '<p>Each update multiplies an old value\'s weight by 0.8, so n = ln 0.5/ln 0.8 = <b>3.11</b> updates. Traders often pick α from a half-life instead: α = 1 − 0.5^(1/h).</p>' },
        { lvl: 'core', q: 'A token bucket holds at most 5 tokens and refills 1 per second. It starts full; 8 requests arrive at once at t = 0, then 3 more at t = 2. How many of the 11 are accepted?', a: 7, tol: { abs: 0.1 }, hint: '5 at t = 0, and the bucket refills 2 tokens by t = 2.', sol: '<p>At t = 0 the 5 tokens cover 5 requests; 3 are refused. By t = 2 the bucket has refilled 2 tokens, so 2 of the 3 are accepted. <b>7</b> in total: the bucket allows a burst of 5, then 1 per second.</p>' },
        { lvl: 'interview', q: 'Design the data structures for a limit order book that supports add, cancel, best bid/offer and "volume at price", with the costs of each.', sol: '<p><b>Orders:</b> a dict order_id → order (side, price, remaining size, a link into its level). <b>Levels:</b> per side, a dict price → level, where a level is a queue of orders in time order (a doubly linked list or deque) and a total size. <b>Best price:</b> a heap of prices per side (max-heap for bids, via negation), with lazy deletion of empty levels; or a sorted structure (std::map in C++, sortedcontainers in Python).</p><p><b>Costs:</b> add is O(1) to an existing level, O(log L) for a new level. Cancel is O(1) (find by id, unlink). Best is O(1) amortised. Volume at a price is O(1) from the level total. Matching walks the best level\'s queue from the front.</p>' },
        { lvl: 'interview', q: 'Exchange messages carry sequence numbers. How should a feed handler deal with gaps and duplicates, and what data structure helps?', sol: '<p>Track the next expected sequence number. A lower number is a duplicate (common with A/B feed arbitration): drop it. The expected number is processed, then any buffered messages that follow on. A higher number is a gap: buffer it (a dict or heap keyed by sequence number) and request a retransmission or wait for the other line. If the gap doesn\'t fill within a timeout, mark the book stale and recover from a snapshot. Never apply out-of-order updates to the book.</p>' },
        { lvl: 'stretch', q: 'Maintain the median of the last k prices in a stream. Outline an O(log k) per-update approach.', sol: '<p>Use the running-median idea (a max-heap for the lower half, a min-heap for the upper half), but the window also removes old values. Remove them lazily: record the outgoing value in a "to delete" counter, adjust the size counts as if it were gone, and pop it when it reaches the top of its heap. Rebalance so the halves differ by at most one, cleaning the tops after each move. Each update is O(log k) amortised. A sorted list with bisect gives O(k) per update, fine for small k; sortedcontainers gives O(log k) directly.</p>' },
      ],
      practice: [['Busiest service in the last hour', '#/code/opt-log-window'], ['Limit order book', '#/code/opt-order-book'], ['Design: rate limiter', '#/code/design/d-rate-limiter'], ['Design: feed handler', '#/code/design/d-feed-handler']],
    },

    'dsa-interview': {
      title: 'A method for coding interviews', minutes: 35,
      why: 'Knowing the patterns is half of it. The other half is process: interviewers grade how you clarify, how you get from a slow idea to a fast one, how clearly you talk, and whether you test your own code. A fixed method also stops panic, because there\'s always a next step.',
      goals: ['Follow one method from reading the question to testing the code', 'Map clues in the question and its limits to a technique', 'Test your own code with deliberate edge cases', 'Know what to say when you\'re stuck'],
      prereq: ['dsa-dp', 'dsa-graphs'],
      sections: [
        { h: 'The method', blocks: [
          `<ol><li><b>Clarify.</b> Repeat the question in your own words. Ask about the input size, empty or invalid input, duplicates, negative numbers, sorted or not, and what to return in odd cases.</li>
           <li><b>Examples.</b> Work one small example by hand, and make one tricky one. This often shows the pattern.</li>
           <li><b>Brute force.</b> Say the obvious solution and its cost, even if it's slow. It proves you understand the question and gives you something to improve.</li>
           <li><b>Optimise.</b> Ask: what work is repeated? Could sorting, a hash map, a window or a heap remove it? Check the limits to see what's needed.</li>
           <li><b>Code.</b> Agree the approach first, then write clean code with good names, talking as you go.</li>
           <li><b>Test.</b> Trace your example through the code line by line, then try the edge cases. Fix bugs calmly, out loud.</li>
           <li><b>Analyse.</b> State the time and memory cost, and what you'd change for more data or a stream.</li></ol>`,
          { q: 'With n = 100,000, roughly how many billion basic steps does an O(n²) algorithm take?', a: 10, tol: { abs: 0.1 }, hint: '(10⁵)² = 10¹⁰.', sol: '(10⁵)² = 10¹⁰ = <b>10</b> billion: far over the roughly 10⁸ simple steps a second Python manages, so n = 10⁵ needs O(n log n) or better.' },
        ] },
        { h: 'From clues to a technique', blocks: [
          `<table class="hb-table"><tr><th>Clue in the question</th><th>Try</th></tr>
           <tr><td>Sorted input; a pair or triple with a target</td><td>Two pointers, binary search</td></tr>
           <tr><td>Contiguous subarray or substring; "longest/shortest such that"</td><td>Sliding window; prefix sums with a hash map</td></tr>
           <tr><td>"Have we seen it?", counts, grouping</td><td>Hash map / set</td></tr>
           <tr><td>Matching brackets; next greater element</td><td>Stack, monotonic stack</td></tr>
           <tr><td>Top k, k-th largest, merge k sorted, running median</td><td>Heap</td></tr>
           <tr><td>Shortest path in steps; levels</td><td>BFS</td></tr>
           <tr><td>Dependencies, ordering</td><td>Topological sort</td></tr>
           <tr><td>Connected groups, merging sets</td><td>Union-find or DFS</td></tr>
           <tr><td>"Smallest x that works", monotone feasibility</td><td>Binary search on the answer</td></tr>
           <tr><td>All subsets, permutations, combinations</td><td>Backtracking</td></tr>
           <tr><td>Count the ways; best total; choices that overlap</td><td>Dynamic programming</td></tr>
           <tr><td>Intervals, meetings</td><td>Sort, then sweep or greedy</td></tr></table>`,
          { id: 'm1', q: 'Find the length of the longest stretch of prices whose max and min differ by at most w. Which technique fits?', opts: [['A sliding window with two monotonic deques'], ['Backtracking over all subarrays', 'There are only O(n²) subarrays, and a window avoids even that.'], ['Dynamic programming over subsets', 'The question is about contiguous stretches, not subsets.'], ['Topological sort', 'There are no dependencies here.']], sol: '"Longest contiguous stretch such that…" signals a sliding window. The window needs its max and min as it moves, which two monotonic deques give in O(1) amortised: O(n) overall.' },
          { worked: 'the longest stretch within a price band', q: 'Prices [10, 1, 2, 4, 7, 2] and band width w = 5. Find the longest contiguous stretch whose max − min ≤ 5.', steps: [
            ['Clarify and brute force.', 'Contiguous, so try every subarray and check its range: O(n²) subarrays, too slow for 10⁵.'],
            ['What makes it a window problem?', 'If a stretch fits the band, every shorter stretch inside it fits too. So grow the right end, and shrink from the left while the band is broken.'],
            ['How do you get the max and min quickly?', 'Keep one deque of indices with decreasing prices (front = window max) and one with increasing prices (front = window min).'],
            ['Trace it.', 'Windows ending at each index: [10], [1] (10 − 1 &gt; 5), [1, 2], [1, 2, 4], [1, 2, 4, 7]? 7 − 1 = 6 &gt; 5, so shrink to [2, 4, 7]; then [2, 4, 7, 2].'],
            'The longest is [2, 4, 7, 2]: length <b>4</b>, in O(n).',
          ] },
          { code: `from collections import deque


def longest_in_band(prices, width):
    """Longest contiguous stretch with max - min <= width. O(n)."""
    highs, lows = deque(), deque()     # indices; prices decreasing / increasing
    left = best = 0
    for right, p in enumerate(prices):
        while highs and prices[highs[-1]] <= p:
            highs.pop()
        highs.append(right)
        while lows and prices[lows[-1]] >= p:
            lows.pop()
        lows.append(right)
        while prices[highs[0]] - prices[lows[0]] > width:
            left += 1                  # shrink, dropping indices that left the window
            if highs[0] < left:
                highs.popleft()
            if lows[0] < left:
                lows.popleft()
        best = max(best, right - left + 1)
    return best`, test: 'band' },
          { q: 'What does longest_in_band return for prices [8, 2, 4, 7] and width 4?', a: 2, tol: { abs: 0.1 }, hint: 'Check [2, 4] and [4, 7].', sol: '[8, 2] has range 6; [2, 4] has 2; [2, 4, 7] has 5; [4, 7] has 3. The longest fitting stretch has length <b>2</b>.' },
        ] },
        { h: 'Testing and getting unstuck', blocks: [
          `<p><b>Edge cases to try:</b> empty input; one element; all elements equal; already sorted and reverse sorted; negative numbers and zero; duplicates; the answer at the very start or end; the largest input size (for speed and recursion depth).</p>
           <p><b>When you're stuck,</b> say so and think aloud: go back to the brute force and ask what it repeats; try a smaller example; ask whether sorting the input would help; go through the clue table. Interviewers give hints to people who are visibly reasoning; silence gives them nothing to work with.</p>`,
          { q: 'Edge case: what does longest_in_band return for an empty list of prices?', a: 0, tol: { abs: 0.1 }, hint: 'The loop body never runs.', sol: 'With no prices the for loop never runs and best stays <b>0</b>, which is the right answer, and it never touches highs[0]. Tracing the empty case like this is exactly the habit interviewers look for. Width 0 (the longest run of equal prices) and all-equal prices are worth trying too.' },
          { trap: 'Don\'t start coding the moment you recognise a pattern. Say the approach and its cost, and get a nod first: rewriting halfway through costs far more time than a minute of agreement.' },
        ] },
      ],
      takeaways: ['Clarify, examples, brute force, optimise, code, test, analyse: always have a next step.', 'Read the limits: they tell you the complexity you need.', 'Map clues to techniques: sorted → pointers; contiguous → window; top k → heap; ways/best → DP.', 'Trace your own example through the code, then test edge cases out loud.', 'Stuck? Return to the brute force and ask what it repeats.'],
      explain: { q: 'Why should you state a brute-force solution in an interview, even if you know it\'s too slow?', a: 'It shows you understand the question and gives a correct baseline that the interviewer can confirm before you optimise. The improvements usually come from it: asking what work the brute force repeats leads to the hash map, window or DP. And if time runs out, a working slow solution scores better than an unfinished fast one.' },
      homework: [
        { lvl: 'core', q: 'With n = 1,000,000, about how many million steps does an O(n log₂ n) algorithm take?', a: 20, tol: { abs: 1 }, hint: 'log₂ 10⁶ ≈ 20.', sol: '<p>10⁶ × log₂ 10⁶ ≈ 10⁶ × 20 = <b>20</b> million: comfortable in a second, even in Python.</p>' },
        { lvl: 'core', q: 'Brute-force two-sum checks every pair. For n = 10,000, how many million pairs is that? (2 decimal places.)', a: 49.995, tol: { abs: 0.01 }, hint: 'n(n − 1)/2.', sol: '<p>10,000 × 9,999/2 = 49,995,000 = <b>49.995</b> million pairs. A hash map does it in one pass of 10,000 steps.</p>' },
        { lvl: 'core', q: 'What does longest_in_band return for prices [4, 2, 2, 2, 4, 4, 2, 2] and width 0?', a: 3, tol: { abs: 0.1 }, hint: 'Width 0 means all prices in the stretch are equal.', sol: '<p>With width 0, the stretch must be a run of equal prices. The runs are 4; 2, 2, 2; 4, 4; 2, 2, so the longest has length <b>3</b>.</p>' },
        { lvl: 'core', q: 'With n = 5,000, how many million steps does an O(n²) algorithm take?', a: 25, tol: { abs: 0.1 }, hint: '5,000².', sol: '<p>5,000² = 25,000,000 = <b>25</b> million: fine in a compiled language, borderline in pure Python (seconds), so it\'s worth asking the time limit.</p>' },
        { lvl: 'interview', q: 'Your code passes the example, and the interviewer asks "are you confident it\'s correct?" What do you do?', sol: '<p>Don\'t just say yes. Trace a second, trickier example through the code out loud, then go through the edge cases: empty input, one element, duplicates, all equal, the answer at either end, the largest size. Check loop bounds and off-by-ones at each boundary. Say what invariant each loop keeps. If you find a bug, fix it calmly; finding your own bugs is a strength in the score.</p>' },
        { lvl: 'interview', q: 'You\'ve solved the question in O(n log n). The interviewer asks: "what if the data doesn\'t fit in memory, or arrives as a stream?" How do you answer?', sol: '<p>Say what part needs the whole input. If the solution sorts, an external merge sort works on disk (sort chunks that fit, then a k-way merge with a heap). If it needs only a window, process the stream with a deque and O(window) memory. If it needs counts, a hash map of counts may fit even when the data doesn\'t, or use an approximate sketch (count-min) when it doesn\'t. Splitting by key (by symbol, say) lets machines process parts in parallel. Mention the trade-offs: exact or approximate, latency, memory.</p>' },
        { lvl: 'stretch', q: 'Give the cost of longest_in_band and justify the amortised bound.', sol: '<p>O(n) time, O(n) memory in the worst case for the deques. Each index is appended to each deque once and removed at most once (from the back when a better value arrives, or from the front when it leaves the window), and left only ever moves right, at most n times in total. So the total work across all the while loops is O(n), even though one step can do a lot of popping.</p>' },
      ],
      practice: [['Coding problems', '#/code'], ['Tech screening practice', '#/code/screening']],
    },
  });
})();
