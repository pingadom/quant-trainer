// End-to-end tests in a real browser, on a desktop and a touch phone viewport.
const { defineConfig, devices } = require('@playwright/test');

const PORT = 8766;
const python = process.platform === 'win32' ? 'python' : 'python3';

module.exports = defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}/`, trace: 'retain-on-failure' },
  webServer: {
    command: `${python} -m http.server ${PORT} --bind 127.0.0.1 --directory www`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } }, // touch: shows the on-screen keypad
  ],
});
