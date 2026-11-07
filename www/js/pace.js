// End-of-run pacing for the timed games (Zetamac, 80 in 8, 60 in 6, the rhythm drill). A line
// with a point for every answer, placed at the moment you gave it, at the score you were on pace
// for then: your score so far scaled up to the full time (and, in 80 in 8 and 60 in 6, to at most
// the questions there are). Where the line falls is where momentum went. Below it: your peak pace,
// first half against second half, the fastest and slowest stretches, the point you fell behind a
// fixed pace, and the single questions that stalled you. Point at, tap or arrow through the line
// for each answer.
(function () {
  const esc = QT.escapeHtml, f = QT.fmtNum;
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;
  // Slice length: the shortest that keeps the chart to at most 20 columns (10 s for a 2-minute game).
  const SLICES = [5, 10, 15, 20, 30, 60];
  const sliceFor = (secs) => SLICES.find((b) => secs / b <= 20) || 60;
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const qText = (x) => `${x.q} = ${x.al != null ? x.al : f(x.a)}`;

  // items: answers in order, each { ms (time on it), ok, q, a or al, t (ms from the start when
  // answered; worked out from the ms values if missing) }.
  // opts: { secs (time limit), elapsed (ms the run lasted), open ({ q, a, ms }: the question on
  // screen when time ran out), pace ({ n, name }: n answers in `secs` is the target pace),
  // bad ('Wrong' or 'Skipped': the label for !ok items), label (the game's name) }
  function analyse(items, opts) {
    let run = 0;
    const xs = items.map((x) => { run = Number.isFinite(x.t) ? x.t : run + x.ms; return { ...x, t: run }; });
    const dur = Math.max(1, Math.min(opts.secs, (opts.elapsed ?? opts.secs * 1000) / 1000));
    const b = sliceFor(opts.secs), nb = Math.max(1, Math.ceil(dur / b - 1e-9));
    const open = opts.open && opts.open.ms > 0 ? { ...opts.open, t: dur * 1000, open: true } : null;
    const spans = open ? [...xs, open] : xs;
    const slices = Array.from({ length: nb }, (_, i) => {
      const t0 = i * b, t1 = Math.min(dur, (i + 1) * b), inside = xs.filter((x) => x.t > t0 * 1000 && x.t <= t1 * 1000);
      // The question you spent longest on during this slice, even if you answered it later.
      let long = null, best = 0;
      for (const x of spans) {
        const o = Math.min(x.t, t1 * 1000) - Math.max(x.t - x.ms, t0 * 1000);
        if (o > best) { best = o; long = x; }
      }
      return { i, t0, t1, full: t1 - t0 >= b - 0.5, ok: inside.filter((x) => x.ok).length, bad: inside.filter((x) => !x.ok).length, long, longIn: best };
    });
    for (const s of slices) s.n = s.ok + s.bad;
    return { xs, dur, b, slices, open };
  }

  // Notes on where the run sped up and slowed down.
  function notes(A, opts) {
    const { xs, dur, slices } = A, out = [];
    if (xs.length < 4) return out;
    const mid = (dur * 1000) / 2, h1 = xs.filter((x) => x.t <= mid).length, h2 = xs.length - h1;
    const ch = h1 ? Math.round((100 * (h2 - h1)) / h1) : 0;
    out.push(`<b>Halves:</b> ${h1} answered in the first ${clock(dur / 2)}, ${h2} in the second.${!h1 ? '' : ch <= -10 ? ` You slowed down by ${-ch}%.` : ch >= 10 ? ` You sped up by ${ch}%.` : ' An even pace.'}`);
    const full = slices.filter((s) => s.full), med = median(xs.map((x) => x.ms));
    if (full.length >= 4) {
      const top = full.reduce((m, s) => (s.n > m.n ? s : m)), low = full.reduce((m, s) => (s.n < m.n ? s : m));
      if (top.n > low.n) {
        const stuck = low.long && low.longIn >= (low.t1 - low.t0) * 400 && low.long.ms >= 2 * med ? ` Most of it went on <span class="mono">${esc(qText(low.long))}</span> (${sec(low.long.ms)}${low.long.open ? ', still on it when time ran out' : ''}).` : '';
        out.push(`<b>Fastest stretch:</b> ${clock(top.t0)}–${clock(top.t1)}, ${top.n} answered${top.bad ? ` (${top.ok} right, ${top.bad} ${(opts.bad || 'wrong').toLowerCase()})` : ''}. <b>Slowest:</b> ${clock(low.t0)}–${clock(low.t1)}, ${low.n}.${stuck}`);
      }
    }
    // Against a fixed pace (80 in 8 is one every 6 s): when you were last on it.
    if (opts.pace && opts.pace.fixed) {
      const per = (opts.secs * 1000) / opts.pace.n;
      let last = -1;
      xs.forEach((x, i) => { if (x.t <= (i + 1) * per) last = i; });
      const reachedAll = xs.length >= opts.pace.n;
      if (last === xs.length - 1 && reachedAll) out.push(`<b>Pace:</b> ahead of ${esc(opts.pace.name.toLowerCase())} the whole way.`);
      else if (last < 0) out.push(`<b>Pace:</b> behind ${esc(opts.pace.name.toLowerCase())} from the first question.`);
      else out.push(`<b>Pace:</b> on ${esc(opts.pace.name.toLowerCase())} until question ${last + 1} at ${clock(xs[last].t / 1000)}, then behind${last === xs.length - 1 ? ' at the end' : ''}.`);
    }
    // Single questions that took over twice your usual time and at least 2 s more.
    const all = A.open ? [...xs, A.open] : xs;
    const stalls = all.filter((x) => x.ms > 2 * med && x.ms - med >= 2000).sort((x, y) => y.ms - x.ms);
    if (stalls.length && med > 0) {
      const lost = stalls.reduce((s, x) => s + x.ms - med, 0);
      out.push(`<b>Stalls:</b> ${stalls.length} question${stalls.length > 1 ? 's' : ''} took over twice your usual ${sec(med)}, costing about ${Math.round(lost / 1000)} s, or ${Math.round(lost / med)} answers at your usual speed. Longest: ${stalls.slice(0, 3).map((x) => `<span class="mono">${esc(qText(x))}</span> at ${clock((x.t - x.ms) / 1000)} (${sec(x.ms)})`).join(', ')}.`);
    }
    return out;
  }

  // The score you were on pace for after each answer. Net scoring (+1/−1) and a question cap for
  // the fixed-length tests; a count of right answers for Zetamac and the rhythm drill.
  function track(A, opts) {
    const fixed = !!(opts.pace && opts.pace.fixed), N = fixed ? opts.pace.n : Infinity, T = opts.secs * 1000;
    let right = 0, wrong = 0;
    return A.xs.map((x, i) => {
      if (x.ok) right++;
      else wrong++;
      const score = fixed ? right - wrong : right;
      return { ...x, i, score, proj: score * Math.min(T / Math.max(x.t, 1), N / (i + 1)) };
    });
  }

  // Tidy axis: a handful of round values spanning lo..hi.
  function ticks(lo, hi) {
    if (hi - lo < 1) { hi += 1; lo -= 1; }
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((st) => (hi - lo) / st <= 4) || 1000;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (let v = a; v <= b + 1e-9; v += step) out.push(v);
    return out;
  }

  function card(items, opts = {}) {
    if (!items.length) return '';
    const A = analyse(items, opts), { dur } = A, badName = opts.bad || 'Wrong';
    const fixed = !!(opts.pace && opts.pace.fixed), pts = track(A, opts);
    // The first few seconds say little (one quick answer extrapolates to a huge score), so the
    // line starts from the third answer and 8% of the way in, unless that leaves almost nothing.
    const minT = Math.max(5000, opts.secs * 80);
    let shown = pts.filter((p) => p.i >= 2 && p.t >= minT);
    if (shown.length < 2) shown = pts;
    const final = pts[pts.length - 1].score, best = Number.isFinite(opts.best) ? opts.best : null;
    const projs = shown.map((p) => p.proj), extra = best === null ? [final] : [final, best];
    const ys = ticks(Math.min(...projs, ...extra), Math.max(...projs, ...extra));
    const lo = ys[0], hi = ys[ys.length - 1];
    const X = (t) => (100 * t) / (dur * 1000), Y = (v) => 100 - (100 * (v - lo)) / (hi - lo);
    const r1 = (v) => Math.round(v);
    const read = (p) => `${clock(p.t / 1000)}, answer ${p.i + 1}: ${qText(p)}${p.ok ? '' : ` (${badName.toLowerCase()})`}, ${sec(p.ms)}. Score ${p.score}, on pace for ${r1(p.proj)}.`;
    const line = shown.map((p, k) => `${k ? 'L' : 'M'}${X(p.t).toFixed(2)} ${Y(p.proj).toFixed(2)}`).join('');
    const dots = shown.map((p) => `<i class="pl-dot${p.ok ? '' : ' bad'}" style="left:${X(p.t).toFixed(2)}%;top:${Y(p.proj).toFixed(2)}%" data-read="${esc(read(p))}"></i>`).join('');
    const grid = ys.map((v) => `<i class="pl-grid${v === 0 && lo < 0 ? ' zero' : ''}" style="top:${Y(v).toFixed(2)}%"></i>`).join('');
    const anyBad = shown.some((p) => !p.ok);
    // Your best pace, and the last moment you held it: where the slide (if any) began.
    const top = Math.max(...shown.map((p) => Math.round(p.proj))), peak = shown.filter((p) => Math.round(p.proj) === top).pop();
    const ns = [];
    if (shown.length >= 3) {
      const fell = peak !== shown[shown.length - 1] && peak.proj - final >= Math.max(3, 0.1 * Math.abs(peak.proj));
      ns.push(`<b>On pace for:</b> ${top} at your best (last at ${clock(peak.t / 1000)}). You finished on ${final}${best !== null ? ` (previous best ${best})` : ''}.${fell ? ' Where the line falls after that is where momentum went.' : ''}`);
    }
    ns.push(...notes(A, opts));
    const legend = [
      `<span><i class="pl-key"></i>${anyBad ? 'Right' : 'Answer'}</span>`,
      anyBad && `<span><i class="pl-key bad"></i>${esc(badName)}</span>`,
      best !== null && `<span><i class="ch-key ch-target pace-refkey"></i>Your previous best (${best})</span>`,
    ].filter(Boolean).join('');
    const total = opts.secs >= 60 ? `${opts.secs / 60} minute${opts.secs === 60 ? '' : 's'}` : `${opts.secs} seconds`;
    return `
      <h2>Pacing</h2>
      <div class="card pace">
        <p class="small" style="margin-top:0">Each point is an answer, at the moment you gave it. Its height is the score you were on pace for then: your score so far, scaled up to the full ${total}${fixed ? ` (and to at most ${opts.pace.n} questions)` : ''}. Where the line falls is where you lost momentum.</p>
        <figure class="chart">
          <div class="chart-plot">
            <div class="chart-y pl-y" aria-hidden="true">${ys.map((v) => `<span style="top:${Y(v).toFixed(2)}%">${v}</span>`).join('')}</div>
            <div class="pl-plot" tabindex="0" role="group" aria-label="${esc(`${opts.label || 'Run'} pacing: on pace for ${top} at best, finished on ${final}. Use the arrow keys to step through your answers.`)}">
              ${grid}
              ${best !== null ? `<i class="pl-best" style="top:${Y(best).toFixed(2)}%"></i>` : ''}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${line}"/></svg>
              <i class="pl-cross" hidden></i>
              ${dots}
            </div>
            <div></div>
            <div class="chart-x" aria-hidden="true"><span>0:00</span><span>${clock(dur / 2)}</span><span>${clock(dur)}</span></div>
          </div>
          <figcaption class="chart-legend">${legend}</figcaption>
        </figure>
        <p class="small pace-read" aria-live="polite">Point at or tap the line to see each answer.</p>
        ${ns.map((t) => `<p class="small" style="margin:6px 0 0">${t}</p>`).join('')}
      </div>`;
  }

  // One set of listeners for every pacing chart: the answer nearest the pointer (or stepped to
  // with the arrow keys) is marked, with a guide line and its details under the chart.
  const select = (plot, dot) => {
    if (!dot) return;
    plot.querySelectorAll('.pl-dot.on').forEach((d) => d.classList.remove('on'));
    dot.classList.add('on');
    const cross = plot.querySelector('.pl-cross');
    cross.hidden = false;
    cross.style.left = dot.style.left;
    const read = plot.closest('.pace').querySelector('.pace-read');
    if (read) read.textContent = dot.dataset.read;
  };
  const nearest = (plot, clientX) => {
    let best = null, d = Infinity;
    for (const dot of plot.querySelectorAll('.pl-dot')) {
      const r = dot.getBoundingClientRect(), dd = Math.abs(r.left + r.width / 2 - clientX);
      if (dd < d) { d = dd; best = dot; }
    }
    return best;
  };
  if (typeof document !== 'undefined') {
    for (const ev of ['pointermove', 'pointerdown']) {
      document.addEventListener(ev, (e) => {
        const plot = e.target.closest && e.target.closest('.pl-plot');
        if (plot) select(plot, nearest(plot, e.clientX));
      });
    }
    document.addEventListener('keydown', (e) => {
      const plot = e.target.closest && e.target.closest('.pl-plot');
      if (!plot || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const dots = [...plot.querySelectorAll('.pl-dot')], cur = dots.findIndex((d) => d.classList.contains('on'));
      const step = e.key === 'ArrowLeft' ? -1 : 1;
      const k = e.key === 'Home' ? 0 : e.key === 'End' ? dots.length - 1 : cur < 0 ? (step < 0 ? dots.length - 1 : 0) : Math.max(0, Math.min(dots.length - 1, cur + step));
      select(plot, dots[k]);
    });
  }

  QT.pace = { card, analyse, notes, track, sliceFor };
})();
