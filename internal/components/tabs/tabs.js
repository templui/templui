(function () {
  function initTabs(container) {
    if (container.hasAttribute("data-initialized")) return;

    container.setAttribute("data-initialized", "true");

    const tabsId = container.dataset.tabsId;
    if (!tabsId) return;

    const triggers = Array.from(
      container.querySelectorAll(
        `[data-tabs-trigger][data-tabs-id="${tabsId}"]`
      )
    );
    const contents = Array.from(
      container.querySelectorAll(
        `[data-tabs-content][data-tabs-id="${tabsId}"]`
      )
    );

    function setActiveTab(value) {
      for (const trigger of triggers) {
        const isActive = trigger.dataset.tabsValue === value;
        trigger.dataset.state = isActive ? "active" : "inactive";
      }

      for (const content of contents) {
        const isActive = content.dataset.tabsValue === value;
        content.dataset.state = isActive ? "active" : "inactive";
        content.classList.toggle("hidden", !isActive);
      }
    }

    const defaultTrigger =
      triggers.find((t) => t.dataset.state === "active") || triggers[0];
    if (defaultTrigger) {
      setActiveTab(defaultTrigger.dataset.tabsValue);
    }

    for (const trigger of triggers) {
      trigger.addEventListener("click", () => {
        setActiveTab(trigger.dataset.tabsValue);
      });
    }
  }

  function init(root = document) {
    if (root instanceof Element && root.matches("[data-tabs]")) {
      initTabs(root);
    }
    for (const tabs of root.querySelectorAll(
      "[data-tabs]:not([data-initialized])"
    )) {
      initTabs(tabs);
    }
  }

  window.templUI = window.templUI || {};
  window.templUI.tabs = { init: init };

  document.addEventListener("DOMContentLoaded", () => init());
})();
