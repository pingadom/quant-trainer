// End-to-end tests: the real app in a real browser, on desktop and on a touch phone.
// Every test also fails on any console error, uncaught exception or CSP violation.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const ROUTES = ['', 'coach', 'coach/diagnostic', 'coach/session', 'drill/dice/1', 'practice', 'topic/bayes', 'review', 'mistakes',
  'bank', 'bank/js', 'iq/js-reroll', 'iq/ts-rent', 'mock/sig', 'cases', 'case/ltcm', 'mental', 'tricks', 'tricks/near-100', 'market', 'estimate', 'lab', 'roadmap', 'more',
  'figgie', 'quote', 'kelly', 'daily', 'oa', 'progress', 'talk', 'talk/sig-three-dice', 'appearance'];

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
  for (let i = 0; i < 14; i++) await skip(page);
  await expect(page.getByText(/Diagnostic complete/)).toBeVisible();
  await page.getByRole('link', { name: 'See your plan' }).click();
  await expect(page.locator('.recs .rec').first()).toBeVisible();
  await expect(page.locator('.skill-chips .sk')).toHaveCount(79);
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
  await expect(page.locator('.qitem')).toHaveCount(24); // unknown firm → every question, not none
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
});

test('speed-trick lesson and drill', async ({ page }) => {
  await page.goto('./#/tricks');
  await expect(page.locator('.topic-card')).toHaveCount(20);
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
  await expect(page.locator('#dc-text')).toContainText('Quant Trainer daily #');
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
    const routes = ['', 'coach', 'coach/diagnostic', 'practice', 'topic/bayes', 'review', 'mistakes/all', 'bank/sig', 'iq/js-reroll', 'mock', 'case/ltcm', 'mental', 'market', 'estimate', 'tricks', 'tricks/near-100', 'lab', 'roadmap', 'more', 'figgie', 'quote', 'kelly', 'daily', 'oa', 'progress', 'talk', 'appearance'];
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
      for (const r of ['', 'topic/bayes', 'mental', 'figgie', 'progress', 'appearance']) {
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
  for (const r of ['', 'coach', 'topic/bayes', 'bank', 'iq/js-reroll', 'more', 'mistakes', 'estimate', 'mental', 'tricks', 'tricks/near-100', 'figgie', 'quote', 'kelly', 'daily', 'oa', 'progress', 'talk', 'talk/sig-three-dice']) {
    test(`no serious violations on #/${r}`, async ({ page }) => {
      await page.goto(`./?demo#/${r}`); // demo data so the populated screens are checked too
      await expect(page.locator('main h1').first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}× e.g. ${v.nodes[0].target})`)).toEqual([]);
    });
  }
});
