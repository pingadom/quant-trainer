// Platform layer: the same www/ build runs as a website, an installed PWA, or a native
// Capacitor app. Everything that differs between those lives here.
//
// Native plugins are reached through window.Capacitor.Plugins (no bundler needed). Every call
// degrades gracefully when a plugin isn't installed, so the web build never depends on them.
(function () {
  const Cap = window.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const plugin = (name) => (native && Cap.Plugins && Cap.Plugins[name]) || null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let installEvent = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // show our own button instead of the browser's mini-infobar
    installEvent = e;
    document.dispatchEvent(new Event('qt:installable'));
  });
  window.addEventListener('appinstalled', () => { installEvent = null; });

  const P = (QT.platform = {
    native,
    name: native ? Cap.getPlatform() : 'web', // 'android' | 'ios' | 'web'
    mode: () => (native ? `${Cap.getPlatform()} app` : standalone() ? 'installed web app' : 'website'),
    isIOS,
    standalone,

    // ---- install (web only) ----
    canInstall: () => !!installEvent,
    async install() {
      if (!installEvent) return false;
      installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      installEvent = null;
      return outcome === 'accepted';
    },

    // ---- storage mirror (native only) ----
    // localStorage is the working copy everywhere. On native we also mirror to the
    // Preferences plugin, because iOS may evict WebView storage under pressure.
    persist(key, json) {
      const p = plugin('Preferences');
      if (p) p.set({ key, value: json }).catch(() => {});
    },
    async restore(key) {
      const p = plugin('Preferences');
      if (!p) return null;
      try {
        return (await p.get({ key })).value;
      } catch {
        return null;
      }
    },

    // ---- export a file ----
    async exportFile(name, text) {
      const fs = plugin('Filesystem'), share = plugin('Share');
      if (fs && share) {
        const { uri } = await fs.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
        await share.share({ title: name, url: uri, dialogTitle: 'Save your progress' });
        return 'shared';
      }
      if (native) {
        // No file plugins installed: fall back to the clipboard.
        await navigator.clipboard.writeText(text);
        return 'copied';
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return 'downloaded';
    },
  });

  document.documentElement.classList.add(native ? 'is-native' : 'is-web', `platform-${P.name}`);

  // Android hardware back button: go back through the app's screens, exit from the dashboard.
  const app = plugin('App');
  if (app) {
    app.addListener('backButton', () => {
      if (location.hash && location.hash !== '#/' && history.length > 1) history.back();
      else app.exitApp();
    });
  }

  // Match the status bar to the theme.
  const bar = plugin('StatusBar');
  if (bar) {
    const sync = () => bar.setStyle({ style: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT' }).catch(() => {});
    sync();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync);
  }

  // Optional, privacy-friendly page-view counts (website only; configure in js/config.js).
  // GoatCounter sets no cookies and stores no personal data; we also honour Do Not Track.
  P.track = () => {};
  const gc = (window.QT_CONFIG || {}).goatcounter;
  if (!native && gc && /^[a-z0-9-]+$/.test(gc) && navigator.doNotTrack !== '1' && location.protocol === 'https:') {
    window.goatcounter = { no_onload: true }; // we count route changes ourselves (hash routing)
    P.track = () => window.goatcounter.count && window.goatcounter.count({ path: location.pathname + (location.hash || '#/'), title: document.title });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${gc}.goatcounter.com/count`;
    s.onload = () => P.track();
    document.head.appendChild(s);
  }

  // Offline support for the website. Native builds bundle the files, so they don't need it.
  if (!native && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
