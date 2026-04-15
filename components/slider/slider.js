(function () {
  'use strict';

  function pct(val, min, max) {
    return ((val - min) / (max - min)) * 100;
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function snap(val, step) {
    return Math.round(val / step) * step;
  }

  function fromPointer(clientX, track, min, max, step) {
    const { left, width } = track.getBoundingClientRect();
    return clamp(snap(min + ((clientX - left) / width) * (max - min), step), min, max);
  }

  function initSlider(root) {
    const track   = root.querySelector('[data-track]');
    const fill    = root.querySelector('[data-fill]');
    const thumbs  = Array.from(root.querySelectorAll('[data-thumb]'));
    const inputs  = Array.from(root.querySelectorAll('[data-input]'));
    const min     = +root.dataset.min;
    const max     = +root.dataset.max;
    const step    = +root.dataset.step || 1;
    const isRange = thumbs.length === 2;

    function update() {
      thumbs.forEach((thumb, i) => {
        const val = +inputs[i].value;
        thumb.style.left = pct(val, min, max) + '%';
        thumb.setAttribute('aria-valuenow', val);

        const key = isRange ? root.id + (i === 0 ? '-min' : '-max') : root.id;
        document.querySelectorAll(`[data-tui-slider-value-for="${key}"]`).forEach(el => {
          el.textContent = val;
        });
      });

      if (isRange) {
        fill.style.left  = pct(+inputs[0].value, min, max) + '%';
        fill.style.right = (100 - pct(+inputs[1].value, min, max)) + '%';
      } else {
        fill.style.right = (100 - pct(+inputs[0].value, min, max)) + '%';
      }
    }

    function setVal(i, val) {
      if (i === 0 && isRange) val = Math.min(val, +inputs[1].value);
      if (i === 1)            val = Math.max(val, +inputs[0].value);
      inputs[i].value = val;
      update();
      inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
    }

    thumbs.forEach((thumb, i) => {
      if (thumb.getAttribute('aria-disabled') === 'true') return;

      thumb.addEventListener('pointerdown', e => {
        e.preventDefault();
        thumb.setPointerCapture(e.pointerId);
        thumbs.forEach(t => (t.style.zIndex = '0'));
        thumb.style.zIndex = '1';

        function onMove(e) {
          setVal(i, fromPointer(e.clientX, track, min, max, step));
        }
        thumb.addEventListener('pointermove', onMove);
        thumb.addEventListener('pointerup', () => thumb.removeEventListener('pointermove', onMove), { once: true });
      });

      thumb.addEventListener('keydown', e => {
        const delta = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[e.key];
        if (delta === undefined) return;
        e.preventDefault();
        setVal(i, clamp(snap(+inputs[i].value + delta, step), min, max));
      });
    });

    // click on track to jump to position
    track.addEventListener('pointerdown', e => {
      if (e.target.closest('[data-thumb]')) return;
      if (root.querySelector('[data-thumb][aria-disabled="true"]')) return;
      const val = fromPointer(e.clientX, track, min, max, step);
      const i = !isRange ? 0
        : Math.abs(val - +inputs[0].value) <= Math.abs(val - +inputs[1].value) ? 0 : 1;
      setVal(i, val);
    });

    update();
    root.dataset.tuiSliderInit = '1';
  }

  function initAll() {
    document.querySelectorAll('[data-tui-slider]:not([data-tui-slider-init])').forEach(initSlider);
  }

  new MutationObserver(initAll).observe(document.body, { childList: true, subtree: true });
  initAll();
})();
