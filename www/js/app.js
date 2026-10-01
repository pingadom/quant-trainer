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
  const NAV_PARENT = { topic: 'practice', case: 'cases', iq: 'bank', mock: 'bank', drill: 'coach' };
  const TAB_PARENT = { topic: 'practice', review: 'practice', mistakes: 'practice', drill: 'coach', cases: 'more', case: 'more', iq: 'bank', mock: 'bank', mental: 'more', market: 'more', estimate: 'more', lab: 'more', roadmap: 'more' };

  function route() {
    if (QT.cleanup) QT.cleanup(); // stop timers etc. left by the previous screen
    QT.cleanup = null;
    const [name = '', ...args] = location.hash.replace(/^#\/?/, '').split('/');
    const key = name in routes ? name : '';
    routes[key](main, ...args.map(decodeURIComponent));
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
