// Daily challenge: the same five questions for everyone on a given date, one attempt, timed,
// with a shareable result. Questions come from the normal generators run on a random stream
// seeded by the date, so no server is needed and every copy of the app agrees.
(function () {
  const store = QT.store;
  const N = 5, EPOCH = Date.UTC(2026, 0, 1), KEEP = 400;

  // mulberry32: a small, well-mixed 32-bit PRNG.
  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // FNV-1a hash of a string to a 32-bit seed.
  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  // The generators draw from Math.random, so swap in the seeded stream while they run.
  function withSeed(seed, fn) {
    const orig = Math.random;
    Math.random = mulberry32(seed);
    try {
      return fn();
    } finally {
      Math.random = orig;
    }
  }

  // Four interview topics and one foundations topic, then one skill from each.
  function questions(day) {
    return withSeed(hash(`qt-daily:${day}`), () => {
      const R = QT.rand, interview = QT.topics.filter((t) => t.track === 'interview'), found = QT.topics.filter((t) => t.track !== 'interview');
      return [...R.shuffle(interview).slice(0, N - 1), R.pick(found)].map((t) => {
        const gi = R.int(0, t.gens.length - 1);
        return { t, gi, p: t.gens[gi]() };
      });
    });
  }

  const dayNo = (day) => {
    const [y, m, d] = day.split('-').map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5) + 1;
  };
  const clock = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const squares = (r) => r.map((x) => (x ? '🟩' : '🟥')).join('');
  const shareText = (day, rec) => `Quant Trainer daily #${dayNo(day)}\n${squares(rec.r)} ${rec.r.filter(Boolean).length}/${N} · ${clock(rec.ms)}\n${location.origin}${location.pathname}#/daily`;

  // Consecutive completed days, counting back from today (or yesterday if today isn't done yet).
  function streak() {
    const d = store.get().daily, day = new Date();
    if (!d[QT.dayKey(day)]?.done) day.setDate(day.getDate() - 1);
    let n = 0;
    while (d[QT.dayKey(day)]?.done) {
      n++;
      day.setDate(day.getDate() - 1);
    }
    return n;
  }

  function render(el) {
    const day = QT.dayKey(new Date()), rec = store.get().daily[day];
    if (rec?.done) return result(el, day, rec);
    const qs = questions(day);
    el.innerHTML = `
      <h1>Daily challenge</h1>
      <p class="lede">The same ${N} questions for everyone today. One attempt, timed from when you start. Share your result when you're done.</p>
      <div class="card">
        <div class="eyebrow">#${dayNo(day)} · ${day}</div>
        <p>Today's topics: ${qs.map((q) => `<b>${q.t.name}</b>`).join(', ')}.</p>
        <p class="small">${streak() ? `Daily streak: ${streak()} day${streak() > 1 ? 's' : ''}.` : 'Come back each day to build a streak.'}</p>
        <button id="go" class="btn-lg">${rec ? `Resume (question ${rec.r.length + 1} of ${N})` : 'Start'}</button>
      </div>`;
    el.querySelector('#go').addEventListener('click', () => play(el, day, qs));
  }

  function play(el, day, qs) {
    const all = store.get().daily;
    const rec = (all[day] ||= { r: [], ms: 0, start: Date.now(), done: false });
    const keys = Object.keys(all).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP))) delete all[k];
    store.save(); // starting counts as your attempt, even if you leave
    let k = rec.r.length;
    el.innerHTML = `
      <h1>Daily challenge #${dayNo(day)}</h1>
      <div class="session"><span>${N} questions · one attempt</span><span class="mono" id="dc-clock"></span></div>
      <div id="dc-box"></div>`;
    const $clock = el.querySelector('#dc-clock');
    const t = setInterval(() => { $clock.textContent = clock(Date.now() - rec.start); }, 500);
    $clock.textContent = clock(Date.now() - rec.start);
    QT.cleanup = () => clearInterval(t);
    const source = () => {
      if (k >= N) return null;
      const q = qs[k++], id = QT.coach.idOf(q.t.id, q.gi);
      return {
        tag: `Q${k}/${N} · ${q.t.name}`, p: q.p, skill: id,
        record: (ok) => {
          rec.r.push(ok ? 1 : 0);
          if (rec.r.length >= N) {
            rec.done = true;
            rec.ms = Date.now() - rec.start;
            clearInterval(t);
          }
          store.recordAttempt(q.t.id, ok); // also saves
        },
      };
    };
    QT.ui.questionCard(el.querySelector('#dc-box'), source, () => {
      clearInterval(t);
      QT.cleanup = null;
      result(el, day, rec);
    });
  }

  function result(el, day, rec) {
    const right = rec.r.filter(Boolean).length, text = shareText(day, rec);
    const recent = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const r = store.get().daily[QT.dayKey(d)];
      recent.push(r?.done ? r.r.filter(Boolean).length : null);
    }
    const now = new Date(), midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const hrs = Math.floor((midnight - now) / 36e5), mins = Math.floor(((midnight - now) % 36e5) / 6e4);
    el.innerHTML = `
      <h1>Daily challenge #${dayNo(day)}</h1>
      <div class="card">
        <p class="daily-squares" aria-label="${right} of ${N} correct">${squares(rec.r)}</p>
        <div class="tiles">
          <div class="tile"><div class="v">${right}/${N}</div><div class="k">correct</div></div>
          <div class="tile"><div class="v">${clock(rec.ms)}</div><div class="k">time</div></div>
          <div class="tile"><div class="v">${streak()}</div><div class="k">day streak</div></div>
        </div>
        <pre class="share-text" id="dc-text">${QT.escapeHtml(text)}</pre>
        <div class="row"><button id="dc-share">Share result</button><span class="small" id="dc-msg" aria-live="polite"></span></div>
        <p class="small">Next challenge in ${hrs} h ${mins} min.</p>
      </div>
      ${recent.filter((x) => x !== null).length > 1 ? `<h2>Last 14 days</h2><div class="card">${QT.chart.line([{ name: 'Correct', values: recent }], { label: 'Daily challenge scores over the last 14 days', min: 0, max: N, xFirst: '13 days ago', xLast: 'today' })}</div>` : ''}
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/">Home</a><a class="btn ghost" href="#/progress">Your progress</a></div>`;
    el.querySelector('#dc-share').addEventListener('click', async () => {
      const msg = el.querySelector('#dc-msg');
      try {
        if (navigator.share) {
          await navigator.share({ text });
          return;
        }
        await navigator.clipboard.writeText(text);
        msg.textContent = 'Copied to the clipboard.';
      } catch (e) {
        if (e && e.name === 'AbortError') return; // closed the share sheet
        msg.textContent = 'Select the text above to copy it.';
      }
    });
  }

  QT.daily = { render, questions, withSeed, mulberry32, hash, dayNo, streak };
})();
