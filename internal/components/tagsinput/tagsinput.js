(function () {
  function initializeTagsInput(container) {
    if (!container || container.hasAttribute("data-initialized")) return;
    container.setAttribute("data-initialized", "true");
    
    // Use data attributes instead of CSS classes for JavaScript functionality
    const textInput = container.querySelector("[data-text-input]");
    const hiddenInputsContainer = container.querySelector(
      "[data-hidden-inputs]"
    );
    const tagsContainer = container.querySelector("[data-tags-container]");
    const name = container.dataset.name;
    const disabled = textInput ? textInput.hasAttribute("disabled") : false;

    if (!textInput) {
      return;
    }

    function createTagChip(tagValue, isDisabled) {
      const tagChip = document.createElement("div");
      tagChip.setAttribute("data-tag-chip", "");
      tagChip.className =
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground";

      // Create tag content
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tagValue;

      // Create remove button
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className =
        "ml-1 text-current hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
      removeButton.setAttribute("data-tag-remove", "");
      if (isDisabled) removeButton.disabled = true;

      // Create SVG icon
      removeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      `;

      // Assemble the tag chip
      tagChip.appendChild(tagSpan);
      tagChip.appendChild(removeButton);

      return tagChip;
    }

    function addTag(value) {
      if (disabled) return;
      const tagValue = value.trim();
      if (!tagValue) return;

      const existingTags = hiddenInputsContainer.querySelectorAll(
        'input[type="hidden"]'
      );
      for (const t of existingTags) {
        if (t.value.toLowerCase() === tagValue.toLowerCase()) {
          textInput.value = "";
          return;
        }
      }

      const tagChip = createTagChip(tagValue, disabled);

      const hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.name = name;
      hiddenInput.value = tagValue;

      tagsContainer.appendChild(tagChip);
      hiddenInputsContainer.appendChild(hiddenInput);

      textInput.value = "";
    }

    function removeTag(removeButton) {
      if (disabled) return;
      const tagChip = removeButton.closest("[data-tag-chip]");
      if (!tagChip) return;

      const tagValue = tagChip.querySelector("span").textContent.trim();

      const hiddenInput = hiddenInputsContainer.querySelector(
        `input[type="hidden"][value="${tagValue}"]`
      );
      if (hiddenInput) {
        hiddenInput.remove();
      }

      tagChip.remove();
    }

    function handleKeyDown(event) {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        addTag(textInput.value);
      } else if (event.key === "Backspace" && textInput.value === "") {
        event.preventDefault();

        const lastChip = tagsContainer.querySelector(
          "[data-tag-chip]:last-child"
        );
        if (lastChip) {
          const removeButton = lastChip.querySelector("[data-tag-remove]");
          if (removeButton) {
            removeTag(removeButton);
          }
        }
      }
    }

    function handleClick(event) {
      if (event.target.closest("[data-tag-remove]")) {
        event.preventDefault();
        event.stopPropagation();
        removeTag(event.target.closest("[data-tag-remove]"));
      } else if (!event.target.closest("input")) {
        // Focus the input when clicking anywhere in the container except on input itself
        textInput.focus();
      }
    }

    // --- Event Listeners ---
    textInput.removeEventListener("keydown", handleKeyDown);
    textInput.addEventListener("keydown", handleKeyDown);
    container.removeEventListener("click", handleClick);
    container.addEventListener("click", handleClick);

    // Form reset support
    const form = container.closest('form');
    if (form) {
      form.addEventListener('reset', () => {
        // Remove all tag chips
        tagsContainer.querySelectorAll('[data-tag-chip]').forEach(chip => chip.remove());
        // Remove all hidden inputs
        hiddenInputsContainer.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());
        // Clear text input
        textInput.value = '';
      });
    }
  }

  function init(root = document) {
    const allTagsInputs = root.querySelectorAll("[data-tags-input]:not([data-initialized])");
    allTagsInputs.forEach(initializeTagsInput);
  }

  window.templUI = window.templUI || {};
  window.templUI.tagsInput = { init: init };

  document.addEventListener("DOMContentLoaded", () => init());
})();
