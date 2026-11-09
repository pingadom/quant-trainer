// Coding problems for software-engineering interviews, starting with Optiver's SWE internship:
// the class-design problems its online assessment is reported to use, data structures from its
// technical rounds, and two debugging exercises. Each is our own version of a reported problem
// (our story and numbers, the same task), with tests, hints, a worked solution and reference
// solutions in Python and JavaScript. CI runs both references on every test case, and checks the
// trickier ones against a brute-force Python version too (research/verify_code.py).
//
// Each problem:
//   kind     'fn' (a function) | 'cls' (a class whose methods are called in turn)
//   name     the function or class name; Python uses snake_case for functions and methods
//   sig      fn: { args, ret }; cls: { init, methods: [[name, args, returns]] }; generates the starter code
//   tests    fn: { args, out }; cls: { init, ops: [[method, ...args]], out: [one result per call] }
//            ex: shown as an example and run by "Run"; why: a note under the example
//   fuzz     generator of small random cases; the expected output comes from the reference
//   perf     { gen, label }: one large case; the runner times the reference on it and allows a multiple
//   ref      reference solutions { js, py } as source text
//   starter  code to start from instead of a generated stub (the debugging problems)
// Loaded by the page and by the code runner (js/code-worker.js), so it uses nothing else from QT.
(function () {
  // Source text written indented in this file, with the common indent removed.
  const code = (s) => {
    const lines = s.raw[0].replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(indent)).join('\n') + '\n';
  };
  const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

  // Seeded random numbers (mulberry32), so the random and large tests are the same everywhere.
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    return {
      next, int,
      pick: (xs) => xs[Math.floor(next() * xs.length)],
      chance: (p) => next() < p,
      shuffle: (xs) => { for (let i = xs.length - 1; i > 0; i--) { const j = int(0, i); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; },
    };
  }
  const seedOf = (id) => [...id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

  const GDI = 'https://www.glassdoor.co.uk/Interview/Optiver-Software-Engineer-Intern-Interview-Questions-EI_IE243355.0,7_KO8,32.htm';
  const GDS = 'https://www.glassdoor.co.uk/Interview/Optiver-Software-Engineer-Internship-Interview-Questions-EI_IE243355.0,7_KO8,36.htm';
  const LC = (path) => `https://leetcode.com/discuss/post/${path}/`;
  const OURS = 'Our version of a reported problem: the story and numbers are ours, the task is the same.';

  const GROUPS = [
    ['oa', 'Online assessment: class design', 'Optiver\'s coding test is reported to be one or two long problems where you fill in a class whose methods are called on a stream of events. Read the whole statement before coding, and test the edge cases yourself: candidates say the visible tests are few.'],
    ['tech', 'Technical interviews: data structures', 'Build a data structure on the spot and explain what each operation costs.'],
    ['debug', 'Debugging and code review', 'Recent candidates describe a round where you find logical bugs (not syntax errors) and performance problems in someone else\'s code.'],
    ['warm', 'Warm-ups', 'Short problems from older reports. Good for getting used to the editor.'],
  ];

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const pad = (n, w) => String(n).padStart(w, '0');
  const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const randomDate = (r) => {
    const y = r.int(1600, 2400), m = r.int(1, 12);
    const len = [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
    return `${y}-${pad(m, 2)}-${pad(r.int(1, len), 2)}`;
  };

  const PROBLEMS = [
    // ------------------------------------------------------------------ online assessment
    {
      id: 'opt-worst-trade', title: 'Worst trade', group: 'oa', diff: 'Medium', tags: ['hash map', 'design'],
      src: ['LeetCode Discuss: Optiver OA, "Worst Trade Reporter" (2023)', LC('3812812/optiver-oa-worst-trade-reporter-by-anony-cgzg')],
      kind: 'cls', name: 'WorstTrade',
      sig: { init: [], methods: [['onTrade', ['tradeId', 'instrument', 'side', 'price', 'volume'], ''], ['onPrice', ['instrument', 'value'], ''], ['worstTrade', ['instrument'], 'the id of the worst trade, or "NO BAD TRADES"']] },
      body: `<p>You are building a tool that tracks the profit and loss of trades. Each trade has an id, an instrument, a side (<code>"BUY"</code> or <code>"SELL"</code>), a price and a volume. Price updates tell you what an instrument is worth now.</p>
        <ul>
          <li><code>onTrade(tradeId, instrument, side, price, volume)</code>: a trade happened.</li>
          <li><code>onPrice(instrument, value)</code>: the instrument is now worth <code>value</code>.</li>
          <li><code>worstTrade(instrument)</code>: return the id of the trade with the biggest loss <b>per lot</b> at the latest value, or <code>"NO BAD TRADES"</code> if no trade is losing money.</li>
        </ul>
        <p>Per lot, a buy at price p makes v − p when the instrument is worth v; a sell at p makes p − v. A trade is bad if that is negative. If two trades lose the same amount per lot, report the more recent one. Before the first price update for an instrument, report <code>"NO BAD TRADES"</code>.</p>`,
      rules: ['Up to 200,000 calls. Trade ids are unique but not in time order.', 'The large test asks for the worst trade often, so going through every trade on each query is too slow.'],
      note: OURS,
      tests: [
        { ex: true, init: [], ops: [['onTrade', 1, 'OPT', 'BUY', 100, 5], ['onTrade', 2, 'OPT', 'BUY', 104, 1], ['onTrade', 3, 'OPT', 'SELL', 99, 10], ['worstTrade', 'OPT'], ['onPrice', 'OPT', 101], ['worstTrade', 'OPT'], ['onPrice', 'OPT', 110], ['worstTrade', 'OPT'], ['onPrice', 'OPT', 104], ['worstTrade', 'OPT'], ['worstTrade', 'XYZ']],
          out: [null, null, null, 'NO BAD TRADES', null, 2, null, 3, null, 3, 'NO BAD TRADES'],
          why: 'At 101, trade 2 loses 3 per lot, more than trade 1 (1 per lot, even though 5 lots lose 5 in total) or trade 3 (2 per lot). At 110 only the sell is losing. At 104 trade 2 breaks even, which is not a loss.' },
        { name: 'ties go to the latest trade', init: [], ops: [['onTrade', 7, 'A', 'BUY', 50, 1], ['onTrade', 4, 'A', 'BUY', 50, 3], ['onPrice', 'A', 45], ['worstTrade', 'A'], ['onTrade', 9, 'A', 'SELL', 40, 2], ['worstTrade', 'A']], out: [null, null, null, 4, null, 9] },
        { name: 'breaking even is not a loss', init: [], ops: [['onPrice', 'B', 10], ['onTrade', 1, 'B', 'BUY', 10, 1], ['worstTrade', 'B'], ['onTrade', 2, 'B', 'SELL', 9, 1], ['worstTrade', 'B']], out: [null, null, 'NO BAD TRADES', null, 2] },
        { name: 'instruments are separate', init: [], ops: [['onTrade', 1, 'X', 'BUY', 10, 1], ['onPrice', 'Y', 1], ['worstTrade', 'X'], ['onPrice', 'X', 5], ['worstTrade', 'Y'], ['worstTrade', 'X']], out: [null, null, 'NO BAD TRADES', null, 'NO BAD TRADES', 1] },
        { name: 'a later, worse buy takes over', init: [], ops: [['onPrice', 'C', 20], ['onTrade', 5, 'C', 'BUY', 25, 1], ['worstTrade', 'C'], ['onTrade', 6, 'C', 'BUY', 30, 1], ['worstTrade', 'C'], ['onTrade', 8, 'C', 'BUY', 22, 9], ['worstTrade', 'C']], out: [null, null, 5, null, 6, null, 6] },
      ],
      fuzz: (r) => {
        const ids = r.shuffle(Array.from({ length: 40 }, (_, i) => i + 1)), ops = [];
        for (let k = 0; k < 30; k++) {
          const x = r.next(), inst = r.pick(['A', 'B']);
          if (x < 0.5) ops.push(['onTrade', ids.pop(), inst, r.pick(['BUY', 'SELL']), r.int(1, 9), r.int(1, 5)]);
          else if (x < 0.8) ops.push(['onPrice', inst, r.int(1, 9)]);
          else ops.push(['worstTrade', inst]);
        }
        return { init: [], ops };
      },
      perf: {
        label: 'Large test: 200,000 calls on 5 instruments',
        gen: (r) => {
          const ops = [], insts = ['A', 'B', 'C', 'D', 'E'];
          for (let k = 0; k < 200000; k++) {
            const x = r.next(), inst = r.pick(insts);
            if (x < 0.45) ops.push(['onTrade', k, inst, r.pick(['BUY', 'SELL']), r.int(900, 1100), r.int(1, 100)]);
            else if (x < 0.8) ops.push(['onPrice', inst, r.int(900, 1100)]);
            else ops.push(['worstTrade', inst]);
          }
          return { init: [], ops };
        },
      },
      hints: [
        'Volume doesn\'t matter: the loss is measured per lot. So which buy can be the worst one, whatever the price does?',
        'For buys, the loss per lot is price − value, which is largest for the highest buy price. For sells it is value − price, largest for the lowest sell price. So you only need two trades per instrument.',
        'Keep, per instrument, the highest buy and the lowest sell (replacing on ties, so the latest wins) and the latest value. A query compares two candidates in O(1).',
      ],
      sol: {
        idea: 'The worst trade is always either the highest-priced buy or the lowest-priced sell, so keep just those two per instrument.',
        steps: [
          'At value v, a buy at p loses p − v per lot: the higher p, the worse. A sell at p loses v − p: the lower p, the worse. This holds whatever v is, so no other trade can ever be the worst.',
          'On each trade, update the instrument\'s highest buy or lowest sell, replacing it on a tie so the most recent trade wins ties. Keep an arrival counter to break a tie between the buy and the sell.',
          'On a query, compute both losses at the latest value, take the bigger (the later trade on a tie), and report it only if the loss is positive.',
        ],
        cx: 'O(1) per call, O(number of instruments) memory.',
        trap: 'Comparing total P&L (price × volume) instead of per lot, or keeping every trade in a heap when two numbers per instrument are enough. Also: a trade that breaks even is not bad.',
      },
      ref: {
        js: code`
          class WorstTrade {
            constructor() {
              this.inst = new Map(); // instrument -> { value, buy, sell }
              this.seq = 0;          // arrival order, to break ties
            }

            state(instrument) {
              if (!this.inst.has(instrument)) this.inst.set(instrument, { value: null, buy: null, sell: null });
              return this.inst.get(instrument);
            }

            onTrade(tradeId, instrument, side, price, volume) {
              // Only the highest buy and the lowest sell can ever be the worst trade.
              const s = this.state(instrument), t = { id: tradeId, price, seq: this.seq++ };
              if (side === 'BUY') {
                if (!s.buy || price >= s.buy.price) s.buy = t;
              } else if (!s.sell || price <= s.sell.price) s.sell = t;
            }

            onPrice(instrument, value) {
              this.state(instrument).value = value;
            }

            worstTrade(instrument) {
              const s = this.inst.get(instrument);
              if (!s || s.value === null) return 'NO BAD TRADES';
              const cands = [];
              if (s.buy) cands.push([s.buy.price - s.value, s.buy]);
              if (s.sell) cands.push([s.value - s.sell.price, s.sell]);
              let worst = null;
              for (const [loss, t] of cands) {
                if (loss > 0 && (!worst || loss > worst[0] || (loss === worst[0] && t.seq > worst[1].seq))) worst = [loss, t];
              }
              return worst ? worst[1].id : 'NO BAD TRADES';
            }
          }`,
        py: code`
          class WorstTrade:
              def __init__(self):
                  self.value = {}   # instrument -> latest value
                  self.buy = {}     # instrument -> (price, seq, id) of the highest buy, latest if tied
                  self.sell = {}    # instrument -> (price, seq, id) of the lowest sell, latest if tied
                  self.seq = 0      # arrival order, to break ties

              def on_trade(self, trade_id, instrument, side, price, volume):
                  # Only the highest buy and the lowest sell can ever be the worst trade.
                  self.seq += 1
                  t = (price, self.seq, trade_id)
                  if side == 'BUY':
                      if instrument not in self.buy or price >= self.buy[instrument][0]:
                          self.buy[instrument] = t
                  elif instrument not in self.sell or price <= self.sell[instrument][0]:
                      self.sell[instrument] = t

              def on_price(self, instrument, value):
                  self.value[instrument] = value

              def worst_trade(self, instrument):
                  if instrument not in self.value:
                      return 'NO BAD TRADES'
                  v = self.value[instrument]
                  worst = None   # (loss per lot, seq, id)
                  if instrument in self.buy:
                      p, seq, i = self.buy[instrument]
                      worst = (p - v, seq, i)
                  if instrument in self.sell:
                      p, seq, i = self.sell[instrument]
                      cand = (v - p, seq, i)
                      if worst is None or cand[:2] > worst[:2]:
                          worst = cand
                  return worst[2] if worst and worst[0] > 0 else 'NO BAD TRADES'`,
      },
    },
    {
      id: 'opt-checkout', title: 'Supermarket checkout', group: 'oa', diff: 'Medium', tags: ['queues', 'hash map', 'design'],
      src: ['LeetCode Discuss: Optiver OA, "Supermarket Checkout" (2024)', LC('5308185/optiver-oa-supermarket-checkout-by-anony-5bev')],
      kind: 'cls', name: 'Checkout',
      sig: { init: [], methods: [['enter', ['customer', 'line', 'items'], ''], ['change', ['customer', 'items'], 'a list of the customers who left'], ['serve', ['line', 'n'], 'a list of the customers who left, in order'], ['serveAll', [], 'a list of the customers who left, in order']] },
      body: `<p>Customers queue at numbered checkout lines with baskets of items. Report who leaves the shop, and in what order. The rules:</p>
        <ul>
          <li>A customer never changes line.</li>
          <li>If they add items, they must go to the back of their line. If they remove items, they keep their place.</li>
          <li>A customer leaves as soon as they have no items left.</li>
          <li>Lower-numbered lines are nearer the exit: if customers in several lines leave at the same moment, the one in the lowest-numbered line leaves first.</li>
        </ul>
        <p>Implement:</p>
        <ul>
          <li><code>enter(customer, line, items)</code>: the customer joins the back of a line with <code>items</code> ≥ 1 items.</li>
          <li><code>change(customer, items)</code>: the customer now has <code>items</code> items in total. Return <code>[customer]</code> if that is 0 (they leave), otherwise <code>[]</code>. A customer who isn't in the shop is ignored (return <code>[]</code>).</li>
          <li><code>serve(line, n)</code>: the line processes <code>n</code> items from the front. The first customer's items go down; if they reach 0 that customer leaves and the rest of the <code>n</code> items go to the next customer, and so on. Return the customers who left, in order. An empty line ignores the call.</li>
          <li><code>serveAll()</code>: every line with customers processes one item. Return the customers who left, by line number.</li>
        </ul>`,
      rules: ['Up to 200,000 calls and 100 lines. Customer ids are unique.', 'Adding items to reach the same total as before (no change) keeps the customer\'s place.'],
      note: OURS,
      tests: [
        { ex: true, init: [], ops: [['enter', 1, 1, 3], ['enter', 2, 1, 2], ['enter', 3, 2, 1], ['serveAll'], ['change', 1, 5], ['serve', 1, 3], ['change', 1, 1], ['serveAll'], ['serve', 2, 4]],
          out: [null, null, null, [3], [], [2], [], [1], []],
          why: 'Customer 1 added items, so moved behind customer 2. Serving 3 items then finishes customer 2 (2 items) and takes 1 from customer 1. Removing items keeps customer 1 at the front.' },
        { name: 'lines nearer the exit leave first', init: [], ops: [['enter', 10, 3, 1], ['enter', 11, 1, 1], ['enter', 12, 2, 2], ['serveAll'], ['change', 12, 0]], out: [null, null, null, [11, 10], [12]] },
        { name: 'serving carries over to the next customer', init: [], ops: [['enter', 1, 5, 1], ['enter', 2, 5, 1], ['enter', 3, 5, 1], ['enter', 4, 5, 2], ['serve', 5, 4], ['serve', 5, 10], ['serve', 5, 1]], out: [null, null, null, null, [1, 2, 3], [4], []] },
        { name: 'the same total keeps your place', init: [], ops: [['enter', 1, 1, 2], ['enter', 2, 1, 2], ['change', 1, 2], ['serve', 1, 2]], out: [null, null, [], [1]] },
        { name: 'moving to the back stays in the same line', init: [], ops: [['enter', 1, 1, 1], ['enter', 2, 1, 1], ['enter', 3, 2, 1], ['change', 1, 3], ['serveAll'], ['serve', 1, 3]], out: [null, null, null, [], [2, 3], [1]] },
        { name: 'unknown customers and empty lines', init: [], ops: [['change', 9, 0], ['serve', 4, 2], ['serveAll'], ['enter', 9, 4, 1], ['change', 9, 0], ['change', 9, 3]], out: [[], [], [], null, [9], []] },
      ],
      fuzz: (r) => {
        const ops = [];
        let next = 1;
        for (let k = 0; k < 30; k++) {
          const x = r.next();
          if (x < 0.4 || next === 1) ops.push(['enter', next++, r.int(1, 3), r.int(1, 4)]);
          else if (x < 0.6) ops.push(['change', r.int(1, next - 1), r.int(0, 5)]);
          else if (x < 0.8) ops.push(['serve', r.int(1, 3), r.int(1, 5)]);
          else ops.push(['serveAll']);
        }
        return { init: [], ops };
      },
      perf: {
        label: 'Large test: 200,000 calls across 100 lines',
        gen: (r) => {
          const ops = [];
          let next = 1;
          for (let k = 0; k < 200000; k++) {
            const x = r.next();
            if (x < 0.45 || next === 1) ops.push(['enter', next++, r.int(1, 100), r.int(1, 20)]);
            else if (x < 0.75) ops.push(['change', r.int(Math.max(1, next - 3000), next - 1), r.int(0, 25)]);
            else if (x < 0.95) ops.push(['serve', r.int(1, 100), r.int(1, 30)]);
            else ops.push(['serveAll']);
          }
          return { init: [], ops };
        },
      },
      hints: [
        'Each line is a queue, but customers can also leave or jump to the back from the middle. What lets you remove or move one customer in O(1)?',
        'Keep, for each customer, which line they are in, and for each line an insertion-ordered map from customer to items (Python\'s OrderedDict, a JavaScript Map). Moving to the back is delete-and-reinsert (or move_to_end).',
        'serve(line, n) works through the front of one queue, carrying leftover items to the next customer. serveAll() calls serve(line, 1) on each line in increasing line number.',
      ],
      sol: {
        idea: 'One insertion-ordered map per line, plus a map from customer to line, gives O(1) joins, moves to the back and removals anywhere.',
        steps: [
          'enter: put the customer at the end of their line\'s map and remember the line.',
          'change: if 0, remove them and report them. If more items than before, delete and re-insert (to the back). If fewer or the same, update the count in place.',
          'serve(line, n): while n > 0 and the line isn\'t empty, take the front customer: use min(n, items) of the n items; if that finishes them, remove and report them and carry on.',
          'serveAll: go through the lines in increasing number and serve one item each, collecting who left.',
        ],
        cx: 'O(1) per item processed, so O(total items) overall, plus O(L log L) per serveAll for L lines.',
        trap: 'Using a plain list per line and removing customers from the middle (O(n) each), or forgetting that leftover items carry over to the next customer.',
      },
      ref: {
        js: code`
          class Checkout {
            constructor() {
              this.lines = new Map(); // line -> Map(customer -> items), front of the line first
              this.where = new Map(); // customer -> line
              this.order = [];        // line numbers, smallest first
            }

            queue(line) {
              if (!this.lines.has(line)) {
                this.lines.set(line, new Map());
                this.order.push(line);
                this.order.sort((a, b) => a - b);
              }
              return this.lines.get(line);
            }

            enter(customer, line, items) {
              this.queue(line).set(customer, items);
              this.where.set(customer, line);
            }

            change(customer, items) {
              if (!this.where.has(customer)) return [];
              const q = this.lines.get(this.where.get(customer));
              if (items === 0) {
                q.delete(customer);
                this.where.delete(customer);
                return [customer];
              }
              if (items > q.get(customer)) q.delete(customer); // re-inserting puts them at the back
              q.set(customer, items);
              return [];
            }

            serve(line, n) {
              const q = this.lines.get(line), out = [];
              if (!q) return out;
              for (const [c, items] of q) {
                if (n <= 0) break;
                const used = Math.min(n, items);
                n -= used;
                if (used === items) {
                  q.delete(c);
                  this.where.delete(c);
                  out.push(c);
                } else q.set(c, items - used);
              }
              return out;
            }

            serveAll() {
              return this.order.flatMap((line) => this.serve(line, 1));
            }
          }`,
        py: code`
          from collections import OrderedDict

          class Checkout:
              def __init__(self):
                  self.lines = {}   # line -> OrderedDict(customer -> items), front of the line first
                  self.where = {}   # customer -> line

              def enter(self, customer, line, items):
                  self.lines.setdefault(line, OrderedDict())[customer] = items
                  self.where[customer] = line

              def change(self, customer, items):
                  if customer not in self.where:
                      return []
                  q = self.lines[self.where[customer]]
                  if items == 0:
                      del q[customer]
                      del self.where[customer]
                      return [customer]
                  if items > q[customer]:
                      q.move_to_end(customer)   # more items: back of the line
                  q[customer] = items
                  return []

              def serve(self, line, n):
                  q, out = self.lines.get(line), []
                  while q and n > 0:
                      c, items = next(iter(q.items()))
                      used = min(n, items)
                      n -= used
                      if used == items:
                          q.popitem(last=False)
                          del self.where[c]
                          out.append(c)
                      else:
                          q[c] = items - used
                  return out

              def serve_all(self):
                  out = []
                  for line in sorted(self.lines):
                      out += self.serve(line, 1)
                  return out`,
      },
    },
    {
      id: 'opt-tickets', title: 'Ticket feed', group: 'oa', diff: 'Medium', tags: ['streams', 'hash map'],
      src: ['LeetCode Discuss: Optiver SWE intern OA, "Concert Tickets" (2023)', LC('4129875/optiver-oa-concert-tickets-by-anonymous_-56wh')],
      kind: 'cls', name: 'TicketBot',
      sig: { init: ['wishes'], methods: [['packet', ['msg', 'value'], '[msg, seats] to buy, or null']] },
      body: `<p>A ticket-resale feed sends each listing as five packets that share a message id: <b>artist, venue, price, category, seats</b>, always in that order within a message. Packets from different messages are interleaved.</p>
        <p>Your wish list says, for an artist at a venue, the most you will pay, the lowest seating category you will accept (higher is better) and how many seats you need. Buy the <b>first</b> listing to arrive complete that meets a wish, then drop that wish.</p>
        <ul>
          <li><code>TicketBot(wishes)</code>: <code>wishes</code> is a list of <code>[artist, venue, maxPrice, minCategory, seats]</code>. Each artist and venue pair appears at most once.</li>
          <li><code>packet(msg, value)</code>: one packet. If it completes a listing that meets a wish you haven't filled (same artist and venue, price ≤ maxPrice, category ≥ minCategory, and at least the seats you need), return <code>[msg, seats you need]</code> and mark the wish filled. Otherwise return null.</li>
        </ul>
        <p>All values are integers (artists and venues are numeric ids). Message ids never repeat.</p>`,
      rules: ['Up to 200,000 packets and 10,000 wishes.', 'The large test has thousands of wishes, so checking every wish when a listing completes is too slow.'],
      note: OURS,
      tests: [
        { ex: true, init: [[[7, 1, 100, 2, 2], [7, 2, 80, 1, 4]]],
          ops: [['packet', 10, 7], ['packet', 11, 7], ['packet', 10, 1], ['packet', 11, 2], ['packet', 10, 120], ['packet', 11, 80], ['packet', 10, 3], ['packet', 11, 1], ['packet', 10, 5], ['packet', 11, 4],
            ['packet', 12, 7], ['packet', 13, 7], ['packet', 12, 1], ['packet', 13, 1], ['packet', 12, 95], ['packet', 13, 50], ['packet', 12, 2], ['packet', 13, 5], ['packet', 13, 9], ['packet', 12, 2]],
          out: [null, null, null, null, null, null, null, null, null, [11, 4], null, null, null, null, null, null, null, null, [13, 2], null],
          why: 'Listing 10 costs 120, over the limit of 100. Listing 11 meets the second wish. Listings 12 and 13 both meet the first wish, but 13 completes first.' },
        { name: 'category must be high enough', init: [[[1, 1, 50, 3, 1]]], ops: [['packet', 1, 1], ['packet', 1, 1], ['packet', 1, 50], ['packet', 1, 2], ['packet', 1, 1], ['packet', 2, 1], ['packet', 2, 1], ['packet', 2, 50], ['packet', 2, 3], ['packet', 2, 1]], out: [null, null, null, null, null, null, null, null, null, [2, 1]] },
        { name: 'enough seats', init: [[[5, 5, 10, 1, 3]]], ops: [['packet', 1, 5], ['packet', 1, 5], ['packet', 1, 10], ['packet', 1, 1], ['packet', 1, 2], ['packet', 2, 5], ['packet', 2, 5], ['packet', 2, 9], ['packet', 2, 4], ['packet', 2, 3]], out: [null, null, null, null, null, null, null, null, null, [2, 3]] },
        { name: 'artist and venue must both match', init: [[[1, 2, 10, 1, 1]]], ops: [['packet', 1, 2], ['packet', 1, 1], ['packet', 1, 10], ['packet', 1, 1], ['packet', 1, 1]], out: [null, null, null, null, null] },
        { name: 'no wishes', init: [[]], ops: [['packet', 4, 1], ['packet', 4, 1], ['packet', 4, 1], ['packet', 4, 1], ['packet', 4, 1]], out: [null, null, null, null, null] },
      ],
      fuzz: (r) => {
        const wishes = [];
        for (const a of [1, 2]) for (const v of [1, 2]) if (r.chance(0.6)) wishes.push([a, v, r.int(5, 15), r.int(1, 4), r.int(1, 4)]);
        const msgs = Array.from({ length: 6 }, (_, k) => ({ id: 100 + k, vals: [r.int(1, 2), r.int(1, 2), r.int(5, 15), r.int(1, 4), r.int(1, 4)], k: 0 }));
        const ops = [];
        while (msgs.some((m) => m.k < 5)) {
          const m = r.pick(msgs.filter((x) => x.k < 5));
          ops.push(['packet', m.id, m.vals[m.k++]]);
        }
        return { init: [wishes], ops };
      },
      perf: {
        label: 'Large test: 10,000 wishes and 200,000 packets',
        gen: (r) => {
          const wishes = [];
          for (let a = 0; a < 100; a++) for (let v = 0; v < 100; v++) wishes.push([a, v, r.int(50, 150), r.int(1, 5), r.int(1, 6)]);
          const ops = [], live = [];
          let id = 0;
          while (ops.length < 200000) {
            while (live.length < 1000) live.push({ id: id++, vals: [r.int(0, 99), r.int(0, 99), r.int(40, 200), r.int(1, 5), r.int(1, 8)], k: 0 });
            const i = r.int(0, live.length - 1), m = live[i];
            ops.push(['packet', m.id, m.vals[m.k++]]);
            if (m.k === 5) {
              live[i] = live[live.length - 1];
              live.pop();
            }
          }
          return { init: [wishes], ops };
        },
      },
      hints: [
        'Two separate jobs: put each message back together, then check it against your wishes.',
        'A map from message id to the values received so far reassembles messages. When a message has five values it is complete: remove it from the map.',
        'Index the wishes by (artist, venue) in a map so checking a complete listing is O(1), and keep a "filled" flag per wish.',
      ],
      sol: {
        idea: 'Reassemble listings in a map keyed by message id, and look wishes up in a map keyed by (artist, venue).',
        steps: [
          'packet: append the value to the message\'s list. Fewer than five values: return null.',
          'Five values: delete the message from the map (so memory doesn\'t grow), unpack artist, venue, price, category, seats.',
          'Look up the wish for (artist, venue). Buy if it exists, isn\'t filled, price ≤ max, category ≥ min and seats ≥ needed: mark it filled and return [msg, seats needed].',
        ],
        cx: 'O(1) per packet; memory proportional to the wishes plus the listings still incomplete.',
        trap: 'Buying the same wish twice, or comparing the category the wrong way round (a higher category is better here).',
      },
      ref: {
        js: code`
          class TicketBot {
            constructor(wishes) {
              this.wish = new Map(); // "artist:venue" -> wish
              for (const [a, v, maxPrice, minCategory, seats] of wishes) this.wish.set(a + ':' + v, { maxPrice, minCategory, seats, filled: false });
              this.parts = new Map(); // message id -> values received so far
            }

            packet(msg, value) {
              const got = this.parts.get(msg) || [];
              got.push(value);
              if (got.length < 5) {
                this.parts.set(msg, got);
                return null;
              }
              this.parts.delete(msg);
              const [artist, venue, price, category, seats] = got;
              const w = this.wish.get(artist + ':' + venue);
              if (!w || w.filled || price > w.maxPrice || category < w.minCategory || seats < w.seats) return null;
              w.filled = true;
              return [msg, w.seats];
            }
          }`,
        py: code`
          class TicketBot:
              def __init__(self, wishes):
                  # (artist, venue) -> [max price, min category, seats, filled]
                  self.wish = {(a, v): [p, c, s, False] for a, v, p, c, s in wishes}
                  self.parts = {}   # message id -> values received so far

              def packet(self, msg, value):
                  got = self.parts.setdefault(msg, [])
                  got.append(value)
                  if len(got) < 5:
                      return None
                  del self.parts[msg]
                  artist, venue, price, category, seats = got
                  w = self.wish.get((artist, venue))
                  if not w or w[3] or price > w[0] or category < w[1] or seats < w[2]:
                      return None
                  w[3] = True
                  return [msg, w[2]]`,
      },
    },
    {
      id: 'opt-log-window', title: 'Busiest service in the last hour', group: 'oa', diff: 'Medium', tags: ['sliding window', 'heap', 'lazy deletion'],
      src: ['Glassdoor: Optiver software engineer internship (2024), "write a log server that records all the logs in the latest hour"', GDS],
      kind: 'cls', name: 'LogMonitor',
      sig: { init: [], methods: [['log', ['t', 'service'], ''], ['count', ['t'], 'the number of log lines in the last hour'], ['busiest', ['t'], 'the busiest service in the last hour, or ""']] },
      body: `<p>A log server receives lines from many services and answers questions about the last hour. "The last hour" at time t means times in (t − 3600, t]: a line from exactly 3600 seconds ago no longer counts.</p>
        <ul>
          <li><code>log(t, service)</code>: a log line from <code>service</code> at time <code>t</code> (seconds).</li>
          <li><code>count(t)</code>: return how many log lines are in the last hour.</li>
          <li><code>busiest(t)</code>: return the service with the most lines in the last hour. On a tie, the alphabetically first name. If there are none, return <code>""</code>.</li>
        </ul>`,
      rules: ['Times are integers, and never decrease from one call to the next.', 'Up to 200,000 calls and 5,000 services. The large test asks busiest often, so counting every service on each query is too slow.'],
      note: 'Our version: the report gave only the one-line task.',
      tests: [
        { ex: true, init: [], ops: [['log', 0, 'api'], ['log', 10, 'db'], ['log', 20, 'db'], ['count', 20], ['busiest', 20], ['log', 3600, 'api'], ['count', 3600], ['busiest', 3600], ['busiest', 3620], ['count', 3620], ['count', 7200], ['busiest', 7200]],
          out: [null, null, null, 3, 'db', null, 3, 'db', 'api', 1, 0, ''],
          why: 'At 3600 the line from time 0 is exactly an hour old, so it drops out. At 3620 only the line from 3600 is left.' },
        { name: 'ties go to the first name', init: [], ops: [['log', 5, 'b'], ['log', 6, 'a'], ['busiest', 6], ['log', 7, 'b'], ['busiest', 7], ['busiest', 3605], ['busiest', 3606]], out: [null, null, 'a', null, 'b', 'a', 'b'] },
        { name: 'several lines at the same time', init: [], ops: [['log', 100, 'x'], ['log', 100, 'x'], ['log', 100, 'x'], ['count', 100], ['count', 3699], ['count', 3700], ['busiest', 3700]], out: [null, null, null, 3, 3, 0, ''] },
        { name: 'a count can go down and back up', init: [], ops: [['log', 0, 'a'], ['log', 1, 'a'], ['log', 2, 'b'], ['busiest', 2], ['busiest', 3600], ['log', 3601, 'b'], ['busiest', 3601], ['log', 3602, 'a'], ['busiest', 3602]], out: [null, null, null, 'a', 'a', null, 'b', null, 'a'] },
        { name: 'nothing logged', init: [], ops: [['count', 0], ['busiest', 0]], out: [0, ''] },
      ],
      fuzz: (r) => {
        const ops = [];
        let t = 0;
        for (let k = 0; k < 30; k++) {
          t += r.pick([0, 0, 1, 500, 1800, 3599, 3600, 3601]);
          const x = r.next();
          if (x < 0.6) ops.push(['log', t, r.pick(['a', 'b', 'c'])]);
          else if (x < 0.8) ops.push(['count', t]);
          else ops.push(['busiest', t]);
        }
        return { init: [], ops };
      },
      perf: {
        label: 'Large test: 200,000 calls from 5,000 services',
        gen: (r) => {
          const ops = [];
          let t = 0;
          for (let k = 0; k < 200000; k++) {
            t += r.int(0, 1);
            const x = r.next();
            if (x < 0.5) ops.push(['log', t, 's' + r.int(0, 4999)]);
            else if (x < 0.9) ops.push(['busiest', t]);
            else ops.push(['count', t]);
          }
          return { init: [], ops };
        },
      },
      hints: [
        'Keep the lines in a queue in time order. Before answering anything at time t, drop lines from the front with time ≤ t − 3600.',
        'Keep a count per service, updated as lines enter and leave the window. count(t) is then the queue length.',
        'For busiest, a heap of (−count, name) gives the answer in O(log n), but counts go down as well as up and heaps can\'t update an entry. Push a fresh entry on every change, and when the top entry\'s count no longer matches the real count, pop it and look again (lazy deletion).',
      ],
      sol: {
        idea: 'A queue for the sliding window, counts per service, and a heap with lazy deletion for the maximum.',
        steps: [
          'Window: a queue of (time, service). Expire from the front while time ≤ t − 3600, decrementing that service\'s count.',
          'Whenever a count changes, push (−new count, name) onto the heap. Old entries for that service are now stale but stay in the heap.',
          'busiest(t): expire, then pop while the top entry\'s count differs from the service\'s real count. The top is then the busiest service, and ties go to the smaller name because the heap orders by (−count, name).',
        ],
        cx: 'O(log n) amortised per call: each change pushes one heap entry, and each entry is popped at most once.',
        trap: 'The window edge: a line from exactly t − 3600 is out. And reporting a service whose count has dropped to zero from a stale heap entry.',
      },
      ref: {
        js: code`
          class LogMonitor {
            constructor() {
              this.times = [];         // the window, oldest first, from index head
              this.names = [];
              this.head = 0;
              this.counts = new Map(); // service -> lines in the window
              this.heap = [];          // [count, service], busiest first; stale entries are skipped
            }

            less(a, b) {
              return a[0] !== b[0] ? a[0] > b[0] : a[1] < b[1]; // more lines first, then A to Z
            }

            push(e) {
              const h = this.heap;
              h.push(e);
              for (let i = h.length - 1; i > 0;) {
                const p = (i - 1) >> 1;
                if (!this.less(h[i], h[p])) break;
                [h[i], h[p]] = [h[p], h[i]];
                i = p;
              }
            }

            pop() {
              const h = this.heap, last = h.pop();
              if (!h.length) return;
              h[0] = last;
              for (let i = 0; ;) {
                const l = 2 * i + 1, r = l + 1;
                let m = i;
                if (l < h.length && this.less(h[l], h[m])) m = l;
                if (r < h.length && this.less(h[r], h[m])) m = r;
                if (m === i) break;
                [h[i], h[m]] = [h[m], h[i]];
                i = m;
              }
            }

            set(service, c) {
              if (c) {
                this.counts.set(service, c);
                this.push([c, service]);
              } else this.counts.delete(service);
            }

            expire(t) {
              while (this.head < this.times.length && this.times[this.head] <= t - 3600) {
                const s = this.names[this.head++];
                this.set(s, this.counts.get(s) - 1);
              }
            }

            log(t, service) {
              this.expire(t);
              this.times.push(t);
              this.names.push(service);
              this.set(service, (this.counts.get(service) || 0) + 1);
            }

            count(t) {
              this.expire(t);
              return this.times.length - this.head;
            }

            busiest(t) {
              this.expire(t);
              while (this.heap.length && this.counts.get(this.heap[0][1]) !== this.heap[0][0]) this.pop();
              return this.heap.length ? this.heap[0][1] : '';
            }
          }`,
        py: code`
          import heapq
          from collections import deque

          class LogMonitor:
              def __init__(self):
                  self.window = deque()   # (time, service), oldest first
                  self.counts = {}        # service -> lines in the window
                  self.heap = []          # (-count, service); stale entries are skipped

              def _set(self, service, c):
                  if c:
                      self.counts[service] = c
                      heapq.heappush(self.heap, (-c, service))
                  else:
                      del self.counts[service]

              def _expire(self, t):
                  while self.window and self.window[0][0] <= t - 3600:
                      _, s = self.window.popleft()
                      self._set(s, self.counts[s] - 1)

              def log(self, t, service):
                  self._expire(t)
                  self.window.append((t, service))
                  self._set(service, self.counts.get(service, 0) + 1)

              def count(self, t):
                  self._expire(t)
                  return len(self.window)

              def busiest(self, t):
                  self._expire(t)
                  while self.heap and self.counts.get(self.heap[0][1]) != -self.heap[0][0]:
                      heapq.heappop(self.heap)
                  return self.heap[0][1] if self.heap else ''`,
      },
    },
    {
      id: 'opt-trucks', title: 'Truck position updates', group: 'oa', diff: 'Medium', tags: ['publish/subscribe', 'hash map', 'design'],
      src: ['LeetCode Discuss: Optiver OA, "Truck Positions" (2023)', LC('3816133/optiver-oa-truck-positions-by-anonymous_-61tf')],
      kind: 'cls', name: 'TruckHub',
      sig: { init: ['positions'], methods: [['subscribe', ['client', 'truck'], 'the truck\'s current position [x, y]'], ['move', ['truck', 'dx', 'dy'], ''], ['poll', ['client'], 'the client\'s new moves [[truck, dx, dy], ...]']] },
      body: `<p>A delivery firm streams truck positions to its local offices. Each office runs one subscriber service that its apps (clients) talk to, so the central server is asked about each truck only once. Implement that service:</p>
        <ul>
          <li><code>TruckHub(positions)</code>: <code>positions[t]</code> is truck <code>t</code>'s starting position <code>[x, y]</code>.</li>
          <li><code>subscribe(client, truck)</code>: return the truck's current position <code>[x, y]</code>. From now on the client receives that truck's moves. Subscribing again to a truck you already follow just returns its position.</li>
          <li><code>move(truck, dx, dy)</code>: the truck moved by (dx, dy).</li>
          <li><code>poll(client)</code>: return every move <code>[truck, dx, dy]</code> of the client's trucks since its last poll (or since it subscribed), in the order the moves happened. <code>[]</code> if there are none, or the client is unknown.</li>
        </ul>
        <p>Coordinates are multiples of 0.5.</p>`,
      rules: ['Up to 1,000 trucks, 1,000 clients and 200,000 calls.', 'In the large test each client follows a few trucks, so scanning the whole history of moves on each poll is too slow.'],
      note: OURS,
      tests: [
        { ex: true, init: [[[1, 1], [4, 0]]], ops: [['move', 0, 0.5, 2], ['subscribe', 7, 0], ['move', 0, 2, -1], ['move', 1, 5, 5], ['move', 0, -0.5, 0.5], ['subscribe', 8, 0], ['poll', 7], ['move', 0, 1, 1], ['poll', 8], ['poll', 7], ['poll', 7]],
          out: [null, [1.5, 3], null, null, null, [3, 2.5], [[0, 2, -1], [0, -0.5, 0.5]], null, [[0, 1, 1]], [[0, 1, 1]], []],
          why: 'Client 7 gets truck 0\'s moves after it subscribed, but not truck 1\'s. Client 8 subscribed later, so its first poll has only the last move.' },
        { name: 'moves of several trucks, in order, without duplicates', init: [[[0, 0], [10, 10]]], ops: [['subscribe', 1, 1], ['subscribe', 1, 0], ['move', 0, 1, 0], ['move', 1, 0, 1], ['move', 0, 0, 1], ['subscribe', 1, 1], ['move', 1, 1, 1], ['poll', 1]],
          out: [[10, 10], [0, 0], null, null, null, [10, 11], null, [[0, 1, 0], [1, 0, 1], [0, 0, 1], [1, 1, 1]]] },
        { name: 'unknown client', init: [[[0, 0]]], ops: [['poll', 99], ['move', 0, 1, 1], ['poll', 99]], out: [[], null, []] },
        { name: 'a client that never subscribed to the truck', init: [[[0, 0], [5, 5]]], ops: [['subscribe', 1, 0], ['move', 1, 1, 1], ['poll', 1], ['subscribe', 2, 1], ['poll', 2]], out: [[0, 0], null, [], [6, 6], []] },
      ],
      fuzz: (r) => {
        const half = () => r.int(-4, 4) / 2, ops = [];
        for (let k = 0; k < 30; k++) {
          const x = r.next();
          if (x < 0.2) ops.push(['subscribe', r.int(1, 3), r.int(0, 2)]);
          else if (x < 0.7) ops.push(['move', r.int(0, 2), half(), half()]);
          else ops.push(['poll', r.int(1, 4)]);
        }
        return { init: [[[half(), half()], [half(), half()], [half(), half()]]], ops };
      },
      perf: {
        label: 'Large test: 1,000 trucks, 1,000 clients, 200,000 calls',
        gen: (r) => {
          const positions = Array.from({ length: 1000 }, () => [r.int(0, 1000), r.int(0, 1000)]), ops = [];
          for (let c = 0; c < 1000; c++) for (let k = 0; k < 3; k++) ops.push(['subscribe', c, r.int(0, 999)]);
          while (ops.length < 200000) {
            if (r.chance(0.75)) ops.push(['move', r.int(0, 999), r.int(-4, 4) / 2, r.int(-4, 4) / 2]);
            else ops.push(['poll', r.int(0, 999)]);
          }
          return { init: [positions], ops };
        },
      },
      hints: [
        'Turn it around: instead of each client searching for its moves when it polls, deliver each move to the clients that want it when it happens.',
        'Keep, for each truck, the list of clients following it, and for each client a list of moves waiting to be collected. A set per client stops duplicate subscriptions.',
        'move: update the position, then append [truck, dx, dy] to each follower\'s waiting list. poll: return the client\'s list and replace it with an empty one.',
      ],
      sol: {
        idea: 'Publish/subscribe: fan each move out to its followers\' inboxes when it happens, so a poll just empties one inbox.',
        steps: [
          'subscribe: if the client doesn\'t follow the truck yet, add it to the truck\'s follower list (and to the client\'s set). Return a copy of the current position.',
          'move: add (dx, dy) to the position and append the move to each follower\'s inbox. Appending in call order keeps every inbox in the order the moves happened.',
          'poll: hand back the inbox and start a new empty one.',
        ],
        cx: 'O(followers) per move, O(1) per subscribe, and O(moves returned) per poll.',
        trap: 'Returning a reference to the stored position (a later move would change what the caller holds), and sending the same move twice to a client who subscribed twice.',
      },
      ref: {
        js: code`
          class TruckHub {
            constructor(positions) {
              this.pos = positions.map((p) => p.slice());
              this.followers = positions.map(() => []); // truck -> clients
              this.follows = new Map();                  // client -> Set of trucks
              this.inbox = new Map();                    // client -> moves since its last poll
            }

            subscribe(client, truck) {
              if (!this.follows.has(client)) {
                this.follows.set(client, new Set());
                this.inbox.set(client, []);
              }
              const f = this.follows.get(client);
              if (!f.has(truck)) {
                f.add(truck);
                this.followers[truck].push(client);
              }
              return this.pos[truck].slice();
            }

            move(truck, dx, dy) {
              this.pos[truck][0] += dx;
              this.pos[truck][1] += dy;
              for (const c of this.followers[truck]) this.inbox.get(c).push([truck, dx, dy]);
            }

            poll(client) {
              const out = this.inbox.get(client) || [];
              if (this.inbox.has(client)) this.inbox.set(client, []);
              return out;
            }
          }`,
        py: code`
          class TruckHub:
              def __init__(self, positions):
                  self.pos = [list(p) for p in positions]
                  self.followers = [[] for _ in positions]   # truck -> clients
                  self.follows = {}                          # client -> set of trucks
                  self.inbox = {}                            # client -> moves since its last poll

              def subscribe(self, client, truck):
                  f = self.follows.setdefault(client, set())
                  self.inbox.setdefault(client, [])
                  if truck not in f:
                      f.add(truck)
                      self.followers[truck].append(client)
                  return list(self.pos[truck])

              def move(self, truck, dx, dy):
                  self.pos[truck][0] += dx
                  self.pos[truck][1] += dy
                  for c in self.followers[truck]:
                      self.inbox[c].append([truck, dx, dy])

              def poll(self, client):
                  out = self.inbox.get(client, [])
                  if client in self.inbox:
                      self.inbox[client] = []
                  return out`,
      },
    },
    {
      id: 'opt-numbers-station', title: 'Numbers station', group: 'oa', diff: 'Hard', tags: ['hash map', 'strings', 'streams'],
      src: ['LeetCode Discuss: Optiver new-grad OA, "Numbers Station" (2023)', LC('4004200/optiver-new-grad-online-assessment-numbe-yds9')],
      kind: 'cls', name: 'Decoder',
      sig: { init: [], methods: [['sample', ['seq', 'ch'], 'a list with the message this sample completes, or []']] },
      body: `<p>A radio station reads out a broadcast one character at a time, each with its sequence number (its position in the broadcast), but the samples reach you in a scrambled order. Characters are lowercase letters or <code>"-"</code>.</p>
        <p>A <b>message</b> is a run of one or more letters with a <code>"-"</code> on each side, once you have every sequence number from one hyphen to the other. Report each message as soon as it is complete:</p>
        <ul>
          <li><code>sample(seq, ch)</code>: return <code>[message]</code> if this sample completes a message, otherwise <code>[]</code>.</li>
        </ul>
        <p>Two more rules:</p>
        <ul>
          <li>Once you have reported a message, any message that completes later but comes <b>earlier</b> in the broadcast (lower sequence numbers) is stale: don't report it.</li>
          <li>If one sample completes two messages at once (a hyphen that closes one and opens the next), report only the later one.</li>
        </ul>`,
      rules: ['Up to 100,000 samples. Sequence numbers are distinct, from 0 up.', 'Messages have at most 20 letters. Some messages never complete (a sample is missing).', 'Rebuilding the broadcast after every sample is too slow for the large test.'],
      note: OURS,
      tests: [
        { ex: true, init: [], ops: [['sample', 3, '-'], ['sample', 1, 'h'], ['sample', 0, '-'], ['sample', 2, 'i'], ['sample', 6, '-'], ['sample', 5, 'o'], ['sample', 4, 'y']],
          out: [[], [], [], ['hi'], [], [], ['yo']],
          why: 'The broadcast is "-hi-yo-". "hi" completes when sample 2 arrives, "yo" when sample 4 does.' },
        { ex: true, name: 'a stale message', init: [], ops: [['sample', 2, '-'], ['sample', 3, 'b'], ['sample', 4, '-'], ['sample', 1, 'a'], ['sample', 0, '-']],
          out: [[], [], ['b'], [], []], why: '"a" completes after "b" was reported, but comes before it in the broadcast, so it is dropped.' },
        { name: 'two at once: report the later', init: [], ops: [['sample', 0, '-'], ['sample', 1, 'a'], ['sample', 3, 'b'], ['sample', 4, '-'], ['sample', 2, '-']], out: [[], [], [], [], ['b']] },
        { name: 'two hyphens in a row are not a message', init: [], ops: [['sample', 0, '-'], ['sample', 1, '-'], ['sample', 2, 'x'], ['sample', 3, '-']], out: [[], [], [], ['x']] },
        { name: 'a gap blocks a message until it is filled', init: [], ops: [['sample', 0, '-'], ['sample', 1, 'a'], ['sample', 3, '-'], ['sample', 4, 'c'], ['sample', 5, '-'], ['sample', 2, 'b']], out: [[], [], [], [], ['c'], []] },
        { name: 'letters before the first hyphen', init: [], ops: [['sample', 0, 'x'], ['sample', 1, '-'], ['sample', 2, 'y'], ['sample', 3, '-']], out: [[], [], [], ['y']] },
        { name: 'a long message in reverse', init: [], ops: [['sample', 16, '-'], ['sample', 15, 'e'], ['sample', 14, 'd'], ['sample', 13, 'c'], ['sample', 12, 'b'], ['sample', 11, 'a'], ['sample', 10, '-']], out: [[], [], [], [], [], [], ['abcde']] },
      ],
      fuzz: (r) => {
        const n = r.int(6, 14), chars = Array.from({ length: n }, () => (r.chance(0.35) ? '-' : r.pick(['a', 'b'])));
        let order = r.shuffle(Array.from({ length: n }, (_, i) => i));
        if (r.chance(0.3)) order = order.slice(1);
        return { init: [], ops: order.map((i) => ['sample', i, chars[i]]) };
      },
      perf: {
        label: 'Large test: 100,000 samples',
        gen: (r) => {
          const chars = [];
          while (chars.length < 100000) {
            chars.push('-');
            for (let k = r.int(1, 20); k > 0; k--) chars.push(r.pick(['a', 'b', 'c', 'd', 'e']));
          }
          chars.length = 100000;
          const order = r.shuffle(Array.from({ length: 100000 }, (_, i) => i)).filter(() => r.chance(0.995));
          return { init: [], ops: order.map((i) => ['sample', i, chars[i]]) };
        },
      },
      hints: [
        'Store the samples in a map from sequence number to character. A new sample can only complete a message it belongs to, so only look near it.',
        'For a letter at s: walk left from s − 1 over letters until you hit a hyphen or a missing number, and the same to the right. If both walks end at a hyphen, that is a complete message.',
        'For a hyphen at s: the message to its right (walk right from s + 1) and the one to its left can both complete. Take the right one if it exists and is non-empty. Then apply the stale rule: remember where the last reported message started, and drop anything that starts earlier.',
      ],
      sol: {
        idea: 'Keep received characters in a hash map and, on each sample, only check the one or two messages that sample could complete.',
        steps: [
          'Save the sample. To find a message boundary, walk from a position over letters in one direction until reaching a hyphen (a boundary) or a missing number (not complete yet).',
          'Letter: walk left from s − 1 and right from s + 1. Two hyphens found means the message between them is complete.',
          'Hyphen: walk right from s + 1 and left from s − 1. A walk that finds a hyphen straight away is an empty message, which doesn\'t count. If both sides complete, keep the right one.',
          'Stale rule: keep the start of the last reported message. Report the new one only if it starts later, then update.',
        ],
        cx: 'O(message length) per sample, so O(n × 20) here, with O(n) memory.',
        trap: 'Counting "--" as an empty message, and forgetting that a hyphen can complete messages on both sides.',
      },
      ref: {
        js: code`
          class Decoder {
            constructor() {
              this.got = new Map(); // sequence number -> character
              this.last = -1;       // where the last reported message starts
            }

            // Walk from s in direction step over letters; the hyphen it reaches, or null if a sample is missing.
            edge(s, step) {
              while (this.got.has(s) && this.got.get(s) !== '-') s += step;
              return this.got.get(s) === '-' ? s : null;
            }

            sample(seq, ch) {
              this.got.set(seq, ch);
              const l = this.edge(seq - 1, -1), r = this.edge(seq + 1, 1);
              let found = null; // [left hyphen, right hyphen]
              if (ch !== '-') {
                if (l !== null && r !== null) found = [l, r];
              } else if (r !== null && r > seq + 1) found = [seq, r]; // the later message wins
              else if (l !== null && l < seq - 1) found = [l, seq];
              if (!found || found[0] < this.last) return [];
              this.last = found[0];
              let msg = '';
              for (let s = found[0] + 1; s < found[1]; s++) msg += this.got.get(s);
              return [msg];
            }
          }`,
        py: code`
          class Decoder:
              def __init__(self):
                  self.got = {}     # sequence number -> character
                  self.last = -1    # where the last reported message starts

              def _edge(self, s, step):
                  # Walk from s over letters; the hyphen it reaches, or None if a sample is missing.
                  while self.got.get(s, '-') != '-':
                      s += step
                  return s if self.got.get(s) == '-' else None

              def sample(self, seq, ch):
                  self.got[seq] = ch
                  l, r = self._edge(seq - 1, -1), self._edge(seq + 1, 1)
                  found = None   # (left hyphen, right hyphen)
                  if ch != '-':
                      if l is not None and r is not None:
                          found = (l, r)
                  elif r is not None and r > seq + 1:
                      found = (seq, r)   # the later message wins
                  elif l is not None and l < seq - 1:
                      found = (l, seq)
                  if found is None or found[0] < self.last:
                      return []
                  self.last = found[0]
                  return [''.join(self.got[s] for s in range(found[0] + 1, found[1]))]`,
      },
    },
    {
      id: 'opt-pumpkins', title: 'Heaviest in the tent', group: 'oa', diff: 'Hard', tags: ['heap', 'lazy deletion', 'hash map'],
      src: ['LeetCode Discuss: Optiver SWE intern OA, "Lion Exhibition" (2023)', LC('4129711/optiver-oa-lion-exhibition-by-anonymous_-uhso')],
      kind: 'cls', name: 'PumpkinShow',
      sig: { init: ['ours', 'schedule'], methods: [['entered', ['time', 'weight'], ''], ['left', ['time', 'weight'], ''], ['leaders', ['time'], 'your leading pumpkins\' names, A to Z']] },
      body: `<p>At a giant-pumpkin show, growers carry pumpkins in and out of the judging tent on a timetable, and the judges favour the heaviest pumpkin in the tent. You know the timetable for your own pumpkins, but not your rivals'. You see every pumpkin go in or out, and its weight, but not whose it is.</p>
        <ul>
          <li><code>PumpkinShow(ours, schedule)</code>: <code>ours</code> is a list of <code>[name, weight]</code>; <code>schedule</code> is a list of <code>[name, enterTime, exitTime]</code>, one for each of your pumpkins.</li>
          <li><code>entered(time, weight)</code> and <code>left(time, weight)</code>: a pumpkin of that weight went in, or came out. If one of yours of that weight is due in (or out) at that time, it is yours; otherwise it is a rival's.</li>
          <li><code>leaders(time)</code>: return the names of your pumpkins in the tent that weigh at least as much as the heaviest rival in the tent, sorted alphabetically. If no rival is in the tent, all of yours in the tent count.</li>
        </ul>`,
      rules: ['Calls come in time order. Your pumpkins keep exactly to the timetable.', 'Up to 200,000 calls and 1,000 of your pumpkins. In the large test thousands of rivals are in the tent, so finding the heaviest by checking them all is too slow.'],
      note: 'Our version of a reported problem (it had lions): the story and numbers are ours, the task is the same. A 2026 report describes an OA needing a heap with lazy deletion, which this practises.',
      tests: [
        { ex: true, init: [[['Ada', 30], ['Bo', 22]], [['Ada', 5, 20], ['Bo', 8, 30]]],
          ops: [['entered', 1, 25], ['leaders', 2], ['entered', 5, 30], ['leaders', 5], ['entered', 8, 22], ['leaders', 9], ['left', 10, 25], ['leaders', 10], ['entered', 12, 30], ['leaders', 12], ['left', 20, 30], ['leaders', 21], ['left', 25, 30], ['leaders', 26]],
          out: [null, [], null, ['Ada'], null, ['Ada'], null, ['Ada', 'Bo'], null, ['Ada'], null, [], null, ['Bo']],
          why: 'The 30 at time 12 is a rival (Ada was due at 5). Ada ties it, which counts. The 30 leaving at 20 is Ada, because Ada is due out then.' },
        { name: 'two rivals of the same weight', init: [[['Z', 10]], [['Z', 0, 100]]], ops: [['entered', 0, 10], ['entered', 1, 12], ['entered', 2, 12], ['left', 3, 12], ['leaders', 3], ['left', 4, 12], ['leaders', 4]], out: [null, null, null, null, [], null, ['Z']] },
        { name: 'alphabetical, and ties count', init: [[['b', 5], ['a', 5], ['c', 4]], [['b', 1, 9], ['a', 1, 9], ['c', 2, 9]]], ops: [['entered', 1, 5], ['entered', 1, 5], ['entered', 2, 4], ['entered', 3, 4], ['leaders', 3], ['entered', 4, 6], ['leaders', 4]], out: [null, null, null, null, ['a', 'b', 'c'], null, []] },
        { name: 'none of yours in the tent', init: [[['p', 50]], [['p', 10, 20]]], ops: [['leaders', 0], ['entered', 5, 1], ['leaders', 6], ['entered', 10, 50], ['left', 20, 50], ['leaders', 20]], out: [[], null, [], null, null, []] },
      ],
      fuzz: (r) => {
        const names = ['a', 'b', 'c'].slice(0, r.int(2, 3));
        const ws = r.shuffle([1, 2, 3, 4, 5, 6]); // distinct, so it's clear which of yours went in
        const ours = names.map((n, i) => [n, ws[i]]), schedule = names.map((n) => { const a = r.int(0, 5); return [n, a, a + r.int(1, 5)]; });
        const ev = [];
        ours.forEach(([n, w], i) => { ev.push([schedule[i][1], 'entered', w]); ev.push([schedule[i][2], 'left', w]); });
        const due = new Set(ev.map(([t, , w]) => t + ':' + w));
        for (let k = 0; k < 6; k++) {
          const w = r.int(1, 6), a = r.int(0, 9), b = a + r.int(1, 6);
          if (due.has(a + ':' + w) || due.has(b + ':' + w)) continue;
          ev.push([a, 'entered', w], [b, 'left', w]);
        }
        ev.sort((x, y) => x[0] - y[0] || (x[1] === y[1] ? 0 : x[1] === 'left' ? -1 : 1));
        const ops = [];
        for (const [t, m, w] of ev) {
          ops.push([m, t, w]);
          if (r.chance(0.4)) ops.push(['leaders', t]);
        }
        ops.push(['leaders', 20]);
        return { init: [ours, schedule], ops };
      },
      perf: {
        label: 'Large test: 200 of yours, 50,000 rivals',
        gen: (r) => {
          // Your weights are even and rivals' odd, so no rival is ever mistaken for one of yours.
          const ours = Array.from({ length: 200 }, (_, i) => ['p' + i, 2 * r.int(400, 600)]), schedule = ours.map(([n]) => { const a = r.int(0, 90000); return [n, a, a + r.int(1000, 10000)]; });
          const ev = [];
          ours.forEach(([, w], i) => ev.push([schedule[i][1], 'entered', w], [schedule[i][2], 'left', w]));
          for (let k = 0; k < 50000; k++) { const w = 2 * r.int(0, 600) + 1, a = r.int(0, 100000); ev.push([a, 'entered', w], [a + r.int(1, 20000), 'left', w]); }
          ev.sort((x, y) => x[0] - y[0] || (x[1] === y[1] ? 0 : x[1] === 'left' ? -1 : 1));
          const ops = [];
          for (const [t, m, w] of ev) {
            ops.push([m, t, w]);
            if (r.chance(0.2)) ops.push(['leaders', t]);
          }
          return { init: [ours, schedule], ops };
        },
      },
      hints: [
        'Two problems: telling your pumpkins from rivals\', and finding the heaviest rival in the tent quickly while rivals come and go.',
        'Index your timetable by (time, weight) for entries and for exits. When a pumpkin goes in or out, look it up: a match is yours.',
        'For the heaviest rival, use a max-heap of weights with lazy deletion: when a rival leaves, just lower a count for its weight. Before reading the top, pop weights whose count is zero.',
      ],
      sol: {
        idea: 'Match your own pumpkins with a timetable lookup, and track rivals with a max-heap plus a count per weight (lazy deletion).',
        steps: [
          'Build two maps from (time, weight) to a list of your pumpkins\' names: one for entries, one for exits.',
          'entered: if a name is waiting under (time, weight) for entries, take it and add it to your set in the tent. Otherwise it is a rival: increase count[weight] and push the weight onto the heap.',
          'left: the same with the exits map; a rival leaving only decreases count[weight]. Its heap entry stays until it reaches the top.',
          'leaders: pop the heap while the top weight\'s count is zero. Then return your pumpkins in the tent at least that heavy (all of them if the heap is empty), sorted.',
        ],
        cx: 'O(log R) amortised per rival event for R rival events, plus O(k log k) per query to sort your k pumpkins in the tent.',
        trap: 'Removing the leaving rival from the middle of a heap (O(n), or impossible with a library heap), and using "heavier than" instead of "at least as heavy".',
      },
      ref: {
        js: code`
          class PumpkinShow {
            constructor(ours, schedule) {
              this.weight = new Map(ours);
              this.dueIn = new Map();  // "time:weight" -> your pumpkins due in then
              this.dueOut = new Map();
              const due = (m, key, name) => (m.get(key) || m.set(key, []).get(key)).push(name);
              for (const [name, enter, exit] of schedule) {
                due(this.dueIn, enter + ':' + this.weight.get(name), name);
                due(this.dueOut, exit + ':' + this.weight.get(name), name);
              }
              this.mine = new Set();   // yours in the tent
              this.count = new Map();  // rival weight -> how many are in the tent
              this.heap = [];          // rival weights, heaviest first; stale ones are skipped
            }

            push(w) {
              const h = this.heap;
              h.push(w);
              for (let i = h.length - 1; i > 0;) {
                const p = (i - 1) >> 1;
                if (h[p] >= h[i]) break;
                [h[p], h[i]] = [h[i], h[p]];
                i = p;
              }
            }

            pop() {
              const h = this.heap, last = h.pop();
              if (!h.length) return;
              h[0] = last;
              for (let i = 0; ;) {
                const l = 2 * i + 1, r = l + 1;
                let m = i;
                if (l < h.length && h[l] > h[m]) m = l;
                if (r < h.length && h[r] > h[m]) m = r;
                if (m === i) break;
                [h[i], h[m]] = [h[m], h[i]];
                i = m;
              }
            }

            entered(time, weight) {
              const names = this.dueIn.get(time + ':' + weight);
              if (names && names.length) {
                this.mine.add(names.pop());
                return;
              }
              this.count.set(weight, (this.count.get(weight) || 0) + 1);
              this.push(weight);
            }

            left(time, weight) {
              const names = this.dueOut.get(time + ':' + weight);
              if (names && names.length) {
                this.mine.delete(names.pop());
                return;
              }
              this.count.set(weight, this.count.get(weight) - 1); // its heap entry goes later
            }

            leaders(time) {
              while (this.heap.length && !this.count.get(this.heap[0])) this.pop();
              const top = this.heap.length ? this.heap[0] : -Infinity;
              return [...this.mine].filter((n) => this.weight.get(n) >= top).sort();
            }
          }`,
        py: code`
          import heapq

          class PumpkinShow:
              def __init__(self, ours, schedule):
                  self.weight = dict(ours)
                  self.due_in, self.due_out = {}, {}   # (time, weight) -> your pumpkins due then
                  for name, enter, leave in schedule:
                      w = self.weight[name]
                      self.due_in.setdefault((enter, w), []).append(name)
                      self.due_out.setdefault((leave, w), []).append(name)
                  self.mine = set()   # yours in the tent
                  self.count = {}     # rival weight -> how many are in the tent
                  self.heap = []      # rival weights, negated; stale ones are skipped

              def entered(self, time, weight):
                  names = self.due_in.get((time, weight))
                  if names:
                      self.mine.add(names.pop())
                      return
                  self.count[weight] = self.count.get(weight, 0) + 1
                  heapq.heappush(self.heap, -weight)

              def left(self, time, weight):
                  names = self.due_out.get((time, weight))
                  if names:
                      self.mine.discard(names.pop())
                      return
                  self.count[weight] -= 1   # its heap entry goes later

              def leaders(self, time):
                  while self.heap and not self.count.get(-self.heap[0]):
                      heapq.heappop(self.heap)
                  top = -self.heap[0] if self.heap else float('-inf')
                  return sorted(n for n in self.mine if self.weight[n] >= top)`,
      },
    },
    {
      id: 'opt-dividends', title: 'Prices after dividends', group: 'oa', diff: 'Hard', tags: ['prefix sums', 'Fenwick tree', 'binary search'],
      src: ['LeetCode Discuss: Optiver SWE intern OA, London (2022)', LC('2730450/optiver-online-assessment-2022-by-anonym-fn58')],
      kind: 'cls', name: 'Dividends',
      sig: { init: ['price', 'amounts', 'days'], methods: [['update', ['i', 'amount', 'day'], ''], ['priceOn', ['day'], 'the forward price on that day']] },
      body: `<p>A stock trades at S today (day 0). A dividend of amount A paid in D days lowers the forward price by A from day D onwards. Several dividends add up: with S = 1000 and dividends of 100 on day 10 and 50 on day 100, the forward price is 1000 on days 0 to 9, 900 on days 10 to 99, and 850 from day 100.</p>
        <ul>
          <li><code>Dividends(price, amounts, days)</code>: dividend i is <code>amounts[i]</code> on day <code>days[i]</code>.</li>
          <li><code>update(i, amount, day)</code>: dividend i changes to <code>amount</code> on <code>day</code>.</li>
          <li><code>priceOn(day)</code>: return S minus the sum of the dividends paid on or before <code>day</code>.</li>
        </ul>`,
      rules: ['Up to 30,000 dividends and 30,000 calls, but at most 300 of them are updates.', 'Dividend days are 1 to 1,000,000; query days 0 to 1,000,000. Amounts are 0 to 10⁹.', 'Adding up every dividend on each query is too slow for the large test.'],
      note: 'Our numbers; the task is as reported. The report\'s limit of few updates is a hint: it allows an approach that is slow to update but fast to query.',
      tests: [
        { ex: true, init: [1000, [100, 50], [10, 100]], ops: [['priceOn', 0], ['priceOn', 9], ['priceOn', 10], ['priceOn', 99], ['priceOn', 100], ['priceOn', 5000], ['update', 1, 30, 5], ['priceOn', 5], ['priceOn', 10], ['priceOn', 100]],
          out: [1000, 1000, 900, 900, 850, 850, null, 970, 870, 870],
          why: 'After the update, dividend 1 is 30 on day 5, so it now comes before dividend 0.' },
        { name: 'dividends on the same day', init: [500, [10, 20, 30], [7, 7, 8]], ops: [['priceOn', 6], ['priceOn', 7], ['priceOn', 8], ['update', 0, 10, 8], ['priceOn', 7], ['priceOn', 8], ['update', 2, 0, 1], ['priceOn', 1], ['priceOn', 8]], out: [500, 470, 440, null, 480, 440, null, 500, 470] },
        { name: 'no dividends', init: [42, [], []], ops: [['priceOn', 0], ['priceOn', 1000000]], out: [42, 42] },
        { name: 'the largest values', init: [1000000000, [1000000000], [1000000]], ops: [['priceOn', 999999], ['priceOn', 1000000]], out: [1000000000, 0] },
      ],
      fuzz: (r) => {
        const n = r.int(0, 5), amounts = Array.from({ length: n }, () => r.int(0, 20)), days = Array.from({ length: n }, () => r.int(1, 20)), ops = [];
        for (let k = 0; k < 20; k++) {
          if (n && r.chance(0.25)) ops.push(['update', r.int(0, n - 1), r.int(0, 20), r.int(1, 20)]);
          else ops.push(['priceOn', r.int(0, 21)]);
        }
        return { init: [r.int(100, 200), amounts, days], ops };
      },
      perf: {
        label: 'Large test: 30,000 dividends and 30,000 calls',
        gen: (r) => {
          const n = 30000, amounts = Array.from({ length: n }, () => r.int(0, 1000000)), days = Array.from({ length: n }, () => r.int(1, 1000000)), ops = [];
          for (let k = 0; k < 30000; k++) {
            if (k % 100 === 50) ops.push(['update', r.int(0, n - 1), r.int(0, 1000000), r.int(1, 1000000)]);
            else ops.push(['priceOn', r.int(0, 1000000)]);
          }
          return { init: [2000000000000, amounts, days], ops };
        },
      },
      hints: [
        'priceOn(day) is S minus a prefix sum: the total of all dividends with day ≤ the query day. The question is how to answer prefix sums quickly when values change.',
        'With few updates you can afford to rebuild: keep the dividends sorted by day with running totals, answer each query by binary search, and rebuild after each update (O(n log n) each, at most 300 times).',
        'To make both fast, use a Fenwick (binary indexed) tree over days: an update is "subtract the old amount at the old day, add the new amount at the new day", and a query is a prefix sum. Both are O(log D).',
      ],
      sol: {
        idea: 'It\'s a prefix-sum query with point updates: a Fenwick tree over days does both in O(log D).',
        steps: [
          'Price on day F = S − (sum of amounts with day ≤ F).',
          'A Fenwick tree over days 0 to 1,000,000 stores the amount paid on each day. Add each dividend at its day.',
          'update(i, a, d): add −amounts[i] at days[i], then +a at d, and remember the new values.',
          'priceOn(F): S minus the tree\'s prefix sum up to F.',
          'Alternative that also passes: keep (day, amount) sorted with running totals and binary-search each query; rebuild after an update. That is why the limit on updates matters.',
        ],
        cx: 'O(log D) per call with the Fenwick tree (D = 1,000,000), O(D) memory. The rebuild approach is O(log n) per query and O(n log n) per update.',
        trap: 'Days are "on or before": a dividend on the query day counts. Updating a dividend must remove its old amount from its old day first.',
      },
      ref: {
        js: code`
          class Dividends {
            constructor(price, amounts, days) {
              this.price = price;
              this.amounts = amounts.slice();
              this.days = days.slice();
              this.tree = new Float64Array(1000002); // Fenwick tree: amount paid on each day
              amounts.forEach((a, i) => this.add(days[i], a));
            }

            add(day, a) {
              for (let i = day + 1; i < this.tree.length; i += i & -i) this.tree[i] += a;
            }

            update(i, amount, day) {
              this.add(this.days[i], -this.amounts[i]);
              this.amounts[i] = amount;
              this.days[i] = day;
              this.add(day, amount);
            }

            priceOn(day) {
              let paid = 0;
              for (let i = Math.min(day, 1000000) + 1; i > 0; i -= i & -i) paid += this.tree[i];
              return this.price - paid;
            }
          }`,
        py: code`
          class Dividends:
              SIZE = 10**6 + 2

              def __init__(self, price, amounts, days):
                  self.price = price
                  self.amounts = list(amounts)
                  self.days = list(days)
                  self.tree = [0] * self.SIZE   # Fenwick tree: amount paid on each day
                  for a, d in zip(amounts, days):
                      self._add(d, a)

              def _add(self, day, a):
                  i = day + 1
                  while i < self.SIZE:
                      self.tree[i] += a
                      i += i & -i

              def update(self, i, amount, day):
                  self._add(self.days[i], -self.amounts[i])
                  self.amounts[i], self.days[i] = amount, day
                  self._add(day, amount)

              def price_on(self, day):
                  paid, i = 0, min(day, 10**6) + 1
                  while i > 0:
                      paid += self.tree[i]
                      i -= i & -i
                  return self.price - paid`,
      },
    },
    {
      id: 'opt-order-book', title: 'Limit order book', group: 'oa', diff: 'Hard', tags: ['heap', 'queues', 'hash map', 'design'],
      src: ['Glassdoor: Optiver software engineer internship (2024–2026): trading-system design and "debug a mini trading system" rounds', GDS],
      kind: 'cls', name: 'OrderBook',
      sig: { init: [], methods: [['limit', ['orderId', 'side', 'price', 'qty'], 'the fills [[restingId, price, qty], ...]'], ['cancel', ['orderId'], 'true if the order was resting and is now cancelled'], ['top', [], '[best bid, best ask], null for an empty side']] },
      body: `<p>Build the matching engine for one instrument. Orders match best price first, and oldest first at the same price (price-time priority). A trade happens at the price of the order already resting in the book.</p>
        <ul>
          <li><code>limit(orderId, side, price, qty)</code>: a new order. A <code>"BUY"</code> trades with resting sells priced at or below its price, cheapest first; a <code>"SELL"</code> with resting buys at or above, highest first. Return the fills <code>[restingId, price, qty]</code> in the order they happen. Whatever quantity is left rests in the book.</li>
          <li><code>cancel(orderId)</code>: remove a resting order. Return true if it was resting (with quantity left), false otherwise.</li>
          <li><code>top()</code>: return <code>[best bid, best ask]</code>, with null for an empty side.</li>
        </ul>`,
      rules: ['Up to 200,000 calls. Order ids are unique; prices are integers from 1 to 1,000,000; quantities are at least 1.', 'The large test keeps hundreds of price levels and cancels often, so scanning the book on each order is too slow.'],
      note: 'An order book is the classic trading-firm design problem. Optiver reports describe trading-system design and debugging rounds; this is our own statement of the standard task.',
      tests: [
        { ex: true, init: [], ops: [['limit', 1, 'SELL', 101, 5], ['limit', 2, 'SELL', 100, 3], ['limit', 3, 'BUY', 99, 4], ['top'], ['limit', 4, 'BUY', 101, 6], ['top'], ['cancel', 1], ['top'], ['cancel', 1], ['limit', 5, 'SELL', 98, 10], ['top']],
          out: [[], [], [], [99, 100], [[2, 100, 3], [1, 101, 3]], [99, 101], true, [99, null], false, [[3, 99, 4]], [null, 98]],
          why: 'Order 4 buys 3 at 100 (the best price) and then 3 of the 5 at 101. Order 5 sells 4 to the 99 bid and rests the other 6 at 98.' },
        { name: 'oldest first at the same price', init: [], ops: [['limit', 1, 'BUY', 50, 2], ['limit', 2, 'BUY', 50, 2], ['limit', 3, 'BUY', 51, 1], ['limit', 4, 'SELL', 50, 4], ['top'], ['cancel', 2], ['top']], out: [[], [], [], [[3, 51, 1], [1, 50, 2], [2, 50, 1]], [50, null], true, [null, null]] },
        { name: 'no trade without a cross', init: [], ops: [['limit', 1, 'BUY', 10, 1], ['limit', 2, 'SELL', 11, 1], ['top']], out: [[], [], [10, 11]] },
        { name: 'cancelling filled or unknown orders', init: [], ops: [['limit', 1, 'SELL', 5, 1], ['limit', 2, 'BUY', 5, 1], ['cancel', 1], ['cancel', 2], ['cancel', 99], ['top']], out: [[], [[1, 5, 1]], false, false, false, [null, null]] },
        { name: 'a cancelled order never trades', init: [], ops: [['limit', 1, 'SELL', 5, 1], ['limit', 2, 'SELL', 6, 1], ['cancel', 1], ['limit', 3, 'BUY', 6, 2], ['top']], out: [[], [], true, [[2, 6, 1]], [6, null]] },
        { name: 'a level empties and refills', init: [], ops: [['limit', 1, 'BUY', 7, 1], ['cancel', 1], ['limit', 2, 'BUY', 7, 2], ['limit', 3, 'SELL', 7, 1], ['top']], out: [[], true, [], [[2, 7, 1]], [7, null]] },
      ],
      fuzz: (r) => {
        const ops = [];
        let id = 1;
        for (let k = 0; k < 30; k++) {
          const x = r.next();
          if (x < 0.7) ops.push(['limit', id++, r.pick(['BUY', 'SELL']), r.int(1, 5), r.int(1, 3)]);
          else if (x < 0.85) ops.push(['cancel', r.int(1, id)]);
          else ops.push(['top']);
        }
        return { init: [], ops };
      },
      perf: {
        label: 'Large test: 200,000 calls',
        gen: (r) => {
          const ops = [];
          let id = 1;
          for (let k = 0; k < 200000; k++) {
            const x = r.next();
            if (x < 0.7) { const side = r.pick(['BUY', 'SELL']); ops.push(['limit', id++, side, side === 'BUY' ? r.int(600, 1010) : r.int(990, 1400), r.int(1, 50)]); }
            else if (x < 0.95) ops.push(['cancel', r.int(Math.max(1, id - 5000), id)]);
            else ops.push(['top']);
          }
          return { init: [], ops };
        },
      },
      hints: [
        'Per side you need "best price now" quickly and, within a price, the oldest order first. Which two structures give those?',
        'Keep a heap of prices per side (bids as negatives so the best is on top) and, per price level, a queue of order ids in arrival order. Keep a map from id to the order\'s remaining quantity.',
        'Cancel lazily: delete the order from the map and leave its id in the queue. When you look at the best level, skip ids that are gone, and drop a level (and its heap entry) once it is empty.',
      ],
      sol: {
        idea: 'Heaps of price levels for each side, a FIFO queue of ids per level, and a map of live orders; cancels are lazy.',
        steps: [
          'Best price on a side: look at the heap top, clean the front of that level\'s queue of dead ids, and if the level is empty pop it and look again.',
          'limit: while quantity is left and the best opposite price crosses (ask ≤ buy price, or bid ≥ sell price), fill against the oldest order at that level for min(both quantities), at the resting price. Remove it from the map when it is used up.',
          'Rest any remainder: add it to the map and to its level\'s queue, creating the level (and pushing its price on the heap) if needed.',
          'cancel: remove the id from the map; return whether it was there. top: the best price of each side.',
        ],
        cx: 'O(log L) per price level created or removed and O(1) per fill, amortised; L is the number of price levels.',
        trap: 'Trading at the incoming order\'s price instead of the resting one, matching a cancelled order, and treating equal prices as not crossing.',
      },
      ref: {
        js: code`
          class OrderBook {
            constructor() {
              this.orders = new Map();                         // resting id -> quantity left
              this.levels = { BUY: new Map(), SELL: new Map() }; // price -> { ids, head }: arrival order
              this.heaps = { BUY: [], SELL: [] };               // keys, best first: -price for bids, price for asks
            }

            push(h, k) {
              h.push(k);
              for (let i = h.length - 1; i > 0;) {
                const p = (i - 1) >> 1;
                if (h[p] <= h[i]) break;
                [h[p], h[i]] = [h[i], h[p]];
                i = p;
              }
            }

            pop(h) {
              const last = h.pop();
              if (!h.length) return;
              h[0] = last;
              for (let i = 0; ;) {
                const l = 2 * i + 1, r = l + 1;
                let m = i;
                if (l < h.length && h[l] < h[m]) m = l;
                if (r < h.length && h[r] < h[m]) m = r;
                if (m === i) break;
                [h[i], h[m]] = [h[m], h[i]];
                i = m;
              }
            }

            best(side) {
              const h = this.heaps[side], levels = this.levels[side];
              while (h.length) {
                const price = side === 'BUY' ? -h[0] : h[0], lv = levels.get(price);
                while (lv.head < lv.ids.length && !this.orders.has(lv.ids[lv.head])) lv.head++; // cancelled or filled
                if (lv.head < lv.ids.length) return price;
                levels.delete(price);
                this.pop(h);
              }
              return null;
            }

            limit(orderId, side, price, qty) {
              const other = side === 'BUY' ? 'SELL' : 'BUY', fills = [];
              while (qty > 0) {
                const p = this.best(other);
                if (p === null || (side === 'BUY' ? p > price : p < price)) break;
                const lv = this.levels[other].get(p), rid = lv.ids[lv.head], left = this.orders.get(rid);
                const q = Math.min(qty, left);
                fills.push([rid, p, q]);
                qty -= q;
                if (left === q) this.orders.delete(rid);
                else this.orders.set(rid, left - q);
              }
              if (qty > 0) {
                this.orders.set(orderId, qty);
                const levels = this.levels[side];
                if (!levels.has(price)) {
                  levels.set(price, { ids: [], head: 0 });
                  this.push(this.heaps[side], side === 'BUY' ? -price : price);
                }
                levels.get(price).ids.push(orderId);
              }
              return fills;
            }

            cancel(orderId) {
              return this.orders.delete(orderId); // its id leaves the level's queue lazily
            }

            top() {
              return [this.best('BUY'), this.best('SELL')];
            }
          }`,
        py: code`
          import heapq
          from collections import deque

          class OrderBook:
              def __init__(self):
                  self.orders = {}                         # resting id -> quantity left
                  self.levels = {'BUY': {}, 'SELL': {}}    # price -> deque of ids, oldest first
                  self.heaps = {'BUY': [], 'SELL': []}     # bids negated, so both heaps pop the best

              def _best(self, side):
                  heap, levels = self.heaps[side], self.levels[side]
                  while heap:
                      price = -heap[0] if side == 'BUY' else heap[0]
                      q = levels[price]
                      while q and q[0] not in self.orders:   # cancelled or filled
                          q.popleft()
                      if q:
                          return price
                      del levels[price]
                      heapq.heappop(heap)
                  return None

              def limit(self, order_id, side, price, qty):
                  other = 'SELL' if side == 'BUY' else 'BUY'
                  fills = []
                  while qty > 0:
                      p = self._best(other)
                      if p is None or (p > price if side == 'BUY' else p < price):
                          break
                      rid = self.levels[other][p][0]
                      q = min(qty, self.orders[rid])
                      fills.append([rid, p, q])
                      qty -= q
                      self.orders[rid] -= q
                      if self.orders[rid] == 0:
                          del self.orders[rid]
                  if qty > 0:
                      self.orders[order_id] = qty
                      levels = self.levels[side]
                      if price not in levels:
                          levels[price] = deque()
                          heapq.heappush(self.heaps[side], -price if side == 'BUY' else price)
                      levels[price].append(order_id)
                  return fills

              def cancel(self, order_id):
                  return self.orders.pop(order_id, None) is not None   # its id leaves the queue lazily

              def top(self):
                  return [self._best('BUY'), self._best('SELL')]`,
      },
    },
    {
      id: 'opt-route', title: 'Shortest route, or the right error', group: 'oa', diff: 'Hard', tags: ['parsing', 'Dijkstra', 'graphs'],
      src: ['LeetCode Discuss: Optiver OA, "Traveling the Graphs" (2022)', LC('1768013/optiver-online-assessment-traveling-the-wz23i')],
      kind: 'fn', name: 'route',
      sig: { args: ['edges', 'trip'], ret: 'the route, or "E1", "E2" or "E3"' },
      body: `<p>You get a road network and a trip as two lines of text. Return the shortest route, or the first error that applies.</p>
        <ul>
          <li><code>edges</code>: one or more roads separated by single spaces. Each is <code>[X,Y,D]</code>: X and Y are single capital letters and D is a whole number written in digits. Roads go both ways.</li>
          <li><code>trip</code>: <code>X-&gt;Y,M</code>: from X to Y, travelling at most M in total.</li>
          <li>No other characters are allowed anywhere: no extra spaces, no signs, no lowercase.</li>
        </ul>
        <p>Return the route as the nodes joined by <code>"-&gt;"</code>, such as <code>"A-&gt;B-&gt;C"</code>. A trip from a node to itself is just that node, such as <code>"A"</code>. Otherwise return the first error in this list that applies:</p>
        <ul>
          <li><code>"E1"</code>: a line is malformed.</li>
          <li><code>"E2"</code>: the input is logically wrong: a road from a node to itself, a distance of 0, the same pair of nodes given twice (in either order), a start or destination that isn't in the network, a network that isn't all connected, or more than one shortest route.</li>
          <li><code>"E3"</code>: the shortest route is longer than M.</li>
        </ul>`,
      rules: ['At most 26 nodes (A to Z). Distances and M are at most 1,000,000 and may have leading zeros ("007" is 7).', 'The large test has every pair of the 26 nodes joined, so trying every possible route is far too slow.'],
      note: 'Our version: the same three error codes and parsing as reported, with our examples. A 2025 report of an Optiver OA question "combining Dijkstra\'s algorithm and dynamic programming" fits this shape too: the count of shortest routes is a small dynamic programme on top of Dijkstra.',
      tests: [
        { ex: true, args: ['[P,Q,4] [Q,R,1] [P,R,6]', 'P->R,5'], out: 'P->Q->R', why: 'P to Q to R is 5, shorter than the direct road of 6, and within the limit of 5.' },
        { ex: true, args: ['[P,Q,4] [Q,R,1] [P,R,5]', 'P->R,9'], out: 'E2', why: 'Two routes tie for shortest at 5.' },
        { ex: true, args: ['[P,Q,4] [Q,R,1]', 'P->R,4'], out: 'E3' },
        { name: 'double space', args: ['[A,B,3]  [B,C,1]', 'A->C,9'], out: 'E1' },
        { name: 'trip without a comma', args: ['[A,B,3] [B,C,1]', 'A->C 9'], out: 'E1' },
        { name: 'lowercase node', args: ['[a,B,3]', 'a->B,3'], out: 'E1' },
        { name: 'negative distance', args: ['[A,B,-3]', 'A->B,3'], out: 'E1' },
        { name: 'trailing space', args: ['[A,B,3] ', 'A->B,3'], out: 'E1' },
        { name: 'no roads', args: ['', 'A->B,1'], out: 'E1' },
        { name: 'roads not separated', args: ['[A,B,3][B,C,1]', 'A->C,9'], out: 'E1' },
        { name: 'two-letter node', args: ['[AB,C,3]', 'AB->C,3'], out: 'E1' },
        { name: 'E1 comes before E2', args: ['[A,A,3] x', 'A->A,0'], out: 'E1' },
        { name: 'road to itself', args: ['[A,A,3] [A,B,1]', 'A->B,9'], out: 'E2' },
        { name: 'the same road twice, reversed', args: ['[A,B,3] [B,A,4]', 'A->B,9'], out: 'E2' },
        { name: 'zero distance', args: ['[A,B,0]', 'A->B,9'], out: 'E2' },
        { name: 'unknown destination', args: ['[A,B,3]', 'A->C,9'], out: 'E2' },
        { name: 'not connected, even though the trip is', args: ['[A,B,1] [C,D,1]', 'A->B,9'], out: 'E2' },
        { name: 'E2 comes before E3', args: ['[A,B,1] [C,D,1]', 'A->B,0'], out: 'E2' },
        { name: 'from a node to itself', args: ['[A,B,2]', 'B->B,0'], out: 'B' },
        { name: 'leading zeros', args: ['[A,B,07] [B,C,003]', 'A->C,10'], out: 'A->B->C' },
        { name: 'a longer unique route', args: ['[A,B,2] [B,C,2] [A,C,5] [C,D,1] [B,D,4]', 'A->D,9'], out: 'A->B->C->D' },
        { name: 'a tie further back', args: ['[A,B,1] [A,C,1] [B,D,1] [C,D,1] [D,E,1]', 'A->E,5'], out: 'E2' },
        { name: 'ties among longer routes don\'t matter', args: ['[A,B,1] [B,C,1] [A,D,2] [D,C,2] [A,E,2] [E,C,2]', 'A->C,5'], out: 'A->B->C' },
      ],
      fuzz: (r) => {
        const nodes = LETTERS.slice(0, r.int(2, 6)).split(''), roads = [];
        for (let i = 1; i < nodes.length; i++) roads.push([nodes[r.int(0, i - 1)], nodes[i], r.int(1, 4)]);
        for (let k = r.int(0, 4); k > 0; k--) {
          const a = r.pick(nodes), b = r.pick(nodes);
          if (a !== b && !roads.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) roads.push([a, b, r.int(1, 4)]);
        }
        const x = r.next();
        if (x < 0.08) roads.push(roads[0].slice());
        else if (x < 0.12) roads[0][2] = 0;
        else if (x < 0.2) roads.push(['Y', 'Z', 1]);
        r.shuffle(roads);
        let edges = roads.map(([a, b, d]) => `[${a},${b},${d}]`).join(' ');
        if (r.chance(0.08)) edges = edges.replace(',', r.pick([' ', ';', ',,']));
        const from = r.chance(0.05) ? 'Q' : r.pick(nodes), to = r.pick(nodes);
        return { args: [edges, `${from}->${to},${r.int(0, 12)}`] };
      },
      perf: {
        label: 'Large test: 26 nodes, every pair joined',
        gen: (r) => {
          const roads = [];
          for (let i = 0; i < 26; i++) for (let j = i + 1; j < 26; j++) roads.push(`[${LETTERS[i]},${LETTERS[j]},${r.int(1000, 1000000)}]`);
          return { args: [r.shuffle(roads).join(' '), 'A->Z,1000000'] };
        },
      },
      hints: [
        'Do it in stages, in the order of the errors: parse everything strictly first (E1), then the logical checks (E2), then the distance check (E3).',
        'Parse each road with a strict pattern such as \\[([A-Z]),([A-Z]),([0-9]+)\\] that must match the whole piece, after splitting on single spaces (in Python, split(" "), not split()).',
        'Run Dijkstra from the start. Alongside each node\'s distance keep how many shortest routes reach it: a strictly shorter route resets the count to the predecessor\'s, an equal one adds it. Check connectivity by whether Dijkstra reached every node.',
      ],
      sol: {
        idea: 'Strict parsing, then Dijkstra that also counts shortest routes (capped at 2) and remembers each node\'s predecessor.',
        steps: [
          'E1: split edges on single spaces; every piece must fully match [X,Y,D] and the trip must fully match X->Y,M. An empty string fails because its only piece is empty.',
          'E2 while building the graph: X = Y, D = 0, or a pair already seen (store it with the letters sorted). Then: start or destination not in the graph.',
          'Dijkstra from the start with ways[start] = 1. Relaxing u → v: a shorter distance sets dist, ways[v] = ways[u] and prev[v] = u; an equal distance adds ways[u] to ways[v].',
          'E2 if Dijkstra didn\'t reach every node (not connected) or ways[destination] > 1. E3 if dist[destination] > M. Otherwise follow prev back from the destination and join with "->".',
        ],
        cx: 'O(E log V) with a heap (or O(V²) by scanning, which is fine for 26 nodes).',
        trap: 'Using Python\'s split(), which treats double spaces as one; checking connectivity only between start and destination; and comparing distances as strings ("10" < "9").',
      },
      ref: {
        js: code`
          function route(edges, trip) {
            const EDGE = /^\[([A-Z]),([A-Z]),([0-9]+)\]$/, TRIP = /^([A-Z])->([A-Z]),([0-9]+)$/;
            const t = TRIP.exec(trip), parsed = edges.split(' ').map((p) => EDGE.exec(p));
            if (!t || parsed.some((m) => !m)) return 'E1';
            const adj = new Map(), seen = new Set();
            const link = (a, b, d) => (adj.get(a) || adj.set(a, []).get(a)).push([b, d]);
            for (const [, a, b, ds] of parsed) {
              const d = Number(ds), key = a < b ? a + b : b + a;
              if (a === b || d === 0 || seen.has(key)) return 'E2';
              seen.add(key);
              link(a, b, d);
              link(b, a, d);
            }
            const from = t[1], to = t[2], limit = Number(t[3]);
            if (!adj.has(from) || !adj.has(to)) return 'E2';
            // Dijkstra, counting shortest routes to each node (capped at 2) and the node before it.
            const dist = new Map([[from, 0]]), ways = new Map([[from, 1]]), prev = new Map(), done = new Set();
            for (;;) {
              let u = null;
              for (const [v, dv] of dist) if (!done.has(v) && (u === null || dv < dist.get(u))) u = v;
              if (u === null) break;
              done.add(u);
              for (const [v, d] of adj.get(u)) {
                const nd = dist.get(u) + d;
                if (!dist.has(v) || nd < dist.get(v)) {
                  dist.set(v, nd);
                  ways.set(v, ways.get(u));
                  prev.set(v, u);
                } else if (nd === dist.get(v)) ways.set(v, Math.min(2, ways.get(v) + ways.get(u)));
              }
            }
            if (done.size !== adj.size || ways.get(to) > 1) return 'E2';
            if (dist.get(to) > limit) return 'E3';
            const path = [to];
            while (path[path.length - 1] !== from) path.push(prev.get(path[path.length - 1]));
            return path.reverse().join('->');
          }`,
        py: code`
          import heapq
          import re

          EDGE = re.compile(r'\[([A-Z]),([A-Z]),([0-9]+)\]')
          TRIP = re.compile(r'([A-Z])->([A-Z]),([0-9]+)')

          def route(edges, trip):
              t = TRIP.fullmatch(trip)
              parsed = [EDGE.fullmatch(p) for p in edges.split(' ')]
              if not t or not all(parsed):
                  return 'E1'
              adj, seen = {}, set()
              for m in parsed:
                  a, b, d = m.group(1), m.group(2), int(m.group(3))
                  key = tuple(sorted((a, b)))
                  if a == b or d == 0 or key in seen:
                      return 'E2'
                  seen.add(key)
                  adj.setdefault(a, []).append((b, d))
                  adj.setdefault(b, []).append((a, d))
              start, end, limit = t.group(1), t.group(2), int(t.group(3))
              if start not in adj or end not in adj:
                  return 'E2'
              # Dijkstra, counting shortest routes to each node (capped at 2) and the node before it.
              dist, ways, prev, done = {start: 0}, {start: 1}, {}, set()
              heap = [(0, start)]
              while heap:
                  d, u = heapq.heappop(heap)
                  if u in done:
                      continue
                  done.add(u)
                  for v, w in adj[u]:
                      nd = d + w
                      if v not in dist or nd < dist[v]:
                          dist[v], ways[v], prev[v] = nd, ways[u], u
                          heapq.heappush(heap, (nd, v))
                      elif nd == dist[v]:
                          ways[v] = min(2, ways[v] + ways[u])
              if len(done) != len(adj) or ways[end] > 1:
                  return 'E2'
              if dist[end] > limit:
                  return 'E3'
              path = [end]
              while path[-1] != start:
                  path.append(prev[path[-1]])
              return '->'.join(reversed(path))`,
      },
    },
    {
      id: 'opt-tree-errors', title: 'Tree from pairs, or the right error', group: 'oa', diff: 'Medium', tags: ['parsing', 'trees', 'graphs'],
      src: ['Glassdoor: Optiver software engineer intern (2022), a "tree of errors" question', GDI],
      kind: 'fn', name: 'tree',
      sig: { args: ['pairs'], ret: 'the tree as an S-expression, or an error code' },
      body: `<p>You get parent–child pairs as text, such as <code>"(A,B) (A,C) (B,D)"</code>. Build the binary tree and return it as an S-expression: a node is <code>"("</code> + its name + its children's expressions + <code>")"</code>, with children in alphabetical order. That example gives <code>"(A(B(D))(C))"</code>.</p>
        <p>If the input is wrong, return the first error in this list that applies:</p>
        <ul>
          <li><code>"E1"</code>: malformed. Pairs must be <code>(X,Y)</code> with single capital letters, separated by single spaces, and nothing else.</li>
          <li><code>"E2"</code>: the same pair appears twice.</li>
          <li><code>"E3"</code>: a node has more than two children.</li>
          <li><code>"E4"</code>: a node has more than one parent.</li>
          <li><code>"E5"</code>: there is a cycle.</li>
          <li><code>"E6"</code>: the pairs form more than one tree.</li>
        </ul>`,
      rules: ['At most 26 nodes and 100 pairs.'],
      note: 'Our version: the report gave the idea (build a tree from a string of pairs and report errors such as more than two children, more than one root and duplicate pairs); the exact codes and order are ours.',
      tests: [
        { ex: true, args: ['(A,B) (A,C) (B,D)'], out: '(A(B(D))(C))' },
        { ex: true, args: ['(B,A) (B,C) (B,D)'], out: 'E3', why: 'B has three children.' },
        { ex: true, args: ['(A,B) (C,B)'], out: 'E4', why: 'B has two parents.' },
        { name: 'duplicate pair', args: ['(A,B) (A,B)'], out: 'E2' },
        { name: 'double space', args: ['(A,B)  (B,C)'], out: 'E1' },
        { name: 'cycle', args: ['(A,B) (B,C) (C,A)'], out: 'E5' },
        { name: 'two trees', args: ['(A,B) (C,D)'], out: 'E6' },
        { name: 'a node as its own child', args: ['(A,A)'], out: 'E5' },
        { name: 'one pair', args: ['(A,B)'], out: '(A(B))' },
        { name: 'children sorted', args: ['(C,B) (C,A) (A,D) (A,E)'], out: '(C(A(D)(E))(B))' },
        { name: 'E1 first', args: ['(A,B) (A,B) x'], out: 'E1' },
        { name: 'E3 before E4', args: ['(A,B) (A,C) (A,D) (E,B)'], out: 'E3' },
        { name: 'E4 before E5', args: ['(A,B) (B,A) (C,A)'], out: 'E4' },
        { name: 'E5 before E6', args: ['(A,B) (B,A) (C,D)'], out: 'E5' },
        { name: 'empty input', args: [''], out: 'E1' },
        { name: 'commas between pairs', args: ['(A,B),(B,C)'], out: 'E1' },
        { name: 'deep chain', args: ['(D,E) (C,D) (B,C) (A,B)'], out: '(A(B(C(D(E)))))' },
      ],
      fuzz: (r) => {
        const nodes = LETTERS.slice(0, r.int(2, 6)).split(''), pairs = [], kids = {};
        for (let i = 1; i < nodes.length; i++) {
          const open = nodes.slice(0, i).filter((n) => (kids[n] || 0) < 2), p = r.pick(open);
          kids[p] = (kids[p] || 0) + 1;
          pairs.push([p, nodes[i]]);
        }
        const x = r.next(), any = () => r.pick(nodes);
        if (x < 0.1) pairs.push(r.pick(pairs).slice());
        else if (x < 0.2) pairs.push([nodes[0], 'Z'], [nodes[0], 'Y']);
        else if (x < 0.3) pairs.push([any(), r.pick(nodes.slice(1))]);
        else if (x < 0.4) pairs.push([nodes[nodes.length - 1], nodes[0]]);
        else if (x < 0.5) pairs.push(['X', 'W']);
        r.shuffle(pairs);
        let s = pairs.map(([p, c]) => `(${p},${c})`).join(' ');
        if (r.chance(0.08)) s = s.replace(' ', r.pick(['  ', ',', '']));
        return { args: [s] };
      },
      hints: [
        'Check the errors in order. Parse everything strictly first: split on single spaces and match each piece against \\(([A-Z]),([A-Z])\\).',
        'Count children per parent (E3) and parents per child (E4). After those checks every node has at most one parent, so the structure is a set of trees and cycles.',
        'With at most one parent each, walking up the parent pointers from any node either reaches a root or loops forever (a cycle: E5). Then count the nodes with no parent: more than one is E6. Print recursively, sorting each node\'s children.',
      ],
      sol: {
        idea: 'Parse strictly, then check the error conditions in the given order using child lists and parent pointers, then print the tree recursively.',
        steps: [
          'E1: every piece after splitting on single spaces must fully match (X,Y).',
          'E2: put the pairs in a set; fewer distinct pairs than pairs means a duplicate.',
          'E3: any parent with more than two children. E4: any child with more than one parent.',
          'E5: from each node follow parent pointers; more steps than there are nodes means a loop. A pair (A,A) is a loop of one.',
          'E6: more than one node without a parent. Otherwise print from the root: "(" + name + children\'s expressions in alphabetical order + ")".',
        ],
        cx: 'O(n²) for the walks up from each node, which is tiny for 26 nodes; O(n) with a visited set.',
        trap: 'Checking the errors in a different order (each test expects the first in the list), and printing children in input order instead of alphabetically.',
      },
      ref: {
        js: code`
          function tree(pairs) {
            const PAIR = /^\(([A-Z]),([A-Z])\)$/;
            const ms = pairs.split(' ').map((p) => PAIR.exec(p));
            if (ms.some((m) => !m)) return 'E1';
            const seen = new Set();
            for (const [, p, c] of ms) {
              if (seen.has(p + c)) return 'E2';
              seen.add(p + c);
            }
            const kids = new Map(), parents = new Map(), nodes = new Set();
            for (const [, p, c] of ms) {
              nodes.add(p).add(c);
              (kids.get(p) || kids.set(p, []).get(p)).push(c);
              (parents.get(c) || parents.set(c, []).get(c)).push(p);
            }
            if ([...kids.values()].some((k) => k.length > 2)) return 'E3';
            if ([...parents.values()].some((p) => p.length > 1)) return 'E4';
            for (const n of nodes) {
              // Walk up from each node; a walk longer than the number of nodes is a cycle.
              let x = n;
              for (let steps = 0; parents.has(x); steps++) {
                if (steps > nodes.size) return 'E5';
                x = parents.get(x)[0];
              }
            }
            const roots = [...nodes].filter((n) => !parents.has(n));
            if (roots.length > 1) return 'E6';
            const show = (n) => '(' + n + (kids.get(n) || []).slice().sort().map(show).join('') + ')';
            return show(roots[0]);
          }`,
        py: code`
          import re

          PAIR = re.compile(r'\(([A-Z]),([A-Z])\)')

          def tree(pairs):
              ms = [PAIR.fullmatch(p) for p in pairs.split(' ')]
              if not all(ms):
                  return 'E1'
              edges = [(m.group(1), m.group(2)) for m in ms]
              if len(set(edges)) < len(edges):
                  return 'E2'
              kids, parents, nodes = {}, {}, set()
              for p, c in edges:
                  nodes |= {p, c}
                  kids.setdefault(p, []).append(c)
                  parents.setdefault(c, []).append(p)
              if any(len(k) > 2 for k in kids.values()):
                  return 'E3'
              if any(len(p) > 1 for p in parents.values()):
                  return 'E4'
              for n in nodes:
                  # Walk up from each node; a walk longer than the number of nodes is a cycle.
                  x, steps = n, 0
                  while x in parents:
                      x, steps = parents[x][0], steps + 1
                      if steps > len(nodes):
                          return 'E5'
              roots = [n for n in nodes if n not in parents]
              if len(roots) > 1:
                  return 'E6'

              def show(n):
                  return '(' + n + ''.join(show(c) for c in sorted(kids.get(n, []))) + ')'
              return show(roots[0])`,
      },
    },

    // ------------------------------------------------------------------ technical interviews
    {
      id: 'opt-ring-deque', title: 'A double-ended queue on a fixed array', group: 'tech', diff: 'Medium', tags: ['arrays', 'ring buffer', 'design'],
      src: ['Glassdoor: Optiver software engineer intern (2024–2025): "implement a queue using an array", "design a double-ended queue"', GDI],
      kind: 'cls', name: 'RingDeque',
      sig: { init: ['capacity'], methods: [['pushBack', ['x'], 'true, or false if full'], ['pushFront', ['x'], 'true, or false if full'], ['popFront', [], 'the removed value, or null if empty'], ['popBack', [], 'the removed value, or null if empty'], ['front', [], 'the front value, or null'], ['back', [], 'the back value, or null'], ['size', [], 'the number of values']] },
      body: `<p>Implement a double-ended queue with a fixed capacity on top of an array, with every operation in O(1). Allocate the array once; don't use a built-in deque or linked list, and don't shift elements along the array. (Several candidates were asked to talk through a queue, then build it on an array.)</p>
        <ul>
          <li><code>RingDeque(capacity)</code>: an empty deque that can hold <code>capacity</code> values.</li>
          <li><code>pushBack(x)</code>, <code>pushFront(x)</code>: add x at that end; return true, or false if the deque is full.</li>
          <li><code>popFront()</code>, <code>popBack()</code>: remove and return the value at that end, or null if empty.</li>
          <li><code>front()</code>, <code>back()</code>: return the value at that end without removing it, or null if empty.</li>
          <li><code>size()</code>: the number of values.</li>
        </ul>`,
      rules: ['0 ≤ capacity ≤ 100,000; up to 200,000 calls.', 'The large test pushes 100,000 values at the front, so inserting at the start of a list (O(n) each time) is too slow.'],
      note: 'Our own exercise built from the reported interview questions.',
      tests: [
        { ex: true, init: [3], ops: [['pushBack', 1], ['pushBack', 2], ['pushFront', 0], ['pushBack', 9], ['front'], ['back'], ['popBack'], ['popFront'], ['size'], ['popFront'], ['popFront'], ['back']],
          out: [true, true, true, false, 0, 2, 2, 0, 1, 1, null, null], why: 'After three pushes the deque holds 0, 1, 2 and is full, so pushing 9 fails.' },
        { name: 'wrapping around the end', init: [2], ops: [['pushBack', 1], ['popFront'], ['pushBack', 2], ['pushBack', 3], ['popFront'], ['pushBack', 4], ['back'], ['front'], ['size'], ['pushFront', 9]], out: [true, 1, true, true, 2, true, 4, 3, 2, false] },
        { name: 'capacity 0', init: [0], ops: [['pushBack', 5], ['pushFront', 5], ['popFront'], ['popBack'], ['front'], ['size']], out: [false, false, null, null, null, 0] },
        { name: 'capacity 1', init: [1], ops: [['pushFront', 7], ['back'], ['popBack'], ['popBack'], ['pushBack', 8], ['front'], ['pushFront', 1]], out: [true, 7, 7, null, true, 8, false] },
        { name: 'front pushes wrap backwards', init: [3], ops: [['pushFront', 1], ['pushFront', 2], ['pushFront', 3], ['popBack'], ['pushFront', 4], ['popBack'], ['popBack'], ['popBack'], ['size']], out: [true, true, true, 1, true, 2, 3, 4, 0] },
      ],
      fuzz: (r) => {
        const ops = [];
        for (let k = 0; k < 30; k++) {
          const m = r.pick(['pushBack', 'pushFront', 'pushBack', 'pushFront', 'popFront', 'popBack', 'front', 'back', 'size']);
          ops.push(m.startsWith('push') ? [m, r.int(0, 9)] : [m]);
        }
        return { init: [r.int(0, 4)], ops };
      },
      perf: {
        label: 'Large test: 100,000 front pushes, then 100,000 back pops',
        gen: () => {
          const ops = [];
          for (let i = 0; i < 100000; i++) ops.push(['pushFront', i]);
          for (let i = 0; i < 100000; i++) ops.push(['popBack']);
          return { init: [100000], ops };
        },
      },
      hints: [
        'Keep three things: the array, the index of the front value (head) and the number of values (size).',
        'Indices wrap around the end with mod: the back value is at (head + size − 1) mod capacity, and the next free back slot at (head + size) mod capacity.',
        'pushFront moves head one step left: head = (head − 1 + capacity) mod capacity. Check for full (size = capacity) before pushing and empty (size = 0) before popping or peeking.',
      ],
      sol: {
        idea: 'A ring buffer: positions wrap around the end of the array with mod, so no value ever moves.',
        steps: [
          'pushBack: if full, false. Else write x at (head + size) mod capacity and add 1 to size.',
          'pushFront: if full, false. Else head = (head − 1 + capacity) mod capacity, write x there, add 1 to size.',
          'popFront: if empty, null. Else read at head, head = (head + 1) mod capacity, take 1 from size.',
          'popBack: if empty, null. Else take 1 from size and read at (head + size) mod capacity.',
          'Follow-up (if asked to grow): when full, copy the values in order into an array twice as big, starting at index 0. Each push is still O(1) amortised.',
        ],
        cx: 'O(1) per operation, O(capacity) memory.',
        trap: 'In C++, Java and JavaScript, (head − 1) % capacity is negative when head is 0: add capacity first. And telling full from empty: store the size, rather than comparing a head index with a tail index (they are equal in both cases).',
      },
      ref: {
        js: code`
          class RingDeque {
            constructor(capacity) {
              this.buf = new Array(capacity);
              this.cap = capacity;
              this.head = 0; // index of the front value
              this.n = 0;    // number of values
            }

            pushBack(x) {
              if (this.n === this.cap) return false;
              this.buf[(this.head + this.n) % this.cap] = x;
              this.n++;
              return true;
            }

            pushFront(x) {
              if (this.n === this.cap) return false;
              this.head = (this.head - 1 + this.cap) % this.cap;
              this.buf[this.head] = x;
              this.n++;
              return true;
            }

            popFront() {
              if (!this.n) return null;
              const x = this.buf[this.head];
              this.head = (this.head + 1) % this.cap;
              this.n--;
              return x;
            }

            popBack() {
              if (!this.n) return null;
              this.n--;
              return this.buf[(this.head + this.n) % this.cap];
            }

            front() {
              return this.n ? this.buf[this.head] : null;
            }

            back() {
              return this.n ? this.buf[(this.head + this.n - 1) % this.cap] : null;
            }

            size() {
              return this.n;
            }
          }`,
        py: code`
          class RingDeque:
              def __init__(self, capacity):
                  self.buf = [None] * capacity
                  self.cap = capacity
                  self.head = 0   # index of the front value
                  self.n = 0      # number of values

              def push_back(self, x):
                  if self.n == self.cap:
                      return False
                  self.buf[(self.head + self.n) % self.cap] = x
                  self.n += 1
                  return True

              def push_front(self, x):
                  if self.n == self.cap:
                      return False
                  self.head = (self.head - 1) % self.cap   # Python's % is never negative here
                  self.buf[self.head] = x
                  self.n += 1
                  return True

              def pop_front(self):
                  if self.n == 0:
                      return None
                  x = self.buf[self.head]
                  self.head = (self.head + 1) % self.cap
                  self.n -= 1
                  return x

              def pop_back(self):
                  if self.n == 0:
                      return None
                  self.n -= 1
                  return self.buf[(self.head + self.n) % self.cap]

              def front(self):
                  return self.buf[self.head] if self.n else None

              def back(self):
                  return self.buf[(self.head + self.n - 1) % self.cap] if self.n else None

              def size(self):
                  return self.n`,
      },
    },
    {
      id: 'opt-lru', title: 'LRU cache', group: 'tech', diff: 'Medium', tags: ['hash map', 'linked list', 'design'],
      src: ['LeetCode Discuss: Optiver Amsterdam graduate SWE OA (2020), a hard question "building on the concepts of LRU caches"', LC('588375/optiver-amsterdam-oa-graduate-software-e-thhe')],
      kind: 'cls', name: 'LRUCache',
      sig: { init: ['capacity'], methods: [['get', ['key'], 'the value, or -1 if absent'], ['put', ['key', 'value'], '']] },
      body: `<p>Build a cache that holds at most <code>capacity</code> keys. When it is full and a new key arrives, it evicts the <b>least recently used</b> key. Both operations must be O(1).</p>
        <ul>
          <li><code>LRUCache(capacity)</code>: an empty cache, capacity ≥ 1.</li>
          <li><code>get(key)</code>: return the value, or −1 if the key isn't there. A hit makes the key the most recently used.</li>
          <li><code>put(key, value)</code>: set the value, making the key the most recently used. If the key is new and the cache is full, first evict the least recently used key.</li>
        </ul>`,
      rules: ['Up to 200,000 calls; capacity up to 50,000.', 'Searching a list for the least recently used key on each call is too slow for the large test.'],
      note: 'The report names only the topic; this is the standard task it builds on.',
      tests: [
        { ex: true, init: [2], ops: [['put', 1, 10], ['put', 2, 20], ['get', 1], ['put', 3, 30], ['get', 2], ['put', 1, 11], ['put', 4, 40], ['get', 3], ['get', 1], ['get', 4]],
          out: [null, null, 10, null, -1, null, null, -1, 11, 40], why: 'Reading key 1 makes key 2 the least recently used, so key 3 evicts it. Updating key 1 refreshes it, so key 4 evicts key 3.' },
        { name: 'capacity 1', init: [1], ops: [['put', 5, 1], ['put', 6, 2], ['get', 5], ['get', 6], ['put', 6, 3], ['get', 6]], out: [null, null, -1, 2, null, 3] },
        { name: 'empty cache', init: [3], ops: [['get', 1]], out: [-1] },
        { name: 'updating does not evict', init: [2], ops: [['put', 1, 1], ['put', 2, 2], ['put', 1, 5], ['put', 3, 3], ['get', 1], ['get', 2], ['get', 3]], out: [null, null, null, null, 5, -1, 3] },
        { name: 'a miss changes nothing', init: [2], ops: [['put', 1, 1], ['put', 2, 2], ['get', 9], ['put', 3, 3], ['get', 1], ['get', 2]], out: [null, null, -1, null, -1, 2] },
      ],
      fuzz: (r) => {
        const ops = [];
        for (let k = 0; k < 25; k++) ops.push(r.chance(0.55) ? ['put', r.int(1, 5), r.int(0, 99)] : ['get', r.int(1, 5)]);
        return { init: [r.int(1, 3)], ops };
      },
      perf: {
        label: 'Large test: 200,000 calls, capacity 50,000',
        gen: (r) => {
          const ops = [];
          for (let k = 0; k < 200000; k++) ops.push(r.chance(0.5) ? ['put', r.int(1, 100000), k] : ['get', r.int(1, 100000)]);
          return { init: [50000], ops };
        },
      },
      hints: [
        'You need O(1) lookup by key, O(1) "make this key the most recent", and O(1) "remove the least recent".',
        'A hash map from key to a node in a doubly linked list kept in order of use does all three. Python\'s OrderedDict (move_to_end, popitem(last=False)) and JavaScript\'s Map (delete then set re-inserts at the end) keep this order for you.',
        'Both get (on a hit) and put make the key the most recent. Evict only when inserting a new key into a full cache.',
      ],
      sol: {
        idea: 'A hash map plus a recency-ordered list: an ordered dictionary gives both.',
        steps: [
          'get: on a miss return −1. On a hit move the key to the most-recent end and return its value.',
          'put on an existing key: update it and move it to the most-recent end.',
          'put on a new key: if the cache is full, remove the key at the least-recent end; then insert at the most-recent end.',
          'From scratch (if asked): a doubly linked list with sentinel head and tail nodes, plus a map from key to node. Moving a node is unlink and re-link, all O(1).',
        ],
        cx: 'O(1) per call, O(capacity) memory.',
        trap: 'Forgetting that a get refreshes the key, or evicting when updating a key that is already in the cache.',
      },
      ref: {
        js: code`
          class LRUCache {
            constructor(capacity) {
              this.cap = capacity;
              this.map = new Map(); // keeps insertion order: least recently used first
            }

            get(key) {
              if (!this.map.has(key)) return -1;
              const v = this.map.get(key);
              this.map.delete(key); // re-insert to make it the most recent
              this.map.set(key, v);
              return v;
            }

            put(key, value) {
              if (this.map.has(key)) this.map.delete(key);
              else if (this.map.size === this.cap) this.map.delete(this.map.keys().next().value);
              this.map.set(key, value);
            }
          }`,
        py: code`
          from collections import OrderedDict

          class LRUCache:
              def __init__(self, capacity):
                  self.cap = capacity
                  self.d = OrderedDict()   # least recently used first

              def get(self, key):
                  if key not in self.d:
                      return -1
                  self.d.move_to_end(key)
                  return self.d[key]

              def put(self, key, value):
                  if key in self.d:
                      self.d.move_to_end(key)
                  elif len(self.d) == self.cap:
                      self.d.popitem(last=False)
                  self.d[key] = value`,
      },
    },
    {
      id: 'opt-peak-live', title: 'Peak number of live orders', group: 'tech', diff: 'Medium', tags: ['intervals', 'sorting', 'sweep line'],
      src: ['Glassdoor: Optiver software engineer intern (2022), "an interval question … solved using priority queues"', GDI],
      kind: 'fn', name: 'peakLive',
      sig: { args: ['orders'], ret: '[peak, time]' },
      body: `<p>Each order is live from its start time up to, but not including, its end time: the interval [start, end). Given the orders, return <code>[peak, time]</code>: the largest number of orders live at the same moment, and the earliest time that number is reached. With no orders, return <code>[0, null]</code>.</p>`,
      rules: ['Up to 200,000 orders; 0 ≤ start < end ≤ 10⁹.', 'Checking every order against every other is too slow for the large test.'],
      note: 'Our version: the report names an interval problem solved with priority queues. This is the standard one (the "meeting rooms" pattern).',
      tests: [
        { ex: true, args: [[[1, 5], [2, 6], [4, 8], [6, 9]]], out: [3, 4], why: 'From time 4 to 5 the first three are all live. At 6 one ends as another starts, so only two are live.' },
        { ex: true, args: [[[1, 3], [3, 5]]], out: [1, 1], why: 'The first ends at 3 just as the second starts: they never overlap.' },
        { name: 'no orders', args: [[]], out: [0, null] },
        { name: 'one order', args: [[[5, 10]]], out: [1, 5] },
        { name: 'the earliest time the peak is reached', args: [[[1, 10], [2, 3], [2, 4], [3, 4]]], out: [3, 2] },
        { name: 'large times', args: [[[0, 1000000000], [999999999, 1000000000]]], out: [2, 999999999] },
        { name: 'identical orders', args: [[[7, 8], [7, 8], [7, 8]]], out: [3, 7] },
        { name: 'unsorted input', args: [[[8, 9], [1, 2], [5, 9], [1, 6]]], out: [2, 1] },
      ],
      fuzz: (r) => ({ args: [Array.from({ length: r.int(0, 8) }, () => { const a = r.int(0, 9); return [a, a + r.int(1, 4)]; })] }),
      perf: {
        label: 'Large test: 200,000 orders',
        gen: (r) => ({ args: [Array.from({ length: 200000 }, () => { const a = r.int(0, 1000000000 - 100000); return [a, a + r.int(1, 100000)]; })] }),
      },
      hints: [
        'The count of live orders only changes at a start or an end. So look only at those moments, in time order.',
        'Make an event (time, +1) for each start and (time, −1) for each end, and sort them. When a start and an end share a time, the end must come first, because [start, end) excludes the end.',
        'Sweep through the events keeping a running count. Record a new peak (and its time) only when the count beats the best so far, so you keep the earliest.',
      ],
      sol: {
        idea: 'A sweep line: sort the 2n start and end events and keep a running count.',
        steps: [
          'Events: (start, +1) and (end, −1). Sort by time, and at equal times put −1 before +1.',
          'Go through in order, adding each change. When the count exceeds the best so far, record it and the event time.',
          'Return [best, time]; with no events that is [0, null].',
          'The heap version: sort by start, keep a min-heap of end times of live orders, and pop ends ≤ the current start before pushing. The heap size is the live count.',
        ],
        cx: 'O(n log n) time for the sort, O(n) memory.',
        trap: 'Counting an order that ends at t as still live at t (sort ends before starts), and updating the time on ties, which reports the last time the peak is reached instead of the first.',
      },
      ref: {
        js: code`
          function peakLive(orders) {
            const ev = [];
            for (const [s, e] of orders) ev.push([s, 1], [e, -1]);
            ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // at the same time, ends (-1) first
            let live = 0, best = 0, at = null;
            for (const [t, d] of ev) {
              live += d;
              if (live > best) {
                best = live;
                at = t;
              }
            }
            return [best, at];
          }`,
        py: code`
          def peak_live(orders):
              # At the same time, ends (-1) sort before starts (+1).
              events = sorted([(s, 1) for s, e in orders] + [(e, -1) for s, e in orders])
              live = best = 0
              at = None
              for t, d in events:
                  live += d
                  if live > best:
                      best, at = live, t
              return [best, at]`,
      },
    },

    // ------------------------------------------------------------------ debugging
    {
      id: 'opt-debug-position', title: 'Debug: position and P&L', group: 'debug', diff: 'Medium', tags: ['debugging', 'trading maths'],
      src: ['Glassdoor: Optiver software engineer internship (2025–2026): "debug a mini trading system"; "finding a mistake … not a syntactic error, a logical bug"', GDS],
      kind: 'cls', name: 'Position',
      sig: { init: [], methods: [['fill', ['side', 'price', 'qty'], ''], ['position', [], 'the signed position'], ['average', [], 'the average entry price, or null when flat'], ['realised', [], 'the realised P&L']] },
      body: `<p>A teammate wrote this position tracker for one instrument. It runs, but some numbers are wrong. Find and fix the logical bugs so it meets the spec:</p>
        <ul>
          <li><code>fill(side, price, qty)</code>: you bought (<code>"BUY"</code>) or sold (<code>"SELL"</code>) <code>qty</code> at <code>price</code>.</li>
          <li><code>position()</code>: the signed position: positive when long, negative when short.</li>
          <li><code>average()</code>: the average entry price of the open position, or null when flat.</li>
          <li><code>realised()</code>: the profit or loss locked in so far.</li>
        </ul>
        <p>A fill in the same direction as the position (or from flat) adds to it, and the average entry becomes the quantity-weighted average. A fill in the other direction closes up to the whole position: each unit closed realises (exit − entry) if you were long, or (entry − exit) if you were short. If the fill is bigger than the position, the rest opens a new position at the fill price.</p>`,
      rules: ['Prices and quantities are positive integers. Averages are compared to within 10⁻⁶.'],
      note: 'Our own exercise in the style candidates describe: a short trading program with logical bugs. Read the spec, then test each rule with a tiny example you can work out by hand.',
      starter: {
        js: code`
          class Position {
            constructor() {
              this.qty = 0;    // signed: + long, - short
              this.avg = null;
              this.pnl = 0;
            }

            fill(side, price, qty) {
              const signed = side === 'BUY' ? qty : -qty;
              if (this.qty === 0 || Math.sign(signed) === Math.sign(this.qty)) {
                // Adding to the position
                this.avg = this.qty === 0 ? price : (this.avg + price) / 2;
                this.qty += signed;
                return;
              }
              // Reducing the position
              const closed = Math.min(qty, Math.abs(this.qty));
              this.pnl += (price - this.avg) * closed;
              this.qty += signed;
              if (this.qty === 0) this.avg = null;
            }

            position() {
              return this.qty;
            }

            average() {
              return this.avg;
            }

            realised() {
              return this.pnl;
            }
          }`,
        py: code`
          class Position:
              def __init__(self):
                  self.qty = 0      # signed: + long, - short
                  self.avg = None
                  self.pnl = 0

              def fill(self, side, price, qty):
                  signed = qty if side == 'BUY' else -qty
                  if self.qty == 0 or (signed > 0) == (self.qty > 0):
                      # Adding to the position
                      self.avg = price if self.qty == 0 else (self.avg + price) / 2
                      self.qty += signed
                      return
                  # Reducing the position
                  closed = min(qty, abs(self.qty))
                  self.pnl += (price - self.avg) * closed
                  self.qty += signed
                  if self.qty == 0:
                      self.avg = None

              def position(self):
                  return self.qty

              def average(self):
                  return self.avg

              def realised(self):
                  return self.pnl`,
      },
      tests: [
        { ex: true, init: [], ops: [['fill', 'BUY', 100, 10], ['fill', 'BUY', 110, 30], ['average'], ['fill', 'SELL', 120, 15], ['position'], ['realised']],
          out: [null, null, 107.5, null, 25, 187.5], why: 'The average of 10 at 100 and 30 at 110 is (1000 + 3300) / 40 = 107.5. Selling 15 at 120 realises 15 × (120 − 107.5) = 187.5.' },
        { name: 'closing a short', init: [], ops: [['fill', 'SELL', 50, 4], ['fill', 'BUY', 45, 4], ['position'], ['average'], ['realised']], out: [null, null, 0, null, 20] },
        { name: 'flipping from long to short', init: [], ops: [['fill', 'BUY', 10, 5], ['fill', 'SELL', 12, 8], ['average'], ['position'], ['realised'], ['fill', 'BUY', 11, 3], ['realised'], ['position'], ['average']], out: [null, null, 12, -3, 10, null, 13, 0, null] },
        { name: 'flat from the start', init: [], ops: [['position'], ['average'], ['realised']], out: [0, null, 0] },
        { name: 'adding to a short', init: [], ops: [['fill', 'SELL', 20, 1], ['fill', 'SELL', 23, 2], ['average'], ['position']], out: [null, null, 22, -3] },
        { name: 'a partial close keeps the average', init: [], ops: [['fill', 'BUY', 40, 4], ['fill', 'SELL', 30, 1], ['average'], ['realised'], ['position']], out: [null, null, 40, -10, 3] },
      ],
      fuzz: (r) => {
        const ops = [];
        for (let k = 0; k < 25; k++) ops.push(r.chance(0.6) ? ['fill', r.pick(['BUY', 'SELL']), r.int(1, 20), r.int(1, 5)] : [r.pick(['position', 'average', 'realised'])]);
        return { init: [], ops };
      },
      hints: [
        'Check each rule in the spec against the code, one at a time, with an example small enough to do by hand.',
        'Try buying 10 at 100 and then 30 at 110: what should the average be? Then a short: sell 4 at 50 and buy them back at 45. Which way round is the profit?',
        'Try a flip: long 5 at 10, then sell 8 at 12. What is the new position, and at what price was it opened?',
      ],
      sol: {
        idea: 'Three bugs, one in each rule of the spec.',
        steps: [
          'Average: it took the midpoint of the old average and the new price. It must be weighted by quantity: (avg × |position| + price × qty) / (|position| + qty).',
          'Realised P&L on a short: you sold at the entry and buy back at the exit, so each unit makes (entry − exit). The code always used (exit − entry), which is right only when long.',
          'Flip: after the whole position is closed, the rest of the fill is a new position opened at the fill price. The code kept the old average. Set avg = price when the sign of the position changes.',
        ],
        cx: 'O(1) per call.',
        trap: 'Stopping after the first failing test. Each test exercises a different rule, so read the whole spec and check every branch.',
      },
      ref: {
        js: code`
          class Position {
            constructor() {
              this.qty = 0;    // signed: + long, - short
              this.avg = null;
              this.pnl = 0;
            }

            fill(side, price, qty) {
              const signed = side === 'BUY' ? qty : -qty;
              if (this.qty === 0 || Math.sign(signed) === Math.sign(this.qty)) {
                // Adding to the position: quantity-weighted average
                const size = Math.abs(this.qty);
                this.avg = size === 0 ? price : (this.avg * size + price * qty) / (size + qty);
                this.qty += signed;
                return;
              }
              // Reducing the position: long gains when the price rose, short when it fell
              const closed = Math.min(qty, Math.abs(this.qty));
              this.pnl += (this.qty > 0 ? price - this.avg : this.avg - price) * closed;
              this.qty += signed;
              if (this.qty === 0) this.avg = null;
              else if (Math.sign(this.qty) === Math.sign(signed)) this.avg = price; // flipped: the rest opens here
            }

            position() {
              return this.qty;
            }

            average() {
              return this.avg;
            }

            realised() {
              return this.pnl;
            }
          }`,
        py: code`
          class Position:
              def __init__(self):
                  self.qty = 0      # signed: + long, - short
                  self.avg = None
                  self.pnl = 0

              def fill(self, side, price, qty):
                  signed = qty if side == 'BUY' else -qty
                  if self.qty == 0 or (signed > 0) == (self.qty > 0):
                      # Adding to the position: quantity-weighted average
                      size = abs(self.qty)
                      self.avg = price if size == 0 else (self.avg * size + price * qty) / (size + qty)
                      self.qty += signed
                      return
                  # Reducing the position: long gains when the price rose, short when it fell
                  closed = min(qty, abs(self.qty))
                  self.pnl += (price - self.avg if self.qty > 0 else self.avg - price) * closed
                  self.qty += signed
                  if self.qty == 0:
                      self.avg = None
                  elif (self.qty > 0) == (signed > 0):   # flipped: the rest opens at this price
                      self.avg = price

              def position(self):
                  return self.qty

              def average(self):
                  return self.avg

              def realised(self):
                  return self.pnl`,
      },
    },
    {
      id: 'opt-debug-matcher', title: 'Debug: a slow, wrong matcher', group: 'debug', diff: 'Medium', tags: ['debugging', 'performance', 'heap'],
      src: ['Glassdoor: Optiver software engineer internship (2025): a technical round "looking at a source code and finding a mistake … related with performance"', GDS],
      kind: 'fn', name: 'matchOrders',
      sig: { args: ['orders'], ret: 'the trades [[buyIndex, sellIndex, price, qty], ...]' },
      body: `<p>This function matches a day's orders and returns the trades. It passes the examples, but it is wrong in some cases and far too slow on a full day. Fix it.</p>
        <p>The spec: process the orders in the list's order. Each is <code>[side, price, qty]</code>. A <code>"BUY"</code> trades with resting sells priced at or below its price, cheapest first and oldest first at the same price; a <code>"SELL"</code> trades with resting buys priced at or above, highest first and oldest first. Trades happen at the resting order's price, and whatever is left of the new order rests. Return each trade as <code>[buyIndex, sellIndex, price, qty]</code>, where the indices are positions in the input list.</p>`,
      rules: ['Up to 60,000 orders. The large test builds a deep book, so re-sorting it after every order is too slow.'],
      note: 'Our own exercise in the style candidates describe. Run the examples first: they pass, so you need your own tests to find the bugs (candidates say the real tests are few too).',
      starter: {
        js: code`
          function matchOrders(orders) {
            const bids = [], asks = [], trades = [];
            orders.forEach(([side, price, qty], i) => {
              const book = side === 'BUY' ? asks : bids;
              while (qty > 0 && book.length) {
                const best = book[0];
                const crosses = side === 'BUY' ? price > best.price : price < best.price;
                if (!crosses) break;
                const q = Math.min(qty, best.qty);
                trades.push(side === 'BUY' ? [i, best.i, best.price, q] : [best.i, i, best.price, q]);
                qty -= q;
                best.qty -= qty;
                if (best.qty <= 0) book.shift();
              }
              if (qty > 0) {
                const mine = side === 'BUY' ? bids : asks;
                mine.push({ price, qty, i });
                // Keep the best price at the front, oldest first on ties
                mine.sort((a, b) => (side === 'BUY' ? b.price - a.price : a.price - b.price) || a.i - b.i);
              }
            });
            return trades;
          }`,
        py: code`
          def match_orders(orders):
              bids, asks, trades = [], [], []
              for i, (side, price, qty) in enumerate(orders):
                  book = asks if side == 'BUY' else bids
                  while qty > 0 and book:
                      best = book[0]
                      crosses = price > best['price'] if side == 'BUY' else price < best['price']
                      if not crosses:
                          break
                      q = min(qty, best['qty'])
                      trades.append([i, best['i'], best['price'], q] if side == 'BUY' else [best['i'], i, best['price'], q])
                      qty -= q
                      best['qty'] -= qty
                      if best['qty'] <= 0:
                          book.pop(0)
                  if qty > 0:
                      mine = bids if side == 'BUY' else asks
                      mine.append({'price': price, 'qty': qty, 'i': i})
                      # Keep the best price at the front, oldest first on ties
                      mine.sort(key=lambda o: (-o['price'] if side == 'BUY' else o['price'], o['i']))
              return trades`,
      },
      tests: [
        { ex: true, args: [[['SELL', 10, 5], ['BUY', 11, 5]]], out: [[1, 0, 10, 5]], why: 'The buy at 11 crosses the sell at 10 and trades at the resting price, 10.' },
        { ex: true, args: [[['BUY', 9, 2], ['BUY', 10, 1], ['SELL', 8, 3]]], out: [[1, 2, 10, 1], [0, 2, 9, 2]], why: 'The sell hits the highest bid first.' },
        { name: 'equal prices trade', args: [[['SELL', 10, 5], ['BUY', 10, 3]]], out: [[1, 0, 10, 3]] },
        { name: 'a partly filled order keeps the right quantity', args: [[['SELL', 10, 5], ['BUY', 11, 3], ['BUY', 11, 3]]], out: [[1, 0, 10, 3], [2, 0, 10, 2]] },
        { name: 'oldest first at the same price', args: [[['BUY', 10, 1], ['BUY', 10, 1], ['SELL', 9, 2]]], out: [[0, 2, 10, 1], [1, 2, 10, 1]] },
        { name: 'no orders', args: [[]], out: [] },
        { name: 'sweeping several levels', args: [[['SELL', 12, 1], ['SELL', 11, 2], ['SELL', 13, 4], ['BUY', 12, 5], ['SELL', 12, 1]]], out: [[3, 1, 11, 2], [3, 0, 12, 1], [3, 4, 12, 1]] },
      ],
      fuzz: (r) => ({ args: [Array.from({ length: 10 }, () => [r.pick(['BUY', 'SELL']), r.int(8, 12), r.int(1, 4)])] }),
      perf: {
        label: 'Large test: 60,000 orders on a deep book',
        gen: (r) => {
          const orders = [];
          for (let k = 0; k < 30000; k++) orders.push(r.chance(0.5) ? ['BUY', r.int(900, 949), r.int(1, 10)] : ['SELL', r.int(1051, 1100), r.int(1, 10)]);
          for (let k = 0; k < 30000; k++) orders.push([r.pick(['BUY', 'SELL']), r.int(900, 1100), r.int(1, 10)]);
          return { args: [orders] };
        },
      },
      hints: [
        'The examples pass, so write your own small cases from the spec. Try a buy at exactly the resting sell\'s price. Try a sell of 5, then two buys of 3 each.',
        'Look at the line after qty -= q. Which quantity should the resting order lose: what was just traded, or what the new order has left?',
        'For speed: sorting the whole book after every order costs O(n log n) each time, and removing from the front of an array or list costs O(n). A heap per side keyed by (price, arrival index) gives the best order in O(log n).',
      ],
      sol: {
        idea: 'Two logic bugs and one performance bug.',
        steps: [
          'Crossing used > and <, so a buy at exactly the resting sell\'s price didn\'t trade. The spec says "at or below": use >= and <=.',
          'After a partial fill the resting order lost qty (what the new order still had left, after subtracting) instead of q (what was traded). Subtract q.',
          'Speed: replace the sorted arrays with a heap per side. Key bids by (−price, index) and asks by (price, index), so the top is the best price and the oldest order at that price. Track remaining quantity by index, and pop the top when it reaches zero.',
        ],
        cx: 'O(n log n) overall with heaps, against O(n² log n) for re-sorting the book after every order.',
        trap: 'Fixing only the bug the first failing test shows, or making it faster by dropping the oldest-first rule at equal prices.',
      },
      ref: {
        js: code`
          function matchOrders(orders) {
            // A heap per side of [key, index]: the best price first, then the oldest order.
            // Bids are keyed by -price and asks by price, so both are min-heaps.
            const less = (a, b) => a[0] - b[0] || a[1] - b[1];
            const push = (h, e) => {
              h.push(e);
              for (let i = h.length - 1; i > 0;) {
                const p = (i - 1) >> 1;
                if (less(h[i], h[p]) >= 0) break;
                [h[i], h[p]] = [h[p], h[i]];
                i = p;
              }
            };
            const pop = (h) => {
              const last = h.pop();
              if (!h.length) return;
              h[0] = last;
              for (let i = 0; ;) {
                const l = 2 * i + 1, r = l + 1;
                let m = i;
                if (l < h.length && less(h[l], h[m]) < 0) m = l;
                if (r < h.length && less(h[r], h[m]) < 0) m = r;
                if (m === i) break;
                [h[i], h[m]] = [h[m], h[i]];
                i = m;
              }
            };
            const bids = [], asks = [], left = [], trades = [];
            orders.forEach(([side, price, qty], i) => {
              left.push(qty);
              const book = side === 'BUY' ? asks : bids;
              while (left[i] > 0 && book.length) {
                const [key, j] = book[0], best = side === 'BUY' ? key : -key;
                if (side === 'BUY' ? price < best : price > best) break;
                const q = Math.min(left[i], left[j]);
                trades.push(side === 'BUY' ? [i, j, best, q] : [j, i, best, q]);
                left[i] -= q;
                left[j] -= q;
                if (left[j] === 0) pop(book);
              }
              if (left[i] > 0) push(side === 'BUY' ? bids : asks, [side === 'BUY' ? -price : price, i]);
            });
            return trades;
          }`,
        py: code`
          import heapq

          def match_orders(orders):
              # A heap per side of (key, index): the best price first, then the oldest order.
              # Bids are keyed by -price and asks by price, so both are min-heaps.
              bids, asks, left, trades = [], [], [], []
              for i, (side, price, qty) in enumerate(orders):
                  left.append(qty)
                  book = asks if side == 'BUY' else bids
                  while left[i] > 0 and book:
                      key, j = book[0]
                      best = key if side == 'BUY' else -key
                      if (price < best) if side == 'BUY' else (price > best):
                          break
                      q = min(left[i], left[j])
                      trades.append([i, j, best, q] if side == 'BUY' else [j, i, best, q])
                      left[i] -= q
                      left[j] -= q
                      if left[j] == 0:
                          heapq.heappop(book)
                  if left[i] > 0:
                      heapq.heappush(bids if side == 'BUY' else asks, (-price if side == 'BUY' else price, i))
              return trades`,
      },
    },

    // ------------------------------------------------------------------ warm-ups
    {
      id: 'opt-pair-sum', title: 'Pairs with a target sum', group: 'warm', diff: 'Easy', tags: ['hash map'],
      src: ['Glassdoor: Optiver software engineer intern, "given a sum, find all pairs of two numbers in an array that have it"', GDI],
      kind: 'fn', name: 'pairSum',
      sig: { args: ['nums', 'target'], ret: 'the pairs [[a, b], ...], sorted' },
      body: `<p>Given a list of integers and a target, return every distinct pair of values <code>[a, b]</code> with a ≤ b and a + b = target, where a and b come from different positions in the list. Return the pairs sorted by a. Each distinct pair appears once, however many ways it can be made.</p>`,
      rules: ['Up to 200,000 numbers; values and target between −10⁹ and 10⁹.', 'A double loop over all pairs is too slow for the large test.'],
      note: 'An old report (2012); the task is a classic. Our examples.',
      tests: [
        { ex: true, args: [[1, 5, 7, -1, 5], 6], out: [[-1, 7], [1, 5]], why: '1 + 5 and −1 + 7. The second 5 makes [1, 5] again, so it appears once.' },
        { ex: true, args: [[3, 3, 4], 6], out: [[3, 3]], why: 'Two different 3s make 6.' },
        { name: 'a value cannot pair with itself', args: [[3, 4], 6], out: [] },
        { name: 'empty list', args: [[], 0], out: [] },
        { name: 'repeats', args: [[2, 4, 4, 2, 2], 6], out: [[2, 4]] },
        { name: 'negatives and zero', args: [[-3, -3, 0, 3, 6], 0], out: [[-3, 3]] },
        { name: 'extremes', args: [[1000000000, -1000000000, 0, 0], 0], out: [[-1000000000, 1000000000], [0, 0]] },
        { name: 'unsorted input', args: [[5, 1, 2, 3, 4], 5], out: [[1, 4], [2, 3]] },
      ],
      fuzz: (r) => ({ args: [Array.from({ length: r.int(0, 12) }, () => r.int(-5, 5)), r.int(-6, 6)] }),
      perf: {
        label: 'Large test: 200,000 numbers',
        gen: (r) => ({ args: [Array.from({ length: 200000 }, () => r.int(-1000000, 1000000)), r.int(-1000000, 1000000)] }),
      },
      hints: [
        'For each value a, the only partner that works is target − a. How quickly can you check whether it is in the list?',
        'Count how often each value appears (a hash map from value to count). The pair [a, target − a] exists if both are there, and needs a count of at least 2 when a = target − a.',
        'Record a pair only when a ≤ target − a, so each is found once, then sort the pairs.',
      ],
      sol: {
        idea: 'Count the values in a hash map, then look up each value\'s partner in O(1).',
        steps: [
          'Count each value.',
          'For each distinct value a, let b = target − a. If a < b and b is present, record [a, b]. If a = b, record it only when a appears at least twice.',
          'Sort the pairs by a.',
        ],
        cx: 'O(n + k log k) time for n numbers and k pairs, O(n) memory.',
        trap: 'Pairing a value with itself when it appears once, or reporting [1, 5] twice because 5 appears twice.',
      },
      ref: {
        js: code`
          function pairSum(nums, target) {
            const count = new Map();
            for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
            const pairs = [];
            for (const [a, n] of count) {
              const b = target - a;
              if ((a < b && count.has(b)) || (a === b && n >= 2)) pairs.push([a, b]);
            }
            return pairs.sort((p, q) => p[0] - q[0]);
          }`,
        py: code`
          from collections import Counter

          def pair_sum(nums, target):
              count = Counter(nums)
              pairs = []
              for a, n in count.items():
                  b = target - a
                  if (a < b and b in count) or (a == b and n >= 2):
                      pairs.append([a, b])
              return sorted(pairs)`,
      },
    },
    {
      id: 'opt-days-between', title: 'Days between two dates', group: 'warm', diff: 'Easy', tags: ['dates', 'arithmetic'],
      src: ['Glassdoor: Optiver software engineer intern (2022), a "days between" question with a days-in-month helper given', GDI],
      kind: 'fn', name: 'daysBetween',
      sig: { args: ['a', 'b'], ret: 'the number of days from a to b' },
      body: `<p>Dates are written <code>YYYY-MM-DD</code>. Return the number of days from date a to date b: positive if b is later, negative if earlier. Use the Gregorian calendar: a year is a leap year if it divides by 4, except that years dividing by 100 are leap years only if they also divide by 400.</p>
        <p><b>Don't use a date library</b>: in the reported version you were given only a helper for the number of days in a month.</p>`,
      rules: ['Years 1600 to 2400. Both dates are valid.'],
      note: 'Our version of a reported warm-up.',
      tests: [
        { ex: true, args: ['2024-02-28', '2024-03-01'], out: 2, why: '2024 is a leap year, so 29 February is in between.' },
        { ex: true, args: ['2023-12-25', '2024-01-01'], out: 7 },
        { name: 'not a leap year', args: ['2023-02-28', '2023-03-01'], out: 1 },
        { name: '1900 divides by 100 but not 400', args: ['1900-02-28', '1900-03-01'], out: 1 },
        { name: '2000 divides by 400', args: ['2000-02-28', '2000-03-01'], out: 2 },
        { name: 'a leap year', args: ['2024-01-01', '2025-01-01'], out: 366 },
        { name: 'backwards', args: ['2025-03-01', '2024-03-01'], out: -365 },
        { name: 'the same day', args: ['2024-06-15', '2024-06-15'], out: 0 },
        { name: 'two 400-year cycles', args: ['1600-01-01', '2400-01-01'], out: 292194 },
      ],
      fuzz: (r) => ({ args: [randomDate(r), randomDate(r)] }),
      hints: [
        'Turn each date into one number (days since a fixed starting point), then subtract.',
        'Days before year y: 365 × (y − 1) plus the leap years before it: ⌊(y − 1)/4⌋ − ⌊(y − 1)/100⌋ + ⌊(y − 1)/400⌋.',
        'Then add the days in the earlier months of the year (one more if y is a leap year and the date is after February), and the day of the month.',
      ],
      sol: {
        idea: 'Convert both dates to a day count from a fixed origin and subtract. Count leap years with floor division instead of a loop.',
        steps: [
          'Day number = 365 × (y − 1) + ⌊(y − 1)/4⌋ − ⌊(y − 1)/100⌋ + ⌊(y − 1)/400⌋ + days in months 1 to m − 1 + d.',
          'For the months, add the usual lengths and one extra day if m > 2 and y is a leap year.',
          'Answer = day number of b − day number of a.',
        ],
        cx: 'O(1) per date (twelve months at most).',
        trap: 'Treating 1900 as a leap year, or looping day by day, which is slow across centuries.',
      },
      ref: {
        js: code`
          function daysBetween(a, b) {
            const LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
            const dayNumber = (s) => {
              const [y, m, d] = s.split('-').map(Number), p = y - 1;
              let n = 365 * p + Math.floor(p / 4) - Math.floor(p / 100) + Math.floor(p / 400);
              for (let i = 0; i < m - 1; i++) n += LEN[i];
              if (m > 2 && leap(y)) n++;
              return n + d;
            };
            return dayNumber(b) - dayNumber(a);
          }`,
        py: code`
          LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

          def leap(y):
              return (y % 4 == 0 and y % 100 != 0) or y % 400 == 0

          def day_number(s):
              y, m, d = map(int, s.split('-'))
              p = y - 1
              n = 365 * p + p // 4 - p // 100 + p // 400
              n += sum(LEN[:m - 1]) + (1 if m > 2 and leap(y) else 0)
              return n + d

          def days_between(a, b):
              return day_number(b) - day_number(a)`,
      },
    },
  ];

  // Follow-up questions an interviewer asks once the code works, with what a good answer covers.
  // Shown after the problem is solved.
  const FOLLOWUPS = {
    'opt-order-book': [
      ['Cancelling from the middle of a price level is O(n) in a deque. How do you fix it?', 'Lazy cancel: mark the order dead in the id map and skip dead orders when matching reaches them. Or a doubly linked list per level, with each order\'s node stored in the id map, for an O(1) unlink.'],
      ['Why not a sorted map like Java\'s TreeMap?', 'Python\'s standard library has none. A heap with lazy deletion gives O(log L) new levels and O(1) best price; a sorted list with bisect is O(L) per new level but simple when levels are few; sortedcontainers is third-party.'],
      ['How would you support modifying an order?', 'A size decrease keeps its place in the queue; a price change or size increase loses priority, so treat it as cancel then add (the usual exchange rule; ask).'],
      ['Make it thread-safe.', 'Let one thread own the book and have others send it messages through a queue; shard by instrument to scale. A lock around everything works but serialises it anyway.'],
      ['We need 100 times the throughput.', 'Measure first. In Python: __slots__ on orders, reuse objects instead of allocating. In C++: levels in an array indexed by tick around the best price, for cache locality.'],
      ['How do you know it is correct?', 'Property tests: random operations against a slow brute-force book that re-sorts everything, comparing fills and the top of book; plus the invariant that the book is never crossed after matching.'],
    ],
    'opt-lru': [
      ['Make it thread-safe.', 'One lock around get and put (get also changes the order, so it is a write). If contended, shard into N caches by hash(key) % N, each with its own lock.'],
      ['Entries should expire after a time to live.', 'Store an expiry time per entry; on get, treat an expired entry as a miss and remove it; add a periodic sweep so expired entries don\'t hold memory. Use a monotonic clock.'],
      ['Cap it by total bytes instead of entry count.', 'Track the total size and evict from the least recently used end until the new entry fits; refuse entries larger than the whole cache.'],
      ['Why is OrderedDict O(1) for this?', 'It keeps a doubly linked list of entries beside the hash table, and the table maps each key to its link, so move_to_end and popitem(last=False) never search.'],
    ],
    'opt-ring-deque': [
      ['Why a ring buffer rather than a Python list for a queue?', 'No shifting on removal from the front (a list\'s pop(0) is O(n)), and fixed memory with no resizing pauses.'],
      ['How would one producer thread and one consumer thread share it without locks?', 'Each index has exactly one writer: the producer only moves the tail, the consumer only the head. Each side publishes its index with release ordering and reads the other\'s with acquire.'],
      ['Why do implementations often make the capacity a power of two?', 'The wrap-around becomes a bit-mask, i & (capacity − 1), instead of a modulo, which is cheaper.'],
    ],
    'opt-peak-live': [
      ['Events now arrive one at a time, in time order. What changes?', 'No sorting: keep a running count of live orders, add on create, subtract on end, and track the maximum. O(1) per event.'],
      ['What if events can arrive slightly out of order?', 'Buffer events within a bounded time window (say, the maximum delay), release them in order once they are older than the window, and process those as before.'],
    ],
    'opt-debug-matcher': [
      ['How would you have caught these bugs before production?', 'Property tests against a brute-force matcher on random order sequences, and invariants checked after every operation: the book is never crossed, and level totals equal the sum of their orders.'],
      ['How would you find the performance problem without reading all the code?', 'Profile under a realistic load (cProfile in Python) to find the hot function, then check its complexity: a scan or re-sort on every call is the usual culprit.'],
    ],
  };
  for (const P of PROBLEMS) P.followups = FOLLOWUPS[P.id] || [];

  // The matching problems on LeetCode, shown once you've solved ours, so you can submit there too.
  // [number, title, slug, difficulty, 'same' | 'similar', how it differs, premium?]. Checked
  // against LeetCode's own data (number, title, difficulty, whether it needs Premium) in Nov 2026.
  const LEETCODE = {
    'opt-lru': [[146, 'LRU Cache', 'lru-cache', 'Medium', 'same', 'The same task: get returns −1 for a missing key, and put returns nothing.']],
    'opt-ring-deque': [
      [641, 'Design Circular Deque', 'design-circular-deque', 'Medium', 'same', 'The same structure with different names: insertFront and insertLast return true or false, and getFront and getRear return −1 when empty.'],
      [622, 'Design Circular Queue', 'design-circular-queue', 'Medium', 'similar', 'The one-ended version, a ring-buffer queue.'],
    ],
    'opt-days-between': [[1360, 'Number of Days Between Two Dates', 'number-of-days-between-two-dates', 'Easy', 'same', 'LeetCode wants the number of days without a sign, for years 1971 to 2100.']],
    'opt-pair-sum': [[1, 'Two Sum', 'two-sum', 'Easy', 'similar', 'Return the indices of the one pair that adds up to the target. The hash-map idea is the same.']],
    'opt-peak-live': [
      [1854, 'Maximum Population Year', 'maximum-population-year', 'Easy', 'similar', 'The earliest year with the most people alive, counting each person from birth up to the year before death: the same half-open sweep.'],
      [253, 'Meeting Rooms II', 'meeting-rooms-ii', 'Medium', 'similar', 'The classic version: the fewest meeting rooms needed is the peak number of overlapping meetings.', true],
    ],
    'opt-log-window': [
      [933, 'Number of Recent Calls', 'number-of-recent-calls', 'Easy', 'similar', 'The counting half: how many requests arrived in the last 3,000 ms, with a queue.'],
      [362, 'Design Hit Counter', 'design-hit-counter', 'Medium', 'similar', 'Hits in the last 300 seconds.', true],
    ],
    'opt-order-book': [[1801, 'Number of Orders in the Backlog', 'number-of-orders-in-the-backlog', 'Medium', 'similar', 'Match a batch of buy and sell orders with two heaps, then report how much is left resting.']],
    'opt-debug-matcher': [[1801, 'Number of Orders in the Backlog', 'number-of-orders-in-the-backlog', 'Medium', 'similar', 'The matcher done right, as its own problem: two heaps, then report how much is left resting.']],
    'opt-route': [
      [1976, 'Number of Ways to Arrive at Destination', 'number-of-ways-to-arrive-at-destination', 'Medium', 'similar', 'Count the shortest paths with Dijkstra: the part behind the "more than one shortest route" error.'],
      [743, 'Network Delay Time', 'network-delay-time', 'Medium', 'similar', 'Plain Dijkstra on a weighted graph.'],
    ],
    'opt-tree-errors': [
      [2196, 'Create Binary Tree From Descriptions', 'create-binary-tree-from-descriptions', 'Medium', 'similar', 'Build a binary tree from parent–child pairs and find its root.'],
      [606, 'Construct String from Binary Tree', 'construct-string-from-binary-tree', 'Medium', 'similar', 'Print a tree as a string with brackets, close to the S-expression here.'],
    ],
    'opt-dividends': [[307, 'Range Sum Query - Mutable', 'range-sum-query-mutable', 'Medium', 'similar', 'Point updates and range sums: the Fenwick (or segment) tree behind this problem.']],
    'opt-pumpkins': [
      [2353, 'Design a Food Rating System', 'design-a-food-rating-system', 'Medium', 'similar', 'A heap with lazy deletion: ratings change, so out-of-date entries are skipped when they reach the top.'],
      [480, 'Sliding Window Median', 'sliding-window-median', 'Hard', 'similar', 'Two heaps with lazy deletion, as numbers leave the window.'],
    ],
    'opt-numbers-station': [[1656, 'Design an Ordered Stream', 'design-an-ordered-stream', 'Easy', 'similar', 'Values arrive out of order by id; return each run as soon as it is complete.']],
    'opt-trucks': [[355, 'Design Twitter', 'design-twitter', 'Medium', 'similar', 'Follow, unfollow and a news feed: the same subscribe-and-deliver design.']],
  };
  for (const P of PROBLEMS) P.lc = LEETCODE[P.id] || [];

  // ---------------------------------------------------------------- running tests
  // JavaScript source -> the function or class it defines. `con` stands in for console.
  function compileJs(src, name, con) {
    return new Function('console', `"use strict";\n${src}\n;return typeof ${name} === "undefined" ? undefined : ${name};`)(con || console);
  }
  // Results as plain JSON-like values: undefined -> null, Sets and Maps -> arrays.
  function norm(x) {
    if (x === undefined) return null;
    if (x === null || typeof x !== 'object') return x;
    if (Array.isArray(x) || x instanceof Set || ArrayBuffer.isView(x)) return Array.from(x, norm);
    if (x instanceof Map) return Array.from(x, norm);
    return x;
  }
  const copy = (x) => JSON.parse(JSON.stringify(x));
  // Runs one test case against an implementation. Errors carry the index of the failing call.
  function exec(impl, P, t) {
    if (P.kind === 'fn') return norm(impl(...copy(t.args)));
    const obj = new impl(...copy(t.init)), out = [];
    copy(t.ops).forEach(([m, ...a], k) => {
      try {
        if (typeof obj[m] !== 'function') throw new TypeError(`${P.name} has no method ${m}`);
        out.push(norm(obj[m](...a)));
      } catch (err) {
        err.at = k;
        err.partial = out;
        throw err;
      }
    });
    return out;
  }
  // Numbers match to within 1e-6 (relative); null matches null or undefined.
  function same(a, b) {
    if (b === null || b === undefined) return a === null || a === undefined;
    if (typeof b === 'number') return typeof a === 'number' && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
    if (Array.isArray(b)) return Array.isArray(a) && a.length === b.length && b.every((x, i) => same(a[i], x));
    return a === b;
  }

  const refCache = new Map();
  const refImpl = (P) => refCache.get(P.id) || refCache.set(P.id, compileJs(P.ref.js, P.name)).get(P.id);

  // The cases to run: the examples ('run'), or every test plus random and large ones ('submit').
  // Random and large cases get their expected output from the reference solution.
  function cases(P, mode) {
    const list = [];
    P.tests.forEach((t, i) => {
      if (mode === 'run' && !t.ex) return;
      list.push({ ...t, label: t.ex ? `Example ${P.tests.slice(0, i + 1).filter((x) => x.ex).length}` : `Test ${i + 1}${t.name ? `: ${t.name}` : ''}` });
    });
    if (mode === 'run') return list;
    const ref = refImpl(P);
    if (P.fuzz) {
      const r = rng(seedOf(P.id));
      for (let i = 0; i < 25; i++) {
        const t = P.fuzz(r);
        list.push({ ...t, out: exec(ref, P, t), label: `Random case ${i + 1}` });
      }
    }
    if (P.perf) {
      const t = P.perf.gen(rng(seedOf(P.id) + 1));
      list.push({ ...t, out: exec(ref, P, t), label: P.perf.label, perf: true });
    }
    return list;
  }

  // ---------------------------------------------------------------- showing code and calls
  const pyName = (P) => (P.kind === 'cls' ? P.name : snake(P.name));
  const PY_HEAD = '# Standard-library imports work: heapq, bisect, collections, ...\n';
  function starter(P, lang) {
    if (P.starter) return P.starter[lang];
    const s = P.sig;
    if (P.kind === 'fn') {
      return lang === 'py'
        ? `${PY_HEAD}\ndef ${snake(P.name)}(${s.args.map(snake).join(', ')}):\n    # Return ${s.ret}\n    pass\n`
        : `function ${P.name}(${s.args.join(', ')}) {\n  // Return ${s.ret}\n}\n`;
    }
    if (lang === 'py') {
      const init = `    def __init__(${['self', ...s.init.map(snake)].join(', ')}):\n        pass\n`;
      const methods = s.methods.map(([m, args, ret]) => `\n    def ${snake(m)}(${['self', ...args.map(snake)].join(', ')}):\n        # ${ret ? `Return ${ret}` : 'Returns nothing'}\n        pass\n`);
      return `${PY_HEAD}\nclass ${P.name}:\n${init}${methods.join('')}`;
    }
    const methods = s.methods.map(([m, args, ret]) => `\n  // ${ret ? `Return ${ret}` : 'Returns nothing'}\n  ${m}(${args.join(', ')}) {\n  }\n`);
    return `class ${P.name} {\n  constructor(${s.init.join(', ')}) {\n  }\n${methods.join('')}}\n`;
  }
  // A value as it would be written in Python or JavaScript.
  function show(v, lang) {
    if (v === null || v === undefined) return lang === 'py' ? 'None' : 'null';
    if (typeof v === 'boolean') return lang === 'py' ? (v ? 'True' : 'False') : String(v);
    if (typeof v === 'string') return lang === 'py' ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map((x) => show(x, lang)).join(', ')}]`;
    if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
    return String(v);
  }
  // The calls a test makes, as [code, expected output or undefined] lines.
  function calls(P, t, lang) {
    const args = (a) => a.map((x) => show(x, lang)).join(', ');
    if (P.kind === 'fn') return [[`${lang === 'py' ? snake(P.name) : P.name}(${args(t.args)})`, t.out]];
    const v = 'obj';
    return [[`${v} = ${lang === 'js' ? 'new ' : ''}${P.name}(${args(t.init)})`, undefined], ...t.ops.map(([m, ...a], k) => [`${v}.${lang === 'py' ? snake(m) : m}(${args(a)})`, t.out[k]])];
  }

  QT.code = {
    PROBLEMS, GROUPS, byId: (id) => PROBLEMS.find((p) => p.id === id),
    rng, seedOf, snake, pyName, compileJs, norm, exec, same, cases, refImpl, starter, show, calls,
  };
})();
