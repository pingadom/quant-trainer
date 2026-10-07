// Search across everything with words in it: interview questions, topics, speed tricks, case
// studies and formula cards. #/search/<query> is shareable; typing updates the address without
// re-rendering. Every word must match; matches in a title count more than matches in the text.
(function () {
  const plain = (html) => String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // Folds case, accents and the unicode minus so "−" finds "-" and "Poisson" finds "poisson".
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/−/g, '-');
  const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);

  // Screens, so "figgie" or "zetamac" takes you to the game itself. [href, title, description]
  const PAGES = [
    ['#/plan', 'Interview plan', 'daily checklist countdown to your interview date for one firm'],
    ['#/daily', 'Daily challenge', 'same 5 questions for everyone today shareable result streak'],
    ['#/coach', 'Coach', 'what to practise next skill map diagnostic weak spots'],
    ['#/progress', 'Progress', 'charts accuracy speed scores history'],
    ['#/review', 'Mixed practice', 'questions from every topic adaptive'],
    ['#/mistakes', 'Mistakes to review', 'wrong answers spaced repetition'],
    ['#/mental', 'Mental maths: Zetamac and 80 in 8', 'zetamac arithmetic speed 80 in 8 optiver numeric test timed challenge a friend'],
    ['#/oa', 'Online tests', 'number sequences digit span running totals online assessment'],
    ['#/bank', 'Interview questions', 'questions candidates report by firm'],
    ['#/mock', 'Mock interview', 'timed interview by firm'],
    ['#/talk', 'Think aloud', 'answer out loud against the clock speaking communication'],
    ['firms/', 'Firm guides', 'interview process and questions for each firm static pages'],
    ['#/figgie', 'Figgie', 'jane street card trading game bots'],
    ['#/quote', 'Make me a market', 'quote bid ask width interviewer trades against you'],
    ['#/market', 'Market making on dice', 'hidden dice quote spread inventory'],
    ['#/kelly', 'Bet sizing', 'kelly criterion betting game bankroll'],
    ['#/estimate', 'Estimation', 'fermi calibration confidence intervals'],
    ['#/lab', 'Stats lab', 'central limit theorem volatility drag simulation'],
    ['#/appearance', 'Appearance', 'theme dark mode night ticker sound motion settings'],
    ['#/more', 'Settings and data', 'export import backup reset keypad install'],
  ];

  const GROUPS = [
    ['page', 'Pages'],
    ['iq', 'Interview questions'],
    ['topic', 'Topics'],
    ['card', 'Formula cards'],
    ['trick', 'Speed tricks'],
    ['case', 'Case studies'],
  ];

  let cache = null;
  function index() {
    if (cache) return cache;
    const firmName = (id) => (QT.firms[id] ? QT.firms[id].name : id);
    const items = [
      ...PAGES.map(([href, title, text]) => ({ type: 'page', href, title, meta: '', text })),
      ...QT.bank.map((b) => ({
        type: 'iq', href: `#/iq/${b.id}`, title: clip(plain(b.q), 110), meta: `${firmName(b.firm)} · ${b.cat}`,
        text: [b.q, b.cat, firmName(b.firm), b.role, ...(b.parts || []).map((p) => p.q), ...(b.followups || [])].map(plain).join(' '),
      })),
      ...QT.topics.map((t) => ({ type: 'topic', href: `#/topic/${t.id}`, title: t.name, meta: plain(t.blurb), text: plain(`${t.blurb} ${t.notes || ''}`) })),
      ...QT.flashcards.CARDS.map(([, topic, front, back]) => ({ type: 'card', href: '#/flashcards', title: plain(front), meta: topic, back, text: plain(`${back} ${topic}`) })),
      ...QT.tricks.map((t) => ({ type: 'trick', href: `#/tricks/${t.id}`, title: t.title, meta: plain(t.tagline), text: plain(`${t.tagline} ${t.body} ${t.group || ''}`) })),
      ...QT.cases.map((c) => ({ type: 'case', href: `#/case/${c.id}`, title: c.title, meta: `${c.year} · ${plain(c.summary)}`, text: plain(`${c.summary} ${(c.tags || []).join(' ')} ${c.year} ${c.lesson || ''}`) })),
    ];
    for (const it of items) {
      it.fTitle = fold(it.title);
      it.fText = fold(`${it.meta} ${it.text}`);
    }
    return (cache = items);
  }

  function find(query) {
    const words = fold(query).split(/[^a-z0-9%.\-]+/).filter((w) => w.length > 1 || /\d/.test(w));
    if (!words.length) return [];
    const out = [];
    for (const it of index()) {
      let score = 0;
      for (const w of words) {
        const re = new RegExp(`(^|[^a-z0-9])${w.replace(/[.\-]/g, '\\$&')}`);
        if (re.test(it.fTitle)) score += 3;
        else if (re.test(it.fText)) score += 1;
        else {
          score = 0;
          break;
        }
      }
      if (score) out.push({ ...it, score });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  // Wraps whole-word-start matches in <mark>, on the escaped text.
  function mark(text, query) {
    const words = fold(query).split(/[^a-z0-9%.\-]+/).filter((w) => w.length > 1 || /\d/.test(w));
    let html = esc(text);
    if (!words.length) return html;
    const f = fold(text);
    if (f.length !== text.length) return html; // folding changed the length; skip highlighting
    const hits = [];
    for (const w of words) {
      const re = new RegExp(`(^|[^a-z0-9])(${w.replace(/[.\-]/g, '\\$&')})`, 'g');
      let m;
      while ((m = re.exec(f))) hits.push([m.index + m[1].length, m.index + m[1].length + w.length]);
    }
    if (!hits.length) return html;
    hits.sort((a, b) => a[0] - b[0]);
    let res = '', at = 0;
    for (const [s, e] of hits) {
      if (s < at) continue;
      res += esc(text.slice(at, s)) + `<mark>${esc(text.slice(s, e))}</mark>`;
      at = e;
    }
    return res + esc(text.slice(at));
  }

  const PER_GROUP = 6;
  function results(query, open) {
    if (!query.trim()) {
      return `<p class="small">Try <a href="#/search/kelly">kelly</a>, <a href="#/search/expected%20value">expected value</a>, <a href="#/search/wincent">wincent</a>, <a href="#/search/dice">dice</a> or <a href="#/search/options">options</a>.</p>`;
    }
    const hits = find(query);
    if (!hits.length) return `<p>Nothing matches “${esc(query)}”. Try fewer or shorter words.</p>`;
    return `<p class="small">${hits.length} result${hits.length === 1 ? '' : 's'}</p>` + GROUPS.map(([type, label]) => {
      const g = hits.filter((h) => h.type === type);
      if (!g.length) return '';
      const shown = open[type] ? g : g.slice(0, PER_GROUP);
      return `<h2>${label} <span class="small">(${g.length})</span></h2>
        <div class="search-list">${shown.map((h) => `
          <a class="card search-hit" href="${h.href}">
            <b>${mark(h.title, query)}</b>
            ${h.type === 'card' ? `<span class="search-back">${h.back}</span>` : ''}
            ${h.meta ? `<span class="small">${mark(clip(h.meta, 140), query)}</span>` : ''}
          </a>`).join('')}
        </div>
        ${g.length > shown.length ? `<button type="button" class="link" data-more="${type}">Show all ${g.length}</button>` : ''}`;
    }).join('');
  }

  function search(el, q = '') {
    el.innerHTML = `
      <h1>Search</h1>
      <form role="search" class="search-form" id="search-form">
        <input type="search" id="search-in" value="${esc(q)}" placeholder="Questions, topics, formulas…" aria-label="Search" autocomplete="off" spellcheck="false" enterkeyhint="search">
      </form>
      <div id="search-out" aria-live="polite"></div>`;
    el.querySelector('#search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      $in.blur(); // closes the phone keyboard so the results are visible
    });
    const $in = el.querySelector('#search-in'), $out = el.querySelector('#search-out'), open = {};
    const draw = () => {
      $out.innerHTML = results($in.value, open);
    };
    $in.addEventListener('input', () => {
      for (const k of Object.keys(open)) delete open[k];
      draw();
      const v = $in.value.trim();
      history.replaceState(null, '', v ? `#/search/${encodeURIComponent(v)}` : '#/search');
    });
    $out.addEventListener('click', (e) => {
      const b = e.target.closest('[data-more]');
      if (!b) return;
      open[b.dataset.more] = true;
      draw();
    });
    draw();
    $in.focus();
    if (q) $in.setSelectionRange(q.length, q.length);
  }

  // "/" opens search from anywhere on a keyboard, unless you're typing in a field.
  if (typeof document !== 'undefined') document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    if (location.hash.startsWith('#/search')) document.getElementById('search-in')?.focus();
    else location.hash = '#/search';
  });

  QT.views = Object.assign(QT.views || {}, { search });
  QT.search = { find, plain };
})();
