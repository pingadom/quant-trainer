// Timed mental arithmetic. "full" mimics the widely reported 80-in-8 trading-firm screen:
// 80 multiple-choice questions in 8 minutes, +1 right / −1 wrong, no going back.
(function () {
  const R = QT.rand, store = QT.store;
  const round = (x, dp) => Math.round(x * 10 ** dp) / 10 ** dp;
  const dpOf = (x) => { const s = String(round(x, 4)); return s.includes('.') ? s.split('.')[1].length : 0; };

  const MODES = {
    sprint: { label: '2-minute sprint', secs: 120, mc: false, desc: 'Type your answers. A daily warm-up; aim for 20+.' },
    full: { label: '80 in 8', secs: 480, max: 80, mc: true, desc: 'Multiple choice, +1 right, −1 wrong, no going back. The format commonly reported for trading-firm numerical screens: ~55 net is a commonly quoted pass line, 70+ is strong.' },
  };

  const gens = [
    () => { const a = R.int(12, 99), b = R.int(12, 99); return { q: `${a} × ${b}`, a: a * b }; },
    () => { const a = R.int(101, 999), b = R.int(3, 9); return { q: `${a} × ${b}`, a: a * b }; },
    () => { const a = R.float(1, 99, 2), b = R.float(1, 99, 2); return Math.random() < 0.5 ? { q: `${a} + ${b}`, a: round(a + b, 2) } : { q: `${a} − ${b}`, a: round(a - b, 2) }; },
    () => { const d = R.int(3, 19), k = R.int(11, 99); return { q: `${d * k} ÷ ${d}`, a: k }; },
    () => { const d = R.pick([3, 6, 7, 8, 9, 11, 12, 16]); let n = R.int(1, d - 1); while (QT.m.gcd(n, d) !== 1) n = R.int(1, d - 1); return { q: `${n}/${d} (3 dp)`, a: round(n / d, 3), tol: 0.0006 }; },
    () => { const p = R.pick([5, 12.5, 15, 20, 25, 35, 40, 60, 75, 120]), y = R.int(2, 80) * 10; return { q: `${p}% of ${y}`, a: round((p * y) / 100, 2) }; },
    () => { const n = R.int(11, 35); return { q: `${n}²`, a: n * n }; },
    () => { const a = R.float(0.1, 9.9, 1), b = R.int(2, 9); return { q: `${a} × ${b}`, a: round(a * b, 2) }; },
    () => { const a = R.int(100, 999), b = R.int(100, 999); return { q: `${a} − ${b}`, a: a - b }; },
    () => { const a = R.int(12, 99), x = R.float(1.1, 9.9, 1); return { q: `${a} × ? = ${round(a * x, 2)}`, a: x }; },
    () => { const x = R.int(100, 999), b = R.int(100, 999); return { q: `? + ${b} = ${x + b}`, a: x }; },
  ];

  // Plausible wrong answers: off-by-one-unit, off-by-ten-units and decimal-point slips.
  function options(ans) {
    const dp = Math.min(dpOf(ans), 3), u = 10 ** -dp;
    const cand = [ans + u, ans - u, ans + 2 * u, ans - 2 * u, ans + 10 * u, ans - 10 * u, ans + 11 * u, ans * 10, ans / 10]
      .map((x) => round(x, dp))
      .filter((x) => x !== round(ans, dp) && (ans < 0 || x >= 0));
    const uniq = [...new Set(cand)].sort(() => Math.random() - 0.5).slice(0, 3);
    return [round(ans, dp), ...uniq].sort(() => Math.random() - 0.5).map((x) => ({ v: x, label: x.toFixed(Math.min(dpOf(x), 3)) }));
  }

  function render(el) {
    const st = store.get().mental;
    el.innerHTML = `
      <h1>Mental maths</h1>
      <p class="lede">Market-making firms screen with fast arithmetic tests. Speed comes from practice plus a few tricks: 47 × 53 = 50² − 3², 25% = ÷4, 12.5% = ÷8. Know your fractions (1/7 ≈ 0.143, 1/8 = 0.125, 1/9 ≈ 0.111).</p>
      <div class="grid">
        ${Object.entries(MODES).map(([id, m]) => `
          <div class="card">
            <h3>${m.label}</h3>
            <p class="small">${m.desc}</p>
            <p class="small">Best: <b>${st[id]?.best ?? '–'}</b> ${m.mc ? 'net' : 'correct'}${st[id]?.runs?.length ? ` · ${st[id].runs.length} runs` : ''}</p>
            <button data-mode="${id}">Start</button>
          </div>`).join('')}
      </div>`;
    el.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => run(el, b.dataset.mode)));
  }

  function run(el, modeId) {
    const mode = MODES[modeId];
    let cur, correct = 0, wrong = 0, n = 0, done = false;
    const missed = [];
    const end = Date.now() + mode.secs * 1000;

    el.innerHTML = `
      <h1>${mode.label}</h1>
      <div class="card" id="mm-card">
        <div class="mm-top"><span id="mm-time"></span><span id="mm-score"></span></div>
        <div class="mm-q" id="mm-q"></div>
        ${mode.mc
          ? `<div class="mc" id="mm-mc"></div><p class="small" style="margin-top:10px">Tap an answer (or press 1–4). Wrong answers cost a point, so don't guess blindly.</p>`
          : `<form class="answer-row" id="mm-form">
               <input type="text" id="mm-in" inputmode="decimal" autocomplete="off" placeholder="Answer, then Enter">
               <button>Enter</button>
             </form>`}
      </div>`;
    const $q = el.querySelector('#mm-q'), $t = el.querySelector('#mm-time'), $s = el.querySelector('#mm-score'), $card = el.querySelector('#mm-card');

    const flash = (ok) => {
      $card.classList.remove('flash-ok', 'flash-bad');
      void $card.offsetWidth;
      $card.classList.add(ok ? 'flash-ok' : 'flash-bad');
      if (!ok && navigator.vibrate) navigator.vibrate(30);
    };
    const answer = (ok, shown) => {
      flash(ok);
      if (ok) correct++;
      else {
        wrong++;
        missed.push({ q: cur.q, a: cur.a, you: shown });
      }
      if (mode.max && n >= mode.max) finish();
      else next();
    };

    let $in, $mc;
    if (mode.mc) {
      $mc = el.querySelector('#mm-mc');
      $mc.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) answer(b.dataset.ok === '1', b.textContent);
      });
      const onKey = (e) => {
        const i = '1234'.indexOf(e.key);
        if (i >= 0 && $mc.children[i]) $mc.children[i].click();
      };
      document.addEventListener('keydown', onKey);
      QT.cleanup = () => { clearInterval(timer); document.removeEventListener('keydown', onKey); };
    } else {
      $in = el.querySelector('#mm-in');
      const form = el.querySelector('#mm-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = QT.parseAnswer($in.value);
        if (Number.isNaN(v)) return;
        answer(Math.abs(v - cur.a) <= (cur.tol ?? 0.005), $in.value);
      });
      QT.keypad.attach(form, [$in], () => form.requestSubmit());
    }

    function next() {
      cur = R.pick(gens)();
      n++;
      $q.textContent = cur.q;
      if (mode.mc) {
        $mc.innerHTML = options(cur.a).map((o, i) => `<button type="button" data-ok="${Math.abs(o.v - cur.a) < 1e-9 || (cur.tol && Math.abs(o.v - cur.a) <= cur.tol) ? 1 : 0}"><span class="small">${i + 1}</span> ${o.label}</button>`).join('');
      } else {
        $in.value = '';
        if (!QT.keypad.enabled()) $in.focus();
      }
      $s.textContent = mode.mc ? `net ${correct - wrong}  ·  Q${n}/${mode.max}` : `✓ ${correct}  ✗ ${wrong}`;
    }

    const tick = () => {
      const left = Math.max(0, end - Date.now());
      $t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (left <= 0) finish();
    };
    const timer = setInterval(tick, 200);
    if (!mode.mc) QT.cleanup = () => clearInterval(timer);

    function finish() {
      if (done) return;
      done = true;
      if (QT.cleanup) QT.cleanup();
      QT.cleanup = null;
      const score = mode.mc ? correct - wrong : correct;
      const s = store.get();
      const rec = (s.mental[modeId] ||= { best: null, runs: [] });
      const prevBest = rec.best;
      rec.best = prevBest === null ? score : Math.max(prevBest, score);
      rec.runs.push({ date: new Date().toISOString(), correct, wrong });
      if (rec.runs.length > 50) rec.runs.shift();
      store.touchDay();
      store.save();
      const acc = correct + wrong ? Math.round((100 * correct) / (correct + wrong)) : 0;
      el.innerHTML = `
        <h1>${mode.label}: done</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${score}</div><div class="k">${mode.mc ? 'net score' : 'correct'}${prevBest === null || score > prevBest ? ' · new best!' : ''}</div></div>
          <div class="tile"><div class="v">${correct} / ${wrong}</div><div class="k">right / wrong</div></div>
          <div class="tile"><div class="v">${acc}%</div><div class="k">accuracy</div></div>
          <div class="tile"><div class="v">${rec.best}</div><div class="k">personal best</div></div>
        </div>
        ${missed.length ? `<h2>Missed</h2><div class="card table-wrap"><table><tr><th>Question</th><th class="num">You</th><th class="num">Answer</th></tr>
          ${missed.map((m) => `<tr><td class="mono">${m.q}</td><td class="num neg">${m.you.replace(/^\d\s+/, '')}</td><td class="num">${QT.fmtNum(m.a)}</td></tr>`).join('')}</table></div>` : ''}
        <div class="row" style="margin-top:18px"><button id="again">Go again</button><a class="btn ghost" href="#/mental">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => run(el, modeId));
    }

    tick();
    next();
  }

  QT.mental = { render };
})();
