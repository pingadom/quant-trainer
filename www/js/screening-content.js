// Tech screening practice: code review and deployment plans. Optiver describes its 45-minute
// software engineering tech screening as reviewing a short code snippet for a real-world business
// problem, suggesting improvements, outlining a simple deployment plan, and discussing CS
// fundamentals along the way. These exercises are our own: realistic trading-firm code with planted
// problems of every kind (bugs, performance, robustness, readability, testing, operations).
// research/verify_internals.py runs every snippet: each planted bug marked `check` must really
// break the original, and the improved version must fix it.
(function () {
  // A review issue: [lines, category, severity, what's wrong, the fix, why it matters to the business]
  const I = (lines, cat, sev, what, fix, impact) => ({ lines, cat, sev, what, fix, impact });

  const EXERCISES = [
    {
      id: 'pnl-report', title: 'Daily P&L by trader', minutes: 12,
      context: 'A risk analyst wrote this to produce the end-of-day P&L for each trader from the day\'s fills. It runs as a scheduled job after the close, and its output is emailed to the desk heads. Review it as if it were a pull request.',
      code: `def pnl_by_trader(fills, totals={}):
    # fills: list of dicts with trader, side, qty, price, mark
    for f in fills:
        if f["side"] == "BUY":
            pnl = (f["mark"] - f["price"]) * f["qty"]
        else:
            pnl = (f["price"] - f["mark"]) * f["qty"]
        if f["trader"] in totals.keys():
            totals[f["trader"]] = totals[f["trader"]] + pnl
        else:
            totals[f["trader"]] = pnl
    report = ""
    for trader in sorted(totals):
        report += trader + ": " + str(round(totals[trader], 2)) + "\\n"
    return totals, report`,
      issues: [
        I('1', 'Bug', 'high', 'Mutable default argument: totals={} is created once, when the function is defined, so every call without an explicit dict adds to the previous run\'s totals. Tomorrow\'s report includes today\'s P&L.', 'Use totals=None and create a fresh dict inside, or build a new dict every time and drop the parameter.', 'Wrong P&L sent to desk heads, and it gets worse every day the job runs in the same process.'),
        I('4', 'Robustness', 'med', 'Any side other than exactly "BUY" (lower case "buy", a typo, "SHORT") is silently treated as a sell, flipping the sign of that P&L.', 'Validate the side: accept "BUY" and "SELL" (normalised), and raise or report anything else.', 'A bad record silently produces the opposite P&L instead of an error someone can see.'),
        I('5, 7', 'Correctness', 'med', 'Money in binary floating point: sums of many fills drift, and round() at the end hides but doesn\'t fix it. Equality checks against expected totals can fail.', 'Use integer ticks or cents, or decimal.Decimal, for prices and P&L.', 'Reconciliation against the clearing firm\'s numbers fails by small amounts, which wastes people\'s time chasing pennies.'),
        I('8–11', 'Readability', 'low', '"in totals.keys()" and the if/else accumulate pattern are long-winded.', 'totals[trader] = totals.get(trader, 0) + pnl, or a collections.defaultdict(float).', 'Easier to read and review; fewer places for a bug.'),
        I('12–14', 'Performance', 'low', 'Building a string with += in a loop can copy the whole string each time: quadratic in the number of traders.', 'Collect lines in a list and "\\n".join() them, or use the csv module if the output is tabular.', 'Fine for 50 traders; a habit that matters when the same pattern is used on large data.'),
        I('all', 'Testing', 'med', 'No tests, and the function mixes calculation with formatting, which makes it hard to test either.', 'Split into compute_pnl(fills) → dict and format_report(totals) → str, with unit tests for buy, sell, several traders, an empty day and calling it twice.', 'The mutable-default bug would have been caught by a test that calls it twice.'),
      ],
      improved: `from collections import defaultdict
from decimal import Decimal

SIGN = {"BUY": 1, "SELL": -1}


def pnl_by_trader(fills):
    totals = defaultdict(Decimal)
    for f in fills:
        side = f["side"].upper()
        if side not in SIGN:
            raise ValueError(f"unknown side {f['side']!r} for trader {f['trader']}")
        mark, price = Decimal(str(f["mark"])), Decimal(str(f["price"]))
        totals[f["trader"]] += SIGN[side] * (mark - price) * f["qty"]
    return dict(totals)


def format_report(totals):
    return "".join(f"{t}: {totals[t]:.2f}\\n" for t in sorted(totals))`,
      deploy: {
        ask: 'How would you roll out the fixed version of this job?',
        good: ['Unit tests for the cases above, plus a regression test: run old and new on the last month of fills and explain every difference (the differences should be exactly the mutable-default accumulation and float rounding).', 'Run the new job in parallel with the old one for a few days ("shadow mode"), comparing outputs, before switching the email to the new output.', 'Switch on a day without unusual events, with the desk heads told what changed and why the numbers move.', 'Keep the old job runnable for a quick rollback, and alert if the job fails or its total differs from the risk system\'s P&L by more than a threshold.'],
      },
      fundamentals: [
        ['Why is a mutable default argument shared between calls in Python?', 'Default values are evaluated once, when the def statement runs, and stored on the function object. Every call that uses the default gets the same dict object.'],
        ['Why does 0.1 + 0.2 != 0.3, and what do trading systems do about it?', 'Binary floating point can\'t represent most decimal fractions exactly, so sums carry tiny errors. Systems store prices as integer ticks or use decimal types, and compare floats with tolerances when they must.'],
        ['What does a dict lookup cost, and why?', 'O(1) on average: the key is hashed to find its slot in a hash table. Worst case O(n) if many keys collide.'],
      ],
    },
    {
      id: 'price-cache', title: 'Reference price cache', minutes: 12,
      context: 'Several strategy threads ask a pricing service for an instrument\'s reference price many times a second. Calls to the service are slow (around 5 ms), so a developer added this cache. Prices should be at most ttl seconds old.',
      code: `import time

class PriceCache:
    def __init__(self, fetch, ttl=1.0):
        self.fetch = fetch          # fetch(symbol) -> price, slow
        self.ttl = ttl
        self.data = {}              # symbol -> (price, time stored)

    def get(self, symbol):
        if symbol in self.data:
            price, stored = self.data[symbol]
            if stored - time.time() < self.ttl:
                return price
        try:
            price = self.fetch(symbol)
        except Exception:
            return self.data[symbol][0]
        self.data[symbol] = (price, time.time())
        return price`,
      issues: [
        I('12', 'Bug', 'high', 'The age check is backwards: stored − now is always ≤ 0, so it is always less than ttl and every cached price is returned forever. The cache never refreshes.', 'Compare now − stored > ttl to decide a price is stale, i.e. return the cached price only if now − stored < ttl.', 'Strategies trade on prices that may be hours old: direct trading losses.'),
        I('12, 18', 'Correctness', 'med', 'time.time() is wall-clock time, which can jump when the system clock is adjusted (NTP corrections), making entries look fresh or stale wrongly.', 'Use time.monotonic() for measuring ages.', 'Rare, hard-to-reproduce stale or thrashing behaviour.'),
        I('15–16', 'Robustness', 'high', 'On a fetch failure it returns the old price with no age limit and no signal to the caller, and raises KeyError if the symbol was never cached.', 'Decide a policy explicitly: re-raise, or return the old price only within a maximum staleness and mark it stale; log and count failures.', 'Silent staleness is worse than an error for a trading system: fail visibly (or fail closed).'),
        I('all', 'Concurrency', 'med', 'Many threads call get: two threads can miss at once and both call the slow fetch for the same symbol (a "thundering herd"), and the check-then-update isn\'t atomic.', 'A lock (or per-symbol lock) around the miss path, or a single refresher thread that updates prices on a schedule while readers only read.', 'Load spikes on the pricing service exactly when it is slow, making things worse.'),
        I('7', 'Operations', 'low', 'The dict grows with every symbol ever requested and never evicts.', 'Bound it (LRU with a maximum size) or evict entries older than some maximum age.', 'Slow memory growth in a long-running process.'),
        I('all', 'Testing', 'med', 'Time-dependent code with no tests; the reversed comparison would be caught immediately by a test with a fake clock.', 'Inject the clock (clock=time.monotonic) so tests can advance time deterministically.', 'Makes time-based behaviour testable without sleeps.'),
      ],
      improved: `import threading
import time

class PriceCache:
    def __init__(self, fetch, ttl=1.0, clock=time.monotonic):
        self.fetch, self.ttl, self.clock = fetch, ttl, clock
        self.data = {}
        self.lock = threading.Lock()

    def get(self, symbol):
        with self.lock:
            hit = self.data.get(symbol)
            if hit is not None and self.clock() - hit[1] < self.ttl:
                return hit[0]
            price = self.fetch(symbol)      # errors propagate: no silent staleness
            self.data[symbol] = (price, self.clock())
            return price`,
      deploy: {
        ask: 'This cache sits in front of every strategy. How do you deploy the fix safely?',
        good: ['Tests with an injected clock: fresh hit, stale refresh, fetch failure, many threads. Load-test the pricing service with the refresh traffic the fixed cache will now generate (the old one barely called it).', 'Release behind a feature flag, to one strategy or one instrument group first (a canary), watching fetch latency, error rates and cache hit rate.', 'Deploy outside trading hours, so the first real load is the open, with the team watching.', 'Rollback plan: flip the flag back. Note that rolling back reintroduces stale prices, so the better fallback is to pause the affected strategies.'],
      },
      fundamentals: [
        ['Why should elapsed time be measured with a monotonic clock?', 'Wall-clock time can jump forwards or backwards when it is corrected; a monotonic clock only moves forwards, so differences are true durations.'],
        ['Does the GIL make this cache thread-safe?', 'No. The GIL stops two threads running bytecode at the same instant, but a thread can be switched out between checking the dict and updating it, so check-then-act sequences still race. You need a lock.'],
        ['What is a thundering herd?', 'Many clients missing a cache at the same moment and all hitting the slow backend together. Fixes: a lock so one fetches and the rest wait, refreshing ahead of expiry, or jittered expiry times.'],
      ],
    },
    {
      id: 'order-check', title: 'Pre-trade order check', minutes: 10,
      context: 'Before an order is sent to the exchange, this function rejects orders that break simple rules. The exchange\'s tick size for this market is 0.01 and the firm\'s maximum order size is 1,000.',
      code: `MAX_QTY = 1000
TICK = 0.01

def check_order(order):
    errors = []
    if order["side"] not in ("BUY", "SELL"):
        errors.append("bad side")
    if order["qty"] <= 0 or order["qty"] >= MAX_QTY:
        errors.append("bad quantity")
    if order["price"] % TICK != 0:
        errors.append("price not on tick")
    return errors`,
      issues: [
        I('10', 'Bug', 'high', 'Floating-point modulo: 1.15 % 0.01 is not exactly 0 (it\'s about 0.0099999), so valid prices are rejected, and some invalid ones may pass.', 'Work in integer ticks: convert with round(price / TICK) and check that it equals price / TICK within a tiny tolerance, or keep prices as integers end to end.', 'Valid orders rejected at random-looking prices: missed trades and confused traders.'),
        I('8', 'Bug', 'med', 'qty >= MAX_QTY rejects an order of exactly 1,000, which the rule allows.', 'Use qty > MAX_QTY, and add a test at the boundary.', 'Off-by-one limits are a classic source of rejected (or worse, allowed) orders.'),
        I('8', 'Robustness', 'med', 'Doesn\'t check types: a quantity of 10.5, True (which equals 1 in Python) or a string all behave oddly.', 'Check isinstance(qty, int) and not isinstance(qty, bool), and that price is a number.', 'Pre-trade checks are the last line of defence; they should fail closed on anything unexpected.'),
        I('all', 'Design', 'med', 'Missing checks a reviewer would ask about: a price collar against a reference price, the position limit, and a kill switch. Limits are hard-coded constants.', 'Load limits from configuration per instrument; add a price-band check and a position check.', 'A fat-finger price (100 instead of 10.0) would pass every check here.'),
        I('all', 'Testing', 'low', 'No tests for boundaries (0, 1, 1,000, 1,001), off-tick prices, or bad types.', 'A table of cases with the expected errors, including prices like 1.15 that float arithmetic gets wrong.', 'Boundary tests catch both bugs above in seconds.'),
      ],
      improved: `MAX_QTY = 1000
TICK = 0.01

def check_order(order, max_qty=MAX_QTY, tick=TICK):
    errors = []
    if order.get("side") not in ("BUY", "SELL"):
        errors.append("bad side")
    qty = order.get("qty")
    if not isinstance(qty, int) or isinstance(qty, bool) or not 0 < qty <= max_qty:
        errors.append("bad quantity")
    price = order.get("price")
    ticks = price / tick if isinstance(price, (int, float)) else None
    if ticks is None or price <= 0 or abs(ticks - round(ticks)) > 1e-9:
        errors.append("price not on tick")
    return errors`,
      deploy: {
        ask: 'Pre-trade checks are safety-critical. What is your deployment plan?',
        good: ['Replay the last month of real orders through old and new checks and review every order whose result changes; each should be explained by the two bug fixes.', 'Peer review from someone on the risk or compliance side, as this is a control.', 'Deploy before the open, with traders told that some previously rejected prices will now pass.', 'Monitor reject counts by reason after deployment, and keep a one-step rollback. Never deploy a weaker check in a hurry: if in doubt, fail closed.'],
      },
      fundamentals: [
        ['Why is True a valid quantity in Python unless you check for it?', 'bool is a subclass of int, so True == 1 and isinstance(True, int) is True.'],
        ['How would you represent prices to avoid floating-point problems?', 'As integer numbers of ticks (or of the smallest currency unit), converting only at the edges for display.'],
        ['Why do pre-trade checks "fail closed"?', 'If the check can\'t decide, blocking the order costs a missed trade; letting it through could cost far more. Safety controls should default to the safe state.'],
      ],
    },
    {
      id: 'moving-average', title: 'Moving average on a price stream', minutes: 10,
      context: 'A signal uses the average of the last n trade prices. on_trade is called for every trade (tens of thousands a second in busy markets), and the returned average feeds a strategy.',
      code: `class MovingAverage:
    def __init__(self, n):
        self.n = n
        self.prices = []

    def on_trade(self, price):
        self.prices.append(price)
        if len(self.prices) > self.n + 1:
            self.prices.pop(0)
        total = 0
        for p in self.prices:
            total += p
        return total / len(self.prices)`,
      issues: [
        I('8', 'Bug', 'high', 'Off by one: it keeps up to n + 1 prices, so the "average of the last n" is really the average of the last n + 1.', 'Pop when len(self.prices) > self.n.', 'The signal is subtly wrong, and backtests of the intended signal no longer match production.'),
        I('9', 'Performance', 'med', 'list.pop(0) shifts every remaining element: O(n) per trade.', 'collections.deque(maxlen=n) drops the oldest in O(1).', 'Latency grows with the window, on the hottest path in the system.'),
        I('10–12', 'Performance', 'high', 'Re-adding the whole window on every trade is O(n) per call.', 'Keep a running sum: add the new price, subtract the one that drops out. O(1) per trade.', 'At tens of thousands of trades a second, O(n) work per trade becomes the bottleneck.'),
        I('11–12', 'Correctness', 'low', 'A running sum of floats drifts slowly over millions of updates.', 'Recompute the sum from the window occasionally, or use integer ticks.', 'Tiny but systematic error in a long-running process.'),
        I('13', 'Design', 'low', 'Before the window is full it returns an average of fewer prices without saying so.', 'Return None (or a flag) until n prices have arrived, or document the behaviour.', 'A strategy may act on a 1-price "average" at the open.'),
      ],
      improved: `from collections import deque

class MovingAverage:
    def __init__(self, n):
        self.n = n
        self.window = deque()
        self.total = 0.0

    def on_trade(self, price):
        self.window.append(price)
        self.total += price
        if len(self.window) > self.n:
            self.total -= self.window.popleft()
        return self.total / len(self.window)`,
      deploy: {
        ask: 'How do you show the new version is right and fast before it goes live?',
        good: ['A property test: random price streams through the new class and a slow obviously-correct version (average of the last n), comparing outputs to a tolerance.', 'A benchmark of on_trade latency at realistic rates and window sizes, before and after.', 'Because the fix changes the signal\'s values (n instead of n + 1 prices), tell the strategy owners and re-run their backtests: a "bug fix" can change P&L.', 'Roll out with the strategy in a monitoring-only mode first, then trading; keep the old version deployable.'],
      },
      fundamentals: [
        ['What does list.pop(0) cost and why?', 'O(n): a list is a dynamic array, so removing the front shifts every other element down.'],
        ['How is collections.deque different from a list?', 'A deque is a doubly linked list of fixed-size blocks: O(1) append and pop at both ends, but O(n) indexing in the middle.'],
        ['Why does floating-point summation drift?', 'Each addition rounds to the nearest representable value; the rounding errors accumulate. Kahan summation or periodic recomputation reduces it.'],
      ],
    },
    {
      id: 'order-retry', title: 'Retrying order sends', minutes: 12,
      context: 'Sending an order to the exchange gateway sometimes times out. A developer wrapped the send in this retry helper so that "orders always get through".',
      code: `import time

def send_with_retry(gateway, order):
    while True:
        try:
            return gateway.send(order)
        except Exception as e:
            print("send failed, retrying:", e)
            time.sleep(1)`,
      issues: [
        I('5–6', 'Bug', 'high', 'Retrying after a timeout can send the same order twice: the first send may have reached the exchange and only the reply was lost. Order sends are not idempotent.', 'Give every order a unique client order id and have the gateway (or exchange) reject duplicates; on a timeout, query the order status by id before resending.', 'Duplicate orders mean double the intended position: real money and risk-limit breaches.'),
        I('4', 'Robustness', 'high', 'while True with no limit retries forever, blocking the caller, even for errors that will never succeed (a rejected order, bad credentials).', 'Retry only on errors known to be transient, a bounded number of times, then fail loudly.', 'A stuck thread stops the strategy reacting to the market.'),
        I('7', 'Robustness', 'med', 'except Exception catches everything, including programming errors and validation rejects that should never be retried.', 'Catch specific exceptions (for example a TimeoutError or ConnectionError class from the gateway library).', 'Bugs get hidden behind endless "retrying" messages.'),
        I('9', 'Design', 'med', 'A fixed one-second sleep: in trading a 1-second-old order may be stale, and many clients retrying in lockstep can overload a recovering gateway.', 'Exponential backoff with jitter, a short overall deadline, and re-checking whether the order is still wanted before resending.', 'Late orders trade at prices the strategy no longer wants.'),
        I('8', 'Operations', 'low', 'print instead of logging, with no order id, no count, and no alert.', 'Structured logging with the client order id and attempt number, and a metric/alert on retry rates.', 'Without it, nobody can reconstruct what happened when something goes wrong.'),
      ],
      improved: `import time

class Transient(Exception):
    """Errors worth retrying: timeouts, dropped connections."""

def send_with_retry(gateway, order, attempts=3, base_delay=0.05):
    for attempt in range(1, attempts + 1):
        try:
            return gateway.send(order)          # order carries a unique client id
        except Transient:
            status = gateway.status(order["client_id"])
            if status is not None:              # it reached the exchange after all
                return status
            if attempt == attempts:
                raise
            time.sleep(base_delay * 2 ** (attempt - 1))`,
      deploy: {
        ask: 'This touches order flow. Outline the deployment.',
        good: ['Tests against a fake gateway that fails in each way: timeout before reaching the exchange, timeout after (the duplicate case), permanent rejects, repeated failures.', 'Test in a simulated or UAT exchange environment, which most exchanges provide, including deliberately dropped connections.', 'Roll out to one low-volume strategy first, with alerts on duplicate client ids, retry counts and order rejects; widen gradually.', 'Agree a rollback (redeploy the previous version) and a manual procedure for checking positions if anything looks duplicated: reconcile against the exchange\'s drop copy.'],
      },
      fundamentals: [
        ['What does idempotent mean, and why does it matter for retries?', 'An operation is idempotent if doing it twice has the same effect as once. Retrying a non-idempotent operation (sending an order) after an ambiguous failure can duplicate it; unique ids make the retry safe.'],
        ['TCP guarantees delivery, so how can an order be duplicated?', 'TCP guarantees in-order delivery on a connection, not that you learn of it: if the connection drops after the exchange received the order but before its acknowledgement reached you, your side sees a failure.'],
        ['What is exponential backoff with jitter?', 'Waiting longer after each failure (doubling), plus a random amount, so many clients don\'t retry in lockstep and overload a recovering service.'],
      ],
    },
    {
      id: 'trade-loader', title: 'Loading a trade file', minutes: 10,
      context: 'Every morning the back office drops a CSV of yesterday\'s trades from the clearing firm. This loader turns it into a list of trades for reconciliation. Files have a header row and a few hundred thousand lines.',
      code: `def load_trades(path):
    f = open(path)
    lines = f.readlines()
    trades = []
    for line in lines[1:]:
        try:
            date, account, symbol, qty, price = line.strip().split(",")
            trades.append({"date": date, "account": account, "symbol": symbol,
                           "qty": float(qty), "price": float(price)})
        except:
            pass
    return trades`,
      issues: [
        I('7', 'Bug', 'high', 'Splitting on commas breaks on quoted fields: an account name like "Smith, J" or a symbol with a comma produces too many fields, and the row is silently dropped by the bare except.', 'Use the csv module (csv.DictReader), which handles quoting.', 'Trades silently missing from reconciliation: the breaks show up later as unexplained differences.'),
        I('10–11', 'Robustness', 'high', 'A bare except: pass hides every problem, including corrupt rows and bugs, and doesn\'t even count them.', 'Catch the specific errors, record the line number and reason, and fail the load (or alert) if any rows are bad.', 'Silent data loss in a control process.'),
        I('2', 'Robustness', 'med', 'The file is opened without a with block, so it isn\'t closed if an error occurs.', 'with open(path, newline="") as f: …', 'Leaked file handles in a long-running service.'),
        I('3', 'Performance', 'low', 'readlines() loads the whole file into memory before processing.', 'Iterate over the file object (or the csv reader) line by line.', 'Fine at hundreds of thousands of lines; a problem as files grow.'),
        I('9', 'Correctness', 'med', 'Quantities parsed as float, and dates left as strings with no validation or time zone.', 'int for quantities, Decimal for prices, and parse dates with a known format.', 'Downstream code compares and sums these; types matter.'),
      ],
      improved: `import csv
from decimal import Decimal

def load_trades(path):
    trades, bad = [], []
    with open(path, newline="") as f:
        for n, row in enumerate(csv.DictReader(f), start=2):
            try:
                trades.append({"date": row["date"], "account": row["account"], "symbol": row["symbol"],
                               "qty": int(row["qty"]), "price": Decimal(row["price"])})
            except (KeyError, ValueError, ArithmeticError) as e:
                bad.append((n, str(e)))
    if bad:
        raise ValueError(f"{len(bad)} bad rows, first: line {bad[0][0]}: {bad[0][1]}")
    return trades`,
      deploy: {
        ask: 'How would you put the new loader into the morning process?',
        good: ['Run old and new loaders on the last few months of files and compare: the new one should load the rows the old one dropped, and nothing else should change.', 'Because the new loader fails loudly on bad rows, agree with the back office who gets alerted and what they do, before it ships: failing at 6am with no runbook is its own incident.', 'Deploy on a quiet day, with the old loader available as a fallback for that morning.', 'Monitor rows loaded, rows rejected, and the reconciliation break count over the following weeks.'],
      },
      fundamentals: [
        ['Why use a with block to open files?', 'It guarantees the file is closed when the block exits, even if an exception is raised (the context manager\'s __exit__ runs).'],
        ['Why is a bare except a code smell?', 'It catches everything, including KeyboardInterrupt and programming errors, so failures disappear silently. Catch the specific exceptions you expect and handle them.'],
        ['What is the memory cost of readlines() against iterating?', 'readlines() holds every line in memory at once, O(file size); iterating holds one line at a time, O(longest line).'],
      ],
    },
  ];

  // What a good code review covers, in the order to raise things.
  const REVIEW_ORDER = [
    ['Correctness', 'Does it do what it says? Off-by-ones, wrong comparisons, wrong signs, shared state, floating-point money.'],
    ['Robustness', 'Bad input, missing keys, empty data, failures of things it depends on. Does it fail loudly, or silently do the wrong thing?'],
    ['Concurrency', 'Who else calls this at the same time? Check-then-act races, shared mutable state, locks.'],
    ['Performance', 'What runs on the hot path, and how often? Complexity (O(n) inside a loop), data structures, allocation.'],
    ['Readability and design', 'Names, structure, separation of concerns, hard-coded values that should be configuration.'],
    ['Testing', 'Which test would have caught each bug? Boundaries, empty inputs, failure injection, a fake clock.'],
    ['Operations', 'Logging, metrics, alerts: could someone on call tell what went wrong at 3am?'],
  ];

  // What a good deployment plan covers.
  const DEPLOY_PLAN = [
    ['Test', 'Unit tests for the fix and its edge cases, and a regression run on real historical data, explaining every difference between old and new.'],
    ['Review', 'Code review, and sign-off from the people who own the risk (traders, risk, operations) when behaviour changes.'],
    ['Stage', 'A staging or simulation environment, or shadow mode: run the new version alongside the old on live inputs without acting on it, and compare.'],
    ['Roll out gradually', 'A feature flag, then a canary: one strategy, desk or instrument first. Deploy outside trading hours, and avoid days with big events.'],
    ['Monitor', 'Decide in advance which metrics show it is working (latency, error and reject rates, P&L differences, cache hit rates) and alert on them.'],
    ['Roll back', 'A one-step rollback (redeploy the previous version, flip the flag), and know whether rolling back is itself safe.'],
    ['Communicate', 'Tell the users what changes and when, and leave a runbook for whoever is on call.'],
  ];


  // The prep guide at the top of the screening hub. Sources: Optiver's process overview sent to
  // candidates (no public link), Optiver's "interview tips for software engineers" page (March 2025),
  // and candidate reports. Timings marked as estimates are ours.
  const GUIDE = {
    stages: [
      ['Online assessment', 'Coding, a CS knowledge test and cognitive games, reported by candidates in varying combinations by year and office.'],
      ['Behavioural interview', 'About 30 minutes with a recruiter: your background, motivation, and why Optiver.'],
      ['Tech screening', '45 minutes with an engineer: the stage this guide is for.'],
      ['Technical interviews 1 and 2', 'Deeper coding and design, discussed like working with a colleague.'],
      ['Final round', 'The last stage before an offer.'],
    ],
    format: `<p>Optiver's overview describes the tech screening as <b>a real-world business challenge</b>. You review a short code snippet, suggest improvements, outline a simple deployment plan, and discuss CS fundamentals along the way. The stated aim is to see how you think and how you connect technical choices to outcomes.</p>
      <p>Optiver's interview tips add that its technical interviews avoid standard LeetCode puzzles and brainteasers. They feel like solving a problem with a colleague, and assess how you break down complexity, adapt to new information and communicate your reasoning, rather than whether you have every answer.</p>`,
    timing: [
      ['0–3 min', 'Introductions; the interviewer explains the snippet\'s context.', 'Listen for what the code is for and how it\'s used; ask one or two clarifying questions.'],
      ['3–20 min', 'Review the snippet out loud.', 'Say what it does, then raise issues most serious first: what\'s wrong, the fix, the business impact.'],
      ['20–28 min', 'Improvements.', 'Sketch the fixed version, or the key changes, and say why they\'re better. Mention tests you\'d add.'],
      ['28–36 min', 'Deployment plan.', 'Tests, review, staging or a simulated exchange, a careful rollout, monitoring, rollback, communication: tied to this change\'s risk.'],
      ['36–42 min', 'Fundamentals.', 'Usually prompted by the code (why is this slow? what if two threads call it?). Reality → constraint → design → trade-off.'],
      ['42–45 min', 'Your questions.', 'One or two thoughtful questions about the team or the work.'],
    ],
    looking: [
      ['How you think', 'Breaking a problem down, reasoning out loud, and adapting when you learn something new.'],
      ['Connecting choices to outcomes', 'Not just "this is a bug" but "this would send duplicate orders and lose money when the exchange is slow".'],
      ['Language fluency', 'Your language\'s standard library and collections: time and space costs, and how they work inside.'],
      ['Fundamentals', 'Computer architecture, networking, concurrency and memory management, and how they constrain design.'],
      ['Communication', 'Clarifying questions at the start (load, latency, edge cases), explaining why you chose something, and engaging with hints.'],
      ['Collaboration', 'Treating the interviewer as a colleague: building on their points, disagreeing politely, changing your mind when they show you something.'],
    ],
    plan: [
      ['Learn to spot bugs', 'Work through the method and a 10-snippet mixed drill.', '#/code/screening/spot'],
      ['Review snippets against the clock', 'Do at least three of the snippets below, out loud, writing your review before comparing.', '#/code/screening'],
      ['Know the deployment checklist', 'Read the checklist below, then write a plan for one snippet in 5 minutes.', '#/code/screening'],
      ['Fundamentals', 'The five topics, especially Python from the inside and concurrency. Say each answer aloud before opening it.', '#/code/screening/fundamentals'],
      ['Python internals', 'Flip through the Python internals cards: mutability, references, the GIL, generators.', '#/flashcards/python'],
      ['Rapid-fire fundamentals', 'Ten questions at a time, answered out loud; the ones you miss come back first.', '#/code/screening/fundamentals/drill'],
      ['Sit a full mock', '45 minutes, out loud, with the timer. Note your two weakest moments and fix those.', '#/code/screening/mock'],
      ['Read the cheat sheet', 'The morning of the interview: one page with everything above.', '#/code/screening/sheet'],
      ['Prepare your stories and questions', 'Why software engineering, why Optiver, one project you can explain in depth, two STAR stories, two questions to ask.', '#/stories'],
    ],
    phrases: [
      ['Clarifying the context', '"Before I start: how often is this called, and is it on the order path?" "How much data does it see in a day?" "What happens downstream if it gets this wrong?"'],
      ['Thinking out loud', '"First I\'ll read it end to end and say what I think it\'s for." "The thing I\'d worry about most here is…"'],
      ['Ranking issues', '"The most serious problem is X, because it could send a duplicate order. Smaller things: Y and Z."'],
      ['When given a hint', '"Good point: if two threads call this at once, both could read the old position. I\'d fix that by…"'],
      ['When unsure', '"I\'m not certain how the library behaves here; I\'d check the docs, but my assumption is… and if that\'s wrong I\'d…"'],
      ['Trade-offs', '"I could make this faster with X, but it adds complexity; given it runs once a minute I\'d keep it simple."'],
    ],
    before: [
      'Do one full mock out loud, then stop: rest beats cramming.',
      'Reread the review order and the deployment checklist; skim the latency numbers.',
      'Prepare your two-minute introduction, "why Optiver", and two questions.',
      'Check your set-up: camera, microphone, a quiet room, the meeting link, and a working Python with an editor you know.',
      'Have paper and a pen for diagrams, and water.',
    ],
    during: [
      'Read the whole snippet before commenting, and say what it\'s for.',
      'Ask one or two clarifying questions early: they change which issues matter.',
      'Lead with the most serious issue; for each, say the impact on the business.',
      'Keep talking: silence the interviewer can\'t interpret reads as being stuck.',
      'If you get a hint, take it and build on it; it isn\'t a penalty.',
      'For fundamentals, go from the physical fact to the design choice.',
      'Leave time for your questions.',
    ],
    // Free LeetCode problems closest to trading-system code, checked against LeetCode's data on 19 Nov 2026.
    leetcode: [
      [1801, 'Number of Orders in the Backlog', 'number-of-orders-in-the-backlog', 'Medium', 'A tiny order book: match buys against sells with two heaps'],
      [2034, 'Stock Price Fluctuation', 'stock-price-fluctuation', 'Medium', 'Corrections to past prices, with the latest, max and min: lazy deletion'],
      [295, 'Find Median from Data Stream', 'find-median-from-data-stream', 'Hard', 'Running statistics on a stream with two heaps'],
      [901, 'Online Stock Span', 'online-stock-span', 'Medium', 'A monotonic stack over live prices'],
      [146, 'LRU Cache', 'lru-cache', 'Medium', 'The cache in front of a slow lookup'],
      [622, 'Design Circular Queue', 'design-circular-queue', 'Medium', 'The ring buffer between pipeline stages'],
      [1396, 'Design Underground System', 'design-underground-system', 'Medium', 'Track open events by id and aggregate when they close, like orders'],
      [1226, 'The Dining Philosophers', 'the-dining-philosophers', 'Medium', 'Deadlock and lock ordering, in Python threads'],
    ],
    sources: [
      ['Optiver: interview tips for software engineers (March 2025)', 'https://optiver.com/working-at-optiver/career-hub/optiver-interview-tips-for-software-engineers/', 'Official. What they assess, and how to prepare: programming know-how, fundamentals, explaining design choices, behavioural.'],
      ['Optiver\'s interview process overview for the software engineer internship', '', 'Official, sent to candidates (no public link). The stages, and what the 45-minute tech screening covers.'],
      ['Glassdoor: Optiver software engineer internship interviews', 'https://www.glassdoor.com/Interview/Optiver-Software-Engineer-Internship-Interview-Questions-EI_IE243355.0,7_KO8,36.htm', 'Candidate reports, varying by year and office; some mention OS and networking questions.'],
      ['Taro: Optiver interview experiences', 'https://www.jointaro.com/interviews/companies/optiver/experiences/software-engineer-intern-amsterdam-september-22-2025-no-offer-positive-b09b7af1/', 'Candidate reports, including online-assessment formats.'],
    ],
  };

  QT.screening = { EXERCISES, REVIEW_ORDER, DEPLOY_PLAN, GUIDE, byId: (id) => EXERCISES.find((e) => e.id === id) };
})();
