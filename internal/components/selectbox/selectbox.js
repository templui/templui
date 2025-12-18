(function () {
  'use strict';
  
  // Helper to sync selections from hidden input value
  function syncSelectionsFromValue(trigger) {
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    const contentId = trigger.getAttribute('data-tui-selectbox-content-id');
    const content = document.getElementById(contentId);
    
    if (!hiddenInput || !content) return;
    
    const isMultiple = trigger.getAttribute('data-tui-selectbox-multiple') === 'true';
    const values = hiddenInput.value ? (isMultiple ? hiddenInput.value.split(',') : [hiddenInput.value]) : [];
    
    content.querySelectorAll('.select-item').forEach(item => {
      const itemValue = item.getAttribute('data-tui-selectbox-value') || '';
      const shouldBeSelected = values.includes(itemValue);
      const isSelected = item.getAttribute('data-tui-selectbox-selected') === 'true';
      
      if (shouldBeSelected !== isSelected) {
        item.setAttribute('data-tui-selectbox-selected', shouldBeSelected.toString());
        if (shouldBeSelected) {
          item.classList.add('bg-accent', 'text-accent-foreground');
          const check = item.querySelector('.select-check');
          if (check) check.classList.replace('opacity-0', 'opacity-100');
        } else {
          item.classList.remove('bg-accent', 'text-accent-foreground');
          const check = item.querySelector('.select-check');
          if (check) check.classList.replace('opacity-100', 'opacity-0');
        }
      }
    });
  }
  
  // Helper to update display value
  function updateDisplayValue(trigger) {
    const valueEl = trigger.querySelector('.select-value');
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    const contentId = trigger.getAttribute('data-tui-selectbox-content-id');
    const content = document.getElementById(contentId);
    
    // If no content yet (not opened), try to init from hidden input value
    if (!content && hiddenInput && hiddenInput.value) {
      valueEl.textContent = hiddenInput.value; // Simple fallback
      valueEl.classList.remove('text-muted-foreground');
      return;
    }
    
    if (!valueEl || !content) return;
    
    const isMultiple = trigger.getAttribute('data-tui-selectbox-multiple') === 'true';
    const showPills = trigger.getAttribute('data-tui-selectbox-show-pills') === 'true';
    const placeholder = valueEl.getAttribute('data-tui-selectbox-placeholder') || 'Select...';
    
    const selectedItems = content.querySelectorAll('.select-item[data-tui-selectbox-selected="true"]');
    
    if (selectedItems.length === 0) {
      valueEl.textContent = placeholder;
      valueEl.classList.add('text-muted-foreground');
      if (hiddenInput) hiddenInput.value = '';
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
  }
  
  // Helper to filter items based on search
  function filterItems(searchInput) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const content = searchInput.closest('[data-tui-popover-id]');
    if (!content) return;
    
    content.querySelectorAll('.select-item').forEach(item => {
      const text = item.querySelector('.select-item-text')?.textContent.toLowerCase() || '';
      const value = item.getAttribute('data-tui-selectbox-value')?.toLowerCase() || '';
      const visible = !searchTerm || text.includes(searchTerm) || value.includes(searchTerm);
      item.style.display = visible ? '' : 'none';
    });
  }
  
  // Helper to select/deselect item
  function toggleItem(item) {
    if (item.getAttribute('data-tui-selectbox-disabled') === 'true') return;
    
    const content = item.closest('[data-tui-popover-id]');
    const contentId = content?.id;
    const trigger = document.querySelector(`[data-tui-selectbox-content-id="${contentId}"]`);
    if (!trigger) return;
    
    const isMultiple = trigger.getAttribute('data-tui-selectbox-multiple') === 'true';
    const isSelected = item.getAttribute('data-tui-selectbox-selected') === 'true';
    
    if (!isMultiple) {
      // Single selection - deselect all others
      content.querySelectorAll('.select-item').forEach(el => {
        el.setAttribute('data-tui-selectbox-selected', 'false');
        el.classList.remove('bg-accent', 'text-accent-foreground');
        const check = el.querySelector('.select-check');
        if (check) check.classList.replace('opacity-100', 'opacity-0');
      });
    }
    
    // Toggle this item
    item.setAttribute('data-tui-selectbox-selected', (!isSelected).toString());
    
    if (!isSelected) {
      item.classList.add('bg-accent', 'text-accent-foreground');
      const check = item.querySelector('.select-check');
      if (check) check.classList.replace('opacity-0', 'opacity-100');
    } else {
      item.classList.remove('bg-accent', 'text-accent-foreground');
      const check = item.querySelector('.select-check');
      if (check) check.classList.replace('opacity-100', 'opacity-0');
    }
    
    // Update display
    updateDisplayValue(trigger);
    
    // Trigger change event
    const hiddenInput = trigger.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Close on single selection
    if (!isMultiple && window.closePopover) {
      window.closePopover(contentId);
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
  
  // Global click handler using Event Delegation
  document.addEventListener('click', (e) => {
    // Handle pill remove clicks
    if (e.target.matches('[data-tui-selectbox-pill-remove]')) {
      e.stopPropagation();
      const value = e.target.getAttribute('data-tui-selectbox-value');
      const trigger = e.target.closest('button.select-trigger');
      const contentId = trigger?.getAttribute('data-tui-selectbox-content-id');
      const content = document.getElementById(contentId);
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
      const contentId = trigger.getAttribute('data-tui-selectbox-content-id');
      const content = document.getElementById(contentId);
      const searchInput = content?.querySelector('[data-tui-selectbox-search]');
      if (searchInput) {
        setTimeout(() => {
          if (content.style.display !== 'none') searchInput.focus();
        }, 50);
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
    if (e.target.matches('.select-trigger input[type="hidden"]')) {
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
        const contentId = activeElement.getAttribute('data-tui-selectbox-content-id');
        activeElement.click(); // Open popover
        
        setTimeout(() => {
          const searchInput = document.getElementById(contentId)?.querySelector('[data-tui-selectbox-search]');
          if (searchInput) {
            searchInput.focus();
            if (e.key !== 'Backspace') searchInput.value = e.key;
          }
        }, 50);
      }
    }
    
    // Handle arrow navigation in content
    const content = activeElement?.closest('[data-tui-popover-id]');
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
        } else if (activeElement === searchInput && window.closePopover) {
          window.closePopover(content.id);
          const trigger = document.querySelector(`[data-tui-selectbox-content-id="${content.id}"]`);
          setTimeout(() => trigger?.focus(), 50);
        }
      }
    }
  });
  
  // Global mouseover handler for hover effects
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.select-item');
    if (!item || item.getAttribute('data-tui-selectbox-disabled') === 'true') return;
    
    const content = item.closest('[data-tui-popover-id]');
    if (!content) return;
    
    // Reset all items
    content.querySelectorAll('.select-item').forEach(el => {
      if (el.getAttribute('data-tui-selectbox-selected') !== 'true') {
        el.classList.remove('bg-accent', 'text-accent-foreground');
      }
    });
    
    // Highlight hovered item if not selected
    if (item.getAttribute('data-tui-selectbox-selected') !== 'true') {
      item.classList.add('bg-accent', 'text-accent-foreground');
    }
  });
  
  // Global form reset handler
  document.addEventListener('reset', (e) => {
    if (!e.target.matches('form')) return;
    
    e.target.querySelectorAll('.select-container').forEach(wrapper => {
      const trigger = wrapper.querySelector('button.select-trigger');
      const contentId = trigger?.getAttribute('data-tui-selectbox-content-id');
      const content = document.getElementById(contentId);
      
      if (content) {
        // Clear selections
        content.querySelectorAll('.select-item').forEach(item => {
          item.setAttribute('data-tui-selectbox-selected', 'false');
          item.classList.remove('bg-accent', 'text-accent-foreground');
          const check = item.querySelector('.select-check');
          if (check) check.classList.replace('opacity-100', 'opacity-0');
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
  
  // Enable reactive binding for hidden inputs (for Datastar, Alpine.js, etc.)
  function enableReactiveBinding(hiddenInput) {
    // Prevent double initialization
    if (hiddenInput.hasAttribute('data-tui-reactive-bound')) return;
    hiddenInput.setAttribute('data-tui-reactive-bound', 'true');
    
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!descriptor || !descriptor.set) return;
    
    const originalSet = descriptor.set;
    
    Object.defineProperty(hiddenInput, 'value', {
      get: descriptor.get,
      set: function(newValue) {
        const oldValue = this.value;
        originalSet.call(this, newValue);
        
        // Only update UI if value actually changed (prevents infinite loop)
        if (oldValue !== newValue) {
          const trigger = this.closest('.select-trigger');
          if (trigger) {
            syncSelectionsFromValue(trigger);
            updateDisplayValue(trigger);
          }
        }
      },
      configurable: true
    });
  }
  
  // Initialize selectboxes on DOM ready and handle dynamic content
  function initializeSelectBoxes(mutations) {
    // Ensures display is updated when only selectbox content is Changed in the DOM
    if (mutations) {
      mutations.forEach(mutation => {
        const targetClassList = mutation.target.classList
        const targetId = mutation.target.id

        if (targetClassList.contains('select-content')) {
          const trigger = document.querySelector(`button.select-trigger[data-tui-selectbox-content-id="${targetId}"]`)

          if (trigger) {
            updateDisplayValue(trigger);
          }
        }
      })
    }


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
