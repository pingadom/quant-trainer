// Small dependency-free line charts. The plot is an SVG stretched to the container width
// (non-scaling strokes keep lines crisp); axis labels are HTML so text stays readable on phones.
// Colours come from CSS classes, so charts follow the light/dark theme.
(function () {
  const f = QT.fmtNum, esc = QT.escapeHtml;
  const W = 100, H = 40;

  // series: [{ name, values: [number|null…], dashed? }]; values are plotted at equal x spacing.
  // opts: { label (accessible summary), target: { y, name }, xFirst, xLast, fmt, min, max }
  function line(series, opts = {}) {
    const fmt = opts.fmt || ((x) => f(+x.toPrecision(3)));
    const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
    if (opts.target) all.push(opts.target.y);
    if (!all.length) return '';
    let lo = opts.min ?? Math.min(...all), hi = opts.max ?? Math.max(...all);
    if (hi === lo) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * 0.06;
    if (opts.min === undefined) lo -= pad;
    if (opts.max === undefined) hi += pad;
    const n = Math.max(...series.map((s) => s.values.length));
    const X = (i) => (n > 1 ? (i / (n - 1)) * W : W / 2), Y = (v) => H - ((v - lo) / (hi - lo)) * H;

    const path = (values) => {
      let d = '', pen = false;
      values.forEach((v, i) => {
        if (!Number.isFinite(v)) { pen = false; return; }
        d += `${pen ? 'L' : 'M'}${X(i).toFixed(2)} ${Y(v).toFixed(2)}`;
        pen = true;
      });
      // A lone point would be invisible as a path; draw it as a short tick.
      if (values.filter((v) => Number.isFinite(v)).length === 1) {
        const i = values.findIndex((v) => Number.isFinite(v));
        d = `M${Math.max(0, X(i) - 1).toFixed(2)} ${Y(values[i]).toFixed(2)}L${Math.min(W, X(i) + 1).toFixed(2)} ${Y(values[i]).toFixed(2)}`;
      }
      return d;
    };
    const zero = lo < 0 && hi > 0 ? `<path class="ch-zero" d="M0 ${Y(0).toFixed(2)}H${W}"/>` : '';
    const target = opts.target ? `<path class="ch-target" d="M0 ${Y(opts.target.y).toFixed(2)}H${W}"/>` : '';
    const lines = series.map((s, k) => `<path class="ch-s${k}${s.dashed ? ' dashed' : ''}" d="${path(s.values)}"/>`).join('');
    const legend = [...series.map((s, k) => `<span><i class="ch-key ch-s${k}${s.dashed ? ' dashed' : ''}"></i>${esc(s.name)}</span>`), opts.target ? `<span><i class="ch-key ch-target"></i>${esc(opts.target.name)}</span>` : '']
      .filter(Boolean).join('');
    return `
      <figure class="chart">
        <div class="chart-plot">
          <div class="chart-y" aria-hidden="true"><span>${fmt(hi)}</span><span>${fmt(lo)}</span></div>
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opts.label || 'Chart')}">${zero}${target}${lines}</svg>
          <div></div>
          <div class="chart-x" aria-hidden="true"><span>${esc(opts.xFirst ?? '1')}</span><span>${esc(opts.xLast ?? String(n))}</span></div>
        </div>
        ${series.length > 1 || opts.target ? `<figcaption class="legend">${legend}</figcaption>` : ''}
      </figure>`;
  }

  QT.chart = { line };
})();
