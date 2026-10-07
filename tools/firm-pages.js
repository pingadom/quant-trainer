// Free guide pages: one static HTML page per firm (how it interviews, every question with its
// worked solution) and per topic (the formula sheet and a worked example of every question type),
// plus indexes, so people searching before an interview can find them.
// The app itself is one page with hash routes, which search engines treat as a single page.
//
// Generated at deploy time from the interview bank (www/js/bank.js), so they never drift:
//   node tools/firm-pages.js            → writes www/firms/*.html, www/topics/*.html and www/sitemap.xml
// renderAll(QT) is pure and also runs in the browser (tests/check.html checks its output).
(function (root) {
  const SITE = 'https://pingadom.github.io/theo/';
  const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const plain = (html) => String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  function page({ title, description, canonical, body }) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE}icons/og-image.png">
  <script src="../js/theme.js"></script>
  <link rel="icon" type="image/png" sizes="32x32" href="../icons/favicon-32.png">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <main class="static">
${body}
    <footer class="static-foot small">Theo is free and open source. Questions are paraphrased from public candidate reports and linked to their sources; firm names are used only to attribute those reports. <a href="../privacy.html">Privacy</a></footer>
  </main>
</body>
</html>
`;
  }

  // Answers that are small fractions with recurring decimals read better as fractions:
  // "1/3 ≈ 0.33333". Terminating ones (3.5, 8.15) and big numerators stay as decimals.
  function answer(QT, a) {
    const f = QT.fmtNum(a);
    if (Number.isInteger(a) || !Number.isFinite(a)) return esc(f);
    for (let q = 2; q <= 64; q++) {
      const p = Math.round(a * q);
      if (Math.abs(a - p / q) > 1e-9) continue;
      let r = q;
      while (r % 2 === 0) r /= 2;
      while (r % 5 === 0) r /= 5;
      return esc(r === 1 || Math.abs(p) > 999 ? f : `${p}/${q} ≈ ${f}`); // r = 1: the decimal terminates
    }
    return esc(f);
  }

  const firmsWithQuestions = (QT) => Object.entries(QT.firms).filter(([id]) => QT.bank.some((b) => b.firm === id));

  function firmPage(QT, id) {
    const F = QT.firms[id], qs = QT.bank.filter((b) => b.firm === id);
    const name = id === 'common' ? 'Common trading-interview formats' : F.name;
    const reported = qs.filter((b) => b.kind === 'reported').length;
    const title = id === 'common' ? 'Common trading interview question formats, with solutions | Theo' : `${F.name} interview questions and process | Theo`;
    const description = id === 'common'
      ? `${qs.length} question formats used across trading-firm interviews (market making, options, quoting), with worked solutions. Free.`
      : `${reported} interview question${reported === 1 ? '' : 's'} candidates report from ${F.name}, with worked solutions and how the interview process runs. Free practice, no sign-up.`;
    const parts = (b) => (b.parts || []).map((p) => `
          <li>${p.q}${p.ext && !/follow-up/i.test(p.q) ? ' <span class="small">(our follow-up)</span>' : ''}
            <details><summary>Answer and worked solution</summary><p><b>Answer: ${answer(QT, p.a)}</b></p><div class="solution">${p.sol}</div></details>
          </li>`).join('');
    const items = qs.map((b) => `
      <article class="card static-q" id="${esc(b.id)}">
        <p class="small">${esc(b.role)} · ${esc(b.stage)} · ${esc(b.cat)} · ${b.kind === 'reported' ? 'reported by a candidate' : 'practice question on a reported topic'}</p>
        <p class="question">${b.q}</p>
        ${b.note ? `<p class="small">${b.note}</p>` : ''}
        ${b.parts ? `<ol>${parts(b)}
        </ol>` : b.open ? `<details><summary>Model answer</summary><div class="solution">${b.open.model}</div></details>` : ''}
        ${b.followups && b.followups.length ? `<p class="small"><b>Interviewers may push further:</b> ${b.followups.join(' ')}</p>` : ''}
        <p class="small">Source: <a href="${esc(b.src[1])}" rel="noopener">${esc(b.src[0])}</a> · <a href="../#/iq/${esc(b.id)}">Try it in the app →</a></p>
      </article>`).join('');
    const others = firmsWithQuestions(QT).filter(([k]) => k !== id).map(([k, v]) => `<a href="${k}.html">${esc(k === 'common' ? 'Common formats' : v.name)}</a>`).join(' · ');
    const body = `
    <nav class="crumbs small"><a href="../">Theo</a> › <a href="./">Firm guides</a> › ${esc(name)}</nav>
    <h1>${esc(id === 'common' ? name : `${F.name} interview questions`)}</h1>
    <p class="lede">${id === 'common' ? 'Formats that come up at many trading firms, with worked solutions.' : `How ${esc(F.name)}'s process runs, as candidates and the firm describe it, and the questions candidates report, each with a worked solution.`} Free, no sign-up.</p>
    <p><a class="btn" href="../#/bank/${id}">Practise these in the app</a> <a class="btn ghost" href="../#/mock/${id}">Mock interview</a></p>
    ${F.process && F.process.length ? `<h2>How ${esc(id === 'common' ? 'these formats work' : `${F.name} interviews`)}</h2>
    <ul>${F.process.map((x) => `<li>${x}</li>`).join('')}</ul>
    <p class="small">Sources: ${(F.sources || []).map(([l, u]) => `<a href="${esc(u)}" rel="noopener">${esc(l)}</a>`).join(' · ')}</p>` : ''}
    <h2>Questions (${qs.length})</h2>
    <p class="small">Try each one before opening the solution. Interviewers change the numbers, so learn the method.</p>
    ${items}
    <h2>Other firms</h2>
    <p>${others}</p>
    <p class="small">Practise by subject instead: <a href="../topics/">topic guides</a>.</p>`;
    return page({ title, description, canonical: `${SITE}firms/${id}.html`, body });
  }

  function indexPage(QT) {
    const rows = firmsWithQuestions(QT).map(([id, F]) => {
      const qs = QT.bank.filter((b) => b.firm === id), rep = qs.filter((b) => b.kind === 'reported').length;
      return `<a class="card topic-card" href="${id}.html"><h3>${esc(id === 'common' ? 'Common formats' : F.name)}</h3><div class="small">${qs.length} question${qs.length === 1 ? '' : 's'}${id === 'common' ? '' : ` · ${rep} reported by candidates`}</div></a>`;
    }).join('');
    const body = `
    <nav class="crumbs small"><a href="../">Theo</a> › Firm guides</nav>
    <h1>Trading firm interview guides</h1>
    <p class="lede">Free guides to quant and trading interviews at ${firmsWithQuestions(QT).length - 1} firms: how each process runs, and the questions candidates report, with worked solutions.</p>
    <p><a class="btn" href="../">Open the free practice app</a> <a class="btn ghost" href="../topics/">Topic guides</a></p>
    <div class="grid">${rows}</div>`;
    return page({ title: 'Trading firm interview questions and guides | Theo', description: 'Free guides to quant trading interviews at Jane Street, Optiver, SIG, IMC, Wincent and more: the process and reported questions with worked solutions.', canonical: `${SITE}firms/`, body });
  }

  // One worked example per question type. Seeded per topic and type, so the page only changes
  // when the generator does (search engines see stable content).
  function examples(QT, t) {
    return t.gens.map((gen, i) => QT.daily.withSeed(QT.daily.hash(`page:${t.id}:${i}`), gen));
  }

  function topicPage(QT, t) {
    const ex = examples(QT, t);
    const items = ex.map((q, i) => `
      <article class="card static-q" id="q${i + 1}">
        <p class="small">${esc((t.skills && t.skills[i]) || t.name)}</p>
        <p class="question">${q.q}</p>
        <details><summary>Answer and worked solution</summary><p><b>Answer: ${answer(QT, q.a)}</b></p><div class="solution">${q.sol}</div></details>
      </article>`).join('');
    const others = QT.topics.filter((o) => o.id !== t.id).map((o) => `<a href="${o.id}.html">${esc(o.name)}</a>`).join(' · ');
    const body = `
    <nav class="crumbs small"><a href="../">Theo</a> › <a href="./">Topic guides</a> › ${esc(t.name)}</nav>
    <h1>${esc(t.name)}: interview questions and key results</h1>
    <p class="lede">${t.blurb} The results to know for quant trading interviews, then a worked example of each of the ${ex.length} question types. Free, no sign-up.</p>
    <p><a class="btn" href="../#/topic/${t.id}">Practise endless questions like these</a></p>
    ${t.notes ? `<h2>Key results</h2>
    <div class="card">${t.notes}</div>` : ''}
    <h2>Worked examples (${ex.length})</h2>
    <p class="small">Try each one before opening the solution. In the app, every type generates fresh numbers each time.</p>
    ${items}
    <h2>Other topics</h2>
    <p>${others}</p>
    <p class="small">Preparing for a specific firm? See the <a href="../firms/">firm guides</a>.</p>`;
    return page({
      title: `${t.name} interview questions with worked solutions | Theo`,
      description: `${plain(t.blurb)} Key results and ${ex.length} worked quant interview questions. Free practice, no sign-up.`,
      canonical: `${SITE}topics/${t.id}.html`, body,
    });
  }

  function topicIndex(QT) {
    const rows = QT.topics.map((t) => `<a class="card topic-card" href="${t.id}.html"><h3>${esc(t.name)}</h3><div class="small">${plain(t.blurb)} · ${t.gens.length} question types</div></a>`).join('');
    const body = `
    <nav class="crumbs small"><a href="../">Theo</a> › Topic guides</nav>
    <h1>Quant interview topics: key results and worked questions</h1>
    <p class="lede">Free guides to the ${QT.topics.length} subjects quant trading interviews test: the results to know, and a worked example of every question type.</p>
    <p><a class="btn" href="../">Open the free practice app</a> <a class="btn ghost" href="../firms/">Firm guides</a></p>
    <div class="grid">${rows}</div>`;
    return page({ title: 'Quant interview topics: probability, statistics and trading questions | Theo', description: `Free guides to ${QT.topics.length} quant interview topics, from dice and Bayes to Markov chains and options: key results and worked questions.`, canonical: `${SITE}topics/`, body });
  }

  function sitemap(QT) {
    const urls = [['', '1.0', 'weekly'], ['firms/', '0.9', 'weekly'], ...firmsWithQuestions(QT).map(([id]) => [`firms/${id}.html`, '0.8', 'weekly']),
      ['topics/', '0.9', 'weekly'], ...QT.topics.map((t) => [`topics/${t.id}.html`, '0.8', 'monthly']), ['privacy.html', '0.3', 'yearly']];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p, c]) => `  <url><loc>${SITE}${u}</loc><changefreq>${c}</changefreq><priority>${p}</priority></url>`).join('\n')}
</urlset>
`;
  }

  // { relative path under www/: file contents }
  function renderAll(QT) {
    const out = { 'firms/index.html': indexPage(QT), 'topics/index.html': topicIndex(QT), 'sitemap.xml': sitemap(QT) };
    for (const [id] of firmsWithQuestions(QT)) out[`firms/${id}.html`] = firmPage(QT, id);
    for (const t of QT.topics) out[`topics/${t.id}.html`] = topicPage(QT, t);
    return out;
  }

  root.firmPages = { renderAll, plain };
  if (typeof module !== 'undefined' && require.main === module) {
    const fs = require('fs'), path = require('path');
    const { loadQT } = require('../tests/load-qt');
    const files = renderAll(loadQT().QT), www = path.join(__dirname, '..', 'www');
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(www, rel)), { recursive: true });
      fs.writeFileSync(path.join(www, rel), text);
    }
    console.log(`Wrote ${Object.keys(files).length} files: ${Object.keys(files).join(', ')}`);
  }
  if (typeof module !== 'undefined') module.exports = root.firmPages;
})(typeof window !== 'undefined' ? window : globalThis);
