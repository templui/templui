(function () {
  // Verbatim class strings from base/ui/calendar.tsx (react-day-picker
  // classNames slots). The look lives in the vendored style-*.css via the
  // cn-calendar-* classes; none of the grid slots below has a cn- class in
  // any style, they are pure structural utilities. The day button template
  // (cn-calendar-day-button) lives in the templ file; the grid below is
  // (re)built here.
  const CLS = {
    week: "mt-2 flex w-full",
    weekday:
      "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
    weekNumberHeader: "w-(--cell-size) select-none",
    weekNumber: "text-[0.8rem] text-muted-foreground select-none",
    weekNumberInner: "flex size-(--cell-size) items-center justify-center text-center",
    day: "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
    dayFirstRound: "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
    dayFirstRoundWeekNumbers: "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)",
    rangeStart:
      "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
    rangeMiddle: "rounded-none",
    rangeEnd:
      "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
    today: "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
    outside: "text-muted-foreground aria-selected:text-muted-foreground",
    disabled: "text-muted-foreground opacity-50",
    // shadcn-templ extension, no shadcn slot or cn- class for booked days exists.
    booked: "[&>button]:line-through opacity-100",
  };

  const states = new WeakMap();

  function containers() {
    return document.querySelectorAll('[data-slot="calendar"]');
  }

  function parseISO(s) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim());
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function toISO(d) {
    if (!d) return "";
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function sameDay(a, b) {
    return !!(a && b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  function state(root) {
    if (!states.has(root)) {
      const selected = parseISO(root.getAttribute("data-selected"));
      const end = parseISO(root.getAttribute("data-range-end"));
      const view = parseISO(root.getAttribute("data-month")) || selected || new Date();
      states.set(root, {
        mode: root.getAttribute("data-mode") || "single",
        locale: root.getAttribute("data-locale") || "en-US",
        startOfWeek: parseInt(root.getAttribute("data-week-starts-on"), 10) || 0,
        outsideDays: root.getAttribute("data-outside-days") !== "false",
        fixedWeeks: root.hasAttribute("data-fixed-weeks"),
        weekNumbers: root.hasAttribute("data-week-number"),
        min: parseISO(root.getAttribute("data-min")),
        max: parseISO(root.getAttribute("data-max")),
        disabledDates: (root.getAttribute("data-disabled-dates") || "")
          .split(",").map(parseISO).filter(Boolean),
        bookedDates: (root.getAttribute("data-booked-dates") || "")
          .split(",").map(parseISO).filter(Boolean),
        month: new Date(view.getFullYear(), view.getMonth(), 1),
        selected: selected,
        end: end,
      });
    }
    return states.get(root);
  }

  function isDisabled(s, date) {
    if (s.min && date < s.min && !sameDay(date, s.min)) return true;
    if (s.max && date > s.max && !sameDay(date, s.max)) return true;
    return s.disabledDates.some((d) => sameDay(d, date)) || s.bookedDates.some((d) => sameDay(d, date));
  }

  function render(root) {
    const s = state(root);
    root.querySelectorAll('[data-slot="calendar-month"]').forEach((block) => {
      const offset = parseInt(block.getAttribute("data-index"), 10) || 0;
      const month = new Date(s.month.getFullYear(), s.month.getMonth() + offset, 1);
      renderCaption(block, s, month);
      renderWeekdays(block, s);
      renderWeeks(root, block, s, month);
    });
    updateNav(root, s);
    root.dispatchEvent(new CustomEvent("calendar-rendered", { bubbles: true }));
  }

  function renderCaption(block, s, month) {
    const label = block.querySelector('[data-slot="calendar-caption"]');
    if (label) {
      label.textContent = month.toLocaleDateString(s.locale, { month: "long", year: "numeric" });
    }
    const monthSelect = block.querySelector('[data-slot="calendar-month-select"]');
    if (monthSelect) {
      monthSelect.value = String(month.getMonth());
      const monthLabel = block.querySelector('[data-slot="calendar-month-label"]');
      if (monthLabel) {
        monthLabel.textContent = new Date(2000, month.getMonth(), 1).toLocaleDateString(s.locale, { month: "short" });
      }
    }
    const yearSelect = block.querySelector('[data-slot="calendar-year-select"]');
    if (yearSelect) {
      yearSelect.value = String(month.getFullYear());
      const yearLabel = block.querySelector('[data-slot="calendar-year-label"]');
      if (yearLabel) yearLabel.textContent = String(month.getFullYear());
    }
  }

  function renderWeekdays(block, s) {
    const row = block.querySelector('[data-slot="calendar-weekdays"]');
    if (!row) return;
    row.innerHTML = "";
    if (s.weekNumbers) {
      const th = document.createElement("th");
      th.className = CLS.weekNumberHeader;
      row.appendChild(th);
    }
    for (let i = 0; i < 7; i++) {
      const day = (s.startOfWeek + i) % 7;
      const th = document.createElement("th");
      th.className = CLS.weekday;
      th.scope = "col";
      // 2021-08-01 was a Sunday; the offset picks the right weekday name.
      th.textContent = new Date(2021, 7, 1 + day)
        .toLocaleDateString(s.locale, { weekday: "short" }).slice(0, 2);
      row.appendChild(th);
    }
  }

  function dayCellClasses(s, mods) {
    let cls = CLS.day + " " + (s.weekNumbers ? CLS.dayFirstRoundWeekNumbers : CLS.dayFirstRound);
    // A single-day range gets both classes, exactly like react-day-picker.
    if (mods.rangeStart) cls += " " + CLS.rangeStart;
    if (mods.rangeEnd) cls += " " + CLS.rangeEnd;
    if (mods.rangeMiddle) cls += " " + CLS.rangeMiddle;
    if (mods.today) cls += " " + CLS.today;
    if (mods.outside) cls += " " + CLS.outside;
    if (mods.disabled) cls += " " + CLS.disabled;
    if (mods.booked) cls += " " + CLS.booked;
    return cls;
  }

  function renderWeeks(root, block, s, month) {
    const tbody = block.querySelector('[data-slot="calendar-weeks"]');
    const template = root.querySelector('[data-slot="calendar-day-template"]');
    if (!tbody || !template) return;
    tbody.innerHTML = "";

    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() - s.startOfWeek + 7) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const rows = s.fixedWeeks ? 6 : Math.ceil((lead + daysInMonth) / 7);
    const today = new Date();

    for (let w = 0; w < rows; w++) {
      const tr = document.createElement("tr");
      tr.className = CLS.week;
      if (s.weekNumbers) {
        const td = document.createElement("td");
        td.className = CLS.weekNumber;
        const inner = document.createElement("div");
        inner.className = CLS.weekNumberInner;
        inner.textContent = String(isoWeek(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7))).padStart(2, "0");
        td.appendChild(inner);
        tr.appendChild(td);
      }
      for (let i = 0; i < 7; i++) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
        const outside = date.getMonth() !== month.getMonth();
        const mods = {
          outside: outside,
          today: sameDay(date, today),
          disabled: isDisabled(s, date),
          booked: s.bookedDates.some((d) => sameDay(d, date)),
          selectedSingle: false,
          rangeStart: false,
          rangeMiddle: false,
          rangeEnd: false,
        };
        if (s.mode === "range" && s.selected) {
          const from = s.selected;
          const to = s.end;
          if (to && !sameDay(from, to)) {
            mods.rangeStart = sameDay(date, from);
            mods.rangeEnd = sameDay(date, to);
            mods.rangeMiddle = date > from && date < to;
          } else {
            mods.rangeStart = sameDay(date, from);
            mods.rangeEnd = sameDay(date, from);
          }
        } else if (s.selected) {
          mods.selectedSingle = sameDay(date, s.selected);
        }
        const selected = mods.selectedSingle || mods.rangeStart || mods.rangeMiddle || mods.rangeEnd;

        const td = document.createElement("td");
        td.className = dayCellClasses(s, mods) + (outside && !s.outsideDays ? " invisible" : "");
        td.setAttribute("data-selected", selected ? "true" : "false");

        const btn = template.content.firstElementChild.cloneNode(true);
        btn.textContent = String(date.getDate());
        btn.setAttribute("data-day", toISO(date));
        btn.setAttribute("data-outside", outside ? "true" : "false");
        btn.setAttribute("data-selected-single", mods.selectedSingle ? "true" : "false");
        btn.setAttribute("data-range-start", mods.rangeStart ? "true" : "false");
        btn.setAttribute("data-range-middle", mods.rangeMiddle ? "true" : "false");
        btn.setAttribute("data-range-end", mods.rangeEnd ? "true" : "false");
        if (selected) btn.setAttribute("aria-selected", "true");
        if (mods.disabled || (outside && !s.outsideDays)) btn.disabled = true;
        td.appendChild(btn);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  function updateNav(root, s) {
    const prev = root.querySelector('[data-slot="calendar-previous"]');
    const next = root.querySelector('[data-slot="calendar-next"]');
    if (prev && s.min) {
      prev.disabled = s.month <= new Date(s.min.getFullYear(), s.min.getMonth(), 1);
    }
    if (next && s.max) {
      next.disabled = new Date(s.month.getFullYear(), s.month.getMonth() + 1, 1) > s.max;
    }
  }

  function sync(root, s) {
    const hidden = root.querySelector('[data-slot="calendar-input"]');
    const hiddenEnd = root.querySelector('[data-slot="calendar-end-input"]');
    if (hiddenEnd && hiddenEnd.value !== toISO(s.end)) {
      hiddenEnd.value = toISO(s.end);
      hiddenEnd.dispatchEvent(new Event("input", { bubbles: true }));
      hiddenEnd.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (hidden && hidden.value !== toISO(s.selected)) {
      hidden.value = toISO(s.selected);
      hidden.dispatchEvent(new Event("input", { bubbles: true }));
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function requestValueChange(root, selected, end) {
    return root.dispatchEvent(
      new CustomEvent("calendar-change", {
        bubbles: true,
        cancelable: true,
        detail: { value: selected, endValue: end, valueISO: toISO(selected), endValueISO: toISO(end) },
      }),
    );
  }

  function commit(root, selected, end) {
    const s = state(root);
    s.selected = selected;
    s.end = end;
    root.toggleAttribute("data-selected", !!selected);
    if (selected) root.setAttribute("data-selected", toISO(selected));
    root.toggleAttribute("data-range-end", !!end);
    if (end) root.setAttribute("data-range-end", toISO(end));
    render(root);
    sync(root, s);
  }

  // Range selection is react-day-picker's addToRange (min 0, not required):
  // every click yields a complete range, a single day means from == to.
  // Clicking that single day again clears, clicking the start collapses to
  // it, clicking the end makes it the new start, clicks before/after extend,
  // clicks inside move the end.
  function selectDate(root, date) {
    const s = state(root);
    let selected = s.selected;
    let end = s.end;
    if (s.mode === "range") {
      const from = selected;
      const to = end || selected;
      if (!from) {
        selected = date;
        end = date;
      } else if (sameDay(from, date) && sameDay(to, date)) {
        selected = null;
        end = null;
      } else if (sameDay(from, date)) {
        end = date;
      } else if (sameDay(to, date)) {
        selected = date;
        end = date;
      } else if (date < from) {
        selected = date;
      } else {
        end = date;
      }
    } else {
      selected = sameDay(selected, date) ? null : date;
      end = null;
    }
    if (!requestValueChange(root, selected, end)) return;
    commit(root, selected, end);
    // Re-rendering destroyed the clicked button; refocus its replacement so
    // the focus ring stays on the day, exactly like react-day-picker.
    const btn = root.querySelector('[data-day="' + toISO(date) + '"]');
    if (btn) btn.focus();
  }

  function setDate(root, date) {
    const s = state(root);
    const end = s.mode === "range" ? date : null;
    if (!requestValueChange(root, date, end)) return;
    s.month = new Date(date.getFullYear(), date.getMonth(), 1);
    root.setAttribute("data-month", toISO(s.month));
    commit(root, date, end);
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const root = e.target.closest('[data-slot="calendar"]');
    if (!root) return;
    const s = state(root);

    const day = e.target.closest("[data-day]");
    if (day && !day.disabled) {
      selectDate(root, parseISO(day.getAttribute("data-day")));
      return;
    }
    if (e.target.closest('[data-slot="calendar-previous"]')) {
      s.month = new Date(s.month.getFullYear(), s.month.getMonth() - 1, 1);
      root.setAttribute("data-month", toISO(s.month));
      render(root);
      return;
    }
    if (e.target.closest('[data-slot="calendar-next"]')) {
      s.month = new Date(s.month.getFullYear(), s.month.getMonth() + 1, 1);
      root.setAttribute("data-month", toISO(s.month));
      render(root);
    }
  });

  document.addEventListener("change", (e) => {
    if (!(e.target instanceof Element)) return;
    const root = e.target.closest('[data-slot="calendar"]');
    if (!root) return;
    const s = state(root);
    if (e.target.matches('[data-slot="calendar-month-select"]')) {
      s.month = new Date(s.month.getFullYear(), parseInt(e.target.value, 10), 1);
      root.setAttribute("data-month", toISO(s.month));
      render(root);
    } else if (e.target.matches('[data-slot="calendar-year-select"]')) {
      s.month = new Date(parseInt(e.target.value, 10), s.month.getMonth(), 1);
      root.setAttribute("data-month", toISO(s.month));
      render(root);
    }
  });

  // Programmatic selection, e.g. from preset buttons: dispatch a
  // "calendar-set" CustomEvent with detail.date (ISO) on/inside the calendar.
  document.addEventListener("calendar-set", (e) => {
    const root = e.target instanceof Element && e.target.closest('[data-slot="calendar"]');
    if (!root) return;
    const date = parseISO(e.detail && e.detail.date);
    if (date) setDate(root, date);
  });

  // Keyboard: arrows move day focus, Enter/Space activate natively.
  document.addEventListener("keydown", (e) => {
    if (!(e.target instanceof Element) || !e.target.hasAttribute("data-day")) return;
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    const root = e.target.closest('[data-slot="calendar"]');
    const s = state(root);
    const current = parseISO(e.target.getAttribute("data-day"));
    const nextDate = new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta);
    if (nextDate.getMonth() !== s.month.getMonth() || nextDate.getFullYear() !== s.month.getFullYear()) {
      s.month = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
      root.setAttribute("data-month", toISO(s.month));
      render(root);
    }
    const btn = root.querySelector('[data-day="' + toISO(nextDate) + '"]');
    if (btn) btn.focus();
  });

  // The focus ring lives on the cell (group/day) like react-day-picker.
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof Element && e.target.hasAttribute("data-day")) {
      const td = e.target.closest("td");
      if (td) td.setAttribute("data-focused", "true");
    }
  });
  document.addEventListener("focusout", (e) => {
    if (e.target instanceof Element && e.target.hasAttribute("data-day")) {
      const td = e.target.closest("td");
      if (td) td.removeAttribute("data-focused");
    }
  });

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.matches('[data-slot="calendar-input"], [data-slot="calendar-end-input"]')) return;
    const root = input.closest('[data-slot="calendar"]');
    if (!root) return;
    if (input.matches('[data-slot="calendar-input"]')) {
      root.toggleAttribute("data-selected", input.value !== "");
      if (input.value) root.setAttribute("data-selected", input.value);
    } else {
      root.toggleAttribute("data-range-end", input.value !== "");
      if (input.value) root.setAttribute("data-range-end", input.value);
    }
  });

  window.shadcnTempl.lifecycle.register("calendar", {
    selector: '[data-slot="calendar"]',
    setup(root) {
      render(root);
      const inputs = root.querySelectorAll(
        '[data-slot="calendar-input"], [data-slot="calendar-end-input"]',
      );
      const cleanups = [...inputs].map((input) =>
        window.shadcnTempl.lifecycle.watchProperty(input, "value", () => {
          if (input.matches('[data-slot="calendar-input"]')) {
            root.toggleAttribute("data-selected", input.value !== "");
            if (input.value) root.setAttribute("data-selected", input.value);
          } else {
            root.toggleAttribute("data-range-end", input.value !== "");
            if (input.value) root.setAttribute("data-range-end", input.value);
          }
        }),
      );
      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
    attributes: ["data-selected", "data-range-end", "data-month"],
    attributeChanged(root) {
      const s = state(root);
      const selected = parseISO(root.getAttribute("data-selected"));
      const end = parseISO(root.getAttribute("data-range-end"));
      const month = parseISO(root.getAttribute("data-month"));
      const sameSelection = (!selected && !s.selected) || sameDay(selected, s.selected);
      const sameEnd = (!end && !s.end) || sameDay(end, s.end);
      const sameMonth = !month || (month.getFullYear() === s.month.getFullYear() && month.getMonth() === s.month.getMonth());
      if (sameSelection && sameEnd && sameMonth) return;
      s.selected = selected;
      s.end = end;
      if (month) s.month = new Date(month.getFullYear(), month.getMonth(), 1);
      render(root);
      sync(root, s);
    },
  });
})();
