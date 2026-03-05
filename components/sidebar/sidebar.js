(function () {
  "use strict";

  const SIDEBAR_COOKIE_NAME = "sidebar_state";
  const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

  // Portal setup - moves content between desktop and mobile views
  function setupMobilePortals() {
    const contentElements = document.querySelectorAll(
      "[data-tui-sidebar-content]",
    );

    contentElements.forEach((content) => {
      const sidebarId = content.getAttribute("data-tui-sidebar-content");
      const portal = document.querySelector(
        `[data-tui-sidebar-mobile-portal="${sidebarId}"]`,
      );
      if (!portal) return;

      // Check viewport and move content if needed
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (isMobile && content.parentElement !== portal) {
        // Move to mobile portal
        portal.appendChild(content);
      } else if (!isMobile && content.parentElement === portal) {
        // Move back to desktop sidebar
        const desktopContainer = document.querySelector(
          `[data-tui-sidebar-wrapper][data-tui-sidebar-id="${sidebarId}"] [data-sidebar="sidebar"] > div`,
        );
        if (desktopContainer) {
          desktopContainer.appendChild(content);
        }
      }
    });
  }

  // Initial setup
  setupMobilePortals();

  // Handle viewport changes
  window.addEventListener("resize", setupMobilePortals);

  // Handle DOM updates (for HTMX, Alpine, etc.)
  const observer = new MutationObserver(setupMobilePortals);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Event delegation for sidebar interactions (Desktop only - Mobile uses Sheet)
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-tui-sidebar-trigger]");
    if (trigger) {
      e.preventDefault();
      const targetId = trigger.getAttribute("data-tui-sidebar-target");
      if (targetId) {
        toggleSidebar(targetId);
      }
    }
  });

  // Handle keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + key - toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key.length === 1) {
      const wrapper = document.querySelector('[data-tui-sidebar-wrapper]');
      if (!wrapper) return;
      
      const shortcut = wrapper.getAttribute("data-tui-sidebar-keyboard-shortcut");
      if (!shortcut || shortcut.toLowerCase() !== e.key.toLowerCase()) return;
      
      e.preventDefault();
      const sidebar = wrapper.querySelector('[data-sidebar="sidebar"]');
      if (sidebar && sidebar.id) {
        toggleSidebar(sidebar.id);
      }
    }
  });

  function toggleSidebar(sidebarId) {
    const wrapper = document.querySelector(
      `[data-tui-sidebar-wrapper][data-tui-sidebar-id="${sidebarId}"]`,
    );
    if (!wrapper) return;

    const collapsible = wrapper.getAttribute("data-tui-sidebar-collapsible");

    // Don't toggle if collapsible is "none"
    if (collapsible === "none") {
      return;
    }

    const currentState = wrapper.getAttribute("data-tui-sidebar-state");
    const newState = currentState === "expanded" ? "collapsed" : "expanded";

    setSidebarState(sidebarId, newState);
  }

  function setSidebarState(sidebarId, state) {
    const wrapper = document.querySelector(
      `[data-tui-sidebar-wrapper][data-tui-sidebar-id="${sidebarId}"]`,
    );
    if (!wrapper) return;

    const collapsible = wrapper.getAttribute("data-tui-sidebar-collapsible");

    // Don't change state if collapsible is "none"
    if (collapsible === "none") {
      return;
    }

    // Update data-tui-sidebar-state attribute
    wrapper.setAttribute("data-tui-sidebar-state", state);

    // For icon mode, also set data-tui-sidebar-collapsible when collapsed
    if (state === "collapsed" && collapsible) {
      wrapper.setAttribute("data-tui-sidebar-collapsible", collapsible);
    }

    // Save state to cookie
    const cookieValue = state === "expanded" ? "true" : "false";
    saveSidebarState(sidebarId, cookieValue);
  }

  function saveSidebarState(sidebarId, cookieValue) {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${cookieValue}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }
})();
