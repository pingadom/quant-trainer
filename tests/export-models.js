// Prints the handbooks' written model answers (homework without a numeric answer) for
// research/verify_models.py:  node tests/export-models.js > models.json && python research/verify_models.py models.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const out = [];
for (const [id, c] of Object.entries(QT.hbChapters)) (c.homework || []).forEach((h, i) => { if (h.a === undefined) out.push({ id, key: `h${i}`, lvl: h.lvl, q: h.q, sol: h.sol }); });
process.stdout.write(JSON.stringify(out));
