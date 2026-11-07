// Question library: a large general bank alongside the firm-reported interview questions. Each
// question is a puzzle collected in an open repository (linked on the question), rewritten in our
// own words with our own hints and worked solution, and tagged with a topic and a difficulty. None
// is attributed to a firm. Every numeric answer is re-derived independently in
// research/verify_library.py, and CI fails if one is missing or disagrees.
//
// Content files call QT.library.add(source, entries). An entry is
//   [id, category, level ('e' | 'm' | 'h'), title, question html, parts]
// where each part is { q, a, tol?, sim?, h: [hints…], s: [key idea, [steps…], check, trap] },
// or, for an open-ended question, { open: model answer html, h: [hints…] } in place of parts.
(function () {
  const SOURCES = {
    bs: ['BrainStellar', 'https://github.com/rudradesai200/BrainStellar'],
    ep: ['EigenPrep', 'https://github.com/CUQuants/eigen-prep'],
    xy: ['Quant interview notes', 'https://github.com/XiaodongYangQF/quant-interview-notes'],
    ah: ['Quant interview question bank', 'https://github.com/andyhu4023/Quant-Interview-Question-Bank'],
    qf: ['QFin UWA', 'https://github.com/QFinUWA/InterviewQuestions'],
  };
  const LEVEL = { e: 'Easy', m: 'Medium', h: 'Hard' };

  QT.firms.library = {
    name: 'Question library',
    process: [
      'A large general bank of probability, statistics, brainteaser, game-theory, finance and stochastic-calculus questions, not tied to any one firm. Each one comes from an open collection of interview puzzles, rewritten in our own words with our own hints and a worked solution. Filter by topic and difficulty, and use it for volume once you have worked through the firm-reported questions.',
    ],
    sources: Object.values(SOURCES).map(([name, url]) => [name, url]),
  };

  // Questions with only two hints get a third that is about checking or structuring the answer.
  const CHECK = `Before you commit, sanity-check: try a tiny case, or bound the answer roughly from above and below.`;
  const STRUCTURE = `Answer in four beats: the definition, the intuition, a quick example, and one caveat or limitation.`;
  const topUp = (h, extra) => (h && h.length >= 3 ? h : [...(h || []), extra]);

  function add(src, entries) {
    const [name, url] = SOURCES[src];
    for (const [id, cat, lvl, title, q, body] of entries) {
      const b = { id: `${src}-${id}`, firm: 'library', role: LEVEL[lvl], stage: name, cat, kind: 'guide', title, src: [`${name}: ${title}`, url], q };
      if (Array.isArray(body)) {
        b.parts = body.map(({ q: pq, a, tol, sim, h, s }) => ({ q: pq, a, ...(tol ? { tol } : {}), ...(sim ? { sim } : {}), h: topUp(h, CHECK), s, sol: '' }));
      } else {
        b.open = { model: body.open, h: topUp(body.h, STRUCTURE) };
      }
      QT.bank.push(b);
    }
  }

  QT.library = { add, SOURCES, LEVEL };
})();
