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
        { lvl: 'interview', q: 'Describe how you\'d keep the maximum trade price over the last 60 seconds of a stream, with O(1) amortised work per trade.', sol: '<p><b>What makes this hard.</b> A running maximum can\'t be "un-added": when the biggest trade leaves the 60-second window you need the next biggest, and rescanning the window each time is O(window).</p><p><b>The key observation.</b> When a new trade at price p arrives, any older trade with a price ≤ p can <i>never</i> be the maximum again: the new trade is at least as big and will stay in the window longer. So throw those older trades away. What remains is a queue whose prices decrease from front to back, and the front is the current maximum.</p><pre class="sc-code">from collections import deque\n\nclass WindowMax:\n    def __init__(self, seconds):\n        self.seconds = seconds\n        # (time, price) pairs, prices decreasing\n        self.q = deque()\n\n    def add(self, t, price):\n        while self.q and self.q[-1][1] &lt;= price:\n            self.q.pop()      # dominated: never the max again\n        self.q.append((t, price))\n        while self.q[0][0] &lt;= t - self.seconds:\n            self.q.popleft()  # too old: out of the window\n\n    def max(self):\n        return self.q[0][1]</pre><p><b>Worked example</b> (60-second window). Trades at t = 0 (price 101), t = 10 (99), t = 20 (100), t = 70 (98):</p><table class="hb-table"><tr><th>Trade</th><th>Queue afterwards</th><th>Maximum</th></tr><tr><td>t=0, 101</td><td>(0, 101)</td><td>101</td></tr><tr><td>t=10, 99</td><td>(0, 101), (10, 99)</td><td>101</td></tr><tr><td>t=20, 100</td><td>(0, 101), (20, 100): 99 is dominated</td><td>101</td></tr><tr><td>t=70, 98</td><td>(20, 100), (70, 98): 101 has expired</td><td>100</td></tr></table><p><b>Cost.</b> Each trade is appended once and removed at most once (either dominated from the back or expired from the front), so n trades cost O(n) in total: O(1) amortised each, even though one add can pop several entries. For a rolling minimum, keep prices increasing instead.</p>' },
        { lvl: 'interview', q: 'Find the length of the shortest substring of s containing all the characters of t (the "minimum window substring"). Outline the algorithm and its cost.', sol: '<p><b>The idea.</b> Use a window that grows on the right until it contains everything t needs, then shrinks from the left for as long as it still does. Every time it\'s valid, it\'s a candidate answer; the shortest one seen is the answer.</p><p><b>The detail that makes it fast.</b> Checking "does the window contain all of t?" by comparing whole counts each step would cost O(alphabet) per step. Instead keep <code>missing</code>, the number of characters still needed, and update it as characters enter and leave.</p><pre class="sc-code">from collections import Counter\n\ndef min_window(s, t):\n    need = Counter(t)\n    missing = len(t)        # characters of t not yet covered\n    best = (float("inf"), 0, 0)\n    left = 0\n    for right, ch in enumerate(s):\n        if need[ch] &gt; 0:\n            missing -= 1             # this character was still needed\n        need[ch] -= 1                # surplus characters go negative\n        while missing == 0:          # valid: try to shrink\n            best = min(best, (right - left + 1, left, right + 1))\n            need[s[left]] += 1\n            if need[s[left]] &gt; 0:\n                missing += 1   # removed a needed character\n            left += 1\n    return "" if best[0] == float("inf") else s[best[1]:best[2]]</pre><p><b>Example.</b> s = "ADOBECODEBANC", t = "ABC": the window first becomes valid at "ADOBEC", shrinks no further, grows to "ADOBECODEBA", shrinks to "CODEBA", and eventually reaches "BANC", length 4, the answer.</p><p><b>Cost.</b> right moves through s once and left only ever moves forward, so each character is added and removed at most once: O(len(s) + len(t)) time, O(alphabet) memory. Mention what happens when t has repeated letters (the counts handle it) and when no window exists (return "").</p>' },
        { lvl: 'stretch', q: 'Why does the deque in window_max hold values in decreasing order, and what would break if you popped only strictly smaller values?', sol: '<p><b>What the deque means.</b> At any moment it holds exactly the indices that could still be the maximum of some future window. An index i can only win in the future if no later index j has a value ≥ a[i], since j stays in every window i is in, for longer. So whenever a new value arrives, every smaller-or-equal value behind it is removed. What\'s left must decrease from front to back, and the front, the largest, is the current window\'s maximum.</p><p><b>Popping only strictly smaller values</b> (&lt; instead of ≤) keeps equal values in the deque. Take [5, 5, 5] with window 2:</p><table class="hb-table"><tr><th>Rule</th><th>Deque after each value</th></tr><tr><td>pop ≤</td><td>[0] → [1] → [2]</td></tr><tr><td>pop &lt;</td><td>[0] → [0, 1] → [1, 2] (index 0 expires)</td></tr></table><p>Both give the right maxima: with &lt;, the earliest of the equal values sits at the front and expires first, and the next equal value takes over. Both are O(n), because every index is still pushed and popped once. The difference is only the deque\'s size: with many repeated prices, ≤ keeps it smaller, so it\'s the tidier choice.</p><p><b>What would actually break</b> it: forgetting to expire the front (the maximum could be outside the window), or storing values instead of indices (you then can\'t tell when the front has left the window).</p>' },
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
        { lvl: 'interview', q: 'You receive a stream of (order id, event) messages: new, fill, cancel. Which data structures give O(1) handling of each, and what does each one store?', sol: '<p><b>Start from the operations.</b> Fills and cancels arrive with only an order id, so you need to go from an id to its order instantly: a <b>hash map from order id to the order record</b>. That one dict already makes all three events O(1) on average:</p><pre class="sc-code">orders = {}                      # order id -&gt; {"side", "price", "qty"}\n\ndef on_new(oid, side, price, qty):\n    orders[oid] = {"side": side, "price": price, "qty": qty}\n\ndef on_fill(oid, qty):\n    order = orders[oid]\n    order["qty"] -= qty\n    if order["qty"] == 0:\n        del orders[oid]          # fully filled: no longer live\n\ndef on_cancel(oid):\n    # Tolerate a cancel for an unknown or finished order.\n    orders.pop(oid, None)</pre><p><b>What a real book needs on top.</b> Matching and market data need orders grouped by price, in time order. Add, for each side, a <b>dict from price to a queue</b> of orders at that price (a deque, or a doubly linked list so a cancel can unlink from the middle in O(1)), and store in each order record a pointer to its node. For the best bid and offer, keep a heap (or sorted structure) of the prices that have orders.</p><p><b>What interviewers listen for:</b> that you thought about bad input (a fill or cancel for an id you don\'t know, a fill larger than the remaining size), and that you can state the cost of each event. The limit order book problem in Coding builds the full version.</p>' },
        { lvl: 'interview', q: 'An attacker sends keys chosen so they all collide in your hash map. What happens to performance, and how do real languages defend against it?', sol: '<p><b>Why a hash map is normally fast.</b> It turns a key into a slot number with a hash function, and keys with different hashes land in different slots, so a lookup touches one slot. That\'s O(1) <i>on average</i>, assuming the keys spread out.</p><p><b>The attack.</b> If an attacker can predict your hash function, they can choose thousands of keys that all hash to the same slot. Now every insert and lookup has to compare against all the colliding keys already there: O(n) per operation, so inserting n keys costs O(n²). A web server parsing 50,000 crafted form fields can spend minutes on one request: a <b>hash-flooding</b> denial of service.</p><p><b>Defences.</b></p><ul><li><b>Randomise the hash.</b> Python mixes a secret random seed into string and bytes hashes, chosen when the interpreter starts (that\'s why <code>hash("abc")</code> differs between runs). Without the seed, the attacker can\'t compute colliding keys. Most modern languages do the same.</li><li><b>Bound the damage.</b> Java\'s HashMap turns a long chain into a balanced tree, so even a full collision costs O(log n), not O(n).</li><li><b>Limit the input:</b> cap the number of keys or fields a request may contain.</li></ul>' },
        { lvl: 'stretch', q: 'Design an O(1) "insert, delete, get a random element" set.', sol: '<p><b>Why neither structure works alone.</b> A list gives a random element in O(1) (pick a random index) but deleting from the middle shifts everything after it: O(n). A set deletes in O(1), but you can\'t pick a random element without walking through it.</p><p><b>Use both:</b> a list of the elements, and a dict from each element to its position in the list. The trick for deleting is <b>swap with the last element</b>: move the last element into the hole, then pop the end, which is O(1).</p><pre class="sc-code">import random\n\nclass RandomSet:\n    def __init__(self):\n        self.items = []\n        self.pos = {}                    # element -&gt; index in items\n\n    def insert(self, x):\n        if x in self.pos:\n            return False\n        self.pos[x] = len(self.items)\n        self.items.append(x)\n        return True\n\n    def remove(self, x):\n        if x not in self.pos:\n            return False\n        i, last = self.pos[x], self.items[-1]\n        self.items[i] = last      # move the last into the hole\n        self.pos[last] = i\n        self.items.pop()\n        del self.pos[x]\n        return True\n\n    def get_random(self):\n        return random.choice(self.items)</pre><p><b>Example.</b> items = [a, b, c, d]; remove(b): d moves into index 1, giving [a, d, c], and pos[d] becomes 1. Note the order of the updates: it also works when x is itself the last element (it is "moved" onto itself, then popped). Every operation is O(1) on average, and each element is equally likely to be returned.</p>' },
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
        { lvl: 'interview', q: 'Design a stack that also returns its minimum in O(1).', sol: '<p><b>Why it\'s not obvious.</b> Keeping a single variable "current minimum" works for pushes, but breaks on pop: if you pop the minimum, what\'s the new one? You\'d have to rescan the stack.</p><p><b>The idea.</b> A stack only ever changes at the top, so the minimum <i>below any point</i> never changes while that point is in the stack. Record, next to every element, the minimum of the stack at the moment it was pushed. Popping then restores the previous minimum for free.</p><pre class="sc-code">class MinStack:\n    def __init__(self):\n        self.items = []      # (value, minimum of the stack up to here)\n\n    def push(self, x):\n        low = min(x, self.items[-1][1]) if self.items else x\n        self.items.append((x, low))\n\n    def pop(self):\n        return self.items.pop()[0]\n\n    def top(self):\n        return self.items[-1][0]\n\n    def get_min(self):\n        return self.items[-1][1]</pre><p><b>Trace.</b> push 5, push 3, push 7: the pairs are (5, 5), (3, 3), (7, 3), so get_min() = 3. pop() removes 7 (min still 3); pop() removes 3, and the top pair (5, 5) says the minimum is 5 again.</p><p><b>Cost.</b> Every operation O(1), with O(n) extra memory. A common variant keeps a separate stack of minimums and pushes to it only when x ≤ the current minimum, which saves memory when the minimum rarely changes; the ≤ (not &lt;) matters, so duplicates of the minimum are popped correctly.</p>' },
        { lvl: 'interview', q: 'Prove that the two-stack queue has O(1) amortised cost per operation.', sol: '<p><b>Recall the design.</b> Push onto an in-stack. To pop, take from an out-stack; if the out-stack is empty, first move everything from the in-stack across, which reverses it so the oldest element is on top.</p><p><b>Why one pop can be expensive.</b> The pop that triggers a transfer of n elements costs O(n). So the worst case of a single operation is O(n).</p><p><b>Why it\'s cheap on average: follow one element.</b> Over its whole life, an element is</p><ol><li>pushed onto the in-stack once,</li><li>moved to the out-stack at most once (it never goes back), and</li><li>popped from the out-stack at most once.</li></ol><p>That\'s at most 3 basic stack operations per element, however pushes and pops are interleaved. So any sequence of n queue operations does at most 3n stack operations in total: O(n), which is <b>O(1) amortised</b> per operation. The expensive transfers are "paid for" by the cheap pushes that put those elements there.</p><p><b>Worth saying.</b> Amortised O(1) is a statement about totals. If a latency-sensitive system can\'t tolerate the occasional O(n) pop, use a structure with O(1) worst case instead, such as collections.deque or a ring buffer.</p>' },
        { lvl: 'stretch', q: 'Find, for each price, the previous price strictly greater than it (or −1), in O(n). How does this relate to the stock span?', sol: '<p><b>The idea.</b> Scan left to right keeping a stack of candidates: earlier prices that might still be "the previous greater" for something to come. When a new price arrives, every candidate that is ≤ it is useless from now on, because the new price is both larger and closer to anything later. Pop those; whatever is left on top is the previous strictly greater price. Then push the new price as a candidate.</p><pre class="sc-code">def previous_greater(prices):\n    out, stack = [], []    # indices, prices decreasing\n    for i, p in enumerate(prices):\n        while stack and prices[stack[-1]] &lt;= p:\n            stack.pop()\n        out.append(prices[stack[-1]] if stack else -1)\n        stack.append(i)\n    return out\n\n\ndef stock_span(prices):\n    """Days in a row, ending today, with price &lt;= today\'s."""\n    out, stack = [], []\n    for i, p in enumerate(prices):\n        while stack and prices[stack[-1]] &lt;= p:\n            stack.pop()\n        out.append(i - stack[-1] if stack else i + 1)\n        stack.append(i)\n    return out</pre><p><b>Trace</b> on [100, 80, 60, 70, 60, 75, 85]: previous greater is −1, 100, 80, 80, 70, 80, 100, and the spans are 1, 1, 1, 2, 1, 4, 6. At 75, for example, the stack holds 100, 80, 70, 60; 60 and 70 are popped, and 80 (index 1) remains, so the span is 5 − 1 = 4.</p><p><b>The connection.</b> The stock span is the distance back to the previous greater price: the same stack, recording i minus that index instead of its price. <b>Cost:</b> each index is pushed once and popped at most once, so O(n) overall.</p>' },
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
        { lvl: 'core', q: 'A cycle starts at node 3 of a list. In O(1) memory, how do you find where the cycle starts?', sol: '<p><b>Phase 1 (detect).</b> Move slow one step and fast two steps at a time. If there\'s a cycle, fast catches up with slow inside it.</p><p><b>Phase 2 (find the start).</b> Put one pointer back at the head, leave the other at the meeting point, and move both <i>one</i> step at a time. They meet exactly at the first node of the cycle.</p><pre class="sc-code">def cycle_start(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n        if slow is fast:\n            break\n    else:\n        return None                  # fast fell off the end: no cycle\n    slow = head\n    while slow is not fast:\n        slow, fast = slow.next, fast.next\n    return slow</pre><p><b>Why phase 2 works.</b> Say the cycle starts μ steps from the head, has length L, and the pointers meet k steps into the cycle. At that point slow has walked μ + k steps and fast twice as far, 2(μ + k). Fast\'s extra μ + k steps were whole laps of the cycle, so μ + k is a multiple of L. Now walk μ steps from the meeting point: you end at position k + μ in the cycle, a whole number of laps, which is the start. Walking μ steps from the head also lands on the start. Both pointers get there after exactly μ steps, so that\'s where they meet.</p><p><b>Cost.</b> O(n) time and O(1) memory, against O(n) memory for the simple alternative (a set of visited nodes).</p>' },
        { lvl: 'interview', q: 'Check whether a singly linked list is a palindrome in O(n) time and O(1) extra memory.', sol: '<p><b>The easy version first.</b> Copy the values into a Python list and compare it with its reverse: O(n) time, but O(n) extra memory. Say it, then improve.</p><p><b>O(1) memory in three steps.</b></p><ol><li><b>Find the middle</b> with slow and fast pointers: when fast reaches the end, slow is halfway.</li><li><b>Reverse the second half</b> in place, with the usual three-pointer reversal.</li><li><b>Compare</b> the first half with the reversed second half, node by node.</li></ol><pre class="sc-code">def is_palindrome(head):\n    slow = fast = head\n    while fast and fast.next:            # 1. find the middle\n        slow, fast = slow.next, fast.next.next\n    prev, node = None, slow              # 2. reverse from the middle\n    while node:\n        node.next, prev, node = prev, node, node.next\n    left, right, ok = head, prev, True   # 3. compare the halves\n    while right:\n        if left.val != right.val:\n            ok = False\n            break\n        left, right = left.next, right.next\n    return ok</pre><p><b>Example.</b> 1 → 2 → 2 → 1: the middle is the second 2; the second half reversed is 1 → 2; comparing 1 = 1 and 2 = 2 gives True. For odd lengths (1 → 2 → 1) the middle node ends up in the reversed half, and the comparison simply stops when that half runs out.</p><p><b>What the interviewer will ask next:</b> "you\'ve changed my list". Reverse the second half again before returning, to restore it. O(n) time, O(1) memory.</p>' },
        { lvl: 'interview', q: 'When would you choose a linked list over a Python list (dynamic array) in a trading system? Give one case each way.', sol: '<p><b>Choose a linked list when you remove from the middle and already know where.</b> The queue of orders at one price level is the classic case. Orders join at the back and fill from the front, but a cancel can hit any order. If a dict maps each order id to its node in a doubly linked list, a cancel is an O(1) unlink: point the neighbours at each other. In an array, removing from the middle shifts everything behind it: O(n) per cancel, on a hot path.</p><p><b>Choose an array for anything you scan or index.</b> A price history, a buffer of recent ticks, a ring buffer passing messages between threads. Arrays store elements next to each other in memory, so the CPU reads them in whole cache lines and prefetches ahead; a linked list\'s nodes are scattered, so every step can be a cache miss, often 10 to 100 times slower to traverse. Arrays also avoid one allocation per element.</p><p><b>The general rule:</b> linked lists win only when you need O(1) insertion or removal at positions you hold a pointer to. For everything else, contiguous arrays are faster in practice, even when the big-O looks the same.</p>' },
        { lvl: 'stretch', q: 'Reverse a linked list in groups of k (1 → 2 → 3 → 4 → 5 with k = 2 becomes 2 → 1 → 4 → 3 → 5). Outline the pointer steps.', sol: '<p><b>The plan.</b> Work through the list one group of k at a time. For each group: check there are k nodes left; reverse those k nodes; stitch the reversed group back between what comes before and after it. A dummy node in front of the head means the first group needs no special case.</p><pre class="sc-code">class Node:\n    def __init__(self, val, next=None):\n        self.val, self.next = val, next\n\n\ndef reverse_groups(head, k):\n    dummy = Node(0, head)\n    before = dummy                     # node just before the group\n    while True:\n        last = before                  # 1. are there k nodes left?\n        for _ in range(k):\n            last = last.next\n            if last is None:\n                return dummy.next\n        after = last.next\n        prev, node = after, before.next    # 2. reverse the group\n        for _ in range(k):\n            node.next, prev, node = prev, node, node.next\n        first = before.next            # 3. stitch it in place\n        before.next = last\n        before = first</pre><p><b>Trace</b> with 1 → 2 → 3 → 4 → 5 and k = 2. Group 1: last = 2, after = 3; reversing 1, 2 with prev starting at 3 gives 2 → 1 → 3; dummy now points to 2, and the next group starts after 1. Group 2 gives 4 → 3 → 5. Group 3 has only one node, so it stays: 2 → 1 → 4 → 3 → 5.</p><p><b>The details that go wrong:</b> starting prev at <code>after</code> (so the group\'s new tail points onward, not to None), and remembering the group\'s old first node, which becomes the new "before". O(n) time, O(1) memory. Test lengths that are and aren\'t multiples of k, and k = 1.</p>' },
      ],
      practice: [['LRU cache', '#/code/opt-lru'], ['Limit order book', '#/code/opt-order-book'], ['Design: LRU cache', '#/code/design/d-lru']],
    },
  });
})();
