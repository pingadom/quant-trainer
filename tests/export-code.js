// Prints every coding problem with its Python reference and all its test cases (the hand-written
// ones, plus the random and large ones with expected outputs from the JavaScript reference), so
// research/verify_code.py can check the Python reference and a brute-force version against them:
//   node tests/export-code.js > code.json && python research/verify_code.py code.json
const { loadQT } = require('./load-qt');

const { QT } = loadQT();
const C = QT.code;
const out = C.PROBLEMS.map((P) => ({
  id: P.id, kind: P.kind, name: C.pyName(P), ref: P.ref.py, starter: P.starter ? P.starter.py : null,
  cases: C.cases(P, 'submit').map((t) => ({ label: t.label, args: t.args, init: t.init, ops: t.ops, out: t.out, perf: !!t.perf })),
}));
process.stdout.write(JSON.stringify(out));
