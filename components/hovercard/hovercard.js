import "../floatingui/floating_ui_core.js";
import "../floatingui/floating_ui_dom.js";

(function () {
  // Exit animations run for 100ms (duration-100); hide shortly after.
  const EXIT_MS = 120;

  function allContents() {
    return document.querySelectorAll("[data-tui-hovercard-content]");
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("data-tui-hovercard-for"));
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-tui-hovercard-trigger][data-tui-hovercard-for="' + content.id + '"]',
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

  // Moves the content to <body> (shadcn portals it the same way). Also removes
  // contents whose trigger is gone (leftovers from swapped-out pages).
  function portal(content) {
    document.querySelectorAll("body > [data-tui-hovercard-content]").forEach((c) => {
      if (c !== content && !triggerFor(c)) c.remove();
    });
    if (content.parentElement !== document.body) {
      document.body.appendChild(content);
    }
  }

  function positionContent(content, trigger) {
    const { computePosition, offset, flip, shift } = window.FloatingUIDOM;
    const side = content.getAttribute("data-tui-hovercard-side") || "bottom";
    const align = content.getAttribute("data-tui-hovercard-align") || "center";
    const sideOffset =
      parseInt(content.getAttribute("data-tui-hovercard-side-offset"), 10) || 4;
    const alignOffset =
      parseInt(content.getAttribute("data-tui-hovercard-align-offset"), 10) || 0;
    const placement = align === "center" ? side : side + "-" + align;

    return computePosition(trigger, content, {
      placement: placement,
      strategy: "fixed",
      middleware: [
        offset({ mainAxis: sideOffset, alignmentAxis: alignOffset }),
        flip(),
        shift({ padding: 8 }),
      ],
    }).then((result) => {
      content.style.transition = "none";
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      content.style.setProperty(
        "--tui-hovercard-transform-origin",
        anchorOrigin(result, trigger.getBoundingClientRect(), sideOffset),
      );
      content.setAttribute("data-side", result.placement.split("-")[0]);
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
    });
  }

  function open(content, trigger) {
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

  // Hover intent: entering trigger or card keeps it open; leaving both
  // schedules the close after the card's close delay.
  function scheduleOpen(content, trigger) {
    clearTimeout(content._tuiClose);
    content._tuiClose = null;
    if (content.getAttribute("data-state") === "open" || content._tuiOpen) return;
    const delay = parseInt(content.getAttribute("data-tui-hovercard-open-delay"), 10) || 700;
    content._tuiOpen = setTimeout(() => {
      content._tuiOpen = null;
      open(content, trigger);
    }, delay);
  }

  function scheduleClose(content) {
    clearTimeout(content._tuiOpen);
    content._tuiOpen = null;
    if (content.getAttribute("data-state") !== "open" || content._tuiClose) return;
    const delay = parseInt(content.getAttribute("data-tui-hovercard-close-delay"), 10) || 300;
    content._tuiClose = setTimeout(() => {
      content._tuiClose = null;
      close(content);
    }, delay);
  }

  document.addEventListener("mouseover", (e) => {
    const trigger = e.target.closest("[data-tui-hovercard-trigger]");
    if (trigger) {
      const content = contentFor(trigger);
      if (content) scheduleOpen(content, trigger);
      return;
    }
    const content = e.target.closest("[data-tui-hovercard-content]");
    if (content) {
      clearTimeout(content._tuiClose);
      content._tuiClose = null;
    }
  });

  document.addEventListener("mouseout", (e) => {
    const from = e.target.closest("[data-tui-hovercard-trigger], [data-tui-hovercard-content]");
    if (!from) return;
    if (e.relatedTarget) {
      const to = e.relatedTarget.closest("[data-tui-hovercard-trigger], [data-tui-hovercard-content]");
      if (to) return; // moving between trigger and card
    }
    const content = from.hasAttribute("data-tui-hovercard-content")
      ? from
      : contentFor(from);
    if (content) scheduleClose(content);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") allContents().forEach(close);
  });

  // Lift SSR'd contents out of their inert <template> wrappers into <body>,
  // replacing a stale portaled copy on re-swaps (e.g. htmx).
  function liftTemplates() {
    document.querySelectorAll("template[data-tui-hovercard-portal]").forEach((tpl) => {
      const content = tpl.content.querySelector("[data-tui-hovercard-content]");
      if (content) {
        const stale = document.getElementById(content.id);
        if (stale) stale.remove();
        document.body.appendChild(content);
      }
      tpl.remove();
    });
  }

  // Portal all contents up front (React portals on mount too). Runs on load
  // and whenever new cards appear in the DOM.
  function initCards() {
    liftTemplates();
    allContents().forEach((content) => {
      if (triggerFor(content)) portal(content);
    });
  }

  let initQueued = false;
  function queueInit() {
    if (initQueued) return;
    initQueued = true;
    requestAnimationFrame(() => {
      initQueued = false;
      initCards();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCards);
  } else {
    initCards();
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        queueInit();
        break;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Keep open cards anchored while scrolling or resizing.
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
