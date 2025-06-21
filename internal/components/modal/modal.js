(function () {
  // IIFE

  // Opens a modal dialog with animation
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.tagName === "DIALOG") {
      modal.showModal();
      // Remove any closing class and force reflow
      modal.classList.remove("modal-closing");
      modal.offsetHeight; // Force reflow
      // Add opening class for animation
      modal.classList.add("modal-opening");
    }
  }

  // Closes a modal dialog with animation
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.tagName === "DIALOG" && modal.open) {
      // Remove opening class and add closing class
      modal.classList.remove("modal-opening");
      modal.classList.add("modal-closing");

      // Close dialog after animation completes
      setTimeout(() => {
        modal.close();
        // Clean up classes
        modal.classList.remove("modal-closing");
      }, 300); // Match CSS transition duration
    }
  }

  // Handles clicks on modal trigger elements
  function handleTriggerClick(event) {
    const trigger = event.currentTarget;
    const modalId = trigger.dataset.modalTargetId;

    if (modalId) {
      openModal(modalId);
    } else {
      console.warn("Modal trigger is missing data-modal-target-id attribute");
    }
  }

  // Handles clicks on modal close buttons
  function handleCloseClick(event) {
    const closeButton = event.currentTarget;
    const modalId = closeButton.dataset.modalTargetId;

    if (modalId) {
      closeModal(modalId);
    } else {
      // If no specific modal ID, find the closest modal
      const modal = closeButton.closest("dialog[data-modal]");
      if (modal) {
        closeModal(modal.id);
      }
    }
  }

  // Handles clicks on dialog element for backdrop closing
  function handleDialogClick(event) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    // Check if click is outside dialog content (on backdrop)
    if (!isInDialog) {
      const disableClickAway = dialog.dataset.disableClickAway === "true";
      if (!disableClickAway) {
        closeModal(dialog.id);
      }
    }
  }

  // Handles keyboard events for modal interactions
  function handleKeyDown(event) {
    if (event.key === "Escape") {
      const openModals = document.querySelectorAll("dialog[data-modal][open]");
      if (openModals.length > 0) {
        const lastModal = openModals[openModals.length - 1];
        const disableESC = lastModal.dataset.disableEsc === "true";

        if (!disableESC) {
          event.preventDefault();
          closeModal(lastModal.id);
        }
      }
    }
  }

  // Initializes modal components within a given root element
  function initAllComponents(root = document) {
    // Initialize modal triggers
    const triggers = root.querySelectorAll("[data-modal-trigger]");
    triggers.forEach((trigger) => {
      trigger.removeEventListener("click", handleTriggerClick);
      trigger.addEventListener("click", handleTriggerClick);
    });

    // Initialize modal close buttons
    const closeButtons = root.querySelectorAll("[data-modal-close]");
    closeButtons.forEach((closeButton) => {
      closeButton.removeEventListener("click", handleCloseClick);
      closeButton.addEventListener("click", handleCloseClick);
    });

    // Initialize modals
    const modals = root.querySelectorAll("dialog[data-modal]");
    modals.forEach((modal) => {
      modal.removeEventListener("click", handleDialogClick);
      modal.addEventListener("click", handleDialogClick);
    });
  }

  // Handles HTMX content swapping to reinitialize components
  const handleHtmxSwap = (event) => {
    let target;
    if (event.type === "htmx:afterSwap") {
      target = event.detail.elt;
    }
    if (event.type === "htmx:oobAfterSwap") {
      target = event.detail.target;
    }
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  // Export functions for external use
  window.openModal = openModal;
  window.closeModal = closeModal;

  // Event listeners for component lifecycle
  document.addEventListener("DOMContentLoaded", () => initAllComponents());
  document.addEventListener("keydown", handleKeyDown);
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})(); // End of IIFE
