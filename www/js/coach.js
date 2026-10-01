// Coach: finds shortcomings and recommends exercises to fix them.
//
//  - Skill tracking: every generator is a named skill (topics.js). For each we keep recent
//    accuracy and answer times, and estimate accuracy with a Beta(1,1) prior so a couple of
//    lucky answers don't count as mastery.
//  - Error diagnosis: a wrong answer is checked against common slips (complement, % vs
//    decimal, sign, inverted ratio, factor of 2, variance vs SD, rounding) so the advice is
//    about the actual mistake, not just "wrong".
//  - Responsive sessions: after a miss you usually get the same skill again with fresh
//    numbers; three in a row correct and that skill is rested for the session.
//  - Recommendations: a ranked list drawing on skills, error habits, speed, mistakes due,
//    mental maths, calibration and market making, each with the reason and a one-tap drill.
(function () {
  const store = QT.store, R = QT.rand, f = QT.fmtNum;
  const DAY = 864e5, WINDOW = 10;

  const skills = () => (store.get().skills ||= {});
  const errors = () => (store.get().errors ||= []);
  const idOf = (topicId, gi) => `${topicId}.${gi}`;
  const parse = (id) => {
    const [t, g] = id.split('.'), topic = QT.topicById(t), gi = +g;
    return topic && topic.skills[gi] ? { id, topic, gi, name: topic.skills[gi] } : null;
  };
  const allIds = (topics = QT.topics) => topics.flatMap((t) => t.skills.map((_, gi) => idOf(t.id, gi)));

  // ---------------------------------------------------------------- skill statistics
  function stat(id) {
    const s = skills()[id];
    if (!s || !s.n) return { n: 0, mean: null, status: 'unseen' };
    const c = s.recent.reduce((a, b) => a + b, 0), k = s.recent.length;
    const mean = (c + 1) / (k + 2); // posterior mean accuracy, Beta(1,1) prior
    const times = [...s.times].sort((a, b) => a - b);
    const time = times.length ? times[Math.floor(times.length / 2)] : null; // median seconds, correct answers only
    const status = k < 3 ? 'learning' : mean < 0.55 ? 'weak' : mean < 0.8 ? 'shaky' : 'strong';
    return { n: s.n, recentC: c, recentN: k, mean, time, last: s.last, status };
  }

  function observe(skillId, ok, ms) {
    const s = (skills()[skillId] ||= { n: 0, c: 0, recent: [], times: [], last: 0 });
    s.n++;
    if (ok) s.c++;
    s.recent.push(ok ? 1 : 0);
    if (s.recent.length > WINDOW) s.recent.shift();
    if (ok && ms >= 1000 && ms < 10 * 60e3) { // ignore implausibly fast answers and idle tabs
      s.times.push(Math.round(ms / 100) / 10);
      if (s.times.length > WINDOW) s.times.shift();
    }
    s.last = Date.now();
    store.save();
  }

  // ---------------------------------------------------------------- error diagnosis
  const ERRORS = {
    complement: { label: 'Complement slip', advice: 'You gave 1 − p instead of p. Before answering, say which event the question asks for, and write P(at least one) = 1 − P(none) explicitly.' },
    scale: { label: 'Percent vs decimal', advice: 'Your answer is off by exactly ×100. Type decimals (0.25), or add a % sign (25%).' },
    sign: { label: 'Sign error', advice: 'Right size, wrong sign. Check the direction: gain or loss, long or short, which side of the mean.' },
    reciprocal: { label: 'Inverted ratio', advice: 'You flipped a ratio. Check what goes on top: σ/√n not √n/σ, probability vs odds, 1/p vs p.' },
    factor2: { label: 'Factor-of-2 error', advice: 'Off by exactly 2. The usual causes are one-sided vs two-sided, ordered vs unordered counting, double counting, or the 2 in 2ab·Cov.' },
    square: { label: 'Variance vs SD', advice: 'You gave the square (or square root) of the answer. Variance and standard deviation are different units, so check which one is asked for.' },
    precision: { label: 'Rounding too early', advice: 'Right method, imprecise arithmetic. Keep 3–4 significant figures until the very end.' },
    skipped: { label: 'Revealed without trying', advice: 'Commit to an estimate before you look. Interviewers reward a reasoned guess and penalise silence.' },
    method: { label: 'Method error', advice: 'Not a slip: the approach needs work. Read the worked solution, then the key formulas, then drill the skill.' },
  };

  function classify(user, ans) {
    if (user === undefined || user === null || !Number.isFinite(user)) return 'skipped';
    const near = (x, y) => Math.abs(x - y) <= Math.max(1e-4, 0.01 * Math.abs(y));
    if (ans !== 0 && Math.abs(user - ans) <= 0.05 * Math.abs(ans)) return 'precision';
    if (ans > 0 && ans < 1 && Math.abs(ans - 0.5) > 0.02 && near(user, 1 - ans)) return 'complement';
    if (ans !== 0 && (near(user, ans * 100) || near(user, ans / 100))) return 'scale';
    if (ans !== 0 && near(user, -ans)) return 'sign';
    if (ans !== 0 && Math.abs(ans) !== 1 && near(user, 1 / ans)) return 'reciprocal';
    if (ans !== 0 && (near(user, 2 * ans) || near(user, ans / 2))) return 'factor2';
    if (ans > 0 && ans !== 1 && (near(user, ans * ans) || near(user, Math.sqrt(ans)))) return 'square';
    return 'method';
  }

  function logError(type, skillId, tag) {
    const L = errors();
    L.push({ type, skill: skillId || null, tag, t: Date.now() });
    if (L.length > 100) L.splice(0, L.length - 100);
    store.save();
  }

  // Error-type counts over the most recent mistakes.
  function habits(last = 30) {
    const counts = {};
    for (const e of errors().slice(-last)) counts[e.type] = (counts[e.type] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([type, n]) => ({ type, n, ...ERRORS[type] }));
  }
  const topErrorFor = (skillId, min = 2) => {
    const c = {};
    for (const e of errors()) if (e.skill === skillId && e.type !== 'method') c[e.type] = (c[e.type] || 0) + 1;
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= min ? ERRORS[best[0]].label : null;
  };

  // ---------------------------------------------------------------- choosing what to practise
  // How much a skill needs work right now (higher = sooner).
  function need(id) {
    const s = stat(id);
    if (s.status === 'unseen') return 0.9;
    let w = 1 - s.mean;
    if (s.status === 'weak') w += 0.3;
    if (s.last && Date.now() - s.last > 14 * DAY) w += 0.2; // spacing: revisit stale skills
    const t = parse(id);
    if (t && s.time && s.time > t.topic.target * 1.5) w += 0.1; // right but slow
    return Math.max(w, 0.05);
  }

  function pick(ids, exclude = new Set()) {
    const pool = ids.filter((id) => !exclude.has(id));
    const list = pool.length ? pool : ids;
    const w = list.map(need);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) if ((r -= w[i]) <= 0) return list[i];
    return list[list.length - 1];
  }

  // Skills a coaching session should target: weakest attempted skills first, topped up
  // with untried skills from the least-practised topics.
  function focus(n = 6) {
    const attempted = allIds().filter((id) => stat(id).n).sort((a, b) => need(b) - need(a)).filter((id) => stat(id).status !== 'strong');
    const fresh = QT.topics
      .map((t) => ({ t, done: (store.get().topics[t.id] || { attempts: 0 }).attempts }))
      .sort((a, b) => a.done - b.done)
      .flatMap(({ t }) => t.skills.map((_, gi) => idOf(t.id, gi)).filter((id) => !stat(id).n).slice(0, 1));
    const out = [...attempted.slice(0, n)];
    for (const id of fresh) if (out.length < n && !out.includes(id)) out.push(id);
    return out.length ? out : allIds().sort((a, b) => need(b) - need(a)).slice(0, n);
  }

  // A question source for questionCard (app.js). Responsive: after a miss, 65% of the time
  // the same skill comes straight back with new numbers; after 3 correct in a row it rests.
  function source(ids, { limit = Infinity, label = null } = {}) {
    let last = null, served = 0;
    const streak = {}, rested = new Set();
    return () => {
      if (served >= limit) return null;
      let id, again = false;
      if (last && !last.ok && Math.random() < 0.65) {
        id = last.id;
        again = true;
      } else id = pick(ids, rested);
      served++;
      const { topic, gi, name } = parse(id);
      return {
        tag: `${label ? label(served) + ' · ' : ''}${topic.name} · ${name}${again ? ' · another one like that' : ''}`,
        p: topic.gens[gi](),
        skill: id,
        topicId: topic.id,
        record: (ok) => {
          store.recordAttempt(topic.id, ok);
          last = { id, ok };
          streak[id] = ok ? (streak[id] || 0) + 1 : 0;
          if (streak[id] >= 3) rested.add(id);
        },
      };
    };
  }

  // One question per topic, to build a first profile.
  function diagnosticSource() {
    const order = [...QT.topics];
    let i = 0;
    return () => {
      if (i >= order.length) return null;
      const topic = order[i++], gi = R.int(0, topic.gens.length - 1);
      return {
        tag: `Diagnostic ${i}/${order.length} · ${topic.name}`,
        p: topic.gens[gi](),
        skill: idOf(topic.id, gi),
        topicId: topic.id,
        record: (ok) => store.recordAttempt(topic.id, ok),
      };
    };
  }

  // ---------------------------------------------------------------- recommendations
  function recommend() {
    const st = store.get(), recs = [];
    const ids = allIds(), stats = ids.map((id) => ({ id, ...stat(id), ...parse(id) }));
    const attempted = stats.filter((s) => s.n), totalAttempts = attempted.reduce((a, s) => a + s.n, 0);
    const drill = (s) => ({ href: `#/drill/${s.topic.id}/${s.gi}`, label: 'Drill 5 questions' });

    if (totalAttempts < 10) {
      recs.push({ pri: 100, kind: 'start', title: 'Take the 14-question diagnostic', why: 'One question from every topic, so I can find your gaps. It takes about 15 minutes.', href: '#/coach/diagnostic', label: 'Start diagnostic' });
    }

    const due = QT.mistakes ? QT.mistakes.due().length : 0;
    if (due) recs.push({ pri: 90, kind: 'review', title: `Review ${due} mistake${due > 1 ? 's' : ''} due`, why: 'Spaced review of problems you got wrong. It is the fastest way to stop repeating them.', href: '#/mistakes/due', label: 'Review now' });

    for (const s of attempted.filter((x) => x.status === 'weak')) {
      const slip = topErrorFor(s.id);
      recs.push({ pri: 80 + (0.55 - s.mean) * 40, kind: 'weak', title: `Fix: ${s.name}`, why: `${s.recentC}/${s.recentN} recently correct in ${s.topic.name}.${slip ? ` Most common slip: ${slip.toLowerCase()}.` : ''}`, ...drill(s) });
    }

    // Too few tries to call it weak yet, but missed more often than not: act on it early.
    for (const s of attempted.filter((x) => x.status === 'learning' && x.recentC < x.recentN - x.recentC)) {
      const slip = topErrorFor(s.id, 1), misses = s.recentN - s.recentC;
      recs.push({ pri: 62 + misses * 4, kind: 'missed', title: `Work on: ${s.name}`, why: `Missed ${misses} of ${s.recentN} so far (${s.topic.name}).${slip ? ` Diagnosis: ${slip.toLowerCase()}.` : ' The method needs work: read the worked solution first.'}`, ...drill(s) });
    }

    // A specific slip twice is already a pattern (generic method errors are covered by the skill recs).
    for (const h of habits().filter((h) => h.n >= 2 && h.type !== 'method')) {
      const where = {};
      for (const e of errors().slice(-30)) if (e.type === h.type && e.skill) where[e.skill] = (where[e.skill] || 0) + 1;
      const worst = Object.entries(where).sort((a, b) => b[1] - a[1])[0];
      const s = worst && parse(worst[0]);
      recs.push({ pri: 70 + h.n, kind: 'habit', title: `Habit: ${h.label.toLowerCase()} (${h.n} of your last ${Math.min(errors().length, 30)} mistakes)`, why: h.advice, ...(s ? { href: `#/drill/${s.topic.id}/${s.gi}`, label: `Drill ${s.name}` } : { href: '#/review', label: 'Mixed review' }) });
    }

    for (const s of attempted.filter((x) => x.status === 'shaky')) {
      recs.push({ pri: 55 + (0.8 - s.mean) * 20, kind: 'shaky', title: `Firm up: ${s.name}`, why: `${s.recentC}/${s.recentN} recently correct (${s.topic.name}). Close, but not reliable yet.`, ...drill(s) });
    }

    for (const s of attempted.filter((x) => x.status === 'strong' && x.time && x.time > x.topic.target * 1.5)) {
      recs.push({ pri: 50, kind: 'speed', title: `Speed up: ${s.name}`, why: `Accurate, but your median is ${f(s.time)}s against a ${s.topic.target}s target. Interviews are timed, so drill until it's automatic.`, ...drill(s) });
    }

    const mm = st.mental || {};
    if (!mm.full?.runs?.length) recs.push({ pri: totalAttempts >= 10 ? 45 : 30, kind: 'mental', title: 'Take an 80-in-8 baseline', why: 'Mental maths screens are reported at Optiver and others. Find out where you stand.', href: '#/mental', label: 'Mental maths' });
    else if (mm.full.best < 55) recs.push({ pri: 60, kind: 'mental', title: `Mental maths: best ${mm.full.best} net, ~55 is the commonly reported pass line`, why: 'Do a 2-minute sprint every day. Fractions and decimal multiplication are where most points are lost.', href: '#/mental', label: 'Practise' });

    const e = st.estimate || { n: 0 };
    if (e.n >= 20 && e.hits / e.n < 0.75) recs.push({ pri: 65, kind: 'calibration', title: `Overconfident: your ranges catch the truth ${Math.round((100 * e.hits) / e.n)}% of the time`, why: 'A 90% range should miss only 1 time in 10. Widen your ranges, especially for unfamiliar quantities.', href: '#/estimate', label: 'Estimation round' });
    else if (e.n >= 20 && e.hits / e.n > 0.97) recs.push({ pri: 40, kind: 'calibration', title: 'Underconfident: your ranges are wider than they need to be', why: "You're scoring less than you could. Tighten your ranges.", href: '#/estimate', label: 'Estimation round' });

    const m = st.market || { games: 0 };
    if (m.games >= 3 && m.total < 0) recs.push({ pri: 50, kind: 'market', title: `Market making: average P&L ${f(m.total / m.games)}`, why: "You're losing to the informed trader. Centre your quotes on fair value and widen as fewer dice stay hidden, because their information is worth more then.", href: '#/market', label: 'Play a game' });

    if (totalAttempts >= 10) {
      const untouched = QT.topics.filter((t) => !(st.topics[t.id]?.attempts));
      untouched.slice(0, 2).forEach((t, i) => recs.push({ pri: 35 - i, kind: 'explore', title: `Start ${t.name}`, why: `You haven't tried this topic yet. ${t.blurb}`, href: `#/topic/${t.id}`, label: 'Practise' }));
    }

    const strongShare = attempted.length ? attempted.filter((s) => s.status === 'strong').length / attempted.length : 0;
    if (attempted.length >= 15 && strongShare >= 0.6 && QT.bank) {
      const doneBy = {};
      for (const b of QT.bank) if (store.get().bank[b.id]?.results?.length) doneBy[b.firm] = (doneBy[b.firm] || 0) + 1;
      const firm = Object.keys(QT.firms).filter((k) => k !== 'common' && QT.bank.some((b) => b.firm === k)).sort((a, b) => (doneBy[a] || 0) - (doneBy[b] || 0))[0];
      recs.push({ pri: 45, kind: 'interview', title: `Ready for real questions: ${QT.firms[firm].name} mock interview`, why: `${Math.round(strongShare * 100)}% of the skills you've tried are strong. Test them on questions candidates report from real interviews.`, href: `#/mock/${firm}`, label: 'Mock interview' });
    }

    for (const s of attempted.filter((x) => x.status === 'strong' && Date.now() - x.last > 14 * DAY).slice(0, 2)) {
      recs.push({ pri: 20, kind: 'refresh', title: `Refresh: ${s.name}`, why: `Strong, but you haven't practised it for ${Math.floor((Date.now() - s.last) / DAY)} days.`, ...drill(s) });
    }

    return recs.sort((a, b) => b.pri - a.pri);
  }

  QT.coach = { ERRORS, idOf, parse, allIds, stat, observe, classify, logError, habits, need, pick, focus, source, diagnosticSource, recommend };
})();
