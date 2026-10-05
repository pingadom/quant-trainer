// Mental-arithmetic speed tricks: short lessons (the rule, why it works, worked examples) each
// with a 10-question practice drill. Every drill solution walks through the trick using the
// question's own numbers, computed here rather than written by hand.
(function () {
  const R = QT.rand, f = QT.fmtNum;
  const EXACT = { abs: 0.0005, rel: 0 };
  const DP3 = { abs: 0.0006, rel: 0 };
  const c = (n) => Number(n).toLocaleString('en-GB', { maximumFractionDigits: 6 }); // 12,345.5
  const digits = (n) => String(n).split('').map(Number);
  const droot = (n) => { let x = Math.abs(n); while (x > 9) x = digits(x).reduce((a, b) => a + b, 0); return x === 0 ? 9 : x; };
  const r = (x, dp) => Math.round(x * 10 ** dp) / 10 ** dp;

  const TRICKS = [
    // ----------------------------------------------------------- multiplication
    {
      id: 'times-5-25-125', group: 'Multiplication', title: '× 5, × 25, × 125',
      tagline: 'Halve, quarter or eighth, then shift the decimal.',
      body: `<p><b>Rule.</b> 5 = 10 ÷ 2, 25 = 100 ÷ 4 and 125 = 1000 ÷ 8. So divide by 2, 4 or 8 and multiply by 10, 100 or 1000.</p>
        <ul class="examples"><li>68 × 5 = 34 × 10 = <b>340</b></li><li>48 × 25 = 12 × 100 = <b>1,200</b></li><li>37 × 25 = 9.25 × 100 = <b>925</b></li><li>72 × 125 = 9 × 1,000 = <b>9,000</b></li></ul>
        <p><b>When.</b> Any time a 5, 25, 125 (or 50, 250…) appears. Dividing a number by 2 or 4 is far easier than multiplying by 25.</p>`,
      gen: () => {
        const [m, k, p] = R.pick([[5, 2, 10], [25, 4, 100], [125, 8, 1000]]);
        const n = m === 125 ? R.int(2, 12) * 8 + R.pick([0, 0, 4]) : R.int(12, m === 5 ? 380 : 99);
        return { q: `${n} × ${m}`, a: n * m, tol: EXACT, sol: `${n} × ${m} = (${n} ÷ ${k}) × ${c(p)} = ${f(n / k)} × ${c(p)} = <b>${c(n * m)}</b>` };
      },
    },
    {
      id: 'times-9-11-99', group: 'Multiplication', title: '× 9, × 99, × 11, × 101',
      tagline: 'Multiply by the round number, then adjust; the × 11 digit trick.',
      body: `<p><b>Rule.</b> × 9 = × 10 − the number. × 99 = × 100 − the number. × 101 = × 100 + the number.</p>
        <p><b>× 11 for two-digit numbers:</b> keep the outer digits and write their sum in the middle, carrying if it's 10 or more.</p>
        <ul class="examples"><li>47 × 9 = 470 − 47 = <b>423</b></li><li>36 × 99 = 3,600 − 36 = <b>3,564</b></li><li>52 × 11 → 5 | 5+2 | 2 = <b>572</b></li><li>78 × 11 → 7 | 15 | 8 → carry the 1 → <b>858</b></li><li>43 × 101 = 4,300 + 43 = <b>4,343</b></li></ul>`,
      gen: () => {
        const kind = R.pick(['9', '99', '11', '101']);
        if (kind === '11') {
          const n = R.int(12, 98), [a, b] = digits(n), s = a + b;
          const how = s < 10 ? `${a} | ${a}+${b} | ${b} = ${a}${s}${b}` : `${a} | ${s} | ${b} → carry the 1 → ${a + 1}${s - 10}${b}`;
          return { q: `${n} × 11`, a: n * 11, tol: EXACT, sol: `${how} = <b>${c(n * 11)}</b>` };
        }
        const n = R.int(13, kind === '9' ? 199 : 99), m = +kind;
        const sol = kind === '9' ? `${n} × 10 − ${n} = ${c(n * 10)} − ${n}` : kind === '99' ? `${n} × 100 − ${n} = ${c(n * 100)} − ${n}` : `${n} × 100 + ${n} = ${c(n * 100)} + ${n}`;
        return { q: `${n} × ${m}`, a: n * m, tol: EXACT, sol: `${sol} = <b>${c(n * m)}</b>` };
      },
    },
    {
      id: 'square-ending-5', group: 'Multiplication', title: 'Squaring numbers ending in 5',
      tagline: 'n × (n+1), then write 25.',
      body: `<p><b>Rule.</b> For a number ending in 5, multiply the part before the 5 by the next number up, then write 25 after it.</p>
        <p><b>Why.</b> (10a + 5)² = 100a² + 100a + 25 = 100·a(a + 1) + 25.</p>
        <ul class="examples"><li>65²: 6 × 7 = 42 → <b>4,225</b></li><li>115²: 11 × 12 = 132 → <b>13,225</b></li><li>8.5²: 8 × 9 = 72 → 72.25</li></ul>`,
      gen: () => {
        const a = R.int(1, 19), n = 10 * a + 5;
        return { q: `${n}²`, a: n * n, tol: EXACT, sol: `${a} × ${a + 1} = ${a * (a + 1)}, then write 25 → <b>${c(n * n)}</b>` };
      },
    },
    {
      id: 'squares-near-50-100', group: 'Multiplication', title: 'Squares near 50 and 100',
      tagline: '53² = 28|09. 97² = 94|09.',
      body: `<p><b>Near 50:</b> (50 + d)² = (25 + d) hundreds + d². <b>Near 100:</b> (100 + d)² = (100 + 2d) hundreds + d². In both cases write d² as two digits, and d can be negative.</p>
        <p><b>Why.</b> (50 + d)² = 2500 + 100d + d² = 100(25 + d) + d², and (100 + d)² = 100(100 + 2d) + d².</p>
        <ul class="examples"><li>53²: 25 + 3 = 28, 3² = 09 → <b>2,809</b></li><li>47²: 25 − 3 = 22, 09 → <b>2,209</b></li><li>104²: 108, 16 → <b>10,816</b></li><li>97²: 94, 09 → <b>9,409</b></li></ul>`,
      gen: () => {
        const base = R.pick([50, 100]);
        let d = 0;
        while (!d) d = R.int(-9, 9);
        const n = base + d, left = base === 50 ? 25 + d : 100 + 2 * d;
        return { q: `${n}²`, a: n * n, tol: EXACT, sol: `${base === 50 ? `25 ${d > 0 ? '+' : '−'} ${Math.abs(d)}` : `100 ${d > 0 ? '+' : '−'} ${2 * Math.abs(d)}`} = ${left}, and ${Math.abs(d)}² = ${String(d * d).padStart(2, '0')} → <b>${c(n * n)}</b>` };
      },
    },
    {
      id: 'difference-of-squares', group: 'Multiplication', title: 'Difference of squares',
      tagline: '47 × 53 = 50² − 3².',
      body: `<p><b>Rule.</b> When two numbers sit equally either side of a round number m, their product is m² − d², where d is the distance from m.</p>
        <p><b>Why.</b> (m − d)(m + d) = m² − d².</p>
        <ul class="examples"><li>47 × 53 = 50² − 3² = 2,500 − 9 = <b>2,491</b></li><li>38 × 42 = 40² − 2² = 1,600 − 4 = <b>1,596</b></li><li>67 × 73 = 4,900 − 9 = <b>4,891</b></li></ul>
        <p><b>Spot it:</b> the two numbers average to a round number. It also works for 33 × 37 (m = 35, 35² = 1,225 by the "ends in 5" trick).</p>`,
      gen: () => {
        const m = R.pick([20, 30, 40, 50, 60, 70, 80, 90, 25, 35, 45]), d = R.int(1, 9), a = m - d, b = m + d;
        return { q: `${a} × ${b}`, a: a * b, tol: EXACT, sol: `They straddle ${m}: ${m}² − ${d}² = ${c(m * m)} − ${d * d} = <b>${c(a * b)}</b>` };
      },
    },
    {
      id: 'near-100', group: 'Multiplication', title: 'Multiplying numbers near 100',
      tagline: '96 × 93 = 89|28.',
      body: `<p><b>Below 100:</b> find each number's shortfall from 100. The left part is either number minus the <i>other's</i> shortfall; the right part is the product of the shortfalls (two digits).</p>
        <p><b>Above 100:</b> the same with excesses, adding instead of subtracting.</p>
        <p><b>Why.</b> (100 − a)(100 − b) = 100(100 − a − b) + ab.</p>
        <ul class="examples"><li>96 × 93: shortfalls 4 and 7 → 96 − 7 = 89 | 4 × 7 = 28 → <b>8,928</b></li><li>98 × 97 → 95 | 06 → <b>9,506</b></li><li>104 × 107 → 111 | 28 → <b>11,128</b></li></ul>
        <p><b>Watch out:</b> if the right part is 100 or more, carry into the left (88 × 87: 75 | 156 → 7,656).</p>`,
      gen: () => {
        const above = Math.random() < 0.35;
        const a = above ? R.int(101, 112) : R.int(86, 99), b = above ? R.int(101, 112) : R.int(86, 99);
        const da = Math.abs(100 - a), db = Math.abs(100 - b), left = above ? a + db : a - db, right = da * db;
        const carry = right >= 100 ? ` (carry: ${left} × 100 + ${right})` : '';
        return { q: `${a} × ${b}`, a: a * b, tol: EXACT, sol: `${above ? 'Excesses' : 'Shortfalls'} ${da} and ${db}: ${a} ${above ? '+' : '−'} ${db} = ${left} | ${da} × ${db} = ${String(right).padStart(2, '0')}${carry} → <b>${c(a * b)}</b>` };
      },
    },
    {
      id: 'split-left-to-right', group: 'Multiplication', title: 'Split and multiply left to right',
      tagline: '47 × 36 = 40 × 36 + 7 × 36.',
      body: `<p><b>Rule.</b> Split one number into tens and units, multiply each part, and add, <b>biggest part first</b>.</p>
        <ul class="examples"><li>47 × 36 = 40 × 36 + 7 × 36 = 1,440 + 252 = <b>1,692</b></li><li>8 × 4.7 = 8 × 4 + 8 × 0.7 = 32 + 5.6 = <b>37.6</b></li></ul>
        <p><b>Why left to right:</b> your running total is always roughly right, so if time runs out, or you're choosing from options, you already know the answer's size.</p>`,
      gen: () => {
        const a = R.int(13, 97), b = R.int(13, 97), t = a - (a % 10), u = a % 10;
        return { q: `${a} × ${b}`, a: a * b, tol: EXACT, sol: `${t} × ${b} + ${u} × ${b} = ${c(t * b)} + ${c(u * b)} = <b>${c(a * b)}</b>` };
      },
    },
    {
      id: 'halve-and-double', group: 'Multiplication', title: 'Halve and double',
      tagline: '16 × 35 = 8 × 70.',
      body: `<p><b>Rule.</b> Halving one factor and doubling the other leaves the product unchanged. Repeat until it's easy.</p>
        <ul class="examples"><li>16 × 35 = 8 × 70 = <b>560</b></li><li>14 × 45 = 7 × 90 = <b>630</b></li><li>4.5 × 18 = 9 × 9 = <b>81</b></li></ul>
        <p><b>When.</b> One number is even and the other ends in 5. Doubling a 5-ending number makes it round.</p>`,
      gen: () => {
        const a = 2 * R.int(6, 49), b = 5 * (2 * R.int(1, 19) + 1);
        return { q: `${a} × ${b}`, a: a * b, tol: EXACT, sol: `Halve ${a}, double ${b}: ${a / 2} × ${2 * b} = <b>${c(a * b)}</b>` };
      },
    },
    {
      id: 'round-and-compensate', group: 'Multiplication', title: 'Round and compensate',
      tagline: '7 × 98 = 700 − 14.',
      body: `<p><b>Rule.</b> Replace an awkward number with a nearby round one, then correct for the difference.</p>
        <ul class="examples"><li>7 × 98 = 7 × 100 − 7 × 2 = 700 − 14 = <b>686</b></li><li>398 + 257 = 400 + 257 − 2 = <b>655</b></li><li>523 − 199 = 523 − 200 + 1 = <b>324</b></li></ul>
        <p><b>Watch the sign of the correction.</b> Subtracting too much means adding some back.</p>`,
      gen: () => {
        const kind = R.pick(['mul', 'add', 'sub']);
        if (kind === 'mul') {
          const k = R.int(3, 9), base = R.pick([100, 1000]), d = R.int(1, 4), n = base - d;
          return { q: `${k} × ${n}`, a: k * n, tol: EXACT, sol: `${k} × ${c(base)} − ${k} × ${d} = ${c(k * base)} − ${k * d} = <b>${c(k * n)}</b>` };
        }
        const base = R.pick([200, 300, 400, 500]), d = R.int(1, 3), x = base - d, y = R.int(120, 880);
        return kind === 'add'
          ? { q: `${x} + ${y}`, a: x + y, tol: EXACT, sol: `${base} + ${y} − ${d} = <b>${c(x + y)}</b>` }
          : { q: `${y + base} − ${x}`, a: y + base - x, tol: EXACT, sol: `${y + base} − ${base} + ${d} = <b>${c(y + base - x)}</b>` };
      },
    },

    // ----------------------------------------------------------- addition & subtraction
    {
      id: 'complements', group: 'Addition & subtraction', title: 'Subtracting from 1,000',
      tagline: 'All from 9, the last from 10.',
      body: `<p><b>Rule.</b> To subtract from 1,000 or 10,000, take every digit from 9 and the last digit from 10. No borrowing.</p>
        <ul class="examples"><li>1,000 − 367: 9−3 | 9−6 | 10−7 → <b>633</b></li><li>10,000 − 2,846 → <b>7,154</b></li><li>1,000 − 370: apply it to 37 against 100 (→ 63) and keep the 0 → <b>630</b></li></ul>
        <p><b>Use it for change:</b> £20 − £7.36 = £12.64 (the pence: 100 − 36 = 64).</p>`,
      gen: () => {
        const big = R.pick([1000, 10000]), len = big === 1000 ? 3 : 4;
        let n;
        do n = R.int(10 ** (len - 1), big - 1); while (n % 10 === 0);
        const ds = digits(n), out = ds.map((x, i) => (i === ds.length - 1 ? 10 - x : 9 - x)).join('');
        return { q: `${c(big)} − ${c(n)}`, a: big - n, tol: EXACT, sol: `${ds.map((x, i) => (i === ds.length - 1 ? `10−${x}` : `9−${x}`)).join(' | ')} → <b>${c(+out)}</b>` };
      },
    },
    {
      id: 'left-to-right-adding', group: 'Addition & subtraction', title: 'Adding decimals left to right',
      tagline: 'Wholes first, then the pence.',
      body: `<p><b>Rule.</b> Add the whole numbers, then the decimal parts as if they were pence, then combine. Your running total is always nearly right.</p>
        <ul class="examples"><li>47.86 + 38.57: 47 + 38 = 85; 86p + 57p = £1.43 → <b>86.43</b></li><li>63.25 − 18.70: 63 − 18 = 45; 25p − 70p = −45p → <b>44.55</b></li></ul>`,
      gen: () => {
        const a = R.float(10, 99, 2), b = R.float(10, 99, 2), add = Math.random() < 0.6;
        const [x, y] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
        const w = Math.trunc(x) + (add ? 1 : -1) * Math.trunc(y), p = r((x % 1) + (add ? 1 : -1) * (y % 1), 2);
        const ans = r(add ? x + y : x - y, 2);
        return { q: `${x.toFixed(2)} ${add ? '+' : '−'} ${y.toFixed(2)}`, a: ans, tol: EXACT, sol: `Wholes: ${w}; decimals: ${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)} → <b>${ans.toFixed(2)}</b>` };
      },
    },

    // ----------------------------------------------------------- division & fractions
    {
      id: 'divide-5-25-125', group: 'Division & fractions', title: '÷ 5, ÷ 25, ÷ 125',
      tagline: 'Double, quadruple or ×8, then shift the decimal.',
      body: `<p><b>Rule.</b> ÷ 5 = × 2 ÷ 10. ÷ 25 = × 4 ÷ 100. ÷ 125 = × 8 ÷ 1,000.</p>
        <ul class="examples"><li>435 ÷ 5 = 870 ÷ 10 = <b>87</b></li><li>1,350 ÷ 25 = 5,400 ÷ 100 = <b>54</b></li><li>3,000 ÷ 125 = 24,000 ÷ 1,000 = <b>24</b></li><li>73 ÷ 25 = 292 ÷ 100 = <b>2.92</b></li></ul>`,
      gen: () => {
        const [m, k, p] = R.pick([[5, 2, 10], [25, 4, 100], [125, 8, 1000]]);
        const n = R.int(m === 125 ? 10 : 20, m === 5 ? 999 : 2000);
        return { q: `${c(n)} ÷ ${m}`, a: (n * k) / p, tol: EXACT, sol: `${c(n)} × ${k} ÷ ${c(p)} = ${c(n * k)} ÷ ${c(p)} = <b>${f((n * k) / p)}</b>` };
      },
    },
    {
      id: 'fraction-decimals', group: 'Division & fractions', title: 'Fractions as decimals',
      tagline: 'Sevenths cycle 142857; elevenths are 9 × n repeating.',
      body: `<p>Learn the patterns instead of dividing:</p>
        <ul class="examples">
          <li><b>Sevenths</b> cycle through 142857: 1/7 = 0.142857…, 2/7 = 0.285714…, 3/7 = 0.428571…, each starting at a different point.</li>
          <li><b>Ninths</b> repeat the numerator: 5/9 = 0.555…</li>
          <li><b>Elevenths</b> repeat 9 × numerator: 3/11 = 0.2727…, 5/11 = 0.4545…</li>
          <li><b>Eighths</b> step by 0.125: 3/8 = 0.375, 5/8 = 0.625, 7/8 = 0.875.</li>
          <li><b>Sixths and twelfths:</b> 1/6 = 0.1666…, 5/6 = 0.8333…, 1/12 = 0.0833…, 5/12 = 0.41666…</li>
          <li><b>Sixteenths:</b> 1/16 = 0.0625, so 3/16 = 0.1875.</li>
        </ul>`,
      gen: () => {
        const d = R.pick([7, 8, 9, 11, 12, 16, 6]);
        let n = R.int(1, d - 1);
        while (QT.m.gcd(n, d) !== 1) n = R.int(1, d - 1);
        const how = {
          7: `sevenths cycle 142857; ${n}/7 starts at "${String(Math.round((n / 7) * 1e6)).padStart(6, '0').slice(0, 2)}"`,
          8: `eighths step by 0.125: ${n} × 0.125`,
          9: `ninths repeat the numerator`,
          11: `elevenths repeat 9 × ${n} = ${String(9 * n).padStart(2, '0')}`,
          12: `${n}/12 = ${n}/3 ÷ 4`,
          16: `1/16 = 0.0625, × ${n}`,
          6: `${n}/6 = ${n}/2 ÷ 3`,
        }[d];
        return { q: `${n}/${d} as a decimal (3 dp)`, a: r(n / d, 3), tol: DP3, sol: `${how} → <b>${(n / d).toFixed(3)}</b>` };
      },
    },
    {
      id: 'missing-operand', group: 'Division & fractions', title: 'Missing-number questions',
      tagline: '66 × ? = 138.6 → 138.6 ÷ 66.',
      body: `<p><b>Rule.</b> Undo the operation (× ↔ ÷, + ↔ −), <b>estimate first</b>, then refine.</p>
        <ul class="examples"><li>66 × ? = 138.6 → about 140 ÷ 70 = 2. Then 66 × 2 = 132, leaving 6.6 = 66 × 0.1 → <b>2.1</b></li><li>? + 238 = 705 → 705 − 238 = <b>467</b></li><li>? ÷ 7 = 13.5 → 13.5 × 7 = <b>94.5</b></li></ul>
        <p>These are reported to appear in the 80-in-8. Check by plugging your answer back in.</p>`,
      gen: () => {
        const kind = R.pick(['mul', 'add', 'div']);
        if (kind === 'mul') {
          const a = R.int(12, 99), x = R.float(1.1, 9.9, 1), prod = r(a * x, 2), whole = Math.floor(x);
          return { q: `${a} × ? = ${prod}`, a: x, tol: EXACT, sol: `? = ${prod} ÷ ${a}. ${a} × ${whole} = ${a * whole}, leaving ${r(prod - a * whole, 2)} = ${a} × ${r(x - whole, 1)} → <b>${x}</b>` };
        }
        if (kind === 'add') {
          const x = R.int(100, 999), b = R.int(100, 999);
          return { q: `? + ${b} = ${c(x + b)}`, a: x, tol: EXACT, sol: `${c(x + b)} − ${b} = <b>${x}</b>` };
        }
        const k = R.int(3, 9), q = R.pick([R.int(11, 40), R.float(10, 30, 1)]);
        return { q: `? ÷ ${k} = ${q}`, a: r(q * k, 2), tol: EXACT, sol: `${q} × ${k} = <b>${f(r(q * k, 2))}</b>` };
      },
    },

    // ----------------------------------------------------------- percentages
    {
      id: 'percentages', group: 'Percentages', title: 'Percentage shortcuts',
      tagline: 'x% of y = y% of x; build from 10% and 5%.',
      body: `<ul class="examples">
          <li><b>Swap:</b> x% of y = y% of x. So 16% of 25 = 25% of 16 = <b>4</b>.</li>
          <li><b>Build from pieces:</b> 10% shifts the decimal, 5% is half of that, 1% shifts twice. 15% of 340 = 34 + 17 = <b>51</b>; 35% of 80 = 24 + 4 = <b>28</b>.</li>
          <li><b>Fractions:</b> 12.5% = ⅛, 37.5% = ⅜, 33⅓% = ⅓, 20% = ⅕, 75% = ¾.</li>
          <li><b>Chained changes multiply:</b> +20% then −20% is 1.2 × 0.8 = 0.96, a 4% fall, not zero.</li>
        </ul>`,
      gen: () => {
        const kind = R.pick(['swap', 'pieces', 'fraction', 'chain']);
        if (kind === 'swap') {
          const x = R.pick([4, 8, 12, 16, 24, 32, 36, 44]), y = R.pick([25, 50, 75]);
          return { q: `${x}% of ${y}`, a: (x * y) / 100, tol: EXACT, sol: `${y}% of ${x} = ${f((x * y) / 100)}, much easier → <b>${f((x * y) / 100)}</b>` };
        }
        if (kind === 'pieces') {
          const p = R.pick([15, 35, 45, 55, 65]), y = R.int(4, 90) * 10, tens = Math.floor(p / 10);
          return { q: `${p}% of ${y}`, a: (p * y) / 100, tol: EXACT, sol: `${tens}0% = ${f((tens * y) / 10)}, 5% = ${f(y / 20)} → <b>${f((p * y) / 100)}</b>` };
        }
        if (kind === 'fraction') {
          const [p, frac, d] = R.pick([[12.5, '⅛', 8], [37.5, '⅜', 8], [62.5, '⅝', 8], [87.5, '⅞', 8], [20, '⅕', 5], [75, '¾', 4]]);
          const y = d * R.int(4, 40), num = (p * y) / 100;
          return { q: `${p}% of ${y}`, a: num, tol: EXACT, sol: `${p}% = ${frac}: ${y} ÷ ${d} × ${Math.round((p / 100) * d)} = <b>${f(num)}</b>` };
        }
        const up = R.pick([10, 20, 25, 50]), down = R.pick([10, 20, 25, 50]), final = 100 * (1 + up / 100) * (1 - down / 100);
        return { q: `100, then +${up}%, then −${down}%. Final value?`, a: final, tol: EXACT, sol: `Multiply: 100 × ${1 + up / 100} × ${1 - down / 100} = <b>${f(final)}</b>` };
      },
    },

    // ----------------------------------------------------------- checking & test tactics
    {
      id: 'last-digit', group: 'Checking & test tactics', title: 'Last-digit check',
      tagline: 'Eliminate options in a second.',
      body: `<p><b>Rule.</b> The last digit of a sum or product depends only on the last digits of the inputs.</p>
        <ul class="examples"><li>387 × 64 ends in 8, because 7 × 4 = 2<b>8</b>.</li><li>456 + 789 ends in 5, because 6 + 9 = 1<b>5</b>.</li></ul>
        <p><b>In multiple choice</b> this often rules out two or three options instantly. Combine it with a rough size estimate and you rarely need the full calculation.</p>`,
      gen: () => {
        const a = R.int(101, 999), b = R.int(12, 99), add = Math.random() < 0.3;
        const res = add ? a + b : a * b, la = a % 10, lb = b % 10;
        return { q: `Last digit of ${a} ${add ? '+' : '×'} ${b}?`, a: res % 10, tol: EXACT, sol: `${la} ${add ? '+' : '×'} ${lb} = ${add ? la + lb : la * lb} → last digit <b>${res % 10}</b> (full answer ${c(res)})` };
      },
    },
    {
      id: 'digital-roots', group: 'Checking & test tactics', title: 'Casting out nines',
      tagline: 'A one-digit fingerprint that catches most slips.',
      body: `<p><b>Digital root:</b> add the digits, repeat until one digit is left (for multiples of 9 it is 9). For a product, the digital root of the answer equals the digital root of the product of the inputs' digital roots.</p>
        <ul class="examples"><li>Check 47 × 36 = 1,692: 47 → 11 → 2, 36 → 9, 2 × 9 = 18 → 9. 1,692 → 18 → 9 ✓</li><li>A claimed 47 × 36 = 1,682 → 17 → 8 ✗, so it's wrong.</li></ul>
        <p><b>Limits:</b> it can't catch swapped digits (1,692 vs 1,962) or answers off by a multiple of 9.</p>`,
      gen: () => {
        const a = R.int(12, 99), b = R.int(12, 99), ra = droot(a), rb = droot(b), rr = droot(ra * rb);
        return { q: `Digital root of ${a} × ${b}?`, a: rr, tol: EXACT, sol: `${a} → ${ra}, ${b} → ${rb}; ${ra} × ${rb} = ${ra * rb} → <b>${rr}</b>. Check: ${c(a * b)} → ${droot(a * b)}` };
      },
    },
    {
      id: 'estimation', group: 'Checking & test tactics', title: 'Estimating fast',
      tagline: 'One or two significant figures, and know which way you rounded.',
      body: `<p><b>Rule.</b> Round each number to one or two significant figures and keep track of the direction you rounded, so you know whether your estimate is high or low.</p>
        <ul class="examples"><li>487 × 0.62 ≈ 500 × 0.6 = 300 (true 301.94)</li><li>7,940 ÷ 39 ≈ 8,000 ÷ 40 = 200 (true 203.6)</li></ul>
        <p><b>Practice target:</b> within 5% in a few seconds. In multiple choice, estimate + last digit usually identifies the answer.</p>`,
      gen: () => {
        const kind = R.pick(['mul', 'div']);
        if (kind === 'mul') {
          const a = R.int(120, 980), b = R.float(0.11, 0.98, 2), ans = a * b;
          return { q: `Estimate ${a} × ${b} (within 5%)`, a: ans, tol: { abs: 0, rel: 0.05 }, sol: `≈ ${Math.round(a / 10) * 10} × ${r(b, 1)} = ${f(Math.round(a / 10) * 10 * r(b, 1))}; exact <b>${f(ans)}</b>` };
        }
        const a = R.int(1200, 9800), b = R.int(19, 89), ans = a / b;
        return { q: `Estimate ${c(a)} ÷ ${b} (within 5%)`, a: ans, tol: { abs: 0, rel: 0.05 }, sol: `≈ ${c(Math.round(a / 100) * 100)} ÷ ${Math.round(b / 10) * 10} = ${f((Math.round(a / 100) * 100) / (Math.round(b / 10) * 10))}; exact <b>${f(ans)}</b>` };
      },
    },
    {
      id: 'guessing-strategy', group: 'Checking & test tactics', title: 'When to guess (negative marking)',
      tagline: 'A blind guess costs you 0.5 points on average.',
      body: `<p>With +1 for right and −1 for wrong, guessing among k options is worth (1/k)(+1) + ((k−1)/k)(−1) = (2 − k)/k.</p>
        <ul class="examples"><li>Blind guess (4 options): <b>−0.5</b>, so never.</li><li>Eliminated one (3 left): −⅓</li><li>Eliminated two (2 left): <b>0</b>, break-even</li><li>Eliminated three: +1</li></ul>
        <p><b>So:</b> use last-digit and size checks to eliminate options, and only commit when you're down to two. Pace yourself: 80 questions in 8 minutes is 6 seconds each, so bank the easy points first.</p>`,
      gen: () => {
        const k = R.int(1, 4);
        return { q: `+1 right, −1 wrong. Expected score of guessing among ${k} remaining option${k > 1 ? 's' : ''}?`, a: (2 - k) / k, tol: { abs: 0.01, rel: 0 }, sol: `(1/${k})(+1) + (${k - 1}/${k})(−1) = (2 − ${k})/${k} = <b>${f((2 - k) / k)}</b>` };
      },
    },

    // ----------------------------------------------------------- know by heart
    {
      id: 'know-by-heart', group: 'Know by heart', title: 'Numbers worth memorising',
      tagline: 'Squares to 30, powers of 2, key roots and constants.',
      body: `<p>Recall beats calculation. Worth knowing cold:</p>
        <ul class="examples">
          <li><b>Squares 11–30:</b> 13² = 169, 17² = 289, 19² = 361, 23² = 529, 27² = 729, 29² = 841</li>
          <li><b>Powers of 2:</b> 2¹⁰ = 1,024 (≈ 10³), 2¹² = 4,096, 2¹⁶ = 65,536, 2²⁰ ≈ 1.05 million</li>
          <li><b>Cubes:</b> 7³ = 343, 8³ = 512, 9³ = 729, 12³ = 1,728</li>
          <li><b>Roots and constants:</b> √2 ≈ 1.414, √3 ≈ 1.732, √5 ≈ 2.236, π ≈ 3.1416, e ≈ 2.718, ln 2 ≈ 0.693, ln 10 ≈ 2.303</li>
          <li><b>Trading:</b> √252 ≈ 15.87 (daily → annual volatility), 1.645 and 1.96 (90% and 95% two-sided z)</li>
        </ul>`,
      gen: () => {
        const kind = R.pick(['sq', 'sq', 'pow2', 'cube', 'const']);
        if (kind === 'sq') { const n = R.int(11, 30); return { q: `${n}²`, a: n * n, tol: EXACT, sol: `<b>${n * n}</b>` }; }
        if (kind === 'pow2') { const n = R.int(6, 16); return { q: `2^${n}`, a: 2 ** n, tol: EXACT, sol: `<b>${c(2 ** n)}</b>${n >= 10 ? ` (2¹⁰ = 1,024, then double ${n - 10} more time${n - 10 === 1 ? '' : 's'})` : ''}` }; }
        if (kind === 'cube') { const n = R.int(2, 12); return { q: `${n}³`, a: n ** 3, tol: EXACT, sol: `<b>${c(n ** 3)}</b>` }; }
        const [label, v] = R.pick([['√2', Math.SQRT2], ['√3', Math.sqrt(3)], ['√5', Math.sqrt(5)], ['π', Math.PI], ['e', Math.E], ['ln 2', Math.LN2], ['ln 10', Math.LN10], ['√252', Math.sqrt(252)]]);
        return { q: `${label} to 3 dp`, a: r(v, 3), tol: DP3, sol: `<b>${v.toFixed(3)}</b>` };
      },
    },
  ];

  const GROUPS = [...new Set(TRICKS.map((t) => t.group))];
  const byId = (id) => TRICKS.find((t) => t.id === id);
  const progress = (id) => QT.store.get().tricks?.[id];

  function list(el) {
    el.innerHTML = `
      <a class="back" href="#/mental">← Mental maths</a>
      <h1>Speed tricks</h1>
      <p class="lede">Short guides to the shortcuts strong candidates use in arithmetic screens, each with a 10-question drill. Learn one or two a day, then use them in the <a href="#/mental">80-in-8</a>.</p>
      ${GROUPS.map((g) => `
        <h2>${g}</h2>
        <div class="grid">${TRICKS.filter((t) => t.group === g).map((t) => {
          const p = progress(t.id);
          return `<a class="card topic-card" href="#/tricks/${t.id}"><h3>${t.title}</h3><div class="small">${t.tagline}</div>
            <div class="meta" style="margin-top:10px"><span>${p ? `best ${p.best}/10` : 'not practised'}</span><span>${p && p.best >= 9 ? '✓' : ''}</span></div></a>`;
        }).join('')}</div>`).join('')}`;
  }

  function lesson(el, id) {
    const t = byId(id);
    if (!t) return list(el);
    const i = TRICKS.indexOf(t), next = TRICKS[(i + 1) % TRICKS.length], p = progress(t.id);
    el.innerHTML = `
      <a class="back" href="#/tricks">← Speed tricks</a>
      <div class="small mono">${t.group}</div>
      <h1>${t.title}</h1>
      <div class="card lesson">${t.body}</div>
      <h2>Practise it${p ? ` <span class="small">best so far ${p.best}/10</span>` : ''}</h2>
      <div id="qbox"></div>
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/tricks/${next.id}">Next: ${next.title} →</a></div>`;
    let k = 0;
    const source = () => (k++ < 10 ? { tag: `${t.title} · ${k}/10`, p: t.gen(), practiceOnly: true, record: () => {} } : null);
    QT.ui.questionCard(el.querySelector('#qbox'), source, (box, res) => {
      const st = QT.store.get(), rec = ((st.tricks ||= {})[t.id] ||= { best: 0, runs: 0 });
      rec.best = Math.max(rec.best, res.right);
      rec.runs++;
      QT.store.touchDay();
      QT.store.save();
      box.innerHTML = `<div class="card"><h3>${res.right}/10${res.right === 10 ? ': perfect' : ''}</h3>
        <p class="small">${res.right >= 9 ? 'You have it. Now use it under time pressure in the 80-in-8.' : 'Reread the worked examples above, then go again. Speed comes once the method is automatic.'}</p>
        <div class="row"><button id="again">Another 10</button><a class="btn ghost" href="#/tricks/${next.id}">Next trick →</a></div></div>`;
      box.querySelector('#again').addEventListener('click', () => QT.route());
    });
  }

  QT.tricks = TRICKS;
  QT.views = Object.assign(QT.views || {}, { tricks: (el, id) => (id ? lesson(el, id) : list(el)) });
})();
