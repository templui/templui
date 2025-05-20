(function () {
  // IIFE
  function initDrawer(drawer) {
    // Get the drawer elements
    const triggers = drawer.querySelectorAll("[data-drawer-trigger]");
    const content = drawer.querySelector("[data-drawer-content]");
    const backdrop = drawer.querySelector("[data-drawer-backdrop]");
    const closeButtons = drawer.querySelectorAll("[data-drawer-close]");
    const position = content?.getAttribute("data-drawer-position") || "right";

    if (!content || !backdrop) return;

    // Set up animations based on position
    const transitions = {
      left: {
        enterFrom: "opacity-0 -translate-x-full",
        enterTo: "opacity-100 translate-x-0",
        leaveFrom: "opacity-100 translate-x-0",
        leaveTo: "opacity-0 -translate-x-full",
      },
      right: {
        enterFrom: "opacity-0 translate-x-full",
        enterTo: "opacity-100 translate-x-0",
        leaveFrom: "opacity-100 translate-x-0",
        leaveTo: "opacity-0 translate-x-full",
      },
      top: {
        enterFrom: "opacity-0 -translate-y-full",
        enterTo: "opacity-100 translate-y-0",
        leaveFrom: "opacity-100 translate-y-0",
        leaveTo: "opacity-0 -translate-y-full",
      },
      bottom: {
        enterFrom: "opacity-0 translate-y-full",
        enterTo: "opacity-100 translate-y-0",
        leaveFrom: "opacity-100 translate-y-0",
        leaveTo: "opacity-0 translate-y-full",
      },
    };

    // Check if drawer is already initialized
    if (drawer.dataset.drawerInitialized) {
      return;
    }
    drawer.dataset.drawerInitialized = "true";

    // Initial styles
    content.style.transform =
      position === "left"
        ? "translateX(-100%)"
        : position === "right"
        ? "translateX(100%)"
        : position === "top"
        ? "translateY(-100%)"
        : "translateY(100%)";
    content.style.opacity = "0";
    backdrop.style.opacity = "0";
    content.style.display = "none"; // Ensure it starts hidden
    backdrop.style.display = "none"; // Ensure it starts hidden

    // Function to open the drawer
    function openDrawer() {
      // Display elements
      backdrop.style.display = "block";
      content.style.display = "block";

      // Trigger reflow
      void content.offsetWidth;

      // Apply transitions
      backdrop.style.transition = "opacity 300ms ease-out";
      content.style.transition =
        "opacity 300ms ease-out, transform 300ms ease-out";

      // Animate in
      backdrop.style.opacity = "1";
      content.style.opacity = "1";
      content.style.transform = "translate(0)";

      // Lock body scroll
      document.body.style.overflow = "hidden";

      // Add event listeners for close actions
      backdrop.addEventListener("click", closeDrawer);
      document.addEventListener("keydown", handleEscKey);
      document.addEventListener("click", handleClickAway);
    }

    // Function to close the drawer
    function closeDrawer() {
      // Remove event listeners before animation starts
      backdrop.removeEventListener("click", closeDrawer);
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("click", handleClickAway);

      // Apply transitions
      backdrop.style.transition = "opacity 300ms ease-in";
      content.style.transition =
        "opacity 300ms ease-in, transform 300ms ease-in";

      // Animate out
      backdrop.style.opacity = "0";

      if (position === "left") {
        content.style.transform = "translateX(-100%)";
      } else if (position === "right") {
        content.style.transform = "translateX(100%)";
      } else if (position === "top") {
        content.style.transform = "translateY(-100%)";
      } else if (position === "bottom") {
        content.style.transform = "translateY(100%)";
      }

      content.style.opacity = "0";

      // Hide elements after animation
      setTimeout(() => {
        if (content.style.opacity === "0") {
          // Check if it wasn't reopened during the timeout
          backdrop.style.display = "none";
          content.style.display = "none";
        }
        // Unlock body scroll only if no other drawers are open
        const anyDrawerOpen = document.querySelector(
          '[data-component="drawer"] [data-drawer-backdrop][style*="display: block"]'
        );
        if (!anyDrawerOpen) {
          document.body.style.overflow = "";
        }
      }, 300);
    }

    // Click away handler
    function handleClickAway(e) {
      // Check if the click is outside the content AND not on any trigger associated with THIS drawer
      if (
        content.style.display === "block" &&
        !content.contains(e.target) &&
        !Array.from(triggers).some((trigger) => trigger.contains(e.target))
      ) {
        closeDrawer();
      }
    }

    // ESC key handler
    function handleEscKey(e) {
      if (e.key === "Escape" && content.style.display === "block") {
        closeDrawer();
      }
    }

    // Set up trigger click listeners
    triggers.forEach((trigger) => {
      trigger.removeEventListener("click", openDrawer); // Remove potential duplicates
      trigger.addEventListener("click", openDrawer);
    });

    // Set up close button listeners
    closeButtons.forEach((button) => {
      button.removeEventListener("click", closeDrawer); // Remove potential duplicates
      button.addEventListener("click", closeDrawer);
    });

    // Stop propagation on the inner content click to prevent backdrop click handler
    const inner = content.querySelector("[data-drawer-inner]");
    if (inner) {
      inner.removeEventListener("click", stopPropagationHandler); // Remove potential duplicates
      inner.addEventListener("click", stopPropagationHandler);
    }
  }

  function stopPropagationHandler(e) {
    e.stopPropagation();
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches('[data-component="drawer"]')) {
      initDrawer(root);
    }
    if (root && typeof root.querySelectorAll === "function") {
      const drawers = root.querySelectorAll('[data-component="drawer"]');
      drawers.forEach(initDrawer);
    }
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  initAllComponents();
  document.addEventListener("DOMContentLoaded", () => initAllComponents());
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})(); //
