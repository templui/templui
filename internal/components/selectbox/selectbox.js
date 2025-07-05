(function () {
  'use strict';
  
  // Instance storage using WeakMap for automatic garbage collection
  const instances = new WeakMap();
  
  // SelectBox class for encapsulation
  class SelectBox {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...SelectBox.defaults, ...options };
      this.state = {
        isSelecting: false,
        selectedValues: new Set()
      };
      this.listeners = new Map();
      
      this.init();
    }
    
    static defaults = {
      multiple: false,
      showPills: false,
      searchable: true,
      closeOnSelect: true,
      selectedCountText: '{n} items selected'
    };
    
    init() {
      // Mark as initialized
      this.element.setAttribute('data-initialized', 'true');
      
      // Find elements
      this.triggerButton = this.element.querySelector('button.select-trigger');
      if (!this.triggerButton) {
        console.error('SelectBox: Trigger button not found', this.element);
        return;
      }
      
      const contentID = this.triggerButton.dataset.contentId;
      this.content = contentID ? document.getElementById(contentID) : null;
      this.valueEl = this.triggerButton.querySelector('.select-value');
      this.hiddenInput = this.triggerButton.querySelector('input[type="hidden"]');
      
      if (!this.content || !this.valueEl || !this.hiddenInput) {
        console.error('SelectBox: Missing required elements', {
          contentExists: !!this.content,
          valueElExists: !!this.valueEl,
          hiddenInputExists: !!this.hiddenInput
        });
        return;
      }
      
      // Store placeholder
      this.placeholder = this.valueEl.getAttribute('data-placeholder') || this.valueEl.textContent || '';
      this.valueEl.setAttribute('data-placeholder', this.placeholder);
      
      // Parse options from data attributes
      this.options.multiple = this.triggerButton.dataset.multiple === 'true';
      this.options.showPills = this.triggerButton.dataset.showPills === 'true';
      if (this.triggerButton.dataset.selectedCountText) {
        this.options.selectedCountText = this.triggerButton.dataset.selectedCountText;
      }
      
      // Initialize state from pre-selected items
      this.initializeSelection();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Setup reset functionality
      this.setupResetFunctionality();
      
      // Dispatch init event
      this.element.dispatchEvent(new CustomEvent('selectbox:init', {
        detail: { instance: this },
        bubbles: true
      }));
    }
    
    initializeSelection() {
      const selectedItems = this.content.querySelectorAll('.select-item[data-selected="true"]');
      selectedItems.forEach(item => {
        const value = item.getAttribute('data-value');
        if (value) {
          this.state.selectedValues.add(value);
        }
      });
      
      if (selectedItems.length > 0) {
        this.updateDisplay();
        this.updateHiddenInput();
      }
    }
    
    setupEventHandlers() {
      // Keyboard navigation on trigger
      this.addEventListener(this.triggerButton, 'keydown', (e) => {
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.content.click();
          setTimeout(() => {
            const searchInput = this.content.querySelector('[data-select-search]');
            if (searchInput) {
              searchInput.focus();
              if (e.key !== 'Backspace' && e.key !== 'Delete') {
                searchInput.value = e.key;
              }
            }
          }, 0);
        }
      });
      
      // Search functionality
      const searchInput = this.content.querySelector('[data-select-search]');
      if (searchInput) {
        this.setupSearch(searchInput);
      }
      
      // Keyboard navigation in content
      this.addEventListener(this.content, 'keydown', (e) => this.handleContentKeydown(e));
      
      // Item selection - use event delegation to handle clicks after DOM moves
      const handleItemClick = (e) => {
        // Check if the click is within our content element
        if (!this.content.contains(e.target)) return;
        
        const item = e.target.closest('.select-item');
        if (item && item.getAttribute('data-disabled') !== 'true') {
          this.selectItem(item);
        }
      };
      
      // Use document-level event delegation
      document.addEventListener('click', handleItemClick);
      // Store handler for cleanup
      this.itemClickHandler = handleItemClick;
      
      // Hover effects
      this.addEventListener(this.content, 'mouseover', (e) => {
        const item = e.target.closest('.select-item');
        if (item && item.getAttribute('data-disabled') !== 'true') {
          this.highlightItem(item);
        }
      });
      
      this.addEventListener(this.content, 'mouseleave', () => {
        this.resetItemStyles();
      });
    }
    
    setupSearch(searchInput) {
      // Focus when popover opens
      const observer = new MutationObserver(() => {
        const style = window.getComputedStyle(this.content);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          searchInput.focus();
        }
      });
      
      observer.observe(this.content, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      // Search functionality
      this.addEventListener(searchInput, 'input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const items = this.content.querySelectorAll('.select-item');
        
        items.forEach(item => {
          const itemText = item.querySelector('.select-item-text')?.textContent.toLowerCase() || '';
          const itemValue = item.getAttribute('data-value')?.toLowerCase() || '';
          const isVisible = searchTerm === '' || itemText.includes(searchTerm) || itemValue.includes(searchTerm);
          
          item.style.display = isVisible ? '' : 'none';
        });
      });
    }
    
    setupResetFunctionality() {
      // Check if internal reset button should be shown
      const showReset = this.element.hasAttribute('data-show-reset') || 
                       this.triggerButton.hasAttribute('data-show-reset');
      
      if (showReset) {
        this.addInternalResetButton();
      }
      
      // Setup external reset triggers with event delegation
      // Store the handler so we can remove it later
      this.externalResetHandler = (e) => {
        const resetTrigger = e.target.closest('[data-selectbox-reset]');
        if (resetTrigger) {
          const selector = resetTrigger.getAttribute('data-selectbox-reset');
          if (selector && (this.element.matches(selector) || this.element.id === selector.replace('#', ''))) {
            e.preventDefault();
            this.reset();
          }
        }
      };
      
      // Only add the listener once per instance
      document.addEventListener('click', this.externalResetHandler);
    }
    
    addInternalResetButton() {
      // Create reset button container
      const resetContainer = document.createElement('span');
      resetContainer.className = 'select-reset-container ml-1';
      resetContainer.style.display = 'none';
      
      // Create reset button
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'select-reset-button p-1 hover:text-destructive transition-colors';
      resetButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      resetButton.setAttribute('aria-label', 'Clear selection');
      
      resetContainer.appendChild(resetButton);
      
      // Insert before chevron
      const chevron = this.triggerButton.querySelector('.pointer-events-none');
      if (chevron) {
        chevron.parentNode.insertBefore(resetContainer, chevron);
      }
      
      // Handle reset click
      this.addEventListener(resetButton, 'click', (e) => {
        e.stopPropagation();
        this.reset();
      });
      
      this.resetContainer = resetContainer;
      this.updateResetButtonVisibility();
    }
    
    updateResetButtonVisibility() {
      if (this.resetContainer) {
        const hasSelection = this.state.selectedValues.size > 0;
        this.resetContainer.style.display = hasSelection ? '' : 'none';
      }
    }
    
    handleContentKeydown(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const visibleItems = Array.from(this.content.querySelectorAll('.select-item'))
          .filter(item => item.style.display !== 'none');
        
        if (visibleItems.length === 0) return;
        
        const currentFocused = this.content.querySelector('.select-item:focus');
        let nextIndex = 0;
        
        if (currentFocused) {
          const currentIndex = visibleItems.indexOf(currentFocused);
          if (e.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % visibleItems.length;
          } else {
            nextIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
          }
        }
        
        visibleItems[nextIndex].focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const focusedItem = this.content.querySelector('.select-item:focus');
        if (focusedItem) {
          this.selectItem(focusedItem);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const searchInput = this.content.querySelector('[data-select-search]');
        const focusedItem = this.content.querySelector('.select-item:focus');
        
        if (focusedItem && searchInput) {
          searchInput.focus();
        } else if (document.activeElement === searchInput) {
          if (window.closePopover) {
            window.closePopover(this.content.id, true);
            setTimeout(() => this.triggerButton.focus(), 50);
          }
        }
      }
    }
    
    selectItem(item) {
      if (this.state.isSelecting) return;
      
      this.state.isSelecting = true;
      
      const value = item.getAttribute('data-value');
      const previousValues = new Set(this.state.selectedValues);
      
      if (this.options.multiple) {
        // Toggle selection
        if (this.state.selectedValues.has(value)) {
          this.state.selectedValues.delete(value);
          item.setAttribute('data-selected', 'false');
          this.updateItemVisual(item, false);
        } else {
          this.state.selectedValues.add(value);
          item.setAttribute('data-selected', 'true');
          this.updateItemVisual(item, true);
        }
      } else {
        // Single selection - clear others first
        this.content.querySelectorAll('.select-item').forEach(el => {
          el.setAttribute('data-selected', 'false');
          this.updateItemVisual(el, false);
        });
        
        this.state.selectedValues.clear();
        this.state.selectedValues.add(value);
        item.setAttribute('data-selected', 'true');
        this.updateItemVisual(item, true);
        
        // Close popover for single selection
        if (this.options.closeOnSelect && window.closePopover) {
          window.closePopover(this.content.id, true);
          setTimeout(() => this.triggerButton.focus(), 50);
        }
      }
      
      this.updateDisplay();
      this.updateHiddenInput();
      this.updateResetButtonVisibility();
      
      // Dispatch change event
      this.element.dispatchEvent(new CustomEvent('selectbox:change', {
        detail: { 
          value: this.getValue(),
          previousValue: Array.from(previousValues),
          item: item
        },
        bubbles: true
      }));
      
      setTimeout(() => {
        this.state.isSelecting = false;
      }, 100);
    }
    
    updateItemVisual(item, selected) {
      const check = item.querySelector('.select-check');
      
      if (selected) {
        item.classList.add('bg-accent', 'text-accent-foreground');
        if (check) check.classList.replace('opacity-0', 'opacity-100');
      } else {
        item.classList.remove('bg-accent', 'text-accent-foreground');
        if (check) check.classList.replace('opacity-100', 'opacity-0');
      }
    }
    
    highlightItem(item) {
      this.content.querySelectorAll('.select-item').forEach(el => {
        if (el !== item) {
          el.classList.remove('bg-accent', 'text-accent-foreground', 'bg-muted');
        }
      });
      
      if (item.getAttribute('data-selected') !== 'true') {
        item.classList.add('bg-accent', 'text-accent-foreground');
      }
    }
    
    resetItemStyles() {
      this.content.querySelectorAll('.select-item').forEach(item => {
        if (item.getAttribute('data-selected') === 'true') {
          item.classList.add('bg-accent', 'text-accent-foreground');
          item.classList.remove('bg-muted');
        } else {
          item.classList.remove('bg-accent', 'text-accent-foreground', 'bg-muted');
        }
      });
    }
    
    updateDisplay() {
      const selectedItems = Array.from(this.content.querySelectorAll('.select-item[data-selected="true"]'));
      
      if (selectedItems.length === 0) {
        this.valueEl.textContent = this.placeholder;
        this.valueEl.classList.add('text-muted-foreground');
        return;
      }
      
      this.valueEl.classList.remove('text-muted-foreground');
      
      if (this.options.multiple) {
        if (this.options.showPills) {
          this.renderPills(selectedItems);
        } else {
          const text = this.options.selectedCountText.replace('{n}', selectedItems.length);
          this.valueEl.textContent = text;
        }
      } else {
        const selectedItem = selectedItems[0];
        const itemText = selectedItem.querySelector('.select-item-text');
        if (itemText) {
          this.valueEl.textContent = itemText.textContent;
        }
      }
    }
    
    renderPills(selectedItems) {
      this.valueEl.innerHTML = '';
      
      const pillsContainer = document.createElement('div');
      pillsContainer.className = 'flex flex-nowrap overflow-hidden max-w-full whitespace-nowrap gap-1';
      
      selectedItems.forEach(item => {
        const pill = document.createElement('div');
        pill.className = 'flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground';
        
        const pillText = document.createElement('span');
        pillText.textContent = item.querySelector('.select-item-text').textContent;
        
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'hover:text-destructive focus:outline-none';
        closeButton.innerHTML = '×';
        closeButton.onclick = (e) => {
          e.stopPropagation();
          this.selectItem(item);
        };
        
        pill.appendChild(pillText);
        pill.appendChild(closeButton);
        pillsContainer.appendChild(pill);
      });
      
      this.valueEl.appendChild(pillsContainer);
      
      // Check for overflow
      setTimeout(() => {
        const pillsWidth = pillsContainer.scrollWidth;
        const valueWidth = this.valueEl.clientWidth;
        if (pillsWidth > valueWidth) {
          const text = this.options.selectedCountText.replace('{n}', selectedItems.length);
          this.valueEl.textContent = text;
        }
      }, 0);
    }
    
    updateHiddenInput() {
      const values = Array.from(this.state.selectedValues);
      const oldValue = this.hiddenInput.value;
      const newValue = values.join(',');
      
      this.hiddenInput.value = newValue;
      
      if (oldValue !== newValue) {
        this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    
    // Public API methods
    getValue() {
      if (this.options.multiple) {
        return Array.from(this.state.selectedValues);
      }
      return this.state.selectedValues.size > 0 ? 
        Array.from(this.state.selectedValues)[0] : null;
    }
    
    setValue(value) {
      const previousValues = new Set(this.state.selectedValues);
      
      // Clear current selection
      this.state.selectedValues.clear();
      this.content.querySelectorAll('.select-item').forEach(item => {
        item.setAttribute('data-selected', 'false');
        this.updateItemVisual(item, false);
      });
      
      // Set new value(s)
      const values = Array.isArray(value) ? value : [value];
      values.forEach(val => {
        if (val !== null && val !== undefined) {
          const item = this.content.querySelector(`.select-item[data-value="${val}"]`);
          if (item) {
            this.state.selectedValues.add(val);
            item.setAttribute('data-selected', 'true');
            this.updateItemVisual(item, true);
          }
        }
      });
      
      this.updateDisplay();
      this.updateHiddenInput();
      this.updateResetButtonVisibility();
      
      // Dispatch change event
      this.element.dispatchEvent(new CustomEvent('selectbox:change', {
        detail: { 
          value: this.getValue(),
          previousValue: Array.from(previousValues)
        },
        bubbles: true
      }));
    }
    
    reset() {
      const previousValues = new Set(this.state.selectedValues);
      
      // Clear selection
      this.state.selectedValues.clear();
      this.content.querySelectorAll('.select-item').forEach(item => {
        item.setAttribute('data-selected', 'false');
        this.updateItemVisual(item, false);
      });
      
      // Reset display
      this.valueEl.textContent = this.placeholder;
      this.valueEl.classList.add('text-muted-foreground');
      
      // Clear hidden input
      this.hiddenInput.value = '';
      this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Update reset button visibility
      this.updateResetButtonVisibility();
      
      // Clear search if exists
      const searchInput = this.content.querySelector('[data-select-search]');
      if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Dispatch reset event
      this.element.dispatchEvent(new CustomEvent('selectbox:reset', {
        detail: { previousValue: Array.from(previousValues) },
        bubbles: true
      }));
    }
    
    enable() {
      this.triggerButton.disabled = false;
      this.element.classList.remove('opacity-50');
    }
    
    disable() {
      this.triggerButton.disabled = true;
      this.element.classList.add('opacity-50');
    }
    
    destroy() {
      // Remove event listeners
      this.listeners.forEach((handler, key) => {
        key.element.removeEventListener(key.event, handler);
      });
      this.listeners.clear();
      
      // Remove document-level item click handler
      if (this.itemClickHandler) {
        document.removeEventListener('click', this.itemClickHandler);
      }
      
      // Remove external reset handler if it exists
      if (this.externalResetHandler) {
        document.removeEventListener('click', this.externalResetHandler);
      }
      
      // Clean up state
      this.element.removeAttribute('data-initialized');
      
      // Remove instance
      instances.delete(this.element);
      
      // Dispatch destroy event
      this.element.dispatchEvent(new CustomEvent('selectbox:destroy', {
        detail: { instance: this },
        bubbles: true
      }));
    }
    
    // Helper for managed event listeners
    addEventListener(element, event, handler) {
      element.addEventListener(event, handler);
      // Store both element and event for proper cleanup
      const key = { element, event };
      this.listeners.set(key, handler);
    }
  }
  
  // Public API
  window.templUI = window.templUI || {};
  window.templUI.selectbox = {
    // Get instance by element or selector
    getInstance(selector) {
      const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
      return element ? instances.get(element) : null;
    },
    
    // Initialize components
    init(selector = '.select-container') {
      const elements = typeof selector === 'string'
        ? document.querySelectorAll(selector)
        : [selector];
        
      elements.forEach(element => {
        if (!instances.has(element)) {
          instances.set(element, new SelectBox(element));
        }
      });
    },
    
    // Destroy instances
    destroy(selector) {
      if (selector) {
        const instance = this.getInstance(selector);
        instance?.destroy();
      } else {
        // Destroy all instances
        instances.forEach(instance => instance.destroy());
      }
    },
    
    // Convenience methods
    getValue(selector) {
      const instance = this.getInstance(selector);
      return instance?.getValue();
    },
    
    setValue(selector, value) {
      const instance = this.getInstance(selector);
      return instance?.setValue(value);
    },
    
    reset(selector) {
      const instance = this.getInstance(selector);
      return instance?.reset();
    },
    
    enable(selector) {
      const instance = this.getInstance(selector);
      return instance?.enable();
    },
    
    disable(selector) {
      const instance = this.getInstance(selector);
      return instance?.disable();
    }
  };
  
  // Auto-initialization
  document.addEventListener('DOMContentLoaded', () => {
    window.templUI.selectbox.init();
  });
})();