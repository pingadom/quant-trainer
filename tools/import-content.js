// Importer for question content written in the theo-content-v1 format (content/*.md).
//
//   node tools/import-content.js     parses content/*.md, reports errors, writes www/js/sse-content.js
//
// A question is a heading `### q-…` followed by `- **field:** value` lines; a field runs until the
// next field or heading, so `solution` can span lines. Fields: track, tags, difficulty,
// time_target_s, answer_type, prompt, hint_1, hint_2, answer, answer_numeric, tolerance, solution,
// tests. A missing answer_type means numeric, unless answer_numeric is empty, which means
// conceptual. Text is plain with a little Markdown (**bold**, *italic*, `code`, lists, code fences).
// parseContent also runs in the test suite, so this file has to load in a browser too.
(function (root) {
  const TRACKS = ['probability', 'expected-value', 'statistics-regression', 'equity-quant', 'market-making', 'mental-maths', 'fermi', 'python-drills', 'behavioural'];
  const TYPES = ['numeric', 'conceptual', 'code-task'];

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const emphasis = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  // One line of text: `code` is left alone, the rest gets bold and italic.
  const inline = (text) => esc(text).split(/(`[^`]+`)/).map((p, i) => (i % 2 ? `<code>${p.slice(1, -1)}</code>` : emphasis(p))).join('');

  // Paragraphs, numbered and bulleted lists, and code fences.
  function blocks(text) {
    const out = [], lines = text.split('\n');
    let list = null;
    const close = () => { if (list) out.push(`</${list}>`); list = null; };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('```')) {
        close();
        const code = [];
        for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) code.push(lines[i]);
        out.push(`<pre class="code-view" tabindex="0">${esc(code.join('\n'))}</pre>`);
        continue;
      }
      const item = line.match(/^(\d+\.|-)\s+(.*)$/);
      if (item) {
        const kind = item[1] === '-' ? 'ul' : 'ol';
        if (list !== kind) { close(); out.push(`<${kind}>`); list = kind; }
        out.push(`<li>${inline(item[2])}</li>`);
      } else {
        close();
        if (line) out.push(`<p>${inline(line)}</p>`);
      }
    }
    close();
    return out.join('');
  }

  // Text → { questions, errors }. Errors name the question and the problem; nothing throws.
  function parseContent(text, file = 'content') {
    const raw = [], errors = [];
    let cur = null, field = null;
    for (const line of String(text).replace(/\r\n/g, '\n').split('\n')) {
      const head = line.match(/^### (q-[a-z0-9-]+)\s*$/);
      if (head) {
        cur = { id: head[1], fields: {} };
        raw.push(cur);
        field = null;
      } else if (/^#{1,3} /.test(line) || /^---\s*$/.test(line)) {
        cur = null;
      } else if (cur) {
        const m = line.match(/^- \*\*([a-z0-9_]+):\*\*\s*(.*)$/);
        if (m) {
          field = m[1];
          cur.fields[field] = m[2];
        } else if (field) cur.fields[field] += `\n${line.replace(/^ {2}/, '')}`;
      }
    }
    const seen = new Set(), questions = [];
    for (const { id, fields } of raw) {
      const bad = (msg) => errors.push(`${file}: ${id}: ${msg}`), before = errors.length;
      const f = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]));
      if (seen.has(id)) bad('duplicate id');
      seen.add(id);
      if (!TRACKS.includes(f.track)) bad(`unknown track "${f.track ?? ''}"`);
      const tags = (f.tags || '').replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);
      if (!tags.length) bad('no tags');
      if (tags.some((t) => !/^[a-z0-9-]+$/.test(t))) bad(`bad tag in "${f.tags}"`);
      // The older module's behavioural prompts have no difficulty, time or answer.
      const prompts = f.track === 'behavioural';
      const difficulty = f.difficulty ? Number(f.difficulty) : prompts ? 2 : NaN, time = f.time_target_s ? Number(f.time_target_s) : prompts ? 120 : NaN;
      if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) bad(`difficulty "${f.difficulty ?? ''}" is not 1 to 5`);
      if (!(time > 0)) bad(`time_target_s "${f.time_target_s ?? ''}" is not a positive number`);
      const type = f.answer_type || (f.answer_numeric ? 'numeric' : 'conceptual');
      if (!TYPES.includes(type)) bad(`unknown answer_type "${type}"`);
      if (!f.prompt) bad('no prompt');
      if (!f.solution) bad('no solution');
      const answer = (f.answer || (prompts ? 'Self-graded' : '')).replace(/^"(.*)"$/, '$1');
      if (!answer) bad('no answer');
      const q = { id, track: f.track, tags, difficulty, time, type, prompt: inline(f.prompt || ''), hints: [f.hint_1, f.hint_2].filter(Boolean).map(inline), answer: inline(answer), percent: /%/.test(answer), solution: blocks(f.solution || '') };
      if (type === 'numeric') {
        q.value = Number(f.answer_numeric);
        if (!f.answer_numeric || !Number.isFinite(q.value)) bad(`answer_numeric "${f.answer_numeric ?? ''}" is not a number`);
        const log = (f.tolerance || '').replace(/"/g, '').match(/^log10 error ≤ ([\d.]+)$/);
        if (log) q.logTol = Number(log[1]);
        else {
          q.tol = Number(f.tolerance);
          if (f.tolerance === undefined || f.tolerance === '' || !(q.tol >= 0)) bad(`tolerance "${f.tolerance ?? ''}" is not a number`);
        }
      }
      if (type === 'code-task') {
        if (!f.tests) bad('code-task with no tests');
        q.tests = f.tests;
      }
      if (errors.length === before) questions.push(q);
    }
    return { questions, errors };
  }

  // The generated data file, one question per line.
  const generate = (questions) => `// Generated by tools/import-content.js from content/*.md. Edit those files, then run it again.
QT.sseContent = [
${questions.map((q) => `  ${JSON.stringify(q)},`).join('\n')}
];
`;

  root.parseContent = parseContent;
  root.generateContent = generate;
  root.CONTENT_TRACKS = TRACKS;

  if (typeof module !== 'undefined' && typeof require === 'function' && require.main === module) {
    const fs = require('fs'), path = require('path');
    const base = path.join(__dirname, '..'), dir = path.join(base, 'content');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
    const questions = [], errors = [];
    for (const f of files) {
      const r = parseContent(fs.readFileSync(path.join(dir, f), 'utf8'), f);
      questions.push(...r.questions);
      errors.push(...r.errors);
    }
    const ids = questions.map((q) => q.id);
    ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => errors.push(`${id}: in more than one file`));
    const byTrack = TRACKS.map((t) => `${t} ${questions.filter((q) => q.track === t).length}`).join(', ');
    console.log(`${questions.length} questions from ${files.length} files: ${byTrack}`);
    console.log(`${errors.length} parse errors`);
    errors.forEach((e) => console.log(`  ${e}`));
    if (errors.length) process.exit(1);
    fs.writeFileSync(path.join(base, 'www/js/sse-content.js'), generate(questions));
  }
})(typeof window !== 'undefined' ? window : globalThis);
