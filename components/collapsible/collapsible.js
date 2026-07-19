(function () {
  "use strict";

  function panelFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls") || "");
  }

  function setOpen(el, isOpen) {
    el.toggleAttribute("data-open", isOpen);
    el.toggleAttribute("data-closed", !isOpen);
  }

  // Exposes the measured panel height, like Base UI's
  // --collapsible-panel-height, so consumers can animate it.
  function measure(panel) {
    panel.style.setProperty("--tui-collapsible-panel-height", panel.scrollHeight + "px");
  }

  function toggle(trigger) {
    const panel = panelFor(trigger);
    if (!panel) return;
    const root = panel.closest("[data-tui-collapsible]");
    const isOpen = !panel.hasAttribute("data-open");

    panel.hidden = !isOpen;
    setOpen(panel, isOpen);
    if (root) setOpen(root, isOpen);
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    trigger.toggleAttribute("data-panel-open", isOpen);
    if (isOpen) measure(panel);
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-collapsible-trigger]");
    if (trigger) toggle(trigger);
  });
})();
