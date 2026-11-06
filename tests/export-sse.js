// Prints the numeric answers in the Citadel SSE questions, for research/verify_sse.py:
//   node tests/export-sse.js > sse.json && python research/verify_sse.py sse.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const out = QT.sseContent.filter((q) => q.type === 'numeric').map(({ id, value, tol }) => ({ id, value, tol }));
const drills = Object.entries(QT.ssePy).map(([id, d]) => ({ id, test: d.test, reference: QT.sseContent.find((q) => q.id === id).solution }));
process.stdout.write(JSON.stringify({ numeric: out, drills }));
