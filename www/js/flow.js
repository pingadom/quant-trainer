// Flow training for Zetamac's addition and subtraction. Fast players describe two modes: an
// automatic one, where the answer just appears (about a second), and a thinking one, where they
// work it out step by step (two seconds or more). This screen measures which kinds of sum put
// you in each mode, then trains both: a rhythm drill (a pace bar that tightens as you keep up,
// for automatic recall) and a method drill (a faster method for your slowest kind of sum, then
// timed reps until it is automatic too).
//
// Every + and − answer from Zetamac and from these drills is logged (state.flow.log, the last
// 1000 as [op, x, y, ms]); x op y is the question as shown.
(function () {
  const store = QT.store, R = QT.rand, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const AUTO = 1300, THINK = 2000; // ms: under AUTO counts as automatic, over THINK as thinking mode
  const RHYTHM_SECS = 120, GUIDED = 4, TIMED = 10;
  const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

  // ---------------------------------------------------------------- kinds of sum
  // a + b, or m − s = d, with Zetamac's default numbers (2–100, subtraction as addition reversed).
  const tensOf = (n) => n - (n % 10);
  const round89 = (n) => n >= 10 && n % 10 >= 8; // ends in 8 or 9: round it up to the next ten
  function classify(op, x, y) {
    if (op === '+') {
      const carry = (x % 10) + (y % 10) >= 10;
      if (carry && (round89(x) || round89(y))) return 'add-round';
      if (x < 100 && y < 100 && x + y >= 100) return 'add-cross';
      return carry ? 'add-carry' : 'add-easy';
    }
    const d = x - y, borrow = x % 10 < y % 10;
    if (borrow && round89(y)) return 'sub-round';
    if (x >= 100 && d < 100 && y < 100) return 'sub-cross';
    return borrow ? 'sub-borrow' : 'sub-easy';
  }

  // Each kind's faster method, with the worked steps for any question of that kind.
  const PATTERNS = {
    'add-easy': {
      label: 'Adding, no carry', eg: ['+', 42, 35], method: 'Add the tens, then the ones.',
      steps: (a, b) => {
        const [big, small] = a >= b ? [a, b] : [b, a], t = tensOf(small), o = small % 10;
        return t && o ? `${big} + ${t} = ${big + t}, + ${o} = ${a + b}` : `${big} + ${small} = ${a + b}`;
      },
    },
    'add-carry': {
      label: 'Adding with a carry', eg: ['+', 47, 26], method: 'Tens first. Then fill up to the next ten and add what is left of the ones.',
      steps: (a, b) => {
        const [big, small] = a >= b ? [a, b] : [b, a], t = tensOf(small), o = small % 10, mid = big + t, fill = 10 - (mid % 10);
        return `${t ? `${big} + ${t} = ${mid}, ` : ''}${mid} + ${fill} = ${mid + fill}${o > fill ? `, + ${o - fill} = ${a + b}` : ''}`;
      },
    },
    'add-round': {
      label: 'Adding a number ending in 8 or 9', eg: ['+', 47, 29], method: 'Round it up to the next ten, add that, then take the extra back.',
      steps: (a, b) => {
        const r = round89(b) && (!round89(a) || b % 10 >= a % 10) ? b : a, other = r === a ? b : a, up = 10 - (r % 10);
        return `${other} + ${r + up} = ${other + r + up}, − ${up} = ${a + b}`;
      },
    },
    'add-cross': {
      label: 'Adding past 100', eg: ['+', 64, 57], method: 'Make 100 first: top the bigger number up to 100 from the other one, then add what is left.',
      steps: (a, b) => {
        const [big, small] = a >= b ? [a, b] : [b, a], need = 100 - big;
        return small === need ? `${big} + ${small} = 100` : `${big} + ${need} = 100, + ${small - need} = ${a + b}`;
      },
    },
    'sub-easy': {
      label: 'Subtracting, no borrow', eg: ['-', 87, 35], method: 'Take away the tens, then the ones.',
      steps: (m, s) => {
        const t = tensOf(s), o = s % 10;
        return t && o ? `${m} − ${t} = ${m - t}, − ${o} = ${m - s}` : `${m} − ${s} = ${m - s}`;
      },
    },
    'sub-borrow': {
      label: 'Subtracting with a borrow', eg: ['-', 74, 36], method: 'Count up instead: from the smaller number to the next ten, then on to the bigger one. Taking away a single digit, go down to the ten first: 83 − 7 is 83 − 3 = 80, then − 4.',
      steps: (m, s) => {
        if (s < 10) return m % 10 ? `${m} − ${m % 10} = ${tensOf(m)}, − ${s - (m % 10)} = ${m - s}` : `${m} − 10 = ${m - 10}, + ${10 - s} = ${m - s}`;
        const ten = tensOf(s) + 10;
        return m === ten ? `${s} up to ${m} is ${m - s}` : `${s} up to ${ten} is ${ten - s}, ${ten} up to ${m} is ${m - ten}, so ${m - s}`;
      },
    },
    'sub-round': {
      label: 'Subtracting a number ending in 8 or 9', eg: ['-', 74, 39], method: 'Take away the next ten up, then give back the extra.',
      steps: (m, s) => {
        const up = 10 - (s % 10);
        return `${m} − ${s + up} = ${m - s - up}, + ${up} = ${m - s}`;
      },
    },
    'sub-cross': {
      label: 'Subtracting back across 100', eg: ['-', 132, 57], method: 'Count up through 100: from the smaller number to 100, then add what is over 100.',
      steps: (m, s) => (m === 100 ? `${s} up to 100 is ${100 - s}` : `${s} up to 100 is ${100 - s}, + ${m - 100} = ${m - s}`),
    },
  };
  const ORDER = ['add-easy', 'add-carry', 'add-round', 'add-cross', 'sub-easy', 'sub-borrow', 'sub-round', 'sub-cross'];

  const make = (op, x, y) => ({ op, x, y, a: op === '+' ? x + y : x - y, q: `${x} ${op === '+' ? '+' : '−'} ${y}`, kind: classify(op, x, y) });
  // A random Zetamac question; `only` fixes the operation, `kind` the kind of sum.
  function question(only, kind) {
    for (let t = 0; t < 5000; t++) {
      const op = only || (kind ? (kind.startsWith('add') ? '+' : '-') : R.pick(['+', '-']));
      const a = R.int(2, 100), b = R.int(2, 100), q = op === '+' ? make('+', a, b) : make('-', a + b, a);
      if (!kind || q.kind === kind) return q;
    }
    return make('+', 2, 2);
  }

  // ---------------------------------------------------------------- the log and its summary
  const flow = () => store.get().flow;
  function record(items) {
    const log = flow().log;
    for (const x of items) log.push([x.op, x.x, x.y, Math.round(Math.min(x.ms, 60000))]);
    if (log.length > 1000) log.splice(0, log.length - 1000);
  }
  // Zetamac's answers (kinds zAdd, zSub) into the log.
  function recordZetamac(answered) {
    record(answered.filter((x) => x.ok && (x.kind === 'zAdd' || x.kind === 'zSub')).map((x) => ({ op: x.kind === 'zAdd' ? '+' : '-', x: x.v[0], y: x.v[1], ms: x.ms })));
  }
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
  function summary(log = flow().log) {
    const byKind = Object.fromEntries(ORDER.map((k) => [k, []]));
    for (const [op, x, y, ms] of log) byKind[classify(op, x, y)].push(ms);
    const all = log.map((r) => r[3]);
    const share = (xs, f) => (xs.length ? xs.filter(f).length / xs.length : 0);
    const kinds = ORDER.map((k) => ({ kind: k, n: byKind[k].length, median: median(byKind[k]), auto: share(byKind[k], (m) => m < AUTO), think: share(byKind[k], (m) => m > THINK) }));
    return { n: all.length, median: median(all), auto: share(all, (m) => m < AUTO), think: share(all, (m) => m > THINK), kinds };
  }
  // The kind most worth a method drill: slowest median among kinds with enough answers.
  const slowest = (sm = summary()) => sm.kinds.filter((k) => k.n >= 5).sort((a, b) => b.median - a.median)[0] || null;
  const pct = (x) => `${Math.round(x * 100)}%`;

  // A short card for the Zetamac results screen (call after recordZetamac). The split is for this
  // game; the slowest kind comes from the whole log, since one game has few sums of each kind.
  function resultCard(answered) {
    const items = answered.filter((x) => x.ok && (x.kind === 'zAdd' || x.kind === 'zSub')).map((x) => [x.kind === 'zAdd' ? '+' : '-', x.v[0], x.v[1], x.ms]);
    if (items.length < 5) return '';
    const sm = summary(items), slow = slowest(), worst = slow && slow.median >= AUTO ? slow : null;
    return `<div class="card"><h3>Your + and − in this game</h3>
      <p style="margin-top:0">${pct(sm.auto)} automatic (under ${sec(AUTO)}), ${pct(sm.think)} in thinking mode (over ${sec(THINK)}).${worst ? ` Your slowest kind of sum so far: <b>${PATTERNS[worst.kind].label.toLowerCase()}</b>, typically ${sec(worst.median)}.` : ''}</p>
      <div class="row"><a class="btn" href="#/mental/flow">Flow training</a>${worst ? `<a class="btn ghost" href="#/mental/flow/method/${worst.kind}">Method drill: ${esc(PATTERNS[worst.kind].label.toLowerCase())}</a>` : ''}</div></div>`;
  }

  // ---------------------------------------------------------------- screens
  function render(el, sub, arg) {
    if (sub === 'rhythm') return rhythmIntro(el);
    if (sub === 'method' && PATTERNS[arg]) return methodIntro(el, arg);
    overview(el);
  }

  function overview(el) {
    const sm = summary(), worst = slowest(sm), runs = flow().rhythm;
    const lastPace = runs.length ? runs[runs.length - 1].pace : null;
    el.innerHTML = `
      <a class="back" href="#/mental">← Mental maths</a>
      <h1>Flow training: + and −</h1>
      <p class="lede">Some of your Zetamac answers come almost instantly and others take two seconds or more. The fast ones are recalled automatically; the slow ones are worked out step by step. This finds the kinds of sum that push you into working it out, then trains both modes.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${sm.n}</div><div class="k">+ and − answers logged</div></div>
        <div class="tile"><div class="v">${sm.n ? pct(sm.auto) : '–'}</div><div class="k">automatic (under ${sec(AUTO)})</div></div>
        <div class="tile"><div class="v">${sm.n ? pct(sm.think) : '–'}</div><div class="k">thinking mode (over ${sec(THINK)})</div></div>
        <div class="tile"><div class="v">${lastPace ? sec(lastPace) : '–'}</div><div class="k">last rhythm pace</div></div>
      </div>
      <div class="grid">
        <div class="card">
          <h3>Rhythm drill (2 minutes)</h3>
          <p class="small">For the automatic mode. A bar sets the pace; keep up and it gets faster, fall behind and it eases off, so you practise right at the edge of your fast mode. Skip anything that makes you stop and think.</p>
          <a class="btn" href="#/mental/flow/rhythm">Start a rhythm drill</a>
        </div>
        <div class="card">
          <h3>Method drill</h3>
          <p class="small">For your slowest kind of sum: a faster method with worked steps, then timed reps until it comes quickly too.</p>
          ${worst ? `<a class="btn" href="#/mental/flow/method/${worst.kind}">Method drill: ${esc(PATTERNS[worst.kind].label.toLowerCase())}</a>` : '<p class="small"><b>Play a Zetamac game with + and − (or a rhythm drill) first, so this can find your slowest kind of sum.</b></p>'}
        </div>
      </div>
      <h2>Where you slow down</h2>
      <div class="card table-wrap">
        <table class="flow-table">
          <thead><tr><th>Kind of sum</th><th>Example and method</th><th class="num">Answers</th><th class="num">Typical time</th><th class="num">Automatic</th><th></th></tr></thead>
          <tbody>${sm.kinds.map((k) => {
            const P = PATTERNS[k.kind], [op, x, y] = P.eg, enough = k.n >= 5;
            return `<tr class="${enough && k.median > THINK ? 'flow-slow' : ''}"><td>${P.label}</td><td><span class="mono">${x} ${op === '+' ? '+' : '−'} ${y}</span>: <span class="small">${P.steps(x, y)}</span></td>
              <td class="num">${k.n}</td><td class="num hl">${enough ? sec(k.median) : '–'}</td><td class="num hl">${enough ? pct(k.auto) : '–'}</td>
              <td><a href="#/mental/flow/method/${k.kind}" aria-label="Method drill: ${P.label}">Drill</a></td></tr>`;
          }).join('')}</tbody>
        </table>
        <p class="small">From your last ${flow().log.length || 'few'} + and − answers in Zetamac and these drills. Times include typing. Red: typically over ${sec(THINK)}. Kinds with fewer than 5 answers show a dash.</p>
      </div>
      <h2>A 10-minute routine</h2>
      <div class="card">
        <ol class="flow-routine">
          <li><a href="#/mental">Zetamac</a>, 2 minutes: a baseline, and it updates the table above.</li>
          <li>A <b>method drill</b> on your slowest kind of sum, about 3 minutes.</li>
          <li>A <b>rhythm drill</b>, 2 minutes, to make it automatic.</li>
          <li>Zetamac again. Compare the automatic share on the results screen.</li>
        </ol>
        <p class="small" style="margin-bottom:0"><b>When you notice yourself narrating the sum mid-game,</b> don't try to calculate harder. Ease off, look at the numbers rather than the score or the clock, and keep a steady rhythm. Studies of skilled performance under pressure find that watching yourself step by step can disrupt a practised skill (Beilock and Carr, 2001), and automaticity comes from many fast repetitions of the same patterns (Logan, 1988). The rhythm drill is that repetition; the method drill gives the slow patterns a quicker route to repeat.</p>
      </div>`;
  }

  // Zetamac-style answer box: the answer goes through as soon as it's right.
  function answerBox(el, onAnswer) {
    const form = el.querySelector('#fl-form'), input = el.querySelector('#fl-in');
    input.addEventListener('input', () => {
      const v = QT.parseAnswer(input.value);
      if (Number.isFinite(v)) onAnswer(v);
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    QT.keypad.attach(form, [input], () => {}, { keys: '', enter: false });
    if (!QT.keypad.enabled()) input.focus();
    return input;
  }
  const playCard = (extra = '') => `
    <div class="card" id="fl-card">
      <div class="mm-top"><span id="fl-left"></span><span id="fl-info"></span></div>
      ${extra}
      <div class="mm-q" id="fl-q" aria-live="polite"></div>
      <form class="answer-row" id="fl-form" autocomplete="off"><input type="text" id="fl-in" inputmode="numeric" autocomplete="off" placeholder="Type the answer" aria-label="Your answer"></form>
    </div>`;

  // ---------------------------------------------------------------- rhythm drill
  // Pace adapts by a staircase: three answers in a row on the beat make it 7% faster; an answer
  // off the beat makes it 7% slower. That settles where you keep up about four times in five.
  const FASTER = 0.93, SLOWER = 1.07, MIN_PACE = 500, MAX_PACE = 4000;
  function step(pace, onBeat, streak) {
    if (!onBeat) return { pace: Math.min(MAX_PACE, Math.round(pace * SLOWER)), streak: 0 };
    return streak + 1 >= 3 ? { pace: Math.max(MIN_PACE, Math.round(pace * FASTER)), streak: 0 } : { pace, streak: streak + 1 };
  }
  // Start a little slower than your typical answer, rounded to 0.1 s.
  function startPace() {
    const m = summary().median;
    return m === null || flow().log.length < 20 ? 2000 : Math.min(MAX_PACE, Math.max(MIN_PACE, Math.round((m * 1.1) / 100) * 100));
  }

  function rhythmIntro(el) {
    const only = (() => { try { return ['+', '-'].includes(localStorage.getItem('qt-flow-op')) ? localStorage.getItem('qt-flow-op') : ''; } catch { return ''; } })();
    el.innerHTML = `
      <a class="back" href="#/mental/flow">← Flow training</a>
      <h1>Rhythm drill</h1>
      <p class="lede">Two minutes of Zetamac-style + and −. A bar empties at your current pace: answer before it runs out and you're on the beat. Three on the beat in a row and the pace quickens; miss one and it eases off. It starts at ${sec(startPace())}.</p>
      <div class="card">
        <p style="margin-top:0"><b>How to do it.</b> Don't narrate the sum; let the answer come. If one makes you stop and work it out, skip it (Esc, or the Skip button). There's no penalty, and skipped sums go into your list of slow ones. Being off the beat is normal: the drill is set so you keep up about four times in five.</p>
        <div class="seg" role="radiogroup" aria-label="Operations">${[['', '+ and −'], ['+', '+ only'], ['-', '− only']].map(([k, v]) => `<a href="#" role="radio" data-op="${k}" aria-checked="${only === k}" class="${only === k ? 'on' : ''}">${v}</a>`).join('')}</div>
        <button class="btn-lg" id="fl-go">Start</button>
      </div>`;
    el.querySelectorAll('[data-op]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.setItem('qt-flow-op', a.dataset.op); } catch { /* choice lasts this visit */ }
      rhythmIntro(el);
    }));
    el.querySelector('#fl-go').addEventListener('click', () => rhythm(el, only || null));
  }

  function rhythm(el, only) {
    let pace = startPace(), streak = 0, cur = null, shownAt = 0, done = false;
    const start = pace, end = Date.now() + RHYTHM_SECS * 1000, answered = [], skipped = [];
    let fastest = pace;
    el.innerHTML = `<h1>Rhythm drill</h1>${playCard('<div class="flow-bar" aria-hidden="true"><i id="fl-bar"></i></div>')}
      <div class="row" style="margin-top:10px"><button type="button" class="ghost" id="fl-skip">Skip (Esc)</button><span class="small" id="fl-beat" aria-live="polite"></span></div>`;
    const $ = (s) => el.querySelector(s), bar = $('#fl-bar');
    const show = () => {
      cur = question(only);
      $('#fl-q').textContent = cur.q;
      $('#fl-in').value = '';
      $('#fl-info').textContent = `Pace ${sec(pace)}`;
      shownAt = Date.now();
      bar.style.transition = 'none';
      bar.style.width = '100%';
      void bar.offsetWidth; // restart the bar
      bar.style.transition = `width ${pace}ms linear`;
      bar.style.width = '0%';
    };
    const after = (onBeat) => {
      ({ pace, streak } = step(pace, onBeat, streak));
      fastest = Math.min(fastest, pace);
      $('#fl-beat').textContent = onBeat ? 'On the beat' : 'Behind the beat: easing off';
      $('#fl-card').classList.toggle('fl-off', !onBeat);
      show();
    };
    const input = answerBox(el, (v) => {
      if (done || v !== cur.a) return;
      const ms = Date.now() - shownAt;
      answered.push({ ...cur, ms, onBeat: ms <= pace, pace });
      after(ms <= pace);
    });
    const skip = () => {
      if (done) return;
      skipped.push({ ...cur, ms: Date.now() - shownAt });
      after(false);
      if (!QT.keypad.enabled()) input.focus();
    };
    $('#fl-skip').addEventListener('click', skip);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); skip(); } });
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      $('#fl-left').textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
      if (!left) finish();
    };
    const timer = setInterval(tick, 200);
    QT.cleanup = () => clearInterval(timer);
    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      QT.cleanup = null;
      record(answered);
      const onBeat = answered.filter((x) => x.onBeat).length;
      store.log(flow().rhythm, { pace, start, fastest, n: answered.length, onBeat, skipped: skipped.length }, 50);
      store.touchDay();
      store.save();
      // Kinds of sum that broke the rhythm: skipped, or answered in thinking mode.
      const slow = [...skipped, ...answered.filter((x) => x.ms > THINK)];
      const counts = {};
      for (const x of slow) counts[x.kind] = (counts[x.kind] || 0) + 1;
      const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      el.innerHTML = `
        <h1>Rhythm drill: done</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${answered.length}</div><div class="k">answered</div></div>
          <div class="tile"><div class="v">${answered.length ? pct(onBeat / answered.length) : '–'}</div><div class="k">on the beat</div></div>
          <div class="tile"><div class="v">${sec(start)} → ${sec(pace)}</div><div class="k">pace, start to end</div></div>
          <div class="tile"><div class="v">${sec(fastest)}</div><div class="k">fastest pace reached</div></div>
        </div>
        <div class="card">
          ${slow.length ? `<p style="margin-top:0">${slow.length} sum${slow.length > 1 ? 's' : ''} broke the rhythm (skipped, or over ${sec(THINK)}). Most often: <b>${PATTERNS[worst[0]].label.toLowerCase()}</b> (${worst[1]}).</p>
            <p class="small">${slow.slice(0, 12).map((x) => `<span class="mono">${esc(x.q)} = ${x.a}</span>`).join(' · ')}</p>
            <a class="btn" href="#/mental/flow/method/${worst[0]}">Method drill: ${esc(PATTERNS[worst[0]].label.toLowerCase())}</a>` : '<p style="margin:0">Nothing broke the rhythm. Next time it will start faster.</p>'}
        </div>
        <div class="row" style="margin-top:14px"><button id="fl-again">Again</button><a class="btn ghost" href="#/mental/flow">Flow training</a></div>`;
      el.querySelector('#fl-again').addEventListener('click', () => rhythm(el, only));
    }
    tick();
    show();
  }

  // ---------------------------------------------------------------- method drill
  function methodIntro(el, kind) {
    const P = PATTERNS[kind], k = summary().kinds.find((x) => x.kind === kind), [op, x, y] = P.eg, prev = flow().method[kind];
    el.innerHTML = `
      <a class="back" href="#/mental/flow">← Flow training</a>
      <h1>Method drill: ${esc(P.label.toLowerCase())}</h1>
      <div class="card">
        <p style="margin-top:0"><b>The method.</b> ${P.method}</p>
        <p class="mono flow-eg">${x} ${op === '+' ? '+' : '−'} ${y}: ${P.steps(x, y)}</p>
        <p class="small">First ${GUIDED} sums with the steps shown after each answer, at your own pace: say the steps to yourself. Then ${TIMED} timed sums, with no help.</p>
        <p class="small">${k && k.n >= 5 ? `Your typical time on these so far: <b>${sec(k.median)}</b>.` : 'Not enough of these logged yet to know your typical time.'}${prev ? ` Last method drill: ${sec(prev.ms)} (${prev.runs} drill${prev.runs > 1 ? 's' : ''}).` : ''}</p>
        <button class="btn-lg" id="fl-go">Start</button>
      </div>`;
    el.querySelector('#fl-go').addEventListener('click', () => method(el, kind));
  }

  function method(el, kind) {
    const P = PATTERNS[kind], timed = [];
    let i = 0, cur = null, shownAt = 0, waiting = false;
    el.innerHTML = `<h1>Method drill: ${esc(P.label.toLowerCase())}</h1>${playCard('<p class="small flow-tip" id="fl-tip"></p>')}
      <div id="fl-steps" class="flow-steps" aria-live="polite"></div>`;
    const $ = (s) => el.querySelector(s);
    const guided = () => i < GUIDED;
    const show = () => {
      if (i >= GUIDED + TIMED) return finish();
      cur = question(null, kind);
      waiting = false;
      $('#fl-q').textContent = cur.q;
      $('#fl-in').value = '';
      $('#fl-left').textContent = guided() ? `Guided ${i + 1} of ${GUIDED}` : `Timed ${i - GUIDED + 1} of ${TIMED}`;
      $('#fl-info').textContent = '';
      $('#fl-tip').textContent = guided() ? P.method : '';
      $('#fl-steps').innerHTML = guided() ? '<button type="button" class="ghost" id="fl-show">Show the steps</button>' : '';
      if (guided()) $('#fl-show').addEventListener('click', () => { $('#fl-steps').innerHTML = `<p class="mono">${P.steps(cur.x, cur.y)}</p>`; });
      shownAt = Date.now();
    };
    const input = answerBox(el, (v) => {
      if (waiting || v !== cur.a) return;
      const ms = Date.now() - shownAt;
      if (guided()) {
        // Show the steps and wait, so the method sinks in before the next sum.
        waiting = true;
        $('#fl-info').textContent = sec(ms);
        $('#fl-steps').innerHTML = `<p class="mono">${P.steps(cur.x, cur.y)}</p><button type="button" id="fl-next">Next</button>`;
        $('#fl-next').addEventListener('click', () => { i++; show(); if (!QT.keypad.enabled()) input.focus(); });
        $('#fl-next').focus();
        return;
      }
      timed.push({ ...cur, ms });
      i++;
      show();
    });
    function finish() {
      const before = summary().kinds.find((x) => x.kind === kind), mid = median(timed.map((x) => x.ms));
      record(timed);
      const m = (flow().method[kind] ||= { runs: 0, ms: 0 });
      m.runs++;
      m.ms = mid;
      store.touchDay();
      store.save();
      const fast = timed.filter((x) => x.ms < AUTO).length;
      el.innerHTML = `
        <h1>Method drill: done</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${sec(mid)}</div><div class="k">typical time, timed sums</div></div>
          <div class="tile"><div class="v">${before && before.n >= 5 ? sec(before.median) : '–'}</div><div class="k">your typical time before</div></div>
          <div class="tile"><div class="v">${fast}/${timed.length}</div><div class="k">automatic (under ${sec(AUTO)})</div></div>
        </div>
        <div class="card"><p style="margin:0">${mid < AUTO ? 'That is automatic speed. Now keep it there under pressure: a rhythm drill, then Zetamac.' : mid < THINK ? 'Quicker than thinking mode. A couple more of these over the next few days and it will be automatic.' : 'Still in thinking mode: that is normal on the first go. Do another, saying the steps quietly, and come back to it tomorrow.'}</p></div>
        <div class="row" style="margin-top:14px"><button id="fl-again">Again</button><a class="btn" href="#/mental/flow/rhythm">Rhythm drill</a><a class="btn ghost" href="#/mental/flow">Flow training</a></div>`;
      el.querySelector('#fl-again').addEventListener('click', () => method(el, kind));
    }
    show();
  }

  QT.flow = { render, classify, PATTERNS, ORDER, question, summary, slowest, step, record, recordZetamac, resultCard, AUTO, THINK };
})();
