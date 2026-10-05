// Fast methods for the mental-maths question types. For any generated question, `fastWay` picks
// the shortcut that answers it quickest and works it through on that question's own numbers,
// and names the speed-trick guide that teaches it. Used by the end-of-session review of slow
// and missed questions. Each method computes its own answer, which the tests compare with the
// question's answer, so a wrong worked method can't ship.
(function () {
  const r2 = (x) => Math.round(x * 100) / 100;
  const n = (x) => String(r2(x));
  const b = (x) => `<b>${n(x)}</b>`;

  const KINDS = {
    mul2: { label: '2-digit × 2-digit' },
    mul31: { label: '3-digit × 1-digit' },
    addDec: { label: 'Adding decimals' },
    subDec: { label: 'Subtracting decimals' },
    div: { label: 'Division' },
    frac: { label: 'Fractions to decimals' },
    pct: { label: 'Percentages' },
    sq: { label: 'Squares' },
    decMul: { label: 'Decimal × whole number' },
    sub3: { label: '3-digit subtraction' },
    missMul: { label: 'Missing factor' },
    missAdd: { label: 'Missing number (addition)' },
  };

  // Each method returns { name, guide, steps (HTML), value }.
  function square(x) {
    if (x % 10 === 5) {
      const t = (x - 5) / 10;
      return { name: 'Squares ending in 5', guide: 'square-ending-5', value: x * x, steps: `Take the tens digit ${t}, multiply by the next number: ${t} × ${t + 1} = ${t * (t + 1)}, then write 25 after it: ${b(x * x)}.` };
    }
    const R = Math.round(x / 10) * 10, d = Math.abs(x - R), lo = x - d, hi = x + d;
    return { name: 'Square via a round number', guide: 'difference-of-squares', value: lo * hi + d * d, steps: `${x}² = (${x} − ${d})(${x} + ${d}) + ${d}² = ${lo} × ${hi} + ${d * d} = ${lo * hi} + ${d * d} = ${b(lo * hi + d * d)}. One factor is a round number, so the product is easy.` };
  }

  // a − c the fast way: just under a hundred → round up and add back; otherwise take away the
  // hundreds, then the rest.
  function subtract(a, c) {
    const R = Math.ceil(c / 100) * 100, H = Math.floor(c / 100) * 100, rest = c - H;
    if (R - c > 0 && R - c <= 20 && a >= R) return { name: 'Round and compensate', guide: 'round-and-compensate', value: a - c, steps: `Round ${c} up to ${R}: ${a} − ${R} = ${a - R}. You took away ${R - c} too many, so add them back: ${b(a - c)}.` };
    if (!rest || !H) return { name: 'Subtract in one go', guide: 'complements', value: a - c, steps: `${a} − ${c} = ${b(a - c)}.` };
    return { name: 'Subtract in chunks', guide: 'complements', value: a - c, steps: `Take away the hundreds, then the rest: ${a} − ${H} = ${a - H}, then − ${rest} = ${b(a - c)}.` };
  }

  const METHODS = {
    mul2([x, y]) {
      if (x === y) return square(x);
      const round10 = [x, y].find((v) => v % 10 === 0);
      if (round10) {
        const o = round10 === x ? y : x;
        return { name: 'Multiply by a round number', guide: 'split-left-to-right', value: o * round10, steps: `${o} × ${round10 / 10} = ${(o * round10) / 10}, then × 10: ${b(o * round10)}.` };
      }
      if (x >= 88 && y >= 88) {
        const p = 100 - x, q = 100 - y, v = (x - q) * 100 + p * q;
        return { name: 'Near 100', guide: 'near-100', value: v, steps: `${x} is ${p} under 100 and ${y} is ${q} under. Cross-subtract: ${x} − ${q} = ${x - q}, so ${x - q}00. Multiply the gaps: ${p} × ${q} = ${p * q}. Total ${b(v)}.` };
      }
      const diffSq = (maxGap) => {
        if ((x + y) % 2 || Math.abs(x - y) > 2 * maxGap) return null;
        const m = (x + y) / 2, d = Math.abs(x - y) / 2;
        return { name: 'Difference of squares', guide: 'difference-of-squares', value: m * m - d * d, steps: `${x} and ${y} sit ${d} either side of ${m}, so ${x} × ${y} = ${m}² − ${d}² = ${m * m} − ${d * d} = ${b(m * m - d * d)}.` };
      };
      const close = diffSq(3);
      if (close) return close;
      const near = [x, y].map((v) => ({ v, d: Math.round(v / 10) * 10 - v })).filter((o) => Math.abs(o.d) <= 2).sort((a, c) => Math.abs(a.d) - Math.abs(c.d))[0];
      if (near) {
        const o = near.v === x ? y : x, R = near.v + near.d;
        return { name: 'Round and compensate', guide: 'round-and-compensate', value: R * o - near.d * o, steps: `Round ${near.v} to ${R}: ${R} × ${o} = ${R * o}. That's ${Math.abs(near.d)} ${near.d > 0 ? 'too many' : 'too few'} lots of ${o}, so ${near.d > 0 ? 'take away' : 'add'} ${Math.abs(near.d) * o}: ${b(R * o - near.d * o)}.` };
      }
      const [f, e] = x % 10 === 5 && y % 2 === 0 ? [x, y] : y % 10 === 5 && x % 2 === 0 ? [y, x] : [];
      if (f && (e / 2) % 10 !== 0 && e / 2 < 30) return { name: 'Halve and double', guide: 'halve-and-double', value: 2 * f * (e / 2), steps: `Double ${f} and halve ${e}: ${2 * f} × ${e / 2} = ${b(2 * f * (e / 2))}. One side is now a round number.` };
      const wide = diffSq(8);
      if (wide) return wide;
      const [big, small] = x >= y ? [x, y] : [y, x], t = Math.floor(small / 10) * 10, u = small - t;
      return { name: 'Split and multiply', guide: 'split-left-to-right', value: big * t + big * u, steps: `Split ${small} into ${t} + ${u}: ${big} × ${t} = ${big * t} (${big} × ${t / 10}, then × 10), and ${big} × ${u} = ${big * u}. Add: ${b(big * t + big * u)}.` };
    },
    mul31([x, m]) {
      if (m === 5) return { name: '× 5 is × 10 ÷ 2', guide: 'times-5-25-125', value: (x * 10) / 2, steps: `${x} × 10 = ${x * 10}, halved: ${b((x * 10) / 2)}.` };
      if (m === 9) return { name: '× 9 is × 10 minus one', guide: 'times-9-11-99', value: x * 10 - x, steps: `${x} × 10 = ${x * 10}, minus ${x}: ${b(x * 10 - x)}.` };
      const parts = [Math.floor(x / 100) * 100, Math.floor((x % 100) / 10) * 10, x % 10].filter(Boolean);
      let run = 0;
      const sums = parts.map((v) => (run += v * m));
      return { name: 'Left to right', guide: 'split-left-to-right', value: x * m, steps: `${parts.map((v) => `${v} × ${m} = ${v * m}`).join(', ')}. Add as you go, biggest first: ${sums.slice(0, -1).join(' → ')}${sums.length > 1 ? ' → ' : ''}${b(x * m)}.` };
    },
    addDec([x, y]) {
      const cx = Math.round(x * 100), cy = Math.round(y * 100), W = Math.floor(cx / 100) + Math.floor(cy / 100), F = (cx % 100) + (cy % 100);
      return { name: 'Wholes, then decimals', guide: 'left-to-right-adding', value: (cx + cy) / 100, steps: `Wholes first: ${Math.floor(cx / 100)} + ${Math.floor(cy / 100)} = ${W}. Then the decimals: 0.${String(cx % 100).padStart(2, '0')} + 0.${String(cy % 100).padStart(2, '0')} = ${n(F / 100)}. Total ${b((cx + cy) / 100)}.` };
    },
    subDec([x, y]) {
      const B = Math.ceil(y), back = r2(B - y);
      if (!back) return { name: 'Wholes, then decimals', guide: 'left-to-right-adding', value: r2(x - y), steps: `${x} − ${y} = ${b(x - y)}: only the whole part changes.` };
      return { name: 'Subtract a whole number, then add back', guide: 'round-and-compensate', value: r2(x - B + back), steps: `Round ${y} up to ${B}: ${x} − ${B} = ${n(x - B)}. You took away ${back} too much, so add it back: ${b(x - B + back)}.` };
    },
    div([N, d]) {
      const k = N / d;
      if (d === 5) return { name: '÷ 5 is × 2 ÷ 10', guide: 'divide-5-25-125', value: (N * 2) / 10, steps: `${N} × 2 = ${N * 2}, ÷ 10 = ${b((N * 2) / 10)}.` };
      const kt = Math.floor(k / 10) * 10;
      return { name: 'Turn it into a multiplication', guide: 'missing-operand', value: kt + (N - d * kt) / d, steps: `Ask “${d} × what = ${N}?”. ${d} × ${kt} = ${d * kt}, leaving ${N - d * kt}, which is ${d} × ${(N - d * kt) / d}. So ${b(kt + (N - d * kt) / d)}.` };
    },
    frac([x, d]) {
      const v = Math.round((x / d) * 1000) / 1000, ans = `<b>${v}</b> to 3 dp`, dp4 = (y) => (Math.floor(y * 1e4) / 1e4).toFixed(4);
      const guide = 'fraction-decimals';
      if (d === 7) {
        const cyc = '142857', start = { 1: 0, 3: 1, 2: 2, 6: 3, 4: 4, 5: 5 }[x], digits = (cyc + cyc).slice(start, start + 6);
        return { name: 'Sevenths cycle', guide, value: v, steps: `Every seventh uses the digits 142857 in the same cycle. ${x}/7 is a little over ${x * 14}%, so start the cycle at ${digits[0]}: 0.${digits}… → ${ans}.` };
      }
      if (d === 9) return { name: 'Ninths repeat', guide, value: v, steps: `n/9 is the digit n repeated: ${x}/9 = 0.${String(x).repeat(4)}… → ${ans}.` };
      if (d === 11) return { name: 'Elevenths', guide, value: v, steps: `n/11 repeats the two digits of 9 × n: 9 × ${x} = ${String(9 * x).padStart(2, '0')}, so ${x}/11 = 0.${String(9 * x).padStart(2, '0').repeat(2)}… → ${ans}.` };
      if (d === 3) return { name: 'Thirds', guide: 'know-by-heart', value: v, steps: `1/3 = 0.333… and 2/3 = 0.666… → ${ans}.` };
      if (d === 6) return { name: 'Sixths are half of thirds', guide, value: v, steps: `${x}/6 is half of ${x}/3 = ${dp4(x / 3)}…, so ${dp4(x / 6)}… → ${ans}.` };
      if (d === 12) return { name: 'Twelfths are thirds ÷ 4', guide, value: v, steps: `${x}/12 is ${x}/3 ÷ 4 = ${dp4(x / 3)}… ÷ 4 = ${dp4(x / 12)}… → ${ans}.` };
      const unit = { 8: 0.125, 16: 0.0625 }[d];
      if (x === 1) return { name: 'Know the unit fraction', guide: 'know-by-heart', value: v, steps: `1/${d} = ${unit} → ${ans}. Worth knowing every 1/n up to 1/16 by heart.` };
      return { name: 'Know the unit fraction', guide: 'know-by-heart', value: v, steps: `1/${d} = ${unit}, so ${x}/${d} = ${x} × ${unit} = ${x * unit} → ${ans}.` };
    },
    pct([p, y]) {
      const ten = y / 10, v = r2((p * y) / 100);
      const how = {
        5: `10% is ${n(ten)}; halve it: ${b(v)}.`,
        12.5: `12.5% is 1/8: ${y} ÷ 2 ÷ 2 ÷ 2 = ${b(v)}.`,
        15: `10% is ${n(ten)}, 5% is half that, ${n(ten / 2)}. Add: ${b(v)}.`,
        20: `20% is 1/5: double ${n(ten)} (10%) = ${b(v)}.`,
        25: `25% is a quarter: ${y} ÷ 2 ÷ 2 = ${b(v)}.`,
        35: `10% is ${n(ten)}, so 30% is ${n(3 * ten)}; 5% is ${n(ten / 2)}. Add: ${b(v)}.`,
        40: `10% is ${n(ten)}; × 4 = ${b(v)}.`,
        60: `10% is ${n(ten)}; × 6 = ${b(v)}. (Or 100% − 40%.)`,
        75: `75% is three quarters: ${y} ÷ 4 = ${n(y / 4)}, × 3 = ${b(v)}.`,
        120: `120% is the whole plus a fifth: ${y} + ${n(y / 5)} = ${b(v)}.`,
      }[p];
      return { name: 'Build from 10% and simple fractions', guide: 'percentages', value: v, steps: how || `${p}% of ${y} = ${y}% of ${p} = ${b(v)}.` };
    },
    sq: ([x]) => square(x),
    decMul([x, m]) {
      const X = Math.round(x * 10);
      return { name: 'Drop the decimal point, then put it back', guide: 'split-left-to-right', value: (X * m) / 10, steps: `Ignore the point: ${X} × ${m} = ${X * m}. There was one decimal place, so put one back: ${b((X * m) / 10)}.` };
    },
    sub3([x, y]) {
      if (x >= y) return subtract(x, y);
      const inner = subtract(y, x);
      return { ...inner, value: x - y, steps: `The answer is negative: work out ${y} − ${x} and add the minus sign. ${inner.steps.replace(/<\/?b>/g, '')} So ${b(x - y)}.` };
    },
    missMul([x, c]) {
      const v = Math.round((c / x) * 10) / 10, w = Math.floor(v);
      return { name: 'Divide, whole part first', guide: 'missing-operand', value: v, steps: `? = ${c} ÷ ${x}. ${x} × ${w} = ${x * w}, leaving ${n(c - x * w)}, which is ${x} × ${n(v - w)}. So ${b(v)}.` };
    },
    missAdd([y, t]) {
      const m = subtract(t, y);
      return { ...m, steps: `? = ${t} − ${y}. ${m.steps}` };
    },
  };

  const fastWay = (item) => (METHODS[item.kind] ? METHODS[item.kind](item.v) : null);

  QT.mentalTips = { KINDS, fastWay };
})();
