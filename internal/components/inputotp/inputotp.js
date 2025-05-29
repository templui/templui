if (typeof window.inputOTPState === "undefined") {
  window.inputOTPState = new WeakMap();
}

(function () {
  // Prevent re-running the whole setup if already done
  if (window.inputOTPSystemInitialized) return;

  // --- Core Component Logic ---
  function initInputOTP(container) {
    // Prevent re-initialization if state already exists for this container
    if (window.inputOTPState.has(container)) return;

    // Basic elements
    const hiddenInput = container.querySelector(
      "[data-input-otp-value-target]"
    );
    const slots = Array.from(
      container.querySelectorAll("[data-input-otp-slot]")
    ).sort(
      (a, b) => parseInt(a.dataset.inputIndex) - parseInt(b.dataset.inputIndex)
    );

    if (!hiddenInput || slots.length === 0) return;

    // Check for autofocus attribute and focus the first slot
    if (container.hasAttribute("autofocus")) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const firstSlot = slots[0];
        if (firstSlot) {
          firstSlot.focus();
          firstSlot.select();
        }
      });
    }

    // Core functionality helpers bound to this instance
    const updateHiddenValue = () => {
      hiddenInput.value = slots.map((slot) => slot.value).join("");
    };

    const findFirstEmptySlotIndex = () =>
      slots.findIndex((slot) => !slot.value);

    const focusSlot = (index) => {
      if (index >= 0 && index < slots.length) {
        slots[index].focus();
        // Use setTimeout to ensure select happens after focus
        setTimeout(() => slots[index].select(), 0);
      }
    };

    // Event Handlers specific to this instance
    const handleInput = (e) => {
      const input = e.target;
      const index = parseInt(input.dataset.inputIndex);
      if (input.value === " ") {
        input.value = "";
        return;
      }
      if (input.value.length > 1) input.value = input.value.slice(-1);
      if (input.value && index < slots.length - 1) focusSlot(index + 1);
      updateHiddenValue();
    };

    const handleKeydown = (e) => {
      const input = e.target;
      const index = parseInt(input.dataset.inputIndex);
      if (e.key === "Backspace") {
        const currentValue = input.value;
        if (index > 0) {
          e.preventDefault();
          if (currentValue) {
            input.value = "";
            updateHiddenValue();
            focusSlot(index - 1);
          } else {
            slots[index - 1].value = "";
            updateHiddenValue();
            focusSlot(index - 1);
          }
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusSlot(index - 1);
      } else if (e.key === "ArrowRight" && index < slots.length - 1) {
        e.preventDefault();
        focusSlot(index + 1);
      }
    };

    const handleFocus = (e) => {
      const input = e.target;
      const index = parseInt(input.dataset.inputIndex);
      const firstEmptyIndex = findFirstEmptySlotIndex();
      if (firstEmptyIndex !== -1 && index !== firstEmptyIndex) {
        focusSlot(firstEmptyIndex);
        return; // Prevent default focus/select on original target
      }
      // Use setTimeout to ensure select() happens after potential focus redirection
      setTimeout(() => input.select(), 0);
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData(
        "text"
      );
      const pastedChars = pastedData.replace(/\s/g, "").split("");
      let currentSlotIndex = 0; // Start pasting from the first slot
      // Try to find focused slot to start paste from, fallback to 0
      const focusedSlot = slots.find((slot) => slot === document.activeElement);
      if (focusedSlot)
        currentSlotIndex = parseInt(focusedSlot.dataset.inputIndex);

      for (
        let i = 0;
        i < pastedChars.length && currentSlotIndex < slots.length;
        i++
      ) {
        slots[currentSlotIndex].value = pastedChars[i];
        currentSlotIndex++;
      }
      updateHiddenValue();
      // Focus after paste: either next available slot or last filled slot
      let focusIndex = findFirstEmptySlotIndex();
      if (focusIndex === -1) focusIndex = slots.length - 1;
      else if (focusIndex > 0 && focusIndex > currentSlotIndex)
        focusIndex = currentSlotIndex; // Focus next slot after pasted content

      focusSlot(Math.min(focusIndex, slots.length - 1));
    };

    // Add event listeners to slots
    for (const slot of slots) {
      slot.addEventListener("input", handleInput);
      slot.addEventListener("keydown", handleKeydown);
      slot.addEventListener("focus", handleFocus);
    }
    // Add paste listener to the container
    container.addEventListener("paste", handlePaste);

    // Handle label clicks to focus first slot
    const targetId = hiddenInput.id;
    if (targetId) {
      for (const label of document.querySelectorAll(
        `label[for="${targetId}"]`
      )) {
        // Check if listener already attached to avoid duplicates
        if (!label.dataset.inputOtpListener) {
          const labelClickListener = (e) => {
            e.preventDefault();
            if (slots.length > 0) focusSlot(0);
          };
          label.addEventListener("click", labelClickListener);
          label.dataset.inputOtpListener = "true"; // Mark as having listener
          // Store handler for potential cleanup
          label._inputOtpClickListener = labelClickListener;
        }
      }
    }

    // Initial value handling
    if (container.dataset.value) {
      const initialValue = container.dataset.value;
      for (let i = 0; i < slots.length && i < initialValue.length; i++) {
        slots[i].value = initialValue[i];
      }
      updateHiddenValue();
    }

    // Store state and handlers for potential cleanup
    const state = {
      slots,
      hiddenInput,
      handleInput,
      handleKeydown,
      handleFocus,
      handlePaste,
    };
    window.inputOTPState.set(container, state);
  }

  // --- Cleanup ---
  function cleanupInputOTP(container) {
    const state = window.inputOTPState.get(container);
    if (!state) return;

    // Remove slot listeners
    for (const slot of state.slots) {
      slot.removeEventListener("input", state.handleInput);
      slot.removeEventListener("keydown", state.handleKeydown);
      slot.removeEventListener("focus", state.handleFocus);
    }
    // Remove container paste listener
    container.removeEventListener("paste", state.handlePaste);

    // Remove label listeners
    const targetId = state.hiddenInput.id;
    if (targetId) {
      for (const label of document.querySelectorAll(
        `label[for="${targetId}"]`
      )) {
        if (label._inputOtpClickListener) {
          label.removeEventListener("click", label._inputOtpClickListener);
          delete label._inputOtpClickListener;
          delete label.dataset.inputOtpListener;
        }
      }
    }

    window.inputOTPState.delete(container);
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches("[data-input-otp]")) {
      initInputOTP(root);
    }
    const containers = root.querySelectorAll("[data-input-otp]");
    containers.forEach(initInputOTP);
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  document.addEventListener("DOMContentLoaded", () => initAllComponents());

  document.body.addEventListener("htmx:beforeSwap", (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      // Cleanup target itself if it's an OTP container
      if (target.matches && target.matches("[data-input-otp]")) {
        cleanupInputOTP(target);
      }
      // Cleanup descendants
      if (target.querySelectorAll) {
        for (const container of target.querySelectorAll("[data-input-otp]")) {
          cleanupInputOTP(container);
        }
      }
    }
  });

  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);

  window.inputOTPSystemInitialized = true;
})(); // End of IIFE
