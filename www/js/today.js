// Daily activity: how long you practised today, in which parts of the app, against a daily goal
// you set. #/today shows today; #/today/YYYY-MM-DD any earlier day (the Progress heatmap links
// here).
//
// Time is measured, not estimated: every 15 seconds, if the tab is visible and you've touched the
// page (key, click, tap or scroll) in the last 2 minutes, those 15 seconds go to the area of the
// app on screen. Home, Progress, Search and settings don't count. Time is added up in memory and
// written to state.activity about once a minute, and whenever the tab is hidden, so two open tabs
// each add only their own time. Each saved result (an answer, a finished drill) also counts as
// one "thing done" in its area.
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const TICK = 15, IDLE = 120e3, FLUSH_EVERY = 4, DAYS_KEPT = 400, BAR = 96;

  // Route → area. Routes that aren't practice (home, progress, settings, search…) map to nothing.
  const AREAS = {
    topic: 'Topic practice', weak: 'Weak spots', coach: 'Coach drills', mistakes: 'Mistakes to review',
    mental: 'Mental maths', tricks: 'Speed tricks', bank: 'Interview questions', mock: 'Mock interviews',
    talk: 'Think aloud', stories: 'Stories', handbook: 'Handbook', devbook: 'Quant dev handbook',
    flashcards: 'Formula cards', cases: 'Case studies', lab: 'Stats lab', code: 'Coding', sse: 'Citadel SSE prep',
    oa: 'Online tests', daily: 'Daily challenge', figgie: 'Figgie', quote: 'Make me a market',
    market: 'Market making', kelly: 'Bet sizing', estimate: 'Estimation',
  };
  const ALIAS = { practice: 'topic', iq: 'bank', drill: 'coach', review: 'mistakes', case: 'cases', screen: 'mock' };
  const GOALS = [0, 10, 15, 20, 30, 45, 60, 90, 120];

  function areaOf(hash) {
    const key = String(hash || '').replace(/^#\/?/, '').split('/')[0];
    const a = ALIAS[key] || key;
    return Object.prototype.hasOwnProperty.call(AREAS, a) ? a : null;
  }
  const area = () => (typeof location !== 'undefined' ? areaOf(location.hash) : null);
  const dayOf = (d = new Date()) => QT.dayKey(d);
  const rec = (day) => (store.get().activity[day] ||= { s: {}, n: {} });
  function prune() {
    const a = store.get().activity, keys = Object.keys(a).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - DAYS_KEPT))) delete a[k];
  }

  // ---- counting results (called from store.touchDay) ----
  const lastCount = {};
  function count() {
    const a = area();
    if (!a) return;
    const now = Date.now();
    if (now - (lastCount[a] || 0) < 1500) return; // one action that touches the day twice
    lastCount[a] = now;
    const r = rec(dayOf());
    r.n[a] = (r.n[a] || 0) + 1;
    prune(); // the caller saves
  }

  // ---- timing ----
  let pending = {}, ticks = 0, lastInput = 0;
  function flush() {
    const keys = Object.keys(pending);
    if (!keys.length) return;
    const r = rec(dayOf());
    for (const k of keys) r.s[k] = Math.min(86400, (r.s[k] || 0) + pending[k]);
    pending = {};
    prune();
    store.save();
  }
  function tick() {
    const a = area();
    if (a && document.visibilityState === 'visible' && Date.now() - lastInput < IDLE) pending[a] = (pending[a] || 0) + TICK;
    if (++ticks % FLUSH_EVERY === 0) flush();
  }
  function start() {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function' || typeof setInterval !== 'function') return;
    const touch = () => { lastInput = Date.now(); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
    window.addEventListener('hashchange', touch);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else touch(); });
    window.addEventListener('pagehide', flush);
    touch();
    setInterval(tick, TICK * 1000);
  }

  // ---- reading it back ----
  const goal = () => store.get().goal;
  // A day's totals, including time not yet written (today only).
  function day(d) {
    const r = store.get().activity[d] || { s: {}, n: {} }, live = d === dayOf() ? pending : {};
    const ids = [...new Set([...Object.keys(r.s), ...Object.keys(r.n), ...Object.keys(live)])].filter((k) => AREAS[k]);
    const rows = ids.map((k) => ({ id: k, name: AREAS[k], secs: (r.s[k] || 0) + (live[k] || 0), n: r.n[k] || 0 })).sort((x, y) => y.secs - x.secs || y.n - x.n);
    return { rows, secs: rows.reduce((t, x) => t + x.secs, 0), n: rows.reduce((t, x) => t + x.n, 0), practised: store.get().days.includes(d), tracked: !!store.get().activity[d] || d === dayOf() };
  }
  const mins = (secs) => Math.floor(secs / 60);
  const fmt = (secs) => (secs < 60 ? (secs ? '<1 min' : '0 min') : secs < 3600 ? `${mins(secs)} min` : `${Math.floor(secs / 3600)} h ${String(mins(secs) % 60).padStart(2, '0')} min`);
  const shift = (d, k) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + k); return dayOf(x); };
  const firstTracked = () => Object.keys(store.get().activity).sort()[0] || null;

  function ring(frac, label) {
    const r = 34, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
    return `<svg class="goal-ring" viewBox="0 0 84 84" role="img" aria-label="${esc(label)}">
      <circle cx="42" cy="42" r="${r}" class="goal-track"/>
      <circle cx="42" cy="42" r="${r}" class="goal-fill${f >= 1 ? ' met' : ''}" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 42 42)"/>
      <text x="42" y="47" text-anchor="middle">${f >= 1 ? '✓' : `${Math.round(f * 100)}%`}</text></svg>`;
  }

  // Goal met on how many of the last n days (today included).
  function streakOfGoal() {
    const g = goal();
    if (!g) return 0;
    let n = 0, d = dayOf();
    if (mins(day(d).secs) < g) d = shift(d, -1); // today isn't over yet
    while (mins(day(d).secs) >= g) { n++; d = shift(d, -1); }
    return n;
  }

  function homeCard() {
    const t = day(dayOf()), g = goal();
    const head = g ? `${mins(t.secs)} of ${g} min today` : `${fmt(t.secs)} practised today`;
    const sub = t.rows.length ? t.rows.slice(0, 2).map((x) => `${x.name} ${fmt(x.secs)}`).join(' · ') : 'Time counts while you practise, in any part of the app.';
    return `<a class="card shortcut today-card" href="#/today">${g ? ring(t.secs / 60 / g, `${mins(t.secs)} of ${g} minutes`) : ''}<span class="today-text"><b>${esc(head)}${g && mins(t.secs) >= g ? ' ✓' : ''}</b><span>${esc(sub)}</span></span></a>`;
  }

  function bars(end) {
    const g = goal(), list = Array.from({ length: 14 }, (_, i) => shift(end, i - 13)).map((d) => ({ d, m: mins(day(d).secs) }));
    const top = Math.max(g || 0, ...list.map((x) => x.m), 10);
    return `<div class="act-bars" role="img" aria-label="Minutes practised on each of the 14 days to ${esc(end)}">${list.map((x) => {
      const dt = new Date(`${x.d}T12:00:00`);
      return `<a class="act-bar${x.d === end ? ' on' : ''}${g && x.m >= g ? ' met' : ''}" href="#/today/${x.d}" title="${esc(dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))}: ${x.m} min"><span class="col"><span style="height:${Math.round((x.m / top) * BAR)}px"></span></span><i>${dt.toLocaleDateString('en-GB', { weekday: 'narrow' })}</i></a>`;
    }).join('')}${g ? `<div class="act-goal" style="bottom:${18 + Math.round((g / top) * BAR)}px" aria-hidden="true"></div>` : ''}</div>`;
  }

  function render(el, which) {
    flush();
    const today = dayOf(), d = /^\d{4}-\d\d-\d\d$/.test(which || '') && which <= today ? which : today;
    const t = day(d), g = goal(), isToday = d === today, first = firstTracked();
    const title = isToday ? 'Today' : new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const topSecs = Math.max(1, ...t.rows.map((x) => x.secs));
    const noDetail = !t.rows.length && t.practised && (!first || d < first);
    const gs = streakOfGoal();
    el.innerHTML = `
      <a class="back" href="#/progress">← Progress</a>
      <div class="row act-head"><h1>${esc(title)}</h1><span class="row" style="gap:6px"><a class="btn ghost" href="#/today/${shift(d, -1)}" aria-label="Previous day">←</a>${isToday ? '' : `<a class="btn ghost" href="#/today/${shift(d, 1)}" aria-label="Next day">→</a><a class="btn ghost" href="#/today">Today</a>`}</span></div>
      <div class="card act-summary">
        ${g ? ring(t.secs / 60 / g, `${mins(t.secs)} of ${g} minutes`) : ''}
        <div>
          <p class="act-big"><b>${fmt(t.secs)}</b>${g ? ` of your ${g}-minute goal` : ' practised'}${g && mins(t.secs) >= g ? ' · goal met' : ''}</p>
          <p class="small">${t.n} thing${t.n === 1 ? '' : 's'} done${t.rows.length ? ` in ${t.rows.length} area${t.rows.length === 1 ? '' : 's'}` : ''}${gs ? ` · goal met ${gs} day${gs === 1 ? '' : 's'} running` : ''}</p>
        </div>
      </div>
      ${t.rows.length ? `<div class="card"><h2>Where the time went</h2><table class="act-table">${t.rows.map((x) => `<tr><th scope="row">${esc(x.name)}</th><td class="act-bar-cell"><span style="width:${Math.max(2, Math.round((x.secs / topSecs) * 100))}%"></span></td><td class="mono">${fmt(x.secs)}</td><td class="small">${x.n ? `${x.n} done` : ''}</td></tr>`).join('')}</table></div>`
        : `<div class="card"><p style="margin-top:0">${noDetail ? 'You practised this day, before Theo kept a record of time and areas.' : isToday ? 'Nothing yet today. Time counts while you practise anywhere in the app (not on Home, Progress or settings), and pauses after two minutes without a click, key or scroll.' : 'No practice recorded this day.'}</p>${isToday ? '<a class="btn" href="#/">Find something to practise</a>' : ''}</div>`}
      <div class="card"><h2>Last 14 days</h2>${bars(d)}<p class="small">Tap a day to open it.${g ? ' The line is your daily goal.' : ''}</p></div>
      <div class="card"><h2>Daily goal</h2>
        <label class="row" style="gap:8px">Minutes a day <select id="act-goal">${GOALS.map((m) => `<option value="${m}"${m === g ? ' selected' : ''}>${m ? `${m} min` : 'No goal'}</option>`).join('')}</select></label>
        <p class="small">Short and every day beats long and occasional: 20–30 minutes a day keeps mental maths and probability sharp. Time is measured on this device only.</p></div>`;
    el.querySelector('#act-goal').addEventListener('change', (e) => {
      store.get().goal = +e.target.value;
      store.save();
      render(el, which);
    });
  }

  QT.activity = { AREAS, areaOf, count, flush, day, homeCard, render, fmt, _tick: tick };
  start();
})();
