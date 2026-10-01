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
    out.push(`\n${QT.topics.length} topics · ${gens} generators · ${sims} simulation checks · ${QT.cases.length} case studies · ${QT.bank.length} interview questions (${bankSims} simulated)`);
    out.push(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASSED');
    return { lines: out, fails };
  }

  root.runChecks = runChecks;
})(typeof window !== 'undefined' ? window : globalThis);
