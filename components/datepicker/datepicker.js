(function () {
  "use strict";

  /**
   * Reactive Binding for hidden inputs
   *
   * Problem: Setting input.value programmatically (e.g., via Datastar/Alpine)
   * does NOT fire 'input' events - this is standard browser behavior since the 90s.
   *
   * Solution: Override the value setter to dispatch 'input' events on change.
   * This is the same pattern used by Vue.js, MobX, and other reactive frameworks.
   */
  function enableReactiveBinding(input) {
    if (input._tui) return;
    input._tui = true;

    const desc = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    );
    if (!desc?.set) return;

    Object.defineProperty(input, "value", {
      get: desc.get,
      set(v) {
        const old = this.value;
        desc.set.call(this, v);
        if (old !== v) {
          this.dispatchEvent(new Event("input", { bubbles: true }));
        }
      },
      configurable: true,
    });
  }

  function parseISODate(isoString) {
    if (!isoString) return null;
    const parts = isoString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!parts) return null;

    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const date = new Date(Date.UTC(year, month, day));

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month &&
      date.getUTCDate() === day
    ) {
      return date;
    }
    return null;
  }

  function toISODate(date) {
    if (!date || isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  }

  function formatDate(date, format, locale) {
    if (!date || isNaN(date.getTime())) return "";

    const formatMap = {
      "locale-short": "short",
      "locale-long": "long",
      "locale-full": "full",
      "locale-medium": "medium",
    };

    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: "UTC",
        dateStyle: formatMap[format] || "medium",
      }).format(date);
    } catch {
      return toISODate(date);
    }
  }

  function findRoot(element) {
    return element?.closest("[data-tui-datepicker-root]") || null;
  }

  function findElements(root) {
    const trigger = root?.querySelector("[data-tui-datepicker='true']");
    return {
      trigger,
      display: trigger?.querySelector("[data-tui-datepicker-display]"),
      startInput: root?.querySelector("[data-tui-datepicker-hidden-input]"),
      endInput: root?.querySelector("[data-tui-datepicker-hidden-end-input]"),
    };
  }

  function isRangeMode(trigger) {
    return trigger?.getAttribute("data-tui-datepicker-mode") === "range";
  }

  function closePopover(root) {
    window.tui?.popover?.closeNearest?.(root);
  }

  function updateDisplay(root) {
    const { trigger, display, startInput, endInput } = findElements(root);
    if (!trigger || !display || !startInput) return;

    const format =
      trigger.getAttribute("data-tui-datepicker-display-format") ||
      "locale-medium";
    const locale =
      trigger.getAttribute("data-tui-datepicker-locale-tag") || "en-US";
    const placeholder =
      trigger.getAttribute("data-tui-datepicker-placeholder") ||
      "Select a date";

    const start = parseISODate(startInput.value);
    const startText = start ? formatDate(start, format, locale) : placeholder;

    if (isRangeMode(trigger)) {
      const endPlaceholder =
        trigger.getAttribute("data-tui-datepicker-end-placeholder") ||
        "End date";
      const end = endInput ? parseISODate(endInput.value) : null;
      const endText = end ? formatDate(end, format, locale) : endPlaceholder;
      display.textContent = `${startText} – ${endText}`;
    } else {
      display.textContent = startText;
    }

    display.classList.toggle("text-muted-foreground", start === null);
  }

  // Calendar fires this for both single and range modes.
  // The datepicker owns the hidden inputs and writes them here.
  document.addEventListener("calendar-selected", (e) => {
    const root = findRoot(e.target);
    if (!root) return;

    const { trigger, startInput, endInput } = findElements(root);
    if (!trigger || !startInput) return;

    const { mode, start, end } = e.detail || {};

    startInput.value = toISODate(start);
    if (endInput) endInput.value = toISODate(end);

    updateDisplay(root);

    // Close on completion: always for single, only when both ends are set for range.
    if (mode === "single" || (mode === "range" && end)) {
      closePopover(root);
    }
  });

  document.addEventListener("input", (e) => {
    if (
      !e.target.matches?.(
        "[data-tui-datepicker-hidden-input], [data-tui-datepicker-hidden-end-input]",
      )
    ) {
      return;
    }
    const root = findRoot(e.target);
    if (root) updateDisplay(root);
  });

  document.addEventListener("reset", (e) => {
    if (!e.target.matches("form")) return;

    e.target.querySelectorAll("[data-tui-datepicker-root]").forEach((root) => {
      const { startInput, endInput } = findElements(root);
      if (startInput) startInput.value = "";
      if (endInput) endInput.value = "";
      updateDisplay(root);
    });
  });

  function initializeDatePickers() {
    document.querySelectorAll("[data-tui-datepicker-root]").forEach((root) => {
      const { startInput, endInput } = findElements(root);
      if (!startInput || startInput._tui) return;

      enableReactiveBinding(startInput);
      if (endInput) enableReactiveBinding(endInput);
      updateDisplay(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDatePickers);
  } else {
    initializeDatePickers();
  }

  new MutationObserver(initializeDatePickers).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
