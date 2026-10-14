// Auto-backup to a file you choose (Chrome and Edge on desktop: the File System Access API).
// Browser storage can be wiped by "clear browsing data", a clean-on-exit setting or a cleaner
// app, and the in-browser backups go with it. A file on your disk (or in a synced folder like
// OneDrive) survives all of that, and restoring it is just Import.
//
// You pick the file once. Theo rewrites it a few seconds after each change. The file handle is
// kept in IndexedDB; after a browser restart the browser may need you to allow access again,
// which needs a click, so More shows a "Resume" button in that case.
(function () {
  const supported = typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'indexedDB' in window;
  const DB = 'theo-files', STORE = 'handles', KEY = 'progress';
  let handle = null, status = supported ? 'off' : 'unsupported', lastWritten = null, timer = null;
  const listeners = new Set();
  const changed = () => listeners.forEach((fn) => fn());

  function db() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, mode), req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function write() {
    if (!handle || status !== 'on') return;
    try {
      const w = await handle.createWritable();
      await w.write(QT.store.exportJson());
      await w.close();
      lastWritten = Date.now();
    } catch {
      status = 'paused'; // permission withdrawn or the file was moved
    }
    changed();
  }
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(write, 3000);
  };

  async function choose() {
    handle = await window.showSaveFilePicker({ suggestedName: 'theo-progress.json', types: [{ description: 'Theo progress', accept: { 'application/json': ['.json'] } }] });
    await idb('readwrite', (s) => s.put(handle, KEY));
    status = 'on';
    await write();
  }
  async function resume() {
    if (!handle) return;
    if ((await handle.requestPermission({ mode: 'readwrite' })) === 'granted') {
      status = 'on';
      await write();
    }
    changed();
  }
  async function stop() {
    handle = null;
    status = 'off';
    try { await idb('readwrite', (s) => s.delete(KEY)); } catch { /* nothing stored */ }
    changed();
  }

  // On start-up: pick up a file chosen earlier, if the browser still lets us write to it.
  if (supported) {
    idb('readonly', (s) => s.get(KEY)).then(async (h) => {
      if (!h) return;
      handle = h;
      status = (await h.queryPermission({ mode: 'readwrite' })) === 'granted' ? 'on' : 'paused';
      changed();
      if (status === 'on') schedule();
    }).catch(() => {});
    QT.store.onSave(schedule);
  }

  QT.backupFile = {
    supported,
    status: () => status,
    fileName: () => (handle ? handle.name : null),
    lastWritten: () => lastWritten,
    choose, resume, stop,
    onChange: (fn) => { listeners.clear(); listeners.add(fn); }, // one screen listens at a time
  };
})();
