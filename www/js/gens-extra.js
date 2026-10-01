// Options and classic-brainteaser generators (same shape as gens-interview.js).
(function () {
  const R = QT.rand, f = QT.fmtNum;
  const EXACT = { abs: 0.5, rel: 0 };
  QT.gens = QT.gens || {};

  QT.gens.options = [
    () => {
      // Same time value on both sides keeps C − P = S − K exactly, with both prices above intrinsic.
      const S = R.int(80, 120), K = R.pick([85, 90, 95, 100, 105, 110, 115]), tv = R.float(0.5, 6, 1);
      const C = +(Math.max(S - K, 0) + tv).toFixed(2), P = +(Math.max(K - S, 0) + tv).toFixed(2);
      return Math.random() < 0.5
        ? { q: `Stock at ${S}. The ${K}-strike European put costs ${P}. Assuming zero rates and no dividends, what must the ${K}-strike call cost?`, a: C,
            sol: `Put–call parity with r = 0: C − P = S − K. C = ${P} + ${S} − ${K} = ${f(C)}. If the market call differs, buy the cheap side and sell the rich side (a conversion or reversal) to lock in the difference.` }
        : { q: `Stock at ${S}. The ${K}-strike European call costs ${C}. Assuming zero rates and no dividends, what must the ${K}-strike put cost?`, a: P,
            sol: `Put–call parity with r = 0: P = C − S + K = ${C} − ${S} + ${K} = ${f(P)}.` };
    },
    () => {
      const S = R.pick([50, 100, 200, 400]), vol = R.pick([0.16, 0.2, 0.25, 0.3, 0.4]), mo = R.pick([1, 3, 4, 6, 12]), T = mo / 12, a = 0.4 * vol * S * Math.sqrt(T);
      return {
        q: `Use the rule of thumb C ≈ 0.4·σ·S·√T to estimate an at-the-money call: S = ${S}, σ = ${Math.round(vol * 100)}%, expiry ${mo} month${mo > 1 ? 's' : ''}.`,
        a,
        tol: { abs: 0.01, rel: 0.02 },
        sol: `0.4 × ${vol} × ${S} × √(${mo}/12) = ${f(a)}. The 0.4 comes from 1/√(2π) ≈ 0.399. Traders use this constantly to sanity-check prices.`,
      };
    },
    () => {
      const S = 100, vol = R.pick([0.2, 0.25, 0.3, 0.4, 0.5]), mo = R.pick([1, 3, 12]), T = mo / 12, X = +(0.8 * vol * S * Math.sqrt(T)).toFixed(2);
      return {
        q: `A stock trades at ${S}. The ${mo}-month at-the-money straddle (call + put) costs ${X}. Using straddle ≈ 0.8·σ·S·√T, what annualised implied volatility is the market pricing? (decimal or %)`,
        a: X / (0.8 * S * Math.sqrt(T)),
        sol: `σ ≈ straddle / (0.8·S·√T) = ${X} / (0.8 × ${S} × ${f(Math.sqrt(T))}) ≈ ${f(X / (0.8 * S * Math.sqrt(T)))}. The straddle price is roughly the market's expected absolute move.`,
      };
    },
    () => {
      const S0 = 100, up = R.pick([110, 115, 120, 125]), dn = R.pick([80, 85, 90, 95]), K = R.pick([95, 100, 105].filter((k) => k < up && k >= dn));
      const q = (S0 - dn) / (up - dn), a = q * Math.max(up - K, 0) + (1 - q) * Math.max(dn - K, 0);
      return {
        q: `One-period model, zero rates: a stock at 100 goes to either ${up} or ${dn}. Price a call struck at ${K}.`,
        a,
        sol: `Risk-neutral probability of the up move: q = (100 − ${dn})/(${up} − ${dn}) = ${f(q)}. Call = q·(${up} − ${K})${dn > K ? ` + (1−q)·(${dn} − ${K})` : ''} = ${f(a)}. The real-world probability of the up move doesn't matter, because the option can be replicated with stock and cash.`,
      };
    },
    () => {
      const k = R.int(1, 5), dice = R.pick([1, 2]);
      let a = 0;
      if (dice === 1) for (let d = 1; d <= 6; d++) a += Math.max(d - k, 0) / 6;
      else for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) a += Math.max(x + y - (k + 5), 0) / 36;
      const K = dice === 1 ? k : k + 5;
      return {
        q: `A contract pays max(X − ${K}, 0), where X is ${dice === 1 ? 'the roll of one fair die' : 'the sum of two fair dice'}. What is its fair value?`,
        a,
        sol: `This is a call option on ${dice === 1 ? 'a die' : 'two dice'} with strike ${K}. Average the payoff over all ${dice === 1 ? 6 : 36} equally likely outcomes: ${f(a)}. Market-making interviews love this format.`,
        sim: () => Math.max((dice === 1 ? R.die() : R.die() + R.die()) - K, 0),
      };
    },
    () => {
      const n = R.int(2, 20), delta = R.pick([0.25, 0.3, 0.4, 0.5, 0.6, 0.75]), side = R.pick(['long', 'short']), a = n * 100 * delta;
      return {
        q: `You are ${side} ${n} call contracts (100 shares each), each with delta ${delta}. How many shares must you ${side === 'long' ? 'sell' : 'buy'} to be delta-neutral?`,
        a,
        tol: EXACT,
        sol: `Position delta = ${side === 'long' ? '+' : '−'}${n} × 100 × ${delta} = ${side === 'long' ? '+' : '−'}${a} shares, so ${side === 'long' ? 'sell' : 'buy'} ${a} shares. You'll need to rebalance as delta changes (gamma).`,
      };
    },
  ];

  // Next-term puzzles, as in the reported Optiver "NumberLogic" and Maven sequence tests.
  const seq = (terms, next, rule) => ({
    q: `What comes next? <span class="mono"><b>${terms.join(', ')}, ?</b></span>`,
    a: next,
    tol: EXACT,
    sol: `${rule} Next term: <b>${next}</b>. Speed tip: write the differences first; if they aren't constant, try ratios, then look at alternate terms.`,
  });
  QT.gens.sequences = [
    () => { const a = R.int(-20, 40), d = R.pick([-9, -7, -4, 3, 6, 8, 11, 13]); const t = [0, 1, 2, 3, 4].map((i) => a + i * d); return seq(t, a + 5 * d, `Arithmetic: add ${d} each time.`); },
    () => { const a = R.int(1, 6), r = R.pick([2, 3, -2]); const t = [0, 1, 2, 3, 4].map((i) => a * r ** i); return seq(t, a * r ** 5, `Geometric: multiply by ${r}.`); },
    () => { const c = R.int(-5, 5), s = R.int(1, 4); const t = [0, 1, 2, 3, 4].map((i) => (s + i) ** 2 + c); return seq(t, (s + 5) ** 2 + c, `Squares${c ? ` ${c > 0 ? 'plus' : 'minus'} ${Math.abs(c)}` : ''}: n² for n = ${s}, ${s + 1}, … (differences grow by 2).`); },
    () => { const a = R.int(1, 5), b = R.int(2, 7); const t = [a, b]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]); return seq(t, t[4] + t[5], `Fibonacci-style: each term is the sum of the previous two.`); },
    () => { const a = R.int(1, 20), d = R.int(1, 5), e = R.int(1, 4); const t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + d + i * e); return seq(t, t[5] + d + 5 * e, `The differences go up by ${e} each time (${d}, ${d + e}, ${d + 2 * e}, …).`); },
    () => { const a = R.int(1, 9), da = R.pick([2, 3, 5]), b = R.int(20, 40), db = R.pick([-3, -2, 4]); const t = []; for (let i = 0; i < 6; i++) t.push(i % 2 ? b + ((i - 1) / 2) * db : a + (i / 2) * da); return seq(t, a + 3 * da, `Two interleaved sequences: odd positions add ${da}, even positions ${db > 0 ? 'add' : 'subtract'} ${Math.abs(db)}.`); },
    () => { const x0 = R.int(1, 5), m = R.pick([2, 3]), c = R.pick([-1, 1, 2]); const t = [x0]; for (let i = 0; i < 4; i++) t.push(m * t[i] + c); return seq(t, m * t[4] + c, `Each term is ${m}× the previous ${c > 0 ? 'plus' : 'minus'} ${Math.abs(c)}.`); },
    () => { const s = R.int(1, 3); const t = [0, 1, 2, 3, 4].map((i) => (s + i) ** 3); return seq(t, (s + 5) ** 3, `Cubes: n³ for n = ${s}, ${s + 1}, ….`); },
  ];

  QT.gens.puzzles = [
    () => {
      const n = R.int(3, 10), a = (n - 1) / (n * (n - 2));
      return {
        q: `Monty Hall with ${n} doors: one car, ${n - 1} goats. You pick a door; the host, who knows where the car is, opens one other door showing a goat. You switch to one of the ${n - 2} remaining closed doors at random. What is P(win)?`,
        a,
        sol: `P(first pick wrong) = ${n - 1}/${n}. If wrong, the car is behind one of the ${n - 2} other closed doors, so switching wins with probability 1/${n - 2}. Total: (${n - 1}/${n})·(1/${n - 2}) = ${f(a)}, versus 1/${n} = ${f(1 / n)} for staying.`,
        sim: () => {
          const car = R.int(0, n - 1), pick = R.int(0, n - 1);
          const goats = [];
          for (let i = 0; i < n; i++) if (i !== car && i !== pick) goats.push(i);
          const opened = R.pick(goats), rest = [];
          for (let i = 0; i < n; i++) if (i !== pick && i !== opened) rest.push(i);
          return R.pick(rest) === car ? 1 : 0;
        },
      };
    },
    () => {
      const pat = R.pick(['HH', 'HT', 'HHH', 'HHT', 'HTH', 'THH', 'TTT', 'HTT']);
      let a = 0;
      for (let k = 1; k <= pat.length; k++) if (pat.slice(0, k) === pat.slice(-k)) a += 2 ** k;
      return {
        q: `You flip a fair coin until the sequence <b>${pat}</b> first appears. What is the expected number of flips?`,
        a,
        sol: `Use Conway's overlap rule: add 2<sup>k</sup> for every k where the first k letters equal the last k letters of the pattern. For ${pat} that gives ${a}. Self-overlapping patterns (like HH) take longer, because a near-miss throws away progress.`,
        trials: 50000,
        sim: () => {
          let s = '', n = 0;
          while (!s.endsWith(pat)) {
            s = (s + (Math.random() < 0.5 ? 'H' : 'T')).slice(-pat.length);
            n++;
          }
          return n;
        },
      };
    },
    () => {
      const [label, K] = R.pick([['ace', 4], ['heart', 13], ['king or queen', 8], ['face card (J, Q, K)', 12], ['red ace', 2]]);
      const a = 53 / (K + 1);
      return {
        q: `You turn over cards from a shuffled 52-card deck one at a time. What is the expected position of the first ${label}?`,
        a,
        sol: `The ${K} special cards split the other ${52 - K} into ${K + 1} gaps of equal expected size ${52 - K}/${K + 1}. The first special card comes after the first gap: 1 + ${52 - K}/${K + 1} = 53/${K + 1} ≈ ${f(a)}.`,
        sim: () => {
          const deck = Array.from({ length: 52 }, (_, i) => i < K);
          for (let i = 51; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }
          return deck.indexOf(true) + 1;
        },
      };
    },
    () => {
      const n = R.int(3, 8), a = n / 2 ** (n - 1);
      return {
        q: `${n} points are placed uniformly at random on a circle. What is the probability they all lie within some semicircle?`,
        a,
        sol: `For each point i, P(all others lie in the semicircle clockwise from i) = (1/2)<sup>${n - 1}</sup>. These ${n} events are disjoint, so P = ${n}/2<sup>${n - 1}</sup> = ${f(a)}.`,
        sim: () => {
          const t = Array.from({ length: n }, () => Math.random()).sort((x, y) => x - y);
          let gap = 1 - t[n - 1] + t[0];
          for (let i = 1; i < n; i++) gap = Math.max(gap, t[i] - t[i - 1]);
          return gap >= 0.5 ? 1 : 0;
        },
      };
    },
    () => {
      const t = R.pick([0.5, 1]), a = Math.exp(t);
      return {
        q: `You draw independent Uniform(0,1) numbers until their running sum exceeds ${t}. What is the expected number of draws?`,
        a,
        sol: `P(sum of n uniforms ≤ t) = t<sup>n</sup>/n! for t ≤ 1. Then E[N] = Σ<sub>n≥0</sub> P(N > n) = Σ t<sup>n</sup>/n! = e<sup>${t}</sup> ≈ ${f(a)}.`,
        sim: () => {
          let s = 0, n = 0;
          while (s <= t) {
            s += Math.random();
            n++;
          }
          return n;
        },
      };
    },
    () => {
      const n = R.pick([10, 50, 100, 300]);
      return {
        q: `${n} passengers board a plane with ${n} assigned seats. The first has lost their boarding pass and sits in a random seat. Each later passenger takes their own seat if it's free, otherwise a random free seat. What is the probability the last passenger gets their own seat?`,
        a: 0.5,
        sol: `The last free seat is always either seat 1 or seat ${n}: any displaced passenger is equally likely to pick either one, and picking seat 1 resolves everything. By symmetry the answer is 1/2 for any n ≥ 2.`,
        trials: 20000,
        sim: () => {
          const free = new Set(Array.from({ length: n }, (_, i) => i));
          const take = (s) => free.delete(s);
          const randomFree = () => { const arr = [...free]; return arr[Math.floor(Math.random() * arr.length)]; };
          take(randomFree());
          for (let p = 1; p < n - 1; p++) take(free.has(p) ? p : randomFree());
          return free.has(n - 1) ? 1 : 0;
        },
      };
    },
    () => ({
      q: `A stick is broken at two independent uniformly random points. What is the probability the three pieces can form a triangle?`,
      a: 0.25,
      sol: `A triangle needs every piece shorter than ½. With break points (x, y) uniform on the unit square, the valid region is two triangles each with area 1/8, so P = 1/4.`,
      sim: () => {
        const x = Math.random(), y = Math.random(), a = Math.min(x, y), b = Math.max(x, y);
        return a < 0.5 && b - a < 0.5 && 1 - b < 0.5 ? 1 : 0;
      },
    }),
  ];
})();
