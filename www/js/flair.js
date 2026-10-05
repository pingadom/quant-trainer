// Signature touches: the ticker tape of your own numbers, numbers that roll into place, ink
// stamps for milestones, an optional closing bell, split-flap digits and real die faces.
// Everything that moves respects the Animations setting and the system's reduced-motion
// preference (QT.theme.motion()); the bell only plays when Sounds is switched on.
(function () {
  const store = QT.store, f = QT.fmtNum, esc = QT.escapeHtml;

  // ---- ticker tape ----
  const arrow = (d) => (d > 0 ? { d: `▲${f(d)}`, up: true } : d < 0 ? { d: `▼${f(-d)}`, up: false } : { d: '', up: true });
  const last2 = (runs, val) => (runs.length >= 2 ? val(runs[runs.length - 1]) - val(runs[runs.length - 2]) : 0);

  function tickerItems() {
    const s = store.get(), items = [];
    const streak = store.streak();
    if (streak) items.push({ k: 'STREAK', v: `${streak}d` });
    if (s.log.length >= 20) {
      const acc = (xs) => Math.round((100 * xs.filter((x) => x.ok).length) / xs.length);
      const now = acc(s.log.slice(-20)), before = s.log.length >= 40 ? acc(s.log.slice(-40, -20)) : now;
      items.push({ k: 'ACCURACY', v: `${now}%`, ...arrow(now - before) });
    }
    const b80 = QT.mental.best80();
    if (b80 !== null) {
      const runs = [...(s.mental.full?.runs || []), ...(s.mental.fullTyped?.runs || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
      items.push({ k: '80-IN-8', v: String(b80), ...arrow(last2(runs, (r) => r.correct - r.wrong)) });
    }
    if (s.mental.sprint?.best != null) items.push({ k: 'SPRINT', v: String(s.mental.sprint.best), ...arrow(last2(s.mental.sprint.runs, (r) => r.correct)) });
    if (s.estimate.n >= 10) items.push({ k: 'CALIB', v: `${Math.round((100 * s.estimate.hits) / s.estimate.n)}%`, ...arrow(last2(s.estimate.history, (r) => r.hits) * 10) });
    if (s.figgie.games) {
      const lastPnl = s.figgie.history.length ? s.figgie.history[s.figgie.history.length - 1].pnl : 0;
      items.push({ k: 'FIGGIE', v: `${s.figgie.total >= 0 ? '+' : ''}${f(Math.round(s.figgie.total / s.figgie.games))}`, ...arrow(Math.round(lastPnl)) });
    }
    if (s.kelly.best !== null) items.push({ k: 'KELLY', v: `${Math.round(s.kelly.best * 100)}%` });
    if (QT.daily) {
      const day = QT.dayKey(new Date()), r = s.daily[day];
      items.push({ k: `DAILY #${QT.daily.dayNo(day)}`, v: r?.done ? `${r.r.filter(Boolean).length}/5` : 'OPEN' });
    }
    const due = QT.mistakes.due().length;
    if (due) items.push({ k: 'REVIEW', v: `${due} due` });
    const reps = QT.mental.dueReps().length;
    if (reps) items.push({ k: 'REPS', v: `${reps} due` });
    const strong = QT.coach.allIds().filter((id) => QT.coach.stat(id).status === 'strong').length;
    if (strong) items.push({ k: 'SKILLS', v: `${strong}/${QT.coach.allIds().length}` });
    return items;
  }

  function ticker() {
    const box = document.getElementById('ticker');
    if (!box) return;
    const items = QT.theme.ticker() && !store.isEmpty() ? tickerItems() : [];
    const on = items.length >= 2;
    box.hidden = !on;
    document.documentElement.classList.toggle('has-ticker', on);
    if (!on) return;
    const html = items.map((x) => `<span class="tk"><span class="tk-k">${esc(x.k)}</span> <b>${esc(x.v)}</b>${x.d ? ` <span class="${x.up ? 'tk-up' : 'tk-down'}">${x.d}</span>` : ''}</span>`).join('');
    const track = box.querySelector('.ticker-track');
    // Two copies make a seamless loop; the second is hidden from screen readers.
    track.innerHTML = `<span class="tk-set">${html}</span><span class="tk-set" aria-hidden="true">${html}</span>`;
    track.style.setProperty('--tk-dur', `${Math.max(20, items.length * 6)}s`);
  }

  // ---- rolling numbers ----
  // Plain numbers in tiles count up from zero when they first appear (e.g. "84%", "+25", "52").
  const NUM = /^([+−-]?)(\d+(?:\.\d+)?)(%?)$/;
  function roll(el) {
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (!node) return;
    const m = node.nodeValue.trim().match(NUM);
    if (!m) return;
    const [, sign, digits, pct] = m, target = Number(digits), dp = (digits.split('.')[1] || '').length, t0 = performance.now(), dur = 650;
    const step = (t) => {
      if (!node.isConnected) return;
      const k = Math.min(1, (t - t0) / dur), eased = 1 - (1 - k) ** 3;
      node.nodeValue = `${sign}${(target * eased).toFixed(dp)}${pct}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const main = document.getElementById('main');
  if (main && typeof MutationObserver !== 'undefined') {
    new MutationObserver((records) => {
      if (!QT.theme.motion()) return;
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n.nodeType !== 1) continue;
          const vs = n.matches?.('.tile .v') ? [n] : n.querySelectorAll ? n.querySelectorAll('.tile .v') : [];
          vs.forEach(roll);
        }
      }
    }).observe(main, { childList: true, subtree: true });
  }

  // ---- stamps and the bell ----
  const stamp = (text, kind = 'ok') => `<span class="stamp stamp-${kind}">${esc(text)}</span>`;

  let audio = null;
  function bell() {
    if (!QT.theme.sound()) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audio.currentTime;
      // A struck bell: a few inharmonic partials with exponential decay.
      [[880, 0.22], [1760 * 1.19, 0.08], [2640 * 0.98, 0.05], [440, 0.1]].forEach(([hz, gain]) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = hz;
        g.gain.setValueAtTime(gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        o.connect(g).connect(audio.destination);
        o.start(now);
        o.stop(now + 1.7);
      });
    } catch { /* no audio available */ }
  }
  // A milestone: a stamp to show, plus the bell.
  const milestone = (text, kind) => {
    bell();
    return stamp(text, kind);
  };

  // ---- split-flap digits and die faces ----
  const flap = (text) => `<span class="flap" role="img" aria-label="${esc(text)}">${[...String(text)].map((ch) => `<span aria-hidden="true">${esc(ch)}</span>`).join('')}</span>`;
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const dieFace = (n) => `<span class="pips" role="img" aria-label="${n}">${Array.from({ length: 9 }, (_, i) => `<i${PIPS[n]?.includes(i) ? ' class="on"' : ''}></i>`).join('')}</span>`;

  document.addEventListener('qt:theme', ticker);
  QT.flair = { ticker, tickerItems, roll, stamp, milestone, bell, flap, dieFace };
})();
