// Appearance: theme, ticker, motion and sound preferences. Loaded in <head> without `defer`
// so the theme is applied before the first paint (no flash of the wrong colours). Preferences
// are per device, in localStorage. "auto" follows the system: Notebook by day, Night desk at night.
(function () {
  const QT = (window.QT = window.QT || {});
  const THEMES = {
    notebook: { name: 'Notebook', dark: false, bg: '#f5efe3', blurb: 'Paper, ink and graph lines. Serif headings; every number in an even-width monospace.' },
    night: { name: 'Night desk', dark: true, bg: '#141519', blurb: 'The notebook after hours: warm ink on charcoal, easy on the eyes at night.' },
    chalk: { name: 'Chalkboard', dark: true, bg: '#1f2e27', blurb: 'A maths-department blackboard: chalk-yellow highlights and handwritten headings.' },
    terminal: { name: 'Terminal', dark: true, bg: '#0c0d0b', blurb: 'An amber trading terminal: monospace everything, dense and quiet.' },
  };
  const DEFAULTS = { 'qt-theme': 'auto', 'qt-ticker': 'on', 'qt-motion': 'on', 'qt-sound': 'off' };
  const get = (k) => {
    try {
      return localStorage.getItem(k) ?? DEFAULTS[k];
    } catch {
      return DEFAULTS[k];
    }
  };
  const root = document.documentElement;
  const media = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} });
  const darkMq = media('(prefers-color-scheme: dark)'), lessMotion = media('(prefers-reduced-motion: reduce)');

  const choice = () => { const v = get('qt-theme'); return v === 'auto' || THEMES[v] ? v : 'auto'; };
  const current = () => { const c = choice(); return c === 'auto' ? (darkMq.matches ? 'night' : 'notebook') : c; };
  const motion = () => get('qt-motion') !== 'off' && !lessMotion.matches;

  function apply() {
    const c = choice();
    if (c === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', c);
    root.dataset.motion = motion() ? 'on' : 'off';
    root.dataset.ticker = get('qt-ticker') === 'off' ? 'off' : 'on';
    // Browser chrome (address bar, Android task switcher) matches the page.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      const dark = (m.getAttribute('media') || '').includes('dark');
      m.setAttribute('content', c === 'auto' ? THEMES[dark ? 'night' : 'notebook'].bg : THEMES[c].bg);
    });
    document.dispatchEvent(new CustomEvent('qt:theme'));
  }

  QT.theme = {
    THEMES,
    choice,
    current,
    dark: () => THEMES[current()].dark,
    motion,
    ticker: () => get('qt-ticker') !== 'off',
    sound: () => get('qt-sound') === 'on',
    get,
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch { /* storage blocked: applies for this visit only */ }
      apply();
    },
  };
  darkMq.addEventListener('change', apply);
  lessMotion.addEventListener('change', apply);
  window.addEventListener('storage', (e) => { if (e.key in DEFAULTS) apply(); }); // changed in another tab
  apply();
})();
