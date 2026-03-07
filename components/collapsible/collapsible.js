(function () {
  "use strict";

  // Find the direct content element for a root (not nested ones)
  function findDirectContent(root) {
    const allContents = root.querySelectorAll('[data-tui-collapsible="content"]');
    for (const content of allContents) {
      if (content.closest('[data-tui-collapsible="root"]') === root) {
        return content;
      }
    }
    return null;
  }

  function toggle(trigger) {
    const root = trigger.closest('[data-tui-collapsible="root"]');
    if (!root) return;

    const content = findDirectContent(root);
    const isOpen = root.getAttribute("data-tui-collapsible-state") === "open";
    const newState = isOpen ? "closed" : "open";

    // Update states
    root.setAttribute("data-tui-collapsible-state", newState);
    trigger.setAttribute("aria-expanded", !isOpen);

    // Toggle class on content for nested collapsible support
    if (content) {
      content.classList.toggle("tui-collapsible-open", !isOpen);
    }
  }

  // Initialize collapsibles on page load
  function initializeCollapsibles() {
    document.querySelectorAll('[data-tui-collapsible="root"]').forEach((root) => {
      const isOpen = root.getAttribute("data-tui-collapsible-state") === "open";
      const content = findDirectContent(root);
      if (content) {
        content.classList.toggle("tui-collapsible-open", isOpen);
      }
    });
  }

  // Click handler
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('[data-tui-collapsible="trigger"]');
    if (trigger) {
      e.preventDefault();
      toggle(trigger);
    }
  });

  // Keyboard handler
  document.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    const trigger = e.target.closest('[data-tui-collapsible="trigger"]');
    if (trigger) {
      e.preventDefault();
      toggle(trigger);
    }
  });

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCollapsibles);
  } else {
    initializeCollapsibles();
  }
})();

