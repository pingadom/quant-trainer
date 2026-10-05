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
    out.push(`\n${QT.topics.length} topics · ${gens} generators · ${sims} simulation checks · ${QT.cases.length} case studies · ${QT.bank.length} interview questions (${bankSims} simulated) · ${(QT.estimateFacts || []).length} estimation facts · ${(QT.tricks || []).length} speed tricks`);
    out.push(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASSED');
    return { lines: out, fails };
  }

  root.runChecks = runChecks;
})(typeof window !== 'undefined' ? window : globalThis);
