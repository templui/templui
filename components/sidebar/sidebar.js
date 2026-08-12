(function () {
  "use strict";

  const SIDEBAR_COOKIE_NAME = "sidebar_state";
  const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
  const MOBILE_QUERY = "(max-width: 767px)";

  function wrapperFor(sidebarId) {
    return document.querySelector(
      '[data-tui-sidebar-wrapper][data-tui-sidebar-id="' + sidebarId + '"]',
    );
  }

  // The sidebar content renders once and moves between the desktop container
  // and the mobile sheet, depending on the viewport.
  function init() {
    document.querySelectorAll("[data-tui-sidebar-content]").forEach((content) => {
      const sidebarId = content.getAttribute("data-tui-sidebar-content");
      const portal = document.querySelector(
        '[data-tui-sidebar-mobile-portal="' + sidebarId + '"]',
      );
      if (!portal) return;

      const isMobile = window.matchMedia(MOBILE_QUERY).matches;

      if (isMobile && content.parentElement !== portal) {
        portal.appendChild(content);
      } else if (!isMobile && content.parentElement === portal) {
        const inner = wrapperFor(sidebarId)?.querySelector('[data-slot="sidebar-inner"]');
        if (inner) inner.appendChild(content);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("resize", init);
  // Re-init on any childList mutation, directly (never rAF-deferred: rAF
  // does not fire in hidden tabs or throttled iframes): swapped-in markup
  // wires itself.
  new MutationObserver(() => init()).observe(document.body, { childList: true, subtree: true });

  function toggleSidebar(sidebarId) {
    // Below md the trigger opens the mobile sheet instead of collapsing.
    if (window.matchMedia(MOBILE_QUERY).matches) {
      window.tui?.dialog?.toggle(sidebarId + "-mobile");
      return;
    }

    const wrapper = wrapperFor(sidebarId);
    if (!wrapper) return;
    const mode = wrapper.getAttribute("data-tui-sidebar-collapsible-mode");
    if (mode === "none") return;

    const collapsed = wrapper.getAttribute("data-state") !== "collapsed";
    wrapper.setAttribute("data-state", collapsed ? "collapsed" : "expanded");
    // Like shadcn, data-collapsible carries the mode only while collapsed,
    // so icon/offcanvas selectors need no extra state check.
    wrapper.setAttribute("data-collapsible", collapsed ? mode : "");

    // Menu button tooltips only show while collapsed to icons.
    const tooltipsDisabled = !(collapsed && mode === "icon");
    wrapper.querySelectorAll("[data-tui-tooltip-trigger]").forEach((trigger) => {
      // An explicit tooltip.hidden pendant pins the state.
      if (trigger.hasAttribute("data-tui-sidebar-tooltip-fixed")) return;
      trigger.toggleAttribute("data-tui-tooltip-disabled", tooltipsDisabled);
    });

    document.cookie =
      SIDEBAR_COOKIE_NAME +
      "=" +
      (collapsed ? "false" : "true") +
      "; path=/; max-age=" +
      SIDEBAR_COOKIE_MAX_AGE;
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest("[data-tui-sidebar-trigger]");
    if (!trigger) return;
    const targetId = trigger.getAttribute("data-tui-sidebar-target");
    if (targetId) toggleSidebar(targetId);
  });

  // The useSidebar pendant: the same seven members as the React hook,
  // addressing the first sidebar unless a sidebarId is given.
  function anyWrapper(sidebarId) {
    return sidebarId
      ? wrapperFor(sidebarId)
      : document.querySelector("[data-tui-sidebar-wrapper]");
  }

  window.tui = window.tui || {};
  window.tui.sidebar = {
    state(sidebarId) {
      return anyWrapper(sidebarId)?.getAttribute("data-state") || null;
    },
    open(sidebarId) {
      return this.state(sidebarId) === "expanded";
    },
    setOpen(open, sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      if (!wrapper) return;
      if (this.open(sidebarId) !== open) {
        toggleSidebar(wrapper.getAttribute("data-tui-sidebar-id"));
      }
    },
    openMobile(sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      const sheet = wrapper && document.getElementById(wrapper.getAttribute("data-tui-sidebar-id") + "-mobile");
      return !!(sheet && sheet.open);
    },
    setOpenMobile(open, sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      if (!wrapper) return;
      const id = wrapper.getAttribute("data-tui-sidebar-id") + "-mobile";
      if (open) window.tui?.dialog?.open(id);
      else window.tui?.dialog?.close(id);
    },
    isMobile() {
      return window.matchMedia(MOBILE_QUERY).matches;
    },
    toggleSidebar(sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      if (wrapper) toggleSidebar(wrapper.getAttribute("data-tui-sidebar-id"));
    },
  };

  // Cmd/Ctrl + shortcut key toggles the sidebar.
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.length !== 1) return;
    const wrapper = document.querySelector("[data-tui-sidebar-wrapper]");
    if (!wrapper) return;
    const shortcut = wrapper.getAttribute("data-tui-sidebar-keyboard-shortcut");
    if (!shortcut || shortcut.toLowerCase() !== e.key.toLowerCase()) return;
    e.preventDefault();
    toggleSidebar(wrapper.getAttribute("data-tui-sidebar-id"));
  });
})();
