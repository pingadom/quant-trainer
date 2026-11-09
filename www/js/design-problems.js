// Design discussions for software engineering technical interviews. Optiver's advice for its SWE
// interviews (21 March 2025, linked below) says the interview should feel like solving a problem
// with a colleague: ask about load, latency and edge cases first, choose data structures and say
// what they cost, explain how they work inside, and revise when the interviewer pushes back. These
// problems aren't graded by tests; each walks through that conversation. Our own problems and
// model answers. Python is the language for the sketches.
(function () {
  const GUIDE = ['Optiver: interview tips for software engineers (the firm\'s own advice, March 2025)', 'https://www.optiver.com/join-us/stories/optiver-interview-tips-for-software-engineers/'];

  // Rubric: scored 1–3 each after a run, saved locally.
  const RUBRIC = [
    'Clarified load, latency and edge cases before designing',
    'Chose data structures and stated what each operation costs',
    'Explained how the structures work inside when asked',
    'Engaged with the pushbacks and revised the design',
    'Communicated clearly: thought aloud, used a diagram',
    'Tested edge cases, or said how you would',
  ];

  const PROBLEMS = [
    {
      id: 'd-order-book', title: 'Order book data structures', src: GUIDE,
      prompt: 'Design the data structures for a limit order book for one instrument. We need to add orders, cancel them, match incoming orders, and read the best bid and offer.',
      clarify: [
        ['Which order types: limit only, or also cancel, modify and market orders?', 'Limit orders and cancels to start with. We may ask about modify later.', true],
        ['Are prices integer ticks or floating point?', 'Integer ticks. (If they were floats, convert to ticks: never compare floating-point prices for equality.)', true],
        ['What message rate and latency are we designing for?', 'Tens of thousands of messages a second, and each should be handled in microseconds, not milliseconds.', true],
        ['Which queries matter: just the top of the book, or the full depth?', 'Top of book on every update; full depth occasionally.', true],
        ['How many price levels are usually live, and where does activity happen?', 'Hundreds of levels, but most adds and cancels happen within a few ticks of the best price.', true],
        ['One instrument, or many?', 'One for now. Mention how you would scale to many.', false],
        ['What should happen to an order whose id we\'ve seen before?', 'Ids are unique; you may assume it never happens, but say how you\'d check.', false],
      ],
      stages: [
        { ask: 'What does each side of the book need to support, and what structure do you use for one price level?',
          hints: ['Within a price, orders fill oldest first.', 'Which structure gives O(1) at both ends?'],
          good: ['Time priority within a level means a FIFO queue: <code>collections.deque</code> of orders.', 'Each side: <code>dict[price] → deque</code>, so finding a level is O(1).', 'Remember the total quantity per level if depth queries matter.'] },
        { ask: 'How do you find the best price quickly as levels appear and empty?',
          hints: ['You need the max of the bids and the min of the asks, under inserts and deletes.', 'heapq has no delete. What do you do instead?'],
          good: ['A heap of prices per side (negated for bids), with <b>lazy deletion</b>: leave emptied levels in the heap and pop them when they reach the top.', 'Or a sorted list of prices with <code>bisect</code>: inserting a level is O(levels), fine when there are few levels or new levels appear near the top.', 'Python has no TreeMap in the standard library; <code>sortedcontainers</code> is third-party (ask if it\'s allowed).'] },
        { ask: 'How do you cancel an order quickly?',
          hints: ['Cancels arrive by order id.', 'Finding the order in its level\'s deque is a scan.'],
          good: ['<code>dict[order_id] → order</code> for an O(1) lookup.', 'Mark the order cancelled and skip it when matching reaches it (lazy cancel), or keep a doubly linked list per level with node references in the dict so removal is O(1).', 'Keep level quantity in step, and delete the level when it empties.'] },
        { ask: 'Walk me through matching an incoming buy order.',
          hints: ['Compare it against the best ask.', 'Partial fills on both sides.'],
          good: ['While the buy has quantity and the best ask ≤ its price: fill against the oldest order at that level, at the resting order\'s price.', 'Remove fully filled orders, empty levels and stale heap entries as you go.', 'Rest any remainder at its own price on the bid side.'] },
      ],
      pushbacks: [
        { says: 'Cancelling from the middle of a deque is O(n). Fix it.', good: ['Lazy cancel: flag it in the order dict and skip flagged orders when matching; clean up as they reach the front.', 'Or a doubly linked list per level, with the node stored in the order dict: O(1) unlink.', 'Mention the trade-off: lazy cancel keeps dead orders in memory until they reach the front.'] },
        { says: 'Why not just use a TreeMap?', good: ['Python\'s standard library doesn\'t have one.', 'Heap with lazy deletion: O(log L) new levels, O(1) peek. Sorted list with bisect: O(L) inserts, but cache-friendly and simple for few levels. sortedcontainers: O(log L)-ish, third-party.', 'Pick for the actual workload: activity near the top of the book.'] },
        { says: 'Now support modifying an order.', good: ['Reducing the size keeps the order\'s place in the queue: update it in place.', 'Changing the price or increasing the size loses priority: treat it as cancel then add.', 'This is the usual exchange rule, but ask the interviewer.'] },
        { says: 'Make it thread-safe.', good: ['Prefer one thread owning the book, with other threads sending it messages through a queue: no locks on the book, and a clear order of events.', 'A single lock around everything works but serialises everything anyway.', 'For many instruments, shard: one owner per instrument or group of instruments.'] },
        { says: 'We need 100 times the throughput.', good: ['Measure first: find where the time goes.', 'In Python: <code>__slots__</code> on orders, fewer allocations (reuse objects), avoid per-message dict churn.', 'In C++ you would index levels by tick in an array around the best price: contiguous memory, no hashing.'] },
        { says: 'How do you know it\'s correct?', good: ['Unit tests for each rule: price priority, time priority, partial fills, cancels of filled or unknown orders.', 'Property tests: random sequences of operations against a slow brute-force book that re-sorts everything, comparing fills and top of book.', 'Invariants: the book is never crossed after matching; level quantities equal the sum of their orders.'] },
      ],
      diagram: [['Incoming order'], ['Match against the other side', 'best price: heap with lazy deletion'], ['Rest the remainder', 'dict[price] → deque of orders'], ['Order index', 'dict[order_id] → order, for cancels']],
      model: {
        structures: [
          ['dict[price] → deque[Order], per side', 'O(1) to find a level; the deque keeps time priority.'],
          ['heap of prices per side (bids negated)', 'Best price in O(1); new levels in O(log L); emptied levels removed lazily.'],
          ['dict[order_id] → Order', 'O(1) cancel lookup.'],
          ['Order with __slots__ (id, side, price, qty, live)', 'Less memory per order; a live flag allows lazy cancels.'],
        ],
        costs: [['Add at an existing level', 'O(1)'], ['Add at a new level', 'O(log L)'], ['Each fill', 'O(1), plus cleanup of empty levels'], ['Cancel', 'O(1) (lazy)'], ['Best bid and offer', 'O(1) amortised']],
        sketch: `class Order:
    __slots__ = ("oid", "side", "price", "qty", "live")

class Side:
    def __init__(self, is_bid):
        self.sign = -1 if is_bid else 1
        self.levels = {}          # price -> deque[Order]
        self.heap = []            # sign * price, stale entries allowed

    def best(self):
        while self.heap:
            p = self.sign * self.heap[0]
            q = self.levels.get(p)
            while q and not q[0].live:
                q.popleft()       # drop cancelled orders at the front
            if q:
                return p
            self.levels.pop(p, None)
            heapq.heappop(self.heap)  # lazy deletion of an empty level
        return None`,
      },
      codeLink: 'opt-order-book',
    },
    {
      id: 'd-feed-handler', title: 'Market data feed handler', src: GUIDE,
      prompt: 'Exchange market data arrives over UDP multicast. Build the component that turns it into an order book other systems in the firm can use.',
      clarify: [
        ['What message rate, and what latency budget?', 'Bursts of hundreds of thousands of messages a second; the book should be updated within a few microseconds.', true],
        ['Does every message carry a sequence number?', 'Yes, one sequence per channel.', true],
        ['Is it incremental updates, and is there a snapshot or retransmission service?', 'Incremental updates, with a snapshot channel and a retransmission request service.', true],
        ['Are there A and B feeds?', 'Yes, identical data on two separate paths.', true],
        ['Who consumes the book, and how many consumers?', 'Several trading strategies, some slower than others.', true],
        ['Which timestamps do the messages carry?', 'The exchange\'s send time. Record your own receive time too.', false],
      ],
      stages: [
        { ask: 'Sketch the pipeline from packet to consumer.', hints: ['There are four or five steps.', 'Where does sequence checking go?'],
          good: ['Receive packets (A and B) → arbitrate → check the sequence number → apply to the book → publish to consumers.', 'Keep the hot path single-threaded where possible; hand off to consumers through a ring buffer or queue.'] },
        { ask: 'What do you do with each sequence number?', hints: ['Three cases: expected, old, ahead.'],
          good: ['Expected: apply it.', 'Older than expected (a duplicate, or the other feed\'s copy): drop it.', 'Ahead (a gap): buffer it and start recovery.'] },
        { ask: 'How do you recover from a gap?', hints: ['Two services were mentioned.', 'What do consumers see meanwhile?'],
          good: ['Request the missing range from the retransmission service, or rebuild from a snapshot and replay buffered messages after it.', 'Mark the book stale while recovering and tell consumers not to trade on it.', 'Cap the buffer; if recovery takes too long, fall back to a snapshot.'] },
        { ask: 'How do you use the A and B feeds?', hints: ['They carry the same sequence numbers.'],
          good: ['Arbitrate: for each sequence number, take whichever copy arrives first and drop the other.', 'That cuts both loss (a packet lost on one path usually arrives on the other) and latency.'] },
      ],
      pushbacks: [
        { says: 'Recovery is slow. What do your consumers do?', good: ['Correctness over availability: publish a stale flag and let strategies pull their quotes.', 'Never present a book you know is wrong as if it were right.'] },
        { says: 'Packets arrive out of order.', good: ['Buffer briefly by sequence number and apply in order.', 'Only start recovery if the gap isn\'t filled within a short window (often the B feed fills it).'] },
        { says: 'One consumer is slow. What happens?', good: ['It must never block the handler.', 'Give each consumer its own buffer; if it falls behind, conflate (send only the latest state of each price level) or drop it and let it resync from a snapshot.'] },
        { says: 'Which timestamps do you trust?', good: ['Keep both the exchange timestamp and your own receive time.', 'Local clocks drift: synchronise them (PTP) if you compare times across machines.', 'Use a monotonic clock for measuring intervals.'] },
        { says: 'Why UDP multicast rather than TCP?', good: ['One send reaches every subscriber, and nobody waits for anyone else\'s retransmissions.', 'The cost is that loss must be detected (sequence numbers) and recovered by you.'] },
      ],
      diagram: [['UDP multicast A and B'], ['Arbitrate', 'first copy of each sequence number wins'], ['Sequence check', 'apply · drop · buffer and recover'], ['Order book', 'stale flag while recovering'], ['Publish', 'a ring buffer per consumer']],
      model: {
        structures: [
          ['next_seq: int', 'The sequence number expected next.'],
          ['dict[seq] → message (bounded)', 'Messages buffered during a gap.'],
          ['Order book (as in the order book problem)', 'Applied in sequence order only.'],
          ['Ring buffer per consumer', 'A slow consumer can\'t block the handler.'],
        ],
        costs: [['Apply an in-order message', 'O(1) plus the book update'], ['Duplicate', 'O(1), dropped'], ['Gap', 'Buffered in O(1) each; recovery is network-bound']],
        sketch: `def on_message(self, msg):
    if msg.seq < self.next_seq:
        return                      # duplicate or the other feed's copy
    if msg.seq > self.next_seq:
        self.pending[msg.seq] = msg # gap: hold it
        if not self.recovering:
            self.start_recovery(self.next_seq, msg.seq - 1)
        return
    self.apply(msg)
    self.next_seq += 1
    while self.next_seq in self.pending:   # drain what the gap was holding up
        self.apply(self.pending.pop(self.next_seq))
        self.next_seq += 1
    if not self.pending:
        self.recovering = False
        self.publish_stale(False)`,
      },
      codeLink: null,
    },
    {
      id: 'd-lru', title: 'LRU cache, then extended', src: GUIDE,
      prompt: 'Build a cache with a fixed capacity that evicts the least recently used entry. Then we\'ll extend it.',
      clarify: [
        ['Does a get count as a use, or only a put?', 'Both count.', true],
        ['What should get return on a miss?', 'None.', true],
        ['Will several threads use it?', 'Not at first; later, yes.', true],
        ['Is capacity a number of entries or a number of bytes?', 'Entries for now.', false],
      ],
      stages: [
        { ask: 'Which structures, and what do get and put cost?', hints: ['You need O(1) lookup and O(1) "move to most recent".'],
          good: ['A hash map from key to a node in a doubly linked list ordered by recency: both operations O(1).', 'In Python, <code>OrderedDict</code> is exactly that: <code>move_to_end</code> and <code>popitem(last=False)</code> are O(1).'] },
        { ask: 'Why is OrderedDict O(1) for this when a list would be O(n)?', hints: ['How does it find the entry\'s position in the order?'],
          good: ['It keeps a doubly linked list of entries alongside the hash table, and the table maps each key to its link, so moving or removing an entry doesn\'t search.'] },
      ],
      pushbacks: [
        { says: 'Make it thread-safe.', good: ['One lock around get and put: get also writes (it changes the order), so a read lock is not enough.', 'If the lock becomes contended, shard: N independent caches chosen by hash(key) % N, each with its own lock. Recency is then per shard, which is usually fine.'] },
        { says: 'Entries should expire after a time to live.', good: ['Store an expiry time with each entry; on get, treat an expired entry as a miss and remove it (lazy).', 'Add a periodic sweep, or a heap of expiry times, so expired entries don\'t hold memory forever.', 'Use a monotonic clock.'] },
        { says: 'Cap it by bytes, not by count.', good: ['Track the total size; on put, evict from the least recent end until it fits.', 'Reject or bypass an entry bigger than the whole cache.'] },
        { says: 'What breaks when the hit rate is low?', good: ['Every miss inserts and evicts: churn. Measure the hit rate; maybe size the cache differently or don\'t cache that data.'] },
      ],
      diagram: [['get / put'], ['dict: key → entry', 'O(1) lookup'], ['Recency list', 'most recent at one end, evict from the other']],
      model: {
        structures: [['OrderedDict[key] → value', 'Hash table plus a linked list of entries in recency order.']],
        costs: [['get', 'O(1)'], ['put', 'O(1)'], ['evict', 'O(1)']],
        sketch: `class LRUCache:
    def __init__(self, capacity):
        self.cap, self.d = capacity, OrderedDict()

    def get(self, key):
        if key not in self.d:
            return None
        self.d.move_to_end(key)
        return self.d[key]

    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)`,
      },
      codeLink: 'opt-lru',
    },
    {
      id: 'd-rate-limiter', title: 'Order rate limiter', src: GUIDE,
      prompt: 'The exchange allows at most N order messages per second per session. Make sure we never breach it.',
      clarify: [
        ['Is the limit per session, per account or per instrument?', 'Per session.', true],
        ['Is it any rolling second, or per calendar second?', 'Any rolling one-second window.', true],
        ['What should happen to an order over the limit: reject it, or queue it?', 'Your call; justify it.', true],
        ['Do several strategies share a session?', 'Yes, three threads may send on one session.', false],
      ],
      stages: [
        { ask: 'What are the options?', hints: ['Three classic algorithms.'],
          good: ['Fixed window: count per calendar second. Simple, but allows up to 2N across a window boundary.', 'Sliding log: a <code>deque</code> of send times; pop those older than one second, allow if fewer than N remain. Exact; O(1) amortised.', 'Token bucket: tokens refill at rate r up to a burst b; each message spends one. O(1) state.'] },
        { ask: 'Which do you pick here, and why?', hints: ['The exchange counts any rolling second.'],
          good: ['A sliding log matches a rolling-window rule exactly, and N is small, so the memory is fine.', 'Keep a small safety margin under N, because your clock and the exchange\'s differ.'] },
      ],
      pushbacks: [
        { says: 'Why not queue orders that are over the limit?', good: ['A queued order is sent late, on stale information; in trading that is often worse than not sending it.', 'Reject at the source and let the strategy decide; maybe prioritise cancels over new orders.'] },
        { says: 'Which clock do you use?', good: ['A monotonic clock (<code>time.monotonic()</code>), never wall-clock time, which can jump.'] },
        { says: 'Three threads share the session.', good: ['One lock around check-and-record, so two threads can\'t both take the last slot.', 'Or route all sends through one thread that owns the limiter.'] },
        { says: 'Cancels must never be blocked.', good: ['Reserve part of the budget for cancels, or let cancels bypass new-order throttling if the exchange counts them separately (ask).'] },
      ],
      diagram: [['Strategy wants to send'], ['Limiter', 'deque of send times in the last second'], ['Allowed → send', 'Over the limit → reject to the strategy']],
      model: {
        structures: [['deque of monotonic send times', 'Pop from the left while older than one second.']],
        costs: [['Check and record', 'O(1) amortised']],
        sketch: `class RateLimiter:
    def __init__(self, n, window=1.0):
        self.n, self.window, self.sent = n, window, deque()

    def try_send(self, now=None):
        now = time.monotonic() if now is None else now
        while self.sent and now - self.sent[0] >= self.window:
            self.sent.popleft()
        if len(self.sent) >= self.n:
            return False        # reject: don't queue stale orders
        self.sent.append(now)
        return True`,
      },
      codeLink: null,
    },
    {
      id: 'd-risk-check', title: 'Pre-trade risk check', src: GUIDE,
      prompt: 'Every order passes a risk check before it leaves the firm. Design it.',
      clarify: [
        ['Which limits do we enforce?', 'Order size, position, price reasonableness and message rate, plus a way to stop everything.', true],
        ['What latency can the check add?', 'Single-digit microseconds.', true],
        ['Does the position limit count orders that are sent but not yet filled?', 'It should: you tell me why.', true],
        ['Who can change the limits, and while trading?', 'Risk managers, at any time.', false],
      ],
      stages: [
        { ask: 'List the checks and what each needs.', hints: ['Size, position, price, rate, and an emergency stop.'],
          good: ['Maximum order size.', 'Position limit, counting filled position plus open orders on the same side.', 'Price collar: reject prices too far from a reference price.', 'Message rate (as in the rate limiter).', 'A kill switch that blocks everything immediately.'] },
        { ask: 'How do you keep it fast?', hints: ['It runs on every order.'],
          good: ['Every check is O(1) against precomputed state: position and open quantity updated on fills and acks, not recomputed.', 'No allocation, I/O or locks shared with slow code on the hot path.'] },
      ],
      pushbacks: [
        { says: 'The reference price feed is stale. What does the price check do?', good: ['<b>Fail closed</b>: if the check can\'t decide, the order doesn\'t go. A risk check is the opposite of a cache, which can fail open.'] },
        { says: 'Why count open orders in the position?', good: ['Otherwise many orders sent at once could each pass, and all fill, blowing through the limit.'] },
        { says: 'A limit changes while an order is in flight.', good: ['Apply new limits to new orders; read the limits once per check so a check never mixes old and new values.'] },
        { says: 'How do you test it?', good: ['A unit test per limit at, just under and just over the boundary.', 'Replay recorded order flow and confirm nothing that should be blocked gets through.'] },
      ],
      diagram: [['Order from a strategy'], ['Kill switch?'], ['Size · position · price collar · rate', 'each O(1) on precomputed state'], ['Pass → exchange', 'Fail or unsure → reject']],
      model: {
        structures: [['Per-instrument state: position, open buy qty, open sell qty, reference price', 'Updated on fills and acknowledgements.'], ['Limits snapshot', 'Read once per check.']],
        costs: [['Whole check', 'O(1)']],
        sketch: `def check(self, o):
    if self.killed:
        return "kill switch"
    if o.qty > self.lim.max_qty:
        return "size"
    ref = self.ref_price.get(o.symbol)
    if ref is None or abs(o.price - ref) > self.lim.collar:
        return "price"           # no reference: fail closed
    worst = self.position[o.symbol] + self.open_buy[o.symbol] + o.qty if o.side == "BUY" \\
        else self.position[o.symbol] - self.open_sell[o.symbol] - o.qty
    if abs(worst) > self.lim.max_pos:
        return "position"
    return None                  # passes`,
      },
      codeLink: null,
    },
    {
      id: 'd-best-venue', title: 'Best price across venues', src: GUIDE,
      prompt: 'We trade one stock on 5 venues. Keep the best bid and best offer across all of them, with updates arriving constantly.',
      clarify: [
        ['How many venues: always about 5, or could it grow?', 'Five now.', true],
        ['How often does each venue update?', 'Thousands of times a second in total.', true],
        ['Do fees differ between venues?', 'Yes.', false],
        ['What if a venue\'s feed stops?', 'You tell me.', true],
      ],
      stages: [
        { ask: 'Which structure?', hints: ['How big is the problem, really?'],
          good: ['Store each venue\'s best bid and offer in a small array; on each update, take the max and min over 5 values. O(V) with tiny V: simpler and faster than a heap.', 'The interviewer is testing whether you pick the simplest structure for the actual size.'] },
      ],
      pushbacks: [
        { says: 'A venue\'s feed goes stale.', good: ['Timestamp each venue\'s quote and exclude any older than a threshold from the best price.'] },
        { says: 'Fees differ.', good: ['Compare effective prices: price plus fee for buying, minus fee for selling.'] },
        { says: 'Now there are 500 venues.', good: ['A scan per update is now costly: use a heap or a sorted structure keyed by price per side, with lazy updates.', 'Or only rescan when the venue that changed was, or now beats, the best.'] },
      ],
      diagram: [['Venue updates'], ['best[venue] = (bid, ask, time)', 'an array of 5'], ['Scan 5 values', 'best bid, best offer']],
      model: {
        structures: [['Array of (bid, ask, timestamp) per venue', 'Five entries; a scan is a handful of comparisons.']],
        costs: [['Update', 'O(1) to store, O(V) to rescan'], ['Read best', 'O(1) if cached after the scan']],
        sketch: `def on_quote(self, venue, bid, ask, now):
    self.quotes[venue] = (bid, ask, now)
    fresh = [q for q in self.quotes if q and now - q[2] < self.max_age]
    self.best_bid = max((q[0] for q in fresh), default=None)
    self.best_ask = min((q[1] for q in fresh), default=None)`,
      },
      codeLink: null,
    },
  ];

  QT.design = { PROBLEMS, RUBRIC, GUIDE, byId: (id) => PROBLEMS.find((p) => p.id === id) };
})();
