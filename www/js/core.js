// Core helpers: randomness, maths, answer parsing and progress storage.
(function () {
  const QT = (window.QT = window.QT || {});
  QT.VERSION = '0.47.0'; // keep in step with package.json and sw.js

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
      .replace(/[\u2212\u2012\u2013\u2014]/g, '-') // Unicode minus and dashes
      .replace(/[\u00a0\u202f]/g, ' ') // non-breaking spaces
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

  // Arithmetic in a typed answer: numbers, + - * / ^, brackets, %, √, sqrt, ln, exp, abs, pi and e,
  // so "sqrt(2)/2" and "0.05*sqrt(252)" work. A small recursive-descent parser: nothing typed is
  // ever run as code, and anything else (names, quotes, semicolons…) gives NaN.
  QT.evalExpr = function (raw) {
    const s = String(raw ?? '').replace(/[\u2212\u2012\u2013\u2014]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/\s+/g, '').toLowerCase();
    if (!s || s.length > 64) return NaN;
    const FNS = { sqrt: Math.sqrt, ln: Math.log, exp: Math.exp, abs: Math.abs };
    let i = 0;
    const fail = () => { throw new Error('unreadable'); };
    const word = () => (s.slice(i).match(/^(sqrt|ln|exp|abs|pi|e(?![0-9]))/) || [])[0];
    function expr() {
      let v = term();
      while (s[i] === '+' || s[i] === '-') v = s[i++] === '+' ? v + term() : v - term();
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (s[i] === '*') { i++; v *= unary(); }
        else if (s[i] === '/') { i++; v /= unary(); }
        else if (s[i] === '(' || s[i] === '√' || word()) v *= unary(); // 2sqrt(3), 3(4+1)
        else return v;
      }
    }
    function unary() {
      if (s[i] === '-') { i++; return -unary(); }
      if (s[i] === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      const base = atom();
      if (s[i] === '^') { i++; return base ** unary(); }
      return base;
    }
    function bracket() {
      if (s[i] !== '(') fail();
      i++;
      const v = expr();
      if (s[i] !== ')') fail();
      i++;
      return v;
    }
    function atom() {
      let v;
      const num = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/), w = word();
      if (num) { i += num[0].length; v = Number(num[0]); }
      else if (s[i] === '(') v = bracket();
      else if (s[i] === '√') { i++; v = Math.sqrt(s[i] === '(' ? bracket() : atom()); }
      else if (w === 'pi') { i += 2; v = Math.PI; }
      else if (w === 'e') { i++; v = Math.E; }
      else if (w) { i += w.length; v = FNS[w](bracket()); }
      else fail();
      if (s[i] === '%') { i++; v /= 100; }
      return v;
    }
    try {
      const v = expr();
      return i === s.length && Number.isFinite(v) ? v : NaN;
    } catch {
      return NaN;
    }
  };

  // ---- Progress storage (localStorage, per browser) ----
  // The app's old name (Quant Trainer) stays in this key: renaming it would lose everyone's progress.
  const KEY = 'quant-trainer:v1';
  const LOG_CAP = 5000; // per-answer history kept for research/model evaluation
  const blank = () => ({ topics: {}, days: [], mental: {}, market: { games: 0, total: 0, best: null, history: [] }, roadmap: {}, cases: {}, bank: {}, mistakes: [], mastered: 0, skills: {}, errors: [], log: [], demo: false, tricks: {}, estimate: { rounds: 0, best: null, hits: 0, n: 0, history: [] },
    quote: { rounds: 0, n: 0, hits: 0, withFlow: 0, requotes: 0, pnl: 0, history: [] }, kelly: { games: 0, best: null, history: [] },
    figgie: { games: 0, total: 0, best: null, wins: 0, history: [] }, daily: {}, oa: {}, talk: { sessions: 0, history: [] }, speed: {}, speedReview: {}, plan: null, flash: {}, handbook: {}, hbExams: {}, stories: {}, screen: { runs: [] }, adapt: { r: {}, sessions: 0, log: [] }, code: { lang: 'py', p: {}, quiz: { runs: [], q: {} } }, flow: { log: [], rhythm: [], method: {} }, sse: { attempts: [], cards: {}, sims: [], mocks: [] } });
  let state;

  // Each save records the app version that wrote it. An older copy of the app (a tab left open
  // across an update, or a cached install) doesn't know about newer fields and would drop them
  // when it saves, so when it sees data from a newer version it stops saving and asks for a
  // reload instead. QT.onNewerData shows that prompt.
  const BACKUP_KEY = 'theo-backups';
  const newer = (v) => {
    const a = String(v || '0').split('.').map(Number), b = QT.VERSION.split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
    return false;
  };
  let readOnly = false;
  const goReadOnly = () => {
    readOnly = true;
    if (QT.onNewerData) QT.onNewerData();
  };

  // Saved data goes through the same schema as imports, so a corrupted or hand-edited value
  // (or data from an older version) can't break a screen. If the saved data can't be read at
  // all, nothing is saved over it until it has been backed up.
  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      state = parsed ? sanitizeState(parsed) : blank();
      if (parsed && newer(parsed.writer)) readOnly = true; // prompt shown once the app is up
    } catch {
      state = blank();
      if (raw) backup('unreadable saved data', raw); // keep the original before anything overwrites it
    }
  }

  // Two tabs open: each would otherwise overwrite the other's progress with its own stale copy.
  // When another tab saves, adopt its state; the app re-renders if it's safe to (QT.onExternalChange).
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY || e.newValue == null) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (newer(parsed.writer)) return goReadOnly(); // a newer version is open: don't touch its data
        state = sanitizeState(parsed);
        if (QT.onExternalChange) QT.onExternalChange();
      } catch { /* ignore a malformed write */ }
    });
  }
  // ---- Automatic backups, kept on this device: one a day, and one before anything that replaces
  // your progress (reset, import, sample data). The answer log is left out to save space.
  const BACKUPS_KEPT = 10;
  function readBackups() {
    try {
      const list = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
      return Array.isArray(list) ? list.filter((b) => b && typeof b.json === 'string' && b.t) : [];
    } catch {
      return [];
    }
  }
  function backup(reason, json) {
    if (!json) {
      if (isEmpty()) return; // nothing worth keeping
      json = JSON.stringify({ ...state, log: [] });
    }
    let list = readBackups();
    if (list[0] && list[0].json === json) return; // unchanged since the last backup
    list.unshift({ t: Date.now(), reason, json });
    list = list.slice(0, BACKUPS_KEPT);
    while (list.length) {
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
        return;
      } catch {
        list.pop(); // over the storage quota: drop the oldest and try again
      }
    }
  }
  let backedUpToday = null;
  const saveHooks = [];

  function save() {
    if (readOnly) return;
    const today = dayKey(new Date());
    if (backedUpToday !== today) {
      backedUpToday = today;
      if (!readBackups().some((b) => dayKey(new Date(b.t)) === today)) backup('daily');
    }
    state.writer = QT.VERSION;
    const json = JSON.stringify(state);
    try {
      localStorage.setItem(KEY, json);
    } catch {
      /* storage unavailable: progress lives for this tab only */
    }
    if (QT.platform) QT.platform.persist(KEY, json); // native: mirror to durable storage
    for (const fn of saveHooks) {
      try { fn(); } catch { /* a hook must never stop saving */ }
    }
  }
  // ---- Untrusted input: imported progress files ----
  // Saved problems contain HTML (sup/sub/b…), so an imported file could smuggle in markup
  // that runs script when rendered. Every field is rebuilt from a schema: numbers are coerced,
  // plain-text fields lose all tags, and HTML fields keep only a small inert allow-list.
  const ALLOWED = new Set(['B', 'I', 'EM', 'STRONG', 'SUP', 'SUB', 'P', 'BR', 'UL', 'OL', 'LI', 'SPAN']);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // A tokenizer, not the browser's parser: untrusted markup never reaches a DOM (Chrome 156+
  // reports CSP violations for handler attributes as soon as it parses them, even inertly).
  // Allowed tags are re-emitted bare (class kept if it's plain words); every other tag is
  // dropped with all its attributes; comments go; text is escaped, keeping valid entities.
  const TAG = /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|<![^>]*>/g;
  const escapeText = (t) => t.replace(/&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function sanitizeHtml(html) {
    html = String(html ?? '').slice(0, 20000);
    let out = '', at = 0, m;
    TAG.lastIndex = 0;
    while ((m = TAG.exec(html))) {
      out += escapeText(html.slice(at, m.index));
      at = TAG.lastIndex;
      const [, close, name] = m;
      if (!name || !ALLOWED.has(name.toUpperCase())) continue;
      const cls = !close && /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(m[3]);
      const c = cls && (cls[1] ?? cls[2]);
      out += `<${close}${name.toLowerCase()}${c && /^[\w -]*$/.test(c) ? ` class="${c}"` : ''}>`;
    }
    return out + escapeText(html.slice(at));
  }

  const num = (x, d = 0) => (x !== null && x !== '' && Number.isFinite(+x) ? +x : d);
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const arr = (x, cap) => (Array.isArray(x) ? x.slice(-cap) : []);
  const text = (x, len = 300) => String(x ?? '').replace(/<[^>]*>/g, '').slice(0, len);
  const bits = (a, cap) => arr(a, cap).map((v) => (v ? 1 : 0));
  const results = (r) => ({ results: arr(obj(r).results, 50).map((v) => (v === null || v === undefined ? null : !!v)) });
  // Interview questions also carry a status you set: done, unsure (come back later) or todo.
  const bankRec = (r) => {
    const hinted = arr(obj(r).hinted, 50).map((v) => Math.max(0, Math.min(20, Math.floor(num(v)))));
    return { ...results(r), ...(hinted.some(Boolean) ? { hinted } : {}), ...(['done', 'unsure', 'todo'].includes(obj(r).mark) ? { mark: obj(r).mark } : {}) };
  };
  const mapKeys = (o, fn, keyOk = () => true) => Object.fromEntries(Object.entries(obj(o)).filter(([k]) => keyOk(k)).slice(0, 500).map(([k, v]) => [text(k, 80), fn(v)]));

  function sanitizeState(raw) {
    const r = obj(raw), s = blank();
    s.topics = mapKeys(r.topics, (t) => ({ attempts: num(obj(t).attempts), correct: num(obj(t).correct), recent: bits(obj(t).recent, 20) }));
    s.days = arr(r.days, 3650).filter((d) => /^\d{4}-\d\d-\d\d$/.test(d));
    s.mental = mapKeys(r.mental, (m) => ({ best: obj(m).best == null ? null : num(obj(m).best), runs: arr(obj(m).runs, 50).map((x) => ({ date: text(obj(x).date, 40), correct: num(obj(x).correct), wrong: num(obj(x).wrong) })) }), (k) => ['sprint', 'full', 'fullTyped', 'ft60', 'zetamac', 'zetamacCustom', 'zmAdd', 'zmSub', 'zmMul', 'zmDiv'].includes(k));
    const mk = obj(r.market);
    s.market = { games: num(mk.games), total: num(mk.total), best: mk.best == null ? null : num(mk.best), history: arr(mk.history, 100).map((x) => ({ date: text(obj(x).date, 40), pnl: num(obj(x).pnl), midErr: num(obj(x).midErr) })) };
    s.roadmap = mapKeys(r.roadmap, (v) => !!v);
    s.cases = mapKeys(r.cases, results);
    s.bank = mapKeys(r.bank, bankRec);
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
    const date = (x) => text(x, 40), when = (x) => ({ date: date(obj(x).date) });
    s.estimate = { rounds: num(es.rounds), best: es.best == null ? null : num(es.best), hits: num(es.hits), n: num(es.n), history: arr(es.history, 100).map((x) => ({ ...when(x), score: num(obj(x).score), hits: num(obj(x).hits) })) };
    const qu = obj(r.quote);
    s.quote = { rounds: num(qu.rounds), n: num(qu.n), hits: num(qu.hits), withFlow: num(qu.withFlow), requotes: num(qu.requotes), pnl: num(qu.pnl), history: arr(qu.history, 100).map((x) => ({ ...when(x), pnl: num(obj(x).pnl), hits: num(obj(x).hits), n: num(obj(x).n) })) };
    const ke = obj(r.kelly);
    s.kelly = { games: num(ke.games), best: ke.best == null ? null : num(ke.best), history: arr(ke.history, 100).map((x) => ({ ...when(x), eff: num(obj(x).eff), final: num(obj(x).final), kelly: num(obj(x).kelly) })) };
    const fg = obj(r.figgie);
    s.figgie = { games: num(fg.games), total: num(fg.total), best: fg.best == null ? null : num(fg.best), wins: num(fg.wins), history: arr(fg.history, 100).map((x) => ({ ...when(x), pnl: num(obj(x).pnl) })) };
    // Daily results: keep the most recent 400 days (mapKeys alone would keep the oldest 500).
    const dayOk = (k) => /^\d{4}-\d\d-\d\d$/.test(k);
    const recentDays = Object.fromEntries(Object.entries(obj(r.daily)).filter(([k]) => dayOk(k)).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-400));
    s.daily = mapKeys(recentDays, (d) => ({ r: bits(obj(d).r, 5), ms: num(obj(d).ms), start: num(obj(d).start), done: !!obj(d).done }));
    s.oa = mapKeys(r.oa, (o) => ({ best: obj(o).best == null ? null : num(obj(o).best), runs: arr(obj(o).runs, 50).map((x) => ({ ...when(x), score: num(obj(x).score) })) }), (k) => ['seq', 'span', 'total'].includes(k));
    const tk = obj(r.talk);
    s.talk = { sessions: num(tk.sessions), history: arr(tk.history, 100).map((x) => ({ ...when(x), id: text(obj(x).id, 80), secs: num(obj(x).secs), score: num(obj(x).score), of: num(obj(x).of, 6) })) };
    // Mental-maths timings by question type (mental-tips.js KINDS): the last 30 answers of each.
    s.speed = mapKeys(r.speed, (x) => ({ times: arr(obj(x).times, 30).map((v) => Math.max(0, num(v))), oks: bits(obj(x).oks, 30) }), (k) => /^[a-zA-Z0-9]{1,20}$/.test(k));
    // Speed reps: question types scheduled for spaced timed practice (box 0–3, due timestamp).
    s.speedReview = mapKeys(r.speedReview, (x) => ({ box: Math.min(3, Math.max(0, Math.floor(num(obj(x).box)))), due: num(obj(x).due) }), (k) => /^[a-zA-Z0-9]{1,20}$/.test(k));
    // Interview prep plan: firm, date, the day it started, and manually ticked tasks per day.
    const pl = obj(r.plan), dayRe = /^\d{4}-\d\d-\d\d$/;
    s.plan = typeof pl.firm === 'string' && /^[a-z]{1,20}$/.test(pl.firm) && dayRe.test(pl.date) && dayRe.test(pl.start)
      ? { firm: pl.firm, date: pl.date, start: pl.start, done: mapKeys(pl.done, (v) => arr(v, 20).map((x) => text(x, 60)), (k) => dayRe.test(k)) }
      : null;
    // Formula flashcards: spaced-repetition box (0–4) and due time per card id.
    // Handbook: per chapter, which checks were answered correctly (c), homework scores (h: 0 missed,
    // 1 partly, 2 got it), your own explanation (note), finished (done) and the next review (rv).
    const hbKey = (k) => /^[a-z0-9-]{1,12}$/.test(k);
    s.handbook = mapKeys(r.handbook, (x) => {
      const rv = obj(obj(x).rv);
      return { c: mapKeys(obj(x).c, (v) => (v ? 1 : 0), hbKey), h: mapKeys(obj(x).h, (v) => Math.max(0, Math.min(2, Math.round(num(v)))), hbKey), note: String(obj(x).note ?? '').slice(0, 2000), done: !!obj(x).done, ...(num(rv.due) ? { rv: { due: num(rv.due), st: Math.max(0, Math.min(3, Math.round(num(rv.st)))) } } : {}) };
    }, (k) => /^[a-z0-9-]{1,40}$/.test(k));
    // Handbook exams: best and latest score, attempts and when, per part (or "all").
    s.hbExams = mapKeys(r.hbExams, (x) => ({ best: Math.max(0, Math.min(1, num(obj(x).best))), last: Math.max(0, Math.min(1, num(obj(x).last))), n: Math.max(0, Math.round(num(obj(x).n))), at: num(obj(x).at) }), (k) => /^[a-z]{1,20}$/.test(k));
    // Stories: your written answers to behavioural prompts (plain text, escaped when shown).
    s.stories = mapKeys(r.stories, (x) => ({ f: arr(obj(x).f, 8).map((v) => String(v ?? '').slice(0, 4000)), t: num(obj(x).t) }), (k) => /^[a-z-]{1,30}$/.test(k));
    // Phone-screen mock runs: [right, of] for each scored part.
    const pair = (v) => { const a = arr(v, 2).map((x) => Math.max(0, num(x))); return [a[0] || 0, a[1] || 0]; };
    s.screen = { runs: arr(obj(r.screen).runs, 50).map((x) => ({ ...when(x), firm: text(obj(x).firm, 20), secs: num(obj(x).secs), mental: pair(obj(x).mental), prob: pair(obj(x).prob), mm: pair(obj(x).mm), self: pair(obj(x).self) })) };
    // Weak spots: recent session scores (0–1) per skill area, and a log of sessions.
    const ad = obj(r.adapt);
    s.adapt = { r: mapKeys(ad.r, (v) => arr(v, 20).map((x) => Math.max(0, Math.min(1, num(x)))), (k) => /^[a-z]{1,12}$/.test(k)), sessions: num(ad.sessions), log: arr(ad.log, 50).map((x) => ({ ...when(x), n: num(obj(x).n), right: num(obj(x).right) })) };
    // Coding: your code per problem and language (capped), what you solved, and quiz results.
    const cd = obj(r.code), cq = obj(cd.quiz), src = (v) => (typeof v === 'string' ? v.slice(0, 20000) : '');
    s.code = {
      lang: cd.lang === 'js' ? 'js' : 'py',
      p: mapKeys(cd.p, (x) => ({ py: src(obj(x).py), js: src(obj(x).js), solved: num(obj(x).solved), subs: num(obj(x).subs), first: !!obj(x).first }), (k) => /^[a-z0-9-]{1,40}$/.test(k)),
      quiz: { runs: arr(cq.runs, 50).map((x) => ({ ...when(x), n: num(obj(x).n), right: num(obj(x).right) })), q: mapKeys(cq.q, (v) => bits(v, 5), (k) => /^[a-z0-9-]{1,30}$/.test(k)) },
    };
    // Flow training: recent + and − answers as [op, x, y, ms], rhythm drills, method drills by kind of sum.
    const fl = obj(r.flow), int = (v) => Math.max(0, Math.min(60000, Math.round(num(v))));
    s.flow = {
      log: arr(fl.log, 1000).filter((x) => Array.isArray(x) && (x[0] === '+' || x[0] === '-')).map((x) => [x[0], Math.min(10000, int(x[1])), Math.min(10000, int(x[2])), int(x[3])]).filter((x) => x[0] === '+' || x[1] >= x[2]),
      rhythm: arr(fl.rhythm, 50).map((x) => ({ ...when(x), pace: int(obj(x).pace), start: int(obj(x).start), fastest: int(obj(x).fastest), n: num(obj(x).n), onBeat: num(obj(x).onBeat), skipped: num(obj(x).skipped) })),
      method: mapKeys(fl.method, (x) => ({ runs: num(obj(x).runs), ms: int(obj(x).ms) }), (k) => /^(add|sub)-(easy|carry|borrow|round|cross)$/.test(k)),
    };
    // Citadel SSE prep: every attempt, as { question_id, tags, correct, time_s, hints_used, timestamp }.
    s.sse = { attempts: arr(obj(r.sse).attempts, 5000).map((x) => {
      const o = obj(x), a = { question_id: text(o.question_id, 40), tags: arr(o.tags, 12).map((t) => text(t, 40)), correct: Math.max(0, Math.min(1, num(o.correct))), time_s: Math.max(0, num(o.time_s)), hints_used: Math.max(0, Math.round(num(o.hints_used))), timestamp: text(o.timestamp, 40) };
      if (typeof o.notes === 'string' && o.notes) a.notes = o.notes.slice(0, 4000);
      return a;
    }), cards: mapKeys(obj(r.sse).cards, (x) => ({ ease: Math.max(1.3, num(obj(x).ease, 2.5)), interval: Math.max(0, num(obj(x).interval, 1)), reps: Math.max(0, num(obj(x).reps)), due: num(obj(x).due) }), (k) => /^q-[a-z0-9-]{1,40}$/.test(k)),
    sims: arr(obj(r.sse).sims, 50).map((x) => ({ ...when(x), scenario: text(obj(x).scenario, 20), level: num(obj(x).level), score: num(obj(x).score), pnl: num(obj(x).pnl), width: num(obj(x).width), trades: num(obj(x).trades), quality: Math.max(0, Math.min(1, num(obj(x).quality))) })),
    mocks: arr(obj(r.sse).mocks, 20).map((x) => ({ ...when(x), secs: num(obj(x).secs), overall: Math.max(0, Math.min(1, num(obj(x).overall))), segs: arr(obj(x).segs, 8).map((g) => ({ id: text(obj(g).id, 20), score: Math.max(0, Math.min(1, num(obj(g).score))) })), weak: arr(obj(x).weak, 3).map((t) => text(t, 40)) })) };
    s.flash = mapKeys(r.flash, (x) => ({ box: Math.min(4, Math.max(0, Math.floor(num(obj(x).box)))), due: num(obj(x).due) }), (k) => /^[a-z0-9-]{1,30}$/.test(k));
    s.demo = !!r.demo;
    if (r.writer) s.writer = text(r.writer, 20);
    if (r.lastExport) s.lastExport = num(r.lastExport);
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
  const isEmpty = () => !state.days.length && !state.log.length && !state.plan && !state.market.games
    && ['topics', 'bank', 'cases', 'mental', 'flash', 'speed', 'speedReview', 'daily', 'oa', 'tricks', 'roadmap', 'handbook', 'stories'].every((k) => !Object.keys(state[k] || {}).length)
    && !state.mistakes.length && !state.talk.sessions && !state.figgie.games && !state.kelly.games && !state.quote.rounds && !state.estimate.rounds && !state.screen.runs.length && !state.adapt.sessions
    && !Object.keys(state.code.p).length && !state.code.quiz.runs.length && !state.flow.log.length && !state.sse.attempts.length;
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  QT.dayKey = dayKey;

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
    // Append to a history list, keeping the most recent `cap` entries.
    log(list, entry, cap = 100) {
      list.push({ date: new Date().toISOString(), ...entry });
      if (list.length > cap) list.splice(0, list.length - cap);
    },
    exportJson: () => JSON.stringify(state, null, 2),
    // Imported files are untrusted: rebuild the state from known fields only (see sanitizeState).
    importJson(text) {
      const next = sanitizeState(JSON.parse(text));
      backup('before import');
      state = next;
      save();
    },
    reset(reason = 'before reset') {
      backup(reason);
      state = blank();
      save();
    },
    backups: () => readBackups().map(({ t, reason, json }) => {
      let s = {};
      try { s = JSON.parse(json); } catch { /* listed, but can't be summarised */ }
      return { t, reason, days: (s.days || []).length, bank: Object.keys(s.bank || {}).length, topics: Object.keys(s.topics || {}).length };
    }),
    restoreBackup(t) {
      const b = readBackups().find((x) => x.t === t);
      if (!b) return false;
      const next = sanitizeState(JSON.parse(b.json));
      backup('before restoring a backup');
      state = next;
      save();
      return true;
    },
    isReadOnly: () => readOnly,
    onSave: (fn) => saveHooks.push(fn),
    markExported() {
      state.lastExport = Date.now();
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
