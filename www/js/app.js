// App shell: hash router. Each screen lives in js/views/ (or a self-contained module such as
// mental.js) and is looked up by the first path segment: #/topic/dice → views.topic(main, 'dice').
(function () {
  const store = QT.store, main = document.getElementById('main');

  const routes = {
    ...QT.views,
    estimate: (el) => QT.estimate.render(el),
    mental: (el, ...args) => QT.mental.render(el, ...args),
    market: (el) => QT.market.render(el),
    lab: (el) => QT.lab.render(el),
    quote: (el) => QT.quote.render(el),
    kelly: (el) => QT.kelly.render(el),
    figgie: (el) => QT.figgie.render(el),
    daily: (el) => QT.daily.render(el),
    oa: (el) => QT.oa.render(el),
    talk: (el, id) => QT.talk.render(el, id),
  };
  // Which nav item lights up for each route (the bottom tab bar has fewer items than the sidebar).
  const NAV_PARENT = { topic: 'practice', case: 'cases', iq: 'bank', drill: 'coach', appearance: 'more', tour: '' };
  // Phone tabs: Home · Coach (my prep) · Practice (learn and practise) · Interviews · More (games, settings).
  const TAB_PARENT = {
    plan: 'coach', daily: 'coach', progress: 'coach', roadmap: 'coach', drill: 'coach',
    topic: 'practice', flashcards: 'practice', tricks: 'practice', cases: 'practice', case: 'practice', lab: 'practice', review: 'practice', mistakes: 'practice', mental: 'practice', oa: 'practice',
    iq: 'bank', mock: 'bank', talk: 'bank',
    figgie: 'more', quote: 'more', market: 'more', kelly: 'more', estimate: 'more', appearance: 'more', tour: '',
  };

  const decode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s; // malformed escape in a hand-edited link
    }
  };

  function route() {
    if (QT.cleanup) QT.cleanup(); // stop timers etc. left by the previous screen
    QT.cleanup = null;
    const [name = '', ...args] = location.hash.replace(/^#\/?/, '').split('/');
    // Own properties only: `name in routes` would also match "toString", "constructor", …
    const key = Object.prototype.hasOwnProperty.call(routes, name) ? name : '';
    try {
      routes[key](main, ...args.map(decode));
    } catch (err) {
      // Never leave the previous screen up with no explanation.
      console.error(err);
      main.innerHTML = `<h1>Something went wrong</h1><div class="card"><p style="margin-top:0">This screen hit an unexpected error. Your progress is safe.</p><a class="btn" href="#/">Go to the home screen</a></div>`;
    }
    if (store.get().demo) {
      // Sample data must never be mistaken for real progress.
      main.insertAdjacentHTML('afterbegin', `<div class="demo-banner" role="status"><span><b>Sample data.</b> You're exploring a demo profile.</span><button type="button" class="link" id="demo-off">Start my own →</button></div>`);
      main.querySelector('#demo-off').addEventListener('click', () => {
        store.reset();
        location.hash = '#/';
        route();
      });
    }
    const navKey = NAV_PARENT[key] ?? key, tabKey = TAB_PARENT[key] ?? key;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === navKey));
    // The section holding the current page is always open.
    document.querySelector('.nav a.active')?.closest('details.nav-sec')?.setAttribute('open', '');
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.route === tabKey));
    QT.ui.updateBadges();
    QT.flair.ticker();
    const h1 = main.querySelector('h1');
    document.title = key && h1 ? `${h1.textContent} · Theo` : 'Theo · Quant trading interview practice';
    window.scrollTo(0, 0);
    QT.platform.track();
  }
  QT.route = route;

  // Another tab saved progress (core.js adopted it). Re-render overview screens so they show
  // the latest numbers; leave anything mid-question alone and just refresh the badges.
  QT.onExternalChange = () => {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const overview = ['', 'coach', 'practice', 'bank', 'cases', 'more', 'roadmap', 'progress', 'plan'].includes(parts[0]) && parts.length === 1;
    const mistakesList = parts[0] === 'mistakes' && parts.length === 1;
    if (overview || mistakesList) route();
    else QT.ui.updateBadges();
  };

  // Shareable link that opens straight into the demo profile: …/theo/?demo
  if (new URLSearchParams(location.search).has('demo')) {
    if (store.isEmpty()) QT.demo.load();
    history.replaceState(null, '', location.pathname + location.hash); // so "Start my own" sticks after a reload
  }

  // Sidebar sections fold open or shut; remember each one's state on this device.
  const NAV_KEY = 'qt-nav';
  let folded = {};
  try { folded = JSON.parse(localStorage.getItem(NAV_KEY) || '{}') || {}; } catch { /* storage blocked */ }
  document.querySelectorAll('details.nav-sec').forEach((d) => {
    if (folded[d.dataset.sec]) d.removeAttribute('open');
    d.addEventListener('toggle', () => {
      folded[d.dataset.sec] = !d.open;
      try { localStorage.setItem(NAV_KEY, JSON.stringify(folded)); } catch { /* storage blocked */ }
    });
  });

  window.addEventListener('hashchange', route);
  // A link to the screen you're already on (e.g. "Back" on a game's results, which shares the
  // game's URL) changes nothing, so no hashchange fires: re-render it instead.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#/' && !location.hash.replace(/^#\/?/, ''))) {
      e.preventDefault();
      route();
    }
  });
  route();

  // Native: if the WebView's storage was cleared but the durable copy survives, restore it.
  if (QT.platform.native && store.isEmpty()) {
    QT.platform.restore(store.KEY).then((json) => {
      if (!json) return;
      try {
        store.importJson(json);
        route();
      } catch { /* corrupt backup: keep the fresh state */ }
    });
  }
})();
