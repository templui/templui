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

  // Utility functions
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

  function formatDate(date, format, locale) {
    if (!date || isNaN(date.getTime())) return "";

    const options = { timeZone: "UTC" };
    const formatMap = {
      "locale-short": "short",
      "locale-long": "long",
      "locale-full": "full",
      "locale-medium": "medium",
    };

    options.dateStyle = formatMap[format] || "medium";

    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (e) {
      // Fallback to ISO format
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = date.getUTCDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  function findRoot(element) {
    return element?.closest("[data-tui-datepicker-root]") || null;
  }

  function findElements(root) {
    const trigger = root?.querySelector("[data-tui-datepicker='true']");
    const calendar = root?.querySelector("[data-tui-calendar-container]");
    const hiddenInput = root?.querySelector(
      "[data-tui-datepicker-hidden-input]",
    );
    const display = trigger?.querySelector("[data-tui-datepicker-display]");

    return { trigger, calendar, hiddenInput, display };
  }

  function closePopover(root) {
    const popoverContent = root?.querySelector("[data-tui-popover-content]");
    if (!popoverContent?.matches(":popover-open")) return;

    try {
      popoverContent.hidePopover();
    } catch {
      // ignore
    }
  }

  // Update display
  function updateDisplay(root) {
    const elements = findElements(root);
    if (!elements.trigger || !elements.display || !elements.hiddenInput) return;

    const format =
      elements.trigger.getAttribute("data-tui-datepicker-display-format") ||
      "locale-medium";
    const locale =
      elements.trigger.getAttribute("data-tui-datepicker-locale-tag") ||
      "en-US";
    const placeholder =
      elements.trigger.getAttribute("data-tui-datepicker-placeholder") ||
      "Select a date";

    if (elements.hiddenInput.value) {
      const date = parseISODate(elements.hiddenInput.value);
      if (date) {
        elements.display.textContent = formatDate(date, format, locale);
        elements.display.classList.remove("text-muted-foreground");
        return;
      }
    }

    elements.display.textContent = placeholder;
    elements.display.classList.add("text-muted-foreground");
  }

  function toISODate(date) {
    if (!date || isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  }

  // Handle calendar date selection
  document.addEventListener("calendar-date-selected", (e) => {
    const calendar = e.target;
    const root = findRoot(calendar);
    const elements = findElements(root);
    if (!elements.hiddenInput || !e.detail?.date) return;

    elements.hiddenInput.value = toISODate(e.detail.date);
    updateDisplay(root);
    closePopover(root);
  });

  // Handle hidden input value changes (for reactive frameworks)
  document.addEventListener("input", (e) => {
    if (!e.target.matches("[data-tui-datepicker-hidden-input]")) return;

    const root = findRoot(e.target);
    if (root) {
      updateDisplay(root);
    }
  });

  // Form reset handling
  document.addEventListener("reset", (e) => {
    if (!e.target.matches("form")) return;

    e.target.querySelectorAll("[data-tui-datepicker-root]").forEach((root) => {
      const elements = findElements(root);
      if (elements.hiddenInput) {
        elements.hiddenInput.value = "";
      }
      updateDisplay(root);
    });
  });

  // Initialize datepickers
  function initializeDatePickers() {
    document.querySelectorAll("[data-tui-datepicker-root]").forEach((root) => {
      const elements = findElements(root);
      if (!elements.hiddenInput || elements.hiddenInput._tui) return;

      // Enable reactive binding for hidden input
      enableReactiveBinding(elements.hiddenInput);
      updateDisplay(root);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDatePickers);
  } else {
    initializeDatePickers();
  }

  // MutationObserver for dynamically added elements
  new MutationObserver(initializeDatePickers).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
