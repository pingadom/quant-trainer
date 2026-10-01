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

    // Answer parsing.
    const parse = [['5/36', 5 / 36], ['13.9%', 0.139], ['1,250', 1250], ['-0.7', -0.7], ['.5', 0.5]];
    for (const [s, v] of parse) if (Math.abs(QT.parseAnswer(s) - v) > 1e-12) fail(`parse ${s}`);
    if (!Number.isNaN(QT.parseAnswer('abc'))) fail('parse abc should be NaN');

    // Build consistency: every script the page loads must be precached for offline use,
    // and the version must match everywhere.
    if (files.index && files.sw) {
      const scripts = [...files.index.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
      const cached = [...files.sw.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      for (const s of scripts) if (!cached.includes(s)) fail(`sw.js does not precache ${s}`);
      const swVer = (files.sw.match(/VERSION = 'qt-([^']+)'/) || [])[1];
      if (swVer !== QT.VERSION) fail(`version mismatch: sw.js ${swVer} vs core.js ${QT.VERSION}`);
    }
    if (files.pkg && JSON.parse(files.pkg).version !== QT.VERSION) fail(`version mismatch: package.json vs core.js ${QT.VERSION}`);

    const fails = out.length;
    out.push(`\n${QT.topics.length} topics · ${gens} generators · ${sims} simulation checks · ${QT.cases.length} case studies · ${QT.bank.length} interview questions (${bankSims} simulated) · ${(QT.estimateFacts || []).length} estimation facts`);
    out.push(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASSED');
    return { lines: out, fails };
  }

  root.runChecks = runChecks;
})(typeof window !== 'undefined' ? window : globalThis);
