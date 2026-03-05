(function () {
  "use strict";

  // Utility functions
  function parseISODate(isoStr) {
    if (!isoStr) return null;
    const parts = isoStr.split("-");
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
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

  function getMonthNames(locale) {
    try {
      return Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, {
          month: "short",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2000, i, 1))),
      );
    } catch {
      return [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }
  }

  function getDayNames(locale, startOfWeek) {
    try {
      return Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, {
          weekday: "short",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2000, 0, i + 2 + startOfWeek))),
      );
    } catch {
      return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    }
  }

  function findHiddenInput(container) {
    // Check wrapper first
    const wrapper = container.closest("[data-tui-calendar-wrapper]");
    let hiddenInput = wrapper?.querySelector(
      "[data-tui-calendar-hidden-input]",
    );

    // For datepicker integration
    if (!hiddenInput && container.id) {
      const parentId = container.id.replace("-calendar-instance", "");
      hiddenInput = document.getElementById(parentId + "-hidden");
    }

    return hiddenInput;
  }

  function renderCalendar(container) {
    const weekdaysContainer = container.querySelector(
      "[data-tui-calendar-weekdays]",
    );
    const daysContainer = container.querySelector("[data-tui-calendar-days]");

    if (!weekdaysContainer || !daysContainer) return;

    // Get current viewing month/year (or use initial/defaults)
    let currentMonth = parseInt(container.dataset.tuiCalendarCurrentMonth);
    let currentYear = parseInt(container.dataset.tuiCalendarCurrentYear);

    // If not set, use initial values or current date
    if (isNaN(currentMonth) || isNaN(currentYear)) {
      const initialMonth = parseInt(
        container.getAttribute("data-tui-calendar-initial-month"),
      );
      const initialYear = parseInt(
        container.getAttribute("data-tui-calendar-initial-year"),
      );
      const selectedDate = container.getAttribute(
        "data-tui-calendar-selected-date",
      );

      if (selectedDate) {
        const parsed = parseISODate(selectedDate);
        if (parsed) {
          currentMonth = parsed.getUTCMonth();
          currentYear = parsed.getUTCFullYear();
        }
      }

      if (isNaN(currentMonth)) {
        currentMonth = !isNaN(initialMonth)
          ? initialMonth
          : new Date().getMonth();
      }
      if (isNaN(currentYear)) {
        currentYear =
          !isNaN(initialYear) && initialYear > 0
            ? initialYear
            : new Date().getFullYear();
      }

      // Store for navigation
      container.dataset.tuiCalendarCurrentMonth = currentMonth;
      container.dataset.tuiCalendarCurrentYear = currentYear;
    }

    // Get other settings
    const locale =
      container.getAttribute("data-tui-calendar-locale-tag") || "en-US";
    const startOfWeek =
      parseInt(container.getAttribute("data-tui-calendar-start-of-week")) || 1;
    const selectedDateStr = container.getAttribute(
      "data-tui-calendar-selected-date",
    );
    const selectedDate = selectedDateStr ? parseISODate(selectedDateStr) : null;

    // Update SelectBox values
    const monthNames = getMonthNames(locale);
    const monthValue = container.querySelector(`#${container.id}-month-value`);
    const yearValue = container.querySelector(`#${container.id}-year-value`);

    if (monthValue) monthValue.textContent = monthNames[currentMonth];
    if (yearValue) yearValue.textContent = currentYear;

    // Render weekdays if empty
    if (!weekdaysContainer.children.length) {
      const dayNames = getDayNames(locale, startOfWeek);
      weekdaysContainer.innerHTML = dayNames
        .map(
          (day) =>
            `<div class="text-center text-xs text-muted-foreground font-medium">${day}</div>`,
        )
        .join("");
    }

    // Render days
    daysContainer.innerHTML = "";

    const firstDay = new Date(Date.UTC(currentYear, currentMonth, 1));
    const startOffset = (((firstDay.getUTCDay() - startOfWeek) % 7) + 7) % 7;
    const daysInMonth = new Date(
      Date.UTC(currentYear, currentMonth + 1, 0),
    ).getUTCDate();

    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    // Add empty cells for offset
    for (let i = 0; i < startOffset; i++) {
      daysContainer.innerHTML += '<div class="h-8 w-8"></div>';
    }

    // Add day buttons
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(currentYear, currentMonth, day));
      const isSelected =
        selectedDate && currentDate.getTime() === selectedDate.getTime();
      const isToday = currentDate.getTime() === todayUTC.getTime();

      let classes =
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring";

      if (isSelected) {
        classes += " bg-primary text-primary-foreground hover:bg-primary/90";
      } else if (isToday) {
        classes += " bg-accent text-accent-foreground";
      } else {
        classes += " hover:bg-accent hover:text-accent-foreground";
      }

      const attrs = [
        `data-tui-calendar-day="${day}"`,
        isToday ? 'data-tui-calendar-today="true"' : '',
        isSelected ? 'data-tui-calendar-selected="true"' : ''
      ].filter(Boolean).join(' ');

      daysContainer.innerHTML += `<button type="button" class="${classes}" ${attrs}>${day}</button>`;
    }
  }

  // Handle month/year selection from native selects
  document.addEventListener("change", (e) => {
    // Month select
    if (e.target.matches("[data-tui-calendar-month-select]")) {
      const container = e.target.closest("[data-tui-calendar-container]");
      if (!container) return;

      const newMonth = parseInt(e.target.value, 10);
      if (isNaN(newMonth)) return;

      container.dataset.tuiCalendarCurrentMonth = newMonth;
      renderCalendar(container);
      return;
    }

    // Year select
    if (e.target.matches("[data-tui-calendar-year-select]")) {
      const container = e.target.closest("[data-tui-calendar-container]");
      if (!container) return;

      const newYear = parseInt(e.target.value, 10);
      if (isNaN(newYear)) return;

      container.dataset.tuiCalendarCurrentYear = newYear;
      renderCalendar(container);
      return;
    }
  });

  // Event delegation for calendar navigation and selection
  document.addEventListener("click", (e) => {
    // Previous month
    const prevBtn = e.target.closest("[data-tui-calendar-prev]");
    if (prevBtn) {
      const container = prevBtn.closest("[data-tui-calendar-container]");
      if (!container) return;

      let month = parseInt(container.dataset.tuiCalendarCurrentMonth, 10);
      let year = parseInt(container.dataset.tuiCalendarCurrentYear, 10);

      // Only use fallback if truly not initialized (should not happen after init)
      if (isNaN(month)) month = new Date().getMonth();
      if (isNaN(year)) year = new Date().getFullYear();

      month--;
      if (month < 0) {
        month = 11;
        year--;
      }

      container.dataset.tuiCalendarCurrentMonth = month;
      container.dataset.tuiCalendarCurrentYear = year;
      renderCalendar(container);
      updateNativeSelects(container);
      return;
    }

    // Next month
    const nextBtn = e.target.closest("[data-tui-calendar-next]");
    if (nextBtn) {
      const container = nextBtn.closest("[data-tui-calendar-container]");
      if (!container) return;

      let month = parseInt(container.dataset.tuiCalendarCurrentMonth, 10);
      let year = parseInt(container.dataset.tuiCalendarCurrentYear, 10);

      // Only use fallback if truly not initialized (should not happen after init)
      if (isNaN(month)) month = new Date().getMonth();
      if (isNaN(year)) year = new Date().getFullYear();

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }

      container.dataset.tuiCalendarCurrentMonth = month;
      container.dataset.tuiCalendarCurrentYear = year;
      renderCalendar(container);
      updateNativeSelects(container);
      return;
    }

    // Day selection
    if (e.target.matches("[data-tui-calendar-day]")) {
      const container = e.target.closest("[data-tui-calendar-container]");
      if (!container) return;

      const day = parseInt(e.target.dataset.tuiCalendarDay);
      let month = parseInt(container.dataset.tuiCalendarCurrentMonth, 10);
      let year = parseInt(container.dataset.tuiCalendarCurrentYear, 10);

      // Only use fallback if truly not initialized (should not happen after init)
      if (isNaN(month)) month = new Date().getMonth();
      if (isNaN(year)) year = new Date().getFullYear();
      const selectedDate = new Date(Date.UTC(year, month, day));

      // Update selected date attribute
      container.setAttribute(
        "data-tui-calendar-selected-date",
        selectedDate.toISOString().split("T")[0],
      );

      // Update hidden input
      const hiddenInput = findHiddenInput(container);
      if (hiddenInput) {
        hiddenInput.value = selectedDate.toISOString().split("T")[0];
        hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // Dispatch custom event
      container.dispatchEvent(
        new CustomEvent("calendar-date-selected", {
          bubbles: true,
          detail: { date: selectedDate },
        }),
      );

      renderCalendar(container);
    }
  });

  // Update native selects when month/year changes via arrows
  function updateNativeSelects(container) {
    const month = parseInt(container.dataset.tuiCalendarCurrentMonth, 10);
    const year = parseInt(container.dataset.tuiCalendarCurrentYear, 10);

    if (isNaN(month) || isNaN(year)) return;

    // Update month select
    const monthSelect = container.querySelector(
      "[data-tui-calendar-month-select]",
    );
    if (monthSelect) {
      monthSelect.value = month.toString();
    }

    // Update year select
    const yearSelect = container.querySelector(
      "[data-tui-calendar-year-select]",
    );
    if (yearSelect) {
      yearSelect.value = year.toString();
    }
  }

  // Form reset handling
  document.addEventListener("reset", (e) => {
    if (!e.target.matches("form")) return;

    e.target
      .querySelectorAll("[data-tui-calendar-container]")
      .forEach((container) => {
        const hiddenInput = findHiddenInput(container);
        if (hiddenInput) {
          hiddenInput.value = "";
        }

        // Clear selected date and reset to current month
        container.removeAttribute("data-tui-calendar-selected-date");
        const today = new Date();
        container.dataset.tuiCalendarCurrentMonth = today.getMonth();
        container.dataset.tuiCalendarCurrentYear = today.getFullYear();
        renderCalendar(container);
      });
  });

  // MutationObserver for dynamic content (framework-agnostic)
  const observer = new MutationObserver(() => {
    document
      .querySelectorAll("[data-tui-calendar-container]")
      .forEach((container) => {
        const daysContainer = container.querySelector(
          "[data-tui-calendar-days]",
        );
        // Only render if not already rendered
        if (daysContainer && !daysContainer.children.length) {
          renderCalendar(container);
        }
      });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initialize calendars on page load
  function initCalendars() {
    document
      .querySelectorAll("[data-tui-calendar-container]")
      .forEach((container) => {
        // Localize month names in native select options
        const locale =
          container.getAttribute("data-tui-calendar-locale-tag") || "en-US";
        const monthNames = getMonthNames(locale);
        const monthSelect = container.querySelector(
          "[data-tui-calendar-month-select]",
        );

        if (monthSelect) {
          const options = monthSelect.querySelectorAll("option");
          options.forEach((option, index) => {
            if (monthNames[index]) {
              option.textContent = monthNames[index];
            }
          });
        }

        renderCalendar(container);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalendars);
  } else {
    initCalendars();
  }
})();
