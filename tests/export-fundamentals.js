// Prints the tech-screening fundamentals self-checks for research/verify_fundamentals.py:
//   node tests/export-fundamentals.js > fund.json && python research/verify_fundamentals.py fund.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const checks = QT.fundamentals.TOPICS.flatMap((t) => t.checks.map(({ id, a, tol }) => ({ id, a, tol })));
process.stdout.write(JSON.stringify({ checks }));
