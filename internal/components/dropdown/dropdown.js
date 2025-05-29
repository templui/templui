(function () {
  // IIFE
  function handleDropdownItemClick(event) {
    const item = event.currentTarget;
    const popoverContent = item.closest("[data-popover-id]");
    if (popoverContent) {
      const popoverId = popoverContent.dataset.popoverId;
      if (window.closePopover) {
        window.closePopover(popoverId, true);
      } else {
        console.warn("popover.Script's closePopover function not found.");
        document.body.click(); // Fallback
      }
    }
  }

  function initAllComponents(root = document) {
    // Select items with 'data-dropdown-item' but not 'data-dropdown-submenu-trigger'
    const items = root.querySelectorAll(
      "[data-dropdown-item]:not([data-dropdown-submenu-trigger])"
    );
    items.forEach((item) => {
      item.removeEventListener("click", handleDropdownItemClick);
      item.addEventListener("click", handleDropdownItemClick);
    });
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  document.addEventListener("DOMContentLoaded", () => initAllComponents());
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})(); // End of IIFE
