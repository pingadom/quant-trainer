// Shared test suite, used by tests/check.html (browser) and tests/run-node.js (CI).
// runChecks(QT, files) → { lines, fails }. `files` optionally holds raw text of
// index.html, sw.js and package.json for the build-consistency checks.
(function (root) {
  function runChecks(QT, files = {}) {
    const out = [], fail = (m) => out.push(`FAIL ${m}`);
    let sims = 0, gens = 0, bankSims = 0;

    // Monte Carlo check: the estimate must lie within 5 standard errors of the exact answer
    // (a false alarm has probability < 1e-6 per check, however rare the conditioning event).
    const simCheck = (p, label, defaultTrials) => {
      let s = 0, s2 = 0, n = 0;
      for (let i = 0; i < (p.trials || defaultTrials); i++) {
        const v = p.sim();
        if (v !== null) { s += v; s2 += v * v; n++; }
      }
      const est = s / n, se = Math.sqrt(Math.max(s2 / n - est * est, 0) / n);
      if (!(Math.abs(est - p.a) <= 5 * se + 1e-9)) fail(`${label}: simulation ${est} ± ${se.toFixed(5)} vs exact ${p.a}`);
    };
    const selfCheck = (p, label) => {
      if (!Number.isFinite(p.a) || !p.q || !p.sol || /undefined|NaN/.test(p.q + p.sol)) { fail(`${label}: bad output a=${p.a} q=${String(p.q).slice(0, 70)}`); return false; }
      if (!QT.isCorrect(QT.parseAnswer(String(p.a)), p.a, p.tol)) { fail(`${label}: own answer rejected`); return false; }
      return true;
    };
    const https = (u) => /^https:\/\//.test(u);

    // Generators: 300 random instances each, plus one simulation cross-check.
    for (const t of QT.topics) {
      if (!t.gens || !t.gens.length) { fail(`${t.id}: no generators`); continue; }
      t.gens.forEach((g, gi) => {
        gens++;
        for (let k = 0; k < 300; k++) if (!selfCheck(g(), `${t.id}#${gi}`)) break;
        const p = g();
        if (p.sim) { sims++; simCheck(p, `${t.id}#${gi}`, 100000); }
      });
    }

    // Case studies.
    const ids = new Set();
    for (const c of QT.cases) {
      if (ids.has(c.id)) fail(`case ${c.id}: duplicate id`);
      ids.add(c.id);
      if (!c.questions.length) fail(`case ${c.id}: no questions`);
      c.questions.forEach((q, i) => selfCheck(q, `case ${c.id} q${i}`));
      if (!c.sources.length || !c.sources.every(([, u]) => https(u))) fail(`case ${c.id}: sources`);
    }

    // Interview bank.
    const bids = new Set();
    for (const b of QT.bank) {
      if (bids.has(b.id)) fail(`bank ${b.id}: duplicate id`);
      bids.add(b.id);
      if (!QT.firms[b.firm]) fail(`bank ${b.id}: unknown firm ${b.firm}`);
      if (!b.src || !https(b.src[1])) fail(`bank ${b.id}: source`);
      if (!['reported', 'guide'].includes(b.kind)) fail(`bank ${b.id}: kind`);
      if (!b.parts && !b.open) fail(`bank ${b.id}: no parts or open answer`);
      (b.parts || []).forEach((p, i) => {
        selfCheck(p, `bank ${b.id} part ${i}`);
        if (p.sim) { bankSims++; simCheck(p, `bank ${b.id} part ${i}`, 200000); }
      });
    }
    for (const [k, v] of Object.entries(QT.firms)) if (!v.sources.every(([, u]) => https(u))) fail(`firm ${k}: sources`);

    // Estimation facts: positive, finite, unique.
    if (QT.estimateFacts) {
      const seen = new Set();
      for (const [q, , a] of QT.estimateFacts) {
        if (!(Number.isFinite(a) && a > 0)) fail(`estimate "${q}": bad answer ${a}`);
        if (seen.has(q)) fail(`estimate "${q}": duplicate`);
        seen.add(q);
      }
    }

    // Spaced repetition: a missed card is due after 1 day, survives 3 correct reviews,
    // retires on the 4th, and a wrong review resets it. (Runs on a scratch copy of the store.)
    if (QT.mistakes) {
      const saved = QT.store.exportJson();
      QT.store.reset();
      const p = { q: 'test <b>card</b>', a: 1, sol: 's', sim: () => 1 };
      QT.mistakes.add('Test', p);
      const m = QT.mistakes.all()[0];
      if (QT.mistakes.due().length !== 0) fail('mistakes: new card should not be due immediately');
      if ('sim' in m.p) fail('mistakes: simulation function should not be stored');
      QT.mistakes.add('Test', p);
      if (QT.mistakes.all().length !== 1) fail('mistakes: duplicate card added');
      const steps = [];
      for (let i = 0; i < 4; i++) { m.due = 0; steps.push(QT.mistakes.review(m, true)); }
      if (steps.join('|') !== 'next in 3 days|next in 7 days|next in 21 days|mastered') fail(`mistakes: schedule ${steps.join('|')}`);
      if (QT.mistakes.all().length !== 0 || QT.store.get().mastered !== 1) fail('mistakes: card not retired');
      QT.mistakes.add('Test', p);
      const m2 = QT.mistakes.all()[0];
      QT.mistakes.review(m2, true);
      QT.mistakes.review(m2, false);
      if (m2.box !== 0) fail('mistakes: wrong review should reset the card');
      QT.store.importJson(saved);
    }

    // Coach: skill labels line up with generators; error diagnosis; status model; recommendations.
    if (QT.coach) {
      for (const t of QT.topics) {
        if (!t.skills || t.skills.length !== t.gens.length) fail(`coach: ${t.id} has ${t.skills ? t.skills.length : 0} skill labels for ${t.gens.length} generators`);
        if (!(t.target > 0)) fail(`coach: ${t.id} has no speed target`);
      }
      const cases = [[0.7, 0.3, 'complement'], [25, 0.25, 'scale'], [-1.2, 1.2, 'sign'], [0.25, 4, 'reciprocal'], [6, 3, 'factor2'],
        [0.04, 0.2, 'square'], [0.52, 0.5, 'precision'], [undefined, 0.5, 'skipped'], [7, 0.3, 'method']];
      for (const [user, ans, want] of cases) {
        const got = QT.coach.classify(user, ans);
        if (got !== want) fail(`coach: classify(${user}, ${ans}) = ${got}, expected ${want}`);
      }
      const saved = QT.store.exportJson();
      QT.store.reset();
      if (QT.coach.recommend()[0].kind !== 'start') fail('coach: a new user should be offered the diagnostic first');
      const early = QT.coach.allIds()[5];
      QT.coach.observe(early, false, 0);
      if (!QT.coach.recommend().some((r) => r.kind === 'missed' && r.href.endsWith(early.replace('.', '/')))) fail('coach: a skill missed on its first try should be recommended');
      const [a, b] = QT.coach.allIds().slice(0, 2);
      [1, 1, 1].forEach((x) => QT.coach.observe(a, !!x, 20000));
      [0, 0, 1].forEach((x) => QT.coach.observe(b, !!x, 20000));
      if (QT.coach.stat(a).status !== 'strong') fail(`coach: 3/3 should be strong, got ${QT.coach.stat(a).status}`);
      if (QT.coach.stat(b).status !== 'weak') fail(`coach: 1/3 should be weak, got ${QT.coach.stat(b).status}`);
      if (!(QT.coach.need(b) > QT.coach.need(a))) fail('coach: weak skill should be needed more than a strong one');
      // Elo: correct answers raise the estimate, misses lower it, and an untried skill sits at overall ability.
      if (!(QT.coach.prob(a) > 0.5 && QT.coach.prob(b) < QT.coach.prob(a))) fail(`coach: Elo estimates out of order (${QT.coach.prob(a)}, ${QT.coach.prob(b)})`);
      const untried = QT.coach.allIds()[40], E = QT.store.get().elo;
      if (Math.abs(QT.coach.prob(untried) - 1 / (1 + Math.exp(-E.theta))) > 1e-12) fail('coach: untried skill should predict from overall ability');
      // Migration: a pre-0.8 profile (no Elo state) is rebuilt from its answer history.
      const snap = JSON.parse(QT.store.exportJson());
      delete snap.elo;
      QT.store.importJson(JSON.stringify(snap));
      if (Math.abs(QT.coach.prob(a) - (1 / (1 + Math.exp(-(E.theta + E.b[a]))))) > 1e-9) fail('coach: Elo state not rebuilt identically from the log');
      for (let i = 0; i < 3; i++) QT.coach.logError('complement', b, 't');
      const recs = QT.coach.recommend();
      if (!recs.some((r) => r.kind === 'weak' && r.href === `#/drill/${b.replace('.', '/')}`)) fail('coach: weak skill not recommended for a drill');
      if (!recs.some((r) => r.kind === 'habit')) fail('coach: repeated slip not flagged as a habit');
      if (!QT.coach.focus().includes(b)) fail('coach: session focus should include the weak skill');
      const src = QT.coach.source(QT.coach.allIds(), { limit: 3 });
      let served = 0, item;
      while ((item = src())) { served++; if (!QT.coach.parse(item.skill) || !Number.isFinite(item.p.a)) fail('coach: bad session item'); item.record(true); }
      if (served !== 3) fail(`coach: session limit not respected (${served})`);
      QT.store.importJson(saved);
    }

    // Security: an imported progress file can't smuggle in script, and junk fields are dropped.
    {
      const saved = QT.store.exportJson();
      const evil = {
        topics: { dice: { attempts: '7', correct: 5, recent: [1, 0, 'x'] }, '<img src=x onerror=alert(1)>': {} },
        mistakes: [{ key: '<b onclick=x>k</b>', tag: '<script>alert(1)</script>t', p: { q: 'Q <img src=x onerror=alert(1)><sup>2</sup><script>alert(2)</script>', a: '0.5', sol: '<a href="javascript:alert(1)">s</a>' }, box: 99 }, 'not an object', { p: { a: 'NaN' } }],
        errors: [{ type: '<i>x</i>', skill: 'dice.1' }],
        estimate: { n: 'lots' },
        __proto__evil: 1, unknownField: '<script>',
      };
      QT.store.importJson(JSON.stringify(evil));
      const s = QT.store.get(), dump = JSON.stringify(s);
      if (/onerror|<script|javascript:|onclick/i.test(dump)) fail(`security: unsafe markup survived import: ${dump.match(/.{0,40}(onerror|<script|javascript:|onclick).{0,20}/i)[0]}`);
      if (s.topics.dice.attempts !== 7 || s.topics.dice.recent.join('') !== '101') fail('security: numeric fields not coerced');
      if (s.mistakes.length !== 1 || s.mistakes[0].p.a !== 0.5 || s.mistakes[0].box !== 3) fail(`security: mistakes not validated (${s.mistakes.length})`);
      if ('unknownField' in s || s.estimate.n !== 0) fail('security: unknown or invalid fields kept');
      QT.store.importJson(saved);
    }

    // Answer parsing.
    const parse = [['5/36', 5 / 36], ['13.9%', 0.139], ['1,250', 1250], ['-0.7', -0.7], ['.5', 0.5],
      ['0,5', 0.5], ['12,5', 12.5], ['1.250,5', 1250.5], ['1,250,000', 1250000], ['1,250.5', 1250.5],
      ['1 1/2', 1.5], ['-1 1/2', -1.5], ['1½', 1.5], ['½', 0.5], ['−2', -2], ['–0.3', -0.3], ['25 %', 0.25], ['  7 ', 7], ['2e-2', 0.02]];
    for (const [s, v] of parse) if (Math.abs(QT.parseAnswer(s) - v) > 1e-12) fail(`parse ${JSON.stringify(s)} = ${QT.parseAnswer(s)}, expected ${v}`);
    for (const s of ['abc', '', '5/0', '1/2/3', '--1', '0x10', '%', '.']) if (!Number.isNaN(QT.parseAnswer(s))) fail(`parse ${JSON.stringify(s)} should be unreadable, got ${QT.parseAnswer(s)}`);

    // Speed-trick drills: valid output, and the answer agrees with plainly evaluating the question.
    const evalPlain = (q) => {
      if (!/^[\d.,\s×÷+−²^]+$/.test(q)) return null; // only pure arithmetic questions
      const js = q.replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '**2').replace(/\^/g, '**');
      return Function(`"use strict"; return (${js});`)();
    };
    for (const t of QT.tricks || []) {
      for (let k = 0; k < 300; k++) {
        const p = t.gen();
        if (!selfCheck(p, `trick ${t.id}`)) break;
        const plain = evalPlain(p.q);
        if (plain !== null && Math.abs(plain - p.a) > 1e-9 * Math.max(1, Math.abs(plain))) { fail(`trick ${t.id}: "${p.q}" = ${plain}, drill says ${p.a}`); break; }
      }
      if (!t.body || !t.title || !t.group) fail(`trick ${t.id}: missing lesson text`);
    }

    // 80-in-8 options: one right answer, distinct labels, and the right answer equally likely in
    // each position (a biased shuffle would fail this; tolerance ≈ 5.5 standard deviations).
    if (QT.mental) {
      const pos = [0, 0, 0, 0];
      for (let k = 0; k < 4000; k++) {
        const g = QT.mental.gens[k % QT.mental.gens.length](), o = QT.mental.options(g.a);
        const right = o.map((x, i) => (Math.abs(x.v - g.a) < 1e-9 || (g.tol && Math.abs(x.v - g.a) <= g.tol) ? i : -1)).filter((i) => i >= 0);
        if (right.length !== 1 || new Set(o.map((x) => x.label)).size !== o.length || o.length < 3) { fail(`80-in-8 options for "${g.q}": ${o.map((x) => x.label)}`); break; }
        pos[right[0]] += o.length === 4 ? 1 : 0;
      }
      const n = pos.reduce((a, b) => a + b, 0);
      if (pos.some((x) => Math.abs(x - n / 4) > 5.5 * Math.sqrt(n * 0.25 * 0.75))) fail(`80-in-8: right answer positions not uniform ${pos}`);
    }

    // Interview plan: valid tasks for every firm and day, today's status, and schema validation.
    if (QT.plan) {
      const saved = QT.store.exportJson();
      QT.store.reset();
      const today = QT.dayKey(new Date()), inDays = (n) => QT.dayKey(new Date(Date.now() + n * 864e5));
      for (const firm of Object.keys(QT.firms).filter((k) => k !== 'common')) {
        const p = { firm, date: inDays(6), start: today, done: {} };
        for (let d = 0; d <= 6; d++) {
          const tasks = QT.plan.tasksFor(p, inDays(d), 6 - d, d);
          if (!tasks.length || tasks.some((t) => !t.id || !t.label || !/^#\//.test(t.href) || /undefined|NaN/.test(t.label + t.href)) || new Set(tasks.map((t) => t.id)).size !== tasks.length) { fail(`plan ${firm} day ${d}: bad tasks ${JSON.stringify(tasks.map((t) => t.label))}`); break; }
        }
      }
      QT.store.importJson(JSON.stringify({ plan: { firm: 'wincent', date: inDays(3), start: today, done: { [today]: ['mock', '<b>x</b>'], nope: ['a'] } } }));
      const st = QT.plan.todayStatus(), pl = QT.store.get().plan;
      if (!st || st.left !== 3 || st.tasks.length < 3 || Object.keys(pl.done).join() !== today || /</.test(pl.done[today][1])) fail(`plan: status or validation wrong ${JSON.stringify({ st, pl })}`);
      if (!QT.coach.recommend().some((r) => r.kind === 'plan' && r.href === '#/plan')) fail("plan: an active plan should be the coach's top recommendation");
      QT.store.importJson(JSON.stringify({ plan: { firm: 'Wincent!', date: 'soon' } }));
      if (QT.store.get().plan !== null) fail('plan: invalid plan should be dropped on import');
      QT.store.importJson(saved);
    }

    // Zetamac: default settings match arithmetic.zetamac.com, questions stay in range, and every
    // question type has a fast method that reaches the answer.
    if (QT.mental && QT.mental.zmQuestion) {
      const M = QT.mental, D = M.ZM_DEFAULT, seen = new Set();
      if (JSON.stringify([D.addA, D.addB, D.mulA, D.mulB, D.secs]) !== '[[2,100],[2,100],[2,12],[2,100],120]' || !(D.add && D.sub && D.mul && D.div)) fail('zetamac: defaults differ from Zetamac');
      const inR = (x, [lo, hi]) => Number.isInteger(x) && x >= lo && x <= hi;
      for (let k = 0; k < 4000; k++) {
        const g = M.zmQuestion(D), [x, y] = g.v, fw = QT.mentalTips.fastWay(g);
        seen.add(g.kind);
        const ok = { zAdd: inR(x, D.addA) && inR(y, D.addB) && g.a === x + y, zSub: inR(y, D.addA) && inR(x - y, D.addB) && g.a === x - y, zMul: inR(x, D.mulA) && inR(y, D.mulB) && g.a === x * y, zDiv: inR(y, D.mulA) && inR(x / y, D.mulB) && g.a === x / y }[g.kind];
        if (!ok || !fw || fw.value !== g.a || /undefined|NaN/.test(fw.steps) || !QT.mentalTips.KINDS[g.kind]) { fail(`zetamac: bad question ${JSON.stringify(g)} / ${fw && fw.value}`); break; }
      }
      if (seen.size !== 4) fail(`zetamac: saw ${seen.size} question types`);
      if (M.zmValid({ ...D, add: false, sub: false, mul: false, div: false }) || M.zmValid({ ...D, mulA: [0, 12] }) || M.zmValid({ ...D, addA: [50, 10] }) || !M.zmValid(D)) fail('zetamac: settings validation');
      if (M.genOfKind('zDiv').kind !== 'zDiv' || M.genOfKind('frac').kind !== 'frac') fail('zetamac: questions of a given type for speed reps');
    }

    // Speed reps: two slow or missed answers of a type schedule it once, due tomorrow.
    if (QT.mental && QT.mental.scheduleReps) {
      const saved = QT.store.exportJson();
      QT.store.reset();
      const mk = (kind, ok, ms) => ({ kind, ok, ms });
      const added = QT.mental.scheduleReps([mk('frac', false, 2000), mk('frac', true, 9000), mk('pct', true, 9000), mk('sq', true, 1000)], 6);
      const again = QT.mental.scheduleReps([mk('frac', false, 1000), mk('frac', false, 1000)], 6);
      const rv = QT.store.get().speedReview;
      if (added.join() !== 'frac' || again.length || rv.frac.box !== 0 || rv.frac.due <= Date.now() || QT.mental.dueReps().length) fail(`speed reps: scheduling ${JSON.stringify({ added, again, rv })}`);
      rv.frac.due = Date.now() - 1;
      if (QT.mental.dueReps().join() !== 'frac' || !QT.coach.recommend().some((r) => r.kind === 'speedRep' && r.href === '#/mental/rep/frac')) fail('speed reps: a due rep should be listed and recommended');
      QT.store.importJson(saved);
    }

    // Speed by question type, the coach's use of it, and the weekly summary.
    if (QT.mentalTips && QT.coach) {
      const t = QT.mentalTips.speedTable({ frac: { times: [9000, 11000, 8000, 10000], oks: [1, 0, 1, 1] }, pct: { times: [3000, 4000], oks: [1, 1] }, bogus: { times: [1], oks: [1] } });
      if (t.length !== 2 || t[0].kind !== 'frac' || t[0].median !== 10 || t[0].missRate !== 0.25) fail(`speed table: ${JSON.stringify(t)}`);
      const saved = QT.store.exportJson();
      QT.store.reset();
      const s = QT.store.get();
      s.speed = { frac: { times: Array(10).fill(9000), oks: Array(10).fill(1) } };
      s.figgie = { games: 4, total: -80, best: 5, wins: 0, history: [] };
      const recs = QT.coach.recommend();
      if (!recs.some((r) => r.kind === 'speedType' && r.href === '#/tricks/fraction-decimals')) fail('coach: slow fractions should point to the fractions guide');
      if (!recs.some((r) => r.kind === 'figgie')) fail('coach: losing at Figgie should be flagged');
      if (recs.some((r) => !r.title || !r.href || /undefined|NaN/.test(r.title + r.why + (r.voice || '')))) fail('coach: a recommendation is malformed');
      QT.store.importJson(saved);
    }
    if (QT.progress) {
      const now = Date.parse('2026-10-05T12:00:00'), DAY = 864e5;
      const log = [...Array(10)].map((_, i) => ({ t: now - 2 * DAY + i, ok: i < 8 ? 1 : 0 })).concat([...Array(4)].map((_, i) => ({ t: now - 9 * DAY + i, ok: i < 2 ? 1 : 0 })));
      const w = QT.progress.weekSummary({ log, days: ['2026-10-03', '2026-10-05', '2026-09-20'], daily: { '2026-10-04': { done: true }, '2026-09-01': { done: true } }, mental: { full: { runs: [{ date: '2026-10-04T10:00:00Z', correct: 60, wrong: 8 }, { date: '2026-08-01T10:00:00Z', correct: 70, wrong: 0 }] } }, figgie: { history: [{ date: '2026-10-03T10:00:00Z', pnl: 25 }] } }, now);
      if (w.answers !== 10 || w.answersPrev !== 4 || w.acc !== 80 || w.accPrev !== 50 || w.days !== 2 || w.dailies !== 1 || w.best80 !== 52 || w.figgiePnl !== 25) fail(`week summary: ${JSON.stringify(w)}`);
    }

    // Mental-maths review: every question type has a fast method whose own arithmetic reaches
    // the question's answer, and points to a guide that exists.
    if (QT.mentalTips && QT.mental) {
      const kinds = new Set();
      for (let k = 0; k < 6000; k++) {
        const g = QT.mental.gens[k % QT.mental.gens.length](), fw = QT.mentalTips.fastWay(g);
        kinds.add(g.kind);
        if (!fw) { fail(`mental tips: no fast method for ${g.kind}`); break; }
        if (Math.abs(fw.value - g.a) > 1e-9 + (g.tol || 0) || /undefined|NaN/.test(fw.steps) || !(QT.tricks || []).some((t) => t.id === fw.guide)) { fail(`mental tips ${g.kind} "${g.q}": method gives ${fw.value}, answer ${g.a} (${fw.name}, guide ${fw.guide})`); break; }
        if (!QT.mentalTips.KINDS[g.kind]) { fail(`mental tips: no label for ${g.kind}`); break; }
      }
      if (kinds.size !== 12) fail(`mental tips: saw ${kinds.size} question types, expected 12`);
      const html = QT.mental.review([{ ...QT.mental.gens[0](), ok: false, you: '<img src=x>', ms: 9000 }, { ...QT.mental.gens[6](), ok: true, you: '1', ms: 2000 }], 6);
      if (/<img/.test(html) || !/1 missed, 0 right but slower/.test(html)) fail('mental review: flagging or escaping wrong');
    }

    // A review that started before the state was reloaded (e.g. another tab saved) must not
    // remove the wrong card.
    if (QT.mistakes) {
      const saved = QT.store.exportJson();
      QT.store.reset();
      ['a', 'b', 'c'].forEach((x) => QT.mistakes.add('T', { q: `card ${x}`, a: 1, sol: 's' }));
      const stale = QT.mistakes.all()[0];
      QT.store.importJson(QT.store.exportJson()); // state replaced with fresh objects
      for (let i = 0; i < 4; i++) QT.mistakes.review(stale, true);
      const keys = QT.mistakes.all().map((m) => m.key).join(',');
      if (keys !== 'card b,card c') fail(`mistakes: stale review removed the wrong card (left: ${keys})`);
      QT.store.importJson(saved);
    }

    // Statistical helper: |observed − expected| within 5.5 binomial standard deviations.
    const nearRate = (hits, n, p) => Math.abs(hits - n * p) <= 5.5 * Math.sqrt(n * p * (1 - p));

    // Bet sizing: Kelly maximises expected log-growth; the bet mix is as designed.
    if (QT.kelly) {
      const K = QT.kelly;
      if (Math.abs(K.kellyF(0.6, 1) - 0.2) > 1e-12) fail('kelly: f*(0.6, evens) should be 0.2');
      let neg = 0;
      for (let k = 0; k < 4000; k++) {
        const { p, b } = K.makeBet(), f = K.kellyF(p, b);
        if (!(p >= 0.1 && p <= 0.9) || ![0.5, 1, 1.5, 2, 3, 4].includes(b)) { fail(`kelly: bad bet p=${p} b=${b}`); break; }
        if (f < 0) { neg++; continue; }
        if (f < 0.05 || f > 0.5) { fail(`kelly: stake ${f} out of range`); break; }
        const g = (x) => K.growth(x, p, b);
        if (!(g(f) >= g(f - 0.01) && g(f) >= g(f + 0.01) && g(f) > 0 && g(2 * f) < g(f) && Math.abs(g(0)) < 1e-15)) { fail(`kelly: f* not the growth maximum for p=${p} b=${b}`); break; }
      }
      if (!nearRate(neg, 4000, 0.25)) fail(`kelly: ${neg}/4000 negative-EV bets, expected ~25%`);
      const bets = [{ p: 0.6, b: 1 }, { p: 0.3, b: 4 }, { p: 0.4, b: 1 }];
      const eff1 = K.efficiency(bets.map((x) => ({ ...x, f: Math.max(0, K.kellyF(x.p, x.b)) })));
      if (Math.abs(eff1 - 1) > 1e-12 || K.efficiency(bets.map((x) => ({ ...x, f: 0 }))) !== 0) fail('kelly: efficiency should be 1 at Kelly and 0 when not betting');
      if (K.efficiency([{ p: 0.6, b: 1, f: 1 }]) !== -Infinity) fail('kelly: staking everything should score −∞');
    }

    // Figgie: deck layouts, Bayesian posterior (exact and calibrated), and full games with
    // bots that conserve cards and chips.
    if (QT.figgie) {
      const F = QT.figgie;
      if (F.CONFIGS.length !== 12) fail(`figgie: ${F.CONFIGS.length} layouts, expected 12`);
      for (const c of F.CONFIGS) {
        if (c.sizes.reduce((a, b) => a + b, 0) !== 40 || c.sizes[c.twelve] !== 12 || ![8, 10].includes(c.sizes[c.goal]) || F.SUITS[c.goal].red !== F.SUITS[c.twelve].red || c.goal === c.twelve) fail(`figgie: bad layout ${JSON.stringify(c)}`);
      }
      // Calibration: if the posterior is right, E[P(true goal)] = E[Σ P(s)²].
      const d = [];
      for (let k = 0; k < 3000; k++) {
        const g = F.newGame(), post = F.posterior(g.players[0].start);
        const tot = post.goal.reduce((a, b) => a + b, 0);
        if (Math.abs(tot - 1) > 1e-9) { fail(`figgie: posterior sums to ${tot}`); break; }
        d.push(post.goal[g.cfg.goal] - post.goal.reduce((a, b) => a + b * b, 0));
      }
      const mean = QT.m.mean(d), se = QT.m.sd(d) / Math.sqrt(d.length);
      if (Math.abs(mean) > 5 * se + 1e-9) fail(`figgie: posterior miscalibrated (${mean} ± ${se})`);
      // Holding 6 hearts makes hearts the likely 12-card suit, so diamonds the likely goal.
      const ph = F.posterior([1, 2, 6, 1]);
      if (ph.goal.indexOf(Math.max(...ph.goal)) !== 3) fail(`figgie: 6 hearts should point to diamonds (${ph.goal})`);
      // Bots in seats 1–3 and random actions in seat 0.
      let trades = 0;
      for (let game = 0; game < 20; game++) {
        const g = F.newGame();
        let seen = 0, broken = false;
        for (let step = 0; step < 600 && !broken; step++) {
          const i = step % 4;
          if (i) F.botAct(g, i);
          else {
            const s = Math.floor(Math.random() * 4), r = Math.random();
            if (r < 0.25) F.buy(g, 0, s);
            else if (r < 0.5) F.sell(g, 0, s);
            else F.post(g, 0, s, r < 0.75 ? 'bid' : 'ask', 1 + Math.floor(Math.random() * 25));
          }
          if (g.tape.length > seen) {
            seen = g.tape.length;
            if (g.book.some((b) => b.bid || b.ask)) { fail('figgie: orders survived a trade'); broken = true; }
          }
          const held = [0, 1, 2, 3].map((s) => g.players.reduce((a, p) => a + p.hand[s], 0));
          const chips = g.players.reduce((a, p) => a + p.chips, 0);
          if (held.some((h, s) => h !== g.cfg.sizes[s]) || chips !== 4 * (F.START_CHIPS - F.ANTE) || g.players.some((p) => p.chips < 0 || p.hand.some((h) => h < 0))) {
            fail(`figgie: cards or chips not conserved at step ${step}`);
            broken = true;
          }
        }
        trades += g.tape.length;
        const pay = F.payouts(g);
        if (Math.abs(pay.reduce((a, b) => a + b, 0) - F.POT) > 1e-9) fail(`figgie: payouts sum to ${pay.reduce((a, b) => a + b, 0)}`);
        if (broken) break;
      }
      if (trades < 200) fail(`figgie: bots barely trade (${trades} trades in 20 games)`);
    }

    // Daily challenge: the same questions for the same date, different ones on other dates,
    // and Math.random restored afterwards.
    if (QT.daily) {
      const D = QT.daily, orig = Math.random;
      const sig = (day) => D.questions(day).map((q) => `${q.t.id}|${q.p.q}|${q.p.a}`).join('\n');
      if (sig('2026-03-14') !== sig('2026-03-14')) fail('daily: same date gave different questions');
      if (sig('2026-03-14') === sig('2026-03-15')) fail('daily: consecutive dates gave identical questions');
      if (Math.random !== orig) fail('daily: Math.random not restored');
      if (D.dayNo('2026-01-01') !== 1 || D.dayNo('2026-12-31') !== 365) fail('daily: day numbering');
      for (let k = 0; k < 60; k++) {
        const day = `2026-${String(1 + (k % 12)).padStart(2, '0')}-${String(1 + (k % 28)).padStart(2, '0')}`, qs = D.questions(day);
        if (qs.length !== 5 || new Set(qs.map((q) => q.t.id)).size !== 5) { fail(`daily ${day}: not 5 distinct topics`); break; }
        if (!qs.every((q, i) => selfCheck(q.p, `daily ${day} Q${i + 1}`))) break;
      }
      const u = D.mulberry32(1), xs = Array.from({ length: 20000 }, () => u());
      if (!nearRate(xs.filter((x) => x < 0.5).length, 20000, 0.5) || xs.some((x) => x < 0 || x >= 1)) fail('daily: seeded generator not uniform on [0, 1)');
    }

    // Make me a market: the interviewer's fills point the right way 87.5% of the time.
    if (QT.quote) {
      const Q = QT.quote;
      let right = 0;
      for (let k = 0; k < 20000; k++) right += Q.interviewerSide(90, 110, k % 2 ? 150 : 50) === (k % 2 ? 'buy' : 'sell') ? 1 : 0;
      if (!nearRate(right, 20000, 0.875)) fail(`quote: informative fills ${right}/20000, expected 87.5%`);
      if (Math.abs(Q.tradePnl({ side: 'buy', px: 110 }, 100) - 10) > 1e-12 || Math.abs(Q.tradePnl({ side: 'sell', px: 90 }, 100) - 10) > 1e-12) fail('quote: trade P&L sign');
      if (Q.checkQuote(10, 15) !== null || !Q.checkQuote(10, 25) || !Q.checkQuote(10, 10) || !Q.checkQuote(0, 5) || !Q.checkQuote(NaN, 5)) fail('quote: market validation');
      if (!Q.movedWithFlow({ bid: 10, ask: 14, side: 'buy' }, { bid: 12, ask: 16 }) || Q.movedWithFlow({ bid: 10, ask: 14, side: 'sell' }, { bid: 12, ask: 16 })) fail('quote: moved-with-flow check');
    }

    // Online tests: generated rounds are well formed.
    if (QT.oa) {
      for (let k = 0; k < 500; k++) {
        const n = 3 + (k % 10), d = QT.oa.spanDigits(n);
        if (d.length !== n || d.some((x, i) => x === d[i - 1] || x < 0 || x > 9)) { fail(`oa: bad digit span ${d}`); break; }
        const r = QT.oa.totalRound(8);
        let run = 0;
        const partial = r.nums.map((x) => (run += x));
        if (r.nums.length !== 8 || run !== r.sum || partial.some((x) => x <= 0) || r.nums.some((x) => !Number.isInteger(x) || x === 0)) { fail(`oa: bad running total ${r.nums}`); break; }
      }
    }

    // Think aloud: pace and filler counting.
    if (QT.talk) {
      const st = QT.talk.speechStats('Um so I think uh the answer is like 5', 60);
      if (st.words !== 10 || st.fillers !== 3 || st.wpm !== 10) fail(`talk: speech stats ${JSON.stringify(st)}`);
    }

    // Charts: valid output for gaps, a single point and flat data.
    if (QT.chart) {
      for (const vals of [[1, 2, 3], [null, 4, null, 5], [7], [3, 3, 3], [-2, 0, 2]]) {
        const svg = QT.chart.line([{ name: 'x', values: vals }], { label: 'test' });
        if (/NaN|undefined|Infinity/.test(svg) || !/<path class="ch-s0" d="M/.test(svg)) { fail(`chart: bad output for ${JSON.stringify(vals)}`); break; }
      }
      if (QT.chart.line([{ name: 'x', values: [] }]) !== '') fail('chart: empty data should draw nothing');
    }
    if (QT.progress) {
      if (QT.progress.longestStreak(['2026-01-01', '2026-01-02', '2026-01-04', '2026-01-05', '2026-01-06']) !== 3) fail('progress: longest streak');
      const b = QT.progress.blocks(Array.from({ length: 45 }, (_, i) => ({ ok: i % 2, ms: 1000 * (i + 1) })));
      if (b.length !== 2 || b[0].acc !== 50) fail(`progress: answer blocks ${JSON.stringify(b)}`);
    }

    // New saved fields are validated like the rest.
    {
      const saved = QT.store.exportJson();
      QT.store.importJson(JSON.stringify({
        daily: { '2026-01-02': { r: [1, 0, 'x', 1, 1, 1, 1], ms: '9', done: 1 }, 'not-a-date': { r: [1] }, '<img>': {} },
        figgie: { games: '3', history: [{ pnl: 'lots', date: '<b>x</b>' }] },
        oa: { seq: { best: '7', runs: [{ score: 5 }] }, hack: { best: 1 } },
        kelly: { best: 'NaN' }, talk: { sessions: 2, history: [{ id: '<script>', score: 4 }] },
      }));
      const s = QT.store.get();
      if (Object.keys(s.daily).join() !== '2026-01-02' || s.daily['2026-01-02'].r.length !== 5 || s.daily['2026-01-02'].ms !== 9) fail(`import: daily not validated ${JSON.stringify(s.daily)}`);
      if (s.figgie.games !== 3 || s.figgie.history[0].pnl !== 0 || /</.test(s.figgie.history[0].date)) fail('import: figgie not validated');
      if (s.oa.seq.best !== 7 || 'hack' in s.oa || s.kelly.best !== 0 || /</.test(s.talk.history[0].id)) fail('import: oa/kelly/talk not validated');
      QT.store.importJson(saved);
    }

    // Formula cards: unique ids, no junk, and the spaced schedule (1, 3, 7, 21, 60 days; a miss resets).
    if (QT.flashcards) {
      const F = QT.flashcards, ids = F.CARDS.map((c) => c[0]);
      if (new Set(ids).size !== ids.length || F.CARDS.some((c) => c.length !== 4 || !c[2] || !c[3] || /undefined|NaN/.test(c.join(' ')))) fail('flashcards: duplicate or malformed card');
      const saved = QT.store.exportJson();
      QT.store.reset();
      const t0 = Date.parse('2026-10-06T12:00:00Z'), days = (c) => Math.round((c.due - t0) / 864e5);
      const gaps = [1, 2, 3, 4, 5, 6].map(() => days(F.grade('p-die', true, t0)));
      const miss = F.grade('p-die', false, t0);
      if (gaps.join() !== '1,3,7,21,60,60' || miss.box !== 0 || days(miss) !== 1) fail(`flashcards: schedule ${gaps} / miss ${JSON.stringify(miss)}`);
      if (F.newIds().length !== F.CARDS.length - 1 || F.dueIds(t0 + 2 * 864e5).join() !== 'p-die') fail('flashcards: due and new lists');
      QT.store.importJson(saved);
    }

    // Zetamac challenges: the same code gives the same questions; different codes differ.
    if (QT.mental && QT.mental.seededList && QT.daily) {
      const sig = (seed) => QT.mental.seededList(seed, QT.mental.ZM_DEFAULT).slice(0, 40).map((q) => q.q).join('|');
      if (sig('abc12345') !== sig('abc12345') || sig('abc12345') === sig('abc12346')) fail('zetamac challenge: question lists not reproducible');
    }

    // Keypad: phone order (1 2 3 on top), every row fills the grid, and only the requested extras appear.
    if (QT.keypad && QT.keypad.layout) {
      for (const [keys, enter] of [['', false], ['.', true], ['.-', true], ['.-/', true], ['.-/%', true]]) {
        const { cols, rows } = QT.keypad.layout(keys, enter), flat = rows.flat().map(([k]) => k).filter(Boolean);
        if (rows[0].slice(0, 3).map(([k]) => k).join('') !== '123') fail(`keypad ${keys}: top row is not 1 2 3`);
        if (rows.some((r) => r.reduce((n, [, span]) => n + span, 0) !== cols)) fail(`keypad ${keys}: a row does not fill ${cols} columns`);
        const extras = flat.filter((k) => !/^\d$/.test(k) && k !== 'back' && k !== 'enter').sort().join('');
        if (extras !== [...keys].sort().join('') || flat.includes('enter') !== enter || !flat.includes('back')) fail(`keypad ${keys}: wrong keys ${flat.join(' ')}`);
      }
    }

    // Hints: every part of every interview question has at least two, every hint list belongs to a
    // real question part, and no hint gives away the answer.
    if (QT.bankHints) {
      const plainText = (h) => String(h).replace(/<[^>]+>/g, '');
      let parts = 0, hints = 0;
      for (const b of QT.bank) {
        const lists = b.parts ? b.parts.map((x) => x.hints) : [b.open.hints];
        lists.forEach((list, i) => {
          parts++;
          hints += (list || []).length;
          if (!list || list.length < 2 || list.some((h) => !plainText(h).trim())) fail(`hints: ${b.id} part ${i} has ${list ? list.length : 0}`);
          const a = b.parts && b.parts[i].a;
          if (Number.isFinite(a) && (Math.abs(a) >= 10 || !Number.isInteger(a))) {
            const shown = [QT.fmtNum(a), a.toFixed(2), String(a)].filter((t) => t.replace(/\D/g, '').length >= 2);
            const leak = list.find((h) => shown.some((t) => new RegExp(`(^|[^0-9.])${t.replace(/[.-]/g, '\\$&')}([^0-9]|$)`).test(plainText(h))));
            if (leak) fail(`hints: ${b.id} part ${i} gives away ${a}: "${plainText(leak)}"`);
          }
        });
      }
      for (const [id, lists] of Object.entries(QT.bankHints)) {
        const b = QT.bankById(id);
        if (!b || lists.length !== (b.parts ? b.parts.length : 1)) fail(`hints: ${id} doesn't match a question's parts`);
      }
      if (hints / parts < 3) fail(`hints: only ${(hints / parts).toFixed(1)} per part on average`);
    }

    // Worked solutions: every numeric part has a structured one (key idea, at least two steps),
    // nothing is keyed to a part that doesn't exist, and each solution states its part's answer.
    if (QT.bankSolutions) {
      const numbersIn = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/\u2212/g, '-').replace(/\$/g, '').replace(/(?<=\d),(?=\d{3})/g, '').replace(/½/g, '1/2').replace(/¼/g, '1/4').replace(/¾/g, '3/4')
        .match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g)?.map((t) => (t.includes('/') ? t.split('/').reduce((a, b) => a / b) : +t)) || [];
      for (const b of QT.bank) {
        (b.parts || []).forEach((p, i) => {
          const s = QT.bankSolutions[b.id]?.[i];
          if (!s || !s[0] || !Array.isArray(s[1]) || s[1].length < 1) return fail(`solutions: ${b.id} part ${i} has no structured solution`);
          const close = Math.max(Math.abs(p.a) * 0.006, (p.tol && p.tol.abs) || 0, 5e-4);
          if (!numbersIn(p.sol).some((x) => Math.abs(x - p.a) <= close)) fail(`solutions: ${b.id} part ${i} never states its answer ${p.a}`);
        });
      }
      for (const [id, list] of Object.entries(QT.bankSolutions)) {
        const b = QT.bankById(id);
        if (!b || !b.parts || list.length !== b.parts.length) fail(`solutions: ${id} doesn't match a question's parts`);
      }
    }

    // Automatic backups: anything that replaces progress keeps a copy that can be restored.
    // (Needs real storage, so it runs in the browser checks page, not the Node stub.)
    const persists = (() => { try { localStorage.setItem('theo-probe', '1'); const ok = localStorage.getItem('theo-probe') === '1'; localStorage.removeItem('theo-probe'); return ok; } catch { return false; } })();
    if (persists && QT.store.backups) {
      const saved = QT.store.exportJson(), savedBackups = localStorage.getItem('theo-backups');
      QT.store.reset();
      QT.store.recordAttempt('dice', true);
      QT.store.reset('test reset');
      const top = QT.store.backups()[0];
      if (!top || top.reason !== 'test reset' || top.topics !== 1) fail(`backups: reset did not keep a copy (${JSON.stringify(top)})`);
      else {
        QT.store.recordAttempt('cards', false); // something to lose, so restoring backs it up first
        QT.store.restoreBackup(top.t);
        if (!QT.store.get().topics.dice) fail('backups: restoring did not bring progress back');
        if (QT.store.backups()[0].reason !== 'before restoring a backup') fail('backups: restoring should back up first');
      }
      QT.store.importJson(saved);
      if (savedBackups === null) localStorage.removeItem('theo-backups'); else localStorage.setItem('theo-backups', savedBackups);
    }

    // Backup reminder: with a few days of progress and no copy outside the browser, the coach
    // suggests one; exporting clears it for a week.
    {
      const saved = QT.store.exportJson();
      QT.store.reset();
      QT.store.get().days.push('2026-01-01', '2026-01-02', '2026-01-03');
      const has = () => QT.coach.recommend().some((r) => r.kind === 'backup' && r.href === '#/more');
      if (QT.backupFile?.status() !== 'on' && !has()) fail('backup reminder: not shown with 3 days of progress and no export');
      QT.store.markExported();
      if (has()) fail('backup reminder: still shown right after an export');
      QT.store.importJson(saved);
    }

    // Single-operation Zetamac: its bests survive a save and reload (the schema keeps them).
    {
      const saved = QT.store.exportJson(), snap = JSON.parse(saved);
      snap.mental = { ...(snap.mental || {}), zmMul: { best: 31, runs: [{ date: '2026-10-19', correct: 31, wrong: 0 }] }, zmBogus: { best: 9, runs: [] } };
      QT.store.importJson(JSON.stringify(snap));
      const m = QT.store.get().mental;
      if (m.zmMul?.best !== 31) fail('zetamac one-op: best not kept after reload');
      if (m.zmBogus) fail('zetamac one-op: unknown keys should still be dropped');
      QT.store.importJson(saved);
    }

    // Interview-sized answers: the quick method each worked solution teaches must be marked right.
    {
      const accepts = [['flow-poker', 0, 0.36, 'rule of 4'], ['cit-coin-ranges', 0, 0.95, '±2σ'], ['cl-birthday', 1, 0.5, 'e^(−253/365)'],
        ['drw-bottom-card', 0, 52 * (Math.log(51) + 0.577), 'H ≈ ln n + γ'], ['fr-arc-length', 0, 82, '81 + corrections'],
        ['imc-spaghetti', 0, 0.5 * Math.log(100) + Math.log(2) + 0.2886, 'log approximation'], ['wc-kelly-coin', 1, 0.6 * 0.18 - 0.4 * 0.22, 'ln(1 + x) ≈ x − x²/2'],
        ['js-odd-sum-d12', 1, Math.exp(0.4) / 12, '(13/12)^5 ≈ e^0.4'], ['cl-100-prisoners', 0, 1 - Math.log(2), '1 − ln 2'], ['dv-ten-cards', 1, Math.sqrt(140) * Math.sqrt(2 / Math.PI), 'normal approximation']];
      for (const [id, i, v, how] of accepts) {
        const p = QT.bankById(id)?.parts?.[i];
        if (!p || !QT.isCorrect(v, p.a, p.tol)) fail(`interview answer: ${id} part ${i} rejects the ${how} answer ${v}`);
      }
    }

    // Handbook: the course is complete and well formed. Numeric answers are cross-checked in Python.
    if (QT.handbook) {
      const { PARTS, CHAPTERS, ROUTES, checksOf, homeworkOf } = QT.handbook, listed = PARTS.flatMap((p) => p.chapters);
      const TOOLS = ['counting', 'dice', 'bayes', 'lln', 'sqrtn', 'dist', 'pattern', 'markov', 'walk', 'reroll', 'area', ...Object.keys(QT.hbWidgets || {})];
      const junk = (t) => /undefined|NaN/.test(t);
      if (new Set(listed).size !== listed.length) fail('handbook: a chapter is listed twice');
      let mcqs = 0, longest = 0, shortest = 0, figs = 0;
      listed.forEach((id, at) => {
        const ch = CHAPTERS[id];
        if (!ch) return fail(`handbook: ${id} is listed but not defined`);
        if (ch.planned) fail(`handbook: ${id} is still planned`);
        for (const [l, h] of ch.practice || []) {
          if (!l || !/^#\//.test(h)) fail(`handbook: ${id} practice link ${h}`);
          const [, kind, target] = h.match(/^#\/([a-z]+)\/([^/]+)/) || [];
          if (kind === 'iq' && !QT.bank.some((b) => b.id === target)) fail(`handbook: ${id} links to a missing question ${target}`);
          if (kind === 'topic' && !QT.topicById(target)) fail(`handbook: ${id} links to a missing topic ${target}`);
        }
        if (!ch.practice?.length || !ch.goals?.length || !ch.takeaways?.length || !ch.sections?.length || !ch.why || !ch.explain?.a) fail(`handbook: ${id} is missing a part`);
        (ch.prereq || []).forEach((p) => { if (!(listed.indexOf(p) >= 0 && listed.indexOf(p) < at)) fail(`handbook: ${id} builds on ${p}, which comes later`); });
        const checks = checksOf(ch), hw = homeworkOf(ch), keys = checks.map((x) => x.key);
        if (new Set(keys).size !== keys.length || keys.some((k) => !/^[a-z0-9-]{1,12}$/.test(k))) fail(`handbook: ${id} check keys ${keys}`);
        if (checks.length < 4) fail(`handbook: ${id} has only ${checks.length} checks`);
        if (hw.length < 6 || hw.filter((h) => ['core', 'interview'].includes(h.c.lvl)).length < 4) fail(`handbook: ${id} needs more homework`);
        for (const { c, key } of checks) {
          if (c.opts) {
            mcqs++;
            const text = c.opts.map((o) => (Array.isArray(o) ? o[0] : o));
            if (text.length < 3 || !c.sol) fail(`handbook: ${id} concept check ${key} incomplete`);
            if (text[0].length > Math.max(...text.slice(1).map((t) => t.length))) longest++;
            if (text[0].length < Math.min(...text.slice(1).map((t) => t.length))) shortest++;
          } else if (!c.q || !c.sol || !Number.isFinite(c.a)) fail(`handbook: ${id} check ${key} incomplete`);
          if (junk(c.q + c.sol + (c.hint || ''))) fail(`handbook: ${id} check ${key} shows junk`);
        }
        for (const { c, key } of hw) {
          if (!c.q || !c.sol || !['core', 'interview', 'stretch', 'lab'].includes(c.lvl)) fail(`handbook: ${id} homework ${key} incomplete`);
          if (junk(c.q + c.sol + (c.hint || ''))) fail(`handbook: ${id} homework ${key} shows junk`);
        }
        for (const s of ch.sections) for (const b of s.blocks) {
          if (b.fig) {
            figs++;
            if (!b.alt || !QT.hbFig.kinds.includes(b.fig)) fail(`handbook: ${id} figure ${b.fig} needs alt text`);
            if (/undefined|NaN/.test(QT.hbFig(b))) fail(`handbook: ${id} figure ${b.alt} draws junk`);
          }
          if (b.widget && !TOOLS.includes(b.widget)) fail(`handbook: ${id} uses an unknown tool ${b.widget}`);
          if (b.worked && !(b.q && b.steps?.length > 1)) fail(`handbook: ${id} worked example incomplete`);
          if (typeof b === 'string' && /undefined|NaN/.test(b)) fail(`handbook: ${id} text shows junk`);
        }
      });
      for (const id of Object.keys(CHAPTERS)) if (!listed.includes(id)) fail(`handbook: ${id} is defined but not listed`);
      if (ROUTES.some((r) => r.chapters.some((id) => !CHAPTERS[id]))) fail('handbook: a route names a missing chapter');
      // As with the quizzes, the right answer mustn't give itself away by being the longest.
      if (longest / mcqs > 0.33 || shortest / mcqs > 0.33) fail(`handbook: the right answer is the longest in ${longest}, and the shortest in ${shortest}, of ${mcqs} concept checks`);
      if (figs < 60) fail(`handbook: only ${figs} figures`);
      const saved = QT.store.exportJson(), snap = JSON.parse(saved);
      snap.handbook = { arith: { c: { 0: 1, 1: 0, 99: 1, a1: 1, 'BAD KEY': 1 }, h: { h0: 2, h1: 9, 'BAD KEY': 1 }, note: 'x'.repeat(3000), rv: { due: 5, st: 99 }, done: false }, counting: { c: {}, rv: 'junk' }, 'BAD KEY': { c: {}, done: true } };
      snap.hbExams = { all: { best: 7, last: 0.5, n: 2, at: 1 }, 'BAD KEY': { best: 1 } };
      QT.store.importJson(JSON.stringify(snap));
      const h = QT.store.get().handbook;
      if (h.arith?.c?.[0] !== 1 || h.arith.c[1] !== 0 || h['BAD KEY'] || h.arith.c[99] !== 1 || h.arith.c.a1 !== 1 || h.arith.c['BAD KEY']) fail(`handbook: progress not sanitised as expected ${JSON.stringify(h)}`);
      if (h.arith.h.h0 !== 2 || h.arith.h.h1 !== 2 || h.arith.h['BAD KEY'] || h.arith.note.length !== 2000 || h.arith.rv.st !== 3 || h.counting.rv) fail(`handbook: homework and reviews not sanitised as expected ${JSON.stringify(h.arith)}`);
      const ex = QT.store.get().hbExams;
      if (ex.all?.best !== 1 || ex['BAD KEY']) fail(`handbook: exams not sanitised as expected ${JSON.stringify(ex)}`);
      QT.store.importJson(saved);
    }

    // Phone-screen mock: market scenarios have the fair values their explanations quote, quotes
    // are graded on the right numbers, trader arithmetic accepts its own answer (with or without
    // a % sign), and stories and runs survive export and import, sanitised.
    if (QT.screen) {
      const S = QT.screen, EXPECT = { 'two-dice': [7, 4.5], 'ten-flips': [5, 7], 'max-dice': [161 / 36, 31 / 6], 'three-dice': [10.5, 7.5], 'three-cards': [21, 13 + 702 / 51], product: [12.25, 21] };
      for (const sc of S.SCENARIOS) {
        const a = S.stats(sc.before()), b = S.stats(sc.after()), [fa, fb] = EXPECT[sc.id] || [];
        const mass = (l) => l.reduce((t, [, p]) => t + p, 0);
        if (Math.abs(mass(sc.before()) - 1) > 1e-9 || Math.abs(mass(sc.after()) - 1) > 1e-9) fail(`screen: ${sc.id} probabilities don't add to 1`);
        if (!(Math.abs(a.fair - fa) < 1e-9 && Math.abs(b.fair - fb) < 1e-9)) fail(`screen: ${sc.id} fair values ${a.fair}, ${b.fair}`);
        if (!(a.sd > 0 && b.sd > 0)) fail(`screen: ${sc.id} SD`);
      }
      const g = S.gradeQuote(6.5, 7.5, { fair: 7, sd: 2.4 }), wide = S.gradeQuote(2, 12, { fair: 7, sd: 2.4 }), off = S.gradeQuote(8, 9, { fair: 7, sd: 2.4 });
      if (!g.centred || !g.tight || wide.tight || off.centred) fail('screen: quote grading');
      if (S.tradePnl('buy', 7.5, 4.5) !== 3 || S.tradePnl('sell', 6.5, 4.5) !== -2) fail('screen: trade P&L sign');
      for (let i = 0; i < 300; i++) {
        const gen = S.traderGens[i % S.traderGens.length](), ok = gen.ok ? gen.ok(gen.a) : QT.isCorrect(gen.a, gen.a, gen.tol);
        if (!Number.isFinite(gen.a) || !ok || /undefined|NaN/.test(gen.q + gen.sol)) fail(`screen: trader question ${gen.q} → ${gen.a}`);
        if (gen.ok && !gen.ok(gen.a / 100)) fail(`screen: % answer typed with a % sign is rejected (${gen.q})`);
      }
      if (S.probPick('citadel', 4).length !== 4) fail('screen: probability part needs 4 questions');
      if (!QT.stories || QT.stories.PROMPTS.some((p) => !p.q || !p.fields.length || !p.tip) || !QT.stories.PROMPTS.some((p) => p.star)) fail('stories: prompts');
      const saved = QT.store.exportJson(), snap = JSON.parse(saved);
      snap.stories = { intro: { f: ['I study <b>maths</b>', 7, null], t: 5 }, 'BAD KEY!': { f: ['x'] } };
      snap.screen = { runs: [{ date: '2026-11-02T10:00:00Z', firm: 'citadel', secs: 2700, mental: [8, 10], prob: ['3', 4], mm: [7], self: 'x' }, 'junk'] };
      QT.store.importJson(JSON.stringify(snap));
      const st = QT.store.get();
      if (st.stories.intro?.f?.[0] !== 'I study <b>maths</b>' || st.stories.intro.f[1] !== '7' || st.stories['BAD KEY!']) fail(`stories: not sanitised as expected ${JSON.stringify(st.stories)}`);
      if (!/&lt;b&gt;/.test(QT.stories.get('intro'))) fail('stories: notes are not escaped when shown');
      const r = st.screen.runs[0];
      if (st.screen.runs.length !== 2 || r.prob[0] !== 3 || r.mm[1] !== 0 || r.self[0] !== 0 || r.firm !== 'citadel') fail(`screen: runs not sanitised as expected ${JSON.stringify(st.screen)}`);
      QT.store.importJson(saved);
    }

    // Weak spots: every area points at real topics, chapters and question categories; every
    // numeric question category belongs to an area; an untried area sits at 50%; wrong answers
    // pull an area down; every area serves a valid question at every level; data is sanitised.
    if (QT.adapt) {
      const A = QT.adapt, cats = new Set(A.AREAS.flatMap((a) => a.cats));
      for (const a of A.AREAS) {
        a.topics.forEach((t) => { if (!QT.topicById(t)) fail(`weak spots: ${a.id} topic ${t}`); });
        a.hb.forEach((h) => { if (!QT.handbook?.CHAPTERS[h]) fail(`weak spots: ${a.id} chapter ${h}`); });
        a.cats.forEach((c) => { if (!QT.bank.some((b) => b.cat === c)) fail(`weak spots: ${a.id} category ${c} has no questions`); });
      }
      for (const b of QT.bank) if (b.parts && !cats.has(b.cat)) fail(`weak spots: category ${b.cat} (${b.id}) isn't in any area`);
      const saved = QT.store.exportJson();
      QT.store.reset();
      const e0 = A.estimate(A.AREAS.find((a) => a.id === 'prob'));
      if (Math.abs(e0.m - 0.5) > 1e-9 || e0.status !== 'untested') fail(`weak spots: blank estimate ${JSON.stringify(e0)}`);
      for (const a of A.AREAS) for (const L of [0, 1, 2]) {
        const it = A.item(a, L);
        if (!it) { fail(`weak spots: ${a.id} has no question at level ${L}`); continue; }
        if (!it.mm && (!it.p || !Number.isFinite(+it.p.a) || !it.p.q || /undefined|NaN/.test(it.p.q + (it.p.sol || '')))) fail(`weak spots: ${a.id} level ${L} served ${JSON.stringify(it.p)}`);
      }
      const probQs = QT.bank.filter((b) => b.parts && b.cat === 'Probability').slice(0, 6);
      probQs.forEach((b) => QT.ui.recordBank(b.id, 0, false, 0));
      const e1 = A.estimate(A.AREAS.find((a) => a.id === 'prob'));
      if (!(e1.m < 0.3 && e1.status === 'weak' && e1.from.includes('interview questions'))) fail(`weak spots: wrong answers didn't count ${JSON.stringify(e1)}`);
      if (A.ranked()[0].A.id !== 'prob') fail(`weak spots: the weakest area isn't ranked first (${A.ranked()[0].A.id})`);
      const snap = JSON.parse(QT.store.exportJson());
      snap.adapt = { r: { prob: [1, 0, '0.5', 7, -2], 'BAD!': [1] }, sessions: '3', log: [{ date: '2026-11-02T10:00:00Z', n: 12, right: 8 }, 'x'] };
      QT.store.importJson(JSON.stringify(snap));
      const ad = QT.store.get().adapt;
      if (JSON.stringify(ad.r.prob) !== '[1,0,0.5,1,0]' || ad.r['BAD!'] || ad.sessions !== 3 || ad.log.length !== 2 || ad.log[0].right !== 8) fail(`weak spots: not sanitised as expected ${JSON.stringify(ad)}`);
      QT.store.importJson(saved);
    }

    // Flow training: each example is its own kind of sum; for random sums of every kind the worked
    // steps are true equations ending in the answer; the pace staircase moves the right way; the
    // summary splits automatic from thinking mode; saved data is sanitised.
    if (QT.flow) {
      const F = QT.flow;
      if (F.ORDER.length !== Object.keys(F.PATTERNS).length) fail('flow: ORDER and PATTERNS differ');
      for (const k of F.ORDER) {
        const P = F.PATTERNS[k], [op, x, y] = P.eg;
        if (F.classify(op, x, y) !== k) fail(`flow ${k}: its example ${x} ${op} ${y} is a ${F.classify(op, x, y)}`);
        for (let i = 0; i < 300; i++) {
          const q = F.question(null, k);
          if (q.kind !== k || F.classify(q.op, q.x, q.y) !== k || q.a !== (q.op === '+' ? q.x + q.y : q.x - q.y) || q.a < 0) { fail(`flow ${k}: question ${q.q} = ${q.a} is wrong`); break; }
          const steps = P.steps(q.x, q.y), nums = steps.match(/\d+/g).map(Number);
          if (nums[nums.length - 1] !== q.a || /NaN|undefined|\+ 0 |− 0 | 0 \+ | is 0,/.test(steps)) { fail(`flow ${k}: steps for ${q.q} = ${q.a} are "${steps}"`); break; }
          for (const [, a, o, b, c] of steps.matchAll(/(\d+) ([+−]) (\d+) = (\d+)/g)) {
            if ((o === '+' ? +a + +b : +a - +b) !== +c) { fail(`flow ${k}: "${a} ${o} ${b} = ${c}" in the steps for ${q.q}`); break; }
          }
        }
      }
      if (F.classify('+', 47, 23) !== 'add-carry' || !F.PATTERNS['add-carry'].steps(47, 23).endsWith('= 70')) fail('flow: a carry that lands on a ten');
      if (F.classify('+', 100, 45) !== 'add-easy' || F.classify('-', 150, 100) !== 'sub-easy' || F.classify('-', 145, 37) !== 'sub-borrow') fail('flow: classify edge cases');
      for (let i = 0; i < 2000; i++) { const q = F.question(); if (!F.ORDER.includes(q.kind)) { fail(`flow: unclassified ${q.q}`); break; } }
      let st = { pace: 2000, streak: 0 };
      st = F.step(st.pace, true, st.streak); st = F.step(st.pace, true, st.streak);
      if (st.pace !== 2000 || st.streak !== 2) fail('flow: two on the beat should not change the pace');
      st = F.step(st.pace, true, st.streak);
      if (!(st.pace < 2000) || st.streak !== 0) fail('flow: three on the beat should quicken the pace');
      const quick = st.pace;
      st = F.step(st.pace, false, 2);
      if (!(st.pace > quick) || st.streak !== 0) fail('flow: off the beat should ease the pace');
      let lo = 600;
      for (let i = 0; i < 50; i++) lo = F.step(lo, true, 2).pace;
      if (lo < 500) fail('flow: pace went below its floor');
      const sm = F.summary([['+', 2, 3, 500], ['+', 2, 3, 900], ['-', 74, 39, 2500], ['-', 74, 39, 3000], ['-', 74, 39, 2600], ['-', 74, 39, 2700], ['-', 74, 39, 2800]]);
      const sr = sm.kinds.find((k) => k.kind === 'sub-round');
      if (sm.n !== 7 || Math.abs(sm.auto - 2 / 7) > 1e-9 || Math.abs(sm.think - 5 / 7) > 1e-9 || sr.n !== 5 || sr.median !== 2700 || F.slowest(sm).kind !== 'sub-round') fail(`flow: summary ${JSON.stringify(sm).slice(0, 200)}`);
      const saved = QT.store.exportJson(), snap = JSON.parse(saved);
      const game = [{ ok: true, kind: 'zAdd', v: [2, 3], ms: 800 }, ...Array.from({ length: 5 }, () => ({ ok: true, kind: 'zSub', v: [74, 39], ms: 2600 })), { ok: true, kind: 'zMul', v: [3, 4], ms: 900 }];
      QT.store.get().flow.log.length = 0; // restored from `saved` below
      F.recordZetamac(game);
      const card = F.resultCard(game);
      if (!/17% automatic/.test(card) || !card.includes('#/mental/flow/method/sub-round')) fail(`flow: result card ${card.slice(0, 200)}`);
      snap.flow = { log: [['+', 2, 3, 900.4], ['*', 1, 2, 3], ['-', 3, 5, 100], ['-', 9, 4, 99999], 'x'], rhythm: [{ date: '2026-11-03T10:00:00Z', pace: 1200, start: 2000, fastest: 1100, n: 60, onBeat: 48, skipped: 2 }], method: { 'sub-round': { runs: 2, ms: 1500 }, 'bad-kind': { runs: 1 } } };
      QT.store.importJson(JSON.stringify(snap));
      const fl = QT.store.get().flow;
      if (JSON.stringify(fl.log) !== '[["+",2,3,900],["-",9,4,60000]]' || fl.rhythm[0].pace !== 1200 || fl.method['sub-round'].runs !== 2 || fl.method['bad-kind']) fail(`flow: not sanitised as expected ${JSON.stringify(fl)}`);
      QT.store.importJson(saved);
    }

    // Citadel SSE prep: the expression evaluator rejects anything that isn't arithmetic; the answer
    // checker reads every format on real questions; the importer parses all the content and catches
    // bad input; the generated file matches the content; mastery and saved attempts behave.
    if (QT.sse) {
      const S = QT.sse, near = (a, b) => Math.abs(a - b) < 1e-9, q = (id) => QT.sseContent.find((x) => x.id === id);
      for (const [s, v] of [['1+2*3', 7], ['(1+2)*3', 9], ['2^3^2', 512], ['-2^2', -4], ['10/4', 2.5], ['sqrt(2)/2', Math.SQRT1_2], ['0.05*sqrt(252)', 0.05 * Math.sqrt(252)], ['1/√2', Math.SQRT1_2], ['√(9)+1', 4], ['2sqrt(9)', 6], ['3(4+1)', 15], ['50%', 0.5], ['1e-3*2', 0.002], ['1 - 0.95^100', 1 - 0.95 ** 100], ['e^0', 1], ['ln(e)', 1], ['2*pi', 2 * Math.PI], ['abs(-3)', 3], ['exp(0)', 1], ['3 × 4 ÷ 2', 6], ['−5+1', -4]]) {
        if (!near(QT.evalExpr(s), v)) fail(`evalExpr("${s}") gave ${QT.evalExpr(s)}, expected ${v}`);
      }
      const hostile = ['alert(1)', 'process.exit()', 'constructor', '__proto__', 'this', 'window', 'eval("1")', 'Function("return 1")()', '1;2', '1,2', '[]', '{}', '""', "'1'", '`1`', '${1}', 'x', '1+', '(1', '1)', 'sqrt', 'sqrt 2', 'sqrt(', '1/0', '9^9^9^9', '()', '<script>', 'a=1', '1=1', '//', '1'.repeat(70), 'import("x")', 'toString', 'valueOf()', 'sqrt.constructor', 'e.constructor', 'abs(1).x'];
      for (const s of hostile) if (!Number.isNaN(QT.evalExpr(s))) fail(`evalExpr should reject ${JSON.stringify(s)} but gave ${QT.evalExpr(s)}`);
      for (const s of hostile.filter((x) => /[^0-9,]/.test(x))) if (S.check(s, q('q-prob-005')) !== null) fail(`check should not read ${JSON.stringify(s)}`);
      const yes = [['q-prob-001', '161/36'], ['q-prob-001', '4.47'], ['q-prob-001', '4.4722'], ['q-prob-006', '6'], ['q-prob-006', '36/6'], ['q-prob-002', '1/3'], ['q-prob-002', '33.3%'], ['q-mm-arith-004', '8.33%'], ['q-mm-arith-004', '8.33'], ['q-mm-arith-004', '100/12'], ['q-stat-005', 'sqrt(2)/2'], ['q-stat-005', '1/√2'], ['q-stat-005', '0.707'], ['q-stat-006', '0.05*sqrt(252)'], ['q-stat-006', '0.79'], ['q-stat-007', '99.4%'], ['q-stat-007', '0.994'], ['q-stat-007', '99.4'], ['q-stat-007', '1-0.95^100'], ['q-stat-009', '17.3%'], ['q-stat-009', '17.3'], ['q-stat-009', '0.173'], ['q-stat-010', '0.063'], ['q-stat-010', '0.063%'], ['q-stat-003', '-1/2'], ['q-stat-003', '−0.5'], ['q-ev-002', '14/3'], ['q-ev-002', '4 2/3'], ['q-eq-003', '$15m'], ['q-eq-003', '15'], ['q-eq-004', '20 bps'], ['q-eq-005', '15%'], ['q-eq-005', '15'], ['q-mm-arith-003', '9,801'], ['q-mm-001', '4 at 5'], ['q-mm-001', '4.5'], ['q-mm-002', '4.5 at 5.5'], ['q-fermi-001', '60m'], ['q-fermi-001', '60 million'], ['q-fermi-001', '7e7'], ['q-fermi-001', '100000000'], ['q-fermi-001', '0.1bn']];
      for (const [id, s] of yes) if (S.check(s, q(id)) !== true) fail(`check: "${s}" should be right for ${id} (got ${S.check(s, q(id))})`);
      const no = [['q-prob-001', '4.6'], ['q-prob-001', '5'], ['q-prob-006', '6.1'], ['q-stat-003', '0.5'], ['q-stat-005', '0.8'], ['q-mm-arith-004', '9%'], ['q-stat-009', '20%'], ['q-eq-005', '10'], ['q-mm-001', '6.5 at 7.5'], ['q-fermi-001', '1m'], ['q-fermi-001', '1000000000'], ['q-fermi-001', '-5']];
      for (const [id, s] of no) if (S.check(s, q(id)) !== false) fail(`check: "${s}" should be wrong for ${id} (got ${S.check(s, q(id))})`);
      for (const s of ['', '   ', 'abc', '4.5.6']) if (S.check(s, q('q-prob-001')) !== null) fail(`check: "${s}" should be unreadable`);
      for (const c of QT.sseContent.filter((x) => x.type === 'numeric')) {
        if (S.check(String(c.value), c) !== true) fail(`check: ${c.id} rejects its own answer ${c.value}`);
        if (c.track !== 'fermi' && S.check(String(c.value + Math.max(1, Math.abs(c.value)) * 0.5 + c.tol * 2), c) !== false) fail(`check: ${c.id} accepts a far-off answer`);
      }
      if (typeof parseContent === 'function') {
        const ok = parseContent(`# Title\n\n### q-t-001\n- **track:** probability\n- **tags:** [a-b, c]\n- **difficulty:** 2\n- **time_target_s:** 60\n- **prompt:** What is **1 + 1** and \`x\`?\n- **hint_1:** Add.\n- **hint_2:**\n- **answer:** "2"\n- **answer_numeric:** 2\n- **tolerance:** 0\n- **solution:**\n  Line one.\n  1. **First**\n  2. Second\n  \`\`\`python\n  x = 1 < 2\n  \`\`\`\n\n### q-t-002\n- **track:** behavioural\n- **tags:** [a]\n- **prompt:** Why?\n- **solution:**\n  Because.\n\n---\n\n## Not a question\n- **track:** nonsense\n`);
        const [a, b] = ok.questions;
        if (ok.errors.length || ok.questions.length !== 2) fail(`importer: ${JSON.stringify(ok.errors)}`);
        else {
          if (a.type !== 'numeric' || a.value !== 2 || a.tol !== 0 || a.answer !== '2' || a.hints.length !== 1 || a.tags.join() !== 'a-b,c' || !a.prompt.includes('<b>1 + 1</b>') || !a.prompt.includes('<code>x</code>')) fail(`importer: numeric fields ${JSON.stringify(a)}`);
          if (!a.solution.includes('<p>Line one.</p><ol><li><b>First</b></li><li>Second</li></ol>') || !a.solution.includes('x = 1 &lt; 2')) fail(`importer: solution ${a.solution}`);
          if (b.type !== 'conceptual' || b.difficulty !== 2 || b.time !== 120 || b.value !== undefined) fail(`importer: legacy behavioural ${JSON.stringify(b)}`);
        }
        const errs = (t) => parseContent(`### q-x\n- **track:** probability\n- **tags:** [a]\n- **difficulty:** 2\n- **time_target_s:** 60\n- **prompt:** P\n- **answer:** 1\n- **answer_numeric:** 1\n- **tolerance:** 0\n- **solution:** S\n${t}`).errors;
        if (errs('').length) fail(`importer: a valid question gave ${errs('')}`);
        for (const [what, t] of [['bad track', '- **track:** nope'], ['bad difficulty', '- **difficulty:** 9'], ['bad time', '- **time_target_s:** soon'], ['bad type', '- **answer_type:** essay'], ['bad number', '- **answer_numeric:** many'], ['no tolerance', '- **tolerance:**'], ['no prompt', '- **prompt:**'], ['no solution', '- **solution:**'], ['no tags', '- **tags:** []'], ['bad tag', '- **tags:** [Not OK]'], ['code-task without tests', '- **answer_type:** code-task']]) {
          if (!errs(t).length) fail(`importer: ${what} wasn't reported`);
        }
        if (parseContent('### q-x\n- **track:** behavioural\n- **tags:** [a]\n- **prompt:** P\n- **solution:** S\n\n### q-x\n- **track:** behavioural\n- **tags:** [a]\n- **prompt:** P\n- **solution:** S\n').errors.length !== 1) fail('importer: duplicate ids');
        if (files.content && files.content.every(Boolean)) {
          const parsed = files.content.map((t) => parseContent(t));
          const qs = parsed.flatMap((r) => r.questions), errors = parsed.flatMap((r) => r.errors);
          if (errors.length) fail(`importer: ${errors.length} parse errors in content/: ${errors[0]}`);
          if (qs.length !== 54) fail(`importer: ${qs.length} questions, expected 54`);
          if (JSON.stringify(qs) !== JSON.stringify(QT.sseContent)) fail('www/js/sse-content.js is out of date: run node tools/import-content.js');
        }
      }
      for (const t of Object.keys(S.TRACKS)) if (!S.filtered(t).length) fail(`sse: no questions in ${t}`);
      for (const c of QT.sseContent) {
        if (!S.TRACKS[c.track]) fail(`sse ${c.id}: unknown track`);
        if (/undefined|\*\*|\bnull\b/.test(c.prompt + c.solution)) fail(`sse ${c.id}: unconverted text`);
      }
      const at = (correct, time_s, hints_used = 0, question_id = 'q-stat-001') => ({ question_id, tags: q(question_id).tags, correct, time_s, hints_used, timestamp: '2026-11-06T10:00:00Z' });
      const t60 = q('q-stat-001').time;
      if (!near(S.attemptScore(at(1, 30), t60), 1) || !near(S.attemptScore(at(1, 120), t60), 0.5) || !near(S.attemptScore(at(0, 10), t60), 0) || !near(S.attemptScore(at(1, 30, 2), t60), 0.7) || !near(S.attemptScore(at(0.5, 60), t60), 0.5) || S.attemptScore(at(0, 10, 2), t60) !== 0) fail('sse: attempt score');
      if (S.ewma([]) !== 0 || !near(S.ewma([1]), 1) || !near(S.ewma([1, 0]), 0.7) || !near(S.ewma([0, 1, 1]), 0.51)) fail('sse: ewma');
      const log = [at(1, 30), at(0, 30, 0, 'q-stat-002'), at(1, 30, 0, 'q-stat-002')];
      const ts = S.trackStats('statistics-regression', log);
      if (ts.n !== 12 || ts.attempted !== 2 || ts.correct !== 2 || !near(ts.mastery, 1.3 / 12)) fail(`sse: track stats ${JSON.stringify(ts)}`);
      if (!near(S.tagMastery('regression', log), 0.79) || !near(S.questionMastery('q-stat-002', log), 0.3) || S.readiness([]) !== 0) fail('sse: mastery');
      // Spaced repetition, as specified: Again resets, Hard ×1.2, Good × ease, Easy × ease × 1.3, ease ≥ 1.3, hints cap at Hard.
      const c0 = { ease: 2.5, interval: 4, reps: 3, due: 0 }, day = 864e5;
      const sc = (r, h = 0, c = c0) => S.schedule(c, r, h, 1000);
      if (sc('again').interval !== 1 || sc('again').reps !== 0 || sc('again').ease !== 2.5 || sc('again').due !== 1000 + day) fail('sse: Again');
      if (!near(sc('hard').interval, 4.8) || !near(sc('hard').ease, 2.35) || sc('hard').reps !== 4) fail('sse: Hard');
      if (sc('good').interval !== 10 || sc('good').ease !== 2.5) fail('sse: Good');
      if (!near(sc('easy').interval, 13) || !near(sc('easy').ease, 2.65)) fail('sse: Easy');
      if (!near(sc('good', 1).interval, 4.8) || !near(sc('easy', 2).ease, 2.35) || sc('again', 1).interval !== 1) fail('sse: hints should cap at Hard');
      if (S.schedule({ ease: 1.35 }, 'hard', 0, 0).ease !== 1.3) fail('sse: ease floor');
      if (S.schedule(undefined, 'good', 0, 0).interval !== 2.5) fail('sse: a new card');
      // Simulator: the deals match their fair values on average, P&L has the right sign, the width
      // penalty applies, and over many games a sensible width beats a far too wide or too tight one.
      if (QT.sseSim) {
        const M = QT.sseSim, X = (bid, ask, side, informed = false, fair = 5, sd = 2) => ({ bid, ask, side, informed, fair, sd });
        const st = M.settle([X(4, 6, 'buy'), X(4, 6, 'sell', true), X(4, 6, null)], 5);
        if (st.pnl !== 2 || st.adverse !== 1 || st.trades !== 2 || st.position !== 0) fail(`sim: settle ${JSON.stringify(st)}`);
        const sold = M.settle([X(4, 6, 'buy')], 3), bought = M.settle([X(4, 6, 'sell')], 3);
        if (sold.pnl !== 3 || bought.pnl !== -1 || sold.position !== -1 || bought.position !== 1 || sold.inventory !== 1) fail('sim: P&L sign: selling above the value makes money');
        if (!near(sold.penalty, M.LAMBDA * 2) || !near(sold.score, 3 - M.LAMBDA * 2) || sold.width !== 2) fail('sim: width penalty');
        const inf = M.settle([X(4, 6, 'buy', true), X(4, 6, 'buy', false)], 8);
        if (inf.adverse !== -2 || inf.pnl !== -4 || inf.inventory !== 2) fail('sim: adverse selection counts informed trades only');
        if (M.settle([X(4, 6, null, false, 5, 2), X(7, 8, null, false, 5, 2)], 5).quality !== 0.5) fail('sim: quality');
        const lim = M.settle([X(4, 6, 'sell'), X(4, 6, 'sell'), X(4, 6, 'sell')], 5, 2);
        if (lim.breaches !== 1 || lim.fines !== 2 || !near(lim.score, 3 - M.LAMBDA * 2 - 2)) fail(`sim: position limit ${JSON.stringify(lim)}`);
        const gone = M.settle([{ missed: true, side: null, fair: 5, sd: 2 }, X(4, 6, null)], 5);
        if (gone.missed !== 1 || gone.fines !== 2 || gone.width !== 2 || gone.quality !== 0.5) fail(`sim: missed quote ${JSON.stringify(gone)}`);
        if (M.settle([{ missed: true, side: null, fair: 5, sd: 2 }], 5).width !== 0) fail('sim: all quotes missed');
        const rng = QT.code ? QT.code.rng(20261106).next : Math.random;
        for (const [id, s] of Object.entries(M.SCENARIOS)) {
          const N = 4000;
          let sum = 0;
          for (let i = 0; i < N; i++) {
            const d = s.deal(rng);
            if (d.stages.length < 2 || !d.stages.every((x) => x.fair >= 0 && x.sd > 0 && (x.text || x === d.stages[0]))) { fail(`sim ${id}: bad stages`); break; }
            sum += d.value - d.stages[d.stages.length - 1].fair; // the last fair value is unbiased
          }
          if (Math.abs(sum / N) > 0.35) fail(`sim ${id}: fair value is biased by ${sum / N}`);
        }
        const d0 = M.SCENARIOS['two-dice'].deal(() => 0.5);
        if (d0.stages[1].fair !== d0.value - 4 + 3.5 || !near(d0.stages[0].sd, Math.sqrt(35 / 6)) || M.stagesFor(d0, 1).length !== 3 || M.stagesFor(d0, 2).length !== 2 || M.stagesFor(d0, 3).length !== 2 || M.stagesFor(d0, 4).length !== 4) fail('sim: stages');
        const avg = (w) => {
          let t = 0;
          for (let i = 0; i < 3000; i++) {
            const d = M.SCENARIOS['ten-flips'].deal(rng), qs = M.stagesFor(d, 1).map((s) => { const bid = s.fair - (w * s.sd) / 2, ask = s.fair + (w * s.sd) / 2; return { bid, ask, fair: s.fair, sd: s.sd, ...M.bot(bid, ask, d.value, s, 1, rng) }; });
            t += M.settle(qs, d.value).score;
          }
          return t / 3000;
        };
        if (!(avg(1) > avg(4) && avg(1) > avg(0.1))) fail('sim: a one-SD market should beat far too wide and far too tight');
      }
      for (const [id, d] of Object.entries(QT.ssePy || {})) {
        if (q(id)?.type !== 'code-task' || !/def run\(\)/.test(d.test) || !/^import numpy/.test(d.starter)) fail(`sse python: ${id}`);
      }
      const tt = S.tagTable([]);
      if (tt.length !== S.allTags().length) fail('sse: tag table');
      if (QT.sseMock) {
        const P = QT.sseMock.draw();
        if (P.prob.length !== 3 || P.stats.length !== 3 || P.project.length !== 2) fail('mock: wrong number of questions');
        if (P.prob.some((c) => c.difficulty < 2 || c.difficulty > 4 || !['probability', 'expected-value'].includes(c.track)) || P.stats.some((c) => c.track !== 'statistics-regression') || P.project.some((c) => !/^q-(beh-004|proj-)/.test(c.id)) || new Set(P.prob.map((c) => c.id)).size !== 3) fail('mock: question choice');
        if (QT.sseMock.SEGMENTS.reduce((s, x) => s + x.mins, 0) !== 45) fail('mock: segments should add up to 45 minutes');
        const row = (seg, id, correct, time_s, hints_used = 0) => ({ seg, q: q(id), attempt: { correct, time_s, hints_used } });
        const rep = QT.sseMock.report([row('prob', 'q-prob-001', 1, 60), row('prob', 'q-prob-002', 0, 60), row('stats', 'q-stat-001', 1, 10), row('stats', 'q-stat-012', 0.5, 60)], { quality: 0.5 });
        const seg = Object.fromEntries(rep.segs.map((x) => [x.id, x.score]));
        if (seg.prob !== 0.5 || seg.stats !== 0.75 || seg.mm !== 0.5 || seg.intro !== 0 || rep.weak.length !== 3 || !rep.weak.includes('conditional') || !near(rep.overall, 1.75 / 6)) fail(`mock: report ${JSON.stringify(rep)}`);
      }
      const saved = QT.store.exportJson(), snap = JSON.parse(saved);
      snap.sse = { attempts: [{ question_id: 'q-stat-001', tags: ['a', 7], correct: 3, time_s: -1, hints_used: 1.6, timestamp: '2026-11-06T10:00:00Z', notes: 'x', evil: 1 }, 'x'] };
      QT.store.importJson(JSON.stringify(snap));
      const got = QT.store.get().sse.attempts[0];
      if (got.correct !== 1 || got.time_s !== 0 || got.hints_used !== 2 || got.notes !== 'x' || 'evil' in got || got.tags.length !== 2) fail(`sse: not sanitised as expected ${JSON.stringify(got)}`);
      S.logAttempt(q('q-prob-001'), 1, 12.34, 1, 'my working');
      const last = QT.store.get().sse.attempts.at(-1);
      if (last.question_id !== 'q-prob-001' || last.correct !== 1 || last.time_s !== 12.3 || last.hints_used !== 1 || last.tags !== q('q-prob-001').tags && last.tags.join() !== q('q-prob-001').tags.join() || !last.timestamp || last.notes !== 'my working') fail(`sse: attempt ${JSON.stringify(last)}`);
      QT.store.importJson(saved);
    }

    // Coding: every problem is complete; the JavaScript reference passes every case, including the
    // random and large ones (the Python reference is checked in research/verify_code.py); the
    // starter code defines the right names; the debugging starters really are buggy; the quiz is
    // well formed; and saved coding data is sanitised.
    if (QT.code) {
      const C = QT.code, ids = new Set();
      for (const P of C.PROBLEMS) {
        if (ids.has(P.id)) fail(`code ${P.id}: duplicate id`);
        ids.add(P.id);
        if (!C.GROUPS.some(([g]) => g === P.group)) fail(`code ${P.id}: unknown group ${P.group}`);
        if (!P.title || !P.body || !P.rules.length || !P.note || !/^https:\/\//.test(P.src[1])) fail(`code ${P.id}: missing statement, limits, note or source`);
        if (!P.tests.some((t) => t.ex) || P.hints.length < 3 || !P.sol.idea || !P.sol.steps.length || !P.sol.cx || !P.sol.trap) fail(`code ${P.id}: needs an example, three hints and a full solution`);
        if (!P.ref.py.trim() || !P.ref.js.trim()) fail(`code ${P.id}: missing a reference solution`);
        for (const t of P.tests) {
          if (P.kind === 'cls' && (!Array.isArray(t.init) || t.ops.length !== t.out.length)) fail(`code ${P.id}: a test needs init and one result per call`);
          if (P.kind === 'cls') for (const [m] of t.ops) if (!P.sig.methods.some(([n]) => n === m)) fail(`code ${P.id}: test calls ${m}, which isn't in the signature`);
        }
        for (const [n, title, slug, diff, rel, note] of P.lc) {
          if (!(n > 0) || !title || !/^[a-z0-9-]+$/.test(slug) || !['Easy', 'Medium', 'Hard'].includes(diff) || !['same', 'similar'].includes(rel) || !note) fail(`code ${P.id}: malformed LeetCode link ${slug}`);
        }
        for (const lang of ['py', 'js']) if (!C.starter(P, lang).includes(lang === 'py' ? C.pyName(P) : P.name)) fail(`code ${P.id}: ${lang} starter doesn't define ${P.name}`);
        if (typeof C.compileJs(C.starter(P, 'js'), P.name) !== 'function') fail(`code ${P.id}: JavaScript starter doesn't compile to a ${P.kind}`);
        const ref = C.refImpl(P), all = C.cases(P, 'submit');
        if (P.fuzz && all.length < P.tests.length + 25) fail(`code ${P.id}: random cases missing`);
        for (const t of all) {
          let got;
          try { got = C.exec(ref, P, t); } catch (err) { got = err; }
          if (!C.same(got, t.out)) { fail(`code ${P.id}: reference fails ${t.label}`); break; }
        }
        if (P.starter) {
          const buggy = C.compileJs(P.starter.js, P.name);
          const caught = all.filter((t) => { try { return !C.same(C.exec(buggy, P, t), t.out); } catch { return true; } });
          if (!caught.length) fail(`code ${P.id}: the buggy starter passes every case`);
        }
      }
      if (C.same([1, [2, null]], [1, [2.0000000001, undefined]]) !== true || C.same([1], [1, 2]) || C.same('1', 1)) fail('code: same() compares wrongly');
      if (C.snake('serveAll') !== 'serve_all' || C.snake('LRUCache') !== 'lrucache' || C.pyName(C.byId('opt-lru')) !== 'LRUCache') fail('code: Python names');
      const QZ = QT.codeQuiz, qids = new Set();
      if (QZ.QS.length < QZ.N) fail('code quiz: fewer questions than a quiz needs');
      for (const q of QZ.QS) {
        if (qids.has(q.id) || !/^[a-z0-9-]{1,30}$/.test(q.id)) fail(`code quiz ${q.id}: duplicate or bad id`);
        qids.add(q.id);
        if (!QZ.TOPICS.includes(q.topic) || q.opts.length !== 4 || new Set(q.opts).size !== 4 || !q.why || !q.q) fail(`code quiz ${q.id}: malformed`);
      }
      for (const t of QZ.TOPICS) if (!QZ.QS.some((q) => q.topic === t)) fail(`code quiz: no questions on ${t}`);
      // The right answer mustn't stand out by length (it is listed first, and shuffled when shown).
      const longest = QZ.QS.filter((q) => q.opts[0].length > Math.max(...q.opts.slice(1).map((o) => o.length))).length;
      if (longest > QZ.QS.length / 4) fail(`code quiz: the right answer is the longest option in ${longest} of ${QZ.QS.length} questions`);
      const saved = QT.store.exportJson(), snap = JSON.parse(saved);
      snap.code = { lang: 'cobol', p: { 'opt-lru': { py: 123, js: 'x'.repeat(30000), solved: '5', subs: 2, first: 1 }, 'BAD KEY!': { py: 'x' } }, quiz: { runs: [{ date: '2026-11-02T10:00:00Z', n: 20, right: 15 }, 'x'], q: { 'ds-heap': [1, 0, '1', 5, 0, 1], 'bad id!': [1] } } };
      QT.store.importJson(JSON.stringify(snap));
      const cd = QT.store.get().code;
      if (cd.lang !== 'py' || cd.p['opt-lru'].py !== '' || cd.p['opt-lru'].js.length !== 20000 || cd.p['opt-lru'].solved !== 5 || !cd.p['opt-lru'].first || cd.p['BAD KEY!']
        || cd.quiz.runs.length !== 2 || cd.quiz.runs[0].right !== 15 || JSON.stringify(cd.quiz.q['ds-heap']) !== '[0,1,1,0,1]' || cd.quiz.q['bad id!']) fail(`code: not sanitised as expected ${JSON.stringify(cd).slice(0, 300)}`);
      QT.store.importJson(saved);
    }

    // Question tracking: answers set the status unless you've set one; your mark survives export
    // and import; anything else in an imported file is dropped.
    if (QT.ui && QT.ui.bankStatus) {
      const saved = QT.store.exportJson();
      QT.store.reset();
      const U = QT.ui, b = QT.bank.find((x) => x.parts && x.parts.length === 2), o = QT.bank.find((x) => x.open);
      const st = () => U.bankStatus(b);
      const steps = [st()];
      U.recordBank(b.id, 0, true); steps.push(st());
      U.recordBank(b.id, 1, true); steps.push(st());
      U.recordBank(b.id, 1, false); steps.push(st());
      U.setBankMark(b.id, 'done'); steps.push(st());
      U.setBankMark(b.id, 'todo'); steps.push(st());
      U.setBankMark(b.id, null); U.recordBank(b.id, 1, true, 2); steps.push(st()); // right, but with hints
      U.recordBank(b.id, 1, true, 0); steps.push(st()); // later, unaided
      U.setBankMark(o.id, 'unsure');
      if (steps.join() !== 'todo,todo,done,unsure,done,todo,unsure,done') fail(`tracking: status sequence ${steps.join()}`);
      const c = U.bankCounts();
      if (c.unsure !== 1 || c.done !== 1 || c.todo !== QT.bank.length - 2) fail(`tracking: counts ${JSON.stringify(c)}`);
      if (!QT.coach.recommend().some((r) => r.kind === 'unsure' && r.href === '#/bank/all/unsure')) fail('tracking: unsure questions should be recommended');
      const snap = JSON.parse(QT.store.exportJson());
      snap.bank[b.id].mark = 'evil<script>';
      QT.store.importJson(JSON.stringify(snap));
      if (QT.store.get().bank[b.id].mark !== undefined || QT.store.get().bank[o.id].mark !== 'unsure') fail('tracking: marks not sanitised on import');
      QT.store.importJson(saved);
    }

    // Imported HTML is rebuilt by a tokenizer: allowed tags survive, everything that could run
    // is dropped, entities stay as they were. Same code in Node and the browser.
    {
      const saved = QT.store.exportJson();
      const clean = (q) => {
        const s = JSON.parse(saved);
        s.mistakes = [{ key: 'k', tag: '<b>t</b>', p: { q, a: 1, sol: 's' }, box: 0, due: 0 }];
        QT.store.importJson(JSON.stringify(s));
        return QT.store.get().mistakes[0].p.q;
      };
      const cases = [
        ['Q<img src=x onerror="go()"><sup class="x" onclick="y()">2</sup><script>alert(1)</script><a href="javascript:1">L</a>', 'Q<sup class="x">2</sup>alert(1)L'],
        ['x < 5 &amp; y &lt; 3 & z', 'x &lt; 5 &amp; y &lt; 3 &amp; z'],
        ['<b>bold</b><svg onload=go()></svg><!-- c --><SPAN CLASS="frac big">1</SPAN>', '<b>bold</b><span class="frac big">1</span>'],
        ['<span class="x" onmouseover="y">z</span><span class="a;b">w</span>', '<span class="x">z</span><span>w</span>'],
      ];
      for (const [input, want] of cases) {
        const got = clean(input);
        if (got !== want) fail(`sanitise: ${JSON.stringify(input)} gave ${JSON.stringify(got)}`);
      }
      if (QT.store.get().mistakes[0].tag !== 't') fail('sanitise: plain-text field kept a tag');
      QT.store.importJson(saved);
    }

    // Search: finds questions by firm and words, topics by name, and formula cards; needs every word.
    if (QT.search) {
      const ids = (q) => QT.search.find(q).map((h) => h.href);
      if (!ids('ants').includes('#/iq/wc-ants')) fail('search: "ants" does not find wc-ants');
      if (!ids('wincent').some((h) => h.startsWith('#/iq/wc-'))) fail('search: "wincent" finds no Wincent questions');
      if (!ids('kelly').length || !QT.search.find('kelly').some((h) => h.type === 'card')) fail('search: "kelly" finds no formula card');
      if (!ids('zetamac').includes('#/mental') || !ids('figgie').includes('#/figgie')) fail('search: pages (zetamac, figgie) not found');
      if (ids('kelly zzzqqq').length) fail('search: a word that matches nothing should give no results');
      if (QT.search.find('').length) fail('search: empty query should give no results');
    }

    // Firm guide pages: every firm with questions gets a page listing all its questions with
    // answers, the index and sitemap link to them, and nothing renders as undefined/NaN.
    if (typeof firmPages !== 'undefined') {
      const files = firmPages.renderAll(QT);
      for (const firm of Object.keys(QT.firms).filter((k) => QT.bank.some((b) => b.firm === k))) {
        const html = files[`firms/${firm}.html`] || '';
        const missing = QT.bank.filter((b) => b.firm === firm && !html.includes(`id="${b.id}"`)).map((b) => b.id);
        if (!html || missing.length || /undefined|NaN|\[object Object\]/.test(html)) { fail(`firm page ${firm}: ${html ? `missing ${missing.join(', ')} or junk` : 'not generated'}`); break; }
        if (!files['firms/index.html'].includes(`href="${firm}.html"`) || !files['sitemap.xml'].includes(`firms/${firm}.html`)) fail(`firm page ${firm}: not linked from the index or sitemap`);
      }
      if (!/<title>Wincent interview questions and process/.test(files['firms/wincent.html'] || '')) fail('firm page: Wincent title');
      if (/Follow-up \(ours\)[^<]*<span class="small">\(our follow-up\)/.test(Object.values(files).join(''))) fail('firm page: follow-up labelled twice');
      // Topic guides: a page per topic with one worked example per question type, stable between builds.
      const again = firmPages.renderAll(QT);
      for (const t of QT.topics) {
        const html = files[`topics/${t.id}.html`] || '', n = (html.match(/<article /g) || []).length;
        if (n !== t.gens.length || /undefined|NaN|\[object Object\]/.test(html)) { fail(`topic page ${t.id}: ${n} of ${t.gens.length} examples, or junk`); break; }
        if (html !== again[`topics/${t.id}.html`]) { fail(`topic page ${t.id}: differs between builds`); break; }
        if (!files['topics/index.html'].includes(`href="${t.id}.html"`) || !files['sitemap.xml'].includes(`topics/${t.id}.html`)) fail(`topic page ${t.id}: not linked from the index or sitemap`);
      }
    }

    // Build consistency: every script the page loads must be precached for offline use,
    // and the version must match everywhere.
    if (files.index && files.sw) {
      const scripts = [...files.index.matchAll(/<script(?: defer)? src="([^"]+)"/g)].map((m) => m[1]);
      if (scripts.length < 10) fail(`build: only found ${scripts.length} scripts in index.html`);
      const cached = [...files.sw.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      for (const s of scripts) if (!cached.includes(s)) fail(`sw.js does not precache ${s}`);
      const swVer = (files.sw.match(/VERSION = 'qt-([^']+)'/) || [])[1];
      if (swVer !== QT.VERSION) fail(`version mismatch: sw.js ${swVer} vs core.js ${QT.VERSION}`);
    }
    if (files.pkg && JSON.parse(files.pkg).version !== QT.VERSION) fail(`version mismatch: package.json vs core.js ${QT.VERSION}`);

    const fails = out.length;
    out.push(`\n${QT.topics.length} topics · ${gens} generators · ${sims} simulation checks · ${QT.cases.length} case studies · ${QT.bank.length} interview questions (${bankSims} simulated) · ${(QT.estimateFacts || []).length} estimation facts · ${(QT.tricks || []).length} speed tricks · ${QT.code ? `${QT.code.PROBLEMS.length} coding problems · ${QT.codeQuiz.QS.length} quiz questions · ` : ''}Figgie, Kelly, daily, quote, online-test and chart checks`);
    out.push(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASSED');
    return { lines: out, fails };
  }

  root.runChecks = runChecks;
})(typeof window !== 'undefined' ? window : globalThis);
