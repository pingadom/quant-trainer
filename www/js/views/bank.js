// Interview questions: browse by firm, answer a question, open-ended self-grading, mock interviews.
(function () {
  // A mock needs a few numeric questions; firms with fewer get the all-firms mock instead.
  function mockLink(firm, F) {
    const n = Math.min(5, QT.bank.filter((b) => b.parts && (!firm || b.firm === firm)).length);
    return firm && n >= 3
      ? `<a class="btn" href="#/mock/${firm}">Mock interview: ${F.name} (${n} questions)</a>`
      : `<a class="btn" href="#/mock/all">Mock interview (5 questions${firm ? ' from all firms' : ''})</a>`;
  }

  const U = QT.ui;
  const firmBadge = (b) => `<span class="tag firm">${QT.firms[b.firm].name}</span>`;
  const plain = (html) => html.replace(/<[^>]+>/g, '');

  // Parts of one or more bank questions, fed to the question card in order.
  function bankSource(items, label, onRecord = () => {}) {
    const queue = [];
    items.forEach((b, qi) => (b.parts || []).forEach((part, pi) => queue.push({ b, part, pi, qi })));
    let k = 0;
    return () => {
      if (k >= queue.length) return null;
      const { b, part, pi, qi } = queue[k++];
      return {
        tag: `${label ? label(qi) + ' · ' : ''}${QT.firms[b.firm].name}${b.parts.length > 1 ? ` · part ${pi + 1} of ${b.parts.length}` : ''}${part.ext ? ' · our follow-up' : ''}`,
        p: { ...part, q: `<p class="stem">${b.q}</p><p>${part.q}</p>` },
        record: (ok, hints) => {
          U.recordBank(b.id, pi, ok, hints);
          onRecord(ok, hints);
        },
      };
    };
  }

  // An unknown firm in a link (typo, or a firm since removed) shows every question instead of nothing.
  const knownFirm = (firm) => (firm && Object.prototype.hasOwnProperty.call(QT.firms, firm) ? firm : undefined);

  const FILTERS = { all: 'All', todo: 'To do', unsure: 'Unsure', done: 'Done' };
  const MARK_LABEL = { done: 'Done', unsure: 'Unsure', todo: 'To do' };

  // Tick and flag buttons for one question. Pressing the current status clears it to "to do".
  const markButtons = (b, s) => `
    <button type="button" class="qmark done" data-mark="done" data-id="${b.id}" aria-pressed="${s === 'done'}" title="${s === 'done' ? 'Done: press to untick' : 'Tick off as done'}" aria-label="Done">✓</button>
    <button type="button" class="qmark unsure" data-mark="unsure" data-id="${b.id}" aria-pressed="${s === 'unsure'}" title="${s === 'unsure' ? 'Unsure: press to clear' : 'Flag as unsure, to come back to'}" aria-label="Unsure">?</button>`;
  const toggleMark = (id, mark) => U.setBankMark(id, U.bankStatus(QT.bankById(id)) === mark ? 'todo' : mark);

  // Search, topic and difficulty filters for the list, kept while you tick questions off. The list
  // shows PAGE questions at a time.
  const PAGE = 60;
  const view = { key: '', q: '', cat: '', lvl: '', limit: PAGE };
  const norm = (t) => t.toLowerCase().replace(/<[^>]+>/g, ' ');
  const matches = (b) => (!view.cat || b.cat === view.cat) && (!view.lvl || b.role === view.lvl)
    && (!view.q || norm(`${b.q} ${b.title || ''} ${b.cat} ${(b.parts || []).map((x) => x.q).join(' ')} ${QT.firms[b.firm].name}`).includes(view.q.toLowerCase().trim()));

  function bank(el, firmArg, filterArg) {
    // Plain "Interview questions" opens on the firm you're preparing for; "all" shows every firm.
    const firm = firmArg === undefined || firmArg === '' ? U.targetFirm() || undefined : knownFirm(firmArg);
    const target = U.targetFirm();
    const filter = Object.prototype.hasOwnProperty.call(FILTERS, filterArg) ? filterArg : 'all';
    const scope = QT.bank.filter((b) => !firm || b.firm === firm);
    const list = filter === 'all' ? scope : scope.filter((b) => U.bankStatus(b) === filter);
    const key = `${firmArg}/${filterArg}`;
    if (view.key !== key) { view.key = key; view.limit = PAGE; }
    const cats = [...new Set(scope.map((b) => b.cat))].sort();
    if (view.cat && !cats.includes(view.cat)) view.cat = '';
    const hasLevels = scope.some((b) => b.firm === 'library');
    const F = firm && QT.firms[firm];
    const c = U.bankCounts(scope), base = `#/bank/${firm || 'all'}`;
    const pct = (n) => (scope.length ? (100 * n) / scope.length : 0);
    el.innerHTML = `
      <h1>Interview questions</h1>
      <p class="lede">Questions candidates report being asked at trading firms, plus a large <a href="#/bank/library">question library</a> of general puzzles, all rewritten in our own words with hints, worked solutions and a link to the source. Treat firm attributions as candidate reports, not official material, and expect interviewers to change the numbers. Each firm also has a <a href="firms/">plain guide page</a> to read or share.</p>
      <div class="firm-pick">
        <label for="firm-sel">Firm</label>
        <select id="firm-sel">
          <option value="all">All firms (${U.bankCounts().done}/${QT.bank.length} done)</option>
          ${Object.entries(QT.firms).map(([k, v]) => { const qs = QT.bank.filter((b) => b.firm === k); return qs.length ? `<option value="${k}" ${firm === k ? 'selected' : ''}>${v.name} (${U.bankCounts(qs).done}/${qs.length} done)</option>` : ''; }).join('')}
        </select>
        ${firm ? `<a class="chip chip-btn" href="#/bank/all/${filter}">All firms</a>` : ''}
        ${target && target !== firm ? `<a class="chip chip-btn" href="#/bank/${target}/${filter}">Your firm: ${QT.firms[target].name}</a>` : ''}
      </div>
      ${F ? `<details class="card intel" ${window.innerWidth > 760 ? 'open' : ''}><summary>${firm === 'library' ? '<b>About the question library</b>' : `<b>How ${F.name} interviews</b> (as reported)`}</summary>
        <ul>${F.process.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="small">Sources: ${F.sources.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`).join(' · ')}</p></details>` : ''}
      <div class="row" style="margin:14px 0">${mockLink(firm, F)}${firm && firm !== 'library' ? ` <a class="btn ghost" href="#/screen/${firm}">Phone-screen mock (45 min)</a>` : ''}</div>
      <div class="bank-progress card">
        <div class="row" style="justify-content:space-between"><b>${c.done} of ${scope.length} done${F ? ` at ${F.name}` : ''}</b><span class="small">${c.unsure ? `${c.unsure} unsure · ` : ''}${c.todo} to do</span></div>
        <div class="bar stack" role="progressbar" aria-label="Questions done" aria-valuenow="${Math.round(pct(c.done))}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct(c.done)}%"></i><i class="unsure" style="width:${pct(c.unsure)}%"></i></div>
        <p class="small" style="margin:6px 0 0">Tick a question off with ✓, or flag it ? to come back to. Getting every part right without hints ticks it for you; a wrong part, or using hints, flags it unsure.</p>
      </div>
      <div class="chips filter" role="group" aria-label="Show">
        ${Object.entries(FILTERS).map(([k, label]) => `<a class="chip ${filter === k ? 'on' : ''}" href="${base}/${k}">${label} (${k === 'all' ? scope.length : c[k]})</a>`).join('')}
      </div>
      <div class="bank-find">
        <input type="search" id="bank-q" placeholder="Search questions" aria-label="Search these questions" value="${QT.escapeHtml(view.q)}">
        <select id="bank-cat" aria-label="Topic"><option value="">All topics</option>${cats.map((k) => `<option value="${QT.escapeHtml(k)}" ${view.cat === k ? 'selected' : ''}>${k} (${list.filter((b) => b.cat === k).length})</option>`).join('')}</select>
        ${hasLevels ? `<select id="bank-lvl" aria-label="Difficulty"><option value="">Any difficulty</option>${['Easy', 'Medium', 'Hard'].map((k) => `<option ${view.lvl === k ? 'selected' : ''}>${k}</option>`).join('')}</select>` : ''}
        <span class="small" id="bank-count" aria-live="polite"></span>
      </div>
      <div class="qlist" id="qlist"></div>
      <div id="bank-more"></div>`;
    const rowHtml = (b) => { const p = U.bankProgress(b), s = U.bankStatus(b); return `
          <div class="qrow s-${s}">
            <div class="qmarks">${markButtons(b, s)}</div>
            <a class="card qitem" href="#/iq/${b.id}">
              <div class="row" style="gap:6px">${firmBadge(b)}<span class="small">${b.role} · ${b.stage} · ${b.cat}</span>${b.kind === 'guide' && b.firm !== 'library' ? '<span class="chip">practice question</span>' : ''}${s !== 'todo' ? `<span class="status-tag ${s}">${MARK_LABEL[s]}</span>` : ''}</div>
              <div class="qtext">${plain(b.q)}</div>
              <div class="meta"><span>${b.open ? 'open-ended' : `${b.parts.length} part${b.parts.length > 1 ? 's' : ''}`}</span><span>${p.answered ? `${p.right}/${p.total} right` : ''}</span></div>
            </a>
          </div>`; };
    const empty = `<p class="small">${filter === 'unsure' ? 'Nothing flagged unsure.' : filter === 'done' ? 'Nothing ticked off yet.' : 'Nothing left to do here.'} <a href="${base}/all">Show all</a></p>`;
    const drawList = () => {
      const shown = list.filter(matches), page = shown.slice(0, view.limit);
      el.querySelector('#qlist').innerHTML = !list.length ? empty : page.length ? page.map(rowHtml).join('') : '<p class="small">No questions match. Try another search or topic.</p>';
      el.querySelector('#bank-count').textContent = list.length && shown.length !== list.length ? `${shown.length} of ${list.length} match` : '';
      el.querySelector('#bank-more').innerHTML = shown.length > page.length ? `<div class="row" style="margin-top:14px"><button type="button" class="ghost" id="bank-more-btn">Show ${Math.min(PAGE, shown.length - page.length)} more</button><span class="small">${page.length} of ${shown.length} shown</span></div>` : '';
    };
    drawList();
    let typing = null;
    el.querySelector('#bank-q').addEventListener('input', (e) => {
      clearTimeout(typing);
      typing = setTimeout(() => { view.q = e.target.value; view.limit = PAGE; drawList(); }, 150);
    });
    el.querySelector('#bank-cat').addEventListener('change', (e) => { view.cat = e.target.value; view.limit = PAGE; drawList(); });
    el.querySelector('#bank-lvl')?.addEventListener('change', (e) => { view.lvl = e.target.value; view.limit = PAGE; drawList(); });
    el.querySelector('#bank-more').addEventListener('click', (e) => {
      if (!e.target.closest('#bank-more-btn')) return;
      view.limit += PAGE;
      drawList();
    });
    el.querySelector('#firm-sel').addEventListener('change', (e) => {
      const k = e.target.value;
      // Choosing a firm makes it your target (unless your interview plan names one).
      if (k !== 'all' && !QT.store.get().plan) U.setTargetFirm(k);
      location.hash = `#/bank/${k}/${filter}`;
    });
    el.querySelector('#qlist').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mark]');
      if (!btn) return;
      toggleMark(btn.dataset.id, btn.dataset.mark);
      const y = window.scrollY;
      bank(el, firmArg, filterArg); // redraw the counts and the row
      window.scrollTo(0, y);
      el.querySelector(`[data-id="${btn.dataset.id}"][data-mark="${btn.dataset.mark}"]`)?.focus();
    });
  }

  function question(el, id) {
    const b = QT.bankById(id);
    if (!b) return bank(el);
    const same = QT.bank.filter((x) => x.firm === b.firm), next = same[(same.indexOf(b) + 1) % same.length];
    el.innerHTML = `
      <a class="back" href="#/bank/${b.firm}">← ${QT.firms[b.firm].name} questions</a>
      <h1 class="q-title">${b.title ? QT.escapeHtml(b.title) : `${QT.firms[b.firm].name}: ${b.cat}`}</h1>
      <div class="row" style="gap:6px;margin-bottom:6px"><span class="small">${b.role} · ${b.stage}</span></div>
      <p class="small">${b.kind === 'reported' ? 'Reported by a candidate' : 'Practice question in a common interview format (not reported from one firm)'} · source: <a href="${b.src[1]}" target="_blank" rel="noopener">${b.src[0]}</a></p>
      <div class="qstatus" id="qstatus"></div>
      ${b.note ? `<div class="card note">${b.note}</div>` : ''}
      <div id="qbox"></div>
      ${b.followups?.length ? `<h2>Interviewers may push further</h2><ul class="followups">${b.followups.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <div class="row" style="margin-top:18px"><a class="btn ghost" href="#/talk/${b.id}">Practise it out loud</a><a class="btn ghost" href="#/iq/${next.id}">Next ${QT.firms[b.firm].name} question →</a></div>`;
    const statusBox = el.querySelector('#qstatus');
    const drawStatus = () => {
      const s = U.bankStatus(b), other = QT.bank.find((x) => x !== b && U.bankStatus(x) === 'unsure');
      statusBox.innerHTML = `${markButtons(b, s)}<span class="small">${s === 'done' ? 'Done.' : s === 'unsure' ? 'Flagged unsure: it stays on your list to come back to.' : 'Tick it off when you can answer it cleanly, or flag it to come back to.'}</span>${other ? `<a class="small" href="#/iq/${other.id}">Next unsure question →</a>` : ''}`;
    };
    statusBox.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mark]');
      if (!btn) return;
      toggleMark(b.id, btn.dataset.mark);
      drawStatus();
      statusBox.querySelector(`[data-mark="${btn.dataset.mark}"]`).focus();
    });
    drawStatus();
    const box = el.querySelector('#qbox');
    if (b.open) return openCard(box, b, drawStatus);
    U.questionCard(box, bankSource([b], null, drawStatus), (bx, r) => {
      drawStatus();
      bx.innerHTML = `<div class="card"><h3>Done: ${r.right}/${r.solved} parts correct</h3>
        <p class="small">Now answer it again out loud as if to an interviewer: state your approach first, then the numbers, then sanity-check the result.</p>
        <div class="row"><a class="btn" href="#/talk/${b.id}">Practise it out loud</a><button class="ghost" id="redo">Try again</button></div></div>`;
      bx.querySelector('#redo').addEventListener('click', () => QT.route());
    });
  }

  // Open-ended questions: think, reveal a model answer, then self-grade.
  function openCard(box, b, onGraded = () => {}) {
    box.innerHTML = `
      <div class="card">
        <div class="question">${b.q}</div>
        <p class="small">Take 2–3 minutes and talk it through out loud (or jot bullet points), then compare.</p>
        ${U.hintBox(b.open.hints)}
        <button id="reveal">Reveal model answer</button>
        <div id="model" hidden>
          <div class="solution">${b.open.model}</div>
          <div class="row" style="margin-top:12px"><span class="small">How did you do?</span>
            <button class="ghost" data-ok="1">Covered the key points</button><button class="ghost" data-ok="0">Missed some</button></div>
        </div>
      </div>`;
    const hintsUsed = U.wireHints(box, b.open.hints || []);
    box.querySelector('#reveal').addEventListener('click', (e) => {
      box.querySelector('.hint-btn')?.setAttribute('hidden', '');
      e.target.hidden = true;
      box.querySelector('#model').hidden = false;
    });
    box.querySelectorAll('[data-ok]').forEach((btn) => btn.addEventListener('click', () => {
      U.recordBank(b.id, 0, btn.dataset.ok === '1', hintsUsed());
      btn.parentElement.innerHTML = `<span class="small">Saved. ${btn.dataset.ok === '1' ? 'Ticked off.' : 'Flagged unsure, so it comes back.'}</span>`;
      onGraded();
    }));
  }

  function mock(el, firmArg) {
    // Plain "Mock interview" uses your target firm when it has enough numeric questions.
    const tf = firmArg === undefined ? U.targetFirm() : null;
    const firm = knownFirm(firmArg) ?? (tf && QT.bank.filter((b) => b.parts && b.firm === tf).length >= 3 ? tf : undefined);
    const pool = QT.bank.filter((b) => b.parts && (!firm || b.firm === firm));
    const pick = QT.rand.shuffle(pool).slice(0, 5);
    if (!pick.length) {
      el.innerHTML = `<a class="back" href="#/bank">← Interview questions</a><h1>Mock interview</h1><div class="card"><p style="margin-top:0">There are no numeric questions for this firm yet.</p><a class="btn" href="#/mock/all">Mock interview with all firms</a></div>`;
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

  QT.bankSource = bankSource; // the phone-screen mock serves bank questions too
  QT.views = Object.assign(QT.views || {}, { bank, iq: question, mock });
})();
