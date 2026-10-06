// Timed mental arithmetic. "80 in 8" mimics the widely reported trading-firm screen: 80 questions
// in 8 minutes, +1 right / −1 wrong, no going back. It can be taken as multiple choice (as
// reported) or with typed answers (harder: no options to eliminate). Personal bests are kept
// separately per answer style. Every answer is timed; slow and missed questions come back in an
// end-of-session review showing the fast method for each one.
(function () {
  const R = QT.rand, store = QT.store, esc = QT.escapeHtml;
  const round = (x, dp) => Math.round(x * 10 ** dp) / 10 ** dp;
  const dpOf = (x) => { const s = String(round(x, 4)); return s.includes('.') ? s.split('.')[1].length : 0; };
  const STYLE_KEY = 'qt-80in8-style', SLOW_KEY = 'qt-slow-secs';
  const SLOW_CHOICES = [3, 4, 5, 6, 8, 10];

  const MODES = {
    full: { label: '80 in 8', secs: 480, max: 80, scoring: 'net', desc: '80 questions in 8 minutes, +1 right, −1 wrong, no going back. The format commonly reported for trading-firm numerical screens: ~55 net is a commonly quoted pass line, 70+ is strong.' },
  };
  // Where each mode/style's personal best is stored.
  const recKey = (modeId, style) => (modeId === 'full' && style === 'typed' ? 'fullTyped' : modeId);

  // Each question carries its type (`kind`) and operands (`v`) so the review can show the fast
  // method for that exact question (mental-tips.js).
  const gens = [
    () => { const a = R.int(12, 99), b = R.int(12, 99); return { q: `${a} × ${b}`, a: a * b, kind: 'mul2', v: [a, b] }; },
    () => { const a = R.int(101, 999), b = R.int(3, 9); return { q: `${a} × ${b}`, a: a * b, kind: 'mul31', v: [a, b] }; },
    () => { const a = R.float(1, 99, 2), b = R.float(1, 99, 2); return Math.random() < 0.5 ? { q: `${a} + ${b}`, a: round(a + b, 2), kind: 'addDec', v: [a, b] } : { q: `${a} − ${b}`, a: round(a - b, 2), kind: 'subDec', v: [a, b] }; },
    () => { const d = R.int(3, 19), k = R.int(11, 99); return { q: `${d * k} ÷ ${d}`, a: k, kind: 'div', v: [d * k, d] }; },
    () => { const d = R.pick([3, 6, 7, 8, 9, 11, 12, 16]); let n = R.int(1, d - 1); while (QT.m.gcd(n, d) !== 1) n = R.int(1, d - 1); return { q: `${n}/${d} (3 dp)`, a: round(n / d, 3), tol: 0.0006, kind: 'frac', v: [n, d] }; },
    () => { const p = R.pick([5, 12.5, 15, 20, 25, 35, 40, 60, 75, 120]), y = R.int(2, 80) * 10; return { q: `${p}% of ${y}`, a: round((p * y) / 100, 2), kind: 'pct', v: [p, y] }; },
    () => { const n = R.int(11, 35); return { q: `${n}²`, a: n * n, kind: 'sq', v: [n] }; },
    () => { const a = R.float(0.1, 9.9, 1), b = R.int(2, 9); return { q: `${a} × ${b}`, a: round(a * b, 2), kind: 'decMul', v: [a, b] }; },
    () => { const a = R.int(100, 999), b = R.int(100, 999); return { q: `${a} − ${b}`, a: a - b, kind: 'sub3', v: [a, b] }; },
    () => { const a = R.int(12, 99), x = R.float(1.1, 9.9, 1); return { q: `${a} × ? = ${round(a * x, 2)}`, a: x, kind: 'missMul', v: [a, round(a * x, 2)] }; },
    () => { const x = R.int(100, 999), b = R.int(100, 999); return { q: `? + ${b} = ${x + b}`, a: x, kind: 'missAdd', v: [b, x + b] }; },
  ];

  // Four options: the answer plus plausible slips (off by one or ten units, misplaced decimal
  // point), uniformly shuffled so the right answer is equally likely in each position.
  function options(ans) {
    const dp = Math.min(dpOf(ans), 3), u = 10 ** -dp, right = round(ans, dp);
    const cand = [ans + u, ans - u, ans + 2 * u, ans - 2 * u, ans + 10 * u, ans - 10 * u, ans + 11 * u, ans * 10, ans / 10]
      .map((x) => round(x, dp))
      .filter((x) => x !== right && (ans < 0 || x >= 0));
    const wrong = R.shuffle([...new Set(cand)]).slice(0, 3);
    return R.shuffle([right, ...wrong]).map((x) => ({ v: x, label: x.toFixed(Math.min(dpOf(x), 3)) }));
  }

  // Questions slower than this go into the end-of-session review. 6 s is the 80-in-8 pace.
  const slowSecs = () => { try { const v = +localStorage.getItem(SLOW_KEY); return SLOW_CHOICES.includes(v) ? v : 6; } catch { return 6; } };
  const savedStyle = () => { try { return localStorage.getItem(STYLE_KEY) === 'typed' ? 'typed' : 'mc'; } catch { return 'mc'; } };

  function render(el, sub, arg) {
    if (sub === 'rep' && QT.mentalTips.KINDS[arg]) return rep(el, arg);
    const st = store.get().mental, style = savedStyle();
    const best = (k) => st[k]?.best ?? '–';
    el.innerHTML = `
      <h1>Mental maths</h1>
      <p class="lede">Market-making firms screen with fast arithmetic tests. Speed comes from practice plus a handful of tricks you can learn in an afternoon.</p>
      <a class="card shortcut primary" href="#/tricks" style="margin-bottom:16px"><b>Learn the speed tricks →</b><span>20 short guides (squaring, near-100 multiplication, fractions, last-digit checks, guessing strategy…) each with a practice drill</span></a>
      ${repsCard()}
      <div class="grid">
        <div class="card wide">
          <h3>${MODES.full.label}</h3>
          <p class="small">${MODES.full.desc}</p>
          <div class="seg" role="radiogroup" aria-label="Answer style">
            <a href="#" role="radio" data-style="mc" aria-checked="${style === 'mc'}" class="${style === 'mc' ? 'on' : ''}">Multiple choice</a>
            <a href="#" role="radio" data-style="typed" aria-checked="${style === 'typed'}" class="${style === 'typed' ? 'on' : ''}">Type answers</a>
          </div>
          <p class="small" id="style-note">${style === 'mc' ? 'As in the reported test: pick from four options (keys 1–4 work).' : 'Harder: no options to eliminate. Pass with −1 if you are stuck.'}</p>
          <p class="small">Best: <b>${best('full')}</b> net (multiple choice) · <b>${best('fullTyped')}</b> net (typed)</p>
          <button data-mode="full">Start</button>
        </div>
        ${zetamacCard()}
      </div>
      <div class="card" style="margin-top:12px">
        <label for="slow">Review questions slower than</label>
        <select id="slow" style="margin-left:8px">${SLOW_CHOICES.map((v) => `<option value="${v}" ${v === slowSecs() ? 'selected' : ''}>${v} seconds</option>`).join('')}</select>
        <p class="small" style="margin:6px 0 0">After each run, slow and missed questions come back with the fastest way to do each one and the guide that teaches it. 80 in 8 needs about 6 seconds a question.</p>
      </div>
      ${speedCard(slowSecs())}`;
    el.querySelector('#slow').addEventListener('change', (e) => {
      try { localStorage.setItem(SLOW_KEY, e.target.value); } catch { /* storage blocked */ }
    });
    el.querySelectorAll('[data-style]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.setItem(STYLE_KEY, a.dataset.style); } catch { /* storage blocked: choice lasts this visit */ }
      render(el);
    }));
    el.querySelector('[data-mode="full"]').addEventListener('click', () => run(el, 'full', savedStyle()));
    el.querySelector('[data-mode="zetamac"]').addEventListener('click', () => zetamac(el));
    wireZetamac(el, () => render(el));
  }

  function run(el, modeId, style) {
    const mode = MODES[modeId], mc = style === 'mc', net = mode.scoring === 'net';
    let cur, correct = 0, wrong = 0, n = 0, done = false, timer = null, onKey = null, shownAt = 0;
    const answered = []; // every answered question with its time, for the review
    const end = Date.now() + mode.secs * 1000;

    el.innerHTML = `
      <h1>${mode.label}${modeId === 'full' ? ` <span class="small">${mc ? 'multiple choice' : 'typed'}</span>` : ''}</h1>
      <div class="card" id="mm-card">
        <div class="mm-top"><span id="mm-time"></span><span id="mm-score"></span></div>
        <div class="mm-q" id="mm-q" aria-live="polite"></div>
        ${mc
          ? `<div class="mc" id="mm-mc"></div><p class="small" style="margin-top:10px">Tap an answer (or press 1–4). Wrong answers cost a point, so don't guess blindly.</p>`
          : `<form class="answer-row" id="mm-form">
               <input type="text" id="mm-in" inputmode="decimal" autocomplete="off" placeholder="Answer, then Enter" aria-label="Your answer">
               <button>Enter</button>
             </form>
             <div class="q-actions"><span class="small" id="mm-hint">${net ? 'Wrong answers cost a point.' : 'Decimals, fractions or %.'}</span>${net ? '<button type="button" class="link" id="mm-pass">Pass (−1)</button>' : ''}</div>`}
      </div>`;
    const $ = (s) => el.querySelector(s);
    const $q = $('#mm-q'), $t = $('#mm-time'), $s = $('#mm-score'), $card = $('#mm-card');

    const stop = () => {
      clearInterval(timer);
      if (onKey) document.removeEventListener('keydown', onKey);
    };
    QT.cleanup = stop; // leaving the screen stops the clock and the key listener

    const flash = (ok) => {
      $card.classList.remove('flash-ok', 'flash-bad');
      void $card.offsetWidth;
      $card.classList.add(ok ? 'flash-ok' : 'flash-bad');
      if (!ok && navigator.vibrate) navigator.vibrate(30);
    };
    const answer = (ok, shown) => {
      if (done) return;
      flash(ok);
      if (ok) correct++;
      else wrong++;
      answered.push({ ...cur, ok, you: shown, ms: Date.now() - shownAt });
      if (mode.max && n >= mode.max) finish();
      else next();
    };

    let $in, $mc;
    if (mc) {
      $mc = $('#mm-mc');
      $mc.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) answer(b.dataset.ok === '1', b.dataset.label);
      });
      onKey = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return; // Ctrl+1 switches browser tabs; don't answer
        const i = '1234'.indexOf(e.key);
        if (i >= 0 && $mc.children[i]) $mc.children[i].click();
      };
      document.addEventListener('keydown', onKey);
    } else {
      $in = $('#mm-in');
      const form = $('#mm-form'), hint = $('#mm-hint'), baseHint = hint.textContent;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!$in.value.trim()) return;
        const v = QT.parseAnswer($in.value);
        if (Number.isNaN(v)) {
          hint.textContent = "Couldn't read that. Try 0.25, 1/4 or 25%.";
          hint.classList.add('nudge');
          return;
        }
        hint.textContent = baseHint;
        hint.classList.remove('nudge');
        answer(Math.abs(v - cur.a) <= (cur.tol ?? 0.005), $in.value.trim());
      });
      const pass = $('#mm-pass');
      if (pass) pass.addEventListener('click', () => answer(false, 'passed'));
      QT.keypad.attach(form, [$in], () => form.requestSubmit());
    }

    function next() {
      cur = R.pick(gens)();
      n++;
      shownAt = Date.now();
      $q.textContent = cur.q;
      if (mc) {
        $mc.innerHTML = options(cur.a).map((o, i) => `<button type="button" data-label="${o.label}" data-ok="${Math.abs(o.v - cur.a) < 1e-9 || (cur.tol && Math.abs(o.v - cur.a) <= cur.tol) ? 1 : 0}"><span class="small">${i + 1}</span> ${o.label}</button>`).join('');
      } else {
        $in.value = '';
        if (!QT.keypad.enabled()) $in.focus();
      }
      $s.textContent = net ? `net ${correct - wrong}${mode.max ? `  ·  Q${n}/${mode.max}` : ''}` : `✓ ${correct}  ✗ ${wrong}`;
    }

    const tick = () => {
      const left = Math.max(0, end - Date.now());
      $t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (left <= 0) finish();
    };
    timer = setInterval(tick, 200);

    function finish() {
      if (done) return;
      done = true;
      stop();
      QT.cleanup = null;
      const score = net ? correct - wrong : correct;
      const key = recKey(modeId, style), s = store.get();
      const rec = (s.mental[key] ||= { best: null, runs: [] });
      const prevBest = rec.best;
      rec.best = prevBest === null ? score : Math.max(prevBest, score);
      rec.runs.push({ date: new Date().toISOString(), correct, wrong });
      if (rec.runs.length > 50) rec.runs.shift();
      recordSpeed(answered); // speed by question type, across sessions (the coach uses it)
      const added = scheduleReps(answered, slowSecs());
      store.touchDay();
      store.save();
      const acc = correct + wrong ? Math.round((100 * correct) / (correct + wrong)) : 0;
      el.innerHTML = `
        <div class="title-row"><h1>${mode.label}: done</h1>${prevBest === null || score > prevBest ? QT.flair.milestone('New best') : ''}</div>
        <div class="tiles">
          <div class="tile"><div class="v">${score}</div><div class="k">${net ? 'net score' : 'correct'}${prevBest === null || score > prevBest ? ' · new best!' : ''}</div></div>
          <div class="tile"><div class="v">${correct} / ${wrong}</div><div class="k">right / wrong</div></div>
          <div class="tile"><div class="v">${acc}%</div><div class="k">accuracy</div></div>
          <div class="tile"><div class="v">${rec.best}</div><div class="k">personal best${modeId === 'full' ? ` (${mc ? 'multiple choice' : 'typed'})` : ''}</div></div>
        </div>
        ${review(answered, slowSecs())}
        ${added.length ? `<p class="small">Added to your speed reps: ${added.map((k) => QT.mentalTips.KINDS[k].label).join(', ')}. They come back tomorrow as short timed sets.</p>` : ''}
        <div class="row" style="margin-top:18px"><button id="again">Go again</button><a class="btn ghost" href="#/mental">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => run(el, modeId, style));
      wireReview(el);
    }

    tick();
    next();
  }

  // ---- Zetamac ----
  // The arithmetic game at arithmetic.zetamac.com, with its default settings: addition
  // (2–100) + (2–100), subtraction as addition in reverse, multiplication (2–12) × (2–100),
  // division as multiplication in reverse, 120 seconds. Answers go through the moment they're
  // right (no Enter key); a wrong answer just sits there until you fix it. Score = number right.
  const ZM_KEY = 'qt-zetamac';
  const ZM_DEFAULT = { add: true, sub: true, mul: true, div: true, addA: [2, 100], addB: [2, 100], mulA: [2, 12], mulB: [2, 100], secs: 120 };
  const ZM_SECS = [30, 60, 120, 300, 600];
  const zmSettings = () => {
    try {
      const s = JSON.parse(localStorage.getItem(ZM_KEY) || 'null');
      return zmValid(s) ? s : { ...ZM_DEFAULT };
    } catch {
      return { ...ZM_DEFAULT };
    }
  };
  const range = (r) => Array.isArray(r) && r.length === 2 && r.every((x) => Number.isInteger(x) && x >= 0 && x <= 10000) && r[0] <= r[1];
  function zmValid(s) {
    return !!s && ['add', 'sub', 'mul', 'div'].some((k) => s[k] === true) && range(s.addA) && range(s.addB) && range(s.mulA) && range(s.mulB) && s.mulA[0] >= 1 && ZM_SECS.includes(s.secs);
  }
  const zmIsDefault = (s) => JSON.stringify(s) === JSON.stringify(ZM_DEFAULT);
  const zmSummary = (s) => [s.add && `+ (${s.addA.join('–')}) + (${s.addB.join('–')})`, s.sub && '− in reverse', s.mul && `× (${s.mulA.join('–')}) × (${s.mulB.join('–')})`, s.div && '÷ in reverse'].filter(Boolean).join(' · ') + ` · ${s.secs} s`;

  // One question. `only` restricts to one operation (used by speed reps and drills).
  function zmQuestion(s, only) {
    const ops = only ? [only] : ['add', 'sub', 'mul', 'div'].filter((k) => s[k]);
    const op = R.pick(ops);
    if (op === 'add' || op === 'sub') {
      const a = R.int(...s.addA), b = R.int(...s.addB);
      return op === 'add' ? { q: `${a} + ${b}`, a: a + b, kind: 'zAdd', v: [a, b] } : { q: `${a + b} − ${a}`, a: b, kind: 'zSub', v: [a + b, a] };
    }
    const a = R.int(...s.mulA), b = R.int(...s.mulB);
    return op === 'mul' ? { q: `${a} × ${b}`, a: a * b, kind: 'zMul', v: [a, b] } : { q: `${a * b} ÷ ${a}`, a: b, kind: 'zDiv', v: [a * b, a] };
  }
  const ZM_KIND_OP = { zAdd: 'add', zSub: 'sub', zMul: 'mul', zDiv: 'div' };
  // A question of a given type, for speed reps and drills: Zetamac types use default settings.
  function genOfKind(kind) {
    if (ZM_KIND_OP[kind]) return zmQuestion(ZM_DEFAULT, ZM_KIND_OP[kind]);
    for (let t = 0; t < 300; t++) {
      const g = R.pick(gens)();
      if (g.kind === kind) return g;
    }
    return R.pick(gens)();
  }

  function zetamacCard() {
    const s = zmSettings(), st = store.get().mental, def = zmIsDefault(s);
    const bestD = st.zetamac?.best, bestC = st.zetamacCustom?.best;
    const num = (id, v, label) => `<input type="number" inputmode="numeric" min="0" max="10000" id="${id}" value="${v}" aria-label="${label}" class="zm-num">`;
    return `
      <div class="card wide">
        <h3>Zetamac</h3>
        <p class="small">The classic arithmetic speed game (<a href="https://arithmetic.zetamac.com/" target="_blank" rel="noopener">arithmetic.zetamac.com</a>). Each answer goes through the moment it's right, with no Enter key, so type fast and fix mistakes on the fly. Score = number right.</p>
        <p class="small"><b>${def ? 'Zetamac default settings' : 'Custom settings'}:</b> ${zmSummary(s)}</p>
        <p class="small">Best: <b>${bestD ?? '–'}</b> (default settings)${bestC != null ? ` · <b>${bestC}</b> (custom)` : ''}</p>
        <button data-mode="zetamac">Start</button>
        <details class="zm-settings"${def ? '' : ' open'}><summary>Settings</summary>
          <form id="zm-form">
            <label class="check"><input type="checkbox" id="zm-add" ${s.add ? 'checked' : ''}> Addition: (${num('zm-a1', s.addA[0], 'Addition, first number from')} to ${num('zm-a2', s.addA[1], 'Addition, first number to')}) + (${num('zm-b1', s.addB[0], 'Addition, second number from')} to ${num('zm-b2', s.addB[1], 'Addition, second number to')})</label>
            <label class="check"><input type="checkbox" id="zm-sub" ${s.sub ? 'checked' : ''}> Subtraction: addition problems in reverse</label>
            <label class="check"><input type="checkbox" id="zm-mul" ${s.mul ? 'checked' : ''}> Multiplication: (${num('zm-m1', s.mulA[0], 'Multiplication, first number from')} to ${num('zm-m2', s.mulA[1], 'Multiplication, first number to')}) × (${num('zm-n1', s.mulB[0], 'Multiplication, second number from')} to ${num('zm-n2', s.mulB[1], 'Multiplication, second number to')})</label>
            <label class="check"><input type="checkbox" id="zm-div" ${s.div ? 'checked' : ''}> Division: multiplication problems in reverse</label>
            <label for="zm-secs">Duration</label>
            <select id="zm-secs" style="margin-left:8px">${ZM_SECS.map((v) => `<option value="${v}" ${v === s.secs ? 'selected' : ''}>${v < 60 ? `${v} seconds` : `${v / 60} minute${v > 60 ? 's' : ''}`}</option>`).join('')}</select>
            <div class="row" style="margin-top:10px"><button type="button" class="ghost" id="zm-reset">Zetamac defaults</button><span class="small" id="zm-msg" aria-live="polite"></span></div>
          </form>
        </details>
      </div>`;
  }

  function wireZetamac(el, rerender) {
    const $ = (id) => el.querySelector('#' + id), form = $('zm-form');
    const read = () => ({
      add: $('zm-add').checked, sub: $('zm-sub').checked, mul: $('zm-mul').checked, div: $('zm-div').checked,
      addA: [+$('zm-a1').value, +$('zm-a2').value], addB: [+$('zm-b1').value, +$('zm-b2').value],
      mulA: [+$('zm-m1').value, +$('zm-m2').value], mulB: [+$('zm-n1').value, +$('zm-n2').value], secs: +$('zm-secs').value,
    });
    form.addEventListener('change', () => {
      const s = read();
      if (!zmValid(s)) return ($('zm-msg').textContent = 'Pick at least one operation; each range needs whole numbers with "from" ≤ "to" (multiplication from 1).');
      try { localStorage.setItem(ZM_KEY, JSON.stringify(s)); } catch { /* storage blocked: applies this visit */ }
      rerender();
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    $('zm-reset').addEventListener('click', () => {
      try { localStorage.removeItem(ZM_KEY); } catch { /* storage blocked */ }
      rerender();
    });
  }

  function zetamac(el) {
    const s = zmSettings(), def = zmIsDefault(s), key = def ? 'zetamac' : 'zetamacCustom', end = Date.now() + s.secs * 1000;
    const answered = [];
    let cur = null, shownAt = 0, done = false;
    el.innerHTML = `
      <h1>Zetamac <span class="small">${def ? 'default settings' : 'custom'}</span></h1>
      <div class="card" id="mm-card">
        <div class="mm-top"><span id="mm-time"></span><span id="mm-score">Score: 0</span></div>
        <div class="mm-q" id="mm-q" aria-live="polite"></div>
        <form class="answer-row" id="zm-play" autocomplete="off">
          <input type="text" id="mm-in" inputmode="numeric" autocomplete="off" placeholder="Type the answer" aria-label="Your answer">
        </form>
        <p class="small" style="margin:8px 0 0">No Enter needed: the next question appears as soon as your answer is right.</p>
      </div>`;
    const $ = (sel) => el.querySelector(sel), $in = $('#mm-in'), $q = $('#mm-q'), $s = $('#mm-score'), $t = $('#mm-time');
    const timer = setInterval(tick, 200);
    QT.cleanup = () => clearInterval(timer);
    function next() {
      cur = zmQuestion(s);
      $q.textContent = cur.q;
      $in.value = '';
      shownAt = Date.now();
    }
    $in.addEventListener('input', () => {
      if (done) return;
      const v = QT.parseAnswer($in.value);
      if (v === cur.a) {
        answered.push({ ...cur, ok: true, you: String(v), ms: Date.now() - shownAt });
        $s.textContent = `Score: ${answered.length}`;
        next();
      }
    });
    $('#zm-play').addEventListener('submit', (e) => e.preventDefault());
    QT.keypad.attach($('#zm-play'), [$in], () => {});
    function tick() {
      const left = Math.max(0, end - Date.now());
      $t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (!left) finish();
    }
    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      QT.cleanup = null;
      const score = answered.length, st = store.get(), rec = (st.mental[key] ||= { best: null, runs: [] }), prev = rec.best;
      // The question you were stuck on when time ran out is saved for review too, if you'd
      // already spent longer than your threshold on it.
      const stuckMs = Date.now() - shownAt;
      if (cur && stuckMs > slowSecs() * 1000) answered.push({ ...cur, ok: false, you: 'time ran out', ms: stuckMs });
      rec.best = prev === null ? score : Math.max(prev, score);
      rec.runs.push({ date: new Date().toISOString(), correct: score, wrong: 0 });
      if (rec.runs.length > 50) rec.runs.shift();
      recordSpeed(answered);
      const added = scheduleReps(answered, slowSecs());
      store.touchDay();
      store.save();
      const avg = score ? (s.secs / score).toFixed(1) : '–';
      el.innerHTML = `
        <div class="title-row"><h1>Zetamac: done</h1>${prev === null || score > prev ? QT.flair.milestone('New best') : ''}</div>
        <div class="tiles">
          <div class="tile"><div class="v">${score}</div><div class="k">score (${def ? 'default settings' : 'custom'})</div></div>
          <div class="tile"><div class="v">${rec.best}</div><div class="k">personal best</div></div>
          <div class="tile"><div class="v">${avg}</div><div class="k">seconds per answer</div></div>
        </div>
        ${review(answered, slowSecs())}
        ${added.length ? `<p class="small">Added to your speed reps: ${added.map((k) => QT.mentalTips.KINDS[k].label).join(', ')}.</p>` : ''}
        <div class="row" style="margin-top:18px"><button id="again">Play again</button><a class="btn ghost" href="#/mental">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => zetamac(el));
      wireReview(el);
    }
    tick();
    next();
    if (!QT.keypad.enabled()) $in.focus();
  }

  // ---- speed reps: spaced, timed practice of one question type ----
  // A type with 2+ slow or missed answers in a run is scheduled for tomorrow. Each rep is 8 timed
  // questions of that type; pass (≤1 miss, median under your threshold) and it comes back after
  // 3, then 7, then 21 days, then graduates; fail and it's back tomorrow.
  const DAY = 864e5, REP_GAPS = [1, 3, 7, 21], REP_N = 8;

  function recordSpeed(answered) {
    const s = store.get();
    for (const x of answered) {
      const sp = (s.speed[x.kind] ||= { times: [], oks: [] });
      sp.times.push(Math.min(x.ms, 60000));
      sp.oks.push(x.ok ? 1 : 0);
      if (sp.times.length > 30) { sp.times.shift(); sp.oks.shift(); }
    }
  }

  function scheduleReps(answered, secs) {
    const rv = store.get().speedReview, bad = {}, added = [];
    for (const x of answered) if (!x.ok || x.ms > secs * 1000) bad[x.kind] = (bad[x.kind] || 0) + 1;
    for (const [k, n] of Object.entries(bad)) {
      if (n >= 2 && !rv[k] && QT.mentalTips.KINDS[k]) {
        rv[k] = { box: 0, due: Date.now() + DAY };
        added.push(k);
      }
    }
    return added;
  }

  const dueReps = () => Object.entries(store.get().speedReview).filter(([k, r]) => r.due <= Date.now() && QT.mentalTips.KINDS[k]).map(([k]) => k);
  const whenDue = (t) => { const d = Math.ceil((t - Date.now()) / DAY); return d <= 0 ? 'due now' : d === 1 ? 'due tomorrow' : `due in ${d} days`; };

  function repsCard() {
    const items = Object.entries(store.get().speedReview).filter(([k]) => QT.mentalTips.KINDS[k]).sort((a, b) => a[1].due - b[1].due);
    if (!items.length) return '';
    return `<h2>Speed reps</h2>
      <div class="card">
        <p class="small" style="margin-top:0">Question types that slowed you down come back as ${REP_N}-question timed sets until they're quick: after 1, 3, 7 and 21 days.</p>
        ${items.map(([k, r]) => {
          const due = r.due <= Date.now();
          return `<div class="switch-row"><span><b>${QT.mentalTips.KINDS[k].label}</b><br><span class="small">${whenDue(r.due)} · stage ${r.box + 1} of 4</span></span>
            <a class="btn${due ? '' : ' ghost'}" href="#/mental/rep/${k}">${due ? 'Start' : 'Practise early'}</a></div>`;
        }).join('')}
      </div>`;
  }

  // The drill button inside a review needs its handler whenever a review is drawn.
  function wireReview(el) {
    const b = el.querySelector('#drill-slow');
    if (b) b.addEventListener('click', () => drill(el, b.dataset.kinds.split(',')));
  }

  function rep(el, kind) {
    const T = QT.mentalTips, K = T.KINDS[kind], secs = slowSecs(), answered = [];
    let cur = null, n = 0, shownAt = 0;
    el.innerHTML = `
      <a class="back" href="#/mental">← Mental maths</a>
      <h1>Speed rep: ${K.label}</h1>
      <p class="lede">${REP_N} questions, each timed on its own. Pass with at most one miss and a median under ${secs} s.</p>
      <div class="card" id="mm-card">
        <div class="mm-top"><span id="rp-n"></span><span id="rp-t" class="mono"></span></div>
        <div class="mm-q" id="rp-q" aria-live="polite"></div>
        <form class="answer-row" id="rp-form">
          <input type="text" id="rp-in" inputmode="decimal" autocomplete="off" placeholder="Answer, then Enter" aria-label="Your answer">
          <button>Enter</button>
        </form>
        <div class="q-actions"><span class="small" id="rp-hint">Use the fast method: <a href="#/tricks/${K.guide}">${(QT.tricks || []).find((t) => t.id === K.guide)?.title || 'guide'}</a></span><button type="button" class="link" id="rp-pass">Pass</button></div>
      </div>`;
    const $ = (s) => el.querySelector(s), $in = $('#rp-in'), form = $('#rp-form'), hint = $('#rp-hint'), baseHint = hint.innerHTML;
    const timer = setInterval(() => { $('#rp-t').textContent = `${((Date.now() - shownAt) / 1000).toFixed(1)} s`; }, 100);
    QT.cleanup = () => clearInterval(timer);
    const make = () => genOfKind(kind);
    function next() {
      if (n >= REP_N) return finish();
      cur = make();
      n++;
      $('#rp-n').textContent = `${n} / ${REP_N}`;
      $('#rp-q').textContent = cur.q;
      $in.value = '';
      hint.innerHTML = baseHint;
      shownAt = Date.now();
      if (!QT.keypad.enabled()) $in.focus();
    }
    const answer = (ok, shown) => {
      answered.push({ ...cur, ok, you: shown, ms: Date.now() - shownAt });
      next();
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!$in.value.trim()) return;
      const v = QT.parseAnswer($in.value);
      if (Number.isNaN(v)) return (hint.textContent = "Couldn't read that. Try 0.25, 1/4 or 25%.");
      answer(Math.abs(v - cur.a) <= (cur.tol ?? 0.005), $in.value.trim());
    });
    $('#rp-pass').addEventListener('click', () => answer(false, 'passed'));
    QT.keypad.attach(form, [$in], () => form.requestSubmit());

    function finish() {
      clearInterval(timer);
      QT.cleanup = null;
      const times = answered.map((x) => x.ms).sort((a, b) => a - b), median = times[Math.floor(times.length / 2)] / 1000;
      const misses = answered.filter((x) => !x.ok).length, passed = misses <= 1 && median <= secs;
      const rv = store.get().speedReview, r = rv[kind] || { box: 0, due: 0 };
      let fate, mark = '';
      if (passed && r.box >= 3) {
        delete rv[kind];
        fate = 'Fourth pass in a row: this type is off your list.';
        mark = QT.flair.milestone('Mastered');
      } else if (passed) {
        r.box++;
        r.due = Date.now() + REP_GAPS[r.box] * DAY;
        rv[kind] = r;
        fate = `Passed. Next rep in ${REP_GAPS[r.box]} days.`;
        mark = QT.flair.stamp('Passed');
      } else {
        r.box = 0;
        r.due = Date.now() + DAY;
        rv[kind] = r;
        fate = `Not yet: ${misses > 1 ? `${misses} misses` : `median ${median.toFixed(1)} s`}. It's back tomorrow; read the fast methods below first.`;
      }
      recordSpeed(answered);
      store.touchDay();
      store.save();
      QT.flair.ticker(); // the due count changed
      el.innerHTML = `
        <a class="back" href="#/mental">← Mental maths</a>
        <div class="title-row"><h1>Speed rep: ${K.label}</h1>${mark}</div>
        <div class="tiles">
          <div class="tile"><div class="v">${median.toFixed(1)}</div><div class="k">median seconds (target ${secs})</div></div>
          <div class="tile"><div class="v">${REP_N - misses}/${REP_N}</div><div class="k">correct</div></div>
        </div>
        <div class="card"><p style="margin:0">${fate}</p></div>
        ${review(answered, secs)}
        <div class="row" style="margin-top:18px"><button id="again">Go again</button><a class="btn ghost" href="#/mental">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => rep(el, kind));
      wireReview(el);
    }
    next();
  }

  // Your speed by question type over recent runs, slowest first, each with its guide.
  function speedCard(secs) {
    const rows = QT.mentalTips.speedTable(store.get().speed);
    if (!rows.length) return '';
    const guide = (id) => (QT.tricks || []).find((t) => t.id === id);
    return `<h2>Your speed by question type</h2>
      <div class="card table-wrap"><table>
        <tr><th>Type</th><th class="num">Median</th><th class="num">Missed</th><th>Guide</th></tr>
        ${rows.map((r) => `<tr><td>${r.label}</td><td class="num ${r.median > secs ? 'neg' : ''}">${r.median.toFixed(1)} s</td><td class="num">${Math.round(r.missRate * 100)}%</td><td>${guide(r.guide) ? `<a href="#/tricks/${r.guide}">${guide(r.guide).title}</a>` : ''}</td></tr>`).join('')}
      </table><p class="small">Over up to your last 30 answers of each type, from 80 in 8, Zetamac and speed reps. Red: slower than your ${secs} s review threshold.</p></div>`;
  }

  // End-of-session review: per-type timings, then each slow or missed question with the fastest
  // way to do it on its own numbers and a link to the guide that teaches the method.
  function review(answered, secs) {
    if (!answered.length) return '';
    const T = QT.mentalTips, guide = (id) => (QT.tricks || []).find((t) => t.id === id);
    const isFlagged = (x) => !x.ok || x.ms > secs * 1000;
    // Missed first, then the slowest.
    const flagged = answered.filter(isFlagged).sort((x, y) => (x.ok === y.ok ? y.ms - x.ms : x.ok ? 1 : -1));
    const byKind = {};
    for (const x of answered) (byKind[x.kind] ||= []).push(x);
    const kinds = Object.entries(byKind)
      .map(([k, xs]) => ({ k, n: xs.length, avg: xs.reduce((s, x) => s + x.ms, 0) / xs.length / 1000, bad: xs.filter(isFlagged).length }))
      .sort((x, y) => y.avg - x.avg);
    const weak = kinds.filter((x) => x.bad).map((x) => x.k);
    const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;
    const item = (x) => {
      const fw = T.fastWay(x), g = fw && guide(fw.guide);
      const tag = x.ok ? '<span class="flag slow">slow</span>' : `<span class="flag bad">${['passed', 'time ran out'].includes(x.you) ? x.you : `✗ you said ${esc(x.you)}`}</span>`;
      return `<div class="card review-item">
        <div class="review-head"><span class="mono">${esc(x.q)} = <b>${QT.fmtNum(x.a)}</b></span><span class="review-meta">${tag}<span class="mono small">${sec(x.ms)}</span></span></div>
        ${fw ? `<p class="small review-how"><b>Faster: ${fw.name}.</b> ${fw.steps}${g ? ` <a href="#/tricks/${g.id}">Guide: ${g.title} →</a>` : ''}</p>` : ''}
      </div>`;
    };
    const nMissed = flagged.filter((x) => !x.ok).length;
    // Up to 10 of each, so a run with many misses still shows the slow ones.
    const shown = [...flagged.filter((x) => !x.ok).slice(0, 10), ...flagged.filter((x) => x.ok).slice(0, 10)];
    return `
      <h2>Review</h2>
      <p class="small">${flagged.length ? `${flagged.length} question${flagged.length > 1 ? 's' : ''} to look at: ${nMissed} missed, ${flagged.length - nMissed} right but slower than ${secs} s.` : `Every answer was right and under ${secs} s. Try a lower threshold.`}</p>
      <div class="card table-wrap"><table>
        <tr><th>Question type</th><th class="num">Asked</th><th class="num">Average time</th><th class="num">Slow or missed</th></tr>
        ${kinds.map((x) => `<tr><td>${T.KINDS[x.k]?.label || x.k}</td><td class="num">${x.n}</td><td class="num ${x.avg > secs ? 'neg' : ''}">${x.avg.toFixed(1)} s</td><td class="num">${x.bad || '–'}</td></tr>`).join('')}
      </table></div>
      ${shown.map(item).join('')}
      ${flagged.length > shown.length ? `<p class="small">…and ${flagged.length - shown.length} more of the same types.</p>` : ''}
      ${weak.length ? `<div class="row" style="margin-top:12px"><button class="ghost" id="drill-slow" data-kinds="${weak.slice(0, 4).join(',')}">Practise these types (10 questions, untimed)</button></div>` : ''}`;
  }

  // Untimed drill on the question types you were slow at or missed; each solution is the fast method.
  function drill(el, kinds) {
    const T = QT.mentalTips, labels = kinds.map((k) => T.KINDS[k]?.label).filter(Boolean);
    el.innerHTML = `<a class="back" href="#/mental">← Mental maths</a><h1>Speed drill</h1><p class="lede">${labels.join(', ')}. Untimed: use the fast method each time, then compare with the worked solution.</p><div id="sd-box"></div>`;
    const make = genOfKind;
    let k = 0;
    const source = () => {
      if (k >= 10) return null;
      const g = make(kinds[k % kinds.length]), fw = T.fastWay(g);
      k++;
      return {
        tag: `Speed drill ${k}/10 · ${T.KINDS[g.kind].label}`, practiceOnly: true, record: () => {},
        p: { q: g.q, a: g.a, tol: { abs: g.tol ?? 0.005, rel: 0 }, sol: fw ? `<b>${fw.name}.</b> ${fw.steps}` : '' },
      };
    };
    QT.ui.questionCard(el.querySelector('#sd-box'), source, (box, r) => {
      box.innerHTML = `<div class="card"><h3>${r.right}/${r.solved} correct</h3><div class="row"><button id="sd-again">Another 10</button><a class="btn ghost" href="#/mental">Back to mental maths</a></div></div>`;
      box.querySelector('#sd-again').addEventListener('click', () => drill(el, kinds));
    });
  }

  // Best 80-in-8 net score in either answer style (for the coach, home screen and roadmap).
  const best80 = () => {
    const m = store.get().mental, vals = [m.full?.best, m.fullTyped?.best].filter((x) => x !== null && x !== undefined);
    return vals.length ? Math.max(...vals) : null;
  };

  QT.mental = { render, gens, options, best80, review, scheduleReps, dueReps, zmQuestion, zmValid, ZM_DEFAULT, genOfKind };
})();
