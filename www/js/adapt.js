// Weak spots: one estimate per interview skill area, pooled from everything you've answered
// anywhere in Theo, and adaptive sessions that train the weakest.
//
//  - Evidence: topic drills (the coach's recent answers per skill), interview questions (each
//    part's latest result; a hint counts as part credit, an "unsure" flag as a miss), handbook
//    checks, mental-maths answers by question type, market-making results, and this page's own
//    sessions (the last 20 per area, so recent form counts even where the other records keep
//    only a latest result).
//  - Estimate: (successes + 1)/(attempts + 2), i.e. a Beta(1, 1) prior, so two lucky answers
//    don't read as mastery and an untried area sits at 50% with a "not enough data" label.
//  - Sessions: 12 questions. Each pick goes to the area with the most to gain: low mastery,
//    a little for having little evidence, and (if you have an interview plan) how often that
//    firm asks about it.
//    Within an area the level follows you: a miss steps down (handbook check → drill →
//    interview question) and serves the area again; two right in a row steps up, then rests it.
(function () {
  const store = QT.store, R = QT.rand, f = QT.fmtNum;
  const SESSION = 12, KEEP = 20;
  const esc = (s) => QT.escapeHtml(String(s ?? ''));

  // `topics`: coach skills (topics.js); `cats`: interview-question categories; `hb`: handbook chapters.
  const AREAS = [
    { id: 'mental', name: 'Mental maths & sequences', topics: ['sequences'], cats: ['Mental maths', 'Sequences'], hb: ['arith'], mental: true },
    { id: 'counting', name: 'Counting & combinatorics', topics: ['cards'], cats: ['Combinatorics'], hb: ['counting'] },
    { id: 'prob', name: 'Probability & symmetry', topics: ['dice', 'puzzles'], cats: ['Probability', 'Logic'], hb: ['prob-basics', 'symmetry', 'continuous'] },
    { id: 'bayes', name: 'Conditional probability & Bayes', topics: ['bayes'], cats: ['Conditional probability', 'Bayes'], hb: ['conditional'] },
    { id: 'ev', name: 'Expected value & optimal stopping', topics: ['ev'], cats: ['Expected value', 'Optimal stopping', 'Decision making', 'Game theory'], hb: ['expectation', 'recursion', 'stopping'] },
    { id: 'markov', name: 'Markov chains & random walks', topics: ['markov', 'walks'], cats: ['Markov chains', 'Random walks'], hb: ['markov', 'walks'] },
    { id: 'stats', name: 'Statistics & distributions', topics: ['dist', 'moments', 'inference', 'regression', 'timeseries'], cats: ['Statistics', 'Regression'], hb: ['variance', 'distributions'] },
    { id: 'mm', name: 'Market making & estimation', topics: [], cats: ['Market making', 'Estimation'], hb: [], mm: true },
    { id: 'options', name: 'Options & bet sizing', topics: ['options', 'finance'], cats: ['Options', 'Bet sizing'], hb: [] },
  ];
  const byId = (id) => AREAS.find((a) => a.id === id);

  const st = () => store.get().adapt;
  const skillIds = (A) => (QT.topicById ? A.topics.filter(QT.topicById).flatMap((t) => QT.coach.allIds([QT.topicById(t)])) : []);
  const hbChecks = (A) => (QT.handbook ? A.hb.flatMap((id) => {
    const ch = QT.handbook.CHAPTERS[id];
    return ch && !ch.planned ? ch.sections.flatMap((s) => s.checks || []).map((c, idx) => ({ id, idx, c, title: ch.title })) : [];
  }) : []);
  const bankOf = (A) => QT.bank.filter((b) => b.parts && A.cats.includes(b.cat));

  // ---------------------------------------------------------------- the estimate
  function evidence(A) {
    const s = store.get(), ev = []; // [weight, score in 0..1, source]
    for (const id of skillIds(A)) for (const x of s.skills[id]?.recent || []) ev.push([1, x ? 1 : 0, 'drills']);
    for (const b of QT.bank.filter((x) => A.cats.includes(x.cat))) {
      const r = s.bank[b.id];
      if (!r) continue;
      (r.results || []).forEach((ok, i) => { if (ok !== null && ok !== undefined) ev.push([1, ok ? ((r.hinted || [])[i] ? 0.6 : 1) : 0, 'interview questions']); });
      if (r.mark === 'unsure') ev.push([1, 0.3, 'interview questions']);
    }
    for (const id of A.hb) for (const v of Object.values(s.handbook[id]?.c || {})) ev.push([1, v ? 1 : 0, 'handbook']);
    if (A.mental) {
      for (const k of Object.values(s.speed)) for (const ok of (k.oks || []).slice(-10)) ev.push([0.3, ok ? 1 : 0, 'mental maths']);
    }
    if (A.mm) {
      for (const r of s.screen.runs) if (r.mm[1]) ev.push([Math.min(5, r.mm[1]), r.mm[0] / r.mm[1], 'phone-screen markets']);
      const q = s.quote;
      if (q.requotes) ev.push([Math.min(8, q.requotes), q.withFlow / q.requotes, 'Make me a market']);
      if (q.n) ev.push([Math.min(8, q.n), q.hits / q.n, 'Make me a market']);
    }
    if (A.id === 'options' && s.kelly.games && s.kelly.best !== null) ev.push([3, Math.max(0, Math.min(1, s.kelly.best)), 'bet sizing']);
    for (const x of st().r[A.id] || []) ev.push([1, x, 'weak-spot sessions']);
    return ev;
  }
  function estimate(A) {
    const ev = evidence(A), n = ev.reduce((t, [w]) => t + w, 0), k = ev.reduce((t, [w, x]) => t + w * x, 0);
    const m = (k + 1) / (n + 2);
    const status = n < 3 ? 'untested' : m < 0.55 ? 'weak' : m < 0.75 ? 'shaky' : 'strong';
    const from = [...new Set(ev.map((e) => e[2]))];
    return { m, n, status, from };
  }
  // How much a firm asks about an area: its share of that firm's interview questions.
  function relevance(A, firm) {
    const qs = QT.bank.filter((b) => b.firm === firm && b.parts);
    return qs.length ? qs.filter((b) => A.cats.includes(b.cat)).length / qs.length : 0;
  }
  const planFirm = () => store.get().plan?.firm || null;
  function priority(A, e = estimate(A), firm = planFirm()) {
    return (1 - e.m) + 0.1 / Math.sqrt(1 + e.n) + (firm ? 0.5 * relevance(A, firm) : 0);
  }
  const ranked = () => AREAS.map((A) => ({ A, e: estimate(A), p: priority(A) })).sort((a, b) => b.p - a.p);

  // ---------------------------------------------------------------- items, by level
  // 0: handbook check (learn), 1: drill (generator / mental / market), 2: interview question.
  const startLevel = (m) => (m < 0.5 ? 0 : m < 0.75 ? 1 : 2);
  function item(A, level) {
    const s = store.get();
    const tries = [level, level === 2 ? 1 : level + 1, level === 0 ? 2 : level - 1, 0, 1, 2];
    for (const L of tries) {
      if (L === 0) {
        const cs = hbChecks(A);
        if (!cs.length) continue;
        const open = cs.filter(({ id, idx }) => !s.handbook[id]?.c?.[idx]);
        const { id, idx, c, title } = R.pick(open.length ? open : cs);
        return { level: 0, tag: `Handbook · ${title}`, p: { q: c.q, a: c.a, tol: c.tol, hints: c.hint ? [c.hint] : [], sol: c.sol }, practiceOnly: true, save: (ok) => QT.handbookProgress.markCheck(id, idx, ok) };
      }
      if (L === 1) {
        if (A.mm && QT.screen) return { level: 1, mm: R.pick(QT.screen.SCENARIOS) };
        if (A.mental) {
          const kinds = Object.entries(s.speed).filter(([k]) => QT.mentalTips?.KINDS[k]).map(([k, v]) => [k, (v.oks || []).length ? v.oks.reduce((a, b) => a + b, 0) / v.oks.length : 0.5]).sort((a, b) => a[1] - b[1]);
          const g = kinds.length && Math.random() < 0.7 ? QT.mental.genOfKind(kinds[0][0]) : null;
          if (g) return { level: 1, tag: `Mental maths · ${QT.mentalTips.KINDS[g.kind]?.label || 'arithmetic'}`, p: { q: g.q, a: g.a, tol: g.tol, sol: QT.mentalTips.fastWay(g)?.steps || `= <b>${f(g.a)}</b>` }, practiceOnly: true };
          if (QT.screen) { const t = R.pick(QT.screen.traderGens)(); return { level: 1, tag: 'Mental maths · trader-style', p: { q: t.q, a: t.a, tol: t.tol, sol: t.sol, ...(t.ok ? { ok: t.ok } : {}) }, practiceOnly: true }; }
        }
        const ids = skillIds(A);
        if (!ids.length) continue;
        const id = QT.coach.pick(ids), sk = QT.coach.parse(id);
        return { level: 1, tag: `Drill · ${sk.topic.name} · ${sk.name}`, p: sk.topic.gens[sk.gi](), skill: id, save: (ok) => store.recordAttempt(sk.topic.id, ok) };
      }
      const qs = bankOf(A);
      if (!qs.length) continue;
      const firm = planFirm(), status = (b) => QT.ui.bankStatus(b);
      const pool = [...qs.filter((b) => b.firm === firm && status(b) !== 'done'), ...qs.filter((b) => status(b) === 'unsure'), ...qs.filter((b) => status(b) === 'todo')];
      const b = R.pick(pool.length ? pool.slice(0, 8) : qs), pi = R.int(0, b.parts.length - 1), part = b.parts[pi];
      return { level: 2, tag: `Interview · ${QT.firms[b.firm].name}${b.parts.length > 1 ? ` · part ${pi + 1}` : ''}`, p: { ...part, q: `<p class="stem">${b.q}</p><p>${part.q}</p>` }, save: (ok, hints) => QT.ui.recordBank(b.id, pi, ok, hints), credit: (ok, hints) => (ok ? (hints ? 0.6 : 1) : 0) };
    }
    return null;
  }

  // ---------------------------------------------------------------- the page
  const BAR = { weak: 'neg', shaky: '', strong: 'pos', untested: '' };
  const LABEL = { weak: 'Weak', shaky: 'Shaky', strong: 'Strong', untested: 'Not enough data' };
  function render(el, mode, areaId) {
    if (mode === 'session') return session(el, byId(areaId) ? areaId : null);
    const rows = ranked(), firm = planFirm(), a = st();
    const focus = rows.filter((r) => r.e.status !== 'strong').slice(0, 3);
    el.innerHTML = `
      <h1>Weak spots</h1>
      <p class="lede">One estimate per interview skill, pooled from everything you've answered in Theo: topic drills, interview questions, handbook checks, mental maths and market making. Sessions train the weakest areas and adjust to you as you go.</p>
      <div class="card rec">
        <div class="rec-body"><b>${SESSION}-question session</b><p class="small">${focus.length ? `Focus: ${focus.map((r) => esc(r.A.name)).join(', ')}.` : 'Everything looks strong: this mixes in interview questions to keep it that way.'}${firm ? ` Weighted towards what ${esc(QT.firms[firm]?.name || firm)} asks.` : ''}</p></div>
        <a class="btn" href="#/weak/session">Start</a></div>
      <div class="tiles">
        <div class="tile"><div class="v">${a.sessions}</div><div class="k">sessions done</div></div>
        <div class="tile"><div class="v">${rows.filter((r) => r.e.status === 'weak').length}</div><div class="k">weak areas</div></div>
        <div class="tile"><div class="v">${rows.filter((r) => r.e.status === 'strong').length}/${AREAS.length}</div><div class="k">strong areas</div></div>
      </div>
      <div class="weak-list">
        ${rows.map(({ A, e }) => `
          <div class="card weak-row">
            <div class="weak-head"><b>${esc(A.name)}</b><span class="chip-status s-${e.status}">${LABEL[e.status]}</span></div>
            <div class="bar" role="progressbar" aria-label="${esc(A.name)} estimate" aria-valuenow="${Math.round(e.m * 100)}" aria-valuemin="0" aria-valuemax="100"><i class="${BAR[e.status]}" style="width:${Math.round(e.m * 100)}%"></i></div>
            <div class="weak-foot"><span class="small">${Math.round(e.m * 100)}% · ${f(Math.round(e.n))} answer${Math.round(e.n) === 1 ? '' : 's'}${e.from.length ? ` from ${e.from.join(', ')}` : ''}${firm && relevance(A, firm) ? ` · ${Math.round(relevance(A, firm) * 100)}% of ${esc(QT.firms[firm]?.name || firm)} questions` : ''}</span><a href="#/weak/session/${A.id}">Train this →</a></div>
          </div>`).join('')}
      </div>
      <p class="small">How it works: each area's estimate is (right + 1) ÷ (answered + 2), so a couple of lucky answers don't read as mastery. Hints count as part credit and questions you flagged unsure count against you. Sessions pick the area with the most to gain and step the difficulty down after a miss and up after two in a row.</p>`;
  }

  function session(el, only) {
    const before = Object.fromEntries(AREAS.map((A) => [A.id, estimate(A).m]));
    const level = {}, streak = {}, rested = new Set(), log = [];
    let n = 0, last = null;
    el.innerHTML = `
      <a class="back" href="#/weak">← Weak spots</a>
      <h1>${only ? esc(byId(only).name) : 'Weak-spot session'}</h1>
      <div class="session"><span id="ws-area"></span><span class="mono" id="ws-n"></span></div>
      <div id="ws-box"></div>`;
    const box = el.querySelector('#ws-box'), $area = el.querySelector('#ws-area'), $n = el.querySelector('#ws-n');

    function chooseArea() {
      if (only) return byId(only);
      if (last && !last.ok && Math.random() < 0.65) return last.A; // after a miss, usually stay
      const pool = ranked().filter((r) => !rested.has(r.A.id));
      const top = (pool.length ? pool : ranked()).slice(0, 3);
      return (Math.random() < 0.6 ? top[0] : R.pick(top)).A;
    }
    function result(A, it, ok, hints) {
      const x = it.credit ? it.credit(ok, hints) : ok ? 1 : 0, a = st();
      (a.r[A.id] ||= []).push(x);
      if (a.r[A.id].length > KEEP) a.r[A.id].splice(0, a.r[A.id].length - KEEP);
      store.save();
      log.push({ A, ok, level: it.level });
      streak[A.id] = ok ? (streak[A.id] || 0) + 1 : 0;
      level[A.id] = Math.max(0, Math.min(2, level[A.id] + (ok ? (streak[A.id] >= 2 ? 1 : 0) : -1)));
      if (!only && streak[A.id] >= 2 && level[A.id] === 2) rested.add(A.id);
      last = { A, ok };
    }
    function step() {
      if (n >= SESSION) return finish();
      const A = chooseArea();
      if (level[A.id] === undefined) level[A.id] = startLevel(estimate(A).m);
      const it = item(A, level[A.id]);
      if (!it) { rested.add(A.id); return step(); }
      n++;
      $area.textContent = `${A.name} · ${['learn', 'drill', 'interview'][it.level]}`;
      $n.textContent = `${n} / ${SESSION}`;
      if (it.mm) return QT.screen.mm(box, it.mm, 'Market making', (pts, of) => { result(A, { level: 1, credit: () => pts / of }, pts / of >= 0.6); step(); });
      let served = false;
      QT.ui.questionCard(box, () => {
        if (served) return null;
        served = true;
        return { tag: it.tag, p: it.p, skill: it.skill, practiceOnly: it.practiceOnly, record: (ok, hints) => { if (it.save) it.save(ok, hints); result(A, it, ok, hints); } };
      }, () => step());
    }
    function finish() {
      const a = st();
      a.sessions++;
      a.log.push({ date: new Date().toISOString(), n: log.length, right: log.filter((x) => x.ok).length });
      if (a.log.length > 50) a.log.splice(0, a.log.length - 50);
      store.touchDay();
      store.save();
      const touched = [...new Set(log.map((x) => x.A))];
      $area.textContent = 'Finished';
      $n.textContent = '';
      box.innerHTML = `
        <div class="card">
          <h3>Session complete: ${log.filter((x) => x.ok).length}/${log.length} right</h3>
          <div class="table-wrap"><table>
            <tr><th>Area</th><th class="num">This session</th><th class="num">Estimate</th></tr>
            ${touched.map((A) => { const mine = log.filter((x) => x.A === A), now = estimate(A).m, d = now - before[A.id]; return `<tr><td>${esc(A.name)}</td><td class="num">${mine.filter((x) => x.ok).length}/${mine.length}</td><td class="num">${Math.round(before[A.id] * 100)}% → <b class="${d > 0.005 ? 'pos' : d < -0.005 ? 'neg' : ''}">${Math.round(now * 100)}%</b></td></tr>`; }).join('')}
          </table></div>
          <p class="small">A miss isn't wasted: the area comes back sooner, at an easier level, until it sticks.</p>
          <div class="row"><a class="btn" href="#/weak">See all areas</a><button type="button" class="ghost" id="ws-again">Another session</button></div>
        </div>`;
      box.querySelector('#ws-again').addEventListener('click', () => session(el, only));
    }
    step();
  }

  // For the coach: the weakest area with enough evidence, if any is weak.
  function weakest() {
    const w = ranked().filter((r) => r.e.status === 'weak');
    return w.length ? w[0] : null;
  }

  QT.adapt = { render, AREAS, evidence, estimate, priority, relevance, ranked, item, weakest, startLevel };
})();
