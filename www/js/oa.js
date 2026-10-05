// Online-assessment practice. Many trading firms screen with timed online tests before any
// interview: number sequences, plus short memory and attention tasks. These are practice
// versions of those kinds of task, not copies of any firm's test.
(function () {
  const R = QT.rand, store = QT.store, f = QT.fmtNum;

  const TESTS = {
    seq: { name: 'Number sequences', unit: 'correct', desc: 'Find the next term. 15 questions in 7½ minutes, typed answers, skip any you are stuck on.' },
    span: { name: 'Digit span', unit: 'digits', desc: 'Digits flash one at a time; type them back in order. Each success adds a digit; two misses end the test. Most people manage about 7.' },
    total: { name: 'Running total', unit: 'of 5', desc: 'Numbers flash one at a time, faster each round. Keep a running total in your head and type it at the end. 5 rounds.' },
  };

  // Digit span: a random string of digits with no immediate repeats (repeats are hard to see).
  function spanDigits(n, rnd = Math.random) {
    const d = [];
    while (d.length < n) {
      const x = Math.floor(rnd() * 10);
      if (x !== d[d.length - 1]) d.push(x);
    }
    return d;
  }
  // Running total: a start value then signed steps; never non-integer, total kept positive.
  function totalRound(steps, rnd = Math.random) {
    const nums = [10 + Math.floor(rnd() * 41)];
    let sum = nums[0];
    while (nums.length < steps) {
      let x = 1 + Math.floor(rnd() * 19);
      if (rnd() < 0.45 && sum - x > 0) x = -x;
      nums.push(x);
      sum += x;
    }
    return { nums, sum };
  }
  const TOTAL_ROUNDS = [1600, 1400, 1200, 1000, 800]; // ms per number, one entry per round
  const TOTAL_STEPS = 8;

  function record(key, score) {
    const s = store.get(), rec = (s.oa[key] ||= { best: null, runs: [] });
    const prev = rec.best;
    rec.best = prev === null ? score : Math.max(prev, score);
    store.log(rec.runs, { score }, 50);
    store.touchDay();
    store.save();
    return prev === null || score > prev;
  }

  function render(el) {
    const oa = store.get().oa;
    el.innerHTML = `
      <h1>Online tests</h1>
      <p class="lede">Before any interview, many trading firms screen with timed online tests: arithmetic, number sequences, and short memory or attention games. Few candidates practise the last two. These are practice versions of those kinds of task, not copies of any firm's test.</p>
      <div class="grid">
        ${Object.entries(TESTS).map(([k, t]) => `
        <div class="card">
          <h3>${t.name}</h3>
          <p class="small">${t.desc}</p>
          <p class="small">Best: <b>${oa[k]?.best ?? '–'}</b> ${t.unit}${oa[k]?.runs?.length ? ` · ${oa[k].runs.length} runs` : ''}</p>
          <button data-test="${k}">Start</button>
        </div>`).join('')}
      </div>
      <p class="small">Arithmetic screens: see <a href="#/mental">Mental maths</a> (80 in 8) and the <a href="#/tricks">speed tricks</a>.</p>`;
    el.querySelectorAll('[data-test]').forEach((b) => b.addEventListener('click', () => ({ seq: sequences, span, total })[b.dataset.test](el)));
  }

  const finishCard = (el, key, score, extra) => {
    const isBest = record(key, score), t = TESTS[key];
    el.innerHTML = `
      <div class="title-row"><h1>${t.name}: done</h1>${isBest ? QT.flair.milestone('New best') : ''}</div>
      <div class="tiles">
        <div class="tile"><div class="v">${score}</div><div class="k">${t.unit}${isBest ? ' · new best!' : ''}</div></div>
        <div class="tile"><div class="v">${store.get().oa[key].best}</div><div class="k">personal best</div></div>
      </div>
      ${extra || ''}
      <div class="row" style="margin-top:18px"><button id="again">Go again</button><a class="btn ghost" href="#/oa">Back</a></div>`;
    el.querySelector('#again').addEventListener('click', () => ({ seq: sequences, span, total })[key](el));
  };

  // ---- number sequences ----
  function sequences(el) {
    const N = 15, SECS = 450, end = Date.now() + SECS * 1000, log = [];
    let i = 0, cur = null, done = false;
    el.innerHTML = `
      <h1>Number sequences</h1>
      <div class="session"><span id="sq-n"></span><span class="mono" id="sq-time"></span></div>
      <div class="card">
        <div class="question" id="sq-q"></div>
        <form class="answer-row" id="sq-form"><input type="text" inputmode="decimal" autocomplete="off" id="sq-in" aria-label="Next term" placeholder="Next term"><button>Enter</button></form>
        <div class="q-actions"><span class="small" id="sq-hint">Differences, ratios, alternate terms.</span><button type="button" class="link" id="sq-skip">Skip</button></div>
      </div>`;
    const $ = (s) => el.querySelector(s), $in = $('#sq-in');
    const timer = setInterval(() => tick(), 250);
    QT.cleanup = () => clearInterval(timer);
    function tick() {
      const left = Math.max(0, end - Date.now());
      $('#sq-time').textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (!left) finish();
    }
    function next() {
      if (i >= N) return finish();
      cur = R.pick(QT.gens.sequences)();
      $('#sq-n').textContent = `Question ${i + 1} of ${N}`;
      $('#sq-q').innerHTML = cur.q;
      $in.value = '';
      if (!QT.keypad.enabled()) $in.focus();
    }
    const answer = (v, shown) => {
      log.push({ p: cur, ok: Number.isFinite(v) && QT.isCorrect(v, cur.a, cur.tol), you: shown });
      i++;
      next();
    };
    const form = $('#sq-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (done || !$in.value.trim()) return;
      const v = QT.parseAnswer($in.value);
      if (Number.isNaN(v)) return ($('#sq-hint').textContent = "Couldn't read that number.");
      answer(v, $in.value.trim());
    });
    $('#sq-skip').addEventListener('click', () => answer(NaN, 'skipped'));
    QT.keypad.attach(form, [$in], () => form.requestSubmit());
    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      QT.cleanup = null;
      const score = log.filter((x) => x.ok).length;
      const wrong = log.filter((x) => !x.ok);
      finishCard(el, 'seq', score, `
        <p>${log.length} of ${N} answered${log.length < N ? ' before time ran out' : ''}.</p>
        ${wrong.length ? `<h2>Review</h2>${wrong.map((x) => `<div class="card"><div class="question">${x.p.q}</div><p class="small">You: ${QT.escapeHtml(x.you)} · answer <b>${f(x.p.a)}</b></p><div class="solution">${x.p.sol}</div></div>`).join('')}` : ''}`);
    }
    tick();
    next();
  }

  // Shows a sequence of items one at a time in `box`, then calls done(). Returns a cancel function.
  function flash(box, items, ms, done) {
    let k = 0, h = null;
    const step = () => {
      if (k >= items.length) {
        box.textContent = '';
        h = setTimeout(done, 300);
        return;
      }
      box.textContent = items[k++];
      h = setTimeout(() => {
        box.textContent = '';
        h = setTimeout(step, Math.min(250, ms / 5)); // brief blank so repeated values are visible
      }, ms);
    };
    h = setTimeout(step, 600);
    return () => clearTimeout(h);
  }

  // ---- digit span ----
  function span(el) {
    let len = 4, misses = 0, best = 0;
    el.innerHTML = `
      <h1>Digit span</h1>
      <div class="session"><span id="ds-len"></span><span id="ds-miss"></span></div>
      <div class="card">
        <div class="flash" id="ds-flash" aria-live="off"></div>
        <form class="answer-row" id="ds-form" hidden><input type="text" inputmode="numeric" autocomplete="off" id="ds-in" aria-label="The digits in order"><button>Enter</button></form>
        <p class="small" id="ds-msg" aria-live="polite">Watch the digits.</p>
      </div>`;
    const $ = (s) => el.querySelector(s), form = $('#ds-form'), $in = $('#ds-in');
    let cancel = () => {}, digits = [];
    QT.cleanup = () => cancel();
    function roundStart() {
      digits = spanDigits(len);
      $('#ds-len').textContent = `${len} digits`;
      $('#ds-miss').textContent = `Misses: ${misses}/2`;
      $('#ds-msg').textContent = 'Watch the digits.';
      form.hidden = true;
      cancel = flash($('#ds-flash'), digits, 900, () => {
        form.hidden = false;
        $in.value = '';
        $('#ds-msg').textContent = 'Type them in order.';
        $in.focus();
      });
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const typed = $in.value.replace(/\D/g, '');
      if (!typed) return;
      const ok = typed === digits.join('');
      form.hidden = true;
      if (ok) {
        best = Math.max(best, len);
        len++;
      } else misses++;
      $('#ds-flash').textContent = ok ? '✓' : `✗ ${digits.join('')}`;
      if (misses >= 2) {
        const h = setTimeout(() => finishCard(el, 'span', best, `<p class="small">Tip: say the digits to yourself in groups of three as they appear (“4 7 1 · 9 2 5”); chunking is how memory champions extend span.</p>`), 900);
        cancel = () => clearTimeout(h); // leaving within the pause must not draw over the next screen
        return;
      }
      const h = setTimeout(roundStart, 900);
      cancel = () => clearTimeout(h);
    });
    roundStart();
  }

  // ---- running total ----
  function total(el) {
    let r = 0, right = 0, cur = null;
    el.innerHTML = `
      <h1>Running total</h1>
      <div class="session"><span id="rt-r"></span><span id="rt-score"></span></div>
      <div class="card">
        <div class="flash" id="rt-flash" aria-live="off"></div>
        <form class="answer-row" id="rt-form" hidden><input type="text" inputmode="numeric" autocomplete="off" id="rt-in" aria-label="The total"><button>Enter</button></form>
        <p class="small" id="rt-msg" aria-live="polite"></p>
      </div>`;
    const $ = (s) => el.querySelector(s), form = $('#rt-form'), $in = $('#rt-in');
    let cancel = () => {};
    QT.cleanup = () => cancel();
    function roundStart() {
      cur = totalRound(TOTAL_STEPS);
      $('#rt-r').textContent = `Round ${r + 1} of ${TOTAL_ROUNDS.length}`;
      $('#rt-score').textContent = `${right} correct`;
      $('#rt-msg').textContent = 'Start from the first number, then add or subtract each one.';
      form.hidden = true;
      const shown = cur.nums.map((x, k) => (k === 0 ? String(x) : x > 0 ? `+${x}` : `−${-x}`));
      cancel = flash($('#rt-flash'), shown, TOTAL_ROUNDS[r], () => {
        form.hidden = false;
        $in.value = '';
        $('#rt-msg').textContent = "What's the total?";
        $in.focus();
      });
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = QT.parseAnswer($in.value);
      if (!Number.isFinite(v)) return;
      const ok = v === cur.sum;
      if (ok) right++;
      form.hidden = true;
      $('#rt-flash').textContent = ok ? '✓' : `✗ ${cur.sum}`;
      if (++r >= TOTAL_ROUNDS.length) {
        const h = setTimeout(() => finishCard(el, 'total', right, '<p class="small">Tip: say the running total to yourself after every number rather than trying to remember the numbers.</p>'), 900);
        cancel = () => clearTimeout(h);
        return;
      }
      const h = setTimeout(roundStart, 900);
      cancel = () => clearTimeout(h);
    });
    roundStart();
  }

  QT.oa = { render, spanDigits, totalRound, TESTS };
})();
