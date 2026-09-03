(function () {
  const TOGGLE = '[data-slot="toggle"], [data-slot="toggle-group-item"]';

  function isOn(el) {
    return el.hasAttribute("data-pressed");
  }

  function setState(el, on) {
    el.toggleAttribute("data-pressed", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function values(group) {
    return [...group.querySelectorAll(TOGGLE + '[data-pressed]')]
      .map((toggle) => toggle.getAttribute("data-value"))
      .filter(Boolean);
  }

  function nextValues(group, toggle, nextPressed) {
    const value = toggle.getAttribute("data-value");
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
          value: toggle.getAttribute("data-value"),
        },
      }),
    );
  }

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(TOGGLE);
    if (!toggle || toggle.disabled) return;

    const group = toggle.closest('[data-slot="toggle-group"]');
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
    if (group && !group.hasAttribute("data-multiple")) {
      group
        .querySelectorAll(TOGGLE)
        .forEach((t) => setState(t, false));
      setState(toggle, nextPressed);
    } else {
      setState(toggle, nextPressed);
    }

  });

  window.shadcnTempl.lifecycle.register("toggle", {
    selector: TOGGLE + ', [data-slot="toggle-group"]',
    setup() {},
  });

  window.shadcnTempl.lifecycle.register("toggle-state", {
    selector: TOGGLE,
    setup() {},
    attributes: ["data-pressed"],
    attributeChanged(toggle) {
      setState(toggle, toggle.hasAttribute("data-pressed"));
    },
  });
})();
