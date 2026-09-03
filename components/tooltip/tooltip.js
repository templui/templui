// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  const configs = new WeakMap();
  const elementStates = new WeakMap();
  // Exit animations run at the tw-animate default (150ms); hide after.
  const EXIT_MS = 170;

  function state(element) {
    if (!elementStates.has(element)) elementStates.set(element, {});
    return elementStates.get(element);
  }

  function allContents() {
    return document.querySelectorAll(`[data-slot="tooltip-content"]`);
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-describedby"));
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-slot="tooltip-trigger"][aria-describedby="' + content.id + '"]',
    );
  }

  // Base UI zooms the popup out of the anchor's center point (e.g.
  // "96px -4px"), not out of a placement corner.
  function anchorOrigin(result, anchorRect, positionerRect, sideOffset) {
    const side = result.placement.split("-")[0];
    const centerX = anchorRect.left + anchorRect.width / 2 - positionerRect.left + "px";
    const centerY = anchorRect.top + anchorRect.height / 2 - positionerRect.top + "px";
    if (side === "bottom") return centerX + " " + -sideOffset + "px";
    if (side === "top") return centerX + " calc(100% + " + sideOffset + "px)";
    if (side === "right") return -sideOffset + "px " + centerY;
    return "calc(100% + " + sideOffset + "px) " + centerY;
  }

  // The arrow styles itself per side (data-side classes, like Base UI's
  // Arrow); the script only feeds it the side and the centered coordinate.
  function placeArrow(content, side, arrowData) {
    const arrowEl = content.querySelector(`[data-slot="tooltip-arrow"]`);
    if (!arrowEl) return;
    arrowEl.setAttribute("data-side", side);
    arrowEl.style.left = arrowData && arrowData.x != null ? arrowData.x + "px" : "";
    arrowEl.style.top = arrowData && arrowData.y != null ? arrowData.y + "px" : "";
  }

  // Moves the content to <body> (shadcn portals it the same way).
  // The unmount half of the React portal pendant: a portaled content lives
  // as long as its SSR declaration site stays in the
  // document. Trigger-presence heuristics judged mid-swap moments wrongly -
  // multi-phase swap layers briefly disconnect the new triggers.
  function portal(content) {
    document.querySelectorAll('body > [data-slot="tooltip-content"]').forEach((c) => {
      if (c !== content && state(c).portalOwner && !state(c).portalOwner.isConnected) {
        stopAutoPositioning(c);
        c.remove();
      }
    });
    if (content.parentElement !== document.body) {
      if (!state(content).portalOwner) state(content).portalOwner = content.parentElement;
      document.body.appendChild(content);
    }
  }

  function positionContent(content, trigger) {
    const { computePosition, offset, flip, shift, arrow } = window.FloatingUIDOM;
    const componentConfig = configs.get(content) || {};
    const side = componentConfig.side || "top";
    const sideOffset = parseInt(componentConfig.sideOffset, 10) || 4;
    const arrowEl = content.querySelector(`[data-slot="tooltip-arrow"]`);

    return computePosition(trigger, content, {
      placement: side,
      strategy: "absolute",
      middleware: [
        offset(sideOffset),
        flip(),
        shift({ padding: 5 }),
        arrowEl ? arrow({ element: arrowEl, padding: 5 }) : undefined,
      ].filter(Boolean),
    }).then((result) => {
      content.style.transition = "none";
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      content.style.setProperty(
        "--transform-origin",
        anchorOrigin(
          result,
          trigger.getBoundingClientRect(),
          content.getBoundingClientRect(),
          sideOffset,
        ),
      );
      const finalSide = result.placement.split("-")[0];
      content.setAttribute("data-side", finalSide);
      placeArrow(content, finalSide, result.middlewareData.arrow);
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
    });
  }

  function startAutoPositioning(content, trigger) {
    if (state(content).positionCleanup) state(content).positionCleanup();
    let resolveFirst;
    const firstPosition = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const update = () => positionContent(content, trigger).then(resolveFirst, resolveFirst);
    state(content).positionCleanup = window.FloatingUIDOM.autoUpdate(trigger, content, update, {
      elementResize: typeof ResizeObserver !== "undefined",
      layoutShift: typeof IntersectionObserver !== "undefined",
    });
    return firstPosition;
  }

  function stopAutoPositioning(content) {
    if (!state(content).positionCleanup) return;
    state(content).positionCleanup();
    state(content).positionCleanup = null;
  }

  function open(trigger) {
    // Consumers can suppress a tooltip situationally (e.g. the sidebar only
    // shows menu tooltips while collapsed to icons).
    if (
      trigger.matches(":disabled") ||
      trigger.getAttribute("aria-disabled") === "true" ||
      trigger.hasAttribute("data-tooltip-disabled")
    ) return;
    const content = contentFor(trigger);
    if (!content) return;
    clearTimeout(state(content).hideTimer);
    portal(content);
    // z-index portal like shadcn (no native top layer); re-append
    // keeps paint order = open order.
    document.body.appendChild(content);
    content.hidden = false;

    // Position it invisibly first, then play the enter animation in place.
    content.style.visibility = "hidden";
    startAutoPositioning(content, trigger).then(() => {
      if (content.hidden) return; // closed meanwhile
      // duration-100 transitions `all`; a visibility transition would
      // freeze at hidden in background tabs - flip suppressed.
      content.style.transitionProperty = "none";
      content.style.visibility = "";
      void content.offsetWidth;
      content.style.transitionProperty = "";
      content.removeAttribute("data-closed");
      content.removeAttribute("data-ending-style");
      content.setAttribute("data-open", "");
      content.setAttribute("data-starting-style", "");
      const arrowEl = content.querySelector(`[data-slot="tooltip-arrow"]`);
      if (arrowEl) {
        arrowEl.removeAttribute("data-closed");
        arrowEl.removeAttribute("data-ending-style");
        arrowEl.setAttribute("data-open", "");
        arrowEl.setAttribute("data-starting-style", "");
      }
      trigger.setAttribute("data-popup-open", "");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          content.removeAttribute("data-starting-style");
          if (arrowEl) arrowEl.removeAttribute("data-starting-style");
        });
      });
    });
  }

  function close(content) {
    if (content.hidden) return;
    stopAutoPositioning(content);
    content.removeAttribute("data-open");
    content.removeAttribute("data-starting-style");
    content.setAttribute("data-closed", "");
    content.setAttribute("data-ending-style", "");
    const arrowEl = content.querySelector(`[data-slot="tooltip-arrow"]`);
    if (arrowEl) {
      arrowEl.removeAttribute("data-open");
      arrowEl.removeAttribute("data-starting-style");
      arrowEl.setAttribute("data-closed", "");
      arrowEl.setAttribute("data-ending-style", "");
    }
    const trigger = triggerFor(content);
    if (trigger) trigger.removeAttribute("data-popup-open");
    clearTimeout(state(content).hideTimer);
    state(content).hideTimer = setTimeout(() => {
      if (content.hasAttribute("data-closed") && !content.hidden) {
        content.hidden = true;
        content.removeAttribute("data-ending-style");
        if (arrowEl) arrowEl.removeAttribute("data-ending-style");
      }
    }, EXIT_MS);
  }

  function closeAll() {
    allContents().forEach(close);
  }

  function requestOpenChange(trigger, nextOpen) {
    if (!trigger) return;
    const content = contentFor(trigger);
    if (!content || content.hasAttribute("data-open") === nextOpen) return;
    const accepted = content.dispatchEvent(
      new CustomEvent("tooltip-open-change", {
        bubbles: true,
        cancelable: true,
        detail: { open: nextOpen },
      }),
    );
    if (!accepted) return;
    if (nextOpen) open(trigger);
    else close(content);
  }

  function requestCloseAll() {
    allContents().forEach((content) => requestOpenChange(triggerFor(content), false));
  }

  // ----- events -------------------------------------------------------------

  document.addEventListener("mouseover", (e) => {
    const trigger = e.target.closest(`[data-slot="tooltip-trigger"]`);
    if (trigger) requestOpenChange(trigger, true);
  });

  document.addEventListener("mouseout", (e) => {
    const trigger = e.target.closest(`[data-slot="tooltip-trigger"]`);
    if (!trigger) return;
    if (e.relatedTarget && trigger.contains(e.relatedTarget)) return; // still inside
    const content = contentFor(trigger);
    if (content) requestOpenChange(trigger, false);
  });

  // Keyboard: show on focus, hide on blur. Like Base UI, only visible
  // focus opens the tooltip, so programmatic focus (e.g. a dialog's
  // autofocus) does not pop it.
  document.addEventListener("focusin", (e) => {
    const trigger = e.target.closest(`[data-slot="tooltip-trigger"]`);
    if (trigger && trigger.matches(":focus-visible")) requestOpenChange(trigger, true);
  });

  document.addEventListener("focusout", (e) => {
    const trigger = e.target.closest(`[data-slot="tooltip-trigger"]`);
    if (!trigger) return;
    const content = contentFor(trigger);
    if (content) requestOpenChange(trigger, false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") requestCloseAll();
  });

  // Lift every content out of its inert <template> into <body>, shadcn's
  // portal renders it there from the start.
  function init() {
    document
      .querySelectorAll("template")
      .forEach((tpl) => {
        const content = tpl.content.querySelector(`[data-slot="tooltip-content"]`);
        if (!content) return;
        if (content) {
          const stale = document.getElementById(content.id);
          if (stale) {
            stopAutoPositioning(stale);
            stale.remove(); // replacement of an earlier source with the same id
          }
          state(content).portalOwner = tpl.parentElement;
          portal(content);
        }
        tpl.remove();
      });
    allContents().forEach((content) => {
      portal(content);
      if (content.hasAttribute("data-open")) {
        const trigger = triggerFor(content);
        if (trigger) open(trigger);
      }
    });
  }
  window.shadcnTempl.lifecycle.register("tooltip-content", {
    selector: '[data-slot="tooltip-content"]',
    setup(content) {
      configs.set(content, {
        side: content.getAttribute("data-side"),
        sideOffset: content.getAttribute("data-side-offset"),
      });
    },
    attributes: ["data-open"],
    attributeChanged(content) {
      const trigger = triggerFor(content);
      if (content.hasAttribute("data-open") && content.hidden && trigger) open(trigger);
      else if (!content.hasAttribute("data-open") && !content.hidden && !content.hasAttribute("data-closed")) close(content);
    },
  });
  window.shadcnTempl.lifecycle.register("tooltip", {
    mount: init,
    unmount: init,
  });

})();
