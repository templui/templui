(function () {
  function isOn(el) {
    return el.hasAttribute("data-pressed");
  }

  function setState(el, on) {
    el.toggleAttribute("data-pressed", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  }

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-tui-toggle]");
    if (!toggle || toggle.disabled) return;

    const group = toggle.closest("[data-tui-toggle-group]");

    if (group && !group.hasAttribute("data-multiple")) {
      const wasOn = isOn(toggle);
      group
        .querySelectorAll("[data-tui-toggle]")
        .forEach((t) => setState(t, false));
      setState(toggle, !wasOn);
    } else {
      setState(toggle, !isOn(toggle));
    }

    // Expose the group's active value(s) so CSS/HTMX can react without custom JS.
    if (group) {
      const on = [...group.querySelectorAll('[data-tui-toggle][data-pressed]')]
        .map((t) => t.getAttribute("data-tui-toggle-value"))
        .filter(Boolean);
      group.setAttribute("data-tui-toggle-group-value", on.join(" "));
    }

    toggle.dispatchEvent(
      new CustomEvent("toggle-change", {
        bubbles: true,
        detail: {
          pressed: isOn(toggle),
          value: toggle.getAttribute("data-tui-toggle-value"),
        },
      }),
    );
  });
})();
