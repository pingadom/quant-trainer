// Coding: software engineering interview practice, starting with Optiver's SWE internship.
// Problems (js/code-problems.js) come with an editor that runs Python or JavaScript against the
// tests in a worker (js/code-worker.js), so an endless loop can't freeze the page. There is also a
// timed computer-science knowledge quiz (js/code-quiz.js). Saved in state.code: your code for
// each problem and language, which problems you solved, and quiz results.
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const C = QT.code, QZ = QT.codeQuiz;
  const LANGS = { py: 'Python', js: 'JavaScript' };
  const GD_INTERN = 'https://www.glassdoor.co.uk/Interview/Optiver-Software-Engineer-Intern-Interview-Questions-EI_IE243355.0,7_KO8,32.htm';
  const GD_INTERNSHIP = 'https://www.glassdoor.co.uk/Interview/Optiver-Software-Engineer-Internship-Interview-Questions-EI_IE243355.0,7_KO8,36.htm';
  const PROCESS = [
    '<b>Online assessment</b>, about three hours in all, which can be done in parts. A HackerRank coding section: one or two long problems where you fill in a class that handles a stream of events, in 75 to 120 minutes (C++, Java or Python in 2025; one 2024 report lists C++, C#, Java and Rust). A 20-minute multiple-choice test on data structures, operating systems, networking and C++. Then Zap-N: short reaction, memory and reasoning games.',
    '<b>Recruiter call</b>, 15 to 30 minutes: your projects, why Optiver, and sometimes what a market maker does.',
    '<b>Technical interviews</b>: building a data structure (a queue on an array, a deque), computer-science questions (TCP against UDP, Python against C++), and in recent reports reviewing or debugging a trading program for logical and performance bugs.',
    '<b>Final round</b>: more coding, system design (a low-latency trading system, a ticketing system) with networking and operating-system questions, and a behavioural interview.',
    'Candidates\' advice: read the long statements carefully, write your own edge-case tests (the visible ones are few), and say your reasoning out loud.',
  ];

  const state = () => store.get().code;
  const rec = (id) => state().p[id];
  const recOf = (id) => (state().p[id] ||= { py: '', js: '', solved: 0, subs: 0, first: false });
  const solvedCount = () => C.PROBLEMS.filter((P) => rec(P.id)?.solved).length;
  const quizBest = () => state().quiz.runs.reduce((b, r) => Math.max(b, r.right), -1);
  const groupName = (g) => C.GROUPS.find(([k]) => k === g)[1];
  const msText = (ms) => (ms === undefined || ms === null ? '' : ms < 1 ? '<1 ms' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);

  function render(el, a, b) {
    if (a === 'quiz') return quiz(el, b);
    const P = a && C.byId(a);
    if (P) return problem(el, P);
    list(el);
  }

  // ---------------------------------------------------------------- the list
  function list(el) {
    const best = quizBest();
    el.innerHTML = `
      <h1>Coding</h1>
      <p class="lede">Practice for software engineering interviews at trading firms, starting with Optiver's SWE internship. Write Python or JavaScript here and run it against the tests, including hidden random cases and a large one that catches slow solutions.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${solvedCount()}<span class="of">/${C.PROBLEMS.length}</span></div><div class="k">problems solved</div></div>
        <a class="tile" href="#/code/quiz"><div class="v">${best < 0 ? '–' : `${best}<span class="of">/${QZ.N}</span>`}</div><div class="k">best knowledge-quiz score</div></a>
      </div>
      <details class="card intel" ${window.innerWidth > 760 ? 'open' : ''}><summary><b>How Optiver's software engineering internship interviews run</b> (as reported, 2022–2026)</summary>
        <ul>${PROCESS.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="small">Sources: <a href="${GD_INTERN}" target="_blank" rel="noopener">Glassdoor: Optiver software engineer intern</a> · <a href="${GD_INTERNSHIP}" target="_blank" rel="noopener">Glassdoor: Optiver software engineer internship</a> · <a href="https://leetcode.com/discuss/topic/optiver/" target="_blank" rel="noopener">LeetCode Discuss: Optiver</a></p>
      </details>
      <div class="row" style="margin:14px 0"><a class="btn" href="#/code/quiz">Knowledge quiz: ${QZ.N} questions, ${QZ.MINUTES} minutes</a><a class="btn ghost" href="#/bank/optiver">System design and fundamentals questions</a></div>
      ${C.GROUPS.map(([g, title, about]) => `
        <h2>${title}</h2>
        <p class="small">${about}</p>
        <div class="menu">${C.PROBLEMS.filter((P) => P.group === g).map((P) => {
          const r = rec(P.id);
          const status = r?.solved ? `✓ solved${P.lc.length ? ' · LeetCode link unlocked' : ''}` : r?.subs ? `tried (${r.subs} submission${r.subs > 1 ? 's' : ''})` : r?.py || r?.js ? 'started' : 'not started';
          return `<a class="card" href="#/code/${P.id}"><b>${esc(P.title)}</b><span class="small">${P.diff} · ${P.tags.join(', ')}</span><span class="small">${status}</span></a>`;
        }).join('')}</div>`).join('')}
      <p class="small" style="margin-top:16px">Python runs in your browser using Pyodide, downloaded once (about 13 MB) from the jsDelivr network the first time you run Python. JavaScript needs no download and works offline. Your code stays on this device.</p>`;
  }

  // ---------------------------------------------------------------- one problem
  // The runner is kept between problems so Python only loads once; it is replaced if a test hangs.
  let worker = null, jobs = 0;
  const getWorker = () => (worker ||= new Worker('js/code-worker.js'));
  // A message already on its way can still arrive after terminate(), so stop listening first.
  const killWorker = () => {
    if (worker) {
      worker.onmessage = null;
      worker.terminate();
    }
    worker = null;
  };

  function problem(el, P) {
    let lang = state().lang, busy = false, watchdog = null, saveTimer = null, hints = 0, escaped = false;
    const voidMethod = (m) => P.kind === 'cls' && P.sig.methods.some(([n, , ret]) => n === m && !ret);
    const r0 = rec(P.id);
    el.innerHTML = `
      <a class="back" href="#/code">← Coding</a>
      <h1>${esc(P.title)}</h1>
      <div class="row code-meta"><span class="chip">${P.diff}</span><span class="chip">${groupName(P.group)}</span>${P.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}<span id="solved-tag">${r0?.solved ? '<span class="status-tag done">Solved</span>' : ''}</span></div>
      <div class="card code-statement">
        ${P.body}
        <h3>Limits</h3>
        <ul>${P.rules.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="small">${P.note} Reported at: <a href="${P.src[1]}" target="_blank" rel="noopener">${esc(P.src[0])}</a></p>
      </div>
      <h2>Examples</h2>
      <div id="examples"></div>
      <div class="card code-box">
        <div class="row code-bar">
          <div class="lang-seg" role="group" aria-label="Language">${Object.entries(LANGS).map(([k, v]) => `<button type="button" data-lang="${k}" aria-pressed="${k === lang}">${v}</button>`).join('')}</div>
          <span class="small" id="pos"></span>
          <button type="button" class="ghost" id="reset">Reset code</button>
        </div>
        <label for="editor" class="small">Your code${P.starter ? ' (the code to fix)' : ''}</label>
        <textarea id="editor" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" rows="18"></textarea>
        <p class="small">Tab indents; press Esc first to move to the next control instead. Ctrl+Enter runs the examples. Your code is saved on this device as you type.</p>
        <div class="row"><button type="button" id="run">Run examples</button><button type="button" id="submit">Submit (all tests)</button><span class="small" id="status" role="status"></span></div>
        <div id="results" class="code-results"></div>
      </div>
      <div class="card">
        <h3>Hints</h3>
        <ol id="hints" class="code-hints"></ol>
        <button type="button" class="ghost" id="hint">Show a hint (1 of ${P.hints.length})</button>
      </div>
      ${P.lc.length ? '<div class="card" id="leetcode"></div>' : ''}
      <details class="card code-solution" id="solution">
        <summary><b>Solution</b> (gives the answer away)</summary>
        <p><b>Key idea.</b> ${P.sol.idea}</p>
        <ol>${P.sol.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p><b>Cost.</b> ${P.sol.cx}</p>
        <p><b>Trap.</b> ${P.sol.trap}</p>
        <h3 id="ref-title"></h3>
        <pre tabindex="0" class="code-view" id="ref"></pre>
      </details>`;
    const $ = (s) => el.querySelector(s);
    const ed = $('#editor'), status = $('#status'), results = $('#results');
    const ind = () => (lang === 'py' ? 4 : 2);
    const codeOf = (l) => rec(P.id)?.[l] || C.starter(P, l);

    function showLang() {
      ed.value = codeOf(lang);
      el.querySelectorAll('.lang-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
      $('#examples').innerHTML = P.tests.filter((t) => t.ex).map((t, k) => {
        const lines = C.calls(P, t, lang).map(([c, out], j) => {
          const op = P.kind === 'cls' && j > 0 ? t.ops[j - 1][0] : null;
          const quiet = (P.kind === 'cls' && j === 0) || (op && voidMethod(op) && out === null);
          return esc(c) + (quiet ? '' : `  <span class="code-out">→ ${esc(C.show(out, lang))}</span>`);
        });
        return `<div class="card code-example"><h3>Example ${k + 1}${t.name ? `: ${esc(t.name)}` : ''}</h3><pre tabindex="0" class="code-view">${lines.join('\n')}</pre>${t.why ? `<p class="small" style="margin-bottom:0">${t.why}</p>` : ''}</div>`;
      }).join('');
      $('#ref-title').textContent = `Reference solution (${LANGS[lang]})`;
      $('#ref').textContent = P.ref[lang];
      position();
    }
    function save() {
      clearTimeout(saveTimer);
      const r = recOf(P.id);
      r[lang] = ed.value === C.starter(P, lang) ? '' : ed.value.slice(0, 20000);
      store.save();
    }
    function position() {
      const before = ed.value.slice(0, ed.selectionStart).split('\n');
      $('#pos').textContent = `Line ${before.length}, column ${before[before.length - 1].length + 1}`;
    }
    // Typing that keeps the browser's undo history where it can.
    function insert(text) {
      ed.focus();
      if (!document.execCommand || !document.execCommand('insertText', false, text)) {
        ed.setRangeText(text, ed.selectionStart, ed.selectionEnd, 'end');
        ed.dispatchEvent(new Event('input'));
      }
    }
    function dedent() {
      const v = ed.value, s = ed.selectionStart, start = v.lastIndexOf('\n', s - 1) + 1;
      const n = Math.min(ind(), v.slice(start).match(/^ */)[0].length);
      if (!n) return;
      ed.setSelectionRange(start, start + n);
      insert('');
      ed.setSelectionRange(Math.max(start, s - n), Math.max(start, s - n));
    }

    ed.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { escaped = true; return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); go('run'); return; }
      if (e.key === 'Tab' && !escaped) {
        e.preventDefault();
        if (e.shiftKey) dedent();
        else insert(' '.repeat(ind()));
        return;
      }
      escaped = false;
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.isComposing) {
        e.preventDefault();
        const v = ed.value, s = ed.selectionStart, line = v.slice(v.lastIndexOf('\n', s - 1) + 1, s);
        let lead = line.match(/^ */)[0];
        if (/[:{[(]\s*$/.test(line)) lead += ' '.repeat(ind());
        insert('\n' + lead);
      }
    });
    ed.addEventListener('input', () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); position(); });
    ['keyup', 'click'].forEach((t) => ed.addEventListener(t, position));
    el.querySelectorAll('.lang-seg button').forEach((b) => b.addEventListener('click', () => {
      if (busy || b.dataset.lang === lang) return;
      save();
      lang = state().lang = b.dataset.lang;
      store.save();
      results.innerHTML = '';
      status.textContent = '';
      showLang();
    }));
    const $reset = $('#reset');
    let resetArmed = null;
    $reset.addEventListener('click', () => {
      if (!resetArmed) {
        $reset.textContent = 'Reset? Press again';
        resetArmed = setTimeout(() => { resetArmed = null; $reset.textContent = 'Reset code'; }, 3000);
        return;
      }
      clearTimeout(resetArmed);
      resetArmed = null;
      $reset.textContent = 'Reset code';
      ed.value = C.starter(P, lang);
      save();
      position();
    });
    $('#hint').addEventListener('click', (e) => {
      $('#hints').insertAdjacentHTML('beforeend', `<li>${P.hints[hints++]}</li>`);
      if (hints >= P.hints.length) e.target.remove();
      else e.target.textContent = `Show another hint (${hints + 1} of ${P.hints.length})`;
    });
    $('#run').addEventListener('click', () => go('run'));
    $('#submit').addEventListener('click', () => go('submit'));

    // One result line, with the calls that went wrong, the error and any printed output.
    function row(res, open) {
      const time = res.perf && res.limit ? `${msText(res.ms)} (limit ${msText(res.limit)})` : msText(res.ms);
      const head = `<span class="${res.pass ? 'pos' : 'neg'}">${res.pass ? '✓' : '✗'}</span> ${esc(res.label)}${time ? ` <span class="small">· ${time}</span>` : ''}`;
      if (res.pass) return `<div class="code-row">${head}${res.stdout ? `<details><summary class="small">Printed output</summary><pre tabindex="0" class="code-view">${esc(res.stdout)}</pre></details>` : ''}</div>`;
      const d = res.detail;
      const calls = d && d.ctor ? `<pre tabindex="0" class="code-view">${esc(d.head)}\n  <span class="neg">got an error</span></pre>` : d ? `<pre tabindex="0" class="code-view">${d.head ? esc(d.head) + '\n' : ''}${d.skipped > 0 ? `<span class="small">… ${d.skipped} earlier call${d.skipped > 1 ? 's' : ''} returned the right value</span>\n` : ''}${d.lines.map((x) => `${esc(x.call)}${x.bad ? `\n  <span class="neg">got ${x.got === null ? (res.err ? 'an error' : 'nothing') : esc(x.got)}</span>, expected <span class="pos">${esc(x.exp)}</span>` : x.exp !== null ? `  <span class="code-out">→ ${esc(x.exp)}</span>` : ''}`).join('\n')}</pre>` : '';
      const why = res.slow ? '<p class="small neg">Right answer, but too slow: it took more than the limit, which is a generous multiple of the reference solution\'s time on this device. Look for a step that scans everything on each call.</p>' : '';
      return `<details class="code-row fail" ${open ? 'open' : ''}><summary>${head}</summary>${why}${calls}${res.err ? `<pre tabindex="0" class="code-view code-err">${esc(res.err)}</pre>` : ''}${res.stdout ? `<p class="small">Printed output:</p><pre tabindex="0" class="code-view">${esc(res.stdout)}</pre>` : ''}</details>`;
    }

    function go(mode) {
      if (busy) return;
      save();
      busy = true;
      $('#run').disabled = $('#submit').disabled = true;
      results.innerHTML = '';
      status.textContent = 'Starting…';
      const job = ++jobs, rows = [];
      let current = null, total = 0, failsShown = 0;
      const arm = (ms) => { clearTimeout(watchdog); watchdog = setTimeout(timedOut, ms); };
      const finish = (error, stdout) => {
        clearTimeout(watchdog);
        busy = false;
        $('#run').disabled = $('#submit').disabled = false;
        if (error) {
          status.textContent = '';
          results.insertAdjacentHTML('afterbegin', `<div class="code-row fail"><span class="neg">✗</span> Your code didn't run.<pre tabindex="0" class="code-view code-err">${esc(error)}</pre>${stdout ? `<pre tabindex="0" class="code-view">${esc(stdout)}</pre>` : ''}</div>`);
          return;
        }
        const passed = rows.filter((x) => x.pass).length, all = passed === total && total > 0;
        if (mode === 'submit') {
          const r = recOf(P.id);
          r.subs++;
          if (all && !r.solved) {
            r.solved = Date.now();
            r.first = r.subs === 1;
          }
          store.touchDay();
          store.save();
          if (r.solved) {
            $('#solved-tag').innerHTML = '<span class="status-tag done">Solved</span>';
            showLeetCode();
          }
        }
        status.textContent = mode === 'run'
          ? `${passed} of ${total} examples pass.${all ? ' Now submit: the hidden tests include edge cases, random cases and a large one.' : ''}`
          : all ? `All ${total} tests pass. Solved.` : `${passed} of ${total} tests pass.`;
      };
      const timedOut = () => {
        killWorker();
        const label = current ? current.label : 'Running';
        rows.push({ pass: false });
        results.insertAdjacentHTML('beforeend', row({ label, pass: false, err: `Stopped after ${Math.round((current?.timeout || 0) / 1000)} seconds with no result: an endless loop, or far too slow for this size.` }, true));
        total = Math.max(total, rows.length);
        finish();
      };
      const w = getWorker();
      w.onmessage = ({ data: m }) => {
        if (m.job !== job || !document.contains(ed)) return;
        if (m.type === 'status') {
          status.textContent = m.text;
          arm(180000);
        } else if (m.type === 'begin') {
          current = m;
          total = m.n;
          status.textContent = `${m.label} (${m.i + 1} of ${m.n})`;
          arm(m.timeout);
        } else if (m.type === 'case') {
          rows.push(m.res);
          results.insertAdjacentHTML('beforeend', row(m.res, !m.res.pass && failsShown++ < 1));
        } else if (m.type === 'end') finish();
        else if (m.type === 'error') finish(m.text, m.stdout);
      };
      w.onerror = (e) => { e.preventDefault(); killWorker(); finish('The code runner failed to start. Reload the page and try again.'); };
      w.postMessage({ job, id: P.id, lang, code: ed.value, mode });
      arm(lang === 'py' ? 180000 : 30000);
    }

    // The matching LeetCode problems, unlocked by solving this one here first.
    function showLeetCode() {
      const box = $('#leetcode');
      if (!box) return;
      if (!rec(P.id)?.solved) {
        box.innerHTML = `<h3>On LeetCode</h3><p class="small" style="margin:0">${P.lc.length > 1 ? `${P.lc.length} matching LeetCode problems unlock` : 'The matching LeetCode problem unlocks'} when you solve this one: submit with every test passing.</p>`;
        return;
      }
      box.innerHTML = `<h3>On LeetCode</h3>
        <ul class="lc-list">${P.lc.map(([n, title, slug, diff, rel, note, premium]) => `<li>
          <a href="https://leetcode.com/problems/${slug}/" target="_blank" rel="noopener">${n}. ${esc(title)}</a> <span class="small">${diff}${premium ? ' · needs LeetCode Premium' : ''}</span>
          <span class="chip">${rel === 'same' ? 'the same problem' : 'similar'}</span>
          <br><span class="small">${note}</span></li>`).join('')}</ul>
        <p class="small" style="margin-bottom:0">Solve it there from memory rather than pasting this solution: LeetCode's names and return values differ slightly.</p>`;
    }

    QT.cleanup = () => {
      clearTimeout(watchdog);
      if (saveTimer) save();
      if (busy) killWorker();
    };
    showLang();
    showLeetCode();
  }

  // ---------------------------------------------------------------- the knowledge quiz
  function quiz(el, sub) {
    if (sub === 'all') return quizAll(el);
    const st = state().quiz, runs = st.runs;
    const byTopic = QZ.TOPICS.map((t) => {
      const bits = QZ.QS.filter((q) => q.topic === t).flatMap((q) => (st.q[q.id] || []).slice(-1));
      return [t, bits.length, bits.filter(Boolean).length];
    });
    el.innerHTML = `
      <a class="back" href="#/code">← Coding</a>
      <h1>Knowledge quiz</h1>
      <p class="lede">${QZ.N} multiple-choice questions in ${QZ.MINUTES} minutes on data structures, algorithms, operating systems, concurrency, networking, C++ and Python, like the "coding knowledge" part of Optiver's online assessment. As in the real test, you see the answers at the end. Questions you got wrong come up more often.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${runs.length}</div><div class="k">quizzes taken</div></div>
        <div class="tile"><div class="v">${quizBest() < 0 ? '–' : quizBest()}<span class="of">/${QZ.N}</span></div><div class="k">best score</div></div>
        <div class="tile"><div class="v">${QZ.QS.length}</div><div class="k">questions in the bank</div></div>
      </div>
      <div class="row" style="margin:14px 0"><button type="button" class="btn-lg" id="start">Start the quiz</button><a class="btn ghost" href="#/code/quiz/all">Read every question and answer</a></div>
      ${byTopic.some(([, n]) => n) ? `<div class="card"><h3>Last answer by topic</h3><ul class="code-topics">${byTopic.filter(([, n]) => n).map(([t, n, k]) => `<li><span>${t}</span><span class="${k / n >= 0.75 ? 'pos' : k / n < 0.5 ? 'neg' : ''}">${k}/${n}</span></li>`).join('')}</ul></div>` : ''}`;
    el.querySelector('#start').addEventListener('click', () => quizRun(el));
  }

  // Picks the questions: ones you got wrong last time count triple, unseen ones double.
  function pick() {
    const st = state().quiz, pool = QZ.QS.map((q) => {
      const last = (st.q[q.id] || []).slice(-1)[0];
      return { q, w: last === 0 ? 3 : last === undefined ? 2 : 1 };
    });
    const out = [];
    while (out.length < Math.min(QZ.N, QZ.QS.length)) {
      let x = Math.random() * pool.reduce((s, p) => s + p.w, 0), i = 0;
      while ((x -= pool[i].w) > 0) i++;
      out.push(pool.splice(i, 1)[0].q);
    }
    return out.map((q) => ({ q, order: shuffle(q.opts.map((_, i) => i)), pick: null }));
  }
  const shuffle = (xs) => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };

  function quizRun(el) {
    const items = pick(), end = Date.now() + QZ.MINUTES * 60000;
    let k = 0, timer = null;
    const clock = () => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      const $c = el.querySelector('#qclock');
      if ($c) {
        $c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left`;
        $c.classList.toggle('neg', s < 60);
      }
      if (s <= 0) done();
    };
    const show = () => {
      const it = items[k];
      el.innerHTML = `
        <h1 class="quiz-h">Knowledge quiz</h1>
        <div class="row" style="justify-content:space-between"><span class="small">Question ${k + 1} of ${items.length} · ${it.q.topic}</span><span class="mono" id="qclock"></span></div>
        <div class="card quiz-card">
          <p class="q-text">${it.q.q}</p>
          <div class="quiz-opts" role="group" aria-label="Answers">${it.order.map((i) => `<button type="button" class="quiz-opt" data-i="${i}" aria-pressed="${it.pick === i}">${esc(it.q.opts[i])}</button>`).join('')}</div>
        </div>
        <div class="row"><button type="button" class="ghost" id="back" ${k ? '' : 'disabled'}>Back</button><button type="button" id="next">${k === items.length - 1 ? 'Finish' : 'Next'}</button><span class="small" id="answered"></span></div>`;
      const answered = () => { el.querySelector('#answered').textContent = `${items.filter((x) => x.pick !== null).length} of ${items.length} answered`; };
      el.querySelectorAll('.quiz-opt').forEach((b) => b.addEventListener('click', () => {
        it.pick = +b.dataset.i;
        el.querySelectorAll('.quiz-opt').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        answered();
      }));
      answered();
      el.querySelector('#back').addEventListener('click', () => { k--; show(); });
      el.querySelector('#next').addEventListener('click', () => { if (k === items.length - 1) done(); else { k++; show(); } });
      clock();
      el.querySelector('.quiz-opt').focus();
    };
    function done() {
      clearInterval(timer);
      QT.cleanup = null;
      const st = state().quiz, right = items.filter((it) => it.pick === 0).length;
      for (const it of items) {
        const bits = (st.q[it.q.id] ||= []);
        bits.push(it.pick === 0 ? 1 : 0);
        if (bits.length > 5) bits.shift();
      }
      store.log(st.runs, { n: items.length, right }, 50);
      store.touchDay();
      store.save();
      const secs = Math.round((QZ.MINUTES * 60000 - Math.max(0, end - Date.now())) / 1000);
      el.innerHTML = `
        <a class="back" href="#/code/quiz">← Knowledge quiz</a>
        <h1>${right} of ${items.length}</h1>
        <p class="lede">In ${Math.floor(secs / 60)} min ${secs % 60} s. ${right >= 16 ? 'Strong: keep it there.' : right >= 12 ? 'Solid. Read the explanations for the ones you missed.' : 'Read the explanations below, then try again: wrong ones come back more often.'}</p>
        <div class="row" style="margin-bottom:14px"><button type="button" id="again">Another quiz</button><a class="btn ghost" href="#/code">Back to Coding</a></div>
        ${items.map((it, n) => `
          <div class="card quiz-review ${it.pick === 0 ? 'ok' : 'bad'}">
            <p class="small">${n + 1}. ${it.q.topic} · <span class="${it.pick === 0 ? 'pos' : 'neg'}">${it.pick === 0 ? '✓ right' : it.pick === null ? '✗ not answered' : '✗ wrong'}</span></p>
            <p class="q-text">${it.q.q}</p>
            ${it.pick !== null && it.pick !== 0 ? `<p><span class="neg">Your answer:</span> ${esc(it.q.opts[it.pick])}</p>` : ''}
            <p><span class="pos">Answer:</span> ${esc(it.q.opts[0])}</p>
            <p class="small" style="margin-bottom:0">${it.q.why}</p>
          </div>`).join('')}`;
      el.querySelector('#again').addEventListener('click', () => quizRun(el));
      window.scrollTo(0, 0);
    }
    timer = setInterval(clock, 1000);
    QT.cleanup = () => clearInterval(timer);
    show();
  }

  function quizAll(el) {
    el.innerHTML = `
      <a class="back" href="#/code/quiz">← Knowledge quiz</a>
      <h1>Every quiz question</h1>
      <p class="lede">All ${QZ.QS.length} questions with their answers and explanations, by topic.</p>
      ${QZ.TOPICS.map((t) => `<h2>${t}</h2>${QZ.QS.filter((q) => q.topic === t).map((q) => `
        <details class="card"><summary>${q.q}</summary><p><span class="pos">Answer:</span> ${esc(q.opts[0])}</p><p class="small" style="margin-bottom:0">${q.why}</p></details>`).join('')}`).join('')}`;
  }

  QT.coding = { render };
})();
