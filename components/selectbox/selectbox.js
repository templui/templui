(function () {
  'use strict';

  /**
   * Reactive Binding for hidden inputs
   *
   * Problem: Setting input.value programmatically (e.g., via Datastar/Alpine)
   * does NOT fire 'input' events - this is standard browser behavior since the 90s.
   *
   * Solution: Override the value setter to dispatch 'input' events on change.
   * This is the same pattern used by Vue.js, MobX, and other reactive frameworks.
   */
  function enableReactiveBinding(input) {
    if (input._tui) return;
    input._tui = true;

    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!desc?.set) return;

    Object.defineProperty(input, 'value', {
      get: desc.get,
      set(v) {
        const old = this.value;
        desc.set.call(this, v);
        if (old !== v) {
          this.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      configurable: true
    });
  }

  function updateTriggerClearState(trigger) {
    const clearTrigger = trigger.querySelector('[data-tui-selectbox-clear-trigger]');
    if (!clearTrigger) return;

    const chevron = trigger.querySelector('[data-tui-selectbox-chevron]');
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    const hasSelection = !!hiddenInput?.value && !trigger.disabled;

    clearTrigger.classList.toggle('hidden', !hasSelection);
    if (chevron) chevron.classList.toggle('hidden', hasSelection);
  }

  function clearFromTrigger(trigger) {
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    if (!hiddenInput || !hiddenInput.value) return;

    hiddenInput.value = '';
    hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function getContainer(element) {
    return element?.closest('.select-container') || null;
  }

  function getTriggerFromContainer(container) {
    return container?.querySelector('button.select-trigger') || null;
  }

  function getContentFromContainer(container) {
    return container?.querySelector('[data-tui-selectbox-content]') || null;
  }

  function getContentFromTrigger(trigger) {
    return getContentFromContainer(getContainer(trigger));
  }

  function syncContentWidth(trigger) {
    const content = getContentFromTrigger(trigger);
    if (!content) return;

    const width = trigger.getBoundingClientRect().width;
    content.style.width = `${width}px`;
    content.style.minWidth = `${width}px`;
  }

  function closePopover(trigger) {
    const content = getContentFromTrigger(trigger);
    if (!content?.matches(':popover-open')) return;

    try {
      content.hidePopover();
    } catch {
      // ignore
    }
  }

  // Helper to sync selections from hidden input value
  function syncSelectionsFromValue(trigger) {
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    const content = getContentFromTrigger(trigger);
    
    if (!hiddenInput || !content) return;
    
    const isMultiple = trigger.getAttribute('data-tui-selectbox-multiple') === 'true';
    const values = hiddenInput.value ? (isMultiple ? hiddenInput.value.split(',') : [hiddenInput.value]) : [];
    
    content.querySelectorAll('.select-item').forEach(item => {
      const itemValue = item.getAttribute('data-tui-selectbox-value') || '';
      const shouldBeSelected = values.includes(itemValue);
      const isSelected = item.getAttribute('data-tui-selectbox-selected') === 'true';
      
      if (shouldBeSelected !== isSelected) {
        item.setAttribute('data-tui-selectbox-selected', shouldBeSelected.toString());
      }
    });
  }
  
  // Helper to update display value
  function updateDisplayValue(trigger) {
    const valueEl = trigger.querySelector('.select-value');
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    const content = getContentFromTrigger(trigger);

    if (!valueEl) {
      updateTriggerClearState(trigger);
      return;
    }
    
    // If no content yet (not opened), try to init from hidden input value
    if (!content && hiddenInput && hiddenInput.value) {
      valueEl.textContent = hiddenInput.value; // Simple fallback
      valueEl.classList.remove('text-muted-foreground');
      updateTriggerClearState(trigger);
      return;
    }
    
    if (!content) {
      updateTriggerClearState(trigger);
      return;
    }
    
    const isMultiple = trigger.getAttribute('data-tui-selectbox-multiple') === 'true';
    const showPills = trigger.getAttribute('data-tui-selectbox-show-pills') === 'true';
    const placeholder = valueEl.getAttribute('data-tui-selectbox-placeholder') || 'Select...';
    
    const selectedItems = content.querySelectorAll('.select-item[data-tui-selectbox-selected="true"]');
    
    if (selectedItems.length === 0) {
      valueEl.textContent = placeholder;
      valueEl.classList.add('text-muted-foreground');
      if (hiddenInput) hiddenInput.value = '';
      updateTriggerClearState(trigger);
      return;
    }
    
    valueEl.classList.remove('text-muted-foreground');
    
    if (isMultiple) {
      if (showPills) {
        // Create pills container
        valueEl.innerHTML = '';
        const pillsContainer = document.createElement('div');
        pillsContainer.className = 'flex flex-wrap gap-1 items-center min-h-[1.5rem]';
        
        const pills = [];
        
        Array.from(selectedItems).forEach(selectedItem => {
          const pill = document.createElement('span');
          pill.className = 'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-primary text-primary-foreground';
          
          const text = document.createElement('span');
          text.textContent = selectedItem.querySelector('.select-item-text')?.textContent || '';
          pill.appendChild(text);
          
          // Add remove button for pills
          const removeBtn = document.createElement('button');
          removeBtn.className = 'ml-0.5 hover:text-destructive focus:outline-none';
          removeBtn.type = 'button';
          removeBtn.innerHTML = '×';
          removeBtn.setAttribute('data-tui-selectbox-pill-remove', '');
          removeBtn.setAttribute('data-tui-selectbox-value', selectedItem.getAttribute('data-tui-selectbox-value'));
          pill.appendChild(removeBtn);
          
          pills.push(pill);
        });
        
        // Try adding pills and check overflow
        pills.forEach(pill => pillsContainer.appendChild(pill));
        valueEl.appendChild(pillsContainer);
        
        // Check overflow after render
        requestAnimationFrame(() => {
          const containerWidth = valueEl.offsetWidth;
          const contentWidth = pillsContainer.scrollWidth;
          
          // If pills overflow and we have more than 3 items, switch to count
          if (contentWidth > containerWidth - 10 && selectedItems.length > 3) {
            const countText = trigger.getAttribute('data-tui-selectbox-selected-count-text') || '{n} items selected';
            valueEl.textContent = countText.replace('{n}', selectedItems.length);
          }
        });
      } else {
        const countText = trigger.getAttribute('data-tui-selectbox-selected-count-text') || '{n} items selected';
        valueEl.textContent = countText.replace('{n}', selectedItems.length);
      }
      
      // Update hidden input with CSV
      const values = Array.from(selectedItems).map(item => 
        item.getAttribute('data-tui-selectbox-value') || ''
      );
      if (hiddenInput) hiddenInput.value = values.join(',');
    } else {
      // Single selection
      const selectedItem = selectedItems[0];
      const text = selectedItem.querySelector('.select-item-text')?.textContent || '';
      valueEl.textContent = text;
      
      if (hiddenInput) {
        hiddenInput.value = selectedItem.getAttribute('data-tui-selectbox-value') || '';
      }
    }

    updateTriggerClearState(trigger);
  }
  
  function normalizeSearchValue(value) {
    return (value || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function fuzzyMatch(searchTerm, candidate) {
    const needle = normalizeSearchValue(searchTerm).replace(/\s+/g, '');
    const haystack = normalizeSearchValue(candidate).replace(/\s+/g, '');

    if (!needle) return true;
    if (!haystack) return false;
    if (haystack.includes(needle)) return true;

    let needleIndex = 0;

    for (let i = 0; i < haystack.length && needleIndex < needle.length; i += 1) {
      if (haystack[i] === needle[needleIndex]) {
        needleIndex += 1;
      }
    }

    return needleIndex === needle.length;
  }

  // Helper to filter items based on search
  function filterItems(searchInput) {
    const searchTerm = normalizeSearchValue(searchInput.value);
    const content = searchInput.closest('[data-tui-selectbox-content]');
    if (!content) return;
    
    content.querySelectorAll('.select-item').forEach(item => {
      const text = normalizeSearchValue(item.querySelector('.select-item-text')?.textContent);
      const value = normalizeSearchValue(item.getAttribute('data-tui-selectbox-value'));
      const visible = !searchTerm || fuzzyMatch(searchTerm, text) || fuzzyMatch(searchTerm, value);
      item.style.display = visible ? '' : 'none';
    });
  }
  
  // Helper to select/deselect item
  function toggleItem(item) {
    if (item.getAttribute('data-tui-selectbox-disabled') === 'true') return;
    
    const content = item.closest('[data-tui-selectbox-content]');
    const trigger = getTriggerFromContainer(getContainer(item));
    if (!trigger) return;
    
    const isMultiple = trigger.getAttribute('data-tui-selectbox-multiple') === 'true';
    const isSelected = item.getAttribute('data-tui-selectbox-selected') === 'true';
    
    if (!isMultiple) {
      // Single selection - deselect all others
      content.querySelectorAll('.select-item').forEach(el => {
        el.setAttribute('data-tui-selectbox-selected', 'false');
      });
    }
    
    // Toggle this item
    item.setAttribute('data-tui-selectbox-selected', (!isSelected).toString());
    
    // Update display
    updateDisplayValue(trigger);
    
    // Trigger change event
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Close on single selection
    if (!isMultiple) {
      closePopover(trigger);
      setTimeout(() => trigger.focus(), 50);
    }
  }
  
  // Initialize display values for existing selectboxes
  function initializeDisplayValues() {
    document.querySelectorAll('.select-container').forEach(container => {
      const trigger = container.querySelector('button.select-trigger');
      if (trigger) {
        updateDisplayValue(trigger);
      }
    });
  }
  
  // Handle clear in capture phase so trigger popover doesn't open.
  document.addEventListener('pointerdown', (e) => {
    const clearTrigger = e.target.closest('[data-tui-selectbox-clear-trigger]');
    if (!clearTrigger) return;
    e.preventDefault();
    e.stopPropagation();
    const trigger = clearTrigger.closest('button.select-trigger');
    if (trigger) {
      // The clear icon may disappear before click fires; suppress that next click.
      trigger.setAttribute('data-tui-selectbox-suppress-click', 'true');
      clearFromTrigger(trigger);
    }
  }, true);

  // Block follow-up click event after clear so trigger/popover handlers don't run.
  document.addEventListener('click', (e) => {
    const clearTrigger = e.target.closest('[data-tui-selectbox-clear-trigger]');
    const trigger = e.target.closest('button.select-trigger');

    if (clearTrigger) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (trigger?.getAttribute('data-tui-selectbox-suppress-click') === 'true') {
      trigger.removeAttribute('data-tui-selectbox-suppress-click');
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Global click handler using Event Delegation
  document.addEventListener('click', (e) => {
    // Handle pill remove clicks
    if (e.target.matches('[data-tui-selectbox-pill-remove]')) {
      e.stopPropagation();
      const value = e.target.getAttribute('data-tui-selectbox-value');
      const trigger = e.target.closest('button.select-trigger');
      const content = trigger ? getContentFromTrigger(trigger) : null;
      const item = content?.querySelector(`.select-item[data-tui-selectbox-value="${value}"]`);
      if (item) toggleItem(item);
      return;
    }
    
    // Handle item clicks
    const item = e.target.closest('.select-item');
    if (item) {
      e.preventDefault();
      toggleItem(item);
      return;
    }
    
    // Focus search when trigger clicked
    const trigger = e.target.closest('button.select-trigger');
    if (trigger) {
      const content = getContentFromTrigger(trigger);
      syncContentWidth(trigger);
      const searchInput = content?.querySelector('[data-tui-selectbox-search]');
      if (searchInput) {
        requestAnimationFrame(() => {
          if (content?.matches(':popover-open')) searchInput.focus();
        });
      } else {
        requestAnimationFrame(() => {
          const firstItem = content?.querySelector('.select-item');
          if (firstItem) firstItem.focus();
        });
      }
    }
  });
  
  // Global input handler for search and value changes
  document.addEventListener('input', (e) => {
    // Handle search input
    if (e.target.matches('[data-tui-selectbox-search]')) {
      filterItems(e.target);
      return;
    }
    
    // Handle hidden input value changes (for reactive frameworks)
    if (e.target.matches('[data-tui-selectbox-hidden-input]')) {
      const trigger = e.target.closest('.select-trigger');
      if (trigger) {
        syncSelectionsFromValue(trigger);
        updateDisplayValue(trigger);
      }
    }
  });
  
  // Global keydown handler
  document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    
    // Handle typing on trigger to open and search
    if (activeElement?.matches('button.select-trigger')) {
      if (e.key.length === 1 || e.key === 'Backspace') {
        e.preventDefault();
        const content = getContentFromTrigger(activeElement);
        activeElement.click(); // Open popover
        
        setTimeout(() => {
          const searchInput = content?.querySelector('[data-tui-selectbox-search]');
          if (searchInput) {
            searchInput.focus();
            if (e.key !== 'Backspace') searchInput.value = e.key;
          }
        }, 50);
      }
    }
    
    // Handle arrow navigation in content
    const content = activeElement?.closest('[data-tui-selectbox-content]');
    if (content?.querySelector('.select-item')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        const visibleItems = Array.from(content.querySelectorAll('.select-item'))
          .filter(item => item.style.display !== 'none');
        
        if (visibleItems.length === 0) return;
        
        const currentFocused = content.querySelector('.select-item:focus');
        let nextIndex = 0;
        
        if (currentFocused) {
          const currentIndex = visibleItems.indexOf(currentFocused);
          nextIndex = e.key === 'ArrowDown' 
            ? (currentIndex + 1) % visibleItems.length
            : (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        }
        
        visibleItems[nextIndex].focus();
      } else if (e.key === 'Enter' && activeElement?.matches('.select-item')) {
        e.preventDefault();
        toggleItem(activeElement);
      } else if (e.key === 'Escape') {
        const searchInput = content.querySelector('[data-tui-selectbox-search]');
        if (activeElement?.matches('.select-item')) {
          searchInput?.focus();
        } else if (activeElement === searchInput) {
          const trigger = getTriggerFromContainer(getContainer(content));
          if (trigger) {
            closePopover(trigger);
          }
          setTimeout(() => trigger?.focus(), 50);
        }
      }
    }
  });
  
  // Global form reset handler
  document.addEventListener('reset', (e) => {
    if (!e.target.matches('form')) return;
    
    e.target.querySelectorAll('.select-container').forEach(wrapper => {
      const trigger = wrapper.querySelector('button.select-trigger');
      const content = trigger ? getContentFromTrigger(trigger) : null;
      
      if (content) {
        // Clear selections
        content.querySelectorAll('.select-item').forEach(item => {
          item.setAttribute('data-tui-selectbox-selected', 'false');
        });
        
        // Clear search
        const searchInput = content.querySelector('[data-tui-selectbox-search]');
        if (searchInput) {
          searchInput.value = '';
          filterItems(searchInput);
        }
      }
      
      if (trigger) updateDisplayValue(trigger);
    });
  });
  
  // Initialize selectboxes on DOM ready and handle dynamic content
  function initializeSelectBoxes() {
    document.querySelectorAll('.select-container').forEach(container => {
      const trigger = container.querySelector('button.select-trigger');
      if (trigger && !trigger.hasAttribute('data-initialized')) {
        trigger.setAttribute('data-initialized', 'true');
        
        // Enable reactive binding for hidden input
        const hiddenInput = trigger.querySelector('input[type="hidden"]');
        if (hiddenInput) {
          enableReactiveBinding(hiddenInput);
        }
        
        updateDisplayValue(trigger);
      }
    });
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSelectBoxes);
  } else {
    initializeSelectBoxes();
  }
  
  // Simple MutationObserver just for initialization
  new MutationObserver(initializeSelectBoxes).observe(document.body, { childList: true, subtree: true });
})();
