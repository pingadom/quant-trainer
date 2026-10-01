// Runs the shared test suite under Node (used by CI): `npm test`.
// Loads the app's data scripts into a sandbox that stands in for the browser window.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SCRIPTS = ['core.js', 'gens-interview.js', 'gens-foundations.js', 'gens-extra.js', 'topics.js', 'cases.js', 'bank.js', 'review.js', 'coach.js', 'estimate.js'];

const sandbox = {
  console,
  localStorage: { getItem: () => null, setItem: () => {} },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const f of SCRIPTS) vm.runInContext(read(`www/js/${f}`), sandbox, { filename: `www/js/${f}` });
vm.runInContext(read('tests/checks.js'), sandbox, { filename: 'tests/checks.js' });

const { lines, fails } = sandbox.runChecks(sandbox.QT, {
  index: read('www/index.html'),
  sw: read('www/sw.js'),
  pkg: read('package.json'),
});
console.log(lines.join('\n'));
process.exit(fails ? 1 : 0);
