// Uses window.FloatingUIDOM from components/floatingui (loaded in the same bundle).
(function () {
  // Constants from Base UI's select, shadcn's reference implementation.
  const EXIT_MS = 120; // popper exit animation (duration-100) + slack
  const SIDE_OFFSET = 4;
  const COLLISION_PADDING = 5;
  const MARGIN = 10; // aligned mode: minimum distance to the viewport edges
  const MIN_HEIGHT = 100; // less room than this -> fall back to popper
  const TRIGGER_COLLISION = 20; // trigger this close to an edge -> popper
  const TOL = 1; // scroll edge tolerance
  const ARROW_TICK_MS = 40; // hovering a scroll arrow scrolls one item per tick
  const SELECTED_DELAY = 400; // mouseup selection stays disabled this long after open

  function allContents() {
    return document.querySelectorAll("[data-tui-select-content]");
  }

  function triggerFor(content) {
    return document.querySelector(
      '[data-tui-select-trigger][aria-controls="' + content.id + '"]',
    );
  }

  function contentFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls"));
  }

  // The hidden form input sits right before the trigger button.
  function inputFor(trigger) {
    const prev = trigger.previousElementSibling;
    return prev && prev.hasAttribute("data-tui-select-input") ? prev : null;
  }

  function valueSpanFor(trigger) {
    return trigger.querySelector("[data-tui-select-value]");
  }

  function popupFor(content) {
    return content.querySelector("[data-tui-select-popup]");
  }

  function viewportFor(content) {
    return content.querySelector("[data-tui-select-viewport]");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function maxScrollTop(el) {
    return Math.max(0, el.scrollHeight - el.clientHeight);
  }

  function isAlignMode(content) {
    return !content.hasAttribute("data-tui-select-disable-align-item-with-trigger");
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

  // Base UI zooms the popup out of the anchor's center point (e.g.
  // "96px -4px"), not out of a placement corner.
  function anchorOrigin(result, anchorRect) {
    const side = result.placement.split("-")[0];
    const centerX = anchorRect.left + anchorRect.width / 2 - result.x + "px";
    const centerY = anchorRect.top + anchorRect.height / 2 - result.y + "px";
    if (side === "bottom") return centerX + " " + -SIDE_OFFSET + "px";
    if (side === "top") return centerX + " calc(100% + " + SIDE_OFFSET + "px)";
    if (side === "right") return -SIDE_OFFSET + "px " + centerY;
    return "calc(100% + " + SIDE_OFFSET + "px) " + centerY;
  }

  // Moves the content to <body> (shadcn portals it the same way). Also removes
  // contents whose trigger is gone (leftovers from swapped-out pages).
  function portal(content) {
    document.querySelectorAll("body > [data-tui-select-content]").forEach((c) => {
      if (c !== content && !triggerFor(c)) c.remove();
    });
    if (content.parentElement !== document.body) {
      document.body.appendChild(content);
    }
  }

  // Clears everything a previous open left behind on the positioner and popup.
  function resetInlineStyles(content) {
    ["left", "right", "top", "bottom", "height", "maxHeight", "marginTop", "marginBottom"].forEach(
      (prop) => (content.style[prop] = ""),
    );
    const popup = popupFor(content);
    if (popup) popup.style.height = "";
  }

  // Regular anchored placement below/above the trigger (Base UI's positioner).
  function positionPopper(content, trigger) {
    const { computePosition, offset, flip, shift, size } = window.FloatingUIDOM;
    const align = content.getAttribute("data-tui-select-align") || "center";
    const placement = align === "center" ? "bottom" : "bottom-" + align;

    return computePosition(trigger, content, {
      placement: placement,
      strategy: "fixed",
      middleware: [
        offset(SIDE_OFFSET),
        flip({ padding: COLLISION_PADDING }),
        shift({ padding: COLLISION_PADDING }),
        size({
          padding: COLLISION_PADDING,
          apply(args) {
            content.style.setProperty(
              "--tui-select-available-height",
              args.availableHeight + "px",
            );
            content.style.setProperty(
              "--tui-select-anchor-width",
              args.rects.reference.width + "px",
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
          "--tui-select-transform-origin",
          anchorOrigin(result, trigger.getBoundingClientRect()),
        );
      }
    });
  }

  // Overlays the menu so the selected item sits on the trigger with its text
  // aligned to the trigger text. Port of Base UI's SelectPopup align logic.
  // Runs after the popper pass (which sets the CSS vars and fallback coords);
  // returns false when Base UI would fall back to popper positioning.
  function positionAligned(content, trigger) {
    const popup = popupFor(content);
    const viewport = viewportFor(content);
    const valueEl = valueSpanFor(trigger);
    const textEl =
      content.querySelector('[data-tui-select-item][data-state="checked"] [data-tui-select-item-text]') ||
      content.querySelector("[data-tui-select-item] [data-tui-select-item-text]");

    const docEl = document.documentElement;
    const triggerRect = trigger.getBoundingClientRect();
    const positionerRect = content.getBoundingClientRect(); // natural size from the popper pass
    // The list's natural height, measured before the aligned styles stretch
    // the popup (scrollHeight can never report less than the client height).
    const naturalScrollHeight = viewport.scrollHeight;
    const popupStyles = window.getComputedStyle(popup);
    const borderBottom = parseFloat(popupStyles.borderBottomWidth) || 0;
    const maxPopupHeight = parseFloat(popupStyles.maxHeight) || Infinity;
    const viewportHeight = docEl.clientHeight - MARGIN * 2;
    const viewportWidth = docEl.clientWidth;
    const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerRect.height;

    let alignedLeft = triggerRect.left;
    let offsetY = 0;
    let textRect = null;
    if (textEl && valueEl) {
      const valueRect = valueEl.getBoundingClientRect();
      textRect = textEl.getBoundingClientRect();
      alignedLeft = positionerRect.left + (valueRect.left - textRect.left);
      offsetY =
        textRect.top - positionerRect.top + textRect.height / 2 -
        (valueRect.top - triggerRect.top + valueRect.height / 2);
    }

    const idealHeight = availableSpaceBeneathTrigger + offsetY + MARGIN + borderBottom;
    let height = Math.min(viewportHeight, idealHeight);
    const maxHeight = viewportHeight - MARGIN * 2;
    const scrollTop = idealHeight - height;

    content.style.left =
      clamp(
        alignedLeft,
        COLLISION_PADDING,
        Math.max(COLLISION_PADDING, viewportWidth - COLLISION_PADDING - positionerRect.width),
      ) + "px";
    content.style.height = height + "px";
    content.style.maxHeight = "none";
    content.style.marginTop = MARGIN + "px";
    content.style.marginBottom = MARGIN + "px";
    popup.style.height = "100%";

    const max = maxScrollTop(viewport);
    const isTopPositioned = scrollTop >= max - TOL;

    if (isTopPositioned) {
      height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - max);
    }

    if (
      triggerRect.top < TRIGGER_COLLISION ||
      triggerRect.bottom > viewportHeight - TRIGGER_COLLISION ||
      Math.ceil(height) + TOL < Math.min(naturalScrollHeight, MIN_HEIGHT)
    ) {
      return false;
    }

    content._tuiReachedMax = false;

    if (isTopPositioned) {
      const topOffset = Math.max(0, viewportHeight - idealHeight);
      content.style.top = (positionerRect.height >= maxHeight ? 0 : topOffset) + "px";
      content.style.height = height + "px";
      viewport.scrollTop = maxScrollTop(viewport);
    } else {
      content.style.top = "auto";
      content.style.bottom = "0px";
      viewport.scrollTop = scrollTop;
    }

    if (textRect) {
      const clampedY = clamp(
        positionerRect.height > 0
          ? ((textRect.top + textRect.height / 2 - positionerRect.top) / positionerRect.height) * 100
          : 50,
        0,
        100,
      );
      popup.style.setProperty("--tui-select-transform-origin", "50% " + clampedY + "%");
    }

    setSide(content, "none");
    if (height >= viewportHeight || height >= maxPopupHeight) {
      content._tuiReachedMax = true;
    }
    return true;
  }

  function position(content, trigger) {
    const popup = popupFor(content);
    const viewport = viewportFor(content);
    if (!popup || !viewport) return Promise.resolve();
    const alignMode = isAlignMode(content);
    popup.setAttribute("data-align-trigger", alignMode ? "true" : "false");
    resetInlineStyles(content);
    content._tuiAligned = false;

    return positionPopper(content, trigger)
      .then(() => {
        if (!alignMode) return undefined;
        if (positionAligned(content, trigger)) {
          content._tuiAligned = true;
          return undefined;
        }
        // Not enough room: redo the plain popper pass (the aligned attempt
        // dirtied the inline styles).
        resetInlineStyles(content);
        return positionPopper(content, trigger);
      })
      .then(() => updateScrollArrows(content));
  }

  // ----- scroll arrows + capped grow-on-scroll (Base UI behavior) -----------

  function updateScrollArrows(content) {
    const viewport = viewportFor(content);
    const up = content.querySelector("[data-tui-select-scroll-up]");
    const down = content.querySelector("[data-tui-select-scroll-down]");
    if (!viewport || !up || !down) return;
    const max = maxScrollTop(viewport);
    up.classList.toggle("hidden", max <= 0 || viewport.scrollTop <= TOL);
    down.classList.toggle("hidden", max <= 0 || viewport.scrollTop >= max - TOL);
  }

  // In aligned mode scrolling first consumes the remaining space toward the
  // viewport edge (capped by the popup's max-height), then scrolls the list.
  function handleAlignedScroll(content) {
    const viewport = viewportFor(content);
    const popup = popupFor(content);
    if (!viewport || !popup) return;

    const isTopPositioned = content.style.top === "0px";
    const isBottomPositioned = content.style.bottom === "0px";

    if (content._tuiReachedMax || !content._tuiAligned || (!isTopPositioned && !isBottomPositioned)) {
      updateScrollArrows(content);
      return;
    }

    const currentHeight = content.getBoundingClientRect().height;
    const maxPopupHeight = parseFloat(window.getComputedStyle(popup).maxHeight) || Infinity;
    const maxAvailableHeight = Math.min(
      document.documentElement.clientHeight - MARGIN * 2,
      maxPopupHeight,
    );

    const scrollTop = viewport.scrollTop;
    const max = maxScrollTop(viewport);

    let nextScrollTop = null;
    const diff = isTopPositioned ? max - scrollTop : scrollTop;
    const nextHeight = Math.min(currentHeight + diff, maxAvailableHeight);

    if (diff <= TOL) {
      const heightDelta = clamp(diff, 0, maxAvailableHeight - currentHeight);
      if (heightDelta > 0) {
        content.style.height = currentHeight + heightDelta + "px";
      }
      viewport.scrollTop = isTopPositioned ? maxScrollTop(viewport) : 0;
      if (maxAvailableHeight - (currentHeight + heightDelta) <= TOL) {
        content._tuiReachedMax = true;
      }
      updateScrollArrows(content);
      return;
    }

    if (maxAvailableHeight - nextHeight > TOL) {
      nextScrollTop = isTopPositioned ? Infinity : 0;
    } else if (isBottomPositioned && scrollTop < max) {
      const overshoot = currentHeight + diff - maxAvailableHeight;
      nextScrollTop = scrollTop - (diff - overshoot);
    }

    const nextPositionerHeight = Math.ceil(nextHeight);
    if (nextPositionerHeight !== 0) {
      content.style.height = nextPositionerHeight + "px";
    }

    if (nextScrollTop != null) {
      const target = clamp(nextScrollTop, 0, maxScrollTop(viewport));
      if (Math.abs(viewport.scrollTop - target) > TOL) {
        viewport.scrollTop = target;
      }
    }

    if (nextPositionerHeight >= maxAvailableHeight - TOL) {
      content._tuiReachedMax = true;
    }
    updateScrollArrows(content);
  }

  // Hovering a scroll arrow scrolls one item per tick, keeping the next item
  // clear of the arrow overlay (Base UI's getTargetScrollTop).
  function targetScrollTop(items, isUp, scrollTop, clientHeight, arrowHeight, max) {
    if (isUp) {
      let firstVisibleIndex = 0;
      const visibleTop = scrollTop + arrowHeight - TOL;
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].offsetTop >= visibleTop) {
          firstVisibleIndex = i;
          break;
        }
      }
      const targetIndex = Math.max(0, firstVisibleIndex - 1);
      const target = items[targetIndex];
      return targetIndex < firstVisibleIndex && target
        ? clamp(target.offsetTop - arrowHeight, 0, max)
        : 0;
    }

    let lastVisibleIndex = items.length - 1;
    const visibleBottom = scrollTop + clientHeight - arrowHeight + TOL;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].offsetTop + items[i].offsetHeight > visibleBottom) {
        lastVisibleIndex = Math.max(0, i - 1);
        break;
      }
    }
    const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
    const target = items[targetIndex];
    return targetIndex > lastVisibleIndex && target
      ? clamp(target.offsetTop + target.offsetHeight - clientHeight + arrowHeight, 0, max)
      : max;
  }

  let arrowTimer = null;

  function stopArrowScroll() {
    clearTimeout(arrowTimer);
    arrowTimer = null;
  }

  function arrowScrollStep(content, isUp, arrow) {
    const viewport = viewportFor(content);
    if (!viewport) return;
    updateScrollArrows(content);
    const max = maxScrollTop(viewport);
    const scrollTop = clamp(viewport.scrollTop, 0, max);
    if (scrollTop === (isUp ? 0 : max)) {
      stopArrowScroll();
      return;
    }
    const items = [...content.querySelectorAll("[data-tui-select-item]")];
    viewport.scrollTop = targetScrollTop(
      items,
      isUp,
      scrollTop,
      viewport.clientHeight,
      arrow.offsetHeight || 0,
      max,
    );
    arrowTimer = setTimeout(() => arrowScrollStep(content, isUp, arrow), ARROW_TICK_MS);
  }

  document.addEventListener("mouseover", (e) => {
    if (!(e.target instanceof Element)) return;
    const arrow = e.target.closest("[data-tui-select-scroll-up], [data-tui-select-scroll-down]");
    if (!arrow || arrowTimer) return;
    const content = arrow.closest("[data-tui-select-content]");
    if (content) arrowScrollStep(content, arrow.hasAttribute("data-tui-select-scroll-up"), arrow);
  });

  document.addEventListener("mouseout", (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest("[data-tui-select-scroll-up], [data-tui-select-scroll-down]")) {
      stopArrowScroll();
    }
  });

  // ----- open / close -------------------------------------------------------

  // The select is modal (Base UI default): the background scroll is locked
  // while open, with the body padded by the scrollbar width so the page
  // does not shift.
  function lockScroll() {
    if (document.body.hasAttribute("data-tui-scroll-locked")) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.setAttribute("data-tui-scroll-locked", "");
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
  }
  function unlockScroll() {
    if ([...allContents()].some((c) => c.getAttribute("data-state") === "open")) return;
    document.body.removeAttribute("data-tui-scroll-locked");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  function open(content, trigger) {
    allContents().forEach((c) => {
      if (c !== content) close(c);
    });
    clearTimeout(content._tuiHide);
    // A press on the trigger can open the popup under the pointer (aligned
    // mode). Mouseup selection stays disabled briefly so releasing over the
    // selected item or a neighboring item doesn't commit an accidental
    // selection (Base UI's selectionRef + SELECTED_DELAY). Dragging can
    // re-arm unselected mouseup sooner, see the pointermove handler.
    content._tuiSelection = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      dragY: 0,
    };
    clearTimeout(content._tuiSelectedDelay);
    content._tuiSelectedDelay = setTimeout(() => {
      content._tuiSelection.allowSelectedMouseUp = true;
      content._tuiSelection.allowUnselectedMouseUp = true;
    }, SELECTED_DELAY);
    portal(content);
    lockScroll(); // Base UI's select is modal by default: no page scroll while open
    if (!content.matches(":popover-open")) {
      content.showPopover(); // native top layer
    }

    // Position it invisibly first, then play the enter animation in place.
    content.style.visibility = "hidden";
    const finish = () => {
      content.style.visibility = "";
      if (!content.matches(":popover-open")) return;
      setState(content, "open");
      trigger.setAttribute("aria-expanded", "true");
      // Base UI moves focus to the selected item when the listbox opens.
      const selected =
        content.querySelector('[data-tui-select-item][data-state="checked"]') ||
        content.querySelector("[data-tui-select-item]");
      if (selected) selected.focus({ preventScroll: true });
    };
    position(content, trigger).then(finish, finish);
  }

  function close(content) {
    if (!content.matches(":popover-open")) return;
    stopArrowScroll();
    clearTimeout(content._tuiSelectedDelay);
    content._tuiSelection = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      dragY: 0,
    };
    content.style.visibility = "";
    setState(content, "closed");
    unlockScroll();
    const trigger = triggerFor(content);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    clearTimeout(content._tuiHide);
    // Aligned mode has no exit animation (animate-none, like shadcn) — hide
    // immediately instead of waiting for one.
    const popup = popupFor(content);
    if (popup && popup.getAttribute("data-align-trigger") === "true") {
      content.hidePopover();
      return;
    }
    content._tuiHide = setTimeout(() => {
      if (content.getAttribute("data-state") === "closed" && content.matches(":popover-open")) {
        content.hidePopover();
      }
    }, EXIT_MS);
  }

  function closeAll() {
    allContents().forEach(close);
  }

  function selectItem(content, item) {
    const trigger = triggerFor(content);
    if (!trigger) return;
    const value = item.getAttribute("data-tui-select-value") || "";
    const label =
      item.getAttribute("data-tui-select-label") ||
      (item.querySelector("[data-tui-select-item-text]") || item).textContent.trim();

    content.querySelectorAll("[data-tui-select-item]").forEach((i) => {
      i.setAttribute("data-state", "unchecked");
      i.setAttribute("aria-selected", "false");
    });
    item.setAttribute("data-state", "checked");
    item.setAttribute("aria-selected", "true");

    const span = valueSpanFor(trigger);
    if (span) span.textContent = label;
    trigger.removeAttribute("data-placeholder");

    const input = inputFor(trigger);
    if (input && input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    trigger.dispatchEvent(
      new CustomEvent("select-change", { bubbles: true, detail: { value: value, label: label } }),
    );
    close(content);
    trigger.focus();
  }

  // Shows the selected item's label in the trigger (server only knows the
  // value, the label lives in the item). Runs on load and whenever new selects
  // appear in the DOM (e.g. content swapped in by a library like htmx) — the
  // MutationObserver keeps this framework-agnostic.
  // Lift SSR'd contents out of their inert <template> wrappers into <body>,
  // replacing a stale portaled copy on re-swaps (e.g. htmx).
  function liftTemplates() {
    document.querySelectorAll("template[data-tui-select-portal]").forEach((tpl) => {
      const content = tpl.content.querySelector("[data-tui-select-content]");
      if (content) {
        const stale = document.getElementById(content.id);
        if (stale) stale.remove();
        document.body.appendChild(content);
      }
      tpl.remove();
    });
  }

  function syncTriggers() {
    liftTemplates();
    document.querySelectorAll("[data-tui-select-trigger]").forEach((trigger) => {
      const content = contentFor(trigger);
      if (!content) return;
      portal(content); // portal up front, like React does on mount
      const checked = content.querySelector('[data-tui-select-item][data-state="checked"]');
      if (!checked) return;
      const label =
        checked.getAttribute("data-tui-select-label") ||
        (checked.querySelector("[data-tui-select-item-text]") || checked).textContent.trim();
      const span = valueSpanFor(trigger);
      if (span && span.textContent.trim() !== label) span.textContent = label;
      if (trigger.hasAttribute("data-placeholder")) trigger.removeAttribute("data-placeholder");
    });
  }

  let syncQueued = false;
  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      syncTriggers();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncTriggers);
  } else {
    syncTriggers();
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        queueSync();
        break;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ----- events -------------------------------------------------------------

  // Pointer interactions toggle and dismiss on PRESS, exactly like Base UI.
  // Click is never used for open/close, so the stray click the browser fires
  // on <body> after the menu opened over the trigger is naturally harmless.
  function toggle(trigger) {
    const content = contentFor(trigger);
    if (!content) return;
    if (content.getAttribute("data-state") === "open") {
      close(content);
    } else {
      open(content, trigger);
    }
  }

  // Pendant of floating-ui useClick's pointerTypeRef: pointerdown marks the
  // trigger, the click that follows the same press is skipped. A click
  // without the mark (a <label for> forward, keyboard activation, or a
  // programmatic .click()) toggles instead.
  const pressedTriggers = new WeakSet();

  function isMouseWithinBounds(e, el) {
    const rect = el.getBoundingClientRect();
    return (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );
  }

  // Pendant of SelectTrigger's mousedown handler: the press that opened the
  // popup cancels the open again when released outside the trigger and the
  // popup positioner.
  function armCancelOpen(trigger, content) {
    // Firefox can fire the mouseup upon mousedown, hence the deferred attach.
    setTimeout(() => {
      document.addEventListener(
        "mouseup",
        (e) => {
          const target = e.target instanceof Element ? e.target : null;
          // Don't treat the release as an outside press when it lands on the
          // trigger or inside the popup (or their children).
          if (target && (trigger.contains(target) || content.contains(target))) return;
          if (isMouseWithinBounds(e, trigger)) return;
          close(content);
        },
        { once: true },
      );
    }, 0);
  }

  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-select-trigger]");
    if (trigger) {
      // Touch opens on the click that fires at release (Base UI opens on
      // the compat mousedown, which for touch also fires post-touchend).
      // Opening at press would put the aligned popup under the still-down
      // finger, and the tap's click, hit-tested at the release point,
      // would land on the item above the trigger and instantly commit it.
      if (e.pointerType === "touch") return;
      pressedTriggers.add(trigger);
      // Keep the browser from focusing the trigger button, focus lives on
      // the selected item while the listbox is open (Base UI focus scope).
      e.preventDefault();
      if (!trigger.disabled) {
        const content = contentFor(trigger);
        if (content) {
          if (content.getAttribute("data-state") === "open") {
            close(content);
          } else {
            open(content, trigger);
            armCancelOpen(trigger, content);
          }
        }
      }
      return;
    }

    // Pendant of SelectItem's allowMouseSelectionRef: a real pointer click
    // only commits when its press started on the item. The stray click the
    // browser hit-tests onto the popup that just opened over the trigger
    // (touch fires its compatibility click at the tap position) never did.
    const item = e.target.closest("[data-tui-select-item]");
    if (item) {
      item._tuiPointerType = e.pointerType;
      item._tuiAllowMouseSelection = true;
      const content = item.closest("[data-tui-select-content]");
      if (content && content._tuiSelection) content._tuiSelection.dragY = 0;
    }
    if (!e.target.closest("[data-tui-select-content]")) closeAll();
  });

  document.addEventListener("pointerover", (e) => {
    if (!(e.target instanceof Element)) return;
    const item = e.target.closest("[data-tui-select-item]");
    if (item) item._tuiPointerType = e.pointerType;
  });

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-select-trigger]");
    if (trigger) {
      if (pressedTriggers.has(trigger)) {
        pressedTriggers.delete(trigger);
        return;
      }
      if (!trigger.disabled) toggle(trigger);
      return;
    }

    const item = e.target.closest("[data-tui-select-item]");
    if (item) {
      const content = item.closest("[data-tui-select-content]");
      if (!content) return;
      // Virtual clicks (detail 0: keyboard, assistive technology, .click())
      // represent explicit activation and always commit; so do touch clicks,
      // whose press necessarily started on the item.
      const isMouseClick = (item._tuiPointerType || "mouse") !== "touch";
      const isVirtualClick = e.detail === 0;
      const isInvalidMouseClick =
        isMouseClick && !isVirtualClick && !item._tuiAllowMouseSelection;
      item._tuiAllowMouseSelection = false;
      if (item.hasAttribute("data-disabled") || isInvalidMouseClick) return;
      selectItem(content, item);
    }
  });

  // Pendant of SelectItem's mouseup: releasing a press that started on the
  // trigger commits the item under the pointer (press trigger, drag, release
  // to select), once the SELECTED_DELAY / drag guards allow it. Touch never
  // selects on mouseup, only on click.
  document.addEventListener("mouseup", (e) => {
    if (!(e.target instanceof Element)) return;
    const item = e.target.closest("[data-tui-select-item]");
    if (!item) return;
    const content = item.closest("[data-tui-select-content]");
    const selection = content && content._tuiSelection;
    if (!selection) return;
    selection.dragY = 0;
    if (item.hasAttribute("data-disabled") || item._tuiPointerType === "touch") return;
    // Regular clicks are committed by the click event.
    if (item._tuiAllowMouseSelection) return;
    const selected = item.getAttribute("data-state") === "checked";
    if (
      (!selection.allowSelectedMouseUp && selected) ||
      (!selection.allowUnselectedMouseUp && !selected)
    ) {
      return;
    }
    item._tuiAllowMouseSelection = true;
    item.click();
    item._tuiAllowMouseSelection = false;
  });

  let typeBuffer = "";
  let typeTimer;

  document.addEventListener("keydown", (e) => {
    if (!(e.target instanceof Element)) return;

    if (e.key === "Escape") {
      allContents().forEach((content) => {
        if (content.getAttribute("data-state") !== "open") return;
        const trigger = triggerFor(content);
        close(content);
        if (trigger) trigger.focus();
      });
      return;
    }

    // Closed trigger: arrow keys open the listbox (Enter/Space go through
    // the native button click path).
    const trigger = e.target.closest("[data-tui-select-trigger]");
    if (trigger && !trigger.disabled) {
      pressedTriggers.delete(trigger); // like useClick's onKeyDown reset
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const content = contentFor(trigger);
        if (content && content.getAttribute("data-state") !== "open") open(content, trigger);
      }
      return;
    }

    // Open listbox: roving focus on the items.
    const item = e.target.closest("[data-tui-select-item]");
    if (!item) return;
    const content = item.closest("[data-tui-select-content]");
    if (!content) return;
    const items = [...content.querySelectorAll("[data-tui-select-item]")].filter(
      (i) => !i.hasAttribute("data-disabled"),
    );
    const index = items.indexOf(item);

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = items[index + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) next.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const edge = e.key === "Home" ? items[0] : items[items.length - 1];
      if (edge) edge.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectItem(content, item);
    } else if (e.key === "Tab") {
      close(content);
    } else if (e.key.length === 1) {
      clearTimeout(typeTimer);
      typeBuffer += e.key.toLowerCase();
      typeTimer = setTimeout(() => {
        typeBuffer = "";
      }, 500);
      const match = items.find((i) => i.textContent.trim().toLowerCase().startsWith(typeBuffer));
      if (match) match.focus();
    }
  });

  // The highlight follows the pointer, one highlighted item at a time.
  document.addEventListener("pointermove", (e) => {
    if (!(e.target instanceof Element)) return;
    const item = e.target.closest("[data-tui-select-item]");
    if (!item) return;
    // Dragging with the button held re-arms unselected mouseup selection
    // before SELECTED_DELAY has elapsed, once the drag covers >= 8px.
    if (e.pointerType === "mouse" && e.buttons === 1) {
      const content = item.closest("[data-tui-select-content]");
      if (content && content._tuiSelection) {
        content._tuiSelection.dragY += e.movementY;
        if (content._tuiSelection.dragY ** 2 >= 64) {
          content._tuiSelection.allowUnselectedMouseUp = true;
        }
      }
    }
    if (!item.hasAttribute("data-disabled") && document.activeElement !== item) {
      item.focus({ preventScroll: true });
    }
  });

  window.addEventListener(
    "scroll",
    (e) => {
      const inMenu = e.target instanceof Element && e.target.closest("[data-tui-select-content]");
      if (inMenu) {
        if (inMenu._tuiAligned) {
          handleAlignedScroll(inMenu);
        } else {
          updateScrollArrows(inMenu);
        }
        return;
      }
      // Page scroll: keep open popper menus attached to their trigger
      // (aligned menus lock page scroll instead).
      allContents().forEach((content) => {
        if (content.getAttribute("data-state") !== "open" || content._tuiAligned) return;
        const trigger = triggerFor(content);
        if (trigger) positionPopper(content, trigger).then(() => updateScrollArrows(content));
      });
    },
    true,
  );

  window.addEventListener("resize", () => {
    allContents().forEach((content) => {
      if (content.getAttribute("data-state") !== "open") return;
      const trigger = triggerFor(content);
      if (trigger) position(content, trigger);
    });
  });
})();
