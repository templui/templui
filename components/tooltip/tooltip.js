// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  // Exit animations run at the tw-animate default (150ms); hide after.
  const EXIT_MS = 170;

  function allContents() {
    return document.querySelectorAll("[data-tui-tooltip-content]");
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-describedby"));
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-tui-tooltip-trigger][aria-describedby="' + content.id + '"]',
    );
  }

  // Base UI zooms the popup out of the anchor's center point (e.g.
  // "96px -4px"), not out of a placement corner.
  function anchorOrigin(result, anchorRect, sideOffset) {
    const side = result.placement.split("-")[0];
    const centerX = anchorRect.left + anchorRect.width / 2 - result.x + "px";
    const centerY = anchorRect.top + anchorRect.height / 2 - result.y + "px";
    if (side === "bottom") return centerX + " " + -sideOffset + "px";
    if (side === "top") return centerX + " calc(100% + " + sideOffset + "px)";
    if (side === "right") return -sideOffset + "px " + centerY;
    return "calc(100% + " + sideOffset + "px) " + centerY;
  }

  // The arrow styles itself per side (data-side classes, like Base UI's
  // Arrow); the script only feeds it the side and the centered coordinate.
  function placeArrow(content, side, arrowData) {
    const arrowEl = content.querySelector("[data-tui-tooltip-arrow]");
    if (!arrowEl) return;
    arrowEl.setAttribute("data-side", side);
    arrowEl.style.left = arrowData && arrowData.x != null ? arrowData.x + "px" : "";
    arrowEl.style.top = arrowData && arrowData.y != null ? arrowData.y + "px" : "";
  }

  // Moves the content to <body> (shadcn portals it the same way). Also removes
  // contents whose trigger is gone (leftovers from swapped-out pages).
  function portal(content) {
    document.querySelectorAll("body > [data-tui-tooltip-content]").forEach((c) => {
      if (c !== content && !triggerFor(c)) c.remove();
    });
    if (content.parentElement !== document.body) {
      document.body.appendChild(content);
    }
  }

  function positionContent(content, trigger) {
    const { computePosition, offset, flip, shift, arrow } = window.FloatingUIDOM;
    const side = content.getAttribute("data-tui-tooltip-side") || "top";
    const sideOffset =
      parseInt(content.getAttribute("data-tui-tooltip-side-offset"), 10) || 4;
    const arrowEl = content.querySelector("[data-tui-tooltip-arrow]");

    return computePosition(trigger, content, {
      placement: side,
      strategy: "fixed",
      middleware: [
        offset(sideOffset),
        flip(),
        shift({ padding: 8 }),
        arrowEl ? arrow({ element: arrowEl, padding: 6 }) : undefined,
      ].filter(Boolean),
    }).then((result) => {
      content.style.transition = "none";
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      content.style.setProperty(
        "--tui-tooltip-transform-origin",
        anchorOrigin(result, trigger.getBoundingClientRect(), sideOffset),
      );
      const finalSide = result.placement.split("-")[0];
      content.setAttribute("data-side", finalSide);
      placeArrow(content, finalSide, result.middlewareData.arrow);
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
    });
  }

  function open(trigger) {
    // Consumers can suppress a tooltip situationally (e.g. the sidebar only
    // shows menu tooltips while collapsed to icons).
    if (trigger.hasAttribute("data-tui-tooltip-disabled")) return;
    const content = contentFor(trigger);
    if (!content) return;
    clearTimeout(content._tuiHide);
    portal(content);
    if (!content.matches(":popover-open")) {
      content.showPopover(); // native top layer
    }

    // Position it invisibly first, then play the enter animation in place.
    content.style.visibility = "hidden";
    positionContent(content, trigger).then(() => {
      if (!content.matches(":popover-open")) return; // closed meanwhile
      content.style.visibility = "";
      content.setAttribute("data-state", "open");
    });
  }

  function close(content) {
    if (!content.matches(":popover-open")) return;
    content.setAttribute("data-state", "closed");
    clearTimeout(content._tuiHide);
    content._tuiHide = setTimeout(() => {
      if (content.getAttribute("data-state") === "closed" && content.matches(":popover-open")) {
        content.hidePopover();
      }
    }, EXIT_MS);
  }

  function closeAll() {
    allContents().forEach(close);
  }

  // ----- events -------------------------------------------------------------

  document.addEventListener("mouseover", (e) => {
    const trigger = e.target.closest("[data-tui-tooltip-trigger]");
    if (trigger) open(trigger);
  });

  document.addEventListener("mouseout", (e) => {
    const trigger = e.target.closest("[data-tui-tooltip-trigger]");
    if (!trigger) return;
    if (e.relatedTarget && trigger.contains(e.relatedTarget)) return; // still inside
    const content = contentFor(trigger);
    if (content) close(content);
  });

  // Keyboard: show on focus, hide on blur. Like Base UI, only visible
  // focus opens the tooltip, so programmatic focus (e.g. a dialog's
  // autofocus) does not pop it.
  document.addEventListener("focusin", (e) => {
    const trigger = e.target.closest("[data-tui-tooltip-trigger]");
    if (trigger && trigger.matches(":focus-visible")) open(trigger);
  });

  document.addEventListener("focusout", (e) => {
    const trigger = e.target.closest("[data-tui-tooltip-trigger]");
    if (!trigger) return;
    const content = contentFor(trigger);
    if (content) close(content);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  // Lift every content out of its inert <template> into <body>, shadcn's
  // portal renders it there from the start.
  function portalAll() {
    document
      .querySelectorAll("template[data-tui-tooltip-portal]")
      .forEach((tpl) => {
        const content = tpl.content.querySelector("[data-tui-tooltip-content]");
        if (content) {
          const stale = document.getElementById(content.id);
          if (stale) stale.remove(); // htmx re-swap of the same id
          portal(content);
        }
        tpl.remove();
      });
    allContents().forEach(portal);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", portalAll);
  } else {
    portalAll();
  }
  new MutationObserver(portalAll).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Keep open tooltips anchored while scrolling or resizing.
  function repositionOpen() {
    allContents().forEach((content) => {
      if (content.getAttribute("data-state") !== "open") return;
      const trigger = triggerFor(content);
      if (trigger) positionContent(content, trigger);
    });
  }
  window.addEventListener("scroll", repositionOpen, true);
  window.addEventListener("resize", repositionOpen);
})();
