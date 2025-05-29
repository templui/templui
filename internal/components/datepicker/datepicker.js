(function () {
  function parseISODate(isoString) {
    if (!isoString || typeof isoString !== "string") return null;
    const parts = isoString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!parts) return null;
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // JS month is 0-indexed
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

  function formatDateWithIntl(date, format, localeTag) {
    if (!date || isNaN(date.getTime())) return "";

    // Always use UTC for formatting to avoid timezone shifts
    let options = { timeZone: "UTC" };
    switch (format) {
      case "locale-short":
        options.dateStyle = "short";
        break;
      case "locale-long":
        options.dateStyle = "long";
        break;
      case "locale-full":
        options.dateStyle = "full";
        break;
      case "locale-medium": // Default to medium
      default:
        options.dateStyle = "medium";
        break;
    }

    try {
      // Explicitly pass the options object with timeZone: 'UTC'
      return new Intl.DateTimeFormat(localeTag, options).format(date);
    } catch (e) {
      console.error(
        `Error formatting date with Intl (locale: ${localeTag}, format: ${format}, timezone: UTC):`,
        e
      );
      // Fallback to locale default medium on error, still using UTC
      try {
        const fallbackOptions = { dateStyle: "medium", timeZone: "UTC" };
        return new Intl.DateTimeFormat(localeTag, fallbackOptions).format(date);
      } catch (fallbackError) {
        console.error(
          `Error formatting date with fallback Intl (locale: ${localeTag}, timezone: UTC):`,
          fallbackError
        );
        // Absolute fallback: Format the UTC date parts manually if Intl fails completely
        const year = date.getUTCFullYear();
        // getUTCMonth is 0-indexed, add 1 for display
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = date.getUTCDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`; // Simple ISO format as absolute fallback
      }
    }
  }

  function initDatePicker(triggerButton) {
    if (!triggerButton || triggerButton._datePickerInitialized) return;

    const datePickerID = triggerButton.id;
    const displaySpan = triggerButton.querySelector(
      "[data-datepicker-display]"
    );
    const calendarInstanceId = datePickerID + "-calendar-instance";
    const calendarInstance = document.getElementById(calendarInstanceId);
    const calendarHiddenInputId = calendarInstanceId + "-hidden";
    const calendarHiddenInput = document.getElementById(calendarHiddenInputId);

    // Fallback to find calendar relatively
    let calendar = calendarInstance;
    let hiddenInput = calendarHiddenInput;

    if (!calendarInstance || !calendarHiddenInput) {
      const popoverContentId = triggerButton.getAttribute("aria-controls");
      const popoverContent = popoverContentId
        ? document.getElementById(popoverContentId)
        : null;
      if (popoverContent) {
        if (!calendar)
          calendar = popoverContent.querySelector("[data-calendar-container]");
        if (!hiddenInput) {
          const wrapper = popoverContent.querySelector(
            "[data-calendar-wrapper]"
          );
          hiddenInput = wrapper
            ? wrapper.querySelector("[data-calendar-hidden-input]")
            : null;
        }
      }
    }

    if (!displaySpan || !calendar || !hiddenInput) {
      console.error("DatePicker init error: Missing required elements.", {
        datePickerID,
        displaySpan,
        calendar,
        hiddenInput,
      });
      return;
    }

    const displayFormat =
      triggerButton.dataset.displayFormat || "locale-medium";
    const localeTag = triggerButton.dataset.localeTag || "en-US";
    const placeholder = triggerButton.dataset.placeholder || "Select a date";

    const onCalendarSelect = (event) => {
      if (
        !event.detail ||
        !event.detail.date ||
        !(event.detail.date instanceof Date)
      )
        return;
      const selectedDate = event.detail.date;
      const displayFormattedValue = formatDateWithIntl(
        selectedDate,
        displayFormat,
        localeTag
      );
      displaySpan.textContent = displayFormattedValue;
      displaySpan.classList.remove("text-muted-foreground");

      // Find and click the popover trigger to close it
      const popoverTrigger = triggerButton
        .closest("[data-popover]")
        ?.querySelector("[data-popover-trigger]");
      if (popoverTrigger instanceof HTMLElement) {
        popoverTrigger.click();
      } else {
        triggerButton.click(); // Fallback: click the button itself (might not work if inside popover)
      }
    };

    const updateDisplay = () => {
      if (hiddenInput && hiddenInput.value) {
        const initialDate = parseISODate(hiddenInput.value);
        if (initialDate) {
          const correctlyFormatted = formatDateWithIntl(
            initialDate,
            displayFormat,
            localeTag
          );
          if (displaySpan.textContent.trim() !== correctlyFormatted) {
            displaySpan.textContent = correctlyFormatted;
            displaySpan.classList.remove("text-muted-foreground");
          }
        } else {
          // Handle case where hidden input has invalid value
          displaySpan.textContent = placeholder;
          displaySpan.classList.add("text-muted-foreground");
        }
      } else {
        // Ensure placeholder is shown if no value
        displaySpan.textContent = placeholder;
        displaySpan.classList.add("text-muted-foreground");
      }
    };

    // Attach listener to the specific calendar instance
    calendar.addEventListener("calendar-date-selected", onCalendarSelect);

    updateDisplay(); // Initial display update

    triggerButton._datePickerInitialized = true;

    // Store cleanup function on the button itself
    triggerButton._datePickerCleanup = () => {
      if (calendar) {
        calendar.removeEventListener(
          "calendar-date-selected",
          onCalendarSelect
        );
      }
    };
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches('[data-datepicker="true"]')) {
      initDatePicker(root);
    }
    root
      .querySelectorAll('[data-datepicker="true"]')
      .forEach((triggerButton) => {
        initDatePicker(triggerButton);
      });
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  document.addEventListener("DOMContentLoaded", () => initAllComponents());

  document.body.addEventListener("htmx:beforeSwap", (event) => {
    let target = event.detail.elt;
    if (target instanceof Element) {
      const cleanup = (button) => {
        if (button.matches && button.matches('[data-datepicker="true"]')) {
          if (button._datePickerCleanup) {
            button._datePickerCleanup();
            delete button._datePickerCleanup;
            delete button._datePickerInitialized;
          }
        }
      };

      // Cleanup the target itself if it's a trigger button
      if (target.matches && target.matches('[data-datepicker="true"]')) {
        cleanup(target);
      }
      // Cleanup trigger buttons within the target
      if (target.querySelectorAll) {
        target.querySelectorAll('[data-datepicker="true"]').forEach(cleanup);
      }
    }
  });

  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})(); // End of IIFE
