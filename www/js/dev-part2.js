// Quant dev handbook, Part 2 (second half): sliding windows, hashing, stacks, linked lists.
// See devbook-content.js. Code listings ({ code, test }) are run by research/verify_internals.py.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    'dsa-window': {
      title: 'Sliding windows', minutes: 45,
      why: 'Rolling statistics over the last n trades or the last 5 minutes are everywhere in trading code, and "longest/shortest substring or subarray such that…" is one of the most common interview patterns. Both are sliding windows: maintain the answer as the window moves instead of recomputing it.',
      goals: ['Maintain a fixed-size window in O(1) per step', 'Grow and shrink a variable window to find the longest or shortest valid range', 'Track a window\'s maximum with a monotonic deque', 'Recognise when a window doesn\'t work (negative numbers)'],
      prereq: ['dsa-arrays'],
      sections: [
        { h: 'Fixed-size windows', blocks: [
          `<p>For a window of the last k items, don't re-add all k each step: add the item that enters and subtract the one that leaves. O(1) per step instead of O(k). The moving average of a price stream, the volume traded in the last k trades, and "maximum sum of k consecutive days" all work this way.</p>`,
          { code: `def max_window_sum(a, k):
    """Largest sum of k consecutive elements (len(a) >= k)."""
    s = sum(a[:k])
    best = s
    for i in range(k, len(a)):
        s += a[i] - a[i - k]      # one enters, one leaves
        best = max(best, s)
    return best`, test: 'max_window_sum' },
          { q: 'What is the largest sum of 3 consecutive elements of [2, 1, 5, 1, 3, 2]?', a: 9, tol: { abs: 0.1 }, hint: 'Windows: 8, 7, 9, 6.', sol: 'The windows sum to 2+1+5 = 8, 1+5+1 = 7, 5+1+3 = 9 and 1+3+2 = 6. The best is <b>9</b>.' },
        ] },
        { h: 'Variable windows: grow, then shrink', blocks: [
          `<p>For "the longest range such that a condition holds", move a right pointer forward one step at a time, and whenever the window breaks the condition, move the left pointer forward until it holds again. Each pointer moves at most n times, so it's O(n) overall, even though there's a loop inside a loop.</p>
           <p>It works when the condition is <b>monotone</b>: if a window is valid, every smaller window inside it is too (no repeated characters; at most k distinct values; sum at most a budget with non-negative numbers). For "shortest range with sum at least target", flip it: grow until valid, then shrink while it stays valid, recording the length each time.</p>`,
          { code: `def longest_unique(s):
    """Length of the longest substring with no repeated character."""
    last = {}            # character -> index of its latest occurrence
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1          # jump past the earlier copy
        last[ch] = right
        best = max(best, right - left + 1)
    return best


def shortest_with_sum(a, target):
    """Shortest length of a contiguous subarray with sum >= target (a non-negative), or 0."""
    left = total = 0
    best = float("inf")
    for right, x in enumerate(a):
        total += x
        while total >= target:
            best = min(best, right - left + 1)
            total -= a[left]
            left += 1
    return 0 if best == float("inf") else best`, test: 'variable_window' },
          { q: 'What is the length of the longest substring of "abcabcbb" with no repeated character?', a: 3, tol: { abs: 0.1 }, hint: '"abc".', sol: '"abc" (and later "bca", "cab") have length <b>3</b>; any longer window repeats a letter.' },
          { q: 'What is the shortest contiguous subarray of [2, 3, 1, 2, 4, 3] with sum at least 7?', a: 2, tol: { abs: 0.1 }, hint: 'Look near the end.', sol: '[4, 3] sums to 7 with length <b>2</b>. No single element reaches 7.' },
        ] },
        { h: 'The window maximum: a monotonic deque', blocks: [
          `<p>The maximum of each window of size k is harder: when the maximum leaves, what's the next one? Keep a deque of indices whose values are <b>decreasing</b>. When a new value arrives, pop from the back every index with a smaller or equal value (they can never be a maximum again: the newcomer is bigger and will outlive them). The front is then the window's maximum; pop it when it falls out of the window. Each index enters and leaves once: O(n) total.</p>`,
          { code: `from collections import deque


def window_max(a, k):
    dq, out = deque(), []          # indices, values decreasing front to back
    for i, x in enumerate(a):
        while dq and a[dq[-1]] <= x:
            dq.pop()                  # smaller values can never be a maximum again
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()              # the front has left the window
        if i >= k - 1:
            out.append(a[dq[0]])
    return out`, test: 'window_max' },
          { q: 'For [1, 3, −1, −3, 5, 3, 6, 7] and windows of 3, what is the maximum of the fourth window?', a: 5, tol: { abs: 0.1 }, hint: 'The fourth window is [−3, 5, 3].', sol: 'The window maxima are 3, 3, 5, 5, 6, 7. The fourth window, [−3, 5, 3], has maximum <b>5</b>.' },
          { market: 'Rolling highs and lows (for breakout signals, or the price range over the last minute) are exactly this. With time-based windows, store (time, value) pairs and pop from the front when the time is too old.' },
          { trap: 'Sliding windows need monotonicity. "Longest subarray with sum exactly k" with negative numbers can\'t be done by growing and shrinking: use prefix sums and a hash map instead (the arrays chapter).' },
        ] },
      ],
      takeaways: ['Fixed window: add the newcomer, subtract the leaver: O(1) per step.', 'Variable window: grow on the right, shrink on the left while invalid; each pointer moves n times: O(n).', 'It needs monotonicity: valid windows stay valid when shrunk.', 'Window maximum: a deque of indices with decreasing values, O(n) total.', 'Negative numbers break sum windows: use prefix sums.'],
      explain: { q: 'The variable sliding window has a while loop inside a for loop. Why is it O(n), not O(n²)?', a: 'The inner loop only moves the left pointer forward, and the left pointer never moves back. Over the whole run it moves at most n times in total, and the right pointer moves n times, so the total work is O(n): the inner loop\'s steps are shared out across the whole run, not repeated for each right position.' },
      homework: [
        { lvl: 'core', q: 'What is the largest average of 4 consecutive elements of [1, 12, −5, −6, 50, 3]?', a: 12.75, tol: { abs: 0.001 }, hint: 'Find the best sum of 4, then divide.', sol: '<p><b>Fixed window of 4:</b> sums 1+12−5−6 = 2, 12−5−6+50 = 51, −5−6+50+3 = 42. The best is 51, an average of 51/4 = <b>12.75</b>.</p>' },
        { lvl: 'core', q: 'What is the length of the longest substring of "pwwkew" with no repeated character?', a: 3, tol: { abs: 0.1 }, hint: '"wke".', sol: '<p><b>Trace:</b> the window grows to "pw"; the second w jumps the left end past the first w, leaving "w"; it grows to "wke" (length 3); the final w jumps the left end past the earlier w, leaving "kew" (length 3). The answer is <b>3</b>. "pwke" has length 4 but is a subsequence, not a substring.</p>' },
        { lvl: 'core', q: 'What is the length of the longest substring of "eceba" with at most 2 distinct characters?', a: 3, tol: { abs: 0.1 }, hint: 'Track character counts in the window.', sol: '<p><b>Window with a Counter:</b> grow the right end; while the window has more than 2 distinct characters, remove from the left. "ece" has 2 distinct characters and length <b>3</b>; adding b makes 3 distinct, so the window shrinks to "eb".</p>' },
        { lvl: 'core', q: 'For [4, 2, 12, 3, 8, 1] and windows of size 2, what is the sum of all the window maxima?', a: 44, tol: { abs: 0.1 }, hint: 'Maxima: 4, 12, 12, 8, 8.', sol: '<p>The windows [4, 2], [2, 12], [12, 3], [3, 8] and [8, 1] have maxima 4, 12, 12, 8 and 8, which sum to <b>44</b>.</p>' },
        { lvl: 'interview', q: 'Describe how you\'d keep the maximum trade price over the last 60 seconds of a stream, with O(1) amortised work per trade.', sol: '<p><b>Monotonic deque of (time, price).</b> On each trade: pop from the back every entry with price ≤ the new price (they can never be the maximum again), append the new trade, then pop from the front while its time is more than 60 seconds old. The front is the 60-second maximum.</p><p>Each trade is pushed and popped at most once, so the work is O(1) amortised per trade. Memory is bounded by the number of trades in the window. For a minimum, keep prices increasing instead.</p>' },
        { lvl: 'interview', q: 'Find the length of the shortest substring of s containing all the characters of t (the "minimum window substring"). Outline the algorithm and its cost.', sol: '<p><b>Variable window with counts.</b> Count what t needs (a Counter) and track how many distinct characters are fully satisfied. Grow the right end, updating counts; whenever all are satisfied, record the window and shrink from the left while it stays satisfied.</p><p>Each pointer moves at most len(s) times: O(len(s) + len(t)) time, O(alphabet) space. The key detail is the "satisfied" counter, which avoids rechecking every character each step.</p>' },
        { lvl: 'stretch', q: 'Why does the deque in window_max hold values in decreasing order, and what would break if you popped only strictly smaller values?', sol: '<p>An index stays in the deque only while it could still become the maximum of some future window: it must be larger than every later value seen so far, so the values decrease from front to back. The front is therefore the current maximum.</p><p>Popping only strictly smaller values keeps equal values too. The answer is still correct (the earlier equal value is at the front and leaves first), but the deque can hold many equal values, and with ≤ you drop them earlier. Both are O(n); ≤ is tidier.</p>' },
      ],
      practice: [['Busiest service in the last hour', '#/code/opt-log-window'], ['Moving average review', '#/code/screening/moving-average'], ['Coding problems', '#/code']],
    },

    'dsa-hashing': {
      title: 'Hash maps and sets', minutes: 40,
      why: 'The single most useful tool in coding interviews: a hash map turns "search the list again" into an O(1) lookup. Order-id lookups, position-by-symbol, counting, deduplication and caching all rest on it, and interviewers expect you to know how it works inside.',
      goals: ['Replace nested searches with hash-map lookups', 'Count, group and deduplicate in one pass', 'Explain hashing, collisions and resizing', 'Know which keys are hashable, and why'],
      prereq: ['dsa-arrays'],
      sections: [
        { h: 'Lookups instead of searches', blocks: [
          `<p>Whenever an algorithm says "for each item, look for a matching item", ask whether a hash map can remember what you've seen. Two-sum on an unsorted array: for each x, check whether target − x was seen before. O(n) instead of O(n²), at the price of O(n) memory.</p>`,
          { code: `def two_sum(nums, target):
    """Indices (i, j), i < j, with nums[i] + nums[j] == target, or None."""
    seen = {}                       # value -> index
    for j, x in enumerate(nums):
        i = seen.get(target - x)
        if i is not None:
            return i, j
        seen[x] = j                 # store after checking, so x can't pair with itself
    return None`, test: 'two_sum' },
          { q: 'two_sum([3, 2, 4], 6) returns indices (i, j). What is i + j?', a: 3, tol: { abs: 0.1 }, hint: '2 + 4 = 6.', sol: '2 (index 1) and 4 (index 2) sum to 6, so the result is (1, 2) and i + j = <b>3</b>. Note (0, 0) isn\'t allowed: storing after checking stops 3 pairing with itself.' },
        ] },
        { h: 'Counting, grouping and deduplicating', blocks: [
          `<p>Three one-pass patterns:</p>
           <ul><li><b>Counting:</b> <code>Counter(items)</code>: frequencies, the most common, "do two strings use the same letters?".</li>
           <li><b>Grouping:</b> <code>groups[key(x)].append(x)</code> with a defaultdict. Anagrams group by their sorted letters (or a 26-count tuple); trades group by symbol.</li>
           <li><b>Deduplicating and membership:</b> a set. "Longest run of consecutive integers" in O(n): put everything in a set, and only start counting from numbers whose predecessor isn't present.</li></ul>`,
          { code: `from collections import defaultdict


def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)     # same letters -> same key
    return list(groups.values())


def longest_consecutive(nums):
    s, best = set(nums), 0
    for x in s:
        if x - 1 not in s:          # x starts a run
            y = x
            while y + 1 in s:
                y += 1
            best = max(best, y - x + 1)
    return best`, test: 'hash_patterns' },
          { q: 'How many groups does group_anagrams make from ["eat", "tea", "tan", "ate", "nat", "bat"]?', a: 3, tol: { abs: 0.1 }, hint: 'Sorted keys: aet, ant, abt.', sol: 'Keys "aet" (eat, tea, ate), "ant" (tan, nat) and "abt" (bat): <b>3</b> groups.' },
          { q: 'What is the longest run of consecutive integers in [100, 4, 200, 1, 3, 2]?', a: 4, tol: { abs: 0.1 }, hint: '1, 2, 3, 4.', sol: '1, 2, 3, 4 has length <b>4</b>. Each run is counted once, from its start, so the whole thing is O(n) even with the inner while loop.' },
        ] },
        { h: 'How a hash map works', blocks: [
          `<p>A hash map stores entries in an array of slots. The key's <b>hash</b> (an integer computed from it) picks the slot. Two keys can land in the same slot (a <b>collision</b>); Python resolves this by probing other slots in a pseudo-random sequence (open addressing), while Java chains entries in a list per slot. When the table gets about two-thirds full, it is rebuilt at a larger size (rehashing), an O(n) step that averages out to O(1) per insertion.</p>
           <p>So lookups are O(1) on average and O(n) in the worst case, when many keys collide. Keys must be <b>hashable</b>: their hash and equality must never change, so a key isn't lost in the wrong slot. That's why tuples of numbers can be keys, and lists can't.</p>`,
          { id: 'm1', q: 'Why can\'t a Python list be a dictionary key?', opts: [['It\'s mutable, so its hash could change'], ['Lists are too large to hash quickly', 'Size isn\'t the reason: long tuples are fine.'], ['Lists can contain duplicates', 'That doesn\'t matter for hashing.'], ['Dictionaries only accept strings', 'Any hashable type works.']], sol: 'If a list key were changed after insertion, its hash would no longer match the slot it\'s stored in, and the entry would become unfindable. So mutable built-ins aren\'t hashable; use a tuple.' },
          { market: 'Order books keep a hash map from order id to the order, so a cancel is O(1). With millions of messages a second, a linear search per cancel is unthinkable.' },
        ] },
      ],
      takeaways: ['"For each item, find its match" → remember what you\'ve seen in a hash map: O(n²) → O(n).', 'Counter for frequencies, defaultdict(list) for grouping, set for membership and dedupe.', 'Average O(1), worst O(n); resizing makes inserts O(1) amortised.', 'Keys must be hashable: immutable hash and equality, so tuples yes, lists no.'],
      explain: { q: 'Explain how two-sum with a hash map avoids checking every pair.', a: 'For each number, the only partner that works is target minus that number. Instead of scanning the rest of the array for it, I keep a dictionary of the numbers already seen and their positions, so finding the partner is a single O(1) lookup. One pass, O(n) time, using O(n) memory for the dictionary.' },
      homework: [
        { lvl: 'core', q: 'What index does the first character that appears only once in "loveleetcode" have?', a: 2, tol: { abs: 0.1 }, hint: 'Count characters, then scan again.', sol: '<p><b>Two passes:</b> count every character with a Counter, then return the first index whose character has count 1. l, o, e all repeat; v (index 2) appears once: <b>2</b>. O(n) time.</p>' },
        { lvl: 'core', q: 'How many distinct values does [3, 1, 3, 2, 1, 3] contain?', a: 3, tol: { abs: 0.1 }, hint: 'len(set(...)).', sol: '<p>set([3, 1, 3, 2, 1, 3]) = {1, 2, 3}: <b>3</b>. One O(n) pass.</p>' },
        { lvl: 'core', q: 'Two strings are anagrams if their letter counts match. Are "listen" and "silent" anagrams? (1 for yes, 0 for no.)', a: 1, tol: { abs: 0.1 }, hint: 'Compare Counters.', sol: '<p>Counter("listen") == Counter("silent"): both have e, i, l, n, s, t once each. <b>Yes</b> (1). O(n), against O(n log n) for comparing sorted strings.</p>' },
        { lvl: 'core', q: 'In [1, 2, 3, 1] does some value repeat within 3 positions of itself? (1 for yes, 0 for no.)', a: 1, tol: { abs: 0.1 }, hint: 'Keep the last index of each value.', sol: '<p><b>Last-seen map:</b> 1 at index 0 and again at index 3: 3 − 0 = 3 ≤ 3, so <b>yes</b> (1). One pass keeping last[value] = index.</p>' },
        { lvl: 'interview', q: 'You receive a stream of (order id, event) messages: new, fill, cancel. Which data structures give O(1) handling of each, and what does each one store?', sol: '<p><b>A dict from order id to the order record</b> (price, side, remaining quantity, and a link to its place in its price level). New: insert. Fill: look up, reduce quantity, remove if zero. Cancel: look up and remove (or mark dead). All O(1) on average.</p><p>Add a <b>dict from price to a queue</b> (deque or linked list) for each side so matching can find orders at a price in time order, and a heap or sorted structure of prices for the best bid and offer. The orders chapter of the coding problems builds exactly this.</p>' },
        { lvl: 'interview', q: 'An attacker sends keys chosen so they all collide in your hash map. What happens to performance, and how do real languages defend against it?', sol: '<p>Every key lands in the same probe sequence or chain, so each insert and lookup scans all the colliding keys: O(n) per operation, O(n²) to insert n keys. A server can be slowed to a crawl (hash-flooding denial of service).</p><p><b>Defences:</b> Python and most modern languages randomise string hashing per process (a secret seed), so attackers can\'t predict collisions; Java switches long chains to balanced trees (O(log n)).</p>' },
        { lvl: 'stretch', q: 'Design an O(1) "insert, delete, get a random element" set.', sol: '<p>Keep a list of the elements and a dict from element to its index in the list. Insert: append and record the index. Get random: random.choice(list), O(1). Delete: look up the element\'s index, move the last element into that slot (updating its index in the dict), pop the last, and delete the element from the dict. Every operation is O(1) average. The trick is swap-with-last, which avoids shifting.</p>' },
      ],
      practice: [['Worst trade', '#/code/opt-worst-trade'], ['Pairs with a target sum', '#/code/opt-pair-sum'], ['Limit order book', '#/code/opt-order-book']],
    },

    'dsa-stacks': {
      title: 'Stacks, queues and monotonic stacks', minutes: 45,
      why: 'Stacks handle anything nested (brackets, function calls, undo) and, in their monotonic form, answer "what is the next bigger value?" for every element in one pass: the trick behind stock-span and histogram problems. Queues are how work and messages flow through every trading system.',
      goals: ['Use a stack for matching and nested structure', 'Find the next greater or smaller element with a monotonic stack', 'Solve stock span and largest-rectangle problems in O(n)', 'Build a queue from two stacks, and know when to use a ring buffer'],
      prereq: ['dsa-arrays'],
      sections: [
        { h: 'Stacks: last in, first out', blocks: [
          `<p>A stack (a Python list with append and pop) gives O(1) access to the most recent item. That's exactly what nested structure needs: the bracket that must close next is the most recently opened one.</p>`,
          { code: `def balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack            # anything left open is unbalanced


def eval_rpn(tokens):
    """Evaluate reverse Polish notation: ["2", "1", "+", "3", "*"] -> 9."""
    stack = []
    for t in tokens:
        if t in ("+", "-", "*", "/"):
            b, a = stack.pop(), stack.pop()
            stack.append(a + b if t == "+" else a - b if t == "-" else a * b if t == "*" else int(a / b))
        else:
            stack.append(int(t))
    return stack[0]`, test: 'stack_basics' },
          { q: 'What does eval_rpn(["4", "13", "5", "/", "+"]) return? (Integer division truncates towards zero.)', a: 6, tol: { abs: 0.1 }, hint: '13 / 5 first.', sol: 'Push 4, 13, 5. "/" pops 5 and 13: 13/5 → 2. "+" pops 2 and 4: <b>6</b>.' },
        ] },
        { h: 'Monotonic stacks: the next greater element', blocks: [
          `<p>For each element, find the next element to its right that is larger. Brute force is O(n²). Instead, scan left to right keeping a stack of indices still waiting for their answer, with values <b>decreasing</b> from bottom to top. When a new value arrives, it is the answer for every waiting index with a smaller value: pop them and record it. Then push the new index. Each index is pushed and popped once: O(n).</p>
           <p>Variations cover a family of classic questions: next smaller (keep values increasing), previous greater (scan from the right, or read the stack before pushing), "days until a warmer temperature", and the <b>stock span</b>: how many consecutive days, ending today, the price has been at most today's price.</p>`,
          { code: `def stock_span(prices):
    """For each day, the number of consecutive days up to today with price <= today's."""
    stack, spans = [], []       # stack of indices with decreasing prices
    for i, p in enumerate(prices):
        while stack and prices[stack[-1]] <= p:
            stack.pop()
        spans.append(i + 1 if not stack else i - stack[-1])
        stack.append(i)
    return spans


def next_greater(a):
    out, stack = [-1] * len(a), []     # stack of indices still waiting
    for i, x in enumerate(a):
        while stack and a[stack[-1]] < x:
            out[stack.pop()] = x
        stack.append(i)
    return out`, test: 'monotonic_stack' },
          { q: 'Prices over 7 days are [100, 80, 60, 70, 60, 75, 85]. What is the stock span on the day the price is 75?', a: 4, tol: { abs: 0.1 }, hint: 'Count back from 75 while the price is at most 75.', sol: 'Counting back from 75: 60, 70, 60 are all ≤ 75, then 80 is higher. So the span is 4 (75 and the three before): <b>4</b>. The full spans are 1, 1, 1, 2, 1, 4, 6.' },
          { worked: 'largest rectangle in a histogram', q: 'Bars of heights [2, 1, 5, 6, 2, 3], each of width 1. What is the largest rectangle?', steps: [
            ['For a rectangle of height h[i], how far can it extend?', 'Left and right until a shorter bar: to the previous smaller and next smaller elements.'],
            ['How do you find those for every bar in O(n)?', 'A monotonic stack with increasing heights: when a bar is popped, the bar that pops it is its next smaller, and the bar beneath it in the stack is its previous smaller.'],
            'Bar of height 5 (index 2): previous smaller at index 1, next smaller at index 4: width 2, area 10. Bar 6: width 1, area 6. Bar 2 (index 4): width 4 (indices 2–5), area 8.',
            'Largest: <b>10</b>, from the bars of height 5 and 6 together.',
          ] },
        ] },
        { h: 'Queues', blocks: [
          `<p>A queue is first in, first out: message handling, order processing, breadth-first search. In Python use collections.deque (O(1) at both ends), never list.pop(0). Two classics:</p>
           <ul><li><b>A queue from two stacks:</b> push onto an "in" stack; to pop, if the "out" stack is empty, move everything across (reversing the order), then pop from "out". Each element moves once: O(1) amortised.</li>
           <li><b>A ring buffer:</b> a fixed array with head and tail indices that wrap around (index % capacity). No allocation after start-up and no shifting: what low-latency systems use for queues between threads.</li></ul>`,
          { q: 'Using two stacks as a queue, you push 1, 2, 3, pop once, push 4, then pop twice. What is the last value popped?', a: 3, tol: { abs: 0.1 }, hint: 'A queue pops in arrival order: 1, then 2, then 3.', sol: 'It behaves as a queue: pops return 1, then 2, then 3. The last popped is <b>3</b>; 4 is still waiting.' },
          { id: 'm1', q: 'Why do low-latency systems prefer a ring buffer to a linked-list queue?', opts: [['No allocation and better cache use'], ['A ring buffer can grow without limit', 'It has a fixed capacity.'], ['Linked lists can\'t be used as queues', 'They can, with O(1) operations.'], ['Ring buffers sort the messages', 'They keep arrival order.']], sol: 'A ring buffer is one contiguous, preallocated array: no allocation (or garbage collection) per message, and neighbouring slots share cache lines. A linked list allocates a node per message and chases pointers around memory.' },
        ] },
      ],
      takeaways: ['Stacks for nesting: brackets, expressions, undo, depth-first search.', 'Monotonic stack: each index pushed and popped once, O(n), for next greater/smaller.', 'Stock span = distance to the previous greater price; histogram = previous and next smaller.', 'Queues: deque in Python; two stacks give O(1) amortised; ring buffers for low latency.'],
      explain: { q: 'Explain why the monotonic stack solution to "next greater element" is O(n).', a: 'Every index is pushed onto the stack exactly once and popped at most once. The while loop inside the for loop only ever pops, so across the whole run it does at most n pops in total. That makes the total work proportional to n, even though for one particular element the while loop might pop many items.' },
      homework: [
        { lvl: 'core', q: 'Is "{[()()]}" balanced? (1 for yes, 0 for no.)', a: 1, tol: { abs: 0.1 }, hint: 'Push openers, pop on closers.', sol: '<p>Each closer matches the most recent opener: ( ), ( ), then ], then }. The stack ends empty: <b>balanced</b> (1).</p>' },
        { lvl: 'core', q: 'For [2, 1, 2, 4, 3], the next greater element of each is [4, 2, 4, −1, −1]. What is the sum of that list?', a: 8, tol: { abs: 0.1 }, hint: '4 + 2 + 4 − 1 − 1.', sol: '<p>2 → 4, 1 → 2, 2 → 4, 4 → none (−1), 3 → none (−1). Sum: 4 + 2 + 4 − 1 − 1 = <b>8</b>.</p>' },
        { lvl: 'core', q: 'Temperatures [73, 74, 75, 71, 69, 72, 76, 73]: how many days after day 2 (75°) until a warmer day?', a: 4, tol: { abs: 0.1 }, hint: 'The next warmer temperature is 76.', sol: '<p>After 75 come 71, 69, 72, then 76 on day 6. 6 − 2 = <b>4</b> days. The monotonic stack gives every day\'s answer in one pass: [1, 1, 4, 2, 1, 1, 0, 0].</p>' },
        { lvl: 'core', q: 'What is the largest rectangle in the histogram [2, 4]?', a: 4, tol: { abs: 0.1 }, hint: 'Either the bar of 4 alone, or both bars at height 2.', sol: '<p>The bar of height 4 alone: area 4. Both bars at height 2: area 4. The answer is <b>4</b>.</p>' },
        { lvl: 'interview', q: 'Design a stack that also returns its minimum in O(1).', sol: '<p><b>Keep a second stack of minimums.</b> On push(x), push x onto the main stack and min(x, current minimum) onto the min stack. On pop, pop both. getMin returns the top of the min stack. Every operation is O(1), at the cost of O(n) extra memory.</p><p>A variant pushes onto the min stack only when x ≤ the current minimum, saving memory when the minimum rarely changes.</p>' },
        { lvl: 'interview', q: 'Prove that the two-stack queue has O(1) amortised cost per operation.', sol: '<p>Track each element: it is pushed onto the in-stack once, moved to the out-stack at most once, and popped from the out-stack once. That\'s at most 3 stack operations per element over its whole life, however the pushes and pops interleave. So n operations cost O(n) in total: O(1) amortised.</p><p>A single pop can still cost O(n) (when it triggers a transfer), which matters if worst-case latency is what you care about.</p>' },
        { lvl: 'stretch', q: 'Find, for each price, the previous price strictly greater than it (or −1), in O(n). How does this relate to the stock span?', sol: '<p>Scan left to right with a stack of indices with decreasing prices: pop while the top\'s price is ≤ the current price; the top that remains (if any) is the previous strictly greater price; then push the current index.</p><p>The stock span is exactly i minus the index of that previous greater element (or i + 1 if there is none). The same stack computes both.</p>' },
      ],
      practice: [['Ring buffer deque', '#/code/opt-ring-deque'], ['Supermarket checkout', '#/code/opt-checkout'], ['Coding problems', '#/code']],
    },

    'dsa-linked': {
      title: 'Linked lists', minutes: 35,
      why: 'Linked lists are rare in Python code but common in interviews, because they test careful pointer handling. In trading systems they matter for real: the orders at a price level, and LRU caches, are doubly linked lists with O(1) removal from the middle.',
      goals: ['Reverse, merge and split linked lists without losing nodes', 'Use fast and slow pointers to find the middle and detect cycles', 'Use a dummy head to simplify edge cases', 'Know when a linked list beats an array, and when it doesn\'t'],
      prereq: ['dsa-stacks'],
      sections: [
        { h: 'Nodes and pointers', blocks: [
          `<p>A singly linked list is a chain of nodes, each holding a value and a pointer to the next node. Inserting or removing next to a node you already hold is O(1); finding the k-th node is O(k). Draw boxes and arrows before writing pointer code: most bugs are lost references.</p>`,
          { code: `class Node:
    def __init__(self, val, nxt=None):
        self.val, self.next = val, nxt


def reverse(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next   # flip one arrow, step forward
    return prev


def merge_sorted(a, b):
    dummy = tail = Node(0)          # a dummy head removes the "empty list" special case
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`, test: 'linked_basics' },
          { q: 'After reversing the list 1 → 2 → 3 → 4, what value is at the head?', a: 4, tol: { abs: 0.1 }, hint: 'The last node becomes the first.', sol: 'Reversal turns 1 → 2 → 3 → 4 into 4 → 3 → 2 → 1: the head holds <b>4</b>. Three pointers (prev, current, next) and one pass, O(n) time and O(1) memory.' },
        ] },
        { h: 'Fast and slow pointers', blocks: [
          `<p>Move one pointer one step at a time and another two steps. When the fast one reaches the end, the slow one is at the middle. And if the list has a cycle, the fast one eventually laps the slow one and they meet (Floyd's algorithm), using O(1) memory instead of a set of visited nodes.</p>
           <p>Another two-pointer trick: to remove the n-th node from the end in one pass, move a lead pointer n steps ahead, then move both until the lead hits the end. The trailing pointer is just before the node to remove.</p>`,
          { code: `def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow                 # the second middle for an even length


def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False`, test: 'fast_slow' },
          { q: 'For the list 1 → 2 → 3 → 4 → 5 → 6, what value does middle() return?', a: 4, tol: { abs: 0.1 }, hint: 'With an even length it returns the second of the two middles.', sol: 'slow moves 1 → 2 → 3 → 4 while fast moves 1 → 3 → 5 → past the end. It returns <b>4</b>, the second middle.' },
          { id: 'x1', q: 'reverse() runs on 1 → 2 → 3 → 4 → 5. After the loop body has run twice, what value does prev hold?', a: 2, tol: { abs: 0.1 }, hint: 'Each pass makes the current node the new prev.', sol: 'Pass 1 points 1 at None and sets prev = 1; pass 2 points 2 at 1 and sets prev = <b>2</b>. So prev is always the head of the reversed part (2 → 1), and head the start of the part still to reverse (3 → 4 → 5).' },
          { id: 'm1', q: 'Why does Floyd\'s cycle detection always find a cycle if there is one?', opts: [['Fast gains one step a lap on slow'], ['Fast and slow start at different nodes', 'They start at the same node.'], ['The list length is always even', 'Length doesn\'t matter.'], ['Slow eventually stops moving', 'Both keep moving.']], sol: 'Once both are in the cycle, the gap between them shrinks by one step each iteration (fast moves 2, slow moves 1), so it must reach zero within one lap. That takes O(n) steps and O(1) memory.' },
        ] },
        { h: 'Doubly linked lists in practice', blocks: [
          `<p>Give each node a pointer to the previous node too, and you can remove any node you hold in O(1), without a search. Two uses you'll be asked about:</p>
           <ul><li><b>LRU cache:</b> a dict from key to node, plus a doubly linked list in recency order. Get and put are O(1). (Python's OrderedDict is this.)</li>
           <li><b>Orders at a price level:</b> time priority is the order of the list; a cancel finds the node through the order-id dict and unlinks it in O(1).</li></ul>
           <p>Sentinel nodes (a dummy head and tail) mean every real node has a neighbour on both sides, which removes all the "is this the first or last node?" branches.</p>`,
          { trap: 'Linked lists are slower than arrays for scanning, even though both are O(n): each node can be anywhere in memory, so every step risks a cache miss. Use one when you need O(1) removal from the middle, not by default.' },
        ] },
      ],
      takeaways: ['Draw the boxes and arrows; most linked-list bugs are lost references.', 'Reverse with prev, current, next in one pass.', 'A dummy head removes empty-list and first-node special cases.', 'Fast/slow pointers: the middle, cycle detection (Floyd), the n-th from the end.', 'Doubly linked + hash map = O(1) removal anywhere: LRU caches, order queues.'],
      explain: { q: 'Why is a doubly linked list plus a hash map the standard LRU cache?', a: 'The hash map finds a key\'s node in O(1). Because each node knows its neighbours, it can be unlinked and moved to the front in O(1), and the least recently used node is always at the back, ready to evict in O(1). A plain list would need an O(n) search or shift for some of these steps.' },
      homework: [
        { lvl: 'core', q: 'Merging the sorted lists 1 → 4 → 5 and 1 → 3 → 4 gives one sorted list. What is its fourth value?', a: 4, tol: { abs: 0.1 }, hint: 'The merged list is 1, 1, 3, 4, 4, 5.', sol: '<p>Merging takes the smaller head each time: 1, 1, 3, 4, 4, 5. The fourth value is <b>4</b>. O(m + n) time, O(1) extra memory (only pointers change).</p>' },
        { lvl: 'core', q: 'Removing the 2nd node from the end of 1 → 2 → 3 → 4 → 5 leaves which list? Give the value that was removed.', a: 4, tol: { abs: 0.1 }, hint: 'The 2nd from the end is 4.', sol: '<p>The 2nd node from the end is <b>4</b>, leaving 1 → 2 → 3 → 5. With a lead pointer 2 ahead, the trailing pointer stops at 3 and sets 3.next = 5.</p>' },
        { lvl: 'core', q: 'How many nodes does a list have if middle() returns the 6th node, using the "second middle" rule? Give the smallest possible length.', a: 10, tol: { abs: 0.1 }, hint: 'For length L, middle() returns node ⌊L/2⌋ + 1.', sol: '<p>middle() returns node ⌊L/2⌋ + 1 (counting from 1). ⌊L/2⌋ + 1 = 6 means ⌊L/2⌋ = 5, so L = 10 or 11. The smallest is <b>10</b>.</p>' },
        { lvl: 'core', q: 'A cycle starts at node 3 of a list. In O(1) memory, how do you find where the cycle starts?', sol: '<p><b>Floyd, second phase.</b> After slow and fast meet inside the cycle, move one pointer back to the head. Then advance both one step at a time; they meet exactly at the start of the cycle.</p><p>Why: if the cycle starts μ steps from the head and the meeting point is k steps into the cycle, μ + k is a multiple of the cycle length, so walking μ steps from the meeting point lands on the start, just as walking μ steps from the head does.</p>' },
        { lvl: 'interview', q: 'Check whether a singly linked list is a palindrome in O(n) time and O(1) extra memory.', sol: '<p>Find the middle with fast and slow pointers, reverse the second half in place, then compare the first half with the reversed second half node by node. Restore the second half afterwards if the caller still needs the list (an interviewer will ask). O(n) time, O(1) memory. The simpler O(n)-memory version copies values into a list and compares it with its reverse.</p>' },
        { lvl: 'interview', q: 'When would you choose a linked list over a Python list (dynamic array) in a trading system? Give one case each way.', sol: '<p><b>Linked list:</b> the queue of orders at a price level, where cancels remove orders from the middle; with an order-id map pointing at nodes, each cancel is O(1) unlink. An array would shift elements: O(n).</p><p><b>Array:</b> anything scanned or indexed, such as a price history or a ring buffer between threads. Contiguous memory is far faster to scan (cache lines, prefetching), and there\'s no allocation per element.</p>' },
        { lvl: 'stretch', q: 'Reverse a linked list in groups of k (1 → 2 → 3 → 4 → 5 with k = 2 becomes 2 → 1 → 4 → 3 → 5). Outline the pointer steps.', sol: '<p>Use a dummy node before the head and a pointer prev_group_end. Repeatedly: check there are k nodes ahead (if not, stop and leave them as they are); reverse those k nodes with the usual three-pointer loop; connect prev_group_end to the new first node of the group and the group\'s new last node (the old first) to the node after the group; move prev_group_end to that new last node. O(n) time, O(1) memory. Test with lengths that are and aren\'t multiples of k.</p>' },
      ],
      practice: [['LRU cache', '#/code/opt-lru'], ['Limit order book', '#/code/opt-order-book'], ['Design: LRU cache', '#/code/design/d-lru']],
    },
  });
})();
