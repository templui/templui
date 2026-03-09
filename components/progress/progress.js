(function () {
  'use strict';
  
  function updateProgress(progressBar) {
    const indicator = progressBar.querySelector('[data-tui-progress-indicator]');
    if (!indicator) return;
    
    const value = parseFloat(progressBar.getAttribute('aria-valuenow') || '0');
    const max = parseFloat(progressBar.getAttribute('aria-valuemax') || '100') || 100;
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    
    indicator.style.width = percentage + '%';
  }
  
  // Update all progress bars
  function updateAll() {
    document.querySelectorAll('[role="progressbar"]').forEach(updateProgress);
  }
  
  // Initial update and observe for changes
  document.addEventListener('DOMContentLoaded', () => {
    updateAll();
    
    // Observe for attribute changes on progress bars
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'aria-valuenow' || 
             mutation.attributeName === 'aria-valuemax')) {
          updateProgress(mutation.target);
        }
      });
    });
    
    // Observe all current and future progress bars
    new MutationObserver(() => {
      document.querySelectorAll('[role="progressbar"]').forEach((bar) => {
        if (!bar.hasAttribute('data-tui-progress-observed')) {
          bar.setAttribute('data-tui-progress-observed', 'true');
          updateProgress(bar);
          observer.observe(bar, { 
            attributes: true, 
            attributeFilter: ['aria-valuenow', 'aria-valuemax'] 
          });
        }
      });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
