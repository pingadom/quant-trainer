// Learning to spot bugs (#/code/screening/spot): the reading habits behind a good code review, the
// families of bug that come up again and again, each with its "tell" (the thing on the page that
// should make you slow down), short snippets to practise on, and "run it in your head" questions.
// All our own. research/verify_internals.py runs every snippet: for each ITEM with planted lines
// (`bad`), the original must fail its test and `fix` must pass it; a clean item (`bad: []`) must
// pass as it is. Every TRACE is run and its printed output compared with `out`.
(function () {
  // How to read code you're asked to review, in order.
  const HABITS = [
    ['Say what it\'s for', 'Before judging a line, say in one sentence what the function is meant to do: its inputs, its output, who calls it and how often. A bug is a gap between what the code does and what it\'s for, so you can\'t see one until you know the second. Say it out loud in the interview; it also shows the interviewer you read before you criticise.'],
    ['List the awkward inputs first', 'Before reading the body, write down the inputs that break code: empty, one item, duplicates, zero, negative, None, exactly at a threshold, very large, called twice, called from two threads, the thing it calls failing. Then read the body asking what happens to each.'],
    ['Trace one small input by hand', 'Pick a tiny input, ideally including an edge (the last element, an empty list), and track every variable line by line. Writing the values down catches what reading never does: the loop that stops one early, the sign that is flipped, the total that is never reset.'],
    ['Scan for tells', 'Some patterns are suspicious on sight: a mutable default argument, a loop that removes from what it loops over, == on floats, a bare except, open() without with, a retry around something that sends an order. A tell doesn\'t prove a bug; it tells you where to spend your attention.'],
    ['Ask the five questions where state changes', 'At every line that changes state or talks to the outside world, ask: what if it\'s empty or None? What if it fails halfway through? What if it runs twice, or at the same time in two threads? What does it cost with 100 times the data? Are the units and types what I think (pence or pounds, local time or UTC, int or float)?'],
    ['Rank by impact, and say why', 'Wrong money or wrong orders first, then crashes and hangs, then slowness, then readability. For each issue, say what goes wrong for the business, not just for the code: "a timeout here sends the order twice" lands better than "the retry is wrong".'],
  ];

  // [id, name, the tell, the question to ask]
  const FAMILIES = [
    ['bounds', 'Off-by-one and boundaries', 'range(len(x) - 1), x[i + 1], < where <= might belong, slices, the first and last window.', 'What happens to the first element, the last element, and a value exactly at the threshold?'],
    ['empty', 'Empty, None and zero', 'Division, max(), min() or [0] on something that could be empty; "if not x" when 0 or "" is a real value.', 'What if it\'s empty, None, or zero, and is zero a meaningful value here?'],
    ['mutable', 'Shared mutable state', 'A default argument that is a list or dict; [[0] * n] * m; dict(x) or list(x) on nested data; one object stored in two places.', 'Who else holds a reference to this object, and will they see the change?'],
    ['iterate', 'Changing what you loop over', '.remove(), del or .pop() inside a for loop over the same list or dict.', 'Does the loop still see every element after this line runs?'],
    ['numbers', 'Money and number types', '== between floats; round() in the middle of a calculation; // on prices; splitting an amount into shares.', 'Is this exact? Do the parts still add up to the whole?'],
    ['time', 'Time and dates', 'time.time() used for durations; datetime.now() with no time zone; dates compared as strings.', 'Which clock, which time zone, and what happens when the clock jumps?'],
    ['errors', 'Errors swallowed or half-done', 'A bare except or except-pass; a default value returned on failure; state changed before a call that can raise.', 'If this fails, who finds out, and what state is left behind?'],
    ['resources', 'Resources not released', 'open() assigned to a variable; lock.acquire(); a connection opened without with or try/finally.', 'If an exception happens on the next line, is this still released?'],
    ['perf', 'Hidden quadratic cost', '"x in some_list" inside a loop; list.pop(0); sorting or copying inside a loop.', 'What does this cost with 100 times the data?'],
    ['concurrency', 'Races on shared state', 'Read, then write back, of something shared between threads; "if key not in cache: cache[key] = …".', 'What if two threads are on this line at the same time?'],
    ['retries', 'Retries and duplicates', 'A loop that retries a send; while True around a network call; retry on any error with no delay.', 'If the first attempt actually succeeded, what does the retry do?'],
    ['logic', 'Conditions and comparisons', 'Buy and sell handled the same way; is where == belongs; and/or swapped; a lambda in a loop using the loop variable.', 'Read the condition back in plain English: is that what was meant?'],
  ];

  // A snippet: { id, fam, ctx, code, bad: lines to flag ([] if it's fine), tell, why, fix }.
  const ITEMS = [
    { id: 'last-k-average', fam: 'bounds', ctx: 'Average of the last k prices, used as a short-term fair value.',
      code: `def last_k_average(prices, k):
    total = 0
    for i in range(len(prices) - k, len(prices) - 1):
        total += prices[i]
    return total / k`,
      bad: [3], tell: 'range(…, len(prices) - 1): the end of a range is already excluded, so the "- 1" drops the newest price.',
      why: 'The average uses only k − 1 prices but divides by k, so fair value is biased low and ignores the latest tick, the one that matters most.',
      fix: `def last_k_average(prices, k):
    total = 0
    for i in range(len(prices) - k, len(prices)):
        total += prices[i]
    return total / k` },
    { id: 'fillable-qty', fam: 'bounds', ctx: 'How much we can buy from the offers at or below our limit price.',
      code: `def fillable_qty(asks, limit):
    """asks: (price, qty) pairs, cheapest first."""
    total = 0
    for price, qty in asks:
        if price >= limit:
            break
        total += qty
    return total`,
      bad: [5], tell: 'A comparison against a limit: the docstring says "at or below", the code stops "at".',
      why: 'Offers exactly at the limit are excluded, so the strategy under-estimates what it can trade, and at the touch it trades nothing at all.',
      fix: `def fillable_qty(asks, limit):
    """asks: (price, qty) pairs, cheapest first."""
    total = 0
    for price, qty in asks:
        if price > limit:
            break
        total += qty
    return total` },
    { id: 'simple-returns', fam: 'bounds', ctx: 'Day-on-day returns from a list of closing prices.',
      code: `def returns(prices):
    out = []
    for i in range(len(prices)):
        out.append(prices[i + 1] / prices[i] - 1)
    return out`,
      bad: [3], tell: 'prices[i + 1] inside a loop over range(len(prices)): the last i has no next element.',
      why: 'It raises IndexError on every input, so the job dies; n prices give only n − 1 returns.',
      fix: `def returns(prices):
    out = []
    for i in range(len(prices) - 1):
        out.append(prices[i + 1] / prices[i] - 1)
    return out` },

    { id: 'avg-fill-price', fam: 'empty', ctx: 'Average price of an order\'s fills, shown on the trader\'s blotter.',
      code: `def avg_price(fills):
    qty = sum(f["qty"] for f in fills)
    notional = sum(f["qty"] * f["price"] for f in fills)
    return notional / qty`,
      bad: [4], tell: 'A division by a total that is zero when the list is empty.',
      why: 'An order with no fills yet is the normal case, and it raises ZeroDivisionError, which takes down the blotter refresh for every order.',
      fix: `def avg_price(fills):
    qty = sum(f["qty"] for f in fills)
    if qty == 0:
        return None          # no fills yet
    notional = sum(f["qty"] * f["price"] for f in fills)
    return notional / qty` },
    { id: 'spread', fam: 'empty', ctx: 'Current bid-ask spread from the two sides of the book.',
      code: `def spread(bids, asks):
    best_bid = max(bids)
    best_ask = min(asks)
    return best_ask - best_bid`,
      bad: [2, 3], tell: 'max() and min() on collections that can be empty: one side of a book is often empty at the open or in a fast market.',
      why: 'max() of an empty list raises ValueError, so the quoting loop crashes exactly when the market is thin and you most need it to decide carefully.',
      fix: `def spread(bids, asks):
    if not bids or not asks:
        return None          # one side is empty: no spread
    return min(asks) - max(bids)` },
    { id: 'limit-zero', fam: 'empty', ctx: 'Pre-trade check: is the position within the configured limit? A limit of 0 means the trader may not hold any.',
      code: `def within_limit(position, limit=None):
    if not limit:
        return True          # no limit configured
    return abs(position) <= limit`,
      bad: [2], tell: '"if not limit" when 0 is a meaningful value: 0 and None are both falsy.',
      why: 'A limit of zero, meant to stop a trader holding anything, is treated as "no limit": every order passes the risk check.',
      fix: `def within_limit(position, limit=None):
    if limit is None:
        return True          # no limit configured
    return abs(position) <= limit` },

    { id: 'default-dict', fam: 'mutable', ctx: 'Collect fill quantities per order for one batch of fills.',
      code: `def record_fill(order_id, qty, book={}):
    book.setdefault(order_id, []).append(qty)
    return book`,
      bad: [1], tell: 'A default argument that is a dict: it is created once, when the function is defined, and shared by every call.',
      why: 'Every call that uses the default adds to the same dict, so fills from earlier batches leak into later ones and totals grow for ever.',
      fix: `def record_fill(order_id, qty, book=None):
    if book is None:
        book = {}
    book.setdefault(order_id, []).append(qty)
    return book` },
    { id: 'grid-alias', fam: 'mutable', ctx: 'Positions by trader and symbol, from a list of (trader, symbol, qty) trades.',
      code: `def positions_grid(trades, n_traders, n_symbols):
    grid = [[0] * n_symbols] * n_traders
    for trader, symbol, qty in trades:
        grid[trader][symbol] += qty
    return grid`,
      bad: [2], tell: '[[…] * n] * m: the outer * copies the reference to one inner list m times.',
      why: 'Every trader\'s row is the same list, so one trader\'s trade shows up in everyone\'s position: risk sees positions that don\'t exist.',
      fix: `def positions_grid(trades, n_traders, n_symbols):
    grid = [[0] * n_symbols for _ in range(n_traders)]
    for trader, symbol, qty in trades:
        grid[trader][symbol] += qty
    return grid` },
    { id: 'shallow-copy', fam: 'mutable', ctx: 'Start a new trading day from yesterday\'s book, with P&L reset to zero.',
      code: `def start_of_day(yesterday):
    today = dict(yesterday)
    for sym in today:
        today[sym]["pnl"] = 0
    return today`,
      bad: [2], tell: 'dict(x) on a dict whose values are dicts: it copies the outer level only.',
      why: 'Resetting today\'s P&L also wipes yesterday\'s, the record the end-of-day report and reconciliation read from.',
      fix: `def start_of_day(yesterday):
    today = {sym: dict(row) for sym, row in yesterday.items()}
    for sym in today:
        today[sym]["pnl"] = 0
    return today` },

    { id: 'remove-while-iterating', fam: 'iterate', ctx: 'Remove cancelled orders from the working list.',
      code: `def drop_cancelled(orders):
    for o in orders:
        if o["status"] == "cancelled":
            orders.remove(o)
    return orders`,
      bad: [2, 4], tell: '.remove() on the list the for loop is walking through.',
      why: 'Removing shifts the next element into the current slot, which the loop then skips: two cancelled orders in a row leave one behind, and it can be sent again.',
      fix: `def drop_cancelled(orders):
    return [o for o in orders if o["status"] != "cancelled"]` },
    { id: 'expire-quotes', fam: 'iterate', ctx: 'Drop quotes older than ttl seconds from the quote cache.',
      code: `def expire(quotes, now, ttl):
    for sym, q in quotes.items():
        if now - q["t"] > ttl:
            del quotes[sym]`,
      bad: [2, 4], tell: 'del on a dict inside a loop over that dict\'s items().',
      why: 'Python raises "dictionary changed size during iteration", so the first expiry crashes the cache sweep and stale quotes are never removed.',
      fix: `def expire(quotes, now, ttl):
    stale = [sym for sym, q in quotes.items() if now - q["t"] > ttl]
    for sym in stale:
        del quotes[sym]` },

    { id: 'float-equal', fam: 'numbers', ctx: 'Reconciliation: does the notional of our fills match the exchange\'s report?',
      code: `def notional_matches(fills, expected):
    total = sum(qty * price for qty, price in fills)
    return total == expected`,
      bad: [3], tell: '== between floats that came from arithmetic.',
      why: 'Binary floats can\'t represent most decimals exactly: 1 × 0.1 + 2 × 0.1 is 0.30000000000000004, not 0.3. The check fails on correct data and floods operations with false breaks.',
      fix: `def notional_matches(fills, expected, tol=1e-9):
    total = sum(qty * price for qty, price in fills)
    return abs(total - expected) <= tol * max(1.0, abs(expected))` },
    { id: 'split-fee', fam: 'numbers', ctx: 'Split a fee, in pence, equally across n accounts.',
      code: `def split_fee(fee_pence, n):
    share = round(fee_pence / n)
    return [share] * n`,
      bad: [2, 3], tell: 'Rounding each share separately: the rounded parts no longer add up to the whole.',
      why: '100p across 3 accounts charges 33p each, 99p in total: a penny goes missing every time, and the books don\'t reconcile.',
      fix: `def split_fee(fee_pence, n):
    base, extra = divmod(fee_pence, n)
    return [base + 1] * extra + [base] * (n - extra)` },
    { id: 'mid-floor', fam: 'numbers', ctx: 'Mid price, in ticks, used to mark positions.',
      code: `def mid_ticks(bid_ticks, ask_ticks):
    return (bid_ticks + ask_ticks) // 2`,
      bad: [2], tell: '// on prices: floor division throws away the half tick.',
      why: 'With a one-tick spread the mid is always rounded down, so every position is marked half a tick low: a systematic P&L bias.',
      fix: `def mid_ticks(bid_ticks, ask_ticks):
    return (bid_ticks + ask_ticks) / 2` },

    { id: 'wall-clock-latency', fam: 'time', ctx: 'Measure how long the exchange takes to acknowledge an order.',
      code: `import time

def timed_send(send, order):
    start = time.time()
    send(order)
    return time.time() - start`,
      bad: [4, 6], tell: 'time.time() used to measure a duration: it is the wall clock, which can jump.',
      why: 'When NTP corrects the clock mid-measurement the latency comes out negative or huge, which corrupts the latency stats and can trip alerts or throttles.',
      fix: `import time

def timed_send(send, order):
    start = time.perf_counter()
    send(order)
    return time.perf_counter() - start` },
    { id: 'market-hours-tz', fam: 'time', ctx: 'Is the Amsterdam market open (08:00 to 16:30 local time)? The servers run on UTC.',
      code: `from datetime import datetime, time

def market_open(now=None):
    now = now or datetime.now()
    return time(8, 0) <= now.time() < time(16, 30)`,
      bad: [4], tell: 'datetime.now() with no time zone, compared with local market hours.',
      why: 'On a UTC server the check is an hour out in winter and two in summer, so the strategy thinks the market is closed for the first hour of trading and open after the close.',
      fix: `from datetime import datetime, time
from zoneinfo import ZoneInfo

AMS = ZoneInfo("Europe/Amsterdam")

def market_open(now=None):
    now = (now or datetime.now(AMS)).astimezone(AMS)
    return time(8, 0) <= now.time() < time(16, 30)` },
    { id: 'string-dates', fam: 'time', ctx: 'Trades after a cut-off; timestamps arrive as "16/11/2026 09:30".',
      code: `def after(trades, cutoff):
    return [t for t in trades if t["ts"] > cutoff]`,
      bad: [2], tell: 'Dates compared as strings in a day-first format.',
      why: 'Strings compare character by character, so "10/12/2026" sorts before "16/11/2026": December trades are dropped as if they were older.',
      fix: `from datetime import datetime

FMT = "%d/%m/%Y %H:%M"

def after(trades, cutoff):
    c = datetime.strptime(cutoff, FMT)
    return [t for t in trades if datetime.strptime(t["ts"], FMT) > c]` },

    { id: 'bare-except', fam: 'errors', ctx: 'Load closing prices from rows of a vendor file, skipping malformed values.',
      code: `def load_prices(rows):
    prices = {}
    for row in rows:
        try:
            prices[row["sym"]] = float(row["px"])
        except:
            pass
    return prices`,
      bad: [6, 7], tell: 'A bare except with pass: every error, including ones you didn\'t expect, disappears.',
      why: 'If the vendor renames the "px" column, every row raises KeyError and is silently skipped: the job "succeeds" with no prices, and downstream systems run on stale data.',
      fix: `def load_prices(rows):
    prices, bad = {}, 0
    for row in rows:
        try:
            prices[row["sym"]] = float(row["px"])
        except ValueError:
            bad += 1         # a malformed number: skip it, but count it
    if bad:
        print(f"skipped {bad} malformed prices")
    return prices` },
    { id: 'half-done', fam: 'errors', ctx: 'Move a position from one book to another.',
      code: `def move_position(positions, src, dst, qty):
    positions[src] -= qty
    positions[dst] += qty`,
      bad: [2, 3], tell: 'Two updates that must both happen, with something between them that can raise.',
      why: 'If dst isn\'t a known book, line 3 raises after line 2 has already run: the quantity vanishes from src and appears nowhere, and the firm\'s total position is wrong.',
      fix: `def move_position(positions, src, dst, qty):
    if src not in positions or dst not in positions:
        raise KeyError(f"unknown book: {src} or {dst}")
    positions[src] -= qty
    positions[dst] += qty` },
    { id: 'zero-price', fam: 'errors', ctx: 'Look up the latest price for a symbol; the result feeds the order pricer.',
      code: `def get_price(feed, sym):
    try:
        return feed[sym]
    except KeyError:
        return 0`,
      bad: [5], tell: 'A failure turned into a value that looks real.',
      why: 'A missing price comes back as 0, a valid-looking number: the pricer can quote at zero instead of refusing to quote.',
      fix: `def get_price(feed, sym):
    return feed.get(sym)     # None: no price, and the caller must handle it` },

    { id: 'open-no-with', fam: 'resources', ctx: 'Count the lines in today\'s trade file; called every minute by a monitor.',
      code: `def count_lines(path):
    f = open(path)
    n = sum(1 for _ in f)
    return n`,
      bad: [2], tell: 'open() assigned to a variable, with no with block and no close().',
      why: 'The file handle is only closed whenever the object is garbage-collected; in a long-running monitor that leaks handles, and on Windows it can stop the writer rotating the file.',
      fix: `def count_lines(path):
    with open(path) as f:
        return sum(1 for _ in f)` },
    { id: 'lock-no-finally', fam: 'resources', ctx: 'Apply an order to the shared order book.',
      code: `import threading

lock = threading.Lock()

def update(book, order):
    lock.acquire()
    book.apply(order)
    lock.release()`,
      bad: [6, 8], tell: 'acquire() and release() as separate lines, with code that can raise between them.',
      why: 'If apply raises, the lock is never released and every other thread waits for ever: the whole book freezes on one bad order.',
      fix: `import threading

lock = threading.Lock()

def update(book, order):
    with lock:
        book.apply(order)` },

    { id: 'in-list', fam: 'perf', ctx: 'Order ids we haven\'t seen before. The seen list holds every id from the last month.',
      code: `def new_ids(today, seen):
    out = []
    for oid in today:
        if oid not in seen:
            out.append(oid)
    return out`,
      bad: [4], tell: '"not in seen" inside a loop, where seen is a list: each check scans the whole list.',
      why: 'n ids against m seen ids is O(n × m): fine in a test, minutes on a month of ids, and the end-of-day job misses its window.',
      fix: `def new_ids(today, seen):
    seen = set(seen)         # O(1) lookups
    return [oid for oid in today if oid not in seen]` },
    { id: 'pop-front', fam: 'perf', ctx: 'Drain a queue of market-data messages.',
      code: `def process(queue, handle):
    while queue:
        msg = queue.pop(0)
        handle(msg)`,
      bad: [3], tell: 'list.pop(0): removing from the front shifts every remaining element.',
      why: 'Draining n messages is O(n²): a burst of messages at the open makes the handler fall further behind exactly when data matters most.',
      fix: `from collections import deque

def process(queue, handle):
    queue = deque(queue)
    while queue:
        handle(queue.popleft())` },
    { id: 'sort-in-loop', fam: 'perf', ctx: 'The highest price so far, at each tick of the day.',
      code: `def running_high(prices):
    out = []
    for i in range(len(prices)):
        out.append(sorted(prices[: i + 1])[-1])
    return out`,
      bad: [4], tell: 'A sort (and a copy) inside a loop over the same data.',
      why: 'Each step re-sorts everything so far: O(n² log n) for something a single running maximum does in O(n). On a day of ticks it never finishes.',
      fix: `def running_high(prices):
    out, high = [], float("-inf")
    for p in prices:
        high = max(high, p)
        out.append(high)
    return out` },

    { id: 'id-race', fam: 'concurrency', ctx: 'Hands out client order ids; several strategy threads call take().',
      code: `import logging

log = logging.getLogger("ids")

class OrderIds:
    def __init__(self):
        self.next_id = 0

    def take(self, strategy):
        oid = self.next_id
        log.debug("id %d to %s", oid, strategy)
        self.next_id = oid + 1
        return oid`,
      bad: [10, 12], tell: 'Read a shared value, then write back a value computed from it, with no lock, and other work in between.',
      why: 'A thread can be paused between the read and the write (the logging call makes it likely): two threads read the same next_id, two orders get the same id, and the exchange rejects one or cancels the wrong one.',
      fix: `import logging
import threading

log = logging.getLogger("ids")

class OrderIds:
    def __init__(self):
        self.next_id = 0
        self.lock = threading.Lock()

    def take(self, strategy):
        with self.lock:
            oid = self.next_id
            self.next_id = oid + 1
        log.debug("id %d to %s", oid, strategy)
        return oid` },
    { id: 'cache-race', fam: 'concurrency', ctx: 'Cache instrument details; load() is a slow database call. Pricing threads call this at start-up.',
      code: `cache = {}

def get_instrument(sym, load):
    if sym not in cache:
        cache[sym] = load(sym)
    return cache[sym]`,
      bad: [4, 5], tell: '"if key not in cache: cache[key] = slow_call()": check, then act, on shared state.',
      why: 'Every thread that arrives before the first load finishes also loads: at start-up dozens of threads hit the database for the same instrument at once.',
      fix: `import threading

cache, lock = {}, threading.Lock()

def get_instrument(sym, load):
    with lock:
        if sym not in cache:
            cache[sym] = load(sym)
        return cache[sym]` },

    { id: 'retry-duplicate', fam: 'retries', ctx: 'Send an order to the exchange, retrying on timeout.',
      code: `def send_with_retry(send, order, attempts=3):
    for _ in range(attempts):
        try:
            return send(order)
        except TimeoutError:
            continue
    raise TimeoutError("gave up")`,
      bad: [5, 6], tell: 'A retry around a call that sends an order.',
      why: 'A timeout means "no answer", not "not received". If the exchange got the first order, the retry sends a second one: double the position you wanted.',
      fix: `def send_with_retry(send, order, status, attempts=3):
    # order carries a fixed client order id; status(id) asks the exchange about it
    for _ in range(attempts):
        try:
            return send(order)
        except TimeoutError:
            known = status(order["id"])
            if known is not None:
                return known     # it got there: don't send it again
    raise TimeoutError("gave up")` },
    { id: 'retry-forever', fam: 'retries', ctx: 'Connect to the market-data gateway at start-up.',
      code: `import time

def connect(open_conn):
    while True:
        try:
            return open_conn()
        except ConnectionError:
            time.sleep(0.1)`,
      bad: [4, 8], tell: 'while True around a network call, with a short fixed sleep.',
      why: 'If the gateway is down it retries ten times a second for ever: it hammers the gateway as it comes back, and the failure never reaches anyone who could fix it.',
      fix: `import random
import time

def connect(open_conn, attempts=6):
    for i in range(attempts):
        try:
            return open_conn()
        except ConnectionError:
            time.sleep(min(30, 0.5 * 2 ** i) * random.uniform(0.5, 1))   # back off, with jitter
    raise ConnectionError(f"gateway unreachable after {attempts} attempts")` },

    { id: 'sell-sign', fam: 'logic', ctx: 'Net position from a list of (side, qty) fills.',
      code: `def position_after(fills):
    pos = 0
    for side, qty in fills:
        if side == "BUY":
            pos += qty
        elif side == "SELL":
            pos += qty
    return pos`,
      bad: [7], tell: 'Two branches for buy and sell that do the same thing.',
      why: 'Sells add to the position instead of reducing it: risk thinks a flat trader is long double, and hedges they don\'t need are sent.',
      fix: `def position_after(fills):
    pos = 0
    for side, qty in fills:
        if side == "BUY":
            pos += qty
        elif side == "SELL":
            pos -= qty
    return pos` },
    { id: 'is-equal', fam: 'logic', ctx: 'Has an order reached the maximum size?',
      code: `def hit_max_size(order_qty, max_qty):
    return order_qty is max_qty`,
      bad: [2], tell: 'is between numbers: it asks whether they are the same object, not the same value.',
      why: 'Small integers happen to be shared objects, so tests with small sizes pass; with 500 read from a config file it returns False and the size limit is never enforced.',
      fix: `def hit_max_size(order_qty, max_qty):
    return order_qty >= max_qty` },
    { id: 'late-binding', fam: 'logic', ctx: 'Build one price-alert formatter per symbol.',
      code: `def make_alerts(symbols):
    alerts = []
    for sym in symbols:
        alerts.append(lambda price: f"{sym} at {price}")
    return alerts`,
      bad: [4], tell: 'A lambda created in a loop that uses the loop variable.',
      why: 'The lambda looks up sym when it runs, not when it is made, so every alert names the last symbol: traders get alerts for the wrong instrument.',
      fix: `def make_alerts(symbols):
    alerts = []
    for sym in symbols:
        alerts.append(lambda price, sym=sym: f"{sym} at {price}")
    return alerts` },
    { id: 'and-or', fam: 'logic', ctx: 'Quote only when the market is calm: the spread and the volatility both under their limits.',
      code: `def should_quote(spread, vol, max_spread, max_vol):
    return spread < max_spread or vol < max_vol`,
      bad: [2], tell: 'The comment says "both", the code says or.',
      why: 'The strategy quotes when only one condition holds, including in a volatile market with a tight spread, the moment it is most likely to be picked off.',
      fix: `def should_quote(spread, vol, max_spread, max_vol):
    return spread < max_spread and vol < max_vol` },

    // Clean code: knowing when to say "this is fine" matters too.
    { id: 'clean-vwap', fam: 'empty', ctx: 'Volume-weighted average price of (qty, price) fills.',
      code: `def vwap(fills):
    qty = sum(q for q, p in fills)
    if qty == 0:
        return None
    return sum(q * p for q, p in fills) / qty`,
      bad: [], tell: 'The tell is here (a division by a total), and so is the guard: an empty list returns None.',
      why: 'Nothing to fix. You might still ask whether callers handle None, or whether quantities can be negative.', fix: '' },
    { id: 'clean-window-max', fam: 'bounds', ctx: 'Maximum price in each window of k ticks.',
      code: `from collections import deque

def rolling_max(prices, k):
    out, dq = [], deque()
    for i, p in enumerate(prices):
        while dq and prices[dq[-1]] <= p:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(prices[dq[0]])
    return out`,
      bad: [], tell: 'Plenty of indices to check, and they are all right: the front leaves when it is k behind, and output starts at the first full window.',
      why: 'Nothing to fix. It is O(n) with a monotonic deque. Saying "I traced the boundaries and they are correct" is a good answer.', fix: '' },
    { id: 'clean-net', fam: 'logic', ctx: 'Net position from (side, qty) fills.',
      code: `def net_position(fills):
    sign = {"BUY": 1, "SELL": -1}
    return sum(sign[side] * qty for side, qty in fills)`,
      bad: [], tell: 'Buy and sell are handled by a lookup, so they can\'t be confused, and an unknown side raises KeyError instead of being ignored.',
      why: 'Nothing to fix. Failing loudly on a side it doesn\'t know is a feature here.', fix: '' },
  ];

  // Run it in your head: what does this print? { id, fam, code, out, why }.
  const TRACES = [
    { id: 't-default', fam: 'mutable', code: `def add(x, seen=[]):
    seen.append(x)
    return len(seen)

add(1)
add(2)
print(add(3))`, out: '3', why: 'The default list is made once and shared by every call, so it holds 1, 2 and 3 by the third call.' },
    { id: 't-grid', fam: 'mutable', code: `grid = [[0] * 2] * 3
grid[0][0] = 1
print(sum(map(sum, grid)))`, out: '3', why: 'All three rows are the same list, so setting one cell sets it in every row.' },
    { id: 't-copy', fam: 'mutable', code: `a = {"x": [1]}
b = dict(a)
b["x"].append(2)
print(a["x"])`, out: '[1, 2]', why: 'dict(a) copies the outer dict only; both dicts hold the same inner list.' },
    { id: 't-float', fam: 'numbers', code: `print(0.1 + 0.2 == 0.3)`, out: 'False', why: '0.1 + 0.2 is 0.30000000000000004 in binary floating point.' },
    { id: 't-round', fam: 'numbers', code: `print(round(2.5) + round(3.5))`, out: '6', why: 'Python rounds halves to the nearest even number ("banker\'s rounding"): 2 + 4.' },
    { id: 't-floordiv', fam: 'numbers', code: `print(-7 // 2)`, out: '-4', why: '// rounds down (towards minus infinity), not towards zero.' },
    { id: 't-remove', fam: 'iterate', code: `xs = [1, 2, 2, 3]
for x in xs:
    if x == 2:
        xs.remove(x)
print(xs)`, out: '[1, 2, 3]', why: 'Removing the first 2 shifts the second 2 into the slot the loop has just visited, so it is skipped.' },
    { id: 't-lambda', fam: 'logic', code: `fs = [lambda: i for i in range(3)]
print(sum(f() for f in fs))`, out: '6', why: 'Each lambda reads i when called, after the loop, when i is 2: 2 + 2 + 2.' },
    { id: 't-is', fam: 'logic', code: `a = 1000
b = int("1000")
print(a == b, a is b)`, out: 'True False', why: 'Equal values, different objects: is compares identity.' },
    { id: 't-truthy', fam: 'empty', code: `print(bool(0.0), bool("0"), bool([0]))`, out: 'False True True', why: 'Zero is falsy, but any non-empty string or list is truthy, even one containing a zero.' },
    { id: 't-sorted', fam: 'logic', code: `print(sorted(["b10", "b9", "b100"]))`, out: "['b10', 'b100', 'b9']", why: 'Strings sort character by character: "1" comes before "9".' },
    { id: 't-slice', fam: 'bounds', code: `prices = [10, 11, 12, 13]
print(prices[1:3], prices[-2:])`, out: '[11, 12] [12, 13]', why: 'A slice includes its start and excludes its end; [-2:] is the last two.' },
  ];

  const byFam = (f) => ITEMS.filter((x) => x.fam === f);
  QT.spotting = { HABITS, FAMILIES, ITEMS, TRACES, byFam, byId: (id) => ITEMS.find((x) => x.id === id), famById: (id) => FAMILIES.find((f) => f[0] === id) };
})();
