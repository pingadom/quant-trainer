// More: secondary sections, install prompt, settings and data import/export.
(function () {
  const store = QT.store;

  function more(el) {
    let pref = 'auto';
    try { pref = localStorage.getItem('qt-keypad') || 'auto'; } catch { /* storage blocked: use default */ }
    el.innerHTML = `
      <h1>More</h1>
      <p class="lede">Everything in the app, grouped the same way as the sidebar.</p>
      <h2 class="menu-head">My prep</h2>
      <div class="menu">
        <a class="card" href="#/plan"><b>Interview plan</b><span class="small">A daily checklist up to your interview, for the firm you're seeing</span></a>
        <a class="card" href="#/daily"><b>Daily challenge</b><span class="small">The same 5 questions for everyone today, with a shareable result</span></a>
        <a class="card" href="#/coach"><b>Coach</b><span class="small">What to practise next, your skill map and the diagnostic</span></a>
        <a class="card" href="#/progress"><b>Progress</b><span class="small">Charts of your accuracy, speed and scores over time</span></a>
        <a class="card" href="#/roadmap"><b>Roadmap</b><span class="small">Stages, books and milestones</span></a>
      </div>
      <h2 class="menu-head">Learn</h2>
      <div class="menu">
        <a class="card" href="#/practice"><b>Topics</b><span class="small">Formula sheets and endless questions in ${QT.topics.length} topics</span></a>
        <a class="card" href="#/tricks"><b>Speed tricks</b><span class="small">20 guides to faster arithmetic, each with a drill</span></a>
        <a class="card" href="#/cases"><b>Case studies</b><span class="small">Real market events as statistics lessons</span></a>
        <a class="card" href="#/lab"><b>Stats lab</b><span class="small">CLT and volatility-drag simulations</span></a>
      </div>
      <h2 class="menu-head">Practise</h2>
      <div class="menu">
        <a class="card" href="#/review"><b>Mixed practice</b><span class="small">Questions picked for you across every topic</span></a>
        <a class="card" href="#/mistakes"><b>Mistakes to review</b><span class="small">Wrong answers coming back on a schedule</span></a>
        <a class="card" href="#/mental"><b>Mental maths</b><span class="small">80 in 8 (multiple choice or typed), Zetamac and speed reps</span></a>
        <a class="card" href="#/oa"><b>Online tests</b><span class="small">Number sequences, digit span and running totals, timed</span></a>
      </div>
      <h2 class="menu-head">Interviews</h2>
      <div class="menu">
        <a class="card" href="#/bank"><b>Interview questions</b><span class="small">Questions candidates report, by firm, with sources</span></a>
        <a class="card" href="#/mock"><b>Mock interview</b><span class="small">Five questions against the clock</span></a>
        <a class="card" href="#/talk"><b>Think aloud</b><span class="small">Answer out loud, record yourself, review</span></a>
      </div>
      <h2 class="menu-head">Trading games</h2>
      <div class="menu">
        <a class="card" href="#/figgie"><b>Figgie</b><span class="small">Jane Street's card trading game, against three bots</span></a>
        <a class="card" href="#/quote"><b>Make me a market</b><span class="small">Quote two-sided prices; the interviewer trades against you</span></a>
        <a class="card" href="#/market"><b>Market making</b><span class="small">Quote on hidden dice against informed flow</span></a>
        <a class="card" href="#/kelly"><b>Bet sizing</b><span class="small">How much to stake: the Kelly criterion in practice</span></a>
        <a class="card" href="#/estimate"><b>Estimation &amp; calibration</b><span class="small">Quote ranges on unknown quantities</span></a>
      </div>

      <div id="install"></div>

      <h2>Settings</h2>
      <div class="menu" style="margin-bottom:12px">
        <a class="card" href="#/tour"><b>Take the tour</b><span class="small">Everything the app does, in seven short steps</span></a>
        <a class="card" href="#/appearance"><b>Appearance</b><span class="small">Theme (${QT.theme.choice() === 'auto' ? 'matching your system' : QT.theme.THEMES[QT.theme.choice()].name}), ticker, animations, sounds</span></a>
      </div>
      <div class="card">
        <label for="kp">On-screen number pad</label>
        <select id="kp" style="margin-left:8px">
          ${['auto', 'on', 'off'].map((v) => `<option value="${v}" ${pref === v ? 'selected' : ''}>${v === 'auto' ? 'Automatic (touch screens)' : v === 'on' ? 'Always' : 'Never'}</option>`).join('')}
        </select>
      </div>

      <h2>Your data</h2>
      <p class="small">Progress is saved on this device only. Export a backup to move it between devices. <a href="privacy.html">Privacy</a></p>
      <div class="row">
        <button class="ghost" id="exp">Export progress</button>
        <label class="btn ghost" style="margin:0">Import<input type="file" id="imp" accept=".json,application/json" hidden></label>
        <button class="ghost" id="rst">Reset</button>
      </div>
      <p class="small" id="exp-msg"></p>
      <p class="small version">Quant Trainer ${QT.VERSION} · running as ${QT.platform.mode()}</p>`;

    // "Install as an app" card: only on the website, and only where installing is possible.
    const installBox = el.querySelector('#install');
    const drawInstall = () => {
      const P = QT.platform;
      if (P.native || P.standalone()) return (installBox.innerHTML = '');
      if (P.canInstall()) {
        installBox.innerHTML = `<h2>Install the app</h2><div class="card"><p style="margin-top:0">Add Quant Trainer to your home screen. It opens full-screen and works offline.</p><button id="do-install">Install</button></div>`;
        installBox.querySelector('#do-install').addEventListener('click', async () => { if (await P.install()) drawInstall(); });
      } else if (P.isIOS) {
        installBox.innerHTML = `<h2>Install the app</h2><div class="card">
          <p style="margin-top:0">In Safari, tap <b>Share</b> then <b>Add to Home Screen</b>. It opens full-screen, works offline, and iOS keeps its data safe from Safari's automatic clean-ups.</p>
          <p class="small" style="margin:0">The home-screen app keeps its own progress, separate from this Safari tab. To bring your progress across, tap <b>Export progress</b> below first, then <b>Import</b> it inside the app.</p></div>`;
      } else installBox.innerHTML = '';
    };
    drawInstall();
    document.addEventListener('qt:installable', drawInstall, { once: true });

    el.querySelector('#kp').addEventListener('change', (e) => {
      try { localStorage.setItem('qt-keypad', e.target.value); } catch { /* storage blocked */ }
    });
    el.querySelector('#exp').addEventListener('click', async () => {
      const msg = el.querySelector('#exp-msg');
      try {
        const how = await QT.platform.exportFile(`quant-trainer-progress-${new Date().toISOString().slice(0, 10)}.json`, store.exportJson());
        msg.textContent = how === 'copied' ? 'Progress copied to the clipboard. Paste it somewhere safe.' : how === 'downloaded' ? 'Progress file downloaded.' : '';
      } catch {
        msg.textContent = 'Export failed. Try again.';
      }
    });
    el.querySelector('#imp').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        store.importJson(await file.text()); // validated and sanitised in core.js
        location.hash = '#/';
      } catch {
        el.querySelector('#exp-msg').textContent = 'That file could not be read as a progress export.';
      }
    });
    el.querySelector('#rst').addEventListener('click', () => {
      if (confirm('Erase all progress? This cannot be undone.')) {
        store.reset();
        location.hash = '#/';
      }
    });
  }

  QT.views = Object.assign(QT.views || {}, { more });
})();
