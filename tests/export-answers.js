// Prints the answer the app serves for every interview-bank question part, keyed "<id>.<part>",
// so research/verify_results.py can check them against independent Python derivations:
//   node tests/export-answers.js > answers.json && python research/verify_results.py --js answers.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const out = {};
for (const b of QT.bank) (b.parts || []).forEach((p, i) => { out[`${b.id}.${i}`] = p.a; });
if (QT.handbook) {
  for (const [id, ch] of Object.entries(QT.handbook.CHAPTERS)) {
    for (const { c, key } of [...QT.handbook.checksOf(ch), ...QT.handbook.homeworkOf(ch)]) if (Number.isFinite(c.a)) out[`hb.${id}.${key}`] = c.a;
  }
}
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
