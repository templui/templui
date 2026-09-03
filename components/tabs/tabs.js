(function () {
  "use strict";


  function rootOf(target) {
    if (target instanceof Element) {
      return target.matches('[data-slot="tabs"]')
        ? target
        : target.closest('[data-slot="tabs"]');
    }
    return typeof target === "string" ? document.getElementById(target) : null;
  }

  function setActiveTab(target, value) {
    const root = rootOf(target);
    if (!root || !value) return;
    if (root.getAttribute("data-value") !== value) root.setAttribute("data-value", value);
    root
      .querySelectorAll('[data-slot="tabs-trigger"]')
      .forEach((trigger) => {
        const isActive = trigger.getAttribute("data-value") === value;
        trigger.toggleAttribute("data-active", isActive);
        trigger.toggleAttribute("data-inactive", !isActive);
        trigger.setAttribute("aria-selected", String(isActive));
        trigger.setAttribute("tabindex", isActive ? "0" : "-1");
      });

    root
      .querySelectorAll('[data-slot="tabs-content"]')
      .forEach((content) => {
        const isActive = content.getAttribute("data-value") === value;
        content.toggleAttribute("data-active", isActive);
        content.toggleAttribute("data-inactive", !isActive);
        content.classList.toggle("hidden", !isActive);
      });
  }

  function requestValueChange(root, value) {
    if (!root || root.querySelector('[data-slot="tabs-trigger"][data-active]')?.getAttribute("data-value") === value) return;
    const accepted = root.dispatchEvent(
      new CustomEvent("tabs-value-change", {
        bubbles: true,
        cancelable: true,
        detail: { value },
      }),
    );
    if (!accepted) return;
    setActiveTab(root, value);
  }

  // Click handler
  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest('[data-slot="tabs-trigger"]');
    if (!trigger) return;

    const value = trigger.getAttribute("data-value");
    if (value) requestValueChange(rootOf(trigger), value);
  });

  document.addEventListener("keydown", (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest('[data-slot="tabs-trigger"]');
    if (!trigger) return;
    const root = rootOf(trigger);
    const orientation = root?.getAttribute("data-orientation") || "horizontal";
    const rtl = root && getComputedStyle(root).direction === "rtl";
    const previousKey = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    const nextKey = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    if (![previousKey, nextKey, "Home", "End"].includes(event.key)) return;
    const triggers = Array.from(root.querySelectorAll('[data-slot="tabs-trigger"]:not(:disabled)'));
    if (!triggers.length) return;
    event.preventDefault();
    let index = triggers.indexOf(trigger);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = triggers.length - 1;
    else index = (index + (event.key === nextKey ? 1 : -1) + triggers.length) % triggers.length;
    const next = triggers[index];
    next.focus();
    requestValueChange(root, next.getAttribute("data-value"));
  });

  // Initialize active states
  function setup(root) {
    const list = root.querySelector('[data-slot="tabs-list"]');
    if (list) list.setAttribute("aria-orientation", root.getAttribute("data-orientation") || "horizontal");
    const triggers = Array.from(root.querySelectorAll('[data-slot="tabs-trigger"]'));
    const contents = Array.from(root.querySelectorAll('[data-slot="tabs-content"]'));
    triggers.forEach((trigger, index) => {
      if (!trigger.id) trigger.id = root.id + "-trigger-" + index;
      const content = contents.find((candidate) => candidate.getAttribute("data-value") === trigger.getAttribute("data-value"));
      if (content) {
        if (!content.id) content.id = root.id + "-content-" + index;
        trigger.setAttribute("aria-controls", content.id);
        content.setAttribute("aria-labelledby", trigger.id);
      }
    });
    const value = root.getAttribute("data-value");
    const authored = root.querySelector('[data-slot="tabs-trigger"][data-active]');
    const activeTrigger = value
      ? root.querySelector('[data-slot="tabs-trigger"][data-value="' + CSS.escape(value) + '"]')
      : authored;
    if (activeTrigger) setActiveTab(root, activeTrigger.getAttribute("data-value"));
  }

  window.shadcnTempl.lifecycle.register("tabs", {
    selector: '[data-slot="tabs"]',
    setup,
    attributes: ["data-value"],
    attributeChanged(root) {
      setActiveTab(root, root.getAttribute("data-value"));
    },
  });

  window.shadcnTempl.tabs = {
    setActive: setActiveTab,
  };
})();
