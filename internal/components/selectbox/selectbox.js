(function () {
  let isSelecting = false;

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

    const contentID = triggerButton.getAttribute("data-tui-selectbox-content-id");
    const isMultiple = triggerButton.getAttribute("data-tui-selectbox-multiple") === "true";
    const showPills = triggerButton.getAttribute("data-tui-selectbox-show-pills") === "true";
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

    // Add keyboard event handler for trigger button
    triggerButton.addEventListener("keydown", (event) => {
      if (
        event.key.length === 1 ||
        event.key === "Backspace" ||
        event.key === "Delete"
      ) {
        event.preventDefault();
        document.getElementById(contentID).click();
        setTimeout(() => {
          const searchInput = document.querySelector("[data-tui-selectbox-search]");
          if (searchInput) {
            searchInput.focus();
            if (event.key !== "Backspace" && event.key !== "Delete") {
              searchInput.value = event.key;
            }
          }
        }, 0);
      }
    });

    // Remove existing event listeners
    const newContent = content.cloneNode(true);
    content.parentNode.replaceChild(newContent, content);

    // Search functionality
    const searchInput = newContent.querySelector("[data-tui-selectbox-search]");
    if (searchInput) {
      // Focus search input when popover opens
      const checkVisibility = () => {
        const style = window.getComputedStyle(newContent);
        if (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        ) {
          searchInput.focus();
        }
      };

      // Focus when opened by click
      document.addEventListener("click", (e) => {
        if (triggerButton.contains(e.target)) {
          setTimeout(checkVisibility, 50);
        }
      });

      // Focus when opened by Enter key
      triggerButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          setTimeout(checkVisibility, 50);
        }
      });

      searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const items = newContent.querySelectorAll(".select-item");

        items.forEach((item) => {
          const itemText =
            item
              .querySelector(".select-item-text")
              ?.textContent.toLowerCase() || "";
          const itemValue =
            item.getAttribute("data-tui-selectbox-value")?.toLowerCase() || "";
          const isVisible =
            searchTerm === "" ||
            itemText.includes(searchTerm) ||
            itemValue.includes(searchTerm);

          item.style.display = isVisible ? "" : "none";
        });
      });
    }

    // Keyboard navigation event listener
    newContent.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const visibleItems = Array.from(
          newContent.querySelectorAll(".select-item")
        ).filter((item) => item.style.display !== "none");

        if (visibleItems.length === 0) return;

        const currentFocused = newContent.querySelector(".select-item:focus");
        let nextIndex = 0;

        if (currentFocused) {
          const currentIndex = visibleItems.indexOf(currentFocused);
          if (e.key === "ArrowDown") {
            nextIndex = (currentIndex + 1) % visibleItems.length;
          } else {
            nextIndex =
              (currentIndex - 1 + visibleItems.length) % visibleItems.length;
          }
        }

        visibleItems[nextIndex].focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const focusedItem = newContent.querySelector(".select-item:focus");
        if (focusedItem) {
          selectItem(focusedItem);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        const focusedItem = newContent.querySelector(".select-item:focus");
        if (focusedItem) {
          // If focus is on an item, move to search input
          searchInput.focus();
        } else if (document.activeElement === searchInput) {
          // If focus is on search input, close popover and return to trigger
          if (window.closePopover) {
            window.closePopover(contentID, true);
            setTimeout(() => {
              triggerButton.focus();
            }, 50);
          }
        }
      }
    });

    // Initialize display value if an item is pre-selected
    const selectedItems = newContent.querySelectorAll(
      '.select-item[data-tui-selectbox-selected="true"]'
    );
    if (selectedItems.length > 0) {
      if (isMultiple) {
        if (showPills) {
          valueEl.innerHTML = "";
          const pillsContainer = document.createElement("div");
          pillsContainer.className =
            "flex flex-nowrap overflow-hidden max-w-full whitespace-nowrap gap-1";
          Array.from(selectedItems).forEach((selectedItem) => {
            const pill = document.createElement("div");
            pill.className =
              "flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground";
            const pillText = document.createElement("span");
            pillText.textContent =
              selectedItem.querySelector(".select-item-text").textContent;
            const closeButton = document.createElement("button");
            closeButton.className = "hover:text-destructive focus:outline-none";
            closeButton.innerHTML = "x";
            closeButton.onclick = (e) => {
              e.stopPropagation();
              selectItem(selectedItem);
            };
            pill.appendChild(pillText);
            pill.appendChild(closeButton);
            pillsContainer.appendChild(pill);
          });
          valueEl.appendChild(pillsContainer);
          valueEl.classList.remove("text-muted-foreground");

          // Pills overflow control
          setTimeout(() => {
            const pillsWidth = pillsContainer.scrollWidth;
            const valueWidth = valueEl.clientWidth;
            if (pillsWidth > valueWidth) {
              const selectedCountText =
                triggerButton.getAttribute("data-tui-selectbox-selected-count-text") ||
                `${selectedItems.length} items selected`;
              const msg = selectedCountText.replace(
                "{n}",
                selectedItems.length
              );
              valueEl.innerHTML = msg;
              valueEl.classList.remove("text-muted-foreground");
            }
          }, 0);
        } else {
          valueEl.textContent = `${selectedItems.length} items selected`;
          valueEl.classList.remove("text-muted-foreground");
        }
        // Store selected values as CSV
        const selectedValues = Array.from(selectedItems).map((item) =>
          item.getAttribute("data-tui-selectbox-value")
        );
        hiddenInput.value = selectedValues.join(",");
      } else {
        // For single selection, show the selected item's text
        const selectedItem = selectedItems[0];
        const itemText = selectedItem.querySelector(".select-item-text");
        if (itemText) {
          valueEl.textContent = itemText.textContent;
          valueEl.classList.remove("text-muted-foreground");
        }
        if (hiddenInput) {
          const value = selectedItem.getAttribute("data-value") || "";
          // Only set initial value if not already set
          if (!hiddenInput.hasAttribute("data-initialized")) {
            hiddenInput.value = value;
            hiddenInput.setAttribute("data-initialized", "true");
            hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    }

    // Reset visual state of items
    function resetItemStyles() {
      newContent.querySelectorAll(".select-item").forEach((item) => {
        if (item.getAttribute("data-tui-selectbox-selected") === "true") {
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
      if (!item || item.getAttribute("data-tui-selectbox-disabled") === "true" || isSelecting)
        return;

      isSelecting = true;

      const value = item.getAttribute("data-tui-selectbox-value");
      const itemText = item.querySelector(".select-item-text");

      if (isMultiple) {
        // Toggle selection for multiple mode
        const isSelected = item.getAttribute("data-tui-selectbox-selected") === "true";
        item.setAttribute("data-tui-selectbox-selected", (!isSelected).toString());

        if (!isSelected) {
          item.classList.add("bg-accent", "text-accent-foreground");
          const check = item.querySelector(".select-check");
          if (check) check.classList.replace("opacity-0", "opacity-100");
        } else {
          item.classList.remove("bg-accent", "text-accent-foreground");
          const check = item.querySelector(".select-check");
          if (check) check.classList.replace("opacity-100", "opacity-0");
        }

        // Update display value
        const selectedItems = newContent.querySelectorAll(
          '.select-item[data-tui-selectbox-selected="true"]'
        );
        if (selectedItems.length > 0) {
          if (showPills) {
            // Clear existing content
            valueEl.innerHTML = "";

            // Create pills container
            const pillsContainer = document.createElement("div");
            pillsContainer.className =
              "flex flex-nowrap overflow-hidden max-w-full whitespace-nowrap gap-1";

            // Add pills for each selected item
            Array.from(selectedItems).forEach((selectedItem) => {
              const pill = document.createElement("div");
              pill.className =
                "flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground";

              const pillText = document.createElement("span");
              pillText.textContent =
                selectedItem.querySelector(".select-item-text").textContent;

              const closeButton = document.createElement("button");
              closeButton.className =
                "hover:text-destructive focus:outline-none";
              closeButton.innerHTML = "×";
              closeButton.onclick = (e) => {
                e.stopPropagation();
                selectItem(selectedItem);
              };

              pill.appendChild(pillText);
              pill.appendChild(closeButton);
              pillsContainer.appendChild(pill);
            });

            valueEl.appendChild(pillsContainer);
            valueEl.classList.remove("text-muted-foreground");

            // Pills overflow kontrolü
            setTimeout(() => {
              const pillsWidth = pillsContainer.scrollWidth;
              const valueWidth = valueEl.clientWidth;
              if (pillsWidth > valueWidth) {
                const selectedCountText =
                  triggerButton.getAttribute("data-tui-selectbox-selected-count-text") ||
                  `${selectedItems.length} items selected`;
                const msg = selectedCountText.replace(
                  "{n}",
                  selectedItems.length
                );
                valueEl.innerHTML = msg;
                valueEl.classList.remove("text-muted-foreground");
              }
            }, 0);
          } else {
            valueEl.textContent = `${selectedItems.length} items selected`;
            valueEl.classList.remove("text-muted-foreground");
          }
        } else {
          valueEl.textContent = valueEl.getAttribute("data-tui-selectbox-placeholder") || "";
          valueEl.classList.add("text-muted-foreground");
        }

        // Update hidden input with CSV of selected values
        const selectedValues = Array.from(selectedItems).map((item) =>
          item.getAttribute("data-tui-selectbox-value")
        );
        hiddenInput.value = selectedValues.join(",");
        hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // Single selection mode
        // Reset all items in this content
        newContent.querySelectorAll(".select-item").forEach((el) => {
          el.setAttribute("data-tui-selectbox-selected", "false");
          el.classList.remove(
            "bg-accent",
            "text-accent-foreground",
            "bg-muted"
          );
          const check = el.querySelector(".select-check");
          if (check) check.classList.replace("opacity-100", "opacity-0");
        });

        // Mark new selection
        item.setAttribute("data-tui-selectbox-selected", "true");
        item.classList.add("bg-accent", "text-accent-foreground");
        const check = item.querySelector(".select-check");
        if (check) check.classList.replace("opacity-0", "opacity-100");

        // Update display value
        if (valueEl && itemText) {
          valueEl.textContent = itemText.textContent;
          valueEl.classList.remove("text-muted-foreground");
        }

        // Update hidden input & trigger change event
        if (hiddenInput && value !== null) {
          const oldValue = hiddenInput.value;
          hiddenInput.value = value;

          // Only trigger change if value actually changed
          if (oldValue !== value) {
            hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }

        // Close the popover using the correct contentID
        if (window.closePopover) {
          window.closePopover(contentID, true);
          // Return focus to trigger
          setTimeout(() => {
            triggerButton.focus();
          }, 50);
        } else {
          console.warn("closePopover function not found");
        }
      }

      setTimeout(() => {
        isSelecting = false;
      }, 100);
    }

    // Event Listeners for Items (delegated from content for robustness)
    newContent.addEventListener("click", (e) => {
      const item = e.target.closest(".select-item");
      if (item) selectItem(item);
    });

    newContent.addEventListener("keydown", (e) => {
      const item = e.target.closest(".select-item");
      if (item && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        selectItem(item);
      }
    });

    // Event: Mouse hover on items (delegated)
    newContent.addEventListener("mouseover", (e) => {
      const item = e.target.closest(".select-item");
      if (!item || item.getAttribute("data-tui-selectbox-disabled") === "true") return;
      // Reset all others first
      newContent.querySelectorAll(".select-item").forEach((el) => {
        el.classList.remove("bg-accent", "text-accent-foreground", "bg-muted");
      });
      // Apply hover style only if not selected
      if (item.getAttribute("data-tui-selectbox-selected") !== "true") {
        item.classList.add("bg-accent", "text-accent-foreground");
      }
    });

    // Reset hover styles when mouse leaves the content area
    newContent.addEventListener("mouseleave", resetItemStyles);
  }

  function init(root = document) {
    const containers = root.querySelectorAll(".select-container");
    containers.forEach(initSelect);
  }

  window.templUI = window.templUI || {};
  window.templUI.selectbox = { init: init };

  document.addEventListener("DOMContentLoaded", () => init());
})();
