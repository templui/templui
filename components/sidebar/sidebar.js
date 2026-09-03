(function () {
  "use strict";

  const SIDEBAR_COOKIE_NAME = "sidebar_state";
  const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
  const MOBILE_QUERY = "(max-width: 767px)";

  function wrapperFor(sidebarId) {
    return document.querySelector(
      '[data-slot="sidebar"][data-sidebar-id="' + sidebarId + '"]',
    );
  }

  // The sidebar content renders once and moves between the desktop container
  // and the mobile sheet, depending on the viewport.
  function init() {
    document.querySelectorAll('[data-slot="sidebar-content-root"]').forEach((content) => {
      const sidebarId = content.getAttribute("data-sidebar-id");
      const portal = document.querySelector(
        '[data-slot="sidebar-mobile-content"][data-sidebar-id="' + sidebarId + '"]',
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

  window.shadcnTempl.lifecycle.register("sidebar", {
    selector: '[data-slot="sidebar"][data-sidebar-id]',
    setup: syncSidebar,
    mount: init,
    attributes: ["data-state"],
    attributeChanged: syncSidebar,
  });
  window.addEventListener("resize", init);

  function toggleSidebar(sidebarId) {
    // Below md the trigger opens the mobile sheet instead of collapsing.
    if (window.matchMedia(MOBILE_QUERY).matches) {
      window.shadcnTempl.dialog?.toggle(sidebarId + "-mobile");
      return;
    }

    const wrapper = wrapperFor(sidebarId);
    if (!wrapper) return;
    const mode = wrapper.getAttribute("data-collapsible-mode");
    if (mode === "none") return;

    const collapsed = wrapper.getAttribute("data-state") !== "collapsed";
    const accepted = wrapper.dispatchEvent(
      new CustomEvent("sidebar-open-change", {
        bubbles: true,
        cancelable: true,
        detail: { open: !collapsed },
      }),
    );
    if (!accepted) return;
    wrapper.setAttribute("data-state", collapsed ? "collapsed" : "expanded");

    syncSidebar(wrapper);

    document.cookie =
      SIDEBAR_COOKIE_NAME +
      "=" +
      (collapsed ? "false" : "true") +
      "; path=/; max-age=" +
      SIDEBAR_COOKIE_MAX_AGE;
  }

  function syncSidebar(wrapper) {
    const mode = wrapper.getAttribute("data-collapsible-mode");
    const collapsed = wrapper.getAttribute("data-state") === "collapsed";
    // Like shadcn, data-collapsible carries the mode only while collapsed,
    // so icon/offcanvas selectors need no extra state check.
    wrapper.setAttribute("data-collapsible", collapsed ? mode : "");

    // Menu button tooltips only show while collapsed to icons.
    const tooltipsDisabled = !(collapsed && mode === "icon");
    wrapper.querySelectorAll('[data-slot="tooltip-trigger"]').forEach((trigger) => {
      // An explicit tooltip.hidden pendant pins the state.
      if (trigger.hasAttribute("data-tooltip-fixed")) return;
      trigger.toggleAttribute("data-tooltip-disabled", tooltipsDisabled);
    });
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const trigger = e.target.closest('[data-slot="sidebar-trigger"], [data-slot="sidebar-rail"]');
    if (!trigger) return;
    const targetId = trigger.getAttribute("aria-controls");
    if (targetId) toggleSidebar(targetId);
  });

  // The useSidebar pendant: the same seven members as the React hook,
  // addressing the first sidebar unless a sidebarId is given.
  function anyWrapper(sidebarId) {
    return sidebarId
      ? wrapperFor(sidebarId)
      : document.querySelector('[data-slot="sidebar"][data-sidebar-id]');
  }

  window.shadcnTempl.sidebar = {
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
        toggleSidebar(wrapper.getAttribute("data-sidebar-id"));
      }
    },
    openMobile(sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      const sheet = wrapper && document.getElementById(wrapper.getAttribute("data-sidebar-id") + "-mobile");
      return !!(sheet && sheet.open);
    },
    setOpenMobile(open, sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      if (!wrapper) return;
      const id = wrapper.getAttribute("data-sidebar-id") + "-mobile";
      if (open) window.shadcnTempl.dialog?.open(id);
      else window.shadcnTempl.dialog?.close(id);
    },
    isMobile() {
      return window.matchMedia(MOBILE_QUERY).matches;
    },
    toggleSidebar(sidebarId) {
      const wrapper = anyWrapper(sidebarId);
      if (wrapper) toggleSidebar(wrapper.getAttribute("data-sidebar-id"));
    },
  };

  // Cmd/Ctrl + shortcut key toggles the sidebar.
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.length !== 1) return;
    const wrapper = document.querySelector('[data-slot="sidebar"][data-sidebar-id]');
    if (!wrapper) return;
    const shortcut = wrapper.getAttribute("data-keyboard-shortcut");
    if (!shortcut || shortcut.toLowerCase() !== e.key.toLowerCase()) return;
    e.preventDefault();
    toggleSidebar(wrapper.getAttribute("data-sidebar-id"));
  });
})();
