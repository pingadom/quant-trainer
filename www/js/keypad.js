// On-screen number pad for touch devices. System numeric keyboards are clumsy and
// iOS's decimal pad has no minus key, so on touch screens answers are entered here instead.
(function () {
  const KEYS = ['7', '8', '9', 'back', '4', '5', '6', '/', '1', '2', '3', '%', '-', '0', '.', 'enter'];
  const LABEL = { back: '⌫', enter: '↵', '-': '−' };
  const ARIA = { back: 'Delete', enter: 'Enter', '-': 'Minus', '/': 'Divide', '%': 'Percent', '.': 'Decimal point' };

  function enabled() {
    try {
      const pref = localStorage.getItem('qt-keypad');
      if (pref === 'on') return true;
      if (pref === 'off') return false;
    } catch { /* ignore */ }
    return window.matchMedia('(pointer: coarse)').matches;
  }

  // Attach a keypad after `anchor` driving `inputs`. `onEnter(input)` fires on ↵.
  function attach(anchor, inputs, onEnter) {
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
    pad.className = 'keypad';
    pad.setAttribute('role', 'group');
    pad.setAttribute('aria-label', 'Number pad');
    pad.innerHTML = KEYS.map((k) => `<button type="button" data-k="${k}" class="${k === 'enter' ? 'kp-enter' : ''}"${ARIA[k] ? ` aria-label="${ARIA[k]}"` : ''}>${LABEL[k] || k}</button>`).join('');
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

  QT.keypad = { attach, enabled };
})();
