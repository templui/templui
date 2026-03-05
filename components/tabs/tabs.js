(function () {
  "use strict";

  // Update tab state
  function setActiveTab(tabsId, value) {
    // Update all triggers with this tabs-id
    document
      .querySelectorAll(`[data-tui-tabs-trigger][data-tui-tabs-id="${tabsId}"]`)
      .forEach((trigger) => {
        const isActive = trigger.getAttribute("data-tui-tabs-value") === value;
        trigger.setAttribute(
          "data-tui-tabs-state",
          isActive ? "active" : "inactive",
        );
      });

    // Update all contents with this tabs-id
    document
      .querySelectorAll(`[data-tui-tabs-content][data-tui-tabs-id="${tabsId}"]`)
      .forEach((content) => {
        const isActive = content.getAttribute("data-tui-tabs-value") === value;
        content.setAttribute(
          "data-tui-tabs-state",
          isActive ? "active" : "inactive",
        );
        content.classList.toggle("hidden", !isActive);
      });
  }

  // Click handler
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-tui-tabs-trigger]");
    if (!trigger) return;

    const tabsId = trigger.getAttribute("data-tui-tabs-id");
    const value = trigger.getAttribute("data-tui-tabs-value");
    if (tabsId && value) {
      setActiveTab(tabsId, value);
    }
  });

  // Initialize active states
  function setupInitialStates() {
    document.querySelectorAll("[data-tui-tabs]").forEach((container) => {
      const tabsId = container.getAttribute("data-tui-tabs-id");
      if (!tabsId) return;

      // Find active trigger or use first
      const activeTrigger =
        container.querySelector(
          `[data-tui-tabs-trigger][data-tui-tabs-state="active"]`,
        ) || container.querySelector(`[data-tui-tabs-trigger]`);

      if (activeTrigger) {
        setActiveTab(tabsId, activeTrigger.getAttribute("data-tui-tabs-value"));
      }
    });
  }

  // Setup on load and mutations
  document.addEventListener("DOMContentLoaded", setupInitialStates);
  new MutationObserver(setupInitialStates).observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Expose public API
  window.tui = window.tui || {};
  window.tui.tabs = {
    setActive: setActiveTab,
  };
})();
