// Interview prep plan: pick the firm and the date, get a short checklist for each day until then,
// weighted to what that firm is reported to test. Tasks that the app can see you did (an 80-in-8
// run today, a firm question answered, a game played today…) tick themselves; the rest you tick.
(function () {
  const store = QT.store;
  const DAY = 864e5;

  // What each firm emphasises, from the firm profiles in bank.js. `games`: [store key, name, route].
  const FOCUS = {
    wincent: { topics: ['markov', 'bayes', 'ev', 'dice'], games: [['kelly', 'Bet sizing', '#/kelly'], ['figgie', 'Figgie', '#/figgie']], mental: true },
    optiver: { topics: ['dice', 'ev', 'sequences'], games: [['quote', 'Make me a market', '#/quote'], ['market', 'Market making', '#/market']], mental: true, oa: true },
    js: { topics: ['ev', 'puzzles', 'bayes', 'cards'], games: [['figgie', 'Figgie', '#/figgie'], ['quote', 'Make me a market', '#/quote']] },
    sig: { topics: ['ev', 'cards', 'bayes'], games: [['kelly', 'Bet sizing', '#/kelly'], ['quote', 'Make me a market', '#/quote']] },
    imc: { topics: ['dice', 'ev', 'walks'], games: [['quote', 'Make me a market', '#/quote'], ['market', 'Market making', '#/market']], mental: true },
    flow: { topics: ['sequences', 'dice', 'ev'], games: [['quote', 'Make me a market', '#/quote']], mental: true, oa: true },
    davinci: { topics: ['dice', 'ev', 'bayes'], games: [['quote', 'Make me a market', '#/quote']], mental: true },
    default: { topics: ['dice', 'ev', 'bayes'], games: [['quote', 'Make me a market', '#/quote'], ['kelly', 'Bet sizing', '#/kelly']], mental: true },
  };

  const plan = () => store.get().plan;
  const firms = () => Object.entries(QT.firms).filter(([k]) => k !== 'common' && QT.bank.some((b) => b.firm === k));
  const dayDiff = (a, b) => Math.round((Date.parse(`${a}T12:00:00`) - Date.parse(`${b}T12:00:00`)) / DAY);
  const pretty = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const today = () => QT.dayKey(new Date());
  const on = (iso, day) => typeof iso === 'string' && QT.dayKey(new Date(iso)) === day;

  // The checklist for one day. `left` = days until the interview (0 = the day itself).
  function tasksFor(p, day, left, dayIndex) {
    const F = FOCUS[p.firm] || FOCUS.default, name = QT.firms[p.firm]?.name || 'your';
    const s = store.get(), qs = QT.bank.filter((b) => b.firm === p.firm);
    if (left === 0) {
      return [
        { id: 'light', label: `Light review: reread the worked solutions for 2–3 ${name} questions. Nothing new today.`, href: `#/bank/${p.firm}` },
        { id: 'warm', label: 'Warm up with a game of Zetamac', href: '#/mental', auto: () => ['zetamac', 'zetamacCustom'].some((k) => (s.mental[k]?.runs || []).some((r) => on(r.date, day))) },
      ];
    }
    const out = [];
    const topic = QT.topicById(F.topics[dayIndex % F.topics.length]);
    if (topic) out.push({ id: `topic-${topic.id}`, label: `Practise ${topic.name}`, href: `#/topic/${topic.id}`, auto: () => s.log.filter((x) => x.s.startsWith(`${topic.id}.`) && QT.dayKey(new Date(x.t)) === day).length >= 5 });
    // Two firm questions a day, cycling through the firm's list.
    for (let k = 0; k < Math.min(2, qs.length); k++) {
      const b = qs[(dayIndex * 2 + k) % qs.length];
      out.push({ id: `iq-${b.id}`, label: `${name} question: ${b.cat.toLowerCase()}`, href: `#/iq/${b.id}`, auto: () => (s.bank[b.id]?.results || []).some((r) => r !== null && r !== undefined) });
    }
    if (F.mental) out.push({ id: 'mental', label: dayIndex % 2 ? 'Zetamac (2 minutes)' : '80 in 8', href: '#/mental', auto: () => ['full', 'fullTyped', 'zetamac', 'zetamacCustom'].some((k) => (s.mental[k]?.runs || []).some((r) => on(r.date, day))) });
    if (F.oa && dayIndex % 2) out.push({ id: 'oa', label: 'Online tests: number sequences', href: '#/oa', auto: () => (s.oa.seq?.runs || []).some((r) => on(r.date, day)) });
    if (dayIndex % 2 === 0 && F.games.length) {
      const [key, label, href] = F.games[(dayIndex / 2) % F.games.length];
      out.push({ id: `game-${key}`, label, href, auto: () => (s[key]?.history || []).some((r) => on(r.date, day)) });
    }
    // Spoken practice every third day and on the last day before.
    if (dayIndex % 3 === 2 || left === 1) {
      out.push({ id: 'mock', label: `Mock interview: ${name}`, href: `#/mock/${p.firm}` });
      out.push({ id: 'talk', label: 'Answer one question out loud (Think aloud)', href: `#/talk${qs.length ? '/' + qs[dayIndex % qs.length].id : ''}`, auto: () => s.talk.history.some((r) => on(r.date, day)) });
    }
    return out;
  }

  const isDone = (p, day, t) => (t.auto && t.auto()) || (p.done[day] || []).includes(t.id);
  function todayStatus() {
    const p = plan();
    if (!p || !p.firm || !p.date) return null;
    const left = dayDiff(p.date, today());
    if (left < 0) return { p, left, tasks: [], done: 0 };
    const tasks = tasksFor(p, today(), left, dayDiff(today(), p.start));
    return { p, left, tasks, done: tasks.filter((t) => isDone(p, today(), t)).length };
  }

  function view(el) {
    const p = plan();
    if (!p || !p.firm) return setup(el);
    const left = dayDiff(p.date, today()), name = QT.firms[p.firm]?.name || p.firm;
    if (left < 0) {
      el.innerHTML = `
        <h1>How did ${name} go?</h1>
        <div class="card">
          <p style="margin-top:0">Your interview was on ${pretty(p.date)}. If you remember any questions, adding them helps everyone preparing for ${name}, and they'll appear in the app once checked.</p>
          <div class="row"><a class="btn" href="https://github.com/pingadom/theo/issues/new?template=interview-question.yml" target="_blank" rel="noopener">Add a question you were asked</a><button class="ghost" id="end">Start a new plan</button></div>
        </div>`;
      el.querySelector('#end').addEventListener('click', () => { store.get().plan = null; store.save(); view(el); });
      return;
    }
    const st = todayStatus();
    const upcoming = [];
    for (let d = 1; d <= Math.min(left, 6); d++) {
      const day = QT.dayKey(new Date(Date.now() + d * DAY));
      upcoming.push({ day, tasks: tasksFor(p, day, left - d, dayDiff(day, p.start)) });
    }
    el.innerHTML = `
      <div class="title-row"><h1>${name} interview</h1>${left === 0 ? QT.flair.stamp('Today', 'accent') : ''}</div>
      <p class="lede">${pretty(p.date)} · ${left === 0 ? 'today. Good luck.' : left === 1 ? 'tomorrow.' : `in ${left} days.`} A short checklist each day, weighted to what ${name} is reported to test. <a href="#/bank/${p.firm}">How ${name} interviews →</a></p>
      <h2>Today <span class="small">${st.done}/${st.tasks.length} done</span></h2>
      <div class="card plan-list">
        ${st.tasks.map((t) => {
          const done = isDone(p, today(), t), auto = t.auto && t.auto();
          return `<div class="plan-item${done ? ' done' : ''}">
            <button type="button" class="tick" role="checkbox" aria-checked="${done}" aria-label="${done ? 'Done' : 'Mark done'}: ${t.label}" data-task="${t.id}" ${auto ? 'disabled' : ''}>${done ? '✓' : ''}</button>
            <a href="${t.href}">${t.label}</a>${auto ? '<span class="small">ticked automatically</span>' : ''}
          </div>`;
        }).join('')}
      </div>
      ${st.done === st.tasks.length && st.tasks.length ? `<p>${QT.flair.stamp('Day done')} That's today's prep. Rest is part of the plan.</p>` : ''}
      ${upcoming.length ? `<h2>Coming up</h2><div class="card">${upcoming.map((u) => `<p style="margin:0 0 8px"><b>${pretty(u.day)}</b> <span class="small">${u.tasks.map((t) => t.label).join(' · ')}</span></p>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:18px"><button class="ghost" id="change">Change firm or date</button><button class="ghost" id="end">End the plan</button></div>`;
    el.querySelectorAll('[data-task]').forEach((b) => b.addEventListener('click', () => {
      const day = today(), list = (p.done[day] ||= []), id = b.dataset.task;
      if (list.includes(id)) list.splice(list.indexOf(id), 1);
      else list.push(id);
      store.save();
      view(el);
      el.querySelector(`[data-task="${id}"]`)?.focus();
    }));
    el.querySelector('#change').addEventListener('click', () => setup(el));
    el.querySelector('#end').addEventListener('click', () => {
      if (!confirm('End this prep plan?')) return;
      store.get().plan = null;
      store.save();
      view(el);
    });
  }

  function setup(el) {
    const p = plan(), min = today();
    el.innerHTML = `
      <h1>Interview prep plan</h1>
      <p class="lede">Tell it which firm and when. You'll get a short checklist for each day until then, weighted to what that firm is reported to test, and a countdown on the home screen.</p>
      <form class="card" id="plan-form">
        <label for="pf-firm">Firm</label>
        <select id="pf-firm" style="display:block;margin:6px 0 14px">${firms().map(([k, v]) => `<option value="${k}" ${p?.firm === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
        <label for="pf-date">Interview date</label>
        <input type="date" id="pf-date" min="${min}" value="${p?.date || QT.dayKey(new Date(Date.now() + 7 * DAY))}" style="display:block;margin:6px 0 14px">
        <button>${p ? 'Update plan' : 'Make my plan'}</button>
        <p class="small" id="pf-msg" aria-live="polite"></p>
      </form>`;
    el.querySelector('#plan-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const firm = el.querySelector('#pf-firm').value, date = el.querySelector('#pf-date').value;
      if (!/^\d{4}-\d\d-\d\d$/.test(date) || dayDiff(date, today()) < 0) return (el.querySelector('#pf-msg').textContent = 'Pick a date from today onwards.');
      store.get().plan = { firm, date, start: p?.firm === firm ? p.start : today(), done: p?.done || {} };
      store.save();
      view(el);
    });
  }

  QT.views = Object.assign(QT.views || {}, { plan: view });
  QT.plan = { FOCUS, tasksFor, todayStatus, dayDiff };
})();
