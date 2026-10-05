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
    sprint: { label: '2-minute sprint', secs: 120, scoring: 'correct', desc: 'Type your answers. A daily warm-up; aim for 20+.' },
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

  function render(el) {
    const st = store.get().mental, style = savedStyle();
    const best = (k) => st[k]?.best ?? '–';
    el.innerHTML = `
      <h1>Mental maths</h1>
      <p class="lede">Market-making firms screen with fast arithmetic tests. Speed comes from practice plus a handful of tricks you can learn in an afternoon.</p>
      <a class="card shortcut primary" href="#/tricks" style="margin-bottom:16px"><b>Learn the speed tricks →</b><span>20 short guides (squaring, near-100 multiplication, fractions, last-digit checks, guessing strategy…) each with a practice drill</span></a>
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
        <div class="card">
          <h3>${MODES.sprint.label}</h3>
          <p class="small">${MODES.sprint.desc}</p>
          <p class="small">Best: <b>${best('sprint')}</b> correct${st.sprint?.runs?.length ? ` · ${st.sprint.runs.length} runs` : ''}</p>
          <button data-mode="sprint">Start</button>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <label for="slow">Review questions slower than</label>
        <select id="slow" style="margin-left:8px">${SLOW_CHOICES.map((v) => `<option value="${v}" ${v === slowSecs() ? 'selected' : ''}>${v} seconds</option>`).join('')}</select>
        <p class="small" style="margin:6px 0 0">After each run, slow and missed questions come back with the fastest way to do each one and the guide that teaches it. 80 in 8 needs about 6 seconds a question.</p>
      </div>`;
    el.querySelector('#slow').addEventListener('change', (e) => {
      try { localStorage.setItem(SLOW_KEY, e.target.value); } catch { /* storage blocked */ }
    });
    el.querySelectorAll('[data-style]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.setItem(STYLE_KEY, a.dataset.style); } catch { /* storage blocked: choice lasts this visit */ }
      render(el);
    }));
    el.querySelector('[data-mode="full"]').addEventListener('click', () => run(el, 'full', savedStyle()));
    el.querySelector('[data-mode="sprint"]').addEventListener('click', () => run(el, 'sprint', 'typed'));
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
      store.touchDay();
      store.save();
      const acc = correct + wrong ? Math.round((100 * correct) / (correct + wrong)) : 0;
      el.innerHTML = `
        <h1>${mode.label}: done</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${score}</div><div class="k">${net ? 'net score' : 'correct'}${prevBest === null || score > prevBest ? ' · new best!' : ''}</div></div>
          <div class="tile"><div class="v">${correct} / ${wrong}</div><div class="k">right / wrong</div></div>
          <div class="tile"><div class="v">${acc}%</div><div class="k">accuracy</div></div>
          <div class="tile"><div class="v">${rec.best}</div><div class="k">personal best${modeId === 'full' ? ` (${mc ? 'multiple choice' : 'typed'})` : ''}</div></div>
        </div>
        ${review(answered, slowSecs())}
        <div class="row" style="margin-top:18px"><button id="again">Go again</button><a class="btn ghost" href="#/mental">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => run(el, modeId, style));
      const drillBtn = el.querySelector('#drill-slow');
      if (drillBtn) drillBtn.addEventListener('click', () => drill(el, drillBtn.dataset.kinds.split(',')));
    }

    tick();
    next();
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
      const tag = x.ok ? '<span class="flag slow">slow</span>' : `<span class="flag bad">${x.you === 'passed' ? 'passed' : `✗ you said ${esc(x.you)}`}</span>`;
      return `<div class="card review-item">
        <div class="review-head"><span class="mono">${esc(x.q)} = <b>${QT.fmtNum(x.a)}</b></span><span class="review-meta">${tag}<span class="mono small">${sec(x.ms)}</span></span></div>
        ${fw ? `<p class="small review-how"><b>Faster: ${fw.name}.</b> ${fw.steps}${g ? ` <a href="#/tricks/${g.id}">Guide: ${g.title} →</a>` : ''}</p>` : ''}
      </div>`;
    };
    const nMissed = flagged.filter((x) => !x.ok).length;
    return `
      <h2>Review</h2>
      <p class="small">${flagged.length ? `${flagged.length} question${flagged.length > 1 ? 's' : ''} to look at: ${nMissed} missed, ${flagged.length - nMissed} right but slower than ${secs} s.` : `Every answer was right and under ${secs} s. Try a lower threshold.`}</p>
      <div class="card table-wrap"><table>
        <tr><th>Question type</th><th class="num">Asked</th><th class="num">Average time</th><th class="num">Slow or missed</th></tr>
        ${kinds.map((x) => `<tr><td>${T.KINDS[x.k]?.label || x.k}</td><td class="num">${x.n}</td><td class="num ${x.avg > secs ? 'neg' : ''}">${x.avg.toFixed(1)} s</td><td class="num">${x.bad || '–'}</td></tr>`).join('')}
      </table></div>
      ${flagged.slice(0, 15).map(item).join('')}
      ${flagged.length > 15 ? `<p class="small">…and ${flagged.length - 15} more of the same types.</p>` : ''}
      ${weak.length ? `<div class="row" style="margin-top:12px"><button class="ghost" id="drill-slow" data-kinds="${weak.slice(0, 4).join(',')}">Practise these types (10 questions, untimed)</button></div>` : ''}`;
  }

  // Untimed drill on the question types you were slow at or missed; each solution is the fast method.
  function drill(el, kinds) {
    const T = QT.mentalTips, labels = kinds.map((k) => T.KINDS[k]?.label).filter(Boolean);
    el.innerHTML = `<a class="back" href="#/mental">← Mental maths</a><h1>Speed drill</h1><p class="lede">${labels.join(', ')}. Untimed: use the fast method each time, then compare with the worked solution.</p><div id="sd-box"></div>`;
    const make = (kind) => {
      for (let t = 0; t < 200; t++) {
        const g = R.pick(gens)();
        if (g.kind === kind) return g;
      }
      return R.pick(gens)();
    };
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

  QT.mental = { render, gens, options, best80, review };
})();
