// Interactive simulations: Central Limit Theorem and geometric Brownian motion.
(function () {
  const R = QT.rand, M = QT.m, f = QT.fmtNum;

  const DISTS = {
    uniform: { label: 'Uniform(0,1)', mu: 0.5, sd: Math.sqrt(1 / 12), draw: () => Math.random() },
    die: { label: 'Fair die', mu: 3.5, sd: Math.sqrt(35 / 12), draw: () => R.die() },
    exp: { label: 'Exponential(1): skewed', mu: 1, sd: 1, draw: () => -Math.log(1 - Math.random()) },
    bern: { label: 'Bernoulli(0.1): very skewed', mu: 0.1, sd: 0.3, draw: () => (Math.random() < 0.1 ? 1 : 0) },
  };

  function setupCanvas(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function histogram(canvas, data, lo, hi, bins, pdf) {
    const { ctx, w, h } = setupCanvas(canvas);
    const pad = 24, bw = (hi - lo) / bins, counts = new Array(bins).fill(0);
    for (const x of data) {
      const i = Math.floor((x - lo) / bw);
      if (i >= 0 && i < bins) counts[i]++;
    }
    const scale = (v) => v / (data.length * bw); // count → density
    let ymax = Math.max(...counts.map(scale));
    if (pdf) for (let i = 0; i <= 100; i++) ymax = Math.max(ymax, pdf(lo + ((hi - lo) * i) / 100));
    const X = (x) => pad + ((x - lo) / (hi - lo)) * (w - 2 * pad), Y = (y) => h - pad - (y / ymax) * (h - 2 * pad);

    ctx.fillStyle = QT.cssVar('--accent');
    ctx.globalAlpha = 0.55;
    counts.forEach((c, i) => {
      const x0 = X(lo + i * bw), x1 = X(lo + (i + 1) * bw);
      ctx.fillRect(x0 + 0.5, Y(scale(c)), Math.max(1, x1 - x0 - 1), h - pad - Y(scale(c)));
    });
    ctx.globalAlpha = 1;
    if (pdf) {
      ctx.strokeStyle = QT.cssVar('--bad');
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = lo + ((hi - lo) * i) / 200;
        i ? ctx.lineTo(X(x), Y(pdf(x))) : ctx.moveTo(X(x), Y(pdf(x)));
      }
      ctx.stroke();
    }
    ctx.fillStyle = QT.cssVar('--muted');
    ctx.font = '11px system-ui';
    ctx.fillText(f(lo), pad, h - 6);
    ctx.textAlign = 'right';
    ctx.fillText(f(hi), w - pad, h - 6);
    ctx.textAlign = 'left';
  }

  const skew = (a) => {
    const m = M.mean(a), s = M.sd(a);
    return a.reduce((t, x) => t + ((x - m) / s) ** 3, 0) / a.length;
  };

  function render(el) {
    el.innerHTML = `
      <h1>Stats lab</h1>
      <p class="lede">Build intuition by simulation. Being able to check an answer with a quick Monte Carlo is a core quant skill.</p>

      <h2>Central Limit Theorem</h2>
      <div class="card">
        <p class="small">Draw many samples of size n, take each sample's mean, and plot the histogram of those means. The red curve is the CLT's normal approximation N(μ, σ²/n). Try the skewed distributions with small n.</p>
        <div class="controls">
          <div><label>Distribution</label><select id="clt-d">${Object.entries(DISTS).map(([k, d]) => `<option value="${k}">${d.label}</option>`).join('')}</select></div>
          <div><label>Sample size n = <b id="clt-nv">1</b></label><input type="range" id="clt-n" min="1" max="100" value="1"></div>
        </div>
        <canvas id="clt-c"></canvas>
        <div class="stats" id="clt-s"></div>
      </div>

      <h2>Volatility drag (geometric Brownian motion)</h2>
      <div class="card">
        <p class="small">Simulate one year of daily prices, S<sub>t+1</sub> = S<sub>t</sub>·exp((μ − σ²/2)Δt + σ√Δt·Z). The <b>mean</b> terminal price grows at e<sup>μ</sup>, but the <b>median</b> path grows only at e<sup>μ−σ²/2</sup>. Raise σ and watch most paths lose money while the mean still looks good.</p>
        <div class="controls">
          <div><label>Drift μ = <b id="gbm-mv">8%</b></label><input type="range" id="gbm-m" min="-20" max="40" value="8"></div>
          <div><label>Volatility σ = <b id="gbm-sv">30%</b></label><input type="range" id="gbm-s" min="5" max="120" value="30"></div>
          <div><button id="gbm-go" class="ghost">Resimulate</button></div>
        </div>
        <canvas id="gbm-c"></canvas>
        <div class="stats" id="gbm-s-out"></div>
      </div>`;

    const $d = el.querySelector('#clt-d'), $n = el.querySelector('#clt-n');
    const clt = () => {
      const d = DISTS[$d.value], n = +$n.value, reps = 5000, means = new Array(reps);
      el.querySelector('#clt-nv').textContent = n;
      for (let r = 0; r < reps; r++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += d.draw();
        means[r] = s / n;
      }
      const se = d.sd / Math.sqrt(n), mn = Math.min(...means), mx = Math.max(...means);
      let lo, hi, bins;
      if ((d === DISTS.die || d === DISTS.bern) && (mx - mn) * n <= 80) {
        // discrete: sample means live on a k/n lattice, so centre one bin on each lattice point
        lo = mn - 0.5 / n;
        hi = mx + 0.5 / n;
        bins = Math.round((hi - lo) * n);
      } else {
        lo = Math.min(d.mu - 4 * se, mn);
        hi = Math.max(d.mu + 4 * se, mx);
        bins = 50;
      }
      histogram(el.querySelector('#clt-c'), means, lo, hi, bins, (x) => M.normPdf((x - d.mu) / se) / se);
      el.querySelector('#clt-s').innerHTML = `<span>mean of means <b>${f(M.mean(means))}</b> (μ = ${f(d.mu)})</span><span>sd of means <b>${f(M.sd(means))}</b> (σ/√n = ${f(se)})</span><span>skewness <b>${f(skew(means))}</b> (normal = 0)</span>`;
    };
    $d.addEventListener('change', clt);
    $n.addEventListener('input', clt);

    const $m = el.querySelector('#gbm-m'), $s = el.querySelector('#gbm-s');
    const gbm = () => {
      const mu = $m.value / 100, sig = $s.value / 100, steps = 252, dt = 1 / steps, paths = 400, shown = 40;
      el.querySelector('#gbm-mv').textContent = `${$m.value}%`;
      el.querySelector('#gbm-sv').textContent = `${$s.value}%`;
      const drift = (mu - (sig * sig) / 2) * dt, vol = sig * Math.sqrt(dt), all = [], finals = [];
      for (let p = 0; p < paths; p++) {
        let S = 1;
        const path = p < shown ? [1] : null;
        for (let t = 0; t < steps; t++) {
          S *= Math.exp(drift + vol * R.normal());
          if (path) path.push(S);
        }
        if (path) all.push(path);
        finals.push(S);
      }
      const { ctx, w, h } = setupCanvas(el.querySelector('#gbm-c'));
      const pad = 24, ymax = Math.max(1.5, ...all.flat()), ymin = Math.min(0.5, ...all.flat());
      const X = (t) => pad + (t / steps) * (w - 2 * pad), Y = (v) => h - pad - ((Math.log(v) - Math.log(ymin)) / (Math.log(ymax) - Math.log(ymin))) * (h - 2 * pad);
      ctx.strokeStyle = QT.cssVar('--muted');
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad, Y(1));
      ctx.lineTo(w - pad, Y(1));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = QT.cssVar('--accent');
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (const path of all) {
        ctx.beginPath();
        path.forEach((v, t) => (t ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v))));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = QT.cssVar('--muted');
      ctx.font = '11px system-ui';
      ctx.fillText('log scale · start = 1', pad, 14);
      const sorted = [...finals].sort((a, b) => a - b), median = sorted[Math.floor(paths / 2)];
      el.querySelector('#gbm-s-out').innerHTML = `
        <span>mean S<sub>T</sub> <b>${f(M.mean(finals))}</b> (theory e<sup>μ</sup> = ${f(Math.exp(mu))})</span>
        <span>median S<sub>T</sub> <b>${f(median)}</b> (theory e<sup>μ−σ²/2</sup> = ${f(Math.exp(mu - (sig * sig) / 2))})</span>
        <span>paths losing money <b>${Math.round((100 * finals.filter((x) => x < 1).length) / paths)}%</b></span>`;
    };
    $m.addEventListener('input', gbm);
    $s.addEventListener('input', gbm);
    el.querySelector('#gbm-go').addEventListener('click', gbm);

    const onResize = () => { clt(); gbm(); };
    window.addEventListener('resize', onResize);
    QT.cleanup = () => window.removeEventListener('resize', onResize);
    clt();
    gbm();
  }

  QT.lab = { render };
})();
