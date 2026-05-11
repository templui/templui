(function () {
  "use strict";

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

  function toISODate(date) {
    if (!date) return "";
    return date.toISOString().split("T")[0];
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

  function getMode(container) {
    return container.getAttribute("data-tui-calendar-mode") === "range"
      ? "range"
      : "single";
  }

  function getCurrentView(container) {
    const now = new Date();
    const month = parseInt(container.dataset.tuiCalendarCurrentMonth, 10);
    const year = parseInt(container.dataset.tuiCalendarCurrentYear, 10);
    return {
      month: isNaN(month) ? now.getMonth() : month,
      year: isNaN(year) ? now.getFullYear() : year,
    };
  }

  function shiftMonth(container, delta) {
    const { month, year } = getCurrentView(container);
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    container.dataset.tuiCalendarCurrentMonth = newMonth;
    container.dataset.tuiCalendarCurrentYear = newYear;
    renderCalendar(container);
    updateNativeSelects(container);
  }

  // Hidden inputs are always scoped to the calendar's own wrapper.
  // When embedded (e.g. inside DatePicker) the parent passes HideHiddenInput=true,
  // so these return null and the parent handles its own inputs via the dispatched event.
  function findHiddenInput(container) {
    const wrapper = container.closest("[data-tui-calendar-wrapper]");
    return wrapper?.querySelector("[data-tui-calendar-hidden-input]") || null;
  }

  function findEndInput(container) {
    const wrapper = container.closest("[data-tui-calendar-wrapper]");
    return (
      wrapper?.querySelector("[data-tui-calendar-hidden-end-input]") || null
    );
  }

  function getSelection(container) {
    return {
      start: parseISODate(
        container.getAttribute("data-tui-calendar-selected-date"),
      ),
      end: parseISODate(container.getAttribute("data-tui-calendar-end-date")),
      hoverEnd: parseISODate(
        container.getAttribute("data-tui-calendar-hover-end"),
      ),
    };
  }

  function setSelection(container, start, end) {
    const startISO = toISODate(start);
    const endISO = toISODate(end);

    if (startISO) {
      container.setAttribute("data-tui-calendar-selected-date", startISO);
    } else {
      container.removeAttribute("data-tui-calendar-selected-date");
    }
    if (endISO) {
      container.setAttribute("data-tui-calendar-end-date", endISO);
    } else {
      container.removeAttribute("data-tui-calendar-end-date");
    }
    container.removeAttribute("data-tui-calendar-hover-end");

    const hiddenStart = findHiddenInput(container);
    if (hiddenStart) hiddenStart.value = startISO;

    const hiddenEnd = findEndInput(container);
    if (hiddenEnd) hiddenEnd.value = endISO;

    container.dispatchEvent(
      new CustomEvent("calendar-selected", {
        bubbles: true,
        detail: { mode: getMode(container), start, end },
      }),
    );

    renderCalendar(container);
  }

  function renderCalendar(container) {
    const weekdaysContainer = container.querySelector(
      "[data-tui-calendar-weekdays]",
    );
    const daysContainer = container.querySelector("[data-tui-calendar-days]");

    if (!weekdaysContainer || !daysContainer) return;

    let currentMonth = parseInt(container.dataset.tuiCalendarCurrentMonth);
    let currentYear = parseInt(container.dataset.tuiCalendarCurrentYear);

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

      container.dataset.tuiCalendarCurrentMonth = currentMonth;
      container.dataset.tuiCalendarCurrentYear = currentYear;
    }

    const locale =
      container.getAttribute("data-tui-calendar-locale-tag") || "en-US";
    const startOfWeek =
      parseInt(container.getAttribute("data-tui-calendar-start-of-week")) || 1;

    const mode = getMode(container);
    const { start, end, hoverEnd } = getSelection(container);

    // While picking the second date, preview the range against the hovered day.
    let visualStart = start;
    let visualEnd = end || (mode === "range" && start ? hoverEnd : null);
    if (
      mode === "range" &&
      visualStart &&
      visualEnd &&
      visualEnd.getTime() < visualStart.getTime()
    ) {
      [visualStart, visualEnd] = [visualEnd, visualStart];
    }

    const monthNames = getMonthNames(locale);
    const monthValue = container.querySelector(`#${container.id}-month-value`);
    const yearValue = container.querySelector(`#${container.id}-year-value`);

    if (monthValue) monthValue.textContent = monthNames[currentMonth];
    if (yearValue) yearValue.textContent = currentYear;

    if (!weekdaysContainer.children.length) {
      const dayNames = getDayNames(locale, startOfWeek);
      weekdaysContainer.innerHTML = dayNames
        .map(
          (day) =>
            `<div class="text-center text-xs text-muted-foreground font-medium">${day}</div>`,
        )
        .join("");
    }

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

    for (let i = 0; i < startOffset; i++) {
      daysContainer.innerHTML +=
        '<div class="h-[var(--cell-size)] w-[var(--cell-size)]"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(currentYear, currentMonth, day));
      const t = date.getTime();

      const isStart = visualStart && t === visualStart.getTime();
      const isEnd = mode === "range" && visualEnd && t === visualEnd.getTime();
      const isInRange =
        mode === "range" &&
        visualStart &&
        visualEnd &&
        t > visualStart.getTime() &&
        t < visualEnd.getTime();
      const isToday = t === todayUTC.getTime();

      let classes =
        "inline-flex h-[var(--cell-size)] w-[var(--cell-size)] items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring";

      if (isStart || isEnd) {
        classes += " bg-primary text-primary-foreground hover:bg-primary/90";
      } else if (isInRange) {
        classes += " bg-primary/20 text-foreground hover:bg-primary/30";
      } else if (isToday) {
        classes += " bg-accent text-accent-foreground";
      } else {
        classes += " hover:bg-accent hover:text-accent-foreground";
      }

      const iso = toISODate(date);
      const attrs = [
        `data-tui-calendar-day="${day}"`,
        `data-tui-calendar-day-iso="${iso}"`,
        isToday ? 'data-tui-calendar-today="true"' : "",
        isStart ? 'data-tui-calendar-range-start="true"' : "",
        isEnd && !isStart ? 'data-tui-calendar-range-end-day="true"' : "",
        isInRange ? 'data-tui-calendar-in-range="true"' : "",
      ]
        .filter(Boolean)
        .join(" ");

      daysContainer.innerHTML += `<button type="button" class="${classes}" ${attrs}>${day}</button>`;
    }
  }

  function updateNativeSelects(container) {
    const month = parseInt(container.dataset.tuiCalendarCurrentMonth, 10);
    const year = parseInt(container.dataset.tuiCalendarCurrentYear, 10);

    if (isNaN(month) || isNaN(year)) return;

    const monthSelect = container.querySelector(
      "[data-tui-calendar-month-select]",
    );
    if (monthSelect) monthSelect.value = month.toString();

    const yearSelect = container.querySelector(
      "[data-tui-calendar-year-select]",
    );
    if (yearSelect) yearSelect.value = year.toString();
  }

  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-tui-calendar-month-select]")) {
      const container = e.target.closest("[data-tui-calendar-container]");
      if (!container) return;

      const newMonth = parseInt(e.target.value, 10);
      if (isNaN(newMonth)) return;

      container.dataset.tuiCalendarCurrentMonth = newMonth;
      renderCalendar(container);
      return;
    }

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

  document.addEventListener("click", (e) => {
    const prevBtn = e.target.closest("[data-tui-calendar-prev]");
    if (prevBtn) {
      const container = prevBtn.closest("[data-tui-calendar-container]");
      if (container) shiftMonth(container, -1);
      return;
    }

    const nextBtn = e.target.closest("[data-tui-calendar-next]");
    if (nextBtn) {
      const container = nextBtn.closest("[data-tui-calendar-container]");
      if (container) shiftMonth(container, 1);
      return;
    }

    if (e.target.matches("[data-tui-calendar-day]")) {
      const container = e.target.closest("[data-tui-calendar-container]");
      if (!container) return;

      const day = parseInt(e.target.dataset.tuiCalendarDay);
      const { month, year } = getCurrentView(container);
      const clicked = new Date(Date.UTC(year, month, day));
      const mode = getMode(container);

      if (mode === "range") {
        const { start, end } = getSelection(container);

        // State machine: a range needs two clicks. The second click completes
        // it (swapping if clicked before start). Any further click resets.
        if (start && !end) {
          if (clicked.getTime() < start.getTime()) {
            setSelection(container, clicked, start);
          } else {
            setSelection(container, start, clicked);
          }
        } else {
          setSelection(container, clicked, null);
        }
      } else {
        setSelection(container, clicked, null);
      }
    }
  });

  // Range hover preview: while only the start is set, hovering a day shows
  // what the range would look like if completed there.
  document.addEventListener("mouseover", (e) => {
    const dayBtn = e.target.closest?.("[data-tui-calendar-day]");
    if (!dayBtn) return;

    const container = dayBtn.closest("[data-tui-calendar-container]");
    if (!container || getMode(container) !== "range") return;

    const { start, end } = getSelection(container);
    if (!start || end) return;

    const iso = dayBtn.getAttribute("data-tui-calendar-day-iso");
    if (container.getAttribute("data-tui-calendar-hover-end") === iso) return;

    container.setAttribute("data-tui-calendar-hover-end", iso);
    renderCalendar(container);
  });

  // mouseleave doesn't bubble, so we listen during capture.
  document.addEventListener(
    "mouseleave",
    (e) => {
      const container = e.target;
      if (!container?.matches?.("[data-tui-calendar-container]")) return;
      if (getMode(container) !== "range") return;
      if (container.hasAttribute("data-tui-calendar-hover-end")) {
        container.removeAttribute("data-tui-calendar-hover-end");
        renderCalendar(container);
      }
    },
    true,
  );

  document.addEventListener("reset", (e) => {
    if (!e.target.matches("form")) return;

    e.target
      .querySelectorAll("[data-tui-calendar-container]")
      .forEach((container) => {
        const hiddenInput = findHiddenInput(container);
        if (hiddenInput) hiddenInput.value = "";

        const hiddenEnd = findEndInput(container);
        if (hiddenEnd) hiddenEnd.value = "";

        container.removeAttribute("data-tui-calendar-selected-date");
        container.removeAttribute("data-tui-calendar-end-date");
        container.removeAttribute("data-tui-calendar-hover-end");

        const today = new Date();
        container.dataset.tuiCalendarCurrentMonth = today.getMonth();
        container.dataset.tuiCalendarCurrentYear = today.getFullYear();
        renderCalendar(container);
      });
  });

  const observer = new MutationObserver(() => {
    document
      .querySelectorAll("[data-tui-calendar-container]")
      .forEach((container) => {
        const daysContainer = container.querySelector(
          "[data-tui-calendar-days]",
        );
        if (daysContainer && !daysContainer.children.length) {
          renderCalendar(container);
        }
      });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  function initCalendars() {
    document
      .querySelectorAll("[data-tui-calendar-container]")
      .forEach((container) => {
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
