// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  const scrollLockOwner = {};
  const elementStates = new WeakMap();
  const EXIT_MS = 120; // exit animation (duration-100) + slack
  const COLLISION_PADDING = 5;
  // Submenu hover intent, like Base UI: open fast, close with a grace delay so
  // moving the mouse diagonally into the submenu does not flicker.
  const SUB_OPEN_DELAY = 100;
  const SUB_CLOSE_DELAY = 300;

  function state(element) {
    if (!elementStates.has(element)) elementStates.set(element, {});
    return elementStates.get(element);
  }

  function allContents() {
    return document.querySelectorAll(`[data-slot="context-menu-positioner"]`);
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls") || "");
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-slot="context-menu-trigger"][aria-controls="' + content.id + '"]',
    );
  }

  function popupFor(content) {
    return content.querySelector(`[data-slot="context-menu-content"]`);
  }

  function setOpenState(element, open) {
    element.toggleAttribute("data-open", open);
    element.toggleAttribute("data-closed", !open);
  }

  function setState(content, state) {
    const open = state === "open";
    setOpenState(content, open);
    const popup = popupFor(content);
    if (popup) setOpenState(popup, open);
  }

  function setChecked(item, checked) {
    item.toggleAttribute("data-checked", checked);
    item.toggleAttribute("data-unchecked", !checked);
    item.setAttribute("aria-checked", checked ? "true" : "false");
  }

  function setSide(content, side) {
    content.setAttribute("data-side", side);
    const popup = popupFor(content);
    if (popup) popup.setAttribute("data-side", side);
  }

  // Base UI zooms the popup out of the anchor's center point, not out of a
  // placement corner. The anchor here is the cursor (a zero-size rect).
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
    document.querySelectorAll('body > [data-slot="context-menu-positioner"]').forEach((c) => {
      if (c !== content && state(c).portalOwner && !state(c).portalOwner.isConnected) c.remove();
    });
    if (content.parentElement !== document.body) {
      if (!state(content).portalOwner) state(content).portalOwner = content.parentElement;
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
    const side = content.getAttribute("data-side") || "right";
    const sideOffset = parseInt(content.getAttribute("data-side-offset"), 10) || 0;
    const alignOffset = parseInt(content.getAttribute("data-align-offset"), 10) || 0;
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
              "--available-height",
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
          "--transform-origin",
          anchorOrigin(
            result,
            anchor.getBoundingClientRect(),
            content.getBoundingClientRect(),
            sideOffset,
          ),
        );
      }
    });
  }

  // ----- focus highlighting (Base UI moves real focus to menu items) --------

  const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

  function containerOf(el) {
    return el.closest('[data-slot="context-menu-sub-content"], [data-slot="context-menu-content"]');
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
    window.shadcnTempl.setScrollLocked(scrollLockOwner, true);
  }

  function unlockScroll() {
    if (anyOpen()) return;
    window.shadcnTempl.setScrollLocked(scrollLockOwner, false);
  }

  function openAt(content, x, y) {
    const alreadyOpen = content.hasAttribute("data-open");
    allContents().forEach((c) => {
    if (c !== content) requestOpenChange(c, false);
    });
    clearTimeout(state(content).hideTimer);
    portal(content);
    lockScroll();
    // z-index portal like shadcn (no native top layer); re-append
    // keeps paint order = open order.
    document.body.appendChild(content);
    content.hidden = false;

    if (alreadyOpen) {
      // Right-click somewhere else while open: move over to the new spot.
      content.querySelectorAll(`[data-slot="context-menu-sub"]`).forEach(closeSubNow);
      positionMenu(content, x, y);
      return;
    }

    // Fresh open: position it invisibly first, then play the enter animation
    // at the cursor.
    content.style.visibility = "hidden";
    positionMenu(content, x, y).then(() => {
      if (content.hidden) return; // closed meanwhile
      // duration-100 transitions `all`; a visibility transition would
      // freeze at hidden in background tabs - flip suppressed.
      content.style.transitionProperty = "none";
      content.style.visibility = "";
      void content.offsetWidth;
      content.style.transitionProperty = "";
      setState(content, "open");
      const popup = popupFor(content);
	  if (popup) {
		syncSubState(popup);
		popup.focus({ preventScroll: true });
	  }
    });
  }

  function close(content) {
    if (content.hidden) return;
    setState(content, "closed");
    content.querySelectorAll(`[data-slot="context-menu-sub"]`).forEach(closeSubNow);
    clearTimeout(state(content).hideTimer);
    state(content).hideTimer = setTimeout(() => {
      if (content.hasAttribute("data-closed") && !content.hidden) {
        content.hidden = true;
      }
    }, EXIT_MS);
    unlockScroll();
  }

  function closeAll() {
  allContents().forEach((content) => requestOpenChange(content, false));
  }

  function requestOpenChange(content, nextOpen, x, y) {
  const trigger = triggerFor(content);
  const change = new CustomEvent("contextmenu-open-change", {
    bubbles: true,
    cancelable: true,
    detail: { open: nextOpen },
  });
  const accepted = (trigger || content).dispatchEvent(change);
  if (!accepted) return false;
  if (nextOpen) openAt(content, x, y);
  else close(content);
  return true;
  }

  function anyOpen() {
    return [...allContents()].find((c) => c.hasAttribute("data-open")) || null;
  }

  // ----- submenus -------------------------------------------------------------

  function subParts(sub) {
    return {
      trigger: sub.querySelector(`[data-slot="context-menu-sub-trigger"]`),
      content: sub.querySelector(`[data-slot="context-menu-sub-content"]`),
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
        "--transform-origin",
        anchorOrigin(result, trigger.getBoundingClientRect(), content.getBoundingClientRect(), 0),
      );
      content.offsetHeight; // flush styles before re-enabling transitions
      content.style.transition = "";
      // duration-100 transitions `all`; a visibility transition would
      // freeze at hidden in background tabs - flip suppressed.
      content.style.transitionProperty = "none";
      content.style.visibility = "";
      void content.offsetWidth;
      content.style.transitionProperty = "";
      setOpenState(content, true);
      setOpenState(trigger, true);
	  trigger.setAttribute("aria-expanded", "true");
      if (focusFirst) focusItem(itemsIn(content)[0] || content);
    });
  }

  // Closes with the exit animation.
  function closeSub(sub) {
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    setOpenState(content, false);
    setOpenState(trigger, false);
	trigger.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (content.hasAttribute("data-closed")) {
        content.classList.add("hidden");
      }
    }, EXIT_MS);
  }

  // Closes immediately (used when the whole menu goes away).
  function closeSubNow(sub) {
    clearTimeout(state(sub).openTimer);
    clearTimeout(state(sub).closeTimer);
    state(sub).openTimer = null;
    state(sub).closeTimer = null;
    const { trigger, content } = subParts(sub);
    if (!trigger || !content) return;
    content.classList.add("hidden");
    setOpenState(content, false);
    setOpenState(trigger, false);
	trigger.setAttribute("aria-expanded", "false");
  }

  function requestSubOpenChange(sub, nextOpen, focusFirst) {
	const { trigger, content } = subParts(sub);
	if (!trigger || !content || content.hasAttribute("data-open") === nextOpen) return;
	const accepted = trigger.dispatchEvent(
	  new CustomEvent("contextmenu-sub-open-change", {
		bubbles: true,
		cancelable: true,
		detail: { open: nextOpen },
	  }),
	);
	if (!accepted) return;
	sub.toggleAttribute("data-open", nextOpen);
	sub.toggleAttribute("data-closed", !nextOpen);
	if (nextOpen) openSub(sub, focusFirst);
	else closeSub(sub);
  }

  function syncSubState(menu) {
	menu.querySelectorAll(`[data-slot="context-menu-sub"]`).forEach((sub) => {
	  const { content } = subParts(sub);
	  if (!content) return;
	  const shouldOpen = sub.hasAttribute("data-open");
	  if (shouldOpen && !content.hasAttribute("data-open")) openSub(sub, false);
	  else if (!shouldOpen && content.hasAttribute("data-open")) closeSubNow(sub);
	});
  }

  // Hover intent: while the pointer is over a sub (trigger or its content),
  // keep it open; everything else in the menu schedules its subs to close.
  document.addEventListener("mouseover", (e) => {
    if (!(e.target instanceof Element)) return;
    const menu = e.target.closest(`[data-slot="context-menu-positioner"]`);
    if (!menu) return;
    const hovered = e.target.closest(`[data-slot="context-menu-sub"]`);

    menu.querySelectorAll(`[data-slot="context-menu-sub"]`).forEach((sub) => {
      const { content } = subParts(sub);
      if (!content) return;
      const isOpen = content.hasAttribute("data-open");
      const onPath = hovered && (sub === hovered || sub.contains(hovered));

      if (onPath) {
        clearTimeout(state(sub).closeTimer);
        state(sub).closeTimer = null;
        if (!isOpen && !state(sub).openTimer) {
          state(sub).openTimer = setTimeout(() => {
            state(sub).openTimer = null;
			requestSubOpenChange(sub, true);
          }, SUB_OPEN_DELAY);
        }
      } else {
        clearTimeout(state(sub).openTimer);
        state(sub).openTimer = null;
        if (isOpen && !state(sub).closeTimer) {
          state(sub).closeTimer = setTimeout(() => {
            state(sub).closeTimer = null;
			requestSubOpenChange(sub, false);
          }, SUB_CLOSE_DELAY);
        }
      }
    });
  });

  // The highlight follows the pointer: focus the item under it, fall back to
  // the menu container when the pointer sits on empty menu space.
  document.addEventListener("pointermove", (e) => {
    if (!(e.target instanceof Element)) return;
    const content = e.target.closest(`[data-slot="context-menu-positioner"]`);
    if (!content || !content.hasAttribute("data-open")) return;
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
  // replacing a stale portaled copy after ordinary DOM replacement.
  function liftTemplates() {
    document.querySelectorAll("template").forEach((tpl) => {
      const content = tpl.content.querySelector(`[data-slot="context-menu-positioner"]`);
      if (!content) return;
      if (content) {
        const stale = document.getElementById(content.id);
        if (stale) stale.remove();
        state(content).portalOwner = tpl.parentElement;
        document.body.appendChild(content);
      }
      tpl.remove();
    });
  }

  function init() {
    liftTemplates();
    document.querySelectorAll(`[data-slot="context-menu-trigger"]`).forEach((trigger) => {
      const content = contentFor(trigger);
    if (content) {
    portal(content);
    if (content.hasAttribute("data-open")) {
      const rect = trigger.getBoundingClientRect();
      openAt(content, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    }
    });
  }

  window.shadcnTempl.lifecycle.register("context-menu-positioner", {
    selector: '[data-slot="context-menu-positioner"]',
    setup() {},
    attributes: ["data-open"],
    attributeChanged(content) {
      const trigger = triggerFor(content);
      if (content.hasAttribute("data-open") && content.hidden && trigger) {
        const rect = trigger.getBoundingClientRect();
        openAt(content, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else if (!content.hasAttribute("data-open") && !content.hidden && !content.hasAttribute("data-closed")) {
        close(content);
      }
    },
  });
  window.shadcnTempl.lifecycle.register("context-menu-sub", {
    selector: '[data-slot="context-menu-sub"]',
    setup() {},
    attributes: ["data-open"],
    attributeChanged(sub) {
      const { content } = subParts(sub);
      if (!content) return;
      if (sub.hasAttribute("data-open") && !content.hasAttribute("data-open")) openSub(sub, false);
      else if (!sub.hasAttribute("data-open") && content.hasAttribute("data-open")) closeSub(sub);
    },
  });
  window.shadcnTempl.lifecycle.register("context-menu-checkbox-state", {
    selector: '[data-slot="context-menu-checkbox-item"]',
    setup() {},
    attributes: ["data-checked"],
    attributeChanged(item) {
      setChecked(item, item.hasAttribute("data-checked"));
    },
  });
  window.shadcnTempl.lifecycle.register("context-menu-radio-state", {
    selector: '[data-slot="context-menu-radio-item"]',
    setup() {},
    attributes: ["data-checked"],
    attributeChanged(item) {
      const checked = item.hasAttribute("data-checked");
      if (checked) {
        const group = item.closest('[data-slot="context-menu-radio-group"]');
        group?.querySelectorAll('[data-slot="context-menu-radio-item"][data-checked]').forEach((other) => {
          if (other !== item) setChecked(other, false);
        });
      }
      setChecked(item, checked);
    },
  });
  window.shadcnTempl.lifecycle.register("context-menu", {
    mount: init,
    unmount() {
      init();
      unlockScroll();
    },
  });

  // ----- events ---------------------------------------------------------------

  document.addEventListener("contextmenu", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest(`[data-slot="context-menu-trigger"]`);
    if (!trigger) return;
    const content = contentFor(trigger);
    if (!content) return;
    e.preventDefault();
  requestOpenChange(content, true, e.clientX, e.clientY);
  });

  // Dismiss on PRESS outside, like Base UI.
  document.addEventListener("pointerdown", (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.button !== 0) return;
    if (!e.target.closest(`[data-slot="context-menu-positioner"]`)) closeAll();
  });

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    // Clicking a submenu trigger opens it right away.
    const subTrigger = e.target.closest(`[data-slot="context-menu-sub-trigger"]`);
    if (subTrigger) {
      const sub = subTrigger.closest(`[data-slot="context-menu-sub"]`);
      if (sub) {
        clearTimeout(state(sub).openTimer);
        state(sub).openTimer = null;
		requestSubOpenChange(sub, true, e.detail === 0);
      }
      return;
    }

    // Checkbox items toggle and keep the menu open.
    const checkbox = e.target.closest(`[data-slot="context-menu-checkbox-item"]`);
    if (checkbox) {
      if (!checkbox.disabled) {
        const on = checkbox.hasAttribute("data-checked");
    const change = new CustomEvent("contextmenu-checked-change", {
      bubbles: true,
      cancelable: true,
      detail: { checked: !on },
    });
    const accepted = checkbox.dispatchEvent(change);
    if (accepted) {
      setChecked(checkbox, !on);
    }
      }
      return;
    }

    // Radio items select within their group and keep the menu open.
    const radio = e.target.closest(`[data-slot="context-menu-radio-item"]`);
    if (radio) {
      if (!radio.disabled) {
        const group = radio.closest(`[data-slot="context-menu-radio-group"]`);
    const change = new CustomEvent("contextmenu-value-change", {
      bubbles: true,
      cancelable: true,
      detail: { value: radio.getAttribute("data-value") },
    });
    const accepted = (group || radio).dispatchEvent(change);
    if (accepted && group) {
          group.querySelectorAll(`[data-slot="context-menu-radio-item"]`).forEach((r) => {
            setChecked(r, false);
          });
      setChecked(radio, true);
        }
      }
      return;
    }

    const item = e.target.closest(`[data-slot="context-menu-item"]`);
    if (item) {
      if (
        item.getAttribute("aria-disabled") !== "true" &&
        item.getAttribute("data-close-on-click") !== "false"
      ) {
        const content = item.closest(`[data-slot="context-menu-positioner"]`);
    if (content) requestOpenChange(content, false);
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
        const subTrigger = active.closest(`[data-slot="context-menu-sub-trigger"]`);
        if (subTrigger) {
          e.preventDefault();
          const sub = subTrigger.closest(`[data-slot="context-menu-sub"]`);
		  if (sub) requestSubOpenChange(sub, true, true);
        }
        break;
      }
      case "ArrowLeft": {
        const subContent = active.closest(`[data-slot="context-menu-sub-content"]`);
        if (subContent) {
          e.preventDefault();
          const sub = subContent.closest(`[data-slot="context-menu-sub"]`);
          if (sub) {
            const { trigger } = subParts(sub);
			requestSubOpenChange(sub, false);
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
