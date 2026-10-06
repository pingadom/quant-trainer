// Interview questions: browse by firm, answer a question, open-ended self-grading, mock interviews.
(function () {
  const U = QT.ui;
  const firmBadge = (b) => `<span class="tag firm">${QT.firms[b.firm].name}</span>`;
  const plain = (html) => html.replace(/<[^>]+>/g, '');

  // Parts of one or more bank questions, fed to the question card in order.
  function bankSource(items, label) {
    const queue = [];
    items.forEach((b, qi) => (b.parts || []).forEach((part, pi) => queue.push({ b, part, pi, qi })));
    let k = 0;
    return () => {
      if (k >= queue.length) return null;
      const { b, part, pi, qi } = queue[k++];
      return {
        tag: `${label ? label(qi) + ' · ' : ''}${QT.firms[b.firm].name}${b.parts.length > 1 ? ` · part ${pi + 1} of ${b.parts.length}` : ''}${part.ext ? ' · our follow-up' : ''}`,
        p: { ...part, q: `<p class="stem">${b.q}</p><p>${part.q}</p>` },
        record: (ok) => U.recordBank(b.id, pi, ok),
      };
    };
  }

  // An unknown firm in a link (typo, or a firm since removed) shows every question instead of nothing.
  const knownFirm = (firm) => (firm && Object.prototype.hasOwnProperty.call(QT.firms, firm) ? firm : undefined);

  function bank(el, firmArg) {
    const firm = knownFirm(firmArg);
    const list = QT.bank.filter((b) => !firm || b.firm === firm);
    const F = firm && QT.firms[firm];
    el.innerHTML = `
      <h1>Interview questions</h1>
      <p class="lede">Questions candidates report being asked at trading firms, rewritten in our own words with worked solutions and a link to where each was reported. Treat attributions as candidate reports, not official material, and expect interviewers to change the numbers. Each firm also has a <a href="firms/">plain guide page</a> to read or share.</p>
      <div class="chips filter">
        <a class="chip ${firm ? '' : 'on'}" href="#/bank">All (${QT.bank.length})</a>
        ${Object.entries(QT.firms).map(([k, v]) => { const n = QT.bank.filter((b) => b.firm === k).length; return n ? `<a class="chip ${firm === k ? 'on' : ''}" href="#/bank/${k}">${v.name} (${n})</a>` : ''; }).join('')}
      </div>
      ${F ? `<details class="card intel" ${window.innerWidth > 760 ? 'open' : ''}><summary><b>How ${F.name} interviews</b> (as reported)</summary>
        <ul>${F.process.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="small">Sources: ${F.sources.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`).join(' · ')}</p></details>` : ''}
      <div class="row" style="margin:14px 0">
        <a class="btn" href="#/mock${firm ? '/' + firm : ''}">Mock interview${F ? `: ${F.name}` : ''} (5 questions)</a>
        <span class="small">${U.bankDone()}/${QT.bank.length} completed</span>
      </div>
      <div class="qlist">
        ${list.map((b) => { const p = U.bankProgress(b); return `
          <a class="card qitem" href="#/iq/${b.id}">
            <div class="row" style="gap:6px">${firmBadge(b)}<span class="small">${b.role} · ${b.stage} · ${b.cat}</span>${b.kind === 'guide' ? '<span class="chip">prep-guide format</span>' : ''}</div>
            <div class="qtext">${plain(b.q)}</div>
            <div class="meta"><span>${b.open ? 'open-ended' : `${b.parts.length} part${b.parts.length > 1 ? 's' : ''}`}</span><span>${p.answered === p.total ? `✓ ${p.right}/${p.total}` : p.answered ? `${p.answered}/${p.total} done` : ''}</span></div>
          </a>`; }).join('')}
      </div>`;
  }

  function question(el, id) {
    const b = QT.bankById(id);
    if (!b) return bank(el);
    const same = QT.bank.filter((x) => x.firm === b.firm), next = same[(same.indexOf(b) + 1) % same.length];
    el.innerHTML = `
      <a class="back" href="#/bank/${b.firm}">← ${QT.firms[b.firm].name} questions</a>
      <h1 class="q-title">${QT.firms[b.firm].name}: ${b.cat}</h1>
      <div class="row" style="gap:6px;margin-bottom:6px"><span class="small">${b.role} · ${b.stage}</span></div>
      <p class="small">${b.kind === 'reported' ? 'Reported by a candidate' : 'Common format from prep guides (not verified as asked at one firm)'} · source: <a href="${b.src[1]}" target="_blank" rel="noopener">${b.src[0]}</a></p>
      ${b.note ? `<div class="card note">${b.note}</div>` : ''}
      <div id="qbox"></div>
      ${b.followups?.length ? `<h2>Interviewers may push further</h2><ul class="followups">${b.followups.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/talk/${b.id}">Practise it out loud</a><a class="btn ghost" href="#/iq/${next.id}">Next ${QT.firms[b.firm].name} question →</a></div>`;
    const box = el.querySelector('#qbox');
    if (b.open) return openCard(box, b);
    U.questionCard(box, bankSource([b]), (bx, r) => {
      bx.innerHTML = `<div class="card"><h3>Done: ${r.right}/${r.solved} parts correct</h3>
        <p class="small">Now answer it again out loud as if to an interviewer: state your approach first, then the numbers, then sanity-check the result.</p>
        <div class="row"><a class="btn" href="#/talk/${b.id}">Practise it out loud</a><button class="ghost" id="redo">Try again</button></div></div>`;
      bx.querySelector('#redo').addEventListener('click', () => QT.route());
    });
  }

  // Open-ended questions: think, reveal a model answer, then self-grade.
  function openCard(box, b) {
    box.innerHTML = `
      <div class="card">
        <div class="question">${b.q}</div>
        <p class="small">Take 2–3 minutes and talk it through out loud (or jot bullet points), then compare.</p>
        <button id="reveal">Reveal model answer</button>
        <div id="model" hidden>
          <div class="solution">${b.open.model}</div>
          <div class="row" style="margin-top:12px"><span class="small">How did you do?</span>
            <button class="ghost" data-ok="1">Covered the key points</button><button class="ghost" data-ok="0">Missed some</button></div>
        </div>
      </div>`;
    box.querySelector('#reveal').addEventListener('click', (e) => {
      e.target.hidden = true;
      box.querySelector('#model').hidden = false;
    });
    box.querySelectorAll('[data-ok]').forEach((btn) => btn.addEventListener('click', () => {
      U.recordBank(b.id, 0, btn.dataset.ok === '1');
      btn.parentElement.innerHTML = `<span class="small">Saved. Try it again in a few days.</span>`;
    }));
  }

  function mock(el, firmArg) {
    const firm = knownFirm(firmArg);
    const pool = QT.bank.filter((b) => b.parts && (!firm || b.firm === firm));
    const pick = QT.rand.shuffle(pool).slice(0, 5);
    if (!pick.length) {
      el.innerHTML = `<a class="back" href="#/bank">← Interview questions</a><h1>Mock interview</h1><div class="card"><p style="margin-top:0">There are no numeric questions for this firm yet.</p><a class="btn" href="#/mock">Mock interview with all firms</a></div>`;
      return;
    }
    const start = Date.now();
    el.innerHTML = `
      <a class="back" href="#/bank${firm ? '/' + firm : ''}">← Interview questions</a>
      <h1>Mock interview${firm ? `: ${QT.firms[firm].name}` : ''}</h1>
      <div class="session"><span>${pick.length} questions · talk through each one out loud before you type</span><span class="mono" id="mock-clock">0:00</span></div>
      <div id="qbox"></div>`;
    const clock = el.querySelector('#mock-clock');
    const t = setInterval(() => { const s = Math.floor((Date.now() - start) / 1000); clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 500);
    QT.cleanup = () => clearInterval(t);
    U.questionCard(el.querySelector('#qbox'), bankSource(pick, (i) => `Q${i + 1}/${pick.length}`), (box, r) => {
      clearInterval(t);
      box.innerHTML = `<div class="card">
        <h3>Mock complete: ${r.right}/${r.solved} parts correct in ${clock.textContent}</h3>
        <p>Jane Street's own advice for its trading interviews is a good self-review checklist. Did you:</p>
        <ul><li><b>Approach methodically:</b> state a plan before calculating?</li><li><b>Communicate clearly:</b> could an interviewer follow every step?</li><li><b>Correct mistakes:</b> did you sanity-check answers and fix errors yourself?</li><li><b>Ask why:</b> did you clarify ambiguous rules before starting?</li></ul>
        <p class="small">Source: <a href="https://www.janestreet.com/trading-interviews/" target="_blank" rel="noopener">janestreet.com/trading-interviews</a></p>
        <div class="row"><button id="again">Another mock</button><a class="btn ghost" href="#/bank${firm ? '/' + firm : ''}">Back to questions</a></div></div>`;
      box.querySelector('#again').addEventListener('click', () => QT.route());
    });
  }

  QT.views = Object.assign(QT.views || {}, { bank, iq: question, mock });
})();
