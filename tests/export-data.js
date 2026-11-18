// Prints the data drills (js/data-drills.js) for research/verify_data.py:
//   node tests/export-data.js > data.json && python research/verify_data.py data.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const drills = QT.dataDrills.ITEMS.map(({ id, lib, starter, sol, test }) => ({ id, lib, starter, sol, test }));
process.stdout.write(JSON.stringify({ drills }));
