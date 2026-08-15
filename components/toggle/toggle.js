(function () {
  function isOn(el) {
    return el.hasAttribute("data-pressed");
  }

  function setState(el, on) {
    el.toggleAttribute("data-pressed", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function values(group) {
    return [...group.querySelectorAll('[data-tui-toggle][data-pressed]')]
      .map((toggle) => toggle.getAttribute("data-tui-toggle-value"))
      .filter(Boolean);
  }

  function nextValues(group, toggle, nextPressed) {
    const value = toggle.getAttribute("data-tui-toggle-value");
    if (!value) return values(group);
    if (!group.hasAttribute("data-multiple")) return nextPressed ? [value] : [];
    const next = new Set(values(group));
    if (nextPressed) next.add(value);
    else next.delete(value);
    return [...next];
  }

  function dispatchToggleChange(toggle, pressed) {
    return toggle.dispatchEvent(
      new CustomEvent("toggle-change", {
        bubbles: true,
        cancelable: true,
        detail: {
          pressed,
          value: toggle.getAttribute("data-tui-toggle-value"),
        },
      }),
    );
  }

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-tui-toggle]");
    if (!toggle || toggle.disabled) return;

    const group = toggle.closest("[data-tui-toggle-group]");
    const nextPressed = !isOn(toggle);
    if (!dispatchToggleChange(toggle, nextPressed)) return;
    const groupValue = group ? nextValues(group, toggle, nextPressed) : null;
    if (group) {
      const accepted = group.dispatchEvent(
        new CustomEvent("toggle-group-value-change", {
          bubbles: true,
          cancelable: true,
          detail: { value: groupValue },
        }),
      );
      if (!accepted) return;
    }
    if (
      toggle.hasAttribute("data-tui-toggle-controlled") ||
      (group && group.hasAttribute("data-tui-toggle-group-controlled"))
    ) {
      return;
    }

    if (group && !group.hasAttribute("data-multiple")) {
      group
        .querySelectorAll("[data-tui-toggle]")
        .forEach((t) => setState(t, false));
      setState(toggle, nextPressed);
    } else {
      setState(toggle, nextPressed);
    }

    // Expose the group's active value(s) so CSS/HTMX can react without custom JS.
    if (group) {
      const on = values(group);
      group.setAttribute("data-tui-toggle-group-value", on.join(" "));
    }
  });
})();
