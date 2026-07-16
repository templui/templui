import "../floatingui/floating_ui_core.js";
import "../floatingui/floating_ui_dom.js";

(function () {
  // Exit animations run at the tw-animate default (150ms); hide after.
  const EXIT_MS = 170;
  // Radix offsets by the arrow height: the arrow SVG is 10x5, so 5px —
  // the tip ends up touching the trigger, like shadcn.
  const ARROW_GAP = 5;

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

  // "top" -> "bottom center": the corner the tooltip grows out of.
  function transformOrigin(placement) {
    const side = placement.split("-")[0];
    const align = placement.split("-")[1] || "center";
    const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];
    if (side === "top" || side === "bottom") {
      return opposite + " " + ({ start: "left", end: "right", center: "center" }[align]);
    }
    return ({ start: "top", end: "bottom", center: "center" }[align]) + " " + opposite;
  }

  // Places the arrow wrapper exactly like Radix popper does: pinned to the
  // edge facing the trigger, then rotated/translated out of the content box.
  // (Copied from @radix-ui/react-popper PopperArrow.)
  function placeArrow(content, side, arrowData) {
    const arrowEl = content.querySelector("[data-tui-tooltip-arrow]");
    if (!arrowEl) return;
    const baseSide = { top: "bottom", right: "left", bottom: "top", left: "right" }[side];
    arrowEl.style.left = arrowData && arrowData.x != null ? arrowData.x + "px" : "";
    arrowEl.style.top = arrowData && arrowData.y != null ? arrowData.y + "px" : "";
    arrowEl.style.right = "";
    arrowEl.style.bottom = "";
    arrowEl.style[baseSide] = "0";
    arrowEl.style.transformOrigin = {
      top: "",
      right: "0 0",
      bottom: "center 0",
      left: "100% 0",
    }[side];
    arrowEl.style.transform = {
      top: "translateY(100%)",
      right: "translateY(50%) rotate(90deg) translateX(-50%)",
      bottom: "rotate(180deg)",
      left: "translateY(50%) rotate(-90deg) translateX(50%)",
    }[side];
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
      parseInt(content.getAttribute("data-tui-tooltip-side-offset"), 10) || 0;
    const arrowEl = content.querySelector("[data-tui-tooltip-arrow]");

    return computePosition(trigger, content, {
      placement: side,
      strategy: "fixed",
      middleware: [
        offset(sideOffset + ARROW_GAP),
        flip(),
        shift({ padding: 8 }),
        arrowEl ? arrow({ element: arrowEl, padding: 6 }) : undefined,
      ].filter(Boolean),
    }).then((result) => {
      content.style.transition = "none";
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      content.style.transformOrigin = transformOrigin(result.placement);
      const finalSide = result.placement.split("-")[0];
      content.setAttribute("data-side", finalSide);
      placeArrow(content, finalSide, result.middlewareData.arrow);
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
    });
  }

  function open(trigger) {
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

  // Keyboard: show on focus, hide on blur.
  document.addEventListener("focusin", (e) => {
    const trigger = e.target.closest("[data-tui-tooltip-trigger]");
    if (trigger) open(trigger);
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
