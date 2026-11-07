// More: secondary sections, install prompt, settings and data import/export.
(function () {
  const store = QT.store;

  // Every section, grouped as in the sidebar. `route` keys the Recent list (app.js records visits).
  const GROUPS = () => [
    { id: 'prep', name: 'Your prep', items: [
      { route: 'coach', href: '#/coach', name: 'Coach', desc: 'What to practise next, your skill map and the diagnostic' },
      { route: 'plan', href: '#/plan', name: 'Interview plan', desc: "A daily checklist up to your interview, for the firm you're seeing" },
      { route: 'daily', href: '#/daily', name: 'Daily challenge', desc: 'The same 5 questions for everyone today' },
      { route: 'progress', href: '#/progress', name: 'Progress', desc: 'Charts of your accuracy, speed and scores over time' },
      { route: 'roadmap', href: '#/roadmap', name: 'Roadmap', desc: 'Stages, books and milestones' },
    ] },
    { id: 'learn', name: 'Learn', items: [
      { route: 'handbook', href: '#/handbook', name: 'Handbook', desc: 'A full course from the basics up, with homework and exams' },
      { route: 'practice', href: '#/practice', name: 'Practise by topic', desc: `Formula sheets and endless questions in ${QT.topics.length} topics` },
      { route: 'flashcards', href: '#/flashcards', name: 'Formula cards', desc: `${QT.flashcards.CARDS.length} formulas to know cold, on a spaced schedule` },
      { route: 'tricks', href: '#/tricks', name: 'Speed tricks', desc: `${QT.tricks.length} guides to faster arithmetic, each with a drill` },
      { route: 'cases', href: '#/cases', name: 'Case studies', desc: 'Real market events as statistics lessons' },
      { route: 'lab', href: '#/lab', name: 'Stats lab', desc: 'CLT and volatility-drag simulations' },
      { href: 'topics/', name: 'Read topic guides', desc: 'Key results and a worked example of every question type, as plain pages' },
    ] },
    { id: 'practise', name: 'Practise', items: [
      { route: 'review', href: '#/review', name: 'Mixed practice', desc: 'Questions picked for you across every topic' },
      { route: 'mistakes', href: '#/mistakes', name: 'Mistakes to review', desc: 'Wrong answers coming back on a schedule' },
      { route: 'weak', href: '#/weak', name: 'Weak-spot training', desc: 'Your accuracy in each interview skill area, with a session for the weakest' },
      { route: 'mental', href: '#/mental', name: 'Mental maths', desc: 'Zetamac, 80 in 8, 60 in 6 (Flow Traders), flow training and speed reps' },
      { route: 'oa', href: '#/oa', name: 'Online tests', desc: 'Number sequences, digit span and running totals, timed' },
      { route: 'code', href: '#/code', name: 'Coding (SWE)', desc: 'Optiver software engineering problems and a CS knowledge quiz' },
    ] },
    { id: 'interviews', name: 'Interview prep', items: [
      { route: 'bank', href: '#/bank', name: 'Interview questions', desc: 'Questions candidates report, by firm, with sources' },
      { route: 'mock', href: '#/mock', name: 'Mock interview', desc: 'Five questions against the clock' },
      { route: 'screen', href: '#/screen', name: 'Phone-screen mock', desc: 'A full 45-minute first round, out loud' },
      { route: 'talk', href: '#/talk', name: 'Think aloud', desc: 'Answer out loud, record yourself, review' },
      { route: 'stories', href: '#/stories', name: 'Stories', desc: 'Write and rehearse your behavioural answers' },
      { route: 'sse', href: '#/sse', name: 'Citadel SSE prep', desc: 'Study plan for the Semi-Systematic Equities phone screen' },
      { href: 'firms/', name: 'Firm guides', desc: "Each firm's process and reported questions, as plain pages" },
    ] },
    { id: 'games', name: 'Trading games', items: [
      { route: 'figgie', href: '#/figgie', name: 'Figgie', desc: "Jane Street's card trading game, against three bots" },
      { route: 'quote', href: '#/quote', name: 'Make me a market', desc: 'The interview format: quote two-sided prices and the interviewer trades against you' },
      { route: 'market', href: '#/market', name: 'Market-making sim', desc: 'Quote on hidden dice against informed flow' },
      { route: 'kelly', href: '#/kelly', name: 'Bet sizing', desc: 'How much to stake: the Kelly criterion in practice' },
      { route: 'estimate', href: '#/estimate', name: 'Estimation & calibration', desc: 'Quote ranges on unknown quantities' },
    ] },
  ];
  const itemFor = (k) => GROUPS().flatMap((g) => g.items).find((it) => it.route === k);
  // Which groups you've unfolded, remembered on this device.
  const GROUP_KEY = 'qt-more-open';
  const openGroups = () => { try { return JSON.parse(localStorage.getItem(GROUP_KEY) || '{}') || {}; } catch { return {}; } };

  function more(el) {
    let pref = 'auto';
    try { pref = localStorage.getItem('qt-keypad') || 'auto'; } catch { /* storage blocked: use default */ }
    const open = openGroups(), recent = QT.recentRoutes().map(itemFor).filter(Boolean).slice(0, 4);
    const row = (it) => `<a class="mrow" href="${it.href}"><b>${it.name}</b><span class="small">${it.desc}</span></a>`;
    el.innerHTML = `
      <h1>More</h1>
      <a class="card search-entry" href="#/search"><b>Search</b><span class="small">Find any interview question, topic, formula or trick</span></a>
      ${recent.length ? `<h2 class="menu-head">Recent</h2><div class="card mlist">${recent.map(row).join('')}</div>` : ''}
      <h2 class="menu-head">Everything</h2>
      ${GROUPS().map((g) => `<details class="card mgroup" data-g="${g.id}"${open[g.id] ? ' open' : ''}><summary><b>${g.name}</b> <span class="small">${g.items.map((it) => it.name).slice(0, 3).join(', ')}…</span></summary><div class="mlist">${g.items.map(row).join('')}</div></details>`).join('')}

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
      <div class="card protect" id="protect"></div>
      <details class="card backups"><summary><b>Automatic backups</b> <span class="small">(${store.backups().length} on this device)</span></summary>
        <p class="small">Theo keeps a copy of your progress each day you use it, and before anything replaces it (reset, import, sample data). The last 10 are kept, on this device only.</p>
        <div id="backup-list"></div>
      </details>
      <p class="small version">Theo ${QT.VERSION} · running as ${QT.platform.mode()}</p>`;

    // "Install as an app" card: only on the website, and only where installing is possible.
    const installBox = el.querySelector('#install');
    const drawInstall = () => {
      const P = QT.platform;
      if (P.native || P.standalone()) return (installBox.innerHTML = '');
      if (P.canInstall()) {
        installBox.innerHTML = `<h2>Install the app</h2><div class="card"><p style="margin-top:0">Add Theo to your home screen. It opens full-screen and works offline.</p><button id="do-install">Install</button></div>`;
        installBox.querySelector('#do-install').addEventListener('click', async () => { if (await P.install()) drawInstall(); });
      } else if (P.isIOS) {
        installBox.innerHTML = `<h2>Install the app</h2><div class="card">
          <p style="margin-top:0">In Safari, tap <b>Share</b> then <b>Add to Home Screen</b>. It opens full-screen, works offline, and iOS keeps its data safe from Safari's automatic clean-ups.</p>
          <p class="small" style="margin:0">The home-screen app keeps its own progress, separate from this Safari tab. To bring your progress across, tap <b>Export progress</b> below first, then <b>Import</b> it inside the app.</p></div>`;
      } else installBox.innerHTML = '';
    };
    drawInstall();
    document.addEventListener('qt:installable', drawInstall, { once: true });

    el.querySelectorAll('.mgroup').forEach((d) => d.addEventListener('toggle', () => {
      const o = openGroups();
      o[d.dataset.g] = d.open;
      try { localStorage.setItem(GROUP_KEY, JSON.stringify(o)); } catch { /* storage blocked */ }
    }));
    el.querySelector('#kp').addEventListener('change', (e) => {
      try { localStorage.setItem('qt-keypad', e.target.value); } catch { /* storage blocked */ }
    });
    el.querySelector('#exp').addEventListener('click', async () => {
      const msg = el.querySelector('#exp-msg');
      try {
        const how = await QT.platform.exportFile(`theo-progress-${new Date().toISOString().slice(0, 10)}.json`, store.exportJson());
        if (how) store.markExported();
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
    // Keeping progress safe outside the browser: browser data can be cleared, so offer a file.
    const BF = QT.backupFile;
    const drawProtect = async () => {
      const box = el.querySelector('#protect');
      if (!box) return;
      const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted().catch(() => false) : false;
      const last = store.get().lastExport;
      const fileLine = !BF || !BF.supported
        ? `<p class="small">Auto-backup to a file works in Chrome and Edge on a computer. In this browser, use <b>Export progress</b> now and then${last ? ` (last export ${new Date(last).toLocaleDateString()})` : ' (no export yet)'}.</p>`
        : BF.status() === 'on'
          ? `<p class="small">✓ Saving a copy to <b>${QT.ui.esc(BF.fileName() || 'your file')}</b> after every change${BF.lastWritten() ? `, last at ${new Date(BF.lastWritten()).toLocaleTimeString()}` : ''}. If your browser data is ever cleared, import that file.</p><button type="button" class="ghost" id="bf-stop">Stop</button>`
          : BF.status() === 'paused'
            ? `<p class="small">Auto-backup to <b>${QT.ui.esc(BF.fileName() || 'your file')}</b> is paused: the browser needs your permission again.</p><button type="button" id="bf-resume">Resume auto-backup</button>`
            : `<p class="small">Keep a copy of your progress in a file you choose (e.g. in Documents or OneDrive), updated automatically. It survives clearing your browser data.</p><button type="button" id="bf-choose">Choose a backup file</button>`;
      box.innerHTML = `<b>Keep your progress safe</b>
        <p class="small">${persisted ? '✓ This browser has agreed not to clear Theo\'s data to free up space.' : 'This browser may clear Theo\'s data to free up space, or when you clear browsing data. Installing Theo or bookmarking it helps.'}</p>
        ${fileLine}`;
      box.querySelector('#bf-choose')?.addEventListener('click', () => BF.choose().catch(() => {}).then(drawProtect));
      box.querySelector('#bf-resume')?.addEventListener('click', () => BF.resume().then(drawProtect));
      box.querySelector('#bf-stop')?.addEventListener('click', () => BF.stop().then(drawProtect));
    };
    drawProtect();
    if (BF) BF.onChange(drawProtect);

    const fmtWhen = (t) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    const drawBackups = () => {
      const list = store.backups(), box = el.querySelector('#backup-list');
      box.innerHTML = list.length ? `<ul class="backup-list">${list.map((b) => `
        <li><span><b>${fmtWhen(b.t)}</b> · ${QT.ui.esc(b.reason)}<br><span class="small">${b.days} day${b.days === 1 ? '' : 's'} practised · ${b.bank} interview question${b.bank === 1 ? '' : 's'} · ${b.topics} topic${b.topics === 1 ? '' : 's'}</span></span>
        <button type="button" class="ghost" data-restore="${b.t}">Restore</button></li>`).join('')}</ul>` : '<p class="small">No backups yet. The first is made the next time you practise.</p>';
    };
    drawBackups();
    el.querySelector('#backup-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-restore]');
      if (!btn) return;
      if (!confirm('Replace your current progress with this backup? Your current progress is backed up first, so you can undo this.')) return;
      if (store.restoreBackup(Number(btn.dataset.restore))) location.hash = '#/';
    });
    el.querySelector('#rst').addEventListener('click', () => {
      if (confirm('Erase all progress? A backup is kept under Automatic backups, so you can restore it.')) {
        store.reset();
        location.hash = '#/';
      }
    });
  }

  QT.views = Object.assign(QT.views || {}, { more });
})();
