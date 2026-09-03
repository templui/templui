// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  const configs = new WeakMap();
  const elementStates = new WeakMap();
  // Constants from Base UI's popover, shadcn's reference implementation.
  const EXIT_MS = 120; // exit animation (duration-100) + slack
  const COLLISION_PADDING = 5;

  function state(element) {
    if (!elementStates.has(element)) elementStates.set(element, {});
    return elementStates.get(element);
  }

  function allContents() {
    return document.querySelectorAll(`[data-slot="popover-positioner"]`);
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-slot="popover-trigger"][aria-controls="' + content.id + '"]',
    );
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls"));
  }

  function popupFor(content) {
    return content.querySelector(`[data-slot="popover-content"]`);
  }

  function setState(content, state) {
    const open = state === "open";
    content.toggleAttribute("data-open", open);
    content.toggleAttribute("data-closed", !open);
    const popup = popupFor(content);
    if (popup) {
      popup.toggleAttribute("data-open", open);
      popup.toggleAttribute("data-closed", !open);
    }
  }

  function setTransitionAttribute(content, name, present) {
    content.toggleAttribute(name, present);
    const popup = popupFor(content);
    if (popup) popup.toggleAttribute(name, present);
  }

  function startTransition(content) {
    setTransitionAttribute(content, "data-ending-style", false);
    setTransitionAttribute(content, "data-starting-style", true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionAttribute(content, "data-starting-style", false));
    });
  }

  function setSide(content, side) {
    content.setAttribute("data-side", side);
    const popup = popupFor(content);
    if (popup) popup.setAttribute("data-side", side);
  }

  // Base UI zooms the popup out of the anchor's center point, not out of a
  // placement corner.
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
    document.querySelectorAll('body > [data-slot="popover-positioner"]').forEach((c) => {
      if (c !== content && state(c).portalOwner && !state(c).portalOwner.isConnected) {
        stopAutoPositioning(c);
        c.remove();
      }
    });
    if (content.parentElement !== document.body) {
      if (!state(content).portalOwner) state(content).portalOwner = content.parentElement;
      document.body.appendChild(content);
    }
    wireAria(content);
  }

  // Base UI links Title/Description to the popup via aria-labelledby and
  // aria-describedby with generated ids.
  function wireAria(content) {
    const popup = popupFor(content);
    if (!popup) return;
    const title = popup.querySelector("[data-slot=popover-title]");
    if (title) {
      if (!title.id) title.id = content.id + "-title";
      popup.setAttribute("aria-labelledby", title.id);
    }
    const description = popup.querySelector("[data-slot=popover-description]");
    if (description) {
      if (!description.id) description.id = content.id + "-description";
      popup.setAttribute("aria-describedby", description.id);
    }
  }

  function position(content) {
    const trigger = triggerFor(content);
    if (!trigger) return Promise.resolve();
    const { computePosition, offset, flip, shift } = window.FloatingUIDOM;
    const componentConfig = configs.get(content) || {};
    const side = componentConfig.side || "bottom";
    const align = componentConfig.align || "center";
    const sideOffset = parseFloat(componentConfig.sideOffset) || 0;
    const alignOffset = parseFloat(componentConfig.alignOffset) || 0;
    const placement = align === "center" ? side : side + "-" + align;

    return computePosition(trigger, content, {
      placement: placement,
      strategy: "absolute",
      middleware: [
        offset({ mainAxis: sideOffset, crossAxis: alignOffset }),
        flip({ padding: COLLISION_PADDING }),
        shift({ padding: COLLISION_PADDING }),
      ],
    }).then((result) => {
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      setSide(content, result.placement.split("-")[0]);
      const popup = popupFor(content);
      if (popup) {
        popup.style.setProperty(
          "--transform-origin",
          anchorOrigin(
            result,
            trigger.getBoundingClientRect(),
            content.getBoundingClientRect(),
            sideOffset,
          ),
        );
      }
    });
  }

  function startAutoPositioning(content) {
    const trigger = triggerFor(content);
    if (!trigger) return Promise.resolve();
    if (state(content).positionCleanup) state(content).positionCleanup();
    let resolveFirst;
    const firstPosition = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const update = () => position(content).then(resolveFirst, resolveFirst);
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

  function isOpen(content) {
    return content.hasAttribute("data-open");
  }

  function requestOpenChange(content, nextOpen, returnFocus) {
    if (!content || isOpen(content) === nextOpen) return;
    const accepted = content.dispatchEvent(
      new CustomEvent("popover-open-change", {
        bubbles: true,
        cancelable: true,
        detail: { open: nextOpen },
      }),
    );
    if (!accepted) return;
    if (nextOpen) open(content);
    else close(content, returnFocus);
  }

  function open(content) {
    if (typeof content === "string") content = document.getElementById(content);
    if (!content || (!content.hidden && isOpen(content))) return;
    allContents().forEach((c) => {
      if (c !== content) close(c);
    });
    clearTimeout(state(content).hideTimer);
    portal(content);
    // z-index portal like shadcn (no native top layer); re-append
    // keeps paint order = open order.
    document.body.appendChild(content);
    content.hidden = false;

    // Position it invisibly first, then play the enter animation in place.
    content.style.visibility = "hidden";
    const finish = () => {
      // duration-100 transitions `all`; a visibility transition would
      // freeze at hidden in background tabs - flip suppressed.
      content.style.transitionProperty = "none";
      content.style.visibility = "";
      void content.offsetWidth;
      content.style.transitionProperty = "";
      if (content.hidden) return;
      setState(content, "open");
      startTransition(content);
      const trigger = triggerFor(content);
      if (trigger) {
        trigger.setAttribute("aria-expanded", "true");
        trigger.setAttribute("data-popup-open", "");
        trigger.setAttribute("data-pressed", "");
      }
      // Base UI moves focus into the popup when it opens.
      const popup = popupFor(content);
      if (popup && !content.contains(document.activeElement)) {
        popup.focus({ preventScroll: true });
      }
    };
    startAutoPositioning(content).then(finish, finish);
  }

  // returnFocus false skips the focus restore, like Base UI on pointer
  // dismiss: focus follows the outside press instead of the trigger.
  function close(content, returnFocus) {
    if (typeof content === "string") content = document.getElementById(content);
    if (!content || content.hidden) return;
    stopAutoPositioning(content);
    if (returnFocus !== false && content.contains(document.activeElement)) {
      const focusTrigger = triggerFor(content);
      if (focusTrigger) focusTrigger.focus({ preventScroll: true });
    }
    content.style.visibility = "";
    setTransitionAttribute(content, "data-starting-style", false);
    setState(content, "closed");
    setTransitionAttribute(content, "data-ending-style", true);
    const trigger = triggerFor(content);
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
      trigger.removeAttribute("data-pressed");
    }
    clearTimeout(state(content).hideTimer);
    state(content).hideTimer = setTimeout(() => {
      if (content.hasAttribute("data-closed") && !content.hidden) {
        content.hidden = true;
        setTransitionAttribute(content, "data-ending-style", false);
      }
    }, EXIT_MS);
  }

  function closeAll(returnFocus) {
    allContents().forEach((content) => close(content, returnFocus));
  }

  function requestCloseAll(returnFocus) {
    allContents().forEach((content) => requestOpenChange(content, false, returnFocus));
  }

  function closeNearest(element) {
    if (!element) return;
    const content =
      element.closest?.(`[data-slot="popover-positioner"]`) ||
      (element.closest?.(`[data-slot="popover-trigger"]`) &&
        contentFor(element.closest(`[data-slot="popover-trigger"]`))) ||
      element.querySelector?.(`[data-slot="popover-positioner"]`);
    if (content) requestOpenChange(content, false);
  }

  function toggle(content) {
    if (typeof content === "string") content = document.getElementById(content);
    if (!content) return;
    requestOpenChange(content, !isOpen(content));
  }

  // Pointer interactions toggle and dismiss on PRESS, exactly like Base UI.
  // Click is never used for open/close, so the stray click the browser fires
  // on body when the popup ends up under the released pointer is harmless.
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !(e.target instanceof Element)) return;
    const trigger = e.target.closest(`[data-slot="popover-trigger"]`);
    if (trigger) {
      if (trigger.disabled) return;
      const content = contentFor(trigger);
      if (content) toggle(content);
      return;
    }
    if (!e.target.closest(`[data-slot="popover-positioner"]`)) requestCloseAll(false);
  });

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest(`[data-slot="popover-trigger"]`);
    if (trigger) {
      // Keyboard activation only (Enter/Space fire a detail-0 click without
      // a preceding pointerdown); pointer presses are handled on pointerdown.
      if (e.detail === 0 && !trigger.disabled) {
        const content = contentFor(trigger);
        if (content) toggle(content);
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") requestCloseAll();
  });


  // Portal all contents up front (React portals on mount too): popovers must
  // not sit inside layout groups where hidden siblings break :last-child
  // rules. Runs on load and whenever new popovers appear in the DOM.
  // Lift SSR'd contents out of their inert <template> wrappers into <body>,
  // replacing a stale portaled copy after ordinary DOM replacement.
  function liftTemplates() {
    document.querySelectorAll("template").forEach((tpl) => {
      const content = tpl.content.querySelector(`[data-slot="popover-positioner"]`);
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

  function init() {
    liftTemplates();
    allContents().forEach((content) => {
      if (!triggerFor(content)) return;
      portal(content);
      if (content.hasAttribute("data-open")) open(content);
    });
  }

  window.shadcnTempl.lifecycle.register("popover-positioner", {
    selector: '[data-slot="popover-positioner"]',
    setup(content) {
      configs.set(content, {
        side: content.getAttribute("data-side"),
        align: content.getAttribute("data-align"),
        sideOffset: content.getAttribute("data-side-offset"),
        alignOffset: content.getAttribute("data-align-offset"),
      });
    },
    attributes: ["data-open"],
    attributeChanged(content) {
      if (content.hasAttribute("data-open")) open(content);
      else if (!content.hidden && !content.hasAttribute("data-closed")) close(content, false);
    },
  });
  window.shadcnTempl.lifecycle.register("popover", {
    mount: init,
    unmount: init,
  });

  window.shadcnTempl.popover = {
    open,
    close,
    closeAll,
    closeNearest,
    toggle,
    isOpen: (c) => {
      if (typeof c === "string") c = document.getElementById(c);
      return !!c && isOpen(c);
    },
  };
})();
