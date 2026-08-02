// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  // Constants from Base UI's popover, shadcn's reference implementation.
  const EXIT_MS = 120; // exit animation (duration-100) + slack
  const COLLISION_PADDING = 5;

  function allContents() {
    return document.querySelectorAll("[data-tui-popover-content]");
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-tui-popover-trigger][aria-controls="' + content.id + '"]',
    );
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls"));
  }

  function popupFor(content) {
    return content.querySelector("[data-tui-popover-popup]");
  }

  function setState(content, state) {
    content.setAttribute("data-state", state);
    const popup = popupFor(content);
    if (popup) popup.setAttribute("data-state", state);
  }

  function setSide(content, side) {
    content.setAttribute("data-side", side);
    const popup = popupFor(content);
    if (popup) popup.setAttribute("data-side", side);
  }

  // Base UI zooms the popup out of the anchor's center point, not out of a
  // placement corner.
  function anchorOrigin(result, anchorRect, sideOffset) {
    const side = result.placement.split("-")[0];
    const centerX = anchorRect.left + anchorRect.width / 2 - result.x + "px";
    const centerY = anchorRect.top + anchorRect.height / 2 - result.y + "px";
    if (side === "bottom") return centerX + " " + -sideOffset + "px";
    if (side === "top") return centerX + " calc(100% + " + sideOffset + "px)";
    if (side === "right") return -sideOffset + "px " + centerY;
    return "calc(100% + " + sideOffset + "px) " + centerY;
  }

  // Moves the content to <body> (shadcn portals it the same way). Also removes
  // contents whose trigger is gone (leftovers from swapped-out pages).
  function portal(content) {
    document.querySelectorAll("body > [data-tui-popover-content]").forEach((c) => {
      if (c !== content && !triggerFor(c)) c.remove();
    });
    if (content.parentElement !== document.body) {
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
    const side = content.getAttribute("data-tui-popover-side") || "bottom";
    const align = content.getAttribute("data-tui-popover-align") || "center";
    const sideOffset = parseFloat(content.getAttribute("data-tui-popover-side-offset")) || 0;
    const alignOffset = parseFloat(content.getAttribute("data-tui-popover-align-offset")) || 0;
    const placement = align === "center" ? side : side + "-" + align;

    return computePosition(trigger, content, {
      placement: placement,
      strategy: "fixed",
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
          "--tui-popover-transform-origin",
          anchorOrigin(result, trigger.getBoundingClientRect(), sideOffset),
        );
      }
    });
  }

  function isOpen(content) {
    return content.getAttribute("data-state") === "open";
  }

  function open(content) {
    if (typeof content === "string") content = document.getElementById(content);
    if (!content || isOpen(content)) return;
    allContents().forEach((c) => {
      if (c !== content) close(c);
    });
    clearTimeout(content._tuiHide);
    portal(content);
    if (!content.matches(":popover-open")) {
      content.showPopover(); // native top layer
    }

    // Position it invisibly first, then play the enter animation in place.
    content.style.visibility = "hidden";
    const finish = () => {
      content.style.visibility = "";
      if (!content.matches(":popover-open")) return;
      setState(content, "open");
      const trigger = triggerFor(content);
      if (trigger) trigger.setAttribute("aria-expanded", "true");
      // Base UI moves focus into the popup when it opens.
      const popup = popupFor(content);
      if (popup && !content.contains(document.activeElement)) {
        popup.focus({ preventScroll: true });
      }
    };
    position(content).then(finish, finish);
  }

  // returnFocus false skips the focus restore, like Base UI on pointer
  // dismiss: focus follows the outside press instead of the trigger.
  function close(content, returnFocus) {
    if (typeof content === "string") content = document.getElementById(content);
    if (!content || !content.matches(":popover-open")) return;
    if (returnFocus !== false && content.contains(document.activeElement)) {
      const focusTrigger = triggerFor(content);
      if (focusTrigger) focusTrigger.focus({ preventScroll: true });
    }
    content.style.visibility = "";
    setState(content, "closed");
    const trigger = triggerFor(content);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    clearTimeout(content._tuiHide);
    content._tuiHide = setTimeout(() => {
      if (content.getAttribute("data-state") === "closed" && content.matches(":popover-open")) {
        content.hidePopover();
      }
    }, EXIT_MS);
  }

  function closeAll(returnFocus) {
    allContents().forEach((content) => close(content, returnFocus));
  }

  function closeNearest(element) {
    if (!element) return;
    const content =
      element.closest?.("[data-tui-popover-content]") ||
      (element.closest?.("[data-tui-popover-trigger]") &&
        contentFor(element.closest("[data-tui-popover-trigger]"))) ||
      element.querySelector?.("[data-tui-popover-content]");
    if (content) close(content);
  }

  function toggle(content) {
    if (typeof content === "string") content = document.getElementById(content);
    if (!content) return;
    if (isOpen(content)) {
      close(content);
    } else {
      open(content);
    }
  }

  // Pointer interactions toggle and dismiss on PRESS, exactly like Base UI.
  // Click is never used for open/close, so the stray click the browser fires
  // on body when the popup ends up under the released pointer is harmless.
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-popover-trigger]");
    if (trigger) {
      if (trigger.disabled) return;
      const content = contentFor(trigger);
      if (content) toggle(content);
      return;
    }
    if (!e.target.closest("[data-tui-popover-content]")) closeAll(false);
  });

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-popover-trigger]");
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
    if (e.key === "Escape") closeAll();
  });

  // Page scroll or resize: keep open popovers attached to their trigger.
  window.addEventListener(
    "scroll",
    (e) => {
      if (e.target instanceof Element && e.target.closest("[data-tui-popover-content]")) return;
      allContents().forEach((content) => {
        if (isOpen(content)) position(content);
      });
    },
    true,
  );

  window.addEventListener("resize", () => {
    allContents().forEach((content) => {
      if (isOpen(content)) position(content);
    });
  });

  // Portal all contents up front (React portals on mount too): popovers must
  // not sit inside layout groups where hidden siblings break :last-child
  // rules. Runs on load and whenever new popovers appear in the DOM.
  // Lift SSR'd contents out of their inert <template> wrappers into <body>,
  // replacing a stale portaled copy on re-swaps (e.g. htmx).
  function liftTemplates() {
    document.querySelectorAll("template[data-tui-popover-portal]").forEach((tpl) => {
      const content = tpl.content.querySelector("[data-tui-popover-content]");
      if (content) {
        const stale = document.getElementById(content.id);
        if (stale) stale.remove();
        document.body.appendChild(content);
      }
      tpl.remove();
    });
  }

  function portalAll() {
    liftTemplates();
    allContents().forEach((content) => {
      if (triggerFor(content)) portal(content);
    });
  }

  let portalQueued = false;
  function queuePortal() {
    if (portalQueued) return;
    portalQueued = true;
    requestAnimationFrame(() => {
      portalQueued = false;
      portalAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", portalAll);
  } else {
    portalAll();
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        queuePortal();
        break;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.tui = window.tui || {};
  window.tui.popover = {
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
