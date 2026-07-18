(function () {
  // Vanilla port of sonner's core (the library shadcn ships for toasts).
  // The vendored sonner.css does all styling/animation; this script only
  // manages the data attributes and CSS variables of its contract.
  const DEFAULT_DURATION = 4000;
  const VISIBLE_TOASTS = 3;
  const TIME_BEFORE_UNMOUNT = 400;
  const SWIPE_THRESHOLD = 45;

  function toasters() {
    return document.querySelectorAll("[data-tui-toaster]");
  }

  function toastsOf(toaster) {
    // Newest first, like sonner's internal list.
    return [...toaster.querySelectorAll("[data-sonner-toast]:not([data-removed='true'])")].reverse();
  }

  function applyPosition(toaster) {
    const pos = toaster.getAttribute("data-tui-toaster-position") || "bottom-right";
    const [y, x] = pos.split("-");
    toaster.setAttribute("data-y-position", y);
    toaster.setAttribute("data-x-position", x);
    toaster.querySelectorAll("[data-sonner-toast]").forEach((t) => {
      t.setAttribute("data-y-position", y);
      t.setAttribute("data-x-position", x);
    });
  }

  function applyTheme(toaster) {
    toaster.setAttribute(
      "data-sonner-theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }

  function reindex(toaster) {
    const toasts = toastsOf(toaster);
    const expanded = toaster.getAttribute("data-lifted") === "true";
    let offset = 0;
    toasts.forEach((t, i) => {
      const height = parseFloat(t.style.getPropertyValue("--initial-height")) || t.offsetHeight;
      t.style.setProperty("--index", i);
      t.style.setProperty("--toasts-before", i);
      t.style.setProperty("--z-index", toasts.length - i);
      t.style.setProperty("--offset", offset + "px");
      t.setAttribute("data-front", i === 0 ? "true" : "false");
      t.setAttribute("data-visible", i < VISIBLE_TOASTS ? "true" : "false");
      t.setAttribute("data-expanded", expanded ? "true" : "false");
      offset += height + 14;
    });
    const front = toasts[0];
    if (front) {
      toaster.style.setProperty(
        "--front-toast-height",
        (parseFloat(front.style.getPropertyValue("--initial-height")) || front.offsetHeight) + "px",
      );
    }
  }

  function startTimer(toast) {
    stopTimer(toast);
    const toaster = toast.closest("[data-tui-toaster]");
    if (!toaster) return;
    let duration = parseInt(toast.getAttribute("data-tui-toast-duration"), 10);
    if (!duration) {
      duration = parseInt(toaster.getAttribute("data-tui-toaster-duration"), 10) || DEFAULT_DURATION;
    }
    if (duration < 0 || toast.getAttribute("data-type") === "loading") return;
    if (toast._tuiRemaining == null) toast._tuiRemaining = duration;
    toast._tuiStarted = performance.now();
    toast._tuiTimer = setTimeout(() => dismiss(toast), toast._tuiRemaining);
  }

  function stopTimer(toast) {
    if (!toast._tuiTimer) return;
    clearTimeout(toast._tuiTimer);
    toast._tuiTimer = null;
    if (toast._tuiStarted && toast._tuiRemaining != null) {
      toast._tuiRemaining = Math.max(0, toast._tuiRemaining - (performance.now() - toast._tuiStarted));
    }
  }

  function mount(toast) {
    if (toast._tuiMounted) return;
    toast._tuiMounted = true;
    const toaster = toast.closest("[data-tui-toaster]");
    if (!toaster) return;

    if (
      toaster.hasAttribute("data-tui-toaster-close-button") &&
      !toast.querySelector("[data-close-button]")
    ) {
      const btn = document.createElement("button");
      btn.setAttribute("data-close-button", "true");
      btn.setAttribute("aria-label", "Close toast");
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      toast.insertBefore(btn, toast.firstChild);
    }
    if (!toast.hasAttribute("data-dismissible")) toast.setAttribute("data-dismissible", "true");

    applyPosition(toaster);
    toast.style.setProperty("--initial-height", toast.offsetHeight + "px");
    reindex(toaster);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.setAttribute("data-mounted", "true"));
    });
    startTimer(toast);
  }

  function dismiss(toast) {
    if (!toast || toast.getAttribute("data-removed") === "true") return;
    stopTimer(toast);
    const toaster = toast.closest("[data-tui-toaster]");
    toast.setAttribute("data-removed", "true");
    if (toaster) reindex(toaster);
    setTimeout(() => {
      toast.remove();
      if (toaster) reindex(toaster);
    }, TIME_BEFORE_UNMOUNT);
  }

  // ----- JavaScript API -----------------------------------------------------

  const ICONS = {
    success:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    warning:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    error:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H8.828a2 2 0 0 0-1.414.586L2.586 7.414A2 2 0 0 0 2 8.828v6.344a2 2 0 0 0 .586 1.414l4.828 4.828A2 2 0 0 0 8.828 22h6.344a2 2 0 0 0 1.414-.586l4.828-4.828A2 2 0 0 0 22 15.172V8.828a2 2 0 0 0-.586-1.414z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    loading:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  };

  function toasterFor(position) {
    const base = document.querySelector("[data-tui-toaster]");
    if (!base) return null;
    const pos = position || base.getAttribute("data-tui-toaster-position") || "bottom-right";
    let match = null;
    toasters().forEach((t) => {
      if ((t.getAttribute("data-tui-toaster-position") || "bottom-right") === pos) match = t;
    });
    if (match) return match;
    const clone = base.cloneNode(false);
    clone.removeAttribute("id");
    clone.setAttribute("data-tui-toaster-position", pos);
    document.body.appendChild(clone);
    applyTheme(clone);
    applyPosition(clone);
    return clone;
  }

  function createToast(title, opts) {
    opts = opts || {};
    const toaster = toasterFor(opts.position);
    if (!toaster) return null;

    const li = document.createElement("li");
    li.className = "cn-toast rounded-2xl";
    li.setAttribute("data-sonner-toast", "");
    li.setAttribute("data-tui-toast", "");
    li.setAttribute("data-styled", "true");
    li.setAttribute("data-type", opts.type || "default");
    li.setAttribute("data-mounted", "false");
    li.setAttribute("data-removed", "false");
    li.setAttribute("data-swiping", "false");
    li.setAttribute("data-swipe-out", "false");
    li.setAttribute("data-expanded", "false");
    if (opts.duration) li.setAttribute("data-tui-toast-duration", String(opts.duration));

    if (opts.type && ICONS[opts.type]) {
      const iconEl = document.createElement("div");
      iconEl.setAttribute("data-icon", "");
      iconEl.innerHTML = ICONS[opts.type];
      li.appendChild(iconEl);
    }

    const content = document.createElement("div");
    content.setAttribute("data-content", "");
    const titleEl = document.createElement("div");
    titleEl.setAttribute("data-title", "");
    titleEl.textContent = title;
    content.appendChild(titleEl);
    if (opts.description) {
      const desc = document.createElement("div");
      desc.setAttribute("data-description", "");
      desc.textContent = opts.description;
      content.appendChild(desc);
    }
    li.appendChild(content);

    if (opts.action && opts.action.label) {
      const action = document.createElement("button");
      action.setAttribute("data-button", "");
      action.setAttribute("data-action", "");
      action.textContent = opts.action.label;
      action.addEventListener("click", (e) => {
        if (typeof opts.action.onClick === "function") opts.action.onClick(e);
        dismiss(li);
      });
      li.appendChild(action);
    }
    if (opts.cancel && opts.cancel.label) {
      const cancel = document.createElement("button");
      cancel.setAttribute("data-button", "");
      cancel.setAttribute("data-cancel", "");
      cancel.textContent = opts.cancel.label;
      cancel.addEventListener("click", (e) => {
        if (typeof opts.cancel.onClick === "function") opts.cancel.onClick(e);
        dismiss(li);
      });
      li.appendChild(cancel);
    }

    toaster.appendChild(li);
    mount(li);
    return li;
  }

  const api = (title, opts) => createToast(title, opts);
  ["success", "info", "warning", "error", "loading"].forEach((type) => {
    api[type] = (title, opts) => createToast(title, Object.assign({}, opts, { type: type }));
  });
  // toast.promise: shows a loading toast, then morphs it into success/error.
  api.promise = (promise, opts) => {
    opts = opts || {};
    const li = createToast(opts.loading || "Loading...", Object.assign({}, opts, { type: "loading" }));
    if (!li) return null;
    const p = typeof promise === "function" ? promise() : promise;
    const morph = (type, title) => {
      if (!li.isConnected) return;
      li.setAttribute("data-type", type);
      const iconEl = li.querySelector("[data-icon]");
      if (iconEl) iconEl.innerHTML = ICONS[type] || "";
      const titleEl = li.querySelector("[data-title]");
      if (titleEl) titleEl.textContent = title;
      li.style.setProperty("--initial-height", li.offsetHeight + "px");
      const toaster = li.closest("[data-tui-toaster]");
      if (toaster) reindex(toaster);
      li._tuiRemaining = null;
      startTimer(li);
    };
    Promise.resolve(p)
      .then((data) => {
        const title = typeof opts.success === "function" ? opts.success(data) : opts.success || "Done";
        morph("success", title);
      })
      .catch((err) => {
        const title = typeof opts.error === "function" ? opts.error(err) : opts.error || "Error";
        morph("error", title);
      });
    return li;
  };

  api.dismiss = (toast) => {
    if (toast) {
      dismiss(typeof toast === "string" ? document.getElementById(toast) : toast);
    } else {
      document.querySelectorAll("[data-sonner-toast]").forEach(dismiss);
    }
  };

  window.tui = window.tui || {};
  window.tui.toast = api;

  // ----- interactions -------------------------------------------------------

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const closeBtn = e.target.closest("[data-close-button]");
    if (closeBtn) dismiss(closeBtn.closest("[data-sonner-toast]"));
  });

  // Hovering the stack lifts and expands it; leaving collapses it.
  document.addEventListener(
    "pointerenter",
    (e) => {
      if (!(e.target instanceof Element) || !e.target.closest) return;
      const toaster = e.target.closest("[data-tui-toaster]");
      if (!toaster || toaster.getAttribute("data-lifted") === "true") return;
      toaster.setAttribute("data-lifted", "true");
      reindex(toaster);
      toaster.querySelectorAll("[data-sonner-toast]").forEach(stopTimer);
    },
    true,
  );

  document.addEventListener(
    "pointerleave",
    (e) => {
      if (!(e.target instanceof Element) || !e.target.hasAttribute) return;
      if (!e.target.hasAttribute("data-tui-toaster")) return;
      const toaster = e.target;
      toaster.setAttribute("data-lifted", "false");
      reindex(toaster);
      toastsOf(toaster).forEach(startTimer);
    },
    true,
  );

  // Swipe to dismiss, toward the edge the stack sits on.
  document.addEventListener("pointerdown", (e) => {
    if (!(e.target instanceof Element)) return;
    const toast = e.target.closest("[data-sonner-toast]");
    if (!toast || e.target.closest("[data-button],[data-close-button]")) return;
    toast._tuiSwipeStart = { x: e.clientX, y: e.clientY };
    toast.setAttribute("data-swiping", "true");
  });

  document.addEventListener("pointermove", (e) => {
    const toast = document.querySelector('[data-sonner-toast][data-swiping="true"]');
    if (!toast || !toast._tuiSwipeStart) return;
    const dy = e.clientY - toast._tuiSwipeStart.y;
    const allowed = toast.getAttribute("data-y-position") === "top" ? Math.min(0, dy) : Math.max(0, dy);
    toast.style.setProperty("--swipe-amount-y", allowed + "px");
  });

  document.addEventListener("pointerup", () => {
    const toast = document.querySelector('[data-sonner-toast][data-swiping="true"]');
    if (!toast) return;
    const amount = Math.abs(parseFloat(toast.style.getPropertyValue("--swipe-amount-y")) || 0);
    if (amount >= SWIPE_THRESHOLD) {
      toast.setAttribute("data-swipe-out", "true");
      toast.setAttribute(
        "data-swipe-direction",
        toast.getAttribute("data-y-position") === "top" ? "up" : "down",
      );
      dismiss(toast);
    } else {
      toast.style.setProperty("--swipe-amount-y", "0px");
      toast.setAttribute("data-swiping", "false");
    }
    toast._tuiSwipeStart = null;
  });

  // ----- init ---------------------------------------------------------------

  function init() {
    toasters().forEach((toaster) => {
      applyTheme(toaster);
      applyPosition(toaster);
      toaster.querySelectorAll("[data-sonner-toast]").forEach(mount);
    });
  }

  let queued = false;
  function queueInit() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      init();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        queueInit();
        break;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Keep toasts in sync with the light/dark toggle.
  new MutationObserver(() => {
    toasters().forEach(applyTheme);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();
