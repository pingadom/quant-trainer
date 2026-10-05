// A one-minute tour of the app for new users, one step per screen (#/tour/1 … #/tour/7), each
// with a "Try it" link. Offered on the welcome screen and from More.
(function () {
  const STEPS = [
    {
      title: 'Quant Trainer in a minute',
      body: 'Practice for quant trading interviews: probability and statistics, fast mental maths, trading games, and real questions candidates report from the firms.',
      points: ['Everything stays on this device; there is no account.', 'Each step below links to the place it describes.'],
    },
    {
      title: 'A coach that finds your weak spots',
      body: 'It tracks 79 skills, notices the kind of mistakes you make (a complement slip, percent vs decimal, a factor of two…) and ranks what to practise next.',
      points: ['Start with the 15-minute diagnostic for a first profile.', 'The home screen always shows the single best next step.'],
      href: '#/coach', cta: 'Open the coach',
    },
    {
      title: 'Practice that comes back to you',
      body: 'Fourteen topics with endless randomised questions and worked solutions you can check by simulation.',
      points: ['Wrong answers return after 1, 3, 7 and 21 days until you have them.', 'Mixed practice picks questions for you.'],
      href: '#/review', cta: 'Try mixed practice',
    },
    {
      title: 'Real interview questions',
      body: 'Questions candidates report from Jane Street, SIG, Optiver, IMC, Wincent and others, each with its source and the follow-ups interviewers push on.',
      points: ['Timed mock interviews by firm.', 'Think aloud: answer out loud against the clock, then score yourself.'],
      href: '#/bank', cta: 'Browse questions',
    },
    {
      title: 'Speed under pressure',
      body: 'The 80-in-8 mental maths test, a 2-minute sprint, and 20 guides to faster arithmetic.',
      points: ['After each run, slow questions come back with the fastest method for each one.', 'Slow question types return as short timed "speed reps".', 'Online tests: number sequences, digit span, running totals.'],
      href: '#/mental', cta: 'Mental maths',
    },
    {
      title: 'Trading games',
      body: 'Figgie against three bots, making a market while the interviewer trades against you, market making on hidden dice, bet sizing against Kelly, and calibrated estimation.',
      points: ['The coach watches how you play and tells you what to change.'],
      href: '#/figgie', cta: 'Play Figgie',
    },
    {
      title: 'Make it a habit',
      body: 'The daily challenge (the same 5 questions for everyone, with a shareable result), charts of your progress, and four themes.',
      points: ['Your numbers scroll across the top in a ticker tape.', 'Pick a theme under More → Appearance.'],
      href: '#/daily', cta: "Today's challenge",
    },
  ];

  function tour(el, stepArg) {
    const i = Math.min(STEPS.length, Math.max(1, parseInt(stepArg, 10) || 1)) - 1, s = STEPS[i], last = i === STEPS.length - 1;
    if (last) {
      try { localStorage.setItem('qt-tour', 'done'); } catch { /* storage blocked */ }
    }
    el.innerHTML = `
      <a class="back" href="#/">← Home</a>
      <div class="tour">
        <div class="eyebrow">Tour · ${i + 1} of ${STEPS.length}</div>
        <h1>${s.title}</h1>
        <p class="lede">${s.body}</p>
        <ul class="tour-points">${s.points.map((p) => `<li>${p}</li>`).join('')}</ul>
        ${s.href ? `<p><a href="${s.href}">${s.cta} →</a></p>` : ''}
        <div class="tour-dots" aria-hidden="true">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row">
          ${i ? `<a class="btn ghost" href="#/tour/${i}">Back</a>` : ''}
          ${last ? `<a class="btn" href="${QT.store.isEmpty() ? '#/coach/diagnostic' : '#/'}">${QT.store.isEmpty() ? 'Start the diagnostic' : 'Done'}</a>` : `<a class="btn" href="#/tour/${i + 2}">Next</a>`}
        </div>
      </div>`;
  }

  QT.views = Object.assign(QT.views || {}, { tour });
  QT.tour = { STEPS };
})();
