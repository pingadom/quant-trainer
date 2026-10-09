// Think-aloud practice. Interviews are spoken, but typing an answer never trains you to explain
// it. Here a timer runs while you talk through a reported interview question; you can record
// yourself (kept on this device) and, where the browser supports it, see a live transcript with
// your pace and filler words. Then you compare with the worked answer, see the follow-ups an
// interviewer would push on, and score yourself against a checklist.
(function () {
  const store = QT.store, f = QT.fmtNum;
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const canRecord = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const PREF = 'qt-talk-prefs';

  const CHECKLIST = [
    'Restated the problem and asked about anything ambiguous',
    'Said a plan out loud before calculating',
    'Gave a quick estimate or a bound first',
    'Kept talking through each step, without long silences',
    'Sanity-checked the answer (a limiting case, symmetry or units)',
    'Reached the right answer',
  ];
  const FILLERS = /\b(um+|uh+|erm+|er|you know|basically|sort of|kind of|like)\b/gi;

  // Words per minute and filler words in a transcript.
  function speechStats(transcript, secs) {
    const words = (transcript.match(/[A-Za-z0-9']+/g) || []).length;
    const fillers = (transcript.match(FILLERS) || []).length;
    return { words, wpm: secs > 0 ? Math.round((words * 60) / secs) : 0, fillers };
  }

  const prefs = () => {
    try { return { rec: true, live: false, ...JSON.parse(localStorage.getItem(PREF) || '{}') }; } catch { return { rec: true, live: false }; }
  };
  const savePrefs = (p) => { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch { /* storage blocked */ } };
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function render(el, id) {
    const b = id && QT.bank.find((x) => x.id === id);
    if (b) return session(el, b);
    const st = store.get().talk, p = prefs();
    const avg = st.history.length ? st.history.reduce((s, x) => s + x.score / (x.of || 6), 0) / st.history.length : null;
    el.innerHTML = `
      <h1>Think aloud</h1>
      <p class="lede">Interviewers score how you think, not just the number at the end. Pick a reported question, start the clock and <b>talk it through out loud</b> as if someone were listening. Then compare with the worked answer and the follow-ups they'd ask.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${st.sessions}</div><div class="k">sessions</div></div>
        <div class="tile"><div class="v">${avg === null ? '–' : Math.round(avg * 100) + '%'}</div><div class="k">average self-review</div></div>
      </div>
      <div class="card">
        <h3>Options</h3>
        <label class="check"><input type="checkbox" id="opt-rec" ${p.rec && canRecord() ? 'checked' : ''} ${canRecord() ? '' : 'disabled'}> Record myself so I can listen back${canRecord() ? ' <span class="small">(stays on this device; nothing is uploaded)</span>' : ' <span class="small">(not available in this browser)</span>'}</label>
        <label class="check"><input type="checkbox" id="opt-live" ${p.live && SR ? 'checked' : ''} ${SR ? '' : 'disabled'}> Live transcript with pace and filler words${SR ? ' <span class="small">(your browser sends the audio to its own speech service to transcribe it)</span>' : ' <span class="small">(not available in this browser)</span>'}</label>
        <div class="row" style="margin-top:12px"><button id="go">Random question</button><a class="btn ghost" href="#/bank">Choose from interview questions</a></div>
      </div>
      <div class="card">
        <h3>What interviewers listen for</h3>
        <ul>${CHECKLIST.map((c) => `<li>${c}</li>`).join('')}</ul>
        <p class="small">Based on Jane Street's published advice for its trading interviews: approach methodically, communicate clearly, correct your own mistakes, and ask why. <a href="https://www.janestreet.com/trading-interviews/" target="_blank" rel="noopener">Source</a></p>
      </div>`;
    const read = () => ({ rec: el.querySelector('#opt-rec').checked, live: el.querySelector('#opt-live').checked });
    el.querySelectorAll('#opt-rec, #opt-live').forEach((c) => c.addEventListener('change', () => savePrefs(read())));
    el.querySelector('#go').addEventListener('click', () => {
      const pool = QT.bank, done = new Set(st.history.map((x) => x.id));
      const fresh = pool.filter((x) => !done.has(x.id));
      location.hash = `#/talk/${QT.rand.pick(fresh.length ? fresh : pool).id}`;
    });
  }

  // Every part's hints in order, labelled by part when there are several.
  const talkHints = (b) => (b.parts ? b.parts.flatMap((x, i) => (x.hints || []).map((h) => (b.parts.length > 1 ? [`Part ${i + 1}:`, h] : h))) : b.open?.hints || []);

  async function session(el, b) {
    const p = prefs(), F = QT.firms[b.firm];
    const start = Date.now();
    let recorder = null, stream = null, chunks = [], recog = null, finalText = '', interim = '', url = null, timer = null, stopped = false;

    el.innerHTML = `
      <a class="back" href="#/talk">← Think aloud</a>
      <h1>Think aloud</h1>
      <div class="session"><span>${F ? F.name : 'Interview question'}${b.role ? ` · ${b.role}` : ''}</span><span class="mono" id="tk-clock">0:00</span></div>
      <div class="card">
        <div class="question">${b.q}</div>
        ${b.parts && b.parts.length > 1 ? `<ol>${b.parts.map((x) => `<li>${x.q}</li>`).join('')}</ol>` : b.parts && b.parts[0].q !== b.q ? `<p>${b.parts[0].q}</p>` : ''}
        <p class="small" id="tk-status" aria-live="polite">Talk it through out loud. Start by restating the question.</p>
        <div id="tk-hints">${QT.ui.hintBox(talkHints(b))}</div>
        <div class="transcript" id="tk-live" hidden></div>
        <button id="tk-done" class="btn-lg">I'm done: show the answer</button>
      </div>`;
    const $ = (s) => el.querySelector(s);
    QT.ui.wireHints($('#tk-hints'), talkHints(b));
    timer = setInterval(() => { $('#tk-clock').textContent = clock((Date.now() - start) / 1000); }, 500);

    const stopAll = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch { /* already stopped */ }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      try { if (recog) recog.stop(); } catch { /* already stopped */ }
    };
    QT.cleanup = () => {
      stopAll();
      if (url) URL.revokeObjectURL(url);
    };

    if (p.rec && canRecord()) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; } // left while the permission prompt was open
        recorder = new MediaRecorder(stream);
        recorder.addEventListener('dataavailable', (e) => { if (e.data.size) chunks.push(e.data); });
        recorder.start();
        $('#tk-status').textContent = '● Recording. Talk it through out loud, starting by restating the question.';
      } catch {
        if (stopped) return; // left the page while the browser was deciding
        $('#tk-status').textContent = 'Microphone not available, so no recording this time. Talk it through anyway.';
      }
    }
    if (p.live && SR && !stopped) {
      try {
        recog = new SR();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = navigator.language || 'en-GB';
        const live = $('#tk-live');
        live.hidden = false;
        recog.onresult = (e) => {
          interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
            else interim += e.results[i][0].transcript;
          }
          live.textContent = (finalText + interim).trim() || '…';
        };
        recog.onend = () => { if (!stopped) try { recog.start(); } catch { /* restart refused */ } }; // Chrome stops after a pause
        recog.start();
      } catch {
        recog = null;
      }
    }

    $('#tk-done').addEventListener('click', () => {
      const secs = (Date.now() - start) / 1000;
      const finish = () => review(secs);
      if (recorder && recorder.state !== 'inactive') {
        recorder.addEventListener('stop', finish, { once: true });
        stopAll();
      } else {
        stopAll();
        finish();
      }
    });

    function review(secs) {
      if (chunks.length) url = URL.createObjectURL(new Blob(chunks, { type: chunks[0].type || 'audio/webm' }));
      const text = (finalText + interim).trim(), stats = text ? speechStats(text, secs) : null;
      const answer = b.parts
        ? b.parts.map((x, i) => `<div class="solution">${b.parts.length > 1 ? `<b>Part ${i + 1}.</b> ` : ''}${x.sol}${Number.isFinite(x.a) ? ` <b>Answer: ${f(x.a)}</b>` : ''}</div>`).join('')
        : b.open ? `<div class="solution">${b.open.model}</div>` : '';
      el.innerHTML = `
        <a class="back" href="#/talk">← Think aloud</a>
        <h1>How did it go?</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${clock(secs)}</div><div class="k">time talking</div></div>
          ${stats ? `<div class="tile"><div class="v">${stats.wpm}</div><div class="k">words per minute</div></div><div class="tile"><div class="v">${stats.fillers}</div><div class="k">possible filler words</div></div>` : ''}
        </div>
        ${url ? `<div class="card"><h3>Listen back</h3><audio controls src="${url}" style="width:100%"></audio><p class="small">Would an interviewer have followed you? Only you can hear this; it's gone when you leave the page.</p></div>` : ''}
        ${text ? `<details class="card"><summary>Transcript</summary><p class="transcript">${QT.escapeHtml(text)}</p></details>` : ''}
        <div class="card"><h3>Worked answer</h3><div class="question">${b.q}</div>${answer}
          ${b.followups?.length ? `<h3>They'd push further</h3><p class="small">Try answering these out loud too:</p><ul class="followups">${b.followups.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
        </div>
        <div class="card">
          <h3>Score yourself</h3>
          <form id="tk-form">${CHECKLIST.map((c, i) => `<label class="check"><input type="checkbox" name="c${i}"> ${c}</label>`).join('')}
          <div class="row" style="margin-top:12px"><button>Save</button></div></form>
        </div>`;
      el.querySelector('#tk-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const score = [...e.target.querySelectorAll('input:checked')].length, st = store.get().talk;
        st.sessions++;
        store.log(st.history, { id: b.id, secs: Math.round(secs), score, of: CHECKLIST.length });
        store.touchDay();
        store.save();
        const missed = CHECKLIST.filter((_, i) => !e.target.querySelector(`[name=c${i}]`).checked);
        e.target.outerHTML = `<p><b>${score}/${CHECKLIST.length}.</b> ${missed.length ? `Next time, focus on: ${missed[0].toLowerCase()}.` : 'A complete answer.'}</p>
          <div class="row"><a class="btn" href="#/talk" id="tk-next">Another question</a><a class="btn ghost" href="#/iq/${b.id}">Answer it in the question bank</a></div>`;
      });
    }
  }

  QT.talk = { render, speechStats, CHECKLIST };
})();
