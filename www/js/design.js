// Design discussion mode (#/code/design): the problems in design-problems.js, run the way a
// technical interview goes. You write your clarifying questions before anything is shown, then
// work through the stages with hints that build up, face the interviewer's pushbacks one at a
// time, sketch a diagram against a one-minute timer, compare with a model answer, and score
// yourself on a rubric. Scores are saved in state.code.design.
(function () {
  const store = QT.store, esc = (s) => QT.escapeHtml(String(s ?? ''));
  const D = QT.design;
  const runs = (id) => store.get().code.design[id] || [];
  const avg = (r) => r.s.reduce((a, b) => a + b, 0) / r.s.length;

  function list(el) {
    el.innerHTML = `
      <a class="back" href="#/code">← Coding</a>
      <h1>Design discussions</h1>
      <p class="lede">Practice for the talking part of a technical interview. Optiver says its software engineering interviews should feel like solving a problem with a colleague: ask about load, latency and edge cases first, choose structures and say what they cost, explain how they work inside, and revise when the interviewer pushes back. Each problem walks through that conversation.</p>
      <p class="small">Source for the approach: <a href="${D.GUIDE[1]}" target="_blank" rel="noopener">${esc(D.GUIDE[0])}</a>. The problems and model answers are ours.</p>
      <div class="card"><b>How to use it.</b> Say everything out loud, as if the interviewer were there. Type your clarifying questions before you see any answers, use hints only when stuck, and answer each pushback before you reveal what a good answer covers. Then score yourself honestly.</div>
      <div class="menu">${D.PROBLEMS.map((P) => {
        const r = runs(P.id), last = r[r.length - 1];
        return `<a class="card" href="#/code/design/${P.id}"><b>${esc(P.title)}</b><span class="small">${esc(P.prompt.split('. ')[0])}.</span><span class="small">${last ? `${r.length} run${r.length > 1 ? 's' : ''} · last ${avg(last).toFixed(1)}/3` : 'not tried'}</span></a>`;
      }).join('')}</div>`;
  }

  function diagramHtml(rows) {
    return `<div class="dz-flow" role="list">${rows.map(([t, sub], i) => `${i ? '<span class="dz-arrow" aria-hidden="true">→</span>' : ''}<div class="dz-box" role="listitem"><b>${esc(t)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>`).join('')}</div>`;
  }

  function problem(el, P) {
    const keyN = P.clarify.filter((c) => c[2]).length;
    el.innerHTML = `
      <a class="back" href="#/code/design">← Design discussions</a>
      <h1>${esc(P.title)}</h1>
      <div class="card dz-prompt"><span class="eyebrow">The interviewer says</span><p>${esc(P.prompt)}</p></div>
      <div class="row dz-tools"><button type="button" class="ghost" id="dz-rec">Record yourself</button><span class="small" id="dz-rec-msg" aria-live="polite">Recording stays on this device.</span></div>
      <audio id="dz-audio" controls hidden></audio>

      <h2>1. Clarify first</h2>
      <p class="small">Before designing anything, what would you ask? Write your questions, then compare.</p>
      <label class="small" for="dz-q">Your clarifying questions</label>
      <textarea id="dz-q" rows="4" placeholder="One per line"></textarea>
      <div class="row"><button type="button" id="dz-clar-go">Show what a strong candidate asks</button></div>
      <div id="dz-clar" hidden>
        <p class="small">Tick the ones you asked (or would have). The ${keyN} marked <b>key</b> are the ones that change the design.</p>
        <ul class="dz-clar">${P.clarify.map(([q, a, key], i) => `<li><label><input type="checkbox" data-c="${i}"> <b>${esc(q)}</b>${key ? ' <span class="chip">key</span>' : ''}</label><span class="small">Interviewer: ${esc(a)}</span></li>`).join('')}</ul>
      </div>

      <div id="dz-rest" hidden>
        <h2>2. Design it</h2>
        ${P.stages.map((S, i) => `
          <div class="card dz-stage" data-s="${i}">
            <p><b>${esc(S.ask)}</b></p>
            <ol class="dz-hints small"></ol>
            <div class="row"><button type="button" class="ghost" data-hint="${i}">Hint (${S.hints.length})</button><button type="button" class="ghost" data-good="${i}">What a good answer covers</button></div>
            <ul class="dz-good" hidden>${S.good.map((g) => `<li>${g}</li>`).join('')}</ul>
          </div>`).join('')}

        <h2>3. The interviewer pushes back</h2>
        <p class="small">One at a time. Answer out loud first, then reveal.</p>
        <div id="dz-push"></div>
        <div class="row"><button type="button" id="dz-push-next">Next pushback (1 of ${P.pushbacks.length})</button></div>

        <h2>4. Draw it</h2>
        <p class="small">Sketch the components on paper in under a minute: boxes, arrows, labels. Then compare.</p>
        <div class="row"><button type="button" id="dz-draw">Start the minute</button><span class="mono" id="dz-clock" aria-live="off"></span></div>
        <div id="dz-diagram" hidden>${diagramHtml(P.diagram)}</div>

        <h2>5. Model answer</h2>
        <details class="card"><summary><b>Structures, costs and a Python sketch</b></summary>
          <table class="dz-table"><thead><tr><th>Structure</th><th>Why</th></tr></thead><tbody>${P.model.structures.map(([n, w]) => `<tr><td><code>${esc(n)}</code></td><td>${esc(w)}</td></tr>`).join('')}</tbody></table>
          <table class="dz-table"><thead><tr><th>Operation</th><th>Cost</th></tr></thead><tbody>${P.model.costs.map(([o, c]) => `<tr><td>${esc(o)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>
          <pre class="dz-code"><code>${esc(P.model.sketch)}</code></pre>
        </details>
        ${P.codeLink && QT.code?.byId(P.codeLink) ? `<p><a class="btn ghost" href="#/code/${P.codeLink}">Code the core: ${esc(QT.code.byId(P.codeLink).title)}</a></p>` : ''}

        <h2>6. Score yourself</h2>
        <form id="dz-rubric" class="card">
          ${D.RUBRIC.map((r, i) => `<fieldset class="dz-score"><legend>${esc(r)}</legend>${[1, 2, 3].map((v) => `<label><input type="radio" name="r${i}" value="${v}" required> ${['', 'Not yet', 'Partly', 'Yes'][v]}</label>`).join('')}</fieldset>`).join('')}
          <button>Save score</button>
          <p class="small" id="dz-saved" aria-live="polite"></p>
        </form>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const cleanups = [];
    QT.cleanup = () => cleanups.splice(0).forEach((f) => f());

    $('#dz-clar-go').addEventListener('click', () => {
      $('#dz-clar').hidden = false;
      $('#dz-rest').hidden = false;
      $('#dz-clar-go').disabled = true;
      $('#dz-q').readOnly = true;
    });
    el.querySelectorAll('[data-hint]').forEach((b) => {
      let shown = 0;
      const S = P.stages[+b.dataset.hint], ol = b.closest('.dz-stage').querySelector('.dz-hints');
      b.addEventListener('click', () => {
        if (shown >= S.hints.length) return;
        ol.insertAdjacentHTML('beforeend', `<li>${S.hints[shown++]}</li>`);
        b.textContent = shown < S.hints.length ? `Another hint (${S.hints.length - shown} left)` : 'No more hints';
        if (shown >= S.hints.length) b.disabled = true;
      });
    });
    el.querySelectorAll('[data-good]').forEach((b) => b.addEventListener('click', () => {
      const ul = b.closest('.dz-stage').querySelector('.dz-good');
      ul.hidden = !ul.hidden;
      b.textContent = ul.hidden ? 'What a good answer covers' : 'Hide';
    }));
    let pushed = 0;
    const nextBtn = $('#dz-push-next');
    nextBtn.addEventListener('click', () => {
      const B = P.pushbacks[pushed++];
      $('#dz-push').insertAdjacentHTML('beforeend', `<div class="card dz-pushback"><p><span class="eyebrow">Interviewer</span><br>“${esc(B.says)}”</p><details><summary>What a good answer covers</summary><ul>${B.good.map((g) => `<li>${g}</li>`).join('')}</ul></details></div>`);
      if (pushed >= P.pushbacks.length) { nextBtn.disabled = true; nextBtn.textContent = 'No more pushbacks'; } else nextBtn.textContent = `Next pushback (${pushed + 1} of ${P.pushbacks.length})`;
    });
    $('#dz-draw').addEventListener('click', () => {
      const btn = $('#dz-draw'), end = Date.now() + 60000;
      btn.disabled = true;
      const tick = () => {
        const left = Math.max(0, end - Date.now());
        $('#dz-clock').textContent = `0:${String(Math.ceil(left / 1000)).padStart(2, '0')}`;
        if (!left) { clearInterval(id); $('#dz-diagram').hidden = false; $('#dz-clock').textContent = 'Time. Compare with this:'; }
      };
      const id = setInterval(tick, 250);
      cleanups.push(() => clearInterval(id));
      tick();
      btn.insertAdjacentHTML('afterend', '<button type="button" class="link" id="dz-show-now">Show it now</button>');
      $('#dz-show-now').addEventListener('click', () => { clearInterval(id); $('#dz-diagram').hidden = false; $('#dz-clock').textContent = ''; $('#dz-show-now').remove(); });
    });
    $('#dz-rubric').addEventListener('submit', (e) => {
      e.preventDefault();
      const s = D.RUBRIC.map((_, i) => +new FormData(e.target).get(`r${i}`));
      if (s.some((v) => !(v >= 1 && v <= 3))) return;
      const asked = P.clarify.filter((c, i) => c[2] && el.querySelector(`[data-c="${i}"]`).checked).length;
      const all = store.get().code.design;
      all[P.id] = [...(all[P.id] || []), { date: new Date().toISOString(), s, c: [asked, keyN] }].slice(-20);
      store.touchDay();
      store.save();
      const weakest = D.RUBRIC[s.indexOf(Math.min(...s))];
      $('#dz-saved').textContent = `Saved: ${(s.reduce((a, b) => a + b, 0) / s.length).toFixed(1)} out of 3, and ${asked} of ${keyN} key questions asked. Work on: ${weakest.toLowerCase()}.`;
    });
    recorder($('#dz-rec'), $('#dz-rec-msg'), $('#dz-audio'), cleanups);
  }

  // Record yourself talking through the problem; played back here and never uploaded.
  function recorder(btn, msg, audio, cleanups) {
    const can = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    if (!can) { btn.hidden = true; msg.textContent = ''; return; }
    let rec = null, stream = null, chunks = [], url = null;
    const stop = () => { if (rec && rec.state !== 'inactive') rec.stop(); stream?.getTracks().forEach((t) => t.stop()); };
    cleanups.push(() => { stop(); if (url) URL.revokeObjectURL(url); });
    btn.addEventListener('click', async () => {
      if (rec && rec.state === 'recording') { stop(); btn.textContent = 'Record again'; return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        msg.textContent = 'No microphone access. You can still talk it through out loud.';
        return;
      }
      chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
        audio.src = url;
        audio.hidden = false;
        msg.textContent = 'Play it back: listen for long silences and for decisions you didn\'t explain.';
      };
      rec.start();
      btn.textContent = 'Stop recording';
      msg.textContent = 'Recording…';
    });
  }

  QT.designView = (el, id) => {
    const P = id && D.byId(id);
    return P ? problem(el, P) : list(el);
  };
})();
