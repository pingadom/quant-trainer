// Cognitive games: short timed games that test the skills trading-firm game assessments measure
// (switching between rules, working memory, checking detail at speed, arithmetic under pressure,
// timing, juggling several things at once, and taking risk sensibly). Our own designs, built on
// standard tasks from psychology; none copies a firm's game.
(function () {
  const R = QT.rand, esc = QT.escapeHtml;
  const now = () => performance.now();

  // Keyboard for a game: keys → handler, removed when the screen changes.
  function keys(map) {
    const h = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const fn = map[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }
  // Several cleanups as one QT.cleanup.
  function cleanups() {
    const fns = [];
    QT.cleanup = () => { fns.splice(0).forEach((f) => { try { f(); } catch { /* already gone */ } }); };
    return (f) => fns.push(f);
  }
  const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const head = (name, bar = '') => `<h1>${name}</h1><div class="session">${bar}</div>`;

  // A countdown that calls tick(leftMs) and done() when time is up.
  function countdown(ms, tick, done, add) {
    const end = Date.now() + ms;
    const id = setInterval(() => { const left = Math.max(0, end - Date.now()); tick(left); if (!left) { clearInterval(id); done(); } }, 200);
    add(() => clearInterval(id));
    tick(ms);
    return () => clearInterval(id);
  }

  // =========================================================== 1. Rule switch
  // A digit appears in the top or bottom box. Top: odd or even? Bottom: lower or higher than 5?
  const SWITCH_SECS = 90;
  function ruleSwitch(el, finish) {
    const add = cleanups();
    el.innerHTML = `${head('Rule switch', '<span id="g-score">Score 0</span><span class="mono" id="g-time"></span>')}
      <div class="card gm-switch">
        <div class="gm-box" id="sw-top"><span class="gm-cue">Odd or even?</span><b id="sw-tn"></b></div>
        <div class="gm-box" id="sw-bot"><span class="gm-cue">Lower or higher than 5?</span><b id="sw-bn"></b></div>
        <div class="gm-pair"><button id="sw-l" class="gm-key"><kbd>F</kbd> Odd / Lower</button><button id="sw-r" class="gm-key"><kbd>J</kbd> Even / Higher</button></div>
        <p class="small" id="sw-msg" aria-live="polite">The box the number appears in tells you which question to answer.</p>
      </div>`;
    const $ = (s) => el.querySelector(s);
    let cur = null, shown = 0, t0 = now(), done = false, locked = false, right = 0, wrong = 0;
    const log = [];
    function next() {
      const top = cur ? (Math.random() < 0.4 ? !cur.top : cur.top) : Math.random() < 0.5;
      const n = R.pick([1, 2, 3, 4, 6, 7, 8, 9]);
      cur = { top, n, sw: log.length > 0 && top !== log[log.length - 1].top };
      $('#sw-tn').textContent = top ? n : '';
      $('#sw-bn').textContent = top ? '' : n;
      $('#sw-top').classList.toggle('on', top);
      $('#sw-bot').classList.toggle('on', !top);
      shown = now();
    }
    function answer(left) {
      if (done || locked || !cur) return;
      const want = cur.top ? cur.n % 2 === 1 : cur.n < 5; // left = odd / lower
      const ok = left === want, ms = now() - shown;
      log.push({ ...cur, ok, ms, t: now() - t0, q: `${cur.n} (${cur.top ? 'odd or even' : 'lower or higher'})`, al: cur.top ? (cur.n % 2 ? 'odd' : 'even') : cur.n < 5 ? 'lower' : 'higher' });
      ok ? right++ : wrong++;
      $('#g-score').textContent = `Score ${right - wrong}`;
      if (ok) return next();
      locked = true; // a short pause after a mistake, so guessing doesn't pay
      $('#sw-msg').textContent = 'Wrong: half-second pause.';
      const h = setTimeout(() => { locked = false; $('#sw-msg').textContent = ''; next(); }, 500);
      add(() => clearTimeout(h));
    }
    $('#sw-l').addEventListener('click', () => answer(true));
    $('#sw-r').addEventListener('click', () => answer(false));
    add(keys({ f: () => answer(true), j: () => answer(false), ArrowLeft: () => answer(true), ArrowRight: () => answer(false) }));
    countdown(SWITCH_SECS * 1000, (l) => ($('#g-time').textContent = clock(l)), () => {
      done = true;
      const rep = log.filter((x, i) => i && !x.sw && x.ok).map((x) => x.ms), sw = log.filter((x) => x.sw && x.ok).map((x) => x.ms);
      const swErr = log.filter((x) => x.sw), repErr = log.filter((x, i) => i && !x.sw);
      const pct = (xs) => (xs.length ? Math.round((100 * xs.filter((x) => !x.ok).length) / xs.length) : 0);
      const cost = sw.length && rep.length ? Math.round(mean(sw) - mean(rep)) : null;
      finish(el, 'switch', right - wrong, `
        <p>${right} right, ${wrong} wrong in ${SWITCH_SECS} s. Score is right minus wrong.</p>
        ${QT.pace ? QT.pace.card(log, { secs: SWITCH_SECS, label: 'Rule switch' }) : ''}
        <div class="tiles">
          <div class="tile"><div class="v">${rep.length ? Math.round(mean(rep)) : '–'} ms</div><div class="k">same rule as before</div></div>
          <div class="tile"><div class="v">${sw.length ? Math.round(mean(sw)) : '–'} ms</div><div class="k">right after a switch</div></div>
          <div class="tile"><div class="v">${pct(swErr)}% / ${pct(repErr)}%</div><div class="k">errors: switch / same</div></div>
        </div>
        <p class="small">${cost === null ? 'Your <b>switch cost</b> (the extra time a change of rule takes) shows once you have right answers of both kinds.' : `Your <b>switch cost</b> is ${cost} ms: the extra time a change of rule takes.`} Under 150 ms is good. To bring it down, look at the box first and say the question to yourself ("odd?") before reading the digit; and keep your fingers on F and J.</p>`);
    }, add);
    next();
  }

  // =========================================================== 2. Pump or bank
  // Each pump adds a point to the balloon; it bursts on a hidden pump number, equally likely to be
  // any of 1..N, where N depends on the colour. Bank to keep the points.
  const BALLOONS = { blue: 8, green: 16, orange: 32 }, PER_COLOUR = 8;
  const bestPumps = (N) => Math.floor(N / 2); // k(N − k)/N is largest at k = N/2
  const evPumps = (N, k) => (k * (N - k)) / N;
  function pump(el, finish) {
    const add = cleanups();
    const queue = R.shuffle(Object.keys(BALLOONS).flatMap((c) => Array(PER_COLOUR).fill(c)));
    const stats = Object.fromEntries(Object.keys(BALLOONS).map((c) => [c, { banked: [], burst: 0, pts: 0 }]));
    let k = 0, total = 0, cur = null, busy = false;
    el.innerHTML = `${head('Pump or bank', '<span id="pb-n"></span><span id="pb-total">Banked 0</span>')}
      <div class="card gm-pump">
        <div class="gm-balloon-wrap"><div class="gm-balloon" id="pb-b"></div><div class="gm-pts" id="pb-pts">0</div></div>
        <div class="gm-pair"><button id="pb-pump" class="gm-key"><kbd>Space</kbd> Pump (+1)</button><button id="pb-bank" class="gm-key ghost"><kbd>B</kbd> Bank</button></div>
        <p class="small" id="pb-msg" aria-live="polite">Each colour bursts at its own range of sizes. Learn them as you go.</p>
      </div>`;
    const $ = (s) => el.querySelector(s);
    function next() {
      if (k >= queue.length) return end();
      const colour = queue[k], N = BALLOONS[colour];
      cur = { colour, N, burst: R.int(1, N), pumps: 0 };
      $('#pb-n').textContent = `Balloon ${k + 1} of ${queue.length} · ${colour}`;
      $('#pb-b').className = `gm-balloon c-${colour}`;
      $('#pb-b').style.transform = 'scale(0.4)';
      $('#pb-pts').textContent = '0';
      $('#pb-b').setAttribute('aria-label', `${colour} balloon`);
      busy = false;
    }
    function doPump() {
      if (busy || !cur) return;
      cur.pumps++;
      if (cur.pumps >= cur.burst) {
        busy = true;
        stats[cur.colour].burst++;
        $('#pb-b').className = `gm-balloon c-${cur.colour} popped`;
        $('#pb-msg').textContent = `Burst at pump ${cur.pumps}. Lost ${cur.pumps - 1}.`;
        const h = setTimeout(() => { k++; next(); }, 700);
        return add(() => clearTimeout(h));
      }
      $('#pb-pts').textContent = cur.pumps;
      $('#pb-b').style.transform = `scale(${Math.min(1.25, 0.4 + cur.pumps * 0.028)})`;
    }
    function bank() {
      if (busy || !cur) return;
      busy = true;
      total += cur.pumps;
      stats[cur.colour].banked.push(cur.pumps);
      stats[cur.colour].pts += cur.pumps;
      $('#pb-total').textContent = `Banked ${total}`;
      $('#pb-msg').textContent = `Banked ${cur.pumps}.`;
      const h = setTimeout(() => { k++; next(); }, 350);
      add(() => clearTimeout(h));
    }
    function end() {
      const best = Object.values(BALLOONS).reduce((s, N) => s + PER_COLOUR * evPumps(N, bestPumps(N)), 0);
      const rows = Object.entries(BALLOONS).map(([c, N]) => {
        const s = stats[c], b = s.banked;
        return `<tr><td><span class="gm-swatch c-${c}"></span>${c}</td><td>1 to ${N}</td><td>${b.length ? mean(b).toFixed(1) : '–'}</td><td>${s.burst} of ${PER_COLOUR}</td><td>${bestPumps(N)}</td><td>${s.pts}</td></tr>`;
      }).join('');
      finish(el, 'pump', total, `
        <p>You banked <b>${total}</b>. Playing the best fixed strategy scores <b>${Math.round(best)}</b> on average.</p>
        <div class="table-wrap"><table><thead><tr><th>Colour</th><th>Burst point</th><th>Your average bank</th><th>Burst</th><th>Best to stop at</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="solution"><b>The maths.</b> If the burst point is equally likely to be any pump from 1 to N, pumping k times and banking succeeds with probability (N − k)/N and pays k, so it's worth k(N − k)/N on average. That's largest at <b>k = N/2</b>, worth N/4. Stopping too early leaves points behind; going too far loses them all. Firms use games like this to see whether you adapt to evidence (each colour's range) rather than chase losses.</div>`);
    }
    $('#pb-pump').addEventListener('click', doPump);
    $('#pb-bank').addEventListener('click', bank);
    add(keys({ ' ': doPump, p: doPump, b: bank, Enter: bank }));
    next();
  }

  // =========================================================== 3. Grid memory
  // Squares light up one at a time; click them back in order. Each success adds one; two misses end it.
  function grid(el, finish) {
    const add = cleanups();
    let len = 3, misses = 0, best = 0, seq = [], pos = 0, input = false, size = 4;
    el.innerHTML = `${head('Grid memory', '<span id="gr-len"></span><span id="gr-miss"></span>')}
      <div class="card"><div class="gm-grid" id="gr"></div><p class="small" id="gr-msg" aria-live="polite">Watch the squares.</p></div>`;
    const $ = (s) => el.querySelector(s), box = $('#gr');
    function draw() {
      box.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      box.innerHTML = Array.from({ length: size * size }, (_, i) => `<button class="gm-cell" data-i="${i}" aria-label="Square ${i + 1}" disabled></button>`).join('');
    }
    function round() {
      size = len >= 7 ? 5 : 4;
      draw();
      seq = [];
      while (seq.length < len) { const c = R.int(0, size * size - 1); if (c !== seq[seq.length - 1]) seq.push(c); }
      pos = 0;
      input = false;
      $('#gr-len').textContent = `${len} squares`;
      $('#gr-miss').textContent = `Misses: ${misses}/2`;
      $('#gr-msg').textContent = 'Watch the squares.';
      const cells = box.querySelectorAll('.gm-cell');
      let j = 0;
      const step = () => {
        if (j > 0) cells[seq[j - 1]].classList.remove('lit');
        if (j >= seq.length) {
          input = true;
          cells.forEach((c) => (c.disabled = false));
          $('#gr-msg').textContent = 'Now click them in the same order.';
          cells[0].focus();
          return;
        }
        const h2 = setTimeout(() => { cells[seq[j]].classList.add('lit'); j++; const h3 = setTimeout(step, 550); add(() => clearTimeout(h3)); }, 200);
        add(() => clearTimeout(h2));
      };
      const h = setTimeout(step, 500);
      add(() => clearTimeout(h));
    }
    box.addEventListener('click', (e) => {
      const c = e.target.closest('.gm-cell');
      if (!c || !input) return;
      const i = +c.dataset.i;
      if (i === seq[pos]) {
        c.classList.add('ok');
        const h = setTimeout(() => c.classList.remove('ok'), 200);
        add(() => clearTimeout(h));
        if (++pos === seq.length) {
          input = false;
          best = Math.max(best, len);
          len++;
          $('#gr-msg').textContent = 'Right.';
          const h2 = setTimeout(round, 700);
          add(() => clearTimeout(h2));
        }
        return;
      }
      input = false;
      c.classList.add('bad');
      misses++;
      seq.forEach((s, k) => { const cell = box.querySelector(`[data-i="${s}"]`); cell.classList.add('show'); cell.textContent = k + 1; });
      $('#gr-msg').textContent = 'Not that one. The order is shown.';
      const h = setTimeout(() => (misses >= 2 ? finish(el, 'grid', best, '<p class="small">Tip: trace the path as a shape ("down, across, back up") rather than remembering separate squares, and group the sequence into chunks of three.</p>') : round()), 1400);
      add(() => clearTimeout(h));
    });
    round();
  }

  // =========================================================== 4. Match or not
  // Two codes: identical, or one character changed or two neighbours swapped.
  const CHARS = 'ACDEFHKMNPRTVWXY2345679'.split('');
  const MATCH_SECS = 60;
  function codePair(len) {
    const a = Array.from({ length: len }, () => R.pick(CHARS));
    const b = [...a];
    const same = Math.random() < 0.5;
    if (!same) {
      const i = R.int(0, len - 1);
      if (Math.random() < 0.35 && i < len - 1 && a[i] !== a[i + 1]) [b[i], b[i + 1]] = [b[i + 1], b[i]];
      else { let c; do c = R.pick(CHARS); while (c === a[i]); b[i] = c; }
    }
    return { a: a.join(''), b: b.join(''), same: a.join('') === b.join('') };
  }
  function match(el, finish) {
    const add = cleanups();
    let cur = null, shown = 0, right = 0, wrong = 0, streak = 0, len = 5, done = false;
    const t0 = now(), log = [];
    el.innerHTML = `${head('Match or not', '<span id="g-score">Score 0</span><span class="mono" id="g-time"></span>')}
      <div class="card"><div class="gm-codes"><div class="mono" id="mt-a"></div><div class="mono" id="mt-b"></div></div>
        <div class="gm-pair"><button id="mt-s" class="gm-key"><kbd>F</kbd> Same</button><button id="mt-d" class="gm-key"><kbd>J</kbd> Different</button></div>
        <p class="small" id="mt-msg" aria-live="polite">Codes get longer as you go.</p></div>`;
    const $ = (s) => el.querySelector(s);
    function next() {
      cur = codePair(len);
      $('#mt-a').textContent = cur.a;
      $('#mt-b').textContent = cur.b;
      shown = now();
    }
    function answer(same) {
      if (done) return;
      const ok = same === cur.same, ms = now() - shown;
      log.push({ ok, ms, t: now() - t0, q: `${cur.a} / ${cur.b}`, al: cur.same ? 'same' : 'different' });
      if (ok) { right++; if (++streak % 5 === 0 && len < 10) len++; } else { wrong++; streak = 0; }
      $('#g-score').textContent = `Score ${right - wrong}`;
      $('#mt-msg').textContent = ok ? '' : `Wrong: they were ${cur.same ? 'the same' : 'different'}.`;
      next();
    }
    $('#mt-s').addEventListener('click', () => answer(true));
    $('#mt-d').addEventListener('click', () => answer(false));
    add(keys({ f: () => answer(true), j: () => answer(false), ArrowLeft: () => answer(true), ArrowRight: () => answer(false) }));
    countdown(MATCH_SECS * 1000, (l) => ($('#g-time').textContent = clock(l)), () => {
      done = true;
      const miss = log.filter((x) => !x.ok && x.al === 'different').length, falseAlarm = log.filter((x) => !x.ok && x.al === 'same').length;
      finish(el, 'match', right - wrong, `
        <p>${right} right, ${wrong} wrong in ${MATCH_SECS} s; codes reached ${len} characters.${wrong ? ` You called ${miss} different pair${miss === 1 ? '' : 's'} the same and ${falseAlarm} matching pair${falseAlarm === 1 ? '' : 's'} different.` : ''}</p>
        ${QT.pace ? QT.pace.card(log, { secs: MATCH_SECS, label: 'Match or not' }) : ''}
        <p class="small">Tip: compare in chunks of two or three characters, left to right, and answer "different" the moment you find one. Missing a difference costs the same as a false alarm, so don't rush past the last characters.</p>`);
    }, add);
    next();
  }

  // =========================================================== 5. Make the target
  // Four numbers, each used once, with + − × ÷ and brackets, to make the target. Exact fractions.
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const frac = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
  const OPS = {
    '+': (x, y) => frac(x[0] * y[1] + y[0] * x[1], x[1] * y[1]),
    '-': (x, y) => frac(x[0] * y[1] - y[0] * x[1], x[1] * y[1]),
    '*': (x, y) => frac(x[0] * y[0], x[1] * y[1]),
    '/': (x, y) => (y[0] === 0 ? null : frac(x[0] * y[1], x[1] * y[0])),
  };
  // Every value reachable from the numbers, with one expression for each.
  function solveAll(nums) {
    const out = new Map();
    const go = (items) => {
      if (items.length === 1) {
        const [v, e] = items[0];
        if (v[1] === 1 && !out.has(v[0])) out.set(v[0], e);
        return;
      }
      for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        const rest = items.filter((_, k) => k !== i && k !== j), [a, ea] = items[i], [b, eb] = items[j];
        for (const op of ['+', '-', '*', '/']) {
          if ((op === '+' || op === '*') && i > j) continue;
          const v = OPS[op](a, b);
          if (v) go([...rest, [v, `(${ea} ${op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : '+'} ${eb})`]]);
        }
      }
    };
    go(nums.map((n) => [[n, 1], String(n)]));
    return out;
  }
  const tidy = (e) => e.replace(/^\((.*)\)$/, '$1');
  function targetPuzzle() {
    for (;;) {
      const nums = Array.from({ length: 4 }, () => R.int(1, 10)), all = solveAll(nums);
      if (Math.random() < 0.5 && all.has(24)) return { nums, target: 24, sol: tidy(all.get(24)) };
      const options = [...all.keys()].filter((v) => v >= 10 && v <= 60 && v !== nums.reduce((a, b) => a + b, 0));
      if (options.length) { const target = R.pick(options); return { nums, target, sol: tidy(all.get(target)) }; }
    }
  }
  // Exact parser for a typed answer: returns { v: [n, d], used: [numbers] } or null.
  function parseTarget(raw) {
    const s = String(raw).replace(/[×x]/gi, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, '');
    if (!s || s.length > 60 || /[^0-9+\-*/()]/.test(s)) return null;
    let i = 0;
    const used = [];
    const peek = () => s[i];
    function atom() {
      if (peek() === '(') { i++; const v = expr(); if (s[i++] !== ')') throw 0; return v; }
      const m = /^\d+/.exec(s.slice(i));
      if (!m) throw 0;
      i += m[0].length;
      used.push(+m[0]);
      return [+m[0], 1];
    }
    function term() {
      let v = atom();
      while (peek() === '*' || peek() === '/') { const op = s[i++], w = atom(); v = OPS[op](v, w); if (!v) throw 0; }
      return v;
    }
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = s[i++]; v = OPS[op](v, term()); }
      return v;
    }
    try {
      const v = expr();
      return i === s.length ? { v, used } : null;
    } catch { return null; }
  }
  const sameNums = (a, b) => a.length === b.length && [...a].sort((x, y) => x - y).every((x, k) => x === [...b].sort((p, q) => p - q)[k]);
  const TARGET_SECS = 180;
  function target(el, finish) {
    const add = cleanups();
    let cur = null, solved = 0, skipped = 0, done = false;
    const missed = [];
    el.innerHTML = `${head('Make the target', '<span id="tg-score">Solved 0</span><span class="mono" id="g-time"></span>')}
      <div class="card">
        <div class="gm-target"><div class="gm-nums" id="tg-nums"></div><div class="gm-goal">Make <b id="tg-goal"></b></div></div>
        <form class="answer-row" id="tg-form"><input type="text" autocomplete="off" id="tg-in" aria-label="Your expression" placeholder="e.g. (8 − 2) × (3 + 1)"><button>Check</button></form>
        <div class="q-actions"><span class="small" id="tg-msg" aria-live="polite">Use each number exactly once, with + − × ÷ and brackets.</span><button type="button" class="link" id="tg-skip">Skip</button></div>
      </div>`;
    const $ = (s) => el.querySelector(s), $in = $('#tg-in');
    function next() {
      cur = targetPuzzle();
      $('#tg-nums').innerHTML = cur.nums.map((n) => `<span>${n}</span>`).join('');
      $('#tg-goal').textContent = cur.target;
      $in.value = '';
      $in.focus();
    }
    $('#tg-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (done || !$in.value.trim()) return;
      const p = parseTarget($in.value);
      if (!p) return ($('#tg-msg').textContent = "Couldn't read that. Use numbers, + − × ÷ (or * and /) and brackets.");
      if (!sameNums(p.used, cur.nums)) return ($('#tg-msg').textContent = `Use exactly these numbers, once each: ${cur.nums.join(', ')}.`);
      if (!(p.v[0] === cur.target && p.v[1] === 1)) return ($('#tg-msg').textContent = `That makes ${p.v[1] === 1 ? p.v[0] : `${p.v[0]}/${p.v[1]}`}, not ${cur.target}.`);
      solved++;
      $('#tg-score').textContent = `Solved ${solved}`;
      $('#tg-msg').textContent = 'Solved.';
      next();
    });
    $('#tg-skip').addEventListener('click', () => {
      if (done) return;
      skipped++;
      missed.push(cur);
      $('#tg-msg').textContent = `One way: ${cur.sol} = ${cur.target}.`;
      next();
    });
    countdown(TARGET_SECS * 1000, (l) => ($('#g-time').textContent = clock(l)), () => {
      done = true;
      if (cur) missed.push(cur);
      finish(el, 'target', solved, `
        <p>${solved} solved, ${skipped} skipped in ${TARGET_SECS / 60} minutes.</p>
        ${missed.length ? `<h2>Ways to make the ones you missed</h2><ul class="small">${missed.slice(-8).map((m) => `<li>${m.nums.join(', ')} → ${m.target}: <span class="mono">${esc(m.sol)}</span></li>`).join('')}</ul>` : ''}
        <p class="small">Tip: work backwards from the target. For 24, look for 3 × 8, 4 × 6, 2 × 12 or 25 − 1, and see if two of the numbers make one factor while the other two make the other.</p>`);
    }, add);
    next();
  }

  // =========================================================== 6. Stop the dial
  // A hand sweeps round a dial; stop it on the mark. It speeds up every 5 turns.
  const DIAL_TRIALS = 20;
  function dial(el, finish) {
    const add = cleanups();
    let k = 0, total = 0, raf = 0, ang = 0, mark = 0, speed = 0, last = 0, live = false, travelled = 0;
    const errs = [];
    el.innerHTML = `${head('Stop the dial', '<span id="dl-n"></span><span id="dl-total">0 points</span>')}
      <div class="card gm-dial-card">
        <svg class="gm-dial" viewBox="-110 -110 220 220" role="img" aria-label="Dial"><circle r="100" class="gm-face"/><line id="dl-mark" x1="0" y1="-100" x2="0" y2="-78" class="gm-mark"/><line id="dl-hand" x1="0" y1="0" x2="0" y2="-92" class="gm-hand"/><circle r="5" class="gm-hub"/></svg>
        <button id="dl-stop" class="gm-key"><kbd>Space</kbd> Stop</button>
        <p class="small" id="dl-msg" aria-live="polite">Stop the hand on the red mark. Up to 100 points a turn.</p>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const setHand = () => $('#dl-hand').setAttribute('transform', `rotate(${ang})`);
    function trial() {
      if (k >= DIAL_TRIALS) return end();
      speed = 180 + 60 * Math.floor(k / 5); // degrees per second: 180, 240, 300, 360
      ang = 0;
      travelled = 0;
      mark = R.int(120, 330);
      $('#dl-mark').setAttribute('transform', `rotate(${mark})`);
      $('#dl-n').textContent = `Turn ${k + 1} of ${DIAL_TRIALS}`;
      setHand();
      const h = setTimeout(() => { live = true; last = now(); raf = requestAnimationFrame(frame); }, 600);
      add(() => clearTimeout(h));
    }
    function frame(t) {
      const dt = (t - last) / 1000;
      last = t;
      ang = (ang + speed * dt) % 360;
      travelled += speed * dt;
      setHand();
      if (travelled > mark + 360) return stop(true); // two passes without stopping: a miss
      raf = requestAnimationFrame(frame);
    }
    add(() => cancelAnimationFrame(raf));
    function stop(timeout) {
      if (!live) return;
      live = false;
      cancelAnimationFrame(raf);
      let err = ((ang - mark + 540) % 360) - 180; // signed degrees, + = late
      if (timeout) err = 180;
      const pts = Math.max(0, Math.round(100 - 4 * Math.abs(err)));
      total += pts;
      errs.push({ deg: err, ms: (err / speed) * 1000, pts });
      $('#dl-total').textContent = `${total} points`;
      $('#dl-msg').textContent = timeout ? 'Too slow: 0 points.' : `${Math.abs(err).toFixed(1)}° ${err >= 0 ? 'late' : 'early'}: ${pts} points.`;
      k++;
      const h = setTimeout(trial, 800);
      add(() => clearTimeout(h));
    }
    function end() {
      const ms = errs.filter((e) => e.deg < 180).map((e) => e.ms), bias = mean(ms);
      finish(el, 'dial', total, `
        <p>${total} of ${DIAL_TRIALS * 100} possible. Average miss <b>${Math.round(mean(ms.map(Math.abs)))} ms</b>; on average you were <b>${Math.abs(Math.round(bias))} ms ${bias >= 0 ? 'late' : 'early'}</b>.</p>
        <p class="small">${Math.abs(bias) > 25 ? `A steady ${bias >= 0 ? 'lateness' : 'earliness'} means you're reacting to the mark rather than anticipating it: start your press as the hand approaches, a fraction ${bias >= 0 ? 'earlier' : 'later'}.` : 'No consistent bias: your misses are noise, not a habit. Good.'} The hand speeds up every five turns, so recalibrate when it does.</p>`);
    }
    $('#dl-stop').addEventListener('click', () => stop(false));
    add(keys({ ' ': () => stop(false), Enter: () => stop(false) }));
    trial();
  }

  // =========================================================== 7. Order queue
  // Orders fill in up to four lanes at different speeds. Ship each one in its ready window (the green
  // part of the bar): too early and it's wasted, too late and it spoils. More lanes open as you go.
  const QUEUE_SECS = 90, READY = 0.7, PERFECT = 0.88;
  function queueGame(el, finish) {
    const add = cleanups();
    const lanes = Array.from({ length: 4 }, (_, i) => ({ i, p: 0, dur: 0, wait: 0.4 + i * 0.6, on: false }));
    let score = 0, raf = 0, last = 0, t = 0, done = false;
    const tally = { good: 0, perfect: 0, early: 0, spoiled: 0 };
    el.innerHTML = `${head('Order queue', '<span id="q-score">Score 0</span><span class="mono" id="g-time"></span>')}
      <div class="card"><div class="gm-lanes" id="q-lanes">${lanes.map((l) => `<button class="gm-lane" data-i="${l.i}" aria-label="Lane ${l.i + 1}"><kbd>${l.i + 1}</kbd><span class="gm-bar"><i class="gm-ready" style="left:${READY * 100}%"></i><i class="gm-fill"></i></span></button>`).join('')}</div>
      <p class="small" id="q-msg" aria-live="polite">Ship an order (click its lane or press its number) once the bar is in the green. The last stretch scores double.</p></div>`;
    const $ = (s) => el.querySelector(s), btns = [...el.querySelectorAll('.gm-lane')];
    const open = () => (t < 20 ? 2 : t < 45 ? 3 : 4);
    function startOrder(l) { l.on = true; l.p = 0; l.dur = R.float(2.5, 6, 2); }
    function ship(i) {
      const l = lanes[i];
      if (done || !l || !l.on) return;
      if (l.p < READY) { score--; tally.early++; flash(i, 'bad', 'Too early: −1'); }
      else if (l.p >= PERFECT) { score += 2; tally.perfect++; flash(i, 'ok', 'Perfect: +2'); }
      else { score++; tally.good++; flash(i, 'ok', '+1'); }
      l.on = false;
      l.wait = R.float(0.4, 1.6, 2);
      $('#q-score').textContent = `Score ${score}`;
    }
    function flash(i, kind, msg) {
      btns[i].classList.add(kind);
      const h = setTimeout(() => btns[i].classList.remove(kind), 250);
      add(() => clearTimeout(h));
      $('#q-msg').textContent = `Lane ${i + 1}: ${msg}`;
    }
    function frame(ts) {
      const dt = Math.min(0.1, (ts - last) / 1000);
      last = ts;
      t += dt;
      lanes.forEach((l, i) => {
        const active = i < open();
        btns[i].classList.toggle('off', !active);
        if (!active) return;
        if (!l.on) { l.wait -= dt; if (l.wait <= 0) startOrder(l); }
        else {
          l.p += dt / l.dur;
          if (l.p >= 1) { score--; tally.spoiled++; l.on = false; l.wait = R.float(0.4, 1.6, 2); flash(i, 'bad', 'Spoiled: −1'); $('#q-score').textContent = `Score ${score}`; }
        }
        const fill = btns[i].querySelector('.gm-fill');
        fill.style.width = `${(l.on ? l.p : 0) * 100}%`;
        btns[i].classList.toggle('ready', l.on && l.p >= READY);
      });
      if (!done) raf = requestAnimationFrame(frame);
    }
    add(() => cancelAnimationFrame(raf));
    $('#q-lanes').addEventListener('click', (e) => { const b = e.target.closest('.gm-lane'); if (b) ship(+b.dataset.i); });
    add(keys({ 1: () => ship(0), 2: () => ship(1), 3: () => ship(2), 4: () => ship(3) }));
    countdown(QUEUE_SECS * 1000, (l) => ($('#g-time').textContent = clock(l)), () => {
      done = true;
      cancelAnimationFrame(raf);
      finish(el, 'queue', score, `
        <div class="tiles">
          <div class="tile"><div class="v">${tally.perfect}</div><div class="k">perfect (+2)</div></div>
          <div class="tile"><div class="v">${tally.good}</div><div class="k">in the window (+1)</div></div>
          <div class="tile"><div class="v">${tally.early}</div><div class="k">too early (−1)</div></div>
          <div class="tile"><div class="v">${tally.spoiled}</div><div class="k">spoiled (−1)</div></div>
        </div>
        <p class="small">${tally.spoiled > tally.early ? 'Most of your losses were spoiled orders: scan every lane in a fixed order and ship anything green before waiting for a perfect.' : tally.early > 2 ? 'Early shipping cost you: wait for the green before pressing.' : 'Few losses: next time, wait a little longer for more perfects.'} Multitasking games reward a steady scanning routine more than fast reactions.</p>`);
    }, add);
    last = now();
    raf = requestAnimationFrame(frame);
  }

  const GAMES = {
    switch: { name: 'Rule switch', unit: 'net', mins: 1.5, skill: 'Switching between rules', play: ruleSwitch, desc: 'Odd or even? Higher or lower than 5? The box the digit appears in decides. Score is right minus wrong, 90 seconds.' },
    match: { name: 'Match or not', unit: 'net', mins: 1, skill: 'Checking detail at speed', play: match, desc: 'Are the two codes identical? They get longer as you go. 60 seconds, right minus wrong.' },
    grid: { name: 'Grid memory', unit: 'squares', mins: 2, skill: 'Working memory', play: grid, desc: 'Squares light up in order; click them back. One more each time you get it right; two misses end it.' },
    target: { name: 'Make the target', unit: 'solved', mins: 3, skill: 'Arithmetic and search', play: target, desc: 'Four numbers, each used once, with + − × ÷ to hit the target. 3 minutes.' },
    dial: { name: 'Stop the dial', unit: 'points', mins: 1.5, skill: 'Timing and anticipation', play: dial, desc: 'Stop a sweeping hand on the mark. 20 turns, faster every five.' },
    queue: { name: 'Order queue', unit: 'points', mins: 1.5, skill: 'Multitasking', play: queueGame, desc: 'Orders fill in up to four lanes; ship each in its green window. 90 seconds.' },
    pump: { name: 'Pump or bank', unit: 'points', mins: 2, skill: 'Risk and learning from evidence', play: pump, desc: '24 balloons in three colours. Pump for points or bank them before it bursts.' },
  };
  const ORDER = Object.keys(GAMES);

  QT.games = { GAMES, ORDER, solveAll, parseTarget, targetPuzzle, codePair, bestPumps, evPumps, sameNums };
})();
