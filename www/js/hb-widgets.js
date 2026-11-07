// Interactive tools for the handbook's later chapters. Each is a function given an empty box, as in
// views/handbook.js. Their defaults are chosen not to reproduce the answer to any check.
(function () {
  const f = (x, d = 3) => QT.fmtNum(+(+x).toFixed(d));
  const Fig = () => QT.hbFig;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const Phi = (z) => {
    // Abramowitz and Stegun 26.2.17: accurate to about 1e-7.
    const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };
  const val = (box, k) => +box.querySelector(`[data-${k}]`).value;
  const show = (box, k, v) => { box.querySelector(`[data-${k}v]`).textContent = v; };
  const slider = (k, label, min, max, step, value) => `<label>${label} <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-${k} aria-label="${label}"> <span class="mono" data-${k}v></span></label>`;
  const out = (box, html) => { box.querySelector('.hb-out').innerHTML = html; };

  QT.hbWidgets = {
    // The central limit theorem: histogram of standardised averages against the normal curve.
    clt(box) {
      const DIST = {
        die: { name: 'A die', mu: 3.5, sd: Math.sqrt(35 / 12), draw: () => 1 + Math.floor(Math.random() * 6) },
        coin: { name: 'A rare event (p = 0.1)', mu: 0.1, sd: 0.3, draw: () => (Math.random() < 0.1 ? 1 : 0) },
        exp: { name: 'A skewed wait (exponential)', mu: 1, sd: 1, draw: () => -Math.log(1 - Math.random()) },
      };
      box.innerHTML = `<b>Try it: average n draws, again and again</b>
        <div class="row hb-controls"><label>Draw from <select data-k>${Object.entries(DIST).map(([k, d]) => `<option value="${k}">${d.name}</option>`).join('')}</select></label></div>
        <div class="hb-sliders">${slider('n', 'n in each average', 1, 100, 1, 2)}</div><div class="hb-out"></div>`;
      const draw = () => {
        const d = DIST[box.querySelector('[data-k]').value], n = val(box, 'n'), T = 4000, bins = Array(31).fill(0);
        show(box, 'n', n);
        for (let t = 0; t < T; t++) {
          let s = 0;
          for (let i = 0; i < n; i++) s += d.draw();
          const z = (s / n - d.mu) / (d.sd / Math.sqrt(n)), b = Math.floor((z + 4) / (8 / 31));
          if (b >= 0 && b < 31) bins[b]++;
        }
        const w = 8 / 31, dens = bins.map((c) => c / T / w);
        const N = Fig().normal();
        out(box, `${Fig()({ fig: 'bars', vals: dens, max: Math.max(0.5, ...dens), h: 170, tone: () => '', alt: `Histogram of ${T} standardised averages of ${n} draws.` })}
          ${Fig()({ fig: 'plot', x: [-4, 4], y: [0, Math.max(0.5, ...dens)], h: 120, xt: [-2, 0, 2], fns: [{ f: N, tone: 'ink' }], alt: 'The standard normal curve, for comparison.', cap: 'Above: your averages, standardised. Below: the normal curve. The shape matches as n grows, whatever you started from.' })}`);
      };
      box.addEventListener('input', draw);
      draw();
    },

    // Confidence intervals: how many of 40 intervals catch the true mean?
    ci(box) {
      box.innerHTML = `<b>Try it: 40 samples, 40 intervals</b>
        <div class="row hb-controls"><label>Multiplier <select data-z><option value="1">1 (about 68%)</option><option value="1.645">1.645 (90%)</option><option value="1.96" selected>1.96 (95%)</option></select></label>
          <label>Sample size <select data-n><option>5</option><option selected>30</option><option>200</option></select></label><button type="button" data-go>New samples</button></div><div class="hb-out"></div>`;
      const draw = () => {
        const z = val(box, 'z'), n = val(box, 'n'), segs = [];
        let hit = 0;
        for (let i = 0; i < 40; i++) {
          let s = 0, q = 0;
          for (let k = 0; k < n; k++) { const x = gauss(); s += x; q += x * x; }
          const m = s / n, sd = Math.sqrt((q - n * m * m) / (n - 1)), half = (z * sd) / Math.sqrt(n), ok = Math.abs(m) <= half;
          hit += ok;
          segs.push([m - half, i + 1, m + half, i + 1, ok ? 'ok' : '']);
        }
        out(box, `${Fig()({ fig: 'plot', x: [-1.6, 1.6], y: [0, 41], h: 260, xt: [-1, 0, 1], vlines: [{ x: 0, t: 'true mean', tone: 'acc' }], segs, alt: 'Forty horizontal intervals; those missing the true mean are red.' })}
          <p class="small"><b>${hit} of 40</b> intervals contain the true mean. The mean is fixed; it's the intervals that move.</p>`);
      };
      box.addEventListener('change', draw);
      box.querySelector('[data-go]').addEventListener('click', draw);
      draw();
    },

    // Multiple testing: test many signals that are pure noise.
    noise(box) {
      box.innerHTML = `<b>Try it: test signals that are pure noise</b>
        <div class="hb-sliders">${slider('n', 'Signals tested', 5, 200, 5, 30)}</div><button type="button" data-go>Run the tests</button><div class="hb-out"></div>`;
      const draw = () => {
        const n = val(box, 'n'), z = Array.from({ length: n }, gauss), hits = z.filter((x) => Math.abs(x) > 1.96).length, best = Math.max(...z.map(Math.abs));
        show(box, 'n', n);
        out(box, `${Fig()({ fig: 'bars', vals: z.map(Math.abs), max: 4, h: 150, tone: (i) => (Math.abs(z[i]) > 1.96 ? 'bad' : 'acc-soft'), alt: `Absolute t statistics of ${n} noise signals.` })}
          <p class="small"><b>${hits}</b> look "significant" at 5%, and the best has |t| = <b>${f(best, 2)}</b>. None of them is real. Bonferroni would ask for p &lt; ${f(0.05 / n, 4)}.</p>`);
      };
      box.querySelector('[data-go]').addEventListener('click', draw);
      box.addEventListener('input', draw);
      draw();
    },

    // Regression: a scatter, its fitted line, and what one outlier does.
    fit(box) {
      box.innerHTML = `<b>Try it: fit a line</b>
        <div class="hb-sliders">${slider('r', 'True correlation', -0.9, 0.9, 0.1, 0.4)}${slider('o', 'Move one outlier up', 0, 12, 1, 0)}</div><div class="hb-out"></div>`;
      const base = Fig().scatter(40, 1 - 1e-9, 7).map((p) => p.x), noise = Fig().scatter(40, 0, 3).map((p) => p.y);
      const draw = () => {
        const r = val(box, 'r'), o = val(box, 'o'), n = Math.min(base.length, noise.length);
        show(box, 'r', f(r, 1)); show(box, 'o', o);
        const xs = base.slice(0, n), ys = xs.map((x, i) => r * x + Math.sqrt(1 - r * r) * noise[i]);
        if (o) { xs.push(2.8); ys.push(o); }
        const m = xs.length, mx = xs.reduce((a, b) => a + b, 0) / m, my = ys.reduce((a, b) => a + b, 0) / m;
        let sxx = 0, sxy = 0, syy = 0;
        xs.forEach((x, i) => { sxx += (x - mx) ** 2; sxy += (x - mx) * (ys[i] - my); syy += (ys[i] - my) ** 2; });
        const b = sxy / sxx, a = my - b * mx, R2 = (sxy * sxy) / (sxx * syy);
        out(box, `${Fig()({ fig: 'plot', x: [-3, 3], y: [-4, 13], h: 260, w: 340, xt: [-2, 0, 2], yt: [-3, 0, 6, 12], pts: xs.map((x, i) => ({ x, y: ys[i], r: 2.6, tone: i === n ? 'bad' : 'acc' })), fns: [{ f: (x) => a + b * x, tone: 'ok' }], alt: 'A scatter of points with its least-squares line.' })}
          <p class="small">Slope <b>${f(b, 2)}</b> · R² <b>${f(R2, 2)}</b>. One point far from the crowd, at the edge of the x range, can swing the slope. Squared errors make OLS sensitive to outliers.</p>`);
      };
      box.addEventListener('input', draw);
      draw();
    },

    // Two assets: portfolio volatility against weight, for any correlation.
    portfolio(box) {
      box.innerHTML = `<b>Try it: two assets</b>
        <div class="hb-sliders">${slider('r', 'Correlation', -1, 1, 0.1, 0.3)}${slider('s', 'Volatility of asset B', 10, 50, 5, 40)}</div><div class="hb-out"></div>`;
      const draw = () => {
        const rho = val(box, 'r'), s1 = 0.15, s2 = val(box, 's') / 100;
        show(box, 'r', f(rho, 1)); show(box, 's', `${s2 * 100 | 0}%`);
        const vol = (w) => Math.sqrt(Math.max(0, w * w * s1 * s1 + (1 - w) * (1 - w) * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2));
        const c = rho * s1 * s2, d = s1 * s1 + s2 * s2 - 2 * c, best = d > 1e-9 ? Math.max(0, Math.min(1, (s2 * s2 - c) / d)) : 0.5;
        out(box, `${Fig()({ fig: 'plot', x: [0, 1], y: [0, 0.5], h: 210, xl: 'weight in asset A (volatility 15%)', yl: 'portfolio volatility', xt: [0, 0.5, 1], yt: [0, 0.2, 0.4], fns: [{ f: vol }], pts: [{ x: best, y: vol(best), tone: 'ok' }], alt: 'Portfolio volatility against weight, with the minimum marked.' })}
          <p class="small">Lowest risk: <b>${f(best * 100, 0)}%</b> in A, for a volatility of <b>${f(vol(best) * 100, 1)}%</b>. Try correlation −1, and then +1.</p>`);
      };
      box.addEventListener('input', draw);
      draw();
    },

    // AR(1): persistence, and how it looks.
    ar1(box) {
      box.innerHTML = `<b>Try it: an AR(1) process</b>
        <div class="hb-sliders">${slider('p', 'φ, the persistence', -0.9, 1, 0.05, 0.6)}</div><button type="button" data-go>New path</button><div class="hb-out"></div>`;
      const draw = () => {
        const phi = val(box, 'p'), xs = [0];
        show(box, 'p', f(phi, 2));
        for (let i = 1; i < 300; i++) xs.push(phi * xs[i - 1] + gauss());
        const half = phi > 0 && phi < 1 ? Math.log(0.5) / Math.log(phi) : null;
        out(box, `${QT.chart.line([{ name: 'x', values: xs }], { label: `AR(1) path with phi ${phi}`, xFirst: '0', xLast: '300' })}
          <p class="small">${phi >= 1 ? 'φ = 1 is a random walk: shocks never fade and the variance keeps growing.' : `Long-run variance σ²/(1 − φ²) = <b>${f(1 / (1 - phi * phi), 2)}</b>.${half ? ` Half-life of a shock: <b>${f(half, 1)}</b> steps.` : ' Negative φ flips sign each step.'}`}</p>`);
      };
      box.querySelector('[data-go]').addEventListener('click', draw);
      box.addEventListener('input', draw);
      draw();
    },

    // Kelly: growth rate against bet size, with simulated paths at your chosen fraction.
    kelly(box) {
      box.innerHTML = `<b>Try it: bet a fixed fraction every time</b>
        <p class="small">A coin wins with probability 0.55, paying even money.</p>
        <div class="hb-sliders">${slider('f', 'Fraction of wealth bet', 0, 0.5, 0.01, 0.3)}</div><div class="hb-out"></div>`;
      const p = 0.55, g = (x) => p * Math.log(1 + x) + (1 - p) * Math.log(1 - x);
      const draw = () => {
        const x = val(box, 'f');
        show(box, 'f', f(x, 2));
        const paths = [0, 1, 2, 3].map((k) => {
          const v = [0];
          for (let i = 1; i <= 500; i++) v.push(v[i - 1] + Math.log(1 + (Math.random() < p ? x : -x)));
          return { name: `Run ${k + 1}`, values: v.map((y) => y / Math.LN10) };
        });
        out(box, `${Fig()({ fig: 'plot', x: [0, 0.5], y: [-0.08, 0.01], h: 190, xl: 'fraction bet', yl: 'growth per bet', xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5], yt: [-0.06, -0.03, 0], fns: [{ f: g }], pts: [{ x, y: Math.max(-0.08, g(x)), tone: 'bad' }], alt: 'Growth rate against fraction bet: it rises, peaks at 0.1 and falls below zero.' })}
          ${QT.chart.line(paths, { label: 'Four runs of 500 bets, log scale', xFirst: '0', xLast: '500 bets', fmt: (y) => `10^${f(y, 1)}` })}
          <p class="small">Expected log growth per bet: <b>${f(g(x), 4)}</b>${g(x) < 0 ? ', which is negative: you are going broke on a winning bet.' : '.'}</p>`);
      };
      box.addEventListener('input', draw);
      draw();
    },

    // Adverse selection: the width that breaks even against informed traders.
    adverse(box) {
      box.innerHTML = `<b>Try it: quoting against informed traders</b>
        <p class="small">The stock is worth 90 or 110, equally likely. Informed traders know which. The rest buy or sell at random.</p>
        <div class="hb-sliders">${slider('m', 'Share of informed traders', 0, 100, 5, 35)}${slider('w', 'Your half-width', 0, 12, 0.5, 2)}</div><div class="hb-out"></div>`;
      const draw = () => {
        const m = val(box, 'm') / 100, w = val(box, 'w');
        show(box, 'm', `${Math.round(m * 100)}%`); show(box, 'w', f(w, 1));
        const fair = m * 10, perTrade = (1 - m) * w + m * (w - 10);
        out(box, `${Fig()({ fig: 'plot', x: [0, 12], y: [-10, 12], h: 190, xl: 'half-width', yl: 'profit per trade', xt: [0, 4, 8, 12], yt: [-8, 0, 8], fns: [{ f: (x) => (1 - m) * x + m * (x - 10) }], vlines: [{ x: fair, t: 'break-even', tone: 'ok' }], pts: [{ x: w, y: perTrade, tone: 'bad' }], alt: 'Profit per trade rises with half-width and crosses zero at the break-even width.' })}
          <p class="small">You make <b>${f(w, 1)}</b> from uninformed traders and lose <b>${f(10 - w, 1)}</b> to informed ones. Break-even half-width: <b>${f(fair, 1)}</b>. Your profit per trade: <b>${f(perTrade, 2)}</b>.</p>`);
      };
      box.addEventListener('input', draw);
      draw();
    },

    // Option payoffs at expiry: pick a position.
    payoff(box) {
      const K = 100, c = (k) => (s) => Math.max(0, s - k), p = (k) => (s) => Math.max(0, k - s);
      const SET = {
        call: ['Long call', (s) => c(K)(s) - 6], put: ['Long put', (s) => p(K)(s) - 6], scall: ['Short call', (s) => 6 - c(K)(s)],
        stock: ['Long stock', (s) => s - K], straddle: ['Straddle (call + put)', (s) => c(K)(s) + p(K)(s) - 12], strangle: ['Strangle (90 put + 110 call)', (s) => p(90)(s) + c(110)(s) - 5],
        spread: ['Call spread (100/110)', (s) => c(100)(s) - c(110)(s) - 4], fly: ['Butterfly (90/100/110)', (s) => c(90)(s) - 2 * c(100)(s) + c(110)(s) - 2], covered: ['Covered call (stock + short call)', (s) => s - K - c(K)(s) + 6], synth: ['Long call + short put', (s) => c(K)(s) - p(K)(s)],
      };
      box.innerHTML = `<b>Try it: payoff at expiry</b>
        <div class="row hb-controls"><label>Position <select data-k>${Object.entries(SET).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label></div><div class="hb-out"></div>`;
      const draw = () => {
        const [name, fn] = SET[box.querySelector('[data-k]').value];
        out(box, Fig()({ fig: 'plot', x: [70, 130], y: [-30, 30], h: 220, xl: 'stock price at expiry', yl: 'profit', xt: [80, 90, 100, 110, 120], yt: [-20, 0, 20], fns: [{ f: fn }], alt: `Profit at expiry of ${name}.`, cap: `${name}, including a typical premium paid or received.` }));
      };
      box.addEventListener('change', draw);
      draw();
    },

    // Black-Scholes value and delta: how time and volatility change a call.
    greeks(box) {
      box.innerHTML = `<b>Try it: a call's value before expiry</b>
        <p class="small">Strike 100, no interest.</p>
        <div class="hb-sliders">${slider('t', 'Time to expiry, in months', 1, 24, 1, 9)}${slider('s', 'Volatility, %', 5, 60, 5, 30)}${slider('x', 'Stock price', 70, 130, 1, 105)}</div><div class="hb-out"></div>`;
      const d1 = (S, sig, T) => (Math.log(S / 100) + (sig * sig * T) / 2) / (sig * Math.sqrt(T));
      const bs = (S, sig, T) => { const a = d1(S, sig, T); return S * Phi(a) - 100 * Phi(a - sig * Math.sqrt(T)); };
      const draw = () => {
        const T = val(box, 't') / 12, sig = val(box, 's') / 100, S = val(box, 'x');
        show(box, 't', val(box, 't')); show(box, 's', `${val(box, 's')}%`); show(box, 'x', S);
        const a = d1(S, sig, T), gam = Math.exp((-a * a) / 2) / (Math.sqrt(2 * Math.PI) * S * sig * Math.sqrt(T));
        out(box, `${Fig()({ fig: 'plot', x: [70, 130], y: [0, 40], h: 220, xl: 'stock price', yl: 'call value', xt: [80, 100, 120], yt: [0, 10, 20, 30], fns: [{ f: (s) => Math.max(0, s - 100), tone: 'muted', dash: true }, { f: (s) => bs(s, sig, T) }], pts: [{ x: S, y: Math.min(40, bs(S, sig, T)), tone: 'bad' }], alt: 'Call value curve above its expiry payoff.' })}
          <p class="small">Value <b>${f(bs(S, sig, T), 2)}</b> · delta <b>${f(Phi(a), 2)}</b> · gamma <b>${f(gam, 3)}</b> per 1 of stock. The gap between the curve and the dashed payoff is time value.</p>`);
      };
      box.addEventListener('input', draw);
      draw();
    },

    // Overfitting: the best of many random backtests.
    overfit(box) {
      box.innerHTML = `<b>Try it: pick the best of many random strategies</b>
        <p class="small">Each strategy has a true Sharpe of zero and a 3-year backtest.</p>
        <div class="hb-sliders">${slider('n', 'Strategies tried', 1, 1000, 1, 40)}</div><button type="button" data-go>Run them</button><div class="hb-out"></div>`;
      const draw = () => {
        const n = val(box, 'n'), years = 3, sr = Array.from({ length: n }, () => gauss() / Math.sqrt(years)), best = Math.max(...sr);
        const later = gauss() / Math.sqrt(years);
        show(box, 'n', n);
        out(box, `<p>Best backtest Sharpe: <b>${f(best, 2)}</b>. The same strategy over the next 3 years: <b>${f(later, 2)}</b>.</p>
          <p class="small">The best of n noise strategies has a Sharpe of about √(2 ln n)/√years = ${f(Math.sqrt(2 * Math.log(Math.max(n, 2)) / years), 2)}. Nothing was learned; you just looked ${n} times.</p>`);
      };
      box.querySelector('[data-go]').addEventListener('click', draw);
      box.addEventListener('input', draw);
      draw();
    },
  };
})();
