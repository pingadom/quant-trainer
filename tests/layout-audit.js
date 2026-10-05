// Layout audit: run in the browser console on the app (or from the e2e suite) to find visual
// breakage on every screen: siblings that overlap, content wider than the viewport, and text
// clipped inside buttons. Returns a list of problems as strings; empty means clean.
async function layoutAudit(routes, wait = (ms) => new Promise((r) => setTimeout(r, ms))) {
  const problems = [];
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].join('.') : ''}`;
  const visible = (el) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    // The contents of a closed <details> still report boxes in some browsers but are not drawn.
    const folded = el.parentElement && el.parentElement.tagName === 'DETAILS' && !el.parentElement.open && el.tagName !== 'SUMMARY';
    return !folded && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };
  // In-flow boxes only: positioned elements, rotated stamps and inline text (a link that wraps
  // onto two lines has a box spanning both) can legitimately overlap their neighbours.
  const inFlow = (el) => { const s = getComputedStyle(el); return !['absolute', 'fixed'].includes(s.position) && s.display !== 'inline' && !el.classList.contains('stamp'); };
  for (const route of routes) {
    location.hash = '#/' + route;
    await wait(250);
    const main = document.getElementById('main');
    // 1. Overlapping siblings (anywhere in main). Each sibling's extent includes descendants that
    // spill out of it (a row fixed at 16px whose chips wrap onto a second line overlaps the next
    // box even though the row's own box doesn't), unless it clips its overflow.
    const memo = new Map();
    const extent = (el) => {
      if (memo.has(el)) return memo.get(el);
      const r = el.getBoundingClientRect(), box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      const clips = /hidden|auto|scroll|clip/.test(getComputedStyle(el).overflow);
      if (!clips) {
        for (const k of el.children) {
          if (!visible(k) || !inFlow(k)) continue;
          const e = extent(k);
          box.left = Math.min(box.left, e.left); box.top = Math.min(box.top, e.top);
          box.right = Math.max(box.right, e.right); box.bottom = Math.max(box.bottom, e.bottom);
        }
      }
      memo.set(el, box);
      return box;
    };
    for (const parent of [main, ...main.querySelectorAll('*')]) {
      const kids = [...parent.children].filter((k) => visible(k) && inFlow(k));
      for (let i = 0; i < kids.length; i++) {
        const a = extent(kids[i]);
        for (let j = i + 1; j < kids.length; j++) {
          const b = extent(kids[j]);
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 2 && h > 2) problems.push(`#/${route}: ${name(kids[i])} overlaps ${name(kids[j])} (${Math.round(w)}×${Math.round(h)}px)`);
        }
      }
    }
    // 2. Wider than the viewport.
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      const wide = [...main.querySelectorAll('*')].filter((e) => visible(e) && e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('.table-wrap, .ticker'));
      problems.push(`#/${route}: page scrolls sideways${wide.length ? ` (e.g. ${name(wide[0])})` : ''}`);
    }
    // 3. Text clipped inside buttons and links styled as buttons.
    for (const b of main.querySelectorAll('button, .btn')) {
      if (visible(b) && b.scrollWidth > b.clientWidth + 2) problems.push(`#/${route}: text clipped in ${name(b)} "${b.textContent.trim().slice(0, 30)}"`);
    }
    if (window.QT && QT.cleanup) QT.cleanup();
  }
  return [...new Set(problems)];
}
if (typeof module !== 'undefined') module.exports = { layoutAudit };
