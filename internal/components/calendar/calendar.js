(function () {
  function initCalendar(container) {
    // Read time config from data attributes (must be before any use)
    const withTime = container.hasAttribute('data-with-time');
    const withSeconds = container.hasAttribute('data-with-seconds');
    const with24Hours = container.hasAttribute('data-with-24hours') ? container.getAttribute('data-with-24hours') !== 'false' : true;

    if (!container || container.hasAttribute("data-initialized")) return;
    container.setAttribute("data-initialized", "true");

    const monthDisplay = container.querySelector(
      "[data-calendar-month-display]"
    );
    const weekdaysContainer = container.querySelector(
      "[data-calendar-weekdays]"
    );
    const daysContainer = container.querySelector("[data-calendar-days]");
    const prevButton = container.querySelector("[data-calendar-prev]");
    const nextButton = container.querySelector("[data-calendar-next]");
    const wrapper = container.closest("[data-calendar-wrapper]");
    const hiddenInput = wrapper
      ? wrapper.querySelector("[data-calendar-hidden-input]")
      : null;

    if (
      !monthDisplay ||
      !weekdaysContainer ||
      !daysContainer ||
      !prevButton ||
      !nextButton ||
      !hiddenInput
    ) {
      console.error(
        "Calendar init error: Missing required elements (or hidden input relative to wrapper).",
        container
      );
      return;
    }

    const localeTag = container.dataset.localeTag || "en-US";
    let monthNames;
    try {
      monthNames = Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(localeTag, {
          month: "long",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2000, i, 1)))
      );
    } catch (e) {
      console.error(
        `Calendar: Error generating month names via Intl (locale: "${localeTag}"). Falling back to English.`,
        e
      );
      // Fallback to English names if Intl fails for any reason
      monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
    }
    let dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]; // Default fallback

    try {
      // Use days 0-6 (Sun-Sat standard). Intl provides names in the locale's typical order.
      dayNames = Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(
          new Date(Date.UTC(2000, 0, i))
        )
      );
    } catch (e) {
      console.error("Error generating calendar day names via Intl:", e);
      // Keep default dayNames on error
    }

    let currentMonth = parseInt(container.dataset.initialMonth);
    let currentYear = parseInt(container.dataset.initialYear);
    let selectedDate = null; // Stored as JS Date object (UTC midnight)

    if (container.dataset.selectedDate) {
      selectedDate = parseISODate(container.dataset.selectedDate);
      // Always set time inputs from initial value if withTime is true
      if (withTime && selectedDate) setTimeout(() => setTimeInputsFromDate(selectedDate), 0);
      // If initial value exists, set currentMonth and currentYear from it so the calendar grid is correct
      if (selectedDate) {
        currentMonth = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
      }
    }

    function parseISODate(isoStr) {
      if (!isoStr) return null;
      // If the string contains a timezone offset, let the browser parse it so the offset is handled correctly
      if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(isoStr)) {
        const date = new Date(isoStr);
        if (!isNaN(date.getTime())) return date;
      }
      // Otherwise, parse as YYYY-MM-DD (no time, no offset)
      try {
        const parts = isoStr.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS month is 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        if (
          !isNaN(date) &&
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month &&
          date.getUTCDate() === day
        ) {
          return date;
        }
      } catch { }
      return null;
    }

    function updateMonthDisplay() {
      // Always use the fallback month name combined with the current year
      // Ensure month index is within bounds (0-11)
      const monthIndex = Math.max(0, Math.min(11, currentMonth));
      const monthName = monthNames[monthIndex];
      const displayString = `${monthName} ${currentYear}`;
      monthDisplay.textContent = displayString;
    }

    function renderWeekdays() {
      weekdaysContainer.innerHTML = "";
      dayNames.forEach((day) => {
        const el = document.createElement("div");
        el.className = "text-center text-xs text-muted-foreground font-medium";
        el.textContent = day;
        weekdaysContainer.appendChild(el);
      });
    }

    function renderCalendar() {
      daysContainer.innerHTML = "";
      const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
      const firstDayUTCDay = firstDayOfMonth.getUTCDay(); // 0=Sun
      let startOffset = firstDayUTCDay; // Simple Sunday start offset
      // NOTE: A robust implementation might need to adjust offset based on locale's actual first day of week.
      // Intl doesn't directly provide this easily yet. Keep Sunday start for simplicity.

      const daysInMonth = new Date(
        Date.UTC(currentYear, currentMonth + 1, 0)
      ).getUTCDate();
      // Calculate 'today' based on the browser's local date for correct highlighting
      const now = new Date();
      const today = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
      );

      for (let i = 0; i < startOffset; i++) {
        const blank = document.createElement("div");
        blank.className = "h-8 w-8";
        daysContainer.appendChild(blank);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring";
        button.textContent = day;
        button.dataset.day = day;
        const currentDate = new Date(Date.UTC(currentYear, currentMonth, day));
        const isSelected =
          selectedDate &&
          currentDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
          currentDate.getUTCMonth() === selectedDate.getUTCMonth() &&
          currentDate.getUTCDate() === selectedDate.getUTCDate();

        const isToday =
          currentDate.getUTCFullYear() === today.getUTCFullYear() &&
          currentDate.getUTCMonth() === today.getUTCMonth() &&
          currentDate.getUTCDate() === today.getUTCDate();

        if (isSelected)
          button.classList.add(
            "bg-primary",
            "text-primary-foreground",
            "hover:bg-primary/90"
          );
        else if (isToday)
          button.classList.add("bg-accent", "text-accent-foreground");
        else
          button.classList.add(
            "hover:bg-accent",
            "hover:text-accent-foreground"
          );

        button.addEventListener("click", handleDayClick);
        daysContainer.appendChild(button);
      }
    }

    function handlePrevMonthClick() {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      updateMonthDisplay();
      renderCalendar();
    }

    function handleNextMonthClick() {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      updateMonthDisplay();
      renderCalendar();
    }

    // Helper: set time inputs from a Date
    function setTimeInputsFromDate(date) {
      if (!withTime || !date) return;
      const hourInput = document.getElementById(container.id + '-hour');
      const minInput = document.getElementById(container.id + '-minute');
      const secInput = document.getElementById(container.id + '-second');
      const ampmSel = document.getElementById(container.id + '-ampm');
      let hour = date.getHours();
      let minute = date.getMinutes();
      let second = date.getSeconds();
      if (!with24Hours && ampmSel) {
        if (hour === 0) {
          hour = 12;
          ampmSel.value = 'AM';
        } else if (hour > 12) {
          ampmSel.value = 'PM';
          hour = hour - 12;
        } else if (hour === 12) {
          ampmSel.value = 'PM';
        } else {
          ampmSel.value = 'AM';
        }
      }
      // Always pad hour, minute, and second to two digits for better UX
      if (hourInput) hourInput.value = hour.toString().padStart(2, '0');
      if (minInput) minInput.value = minute.toString().padStart(2, '0');
      if (secInput && withSeconds) secInput.value = second.toString().padStart(2, '0');
    }

    // Helper: get time from inputs
    function getTimeFromInputs() {
      if (!withTime) return { hour: 0, minute: 0, second: 0 };
      const hourInput = document.getElementById(container.id + '-hour');
      const minInput = document.getElementById(container.id + '-minute');
      const secInput = document.getElementById(container.id + '-second');
      const ampmSel = document.getElementById(container.id + '-ampm');
      let hour = hourInput ? parseInt(hourInput.value, 10) : (with24Hours ? 0 : 12);
      let minute = minInput ? parseInt(minInput.value, 10) : 0;
      let second = secInput && withSeconds ? parseInt(secInput.value, 10) : 0;
      if (!with24Hours && ampmSel) {
        if (ampmSel.value === 'PM' && hour < 12) hour += 12;
        if (ampmSel.value === 'AM' && hour === 12) hour = 0;
      }
      return { hour, minute, second };
    }

    function handleDayClick(event) {
      const day = parseInt(event.target.dataset.day);
      if (!day) return;
      // Create date in local time so the selected time matches the user's local selection
      const newlySelectedDate = new Date(currentYear, currentMonth, day);
      const { hour, minute, second } = getTimeFromInputs();
      newlySelectedDate.setHours(hour, minute, second);
      selectedDate = newlySelectedDate;
      // ISO string
      let isoFormattedValue = newlySelectedDate.toISOString();
      if (!withTime) isoFormattedValue = isoFormattedValue.split('T')[0];
      hiddenInput.value = isoFormattedValue;
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      container.dispatchEvent(
        new CustomEvent('calendar-date-selected', {
          bubbles: true,
          detail: { date: newlySelectedDate, closePopover: true },
        })
      );
      renderCalendar();
    }

    if (withTime && selectedDate) {
      setTimeout(() => setTimeInputsFromDate(selectedDate), 0);
    }

    // Initialization
    prevButton.addEventListener("click", handlePrevMonthClick);
    nextButton.addEventListener("click", handleNextMonthClick);

    updateMonthDisplay();
    renderWeekdays();
    renderCalendar();

    if (withTime) {
      const hourInput = document.getElementById(container.id + '-hour');
      const minInput = document.getElementById(container.id + '-minute');
      const secInput = document.getElementById(container.id + '-second');
      const ampmSel = document.getElementById(container.id + '-ampm');
      [hourInput, minInput, secInput, ampmSel].forEach(function (el) {
        if (el) {
          el.addEventListener('change', function () {
            if (!selectedDate) return;
            const { hour, minute, second } = getTimeFromInputs();
            // Set time in local hours/minutes/seconds
            selectedDate.setHours(hour, minute, second);
            let isoFormattedValue = selectedDate.toISOString();
            if (!withTime) isoFormattedValue = isoFormattedValue.split('T')[0];
            hiddenInput.value = isoFormattedValue;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            container.dispatchEvent(
              new CustomEvent('calendar-date-selected', {
                bubbles: true,
                detail: { date: selectedDate },
              })
            );
          });
        }
      });
    }

    container._calendarInitialized = true;
  }

  function init(root = document) {
    if (root instanceof Element && root.matches("[data-calendar-container]")) {
      initCalendar(root);
    }

    for (const calendar of root.querySelectorAll("[data-calendar-container]:not([data-initialized])")) {
      initCalendar(calendar);
    }
  }

  window.templUI = window.templUI || {};
  window.templUI.calendar = { init: init };

  document.addEventListener("DOMContentLoaded", () => init());
})();
