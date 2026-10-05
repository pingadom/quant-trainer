// Appearance: pick a theme (each swatch is drawn in its own theme's colours) and switch the
// ticker, animations and sounds. Preferences live in js/theme.js.
(function () {
  const T = () => QT.theme;

  const SWITCHES = [
    { key: 'qt-ticker', on: 'on', off: 'off', label: 'Ticker tape', hint: 'Your numbers scrolling across the top of the screen' },
    { key: 'qt-motion', on: 'on', off: 'off', label: 'Animations', hint: 'Rolling numbers, stamps, the ticker. Always off if your device asks for less motion' },
    { key: 'qt-sound', on: 'on', off: 'off', label: 'Sounds', hint: 'A closing bell for personal bests and milestones' },
  ];

  function appearance(el) {
    const choice = T().choice();
    const opt = (id, name, previewId) => `
      <button type="button" class="theme-opt" role="radio" aria-checked="${choice === id}" data-theme-pick="${id}">
        <span class="swatch" data-theme="${previewId}" aria-hidden="true"><span class="sw-tape"></span><span class="sw-head">Aa 52</span><span class="sw-bar"></span><span class="sw-up"></span></span>
        <span class="name">${name}<span aria-hidden="true">${choice === id ? '●' : ''}</span></span>
      </button>`;
    el.innerHTML = `
      <a class="back" href="#/more">← More</a>
      <h1>Appearance</h1>
      <p class="lede">${T().THEMES[T().current()].blurb}</p>
      <div class="theme-grid" role="radiogroup" aria-label="Theme">
        ${opt('auto', 'Match system', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'notebook')}
        ${Object.entries(T().THEMES).map(([id, t]) => opt(id, t.name, id)).join('')}
      </div>
      <p class="small">“Match system” uses Notebook in light mode and Night desk in dark mode.</p>
      <div class="card">
        ${SWITCHES.map((s) => {
          const on = T().get(s.key) === s.on;
          return `<div class="switch-row"><span><b>${s.label}</b><br><span class="small">${s.hint}</span></span>
            <button type="button" class="switch" role="switch" aria-checked="${on}" aria-label="${s.label}" data-switch="${s.key}"></button></div>`;
        }).join('')}
      </div>
      <p class="small">Saved on this device. <button type="button" class="link" id="bell-test">Hear the bell</button></p>`;

    el.querySelectorAll('[data-theme-pick]').forEach((b) => b.addEventListener('click', () => {
      T().set('qt-theme', b.dataset.themePick);
      appearance(el);
      el.querySelector(`[data-theme-pick="${b.dataset.themePick}"]`).focus();
    }));
    el.querySelectorAll('[data-switch]').forEach((b) => b.addEventListener('click', () => {
      const s = SWITCHES.find((x) => x.key === b.dataset.switch);
      T().set(s.key, T().get(s.key) === s.on ? s.off : s.on);
      appearance(el);
      el.querySelector(`[data-switch="${s.key}"]`).focus();
    }));
    el.querySelector('#bell-test').addEventListener('click', () => {
      if (!T().sound()) T().set('qt-sound', 'on');
      QT.flair.bell();
      appearance(el);
    });
  }

  QT.views = Object.assign(QT.views || {}, { appearance });
})();
