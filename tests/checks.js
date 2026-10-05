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
    out.push(`\n${QT.topics.length} topics · ${gens} generators · ${sims} simulation checks · ${QT.cases.length} case studies · ${QT.bank.length} interview questions (${bankSims} simulated) · ${(QT.estimateFacts || []).length} estimation facts · ${(QT.tricks || []).length} speed tricks · Figgie, Kelly, daily, quote, online-test and chart checks`);
    out.push(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASSED');
    return { lines: out, fails };
  }

  root.runChecks = runChecks;
})(typeof window !== 'undefined' ? window : globalThis);
