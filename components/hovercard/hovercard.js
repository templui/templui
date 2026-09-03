// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  const configs = new WeakMap();
  const elementStates = new WeakMap();
  // Exit animations run for 100ms (duration-100); hide shortly after.
  const EXIT_MS = 120;

  function state(element) {
    if (!elementStates.has(element)) elementStates.set(element, {});
    return elementStates.get(element);
  }

  function allContents() {
    return document.querySelectorAll(`[data-slot="hover-card-content"]`);
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls"));
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-slot="hover-card-trigger"][aria-controls="' + content.id + '"]',
    );
  }

  function setOpenState(content, open) {
    content.toggleAttribute("data-open", open);
    content.toggleAttribute("data-closed", !open);
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

  // Moves the content to <body> (shadcn portals it the same way).
  // The unmount half of the React portal pendant: a portaled content lives
  // as long as its SSR declaration site stays in the
  // document. Trigger-presence heuristics judged mid-swap moments wrongly -
  // multi-phase swap layers briefly disconnect the new triggers.
  function portal(content) {
    document.querySelectorAll('body > [data-slot="hover-card-content"]').forEach((c) => {
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
    const { computePosition, offset, flip, shift } = window.FloatingUIDOM;
    const componentConfig = configs.get(content) || {};
    const side = componentConfig.side || "bottom";
    const align = componentConfig.align || "center";
    const sideOffset = parseInt(componentConfig.sideOffset, 10) || 4;
    const alignOffset = parseInt(componentConfig.alignOffset, 10) || 0;
    const placement = align === "center" ? side : side + "-" + align;

    return computePosition(trigger, content, {
      placement: placement,
      strategy: "absolute",
      middleware: [
        offset({ mainAxis: sideOffset, alignmentAxis: alignOffset }),
        flip(),
        shift({ padding: 5 }),
      ],
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
      content.setAttribute("data-side", result.placement.split("-")[0]);
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

  function open(content, trigger) {
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
      setOpenState(content, true);
    });
  }

  function close(content) {
    if (content.hidden) return;
    stopAutoPositioning(content);
    setOpenState(content, false);
    clearTimeout(state(content).hideTimer);
    state(content).hideTimer = setTimeout(() => {
      if (content.hasAttribute("data-closed") && !content.hidden) {
        content.hidden = true;
      }
    }, EXIT_MS);
  }

  function requestOpenChange(content, nextOpen) {
  const trigger = triggerFor(content);
  const change = new CustomEvent("hovercard-open-change", {
    bubbles: true,
    cancelable: true,
    detail: { open: nextOpen },
  });
  const accepted = (trigger || content).dispatchEvent(change);
  if (!accepted) return false;
  if (nextOpen && trigger) open(content, trigger);
  else if (!nextOpen) close(content);
  return true;
  }

  // Hover intent: entering trigger or card keeps it open; leaving both
  // schedules the close after the card's close delay.
  function scheduleOpen(content, trigger) {
    clearTimeout(state(content).closeTimer);
    state(content).closeTimer = null;
    if (content.hasAttribute("data-open") || state(content).openTimer) return;
    const delay = parseInt(configs.get(content)?.delay, 10) || 600;
    state(content).openTimer = setTimeout(() => {
      state(content).openTimer = null;
    requestOpenChange(content, true);
    }, delay);
  }

  function scheduleClose(content) {
    clearTimeout(state(content).openTimer);
    state(content).openTimer = null;
    if (!content.hasAttribute("data-open") || state(content).closeTimer) return;
    const delay = parseInt(configs.get(content)?.closeDelay, 10) || 300;
    state(content).closeTimer = setTimeout(() => {
      state(content).closeTimer = null;
    requestOpenChange(content, false);
    }, delay);
  }

  document.addEventListener("mouseover", (e) => {
    const trigger = e.target.closest(`[data-slot="hover-card-trigger"]`);
    if (trigger) {
      const content = contentFor(trigger);
      if (content) scheduleOpen(content, trigger);
      return;
    }
    const content = e.target.closest(`[data-slot="hover-card-content"]`);
    if (content) {
      clearTimeout(state(content).closeTimer);
      state(content).closeTimer = null;
    }
  });

  document.addEventListener("mouseout", (e) => {
    const from = e.target.closest('[data-slot="hover-card-trigger"], [data-slot="hover-card-content"]');
    if (!from) return;
    const content = from.matches('[data-slot="hover-card-content"]')
      ? from
      : contentFor(from);
    if (!content) return;
    if (e.relatedTarget) {
      const to = e.relatedTarget.closest('[data-slot="hover-card-trigger"], [data-slot="hover-card-content"]');
      // Only moving between THIS card's trigger and popup keeps it open;
      // landing on another instance must still close this one.
      if (to) {
        const toContent = to.matches('[data-slot="hover-card-content"]')
          ? to
          : contentFor(to);
        if (toContent === content) return;
      }
    }
    scheduleClose(content);
  });

  document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    allContents().forEach((content) => requestOpenChange(content, false));
  }
  });

  // Lift SSR'd contents out of their inert <template> wrappers into <body>,
  // replacing a stale portaled copy after ordinary DOM replacement.
  function liftTemplates() {
    document.querySelectorAll("template").forEach((tpl) => {
      const content = tpl.content.querySelector(`[data-slot="hover-card-content"]`);
      if (!content) return;
      if (content) {
        const stale = document.getElementById(content.id);
        if (stale) {
          stopAutoPositioning(stale);
          stale.remove();
        }
        state(content).portalOwner = tpl.parentElement;
        document.body.appendChild(content);
      }
      tpl.remove();
    });
  }

  // Portal all contents up front (React portals on mount too). Runs on load
  // and whenever new cards appear in the DOM.
  function init() {
    liftTemplates();
    allContents().forEach((content) => {
      if (triggerFor(content)) portal(content);
    if (content.hasAttribute("data-open")) {
    const trigger = triggerFor(content);
    if (trigger) open(content, trigger);
    }
    });
  }

  window.shadcnTempl.lifecycle.register("hover-card-content", {
    selector: '[data-slot="hover-card-content"]',
    setup(content) {
      configs.set(content, {
        side: content.getAttribute("data-side"),
        align: content.getAttribute("data-align"),
        sideOffset: content.getAttribute("data-side-offset"),
        alignOffset: content.getAttribute("data-align-offset"),
        delay: content.getAttribute("data-open-delay"),
        closeDelay: content.getAttribute("data-close-delay"),
      });
    },
    attributes: ["data-open"],
    attributeChanged(content) {
      const trigger = triggerFor(content);
      if (content.hasAttribute("data-open") && content.hidden && trigger) open(content, trigger);
      else if (!content.hasAttribute("data-open") && !content.hidden && !content.hasAttribute("data-closed")) close(content);
    },
  });
  window.shadcnTempl.lifecycle.register("hover-card", {
    mount: init,
    unmount: init,
  });

})();
