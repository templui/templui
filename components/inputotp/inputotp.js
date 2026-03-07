(function () {
  'use strict';
  
  // Utility functions
  function getSlots(container) {
    return Array.from(container.querySelectorAll('[data-tui-inputotp-slot]')).sort(
      (a, b) => parseInt(a.getAttribute('data-tui-inputotp-index')) - parseInt(b.getAttribute('data-tui-inputotp-index'))
    );
  }
  
  function focusSlot(slot) {
    if (!slot) return;
    slot.focus();
    setTimeout(() => slot.select(), 0);
  }
  
  function updateHiddenValue(container) {
    const hiddenInput = container.querySelector('[data-tui-inputotp-value-target]');
    const slots = getSlots(container);
    if (hiddenInput && slots.length) {
      hiddenInput.value = slots.map(s => s.value).join('');
    }
  }
  
  function findFirstEmptySlot(container) {
    const slots = getSlots(container);
    for (const slot of slots) {
      if (!slot.value) return slot;
    }
    return null;
  }
  
  function getNextSlot(container, currentSlot) {
    const slots = getSlots(container);
    const index = slots.indexOf(currentSlot);
    return index >= 0 && index < slots.length - 1 ? slots[index + 1] : null;
  }
  
  function getPrevSlot(container, currentSlot) {
    const slots = getSlots(container);
    const index = slots.indexOf(currentSlot);
    return index > 0 ? slots[index - 1] : null;
  }
  
  // Event handlers
  document.addEventListener('input', (e) => {
    if (!e.target.matches('[data-tui-inputotp-slot]')) return;
    
    const slot = e.target;
    const container = slot.closest('[data-tui-inputotp]');
    if (!container) return;
    
    // Handle space as empty
    if (slot.value === ' ') {
      slot.value = '';
      return;
    }
    
    // Keep only last character
    if (slot.value.length > 1) {
      slot.value = slot.value.slice(-1);
    }
    
    // Move to next slot if filled
    if (slot.value) {
      const nextSlot = getNextSlot(container, slot);
      if (nextSlot) focusSlot(nextSlot);
    }
    
    updateHiddenValue(container);
  });
  
  document.addEventListener('keydown', (e) => {
    if (!e.target.matches('[data-tui-inputotp-slot]')) return;
    
    const slot = e.target;
    const container = slot.closest('[data-tui-inputotp]');
    if (!container) return;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (slot.value) {
        slot.value = '';
        updateHiddenValue(container);
      } else {
        const prevSlot = getPrevSlot(container, slot);
        if (prevSlot) {
          prevSlot.value = '';
          updateHiddenValue(container);
          focusSlot(prevSlot);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevSlot = getPrevSlot(container, slot);
      if (prevSlot) focusSlot(prevSlot);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextSlot = getNextSlot(container, slot);
      if (nextSlot) focusSlot(nextSlot);
    }
  });
  
  document.addEventListener('focus', (e) => {
    if (!e.target.matches('[data-tui-inputotp-slot]')) return;
    
    const slot = e.target;
    const container = slot.closest('[data-tui-inputotp]');
    if (!container) return;
    
    // Redirect to first empty slot
    const firstEmpty = findFirstEmptySlot(container);
    if (firstEmpty && firstEmpty !== slot) {
      focusSlot(firstEmpty);
      return;
    }
    
    setTimeout(() => slot.select(), 0);
  }, true);
  
  document.addEventListener('paste', (e) => {
    const slot = e.target.closest('[data-tui-inputotp-slot]');
    if (!slot) return;
    
    e.preventDefault();
    const container = slot.closest('[data-tui-inputotp]');
    if (!container) return;
    
    const pastedData = (e.clipboardData || window.clipboardData).getData('text');
    const chars = pastedData.replace(/\s/g, '').split('');
    const slots = getSlots(container);
    
    let startIndex = slots.indexOf(slot);
    for (let i = 0; i < chars.length && startIndex + i < slots.length; i++) {
      slots[startIndex + i].value = chars[i];
    }
    
    updateHiddenValue(container);
    
    // Focus next empty or last filled slot
    const nextEmpty = findFirstEmptySlot(container);
    focusSlot(nextEmpty || slots[Math.min(startIndex + chars.length, slots.length - 1)]);
  });
  
  // Label click handling
  document.addEventListener('click', (e) => {
    if (!e.target.matches('label[for]')) return;
    
    const targetId = e.target.getAttribute('for');
    const hiddenInput = document.getElementById(targetId);
    if (!hiddenInput?.matches('[data-tui-inputotp-value-target]')) return;
    
    e.preventDefault();
    const container = hiddenInput.closest('[data-tui-inputotp]');
    const slots = getSlots(container);
    if (slots.length > 0) focusSlot(slots[0]);
  });
  
  // Form reset
  document.addEventListener('reset', (e) => {
    if (!e.target.matches('form')) return;
    
    e.target.querySelectorAll('[data-tui-inputotp]').forEach(container => {
      getSlots(container).forEach(slot => {
        slot.value = '';
      });
      updateHiddenValue(container);
    });
  });
  
  // MutationObserver for initial setup and autofocus
  new MutationObserver(() => {
    document.querySelectorAll('[data-tui-inputotp]').forEach(container => {
      const slots = getSlots(container);
      if (slots.length === 0) return;
      
      // Set initial value if provided
      const initialValue = container.getAttribute('data-tui-inputotp-value');
      if (initialValue && !slots[0].value) {
        for (let i = 0; i < slots.length && i < initialValue.length; i++) {
          if (!slots[i].value) slots[i].value = initialValue[i];
        }
        updateHiddenValue(container);
      }
      
      // Handle autofocus
      if (container.hasAttribute('autofocus') && !slots.some(s => s === document.activeElement)) {
        requestAnimationFrame(() => {
          if (slots[0] && !slots.some(s => s === document.activeElement)) {
            focusSlot(slots[0]);
          }
        });
      }
    });
  }).observe(document.body, { childList: true, subtree: true });
})();