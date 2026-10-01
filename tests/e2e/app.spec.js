// End-to-end tests: the real app in a real browser, on desktop and on a touch phone.
// Every test also fails on any console error, uncaught exception or CSP violation.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const ROUTES = ['', 'coach', 'coach/diagnostic', 'coach/session', 'drill/dice/1', 'practice', 'topic/bayes', 'review', 'mistakes',
  'bank', 'bank/js', 'iq/js-reroll', 'iq/ts-rent', 'mock/sig', 'cases', 'case/ltcm', 'mental', 'market', 'estimate', 'lab', 'roadmap', 'more'];

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

test.describe('accessibility (axe, WCAG 2 A/AA)', () => {
  for (const r of ['', 'coach', 'topic/bayes', 'bank', 'iq/js-reroll', 'more', 'mistakes', 'estimate']) {
    test(`no serious violations on #/${r}`, async ({ page }) => {
      await page.goto(`./?demo#/${r}`); // demo data so the populated screens are checked too
      await expect(page.locator('main h1').first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}× e.g. ${v.nodes[0].target})`)).toEqual([]);
    });
  }
});
