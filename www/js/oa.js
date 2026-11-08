// Online-assessment practice. Many trading firms screen with timed online tests before any
// interview: number sequences (seq.js), short cognitive games (games.js) and memory tasks (here).
// Our own versions of those kinds of task, not copies of any firm's test.
(function () {
  const store = QT.store;

  // Everything with a personal best on this page. Sequence tests and games add their own entries
  // below (keys must also be listed in core.js OA_KEYS so saved results survive a reload).
  const TESTS = {
    span: { name: 'Digit span', unit: 'digits', desc: 'Digits flash one at a time; type them back in order. Each success adds a digit; two misses end the test. Most people manage about 7.' },
    total: { name: 'Running total', unit: 'of 5', desc: 'Numbers flash one at a time, faster each round. Keep a running total in your head and type it at the end. 5 rounds.' },
  };
  for (const [k, m] of Object.entries(QT.seq.MODES)) TESTS[k] = { name: `Sequences: ${m.name}`, unit: `of ${m.n}`, desc: m.desc };
  for (const [k, g] of Object.entries(QT.games.GAMES)) TESTS[k] = { name: g.name, unit: g.unit, desc: g.desc };

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

  // Results of the current "all games" run, in order.
  let battery = null;

  function render(el, a, b, c) {
    if (a === 'seq') {
      if (b === 'practice') return QT.seq.practice(el, c || 'all');
      if (b === 'fam') return QT.seq.practice(el, 'all', c);
      if (b === 'test') {
        const key = QT.seq.MODES[c] ? c : 'seq';
        const run = () => QT.seq.test(el, key, (e, k, score, extra) => finishCard(e, k, score, extra, run));
        return run();
      }
      return QT.seq.hub(el);
    }
    if (a === 'game' && QT.games.GAMES[b]) return playGame(el, b, null);
    if (a === 'battery') {
      const i = Math.max(0, Math.floor(+b || 0));
      if (i === 0) battery = [];
      if (!battery) { location.hash = '#/oa/battery/0'; return; }
      if (i >= QT.games.ORDER.length) return batteryDone(el);
      return playGame(el, QT.games.ORDER[i], i);
    }
    if (a === 'span') return span(el);
    if (a === 'total') return total(el);
    hub(el);
  }

  function playGame(el, key, idx) {
    const g = QT.games.GAMES[key];
    // A short intro first, so the clock never starts before you've read the rules.
    el.innerHTML = `
      <p class="small"><a href="#/oa">← Online tests</a>${idx !== null ? ` · Game ${idx + 1} of ${QT.games.ORDER.length}` : ''}</p>
      <h1>${g.name}</h1>
      <p class="eyebrow">${g.skill} · about ${g.mins} min</p>
      <p class="lede">${g.desc}</p>
      <div class="row"><button id="g-go">Start</button>${idx !== null ? `<a class="btn ghost" href="#/oa/battery/${idx + 1}">Skip this game</a>` : ''}</div>`;
    const go = () => g.play(el, (e, k, score, extra) => {
      if (idx !== null && battery) battery[idx] = { key: k, score };
      finishCard(e, k, score, extra, () => playGame(el, key, idx), idx);
    });
    el.querySelector('#g-go').addEventListener('click', go);
  }

  function batteryDone(el) {
    const rows = QT.games.ORDER.map((k, i) => {
      const g = QT.games.GAMES[k], r = battery[i], best = store.get().oa[k]?.best;
      return `<tr><td>${g.name}</td><td>${g.skill}</td><td>${r ? r.score : 'skipped'}</td><td>${best ?? '–'}</td></tr>`;
    }).join('');
    el.innerHTML = `
      <h1>All games: done</h1>
      <p class="lede">One full run of the games, as in a game-based assessment. Compare each score with your best: the weakest one is the skill to practise.</p>
      <div class="table-wrap"><table><thead><tr><th>Game</th><th>Skill</th><th>This run</th><th>Your best</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="row" style="margin-top:18px"><a class="btn" href="#/oa/battery/0">Run them all again</a><a class="btn ghost" href="#/oa">Back</a></div>`;
    battery = null;
  }

  function hub(el) {
    const oa = store.get().oa, G = QT.games.GAMES;
    const best = (k) => (oa[k]?.best ?? '–');
    const seqBest = Object.keys(QT.seq.MODES).filter((k) => oa[k]?.best != null).map((k) => `${oa[k].best} of ${QT.seq.MODES[k].n}`);
    const totalMins = Math.round(QT.games.ORDER.reduce((s, k) => s + G[k].mins, 0));
    el.innerHTML = `
      <h1>Online tests</h1>
      <p class="lede">Before any interview, many trading firms screen with timed online tests: arithmetic, number sequences, and short games that measure memory, attention, timing and risk-taking. Few candidates practise the games. These are our own versions of those kinds of task, not copies of any firm's test.</p>
      <h2>Number sequences</h2>
      <div class="card">
        <p>${QT.seq.FAMILIES.length} kinds of pattern in three levels: practice that explains every answer, and timed tests of 15, 24 and 26 questions. It tracks which patterns you miss.</p>
        <p class="small">${seqBest.length ? `Best: ${seqBest.join(' · ')}` : 'No tests yet.'}</p>
        <div class="row"><a class="btn" href="#/oa/seq">Open sequences</a><a class="btn ghost" href="#/oa/seq/test/seq">Quick test: 15 in 7½ min</a></div>
      </div>
      <h2>Cognitive games</h2>
      <p class="small">Game-based assessments (Optiver's Zap-N, IMC's games and others) run a set of short games, each testing one skill. These seven cover the same skills with our own games. Each takes a minute or two.</p>
      <div class="grid">${QT.games.ORDER.map((k) => `
        <div class="card">
          <h3>${G[k].name}</h3>
          <p class="eyebrow">${G[k].skill}</p>
          <p class="small">${G[k].desc}</p>
          <p class="small">Best: <b>${best(k)}</b> ${G[k].unit}${oa[k]?.runs?.length ? ` · ${oa[k].runs.length} runs` : ''}</p>
          <a class="btn" href="#/oa/game/${k}">Play</a>
        </div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><a class="btn" href="#/oa/battery/0">Play all seven in a row (about ${totalMins} min)</a></div>
      <h2>Memory tests</h2>
      <div class="grid">${['span', 'total'].map((k) => `
        <div class="card">
          <h3>${TESTS[k].name}</h3>
          <p class="small">${TESTS[k].desc}</p>
          <p class="small">Best: <b>${best(k)}</b> ${TESTS[k].unit}${oa[k]?.runs?.length ? ` · ${oa[k].runs.length} runs` : ''}</p>
          <a class="btn" href="#/oa/${k}">Start</a>
        </div>`).join('')}</div>
      <p class="small">Arithmetic screens: see <a href="#/mental">Mental maths</a> (80 in 8), <a href="#/mental/60in6">60 in 6</a> (the Flow Traders format) and the <a href="#/tricks">speed tricks</a>.</p>`;
  }

  function finishCard(el, key, score, extra, again, idx = null) {
    const isBest = record(key, score), t = TESTS[key];
    const nextBtn = idx !== null
      ? `<a class="btn" href="#/oa/battery/${idx + 1}">${idx + 1 < QT.games.ORDER.length ? `Next: ${QT.games.GAMES[QT.games.ORDER[idx + 1]].name}` : 'See all results'}</a>`
      : '';
    const back = Object.prototype.hasOwnProperty.call(QT.seq.MODES, key) ? '#/oa/seq' : '#/oa';
    el.innerHTML = `
      <div class="title-row"><h1>${t.name}: done</h1>${isBest ? QT.flair.milestone('New best') : ''}</div>
      <div class="tiles">
        <div class="tile"><div class="v">${score}</div><div class="k">${t.unit}${isBest ? ' · new best!' : ''}</div></div>
        <div class="tile"><div class="v">${store.get().oa[key].best}</div><div class="k">personal best</div></div>
      </div>
      ${extra || ''}
      <div class="row" style="margin-top:18px">${nextBtn}<button id="again"${nextBtn ? ' class="ghost"' : ''}>Go again</button><a class="btn ghost" href="${back}">Back</a></div>`;
    el.querySelector('#again').addEventListener('click', () => {
      if (QT.cleanup) QT.cleanup();
      QT.cleanup = null;
      again();
    });
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
        const h = setTimeout(() => finishCard(el, 'span', best, `<p class="small">Tip: say the digits to yourself in groups of three as they appear (“4 7 1 · 9 2 5”); chunking is how memory champions extend span.</p>`, () => span(el)), 900);
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
        const h = setTimeout(() => finishCard(el, 'total', right, '<p class="small">Tip: say the running total to yourself after every number rather than trying to remember the numbers.</p>', () => total(el)), 900);
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
