// The handbook: a work-through course. Routes:
//   #/handbook                 the course, your progress and what to do next
//   #/handbook/<chapter>       one chapter: lessons, worked examples, checks, homework
//   #/handbook/review          spaced review of chapters you have finished
//   #/handbook/exam/<part|all> a mixed exam with no hints
//   #/handbook/sheet           every chapter's summary on one page
//
// Content lives in hb-part*.js, diagrams in hb-figs.js and extra tools in hb-widgets.js. A chapter
// is finished when every check is right and all its core and interview homework is done.
// Progress is saved in state.handbook, and exam scores in state.hbExams.
(function () {
  const store = QT.store, R = QT.rand, f = QT.fmtNum, esc = QT.escapeHtml;
  const HB = () => QT.handbook;
  const order = () => HB().PARTS.flatMap((p) => p.chapters);
  const chapter = (id) => HB().CHAPTERS[id];
  const rec = (id) => store.get().handbook?.[id] || { c: {}, h: {}, done: false };
  const DAY = 86400000, REVIEW_GAPS = [3, 7, 21, 60], PASS = 0.8;
  const required = (h) => !['stretch', 'lab'].includes(h.c.lvl);
  const LEVELS = { core: 'Core', interview: 'Interview', stretch: 'Stretch', lab: 'Lab' };

  function progress(id) {
    const ch = chapter(id), r = rec(id), checks = HB().checksOf(ch), hw = HB().homeworkOf(ch).filter(required);
    const right = checks.filter(({ key }) => r.c?.[key]).length, hwDone = hw.filter(({ key }) => (r.h?.[key] || 0) >= 1).length;
    const learned = checks.length > 0 && right >= checks.length;
    return { n: checks.length, right, hw: hw.length, hwDone, learned, done: learned && hwDone >= hw.length };
  }
  // Called after any answer: a chapter finished for the first time joins the review schedule.
  function settle(id) {
    const r = store.get().handbook[id], p = progress(id), justDone = p.done && !r.done;
    r.done = p.done;
    if (justDone && !r.rv) r.rv = { due: Date.now() + REVIEW_GAPS[0] * DAY, st: 0 };
    store.touchDay();
    store.save();
    return justDone;
  }
  const entry = (id) => {
    const s = store.get();
    s.handbook ||= {};
    const r = (s.handbook[id] ||= { c: {}, h: {}, done: false });
    r.c ||= {};
    r.h ||= {};
    return r;
  };
  function markCheck(id, key, ok) {
    const r = entry(id);
    if (ok) r.c[key] = 1;
    else if (!r.c[key]) r.c[key] = 0;
    return settle(id);
  }
  // Homework: 2 is right or "got it", 1 is "partly", 0 is "missed".
  function markHomework(id, key, score) {
    const r = entry(id);
    r.h[key] = Math.max(score, score === 0 ? 0 : r.h[key] || 0);
    return settle(id);
  }
  // The next chapter to work on: the first that isn't finished.
  const nextChapter = () => order().find((id) => !progress(id).done);
  const dueReviews = (now = Date.now()) => order().filter((id) => { const v = rec(id).rv; return v && v.due <= now; });

  // ---------------------------------------------------------------- questions anywhere
  // Every question that can be marked automatically, for warm-ups, reviews and exams.
  function pool(ids) {
    return ids.flatMap((id) => {
      const ch = chapter(id);
      return [...HB().checksOf(ch), ...HB().homeworkOf(ch)].filter(({ c }) => c.opts || Number.isFinite(c.a)).map(({ c, key }) => ({ id, key, c }));
    });
  }
  const readAnswer = (raw) => { const v = QT.parseAnswer(raw); return Number.isNaN(v) ? QT.evalExpr(raw) : v; };
  // Options are written with the right answer first, then shown in an order fixed for each question.
  function shuffled(c, seed) {
    let h = 7;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    return c.opts.map((o, i) => ({ text: Array.isArray(o) ? o[0] : o, why: Array.isArray(o) ? o[1] : '', right: i === 0, order: (h * (i + 3) * 37) % 101 })).sort((a, b) => a.order - b.order);
  }

  // One question at a time. opts: { exam, title, done(results), finishText }.
  function runQuiz(box, items, opts = {}) {
    let at = 0;
    const results = [];
    const draw = () => {
      if (at >= items.length) return opts.done?.(results);
      const it = items[at], c = it.c, title = chapter(it.id).title;
      const options = c.opts ? shuffled(c, `${it.id}${it.key}`) : null;
      box.innerHTML = `
        <div class="eyebrow">${esc(opts.title || 'Question')} · ${at + 1} of ${items.length}${opts.exam ? '' : ` · ${esc(title)}`}</div>
        <p class="question">${c.q}</p>
        <form class="hb-run" autocomplete="off">
          ${options ? `<div class="hb-opts">${options.map((o, i) => `<button type="button" class="hb-opt" data-o="${i}">${o.text}</button>`).join('')}</div>`
            : `<div class="answer-row"><input type="text" autocapitalize="off" aria-label="Your answer" placeholder="Your answer"><button>${opts.exam ? 'Submit' : 'Check'}</button></div>`}
        </form>
        <div class="hb-fb" aria-live="polite"></div>`;
      const fb = box.querySelector('.hb-fb');
      const finish = (ok, typed) => {
        results.push({ ...it, ok, typed });
        if (opts.exam) { at++; return draw(); }
        box.querySelectorAll('input, .hb-run button').forEach((x) => { x.disabled = true; });
        fb.innerHTML = `<span class="fb-inline ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : 'Not this time'}</span><div class="solution">${c.sol}</div><button type="button" class="hb-next">${at + 1 < items.length ? 'Next' : esc(opts.finishText || 'Finish')}</button>`;
        box.querySelector('.hb-next').addEventListener('click', () => { at++; draw(); });
        box.querySelector('.hb-next').focus();
      };
      if (options) {
        box.querySelectorAll('.hb-opt').forEach((b) => b.addEventListener('click', () => {
          const o = options[+b.dataset.o];
          finish(o.right, o.text);
        }));
      } else {
        const input = box.querySelector('input');
        box.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          if (!input.value.trim()) return (fb.textContent = 'Type an answer first.');
          const v = readAnswer(input.value);
          if (Number.isNaN(v)) return (fb.textContent = "Couldn't read that. Try 0.25, 1/4, 25% or sqrt(2)/2.");
          finish(QT.isCorrect(v, c.a, c.tol || {}), input.value);
        });
        input.focus({ preventScroll: true });
      }
    };
    draw();
  }

  // ---------------------------------------------------------------- the course page
  function index(el) {
    const all = order(), done = all.filter((id) => progress(id).done).length, next = nextChapter(), due = dueReviews();
    const exams = store.get().hbExams || {};
    const examRow = (id, label) => { const e = exams[id]; return `<a class="btn ghost" href="#/handbook/exam/${id}">${esc(label)}${e ? ` · best ${Math.round(e.best * 100)}%` : ''}</a>`; };
    el.innerHTML = `
      <h1>Handbook</h1>
      <p class="lede">A complete course, from fractions to factor models, written to be worked through in order. Finish it properly and you will have met, practised and been tested on everything a quant trading interview asks.</p>
      <div class="card hb-overview">
        <div class="row" style="justify-content:space-between"><b>${done} of ${all.length} chapters finished</b>${next ? `<a class="btn" href="#/handbook/${next}">${done || rec(next).c && Object.keys(rec(next).c).length ? 'Continue' : 'Start'}: ${esc(chapter(next).title)}</a>` : '<a class="btn" href="#/handbook/exam/all">Sit the final exam</a>'}</div>
        <div class="bar stack" role="progressbar" aria-label="Chapters finished" aria-valuenow="${Math.round((100 * done) / all.length)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${(100 * done) / all.length}%"></i></div>
      </div>
      ${due.length ? `<div class="card hb-due"><b>${due.length} chapter${due.length > 1 ? 's' : ''} due for review.</b> <span class="small">A few mixed questions now stop it fading.</span> <a class="btn" href="#/handbook/review">Review now</a></div>` : ''}
      <details class="card hb-how">
        <summary>How to use this handbook</summary>
        <ol>
          <li><b>Warm up.</b> Each chapter opens with quick questions from what it builds on.</li>
          <li><b>Read with a pen.</b> Try each worked example yourself, then reveal it one step at a time. Struggling first is what makes it stick.</li>
          <li><b>Predict, then test.</b> Commit to a guess before each simulation, and notice when you're surprised.</li>
          <li><b>Answer every check.</b> They're short on purpose. A wrong answer tells you what to reread.</li>
          <li><b>Explain it.</b> Write the idea in your own words. If you can't, you haven't got it yet.</li>
          <li><b>Do the homework on paper.</b> Core and Interview problems finish the chapter. Stretch problems and Labs are optional, but they're where the deepest understanding comes from.</li>
          <li><b>Come back.</b> Finished chapters return for review after 3, 7, 21 and 60 days.</li>
          <li><b>Sit the exam.</b> Each part ends with a mixed exam with no hints. ${Math.round(PASS * 100)}% is a pass.</li>
        </ol>
        <p class="small">The whole course is about ${Math.round(all.reduce((a, id) => a + chapter(id).minutes, 0) / 60)} hours of reading, plus homework. Short on time? Start from a route below. <a href="#/handbook/sheet">Every chapter's summary</a> is on one page.</p>
      </details>
      ${(HB().ROUTES || []).map((r) => `<details class="card hb-route"><summary>${esc(r.name)}</summary><p class="small">${esc(r.blurb)}</p><ol>${r.chapters.map((id) => `<li><a href="#/handbook/${id}">${esc(chapter(id).title)}</a>${progress(id).done ? ' ✓' : ''}</li>`).join('')}</ol></details>`).join('')}
      ${HB().PARTS.map((part) => `
        <h2>${esc(part.title)}</h2>
        <p class="small">${esc(part.blurb)}</p>
        <div class="hb-chapters">${part.chapters.map((id) => {
          const ch = chapter(id), p = progress(id), started = p.right || p.hwDone;
          return `<a class="card hb-chapter ${p.done ? 'done' : started ? 'started' : ''}" href="#/handbook/${id}"><div class="hb-num">${p.done ? '✓' : order().indexOf(id) + 1}</div><div><b>${esc(ch.title)}</b><p class="small">${ch.minutes} min · ${p.right} of ${p.n} checks · ${p.hwDone} of ${p.hw} homework${p.done ? ' · finished' : ''}</p></div></a>`;
        }).join('')}</div>
        <p class="hb-exam-link">${examRow(part.id, `Exam: ${part.short}`)}</p>`).join('')}
      <h2>Final exam</h2>
      <p class="small">Thirty questions drawn from the whole course, with no hints.</p>
      <p>${examRow('all', 'Final exam')}</p>`;
  }

  // ---------------------------------------------------------------- one chapter
  function view(el, id) {
    const ch = chapter(id);
    if (!ch) return index(el);
    const ids = order(), at = ids.indexOf(id), prev = ids[at - 1], next = ids[at + 1];
    const part = HB().PARTS.find((p) => p.chapters.includes(id));
    const r = rec(id), keys = new Map(HB().checksOf(ch).map(({ c, key }) => [c, key]));
    const warm = (ch.prereq || []).filter((x) => chapter(x));
    const hw = HB().homeworkOf(ch), levels = Object.keys(LEVELS).filter((l) => hw.some((h) => h.c.lvl === l));
    el.innerHTML = `
      <a class="back" href="#/handbook">← Handbook</a>
      <div class="eyebrow">${esc(part.title)} · chapter ${at + 1} of ${ids.length} · ${ch.minutes} min</div>
      <h1>${esc(ch.title)}</h1>
      ${ch.why ? `<p class="lede">${ch.why}</p>` : ''}
      <div class="card hb-goals"><b>By the end you'll be able to</b><ul>${ch.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
        ${warm.length ? `<p class="small">Builds on: ${warm.map((x) => `<a href="#/handbook/${x}">${esc(chapter(x).title)}</a>`).join(' · ')}</p>` : ''}
        <p class="small" id="hb-progress"></p></div>
      ${warm.length ? `<details class="card hb-warm" id="hb-warm"><summary>Warm up: three questions from earlier chapters</summary><div class="hb-warm-body"></div></details>` : ''}
      ${ch.sections.map((s, i) => `
        <section class="hb-section" id="s${i}">
          <h2>${esc(s.h)}</h2>
          ${s.blocks.map((b) => block(b, keys, r, id)).join('')}
        </section>`).join('')}
      <h2>Summary</h2>
      <ul class="hb-takeaways">${ch.takeaways.map((t) => `<li>${t}</li>`).join('')}</ul>
      ${ch.explain ? `<section class="card hb-explain"><div class="eyebrow">Explain it in your own words</div>
        <p class="question">${ch.explain.q}</p>
        <textarea rows="4" aria-label="Your explanation" maxlength="2000" placeholder="Write it as if to a friend who hasn't read this. Saved on this device.">${esc(r.note || '')}</textarea>
        <details class="hb-why"><summary>Compare with a model answer</summary><div>${ch.explain.a}</div></details></section>` : ''}
      <h2 id="homework">Homework</h2>
      <p class="small">Do these on paper, away from the app if you can. ${hw.some(required) ? 'Core and Interview problems finish the chapter.' : ''} Numeric answers are marked here; for written ones, compare with the model answer and mark yourself honestly.</p>
      ${levels.map((l) => hw.filter((h) => h.c.lvl === l).map((h, i) => homeworkCard(h, l, i, r)).join('')).join('')}
      <h2>Keep practising</h2>
      <p class="hb-practice">${ch.practice.map(([l, h]) => `<a class="btn ghost" href="${h}">${esc(l)}</a>`).join(' ')}</p>
      <div class="row hb-nav">${prev ? `<a class="btn ghost" href="#/handbook/${prev}">← ${esc(chapter(prev).title)}</a>` : ''}${next ? `<a class="btn" href="#/handbook/${next}">${esc(chapter(next).title)} →</a>` : `<a class="btn" href="#/handbook">Back to the handbook</a>`}</div>`;
    const drawProgress = () => {
      const p = progress(id), box = el.querySelector('#hb-progress');
      if (!box) return;
      box.innerHTML = p.done ? '✓ Finished: every check is right and the homework is done. It will come back for review.'
        : `Checks right: <b>${p.right} of ${p.n}</b> · homework done: <b>${p.hwDone} of ${p.hw}</b>.`;
    };
    drawProgress();
    el.querySelectorAll('.hb-check').forEach((box) => wireCheck(box, id, ch, drawProgress));
    el.querySelectorAll('.hb-mcq').forEach((box) => wireMcq(box, id, ch, drawProgress));
    el.querySelectorAll('.hb-hw').forEach((box) => wireHomework(box, id, ch, drawProgress));
    el.querySelectorAll('.hb-worked').forEach(wireWorked);
    el.querySelectorAll('.hb-predict').forEach(wirePredict);
    el.querySelectorAll('[data-widget]:not([hidden])').forEach(startWidget);
    const area = el.querySelector('.hb-explain textarea');
    area?.addEventListener('change', () => { entry(id).note = area.value.slice(0, 2000); store.save(); });
    const warmBox = el.querySelector('#hb-warm');
    warmBox?.addEventListener('toggle', () => {
      const body = warmBox.querySelector('.hb-warm-body');
      if (!warmBox.open || body.childElementCount) return;
      const items = R.shuffle(pool(warm)).slice(0, 3);
      runQuiz(body, items, { title: 'Warm up', finishText: 'Done', done: () => { body.innerHTML = '<p class="small">Warmed up. If any of those felt shaky, reread that chapter\'s summary first.</p>'; } });
    });
  }

  function block(b, keys, r, id) {
    if (typeof b === 'string') return `<div class="hb-text">${b}</div>`;
    if (b.fig) return QT.hbFig(b);
    if (b.widget) return widgetBlock(b);
    if (b.worked) return workedCard(b);
    if (b.idea) return `<aside class="hb-note idea"><b>Key idea</b> ${b.idea}</aside>`;
    if (b.trap) return `<aside class="hb-note trap"><b>Common mistake</b> ${b.trap}</aside>`;
    if (b.market) return `<aside class="hb-note market"><b>On the desk</b> ${b.market}</aside>`;
    if (b.proof) return `<details class="hb-why"><summary>${esc(b.title || "Why it's true")}</summary><div>${b.proof}</div></details>`;
    if (b.think) return `<details class="hb-think"><summary>${b.think}</summary><div>${b.back}</div></details>`;
    const key = keys.get(b);
    return b.opts ? mcqCard(b, key, id, r.c?.[key] === 1) : checkCard(b, key, r.c?.[key] === 1);
  }

  function workedCard(b) {
    let n = 0;
    const steps = b.steps.map((s) => {
      const [ask, body] = Array.isArray(s) ? s : [null, s];
      return `<li hidden data-step="${n++}">${ask ? `<p class="hb-ask">${ask}</p><div hidden data-body>${body}</div>` : `<div data-body>${body}</div>`}</li>`;
    }).join('');
    return `<div class="card hb-worked"><div class="eyebrow">Worked example${b.worked === true ? '' : ` · ${esc(b.worked)}`}</div>
      <p class="question">${b.q}</p>
      <p class="small">Try it on paper first, then work through it.</p>
      <ol class="hb-steps">${steps}</ol>
      <button type="button" class="ghost" data-next>Show the first step</button></div>`;
  }
  function wireWorked(box) {
    const items = [...box.querySelectorAll('[data-step]')], btn = box.querySelector('[data-next]');
    let i = -1, waiting = null;
    btn.addEventListener('click', () => {
      if (waiting) {
        waiting.hidden = false;
        waiting = null;
      } else {
        i++;
        items[i].hidden = false;
        const body = items[i].querySelector('[data-body]');
        if (body.hidden) waiting = body;
      }
      if (i >= items.length - 1 && !waiting) btn.remove();
      else btn.textContent = waiting ? 'Reveal' : `Next step (${i + 2} of ${items.length})`;
    });
  }

  function widgetBlock(b) {
    const w = `<div class="card hb-widget" data-widget="${b.widget}"${b.predict ? ' hidden' : ''}></div>`;
    if (!b.predict) return w;
    return `<div class="card hb-predict"><div class="eyebrow">Predict first</div><p class="question">${b.predict.q}</p>
      <div class="hb-opts">${b.predict.opts.map((o) => `<button type="button" class="hb-opt">${o}</button>`).join('')}</div>
      <p class="small hb-then" hidden>${b.predict.then || 'Now test your guess.'}</p></div>${w}`;
  }
  function wirePredict(box) {
    const w = box.nextElementSibling;
    box.querySelectorAll('.hb-opt').forEach((b) => b.addEventListener('click', () => {
      box.querySelectorAll('.hb-opt').forEach((x) => { x.disabled = true; x.classList.toggle('picked', x === b); });
      box.querySelector('.hb-then').hidden = false;
      if (w.hidden) { w.hidden = false; startWidget(w); }
    }));
  }
  const startWidget = (w) => ({ ...WIDGETS, ...QT.hbWidgets }[w.dataset.widget] || (() => {}))(w);

  function checkCard(c, key, solved) {
    return `
      <form class="card hb-check${solved ? ' solved' : ''}" data-key="${key}" autocomplete="off">
        <div class="eyebrow">Check yourself</div>
        <p class="question">${c.q}</p>
        <div class="answer-row">
          <input type="text" autocapitalize="off" aria-label="Your answer" placeholder="${solved ? 'Solved. Try it again?' : 'Your answer'}">
          <button>Check</button>
        </div>
        <div class="row hb-check-actions">${c.hint ? '<button type="button" class="link" data-act="hint">Hint</button>' : ''}<button type="button" class="link" data-act="show">Show solution</button></div>
        <p class="small hb-hint" hidden>${c.hint || ''}</p>
        <div class="hb-fb" aria-live="polite"></div>
        <div class="solution" hidden>${c.sol}</div>
      </form>`;
  }
  const checkOf = (ch, key) => HB().checksOf(ch).find((x) => x.key === key).c;

  function wireCheck(box, id, ch, onChange) {
    const key = box.dataset.key, c = checkOf(ch, key), input = box.querySelector('input'), fb = box.querySelector('.hb-fb');
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = readAnswer(input.value);
      if (!input.value.trim()) return (fb.textContent = 'Type an answer first.');
      if (Number.isNaN(v)) return (fb.textContent = "Couldn't read that. Try 0.25, 1/4, 25% or sqrt(2)/2.");
      const ok = QT.isCorrect(v, c.a, c.tol || {});
      const finished = markCheck(id, key, ok);
      fb.innerHTML = ok ? `<span class="fb-inline ok">✓ Correct${finished ? ' · chapter finished!' : ''}</span>` : `<span class="fb-inline bad">Not quite. Try again, or use the hint.</span>`;
      if (ok) {
        box.classList.add('solved');
        box.querySelector('.solution').hidden = false;
      }
      onChange();
    });
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'hint') box.querySelector('.hb-hint').hidden = false;
      if (act === 'show') {
        box.querySelector('.solution').hidden = false;
        fb.innerHTML = `<span class="small">Read it, then cover it and answer in your own working. This check stays open.</span>`;
      }
    });
  }

  function mcqCard(c, key, id, solved) {
    return `<div class="card hb-mcq${solved ? ' solved' : ''}" data-key="${key}" role="group" aria-label="Concept check">
      <div class="eyebrow">Concept check</div>
      <p class="question">${c.q}</p>
      <div class="hb-opts">${shuffled(c, `${id}${key}`).map((o, i) => `<button type="button" class="hb-opt" data-o="${i}">${o.text}</button>`).join('')}</div>
      <div class="hb-fb" aria-live="polite"></div>
      <div class="solution" hidden>${c.sol}</div></div>`;
  }
  function wireMcq(box, id, ch, onChange) {
    const key = box.dataset.key, c = checkOf(ch, key), options = shuffled(c, `${id}${key}`), fb = box.querySelector('.hb-fb');
    box.querySelectorAll('.hb-opt').forEach((b) => b.addEventListener('click', () => {
      const o = options[+b.dataset.o], finished = markCheck(id, key, o.right);
      b.classList.add(o.right ? 'right' : 'wrong');
      fb.innerHTML = o.right ? `<span class="fb-inline ok">✓ Correct${finished ? ' · chapter finished!' : ''}</span>` : `<span class="fb-inline bad">Not that one.</span> ${o.why || 'Think again.'}`;
      if (o.right) {
        box.classList.add('solved');
        box.querySelector('.solution').hidden = false;
        box.querySelectorAll('.hb-opt').forEach((x) => { x.disabled = true; });
      }
      onChange();
    }));
  }

  function homeworkCard({ c, key }, lvl, i, r) {
    const auto = Number.isFinite(c.a), score = r.h?.[key];
    return `<form class="card hb-hw lvl-${lvl}${score >= 1 ? ' solved' : ''}" data-key="${key}" autocomplete="off">
      <div class="eyebrow">${LEVELS[lvl]} ${i + 1}${required({ c }) ? '' : ' · optional'}</div>
      <p class="question">${c.q}</p>
      ${auto ? `<div class="answer-row"><input type="text" autocapitalize="off" aria-label="Your answer" placeholder="${score >= 1 ? 'Done. Try it again?' : 'Your answer'}"><button>Check</button></div>` : ''}
      <div class="row hb-check-actions">${c.hint ? '<button type="button" class="link" data-act="hint">Hint</button>' : ''}<button type="button" class="link" data-act="show">${auto ? 'Show solution' : 'Show the model answer'}</button></div>
      <p class="small hb-hint" hidden>${c.hint || ''}</p>
      <div class="hb-fb" aria-live="polite"></div>
      <div class="solution" hidden>${c.sol}</div>
      ${auto ? '' : `<div class="hb-self" hidden><span class="small">How did you do?</span> <button type="button" class="ghost" data-score="2">Got it</button> <button type="button" class="ghost" data-score="1">Partly</button> <button type="button" class="ghost" data-score="0">Missed it</button></div>`}
    </form>`;
  }
  function wireHomework(box, id, ch, onChange) {
    const key = box.dataset.key, c = HB().homeworkOf(ch).find((x) => x.key === key).c, input = box.querySelector('input'), fb = box.querySelector('.hb-fb');
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input) return;
      const v = readAnswer(input.value);
      if (!input.value.trim()) return (fb.textContent = 'Type an answer first.');
      if (Number.isNaN(v)) return (fb.textContent = "Couldn't read that. Try 0.25, 1/4, 25% or sqrt(2)/2.");
      const ok = QT.isCorrect(v, c.a, c.tol || {});
      fb.innerHTML = ok ? '<span class="fb-inline ok">✓ Correct</span>' : '<span class="fb-inline bad">Not quite. Check your working, or use the hint.</span>';
      if (ok) {
        markHomework(id, key, 2);
        box.classList.add('solved');
        box.querySelector('.solution').hidden = false;
      }
      onChange();
    });
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act, score = e.target.closest('[data-score]')?.dataset.score;
      if (act === 'hint') box.querySelector('.hb-hint').hidden = false;
      if (act === 'show') {
        box.querySelector('.solution').hidden = false;
        const self = box.querySelector('.hb-self');
        if (self) self.hidden = false;
      }
      if (score !== undefined) {
        const finished = markHomework(id, key, +score);
        box.classList.toggle('solved', +score >= 1);
        fb.innerHTML = `<span class="small">${+score === 2 ? 'Good.' : +score === 1 ? 'Counted. Redo the part you missed tomorrow.' : 'Noted. Reread the section and try it again later.'}${finished ? ' Chapter finished!' : ''}</span>`;
        onChange();
      }
    });
  }

  // ---------------------------------------------------------------- spaced review
  function review(el) {
    const due = dueReviews();
    el.innerHTML = `<a class="back" href="#/handbook">← Handbook</a><h1>Review</h1>`;
    if (!due.length) {
      const soon = order().map((id) => ({ id, v: rec(id).rv })).filter((x) => x.v).sort((a, b) => a.v.due - b.v.due)[0];
      el.insertAdjacentHTML('beforeend', `<div class="card"><p style="margin-top:0">Nothing is due.${soon ? ` Next up: <b>${esc(chapter(soon.id).title)}</b>, in ${Math.max(1, Math.ceil((soon.v.due - Date.now()) / DAY))} days.` : ' Chapters join the schedule when you finish them.'}</p><a class="btn" href="#/handbook">Back to the handbook</a></div>`);
      return;
    }
    // Three questions per due chapter, mixed together: switching between topics is the point.
    const items = R.shuffle(due.flatMap((id) => R.shuffle(pool([id])).slice(0, 3)));
    el.insertAdjacentHTML('beforeend', `<p class="lede">${items.length} mixed questions from ${due.length} chapter${due.length > 1 ? 's' : ''}. Answer from memory before anything else.</p><div class="card" id="hb-run"></div>`);
    const box = el.querySelector('#hb-run');
    runQuiz(box, items, {
      title: 'Review',
      done(results) {
        const rows = due.map((id) => {
          const mine = results.filter((x) => x.id === id), right = mine.filter((x) => x.ok).length, kept = right >= Math.ceil(mine.length * (2 / 3));
          const r = entry(id), st = kept ? Math.min(REVIEW_GAPS.length - 1, r.rv.st + 1) : 0;
          r.rv = { due: Date.now() + REVIEW_GAPS[st] * DAY, st };
          return `<tr><td><a href="#/handbook/${id}">${esc(chapter(id).title)}</a></td><td class="mono">${right} of ${mine.length}</td><td>${kept ? `Back in ${REVIEW_GAPS[st]} days` : `Reread the summary. Back in ${REVIEW_GAPS[st]} days`}</td></tr>`;
        }).join('');
        store.touchDay();
        store.save();
        box.innerHTML = `<div class="eyebrow">Review done</div><table class="hb-table">${rows}</table><a class="btn" href="#/handbook">Back to the handbook</a>`;
      },
    });
  }

  // ---------------------------------------------------------------- exams
  function exam(el, which) {
    const part = HB().PARTS.find((p) => p.id === which), final = which === 'all';
    if (!part && !final) return index(el);
    const ids = final ? order() : part.chapters, size = final ? 30 : Math.min(15, Math.max(10, ids.length * 3));
    const name = final ? 'Final exam' : `Exam: ${part.short}`, best = store.get().hbExams?.[which];
    el.innerHTML = `<a class="back" href="#/handbook">← Handbook</a><h1>${esc(name)}</h1>
      <div class="card" id="hb-run"><p style="margin-top:0">${size} questions, mixed across ${ids.length} chapter${ids.length > 1 ? 's' : ''}. No hints and no feedback until the end, as in an interview. Paper and a pen are fine; a calculator isn't. ${Math.round(PASS * 100)}% is a pass.</p>
      ${best ? `<p class="small">Your best so far: ${Math.round(best.best * 100)}%, ${best.n} attempt${best.n > 1 ? 's' : ''}.</p>` : ''}
      <button type="button" id="hb-begin">Begin</button></div>`;
    el.querySelector('#hb-begin').addEventListener('click', () => {
      // Spread the questions evenly over the chapters before shuffling them together.
      const byCh = ids.map((id) => R.shuffle(pool([id]))), items = [];
      for (let i = 0; items.length < size && byCh.some((q) => q.length); i = (i + 1) % byCh.length) if (byCh[i].length) items.push(byCh[i].pop());
      const box = el.querySelector('#hb-run');
      runQuiz(box, R.shuffle(items), { exam: true, title: name, done: (res) => report(box, res, which, name) });
    });
  }
  function report(box, res, which, name) {
    const score = res.filter((x) => x.ok).length / res.length, s = store.get(), old = s.hbExams[which];
    s.hbExams[which] = { best: Math.max(score, old?.best || 0), last: score, n: (old?.n || 0) + 1, at: Date.now() };
    store.touchDay();
    store.save();
    const ids = [...new Set(res.map((x) => x.id))];
    const rows = ids.map((id) => ({ id, mine: res.filter((x) => x.id === id) })).map((x) => ({ ...x, right: x.mine.filter((y) => y.ok).length })).sort((a, b) => a.right / a.mine.length - b.right / b.mine.length);
    const missed = res.filter((x) => !x.ok);
    box.innerHTML = `<div class="eyebrow">${esc(name)}</div>
      <p class="hb-score"><b>${res.filter((x) => x.ok).length} of ${res.length}</b> · ${Math.round(score * 100)}% · ${score >= PASS ? 'pass' : `a pass is ${Math.round(PASS * 100)}%`}</p>
      <table class="hb-table"><tr><th>Chapter</th><th>Score</th></tr>${rows.map((x) => `<tr><td><a href="#/handbook/${x.id}">${esc(chapter(x.id).title)}</a></td><td class="mono">${x.right} of ${x.mine.length}</td></tr>`).join('')}</table>
      ${missed.length ? `<h2>What you missed</h2>${missed.map((x) => `<div class="hb-missed"><p>${x.c.q}</p><p class="small">You said: ${esc(x.typed)}</p><div class="solution">${x.c.sol}</div></div>`).join('')}` : '<p>Nothing missed.</p>'}
      <div class="row"><a class="btn ghost" href="#/handbook/exam/${which}">Sit it again</a> <a class="btn" href="#/handbook">Back to the handbook</a></div>`;
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- summaries on one page
  function sheet(el) {
    el.innerHTML = `<a class="back" href="#/handbook">← Handbook</a><h1>Every chapter's summary</h1>
      <p class="lede">The course on one page: read it the night before. It's a reminder of what you've learned, not a way to learn it.</p>
      ${HB().PARTS.map((part) => `<h2>${esc(part.title)}</h2>${part.chapters.map((id) => `<details class="card hb-sheet" open><summary><a href="#/handbook/${id}">${esc(chapter(id).title)}</a></summary><ul>${chapter(id).takeaways.map((t) => `<li>${t}</li>`).join('')}</ul></details>`).join('')}`).join('')}`;
  }

  // ---------------------------------------------------------------- interactive tools
  // Bars as an inline SVG: values in [0, max]; optional exact markers drawn as ticks.
  function bars(values, labels, opts = {}) {
    const max = opts.max || Math.max(...values, ...(opts.exact || [0])) || 1, n = values.length, W = 100, H = 40, bw = W / n;
    const rects = values.map((v, i) => `<rect class="hb-bar" x="${i * bw + bw * 0.12}" y="${H - (v / max) * H}" width="${bw * 0.76}" height="${(v / max) * H}"></rect>`).join('');
    const ticks = (opts.exact || []).map((v, i) => `<line class="hb-exact" x1="${i * bw + bw * 0.05}" x2="${i * bw + bw * 0.95}" y1="${H - (v / max) * H}" y2="${H - (v / max) * H}" vector-effect="non-scaling-stroke"></line>`).join('');
    return `<svg class="hb-bars" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opts.label || 'Bar chart')}">${rects}${ticks}</svg>
      <div class="hb-bar-labels" style="grid-template-columns:repeat(${n},1fr)">${labels.map((l) => `<span>${l}</span>`).join('')}</div>`;
  }
  const choose = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

  const WIDGETS = {
    // Counting calculator: one n and k, four ways of counting.
    counting(box) {
      box.innerHTML = `<b>Try it: four ways to count</b>
        <div class="row hb-controls"><label>n <input type="number" min="1" max="20" value="5" data-n></label><label>k <input type="number" min="0" max="20" value="3" data-k></label></div>
        <div class="hb-out"></div>`;
      const draw = () => {
        const n = Math.max(1, Math.min(20, Math.floor(+box.querySelector('[data-n]').value || 1))), k = Math.max(0, Math.min(20, Math.floor(+box.querySelector('[data-k]').value || 0)));
        const perm = k <= n ? choose(n, k) * [...Array(k)].reduce((a, _, i) => a * (i + 1), 1) : 0;
        box.querySelector('.hb-out').innerHTML = `<table class="hb-table">
          <tr><td>Ordered, with repeats (codes)</td><td>n<sup>k</sup></td><td class="mono">${f(n ** k)}</td></tr>
          <tr><td>Ordered, no repeats (podium)</td><td>n!/(n − k)!</td><td class="mono">${f(perm)}</td></tr>
          <tr><td>Unordered, no repeats (a hand)</td><td>C(n, k)</td><td class="mono">${f(choose(n, k))}</td></tr>
          <tr><td>k identical items into n boxes</td><td>C(k + n − 1, n − 1)</td><td class="mono">${f(choose(k + n - 1, n - 1))}</td></tr></table>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Dice simulator: simulated distribution of the total against the exact one.
    dice(box) {
      box.innerHTML = `<b>Try it: roll dice many times</b>
        <div class="row hb-controls"><label>Dice <select data-d><option>1</option><option selected>2</option><option>3</option></select></label><button type="button" data-r="100">Roll 100</button><button type="button" class="ghost" data-r="10000">Roll 10,000</button></div>
        <div class="hb-out"><p class="small">Roll to see how often each total comes up. The lines mark the exact probabilities.</p></div>`;
      const exact = (d) => { let dist = [1]; for (let i = 0; i < d; i++) { const nd = Array(dist.length + 6).fill(0); dist.forEach((p, s) => { for (let k = 1; k <= 6; k++) nd[s + k] += p / 6; }); dist = nd; } return dist.slice(d); };
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-r]');
        if (!b) return;
        const d = +box.querySelector('[data-d]').value, n = +b.dataset.r, counts = Array(5 * d + 1).fill(0);
        for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < d; j++) s += R.die(); counts[s - d]++; }
        const freq = counts.map((c) => c / n), ex = exact(d);
        box.querySelector('.hb-out').innerHTML = bars(freq, freq.map((_, i) => i + d), { exact: ex, label: `Frequencies of the total of ${d} dice over ${n} rolls` })
          + `<p class="small">${f(n)} rolls. Most common total: ${freq.indexOf(Math.max(...freq)) + d}. With more rolls the bars hug the exact lines.</p>`;
      });
    },
    // Bayes with natural frequencies, out of 1,000 people.
    bayes(box) {
      box.innerHTML = `<b>Try it: a test for a rare condition, out of 1,000 people</b>
        <div class="hb-sliders">
          <label>Has the condition <input type="range" min="0.5" max="50" step="0.5" value="1" data-p> <span class="mono" data-pv></span></label>
          <label>Test catches <input type="range" min="50" max="100" step="1" value="99" data-s> <span class="mono" data-sv></span></label>
          <label>False alarms <input type="range" min="0" max="30" step="0.5" value="5" data-f> <span class="mono" data-fv></span></label>
        </div><div class="hb-out"></div>`;
      const draw = () => {
        const p = +box.querySelector('[data-p]').value / 100, s = +box.querySelector('[data-s]').value / 100, fa = +box.querySelector('[data-f]').value / 100;
        box.querySelector('[data-pv]').textContent = `${f(p * 100)}%`; box.querySelector('[data-sv]').textContent = `${f(s * 100)}%`; box.querySelector('[data-fv]').textContent = `${f(fa * 100)}%`;
        const sick = 1000 * p, tp = sick * s, fp = (1000 - sick) * fa, post = tp + fp ? tp / (tp + fp) : 0;
        box.querySelector('.hb-out').innerHTML = `<p>Of 1,000 people, <b>${f(+sick.toFixed(1))}</b> have it and <b>${f(+tp.toFixed(1))}</b> of them test positive. Of the ${f(+(1000 - sick).toFixed(1))} who don't, <b>${f(+fp.toFixed(1))}</b> test positive anyway.</p>
          <div class="hb-split" aria-hidden="true"><i class="tp" style="flex:${tp}"></i><i class="fp" style="flex:${fp}"></i></div>
          <p>A positive result means the condition with probability <b>${f(+(post * 100).toFixed(1))}%</b>: true positives ÷ all positives.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Law of large numbers: the running average of die rolls.
    lln(box) {
      box.innerHTML = `<b>Try it: the running average of die rolls</b>
        <div class="row hb-controls"><button type="button" data-n="50">50 rolls</button><button type="button" class="ghost" data-n="1000">1,000 rolls</button></div>
        <div class="hb-out"><p class="small">Roll to watch the average settle towards 3.5.</p></div>`;
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-n]');
        if (!b) return;
        const n = +b.dataset.n, avg = [];
        let s = 0;
        for (let i = 1; i <= n; i++) { s += R.die(); avg.push(s / i); }
        box.querySelector('.hb-out').innerHTML = QT.chart.line([{ name: 'Running average', values: avg }], { label: `Running average of ${n} die rolls`, target: { y: 3.5, name: 'Expected value 3.5' }, xFirst: '1', xLast: f(n), min: 1, max: 6 })
          + `<p class="small">After ${f(n)} rolls the average is ${f(+avg[n - 1].toFixed(3))}. Early on it swings a lot; later each roll barely moves it.</p>`;
      });
    },
    // √n rule: the spread of the average of n dice.
    sqrtn(box) {
      box.innerHTML = `<b>Try it: average n dice, many times</b>
        <label class="hb-sliders">Dice in each average: <input type="range" min="1" max="100" value="4" data-n> <span class="mono" data-nv></span></label>
        <div class="hb-out"></div>`;
      const draw = () => {
        const n = +box.querySelector('[data-n]').value, T = 3000, bins = Array(26).fill(0);
        box.querySelector('[data-nv]').textContent = n;
        for (let t = 0; t < T; t++) { let s = 0; for (let i = 0; i < n; i++) s += R.die(); const a = s / n; bins[Math.min(25, Math.floor((a - 1) * 5))]++; }
        const sd = Math.sqrt(35 / 12 / n);
        box.querySelector('.hb-out').innerHTML = bars(bins.map((c) => c / T), bins.map((_, i) => (i % 5 === 0 ? 1 + i / 5 : '')), { label: `Distribution of the average of ${n} dice` })
          + `<p class="small">Standard deviation of the average: σ/√n = 1.71/√${n} ≈ <b>${f(+sd.toFixed(3))}</b>. Four times as many dice halves it.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Distribution explorer: binomial, geometric or Poisson, with mean and standard deviation.
    dist(box) {
      box.innerHTML = `<b>Try it: explore a distribution</b>
        <div class="row hb-controls"><label>Distribution <select data-k><option value="binom">Binomial (n = 20)</option><option value="geom">Geometric</option><option value="pois">Poisson</option></select></label>
          <label><span data-pl>p</span> <input type="range" min="0.05" max="0.95" step="0.05" value="0.3" data-p> <span class="mono" data-pv></span></label></div>
        <div class="hb-out"></div>`;
      const fact = (n) => (n < 2 ? 1 : n * fact(n - 1));
      const draw = () => {
        const kind = box.querySelector('[data-k]').value, slider = box.querySelector('[data-p]');
        if (kind === 'pois') { slider.min = 0.5; slider.max = 10; slider.step = 0.5; } else { slider.min = 0.05; slider.max = 0.95; slider.step = 0.05; }
        if (+slider.value > +slider.max) slider.value = slider.max;
        const p = +slider.value;
        box.querySelector('[data-pl]').textContent = kind === 'pois' ? 'λ' : 'p';
        box.querySelector('[data-pv]').textContent = f(p);
        let ks, probs, mean, sd;
        if (kind === 'binom') { ks = [...Array(21).keys()]; probs = ks.map((k) => choose(20, k) * p ** k * (1 - p) ** (20 - k)); mean = 20 * p; sd = Math.sqrt(20 * p * (1 - p)); }
        else if (kind === 'geom') { ks = [...Array(20).keys()].map((k) => k + 1); probs = ks.map((k) => (1 - p) ** (k - 1) * p); mean = 1 / p; sd = Math.sqrt(1 - p) / p; }
        else { ks = [...Array(21).keys()]; probs = ks.map((k) => Math.exp(-p) * p ** k / fact(k)); mean = p; sd = Math.sqrt(p); }
        box.querySelector('.hb-out').innerHTML = bars(probs, ks.map((k) => (k % (ks.length > 12 ? 2 : 1) === 0 ? k : '')), { label: `${kind} distribution` })
          + `<p class="small">Mean <b>${f(+mean.toFixed(3))}</b> · standard deviation <b>${f(+sd.toFixed(3))}</b>${kind === 'geom' ? ' (shown up to 20 tries)' : ''}.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Pattern race: average flips until a pattern first appears, by simulation and exactly.
    pattern(box) {
      const EXACT = { HH: 6, HT: 4, HTH: 10, HHT: 8, HHH: 14, HTT: 8 };
      box.innerHTML = `<b>Try it: how long until a pattern appears?</b>
        <div class="row hb-controls"><label>Pattern <select data-pat>${Object.keys(EXACT).map((k) => `<option>${k}</option>`).join('')}</select></label><button type="button" data-go>Flip 2,000 times over</button></div>
        <div class="hb-out"><p class="small">Pick a pattern and simulate. Notice that patterns that overlap with themselves take longer.</p></div>`;
      box.querySelector('[data-go]').addEventListener('click', () => {
        const pat = box.querySelector('[data-pat]').value, T = 2000;
        let tot = 0;
        for (let t = 0; t < T; t++) { let s = '', n = 0; while (!s.endsWith(pat)) { s = (s + (Math.random() < 0.5 ? 'H' : 'T')).slice(-3); n++; } tot += n; }
        box.querySelector('.hb-out').innerHTML = `<p>Average over ${f(T)} games: <b>${f(+(tot / T).toFixed(2))}</b> flips (exactly ${EXACT[pat]}).</p>`;
      });
    },
    // Two-state chain: the long-run share of time in each state, exact and simulated.
    markov(box) {
      box.innerHTML = `<b>Try it: a two-state chain</b>
        <div class="hb-sliders">
          <label>P(sunny → rainy) <input type="range" min="0.05" max="0.95" step="0.05" value="0.3" data-a> <span class="mono" data-av></span></label>
          <label>P(rainy → sunny) <input type="range" min="0.05" max="0.95" step="0.05" value="0.5" data-b> <span class="mono" data-bv></span></label>
        </div><div class="hb-out"></div>`;
      const draw = () => {
        const a = +box.querySelector('[data-a]').value, b = +box.querySelector('[data-b]').value;
        box.querySelector('[data-av]').textContent = f(a); box.querySelector('[data-bv]').textContent = f(b);
        let s = 0, rainy = 0;
        for (let t = 0; t < 5000; t++) { s = s === 0 ? (Math.random() < a ? 1 : 0) : (Math.random() < b ? 0 : 1); rainy += s; }
        box.querySelector('.hb-out').innerHTML = `<p>Long-run share of rainy days: exactly a/(a + b) = <b>${f(+(a / (a + b)).toFixed(3))}</b>; in a 5,000-day simulation, ${f(+(rainy / 5000).toFixed(3))}.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Gambler's ruin: simulated paths and the share that reach the top.
    walk(box) {
      box.innerHTML = `<b>Try it: walk from i until 0 or N</b>
        <div class="row hb-controls"><label>Start <input type="number" min="1" max="19" value="4" data-i></label><label>Top <input type="number" min="2" max="20" value="10" data-n></label><label>P(step up) <input type="number" min="0.1" max="0.9" step="0.05" value="0.5" data-p></label><button type="button" data-go>Run 2,000 walks</button></div>
        <div class="hb-out"></div>`;
      box.querySelector('[data-go]').addEventListener('click', () => {
        const N = Math.max(2, Math.min(20, Math.floor(+box.querySelector('[data-n]').value))), i = Math.max(1, Math.min(N - 1, Math.floor(+box.querySelector('[data-i]').value))), p = Math.max(0.1, Math.min(0.9, +box.querySelector('[data-p]').value));
        let up = 0, steps = 0;
        const paths = [];
        for (let t = 0; t < 2000; t++) { let x = i; const path = [x]; while (x > 0 && x < N) { x += Math.random() < p ? 1 : -1; steps++; if (t < 3 && path.length < 400) path.push(x); } if (x === N) up++; if (t < 3) paths.push({ name: `Walk ${t + 1}`, values: path }); }
        const r = (1 - p) / p, exact = Math.abs(p - 0.5) < 1e-9 ? i / N : (1 - r ** i) / (1 - r ** N);
        box.querySelector('.hb-out').innerHTML = QT.chart.line(paths, { label: 'Three sample walks', min: 0, max: N, xFirst: '0', xLast: 'steps' })
          + `<p class="small">Reached ${N} in <b>${f(+(up / 20).toFixed(1))}%</b> of 2,000 walks (exactly ${f(+(exact * 100).toFixed(1))}%). Average length ${f(+(steps / 2000).toFixed(1))} steps${Math.abs(p - 0.5) < 1e-9 ? ` (exactly i(N − i) = ${i * (N - i)})` : ''}.</p>`;
      });
    },
    // Reroll game: threshold and value by backward induction, for 3 to 10 rerolls (the checks cover 1 and 2).
    reroll(box) {
      box.innerHTML = `<b>Try it: a die you may reroll</b>
        <label class="hb-sliders">Rerolls allowed: <input type="range" min="3" max="10" value="3" data-r> <span class="mono" data-rv></span></label>
        <div class="hb-out"></div>`;
      const draw = () => {
        const n = +box.querySelector('[data-r]').value;
        box.querySelector('[data-rv]').textContent = n;
        let v = 3.5, keep = [];
        for (let k = 1; k <= n; k++) { keep = [1, 2, 3, 4, 5, 6].filter((x) => x > v); v = (keep.reduce((a, b) => a + b, 0) + (6 - keep.length) * v) / 6; }
        box.querySelector('.hb-out').innerHTML = `<p>On the first roll, keep <b>${keep[0]} or more</b>. The game is worth <b>${f(+v.toFixed(3))}</b>.</p>
          <p class="small">Each extra reroll adds less value: it creeps towards 6.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
    // Probability as area: random points in the square, X + Y < t.
    area(box) {
      box.innerHTML = `<b>Try it: probability as area</b>
        <label class="hb-sliders">Region X + Y &lt; t, with t = <input type="range" min="0.1" max="1.9" step="0.1" value="1.2" data-t> <span class="mono" data-tv></span></label>
        <div class="hb-out"></div>`;
      const draw = () => {
        const t = +box.querySelector('[data-t]').value, pts = [];
        box.querySelector('[data-tv]').textContent = f(t);
        let hit = 0;
        for (let k = 0; k < 600; k++) { const x = Math.random(), y = Math.random(), inside = x + y < t; hit += inside; pts.push(`<circle cx="${x * 100}" cy="${100 - y * 100}" r="1.1" class="${inside ? 'hb-in' : 'hb-outpt'}"></circle>`); }
        const exact = t <= 1 ? t * t / 2 : 1 - (2 - t) ** 2 / 2;
        box.querySelector('.hb-out').innerHTML = `<svg class="hb-square" viewBox="0 0 100 100" role="img" aria-label="600 random points in the unit square">${pts.join('')}<line x1="${Math.max(0, t - 1) * 100}" y1="${100 - Math.min(1, t) * 100}" x2="${Math.min(1, t) * 100}" y2="${100 - Math.max(0, t - 1) * 100}" class="hb-exact" vector-effect="non-scaling-stroke"></line></svg>
          <p class="small">${hit} of 600 points fall in the region: ${f(+(hit / 600).toFixed(3))}. The exact area is <b>${f(+exact.toFixed(3))}</b>.</p>`;
      };
      box.addEventListener('input', draw);
      draw();
    },
  };

  function route(el, id, arg) {
    if (id === 'review') return review(el);
    if (id === 'exam') return exam(el, arg);
    if (id === 'sheet') return sheet(el);
    return id ? view(el, id) : index(el);
  }
  QT.views = Object.assign(QT.views || {}, { handbook: route });
  QT.handbookProgress = { progress, nextChapter, order, markCheck, markHomework, dueReviews, pool };
})();
