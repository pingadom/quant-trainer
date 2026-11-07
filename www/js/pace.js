// End-of-run pacing for the timed games (Zetamac, 80 in 8, 60 in 6, the rhythm drill). A column
// for each slice of the run shows how many questions you answered in it, against a reference pace,
// so a dip shows where momentum went. Below it: first half against second half, the fastest and
// slowest stretches, the point you fell behind a fixed pace, and the single questions that stalled
// you. Hover, focus or tap a column for what happened in that slice.
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

  const readout = (s, badName) => {
    const parts = [`${clock(s.t0)}–${clock(s.t1)}: ${s.n} answered`];
    if (s.bad) parts[0] += ` (${s.ok} right, ${s.bad} ${badName.toLowerCase()})`;
    if (!s.full) parts[0] += ` in the last ${Math.round(s.t1 - s.t0)} s`;
    if (s.long && s.longIn >= 1500) parts.push(`Longest on ${qText(s.long)}, ${sec(s.long.ms)}${s.long.open ? ' and unanswered' : ''}`);
    return parts.join('. ') + '.';
  };

  function card(items, opts = {}) {
    if (!items.length && !(opts.open && opts.open.ms)) return '';
    const A = analyse(items, opts), { slices, b, dur } = A, badName = opts.bad || 'Wrong';
    const anyBad = slices.some((s) => s.bad);
    // Reference: the target pace for fixed-length tests, otherwise your own average.
    const ref = opts.pace
      ? { y: (opts.pace.n * b) / opts.secs, name: opts.pace.name }
      : { y: (A.xs.length / dur) * b, name: 'Your average' };
    const top = Math.max(1, ref.y, ...slices.map((s) => s.n));
    const step = top <= 5 ? 1 : top <= 10 ? 2 : top <= 25 ? 5 : 10, yMax = Math.ceil(top / step) * step;
    const h = (n) => `${((100 * n) / yMax).toFixed(2)}%`;
    const cols = slices.map((s) => {
      const label = readout(s, badName);
      // The whole column height is the hit target, so empty slices can be inspected too.
      return `<button type="button" class="pace-col${s.full ? '' : ' part'}" data-read="${esc(label)}" aria-label="${esc(label)}"><span class="pace-bar" style="height:${h(s.n)}">${s.bad ? `<i class="pace-bad" style="flex-grow:${s.bad}"></i>` : ''}${s.ok ? `<i class="pace-ok${anyBad ? '' : ' one'}" style="flex-grow:${s.ok}"></i>` : ''}</span></button>`;
    }).join('');
    const ns = notes(A, opts);
    const per = ref.y.toFixed(ref.y < 10 ? 1 : 0).replace(/\.0$/, '');
    const legend = [anyBad && '<span><i class="pace-key pace-ok"></i>Right</span>', anyBad && `<span><i class="pace-key pace-bad"></i>${esc(badName)}</span>`, `<span><i class="ch-key ch-target pace-refkey"></i>${esc(ref.name)} (${per} per ${b} s)</span>`].filter(Boolean).join('');
    return `
      <h2>Pacing</h2>
      <div class="card pace">
        <p class="small" style="margin-top:0">Questions answered in each ${b}-second slice of the run. Dips show where you lost momentum.</p>
        <figure class="chart">
          <div class="chart-plot">
            <div class="chart-y" aria-hidden="true"><span>${yMax}</span><span>${yMax / 2 === Math.round(yMax / 2) ? yMax / 2 : ''}</span><span>0</span></div>
            <div class="pace-plot" role="group" aria-label="${esc(`${opts.label || 'Run'} pacing: ${A.xs.length} answers in ${clock(dur)}, in ${b}-second slices`)}">
              <i class="pace-mid" aria-hidden="true"></i>
              <i class="pace-ref" style="bottom:${h(ref.y)}" aria-hidden="true"></i>
              <div class="pace-cols">${cols}</div>
            </div>
            <div></div>
            <div class="chart-x" aria-hidden="true"><span>0:00</span><span>${clock(dur / 2)}</span><span>${clock(dur)}</span></div>
          </div>
          <figcaption class="chart-legend">${legend}</figcaption>
        </figure>
        <p class="small pace-read" aria-live="polite">Hover over or tap a column to see that slice.</p>
        ${ns.map((t) => `<p class="small" style="margin:6px 0 0">${t}</p>`).join('')}
      </div>`;
  }

  // One set of listeners for every pacing chart: hovering, focusing or tapping a column shows its
  // slice under the chart.
  const show = (col) => {
    const box = col.closest('.pace'), read = box && box.querySelector('.pace-read');
    if (!read) return;
    box.querySelectorAll('.pace-col.on').forEach((c) => c.classList.remove('on'));
    col.classList.add('on');
    read.textContent = col.dataset.read;
  };
  if (typeof document !== 'undefined') for (const ev of ['pointerover', 'focusin', 'click']) {
    document.addEventListener(ev, (e) => {
      const col = e.target.closest && e.target.closest('.pace-col');
      if (col) show(col);
    });
  }

  QT.pace = { card, analyse, notes, sliceFor };
})();
