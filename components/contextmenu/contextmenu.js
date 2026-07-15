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
    return document.querySelectorAll("[data-tui-contextmenu-content]");
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
  // inside the viewport) and point the zoom animation at the anchor corner.
  // left/top changes ride the element's transition, so an open menu glides.
  function place(anchor, content, placement, middleware) {
    return window.FloatingUIDOM.computePosition(anchor, content, {
      placement: placement,
      strategy: "fixed",
      middleware: middleware,
    }).then((result) => applyPosition(content, result));
  }

  // Same, but applies the position instantly (transition suspended) — for
  // fresh opens, so the enter animation plays at the anchor instead of the
  // menu swiping over from wherever left/top pointed before.
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

  function cursorAnchor(x, y) {
    // A zero-size rect at the cursor acts as the anchor element.
    return {
      getBoundingClientRect: function () {
        return { x: x, y: y, top: y, bottom: y, left: x, right: x, width: 0, height: 0 };
      },
    };
  }

  function openAt(content, x, y) {
    const alreadyOpen = content.getAttribute("data-state") === "open";
    allContents().forEach((c) => {
      if (c !== content) close(c);
    });
    clearTimeout(content._tuiHide);
    if (!content.matches(":popover-open")) {
      content.showPopover(); // native top layer
    }

    const { offset, flip, shift } = window.FloatingUIDOM;
    const middleware = [offset(2), flip(), shift({ padding: 8 })];
    // Which side of the cursor the menu prefers (Side prop, default bottom).
    const side = content.getAttribute("data-tui-contextmenu-side") || "bottom";
    const placement = side + "-start";

    if (alreadyOpen) {
      // Right-click somewhere else while open: glide over to the new spot.
      content.querySelectorAll("[data-tui-contextmenu-sub]").forEach(closeSubNow);
      place(cursorAnchor(x, y), content, placement, middleware);
      return;
    }

    // Fresh open: position it invisibly first, then play the enter animation
    // at the cursor.
    content.style.visibility = "hidden";
    placeNow(cursorAnchor(x, y), content, placement, middleware).then(() => {
      if (!content.matches(":popover-open")) return; // closed meanwhile
      content.style.visibility = "";
      content.setAttribute("data-state", "open");
    });
  }

  function close(content) {
    if (!content.matches(":popover-open")) return;
    content.setAttribute("data-state", "closed");
    content.querySelectorAll("[data-tui-contextmenu-sub]").forEach(closeSubNow);
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
      trigger: sub.querySelector("[data-tui-contextmenu-sub-trigger]"),
      content: sub.querySelector("[data-tui-contextmenu-sub-content]"),
    };
  }

  function openSub(sub) {
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    content.classList.remove("hidden");
    content.style.visibility = "hidden";

    const { offset, flip, shift } = window.FloatingUIDOM;
    // mainAxis -1 overlaps the menu borders; alignmentAxis -4 lines the first
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
    const menu = e.target.closest("[data-tui-contextmenu-content]");
    if (!menu) return;
    const hovered = e.target.closest("[data-tui-contextmenu-sub]");

    menu.querySelectorAll("[data-tui-contextmenu-sub]").forEach((sub) => {
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

  document.addEventListener("contextmenu", (e) => {
    const trigger = e.target.closest("[data-tui-contextmenu-trigger]");
    if (!trigger) return;
    const root = trigger.closest("[data-tui-contextmenu-root]");
    const content = root?.querySelector("[data-tui-contextmenu-content]");
    if (!content) return;
    e.preventDefault();
    openAt(content, e.clientX, e.clientY);
  });

  document.addEventListener("click", (e) => {
    // Clicking a submenu trigger opens it right away.
    const subTrigger = e.target.closest("[data-tui-contextmenu-sub-trigger]");
    if (subTrigger) {
      const sub = subTrigger.closest("[data-tui-contextmenu-sub]");
      if (sub) {
        clearTimeout(sub._tuiOpen);
        sub._tuiOpen = null;
        openSub(sub);
      }
      return;
    }

    // Checkbox items toggle and keep the menu open.
    const checkbox = e.target.closest("[data-tui-contextmenu-checkbox-item]");
    if (checkbox) {
      if (!checkbox.disabled) {
        const on = checkbox.getAttribute("data-state") === "checked";
        checkbox.setAttribute("data-state", on ? "unchecked" : "checked");
        checkbox.setAttribute("aria-checked", on ? "false" : "true");
        checkbox.dispatchEvent(
          new CustomEvent("contextmenu-checked-change", {
            bubbles: true,
            detail: { checked: !on },
          }),
        );
      }
      return;
    }

    // Radio items select within their group and keep the menu open.
    const radio = e.target.closest("[data-tui-contextmenu-radio-item]");
    if (radio) {
      if (!radio.disabled) {
        const group = radio.closest("[data-tui-contextmenu-radio-group]");
        if (group) {
          group
            .querySelectorAll("[data-tui-contextmenu-radio-item]")
            .forEach((r) => {
              r.setAttribute("data-state", "unchecked");
              r.setAttribute("aria-checked", "false");
            });
        }
        radio.setAttribute("data-state", "checked");
        radio.setAttribute("aria-checked", "true");
        radio.dispatchEvent(
          new CustomEvent("contextmenu-value-change", {
            bubbles: true,
            detail: { value: radio.getAttribute("data-tui-contextmenu-radio-value") },
          }),
        );
      }
      return;
    }

    const item = e.target.closest("[data-tui-contextmenu-item]");
    if (item) {
      if (
        item.getAttribute("aria-disabled") !== "true" &&
        item.getAttribute("data-tui-contextmenu-prevent-close") !== "true"
      ) {
        const content = item.closest("[data-tui-contextmenu-content]");
        if (content) close(content);
      }
      return;
    }
    // Click outside any open menu closes everything.
    if (!e.target.closest("[data-tui-contextmenu-content]")) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  window.addEventListener("scroll", closeAll, true);
  window.addEventListener("resize", closeAll);
})();
