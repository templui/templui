(function () {
  'use strict';
  
  // Update value display elements
  document.addEventListener('input', (e) => {
    const slider = e.target.closest('input[type="range"][data-tui-slider-input]');
    if (!slider || !slider.id) return;
    
    document.querySelectorAll(`[data-tui-slider-value][data-tui-slider-value-for="${slider.id}"]`).forEach(el => {
      el.textContent = slider.value;
    });
  });
  
  // MutationObserver for initial value setup
  new MutationObserver(() => {
    document.querySelectorAll('input[type="range"][data-tui-slider-input]').forEach(slider => {
      if (!slider.id) return;
      
      document.querySelectorAll(`[data-tui-slider-value][data-tui-slider-value-for="${slider.id}"]`).forEach(el => {
        if (!el.textContent || el.textContent === '') {
          el.textContent = slider.value;
        }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();