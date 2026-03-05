import "./floating_ui_dom.js";
import "./floating_ui_core.js";

(function () {
  "use strict";

  const floatingCleanups = new Map();
  const hoverTimeouts = new Map();

  // Ensure portal container exists
  if (!document.querySelector("[data-tui-popover-portal-container]")) {
    const portal = document.createElement("div");
    portal.setAttribute("data-tui-popover-portal-container", "");
    portal.className = "fixed inset-0 z-[9999] pointer-events-none";
    document.body.appendChild(portal);
  }

  // Add animation styles
  if (!document.getElementById("popover-animations")) {
    const style = document.createElement("style");
    style.id = "popover-animations";
    style.textContent = `
      @keyframes popover-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes popover-out { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.95); } }
      [data-tui-popover-id].popover-animate-in { animation: popover-in 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
      [data-tui-popover-id].popover-animate-out { animation: popover-out 0.1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    `;
    document.head.appendChild(style);
  }

  // Core positioning function
  function updatePosition(trigger, content) {
    if (!window.FloatingUIDOM) return;

    const { computePosition, offset, flip, shift, arrow } =
      window.FloatingUIDOM;
    const arrowEl = content.querySelector("[data-tui-popover-arrow]");
    const placement =
      content.getAttribute("data-tui-popover-placement") || "bottom";
    const offsetValue =
      parseInt(content.getAttribute("data-tui-popover-offset")) ||
      (arrowEl ? 8 : 4);

    const middleware = [
      offset(offsetValue),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
    ];
    if (arrowEl) middleware.push(arrow({ element: arrowEl, padding: 5 }));

    // Find best reference element (largest child or trigger itself)
    let ref = trigger;
    let maxArea = 0;
    for (const child of trigger.children) {
      const rect = child.getBoundingClientRect?.();
      if (rect) {
        const area = rect.width * rect.height;
        if (area > maxArea) {
          maxArea = area;
          ref = child;
        }
      }
    }

    computePosition(ref, content, { placement, middleware }).then(
      ({ x, y, placement: finalPlacement, middlewareData }) => {
        Object.assign(content.style, { left: `${x}px`, top: `${y}px` });

        // Handle arrow positioning
        if (arrowEl && middlewareData.arrow) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow;

          // Set placement attribute for CSS styling
          arrowEl.setAttribute("data-tui-popover-placement", finalPlacement);

          // Position the arrow (X/Y only, rest handled by CSS)
          Object.assign(arrowEl.style, {
            left: arrowX != null ? `${arrowX}px` : "",
            top: arrowY != null ? `${arrowY}px` : "",
          });
        }

        // Match trigger width if requested
        if (content.getAttribute("data-tui-popover-match-width") === "true") {
          content.style.setProperty(
            "--popover-trigger-width",
            `${ref.offsetWidth}px`,
          );
        }
      },
    );
  }

  // Internal helper to open popover with trigger element
  function openPopoverWithTrigger(trigger) {
    if (!window.FloatingUIDOM) return;

    const popoverId = trigger.getAttribute("data-tui-popover-trigger");
    if (!popoverId) return;

    const content = document.getElementById(popoverId);
    if (!content) return;

    // Close other exclusive popovers, but preserve parent-child relationships.
    // Only close popovers that are: (1) currently open, (2) different from the new one, and (3) not parents of the trigger.
    // This allows nested dropdowns (e.g., submenus) to open without closing their parent dropdown.
    for (const openPopover of document.querySelectorAll('[data-tui-popover-exclusive="true"][data-tui-popover-open="true"]')) {
      const id = openPopover.id;
      if (id && id !== popoverId && !openPopover.contains(trigger)) {
        closePopover(id);
      }
    }

    // Move to portal
    const portal = document.querySelector(
      "[data-tui-popover-portal-container]",
    );
    if (portal && content.parentNode !== portal) {
      portal.appendChild(content);
    }

    // Show and animate
    content.style.display = "block";
    content.classList.remove("popover-animate-out");
    content.classList.add("popover-animate-in");
    content.setAttribute("data-tui-popover-open", "true");

    // Update all triggers
    document
      .querySelectorAll(`[data-tui-popover-trigger="${popoverId}"]`)
      .forEach((t) => {
        t.setAttribute("data-tui-popover-open", "true");
      });

    // Position and start auto-update
    updatePosition(trigger, content);
    const cleanup = window.FloatingUIDOM.autoUpdate(
      trigger,
      content,
      () => updatePosition(trigger, content),
      { animationFrame: true },
    );
    floatingCleanups.set(popoverId, cleanup);
  }

  // Open popover by ID
  function openPopover(id) {
    const trigger = document.querySelector(
      `[data-tui-popover-trigger="${id}"]`,
    );
    if (trigger) {
      openPopoverWithTrigger(trigger);
    }
  }

  // Close popover
  function closePopover(popoverId, immediate = false) {
    const content = document.getElementById(popoverId);
    if (!content) return;

    // Stop auto-update
    const cleanup = floatingCleanups.get(popoverId);
    if (cleanup) {
      cleanup();
      floatingCleanups.delete(popoverId);
    }

    // Clear hover timeouts
    const timeouts = hoverTimeouts.get(popoverId);
    if (timeouts) {
      clearTimeout(timeouts.enter);
      clearTimeout(timeouts.leave);
      hoverTimeouts.delete(popoverId);
    }

    // Update attributes
    content.setAttribute("data-tui-popover-open", "false");
    document
      .querySelectorAll(`[data-tui-popover-trigger="${popoverId}"]`)
      .forEach((t) => {
        t.setAttribute("data-tui-popover-open", "false");
      });

    // Hide with animation
    function hide() {
      content.style.display = "none";
      content.classList.remove("popover-animate-in", "popover-animate-out");
    }

    if (immediate) {
      hide();
    } else {
      content.classList.remove("popover-animate-in");
      content.classList.add("popover-animate-out");
      setTimeout(hide, 150);
    }
  }

  // Check if popover is open
  function isPopoverOpen(id) {
    const content = document.getElementById(id);
    return content?.getAttribute("data-tui-popover-open") === "true" || false;
  }

  // Toggle popover
  function togglePopover(id) {
    isPopoverOpen(id) ? closePopover(id) : openPopover(id);
  }

  // Close all popovers except one
  function closeAllPopovers(exceptId = null) {
    document
      .querySelectorAll('[data-tui-popover-open="true"][data-tui-popover-id]')
      .forEach((content) => {
        if (content.id && content.id !== exceptId) {
          closePopover(content.id);
        }
      });
  }

  // Click handler
  document.addEventListener("click", (e) => {
    // Handle trigger clicks
    const trigger = e.target.closest("[data-tui-popover-trigger]");
    const triggerType = trigger?.getAttribute("data-tui-popover-type");
    if (trigger && triggerType !== "hover" && triggerType !== "manual") {
      // Check for disabled elements
      const disabledChild = trigger.querySelector(
        ':disabled, [disabled], [aria-disabled="true"]',
      );
      if (disabledChild) {
        return; // Don't open popover if a child is disabled
      }

      e.stopPropagation();
      const popoverId = trigger.getAttribute("data-tui-popover-trigger");
      if (popoverId) {
        togglePopover(popoverId);
      }
      return;
    }

    // Handle click-away
    const clickedContent = e.target.closest("[data-tui-popover-id]");
    document
      .querySelectorAll('[data-tui-popover-open="true"][data-tui-popover-id]')
      .forEach((content) => {
        if (
          content !== clickedContent &&
          content.getAttribute("data-tui-popover-disable-clickaway") !== "true"
        ) {
          const popoverId = content.id;
          const triggers = document.querySelectorAll(
            `[data-tui-popover-trigger="${popoverId}"]`,
          );
          let clickedTrigger = false;

          for (const t of triggers) {
            if (t.contains(e.target)) {
              clickedTrigger = true;
              break;
            }
          }

          if (!clickedTrigger) {
            closePopover(popoverId);
          }
        }
      });
  });

  // Hover handlers
  function handleHoverEnter(trigger, popoverId) {
    const content = document.getElementById(popoverId);
    if (!content) return;

    const delay =
      parseInt(content.getAttribute("data-tui-popover-hover-delay")) || 100;
    const timeouts = hoverTimeouts.get(popoverId) || {};

    clearTimeout(timeouts.leave);
    timeouts.enter = setTimeout(() => openPopoverWithTrigger(trigger), delay);
    hoverTimeouts.set(popoverId, timeouts);
  }

  function handleHoverLeave(popoverId, movingToRelated) {
    const content = document.getElementById(popoverId);
    if (!content) return;

    const delay =
      parseInt(content.getAttribute("data-tui-popover-hover-out-delay")) || 200;
    const timeouts = hoverTimeouts.get(popoverId) || {};

    clearTimeout(timeouts.enter);

    if (!movingToRelated) {
      timeouts.leave = setTimeout(() => closePopover(popoverId), delay);
      hoverTimeouts.set(popoverId, timeouts);
    }
  }

  // Mouse events for hover popovers
  document.addEventListener("mouseover", (e) => {
    const trigger = e.target.closest("[data-tui-popover-trigger]");
    if (trigger && !trigger.contains(e.relatedTarget)) {
      if (trigger.getAttribute("data-tui-popover-type") === "hover") {
        const popoverId = trigger.getAttribute("data-tui-popover-trigger");
        if (popoverId) {
          handleHoverEnter(trigger, popoverId);
        }
      }
    }

    // Keep hover popover open when over content
    const content = e.target.closest("[data-tui-popover-id]");
    if (
      content &&
      !content.contains(e.relatedTarget) &&
      content.getAttribute("data-tui-popover-open") === "true"
    ) {
      const popoverId = content.id;
      const triggers = document.querySelectorAll(
        `[data-tui-popover-trigger="${popoverId}"]`,
      );

      for (const t of triggers) {
        if (t.getAttribute("data-tui-popover-type") === "hover") {
          const timeouts = hoverTimeouts.get(popoverId) || {};
          clearTimeout(timeouts.leave);
          hoverTimeouts.set(popoverId, timeouts);
          break;
        }
      }
    }
  });

  document.addEventListener("mouseout", (e) => {
    const trigger = e.target.closest("[data-tui-popover-trigger]");
    if (trigger && !trigger.contains(e.relatedTarget)) {
      if (trigger.getAttribute("data-tui-popover-type") === "hover") {
        const popoverId = trigger.getAttribute("data-tui-popover-trigger");
        const content = document.getElementById(popoverId);
        handleHoverLeave(popoverId, content?.contains(e.relatedTarget));
      }
    }

    // Handle leaving popover content
    const content = e.target.closest("[data-tui-popover-id]");
    if (
      content &&
      !content.contains(e.relatedTarget) &&
      content.getAttribute("data-tui-popover-open") === "true"
    ) {
      const popoverId = content.id;
      const triggers = document.querySelectorAll(
        `[data-tui-popover-trigger="${popoverId}"]`,
      );

      // Only handle hover popovers
      let isHoverPopover = false;
      let movingToTrigger = false;

      for (const t of triggers) {
        if (t.getAttribute("data-tui-popover-type") === "hover") {
          isHoverPopover = true;
          if (t.contains(e.relatedTarget)) {
            movingToTrigger = true;
          }
        }
      }

      if (isHoverPopover && !movingToTrigger) {
        handleHoverLeave(popoverId, false);
      }
    }
  });

  // ESC key handler
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document
        .querySelectorAll('[data-tui-popover-open="true"][data-tui-popover-id]')
        .forEach((content) => {
          if (content.getAttribute("data-tui-popover-disable-esc") !== "true") {
            closePopover(content.id);
          }
        });
    }
  });

  // Auto-update cursor based on disabled state
  function updateTriggerStates() {
    document
      .querySelectorAll("[data-tui-popover-trigger]")
      .forEach((trigger) => {
        const hasDisabled = trigger.querySelector(
          ':disabled, [disabled], [aria-disabled="true"]',
        );
        if (hasDisabled) {
          trigger.classList.add("cursor-not-allowed", "opacity-50");
          trigger.classList.remove("cursor-pointer");
        } else {
          trigger.classList.remove("cursor-not-allowed", "opacity-50");
          trigger.classList.add("cursor-pointer");
        }
      });
  }

  // Initial update and observe for changes
  document.addEventListener("DOMContentLoaded", updateTriggerStates);

  new MutationObserver(updateTriggerStates).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "aria-disabled"],
    childList: true,
  });

  // Expose for other components (legacy)
  window.closePopover = closePopover;

  // Expose public API
  window.tui = window.tui || {};
  window.tui.popover = {
    open: openPopover,
    close: closePopover,
    closeAll: closeAllPopovers,
    toggle: togglePopover,
    isOpen: isPopoverOpen,
  };
})();

