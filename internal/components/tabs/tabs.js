(function () {
  // IIFE
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
    const marker = container.querySelector(
      `[data-tabs-marker][data-tabs-id="${tabsId}"]`
    );

    function updateMarker(activeTrigger) {
      if (!marker || !activeTrigger) return;

      marker.style.width = activeTrigger.offsetWidth + "px";
      marker.style.height = activeTrigger.offsetHeight + "px";
      marker.style.left = activeTrigger.offsetLeft + "px";
    }

    function setActiveTab(value) {
      let activeTrigger = null;

      for (const trigger of triggers) {
        const isActive = trigger.dataset.tabsValue === value;
        trigger.dataset.state = isActive ? "active" : "inactive";
        trigger.classList.toggle("text-foreground", isActive);
        trigger.classList.toggle("bg-background", isActive);
        trigger.classList.toggle("shadow-xs", isActive);

        if (isActive) activeTrigger = trigger;
      }

      for (const content of contents) {
        const isActive = content.dataset.tabsValue === value;
        content.dataset.state = isActive ? "active" : "inactive";
        content.classList.toggle("hidden", !isActive);
      }

      updateMarker(activeTrigger);
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

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches("[data-tabs]")) {
      initTabs(root);
    }
    for (const tabs of root.querySelectorAll(
      "[data-tabs]:not([data-initialized])"
    )) {
      initTabs(tabs);
    }
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  document.addEventListener("DOMContentLoaded", () => initAllComponents());
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})(); // End of IIFE
