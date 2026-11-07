// "60 in 6": practice for the arithmetic test Flow Traders sends first. The published format is 60
// multiple-choice questions in 6 minutes, +1 right, −1 wrong, 0 for questions you never reach,
// one question at a time with no skipping or going back, and no calculator. The question types and
// their mix follow that format and what candidates report: whole numbers, decimals, fractions,
// percentages and chained multiplication, often with the missing number on the left. Fraction
// options are often left unsimplified (2/4, 24/2), so you compare values, not looks. Questions
// are generated fresh every run; they are not copies of the real test.
(function () {
  const R = QT.rand, store = QT.store, esc = QT.escapeHtml, gcd = QT.m.gcd;
  const N = 60, SECS = 360, LIVE_KEY = 'qt-60in6-live';
  const rd = (x, dp = 9) => Math.round(x * 10 ** dp) / 10 ** dp;
  const dpOf = (x) => { const s = String(rd(x)); return s.includes('.') ? s.split('.')[1].length : 0; };
  // 5000 → "5,000"; decimals keep their digits.
  const fmt = (x) => {
    const v = rd(x), [i, f] = String(Math.abs(v)).split('.');
    return (v < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? `.${f}` : '');
  };

  // ---- options ----
  const num = (v) => ({ v: rd(v), label: fmt(v) });
  const sf = (n, d) => (d === 1 ? fmt(n) : `${n}/${d}`);
  const fr = (n, d) => ({ v: n / d, label: sf(n, d) }); // as written: 2/4 stays 2/4
  const low = (n, d) => { const g = gcd(n, d); return fr(n / g, d / g); };
  const mixed = (n, d) => { // lowest terms, "2 1/2" when over 1
    const g = gcd(n, d), a = n / g, b = d / g, w = Math.floor(a / b), r = a % b;
    return { v: a / b, label: !r ? fmt(w) : w ? `${w} ${r}/${b}` : `${r}/${b}` };
  };
  const near = (s, steps) => steps.flatMap((d) => [num(s + d), num(s - d)]);
  // Decimal options stay short; fraction options can be any value (7/18 is fine).
  const sane = (c) => Number.isFinite(c.v) && c.v >= 1e-4 && c.v < 1e8 && (c.label.includes('/') || dpOf(c.v) <= 5);

  // The right option plus three of the candidate slips (positive, a different value from the
  // answer and from each other, a label of their own), uniformly shuffled.
  function make(kind, q, right, cands, v, extra) {
    const labels = new Set([right.label]), vals = [right.v], wrong = [];
    const fits = (c) => sane(c) && !labels.has(c.label) && vals.every((x) => Math.abs(x - c.v) > 1e-9);
    const take = (c) => { labels.add(c.label); vals.push(c.v); wrong.push(c); };
    for (const c of R.shuffle(cands)) if (wrong.length < 3 && fits(c)) take(c);
    for (let k = 1; wrong.length < 3 && k < 500; k++) for (const c of [num(right.v + k), num(right.v * (1 + k / 10))]) if (wrong.length < 3 && fits(c)) take(c); // rarely needed
    const opts = R.shuffle([{ ...right, ok: true }, ...wrong.map((c) => ({ ...c, ok: false }))]);
    return { kind, q, a: right.v, al: right.label, opts, v, ...extra };
  }

  const digits2 = () => { let n; do n = R.int(11, 99); while (n % 10 === 0); return n; };

  // ---- question types ----
  const G = {
    ftAdd() {
      const [a, b] = R.pick([[R.int(12, 99), R.int(3, 9)], [R.int(12, 89), R.int(12, 89)], [R.int(101, 899), R.int(12, 99)], [R.int(101, 699), R.int(101, 399)]]);
      return make('ftAdd', `${fmt(a)} + ${fmt(b)} = ?`, num(a + b), near(a + b, [1, 2, 10, 100]), [a, b]);
    },
    ftSub() {
      const c = R.pick([R.int(30, 99), R.int(250, 999), R.int(250, 999)]);
      const x = c < 100 ? R.int(11, c - 6) : R.pick([R.int(12, 99), R.int(101, c - 60)]);
      return make('ftSub', `${fmt(c)} − ${fmt(x)} = ?`, num(c - x), near(c - x, [1, 2, 10, 100]), [c, x]);
    },
    // v = [m, p, t]: the answer is t − p (m 0), t + p (m 1) or p − t (m 2).
    ftMiss() {
      const big = R.int(0, 1), p = big ? R.int(101, 899) : R.int(12, 99), x = big ? R.int(12, 199) : R.int(13, 89), form = R.int(0, 3);
      if (form < 2) return make('ftMiss', form ? `${fmt(p)} + ? = ${fmt(p + x)}` : `? + ${fmt(p)} = ${fmt(p + x)}`, num(x), [num(2 * p + x), ...near(x, [1, 2, 10])], [0, p, p + x]);
      if (form === 2) return make('ftMiss', `? − ${fmt(p)} = ${fmt(x)}`, num(x + p), [num(Math.abs(p - x)), ...near(x + p, [1, 2, 10])], [1, p, x]);
      return make('ftMiss', `${fmt(p + x)} − ? = ${fmt(p)}`, num(x), [num(2 * p + x), ...near(x, [1, 2, 10])], [2, p + x, p]);
    },
    ftMul() {
      const a = R.int(13, 89), b = R.int(13, 89), s = a * b;
      return make('ftMul', `${a} × ${b} = ?`, num(s), [...near(s, [10, 20, 100]), num(s + a), num(s - a), num(s + b), num(s - b)], [a, b]);
    },
    ftMissMul() {
      const a = R.int(13, 89), k = R.int(3, 9);
      return make('ftMissMul', R.int(0, 1) ? `${a} × ? = ${fmt(a * k)}` : `? × ${a} = ${fmt(a * k)}`, num(k), near(k, [1, 2, 3]), [a * k, a]);
    },
    // Sums and differences of decimals with different numbers of places, sometimes with the
    // missing number on the left. Worked in whole units of 10^-D. v = [form, A, B, op, D]: the
    // answer is (A op B) / 10^D.
    ftDecAS() {
      for (;;) {
        const [dx, dy] = R.pick([[2, 3], [1, 2], [2, 2], [1, 3], [2, 1], [3, 2]]), D = Math.max(dx, dy), U = 10 ** D;
        const X = digits2() * 10 ** (D - dx), Y = digits2() * 10 ** (D - dy);
        if (X === Y) continue;
        const [h, l] = X > Y ? [X, Y] : [Y, X], f = (n) => fmt(n / U), form = R.int(0, 4);
        const [q, A, B, op, alt] = [
          [`${f(X)} + ${f(Y)} = ?`, X, Y, '+', null],
          [`${f(h)} − ${f(l)} = ?`, h, l, '−', null],
          [`? + ${f(Y)} = ${f(X + Y)}`, X + Y, Y, '−', X + 2 * Y],
          [`? − ${f(l)} = ${f(h - l)}`, h - l, l, '+', Math.abs(h - 2 * l)],
          [`${f(h)} − ? = ${f(h - l)}`, h, h - l, '−', 2 * h - l],
        ][form];
        const ans = op === '+' ? A + B : A - B;
        // The classic slip: lining the digits up on the right instead of at the point.
        const raw = (n) => { const [i, fp = ''] = f(n).split('.'); return [+(i + fp), fp.length]; };
        const [ai, ad] = raw(A), [bi, bd] = raw(B), mis = op === '+' ? ai + bi : ai - bi;
        const cands = [num(mis / 10 ** ad), num(mis / 10 ** bd), ...[U / 10, 10, 1, U].flatMap((d) => [num((ans + d) / U), num((ans - d) / U)])];
        if (alt) cands.push(num(alt / U));
        return make('ftDecAS', q, num(ans / U), cands, [form, A, B, op, D]);
      }
    },
    // Multiplying and dividing decimals, usually with a missing factor: x × b = c.
    // v = [form, x, b, c]; the answer is c for form 4, x otherwise.
    ftDecMD() {
      for (;;) {
        const m = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 25]), n = R.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18]);
        const e = R.int(-3, 2), g = R.int(-3, 1), x = rd(m * 10 ** e), b = rd(n * 10 ** g), c = rd(x * b);
        if (![x, b, c].every((y) => y >= 0.001 && y <= 20000 && dpOf(y) <= 4) || (e >= 0 && g >= 0)) continue;
        const form = R.int(0, 4);
        const q = [`${fmt(b)} × ? = ${fmt(c)}`, `? × ${fmt(b)} = ${fmt(c)}`, `${fmt(c)} ÷ ? = ${fmt(b)}`, `${fmt(c)} ÷ ${fmt(b)} = ?`, `${fmt(x)} × ${fmt(b)} = ?`][form];
        const ans = form === 4 ? c : x, cands = [10, 0.1, 100, 0.01].map((k) => num(ans * k));
        if (form === 4) cands.push(num((m + 1) * 10 ** e * b), num(x * (n + 1) * 10 ** g));
        else cands.push(num((m + 1) * 10 ** e), num((m - 1) * 10 ** e));
        if (form === 2) cands.push(num(c * b));
        return make('ftDecMD', q, num(ans), cands, [form, x, b, c]);
      }
    },
    // Two numbers with one decimal place, like 10.7 × 13.2. The options are close together, so
    // the last-digit check and a rough size settle it. v = [X, Y], the numbers × 10.
    ftDecProd() {
      const one = () => { let k; do k = R.int(101, 359); while (k % 10 === 0); return k; };
      const X = one(), Y = one(), x = X / 10, y = Y / 10, p = rd((X * Y) / 100);
      const cands = [num(p + x), num(p - x), num(p + y), num(p - y), num(Math.round(p / 10) * 10), num(rd(p * 1.05, 2)), num(rd(p * 0.95, 2)), num(p + 10), num(p - 10)];
      return make('ftDecProd', `${fmt(x)} × ${fmt(y)} = ?`, num(p), cands, [X, Y]);
    },
    // 0.6 × 70 × 5,000: digits, then zeros. v = [da, db, dc, zc].
    ftChain() {
      const da = R.int(2, 9), db = R.int(2, 9), [dc, zc] = R.pick([[5, 3], [5, 2], [2, 3], [3, 2], [4, 3], [25, 2], [5, 1], [2, 2], [25, 1]]);
      const c = dc * 10 ** zc, ans = da * db * dc * 10 ** zc, P = (k) => num(k * dc * 10 ** zc);
      return make('ftChain', `${fmt(da / 10)} × ${db * 10} × ${fmt(c)} = ?`, num(ans), [num(ans * 10), num(ans / 10), num(ans * 100), P((da + 1) * db), P((da - 1) * db), P(da * (db + 1)), P(da * (db - 1))], [da, db, dc, zc]);
    },
    // "36 is …% of 80". v = [X, Y].
    ftPct() {
      for (;;) {
        const Y = R.pick([20, 25, 40, 50, 60, 80, 120, 150, 200, 250, 300, 400]), p = R.int(4, 96), X = rd((p * Y) / 100);
        if (dpOf(X) > 1 || (p % 10 === 0 && R.int(0, 1))) continue;
        const cands = [1, 2, 3, 5, 10].flatMap((d) => [p + d, p - d]).filter((v) => v > 0 && v < 100).map((v) => ({ v, label: `${v}%` }));
        return make('ftPct', `${fmt(X)} is …% of ${fmt(Y)}`, { v: p, label: `${p}%` }, cands, [X, Y], { pct: true });
      }
    },
    // Adding and subtracting fractions. v[0] says which form; see the fast methods below.
    ftFracAS() {
      const form = R.int(0, 4);
      if (form <= 1) { // 12/32 + 15/16: one fraction is the other's family in disguise
        const d = R.pick([4, 6, 8, 9, 10, 12, 16, 18, 20]), m = R.int(2, 4), u0 = R.int(1, d - 1), w0 = R.int(1, d - 1);
        const minus = form === 1 && u0 !== w0, [u, w] = minus && u0 < w0 ? [w0, u0] : [u0, w0], sc = R.int(0, 1);
        const show = (k, s) => (s ? `${k * m}/${d * m}` : `${k}/${d}`), r = minus ? u - w : u + w;
        return make('ftFracAS', `${show(u, sc)} ${minus ? '−' : '+'} ${show(w, 1 - sc)} = ?`, fr(r, d), [1, 2, 3].flatMap((k) => [fr(r + k, d), fr(r - k, d)]), [0, u, w, d, m, sc, minus ? 1 : 0]);
      }
      if (form === 2) { // ? − 5/16 = 1/8
        const e = R.pick([2, 3, 4, 5, 6, 8]), k = R.int(2, 3), d = e * k, b = R.int(1, d - 1), c = R.int(1, e - 1), n = b + c * k;
        return make('ftFracAS', `? − ${b}/${d} = ${c}/${e}`, fr(n, d), [fr(n + 1, d), fr(n - 1, d), fr(n + 2, d), fr(n - 2, d), fr(Math.abs(c * k - b), d)], [1, b, d, c, e]);
      }
      if (form === 3) { // 7/9 − ? = 5/18
        for (;;) {
          const e = R.pick([3, 4, 5, 6, 9]), k = R.int(2, 3), d = e * k, a = R.int(1, e - 1), c = R.int(1, d - 1);
          if (a * k <= c) continue;
          const n = a * k - c;
          return make('ftFracAS', `${a}/${e} − ? = ${c}/${d}`, low(n, d), [low(a * k + c, d), low(n + 1, d), low(n + 2, d), low(Math.max(1, n - 1), d), low(c, d), fr(1, 2), fr(1, 3), fr(1, 4)], [2, a, e, c, d]);
        }
      }
      // 14/7 + 35/70 = 2 1/2
      const k = R.int(1, 4), s = R.int(3, 9), [n, dd] = R.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 3], [2, 3]]), t = R.int(2, 9);
      const A = `${k * s}/${s}`, B = `${n * t}/${dd * t}`;
      return make('ftFracAS', R.int(0, 1) ? `${A} + ${B} = ?` : `${B} + ${A} = ?`, mixed(k * dd + n, dd), [mixed((k - 1) * dd + n, dd), mixed((k + 1) * dd + n, dd), mixed(k * dd - n, dd), num(k), num(k + 1), mixed(n, dd)], [3, k, s, n, dd, t]);
    },
    // Multiplying and dividing with fractions.
    ftFracMD() {
      const form = R.int(0, 3), coprime = (lo, hi) => { for (;;) { const q = R.int(lo, hi), p = R.int(2, q - 1); if (gcd(p, q) === 1) return [p, q]; } };
      if (form === 0) { // 60 ÷ 10/13
        const [p, q] = coprime(3, 13), j = R.int(2, 9), Nn = p * j, ans = j * q;
        return make('ftFracMD', `${Nn} ÷ ${p}/${q} = ?`, num(ans), [mixed(Nn * p, q), num(ans + q), num(ans - q), num(ans + j), num(ans - j), num(Nn * q)], [0, Nn, p, q]);
      }
      if (form === 1) { // 5/6 × 12
        const [p, q] = coprime(3, 12), j = R.int(2, 9), Nn = q * j, ans = p * j;
        return make('ftFracMD', R.int(0, 1) ? `${p}/${q} × ${Nn} = ?` : `${Nn} × ${p}/${q} = ?`, num(ans), [low(Nn * q, p), fr((ans - 2) * q, q), num(ans + 1), num(ans - 1), num(ans + p), num(Nn * p)], [1, Nn, p, q]);
      }
      if (form === 2) { // 2/4 × ? = 6, answer shown as 24/2
        const [p0, q0] = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [5, 6]]), s = R.int(1, 2), j = R.int(2, 6), Nn = p0 * j, ans = q0 * j;
        const k = R.int(1, 2), lab = (v) => (k === 2 && Number.isInteger(v * 2) ? fr(v * 2, 2) : Number.isInteger(v) ? num(v) : mixed(Math.round(v * q0), q0));
        return make('ftFracMD', `${p0 * s}/${q0 * s} × ? = ${Nn}`, lab(ans), [lab(Nn), lab((Nn * p0) / q0), lab(ans + 1), lab(ans - 1), lab(ans + q0), lab(ans * 2)], [2, p0 * s, q0 * s, Nn]);
      }
      // 1/4 ÷ ? = 1/2
      const [ru, rw] = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 1], [3, 1], [3, 2], [4, 3]]), [c, d] = R.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [5, 6]]);
      const g = gcd(ru * c, rw * d), a = (ru * c) / g, b = (rw * d) / g;
      const right = R.int(0, 1) ? fr(ru * 2, rw * 2) : low(ru, rw);
      return make('ftFracMD', `${sf(a, b)} ÷ ? = ${c}/${d}`, right, [low(rw, ru), low(a * c, b * d), low(ru + 1, rw), low(ru, rw + 1), low(ru * 2, rw), low(ru, rw * 2)], [3, a, b, c, d]);
    },
  };

  // How often each type comes up, from the mix candidates report (about 47 in a full run of 60).
  const MIX = { ftAdd: 3, ftSub: 3, ftMiss: 4, ftMul: 2, ftMissMul: 2, ftDecAS: 6, ftDecMD: 7, ftDecProd: 4, ftChain: 2, ftPct: 4, ftFracAS: 5, ftFracMD: 5 };
  const BAG = Object.entries(MIX).flatMap(([k, w]) => Array(w).fill(k));
  const question = () => G[R.pick(BAG)]();

  // ---- fast methods, for the end-of-run review (mental-tips.js) ----
  const b = (x) => `<b>${x}</b>`;
  const UNIT = ['', 'tenths', 'hundredths', 'thousandths'];
  const KINDS = {
    ftAdd: { label: 'Adding whole numbers', guide: 'left-to-right-adding' },
    ftSub: { label: 'Subtracting whole numbers', guide: 'round-and-compensate' },
    ftMiss: { label: 'Missing number (+ and −)', guide: 'missing-operand' },
    ftMul: { label: 'Two 2-digit numbers multiplied', guide: 'split-left-to-right' },
    ftMissMul: { label: 'Missing whole-number factor', guide: 'missing-operand' },
    ftDecAS: { label: 'Adding and subtracting decimals', guide: 'left-to-right-adding' },
    ftDecMD: { label: 'Multiplying and dividing decimals', guide: 'decimal-places' },
    ftDecProd: { label: 'Decimal × decimal (like 10.7 × 13.2)', guide: 'decimal-places' },
    ftChain: { label: 'Chained multiplication', guide: 'decimal-places' },
    ftPct: { label: 'X is what % of Y', guide: 'percentages' },
    ftFracAS: { label: 'Adding and subtracting fractions', guide: 'fraction-arithmetic' },
    ftFracMD: { label: 'Multiplying and dividing fractions', guide: 'fraction-arithmetic' },
  };
  const tip = (kind, v) => QT.mentalTips.fastWay({ kind, v });
  const METHODS = {
    ftAdd: (v) => tip('zAdd', v),
    ftSub: (v) => tip('zSub', v),
    ftMul: (v) => tip('mul2', v),
    ftMissMul: (v) => tip('zDiv', v),
    ftMiss([m, p, t]) {
      const w = m === 0 ? tip('zSub', [t, p]) : m === 1 ? tip('zAdd', [t, p]) : tip('zSub', [p, t]);
      const undo = m === 0 ? `${fmt(t)} − ${fmt(p)}` : m === 1 ? `${fmt(t)} + ${fmt(p)}` : `${fmt(p)} − ${fmt(t)}`;
      return { ...w, guide: 'missing-operand', steps: `Undo it: ? = ${undo}. ${w.steps}` };
    },
    ftDecAS([form, A, B, op, D]) {
      const U = 10 ** D, r = op === '+' ? A + B : A - B, pad = (n) => (n / U).toFixed(D);
      return { name: 'Line up the decimal points', guide: 'left-to-right-adding', value: r / U, steps: `${form >= 2 ? `Undo it: ? = ${fmt(A / U)} ${op} ${fmt(B / U)}. ` : ''}Give both the same number of places: ${pad(A)} ${op} ${pad(B)}. In ${UNIT[D]} that's ${A} ${op} ${B} = ${r}, so ${b(fmt(r / U))}.` };
    },
    ftDecMD([form, x, bb, c]) {
      if (form === 4) {
        const dx = dpOf(x), db = dpOf(bb), X = Math.round(x * 10 ** dx), B = Math.round(bb * 10 ** db), v = rd((X * B) / 10 ** (dx + db));
        return { name: 'Digits first, then the point', guide: 'decimal-places', value: v, steps: `Ignore the points: ${fmt(X)} × ${fmt(B)} = ${fmt(X * B)}. The two numbers have ${dx + db} decimal place${dx + db === 1 ? '' : 's'} between them, so the answer does too: ${b(fmt(v))}.` };
      }
      const k = dpOf(bb), s = 10 ** k, C = rd(c * s), B = rd(bb * s), v = rd(C / B);
      return { name: 'Divide by a whole number', guide: 'decimal-places', value: v, steps: `${form === 3 ? '' : `? = ${fmt(c)} ÷ ${fmt(bb)}. `}${k ? `Move both points ${k} place${k > 1 ? 's' : ''} right so you divide by a whole number: ` : ''}${fmt(C)} ÷ ${fmt(B)} = ${b(fmt(v))}.` };
    },
    ftDecProd([X, Y]) {
      const [S, B] = X <= Y ? [X, Y] : [Y, X], w = Math.floor(S / 10), t = S % 10, big = B / 10, p1 = rd(w * big), p2 = rd((t * B) / 100), v = rd(p1 + p2), ld = ((X % 10) * (Y % 10)) % 10;
      return { name: 'Split off the whole part', guide: 'decimal-places', value: v, steps: `${fmt(S / 10)} = ${w} + 0.${t}. ${w} × ${fmt(big)} = ${fmt(p1)}, and 0.${t} × ${fmt(big)} = ${fmt(p2)}. Add: ${b(fmt(v))}. Faster in multiple choice: ${X % 10} × ${Y % 10} ends in ${ld}, so the second decimal place is ${ld}; that and the size (about ${Math.round(S / 10)} × ${Math.round(big)} = ${Math.round(S / 10) * Math.round(big)}) usually leave one option.` };
    },
    ftChain([da, db, dc, zc]) {
      const P = da * db * dc, v = P * 10 ** zc;
      return { name: 'Digits, then zeros', guide: 'decimal-places', value: v, steps: `Multiply the digits: ${da} × ${db} × ${dc} = ${P}. Now the zeros: 0.${da} takes one off, ${db * 10} adds one and ${fmt(dc * 10 ** zc)} adds ${zc}, so ${zc} in all: ${b(fmt(v))}.` };
    },
    ftPct([X, Y]) {
      const ten = Y / 10, k = rd(X / ten), v = rd(k * 10);
      return { name: 'Count the 10%s', guide: 'percentages', value: v, steps: `10% of ${fmt(Y)} is ${fmt(ten)}. ${fmt(X)} is ${fmt(k)} lots of ${fmt(ten)}, so ${b(`${fmt(v)}%`)}.` };
    },
    ftFracAS(v) {
      const guide = 'fraction-arithmetic';
      if (v[0] === 0) {
        const [, u, w, d, m, sc, minus] = v, op = minus ? '−' : '+', r = minus ? u - w : u + w, sk = sc ? u : w;
        return { name: 'Cancel to the same bottom', guide, value: r / d, steps: `${sk * m}/${d * m} = ${sk}/${d} (divide top and bottom by ${m}). Then ${u}/${d} ${op} ${w}/${d} = ${b(`${r}/${d}`)}.` };
      }
      if (v[0] === 1) {
        const [, bb, d, c, e] = v, k = d / e, n = bb + c * k;
        return { name: 'Undo it over one bottom', guide, value: n / d, steps: `${c}/${e} = ${c * k}/${d}. Undo the subtraction: ? = ${c * k}/${d} + ${bb}/${d} = ${b(`${n}/${d}`)}.` };
      }
      if (v[0] === 2) {
        const [, a, e, c, d] = v, k = d / e, n = a * k - c, l = low(n, d);
        return { name: 'Undo it over one bottom', guide, value: n / d, steps: `${a}/${e} = ${a * k}/${d}, so ? = ${a * k}/${d} − ${c}/${d} = ${n}/${d}${l.label !== `${n}/${d}` ? ` = ${b(l.label)}` : ''}.` };
      }
      const [, k, s, n, dd, t] = v, m = mixed(k * dd + n, dd);
      return { name: 'Simplify each one first', guide, value: m.v, steps: `${k * s}/${s} = ${k} and ${n * t}/${dd * t} = ${n}/${dd} (cancel ${t}), so ${b(m.label)}.` };
    },
    ftFracMD(v) {
      const guide = 'fraction-arithmetic';
      if (v[0] === 0) { const [, Nn, p, q] = v; return { name: 'Flip and multiply', guide, value: (Nn / p) * q, steps: `Dividing by ${p}/${q} is multiplying by ${q}/${p}: ${Nn} ÷ ${p} = ${Nn / p}, then × ${q} = ${b(fmt((Nn / p) * q))}.` }; }
      if (v[0] === 1) { const [, Nn, p, q] = v; return { name: 'Divide first, then multiply', guide, value: (Nn / q) * p, steps: `${Nn} ÷ ${q} = ${Nn / q}, then × ${p} = ${b(fmt((Nn / q) * p))}.` }; }
      if (v[0] === 2) { const [, P, Q, Nn] = v, val = (Nn * Q) / P; return { name: 'Flip and multiply', guide, value: val, steps: `? = ${Nn} ÷ ${P}/${Q} = ${Nn} × ${Q}/${P} = ${b(fmt(val))}. The options may show it unsimplified (${fmt(val * 2)}/2 is the same number).` }; }
      const [, a, bb, c, d] = v, l = low(a * d, bb * c);
      const raw = `${a * d}/${bb * c}`;
      return { name: 'Flip and multiply', guide, value: l.v, steps: `? = ${sf(a, bb)} ÷ ${c}/${d} = ${sf(a, bb)} × ${d}/${c} = ${l.label === raw ? b(raw) : `${raw} = ${b(l.label)}`}. Match the options by value: the right one may be written unsimplified.` };
    },
  };
  QT.mentalTips.add(KINDS, METHODS);

  // ---- the test ----
  // Stacked fractions for display: "2 1/2" and "15/16" in already-escaped text.
  const pretty = (s) => esc(s)
    .replace(/(\d+) (\d+)\/(\d+)/g, '$1<span class="fr"><span>$2</span><span>$3</span></span>')
    .replace(/(\d+)\/(\d+)/g, '<span class="fr"><span>$1</span><span>$2</span></span>');
  const liveOn = () => { try { return localStorage.getItem(LIVE_KEY) !== 'off'; } catch { return true; } };

  function render(el) {
    const rec = store.get().mental.ft60, live = liveOn();
    el.innerHTML = `
      <a class="back" href="#/mental">← Mental maths</a>
      <h1>60 in 6</h1>
      <p class="lede">Practice for the arithmetic test Flow Traders sends first: 60 multiple-choice questions in 6 minutes, about 6 seconds each.</p>
      <div class="card">
        <h3>The rules</h3>
        <ul class="small">
          <li><b>+1</b> for a right answer, <b>−1</b> for a wrong one, <b>0</b> for any you don't reach.</li>
          <li>One question at a time: no skipping and no going back. No calculator; paper is fine.</li>
          <li>Whole numbers, decimals, fractions and percentages, often with the missing number on the left (<span class="mono">? × 0.12 = 18</span>). Fraction options can be unsimplified, so <span class="mono">24/2</span> may be the right answer to a question whose answer is 12.</li>
          <li>A blind guess loses half a point on average. Get it down to two options before you commit; with no skip button, a hard question is better worked on than guessed.</li>
        </ul>
        <p class="small">No pass mark is published. Candidates who went through report scores in the 50s, so treat <b>50+ net</b> as the practice target. These questions are generated in the reported style; they are not the real test.</p>
        <p class="small">Best: <b>${rec?.best ?? '–'}</b> net${rec?.runs?.length ? ` · ${rec.runs.length} run${rec.runs.length > 1 ? 's' : ''}` : ''}</p>
        <label class="check"><input type="checkbox" id="ft-live" ${live ? 'checked' : ''}> Show the live score and right/wrong flashes</label>
        <div class="row" style="margin-top:12px"><button id="ft-start">Start</button></div>
      </div>`;
    el.querySelector('#ft-live').addEventListener('change', (e) => { try { localStorage.setItem(LIVE_KEY, e.target.checked ? 'on' : 'off'); } catch { /* storage blocked */ } });
    el.querySelector('#ft-start').addEventListener('click', () => run(el));
  }

  function run(el) {
    const live = liveOn(), end = Date.now() + SECS * 1000, answered = [], at3 = { n: null };
    let cur, n = 0, correct = 0, wrong = 0, done = false, shownAt = 0;
    el.innerHTML = `
      <h1>60 in 6</h1>
      <div class="card" id="ft-card">
        <div class="mm-top"><span id="ft-time"></span><span id="ft-n"></span>${live ? '<span id="ft-score"></span>' : ''}</div>
        <div class="mm-q ft-q" id="ft-q" aria-live="polite"></div>
        <div class="mc ft-mc" id="ft-mc"></div>
        <p class="small" style="margin-top:10px">Tap an answer or press 1–4. Wrong answers cost a point.</p>
      </div>`;
    const $ = (s) => el.querySelector(s), $mc = $('#ft-mc'), $card = $('#ft-card');
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const i = '1234'.indexOf(e.key);
      if (i >= 0 && $mc.children[i]) $mc.children[i].click();
    };
    const timer = setInterval(tick, 200);
    const stop = () => { clearInterval(timer); document.removeEventListener('keydown', onKey); };
    QT.cleanup = stop;
    document.addEventListener('keydown', onKey);

    $mc.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || done) return;
      const o = cur.opts[+btn.dataset.i], ok = o.ok;
      if (ok) correct++;
      else wrong++;
      answered.push({ ...cur, ok, you: o.label, ms: Date.now() - shownAt });
      if (live) {
        $card.classList.remove('flash-ok', 'flash-bad');
        void $card.offsetWidth;
        $card.classList.add(ok ? 'flash-ok' : 'flash-bad');
      }
      if (n >= N) finish();
      else next();
    });

    function next() {
      cur = question();
      n++;
      shownAt = Date.now();
      $('#ft-q').innerHTML = pretty(cur.q);
      $mc.innerHTML = cur.opts.map((o, i) => `<button type="button" data-i="${i}" data-ok="${o.ok ? 1 : 0}" aria-label="${i + 1}: ${esc(o.label)}"><span class="small">${i + 1}</span> ${pretty(o.label)}</button>`).join('');
      $('#ft-n').textContent = `Question ${n}/${N}`;
      if (live) $('#ft-score').textContent = `Score ${correct - wrong}`;
    }
    function tick() {
      const left = Math.max(0, end - Date.now());
      $('#ft-time').textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (at3.n === null && left <= SECS * 500) at3.n = answered.length;
      if (left <= 0) finish();
    }
    function finish() {
      if (done) return;
      done = true;
      stop();
      QT.cleanup = null;
      el.innerHTML = results(answered, at3.n);
      el.querySelector('#again').addEventListener('click', () => run(el));
      if (QT.mental.wireReview) QT.mental.wireReview(el);
    }
    tick();
    next();
  }

  // Score, pace, guessing and the per-question review.
  function results(answered, half) {
    const right = answered.filter((x) => x.ok).length, wrongN = answered.length - right, score = right - wrongN, unreached = N - answered.length;
    const s = store.get(), rec = (s.mental.ft60 ||= { best: null, runs: [] }), prev = rec.best;
    rec.best = prev === null ? score : Math.max(prev, score);
    store.log(rec.runs, { date: new Date().toISOString(), correct: right, wrong: wrongN }, 50);
    const slow = QT.mental.slowSecs();
    QT.mental.recordSpeed(answered);
    const added = QT.mental.scheduleReps(answered, slow);
    store.touchDay();
    store.save();
    const isBest = prev === null || score > prev, acc = answered.length ? Math.round((100 * right) / answered.length) : 0;
    // Answers in under 1.5 s on anything but the simplest types are almost always guesses.
    const quick = answered.filter((x) => x.ms < 1500 && !['ftAdd', 'ftSub'].includes(x.kind)), quickBad = quick.filter((x) => !x.ok).length;
    const notes = [];
    if (half !== null) notes.push(`<b>Pace:</b> ${half} answered at the halfway mark (on pace for all 60 is 30).${half < 30 ? ` At that rate you reach about ${Math.min(N, half * 2)}.` : ''}`);
    if (quick.length >= 3 && quickBad >= quick.length / 2) notes.push(`<b>Guessing:</b> ${quick.length} answers took under 1.5 s (${quick.length - quickBad} right, ${quickBad} wrong). A blind pick among four loses half a point on average, so rushing the last seconds costs more than it earns.`);
    if (wrongN && acc < 85) notes.push(`<b>Accuracy:</b> ${acc}%. Each wrong answer wipes out a right one, so ${right} right and ${wrongN} wrong scores the same as ${score} right and none wrong. Slow down on the types you missed below.`);
    const rows = answered.map((x, i) => `<tr><td class="num">${i + 1}</td><td class="mono">${pretty(x.q)}</td><td class="mono">${x.ok ? '' : `<span class="neg">${pretty(x.you)}</span> → `}${pretty(x.al)}</td><td class="num ${x.ok ? 'pos' : 'neg'}">${x.ok ? '+1' : '−1'}</td><td class="num">${(x.ms / 1000).toFixed(1)} s</td></tr>`).join('');
    return `
      <div class="title-row"><h1>60 in 6: done</h1>${isBest ? QT.flair.milestone('New best') : ''}</div>
      <div class="tiles">
        <div class="tile"><div class="v">${score}</div><div class="k">net score${isBest ? ' · new best!' : ''}</div></div>
        <div class="tile"><div class="v">${right} / ${wrongN} / ${unreached}</div><div class="k">right / wrong / not reached</div></div>
        <div class="tile"><div class="v">${acc}%</div><div class="k">accuracy</div></div>
        <div class="tile"><div class="v">${rec.best}</div><div class="k">personal best</div></div>
      </div>
      ${notes.length ? `<div class="card">${notes.map((t) => `<p class="small" style="margin:4px 0">${t}</p>`).join('')}</div>` : ''}
      ${QT.mental.review(answered, slow)}
      ${added.length ? `<p class="small">Added to your speed reps: ${added.map((k) => QT.mentalTips.KINDS[k].label).join(', ')}. They come back tomorrow as short timed sets.</p>` : ''}
      ${answered.length ? `<details class="card ft-all"><summary>Every question (${answered.length})</summary><div class="table-wrap"><table><tr><th class="num">#</th><th>Question</th><th>Answer</th><th class="num">Score</th><th class="num">Time</th></tr>${rows}</table></div></details>` : ''}
      <div class="row" style="margin-top:18px"><button id="again">Go again</button><a class="btn ghost" href="#/mental">Back</a></div>`;
  }

  QT.ft60 = { render, G, question, MIX, KINDS, pretty, fmt, N, SECS };
})();
