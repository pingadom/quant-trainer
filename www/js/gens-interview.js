// Interview-track problem generators. Each generator returns:
//   { q: html, a: number, sol: html, tol?: {abs, rel}, sim?: () => number|null, trials?: number }
// `sim` runs one Monte Carlo trial: return 1/0 for a probability, a value for an expectation,
// or null to reject the trial (used for conditioning).
(function () {
  const R = QT.rand, M = QT.m, f = QT.fmtNum;
  const pct = (x) => `${+(x * 100).toPrecision(4)}%`;
  const EXACT = { abs: 0.5, rel: 0 };
  const drawCards = (n) => {
    const s = new Set();
    while (s.size < n) s.add(Math.floor(Math.random() * 52));
    return [...s];
  };
  QT.gens = QT.gens || {};

  QT.gens.dice = [
    () => {
      const k = R.int(2, 12), c = 6 - Math.abs(k - 7);
      return {
        q: `Two fair six-sided dice are rolled. What is the probability their sum is <b>${k}</b>?`,
        a: c / 36,
        sol: `36 equally likely outcomes. Sum ${k} occurs in 6 − |${k} − 7| = ${c} of them, so P = ${c}/36 = ${M.frac(c, 36)} ≈ ${f(c / 36)}.`,
        sim: () => (R.die() + R.die() === k ? 1 : 0),
      };
    },
    () => {
      const n = R.int(2, 8), a = 1 - (5 / 6) ** n;
      return {
        q: `You roll a fair die ${n} times. What is the probability of at least one six?`,
        a,
        sol: `Complement: P(no six) = (5/6)<sup>${n}</sup> ≈ ${f((5 / 6) ** n)}, so P(at least one) ≈ ${f(a)}. "At least one" almost always means: use the complement.`,
        sim: () => {
          for (let i = 0; i < n; i++) if (R.die() === 6) return 1;
          return 0;
        },
      };
    },
    () => {
      const n = R.int(4, 10), k = R.int(1, n - 1), c = M.comb(n, k), d = 2 ** n;
      return {
        q: `A fair coin is flipped ${n} times. What is the probability of exactly ${k} heads?`,
        a: c / d,
        sol: `Each sequence has probability 1/${d}. There are C(${n},${k}) = ${c} sequences with ${k} heads, so P = ${M.frac(c, d)} ≈ ${f(c / d)}.`,
        sim: () => {
          let h = 0;
          for (let i = 0; i < n; i++) h += Math.random() < 0.5;
          return h === k ? 1 : 0;
        },
      };
    },
    () => {
      const t = R.int(10, 16);
      let c = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let d = 1; d <= 6; d++) if (a + b + d >= t) c++;
      return {
        q: `Three fair dice are rolled. What is the probability the sum is at least ${t}?`,
        a: c / 216,
        sol: `The sum of 3 dice is symmetric about 10.5, so P(S ≥ ${t}) = P(S ≤ ${21 - t}). Counting outcomes gives ${c} of 216, so P = ${M.frac(c, 216)} ≈ ${f(c / 216)}.`,
        sim: () => (R.die() + R.die() + R.die() >= t ? 1 : 0),
      };
    },
    () => {
      const n = R.int(2, 10), a = (n * 35) / 12;
      return {
        q: `What is the variance of the sum of ${n} fair six-sided dice?`,
        a,
        sol: `One die: E[X] = 3.5 and E[X²] = 91/6, so Var(X) = 91/6 − 3.5² = 35/12. Variances of independent variables add: ${n} × 35/12 = ${M.frac(35 * n, 12)} ≈ ${f(a)}.`,
      };
    },
  ];

  QT.gens.cards = [
    () => {
      const n = R.int(2, 4), num = 4 * M.comb(13, n), den = M.comb(52, n);
      return {
        q: `You draw ${n} cards from a shuffled 52-card deck. What is the probability they are all the same suit?`,
        a: num / den,
        sol: `Pick a suit (4 ways), then ${n} of its 13 cards: 4·C(13,${n}) = ${num}. Total hands: C(52,${n}) = ${den}. P = ${M.frac(num, den)} ≈ ${f(num / den)}. Sequential check: 1 × 12/51 × 11/50 × …`,
        sim: () => {
          const s = drawCards(n).map((c) => Math.floor(c / 13));
          return s.every((x) => x === s[0]) ? 1 : 0;
        },
      };
    },
    () => {
      const n = R.int(2, 6), none = M.comb(48, n) / M.comb(52, n);
      return {
        q: `You are dealt ${n} cards. What is the probability you get at least one ace?`,
        a: 1 - none,
        sol: `P(no aces) = C(48,${n})/C(52,${n}) ≈ ${f(none)}. So P(at least one) ≈ ${f(1 - none)}.`,
        sim: () => (drawCards(n).some((c) => c % 13 === 0) ? 1 : 0),
      };
    },
    () => {
      const word = R.pick(['LEVEL', 'BANANA', 'STATISTICS', 'MISSISSIPPI', 'ARBITRAGE', 'VOLATILITY', 'OPTIONS', 'HEDGE']);
      const counts = {};
      for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
      const reps = Object.entries(counts).filter(([, c]) => c > 1);
      const a = M.fact(word.length) / reps.reduce((p, [, c]) => p * M.fact(c), 1);
      const denom = reps.length ? ' / (' + reps.map(([, c]) => `${c}!`).join('·') + ')' : '';
      return {
        q: `How many distinct arrangements are there of the letters in <b>${word}</b>?`,
        a,
        tol: EXACT,
        sol: `${word.length} letters${reps.length ? `, with repeats ${reps.map(([l, c]) => `${l}×${c}`).join(', ')}` : ', all distinct'}. Arrangements = ${word.length}!${denom} = ${a}.`,
      };
    },
    () => {
      const n = R.int(10, 50);
      let none = 1;
      for (let i = 0; i < n; i++) none *= (365 - i) / 365;
      return {
        q: `There are ${n} people in a room. What is the probability at least two share a birthday? (365 equally likely days.)`,
        a: 1 - none,
        sol: `P(all different) = (365/365)(364/365)…(${366 - n}/365) ≈ ${f(none)}. So P(shared) ≈ ${f(1 - none)}. Quick estimate: P(all different) ≈ exp(−n(n−1)/730) = ${f(Math.exp((-n * (n - 1)) / 730))}.`,
        trials: 50000,
        sim: () => {
          const seen = new Set();
          for (let i = 0; i < n; i++) {
            const b = Math.floor(Math.random() * 365);
            if (seen.has(b)) return 1;
            seen.add(b);
          }
          return 0;
        },
      };
    },
    () => {
      const n = R.int(6, 12), k = R.int(2, 4), a = M.comb(n, k) * k;
      return {
        q: `From ${n} people, how many ways can you form a committee of ${k} with one member named chair?`,
        a,
        tol: EXACT,
        sol: `Choose the committee, C(${n},${k}) = ${M.comb(n, k)}, then the chair (${k} ways): ${a}. Equivalently, pick the chair (${n}) then the rest, C(${n - 1},${k - 1}): ${n} × ${M.comb(n - 1, k - 1)} = ${a}.`,
      };
    },
  ];

  QT.gens.bayes = [
    () => {
      const prev = R.pick([0.001, 0.005, 0.01, 0.02, 0.05]), sens = R.pick([0.9, 0.95, 0.99]), fpr = R.pick([0.01, 0.02, 0.05, 0.1]);
      const a = (sens * prev) / (sens * prev + fpr * (1 - prev));
      return {
        q: `A condition affects ${pct(prev)} of people. A test detects it ${pct(sens)} of the time when present and gives a false positive ${pct(fpr)} of the time when absent. Someone tests positive. What is the probability they have the condition?`,
        a,
        sol: `P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|¬D)P(¬D)] = (${sens}·${prev}) / (${sens}·${prev} + ${fpr}·${+(1 - prev).toFixed(3)}) ≈ ${f(a)}. With a low base rate, most positives are false.`,
        trials: 1000000, // only ~1–10% of trials test positive, so run plenty
        sim: () => {
          const d = Math.random() < prev;
          const pos = d ? Math.random() < sens : Math.random() < fpr;
          return pos ? (d ? 1 : 0) : null;
        },
      };
    },
    () => {
      const m = R.int(2, 10), k = R.int(1, 6), a = 2 ** k / (2 ** k + m - 1), s = k > 1 ? 's' : '';
      return {
        q: `A bag has ${m} coins: ${m - 1} fair and 1 double-headed. You pick one at random and flip it ${k} time${s}, getting ${k} head${s}. What is the probability you picked the double-headed coin?`,
        a,
        sol: `Prior odds (double : fair) = 1 : ${m - 1}. Likelihood ratio = 1 / (1/2)<sup>${k}</sup> = ${2 ** k}. Posterior odds = ${2 ** k} : ${m - 1}, so P = ${2 ** k}/${2 ** k + m - 1} ≈ ${f(a)}. Thinking in odds makes Bayes fast.`,
        sim: () => {
          const dbl = Math.random() < 1 / m;
          for (let i = 0; i < k; i++) if (!dbl && Math.random() < 0.5) return null;
          return dbl ? 1 : 0;
        },
      };
    },
    () => {
      const n = R.int(2, 5), a = 1 / (2 ** n - 1);
      return {
        q: `A family has ${n} children. Given at least one is a boy, what is the probability all ${n} are boys? (Each child is independently a boy or girl with probability 1/2.)`,
        a,
        sol: `Of the ${2 ** n} equally likely sequences, ${2 ** n - 1} contain at least one boy and one is all boys. P = 1/${2 ** n - 1} ≈ ${f(a)}.`,
        sim: () => {
          let b = 0;
          for (let i = 0; i < n; i++) b += Math.random() < 0.5;
          return b === 0 ? null : b === n ? 1 : 0;
        },
      };
    },
    () => {
      const s = R.int(7, 11);
      let tot = 0, six = 0;
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++)
          if (a + b >= s) {
            tot++;
            if (a === 6 || b === 6) six++;
          }
      return {
        q: `Two dice are rolled and you are told the sum is at least ${s}. What is the probability at least one die shows a six?`,
        a: six / tot,
        sol: `Restrict to the ${tot} outcomes with sum ≥ ${s}. Of these, ${six} contain a six. P = ${M.frac(six, tot)} ≈ ${f(six / tot)}.`,
        sim: () => {
          const a = R.die(), b = R.die();
          return a + b < s ? null : a === 6 || b === 6 ? 1 : 0;
        },
      };
    },
    () => {
      const r1 = R.int(1, 6), b1 = R.int(1, 6), r2 = R.int(1, 6), b2 = R.int(1, 6);
      const pA = r1 / (r1 + b1), pB = r2 / (r2 + b2), a = pA / (pA + pB);
      return {
        q: `Urn A has ${r1} red and ${b1} blue balls; urn B has ${r2} red and ${b2} blue. You pick an urn with a fair coin and draw one ball: it's red. What is the probability it came from urn A?`,
        a,
        sol: `P(A|red) = P(red|A)·½ / [P(red|A)·½ + P(red|B)·½] = ${f(pA)} / (${f(pA)} + ${f(pB)}) ≈ ${f(a)}.`,
      };
    },
  ];

  QT.gens.ev = [
    () => {
      const d = R.pick([4, 6, 8, 10, 12, 20]), t = (d + 1) / 2;
      let s = 0;
      for (let x = 1; x <= d; x++) s += Math.max(x, t);
      const a = s / d, keep = Math.floor(t) + 1;
      return {
        q: `You roll a fair ${d}-sided die and are paid its face value in dollars. After seeing the roll you may reroll once (and must accept the second roll). What is the expected payoff under optimal play?`,
        a,
        sol: `A reroll is worth ${t}. Keep any roll above ${t} (i.e. ${keep}–${d}) and reroll the other ${keep - 1} faces. EV = (1/${d})·[(${keep} + … + ${d}) + ${keep - 1}·${t}] = ${f(a)}. This is backward induction, the same logic you use to price American options.`,
        sim: () => {
          let x = R.die(d);
          if (x <= t) x = R.die(d);
          return x;
        },
      };
    },
    () => {
      const k = R.int(2, 4);
      let a = 0;
      for (let m = 1; m <= 6; m++) a += 1 - ((m - 1) / 6) ** k;
      return {
        q: `You roll ${k} fair dice. What is the expected value of the maximum?`,
        a,
        sol: `P(max ≤ m) = (m/6)<sup>${k}</sup>. Using the tail-sum formula E[X] = Σ P(X ≥ m) = Σ<sub>m=1..6</sub> [1 − ((m−1)/6)<sup>${k}</sup>] ≈ ${f(a)}.`,
        sim: () => {
          let mx = 0;
          for (let i = 0; i < k; i++) mx = Math.max(mx, R.die());
          return mx;
        },
      };
    },
    () => {
      const n = R.pick([4, 6, 8, 10, 12]), a = n * M.harmonic(n);
      return {
        q: `You roll a fair ${n}-sided die until every face has appeared at least once. What is the expected number of rolls?`,
        a,
        sol: `After i distinct faces, the wait for a new one is geometric with success probability (${n}−i)/${n}, so mean ${n}/(${n}−i). Summing gives ${n}(1 + ½ + … + 1/${n}) = ${n}·H<sub>${n}</sub> ≈ ${f(a)}. (This is the coupon collector problem.)`,
        trials: 50000,
        sim: () => {
          const seen = new Set();
          let r = 0;
          while (seen.size < n) {
            seen.add(R.die(n));
            r++;
          }
          return r;
        },
      };
    },
    () => {
      const n = R.int(3, 20), a = 6 * (1 - (5 / 6) ** n);
      return {
        q: `You roll a fair die ${n} times. What is the expected number of distinct faces that appear?`,
        a,
        sol: `Linearity of expectation with indicators: face j appears with probability 1 − (5/6)<sup>${n}</sup>. Six faces: 6·(1 − (5/6)<sup>${n}</sup>) ≈ ${f(a)}.`,
        sim: () => {
          const s = new Set();
          for (let i = 0; i < n; i++) s.add(R.die());
          return s.size;
        },
      };
    },
    () => {
      const k = R.int(2, 5), a = 2 ** (k + 1) - 2;
      return {
        q: `You flip a fair coin until you get ${k} heads in a row. What is the expected number of flips?`,
        a,
        sol: `Let E<sub>k</sub> be the expected flips for k in a row. You need k−1 in a row, then one more flip, which fails half the time and sends you back to the start: E<sub>k</sub> = E<sub>k−1</sub> + 1 + ½E<sub>k</sub> ⇒ E<sub>k</sub> = 2E<sub>k−1</sub> + 2. With E<sub>0</sub> = 0, E<sub>k</sub> = 2<sup>k+1</sup> − 2 = ${a}.`,
        trials: 50000,
        sim: () => {
          let run = 0, n = 0;
          while (run < k) {
            n++;
            run = Math.random() < 0.5 ? run + 1 : 0;
          }
          return n;
        },
      };
    },
    () => {
      const d = R.pick([4, 6, 8, 10, 12, 20]), a = ((d + 1) * (2 * d + 1)) / 6;
      return {
        q: `You roll a fair ${d}-sided die and are paid the <b>square</b> of the face in dollars. What is the fair price of this game?`,
        a,
        sol: `E[X²] = (1² + … + ${d}²)/${d} = (${d}+1)(2·${d}+1)/6 = ${f(a)}. This is more than (E[X])² = ${f(((d + 1) / 2) ** 2)}; the gap is Var(X). Convex payoffs are worth more with more variance, which is why options have value.`,
        sim: () => R.die(d) ** 2,
      };
    },
    () => {
      const L = R.pick([1, 2, 10, 12, 20]);
      return {
        q: `A stick of length ${L} is broken at a uniformly random point. What is the expected length of the longer piece?`,
        a: 0.75 * L,
        sol: `If the break is at U ~ U(0,${L}), the longer piece is max(U, ${L}−U), which is uniform on [${L / 2}, ${L}]. Its mean is ¾·${L} = ${0.75 * L}.`,
        sim: () => {
          const u = Math.random() * L;
          return Math.max(u, L - u);
        },
      };
    },
  ];

  QT.gens.walks = [
    () => {
      const N = R.int(5, 20), i = R.int(1, N - 1);
      return {
        q: `A gambler starts with $${i} and bets $1 on fair coin flips until reaching $${N} or going broke. What is the probability of reaching $${N}?`,
        a: i / N,
        sol: `Wealth is a martingale (fair game). By optional stopping, E[final] = ${i} = ${N}·P + 0·(1−P), so P = ${i}/${N} = ${f(i / N)}.`,
        trials: 20000,
        sim: () => {
          let w = i;
          while (w > 0 && w < N) w += Math.random() < 0.5 ? 1 : -1;
          return w === N ? 1 : 0;
        },
      };
    },
    () => {
      const N = R.int(5, 20), i = R.int(1, N - 1);
      return {
        q: `Starting at $${i}, you bet $1 on fair coin flips until you hit $0 or $${N}. What is the expected number of flips?`,
        a: i * (N - i),
        sol: `D<sub>i</sub> = 1 + ½D<sub>i−1</sub> + ½D<sub>i+1</sub> with D<sub>0</sub> = D<sub>${N}</sub> = 0 gives D<sub>i</sub> = i(${N}−i) = ${i * (N - i)}. You can also get this from the martingale S<sub>n</sub>² − n.`,
        trials: 20000,
        sim: () => {
          let w = i, n = 0;
          while (w > 0 && w < N) {
            w += Math.random() < 0.5 ? 1 : -1;
            n++;
          }
          return n;
        },
      };
    },
    () => {
      const p = R.pick([0.45, 0.48, 0.52, 0.55, 0.6]), N = R.int(6, 15), i = R.int(2, N - 2), r = (1 - p) / p;
      const a = (1 - r ** i) / (1 - r ** N);
      return {
        q: `You start with $${i} and bet $1 per round, winning each round with probability ${p}. You stop at $0 or $${N}. What is the probability of reaching $${N}?`,
        a,
        sol: `With r = q/p = ${f(r)}, P = (1 − r<sup>${i}</sup>) / (1 − r<sup>${N}</sup>) ≈ ${f(a)}. (Fair game: ${f(i / N)}.) A small per-bet edge compounds, which is why edge matters so much in trading.`,
        trials: 20000,
        sim: () => {
          let w = i;
          while (w > 0 && w < N) w += Math.random() < p ? 1 : -1;
          return w === N ? 1 : 0;
        },
      };
    },
    () => {
      const n = 2 * R.int(2, 10), a = M.comb(n, n / 2) / 2 ** n;
      return {
        q: `A simple symmetric random walk starts at 0 (±1 each step, equally likely). What is the probability it is back at 0 after ${n} steps?`,
        a,
        sol: `You need exactly ${n / 2} up-steps out of ${n}: C(${n},${n / 2})/2<sup>${n}</sup> ≈ ${f(a)}. Stirling gives ≈ 1/√(π·${n / 2}) = ${f(1 / Math.sqrt((Math.PI * n) / 2))}.`,
        sim: () => {
          let s = 0;
          for (let j = 0; j < n; j++) s += Math.random() < 0.5 ? 1 : -1;
          return s === 0 ? 1 : 0;
        },
      };
    },
  ];
})();
