import "./floating_ui_core.js";
import "./floating_ui_dom.js";

(function () {
  "use strict";

  const floatingCleanups = new WeakMap();
  const hoverTimeouts = new WeakMap();
  const arrowBaseClass =
    "absolute h-2.5 w-2.5 rotate-45 bg-popover border border-border";

  function getRootById(id) {
    const root = document.getElementById(id);
    return root?.matches("[data-tui-popover-root]") ? root : null;
  }

  function getRoots() {
    return Array.from(document.querySelectorAll("[data-tui-popover-root]"));
  }

  function getContent(root) {
    return Array.from(root?.children || []).find((child) =>
      child.matches("[data-tui-popover-content]"),
    );
  }

  function getTriggers(root) {
    return Array.from(root?.children || []).filter((child) =>
      child.matches("[data-tui-popover-trigger]"),
    );
  }

  function getReferenceElement(trigger) {
    let ref = trigger;
    let maxArea = 0;

    for (const child of trigger.children) {
      const rect = child.getBoundingClientRect?.();
      if (!rect) continue;

      const area = rect.width * rect.height;
      if (area > maxArea) {
        maxArea = area;
        ref = child;
      }
    }

    return ref;
  }

  function isHoverRoot(root) {
    return getTriggers(root).some(
      (trigger) => trigger.getAttribute("data-tui-popover-type") === "hover",
    );
  }

  function isOpenRoot(root) {
    return !!getContent(root)?.matches(":popover-open");
  }

  function isOpen(id) {
    const root = getRootById(id);
    return root ? isOpenRoot(root) : false;
  }

  function clearHoverTimeouts(root) {
    const timeouts = hoverTimeouts.get(root);
    if (!timeouts) return;
    clearTimeout(timeouts.enter);
    clearTimeout(timeouts.leave);
    hoverTimeouts.delete(root);
  }

  function stopAutoUpdate(root) {
    const cleanup = floatingCleanups.get(root);
    if (!cleanup) return;
    cleanup();
    floatingCleanups.delete(root);
  }

  function arrowClassForPlacement(placement) {
    switch (placement) {
      case "top-start":
      case "top":
      case "top-end":
        return `${arrowBaseClass} -bottom-[5px] border-t-transparent border-l-transparent`;
      case "right-start":
      case "right":
      case "right-end":
        return `${arrowBaseClass} -left-[5px] border-r-transparent border-t-transparent`;
      case "bottom-start":
      case "bottom":
      case "bottom-end":
        return `${arrowBaseClass} -top-[5px] border-b-transparent border-r-transparent`;
      case "left-start":
      case "left":
      case "left-end":
        return `${arrowBaseClass} -right-[5px] border-l-transparent border-b-transparent`;
      default:
        return `${arrowBaseClass} -top-[5px] border-b-transparent border-r-transparent`;
    }
  }

  function updatePosition(root, triggerOverride = null) {
    if (!window.FloatingUIDOM) return;

    const trigger = triggerOverride || getTriggers(root)[0];
    const content = getContent(root);
    if (!trigger || !content) return;

    const { computePosition, offset, flip, shift, arrow } =
      window.FloatingUIDOM;
    const reference = getReferenceElement(trigger);
    const arrowEl = content.querySelector("[data-tui-popover-arrow]");
    const placement = content.getAttribute("data-tui-popover-placement") || "bottom";
    const offsetValue =
      parseInt(content.getAttribute("data-tui-popover-offset"), 10) ||
      (arrowEl ? 8 : 4);

    const middleware = [
      offset(offsetValue),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
    ];

    if (arrowEl) {
      middleware.push(arrow({ element: arrowEl, padding: 5 }));
    }

    // Match the fixed-position popover layer so scroll offsets stay correct.
    computePosition(reference, content, {
      placement,
      middleware,
      strategy: "fixed",
    }).then(
      ({ x, y, placement: finalPlacement, middlewareData }) => {
        Object.assign(content.style, {
          left: `${x}px`,
          top: `${y}px`,
        });

        if (arrowEl && middlewareData.arrow) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow;

          arrowEl.setAttribute("data-tui-popover-placement", finalPlacement);
          arrowEl.className = arrowClassForPlacement(finalPlacement);
          Object.assign(arrowEl.style, {
            left: arrowX != null ? `${arrowX}px` : "",
            top: arrowY != null ? `${arrowY}px` : "",
          });
        }
      },
    );
  }

  function closeRoot(root) {
    const content = getContent(root);
    if (!content) return;

    stopAutoUpdate(root);
    clearHoverTimeouts(root);
    content.setAttribute("data-tui-popover-open", "false");

    getTriggers(root).forEach((trigger) => {
      trigger.setAttribute("data-tui-popover-open", "false");
    });

    if (content.matches(":popover-open")) {
      try {
        content.hidePopover();
      } catch {
        // ignore
      }
    }
  }

  function close(id) {
    const root = getRootById(id);
    if (root) {
      closeRoot(root);
    }
  }

  function closeAllRoots(exceptRoot = null) {
    getRoots().forEach((root) => {
      if (root !== exceptRoot && isOpenRoot(root)) {
        closeRoot(root);
      }
    });
  }

  function closeAll(exceptId = null) {
    closeAllRoots(exceptId ? getRootById(exceptId) : null);
  }

  function openRoot(root, triggerOverride = null) {
    const content = getContent(root);
    const trigger = triggerOverride || getTriggers(root)[0];
    if (!content || !trigger) return;

    if (content.getAttribute("data-tui-popover-exclusive") === "true") {
      closeAllRoots(root);
    }

    if (!content.matches(":popover-open")) {
      try {
        content.showPopover();
      } catch {
        return;
      }
    }

    content.setAttribute("data-tui-popover-open", "true");
    getTriggers(root).forEach((item) => {
      item.setAttribute("data-tui-popover-open", "true");
    });

    stopAutoUpdate(root);
    updatePosition(root, trigger);

    if (window.FloatingUIDOM) {
      const cleanup = window.FloatingUIDOM.autoUpdate(
        trigger,
        content,
        () => updatePosition(root, trigger),
        { animationFrame: true },
      );
      floatingCleanups.set(root, cleanup);
    }
  }

  function open(id) {
    const root = getRootById(id);
    if (root) {
      openRoot(root);
    }
  }

  function toggleRoot(root, triggerOverride = null) {
    if (isOpenRoot(root)) {
      closeRoot(root);
      return;
    }

    openRoot(root, triggerOverride);
  }

  function toggle(id) {
    const root = getRootById(id);
    if (root) {
      toggleRoot(root);
    }
  }

  function clearOtherHoverRoots(activeRoot) {
    getRoots().forEach((root) => {
      if (root === activeRoot || !isHoverRoot(root)) {
        return;
      }

      clearHoverTimeouts(root);
      closeRoot(root);
    });
  }

  function handleHoverEnter(root, trigger) {
    const content = getContent(root);
    if (!content || !isHoverRoot(root)) return;

    const delay =
      parseInt(content.getAttribute("data-tui-popover-hover-delay"), 10) || 100;
    const timeouts = hoverTimeouts.get(root) || {};

    clearOtherHoverRoots(root);
    clearTimeout(timeouts.leave);
    clearTimeout(timeouts.enter);
    timeouts.enter = setTimeout(() => openRoot(root, trigger), delay);
    hoverTimeouts.set(root, timeouts);
  }

  function handleHoverLeave(root, movingWithinPair) {
    const content = getContent(root);
    if (!content || !isHoverRoot(root)) return;

    const delay =
      parseInt(content.getAttribute("data-tui-popover-hover-out-delay"), 10) ||
      200;
    const timeouts = hoverTimeouts.get(root) || {};

    clearTimeout(timeouts.enter);
    if (!movingWithinPair) {
      timeouts.leave = setTimeout(() => closeRoot(root), delay);
      hoverTimeouts.set(root, timeouts);
    }
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-tui-popover-trigger]");
    const root = trigger?.closest("[data-tui-popover-root]");
    const triggerType = trigger?.getAttribute("data-tui-popover-type");

    if (
      trigger &&
      root &&
      triggerType !== "hover" &&
      triggerType !== "manual"
    ) {
      const disabledChild = trigger.querySelector(
        ':disabled, [disabled], [aria-disabled="true"]',
      );
      if (disabledChild) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleRoot(root, trigger);
      return;
    }

    getRoots().forEach((currentRoot) => {
      const content = getContent(currentRoot);
      if (
        !content ||
        !content.matches(":popover-open") ||
        content.getAttribute("data-tui-popover-disable-clickaway") === "true"
      ) {
        return;
      }

      const clickedInsideContent = content.contains(event.target);
      const clickedTrigger = getTriggers(currentRoot).some((item) =>
        item.contains(event.target),
      );

      if (!clickedInsideContent && !clickedTrigger) {
        closeRoot(currentRoot);
      }
    });
  });

  document.addEventListener("mouseover", (event) => {
    const trigger = event.target.closest("[data-tui-popover-trigger]");
    const root = trigger?.closest("[data-tui-popover-root]");
    if (
      trigger &&
      root &&
      !trigger.contains(event.relatedTarget) &&
      trigger.getAttribute("data-tui-popover-type") === "hover"
    ) {
      handleHoverEnter(root, trigger);
    }

    const content = event.target.closest("[data-tui-popover-content]");
    const contentRoot = content?.closest("[data-tui-popover-root]");
    if (
      content &&
      contentRoot &&
      isHoverRoot(contentRoot) &&
      !content.contains(event.relatedTarget) &&
      content.matches(":popover-open")
    ) {
      const timeouts = hoverTimeouts.get(contentRoot) || {};
      clearTimeout(timeouts.leave);
      hoverTimeouts.set(contentRoot, timeouts);
    }
  });

  document.addEventListener("mouseout", (event) => {
    const trigger = event.target.closest("[data-tui-popover-trigger]");
    const root = trigger?.closest("[data-tui-popover-root]");
    if (
      trigger &&
      root &&
      !trigger.contains(event.relatedTarget) &&
      trigger.getAttribute("data-tui-popover-type") === "hover"
    ) {
      const content = getContent(root);
      handleHoverLeave(root, !!content?.contains(event.relatedTarget));
    }

    const content = event.target.closest("[data-tui-popover-content]");
    const contentRoot = content?.closest("[data-tui-popover-root]");
    if (
      content &&
      contentRoot &&
      isHoverRoot(contentRoot) &&
      !content.contains(event.relatedTarget) &&
      content.matches(":popover-open")
    ) {
      const movingToTrigger = getTriggers(contentRoot).some((item) =>
        item.contains(event.relatedTarget),
      );
      handleHoverLeave(contentRoot, movingToTrigger);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    getRoots().forEach((root) => {
      const content = getContent(root);
      if (
        content &&
        content.matches(":popover-open") &&
        content.getAttribute("data-tui-popover-disable-esc") !== "true"
      ) {
        closeRoot(root);
      }
    });
  });

  window.tui = window.tui || {};
  window.tui.popover = {
    open,
    close,
    closeAll,
    toggle,
    isOpen,
  };
})();
