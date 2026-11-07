// Loads the app's data and logic scripts into a Node sandbox that stands in for the browser
// window, so tests and tools can use QT without a browser. Shared by run-node.js and
// export-answers.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SCRIPTS = ['config.js', 'core.js', 'gens-interview.js', 'gens-foundations.js', 'gens-extra.js', 'topics.js', 'cases.js', 'bank.js', 'bank-reports.js', 'bank-classics.js', 'bank-web.js', 'bank-hints.js', 'bank-solutions.js', 'review.js', 'coach.js', 'estimate.js', 'mental-tips.js', 'mental.js', 'flow.js', 'ft60.js', 'tricks.js', 'chart.js', 'pace.js', 'quote.js', 'kelly.js', 'figgie.js', 'daily.js', 'oa.js', 'talk.js', 'views/progress.js', 'views/plan.js', 'flashcards.js', 'stories.js', 'screen.js', 'adapt.js', 'code-problems.js', 'code-quiz.js', 'sse-content.js', 'sse.js', 'sse-sim.js', 'sse-mock.js', 'sse-py.js', 'hb-figs.js', 'hb-widgets.js', 'hb-part1.js', 'hb-part2.js', 'hb-part3.js', 'hb-part4.js', 'hb-part5.js', 'hb-part6.js', 'handbook-content.js', 'keypad.js', 'ui.js', 'views/search.js'];

function loadQT() {
  const sandbox = { console, localStorage: { getItem: () => null, setItem: () => {} } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of SCRIPTS) vm.runInContext(read(`www/js/${f}`), sandbox, { filename: `www/js/${f}` });
  return sandbox;
}

module.exports = { loadQT, read, root };
