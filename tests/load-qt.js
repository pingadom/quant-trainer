// Loads the app's data and logic scripts into a Node sandbox that stands in for the browser
// window, so tests and tools can use QT without a browser. Shared by run-node.js and
// export-answers.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SCRIPTS = ['config.js', 'core.js', 'gens-interview.js', 'gens-foundations.js', 'gens-extra.js', 'topics.js', 'cases.js', 'bank.js', 'review.js', 'coach.js', 'estimate.js', 'mental.js', 'tricks.js'];

function loadQT() {
  const sandbox = { console, localStorage: { getItem: () => null, setItem: () => {} } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of SCRIPTS) vm.runInContext(read(`www/js/${f}`), sandbox, { filename: `www/js/${f}` });
  return sandbox;
}

module.exports = { loadQT, read, root };
