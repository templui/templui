(function () {
  'use strict';
  
  function updateLabelStyle(label) {
    const forId = label.getAttribute('for');
    const targetElement = forId ? document.getElementById(forId) : null;
    const disabledStyle = label.getAttribute('data-tui-label-disabled-style');
    
    if (!targetElement || !disabledStyle) return;
    
    const classes = disabledStyle.split(' ').filter(Boolean);
    
    if (targetElement.disabled) {
      label.classList.add(...classes);
    } else {
      label.classList.remove(...classes);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const labelsToObserve = new Set();
    
    // Find all labels and their targets
    function setupLabels() {
      document.querySelectorAll('label[for][data-tui-label-disabled-style]').forEach(label => {
        updateLabelStyle(label);
        const forId = label.getAttribute('for');
        if (forId) labelsToObserve.add(forId);
      });
    }
    
    setupLabels();
    
    // Observe disabled changes on any element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'disabled' && 
            mutation.target.id && 
            labelsToObserve.has(mutation.target.id)) {
          document.querySelectorAll(`label[for="${mutation.target.id}"][data-tui-label-disabled-style]`).forEach(updateLabelStyle);
        }
      });
    });
    
    // Observe the whole document for disabled changes
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['disabled'],
      subtree: true 
    });
    
    // Watch for new labels
    new MutationObserver(() => {
      setupLabels();
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
