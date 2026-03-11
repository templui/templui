(function () {
  "use strict";

  const hoverTimeouts = new Map();

  function getContent(id) {
    return document.querySelector(
      `[data-tui-popovernative-content][data-tui-popovernative-id="${id}"]`,
    );
  }

  function getTriggers(id) {
    return Array.from(
      document.querySelectorAll(`[data-tui-popovernative-trigger="${id}"]`),
    );
  }

  function isOpen(id) {
    return !!getContent(id)?.matches(":popover-open");
  }

  function closePopover(id) {
    const content = getContent(id);
    if (!content) return;

    const timeouts = hoverTimeouts.get(id);
    if (timeouts) {
      clearTimeout(timeouts.enter);
      clearTimeout(timeouts.leave);
      hoverTimeouts.delete(id);
    }

    if (content.matches(":popover-open")) {
      try {
        content.hidePopover();
      } catch {
        // ignore
      }
    }
  }

  function closeAll(exceptId = null) {
    document
      .querySelectorAll("[data-tui-popovernative-content]")
      .forEach((content) => {
        const id = content.getAttribute("data-tui-popovernative-id");
        if (id && id !== exceptId && content.matches(":popover-open")) {
          closePopover(id);
        }
      });
  }

  function openPopoverWithTrigger(trigger) {
    const id = trigger?.getAttribute("data-tui-popovernative-trigger");
    if (!id) return;

    const content = getContent(id);
    if (!content) return;

    if (content.getAttribute("data-tui-popovernative-exclusive") === "true") {
      closeAll(id);
    }

    if (!content.matches(":popover-open")) {
      try {
        content.showPopover();
      } catch {
        return;
      }
    }
  }

  function openPopover(id) {
    const trigger = getTriggers(id)[0];
    if (trigger) {
      openPopoverWithTrigger(trigger);
    }
  }

  function togglePopover(id, trigger = null) {
    if (isOpen(id)) {
      closePopover(id);
      return;
    }
    if (trigger) {
      openPopoverWithTrigger(trigger);
      return;
    }
    openPopover(id);
  }

  function handleHoverEnter(trigger, id) {
    const content = getContent(id);
    if (!content) return;

    const delay =
      parseInt(
        content.getAttribute("data-tui-popovernative-hover-delay"),
        10,
      ) || 100;
    const timeouts = hoverTimeouts.get(id) || {};
    clearTimeout(timeouts.leave);
    clearTimeout(timeouts.enter);
    timeouts.enter = setTimeout(() => openPopoverWithTrigger(trigger), delay);
    hoverTimeouts.set(id, timeouts);
  }

  function handleHoverLeave(id, movingWithinPair) {
    const content = getContent(id);
    if (!content) return;

    const delay =
      parseInt(
        content.getAttribute("data-tui-popovernative-hover-out-delay"),
        10,
      ) || 200;
    const timeouts = hoverTimeouts.get(id) || {};
    clearTimeout(timeouts.enter);
    if (!movingWithinPair) {
      timeouts.leave = setTimeout(() => closePopover(id), delay);
      hoverTimeouts.set(id, timeouts);
    }
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-tui-popovernative-trigger]");
    const triggerType = trigger?.getAttribute("data-tui-popovernative-type");

    if (trigger && triggerType !== "hover" && triggerType !== "manual") {
      event.preventDefault();
      event.stopPropagation();
      const id = trigger.getAttribute("data-tui-popovernative-trigger");
      if (id) {
        togglePopover(id, trigger);
      }
      return;
    }

    document
      .querySelectorAll("[data-tui-popovernative-content]")
      .forEach((content) => {
        if (
          !content.matches(":popover-open") ||
          content.getAttribute("data-tui-popovernative-disable-clickaway") ===
            "true"
        ) {
          return;
        }

        const id = content.getAttribute("data-tui-popovernative-id");
        if (!id) return;

        const clickedInsideContent = content.contains(event.target);
        const clickedTrigger = getTriggers(id).some((item) =>
          item.contains(event.target),
        );

        if (!clickedInsideContent && !clickedTrigger) {
          closePopover(id);
        }
      });
  });

  document.addEventListener("mouseover", (event) => {
    const trigger = event.target.closest("[data-tui-popovernative-trigger]");
    if (
      trigger &&
      !trigger.contains(event.relatedTarget) &&
      trigger.getAttribute("data-tui-popovernative-type") === "hover"
    ) {
      const id = trigger.getAttribute("data-tui-popovernative-trigger");
      if (id) {
        handleHoverEnter(trigger, id);
      }
    }

    const content = event.target.closest("[data-tui-popovernative-content]");
    if (
      content &&
      !content.contains(event.relatedTarget) &&
      content.matches(":popover-open")
    ) {
      const id = content.getAttribute("data-tui-popovernative-id");
      const timeouts = hoverTimeouts.get(id) || {};
      clearTimeout(timeouts.leave);
      hoverTimeouts.set(id, timeouts);
    }
  });

  document.addEventListener("mouseout", (event) => {
    const trigger = event.target.closest("[data-tui-popovernative-trigger]");
    if (
      trigger &&
      !trigger.contains(event.relatedTarget) &&
      trigger.getAttribute("data-tui-popovernative-type") === "hover"
    ) {
      const id = trigger.getAttribute("data-tui-popovernative-trigger");
      const content = getContent(id);
      handleHoverLeave(id, !!content?.contains(event.relatedTarget));
    }

    const content = event.target.closest("[data-tui-popovernative-content]");
    if (
      content &&
      !content.contains(event.relatedTarget) &&
      content.matches(":popover-open")
    ) {
      const id = content.getAttribute("data-tui-popovernative-id");
      const movingToTrigger = getTriggers(id).some((t) =>
        t.contains(event.relatedTarget),
      );
      handleHoverLeave(id, movingToTrigger);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document
      .querySelectorAll("[data-tui-popovernative-content]")
      .forEach((content) => {
        if (
          content.matches(":popover-open") &&
          content.getAttribute("data-tui-popovernative-disable-esc") !== "true"
        ) {
          const id = content.getAttribute("data-tui-popovernative-id");
          if (id) {
            closePopover(id);
          }
        }
      });
  });

  window.tui = window.tui || {};
  window.tui.popovernative = {
    open: openPopover,
    close: closePopover,
    closeAll,
    toggle: togglePopover,
    isOpen,
  };
})();
