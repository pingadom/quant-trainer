// End-to-end tests: the real app in a real browser, on desktop and on a touch phone.
// Every test also fails on any console error, uncaught exception or CSP violation.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { layoutAudit } = require('../layout-audit');

const ROUTES = ['', 'coach', 'coach/diagnostic', 'coach/session', 'drill/dice/1', 'practice', 'topic/bayes', 'review', 'mistakes',
  'bank', 'bank/js', 'iq/js-reroll', 'iq/ts-rent', 'mock/sig', 'cases', 'case/ltcm', 'mental', 'tricks', 'tricks/near-100', 'market', 'estimate', 'lab', 'roadmap', 'more',
  'figgie', 'quote', 'kelly', 'daily', 'oa', 'progress', 'talk', 'talk/sig-three-dice', 'appearance', 'tour', 'tour/5', 'mental/rep/frac', 'bank/wincent', 'plan', 'topic/markov', 'flashcards', 'mental/challenge/abc12345/30', 'search', 'search/kelly', 'search/wincent%20dice', 'bank/all/unsure', 'bank/js/todo', 'iq/cl-monty-hall', 'handbook', 'handbook/arith', 'handbook/counting', 'handbook/prob-basics', 'handbook/conditional', 'handbook/expectation', 'handbook/variance', 'handbook/distributions', 'handbook/symmetry', 'handbook/recursion', 'handbook/markov', 'handbook/walks', 'handbook/stopping', 'handbook/continuous', 'handbook/toolkit', 'handbook/linalg', 'handbook/brownian', 'handbook/stochastic', 'handbook/exam/stochastic', 'handbook/clt', 'handbook/estimation', 'handbook/testing', 'handbook/regression', 'handbook/matrix', 'handbook/timeseries', 'handbook/betting', 'handbook/market-making', 'handbook/options', 'handbook/fermi', 'handbook/games', 'handbook/factors', 'handbook/backtest', 'handbook/craft', 'handbook/review', 'handbook/sheet', 'handbook/exam/foundations', 'handbook/exam/all', 'screen', 'screen/citadel', 'screen/part/mm', 'stories', 'stories/why-firm', 'weak', 'weak/session', 'weak/session/mm', 'code', 'code/opt-worst-trade', 'code/opt-debug-position', 'code/quiz', 'code/quiz/all', 'mental/flow', 'mental/60in6', 'mental/flow/rhythm', 'mental/flow/method/sub-borrow', 'sse', 'sse/all', 'sse/all/equity-quant', 'sse/all/any/pca', 'sse/drill/statistics-regression', 'sse/q/q-py-001', 'sse/mock', 'sse/sim', 'sse/sim/two-dice/2', 'sse/sim/three-cards/4', 'sse/q/q-py-002'];

let problems;
test.beforeEach(async ({ page }) => {
  problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`exception: ${e.message}`));
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`)));
});
test.afterEach(() => expect(problems, 'console errors / exceptions / CSP violations').toEqual([]));

const skip = async (page) => {
  await page.getByRole('button', { name: 'Show answer' }).click();
  await page.getByRole('button', { name: 'Next question →' }).click();
};

test('first visit offers one clear first step', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Get ready for quant trading interviews' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start with a 15-minute diagnostic' })).toBeVisible();
});

test('every screen renders a heading', async ({ page }) => {
  for (const r of ROUTES) {
    await page.goto(`./#/${r}`);
    await expect(page.locator('main h1').first(), `#/${r}`).toBeVisible();
  }
});

test('the result of an answer is always on screen', async ({ page, isMobile }) => {
  await page.goto('./#/topic/dice');
  if (isMobile) await expect(page.locator('.keypad')).toBeVisible();
  await page.getByRole('button', { name: 'Show answer' }).click();
  await expect(page.locator('.fb')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Next question →' })).toBeInViewport();
  if (isMobile) await expect(page.locator('.keypad')).toBeHidden(); // nothing to type; keeps the result visible
  await page.getByRole('button', { name: 'Next question →' }).click();
  await expect(page.getByLabel('Your answer')).toBeEmpty();
  await expect(page.getByLabel('Your answer')).toBeEnabled();
});

test('typing an answer on the on-screen keypad', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'keypad appears on touch screens');
  await page.goto('./#/topic/dice');
  for (const k of ['0', 'Decimal point', '5']) await page.locator('.keypad').getByRole('button', { name: k, exact: true }).click();
  await expect(page.getByLabel('Your answer')).toHaveValue('0.5');
  await page.locator('.keypad').getByRole('button', { name: 'Enter' }).click();
  await expect(page.locator('.fb')).toBeInViewport();
});

test('an empty answer gets a nudge, not an error', async ({ page, isMobile }) => {
  await page.goto('./#/topic/dice');
  if (isMobile) await page.locator('.keypad').getByRole('button', { name: 'Enter' }).click();
  else await page.getByLabel('Your answer').press('Enter');
  await expect(page.locator('#p-hint')).toHaveText(/Type an answer first/);
  await expect(page.locator('.fb')).toHaveCount(0);
});

test('diagnostic builds a coaching plan', async ({ page }) => {
  await page.goto('./#/coach/diagnostic');
  const [topics, skills] = await page.evaluate(() => [QT.topics.length, QT.coach.allIds().length]);
  for (let i = 0; i < topics; i++) await skip(page); // one question per topic
  await expect(page.getByText(/Diagnostic complete/)).toBeVisible();
  await page.getByRole('link', { name: 'See your plan' }).click();
  await expect(page.locator('.recs .rec').first()).toBeVisible();
  await expect(page.locator('.skill-chips .sk')).toHaveCount(skills);
});

test('wrong answers come back for review', async ({ page }) => {
  await page.goto('./#/topic/bayes');
  await page.getByRole('button', { name: 'Show answer' }).click();
  await expect(page.getByText('saved to review later')).toBeVisible();
  await page.evaluate(() => { QT.mistakes.all().forEach((m) => { m.due = 0; }); QT.store.save(); });
  await page.goto('./#/mistakes');
  await page.getByRole('link', { name: 'Review 1 due' }).click();
  await expect(page.locator('#p-tag')).toContainText('review');
});

test('an imported progress file cannot run script', async ({ page }) => {
  const evil = { mistakes: [{ key: 'k', tag: '<img src=x onerror="window.__pwned=1">t', p: { q: 'Q<img src=x onerror="window.__pwned=1"><sup>2</sup>', a: 1, sol: 's' }, box: 0, due: 0 }] };
  await page.goto('./#/more');
  await page.locator('#imp').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(evil)) });
  await page.goto('./#/mistakes');
  await page.goto('./#/mistakes/all');
  await expect(page.locator('#p-q')).toContainText('Q');
  await expect(page.locator('#p-q sup')).toHaveText('2'); // harmless markup survives
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
});

test('demo profile is labelled and easy to leave', async ({ page }) => {
  await page.goto('./?demo#/coach');
  await expect(page.locator('.demo-banner')).toContainText('Sample data');
  await page.getByRole('button', { name: 'Start my own →' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Get ready for quant trading interviews' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.demo-banner')).toHaveCount(0);
});

test('works offline after the first visit', async ({ page, context, browserName, isMobile }) => {
  test.skip(isMobile, 'one browser is enough for the service worker');
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('main h1')).toBeVisible();
  await page.goto('./#/topic/dice');
  await expect(page.getByLabel('Your answer')).toBeVisible();
  await context.setOffline(false);
});

test('broken or unknown links never leave a broken screen', async ({ page }) => {
  for (const [hash, heading] of [['#/topic/%E0%A4%A', 'Practice'], ['#/toString', 'Get ready'], ['#/constructor', 'Get ready'], ['#/mock/nope', 'Mock interview'], ['#/bank/nope', 'Interview questions'], ['#/tricks/nope', 'Speed tricks'], ['#/drill/zz/99', 'Coach']]) {
    await page.goto(`./${hash}`);
    await expect(page.locator('main h1').first(), hash).toContainText(heading);
  }
  await page.goto('./#/bank/nope');
  await expect(page.locator('.qitem')).toHaveCount(await page.evaluate(() => QT.bank.length)); // unknown firm → every question, not none
});

test('80-in-8 offers multiple choice or typed answers', async ({ page, isMobile }) => {
  await page.goto('./#/mental');
  await page.getByRole('radio', { name: 'Type answers' }).click();
  await expect(page).toHaveURL(/#\/mental$/); // the toggle must not navigate
  await page.locator('[data-mode="full"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('typed');
  await expect(page.getByRole('button', { name: 'Pass (−1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Pass (−1)' }).click();
  await expect(page.locator('#mm-score')).toContainText('net -1');
  await page.goto('./#/');
  await page.goto('./#/mental');
  await expect(page.getByRole('radio', { name: 'Type answers' })).toHaveAttribute('aria-checked', 'true'); // remembered
  await page.getByRole('radio', { name: 'Multiple choice' }).click();
  await page.locator('[data-mode="full"]').click();
  await expect(page.locator('#mm-mc button')).toHaveCount(4);
  if (!isMobile) {
    await page.keyboard.press('Control+1'); // a browser shortcut must not answer
    await expect(page.locator('#mm-score')).toContainText('Q1/80');
    await page.keyboard.press('1');
    await expect(page.locator('#mm-score')).toContainText('Q2/80');
  }
});

test('slow and missed 80-in-8 questions come back with the fast method', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/mental');
  await page.getByRole('radio', { name: 'Multiple choice' }).click();
  await page.locator('[data-mode="full"]').click();
  await page.clock.runFor(7_000); // dawdle on the first question: over the 6 s threshold
  await page.locator('#mm-mc button[data-ok="1"]').click();
  await page.evaluate(() => {
    for (let i = 0; i < 79; i++) {
      const b = document.querySelectorAll('#mm-mc button');
      if (!b.length) break;
      (i % 4 ? [...b].find((x) => x.dataset.ok === '1') : [...b].find((x) => x.dataset.ok !== '1')).click();
    }
  });
  await expect(page.getByRole('heading', { level: 2, name: 'Review' })).toBeVisible();
  await expect(page.locator('.review-item .flag.slow')).toHaveCount(1);
  expect(await page.locator('.review-item .flag.bad').count()).toBeGreaterThan(5);
  await expect(page.locator('.review-item').first()).toContainText('Faster:');
  await page.getByRole('button', { name: /Practise these types/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Speed drill');
  await page.getByRole('link', { name: '← Mental maths' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Your speed by question type' })).toBeVisible(); // remembered across runs
});

test('60 in 6: one question at a time, unreached questions score nothing', async ({ page, isMobile }) => {
  await page.clock.install();
  await page.goto('./#/mental/60in6');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('#ft-n')).toHaveText('Question 1/60');
  await expect(page.locator('#ft-mc button')).toHaveCount(4);
  await page.locator('#ft-mc button[data-ok="1"]').click();
  await page.locator('#ft-mc button[data-ok="0"]').first().click();
  await expect(page.locator('#ft-n')).toHaveText('Question 3/60');
  await expect(page.locator('#ft-score')).toHaveText('Score 0');
  if (!isMobile) {
    await page.keyboard.press('Control+2'); // a browser shortcut must not answer
    await expect(page.locator('#ft-n')).toHaveText('Question 3/60');
    await page.keyboard.press('2');
    await expect(page.locator('#ft-n')).toHaveText('Question 4/60');
  }
  await page.clock.runFor(361_000);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/60 in 6: done/);
  await expect(page.locator('.tile').nth(1)).toContainText(isMobile ? '1 / 1 / 58' : /1 \/ 2 \/ 57|2 \/ 1 \/ 57/);
  await expect(page.getByText(/Every question \(\d+\)/)).toBeVisible();
  await page.goto('./#/mental');
  await expect(page.getByRole('link', { name: 'Open' })).toBeVisible();
});

test('a due speed rep runs, and a failed one comes back tomorrow', async ({ page }) => {
  await page.goto('./#/');
  await page.evaluate(() => { QT.store.get().speedReview = { frac: { box: 1, due: Date.now() - 1 } }; QT.store.save(); });
  await page.goto('./#/mental');
  await expect(page.getByRole('heading', { level: 2, name: 'Speed reps' })).toBeVisible();
  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Speed rep: Fractions to decimals');
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Pass', exact: true }).click();
  await expect(page.getByText("It's back tomorrow")).toBeVisible();
  expect(await page.evaluate(() => QT.store.get().speedReview.frac.box)).toBe(0);
});

test('interview plan: pick a firm and date, tick a task, see the countdown', async ({ page }) => {
  await page.goto('./#/plan');
  await page.getByLabel('Firm').selectOption('wincent');
  const inThree = await page.evaluate(() => QT.dayKey(new Date(Date.now() + 3 * 864e5)));
  await page.getByLabel('Interview date').fill(inThree);
  await page.getByRole('button', { name: 'Make my plan' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wincent interview');
  await expect(page.getByText('in 3 days')).toBeVisible();
  const box = page.getByRole('checkbox', { name: /Mark done: Mock interview|Mark done: Light review|Mark done: Practise/ }).first();
  await box.click();
  await expect(page.getByRole('heading', { level: 2, name: /Today/ })).toContainText('1/');
  await page.goto('./#/');
  await expect(page.getByRole('link', { name: /Wincent interview in 3 days/ })).toBeVisible();
});

test('the tour walks through every section', async ({ page }) => {
  await page.goto('./#/');
  await page.getByRole('link', { name: 'Take the 1-minute tour' }).click();
  for (let i = 1; i < 7; i++) {
    await expect(page.locator('.eyebrow')).toContainText(`${i} of 7`);
    await page.getByRole('link', { name: 'Next' }).click();
  }
  await expect(page.getByRole('link', { name: 'Start the diagnostic' })).toBeVisible();
});

test('Zetamac: answers go through without Enter; slow and unfinished questions come back for review', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('qt-keypad', 'off')); // type directly, also on the phone project
  await page.clock.install();
  await page.goto('./#/mental');
  await expect(page.getByText('Zetamac default settings')).toBeVisible();
  await page.locator('[data-mode="zetamac"]').click();
  const solve = (q) => { const [a, op, b] = q.split(' '); const x = +a, y = +b; return String(op === '+' ? x + y : op === '−' ? x - y : op === '×' ? x * y : x / y); };
  await page.clock.runFor(8_000); // dawdle on the first question: slower than the 6 s threshold
  for (let i = 0; i < 4; i++) await page.locator('#mm-in').fill(solve(await page.locator('#mm-q').textContent()));
  await expect(page.locator('#mm-score')).toHaveText('Score: 4');
  await page.locator('#mm-in').fill('1'); // a wrong answer just sits there
  await expect(page.locator('#mm-score')).toHaveText('Score: 4');
  await page.clock.runFor(120_000);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zetamac: done');
  await expect(page.locator('.review-item .flag.slow')).toHaveCount(1);
  await expect(page.locator('.review-item .flag.bad')).toHaveText('time ran out');
  await expect(page.locator('.review-item').first()).toContainText('Faster:');
});

test('formula cards: flip, grade, and the schedule moves on', async ({ page }) => {
  await page.goto('./#/flashcards');
  await page.getByRole('button', { name: /^Start/ }).click();
  await page.keyboard.press(' ');
  await expect(page.locator('#fc-back')).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.getByRole('button', { name: 'Show answer' }).click();
  await page.getByRole('button', { name: 'Not yet' }).click();
  const deck = await page.evaluate(() => Object.values(QT.store.get().flash).map((c) => c.box).sort().join());
  expect(deck).toBe('0,0'); // first-time right goes to box 0 (1 day); a miss also restarts at box 0
});

test('Zetamac challenge link: same questions as the sender, with the score to beat', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('qt-keypad', 'off'));
  await page.goto('./#/mental/challenge/abc12345/30');
  await expect(page.getByText('score to beat')).toBeVisible();
  const expected = await page.evaluate(() => QT.mental.seededList('abc12345', QT.mental.ZM_DEFAULT).slice(0, 3).map((q) => [q.q, q.a]));
  await page.getByRole('button', { name: 'Start the challenge' }).click();
  for (const [q, a] of expected) {
    await expect(page.locator('#mm-q')).toHaveText(q);
    await page.locator('#mm-in').fill(String(a));
  }
  await expect(page.locator('#mm-score')).toHaveText('Score: 3');
});

test('speed-trick lesson and drill', async ({ page }) => {
  await page.goto('./#/tricks');
  await expect(page.locator('.topic-card')).toHaveCount(await page.evaluate(() => QT.tricks.length));
  await page.getByRole('link', { name: /Multiplying numbers near 100/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Multiplying numbers near 100');
  for (let i = 0; i < 10; i++) await skip(page);
  await expect(page.getByText('0/10')).toBeVisible();
  await page.goto('./#/mistakes');
  await expect(page.getByText('Your deck is empty')).toBeVisible(); // drills don't fill the mistakes deck
});

test('two open tabs share progress instead of overwriting it', async ({ context }) => {
  const a = await context.newPage(), b = await context.newPage();
  await a.goto('./#/');
  await b.goto('./#/');
  await a.evaluate(() => QT.store.recordAttempt('dice', true));
  await expect(b.locator('main h1')).not.toHaveText('Get ready for quant trading interviews'); // b refreshed
  await b.evaluate(() => QT.store.recordAttempt('cards', false));
  await expect.poll(() => a.evaluate(() => [QT.store.get().topics.dice?.attempts, QT.store.get().topics.cards?.attempts].join(','))).toBe('1,1');
});

test('Figgie: trade with the bots, then settle when time runs out', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/figgie');
  await page.getByRole('button', { name: 'Quick game (2 minutes)' }).click();
  await expect(page.locator('.fg-row')).toHaveCount(4);
  // Post a bid, then let the bots act for a while.
  await page.getByRole('textbox', { name: 'Price for spades' }).fill('2');
  await page.locator('[data-post="bid"][data-s="0"]').click();
  await expect(page.locator('[data-sell="0"]')).toContainText(/Your bid|Sell|no bid/);
  await page.clock.runFor(20_000);
  const trades = await page.locator('#fg-tape li:not(.small)').count();
  expect(trades).toBeGreaterThan(0);
  await page.clock.runFor(110_000);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Figgie:');
  await expect(page.locator('.tile').filter({ hasText: 'goal suit' })).toBeVisible();
  const games = await page.evaluate(() => QT.store.get().figgie.games);
  expect(games).toBe(1);
});

test('make me a market: wide quotes are refused, fills move the conversation on', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('qt-keypad', 'off')); // type directly, also on the phone project
  await page.goto('./#/quote');
  await page.getByRole('button', { name: /Start a round/ }).click();
  await page.getByLabel('Bid').fill('10');
  await page.getByLabel('Ask').fill('50');
  await page.getByRole('button', { name: 'Quote' }).click();
  await expect(page.locator('#qerr')).toContainText('Too wide');
  for (let k = 0; k < 3; k++) {
    await page.getByLabel('Bid').fill('100');
    await page.getByLabel('Ask').fill('150');
    await page.getByRole('button', { name: 'Quote' }).click();
  }
  await expect(page.locator('.fb')).toContainText('Answer');
  await expect(page.locator('table tr')).toHaveCount(4); // header + three trades
});

test('bet sizing: staking nothing is explained', async ({ page }) => {
  await page.goto('./#/kelly');
  await page.getByRole('button', { name: /Start 20 bets/ }).click();
  for (let i = 0; i < 20; i++) {
    await page.getByRole('button', { name: 'Place bet' }).click();
    await page.locator('#next').click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results');
  await expect(page.getByText('You staked nothing on every bet')).toBeVisible();
  await expect(page.locator('.chart svg')).toBeVisible();
});

test('daily challenge: same questions after a reload, one attempt, shareable', async ({ page }) => {
  await page.goto('./#/daily');
  const topics = await page.locator('main').getByText("Today's topics").textContent();
  await page.reload();
  await expect(page.locator('main').getByText("Today's topics")).toHaveText(topics);
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 5; i++) await skip(page);
  await expect(page.locator('#dc-text')).toContainText('Theo daily #');
  await expect(page.locator('#dc-text')).toContainText('🟥🟥🟥🟥🟥 0/5');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Share result' })).toBeVisible(); // no second attempt
});

test('online tests: sequences, digit span and running total', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/oa');
  await page.locator('[data-test="seq"]').click();
  for (let i = 0; i < 15; i++) await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Number sequences: done');
  await page.getByRole('link', { name: 'Back' }).click(); // same URL as the test: must still go back
  await page.locator('[data-test="span"]').click();
  for (let miss = 0; miss < 2; miss++) {
    await page.clock.runFor(15_000); // digits flash, then the answer box appears
    await page.getByRole('textbox', { name: 'The digits in order' }).fill('0');
    await page.getByRole('textbox', { name: 'The digits in order' }).press('Enter');
  }
  await page.clock.runFor(2_000);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Digit span: done');
  // Leaving mid-test must stop its timers drawing over the next screen.
  await page.getByRole('link', { name: 'Back' }).click();
  await page.locator('[data-test="total"]').click();
  await page.goto('./#/progress');
  await page.clock.runFor(20_000);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Progress');
});

test('think aloud: talk, review, score yourself', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('qt-talk-prefs', JSON.stringify({ rec: false, live: false })));
  await page.goto('./#/iq/sig-three-dice');
  await page.getByRole('link', { name: 'Practise it out loud' }).first().click();
  await expect(page).toHaveURL(/#\/talk\/sig-three-dice$/);
  await page.getByRole('button', { name: /I'm done/ }).click();
  await expect(page.getByText('Worked answer')).toBeVisible();
  await page.getByLabel('Said a plan out loud before calculating').check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('1/6.')).toBeVisible();
});

test('progress page charts the demo profile', async ({ page }) => {
  await page.goto('./?demo#/progress');
  await expect(page.locator('.heatmap')).toBeVisible();
  expect(await page.locator('.chart svg').count()).toBeGreaterThanOrEqual(8);
});

// Overlapping boxes, sideways scrolling and clipped button text, on every screen, in every theme.
// (A CSS class-name clash once made wrapped filter chips spill over the box below them.)
test('layout: nothing overlaps, overflows or clips on any screen', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('qt-talk-prefs', JSON.stringify({ rec: false, live: false })));
  await page.goto('./?demo#/');
  await expect(page.locator('main h1').first()).toBeVisible();
  for (const theme of ['notebook', 'night', 'chalk', 'terminal']) {
    await page.evaluate((t) => QT.theme.set('qt-theme', t), theme);
    const problems = await page.evaluate(layoutAudit, ROUTES);
    expect(problems, theme).toEqual([]);
  }
});

test('themes: pick one, it sticks, and the ticker can be turned off', async ({ page }) => {
  await page.goto('./?demo#/appearance');
  await expect(page.locator('#ticker')).toBeVisible(); // the demo profile has numbers to show
  await page.getByRole('radio', { name: /Terminal/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal'); // applied before paint, from storage
  await expect(page.getByRole('radio', { name: /Terminal/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('switch', { name: 'Ticker tape' }).click();
  await expect(page.locator('#ticker')).toBeHidden();
  await page.getByRole('radio', { name: /Match system/ }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('monkey test: random use never errors or shows junk', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('./#/');
  await page.evaluate(() => { window.confirm = () => false; }); // never wipe progress mid-run
  const junk = await page.evaluate(async () => {
    let seed = 20261005;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const inputs = ['0.5', '1/4', '25%', '-3', '', 'abc', '0,5', '1 1/2', '−2', '5/0', '½', '1,250', '<b>x</b>'];
    const routes = ['', 'coach', 'coach/diagnostic', 'practice', 'topic/bayes', 'review', 'mistakes/all', 'bank/sig', 'iq/js-reroll', 'mock', 'case/ltcm', 'mental', 'market', 'estimate', 'tricks', 'tricks/near-100', 'lab', 'roadmap', 'more', 'figgie', 'quote', 'kelly', 'daily', 'oa', 'progress', 'talk', 'appearance', 'code/opt-pair-sum', 'code/quiz', 'mental/flow', 'sse', 'sse/all', 'sse/drill', 'sse/mock', 'sse/sim', 'sse/sim/two-dice/2', 'sse/sim/ten-flips/4'];
    const found = [];
    for (let step = 0; step < 600; step++) {
      if (step % 50 === 0) { location.hash = '#/' + routes[Math.floor(rnd() * routes.length)]; await wait(20); }
      const els = [...document.querySelectorAll('main button, main a[href^="#"], main input[type=text], main select, .keypad button')]
        .filter((el) => el.offsetParent !== null && !el.disabled && !['rst', 'imp', 'demo-off'].includes(el.id));
      if (!els.length) { location.hash = '#/'; await wait(10); continue; }
      const el = els[Math.floor(rnd() * els.length)];
      if (el.tagName === 'INPUT') { el.value = inputs[Math.floor(rnd() * inputs.length)]; if (el.form) el.form.requestSubmit(); }
      else if (el.tagName === 'SELECT') { el.selectedIndex = Math.floor(rnd() * el.options.length); el.dispatchEvent(new Event('change')); }
      else if (el.closest('.keypad')) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      else el.click();
      await wait(2);
      const text = document.querySelector('main').innerText;
      for (const bad of ['undefined', 'NaN', '[object Object]']) if (text.includes(bad)) found.push(`"${bad}" on ${location.hash}`);
    }
    if (window.QT.cleanup) window.QT.cleanup();
    return [...new Set(found)];
  });
  expect(junk).toEqual([]);
});

// Every theme must meet WCAG AA contrast, not just the default one.
test.describe('accessibility in every theme', () => {
  for (const theme of ['notebook', 'night', 'chalk', 'terminal']) {
    test(`no serious violations in ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('qt-theme', t), theme);
      for (const r of ['', 'topic/bayes', 'mental', 'figgie', 'progress', 'appearance', 'tour', 'flashcards']) {
        await page.goto(`./?demo#/${r}`);
        await expect(page.locator('main h1').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
        expect(serious.map((v) => `#/${r}: ${v.id}: ${v.help} (${v.nodes.length}× e.g. ${v.nodes[0].target})`)).toEqual([]);
      }
    });
  }
});

test.describe('accessibility (axe, WCAG 2 A/AA)', () => {
  for (const r of ['', 'coach', 'topic/bayes', 'bank', 'iq/js-reroll', 'more', 'mistakes', 'estimate', 'mental', 'tricks', 'tricks/near-100', 'figgie', 'quote', 'kelly', 'daily', 'oa', 'progress', 'talk', 'talk/sig-three-dice', 'code', 'code/opt-order-book', 'code/quiz', 'sse', 'sse/all', 'sse/q/q-eq-001']) {
    test(`no serious violations on #/${r}`, async ({ page }) => {
      await page.goto(`./?demo#/${r}`); // demo data so the populated screens are checked too
      await expect(page.locator('main h1').first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}× e.g. ${v.nodes[0].target})`)).toEqual([]);
    });
  }
});

test('hints come one at a time, and an answer found with hints stays flagged unsure', async ({ page }) => {
  await page.goto('./#/iq/opt-increasing');
  const hint = page.locator('.hint-btn');
  await expect(hint).toHaveText(/Hint \(1 of \d+\)/);
  await hint.click();
  await expect(page.locator('.hint-list li')).toHaveCount(1);
  await hint.click();
  await expect(page.locator('.hint-list li')).toHaveCount(2);
  await page.addStyleTag({ content: '.keypad { display: none !important }' }); // type directly, also on the phone project
  await page.evaluate(() => { const i = document.querySelector('#p-in'); i.readOnly = false; i.value = '5/54'; });
  await page.locator('#p-form').evaluate((f) => f.requestSubmit());
  await expect(page.locator('.fb.ok')).toContainText('with 2 hints');
  await expect(page.locator('#qstatus [data-mark="unsure"]')).toHaveAttribute('aria-pressed', 'true');
});

test('progress saved by a newer version is never overwritten by an older copy', async ({ page }) => {
  const newer = JSON.stringify({ writer: '99.0.0', days: ['2026-01-01'], bank: { 'js-reroll': { results: [true], mark: 'done', futureField: 1 } } });
  await page.addInitScript((v) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('quant-trainer:v1', v); sessionStorage.setItem('seeded', '1'); } }, newer);
  await page.goto('./#/bank');
  await expect(page.locator('#newer-banner')).toContainText('newer version');
  await page.locator('.qmark.done').first().click(); // would normally save
  expect(await page.evaluate(() => localStorage.getItem('quant-trainer:v1'))).toBe(newer);
});

test('reset keeps a backup that can be restored', async ({ page }) => {
  await page.goto('./#/iq/opt-increasing');
  await page.locator('#qstatus [data-mark="done"]').click();
  await page.goto('./#/more');
  page.once('dialog', (d) => d.accept());
  await page.locator('#rst').click();
  await page.goto('./#/more');
  await page.locator('.backups summary').click();
  page.once('dialog', (d) => d.accept());
  await page.locator('#backup-list [data-restore]').first().click();
  await page.goto('./#/bank/all/done');
  await expect(page.locator('.qrow')).toHaveCount(1);
});

test('handbook: a check answered right counts towards the chapter', async ({ page }) => {
  await page.goto('./#/handbook/counting');
  await expect(page.locator('#hb-progress')).toContainText('0 of 10');
  const first = page.locator('.hb-check').first();
  await first.locator('input').fill('17576');
  await first.getByRole('button', { name: 'Check' }).click();
  await expect(first.locator('.hb-fb')).toContainText('Correct');
  await expect(page.locator('#hb-progress')).toContainText('1 of 10');
  await page.goto('./#/handbook');
  await expect(page.locator('.hb-chapter.started')).toHaveCount(1);
});

test('handbook: worked steps, predictions, concept checks, homework and your own explanation', async ({ page }) => {
  await page.goto('./#/handbook/conditional');
  const worked = page.locator('.hb-worked').first(), step = worked.locator('[data-step]').first();
  await expect(step).toBeHidden();
  await worked.locator('[data-next]').click();
  await expect(step.locator('.hb-ask')).toBeVisible();
  await expect(step.locator('[data-body]')).toBeHidden();
  await worked.locator('[data-next]').click();
  await expect(step.locator('[data-body]')).toBeVisible();

  const mcq = page.locator('.hb-mcq').first();
  await mcq.getByRole('button', { name: '1/2', exact: true }).click();
  await expect(mcq.locator('.hb-fb')).toContainText('Not that one');
  await mcq.getByRole('button', { name: '1/3', exact: true }).click();
  await expect(mcq.locator('.hb-fb')).toContainText('Correct');

  const hw = page.locator('.hb-hw').first();
  await hw.locator('input').fill('1/2');
  await hw.getByRole('button', { name: 'Check' }).click();
  await expect(hw.locator('.hb-fb')).toContainText('Correct');
  await expect(page.locator('#hb-progress')).toContainText('homework done: 1 of');

  await page.goto('./#/handbook/variance');
  const predict = page.locator('.hb-predict').first(), tool = predict.locator('+ .hb-widget');
  await expect(tool).toBeHidden();
  await predict.getByRole('button').first().click();
  await expect(tool).toBeVisible();

  await page.goto('./#/handbook/craft');
  const written = page.locator('.hb-hw').first();
  await written.getByRole('button', { name: 'Show the model answer' }).click();
  await written.getByRole('button', { name: 'Got it' }).click();
  await expect(written).toHaveClass(/solved/);
  await page.locator('.hb-explain textarea').fill('My own words');
  await page.locator('.hb-explain textarea').blur();
  await page.reload();
  await expect(page.locator('.hb-explain textarea')).toHaveValue('My own words');
});

test('handbook: an exam runs to a report, and a finished chapter comes back for review', async ({ page }) => {
  await page.goto('./#/handbook/exam/equities');
  await page.getByRole('button', { name: 'Begin' }).click();
  for (let i = 0; i < 40; i++) {
    if (await page.locator('.hb-score').isVisible()) break;
    const opt = page.locator('.hb-run .hb-opt').first();
    if (await opt.isVisible()) await opt.click();
    else {
      await page.locator('.hb-run input').fill('1');
      await page.getByRole('button', { name: 'Submit' }).click();
    }
  }
  await expect(page.locator('.hb-score')).toContainText('%');
  await page.goto('./#/handbook');
  await expect(page.getByRole('link', { name: /Exam: Quant equities · best/ })).toBeVisible();

  await page.evaluate(() => {
    const s = QT.store.get();
    s.handbook.counting = { c: {}, h: {}, note: '', done: false, rv: { due: Date.now() - 1000, st: 0 } };
    QT.store.save();
  });
  await page.goto('./#/handbook/sheet');
  await page.goto('./#/handbook');
  await expect(page.locator('.hb-due')).toContainText('1 chapter due');
  await page.locator('.hb-due a').click();
  for (let i = 0; i < 3; i++) {
    const opt = page.locator('.hb-run .hb-opt').first();
    if (await opt.isVisible()) await opt.click();
    else {
      await page.locator('.hb-run input').fill('1');
      await page.getByRole('button', { name: 'Check' }).click();
    }
    await page.locator('.hb-next').click();
  }
  await expect(page.locator('#hb-run')).toContainText('Review done');
  await page.goto('./#/handbook');
  await expect(page.locator('.hb-due')).toHaveCount(0);
});

test('coding: run JavaScript, see what failed, fix it and submit; then a knowledge quiz', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('./#/code/opt-pair-sum');
  await page.getByRole('button', { name: 'JavaScript' }).click();
  const editor = page.getByRole('textbox', { name: 'Your code' });
  await expect(page.locator('#leetcode')).toContainText('unlocks when you solve');
  await editor.fill('function pairSum(nums, target) {\n  return [];\n}\n');
  await page.getByRole('button', { name: 'Run examples' }).click();
  await expect(page.locator('#status')).toContainText('0 of 2 examples pass');
  await expect(page.locator('.code-row.fail').first()).toContainText('expected [[-1, 7], [1, 5]]');
  await editor.fill(await page.evaluate(() => QT.code.byId('opt-pair-sum').ref.js));
  await page.getByRole('button', { name: 'Submit (all tests)' }).click();
  await expect(page.locator('#status')).toContainText(/All \d+ tests pass/, { timeout: 60_000 });
  await expect(page.getByRole('link', { name: '1. Two Sum' })).toHaveAttribute('href', 'https://leetcode.com/problems/two-sum/');
  await page.goto('./#/code');
  await expect(page.locator('.tile').first()).toContainText('1/');
  await page.goto('./#/code/quiz');
  await page.getByRole('button', { name: 'Start the quiz' }).click();
  for (let i = 0; i < 20; i++) {
    await page.locator('.quiz-opt').first().click();
    await page.getByRole('button', { name: i === 19 ? 'Finish' : 'Next', exact: true }).click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\d+ of 20$/);
});

test('Citadel SSE prep: a numeric and a conceptual card are logged, and the plan shows them', async ({ page }) => {
  await page.goto('./#/sse/q/q-stat-005');
  await expect(page.locator('#c-time')).toContainText('/ 1:30');
  await page.getByRole('button', { name: 'Hint (1 of 2)' }).click();
  await page.evaluate(() => {
    document.querySelector('#c-in').value = 'alert(1)';
    document.querySelector('#c-form').requestSubmit();
  });
  await expect(page.locator('#c-msg')).toContainText("can't read that");
  await page.evaluate(() => {
    document.querySelector('#c-in').value = 'sqrt(2)/2';
    document.querySelector('#c-form').requestSubmit();
  });
  await expect(page.locator('.fb')).toContainText('Correct');
  await expect(page.locator('.solution')).toContainText('1/√2');
  await page.goto('./#/sse/q/q-eq-006');
  await page.getByRole('button', { name: 'Reveal the solution' }).click();
  await page.getByRole('button', { name: 'Partial' }).click();
  const log = await page.evaluate(() => QT.store.get().sse.attempts);
  expect(log.map((a) => [a.question_id, a.correct, a.hints_used])).toEqual([['q-stat-005', 1, 1], ['q-eq-006', 0.5, 0]]);
  await page.goto('./#/sse');
  await expect(page.locator('.tile').nth(2)).toContainText('2/54');
  await expect(page.locator('.sse-table tr', { hasText: 'Equity quant' })).toContainText('1/7');
  await page.goto('./#/sse/all/any/pca');
  await expect(page.locator('.sse-list a')).toHaveCount(1);
});

test('Citadel SSE prep: a full mock ends in a report, and a rated card comes back on schedule', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./#/sse/mock');
  await page.getByRole('button', { name: 'Start the mock' }).click();
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let step = 0; step < 30 && document.querySelector('#m-seg'); step++) {
      const box = document.querySelector('#m-box');
      if (box.querySelector('#sim-q')) {
        box.querySelector('#sim-bid').value = '5';
        box.querySelector('#sim-ask').value = '8';
        box.querySelector('#sim-q').requestSubmit();
      } else if (box.querySelector('#sim-next')) box.querySelector('#sim-next').click();
      else {
        const notes = box.querySelector('#c-notes');
        if (notes) notes.value = 'my reasoning';
        if (box.querySelector('#c-form')) {
          box.querySelector('#c-in').value = '1';
          box.querySelector('#c-form').requestSubmit();
        } else {
          box.querySelector('#c-reveal').click();
          box.querySelector('[data-grade="1"]').click();
        }
        box.querySelector('#c-next').click();
      }
      await wait(30);
    }
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mock report');
  await expect(page.getByRole('heading', { name: 'Your three weakest tags' })).toBeVisible();
  await expect(page.locator('a[href^="#/sse/drill/any/"]').first()).toBeVisible();
  expect(await page.evaluate(() => QT.store.get().sse.attempts.filter((a) => a.notes === 'my reasoning').length)).toBe(10);
  await page.goto('./#/sse/q/q-ev-001');
  await page.evaluate(() => {
    document.querySelector('#c-in').value = '4.25';
    document.querySelector('#c-form').requestSubmit();
  });
  await page.getByRole('button', { name: /^Good/ }).click();
  expect(await page.evaluate(() => QT.store.get().sse.cards['q-ev-001'].interval)).toBe(2.5);
});

test('flow training: a method drill shows the steps, then times you, and the table fills in', async ({ page }) => {
  await page.goto('./#/mental/flow/method/sub-round');
  await expect(page.locator('main')).toContainText('74 − 39: 74 − 40 = 34, + 1 = 35');
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 14; i++) {
    await page.evaluate(() => {
      const [x, , y] = document.querySelector('#fl-q').textContent.split(' '), input = document.querySelector('#fl-in');
      input.value = String(+x - +y);
      input.dispatchEvent(new Event('input'));
    });
    if (i < 4) {
      await expect(page.locator('#fl-steps')).toContainText('+');
      await page.getByRole('button', { name: 'Next' }).click();
    }
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Method drill: done');
  await page.goto('./#/mental/flow');
  await expect(page.locator('.flow-table')).toContainText('Subtracting a number ending in 8 or 9');
  await expect(page.locator('.flow-table tr', { hasText: 'ending in 8 or 9' }).nth(1).locator('td').nth(2)).toHaveText('10');
});
