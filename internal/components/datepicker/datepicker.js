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

  function parseISODateTime(isoString) {
    // Parse ISO string with optional time (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    if (!isoString || typeof isoString !== "string") return null;
    const parts = isoString.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );
    if (!parts) return null;
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const hour = parts[4] ? parseInt(parts[4], 10) : 0;
    const minute = parts[5] ? parseInt(parts[5], 10) : 0;
    const second = parts[6] ? parseInt(parts[6], 10) : 0;
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
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

  function formatDateTimeWithIntl(date, format, localeTag, withTime, withSeconds, with24Hours) {
    if (!date || isNaN(date.getTime())) return "";
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
      case "locale-medium":
      default:
        options.dateStyle = "medium";
        break;
    }
    if (withTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
      if (withSeconds) options.second = "2-digit";
      options.hour12 = !with24Hours;
    }
    try {
      return new Intl.DateTimeFormat(localeTag, options).format(date);
    } catch (e) {
      // fallback logic
      return date.toISOString();
    }
  }

  function initDatePicker(triggerButton) {
    if (!triggerButton || triggerButton.hasAttribute("data-initialized")) return;
    triggerButton.setAttribute("data-initialized", "true");

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

    const withTime = triggerButton.dataset.withTime === "true";
    const withSeconds = triggerButton.dataset.withSeconds === "true";
    const with24Hours = triggerButton.dataset.with24Hours !== "false";

    const onCalendarSelect = (event) => {
      if (!event.detail || !event.detail.date || !(event.detail.date instanceof Date)) return;
      let selectedDate = event.detail.date;
      // Read time fields if present
      if (withTime) {
        const hourInput = document.getElementById(triggerButton.id + "-hour");
        const minInput = document.getElementById(triggerButton.id + "-minute");
        const secInput = document.getElementById(triggerButton.id + "-second");
        const ampmSel = document.getElementById(triggerButton.id + "-ampm");
        let hour = hourInput ? parseInt(hourInput.value, 10) : (with24Hours ? 0 : 12);
        let minute = minInput ? parseInt(minInput.value, 10) : 0;
        let second = secInput ? parseInt(secInput.value, 10) : 0;
        if (!with24Hours && ampmSel) {
          if (ampmSel.value === "PM" && hour < 12) hour += 12;
          if (ampmSel.value === "AM" && hour === 12) hour = 0;
        }
        selectedDate.setUTCHours(hour, minute, second);
      }
      const displayFormattedValue = formatDateTimeWithIntl(
        selectedDate,
        displayFormat,
        localeTag,
        withTime,
        withSeconds,
        with24Hours
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
        const initialDate = parseISODateTime(hiddenInput.value);
        if (initialDate) {
          const correctlyFormatted = formatDateTimeWithIntl(
            initialDate,
            displayFormat,
            localeTag,
            withTime,
            withSeconds,
            with24Hours
          );
          if (displaySpan.textContent.trim() !== correctlyFormatted) {
            displaySpan.textContent = correctlyFormatted;
            displaySpan.classList.remove("text-muted-foreground");
          }
        } else {
          displaySpan.textContent = placeholder;
          displaySpan.classList.add("text-muted-foreground");
        }
      } else {
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

    // Add data-with-time attribute for config
    if (withTime) {
      triggerButton.setAttribute("data-with-time", "true");
    } else {
      triggerButton.removeAttribute("data-with-time");
    }
  }

  function init(root = document) {
    if (root instanceof Element && root.matches('[data-datepicker="true"]')) {
      initDatePicker(root);
    }
    root
      .querySelectorAll('[data-datepicker="true"]:not([data-initialized])')
      .forEach((triggerButton) => {
        initDatePicker(triggerButton);
      });
  }

  window.templUI = window.templUI || {};
  window.templUI.datePicker = { init: init };

  document.addEventListener("DOMContentLoaded", () => init());
})();
