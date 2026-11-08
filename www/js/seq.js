// Number sequences trainer: 30 kinds of pattern in three levels, a practice mode that explains each
// answer, and timed tests in the formats candidates report (15 in 7½ minutes, 24 in 18, 26 in 25).
// Accuracy and speed are kept per kind of pattern, so practice can aim at the ones you miss.
// Our own generators: nothing here is taken from any firm's test.
(function () {
  const R = QT.rand, store = QT.store, esc = QT.escapeHtml;
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113];
  const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
  const sgn = (x) => (x < 0 ? `− ${-x}` : `+ ${x}`);
  const digitSum = (n) => String(Math.abs(n)).split('').reduce((s, d) => s + +d, 0);
  const tri = (n) => (n * (n + 1)) / 2;
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

  // Each family: id, name, level 1–3, gen() → { t: terms shown, a: the next term, rule }.
  // Letter families answer with a letter; everything else with a whole number.
  const FAMILIES = [
    // ---- level 1: one simple rule ----
    { id: 'arith', name: 'Add a constant', lvl: 1, gen() { const a = R.int(-20, 40), d = R.pick([-9, -7, -6, -4, 3, 4, 6, 7, 8, 11, 12, 13, 15]); return { t: range(5, (i) => a + i * d), a: a + 5 * d, rule: `Add ${d} each time.` }; } },
    { id: 'geo', name: 'Multiply by a constant', lvl: 1, gen() {
      if (R.int(0, 3) === 0) { const k = R.pick([3, 5, 7]), t = range(5, (i) => k * 2 ** (5 - i)); return { t, a: k, rule: 'Halve each time.' }; }
      const a = R.int(1, 6), r = R.pick([2, 3, -2, 4]); return { t: range(5, (i) => a * r ** i), a: a * r ** 5, rule: `Multiply by ${r} each time.` };
    } },
    { id: 'squares', name: 'Squares', lvl: 1, gen() { const c = R.pick([0, 0, -1, 1, 2, -3, 5]), s = R.int(1, 6); return { t: range(5, (i) => (s + i) ** 2 + c), a: (s + 5) ** 2 + c, rule: `n²${c ? ` ${sgn(c)}` : ''} for n = ${s}, ${s + 1}, … (the differences go up by 2).` }; } },
    { id: 'cubes', name: 'Cubes', lvl: 1, gen() { const c = R.pick([0, 0, 1, -1]), s = R.int(1, 3); return { t: range(6, (i) => (s + i) ** 3 + c), a: (s + 6) ** 3 + c, rule: `n³${c ? ` ${sgn(c)}` : ''} for n = ${s}, ${s + 1}, ….` }; } },
    { id: 'tri', name: 'Triangular numbers', lvl: 1, gen() { const s = R.int(1, 6); return { t: range(5, (i) => tri(s + i)), a: tri(s + 5), rule: `Triangular numbers n(n + 1)/2: the differences are ${s + 1}, ${s + 2}, ${s + 3}, ….` }; } },
    { id: 'primes', name: 'Primes', lvl: 1, gen() { const s = R.int(0, 12); return { t: PRIMES.slice(s, s + 5), a: PRIMES[s + 5], rule: 'Consecutive prime numbers.' }; } },
    { id: 'pow2', name: 'Powers of 2', lvl: 1, gen() { const s = R.int(0, 4), c = R.pick([-1, 1, 2, 3, -2]); return { t: range(5, (i) => 2 ** (s + i) + c), a: 2 ** (s + 5) + c, rule: `Powers of 2 ${sgn(c)} (2ⁿ ${sgn(c)}).` }; } },
    { id: 'altstep', name: 'Two steps in turn', lvl: 1, gen() { const a = R.int(5, 40), p = R.int(4, 12), m = R.int(2, p - 1), t = [a]; for (let i = 0; i < 6; i++) t.push(t[i] + (i % 2 ? -m : p)); return { t, a: t[6] + p, rule: `Add ${p}, then subtract ${m}, in turn.` }; } },
    { id: 'letters', name: 'Letters, fixed step', lvl: 1, gen() { const k = R.int(2, 5), s = R.int(0, 25 - 5 * k); return { t: range(5, (i) => L[s + i * k]), a: L[s + 5 * k], rule: `Move ${k} letters along each time (${L[s]} is letter ${s + 1}).` }; } },
    { id: 'square-alt', name: 'Squares with alternating sign', lvl: 1, gen() { const s = R.int(1, 4), sg = (i) => ((s + i) % 2 ? 1 : -1); return { t: range(5, (i) => sg(i) * (s + i) ** 2), a: sg(5) * (s + 5) ** 2, rule: 'Squares with the sign flipping each time.' }; } },
    // ---- level 2: a rule on the differences, or two rules at once ----
    { id: 'diffgrow', name: 'Differences rise steadily', lvl: 2, gen() { const a = R.int(1, 20), d = R.int(1, 5), e = R.int(2, 4), t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + d + i * e); return { t, a: t[5] + d + 5 * e, rule: `The differences go up by ${e} each time (${d}, ${d + e}, ${d + 2 * e}, …).` }; } },
    { id: 'fib', name: 'Sum of the previous two', lvl: 2, gen() { const t = [R.int(1, 6), R.int(2, 9)]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]); return { t, a: t[4] + t[5], rule: 'Each term is the sum of the previous two.' }; } },
    { id: 'interleave', name: 'Two sequences interleaved', lvl: 2, gen() { const a = R.int(1, 9), da = R.pick([2, 3, 5, 7]), b = R.int(20, 40), db = R.pick([-4, -3, -2, 4, 6]); return { t: range(7, (i) => (i % 2 ? b + ((i - 1) / 2) * db : a + (i / 2) * da)), a: b + 3 * db, rule: `Two sequences take turns: one adds ${da}, the other ${db > 0 ? 'adds' : 'subtracts'} ${Math.abs(db)}.` }; } },
    { id: 'linrec', name: 'Multiply, then add', lvl: 2, gen() { const m = R.pick([2, 3]), c = R.pick([-3, -1, 1, 2, 3]), t = [R.int(1, 5)]; for (let i = 0; i < 4; i++) t.push(m * t[i] + c); return { t, a: m * t[4] + c, rule: `Each term is ${m} × the previous ${sgn(c)}.` }; } },
    { id: 'altops', name: 'Multiply and add in turn', lvl: 2, gen() { const m = R.pick([2, 3]), c = R.int(1, 6), t = [R.int(1, 5)]; for (let i = 0; i < 5; i++) t.push(i % 2 ? t[i] + c : t[i] * m); return { t, a: t[5] + c, rule: `× ${m}, then + ${c}, in turn.` }; } },
    { id: 'diffgeo', name: 'Differences multiply', lvl: 2, gen() { const a = R.int(1, 15), d = R.int(1, 3), r = R.pick([2, 3]), t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + d * r ** i); return { t, a: t[5] + d * r ** 5, rule: `The differences multiply by ${r} each time (${d}, ${d * r}, ${d * r * r}, …).` }; } },
    { id: 'factorial', name: 'Multiply by 1, 2, 3, …', lvl: 2, gen() { const k = R.int(1, 2), a = R.pick([1, 1, 2, 3]), t = [a]; for (let i = 0; i < 4; i++) t.push(t[i] * (k + i)); return { t, a: t[4] * (k + 4), rule: `Multiply by ${k}, ${k + 1}, ${k + 2}, … in turn${a === 1 && k === 1 ? ' (the factorials)' : ''}.` }; } },
    { id: 'pronic', name: 'n × (n + 1)', lvl: 2, gen() { const s = R.int(1, 6), k = R.pick([1, 2, 3]); return { t: range(5, (i) => (s + i) * (s + i + k)), a: (s + 5) * (s + 5 + k), rule: `n × (n + ${k}) for n = ${s}, ${s + 1}, ….` }; } },
    { id: 'diffprime', name: 'Add the primes', lvl: 2, gen() { const s = R.int(0, 4), a = R.int(1, 20), t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + PRIMES[s + i]); return { t, a: t[5] + PRIMES[s + 5], rule: `The differences are the primes ${PRIMES.slice(s, s + 3).join(', ')}, ….` }; } },
    { id: 'sq-pm', name: 'Squares, plus and minus 1', lvl: 2, gen() { const s = R.int(1, 5), f = (i) => (s + i) ** 2 + ((s + i) % 2 ? 1 : -1); return { t: range(6, f), a: f(6), rule: 'n², adding 1 for odd n and subtracting 1 for even n.' }; } },
    // ---- level 3: higher order, or a less obvious rule ----
    { id: 'cubic', name: 'Third differences constant', lvl: 3, gen() { const b = R.int(-2, 2), c = R.int(-3, 3), d = R.int(-5, 5), p = (n) => n ** 3 + b * n * n + c * n + d; return { t: range(6, (i) => p(i + 1)), a: p(7), rule: 'A cubic: take differences three times and they are constant (6).' }; } },
    { id: 'trib', name: 'Sum of the previous three', lvl: 3, gen() { const t = [R.int(0, 2), R.int(1, 3), R.int(1, 4)]; while (t.length < 7) t.push(t[t.length - 1] + t[t.length - 2] + t[t.length - 3]); return { t, a: t[4] + t[5] + t[6], rule: 'Each term is the sum of the previous three.' }; } },
    { id: 'mix-geo-ar', name: 'Doubling and adding interleaved', lvl: 3, gen() { const a = R.int(1, 4), r = R.pick([2, 3]), b = R.int(10, 30), d = R.pick([-5, -3, 4, 7, 9]); return { t: range(7, (i) => (i % 2 ? b + ((i - 1) / 2) * d : a * r ** (i / 2))), a: b + 3 * d, rule: `Two sequences take turns: one multiplies by ${r}, the other adds ${d}.` }; } },
    // (a steady +9 run would look like plain adding, so those are drawn again)
    { id: 'digitsum', name: 'Add the digit sum', lvl: 3, gen() { let t; do { t = [R.int(10, 60)]; for (let i = 0; i < 5; i++) t.push(t[i] + digitSum(t[i])); } while (new Set(t.slice(1).map((x, i) => x - t[i])).size < 3); return { t, a: t[5] + digitSum(t[5]), rule: `Add the sum of the digits each time (${t[0]} + ${digitSum(t[0])} = ${t[1]}).` }; } },
    { id: 'diffsq', name: 'Add the squares', lvl: 3, gen() { const s = R.int(1, 3), a = R.int(0, 10), t = [a]; for (let i = 0; i < 5; i++) t.push(t[i] + (s + i) ** 2); return { t, a: t[5] + (s + 5) ** 2, rule: `The differences are the squares ${s * s}, ${(s + 1) ** 2}, ${(s + 2) ** 2}, ….` }; } },
    { id: 'prod2', name: 'Product of the previous two', lvl: 3, gen() { const t = [R.pick([1, 2]), R.pick([2, 3])]; while (t.length < 5) t.push(t[t.length - 1] * t[t.length - 2]); return { t, a: t[3] * t[4], rule: 'Each term is the product of the previous two.' }; } },
    { id: 'sq-cube', name: 'Squares and cubes interleaved', lvl: 3, gen() { const s = R.int(1, 3); return { t: range(7, (i) => (i % 2 ? (s + (i - 1) / 2) ** 3 : (s + i / 2) ** 2)), a: (s + 3) ** 3, rule: `Squares and cubes take turns: ${s}², ${s}³, ${s + 1}², ${s + 1}³, ….` }; } },
    { id: 'letters-grow', name: 'Letters, growing step', lvl: 3, gen() { const s = R.int(0, 5), k = R.int(1, 2), pos = [s]; for (let i = 0; i < 5; i++) pos.push(pos[i] + k + i); return { t: pos.slice(0, 5).map((p) => L[p]), a: L[pos[5]], rule: `The step grows by one each time: move ${k}, ${k + 1}, ${k + 2}, … letters.` }; } },
    { id: 'nfact', name: 'Factorial plus n', lvl: 3, gen() { const c = R.pick([1, -1, 2]); return { t: range(5, (i) => fact(i + 1) + c * (i + 1)), a: fact(6) + c * 6, rule: `n! ${c < 0 ? '−' : '+'} ${Math.abs(c) === 1 ? '' : `${Math.abs(c)}`}n for n = 1, 2, 3, ….` }; } },
    { id: 'diff-alt', name: 'Differences alternate', lvl: 3, gen() { const a = R.int(1, 10), p = R.int(2, 6), q = R.int(2, 6), t = [a]; for (let i = 0; i < 6; i++) t.push(t[i] + (i % 2 ? q * ((i + 1) / 2) : p * (i / 2 + 1))); return { t, a: t[6] + 4 * p, rule: `The steps take turns: one set adds ${p}, ${2 * p}, ${3 * p}, …; the other adds ${q}, ${2 * q}, ${3 * q}, ….` }; } },
  ];
  const BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));
  const isLetter = (fam) => fam.id.startsWith('letters');

  // A question from a family, with the differences worked out for the explanation.
  function make(fam) {
    const g = fam.gen();
    const q = `${g.t.join(', ')}, ?`;
    let diffs = '';
    if (!isLetter(fam)) {
      const d = g.t.slice(1).map((x, i) => x - g.t[i]);
      diffs = `Differences: ${d.join(', ')}.`;
    }
    return { fam: fam.id, q, t: g.t, a: g.a, al: String(g.a), rule: g.rule, diffs, letter: isLetter(fam) };
  }
  const check = (cur, raw) => {
    const s = String(raw).trim();
    if (cur.letter) return s.toUpperCase() === cur.a;
    const v = QT.parseAnswer(s);
    return Number.isFinite(v) && v === cur.a;
  };

  // Per-family record: attempts, right answers, and the last 10 answer times.
  function note(fam, ok, ms) {
    const s = store.get(), r = (s.seqfam[fam] ||= { n: 0, c: 0, ms: [] });
    r.n++;
    if (ok) r.c++;
    r.ms = [...r.ms, Math.round(ms)].slice(-10);
  }
  // Families you get wrong most (at least 3 tries), then families you've not tried.
  function weakFamilies() {
    const s = store.get().seqfam;
    const tried = FAMILIES.filter((f) => (s[f.id]?.n || 0) >= 3).sort((a, b) => s[a.id].c / s[a.id].n - s[b.id].c / s[b.id].n);
    const weak = tried.filter((f) => s[f.id].c / s[f.id].n < 0.85);
    return weak.length ? weak.slice(0, 6) : FAMILIES.filter((f) => !s[f.id]);
  }

  const MODES = {
    seq: { n: 15, secs: 450, name: '15 in 7½ minutes', desc: 'Short and quick. The format of most short sequence screens.' },
    seq24: { n: 24, secs: 1080, name: '24 in 18 minutes', desc: 'A longer test that gets harder as it goes, in a format candidates report from IMC.' },
    seq26: { n: 26, secs: 1500, name: '26 in 25 minutes', desc: 'A long test, harder towards the end, in the format reported for Flow Traders and All Options.' },
  };
  const usable = (fams) => (QT.keypad.enabled() ? fams.filter((f) => !isLetter(f)) : fams);
  // Fixed-length tests start easy and get harder: level 1 in the first third, 2 in the middle, 3 at the end.
  function pickFor(i, n) {
    const want = n <= 15 ? R.pick([1, 1, 2, 2, 3]) : i < n / 3 ? 1 : i < (2 * n) / 3 ? 2 : 3;
    return make(R.pick(usable(FAMILIES.filter((f) => f.lvl === want))));
  }

  const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  const LEVELS = { all: 'All levels', 1: 'Level 1', 2: 'Level 2', 3: 'Level 3', weak: 'My weak spots' };

  function hub(el) {
    const s = store.get(), oa = s.oa, fam = s.seqfam;
    const rows = FAMILIES.map((f) => {
      const r = fam[f.id];
      const acc = r && r.n ? Math.round((100 * r.c) / r.n) : null;
      const avg = r && r.ms.length ? (r.ms.reduce((a, b) => a + b, 0) / r.ms.length / 1000).toFixed(1) : null;
      return `<tr><td>${esc(f.name)}</td><td>${f.lvl}</td><td>${r ? r.n : '–'}</td><td>${acc === null ? '–' : `${acc}%`}</td><td>${avg === null ? '–' : `${avg} s`}</td><td><a href="#/oa/seq/fam/${f.id}">Practise</a></td></tr>`;
    }).join('');
    el.innerHTML = `
      <p class="small"><a href="#/oa">← Online tests</a></p>
      <h1>Number sequences</h1>
      <p class="lede">Find the next term. ${FAMILIES.length} kinds of pattern in three levels. Practice explains every answer; the timed tests match the formats candidates report.</p>
      <h2>Practice</h2>
      <p class="small">Untimed, one at a time, with the rule and the differences after each answer.</p>
      <div class="row">${['all', '1', '2', '3', 'weak'].map((k) => [k, LEVELS[k]]).map(([k, v]) => `<a class="btn${k === 'all' ? '' : ' ghost'}" href="#/oa/seq/practice/${k}">${v}</a>`).join('')}</div>
      <h2>Timed tests</h2>
      <div class="grid">${Object.entries(MODES).map(([k, m]) => `
        <div class="card"><h3>${m.name}</h3><p class="small">${m.desc}</p>
        <p class="small">Best: <b>${oa[k]?.best ?? '–'}</b> of ${m.n}${oa[k]?.runs?.length ? ` · ${oa[k].runs.length} runs` : ''}</p>
        <a class="btn" href="#/oa/seq/test/${k}">Start</a></div>`).join('')}</div>
      <h2>Your patterns</h2>
      <p class="small">Every answer you give, in practice or a test, counts here. Practise any one kind on its own.</p>
      <div class="table-wrap"><table class="data"><thead><tr><th>Pattern</th><th>Level</th><th>Tries</th><th>Right</th><th>Avg time</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <h2>How to find the rule fast</h2>
      <ol class="small">
        <li>Write the differences. Constant: add a number. Rising steadily: look at the differences of the differences.</li>
        <li>No luck? Try ratios: doubling, halving, × then +.</li>
        <li>Big jumps or a wobble up and down: split odd and even positions; it's often two sequences taking turns.</li>
        <li>Know the landmarks on sight: squares, cubes, primes, powers of 2, triangular numbers, factorials.</li>
        <li>Each term from the last two or three (sums, products) usually shows up as fast growth that isn't geometric.</li>
        <li>Stuck after 30 seconds in a timed test? Skip and come back; every question counts the same.</li>
      </ol>`;
  }

  // Practice: untimed; after each answer, the rule.
  function practice(el, level, famId) {
    let pool;
    if (famId && BY_ID[famId]) pool = [BY_ID[famId]];
    else if (level === 'weak') pool = weakFamilies();
    else if (['1', '2', '3'].includes(level)) pool = FAMILIES.filter((f) => f.lvl === +level);
    else pool = FAMILIES;
    pool = usable(pool);
    if (!pool.length) pool = usable(FAMILIES);
    const title = famId && BY_ID[famId] ? BY_ID[famId].name : LEVELS[level] || LEVELS.all;
    let cur = null, shownAt = 0, right = 0, n = 0, answered = false;
    el.innerHTML = `
      <p class="small"><a href="#/oa/seq">← Number sequences</a></p>
      <h1>Sequences practice</h1>
      <div class="session"><span>${esc(title)}</span><span id="sp-score"></span></div>
      <div class="card">
        <div class="question" id="sp-q"></div>
        <form class="answer-row" id="sp-form"><input type="text" autocomplete="off" id="sp-in" aria-label="Next term" placeholder="Next term"><button id="sp-go">Check</button></form>
        <div id="sp-out" aria-live="polite"></div>
        <div class="q-actions"><button type="button" class="link" id="sp-skip">Show the answer</button></div>
      </div>`;
    const $ = (s) => el.querySelector(s), $in = $('#sp-in'), form = $('#sp-form');
    function next() {
      cur = make(R.pick(pool));
      answered = false;
      shownAt = Date.now();
      $('#sp-q').innerHTML = `What comes next? <span class="mono"><b>${esc(cur.q)}</b></span>`;
      $('#sp-out').innerHTML = '';
      $('#sp-go').textContent = 'Check';
      $('#sp-skip').hidden = false;
      $in.value = '';
      $in.disabled = false;
      if (!QT.keypad.enabled()) $in.setAttribute('inputmode', cur.letter ? 'text' : 'decimal');
      $('#sp-score').textContent = n ? `${right} of ${n} right` : '';
      if (!QT.keypad.enabled()) $in.focus();
    }
    function reveal(ok, you) {
      answered = true;
      n++;
      if (ok) right++;
      note(cur.fam, ok, Date.now() - shownAt);
      store.touchDay();
      store.save();
      $in.disabled = true;
      $('#sp-score').textContent = `${right} of ${n} right`;
      $('#sp-out').innerHTML = `<p class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Right.' : you == null ? 'Answer:' : 'Not quite.'}</b> The next term is <b>${esc(cur.al)}</b>.</p>
        <div class="solution"><b>${esc(BY_ID[cur.fam].name)}.</b> ${esc(cur.rule)}${cur.diffs ? ` <span class="small">${esc(cur.diffs)}</span>` : ''}</div>`;
      $('#sp-go').textContent = 'Next';
      $('#sp-skip').hidden = true;
      $('#sp-go').focus();
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (answered) return next();
      if (!$in.value.trim()) return;
      reveal(check(cur, $in.value), $in.value);
    });
    $('#sp-skip').addEventListener('click', () => !answered && reveal(false, null));
    QT.keypad.attach(form, [$in], () => form.requestSubmit(), { keys: '-' });
    next();
  }

  // Timed test: typed answers, skip allowed, then a review with pacing and the patterns you missed.
  function test(el, key, finish) {
    const m = MODES[key] || MODES.seq, N = m.n, start = Date.now(), end = start + m.secs * 1000, log = [];
    let i = 0, cur = null, shownAt = 0, done = false;
    el.innerHTML = `
      <h1>Number sequences</h1>
      <div class="session"><span id="sq-n"></span><span class="mono" id="sq-time"></span></div>
      <div class="card">
        <div class="question" id="sq-q"></div>
        <form class="answer-row" id="sq-form"><input type="text" autocomplete="off" id="sq-in" aria-label="Next term" placeholder="Next term"><button>Enter</button></form>
        <div class="q-actions"><span class="small" id="sq-hint">Differences, ratios, alternate terms.</span><button type="button" class="link" id="sq-skip">Skip</button></div>
      </div>`;
    const $ = (s) => el.querySelector(s), $in = $('#sq-in');
    const timer = setInterval(tick, 250);
    QT.cleanup = () => clearInterval(timer);
    function tick() {
      const left = Math.max(0, end - Date.now());
      $('#sq-time').textContent = clock(left);
      if (!left) stop();
    }
    function next() {
      if (i >= N) return stop();
      cur = pickFor(i, N);
      shownAt = Date.now();
      $('#sq-n').textContent = `Question ${i + 1} of ${N}`;
      $('#sq-q').innerHTML = `What comes next? <span class="mono"><b>${esc(cur.q)}</b></span>`;
      $in.value = '';
      if (!QT.keypad.enabled()) $in.setAttribute('inputmode', cur.letter ? 'text' : 'decimal');
      if (!QT.keypad.enabled()) $in.focus();
    }
    const answer = (raw, skipped) => {
      const now = Date.now(), ok = !skipped && check(cur, raw);
      log.push({ ...cur, ok, you: skipped ? 'skipped' : raw.trim(), ms: now - shownAt, t: now - start });
      note(cur.fam, ok, now - shownAt);
      i++;
      next();
    };
    const form = $('#sq-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (done || !$in.value.trim()) return;
      if (!cur.letter && Number.isNaN(QT.parseAnswer($in.value))) return ($('#sq-hint').textContent = "Couldn't read that number.");
      answer($in.value, false);
    });
    $('#sq-skip').addEventListener('click', () => !done && answer('', true));
    QT.keypad.attach(form, [$in], () => form.requestSubmit(), { keys: '-' });
    function stop() {
      if (done) return;
      done = true;
      clearInterval(timer);
      QT.cleanup = null;
      const score = log.filter((x) => x.ok).length, wrong = log.filter((x) => !x.ok);
      const prevBest = store.get().oa[key]?.best;
      const pacing = QT.pace && log.length ? QT.pace.card(log, { secs: m.secs, elapsed: Date.now() - start, label: m.name, best: prevBest, bad: 'Wrong or skipped', open: i < N && cur ? { ...cur, ms: Date.now() - shownAt } : null }) : '';
      const byFam = {};
      for (const x of log) (byFam[x.fam] ||= { n: 0, c: 0 }), byFam[x.fam].n++, x.ok && byFam[x.fam].c++;
      const missed = Object.entries(byFam).filter(([, v]) => v.c < v.n).map(([k]) => BY_ID[k].name);
      finish(el, key, score, `
        <p>${log.length} of ${N} answered${log.length < N ? ' before time ran out' : ''}, in ${clock(Math.min(Date.now(), end) - start)}.</p>
        ${pacing}
        ${missed.length ? `<p class="small">Patterns you missed: ${missed.map(esc).join(', ')}. <a href="#/oa/seq/practice/weak">Practise your weak spots</a>.</p>` : ''}
        ${wrong.length ? `<h2>Review</h2>${wrong.map((x) => `<div class="card"><div class="question">What comes next? <span class="mono"><b>${esc(x.q)}</b></span></div><p class="small">You: ${esc(x.you)} · answer <b>${esc(x.al)}</b></p><div class="solution"><b>${esc(BY_ID[x.fam].name)}.</b> ${esc(x.rule)}${x.diffs ? ` <span class="small">${esc(x.diffs)}</span>` : ''}</div></div>`).join('')}` : ''}`);
    }
    tick();
    next();
  }

  QT.seq = { FAMILIES, MODES, make, check, hub, practice, test, weakFamilies };
})();
