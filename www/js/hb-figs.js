// Diagrams for the handbook. Each one is inline SVG drawn from a small spec, so it follows the
// light and dark themes, stays sharp on any screen, and (for plots) is computed from the real
// maths rather than drawn by hand. Every figure needs `alt`, a plain description for screen readers.
//
//   { fig: 'plot', alt, cap, ...spec }   // see the functions below for each kind's spec
(function () {
  const esc = (s) => QT.escapeHtml(String(s ?? ''));
  const r2 = (x) => +(+x).toFixed(2);
  let uid = 0;

  const wrap = (spec, w, h, body) => `
    <figure class="hb-fig${spec.wide ? ' wide' : ''}">
      <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(spec.alt)}">${body}</svg>
      ${spec.cap ? `<figcaption>${spec.cap}</figcaption>` : ''}
    </figure>`;
  const text = (x, y, t, cls = 'hf-t', anchor = 'middle') => `<text x="${r2(x)}" y="${r2(y)}" class="${cls}" text-anchor="${anchor}">${t}</text>`;
  const line = (x1, y1, x2, y2, cls = 'hf-line') => `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" class="${cls}"></line>`;

  // An arrowhead at (x, y), pointing along the direction (dx, dy).
  function head(x, y, dx, dy, cls = 'hf-head') {
    const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, s = 8, w = 4.2;
    const a = [x - ux * s - uy * w, y - uy * s + ux * w], b = [x - ux * s + uy * w, y - uy * s - ux * w];
    return `<polygon points="${r2(x)},${r2(y)} ${r2(a[0])},${r2(a[1])} ${r2(b[0])},${r2(b[1])}" class="${cls}"></polygon>`;
  }

  const KINDS = {
    // 36 outcomes of two dice; mark(a, b) returns a tone ('acc', 'ok', 'bad') or nothing.
    dice(spec) {
      const c = 36, x0 = 44, y0 = 44, cells = [];
      for (let a = 1; a <= 6; a++) {
        cells.push(text(x0 + (a - 0.5) * c, y0 - 8, a, 'hf-m'));
        cells.push(text(x0 - 12, y0 + (a - 0.5) * c + 5, a, 'hf-m'));
        for (let b = 1; b <= 6; b++) {
          const tone = spec.mark?.(a, b), x = x0 + (a - 1) * c, y = y0 + (b - 1) * c;
          cells.push(`<rect x="${x + 1}" y="${y + 1}" width="${c - 2}" height="${c - 2}" rx="4" class="${tone ? `hf-${tone}` : 'hf-cell'}"></rect>`);
          if (spec.show) cells.push(text(x + c / 2, y + c / 2 + 5, spec.show(a, b), tone ? 'hf-on' : 'hf-m'));
        }
      }
      return wrap(spec, x0 + 6 * c + 10, y0 + 6 * c + 28, `${cells.join('')}${text(x0 + 3 * c, 14, esc(spec.xl || 'First die'), 'hf-m')}${text(x0 + 3 * c, y0 + 6 * c + 20, esc(spec.yl || 'Second die (down the side)'), 'hf-m')}`);
    },

    // A probability tree, left to right: root { t, kids: [{ p, t, tone, kids }] }.
    tree(spec) {
      const colW = spec.colW || 118, rowH = spec.rowH || 42, leafW = spec.leafW || 120;
      const depth = (n) => 1 + Math.max(0, ...(n.kids || []).map(depth));
      const leaves = (n) => (n.kids?.length ? n.kids.reduce((a, k) => a + leaves(k), 0) : 1);
      const d = depth(spec.root), H = leaves(spec.root) * rowH + 8, W = (d - 1) * colW + leafW + 28, out = [];
      function draw(n, lvl, top) {
        const x = 12 + lvl * colW, h = leaves(n) * rowH, y = top + h / 2;
        let t = top;
        for (const k of n.kids || []) {
          const kh = leaves(k) * rowH, ky = t + kh / 2, kx = x + colW;
          out.push(line(x, y, kx, ky));
          if (k.p !== undefined) {
            const mx = x + colW * 0.5, my = (y + ky) / 2;
            out.push(`<rect x="${r2(mx - String(k.p).length * 3.9 - 3)}" y="${r2(my - 10)}" width="${r2(String(k.p).length * 7.8 + 6)}" height="17" rx="3" class="hf-label"></rect>`, text(mx, my + 3, esc(k.p), 'hf-s'));
          }
          draw(k, lvl + 1, t);
          t += kh;
        }
        out.push(`<circle cx="${x}" cy="${r2(y)}" r="4.5" class="${n.tone ? `hf-${n.tone}` : 'hf-dot'}"></circle>`);
        if (n.t !== undefined) out.push(n.kids?.length ? text(x + 2, y - 9, esc(n.t), 'hf-s', lvl ? 'middle' : 'start') : text(x + 9, y + 5, esc(n.t), n.tone ? `hf-t-${n.tone}` : 'hf-t', 'start'));
      }
      draw(spec.root, 0, 4);
      return wrap(spec, W, H, out.join(''));
    },

    // Two overlapping events. shade: 'a', 'b', 'both', 'union' or 'aonly'; labels optional.
    venn(spec) {
      const id = `hfv${++uid}`, ax = 130, bx = 210, cy = 88, r = 66, W = 340, H = 180, s = spec.shade;
      const a = `<circle cx="${ax}" cy="${cy}" r="${r}"`, b = `<circle cx="${bx}" cy="${cy}" r="${r}"`;
      const clips = `<defs><clipPath id="${id}a">${a}></circle></clipPath><clipPath id="${id}b">${b}></circle></clipPath></defs>`;
      let fill = '';
      if (s === 'a' || s === 'union' || s === 'aonly') fill += `${a} class="hf-acc-soft"></circle>`;
      if (s === 'b' || s === 'union') fill += `${b} class="hf-acc-soft"></circle>`;
      if (s === 'both' || s === 'union') fill += `${b} class="hf-acc" clip-path="url(#${id}a)"></circle>`;
      if (s === 'aonly') fill += `${b} class="hf-panel" clip-path="url(#${id}a)"></circle>`;
      const box = `<rect x="8" y="6" width="${W - 16}" height="${H - 12}" rx="8" class="hf-box"></rect>`;
      return wrap(spec, W, H, `${clips}${box}${fill}${a} class="hf-outline"></circle>${b} class="hf-outline"></circle>
        ${text(ax - 34, cy + 5, esc(spec.a || 'A'))}${text(bx + 34, cy + 5, esc(spec.b || 'B'))}${spec.both ? text((ax + bx) / 2, cy + 5, esc(spec.both), s === 'both' || s === 'union' ? 'hf-on' : 'hf-t') : ''}${spec.out ? text(W - 18, H - 18, esc(spec.out), 'hf-m', 'end') : ''}`);
    },

    // Axes with any of: fns (curves), area (shaded under a curve or between two), polys, series
    // (lines through points, optionally stepped), pts, segs, vlines, hlines and labels.
    plot(spec) {
      const W = spec.w || 400, H = spec.h || 240, m = { l: spec.yl ? 50 : 40, r: 14, t: 12, b: spec.xl ? 40 : 26 };
      const [x0, x1] = spec.x, [y0, y1] = spec.y, iw = W - m.l - m.r, ih = H - m.t - m.b;
      const X = (x) => m.l + ((x - x0) / (x1 - x0)) * iw, Y = (y) => m.t + ih - ((y - y0) / (y1 - y0)) * ih;
      const clamp = (y) => Math.max(y0, Math.min(y1, y));
      const o = [];
      const grid = (vals, fn) => (vals || []).forEach(fn);
      grid(spec.yt, (t) => { const [v, l] = Array.isArray(t) ? t : [t, t]; o.push(line(m.l, Y(v), W - m.r, Y(v), 'hf-grid'), text(m.l - 6, Y(v) + 4, esc(l), 'hf-s', 'end')); });
      grid(spec.xt, (t) => { const [v, l] = Array.isArray(t) ? t : [t, t]; o.push(line(X(v), m.t, X(v), m.t + ih, 'hf-grid'), text(X(v), m.t + ih + 16, esc(l), 'hf-s')); });
      for (const p of spec.polys || []) o.push(`<polygon points="${p.pts.map(([x, y]) => `${r2(X(x))},${r2(Y(y))}`).join(' ')}" class="hf-${p.tone || 'acc-soft'}"></polygon>`);
      for (const a of spec.area || []) {
        const N = 80, up = [], down = [];
        for (let i = 0; i <= N; i++) {
          const x = a.from + ((a.to - a.from) * i) / N;
          up.push(`${r2(X(x))},${r2(Y(clamp(a.f(x))))}`);
          down.push(`${r2(X(x))},${r2(Y(a.g ? clamp(a.g(x)) : Math.max(y0, 0)))}`);
        }
        o.push(`<polygon points="${[...up, ...down.reverse()].join(' ')}" class="hf-${a.tone || 'acc-soft'}"></polygon>`);
      }
      const axisY = y0 <= 0 && y1 >= 0 ? 0 : y0, axisX = x0 <= 0 && x1 >= 0 ? 0 : x0;
      o.push(line(m.l, Y(axisY), W - m.r, Y(axisY), 'hf-axis'), line(X(axisX), m.t, X(axisX), m.t + ih, 'hf-axis'));
      for (const s of spec.series || []) {
        const pts = s.step ? s.pts.flatMap((p, i) => (i ? [[p[0], s.pts[i - 1][1]], p] : [p])) : s.pts;
        o.push(`<polyline points="${pts.map(([x, y]) => `${r2(X(x))},${r2(Y(y))}`).join(' ')}" class="hf-curve ${s.tone || 'acc'}${s.dash ? ' dash' : ''}"></polyline>`);
      }
      for (const c of spec.fns || []) {
        const N = 160, from = c.from ?? x0, to = c.to ?? x1, pts = [];
        for (let i = 0; i <= N; i++) {
          const x = from + ((to - from) * i) / N, y = c.f(x);
          if (Number.isFinite(y) && y >= y0 && y <= y1) pts.push(`${r2(X(x))},${r2(Y(y))}`);
        }
        o.push(`<polyline points="${pts.join(' ')}" class="hf-curve ${c.tone || 'acc'}${c.dash ? ' dash' : ''}"></polyline>`);
      }
      for (const v of spec.vlines || []) { o.push(line(X(v.x), m.t, X(v.x), m.t + ih, `hf-rule ${v.tone || ''}`)); if (v.t) o.push(text(X(v.x) + (v.side === 'l' ? -5 : 5), m.t + 12 + (v.dy || 0), esc(v.t), 'hf-s', v.side === 'l' ? 'end' : 'start')); }
      for (const h of spec.hlines || []) { o.push(line(m.l, Y(h.y), W - m.r, Y(h.y), `hf-rule ${h.tone || ''}`)); if (h.t) o.push(text(W - m.r - 4, Y(h.y) - 5, esc(h.t), 'hf-s', 'end')); }
      for (const s of spec.segs || []) o.push(line(X(s[0]), Y(s[1]), X(s[2]), Y(s[3]), `hf-seg ${s[4] || ''}`));
      for (const p of spec.pts || []) o.push(`<circle cx="${r2(X(p.x ?? p[0]))}" cy="${r2(Y(p.y ?? p[1]))}" r="${p.r || 3.2}" class="hf-${p.tone || 'acc'}"></circle>`);
      for (const l of spec.labels || []) o.push(text(X(l.x), Y(l.y), esc(l.t), `hf-s${l.tone ? ` tone-${l.tone}` : ''}`, l.a || 'start'));
      if (spec.xl) o.push(text(m.l + iw / 2, H - 6, esc(spec.xl), 'hf-m'));
      if (spec.yl) o.push(`<text transform="translate(12 ${r2(m.t + ih / 2)}) rotate(-90)" class="hf-m" text-anchor="middle">${esc(spec.yl)}</text>`);
      return wrap(spec, W, H, o.join(''));
    },

    // Bars for a discrete distribution. tone(i) picks a highlight; labels under each bar.
    bars(spec) {
      const W = spec.w || 400, H = spec.h || 210, n = spec.vals.length, m = { l: 12, r: 12, t: 22, b: spec.xl ? 42 : 26 };
      const max = spec.max || Math.max(...spec.vals), iw = W - m.l - m.r, ih = H - m.t - m.b, bw = iw / n, o = [];
      spec.vals.forEach((v, i) => {
        const h = (v / max) * ih, x = m.l + i * bw, y = m.t + ih - h, tone = spec.tone?.(i);
        o.push(`<rect x="${r2(x + bw * 0.1)}" y="${r2(y)}" width="${r2(bw * 0.8)}" height="${r2(h)}" rx="2" class="${tone ? `hf-${tone}` : 'hf-acc-mid'}"></rect>`);
        if (spec.labs?.[i] !== undefined && spec.labs[i] !== '') o.push(text(x + bw / 2, m.t + ih + 15, esc(spec.labs[i]), 'hf-s'));
        if (spec.show?.[i] !== undefined) o.push(text(x + bw / 2, y - 5, esc(spec.show[i]), 'hf-s'));
      });
      o.push(line(m.l, m.t + ih, W - m.r, m.t + ih, 'hf-axis'));
      if (spec.xl) o.push(text(W / 2, H - 6, esc(spec.xl), 'hf-m'));
      return wrap(spec, W, H, o.join(''));
    },

    // States and arrows. nodes: { key: [x, y, label, tone] }; edges: [from, to, label, bend];
    // loops: [node, label, 'top' | 'bottom'].
    states(spec) {
      const W = spec.w || 400, H = spec.h || 180, r = spec.r || 24, o = [];
      for (const [a, b, label, bend = 0] of spec.edges || []) {
        const [x1, y1] = spec.nodes[a], [x2, y2] = spec.nodes[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
        const cx = (x1 + x2) / 2 + nx * bend, cy = (y1 + y2) / 2 + ny * bend;
        const edge = (px, py) => { const d = Math.hypot(cx - px, cy - py); return [px + ((cx - px) / d) * (r + 1), py + ((cy - py) / d) * (r + 1)]; };
        const [sx, sy] = edge(x1, y1), [ex, ey] = edge(x2, y2);
        o.push(`<path d="M${r2(sx)} ${r2(sy)}Q${r2(cx)} ${r2(cy)} ${r2(ex)} ${r2(ey)}" class="hf-line"></path>`, head(ex, ey, ex - cx, ey - cy));
        if (label !== undefined) {
          const lx = (sx + 2 * cx + ex) / 4, ly = (sy + 2 * cy + ey) / 4, off = bend >= 0 ? 11 : -11;
          o.push(text(lx + nx * off, ly + ny * off + 4, esc(label), 'hf-s'));
        }
      }
      for (const [k, label, side = 'top'] of spec.loops || []) {
        const [x, y] = spec.nodes[k], s = side === 'top' ? -1 : 1, y1 = y + s * r * 0.75, y2 = y + s * (r + 30);
        o.push(`<path d="M${x - 12} ${r2(y1)}C${x - 30} ${r2(y2)} ${x + 30} ${r2(y2)} ${x + 12} ${r2(y1)}" class="hf-line"></path>`, head(x + 12, y1, -9, -s * 15), text(x, y2 + (side === 'top' ? 2 : 10), esc(label), 'hf-s'));
      }
      for (const [x, y, label, tone] of Object.values(spec.nodes)) {
        o.push(`<circle cx="${x}" cy="${y}" r="${r}" class="${tone ? `hf-${tone}` : 'hf-node'}"></circle>`, text(x, y + 5, esc(label), tone && !/soft/.test(tone) ? 'hf-on' : 'hf-t'));
      }
      return wrap(spec, W, H, o.join(''));
    },

    // Rows of labelled boxes: flips, stars and bars, deck positions. A cell is a string or
    // { t, tone, gap: true } (a gap draws no box). rows: [{ label, cells }].
    strip(spec) {
      const c = spec.cell || 30, gap = 3, lw = spec.labelW ?? (spec.rows.some((r) => r.label) ? 100 : 0);
      const w = Math.max(...spec.rows.map((r) => r.cells.length)) * (c + gap) + lw + 8, rowH = c + (spec.rowGap ?? 12), H = spec.rows.length * rowH + 4, o = [];
      spec.rows.forEach((row, i) => {
        const y = 4 + i * rowH;
        if (row.label) o.push(text(4, y + c / 2 + 5, esc(row.label), 'hf-s', 'start'));
        row.cells.forEach((cell, j) => {
          const v = typeof cell === 'object' && cell ? cell : { t: cell }, x = lw + 4 + j * (c + gap);
          if (!v.gap) o.push(`<rect x="${x}" y="${y}" width="${c}" height="${c}" rx="4" class="${v.tone ? `hf-${v.tone}` : 'hf-cell'}"></rect>`);
          if (v.t !== undefined && v.t !== '') o.push(text(x + c / 2, y + c / 2 + 5, esc(v.t), v.tone && !/soft/.test(v.tone) ? 'hf-on' : 'hf-t'));
        });
      });
      return wrap(spec, w, H, o.join(''));
    },

    // An order book: asks above, bids below, with bars for size.
    book(spec) {
      const rowH = 26, W = 380, rows = [...spec.asks.map(([p, s]) => ['ask', p, s]), ...spec.bids.map(([p, s]) => ['bid', p, s])];
      const max = Math.max(...rows.map((r) => r[2])), H = rows.length * rowH + 30, cx = W / 2, unit = 130 / max, o = [];
      o.push(text(cx - 44, 14, 'bids (buyers)', 'hf-s', 'end'), text(cx, 14, 'price', 'hf-s'), text(cx + 44, 14, 'asks (sellers)', 'hf-s', 'start'));
      rows.forEach(([side, p, s], i) => {
        const y = 22 + i * rowH, w = s * unit, x = side === 'ask' ? cx + 34 : cx - 34 - w;
        o.push(`<rect x="${r2(x)}" y="${y + 3}" width="${r2(w)}" height="${rowH - 6}" rx="2" class="${side === 'ask' ? 'hf-bad-soft' : 'hf-ok-soft'}"></rect>`,
          text(cx, y + rowH / 2 + 5, esc(p), 'hf-t'), text(side === 'ask' ? x + w + 6 : x - 6, y + rowH / 2 + 4, esc(s), 'hf-s', side === 'ask' ? 'start' : 'end'));
      });
      o.push(line(cx - 150, 22 + spec.asks.length * rowH, cx + 150, 22 + spec.asks.length * rowH, 'hf-rule'));
      return wrap(spec, W, H, o.join(''));
    },

    // A picture of counts: n dots, coloured by group. groups: [{ n, tone, t }].
    dots(spec) {
      const total = spec.groups.reduce((a, g) => a + g.n, 0), cols = spec.cols || Math.ceil(Math.sqrt(total * 2.4)), s = spec.size || (total > 400 ? 7.2 : 13);
      const rows = Math.ceil(total / cols), W = cols * s + 8, keyH = spec.groups.length * 20 + 6, H = rows * s + keyH + 6, o = [];
      let i = 0;
      for (const g of spec.groups) for (let k = 0; k < g.n; k++, i++) o.push(`<circle cx="${r2(4 + ((i % cols) + 0.5) * s)}" cy="${r2(4 + (Math.floor(i / cols) + 0.5) * s)}" r="${r2(s * 0.38)}" class="hf-${g.tone || 'dim'}"></circle>`);
      spec.groups.forEach((g, k) => {
        const y = rows * s + 16 + k * 20;
        o.push(`<circle cx="10" cy="${y - 4}" r="5" class="hf-${g.tone || 'dim'}"></circle>`, text(22, y + 1, esc(g.t), 'hf-s', 'start'));
      });
      return wrap({ ...spec, narrow: true }, Math.max(W, 300), H, o.join(''));
    },

    // A chain of steps, one after another. HTML rather than SVG, so the text wraps on a phone.
    flow(spec) {
      return `<figure class="hb-fig hb-flow-fig"><ol class="hb-flow" aria-label="${esc(spec.alt)}">${spec.steps.map((s) => `<li>${s}</li>`).join('')}</ol>${spec.cap ? `<figcaption>${spec.cap}</figcaption>` : ''}</figure>`;
    },
  };

  QT.hbFig = (spec) => (KINDS[spec.fig] ? KINDS[spec.fig](spec) : '');
  QT.hbFig.kinds = Object.keys(KINDS);
  // Correlated normal points for scatter plots, the same on every load (a small seeded generator).
  QT.hbFig.scatter = (n, rho, seed = 1, opts = {}) => {
    let s = seed;
    const u = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 5; i++) u();
    const gauss = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
    return Array.from({ length: n }, () => {
      const x = gauss(), y = rho * x + Math.sqrt(1 - rho * rho) * gauss();
      return { x: +x.toFixed(3), y: +y.toFixed(3), r: opts.r || 2.6, tone: opts.tone || 'acc' };
    }).filter((p) => Math.abs(p.x) < 2.95 && Math.abs(p.y) < 2.95);
  };
  // Shared curves, so figures in different chapters agree.
  QT.hbFig.normal = (mu = 0, sd = 1) => (x) => Math.exp(-(((x - mu) / sd) ** 2) / 2) / (sd * Math.sqrt(2 * Math.PI));
})();
