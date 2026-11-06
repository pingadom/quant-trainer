// Runs code for the Coding screen off the page's thread, so a slow or endless loop can't freeze
// the app: the page ends this worker if a test runs too long (js/code.js). JavaScript runs here
// directly. Python runs in Pyodide (CPython compiled to WebAssembly), downloaded once from a CDN.
//
// Messages in:  { job, id, lang: 'py' | 'js', code, mode: 'run' | 'submit' }
// Messages out: { job, type: 'status', text }   progress to show
//               { job, type: 'begin', i, n, label, timeout }   before each case (the page's watchdog)
//               { job, type: 'case', i, res }   one result
//               { job, type: 'end' } | { job, type: 'error', text }
(function () {
  self.QT = {};
  importScripts('code-problems.js', 'sse-py.js');
  const C = self.QT.code;
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  // The large test passes within this multiple of the reference solution's time on this device.
  const SLACK = { js: 10, py: 6 }, FLOOR = { js: 1000, py: 2000 };

  // Python side of the runner: loads code into a namespace and runs one case, capturing print().
  const HARNESS = `
import json, re, sys, time, traceback

class _Cap:
    def __init__(self):
        self.parts, self.n = [], 0
    def write(self, s):
        if self.n < 4000:
            self.parts.append(s[:4000 - self.n])
        self.n += len(s)
        return len(s)
    def flush(self):
        pass
    def text(self):
        return ''.join(self.parts) + ('\\n... (output cut)' if self.n > 4000 else '')

_slots = {}

def _snake(s):
    return re.sub(r'([a-z0-9])([A-Z])', r'\\1_\\2', s).lower()

def _norm(x):
    if x is None or isinstance(x, (bool, int, str)):
        return x
    if isinstance(x, float):
        return x if x == x and abs(x) != float('inf') else repr(x)
    if isinstance(x, dict):
        return {str(k): _norm(v) for k, v in x.items()}
    if isinstance(x, (set, frozenset)):
        try:
            return sorted(_norm(v) for v in x)
        except TypeError:
            return [_norm(v) for v in x]
    if hasattr(x, '__iter__'):
        return [_norm(v) for v in x]
    return repr(x)

def _tb(fname):
    t, v, tb = sys.exc_info()
    while tb is not None and tb.tb_frame.f_code.co_filename != fname:
        tb = tb.tb_next
    return ''.join(traceback.format_exception(t, v, tb))[-3000:]

def _load(slot, code):
    out, old = _Cap(), sys.stdout
    sys.stdout = out
    try:
        ns = {'__name__': '__main__'}
        exec(compile(code, slot + '.py', 'exec'), ns)
        _slots[slot] = ns
        return json.dumps({'ok': True, 'names': [k for k in ns if not k.startswith('__')], 'stdout': out.text()})
    except BaseException:
        return json.dumps({'ok': False, 'err': _tb(slot + '.py'), 'stdout': out.text()})
    finally:
        sys.stdout = old

def _drill(test):
    out, old = _Cap(), sys.stdout
    res = {}
    sys.stdout = out
    try:
        env = {'solution': _slots['solution']}
        exec(compile(test, 'tests.py', 'exec'), env)
        res['cases'] = [[str(n), bool(p), str(d)] for n, p, d in env['run']()]
    except BaseException:
        res['err'] = _tb('solution.py')
    finally:
        sys.stdout = old
    res['stdout'] = out.text()
    return json.dumps(res)

def _run(slot, spec):
    s = json.loads(spec)
    out, old = _Cap(), sys.stdout
    res, got, at = {}, [], None
    sys.stdout = out
    try:
        name = s['name']
        impl = _slots[slot].get(name)
        if impl is None:
            raise NameError('Define ' + ('a class' if s['kind'] == 'cls' else 'a function') + ' called ' + name)
        t0 = time.perf_counter()
        if s['kind'] == 'fn':
            res['out'] = _norm(impl(*s['args']))
        else:
            obj = impl(*s['init'])
            for k, op in enumerate(s['ops']):
                at = k
                m = getattr(obj, _snake(op[0]), None)
                if m is None:
                    raise AttributeError(name + ' has no method ' + _snake(op[0]))
                got.append(_norm(m(*op[1:])))
            res['out'] = got
        res['ms'] = (time.perf_counter() - t0) * 1000
    except BaseException:
        res.update(err=_tb(slot + '.py'), at=at, partial=got)
    finally:
        sys.stdout = old
    res['stdout'] = out.text()
    return json.dumps(res)
  `;

  let py = null; // Pyodide, once loaded
  let refLoaded = null; // which problem's Python reference is loaded
  let job = 0;
  const post = (m) => self.postMessage({ job, ...m });

  async function python() {
    if (py) return py;
    post({ type: 'status', text: 'Loading Python (about 13 MB the first time; your browser keeps it for next time)…' });
    try {
      importScripts(PYODIDE + 'pyodide.js');
      py = await self.loadPyodide({ indexURL: PYODIDE });
    } catch (err) {
      throw new Error('Python could not be loaded. It needs an internet connection the first time; JavaScript works offline.', { cause: err });
    }
    py.runPython(HARNESS);
    return py;
  }
  const pyLoad = (slot, code) => JSON.parse(py.globals.get('_load')(slot, code));
  const pyRun = (slot, P, t) => JSON.parse(py.globals.get('_run')(slot, JSON.stringify({ kind: P.kind, name: C.pyName(P), args: t.args, init: t.init, ops: t.ops })));

  // JavaScript: console.log output goes into the current case's buffer.
  let logs = [];
  const fmt = (x) => (typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })());
  const con = Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map((k) => [k, (...a) => { if (logs.join('\n').length < 4000) logs.push(a.map(fmt).join(' ')); }]));
  // "Error: … at <anonymous>:12:5" → the line in the user's code (the wrapper adds 3 lines above it).
  function jsError(err) {
    const m = /<anonymous>:(\d+):\d+/.exec(String(err && err.stack));
    const line = m ? +m[1] - 3 : 0;
    return `${err && err.name ? err.name : 'Error'}: ${err && err.message !== undefined ? err.message : String(err)}${line > 0 ? ` (line ${line})` : ''}`;
  }
  function jsRun(impl, P, t) {
    logs = [];
    const t0 = performance.now();
    try {
      const out = C.exec(impl, P, t);
      return { out, ms: performance.now() - t0, stdout: logs.join('\n') };
    } catch (err) {
      return { err: jsError(err), at: err && err.at, partial: err && err.partial, stdout: logs.join('\n') };
    }
  }

  // Shows the calls up to the first wrong one (at most a dozen), each with what came back.
  function detail(P, t, got, lang, ctorFailed) {
    const lines = C.calls(P, t, lang), cut = (s) => (s.length > 300 ? s.slice(0, 300) + ' …' : s);
    if (ctorFailed) return { head: cut(lines[0][0]), ctor: true, skipped: 0, lines: [] };
    const outs = P.kind === 'fn' ? [got] : [undefined, ...(got || [])];
    let bad = lines.findIndex(([, exp], k) => k > 0 || P.kind === 'fn' ? !C.same(outs[k], exp) : false);
    if (bad < 0) bad = lines.length - 1;
    const from = Math.max(P.kind === 'fn' ? 0 : 1, bad - 10);
    const shown = lines.slice(from, bad + 1).map(([c, exp], j) => {
      const k = from + j;
      const quiet = exp === undefined || (exp === null && k !== bad); // calls that return nothing
      return { call: cut(c), exp: quiet ? null : cut(C.show(exp, lang)), got: k < outs.length && outs[k] !== undefined ? cut(C.show(outs[k], lang)) : null, bad: k === bad };
    });
    return { head: P.kind === 'cls' ? cut(lines[0][0]) : null, skipped: from - (P.kind === 'fn' ? 0 : 1), lines: shown };
  }

  // A Python drill from the Citadel SSE questions: { job, drill: id, code }.
  async function drill(m) {
    await python();
    post({ type: 'status', text: 'Loading numpy and pandas (about 12 MB the first time)…' });
    await py.loadPackage(['numpy', 'pandas'], { messageCallback: () => {} });
    post({ type: 'status', text: 'Running the tests…' });
    const r = pyLoad('solution', m.code);
    if (!r.ok) return post({ type: 'error', text: r.err, stdout: r.stdout });
    post({ type: 'drill', res: JSON.parse(py.globals.get('_drill')(QT.ssePy[m.drill].test)) });
  }

  self.onmessage = async ({ data: m }) => {
    job = m.job;
    if (m.drill) {
      try {
        await drill(m);
      } catch (err) {
        post({ type: 'error', text: err && err.message ? err.message : String(err) });
      }
      return;
    }
    const P = C.byId(m.id), lang = m.lang;
    try {
      if (m.mode === 'submit') post({ type: 'status', text: 'Preparing the tests…' });
      const list = C.cases(P, m.mode);
      let impl = null;
      if (lang === 'js') {
        logs = [];
        try {
          impl = C.compileJs(m.code, P.name, con);
        } catch (err) {
          return post({ type: 'error', text: jsError(err), stdout: logs.join('\n') });
        }
        if (typeof impl !== 'function') return post({ type: 'error', text: `Define ${P.kind === 'cls' ? 'a class' : 'a function'} called ${P.name}.` });
      } else {
        await python();
        const r = pyLoad('solution', m.code);
        if (!r.ok) return post({ type: 'error', text: r.err, stdout: r.stdout });
        if (!r.names.includes(C.pyName(P))) return post({ type: 'error', text: `Define ${P.kind === 'cls' ? 'a class' : 'a function'} called ${C.pyName(P)}.`, stdout: r.stdout });
      }
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        let limit = null;
        if (t.perf) {
          // Time the reference on this device, so the limit is fair on a slow phone too.
          post({ type: 'begin', i, n: list.length, label: 'Timing the reference solution on the large test…', timeout: 120000 });
          let refMs;
          if (lang === 'js') {
            const t0 = performance.now();
            C.exec(C.refImpl(P), P, t);
            refMs = performance.now() - t0;
          } else {
            if (refLoaded !== P.id) pyLoad('reference', P.ref.py);
            refLoaded = P.id;
            refMs = pyRun('reference', P, t).ms;
          }
          limit = Math.max(FLOOR[lang], SLACK[lang] * refMs);
        }
        post({ type: 'begin', i, n: list.length, label: t.label, timeout: limit ? limit + 5000 : lang === 'py' ? 15000 : 8000 });
        const r = lang === 'js' ? jsRun(impl, P, t) : pyRun('solution', P, t);
        const right = !r.err && C.same(r.out, t.out);
        const res = {
          label: t.label, ex: !!t.ex, why: t.why || '', perf: !!t.perf, ms: r.ms, limit, stdout: r.stdout || '',
          pass: right && (!limit || r.ms <= limit), slow: right && !!limit && r.ms > limit,
          err: r.err || null,
        };
        // An error with no call index came from the constructor.
        if (!res.pass) res.detail = detail(P, t, r.err ? (P.kind === 'fn' ? undefined : r.partial) : r.out, lang, !!r.err && P.kind === 'cls' && (r.at === null || r.at === undefined));
        post({ type: 'case', i, res });
      }
      post({ type: 'end' });
    } catch (err) {
      post({ type: 'error', text: err && err.message ? err.message : String(err) });
    }
  };
})();
