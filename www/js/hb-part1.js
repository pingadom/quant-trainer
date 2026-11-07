// Handbook, Part 1: Foundations. See handbook-content.js for how chapters are structured.
// Checks without an `id` keep their original order, so saved progress still matches them.
(function () {
  const Fig = QT.hbFig;

  QT.hbChapters = Object.assign(QT.hbChapters || {}, {
    arith: {
      title: 'Numbers, fractions and fast arithmetic', minutes: 45,
      why: 'Arithmetic is the first filter at most trading firms, and it stays useful: every second you spend multiplying in an interview is a second you are not thinking about the problem.',
      goals: ['Convert between fractions, decimals and percentages instantly', 'Multiply two-digit numbers in your head with a handful of tricks', 'Check any answer by last digit and by size', 'Handle compounding percentages and orders of magnitude'],
      sections: [
        { h: 'Why speed matters', blocks: [
          `<p>Most trading firms screen with a timed arithmetic test: Optiver's 80 questions in 8 minutes, Zetamac, Flow Traders' 10-minute test. Later, in interviews, quick arithmetic frees your attention for the actual problem.</p>
           <p>Speed doesn't come from calculating faster. It comes from <b>knowing a few facts cold</b>, so there's nothing to calculate, and from <b>a handful of tricks</b> that swap a hard sum for an easy one. This chapter gives you both, and the homework starts the daily habit that makes them automatic.</p>`,
        ] },
        { h: 'Fractions, decimals and percentages', blocks: [
          `<p>Memorise this table. These numbers come up constantly, and every other fraction is close to one of them.</p>
          <table class="hb-table"><tr><th>Fraction</th><th>Decimal</th><th>Fraction</th><th>Decimal</th></tr>
          <tr><td>1/2</td><td>0.5</td><td>1/7</td><td>0.142857…</td></tr>
          <tr><td>1/3</td><td>0.333…</td><td>1/8</td><td>0.125</td></tr>
          <tr><td>1/4</td><td>0.25</td><td>1/9</td><td>0.111…</td></tr>
          <tr><td>1/5</td><td>0.2</td><td>1/11</td><td>0.0909…</td></tr>
          <tr><td>1/6</td><td>0.1666…</td><td>1/12</td><td>0.08333…</td></tr>
          <tr><td>1/16</td><td>0.0625</td><td>1/32</td><td>0.03125</td></tr></table>
          <p>To convert anything else, <b>build it from these</b>: 3/8 = 3 × 0.125; 7/12 = 1/2 + 1/12; 5/6 = 1 − 1/6. Sevenths cycle through the digits 142857, starting at a different point for each numerator (2/7 = 0.285714…, 3/7 = 0.428571…).</p>`,
          { idea: 'A percentage is a fraction with 100 underneath, so x% of y equals y% of x. 8% of 25 looks awkward, but 25% of 8 is obviously 2.' },
          { q: 'Write 3/8 as a decimal.', a: 0.375, hint: 'It is three times 1/8.', sol: '3 × 0.125 = <b>0.375</b>.' },
          { q: 'Write 7/12 as a decimal, to 3 decimal places.', a: 7 / 12, tol: { abs: 0.001 }, hint: 'Split it as 1/2 + 1/12.', sol: '0.5 + 0.0833 = <b>0.583</b>.' },
          { id: 'a1', q: 'What is 16% of 25?', a: 4, hint: 'Swap them: 25% of 16.', sol: '25% of 16 is a quarter of 16: <b>4</b>.' },
        ] },
        { h: 'Multiplication is area', blocks: [
          `<p>Before the tricks, the one idea behind all of them. A product is the area of a rectangle, and you can cut a rectangle into pieces that are easy to add.</p>`,
          { fig: 'plot', x: [0, 26], y: [0, 19], w: 380, h: 260, alt: 'A 23 by 17 rectangle cut into four pieces: 20 by 10, 20 by 7, 3 by 10 and 3 by 7.', cap: '23 × 17 = 200 + 140 + 30 + 21 = 391. Every trick below is a clever way of cutting the rectangle.',
            polys: [{ pts: [[0, 0], [20, 0], [20, 10], [0, 10]], tone: 'acc-soft' }, { pts: [[20, 0], [23, 0], [23, 10], [20, 10]], tone: 'ok-soft' }, { pts: [[0, 10], [20, 10], [20, 17], [0, 17]], tone: 'ok-soft' }, { pts: [[20, 10], [23, 10], [23, 17], [20, 17]], tone: 'bad-soft' }],
            xt: [[20, '20'], [23, '23']], yt: [[10, '10'], [17, '17']], segs: [[20, 0, 20, 17, 'muted'], [0, 10, 23, 10, 'muted'], [23, 0, 23, 17, 'muted'], [0, 17, 23, 17, 'muted']],
            labels: [{ x: 10, y: 5, t: '20 × 10 = 200', a: 'middle' }, { x: 21.5, y: 5, t: '30', a: 'middle' }, { x: 10, y: 13.3, t: '20 × 7 = 140', a: 'middle' }, { x: 21.5, y: 13.3, t: '21', a: 'middle' }] },
        ] },
        { h: 'The tricks', blocks: [
          `<table class="hb-table"><tr><th>Trick</th><th>Rule</th><th>Example</th></tr>
            <tr><td>Split</td><td>a(b + c) = ab + ac</td><td>47 × 6 = 240 + 42 = 282</td></tr>
            <tr><td>Round and correct</td><td>a(100 − k) = 100a − ak</td><td>49 × 76 = 3800 − 76 = 3724</td></tr>
            <tr><td>Difference of squares</td><td>(n + k)(n − k) = n² − k²</td><td>38 × 42 = 1600 − 4 = 1596</td></tr>
            <tr><td>Near a base</td><td>(100 − a)(100 − b) = 100(100 − a − b) + ab</td><td>97 × 96 = 9300 + 12 = 9312</td></tr>
            <tr><td>Ends in 5</td><td>(10a + 5)² = a(a + 1) × 100 + 25</td><td>65² = 42 then 25 = 4225</td></tr>
            <tr><td>Times 25</td><td>× 100 then ÷ 4</td><td>48 × 25 = 1200</td></tr></table>
            <p>Always finish with two checks. The <b>last digit</b>: 7 × 6 ends in 2, so 97 × 96 must end in 2. The <b>size</b>: 97 × 96 must be a little under 100 × 100. These take a second and catch nearly every slip.</p>`,
          { worked: 'near a base', q: 'Work out 93 × 96 in your head.', steps: [
            ['How far is each number from 100?', '7 and 4.'],
            ['Subtract the gaps from 100.', '100 − 7 − 4 = 89, which gives 8900.'],
            ['Now the correction: what do you add?', 'The product of the gaps: 7 × 4 = 28. Total 8928.'],
            ['Check it.', 'Last digit: 3 × 6 = 18 ends in 8 ✓. Size: a bit under 9000 ✓.'],
          ] },
          { q: '47 × 53', a: 2491, tol: { abs: 0.5 }, hint: 'They sit either side of 50.', sol: '50² − 3² = 2500 − 9 = <b>2491</b>.' },
          { q: '98 × 97', a: 9506, tol: { abs: 0.5 }, hint: 'Both are near 100: subtract both gaps from 100, then add the product of the gaps.', sol: '100 × (100 − 2 − 3) + 2 × 3 = 9500 + 6 = <b>9506</b>.' },
          { id: 'a2', q: '85²', a: 7225, tol: { abs: 0.5 }, hint: 'Ends in 5: 8 × 9, then 25.', sol: '8 × 9 = 72, then 25: <b>7225</b>.' },
          { id: 'm1', q: 'Someone says 87 × 43 = 3742. Without multiplying, what is wrong?', opts: [['Its last digit should be 1'], ['It is too small, as 87 × 43 is over 4000', 'Compare with 90 × 40 = 3600: the size looks fine.'], ['It should be even, as one factor is even', 'Both 87 and 43 are odd.'], ['Nothing, it passes both checks', 'Try the last-digit check.']], sol: '7 × 3 ends in 1, so the true answer must too. It is 3741.' },
        ] },
        { h: 'Percentages compound', blocks: [
          `<p>Percentage changes multiply rather than add. Up 20% then down 20% leaves you at 1.2 × 0.8 = 0.96: down 4%. The base changed between the two moves.</p>`,
          { fig: 'bars', vals: [100, 120, 96], labs: ['Start', 'Up 20%', 'Then down 20%'], show: ['100', '120', '96'], tone: (i) => (i === 2 ? 'bad' : ''), h: 190, w: 320, alt: 'Bars at 100, 120 and 96, showing that up 20 percent then down 20 percent ends below the start.', cap: 'A 20% fall from 120 is 24, bigger than the 20 you gained.' },
          `<p>For small changes, (1 + x)(1 + y) ≈ 1 + x + y, and the xy term is the error in just adding them. A related shortcut, the <b>rule of 72</b>: at r% a period, money doubles in about 72/r periods. It works because ln 2 ≈ 0.69 and compounding nudges it up.</p>`,
          { trap: 'Losses need bigger gains to recover. After a 50% loss you need +100% to get back, which is why risk limits matter so much more than they first appear to.' },
          { q: 'A price rises 10%, then another 10%. By what factor has it grown?', a: 1.21, hint: 'Multiply the two factors.', sol: '1.1 × 1.1 = <b>1.21</b>: up 21%, not 20%.' },
        ] },
        { h: 'Orders of magnitude', blocks: [
          `<p>Know 2<sup>10</sup> = 1024 ≈ 10³, log₁₀ 2 ≈ 0.301, log₁₀ 3 ≈ 0.477 and ln 10 ≈ 2.303. They turn big products into small sums: 2<sup>20</sup> ≈ 10⁶, and 3<sup>10</sup> = 10<sup>4.77</sup> ≈ 59,000. The number of digits of N is ⌊log₁₀ N⌋ + 1.</p>`,
          { market: 'Traders think in basis points. One bp is 0.01%, so 100 bps = 1%. A 3 bp cost on a $10m trade is $3,000: move the decimal rather than reach for a calculator.' },
          { q: 'How many digits does 2<sup>20</sup> have?', a: 7, tol: { abs: 0.5 }, hint: 'Use 2¹⁰ = 1024 and square it, or log₁₀ 2 ≈ 0.301.', sol: '2²⁰ = 1024² = 1,048,576: <b>7</b> digits. Or 20 × 0.301 = 6.02, so ⌊6.02⌋ + 1 = 7.' },
        ] },
      ],
      takeaways: ['Know the common fractions as decimals by heart; build others from them.', 'x% of y = y% of x.', 'Round-and-correct, difference of squares and near-base cover most multiplications.', 'Always check the last digit and the size.', 'Percentages multiply; 2¹⁰ ≈ 10³ and log₁₀ 2 ≈ 0.3 handle magnitudes.'],
      explain: { q: 'Why does 38 × 42 equal 40² − 4, and when is this trick available?', a: 'Multiply out (40 − 2)(40 + 2): the cross terms +80 and −80 cancel, leaving 1600 − 4. It works whenever the two numbers are the same distance either side of a number you can square easily, so their average must be round.' },
      homework: [
        { lvl: 'core', q: '73 × 67', a: 4891, tol: { abs: 0.5 }, hint: 'They sit either side of 70.', sol: '70² − 3² = 4900 − 9 = <b>4891</b>.' },
        { lvl: 'core', q: '99 × 87', a: 8613, tol: { abs: 0.5 }, hint: 'Round and correct.', sol: '8700 − 87 = <b>8613</b>.' },
        { lvl: 'core', q: 'Write 5/8 as a decimal.', a: 0.625, hint: 'Five eighths.', sol: '5 × 0.125 = <b>0.625</b>.' },
        { lvl: 'core', q: '35²', a: 1225, tol: { abs: 0.5 }, hint: '3 × 4, then 25.', sol: '<b>1225</b>.' },
        { lvl: 'core', q: 'A stock falls 25%. As a fraction, what rise takes it back to where it started?', a: 1 / 3, tol: { abs: 0.005 }, hint: 'Start at 100. It falls to 75. What must 75 gain?', sol: '25/75 = <b>1/3</b>, about 33%.' },
        { lvl: 'interview', q: 'How many digits does 3<sup>20</sup> have? No calculator.', a: 10, tol: { abs: 0.5 }, hint: 'log₁₀ 3 ≈ 0.477.', sol: '20 × 0.477 = 9.54, so ⌊9.54⌋ + 1 = <b>10</b>.' },
        { lvl: 'interview', q: 'You pay 8 bps on a $25m trade. What is the cost in dollars?', a: 20000, tol: { abs: 0.5 }, hint: '1 bp of $25m is $2,500.', sol: '8 × $2,500 = <b>$20,000</b>.' },
        { lvl: 'stretch', q: 'Estimate 1.02<sup>35</sup> to one decimal place using the rule of 72.', a: 1.02 ** 35, tol: { abs: 0.1 }, hint: 'How long does 2% take to double?', sol: '72/2 = 36 periods to double, and 35 is about that, so roughly <b>2</b>. (Exactly 1.9999.)' },
        { lvl: 'lab', q: 'Start the habit: play one two-minute Zetamac game a day this week and write down each score. Which operation slowed you down most?', sol: 'Most people lose time on subtraction with borrowing and two-digit multiplication. Open Mental maths in the app, and use Flow training to find your own slowest kinds.' },
      ],
      practice: [['Speed tricks', '#/tricks'], ['Zetamac', '#/mental'], ['Flow training', '#/mental/flow']],
    },

    toolkit: {
      title: 'The maths toolkit', minutes: 50,
      why: 'Later chapters need a little algebra and calculus: logs for returns, geometric series for repeated games, derivatives for optimal bets, and matrices for portfolios. If it is fresh, skim this. If it is rusty, this is the chapter that stops you getting stuck later.',
      goals: ['Use exponentials and logs fluently, including log returns', 'Sum arithmetic and geometric series', 'Maximise a function with a derivative', 'Integrate simple functions and read an integral as an area', 'Multiply a matrix by a vector and write a quadratic form'],
      prereq: ['arith'],
      sections: [
        { h: 'Exponentials and logs', blocks: [
          `<p>A logarithm undoes an exponential: ln(e<sup>x</sup>) = x. The rule that matters is that logs turn products into sums:</p>
           <div class="hb-eq">ln(ab) = ln a + ln b &nbsp;&nbsp; ln(a<sup>k</sup>) = k ln a &nbsp;&nbsp; ln(1 + x) ≈ x for small x</div>
           <p>That's why traders use <b>log returns</b>. If a price goes from P₀ to P₁ to P₂, the simple returns compound by multiplying, but the log returns just add: ln(P₂/P₀) = ln(P₂/P₁) + ln(P₁/P₀).</p>`,
          { fig: 'plot', x: [-2, 4], y: [-2, 5], xt: [-2, 0, 2, 4], yt: [-2, 0, 2, 4], fns: [{ f: Math.exp, tone: 'acc' }, { f: Math.log, from: 0.05, tone: 'ok' }, { f: (x) => x, tone: 'muted', dash: true }], labels: [{ x: 1.6, y: 4.5, t: 'eˣ', tone: 'acc' }, { x: 3, y: 0.6, t: 'ln x', tone: 'ok' }, { x: 3.4, y: 3.9, t: 'y = x' }], alt: 'The curves e to the x and natural log of x, mirror images in the line y equals x.', cap: 'ln and e<sup>x</sup> are mirror images in the line y = x, because each undoes the other.' },
          { q: 'What is ln(e³ × e⁴)?', a: 7, hint: 'Exponents add, or logs add.', sol: 'ln(e⁷) = <b>7</b>.' },
          { q: 'A stock returns +10% then −10% in simple terms. What is the sum of its log returns, to 3 decimal places?', a: Math.log(1.1) + Math.log(0.9), tol: { abs: 0.002 }, hint: 'ln(1.1 × 0.9) = ln(0.99).', sol: 'ln 0.99 ≈ <b>−0.010</b>: negative, even though the simple returns seem to cancel.' },
        ] },
        { h: 'Series you need', blocks: [
          `<p>Two sums appear everywhere.</p>
           <div class="hb-eq">1 + 2 + … + n = n(n + 1)/2<br>1 + r + r² + … = 1/(1 − r), for |r| &lt; 1</div>
           <p>The geometric series is what you get whenever a game can repeat with probability r. The picture proves the case r = ½: keep halving what's left of a unit square, and you fill it.</p>`,
          { fig: 'plot', x: [0, 1], y: [0, 1], w: 240, h: 240, polys: [{ pts: [[0, 0], [0.5, 0], [0.5, 1], [0, 1]], tone: 'acc-soft' }, { pts: [[0.5, 0], [1, 0], [1, 0.5], [0.5, 0.5]], tone: 'ok-soft' }, { pts: [[0.5, 0.5], [0.75, 0.5], [0.75, 1], [0.5, 1]], tone: 'bad-soft' }, { pts: [[0.75, 0.5], [1, 0.5], [1, 0.75], [0.75, 0.75]], tone: 'acc-soft' }, { pts: [[0.75, 0.75], [0.875, 0.75], [0.875, 1], [0.75, 1]], tone: 'ok-soft' }], labels: [{ x: 0.25, y: 0.48, t: '½', a: 'middle' }, { x: 0.75, y: 0.22, t: '¼', a: 'middle' }, { x: 0.625, y: 0.72, t: '⅛', a: 'middle' }], alt: 'A unit square cut into a half, a quarter, an eighth and so on.', cap: '½ + ¼ + ⅛ + … = 1.' },
          { proof: 'Let S = 1 + r + r² + …. Then rS = r + r² + …, so S − rS = 1 and S = 1/(1 − r). The series only makes sense when |r| &lt; 1, since otherwise the terms don\'t shrink.' },
          { worked: true, q: 'You and a friend take turns to flip a coin, you first. The first head wins. What is your chance of winning?', steps: [
            ['In which rounds can you win?', 'On flip 1, 3, 5, and so on.'],
            ['What is the chance you win on each?', '½ on flip 1, then (½)³ on flip 3, because two tails must come first, then (½)⁵, and so on.'],
            ['This is geometric: what are the first term and ratio?', 'First term ½, ratio ¼.'],
            'The total is (½)/(1 − ¼) = 2/3.',
          ] },
          { q: 'What is 1 + 2 + … + 100?', a: 5050, tol: { abs: 0.5 }, hint: 'n(n + 1)/2.', sol: '100 × 101/2 = <b>5050</b>.' },
          { q: 'What is 1 + ⅓ + (⅓)² + …?', a: 1.5, hint: '1/(1 − r).', sol: '1/(2/3) = <b>1.5</b>.' },
          { opts: [['The series has no finite sum'], ['It equals 1/(1 − 1.1) = −10', 'A sum of positive terms can\'t be negative. The formula doesn\'t apply here.'], ['It equals 11', 'The terms grow, so the sum never settles.'], ['Series can\'t have a ratio above 1', 'They can, but then they diverge.']], q: 'A friend says 1 + 1.1 + 1.1² + … = −10. What went wrong?', sol: 'The formula is only valid when the terms shrink. Here they grow without limit, so the sum is infinite.' },
        ] },
        { h: 'Derivatives find the best choice', blocks: [
          `<p>The derivative f′(x) is the slope of f at x. At the top of a smooth hill the slope is zero, so to maximise f, solve f′(x) = 0 and check it's a maximum (f″ &lt; 0). You'll use this for the Kelly bet, least squares and maximum likelihood.</p>
           <div class="hb-eq">(xⁿ)′ = n xⁿ⁻¹ &nbsp;&nbsp; (eˣ)′ = eˣ &nbsp;&nbsp; (ln x)′ = 1/x &nbsp;&nbsp; (f(g(x)))′ = f′(g(x)) g′(x)</div>`,
          { fig: 'plot', x: [0, 1], y: [0, 0.3], xt: [0, 0.5, 1], yt: [0, 0.1, 0.2], xl: 'x', fns: [{ f: (x) => x * (1 - x) }], segs: [[0.3, 0.25, 0.7, 0.25, 'ok']], pts: [{ x: 0.5, y: 0.25, tone: 'ok' }], labels: [{ x: 0.52, y: 0.27, t: 'slope is zero at the top', tone: 'ok' }], alt: 'The curve x times 1 minus x, with a flat tangent at its peak at x equals one half.', cap: 'f(x) = x(1 − x) has f′(x) = 1 − 2x, which is zero at x = ½. That\'s why a coin with p = ½ has the largest variance.' },
          { q: 'Where does f(x) = 6x − x² reach its maximum?', a: 3, hint: 'Set f′(x) = 6 − 2x to zero.', sol: '6 − 2x = 0, so x = <b>3</b>.' },
          { q: 'What is the derivative of ln(1 + 2x) at x = 0?', a: 2, hint: 'Chain rule: 2/(1 + 2x).', sol: '2/(1 + 0) = <b>2</b>.' },
        ] },
        { h: 'Integrals are areas', blocks: [
          `<p>∫ₐᵇ f(x) dx is the area under f between a and b, and undoes differentiation: ∫ xⁿ dx = xⁿ⁺¹/(n + 1). For a continuous random variable, probabilities are areas under its density, so this is how we'll compute them.</p>`,
          { fig: 'plot', x: [0, 1.1], y: [0, 1.2], xt: [0, 1], yt: [0, 1], fns: [{ f: (x) => x * x }], area: [{ f: (x) => x * x, from: 0, to: 1 }], labels: [{ x: 0.73, y: 0.16, t: 'area = 1/3', a: 'middle' }], alt: 'The area under x squared from 0 to 1, which equals one third.', cap: '∫₀¹ x² dx = [x³/3]₀¹ = 1/3.' },
          { q: 'What is ∫₀² 3x² dx?', a: 8, hint: 'The antiderivative is x³.', sol: '2³ − 0 = <b>8</b>.' },
        ] },
        { h: 'Vectors and matrices', blocks: [
          `<p>A vector is a list of numbers: a portfolio's weights w, or its stocks' returns r. The dot product w·r = Σ wᵢrᵢ is the portfolio's return. A matrix is a table of numbers that turns a vector into another vector: each output entry is the dot product of one row with the input.</p>
           <div class="hb-eq">[1 2; 3 4] × [5, 6] = [1×5 + 2×6, 3×5 + 4×6] = [17, 39]</div>
           <p>The form you'll use most is the <b>quadratic form</b> wᵀΣw, which is the variance of a portfolio with covariance matrix Σ. Work it out once for two assets and it stops being mysterious:</p>
           <div class="hb-eq">[w₁ w₂] [σ₁² c; c σ₂²] [w₁, w₂] = w₁²σ₁² + w₂²σ₂² + 2w₁w₂c</div>
           <p>An <b>eigenvector</b> v of a matrix A is a direction that A only stretches: Av = λv, where the number λ is its eigenvalue. The next chapter goes further, and the correlation matrices chapter uses this to find the main sources of risk in a market.</p>`,
          { q: 'What is the dot product of [0.5, 0.5] and [0.04, 0.02]?', a: 0.03, hint: 'Multiply pairs, then add.', sol: '0.02 + 0.01 = <b>0.03</b>: the portfolio returned 3%.' },
          { q: 'Weights [1, 1] and covariance matrix [4 1; 1 9]. What is wᵀΣw?', a: 15, hint: 'Add up every entry of the matrix.', sol: '4 + 9 + 2 × 1 = <b>15</b>.' },
          { opts: [['2, as Av = 2v'], ['[2, 2]: the eigenvalue is the output', 'That\'s the output vector. The eigenvalue is the number multiplying v.'], ['1: the entries of v are 1', 'Compare Av with v.'], ['4: the sum of the output', 'Compare Av with v.']], q: 'A = [2 0; 0 2] and v = [1, 1]. What is the eigenvalue for v?', sol: 'Av = [2, 2] = 2v, so λ = 2.' },
        ] },
      ],
      takeaways: ['Logs turn products into sums, so log returns add.', 'n(n + 1)/2 and 1/(1 − r) cover most sums.', 'Maximise by setting the derivative to zero.', 'Integrals are areas, and ∫xⁿ dx = xⁿ⁺¹/(n + 1).', 'A portfolio\'s return is w·r and its variance is wᵀΣw.'],
      explain: { q: 'Why do traders add log returns, but have to multiply simple returns?', a: 'Wealth grows by multiplying (1 + return) factors. Taking logs turns that product into a sum, so log returns over consecutive periods simply add, which also makes their averages and variances easier to work with.' },
      homework: [
        { lvl: 'core', q: 'A price goes from 100 to 130. To 3 decimal places, what is the log return?', a: Math.log(1.3), tol: { abs: 0.002 }, hint: 'ln(130/100).', sol: 'ln 1.3 ≈ <b>0.262</b>, smaller than the simple return of 0.30.' },
        { lvl: 'core', q: 'What is 2 + 4 + 6 + … + 200?', a: 10100, tol: { abs: 0.5 }, hint: 'Take out a factor of 2.', sol: '2 × (1 + … + 100) = 2 × 5050 = <b>10,100</b>.' },
        { lvl: 'core', q: 'A game pays $1 now, and then continues with probability 0.9, paying $1 each round. What is its expected total?', a: 10, hint: '1 + 0.9 + 0.9² + …', sol: '1/(1 − 0.9) = <b>$10</b>.' },
        { lvl: 'core', q: 'Find the x that maximises f(x) = −x ln x on (0, 1). Give it to 3 decimal places.', a: 1 / Math.E, tol: { abs: 0.002 }, hint: 'f′(x) = −ln x − 1.', sol: 'ln x = −1, so x = 1/e ≈ <b>0.368</b>. You\'ll meet 1/e again in the secretary problem.' },
        { lvl: 'core', q: 'What is ∫₀¹ (x + x²) dx? Give a fraction or decimal.', a: 5 / 6, tol: { abs: 0.002 }, hint: 'Integrate term by term.', sol: '½ + ⅓ = <b>5/6</b>.' },
        { lvl: 'interview', q: 'Two assets have variances 0.04 and 0.09 and covariance 0.01. Weights are 0.5 each. What is the portfolio variance?', a: 0.0375, hint: 'w₁²σ₁² + w₂²σ₂² + 2w₁w₂c.', sol: '0.25 × 0.04 + 0.25 × 0.09 + 2 × 0.25 × 0.01 = 0.01 + 0.0225 + 0.005 = <b>0.0375</b>.' },
        { lvl: 'stretch', q: 'Prove that 1 + 2r + 3r² + 4r³ + … = 1/(1 − r)² for |r| &lt; 1. Use it to find the mean of a geometric distribution with p = ½.', sol: 'Differentiate 1 + r + r² + … = 1/(1 − r) with respect to r. The left side becomes 1 + 2r + 3r² + …, and the right 1/(1 − r)². The mean is Σ k p(1 − p)ᵏ⁻¹ = p/(1 − (1 − p))² = 1/p, which is 2 when p = ½.' },
      ],
      practice: [['Formula cards', '#/flashcards'], ['Returns, risk and sizing', '#/topic/finance']],
    },

    counting: {
      title: 'Counting', minutes: 45,
      why: 'Half of probability is counting: how many outcomes are there, and how many do you want? Counting well is mostly a matter of asking whether order matters and whether things can repeat.',
      goals: ['Count arrangements with the multiplication rule', 'Know when order matters: permutations v combinations', 'Use complements, repeated items and stars and bars', 'Count poker hands without getting lost'],
      prereq: ['arith'],
      sections: [
        { h: 'The multiplication rule', blocks: [
          `<p>If a choice happens in stages, with a ways for the first stage and b for the second (whatever the first was), there are a × b outcomes in total. A 3-letter code has 26 × 26 × 26 possibilities; a 3-letter code with <i>no repeated letter</i> has 26 × 25 × 24.</p>`,
          { fig: 'tree', root: { kids: [{ t: 'A', kids: [{ t: 'AA' }, { t: 'AB' }, { t: 'AC' }] }, { t: 'B', kids: [{ t: 'BA' }, { t: 'BB' }, { t: 'BC' }] }] }, colW: 100, rowH: 26, leafW: 60, alt: 'A tree with two first choices, each leading to three second choices, for six leaves.', cap: 'Two first choices times three second choices: six paths. Every leaf is one outcome.' },
          { widget: 'counting' },
          { q: 'How many 3-letter codes can be made from 26 letters if letters may repeat?', a: 17576, tol: { abs: 0.5 }, hint: 'Three stages, 26 choices each.', sol: '26³ = <b>17,576</b>.' },
        ] },
        { h: 'Permutations: order matters', blocks: [
          `<p>Arranging n different things in a row: n! = n × (n − 1) × … × 1 ways. Choosing an ordered list of k from n: n × (n − 1) × … × (n − k + 1) = n!/(n − k)!.</p>`,
          { q: 'In how many ways can gold, silver and bronze go to 8 runners?', a: 336, tol: { abs: 0.5 }, hint: '8 choices for gold, then 7, then 6.', sol: '8 × 7 × 6 = <b>336</b>.' },
        ] },
        { h: 'Combinations: order doesn\'t matter', blocks: [
          `<p>Choosing a <i>set</i> of k from n: C(n, k) = n!/(k!(n − k)!). Each set of k appears k! times among the ordered lists, which is why we divide by k!.</p>
           <p>Useful facts: C(n, k) = C(n, n − k), since choosing who's in is choosing who's out, and C(n, 2) = n(n − 1)/2 counts pairs.</p>`,
          { fig: 'strip', cell: 34, labelW: 92, rows: [{ label: 'ordered lists', cells: ['A', 'B', { gap: true }, 'B', 'A', { gap: true }, 'A', 'C', { gap: true }, 'C', 'A', { gap: true }, 'B', 'C', { gap: true }, 'C', 'B'] }, { label: 'sets', cells: [{ t: 'A', tone: 'acc' }, { t: 'B', tone: 'acc' }, { gap: true }, { gap: true }, { gap: true }, { gap: true }, { t: 'A', tone: 'acc' }, { t: 'C', tone: 'acc' }, { gap: true }, { gap: true }, { gap: true }, { gap: true }, { t: 'B', tone: 'acc' }, { t: 'C', tone: 'acc' }] }], wide: true, alt: 'Six ordered pairs from A, B and C collapse into three unordered sets.', cap: 'Each set of 2 appears 2! times among the ordered pairs: 6/2 = 3 = C(3, 2).' },
          { q: 'Six people each shake hands once with everyone else. How many handshakes?', a: 15, tol: { abs: 0.5 }, hint: 'Each handshake is a pair of people.', sol: 'C(6, 2) = 6 × 5/2 = <b>15</b>.' },
          { id: 'a1', q: 'How many 5-card hands are there from a 52-card deck?', a: 2598960, tol: { abs: 0.5 }, hint: 'C(52, 5). Work it out as (52 × 51 × 50 × 49 × 48)/120.', sol: 'C(52, 5) = <b>2,598,960</b>. Worth remembering.' },
          { id: 'm1', q: 'A committee of 3 is picked from 10 people. Then a chair is picked from the committee. Which product counts the outcomes?', opts: [['C(10, 3) × 3'], ['10 × 9 × 8', 'That treats all three roles as different, but only the chair is special.'], ['C(10, 3)', 'That leaves out the choice of chair.'], ['C(10, 3) × 3!', 'That orders all three members.']], sol: 'Choose the set, then the chair: 120 × 3 = 360. Also 10 × C(9, 2) = 360, picking the chair first: a nice check.' },
        ] },
        { h: 'Repeated items', blocks: [
          `<p>To arrange items where some are identical, count as if all were different, then divide by the ways of shuffling the identical ones among themselves. MISSISSIPPI: 11!/(4! 4! 2!).</p>`,
          { q: 'How many distinct arrangements are there of the letters of BANANA?', a: 60, tol: { abs: 0.5 }, hint: '6 letters: three As and two Ns.', sol: '6!/(3! 2!) = 720/12 = <b>60</b>.' },
        ] },
        { h: 'Stars and bars', blocks: [
          `<p>Splitting n identical items among k people (zero allowed) is the same as arranging n stars and k − 1 bars in a row. The bars mark where one person's share ends.</p>`,
          { fig: 'strip', cell: 26, rows: [{ cells: ['★', '★', '★', { t: '|', tone: 'acc' }, '★', { t: '|', tone: 'acc' }, '★', '★', '★'] }], alt: 'Seven stars and two bars, giving shares of 3, 1 and 3.', cap: '7 coins, 3 people: this row means shares of 3, 1 and 3. Every arrangement of 7 stars and 2 bars is one split, so there are C(9, 2) = 36.' },
          `<p>So the count is C(n + k − 1, k − 1). If everyone must get at least one, give each person one first, leaving n − k to split freely: C(n − 1, k − 1).</p>`,
          { q: 'In how many ways can 10 identical coins be split among 3 people (someone may get none)?', a: 66, tol: { abs: 0.5 }, hint: '10 stars and 2 bars.', sol: 'C(12, 2) = <b>66</b>.' },
          { id: 'a2', q: 'And if each person must get at least one coin?', a: 36, tol: { abs: 0.5 }, hint: 'Hand out one each, then split the remaining 7.', sol: 'C(9, 2) = <b>36</b>.' },
        ] },
        { h: 'Count the complement', blocks: [
          `<p>"At least one" is usually easiest as "all outcomes minus none". PINs with at least one repeated digit = all PINs − PINs with all digits different.</p>`,
          { q: 'How many 4-digit PINs (0000 to 9999) have at least one repeated digit?', a: 4960, tol: { abs: 0.5 }, hint: 'Subtract the PINs with four different digits from 10,000.', sol: '10,000 − 10 × 9 × 8 × 7 = 10,000 − 5,040 = <b>4,960</b>.' },
        ] },
        { h: 'Counting poker hands', blocks: [
          `<p>Hands are the classic test of careful counting, and the safest method is to build the hand in stages, one decision at a time, and ask at each stage whether order matters.</p>`,
          { worked: 'a full house', q: 'How many 5-card hands are a full house (three of one rank, two of another)?', steps: [
            ['Stage 1: choose the rank of the triple. How many ways?', '13.'],
            ['Stage 2: choose 3 of its 4 suits.', 'C(4, 3) = 4.'],
            ['Stage 3: choose the rank of the pair. Why is this not C(12, 2)?', 'We need one rank from the remaining 12, so 12. The triple and the pair have different roles, so rank order matters here.'],
            ['Stage 4: choose 2 of its 4 suits.', 'C(4, 2) = 6.'],
            'Multiply the stages: 13 × 4 × 12 × 6 = 3,744 hands. That\'s about 0.14% of all hands.',
          ] },
          { trap: 'Double counting. For two pair, the two pair ranks play the same role, so choose them together with C(13, 2). Choosing 13 × 12 counts every hand twice. Ask: could I build the same hand in two ways?' },
          { id: 'a3', q: 'How many 5-card hands are two pair (two ranks with a pair each, and a fifth card of another rank)?', a: 123552, tol: { abs: 0.5 }, hint: 'C(13, 2) for the ranks, 6 suits for each pair, then 44 for the fifth card.', sol: 'C(13, 2) × 6 × 6 × 44 = 78 × 36 × 44 = <b>123,552</b>.' },
        ] },
      ],
      takeaways: ['Stages multiply.', 'Order matters: n!/(n − k)!. It doesn\'t: divide again by k!.', 'Identical items: divide by their internal arrangements.', 'Identical items into boxes: stars and bars.', '"At least one": count the complement.', 'Same role means choose together; different roles means choose in turn.'],
      explain: { q: 'Why do we divide by k! to get from ordered lists to combinations?', a: 'Every set of k items can be written in k! different orders, so each set is counted exactly k! times among the ordered lists. Dividing by k! counts each set once.' },
      homework: [
        { lvl: 'core', q: 'How many ways can 5 people sit in a row?', a: 120, tol: { abs: 0.5 }, hint: '5!', sol: '<b>120</b>.' },
        { lvl: 'core', q: 'How many ways can 5 people sit around a round table, if rotations count as the same?', a: 24, tol: { abs: 0.5 }, hint: 'Fix one person, then arrange the rest.', sol: '4! = <b>24</b>.' },
        { lvl: 'core', q: 'How many distinct arrangements are there of the letters T, O, O, T?', a: 6, tol: { abs: 0.5 }, hint: '4!/(2! 2!).', sol: '24/4 = <b>6</b>.' },
        { lvl: 'core', q: 'How many 5-card hands contain exactly 3 hearts?', a: 211926, tol: { abs: 0.5 }, hint: 'Choose the hearts, then the non-hearts.', sol: 'C(13, 3) × C(39, 2) = 286 × 741 = <b>211,926</b>.' },
        { lvl: 'core', q: 'How many non-negative whole solutions does a + b + c + d = 6 have?', a: 84, tol: { abs: 0.5 }, hint: '6 stars and 3 bars.', sol: 'C(9, 3) = <b>84</b>.' },
        { lvl: 'interview', q: 'Three dice are rolled. How many of the 216 outcomes have all three faces different?', a: 120, tol: { abs: 0.5 }, hint: '6 × 5 × 4.', sol: '<b>120</b>.' },
        { lvl: 'interview', q: 'How many 5-card hands are a flush, including straight flushes?', a: 5148, tol: { abs: 0.5 }, hint: 'Choose the suit, then 5 of its 13 cards.', sol: '4 × C(13, 5) = 4 × 1287 = <b>5,148</b>.' },
        { lvl: 'stretch', q: 'Prove C(n, k) = C(n − 1, k − 1) + C(n − 1, k) by a counting argument, without algebra.', sol: 'Single out one person, Alice, from the n. A committee of k either includes her (choose the other k − 1 from n − 1) or doesn\'t (choose all k from n − 1). Those cases are separate and cover everything, so the counts add. This is the rule behind Pascal\'s triangle.' },
        { lvl: 'lab', q: 'Deal yourself 30 five-card hands from a real deck and count how many contain at least one pair. Then work out the exact chance: 1 − (no pair) = 1 − [C(13, 5) × 4⁵]/C(52, 5). How close were you?', sol: 'No pair: 1287 × 1024 = 1,317,888 of 2,598,960 hands, or 50.7%. So at least a pair (including anything better) is about 49.3%, which is about 15 of your 30 hands.' },
      ],
      practice: [['Combinatorics interview questions', '#/search/combinatorics'], ['Cards topic', '#/topic/cards']],
    },

    'prob-basics': {
      title: 'Probability basics', minutes: 45,
      why: 'Probability is a language for uncertainty, and trading is the business of putting a price on uncertainty. These few rules underlie everything else in this handbook.',
      goals: ['Turn a problem into equally likely outcomes', 'Use the complement, addition and multiplication rules', 'Tell independent events from mutually exclusive ones'],
      prereq: ['counting'],
      sections: [
        { h: 'Sample spaces and equally likely outcomes', blocks: [
          `<p>A <b>sample space</b> is the list of everything that could happen, and an <b>event</b> is a subset of it. When every outcome is equally likely, P(event) = (outcomes in the event)/(all outcomes).</p>
           <p>The skill is choosing outcomes that really <i>are</i> equally likely. With two dice, use the 36 ordered pairs (first die, second die), not the 11 totals: a total of 7 can happen 6 ways, a total of 2 only 1 way.</p>`,
          { fig: 'dice', mark: (a, b) => (a + b === 7 ? 'acc' : ''), show: (a, b) => a + b, alt: 'A six by six grid of two-dice outcomes with the six cells that total 7 highlighted.', cap: 'The 36 outcomes, labelled with their totals. The six that total 7 run along a diagonal.' },
          { widget: 'dice', predict: { q: 'You roll two dice 10,000 times. Which total comes up most often, and roughly how often?', opts: ['7, about 1 time in 6', '7, about 1 time in 11', 'All totals equally often', '6 and 8 tie for first'], then: 'Now roll them and see.' } },
          { q: 'Two dice are rolled. What is the probability their total is 7?', a: 1 / 6, hint: 'Count the ordered pairs that add to 7.', sol: '6 of the 36 pairs: (1,6), (2,5), …, (6,1). <b>1/6</b>.' },
          { q: 'Two dice: what is the probability they show the same number?', a: 1 / 6, hint: 'Whatever the first die shows, what must the second do?', sol: 'The second die must match the first: <b>1/6</b>.' },
          { id: 'm1', q: 'Two coins are flipped. Someone says the outcomes are "0, 1 or 2 heads", so P(1 head) = 1/3. What is wrong?', opts: [['The three aren\'t equally likely'], ['There are four totals, not three', 'There are three totals. Are they equally likely?'], ['Coins are not independent', 'They are.'], ['Nothing, 1/3 is right', 'List HH, HT, TH, TT.']], sol: 'The equally likely outcomes are HH, HT, TH and TT. One head covers two of them, so P = 1/2.' },
        ] },
        { h: 'The complement rule', blocks: [
          `<p>P(not A) = 1 − P(A). It turns "at least one" problems into "none" problems, which usually multiply cleanly.</p>`,
          { q: 'You roll a die 4 times. What is the probability of at least one six?', a: 1 - (5 / 6) ** 4, tol: { abs: 0.002 }, hint: 'Find the chance of no sixes in 4 rolls first.', sol: '1 − (5/6)⁴ = 1 − 625/1296 ≈ <b>0.518</b>. (Slightly better than evens: a famous 17th-century gambling bet.)' },
          { worked: 'the birthday problem', q: 'How many people must be in a room for a shared birthday to be more likely than not? Assume 365 equally likely birthdays.', steps: [
            ['"Some pair matches" is messy. What is its complement?', 'Everyone has a different birthday.'],
            ['Line people up. What is the chance each new person misses everyone before them?', '364/365 for the second, 363/365 for the third, and so on.'],
            'So P(no match among n) = (364/365)(363/365)…((366 − n)/365).',
            ['Why does it drop faster than you\'d expect?', 'Because it counts pairs, not people: 23 people make C(23, 2) = 253 pairs, each a chance of 1/365.'],
            'At n = 23 the product falls just below ½, so <b>23 people</b> is enough.',
          ] },
        ] },
        { h: 'The addition rule', blocks: [
          `<p>P(A or B) = P(A) + P(B) − P(A and B). Subtract the overlap, or you count it twice. If A and B can't both happen (<b>mutually exclusive</b>), the overlap is zero.</p>`,
          { fig: 'venn', a: 'Hearts', b: 'Kings', both: 'K♥', shade: 'union', out: '52 cards', alt: 'Two overlapping circles for hearts and kings, with the king of hearts in the overlap.', cap: 'Add hearts and kings, and the king of hearts gets counted twice, so take it off once.' },
          { q: 'A card is drawn from a standard deck. What is the probability it is a heart or a king?', a: 4 / 13, hint: '13 hearts, 4 kings, and one card is both.', sol: '(13 + 4 − 1)/52 = 16/52 = <b>4/13</b>.' },
        ] },
        { h: 'Independence', blocks: [
          `<p>A and B are <b>independent</b> if knowing one happened doesn't change the chance of the other; then P(A and B) = P(A) × P(B).</p>`,
          { trap: 'Independent is not the same as mutually exclusive. Two events that can\'t happen together are very dependent: if one happens, the other certainly didn\'t.' },
          { q: 'A fair coin is flipped three times. What is the probability of heads, heads, tails, in that order?', a: 1 / 8, hint: 'Flips are independent: multiply.', sol: '(½)³ = <b>1/8</b>.' },
          { q: 'Three flips: what is the probability of at least one head?', a: 7 / 8, hint: 'Complement.', sol: '1 − (½)³ = <b>7/8</b>.' },
          { id: 'm2', q: 'A fair coin lands heads five times in a row. What is the chance of heads on the next flip?', opts: [['1/2: no memory'], ['Less than 1/2: tails is due', 'That\'s the gambler\'s fallacy. Past flips don\'t affect the next one.'], ['1/64', 'That\'s the chance of six heads in a row, before any flips.'], ['1/32', 'That\'s the chance of the five heads you already saw.']], sol: 'If the coin is fair, the flips are independent. (After 50 heads in a row, though, you\'d start to doubt it is fair. That\'s Bayes, in the next chapter.)' },
        ] },
      ],
      takeaways: ['Pick outcomes that are genuinely equally likely (ordered pairs, not totals).', '"At least one": 1 − P(none).', 'Or: add, then subtract the overlap.', 'Independent ≠ mutually exclusive.', 'Coins have no memory.'],
      explain: { q: 'Explain the difference between mutually exclusive and independent, using one card example of each.', a: '"Heart" and "club" on one card are mutually exclusive: both can\'t happen, so knowing one tells you the other didn\'t. "Heart" and "king" are independent: P(heart | king) = 1/4 = P(heart), so knowing the rank tells you nothing about the suit.' },
      homework: [
        { lvl: 'core', q: 'Two dice: what is the probability the total is at least 10?', a: 1 / 6, tol: { abs: 0.002 }, hint: 'Count totals of 10, 11 and 12.', sol: '3 + 2 + 1 = 6 of 36: <b>1/6</b>.' },
        { lvl: 'core', q: 'Two dice: what is the probability that at least one shows a 6?', a: 11 / 36, tol: { abs: 0.002 }, hint: 'Complement.', sol: '1 − (5/6)² = <b>11/36</b>.' },
        { lvl: 'core', q: 'A card is drawn. What is the probability it is a red card or a face card (J, Q, K)?', a: 8 / 13, tol: { abs: 0.002 }, hint: '26 red, 12 faces, 6 are both.', sol: '(26 + 12 − 6)/52 = 32/52 = <b>8/13</b>.' },
        { lvl: 'core', q: 'A coin is flipped 10 times. What is the probability that all ten flips match?', a: 2 / 1024, tol: { abs: 0.0002 }, hint: 'Two outcomes of 2¹⁰.', sol: '2/1024 = <b>1/512</b>.' },
        { lvl: 'interview', q: 'Three cards are drawn without replacement. What is the probability they are all of different suits?', a: (52 * 39 * 26) / (52 * 51 * 50), tol: { abs: 0.002 }, hint: 'The first card can be anything. How many cards suit the second, then the third?', sol: '(39/51) × (26/50) ≈ <b>0.398</b>.' },
        { lvl: 'interview', q: 'What is the probability that 2 people out of 5 share a birth month, assuming 12 equally likely months?', a: 1 - (11 * 10 * 9 * 8) / 12 ** 4, tol: { abs: 0.002 }, hint: 'Complement: all five months differ.', sol: '1 − (11/12)(10/12)(9/12)(8/12) ≈ <b>0.618</b>.' },
        { lvl: 'stretch', q: 'Show that if A and B are independent, so are A and "not B".', sol: 'P(A) = P(A and B) + P(A and not B). So P(A and not B) = P(A) − P(A)P(B) = P(A)(1 − P(B)) = P(A)P(not B).' },
        { lvl: 'lab', q: 'Flip a coin 100 times and write the sequence down. Find your longest run of heads or tails. Now write a sequence of 100 "fake" flips out of your head, on another day. Which has the longer runs?', sol: 'Real sequences of 100 flips usually have a run of 6 or more. People faking randomness alternate too much and avoid long runs. It\'s a reminder that streaks in noise are normal, which matters when you judge a trader or a signal.' },
      ],
      practice: [['Dice topic', '#/topic/dice'], ['Cards topic', '#/topic/cards'], ['Probability interview questions', '#/search/probability']],
    },

    conditional: {
      title: 'Conditional probability and Bayes', minutes: 50,
      why: 'Trading is updating beliefs. Every trade you see, and every number that prints, is evidence. Bayes tells you exactly how far that evidence should move you, which is why it matters more than any other idea in this part.',
      goals: ['Compute P(A | B) by shrinking the sample space', 'Use trees and the law of total probability', 'Update beliefs with Bayes, in natural frequencies and in odds', 'Avoid the base-rate fallacy'],
      prereq: ['prob-basics'],
      sections: [
        { h: 'Conditioning shrinks the world', blocks: [
          `<p>P(A | B) = P(A and B)/P(B): restrict attention to the outcomes where B happened, and ask what fraction of those also have A.</p>`,
          { fig: 'dice', mark: (a, b) => (a + b === 8 ? (a % 2 === 0 ? 'ok' : 'acc') : ''), show: (a, b) => a + b, alt: 'The two-dice grid with the five cells that total 8 highlighted, three of which have both dice even.', cap: 'Given a total of 8, only 5 cells remain. Your world is now those cells.' },
          { q: 'Two dice sum to 8. What is the probability both are even?', a: 3 / 5, hint: 'List the ordered pairs that sum to 8.', sol: 'Pairs summing to 8: (2,6), (3,5), (4,4), (5,3), (6,2). Both even: 3 of these 5. <b>3/5</b>.' },
          { trap: 'P(A | B) is not P(B | A). The chance that a winning trader had a good system isn\'t the chance a good system wins. Confusing them is the most common error in reasoning about evidence.' },
        ] },
        { h: 'Trees: multiply along branches', blocks: [
          `<p>P(A and B) = P(A) × P(B | A). For draws without replacement, each stage's probability depends on what came before.</p>`,
          { q: 'Two cards are dealt from a shuffled deck. What is the probability both are aces?', a: 1 / 221, tol: { abs: 0.0002 }, hint: 'First an ace (4 of 52), then an ace from what is left.', sol: '(4/52)(3/51) = 12/2652 = <b>1/221</b>.' },
        ] },
        { h: 'The law of total probability', blocks: [
          `<p>If one of several situations must hold, P(A) = Σ P(situation) × P(A | situation). Example: urn X holds 2 red and 1 blue ball, urn Y holds 1 red and 3 blue. Pick an urn at random, then a ball.</p>`,
          { fig: 'tree', colW: 90, leafW: 130, root: { kids: [{ p: '1/2', t: 'X', kids: [{ p: '2/3', t: 'red', tone: 'bad' }, { p: '1/3', t: 'blue' }] }, { p: '1/2', t: 'Y', kids: [{ p: '1/4', t: 'red', tone: 'bad' }, { p: '3/4', t: 'blue' }] }] }, alt: 'A tree: pick urn X or Y with probability one half, then a red or blue ball.', cap: 'Multiply along a path, and add the paths that end in what you want.' },
          { q: 'In that set-up, what is the probability of drawing red?', a: 11 / 24, hint: 'Average the two urns\' chances of red.', sol: '½ × 2/3 + ½ × 1/4 = 1/3 + 1/8 = <b>11/24</b>.' },
          { q: 'You drew red. What is the probability it came from urn X?', a: 8 / 11, hint: 'The share of the red probability that came via urn X.', sol: '(½ × 2/3)/(11/24) = (1/3)/(11/24) = <b>8/11</b>. That\'s Bayes\' theorem.' },
        ] },
        { h: 'Bayes with natural frequencies', blocks: [
          `<p>Bayes' theorem says P(H | E) = P(E | H)P(H)/P(E). In practice, imagine a crowd and count. A rare condition plus an imperfect test gives many more false positives than true ones, so a positive result is less conclusive than it feels.</p>`,
          { fig: 'dots', cols: 50, size: 7.6, groups: [{ n: 8, tone: 'ok', t: '8 have it and test positive' }, { n: 2, tone: 'bad', t: '2 have it and are missed' }, { n: 50, tone: 'acc', t: '50 healthy, but flagged' }, { n: 940, t: '940 healthy and clear' }], alt: 'One thousand dots. Only 8 are true positives, against 50 false alarms.', cap: '1,000 people. One in 100 has it, the test catches 80%, and 5% of healthy people are flagged. Of 58 positives, only 8 are real: about 14%.' },
          { widget: 'bayes' },
          { q: '2% of people have a condition. The test catches 90% of cases and wrongly flags 10% of healthy people. Someone tests positive. What is the probability they have it?', a: 0.018 / (0.018 + 0.098), tol: { abs: 0.003 }, hint: 'Out of 1,000 people, how many are true positives and how many false positives?', sol: 'Of 1,000: 20 have it, 18 test positive; 980 don\'t, 98 test positive. 18/(18 + 98) ≈ <b>0.155</b>.' },
          { market: 'Base rates decide how you read a signal. If only 1 in 50 ideas has real edge, a backtest that "passes" 5% of bad ideas and 80% of good ones leaves about 3 false discoveries for each real one.' },
        ] },
        { h: 'Bayes in odds form', blocks: [
          `<p>Posterior odds = prior odds × likelihood ratio, where the likelihood ratio is P(evidence | H)/P(evidence | not H). It's the fastest form in interviews, and repeated independent evidence simply multiplies.</p>`,
          { q: 'Prior odds of a coin being biased are 1 : 4. A flip comes up heads, which is 3 times as likely if it is biased. What is the probability it is biased now?', a: 3 / 7, hint: 'Multiply the odds by 3, then convert odds a : b to a/(a + b).', sol: 'Posterior odds 3 : 4, so P = <b>3/7</b>.' },
          { id: 'a1', q: 'Same coin, same prior of 1 : 4. Now two independent heads come up. What is the probability it is biased?', a: 9 / 13, tol: { abs: 0.003 }, hint: 'Multiply by the likelihood ratio twice.', sol: 'Odds 1 : 4 × 3 × 3 = 9 : 4, so P = <b>9/13</b> ≈ 0.69.' },
        ] },
        { h: 'Monty Hall, properly', blocks: [
          { worked: 'the clearest proof', q: 'You pick door 1 of 3. The host, who knows where the car is, always opens a door with a goat that you didn\'t pick. Here it\'s door 3. Should you switch?', steps: [
            ['Prior: where is the car?', 'Each door has 1/3.'],
            ['How likely is "host opens 3" if the car is behind door 1?', '½, because he can open 2 or 3.'],
            ['And if the car is behind door 2?', '1, because he must open door 3.'],
            ['And if it\'s behind door 3?', '0, because he never reveals the car.'],
            'So the evidence has likelihoods ½ : 1 : 0, and the posterior is ⅓ × ½ : ⅓ × 1 : 0 = 1 : 2 : 0. Door 2 has probability 2/3. <b>Switch.</b>',
            ['What would change if the host opened a door at random?', 'Then "opens 3 and shows a goat" has likelihood ½ if the car is behind door 1 or door 2, and it\'s 50–50. The answer depends on the host\'s rule, not only on what you saw.'],
          ] },
          { idea: 'Evidence isn\'t just what you saw. It\'s how likely you were to see it under each story. That\'s also how to read a trade: ask who would have done this, and why.' },
          { id: 'm1', q: 'A family has two children and you learn at least one is a girl. What is P(two girls)?', opts: [['1/3'], ['1/2', 'List GG, GB, BG, BB. The condition removes only BB.'], ['1/4', 'That\'s before you had any information.'], ['2/3', 'That\'s the chance of a boy-and-girl family.']], sol: 'Of GG, GB, BG, one has two girls: 1/3. If you\'d met one child at random and she was a girl, the answer would be 1/2. How you learned it matters.' },
        ] },
      ],
      takeaways: ['Condition by restricting to the outcomes where the evidence happened.', 'P(A | B) ≠ P(B | A).', 'Trees multiply; the law of total probability adds the branches.', 'Natural frequencies make Bayes intuitive; odds × likelihood ratio makes it fast.', 'Rare events + imperfect tests ⇒ most positives are false.', 'Always ask how likely the evidence was under each story.'],
      explain: { q: 'Explain to a friend why a positive test for a rare disease can still mean you probably don\'t have it.', a: 'Imagine 1,000 people. A few have the disease, and the test finds most of them. But the healthy group is so much larger that even a small false-alarm rate produces more positives than the real cases. So most positives come from healthy people.' },
      homework: [
        { lvl: 'core', q: 'Two dice. Given that the first shows at least 4, what is the probability that the total is at least 9?', a: 1 / 2, tol: { abs: 0.002 }, hint: 'Only 18 outcomes remain. Count totals of 9 or more among them.', sol: 'First = 4: second is 5 or 6 (2). First = 5: 4, 5, 6 (3). First = 6: 3–6 (4). That\'s 9 of 18: <b>1/2</b>.' },
        { lvl: 'core', q: 'A deck has 3 cards: red/red, red/black, black/black. You draw a card and see a red side. What is the probability that the other side is red?', a: 2 / 3, tol: { abs: 0.002 }, hint: 'Count red sides, not cards.', sol: 'There are 3 red sides, and 2 of them are on the red/red card: <b>2/3</b>.' },
        { lvl: 'core', q: 'A factory has machine A (60% of output, 1% faulty) and machine B (40% of output, 3% faulty). What fraction of all items are faulty?', a: 0.018, hint: 'Total probability.', sol: '0.6 × 0.01 + 0.4 × 0.03 = <b>0.018</b>.' },
        { lvl: 'core', q: 'In that factory, an item is faulty. What is the probability it came from machine B?', a: 2 / 3, tol: { abs: 0.002 }, hint: '0.012/0.018.', sol: '<b>2/3</b>.' },
        { lvl: 'interview', q: 'One of 100 coins is double-headed. You pick one at random and flip it 7 times, getting 7 heads. What is the probability you have the double-headed coin?', a: 128 / 227, tol: { abs: 0.003 }, hint: 'Prior odds 1 : 99, likelihood ratio 2⁷.', sol: 'Odds 128 : 99, so P = 128/227 ≈ <b>0.564</b>.' },
        { lvl: 'interview', q: 'You think a counterparty is informed with probability 0.2. If informed, they buy 90% of the time. If not, 50%. They buy. What is the probability that they are informed?', a: 0.18 / (0.18 + 0.4), tol: { abs: 0.003 }, hint: 'Odds 1 : 4, likelihood ratio 0.9/0.5.', sol: '0.18/(0.18 + 0.40) ≈ <b>0.310</b>. That\'s the logic of a market maker\'s update.' },
        { lvl: 'stretch', q: 'Two people each roll a die in secret and tell you only "at least one of us rolled a six". What is P(both rolled a six)? Now suppose that instead you ask one of them at random and they say "I rolled a six". What is it then? Why do they differ?', sol: 'First case: 11 outcomes have at least one six, and one has two, so 1/11. Second case: the other person\'s die is independent, so 1/6. The information differs: "at least one" removes fewer outcomes than naming a specific die.' },
        { lvl: 'lab', q: 'Play Monty Hall 30 times with three cups and a coin, always switching. Tally your wins. Then think about what you\'d expect with 100 doors, where the host opens 98.', sol: 'You should win about 20 of 30. With 100 doors, your first pick is right 1% of the time, and all the remaining 99% moves to the one door left closed. That\'s the same logic, but obvious.' },
      ],
      practice: [['Bayes topic', '#/topic/bayes'], ['Monty Hall', '#/iq/cl-monty-hall'], ['Two-child problem', '#/iq/imc-two-child'], ['Bayes interview questions', '#/search/bayes']],
    },

    expectation: {
      title: 'Random variables and expected value', minutes: 50,
      why: 'Expected value is the price of anything uncertain. A trader who can\'t compute it can\'t trade. Linearity of expectation is also the most powerful shortcut in interview maths.',
      goals: ['Compute expected values and price simple games', 'Use linearity of expectation, even for dependent variables', 'Count with indicator variables', 'Avoid the E[g(X)] = g(E[X]) trap'],
      prereq: ['prob-basics', 'conditional'],
      sections: [
        { h: 'Expected value', blocks: [
          `<p>A <b>random variable</b> X is a number that depends on chance. Its expected value is the probability-weighted average of its values:</p>
           <div class="hb-eq">E[X] = Σ x · P(X = x)</div>
           <p>It's the long-run average per play, which is why it's the fair price of a game paid out as X. It needn't be a value X can take: a die has E = 3.5.</p>`,
          { widget: 'lln' },
          { q: 'What is the expected value of a fair die roll?', a: 3.5, hint: 'Average the faces.', sol: '(1 + 2 + … + 6)/6 = <b>3.5</b>.' },
        ] },
        { h: 'Linearity of expectation', blocks: [
          `<p>E[X + Y] = E[X] + E[Y] and E[aX] = aE[X], <b>always</b>, even when X and Y are dependent. This is the most useful fact in interview probability: break a complicated total into simple pieces and add their expectations.</p>`,
          { proof: 'For discrete variables: E[X + Y] = Σ<sub>x,y</sub> (x + y) P(x, y) = Σ x P(x, y) + Σ y P(x, y). Summing over y in the first term gives Σ x P(x) = E[X], and likewise E[Y] in the second. We never used independence.' },
          { q: 'What is the expected total of three dice?', a: 10.5, hint: 'Add three expectations.', sol: '3 × 3.5 = <b>10.5</b>.' },
        ] },
        { h: 'Indicator variables', blocks: [
          `<p>To find the expected <i>number</i> of things that happen, write the count as a sum of indicators: I<sub>i</sub> is 1 if thing i happens, otherwise 0. Each indicator's expectation is just its probability. You never need the full distribution.</p>`,
          { fig: 'strip', cell: 30, labelW: 72, rows: [{ label: 'flips', cells: ['H', 'T', 'H', 'H', 'T', 'H', 'H', 'H'] }, { label: 'HH here?', cells: [0, 0, { t: 1, tone: 'acc' }, 0, 0, { t: 1, tone: 'acc' }, { t: 1, tone: 'acc' }, { gap: true }] }], alt: 'Eight coin flips with an indicator below each position marking where HH starts.', cap: 'Number of HH pairs = sum of indicators. There are 7 positions, each 1 with probability ¼, so E = 7/4, even though neighbouring indicators are dependent.' },
          { q: 'You roll a die 6 times. What is the expected number of different faces you see?', a: 6 * (1 - (5 / 6) ** 6), tol: { abs: 0.01 }, hint: 'For each face, what is the chance it appears at least once?', sol: 'Each face appears with probability 1 − (5/6)⁶ ≈ 0.665. Six faces: 6 × 0.665 ≈ <b>3.99</b>.' },
          { q: '10 people take random hats from a pile of their own hats. How many expect to get their own hat?', a: 1, hint: 'Each person gets their own hat with what probability?', sol: '10 × 1/10 = <b>1</b>, for any number of people.' },
          { worked: 'coupon collector', q: 'A cereal box holds one of 6 toys at random. How many boxes do you expect to buy to collect all 6?', steps: [
            ['Split the wait into stages. What is the wait for the first new toy?', 'Exactly 1 box.'],
            ['With 1 toy owned, what is the chance a box brings a new one?', '5/6, so on average you wait 6/5 boxes.'],
            ['And with k toys owned?', '(6 − k)/6, so the wait is 6/(6 − k) boxes.'],
            'Linearity adds the stage waits: 6(1/6 + 1/5 + 1/4 + 1/3 + 1/2 + 1) = 14.7 boxes.',
          ] },
          { id: 'a1', q: 'How many rolls of a die do you expect to need to see all six faces? Same maths, but do it yourself.', a: 14.7, tol: { abs: 0.01 }, hint: '6 × (1 + ½ + ⅓ + ¼ + ⅕ + ⅙).', sol: '<b>14.7</b>.' },
        ] },
        { h: 'Pricing a game', blocks: [
          `<p>A game's value is E[payout] − cost. Positive means you'd play at that price; the fair price makes it zero.</p>`,
          { q: 'You pay $1 to roll a die and receive $5 if it shows a six. What is your expected profit?', a: -1 / 6, tol: { abs: 0.005 }, hint: 'Expected winnings minus the cost.', sol: '5 × 1/6 − 1 = <b>−1/6</b> ≈ −$0.17 a game.' },
          { id: 'm1', q: 'A game is worth $100 on average, but pays $0 with probability 99% and $10,000 with probability 1%. What should you pay to play it once?', opts: [['Less than $100, for most people'], ['Exactly $100: that\'s its value', 'That\'s the fair price if you can repeat it many times. Once, you also carry risk.'], ['Nothing: you will almost surely lose', 'You\'d take it for $1.'], ['$10,000: that\'s the prize', 'You only win it 1% of the time.']], sol: 'Expected value is the price of a repeatable bet. For a one-off bet that\'s large for you, risk also matters. The betting chapter makes this precise.' },
        ] },
        { h: 'E[g(X)] is not g(E[X])', blocks: [
          `<p>The expected square isn't the square of the expectation. For a convex g (a curve that bends upward, like x²), E[g(X)] ≥ g(E[X]). This is <b>Jensen's inequality</b>.</p>`,
          { fig: 'plot', x: [0, 7], y: [0, 40], xt: [1, 3.5, 6], yt: [0, 12.25, 18.5], fns: [{ f: (x) => x * x }], segs: [[1, 1, 6, 36, 'muted'], [3.5, 0, 3.5, 18.5, 'muted']], pts: [{ x: 3.5, y: 12.25, tone: 'ok' }, { x: 3.5, y: 18.5, tone: 'bad' }, { x: 1, y: 1, tone: 'acc' }, { x: 6, y: 36, tone: 'acc' }], labels: [{ x: 3.7, y: 10.2, t: 'g(average)', tone: 'ok' }, { x: 3.7, y: 19.8, t: 'average of g', tone: 'bad' }], alt: 'The curve x squared with a chord between x equals 1 and 6. The chord lies above the curve.', cap: 'For two equally likely outcomes, 1 and 6, the average of g sits on the chord, above the curve. Convexity makes variability valuable: it\'s why options have value.' },
          { q: 'You are paid the square of a die roll. What is the game worth?', a: 91 / 6, hint: 'Average 1, 4, 9, 16, 25, 36.', sol: '91/6 ≈ <b>15.17</b>, more than 3.5² = 12.25.' },
        ] },
      ],
      takeaways: ['E[X] is the long-run average: the fair price.', 'Linearity always holds, dependence or not.', 'Counts = sums of indicators; E[indicator] = probability.', 'Waiting for several things: split into stages and add.', 'E[g(X)] ≠ g(E[X]) unless g is linear; convex payoffs like variability.'],
      explain: { q: 'Why does linearity of expectation work even for dependent variables, when variances don\'t simply add?', a: 'An expectation is a weighted average, and summing over one variable makes the joint probabilities collapse to each variable\'s own distribution, with no need for independence. Variance involves the square of a sum, which creates cross terms: those are the covariances, and they depend on how the variables move together.' },
      homework: [
        { lvl: 'core', q: 'What is the expected value of the larger of two dice?', a: 161 / 36, tol: { abs: 0.01 }, hint: 'P(max = k) = (2k − 1)/36.', sol: 'Σ k(2k − 1)/36 = 161/36 ≈ <b>4.47</b>.' },
        { lvl: 'core', q: 'A coin is flipped 20 times. What is the expected number of times that heads is immediately followed by tails?', a: 19 / 4, tol: { abs: 0.01 }, hint: '19 adjacent pairs, each HT with probability ¼.', sol: '19/4 = <b>4.75</b>.' },
        { lvl: 'core', q: 'From a shuffled deck, you deal 5 cards. What is the expected number of aces?', a: 5 / 13, tol: { abs: 0.003 }, hint: 'Each card is an ace with probability 1/13.', sol: '5 × 1/13 = <b>5/13</b> ≈ 0.385. The draws are dependent, but linearity doesn\'t care.' },
        { lvl: 'core', q: 'A game pays you $X, where X is the roll of a die, and you pay $4 for it. What is your expected profit?', a: -0.5, hint: '3.5 − 4.', sol: '<b>−$0.50</b>.' },
        { lvl: 'interview', q: '5 people each pick a random other person among the 5 to pass a ball to (not themselves). What is the expected number of people who receive no ball?', a: 5 * (3 / 4) ** 4, tol: { abs: 0.01 }, hint: 'Take one person. Four others could pick them, each with probability ¼.', sol: '5 × (3/4)⁴ ≈ <b>1.58</b>.' },
        { lvl: 'interview', q: 'You draw from a deck one card at a time without replacement until you draw the first ace. What is the expected number of cards you draw?', a: 53 / 5, tol: { abs: 0.01 }, hint: 'The 4 aces split the 48 others into 5 equal gaps on average.', sol: '48/5 + 1 = 53/5 = <b>10.6</b>. (You\'ll see this argument again in the symmetry chapter.)' },
        { lvl: 'stretch', q: 'Let X be non-negative with E[X] = 2. Show that P(X ≥ 10) ≤ 0.2 for any such X, and explain what this says about how fat a tail can be.', sol: 'E[X] ≥ 10 × P(X ≥ 10), since X contributes at least 10 on that event and at least 0 elsewhere. So P(X ≥ 10) ≤ 2/10. This is Markov\'s inequality. It uses only the mean, so it\'s a weak bound, but it needs no other assumption.' },
        { lvl: 'lab', q: 'Open a pack of cards. Deal until you see the first ace, and record how many cards it took. Repeat 15 times and average. How close are you to 10.6?', sol: 'With 15 trials the standard error is about 2, so anything from 7 to 14 is ordinary. That spread is why you can\'t judge an edge from a handful of trials, which you\'ll study in Part 3.' },
      ],
      practice: [['Expected value topic', '#/topic/ev'], ['Expected value interview questions', '#/search/expected%20value'], ['Reroll game', '#/iq/js-reroll']],
    },

    variance: {
      title: 'Variance, covariance and correlation', minutes: 50,
      why: 'Expected value says where you should end up; variance says how bumpy the ride is. In trading, risk is variance, and diversification is covariance. Everything about portfolios rests on this chapter.',
      goals: ['Compute variance and standard deviation', 'Use the rules for scaling and adding random variables', 'Understand covariance, correlation and the √n rule', 'Compute the risk of a two-asset portfolio'],
      prereq: ['expectation'],
      sections: [
        { h: 'Variance measures spread', blocks: [
          `<p>Var(X) = E[(X − μ)²] = E[X²] − (E[X])². It's the average squared distance from the mean. The standard deviation σ = √Var is in the same units as X, so it's the number you can actually picture.</p>`,
          { fig: 'bars', vals: [9, 4, 1, 1, 4, 9].map((x) => x / 4), labs: ['1', '2', '3', '4', '5', '6'], show: ['6.25', '2.25', '0.25', '0.25', '2.25', '6.25'], w: 320, h: 180, tone: () => 'acc-soft', xl: 'face of the die', alt: 'Squared distance of each die face from 3.5: 6.25, 2.25, 0.25, 0.25, 2.25, 6.25.', cap: 'Squared distance of each face from the mean of 3.5. Their average is the variance.' },
          { proof: 'Expand: E[(X − μ)²] = E[X²] − 2μE[X] + μ² = E[X²] − 2μ² + μ² = E[X²] − μ².' },
          { q: 'What is the variance of a fair die roll?', a: 35 / 12, tol: { abs: 0.005 }, hint: 'E[X²] − (E[X])².', sol: '91/6 − 49/4 = 35/12 ≈ <b>2.92</b>.' },
        ] },
        { h: 'Scaling and shifting', blocks: [
          `<p>Var(aX + b) = a² Var(X): shifting doesn't change spread, and scaling by a multiplies the standard deviation by |a|.</p>`,
          { q: 'X is a die roll. What is Var(3X + 2)?', a: 9 * 35 / 12, tol: { abs: 0.01 }, hint: 'The +2 does nothing; the 3 gets squared.', sol: '9 × 35/12 = <b>26.25</b>.' },
        ] },
        { h: 'Adding independent variables: the √n rule', blocks: [
          `<p>For independent X and Y, Var(X + Y) = Var(X) + Var(Y). So the total of n independent copies has standard deviation σ√n, and their average σ/√n. Averages get more precise slowly: four times the data halves the error.</p>`,
          { widget: 'sqrtn', predict: { q: 'Averaging 4 dice instead of 1 makes the spread of the average about…', opts: ['half as wide', 'a quarter as wide', 'the same', 'twice as wide'], then: 'Move the slider to 1, then 4, then 16.' } },
          { q: 'What is the standard deviation of the total of 100 dice?', a: Math.sqrt(100 * 35 / 12), tol: { abs: 0.05 }, hint: 'Add 100 variances, then take the square root.', sol: '√(100 × 35/12) = √291.7 ≈ <b>17.1</b>.' },
          { q: 'And of their average?', a: Math.sqrt(100 * 35 / 12) / 100, tol: { abs: 0.002 }, hint: 'Divide the total by 100.', sol: '17.1/100 ≈ <b>0.171</b>.' },
          { market: 'Volatility scales with √time. A stock with 1% daily volatility has about 1% × √252 ≈ 16% annual volatility, assuming independent days. That one line comes up in every quant interview.' },
        ] },
        { h: 'Covariance and correlation', blocks: [
          `<p>Cov(X, Y) = E[(X − μ<sub>X</sub>)(Y − μ<sub>Y</sub>)] = E[XY] − E[X]E[Y]. The product is positive when both are above their means or both below, so it measures how they move together. Correlation scales it to lie between −1 and 1:</p>
           <div class="hb-eq">ρ = Cov(X, Y)/(σ<sub>X</sub> σ<sub>Y</sub>)</div>`,
          { fig: 'plot', x: [-3, 3], y: [-3, 3], w: 300, h: 280, xt: [-2, 0, 2], yt: [-2, 0, 2], pts: Fig.scatter(70, 0.7, 11), xl: 'X', yl: 'Y', alt: 'A scatter of 70 points with correlation about 0.7, trending up and to the right.', cap: 'ρ ≈ 0.7. Most points fall in the top-right and bottom-left quadrants, where the product (X − μ)(Y − μ) is positive.' },
          `<p>In general Var(X ± Y) = Var(X) + Var(Y) ± 2Cov(X, Y). This is the maths of diversification: combining positively correlated bets reduces risk less.</p>`,
          { trap: 'Zero correlation doesn\'t mean independence. If X is symmetric about 0 and Y = X², Y is fixed by X, yet their correlation is 0. Correlation only sees straight-line relationships.' },
          { q: 'X and Y each have variance 1 and correlation 0.5. What is Var(X − Y)?', a: 1, hint: 'Var(X) + Var(Y) − 2Cov(X, Y), with Cov = ρσσ.', sol: '1 + 1 − 2 × 0.5 = <b>1</b>.' },
          { q: 'X and Y are independent, each with variance 1. What is the correlation between X and X + Y?', a: Math.SQRT1_2, tol: { abs: 0.005 }, hint: 'Cov(X, X + Y) = Var(X). What is the standard deviation of X + Y?', sol: 'Cov = 1, sd(X + Y) = √2, so ρ = 1/√2 ≈ <b>0.707</b>.' },
        ] },
        { h: 'Two-asset portfolios', blocks: [
          `<p>Hold weights w₁ and w₂ in two assets. Its variance is the most used formula in portfolio risk:</p>
           <div class="hb-eq">σ<sub>p</sub>² = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂</div>`,
          { worked: true, q: 'Two stocks each have 20% volatility and correlation 0.5. What is the volatility of a 50/50 portfolio?', steps: [
            ['Write down each term.', 'w₁²σ₁² = 0.25 × 0.04 = 0.01, and the same for the second stock.'],
            ['Now the cross term.', '2 × 0.5 × 0.5 × 0.5 × 0.2 × 0.2 = 0.01.'],
            ['Add and take the square root.', 'σ<sub>p</sub>² = 0.03, so σ<sub>p</sub> = √0.03 ≈ 17.3%.'],
            ['What would it be at ρ = 0 and ρ = 1?', 'ρ = 0: √0.02 ≈ 14.1%. ρ = 1: 20%, so no benefit at all.'],
          ] },
          { id: 'a1', q: 'n stocks are uncorrelated, each with 30% volatility. You hold them equally weighted, with n = 25. What is the portfolio\'s volatility, as a decimal?', a: 0.06, hint: 'σ/√n.', sol: '0.3/5 = <b>0.06</b>, or 6%.' },
          { id: 'm1', q: '100 stocks all have 30% volatility and pairwise correlation 0.25. You hold them equally. As you add more stocks, the portfolio volatility…', opts: [['falls to about 15%'], ['falls towards 0, given enough names', 'That needs zero correlation.'], ['stays at 30%, as all stocks are risky', 'Diversification helps while ρ is below 1.'], ['falls to 3%', 'That\'s 30%/√100, which ignores correlation.']], sol: 'For equal weights, variance = σ²/n + (1 − 1/n)ρσ² → ρσ². So volatility → √0.25 × 30% = 15%. Common factors put a floor under risk, which is why market-neutral hedging matters.' },
        ] },
      ],
      takeaways: ['Var = E[X²] − (E[X])²; σ = √Var.', 'Var(aX + b) = a² Var(X).', 'Independent variances add: totals spread like √n, averages shrink like 1/√n.', 'Var(X ± Y) = Var X + Var Y ± 2Cov.', 'ρ only sees straight lines: zero correlation ≠ independence.', 'Portfolio variance: w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂.'],
      explain: { q: 'Why does the risk of a portfolio stop falling, however many stocks you add?', a: 'The stock-specific part of each stock\'s risk averages away as you add names, like σ²/n. The part they share, the covariance, is in every pair and doesn\'t average away. So variance falls to the average covariance, and no further.' },
      homework: [
        { lvl: 'core', q: 'X takes the values 0 and 1 with P(1) = p = 0.3. What is its variance?', a: 0.21, hint: 'p(1 − p).', sol: '0.3 × 0.7 = <b>0.21</b>.' },
        { lvl: 'core', q: 'Daily volatility is 2%. What is the volatility over 25 days, as a decimal, assuming independent days?', a: 0.1, hint: '√25.', sol: '2% × 5 = <b>0.10</b>.' },
        { lvl: 'core', q: 'Var(X) = 4, Var(Y) = 9, Cov(X, Y) = 3. What is the correlation?', a: 0.5, hint: 'Cov/(σσ).', sol: '3/(2 × 3) = <b>0.5</b>.' },
        { lvl: 'core', q: 'With those numbers, what is Var(2X − Y)?', a: 13, hint: '4Var X + Var Y − 4Cov.', sol: '16 + 9 − 12 = <b>13</b>.' },
        { lvl: 'core', q: 'Annual volatility is 16%. What is the rough daily volatility, in percent? (Use √252 ≈ 16.)', a: 1, tol: { abs: 0.03 }, hint: 'Divide by 16.', sol: '<b>1%</b>.' },
        { lvl: 'interview', q: 'Two assets have 10% and 20% volatility and correlation −1. What weight in the first asset gives a zero-risk portfolio (weights sum to 1)?', a: 2 / 3, tol: { abs: 0.002 }, hint: 'With ρ = −1, σ<sub>p</sub> = |w₁σ₁ − w₂σ₂|.', sol: '0.1w = 0.2(1 − w), so w = <b>2/3</b>.' },
        { lvl: 'interview', q: 'Assets have 20% and 10% volatility and correlation 0. What weight in the first minimises variance (weights sum to 1)?', a: 0.2, hint: 'Minimum-variance weight is σ₂²/(σ₁² + σ₂²) when ρ = 0.', sol: '0.01/(0.04 + 0.01) = <b>0.2</b>.' },
        { lvl: 'stretch', q: 'Prove that correlation always lies between −1 and 1. (Hint: consider Var(X/σ<sub>X</sub> ± Y/σ<sub>Y</sub>).)', sol: 'Variance can\'t be negative. Var(X/σ<sub>X</sub> + Y/σ<sub>Y</sub>) = 2 + 2ρ ≥ 0, so ρ ≥ −1, and Var(X/σ<sub>X</sub> − Y/σ<sub>Y</sub>) = 2 − 2ρ ≥ 0, so ρ ≤ 1.' },
        { lvl: 'lab', q: 'Take any 20 consecutive daily closing prices of a stock. Compute the daily returns, their standard deviation, and annualise it with √252. How does it compare with what a volatility page says for that stock?', sol: 'You\'ll usually be in the right area but noisy: 20 observations give a standard error of about 16% of the estimate itself. Volatility estimates from short windows wobble a lot.' },
      ],
      practice: [['Moments topic', '#/topic/moments'], ['Formula cards', '#/flashcards'], ['Portfolio question', '#/sse/all/any/portfolio']],
    },
  });
})();
