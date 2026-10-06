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

  // ---------------------------------------------------------------- Elo ability model
  // P(correct on skill k) = σ(θ + b_k): one learner ability θ shared across all skills plus a
  // per-skill easiness b_k whose step size shrinks with evidence. Chosen by out-of-sample evaluation
  // against six alternatives on simulated learners (research/REPORT.md): unlike a per-skill average
  // it shrinks noisy skills towards your overall ability, which removes the bias that comes from
  // repeatedly selecting skills that merely *look* weak. Settings fitted on training learners only.
  const ELO = { kTheta: 0.05, kBeta: 0.6, decay: 0.05 };
  const sig = (x) => 1 / (1 + Math.exp(-x));

  function elo() {
    const st = store.get();
    if (!st.elo) {
      // Migrate: rebuild from the answer log, or (pre-0.8 data) from each skill's recent answers.
      st.elo = { theta: 0, b: {}, n: {} };
      const replay = st.log && st.log.length ? st.log.map((e) => [e.s, e.ok]) : Object.entries(st.skills || {}).flatMap(([id, s]) => s.recent.map((ok) => [id, ok]));
      for (const [id, ok] of replay) eloUpdate(st.elo, id, ok);
    }
    return st.elo;
  }
  function eloUpdate(E, id, ok) {
    const n = E.n[id] || 0, err = (ok ? 1 : 0) - sig(E.theta + (E.b[id] || 0));
    E.theta += ELO.kTheta * err;
    E.b[id] = (E.b[id] || 0) + (ELO.kBeta / (1 + ELO.decay * n)) * err;
    E.n[id] = n + 1;
  }
  const prob = (id) => { const E = elo(); return sig(E.theta + (E.b[id] || 0)); };

  // ---------------------------------------------------------------- skill statistics
  function stat(id) {
    const s = skills()[id];
    if (!s || !s.n) return { n: 0, mean: null, status: 'unseen' };
    const c = s.recent.reduce((a, b) => a + b, 0), k = s.recent.length;
    const mean = (c + 1) / (k + 2); // posterior mean accuracy, Beta(1,1) prior
    const times = [...s.times].sort((a, b) => a - b);
    const time = times.length ? times[Math.floor(times.length / 2)] : null; // median seconds, correct answers only
    // Labels use the recent-window rate; the study found they track next-attempt accuracy well.
    const status = k < 3 ? 'learning' : mean < 0.55 ? 'weak' : mean < 0.8 ? 'shaky' : 'strong';
    return { n: s.n, recentC: c, recentN: k, mean, p: prob(id), time, last: s.last, status };
  }

  function observe(skillId, ok, ms) {
    eloUpdate(elo(), skillId, ok);
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
    // Answer-level history for offline model evaluation (research/ notebook), capped in core.js.
    const log = (store.get().log ||= []);
    log.push({ s: skillId, ok: ok ? 1 : 0, ms: Math.round(ms), t: Date.now() });
    if (log.length > 5000) log.splice(0, log.length - 5000);
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
    for (const e of errors().slice(-last)) if (ERRORS[e.type]) counts[e.type] = (counts[e.type] || 0) + 1;
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
    if (s.status === 'unseen') return 0.9; // keep exploring untried skills
    let w = 1 - s.p; // Elo estimate, not the raw recent rate (see the ELO note above)
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
  function source(ids, { limit = Infinity, label = null, showTopic = true } = {}) {
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
        tag: `${label ? label(served) + ' · ' : ''}${showTopic ? topic.name + ' · ' : ''}${name}${again ? ' · another one like that' : ''}`,
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
      recs.push({ pri: 80 + (0.55 - s.mean) * 40, kind: 'weak', voice: `You're short ${s.name}: ${s.recentC} of your last ${s.recentN}. Cover it before you do anything else.`, title: `Fix: ${s.name}`, why: `${s.recentC}/${s.recentN} recently correct in ${s.topic.name}.${slip ? ` Most common mistake: ${slip.toLowerCase()}.` : ''}`, ...drill(s) });
    }

    // Too few tries to call it weak yet, but missed more often than not: act on it early.
    for (const s of attempted.filter((x) => x.status === 'learning' && x.recentC < x.recentN - x.recentC)) {
      const slip = topErrorFor(s.id, 1), misses = s.recentN - s.recentC;
      recs.push({ pri: 62 + misses * 4, kind: 'missed', voice: `${misses} misses out of ${s.recentN} on ${s.name}. Don't average down: read the solution, then go again.`, title: `Work on: ${s.name}`, why: `Missed ${misses} of ${s.recentN} so far (${s.topic.name}).${slip ? ` Diagnosis: ${slip.toLowerCase()}.` : ' The method needs work: read the worked solution first.'}`, ...drill(s) });
    }

    // A specific slip twice is already a pattern (generic method errors are covered by the skill recs).
    for (const h of habits().filter((h) => h.n >= 2 && h.type !== 'method')) {
      const where = {};
      for (const e of errors().slice(-30)) if (e.type === h.type && e.skill) where[e.skill] = (where[e.skill] || 0) + 1;
      const worst = Object.entries(where).sort((a, b) => b[1] - a[1])[0];
      const s = worst && parse(worst[0]);
      recs.push({ pri: 70 + h.n, kind: 'habit', voice: `Same slip ${h.n} times. That isn't bad luck, it's a position. Close it.`, title: `Habit: ${h.label.toLowerCase()} (${h.n} of your last ${Math.min(errors().length, 30)} mistakes)`, why: h.advice, ...(s ? { href: `#/drill/${s.topic.id}/${s.gi}`, label: `Drill ${s.name}` } : { href: '#/review', label: 'Mixed practice' }) });
    }

    for (const s of attempted.filter((x) => x.status === 'shaky')) {
      recs.push({ pri: 55 + (0.8 - s.mean) * 20, kind: 'shaky', voice: `${s.name}: right more often than not, but I wouldn't size up on it yet.`, title: `Firm up: ${s.name}`, why: `${s.recentC}/${s.recentN} recently correct (${s.topic.name}). Close, but not reliable yet.`, ...drill(s) });
    }

    for (const s of attempted.filter((x) => x.status === 'strong' && x.time && x.time > x.topic.target * 1.5)) {
      recs.push({ pri: 50, kind: 'speed', voice: `You get there on ${s.name}, just slowly. On a timed test, slow is wrong.`, title: `Speed up: ${s.name}`, why: `Accurate, but your median is ${f(s.time)}s against a ${s.topic.target}s target. Interviews are timed, so drill until it's automatic.`, ...drill(s) });
    }

    const mm = st.mental || {};
    // Best 80-in-8 net in either answer style (multiple choice or typed).
    const b80 = QT.mental ? QT.mental.best80() : (mm.full?.best ?? null);
    if (b80 === null) recs.push({ pri: totalAttempts >= 10 ? 45 : 30, kind: 'mental', voice: 'No number on your mental maths yet. Put one on the board.', title: 'Take an 80-in-8 baseline', why: 'Mental maths screens are reported at Optiver and others. Find out where you stand.', href: '#/mental', label: 'Mental maths' });
    else if (b80 < 55) recs.push({ pri: 60, kind: 'mental', voice: `${b80} net. The desk wants 55. Close the gap.`, title: `Mental maths: best ${b80} net, ~55 is the commonly reported pass line`, why: 'Learn the speed tricks, then play Zetamac every day. Fractions and decimal multiplication are where most points are lost.', href: '#/tricks', label: 'Speed tricks' });

    // An interview prep plan with tasks left today outranks everything else.
    const ps = QT.plan && QT.plan.todayStatus();
    if (ps && ps.left >= 0 && ps.done < ps.tasks.length) {
      const name = QT.firms[ps.p.firm]?.name || ps.p.firm, n = ps.tasks.length - ps.done;
      recs.push({ pri: 200, kind: 'plan', voice: ps.left === 0 ? `${name} today. Light review only, then go and get it.` : `${name} in ${ps.left} day${ps.left > 1 ? 's' : ''}. ${n} thing${n > 1 ? 's' : ''} left on today's list.`, title: `Today's ${name} prep: ${ps.done}/${ps.tasks.length} done`, why: `Next: ${ps.tasks.find((t) => !(t.auto && t.auto()) && !(ps.p.done[QT.dayKey(new Date())] || []).includes(t.id))?.label || 'see the plan'}.`, href: '#/plan', label: 'Open the plan' });
    }

    // Formula cards that are due.
    const cardsDue = QT.flashcards ? QT.flashcards.dueIds().length : 0;
    if (cardsDue >= 5) recs.push({ pri: 44, kind: 'cards', voice: `${cardsDue} formulas you should know cold. Five minutes.`, title: `Formula cards: ${cardsDue} due`, why: 'Results like Var(aX + bY), the Kelly fraction and √252 come up constantly. Flip through the ones due today.', href: '#/flashcards', label: 'Review cards' });

    // Speed reps that are due: short timed sets of one question type.
    if (QT.mentalTips && st.speedReview) {
      const due = Object.entries(st.speedReview).filter(([k, r]) => r.due <= Date.now() && QT.mentalTips.KINDS[k]);
      if (due.length) {
        const [k] = due[0], L = QT.mentalTips.KINDS[k].label;
        recs.push({ pri: 66, kind: 'speedRep', voice: due.length > 1 ? `${due.length} speed reps on your book. Two minutes each.` : `${L} is back on your list. Eight questions, at pace.`, title: `Speed rep due: ${L.toLowerCase()}`, why: `8 timed questions of one type. Pass with at most one miss at your target pace and it moves out to the next interval.${due.length > 1 ? ` ${due.length - 1} more due after this.` : ''}`, href: `#/mental/rep/${k}`, label: 'Start the rep' });
      }
    }

    // Mental maths by question type: the slowest type (or the most missed) gets its speed-trick guide.
    if (QT.mentalTips && st.speed) {
      const types = QT.mentalTips.speedTable(st.speed).filter((x) => x.n >= 8);
      const slow = types.find((x) => x.median > 7 || x.missRate > 0.25);
      const guide = slow && (QT.tricks || []).find((t) => t.id === slow.guide);
      if (slow && guide) {
        const missed = Math.round(slow.missRate * 100);
        recs.push({
          pri: 52 + Math.min(10, slow.median - 7) + missed / 10, kind: 'speedType',
          voice: slow.median > 7 ? `${slow.label} at ${slow.median.toFixed(1)} seconds each. At 80-in-8 pace you get six.` : `You miss ${missed}% of ${slow.label.toLowerCase()}. Points you're giving away.`,
          title: `Speed up: ${slow.label.toLowerCase()}`,
          why: `Median ${slow.median.toFixed(1)} s and ${missed}% missed over your last ${slow.n} in mental maths. “${guide.title}” is the method for most of them.`,
          href: `#/tricks/${guide.id}`, label: 'Learn the trick',
        });
      }
    }

    // Trading games: act on how you play, and introduce the ones you haven't tried.
    const fg = st.figgie || { games: 0 };
    if (fg.games >= 3 && fg.total / fg.games < 0) recs.push({ pri: 48, kind: 'figgie', voice: "You're the liquidity at that table. Read your hand before you trade.", title: `Figgie: average ${f(fg.total / fg.games)} chips a game`, why: 'Open “Show the maths” early: the suit you hold most of is probably the 12-card suit, so its partner colour is probably the goal. Sell the long suit, buy the likely goal suit under about 20.', href: '#/figgie', label: 'Play Figgie' });
    const qu = st.quote || { n: 0 };
    if (qu.requotes >= 10 && qu.withFlow / qu.requotes < 0.6) recs.push({ pri: 50, kind: 'quote', voice: "They keep lifting you and you don't move. They know something. Move.", title: `Make a market: you moved with the trade ${Math.round((100 * qu.withFlow) / qu.requotes)}% of the time`, why: 'When the interviewer buys, raise your market; when they sell, lower it. They trade the right way 7 times in 8 here.', href: '#/quote', label: 'Quote again' });
    else if (qu.n >= 10 && qu.hits / qu.n < 0.4) recs.push({ pri: 46, kind: 'quote', voice: 'Your final markets miss more often than they hit. Start wider, then tighten.', title: `Make a market: ${Math.round((100 * qu.hits) / qu.n)}% of final markets contained the answer`, why: 'Centre the first quote on a reasoned estimate and size the width to your uncertainty; tighten only as the trades tell you something.', href: '#/quote', label: 'Quote again' });
    const ke = st.kelly || { games: 0 };
    if (ke.games >= 2 && ke.best !== null && ke.best < 0.6) recs.push({ pri: 47, kind: 'kelly', voice: "You're sizing on feel. Size on edge over odds.", title: `Bet sizing: best score ${Math.round(ke.best * 100)}% of Kelly`, why: 'Work out f* = p − q/b before every bet. Stake nothing when it is negative, and never more than twice f*.', href: '#/kelly', label: 'Size some bets' });
    if (totalAttempts >= 20) {
      const untried = [
        [!fg.games, 'Figgie', '#/figgie', "Jane Street's own trading game. Reading other people's trades is half of it."],
        [!qu.n, 'Make me a market', '#/quote', 'The most common live trading-interview format.'],
        [!ke.games, 'Bet sizing', '#/kelly', 'Interviewers ask how much you would bet, not just whether.'],
        [!Object.keys(st.oa || {}).length, 'Online tests', '#/oa', 'Sequences, memory and attention: the screens before the interview.'],
      ].filter((x) => x[0]);
      if (untried.length) {
        const [, name, href, why] = untried[0];
        recs.push({ pri: 33, kind: 'explore', voice: `Nothing on the books for ${name.toLowerCase()} yet.`, title: `Try ${name}`, why, href, label: 'Start' });
      }
    }
    const talked = st.talk?.sessions || 0, bankDone = Object.keys(st.bank || {}).length;
    if (!talked && bankDone >= 3) recs.push({ pri: 42, kind: 'talk', voice: 'Typing answers is not an interview. Say it out loud.', title: 'Answer a question out loud', why: `You've answered ${bankDone} interview questions by typing. Interviews are spoken: practise talking one through against the clock.`, href: '#/talk', label: 'Think aloud' });

    const e = st.estimate || { n: 0 };
    if (e.n >= 20 && e.hits / e.n < 0.75) recs.push({ pri: 65, kind: 'calibration', voice: `Your 90% ranges hold ${Math.round((100 * e.hits) / e.n)}% of the time. Overconfidence is how traders blow up.`, title: `Overconfident: your ranges catch the truth ${Math.round((100 * e.hits) / e.n)}% of the time`, why: 'A 90% range should miss only 1 time in 10. Widen your ranges, especially for unfamiliar quantities.', href: '#/estimate', label: 'Estimation round' });
    else if (e.n >= 20 && e.hits / e.n > 0.97) recs.push({ pri: 40, kind: 'calibration', voice: 'Ranges that wide never lose, and never win either.', title: 'Underconfident: your ranges are wider than they need to be', why: "You're scoring less than you could. Tighten your ranges.", href: '#/estimate', label: 'Estimation round' });

    const m = st.market || { games: 0 };
    if (m.games >= 3 && m.total < 0) recs.push({ pri: 50, kind: 'market', voice: "You're paying the informed trader. Tighten up around fair value.", title: `Market making: average P&L ${f(m.total / m.games)}`, why: "You're losing to the informed trader. Centre your quotes on fair value and widen as fewer dice stay hidden, because their information is worth more then.", href: '#/market', label: 'Play a game' });

    if (totalAttempts >= 10) {
      const untouched = QT.topics.filter((t) => !(st.topics[t.id]?.attempts));
      untouched.slice(0, 2).forEach((t, i) => recs.push({ pri: 35 - i, kind: 'explore', voice: `Nothing on the books for ${t.name.toLowerCase()} yet.`, title: `Start ${t.name}`, why: `You haven't tried this topic yet. ${t.blurb}`, href: `#/topic/${t.id}`, label: 'Practise' }));
    }

    const strongShare = attempted.length ? attempted.filter((s) => s.status === 'strong').length / attempted.length : 0;
    if (attempted.length >= 15 && strongShare >= 0.6 && QT.bank) {
      const doneBy = {};
      for (const b of QT.bank) if (store.get().bank[b.id]?.results?.length) doneBy[b.firm] = (doneBy[b.firm] || 0) + 1;
      const firm = Object.keys(QT.firms).filter((k) => k !== 'common' && QT.bank.some((b) => b.firm === k)).sort((a, b) => (doneBy[a] || 0) - (doneBy[b] || 0))[0];
      recs.push({ pri: 45, kind: 'interview', voice: `You're ready for a real desk. Let's see how you handle ${QT.firms[firm].name}.`, title: `Ready for real questions: ${QT.firms[firm].name} mock interview`, why: `${Math.round(strongShare * 100)}% of the skills you've tried are strong. Test them on questions candidates report from real interviews.`, href: `#/mock/${firm}`, label: 'Mock interview' });
    }

    for (const s of attempted.filter((x) => x.status === 'strong' && Date.now() - x.last > 14 * DAY).slice(0, 2)) {
      recs.push({ pri: 20, kind: 'refresh', voice: `${Math.floor((Date.now() - s.last) / DAY)} days since you touched ${s.name}. Keep your book fresh.`, title: `Refresh: ${s.name}`, why: `Strong, but you haven't practised it for ${Math.floor((Date.now() - s.last) / DAY)} days.`, ...drill(s) });
    }

    return recs.sort((a, b) => b.pri - a.pri);
  }

  QT.coach = { ELO, prob, ERRORS, idOf, parse, allIds, stat, observe, classify, logError, habits, need, pick, focus, source, diagnosticSource, recommend };
})();
