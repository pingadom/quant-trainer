// The Optiver interview 2 study guide (#/code/round2/guide[/<module>]): the knowledge underneath the
// system design role-play and the live coding challenge. Each module teaches, then checks (our own
// questions; numeric answers re-derived in research/verify_round2.py), then points at practice:
// free LeetCode problems (checked against LeetCode's data on 25 Nov 2026), the quant dev handbook
// chapters (whose LeetCode lists are shown with them), and the app's own mocks.
(function () {
  const MODULES = [
    {
      id: 'markets', title: 'How exchanges and trading work, for engineers',
      why: 'The role-play says no trading knowledge is needed, but knowing the vocabulary lets you ask sharper questions and understand the requirements the interviewer gives you. Live coding problems are built from these objects: orders, books, fills, positions.',
      sections: [
        ['Orders and the order book', `<p>An exchange keeps, for each instrument, an <b>order book</b>: the <b>bids</b> (orders to buy, each with a price and size) and the <b>asks</b> or offers (orders to sell). The highest bid and the lowest ask are the <b>best bid and offer</b>; the gap between them is the <b>spread</b>. Prices move in fixed steps called <b>ticks</b> (say 0.01), so engineers store prices as integers counting ticks, never as floats.</p>
          <ul><li>A <b>limit order</b> says "buy up to 100 at 10.00 or better". If it can't trade now, it <b>rests</b> in the book.</li>
          <li>A <b>market order</b> says "buy 100 at whatever the book offers": it walks the asks from the best price until filled.</li>
          <li><b>Cancel</b> removes a resting order; <b>modify</b> changes it (reducing size usually keeps its place in the queue; changing price loses it).</li>
          <li><b>IOC</b> (immediate or cancel): trade what you can now, cancel the rest.</li></ul>`],
        ['Matching: price-time priority', `<p>When a new order can trade against resting ones, the exchange <b>matches</b> it: best price first, and at the same price, the oldest order first (<b>price-time priority</b>). A trade happens at the <b>resting</b> order's price. A big order can <b>partially fill</b> against several resting orders.</p>
          <p><b>Example.</b> Asks: 100 at 10.00, 150 at 10.01, 200 at 10.02. A market buy for 300 takes all 100 at 10.00, all 150 at 10.01, and 50 at 10.02. It pays 1,000.00 + 1,501.50 + 501.00 = 3,002.50, an average of about 10.0083.</p>`],
        ['Fills, positions and P&L', `<p>The exchange reports each trade back to the firm as an <b>execution report</b> (a fill). From fills the firm keeps its <b>position</b> per instrument (shares owned; negative means short) and its <b>P&amp;L</b>: <b>realised</b> when a position is closed (sell price − buy price), <b>unrealised</b> (or mark-to-market) for open positions at the current price. FIFO (first in, first out) closes the oldest open shares first.</p>
          <p><b>Market makers</b> (Optiver's business) quote both a bid and an ask continuously and earn the spread, while managing the risk of the position they build up. That's why risk limits, fast cancels and accurate positions are central to every system there.</p>`],
      ],
      say: ['"I\'ll store prices as integer ticks so comparisons are exact."', '"A trade happens at the resting order\'s price, best price first, then oldest first."', '"Positions come from fills, not from orders: an order isn\'t a position until it trades."'],
      checks: [
        { id: 'mk-1', q: 'Best bid 99.98, best ask 100.02, with a tick of 0.01. How many ticks wide is the spread?', a: 4, tol: { abs: 0.01 }, sol: '100.02 − 99.98 = 0.04, which is <b>4</b> ticks. In ticks as integers: 10,002 − 9,998 = 4.' },
        { id: 'mk-2', q: 'Asks: 100 at 10.00, 150 at 10.01, 200 at 10.02. What does a market buy of 300 pay in total?', a: 3002.5, tol: { abs: 0.005 }, sol: '100 × 10.00 + 150 × 10.01 + 50 × 10.02 = 1,000 + 1,501.50 + 501.00 = <b>3,002.50</b>.' },
        { id: 'mk-3', q: 'You buy 100 at 50, buy 100 at 52, then sell 150 at 53. What is the realised P&L under FIFO?', a: 350, tol: { abs: 0.01 }, sol: 'The sale closes the 100 bought at 50 first (+3 each, 300), then 50 of the 100 bought at 52 (+1 each, 50): <b>350</b>. Closing the newest first (LIFO) would give 100 × 1 + 50 × 3 = 250.' },
        { id: 'mk-4', q: 'At the same price, which resting order fills first?', opts: [['The one that arrived first'], ['The largest one', 'Some exchanges allocate by size (pro-rata), but price-time priority, the common rule, is oldest first.'], ['A random one', 'Matching is deterministic.'], ['The one closest to the mid price', 'All orders at one level have the same price.']], sol: 'Price-time priority: best price, then earliest arrival.' },
      ],
      leetcode: [[1801, 'Number of Orders in the Backlog', 'number-of-orders-in-the-backlog', 'Medium', 'A small matching engine with two heaps'], [121, 'Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'Easy', 'Profit from one buy and one later sell'], [2034, 'Stock Price Fluctuation', 'stock-price-fluctuation', 'Medium', 'Price corrections, latest, max and min']],
      links: [['Live coding mock: position keeper', '#/code/round2/live/positions'], ['Limit order book problem', '#/code/opt-order-book'], ['Handbook: market making', '#/handbook/market-making']],
      devbook: [],
    },
    {
      id: 'anatomy', title: 'The anatomy of a trading system',
      why: 'Nearly every system design prompt at a trading firm is a variation on the same pipeline. Knowing its standard parts means you spend the interview on the requirements and trade-offs, not on inventing the shape.',
      sections: [
        ['The pipeline', `<ol><li><b>Market data in</b>: the exchange publishes updates (usually UDP multicast). A <b>feed handler</b> decodes them, checks sequence numbers and builds the <b>order book</b> in memory.</li>
          <li><b>Strategy</b>: reads the book and decides what to trade.</li>
          <li><b>Pre-trade risk</b>: checks every order (size, price band, position limit, message rate) before it leaves.</li>
          <li><b>Order gateway</b> (part of an order management system, OMS): holds the session with the exchange, tracks each order's state.</li>
          <li><b>Execution reports back</b>: fills update <b>positions and P&amp;L</b>.</li>
          <li><b>Around it</b>: a <b>recorder</b> (every message, for audit and replay), <b>monitoring and alerts</b>, a <b>kill switch</b>, a <b>user interface</b> for traders, and <b>storage</b>.</li></ol>
          <p>The first five are the <b>hot path</b>: they must be fast and are usually in one process on dedicated cores, colocated at the exchange. Everything around it must never slow the hot path down.</p>`],
        ['The order lifecycle', `<p>Each order is a small state machine, tracked by the firm's own <b>client order id</b>:</p>
          <p><code>pending new → acknowledged (live) → partially filled → filled</code>, or <code>→ cancelled</code> / <code>→ rejected</code>, with <code>pending cancel</code> and <code>pending replace</code> in between.</p>
          <p>Messages are asynchronous: a cancel can cross with a fill, so "I sent a cancel" doesn't mean "it's cancelled" until the exchange confirms.</p>`],
        ['Connecting to an exchange', `<ul><li><b>Market data</b>: UDP multicast, often two identical feeds (A and B) for redundancy, with sequence numbers; a snapshot or retransmission service for recovery.</li>
          <li><b>Order entry</b>: a TCP session (FIX, or the exchange's binary protocol) with logon, heartbeats and sequence numbers; resend requests fill gaps after reconnecting.</li>
          <li><b>Cancel-on-disconnect</b>: an exchange setting that cancels your open orders if your session drops.</li>
          <li><b>Drop copy</b>: a separate feed of all your executions, used to reconcile.</li>
          <li><b>Colocation</b>: renting space in the exchange's data centre, metres from its matching engine.</li></ul>`],
      ],
      say: ['"Let me separate the hot path (data in, decide, risk, order out) from the rest (recording, UI, monitoring)."', '"Every order gets our own id and a state machine, because messages are asynchronous."', '"Risk checks sit between the strategy and the exchange, independent of the strategy\'s code."'],
      checks: [
        { id: 'an-1', q: 'Which component should be able to stop all trading even if the strategy is broken?', opts: [['The risk layer / gateway, with a kill switch'], ['The strategy itself', 'A broken strategy can\'t be trusted to stop itself.'], ['The recorder', 'It only observes.'], ['The trader UI', 'The UI sends the command, but enforcement must sit on the order path.']], sol: 'The kill switch is enforced where every order must pass: the risk layer or gateway. It cancels open orders and blocks new ones.' },
        { id: 'an-2', q: 'We sent a cancel and then received a fill for the same order. What happened?', opts: [['The order filled before the cancel arrived; the cancel will be rejected as too late'], ['The exchange made an error', 'This is normal: messages cross.'], ['The fill should be ignored', 'Never ignore a fill: it changes your position.'], ['The order is now cancelled and filled', 'An order can\'t be both; the fill came first.']], sol: 'Messages cross in flight. The state machine accepts the fill and treats the cancel as too late.' },
        { id: 'an-3', q: 'Why is a database usually kept out of the hot path?', opts: [['Writes to disk and network round trips add milliseconds and unpredictable delays'], ['Databases can\'t store prices', 'They can; the problem is latency.'], ['Regulators forbid it', 'Regulators require records, which a recorder provides off the hot path.'], ['Databases are always eventually consistent', 'Many aren\'t; the issue is speed.']], sol: 'The hot path keeps state in memory; a recorder logs asynchronously; databases serve reporting and history.' },
      ],
      leetcode: [[1656, 'Design an Ordered Stream', 'design-an-ordered-stream', 'Easy', 'Release items in sequence order as gaps fill: a feed handler in miniature'], [1797, 'Design Authentication Manager', 'design-authentication-manager', 'Medium', 'State with expiry, like sessions and heartbeats']],
      links: [['Role-play: trading BMW in Frankfurt', '#/code/design/sd-frankfurt'], ['Fundamentals: the hot path', '#/code/screening/fundamentals'], ['Design discussion: feed handler', '#/code/design/d-feed-handler']],
      devbook: ['dsa-streaming'],
    },
    {
      id: 'requirements', title: 'Requirements and back-of-envelope numbers',
      why: 'The role-play is explicitly about asking the right questions. Then numbers turn the answers into decisions: is one server enough? does it fit the link? how much disk a day?',
      sections: [
        ['The questions, in five groups', `<ol><li><b>Purpose and users</b>: what are we trading, who uses it, automated or manual?</li>
          <li><b>Scale</b>: updates per second (average and peak), orders per second, number of instruments, growth.</li>
          <li><b>Speed</b>: does latency matter, and how much: microseconds, milliseconds, seconds? Are we competing on it?</li>
          <li><b>Failure</b>: what does it cost if it's down or wrong? Are there rules (kill switch, rate limits, record keeping)?</li>
          <li><b>Constraints</b>: budget, team, locations, existing systems, deadline.</li></ol>
          <p>Ask, write the answers down, and <b>play them back</b> before designing: "So: automated, latency-sensitive, 50k updates/s peak, a few hundred orders/s, kill switch required, small budget."</p>`],
        ['The arithmetic', `<ul><li><b>Bandwidth</b> = messages/s × bytes per message. 50,000 × 64 B = 3.2 MB/s = 25.6 Mb/s.</li>
          <li><b>Storage</b> = rate × size × time. 2,000 messages/s × 64 B over an 8.5-hour day (30,600 s) ≈ 3.9 GB a day.</li>
          <li><b>Latency from distance</b>: 5 µs per km of fibre, each way.</li>
          <li><b>Capacity</b>: if each message takes 25 µs to process, one core handles 40,000 a second; at 50,000 a second the backlog grows by 10,000 a second.</li>
          <li><b>Availability</b>: 99.99% uptime over a year allows about 53 minutes of downtime.</li></ul>
          <p>Round freely and say the assumption out loud; the interviewer cares about the reasoning and the order of magnitude.</p>`],
      ],
      say: ['"Before I design anything, can I ask a few questions about scale, speed and what happens when it fails?"', '"Let me play that back to check I\'ve got it right."', '"Quick estimate: 50,000 messages a second at 64 bytes is about 26 megabits a second, so bandwidth isn\'t the problem; latency is."'],
      checks: [
        { id: 'rq-1', q: '2,000 messages a second, 64 bytes each, over an 8.5-hour trading day: how many GB? (1 GB = 10⁹ bytes; 1 decimal place.)', a: 3.9, tol: { abs: 0.05 }, sol: '2,000 × 64 × 30,600 s = 3,916,800,000 bytes ≈ <b>3.9 GB</b>.' },
        { id: 'rq-2', q: 'Processing takes 25 µs per message and 50,000 arrive per second. By how many messages a second does the backlog grow?', a: 10000, tol: { abs: 1 }, sol: 'Capacity = 1 / 25 µs = 40,000 a second. 50,000 − 40,000 = <b>10,000</b> a second: the queue grows without limit until the burst ends. Split the work or make it faster.' },
        { id: 'rq-3', q: '99.99% availability over a 365-day year allows how many minutes of downtime? (1 decimal place.)', a: 52.6, tol: { abs: 0.1 }, sol: '365 × 24 × 60 = 525,600 minutes × 0.0001 = <b>52.6</b> minutes.' },
        { id: 'rq-4', q: 'One-way fibre latency over 363 km (Amsterdam to Frankfurt in a straight line), in milliseconds? (2 decimal places.)', a: 1.82, tol: { abs: 0.01 }, sol: '363 × 5 µs = 1,815 µs ≈ <b>1.82 ms</b>; real routes are longer, so ~2–2.5 ms.' },
      ],
      leetcode: [],
      links: [['Fundamentals: latency numbers', '#/code/screening/fundamentals/sheet'], ['Estimation practice (Fermi questions)', '#/estimate']],
      devbook: [],
    },
    {
      id: 'building-blocks', title: 'System design building blocks',
      why: 'Every design is assembled from a few standard pieces. Knowing what each costs, and when it\'s wrong for trading, is what interviewers probe.',
      sections: [
        ['State and where it lives', `<ul><li><b>In memory</b> in the process that uses it: fastest (nanoseconds), lost on a crash unless rebuilt from a log.</li>
          <li><b>A write-ahead log</b>: append every event to disk (or another machine) before or as you act on it; replaying it rebuilds the state. The foundation of crash recovery.</li>
          <li><b>A database</b>: durable, queryable, but milliseconds per write. For history, reports and configuration, not the hot path.</li>
          <li><b>A cache</b>: a fast copy of slow data. Needs an eviction policy (LRU) and a rule for staleness.</li></ul>`],
        ['Moving data between components', `<ul><li><b>Function calls in one process</b>: fastest; the hot path.</li>
          <li><b>Shared memory and lock-free ring buffers</b>: between processes or threads on one machine, sub-microsecond.</li>
          <li><b>Queues / message brokers</b> (Kafka and similar): durable, decouple producers and consumers, replayable; add milliseconds. Good for recording, analytics and non-urgent work.</li>
          <li><b>Publish/subscribe and multicast</b>: one sender, many receivers; consumers subscribe to what they need.</li>
          <li><b>Conflation</b>: keep only the latest value per key for slow consumers (screens).</li></ul>`],
        ['Scaling and redundancy', `<ul><li><b>Partitioning</b> (sharding): split by a key (instrument, account) so each part is independent; watch for hot keys.</li>
          <li><b>Replication</b>: copies on other machines. <b>Active–passive</b>: a standby takes over (simple, some downtime). <b>Active–active</b>: both work (no downtime, but harder to keep consistent).</li>
          <li><b>Stateless services</b> scale by adding copies behind a load balancer; <b>stateful</b> ones (an order book, an inventory) need a single owner per partition.</li>
          <li><b>Batching</b> raises throughput but adds latency; <b>compression</b> saves bandwidth but costs CPU.</li></ul>`],
      ],
      say: ['"I\'ll keep the book in memory and rebuild it from the log if we restart."', '"Kafka is great for recording and research, but I wouldn\'t put it on the order path: it adds milliseconds."', '"Each instrument has a single owner thread, so there\'s no locking on the book."'],
      checks: [
        { id: 'bb-1', q: 'Which fits the trading hot path?', opts: [['In-memory state, updated by one thread, with an asynchronous log'], ['A relational database written on every update', 'Too slow and unpredictable for the hot path.'], ['A message broker between every component', 'Adds milliseconds per hop.'], ['A cache in front of a database', 'Still depends on the slow database for writes.']], sol: 'In memory with a single writer is fast and simple; the asynchronous log gives durability without slowing it down.' },
        { id: 'bb-2', q: 'Screens can\'t keep up with 100,000 price updates a second. What\'s the standard fix?', opts: [['Conflate: send each screen only the latest value per instrument, a few times a second'], ['Buffer every update until the screen catches up', 'The buffer grows without limit during a burst.'], ['Drop random updates', 'You could drop the latest one and show a stale price.'], ['Slow down the market data feed', 'Everyone else needs it at full speed.']], sol: 'Conflation keeps screens current with bounded work: intermediate prices are skipped, which humans don\'t need.' },
        { id: 'bb-3', q: 'Why does an order book usually have a single owner thread rather than a lock?', opts: [['No lock contention, and a clear order of events'], ['Python can\'t lock dictionaries', 'It can; the point is speed and simplicity.'], ['Locks are not allowed in trading systems', 'They\'re used, just not on the hottest data.'], ['It uses less memory', 'Memory isn\'t the reason.']], sol: 'A single writer processes events in order with no locking; other threads send it messages.' },
      ],
      leetcode: [[146, 'LRU Cache', 'lru-cache', 'Medium', 'A cache with eviction'], [622, 'Design Circular Queue', 'design-circular-queue', 'Medium', 'A ring buffer between components'], [355, 'Design Twitter', 'design-twitter', 'Medium', 'Publish/subscribe fan-out and merging feeds'], [981, 'Time Based Key-Value Store', 'time-based-key-value-store', 'Medium', 'Versioned state: the value as of a time'], [1348, 'Tweet Counts Per Frequency', 'tweet-counts-per-frequency', 'Medium', 'Bucketing events by time, like bars']],
      links: [['Role-play: prices from several exchanges', '#/code/design/sd-multi-prices'], ['Role-play: market data platform', '#/code/design/sd-market-data'], ['Design discussion: LRU cache', '#/code/design/d-lru']],
      devbook: ['dsa-hashing', 'dsa-linked'],
    },
    {
      id: 'reliability', title: 'Reliability: failures, recovery and safety',
      why: 'Trading systems are judged by what happens when something goes wrong. The interviewer\'s curveballs are mostly failures: disconnects, lost data, crashes, runaway bugs.',
      sections: [
        ['Detect, contain, recover', `<p>For every failure, answer three questions out loud: <b>how do we notice</b> (sequence gaps, heartbeats, timeouts, monitoring), <b>what happens automatically</b> (stop trading the affected instrument, cancel orders, fail over), and <b>what does a person decide</b> (resume, restart, call the exchange).</p>
          <table class="hb-table"><tr><th>Failure</th><th>Detect</th><th>Contain and recover</th></tr>
            <tr><td>Market data gap</td><td>Sequence numbers</td><td>Mark the book stale, stop trading it; recover from the B feed, retransmission or a snapshot</td></tr>
            <tr><td>Order session drops</td><td>Heartbeats / TCP error</td><td>Cancel-on-disconnect; reconnect; resend request; reconcile before trading</td></tr>
            <tr><td>Process crash</td><td>Health checks</td><td>Rebuild from the log and the exchange's records; standby takes over</td></tr>
            <tr><td>Runaway strategy</td><td>Rate, reject and loss limits</td><td>Risk layer rejects; kill switch cancels all and blocks</td></tr>
            <tr><td>Duplicate message</td><td>Ids / sequence numbers</td><td>Deduplicate: apply each once</td></tr></table>`],
        ['Exactly once, in practice', `<p>Networks deliver messages zero, one or several times. "Exactly once" is built from <b>at-least-once delivery</b> (retries, resends) plus <b>idempotent handling</b> (sequence numbers or unique ids, so a repeat is recognised and ignored). For orders: a unique client order id means a resent order can't be placed twice.</p>`],
        ['Reconciliation and safe deployment', `<p><b>Reconcile</b>: compare your view (orders, positions) with the exchange's (drop copy, end-of-day reports) and alert on any difference. <b>Deploy safely</b>: test against recorded data and the exchange's test environment, release outside trading hours, start with small limits, keep a fast rollback.</p>`],
      ],
      say: ['"For each failure: how we detect it, what happens automatically, and what a human decides."', '"I\'d rather stop trading on a stale book than trade on wrong prices."', '"Retries plus deduplication by id give us exactly-once processing."'],
      checks: [
        { id: 'rl-1', q: 'A resent order must not be placed twice. What makes that safe?', opts: [['A unique client order id the exchange (or our gateway) recognises'], ['Waiting longer before resending', 'Delays don\'t prevent duplicates.'], ['Using UDP instead of TCP', 'UDP gives fewer guarantees, not more.'], ['Sending it to two exchanges', 'That doubles the risk.']], sol: 'Idempotency: the same id means the same order, so a repeat is rejected or ignored.' },
        { id: 'rl-2', q: 'After a crash, the restarted system\'s positions disagree with the exchange\'s drop copy. Which do you trust?', opts: [['The exchange\'s records; halt trading in the affected instruments and investigate'], ['Our own log, because we wrote it', 'We may have missed fills while down.'], ['The average of the two', 'Positions aren\'t averaged.'], ['Whichever is smaller', 'That\'s a guess, not a reconciliation.']], sol: 'The exchange is the source of truth for what traded. Stop, reconcile, then resume.' },
      ],
      leetcode: [[1656, 'Design an Ordered Stream', 'design-an-ordered-stream', 'Easy', 'Apply in order once the gap fills'], [1472, 'Design Browser History', 'design-browser-history', 'Medium', 'State you can step back through, like replaying a log']],
      links: [['Live coding mock: order book from a feed (sequence numbers)', '#/code/round2/live/feed'], ['Live coding mock: risk gate (kill switch)', '#/code/round2/live/risk'], ['Role-play: orders and confirmations', '#/code/design/sd-order-flow'], ['Deployment plans (tech screening)', '#/code/screening']],
      devbook: [],
    },
    {
      id: 'networking', title: 'Networking for trading systems',
      why: 'Candidates report follow-ups on network latency, bandwidth and compression, and TCP against UDP comes up again and again.',
      sections: [
        ['TCP or UDP', `<p><b>TCP</b>: a reliable, ordered byte stream with a handshake, acknowledgements and retransmission; a lost packet stalls everything after it until it's resent. Use it where every message must arrive in order: <b>orders</b>. <b>UDP</b>: independent datagrams, no guarantees, no handshake. With <b>multicast</b>, one packet reaches every subscriber: ideal for <b>market data</b>, with sequence numbers to detect loss.</p>`],
        ['Latency, bandwidth and the speed of light', `<p><b>Latency</b> is how long one message takes; <b>bandwidth</b> is how much data per second. Small orders care about latency, which comes from distance (5 µs per km of fibre), switches, and software (the kernel's network stack adds microseconds; <b>kernel bypass</b> removes it). Bandwidth matters for market data bursts and links between offices.</p>
          <p>Between cities, <b>microwave</b> links beat fibre because radio in air travels near the speed of light in straighter lines, at the cost of bandwidth and weather sensitivity.</p>`],
        ['Fitting data through a link', `<ol><li><b>Filter</b>: send only what someone subscribed to.</li><li><b>Conflate</b>: latest value per key at a fixed rate.</li><li><b>Encode compactly</b>: binary, fixed layouts, deltas against the last value.</li><li><b>Compress</b>: a general compressor on top.</li></ol>
          <p>Example: 2,000 instruments × 4 updates a second × 100 bytes = 6.4 Mb/s, against hundreds of Mb/s raw.</p>`],
      ],
      say: ['"Market data over UDP multicast with sequence numbers; orders over TCP."', '"The round trip from Amsterdam to Frankfurt is several milliseconds; colocated competitors are tens of microseconds away, so we colocate."', '"Before compressing, I\'d filter and conflate: they shrink it far more."'],
      checks: [
        { id: 'nw-1', q: '2,000 instruments, 4 updates a second each, 100 bytes per update: how many Mb/s?', a: 6.4, tol: { abs: 0.05 }, sol: '2,000 × 4 × 100 = 800,000 bytes/s × 8 = <b>6.4 Mb/s</b>.' },
        { id: 'nw-2', q: 'Why does a lost TCP packet delay messages that arrived after it?', opts: [['TCP delivers bytes in order, so later data waits for the retransmission'], ['TCP sends packets one at a time', 'It sends many in flight.'], ['The receiver must acknowledge every byte first', 'Acknowledgements don\'t block delivery of earlier data.'], ['UDP is used underneath', 'TCP runs on IP, not UDP.']], sol: 'Head-of-line blocking: the ordered stream can\'t deliver later bytes until the gap is filled.' },
      ],
      leetcode: [[468, 'Validate IP Address', 'validate-ip-address', 'Medium', 'IPv4 and IPv6 formats'], [535, 'Encode and Decode TinyURL', 'encode-and-decode-tinyurl', 'Medium', 'A small service: keys, collisions, storage']],
      links: [['Fundamentals: networking', '#/code/screening/fundamentals/networking'], ['Role-play: a narrow link between offices', '#/code/design/sd-remote-desk']],
      devbook: [],
    },
    {
      id: 'concurrency', title: 'Concurrency in practice',
      why: 'Candidates report concurrency follow-ups that stumped them, such as two parts of the system selling the same shares. Know the failure modes and the standard designs.',
      sections: [
        ['What goes wrong', `<ul><li><b>Race condition</b>: two threads read, decide and write the same state; one update is lost or a rule is broken (both see 100 shares and both sell 100).</li>
          <li><b>Deadlock</b>: threads each hold a lock the other needs. Avoid by taking locks in one fixed order.</li>
          <li><b>Contention</b>: many threads queue for one lock; adding threads makes it slower.</li></ul>`],
        ['The designs that avoid it', `<ul><li><b>Single writer</b>: one thread owns a piece of state; others send it requests through a queue. No locks on the state.</li>
          <li><b>Check and reserve atomically</b>: "is there enough? then take it" must be one indivisible step (inside the owner thread, or under one lock).</li>
          <li><b>Partition</b>: one owner per instrument or account, so parts run in parallel without sharing.</li>
          <li><b>Producer–consumer queues</b> between stages; lock-free ring buffers when microseconds matter.</li>
          <li><b>In Python</b>: the GIL lets one thread run Python at a time, so threads help I/O, not CPU; and even with the GIL, a read-modify-write across several bytecodes isn't atomic.</li></ul>`],
      ],
      say: ['"Two strategies could both spend the same shares, so one component owns the inventory and does check-and-reserve atomically."', '"I\'d partition by instrument: each partition has one owner, so no global lock."'],
      checks: [
        { id: 'cc-1', q: 'Two threads each sell 100 shares after checking that 100 are available. What design prevents overselling?', opts: [['One owner of the inventory that checks and reserves in one step'], ['Each thread checks twice', 'Both can still pass the check before either sells.'], ['A sleep between the check and the sell', 'Timing tricks don\'t remove races.'], ['More threads', 'More threads make the race likelier.']], sol: 'Check-and-reserve must be atomic: a single owner (or one lock around both steps) guarantees it.' },
        { id: 'cc-2', q: 'A job is 20% serial. What is the most it can speed up on any number of cores?', a: 5, tol: { abs: 0.01 }, sol: 'Amdahl\'s law: at most 1/0.2 = <b>5×</b>.' },
      ],
      leetcode: [[1114, 'Print in Order', 'print-in-order', 'Easy', 'Make threads wait for each other'], [1226, 'The Dining Philosophers', 'the-dining-philosophers', 'Medium', 'Deadlock and lock ordering'], [1195, 'Fizz Buzz Multithreaded', 'fizz-buzz-multithreaded', 'Medium', 'Several threads sharing one counter'], [1117, 'Building H2O', 'building-h2o', 'Medium', 'Releasing threads in groups']],
      links: [['Fundamentals: concurrency', '#/code/screening/fundamentals/concurrency'], ['Role-play: never selling what we don\'t have', '#/code/design/sd-order-flow']],
      devbook: [],
    },
    {
      id: 'class-design', title: 'Live coding: designing a class under pressure',
      why: 'The live coding is a practical trading problem: almost always a class whose methods handle a stream of events, extended in stages. The skill is choosing the state, writing it cleanly, and keeping it easy to extend.',
      sections: [
        ['From the statement to the state', `<ol><li>List the methods and what each returns.</li><li>Ask what each one needs to <b>know</b>: that's your state. "position(symbol)" needs a running position per symbol; "realised(symbol)" with FIFO needs the open lots in order.</li><li>Pick the structure for the hottest operation: dict for lookups by key, deque for oldest-first, heap for "best/next", sorted list for ordered levels.</li><li>Write down the <b>invariants</b>: "the sum of open lots equals the position"; "all open lots have the same sign".</li></ol>`],
        ['Writing it', `<ul><li>Small methods with clear names; a helper for anything done twice.</li><li>Run the given example as soon as one method works.</li><li>Handle the edges the statement mentions (unknown symbol, empty side, duplicate id) explicitly.</li><li>Keep each part's code extendable: part 2 will add a requirement, and you'll start from what you wrote.</li></ul>`],
        ['Testing, out loud', `<p>Trace one normal case and one nasty case (a flip from long to short, a duplicate message, an empty book). Say how you'd unit-test it: "a test per rule, plus a random comparison against a slow, obviously correct version". Then the costs: what each method is in big-O and what breaks first at 100× the data.</p>`],
      ],
      say: ['"Before I type: here\'s the state I\'ll keep and why."', '"Let me run the example now, before I go further."', '"This method is O(1) amortised because each lot is added once and removed once."'],
      checks: [
        { id: 'cd-1', q: 'A class must answer "best bid" after every update, with thousands of price levels. Which structure?', opts: [['A sorted structure or a heap of prices, so the best is at one end'], ['A dict, scanning with max() on each call', 'O(levels) per call: too slow at thousands of levels.'], ['A list of every order, sorted on each call', 'O(n log n) per call.'], ['A set of prices', 'Sets aren\'t ordered.']], sol: 'Keep the prices ordered (heap with lazy deletion, or bisect on a sorted list) so the best is O(1) or O(log n).' },
        { id: 'cd-2', q: 'Fills must close the oldest open shares first. Which structure holds the open lots?', opts: [['A deque per symbol, oldest at the front'], ['A stack per symbol', 'A stack closes the newest first (LIFO).'], ['A heap by price', 'That closes by price, not by age.'], ['One running average price', 'That\'s average-cost accounting, not FIFO.']], sol: 'FIFO is a queue: append new lots, consume from the front.' },
      ],
      leetcode: [[380, 'Insert Delete GetRandom O(1)', 'insert-delete-getrandom-o1', 'Medium', 'Combining structures for O(1) everything'], [2353, 'Design a Food Rating System', 'design-a-food-rating-system', 'Medium', 'Best item per category under updates: heaps with lazy deletion'], [2349, 'Design a Number Container System', 'design-a-number-container-system', 'Medium', 'Smallest index per value under changes'], [1845, 'Seat Reservation Manager', 'seat-reservation-manager', 'Medium', 'Allocate the lowest free item'], [155, 'Min Stack', 'min-stack', 'Medium', 'Extra state alongside a structure']],
      links: [['Live coding mock: position keeper', '#/code/round2/live/positions'], ['Live coding mock: order book from a feed', '#/code/round2/live/feed'], ['Live coding mock: risk gate', '#/code/round2/live/risk'], ['Optiver-style class problems', '#/code']],
      devbook: ['dsa-python', 'dsa-interview'],
    },
    {
      id: 'techniques', title: 'The algorithms trading problems use',
      why: 'Practical trading problems lean on a handful of techniques again and again. Recognising which one a problem needs is most of the work.',
      sections: [
        ['Pattern → technique', `<table class="hb-table"><tr><th>When the problem says…</th><th>Reach for</th></tr>
          <tr><td>"in the last N seconds", "rolling", "per minute"</td><td>Sliding window with a deque; running sums</td></tr>
          <tr><td>"best price", "next event", "top k"</td><td>Heap (with lazy deletion for cancels)</td></tr>
          <tr><td>"oldest first", "in arrival order"</td><td>Queue (deque)</td></tr>
          <tr><td>"by id", "per symbol"</td><td>Hash map</td></tr>
          <tr><td>"in price order", "levels", "range of times"</td><td>Sorted list + bisect</td></tr>
          <tr><td>"previous higher price", "span"</td><td>Monotonic stack</td></tr>
          <tr><td>"total between two times"</td><td>Prefix sums</td></tr>
          <tr><td>"overlapping", "how many at once"</td><td>Sort by time; sweep line</td></tr></table>`],
        ['Amortised costs', `<p>Many of these are O(1) <b>amortised</b>: an item is pushed once and popped once, so a call that pops many is paid for by earlier cheap calls. Say it explicitly in the interview; it's a common follow-up.</p>`],
      ],
      say: ['"This is a sliding window over time, so a deque of timestamps."', '"Cancels make the heap stale, so I\'ll delete lazily and skip dead entries at the top."'],
      checks: [
        { id: 'tq-1', q: 'Count the orders accepted in the last second, with a call per order (t increasing). What structure gives O(1) amortised?', opts: [['A deque of times, dropping those older than t − 1000 from the front'], ['A list, filtered on every call', 'O(n) per call.'], ['A heap of times', 'Works, but O(log n) and more complex than needed.'], ['A counter reset every second', 'A fixed bucket isn\'t the same as a sliding window.']], sol: 'Times arrive in order, so the oldest are at the front: a deque.' },
      ],
      leetcode: [[239, 'Sliding Window Maximum', 'sliding-window-maximum', 'Hard', 'Monotonic deque'], [295, 'Find Median from Data Stream', 'find-median-from-data-stream', 'Hard', 'Two heaps on a stream'], [901, 'Online Stock Span', 'online-stock-span', 'Medium', 'Monotonic stack on prices'], [1882, 'Process Tasks Using Servers', 'process-tasks-using-servers', 'Medium', 'Two heaps and time: a scheduler'], [1834, 'Single-Threaded CPU', 'single-threaded-cpu', 'Medium', 'Simulating a queue of events in time order']],
      links: [['Quant dev handbook', '#/devbook']],
      devbook: ['dsa-window', 'dsa-heaps', 'dsa-stacks', 'dsa-binsearch'],
    },
    {
      id: 'communication', title: 'Communication: how both interviews are judged',
      why: 'The invitation says it directly: they\'re interested in how you approach the problem and your ability to communicate your thought process clearly and concisely. In the role-play, asking the right questions is the task itself.',
      sections: [
        ['In the role-play', `<ul><li>Act as the CTO: you lead. Restate the goal, ask, summarise, propose, check in ("does this match what you need?").</li>
          <li>Draw as you talk: boxes and arrows, labelled, left to right in the order data flows.</li>
          <li>Give a simple version first, then improve it. Candidates who did well said to keep it simple and explain it clearly.</li>
          <li>When the interviewer pushes back, treat it as new information: "good point; then I'd change X because Y".</li></ul>`],
        ['In the live coding', `<ul><li>Narrate decisions, not keystrokes: "I'm using a deque here because…".</li>
          <li>If stuck, say what you're considering and ask a focused question.</li>
          <li>Leave a few minutes for testing and for "what would you change for production?".</li></ul>`],
        ['Your questions for them', `<p>Prepare two per interviewer: about the team's systems ("how do you test changes to the trading path?"), the internship ("what did last year's interns ship?"), or something from the conversation. It shows interest and ends the hour well.</p>`],
      ],
      say: ['"Let me start simple and then make it robust."', '"Does that match what you had in mind, or should I focus on a different part?"'],
      checks: [
        { id: 'cm-1', q: 'Ten minutes into the role-play you realise you haven\'t asked about latency. What do you do?', opts: [['Pause and ask now, and say how the answer changes the design'], ['Carry on and hope it doesn\'t matter', 'Latency decides colocation and the whole architecture.'], ['Assume the worst case silently', 'Assumptions should be said out loud.'], ['Start again from scratch', 'Adjusting is better than restarting.']], sol: 'Asking late is far better than never; saying how the answer changes things shows you understand why it matters.' },
      ],
      leetcode: [],
      links: [['Design discussions (practice talking through)', '#/code/design'], ['Stories (behavioural)', '#/stories']],
      devbook: [],
    },
  ];

  // Five days to an interview on Tuesday 1 December, or the same plan stretched over two weeks.
  const PLAN = [
    ['Wed 25 Nov', 'Modules 1–2 (markets, anatomy). Live coding mock 1, part 1.'],
    ['Thu 26 Nov', 'Module 3 (requirements and numbers). Role-play: Trading BMW in Frankfurt, out loud and recorded. Mock 1, parts 2–3.'],
    ['Fri 27 Nov', 'Modules 4–5 (building blocks, reliability). Role-play: orders and confirmations. LeetCode 1656 and 1801.'],
    ['Sat 28 Nov', 'Modules 6–7 (networking, concurrency). Live coding mock 2 (feed), all three parts in an hour.'],
    ['Sun 29 Nov', 'Modules 8–9 (class design, techniques). Role-play: prices from several exchanges. Two LeetCode design problems.'],
    ['Mon 30 Nov', 'Module 10. Live coding mock 3 (risk gate) in an hour. Redo your weakest role-play. Rapid-fire fundamentals. Then rest.'],
    ['Interview day', 'Read the fundamentals cheat sheet and the "say it" lines of each module. No new material.'],
  ];

  QT.round2Guide = { MODULES, PLAN, byId: Object.fromEntries(MODULES.map((m) => [m.id, m])) };
})();
