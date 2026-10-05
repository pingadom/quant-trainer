// App shell: hash router. Each screen lives in js/views/ (or a self-contained module such as
// mental.js) and is looked up by the first path segment: #/topic/dice → views.topic(main, 'dice').
(function () {
  const store = QT.store, main = document.getElementById('main');

  const routes = {
    ...QT.views,
    estimate: (el) => QT.estimate.render(el),
    mental: (el) => QT.mental.render(el),
    market: (el) => QT.market.render(el),
    lab: (el) => QT.lab.render(el),
  };
  // Which nav item lights up for each route (the bottom tab bar has fewer items than the sidebar).
  const NAV_PARENT = { topic: 'practice', case: 'cases', iq: 'bank', mock: 'bank', drill: 'coach', tricks: 'mental' };
  const TAB_PARENT = { topic: 'practice', review: 'practice', mistakes: 'practice', drill: 'coach', cases: 'more', case: 'more', iq: 'bank', mock: 'bank', mental: 'more', tricks: 'more', market: 'more', estimate: 'more', lab: 'more', roadmap: 'more' };

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
    document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.route === tabKey));
    QT.ui.updateBadges();
    const h1 = main.querySelector('h1');
    document.title = key && h1 ? `${h1.textContent} · Quant Trainer` : 'Quant Trainer';
    window.scrollTo(0, 0);
    QT.platform.track();
  }
  QT.route = route;

  // Another tab saved progress (core.js adopted it). Re-render overview screens so they show
  // the latest numbers; leave anything mid-question alone and just refresh the badges.
  QT.onExternalChange = () => {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const overview = ['', 'coach', 'practice', 'bank', 'cases', 'more', 'roadmap'].includes(parts[0]) && parts.length === 1;
    const mistakesList = parts[0] === 'mistakes' && parts.length === 1;
    if (overview || mistakesList) route();
    else QT.ui.updateBadges();
  };

  // Shareable link that opens straight into the demo profile: …/quant-trainer/?demo
  if (new URLSearchParams(location.search).has('demo')) {
    if (store.isEmpty()) QT.demo.load();
    history.replaceState(null, '', location.pathname + location.hash); // so "Start my own" sticks after a reload
  }

  window.addEventListener('hashchange', route);
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
