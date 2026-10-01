// Case studies: real market events as statistics lessons.
(function () {
  const store = QT.store, U = QT.ui;

  function cases(el) {
    el.innerHTML = `
      <h1>Case studies</h1>
      <p class="lede">Real market events, each turned into a statistics lesson. Interviewers love candidates who can connect a formula to something that actually happened, and these are the stories that shaped how trading firms think about risk.</p>
      <div class="grid">${QT.cases.map(U.caseCard).join('')}</div>`;
  }

  function caseStudy(el, id) {
    const c = QT.caseById(id);
    if (!c) return cases(el);
    const idx = QT.cases.indexOf(c), nextCase = QT.cases[(idx + 1) % QT.cases.length];
    el.innerHTML = `
      <a class="back" href="#/cases">← All case studies</a>
      <div class="small mono">${c.year}</div>
      <h1>${c.title}</h1>
      <div class="chips" style="margin-bottom:16px">${c.tags.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
      <div class="card case-body">
        <p>${c.summary}</p>
        <h3>Key facts</h3>
        <ul>${c.facts.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>
      <h2>The lesson</h2>
      <div class="card"><p style="margin:0">${c.lesson}</p></div>
      <h2>Work it through</h2>
      <div id="qbox"></div>
      <h2>Sources</h2>
      <ul class="sources">${c.sources.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`).join('')}</ul>
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/case/${nextCase.id}">Next: ${nextCase.title} →</a></div>`;

    let i = 0;
    const source = () => {
      if (i >= c.questions.length) return null;
      const qi = i++, q = c.questions[qi];
      return {
        tag: `Question ${qi + 1} of ${c.questions.length}${q.illus ? ' · illustrative numbers' : ''}`,
        p: q,
        record: (ok) => {
          const rec = (store.get().cases[c.id] ||= { results: [] });
          rec.results[qi] = ok;
          store.touchDay();
          store.save();
        },
      };
    };
    U.questionCard(el.querySelector('#qbox'), source, (box, r) => {
      box.innerHTML = `<div class="card"><h3>Case complete: ${r.right}/${r.solved} correct</h3>
        <p class="small">Try explaining this event out loud in two minutes: what happened, which assumption failed, and the number that shows it.</p>
        <div class="row"><button class="ghost" id="redo">Redo questions</button><a class="btn" href="#/case/${nextCase.id}">Next case →</a></div></div>`;
      box.querySelector('#redo').addEventListener('click', () => QT.route());
    });
  }

  QT.views = Object.assign(QT.views || {}, { cases, case: caseStudy });
})();
