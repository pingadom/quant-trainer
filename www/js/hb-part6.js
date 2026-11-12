// Handbook: linear algebra (Part 1), and Brownian motion and stochastic calculus (Part 4).
// See handbook-content.js for how chapters are structured.
(function () {
  // Seeded standard normals, so the pictures are the same on every load.
  const normals = (n, seed) => {
    let s = seed;
    const u = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    return Array.from({ length: n }, () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u()));
  };
  const path = (n, T, seed) => {
    const z = normals(n, seed), dt = T / n, pts = [[0, 0]];
    z.forEach((x, i) => pts.push([(i + 1) * dt, pts[i][1] + x * Math.sqrt(dt)]));
    return pts;
  };
  // Σ(ΔW)² over [0, 1] for n steps, from one long seeded path, to show it settling on 1.
  const qv = [10, 20, 50, 100, 200, 500, 1000, 2000].map((n) => [Math.log10(n), normals(n, 77).reduce((a, x) => a + (x * x) / n, 0)]);
  const ellipse = Array.from({ length: 73 }, (_, i) => { const t = (i * Math.PI) / 36, c = Math.cos(t), s = Math.sin(t); return [2 * c + s, c + 2 * s]; });
  const circle = Array.from({ length: 73 }, (_, i) => [Math.cos((i * Math.PI) / 36), Math.sin((i * Math.PI) / 36)]);
  // The reflection picture: a path, a level it reaches, and its mirror image after the first touch.
  const REFL = (() => {
    const p = path(300, 1, 3), top = Math.max(...p.map(([, w]) => w)), a = Math.round(top * 6) / 10, i = p.findIndex(([, w]) => w >= a);
    return { a, series: [{ pts: p }, { pts: p.slice(i).map(([t, w]) => [t, 2 * a - w]), tone: 'bad', dash: true }] };
  })();
  const gbm = (seed, mu, sig) => path(250, 5, seed).map(([t, w]) => [t, Math.exp((mu - (sig * sig) / 2) * t + sig * w)]);

  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    linalg: {
      title: 'Linear algebra', minutes: 60,
      why: 'Portfolios are vectors, risk models are matrices, regression is a projection, and PCA is an eigenvector problem. A little linear algebra makes all of these one idea, and interviewers expect you to handle a 2×2 matrix quickly.',
      goals: ['Work with vectors: length, dot product, angle and projection', 'Read a matrix as a transformation, and multiply matrices', 'Use determinants and inverses to solve linear systems', 'Find eigenvalues and eigenvectors of a 2×2 matrix', 'Explain symmetric and positive semi-definite matrices, least squares and the Cholesky factor'],
      prereq: ['toolkit'],
      sections: [
        { h: 'Vectors', blocks: [
          `<p>A vector is a list of numbers, or an arrow from the origin. Its <b>length</b> is ‖v‖ = √(v₁² + v₂² + …). The <b>dot product</b> multiplies matching entries and adds:</p>
           <div class="hb-eq">a · b = a₁b₁ + a₂b₂ + … = ‖a‖ ‖b‖ cos θ</div>
           <p>So the dot product measures how much two vectors point the same way. If it's zero they're <b>orthogonal</b> (at right angles). The <b>projection</b> of b onto a is the shadow b casts on a's line: (a · b/‖a‖²) a.</p>`,
          { fig: 'plot', x: [-0.5, 3.6], y: [-0.5, 2.6], w: 340, h: 250, xt: [0, 1, 2, 3], yt: [0, 1, 2], series: [{ pts: [[0, 0], [3, 1]], tone: 'acc' }, { pts: [[0, 0], [1, 2]], tone: 'ok' }, { pts: [[0, 0], [1.5, 0.5]], tone: 'bad' }], segs: [[1, 2, 1.5, 0.5, 'muted']], pts: [{ x: 3, y: 1 }, { x: 1, y: 2, tone: 'ok' }, { x: 1.5, y: 0.5, tone: 'bad' }], labels: [{ x: 3.05, y: 1.15, t: 'a = (3, 1)', tone: 'acc' }, { x: 1.08, y: 2.2, t: 'b = (1, 2)', tone: 'ok' }, { x: 1.55, y: 0.18, t: 'projection of b on a', tone: 'bad' }], alt: 'Vectors a equals 3, 1 and b equals 1, 2, with the projection of b onto a and a dotted line at right angles.', cap: 'a · b = 3 + 2 = 5 and ‖a‖² = 10, so the projection is ½a = (1.5, 0.5). The dotted line from b meets a at a right angle.' },
          { q: 'What is the length of (3, 4)?', a: 5, hint: '√(9 + 16).', sol: '<b>5</b>.' },
          { q: 'What is (1, 2, 3) · (4, 5, 6)?', a: 32, hint: 'Multiply matching entries, then add.', sol: '4 + 10 + 18 = <b>32</b>.' },
          { q: 'What is the cosine of the angle between (1, 0) and (1, 1)? Give 3 decimal places.', a: Math.SQRT1_2, tol: { abs: 0.002 }, hint: 'a · b/(‖a‖ ‖b‖).', sol: '1/(1 × √2) ≈ <b>0.707</b>: a 45° angle.' },
          { idea: 'Correlation is a cosine. Centre two return series (subtract their means) and treat them as long vectors: their correlation is the cosine of the angle between them. Uncorrelated means orthogonal, which is why the correlation bounds in the correlation matrices chapter are about angles.' },
          { id: 'm1', q: 'Two centred return series are orthogonal as vectors. What is their correlation?', opts: [['0'], ['1', 'That would be the same direction.'], ['−1', 'That would be opposite directions.'], ['It depends on their lengths', 'Correlation is scaled by the lengths, so it can\'t.']], sol: 'cos 90° = 0. Lengths are volatilities, and correlation divides them out.' },
        ] },
        { h: 'Matrices are transformations', blocks: [
          `<p>A matrix turns a vector into another vector. The trick to reading one: <b>its columns are where the basis vectors go</b>. For A = [2 1; 0.5 1.5], the vector (1, 0) lands on the first column, (2, 0.5), and (0, 1) lands on (1, 1.5). Everything else follows by adding and scaling.</p>
           <div class="hb-eq">[a b; c d] (x, y) = (ax + by, cx + dy)</div>`,
          { fig: 'plot', x: [-0.3, 3.3], y: [-0.3, 2.3], w: 340, h: 240, xt: [0, 1, 2, 3], yt: [0, 1, 2], polys: [{ pts: [[0, 0], [2, 0.5], [3, 2], [1, 1.5]], tone: 'ok-soft' }, { pts: [[0, 0], [1, 0], [1, 1], [0, 1]], tone: 'acc-soft' }], series: [{ pts: [[0, 0], [2, 0.5]], tone: 'ok' }, { pts: [[0, 0], [1, 1.5]], tone: 'ok' }], labels: [{ x: 0.05, y: 0.88, t: 'unit square' }, { x: 1.8, y: 1.15, t: 'its image', tone: 'ok' }, { x: 2.05, y: 0.35, t: 'column 1' }, { x: 0.35, y: 1.75, t: 'column 2' }], alt: 'The unit square and its image, a parallelogram whose sides are the matrix columns.', cap: 'A sends the unit square to the parallelogram spanned by its columns. Its area, 2 × 1.5 − 1 × 0.5 = 2.5, is the determinant.' },
          { widget: 'linmap' },
          `<p><b>Multiplying matrices</b> means doing one transformation, then another. Entry (i, j) of AB is row i of A dotted with column j of B. The order matters: AB means "do B first, then A", and in general AB ≠ BA.</p>`,
          { q: 'What is the second entry of [1 2; 3 4] (1, 1)?', a: 7, hint: 'Row 2 dotted with (1, 1).', sol: '3 + 4 = <b>7</b>.' },
          { q: 'A = [1 2; 3 4] and B = [0 1; 1 0]. What is the top-left entry of AB?', a: 2, hint: 'Row 1 of A dotted with column 1 of B.', sol: '1 × 0 + 2 × 1 = <b>2</b>. (AB swaps A\'s columns: [2 1; 4 3].)' },
          { id: 'm2', q: 'Is AB always equal to BA for square matrices?', opts: [['No: order matters'], ['Yes, just like multiplying numbers', 'Try A = [1 2; 3 4] and B = [0 1; 1 0].'], ['Only for 2×2 matrices', 'Size doesn\'t make it commute.'], ['Yes, if both have inverses', 'Rotations and shears are invertible, and they don\'t commute.']], sol: 'Rotate then stretch isn\'t the same as stretch then rotate. With B = [0 1; 1 0], AB swaps A\'s columns, while BA swaps its rows.' },
        ] },
        { h: 'Determinants and inverses', blocks: [
          `<p>The <b>determinant</b> is the factor by which a matrix scales area (or volume), with a sign for flips. For a 2×2 it's ad − bc. If it's zero, the matrix squashes the plane flat onto a line, and can't be undone.</p>
           <p>Otherwise the <b>inverse</b> undoes it:</p>
           <div class="hb-eq">[a b; c d]⁻¹ = (1/(ad − bc)) [d −b; −c a]</div>
           <p>Useful rules: det(AB) = det(A) det(B), and det(A⁻¹) = 1/det(A).</p>`,
          { worked: 'a linear system', q: 'Solve 2x + y = 5 and x + 3y = 10.', steps: [
            ['Write it as A(x, y) = b. What are A and b?', 'A = [2 1; 1 3], b = (5, 10).'],
            ['What is det A?', '2 × 3 − 1 × 1 = 5. It isn\'t zero, so there\'s exactly one solution.'],
            ['Write down A⁻¹.', '(1/5)[3 −1; −1 2].'],
            'Multiply: x = (3 × 5 − 10)/5 = 1, and y = (−5 + 2 × 10)/5 = 3. Check: 2 + 3 = 5 ✓, 1 + 9 = 10 ✓.',
          ] },
          { q: 'What is the determinant of [3 1; 2 4]?', a: 10, hint: 'ad − bc.', sol: '12 − 2 = <b>10</b>.' },
          { q: 'What is the determinant of [2 4; 1 2]?', a: 0, hint: 'ad − bc.', sol: '4 − 4 = <b>0</b>: the second column is twice the first, so the plane is squashed onto a line.' },
          { q: 'Solve x + y = 5, x − y = 1. What is x?', a: 3, hint: 'Add the equations.', sol: '2x = 6, so <b>x = 3</b> (and y = 2).' },
          { q: 'det A = 2 and det B = 3. What is det(AB)?', a: 6, hint: 'Area scalings multiply.', sol: '<b>6</b>.' },
        ] },
        { h: 'Rank and least squares', blocks: [
          `<p>The <b>rank</b> of a matrix is the number of independent directions its columns span. A square matrix with full rank has an inverse; one with a column that's a combination of others doesn't.</p>
           <p>With more equations than unknowns (more data points than parameters), there's usually no exact solution to Xβ = y. <b>Least squares</b> finds the β that makes Xβ as close as possible to y: the projection of y onto the space spanned by X's columns. The leftover error is at right angles to that space, so Xᵀ(y − Xβ) = 0, which gives the <b>normal equations</b>:</p>
           <div class="hb-eq">XᵀX β = Xᵀy &nbsp;&nbsp; β = (XᵀX)⁻¹ Xᵀy</div>`,
          { fig: 'plot', x: [-0.2, 3.4], y: [-0.2, 2.4], w: 320, h: 230, polys: [{ pts: [[0, 0], [3.3, 0], [3.3, 0.9], [0, 0.9]], tone: 'acc-soft' }], series: [{ pts: [[0, 0], [2.4, 2]], tone: 'ok' }, { pts: [[0, 0], [2.4, 0]], tone: 'acc' }], segs: [[2.4, 2, 2.4, 0, 'bad']], labels: [{ x: 2.48, y: 2.05, t: 'y', tone: 'ok' }, { x: 1.2, y: 0.45, t: 'the space of Xβ', a: 'middle' }, { x: 2.46, y: 1, t: 'residual ⟂', tone: 'bad' }, { x: 1.3, y: -0.15, t: 'Xβ̂', tone: 'acc' }], alt: 'A vector y, its projection onto a flat region, and the residual at a right angle.', cap: 'Least squares drops a perpendicular from y to everything Xβ can reach. The residual is at right angles to every column of X.' },
          { worked: 'regression by matrices', q: 'Fit y = a + bx to the points (0, 1), (1, 2), (2, 4) with the normal equations.', steps: [
            ['Write X and y.', 'X has a column of ones and a column of x: rows (1, 0), (1, 1), (1, 2). y = (1, 2, 4).'],
            ['Compute XᵀX and Xᵀy.', 'XᵀX = [3 3; 3 5] (counts, sums of x, sums of x²). Xᵀy = (7, 10).'],
            ['Invert XᵀX.', 'det = 15 − 9 = 6, so (XᵀX)⁻¹ = (1/6)[5 −3; −3 3].'],
            'β = (1/6)(5 × 7 − 3 × 10, −3 × 7 + 3 × 10) = (5/6, 3/2). The same line as in the regression chapter\'s homework, found a second way.',
          ] },
          { q: 'What is the rank of [1 2; 2 4]?', a: 1, hint: 'Is the second column a multiple of the first?', sol: 'Column 2 = 2 × column 1, so <b>1</b>.' },
          { q: 'X has rows (1, 0), (1, 1), (1, 2). What is the bottom-right entry of XᵀX?', a: 5, hint: 'The sum of the squares of the second column.', sol: '0 + 1 + 4 = <b>5</b>.' },
          { id: 'm3', q: 'A regression has two identical columns. What goes wrong in the matrix maths?', opts: [['XᵀX has no inverse, so β isn\'t unique'], ['Xᵀy becomes zero', 'It doesn\'t.'], ['The residual is no longer at right angles', 'The projection still exists.'], ['Nothing at all', 'Check whether the columns are independent.']], sol: 'The columns are dependent, so XᵀX is singular. The fitted values are still the unique projection, but many β produce them.' },
        ] },
        { h: 'Eigenvalues and eigenvectors', blocks: [
          `<p>Most vectors change direction when a matrix acts on them. An <b>eigenvector</b> doesn't: A v = λ v, so it's only stretched, by its <b>eigenvalue</b> λ. To find them, solve det(A − λI) = 0. For a 2×2 matrix that's a quadratic:</p>
           <div class="hb-eq">λ² − (trace) λ + det = 0 &nbsp;&nbsp; trace = sum of the λ's &nbsp;&nbsp; det = product of the λ's</div>`,
          { worked: 'a symmetric 2×2', q: 'Find the eigenvalues and eigenvectors of [2 1; 1 2].', steps: [
            ['What are the trace and determinant?', 'Trace 4, determinant 3.'],
            ['Solve λ² − 4λ + 3 = 0.', 'λ = 3 or λ = 1.'],
            ['For λ = 3, solve (A − 3I)v = 0.', '[−1 1; 1 −1]v = 0, so v = (1, 1).'],
            ['And for λ = 1?', '[1 1; 1 1]v = 0, so v = (1, −1). The two eigenvectors are at right angles: that always happens for symmetric matrices.'],
          ] },
          { fig: 'plot', x: [-3.4, 3.4], y: [-3.4, 3.4], w: 300, h: 290, xt: [-2, 0, 2], yt: [-2, 0, 2], series: [{ pts: circle, tone: 'muted' }, { pts: ellipse, tone: 'acc' }, { pts: [[-2.12, -2.12], [2.12, 2.12]], tone: 'ok' }, { pts: [[-0.71, 0.71], [0.71, -0.71]], tone: 'bad' }], labels: [{ x: -3.3, y: 3.05, t: 'λ = 3 along (1, 1)', tone: 'ok' }, { x: 0.2, y: -1.4, t: 'λ = 1 along (1, −1)', tone: 'bad' }, { x: -3.3, y: -3.1, t: 'grey: the unit circle' }], alt: 'The unit circle and its image under the matrix 2 1 1 2, an ellipse with long axis along 1, 1 and short axis along 1, minus 1.', cap: '[2 1; 1 2] turns the unit circle into an ellipse. Its axes are the eigenvectors, and their half-lengths are the eigenvalues, 3 and 1.' },
          { q: 'What is the largest eigenvalue of [4 1; 2 3]?', a: 5, hint: 'λ² − 7λ + 10 = 0.', sol: '(λ − 5)(λ − 2) = 0, so <b>5</b>.' },
          { q: 'What is the product of the eigenvalues of [5 2; 2 2]?', a: 6, hint: 'The product is the determinant.', sol: '10 − 4 = <b>6</b>. (They\'re 6 and 1.)' },
          `<p>Eigenvectors make powers easy: if Av = λv, then Aⁿv = λⁿv. That's why a Markov chain settles down. Its transition matrix has eigenvalue 1, whose eigenvector is the stationary distribution, and every other eigenvalue is smaller, so its part dies away like λⁿ.</p>`,
          { q: 'The weather chain moves sun → rain with probability 0.2 and rain → sun with 0.4, so its matrix is [0.8 0.2; 0.4 0.6]. One eigenvalue is 1. What is the other?', a: 0.4, hint: 'The eigenvalues add up to the trace.', sol: '1.4 − 1 = <b>0.4</b>. So a gap from the long-run mix shrinks by 60% each day.' },
          { id: 'm4', q: 'A matrix has an eigenvalue of 0. What follows?', opts: [['It\'s singular: some direction is squashed to zero'], ['It\'s the identity matrix', 'The identity has every eigenvalue equal to 1.'], ['Its trace is zero', 'The trace is the sum, not the product.'], ['It has an inverse', 'A zero eigenvalue rules that out.']], sol: 'Av = 0 for a nonzero v, so the determinant (the product of the eigenvalues) is 0, and A can\'t be inverted.' },
        ] },
        { h: 'Symmetric and positive semi-definite matrices', blocks: [
          `<p>Covariance and correlation matrices are <b>symmetric</b>. Symmetric matrices have real eigenvalues and orthogonal eigenvectors, so they can be written as Σ = Q Λ Qᵀ: rotate, stretch along the axes, rotate back. This is what PCA uses.</p>
           <p>A symmetric matrix is <b>positive semi-definite</b> (PSD) if xᵀΣx ≥ 0 for every x, which is the same as all its eigenvalues being ≥ 0. Every covariance matrix is PSD, because xᵀΣx is the variance of a portfolio.</p>
           <p>To simulate correlated normals, factor Σ = LLᵀ with L lower-triangular (the <b>Cholesky</b> factor). If z holds independent standard normals, then x = Lz has covariance Σ. For two variables with correlation ρ:</p>
           <div class="hb-eq">x₁ = z₁ &nbsp;&nbsp; x₂ = ρ z₁ + √(1 − ρ²) z₂</div>`,
          { q: 'What is the smallest eigenvalue of [1 2; 2 1]?', a: -1, hint: 'Trace 2, determinant −3.', sol: 'λ² − 2λ − 3 = 0, so 3 and <b>−1</b>. A negative eigenvalue means it can\'t be a covariance matrix.' },
          { q: 'You simulate two normals with correlation 0.6 using x₂ = 0.6 z₁ + c z₂. What is c?', a: 0.8, hint: '√(1 − ρ²).', sol: '√(1 − 0.36) = <b>0.8</b>.' },
          { market: 'Risk systems run on these facts. Portfolio variance is wᵀΣw. Factor models and PCA are eigen-decompositions. Monte Carlo risk uses the Cholesky factor to draw correlated scenarios, and it fails if an estimated matrix isn\'t PSD.' },
        ] },
      ],
      takeaways: ['a · b = ‖a‖ ‖b‖ cos θ; correlation is a cosine.', 'A matrix\'s columns are where the basis vectors go; AB means B first, then A.', 'det = area scaling; det = 0 means no inverse.', '[a b; c d]⁻¹ = (1/(ad − bc))[d −b; −c a].', 'Least squares: XᵀXβ = Xᵀy, a projection.', '2×2 eigenvalues: λ² − trace λ + det = 0.', 'Symmetric: real eigenvalues, orthogonal eigenvectors. PSD: all ≥ 0.', 'Cholesky: x₂ = ρz₁ + √(1 − ρ²)z₂.'],
      explain: { q: 'What is an eigenvector, and why do Markov chains and PCA both care about them?', a: 'A direction the matrix only stretches, by its eigenvalue. Applying the matrix again and again multiplies each eigen-direction by λ each time, so the largest |λ| dominates: for a Markov chain, the eigenvalue-1 direction is the long-run distribution, and the others fade. For a covariance matrix, eigenvectors are the directions of the most variance, which is what PCA reports.' },
      homework: [
        { lvl: 'core', q: 'What is the length of (1, 2, 2)?', a: 3, hint: '√(1 + 4 + 4).', sol: '<p><b>Approach:</b> length = √(sum of squared entries).</p><ol><li>1² + 2² + 2² = 1 + 4 + 4 = 9.</li><li>√9 = <b>3</b>.</li></ol><p>It\'s Pythagoras twice: (1, 2) has length √5 in the plane, and adding the third side 2 gives √(5 + 4) = 3. In risk terms, the length of a vector of independent volatilities is the total volatility.</p>' },
        { lvl: 'core', q: 'What is the top-right entry of the inverse of [2 1; 5 3]?', a: -1, hint: 'The determinant is 1.', sol: '<p><b>Approach:</b> for a 2×2 matrix [a b; c d], the inverse is (1/det)[d −b; −c a].</p><ol><li>det = 2 × 3 − 1 × 5 = 1.</li><li>Swap the diagonal and negate the off-diagonal: [3 −1; −5 2], divided by 1.</li><li>Top-right entry: <b>−1</b>.</li></ol><p><b>Check:</b> [2 1; 5 3] × [3 −1; −5 2] = [6 − 5, −2 + 2; 15 − 15, −5 + 6] = the identity ✓.</p>' },
        { lvl: 'core', q: 'Solve 3x + 2y = 12 and x − y = −1. What is y?', a: 3, hint: 'From the second, x = y − 1.', sol: '<p><b>Approach:</b> substitute the simpler equation into the other.</p><ol><li>From x − y = −1: x = y − 1.</li><li>Substitute: 3(y − 1) + 2y = 12 ⇒ 5y − 3 = 12 ⇒ y = <b>3</b>.</li><li>Then x = 2.</li></ol><p><b>Check:</b> 3 × 2 + 2 × 3 = 12 ✓ and 2 − 3 = −1 ✓. (As a matrix: [3 2; 1 −1] has determinant −5, so the inverse exists and the solution is unique.)</p>' },
        { lvl: 'core', q: 'What is the largest eigenvalue of [6 2; 2 3]?', a: 7, hint: 'Trace 9, determinant 14.', sol: '<p><b>Approach:</b> for a 2×2 matrix, eigenvalues solve λ² − (trace)λ + det = 0.</p><ol><li>Trace = 6 + 3 = 9. Determinant = 18 − 4 = 14.</li><li>λ² − 9λ + 14 = (λ − 7)(λ − 2) = 0, so λ = 7 or 2. The largest is <b>7</b>.</li></ol><p><b>Check:</b> the eigenvalues add to the trace (7 + 2 = 9) and multiply to the determinant (14) ✓. The eigenvector for 7 is (2, 1): [6 2; 2 3](2, 1) = (14, 7) = 7(2, 1).</p>' },
        { lvl: 'core', q: 'What is the determinant of the triangular matrix [2 0 0; 1 3 0; 4 5 1]?', a: 6, hint: 'For a triangular matrix, multiply the diagonal.', sol: '<p><b>Approach:</b> a triangular matrix\'s determinant is the product of its diagonal.</p><ol><li>2 × 3 × 1 = <b>6</b>.</li></ol><p><b>Why:</b> expanding along the first row, only the top-left entry has non-zero cofactor, and the same happens again in the smaller matrix. The eigenvalues of a triangular matrix are its diagonal entries too.</p>' },
        { lvl: 'interview', q: 'Three assets all have pairwise correlation 0.5. What is the largest eigenvalue of their correlation matrix?', a: 2, hint: 'Try the vector (1, 1, 1).', sol: '<p><b>Approach:</b> guess the eigenvector that treats all assets alike.</p><ol><li>The matrix is [1 .5 .5; .5 1 .5; .5 .5 1]. Each row sums to 2, so it maps (1, 1, 1) to (2, 2, 2): eigenvalue <b>2</b>.</li><li>The eigenvalues add to the trace, 3, so the other two add to 1. Any vector whose entries sum to 0, such as (1, −1, 0), is mapped to 0.5 times itself, so both are 0.5.</li></ol><p><b>Interpretation:</b> the "market" direction (all assets together) explains 2/3 of the total variance. For n assets with common correlation ρ, the top eigenvalue is 1 + (n − 1)ρ: with many assets one factor dominates, which is what PCA finds in real equity markets.</p>' },
        { lvl: 'interview', q: 'A two-state chain switches state with probability 0.1 each step. Its second eigenvalue is 0.8. How many steps does it take for a gap from the long-run mix to halve? Give 2 decimal places.', a: Math.log(0.5) / Math.log(0.8), tol: { abs: 0.02 }, hint: '0.8ⁿ = ½.', sol: '<p><b>Approach:</b> the gap from the long-run mix shrinks by the second eigenvalue each step.</p><ol><li>After n steps the gap is 0.8ⁿ times its start. Set 0.8ⁿ = ½.</li><li>n = ln ½/ln 0.8 = (−0.693)/(−0.223) ≈ <b>3.11</b> steps.</li></ol><p><b>Where 0.8 comes from:</b> the transition matrix [0.9 0.1; 0.1 0.9] has eigenvalues 1 (the long-run mix) and 0.9 − 0.1 = 0.8. The closer the second eigenvalue is to 1, the slower the chain forgets where it started.</p>' },
        { lvl: 'interview', q: 'To simulate two normals with correlation −0.5, x₂ = −0.5 z₁ + c z₂. What is c? Give 3 decimal places.', a: Math.sqrt(0.75), tol: { abs: 0.002 }, hint: '√(1 − ρ²).', sol: '<p><b>Approach:</b> choose c so that x₂ has variance 1; the −0.5 then sets the correlation.</p><ol><li>With independent standard normals z₁, z₂: Var(x₂) = 0.25 + c² must be 1, so c² = 0.75.</li><li>c = √0.75 ≈ <b>0.866</b>.</li><li>Check the correlation with x₁ = z₁: Cov(z₁, −0.5z₁ + cz₂) = −0.5, and both variances are 1, so ρ = −0.5 ✓.</li></ol><p>This is the 2×2 Cholesky factor: x = Lz with L = [1 0; ρ √(1 − ρ²)].</p>' },
        { lvl: 'stretch', q: 'Prove that eigenvectors of a symmetric matrix with different eigenvalues are orthogonal.', sol: 'Let Au = λu and Av = μv with λ ≠ μ. Then λ(u · v) = (Au) · v = u · (Aᵀv) = u · (Av) = μ(u · v), using A = Aᵀ. So (λ − μ)(u · v) = 0, and u · v = 0.' },
        { lvl: 'lab', q: 'In Python, make a random 4×4 covariance matrix with <code>A = np.random.randn(4, 4); S = A @ A.T</code>. Check that <code>np.linalg.eigh(S)</code> gives non-negative eigenvalues that sum to <code>np.trace(S)</code> and multiply to <code>np.linalg.det(S)</code>. Then compute <code>np.linalg.cholesky(S)</code> and check L @ L.T.', sol: 'A Aᵀ is always PSD, since xᵀAAᵀx = ‖Aᵀx‖² ≥ 0. The trace and determinant identities hold to rounding error, and the Cholesky factor reproduces S.' },
      ],
      practice: [['PCA question', '#/sse/all/any/pca'], ['Correlation bounds', '#/sse/all/any/correlation-matrix'], ['Formula cards', '#/flashcards']],
    },

    brownian: {
      title: 'Brownian motion', minutes: 55,
      why: 'Shrink the random walk\'s steps and speed them up, and you get Brownian motion: the basic model for anything that wiggles continuously, from prices to P&L. It explains why risk grows with √time, and it\'s the foundation for stochastic calculus and option pricing.',
      goals: ['Build Brownian motion as the limit of a random walk, and state its defining properties', 'Compute probabilities, variances and covariances for W(t)', 'Explain quadratic variation, and why the paths have no derivative', 'Use scaling, the reflection principle and martingales for maxima and hitting problems'],
      prereq: ['walks', 'continuous', 'clt'],
      sections: [
        { h: 'From random walk to Brownian motion', blocks: [
          `<p>Take a fair random walk, but make each step tiny: every Δt, move up or down by √Δt. By time t you've taken t/Δt steps, each with variance Δt, so the total has variance t, whatever Δt is. Let Δt shrink to zero, and by the CLT the position at time t becomes normal. The limit is <b>Brownian motion</b> W(t), also called a Wiener process. It has:</p>
           <ul><li>W(0) = 0;</li><li><b>independent increments</b>: what happens after time s doesn't depend on the path before it;</li><li><b>normal increments</b>: W(t) − W(s) ~ Normal(0, t − s);</li><li>continuous paths.</li></ul>`,
          { fig: 'plot', x: [0, 1], y: [-2.6, 2.6], h: 240, xl: 'time', xt: [0, 0.5, 1], yt: [-2, -1, 0, 1, 2], fns: [{ f: (t) => 2 * Math.sqrt(t), tone: 'muted', dash: true }, { f: (t) => -2 * Math.sqrt(t), tone: 'muted', dash: true }, { f: (t) => Math.sqrt(t), tone: 'ink', dash: true }, { f: (t) => -Math.sqrt(t), tone: 'ink', dash: true }], series: [{ pts: path(400, 1, 11) }, { pts: path(400, 1, 23), tone: 'ok' }, { pts: path(400, 1, 47), tone: 'bad' }], labels: [{ x: 0.72, y: 2.2, t: '±2√t' }, { x: 0.76, y: 1.12, t: '±√t' }], alt: 'Three Brownian paths over one unit of time inside a fan of plus or minus root t and plus or minus two root t.', cap: 'Three paths. The spread grows like √t: about two thirds of paths stay inside ±√t at any time, and 95% inside ±2√t.' },
          { widget: 'brownian', predict: { q: 'You make the steps 100 times smaller (and take 100 times as many). How does the spread of W(1) change?', opts: ['It stays the same', 'It gets 10 times smaller', 'It gets 100 times smaller'], then: 'Slide the number of steps, and watch the fan.' } },
          { q: 'What is Var(W(4))?', a: 4, hint: 'W(t) ~ Normal(0, t).', sol: '<b>4</b>, so the sd is 2.' },
          { q: 'What is P(W(1) > 1)? Use P(Z &lt; 1) ≈ 0.8413.', a: 0.15866, tol: { abs: 0.003 }, hint: 'W(1) is standard normal.', sol: '≈ <b>0.159</b>.' },
          { q: 'What is Cov(W(2), W(5))?', a: 2, hint: 'Write W(5) = W(2) + (W(5) − W(2)). The bracket is independent of W(2).', sol: 'Var(W(2)) + 0 = <b>2</b>. In general Cov(W(s), W(t)) = min(s, t).' },
          { q: 'You know W(1) = 0.5. What is E[W(3)]?', a: 0.5, hint: 'The future increment has mean zero.', sol: '<b>0.5</b>. Brownian motion is a martingale: your best forecast is where it is now.' },
          { id: 'm1', q: 'What is the distribution of W(4) − W(1)?', opts: [['Normal, mean 0, variance 3'], ['Normal, mean 0, variance 4', 'That\'s W(4) itself.'], ['Normal, mean 0, variance 5', 'Variances of the pieces don\'t add like this.'], ['It depends on W(1)', 'Increments are independent of the past.']], sol: 'An increment over a time gap of 3 is Normal(0, 3), whatever happened before.' },
        ] },
        { h: 'Rough paths and quadratic variation', blocks: [
          `<p>Over a short time Δt, Brownian motion moves about √Δt, which is much bigger than Δt. So the slope ΔW/Δt is about 1/√Δt, which blows up as Δt shrinks: the paths are continuous but <b>nowhere differentiable</b>. Zoom in on any piece and it looks just as jagged.</p>
           <p>Now add up the <i>squared</i> moves over [0, t] in n steps. Each (ΔW)² has mean Δt, so the sum has mean t. Its variance is n × 2Δt² = 2tΔt, which goes to 0. So the sum doesn't just average t: it <i>becomes</i> t. This is the <b>quadratic variation</b>, and it's the single fact behind stochastic calculus:</p>
           <div class="hb-eq">Σ (ΔW)² → t &nbsp;&nbsp; in shorthand, (dW)² = dt</div>`,
          { fig: 'plot', x: [0.8, 3.5], y: [0, 2], h: 200, xl: 'steps (log scale)', yl: 'Σ(ΔW)² over [0, 1]', xt: [[1, '10'], [2, '100'], [3, '1,000']], yt: [0, 1, 2], hlines: [{ y: 1, tone: 'ok' }], labels: [{ x: 0.9, y: 0.7, t: 'quadratic variation = 1', tone: 'ok' }], series: [{ pts: qv }], pts: qv.map(([x, y]) => ({ x, y })), alt: 'The sum of squared increments over one unit of time, settling on 1 as the number of steps grows.', cap: 'With more, smaller steps, Σ(ΔW)² settles on exactly 1, the length of the interval. For a smooth path it would go to 0.' },
          { q: 'Over [0, 3], with ever finer steps, what does Σ(ΔW)² tend to?', a: 3, hint: 'Quadratic variation equals elapsed time.', sol: '<b>3</b>.' },
          { q: 'Over [0, 1] in 100 steps, what is E[Σ|ΔW|]? Use E|Z| = √(2/π). Give 2 decimal places.', a: Math.sqrt(200 / Math.PI), tol: { abs: 0.02 }, hint: 'Each |ΔW| averages √(2/π) × √(1/100).', sol: '100 × 0.0798 ≈ <b>7.98</b>. It grows like √n: the path\'s length is infinite.' },
          { id: 'm2', q: 'Why can\'t ordinary calculus\'s chain rule be used for functions of W?', opts: [['(ΔW)² is the size of Δt, so it isn\'t negligible'], ['W is not continuous', 'Its paths are continuous.'], ['W has mean zero', 'That\'s not the issue.'], ['W can be negative', 'That\'s not the issue.']], sol: 'In ordinary calculus, (Δx)² is tiny compared with Δx, so the second-order Taylor term vanishes. For Brownian motion it adds up to dt, so it stays. That second-order term is Itô\'s correction, in the next chapter.' },
        ] },
        { h: 'Scaling and the reflection principle', blocks: [
          `<p>Brownian motion looks the same at every scale: W(ct)/√c is again a Brownian motion. That's the √time rule: four times as long means twice the typical move.</p>
           <p>The reflection principle carries over from random walks. Any path that reaches a and ends below it has a mirror image, reflected after the first touch, that ends above it. So:</p>
           <div class="hb-eq">P(max over [0, t] ≥ a) = 2 P(W(t) ≥ a) &nbsp;&nbsp; E[max over [0, t]] = √(2t/π)</div>`,
          { fig: 'plot', x: [0, 1], y: [-1.2, 2.4], h: 220, xl: 'time', xt: [0, 0.5, 1], yt: [0, 1, 2], hlines: [{ y: REFL.a, tone: 'acc' }], labels: [{ x: 0.02, y: REFL.a + 0.25, t: 'level a', tone: 'acc' }], series: REFL.series, alt: 'A Brownian path touching a level, with its mirror image after the first touch.', cap: 'Reflect the path after it first touches a. Each path that ends below a pairs with one that ends above it.' },
          { q: 'What is P(W reaches 1 at some time in [0, 1])? Use P(Z ≥ 1) ≈ 0.1587.', a: 2 * 0.15866, tol: { abs: 0.003 }, hint: 'Twice the chance of ending above 1.', sol: '≈ <b>0.317</b>.' },
          { q: 'What is the expected maximum of W over [0, 4]? Give 3 decimal places.', a: Math.sqrt(8 / Math.PI), tol: { abs: 0.005 }, hint: '√(2t/π).', sol: '√(8/π) ≈ <b>1.596</b>.' },
          { q: 'Over [0, 100], what is the standard deviation of W(100)?', a: 10, hint: '√t.', sol: '<b>10</b>.' },
        ] },
        { h: 'Martingales and hitting times', blocks: [
          `<p>Three martingales do most of the work, and you can use each one like the random-walk martingales:</p>
           <div class="hb-eq">W(t) &nbsp;&nbsp; W(t)² − t &nbsp;&nbsp; exp(θW(t) − θ²t/2)</div>`,
          { worked: 'leaving an interval', q: 'Brownian motion starts at 0 and stops when it first hits b > 0 or −a &lt; 0. How likely is b first, and how long does it take on average?', steps: [
            ['W is a martingale. What does that say at the stopping time T?', 'E[W(T)] = 0, so b P(b) − a(1 − P(b)) = 0, giving P(b first) = a/(a + b).'],
            ['Now use W² − t. What is E[W(T)² − T]?', '0, so E[T] = E[W(T)²] = b² × a/(a + b) + a² × b/(a + b).'],
            'Simplify: E[T] = ab(b + a)/(a + b) = ab. The same answers as the fair random walk, i/N and i(N − i), in continuous form.',
          ] },
          { q: 'Starting at 0, what is P(W hits +1 before −3)?', a: 0.75, hint: 'a/(a + b) with a = 3 and b = 1.', sol: '3/4 = <b>0.75</b>.' },
          { q: 'And the expected time until it hits one of them?', a: 3, hint: 'ab.', sol: '1 × 3 = <b>3</b>.' },
          `<p>With drift, X(t) = μt + σW(t), the exponential martingale gives the answer. With ν = 2μ/σ², and the levels symmetric at ±a:</p>
           <div class="hb-eq">P(hit +a before −a) = 1/(1 + e<sup>−νa</sup>)</div>`,
          { q: 'X(t) = 0.5t + W(t). What is P(X hits +1 before −1)? Give 3 decimal places.', a: 1 / (1 + Math.exp(-1)), tol: { abs: 0.003 }, hint: 'ν = 2 × 0.5/1 = 1.', sol: 'ν = 2μ/σ² = 2 × 0.5/1 = 1, so P = 1/(1 + e<sup>−νa</sup>) = 1/(1 + e⁻¹) ≈ <b>0.731</b>. The martingale behind it is e<sup>−νX(t)</sup>: it keeps its expected value, and at the stop it is e<sup>−νa</sup> or e<sup>νa</sup>.' },
          `<p><b>Waiting for one level.</b> Without drift, Brownian motion is certain to hit any level a eventually (P(T<sub>a</sub> ≤ t) = 2P(W(t) ≥ a) → 1), yet the <b>expected</b> wait is infinite: the paths that wander the wrong way take so long that they dominate the average. With an upward drift μ, Wald's identity gives a finite answer: E[X(T)] = a = μE[T], so E[T<sub>a</sub>] = a/μ. A trader "waiting to get back to break-even" with no edge will get there with certainty, but not in any time they can plan around.</p>`,
          { id: 'x1', q: 'X(t) = 0.5t + W(t), starting at 0. What is the expected time for X to first reach 2?', a: 4, tol: { abs: 0.01 }, hint: 'Wald: a = μE[T].', sol: 'The drift is μ = 0.5, so E[T] = a/μ = 2/0.5 = <b>4</b>. The noise doesn\'t change the mean time, only its spread.' },
        ] },
        { h: 'Brownian motion and markets', blocks: [
          `<p>Louis Bachelier modelled French bond prices with Brownian motion in 1900, five years before Einstein used it for physics. Plain (arithmetic) Brownian motion, S = S₀ + μt + σW, has two problems as a model of a stock: it can go negative, and its moves don't scale with price, though a $1,000 stock moves more dollars than a $10 one. The fix is to apply Brownian motion to the <i>log</i> of the price: geometric Brownian motion, in the next chapter.</p>`,
          { market: 'The √t rule everywhere: 1% daily volatility is about 16% a year, and about 5% over 25 days. Option prices, stop-loss distances and risk limits all use it, and all assume independent increments. Trends or mean reversion break it.' },
          { id: 'm3', q: 'Why is plain Brownian motion a poor model for a stock price?', opts: [['It allows negative prices, and moves don\'t scale with price'], ['Its paths are too smooth', 'Its paths are very rough.'], ['Its variance doesn\'t grow with time', 'It grows linearly with time.'], ['Stock prices can\'t be random', 'They\'re close to random over short horizons.']], sol: 'Modelling log price as a Brownian motion fixes both: prices stay positive, and percentage moves are the same size at any price level.' },
        ] },
      ],
      takeaways: ['W(0) = 0; independent increments; W(t) − W(s) ~ N(0, t − s); continuous paths.', 'Cov(W(s), W(t)) = min(s, t).', 'Moves over Δt are about √Δt: no derivative anywhere.', 'Quadratic variation: Σ(ΔW)² → t, so (dW)² = dt.', 'Scaling: W(ct)/√c is Brownian motion.', 'Reflection: P(max ≥ a) = 2P(W(t) ≥ a); E[max] = √(2t/π).', 'Exit (−a, b): P(b first) = a/(a + b); E[T] = ab.'],
      explain: { q: 'Why does the sum of squared increments of Brownian motion converge to t, when for a smooth curve it goes to 0?', a: 'For a smooth curve, each move over Δt is about slope × Δt, so its square is about Δt², and n of them sum to about Δt × t, which vanishes. Brownian moves are about √Δt, so each square is about Δt, and n = t/Δt of them add to t. The randomness averages out, as the variance of the sum also goes to zero.' },
      homework: [
        { lvl: 'core', q: 'What is Var(W(3) − W(1))?', a: 2, hint: 'An increment over a gap of 2.', sol: '<p><b>Approach:</b> an increment over a time gap of h is Normal(0, h), whatever the starting time.</p><ol><li>Gap = 3 − 1 = 2, so Var = <b>2</b>.</li></ol><p><b>Check with covariances:</b> Var(W(3)) + Var(W(1)) − 2Cov(W(3), W(1)) = 3 + 1 − 2 × 1 = 2 ✓.</p>' },
        { lvl: 'core', q: 'What is P(W(4) > 2)? Use P(Z &lt; 1) ≈ 0.8413.', a: 0.15866, tol: { abs: 0.003 }, hint: 'The sd of W(4) is 2.', sol: '<p><b>Approach:</b> standardise. W(4) ~ Normal(0, 4), sd 2.</p><ol><li>P(W(4) > 2) = P(Z > 2/2) = P(Z > 1) ≈ 1 − 0.8413 = <b>0.159</b>.</li></ol><p><b>Scaling view:</b> a one-sd move over any horizon has the same probability; only the size of a "sd" changes, as √t.</p>' },
        { lvl: 'core', q: 'What is Cov(W(1), W(3))?', a: 1, hint: 'min(s, t).', sol: '<p><b>Approach:</b> split the later value into the earlier one plus an independent increment.</p><ol><li>W(3) = W(1) + (W(3) − W(1)), and the increment is independent of W(1).</li><li>Cov(W(1), W(3)) = Var(W(1)) + 0 = <b>1</b> = min(1, 3).</li></ol><p>The correlation is 1/√3 ≈ 0.58: the shared part is the first unit of time.</p>' },
        { lvl: 'core', q: 'What is E[W(2)²]?', a: 2, hint: 'Mean zero, so this is the variance.', sol: '<p><b>Approach:</b> E[W²] = Var(W) + (E[W])².</p><ol><li>E[W(2)] = 0 and Var(W(2)) = 2, so E[W(2)²] = <b>2</b>.</li></ol><p>That\'s why W(t)² − t has constant expectation 0: the martingale used for exit times.</p>' },
        { lvl: 'interview', q: 'What is P(W reaches 2 at some time in [0, 1])? Use P(Z ≥ 2) ≈ 0.02275.', a: 2 * 0.02275, tol: { abs: 0.003 }, hint: 'Reflection.', sol: '<p><b>Approach:</b> reflection principle, P(max ≥ a) = 2P(W(t) ≥ a).</p><ol><li>W(1) is standard normal, so P(W(1) ≥ 2) ≈ 0.02275.</li><li>P(max ≥ 2) ≈ 2 × 0.02275 ≈ <b>0.046</b>.</li></ol><p><b>Point:</b> touching a 2-sigma level at some point is twice as likely as finishing beyond it.</p>' },
        { lvl: 'interview', q: 'Starting at 0, what is the expected time for W to leave (−2, 1)?', a: 2, hint: 'ab.', sol: '<p><b>Approach:</b> the W² − t martingale gives E[T] = ab for the interval (−a, b).</p><ol><li>a = 2, b = 1: E[T] = 2 × 1 = <b>2</b>.</li></ol><p><b>Check with the details:</b> P(hit 1 first) = a/(a + b) = 2/3, so E[W(T)²] = 1² × 2/3 + 2² × 1/3 = 2 = E[T] ✓.</p>' },
        { lvl: 'interview', q: 'A price with no drift has 1% daily volatility. Roughly how likely is it to touch +3% within 9 days? Use P(Z ≥ 1) ≈ 0.1587.', a: 2 * 0.15866, tol: { abs: 0.01 }, hint: 'Over 9 days the sd is 3%.', sol: '<p><b>Approach:</b> scale the volatility, then reflect.</p><ol><li>9-day sd: 1% × √9 = 3%, so +3% is one sd.</li><li>P(touch) ≈ 2 × P(Z ≥ 1) ≈ 2 × 0.159 ≈ <b>0.32</b>.</li></ol><p><b>Use:</b> this is how to set a take-profit or stop level with a known chance of being hit within a horizon.</p>' },
        { lvl: 'stretch', q: 'Show that W(t)² − t is a martingale, and that so is exp(θW(t) − θ²t/2).', sol: '<p><b>Set-up:</b> for s < t write W(t) = W(s) + D with D ~ N(0, t − s) independent of everything up to time s.</p><ol><li>E[W(t)² | past] = W(s)² + 2W(s)E[D] + E[D²] = W(s)² + (t − s). Subtract t: E[W(t)² − t | past] = W(s)² − s ✓.</li><li>E[e<sup>θW(t)</sup> | past] = e<sup>θW(s)</sup>E[e<sup>θD</sup>] = e<sup>θW(s)</sup>e<sup>θ²(t−s)/2</sup> (the normal MGF). Multiply by e<sup>−θ²t/2</sup>: E[e<sup>θW(t) − θ²t/2</sup> | past] = e<sup>θW(s) − θ²s/2</sup> ✓.</li></ol><p>The second one, with θ chosen to cancel a drift, is what gives the drifted exit probability 1/(1 + e<sup>−νa</sup>).</p>' },
        { lvl: 'lab', q: 'In Python, simulate 10,000 Brownian paths on [0, 1] with 1,000 steps: <code>W = np.cumsum(np.random.randn(10000, 1000) * np.sqrt(1/1000), axis=1)</code>. Estimate P(max ≥ 1) and E[max], and compare with 0.317 and 0.798.', sol: '<p>You\'ll get slightly less than both (around 0.30 and 0.77 with 1,000 steps), because a discrete path can cross the level between steps without being seen. More steps close the gap slowly, like 1/√n.</p><p><b>Lesson for simulations:</b> anything that depends on the path\'s extremes (barrier options, stop-losses, drawdowns) is biased by discrete monitoring. Correction formulas exist; the simplest is to shift the barrier by about 0.58σ√Δt.</p>' },
      ],
      practice: [['Random walks topic', '#/topic/walks'], ['Walk to −100 or +50', '#/iq/imc-walk']],
    },

    stochastic: {
      title: 'Stochastic calculus and Black–Scholes', minutes: 60,
      why: 'Itô\'s lemma is the chain rule for random processes. With it you can solve geometric Brownian motion, see why volatility drags down growth, derive Black–Scholes, and model mean reversion. Quant interviews love to check that you know where the extra ½σ² comes from.',
      goals: ['Read and simulate stochastic differential equations', 'Apply Itô\'s lemma', 'Solve geometric Brownian motion, and explain mean v median', 'Derive the Black–Scholes equation by hedging, and use the formula', 'Use the Ornstein–Uhlenbeck process for mean reversion'],
      prereq: ['brownian', 'toolkit'],
      sections: [
        { h: 'Stochastic differential equations', blocks: [
          `<p>An SDE describes a process by its tiny moves: a predictable drift plus a random shock.</p>
           <div class="hb-eq">dX = μ(X, t) dt + σ(X, t) dW</div>
           <p>Read it as a recipe to simulate: over a small step Δt, X moves by μΔt + σ√Δt Z, with Z a fresh standard normal. That's the <b>Euler scheme</b>. The three you need:</p>
           <table class="hb-table"><tr><th>Name</th><th>SDE</th><th>Used for</th></tr>
             <tr><td>Arithmetic Brownian motion</td><td>dX = μ dt + σ dW</td><td>spreads, P&amp;L</td></tr>
             <tr><td>Geometric Brownian motion</td><td>dS = μS dt + σS dW</td><td>stock prices</td></tr>
             <tr><td>Ornstein–Uhlenbeck</td><td>dX = −θX dt + σ dW</td><td>mean reversion, rates</td></tr></table>`,
          { q: 'Euler step: X = 1, μ = 0.1, σ = 0.2, Δt = 0.01 and Z = 1. What is the next X?', a: 1.021, hint: '1 + μΔt + σ√Δt Z.', sol: '1 + 0.001 + 0.2 × 0.1 = <b>1.021</b>. The random part is 20 times the drift over this step.' },
        ] },
        { h: 'Itô\'s lemma', blocks: [
          `<p>For a smooth function f of a process X, expand to second order, as in a Taylor series:</p>
           <div class="hb-eq">df = f′ dX + ½ f″ (dX)²</div>
           <p>In ordinary calculus the second term vanishes. Here it doesn't, because (dW)² = dt, so (dX)² = σ²dt (the dt·dW and dt² terms are negligible). That gives <b>Itô's lemma</b>:</p>
           <div class="hb-eq">df = (f′μ + ½ f″σ²) dt + f′σ dW</div>
           <p>(For f(X, t), add ∂f/∂t dt.) The extra ½f″σ² is everything that's new.</p>`,
          { worked: 'the square of W', q: 'Use Itô to find d(W²), and then E[W(t)²].', steps: [
            ['Here X = W, so μ = 0 and σ = 1. What are f′ and f″ for f = x²?', 'f′ = 2x and f″ = 2.'],
            ['Apply the lemma.', 'd(W²) = 2W dW + ½ × 2 × dt = 2W dW + dt.'],
            ['Take expectations. What happens to the dW term?', 'It has mean zero, as W is independent of the next increment.'],
            'So E[W(t)²] = t, as it must be. And ∫₀ᵗ W dW = (W(t)² − t)/2, not W²/2 as ordinary calculus would say.',
          ] },
          { q: 'Using d(W⁴) = 4W³ dW + 6W² dt, what is E[W(2)⁴]?', a: 12, hint: 'E[W(t)⁴] = ∫₀ᵗ 6 E[W(s)²] ds = ∫₀ᵗ 6s ds.', sol: '3t² = <b>12</b>. That matches the normal\'s fourth moment, 3σ⁴.' },
          { q: '∫₀¹ W dW = (W(1)² − 1)/2. If W(1) = 2, what is the integral?', a: 1.5, hint: 'Plug it in.', sol: '(4 − 1)/2 = <b>1.5</b>.' },
          { id: 'm1', q: 'Where does Itô\'s extra ½f″σ² dt term come from?', opts: [['(dW)² = dt, so the second-order term survives'], ['A rounding error in the simulation', 'It\'s exact.'], ['The drift μ', 'It appears even when μ = 0.'], ['The fact that W has mean zero', 'That\'s why the dW term has mean zero.']], sol: 'Quadratic variation: squared Brownian moves add up to time. It\'s the same √Δt roughness as in the Brownian motion chapter.' },
        ] },
        { h: 'Geometric Brownian motion', blocks: [
          `<p>Apply Itô to ln S, with dS = μS dt + σS dW. f′ = 1/S and f″ = −1/S², so:</p>
           <div class="hb-eq">d ln S = (μ − ½σ²) dt + σ dW &nbsp;&nbsp; S(T) = S(0) exp((μ − ½σ²)T + σW(T))</div>
           <p>So log returns are normal, and prices are lognormal. Two consequences surprise people:</p>
           <ul><li>The <b>mean</b> grows at μ: E[S(T)] = S(0)e<sup>μT</sup>.</li><li>The <b>median</b>, the typical path, grows only at μ − ½σ². That gap is the <b>volatility drag</b>, the same σ²/2 as in the Kelly chapter.</li></ul>`,
          { fig: 'plot', x: [0, 5], y: [0, 4], h: 240, xl: 'years', yl: 'price (start = 1)', xt: [0, 1, 2, 3, 4, 5], yt: [1, 2, 3], series: [11, 19, 29, 37, 53, 61, 73, 89, 97, 101, 107, 113].map((s) => gbm(s, 0.1, 0.4)).filter((p) => Math.max(...p.map(([, v]) => v)) < 3.9).slice(0, 8).map((pts) => ({ pts, tone: 'muted' })), fns: [{ f: (t) => Math.exp(0.1 * t), tone: 'ok' }, { f: (t) => Math.exp(0.02 * t), tone: 'bad' }], labels: [{ x: 0.15, y: 3.7, t: 'green: mean, e^(μt)', tone: 'ok' }, { x: 0.15, y: 3.35, t: 'red: median, e^((μ − σ²/2)t)', tone: 'bad' }], alt: 'Eight geometric Brownian paths with the rising mean curve and a much flatter median curve.', cap: 'μ = 10%, σ = 40%. The mean grows at 10% a year, but the median only at 2%. A few paths soar and hold up the mean, while most lag behind.' },
          { widget: 'gbm', predict: { q: 'A stock has a 10% expected return and 60% volatility. After 5 years, will most paths be above or below where they started?', opts: ['Below', 'Above', 'About half and half'], then: 'Set μ = 10% and σ = 60%.' } },
          { q: 'μ = 10% and σ = 20%. What is the drift of ln S, as a decimal?', a: 0.08, hint: 'μ − σ²/2.', sol: '0.1 − 0.02 = <b>0.08</b>.' },
          { q: 'With those numbers, S(0) = 100. What is the median of S after one year? Give 2 decimal places.', a: 100 * Math.exp(0.08), tol: { abs: 0.05 }, hint: '100e^(0.08).', sol: '≈ <b>108.33</b>.' },
          { q: 'And the mean? Give 2 decimal places.', a: 100 * Math.exp(0.1), tol: { abs: 0.05 }, hint: '100e^(0.1).', sol: '≈ <b>110.52</b>.' },
          { q: 'With those numbers, what is P(S(1) > S(0))? Use Φ(0.4) ≈ 0.6554.', a: 0.65542, tol: { abs: 0.003 }, hint: 'ln S(1) − ln S(0) ~ N(0.08, 0.2²).', sol: 'Φ(0.08/0.2) = Φ(0.4) ≈ <b>0.655</b>.' },
        ] },
        { h: 'Black–Scholes by hedging', blocks: [
          `<p>Let V(S, t) be an option's value. Hold the option and short Δ = ∂V/∂S shares. By Itô, the option's random part is ∂V/∂S × σS dW, and the shares' is Δ × σS dW: they cancel. So the portfolio is riskless for the next instant, and must earn the risk-free rate r. Writing that out gives the <b>Black–Scholes equation</b>:</p>
           <div class="hb-eq">∂V/∂t + rS ∂V/∂S + ½σ²S² ∂²V/∂S² = rV</div>
           <p>μ has disappeared. The price is the same as in a world where the stock grows at r, so you can price by <b>risk-neutral expectation</b>: V = e<sup>−rT</sup> E<sup>Q</sup>[payoff], with dS = rS dt + σS dW under Q. For a call, this gives:</p>
           <div class="hb-eq">C = S N(d₁) − K e<sup>−rT</sup> N(d₂) &nbsp;&nbsp; d₁ = [ln(S/K) + (r + ½σ²)T]/(σ√T) &nbsp;&nbsp; d₂ = d₁ − σ√T</div>
           <p>N(d₂) is the risk-neutral chance of finishing in the money, and N(d₁) is the delta.</p>`,
          { fig: 'flow', alt: 'The Black–Scholes argument.', steps: ['Option + short Δ shares', 'Itô: dW terms cancel', 'Riskless, so earns r', 'A PDE with no μ', 'Price = discounted expectation at rate r'] },
          { q: 'S = K = 100, r = 0, σ = 20% and T = 1. What is d₁?', a: 0.1, hint: 'ln(1) = 0, so d₁ = ½σ√T.', sol: '0.02/0.2 = <b>0.1</b>.' },
          { q: 'With those numbers, what is the call worth? Use N(0.1) ≈ 0.5398. Give 2 decimal places.', a: 100 * (2 * 0.53983 - 1), tol: { abs: 0.02 }, hint: 'd₂ = −0.1, and N(−0.1) = 1 − N(0.1).', sol: '100(0.5398 − 0.4602) ≈ <b>7.97</b>. The 0.4 rule from the options chapter gave 8.' },
          { q: 'With r = 0, a digital call pays 1 if S(T) > K. What does it cost with those numbers? Use N(−0.1) ≈ 0.4602.', a: 1 - 0.53983, tol: { abs: 0.002 }, hint: 'N(d₂).', sol: '≈ <b>0.460</b>, a little below ½, because of the drag on the median.' },
          { id: 'm2', q: 'Why doesn\'t the stock\'s expected return μ appear in the Black–Scholes price?', opts: [['Hedging removes the risk, so the price can\'t depend on it'], ['Black–Scholes assumes μ = 0', 'It allows any μ.'], ['μ is too hard to estimate', 'True, but it\'s not the reason.'], ['μ cancels with σ', 'It cancels through hedging.']], sol: 'The option can be replicated with stock and cash at a cost that doesn\'t involve μ. Any view on direction is already in the share price.' },
        ] },
        { h: 'What the equation says: gamma pays for theta', blocks: [
          `<p>Read the Black–Scholes equation in Greek letters, with Θ = ∂V/∂t, Δ = ∂V/∂S and Γ = ∂²V/∂S². With r = 0 it says</p>
           <div class="hb-eq">Θ + ½σ²S²Γ = 0</div>
           <p>A delta-hedged option holder loses Θ per unit of time (the option decays) and gains ½ΓS² × (realised variance) from rebalancing: buying low and selling high as the stock wiggles. The equation says that at the implied volatility these exactly offset. So a hedged long option is a bet that <b>realised</b> volatility will exceed <b>implied</b>: it makes about ½ΓS²(σ²<sub>realised</sub> − σ²<sub>implied</sub>) per unit of time. That's the core of how option market makers think about their book.</p>`,
          { id: 'x1', q: 'An option has Γ = 0.02 per $ with the stock at $100, and implied volatility 20%. With r = 0, what is its theta, in dollars per year?', a: -4, tol: { abs: 0.01 }, hint: 'Θ = −½σ²S²Γ.', sol: 'Θ = −½ × 0.04 × 10,000 × 0.02 = <b>−$4</b> a year, about −1.1 cents a day. If the stock actually moves with 25% volatility, the hedged position earns about ½ × 0.02 × 10,000 × (0.0625 − 0.04) = $2.25 a year net.' },
        ] },
        { h: 'Mean reversion: Ornstein–Uhlenbeck', blocks: [
          `<p>dX = −θX dt + σ dW pulls X back towards 0 at rate θ. It's the continuous version of AR(1): over a step Δt, X shrinks by a factor of e<sup>−θΔt</sup>, so φ = e<sup>−θΔt</sup>. Its long-run variance is σ²/(2θ), and the half-life of a shock is ln 2/θ. Use it for spreads in pairs trading, interest rates (the Vasicek model) and volatility.</p>`,
          { fig: 'plot', x: [0, 10], y: [-2.5, 3.2], h: 200, xl: 'time', xt: [0, 5, 10], yt: [-2, 0, 2], fns: [{ f: (t) => 3 * Math.exp(-0.8 * t), tone: 'ok', dash: true }], series: [{ pts: (() => { const z = normals(500, 5), p = [[0, 3]]; z.forEach((x, i) => { const dt = 0.02, v = p[i][1]; p.push([(i + 1) * dt, v - 0.8 * v * dt + 0.7 * Math.sqrt(dt) * x]); }); return p; })() }], labels: [{ x: 1.3, y: 2.3, t: 'expected path: 3e^(−θt)', tone: 'ok' }], alt: 'An Ornstein-Uhlenbeck path starting at 3 and decaying towards zero with noise around an exponential curve.', cap: 'θ = 0.8, starting at 3. The expected path decays exponentially, with a half-life of ln 2/0.8 ≈ 0.87. After that, noise keeps it jiggling around 0.' },
          { q: 'θ = 0.5. What is the half-life of a shock? Give 3 decimal places.', a: Math.log(2) / 0.5, tol: { abs: 0.005 }, hint: 'ln 2/θ.', sol: '≈ <b>1.386</b>.' },
          { q: 'θ = 0.5 and σ = 1. What is the long-run variance?', a: 1, hint: 'σ²/(2θ).', sol: '<b>1</b>.' },
          { q: 'A daily AR(1) has φ = 0.95. What is θ per day? Give 4 decimal places.', a: -Math.log(0.95), tol: { abs: 0.0005 }, hint: 'φ = e^(−θ).', sol: '−ln 0.95 ≈ <b>0.0513</b>.' },
          { market: 'Fitting an OU process to a spread gives you its half-life, which tells you how long a trade should take. If live trades take much longer than that, the model has probably stopped describing the spread.' },
        ] },
      ],
      takeaways: ['Euler: X += μΔt + σ√Δt Z.', 'Θ + ½σ²S²Γ = 0 (r = 0): a hedged option bets realised against implied variance.', 'Itô: df = (f′μ + ½f″σ²) dt + f′σ dW, because (dW)² = dt.', '∫W dW = (W² − t)/2.', 'GBM: S(T) = S(0) exp((μ − ½σ²)T + σW(T)). Mean grows at μ, median at μ − ½σ².', 'Hedging cancels dW, so μ drops out: price at the risk-free rate.', 'C = S N(d₁) − Ke<sup>−rT</sup> N(d₂). N(d₂) = risk-neutral P(in the money).', 'OU: half-life ln 2/θ; variance σ²/(2θ); φ = e<sup>−θΔt</sup>.'],
      explain: { q: 'A stock has expected return 10% and volatility 40%. Explain why its typical path grows at only 2% a year.', a: 'Returns compound by multiplying, so what matters for a single path is the average log return. Itô (or the ½σ² rule) gives a log drift of μ − σ²/2 = 10% − 8% = 2%. The mean is held up at 10% by a few paths with huge gains, while the median path, the one you\'d typically see, grows at 2%.' },
      homework: [
        { lvl: 'core', q: 'μ = 5%, σ = 30%, S(0) = 100. What is the median after one year? Give 2 decimal places.', a: 100 * Math.exp(0.005), tol: { abs: 0.02 }, hint: '100e^(μ − σ²/2).', sol: '<p><b>Approach:</b> the median of a lognormal is e<sup>(mean of the log)</sup>, and ln S grows at μ − σ²/2.</p><ol><li>μ − σ²/2 = 0.05 − 0.045 = 0.005.</li><li>Median = 100e<sup>0.005</sup> ≈ <b>100.50</b>.</li></ol><p><b>Compare the mean:</b> 100e<sup>0.05</sup> ≈ 105.13. A 5% expected return with 30% volatility leaves the typical path almost flat.</p>' },
        { lvl: 'core', q: 'With those numbers, what is P(S(1) > S(0))? Give 3 decimal places, using Φ(0.0167) ≈ 0.5066.', a: 0.50665, tol: { abs: 0.002 }, hint: 'Φ((μ − σ²/2)/σ).', sol: '<p><b>Approach:</b> the log return is Normal(μ − σ²/2, σ²); the price ends higher when the log return is positive.</p><ol><li>P(log return > 0) = Φ((μ − σ²/2)/σ) = Φ(0.005/0.3) = Φ(0.0167) ≈ <b>0.507</b>.</li></ol><p>Barely better than a coin, even though the expected return is 5%. Over one year, volatility swamps drift.</p>' },
        { lvl: 'core', q: 'Itô gives d(e^W) = e^W dW + ½e^W dt, so E[e^(W(t))] = e^(t/2). What is E[e^(W(2))]? Give 3 decimal places.', a: Math.E, tol: { abs: 0.005 }, hint: 'e^(2/2).', sol: '<p><b>Approach:</b> take expectations of the Itô equation: the dW term has mean zero, so m(t) = E[e<sup>W(t)</sup>] satisfies m′ = ½m, giving m(t) = e<sup>t/2</sup>.</p><ol><li>E[e<sup>W(2)</sup>] = e<sup>2/2</sup> = e ≈ <b>2.718</b>.</li></ol><p><b>Check:</b> W(2) ~ Normal(0, 2), and the normal MGF gives E[e<sup>Z</sup>] = e<sup>σ²/2</sup> = e<sup>1</sup> ✓. Note E[e<sup>W</sup>] > e<sup>E[W]</sup> = 1: Jensen again.</p>' },
        { lvl: 'core', q: 'At the money, S = K = 100, r = 0, σ = 30%, T = 3 months. What is the call worth? Use N(0.075) ≈ 0.5299. Give 2 decimal places.', a: 100 * (2 * 0.52989 - 1), tol: { abs: 0.03 }, hint: 'd₁ = ½σ√T = 0.075, and d₂ = −0.075.', sol: '<p><b>Approach:</b> Black–Scholes at the money with r = 0.</p><ol><li>σ√T = 0.3 × 0.5 = 0.15. ln(S/K) = 0, so d₁ = 0.075 and d₂ = −0.075.</li><li>C = 100N(0.075) − 100N(−0.075) = 100(2N(0.075) − 1) = 100(0.0598) ≈ <b>5.98</b>.</li></ol><p><b>Rule of thumb:</b> 0.4 × σ√T × S = 0.4 × 0.15 × 100 = 6. Close, because N(x) ≈ ½ + 0.4x for small x.</p>' },
        { lvl: 'interview', q: 'An OU spread has θ = 0.1 a day. What is its half-life, in days? Give 2 decimal places.', a: Math.log(2) / 0.1, tol: { abs: 0.02 }, hint: 'ln 2/θ.', sol: '<p><b>Approach:</b> the expected gap decays like e<sup>−θt</sup>; solve e<sup>−θt</sup> = ½.</p><ol><li>t = ln 2/θ = 0.693/0.1 ≈ <b>6.93</b> days.</li></ol><p><b>Link to AR(1):</b> a daily AR(1) with φ = e<sup>−0.1</sup> ≈ 0.905 has the same half-life, ln ½/ln 0.905.</p>' },
        { lvl: 'interview', q: 'σ = 25% a year. What is the standard deviation of the 4-year log return?', a: 0.5, hint: 'σ√T.', sol: '<p><b>Approach:</b> log returns are Brownian, so their variance grows linearly in time.</p><ol><li>σ√T = 0.25 × √4 = <b>0.5</b>.</li></ol><p><b>In price terms:</b> one standard deviation is a factor of e<sup>0.5</sup> ≈ 1.65 either way, so a range of roughly ×0.6 to ×1.65 around the median covers two thirds of outcomes.</p>' },
        { lvl: 'interview', q: 'For GBM with S(0) = 1, μ = 0, σ = 20% and T = 1, what is E[S(T)²]? Give 4 decimal places.', a: Math.exp(0.04), tol: { abs: 0.0005 }, hint: 'S² is also lognormal: E[S²] = e^((2μ + σ²)T).', sol: '<p><b>Approach:</b> S(T)² = exp(2(μ − σ²/2)T + 2σW(T)), a lognormal whose log has mean (2μ − σ²)T and variance 4σ²T.</p><ol><li>E[e<sup>Y</sup>] = e<sup>mean + var/2</sup> = e<sup>(2μ − σ²)T + 2σ²T</sup> = e<sup>(2μ + σ²)T</sup>.</li><li>With μ = 0, σ² = 0.04: e<sup>0.04</sup> ≈ <b>1.0408</b>.</li></ol><p>Since E[S(T)] = 1, Var S(T) = e<sup>0.04</sup> − 1 ≈ 0.0408, a standard deviation of about 20%, as expected.</p>' },
        { lvl: 'stretch', q: 'Derive the Black–Scholes PDE: apply Itô to V(S, t), form V − ΔS with Δ = ∂V/∂S, and set its return equal to r.', sol: '<p><b>Derivation:</b></p><ol><li>Itô on V(S, t) with dS = μS dt + σS dW: dV = (V<sub>t</sub> + μSV<sub>S</sub> + ½σ²S²V<sub>SS</sub>) dt + σSV<sub>S</sub> dW.</li><li>Portfolio Π = V − V<sub>S</sub>S (the hedge is held fixed over dt): dΠ = dV − V<sub>S</sub>dS = (V<sub>t</sub> + ½σ²S²V<sub>SS</sub>) dt. The dW terms and the μ terms cancel.</li><li>Riskless, so it must earn r: dΠ = rΠ dt = r(V − SV<sub>S</sub>) dt.</li><li>Equate: V<sub>t</sub> + ½σ²S²V<sub>SS</sub> = rV − rSV<sub>S</sub>, i.e. V<sub>t</sub> + rSV<sub>S</sub> + ½σ²S²V<sub>SS</sub> = rV.</li></ol><p>μ is gone: the price doesn\'t depend on the expected return, only on volatility and the risk-free rate.</p>' },
        { lvl: 'lab', q: 'In Python, price an at-the-money call by Monte Carlo: draw 100,000 values of S(T) = 100 exp(−0.02 + 0.2Z), average max(S(T) − 100, 0), and compare with 7.97. Then repeat with μ = 0.1 in the exponent instead, and explain why that answer is wrong as a price.', sol: '<p>Under the risk-neutral drift (here r = 0, so the log drift is −σ²/2 = −0.02), the average is about 7.97, with a standard error near 0.04.</p><p>With μ = 0.1 (log drift 0.08), you get the real-world expected payoff, about 14.7. That isn\'t a price: if you sold the option at 7.97 you could delta-hedge it for 7.97, so anyone quoting 14.7 would be arbitraged. Real-world expectations matter for whether an option is a good bet, not for its fair price.</p>' },
      ],
      practice: [['Options topic', '#/topic/options'], ['Time series topic', '#/topic/timeseries']],
    },
  });
})();
