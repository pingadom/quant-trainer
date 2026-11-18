// Data drills (#/code/data and #/code/data/<id>): NumPy, pandas and Polars exercises from
// data-drills.js, run against hidden tests in the browser's Python (js/code-worker.js, through
// QT.runPyDrill in sse.js). Your code, the number of runs and whether it passed are kept on this
// device in state.code.data.
(function () {
  const esc = (s) => QT.escapeHtml(String(s ?? ''));
  const store = QT.store, DD = () => QT.dataDrills;
  const recs = () => store.get().code.data;
  const chapterTitle = (id) => QT.hbChapters?.[id]?.title || id;

  QT.dataView = (el, id) => {
    const d = id && DD().byId[id];
    return d ? drill(el, d) : hub(el);
  };

  function status(r) {
    if (r?.ok) return '<span class="status-tag done">Passed</span>';
    return r?.n ? `<span class="small">tried ${r.n} time${r.n > 1 ? 's' : ''}</span>` : '<span class="small">not started</span>';
  }

  function hub(el) {
    const R = recs(), items = DD().ITEMS, passed = items.filter((d) => R[d.id]?.ok).length;
    el.innerHTML = `
      <a class="back" href="#/code">← Coding</a>
      <h1>Data drills: NumPy, pandas and Polars</h1>
      <p class="lede">Short exercises on market-style data. Write a function, run it against hidden tests (worked examples, random data, edge cases and, for NumPy, a large input that catches Python loops), and compare with a model solution. Each drill links to the handbook chapter that teaches the idea.</p>
      <div class="tiles"><div class="tile"><div class="v">${passed}<span class="of">/${items.length}</span></div><div class="k">drills passed</div></div></div>
      ${DD().LIBS.map((L) => {
        const mine = items.filter((d) => d.lib === L.id), ch = mine[0]?.chapter;
        return `<h2>${esc(L.name)}</h2>
          <p class="small">${esc(L.blurb)}${ch ? ` Learn it first: <a href="#/devbook/${ch}">${esc(chapterTitle(ch))}</a>.` : ''}</p>
          <div class="menu">${mine.map((d) => `<a class="card" href="#/code/data/${d.id}"><b>${esc(d.title)}</b>${status(R[d.id])}</a>`).join('')}</div>`;
      }).join('')}
      <p class="small" style="margin-top:16px">Python runs in your browser using Pyodide, downloaded from the jsDelivr network the first time (about 13 MB, plus 12 MB for NumPy and pandas, and 14 MB more for Polars). The browser has numpy 2.0, pandas 2.2 and Polars 1.18; the model solutions also work on the newest versions. Your code stays on this device.</p>`;
  }

  function drill(el, d) {
    const items = DD().ITEMS, at = items.indexOf(d), next = items[at + 1];
    const rec = () => (recs()[d.id] ||= { code: '', n: 0, ok: 0, date: '' });
    el.innerHTML = `
      <a class="back" href="#/code/data">← Data drills</a>
      <h1>${esc(d.title)}</h1>
      <div class="row code-meta"><span class="chip">${esc(DD().LIBS.find((L) => L.id === d.lib).name)}</span><span id="dd-done">${recs()[d.id]?.ok ? '<span class="status-tag done">Passed</span>' : ''}</span></div>
      <div class="card code-statement">
        ${d.task}
        <p class="small">Learn it: <a href="#/devbook/${d.chapter}">${esc(chapterTitle(d.chapter))}</a></p>
      </div>
      <div class="card code-box">
        <div class="row code-bar"><span class="small">Python</span><button type="button" class="ghost" id="dd-reset">Reset code</button></div>
        <label for="dd-code" class="small">Your code</label>
        <textarea id="dd-code" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" rows="14"></textarea>
        <p class="small">Tab indents; press Esc first to move to the next control instead. Ctrl+Enter runs the tests. Your code is saved on this device as you type.</p>
        <div class="row"><button type="button" id="dd-run">Run the tests</button><button type="button" class="ghost" id="dd-hint">Hint</button><span class="small" id="dd-status" role="status"></span></div>
        <p class="small" id="dd-hint-text" hidden>${esc(d.hint)}</p>
        <div id="dd-tests" aria-live="polite"></div>
      </div>
      <details class="card" id="dd-sol"><summary><b>A model solution</b></summary><pre class="sc-code" tabindex="0"><code>${esc(d.sol)}</code></pre></details>
      <div class="row" style="margin-top:12px">${next ? `<a class="btn" href="#/code/data/${next.id}">Next drill: ${esc(next.title)} →</a>` : ''}<a class="btn ghost" href="#/code/data">All data drills</a></div>`;
    const $ = (s) => el.querySelector(s), box = $('#dd-code');
    box.value = recs()[d.id]?.code || d.starter;
    let saveTimer = null, escaped = false;
    box.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { rec().code = box.value; store.save(); }, 400);
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { escaped = true; return; }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#dd-run').click(); return; }
      if (e.key !== 'Tab' || e.shiftKey || escaped) { escaped = false; return; }
      e.preventDefault();
      box.setRangeText('    ', box.selectionStart, box.selectionEnd, 'end');
    });
    $('#dd-reset').addEventListener('click', () => {
      box.value = d.starter;
      rec().code = '';
      store.save();
    });
    $('#dd-hint').addEventListener('click', (e) => { $('#dd-hint-text').hidden = false; e.target.hidden = true; });
    $('#dd-run').addEventListener('click', async (e) => {
      e.target.disabled = true;
      const r0 = rec();
      r0.code = box.value;
      const r = await QT.runPyDrill(d.id, box.value, (t) => { if ($('#dd-status')) $('#dd-status').textContent = t; });
      if (!el.isConnected || !$('#dd-status')) return;
      $('#dd-status').textContent = '';
      e.target.disabled = false;
      const cases = r.cases || [], all = !r.err && cases.length > 0 && cases.every((c) => c[1]);
      $('#dd-tests').innerHTML = `${cases.map(([n, ok, why]) => `<div class="code-row ${ok ? '' : 'fail'}"><span class="${ok ? 'pos' : 'neg'}">${ok ? '✓' : '✗'}</span> ${esc(n)}${ok ? '' : `<br><span class="small">${esc(why)}</span>`}</div>`).join('')}${r.err ? `<pre class="code-view code-err" tabindex="0">${esc(r.err)}</pre>` : ''}${r.stdout ? `<pre class="code-view" tabindex="0">${esc(r.stdout)}</pre>` : ''}${all ? '<div class="fb ok">✓ All tests pass. Compare your code with the model solution below.</div>' : ''}`;
      r0.n += 1;
      r0.date = new Date().toISOString();
      if (all) {
        r0.ok = 1;
        $('#dd-done').innerHTML = '<span class="status-tag done">Passed</span>';
      }
      store.touchDay();
      store.save();
    });
  }
})();
