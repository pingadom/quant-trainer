// Design discussions for software engineering technical interviews. Optiver's advice for its SWE
// interviews (21 March 2025, linked below) says the interview should feel like solving a problem
// with a colleague: ask about load, latency and edge cases first, choose data structures and say
// what they cost, explain how they work inside, and revise when the interviewer pushes back. These
// problems aren't graded by tests; each walks through that conversation. Our own problems and
// model answers. Python is the language for the sketches.
(function () {
  const GUIDE = ['Optiver: interview tips for software engineers (the firm\'s own advice, March 2025)', 'https://www.optiver.com/join-us/stories/optiver-interview-tips-for-software-engineers/'];

  // Candidate reports of Optiver's software engineering intern system design interviews.
  const REPORTS = ['Candidate reports of Optiver SWE intern system design interviews, 2020–2026 (FastPrep collection)', 'https://www.fastprep.io/experience/2020-2026-optiver-swe-intern-system-design-interviews-15-experiences-e2q46vdzda'];

  // The system design role-play is scored differently: you drive the requirements, as the CTO.
  const SYS_RUBRIC = [
    'Drove the requirements: users, volumes, latency and the cost of failure, before designing',
    'Stated assumptions and did the back-of-envelope numbers',
    'Clear components and data flow, with a diagram',
    'Separated the latency-critical path from everything else',
    'Handled failures: disconnects, lost data, crashes, bugs (risk limits, kill switch)',
    'Explained trade-offs (cost, complexity, speed) and adapted when pushed',
  ];

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
    // ------------------------------------------------------------------ Interview 2: system design role-plays
    // You play the CTO of a startup trading firm. The interviewer holds the requirements and reveals
    // them only when asked (the "clarify" answers). Prompts follow those candidates report; the
    // details, numbers and model designs are ours.
    {
      id: 'sd-frankfurt', title: 'Trading BMW in Frankfurt from Amsterdam', src: REPORTS, system: true, minutes: 60,
      prompt: 'You are the CTO of a new trading company based in Amsterdam. We want to start trading German shares on the Frankfurt Stock Exchange, beginning with BMW. Design the system that lets us do that. Ask me anything you need.',
      clarify: [
        ['How do we trade: is it automated, or do people click buttons?', 'Our traders have a strategy that buys and sells automatically when prices move. They watch it and adjust its settings during the day.', true],
        ['How fast do we need to be? Are we competing on speed?', 'Yes. Other firms trade the same stock, and if we react later than them we get worse prices. A few milliseconds behind is a real problem.', true],
        ['How much market data and how many orders?', 'BMW averages about 2,000 market data updates a second, with bursts of 50,000 a second at the open and on news. We send at most a few hundred orders a second.', true],
        ['How does the exchange let us connect?', 'Market data comes as UDP multicast; orders go over a TCP session in the exchange\'s binary protocol. Both need a physical connection into the exchange\'s network.', true],
        ['What happens if the system does something wrong?', 'A bug that sends wrong orders could lose more money than the company has. The exchange also requires that we can cancel all our orders at once (a kill switch) and limits our message rate.', true],
        ['Who uses it, and where are they?', 'Five traders in the Amsterdam office. Three developers, also in Amsterdam.', false],
        ['What\'s the budget?', 'We\'re a startup, so cost matters, but a trading business must be reliable and competitive or it has no business at all.', false],
        ['Do we need to keep records?', 'Yes: regulators require us to keep every order and trade for years, and we must be able to reconstruct what happened.', false],
        ['When does the market trade?', 'Roughly 9:00 to 17:30 Frankfurt time on weekdays. Outside those hours we can deploy and maintain.', false],
        ['Will we add more stocks or exchanges later?', 'More German stocks soon, and maybe Euronext Amsterdam next year.', false],
      ],
      stages: [
        { ask: 'Before any boxes: summarise the requirements back to me, with numbers.',
          hints: ['Automated, latency-sensitive, small order rate, bursty market data.', 'Say the risk: a bug can sink the company.'],
          good: ['"Automated strategy, competing on speed, so milliseconds matter; ~2k updates/s average, 50k/s bursts; hundreds of orders/s; an exchange-mandated kill switch and rate limits; full audit trail; traders in Amsterdam; startup budget."', 'Confirming this first shows you drive the conversation, the way a CTO would.'] },
        { ask: 'What are the main components?',
          hints: ['Follow a price change from the exchange to an order and back.', 'What must exist even if the strategy is perfect?'],
          good: ['<b>Market data handler</b>: receives the multicast feed, checks sequence numbers, builds the order book.', '<b>Strategy</b>: decides what to trade.', '<b>Pre-trade risk</b>: size, price, position and rate limits on every order.', '<b>Order gateway</b>: the exchange session; tracks every order\'s state.', '<b>Position and P&amp;L keeper</b>, fed by fills.', '<b>Recorder</b>: logs every message for audit and replay.', '<b>Monitoring and kill switch</b>, and a <b>trader UI</b> for controls.'] },
        { ask: 'Where do you put the servers, and why?',
          hints: ['Amsterdam to Frankfurt is about 363 km.', 'Light in fibre: 5 µs per km. What do colocated competitors see?'],
          good: ['<b>Colocate the trading servers in the exchange\'s data centre in Frankfurt.</b> From Amsterdam, a round trip by fibre is about 4–5 ms; colocated competitors are tens of microseconds from the exchange.', 'Keep everything that isn\'t latency-critical (UI, storage, research, monitoring dashboards) in Amsterdam or the cloud, linked by a leased line or VPN.', 'Cost: a colocation rack and cross-connects are a monthly fee; without them the strategy isn\'t competitive, so it\'s the cost of being in the business.'] },
        { ask: 'Walk me through the market data path.',
          hints: ['UDP can lose packets.', 'Where does the order book live?'],
          good: ['Multicast feed (often two identical lines, A and B) → network card → feed handler, which takes whichever copy arrives first and checks sequence numbers.', 'A gap means the book can\'t be trusted: mark it stale, stop trading that stock, recover from the exchange\'s snapshot or retransmission service.', 'The book is in memory, in the same process as the strategy, on a dedicated core: no database, no network hop, no locks on the hot path.'] },
        { ask: 'And the order path?',
          hints: ['What happens between "the strategy wants to buy" and the exchange?', 'Orders have a life: sent, live, partly filled…'],
          good: ['Strategy → <b>risk checks</b> (max order size, price within a band of the market, position limit, message rate) → <b>gateway</b> → exchange over a persistent TCP session with sequence numbers and heartbeats, Nagle off.', 'Track each order by a client order id through a state machine: pending → live → partly filled → filled / cancelled / rejected.', 'Execution reports update positions and P&amp;L immediately.'] },
        { ask: 'How do the traders in Amsterdam see and control it?',
          hints: ['Does the UI need microseconds?'],
          good: ['Positions, P&amp;L and strategy state are published from Frankfurt to an Amsterdam service over the private link, a few times a second; the UI isn\'t latency-critical.', 'Controls (pause a strategy, change a limit, kill everything) go back over the same link, authenticated and logged, and are applied by the risk layer.', 'A kill switch must work even if the strategy is broken: it lives in the risk/gateway layer, cancels all orders and blocks new ones.'] },
        { ask: 'What do you store, and how do you keep it off the hot path?',
          hints: ['Regulators, debugging, and replays for testing.'],
          good: ['Every market data message, order and execution report, with timestamps, written by a separate thread from an in-memory queue, so disk never slows trading.', 'Shipped to Amsterdam storage after hours; kept for years.', 'Reconciled daily against the exchange\'s records (drop copy), and used to replay days for testing.'] },
      ],
      pushbacks: [
        { says: 'At 11:00 the connection to the exchange drops. What happens?', good: ['The exchange\'s <b>cancel-on-disconnect</b> setting cancels our open orders, so we aren\'t left with orders we can\'t see.', 'Strategy pauses automatically; the gateway reconnects and uses sequence numbers to request any execution reports it missed.', 'Reconcile order and position state (gateway state against the exchange\'s view or drop copy) before trading resumes, ideally with a trader confirming.'] },
        { says: 'At the open we lose some market data packets.', good: ['Sequence numbers reveal the gap; the B line usually has the packet.', 'If both missed it, mark the book stale and stop trading BMW until it\'s recovered from a snapshot or retransmission. Trading on a wrong book is worse than not trading.'] },
        { says: 'A bug starts sending thousands of orders a second.', good: ['The risk layer\'s rate limit and size limits reject them, independently of the strategy\'s code.', 'Too many rejects in a short window trips the kill switch automatically: cancel everything, block new orders, alert people.', 'The exchange\'s own limits are the last line of defence, not the first.'] },
        { says: 'The trading server dies.', good: ['Open orders are cancelled by the exchange on disconnect.', 'A warm standby in the same rack can take over, but only after rebuilding state from the recorder and the exchange\'s records; never resume trading with unknown positions.', 'For a startup, manual failover with a runbook may be the right first step.'] },
        { says: 'Colocation is expensive. Could we start in the cloud?', good: ['Cloud regions aren\'t inside the exchange\'s network: you\'d add milliseconds and jitter, which defeats a speed-sensitive strategy.', 'A cheaper middle path: a hosting provider in the exchange\'s data centre that shares racks and connectivity.', 'Non-latency parts (storage, research, dashboards) can live in the cloud.'] },
        { says: 'We\'d like to add Euronext Amsterdam next year.', good: ['A feed handler and gateway per venue, behind a common internal format, so strategies don\'t care where data comes from.', 'Colocate at Euronext too if the strategy needs speed there; a firm-wide risk view across both venues.', 'Synchronised clocks (PTP) so timestamps from both sites can be compared.'] },
        { says: 'How do you test it before risking real money?', good: ['Unit tests per component; the exchange\'s test environment; replay recorded market data through the full system.', 'Go live with tiny limits (small sizes, one stock), watch it, then raise them.'] },
      ],
      diagram: [['Exchange (Frankfurt)'], ['Feed handler', 'multicast A/B, sequence numbers'], ['Book + strategy', 'same process, pinned core'], ['Risk checks', 'size, price, position, rate'], ['Order gateway', 'TCP session to the exchange'], ['Recorder + monitoring', 'async, off the hot path'], ['Amsterdam office', 'UI, controls, storage']],
      model: {
        components: [
          ['Colocated trading server (Frankfurt)', 'Feed handler, book, strategy, risk and gateway in one process on pinned cores: the latency-critical path.'],
          ['Risk layer with kill switch', 'Limits every order independently of the strategy; can cancel all and block new orders.'],
          ['Order gateway', 'Persistent exchange session; order state machine; cancel-on-disconnect.'],
          ['Recorder', 'Asynchronous log of every message; replay and audit; daily reconciliation.'],
          ['Amsterdam services', 'Trader UI and controls, monitoring dashboards, long-term storage, research.'],
          ['Private link Amsterdam–Frankfurt', 'Leased line or VPN for controls and status; nothing latency-critical crosses it.'],
        ],
        numbers: [['Amsterdam → Frankfurt', '363 km in a straight line'], ['One way by fibre', '~1.8 ms on a straight path, ~2.4 ms on a 30% longer route'], ['One way by microwave', '~1.2 ms'], ['Market data burst', '50,000 msg/s × ~64 bytes ≈ 26 Mb/s'], ['Colocated round trip', 'tens of µs']],
        tradeoffs: ['Colocation costs money every month, but without it a speed-sensitive strategy can\'t compete.', 'One process for the hot path is fastest but harder to change; split slow, non-critical parts out.', 'Automatic failover is faster but riskier than manual failover with reconciliation; a startup can begin with manual.', 'Stopping trading on a stale book loses opportunities but avoids trading on wrong prices.'],
      },
      codeLink: 'lc-risk-1',
    },
    {
      id: 'sd-multi-prices', title: 'Prices from several exchanges, fast queries', src: REPORTS, system: true, minutes: 60,
      prompt: 'You\'re the CTO of a startup trading firm. We receive stock price updates from several exchanges. Design a system that takes them in and quickly answers questions about the current state of the market.',
      clarify: [
        ['What questions do people ask?', 'Mainly "what\'s the best bid and offer for this stock across all exchanges, and where?", and the last trade price.', true],
        ['Who asks, and how fast must answers be?', 'Our trading algorithms ask constantly and need answers in microseconds. Traders\' screens also show prices, but a tenth of a second is fine for them.', true],
        ['How many exchanges, stocks and updates?', 'Five exchanges, about 1,000 stocks, 200,000 updates a second in total at peak.', true],
        ['Do we need history, or just the current state?', 'Just the current state here. History is someone else\'s project, but we\'d like to record the updates.', true],
        ['What if one exchange\'s feed goes quiet?', 'It happens. Users must not be misled by a stale price.', true],
        ['Do all updates for a stock arrive in order?', 'Within one exchange, yes (they have sequence numbers). Across exchanges, timestamps come from different clocks.', false],
        ['Where are the exchanges and our servers?', 'All in one region; assume we can colocate.', false],
      ],
      stages: [
        { ask: 'Summarise the requirements, and say which consumers drive the design.',
          hints: ['Two very different consumers.'],
          good: ['Algorithms: microseconds, every update. Screens: 100 ms, latest value only. Design the fast path for algorithms and give screens a conflated feed.'] },
        { ask: 'What are the components?',
          hints: ['One part per exchange, then something that combines them.'],
          good: ['A <b>feed handler per exchange</b> (its protocol, sequence numbers, gap recovery).', 'A <b>normaliser</b> into one internal format (symbol id, venue, bid, ask, sizes, timestamp).', 'A <b>consolidated state</b>: per stock, the latest top of book from each venue, and the best across venues.', '<b>Distribution</b>: in-process or shared-memory access for algorithms; a conflated publish for screens.'] },
        { ask: 'What data structure holds the current state, and what does a query cost?',
          hints: ['How many venues per stock?'],
          good: ['An array indexed by stock id (map symbols to integers once), each entry holding a small fixed array of 5 venue quotes.', 'Best bid = max over 5 values: O(venues), effectively constant; or update the best incrementally on each venue update.', 'Query: an array lookup, nanoseconds, no locks if one thread writes and readers use a sequence number to detect a torn read (a seqlock).'] },
        { ask: 'How do you handle 200,000 updates a second, with bursts?',
          hints: ['Can the work be split?'],
          good: ['Partition by stock across cores (or by venue for decoding), so each core owns its data: no locks.', '200k updates/s is easy for one core if each costs ~1 µs; size for 5–10× bursts and measure.', 'Keep everything in memory; record to disk asynchronously.'] },
      ],
      pushbacks: [
        { says: 'One exchange stops sending data, but its last prices still look the best.', good: ['Track the time of the last update or heartbeat per venue; past a threshold, mark that venue stale and exclude it from the best price (and show it as stale on screens).', 'Sequence gaps also mark a venue stale until recovered.'] },
        { says: 'One stock is a hundred times busier than the rest.', good: ['Hot partitions: give the busiest stocks their own cores; partition by measured load, not by name.'] },
        { says: 'A screen can\'t keep up with the update rate.', good: ['Conflation: keep only the latest value per stock and send what has changed since the last refresh; slow consumers get fewer, newer updates rather than a growing backlog.'] },
        { says: 'The process restarts in the middle of the day.', good: ['Rebuild from each exchange\'s snapshot or retransmission service, then apply the live feed from the snapshot\'s sequence number.', 'Mark all venues stale until each is recovered.'] },
        { says: 'Now traders want "price five minutes ago".', good: ['Don\'t put history in the hot path: the recorder writes updates to a time-series store, and history queries go there.'] },
        { says: 'Two exchanges\' timestamps disagree.', good: ['Clocks differ; use our own receive timestamp from synchronised clocks (PTP) for comparisons, and keep the exchange timestamp for reference.'] },
      ],
      diagram: [['Exchange feeds ×5'], ['Feed handlers', 'one per venue, sequence numbers'], ['Normaliser', 'one internal format'], ['Consolidated state', 'array by stock id × venue'], ['Algorithms', 'in-process reads'], ['Screens', 'conflated publish']],
      model: {
        components: [['Feed handler per venue', 'Protocol decoding, gap detection and recovery.'], ['Normaliser', 'Common message format and symbol ids.'], ['Consolidated state', 'Per stock: latest quote per venue and the best across venues, in memory.'], ['Fast access', 'Algorithms read shared memory or in-process, lock-free (single writer, seqlock).'], ['Conflating publisher', 'Latest-value updates to screens at a fixed rate.'], ['Recorder', 'All updates to disk asynchronously, for history and replay.']],
        numbers: [['Peak updates', '200,000/s across 5 venues'], ['Cost per update', '~1 µs on one core leaves headroom; split by stock if needed'], ['State size', '1,000 stocks × 5 venues × ~32 bytes ≈ 160 KB: fits in cache']],
        tradeoffs: ['Latest-value (conflated) delivery is simple and keeps up, but consumers miss intermediate prices; algorithms that need every update read the full stream.', 'Excluding stale venues avoids bad prices but can hide a real price if the threshold is too tight.'],
      },
    },
    {
      id: 'sd-market-data', title: 'A market data platform for the whole firm', src: REPORTS, system: true, minutes: 60,
      prompt: 'You\'re the CTO. Design the system that takes in real-time market data (stock prices, option prices and more) from many exchanges and delivers it to everything in the firm that needs it.',
      clarify: [
        ['Who consumes the data?', 'About 50 trading algorithms, the risk system, traders\' screens, and a recorder for research.', true],
        ['How much data is it?', 'Options are the big one: across all exchanges, millions of updates a second at peak, several Gb/s raw. Stocks are much less.', true],
        ['What latency does each consumer need?', 'Algorithms: as fast as possible. Risk: within a second. Screens: a few updates a second. Research: next day is fine.', true],
        ['Does every consumer need every instrument?', 'No. Each algorithm trades a few hundred instruments; screens show what traders look at.', true],
        ['What happens if data is lost or late?', 'Algorithms must know immediately; trading on stale data is dangerous.', true],
        ['Are the exchanges in one place?', 'Several data centres across Europe and the US.', false],
        ['Do we need to replay history?', 'Yes, researchers replay past days to test strategies, and replays must match what was seen live.', false],
      ],
      stages: [
        { ask: 'Who are the consumers, and what tiers of service do they need?',
          hints: ['Group the consumers by latency.'],
          good: ['Tier 1: algorithms, full-rate data for their instruments, microseconds.', 'Tier 2: risk, aggregated, sub-second.', 'Tier 3: screens, conflated, a few updates a second.', 'Tier 4: recording, complete, durable, no latency need.'] },
        { ask: 'What are the components?',
          hints: ['Near each exchange, then distribution.'],
          good: ['<b>Feed handlers colocated</b> at each exchange (decode, sequence check, recover).', '<b>Normalise</b> to one compact binary format with numeric instrument ids.', '<b>Distribute</b> on an internal multicast network, split into channels by instrument group, so consumers subscribe only to what they need.', '<b>Conflation service</b> for screens; <b>recorder</b> writing everything with receive timestamps.'] },
        { ask: 'Options produce millions of updates a second. How do you cope?',
          hints: ['Who needs all of it?'],
          good: ['Filter early: subscribe per channel or instrument, so consumers don\'t decode what they don\'t trade.', 'Compact binary messages (fixed layouts, deltas against the last value).', 'Spread decoding over cores by channel; size network and storage for peak, not average.', 'Across data centres, send only what remote sites need, compressed and conflated.'] },
        { ask: 'How do consumers detect and handle missing or stale data?',
          hints: ['Sequence numbers at every hop.'],
          good: ['Sequence numbers per channel on the internal feed too; heartbeats on quiet channels.', 'A gap or missing heartbeat marks the data stale; algorithms stop trading those instruments; a snapshot service lets a consumer rebuild.'] },
        { ask: 'How do you make replays match live trading?',
          hints: ['What did the consumer actually see?'],
          good: ['Record the normalised stream exactly as distributed, with receive timestamps, so a replay feeds the same messages in the same order.'] },
      ],
      pushbacks: [
        { says: 'One algorithm is slow and falls behind.', good: ['Multicast doesn\'t wait for slow consumers, which protects the others; the slow one detects gaps and recovers from a snapshot, or should subscribe to less.', 'Never let one consumer apply backpressure to the shared feed.'] },
        { says: 'An exchange changes its protocol next month.', good: ['Only that exchange\'s feed handler changes; the normalised format isolates everyone else. Test the new handler against recorded data before the switch.'] },
        { says: 'Traders in New York need European option prices.', good: ['Conflate and compress before the transatlantic link (bandwidth is expensive, and ~60–70 ms round trip means they aren\'t latency-sensitive).'] },
        { says: 'Why not put it all through Kafka?', good: ['Fine for recording and research, where durability and replay matter more than latency.', 'Not for the trading path: brokers, disks and acknowledgements add milliseconds and jitter.'] },
        { says: 'How do you compare timestamps from two data centres?', good: ['Synchronise clocks with PTP (sub-microsecond on good hardware); record both the exchange\'s timestamp and our receive timestamp.'] },
      ],
      diagram: [['Exchanges'], ['Colocated feed handlers', 'decode, sequence, recover'], ['Normalised binary feed', 'internal multicast channels'], ['Algorithms', 'full rate, subscribed channels'], ['Risk / screens', 'aggregated, conflated'], ['Recorder', 'complete, for replay']],
      model: {
        components: [['Colocated feed handlers', 'One per exchange protocol; gap detection and recovery.'], ['Normalised internal feed', 'Compact binary, numeric ids, multicast channels by instrument group.'], ['Snapshot service', 'Lets consumers rebuild after a gap or restart.'], ['Conflation service', 'Latest values for screens and remote offices.'], ['Recorder', 'Exact normalised stream with timestamps, for replay and research.'], ['Monitoring', 'Rates, gaps, latency per hop, staleness.']],
        numbers: [['Options peak', 'millions of msg/s, several Gb/s raw'], ['10 Gb/s link, 1,500-byte packet', '1.2 µs to serialise'], ['Transatlantic round trip', '~60–70 ms']],
        tradeoffs: ['Multicast is fast and fair but unreliable, so recovery services are needed.', 'Filtering by channel saves work but adds subscription management.', 'A durable log (Kafka-style) suits recording, not the trading path.'],
      },
    },
    {
      id: 'sd-order-flow', title: 'Orders, confirmations and never selling what we don\'t have', src: REPORTS, system: true, minutes: 60,
      prompt: 'You\'re the CTO. Several of our trading strategies send orders to an exchange. Design the system that sends the orders and keeps track of what we own. We must never sell shares we don\'t have, and we must always know the state of every order.',
      clarify: [
        ['Do strategies share one account and one inventory?', 'Yes, one account. Each strategy decides independently.', true],
        ['Is short selling ever allowed?', 'No. Selling shares we don\'t own breaks the rules.', true],
        ['How does the exchange confirm orders?', 'Asynchronously: an acknowledgement, then fills (possibly several partial fills), or a reject; cancels are confirmed too. Messages can be delayed.', true],
        ['Can a cancel and a fill cross?', 'Yes: we can ask to cancel an order that has just been filled.', true],
        ['How many orders?', 'A few thousand a second at peak.', false],
        ['What if our system crashes?', 'We must come back knowing exactly what we own and which orders are live.', true],
      ],
      stages: [
        { ask: 'Where can selling shares we don\'t have go wrong?',
          hints: ['Two strategies, 100 shares, both decide to sell 100 at the same moment.'],
          good: ['A race: both check "we own 100", both send sells, we end up short 100.', 'Also: counting shares in sell orders that haven\'t filled yet. Available shares = owned − shares already committed to open sell orders.'] },
        { ask: 'How do you prevent it?',
          hints: ['Who is allowed to change the inventory?'],
          good: ['One component, the <b>order manager</b>, owns the account\'s inventory and is the only path to the exchange: strategies send it requests through a queue.', 'For each sell it checks available = owned − reserved; if enough, it <b>reserves</b> the shares and sends the order; fills and cancels release or consume reservations.', 'A single thread (or one lock) around check-and-reserve makes it atomic: no race.'] },
        { ask: 'How do you track each order?',
          hints: ['An order has states.'],
          good: ['A state machine per order: pending new → acknowledged → partially filled → filled, or cancelled / rejected, with "pending cancel" in between.', 'Keyed by our client order id; every exchange message is matched to it. Unknown or out-of-place messages raise alerts.'] },
        { ask: 'How do you survive a crash?',
          hints: ['What if we crash just after sending an order?'],
          good: ['Write the order to a durable log <b>before</b> sending it, and every exchange message as it arrives (write-ahead logging).', 'On restart, replay the log to rebuild state, then reconcile with the exchange (its order status or drop copy) before allowing new orders.'] },
      ],
      pushbacks: [
        { says: 'We send a cancel, and the exchange reports a fill for the same order.', good: ['Normal: the fill happened first. The state machine accepts the fill, the cancel is rejected as too late, and positions follow the fill.', 'Strategies must treat a cancel as a request, not a fact, until confirmed.'] },
        { says: 'The exchange sends the same fill twice.', good: ['Deduplicate by the execution id: apply each fill exactly once.'] },
        { says: 'The order manager is now a bottleneck.', good: ['Partition by instrument (or account): each partition owns its inventory, so checks stay atomic without a global lock.', 'Measure first: a single thread can handle hundreds of thousands of simple checks a second.'] },
        { says: 'A fill arrives for an order we don\'t know.', good: ['Never ignore it: it changes our position. Record it, alert, freeze trading in that instrument, and reconcile.'] },
        { says: 'Can strategies just keep their own inventory?', good: ['Then two strategies can both spend the same shares: the race comes back. One owner per inventory is the point.'] },
      ],
      diagram: [['Strategies'], ['Request queue'], ['Order manager', 'inventory, reservations, state machines'], ['Write-ahead log', 'before every send'], ['Exchange'], ['Execution reports', 'deduplicated, back to the manager']],
      model: {
        components: [['Order manager', 'Single owner of inventory and reservations; the only path to the exchange.'], ['Order state machine', 'Per client order id, every transition checked.'], ['Write-ahead log', 'Durable record before sending; rebuilds state after a crash.'], ['Reconciliation', 'Against the exchange\'s records at start-up and daily.'], ['Risk checks', 'Size, price and rate limits alongside the inventory check.']],
        numbers: [['Peak orders', 'a few thousand a second'], ['Single-threaded check', 'well under 10 µs each, so one thread has ample headroom']],
        tradeoffs: ['A single owner makes correctness simple but must be fast and highly available.', 'Reserving shares for open sells is safe but can block a strategy that knows another order will fill.', 'Logging before sending adds a little latency; without it a crash can lose track of live orders.'],
      },
      codeLink: 'lc-risk-2',
    },
    {
      id: 'sd-remote-desk', title: 'Traders in Amsterdam, systems in Frankfurt, a narrow link', src: REPORTS, system: true, minutes: 60,
      prompt: 'You\'re the CTO. Our trading systems and market data are in Frankfurt, but our traders and some clients are in Amsterdam. Design the application that lets them see live prices and place orders.',
      clarify: [
        ['How much data do they need to see?', 'Live prices for about 2,000 instruments; each trader watches a few hundred at a time.', true],
        ['What link do we have between the offices?', 'A leased line of 100 Mb/s; bigger lines cost a lot more every month.', true],
        ['How big is the raw market data?', 'At peak the full feed for those instruments is around 400 Mb/s.', true],
        ['How fast must prices update on screen?', 'People can\'t read faster than a few updates a second; orders should arrive quickly, but this is human trading.', true],
        ['Who are the clients, and what can they do?', 'External clients who can see prices and place orders for their own accounts only.', true],
        ['What if the link fails?', 'Trading must stop safely, and come back cleanly.', false],
      ],
      stages: [
        { ask: 'Can we just send the market data over the link?',
          hints: ['Compare the numbers.'],
          good: ['No: 400 Mb/s raw into a 100 Mb/s line. Something must shrink it, and the requirements tell us what: humans need a few updates a second.'] },
        { ask: 'How do you shrink it?',
          hints: ['What does a screen actually need?'],
          good: ['<b>Filter</b>: send only instruments someone is watching (subscriptions).', '<b>Conflate</b>: per instrument, send the latest value at most ~4 times a second.', '<b>Compress</b>: compact binary messages, deltas against the last value, then a general compressor.', 'Rough size: 2,000 instruments × 4 updates/s × 100 bytes ≈ 6.4 Mb/s, well within the line.'] },
        { ask: 'What does the architecture look like?',
          hints: ['Where does conflation happen?'],
          good: ['Frankfurt: a gateway service that subscribes to market data, conflates and compresses per Amsterdam subscription, and accepts orders.', 'Amsterdam: an edge server that receives one stream and fans it out to every desktop, so the line carries each update once, not once per trader.', 'Orders flow the other way, small and prioritised over price updates (separate connection or quality-of-service).'] },
        { ask: 'How do you handle clients securely?',
          hints: ['They\'re outside the firm.'],
          good: ['Encrypted connections (TLS), authentication, and permissions so each client sees only their instruments and trades only their own account.', 'Client orders pass the same risk checks as ours, with per-client limits; everything is logged.'] },
      ],
      pushbacks: [
        { says: 'The link goes down for 30 seconds.', good: ['Screens show prices as stale; order entry is disabled.', 'Open orders: decide the policy (keep, or cancel on disconnect) and tell users clearly.', 'On reconnect, send a fresh snapshot of every subscribed instrument, then resume deltas. A backup link over an internet VPN is cheap insurance.'] },
        { says: 'You assumed 400 Mb/s was already compressed. It isn\'t.', good: ['Then the raw data compresses well (repetitive fields), but conflation and filtering are still the big wins; compression is a multiplier on top. Ask what the number means before designing around it.'] },
        { says: 'A trader complains a price on screen was wrong when they clicked.', good: ['Conflated prices can be up to a quarter of a second old; the order should carry the price the trader saw, and the system checks it against the current market (a price band) before sending.'] },
        { says: 'We\'ll have 200 traders next year.', good: ['The edge server makes the line\'s load independent of the number of desktops; scale the edge servers, not the link.'] },
      ],
      diagram: [['Market data (Frankfurt)'], ['Gateway', 'filter, conflate, compress'], ['100 Mb/s line'], ['Amsterdam edge server', 'fan-out to desktops'], ['Trader and client screens'], ['Orders back', 'small, prioritised, risk-checked']],
      model: {
        components: [['Frankfurt gateway', 'Subscriptions, conflation, compression, order intake.'], ['Amsterdam edge server', 'One upstream stream, many local desktops.'], ['Order path', 'Separate, prioritised; same risk checks as internal orders.'], ['Security', 'TLS, authentication, per-client permissions and limits.'], ['Snapshot on reconnect', 'Clean recovery after link failures.']],
        numbers: [['Raw feed', '~400 Mb/s at peak'], ['Line', '100 Mb/s'], ['Conflated', '2,000 × 4/s × 100 B ≈ 6.4 Mb/s'], ['Round trip Amsterdam–Frankfurt', '~4–5 ms by fibre: irrelevant for human trading']],
        tradeoffs: ['Conflation drops intermediate prices: fine for people, wrong for algorithms.', 'A bigger line is simpler but costs every month; processing in Frankfurt costs once.', 'Cancelling client orders on disconnect is safer; keeping them is friendlier. Make it a clear, documented choice.'],
      },
    },
  ];

  QT.design = { PROBLEMS, RUBRIC, SYS_RUBRIC, REPORTS, GUIDE, byId: (id) => PROBLEMS.find((p) => p.id === id) };
})();
