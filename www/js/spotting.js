// Learning to spot bugs (#/code/screening/spot), content in spotting-content.js.
//   #/code/screening/spot          the method, the bug families and their tells, your accuracy
//   #/code/screening/spot/mix      10 snippets, the ones you've missed or not seen first
//   #/code/screening/spot/<family> every snippet in one family
//   #/code/screening/spot/trace    "run it in your head": what does this print?
// In a drill you tap the line(s) you would flag, or say the code looks fine, then see the tell,
// why it matters and the fix. Results: state.code.spot / .trace (last 10 per item) and
// state.code.spotLog (one entry per finished drill).
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const P = QT.spotting;
  const famName = (id) => P.famById(id)?.[1] || id;
  const codeBlock = (code) => `<pre class="sc-code" tabindex="0"><code>${code.split('\n').map((l, i) => `<span class="sc-ln" aria-hidden="true">${i + 1}</span>${esc(l)}`).join('\n')}</code></pre>`;
  const hist = (id) => store.get().code.spot[id] || [];
  const thist = (id) => store.get().code.trace[id] || [];
  const famStats = (f) => {
    const r = P.byFam(f).flatMap((x) => hist(x.id).slice(-3));
    return r.length ? { n: r.length, right: r.filter(Boolean).length } : null;
  };

  function hub(el) {
    const log = store.get().code.spotLog, last = log[log.length - 1];
    el.innerHTML = `
      <a class="back" href="#/code/screening">← Tech screening</a>
      <h1>Learning to spot bugs</h1>
      <p class="lede">Good reviewers don't read code hoping a bug jumps out. They read it with a method, and they know the handful of patterns that cause most real problems, each with a <b>tell</b>: something on the page that should make you slow down. Learn the method, then train your eye on short snippets until the tells are automatic.</p>
      <div class="row" style="margin:12px 0;gap:8px;flex-wrap:wrap"><a class="btn" href="#/code/screening/spot/mix">Spot the bug: 10 snippets</a><a class="btn ghost" href="#/code/screening/spot/trace">Run it in your head: ${P.TRACES.length} questions</a>${last ? `<span class="small">Last drill: ${last.right} of ${last.n}</span>` : ''}</div>
      <h2>How to read code for bugs</h2>
      <div class="card"><ol class="sp-habits" style="margin-top:0">${P.HABITS.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol></div>
      <h2>The bug families and their tells</h2>
      <p class="small">Most bugs found in a code review fall into a few families. For each one, learn what it looks like on the page and the question that exposes it. Your score is from your last three tries at each snippet.</p>
      <div class="sp-fams">${P.FAMILIES.map(([id, name, tell, q]) => {
        const st = famStats(id), n = P.byFam(id).length;
        return `<div class="card sp-fam"><h3>${esc(name)}</h3>
          <p class="small"><b>The tell:</b> ${esc(tell)}</p>
          <p class="small"><b>Ask:</b> ${esc(q)}</p>
          <div class="row" style="justify-content:space-between;align-items:center"><a class="btn ghost" href="#/code/screening/spot/${id}">Drill (${n})</a><span class="small">${st ? `${st.right} of ${st.n} right` : 'not tried'}</span></div></div>`;
      }).join('')}</div>
      <p class="small">Some snippets have nothing wrong with them: saying "I checked the boundaries and this is fine" is part of the skill. Every planted bug is checked by running it: the original fails a test and the fix passes it.</p>`;
  }

  // The order for a mixed drill: never seen, then most recently missed, then the rest.
  function pickMix(n) {
    const score = (x) => { const h = hist(x.id); return h.length === 0 ? 0 : h[h.length - 1] ? 2 + Math.random() : 1 + Math.random(); };
    const items = QT.rand.shuffle([...P.ITEMS]).sort((a, b) => score(a) - score(b)).slice(0, n);
    return QT.rand.shuffle(items);
  }

  function drill(el, which) {
    const fam = which !== 'mix' && P.famById(which);
    const items = fam ? QT.rand.shuffle([...P.byFam(which)]) : pickMix(10);
    const results = [];
    let at = 0;
    const title = fam ? fam[1] : 'Spot the bug';

    function show() {
      const x = items[at], lines = x.code.split('\n'), picked = new Set();
      el.innerHTML = `
        <a class="back" href="#/code/screening/spot">← Learning to spot bugs</a>
        <h1>${esc(title)}</h1>
        <div class="session"><span>${at + 1} of ${items.length}</span><span>${results.filter((r) => r.ok).length} right</span></div>
        <div class="card"><span class="eyebrow">What it's for</span><p style="margin-bottom:0">${esc(x.ctx)}</p></div>
        <p class="small">Tap the line or lines you would flag in a review, then check. If nothing is wrong, say so.</p>
        <div class="sp-code" role="group" aria-label="The code: select the lines with a problem">${lines.map((l, i) => `<button type="button" class="sp-line" data-ln="${i + 1}" aria-pressed="false"><span class="sc-ln">${i + 1}</span><span class="sp-text">${esc(l) || ' '}</span></button>`).join('')}</div>
        <div class="row" style="gap:8px;margin-top:10px"><button type="button" id="sp-check" disabled>Check these lines</button><button type="button" class="ghost" id="sp-fine">Looks fine to me</button></div>
        <div id="sp-result" aria-live="polite"></div>`;
      const $ = (s) => el.querySelector(s);
      el.querySelectorAll('.sp-line').forEach((b) => b.addEventListener('click', () => {
        const n = +b.dataset.ln;
        if (picked.has(n)) picked.delete(n); else picked.add(n);
        b.setAttribute('aria-pressed', String(picked.has(n)));
        $('#sp-check').disabled = !picked.size;
      }));
      const answer = (fine) => {
        const bad = new Set(x.bad), sel = [...picked].sort((a, b) => a - b);
        const hits = sel.filter((n) => bad.has(n)), extra = sel.filter((n) => !bad.has(n));
        const ok = x.bad.length ? !fine && hits.length > 0 && extra.length <= 1 : fine;
        results.push({ id: x.id, fam: x.fam, ok });
        const all = store.get().code;
        all.spot[x.id] = [...hist(x.id), ok ? 1 : 0].slice(-10);
        store.touchDay();
        store.save();
        el.querySelectorAll('.sp-line').forEach((b) => {
          const n = +b.dataset.ln;
          b.disabled = true;
          if (bad.has(n)) b.classList.add('is-bad');
          if (picked.has(n) && !bad.has(n)) b.classList.add('is-miss');
        });
        $('#sp-check').disabled = true;
        $('#sp-fine').disabled = true;
        const verdict = !x.bad.length
          ? (fine ? 'Right: nothing to fix here.' : `Nothing was wrong here. You flagged line${sel.length > 1 ? 's' : ''} ${sel.join(', ')}.`)
          : fine ? `There is a problem, on line${x.bad.length > 1 ? 's' : ''} ${x.bad.join(' and ')}.`
            : !hits.length ? `Not quite: the problem is on line${x.bad.length > 1 ? 's' : ''} ${x.bad.join(' and ')}.`
              : extra.length ? `Found it, on line ${hits.join(' and ')}. Line${extra.length > 1 ? 's' : ''} ${extra.join(', ')} ${extra.length > 1 ? 'were' : 'was'} fine.${ok ? '' : ' Flagging many lines to catch one would cost you in an interview.'}`
                : `Right: line${hits.length > 1 ? 's' : ''} ${hits.join(' and ')}.`;
        const F = P.famById(x.fam);
        $('#sp-result').innerHTML = `
          <div class="card sp-reveal ${ok ? 'ok' : 'no'}">
            <p style="margin-top:0"><b>${esc(verdict)}</b> <span class="chip">${esc(famName(x.fam))}</span></p>
            <p><b>The tell:</b> ${esc(x.tell)}</p>
            <p><b>Why it matters:</b> ${esc(x.why)}</p>
            ${F ? `<p class="small"><b>Next time, ask:</b> ${esc(F[3])}</p>` : ''}
            ${x.fix ? `<details><summary><b>The fix</b></summary>${codeBlock(x.fix)}</details>` : ''}
          </div>
          <button type="button" id="sp-next">${at + 1 < items.length ? 'Next snippet' : 'See how you did'}</button>`;
        $('#sp-next').addEventListener('click', () => { at++; if (at < items.length) show(); else finish(); });
        $('#sp-next').focus();
      };
      $('#sp-check').addEventListener('click', () => answer(false));
      $('#sp-fine').addEventListener('click', () => answer(true));
    }

    function finish() {
      const right = results.filter((r) => r.ok).length, all = store.get().code;
      all.spotLog = [...all.spotLog, { date: new Date().toISOString(), n: results.length, right }].slice(-60);
      store.save();
      const missed = [...new Set(results.filter((r) => !r.ok).map((r) => r.fam))];
      el.innerHTML = `
        <a class="back" href="#/code/screening/spot">← Learning to spot bugs</a>
        <h1>${esc(title)}: ${right} of ${results.length}</h1>
        <div class="card">${missed.length ? `<p style="margin-top:0">Families to look at again: ${missed.map((f) => `<a href="#/code/screening/spot/${f}">${esc(famName(f))}</a>`).join(', ')}. Reread their tells on the main page, then drill them.</p>` : '<p style="margin-top:0">Every one right. Now try a full review, where you also explain the impact and the fix out loud.</p>'}
          <div class="row" style="gap:8px"><a class="btn" href="#/code/screening/spot/${fam ? which : 'mix'}">Again</a><a class="btn ghost" href="#/code/screening">A full code review</a></div></div>`;
    }
    show();
  }

  // "Run it in your head": predict what the code prints.
  const norm = (s) => String(s).trim().replace(/"/g, "'").replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\[\s*/g, '[').replace(/\s*\]/g, ']').toLowerCase();
  function trace(el) {
    const items = QT.rand.shuffle([...P.TRACES]), results = [];
    let at = 0;
    function show() {
      const x = items[at];
      el.innerHTML = `
        <a class="back" href="#/code/screening/spot">← Learning to spot bugs</a>
        <h1>Run it in your head</h1>
        <div class="session"><span>${at + 1} of ${items.length}</span><span>${results.filter(Boolean).length} right</span></div>
        <p class="small">What does this print? Trace it line by line before you answer. Tracing like this is how you catch bugs when reading code in an interview.</p>
        ${codeBlock(x.code)}
        <form class="answer-row" id="tr-form"><input type="text" id="tr-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="What it prints" placeholder="What it prints"><button>Check</button></form>
        <div id="tr-result" aria-live="polite"></div>`;
      const $ = (s) => el.querySelector(s);
      $('#tr-in').focus();
      $('#tr-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if ($('#tr-in').disabled) return;
        const ok = norm($('#tr-in').value) === norm(x.out);
        results.push(ok);
        const all = store.get().code;
        all.trace[x.id] = [...thist(x.id), ok ? 1 : 0].slice(-10);
        store.touchDay();
        store.save();
        $('#tr-in').disabled = true;
        $('#tr-result').innerHTML = `<div class="card sp-reveal ${ok ? 'ok' : 'no'}"><p style="margin-top:0"><b>${ok ? 'Right.' : 'Not quite.'}</b> It prints <code>${esc(x.out)}</code>. <span class="chip">${esc(famName(x.fam))}</span></p><p style="margin-bottom:0">${esc(x.why)}</p></div>
          <button type="button" id="tr-next">${at + 1 < items.length ? 'Next' : 'See how you did'}</button>`;
        $('#tr-next').addEventListener('click', () => {
          at++;
          if (at < items.length) return show();
          el.innerHTML = `<a class="back" href="#/code/screening/spot">← Learning to spot bugs</a><h1>Run it in your head: ${results.filter(Boolean).length} of ${results.length}</h1>
            <div class="card"><p style="margin-top:0">Each of these is a behaviour behind a real bug family. When you got one wrong, look at the family's tell: that's the pattern to slow down for in a review.</p><div class="row" style="gap:8px"><a class="btn" href="#/code/screening/spot/trace">Again</a><a class="btn ghost" href="#/code/screening/spot/mix">Spot the bug</a></div></div>`;
        });
        $('#tr-next').focus();
      });
    }
    show();
  }

  QT.spottingView = (el, which) => {
    if (which === 'trace') return trace(el);
    if (which === 'mix' || (which && P.famById(which))) return drill(el, which);
    return hub(el);
  };
  QT.spottingView.norm = norm;
})();
