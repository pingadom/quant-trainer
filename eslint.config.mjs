// ESLint flat config. The app is plain browser scripts sharing one global namespace (QT);
// tests and tooling run under Node.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'android/**', 'ios/**', 'test-results/**', 'playwright-report/**', '.lighthouseci/**'] },
  js.configs.recommended,
  {
    files: ['www/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.browser, QT: 'writable' },
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'smart'],
      'no-implicit-globals': 'error',
    },
  },
  { files: ['www/sw.js'], languageOptions: { globals: { ...globals.serviceworker } } },
  {
    files: ['tests/**/*.js', 'tools/**/*.js', 'playwright.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser, QT: 'readonly', runChecks: 'writable', firmPages: 'readonly' } },
    rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] },
  },
];
