// On-screen number pad for touch devices. System numeric keyboards are clumsy and
// iOS's decimal pad has no minus key, so on touch screens answers are entered here instead.
(function () {
  const LABEL = { back: '⌫', enter: 'Enter', '-': '−' };
  const ARIA = { back: 'Delete', enter: 'Enter', '-': 'Minus', '/': 'Divide', '%': 'Percent', '.': 'Decimal point' };

  // Phone order (1 2 3 on top), with only the extra keys a screen needs. `keys` is a string of
  // extras from '.-/%'. One extra sits left of 0, phone-style; more get a fourth column.
  // Returns rows of [key, column span]; a null key is an empty slot.
  function layout(keys, enter) {
    const has = (k) => keys.includes(k);
    const digits = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((r) => r.map((k) => [k, 1]));
    if (keys.length <= 1) {
      const rows = [...digits, [[keys || null, 1], ['0', 1], ['back', 1]]];
      if (enter) rows.push([['enter', 3]]);
      return { cols: 3, rows };
    }
    const side = ['back', has('-') ? '-' : null, has('/') ? '/' : null];
    const rows = digits.map((r, i) => [...r, [side[i], 1]]);
    const last = [[has('.') ? '.' : null, 1], ['0', 1]];
    if (has('%')) last.push(['%', 1]);
    if (enter) last.push(['enter', 4 - last.length]);
    rows.push(last);
    return { cols: 4, rows };
  }

  function enabled() {
    try {
      const pref = localStorage.getItem('qt-keypad');
      if (pref === 'on') return true;
      if (pref === 'off') return false;
    } catch { /* ignore */ }
    return window.matchMedia('(pointer: coarse)').matches;
  }

  // Attach a keypad after `anchor` driving `inputs`. `onEnter(input)` fires on Enter.
  // opts.keys: the extra keys this screen needs (default all of '.-/%'); opts.enter: false hides Enter.
  function attach(anchor, inputs, onEnter, { keys = '.-/%', enter = true } = {}) {
    if (!enabled()) return null;
    let active = inputs[0];
    const setActive = (inp) => {
      active = inp;
      inputs.forEach((i) => i.classList.toggle('kp-active', i === inp));
    };
    inputs.forEach((inp) => {
      inp.readOnly = true;
      inp.setAttribute('inputmode', 'none');
      inp.addEventListener('pointerdown', () => setActive(inp));
    });
    setActive(active);

    const pad = document.createElement('div');
    const { cols, rows } = layout(keys, enter);
    pad.className = `keypad kp-${cols}`;
    pad.setAttribute('role', 'group');
    pad.setAttribute('aria-label', 'Number pad');
    pad.innerHTML = rows.flat().map(([k, span]) => {
      const style = span > 1 ? ` style="grid-column: span ${span}"` : '';
      if (!k) return `<span${style}></span>`;
      return `<button type="button" data-k="${k}" class="${k === 'enter' ? 'kp-enter' : /\d/.test(k) ? '' : 'kp-op'}"${style}${ARIA[k] ? ` aria-label="${ARIA[k]}"` : ''}>${LABEL[k] || k}</button>`;
    }).join('');
    pad.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.preventDefault();
      if (navigator.vibrate) navigator.vibrate(4);
      const k = btn.dataset.k;
      if (k === 'enter') return onEnter(active);
      if (!active || active.disabled) return;
      if (k === 'back') active.value = active.value.slice(0, -1);
      else active.value += k;
      active.dispatchEvent(new Event('input', { bubbles: true }));
    });
    anchor.after(pad);
    return {
      pad,
      focus: (inp) => setActive(inp || inputs[0]),
      setDisabled: (d) => pad.classList.toggle('kp-disabled', d),
    };
  }

  QT.keypad = { attach, enabled, layout };
})();
