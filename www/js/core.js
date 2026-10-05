// Core helpers: randomness, maths, answer parsing and progress storage.
(function () {
  const QT = (window.QT = window.QT || {});
  QT.VERSION = '0.9.0'; // keep in step with package.json and sw.js

  QT.rand = {
    int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    float: (a, b, dp = 2) => +(a + Math.random() * (b - a)).toFixed(dp),
    die: (d = 6) => 1 + Math.floor(Math.random() * d),
    // Uniform shuffle (Fisher–Yates). Never use sort(() => Math.random() - 0.5): it's biased,
    // e.g. multiple-choice answers would not land in each position equally often.
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
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

  // Reads what people actually type: "0.139", ".5", "5/36", "13.9%", "1e-3", "−2" (Unicode
  // minus from phone keyboards), "1 1/2" and "1½" (mixed numbers), "1,250" (thousands),
  // "0,5" and "1.250,5" (decimal comma). Returns NaN for anything unreadable or infinite
  // ("5/0"), so it is never silently graded as a number.
  const VULGAR = { '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
  const NUM = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?';
  QT.parseAnswer = function (raw) {
    let s = String(raw ?? '')
      .replace(/[−‒–—]/g, '-')
      .replace(/[  ]/g, ' ')
      .trim();
    if (!s) return NaN;
    s = s.replace(/(\d)\s*([½⅓⅔¼¾⅕⅙⅚⅛⅜⅝⅞])/g, '$1 $2').replace(/[½⅓⅔¼¾⅕⅙⅚⅛⅜⅝⅞]/g, (m) => VULGAR[m]);
    let scale = 1;
    if (/%$/.test(s)) {
      scale = 0.01;
      s = s.slice(0, -1).trim();
    }
    const mixed = s.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const [, sign, whole, n, d] = mixed;
      return +d === 0 ? NaN : (sign === '-' ? -1 : 1) * (+whole + n / d) * scale;
    }
    s = s.replace(/\s+/g, '');
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ''); // 1,250 / 1,250.5
    else if (/^[+-]?\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); // 1.250,5
    else if (/^[+-]?\d*,\d+$/.test(s)) s = s.replace(',', '.'); // 0,5 or 12,5
    let v = NaN;
    if (new RegExp(`^${NUM}/${NUM}$`, 'i').test(s)) {
      const [a, b] = s.split('/');
      v = Number(a) / Number(b);
    } else if (new RegExp(`^${NUM}$`, 'i').test(s)) v = Number(s);
    return Number.isFinite(v) ? v * scale : NaN;
  };

  QT.isCorrect = (user, ans, tol = {}) => {
    const abs = tol.abs ?? 1e-4;
    const rel = tol.rel ?? 0.01;
    return Math.abs(user - ans) <= Math.max(abs, rel * Math.abs(ans));
  };

  // ---- Progress storage (localStorage, per browser) ----
  const KEY = 'quant-trainer:v1';
  const LOG_CAP = 5000; // per-answer history kept for research/model evaluation
  const blank = () => ({ topics: {}, days: [], mental: {}, market: { games: 0, total: 0, best: null, history: [] }, roadmap: {}, cases: {}, bank: {}, mistakes: [], mastered: 0, skills: {}, errors: [], log: [], demo: false, tricks: {}, estimate: { rounds: 0, best: null, hits: 0, n: 0 } });
  let state;

  // Saved data goes through the same schema as imports, so a corrupted or hand-edited value
  // (or data from an older version) can't break a screen.
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? sanitizeState(JSON.parse(raw)) : blank();
    } catch {
      state = blank();
    }
  }

  // Two tabs open: each would otherwise overwrite the other's progress with its own stale copy.
  // When another tab saves, adopt its state; the app re-renders if it's safe to (QT.onExternalChange).
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY || e.newValue == null) return;
      try {
        state = sanitizeState(JSON.parse(e.newValue));
        if (QT.onExternalChange) QT.onExternalChange();
      } catch { /* ignore a malformed write */ }
    });
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
  // ---- Untrusted input: imported progress files ----
  // Saved problems contain HTML (sup/sub/b…), so an imported file could smuggle in markup
  // that runs script when rendered. Every field is rebuilt from a schema: numbers are coerced,
  // plain-text fields lose all tags, and HTML fields keep only a small inert allow-list.
  const ALLOWED = new Set(['B', 'I', 'EM', 'STRONG', 'SUP', 'SUB', 'P', 'BR', 'UL', 'OL', 'LI', 'SPAN']);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function sanitizeHtml(html) {
    html = String(html ?? '').slice(0, 20000);
    if (typeof document === 'undefined') return escapeHtml(html.replace(/<[^>]*>/g, '')); // no DOM (tests): plain text
    const tpl = document.createElement('template');
    tpl.innerHTML = html; // template content is inert: nothing runs or loads while we clean it
    const clean = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) continue;
        if (child.nodeType !== 1 || !ALLOWED.has(child.tagName)) {
          child.replaceWith(document.createTextNode(child.nodeType === 1 ? child.textContent : ''));
          continue;
        }
        for (const a of [...child.attributes]) if (!(a.name === 'class' && /^[\w -]*$/.test(a.value))) child.removeAttribute(a.name);
        clean(child);
      }
    };
    clean(tpl.content);
    const out = document.createElement('div');
    out.appendChild(tpl.content);
    return out.innerHTML;
  }
  const num = (x, d = 0) => (x !== null && x !== '' && Number.isFinite(+x) ? +x : d);
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const arr = (x, cap) => (Array.isArray(x) ? x.slice(-cap) : []);
  const text = (x, len = 300) => String(x ?? '').replace(/<[^>]*>/g, '').slice(0, len);
  const bits = (a, cap) => arr(a, cap).map((v) => (v ? 1 : 0));
  const results = (r) => ({ results: arr(obj(r).results, 50).map((v) => (v === null || v === undefined ? null : !!v)) });
  const mapKeys = (o, fn, keyOk = () => true) => Object.fromEntries(Object.entries(obj(o)).filter(([k]) => keyOk(k)).slice(0, 500).map(([k, v]) => [text(k, 80), fn(v)]));

  function sanitizeState(raw) {
    const r = obj(raw), s = blank();
    s.topics = mapKeys(r.topics, (t) => ({ attempts: num(obj(t).attempts), correct: num(obj(t).correct), recent: bits(obj(t).recent, 20) }));
    s.days = arr(r.days, 3650).filter((d) => /^\d{4}-\d\d-\d\d$/.test(d));
    s.mental = mapKeys(r.mental, (m) => ({ best: obj(m).best == null ? null : num(obj(m).best), runs: arr(obj(m).runs, 50).map((x) => ({ date: text(obj(x).date, 40), correct: num(obj(x).correct), wrong: num(obj(x).wrong) })) }), (k) => ['sprint', 'full', 'fullTyped'].includes(k));
    const mk = obj(r.market);
    s.market = { games: num(mk.games), total: num(mk.total), best: mk.best == null ? null : num(mk.best), history: arr(mk.history, 100).map((x) => ({ date: text(obj(x).date, 40), pnl: num(obj(x).pnl), midErr: num(obj(x).midErr) })) };
    s.roadmap = mapKeys(r.roadmap, (v) => !!v);
    s.cases = mapKeys(r.cases, results);
    s.bank = mapKeys(r.bank, results);
    s.mistakes = arr(r.mistakes, 500).map((raw) => {
      const m = obj(raw), p = obj(m.p), tol = obj(p.tol);
      return {
        key: text(m.key, 240), tag: text(m.tag, 120),
        p: { q: sanitizeHtml(p.q), a: num(p.a), sol: sanitizeHtml(p.sol), ...(p.tol ? { tol: { abs: num(tol.abs, 1e-4), rel: num(tol.rel, 0.01) } } : {}) },
        box: Math.min(3, Math.max(0, Math.floor(num(m.box)))), due: num(m.due), added: num(m.added),
      };
    }).filter((m) => m.key && Number.isFinite(m.p.a));
    s.mastered = num(r.mastered);
    s.skills = mapKeys(r.skills, (k) => ({ n: num(obj(k).n), c: num(obj(k).c), recent: bits(obj(k).recent, 10), times: arr(obj(k).times, 10).map((x) => num(x)), last: num(obj(k).last) }), (k) => /^[a-z]+\.\d+$/.test(k));
    s.errors = arr(r.errors, 100).map((e) => ({ type: text(obj(e).type, 20), skill: obj(e).skill ? text(e.skill, 40) : null, tag: text(obj(e).tag, 120), t: num(obj(e).t) }));
    const es = obj(r.estimate);
    s.estimate = { rounds: num(es.rounds), best: es.best == null ? null : num(es.best), hits: num(es.hits), n: num(es.n) };
    s.demo = !!r.demo;
    s.tricks = mapKeys(r.tricks, (t) => ({ best: Math.min(10, Math.max(0, num(obj(t).best))), runs: num(obj(t).runs) }), (k) => /^[a-z0-9-]+$/.test(k));
    if (r.elo) {
      const e = obj(r.elo), skillKey = (k) => /^[a-z]+\.\d+$/.test(k);
      s.elo = { theta: num(e.theta), b: mapKeys(e.b, (v) => num(v), skillKey), n: mapKeys(e.n, (v) => num(v), skillKey) };
    }
    s.log = arr(r.log, LOG_CAP).map((x) => ({ s: text(obj(x).s, 40), ok: obj(x).ok ? 1 : 0, ms: num(obj(x).ms), t: num(obj(x).t) }));
    return s;
  }
  QT.escapeHtml = escapeHtml;
  QT.sanitizeHtml = sanitizeHtml;

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
    // Imported files are untrusted: rebuild the state from known fields only (see sanitizeState).
    importJson(text) {
      state = sanitizeState(JSON.parse(text));
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
