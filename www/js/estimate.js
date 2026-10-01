// Estimation & calibration game.
// Format reported for Optiver's market-making round: give a range [L, U] for an unknown
// quantity; you score L/U if the truth is inside, 0 otherwise, so tight correct ranges score best.
// Separately we track calibration: treat each range as a 90% interval and see how often
// the truth actually lands inside. Good traders are both sharp and honest about uncertainty.
(function () {
  const R = QT.rand, store = QT.store, f = QT.fmtNum;
  const ROUND = 10;

  // [question, unit, answer, note]. Units are chosen so answers can be typed on the keypad.
  const FACTS = [
    ['Height of the Eiffel Tower, including antennas', 'metres', 330, 'Raised to 330 m by a new antenna in 2022.'],
    ['Height of Mount Everest', 'metres', 8849, '8,848.86 m, the 2020 China–Nepal survey.'],
    ['Height of the Burj Khalifa', 'metres', 828, "The world's tallest building."],
    ['Height of the Shard, London', 'metres', 310, '309.6 m.'],
    ['Height of the Elizabeth Tower (Big Ben)', 'metres', 96, ''],
    ['Height of Mount Kilimanjaro', 'metres', 5895, ''],
    ['Length of the River Thames', 'km', 346, ''],
    ['Length of the Channel Tunnel', 'km', 50.46, ''],
    ['Length of the Great Wall of China, all branches', 'km', 21196, "China's 2012 national survey."],
    ['Great-circle distance from London to New York', 'km', 5570, ''],
    ['Average distance from the Earth to the Moon', 'thousand km', 384.4, '384,400 km.'],
    ['Average distance from the Earth to the Sun', 'million km', 149.6, '1 astronomical unit.'],
    ['Mean diameter of the Earth', 'km', 12742, ''],
    ['Diameter of the Moon', 'km', 3474, ''],
    ['Speed of light in a vacuum', 'thousand km per second', 299.792, '299,792.458 km/s exactly, by definition.'],
    ['Speed of sound in air at 20 °C', 'metres per second', 343, ''],
    ['Number of bones in an adult human body', 'bones', 206, ''],
    ['Number of chemical elements in the periodic table', 'elements', 118, ''],
    ['Number of keys on a standard piano', 'keys', 88, ''],
    ['Number of UN member states', 'countries', 193, ''],
    ['Population of London at the 2021 census', 'million people', 8.8, '8,799,800.'],
    ['UK population, mid-2023 ONS estimate', 'million people', 68.3, ''],
    ['World population in 2024, UN estimate', 'billion people', 8.2, 'UN World Population Prospects 2024.'],
    ['Number of London Underground stations', 'stations', 272, 'As counted by TfL.'],
    ['Mass of a 12-sided £1 coin', 'grams', 8.75, ''],
    ['Length of a marathon', 'km', 42.195, ''],
    ['Seconds in a day', 'seconds', 86400, ''],
    ['Minutes in a (non-leap) year', 'minutes', 525600, ''],
    ['Trading days in a typical US year', 'days', 252, 'The number behind √252 in vol annualisation.'],
    ['Number of squares of any size on a chessboard', 'squares', 204, '1² + 2² + … + 8² = 204.'],
    ['Number of distinct 5-card poker hands', 'million hands', 2.59896, 'C(52,5) = 2,598,960.'],
    ['2 to the power 30', 'billion', 1.0737, '2³⁰ = 1,073,741,824 ≈ 10⁹ (2¹⁰ ≈ 10³).'],
    ['2 to the power 64', '× 10¹⁸', 18.447, '≈ 1.8447 × 10¹⁹.'],
    ['e to the power 10', 'thousand', 22.026, 'e¹⁰ ≈ 22,026.'],
    ['Number of digits in 100!', 'digits', 158, ''],
    ['Number of primes below 1,000', 'primes', 168, ''],
    ['1.01 to the power 100', '', 2.7048, 'Close to e, since (1 + 1/n)ⁿ → e.'],
    ['0.99 to the power 100', '', 0.36603, 'Close to 1/e ≈ 0.368.'],
    ['Natural log of 1,000', '', 6.9078, '3 × ln 10 ≈ 3 × 2.3026.'],
    ['Square root of 2,000', '', 44.721, '√2000 = 20√5 ≈ 20 × 2.236.'],
    ['Smallest group size where a shared birthday is more likely than not', 'people', 23, 'The birthday problem.'],
    ['Years to double money at 6% a year, compounded annually', 'years', Math.log(2) / Math.log(1.06), 'ln 2 / ln 1.06 ≈ 11.9; the rule of 72 gives 12.'],
    ['Annualised volatility for 1% daily volatility', '%', Math.sqrt(252),'√252 ≈ 15.87.'],
  ];
  QT.estimateFacts = FACTS;

  function render(el) {
    const st = store.get().estimate;
    const cal = st.n ? st.hits / st.n : null;
    el.innerHTML = `
      <h1>Estimation &amp; calibration</h1>
      <p class="lede">For each quantity, give a low and a high value. If the truth is inside your range you score <b>low ÷ high</b>; if not, zero. Tight ranges score more but miss more often. This is the interval format reported for Optiver's market-making game.</p>
      <div class="tiles">
        <div class="tile"><div class="v">${st.rounds}</div><div class="k">rounds played</div></div>
        <div class="tile"><div class="v">${st.best === null ? '–' : f(st.best)}</div><div class="k">best score / ${ROUND}</div></div>
        <div class="tile"><div class="v">${cal === null ? '–' : Math.round(cal * 100) + '%'}</div><div class="k">ranges containing the truth</div></div>
      </div>
      <div class="card"><p style="margin-top:0"><b>Calibration:</b> if your ranges are honest 90% intervals, about 90% should contain the truth. ${calibrationVerdict(st)}</p>
      <button id="start">Start a round of ${ROUND}</button></div>`;
    el.querySelector('#start').addEventListener('click', () => play(el));
  }

  function calibrationVerdict(st) {
    if (st.n < 20) return `Play ${20 - st.n} more questions for a verdict.`;
    const c = st.hits / st.n;
    if (c < 0.75) return `Yours is ${Math.round(c * 100)}%: <b>overconfident</b>. Widen your ranges. Most people start here.`;
    if (c > 0.97) return `Yours is ${Math.round(c * 100)}%: <b>underconfident</b>. Your ranges are wider than they need to be.`;
    return `Yours is ${Math.round(c * 100)}%: <b>well calibrated</b>.`;
  }

  function play(el) {
    const qs = [...FACTS].sort(() => Math.random() - 0.5).slice(0, ROUND);
    let i = 0, score = 0, hits = 0;
    const log = [];

    function show() {
      const [q, unit] = qs[i];
      el.innerHTML = `
        <h1>Estimation</h1>
        <div class="session"><span>Question ${i + 1} of ${ROUND}</span><span class="mono" id="est-score">score ${f(score)}</span></div>
        <div class="card">
          <div class="question">${q}${unit ? ` <span class="small">(${unit})</span>` : ''}</div>
          <form class="row" id="est">
            <label>Low <input type="text" inputmode="decimal" autocomplete="off" id="lo" style="width:120px" aria-label="Low estimate"></label>
            <label>High <input type="text" inputmode="decimal" autocomplete="off" id="hi" style="width:120px" aria-label="High estimate"></label>
            <button>Submit</button>
          </form>
          <div id="est-fb" aria-live="polite"></div>
        </div>`;
      const form = el.querySelector('#est'), lo = el.querySelector('#lo'), hi = el.querySelector('#hi');
      const kp = QT.keypad.attach(form, [lo, hi], (inp) => (inp === lo ? kp.focus(hi) : form.requestSubmit()));
      if (!kp) lo.focus();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (form.dataset.done) return next();
        const L = QT.parseAnswer(lo.value), U = QT.parseAnswer(hi.value), fb = el.querySelector('#est-fb');
        if (!(L > 0 && U > 0)) return (fb.innerHTML = `<div class="fb bad">Enter two positive numbers.</div>`);
        if (L > U) return (fb.innerHTML = `<div class="fb bad">Low must not be above high.</div>`);
        const [, unit, truth, note] = qs[i];
        const hit = truth >= L && truth <= U, pts = hit ? L / U : 0;
        score += pts;
        if (hit) hits++;
        el.querySelector('#est-score').textContent = `score ${f(score)}`;
        log.push({ q: qs[i][0], L, U, truth, hit, pts });
        form.dataset.done = '1';
        lo.disabled = hi.disabled = true;
        form.querySelector('button').textContent = i + 1 < ROUND ? 'Next →' : 'See results';
        fb.innerHTML = `<div class="fb ${hit ? 'ok' : 'bad'}">${hit ? `✓ Inside your range: +${f(pts)}` : `✗ Outside your range: +0`}</div>
          <div class="solution">Answer: <b>${f(truth)}</b>${unit ? ' ' + unit : ''}. ${note} ${hit ? '' : truth < L ? 'Your range was too high.' : 'Your range was too low.'}</div>`;
        if (!kp) form.querySelector('button').focus();
      });
    }

    function next() {
      if (++i < ROUND) return show();
      const st = store.get().estimate;
      st.rounds++;
      st.hits += hits;
      st.n += ROUND;
      const prevBest = st.best;
      st.best = prevBest === null ? score : Math.max(prevBest, score);
      store.touchDay();
      store.save();
      el.innerHTML = `
        <h1>Round complete</h1>
        <div class="tiles">
          <div class="tile"><div class="v">${f(score)}</div><div class="k">score / ${ROUND}${prevBest === null || score > prevBest ? ' · new best!' : ''}</div></div>
          <div class="tile"><div class="v">${hits}/${ROUND}</div><div class="k">ranges contained the truth</div></div>
        </div>
        <div class="card"><p style="margin-top:0">${calibrationVerdict(st)}</p></div>
        <h2>Review</h2>
        <div class="card table-wrap"><table>
          <tr><th>Quantity</th><th class="num">Your range</th><th class="num">Truth</th><th class="num">Points</th></tr>
          ${log.map((r) => `<tr><td>${r.q}</td><td class="num">${f(r.L)} – ${f(r.U)}</td><td class="num ${r.hit ? 'pos' : 'neg'}">${f(r.truth)}</td><td class="num">${f(r.pts)}</td></tr>`).join('')}
        </table></div>
        <div class="row" style="margin-top:18px"><button id="again">Play again</button><a class="btn ghost" href="#/estimate">Back</a></div>`;
      el.querySelector('#again').addEventListener('click', () => play(el));
    }

    show();
  }

  QT.estimate = { render };
})();
