// Prints the interview 2 study guide's numeric self-checks for research/verify_round2.py:
//   node tests/export-round2.js > r2.json && python research/verify_round2.py r2.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const checks = QT.round2Guide.MODULES.flatMap((m) => m.checks.filter((c) => !c.opts).map(({ id, a, tol }) => ({ id, a, tol })));
process.stdout.write(JSON.stringify({ checks }));
