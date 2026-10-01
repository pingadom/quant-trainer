// Core helpers: randomness, maths, answer parsing and progress storage.
(function () {
  const QT = (window.QT = window.QT || {});
  QT.VERSION = '0.4.0'; // keep in step with package.json and sw.js

  QT.rand = {
    int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    float: (a, b, dp = 2) => +(a + Math.random() * (b - a)).toFixed(dp),
    die: (d = 6) => 1 + Math.floor(Math.random() * d),
    normal() {
      let u = 0;
      while (!u) u = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
    },
  };

  const M = (QT.m = {
    comb(n, k) {
      if (k < 0 || k > n) return 0;
      k = Math.min(k, n - k);
      let r = 1;
      for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
      return Math.round(r);
    },
    fact(n) {
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    },
    gcd(a, b) {
      a = Math.abs(a);
      b = Math.abs(b);
      while (b) [a, b] = [b, a % b];
      return a;
    },
    frac(n, d) {
      const g = M.gcd(n, d);
      n /= g;
      d /= g;
      return d === 1 ? `${n}` : `${n}/${d}`;
    },
    harmonic(n) {
      let s = 0;
      for (let i = 1; i <= n; i++) s += 1 / i;
      return s;
    },
    // Abramowitz & Stegun 7.1.26, max error ~1.5e-7
    erf(x) {
      const s = Math.sign(x);
      x = Math.abs(x);
      const t = 1 / (1 + 0.3275911 * x);
      const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return s * y;
    },
    normCdf: (z) => 0.5 * (1 + M.erf(z / Math.SQRT2)),
    normPdf: (z) => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI),
    mean: (a) => a.reduce((s, x) => s + x, 0) / a.length,
    sd(a) {
      const m = M.mean(a);
      return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
    },
  });

  QT.fmtNum = (x) => (Number.isFinite(x) ? String(+x.toPrecision(5)) : String(x));

  // Accepts "0.139", "5/36", "13.9%", "1,250", "1e-3".
  QT.parseAnswer = function (raw) {
    let s = String(raw).trim().replace(/,/g, '').replace(/\s+/g, '');
    if (!s) return NaN;
    let scale = 1;
    if (s.endsWith('%')) {
      scale = 0.01;
      s = s.slice(0, -1);
    }
    const num = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?';
    if (new RegExp(`^${num}/${num}$`, 'i').test(s)) {
      const [a, b] = s.split('/');
      return (Number(a) / Number(b)) * scale;
    }
    if (new RegExp(`^${num}$`, 'i').test(s)) return Number(s) * scale;
    return NaN;
  };

  QT.isCorrect = (user, ans, tol = {}) => {
    const abs = tol.abs ?? 1e-4;
    const rel = tol.rel ?? 0.01;
    return Math.abs(user - ans) <= Math.max(abs, rel * Math.abs(ans));
  };

  // ---- Progress storage (localStorage, per browser) ----
  const KEY = 'quant-trainer:v1';
  const blank = () => ({ topics: {}, days: [], mental: {}, market: { games: 0, total: 0, best: null, history: [] }, roadmap: {}, cases: {}, bank: {} });
  let state;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
    } catch {
      state = blank();
    }
  }
  function save() {
    const json = JSON.stringify(state);
    try {
      localStorage.setItem(KEY, json);
    } catch {
      /* storage unavailable: progress lives for this tab only */
    }
    if (QT.platform) QT.platform.persist(KEY, json); // native: mirror to durable storage
  }
  // True when nothing has been recorded yet (used to decide whether to restore a native backup).
  const isEmpty = () => !state.days.length && !Object.keys(state.topics).length && !Object.keys(state.bank).length && !Object.keys(state.cases).length && !state.market.games;
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  QT.store = {
    KEY,
    get: () => state,
    save,
    isEmpty,
    touchDay() {
      const t = dayKey(new Date());
      if (!state.days.includes(t)) state.days.push(t);
    },
    recordAttempt(topicId, correct) {
      const t = (state.topics[topicId] ||= { attempts: 0, correct: 0, recent: [] });
      t.attempts++;
      if (correct) t.correct++;
      t.recent.push(correct ? 1 : 0);
      if (t.recent.length > 20) t.recent.shift();
      this.touchDay();
      save();
    },
    streak() {
      const set = new Set(state.days);
      const d = new Date();
      if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
      let n = 0;
      while (set.has(dayKey(d))) {
        n++;
        d.setDate(d.getDate() - 1);
      }
      return n;
    },
    exportJson: () => JSON.stringify(state, null, 2),
    importJson(text) {
      state = Object.assign(blank(), JSON.parse(text));
      save();
    },
    reset() {
      state = blank();
      save();
    },
  };

  // Mastery = recent accuracy, discounted until you've done ~20 problems.
  QT.mastery = (id) => {
    const t = state.topics[id];
    if (!t || !t.attempts) return { attempts: 0, acc: null, recentAcc: null, score: 0 };
    const recentAcc = t.recent.reduce((a, b) => a + b, 0) / t.recent.length;
    return { attempts: t.attempts, acc: t.correct / t.attempts, recentAcc, score: recentAcc * Math.min(1, t.attempts / 20) };
  };

  QT.cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  load();
})();
