// Quant dev handbook, Part 3: trees, heaps and graphs.
// See devbook-content.js. Code listings ({ code, test }) are run by research/verify_internals.py.
(function () {
  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    'dsa-trees': {
      title: 'Trees and binary search trees', minutes: 50,
      why: 'Trees are where recursion becomes natural, and tree questions are a staple of every coding interview. Binary search trees are also the sorted maps behind order books in C++ and Java, so knowing what they cost, and when they go wrong, matters on the job.',
      goals: ['Traverse a tree depth-first (pre, in, post-order) and breadth-first (level order)', 'Solve tree problems by asking what each subtree must return', 'Search, insert and validate a binary search tree', 'Explain why balance matters, and what sorted maps cost'],
      prereq: ['dsa-stacks', 'dsa-complexity'],
      sections: [
        { h: 'Traversals', blocks: [
          `<p>A binary tree node has a value and up to two children. There are two ways to visit every node:</p>
           <ul><li><b>Depth-first</b>, usually recursive: <i>pre-order</i> (node, then children: copying a tree), <i>in-order</i> (left, node, right: sorted order in a BST), <i>post-order</i> (children, then node: anything that needs the children's answers first, like heights or sizes).</li>
           <li><b>Breadth-first</b> (level order), with a queue: process nodes level by level. Use it for "the nodes at each depth", "the right-side view", or the shortest number of steps.</li></ul>
           <p>Both visit each node once: O(n) time. Depth-first uses O(height) stack space, breadth-first O(width) queue space.</p>`,
          { code: `from collections import deque


class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right


def inorder(root):
    return inorder(root.left) + [root.val] + inorder(root.right) if root else []


def level_order(root):
    levels, q = [], deque([root] if root else [])
    while q:
        level = []
        for _ in range(len(q)):          # exactly the nodes of this level
            node = q.popleft()
            level.append(node.val)
            q.extend(c for c in (node.left, node.right) if c)
        levels.append(level)
    return levels`, test: 'traversals' },
          { q: 'A perfect binary tree has every level full. How many nodes does one with 4 levels have?', a: 15, tol: { abs: 0.1 }, hint: '1 + 2 + 4 + 8.', sol: '1 + 2 + 4 + 8 = 2⁴ − 1 = <b>15</b>. Half of the nodes in a perfect tree are leaves, which is why the bottom level dominates breadth-first memory.' },
        ] },
        { h: 'Thinking recursively: what does a subtree return?', blocks: [
          `<p>Most tree problems are solved by deciding what a recursive call on a subtree should return, then combining the two children's answers at each node. Height: 1 + max(left height, right height). Number of nodes: 1 + left + right. Path sum: does the left or right subtree have a path summing to target − node.val?</p>
           <p>When the answer for the whole tree isn't what the parent needs, return one thing and track another in an outer variable. The tree's <b>diameter</b> (longest path between any two nodes) is the classic: each call returns its height, while the best "left height + right height" is recorded on the side.</p>`,
          { code: `def max_depth(root):
    return 0 if root is None else 1 + max(max_depth(root.left), max_depth(root.right))


def diameter(root):
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        l, r = height(node.left), height(node.right)
        best = max(best, l + r)          # the longest path through this node, in edges
        return 1 + max(l, r)

    height(root)
    return best`, test: 'tree_recursion' },
          { worked: 'path sum', q: 'Is there a root-to-leaf path summing to 22 in the tree 5 → (4 → (11 → (7, 2))), (8 → (13, 4 → (1)))?', steps: [
            ['What should a call on a subtree answer?', 'Whether it has a root-to-leaf path summing to the remaining target.'],
            ['At the root (5), what is the remaining target for the children?', '22 − 5 = 17.'],
            ['Follow the left side: 4 leaves 13, then 11 leaves 2. Leaves 7 and 2?', 'The leaf 2 matches the remaining 2.'],
            'So yes: 5 → 4 → 11 → 2 = 22. Each node is visited at most once: O(n).',
          ] },
        ] },
        { h: 'Binary search trees', blocks: [
          `<p>In a BST, every value in a node's left subtree is smaller and every value in the right subtree is larger. Searching goes left or right at each step, like binary search, so it costs O(height). An in-order traversal visits the values in sorted order.</p>
           <p>The catch is the height. Inserting values in sorted order makes a chain: height n, and every operation becomes O(n). <b>Balanced</b> trees (red-black, AVL) rotate nodes as they go to keep the height O(log n). C++'s std::map and Java's TreeMap are red-black trees: O(log n) insert, delete and find, plus ordered iteration and "smallest key above x" queries, which is why they hold price levels in order books.</p>`,
          { code: `def insert(root, val):
    if root is None:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root


def is_bst(root, lo=float("-inf"), hi=float("inf")):
    """Every node must lie strictly between the bounds set by its ancestors."""
    if root is None:
        return True
    if not lo < root.val < hi:
        return False
    return is_bst(root.left, lo, root.val) and is_bst(root.right, root.val, hi)`, test: 'bst' },
          { q: 'You insert 1, 2, 3, 4, 5, 6, 7 in that order into an empty (unbalanced) BST. What is its height, counting nodes on the longest root-to-leaf path?', a: 7, tol: { abs: 0.1 }, hint: 'Each value goes to the right of the last.', sol: 'Every new value is larger than everything before, so each becomes the right child of the previous one: a chain of <b>7</b>. A balanced tree with 7 nodes has height 3. That\'s why real sorted maps rebalance.' },
          { id: 'x1', q: 'What is the diameter (edges on the longest path between any two nodes) of the tree 1 → (2 → (4, 5), 3)?', a: 3, tol: { abs: 0.1 }, hint: 'The path 4 → 2 → 1 → 3.', sol: 'The longest path runs 4 → 2 → 1 → 3 (or 5 → 2 → 1 → 3): <b>3</b> edges. At node 1 it combines left depth 2 and right depth 1, which is what diameter() computes at every node.' },
          { id: 'm1', q: 'Checking only that each node is greater than its left child and less than its right child is not enough to validate a BST. Why?', opts: [['A deeper node can break an ancestor\'s bound'], ['Leaves don\'t have children to compare', 'Leaves are trivially fine.'], ['It takes O(n²) time', 'It\'s O(n); the problem is correctness.'], ['BSTs can contain duplicate values', 'That\'s a separate design choice.']], sol: 'A node in the left subtree must be smaller than every ancestor it sits to the left of, not just its parent. Pass down (low, high) bounds, or check that an in-order traversal is strictly increasing.' },
        ] },
      ],
      takeaways: ['Depth-first (pre, in, post-order) by recursion; breadth-first (levels) with a queue. Both O(n).', 'Decide what each subtree returns; combine at the node; track a global best when needed (diameter).', 'BST search is O(height); in-order gives sorted order.', 'Unbalanced BSTs degrade to O(n); balanced ones (std::map, TreeMap) guarantee O(log n).', 'Validate a BST with bounds passed down, not parent-child comparisons.'],
      explain: { q: 'Why does an order book in C++ often use std::map for price levels, and what does Python use instead?', a: 'std::map is a balanced binary search tree: inserting or removing a price level is O(log n), and the best bid or offer is the first or last key, with ordered iteration for depth. Python has no built-in sorted map, so a Python book usually keeps a heap of prices with lazy deletion of emptied levels, a sorted list with bisect when levels are few, or the third-party sortedcontainers.' },
      homework: [
        { lvl: 'core', q: 'What is the maximum depth (nodes on the longest root-to-leaf path) of the tree 3 → (9, 20 → (15, 7))?', a: 3, tol: { abs: 0.1 }, hint: '3 → 20 → 15.', sol: '<p>max_depth = 1 + max(depth(9), depth(20)) = 1 + max(1, 2) = <b>3</b>, along 3 → 20 → 15 (or 7).</p>' },
        { lvl: 'core', q: 'You insert 5, 3, 8, 1, 4, 7, 9 into an empty BST. What is the third value of its in-order traversal?', a: 4, tol: { abs: 0.1 }, hint: 'In-order gives the values sorted.', sol: '<p>In-order traversal of a BST lists the values in sorted order: 1, 3, 4, 5, 7, 8, 9. The third is <b>4</b>.</p>' },
        { lvl: 'core', q: 'How many levels does level_order return for the tree 1 → (2 → (4, 5), 3 → (6))?', a: 3, tol: { abs: 0.1 }, hint: '[1], [2, 3], [4, 5, 6].', sol: '<p>The levels are [1], [2, 3] and [4, 5, 6]: <b>3</b>.</p>' },
        { lvl: 'core', q: 'In the BST built from 6, 2, 8, 0, 4, 7, 9, 3, 5, what is the lowest common ancestor of 3 and 5?', a: 4, tol: { abs: 0.1 }, hint: 'Walk down from the root while both values are on the same side.', sol: '<p>From the root 6, both 3 and 5 are smaller: go left to 2. Both are larger than 2: go right to 4. Now 3 &lt; 4 &lt; 5, so they split here: the LCA is <b>4</b>. O(height), using only the BST ordering.</p>' },
        { lvl: 'interview', q: 'Return the values visible from the right side of a binary tree (the last node of each level). Describe an O(n) approach.', sol: '<p><b>Restate it.</b> Looking at the tree from the right, you see one node per level: the rightmost. So the answer is "the last node of each level".</p><p><b>Approach 1: level by level (BFS).</b> Process the tree one level at a time with a queue; the last node you take from each level is visible.</p><pre class="sc-code">from collections import deque\n\ndef right_side(root):\n    if root is None:\n        return []\n    out, level = [], deque([root])\n    while level:\n        out.append(level[-1].val)          # rightmost on this level\n        for _ in range(len(level)):\n            node = level.popleft()\n            for child in (node.left, node.right):\n                if child:\n                    level.append(child)\n    return out</pre><p><b>Approach 2: depth first, right child first.</b> Visit right before left, and record a node whenever you reach a depth for the first time. Because you always go right first, the first node you meet at each depth is the rightmost one.</p><p><b>Example.</b> Root 1 with children 2 (left) and 3 (right), and 2 has a right child 5: the levels are [1], [2, 3], [5], so the answer is [1, 3, 5]. Note that 5 is visible although it\'s on the left side of the root: a level-by-level view gets this right, while "follow right pointers" doesn\'t.</p><p><b>Cost.</b> Both visit every node once: O(n) time. BFS holds a whole level, O(width) memory; DFS holds one path, O(height).</p>' },
        { lvl: 'interview', q: 'Serialise a binary tree to a string and back. What do you need to record so the tree is unambiguous?', sol: '<p><b>Why a plain traversal isn\'t enough.</b> The pre-order 1, 2 fits two different trees: 2 as the left child of 1, or as the right child. The order of values alone loses the shape.</p><p><b>Fix: record the missing children too.</b> Write a marker such as # wherever a child is None. Then every node\'s position is pinned down.</p><pre class="sc-code">class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val, self.left, self.right = val, left, right\n\n\ndef serialise(root):\n    out = []\n    def walk(node):\n        if node is None:\n            out.append("#")\n            return\n        out.append(str(node.val))\n        walk(node.left)\n        walk(node.right)\n    walk(root)\n    return ",".join(out)\n\n\ndef deserialise(text):\n    tokens = iter(text.split(","))\n    def build():\n        tok = next(tokens)\n        if tok == "#":\n            return None\n        node = TreeNode(int(tok))\n        node.left = build()\n        node.right = build()\n        return node\n    return build()</pre><p><b>Example.</b> Root 1 with left child 2 and right child 3, where 3 has children 4 and 5, becomes "1,2,#,#,3,4,#,#,5,#,#". Reading it back follows the same pre-order: 1, then its left subtree (2 with two empty children), then its right subtree (3, and so on). It works because each subtree\'s tokens are a contiguous run that the recursive reader consumes exactly.</p><p><b>Cost.</b> O(n) both ways. LeetCode\'s format (level order with null markers) works too. For very deep trees, use an explicit stack instead of recursion.</p>' },
        { lvl: 'stretch', q: 'Find the k-th smallest value in a BST in O(height + k) time.', sol: '<p><b>The idea.</b> An in-order traversal of a BST visits values in increasing order. So the k-th value visited is the k-th smallest: traverse in order and stop after k nodes, instead of visiting the whole tree.</p><p><b>Iterative in-order</b> lets you stop early. Keep a stack of the path still to visit: go as far left as possible pushing nodes, then pop a node (that\'s the next smallest), and continue from its right child.</p><pre class="sc-code">def kth_smallest(root, k):\n    stack, node = [], root\n    while True:\n        while node:                      # go as far left as possible\n            stack.append(node)\n            node = node.left\n        node = stack.pop()               # the next smallest value\n        k -= 1\n        if k == 0:\n            return node.val\n        node = node.right</pre><p><b>Why O(height + k).</b> Before returning the first value, the loop walks down one path: O(height). After that, each value it returns costs O(1) amortised (every node is pushed and popped once), and it stops after k of them.</p><p><b>If the tree changes often and you ask for many different k</b>, store in each node the size of its subtree. Then at each node: if the left subtree has ≥ k nodes, go left; if it has exactly k − 1, this node is the answer; otherwise subtract left size + 1 from k and go right. That\'s O(height) per query, at the cost of updating sizes on every insert and delete.</p>' },
      ],
      practice: [['Tree from pairs, or the right error', '#/code/opt-tree-errors'], ['Coding problems', '#/code']],
    },

    'dsa-heaps': {
      title: 'Heaps and priority queues', minutes: 45,
      why: 'A heap answers "what is the smallest (or largest) right now?" in O(1), with O(log n) updates. That covers best bid and offer, the next timer to fire, top-k by volume, merging sorted feeds and running medians: some of the most common questions in trading-firm interviews.',
      goals: ['Explain how a binary heap is stored and why push and pop are O(log n)', 'Find the top k items in O(n log k)', 'Merge k sorted streams with a heap', 'Keep a running median with two heaps, and delete lazily'],
      prereq: ['dsa-trees', 'dsa-python'],
      sections: [
        { h: 'How a heap works', blocks: [
          `<p>A binary heap is a complete binary tree stored in an array: the children of index i are 2i + 1 and 2i + 2, and every parent is ≤ its children (a min-heap). The smallest item is always at index 0.</p>
           <ul><li><b>Push:</b> append at the end, then "sift up", swapping with the parent while smaller: O(log n), as the tree has log n levels.</li>
           <li><b>Pop:</b> take the root, move the last item to the root, then "sift down", swapping with the smaller child: O(log n).</li>
           <li><b>Heapify</b> an array in place: O(n), surprisingly, because most nodes are near the bottom and move only a little.</li></ul>
           <p>Python's heapq is a min-heap on a plain list. For a max-heap, push negated keys. For ties, push (priority, counter, item) tuples.</p>`,
          { q: 'In a heap stored in an array (starting at index 0), what is the index of the left child of index 3?', a: 7, tol: { abs: 0.1 }, hint: '2i + 1.', sol: '2 × 3 + 1 = <b>7</b> (and the right child is 8). The parent of index i is (i − 1) // 2. No pointers needed: the shape is implied by the array.' },
        ] },
        { h: 'Top k', blocks: [
          `<p>The k largest of n items: sorting costs O(n log n). Better, keep a <b>min-heap of size k</b> holding the best k so far; for each new item, if it beats the smallest of those (the heap's root), replace the root. O(n log k), and only O(k) memory, so it works on a stream that doesn't fit in memory: "the 10 largest trades today".</p>`,
          { code: `import heapq


def k_largest(stream, k):
    heap = []                        # the k largest so far; smallest at heap[0]
    for x in stream:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)   # pop the smallest, push x: one O(log k) step
    return sorted(heap, reverse=True)


def merge_sorted_streams(streams):
    """Merge k sorted lists into one sorted list in O(n log k)."""
    heap = [(s[0], i, 0) for i, s in enumerate(streams) if s]
    heapq.heapify(heap)
    out = []
    while heap:
        val, i, j = heapq.heappop(heap)
        out.append(val)
        if j + 1 < len(streams[i]):
            heapq.heappush(heap, (streams[i][j + 1], i, j + 1))
    return out`, test: 'heap_topk' },
          { q: 'What is the 2nd largest value in [3, 2, 1, 5, 6, 4]?', a: 5, tol: { abs: 0.1 }, hint: 'Keep a min-heap of the 2 largest.', sol: 'The heap of size 2 ends holding {5, 6}; its root, the 2nd largest, is <b>5</b>.' },
          { market: 'Merging sorted streams is how you combine time-ordered feeds from several exchanges into one sequence: a heap keyed by the next timestamp of each feed, O(log k) per message.' },
        ] },
        { h: 'Two heaps: the running median', blocks: [
          `<p>To report the median of a stream after each new value, keep the smaller half in a max-heap and the larger half in a min-heap, with sizes differing by at most one. Each insert goes into one heap and moves at most one item across to rebalance: O(log n). The median is the top of the bigger heap, or the average of both tops.</p>`,
          { code: `import heapq


class RunningMedian:
    def __init__(self):
        self.low, self.high = [], []     # max-heap (negated) and min-heap

    def add(self, x):
        heapq.heappush(self.low, -x)
        heapq.heappush(self.high, -heapq.heappop(self.low))   # largest of low -> high
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def median(self):
        if len(self.low) > len(self.high):
            return -self.low[0]
        return (-self.low[0] + self.high[0]) / 2`, test: 'running_median' },
          { q: 'After adding 5, 15, 1 and 3 to a running median, what is the median?', a: 4, tol: { abs: 0.01 }, hint: 'Sorted: 1, 3, 5, 15.', sol: 'The low half is {1, 3} and the high half {5, 15}. The median is the average of 3 and 5: <b>4</b>.' },
          { trap: 'heapq can\'t delete an arbitrary item or change a priority. Use lazy deletion: mark an entry as stale (keep the live entries in a dict) and discard stale entries when they reach the top. That\'s how a heap of price levels handles emptied levels in an order book.' },
          { id: 'm1', q: 'For "the top 10 of a stream of a billion trades by size", why use a min-heap of size 10 rather than a max-heap of everything?', opts: [['Memory stays at 10 items'], ['Max-heaps are slower per operation', 'Both are O(log n) per operation.'], ['heapq has no max-heap at all', 'Negating keys gives one.'], ['A min-heap keeps the stream sorted', 'It only keeps its minimum at the top.']], sol: 'The size-10 min-heap holds only the current top 10 and evicts the smallest of them when something bigger arrives: O(n log 10) time and O(10) memory. A heap of everything needs a billion entries.' },
        ] },
      ],
      takeaways: ['A heap is an array with children at 2i + 1 and 2i + 2; min at index 0.', 'Push and pop O(log n), peek O(1), heapify O(n).', 'Top k: a min-heap of size k, O(n log k) time, O(k) memory.', 'Merge k sorted streams: a heap of each stream\'s next item.', 'Running median: two heaps balanced in size.', 'No delete in heapq: lazy deletion.'],
      explain: { q: 'Why is building a heap from n items with heapify O(n), when pushing them one at a time is O(n log n)?', a: 'Heapify sifts down from the bottom up. Half the nodes are leaves and don\'t move, a quarter move at most one level, an eighth at most two, and so on. The total work is n × (1/4 + 2/8 + 3/16 + …), which sums to less than n. Pushing one at a time can sift each item up the full height, log n, for the later items.' },
      homework: [
        { lvl: 'core', q: 'In an array-stored heap, what is the index of the parent of index 10?', a: 4, tol: { abs: 0.1 }, hint: '(i − 1) // 2.', sol: '<p>(10 − 1) // 2 = 9 // 2 = <b>4</b>. Check: the children of 4 are 9 and 10.</p>' },
        { lvl: 'core', q: 'Push 7, 2, 9, 4 onto an empty min-heap, then pop twice. What is the second value popped?', a: 4, tol: { abs: 0.1 }, hint: 'Pops come out in increasing order.', sol: '<p>A min-heap pops in increasing order: 2, then <b>4</b> (then 7, 9).</p>' },
        { lvl: 'core', q: 'Merging the sorted lists [1, 4, 7], [2, 5, 8] and [3, 6, 9] with a heap, what is the 5th value output?', a: 5, tol: { abs: 0.1 }, hint: 'The output is 1 to 9 in order.', sol: '<p>The merged output is 1, 2, …, 9, so the 5th is <b>5</b>. The heap never holds more than 3 entries (one per list).</p>' },
        { lvl: 'core', q: 'What is the running median after adding 2, 3, 4 (in that order)?', a: 3, tol: { abs: 0.01 }, hint: 'Three values: the middle one.', sol: '<p>The low heap holds {2, 3} and the high heap {4}; the low heap is bigger, so the median is its top: <b>3</b>.</p>' },
        { lvl: 'interview', q: 'Schedule tasks on k machines, each task going to whichever machine frees up first. Which data structure, and what does each operation cost?', sol: '<p><b>What you need each time.</b> "Which machine becomes free first?" is a repeated <i>minimum</i> query over values that keep changing: exactly what a min-heap is for.</p><pre class="sc-code">import heapq\n\ndef schedule(durations, k):\n    """Run tasks in order on k machines; return each task\'s\n    (machine, start time)."""\n    free = [(0, m) for m in range(k)]    # (free from, machine)\n    heapq.heapify(free)\n    out = []\n    for d in durations:\n        t, m = heapq.heappop(free)       # the earliest-free machine\n        out.append((m, t))\n        heapq.heappush(free, (t + d, m))\n    return out</pre><p><b>Trace</b> with k = 2 and durations 3, 2, 4: task 0 goes to machine 0 at t = 0 (free at 3); task 1 to machine 1 at t = 0 (free at 2); task 2 to machine 1 at t = 2, the earliest free.</p><p><b>Cost.</b> Each task is one pop and one push on a heap of k entries: O(log k). Building the heap is O(k), so n tasks take O(k + n log k). Including the machine id in the tuple makes ties deterministic (the lowest id wins). The same pattern, "always handle the next event in time", drives timers and event-driven simulators.</p>' },
        { lvl: 'interview', q: 'An order book keeps a heap of bid prices. A price level empties when its last order is cancelled. How do you keep best_bid() correct without deleting from the middle of the heap?', sol: '<p><b>The problem.</b> A heap gives the best price in O(1), but it can\'t delete an arbitrary entry efficiently: Python\'s heapq has no "remove this price", and searching for it is O(n).</p><p><b>Lazy deletion:</b> don\'t remove the empty level from the heap at all. Keep the real state in a dict of live levels (price → orders at that price). Only when you <i>look at</i> the top of the heap, check it against the dict, and throw away tops that are no longer live.</p><pre class="sc-code">import heapq\n\nclass Bids:\n    def __init__(self):\n        self.heap = []                   # -price, so the max is on top\n        self.size = {}                   # live price -&gt; total quantity\n\n    def add(self, price, qty):\n        if price not in self.size:\n            heapq.heappush(self.heap, -price)\n            self.size[price] = 0\n        self.size[price] += qty\n\n    def remove(self, price, qty):\n        self.size[price] -= qty\n        if self.size[price] == 0:\n            del self.size[price]         # the heap entry is now stale\n\n    def best(self):\n        while self.heap and -self.heap[0] not in self.size:\n            heapq.heappop(self.heap)     # discard stale tops\n        return -self.heap[0] if self.heap else None</pre><p><b>Example.</b> Bids at 100 and 101; the 101 level is cancelled. best() sees 101 on top, finds it isn\'t live, pops it, and returns 100. If 101 is bid again later, add() pushes it again because it isn\'t live; a duplicate entry is harmless, since best() checks the dict anyway.</p><p><b>Cost.</b> Every price pushed is popped at most once, so the clean-up work is paid for by the pushes: O(log n) amortised per operation.</p>' },
        { lvl: 'stretch', q: 'Find the k-th smallest sum of pairs (a[i] + b[j]) from two sorted arrays without generating all pairs.', sol: '<p><b>Picture the sums as a grid.</b> Row i holds a[i] + b[0], a[i] + b[1], …, and because b is sorted, each row is sorted. Because a is sorted too, the smallest sum overall is a[0] + b[0]. Finding the k-th smallest is then "merge sorted rows and stop after k items": the k-way merge with a heap.</p><pre class="sc-code">import heapq\n\ndef kth_smallest_pair_sum(a, b, k):\n    heap = [(a[i] + b[0], i, 0) for i in range(min(k, len(a)))]\n    heapq.heapify(heap)\n    for _ in range(k - 1):\n        _, i, j = heapq.heappop(heap)\n        if j + 1 &lt; len(b):\n            heapq.heappush(heap, (a[i] + b[j + 1], i, j + 1))\n    return heap[0][0]</pre><p><b>How it works.</b> The heap holds the next unused sum from each row. Popping gives the smallest remaining sum overall; replacing it with the next sum from the same row keeps the heap correct. After k − 1 pops, the top is the k-th smallest. Only the first k rows can matter (row k has k smaller sums above it in column 0), so the heap never holds more than k entries.</p><p><b>Example.</b> a = [1, 7, 11], b = [2, 4, 6]: the sums in order are 3, 5, 7, 9, 11, …; for k = 3 the answer is 7.</p><p><b>Cost.</b> O(k log k), without ever building all len(a) × len(b) sums.</p>' },
      ],
      practice: [['Heaviest in the tent', '#/code/opt-pumpkins'], ['Busiest service in the last hour', '#/code/opt-log-window'], ['Limit order book', '#/code/opt-order-book']],
    },

    'dsa-graphs': {
      title: 'Graphs: BFS, DFS and shortest paths', minutes: 55,
      why: 'Grids, dependencies, networks of exchanges and routes between currencies are all graphs, and a handful of algorithms solve nearly every graph question: breadth-first search for fewest steps, depth-first search for connectivity and cycles, topological order for dependencies, union-find for merging groups, and Dijkstra for weighted shortest paths.',
      goals: ['Represent a graph as an adjacency list, and treat a grid as a graph', 'Use BFS for shortest paths in steps and DFS for components and cycles', 'Order tasks with dependencies (topological sort)', 'Merge groups with union-find, and find weighted shortest paths with Dijkstra'],
      prereq: ['dsa-heaps', 'dsa-hashing'],
      sections: [
        { h: 'Representing a graph', blocks: [
          `<p>A graph is nodes and edges. Store it as an <b>adjacency list</b>: a dict from each node to its neighbours (with weights if needed). It uses O(V + E) memory, and visiting all neighbours of a node costs its degree. An adjacency matrix (V × V) only pays off for dense graphs.</p>
           <p>A grid is a graph in disguise: each cell is a node, and its neighbours are the cells up, down, left and right (check the bounds). "Number of islands", "shortest path through a maze" and "rotting oranges" are all graph searches on grids.</p>`,
          { code: `def count_islands(grid):
    """Number of 4-connected groups of "1" cells, by depth-first search."""
    rows, cols, seen, count = len(grid), len(grid[0]), set(), 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1
                stack = [(r, c)]
                seen.add((r, c))
                while stack:                     # an explicit stack: no recursion limit
                    i, j = stack.pop()
                    for ni, nj in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                        if 0 <= ni < rows and 0 <= nj < cols and grid[ni][nj] == "1" and (ni, nj) not in seen:
                            seen.add((ni, nj))
                            stack.append((ni, nj))
    return count`, test: 'islands' },
          { q: 'How many islands (4-connected groups of 1s) are in the grid with rows 11000, 11000, 00100, 00011?', a: 3, tol: { abs: 0.1 }, hint: 'Top-left block, the middle cell, the bottom-right pair.', sol: 'The 2×2 block at the top left, the single cell in the middle, and the pair at the bottom right: <b>3</b>. Each cell is visited once: O(rows × cols).' },
        ] },
        { h: 'BFS and DFS', blocks: [
          `<p><b>Breadth-first search</b> explores in rings: all nodes 1 step away, then 2, and so on, using a queue. So the first time it reaches a node is by a shortest path (in number of edges). Use it for fewest moves, fewest hops or minimum steps.</p>
           <p><b>Depth-first search</b> follows one path as far as it goes, then backtracks, using recursion or a stack. Use it for "is everything connected?", counting components, finding cycles, and exploring all paths (backtracking). Both are O(V + E). Mark nodes as visited when you add them to the queue or stack, not when you pop them, or nodes get added many times.</p>`,
          { code: `from collections import deque


def bfs_steps(graph, start, goal):
    """Fewest edges from start to goal in an unweighted graph (dict of neighbour lists), or -1."""
    dist = {start: 0}
    q = deque([start])
    while q:
        node = q.popleft()
        if node == goal:
            return dist[node]
        for nb in graph.get(node, ()):
            if nb not in dist:               # mark when queued
                dist[nb] = dist[node] + 1
                q.append(nb)
    return -1`, test: 'bfs' },
          { q: 'In the graph A–B, A–C, B–D, C–D, D–E (undirected), how many edges are on the shortest path from A to E?', a: 3, tol: { abs: 0.1 }, hint: 'A → B → D → E.', sol: 'BFS reaches B and C at distance 1, D at 2 and E at <b>3</b> (A → B → D → E).' },
        ] },
        { h: 'Dependencies: topological sort', blocks: [
          `<p>Tasks with prerequisites form a directed graph; a valid order exists exactly when it has no cycle. <b>Kahn's algorithm</b>: count each node's incoming edges; put every node with none in a queue; repeatedly take one, output it, and decrease the count of its successors, queueing any that reach zero. If some nodes never reach zero, there's a cycle. O(V + E). Build systems, spreadsheet recalculation and "can I finish all courses?" all use it.</p>`,
          { code: `from collections import deque


def topo_order(n, edges):
    """Order nodes 0..n-1 so every edge (a, b) has a before b; None if there is a cycle."""
    succ, indeg = [[] for _ in range(n)], [0] * n
    for a, b in edges:
        succ[a].append(b)
        indeg[b] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        a = q.popleft()
        order.append(a)
        for b in succ[a]:
            indeg[b] -= 1
            if indeg[b] == 0:
                q.append(b)
    return order if len(order) == n else None`, test: 'topo' },
          { id: 'm1', q: 'Kahn\'s algorithm outputs fewer nodes than the graph has. What does that tell you?', opts: [['The graph has a cycle'], ['The graph is disconnected', 'Disconnected graphs sort fine.'], ['Some node has no edges', 'Isolated nodes have in-degree 0 and are output.'], ['The edges were given in the wrong order', 'Input order doesn\'t matter.']], sol: 'Nodes on a cycle always keep at least one incoming edge from another cycle node, so their count never reaches zero and they are never output.' },
        ] },
        { h: 'Union-find and Dijkstra', blocks: [
          `<p><b>Union-find</b> (disjoint sets) tracks which items are in the same group as edges arrive: find(x) returns a group's representative, union(a, b) merges two groups. With path compression and union by size, each operation is almost O(1). Use it for "how many connected groups after these links?" and for detecting a cycle as edges are added.</p>
           <p><b>Dijkstra</b> finds shortest paths with non-negative weights: a min-heap of (distance so far, node); pop the closest unfinished node, and relax its edges. O((V + E) log V). Negative weights break it (use Bellman–Ford); with all weights equal, plain BFS is simpler.</p>`,
          { code: `import heapq


def dijkstra(graph, src):
    """graph: {node: [(neighbour, weight), ...]} with weights >= 0. Distances from src."""
    dist = {src: 0}
    heap = [(0, src)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist.get(node, float("inf")):
            continue                         # a stale heap entry
        for nb, w in graph.get(node, ()):
            nd = d + w
            if nd < dist.get(nb, float("inf")):
                dist[nb] = nd
                heapq.heappush(heap, (nd, nb))
    return dist


class UnionFind:
    def __init__(self, n):
        self.parent, self.size = list(range(n)), [1] * n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                     # already joined: this edge closes a cycle
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True`, test: 'dijkstra_uf' },
          { q: 'Edges (undirected, weighted): A–B 4, A–C 1, C–B 2, B–D 1, C–D 5. What is the shortest distance from A to D?', a: 4, tol: { abs: 0.1 }, hint: 'A → C → B → D.', sol: 'A → C (1) → B (3) → D (4) beats A → B → D (5) and A → C → D (6). The answer is <b>4</b>.' },
          { market: 'Currency triangular arbitrage is a graph problem: with edge weights −ln(rate), a profitable cycle is a negative cycle, which Bellman–Ford detects (Dijkstra can\'t, because of the negative weights).' },
        ] },
      ],
      takeaways: ['Adjacency lists, O(V + E); grids are graphs with up to 4 neighbours per cell.', 'BFS (queue) gives fewest edges; DFS (stack or recursion) for components, cycles and all paths. Mark visited when queued.', 'Topological sort (Kahn) orders dependencies and detects cycles.', 'Union-find merges groups in near O(1).', 'Dijkstra with a heap for non-negative weights; Bellman–Ford for negative ones.'],
      explain: { q: 'Why does BFS find shortest paths in an unweighted graph, and why doesn\'t it in a weighted one?', a: 'BFS explores nodes in order of their number of edges from the start: everything at distance 1 before anything at distance 2. So the first time a node is reached is by a path with the fewest edges. With weights, a path with more edges can be cheaper, so the order BFS discovers nodes in no longer matches their true distance. Dijkstra fixes this by always expanding the node with the smallest total weight so far, using a heap.' },
      homework: [
        { lvl: 'core', q: 'An undirected graph has 6 nodes and the edges 0–1, 1–2, 3–4. How many connected components does it have?', a: 3, tol: { abs: 0.1 }, hint: 'Node 5 is on its own.', sol: '<p>Components: {0, 1, 2}, {3, 4} and {5}: <b>3</b>. With union-find, start with 6 groups and subtract one for each successful union (3 here).</p>' },
        { lvl: 'core', q: 'Courses 0–3 with prerequisites 0 → 1, 0 → 2, 1 → 3, 2 → 3. Which course must come last in any valid order?', a: 3, tol: { abs: 0.1 }, hint: 'Which course depends on everything?', sol: '<p>Course 3 needs both 1 and 2, which need 0. Every valid order (0, 1, 2, 3 or 0, 2, 1, 3) ends with <b>3</b>.</p>' },
        { lvl: 'core', q: 'In a 3 × 3 grid with no walls, what is the fewest number of moves (up, down, left, right) from one corner to the opposite corner?', a: 4, tol: { abs: 0.1 }, hint: '2 rights and 2 downs.', sol: '<p>You need 2 moves across and 2 down, in any order: <b>4</b>. BFS on the grid finds it, and on a grid without walls it equals the Manhattan distance.</p>' },
        { lvl: 'core', q: 'Union-find on 5 items, applying union(0, 1), union(2, 3), union(1, 3), union(0, 2). How many of these unions return False (the two were already joined)?', a: 1, tol: { abs: 0.1 }, hint: 'After the third union, 0, 1, 2, 3 are one group.', sol: '<p>The first three unions each merge two groups. By then {0, 1, 2, 3} is one group, so union(0, 2) finds them already joined and returns False: <b>1</b>. In an undirected graph that\'s exactly a cycle-closing edge.</p>' },
        { lvl: 'interview', q: 'Currencies and exchange rates form a graph. How would you detect a sequence of trades that ends with more of the starting currency than you began with?', sol: '<p><b>Model it as a graph.</b> Each currency is a node; each exchange rate is a directed edge (1 USD buys 0.92 EUR, say). A sequence of trades that starts and ends in the same currency is a cycle, and you end with more money exactly when the <b>product</b> of the rates around it exceeds 1.</p><p><b>Turn products into sums.</b> Shortest-path algorithms add weights, so take logs: give each edge the weight −ln(rate). Then</p><div class="hb-eq">rate₁ × rate₂ × … &gt; 1 ⟺ ln rate₁ + ln rate₂ + … &gt; 0 ⟺ −ln rate₁ − ln rate₂ − … &lt; 0</div><p>so a profitable loop is a <b>negative cycle</b>.</p><p><b>Find it with Bellman–Ford.</b> Start every currency at distance 0 and relax every edge V − 1 times. If some edge can still be relaxed after that, a negative cycle exists; following the predecessor links from that edge\'s target (V steps, to be sure you\'re inside the cycle) recovers the trades.</p><pre class="sc-code">import math\n\ndef arbitrage(currencies, rates):\n    """rates: {(a, b): units of b per unit of a}. True if some\n    cycle of trades multiplies money."""\n    dist = {c: 0.0 for c in currencies}\n    edges = [(a, b, -math.log(r)) for (a, b), r in rates.items()]\n    for _ in range(len(currencies) - 1):\n        for a, b, w in edges:\n            if dist[a] + w &lt; dist[b] - 1e-12:\n                dist[b] = dist[a] + w\n    return any(dist[a] + w &lt; dist[b] - 1e-12 for a, b, w in edges)</pre><p><b>Cost and caveats.</b> O(V × E). Dijkstra can\'t be used, because it assumes no negative weights. In real markets, quoted rates must include the bid–ask spread and fees, and the opportunity must be bigger than them and still there when your orders arrive: most "arbitrage" in raw mid prices disappears once you do.</p>' },
        { lvl: 'interview', q: 'Why must Dijkstra skip "stale" heap entries, and what goes wrong with a negative edge weight?', sol: '<p><b>Stale entries.</b> Python\'s heapq can\'t lower the priority of an entry already in the heap. So when Dijkstra finds a shorter route to a node, it pushes a <i>new</i> entry and leaves the old one in place. Later the old entry is popped, carrying a distance larger than the one already recorded.</p><pre class="sc-code">import heapq\n\ndef dijkstra(graph, src):\n    dist = {src: 0}\n    heap = [(0, src)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d &gt; dist[u]:\n            continue             # stale: u was finalised earlier\n        for v, w in graph[u]:\n            if d + w &lt; dist.get(v, float("inf")):\n                dist[v] = d + w\n                heapq.heappush(heap, (d + w, v))\n    return dist</pre><p>Without the skip, the answer is still correct (relaxing with a worse distance never improves anything) but the node\'s edges are scanned again: wasted work, which on dense graphs can be large. The skip keeps it O((V + E) log V).</p><p><b>Negative weights.</b> Dijkstra\'s key promise is: once a node is popped with distance d, nothing found later can beat d, because every other route continues from a node at least as far away and can only add weight. A negative edge breaks that promise. Example: edges A→B (2), A→C (3), C→B (−2). Dijkstra pops B at distance 2 and treats it as final, but A→C→B costs 1, and anything reached through B was already settled using the wrong distance. With negative weights, use Bellman–Ford.</p>' },
        { lvl: 'stretch', q: 'In a grid, every cell is 0 (open) or 1 (wall), and you may remove at most one wall. Find the fewest moves from the top left to the bottom right. How do you extend BFS?', sol: '<p><b>Why plain BFS isn\'t enough.</b> Reaching a cell having already removed a wall is a different situation from reaching it with the removal still available: the second can go places the first can\'t. If BFS marks the cell as visited the first time, it may throw away the more useful arrival.</p><p><b>Put the extra information in the state.</b> Search over (row, column, walls removed so far), where the last part is 0 or 1. That\'s at most 2 × rows × cols states, and BFS over them still finds the fewest moves.</p><pre class="sc-code">from collections import deque\n\ndef shortest_with_one_break(grid):\n    rows, cols = len(grid), len(grid[0])\n    start = (0, 0, grid[0][0])           # starting on a wall uses it\n    dist = {start: 0}\n    q = deque([start])\n    while q:\n        r, c, used = q.popleft()\n        if (r, c) == (rows - 1, cols - 1):\n            return dist[(r, c, used)]\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 &lt;= nr &lt; rows and 0 &lt;= nc &lt; cols:\n                nu = used + grid[nr][nc]\n                if nu &lt;= 1 and (nr, nc, nu) not in dist:\n                    dist[(nr, nc, nu)] = dist[(r, c, used)] + 1\n                    q.append((nr, nc, nu))\n    return -1</pre><p><b>Moves:</b> into an open cell, the count stays the same; into a wall, only if the count is 0, and it becomes 1. O(rows × cols) time and memory (twice the plain grid).</p><p><b>The lesson that transfers:</b> whenever a problem adds a resource (k wall breaks, keys collected, fuel left), add it to the state and search the bigger graph.</p>' },
      ],
      practice: [['Shortest route, or the right error', '#/code/opt-route'], ['Tree from pairs, or the right error', '#/code/opt-tree-errors'], ['Coding problems', '#/code']],
    },
  });
})();
