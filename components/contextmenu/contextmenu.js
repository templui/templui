// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  const EXIT_MS = 120; // exit animation (duration-100) + slack
  const COLLISION_PADDING = 8;
  // Submenu hover intent, like Base UI: open fast, close with a grace delay so
  // moving the mouse diagonally into the submenu does not flicker.
  const SUB_OPEN_DELAY = 100;
  const SUB_CLOSE_DELAY = 300;

  function allContents() {
    return document.querySelectorAll("[data-tui-contextmenu-content]");
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("data-tui-contextmenu-for") || "");
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-tui-contextmenu-trigger][data-tui-contextmenu-for="' + content.id + '"]',
    );
  }

  function popupFor(content) {
    return content.querySelector("[data-tui-contextmenu-popup]");
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
  // placement corner. The anchor here is the cursor (a zero-size rect).
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
    document.querySelectorAll("body > [data-tui-contextmenu-content]").forEach((c) => {
      if (c !== content && !triggerFor(c)) c.remove();
    });
    if (content.parentElement !== document.body) {
      document.body.appendChild(content);
    }
  }

  // A zero-size rect at the cursor acts as the anchor element.
  function cursorAnchor(x, y) {
    return {
      getBoundingClientRect: function () {
        return { x: x, y: y, top: y, bottom: y, left: x, right: x, width: 0, height: 0 };
      },
    };
  }

  function positionMenu(content, x, y) {
    const { computePosition, offset, flip, shift, size } = window.FloatingUIDOM;
    // Base UI context menu placement: right-start against the cursor,
    // sideOffset 0, alignOffset 4.
    const side = content.getAttribute("data-tui-contextmenu-side") || "right";
    const sideOffset =
      parseInt(content.getAttribute("data-tui-contextmenu-side-offset"), 10) || 0;
    const alignOffset =
      parseInt(content.getAttribute("data-tui-contextmenu-align-offset"), 10) || 0;
    const anchor = cursorAnchor(x, y);

    return computePosition(anchor, content, {
      placement: side + "-start",
      strategy: "fixed",
      middleware: [
        offset({ mainAxis: sideOffset, alignmentAxis: alignOffset }),
        flip({ padding: COLLISION_PADDING }),
        shift({ padding: COLLISION_PADDING }),
        size({
          padding: COLLISION_PADDING,
          apply(args) {
            content.style.setProperty(
              "--tui-contextmenu-available-height",
              args.availableHeight + "px",
            );
          },
        }),
      ],
    }).then((result) => {
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      setSide(content, result.placement.split("-")[0]);
      const popup = popupFor(content);
      if (popup) {
        popup.style.setProperty(
          "--tui-contextmenu-transform-origin",
          anchorOrigin(result, anchor.getBoundingClientRect(), sideOffset),
        );
      }
    });
  }

  // ----- focus highlighting (Base UI moves real focus to menu items) --------

  const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

  function containerOf(el) {
    return el.closest("[data-tui-contextmenu-sub-content], [data-tui-contextmenu-popup]");
  }

  function itemsIn(container) {
    return [...container.querySelectorAll(ITEM_SELECTOR)].filter(
      (item) =>
        containerOf(item) === container &&
        !item.disabled &&
        item.getAttribute("aria-disabled") !== "true",
    );
  }

  function focusItem(item) {
    if (item && document.activeElement !== item) item.focus({ preventScroll: false });
  }

  function moveFocus(container, delta) {
    const items = itemsIn(container);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    if (index === -1) {
      focusItem(delta > 0 ? items[0] : items[items.length - 1]);
      return;
    }
    const next = items[index + delta];
    if (next) focusItem(next);
  }

  // ----- open / close --------------------------------------------------------

  // Base UI menus are modal: the background scroll is locked while open,
  // with the body padded by the scrollbar width so the page does not shift.
  function lockScroll() {
    if (document.body.hasAttribute("data-tui-scroll-locked")) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.setAttribute("data-tui-scroll-locked", "");
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
  }

  function unlockScroll() {
    if (anyOpen()) return;
    document.body.removeAttribute("data-tui-scroll-locked");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  function openAt(content, x, y) {
    const alreadyOpen = content.getAttribute("data-state") === "open";
    allContents().forEach((c) => {
      if (c !== content) close(c);
    });
    clearTimeout(content._tuiHide);
    portal(content);
    lockScroll();
    if (!content.matches(":popover-open")) {
      content.showPopover(); // native top layer
    }

    if (alreadyOpen) {
      // Right-click somewhere else while open: move over to the new spot.
      content.querySelectorAll("[data-tui-contextmenu-sub]").forEach(closeSubNow);
      positionMenu(content, x, y);
      return;
    }

    // Fresh open: position it invisibly first, then play the enter animation
    // at the cursor.
    content.style.visibility = "hidden";
    positionMenu(content, x, y).then(() => {
      if (!content.matches(":popover-open")) return; // closed meanwhile
      content.style.visibility = "";
      setState(content, "open");
      const popup = popupFor(content);
      if (popup) popup.focus({ preventScroll: true });
    });
  }

  function close(content) {
    if (!content.matches(":popover-open")) return;
    setState(content, "closed");
    content.querySelectorAll("[data-tui-contextmenu-sub]").forEach(closeSubNow);
    clearTimeout(content._tuiHide);
    content._tuiHide = setTimeout(() => {
      if (content.getAttribute("data-state") === "closed" && content.matches(":popover-open")) {
        content.hidePopover();
      }
    }, EXIT_MS);
    unlockScroll();
  }

  function closeAll() {
    allContents().forEach(close);
  }

  function anyOpen() {
    return [...allContents()].find((c) => c.getAttribute("data-state") === "open") || null;
  }

  // ----- submenus -------------------------------------------------------------

  function subParts(sub) {
    return {
      trigger: sub.querySelector("[data-tui-contextmenu-sub-trigger]"),
      content: sub.querySelector("[data-tui-contextmenu-sub-content]"),
    };
  }

  function openSub(sub, focusFirst) {
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    content.classList.remove("hidden");
    content.style.visibility = "hidden";

    const { computePosition, offset, flip, shift } = window.FloatingUIDOM;
    // Base UI submenu placement: right-start, sideOffset 0, alignOffset -3.
    computePosition(trigger, content, {
      placement: "right-start",
      strategy: "fixed",
      middleware: [
        offset({ mainAxis: 0, alignmentAxis: -3 }),
        flip({ padding: COLLISION_PADDING }),
        shift({ padding: COLLISION_PADDING }),
      ],
    }).then((result) => {
      if (content.classList.contains("hidden")) return; // closed meanwhile
      content.style.transition = "none";
      content.style.left = result.x + "px";
      content.style.top = result.y + "px";
      content.setAttribute("data-side", result.placement.split("-")[0]);
      content.style.setProperty(
        "--tui-contextmenu-transform-origin",
        anchorOrigin(result, trigger.getBoundingClientRect(), 0),
      );
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
      content.style.visibility = "";
      content.setAttribute("data-state", "open");
      trigger.setAttribute("data-state", "open");
      if (focusFirst) focusItem(itemsIn(content)[0] || content);
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
    if (!(e.target instanceof Element)) return;
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

  // The highlight follows the pointer: focus the item under it, fall back to
  // the menu container when the pointer sits on empty menu space.
  document.addEventListener("pointermove", (e) => {
    if (!(e.target instanceof Element)) return;
    const content = e.target.closest("[data-tui-contextmenu-content]");
    if (!content || content.getAttribute("data-state") !== "open") return;
    const item = e.target.closest(ITEM_SELECTOR);
    if (item && containerOf(item)) {
      focusItem(item);
    } else {
      const container = containerOf(e.target) || popupFor(content);
      if (container && !container.contains(document.activeElement)) return;
      if (container && document.activeElement !== container) {
        container.focus({ preventScroll: true });
      }
    }
  });

  // ----- init (portal up front, like React does on mount) --------------------

  // Lift SSR'd contents out of their inert <template> wrappers into <body>,
  // replacing a stale portaled copy on re-swaps (e.g. htmx).
  function liftTemplates() {
    document.querySelectorAll("template[data-tui-contextmenu-portal]").forEach((tpl) => {
      const content = tpl.content.querySelector("[data-tui-contextmenu-content]");
      if (content) {
        const stale = document.getElementById(content.id);
        if (stale) stale.remove();
        document.body.appendChild(content);
      }
      tpl.remove();
    });
  }

  function initMenus() {
    liftTemplates();
    document.querySelectorAll("[data-tui-contextmenu-trigger]").forEach((trigger) => {
      const content = contentFor(trigger);
      if (content) portal(content);
    });
  }

  let initQueued = false;
  function queueInit() {
    if (initQueued) return;
    initQueued = true;
    requestAnimationFrame(() => {
      initQueued = false;
      initMenus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMenus);
  } else {
    initMenus();
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        queueInit();
        break;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ----- events ---------------------------------------------------------------

  document.addEventListener("contextmenu", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-contextmenu-trigger]");
    if (!trigger) return;
    const content = contentFor(trigger);
    if (!content) return;
    e.preventDefault();
    openAt(content, e.clientX, e.clientY);
  });

  // Dismiss on PRESS outside, like Base UI.
  document.addEventListener("pointerdown", (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.button !== 0) return;
    if (!e.target.closest("[data-tui-contextmenu-content]")) closeAll();
  });

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    // Clicking a submenu trigger opens it right away.
    const subTrigger = e.target.closest("[data-tui-contextmenu-sub-trigger]");
    if (subTrigger) {
      const sub = subTrigger.closest("[data-tui-contextmenu-sub]");
      if (sub) {
        clearTimeout(sub._tuiOpen);
        sub._tuiOpen = null;
        openSub(sub, e.detail === 0);
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
          group.querySelectorAll("[data-tui-contextmenu-radio-item]").forEach((r) => {
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
    }
  });

  document.addEventListener("keydown", (e) => {
    const content = anyOpen();
    if (!content) return;

    if (e.key === "Escape" || e.key === "Tab") {
      closeAll();
      return;
    }

    const active = document.activeElement;
    if (!content.contains(active)) return;
    const container = containerOf(active) || popupFor(content);
    if (!container) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus(container, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(container, -1);
        break;
      case "Home": {
        e.preventDefault();
        const items = itemsIn(container);
        focusItem(items[0]);
        break;
      }
      case "End": {
        e.preventDefault();
        const items = itemsIn(container);
        focusItem(items[items.length - 1]);
        break;
      }
      case "ArrowRight": {
        const subTrigger = active.closest("[data-tui-contextmenu-sub-trigger]");
        if (subTrigger) {
          e.preventDefault();
          const sub = subTrigger.closest("[data-tui-contextmenu-sub]");
          if (sub) openSub(sub, true);
        }
        break;
      }
      case "ArrowLeft": {
        const subContent = active.closest("[data-tui-contextmenu-sub-content]");
        if (subContent) {
          e.preventDefault();
          const sub = subContent.closest("[data-tui-contextmenu-sub]");
          if (sub) {
            const { trigger } = subParts(sub);
            closeSub(sub);
            if (trigger) trigger.focus({ preventScroll: true });
          }
        }
        break;
      }
    }
  });

  // Context menus close on scroll and resize (Base UI behavior: the anchor is
  // a point, there is nothing to stay attached to).
  window.addEventListener("scroll", closeAll, true);
  window.addEventListener("resize", closeAll);
})();
