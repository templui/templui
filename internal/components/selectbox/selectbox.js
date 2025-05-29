(function () {
  // IIFE
  function initSelect(wrapper) {
    if (!wrapper || wrapper.hasAttribute("data-initialized")) return;
    wrapper.setAttribute("data-initialized", "true");

    const triggerButton = wrapper.querySelector("button.select-trigger");
    if (!triggerButton) {
      console.error(
        "Select box: Trigger button (.select-trigger) not found in wrapper",
        wrapper
      );
      return;
    }

    const contentID = triggerButton.dataset.contentId;
    const content = contentID ? document.getElementById(contentID) : null;
    const valueEl = triggerButton.querySelector(".select-value");
    const hiddenInput = triggerButton.querySelector('input[type="hidden"]');

    if (!content || !valueEl || !hiddenInput) {
      console.error(
        "Select box: Missing required elements for initialization.",
        {
          wrapper,
          contentID,
          contentExists: !!content,
          valueElExists: !!valueEl,
          hiddenInputExists: !!hiddenInput,
        }
      );
      return;
    }

    // Initialize display value if an item is pre-selected
    const selectedItem = content.querySelector(
      '.select-item[data-selected="true"]'
    );
    if (selectedItem) {
      const itemText = selectedItem.querySelector(".select-item-text");
      if (itemText) {
        valueEl.textContent = itemText.textContent;
        valueEl.classList.remove("text-muted-foreground");
      }
      if (hiddenInput) {
        hiddenInput.value = selectedItem.getAttribute("data-value") || "";
      }
    }

    // Reset visual state of items
    function resetItemStyles() {
      content.querySelectorAll(".select-item").forEach((item) => {
        if (item.getAttribute("data-selected") === "true") {
          item.classList.add("bg-accent", "text-accent-foreground");
          item.classList.remove("bg-muted");
        } else {
          item.classList.remove(
            "bg-accent",
            "text-accent-foreground",
            "bg-muted"
          );
        }
      });
    }

    // Select an item
    function selectItem(item) {
      if (!item || item.getAttribute("data-disabled") === "true") return;

      const value = item.getAttribute("data-value");
      const itemText = item.querySelector(".select-item-text");

      // Reset all items in this content
      content.querySelectorAll(".select-item").forEach((el) => {
        el.setAttribute("data-selected", "false");
        el.classList.remove("bg-accent", "text-accent-foreground", "bg-muted");
        const check = el.querySelector(".select-check");
        if (check) check.classList.replace("opacity-100", "opacity-0");
      });

      // Mark new selection
      item.setAttribute("data-selected", "true");
      item.classList.add("bg-accent", "text-accent-foreground");
      const check = item.querySelector(".select-check");
      if (check) check.classList.replace("opacity-0", "opacity-100");

      // Update display value
      if (valueEl && itemText) {
        // Check if valueEl exists
        valueEl.textContent = itemText.textContent;
        valueEl.classList.remove("text-muted-foreground");
      }

      // Update hidden input & trigger change event
      if (hiddenInput && value !== null) {
        // Check if hiddenInput exists
        hiddenInput.value = value;
        hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // Close the popover using the correct contentID
      if (window.closePopover) {
        window.closePopover(contentID, true);
      } else {
        console.warn("closePopover function not found");
      }
    }

    // Event Listeners for Items (delegated from content for robustness)
    content.addEventListener("click", (e) => {
      const item = e.target.closest(".select-item");
      if (item) selectItem(item);
    });
    content.addEventListener("keydown", (e) => {
      const item = e.target.closest(".select-item");
      if (item && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        selectItem(item);
      }
      // Add other keyboard navigation (Up/Down/Home/End) if desired
    });

    // Event: Mouse hover on items (delegated)
    content.addEventListener("mouseover", (e) => {
      const item = e.target.closest(".select-item");
      if (!item || item.getAttribute("data-disabled") === "true") return;
      // Reset all others first
      content.querySelectorAll(".select-item").forEach((el) => {
        el.classList.remove("bg-accent", "text-accent-foreground", "bg-muted");
      });
      // Apply hover style only if not selected
      if (item.getAttribute("data-selected") !== "true") {
        item.classList.add("bg-accent", "text-accent-foreground");
      }
    });

    // Reset hover styles when mouse leaves the content area
    content.addEventListener("mouseleave", resetItemStyles);
  }

  function initAllComponents(root = document) {
    const containers = root.querySelectorAll(
      ".select-container:not([data-initialized])"
    );
    if (
      root instanceof Element &&
      root.matches(".select-container") &&
      !root.hasAttribute("data-initialized")
    ) {
      initSelect(root);
    } else {
      containers.forEach(initSelect);
    }
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
