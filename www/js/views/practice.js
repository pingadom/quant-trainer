// Practice: the topic list, single-topic practice, mixed practice and the mistakes deck.
(function () {
  const store = QT.store, U = QT.ui;

  function practice(el) {
    el.innerHTML = `
      <h1>Practice</h1>
      <div class="shortcuts two">
        <a class="card shortcut primary" href="#/review"><b>Mixed practice</b><span>Questions from every topic, weighted towards your weak spots</span></a>
        <a class="card shortcut" href="#/mistakes"><b>Mistakes to review <span class="badge" data-badge="mistakes" hidden></span></b><span>${QT.mistakes.all().length ? `${QT.mistakes.due().length} due now · ${QT.mistakes.all().length} saved` : 'Questions you get wrong come back here'}</span></a>
      </div>
      <p class="small">Or pick a topic. Every question is freshly generated, and the bar shows your recent accuracy.</p>
      ${Object.entries(U.TRACKS).map(([k, label]) => `
        <h2>${label}</h2>
        <div class="grid">${QT.topics.filter((t) => t.track === k).map((t) => U.topicCard(t, QT.mastery(t.id))).join('')}</div>`).join('')}`;
  }

  function topic(el, id) {
    const t = QT.topicById(id);
    if (!t) return practice(el);
    el.innerHTML = `
      <a class="back" href="#/practice">← Practice</a>
      <h1>${t.name}</h1>
      <p class="lede">${U.TRACKS[t.track]} · ${t.blurb}</p>
      <details class="notes"><summary>Key formulas</summary>${t.notes}</details>
      <div id="qbox"></div>`;
    U.questionCard(el.querySelector('#qbox'), QT.coach.source(QT.coach.allIds([t]), { showTopic: false }));
  }

  function review(el, track) {
    const pool = QT.topics.filter((t) => !U.TRACKS[track] || t.track === track);
    el.innerHTML = `
      <h1>Mixed practice</h1>
      <p class="lede">Questions from every topic, chosen for you: weaker skills come up more, and a miss is followed by a similar question.</p>
      <div class="seg" role="tablist" aria-label="Which questions">
        ${[['', 'All topics'], ['interview', 'Interview'], ['foundations', 'Foundations']].map(([k, l]) => `<a role="tab" aria-selected="${(track || '') === k}" class="${(track || '') === k ? 'on' : ''}" href="#/review${k ? '/' + k : ''}">${l}</a>`).join('')}
      </div>
      <div id="qbox"></div>`;
    U.questionCard(el.querySelector('#qbox'), QT.coach.source(QT.coach.allIds(pool)));
  }

  function mistakes(el, mode) {
    const all = QT.mistakes.all(), due = QT.mistakes.due();
    const reviewing = mode === 'due' ? due : mode === 'all' ? [...all] : null;
    if (reviewing && reviewing.length) {
      el.innerHTML = `
        <a class="back" href="#/mistakes">← Mistakes to review</a>
        <h1>Reviewing ${reviewing.length} mistake${reviewing.length > 1 ? 's' : ''}</h1>
        <p class="lede">Get one right and it comes back later (${QT.mistakes.INTERVALS.slice(1).join(', ')} days). Get it right at every step and it's retired.</p>
        <div id="qbox"></div>`;
      let k = 0;
      const source = () => {
        if (k >= reviewing.length) return null;
        const m = reviewing[k++];
        return { tag: `${m.tag} · review`, p: m.p, isReview: true, record: (ok) => QT.mistakes.review(m, ok) };
      };
      U.questionCard(el.querySelector('#qbox'), source, (box, r) => {
        box.innerHTML = `<div class="card"><h3>Review done: ${r.right}/${r.solved} correct</h3><p class="small">${QT.mistakes.all().length} card(s) left in your deck; ${store.get().mastered || 0} mastered so far.</p><a class="btn" href="#/mistakes">Back to deck</a></div>`;
      });
      return;
    }
    const fmtDue = (t) => {
      const d = Math.ceil((t - Date.now()) / 864e5);
      return d <= 0 ? 'due now' : d === 1 ? 'tomorrow' : `in ${d} days`;
    };
    el.innerHTML = `
      <h1>Mistakes to review</h1>
      <p class="lede">Every problem you get wrong is saved here exactly as you saw it. It returns after 1 day; each correct review pushes it out further (3, 7, 21 days) until it's retired. Revisiting mistakes at growing intervals is one of the most effective ways to learn.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${due.length}</div><div class="k">due now</div></div>
        <div class="tile"><div class="v">${all.length}</div><div class="k">in deck</div></div>
        <div class="tile"><div class="v">${store.get().mastered || 0}</div><div class="k">mastered</div></div>
      </div>
      ${all.length ? `<div class="row" style="margin:6px 0 18px">
          ${due.length ? `<a class="btn" href="#/mistakes/due">Review ${due.length} due</a>` : ''}
          <a class="btn ${due.length ? 'ghost' : ''}" href="#/mistakes/all">Review all ${all.length} now</a>
        </div>
        <div class="card table-wrap"><table>
          <tr><th>Problem</th><th>Topic</th><th class="num">Next review</th></tr>
          ${[...all].sort((a, b) => a.due - b.due).map((m) => `<tr><td>${U.esc(m.key.slice(0, 90))}${m.key.length > 90 ? '…' : ''}</td><td class="small">${U.esc(m.tag)}</td><td class="num">${fmtDue(m.due)}</td></tr>`).join('')}
        </table></div>`
      : `<div class="card"><p style="margin:0">Your deck is empty. Wrong answers in practice, interview questions and case studies land here automatically.</p></div>`}`;
  }

  QT.views = Object.assign(QT.views || {}, { practice, topic, review, mistakes });
})();
