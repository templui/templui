import "../floatingui/floating_ui_core.js";
import "../floatingui/floating_ui_dom.js";

(function () {
  // Exit animations run for 100ms (duration-100); hide shortly after.
  const EXIT_MS = 120;
  // Submenu hover intent, like Radix: open fast, close with a grace delay so
  // moving the mouse diagonally into the submenu does not flicker.
  const SUB_OPEN_DELAY = 100;
  const SUB_CLOSE_DELAY = 300;

  function allContents() {
    return document.querySelectorAll("[data-tui-dropdownmenu-content]");
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-tui-dropdownmenu-trigger][aria-controls="' + content.id + '"]',
    );
  }

  // "bottom-start" -> "top left": the corner the menu grows out of.
  function transformOrigin(placement) {
    const side = placement.split("-")[0];
    const align = placement.split("-")[1] || "center";
    const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];
    if (side === "top" || side === "bottom") {
      return opposite + " " + ({ start: "left", end: "right", center: "center" }[align]);
    }
    return ({ start: "top", end: "bottom", center: "center" }[align]) + " " + opposite;
  }

  function applyPosition(content, result) {
    content.style.left = result.x + "px";
    content.style.top = result.y + "px";
    content.style.transformOrigin = transformOrigin(result.placement);
    content.setAttribute("data-side", result.placement.split("-")[0]);
  }

  // Position `content` next to `anchor` with floating-ui (flip + shift keep it
  // inside the viewport), instantly (transition suspended so left/top apply
  // without sliding over from the previous position).
  function placeNow(anchor, content, placement, middleware) {
    return window.FloatingUIDOM.computePosition(anchor, content, {
      placement: placement,
      strategy: "fixed",
      middleware: middleware,
    }).then((result) => {
      content.style.transition = "none";
      applyPosition(content, result);
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
    });
  }

  // ----- root menu ----------------------------------------------------------

  function menuMiddleware(content) {
    const { offset, flip, shift, size } = window.FloatingUIDOM;
    const sideOffset =
      parseInt(content.getAttribute("data-tui-dropdownmenu-side-offset"), 10) || 4;
    return [
      offset(sideOffset),
      flip(),
      shift({ padding: 8 }),
      // Exposes the trigger width and remaining viewport height as CSS vars,
      // like Radix does (used for max-height scrolling).
      size({
        apply(args) {
          content.style.setProperty(
            "--tui-dropdownmenu-available-height",
            args.availableHeight + "px",
          );
          content.style.setProperty(
            "--tui-dropdownmenu-trigger-width",
            args.rects.reference.width + "px",
          );
        },
      }),
    ];
  }

  function menuPlacement(content) {
    const side = content.getAttribute("data-tui-dropdownmenu-side") || "bottom";
    const align = content.getAttribute("data-tui-dropdownmenu-align") || "start";
    return align === "center" ? side : side + "-" + align;
  }

  function positionMenu(content, trigger) {
    return placeNow(trigger, content, menuPlacement(content), menuMiddleware(content));
  }

  // Moves the content to <body> (shadcn portals it the same way), so wrapper
  // layouts like ButtonGroup never see it as a sibling. Also removes contents
  // whose trigger is gone (leftovers from swapped-out pages).
  function portal(content) {
    document.querySelectorAll("body > [data-tui-dropdownmenu-content]").forEach((c) => {
      if (c !== content && !triggerFor(c)) c.remove();
    });
    if (content.parentElement !== document.body) {
      document.body.appendChild(content);
    }
  }

  function open(content, trigger) {
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
    positionMenu(content, trigger).then(() => {
      if (!content.matches(":popover-open")) return; // closed meanwhile
      content.style.visibility = "";
      content.setAttribute("data-state", "open");
      trigger.setAttribute("aria-expanded", "true");
    });
  }

  function close(content) {
    if (!content.matches(":popover-open")) return;
    content.setAttribute("data-state", "closed");
    content.querySelectorAll("[data-tui-dropdownmenu-sub]").forEach(closeSubNow);
    const trigger = triggerFor(content);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
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

  // ----- submenus -----------------------------------------------------------

  function subParts(sub) {
    return {
      trigger: sub.querySelector("[data-tui-dropdownmenu-sub-trigger]"),
      content: sub.querySelector("[data-tui-dropdownmenu-sub-content]"),
    };
  }

  function openSub(sub) {
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    content.classList.remove("hidden");
    content.style.visibility = "hidden";

    const { offset, flip, shift } = window.FloatingUIDOM;
    // mainAxis -1 overlaps the menu edges; alignmentAxis -4 lines the first
    // submenu item up with the trigger (the menu padding is 4px).
    placeNow(trigger, content, "right-start", [
      offset({ mainAxis: -1, alignmentAxis: -4 }),
      flip(),
      shift({ padding: 8 }),
    ]).then(() => {
      if (content.classList.contains("hidden")) return; // closed meanwhile
      content.style.visibility = "";
      content.setAttribute("data-state", "open");
      trigger.setAttribute("data-state", "open");
    });
  }

  // Closes with the exit animation.
  function closeSub(sub) {
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    content.setAttribute("data-state", "closed");
    trigger.setAttribute("data-state", "closed");
    setTimeout(() => {
      if (content.getAttribute("data-state") === "closed") {
        content.classList.add("hidden");
      }
    }, EXIT_MS);
  }

  // Closes immediately (used when the whole menu goes away).
  function closeSubNow(sub) {
    clearTimeout(sub._tuiOpen);
    clearTimeout(sub._tuiClose);
    sub._tuiOpen = null;
    sub._tuiClose = null;
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    content.classList.add("hidden");
    content.setAttribute("data-state", "closed");
    trigger.setAttribute("data-state", "closed");
  }

  // Hover intent: while the pointer is over a sub (trigger or its content),
  // keep it open; everything else in the menu schedules its subs to close.
  document.addEventListener("mouseover", (e) => {
    const menu = e.target.closest("[data-tui-dropdownmenu-content]");
    if (!menu) return;
    const hovered = e.target.closest("[data-tui-dropdownmenu-sub]");

    menu.querySelectorAll("[data-tui-dropdownmenu-sub]").forEach((sub) => {
      const { content } = subParts(sub);
      if (!content) return;
      const isOpen = content.getAttribute("data-state") === "open";
      const onPath = hovered && (sub === hovered || sub.contains(hovered));

      if (onPath) {
        clearTimeout(sub._tuiClose);
        sub._tuiClose = null;
        if (!isOpen && !sub._tuiOpen) {
          sub._tuiOpen = setTimeout(() => {
            sub._tuiOpen = null;
            openSub(sub);
          }, SUB_OPEN_DELAY);
        }
      } else {
        clearTimeout(sub._tuiOpen);
        sub._tuiOpen = null;
        if (isOpen && !sub._tuiClose) {
          sub._tuiClose = setTimeout(() => {
            sub._tuiClose = null;
            closeSub(sub);
          }, SUB_CLOSE_DELAY);
        }
      }
    });
  });

  // ----- events -------------------------------------------------------------

  document.addEventListener("click", (e) => {
    // Trigger toggles its menu.
    const trigger = e.target.closest("[data-tui-dropdownmenu-trigger]");
    if (trigger) {
      const content = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!content) return;
      if (content.getAttribute("data-state") === "open") {
        close(content);
      } else {
        open(content, trigger);
      }
      return;
    }

    // Clicking a submenu trigger opens it right away.
    const subTrigger = e.target.closest("[data-tui-dropdownmenu-sub-trigger]");
    if (subTrigger) {
      const sub = subTrigger.closest("[data-tui-dropdownmenu-sub]");
      if (sub) {
        clearTimeout(sub._tuiOpen);
        sub._tuiOpen = null;
        openSub(sub);
      }
      return;
    }

    // Checkbox items toggle and keep the menu open.
    const checkbox = e.target.closest("[data-tui-dropdownmenu-checkbox-item]");
    if (checkbox) {
      if (!checkbox.disabled) {
        const on = checkbox.getAttribute("data-state") === "checked";
        checkbox.setAttribute("data-state", on ? "unchecked" : "checked");
        checkbox.setAttribute("aria-checked", on ? "false" : "true");
        checkbox.dispatchEvent(
          new CustomEvent("dropdownmenu-checked-change", {
            bubbles: true,
            detail: { checked: !on },
          }),
        );
      }
      return;
    }

    // Radio items select within their group and keep the menu open.
    const radio = e.target.closest("[data-tui-dropdownmenu-radio-item]");
    if (radio) {
      if (!radio.disabled) {
        const group = radio.closest("[data-tui-dropdownmenu-radio-group]");
        if (group) {
          group.querySelectorAll("[data-tui-dropdownmenu-radio-item]").forEach((r) => {
            r.setAttribute("data-state", "unchecked");
            r.setAttribute("aria-checked", "false");
          });
        }
        radio.setAttribute("data-state", "checked");
        radio.setAttribute("aria-checked", "true");
        radio.dispatchEvent(
          new CustomEvent("dropdownmenu-value-change", {
            bubbles: true,
            detail: { value: radio.getAttribute("data-tui-dropdownmenu-radio-value") },
          }),
        );
      }
      return;
    }

    const item = e.target.closest("[data-tui-dropdownmenu-item]");
    if (item) {
      if (
        item.getAttribute("aria-disabled") !== "true" &&
        item.getAttribute("data-tui-dropdownmenu-prevent-close") !== "true"
      ) {
        const content = item.closest("[data-tui-dropdownmenu-content]");
        if (content) close(content);
      }
      return;
    }
    // Click outside any open menu closes everything.
    if (!e.target.closest("[data-tui-dropdownmenu-content]")) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  // Keep open menus anchored to their trigger while scrolling or resizing.
  function repositionOpen() {
    allContents().forEach((content) => {
      if (content.getAttribute("data-state") !== "open") return;
      const trigger = triggerFor(content);
      if (trigger) positionMenu(content, trigger);
    });
  }
  window.addEventListener("scroll", repositionOpen, true);
  window.addEventListener("resize", repositionOpen);
})();
