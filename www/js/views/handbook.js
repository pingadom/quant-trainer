// The handbook: #/handbook lists the course; #/handbook/<chapter> is one chapter. Content lives in
// handbook-content.js. Each "check yourself" question is answered inline; a chapter is done when
// every check has been answered correctly. Progress is saved in state.handbook.
(function () {
  const store = QT.store, R = QT.rand, f = QT.fmtNum, esc = QT.escapeHtml;
  const HB = () => QT.handbook;
  const order = () => HB().PARTS.flatMap((p) => p.chapters);
  const chapter = (id) => HB().CHAPTERS[id];
  const checksOf = (ch) => (ch.sections || []).flatMap((s) => s.checks || []);
  const rec = (id) => store.get().handbook?.[id] || { c: {}, done: false };

  function progress(id) {
    const ch = chapter(id), n = checksOf(ch).length, r = rec(id);
    const right = Object.values(r.c || {}).filter(Boolean).length;
    return { n, right, done: !ch.planned && n > 0 && right >= n };
  }
  function markCheck(id, idx, ok) {
    const s = store.get();
    s.handbook ||= {};
    const r = (s.handbook[id] ||= { c: {}, done: false });
    if (ok) r.c[idx] = 1;
    else if (!r.c[idx]) r.c[idx] = 0;
    const p = progress(id);
    const justDone = p.done && !r.done;
    r.done = p.done;
    store.touchDay();
    store.save();
    return justDone;
  }
  // The next chapter to work on: the first written chapter that isn't done.
  const nextChapter = () => order().find((id) => !chapter(id).planned && !progress(id).done);

  // ---------------------------------------------------------------- index
  function index(el) {
    const written = order().filter((id) => !chapter(id).planned);
    const done = written.filter((id) => progress(id).done).length, next = nextChapter();
    el.innerHTML = `
      <h1>Handbook</h1>
      <p class="lede">A course from the basics up to everything quant trading interviews test. Each chapter is short explanations, worked examples and interactive tools, with questions to check yourself as you go. Work through it in order, or jump to what you need.</p>
      <div class="card hb-overview">
        <div class="row" style="justify-content:space-between"><b>${done} of ${written.length} chapters done</b>${next ? `<a class="btn" href="#/handbook/${next}">${done ? 'Continue' : 'Start'}: ${esc(chapter(next).title)}</a>` : ''}</div>
        <div class="bar stack" role="progressbar" aria-label="Chapters done" aria-valuenow="${written.length ? Math.round((100 * done) / written.length) : 0}" aria-valuemin="0" aria-valuemax="100"><i style="width:${written.length ? (100 * done) / written.length : 0}%"></i></div>
      </div>
      ${HB().PARTS.map((part) => `
        <h2>${esc(part.title)}</h2>
        <p class="small">${esc(part.blurb)}</p>
        <div class="hb-chapters">${part.chapters.map((id, i) => {
          const ch = chapter(id), p = progress(id);
          if (ch.planned) return `<div class="card hb-chapter planned"><div class="hb-num">${order().indexOf(id) + 1}</div><div><b>${esc(ch.title)}</b> <span class="chip">coming soon</span><p class="small">${esc(ch.blurb)}</p><p class="small">Practise now: ${ch.practice.map(([l, h]) => `<a href="${h}">${esc(l)}</a>`).join(' · ')}</p></div></div>`;
          const state = p.done ? 'done' : p.right ? 'started' : '';
          return `<a class="card hb-chapter ${state}" href="#/handbook/${id}"><div class="hb-num">${p.done ? '✓' : order().indexOf(id) + 1}</div><div><b>${esc(ch.title)}</b><p class="small">${ch.minutes} min · ${p.n} checks${p.right && !p.done ? ` · ${p.right} done` : ''}${p.done ? ' · done' : ''}</p></div></a>`;
        }).join('')}</div>`).join('')}`;
  }

  // ---------------------------------------------------------------- chapter
  function view(el, id) {
    const ch = chapter(id);
    if (!ch || ch.planned) return index(el);
    const ids = order().filter((x) => !chapter(x).planned), at = ids.indexOf(id);
    const prev = ids[at - 1], next = ids[at + 1];
    const part = HB().PARTS.find((p) => p.chapters.includes(id));
    let k = 0;
    const r = rec(id);
    el.innerHTML = `
      <a class="back" href="#/handbook">← Handbook</a>
      <div class="eyebrow">${esc(part.title)} · chapter ${order().indexOf(id) + 1} · ${ch.minutes} min</div>
      <h1>${esc(ch.title)}</h1>
      <div class="card hb-goals"><b>You'll be able to</b><ul>${ch.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
        <p class="small" id="hb-progress"></p></div>
      ${ch.sections.map((s) => `
        <section class="hb-section">
          <h2>${esc(s.h)}</h2>
          <div class="hb-text">${s.html}</div>
          ${s.widget ? `<div class="card hb-widget" data-widget="${s.widget}"></div>` : ''}
          ${(s.checks || []).map((c) => { const idx = k++; return checkCard(c, idx, r.c?.[idx] === 1); }).join('')}
        </section>`).join('')}
      <h2>Key takeaways</h2>
      <ul class="hb-takeaways">${ch.takeaways.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <h2>Practise it</h2>
      <p>${ch.practice.map(([l, h]) => `<a class="btn ghost" href="${h}">${esc(l)}</a>`).join(' ')}</p>
      <div class="row hb-nav">${prev ? `<a class="btn ghost" href="#/handbook/${prev}">← ${esc(chapter(prev).title)}</a>` : ''}${next ? `<a class="btn" href="#/handbook/${next}">${esc(chapter(next).title)} →</a>` : `<a class="btn" href="#/handbook">Back to the handbook</a>`}</div>`;
    const drawProgress = () => {
      const p = progress(id);
      el.querySelector('#hb-progress').innerHTML = p.done ? '✓ Chapter done: every check answered correctly.' : `Checks answered correctly: <b>${p.right} of ${p.n}</b>. Answer them all to finish the chapter.`;
    };
    drawProgress();
    el.querySelectorAll('.hb-check').forEach((box) => wireCheck(box, id, ch, drawProgress));
    el.querySelectorAll('[data-widget]').forEach((w) => (WIDGETS[w.dataset.widget] || (() => {}))(w));
  }

  function checkCard(c, idx, solved) {
    return `
      <form class="card hb-check${solved ? ' solved' : ''}" data-idx="${idx}" autocomplete="off">
        <div class="eyebrow">Check yourself</div>
        <p class="question">${c.q}</p>
        <div class="answer-row">
          <input type="text" inputmode="${c.a < 0 ? 'text' : 'decimal'}" aria-label="Your answer" placeholder="${solved ? 'Solved. Try it again?' : 'Your answer'}">
          <button>Check</button>
        </div>
        <div class="row hb-check-actions">${c.hint ? '<button type="button" class="link" data-act="hint">Hint</button>' : ''}<button type="button" class="link" data-act="show">Show solution</button></div>
        <p class="small hb-hint" hidden>${c.hint || ''}</p>
        <div class="hb-fb" aria-live="polite"></div>
        <div class="solution" hidden>${c.sol}</div>
      </form>`;
  }

  function wireCheck(box, id, ch, onChange) {
    const idx = +box.dataset.idx, c = checksOf(ch)[idx], input = box.querySelector('input'), fb = box.querySelector('.hb-fb');
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = QT.parseAnswer(input.value);
      if (!input.value.trim()) return (fb.textContent = 'Type an answer first.');
      if (Number.isNaN(v)) return (fb.textContent = "Couldn't read that. Try 0.25, 1/4 or 25%.");
      const ok = QT.isCorrect(v, c.a, c.tol || {});
      const finished = markCheck(id, idx, ok);
      fb.innerHTML = ok ? `<span class="fb-inline ok">✓ Correct${finished ? ' · chapter done!' : ''}</span>` : `<span class="fb-inline bad">Not quite. Try again, or use the hint.</span>`;
      if (ok) {
        box.classList.add('solved');
        box.querySelector('.solution').hidden = false;
      }
      onChange();
    });
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'hint') box.querySelector('.hb-hint').hidden = false;
      if (act === 'show') {
        box.querySelector('.solution').hidden = false;
        fb.innerHTML = `<span class="small">Read it, then try the next check. This one stays open to try again.</span>`;
      }
    });
  }

  // ---------------------------------------------------------------- interactive tools
  // Bars as an inline SVG: values in [0, max]; optional exact markers drawn as ticks.
  function bars(values, labels, opts = {}) {
    const max = opts.max || Math.max(...values, ...(opts.exact || [0])) || 1, n = values.length, W = 100, H = 40, bw = W / n;
    const rects = values.map((v, i) => `<rect class="hb-bar" x="${i * bw + bw * 0.12}" y="${H - (v / max) * H}" width="${bw * 0.76}" height="${(v / max) * H}"></rect>`).join('');
    const ticks = (opts.exact || []).map((v, i) => `<line class="hb-exact" x1="${i * bw + bw * 0.05}" x2="${i * bw + bw * 0.95}" y1="${H - (v / max) * H}" y2="${H - (v / max) * H}" vector-effect="non-scaling-stroke"></line>`).join('');
    return `<svg class="hb-bars" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opts.label || 'Bar chart')}">${rects}${ticks}</svg>
      <div class="hb-bar-labels" style="grid-template-columns:repeat(${n},1fr)">${labels.map((l) => `<span>${l}</span>`).join('')}</div>`;
  }
  const choose = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

  const WIDGETS = {
    // Counting calculator: one n and k, four ways of counting.
    counting(box) {
      box.innerHTML = `<b>Try it: four ways to count</b>
        <div class="row hb-controls"><label>n <input type="number" min="1" max="20" value="5" data-n></label><label>k <input type="number" min="0" max="20" value="3" data-k></label></div>
        <div class="hb-out"></div>`;
      const draw = () => {
        const n = Math.max(1, Math.min(20, Math.floor(+box.querySelector('[data-n]').value || 1))), k = Math.max(0, Math.min(20, Math.floor(+box.querySelector('[data-k]').value || 0)));
        const perm = k <= n ? choose(n, k) * [...Array(k)].reduce((a, _, i) => a * (i + 1), 1) : 0;
        box.querySelector('.hb-out').innerHTML = `<table class="hb-table">
          <tr><td>Ordered, with repeats (codes)</td><td>n<sup>k</sup></td><td class="mono">${f(n ** k)}</td></tr>
          <tr><td>Ordered, no repeats (podium)</td><td>n!/(n − k)!</td><td class="mono">${f(perm)}</td></tr>
          <tr><td>Unordered, no repeats (a hand)</td><td>C(n, k)</td><td class="mono">${f(choose(n, k))}</td></tr>
          <tr><td>k identical items into n boxes</td><td>C(k + n − 1, n − 1)</td><td class="mono">${f(choose(k + n - 1, n - 1))}</td></tr></table>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Dice simulator: simulated distribution of the total against the exact one.
    dice(box) {
      box.innerHTML = `<b>Try it: roll dice many times</b>
        <div class="row hb-controls"><label>Dice <select data-d><option>1</option><option selected>2</option><option>3</option></select></label><button type="button" data-r="100">Roll 100</button><button type="button" class="ghost" data-r="10000">Roll 10,000</button></div>
        <div class="hb-out"><p class="small">Roll to see how often each total comes up. The lines mark the exact probabilities.</p></div>`;
      const exact = (d) => { let dist = [1]; for (let i = 0; i < d; i++) { const nd = Array(dist.length + 6).fill(0); dist.forEach((p, s) => { for (let k = 1; k <= 6; k++) nd[s + k] += p / 6; }); dist = nd; } return dist.slice(d); };
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-r]');
        if (!b) return;
        const d = +box.querySelector('[data-d]').value, n = +b.dataset.r, counts = Array(5 * d + 1).fill(0);
        for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < d; j++) s += R.die(); counts[s - d]++; }
        const freq = counts.map((c) => c / n), ex = exact(d);
        box.querySelector('.hb-out').innerHTML = bars(freq, freq.map((_, i) => i + d), { exact: ex, label: `Frequencies of the total of ${d} dice over ${n} rolls` })
          + `<p class="small">${f(n)} rolls. Most common total: ${freq.indexOf(Math.max(...freq)) + d}. With more rolls the bars hug the exact lines.</p>`;
      });
    },
    // Bayes with natural frequencies, out of 1,000 people.
    bayes(box) {
      box.innerHTML = `<b>Try it: a test for a rare condition, out of 1,000 people</b>
        <div class="hb-sliders">
          <label>Has the condition <input type="range" min="0.5" max="50" step="0.5" value="1" data-p> <span class="mono" data-pv></span></label>
          <label>Test catches <input type="range" min="50" max="100" step="1" value="99" data-s> <span class="mono" data-sv></span></label>
          <label>False alarms <input type="range" min="0" max="30" step="0.5" value="5" data-f> <span class="mono" data-fv></span></label>
        </div><div class="hb-out"></div>`;
      const draw = () => {
        const p = +box.querySelector('[data-p]').value / 100, s = +box.querySelector('[data-s]').value / 100, fa = +box.querySelector('[data-f]').value / 100;
        box.querySelector('[data-pv]').textContent = `${f(p * 100)}%`; box.querySelector('[data-sv]').textContent = `${f(s * 100)}%`; box.querySelector('[data-fv]').textContent = `${f(fa * 100)}%`;
        const sick = 1000 * p, tp = sick * s, fp = (1000 - sick) * fa, post = tp + fp ? tp / (tp + fp) : 0;
        box.querySelector('.hb-out').innerHTML = `<p>Of 1,000 people, <b>${f(+sick.toFixed(1))}</b> have it and <b>${f(+tp.toFixed(1))}</b> of them test positive. Of the ${f(+(1000 - sick).toFixed(1))} who don't, <b>${f(+fp.toFixed(1))}</b> test positive anyway.</p>
          <div class="hb-split" aria-hidden="true"><i class="tp" style="flex:${tp}"></i><i class="fp" style="flex:${fp}"></i></div>
          <p>A positive result means the condition with probability <b>${f(+(post * 100).toFixed(1))}%</b>: true positives ÷ all positives.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Law of large numbers: the running average of die rolls.
    lln(box) {
      box.innerHTML = `<b>Try it: the running average of die rolls</b>
        <div class="row hb-controls"><button type="button" data-n="50">50 rolls</button><button type="button" class="ghost" data-n="1000">1,000 rolls</button></div>
        <div class="hb-out"><p class="small">Roll to watch the average settle towards 3.5.</p></div>`;
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-n]');
        if (!b) return;
        const n = +b.dataset.n, avg = [];
        let s = 0;
        for (let i = 1; i <= n; i++) { s += R.die(); avg.push(s / i); }
        box.querySelector('.hb-out').innerHTML = QT.chart.line([{ name: 'Running average', values: avg }], { label: `Running average of ${n} die rolls`, target: { y: 3.5, name: 'Expected value 3.5' }, xFirst: '1', xLast: f(n), min: 1, max: 6 })
          + `<p class="small">After ${f(n)} rolls the average is ${f(+avg[n - 1].toFixed(3))}. Early on it swings a lot; later each roll barely moves it.</p>`;
      });
    },
    // √n rule: the spread of the average of n dice.
    sqrtn(box) {
      box.innerHTML = `<b>Try it: average n dice, many times</b>
        <label class="hb-sliders">Dice in each average: <input type="range" min="1" max="100" value="4" data-n> <span class="mono" data-nv></span></label>
        <div class="hb-out"></div>`;
      const draw = () => {
        const n = +box.querySelector('[data-n]').value, T = 3000, bins = Array(26).fill(0);
        box.querySelector('[data-nv]').textContent = n;
        for (let t = 0; t < T; t++) { let s = 0; for (let i = 0; i < n; i++) s += R.die(); const a = s / n; bins[Math.min(25, Math.floor((a - 1) * 5))]++; }
        const sd = Math.sqrt(35 / 12 / n);
        box.querySelector('.hb-out').innerHTML = bars(bins.map((c) => c / T), bins.map((_, i) => (i % 5 === 0 ? 1 + i / 5 : '')), { label: `Distribution of the average of ${n} dice` })
          + `<p class="small">Standard deviation of the average: σ/√n = 1.71/√${n} ≈ <b>${f(+sd.toFixed(3))}</b>. Four times as many dice halves it.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Distribution explorer: binomial, geometric or Poisson, with mean and standard deviation.
    dist(box) {
      box.innerHTML = `<b>Try it: explore a distribution</b>
        <div class="row hb-controls"><label>Distribution <select data-k><option value="binom">Binomial (n = 20)</option><option value="geom">Geometric</option><option value="pois">Poisson</option></select></label>
          <label><span data-pl>p</span> <input type="range" min="0.05" max="0.95" step="0.05" value="0.3" data-p> <span class="mono" data-pv></span></label></div>
        <div class="hb-out"></div>`;
      const fact = (n) => (n < 2 ? 1 : n * fact(n - 1));
      const draw = () => {
        const kind = box.querySelector('[data-k]').value, slider = box.querySelector('[data-p]');
        if (kind === 'pois') { slider.min = 0.5; slider.max = 10; slider.step = 0.5; } else { slider.min = 0.05; slider.max = 0.95; slider.step = 0.05; }
        if (+slider.value > +slider.max) slider.value = slider.max;
        const p = +slider.value;
        box.querySelector('[data-pl]').textContent = kind === 'pois' ? 'λ' : 'p';
        box.querySelector('[data-pv]').textContent = f(p);
        let ks, probs, mean, sd;
        if (kind === 'binom') { ks = [...Array(21).keys()]; probs = ks.map((k) => choose(20, k) * p ** k * (1 - p) ** (20 - k)); mean = 20 * p; sd = Math.sqrt(20 * p * (1 - p)); }
        else if (kind === 'geom') { ks = [...Array(20).keys()].map((k) => k + 1); probs = ks.map((k) => (1 - p) ** (k - 1) * p); mean = 1 / p; sd = Math.sqrt(1 - p) / p; }
        else { ks = [...Array(21).keys()]; probs = ks.map((k) => Math.exp(-p) * p ** k / fact(k)); mean = p; sd = Math.sqrt(p); }
        box.querySelector('.hb-out').innerHTML = bars(probs, ks.map((k) => (k % (ks.length > 12 ? 2 : 1) === 0 ? k : '')), { label: `${kind} distribution` })
          + `<p class="small">Mean <b>${f(+mean.toFixed(3))}</b> · standard deviation <b>${f(+sd.toFixed(3))}</b>${kind === 'geom' ? ' (shown up to 20 tries)' : ''}.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Pattern race: average flips until a pattern first appears, by simulation and exactly.
    pattern(box) {
      const EXACT = { HH: 6, HT: 4, HTH: 10, HHT: 8, HHH: 14, HTT: 8 };
      box.innerHTML = `<b>Try it: how long until a pattern appears?</b>
        <div class="row hb-controls"><label>Pattern <select data-pat>${Object.keys(EXACT).map((k) => `<option>${k}</option>`).join('')}</select></label><button type="button" data-go>Flip 2,000 times over</button></div>
        <div class="hb-out"><p class="small">Pick a pattern and simulate. Notice that patterns that overlap with themselves take longer.</p></div>`;
      box.querySelector('[data-go]').addEventListener('click', () => {
        const pat = box.querySelector('[data-pat]').value, T = 2000;
        let tot = 0;
        for (let t = 0; t < T; t++) { let s = '', n = 0; while (!s.endsWith(pat)) { s = (s + (Math.random() < 0.5 ? 'H' : 'T')).slice(-3); n++; } tot += n; }
        box.querySelector('.hb-out').innerHTML = `<p>Average over ${f(T)} games: <b>${f(+(tot / T).toFixed(2))}</b> flips (exactly ${EXACT[pat]}).</p>`;
      });
    },
    // Two-state chain: the long-run share of time in each state, exact and simulated.
    markov(box) {
      box.innerHTML = `<b>Try it: a two-state chain</b>
        <div class="hb-sliders">
          <label>P(sunny → rainy) <input type="range" min="0.05" max="0.95" step="0.05" value="0.3" data-a> <span class="mono" data-av></span></label>
          <label>P(rainy → sunny) <input type="range" min="0.05" max="0.95" step="0.05" value="0.5" data-b> <span class="mono" data-bv></span></label>
        </div><div class="hb-out"></div>`;
      const draw = () => {
        const a = +box.querySelector('[data-a]').value, b = +box.querySelector('[data-b]').value;
        box.querySelector('[data-av]').textContent = f(a); box.querySelector('[data-bv]').textContent = f(b);
        let s = 0, rainy = 0;
        for (let t = 0; t < 5000; t++) { s = s === 0 ? (Math.random() < a ? 1 : 0) : (Math.random() < b ? 0 : 1); rainy += s; }
        box.querySelector('.hb-out').innerHTML = `<p>Long-run share of rainy days: exactly a/(a + b) = <b>${f(+(a / (a + b)).toFixed(3))}</b>; in a 5,000-day simulation, ${f(+(rainy / 5000).toFixed(3))}.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Gambler's ruin: simulated paths and the share that reach the top.
    walk(box) {
      box.innerHTML = `<b>Try it: walk from i until 0 or N</b>
        <div class="row hb-controls"><label>Start <input type="number" min="1" max="19" value="4" data-i></label><label>Top <input type="number" min="2" max="20" value="10" data-n></label><label>P(step up) <input type="number" min="0.1" max="0.9" step="0.05" value="0.5" data-p></label><button type="button" data-go>Run 2,000 walks</button></div>
        <div class="hb-out"></div>`;
      box.querySelector('[data-go]').addEventListener('click', () => {
        const N = Math.max(2, Math.min(20, Math.floor(+box.querySelector('[data-n]').value))), i = Math.max(1, Math.min(N - 1, Math.floor(+box.querySelector('[data-i]').value))), p = Math.max(0.1, Math.min(0.9, +box.querySelector('[data-p]').value));
        let up = 0, steps = 0;
        const paths = [];
        for (let t = 0; t < 2000; t++) { let x = i; const path = [x]; while (x > 0 && x < N) { x += Math.random() < p ? 1 : -1; steps++; if (t < 3 && path.length < 400) path.push(x); } if (x === N) up++; if (t < 3) paths.push({ name: `Walk ${t + 1}`, values: path }); }
        const r = (1 - p) / p, exact = Math.abs(p - 0.5) < 1e-9 ? i / N : (1 - r ** i) / (1 - r ** N);
        box.querySelector('.hb-out').innerHTML = QT.chart.line(paths, { label: 'Three sample walks', min: 0, max: N, xFirst: '0', xLast: 'steps' })
          + `<p class="small">Reached ${N} in <b>${f(+(up / 20).toFixed(1))}%</b> of 2,000 walks (exactly ${f(+(exact * 100).toFixed(1))}%). Average length ${f(+(steps / 2000).toFixed(1))} steps${Math.abs(p - 0.5) < 1e-9 ? ` (exactly i(N − i) = ${i * (N - i)})` : ''}.</p>`;
      });
    },
    // Reroll game: threshold and value by backward induction, for 3 to 10 rerolls (the checks cover 1 and 2).
    reroll(box) {
      box.innerHTML = `<b>Try it: a die you may reroll</b>
        <label class="hb-sliders">Rerolls allowed: <input type="range" min="3" max="10" value="3" data-r> <span class="mono" data-rv></span></label>
        <div class="hb-out"></div>`;
      const draw = () => {
        const n = +box.querySelector('[data-r]').value;
        box.querySelector('[data-rv]').textContent = n;
        let v = 3.5, keep = [];
        for (let k = 1; k <= n; k++) { keep = [1, 2, 3, 4, 5, 6].filter((x) => x > v); v = (keep.reduce((a, b) => a + b, 0) + (6 - keep.length) * v) / 6; }
        box.querySelector('.hb-out').innerHTML = `<p>On the first roll, keep <b>${keep[0]} or more</b>. The game is worth <b>${f(+v.toFixed(3))}</b>.</p>
          <p class="small">Each extra reroll adds less value: it creeps towards 6.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Probability as area: random points in the square, X + Y < t.
    area(box) {
      box.innerHTML = `<b>Try it: probability as area</b>
        <label class="hb-sliders">Region X + Y &lt; t, with t = <input type="range" min="0.1" max="1.9" step="0.1" value="1.2" data-t> <span class="mono" data-tv></span></label>
        <div class="hb-out"></div>`;
      const draw = () => {
        const t = +box.querySelector('[data-t]').value, pts = [];
        box.querySelector('[data-tv]').textContent = f(t);
        let hit = 0;
        for (let k = 0; k < 600; k++) { const x = Math.random(), y = Math.random(), inside = x + y < t; hit += inside; pts.push(`<circle cx="${x * 100}" cy="${100 - y * 100}" r="1.1" class="${inside ? 'hb-in' : 'hb-outpt'}"></circle>`); }
        const exact = t <= 1 ? t * t / 2 : 1 - (2 - t) ** 2 / 2;
        box.querySelector('.hb-out').innerHTML = `<svg class="hb-square" viewBox="0 0 100 100" role="img" aria-label="600 random points in the unit square">${pts.join('')}<line x1="${Math.max(0, t - 1) * 100}" y1="${100 - Math.min(1, t) * 100}" x2="${Math.min(1, t) * 100}" y2="${100 - Math.max(0, t - 1) * 100}" class="hb-exact" vector-effect="non-scaling-stroke"></line></svg>
          <p class="small">${hit} of 600 points fall in the region: ${f(+(hit / 600).toFixed(3))}. The exact area is <b>${f(+exact.toFixed(3))}</b>.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
  };

  QT.views = Object.assign(QT.views || {}, { handbook: (el, id) => (id ? view(el, id) : index(el)) });
  QT.handbookProgress = { progress, nextChapter, order };
})();
