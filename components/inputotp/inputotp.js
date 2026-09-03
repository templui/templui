(function () {
  "use strict";

  // Pendant of the input-otp library: one invisible real input over the
  // container drives everything, the slots only display state.

  function inputOf(root) {
    return root.querySelector('[data-slot="input-otp-input"]');
  }

  function slotsOf(root) {
    return Array.from(root.querySelectorAll('[data-slot="input-otp-slot"]'));
  }

  function sanitize(root, value) {
    const pattern = inputOf(root)?.pattern;
    let out = "";
    for (const ch of value) {
      if (!pattern || new RegExp(pattern).test(ch)) out += ch;
    }
    return out.slice(0, slotsOf(root).length);
  }

  // input-otp never places the caret where the pointer landed: focus and
  // clicks always jump to the first empty slot, or select the last
  // character when the value is complete.
  function forceEndSelection(root) {
    const input = inputOf(root);
    const max = slotsOf(root).length;
    const len = input.value.length;
    if (len === max && max > 0) {
      input.setSelectionRange(len - 1, len);
    } else {
      input.setSelectionRange(len, len);
    }
  }

  function normalizeSelection(root) {
    const input = inputOf(root);
    const max = slotsOf(root).length;
    const len = input.value.length;
    if (document.activeElement !== input) return;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    if (len === max && start >= len && end >= len) {
      input.setSelectionRange(len - 1, len);
      return;
    }
    if (start > len) start = len;
    if (end > len) end = len;
    // Inside the typed region the caret always selects one character for
    // overwrite, like input-otp.
    if (start === end && start < len) {
      end = start + 1;
    }
    if (start !== input.selectionStart || end !== input.selectionEnd) {
      input.setSelectionRange(start, end);
    }
  }

  function render(root) {
    const input = inputOf(root);
    const slots = slotsOf(root);
    const value = input.value;
    const focused = document.activeElement === input;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    slots.forEach((slot, i) => {
      const charEl = slot.querySelector(".cn-input-otp-char");
      if (charEl) charEl.textContent = value[i] || "";
      const caretEl = slot.querySelector(".cn-input-otp-caret");
      let active = false;
      if (focused) {
        if (start === end) {
          active = i === Math.min(start, slots.length - 1);
        } else {
          active = i >= start && i < end;
        }
      }
      slot.setAttribute("data-active", active ? "true" : "false");
      const showCaret = focused && active && start === end && i >= value.length;
      if (caretEl) {
        caretEl.classList.toggle("hidden", !showCaret);
        caretEl.classList.toggle("flex", showCaret);
      }
      if (showCaret && charEl) charEl.textContent = "";
    });
  }

  function initRoot(root) {
    const input = inputOf(root);
    if (!input) return;
    input.maxLength = slotsOf(root).length;
    input.value = sanitize(root, input.value);
    root.setAttribute("data-value", input.value);
    render(root);
    return window.shadcnTempl.lifecycle.watchProperty(input, "value", () => {
      const value = sanitize(root, input.value);
      if (input.value !== value) input.value = value;
      root.setAttribute("data-value", value);
      render(root);
    });
  }

  document.addEventListener("input", (e) => {
    if (!(e.target instanceof Element) || !e.target.matches('[data-slot="input-otp-input"]')) return;
    const root = e.target.closest('[data-slot="input-otp"]');
    const clean = sanitize(root, e.target.value);
    if (clean !== e.target.value) {
      e.target.value = clean;
    }
    root.setAttribute("data-value", clean);
    normalizeSelection(root);
    render(root);
  });

  document.addEventListener("focusin", (e) => {
    if (!(e.target instanceof Element) || !e.target.matches('[data-slot="input-otp-input"]')) return;
    const input = e.target;
    const root = input.closest('[data-slot="input-otp"]');
    forceEndSelection(root);
    render(root);
    // Chrome restores the previous caret position right after focus,
    // enforce the end selection once more on the next tick.
    setTimeout(() => {
      if (document.activeElement === input) {
        forceEndSelection(root);
        render(root);
      }
    }, 0);
  });

  // Arrow navigation moves the single-character selection like input-otp.
  document.addEventListener("keydown", (e) => {
    if (!(e.target instanceof Element) || !e.target.matches('[data-slot="input-otp-input"]')) return;
    const input = e.target;
    const root = input.closest('[data-slot="input-otp"]');
    const max = slotsOf(root).length;
    const len = input.value.length;
    const start = input.selectionStart || 0;
    let handled = true;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      const i = Math.max(0, Math.min(start, len - 1) - (start > 0 && start >= len ? 0 : 1));
      if (len > 0) input.setSelectionRange(Math.max(0, Math.min(i, len - 1)), Math.max(0, Math.min(i, len - 1)) + 1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      const i = start + 1;
      if (i < len) {
        input.setSelectionRange(i, i + 1);
      } else if (len === max && max > 0) {
        input.setSelectionRange(len - 1, len);
      } else {
        input.setSelectionRange(len, len);
      }
    } else if (e.key === "Home") {
      if (len > 0) input.setSelectionRange(0, 1);
      else input.setSelectionRange(0, 0);
    } else if (e.key === "End") {
      forceEndSelection(root);
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      render(root);
    }
  });

  document.addEventListener("focusout", (e) => {
    if (!(e.target instanceof Element) || !e.target.matches('[data-slot="input-otp-input"]')) return;
    render(e.target.closest('[data-slot="input-otp"]'));
  });

  // Pointer presses always land on the invisible input; defer so the
  // browser's own caret placement is overridden.
  document.addEventListener("pointerup", (e) => {
    if (!(e.target instanceof Element) || !e.target.matches('[data-slot="input-otp-input"]')) return;
    const root = e.target.closest('[data-slot="input-otp"]');
    requestAnimationFrame(() => {
      forceEndSelection(root);
      render(root);
    });
  });

  document.addEventListener("selectionchange", () => {
    const el = document.activeElement;
    if (!(el instanceof Element) || !el.matches('[data-slot="input-otp-input"]')) return;
    const root = el.closest('[data-slot="input-otp"]');
    normalizeSelection(root);
    render(root);
  });

  window.shadcnTempl.lifecycle.register("input-otp", {
    selector: '[data-slot="input-otp"]',
    setup: initRoot,
    attributes: ["data-value"],
    attributeChanged(root) {
      const input = inputOf(root);
      if (!input) return;
      const value = sanitize(root, root.getAttribute("data-value") || "");
      if (input.value !== value) input.value = value;
      if (root.getAttribute("data-value") !== value) root.setAttribute("data-value", value);
      render(root);
    },
  });
})();
