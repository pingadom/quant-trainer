// Runs the shared test suite under Node (used by CI): `npm test`.
const vm = require('vm');
const { loadQT, read } = require('./load-qt');

const sandbox = loadQT();
vm.runInContext(read('tools/firm-pages.js'), sandbox, { filename: 'tools/firm-pages.js' });
vm.runInContext(read('tools/import-content.js'), sandbox, { filename: 'tools/import-content.js' });
vm.runInContext(read('tests/checks.js'), sandbox, { filename: 'tests/checks.js' });

const { lines, fails } = sandbox.runChecks(sandbox.QT, {
  index: read('www/index.html'),
  sw: read('www/sw.js'),
  pkg: read('package.json'),
  content: [read('content/citadel-module.md'), read('content/citadel-sse.md')],
});
console.log(lines.join('\n'));
process.exit(fails ? 1 : 0);
