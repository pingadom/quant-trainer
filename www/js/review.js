// Mistakes deck with spaced repetition (Leitner boxes).
// Every wrong answer is saved as the exact problem you saw. It comes back after 1 day;
// each correct review pushes it further out (3, 7, 21 days) until it's retired as mastered.
// A wrong review sends it back to the start.
(function () {
  const store = QT.store;
  const DAY = 864e5;
  const INTERVALS = [1, 3, 7, 21]; // days until next review, indexed by box

  const list = () => (store.get().mistakes ||= []);
  const keyOf = (p) => p.q.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 240);

  QT.mistakes = {
    INTERVALS,
    all: list,
    due: () => list().filter((m) => m.due <= Date.now()),
    // Save a missed problem (simulation functions aren't serialisable, so they're dropped).
    add(tag, p) {
      const k = keyOf(p), now = Date.now(), L = list();
      const m = L.find((x) => x.key === k);
      if (m) Object.assign(m, { box: 0, due: now + INTERVALS[0] * DAY });
      else L.push({ key: k, tag, p: { q: p.q, a: p.a, tol: p.tol, sol: p.sol }, box: 0, due: now + INTERVALS[0] * DAY, added: now });
      store.save();
    },
    // Record a review. Returns 'mastered' when the card leaves the deck.
    review(card, ok) {
      // Look the card up by key: the state may have been reloaded (e.g. another tab saved) since
      // this review started, and indexOf on a stale object would give -1 and splice the wrong card.
      const L = list(), now = Date.now();
      const i = L.findIndex((x) => x.key === card.key);
      if (i < 0) return ok ? 'already reviewed' : 'again';
      const m = L[i];
      let result = 'again';
      if (ok) {
        m.box++;
        if (m.box >= INTERVALS.length) {
          L.splice(i, 1);
          store.get().mastered = (store.get().mastered || 0) + 1;
          result = 'mastered';
        } else {
          m.due = now + INTERVALS[m.box] * DAY;
          result = `next in ${INTERVALS[m.box]} days`;
        }
      } else {
        m.box = 0;
        m.due = now + INTERVALS[0] * DAY;
      }
      store.touchDay();
      store.save();
      return result;
    },
  };
})();
