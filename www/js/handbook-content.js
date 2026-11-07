// The Theo handbook: a work-through course from the basics up to everything a quant trading
// interview tests. PARTS sets the order; the chapters themselves live in hb-part1.js to hb-part5.js.
//
// A chapter is { title, minutes, why, goals, prereq, sections, takeaways, explain, homework, practice }.
// A section is { h, blocks }, and a block is one of:
//   'html'                                    text
//   { fig: kind, alt, cap, ... }              a diagram (hb-figs.js)
//   { widget: name, predict: { q, opts } }    an interactive tool, optionally behind a prediction
//   { worked: true | 'label', q, steps }      a worked example, revealed step by step. A step is
//                                             html, or [question to think about, answer]
//   { idea }, { trap }, { market }            call-outs: key idea, common mistake, on the desk
//   { proof, title }, { think, back }         fold-outs
//   { q, a, tol, hint, sol, id }              a numeric check
//   { q, opts, sol, id }                      a concept check. The first option is right; an option
//                                             may be [text, why it's wrong]
// Homework is a list of { lvl: core | interview | stretch | lab, q, a?, tol?, hint, sol }. With a
// numeric `a` it's marked automatically; otherwise you compare with the model answer. Core and
// interview problems finish a chapter.
//
// A check's saved key is its `id`, or its position among the checks that have no id. So a check
// added to a published chapter needs an id, or saved progress would slip. Homework keys are h0, h1…,
// so add new homework at the end. Every numeric answer is re-derived in research/verify_results.py
// (records "hb.<chapter>.<key>").
(function () {
  const PARTS = [
    { id: 'foundations', short: 'Foundations', title: 'Part 1 · Foundations', blurb: 'Fast arithmetic, the maths toolkit, counting, and the core of probability: everything later builds on this.', chapters: ['arith', 'toolkit', 'counting', 'prob-basics', 'conditional', 'expectation', 'variance'] },
    { id: 'probability', short: 'Interview probability', title: 'Part 2 · Interview probability', blurb: 'The techniques behind most interview puzzles: distributions, symmetry, recursion, Markov chains, random walks and optimal stopping.', chapters: ['distributions', 'symmetry', 'recursion', 'markov', 'walks', 'stopping', 'continuous'] },
    { id: 'statistics', short: 'Statistics', title: 'Part 3 · Statistics', blurb: 'From data to decisions: the CLT, estimation, testing, regression, correlation matrices and time series.', chapters: ['clt', 'estimation', 'testing', 'regression', 'matrix', 'timeseries'] },
    { id: 'trading', short: 'Trading', title: 'Part 4 · Trading', blurb: 'Turning probability into prices and bets: sizing, market making, options, estimation and game theory.', chapters: ['betting', 'market-making', 'options', 'fermi', 'games'] },
    { id: 'equities', short: 'Quant equities', title: 'Part 5 · Quant equities', blurb: 'How systematic equity desks think: factors, signals, backtests and costs.', chapters: ['factors', 'backtest'] },
    { id: 'craft', short: 'Interview craft', title: 'Part 6 · Interview craft', blurb: 'How to perform on the day: thinking aloud, speed, sanity checks and your own story.', chapters: ['craft'] },
  ];

  // Shorter paths through the course, for when the interview is close.
  const ROUTES = [
    { name: 'Two weeks to a quant equities phone screen', blurb: 'The chapters that matter most, in order. Do the checks and Core homework, then a mock.', chapters: ['prob-basics', 'conditional', 'expectation', 'variance', 'recursion', 'stopping', 'clt', 'testing', 'regression', 'matrix', 'betting', 'market-making', 'factors', 'backtest', 'craft'] },
    { name: 'One week to a market making interview', blurb: 'Speed and pricing first. Pair these with Make me a market and the arithmetic drills.', chapters: ['arith', 'conditional', 'expectation', 'recursion', 'betting', 'market-making', 'fermi', 'craft'] },
  ];

  const CHAPTERS = QT.hbChapters || {};
  const isCheck = (b) => !!b && typeof b === 'object' && b.q !== undefined && !b.worked;

  function checksOf(ch) {
    let i = 0;
    return ch.sections.flatMap((s) => s.blocks.filter(isCheck)).map((c) => ({ c, key: c.id || String(i++) }));
  }
  const homeworkOf = (ch) => (ch.homework || []).map((c, i) => ({ c, key: `h${i}` }));
  // A chapter's words, for search.
  const text = (ch) => [ch.goals.join(' '), ...ch.sections.map((s) => `${s.h} ${s.blocks.map((b) => (typeof b === 'string' ? b : [b.q, b.idea, b.trap, b.market, b.proof].filter(Boolean).join(' '))).join(' ')}`)].join(' ');

  QT.handbook = { PARTS: PARTS.map((p) => ({ ...p, chapters: p.chapters.filter((id) => CHAPTERS[id]) })).filter((p) => p.chapters.length), CHAPTERS, ROUTES: ROUTES.map((r) => ({ ...r, chapters: r.chapters.filter((id) => CHAPTERS[id]) })), checksOf, homeworkOf, text };
})();
